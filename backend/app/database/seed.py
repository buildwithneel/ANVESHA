import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database.connection import engine, SessionLocal, Base
from app.database.models import (
    Station, Camera, Detection, Alert, Incident, IncidentEvent,
    CrowdMeasurement, Worksite, WorksiteEvent, User, AuditLog
)
from app.services.detection_service import DetectionService

def seed_database(reset: bool = True):
    """Initializes tables and seeds realistic demo data for Vadodara Railway Station."""
    DetectionService.clear_cooldown_cache()
    if reset:
        print("[SEED] Dropping existing database tables...")
        Base.metadata.drop_all(bind=engine)

    print("[SEED] Creating database tables...")
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Station).count() > 0 and not reset:
            print("[SEED] Database already contains station data. Skipping seed.")
            return

        print("[SEED] Seeding Vadodara Railway Station...")
        station = Station(
            id="BRC",
            name="Vadodara Railway Station",
            division="Ahmedabad Division",
            location="Vadodara, Gujarat, India",
            status="OPERATIONAL"
        )
        db.add(station)

        # 24 Cameras across Vadodara Station with exact zones and realistic statuses
        camera_specs = [
            ("CAM-01", "CAM-BRC-PF01-N", "Platform 1 North Concourse", "Platform 1 North Concourse", "Platform", "Platform 1", "LIVE", "rtsp://stream.railguard.internal/brc/cam01"),
            ("CAM-02", "CAM-BRC-PF01-C", "Platform 1 Central Escalator", "Platform 1 Central Escalator", "Platform", "Platform 1", "LIVE", "rtsp://stream.railguard.internal/brc/cam02"),
            ("CAM-03", "CAM-BRC-PF01-S", "Platform 1 South Waiting Hall", "Platform 1 South Waiting Hall", "Platform", "Platform 1", "LIVE", "rtsp://stream.railguard.internal/brc/cam03"),
            ("CAM-04", "CAM-BRC-PF02-N", "Platform 2 North Ramp", "Platform 2 North Ramp", "Platform", "Platform 2", "LIVE", "rtsp://stream.railguard.internal/brc/cam04"),
            ("CAM-05", "CAM-BRC-PF02-C", "Platform 2 Center Stalls", "Platform 2 Center Stalls", "Platform", "Platform 2", "LIVE", "rtsp://stream.railguard.internal/brc/cam05"),
            ("CAM-06", "CAM-BRC-PF02-S", "Platform 2 South End", "Platform 2 South End", "Platform", "Platform 2", "MAINTENANCE", "rtsp://stream.railguard.internal/brc/cam06"),
            ("CAM-07", "CAM-BRC-PF03-N", "Platform 3 North Foot-Overbridge", "Platform 3 North Foot-Overbridge", "Platform", "Platform 3", "LIVE", "rtsp://stream.railguard.internal/brc/cam07"),
            ("CAM-08", "CAM-BRC-PF03-C", "Platform 3 Main Boarding Zone", "Platform 3 Main Boarding Zone", "Platform", "Platform 3", "DEGRADED", "rtsp://stream.railguard.internal/brc/cam08"),
            ("CAM-09", "CAM-BRC-PF03-S", "Platform 3 South Track Junction", "Platform 3 South Track Junction", "Platform", "Platform 3", "LIVE", "rtsp://stream.railguard.internal/brc/cam09"),
            ("CAM-10", "CAM-BRC-PF04-N", "Platform 4 North Stairs", "Platform 4 North Stairs", "Platform", "Platform 4", "LIVE", "rtsp://stream.railguard.internal/brc/cam10"),
            ("CAM-11", "CAM-BRC-PF04-C", "Platform 4 Central Section", "Platform 4 Central Section", "Platform", "Platform 4", "LIVE", "rtsp://stream.railguard.internal/brc/cam11"),
            ("CAM-12", "CAM-BRC-FOB01", "Main Foot Overbridge 1 West", "Main Foot Overbridge 1 West", "FOB", "FOB", "LIVE", "rtsp://stream.railguard.internal/brc/cam12"),
            ("CAM-13", "CAM-BRC-FOB02", "Foot Overbridge 2 PF 3-4 Span", "Foot Overbridge 2 PF 3-4 Span", "FOB", "FOB", "LIVE", "rtsp://stream.railguard.internal/brc/cam13"),
            ("CAM-14", "CAM-BRC-FOB03", "Foot Overbridge 3 South Stairs", "Foot Overbridge 3 South Stairs", "FOB", "FOB", "LIVE", "rtsp://stream.railguard.internal/brc/cam14"),
            ("CAM-15", "CAM-BRC-PF05-N", "Platform 5 Express Track End", "Platform 5 Express Track End", "Platform", "Platform 4", "LIVE", "rtsp://stream.railguard.internal/brc/cam15"),
            ("CAM-16", "CAM-BRC-CNC01", "Main Station Concourse & Tickets", "Main Station Concourse & Tickets", "Concourse", "Concourse", "LIVE", "rtsp://stream.railguard.internal/brc/cam16"),
            ("CAM-17", "CAM-BRC-CNC02", "East Entrance Security Baggage", "East Entrance Security Baggage", "Concourse", "Concourse", "LIVE", "rtsp://stream.railguard.internal/brc/cam17"),
            ("CAM-18", "CAM-BRC-MNT01", "Maintenance Yard Bay 4", "Maintenance Yard Bay 4", "Maintenance", "Maintenance Area", "LIVE", "rtsp://stream.railguard.internal/brc/cam18"),
            ("CAM-19", "CAM-BRC-MNT02", "Heavy Maintenance Shed North", "Heavy Maintenance Shed North", "Maintenance", "Maintenance Area", "LIVE", "rtsp://stream.railguard.internal/brc/cam19"),
            ("CAM-20", "CAM-BRC-TRK01", "Track Section Line 1-2 Interlock", "Track Section Line 1-2 Interlock", "Track Bed", "Track Area", "LIVE", "rtsp://stream.railguard.internal/brc/cam20"),
            ("CAM-21", "CAM-BRC-TRK02", "Track Area KM 392 South Junction", "Track Area KM 392 South Junction", "Track Bed", "Track Area", "OFFLINE", "rtsp://stream.railguard.internal/brc/cam21"),
            ("CAM-22", "CAM-BRC-TRK03", "Track Area Signal Gantry West", "Track Area Signal Gantry West", "Track Bed", "Track Area", "LIVE", "rtsp://stream.railguard.internal/brc/cam22"),
            ("CAM-23", "CAM-BRC-GATE1", "West Terminal Entry Gate 1", "West Terminal Entry Gate 1", "Entrance/Exit", "Concourse", "LIVE", "rtsp://stream.railguard.internal/brc/cam23"),
            ("CAM-24", "CAM-BRC-PARK1", "Circulating Area & Parking Bay", "Circulating Area & Parking Bay", "Entrance/Exit", "Concourse", "MAINTENANCE", "rtsp://stream.railguard.internal/brc/cam24"),
        ]

        cameras = []
        for cid, code, name, loc, cat, zone, stat, stream in camera_specs:
            cam = Camera(
                id=cid,
                camera_code=code,
                name=name,
                station_id="BRC",
                location=loc,
                category=cat,
                zone=zone,
                status=stat,
                stream_url=stream,
                ai_enabled=True,
                ai_status="ALERT" if cid in ["CAM-07", "CAM-08"] else "ACTIVE",
                last_heartbeat=datetime.utcnow() if stat != "OFFLINE" else datetime.utcnow() - timedelta(hours=3, minutes=12),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(cam)
            cameras.append(cam)
        db.commit()
        print(f"[SEED] Seeded {len(cameras)} cameras.")

        # Seed realistic ML Detections
        now = datetime.utcnow()
        detections_data = [
            {
                "camera_id": "CAM-07",
                "type": "restricted_zone",
                "confidence": 0.94,
                "severity": "CRITICAL",
                "risk_score": 92,
                "timestamp": now - timedelta(minutes=4),
                "metadata_json": json.dumps({"bbox": [120, 80, 320, 420], "people_count": 1, "zone": "Track Edge"})
            },
            {
                "camera_id": "CAM-19",
                "type": "track_intrusion",
                "confidence": 0.96,
                "severity": "CRITICAL",
                "risk_score": 95,
                "timestamp": now - timedelta(minutes=7),
                "metadata_json": json.dumps({"track_id": "TRK-01", "speed_kmh": 0, "bbox": [210, 300, 350, 480]})
            },
            {
                "camera_id": "CAM-16",
                "type": "crowd_surge",
                "confidence": 0.88,
                "severity": "HIGH",
                "risk_score": 84,
                "timestamp": now - timedelta(minutes=11),
                "metadata_json": json.dumps({"people_count": 86, "density_sqm": 4.2, "flow_rate": "congested"})
            },
            {
                "camera_id": "CAM-21",
                "type": "unattended_baggage",
                "confidence": 0.91,
                "severity": "HIGH",
                "risk_score": 78,
                "timestamp": now - timedelta(minutes=18),
                "metadata_json": json.dumps({"dwell_time_seconds": 420, "bbox": [510, 620, 560, 690]})
            },
            {
                "camera_id": "CAM-02",
                "type": "fallen_person",
                "confidence": 0.89,
                "severity": "HIGH",
                "risk_score": 76,
                "timestamp": now - timedelta(minutes=24),
                "metadata_json": json.dumps({"posture": "prone", "duration_sec": 45})
            },
            {
                "camera_id": "CAM-20",
                "type": "worker_no_ppe",
                "confidence": 0.93,
                "severity": "MEDIUM",
                "risk_score": 62,
                "timestamp": now - timedelta(minutes=35),
                "metadata_json": json.dumps({"missing": ["helmet", "high_vis_jacket"], "person_id": 4})
            },
            {
                "camera_id": "CAM-08",
                "type": "overcrowding_platform_edge",
                "confidence": 0.87,
                "severity": "HIGH",
                "risk_score": 79,
                "timestamp": now - timedelta(minutes=42),
                "metadata_json": json.dumps({"people_in_yellow_strip": 14})
            },
            {
                "camera_id": "CAM-22",
                "type": "loitering_security_gate",
                "confidence": 0.82,
                "severity": "MEDIUM",
                "risk_score": 58,
                "timestamp": now - timedelta(minutes=55),
                "metadata_json": json.dumps({"dwell_minutes": 22})
            },
            {
                "camera_id": "CAM-03",
                "type": "smoke_detection",
                "confidence": 0.79,
                "severity": "MEDIUM",
                "risk_score": 65,
                "timestamp": now - timedelta(hours=1, minutes=10),
                "metadata_json": json.dumps({"opacity_percent": 35})
            },
            {
                "camera_id": "CAM-17",
                "type": "crowd_density_moderate",
                "confidence": 0.90,
                "severity": "LOW",
                "risk_score": 38,
                "timestamp": now - timedelta(hours=1, minutes=30),
                "metadata_json": json.dumps({"density_sqm": 2.1})
            }
        ]

        detections = []
        for d in detections_data:
            det = Detection(**d)
            db.add(det)
            detections.append(det)
        db.commit()
        print(f"[SEED] Seeded {len(detections)} detection records.")

        # Seed 12 Alerts (7 Active [2 Critical, 3 High, 2 Medium], 5 Acknowledged/Resolved)
        alerts_data = [
            ("ALT-001", detections[0].id, "CAM-07", "restricted_zone", "CRITICAL", "ACTIVE", "Person inside high-voltage track boundary on PF 3 North", 0.94, 92, now - timedelta(minutes=4), None, None),
            ("ALT-002", detections[1].id, "CAM-19", "track_intrusion", "CRITICAL", "ACTIVE", "Unauthorized trespasser walking between Track lines 1 and 2", 0.96, 95, now - timedelta(minutes=7), None, None),
            ("ALT-003", detections[2].id, "CAM-16", "crowd_surge", "HIGH", "ACTIVE", "Excessive pedestrian bottleneck detected on Main FOB 1", 0.88, 84, now - timedelta(minutes=11), None, None),
            ("ALT-004", detections[3].id, "CAM-21", "unattended_baggage", "HIGH", "ACTIVE", "Unattended luggage detected for > 7 minutes at Central Concourse", 0.91, 78, now - timedelta(minutes=18), None, None),
            ("ALT-005", detections[4].id, "CAM-02", "fallen_person", "HIGH", "ACTIVE", "Passenger collapse/fall detected near PF 1 Escalator", 0.89, 76, now - timedelta(minutes=24), None, None),
            ("ALT-006", detections[5].id, "CAM-20", "worker_no_ppe", "MEDIUM", "ACTIVE", "Maintenance worker without safety helmet/vest in Yard area", 0.93, 62, now - timedelta(minutes=35), None, None),
            ("ALT-007", detections[6].id, "CAM-08", "overcrowding_platform_edge", "HIGH", "ACTIVE", "Multiple passengers breaching yellow platform safety line", 0.87, 79, now - timedelta(minutes=42), None, None),
            ("ALT-008", detections[7].id, "CAM-22", "loitering_security_gate", "MEDIUM", "ACKNOWLEDGED", "Suspicious loitering at East Entrance security gate", 0.82, 58, now - timedelta(minutes=55), now - timedelta(minutes=40), None),
            ("ALT-009", detections[8].id, "CAM-03", "smoke_detection", "MEDIUM", "ACKNOWLEDGED", "Faint smoke pattern detected near waiting hall ventilator", 0.79, 65, now - timedelta(hours=1, minutes=10), now - timedelta(minutes=50), None),
            ("ALT-010", None, "CAM-04", "camera_signal_degraded", "LOW", "RESOLVED", "Camera lens glare resolved after automatic contrast adjustment", 0.98, 25, now - timedelta(hours=3), now - timedelta(hours=2, minutes=50), now - timedelta(hours=2, minutes=30)),
            ("ALT-011", None, "CAM-10", "overcrowding", "MEDIUM", "RESOLVED", "Platform 4 rush hour dispersal completed", 0.85, 45, now - timedelta(hours=4), now - timedelta(hours=3, minutes=45), now - timedelta(hours=3, minutes=10)),
            ("ALT-012", detections[9].id, "CAM-17", "crowd_density_moderate", "LOW", "RESOLVED", "FOB 2 flow stabilized to normal levels", 0.90, 38, now - timedelta(hours=5), now - timedelta(hours=4, minutes=30), now - timedelta(hours=4, minutes=15)),
        ]

        for aid, det_id, cam_id, atype, sev, stat, msg, conf, risk, c_at, ack_at, res_at in alerts_data:
            alt = Alert(
                id=aid,
                detection_id=det_id,
                camera_id=cam_id,
                type=atype,
                severity=sev,
                status=stat,
                message=msg,
                confidence=conf,
                risk_score=risk,
                created_at=c_at,
                acknowledged_at=ack_at,
                resolved_at=res_at
            )
            db.add(alt)
        db.commit()
        print(f"[SEED] Seeded {len(alerts_data)} alerts.")

        # Seed 4 Incidents
        incidents_data = [
            ("INC-001", "ALT-002", "CAM-19", "track_trespass", "CRITICAL", "OPEN", "Active trespasser on active main line between Track 1 and 2. RPF Patrol dispatched.", "RPF Unit 3 dispatched via South Gate. Signal operator alerted.", now - timedelta(minutes=6), None),
            ("INC-002", "ALT-004", "CAM-21", "unattended_baggage", "HIGH", "INVESTIGATING", "Unattended duffel bag identified near Ticket Counter 4. Perimeter cordoned.", "Bomb Detection & Disposal Squad (BDDS) notified. CCTV zoom tracking active.", now - timedelta(minutes=15), None),
            ("INC-003", "ALT-005", "CAM-02", "medical_emergency", "HIGH", "INVESTIGATING", "Elderly passenger fall at escalator landing. Station medical team on-site.", "First aid paramedic team arrived at 13:30. Stretcher requested.", now - timedelta(minutes=22), None),
            ("INC-004", "ALT-008", "CAM-22", "security_check", "MEDIUM", "RESOLVED", "Individual questioned by on-duty RPF and cleared (passenger awaiting family member).", "Verified ticket and ID. Case closed with no violation.", now - timedelta(hours=2), now - timedelta(hours=1, minutes=15)),
        ]

        for iid, aid, cid, itype, sev, stat, desc, notes, c_at, res_at in incidents_data:
            inc = Incident(
                id=iid,
                alert_id=aid,
                camera_id=cid,
                type=itype,
                severity=sev,
                status=stat,
                description=desc,
                operator_notes=notes,
                created_at=c_at,
                resolved_at=res_at
            )
            db.add(inc)
        db.commit()
        print(f"[SEED] Seeded {len(incidents_data)} incidents.")

        # Seed Incident Timeline Events
        events_data = [
            ("INC-001", "alert_linked", "AI Detection flagged unauthorized trespasser between Track lines 1 and 2", "AI Vision Engine", now - timedelta(minutes=7)),
            ("INC-001", "incident_opened", "Incident INC-001 opened with CRITICAL severity by Duty Controller", "Duty Controller Sharma", now - timedelta(minutes=6)),
            ("INC-001", "note_added", "RPF Quick Response Unit 3 dispatched via South Gate. Signal operator alerted to hold Down express.", "Insp. Sharma", now - timedelta(minutes=4)),

            ("INC-002", "alert_linked", "Unattended luggage detected for > 7 minutes at Central Concourse", "AI Vision Engine", now - timedelta(minutes=18)),
            ("INC-002", "incident_opened", "Incident INC-002 opened with HIGH severity", "Duty Officer Patel", now - timedelta(minutes=15)),
            ("INC-002", "investigation_started", "Bomb Detection & Disposal Squad (BDDS) notified. Perimeter cordon established.", "Sub-Insp. Patel", now - timedelta(minutes=12)),
            ("INC-002", "note_added", "CCTV zoom tracking active on CAM-21 and CAM-22. Owner search ongoing.", "Sub-Insp. Patel", now - timedelta(minutes=8)),

            ("INC-003", "alert_linked", "Passenger collapse/fall detected near PF 1 Escalator", "AI Vision Engine", now - timedelta(minutes=24)),
            ("INC-003", "incident_opened", "Incident INC-003 opened for passenger medical assistance", "Control Room", now - timedelta(minutes=22)),
            ("INC-003", "investigation_started", "First aid paramedic team dispatched to Platform 1 South.", "Control Room", now - timedelta(minutes=19)),
            ("INC-003", "note_added", "First aid paramedic team arrived. Passenger conscious, vitals stable.", "Paramedic Staff", now - timedelta(minutes=10)),

            ("INC-004", "alert_linked", "Suspicious loitering at East Entrance security gate", "AI Vision Engine", now - timedelta(minutes=115)),
            ("INC-004", "incident_opened", "Incident INC-004 opened for security verification", "Duty Officer", now - timedelta(minutes=110)),
            ("INC-004", "investigation_started", "On-duty RPF team approached individual for questioning.", "Head Constable Yadav", now - timedelta(minutes=95)),
            ("INC-004", "note_added", "Verified passenger ticket and ID. Individual was awaiting arriving train 12952.", "Head Constable Yadav", now - timedelta(minutes=80)),
            ("INC-004", "incident_resolved", "Case verified and closed with no security violation.", "Insp. Sharma", now - timedelta(minutes=75)),
        ]

        for inc_id, ev_type, desc, act, ev_time in events_data:
            ev = IncidentEvent(
                incident_id=inc_id,
                event_type=ev_type,
                description=desc,
                actor=act,
                created_at=ev_time
            )
            db.add(ev)
        db.commit()
        print(f"[SEED] Seeded {len(events_data)} timeline events.")

        # Seed Crowd Measurements totaling 428 people
        crowd_measurements_data = [
            ("CAM-01", "Platform 1 North", 48, "Normal", "low"),
            ("CAM-02", "Platform 1 Center", 62, "Moderate", "moderate"),
            ("CAM-03", "Platform 1 South", 35, "Normal", "low"),
            ("CAM-05", "Platform 2 Center", 54, "Moderate", "moderate"),
            ("CAM-07", "Platform 3 North", 44, "Moderate", "moderate"),
            ("CAM-08", "Platform 3 Center", 78, "High", "high"),
            ("CAM-11", "Platform 4 Center", 31, "Normal", "low"),
            ("CAM-16", "Main FOB 1 Span", 42, "High", "high"),
            ("CAM-21", "Central Concourse", 34, "Moderate", "moderate"),
        ] # Sum: 48+62+35+54+44+78+31+42+34 = 428 people!

        for cid, loc, p_count, dens, r_level in crowd_measurements_data:
            cm = CrowdMeasurement(
                camera_id=cid,
                location=loc,
                people_count=p_count,
                density=dens,
                risk_level=r_level,
                timestamp=now - timedelta(minutes=2)
            )
            db.add(cm)
        db.commit()
        print(f"[SEED] Seeded {len(crowd_measurements_data)} crowd measurement entries (Total count = 428).")

        # Seed 6 Maintenance Worksites
        worksites_data = [
            {
                "id": "WS-01",
                "name": "Platform 3 Maintenance",
                "zone": "Platform 3",
                "type": "Platform Maintenance",
                "status": "ACTIVE",
                "worker_count": 8,
                "ppe_compliance": 96,
                "helmet_compliance": 96,
                "vest_compliance": 96,
                "risk_level": "LOW",
                "risk_score": 25,
                "camera_count": 4,
                "cameras_json": json.dumps(["CAM-07", "CAM-08", "CAM-17", "CAM-18"]),
                "risk_factors_json": json.dumps([
                    {"id": "rf-1", "name": "PPE Compliance", "status": "pass", "description": "High gear compliance (96%)"},
                    {"id": "rf-2", "name": "Worker Density", "status": "pass", "description": "Optimal team spacing maintained"},
                    {"id": "rf-3", "name": "Track Intrusion Risk", "status": "pass", "description": "Stationary work area with safety barriers"},
                    {"id": "rf-4", "name": "Camera Coverage", "status": "pass", "description": "4 optical feeds covering platform 3"}
                ]),
                "created_at": now - timedelta(hours=4),
            },
            {
                "id": "WS-02",
                "name": "Track Maintenance Area",
                "zone": "Track Area",
                "type": "Track Maintenance",
                "status": "RESTRICTED",
                "worker_count": 12,
                "ppe_compliance": 88,
                "helmet_compliance": 92,
                "vest_compliance": 85,
                "risk_level": "CRITICAL",
                "risk_score": 88,
                "camera_count": 2,
                "cameras_json": json.dumps(["CAM-19", "CAM-20"]),
                "risk_factors_json": json.dumps([
                    {"id": "rf-1", "name": "PPE Compliance", "status": "warning", "description": "1 worker missing high-vis vest"},
                    {"id": "rf-2", "name": "Worker Density", "status": "pass", "description": "Crew distributed along KM 392"},
                    {"id": "rf-3", "name": "Restricted Zone Event", "status": "critical", "description": "Active signal block with approaching down express"},
                    {"id": "rf-4", "name": "Camera Coverage", "status": "pass", "description": "CAM-19 and CAM-20 tracking"}
                ]),
                "created_at": now - timedelta(hours=3),
            },
            {
                "id": "WS-03",
                "name": "FOB Central Span Retrofit",
                "zone": "FOB",
                "type": "FOB Maintenance",
                "status": "ACTIVE",
                "worker_count": 6,
                "ppe_compliance": 95,
                "helmet_compliance": 100,
                "vest_compliance": 90,
                "risk_level": "MODERATE",
                "risk_score": 55,
                "camera_count": 2,
                "cameras_json": json.dumps(["CAM-16", "CAM-17"]),
                "risk_factors_json": json.dumps([
                    {"id": "rf-1", "name": "PPE Compliance", "status": "pass", "description": "Full helmet and harness compliance"},
                    {"id": "rf-2", "name": "Worker Density", "status": "warning", "description": "Elevated footfall during train boarding"},
                    {"id": "rf-3", "name": "Elevated Height Safety", "status": "pass", "description": "Safety harness anchored to steel girders"},
                    {"id": "rf-4", "name": "Camera Coverage", "status": "pass", "description": "CAM-16 and CAM-17 active"}
                ]),
                "created_at": now - timedelta(hours=2, minutes=30),
            },
            {
                "id": "WS-04",
                "name": "North Yard Electrical Bay",
                "zone": "Yard Area",
                "type": "Electrical Work Area",
                "status": "ACTIVE",
                "worker_count": 4,
                "ppe_compliance": 98,
                "helmet_compliance": 100,
                "vest_compliance": 96,
                "risk_level": "LOW",
                "risk_score": 18,
                "camera_count": 2,
                "cameras_json": json.dumps(["CAM-04", "CAM-20"]),
                "risk_factors_json": json.dumps([
                    {"id": "rf-1", "name": "PPE Compliance", "status": "pass", "description": "Dielectric boots and hard hats verified"},
                    {"id": "rf-2", "name": "Worker Density", "status": "pass", "description": "Authorized 4-person crew"},
                    {"id": "rf-3", "name": "Lock-Out Tag-Out", "status": "pass", "description": "Power isolation confirmed"},
                    {"id": "rf-4", "name": "Camera Coverage", "status": "pass", "description": "2 yard cameras operational"}
                ]),
                "created_at": now - timedelta(hours=5),
            },
            {
                "id": "WS-05",
                "name": "Main Concourse Deep Clean",
                "zone": "Main Concourse",
                "type": "Cleaning Zone",
                "status": "PAUSED",
                "worker_count": 5,
                "ppe_compliance": 92,
                "helmet_compliance": 90,
                "vest_compliance": 95,
                "risk_level": "LOW",
                "risk_score": 20,
                "camera_count": 1,
                "cameras_json": json.dumps(["CAM-21"]),
                "risk_factors_json": json.dumps([
                    {"id": "rf-1", "name": "PPE Compliance", "status": "pass", "description": "Slip-resistant footwear and vests worn"},
                    {"id": "rf-2", "name": "Worker Density", "status": "pass", "description": "Cordoned cleaning bay"},
                    {"id": "rf-3", "name": "Passenger Flow", "status": "pass", "description": "Clear pedestrian path"},
                    {"id": "rf-4", "name": "Camera Coverage", "status": "pass", "description": "CAM-21 optical tracking"}
                ]),
                "created_at": now - timedelta(hours=6),
            },
            {
                "id": "WS-06",
                "name": "East Gate Roof Repair",
                "zone": "Main Concourse",
                "type": "Concourse Maintenance",
                "status": "COMPLETED",
                "worker_count": 3,
                "ppe_compliance": 100,
                "helmet_compliance": 100,
                "vest_compliance": 100,
                "risk_level": "LOW",
                "risk_score": 10,
                "camera_count": 1,
                "cameras_json": json.dumps(["CAM-22"]),
                "risk_factors_json": json.dumps([
                    {"id": "rf-1", "name": "PPE Compliance", "status": "pass", "description": "100% compliant"},
                    {"id": "rf-2", "name": "Worker Density", "status": "pass", "description": "Work finished and cleared"},
                    {"id": "rf-3", "name": "Site Inspection", "status": "pass", "description": "Permit signed off and closed"},
                    {"id": "rf-4", "name": "Camera Coverage", "status": "pass", "description": "CAM-22 active"}
                ]),
                "created_at": now - timedelta(hours=8),
            }
        ]

        for wsd in worksites_data:
            ws = Worksite(
                id=wsd["id"],
                name=wsd["name"],
                zone=wsd["zone"],
                type=wsd["type"],
                status=wsd["status"],
                worker_count=wsd["worker_count"],
                ppe_compliance=wsd["ppe_compliance"],
                helmet_compliance=wsd["helmet_compliance"],
                vest_compliance=wsd["vest_compliance"],
                risk_level=wsd["risk_level"],
                risk_score=wsd["risk_score"],
                camera_count=wsd["camera_count"],
                cameras_json=wsd["cameras_json"],
                risk_factors_json=wsd["risk_factors_json"],
                created_at=wsd["created_at"],
                updated_at=now
            )
            db.add(ws)
        db.commit()
        print(f"[SEED] Seeded {len(worksites_data)} worksites.")

        # Seed Worksite Events Timeline
        worksite_events = [
            ("WS-01", "worksite_activated", "INFO", "Platform 3 Maintenance activated for track bed inspection", "CAM-07", 1.0, now - timedelta(hours=3, minutes=45)),
            ("WS-01", "worker_detected", "INFO", "8 track workers detected entering Platform 3 North zone", "CAM-08", 0.96, now - timedelta(hours=3, minutes=30)),
            ("WS-01", "ppe_violation", "HIGH", "Safety helmet missing on technician near Platform 3 Stairwell B", "CAM-18", 0.91, now - timedelta(hours=2, minutes=10)),
            ("WS-01", "alert_acknowledged", "INFO", "PPE alert acknowledged by Duty Controller Sharma", "CAM-18", 1.0, now - timedelta(hours=2, minutes=8)),
            ("WS-01", "safety_check_completed", "INFO", "Hard hat equipped. Worksite returned to 96% compliance", "CAM-18", 0.98, now - timedelta(hours=2)),
            
            ("WS-02", "worksite_activated", "INFO", "Track Maintenance section initialized on Yard Track 2", "CAM-19", 1.0, now - timedelta(hours=3)),
            ("WS-02", "worker_detected", "INFO", "12 crew members deployed along KM 392 rail weld zone", "CAM-20", 0.95, now - timedelta(hours=2, minutes=45)),
            ("WS-02", "restricted_work_zone", "CRITICAL", "Restricted work zone boundary breach detected near active interlock", "CAM-19", 0.96, now - timedelta(minutes=45)),
            
            ("WS-03", "worksite_activated", "INFO", "FOB Central Span Retrofit initialized with anchor harnesses", "CAM-16", 1.0, now - timedelta(hours=2, minutes=30)),
            ("WS-03", "worker_detected", "INFO", "6 technicians on central FOB span", "CAM-17", 0.94, now - timedelta(hours=2)),
        ]

        for w_id, e_type, sev, desc, cam, conf, e_time in worksite_events:
            we = WorksiteEvent(
                worksite_id=w_id,
                event_type=e_type,
                severity=sev,
                description=desc,
                camera_id=cam,
                confidence=conf,
                timestamp=e_time
            )
            db.add(we)
        db.commit()
        print(f"[SEED] Seeded {len(worksite_events)} worksite timeline events.")

        # Seed Authorized Railway Users
        users = [
            User(
                id="USR-001",
                employee_id="RLY-10001",
                name="Arun Patel",
                email="a.patel@railguard.gov.in",
                password_hash="pbkdf2:sha256:admin123",
                role="ADMIN",
                department="Station Administration",
                station="Vadodara Junction (BRC)",
                status="ACTIVE",
                created_at=now - timedelta(days=60),
                last_login=now - timedelta(minutes=15),
            ),
            User(
                id="USR-002",
                employee_id="RLY-10042",
                name="Rahul Sharma",
                email="r.sharma@railguard.gov.in",
                password_hash="pbkdf2:sha256:officer123",
                role="OFFICER",
                department="Platform Operations",
                station="Vadodara Junction (BRC)",
                status="ACTIVE",
                created_at=now - timedelta(days=30),
                last_login=now - timedelta(minutes=5),
            ),
            User(
                id="USR-003",
                employee_id="RLY-10099",
                name="Priya Verma",
                email="p.verma@railguard.gov.in",
                password_hash="pbkdf2:sha256:test123",
                role="OFFICER",
                department="Safety & Inspection",
                station="Vadodara Junction (BRC)",
                status="DISABLED",
                created_at=now - timedelta(days=90),
                last_login=now - timedelta(days=14),
            ),
        ]
        for u in users:
            db.add(u)
        db.commit()
        print(f"[SEED] Seeded {len(users)} authorized railway employees (RLY-10001, RLY-10042, RLY-10099).")

        # Seed Initial Audit Logs
        audit_logs = [
            AuditLog(
                user_id="USR-001",
                user_name="Station Master / Admin",
                role="ADMIN",
                action="LOGIN",
                resource="System",
                resource_id="AUTH-SESSION",
                details_json=json.dumps({"ip": "127.0.0.1", "auth_method": "password", "station": "BRC"}),
                timestamp=now - timedelta(minutes=45),
            ),
            AuditLog(
                user_id="USR-002",
                user_name="Duty Officer Sharma",
                role="OFFICER",
                action="VIEW_CAMERA",
                resource="Camera",
                resource_id="CAM-07",
                details_json=json.dumps({"action": "PTZ View Stream", "duration_sec": 42}),
                timestamp=now - timedelta(minutes=30),
            ),
            AuditLog(
                user_id="USR-002",
                user_name="Duty Officer Sharma",
                role="OFFICER",
                action="ACKNOWLEDGE_ALERT",
                resource="Alert",
                resource_id="ALT-001",
                details_json=json.dumps({"alert_type": "restricted_zone", "severity": "CRITICAL"}),
                timestamp=now - timedelta(minutes=20),
            ),
            AuditLog(
                user_id="USR-001",
                user_name="Station Master / Admin",
                role="ADMIN",
                action="UPDATE_SETTINGS",
                resource="Settings",
                resource_id="THRESHOLDS",
                details_json=json.dumps({"crowd_density_limit": 80, "confidence_threshold": 75}),
                timestamp=now - timedelta(minutes=10),
            ),
        ]
        for log in audit_logs:
            db.add(log)
        db.commit()
        print(f"[SEED] Seeded {len(audit_logs)} initial audit log records.")

        print("[SEED] Database seed completed successfully for Vadodara Railway Station.")
    except Exception as e:
        db.rollback()
        print(f"[SEED ERROR] Failed to seed database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    should_reset = True
    if len(sys.argv) > 1 and sys.argv[1].lower() == "--no-reset":
        should_reset = False
    seed_database(reset=should_reset)
