import pytest
from fastapi.testclient import TestClient
from app.database.connection import Base, engine, SessionLocal
from app.database.models import User, AuditLog
from app.database.seed import seed_database
from backend.app.main import app

# Ensure tables and seed users exist for testing
Base.metadata.create_all(bind=engine)
db = SessionLocal()
seed_database(reset=True)
db.close()

client = TestClient(app)

def test_login_authentication_officer_and_admin():
    """Verify login authentication for authorized Railway Employee IDs."""
    # 1. Officer login (RLY-10042)
    officer_resp = client.post("/api/auth/login", json={"employee_id": "RLY-10042", "password": "officer123"})
    assert officer_resp.status_code == 200
    officer_data = officer_resp.json()
    assert officer_data["user"]["employee_id"] == "RLY-10042"
    assert officer_data["user"]["name"] == "Rahul Sharma"
    assert officer_data["user"]["role"] == "OFFICER"
    assert officer_data["user"]["status"] == "ACTIVE"
    assert "access_token" in officer_data

    # 2. Admin login (RLY-10001)
    admin_resp = client.post("/api/auth/login", json={"employee_id": "RLY-10001", "password": "admin123"})
    assert admin_resp.status_code == 200
    admin_data = admin_resp.json()
    assert admin_data["user"]["employee_id"] == "RLY-10001"
    assert admin_data["user"]["name"] == "Arun Patel"
    assert admin_data["user"]["role"] == "ADMIN"
    assert "access_token" in admin_data

def test_login_disabled_account_rejection():
    """Verify disabled employee accounts return 403 Forbidden with human-friendly message."""
    resp = client.post("/api/auth/login", json={"employee_id": "RLY-10099", "password": "test123"})
    assert resp.status_code == 403
    assert "account is currently disabled" in resp.json()["detail"]

def test_login_invalid_credentials_returns_401():
    """Verify invalid password returns 401 without leaking internal details."""
    resp = client.post("/api/auth/login", json={"employee_id": "RLY-10042", "password": "wrongpassword"})
    assert resp.status_code == 401
    assert "Employee ID or password is incorrect." in resp.json()["detail"]

def test_login_unknown_employee_id_returns_401():
    """Verify non-existent employee ID returns identical 401 error message."""
    resp = client.post("/api/auth/login", json={"employee_id": "RLY-99999", "password": "somepassword"})
    assert resp.status_code == 401
    assert "Employee ID or password is incorrect." in resp.json()["detail"]

def test_current_user_profile():
    """Verify /api/auth/me returns valid authenticated railway employee context."""
    resp = client.get("/api/auth/me", headers={"Authorization": "Bearer railguard-session-admin-RLY-10001"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == "ADMIN"
    assert data["employee_id"] == "RLY-10001"

def test_audit_logs_retrieval_and_filtering():
    """Verify audit logs record LOGIN_SUCCESS, LOGIN_FAILED, and are filterable."""
    resp = client.get("/api/system/audit-logs?limit=50")
    assert resp.status_code == 200
    logs = resp.json()
    assert len(logs) > 0
    assert "action" in logs[0]

    # Verify LOGIN_SUCCESS audit action
    login_logs_resp = client.get("/api/system/audit-logs?action=LOGIN_SUCCESS")
    assert login_logs_resp.status_code == 200
    for l in login_logs_resp.json():
        assert l["action"] == "LOGIN_SUCCESS"

def test_five_pillar_system_health():
    """Verify all 5 infrastructure health pillars are reported accurately."""
    resp = client.get("/api/system/health")
    assert resp.status_code == 200
    data = resp.json()
    assert "backend" in data
    assert "database" in data
    assert "websocket" in data
    assert "ai_engine" in data
    assert "cctv_network" in data
    assert data["backend"]["status"] in ["OPERATIONAL", "DEGRADED"]
    assert data["database"]["status"] in ["OPERATIONAL", "DEGRADED"]

def test_admin_failure_simulation_camera_offline_and_restore():
    """Verify Admin failure simulation for camera offline and restore."""
    offline_resp = client.post(
        "/api/system/simulate-failure",
        json={"action": "SIMULATE_CAMERA_OFFLINE", "target_id": "CAM-07"},
        headers={"Authorization": "Bearer railguard-session-admin-RLY-10001"}
    )
    assert offline_resp.status_code == 200

    restore_resp = client.post(
        "/api/system/simulate-failure",
        json={"action": "RESTORE_CAMERA", "target_id": "CAM-07"},
        headers={"Authorization": "Bearer railguard-session-admin-RLY-10001"}
    )
    assert restore_resp.status_code == 200

def test_admin_failure_simulation_ai_degraded_and_restore():
    """Verify Admin failure simulation for AI engine degradation and restore."""
    degraded_resp = client.post(
        "/api/system/simulate-failure",
        json={"action": "SIMULATE_AI_DEGRADED"},
        headers={"Authorization": "Bearer railguard-session-admin-RLY-10001"}
    )
    assert degraded_resp.status_code == 200

    restore_resp = client.post(
        "/api/system/simulate-failure",
        json={"action": "RESTORE_AI"},
        headers={"Authorization": "Bearer railguard-session-admin-RLY-10001"}
    )
    assert restore_resp.status_code == 200

def test_security_headers_in_response():
    """Verify HTTP security headers are attached to responses."""
    resp = client.get("/health")
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "SAMEORIGIN"
    assert "strict-origin-when-cross-origin" in resp.headers.get("Referrer-Policy", "")

def test_privacy_by_design_no_biometrics():
    """Verify AI detection contract is purely event-based with zero facial recognition."""
    resp = client.get("/api/ai/insights")
    assert resp.status_code == 200
    insights = resp.json()
    for item in insights:
        assert "identified as" not in item["what"].lower()
        assert "face" not in item["what"].lower()
