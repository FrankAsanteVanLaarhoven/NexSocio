import json
from uuid import UUID

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, list[WebSocket]] = {}

    async def connect(self, user_id: UUID | str, websocket: WebSocket) -> None:
        uid = str(user_id)
        await websocket.accept()
        self._connections.setdefault(uid, []).append(websocket)

    def disconnect(self, user_id: UUID | str, websocket: WebSocket) -> None:
        uid = str(user_id)
        conns = self._connections.get(uid, [])
        if websocket in conns:
            conns.remove(websocket)
        if not conns:
            self._connections.pop(uid, None)

    async def send_to_user(self, user_id: UUID | str, payload: dict) -> None:
        uid = str(user_id)
        message = json.dumps(payload)
        for ws in list(self._connections.get(uid, [])):
            try:
                await ws.send_text(message)
            except Exception:
                self.disconnect(uid, ws)


manager = ConnectionManager()