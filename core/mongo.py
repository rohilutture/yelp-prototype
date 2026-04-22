from pymongo import MongoClient
from pymongo.database import Database

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


def get_sessions_collection():
    return get_mongo_db()["sessions"]


def get_activity_logs_collection():
    return get_mongo_db()["activity_logs"]
