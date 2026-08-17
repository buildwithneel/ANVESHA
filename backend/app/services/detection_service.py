import json
from datetime import datetime, timedelta
from typing import List, Optional, Tuple, Dict
from sqlalchemy.orm import Session
from app.database.models import Detection, Alert, Camera
from app.schemas.detection import DetectionIngestRequest
from app.schemas.alert import AlertCreate
from app.services.alert_service import AlertService
from app.websocket.manager import ws_manager

# Cooldown cache to prevent alert flooding for continuous detections on same camera & event type
# Key: (camera_id, event_type) -> Value: last alert datetime
_ALERT_COOLDOWN_CACHE: Dict[Tuple[str, str], datetime] = {}
ALERT_COOLDOWN_SECONDS = 45 # 45 seconds cooldown between identical alerts per camera

class DetectionService:
    @staticmethod
    def clear_cooldown_cache():
        """Clears the deduplication / cooldown cache."""
        _ALERT_COOLDOWN_CACHE.clear()
    @staticmethod
    def get_detections(
        db: Session,
        camera_id: Optional[str] = None,
        event_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Detection]:
        query = db.query(Detection)
        if camera_id:
            query = query.filter(Detection.camera_id == camera_id)
        if event_type:
            query = query.filter(Detection.type == event_type)
        return query.order_by(Detection.timestamp.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_risk_level_label(score: int) -> str:
        """
        AI Risk Score scale:
        0–29: LOW
        30–59: MODERATE
        60–79: HIGH
        80–100: CRITICAL
        """
        if score >= 80:
            return "CRITICAL"
        elif score >= 60:
            return "HIGH"
        elif score >= 30:
            return "MODERATE"
        else:
            return "LOW"

    @staticmethod
    async def ingest_detection(db: Session, detection_in: DetectionIngestRequest) -> Tuple[Detection, Optional[Alert]]:
        # 1. Verify camera exists or find by code
        camera = db.query(Camera).filter(
            (Camera.id == detection_in.camera_id) | (Camera.camera_code == detection_in.camera_id)
        ).first()

        camera_id = camera.id if camera else detection_in.camera_id

        # 2. Determine Prototype Severity
        # NORMAL: person (no alert generated)
        # WARNING: crowd, ppe_violation
        # HIGH: fall, abandoned_object
        # CRITICAL: restricted_zone, track_intrusion
        event_type = detection_in.event_type or detection_in.type or "person"
        
        severity_map = {
            "person": "NORMAL",
            "crowd": "WARNING",
            "ppe_violation": "WARNING",
            "fall": "HIGH",
            "abandoned_object": "HIGH",
            "restricted_zone": "CRITICAL",
            "track_intrusion": "CRITICAL",
        }
        severity = detection_in.severity or severity_map.get(event_type, "NORMAL")
        
        ts = detection_in.timestamp or datetime.utcnow()
        meta_json = json.dumps(detection_in.metadata or {})

        # 3. Store Detection in Database (Persistence)
        db_detection = Detection(
            camera_id=camera_id,
            type=event_type,
            confidence=detection_in.confidence,
            timestamp=ts,
            severity=severity,
            risk_score=detection_in.risk_score,
            metadata_json=meta_json
        )
        db.add(db_detection)
        db.commit()
        db.refresh(db_detection)

        # 4. Broadcast WebSocket `new_detection` event
        await ws_manager.broadcast_new_detection({
            "id": db_detection.id,
            "camera_id": db_detection.camera_id,
            "camera_name": camera.location if camera else f"Camera {camera_id}",
            "type": db_detection.type,
            "confidence": db_detection.confidence,
            "timestamp": db_detection.timestamp.isoformat(),
            "severity": db_detection.severity,
            "risk_score": db_detection.risk_score,
            "metadata": db_detection.metadata_dict
        })

        # 5. Determine whether an Alert should be generated
        # Rules: Do NOT generate alert for NORMAL (e.g. single person detection)
        triggered_alert = None
        should_alert = severity in ["WARNING", "HIGH", "CRITICAL"] and event_type != "person"

        if should_alert:
            # 6. Cooldown & Deduplication check
            cooldown_key = (camera_id, event_type)
            last_alert_time = _ALERT_COOLDOWN_CACHE.get(cooldown_key)
            now = datetime.utcnow()

            is_in_cooldown = False
            if last_alert_time:
                elapsed = (now - last_alert_time).total_seconds()
                if elapsed < ALERT_COOLDOWN_SECONDS:
                    is_in_cooldown = True

            if not is_in_cooldown:
                # Update cooldown cache
                _ALERT_COOLDOWN_CACHE[cooldown_key] = now

                location_label = camera.location if camera else f"Camera {camera_id}"
                
                # Human readable title
                type_labels = {
                    "track_intrusion": "Track Intrusion Detected",
                    "restricted_zone": "Restricted Zone Breach",
                    "fall": "Passenger Fall Detected",
                    "abandoned_object": "Unattended Baggage Detected",
                    "crowd": "Crowd Density Surge",
                    "ppe_violation": "Worker PPE Safety Violation",
                }
                title = type_labels.get(event_type, f"{event_type.replace('_', ' ').title()} Detected")
                alert_message = f"{title} at {location_label} (Confidence: {int(detection_in.confidence * 100)}%)"

                alert_in = AlertCreate(
                    camera_id=camera_id,
                    detection_id=db_detection.id,
                    type=event_type,
                    severity=severity,
                    status="ACTIVE",
                    message=alert_message,
                    confidence=detection_in.confidence,
                    risk_score=detection_in.risk_score
                )
                triggered_alert = await AlertService.create_alert(db=db, alert_in=alert_in)

        return db_detection, triggered_alert
