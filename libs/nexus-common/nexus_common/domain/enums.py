from enum import StrEnum


class UserMode(StrEnum):
    """Age-adaptive and professional context modes."""

    KIDS = "kids"
    PRIME = "prime"
    PROFESSIONAL = "professional"


class VerificationStatus(StrEnum):
    PENDING = "pending"
    VERIFIED = "verified"
    FAILED = "failed"


class ContentVisibility(StrEnum):
    PUBLIC = "public"
    CONNECTIONS = "connections"
    PRIVATE = "private"


class PostSector(StrEnum):
    """Posting lane — personal social vs business general vs corporate (LinkedIn-style)."""

    PERSONAL = "personal"
    BUSINESS_GENERAL = "business_general"
    BUSINESS_CORPORATE = "business_corporate"


class ViewContext(StrEnum):
    """Posting lane on session/posts. Legacy 'professional' maps to business_general."""

    PERSONAL = "personal"
    PROFESSIONAL = "professional"
    BUSINESS_GENERAL = "business_general"
    BUSINESS_CORPORATE = "business_corporate"


class FeedType(StrEnum):
    GLOBAL = "global"
    CONNECTIONS = "connections"
    PROFESSIONAL = "professional"
    BUSINESS_GENERAL = "business_general"
    BUSINESS_CORPORATE = "business_corporate"