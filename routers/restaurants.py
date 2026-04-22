import json, os, shutil
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import or_
from core.database import get_db
from core.security import get_current_user, get_optional_user
from core.config import get_settings
from core.kafka import publish_event
from models.restaurant import Restaurant
from models.review import Favourite
from models.user import User
from schemas.schemas import RestaurantCreate, RestaurantUpdate, RestaurantOut

router = APIRouter(prefix="/restaurants", tags=["Restaurants"])
settings = get_settings()

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
        "added_by": r.added_by, "owner_id": r.owner_id,
        "created_at": r.created_at,
    }

# ─── Search ───────────────────────────────────────────────────────────────────
@router.get("/search")
def search_restaurants(
    q: Optional[str] = Query(None),
    cuisine: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    price: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Restaurant)
    if q:
        query = query.filter(or_(
            Restaurant.name.ilike(f"%{q}%"),
            Restaurant.description.ilike(f"%{q}%"),
            Restaurant.cuisine_type.ilike(f"%{q}%"),
        ))
    if cuisine:
        query = query.filter(Restaurant.cuisine_type.ilike(f"%{cuisine}%"))
    if city:
        query = query.filter(Restaurant.city.ilike(f"%{city}%"))
    if price:
        query = query.filter(Restaurant.price_range == price)
    results = query.order_by(Restaurant.avg_rating.desc()).limit(100).all()
    return [restaurant_out(r) for r in results]

# ─── Get all ──────────────────────────────────────────────────────────────────
@router.get("")
def get_restaurants(db: Session = Depends(get_db)):
    results = db.query(Restaurant).order_by(Restaurant.avg_rating.desc()).limit(50).all()
    return [restaurant_out(r) for r in results]

# ─── Get by ID ────────────────────────────────────────────────────────────────
@router.get("/{restaurant_id}")
def get_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(404, "Restaurant not found")
    r.view_count = (r.view_count or 0) + 1
    db.commit()
    return restaurant_out(r)

# ─── Create ───────────────────────────────────────────────────────────────────
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
    amenities: Optional[str] = Form(None),   # JSON string
    photos: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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

    restaurant = Restaurant(
        name=name, cuisine_type=cuisine_type, address=address, city=city,
        phone=phone, contact_email=contact_email, description=description,
        hours=hours, price_range=price_range,
        amenities=amenities or "[]",
        photos=json.dumps(photo_urls),
        added_by=current_user.id,
    )
    db.add(restaurant); db.commit(); db.refresh(restaurant)
    publish_event("restaurant.created", {
        "restaurant_id": restaurant.id,
        "name": restaurant.name,
        "added_by": current_user.id,
        "owner_id": restaurant.owner_id,
    })
    return restaurant_out(restaurant)

# ─── Update ───────────────────────────────────────────────────────────────────
@router.put("/{restaurant_id}")
def update_restaurant(restaurant_id: int, body: RestaurantUpdate,
                      db: Session = Depends(get_db),
                      current_user: User = Depends(get_current_user)):
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(404, "Not found")
    if r.added_by != current_user.id and r.owner_id != current_user.id and current_user.role != "owner":
        raise HTTPException(403, "Not authorized")
    for k, v in body.model_dump(exclude_none=True).items():
        if k == "amenities":
            setattr(r, k, json.dumps(v))
        else:
            setattr(r, k, v)
    db.commit(); db.refresh(r)
    return restaurant_out(r)

# ─── Delete ───────────────────────────────────────────────────────────────────
@router.delete("/{restaurant_id}", status_code=204)
def delete_restaurant(restaurant_id: int, db: Session = Depends(get_db),
                      current_user: User = Depends(get_current_user)):
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(404, "Not found")
    if r.added_by != current_user.id and current_user.role != "owner":
        raise HTTPException(403, "Not authorized")
    db.delete(r); db.commit()

# ─── Favourites ───────────────────────────────────────────────────────────────
@router.get("/favourites/list")
def get_favourites(db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    favs = db.query(Favourite).filter(Favourite.user_id == current_user.id).all()
    return [restaurant_out(f.restaurant) for f in favs if f.restaurant]

@router.post("/favourites/{restaurant_id}")
def toggle_favourite(restaurant_id: int, db: Session = Depends(get_db),
                     current_user: User = Depends(get_current_user)):
    fav = db.query(Favourite).filter(
        Favourite.user_id == current_user.id,
        Favourite.restaurant_id == restaurant_id
    ).first()
    if fav:
        db.delete(fav); db.commit()
        return {"favourited": False}
    fav = Favourite(user_id=current_user.id, restaurant_id=restaurant_id)
    db.add(fav); db.commit()
    return {"favourited": True}

# ─── Claim ────────────────────────────────────────────────────────────────────
@router.post("/{restaurant_id}/claim")
def claim_restaurant(restaurant_id: int, db: Session = Depends(get_db),
                     current_user: User = Depends(get_current_user)):
    if current_user.role != "owner":
        raise HTTPException(403, "Only owners can claim restaurants")
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(404, "Not found")
    if r.owner_id:
        raise HTTPException(400, "Already claimed")
    r.owner_id = current_user.id
    db.commit()
    return {"detail": "Restaurant claimed successfully"}
