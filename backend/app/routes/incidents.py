from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.schemas.incident import (
    IncidentCreate,
    IncidentUpdate,
    IncidentResponse,
    IncidentEventResponse,
    IncidentEventCreate,
    IncidentNoteCreate
)
from app.services.incident_service import IncidentService

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("", response_model=List[IncidentResponse])
def get_incidents(
    status_filter: Optional[str] = Query(None, alias="status", description="OPEN, INVESTIGATING, RESOLVED, CLOSED"),
    severity: Optional[str] = Query(None, description="CRITICAL, HIGH, MEDIUM, LOW"),
    camera_id: Optional[str] = Query(None, description="Filter by camera ID"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Retrieve operational incidents."""
    return IncidentService.get_incidents(
        db=db,
        status=status_filter,
        severity=severity,
        camera_id=camera_id,
        skip=skip,
        limit=limit
    )

@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    """Retrieve a single incident by ID with its timeline events."""
    incident = IncidentService.get_incident_by_id(db=db, incident_id=incident_id)
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_id}' not found"
        )
    return incident

@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def create_incident(incident_in: IncidentCreate, db: Session = Depends(get_db)):
    """Create a new incident ticket and initialize its timeline."""
    return await IncidentService.create_incident(db=db, incident_in=incident_in)

@router.patch("/{incident_id}", response_model=IncidentResponse)
async def update_incident(incident_id: str, incident_update: IncidentUpdate, db: Session = Depends(get_db)):
    """Update incident status (OPEN, INVESTIGATING, RESOLVED, CLOSED) or add operator notes."""
    updated = await IncidentService.update_incident(db=db, incident_id=incident_id, incident_update=incident_update)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_id}' not found"
        )
    return updated

@router.get("/{incident_id}/events", response_model=List[IncidentEventResponse])
def get_incident_events(incident_id: str, db: Session = Depends(get_db)):
    """Retrieve data-backed timeline events for an incident."""
    incident = IncidentService.get_incident_by_id(db=db, incident_id=incident_id)
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_id}' not found"
        )
    return IncidentService.get_incident_events(db=db, incident_id=incident_id)

@router.post("/{incident_id}/notes", response_model=IncidentEventResponse, status_code=status.HTTP_201_CREATED)
async def add_incident_note(incident_id: str, note_in: IncidentNoteCreate, db: Session = Depends(get_db)):
    """Add an officer investigation note and append to incident timeline."""
    try:
        return await IncidentService.add_incident_note(
            db=db,
            incident_id=incident_id,
            note_text=note_in.note,
            actor=note_in.actor or "Duty Officer"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.post("/{incident_id}/events", response_model=IncidentEventResponse, status_code=status.HTTP_201_CREATED)
async def add_incident_event(incident_id: str, event_in: IncidentEventCreate, db: Session = Depends(get_db)):
    """Manually append an event to the incident timeline."""
    incident = IncidentService.get_incident_by_id(db=db, incident_id=incident_id)
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_id}' not found"
        )
    return await IncidentService.add_incident_event(
        db=db,
        incident_id=incident_id,
        event_type=event_in.event_type,
        description=event_in.description,
        actor=event_in.actor
    )
