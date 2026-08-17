from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict

class RiskFactorItem(BaseModel):
    id: str
    name: str
    status: str # "pass", "warning", "critical"
    description: str

class WorksiteEventBase(BaseModel):
    worksite_id: str
    event_type: str # ppe_violation, restricted_work_zone, worker_fall, unsafe_crowding, worker_detected, worksite_activity, alert_acknowledged, incident_created
    severity: str = "INFO" # CRITICAL, HIGH, MEDIUM, LOW, INFO
    description: str
    camera_id: Optional[str] = None
    confidence: Optional[float] = 0.92
    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow)

class WorksiteEventCreate(WorksiteEventBase):
    pass

class WorksiteEventResponse(WorksiteEventBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class WorksiteBase(BaseModel):
    id: str
    name: str
    zone: str
    type: str
    status: str = "ACTIVE" # ACTIVE, PAUSED, COMPLETED, RESTRICTED
    worker_count: int = 0
    ppe_compliance: int = 100
    helmet_compliance: int = 100
    vest_compliance: int = 100
    risk_level: str = "LOW" # LOW, MODERATE, HIGH, CRITICAL
    risk_score: int = 20
    camera_count: int = 1
    cameras: List[str] = []
    risk_factors: List[RiskFactorItem] = []

class WorksiteCreate(WorksiteBase):
    pass

class WorksiteUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    worker_count: Optional[int] = None
    ppe_compliance: Optional[int] = None
    helmet_compliance: Optional[int] = None
    vest_compliance: Optional[int] = None
    risk_level: Optional[str] = None
    risk_score: Optional[int] = None
    camera_count: Optional[int] = None
    cameras: Optional[List[str]] = None
    risk_factors: Optional[List[RiskFactorItem]] = None

class WorksiteResponse(BaseModel):
    id: str
    name: str
    zone: str
    type: str
    status: str
    worker_count: int
    ppe_compliance: int
    helmet_compliance: int
    vest_compliance: int
    risk_level: str
    risk_score: int
    camera_count: int
    cameras: List[str]
    risk_factors: List[RiskFactorItem]
    created_at: datetime
    updated_at: datetime
    recent_events: Optional[List[WorksiteEventResponse]] = []
    active_alerts_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


class WorksiteSummaryResponse(BaseModel):
    active_worksites: int
    total_workers_detected: int
    safety_alerts_count: int
    critical_issues_count: int
    overall_ppe_compliance: int
    helmet_compliance: int
    vest_compliance: int
    worksites: List[WorksiteResponse]
