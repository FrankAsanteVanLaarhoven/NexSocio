"""Content boundaries per posting lane."""

from fastapi import HTTPException

from nexus_common.domain.enums import PostSector

_LEGACY_PROFESSIONAL = "professional"

PERSONAL_FILTERS = frozenset({"none", "cyber", "warm", "mono", "neon", "vintage"})
BUSINESS_GENERAL_FILTERS = frozenset({"none", "warm", "mono", "cyber"})
CORPORATE_FILTERS = frozenset({"none", "mono"})

PERSONAL_POST_TYPES = frozenset({"text", "reel", "photo", "live"})
BUSINESS_GENERAL_POST_TYPES = frozenset({"text", "reel", "photo", "live"})
CORPORATE_POST_TYPES = frozenset({"text", "photo", "live"})


def normalize_sector(value: str) -> PostSector:
    if value == _LEGACY_PROFESSIONAL:
        return PostSector.BUSINESS_GENERAL
    try:
        return PostSector(value)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Unknown posting sector: {value}") from exc


def allowed_filters(sector: PostSector) -> frozenset[str]:
    if sector == PostSector.PERSONAL:
        return PERSONAL_FILTERS
    if sector == PostSector.BUSINESS_GENERAL:
        return BUSINESS_GENERAL_FILTERS
    return CORPORATE_FILTERS


def allowed_post_types(sector: PostSector) -> frozenset[str]:
    if sector == PostSector.PERSONAL:
        return PERSONAL_POST_TYPES
    if sector == PostSector.BUSINESS_GENERAL:
        return BUSINESS_GENERAL_POST_TYPES
    return CORPORATE_POST_TYPES


def validate_post_for_sector(
    *,
    sector: PostSector,
    post_type: str,
    filter_preset: str | None,
    org_id: str | None = None,
) -> None:
    if post_type not in allowed_post_types(sector):
        raise HTTPException(
            status_code=400,
            detail=f"Post type '{post_type}' is not allowed in {sector.value} lane",
        )

    preset = (filter_preset or "none").strip() or "none"
    if preset not in allowed_filters(sector):
        raise HTTPException(
            status_code=400,
            detail=f"Filter '{preset}' is not allowed in {sector.value} lane",
        )

    if sector == PostSector.BUSINESS_CORPORATE and not org_id:
        raise HTTPException(
            status_code=400,
            detail="Corporate posts require an organization (org_id)",
        )

    if sector == PostSector.PERSONAL and org_id:
        raise HTTPException(
            status_code=400,
            detail="Personal posts cannot be tied to an organization",
        )