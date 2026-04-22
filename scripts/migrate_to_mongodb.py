"""
One-time migration script from MySQL (Lab 1) to MongoDB (Lab 2).

Run:
  python scripts/migrate_to_mongodb.py
"""

import json
from datetime import datetime, timezone

from core.database import SessionLocal
from core.mongo import get_mongo_db
from models.restaurant import Restaurant
from models.review import Favourite, Review, UserPreference
from models.user import User


def _loads(value, default):
    if not value:
        return default
    try:
        return json.loads(value)
    except Exception:
        return default


def migrate():
    db = SessionLocal()
    mongo = get_mongo_db()

    users_col = mongo["users"]
    restaurants_col = mongo["restaurants"]
    reviews_col = mongo["reviews"]
    favourites_col = mongo["favourites"]
    sessions_col = mongo["sessions"]
    activity_logs_col = mongo["activity_logs"]

    users_col.delete_many({})
    restaurants_col.delete_many({})
    reviews_col.delete_many({})
    favourites_col.delete_many({})
    sessions_col.delete_many({})
    activity_logs_col.delete_many({})

    prefs_by_user = {
        p.user_id: p for p in db.query(UserPreference).all()
    }

    for user in db.query(User).all():
        pref = prefs_by_user.get(user.id)
        users_col.insert_one({
            "_id": user.id,
            "name": user.name,
            "email": user.email,
            "hashed_password": user.hashed_password,
            "role": user.role,
            "phone": user.phone,
            "about": user.about,
            "city": user.city,
            "country": user.country,
            "gender": user.gender,
            "languages": _loads(user.languages, []),
            "avatar_url": user.avatar_url,
            "restaurant_location": user.restaurant_location,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "preferences": {
                "cuisines": _loads(pref.cuisines, []) if pref else [],
                "price_range": _loads(pref.price_range, []) if pref else [],
                "dietary": _loads(pref.dietary, []) if pref else [],
                "ambiance": _loads(pref.ambiance, []) if pref else [],
                "sort_by": pref.sort_by if pref else "Rating",
                "location": pref.location if pref else None,
                "radius": pref.radius if pref else 10,
            },
        })

    for restaurant in db.query(Restaurant).all():
        restaurants_col.insert_one({
            "_id": restaurant.id,
            "name": restaurant.name,
            "cuisine_type": restaurant.cuisine_type,
            "address": restaurant.address,
            "city": restaurant.city,
            "phone": restaurant.phone,
            "contact_email": restaurant.contact_email,
            "description": restaurant.description,
            "hours": restaurant.hours,
            "price_range": restaurant.price_range,
            "amenities": _loads(restaurant.amenities, []),
            "photos": _loads(restaurant.photos, []),
            "avg_rating": restaurant.avg_rating,
            "review_count": restaurant.review_count,
            "view_count": restaurant.view_count,
            "added_by": restaurant.added_by,
            "owner_id": restaurant.owner_id,
            "created_at": restaurant.created_at,
            "updated_at": restaurant.updated_at,
        })

    for review in db.query(Review).all():
        reviews_col.insert_one({
            "_id": review.id,
            "restaurant_id": review.restaurant_id,
            "user_id": review.user_id,
            "rating": review.rating,
            "comment": review.comment,
            "photos": _loads(review.photos, []),
            "created_at": review.created_at,
            "updated_at": review.updated_at,
        })

    for fav in db.query(Favourite).all():
        favourites_col.insert_one({
            "_id": fav.id,
            "user_id": fav.user_id,
            "restaurant_id": fav.restaurant_id,
            "created_at": fav.created_at,
        })

    activity_logs_col.insert_one({
        "type": "migration",
        "status": "completed",
        "migrated_at": datetime.now(timezone.utc),
        "counts": {
            "users": users_col.count_documents({}),
            "restaurants": restaurants_col.count_documents({}),
            "reviews": reviews_col.count_documents({}),
            "favourites": favourites_col.count_documents({}),
        },
    })

    db.close()
    print("MongoDB migration complete.")


if __name__ == "__main__":
    migrate()
