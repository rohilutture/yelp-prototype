from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id            = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating        = Column(Integer, nullable=False)   # 1–5
    comment       = Column(Text)
    photos        = Column(Text)   # JSON string
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), onupdate=func.now())

    restaurant    = relationship("Restaurant", back_populates="reviews")
    user          = relationship("User", back_populates="reviews")

    __table_args__ = (UniqueConstraint("restaurant_id", "user_id", name="uq_one_review_per_user"),)


class Favourite(Base):
    __tablename__ = "favourites"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=False)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    user          = relationship("User", back_populates="favourites")
    restaurant    = relationship("Restaurant", back_populates="favourites")

    __table_args__ = (UniqueConstraint("user_id", "restaurant_id", name="uq_favourite"),)


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    cuisines    = Column(Text)       # JSON
    price_range = Column(Text)       # JSON
    dietary     = Column(Text)       # JSON
    ambiance    = Column(Text)       # JSON
    sort_by     = Column(String(50), default="Rating")
    location    = Column(String(200))
    radius      = Column(Integer, default=10)
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

    user        = relationship("User", back_populates="preferences")
