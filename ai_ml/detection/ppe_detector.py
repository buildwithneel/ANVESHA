import os
import cv2
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from ultralytics import YOLO
from zones.zone_manager import zone_manager

class PPESafetyDetector:
    """
    Worker Safety & PPE Non-Compliance Detector.
    Uses actual Computer Vision inference with a pretrained YOLO PPE model
    and HSV safety vest color/reflectivity analysis to determine PPE compliance.
    
    Includes per-track inference caching/throttling, temporal violation confirmation,
    and safe fallback handling to prevent technical errors from generating false alerts.
    """
    def __init__(
        self,
        model_path: str = "weights/ppe_yolov8n.pt",
        check_interval: int = 5,
        confirmation_evaluations: int = 3
    ):
        self.model_path = model_path
        self.model = None
        self.check_interval = check_interval
        self.confirmation_evaluations = confirmation_evaluations
        self.track_ppe_cache: Dict[int, Dict[str, Any]] = {}
        self.frame_counter: int = 0
        self._load_ppe_model()

    def _load_ppe_model(self):
        """Loads or downloads the pretrained YOLO PPE model."""
        try:
            if not os.path.exists(self.model_path):
                print(f"[PPE DETECTOR] PPE model not found at '{self.model_path}'. Downloading pretrained weights...")
                url = "https://huggingface.co/keremberke/yolov8n-protective-equipment-detection/resolve/main/best.pt"
                self.model = YOLO(url)
                os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
                self.model.save(self.model_path)
            else:
                print(f"[PPE DETECTOR] Loading PPE model from '{self.model_path}'...")
                self.model = YOLO(self.model_path)
            print(f"[PPE DETECTOR] PPE model loaded successfully!")
        except Exception as e:
            print(f"[PPE DETECTOR WARNING] Could not load dedicated PPE model ({e}). PPE evaluation will set status UNKNOWN without generating false violation alerts.")
            self.model = None

    def _analyze_vest_presence(self, torso_crop: cv2.Mat) -> Tuple[bool, float]:
        """
        Analyzes torso crop for high-visibility safety vest (fluorescent yellow/orange/green).
        Returns (has_vest: bool, vest_confidence: float).
        """
        if torso_crop is None or torso_crop.size == 0:
            return False, 0.0

        hsv = cv2.cvtColor(torso_crop, cv2.COLOR_BGR2HSV)
        
        # Fluorescent Yellow / Lime Green (Hue 20 - 45, Saturation 70 - 255, Value 100 - 255)
        yellow_mask = cv2.inRange(hsv, np.array([20, 70, 100]), np.array([45, 255, 255]))
        # Safety Orange (Hue 5 - 18, Saturation 100 - 255, Value 120 - 255)
        orange_mask = cv2.inRange(hsv, np.array([5, 100, 120]), np.array([18, 255, 255]))

        vest_mask = cv2.bitwise_or(yellow_mask, orange_mask)
        vest_pixel_ratio = float(np.count_nonzero(vest_mask)) / float(torso_crop.shape[0] * torso_crop.shape[1])

        # High-visibility vest threshold: at least 12% of torso area matches safety colors
        has_vest = vest_pixel_ratio >= 0.12
        confidence = min(0.95, round(0.50 + vest_pixel_ratio * 2.0, 4)) if has_vest else round(1.0 - vest_pixel_ratio, 4)
        return has_vest, confidence

    def check_ppe_violations(
        self,
        tracked_persons: List[Dict[str, Any]],
        all_detections: List[Dict[str, Any]],
        frame_width: int,
        frame_height: int,
        camera_id: str = "CAM-07",
        frame: Optional[cv2.Mat] = None
    ) -> List[Dict[str, Any]]:
        """
        Evaluates workers inside designated worksite zones for PPE compliance (helmet & safety vest).
        Employs per-track inference throttling, temporal confirmation, and safe fallback handling.
        Returns generated `ppe_violation` events.
        """
        cam_cfg = zone_manager.camera_zones.get(camera_id, {})
        work_zones = cam_cfg.get("work_zones", [])

        if not work_zones:
            return []

        self.frame_counter += 1
        
        # 1. Clean up cached entries for tracks no longer active
        active_tids = {person.get("track_id", 0) for person in tracked_persons if person.get("track_id", 0) > 0}
        for tid in list(self.track_ppe_cache.keys()):
            if tid not in active_tids:
                del self.track_ppe_cache[tid]

        events = []

        for person in tracked_persons:
            bbox = person["bbox"]
            track_id = person.get("track_id", 0)
            person_conf = person.get("confidence", 0.85)
            x1, y1, x2, y2 = bbox

            # Clip coordinates to frame dimensions
            x1_c, y1_c = max(0, x1), max(0, y1)
            x2_c, y2_c = min(frame_width, x2), min(frame_height, y2)

            for w_zone in work_zones:
                is_in_work_zone = zone_manager.is_bbox_inside_zone(
                    bbox=bbox,
                    polygon_pct=w_zone["polygon_pct"],
                    width=frame_width,
                    height=frame_height
                )

                if not is_in_work_zone:
                    continue

                cached = self.track_ppe_cache.get(track_id)
                needs_evaluation = (
                    cached is None or 
                    (self.frame_counter - cached.get("last_checked_frame", 0)) >= self.check_interval
                )

                if needs_evaluation:
                    eval_valid = False
                    helmet_detected = False
                    no_helmet_detected = False
                    helmet_conf = 0.0
                    no_helmet_conf = 0.0
                    has_vest = True
                    vest_conf = 0.85

                    # 1. Computer Vision Detection using Pretrained PPE Model (Safe Evaluation)
                    if self.model is not None and frame is not None and (x2_c - x1_c > 10) and (y2_c - y1_c > 10):
                        person_crop = frame[y1_c:y2_c, x1_c:x2_c]
                        try:
                            ppe_results = self.model(person_crop, conf=0.25, verbose=False)[0]
                            eval_valid = True
                            for p_box in ppe_results.boxes:
                                cls_id = int(p_box.cls[0].item())
                                cls_name = self.model.names.get(cls_id, "").lower()
                                c_val = float(p_box.conf[0].item())

                                if cls_name == "helmet":
                                    helmet_detected = True
                                    helmet_conf = max(helmet_conf, c_val)
                                elif cls_name == "no_helmet":
                                    no_helmet_detected = True
                                    no_helmet_conf = max(no_helmet_conf, c_val)
                        except Exception as e:
                            print(f"[PPE DETECTOR ERROR] Crop inference failed: {e}")
                            eval_valid = False
                    else:
                        eval_valid = False

                    # 2. Torso Safety Vest Analysis
                    if frame is not None and (y2_c - y1_c > 30):
                        torso_y1 = y1_c + int((y2_c - y1_c) * 0.20)
                        torso_y2 = y1_c + int((y2_c - y1_c) * 0.65)
                        torso_crop = frame[torso_y1:torso_y2, x1_c:x2_c]
                        has_vest, vest_conf = self._analyze_vest_presence(torso_crop)

                    # 3. Determine Evaluation Outcome
                    eval_violation = None
                    eval_event_conf = 0.0

                    if eval_valid:
                        if no_helmet_detected:
                            eval_violation = "NO_HELMET"
                            eval_event_conf = round(no_helmet_conf, 4)
                        elif not helmet_detected:
                            eval_violation = "NO_HELMET"
                            eval_event_conf = round(max(0.70, person_conf * 0.90), 4)
                        elif not has_vest:
                            eval_violation = "NO_VEST"
                            eval_event_conf = round(max(0.75, vest_conf), 4)

                    # Update Track Cache & Temporal Confirmation Counter
                    if cached is None:
                        cached = {
                            "last_checked_frame": self.frame_counter,
                            "consecutive_violations": 0,
                            "violation_type": None,
                            "confidence": 0.0,
                            "helmet_detected": False,
                            "has_vest": True,
                            "status": "UNKNOWN",
                            "eval_valid": eval_valid
                        }
                        self.track_ppe_cache[track_id] = cached

                    if eval_valid:
                        cached["last_checked_frame"] = self.frame_counter
                        cached["eval_valid"] = True
                        cached["helmet_detected"] = helmet_detected
                        cached["has_vest"] = has_vest

                        if eval_violation is not None:
                            if cached.get("violation_type") == eval_violation:
                                cached["consecutive_violations"] += 1
                            else:
                                cached["violation_type"] = eval_violation
                                cached["consecutive_violations"] = 1

                            cached["confidence"] = eval_event_conf

                            if cached["consecutive_violations"] >= self.confirmation_evaluations:
                                cached["status"] = "VIOLATION_CONFIRMED"
                            else:
                                cached["status"] = "VIOLATION_CANDIDATE"
                        else:
                            # Compliant evaluation -> Reset violation candidate counter
                            cached["consecutive_violations"] = 0
                            cached["violation_type"] = None
                            cached["confidence"] = 0.0
                            cached["status"] = "COMPLIANT"
                    else:
                        # Technical evaluation failure / model unavailable -> UNKNOWN status (NO false violation!)
                        cached["status"] = "UNKNOWN"
                        cached["eval_valid"] = False

                # 4. Generate Event ONLY if violation is temporally confirmed and evaluation is valid
                if cached and cached.get("status") == "VIOLATION_CONFIRMED" and cached.get("eval_valid", False):
                    violation_type = cached.get("violation_type")
                    if violation_type is not None:
                        events.append({
                            "event_type": "ppe_violation",
                            "confidence": cached.get("confidence", 0.85),
                            "metadata": {
                                "track_id": track_id,
                                "zone": w_zone.get("name", "Worksite Area"),
                                "violation": violation_type,
                                "helmet_detected": cached.get("helmet_detected", False),
                                "vest_detected": cached.get("has_vest", True),
                                "bbox": bbox
                            }
                        })
                        # Break work zone loop once event is appended for this worker
                        break

        return events


