from datetime import datetime
from typing import Dict, Any, List, Optional
from app.schemas.detection import DetectionIngestRequest, SUPPORTED_EVENT_TYPES

class MLDetectionAdapter:
    """
    ML Adapter Layer for RailGuard AI.
    Converts diverse computer vision / ML model outputs (e.g. YOLO, MediaPipe, custom detectors)
    into the standard RailGuard detection contract.
    """

    EVENT_TYPE_MAPPINGS = {
        # Direct matches
        "person": "person",
        "human": "person",
        "pedestrian": "person",
        "crowd": "crowd",
        "crowd_surge": "crowd",
        "crowd_density": "crowd",
        "overcrowding": "crowd",
        "restricted_zone": "restricted_zone",
        "restricted_area": "restricted_zone",
        "zone_intrusion": "restricted_zone",
        "ppe_violation": "ppe_violation",
        "no_ppe": "ppe_violation",
        "no_helmet": "ppe_violation",
        "worker_safety": "ppe_violation",
        "fall": "fall",
        "fallen_person": "fall",
        "passenger_fall": "fall",
        "abandoned_object": "abandoned_object",
        "unattended_baggage": "abandoned_object",
        "luggage_dwell": "abandoned_object",
        "track_intrusion": "track_intrusion",
        "track_trespass": "track_intrusion",
        "rail_crossing": "track_intrusion",
    }

    @classmethod
    def normalize_event_type(cls, raw_type: str) -> str:
        """Normalize raw detector labels into one of the standard RailGuard event types."""
        clean = raw_type.strip().lower().replace("-", "_").replace(" ", "_")
        if clean in SUPPORTED_EVENT_TYPES:
            return clean
        if clean in cls.EVENT_TYPE_MAPPINGS:
            return cls.EVENT_TYPE_MAPPINGS[clean]
        raise ValueError(
            f"Unsupported event type '{raw_type}'. Must be one of: {list(SUPPORTED_EVENT_TYPES)}"
        )

    @classmethod
    def from_raw_event(cls, raw_payload: Dict[str, Any]) -> DetectionIngestRequest:
        """
        Parses a raw ML event dict and produces a validated DetectionIngestRequest.
        """
        camera_id = raw_payload.get("camera_id") or raw_payload.get("cam_id") or raw_payload.get("source_id")
        if not camera_id:
            raise ValueError("Missing 'camera_id' in ML model event.")

        raw_event_type = raw_payload.get("event_type") or raw_payload.get("type") or raw_payload.get("class_name") or raw_payload.get("label")
        if not raw_event_type:
            raise ValueError("Missing event classification type in ML event.")

        normalized_type = cls.normalize_event_type(str(raw_event_type))

        confidence = float(raw_payload.get("confidence", 0.90))
        # Ensure confidence is clamped between 0.0 and 1.0
        confidence = max(0.0, min(1.0, confidence))

        risk_score = raw_payload.get("risk_score")
        if risk_score is None:
            # Default prototype risk score based on event type
            default_scores = {
                "person": 15,
                "crowd": 55,
                "ppe_violation": 65,
                "fall": 76,
                "abandoned_object": 78,
                "restricted_zone": 92,
                "track_intrusion": 95,
            }
            risk_score = default_scores.get(normalized_type, 50)
        else:
            risk_score = int(risk_score)
            risk_score = max(0, min(100, risk_score))

        timestamp = raw_payload.get("timestamp")
        if isinstance(timestamp, str):
            try:
                ts = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
            except Exception:
                ts = datetime.utcnow()
        elif isinstance(timestamp, datetime):
            ts = timestamp
        else:
            ts = datetime.utcnow()

        metadata = raw_payload.get("metadata") or {}
        # Support top-level bbox/people_count shorthand if provided
        if "bbox" in raw_payload and "bbox" not in metadata:
            metadata["bbox"] = raw_payload["bbox"]
        if "people_count" in raw_payload and "people_count" not in metadata:
            metadata["people_count"] = raw_payload["people_count"]
        if "source_resolution" not in metadata:
            metadata["source_resolution"] = raw_payload.get("source_resolution", [1920, 1080])

        return DetectionIngestRequest(
            camera_id=camera_id,
            event_type=normalized_type,
            confidence=confidence,
            risk_score=risk_score,
            timestamp=ts,
            metadata=metadata
        )
