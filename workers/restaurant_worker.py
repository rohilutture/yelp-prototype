import json

from kafka import KafkaConsumer

from core.config import get_settings
from core.mongo import get_activity_logs_collection

settings = get_settings()


def run():
    consumer = KafkaConsumer(
        "restaurant.created",
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        group_id=settings.KAFKA_CONSUMER_GROUP_RESTAURANT,
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
        auto_offset_reset="earliest",
        enable_auto_commit=True,
        api_version=(2, 5, 0),
        request_timeout_ms=30000,
        connections_max_idle_ms=60000,
    )
    logs = get_activity_logs_collection()
    for message in consumer:
        payload = message.value
        logs.insert_one({
            "type": "restaurant_event",
            "topic": message.topic,
            "event_id": payload.get("event_id"),
            "status": "processed",
            "payload": payload,
        })


if __name__ == "__main__":
    run()
