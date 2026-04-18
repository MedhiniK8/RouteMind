from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.database import get_db
from app.models.schemas import BusIn, BusUpdate, Role, UserPublic, serialize_doc
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/buses", tags=["buses"])


def require_admin(user: UserPublic) -> None:
    if user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Admin access required")


@router.get("")
async def list_buses(accessible: bool | None = None):
    query = {} if accessible is None else {"is_accessible": accessible}
    buses = []
    async for bus in get_db().buses.find(query):
        buses.append(serialize_doc(bus))
    return buses


@router.get("/{bus_id}")
async def get_bus(bus_id: str):
    bus = await get_db().buses.find_one({"_id": ObjectId(bus_id)})
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")
    return serialize_doc(bus)


@router.post("")
async def create_bus(payload: BusIn, current_user: UserPublic = Depends(get_current_user)):
    require_admin(current_user)
    doc = payload.model_dump()
    doc.update(
        {
            "status": "idle",
            "current_location": None,
            "speed": 0,
            "heading": 0,
            "trip_active": False,
            "created_at": datetime.now(timezone.utc),
        }
    )
    result = await get_db().buses.insert_one(doc)
    return serialize_doc(await get_db().buses.find_one({"_id": result.inserted_id}))


@router.put("/{bus_id}")
async def update_bus(bus_id: str, payload: BusUpdate, current_user: UserPublic = Depends(get_current_user)):
    require_admin(current_user)
    updates = {key: value for key, value in payload.model_dump().items() if value is not None}
    updates["updated_at"] = datetime.now(timezone.utc)
    await get_db().buses.update_one({"_id": ObjectId(bus_id)}, {"$set": updates})
    return serialize_doc(await get_db().buses.find_one({"_id": ObjectId(bus_id)}))
