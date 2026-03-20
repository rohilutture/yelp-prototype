import json, os, shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user
from core.config import get_settings
from models.user import User
from models.review import UserPreference, Review
from models.restaurant import Restaurant
from schemas.schemas import UserUpdate, PreferencesIn, PreferencesOut

router = APIRouter(prefix="/users", tags=["Users"])
settings = get_settings()

# ─── Profile ──────────────────────────────────────────────────────────────────
@router.get("/profile")
def get_profile(current_user: User = Depends(get_current_user)):
    langs = []
    if current_user.languages:
        try: langs = json.loads(current_user.languages)
        except: pass
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
        "languages": langs,
        "avatar_url": current_user.avatar_url,
    }

@router.put("/profile")
def update_profile(body: UserUpdate, db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    for k, v in body.model_dump(exclude_none=True).items():
        if k == "languages":
            setattr(current_user, k, json.dumps(v))
        else:
            setattr(current_user, k, v)
    db.commit(); db.refresh(current_user)
    return {"detail": "Profile updated"}

# ─── Avatar ───────────────────────────────────────────────────────────────────
@router.post("/avatar")
def upload_avatar(file: UploadFile = File(...), db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    upload_dir = os.path.join(settings.UPLOAD_DIR, "avatars")
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    filename = f"user_{current_user.id}{ext}"
    path = os.path.join(upload_dir, filename)
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    current_user.avatar_url = f"/{path}"
    db.commit()
    return {"avatar_url": current_user.avatar_url}

# ─── Preferences ──────────────────────────────────────────────────────────────
@router.get("/preferences", response_model=PreferencesOut)
def get_preferences(db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    prefs = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not prefs:
        return PreferencesOut()
    def jl(v): 
        try: return json.loads(v) if v else []
        except: return []
    return PreferencesOut(
        cuisines=jl(prefs.cuisines),
        price_range=jl(prefs.price_range),
        dietary=jl(prefs.dietary),
        ambiance=jl(prefs.ambiance),
        sort_by=prefs.sort_by or "Rating",
        location=prefs.location,
        radius=prefs.radius or 10,
    )

@router.put("/preferences")
def update_preferences(body: PreferencesIn, db: Session = Depends(get_db),
                       current_user: User = Depends(get_current_user)):
    prefs = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not prefs:
        prefs = UserPreference(user_id=current_user.id)
        db.add(prefs)
    prefs.cuisines    = json.dumps(body.cuisines)
    prefs.price_range = json.dumps(body.price_range)
    prefs.dietary     = json.dumps(body.dietary)
    prefs.ambiance    = json.dumps(body.ambiance)
    prefs.sort_by     = body.sort_by
    prefs.location    = body.location
    prefs.radius      = body.radius
    db.commit()
    return {"detail": "Preferences saved"}

# ─── History ──────────────────────────────────────────────────────────────────
@router.get("/history")
def get_history(db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    reviews = db.query(Review).filter(Review.user_id == current_user.id).order_by(Review.created_at.desc()).all()
    added   = db.query(Restaurant).filter(Restaurant.added_by == current_user.id).order_by(Restaurant.created_at.desc()).all()

    def parse_json(v):
        try: return json.loads(v) if v else []
        except: return []

    return {
        "reviews": [
            {
                "id": r.id,
                "restaurant_id": r.restaurant_id,
                "restaurant_name": r.restaurant.name if r.restaurant else "",
                "rating": r.rating,
                "comment": r.comment,
                "created_at": r.created_at,
            }
            for r in reviews
        ],
        "restaurants_added": [
            {
                "id": r.id,
                "name": r.name,
                "cuisine_type": r.cuisine_type,
                "city": r.city,
                "avg_rating": r.avg_rating,
                "photos": parse_json(r.photos),
            }
            for r in added
        ],
    }
