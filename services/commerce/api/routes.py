from typing import Annotated

from fastapi import APIRouter, Depends, Query
from nexus_common.domain.models import ApiResponse, HealthResponse

from services.commerce.api.deps import AuthContext, get_auth_context, get_commerce_service, get_settings
from services.commerce.application.dtos import (
    AddToCartRequest,
    CartResponse,
    CheckoutResponse,
    CreateProductRequest,
    MarketplaceDashboard,
    OrderResponse,
    PaymentProviderRequest,
    ProductResponse,
    TransactionResponse,
    WalletResponse,
)
from services.commerce.application.services import CommerceService
from services.commerce.infrastructure.config import Settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health(settings: Annotated[Settings, Depends(get_settings)]) -> HealthResponse:
    return HealthResponse(service=settings.service_name)


@router.get("/wallet", response_model=ApiResponse[WalletResponse])
async def get_wallet(
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[CommerceService, Depends(get_commerce_service)],
) -> ApiResponse[WalletResponse]:
    return ApiResponse(data=await service.get_or_create_wallet(auth.user_id))


@router.get("/wallet/transactions", response_model=ApiResponse[list[TransactionResponse]])
async def list_transactions(
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[CommerceService, Depends(get_commerce_service)],
) -> ApiResponse[list[TransactionResponse]]:
    return ApiResponse(data=await service.list_transactions(auth.user_id))


@router.post("/wallet/providers", response_model=ApiResponse[WalletResponse])
async def set_payment_provider(
    request: PaymentProviderRequest,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[CommerceService, Depends(get_commerce_service)],
) -> ApiResponse[WalletResponse]:
    result = await service.set_payment_provider(auth.user_id, request.provider, request.connected)
    return ApiResponse(data=result)


@router.get("/marketplace/products", response_model=ApiResponse[list[ProductResponse]])
async def list_products(
    service: Annotated[CommerceService, Depends(get_commerce_service)],
    category: str | None = Query(default=None),
    q: str | None = Query(default=None),
) -> ApiResponse[list[ProductResponse]]:
    return ApiResponse(data=await service.list_products(category=category, query=q))


@router.get("/marketplace/products/mine", response_model=ApiResponse[list[ProductResponse]])
async def my_products(
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[CommerceService, Depends(get_commerce_service)],
) -> ApiResponse[list[ProductResponse]]:
    return ApiResponse(data=await service.list_my_products(auth.user_id))


@router.post("/marketplace/products", response_model=ApiResponse[ProductResponse])
async def create_product(
    request: CreateProductRequest,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[CommerceService, Depends(get_commerce_service)],
) -> ApiResponse[ProductResponse]:
    result = await service.create_product(auth.user_id, auth.display_name, request)
    return ApiResponse(data=result)


@router.get("/marketplace/dashboard", response_model=ApiResponse[MarketplaceDashboard])
async def seller_dashboard(
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[CommerceService, Depends(get_commerce_service)],
) -> ApiResponse[MarketplaceDashboard]:
    return ApiResponse(data=await service.seller_dashboard(auth.user_id))


@router.get("/cart", response_model=ApiResponse[CartResponse])
async def get_cart(
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[CommerceService, Depends(get_commerce_service)],
) -> ApiResponse[CartResponse]:
    return ApiResponse(data=await service.get_cart(auth.user_id))


@router.post("/cart/items", response_model=ApiResponse[CartResponse])
async def add_to_cart(
    request: AddToCartRequest,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[CommerceService, Depends(get_commerce_service)],
) -> ApiResponse[CartResponse]:
    return ApiResponse(data=await service.add_to_cart(auth.user_id, request))


@router.delete("/cart/items/{product_id}", response_model=ApiResponse[CartResponse])
async def remove_from_cart(
    product_id: str,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[CommerceService, Depends(get_commerce_service)],
) -> ApiResponse[CartResponse]:
    from uuid import UUID

    return ApiResponse(data=await service.remove_from_cart(auth.user_id, UUID(product_id)))


@router.post("/checkout", response_model=ApiResponse[CheckoutResponse])
async def checkout(
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[CommerceService, Depends(get_commerce_service)],
) -> ApiResponse[CheckoutResponse]:
    return ApiResponse(data=await service.checkout(auth.user_id, auth.display_name))


@router.get("/orders", response_model=ApiResponse[list[OrderResponse]])
async def buyer_orders(
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[CommerceService, Depends(get_commerce_service)],
) -> ApiResponse[list[OrderResponse]]:
    return ApiResponse(data=await service.list_buyer_orders(auth.user_id))


@router.get("/orders/sales", response_model=ApiResponse[list[OrderResponse]])
async def seller_orders(
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[CommerceService, Depends(get_commerce_service)],
) -> ApiResponse[list[OrderResponse]]:
    return ApiResponse(data=await service.list_seller_orders(auth.user_id))