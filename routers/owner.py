import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_owner
from models.restaurant import Restaurant
from models.review import Review
from models.user import User

router = APIRouter(prefix="/owner", tags=["Owner"])

def parse_json(v):
    try: return json.loads(v) if v else []
    except: return []

# ─── Get owner's restaurant ───────────────────────────────────────────────────
@router.get("/restaurant")
def get_owner_restaurant(db: Session = Depends(get_db),
                         current_user: User = Depends(get_current_owner)):
    r = db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).first()
    if not r:
        raise HTTPException(404, "No restaurant found")
    return {
        "id": r.id, "name": r.name, "cuisine_type": r.cuisine_type,
        "address": r.address, "city": r.city, "phone": r.phone,
        "contact_email": r.contact_email, "description": r.description,
        "hours": r.hours, "price_range": r.price_range,
        "amenities": parse_json(r.amenities),
        "photos": parse_json(r.photos),
        "avg_rating": r.avg_rating, "review_count": r.review_count,
    }

# ─── Owner dashboard analytics ────────────────────────────────────────────────
@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_owner)):
    restaurant = db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).first()
    if not restaurant:
        return {"restaurant_name": None, "total_views": 0, "avg_rating": 0,
                "total_reviews": 0, "favourites_count": 0,
                "rating_distribution": {}, "recent_reviews": []}

    reviews = db.query(Review).filter(Review.restaurant_id == restaurant.id).all()

    # Rating distribution
    dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for rev in reviews:
        dist[rev.rating] = dist.get(rev.rating, 0) + 1

    # Recent reviews (last 10)
    recent = sorted(reviews, key=lambda r: r.created_at or 0, reverse=True)[:10]

    return {
        "restaurant_name": restaurant.name,
        "total_views": restaurant.view_count or 0,
        "avg_rating": restaurant.avg_rating or 0,
        "total_reviews": restaurant.review_count or 0,
        "favourites_count": len(restaurant.favourites),
        "rating_distribution": dist,
        "recent_reviews": [
            {
                "id": r.id,
                "user_name": r.user.name if r.user else "Unknown",
                "rating": r.rating,
                "comment": r.comment,
                "created_at": r.created_at,
            }
            for r in recent
        ],
    }
