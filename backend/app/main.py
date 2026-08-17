from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.config import settings
from app.database.connection import engine, Base, get_db, SessionLocal
from app.database.models import Station, User, AuditLog
from app.database.seed import seed_database
from app.websocket.manager import ws_manager

from app.routes.cameras import router as cameras_router
from app.routes.alerts import router as alerts_router
from app.routes.incidents import router as incidents_router
from app.routes.detections import router as detections_router
from app.routes.dashboard import router as dashboard_router
from app.routes.crowd import router as crowd_router
from app.routes.worksites import router as worksites_router
from app.routes.ai import router as ai_router
from app.routes.auth import router as auth_router
from app.routes.system import router as system_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist, seed demo data if database is fresh or missing users
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        user_exists = db.query(User).first()
        if not user_exists:
            print("[STARTUP] Database fresh or missing auth tables. Seeding Vadodara Railway Station demo data...")
            seed_database(reset=True)
    except Exception as e:
        print(f"[STARTUP] Seeding table migration: {e}")
        seed_database(reset=True)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="RailGuard AI - Railway Safety & Surveillance Backend API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"^http:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

# Register REST API Routers
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(system_router, prefix=settings.API_V1_PREFIX)
app.include_router(cameras_router, prefix=settings.API_V1_PREFIX)
app.include_router(alerts_router, prefix=settings.API_V1_PREFIX)
app.include_router(incidents_router, prefix=settings.API_V1_PREFIX)
app.include_router(detections_router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_V1_PREFIX)
app.include_router(crowd_router, prefix=settings.API_V1_PREFIX)
app.include_router(worksites_router, prefix=settings.API_V1_PREFIX)
app.include_router(ai_router, prefix=settings.API_V1_PREFIX)

@app.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint returning API status, database connectivity, and timestamp.
    """
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "ok",
        "api": "healthy",
        "database": db_status,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

async def handle_websocket_loop(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

@app.websocket("/ws/events")
async def websocket_events_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time broadcasts of detections, alerts, incidents, and camera changes.
    """
    await handle_websocket_loop(websocket)

@app.websocket("/ws")
async def websocket_default_endpoint(websocket: WebSocket):
    """Legacy /ws fallback alias."""
    await handle_websocket_loop(websocket)

@app.get("/", tags=["Root"])
def root():
    return {
        "name": "RailGuard AI Backend API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "status": "operational"
    }
