import json
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user
from core.kafka import publish_event
from models.review import Review
from models.restaurant import Restaurant
from models.user import User
from schemas.schemas import ReviewCreate, ReviewUpdate

router = APIRouter(tags=["Reviews"])

def recalc_rating(restaurant: Restaurant, db: Session):
    reviews = db.query(Review).filter(Review.restaurant_id == restaurant.id).all()
    restaurant.review_count = len(reviews)
    restaurant.avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 2) if reviews else 0.0
    db.commit()

def review_out(r: Review) -> dict:
    return {
        "id": r.id,
        "restaurant_id": r.restaurant_id,
        "user_id": r.user_id,
        "user_name": r.user.name if r.user else "Unknown",
        "rating": r.rating,
        "comment": r.comment,
        "photos": json.loads(r.photos) if r.photos else [],
        "created_at": r.created_at,
    }

# ─── List reviews for a restaurant ───────────────────────────────────────────
@router.get("/restaurants/{restaurant_id}/reviews")
def get_reviews(restaurant_id: int, db: Session = Depends(get_db)):
    reviews = (db.query(Review)
               .filter(Review.restaurant_id == restaurant_id)
               .order_by(Review.created_at.desc())
               .all())
    return [review_out(r) for r in reviews]

# ─── Create review ────────────────────────────────────────────────────────────
@router.post("/restaurants/{restaurant_id}/reviews", status_code=201)
def create_review(restaurant_id: int, body: ReviewCreate,
                  db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(404, "Restaurant not found")
    existing = db.query(Review).filter(
        Review.restaurant_id == restaurant_id,
        Review.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(400, "You have already reviewed this restaurant")
    event_id = str(uuid.uuid4())
    publish_event("review.created", {
        "event_id": event_id,
        "restaurant_id": restaurant_id,
        "user_id": current_user.id,
        "rating": body.rating,
        "comment": body.comment,
    })
    return {"status": "queued", "event_id": event_id, "operation": "create"}

# ─── Update review ────────────────────────────────────────────────────────────
@router.put("/reviews/{review_id}")
def update_review(review_id: int, body: ReviewUpdate,
                  db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(404, "Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(403, "Not your review")
    event_id = str(uuid.uuid4())
    publish_event("review.updated", {
        "event_id": event_id,
        "review_id": review.id,
        "user_id": current_user.id,
        "rating": body.rating,
        "comment": body.comment,
    })
    return {"status": "queued", "event_id": event_id, "operation": "update"}

# ─── Delete review ────────────────────────────────────────────────────────────
@router.delete("/reviews/{review_id}", status_code=202)
def delete_review(review_id: int, db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(404, "Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(403, "Not your review")
    event_id = str(uuid.uuid4())
    publish_event("review.deleted", {
        "event_id": event_id,
        "review_id": review.id,
        "user_id": current_user.id,
        "restaurant_id": review.restaurant_id,
    })
    return {"status": "queued", "event_id": event_id, "operation": "delete"}
