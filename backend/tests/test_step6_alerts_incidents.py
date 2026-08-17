import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_alerts_list_and_filters():
    # 1. Get all alerts
    response = client.get("/api/alerts")
    assert response.status_code == 200
    alerts = response.json()
    assert isinstance(alerts, list)
    assert len(alerts) > 0

    # 2. Filter by status
    response_active = client.get("/api/alerts?status=ACTIVE")
    assert response_active.status_code == 200
    for a in response_active.json():
        assert a["status"] == "ACTIVE"

    # 3. Filter by severity
    response_crit = client.get("/api/alerts?severity=CRITICAL")
    assert response_crit.status_code == 200
    for a in response_crit.json():
        assert a["severity"] == "CRITICAL"

def test_alert_lifecycle_transitions():
    # Create test alert
    payload = {
        "camera_id": "CAM-05",
        "type": "track_intrusion",
        "severity": "CRITICAL",
        "status": "ACTIVE",
        "message": "Lifecycle Test Intrusion",
        "confidence": 0.95,
        "risk_score": 90
    }
    create_res = client.post("/api/alerts", json=payload)
    assert create_res.status_code == 201
    alt_id = create_res.json()["id"]

    # 1. Acknowledge
    ack_res = client.post(f"/api/alerts/{alt_id}/acknowledge")
    assert ack_res.status_code == 200
    assert ack_res.json()["status"] == "ACKNOWLEDGED"

    # 2. Investigate
    inv_res = client.post(f"/api/alerts/{alt_id}/investigate")
    assert inv_res.status_code == 200
    assert inv_res.json()["status"] == "INVESTIGATING"

    # 3. Resolve
    res_res = client.post(f"/api/alerts/{alt_id}/resolve")
    assert res_res.status_code == 200
    assert res_res.json()["status"] == "RESOLVED"

def test_alert_deduplication_stats():
    res = client.get("/api/alerts/stats/deduplication")
    assert res.status_code == 200
    data = res.json()
    assert "total_raw_detections" in data
    assert "total_operational_alerts" in data
    assert "active_operational_alerts" in data
    assert "deduplication_ratio" in data

def test_incident_creation_and_timeline():
    # 1. Create incident
    payload = {
        "alert_id": "ALT-001",
        "camera_id": "CAM-07",
        "type": "track_trespass",
        "severity": "CRITICAL",
        "status": "OPEN",
        "description": "Trespasser test incident",
        "operator_notes": "Unit dispatched"
    }
    create_res = client.post("/api/incidents", json=payload)
    assert create_res.status_code == 201
    inc = create_res.json()
    inc_id = inc["id"]
    assert inc_id.startswith("INC-")

    # 2. Fetch timeline events
    events_res = client.get(f"/api/incidents/{inc_id}/events")
    assert events_res.status_code == 200
    events = events_res.json()
    assert len(events) >= 2  # alert_linked, incident_opened, note_added

    # 3. Add officer note
    note_res = client.post(f"/api/incidents/{inc_id}/notes", json={
        "note": "Perimeter secured by team alpha.",
        "actor": "Insp. Sharma"
    })
    assert note_res.status_code == 201
    assert note_res.json()["event_type"] == "note_added"

    # 4. Update status to RESOLVED
    patch_res = client.patch(f"/api/incidents/{inc_id}", json={"status": "RESOLVED"})
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "RESOLVED"

    # 5. Verify timeline grew
    events_res_after = client.get(f"/api/incidents/{inc_id}/events")
    assert len(events_res_after.json()) > len(events)

def test_demo_scenario_endpoint():
    res = client.post("/api/alerts/demo/trigger-scenario")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "alert" in data
    assert data["alert"]["severity"] == "CRITICAL"
    assert data["alert"]["camera_id"] == "CAM-07"
