from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.database import get_db
from app.models.schemas import InstructionCreate, NotificationCreate, Role, UserPublic, serialize_doc
from app.routers.auth import get_current_user
from app.services.ai_engine import prioritize_alert
from app.websocket.manager import manager

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
async def list_notifications(current_user: UserPublic = Depends(get_current_user)):
    query = {"$or": [{"user_id": current_user.id}, {"bus_id": current_user.bus_id}]}
    notifications = []
    async for item in get_db().notifications.find(query).sort("created_at", -1).limit(30):
        notifications.append(serialize_doc(item))
    return notifications


@router.post("")
async def create_notification(payload: NotificationCreate, current_user: UserPublic = Depends(get_current_user)):
    alert = prioritize_alert(payload.type, payload.message)
    doc = {
        **payload.model_dump(),
        "priority": payload.priority or alert["priority"],
        "score": alert["score"],
        "read": False,
        "created_at": datetime.now(timezone.utc),
    }
    result = await get_db().notifications.insert_one(doc)
    saved = serialize_doc(await get_db().notifications.find_one({"_id": result.inserted_id}))
    if payload.bus_id:
        await manager.broadcast(f"bus:{payload.bus_id}", {"type": "notification", "notification": saved})
    await manager.broadcast("admin", {"type": "notification", "notification": saved})
    return saved


@router.post("/admin-message")
async def admin_message(payload: InstructionCreate, current_user: UserPublic = Depends(get_current_user)):
    if current_user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    doc = {
        "user_id": None,
        "bus_id": payload.bus_id,
        "type": "admin_message",
        "message": payload.message,
        "priority": "high",
        "read": False,
        "created_at": datetime.now(timezone.utc),
    }
    result = await get_db().notifications.insert_one(doc)
    saved = serialize_doc(await get_db().notifications.find_one({"_id": result.inserted_id}))
    rooms = ["admin"]
    if payload.audience in {"bus", "students", "all"}:
        rooms.append(f"bus:{payload.bus_id}")
    if payload.audience in {"drivers", "all"}:
        rooms.append("drivers")
    await manager.broadcast_many(rooms, {"type": "admin_message", "notification": saved})
    return saved


@router.post("/route-change")
async def route_change(payload: InstructionCreate, current_user: UserPublic = Depends(get_current_user)):
    if current_user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    doc = {
        "user_id": None,
        "bus_id": payload.bus_id,
        "type": "route_change",
        "message": payload.message,
        "priority": "high",
        "read": False,
        "created_at": datetime.now(timezone.utc),
    }
    result = await get_db().notifications.insert_one(doc)
    saved = serialize_doc(await get_db().notifications.find_one({"_id": result.inserted_id}))
    await manager.broadcast_many([f"bus:{payload.bus_id}", "admin", "drivers"], {"type": "route_change", "notification": saved})
    return saved
