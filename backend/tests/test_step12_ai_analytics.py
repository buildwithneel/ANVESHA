import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_ml_ready_detection_ingest():
    """Verify model-agnostic ML detection ingestion endpoint."""
    payload = {
        "camera_id": "CAM-07",
        "location": "Platform 3",
        "event_type": "restricted_zone",
        "confidence": 0.94,
        "severity": "CRITICAL",
        "risk_score": 92,
        "metadata": {"zone": "Platform 3 Track Corridor", "intruder_detected": True}
    }
    response = client.post("/api/ai/detections", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["camera_id"] == "CAM-07"
    assert data["type"] == "restricted_zone"
    assert data["confidence"] == 0.94
    assert data["severity"] == "CRITICAL"
    assert "id" in data

def test_ai_engine_status_and_mode_switching():
    """Verify AI Engine status endpoint and mode switching."""
    # 1. Get status
    response = client.get("/api/ai/status")
    assert response.status_code == 200
    data = response.json()
    assert "engine_mode" in data
    assert "model_info" in data
    assert data["detection_pipeline_status"] == "OPERATIONAL"

    # 2. Switch mode
    toggle_resp = client.post("/api/ai/status/mode?mode=LIVE%20MODEL")
    assert toggle_resp.status_code == 200
    assert toggle_resp.json()["engine_mode"] == "LIVE MODEL"

    # 3. Switch back to DEMO MODE
    toggle_back = client.post("/api/ai/status/mode?mode=DEMO%20MODE")
    assert toggle_back.status_code == 200
    assert toggle_back.json()["engine_mode"] == "DEMO MODE"

def test_demo_scenarios_execution():
    """Verify controlled demo scenarios (A, B, C, D) execute through the backend pipeline."""
    # Scenario A: Crowd
    resp_a = client.post("/api/ai/demo/scenarios/A")
    assert resp_a.status_code == 200
    assert resp_a.json()["scenario"] == "A"

    # Scenario B: Restricted Zone
    resp_b = client.post("/api/ai/demo/scenarios/B")
    assert resp_b.status_code == 200
    assert resp_b.json()["scenario"] == "B"

    # Scenario C: PPE Violation
    resp_c = client.post("/api/ai/demo/scenarios/C")
    assert resp_c.status_code == 200
    assert resp_c.json()["scenario"] == "C"

    # Scenario D: Worksite Update
    resp_d = client.post("/api/ai/demo/scenarios/D")
    assert resp_d.status_code == 200
    assert resp_d.json()["scenario"] == "D"

def test_crowd_density_trend_analytics():
    """Verify crowd density trends across 15m, 1h, 6h, and today time ranges."""
    for tr in ["15m", "1h", "6h", "today"]:
        response = client.get(f"/api/ai/analytics/crowd-trend?time_range={tr}")
        assert response.status_code == 200
        data = response.json()
        assert data["time_range"] == tr
        assert data["current_density"] > 0
        assert "trend_data" in data
        assert len(data["trend_data"]) > 0

def test_station_risk_trend_analytics():
    """Verify decision-support station risk trends with delta and contributing factors."""
    response = client.get("/api/ai/analytics/risk-trend?time_range=1h")
    assert response.status_code == 200
    data = response.json()
    assert "current_risk_score" in data
    assert "contributing_factors" in data
    assert len(data["contributing_factors"]) > 0
    assert "Decision-support indicator" in data["disclaimer"]

def test_event_distribution_analytics():
    """Verify event category distribution returns Crowd, Security, Worksite, and Other."""
    response = client.get("/api/ai/analytics/event-distribution")
    assert response.status_code == 200
    data = response.json()
    assert data["total_events"] > 0
    assert len(data["categories"]) == 4

def test_5_pillar_explainable_insights():
    """Verify explainable AI insights have all 5 observable pillars (WHAT, WHY, CONFIDENCE, IMPACT, SUGGESTED ACTION)."""
    response = client.get("/api/ai/insights")
    assert response.status_code == 200
    insights = response.json()
    assert len(insights) >= 3

    for item in insights:
        assert "what" in item and len(item["what"]) > 0
        assert "why" in item and len(item["why"]) > 0
        assert 0.0 <= item["confidence"] <= 1.0
        assert item["impact"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        assert "suggested_action" in item and len(item["suggested_action"]) > 0

def test_incident_narrative_generator():
    """Verify human-readable incident narrative generation."""
    response = client.get("/api/ai/incidents/INC-001/narrative")
    assert response.status_code == 200
    data = response.json()
    assert "narrative_summary" in data
    assert "timeline_highlights" in data
    assert len(data["timeline_highlights"]) > 0
