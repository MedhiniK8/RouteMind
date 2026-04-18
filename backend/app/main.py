from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import close_mongo_connection, connect_to_mongo
from app.models.schemas import LocationUpdate
from app.routers import analytics, auth, buses, chat, notifications, routes, sos, tracking
from app.seed_data import seed_database
from app.websocket.manager import manager

app = FastAPI(
    title="RouteMind API",
    description="AI-powered smart college bus tracking and management system.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(buses.router)
app.include_router(routes.router)
app.include_router(tracking.router)
app.include_router(sos.router)
app.include_router(notifications.router)
app.include_router(analytics.router)
app.include_router(chat.router)


@app.on_event("startup")
async def startup() -> None:
    await connect_to_mongo()
    if settings.seed_demo_data:
        await seed_database()


@app.on_event("shutdown")
async def shutdown() -> None:
    await close_mongo_connection()


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "RouteMind API", "database": settings.database_name}


@app.websocket("/ws/{room}")
async def websocket_endpoint(websocket: WebSocket, room: str):
    await manager.connect(websocket, room)
    try:
        while True:
            payload = await websocket.receive_json()
            message_type = payload.get("type")
            if message_type == "driver_location":
                update = LocationUpdate(**payload["payload"])
                await tracking.process_location_update(update)
            elif message_type == "student_location":
                await manager.broadcast("admin", payload)
            elif message_type == "chat_message":
                route_key = payload.get("route_key")
                if route_key:
                    await manager.broadcast_many([f"route:{route_key}", "admin"], payload)
            elif message_type == "instruction":
                await manager.broadcast(f"bus:{payload['bus_id']}", payload)
            elif message_type in {"sos_alert", "route_change", "breakdown"}:
                rooms = ["admin", "drivers"]
                if payload.get("bus_id"):
                    rooms.append(f"bus:{payload['bus_id']}")
                if payload.get("route_key"):
                    rooms.append(f"route:{payload['route_key']}")
                await manager.broadcast_many(rooms, payload)
            elif message_type == "alert_resolved":
                rooms = ["admin", "drivers"]
                if payload.get("route_key"):
                    rooms.append(f"route:{payload['route_key']}")
                await manager.broadcast_many(rooms, payload)
            else:
                await manager.broadcast(room, payload)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as exc:
        await websocket.close(code=1011, reason=str(exc))
        manager.disconnect(websocket)
