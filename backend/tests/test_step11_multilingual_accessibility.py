import json
import os
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_translation_dictionaries_integrity():
    """Verify en.json, hi.json, and gu.json dictionaries exist, have valid JSON, and share common root keys."""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    dict_dir = os.path.join(base_dir, "src", "i18n", "dictionaries")

    assert os.path.exists(dict_dir), f"Dictionaries directory not found at {dict_dir}"

    en_path = os.path.join(dict_dir, "en.json")
    hi_path = os.path.join(dict_dir, "hi.json")
    gu_path = os.path.join(dict_dir, "gu.json")

    assert os.path.exists(en_path)
    assert os.path.exists(hi_path)
    assert os.path.exists(gu_path)

    with open(en_path, "r", encoding="utf-8") as f:
        en_dict = json.load(f)

    with open(hi_path, "r", encoding="utf-8") as f:
        hi_dict = json.load(f)

    with open(gu_path, "r", encoding="utf-8") as f:
        gu_dict = json.load(f)

    # Check top-level namespaces exist in all 3 languages
    required_namespaces = [
        "brand", "nav", "topbar", "dashboard", "cctv", "crowd",
        "workMonitoring", "alerts", "incidents", "settings", "severity", "status", "common"
    ]

    for ns in required_namespaces:
        assert ns in en_dict, f"Missing namespace '{ns}' in en.json"
        assert ns in hi_dict, f"Missing namespace '{ns}' in hi.json"
        assert ns in gu_dict, f"Missing namespace '{ns}' in gu.json"

    # Check that keys within 'dashboard' match
    for k in en_dict["dashboard"]:
        assert k in hi_dict["dashboard"], f"Missing dashboard key '{k}' in hi.json"
        assert k in gu_dict["dashboard"], f"Missing dashboard key '{k}' in gu.json"

def test_technical_identifiers_preserved():
    """Ensure technical identifiers (CAM-07, YOLO, etc.) are preserved in technical context."""
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    dict_dir = os.path.join(base_dir, "src", "i18n", "dictionaries")
    en_path = os.path.join(dict_dir, "en.json")

    with open(en_path, "r", encoding="utf-8") as f:
        en_dict = json.load(f)

    # Technical identifiers should not be distorted
    assert "CCTV" in en_dict["cctv"]["title"]
    assert "PTZ" in en_dict["cctv"]["ptzControl"]
    assert "PPE" in en_dict["workMonitoring"]["overallCompliance"]

def test_dashboard_summary_operational_status():
    """Verify dashboard summary returns valid operational system status without errors."""
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["system_status"] in ["OPERATIONAL", "CRITICAL ALERT", "DEGRADED MONITORING"]
    assert "safety_index" in data
    assert "priority_actions" in data

def test_human_friendly_ai_language():
    """Verify that priority actions and AI recommendations use calm, advisory language."""
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()

    for item in data.get("priority_actions", []):
        assert "suggested_action" in item
        # Advisory language check
        assert not item["suggested_action"].startswith("AI ordered")
        assert not item["suggested_action"].startswith("AI determined")

    for rec in data.get("recommendations", []):
        assert "trigger_rule" in rec
        assert "suggested_action" in rec
        assert not rec["suggested_action"].startswith("AI commanded")
