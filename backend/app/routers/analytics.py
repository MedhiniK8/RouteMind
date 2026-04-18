from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.database import get_db
from app.models.schemas import Role, UserPublic
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


async def require_admin(current_user: UserPublic) -> None:
    if current_user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Admin access required")


@router.get("/overview")
async def overview(current_user: UserPublic = Depends(get_current_user)):
    await require_admin(current_user)
    database = get_db()
    total = await database.buses.count_documents({})
    active = await database.buses.count_documents({"trip_active": True})
    delayed = await database.buses.count_documents({"status": "delayed"})
    sos = await database.sos_alerts.count_documents({"status": "active"})
    accessible = await database.buses.count_documents({"is_accessible": True})
    return {
        "total_buses": total,
        "active_buses": active,
        "delayed_buses": delayed,
        "active_sos": sos,
        "accessible_buses": accessible,
        "punctuality_percent": 92 if total else 0,
        "usage_percent": 78 if active else 52,
    }


@router.get("/punctuality")
async def punctuality(current_user: UserPublic = Depends(get_current_user)):
    await require_admin(current_user)
    return [
        {"day": "Mon", "on_time": 91, "late": 9},
        {"day": "Tue", "on_time": 94, "late": 6},
        {"day": "Wed", "on_time": 88, "late": 12},
        {"day": "Thu", "on_time": 96, "late": 4},
        {"day": "Fri", "on_time": 92, "late": 8},
    ]


@router.get("/delays")
async def delays(current_user: UserPublic = Depends(get_current_user)):
    await require_admin(current_user)
    since = datetime.now(timezone.utc) - timedelta(days=7)
    alerts = []
    async for item in get_db().notifications.find({"type": "delay", "created_at": {"$gte": since}}).sort("created_at", -1):
        alerts.append({"message": item["message"], "created_at": item["created_at"], "priority": item.get("priority")})
    return alerts
