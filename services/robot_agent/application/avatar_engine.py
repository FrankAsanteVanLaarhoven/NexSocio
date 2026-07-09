"""Talking-head avatar engine — D-ID API when configured, local lip-sync stub otherwise."""

import base64
import secrets
from typing import Any

import httpx


class AvatarEngine:
    def __init__(self, did_api_key: str | None = None, did_api_url: str = "https://api.d-id.com"):
        self.did_api_key = did_api_key
        self.did_api_url = did_api_url.rstrip("/")

    async def generate(
        self,
        image_data: str,
        script: str,
        voice_id: str = "en-US-JennyNeural",
    ) -> dict[str, Any]:
        script = script.strip()
        if not script:
            raise ValueError("Script is required")

        if self.did_api_key:
            try:
                return await self._generate_did(image_data, script, voice_id)
            except Exception:
                pass

        return self._generate_local_stub(image_data, script)

    async def _generate_did(self, image_data: str, script: str, voice_id: str) -> dict[str, Any]:
        source_url = image_data if image_data.startswith("http") else None
        if not source_url and image_data.startswith("data:"):
            source_url = image_data

        payload: dict[str, Any] = {
            "script": {
                "type": "text",
                "input": script,
                "provider": {"type": "microsoft", "voice_id": voice_id},
            },
            "source_url": source_url or image_data,
            "config": {"fluent": True, "pad_audio": 0},
        }

        auth = self.did_api_key or ""
        headers = {
            "Authorization": f"Basic {auth}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            create = await client.post(f"{self.did_api_url}/talks", json=payload, headers=headers)
            create.raise_for_status()
            talk = create.json()
            talk_id = talk.get("id")
            if not talk_id:
                raise RuntimeError("D-ID did not return talk id")

            for _ in range(60):
                poll = await client.get(f"{self.did_api_url}/talks/{talk_id}", headers=headers)
                poll.raise_for_status()
                data = poll.json()
                status = data.get("status")
                if status == "done":
                    return {
                        "provider": "d-id",
                        "talk_id": talk_id,
                        "video_url": data.get("result_url"),
                        "script": script,
                        "status": "ready",
                    }
                if status == "error":
                    raise RuntimeError(data.get("error", "D-ID generation failed"))
                import asyncio

                await asyncio.sleep(2)

        raise RuntimeError("D-ID generation timed out")

    def _generate_local_stub(self, image_data: str, script: str) -> dict[str, Any]:
        job_id = f"local-{secrets.token_hex(6)}"
        preview = image_data[:500] if len(image_data) > 500 else image_data
        return {
            "provider": "nexsocio-lipsync",
            "talk_id": job_id,
            "video_url": None,
            "avatar_image": preview,
            "script": script,
            "status": "client_render",
            "instructions": (
                "Render talking-head on device using photo + speech-driven lip sync, "
                "then upload the video."
            ),
        }