from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.database import get_db
from app.models.schemas import ChatMessageCreate, Role, UserPublic, serialize_doc
from app.routers.auth import get_current_user
from app.websocket.manager import manager

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.get("/{route_key}")
async def list_route_chat(route_key: str, current_user: UserPublic = Depends(get_current_user)):
    if current_user.role == Role.student and current_user.route_key and current_user.route_key != route_key:
        raise HTTPException(status_code=403, detail="Students can only view their selected route chat")
    messages = []
    async for item in get_db().chat_messages.find({"route_key": route_key}).sort("created_at", -1).limit(50):
        messages.append(serialize_doc(item))
    return list(reversed(messages))


@router.post("")
async def send_chat(payload: ChatMessageCreate, current_user: UserPublic = Depends(get_current_user)):
    if current_user.role == Role.student and current_user.route_key and current_user.route_key != payload.route_key:
        raise HTTPException(status_code=403, detail="Students can only message their selected route")
    doc = {
        "route_key": payload.route_key,
        "audience": payload.audience,
        "message": payload.message,
        "sender_id": current_user.id,
        "sender_name": current_user.name,
        "sender_role": current_user.role.value,
        "created_at": datetime.now(timezone.utc),
    }
    result = await get_db().chat_messages.insert_one(doc)
    saved = serialize_doc(await get_db().chat_messages.find_one({"_id": result.inserted_id}))
    rooms = [f"route:{payload.route_key}"]
    if payload.audience == "admin":
        rooms.append("admin")
    if payload.audience in {"driver", "students", "route"}:
        rooms.append("drivers")
    await manager.broadcast_many(rooms, {"type": "chat_message", "chat": saved})
    return saved
