import json
from datetime import datetime, timezone

from bson import ObjectId
from kafka import KafkaConsumer

from core.config import get_settings
from core.kafka import build_producer
from core.mongo import (
    get_reviews_collection, get_restaurants_collection, get_activity_logs_collection
)

settings = get_settings()


def _recalc_rating(restaurant_id: str):
    restaurants = get_restaurants_collection()
    reviews = list(get_reviews_collection().find({"restaurant_id": restaurant_id}))
    count = len(reviews)
    avg = round(sum(r["rating"] for r in reviews) / count, 2) if count else 0.0
    try:
        restaurants.update_one(
            {"_id": ObjectId(restaurant_id)},
            {"$set": {"review_count": count, "avg_rating": avg}},
        )
    except Exception:
        pass


def run():
    consumer = KafkaConsumer(
        "review.created",
        "review.updated",
        "review.deleted",
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        group_id=settings.KAFKA_CONSUMER_GROUP_REVIEW,
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
        auto_offset_reset="earliest",
        enable_auto_commit=True,
        api_version=(2, 5, 0),
        request_timeout_ms=30000,
        connections_max_idle_ms=60000,
    )
    producer = build_producer()
    logs = get_activity_logs_collection()
    reviews = get_reviews_collection()

    print("[review-worker] Connected to Kafka. Waiting for messages on review.created / review.updated / review.deleted ...", flush=True)
    for message in consumer:
        topic = message.topic
        payload = message.value
        status = "success"
        detail = ""
        print(f"[review-worker] Consumed event: topic={topic} event_id={payload.get('event_id')} restaurant_id={payload.get('restaurant_id')}", flush=True)

        try:
            if topic == "review.created":
                restaurant_id = payload["restaurant_id"]
                user_id = payload["user_id"]
                existing = reviews.find_one({"restaurant_id": restaurant_id, "user_id": user_id})
                if not existing:
                    reviews.insert_one({
                        "restaurant_id": restaurant_id,
                        "user_id": user_id,
                        "rating": payload["rating"],
                        "comment": payload.get("comment"),
                        "photos": [],
                        "created_at": datetime.now(timezone.utc),
                    })
                _recalc_rating(restaurant_id)

            elif topic == "review.updated":
                review_id = payload["review_id"]
                try:
                    review = reviews.find_one({"_id": ObjectId(review_id)})
                except Exception:
                    review = None
                if review:
                    updates = {}
                    if payload.get("rating") is not None:
                        updates["rating"] = payload["rating"]
                    if payload.get("comment") is not None:
                        updates["comment"] = payload["comment"]
                    if updates:
                        updates["updated_at"] = datetime.now(timezone.utc)
                        reviews.update_one({"_id": ObjectId(review_id)}, {"$set": updates})
                    _recalc_rating(review["restaurant_id"])

            elif topic == "review.deleted":
                review_id = payload["review_id"]
                restaurant_id = payload.get("restaurant_id")
                try:
                    review = reviews.find_one({"_id": ObjectId(review_id)})
                except Exception:
                    review = None
                if review:
                    restaurant_id = review.get("restaurant_id", restaurant_id)
                    reviews.delete_one({"_id": ObjectId(review_id)})
                if restaurant_id:
                    _recalc_rating(restaurant_id)

        except Exception as exc:
            status = "failed"
            detail = str(exc)

        logs.insert_one({
            "type": "review_event",
            "topic": topic,
            "event_id": payload.get("event_id"),
            "status": status,
            "detail": detail,
            "payload": payload,
        })
        producer.send("review.status", {
            "event_id": payload.get("event_id"),
            "status": status,
            "topic": topic,
            "detail": detail,
        })
        producer.flush()
        print(f"[review-worker] Processed event: topic={topic} status={status}", flush=True)


if __name__ == "__main__":
    run()
