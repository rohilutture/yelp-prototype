import os, shutil, re
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from core.security import get_current_user, get_optional_user, UserDoc
from core.config import get_settings
from core.kafka import publish_event
from core.mongo import (
    get_restaurants_collection, get_favourites_collection, to_oid, doc_id
)
from schemas.schemas import RestaurantUpdate

router = APIRouter(prefix="/restaurants", tags=["Restaurants"])
settings = get_settings()


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
        "added_by": r.get("added_by"),
        "owner_id": r.get("owner_id"),
        "created_at": r.get("created_at"),
    }


@router.get("/search")
def search_restaurants(
    q: Optional[str] = Query(None),
    cuisine: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    price: Optional[int] = Query(None),
):
    restaurants = get_restaurants_collection()
    mongo_filter: dict = {}

    if q:
        mongo_filter["$or"] = [
            {"name": _ilike(q)},
            {"description": _ilike(q)},
            {"cuisine_type": _ilike(q)},
        ]
    if cuisine:
        mongo_filter["cuisine_type"] = _ilike(cuisine)
    if city:
        mongo_filter["city"] = _ilike(city)
    if price is not None:
        mongo_filter["price_range"] = price

    results = list(restaurants.find(mongo_filter).sort("avg_rating", -1).limit(100))
    return [restaurant_out(r) for r in results]


@router.get("/favourites/list")
def get_favourites(current_user: UserDoc = Depends(get_current_user)):
    favs = list(get_favourites_collection().find({"user_id": current_user.id}))
    restaurants = get_restaurants_collection()
    out = []
    for f in favs:
        try:
            r = restaurants.find_one({"_id": to_oid(f["restaurant_id"])})
        except Exception:
            continue
        if r:
            out.append(restaurant_out(r))
    return out


@router.get("")
def get_restaurants():
    results = list(get_restaurants_collection().find({}).sort("avg_rating", -1).limit(50))
    return [restaurant_out(r) for r in results]


@router.get("/{restaurant_id}")
def get_restaurant(restaurant_id: str):
    try:
        oid = to_oid(restaurant_id)
    except Exception:
        raise HTTPException(404, "Restaurant not found")
    r = get_restaurants_collection().find_one_and_update(
        {"_id": oid},
        {"$inc": {"view_count": 1}},
        return_document=True,
    )
    if not r:
        raise HTTPException(404, "Restaurant not found")
    return restaurant_out(r)


@router.post("", status_code=201)
async def create_restaurant(
    name: str = Form(...),
    cuisine_type: str = Form(...),
    address: str = Form(...),
    city: str = Form(...),
    phone: Optional[str] = Form(None),
    contact_email: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    hours: Optional[str] = Form(None),
    price_range: int = Form(2),
    amenities: Optional[str] = Form(None),
    photos: list[UploadFile] = File(default=[]),
    current_user: UserDoc = Depends(get_current_user),
):
    import json as _json
    photo_urls = []
    if photos:
        upload_dir = os.path.join(settings.UPLOAD_DIR, "restaurants")
        os.makedirs(upload_dir, exist_ok=True)
        for photo in photos:
            if photo.filename:
                ext = os.path.splitext(photo.filename)[1]
                fname = f"{name.replace(' ', '_')}_{len(photo_urls)}{ext}"
                path = os.path.join(upload_dir, fname)
                with open(path, "wb") as f:
                    shutil.copyfileobj(photo.file, f)
                photo_urls.append(f"/{path}")

    amenities_list = []
    if amenities:
        try:
            amenities_list = _json.loads(amenities)
        except Exception:
            amenities_list = []

    doc = {
        "name": name,
        "cuisine_type": cuisine_type,
        "address": address,
        "city": city,
        "phone": phone,
        "contact_email": contact_email,
        "description": description,
        "hours": hours,
        "price_range": price_range,
        "amenities": amenities_list,
        "photos": photo_urls,
        "avg_rating": 0.0,
        "review_count": 0,
        "view_count": 0,
        "added_by": current_user.id,
        "owner_id": current_user.id if current_user.role == "owner" else None,
        "created_at": datetime.now(timezone.utc),
    }
    result = get_restaurants_collection().insert_one(doc)
    doc["_id"] = result.inserted_id
    publish_event("restaurant.created", {
        "restaurant_id": str(result.inserted_id),
        "name": name,
        "added_by": current_user.id,
        "owner_id": doc["owner_id"],
    })
    return restaurant_out(doc)


@router.put("/{restaurant_id}")
def update_restaurant(
    restaurant_id: str,
    body: RestaurantUpdate,
    current_user: UserDoc = Depends(get_current_user),
):
    try:
        oid = to_oid(restaurant_id)
    except Exception:
        raise HTTPException(404, "Not found")
    r = get_restaurants_collection().find_one({"_id": oid})
    if not r:
        raise HTTPException(404, "Not found")
    if r.get("added_by") != current_user.id and r.get("owner_id") != current_user.id and current_user.role != "owner":
        raise HTTPException(403, "Not authorized")

    updates = body.model_dump(exclude_none=True)
    if not updates:
        return restaurant_out(r)
    updates["updated_at"] = datetime.now(timezone.utc)
    get_restaurants_collection().update_one({"_id": oid}, {"$set": updates})
    return restaurant_out({**r, **updates, "_id": oid})


@router.delete("/{restaurant_id}", status_code=204)
def delete_restaurant(restaurant_id: str, current_user: UserDoc = Depends(get_current_user)):
    try:
        oid = to_oid(restaurant_id)
    except Exception:
        raise HTTPException(404, "Not found")
    r = get_restaurants_collection().find_one({"_id": oid})
    if not r:
        raise HTTPException(404, "Not found")
    if r.get("added_by") != current_user.id and current_user.role != "owner":
        raise HTTPException(403, "Not authorized")
    get_restaurants_collection().delete_one({"_id": oid})


@router.post("/favourites/{restaurant_id}")
def toggle_favourite(restaurant_id: str, current_user: UserDoc = Depends(get_current_user)):
    favs = get_favourites_collection()
    existing = favs.find_one({"user_id": current_user.id, "restaurant_id": restaurant_id})
    if existing:
        favs.delete_one({"_id": existing["_id"]})
        return {"favourited": False}
    favs.insert_one({
        "user_id": current_user.id,
        "restaurant_id": restaurant_id,
        "created_at": datetime.now(timezone.utc),
    })
    return {"favourited": True}


@router.post("/{restaurant_id}/claim")
def claim_restaurant(restaurant_id: str, current_user: UserDoc = Depends(get_current_user)):
    if current_user.role != "owner":
        raise HTTPException(403, "Only owners can claim restaurants")
    try:
        oid = to_oid(restaurant_id)
    except Exception:
        raise HTTPException(404, "Not found")
    r = get_restaurants_collection().find_one({"_id": oid})
    if not r:
        raise HTTPException(404, "Not found")
    if r.get("owner_id"):
        raise HTTPException(400, "Already claimed")
    get_restaurants_collection().update_one({"_id": oid}, {"$set": {"owner_id": current_user.id}})
    return {"detail": "Restaurant claimed successfully"}
