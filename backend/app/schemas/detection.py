from datetime import datetime
from typing import Optional, Dict, Any, Set
from pydantic import BaseModel, Field, model_validator, ConfigDict

SUPPORTED_EVENT_TYPES: Set[str] = {
    "person",
    "crowd",
    "restricted_zone",
    "ppe_violation",
    "fall",
    "abandoned_object",
    "track_intrusion",
}

class DetectionIngestRequest(BaseModel):
    camera_id: str = Field(..., description="Camera identifier, e.g. CAM-07")
    event_type: Optional[str] = Field(None, description="Event type: person, crowd, restricted_zone, ppe_violation, fall, abandoned_object, track_intrusion")
    type: Optional[str] = Field(None, description="Alternative alias for event_type")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence score between 0.0 and 1.0")
    risk_score: int = Field(50, ge=0, le=100, description="AI Risk Score between 0 and 100")
    severity: Optional[str] = Field(None, description="CRITICAL, HIGH, WARNING, NORMAL (prototype rules)")
    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow, description="ISO timestamp of event")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Detector metadata (bbox, people_count, source_resolution, etc.)")

    @model_validator(mode='before')
    @classmethod
    def validate_and_normalize(cls, data: Any) -> Any:
        if isinstance(data, dict):
            raw_type = data.get("event_type") or data.get("type")
            if not raw_type:
                raise ValueError("Either 'event_type' or 'type' must be provided.")
            
            clean_type = str(raw_type).strip().lower().replace("-", "_").replace(" ", "_")
            if clean_type not in SUPPORTED_EVENT_TYPES:
                # Check for direct alias
                alias_map = {
                    "human": "person",
                    "pedestrian": "person",
                    "crowd_surge": "crowd",
                    "crowd_density": "crowd",
                    "overcrowding": "crowd",
                    "restricted_area": "restricted_zone",
                    "no_ppe": "ppe_violation",
                    "worker_safety": "ppe_violation",
                    "fallen_person": "fall",
                    "unattended_baggage": "abandoned_object",
                    "track_trespass": "track_intrusion",
                }
                if clean_type in alias_map:
                    clean_type = alias_map[clean_type]
                else:
                    raise ValueError(
                        f"Unsupported event type '{raw_type}'. Must be one of: {sorted(list(SUPPORTED_EVENT_TYPES))}"
                    )

            data["event_type"] = clean_type
            data["type"] = clean_type

            # Prototype Severity Rules Mapping
            # NORMAL: person
            # WARNING: crowd, ppe_violation
            # HIGH: fall, abandoned_object
            # CRITICAL: restricted_zone, track_intrusion
            if not data.get("severity"):
                if clean_type == "person":
                    data["severity"] = "NORMAL"
                elif clean_type in ["crowd", "ppe_violation"]:
                    data["severity"] = "WARNING"
                elif clean_type in ["fall", "abandoned_object"]:
                    data["severity"] = "HIGH"
                elif clean_type in ["restricted_zone", "track_intrusion"]:
                    data["severity"] = "CRITICAL"
                else:
                    data["severity"] = "NORMAL"
        return data

class DetectionResponse(BaseModel):
    id: int
    camera_id: str
    type: str
    confidence: float
    timestamp: datetime
    severity: str
    risk_score: int
    metadata: Dict[str, Any] = Field(default_factory=dict)
    alert_triggered: bool = False
    alert_id: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
