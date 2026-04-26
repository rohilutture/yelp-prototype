import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from core.security import get_current_user, UserDoc
from core.kafka import publish_event
from core.mongo import get_reviews_collection, get_restaurants_collection, get_users_collection, to_oid
from schemas.schemas import ReviewCreate, ReviewUpdate

router = APIRouter(tags=["Reviews"])


def _recalc_rating(restaurant_id: str):
    reviews = list(get_reviews_collection().find({"restaurant_id": restaurant_id}))
    count = len(reviews)
    avg = round(sum(r["rating"] for r in reviews) / count, 2) if count else 0.0
    try:
        get_restaurants_collection().update_one(
            {"_id": to_oid(restaurant_id)},
            {"$set": {"review_count": count, "avg_rating": avg}},
        )
    except Exception:
        pass


def review_out(r: dict, user_name: str = "Unknown") -> dict:
    return {
        "id": str(r["_id"]),
        "restaurant_id": r.get("restaurant_id"),
        "user_id": r.get("user_id"),
        "user_name": user_name,
        "rating": r.get("rating"),
        "comment": r.get("comment"),
        "photos": r.get("photos", []),
        "created_at": r.get("created_at"),
    }


@router.get("/restaurants/{restaurant_id}/reviews")
def get_reviews(restaurant_id: str):
    reviews = list(
        get_reviews_collection()
        .find({"restaurant_id": restaurant_id})
        .sort("created_at", -1)
    )
    users_col = get_users_collection()
    out = []
    for r in reviews:
        user_name = "Unknown"
        if r.get("user_id"):
            try:
                u = users_col.find_one({"_id": to_oid(r["user_id"])})
                if u:
                    user_name = u.get("name", "Unknown")
            except Exception:
                pass
        out.append(review_out(r, user_name))
    return out


@router.post("/restaurants/{restaurant_id}/reviews", status_code=201)
def create_review(
    restaurant_id: str,
    body: ReviewCreate,
    current_user: UserDoc = Depends(get_current_user),
):
    try:
        to_oid(restaurant_id)
    except Exception:
        raise HTTPException(404, "Restaurant not found")
    r = get_restaurants_collection().find_one({"_id": to_oid(restaurant_id)})
    if not r:
        raise HTTPException(404, "Restaurant not found")
    existing = get_reviews_collection().find_one({
        "restaurant_id": restaurant_id,
        "user_id": current_user.id,
    })
    if existing:
        raise HTTPException(400, "You have already reviewed this restaurant")

    # Write directly to MongoDB so the review is immediately visible
    get_reviews_collection().insert_one({
        "restaurant_id": restaurant_id,
        "user_id": current_user.id,
        "user_name": current_user.name,
        "rating": body.rating,
        "comment": body.comment,
        "photos": [],
        "created_at": datetime.now(timezone.utc),
    })
    _recalc_rating(restaurant_id)

    # Publish to Kafka for async rating recalculation by the worker
    event_id = str(uuid.uuid4())
    publish_event("review.created", {
        "event_id": event_id,
        "restaurant_id": restaurant_id,
        "user_id": current_user.id,
        "rating": body.rating,
        "comment": body.comment,
    })
    return {"status": "queued", "event_id": event_id, "operation": "create"}


@router.put("/reviews/{review_id}")
def update_review(
    review_id: str,
    body: ReviewUpdate,
    current_user: UserDoc = Depends(get_current_user),
):
    try:
        oid = to_oid(review_id)
    except Exception:
        raise HTTPException(404, "Review not found")
    review = get_reviews_collection().find_one({"_id": oid})
    if not review:
        raise HTTPException(404, "Review not found")
    if review.get("user_id") != current_user.id:
        raise HTTPException(403, "Not your review")

    updates = {}
    if body.rating is not None:
        updates["rating"] = body.rating
    if body.comment is not None:
        updates["comment"] = body.comment
    if updates:
        updates["updated_at"] = datetime.now(timezone.utc)
        get_reviews_collection().update_one({"_id": oid}, {"$set": updates})
    _recalc_rating(review["restaurant_id"])

    event_id = str(uuid.uuid4())
    publish_event("review.updated", {
        "event_id": event_id,
        "review_id": review_id,
        "user_id": current_user.id,
        "rating": body.rating,
        "comment": body.comment,
    })
    return {"status": "queued", "event_id": event_id, "operation": "update"}


@router.delete("/reviews/{review_id}", status_code=202)
def delete_review(review_id: str, current_user: UserDoc = Depends(get_current_user)):
    try:
        oid = to_oid(review_id)
    except Exception:
        raise HTTPException(404, "Review not found")
    review = get_reviews_collection().find_one({"_id": oid})
    if not review:
        raise HTTPException(404, "Review not found")
    if review.get("user_id") != current_user.id:
        raise HTTPException(403, "Not your review")

    restaurant_id = review.get("restaurant_id")
    get_reviews_collection().delete_one({"_id": oid})
    if restaurant_id:
        _recalc_rating(restaurant_id)

    event_id = str(uuid.uuid4())
    publish_event("review.deleted", {
        "event_id": event_id,
        "review_id": review_id,
        "user_id": current_user.id,
        "restaurant_id": review.get("restaurant_id"),
    })
    return {"status": "queued", "event_id": event_id, "operation": "delete"}
