import json
import os
import cv2
import numpy as np
from shapely.geometry import Point, Polygon
from typing import Dict, List, Tuple, Any, Optional

class ZoneManager:
    """
    Manages configurable polygon zones (Restricted Zones, Crowd Zones, Work Zones).
    Uses Shapely for accurate geometric spatial calculations.
    """
    def __init__(self, config_path: str = "config/zones.json"):
        self.config_path = config_path
        self.camera_zones: Dict[str, Any] = {}
        self.load_zones()

    def load_zones(self):
        """Loads zone definitions from JSON configuration."""
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, "r") as f:
                    self.camera_zones = json.load(f)
                print(f"[ZONES] Loaded zone configuration from {self.config_path}")
            except Exception as e:
                print(f"[ERROR] Failed to load zones configuration: {e}")
                self.camera_zones = {}
        else:
            print(f"[WARNING] Zones file not found at {self.config_path}. Using empty zones.")
            self.camera_zones = {}

    def get_pixel_polygon(self, polygon_pct: List[List[float]], width: int, height: int) -> np.ndarray:
        """Converts percentage coordinates [[x_pct, y_pct], ...] to frame pixel coordinates."""
        pixel_pts = []
        for x_pct, y_pct in polygon_pct:
            px = int((x_pct / 100.0) * width)
            py = int((y_pct / 100.0) * height)
            pixel_pts.append([px, py])
        return np.array(pixel_pts, np.int32)

    def is_bbox_inside_zone(self, bbox: List[int], polygon_pct: List[List[float]], width: int, height: int) -> bool:
        """
        Checks if the center or bottom-center (feet) of a bounding box [x1, y1, x2, y2]
        intersects a polygon zone.
        """
        x1, y1, x2, y2 = bbox
        # Feet center position (best for foot placement / intrusion)
        center_x = (x1 + x2) / 2.0
        bottom_y = float(y2)
        
        point = Point(center_x, bottom_y)
        pixel_pts = self.get_pixel_polygon(polygon_pct, width, height)
        poly = Polygon(pixel_pts)
        
        return poly.contains(point) or poly.touches(point)

    def draw_zones_on_frame(self, frame: cv2.Mat, camera_id: str = "CAM-07") -> cv2.Mat:
        """Overlays color-coded polygon zones and labels on OpenCV frame for demo display."""
        h, w = frame.shape[:2]
        cam_cfg = self.camera_zones.get(camera_id, {})
        
        # 1. Draw Restricted Zones (Red)
        for r_zone in cam_cfg.get("restricted_zones", []):
            pts = self.get_pixel_polygon(r_zone["polygon_pct"], w, h)
            cv2.polylines(frame, [pts], isClosed=True, color=(0, 0, 220), thickness=2)
            cv2.putText(frame, f"RESTRICTED: {r_zone['name']}", (pts[0][0], max(30, pts[0][1] - 10)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)

        # 2. Draw Crowd Zones (Yellow/Blue)
        for c_zone in cam_cfg.get("crowd_zones", []):
            pts = self.get_pixel_polygon(c_zone["polygon_pct"], w, h)
            cv2.polylines(frame, [pts], isClosed=True, color=(220, 180, 0), thickness=2)
            cv2.putText(frame, f"CROWD ZONE: {c_zone['name']}", (pts[0][0], max(30, pts[0][1] - 10)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 200, 0), 2)

        # 3. Draw Work Zones (Green)
        for w_zone in cam_cfg.get("work_zones", []):
            pts = self.get_pixel_polygon(w_zone["polygon_pct"], w, h)
            cv2.polylines(frame, [pts], isClosed=True, color=(0, 200, 100), thickness=2)
            cv2.putText(frame, f"WORK ZONE: {w_zone['name']}", (pts[0][0], max(30, pts[0][1] - 10)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 220, 100), 2)

        return frame

zone_manager = ZoneManager()
