import json
from typing import Any

from kafka import KafkaProducer
from kafka.admin import KafkaAdminClient, NewTopic
from kafka.errors import TopicAlreadyExistsError

from core.config import get_settings

settings = get_settings()

TOPICS = [
    "review.created",
    "review.updated",
    "review.deleted",
    "review.status",
    "restaurant.created",
    "user.created",
]


def ensure_topics() -> None:
    admin = KafkaAdminClient(bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS)
    try:
        new_topics = [NewTopic(name=t, num_partitions=1, replication_factor=1) for t in TOPICS]
        admin.create_topics(new_topics=new_topics, validate_only=False)
    except TopicAlreadyExistsError:
        pass
    finally:
        admin.close()


def build_producer() -> KafkaProducer:
    return KafkaProducer(
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
    )


def publish_event(topic: str, payload: dict[str, Any]) -> None:
    try:
        producer = build_producer()
        try:
            producer.send(topic, payload)
            producer.flush()
        finally:
            producer.close()
    except Exception as exc:
        # Kafka unavailable (e.g. local dev without Kafka running) — log and continue.
        print(f"[kafka] WARNING: could not publish to {topic}: {exc}")
