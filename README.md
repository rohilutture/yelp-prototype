# Yelp Prototype - Lab 2

Full-stack Yelp-style application enhanced for Lab 2 with Docker, Kubernetes, Kafka, MongoDB session storage, and Redux Toolkit.

## Lab 2 Deliverables Included

- Dockerfiles for `user`, `owner`, `restaurant`, `review`, and `frontend` services.
- `docker-compose.yml` for local full-stack orchestration with Kafka and MongoDB.
- Kubernetes manifests in `k8s/lab2-stack.yaml`.
- Kafka producer/consumer flow for review and restaurant events.
- MongoDB integration for secure session storage and activity logs.
- Data migration script from MySQL to MongoDB documents.
- Redux store with `auth`, `restaurants`, `reviews`, and `favourites` slices.
- JMeter test plan scaffolding for auth, search, and review endpoints.
- Architecture diagram in `docs/lab2-architecture.md`.

## Repository Structure

```text
yelp-prototype-main/
├── core/                     # Config, DB, security, Mongo, Kafka helpers
├── routers/                  # FastAPI route modules
├── workers/                  # Kafka worker services
├── docker/                   # Service Dockerfiles
├── k8s/                      # Kubernetes manifests
├── scripts/                  # Utility scripts (including Mongo migration)
├── jmeter/                   # JMeter test plan + results template
└── yelp-frontend/            # React + Redux frontend
```

## Prerequisites

- Python 3.12+
- Node.js 18+
- Docker / Docker Compose
- (Optional) Kubernetes cluster (minikube, kind, EKS)

## Environment Variables

Create `.env` in the project root:

```env
DATABASE_URL=mysql+pymysql://root:root@localhost:3306/yelp_db
MONGODB_URL=mongodb://localhost:27017
MONGO_DB_NAME=yelp_lab2
SECRET_KEY=change-this-secret-key
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
OPENAI_API_KEY=
TAVILY_API_KEY=
```

## Local Run (Docker Compose)

```bash
docker compose up --build
```

Services:

- `user-service`: `http://localhost:8001`
- `owner-service`: `http://localhost:8002`
- `restaurant-service`: `http://localhost:8003`
- `review-service`: `http://localhost:8004`
- frontend: `http://localhost:5173`
- Kafka: `localhost:9092`
- MongoDB: `localhost:27017`

## Local Run (Developer Mode)

Backend:

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Frontend:

```bash
cd yelp-frontend
npm install
npm run dev
```

## Kafka Review Flow

1. Client submits review request.
2. Review API publishes to `review.created`, `review.updated`, or `review.deleted`.
3. `workers/review_worker.py` consumes the event and writes changes to DB.
4. Worker recalculates restaurant rating and emits `review.status`.
5. Activity logs are stored in MongoDB.

Architecture diagram: `docs/lab2-architecture.md`.

## MongoDB Migration

Run one-time migration script:

```bash
python scripts/migrate_to_mongodb.py
```

Collections produced:

- `users`
- `restaurants`
- `reviews`
- `favourites`
- `sessions`
- `activity_logs`

## Redux Integration

Redux store is configured in `yelp-frontend/src/store/` with:

- `authSlice`
- `restaurantsSlice`
- `reviewsSlice`
- `favouritesSlice`

Redux DevTools are enabled in development through store configuration.

## Kubernetes Deployment

Apply manifests:

```bash
kubectl apply -f k8s/lab2-stack.yaml
kubectl get pods -n yelp-lab2
kubectl get svc -n yelp-lab2
```

## JMeter

Test plan and templates are provided in `jmeter/`:

- `jmeter/lab2-performance-test-plan.jmx`
- `jmeter/results-summary-template.csv`

Run tests at concurrency levels 100, 200, 300, 400, 500 and update the results template.

## Notes

- Passwords are hashed with bcrypt (`core/security.py`).
- Session records are persisted in MongoDB (`routers/auth.py` + `core/mongo.py`).
- Kafka topic creation is attempted automatically during app startup.
