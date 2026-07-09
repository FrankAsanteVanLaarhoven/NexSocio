import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

from nexus_common.media.formats import get_spec, is_allowed_extension, is_allowed_mime, media_kind_from_mime


class MediaUploadService:
    def __init__(self, upload_dir: Path, public_base_path: str = "/api/v1/media/files"):
        self.upload_dir = upload_dir
        self.public_base_path = public_base_path
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    async def save(self, file: UploadFile, context: str) -> dict:
        spec = get_spec(context)
        filename = file.filename or "upload"
        content_type = (file.content_type or "").lower()

        if not is_allowed_extension(filename, context):
            raise HTTPException(
                status_code=400,
                detail=f"Format not allowed. Use: {', '.join(spec.extensions)}",
            )
        if content_type and not is_allowed_mime(context, content_type):
            raise HTTPException(
                status_code=400,
                detail=f"MIME type {content_type} not allowed for {spec.label}",
            )

        data = await file.read()
        if len(data) > spec.max_bytes:
            max_mb = spec.max_bytes // (1024 * 1024)
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Max {max_mb}MB for {spec.label}",
            )
        if not data:
            raise HTTPException(status_code=400, detail="Empty file")

        ext = Path(filename).suffix.lower() or _ext_from_mime(content_type)
        stored_name = f"{uuid.uuid4().hex}{ext}"
        dest = self.upload_dir / stored_name
        dest.write_bytes(data)

        mime = content_type or _guess_mime(ext)
        return {
            "url": f"{self.public_base_path}/{stored_name}",
            "filename": stored_name,
            "original_name": filename,
            "mime_type": mime,
            "media_type": media_kind_from_mime(mime),
            "size_bytes": len(data),
            "context": context,
            "max_duration_sec": spec.max_duration_sec,
            "aspect_hint": spec.aspect_hint,
        }


def _ext_from_mime(mime: str) -> str:
    mapping = {
        "video/mp4": ".mp4",
        "video/quicktime": ".mov",
        "video/webm": ".webm",
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }
    return mapping.get(mime, ".bin")


def _guess_mime(ext: str) -> str:
    mapping = {
        ".mp4": "video/mp4",
        ".mov": "video/quicktime",
        ".webm": "video/webm",
        ".m4v": "video/x-m4v",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
    }
    return mapping.get(ext, "application/octet-stream")