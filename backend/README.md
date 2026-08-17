# RailGuard AI Backend

FastAPI & SQLAlchemy backend service for RailGuard AI intelligent railway safety, crowd monitoring, and surveillance platform.

## Architecture

- **Web Framework**: FastAPI (Async REST + WebSockets)
- **ORM & Database**: SQLAlchemy with SQLite (`railguard.db`)
- **Validation**: Pydantic v2
- **Real-Time Engine**: WebSocket Connection Manager for live alert/detection broadcasting

---

## Directory Structure

```
backend/
├── app/
│   ├── main.py              # Application entrypoint & middleware configuration
│   ├── config.py            # Pydantic BaseSettings environment configuration
│   ├── database/
│   │   ├── connection.py    # Engine & SessionLocal setup
│   │   ├── models.py        # SQLAlchemy models (Station, Camera, Detection, Alert, Incident, Crowd)
│   │   └── seed.py          # Vadodara Station demo data seeder & reset utility
│   ├── schemas/
│   │   ├── camera.py        # Camera Pydantic schemas
│   │   ├── alert.py         # Alert schemas
│   │   ├── incident.py      # Incident schemas
│   │   ├── detection.py     # ML Detection ingestion schema
│   │   ├── crowd.py         # Crowd measurement schema
│   │   └── dashboard.py     # Summary statistics response schema
│   ├── routes/
│   │   ├── cameras.py       # Camera CRUD routes
│   │   ├── alerts.py        # Alert query & status update routes
│   │   ├── incidents.py     # Incident query & creation routes
│   │   ├── detections.py    # ML Detection ingestion routes
│   │   └── dashboard.py     # Dashboard summary aggregate route
│   ├── services/
│   │   ├── alert_service.py # Alert business logic & notifications
│   │   ├── incident_service.py # Incident management
│   │   └── detection_service.py # ML event ingestion & alert triggering
│   └── websocket/
│       └── manager.py       # WebSocket client management & event broadcasting
├── requirements.txt
├── .env.example
├── .env
└── README.md
```

---

## Quickstart

### 1. Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### 2. Seed / Reset Demo Database
```bash
cd backend
python -m app.database.seed
```

### 3. Run Development Server
```bash
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 4. Interactive API Documentation
- OpenAPI Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- Health Check: `http://127.0.0.1:8000/health`

---

## API Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | API & database status check |
| `GET` | `/api/dashboard/summary` | Consolidated KPI stats |
| `GET` | `/api/cameras` | List all CCTV cameras |
| `GET` | `/api/cameras/{id}` | Get camera details |
| `POST` | `/api/cameras` | Register new camera |
| `PATCH` | `/api/cameras/{id}` | Update camera status |
| `GET` | `/api/alerts` | List safety/security alerts |
| `GET` | `/api/alerts/{id}` | Get alert details |
| `POST` | `/api/alerts` | Create alert |
| `PATCH` | `/api/alerts/{id}` | Update alert status |
| `GET` | `/api/incidents` | List operational incidents |
| `GET` | `/api/incidents/{id}` | Get incident details |
| `POST` | `/api/incidents` | Create incident ticket |
| `PATCH` | `/api/incidents/{id}` | Update incident ticket |
| `GET` | `/api/detections` | List ML detection events |
| `POST` | `/api/detections` | Ingest ML detection event |
| `WS` | `/ws` | Real-time event subscription stream |
