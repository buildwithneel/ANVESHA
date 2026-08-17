from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class AlertBase(BaseModel):
    camera_id: str = Field(..., description="Camera ID where alert occurred")
    type: str = Field(..., description="Alert classification type")
    severity: str = Field("MEDIUM", description="CRITICAL, HIGH, MEDIUM, LOW, INFO")
    status: str = Field("ACTIVE", description="ACTIVE, ACKNOWLEDGED, RESOLVED, INVESTIGATING")
    message: str = Field(..., description="Descriptive alert text")
    confidence: float = Field(0.9, ge=0.0, le=1.0, description="Detection confidence score")
    risk_score: int = Field(75, ge=0, le=100, description="Calculated risk score")
    detection_id: Optional[int] = Field(None, description="Optional linked detection ID")

class AlertCreate(AlertBase):
    id: Optional[str] = Field(None, description="Alert ID, e.g. ALT-001 (auto-generated if omitted)")

class AlertUpdate(BaseModel):
    status: Optional[str] = Field(None, description="ACTIVE, ACKNOWLEDGED, RESOLVED, INVESTIGATING")
    severity: Optional[str] = None
    message: Optional[str] = None
    risk_score: Optional[int] = None
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

class AlertResponse(AlertBase):
    id: str
    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
