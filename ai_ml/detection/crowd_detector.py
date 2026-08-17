from typing import List, Dict, Any, Tuple
from collections import deque
from config import config
from zones.zone_manager import zone_manager

class CrowdDetector:
    """
    Multi-Signal Crowd Intelligence Engine.
    Combines person count, polygon zone occupancy, density percentage,
    rate of increase derivative, trend direction, and surge flags.
    Includes temporal trend smoothing and surge confirmation persistence.
    """
    def __init__(self, history_size: int = 30, surge_confirmation_evaluations: int = 2):
        self.history_size = history_size
        self.count_history = deque(maxlen=history_size)
        self.high_density_persistence: int = 0
        self.surge_confirmation_evaluations: int = surge_confirmation_evaluations
        self.surge_persistence_count: int = 0

    def analyze_crowd(
        self,
        tracked_persons: List[Dict[str, Any]],
        frame_width: int,
        frame_height: int,
        camera_id: str = "CAM-07"
    ) -> Dict[str, Any]:
        """
        Analyzes multi-signal crowd metrics from tracked person bounding boxes and polygon zones.
        """
        total_people = len(tracked_persons)
        
        # 1. Spatial Polygon Crowd-Zone Occupancy
        cam_cfg = zone_manager.camera_zones.get(camera_id, {})
        crowd_zones = cam_cfg.get("crowd_zones", [])
        max_capacity = crowd_zones[0].get("max_capacity", 40) if crowd_zones else 40

        zone_occupancy = 0
        if crowd_zones and frame_width > 0 and frame_height > 0:
            for person in tracked_persons:
                bbox = person["bbox"]
                for c_zone in crowd_zones:
                    if zone_manager.is_bbox_inside_zone(bbox, c_zone["polygon_pct"], frame_width, frame_height):
                        zone_occupancy += 1
                        break
        else:
            zone_occupancy = total_people

        self.count_history.append(zone_occupancy)

        # 2. Density Percentage Estimate
        density_pct = min(100.0, round((zone_occupancy / float(max_capacity)) * 100.0, 1))

        # 3. Crowd Status Determination
        if density_pct < config.CROWD_LOW_MAX:
            status = "LOW"
        elif density_pct < config.CROWD_MODERATE_MAX:
            status = "MODERATE"
        elif density_pct < config.CROWD_HIGH_MAX:
            status = "HIGH"
        else:
            status = "CRITICAL"

        # 4. Short-Term Trend & Rate of Change (Temporal Window)
        trend = "STABLE"
        rate_of_change = 0.0
        if len(self.count_history) >= 3:
            recent_avg = sum(list(self.count_history)[-3:]) / 3.0
            older_avg = sum(list(self.count_history)[:3]) / 3.0
            rate_of_change = round(recent_avg - older_avg, 1)

            if rate_of_change >= 2.0:
                trend = "INCREASING"
            elif rate_of_change <= -2.0:
                trend = "DECREASING"

        # 5. Crowd Surge Detection & Temporal Confirmation Persistence
        raw_surge_condition = (rate_of_change >= 3.0) or (trend == "INCREASING" and density_pct >= config.CROWD_MODERATE_MAX)
        
        if raw_surge_condition:
            self.surge_persistence_count = min(self.surge_confirmation_evaluations, self.surge_persistence_count + 1)
        else:
            self.surge_persistence_count = 0

        is_surge = (self.surge_persistence_count >= self.surge_confirmation_evaluations)
        
        if density_pct >= config.CROWD_MODERATE_MAX:
            self.high_density_persistence += 1
        else:
            self.high_density_persistence = 0

        # 6. Dynamic Confidence Calculation
        base_conf = 0.85
        if len(self.count_history) >= 5:
            base_conf += 0.05
        if self.high_density_persistence >= 3:
            base_conf += 0.05
        confidence = min(0.95, round(base_conf, 2))

        # 7. Generate Crowd Event Payload if threshold met
        is_crowd_event = (density_pct >= config.CROWD_MODERATE_MAX) or is_surge
        event_data = None

        if is_crowd_event:
            event_data = {
                "event_type": "crowd",
                "confidence": confidence,
                "people_count": total_people,
                "metadata": {
                    "people_count": total_people,
                    "zone_occupancy": zone_occupancy,
                    "density_percentage": density_pct,
                    "trend": trend,
                    "surge": is_surge,
                    "rate_of_change": rate_of_change,
                    "status": status,
                    "persistence_frames": self.high_density_persistence
                }
            }

        return {
            "people_count": total_people,
            "zone_occupancy": zone_occupancy,
            "density_pct": density_pct,
            "status": status,
            "trend": trend,
            "rate_of_change": rate_of_change,
            "surge": is_surge,
            "is_event": is_crowd_event,
            "event_data": event_data
        }


