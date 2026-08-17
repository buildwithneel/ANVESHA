from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.database.models import Alert, Detection, Incident, IncidentEvent
from app.schemas.alert import AlertCreate, AlertUpdate
from app.websocket.manager import ws_manager

class AlertService:
    @staticmethod
    def get_alerts(
        db: Session,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        camera_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Alert]:
        query = db.query(Alert)
        if status and status.upper() != "ALL":
            query = query.filter(Alert.status == status.upper())
        if severity and severity.upper() != "ALL":
            query = query.filter(Alert.severity == severity.upper())
        if camera_id and camera_id.upper() != "ALL":
            query = query.filter(Alert.camera_id == camera_id)
        return query.order_by(Alert.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_alert_by_id(db: Session, alert_id: str) -> Optional[Alert]:
        return db.query(Alert).filter(Alert.id == alert_id).first()

    @staticmethod
    async def create_alert(db: Session, alert_in: AlertCreate) -> Alert:
        # Generate alert ID if not supplied
        alert_id = alert_in.id
        if not alert_id:
            count = db.query(Alert).count() + 1
            alert_id = f"ALT-{count:03d}"
            while db.query(Alert).filter(Alert.id == alert_id).first():
                count += 1
                alert_id = f"ALT-{count:03d}"

        db_alert = Alert(
            id=alert_id,
            detection_id=alert_in.detection_id,
            camera_id=alert_in.camera_id,
            type=alert_in.type,
            severity=alert_in.severity.upper(),
            status=alert_in.status.upper(),
            message=alert_in.message,
            confidence=alert_in.confidence,
            risk_score=alert_in.risk_score,
            created_at=datetime.utcnow()
        )
        db.add(db_alert)
        db.commit()
        db.refresh(db_alert)

        # Broadcast WebSocket event
        await ws_manager.broadcast_new_alert({
            "id": db_alert.id,
            "camera_id": db_alert.camera_id,
            "type": db_alert.type,
            "severity": db_alert.severity,
            "status": db_alert.status,
            "message": db_alert.message,
            "confidence": db_alert.confidence,
            "risk_score": db_alert.risk_score,
            "created_at": db_alert.created_at.isoformat(),
        })

        return db_alert

    @staticmethod
    async def update_alert(db: Session, alert_id: str, alert_update: AlertUpdate) -> Optional[Alert]:
        db_alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not db_alert:
            return None

        update_data = alert_update.model_dump(exclude_unset=True)
        
        # Handle status transitions
        if "status" in update_data and update_data["status"]:
            new_status = update_data["status"].upper()
            update_data["status"] = new_status
            if new_status in ["ACKNOWLEDGED", "INVESTIGATING"] and not db_alert.acknowledged_at:
                update_data["acknowledged_at"] = datetime.utcnow()
            elif new_status in ["RESOLVED", "DISMISSED"] and not db_alert.resolved_at:
                update_data["resolved_at"] = datetime.utcnow()

        for field, val in update_data.items():
            setattr(db_alert, field, val)

        db.commit()
        db.refresh(db_alert)

        # Broadcast WebSocket update
        await ws_manager.broadcast_alert_updated({
            "id": db_alert.id,
            "status": db_alert.status,
            "severity": db_alert.severity,
            "message": db_alert.message,
            "acknowledged_at": db_alert.acknowledged_at.isoformat() if db_alert.acknowledged_at else None,
            "resolved_at": db_alert.resolved_at.isoformat() if db_alert.resolved_at else None,
        })

        return db_alert

    @staticmethod
    async def acknowledge_alert(db: Session, alert_id: str) -> Optional[Alert]:
        return await AlertService.update_alert(db, alert_id, AlertUpdate(status="ACKNOWLEDGED"))

    @staticmethod
    async def investigate_alert(db: Session, alert_id: str) -> Optional[Alert]:
        return await AlertService.update_alert(db, alert_id, AlertUpdate(status="INVESTIGATING"))

    @staticmethod
    async def resolve_alert(db: Session, alert_id: str) -> Optional[Alert]:
        return await AlertService.update_alert(db, alert_id, AlertUpdate(status="RESOLVED"))

    @staticmethod
    async def dismiss_alert(db: Session, alert_id: str) -> Optional[Alert]:
        return await AlertService.update_alert(db, alert_id, AlertUpdate(status="DISMISSED"))

    @staticmethod
    def get_deduplication_stats(db: Session) -> Dict[str, Any]:
        total_detections = db.query(Detection).count()
        total_alerts = db.query(Alert).count()
        active_alerts = db.query(Alert).filter(Alert.status.in_(["ACTIVE", "INVESTIGATING"])).count()
        
        # Calculate suppression ratio
        suppressed = max(0, total_detections - total_alerts)
        return {
            "total_raw_detections": total_detections,
            "total_operational_alerts": total_alerts,
            "active_operational_alerts": active_alerts,
            "suppressed_duplicate_detections": suppressed,
            "deduplication_ratio": f"{round((suppressed / max(1, total_detections)) * 100, 1)}%" if total_detections > 0 else "0%"
        }

    @staticmethod
    async def trigger_demo_scenario(db: Session) -> Dict[str, Any]:
        """
        Executes a real end-to-end Judge Demo Scenario:
        1. Creates raw ML Detection (track_intrusion on CAM-07)
        2. Generates Critical Operational Alert (ALT-XXX)
        3. Dispatches Real-time WebSocket event
        4. Returns alert and detection payload for UI inspection
        """
        now = datetime.utcnow()
        # 1. Insert ML Detection
        det = Detection(
            camera_id="CAM-07",
            type="track_intrusion",
            confidence=0.97,
            severity="CRITICAL",
            risk_score=96,
            timestamp=now,
            metadata_json='{"bbox": [140, 95, 340, 430], "zone": "High Voltage Track 2", "direction": "inbound"}'
        )
        db.add(det)
        db.commit()
        db.refresh(det)

        # 2. Insert Alert
        count = db.query(Alert).count() + 1
        alt_id = f"ALT-{count:03d}"
        while db.query(Alert).filter(Alert.id == alt_id).first():
            count += 1
            alt_id = f"ALT-{count:03d}"

        alert = Alert(
            id=alt_id,
            detection_id=det.id,
            camera_id="CAM-07",
            type="track_intrusion",
            severity="CRITICAL",
            status="ACTIVE",
            message="CRITICAL: Live unauthorized person detected in track bed near Platform 3 North",
            confidence=0.97,
            risk_score=96,
            created_at=now
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)

        # 3. Broadcast WebSocket event
        await ws_manager.broadcast_new_alert({
            "id": alert.id,
            "camera_id": alert.camera_id,
            "type": alert.type,
            "severity": alert.severity,
            "status": alert.status,
            "message": alert.message,
            "confidence": alert.confidence,
            "risk_score": alert.risk_score,
            "created_at": alert.created_at.isoformat(),
        })

        return {
            "success": True,
            "scenario": "Live Track Intrusion & Emergency Escalation",
            "alert": {
                "id": alert.id,
                "camera_id": alert.camera_id,
                "type": alert.type,
                "severity": alert.severity,
                "status": alert.status,
                "message": alert.message,
                "confidence": alert.confidence,
                "risk_score": alert.risk_score,
                "created_at": alert.created_at.isoformat(),
            },
            "detection": {
                "id": det.id,
                "camera_id": det.camera_id,
                "type": det.type,
                "confidence": det.confidence,
            }
        }
