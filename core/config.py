from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/yelp_db"
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "yelp_lab2"
    SECRET_KEY: str = "change-this-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    UPLOAD_DIR: str = "uploads"
    OPENAI_API_KEY: str = ""
    TAVILY_API_KEY: str = ""
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_CONSUMER_GROUP_REVIEW: str = "review-worker-group"
    KAFKA_CONSUMER_GROUP_RESTAURANT: str = "restaurant-worker-group"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
