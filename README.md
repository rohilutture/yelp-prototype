# Yelp Prototype - Lab 2

Full-stack Yelp-style restaurant review application built on a microservices architecture with MongoDB, Apache Kafka, Redux Toolkit, Docker Compose, and AWS EC2 deployment.

**Course:** Distributed Systems for Data Engineering
**Due:** April 28, 2026

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

Create `.env` in the project root (no MySQL required — MongoDB only):

```env
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

## JMeter Performance Testing

Test plan is in `jmeter/lab2-performance-test-plan.jmx`. Results are in `results/`.

Run all 5 concurrency levels:

```bash
jmeter -n -t jmeter/lab2-performance-test-plan.jmx -Jconcurrency=100 -l results/results_100.jtl
jmeter -n -t jmeter/lab2-performance-test-plan.jmx -Jconcurrency=200 -l results/results_200.jtl
jmeter -n -t jmeter/lab2-performance-test-plan.jmx -Jconcurrency=300 -l results/results_300.jtl
jmeter -n -t jmeter/lab2-performance-test-plan.jmx -Jconcurrency=400 -l results/results_400.jtl
jmeter -n -t jmeter/lab2-performance-test-plan.jmx -Jconcurrency=500 -l results/results_500.jtl
```

Generate HTML reports:

```bash
jmeter -g results/results_500.jtl -o results/html_500
```

| Concurrent Users | Avg Response (ms) | Throughput (req/s) | Error % |
|---|---|---|---|
| 100 | 330 | 23.8 | 11.95% |
| 200 | 944 | 44.1 | 1.60% |
| 300 | 3,852 | 43.5 | 0.00% |
| 400 | 6,365 | 44.3 | 0.05% |
| 500 | 9,199 | 44.4 | 0.00% |

## AWS Deployment

The application was deployed to AWS EC2 (t3.medium, Ubuntu 24.04, us-west-2).

Steps to redeploy:

```bash
# Launch EC2 t3.medium with ports 22, 5173, 8000 open
# SSH in
ssh -i yelp-lab2-key.pem ubuntu@<EC2-PUBLIC-IP>

# Install Docker
sudo apt update && sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker ubuntu
newgrp docker

# Copy project and run
scp -r yelp-prototype ubuntu@<EC2-PUBLIC-IP>:~/
cd ~/yelp-prototype
docker compose up -d
```

App accessible at `http://<EC2-PUBLIC-IP>:5173`

## Notes

- MySQL has been fully removed. MongoDB is the only database.
- Passwords are hashed with bcrypt (`core/security.py`).
- Session records are persisted in MongoDB with TTL expiry (`core/mongo.py`).
- Kafka publish is fault-tolerant — wrapped in try/except so the app works without Kafka running.
- All MongoDB IDs are ObjectId strings (no integer auto-increment PKs).
