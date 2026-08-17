import os

class AIConfig:
    # Backend Integration
    BACKEND_BASE_URL: str = os.getenv("RAILGUARD_BACKEND_URL", "http://localhost:8000/api")
    AI_DETECTION_ENDPOINT: str = f"{BACKEND_BASE_URL}/ai/detections"
    
    # Computer Vision & Detection Settings
    MODEL_PATH: str = "yolov8n.pt"  # Nano YOLOv8 model for fast hackathon inference
    CONFIDENCE_THRESHOLD: float = 0.50  # Minimum confidence threshold (0.0 to 1.0)
    FRAME_SKIP_INTERVAL: int = 2  # Process every 2nd frame to ensure high FPS
    
    # Camera Identification
    DEFAULT_CAMERA_ID: str = "CAM-07"
    DEFAULT_LOCATION: str = "Platform 3 North Foot-Overbridge"
    
    # Event Cooldown / Deduplication (Seconds)
    EVENT_COOLDOWN_SECONDS: int = 15
    
    # Crowd Density Prototype Thresholds (Percentage)
    CROWD_LOW_MAX: float = 40.0
    CROWD_MODERATE_MAX: float = 70.0
    CROWD_HIGH_MAX: float = 85.0
    # Above 85.0% is CRITICAL
    
    # Risk Weight Factors (Centralized Risk Engine Configuration)
    RISK_WEIGHTS = {
        "person": 15,
        "crowd": 55,
        "ppe_violation": 65,
        "fall": 76,
        "abandoned_object": 78,
        "restricted_zone": 92,
        "track_intrusion": 95,
    }

config = AIConfig()
