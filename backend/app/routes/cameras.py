import uuid
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

from app.database.connection import get_db
from app.database.models import Camera, Detection, Alert
from app.schemas.camera import (
    CameraCreate,
    CameraUpdate,
    CameraResponse,
    CameraEventItem,
    CameraSnapshotRequest,
    CameraSnapshotResponse,
    CameraHealthSummary,
    DetectionSummary
)
from app.websocket.manager import ws_manager

router = APIRouter(prefix="/cameras", tags=["Cameras"])

def build_camera_response(cam: Camera, db: Session) -> CameraResponse:
    """Helper to assemble a CameraResponse with calculated active alerts and latest detection."""
    # Count active alerts for this camera
    active_alerts_cnt = db.query(Alert).filter(
        Alert.camera_id == cam.id,
        Alert.status.in_(["ACTIVE", "INVESTIGATING", "OPEN"])
    ).count()

    # Get latest detection for this camera
    latest_det = db.query(Detection).filter(
        Detection.camera_id == cam.id
    ).order_by(Detection.timestamp.desc()).first()

    det_summary = None
    if latest_det:
        det_summary = DetectionSummary(
            id=latest_det.id,
            type=latest_det.type,
            confidence=latest_det.confidence,
            severity=latest_det.severity,
            risk_score=latest_det.risk_score,
            timestamp=latest_det.timestamp,
            metadata=latest_det.metadata_dict
        )

    return CameraResponse(
        id=cam.id,
        camera_code=cam.camera_code,
        name=cam.name or cam.location,
        station_id=cam.station_id,
        location=cam.location,
        category=cam.category,
        zone=cam.zone or cam.category,
        status=cam.status.upper() if cam.status else "LIVE",
        stream_url=cam.stream_url or "",
        ai_enabled=cam.ai_enabled if cam.ai_enabled is not None else True,
        ai_status=cam.ai_status or ("ALERT" if active_alerts_cnt > 0 else "ACTIVE"),
        last_heartbeat=cam.last_heartbeat or datetime.utcnow(),
        active_alert_count=active_alerts_cnt,
        current_detection=det_summary,
        created_at=cam.created_at,
        updated_at=cam.updated_at
    )

@router.get("/health/summary", response_model=CameraHealthSummary)
def get_camera_health_summary(
    station_id: Optional[str] = Query(None, description="Filter by station ID"),
    db: Session = Depends(get_db)
):
    """Retrieve operational CCTV health summary metrics."""
    query = db.query(Camera)
    if station_id:
        query = query.filter(Camera.station_id == station_id)
    
    cameras = query.all()
    total = len(cameras)
    if total == 0:
        return CameraHealthSummary(
            total_cameras=0,
            online_count=0,
            degraded_count=0,
            offline_count=0,
            maintenance_count=0,
            active_alert_count=0,
            network_health_pct=100.0,
            ai_health_pct=100.0
        )

    online_count = sum(1 for c in cameras if c.status.upper() in ["LIVE", "ONLINE"])
    degraded_count = sum(1 for c in cameras if c.status.upper() == "DEGRADED")
    offline_count = sum(1 for c in cameras if c.status.upper() == "OFFLINE")
    maintenance_count = sum(1 for c in cameras if c.status.upper() == "MAINTENANCE")

    active_alert_count = db.query(Alert).filter(
        Alert.status.in_(["ACTIVE", "INVESTIGATING", "OPEN"])
    ).count()

    # Network health percentage based on reachable cameras
    network_health_pct = round(((online_count + (degraded_count * 0.5)) / max(total, 1)) * 100.0, 1)
    
    # AI processing health percentage based on AI-enabled operational cameras
    ai_active_count = sum(1 for c in cameras if c.ai_enabled and c.status.upper() in ["LIVE", "ONLINE", "DEGRADED"])
    ai_health_pct = round((ai_active_count / max(total, 1)) * 100.0, 1)

    return CameraHealthSummary(
        total_cameras=total,
        online_count=online_count,
        degraded_count=degraded_count,
        offline_count=offline_count,
        maintenance_count=maintenance_count,
        active_alert_count=active_alert_count,
        network_health_pct=network_health_pct,
        ai_health_pct=ai_health_pct
    )

@router.get("", response_model=List[CameraResponse])
def get_cameras(
    search: Optional[str] = Query(None, description="Case-insensitive search by camera code, name, location, zone"),
    zone: Optional[str] = Query(None, description="Filter by zone (Platform 1, Platform 2, Platform 3, Platform 4, Concourse, FOB, Track Area, Maintenance Area)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (LIVE, ONLINE, DEGRADED, OFFLINE, MAINTENANCE)"),
    ai_activity: Optional[str] = Query(None, description="Filter by AI activity (Normal, Detection, Alert)"),
    station_id: Optional[str] = Query(None, description="Filter by station ID"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Retrieve list of railway CCTV cameras with rich filtering."""
    query = db.query(Camera)

    if station_id:
        query = query.filter(Camera.station_id == station_id)

    if search:
        search_term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Camera.id).like(search_term),
                func.lower(Camera.camera_code).like(search_term),
                func.lower(Camera.name).like(search_term),
                func.lower(Camera.location).like(search_term),
                func.lower(Camera.zone).like(search_term),
                func.lower(Camera.category).like(search_term),
            )
        )

    if zone and zone.lower() != "all":
        z_lower = zone.strip().lower()
        query = query.filter(
            or_(
                func.lower(Camera.zone) == z_lower,
                func.lower(Camera.category) == z_lower,
                func.lower(Camera.location).like(f"%{z_lower}%")
            )
        )

    if status_filter and status_filter.lower() != "all":
        s_norm = status_filter.strip().upper()
        if s_norm in ["ONLINE", "LIVE"]:
            query = query.filter(Camera.status.in_(["ONLINE", "LIVE"]))
        else:
            query = query.filter(Camera.status == s_norm)

    cameras = query.offset(skip).limit(limit).all()
    results = [build_camera_response(c, db) for c in cameras]

    # Filter by AI activity if requested
    if ai_activity and ai_activity.lower() != "all":
        act = ai_activity.strip().lower()
        if act == "alert":
            results = [r for r in results if r.active_alert_count > 0 or r.ai_status == "ALERT"]
        elif act == "detection":
            results = [r for r in results if r.current_detection is not None and r.active_alert_count == 0]
        elif act == "normal":
            results = [r for r in results if r.active_alert_count == 0]

    return results

@router.get("/{camera_id}", response_model=CameraResponse)
def get_camera(camera_id: str, db: Session = Depends(get_db)):
    """Retrieve details of a specific camera by ID or code."""
    camera = db.query(Camera).filter(
        or_(Camera.id == camera_id, Camera.camera_code == camera_id)
    ).first()
    if not camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Camera with ID '{camera_id}' not found"
        )
    return build_camera_response(camera, db)

@router.get("/{camera_id}/events", response_model=List[CameraEventItem])
def get_camera_events(
    camera_id: str,
    time_range: Optional[str] = Query("today", description="Time filter: 15m, 1h, 6h, today, all"),
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Retrieve recent AI detection events for a specific camera."""
    camera = db.query(Camera).filter(
        or_(Camera.id == camera_id, Camera.camera_code == camera_id)
    ).first()
    if not camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Camera with ID '{camera_id}' not found"
        )

    now = datetime.utcnow()
    query = db.query(Detection).filter(Detection.camera_id == camera.id)

    if time_range == "15m":
        query = query.filter(Detection.timestamp >= now - timedelta(minutes=15))
    elif time_range == "1h":
        query = query.filter(Detection.timestamp >= now - timedelta(hours=1))
    elif time_range == "6h":
        query = query.filter(Detection.timestamp >= now - timedelta(hours=6))
    elif time_range == "today":
        today_start = datetime(now.year, now.month, now.day)
        query = query.filter(Detection.timestamp >= today_start)

    detections = query.order_by(Detection.timestamp.desc()).limit(limit).all()

    return [
        CameraEventItem(
            id=d.id,
            camera_id=d.camera_id,
            event_type=d.type,
            confidence=d.confidence,
            severity=d.severity,
            risk_score=d.risk_score,
            timestamp=d.timestamp,
            location=camera.location,
            metadata=d.metadata_dict
        )
        for d in detections
    ]

@router.post("/{camera_id}/snapshot", response_model=CameraSnapshotResponse)
def take_camera_snapshot(
    camera_id: str,
    payload: Optional[CameraSnapshotRequest] = None,
    db: Session = Depends(get_db)
):
    """Capture a snapshot from the CCTV camera with metadata retention."""
    camera = db.query(Camera).filter(
        or_(Camera.id == camera_id, Camera.camera_code == camera_id)
    ).first()
    if not camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Camera with ID '{camera_id}' not found"
        )

    snapshot_id = f"SNAP-{camera.id}-{int(datetime.utcnow().timestamp())}"
    timestamp = datetime.utcnow()

    return CameraSnapshotResponse(
        id=snapshot_id,
        camera_id=camera.id,
        camera_code=camera.camera_code,
        location=camera.location,
        timestamp=timestamp,
        file_path=f"/snapshots/{snapshot_id}.jpg",
        message=f"Snapshot from {camera.camera_code} ({camera.location}) archived successfully"
    )

@router.post("", response_model=CameraResponse, status_code=status.HTTP_201_CREATED)
def create_camera(camera_in: CameraCreate, db: Session = Depends(get_db)):
    """Register a new CCTV camera stream."""
    camera_id = camera_in.id or camera_in.camera_code
    existing = db.query(Camera).filter(
        or_(Camera.id == camera_id, Camera.camera_code == camera_in.camera_code)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Camera with ID or code '{camera_id}' already exists"
        )

    db_camera = Camera(
        id=camera_id,
        camera_code=camera_in.camera_code,
        name=camera_in.name or camera_in.location,
        station_id=camera_in.station_id,
        location=camera_in.location,
        category=camera_in.category,
        zone=camera_in.zone or camera_in.category,
        status=camera_in.status.upper(),
        stream_url=camera_in.stream_url,
        ai_enabled=camera_in.ai_enabled,
        ai_status=camera_in.ai_status,
        last_heartbeat=camera_in.last_heartbeat or datetime.utcnow(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(db_camera)
    db.commit()
    db.refresh(db_camera)
    return build_camera_response(db_camera, db)

@router.patch("/{camera_id}", response_model=CameraResponse)
async def update_camera(camera_id: str, camera_update: CameraUpdate, db: Session = Depends(get_db)):
    """Update camera configuration or operational status."""
    db_camera = db.query(Camera).filter(
        or_(Camera.id == camera_id, Camera.camera_code == camera_id)
    ).first()
    if not db_camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Camera with ID '{camera_id}' not found"
        )

    update_data = camera_update.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"]:
        update_data["status"] = update_data["status"].upper()

    for field, val in update_data.items():
        setattr(db_camera, field, val)

    db_camera.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_camera)

    # Broadcast WebSocket update
    await ws_manager.broadcast_camera_status_changed({
        "camera_id": db_camera.id,
        "camera_code": db_camera.camera_code,
        "status": db_camera.status,
        "ai_enabled": db_camera.ai_enabled,
        "ai_status": db_camera.ai_status,
        "zone": db_camera.zone,
        "location": db_camera.location,
        "last_heartbeat": db_camera.last_heartbeat.isoformat() if db_camera.last_heartbeat else None
    })

    return build_camera_response(db_camera, db)
