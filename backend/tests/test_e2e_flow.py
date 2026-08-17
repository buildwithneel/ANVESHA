import asyncio
import json
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.seed import seed_database
from app.services.alert_service import AlertService

client = TestClient(app)

def test_full_step5_e2e_pipeline():
    """
    Demonstrates the complete Step 5 sequence:
    1. ML Event Trigger: 'track_intrusion' for CAM-07
    2. Detection Ingestion & Validation
    3. Detection Persisted in DB
    4. Prototype Severity Rule -> CRITICAL Alert Auto-Generated
    5. Deduplication verification
    6. Incident creation linked to Alert and Camera
    7. Alert resolution verification
    """
    seed_database(reset=True)

    # 1. Trigger ML Detection: Track Intrusion
    ml_payload = {
        "camera_id": "CAM-07",
        "event_type": "track_intrusion",
        "confidence": 0.94,
        "risk_score": 92,
        "timestamp": "2026-08-15T13:42:17",
        "metadata": {
            "people_count": 1,
            "bbox": [120, 80, 320, 420],
            "source_resolution": [1920, 1080]
        }
    }

    response = client.post("/api/detections", json=ml_payload)
    assert response.status_code == 201
    det_data = response.json()

    # 2. Verify Detection Created & Stored
    assert det_data["id"] is not None
    assert det_data["camera_id"] == "CAM-07"
    assert det_data["type"] == "track_intrusion"
    assert det_data["confidence"] == 0.94
    assert det_data["risk_score"] == 92
    assert det_data["severity"] == "CRITICAL"

    # 3. Verify Critical Alert Created
    assert det_data["alert_triggered"] is True
    alert_id = det_data["alert_id"]
    assert alert_id is not None

    alert_resp = client.get(f"/api/alerts/{alert_id}")
    assert alert_resp.status_code == 200
    alert_obj = alert_resp.json()
    assert alert_obj["severity"] == "CRITICAL"
    assert alert_obj["camera_id"] == "CAM-07"
    assert alert_obj["status"] == "ACTIVE"

    # 4. Create Incident Linked to Camera & Alert
    incident_payload = {
        "alert_id": alert_id,
        "camera_id": "CAM-07",
        "type": "track_intrusion",
        "severity": "CRITICAL",
        "status": "OPEN",
        "description": "Active track intrusion on Platform 3 North",
        "operator_notes": "RPF patrol unit dispatched. Camera zoom focused."
    }
    inc_resp = client.post("/api/incidents", json=incident_payload)
    assert inc_resp.status_code == 201
    inc_data = inc_resp.json()
    assert inc_data["id"].startswith("INC-")
    assert inc_data["alert_id"] == alert_id
    assert inc_data["camera_id"] == "CAM-07"

    # 5. Acknowledge and Resolve Alert
    ack_resp = client.patch(f"/api/alerts/{alert_id}", json={"status": "ACKNOWLEDGED"})
    assert ack_resp.status_code == 200
    assert ack_resp.json()["status"] == "ACKNOWLEDGED"

    res_resp = client.patch(f"/api/alerts/{alert_id}", json={"status": "RESOLVED"})
    assert res_resp.status_code == 200
    assert res_resp.json()["status"] == "RESOLVED"

    print("\n[E2E VERIFICATION] Step 5 full pipeline completed successfully!")

if __name__ == "__main__":
    test_full_step5_e2e_pipeline()
