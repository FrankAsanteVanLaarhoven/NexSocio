"""Social-platform media format rules (TikTok, Instagram, YouTube Shorts aligned)."""

from dataclasses import dataclass


@dataclass(frozen=True)
class MediaFormatSpec:
    id: str
    label: str
    mime_types: tuple[str, ...]
    extensions: tuple[str, ...]
    max_bytes: int
    max_duration_sec: int | None = None
    aspect_hint: str | None = None


# TikTok: MP4/MOV, up to 287MB, up to 10 min (we cap at 10 min)
REEL = MediaFormatSpec(
    id="reel",
    label="Reel / Short video",
    mime_types=("video/mp4", "video/quicktime", "video/webm", "video/x-m4v", "video/x-msvideo"),
    extensions=(".mp4", ".mov", ".webm", ".m4v", ".avi"),
    max_bytes=287 * 1024 * 1024,
    max_duration_sec=600,
    aspect_hint="9:16 vertical (1080×1920) recommended",
)

# Instagram photo: JPG/PNG/WebP/GIF, up to 20MB
PHOTO = MediaFormatSpec(
    id="photo",
    label="Photo",
    mime_types=("image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"),
    extensions=(".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"),
    max_bytes=20 * 1024 * 1024,
    aspect_hint="1:1, 4:5, or 9:16",
)

# Shop listing: image or short product video
SHOP = MediaFormatSpec(
    id="shop",
    label="Shop media",
    mime_types=PHOTO.mime_types + REEL.mime_types,
    extensions=PHOTO.extensions + REEL.extensions,
    max_bytes=100 * 1024 * 1024,
    max_duration_sec=180,
    aspect_hint="1:1 product image or 9:16 demo video",
)

# Business profile / promo
BUSINESS = MediaFormatSpec(
    id="business",
    label="Business media",
    mime_types=PHOTO.mime_types + REEL.mime_types,
    extensions=PHOTO.extensions + REEL.extensions,
    max_bytes=100 * 1024 * 1024,
    max_duration_sec=300,
    aspect_hint="16:9 or 9:16 promo",
)

AVATAR = MediaFormatSpec(
    id="avatar",
    label="Profile photo",
    mime_types=("image/jpeg", "image/png", "image/webp"),
    extensions=(".jpg", ".jpeg", ".png", ".webp"),
    max_bytes=10 * 1024 * 1024,
    aspect_hint="1:1 square",
)

SPECS: dict[str, MediaFormatSpec] = {
    "reel": REEL,
    "photo": PHOTO,
    "shop": SHOP,
    "business": BUSINESS,
    "avatar": AVATAR,
}


def get_spec(context: str) -> MediaFormatSpec:
    return SPECS.get(context, PHOTO)


def is_allowed_mime(context: str, mime: str) -> bool:
    spec = get_spec(context)
    return mime.lower() in spec.mime_types


def is_allowed_extension(filename: str, context: str) -> bool:
    spec = get_spec(context)
    lower = filename.lower()
    return any(lower.endswith(ext) for ext in spec.extensions)


def media_kind_from_mime(mime: str) -> str:
    if mime.startswith("video/"):
        return "video"
    if mime.startswith("image/"):
        return "image"
    return "file"