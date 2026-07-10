from uuid import UUID, uuid4

import httpx
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from services.commerce.application.dtos import (
    AddToCartRequest,
    CartItemResponse,
    CartResponse,
    CheckoutResponse,
    CreateProductRequest,
    MarketplaceDashboard,
    OrderItemResponse,
    OrderResponse,
    ProductResponse,
    TransactionResponse,
    WalletResponse,
)
from services.commerce.infrastructure.config import Settings
from services.commerce.infrastructure.models import (
    CartItemModel,
    OrderItemModel,
    OrderModel,
    ProductModel,
    TransactionModel,
    WalletModel,
)


class CommerceService:
    def __init__(self, db: AsyncSession, settings: Settings):
        self.db = db
        self.settings = settings

    async def get_or_create_wallet(self, user_id: UUID) -> WalletResponse:
        result = await self.db.execute(select(WalletModel).where(WalletModel.user_id == user_id))
        wallet = result.scalar_one_or_none()
        if not wallet:
            wallet = WalletModel(
                user_id=user_id,
                balance=self.settings.default_wallet_balance,
                currency=self.settings.default_currency,
                bonus_coins=120,
            )
            self.db.add(wallet)
            await self.db.commit()
            await self.db.refresh(wallet)
        return self._wallet(wallet)

    async def list_transactions(self, user_id: UUID, limit: int = 30) -> list[TransactionResponse]:
        result = await self.db.execute(
            select(TransactionModel)
            .where(TransactionModel.user_id == user_id)
            .order_by(TransactionModel.created_at.desc())
            .limit(limit)
        )
        return [self._transaction(t) for t in result.scalars().all()]

    async def set_payment_provider(
        self, user_id: UUID, provider: str, connected: bool
    ) -> WalletResponse:
        wallet_row = await self._wallet_row(user_id)
        if provider == "stripe":
            wallet_row.stripe_connected = connected
        else:
            wallet_row.paypal_connected = connected
        await self.db.commit()
        await self.db.refresh(wallet_row)
        return self._wallet(wallet_row)

    async def list_products(
        self, category: str | None = None, query: str | None = None
    ) -> list[ProductResponse]:
        stmt = select(ProductModel).where(ProductModel.status == "active")
        if category and category != "all":
            stmt = stmt.where(ProductModel.category == category)
        if query:
            like = f"%{query.lower()}%"
            stmt = stmt.where(
                func.lower(ProductModel.title).like(like)
                | func.lower(ProductModel.description).like(like)
            )
        stmt = stmt.order_by(ProductModel.created_at.desc())
        result = await self.db.execute(stmt)
        return [self._product(p) for p in result.scalars().all()]

    async def list_my_products(self, seller_id: UUID) -> list[ProductResponse]:
        result = await self.db.execute(
            select(ProductModel)
            .where(ProductModel.seller_id == seller_id)
            .order_by(ProductModel.created_at.desc())
        )
        return [self._product(p) for p in result.scalars().all()]

    async def _assert_org_can_sell(self, org_id: UUID) -> None:
        url = f"{self.settings.professional_service_url}/api/v1/organizations/{org_id}/can-sell"
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(url)
                if res.status_code >= 400:
                    raise HTTPException(status_code=403, detail="Corporate credentials required to sell")
                allowed = res.json().get("data", False)
                if not allowed:
                    raise HTTPException(
                        status_code=403,
                        detail="Verify corporate email and credentials before listing services",
                    )
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=503, detail="Corporate verification service unavailable") from exc

    async def _assert_business_can_sell(self, seller_id: UUID) -> None:
        url = f"{self.settings.professional_service_url}/api/v1/business/users/{seller_id}/can-sell"
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(url)
                if res.status_code >= 400:
                    raise HTTPException(status_code=403, detail="Business tools subscription required to sell")
                allowed = res.json().get("data", False)
                if not allowed:
                    raise HTTPException(
                        status_code=403,
                        detail="Start a free business tools trial on /shop to list on the marketplace",
                    )
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=503, detail="Business verification service unavailable") from exc

    async def create_product(
        self, seller_id: UUID, seller_name: str, request: CreateProductRequest
    ) -> ProductResponse:
        org_uuid: UUID | None = None
        if request.org_id:
            org_uuid = UUID(request.org_id)
            await self._assert_org_can_sell(org_uuid)
        else:
            await self._assert_business_can_sell(seller_id)
        product = ProductModel(
            id=uuid4(),
            seller_id=seller_id,
            org_id=org_uuid,
            seller_name=seller_name,
            title=request.title,
            description=request.description,
            price=request.price,
            currency=self.settings.default_currency,
            category=request.category,
            image_emoji=request.image_emoji,
            stock=request.stock if not request.is_digital else 999,
            is_digital=request.is_digital,
            media_url=request.media_url,
            media_type=request.media_type,
            status="active",
        )
        self.db.add(product)
        await self.db.commit()
        await self.db.refresh(product)
        return self._product(product)

    async def get_cart(self, user_id: UUID) -> CartResponse:
        result = await self.db.execute(
            select(CartItemModel).where(CartItemModel.user_id == user_id)
        )
        cart_items = result.scalars().all()
        items: list[CartItemResponse] = []
        subtotal = 0.0
        currency = self.settings.default_currency

        for ci in cart_items:
            prod = await self._product_row(ci.product_id)
            if prod.status != "active":
                continue
            line = prod.price * ci.quantity
            subtotal += line
            currency = prod.currency
            items.append(
                CartItemResponse(
                    product_id=prod.id,
                    title=prod.title,
                    price=prod.price,
                    currency=prod.currency,
                    quantity=ci.quantity,
                    image_emoji=prod.image_emoji,
                    seller_name=prod.seller_name,
                    line_total=line,
                )
            )

        return CartResponse(
            items=items,
            subtotal=subtotal,
            currency=currency,
            item_count=sum(i.quantity for i in items),
        )

    async def add_to_cart(
        self, user_id: UUID, request: AddToCartRequest
    ) -> CartResponse:
        product = await self._product_row(request.product_id)
        if product.status != "active":
            raise HTTPException(status_code=400, detail="Product unavailable")
        if not product.is_digital and product.stock < request.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")

        result = await self.db.execute(
            select(CartItemModel).where(
                CartItemModel.user_id == user_id,
                CartItemModel.product_id == request.product_id,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            existing.quantity += request.quantity
        else:
            self.db.add(
                CartItemModel(
                    user_id=user_id,
                    product_id=request.product_id,
                    quantity=request.quantity,
                )
            )
        await self.db.commit()
        return await self.get_cart(user_id)

    async def remove_from_cart(self, user_id: UUID, product_id: UUID) -> CartResponse:
        result = await self.db.execute(
            select(CartItemModel).where(
                CartItemModel.user_id == user_id,
                CartItemModel.product_id == product_id,
            )
        )
        item = result.scalar_one_or_none()
        if item:
            await self.db.delete(item)
            await self.db.commit()
        return await self.get_cart(user_id)

    async def checkout(
        self, user_id: UUID, buyer_name: str
    ) -> CheckoutResponse:
        cart = await self.get_cart(user_id)
        if not cart.items:
            raise HTTPException(status_code=400, detail="Cart is empty")

        wallet = await self._wallet_row(user_id)
        if wallet.balance < cart.subtotal:
            raise HTTPException(status_code=400, detail="Insufficient wallet balance")

        created_orders: list[OrderModel] = []
        order_items_map: dict[UUID, list[OrderItemResponse]] = {}
        seller_groups: dict[UUID, list[CartItemResponse]] = {}
        for item in cart.items:
            prod = await self._product_row(item.product_id)
            seller_groups.setdefault(prod.seller_id, []).append(item)

        for seller_id, items in seller_groups.items():
            seller_name = items[0].seller_name
            total = sum(i.line_total for i in items)
            order = OrderModel(
                id=uuid4(),
                buyer_id=user_id,
                buyer_name=buyer_name,
                seller_id=seller_id,
                seller_name=seller_name,
                status="processing",
                total=total,
                currency=cart.currency,
            )
            self.db.add(order)
            await self.db.flush()
            order_items: list[OrderItemResponse] = []

            for item in items:
                prod = await self._product_row(item.product_id)
                if not prod.is_digital:
                    prod.stock = max(0, prod.stock - item.quantity)
                    if prod.stock == 0:
                        prod.status = "sold_out"
                self.db.add(
                    OrderItemModel(
                        order_id=order.id,
                        product_id=item.product_id,
                        title=item.title,
                        price=item.price,
                        quantity=item.quantity,
                    )
                )
                order_items.append(
                    OrderItemResponse(
                        product_id=item.product_id,
                        title=item.title,
                        price=item.price,
                        quantity=item.quantity,
                    )
                )

            seller_wallet = await self._wallet_row(seller_id)
            seller_wallet.balance += total
            self.db.add(
                TransactionModel(
                    user_id=seller_id,
                    type="sale",
                    label=f"Sale · {items[0].title}" + (f" +{len(items)-1}" if len(items) > 1 else ""),
                    amount=total,
                    currency=cart.currency,
                    order_id=order.id,
                )
            )

            created_orders.append(order)
            order_items_map[order.id] = order_items

        wallet.balance -= cart.subtotal
        self.db.add(
            TransactionModel(
                user_id=user_id,
                type="purchase",
                label=f"Marketplace checkout · {cart.item_count} item(s)",
                amount=-cart.subtotal,
                currency=cart.currency,
            )
        )

        cart_rows = await self.db.execute(
            select(CartItemModel).where(CartItemModel.user_id == user_id)
        )
        for row in cart_rows.scalars().all():
            await self.db.delete(row)

        await self.db.commit()

        orders: list[OrderResponse] = []
        for order in created_orders:
            await self.db.refresh(order)
            orders.append(
                OrderResponse(
                    id=order.id,
                    buyer_id=order.buyer_id,
                    buyer_name=order.buyer_name,
                    seller_id=order.seller_id,
                    seller_name=order.seller_name,
                    status=order.status,
                    total=order.total,
                    currency=order.currency,
                    items=order_items_map[order.id],
                    created_at=order.created_at,
                )
            )

        return CheckoutResponse(
            orders=orders,
            total_paid=cart.subtotal,
            currency=cart.currency,
        )

    async def list_buyer_orders(self, user_id: UUID) -> list[OrderResponse]:
        result = await self.db.execute(
            select(OrderModel)
            .where(OrderModel.buyer_id == user_id)
            .order_by(OrderModel.created_at.desc())
        )
        return [await self._order(o) for o in result.scalars().all()]

    async def list_seller_orders(self, seller_id: UUID) -> list[OrderResponse]:
        result = await self.db.execute(
            select(OrderModel)
            .where(OrderModel.seller_id == seller_id)
            .order_by(OrderModel.created_at.desc())
        )
        return [await self._order(o) for o in result.scalars().all()]

    async def seller_dashboard(self, seller_id: UUID) -> MarketplaceDashboard:
        listings = await self.db.execute(
            select(func.count())
            .select_from(ProductModel)
            .where(ProductModel.seller_id == seller_id, ProductModel.status == "active")
        )
        sales = await self.db.execute(
            select(func.coalesce(func.sum(OrderModel.total), 0.0)).where(
                OrderModel.seller_id == seller_id
            )
        )
        pending = await self.db.execute(
            select(func.count())
            .select_from(OrderModel)
            .where(OrderModel.seller_id == seller_id, OrderModel.status == "processing")
        )
        return MarketplaceDashboard(
            active_listings=listings.scalar() or 0,
            total_sales=float(sales.scalar() or 0),
            orders_to_fulfill=pending.scalar() or 0,
            currency=self.settings.default_currency,
        )

    async def _wallet_row(self, user_id: UUID) -> WalletModel:
        await self.get_or_create_wallet(user_id)
        result = await self.db.execute(select(WalletModel).where(WalletModel.user_id == user_id))
        return result.scalar_one()

    async def _product_row(self, product_id: UUID) -> ProductModel:
        result = await self.db.execute(select(ProductModel).where(ProductModel.id == product_id))
        product = result.scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product

    async def _order(self, order: OrderModel) -> OrderResponse:
        items_result = await self.db.execute(
            select(OrderItemModel).where(OrderItemModel.order_id == order.id)
        )
        items = [
            OrderItemResponse(
                product_id=i.product_id,
                title=i.title,
                price=i.price,
                quantity=i.quantity,
            )
            for i in items_result.scalars().all()
        ]
        return OrderResponse(
            id=order.id,
            buyer_id=order.buyer_id,
            buyer_name=order.buyer_name,
            seller_id=order.seller_id,
            seller_name=order.seller_name,
            status=order.status,
            total=order.total,
            currency=order.currency,
            items=items,
            created_at=order.created_at,
        )

    def _wallet(self, w: WalletModel) -> WalletResponse:
        return WalletResponse(
            user_id=w.user_id,
            balance=w.balance,
            currency=w.currency,
            bonus_coins=w.bonus_coins,
            creator_balance=getattr(w, "creator_balance", 0.0) or 0.0,
            stripe_connected=w.stripe_connected,
            paypal_connected=w.paypal_connected,
        )

    def _transaction(self, t: TransactionModel) -> TransactionResponse:
        return TransactionResponse(
            id=t.id,
            type=t.type,
            label=t.label,
            amount=t.amount,
            currency=t.currency,
            order_id=t.order_id,
            created_at=t.created_at,
        )

    def _product(self, p: ProductModel) -> ProductResponse:
        return ProductResponse(
            id=p.id,
            seller_id=p.seller_id,
            seller_name=p.seller_name,
            title=p.title,
            description=p.description,
            price=p.price,
            currency=p.currency,
            category=p.category,
            image_emoji=p.image_emoji,
            media_url=getattr(p, "media_url", None),
            media_type=getattr(p, "media_type", None),
            stock=p.stock,
            status=p.status,
            is_digital=p.is_digital,
            created_at=p.created_at,
        )