from typing import List, Dict, Any, Optional
from zones.zone_manager import zone_manager

class RestrictedZoneDetector:
    """
    Detects person intrusions into configured restricted zones and track bed corridors.
    """
    def __init__(self, persistence_threshold: int = 2):
        self.persistence_threshold = persistence_threshold
        # Track persistent zone dwell count: track_id -> frames in zone
        self.track_dwell_counts: Dict[int, int] = {}

    def check_intrusions(
        self,
        tracked_persons: List[Dict[str, Any]],
        frame_width: int,
        frame_height: int,
        camera_id: str = "CAM-07"
    ) -> List[Dict[str, Any]]:
        """
        Evaluates tracked persons against camera's configured restricted zones.
        Returns generated intrusion events.
        """
        cam_cfg = zone_manager.camera_zones.get(camera_id, {})
        restricted_zones = cam_cfg.get("restricted_zones", [])
        
        if not restricted_zones:
            return []

        active_track_ids_in_zone = set()
        events = []

        for person in tracked_persons:
            bbox = person["bbox"]
            track_id = person.get("track_id", 0)
            conf = person.get("confidence", 0.90)

            for r_zone in restricted_zones:
                is_inside = zone_manager.is_bbox_inside_zone(
                    bbox=bbox,
                    polygon_pct=r_zone["polygon_pct"],
                    width=frame_width,
                    height=frame_height
                )

                if is_inside:
                    active_track_ids_in_zone.add(track_id)
                    current_dwell = self.track_dwell_counts.get(track_id, 0) + 1
                    self.track_dwell_counts[track_id] = current_dwell

                    # Trigger event if persistent duration met
                    if current_dwell >= self.persistence_threshold:
                        zone_name = r_zone.get("name", "Restricted Area")
                        
                        # Determine event_type (track_intrusion if track keyword present, else restricted_zone)
                        event_type = "track_intrusion" if "track" in zone_name.lower() else "restricted_zone"

                        events.append({
                            "event_type": event_type,
                            "confidence": max(0.85, conf),
                            "metadata": {
                                "track_id": track_id,
                                "zone": zone_name,
                                "bbox": bbox,
                                "dwell_frames": current_dwell
                            }
                        })

        # Cleanup dwell counts for tracks no longer in restricted zone
        for tid in list(self.track_dwell_counts.keys()):
            if tid not in active_track_ids_in_zone:
                del self.track_dwell_counts[tid]

        return events
