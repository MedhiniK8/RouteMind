from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.database import get_db
from app.models.schemas import Role, SOSCreate, UserPublic, serialize_doc
from app.routers.auth import get_current_user
from app.services.ai_engine import prioritize_alert
from app.websocket.manager import manager

router = APIRouter(prefix="/api/sos", tags=["sos"])


@router.post("")
async def create_sos(payload: SOSCreate, current_user: UserPublic = Depends(get_current_user)):
    alert = prioritize_alert("sos", payload.message)
    doc = {
        **payload.model_dump(),
        "user_id": payload.user_id or current_user.id,
        "status": "active",
        "priority": alert["priority"],
        "score": alert["score"],
        "created_at": datetime.now(timezone.utc),
    }
    result = await get_db().sos_alerts.insert_one(doc)
    saved = serialize_doc(await get_db().sos_alerts.find_one({"_id": result.inserted_id}))
    note = {
        "user_id": None,
        "bus_id": payload.bus_id,
        "type": payload.alert_type,
        "message": payload.message,
        "priority": "critical",
        "read": False,
        "created_at": doc["created_at"],
    }
    note_result = await get_db().notifications.insert_one(note)
    saved_note = serialize_doc(await get_db().notifications.find_one({"_id": note_result.inserted_id}))
    await manager.broadcast("admin", {"type": "sos_alert", "alert": saved})
    if payload.bus_id:
        if payload.alert_type == "breakdown":
            await get_db().buses.update_one({"_id": ObjectId(payload.bus_id)}, {"$set": {"status": "breakdown", "trip_active": False}})
        await manager.broadcast(f"bus:{payload.bus_id}", {"type": "sos_alert", "alert": saved, "notification": saved_note})
    if payload.route_key:
        await manager.broadcast(f"route:{payload.route_key}", {"type": "sos_alert", "alert": saved, "notification": saved_note})
    await manager.broadcast("drivers", {"type": "sos_alert", "alert": saved})
    return saved


@router.get("")
async def list_sos(current_user: UserPublic = Depends(get_current_user)):
    if current_user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    alerts = []
    async for alert in get_db().sos_alerts.find({}).sort("created_at", -1):
        alerts.append(serialize_doc(alert))
    return alerts


@router.put("/{alert_id}/resolve")
async def resolve_sos(alert_id: str, current_user: UserPublic = Depends(get_current_user)):
    if current_user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    await get_db().sos_alerts.update_one(
        {"_id": ObjectId(alert_id)},
        {"$set": {"status": "resolved", "resolved_at": datetime.now(timezone.utc), "resolved_by": current_user.id}},
    )
    return serialize_doc(await get_db().sos_alerts.find_one({"_id": ObjectId(alert_id)}))
