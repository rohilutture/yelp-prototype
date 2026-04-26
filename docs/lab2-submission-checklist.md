# Lab 2 Submission Checklist

Use this checklist to verify all deliverables before submitting.

## 1) Docker and Services

- [ ] Build and start all services:
  - `docker compose up -d --build`
- [ ] Confirm all containers are healthy/running:
  - `docker compose ps`
- [ ] Verify backend health:
  - `http://localhost:8001/health`
  - `http://localhost:8002/health`
  - `http://localhost:8003/health`
  - `http://localhost:8004/health`
- [ ] Verify frontend:
  - `http://localhost:5173`
- [ ] Take screenshot of running Docker services.

## 2) Kubernetes Deployment

Note: this requires a working Kubernetes context (minikube/kind/EKS).

- [ ] Build/tag images expected by `k8s/lab2-stack.yaml`:
  - `yelp/user-service:latest`
  - `yelp/owner-service:latest`
  - `yelp/restaurant-service:latest`
  - `yelp/review-service:latest`
  - `yelp/review-worker:latest`
  - `yelp/restaurant-worker:latest`
  - `yelp/user-worker:latest`
  - `yelp/frontend:latest`
- [ ] Apply manifest:
  - `kubectl apply -f k8s/lab2-stack.yaml`
- [ ] Verify namespace resources:
  - `kubectl get pods -n yelp-lab2`
  - `kubectl get svc -n yelp-lab2`
- [ ] Take screenshots of pods and services running (AWS/EKS if required by rubric).

## 3) Kafka Producer/Consumer Validation

- [ ] List Kafka topics:
  - `docker compose exec -T kafka kafka-topics --bootstrap-server kafka:29092 --list`
- [ ] Create a review from UI (or API), confirm response is queued.
- [ ] Verify review appears after worker processing.
- [ ] Check Mongo activity logs:
  - `docker compose exec -T mongodb mongosh --quiet --eval "db.getSiblingDB('yelp_lab2').activity_logs.find().sort({_id:-1}).limit(5).toArray()"`
- [ ] Capture screenshot/log proof of asynchronous flow.

## 4) MongoDB + Security Validation

- [ ] Run migration:
  - `docker compose exec -T -e PYTHONPATH=/app user-service python scripts/migrate_to_mongodb.py`
- [ ] Verify migrated collections:
  - `docker compose exec -T mongodb mongosh --quiet --eval "db=db.getSiblingDB('yelp_lab2'); printjson({users:db.users.countDocuments({}), restaurants:db.restaurants.countDocuments({}), reviews:db.reviews.countDocuments({}), favourites:db.favourites.countDocuments({}), sessions:db.sessions.countDocuments({}), activity_logs:db.activity_logs.countDocuments({})})"`
- [ ] Verify bcrypt hashing is in use (`core/security.py`).
- [ ] Verify session documents are created in Mongo after login.

## 5) Redux Deliverables

- [ ] Confirm slices exist:
  - `authSlice`, `restaurantsSlice`, `reviewsSlice`, `favouritesSlice`
- [ ] Confirm store/provider wiring in `yelp-frontend/src/main.jsx`.
- [ ] Open Redux DevTools while using app and capture screenshots for at least two slices showing state transitions.

## 6) JMeter Performance Testing

Test plan: `jmeter/lab2-performance-test-plan.jmx`

- [ ] Install Apache JMeter on machine.
- [ ] Run tests for each concurrency level:
  - `100`, `200`, `300`, `400`, `500`
- [ ] Example run command:
  - `jmeter -n -t jmeter/lab2-performance-test-plan.jmx -Jconcurrency=100 -l jmeter/results-100.jtl -e -o jmeter/report-100`
- [ ] Record for each required endpoint:
  - average response time
  - throughput (req/sec)
  - error rate
- [ ] Fill `jmeter/results-summary-template.csv`.
- [ ] Generate chart:
  - `python jmeter/plot_results.py`
- [ ] Include screenshot(s) of JMeter reports and performance analysis notes.

