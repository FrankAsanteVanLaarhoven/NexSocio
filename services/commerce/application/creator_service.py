"""TikTok-style creator monetization: NexCoins, live gifts, qualified view rewards."""

from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from services.commerce.application.dtos import (
    BuyCoinsRequest,
    CreatorDashboardResponse,
    CreatorEarningResponse,
    GiftCatalogItem,
    GiftEventResponse,
    RecordViewRequest,
    SendGiftRequest,
    WalletResponse,
)
from services.commerce.infrastructure.models import (
    CreatorEarningModel,
    GiftCatalogModel,
    GiftEventModel,
    QualifiedViewModel,
    TransactionModel,
    WalletModel,
)

# NexCoins packs (demo pricing)
COIN_PACKS = {
    "starter": {"coins": 100, "price_gbp": 0.99},
    "popular": {"coins": 500, "price_gbp": 4.49},
    "pro": {"coins": 1200, "price_gbp": 9.99},
}

SEED_GIFTS = [
    {"id": "rose", "emoji": "🌹", "name": "Rose", "coin_cost": 5, "creator_payout_gbp": 0.02},
    {"id": "fire", "emoji": "🔥", "name": "Fire", "coin_cost": 10, "creator_payout_gbp": 0.05},
    {"id": "star", "emoji": "⭐", "name": "Star", "coin_cost": 25, "creator_payout_gbp": 0.12},
    {"id": "diamond", "emoji": "💎", "name": "Diamond", "coin_cost": 100, "creator_payout_gbp": 0.55},
    {"id": "rocket", "emoji": "🚀", "name": "Rocket", "coin_cost": 250, "creator_payout_gbp": 1.40},
    {"id": "crown", "emoji": "👑", "name": "Crown", "coin_cost": 500, "creator_payout_gbp": 2.80},
]

CREATOR_REWARD_POOL_GBP = 500.0
REWARD_PER_1K_VIEWS_GBP = 0.08
MIN_WATCH_SECONDS = 5
PLATFORM_GIFT_SHARE = 0.30


class CreatorService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def ensure_gift_catalog(self) -> None:
        result = await self.db.execute(select(GiftCatalogModel).limit(1))
        if result.scalar_one_or_none():
            return
        for g in SEED_GIFTS:
            self.db.add(GiftCatalogModel(**g))
        await self.db.commit()

    async def list_gifts(self) -> list[GiftCatalogItem]:
        await self.ensure_gift_catalog()
        result = await self.db.execute(select(GiftCatalogModel).order_by(GiftCatalogModel.coin_cost))
        return [
            GiftCatalogItem(
                id=g.id, emoji=g.emoji, name=g.name,
                coin_cost=g.coin_cost, creator_payout_gbp=g.creator_payout_gbp,
            )
            for g in result.scalars().all()
        ]

    async def _wallet_row(self, user_id: UUID) -> WalletModel:
        result = await self.db.execute(select(WalletModel).where(WalletModel.user_id == user_id))
        row = result.scalar_one_or_none()
        if not row:
            row = WalletModel(user_id=user_id, balance=150.0, bonus_coins=120, creator_balance=0.0)
            self.db.add(row)
            await self.db.flush()
        return row

    async def buy_coins(self, user_id: UUID, request: BuyCoinsRequest) -> WalletResponse:
        pack = COIN_PACKS.get(request.pack_id)
        if not pack:
            raise HTTPException(status_code=400, detail="Unknown coin pack")
        wallet = await self._wallet_row(user_id)
        if wallet.balance < pack["price_gbp"]:
            raise HTTPException(status_code=400, detail="Insufficient wallet balance for coin pack")
        wallet.balance -= pack["price_gbp"]
        wallet.bonus_coins += pack["coins"]
        self.db.add(TransactionModel(
            id=uuid4(), user_id=user_id, type="coin_purchase",
            label=f"NexCoins +{pack['coins']}", amount=-pack["price_gbp"], currency=wallet.currency,
        ))
        await self.db.commit()
        await self.db.refresh(wallet)
        return self._wallet(wallet)

    async def send_gift(
        self, sender_id: UUID, sender_name: str, request: SendGiftRequest
    ) -> GiftEventResponse:
        await self.ensure_gift_catalog()
        if sender_id == request.recipient_id:
            raise HTTPException(status_code=400, detail="Cannot gift yourself")

        result = await self.db.execute(
            select(GiftCatalogModel).where(GiftCatalogModel.id == request.gift_id)
        )
        gift = result.scalar_one_or_none()
        if not gift:
            raise HTTPException(status_code=404, detail="Gift not found")

        sender_wallet = await self._wallet_row(sender_id)
        if sender_wallet.bonus_coins < gift.coin_cost:
            raise HTTPException(status_code=400, detail="Not enough NexCoins")

        creator_earned = round(gift.creator_payout_gbp * (1 - PLATFORM_GIFT_SHARE), 2)
        sender_wallet.bonus_coins -= gift.coin_cost

        recipient_wallet = await self._wallet_row(request.recipient_id)
        recipient_wallet.creator_balance += creator_earned

        event = GiftEventModel(
            id=uuid4(),
            sender_id=sender_id,
            recipient_id=request.recipient_id,
            gift_id=gift.id,
            coins_spent=gift.coin_cost,
            creator_earned=creator_earned,
            live_session_id=request.live_session_id,
        )
        earning = CreatorEarningModel(
            id=uuid4(),
            user_id=request.recipient_id,
            source="live_gift",
            amount=creator_earned,
            label=f"{gift.emoji} {gift.name} from {sender_name}",
            reference_id=str(event.id),
        )
        self.db.add(event)
        self.db.add(earning)
        self.db.add(TransactionModel(
            id=uuid4(), user_id=request.recipient_id, type="creator_gift",
            label=earning.label, amount=creator_earned, currency="GBP",
        ))
        await self.db.commit()
        return GiftEventResponse(
            id=event.id,
            gift_id=gift.id,
            gift_emoji=gift.emoji,
            gift_name=gift.name,
            coins_spent=gift.coin_cost,
            creator_earned=creator_earned,
            recipient_id=request.recipient_id,
        )

    async def record_qualified_view(
        self, viewer_id: UUID, request: RecordViewRequest
    ) -> dict:
        if request.watch_seconds < MIN_WATCH_SECONDS:
            return {"counted": False, "reason": "watch_too_short"}

        existing = await self.db.execute(
            select(QualifiedViewModel).where(
                QualifiedViewModel.post_id == request.post_id,
                QualifiedViewModel.viewer_id == viewer_id,
            )
        )
        if existing.scalar_one_or_none():
            return {"counted": False, "reason": "already_counted"}

        view = QualifiedViewModel(
            id=uuid4(),
            post_id=request.post_id,
            creator_id=request.creator_id,
            viewer_id=viewer_id,
            watch_seconds=request.watch_seconds,
            counted=True,
        )
        self.db.add(view)
        await self.db.commit()
        return {"counted": True}

    async def get_creator_dashboard(self, user_id: UUID) -> CreatorDashboardResponse:
        wallet = await self._wallet_row(user_id)
        month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        views_result = await self.db.execute(
            select(func.count()).select_from(QualifiedViewModel).where(
                QualifiedViewModel.creator_id == user_id,
                QualifiedViewModel.counted.is_(True),
                QualifiedViewModel.created_at >= month_start,
            )
        )
        qualified_views = views_result.scalar() or 0

        gifts_result = await self.db.execute(
            select(func.coalesce(func.sum(GiftEventModel.creator_earned), 0.0)).where(
                GiftEventModel.recipient_id == user_id,
                GiftEventModel.created_at >= month_start,
            )
        )
        gifts_earned = float(gifts_result.scalar() or 0)

        rewards_estimate = round((qualified_views / 1000) * REWARD_PER_1K_VIEWS_GBP, 2)

        earnings_result = await self.db.execute(
            select(CreatorEarningModel)
            .where(CreatorEarningModel.user_id == user_id)
            .order_by(CreatorEarningModel.created_at.desc())
            .limit(20)
        )
        recent = [
            CreatorEarningResponse(
                id=e.id, source=e.source, amount=e.amount,
                label=e.label, created_at=e.created_at,
            )
            for e in earnings_result.scalars().all()
        ]

        return CreatorDashboardResponse(
            nex_coins=wallet.bonus_coins,
            creator_balance=wallet.creator_balance,
            qualified_views_month=qualified_views,
            rewards_estimate_gbp=rewards_estimate,
            gifts_earned_month_gbp=gifts_earned,
            affiliate_earned_month_gbp=0.0,
            coin_packs=[{"id": k, **v} for k, v in COIN_PACKS.items()],
            recent_earnings=recent,
        )

    async def payout_creator_balance(self, user_id: UUID) -> WalletResponse:
        wallet = await self._wallet_row(user_id)
        if wallet.creator_balance <= 0:
            raise HTTPException(status_code=400, detail="No creator balance to payout")
        amount = wallet.creator_balance
        wallet.creator_balance = 0
        wallet.balance += amount
        self.db.add(TransactionModel(
            id=uuid4(), user_id=user_id, type="creator_payout",
            label="Creator earnings payout", amount=amount, currency=wallet.currency,
        ))
        await self.db.commit()
        await self.db.refresh(wallet)
        return self._wallet(wallet)

    @staticmethod
    def _wallet(w: WalletModel) -> WalletResponse:
        return WalletResponse(
            user_id=w.user_id,
            balance=w.balance,
            currency=w.currency,
            bonus_coins=w.bonus_coins,
            creator_balance=getattr(w, "creator_balance", 0.0) or 0.0,
            stripe_connected=w.stripe_connected,
            paypal_connected=w.paypal_connected,
        )