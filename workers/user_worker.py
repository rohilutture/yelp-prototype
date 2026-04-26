import json

from kafka import KafkaConsumer

from core.config import get_settings
from core.mongo import get_activity_logs_collection

settings = get_settings()


def run():
    consumer = KafkaConsumer(
        "user.created",
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        group_id="user-worker-group",
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
        auto_offset_reset="earliest",
        enable_auto_commit=True,
        api_version=(2, 5, 0),
        request_timeout_ms=30000,
        connections_max_idle_ms=60000,
    )
    logs = get_activity_logs_collection()
    for message in consumer:
        logs.insert_one({
            "type": "user_event",
            "topic": message.topic,
            "status": "processed",
            "payload": message.value,
        })


if __name__ == "__main__":
    run()
