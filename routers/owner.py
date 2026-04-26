import re
from fastapi import APIRouter, Depends, HTTPException
from core.security import get_current_owner, UserDoc
from core.mongo import (
    get_restaurants_collection, get_reviews_collection, get_favourites_collection, to_oid
)

router = APIRouter(prefix="/owner", tags=["Owner"])


def _ilike(value: str) -> dict:
    return {"$regex": re.escape(value), "$options": "i"}


def restaurant_out(r: dict) -> dict:
    return {
        "id": str(r["_id"]),
        "name": r.get("name"),
        "cuisine_type": r.get("cuisine_type"),
        "address": r.get("address"),
        "city": r.get("city"),
        "phone": r.get("phone"),
        "contact_email": r.get("contact_email"),
        "description": r.get("description"),
        "hours": r.get("hours"),
        "price_range": r.get("price_range"),
        "amenities": r.get("amenities", []),
        "photos": r.get("photos", []),
        "avg_rating": r.get("avg_rating", 0.0),
        "review_count": r.get("review_count", 0),
        "view_count": r.get("view_count", 0),
    }


@router.get("/restaurants")
def get_owner_restaurants(current_user: UserDoc = Depends(get_current_owner)):
    restaurants = list(get_restaurants_collection().find({"owner_id": current_user.id}))
    return [restaurant_out(r) for r in restaurants]


@router.get("/restaurant")
def get_owner_restaurant(current_user: UserDoc = Depends(get_current_owner)):
    r = get_restaurants_collection().find_one({"owner_id": current_user.id})
    if not r:
        raise HTTPException(404, "No restaurant found")
    return restaurant_out(r)


@router.get("/dashboard")
def get_dashboard(current_user: UserDoc = Depends(get_current_owner)):
    restaurants = list(get_restaurants_collection().find({"owner_id": current_user.id}))
    if not restaurants:
        return {
            "restaurants": [],
            "total_views": 0, "avg_rating": 0,
            "total_reviews": 0, "favourites_count": 0,
            "rating_distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            "recent_reviews": [],
        }

    reviews_col = get_reviews_collection()
    favs_col = get_favourites_collection()

    all_reviews = []
    restaurant_stats = []
    for r in restaurants:
        rid = str(r["_id"])
        reviews = list(reviews_col.find({"restaurant_id": rid}))
        all_reviews.extend(reviews)
        fav_count = favs_col.count_documents({"restaurant_id": rid})
        restaurant_stats.append({
            "id": rid,
            "name": r.get("name"),
            "cuisine_type": r.get("cuisine_type"),
            "avg_rating": r.get("avg_rating", 0.0),
            "review_count": r.get("review_count", 0),
            "view_count": r.get("view_count", 0),
            "favourites_count": fav_count,
        })

    dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for rev in all_reviews:
        rating = rev.get("rating")
        if rating in dist:
            dist[rating] += 1

    recent = sorted(all_reviews, key=lambda x: x.get("created_at") or 0, reverse=True)[:10]
    rest_map = {str(r["_id"]): r for r in restaurants}

    return {
        "restaurants": restaurant_stats,
        "total_views": sum(r.get("view_count", 0) for r in restaurant_stats),
        "avg_rating": round(
            sum(r.get("avg_rating", 0) for r in restaurant_stats) / len(restaurant_stats), 2
        ),
        "total_reviews": len(all_reviews),
        "favourites_count": sum(r.get("favourites_count", 0) for r in restaurant_stats),
        "rating_distribution": dist,
        "recent_reviews": [
            {
                "id": str(rev["_id"]),
                "restaurant_name": rest_map.get(rev.get("restaurant_id", ""), {}).get("name", ""),
                "user_name": rev.get("user_name", "Unknown"),
                "rating": rev.get("rating"),
                "comment": rev.get("comment"),
                "created_at": rev.get("created_at"),
            }
            for rev in recent
        ],
    }


@router.get("/search-unclaimed")
def search_unclaimed(q: str = "", current_user: UserDoc = Depends(get_current_owner)):
    mongo_filter: dict = {"owner_id": None}
    if q:
        mongo_filter["name"] = _ilike(q)
    results = list(get_restaurants_collection().find(mongo_filter).limit(10))
    return [restaurant_out(r) for r in results]


@router.post("/claim/{restaurant_id}")
def claim_restaurant(restaurant_id: str, current_user: UserDoc = Depends(get_current_owner)):
    try:
        oid = to_oid(restaurant_id)
    except Exception:
        raise HTTPException(404, "Restaurant not found")
    r = get_restaurants_collection().find_one({"_id": oid})
    if not r:
        raise HTTPException(404, "Restaurant not found")
    if r.get("owner_id"):
        raise HTTPException(400, "This restaurant has already been claimed")
    get_restaurants_collection().update_one({"_id": oid}, {"$set": {"owner_id": current_user.id}})
    return {"detail": f"Successfully claimed {r['name']}"}


@router.post("/release/{restaurant_id}")
def release_restaurant(restaurant_id: str, current_user: UserDoc = Depends(get_current_owner)):
    try:
        oid = to_oid(restaurant_id)
    except Exception:
        raise HTTPException(404, "Restaurant not found or not yours")
    r = get_restaurants_collection().find_one({"_id": oid, "owner_id": current_user.id})
    if not r:
        raise HTTPException(404, "Restaurant not found or not yours")
    get_restaurants_collection().update_one({"_id": oid}, {"$set": {"owner_id": None}})
    return {"detail": f"Released {r['name']}"}
