from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.database import Database
from bson import ObjectId
from core.config import get_settings

settings = get_settings()

_client: MongoClient | None = None


def get_mongo_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(settings.MONGODB_URL)
    return _client


def get_mongo_db() -> Database:
    return get_mongo_client()[settings.MONGO_DB_NAME]


# ─── Collection accessors ─────────────────────────────────────────────────────

def get_users_collection():
    return get_mongo_db()["users"]

def get_restaurants_collection():
    return get_mongo_db()["restaurants"]

def get_reviews_collection():
    return get_mongo_db()["reviews"]

def get_favourites_collection():
    return get_mongo_db()["favourites"]

def get_preferences_collection():
    return get_mongo_db()["user_preferences"]

def get_sessions_collection():
    return get_mongo_db()["sessions"]

def get_activity_logs_collection():
    return get_mongo_db()["activity_logs"]


# ─── Index setup (called once on startup) ────────────────────────────────────

def setup_indexes():
    db = get_mongo_db()

    db["users"].create_index("email", unique=True)
    db["users"].create_index("role")

    db["restaurants"].create_index([("avg_rating", DESCENDING)])
    db["restaurants"].create_index("name")
    db["restaurants"].create_index("cuisine_type")
    db["restaurants"].create_index("city")
    db["restaurants"].create_index("owner_id")
    db["restaurants"].create_index("added_by")

    db["reviews"].create_index("restaurant_id")
    db["reviews"].create_index("user_id")
    db["reviews"].create_index(
        [("restaurant_id", ASCENDING), ("user_id", ASCENDING)],
        unique=True,
    )

    db["favourites"].create_index(
        [("user_id", ASCENDING), ("restaurant_id", ASCENDING)],
        unique=True,
    )

    db["user_preferences"].create_index("user_id", unique=True)

    db["sessions"].create_index("token", unique=True)
    db["sessions"].create_index("expires_at", expireAfterSeconds=0)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def to_oid(id_str: str) -> ObjectId:
    """Convert a string to ObjectId, raising ValueError on bad format."""
    return ObjectId(id_str)


def doc_id(doc: dict) -> str:
    return str(doc["_id"])
