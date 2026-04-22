import json

from kafka import KafkaConsumer

from core.config import get_settings
from core.database import SessionLocal
from core.kafka import build_producer
from core.mongo import get_activity_logs_collection
from models.restaurant import Restaurant
from models.review import Review

settings = get_settings()


def _recalc_rating(restaurant_id: int, db):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        return
    reviews = db.query(Review).filter(Review.restaurant_id == restaurant_id).all()
    restaurant.review_count = len(reviews)
    restaurant.avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 2) if reviews else 0.0
    db.commit()


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
    )
    producer = build_producer()
    logs = get_activity_logs_collection()

    for message in consumer:
        topic = message.topic
        payload = message.value
        db = SessionLocal()
        status = "success"
        detail = ""
        try:
            if topic == "review.created":
                existing = db.query(Review).filter(
                    Review.restaurant_id == payload["restaurant_id"],
                    Review.user_id == payload["user_id"],
                ).first()
                if not existing:
                    review = Review(
                        restaurant_id=payload["restaurant_id"],
                        user_id=payload["user_id"],
                        rating=payload["rating"],
                        comment=payload.get("comment"),
                    )
                    db.add(review)
                    db.commit()
                _recalc_rating(payload["restaurant_id"], db)
            elif topic == "review.updated":
                review = db.query(Review).filter(Review.id == payload["review_id"]).first()
                if review:
                    if payload.get("rating") is not None:
                        review.rating = payload["rating"]
                    if payload.get("comment") is not None:
                        review.comment = payload["comment"]
                    db.commit()
                    _recalc_rating(review.restaurant_id, db)
            elif topic == "review.deleted":
                review = db.query(Review).filter(Review.id == payload["review_id"]).first()
                if review:
                    restaurant_id = review.restaurant_id
                    db.delete(review)
                    db.commit()
                    _recalc_rating(restaurant_id, db)
        except Exception as exc:
            db.rollback()
            status = "failed"
            detail = str(exc)
        finally:
            db.close()

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


if __name__ == "__main__":
    run()
