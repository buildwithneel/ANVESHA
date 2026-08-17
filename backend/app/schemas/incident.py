from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class IncidentEventBase(BaseModel):
    event_type: str = Field(..., description="alert_created, alert_acknowledged, investigation_started, note_added, incident_resolved, status_changed")
    description: str = Field(..., description="Event description")
    actor: str = Field("Officer / AI System", description="Actor who performed the event")

class IncidentEventCreate(IncidentEventBase):
    incident_id: Optional[str] = None

class IncidentEventResponse(IncidentEventBase):
    id: int
    incident_id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class IncidentNoteCreate(BaseModel):
    note: str = Field(..., description="Officer note text")
    actor: Optional[str] = Field("Duty Officer", description="Name/title of officer")

class IncidentBase(BaseModel):
    alert_id: Optional[str] = Field(None, description="Linked Alert ID")
    camera_id: str = Field(..., description="Camera ID")
    type: str = Field(..., description="Incident category / type")
    severity: str = Field("MEDIUM", description="CRITICAL, HIGH, MEDIUM, LOW")
    status: str = Field("OPEN", description="OPEN, INVESTIGATING, RESOLVED, CLOSED")
    description: str = Field(..., description="Incident description details")
    operator_notes: Optional[str] = Field(None, description="Operator investigation notes")

class IncidentCreate(IncidentBase):
    id: Optional[str] = Field(None, description="Incident ID, e.g. INC-001 (auto-generated if omitted)")

class IncidentUpdate(BaseModel):
    status: Optional[str] = Field(None, description="OPEN, INVESTIGATING, RESOLVED, CLOSED")
    severity: Optional[str] = None
    description: Optional[str] = None
    operator_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None

class IncidentResponse(IncidentBase):
    id: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    timeline_events: List[IncidentEventResponse] = []
    model_config = ConfigDict(from_attributes=True)
