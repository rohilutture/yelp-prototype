from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Any
from datetime import datetime

# ─── Auth ─────────────────────────────────────────────────────────────────────
class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str
    restaurant_location: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_bcrypt_limit(cls, v: str):
        # bcrypt only considers the first 72 bytes of the password; enforce this limit
        # to avoid server errors and accidental truncation.
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 bytes (bcrypt limit)")
        return v

class OwnerSignup(BaseModel):
    name: str
    email: EmailStr
    password: str
    restaurant_location: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

# ─── User ─────────────────────────────────────────────────────────────────────
class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    phone: Optional[str] = None
    about: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    gender: Optional[str] = None
    languages: Optional[List[str]] = None
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    about: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    gender: Optional[str] = None
    languages: Optional[List[str]] = None

# ─── Preferences ──────────────────────────────────────────────────────────────
class PreferencesIn(BaseModel):
    cuisines: Optional[List[str]] = []
    price_range: Optional[List[int]] = []
    dietary: Optional[List[str]] = []
    ambiance: Optional[List[str]] = []
    sort_by: Optional[str] = "Rating"
    location: Optional[str] = None
    radius: Optional[int] = 10

class PreferencesOut(PreferencesIn):
    pass

# ─── Restaurant ───────────────────────────────────────────────────────────────
class RestaurantCreate(BaseModel):
    name: str
    cuisine_type: str
    address: str
    city: str
    phone: Optional[str] = None
    contact_email: Optional[str] = None
    description: Optional[str] = None
    hours: Optional[str] = None
    price_range: Optional[int] = 2
    amenities: Optional[List[str]] = []

class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    cuisine_type: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    contact_email: Optional[str] = None
    description: Optional[str] = None
    hours: Optional[str] = None
    price_range: Optional[int] = None
    amenities: Optional[List[str]] = None

class RestaurantOut(BaseModel):
    id: int
    name: str
    cuisine_type: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    contact_email: Optional[str] = None
    description: Optional[str] = None
    hours: Optional[str] = None
    price_range: Optional[int] = None
    amenities: Optional[List[str]] = None
    photos: Optional[List[str]] = None
    avg_rating: Optional[float] = 0.0
    review_count: Optional[int] = 0
    added_by: Optional[int] = None
    owner_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ─── Review ───────────────────────────────────────────────────────────────────
class ReviewCreate(BaseModel):
    rating: int
    comment: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v):
        if not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5")
        return v

class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    comment: Optional[str] = None

class ReviewOut(BaseModel):
    id: int
    restaurant_id: int
    user_id: int
    user_name: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    photos: Optional[List[str]] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ─── AI Chat ──────────────────────────────────────────────────────────────────
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    message: str
    restaurants: Optional[List[RestaurantOut]] = []
