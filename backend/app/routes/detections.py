from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.schemas.detection import DetectionIngestRequest, DetectionResponse
from app.services.detection_service import DetectionService

router = APIRouter(prefix="/detections", tags=["Detections (ML Ingestion)"])

@router.get("", response_model=List[DetectionResponse])
def get_detections(
    camera_id: Optional[str] = Query(None, description="Filter by camera ID"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Retrieve historical AI/ML detections."""
    detections = DetectionService.get_detections(
        db=db,
        camera_id=camera_id,
        event_type=event_type,
        skip=skip,
        limit=limit
    )
    results = []
    for d in detections:
        results.append(
            DetectionResponse(
                id=d.id,
                camera_id=d.camera_id,
                type=d.type,
                confidence=d.confidence,
                timestamp=d.timestamp,
                severity=d.severity,
                risk_score=d.risk_score,
                metadata=d.metadata_dict,
                alert_triggered=len(d.alerts) > 0,
                alert_id=d.alerts[0].id if d.alerts else None
            )
        )
    return results

@router.post("", response_model=DetectionResponse, status_code=status.HTTP_201_CREATED)
async def ingest_detection(detection_in: DetectionIngestRequest, db: Session = Depends(get_db)):
    """
    Ingest a real-time detection event from ML pipelines / video analytics models.
    Validates payload, persists detection in database, and automatically triggers alerts when thresholds are met.
    """
    detection, alert = await DetectionService.ingest_detection(db=db, detection_in=detection_in)
    return DetectionResponse(
        id=detection.id,
        camera_id=detection.camera_id,
        type=detection.type,
        confidence=detection.confidence,
        timestamp=detection.timestamp,
        severity=detection.severity,
        risk_score=detection.risk_score,
        metadata=detection.metadata_dict,
        alert_triggered=alert is not None,
        alert_id=alert.id if alert else None
    )
