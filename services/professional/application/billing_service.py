"""Stripe subscription billing for business tools and corporate networking."""

from __future__ import annotations

from typing import Any
from uuid import UUID, uuid4

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from nexus_common.billing.stripe_billing import (
    BUSINESS_TOOLS_PLAN,
    CORPORATE_NETWORKING_PLAN,
    PLAN_MONTHLY_GBP,
    create_subscription_checkout,
    retrieve_checkout_session,
    verify_webhook_event,
)
from nexus_common.domain.business_tools import BUSINESS_TOOLS_MONTHLY_GBP
from nexus_common.domain.corporate_sectors import CORPORATE_NETWORKING_MONTHLY_GBP
from services.professional.application.dtos import (
    ActivateSubscriptionResponse,
    SubscriptionCheckoutResponse,
)
from services.professional.infrastructure.config import Settings
from services.professional.infrastructure.models import (
    BusinessProfileModel,
    BusinessSubscriptionModel,
    OrgSubscriptionModel,
)


class BillingService:
    def __init__(self, settings: Settings, db: AsyncSession):
        self.settings = settings
        self.db = db

    @property
    def stripe_enabled(self) -> bool:
        return bool(self.settings.stripe_secret_key)

    async def create_business_checkout(
        self,
        user_id: UUID,
        success_url: str,
        cancel_url: str,
        customer_email: str | None = None,
    ) -> SubscriptionCheckoutResponse:
        if not await self._has_business_profile(user_id):
            raise HTTPException(
                status_code=400,
                detail="Create your business page before subscribing to business tools",
            )

        sub = await self._business_subscription(user_id)
        if sub and sub.status == "active":
            raise HTTPException(status_code=400, detail="Business tools subscription already active")

        metadata = {"user_id": str(user_id), "plan": BUSINESS_TOOLS_PLAN}
        result = create_subscription_checkout(
            stripe_secret_key=self.settings.stripe_secret_key,
            price_id=self.settings.stripe_business_price_id,
            plan=BUSINESS_TOOLS_PLAN,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata,
            api_base_url=self.settings.public_api_url,
            customer_email=customer_email,
            stripe_customer_id=sub.stripe_customer_id if sub else None,
        )
        return SubscriptionCheckoutResponse(
            checkout_url=result.checkout_url,
            session_id=result.session_id,
            dev_mode=result.dev_mode,
            plan=BUSINESS_TOOLS_PLAN,
        )

    async def create_corporate_checkout(
        self,
        org_id: UUID,
        user_id: UUID,
        success_url: str,
        cancel_url: str,
        customer_email: str | None = None,
    ) -> SubscriptionCheckoutResponse:
        sub = await self._org_subscription(org_id)
        if sub and sub.status == "active":
            raise HTTPException(status_code=400, detail="Corporate networking subscription already active")

        metadata = {
            "user_id": str(user_id),
            "org_id": str(org_id),
            "plan": CORPORATE_NETWORKING_PLAN,
        }
        result = create_subscription_checkout(
            stripe_secret_key=self.settings.stripe_secret_key,
            price_id=self.settings.stripe_corporate_price_id,
            plan=CORPORATE_NETWORKING_PLAN,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata,
            api_base_url=self.settings.public_api_url,
            customer_email=customer_email,
            stripe_customer_id=sub.stripe_customer_id if sub else None,
        )
        return SubscriptionCheckoutResponse(
            checkout_url=result.checkout_url,
            session_id=result.session_id,
            dev_mode=result.dev_mode,
            plan=CORPORATE_NETWORKING_PLAN,
        )

    async def activate_from_checkout(self, session_id: str) -> ActivateSubscriptionResponse:
        if session_id.startswith("dev_"):
            raise HTTPException(status_code=400, detail="Use activate-dev for development checkout sessions")

        if not self.settings.stripe_secret_key:
            raise HTTPException(status_code=503, detail="Stripe is not configured")

        session = retrieve_checkout_session(self.settings.stripe_secret_key, session_id)
        if session["payment_status"] not in {"paid", "no_payment_required"}:
            raise HTTPException(status_code=400, detail="Checkout session not paid")

        metadata = session.get("metadata") or {}
        plan = metadata.get("plan")
        user_id_raw = metadata.get("user_id")
        org_id_raw = metadata.get("org_id")
        if not plan or not user_id_raw:
            raise HTTPException(status_code=400, detail="Checkout session missing subscription metadata")

        return await self._activate_subscription(
            plan=plan,
            user_id=UUID(user_id_raw),
            org_id=UUID(org_id_raw) if org_id_raw else None,
            stripe_customer_id=session.get("customer"),
            stripe_subscription_id=session.get("subscription"),
        )

    async def activate_dev(
        self,
        plan: str,
        user_id: UUID,
        org_id: UUID | None = None,
    ) -> ActivateSubscriptionResponse:
        if self.stripe_enabled:
            raise HTTPException(status_code=403, detail="Dev activation disabled when Stripe is configured")

        if plan not in PLAN_MONTHLY_GBP:
            raise HTTPException(status_code=400, detail="Invalid subscription plan")

        if plan == BUSINESS_TOOLS_PLAN and not await self._has_business_profile(user_id):
            raise HTTPException(status_code=400, detail="Create your business page before subscribing")

        return await self._activate_subscription(
            plan=plan,
            user_id=user_id,
            org_id=org_id,
            stripe_customer_id=f"dev_cus_{user_id}",
            stripe_subscription_id=f"dev_sub_{plan}_{org_id or user_id}",
        )

    async def handle_webhook(self, payload: bytes, signature: str | None) -> dict[str, str]:
        if not self.settings.stripe_webhook_secret:
            return {"status": "ignored", "reason": "webhook secret not configured"}

        try:
            event = verify_webhook_event(
                payload,
                signature,
                self.settings.stripe_webhook_secret,
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid webhook signature") from exc

        if event is None:
            return {"status": "ignored", "reason": "webhooks disabled"}

        event_type = event["type"]
        data = event["data"]

        if event_type == "checkout.session.completed":
            await self._handle_checkout_completed(data)
            return {"status": "processed", "event": event_type}

        if event_type in {"customer.subscription.updated", "customer.subscription.deleted"}:
            await self._handle_subscription_event(event_type, data)
            return {"status": "processed", "event": event_type}

        return {"status": "ignored", "event": event_type}

    async def _handle_checkout_completed(self, session: Any) -> None:
        metadata = dict(getattr(session, "metadata", None) or {})
        plan = metadata.get("plan")
        user_id_raw = metadata.get("user_id")
        org_id_raw = metadata.get("org_id")
        if not plan or not user_id_raw:
            return

        customer = session.customer
        subscription = session.subscription
        stripe_customer_id = customer if isinstance(customer, str) else getattr(customer, "id", None)
        stripe_subscription_id = (
            subscription if isinstance(subscription, str) else getattr(subscription, "id", None)
        )

        await self._activate_subscription(
            plan=plan,
            user_id=UUID(user_id_raw),
            org_id=UUID(org_id_raw) if org_id_raw else None,
            stripe_customer_id=stripe_customer_id,
            stripe_subscription_id=stripe_subscription_id,
        )

    async def _handle_subscription_event(self, event_type: str, subscription: Any) -> None:
        stripe_subscription_id = getattr(subscription, "id", None)
        if not stripe_subscription_id:
            return

        status = getattr(subscription, "status", None)
        for model, field in (
            (BusinessSubscriptionModel, BusinessSubscriptionModel.stripe_subscription_id),
            (OrgSubscriptionModel, OrgSubscriptionModel.stripe_subscription_id),
        ):
            result = await self.db.execute(select(model).where(field == stripe_subscription_id))
            row = result.scalar_one_or_none()
            if not row:
                continue

            if event_type == "customer.subscription.deleted" or status in {"canceled", "unpaid", "incomplete_expired"}:
                row.status = "expired"
            elif status == "active":
                row.status = "active"
            elif status == "trialing":
                row.status = "trial"
            await self.db.commit()
            return

    async def _activate_subscription(
        self,
        *,
        plan: str,
        user_id: UUID,
        org_id: UUID | None,
        stripe_customer_id: str | None,
        stripe_subscription_id: str | None,
    ) -> ActivateSubscriptionResponse:
        if plan == BUSINESS_TOOLS_PLAN:
            sub = await self._business_subscription(user_id)
            if sub:
                sub.status = "active"
                sub.plan = BUSINESS_TOOLS_PLAN
                sub.monthly_price_gbp = BUSINESS_TOOLS_MONTHLY_GBP
                sub.stripe_customer_id = stripe_customer_id
                sub.stripe_subscription_id = stripe_subscription_id
            else:
                sub = BusinessSubscriptionModel(
                    id=uuid4(),
                    user_id=user_id,
                    plan=BUSINESS_TOOLS_PLAN,
                    status="active",
                    monthly_price_gbp=BUSINESS_TOOLS_MONTHLY_GBP,
                    stripe_customer_id=stripe_customer_id,
                    stripe_subscription_id=stripe_subscription_id,
                )
                self.db.add(sub)
            await self.db.commit()
            return ActivateSubscriptionResponse(
                plan=plan,
                status="active",
                user_id=user_id,
                org_id=None,
                message="Business tools subscription activated",
            )

        if plan == CORPORATE_NETWORKING_PLAN:
            if not org_id:
                raise HTTPException(status_code=400, detail="org_id required for corporate subscription")
            sub = await self._org_subscription(org_id)
            if sub:
                sub.status = "active"
                sub.plan = CORPORATE_NETWORKING_PLAN
                sub.monthly_price_gbp = CORPORATE_NETWORKING_MONTHLY_GBP
                sub.stripe_customer_id = stripe_customer_id
                sub.stripe_subscription_id = stripe_subscription_id
            else:
                sub = OrgSubscriptionModel(
                    id=uuid4(),
                    org_id=org_id,
                    plan=CORPORATE_NETWORKING_PLAN,
                    status="active",
                    monthly_price_gbp=CORPORATE_NETWORKING_MONTHLY_GBP,
                    stripe_customer_id=stripe_customer_id,
                    stripe_subscription_id=stripe_subscription_id,
                )
                self.db.add(sub)
            await self.db.commit()
            return ActivateSubscriptionResponse(
                plan=plan,
                status="active",
                user_id=user_id,
                org_id=org_id,
                message="Corporate networking subscription activated",
            )

        raise HTTPException(status_code=400, detail="Invalid subscription plan")

    async def _has_business_profile(self, user_id: UUID) -> bool:
        result = await self.db.execute(
            select(BusinessProfileModel).where(BusinessProfileModel.user_id == user_id)
        )
        return result.scalar_one_or_none() is not None

    async def _business_subscription(self, user_id: UUID) -> BusinessSubscriptionModel | None:
        result = await self.db.execute(
            select(BusinessSubscriptionModel).where(BusinessSubscriptionModel.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def _org_subscription(self, org_id: UUID) -> OrgSubscriptionModel | None:
        result = await self.db.execute(
            select(OrgSubscriptionModel).where(OrgSubscriptionModel.org_id == org_id)
        )
        return result.scalar_one_or_none()