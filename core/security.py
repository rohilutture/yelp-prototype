from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from core.config import get_settings
from core.mongo import get_users_collection, to_oid

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


class UserDoc:
    """Thin wrapper around a MongoDB user document for attribute-style access."""
    def __init__(self, doc: dict):
        self.id = str(doc["_id"])
        self.name = doc.get("name")
        self.email = doc.get("email")
        self.role = doc.get("role", "user")
        self.hashed_password = doc.get("hashed_password")
        self.phone = doc.get("phone")
        self.about = doc.get("about")
        self.city = doc.get("city")
        self.country = doc.get("country")
        self.gender = doc.get("gender")
        self.languages = doc.get("languages", [])
        self.avatar_url = doc.get("avatar_url")
        self.restaurant_location = doc.get("restaurant_location")
        self.created_at = doc.get("created_at")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def get_current_user(token: str = Depends(oauth2_scheme)) -> UserDoc:
    payload = decode_token(token)
    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    try:
        doc = get_users_collection().find_one({"_id": to_oid(user_id)})
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    if not doc:
        raise HTTPException(status_code=401, detail="User not found")
    return UserDoc(doc)


def get_current_owner(current_user: UserDoc = Depends(get_current_user)) -> UserDoc:
    if current_user.role != "owner":
        raise HTTPException(status_code=403, detail="Owner access required")
    return current_user


def get_optional_user(
    token: Optional[str] = Depends(OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)),
) -> Optional[UserDoc]:
    if not token:
        return None
    try:
        return get_current_user(token)
    except Exception:
        return None
