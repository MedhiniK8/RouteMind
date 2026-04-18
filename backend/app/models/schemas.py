from datetime import datetime
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, EmailStr, Field


class Role(str, Enum):
    student = "student"
    driver = "driver"
    admin = "admin"


class Location(BaseModel):
    lat: float
    lng: float


class Stop(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    order: int
    minutes_from_start: int = 0


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    role: Role
    bus_id: str | None = None
    stop_id: str | None = None
    route_id: str | None = None
    route_key: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: Role
    bus_id: str | None = None
    stop_id: str | None = None
    route_id: str | None = None
    route_key: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class BusIn(BaseModel):
    bus_number: str
    driver_id: str | None = None
    route_id: str
    route_key: str | None = None
    is_accessible: bool = False


class BusUpdate(BaseModel):
    bus_number: str | None = None
    driver_id: str | None = None
    route_id: str | None = None
    route_key: str | None = None
    is_accessible: bool | None = None
    status: Literal["active", "idle", "delayed", "breakdown"] | None = None
    trip_active: bool | None = None


class RouteIn(BaseModel):
    name: str
    stops: list[Stop]
    polyline: list[list[float]]
    schedule_time: str = "08:00"
    route_key: str | None = None


class LocationUpdate(BaseModel):
    bus_id: str
    location: Location
    heading: float = 0
    timestamp: datetime | None = None
    driver_id: str | None = None
    trip_id: str | None = None


class PresenceCheck(BaseModel):
    student_location: Location
    bus_id: str
    samples: list[Location] = Field(default_factory=list)


class SOSCreate(BaseModel):
    user_id: str | None = None
    bus_id: str | None = None
    message: str = "Emergency alert"
    location: Location | None = None
    alert_type: Literal["sos", "breakdown"] = "sos"
    route_key: str | None = None


class InstructionCreate(BaseModel):
    bus_id: str
    message: str
    audience: Literal["bus", "drivers", "students", "all"] = "bus"


class NotificationCreate(BaseModel):
    user_id: str | None = None
    bus_id: str | None = None
    type: str
    message: str
    priority: Literal["low", "medium", "high", "critical"] = "medium"


class TripStart(BaseModel):
    bus_id: str | None = None
    route_id: str | None = None
    route_key: str | None = None
    location: Location | None = None


class TripStop(BaseModel):
    bus_id: str


class StudentLocationUpdate(BaseModel):
    location: Location
    bus_id: str | None = None


class BreakdownCreate(BaseModel):
    bus_id: str
    message: str = "Bus breakdown reported"
    location: Location | None = None


class ChatMessageCreate(BaseModel):
    route_key: str
    audience: Literal["admin", "students", "driver", "route"] = "route"
    message: str


def serialize_doc(doc: dict[str, Any]) -> dict[str, Any]:
    doc = dict(doc)
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc
