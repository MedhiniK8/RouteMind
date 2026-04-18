from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.database import get_db
from app.models.schemas import Role, RouteIn, UserPublic, serialize_doc
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/routes", tags=["routes"])


@router.get("")
async def list_routes():
    routes = []
    async for route in get_db().routes.find({}):
        routes.append(serialize_doc(route))
    return routes


@router.get("/{route_id}")
async def get_route(route_id: str):
    route = await get_db().routes.find_one({"_id": ObjectId(route_id)})
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return serialize_doc(route)


@router.post("")
async def create_route(payload: RouteIn, current_user: UserPublic = Depends(get_current_user)):
    if current_user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    doc = payload.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    result = await get_db().routes.insert_one(doc)
    return serialize_doc(await get_db().routes.find_one({"_id": result.inserted_id}))


@router.put("/{route_id}")
async def update_route(route_id: str, payload: RouteIn, current_user: UserPublic = Depends(get_current_user)):
    if current_user.role != Role.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    await get_db().routes.update_one(
        {"_id": ObjectId(route_id)},
        {"$set": {**payload.model_dump(), "updated_at": datetime.now(timezone.utc)}},
    )
    return serialize_doc(await get_db().routes.find_one({"_id": ObjectId(route_id)}))
