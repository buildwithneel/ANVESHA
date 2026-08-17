from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.database.models import Incident, IncidentEvent, Alert
from app.schemas.incident import IncidentCreate, IncidentUpdate
from app.websocket.manager import ws_manager

class IncidentService:
    @staticmethod
    def get_incidents(
        db: Session,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        camera_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Incident]:
        query = db.query(Incident)
        if status and status.upper() != "ALL":
            query = query.filter(Incident.status == status.upper())
        if severity and severity.upper() != "ALL":
            query = query.filter(Incident.severity == severity.upper())
        if camera_id and camera_id.upper() != "ALL":
            query = query.filter(Incident.camera_id == camera_id)
        return query.order_by(Incident.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_incident_by_id(db: Session, incident_id: str) -> Optional[Incident]:
        return db.query(Incident).filter(Incident.id == incident_id).first()

    @staticmethod
    async def create_incident(db: Session, incident_in: IncidentCreate) -> Incident:
        # Generate incident ID if not provided (e.g. INC-0042)
        incident_id = incident_in.id
        if not incident_id:
            count = db.query(Incident).count() + 1
            incident_id = f"INC-{count:04d}"
            while db.query(Incident).filter(Incident.id == incident_id).first():
                count += 1
                incident_id = f"INC-{count:04d}"

        db_incident = Incident(
            id=incident_id,
            alert_id=incident_in.alert_id,
            camera_id=incident_in.camera_id,
            type=incident_in.type,
            severity=incident_in.severity.upper(),
            status=incident_in.status.upper() if incident_in.status else "OPEN",
            description=incident_in.description,
            operator_notes=incident_in.operator_notes,
            created_at=datetime.utcnow()
        )
        db.add(db_incident)
        db.commit()
        db.refresh(db_incident)

        # Log initial timeline events
        now = datetime.utcnow()
        events = []

        if db_incident.alert_id:
            alert = db.query(Alert).filter(Alert.id == db_incident.alert_id).first()
            alert_msg = f"Alert {alert.id} ({alert.type.replace('_', ' ').title()})" if alert else f"Alert {db_incident.alert_id}"
            events.append(IncidentEvent(
                incident_id=db_incident.id,
                event_type="alert_linked",
                description=f"Automated AI detection triggered {alert_msg} on {db_incident.camera_id}.",
                actor="AI Vision Engine",
                created_at=now
            ))

        events.append(IncidentEvent(
            incident_id=db_incident.id,
            event_type="incident_opened",
            description=f"Incident ticket {db_incident.id} opened with severity {db_incident.severity}.",
            actor="Duty Officer",
            created_at=now
        ))

        if db_incident.operator_notes:
            events.append(IncidentEvent(
                incident_id=db_incident.id,
                event_type="note_added",
                description=f"Initial Observation: {db_incident.operator_notes}",
                actor="Duty Officer",
                created_at=now
            ))

        for ev in events:
            db.add(ev)
        db.commit()
        db.refresh(db_incident)

        # Broadcast WebSocket event
        await ws_manager.broadcast_incident_created({
            "id": db_incident.id,
            "alert_id": db_incident.alert_id,
            "camera_id": db_incident.camera_id,
            "type": db_incident.type,
            "severity": db_incident.severity,
            "status": db_incident.status,
            "description": db_incident.description,
            "created_at": db_incident.created_at.isoformat(),
        })

        return db_incident

    @staticmethod
    async def update_incident(db: Session, incident_id: str, incident_update: IncidentUpdate) -> Optional[Incident]:
        db_incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not db_incident:
            return None

        update_data = incident_update.model_dump(exclude_unset=True)
        prev_status = db_incident.status
        now = datetime.utcnow()

        if "status" in update_data and update_data["status"]:
            new_status = update_data["status"].upper()
            update_data["status"] = new_status
            if new_status in ["RESOLVED", "CLOSED"] and not db_incident.resolved_at:
                update_data["resolved_at"] = now

            if new_status != prev_status:
                event_type = "incident_resolved" if new_status == "RESOLVED" else "status_changed"
                desc = f"Incident status changed from {prev_status} to {new_status}."
                if new_status == "RESOLVED":
                    desc = f"Incident resolved and cleared by officer."
                elif new_status == "INVESTIGATING":
                    desc = f"Investigation underway. Security dispatched to location."

                ev = IncidentEvent(
                    incident_id=db_incident.id,
                    event_type=event_type,
                    description=desc,
                    actor="Duty Officer",
                    created_at=now
                )
                db.add(ev)

        if "operator_notes" in update_data and update_data["operator_notes"] and update_data["operator_notes"] != db_incident.operator_notes:
            ev = IncidentEvent(
                incident_id=db_incident.id,
                event_type="note_added",
                description=f"Officer Note: {update_data['operator_notes']}",
                actor="Duty Officer",
                created_at=now
            )
            db.add(ev)

        for field, val in update_data.items():
            setattr(db_incident, field, val)

        db.commit()
        db.refresh(db_incident)

        # Broadcast WebSocket event
        await ws_manager.broadcast("incident_updated", {
            "id": db_incident.id,
            "status": db_incident.status,
            "severity": db_incident.severity,
            "resolved_at": db_incident.resolved_at.isoformat() if db_incident.resolved_at else None,
        })

        return db_incident

    @staticmethod
    def get_incident_events(db: Session, incident_id: str) -> List[IncidentEvent]:
        return db.query(IncidentEvent).filter(IncidentEvent.incident_id == incident_id).order_by(IncidentEvent.created_at.asc()).all()

    @staticmethod
    async def add_incident_note(db: Session, incident_id: str, note_text: str, actor: str = "Duty Officer") -> IncidentEvent:
        db_incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not db_incident:
            raise ValueError(f"Incident {incident_id} not found")

        # Append to operator_notes
        if db_incident.operator_notes:
            db_incident.operator_notes += f"\n[{datetime.utcnow().strftime('%H:%M:%S')}] {note_text}"
        else:
            db_incident.operator_notes = f"[{datetime.utcnow().strftime('%H:%M:%S')}] {note_text}"

        ev = IncidentEvent(
            incident_id=incident_id,
            event_type="note_added",
            description=note_text,
            actor=actor,
            created_at=datetime.utcnow()
        )
        db.add(ev)
        db.commit()
        db.refresh(ev)

        # Broadcast update
        await ws_manager.broadcast("incident_updated", {
            "id": db_incident.id,
            "status": db_incident.status,
            "operator_notes": db_incident.operator_notes,
            "latest_event": {
                "id": ev.id,
                "event_type": ev.event_type,
                "description": ev.description,
                "actor": ev.actor,
                "created_at": ev.created_at.isoformat()
            }
        })

        return ev

    @staticmethod
    async def add_incident_event(db: Session, incident_id: str, event_type: str, description: str, actor: str = "Duty Officer") -> IncidentEvent:
        ev = IncidentEvent(
            incident_id=incident_id,
            event_type=event_type,
            description=description,
            actor=actor,
            created_at=datetime.utcnow()
        )
        db.add(ev)
        db.commit()
        db.refresh(ev)
        return ev
