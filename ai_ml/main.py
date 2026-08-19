import argparse
import time
import os
import cv2
from typing import Optional
from config import config
from utils.video import VideoStream, VideoWriter
from models.model_loader import YOLOModelLoader
from tracking.tracker import LightweightTracker
from zones.zone_manager import zone_manager
from detection.crowd_detector import CrowdDetector
from detection.person_detector import RestrictedZoneDetector
from detection.ppe_detector import PPESafetyDetector
from detection.safety_detector import PrototypeFallAndObjectDetector
from events.event_engine import event_engine
from utils.stream_server import MJPEGStreamServer

def run_pipeline(
    video_source: str | int = "videos/sample_cctv.mp4",
    camera_id: str = config.DEFAULT_CAMERA_ID,
    location: str = config.DEFAULT_LOCATION,
    save_demo: bool = True,
    show_window: bool = True,
    draw_zones: Optional[bool] = None
):
    """
    Main AI/ML Computer Vision Pipeline Execution.
    Processes video stream, runs YOLO detection, tracking, spatial analysis, risk calculation,
    and dispatches JSON events to the backend.
    """
    is_webcam = isinstance(video_source, int) or (isinstance(video_source, str) and video_source.isdigit())
    if draw_zones is None:
        draw_zones = not is_webcam  # Default OFF for webcams (no fake track lines), ON for CCTV video files

    print(f"\n=======================================================")
    print(f"   RAILGUARD AI — COMPUTER VISION & ML PIPELINE")
    print(f"=======================================================")
    print(f"Camera ID      : {camera_id}")
    print(f"Location       : {location}")
    print(f"Video Source   : {video_source}")
    print(f"Zone Overlay   : {'ENABLED' if draw_zones else 'DISABLED (Press Z in window to toggle)'}")
    print(f"Backend Target : {config.AI_DETECTION_ENDPOINT}")
    print(f"=======================================================\n")

    # Detect & Print Available Cameras if webcam mode
    if is_webcam:
        avail_cams = VideoStream.detect_available_cameras(max_indices=4)
        if avail_cams:
            print(f"[CAMERA DISCOVERY] Detected active camera indices: {avail_cams}")
            print(f"[CAMERA CONTROLS] Window Hotkeys: Press '0'-'9' / 'C' to switch camera | 'Z' toggle zones | 'Q' quit.\n")

    # Initialize Modules
    stream = VideoStream(source=video_source)
    if not stream.is_open:
        print("[ERROR] Cannot run pipeline without a valid video source.")
        return

    model_loader = YOLOModelLoader(model_path=config.MODEL_PATH)
    tracker = LightweightTracker()
    crowd_detector = CrowdDetector()
    restricted_detector = RestrictedZoneDetector()
    ppe_detector = PPESafetyDetector()
    safety_detector = PrototypeFallAndObjectDetector()

    # Initialize Live MJPEG Stream Server (127.0.0.1:8090)
    mjpeg_server = MJPEGStreamServer(host="127.0.0.1", port=8090)
    mjpeg_server.start()

    writer = None
    if save_demo:
        output_dir = "output"
        os.makedirs(output_dir, exist_ok=True)
        out_path = os.path.join(output_dir, f"annotated_{camera_id}.mp4")
        writer = VideoWriter(out_path, stream.width, stream.height, stream.fps)

    frame_count = 0
    start_time = time.time()

    try:
        for idx, ret, frame in stream.read_frames(skip_interval=config.FRAME_SKIP_INTERVAL):
            frame_count += 1
            h, w = frame.shape[:2]

            # 1. Person & Object Detection (YOLO)
            all_dets = model_loader.detect_objects(frame, conf_threshold=config.CONFIDENCE_THRESHOLD)
            person_dets = [d for d in all_dets if d["class"] == "person" or d.get("class_id") == 0]

            # 2. Person Tracking
            tracked_persons = tracker.update(person_dets)

            # 3. Zone Overlay (Restricted, Crowd, Work) - drawn only if enabled
            if draw_zones:
                frame = zone_manager.draw_zones_on_frame(frame, camera_id=camera_id)

            # 4. Crowd Analysis & Event Generation
            crowd_res = crowd_detector.analyze_crowd(tracked_persons, w, h, camera_id=camera_id)
            if crowd_res["is_event"] and crowd_res["event_data"]:
                event_engine.process_and_dispatch_event(
                    event_raw=crowd_res["event_data"],
                    camera_id=camera_id,
                    location=location
                )

            # 5. Restricted Zone / Track Intrusion Detection (evaluated if configured)
            intrusions = restricted_detector.check_intrusions(tracked_persons, w, h, camera_id=camera_id)
            for int_event in intrusions:
                event_engine.process_and_dispatch_event(
                    event_raw=int_event,
                    camera_id=camera_id,
                    location=location
                )

            # 6. PPE Safety Violations Detection
            ppe_events = ppe_detector.check_ppe_violations(tracked_persons, all_dets, w, h, camera_id=camera_id, frame=frame)
            for ppe_event in ppe_events:
                event_engine.process_and_dispatch_event(
                    event_raw=ppe_event,
                    camera_id=camera_id,
                    location=location
                )

            # 7. Passenger Fall & Abandoned Object Detection
            fall_events = safety_detector.check_passenger_falls(tracked_persons, frame=frame)
            for f_event in fall_events:
                event_engine.process_and_dispatch_event(
                    event_raw=f_event,
                    camera_id=camera_id,
                    location=location
                )

            abandoned_events = safety_detector.check_abandoned_objects(all_dets, tracked_persons=tracked_persons)
            for a_event in abandoned_events:
                event_engine.process_and_dispatch_event(
                    event_raw=a_event,
                    camera_id=camera_id,
                    location=location
                )

            # 8. Annotate Frame for Demonstration Display
            # Draw Bounding Boxes & Track IDs
            for person in tracked_persons:
                x1, y1, x2, y2 = person["bbox"]
                tid = person.get("track_id", 0)
                conf = person.get("confidence", 0.0)

                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, f"ID:{tid} ({int(conf*100)}%)", (x1, max(15, y1 - 5)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

            # Telemetry HUD Header
            cv2.rectangle(frame, (0, 0), (w, 50), (20, 20, 20), -1)
            hud_text = (
                f"{camera_id} (Source:{stream.source}) | People: {crowd_res['people_count']} | "
                f"Crowd: {crowd_res['status']} ({crowd_res['density_pct']}%) | "
                f"Trend: {crowd_res['trend']}"
            )
            cv2.putText(frame, hud_text, (15, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

            # 9. Push Annotated Frame to Live MJPEG Stream Server
            mjpeg_server.update_frame(frame)

            if writer:
                writer.write(frame)

            if show_window:
                cv2.imshow("RailGuard AI - Live CV Telemetry", frame)
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    break
                elif key == ord('z'):
                    draw_zones = not draw_zones
                    print(f"\n[ZONES] Zone overlay display toggled {'ON' if draw_zones else 'OFF'}")
                elif ord('0') <= key <= ord('9'):
                    target_idx = key - ord('0')
                    if target_idx != stream.source:
                        print(f"\n[CAMERA SWITCH] Switching to Camera Index {target_idx}...")
                        stream.switch_source(target_idx)
                elif key in (ord('c'), ord('n')):
                    avail_cams = VideoStream.detect_available_cameras()
                    if not avail_cams:
                        print("\n[CAMERA SWITCH] No webcams detected.")
                    elif len(avail_cams) == 1:
                        target_cam = avail_cams[0]
                        print(f"\n[CAMERA SWITCH] Only 1 camera detected (Index {target_cam}).")
                        if stream.source != target_cam:
                            stream.switch_source(target_cam)
                    else:
                        curr_idx = stream.source if isinstance(stream.source, int) else -1
                        next_idx = avail_cams[0]
                        if curr_idx in avail_cams:
                            pos = avail_cams.index(curr_idx)
                            next_idx = avail_cams[(pos + 1) % len(avail_cams)]
                        if next_idx != stream.source:
                            print(f"\n[CAMERA SWITCH] Cycling to next Camera Index ({next_idx})...")
                            stream.switch_source(next_idx)

    finally:
        elapsed = time.time() - start_time
        fps = frame_count / elapsed if elapsed > 0 else 0
        print(f"\n[PIPELINE COMPLETE] Processed {frame_count} frames in {elapsed:.2f}s ({fps:.1f} FPS)")
        
        mjpeg_server.stop()
        if writer:
            writer.release()
        stream.release()
        if show_window:
            cv2.destroyAllWindows()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RailGuard AI Master Computer Vision Pipeline")
    parser.add_argument("--source", type=str, default="videos/sample_cctv.mp4", help="Video file path or webcam index (e.g. 0)")
    parser.add_argument("--camera-id", type=str, default=config.DEFAULT_CAMERA_ID, help="Camera identifier (e.g. CAM-07)")
    parser.add_argument("--location", type=str, default=config.DEFAULT_LOCATION, help="Camera location description")
    parser.add_argument("--no-demo", action="store_true", help="Disable saving demo annotated video")
    parser.add_argument("--no-show", action="store_true", help="Disable showing live CV telemetry window")
    parser.add_argument("--draw-zones", action="store_true", help="Force drawing static zone overlay lines")
    parser.add_argument("--no-zones", action="store_true", help="Disable drawing static zone overlay lines")
    
    args = parser.parse_args()
    
    zones_flag = None
    if args.draw_zones:
        zones_flag = True
    elif args.no_zones:
        zones_flag = False

    run_pipeline(
        video_source=args.source,
        camera_id=args.camera_id,
        location=args.location,
        save_demo=not args.no_demo,
        show_window=not args.no_show,
        draw_zones=zones_flag
    )
