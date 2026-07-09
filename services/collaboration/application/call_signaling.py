import json
from uuid import UUID

from fastapi import WebSocket


class CallSignalingManager:
    """Room-based WebRTC signaling relay (offer / answer / ICE)."""

    def __init__(self) -> None:
        self._rooms: dict[str, dict[str, WebSocket]] = {}

    async def join(self, room: str, user_id: str, websocket: WebSocket) -> None:
        existing = [uid for uid in self._rooms.get(room, {}) if uid != user_id]
        await websocket.accept()
        self._rooms.setdefault(room, {})[user_id] = websocket
        if existing:
            await websocket.send_text(
                json.dumps({"type": "room-state", "peers": existing})
            )
        await self._broadcast(
            room,
            user_id,
            {"type": "peer-joined", "user_id": user_id},
        )

    def leave(self, room: str, user_id: str) -> None:
        peers = self._rooms.get(room)
        if not peers:
            return
        peers.pop(user_id, None)
        if not peers:
            self._rooms.pop(room, None)

    async def relay(self, room: str, sender: str, message: dict) -> None:
        payload = json.dumps(message)
        target = message.get("to")
        peers = self._rooms.get(room, {})

        if target:
            ws = peers.get(str(target))
            if ws and str(target) != sender:
                try:
                    await ws.send_text(payload)
                except Exception:
                    self.leave(room, str(target))
            return

        for uid, ws in list(peers.items()):
            if uid == sender:
                continue
            try:
                await ws.send_text(payload)
            except Exception:
                self.leave(room, uid)

    def peers_in_room(self, room: str) -> list[str]:
        return list(self._rooms.get(room, {}).keys())

    async def _broadcast(self, room: str, sender: str, message: dict) -> None:
        await self.relay(room, sender, message)

    def peer_count(self, room: str) -> int:
        return len(self._rooms.get(room, {}))


signaling = CallSignalingManager()