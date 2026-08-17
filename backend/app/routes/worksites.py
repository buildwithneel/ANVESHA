from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Worksite, WorksiteEvent, Alert
from app.schemas.worksite import (
    WorksiteCreate,
    WorksiteUpdate,
    WorksiteResponse,
    WorksiteEventCreate,
    WorksiteEventResponse,
    WorksiteSummaryResponse,
    RiskFactorItem
)
from app.services.worksite_service import WorksiteService

router = APIRouter(prefix="/worksites", tags=["Worker Safety & Worksites"])

def format_worksite_response(ws: Worksite, db: Session) -> dict:
    cameras = ws.cameras_list
    risk_factors = [RiskFactorItem(**rf) if isinstance(rf, dict) else rf for rf in ws.risk_factors]
    
    # Active alerts in this worksite's cameras
    active_alerts = db.query(Alert).filter(
        Alert.camera_id.in_(cameras),
        Alert.status.in_(["ACTIVE", "INVESTIGATING"])
    ).count() if cameras else 0

    recent_events = [
        WorksiteEventResponse(
            id=ev.id,
            worksite_id=ev.worksite_id,
            event_type=ev.event_type,
            severity=ev.severity,
            description=ev.description,
            camera_id=ev.camera_id,
            confidence=ev.confidence,
            timestamp=ev.timestamp
        )
        for ev in (ws.events[:10] if ws.events else [])
    ]

    return {
        "id": ws.id,
        "name": ws.name,
        "zone": ws.zone,
        "type": ws.type,
        "status": ws.status,
        "worker_count": ws.worker_count,
        "ppe_compliance": ws.ppe_compliance,
        "helmet_compliance": ws.helmet_compliance,
        "vest_compliance": ws.vest_compliance,
        "risk_level": ws.risk_level,
        "risk_score": ws.risk_score,
        "camera_count": ws.camera_count,
        "cameras": cameras,
        "risk_factors": risk_factors,
        "created_at": ws.created_at,
        "updated_at": ws.updated_at,
        "recent_events": recent_events,
        "active_alerts_count": active_alerts,
    }

@router.get("", response_model=List[WorksiteResponse])
def get_worksites(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (ACTIVE, PAUSED, COMPLETED, RESTRICTED)"),
    zone: Optional[str] = Query(None, description="Filter by zone"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level (LOW, MODERATE, HIGH, CRITICAL)"),
    db: Session = Depends(get_db)
):
    """Retrieve list of railway maintenance worksites."""
    worksites = WorksiteService.get_worksites(db, status=status_filter, zone=zone, risk_level=risk_level)
    return [format_worksite_response(ws, db) for ws in worksites]

@router.get("/summary", response_model=WorksiteSummaryResponse)
def get_worksites_summary(db: Session = Depends(get_db)):
    """
    Retrieve consolidated Worker Safety & Work Monitoring dashboard summary:
    - Active Worksites count
    - Total Workers Detected
    - Safety Alerts count
    - Critical Issues count
    - Overall, Helmet, and Vest PPE Compliance percentages
    """
    summary = WorksiteService.get_summary(db)
    formatted_ws = [format_worksite_response(ws, db) for ws in summary["worksites"]]
    return WorksiteSummaryResponse(
        active_worksites=summary["active_worksites"],
        total_workers_detected=summary["total_workers_detected"],
        safety_alerts_count=summary["safety_alerts_count"],
        critical_issues_count=summary["critical_issues_count"],
        overall_ppe_compliance=summary["overall_ppe_compliance"],
        helmet_compliance=summary["helmet_compliance"],
        vest_compliance=summary["vest_compliance"],
        worksites=formatted_ws
    )

@router.get("/{worksite_id}", response_model=WorksiteResponse)
def get_worksite(worksite_id: str, db: Session = Depends(get_db)):
    """Retrieve details, assigned cameras, risk factors, and event history for a worksite."""
    ws = WorksiteService.get_worksite_by_id(db, worksite_id)
    if not ws:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Worksite '{worksite_id}' not found"
        )
    return format_worksite_response(ws, db)

@router.post("", response_model=WorksiteResponse, status_code=status.HTTP_201_CREATED)
async def create_worksite(ws_in: WorksiteCreate, db: Session = Depends(get_db)):
    """Register a new maintenance worksite."""
    existing = db.query(Worksite).filter(Worksite.id == ws_in.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Worksite with ID '{ws_in.id}' already exists"
        )
    db_ws = await WorksiteService.create_worksite(db, ws_in)
    return format_worksite_response(db_ws, db)

@router.patch("/{worksite_id}", response_model=WorksiteResponse)
async def update_worksite(worksite_id: str, update_in: WorksiteUpdate, db: Session = Depends(get_db)):
    """Update worksite status, worker count, or PPE compliance."""
    db_ws = await WorksiteService.update_worksite(db, worksite_id, update_in)
    if not db_ws:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Worksite '{worksite_id}' not found"
        )
    return format_worksite_response(db_ws, db)

@router.get("/{worksite_id}/events", response_model=List[WorksiteEventResponse])
def get_worksite_events(worksite_id: str, limit: int = 50, db: Session = Depends(get_db)):
    """Retrieve real-time event timeline for a worksite."""
    ws = WorksiteService.get_worksite_by_id(db, worksite_id)
    if not ws:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Worksite '{worksite_id}' not found"
        )
    events = WorksiteService.get_events(db, worksite_id, limit=limit)
    return events

@router.post("/{worksite_id}/events", response_model=WorksiteEventResponse, status_code=status.HTTP_201_CREATED)
async def create_worksite_event(worksite_id: str, event_in: WorksiteEventCreate, db: Session = Depends(get_db)):
    """
    Log an operational or safety event for a worksite.
    Automatically generates high-priority operational Alert if safety violation detected.
    """
    try:
        db_event, alert = await WorksiteService.add_event(db, worksite_id, event_in)
        return db_event
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("/demo-scenario")
async def trigger_worksite_demo_scenario(db: Session = Depends(get_db)):
    """
    Executes the real Step 8 Worksite Safety Demo Scenario:
    Platform 3 Maintenance -> PPE Violation (CAM-18) -> Alert created -> Incident created -> Note added -> Resolved.
    """
    result = await WorksiteService.run_demo_scenario(db)
    return result
