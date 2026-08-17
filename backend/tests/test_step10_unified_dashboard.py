import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.seed import seed_database

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    seed_database(reset=True)

client = TestClient(app)

def test_unified_dashboard_summary():
    res = client.get("/api/dashboard/summary")
    assert res.status_code == 200
    data = res.json()

    # 1. Header & Station
    assert "station_name" in data
    assert "system_status" in data
    assert "last_updated" in data

    # 2. Key Operational Metrics
    assert data["cameras"]["total"] >= 24
    assert data["cameras"]["active"] >= 18
    assert data["alerts"]["active"] >= 1
    assert data["incidents"]["total"] >= 1
    assert data["crowd_people_count"] > 0
    assert data["worksites"]["active_worksites"] >= 1

    # 3. Station Safety Index
    assert "safety_index" in data
    assert 0 <= data["safety_index"]["overall_score"] <= 100
    assert "crowd_safety_score" in data["safety_index"]
    assert "security_score" in data["safety_index"]
    assert "worksite_compliance_score" in data["safety_index"]
    assert "cctv_health_score" in data["safety_index"]

    # 4. System & AI Telemetry
    assert data["ai_telemetry"]["status"] == "ONLINE"
    assert data["ai_telemetry"]["inference_latency_ms"] <= 50
    assert data["system_health"]["cctv_network_pct"] > 0
    assert data["system_health"]["backend_api_pct"] == 100.0

    # 5. Priority Actions Queue
    assert "priority_actions" in data
    assert len(data["priority_actions"]) >= 1
    top_action = data["priority_actions"][0]
    assert "severity" in top_action
    assert "risk_score" in top_action
    assert "contributing_factors" in top_action
    assert len(top_action["contributing_factors"]) > 0
    assert "suggested_action" in top_action

    # 6. Needs Attention
    assert "needs_attention" in data
    assert len(data["needs_attention"]) >= 1

    # 7. Recommendations
    assert "recommendations" in data
    assert len(data["recommendations"]) >= 1

def test_explainable_ai_recommendations():
    res = client.get("/api/dashboard/recommendations")
    assert res.status_code == 200
    recs = res.json()
    assert isinstance(recs, list)
    assert len(recs) >= 1

    rec = recs[0]
    assert "headline" in rec
    assert "observation" in rec
    assert "trigger_rule" in rec
    assert "IF " in rec["trigger_rule"]
    assert "suggested_action" in rec
    assert "action_label" in rec
    assert "target_route" in rec

def test_dismiss_recommendation():
    recs = client.get("/api/dashboard/recommendations").json()
    if len(recs) > 0:
        rec_id = recs[0]["id"]
        res = client.post(f"/api/dashboard/recommendations/{rec_id}/dismiss")
        assert res.status_code == 200
        assert res.json()["success"] is True

def test_unified_global_search():
    # Search for Platform 3
    res = client.get("/api/dashboard/search", params={"q": "Platform 3"})
    assert res.status_code == 200
    data = res.json()
    assert data["total_results"] > 0
    assert len(data["cameras"]) > 0 or len(data["locations"]) > 0 or len(data["alerts"]) > 0

    # Search for CAM-07
    cam_res = client.get("/api/dashboard/search", params={"q": "CAM-07"})
    assert cam_res.status_code == 200
    assert any(c["id"] == "CAM-07" for c in cam_res.json()["cameras"])

    # Search for Track
    trk_res = client.get("/api/dashboard/search", params={"q": "Track"})
    assert trk_res.status_code == 200
    assert trk_res.json()["total_results"] > 0

def test_integrated_demo_scenario():
    res = client.post("/api/dashboard/demo/integrated-scenario")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "alert_id" in data
    assert data["camera_id"] == "CAM-07"
