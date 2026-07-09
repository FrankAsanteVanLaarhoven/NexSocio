"""Feature flags and public beta cohort management."""

from enum import StrEnum

from pydantic import BaseModel


class FeatureFlag(StrEnum):
    ROBOT_LAYER = "robot_layer"
    PROFESSIONAL_MODE = "professional_mode"
    PUBLIC_BETA = "public_beta"
    ADVANCED_SAFETY = "advanced_safety"
    MEDIA_UPLOAD = "media_upload"


DEFAULT_FLAGS: dict[str, bool] = {
    FeatureFlag.ROBOT_LAYER: True,
    FeatureFlag.PROFESSIONAL_MODE: True,
    FeatureFlag.PUBLIC_BETA: True,
    FeatureFlag.ADVANCED_SAFETY: True,
    FeatureFlag.MEDIA_UPLOAD: False,
}

BETA_COHORTS = {"founding", "early_access", "invite_2026"}


class FeatureFlagsResponse(BaseModel):
    flags: dict[str, bool]
    cohort: str | None = None
    beta_access: bool = False