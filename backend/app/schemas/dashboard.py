from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

class CameraSummary(BaseModel):
    active: int = 20
    total: int = 24
    degraded: int = 1
    offline: int = 1
    maintenance: int = 2

class AlertSummary(BaseModel):
    active: int = 7
    critical: int = 2
    high: int = 3
    medium: int = 2
    low: int = 0

class IncidentSummary(BaseModel):
    total: int = 4
    open: int = 2
    investigating: int = 1
    resolved: int = 1

class WorksiteSummaryMetrics(BaseModel):
    active_worksites: int = 6
    workers_present: int = 34
    overall_ppe_compliance: int = 96
    worksite_alerts: int = 1

class RiskSummary(BaseModel):
    level: str = "high" # low, moderate, high, critical
    score: int = 82
    trend: str = "stable" # increasing, stable, decreasing

class StationSafetyIndexBreakdown(BaseModel):
    overall_score: int = 82
    status_label: str = "Moderate Operational Risk"
    crowd_safety_score: int = 85
    security_score: int = 74
    worksite_compliance_score: int = 96
    cctv_health_score: int = 98

class AIEngineTelemetry(BaseModel):
    status: str = "ONLINE"
    cameras_processed: int = 24
    total_detections_today: int = 142
    inference_latency_ms: int = 24
    average_model_confidence_pct: float = 94.2
    uptime_pct: float = 99.8

class SystemHealthTelemetry(BaseModel):
    cctv_network_pct: float = 98.0
    ai_processing_pct: float = 96.0
    backend_api_pct: float = 100.0
    database_pct: float = 100.0
    websocket_pct: float = 99.0

class PriorityActionItem(BaseModel):
    id: str
    event_type: str
    title: str
    severity: str # CRITICAL, HIGH, MODERATE, LOW
    location: str
    zone: str
    camera_id: Optional[str] = None
    created_at: datetime
    relative_time: str
    risk_score: int
    confidence: float
    duration_str: str
    contributing_factors: List[str]
    suggested_action: str
    status: str # ACTIVE, ACKNOWLEDGED, INVESTIGATING

class NeedsAttentionItem(BaseModel):
    id: str
    location: str
    event_type: str
    elapsed_time: str
    severity: str
    camera_id: Optional[str] = None

class RecommendationItem(BaseModel):
    id: str
    category: str # CROWD, SECURITY, WORKER_SAFETY, INFRASTRUCTURE
    severity: str # HIGH, MODERATE, LOW
    headline: str
    observation: str
    trigger_rule: str # Explainable deterministic rule description
    suggested_action: str
    target_zone: str
    target_camera_id: Optional[str] = None
    target_route: str # e.g. /crowd-intelligence, /live-monitoring, /worker-safety
    action_label: str # e.g. "View Platform 3", "View Camera CAM-07", "View Worksite"
    created_at: datetime
    dismissed: bool = False

class GlobalSearchItem(BaseModel):
    id: str
    type: str # camera, alert, incident, location, worksite
    title: str
    subtitle: str
    route: str
    state: Optional[Dict[str, Any]] = None
    badge: Optional[str] = None
    badge_variant: Optional[str] = None

class GlobalSearchResponse(BaseModel):
    query: str
    total_results: int
    cameras: List[GlobalSearchItem] = []
    alerts: List[GlobalSearchItem] = []
    incidents: List[GlobalSearchItem] = []
    locations: List[GlobalSearchItem] = []
    worksites: List[GlobalSearchItem] = []

class DashboardSummaryResponse(BaseModel):
    station_id: str = "BRC"
    station_name: str = "Vadodara Railway Station"
    division: str = "Ahmedabad Division"
    system_status: str = "OPERATIONAL" # OPERATIONAL, DEGRADED, EMERGENCY
    last_updated: datetime
    cameras: CameraSummary
    alerts: AlertSummary
    incidents: IncidentSummary
    crowd_people_count: int = 428
    worksites: WorksiteSummaryMetrics
    safety_index: StationSafetyIndexBreakdown
    ai_telemetry: AIEngineTelemetry
    system_health: SystemHealthTelemetry
    priority_actions: List[PriorityActionItem] = []
    needs_attention: List[NeedsAttentionItem] = []
    recommendations: List[RecommendationItem] = []
