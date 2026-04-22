import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from core.database import engine
from core.config import get_settings
from core.kafka import ensure_topics
import models  # registers all models with Base

from routers import auth, users, restaurants, reviews, owner, ai_assistant

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    from core.database import Base
    Base.metadata.create_all(bind=engine)
    # Ensure upload dirs exist
    for sub in ["avatars", "restaurants"]:
        os.makedirs(os.path.join(settings.UPLOAD_DIR, sub), exist_ok=True)
    try:
        ensure_topics()
    except Exception:
        # Kafka may be unavailable in local-only development.
        pass
    yield

app = FastAPI(
    title="Yelp Prototype API",
    description="Restaurant discovery and review platform",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Static file serving for uploads ─────────────────────────────────────────
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# ─── Routers ──────────────────────────────────────────────────────────────────
service_scope = os.getenv("SERVICE_SCOPE", "all")
if service_scope in ("all", "user"):
    app.include_router(auth.router)
    app.include_router(users.router)
if service_scope in ("all", "restaurant"):
    app.include_router(restaurants.router)
if service_scope in ("all", "review"):
    app.include_router(reviews.router)
if service_scope in ("all", "owner"):
    app.include_router(owner.router)
if service_scope in ("all", "ai"):
    app.include_router(ai_assistant.router)

@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Yelp Prototype API running"}

@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
