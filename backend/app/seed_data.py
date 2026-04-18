from datetime import datetime, timezone

from passlib.context import CryptContext

from app.database import get_db
from app.services.route_config import COLLEGE_ROUTES, route_polyline

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed_database() -> None:
    database = get_db()
    if await database.users.count_documents({}) > 0:
        return

    route_ids: dict[str, str] = {}
    for route in COLLEGE_ROUTES:
        doc = dict(route)
        doc["route_key"] = route["key"]
        doc["polyline"] = route_polyline(route)
        doc["created_at"] = datetime.now(timezone.utc)
        key = doc.pop("key")
        result = await database.routes.insert_one(doc)
        route_ids[key] = str(result.inserted_id)

    users = [
        {
            "name": "Ananya Student",
            "email": "student@routemind.dev",
            "password_hash": pwd_context.hash("student123"),
            "role": "student",
            "stop_id": "dwd-court",
            "route_id": route_ids["dharwad"],
            "route_key": "dharwad",
            "created_at": datetime.now(timezone.utc),
        },
        {
            "name": "Ravi Driver",
            "email": "driver@routemind.dev",
            "password_hash": pwd_context.hash("driver123"),
            "role": "driver",
            "route_id": None,
            "route_key": None,
            "created_at": datetime.now(timezone.utc),
        },
        {
            "name": "Priya Admin",
            "email": "admin@routemind.dev",
            "password_hash": pwd_context.hash("admin123"),
            "role": "admin",
            "created_at": datetime.now(timezone.utc),
        },
    ]
    inserted = await database.users.insert_many(users)
    student_id, driver_id, _admin_id = [str(item) for item in inserted.inserted_ids]

    buses = [
        {
            "bus_number": "SDM-DWD-01",
            "driver_id": None,
            "route_id": route_ids["dharwad"],
            "route_key": "dharwad",
            "status": "idle",
            "is_accessible": True,
            "current_location": None,
            "speed": 0,
            "heading": 42,
            "trip_active": False,
            "started_at": None,
            "last_updated": datetime.now(timezone.utc),
        },
        {
            "bus_number": "SDM-HBL-02",
            "driver_id": None,
            "route_id": route_ids["hubli"],
            "route_key": "hubli",
            "status": "idle",
            "is_accessible": False,
            "current_location": None,
            "speed": 0,
            "heading": 0,
            "trip_active": False,
            "last_updated": datetime.now(timezone.utc),
        },
    ]
    bus_result = await database.buses.insert_many(buses)
    dharwad_bus_id = str(bus_result.inserted_ids[0])

    await database.users.update_one({"_id": inserted.inserted_ids[0]}, {"$set": {"bus_id": dharwad_bus_id}})
    await database.students.insert_one(
        {
            "user_id": student_id,
            "name": users[0]["name"],
            "email": users[0]["email"],
            "bus_id": dharwad_bus_id,
            "route_id": route_ids["dharwad"],
            "route_key": "dharwad",
            "stop_id": "dwd-court",
            "created_at": datetime.now(timezone.utc),
        }
    )
    await database.drivers.insert_one(
        {
            "user_id": driver_id,
            "name": users[1]["name"],
            "email": users[1]["email"],
            "bus_id": None,
            "route_id": None,
            "route_key": None,
            "status": "inactive",
            "created_at": datetime.now(timezone.utc),
        }
    )
    await database.admins.insert_one(
        {
            "user_id": str(inserted.inserted_ids[2]),
            "name": users[2]["name"],
            "email": users[2]["email"],
            "created_at": datetime.now(timezone.utc),
        }
    )
    await database.notifications.insert_many(
        [
            {
                "user_id": student_id,
                "bus_id": dharwad_bus_id,
                "type": "info",
                "message": "Choose your route and stop to begin SDM live tracking.",
                "priority": "medium",
                "read": False,
                "created_at": datetime.now(timezone.utc),
            },
        ]
    )
