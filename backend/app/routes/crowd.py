from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.crowd_service import CrowdService, ZONES_CONFIG

router = APIRouter(prefix="/crowd", tags=["Crowd Intelligence"])

@router.get("")
def get_station_crowd(db: Session = Depends(get_db)):
    """
    Retrieve comprehensive real-time station crowd intelligence:
    - Total estimated passenger count
    - Average station density percentage and risk classification (NORMAL/MODERATE/HIGH)
    - All 11 station zones breakdown with assigned cameras and risk level
    - Platform 1–4 specific risk indicators
    - 60-minute historical time-series curve
    - ML Projected Crowd Level (+10 min, +20 min)
    """
    return CrowdService.get_station_crowd_summary(db)

@router.get("/zones")
def get_all_zones(db: Session = Depends(get_db)):
    """Retrieve detailed metrics for all 11 station zones."""
    return CrowdService.get_all_zones(db)

@router.get("/{zone_id}")
def get_zone_crowd(zone_id: str, db: Session = Depends(get_db)):
    """Retrieve crowd metrics, camera associations, and trend data for a specific zone."""
    zone_upper = zone_id.upper()
    # Support lookup by ID or alias
    alias_map = {
        "PLATFORM 1": "PF-1", "PLATFORM 2": "PF-2", "PLATFORM 3": "PF-3", "PLATFORM 4": "PF-4",
        "PF1": "PF-1", "PF2": "PF-2", "PF3": "PF-3", "PF4": "PF-4",
        "MAIN CONCOURSE": "CONCOURSE", "MAIN_CONCOURSE": "CONCOURSE",
        "WAITING AREA": "WAITING", "WAITING_AREA": "WAITING",
        "TRACK AREA": "TRACK", "TRACK_AREA": "TRACK",
    }
    target_id = alias_map.get(zone_upper, zone_upper)

    data = CrowdService.get_zone_data(db, target_id)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Zone '{zone_id}' not found. Available zones: {list(ZONES_CONFIG.keys())}"
        )
    return data

@router.post("")
async def ingest_crowd_measurement(
    payload: dict = Body(..., openapi_examples={"default": {"value": {"zone_id": "PF-3", "density": 86, "people_count": 430}}}),
    db: Session = Depends(get_db)
):
    """
    Ingest a real-time crowd measurement (from ML Service or camera pipeline).
    Updates zone occupancy, verifies alert thresholds (>=80%), applies deduplication cooldown,
    and broadcasts updates via WebSocket.
    """
    zone_id = payload.get("zone_id", "PF-3").upper()
    density = int(payload.get("density", 50))
    people = payload.get("people_count")
    if people is not None:
        people = int(people)

    try:
        zone_data, alert = await CrowdService.update_zone_crowd(
            db=db,
            zone_id=zone_id,
            density=density,
            people_count=people,
            trigger_alert=True
        )
        return {
            "status": "success",
            "zone": zone_data,
            "alert_created": alert.id if alert else None
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/demo-scenario")
async def trigger_crowd_demo_scenario(
    step: int = Query(4, ge=1, le=4, description="Demo scenario step: 1=76%, 2=81%, 3=86%, 4=91%"),
    db: Session = Depends(get_db)
):
    """
    Triggers the real backend Platform 3 Crowd Surge Demo Scenario:
    - Step 1: 76% (Moderate)
    - Step 2: 81% (High)
    - Step 3: 86% (High)
    - Step 4: 91% (High -> Creates 'CROWD THRESHOLD EXCEEDED' Alert + Broadcasts over WebSocket)
    """
    result = await CrowdService.run_demo_scenario(db, step=step)
    return result
