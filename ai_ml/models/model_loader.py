from ultralytics import YOLO
import cv2
import numpy as np
from typing import List, Dict, Any
from config import config

class YOLOModelLoader:
    """
    Singleton wrapper for loading and executing Ultralytics YOLO model inference.
    Uses pretrained `yolov8n.pt` for fast hackathon inference.
    """
    def __init__(self, model_path: str = config.MODEL_PATH):
        self.model_path = model_path
        print(f"[MODEL] Loading YOLO model: {self.model_path}...")
        self.model = YOLO(self.model_path)
        print(f"[MODEL] YOLO model loaded successfully!")

    def detect_objects(self, frame: cv2.Mat, conf_threshold: float = config.CONFIDENCE_THRESHOLD) -> List[Dict[str, Any]]:
        """
        Runs YOLO object detection on a single video frame.
        Returns a list of detected objects above the confidence threshold.
        """
        results = self.model(frame, conf=conf_threshold, verbose=False)[0]
        detections = []

        for box in results.boxes:
            cls_id = int(box.cls[0].item())
            class_name = self.model.names[cls_id]
            conf = float(box.conf[0].item())
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())

            detections.append({
                "class": class_name,
                "class_id": cls_id,
                "confidence": round(conf, 4),
                "bbox": [x1, y1, x2, y2]
            })

        return detections

    def detect_persons(self, frame: cv2.Mat, conf_threshold: float = config.CONFIDENCE_THRESHOLD) -> List[Dict[str, Any]]:
        """
        Filters object detections to return ONLY person detections (COCO Class 0 = 'person').
        """
        all_dets = self.detect_objects(frame, conf_threshold=conf_threshold)
        person_dets = [d for d in all_dets if d["class"] == "person" or d["class_id"] == 0]
        return person_dets
