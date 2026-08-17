import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.seed import seed_database

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    seed_database(reset=True)

client = TestClient(app)

def test_get_station_crowd():
    response = client.get("/api/crowd")
    assert response.status_code == 200
    data = response.json()
    assert "station_name" in data
    assert "total_estimated_people" in data
    assert "zones" in data
    assert len(data["zones"]) == 11
    assert "platforms" in data
    assert len(data["platforms"]) == 4
    assert "trend_60min" in data
    assert len(data["trend_60min"]) == 7
    assert "projections" in data
    assert "predicted_10_min" in data["projections"]
    assert "predicted_20_min" in data["projections"]

def test_get_specific_zones():
    for zone_id in ["PF-1", "PF-2", "PF-3", "PF-4", "CONCOURSE", "ENTRY", "EXIT", "FOB", "WAITING", "PARKING", "TRACK"]:
        response = client.get(f"/api/crowd/{zone_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == zone_id
        assert "crowd_percentage" in data
        assert "people_count" in data
        assert "risk_level" in data
        assert "camera_count" in data
        assert "active_alerts_count" in data
        assert "cameras" in data
        assert len(data["cameras"]) > 0

def test_ingest_crowd_measurement():
    payload = {
        "zone_id": "PF-2",
        "density": 78,
        "people_count": 390
    }
    response = client.post("/api/crowd", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["zone"]["crowd_percentage"] == 78
    assert data["zone"]["density_label"] == "MODERATE"
    assert data["zone"]["risk_level"] == "MODERATE"

def test_demo_scenario_progression():
    # Step 1: 76%
    r1 = client.post("/api/crowd/demo-scenario?step=1")
    assert r1.status_code == 200
    assert r1.json()["crowd_percentage"] == 76
    assert r1.json()["density_label"] == "MODERATE"

    # Step 2: 81%
    r2 = client.post("/api/crowd/demo-scenario?step=2")
    assert r2.status_code == 200
    assert r2.json()["crowd_percentage"] == 81
    assert r2.json()["density_label"] == "HIGH"

    # Step 3: 86%
    r3 = client.post("/api/crowd/demo-scenario?step=3")
    assert r3.status_code == 200
    assert r3.json()["crowd_percentage"] == 86
    assert r3.json()["density_label"] == "HIGH"

    # Step 4: 91% (Threshold exceeded -> Operational Alert generated)
    r4 = client.post("/api/crowd/demo-scenario?step=4")
    assert r4.status_code == 200
    res4 = r4.json()
    assert res4["crowd_percentage"] == 91
    assert res4["density_label"] == "HIGH"
    assert res4["alert_generated"] is not None
    assert "CROWD THRESHOLD EXCEEDED" in res4["alert_message"]
