from datetime import datetime
import json
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Station(Base):
    __tablename__ = "stations"

    id = Column(String, primary_key=True, index=True) # e.g. "BRC"
    name = Column(String, nullable=False)
    division = Column(String, nullable=False)
    location = Column(String, nullable=False)
    status = Column(String, default="OPERATIONAL") # OPERATIONAL, DEGRADED, EMERGENCY

    cameras = relationship("Camera", back_populates="station", cascade="all, delete-orphan")


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(String, primary_key=True, index=True) # e.g. "CAM-01" or "CAM-BRC-PF01-N"
    camera_code = Column(String, unique=True, index=True, nullable=False) # e.g. "CAM-01"
    name = Column(String, nullable=True) # e.g. "Platform 1 North Concourse"
    station_id = Column(String, ForeignKey("stations.id"), nullable=False)
    location = Column(String, nullable=False)
    category = Column(String, nullable=False) # Platform, Track Bed, FOB, Concourse, Entrance/Exit, Maintenance
    zone = Column(String, nullable=True) # "Platform 1", "Platform 2", "Platform 3", "Platform 4", "Concourse", "FOB", "Track Area", "Maintenance Area"
    status = Column(String, default="LIVE") # LIVE, ONLINE, DEGRADED, OFFLINE, MAINTENANCE
    stream_url = Column(String, nullable=False, default="")
    ai_enabled = Column(Boolean, default=True)
    ai_status = Column(String, default="ACTIVE") # ACTIVE, SCANNING, ALERT, DISABLED
    last_heartbeat = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    station = relationship("Station", back_populates="cameras")
    detections = relationship("Detection", back_populates="camera", cascade="all, delete-orphan", order_by="Detection.timestamp.desc()")
    alerts = relationship("Alert", back_populates="camera", cascade="all, delete-orphan", order_by="Alert.created_at.desc()")
    incidents = relationship("Incident", back_populates="camera", cascade="all, delete-orphan")
    crowd_measurements = relationship("CrowdMeasurement", back_populates="camera", cascade="all, delete-orphan")


class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    camera_id = Column(String, ForeignKey("cameras.id"), nullable=False, index=True)
    type = Column(String, nullable=False, index=True) # restricted_zone, track_intrusion, crowd_surge, unattended_baggage, fallen_person, worker_no_ppe
    confidence = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    severity = Column(String, nullable=False, default="MEDIUM") # CRITICAL, HIGH, MEDIUM, LOW, INFO
    risk_score = Column(Integer, nullable=False, default=50) # 0 - 100
    metadata_json = Column(Text, nullable=True, default="{}") # JSON-serialized metadata (bbox, people_count, etc.)

    camera = relationship("Camera", back_populates="detections")
    alerts = relationship("Alert", back_populates="detection")

    @property
    def metadata_dict(self):
        if not self.metadata_json:
            return {}
        try:
            return json.loads(self.metadata_json)
        except Exception:
            return {}

    @metadata_dict.setter
    def metadata_dict(self, val):
        self.metadata_json = json.dumps(val) if val is not None else "{}"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, index=True) # e.g. "ALT-001"
    detection_id = Column(Integer, ForeignKey("detections.id"), nullable=True)
    camera_id = Column(String, ForeignKey("cameras.id"), nullable=False, index=True)
    type = Column(String, nullable=False, index=True)
    severity = Column(String, nullable=False, index=True) # CRITICAL, HIGH, MEDIUM, LOW, INFO
    status = Column(String, nullable=False, default="ACTIVE", index=True) # ACTIVE, ACKNOWLEDGED, RESOLVED, INVESTIGATING
    message = Column(String, nullable=False)
    confidence = Column(Float, nullable=False, default=0.9)
    risk_score = Column(Integer, nullable=False, default=75)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    camera = relationship("Camera", back_populates="alerts")
    detection = relationship("Detection", back_populates="alerts")
    incidents = relationship("Incident", back_populates="alert")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True, index=True) # e.g. "INC-001"
    alert_id = Column(String, ForeignKey("alerts.id"), nullable=True)
    camera_id = Column(String, ForeignKey("cameras.id"), nullable=False, index=True)
    type = Column(String, nullable=False)
    severity = Column(String, nullable=False) # CRITICAL, HIGH, MEDIUM, LOW
    status = Column(String, nullable=False, default="OPEN") # OPEN, IN_PROGRESS, ESCALATED, RESOLVED, CLOSED
    description = Column(String, nullable=False)
    operator_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    camera = relationship("Camera", back_populates="incidents")
    alert = relationship("Alert", back_populates="incidents")
    timeline_events = relationship("IncidentEvent", back_populates="incident", cascade="all, delete-orphan", order_by="IncidentEvent.created_at.asc()")


class IncidentEvent(Base):
    __tablename__ = "incident_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=False, index=True)
    event_type = Column(String, nullable=False) # alert_created, alert_acknowledged, investigation_started, note_added, incident_resolved, status_changed
    description = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    actor = Column(String, nullable=False, default="Officer / AI System")

    incident = relationship("Incident", back_populates="timeline_events")


class CrowdMeasurement(Base):
    __tablename__ = "crowd_measurements"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    camera_id = Column(String, ForeignKey("cameras.id"), nullable=False, index=True)
    location = Column(String, nullable=False)
    people_count = Column(Integer, nullable=False, default=0)
    density = Column(String, nullable=False, default="Normal") # "Normal", "Moderate", "High", "Critical" or numeric string
    risk_level = Column(String, nullable=False, default="low") # low, moderate, high, critical
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    camera = relationship("Camera", back_populates="crowd_measurements")


class Worksite(Base):
    __tablename__ = "worksites"

    id = Column(String, primary_key=True, index=True) # e.g. "WS-01"
    name = Column(String, nullable=False) # e.g. "Platform 3 Maintenance"
    zone = Column(String, nullable=False) # e.g. "Platform 3", "Track Area"
    type = Column(String, nullable=False) # "Platform Maintenance", "Track Maintenance", "FOB Maintenance", "Electrical Work Area", "Cleaning Zone", "Concourse Maintenance"
    status = Column(String, default="ACTIVE", nullable=False) # ACTIVE, PAUSED, COMPLETED, RESTRICTED
    worker_count = Column(Integer, default=0, nullable=False)
    ppe_compliance = Column(Integer, default=100, nullable=False) # 0-100
    helmet_compliance = Column(Integer, default=100, nullable=False) # 0-100
    vest_compliance = Column(Integer, default=100, nullable=False) # 0-100
    risk_level = Column(String, default="LOW", nullable=False) # LOW, MODERATE, HIGH, CRITICAL
    risk_score = Column(Integer, default=20, nullable=False) # 0-100
    camera_count = Column(Integer, default=1, nullable=False)
    cameras_json = Column(Text, default="[]", nullable=False)
    risk_factors_json = Column(Text, default="[]", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    events = relationship("WorksiteEvent", back_populates="worksite", cascade="all, delete-orphan", order_by="WorksiteEvent.timestamp.desc()")

    @property
    def cameras_list(self):
        if not self.cameras_json:
            return []
        try:
            return json.loads(self.cameras_json)
        except Exception:
            return []

    @cameras_list.setter
    def cameras_list(self, val):
        self.cameras_json = json.dumps(val) if val is not None else "[]"

    @property
    def risk_factors(self):
        if not self.risk_factors_json:
            return []
        try:
            return json.loads(self.risk_factors_json)
        except Exception:
            return []

    @risk_factors.setter
    def risk_factors(self, val):
        self.risk_factors_json = json.dumps(val) if val is not None else "[]"


class WorksiteEvent(Base):
    __tablename__ = "worksite_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    worksite_id = Column(String, ForeignKey("worksites.id"), nullable=False, index=True)
    event_type = Column(String, nullable=False, index=True) # ppe_violation, restricted_work_zone, worker_fall, unsafe_crowding, worker_detected, worksite_activity
    severity = Column(String, default="INFO", nullable=False) # CRITICAL, HIGH, MEDIUM, LOW, INFO
    description = Column(String, nullable=False)
    camera_id = Column(String, nullable=True)
    confidence = Column(Float, nullable=True, default=0.92)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    worksite = relationship("Worksite", back_populates="events")


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True) # e.g. "USR-001"
    employee_id = Column(String, unique=True, nullable=False, index=True) # e.g. "RLY-10042"
    name = Column(String, nullable=False) # e.g. "Rahul Sharma"
    email = Column(String, nullable=True) # e.g. "r.sharma@railguard.gov.in"
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="OFFICER") # ADMIN, OFFICER
    department = Column(String, nullable=False, default="Platform Operations") # Platform Operations, Safety & Inspection, Station Administration
    station = Column(String, nullable=False, default="Vadodara Junction (BRC)")
    status = Column(String, nullable=False, default="ACTIVE") # ACTIVE, DISABLED
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)

    @property
    def is_active(self):
        return self.status == "ACTIVE"


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, nullable=False, default="USR-001", index=True)
    user_name = Column(String, nullable=False, default="Duty Officer")
    role = Column(String, nullable=False, default="OFFICER")
    action = Column(String, nullable=False, index=True) # LOGIN, LOGOUT, VIEW_CAMERA, ACKNOWLEDGE_ALERT, RESOLVE_INCIDENT, SIMULATE_FAILURE, UPDATE_SETTINGS
    resource = Column(String, nullable=True) # Camera, Alert, Incident, System, Worksite
    resource_id = Column(String, nullable=True) # CAM-07, ALT-001, INC-001
    details_json = Column(Text, nullable=True, default="{}")
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    ip_address = Column(String, nullable=True, default="127.0.0.1")

    @property
    def details_dict(self):
        if not self.details_json:
            return {}
        try:
            return json.loads(self.details_json)
        except Exception:
            return {}

    @details_dict.setter
    def details_dict(self, val):
        self.details_json = json.dumps(val) if val is not None else "{}"

