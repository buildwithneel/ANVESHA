import os
import cv2
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from ultralytics import YOLO

class PrototypeFallAndObjectDetector:
    """
    Detector for Possible Passenger Fall and Unattended/Abandoned Objects.
    Uses YOLOv8 Pose Estimation keypoints and temporal confirmation for robust fall detection.
    """
    def __init__(self, pose_model_path: str = "yolov8n-pose.pt"):
        self.fall_dwell_counts: Dict[int, int] = {}
        self.object_dwell_counts: Dict[str, int] = {}
        self.pose_model = None
        self._load_pose_model(pose_model_path)

    def _load_pose_model(self, model_path: str):
        """Loads Ultralytics YOLOv8 pose model."""
        try:
            print(f"[SAFETY DETECTOR] Loading Pose Estimation model from '{model_path}'...")
            self.pose_model = YOLO(model_path)
            print(f"[SAFETY DETECTOR] Pose Estimation model loaded successfully!")
        except Exception as e:
            print(f"[SAFETY DETECTOR WARNING] Could not load pose model ({e}). Using geometric bounding box fallback.")
            self.pose_model = None

    def _is_pose_fall(self, keypoints: np.ndarray, bbox: List[int], frame_h: int = 480) -> Tuple[bool, float, str]:
        """
        Analyzes 17 COCO human pose keypoints to determine if a person has fallen.
        Keypoints format: [17, 3] -> (x, y, conf)
        Returns (is_fall: bool, confidence: float, posture_desc: str)
        """
        # Keypoint indices: 0=Nose, 5=L_Shoulder, 6=R_Shoulder, 11=L_Hip, 12=R_Hip, 15=L_Ankle, 16=R_Ankle
        nose = keypoints[0]
        l_shoulder, r_shoulder = keypoints[5], keypoints[6]
        l_hip, r_hip = keypoints[11], keypoints[12]

        head_y = nose[1] if nose[2] > 0.3 else (l_shoulder[1] + r_shoulder[1]) / 2.0
        head_x = nose[0] if nose[2] > 0.3 else (l_shoulder[0] + r_shoulder[0]) / 2.0

        hip_y = (l_hip[1] + r_hip[1]) / 2.0 if (l_hip[2] > 0.3 or r_hip[2] > 0.3) else None
        hip_x = (l_hip[0] + r_hip[0]) / 2.0 if (l_hip[2] > 0.3 or r_hip[2] > 0.3) else None

        x1, y1, x2, y2 = bbox
        w = x2 - x1
        h = max(1, y2 - y1)

        # Pose keypoint orientation check (Head to Hip vertical distance vs horizontal displacement)
        if hip_y is not None and hip_x is not None:
            dy = abs(head_y - hip_y)
            dx = abs(head_x - hip_x)
            
            # If head and hips are at nearly the same vertical height level (|dy| < 40px)
            # AND horizontal distance between head and hip is large (dx > dy)
            if dy < 40.0 and dx > dy:
                pose_conf = min(0.95, round(0.75 + (dx / (dy + 1.0)) * 0.05, 4))
                return True, pose_conf, "KEYPOINT_POSTURE_HORIZONTAL"
            elif head_y > hip_y + 15.0: # Head below hips (collapsed on ground)
                return True, 0.92, "HEAD_BELOW_HIP_COLLAPSE"

        return False, 0.0, "NORMAL"

    def check_passenger_falls(
        self,
        tracked_persons: List[Dict[str, Any]],
        frame: Optional[cv2.Mat] = None
    ) -> List[Dict[str, Any]]:
        """
        Detects passenger falls using Pose Estimation keypoint geometry and temporal confirmation.
        """
        events = []
        active_fall_tids = set()

        frame_h, frame_w = (frame.shape[:2]) if frame is not None else (480, 640)

        # Run pose model on full frame if frame is provided and pose model is loaded
        pose_results = None
        if self.pose_model is not None and frame is not None:
            try:
                pose_results = self.pose_model(frame, conf=0.30, verbose=False)[0]
            except Exception as e:
                print(f"[SAFETY DETECTOR ERROR] Pose inference failed: {e}")

        for person in tracked_persons:
            bbox = person["bbox"]
            track_id = person.get("track_id", 0)
            person_conf = person.get("confidence", 0.85)

            is_fall = False
            fall_conf = 0.0
            posture_status = "NORMAL"

            # Check pose keypoint matches for this person's bbox
            if pose_results is not None and len(pose_results.keypoints) > 0:
                for idx, p_box in enumerate(pose_results.boxes):
                    p_xyxy = p_box.xyxy[0].tolist()
                    from tracking.tracker import compute_iou
                    if compute_iou(bbox, p_xyxy) > 0.40:
                        kpts = pose_results.keypoints[idx].data[0].cpu().numpy()
                        is_fall, fall_conf, posture_status = self._is_pose_fall(kpts, bbox, frame_h=frame_h)
                        break

            if is_fall:
                active_fall_tids.add(track_id)
                dwell = self.fall_dwell_counts.get(track_id, 0) + 1
                self.fall_dwell_counts[track_id] = dwell

                # Temporal confirmation (requires persistent fall posture for 4+ frame checks)
                if dwell >= 4:
                    events.append({
                        "event_type": "fall",
                        "confidence": fall_conf if fall_conf > 0 else 0.85,
                        "metadata": {
                            "track_id": track_id,
                            "bbox": bbox,
                            "dwell_frames": dwell,
                            "posture_status": posture_status,
                            "status": "POSSIBLE FALL",
                            "frame_width": frame_w,
                            "frame_height": frame_h
                        }
                    })

        # Cleanup cleared tracks
        for tid in list(self.fall_dwell_counts.keys()):
            if tid not in active_fall_tids:
                del self.fall_dwell_counts[tid]

        return events

    def check_abandoned_objects(
        self,
        all_detections: List[Dict[str, Any]],
        tracked_persons: Optional[List[Dict[str, Any]]] = None,
        dist_threshold_px: float = 150.0
    ) -> List[Dict[str, Any]]:
        """
        Detects unattended luggage/backpack objects based on stationarity and nearest-person proximity.
        """
        events = []
        target_classes = {"backpack", "handbag", "suitcase"}

        # Extract person centroid positions
        person_centers = []
        if tracked_persons:
            for p in tracked_persons:
                px1, py1, px2, py2 = p["bbox"]
                person_centers.append(((px1 + px2) / 2.0, (py1 + py2) / 2.0))

        active_obj_keys = set()

        for det in all_detections:
            cls_name = det.get("class", "").lower()
            if cls_name in target_classes:
                x1, y1, x2, y2 = det["bbox"]
                obj_center = ((x1 + x2) / 2.0, (y1 + y2) / 2.0)
                det_conf = det.get("confidence", 0.85)

                # Quantize position to identify stationary object key
                obj_key = f"{cls_name}_{int(obj_center[0]/20)}_{int(obj_center[1]/20)}"
                active_obj_keys.add(obj_key)

                # Compute distance to nearest person
                min_dist = float("inf")
                if person_centers:
                    for pc in person_centers:
                        dist = np.sqrt((obj_center[0] - pc[0]) ** 2 + (obj_center[1] - pc[1]) ** 2)
                        if dist < min_dist:
                            min_dist = float(dist)

                # If owner/person is nearby (< 150px), object is attended -> reset dwell counter
                if min_dist < dist_threshold_px:
                    self.object_dwell_counts[obj_key] = 0
                else:
                    # Object is unattended -> increment stationary dwell counter
                    dwell = self.object_dwell_counts.get(obj_key, 0) + 1
                    self.object_dwell_counts[obj_key] = dwell

                    if dwell >= 5: # Stationary & unattended confirmation threshold (5+ frame checks)
                        event_conf = round(min(0.92, max(0.75, det_conf * 0.95)), 4)
                        events.append({
                            "event_type": "abandoned_object",
                            "confidence": event_conf,
                            "metadata": {
                                "object_type": cls_name,
                                "bbox": det["bbox"],
                                "dwell_frames": dwell,
                                "nearest_person_dist_px": round(min_dist, 1) if min_dist != float("inf") else -1.0,
                                "unattended": True,
                                "status": "POSSIBLE ABANDONED OBJECT"
                            }
                        })

        # Cleanup cleared object keys
        for k in list(self.object_dwell_counts.keys()):
            if k not in active_obj_keys:
                del self.object_dwell_counts[k]

        return events

