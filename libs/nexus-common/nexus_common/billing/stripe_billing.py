"""Stripe subscription checkout helpers for NexSocio business and corporate plans."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from urllib.parse import urlencode

BUSINESS_TOOLS_PLAN = "business_tools"
CORPORATE_NETWORKING_PLAN = "corporate_networking"

PLAN_MONTHLY_GBP: dict[str, float] = {
    BUSINESS_TOOLS_PLAN: 19.0,
    CORPORATE_NETWORKING_PLAN: 49.0,
}


@dataclass(frozen=True)
class CheckoutSessionResult:
    checkout_url: str
    session_id: str
    dev_mode: bool


def _dev_checkout_url(
    *,
    api_base_url: str,
    plan: str,
    user_id: str,
    org_id: str | None,
    success_url: str,
) -> CheckoutSessionResult:
    params: dict[str, str] = {
        "plan": plan,
        "user_id": user_id,
        "success_url": success_url,
    }
    if org_id:
        params["org_id"] = org_id
    session_id = f"dev_{plan}_{user_id}"
    if org_id:
        session_id = f"dev_{plan}_{org_id}"
    params["success_url"] = success_url.replace("{CHECKOUT_SESSION_ID}", session_id)
    return CheckoutSessionResult(
        checkout_url=f"{api_base_url.rstrip('/')}/api/v1/billing/activate-dev?{urlencode(params)}",
        session_id=session_id,
        dev_mode=True,
    )


def create_subscription_checkout(
    *,
    stripe_secret_key: str | None,
    price_id: str | None,
    plan: str,
    success_url: str,
    cancel_url: str,
    metadata: dict[str, str],
    api_base_url: str,
    customer_email: str | None = None,
    stripe_customer_id: str | None = None,
) -> CheckoutSessionResult:
    """Create a Stripe Checkout session, or a local dev activation URL when Stripe is not configured."""
    if plan not in PLAN_MONTHLY_GBP:
        raise ValueError(f"Unknown subscription plan: {plan}")

    user_id = metadata.get("user_id", "")
    org_id = metadata.get("org_id")

    if not stripe_secret_key:
        return _dev_checkout_url(
            api_base_url=api_base_url,
            plan=plan,
            user_id=user_id,
            org_id=org_id,
            success_url=success_url,
        )

    if not price_id:
        raise ValueError(f"Stripe price id required for plan {plan}")

    import stripe

    stripe.api_key = stripe_secret_key

    session_params: dict[str, Any] = {
        "mode": "subscription",
        "line_items": [{"price": price_id, "quantity": 1}],
        "success_url": success_url,
        "cancel_url": cancel_url,
        "metadata": {**metadata, "plan": plan},
        "subscription_data": {"metadata": {**metadata, "plan": plan}},
    }
    if stripe_customer_id:
        session_params["customer"] = stripe_customer_id
    elif customer_email:
        session_params["customer_email"] = customer_email

    session = stripe.checkout.Session.create(**session_params)
    checkout_url = session.url
    if not checkout_url:
        raise RuntimeError("Stripe checkout session missing redirect URL")

    return CheckoutSessionResult(
        checkout_url=checkout_url,
        session_id=session.id,
        dev_mode=False,
    )


def retrieve_checkout_session(stripe_secret_key: str, session_id: str) -> dict[str, Any]:
    """Retrieve a completed Stripe Checkout session."""
    import stripe

    stripe.api_key = stripe_secret_key
    session = stripe.checkout.Session.retrieve(session_id, expand=["subscription", "customer"])
    return {
        "id": session.id,
        "payment_status": session.payment_status,
        "status": session.status,
        "customer": session.customer if isinstance(session.customer, str) else getattr(session.customer, "id", None),
        "subscription": (
            session.subscription
            if isinstance(session.subscription, str)
            else getattr(session.subscription, "id", None)
        ),
        "metadata": dict(session.metadata or {}),
    }


def verify_webhook_event(
    payload: bytes,
    signature: str | None,
    webhook_secret: str | None,
) -> dict[str, Any] | None:
    """Verify and parse a Stripe webhook payload. Returns None when webhooks are not configured."""
    if not webhook_secret:
        return None

    import stripe

    if not signature:
        raise ValueError("Missing Stripe-Signature header")

    event = stripe.Webhook.construct_event(payload, signature, webhook_secret)
    return {
        "id": event.id,
        "type": event.type,
        "data": event.data.object,
    }