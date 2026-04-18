from datetime import datetime, timedelta, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings
from app.database import get_db
from app.models.schemas import LoginRequest, TokenResponse, UserCreate, UserPublic, serialize_doc

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(user_id: str, role: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode({"sub": user_id, "role": role, "exp": expires}, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def public_user(doc: dict) -> UserPublic:
    item = serialize_doc(doc)
    return UserPublic(
        id=item["id"],
        name=item["name"],
        email=item["email"],
        role=item["role"],
        bus_id=item.get("bus_id"),
        stop_id=item.get("stop_id"),
        route_id=item.get("route_id"),
        route_key=item.get("route_key"),
    )


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserPublic:
    credentials_error = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        if not user_id:
            raise credentials_error
    except JWTError as exc:
        raise credentials_error from exc

    user = await get_db().users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise credentials_error
    return public_user(user)


@router.post("/register", response_model=TokenResponse)
async def register(payload: UserCreate):
    existing = await get_db().users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    doc = payload.model_dump()
    doc["password_hash"] = hash_password(doc.pop("password"))
    doc["created_at"] = datetime.now(timezone.utc)
    result = await get_db().users.insert_one(doc)
    profile = {
        "user_id": str(result.inserted_id),
        "name": doc["name"],
        "email": doc["email"],
        "bus_id": doc.get("bus_id"),
        "route_id": doc.get("route_id"),
        "route_key": doc.get("route_key"),
        "stop_id": doc.get("stop_id"),
        "created_at": doc["created_at"],
    }
    if doc["role"] == "student":
        await get_db().students.insert_one(profile)
    elif doc["role"] == "driver":
        await get_db().drivers.insert_one({**profile, "status": "offline"})
    elif doc["role"] == "admin":
        await get_db().admins.insert_one(profile)
    user = await get_db().users.find_one({"_id": result.inserted_id})
    public = public_user(user)
    return TokenResponse(access_token=create_access_token(public.id, public.role.value), user=public)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    user = await get_db().users.find_one({"email": payload.email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    public = public_user(user)
    return TokenResponse(access_token=create_access_token(public.id, public.role.value), user=public)


@router.get("/me", response_model=UserPublic)
async def me(current_user: UserPublic = Depends(get_current_user)):
    return current_user
