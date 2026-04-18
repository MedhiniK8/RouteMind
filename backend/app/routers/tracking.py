from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.database import get_db
from app.models.schemas import (
    LocationUpdate,
    PresenceCheck,
    Role,
    StudentLocationUpdate,
    TripStart,
    TripStop,
    UserPublic,
    serialize_doc,
)
from app.routers.auth import get_current_user
from app.services.ai_engine import calculate_eta_minutes, detect_delay
from app.services.geo import calculate_speed_kmph
from app.services.geo import haversine_m
from app.services.presence import validate_presence
from app.websocket.manager import manager

router = APIRouter(prefix="/api/tracking", tags=["tracking"])


async def serialize_cursor(cursor):
    items = []
    async for item in cursor:
        items.append(serialize_doc(item))
    return items


async def ensure_driver_bus(database, driver: UserPublic, payload: TripStart) -> dict:
    query = {"_id": ObjectId(payload.bus_id)} if payload.bus_id else {"driver_id": driver.id, "route_key": payload.route_key}
    bus = await database.buses.find_one(query)
    if not bus and payload.route_key:
        bus = await database.buses.find_one({"route_key": payload.route_key, "$or": [{"driver_id": None}, {"driver_id": driver.id}]})
    if bus:
        await database.buses.update_one({"_id": bus["_id"]}, {"$set": {"driver_id": driver.id}})
        bus["driver_id"] = driver.id
        return bus

    route = None
    if payload.route_id:
        route = await database.routes.find_one({"_id": ObjectId(payload.route_id)})
    if payload.route_key:
        route = await database.routes.find_one({"route_key": payload.route_key})
    if not route:
        route = await database.routes.find_one({})
    if not route:
        raise HTTPException(status_code=400, detail="Create at least one route before starting a trip")

    bus_doc = {
        "bus_number": f"RM-{driver.id[-4:].upper()}",
        "driver_id": driver.id,
        "route_id": str(route["_id"]),
        "route_key": route.get("route_key"),
        "status": "idle",
        "is_accessible": False,
        "current_location": payload.location.model_dump() if payload.location else route["stops"][0],
        "speed": 0,
        "heading": 0,
        "trip_active": False,
        "created_at": datetime.now(timezone.utc),
    }
    result = await database.buses.insert_one(bus_doc)
    await database.users.update_one({"_id": ObjectId(driver.id)}, {"$set": {"bus_id": str(result.inserted_id), "route_id": str(route["_id"]), "route_key": route.get("route_key")}})
    await database.drivers.update_one({"user_id": driver.id}, {"$set": {"bus_id": str(result.inserted_id), "route_id": str(route["_id"]), "route_key": route.get("route_key")}}, upsert=True)
    return await database.buses.find_one({"_id": result.inserted_id})


async def process_location_update(payload: LocationUpdate) -> dict:
    database = get_db()
    bus = await database.buses.find_one({"_id": ObjectId(payload.bus_id)})
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")

    timestamp = payload.timestamp or datetime.now(timezone.utc)
    previous = bus.get("current_location")
    previous_time = bus.get("last_updated")
    seconds = (timestamp - previous_time).total_seconds() if previous_time else 0
    current = payload.location.model_dump()
    speed = calculate_speed_kmph(previous, current, seconds)

    bus_updates = {
        "current_location": current,
        "speed": speed,
        "heading": payload.heading,
        "status": "active",
        "trip_active": True,
        "last_updated": timestamp,
    }
    if not bus.get("started_at"):
        bus_updates["started_at"] = timestamp
    await database.buses.update_one({"_id": ObjectId(payload.bus_id)}, {"$set": bus_updates})
    await database.location_history.insert_one(
        {"bus_id": payload.bus_id, "location": current, "speed": speed, "timestamp": timestamp}
    )
    await database.live_locations.update_one(
        {"bus_id": payload.bus_id},
        {
            "$set": {
                "bus_id": payload.bus_id,
                "driver_id": payload.driver_id or bus.get("driver_id"),
                "trip_id": payload.trip_id,
                "location": current,
                "speed": speed,
                "heading": payload.heading,
                "status": "active",
                "updated_at": timestamp,
            }
        },
        upsert=True,
    )

    bus = serialize_doc(await database.buses.find_one({"_id": ObjectId(payload.bus_id)}))
    route = await database.routes.find_one({"_id": ObjectId(bus["route_id"])})
    route_doc = serialize_doc(route) if route else None
    destination = route_doc["stops"][-1] if route_doc and route_doc.get("stops") else current
    if route_doc:
        nearby_stops = [stop for stop in route_doc.get("stops", []) if haversine_m(current, stop) <= 150]
        for stop in nearby_stops:
            event_key = f"{payload.bus_id}:{stop['id']}:arrived"
            already_sent = await database.stop_events.find_one({"event_key": event_key})
            if not already_sent:
                await database.stop_events.insert_one({"event_key": event_key, "bus_id": payload.bus_id, "stop_id": stop["id"], "created_at": timestamp})
                note = {
                    "user_id": None,
                    "bus_id": payload.bus_id,
                    "type": "stop_arrival",
                    "message": f"{bus['bus_number']} is near {stop['name']}. Please be ready.",
                    "priority": "high",
                    "read": False,
                    "created_at": timestamp,
                }
                result = await database.notifications.insert_one(note)
                saved_note = serialize_doc(await database.notifications.find_one({"_id": result.inserted_id}))
                await manager.broadcast(f"bus:{payload.bus_id}", {"type": "notification", "notification": saved_note})
    eta = calculate_eta_minutes(current, destination, speed)
    delay = detect_delay(route_doc, bus)
    update = {"type": "bus_location", "bus": bus, "eta_minutes": eta, "delay": delay}
    route_key = bus.get("route_key") or (route_doc.get("route_key") if route_doc else None)
    rooms = [f"bus:{payload.bus_id}", "admin", "drivers"]
    if route_key:
        rooms.append(f"route:{route_key}")
    await manager.broadcast_many(rooms, update)
    return update


@router.post("/start-trip")
async def start_trip(payload: TripStart, current_user: UserPublic = Depends(get_current_user)):
    if current_user.role != Role.driver:
        raise HTTPException(status_code=403, detail="Driver access required")
    database = get_db()
    bus = await ensure_driver_bus(database, current_user, payload)
    now = datetime.now(timezone.utc)
    location = payload.location.model_dump() if payload.location else bus.get("current_location")
    session = {
        "driver_id": current_user.id,
        "bus_id": str(bus["_id"]),
        "route_id": bus["route_id"],
        "status": "active",
        "started_at": now,
        "ended_at": None,
        "start_location": location,
    }
    result = await database.trip_sessions.insert_one(session)
    await database.buses.update_one(
        {"_id": bus["_id"]},
        {"$set": {"trip_active": True, "status": "active", "started_at": now, "current_location": location, "last_updated": now}},
    )
    await database.drivers.update_one(
        {"user_id": current_user.id},
        {"$set": {"status": "active", "bus_id": str(bus["_id"]), "route_key": bus.get("route_key"), "route_id": bus.get("route_id")}},
        upsert=True,
    )
    saved_bus = serialize_doc(await database.buses.find_one({"_id": bus["_id"]}))
    notification = {
        "bus_id": saved_bus["id"],
        "type": "trip_started",
        "message": f"{saved_bus['bus_number']} is on the way.",
        "priority": "medium",
        "read": False,
        "created_at": now,
    }
    await database.notifications.insert_one(notification)
    event = {"type": "trip_started", "bus": saved_bus, "trip_id": str(result.inserted_id), "notification": serialize_doc(notification)}
    rooms = [f"bus:{saved_bus['id']}", "admin", "drivers"]
    if saved_bus.get("route_key"):
        rooms.append(f"route:{saved_bus['route_key']}")
    await manager.broadcast_many(rooms, event)
    return event


@router.post("/stop-trip")
async def stop_trip(payload: TripStop, current_user: UserPublic = Depends(get_current_user)):
    if current_user.role != Role.driver:
        raise HTTPException(status_code=403, detail="Driver access required")
    now = datetime.now(timezone.utc)
    await get_db().trip_sessions.update_many(
        {"bus_id": payload.bus_id, "driver_id": current_user.id, "status": "active"},
        {"$set": {"status": "completed", "ended_at": now}},
    )
    await get_db().buses.update_one({"_id": ObjectId(payload.bus_id)}, {"$set": {"trip_active": False, "status": "idle", "last_updated": now}})
    await get_db().live_locations.update_one({"bus_id": payload.bus_id}, {"$set": {"status": "idle", "updated_at": now}})
    bus = serialize_doc(await get_db().buses.find_one({"_id": ObjectId(payload.bus_id)}))
    event = {"type": "trip_stopped", "bus": bus}
    rooms = [f"bus:{payload.bus_id}", "admin", "drivers"]
    if bus.get("route_key"):
        rooms.append(f"route:{bus['route_key']}")
    await manager.broadcast_many(rooms, event)
    return event


@router.post("/update")
async def update_location(payload: LocationUpdate):
    return await process_location_update(payload)


@router.get("/bus/{bus_id}")
async def latest_bus_location(bus_id: str):
    bus = await get_db().buses.find_one({"_id": ObjectId(bus_id)})
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")
    return serialize_doc(bus)


@router.get("/live-buses")
async def live_buses():
    buses = []
    async for bus in get_db().buses.find({"trip_active": True}):
        buses.append(serialize_doc(bus))
    return buses


@router.get("/student-assignment")
async def student_assignment(current_user: UserPublic = Depends(get_current_user)):
    if current_user.role != Role.student:
        raise HTTPException(status_code=403, detail="Student access required")
    bus = await get_db().buses.find_one({"_id": ObjectId(current_user.bus_id)}) if current_user.bus_id else None
    route = None
    if bus:
        route = await get_db().routes.find_one({"_id": ObjectId(bus["route_id"])})
    return {
        "bus": serialize_doc(bus) if bus else None,
        "route": serialize_doc(route) if route else None,
        "notifications": await serialize_cursor(
            get_db().notifications.find({"$or": [{"user_id": current_user.id}, {"bus_id": current_user.bus_id}]}).sort("created_at", -1).limit(30)
        ),
    }


@router.post("/student-location")
async def student_location(payload: StudentLocationUpdate, current_user: UserPublic = Depends(get_current_user)):
    if current_user.role != Role.student:
        raise HTTPException(status_code=403, detail="Student access required")
    doc = {
        "user_id": current_user.id,
        "bus_id": payload.bus_id or current_user.bus_id,
        "location": payload.location.model_dump(),
        "updated_at": datetime.now(timezone.utc),
    }
    await get_db().student_locations.update_one({"user_id": current_user.id}, {"$set": doc}, upsert=True)
    await manager.broadcast("admin", {"type": "student_location", **doc})
    return doc


@router.post("/presence-check")
async def presence_check(payload: PresenceCheck):
    bus = await get_db().buses.find_one({"_id": ObjectId(payload.bus_id)})
    if not bus or not bus.get("current_location"):
        raise HTTPException(status_code=404, detail="Live bus location unavailable")
    samples = [sample.model_dump() for sample in payload.samples] or [payload.student_location.model_dump()]
    result = validate_presence(samples, bus["current_location"])
    await manager.broadcast("admin", {"type": "presence_result", "bus_id": payload.bus_id, **result})
    return result
