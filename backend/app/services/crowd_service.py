import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.models import CrowdMeasurement, Camera, Alert, Detection
from app.schemas.alert import AlertCreate
from app.services.alert_service import AlertService
from app.websocket.manager import ws_manager

# Cooldown cache for crowd alerts: key: zone_id -> last alert timestamp
_CROWD_ALERT_COOLDOWN: Dict[str, datetime] = {}
CROWD_ALERT_COOLDOWN_SECONDS = 60

# 11 Station Zones Configuration
ZONES_CONFIG = {
    "PF-1": {
        "id": "PF-1",
        "name": "Platform 1",
        "category": "Platform",
        "capacity": 500,
        "base_people": 310,
        "base_density": 62,
        "cameras": ["CAM-01", "CAM-02", "CAM-03"],
        "train_info": "Shatabdi Exp · PF1 · Departing 13:45",
    },
    "PF-2": {
        "id": "PF-2",
        "name": "Platform 2",
        "category": "Platform",
        "capacity": 500,
        "base_people": 380,
        "base_density": 76,
        "cameras": ["CAM-04", "CAM-05", "CAM-06"],
        "train_info": "Rajdhani Exp · PF2 · Arriving 13:52",
    },
    "PF-3": {
        "id": "PF-3",
        "name": "Platform 3",
        "category": "Platform",
        "capacity": 500,
        "base_people": 455,
        "base_density": 91,
        "cameras": ["CAM-07", "CAM-08", "CAM-09"],
        "train_info": "Gujarat Mail · PF3 · Delayed +18 min",
    },
    "PF-4": {
        "id": "PF-4",
        "name": "Platform 4",
        "category": "Platform",
        "capacity": 500,
        "base_people": 240,
        "base_density": 48,
        "cameras": ["CAM-10", "CAM-11", "CAM-12"],
        "train_info": "No scheduled arrival",
    },
    "CONCOURSE": {
        "id": "CONCOURSE",
        "name": "Main Concourse",
        "category": "Concourse",
        "capacity": 800,
        "base_people": 440,
        "base_density": 55,
        "cameras": ["CAM-21"],
        "train_info": "Ticketing & Information Kiosks",
    },
    "ENTRY": {
        "id": "ENTRY",
        "name": "Entry",
        "category": "Gate",
        "capacity": 400,
        "base_people": 180,
        "base_density": 45,
        "cameras": ["CAM-22", "CAM-23"],
        "train_info": "Security Baggage Screening Gates",
    },
    "EXIT": {
        "id": "EXIT",
        "name": "Exit",
        "category": "Gate",
        "capacity": 400,
        "base_people": 152,
        "base_density": 38,
        "cameras": ["CAM-23"],
        "train_info": "Turnstile & West Exit Ramps",
    },
    "FOB": {
        "id": "FOB",
        "name": "FOB",
        "category": "Overbridge",
        "capacity": 300,
        "base_people": 246,
        "base_density": 82,
        "cameras": ["CAM-16", "CAM-17", "CAM-18"],
        "train_info": "Central Foot Overbridge 1-4",
    },
    "WAITING": {
        "id": "WAITING",
        "name": "Waiting Area",
        "category": "Lounge",
        "capacity": 350,
        "base_people": 175,
        "base_density": 50,
        "cameras": ["CAM-03"],
        "train_info": "Executive & General Passenger Hall",
    },
    "PARKING": {
        "id": "PARKING",
        "name": "Parking",
        "category": "Circulating",
        "capacity": 600,
        "base_people": 192,
        "base_density": 32,
        "cameras": ["CAM-24"],
        "train_info": "East Terminal Drop-off & Taxi Bay",
    },
    "TRACK": {
        "id": "TRACK",
        "name": "Track Area",
        "category": "Track Bed",
        "capacity": 50,
        "base_people": 6,
        "base_density": 12,
        "cameras": ["CAM-19", "CAM-20"],
        "train_info": "Active Line 1-4 & Yard Interlock",
    },
}

# Runtime override state for real-time simulation / demo
_ZONE_STATE_OVERRIDES: Dict[str, Dict[str, Any]] = {}


class CrowdService:
    @staticmethod
    def get_density_level(percentage: int) -> Tuple[str, str]:
        """
        Classification rules:
        0–59% = NORMAL (Risk: LOW)
        60–79% = MODERATE (Risk: MODERATE)
        80–100% = HIGH (Risk: HIGH)
        """
        if percentage >= 80:
            return "HIGH", "HIGH"
        elif percentage >= 60:
            return "MODERATE", "MODERATE"
        else:
            return "NORMAL", "LOW"

    @staticmethod
    def get_zone_data(db: Session, zone_id: str) -> Optional[Dict[str, Any]]:
        cfg = ZONES_CONFIG.get(zone_id)
        if not cfg:
            return None

        # Check for in-memory override
        override = _ZONE_STATE_OVERRIDES.get(zone_id, {})
        density = override.get("density", cfg["base_density"])
        people_count = override.get("people", cfg["base_people"])

        density_label, risk_level = CrowdService.get_density_level(density)

        # Count active alerts for cameras in this zone
        active_alerts_count = db.query(Alert).filter(
            Alert.camera_id.in_(cfg["cameras"]),
            Alert.status.in_(["ACTIVE", "INVESTIGATING"])
        ).count()

        # Camera count
        cam_count = len(cfg["cameras"])

        # Time series generation
        trend_60min = CrowdService.generate_zone_trend(zone_id, density)

        # ML Projections
        projections = CrowdService.calculate_projections(density)

        return {
            "id": cfg["id"],
            "name": cfg["name"],
            "category": cfg["category"],
            "crowd_percentage": density,
            "people_count": people_count,
            "capacity": cfg["capacity"],
            "density_label": density_label,
            "risk_level": risk_level,
            "camera_count": cam_count,
            "cameras": cfg["cameras"],
            "active_alerts_count": active_alerts_count,
            "train_info": cfg["train_info"],
            "trend_60min": trend_60min,
            "projections": projections,
        }

    @staticmethod
    def get_all_zones(db: Session) -> List[Dict[str, Any]]:
        zones = []
        for zid in ZONES_CONFIG.keys():
            zdata = CrowdService.get_zone_data(db, zid)
            if zdata:
                zones.append(zdata)
        return zones

    @staticmethod
    def get_station_crowd_summary(db: Session) -> Dict[str, Any]:
        zones = CrowdService.get_all_zones(db)
        total_people = sum(z["people_count"] for z in zones)
        avg_density = int(sum(z["crowd_percentage"] for z in zones) / len(zones)) if zones else 64
        density_label, risk_level = CrowdService.get_density_level(avg_density)

        # Platforms summary for quick dashboard consumption
        platform_keys = ["PF-1", "PF-2", "PF-3", "PF-4"]
        platforms = [z for z in zones if z["id"] in platform_keys]

        # Station 60-min trend
        station_trend = CrowdService.generate_station_trend(avg_density)
        projections = CrowdService.calculate_projections(avg_density)

        return {
            "station_name": "Vadodara Railway Station",
            "station_code": "BRC",
            "total_estimated_people": total_people,
            "average_density_percentage": avg_density,
            "density_label": density_label,
            "risk_level": risk_level,
            "platforms": platforms,
            "zones": zones,
            "trend_60min": station_trend,
            "projections": projections,
        }

    @staticmethod
    def generate_zone_trend(zone_id: str, current_density: int) -> List[Dict[str, Any]]:
        # Returns 7 data points covering the last 60 minutes
        base = current_density
        # Deterministic wave offsets
        offsets = [-38, -32, -26, -18, -12, -6, 0]
        points = []
        now = datetime.utcnow()
        for i, offset in enumerate(offsets):
            t = now - timedelta(minutes=(60 - i * 10))
            val = max(10, min(100, base + offset))
            points.append({
                "time": t.strftime("%H:%M"),
                "density": val
            })
        return points

    @staticmethod
    def generate_station_trend(current_avg: int) -> List[Dict[str, Any]]:
        offsets = [-22, -18, -14, -9, -5, -2, 0]
        points = []
        now = datetime.utcnow()
        for i, offset in enumerate(offsets):
            t = now - timedelta(minutes=(60 - i * 10))
            val = max(10, min(100, current_avg + offset))
            points.append({
                "time": t.strftime("%H:%M"),
                "density": val
            })
        return points

    @staticmethod
    def calculate_projections(current_density: int) -> Dict[str, Any]:
        """
        ML Projection Model simulation:
        Current, +10 min, +20 min
        """
        if current_density >= 80:
            trend = "INCREASING"
            p10 = min(99, current_density + 5)
            p20 = min(100, current_density + 9)
        elif current_density >= 60:
            trend = "INCREASING"
            p10 = min(85, current_density + 4)
            p20 = min(92, current_density + 7)
        else:
            trend = "STABLE"
            p10 = min(65, current_density + 2)
            p20 = min(68, current_density + 3)

        return {
            "current": current_density,
            "predicted_10_min": p10,
            "predicted_20_min": p20,
            "trend": trend,
            "confidence_label": "Model Projection (Confidence: 89%)",
            "model_version": "CrowdFlowNet-v2.4",
        }

    @staticmethod
    async def update_zone_crowd(
        db: Session,
        zone_id: str,
        density: int,
        people_count: Optional[int] = None,
        trigger_alert: bool = True
    ) -> Tuple[Dict[str, Any], Optional[Alert]]:
        cfg = ZONES_CONFIG.get(zone_id)
        if not cfg:
            raise ValueError(f"Unknown zone_id '{zone_id}'")

        if people_count is None:
            people_count = int((density / 100.0) * cfg["capacity"])

        # Update in-memory state
        _ZONE_STATE_OVERRIDES[zone_id] = {
            "density": density,
            "people": people_count
        }

        # Store measurement in database
        primary_cam = cfg["cameras"][0] if cfg["cameras"] else "CAM-01"
        density_label, risk_level = CrowdService.get_density_level(density)
        cm = CrowdMeasurement(
            camera_id=primary_cam,
            location=f"{cfg['name']} ({cfg['category']})",
            people_count=people_count,
            density=density_label,
            risk_level=risk_level.lower(),
            timestamp=datetime.utcnow()
        )
        db.add(cm)
        db.commit()

        # Check threshold alert logic
        generated_alert = None
        if trigger_alert and density >= 80:
            # Deduplication & Cooldown check
            now = datetime.utcnow()
            last_alert_time = _CROWD_ALERT_COOLDOWN.get(zone_id)
            is_cooldown = False
            if last_alert_time:
                elapsed = (now - last_alert_time).total_seconds()
                if elapsed < CROWD_ALERT_COOLDOWN_SECONDS:
                    is_cooldown = True

            if not is_cooldown:
                _CROWD_ALERT_COOLDOWN[zone_id] = now
                alert_in = AlertCreate(
                    camera_id=primary_cam,
                    type="crowd_threshold_exceeded",
                    severity="HIGH",
                    status="ACTIVE",
                    message=f"CROWD THRESHOLD EXCEEDED: {cfg['name']} crowd density reached {density}% (Duration: 4 min)",
                    confidence=0.92,
                    risk_score=min(95, density + 4)
                )
                generated_alert = await AlertService.create_alert(db=db, alert_in=alert_in)

        # Broadcast WebSocket update
        summary = CrowdService.get_station_crowd_summary(db)
        zone_data = CrowdService.get_zone_data(db, zone_id)
        await ws_manager.broadcast_crowd_updated({
            "zone_id": zone_id,
            "zone_data": zone_data,
            "station_summary": summary,
            "timestamp": datetime.utcnow().isoformat()
        })

        return zone_data, generated_alert

    @staticmethod
    async def run_demo_scenario(db: Session, step: int = 1) -> Dict[str, Any]:
        """
        Demo Scenario Progression for Platform 3:
        Step 1: 76% (Moderate)
        Step 2: 81% (High)
        Step 3: 86% (High)
        Step 4: 91% (High - generates Crowd Threshold Exceeded alert)
        """
        step_density_map = {
            1: (76, 380),
            2: (81, 405),
            3: (86, 430),
            4: (91, 455),
        }

        density, people = step_density_map.get(step, (91, 455))
        # For step 4, ensure alert triggers by resetting cooldown
        if step == 4:
            _CROWD_ALERT_COOLDOWN.pop("PF-3", None)

        zone_data, alert = await CrowdService.update_zone_crowd(
            db=db,
            zone_id="PF-3",
            density=density,
            people_count=people,
            trigger_alert=(step >= 3)
        )

        return {
            "success": True,
            "step": step,
            "zone_id": "PF-3",
            "zone_name": "Platform 3",
            "crowd_percentage": density,
            "people_count": people,
            "risk_level": zone_data["risk_level"],
            "density_label": zone_data["density_label"],
            "alert_generated": alert.id if alert else None,
            "alert_message": alert.message if alert else None,
        }
