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

def restaurant_out(r: Restaurant) -> dict:
    return {
        "id": r.id, "name": r.name, "cuisine_type": r.cuisine_type,
        "address": r.address, "city": r.city, "phone": r.phone,
        "contact_email": r.contact_email, "description": r.description,
        "hours": r.hours, "price_range": r.price_range,
        "amenities": parse_json(r.amenities),
        "photos": parse_json(r.photos),
        "avg_rating": r.avg_rating, "review_count": r.review_count,
        "view_count": r.view_count or 0,
    }

@router.get("/restaurants")
def get_owner_restaurants(db: Session = Depends(get_db),
                          current_user: User = Depends(get_current_owner)):
    restaurants = db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).all()
    return [restaurant_out(r) for r in restaurants]

# ─── Get owner's restaurant ───────────────────────────────────────────────────
@router.get("/restaurant")
def get_owner_restaurant(db: Session = Depends(get_db),
                         current_user: User = Depends(get_current_owner)):
    r = db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).first()
    if not r:
        raise HTTPException(404, "No restaurant found")
    return restaurant_out(r)

# ─── Owner dashboard analytics ────────────────────────────────────────────────
@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_owner)):
    restaurants = db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).all()
    if not restaurants:
        return {
            "restaurants": [],
            "total_views": 0, "avg_rating": 0,
            "total_reviews": 0, "favourites_count": 0,
            "rating_distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            "recent_reviews": []
        }

    all_reviews = []
    restaurant_stats = []
    for r in restaurants:
        reviews = db.query(Review).filter(Review.restaurant_id == r.id).all()
        all_reviews.extend(reviews)
        restaurant_stats.append({
            "id": r.id,
            "name": r.name,
            "cuisine_type": r.cuisine_type,
            "avg_rating": r.avg_rating or 0,
            "review_count": r.review_count or 0,
            "view_count": r.view_count or 0,
            "favourites_count": len(r.favourites),
        })

    # Rating distribution
    dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for rev in all_reviews:
        dist[rev.rating] = dist.get(rev.rating, 0) + 1

    # Recent reviews (last 10)
    recent = sorted(all_reviews, key=lambda r: r.created_at or 0, reverse=True)[:10]

    return {
        "restaurants": restaurant_stats,
        "total_views": sum(r.get("view_count", 0) for r in restaurant_stats),
        "avg_rating": round(
            sum(r.get("avg_rating", 0) for r in restaurant_stats) / len(restaurant_stats), 2
        ) if restaurant_stats else 0,
        "total_reviews": len(all_reviews),
        "favourites_count": sum(r.get("favourites_count", 0) for r in restaurant_stats),
        "rating_distribution": dist,
        "recent_reviews": [
            {
                "id": r.id,
                "restaurant_name": r.restaurant.name if r.restaurant else "",
                "user_name": r.user.name if r.user else "Unknown",
                "rating": r.rating,
                "comment": r.comment,
                "created_at": r.created_at,
            }
            for r in recent
        ],
    }

@router.get("/search-unclaimed")
def search_unclaimed(q: str = "", db: Session = Depends(get_db),
                     current_user: User = Depends(get_current_owner)):
    query = db.query(Restaurant).filter(Restaurant.owner_id == None)
    if q:
        query = query.filter(Restaurant.name.ilike(f"%{q}%"))
    return [restaurant_out(r) for r in query.limit(10).all()]

@router.post("/claim/{restaurant_id}")
def claim_restaurant(restaurant_id: int, db: Session = Depends(get_db),
                     current_user: User = Depends(get_current_owner)):
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(404, "Restaurant not found")
    if r.owner_id:
        raise HTTPException(400, "This restaurant has already been claimed")
    r.owner_id = current_user.id
    db.commit()
    return {"detail": f"Successfully claimed {r.name}"}

@router.post("/release/{restaurant_id}")
def release_restaurant(restaurant_id: int, db: Session = Depends(get_db),
                       current_user: User = Depends(get_current_owner)):
    r = db.query(Restaurant).filter(
        Restaurant.id == restaurant_id,
        Restaurant.owner_id == current_user.id
    ).first()
    if not r:
        raise HTTPException(404, "Restaurant not found or not yours")
    r.owner_id = None
    db.commit()
    return {"detail": f"Released {r.name}"}
