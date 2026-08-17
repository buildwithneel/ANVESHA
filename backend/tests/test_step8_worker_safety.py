import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.seed import seed_database

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    seed_database(reset=True)

client = TestClient(app)

def test_get_worksites_list():
    response = client.get("/api/worksites")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 6
    
    # Check worksite fields
    ws1 = next((w for w in data if w["id"] == "WS-01"), None)
    assert ws1 is not None
    assert ws1["name"] == "Platform 3 Maintenance"
    assert ws1["worker_count"] == 8
    assert ws1["ppe_compliance"] == 96
    assert ws1["status"] == "ACTIVE"
    assert len(ws1["cameras"]) > 0
    assert len(ws1["risk_factors"]) > 0

def test_get_worksites_summary():
    response = client.get("/api/worksites/summary")
    assert response.status_code == 200
    data = response.json()
    assert "active_worksites" in data
    assert "total_workers_detected" in data
    assert data["total_workers_detected"] >= 30
    assert "overall_ppe_compliance" in data
    assert "helmet_compliance" in data
    assert "vest_compliance" in data
    assert len(data["worksites"]) >= 6

def test_get_worksite_details_and_events():
    response = client.get("/api/worksites/WS-01")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "WS-01"
    assert "recent_events" in data
    assert len(data["recent_events"]) > 0

    events_res = client.get("/api/worksites/WS-01/events")
    assert events_res.status_code == 200
    events = events_res.json()
    assert isinstance(events, list)
    assert len(events) >= 3

def test_create_and_update_worksite():
    new_ws = {
        "id": "WS-TEST",
        "name": "Platform 1 Signal Box Upgrade",
        "zone": "Platform 1",
        "type": "Platform Maintenance",
        "status": "ACTIVE",
        "worker_count": 4,
        "ppe_compliance": 95,
        "helmet_compliance": 100,
        "vest_compliance": 90,
        "risk_level": "LOW",
        "risk_score": 20,
        "camera_count": 2,
        "cameras": ["CAM-01", "CAM-02"],
        "risk_factors": [
            {"id": "rf-1", "name": "PPE Compliance", "status": "pass", "description": "Full compliance"}
        ]
    }
    create_res = client.post("/api/worksites", json=new_ws)
    assert create_res.status_code == 201
    assert create_res.json()["id"] == "WS-TEST"

    # Update worksite
    patch_res = client.patch("/api/worksites/WS-TEST", json={"status": "PAUSED", "worker_count": 0})
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "PAUSED"
    assert patch_res.json()["worker_count"] == 0

def test_add_worksite_safety_event_and_alert():
    event_payload = {
        "worksite_id": "WS-01",
        "event_type": "no_helmet",
        "severity": "HIGH",
        "description": "Technician observed removing helmet near edge",
        "camera_id": "CAM-08",
        "confidence": 0.93
    }
    res = client.post("/api/worksites/WS-01/events", json=event_payload)
    assert res.status_code == 201
    ev = res.json()
    assert ev["event_type"] == "no_helmet"
    assert ev["severity"] == "HIGH"

def test_worksite_demo_scenario():
    res = client.post("/api/worksites/demo-scenario")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["worksite_id"] == "WS-01"
    assert data["alert"] is not None
    assert data["incident"] is not None
    assert data["final_ppe_compliance"] == 100
