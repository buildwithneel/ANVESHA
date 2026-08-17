from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class AIDetectionIngest(BaseModel):
    """
    ML-Ready Detection Ingestion Payload.
    Model-agnostic; accommodates bounding boxes, counts, and custom detector metadata.
    """
    camera_id: str = Field(..., description="Camera identifier, e.g. CAM-07")
    location: Optional[str] = Field(None, description="Station zone/platform label")
    event_type: str = Field(..., description="Event type: restricted_zone, crowd, ppe_violation, fall, abandoned_object, track_intrusion, person")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model confidence score between 0.0 and 1.0")
    severity: Optional[str] = Field(None, description="NORMAL, WARNING, HIGH, CRITICAL")
    risk_score: Optional[int] = Field(50, ge=0, le=100, description="Calculated or assigned risk score (0-100)")
    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow, description="UTC timestamp of detection")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Flexible metadata (bounding boxes, track IDs, etc.)")

class ModelInfoDetail(BaseModel):
    name: str = "RailGuard Vision Pipeline"
    purpose: str = "Railway passenger safety, track intrusion detection, and PPE worker compliance"
    input_format: str = "RTSP Video Stream / 1080p @ 25 FPS (H.264 / H.265)"
    output_format: str = "JSON Detections (Class, Confidence 0-1, BoundingBox [x,y,w,h], TrackID)"
    inference_mode: str = "Simulation / ML-Ready Contract"
    is_simulation: bool = True
    active_runtime: str = "Local Engine Server"

class AIEngineStatusResponse(BaseModel):
    engine_mode: str = Field(..., description="DEMO MODE, LIVE MODEL, or OFFLINE")
    is_simulation: bool = True
    detection_pipeline_status: str = "OPERATIONAL"
    active_cameras_processed: int = 24
    total_detections_today: int = 142
    inference_latency_ms: int = 24
    average_confidence_pct: float = 94.2
    uptime_pct: float = 99.8
    model_info: ModelInfoDetail

class AIAnalyticsSummaryResponse(BaseModel):
    detections_today: int
    high_risk_events: int
    alerts_generated: int
    average_confidence: float
    is_demo_data: bool = True
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class TrendDataPoint(BaseModel):
    time: str
    density: Optional[float] = None
    risk_score: Optional[int] = None
    passengers: Optional[int] = None

class CrowdDensityTrendResponse(BaseModel):
    time_range: str
    current_density: float
    average_density: float
    peak_density: float
    trend_direction: str # "INCREASING", "STABLE", "DECREASING"
    trend_data: List[TrendDataPoint]

class RiskAnalyticsResponse(BaseModel):
    time_range: str
    current_risk_score: int
    risk_level: str # "LOW", "MODERATE", "HIGH", "CRITICAL"
    net_change: int # e.g. +14 or -5
    trend_data: List[TrendDataPoint]
    contributing_factors: List[str]
    disclaimer: str = "Decision-support indicator. Derived from observable CCTV events and crowd metrics."

class EventCategoryMetric(BaseModel):
    category: str
    count: int
    percentage: float
    color: str

class EventDistributionResponse(BaseModel):
    total_events: int
    categories: List[EventCategoryMetric]

class AIExplainableInsight(BaseModel):
    id: str
    category: str # "CROWD", "SECURITY", "WORKER_SAFETY"
    what: str
    why: str
    confidence: float
    impact: str # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    suggested_action: str
    location: str
    camera_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class IncidentNarrativeResponse(BaseModel):
    incident_id: str
    title: str
    narrative_summary: str
    timeline_highlights: List[str]
    confidence_score: float
    risk_score: int
    status: str
