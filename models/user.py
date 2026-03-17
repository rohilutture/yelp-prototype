from sqlalchemy import Column, Integer, String, Text, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class User(Base):
    __tablename__ = "users"

    id             = Column(Integer, primary_key=True, index=True)
    name           = Column(String(100), nullable=False)
    email          = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password= Column(String(255), nullable=False)
    role           = Column(Enum("user", "owner"), default="user", nullable=False)
    phone          = Column(String(30))
    about          = Column(Text)
    city           = Column(String(100))
    country        = Column(String(100))
    gender         = Column(String(50))
    languages      = Column(Text)          # JSON string
    avatar_url     = Column(String(500))
    restaurant_location = Column(String(255))   # for owners
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
    updated_at     = Column(DateTime(timezone=True), onupdate=func.now())

    reviews        = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    restaurants = relationship("Restaurant", foreign_keys="Restaurant.added_by", back_populates="added_by_user")
    favourites     = relationship("Favourite", back_populates="user", cascade="all, delete-orphan")
    preferences    = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
