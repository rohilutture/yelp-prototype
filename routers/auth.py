from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from core.security import hash_password, verify_password, create_access_token, get_current_user, UserDoc
from core.config import get_settings
from core.kafka import publish_event
from core.mongo import get_sessions_collection, get_users_collection, doc_id
from schemas.schemas import UserSignup, LoginRequest

router = APIRouter(prefix="/auth", tags=["Auth"])
settings = get_settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def _persist_session(token: str, user_id: str, role: str) -> None:
    sessions = get_sessions_collection()
    sessions.insert_one({
        "token": token,
        "user_id": user_id,
        "role": role,
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "is_active": True,
    })


def _build_token_response(doc: dict) -> dict:
    uid = doc_id(doc)
    token = create_access_token({"sub": uid, "role": doc["role"]})
    _persist_session(token, uid, doc["role"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": uid,
            "name": doc["name"],
            "email": doc["email"],
            "role": doc["role"],
            "avatar_url": doc.get("avatar_url"),
        },
    }


@router.post("/signup", status_code=201)
def signup(body: UserSignup):
    users = get_users_collection()
    if users.find_one({"email": body.email}):
        raise HTTPException(400, "Email already registered")
    result = users.insert_one({
        "name": body.name,
        "email": body.email,
        "hashed_password": hash_password(body.password),
        "role": "user",
        "created_at": datetime.now(timezone.utc),
    })
    doc = users.find_one({"_id": result.inserted_id})
    publish_event("user.created", {"user_id": doc_id(doc), "email": doc["email"], "role": doc["role"]})
    return _build_token_response(doc)


@router.post("/owner/signup", status_code=201)
def owner_signup(body: UserSignup):
    users = get_users_collection()
    if users.find_one({"email": body.email}):
        raise HTTPException(400, "Email already registered")
    result = users.insert_one({
        "name": body.name,
        "email": body.email,
        "hashed_password": hash_password(body.password),
        "role": "owner",
        "restaurant_location": body.restaurant_location,
        "created_at": datetime.now(timezone.utc),
    })
    doc = users.find_one({"_id": result.inserted_id})
    publish_event("user.created", {"user_id": doc_id(doc), "email": doc["email"], "role": doc["role"]})
    return _build_token_response(doc)


@router.post("/login")
def login(body: LoginRequest):
    doc = get_users_collection().find_one({"email": body.email})
    if not doc or not verify_password(body.password, doc["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return _build_token_response(doc)


@router.post("/owner/login")
def owner_login(body: LoginRequest):
    doc = get_users_collection().find_one({"email": body.email, "role": "owner"})
    if not doc or not verify_password(body.password, doc["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return _build_token_response(doc)


@router.get("/me")
def get_me(current_user: UserDoc = Depends(get_current_user), token: str = Depends(oauth2_scheme)):
    session = get_sessions_collection().find_one({"token": token, "is_active": True})
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired or invalid")
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "avatar_url": current_user.avatar_url,
    }


@router.post("/logout")
def logout(token: str = Depends(oauth2_scheme)):
    get_sessions_collection().update_one({"token": token}, {"$set": {"is_active": False}})
    return {"detail": "Logged out"}
