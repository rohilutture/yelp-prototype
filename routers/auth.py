from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import hash_password, verify_password, create_access_token, get_current_user
from core.config import get_settings
from core.kafka import publish_event
from core.mongo import get_sessions_collection
from models.user import User
from schemas.schemas import UserSignup, LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["Auth"])
settings = get_settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def _persist_session(token: str, user: User) -> None:
    sessions = get_sessions_collection()
    sessions.create_index("token", unique=True)
    sessions.create_index("expires_at", expireAfterSeconds=0)
    sessions.insert_one({
        "token": token,
        "user_id": user.id,
        "role": user.role,
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "is_active": True,
    })

def _build_token_response(user: User) -> dict:
    token = create_access_token({"sub": str(user.id), "role": user.role})
    _persist_session(token, user)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "avatar_url": user.avatar_url,
        }
    }

# ─── User signup ──────────────────────────────────────────────────────────────
@router.post("/signup", status_code=201)
def signup(body: UserSignup, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(400, "Email already registered")
    user = User(
        name=body.name,
        email=body.email,
        hashed_password=hash_password(body.password),
        role="user",
    )
    db.add(user); db.commit(); db.refresh(user)
    publish_event("user.created", {"user_id": user.id, "email": user.email, "role": user.role})
    return _build_token_response(user)

# ─── Owner signup ─────────────────────────────────────────────────────────────
@router.post("/owner/signup", status_code=201)
def owner_signup(body: UserSignup, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(400, "Email already registered")
    user = User(
        name=body.name,
        email=body.email,
        hashed_password=hash_password(body.password),
        role="owner",
        restaurant_location=body.restaurant_location,
    )
    db.add(user); db.commit(); db.refresh(user)
    publish_event("user.created", {"user_id": user.id, "email": user.email, "role": user.role})
    return _build_token_response(user)

# ─── Login (shared) ───────────────────────────────────────────────────────────
@router.post("/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return _build_token_response(user)

@router.post("/owner/login")
def owner_login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email, User.role == "owner").first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return _build_token_response(user)

# ─── Me ───────────────────────────────────────────────────────────────────────
@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), token: str = Depends(oauth2_scheme)):
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
