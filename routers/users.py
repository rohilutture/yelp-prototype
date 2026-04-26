import os, shutil
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from core.security import get_current_user, UserDoc
from core.config import get_settings
from core.mongo import get_users_collection, get_preferences_collection, get_reviews_collection, get_restaurants_collection, to_oid
from schemas.schemas import UserUpdate, PreferencesIn, PreferencesOut

router = APIRouter(prefix="/users", tags=["Users"])
settings = get_settings()


@router.get("/profile")
def get_profile(current_user: UserDoc = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "phone": current_user.phone,
        "about": current_user.about,
        "city": current_user.city,
        "country": current_user.country,
        "gender": current_user.gender,
        "languages": current_user.languages or [],
        "avatar_url": current_user.avatar_url,
    }


@router.put("/profile")
def update_profile(body: UserUpdate, current_user: UserDoc = Depends(get_current_user)):
    updates = body.model_dump(exclude_none=True)
    if not updates:
        return {"detail": "Nothing to update"}
    get_users_collection().update_one(
        {"_id": to_oid(current_user.id)},
        {"$set": {**updates, "updated_at": datetime.now(timezone.utc)}},
    )
    return {"detail": "Profile updated"}


@router.post("/avatar")
def upload_avatar(file: UploadFile = File(...), current_user: UserDoc = Depends(get_current_user)):
    upload_dir = os.path.join(settings.UPLOAD_DIR, "avatars")
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    filename = f"user_{current_user.id}{ext}"
    path = os.path.join(upload_dir, filename)
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    avatar_url = f"/{path}"
    get_users_collection().update_one(
        {"_id": to_oid(current_user.id)},
        {"$set": {"avatar_url": avatar_url}},
    )
    return {"avatar_url": avatar_url}


@router.get("/preferences", response_model=PreferencesOut)
def get_preferences(current_user: UserDoc = Depends(get_current_user)):
    prefs = get_preferences_collection().find_one({"user_id": current_user.id})
    if not prefs:
        return PreferencesOut()
    return PreferencesOut(
        cuisines=prefs.get("cuisines", []),
        price_range=prefs.get("price_range", []),
        dietary=prefs.get("dietary", []),
        ambiance=prefs.get("ambiance", []),
        sort_by=prefs.get("sort_by", "Rating"),
        location=prefs.get("location"),
        radius=prefs.get("radius", 10),
    )


@router.put("/preferences")
def update_preferences(body: PreferencesIn, current_user: UserDoc = Depends(get_current_user)):
    get_preferences_collection().update_one(
        {"user_id": current_user.id},
        {"$set": {
            "user_id": current_user.id,
            "cuisines": body.cuisines,
            "price_range": body.price_range,
            "dietary": body.dietary,
            "ambiance": body.ambiance,
            "sort_by": body.sort_by,
            "location": body.location,
            "radius": body.radius,
            "updated_at": datetime.now(timezone.utc),
        }},
        upsert=True,
    )
    return {"detail": "Preferences saved"}


@router.get("/history")
def get_history(current_user: UserDoc = Depends(get_current_user)):
    reviews_col = get_reviews_collection()
    restaurants_col = get_restaurants_collection()

    reviews = list(reviews_col.find({"user_id": current_user.id}).sort("created_at", -1))
    added = list(restaurants_col.find({"added_by": current_user.id}).sort("created_at", -1))

    review_out = []
    for r in reviews:
        rest = restaurants_col.find_one({"_id": to_oid(r["restaurant_id"])}) if r.get("restaurant_id") else None
        review_out.append({
            "id": str(r["_id"]),
            "restaurant_id": r.get("restaurant_id"),
            "restaurant_name": rest["name"] if rest else "",
            "rating": r.get("rating"),
            "comment": r.get("comment"),
            "created_at": r.get("created_at"),
        })

    rest_out = [
        {
            "id": str(r["_id"]),
            "name": r.get("name"),
            "cuisine_type": r.get("cuisine_type"),
            "city": r.get("city"),
            "avg_rating": r.get("avg_rating", 0),
            "photos": r.get("photos", []),
        }
        for r in added
    ]

    return {"reviews": review_out, "restaurants_added": rest_out}
