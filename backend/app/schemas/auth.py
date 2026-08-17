from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class LoginRequest(BaseModel):
    employee_id: str = Field(..., description="Railway Employee ID, e.g. RLY-10042")
    password: str = Field(..., description="Employee password")
    remember_me: Optional[bool] = Field(False, description="Remember device preference")

class UserResponse(BaseModel):
    id: str
    employee_id: str
    name: str
    email: Optional[str] = None
    role: str # ADMIN or OFFICER
    department: str
    station: str
    status: str # ACTIVE or DISABLED
    last_login: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class AuditLogResponse(BaseModel):
    id: int
    user_id: str
    user_name: str
    role: str
    action: str
    resource: Optional[str] = None
    resource_id: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime
    ip_address: Optional[str] = "127.0.0.1"
    model_config = ConfigDict(from_attributes=True)

class ServiceHealthStatus(BaseModel):
    status: str # "OPERATIONAL", "DEGRADED", "OFFLINE"
    uptime_pct: float
    latency_ms: Optional[int] = None
    message: Optional[str] = None

class SystemHealthResponse(BaseModel):
    backend: ServiceHealthStatus
    database: ServiceHealthStatus
    websocket: ServiceHealthStatus
    ai_engine: ServiceHealthStatus
    cctv_network: ServiceHealthStatus
    system_status: str # "OPERATIONAL" or "DEGRADED"
    last_checked: datetime = Field(default_factory=datetime.utcnow)

class FailureSimulationRequest(BaseModel):
    action: str = Field(..., description="SIMULATE_CAMERA_OFFLINE, RESTORE_CAMERA, SIMULATE_AI_DEGRADED, RESTORE_AI, SIMULATE_WS_DISCONNECT, SIMULATE_HIGH_CROWD, SIMULATE_CRITICAL_ALERT")
    target_id: Optional[str] = Field(None, description="e.g. CAM-07 or WS-01")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
