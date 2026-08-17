from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class CrowdMeasurementBase(BaseModel):
    camera_id: str = Field(..., description="Camera ID measuring crowd")
    location: str = Field(..., description="Location, e.g. Platform 1 North FOB")
    people_count: int = Field(0, ge=0, description="Estimated count of people")
    density: str = Field("Normal", description="Density level: Normal, Moderate, High, Critical")
    risk_level: str = Field("low", description="Risk level: low, moderate, high, critical")
    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow)

class CrowdMeasurementCreate(CrowdMeasurementBase):
    pass

class CrowdMeasurementResponse(CrowdMeasurementBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
