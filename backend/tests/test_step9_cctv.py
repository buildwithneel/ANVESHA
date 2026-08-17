import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.seed import seed_database

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    seed_database(reset=True)

client = TestClient(app)

def test_get_cctv_cameras_list():
    response = client.get("/api/cameras")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 24

    # Verify demo cameras from requirement 20
    cam1 = next((c for c in data if c["id"] == "CAM-01"), None)
    assert cam1 is not None
    assert cam1["status"] == "LIVE"
    assert cam1["zone"] == "Platform 1"
    assert "last_heartbeat" in cam1
    assert "active_alert_count" in cam1

    cam7 = next((c for c in data if c["id"] == "CAM-07"), None)
    assert cam7 is not None
    assert cam7["status"] == "LIVE"
    assert cam7["zone"] == "Platform 3"
    assert cam7["active_alert_count"] >= 1

    cam8 = next((c for c in data if c["id"] == "CAM-08"), None)
    assert cam8 is not None
    assert cam8["status"] == "DEGRADED"

    cam12 = next((c for c in data if c["id"] == "CAM-12"), None)
    assert cam12 is not None
    assert cam12["status"] == "LIVE"
    assert cam12["zone"] == "FOB"

    cam18 = next((c for c in data if c["id"] == "CAM-18"), None)
    assert cam18 is not None
    assert cam18["status"] == "LIVE"
    assert cam18["zone"] == "Maintenance Area"

    cam21 = next((c for c in data if c["id"] == "CAM-21"), None)
    assert cam21 is not None
    assert cam21["status"] == "OFFLINE"
    assert cam21["zone"] == "Track Area"

def test_cctv_camera_search():
    # Search by Camera ID
    res = client.get("/api/cameras", params={"search": "CAM-07"})
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["id"] == "CAM-07"

    # Search by Location / Zone
    res = client.get("/api/cameras", params={"search": "foot-overbridge"})
    assert res.status_code == 200
    assert len(res.json()) >= 1

    # Search case-insensitive
    res = client.get("/api/cameras", params={"search": "track area"})
    assert res.status_code == 200
    assert len(res.json()) >= 3

def test_cctv_camera_filters():
    # Zone filter
    res = client.get("/api/cameras", params={"zone": "Platform 1"})
    assert res.status_code == 200
    assert all("Platform 1" in c["zone"] or "Platform 1" in c["location"] for c in res.json())

    # Status filter
    res = client.get("/api/cameras", params={"status": "OFFLINE"})
    assert res.status_code == 200
    assert all(c["status"] == "OFFLINE" for c in res.json())
    assert any(c["id"] == "CAM-21" for c in res.json())

    # Degraded filter
    res = client.get("/api/cameras", params={"status": "DEGRADED"})
    assert res.status_code == 200
    assert any(c["id"] == "CAM-08" for c in res.json())

    # AI Activity filter (Alert)
    res = client.get("/api/cameras", params={"ai_activity": "Alert"})
    assert res.status_code == 200
    assert any(c["id"] == "CAM-07" for c in res.json())

def test_cctv_camera_details():
    res = client.get("/api/cameras/CAM-07")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "CAM-07"
    assert data["location"] == "Platform 3 North Foot-Overbridge"
    assert data["status"] == "LIVE"
    assert data["active_alert_count"] >= 1
    assert data["current_detection"] is not None

def test_cctv_camera_events_history():
    res = client.get("/api/cameras/CAM-07/events", params={"time_range": "today"})
    assert res.status_code == 200
    events = res.json()
    assert isinstance(events, list)
    assert len(events) >= 1
    ev = events[0]
    assert ev["camera_id"] == "CAM-07"
    assert "event_type" in ev
    assert "confidence" in ev
    assert "severity" in ev
    assert "timestamp" in ev

def test_cctv_take_snapshot():
    res = client.post("/api/cameras/CAM-07/snapshot", json={"note": "Manual operator snapshot"})
    assert res.status_code == 200
    snap = res.json()
    assert snap["camera_id"] == "CAM-07"
    assert "timestamp" in snap
    assert "location" in snap
    assert snap["location"] == "Platform 3 North Foot-Overbridge"

def test_cctv_health_summary():
    res = client.get("/api/cameras/health/summary")
    assert res.status_code == 200
    health = res.json()
    assert health["total_cameras"] >= 24
    assert health["online_count"] >= 18
    assert health["degraded_count"] >= 1
    assert health["offline_count"] >= 1
    assert health["maintenance_count"] >= 2
    assert health["network_health_pct"] > 0
    assert health["ai_health_pct"] > 0
