from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.schemas.alert import AlertCreate, AlertUpdate, AlertResponse
from app.services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("/stats/deduplication", response_model=Dict[str, Any])
def get_deduplication_stats(db: Session = Depends(get_db)):
    """Retrieve operational alert suppression & ML deduplication statistics."""
    return AlertService.get_deduplication_stats(db=db)

@router.post("/demo/trigger-scenario")
async def trigger_demo_scenario(db: Session = Depends(get_db)):
    """Trigger the live judge demo scenario end-to-end through real database & WebSocket broadcasting."""
    return await AlertService.trigger_demo_scenario(db=db)

@router.get("", response_model=List[AlertResponse])
def get_alerts(
    status_filter: Optional[str] = Query(None, alias="status", description="ACTIVE, ACKNOWLEDGED, INVESTIGATING, RESOLVED, DISMISSED"),
    severity: Optional[str] = Query(None, description="CRITICAL, HIGH, MEDIUM, LOW, INFO"),
    camera_id: Optional[str] = Query(None, description="Filter by camera ID"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Retrieve security and safety alerts with optional filtering."""
    return AlertService.get_alerts(
        db=db,
        status=status_filter,
        severity=severity,
        camera_id=camera_id,
        skip=skip,
        limit=limit
    )

@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(alert_id: str, db: Session = Depends(get_db)):
    """Retrieve details for a single alert."""
    alert = AlertService.get_alert_by_id(db=db, alert_id=alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID '{alert_id}' not found"
        )
    return alert

@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(alert_in: AlertCreate, db: Session = Depends(get_db)):
    """Create a new safety/security alert."""
    return await AlertService.create_alert(db=db, alert_in=alert_in)

@router.patch("/{alert_id}", response_model=AlertResponse)
async def update_alert(alert_id: str, alert_update: AlertUpdate, db: Session = Depends(get_db)):
    """Update alert status (e.g. ACKNOWLEDGED, INVESTIGATING, RESOLVED, DISMISSED) or severity."""
    updated = await AlertService.update_alert(db=db, alert_id=alert_id, alert_update=alert_update)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID '{alert_id}' not found"
        )
    return updated

@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
async def acknowledge_alert(alert_id: str, db: Session = Depends(get_db)):
    """Mark an active alert as ACKNOWLEDGED by duty operator."""
    updated = await AlertService.acknowledge_alert(db=db, alert_id=alert_id)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID '{alert_id}' not found"
        )
    return updated

@router.post("/{alert_id}/investigate", response_model=AlertResponse)
async def investigate_alert(alert_id: str, db: Session = Depends(get_db)):
    """Mark an alert as INVESTIGATING."""
    updated = await AlertService.investigate_alert(db=db, alert_id=alert_id)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID '{alert_id}' not found"
        )
    return updated

@router.post("/{alert_id}/resolve", response_model=AlertResponse)
async def resolve_alert(alert_id: str, db: Session = Depends(get_db)):
    """Mark an alert as RESOLVED."""
    updated = await AlertService.resolve_alert(db=db, alert_id=alert_id)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID '{alert_id}' not found"
        )
    return updated

@router.post("/{alert_id}/dismiss", response_model=AlertResponse)
async def dismiss_alert(alert_id: str, db: Session = Depends(get_db)):
    """Mark an alert as DISMISSED (e.g. false positive/training test)."""
    updated = await AlertService.dismiss_alert(db=db, alert_id=alert_id)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID '{alert_id}' not found"
        )
    return updated
