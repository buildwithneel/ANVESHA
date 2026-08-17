import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.seed import seed_database
from app.ml.adapter import MLDetectionAdapter
from app.services.detection_service import DetectionService

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    seed_database(reset=True)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["api"] == "healthy"
    assert data["database"] == "connected"
    assert "timestamp" in data

def test_dashboard_summary():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "cameras" in data
    assert data["cameras"]["total"] == 24
    assert data["cameras"]["active"] >= 18
    assert data["people"] == 428
    assert "alerts" in data
    assert data["alerts"]["active"] == 7
    assert data["alerts"]["critical"] == 2
    assert "risk" in data
    assert data["risk"]["level"] in ["low", "moderate", "high", "critical"]
    assert isinstance(data["risk"]["score"], int)

def test_ml_adapter_normalization():
    # Test adapter normalizes diverse model outputs
    raw_event = {
        "cam_id": "CAM-07",
        "class_name": "track_trespass",
        "confidence": 0.94,
        "bbox": [100, 200, 300, 400],
        "source_resolution": [1920, 1080]
    }
    adapted = MLDetectionAdapter.from_raw_event(raw_event)
    assert adapted.camera_id == "CAM-07"
    assert adapted.event_type == "track_intrusion"
    assert adapted.confidence == 0.94
    assert adapted.risk_score >= 80 # Critical rule
    assert adapted.metadata["bbox"] == [100, 200, 300, 400]

def test_severity_rules_and_person_no_alert():
    # 1. 'person' detection -> Severity NORMAL, NO alert generated
    person_payload = {
        "camera_id": "CAM-01",
        "event_type": "person",
        "confidence": 0.95,
        "risk_score": 15,
        "metadata": {"bbox": [50, 50, 100, 200]}
    }
    response = client.post("/api/detections", json=person_payload)
    assert response.status_code == 201
    det = response.json()
    assert det["severity"] == "NORMAL"
    assert det["alert_triggered"] is False
    assert det["alert_id"] is None

    # 2. 'track_intrusion' detection -> Severity CRITICAL, Alert generated
    intrusion_payload = {
        "camera_id": "CAM-07",
        "event_type": "track_intrusion",
        "confidence": 0.94,
        "risk_score": 92,
        "timestamp": "2026-08-15T13:42:17",
        "metadata": {"people_count": 1, "bbox": [120, 80, 320, 420]}
    }
    response = client.post("/api/detections", json=intrusion_payload)
    assert response.status_code == 201
    det = response.json()
    assert det["severity"] == "CRITICAL"
    assert det["alert_triggered"] is True
    assert det["alert_id"] is not None

def test_alert_cooldown_deduplication():
    # Sending first critical detection generates alert
    payload = {
        "camera_id": "CAM-19",
        "event_type": "track_intrusion",
        "confidence": 0.96,
        "risk_score": 95,
        "metadata": {"track_id": "TRK-01"}
    }
    res1 = client.post("/api/detections", json=payload)
    assert res1.status_code == 201
    det1 = res1.json()
    assert det1["alert_triggered"] is True
    first_alert_id = det1["alert_id"]

    # Sending second identical detection immediately should save detection but NOT flood duplicate alert
    res2 = client.post("/api/detections", json=payload)
    assert res2.status_code == 201
    det2 = res2.json()
    assert det2["id"] != det1["id"] # New detection record saved
    assert det2["alert_triggered"] is False # Deduplicated / in cooldown

def test_cameras_crud():
    response = client.get("/api/cameras")
    assert response.status_code == 200
    cameras = response.json()
    assert len(cameras) == 24

def test_alerts_lifecycle():
    response = client.get("/api/alerts")
    assert response.status_code == 200
    alerts = response.json()
    assert len(alerts) >= 12
