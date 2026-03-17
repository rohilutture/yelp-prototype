from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class Restaurant(Base):
    __tablename__ = "restaurants"

    id             = Column(Integer, primary_key=True, index=True)
    name           = Column(String(200), nullable=False, index=True)
    cuisine_type   = Column(String(100), index=True)
    address        = Column(String(300))
    city           = Column(String(100), index=True)
    phone          = Column(String(30))
    contact_email  = Column(String(150))
    description    = Column(Text)
    hours          = Column(Text)
    price_range    = Column(Integer, default=2)   # 1–4
    amenities      = Column(Text)                  # JSON string
    photos         = Column(Text)                  # JSON string of URLs
    avg_rating     = Column(Float, default=0.0)
    review_count   = Column(Integer, default=0)
    view_count     = Column(Integer, default=0)
    added_by       = Column(Integer, ForeignKey("users.id"), nullable=True)
    owner_id       = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
    updated_at     = Column(DateTime(timezone=True), onupdate=func.now())

    added_by_user  = relationship("User", foreign_keys="Restaurant.added_by", back_populates="restaurants")
    owner          = relationship("User", foreign_keys="Restaurant.owner_id")
    reviews        = relationship("Review", back_populates="restaurant", cascade="all, delete-orphan")
    favourites     = relationship("Favourite", back_populates="restaurant", cascade="all, delete-orphan")
