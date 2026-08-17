from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple
import time
from config import config
from events.risk_engine import risk_engine
from integration.backend_client import backend_client

class EventEngine:
    """
    Unified AI Event Engine.
    Converts detector outputs into backend-compliant JSON payloads,
    enforces local deduplication cooldown, validates payloads, and dispatches to backend.
    """
    def __init__(self, cooldown_seconds: int = config.EVENT_COOLDOWN_SECONDS):
        self.cooldown_seconds = cooldown_seconds
        # Cooldown tracking: (camera_id, event_type) -> timestamp of last dispatched event
        self.last_dispatched: Dict[Tuple[str, str], float] = {}

    def process_and_dispatch_event(
        self,
        event_raw: Dict[str, Any],
        camera_id: str = config.DEFAULT_CAMERA_ID,
        location: str = config.DEFAULT_LOCATION
    ) -> Optional[Dict[str, Any]]:
        """
        Validates, formats, deduplicates, and dispatches an event to the backend.
        Returns the formatted payload if dispatched, or None if skipped (in cooldown/invalid).
        """
        event_type = event_raw.get("event_type", "person")
        raw_conf = float(event_raw.get("confidence", 0.90))
        
        # Rule 5: Confidence MUST be normalized 0.0 to 1.0
        confidence = max(0.0, min(1.0, round(raw_conf, 4)))

        # Metadata dictionary
        meta = event_raw.get("metadata", {})
        people_count = event_raw.get("people_count", meta.get("people_count", 0))
        dwell_frames = meta.get("dwell_frames", 1)

        # Rule 7 & 8: Transparent Risk & Severity Calculation
        risk_score, severity = risk_engine.calculate_risk_and_severity(
            event_type=event_type,
            confidence=confidence,
            people_count=people_count,
            dwell_frames=dwell_frames
        )

        # Local Event Deduplication / Cooldown Check
        cooldown_key = (camera_id, event_type)
        now_ts = time.time()
        last_time = self.last_dispatched.get(cooldown_key, 0.0)

        if (now_ts - last_time) < self.cooldown_seconds:
            # Event is in local cooldown — suppress repeated network request
            return None

        # Rule 9: ISO-8601 UTC Timestamp
        iso_timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        # Standardized Payload Contract
        payload = {
            "camera_id": camera_id,
            "location": location,
            "event_type": event_type,
            "confidence": confidence,
            "severity": severity,
            "risk_score": risk_score,
            "timestamp": iso_timestamp,
            "metadata": meta
        }

        # Dispatch event to existing backend HTTP client
        success = backend_client.send_event(payload)
        if success:
            self.last_dispatched[cooldown_key] = now_ts
            print(f"[EVENT ENGINE] Dispatched '{event_type}' (Risk: {risk_score}, Severity: {severity}) -> Backend")

        return payload

event_engine = EventEngine()
