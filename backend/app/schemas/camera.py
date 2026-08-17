from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class CameraBase(BaseModel):
    camera_code: str = Field(..., description="Unique camera identifier code, e.g. CAM-01")
    name: Optional[str] = Field(None, description="Descriptive camera name, e.g. Platform 1 North")
    station_id: str = Field("BRC", description="Station ID foreign key, e.g. BRC")
    location: str = Field(..., description="Location description, e.g. Platform 1 North Concourse")
    category: str = Field("Platform", description="Category, e.g. Platform, FOB, Track Bed, Concourse, Maintenance")
    zone: Optional[str] = Field(None, description="Zone, e.g. Platform 1, FOB, Track Area, Maintenance Area")
    status: str = Field("LIVE", description="LIVE, DEGRADED, OFFLINE, MAINTENANCE")
    stream_url: str = Field("", description="RTSP or HLS stream URL")
    ai_enabled: bool = Field(True, description="Whether AI video analytics are enabled")
    ai_status: str = Field("ACTIVE", description="ACTIVE, SCANNING, ALERT, DISABLED")
    last_heartbeat: Optional[datetime] = Field(None, description="Timestamp of the most recent heartbeat")

class CameraCreate(CameraBase):
    id: Optional[str] = Field(None, description="Optional custom ID. If omitted, camera_code is used as ID")

class CameraUpdate(BaseModel):
    name: Optional[str] = None
    station_id: Optional[str] = None
    location: Optional[str] = None
    category: Optional[str] = None
    zone: Optional[str] = None
    status: Optional[str] = None
    stream_url: Optional[str] = None
    ai_enabled: Optional[bool] = None
    ai_status: Optional[str] = None
    last_heartbeat: Optional[datetime] = None

class DetectionSummary(BaseModel):
    id: int
    type: str
    confidence: float
    severity: str
    risk_score: int
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None

class CameraEventItem(BaseModel):
    id: int
    camera_id: str
    event_type: str
    confidence: float
    severity: str
    risk_score: int
    timestamp: datetime
    location: str
    metadata: Optional[Dict[str, Any]] = None

class CameraResponse(CameraBase):
    id: str
    active_alert_count: int = Field(0, description="Count of currently ACTIVE alerts on this camera")
    current_detection: Optional[DetectionSummary] = Field(None, description="Latest AI detection on this camera")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class CameraSnapshotRequest(BaseModel):
    image_data: Optional[str] = Field(None, description="Base64 or captured canvas data URI")
    note: Optional[str] = Field(None, description="Optional operator note")

class CameraSnapshotResponse(BaseModel):
    id: str
    camera_id: str
    camera_code: str
    location: str
    timestamp: datetime
    file_path: Optional[str] = None
    message: str = "Snapshot captured successfully"

class CameraHealthSummary(BaseModel):
    total_cameras: int
    online_count: int
    degraded_count: int
    offline_count: int
    maintenance_count: int
    active_alert_count: int
    network_health_pct: float
    ai_health_pct: float
