from typing import Dict, Any, Tuple
from config import config

class RiskEngine:
    """
    Transparent Rule-Based AI Risk & Severity Engine.
    Calculates 0-100 risk score and mapped severity level.
    """
    @staticmethod
    def calculate_risk_and_severity(
        event_type: str,
        confidence: float,
        people_count: int = 0,
        dwell_frames: int = 1
    ) -> Tuple[int, str]:
        """
        Calculates risk score (0-100) and severity ('NORMAL', 'WARNING', 'HIGH', 'CRITICAL').
        """
        # 1. Base score from configuration
        base_score = config.RISK_WEIGHTS.get(event_type, 50)

        # 2. Confidence scaling (0.8 to 1.1)
        conf_scaled = base_score * (0.8 + (confidence * 0.3))

        # 3. Dwell duration bonus (+5 for persistent events)
        dwell_bonus = min(15, (dwell_frames - 1) * 3)

        # 4. Crowd level multiplier for crowd events
        crowd_bonus = 0
        if event_type == "crowd":
            crowd_bonus = min(20, max(0, people_count - 20))

        raw_score = conf_scaled + dwell_bonus + crowd_bonus
        final_risk = int(max(0, min(100, round(raw_score))))

        # 5. Map Risk Score to Severity Level
        if final_risk >= 80 or event_type in ["restricted_zone", "track_intrusion"]:
            severity = "CRITICAL"
        elif final_risk >= 60 or event_type in ["fall", "abandoned_object"]:
            severity = "HIGH"
        elif final_risk >= 30 or event_type in ["crowd", "ppe_violation"]:
            severity = "WARNING"
        else:
            severity = "NORMAL"

        return final_risk, severity

risk_engine = RiskEngine()
