from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConfigurationError, ConnectionFailure, ServerSelectionTimeoutError

from app.config import settings


client: AsyncIOMotorClient | None = None
db = None


async def connect_to_mongo() -> None:
    global client, db
    if not settings.mongodb_uri:
        raise RuntimeError(
            "MONGODB_URI is missing. Paste your MongoDB Atlas connection string in backend/.env."
        )
    try:
        client = AsyncIOMotorClient(
            settings.mongodb_uri,
            serverSelectionTimeoutMS=8000,
            uuidRepresentation="standard",
        )
        db = client[settings.database_name]
        await db.command("ping")
        await create_indexes()
        print(f"Connected to MongoDB Atlas database: {settings.database_name}")
    except (ConfigurationError, ConnectionFailure, ServerSelectionTimeoutError) as exc:
        raise RuntimeError(
            "Could not connect to MongoDB Atlas. Check the URI, username/password, network access IP allowlist, and database user permissions."
        ) from exc


async def close_mongo_connection() -> None:
    if client:
        client.close()


def get_db():
    if db is None:
        raise RuntimeError("Database is not connected")
    return db


async def create_indexes() -> None:
    database = get_db()
    await database.users.create_index("email", unique=True)
    await database.buses.create_index("bus_number", unique=True)
    await database.students.create_index("user_id", unique=True)
    await database.drivers.create_index("user_id", unique=True)
    await database.admins.create_index("user_id", unique=True)
    await database.live_locations.create_index("bus_id", unique=True)
    await database.trip_sessions.create_index([("bus_id", 1), ("status", 1)])
    await database.stop_events.create_index("event_key", unique=True)
    await database.student_locations.create_index("user_id", unique=True)
    await database.chat_messages.create_index([("route_key", 1), ("created_at", -1)])
    await database.notifications.create_index([("user_id", 1), ("created_at", -1)])
    await database.notifications.create_index([("bus_id", 1), ("created_at", -1)])
    await database.location_history.create_index([("bus_id", 1), ("timestamp", -1)])
