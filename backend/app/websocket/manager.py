from collections import defaultdict
from typing import Any

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.rooms: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, websocket: WebSocket, room: str) -> None:
        await websocket.accept()
        self.rooms[room].add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        for room in list(self.rooms):
            self.rooms[room].discard(websocket)
            if not self.rooms[room]:
                del self.rooms[room]

    async def broadcast(self, room: str, payload: dict[str, Any]) -> None:
        stale: list[WebSocket] = []
        for websocket in self.rooms.get(room, set()).copy():
            try:
                await websocket.send_json(payload)
            except Exception:
                stale.append(websocket)
        for websocket in stale:
            self.disconnect(websocket)

    async def broadcast_many(self, rooms: list[str], payload: dict[str, Any]) -> None:
        for room in rooms:
            await self.broadcast(room, payload)


manager = ConnectionManager()
