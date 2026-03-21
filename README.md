# Yelp Prototype

A full-stack restaurant discovery and review platform built with React, FastAPI, MySQL, and an AI-powered chatbot assistant.

> **Lab 1 — Advanced Web Technologies**
> Due: March 24, 2026

---

## Project Structure

```
yelp-prototype/
├── yelp-frontend/       # React 18 + Vite + TailwindCSS
└── yelp-backend/        # Python 3.12 + FastAPI + MySQL
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, Axios, React Router v6 |
| Backend | Python 3.12, FastAPI, SQLAlchemy, Alembic |
| Database | MySQL 8.0 |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| AI Assistant | LangChain, OpenAI GPT-4o-mini, Tavily Search |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- MySQL 8.0+
- Git

---

## Backend Setup

```bash
cd yelp-backend

# 1. Create and configure environment
cp .env.example .env
# Edit .env — add your DB password and API keys

# 2. Create the MySQL database
mysql -u root -p -e "CREATE DATABASE yelp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the server (tables are auto-created on first run)
uvicorn main:app --reload --port 8000

# 5. (Optional) Seed sample data
python seed.py
```

The API will be running at **http://localhost:8000**

Interactive API docs (Swagger UI): **http://localhost:8000/docs**

### Backend Test Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| User | alice@example.com | password123 |
| User | bob@example.com | password123 |
| Owner | marco@example.com | password123 |

---

## Frontend Setup

```bash
cd yelp-frontend

# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

The app will be running at **http://localhost:5173**

> The Vite dev server automatically proxies all `/api/*` requests to the FastAPI backend at `http://localhost:8000` — no extra configuration needed.

---

## Running Both Together

Open two terminal windows:

**Terminal 1 — Backend:**
```bash
cd yelp-backend
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd yelp-frontend
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## Environment Variables

Copy `yelp-backend/.env.example` to `yelp-backend/.env` and fill in:

```env
# Required
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/yelp_db
SECRET_KEY=your-long-random-secret-key

# Optional — enables full AI assistant features
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
```

> The AI assistant works without API keys using a built-in rule-based fallback.

---

## Features

### User (Reviewer)
- Sign up / log in with JWT authentication
- Search and filter restaurants by name, cuisine, city, price
- View restaurant details, photos, hours, and reviews
- Write, edit, and delete your own reviews (1–5 stars)
- Save restaurants to favourites
- View activity history (reviews written + restaurants added)
- Add new restaurant listings with photos
- Manage profile: name, photo, city, languages, preferences
- Chat with the AI assistant for personalised recommendations

### Restaurant Owner
- Separate owner signup and login
- Create and manage restaurant listing
- Claim existing restaurant listings
- View analytics dashboard (views, ratings, review breakdown)
- Read all reviews for owned restaurant

### AI Assistant
- Conversational chatbot powered by LangChain + GPT-4o-mini
- Reads user preferences (cuisine, price, dietary, ambiance) automatically
- Supports multi-turn conversations and follow-up questions
- Optional Tavily web search for enriched context
- Rule-based fallback when no API key is configured

---

## API Documentation

FastAPI generates interactive documentation automatically:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Git Workflow

```bash
# Always pull before starting work
git pull

# After making changes
git add .
git commit -m "brief description of what you changed"
git push
```

---

## Team

| Name | Role |
|---|---|
| Rohil Utture | Frontend (React) |
| Yash Shevkar | Backend (FastAPI + MySQL) |
