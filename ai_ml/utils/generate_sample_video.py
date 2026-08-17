import cv2
import numpy as np
import os

def create_sample_cctv_video(output_path: str = "videos/sample_cctv.mp4", duration_sec: int = 10, fps: int = 25):
    """
    Generates a synthetic CCTV sample video featuring simulated moving pedestrians and zones
    for offline testing of the RailGuard AI pipeline.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    width, height = 1280, 720
    total_frames = duration_sec * fps
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    print(f"[SYNTHETIC VIDEO] Generating test CCTV video: {output_path} ({duration_sec}s @ {fps} FPS)...")

    # Pedestrian simulated trajectory trajectories (x, y, dx, dy, color, label)
    pedestrians = [
        {"x": 100, "y": 200, "dx": 3, "dy": 1, "w": 40, "h": 100},
        {"x": 200, "y": 300, "dx": 2, "dy": -1, "w": 45, "h": 110},
        {"x": 500, "y": 150, "dx": -2, "dy": 2, "w": 38, "h": 95},
        {"x": 300, "y": 500, "dx": 4, "dy": 2, "w": 50, "h": 120}, # Moves into restricted zone
        {"x": 800, "y": 250, "dx": -3, "dy": 0, "w": 42, "h": 105},
        {"x": 900, "y": 400, "dx": -1, "dy": -2, "w": 40, "h": 100},
    ]

    for frame_idx in range(total_frames):
        # Create CCTV background (dark platform texture)
        frame = np.full((height, width, 3), (40, 45, 50), dtype=np.uint8)
        
        # Grid platform lines
        for y in range(0, height, 80):
            cv2.line(frame, (0, y), (width, y), (60, 65, 70), 1)
        for x in range(0, width, 120):
            cv2.line(frame, (x, 0), (x, height), (60, 65, 70), 1)

        # Draw Restricted Zone (Red Polygon)
        restricted_pts = np.array([[128, 432], [1152, 432], [1152, 684], [128, 684]], np.int32)
        cv2.polylines(frame, [restricted_pts], True, (0, 0, 220), 2)
        cv2.putText(frame, "RESTRICTED ZONE (TRACK BED)", (140, 460), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

        # Draw Crowd Zone (Blue Polygon)
        crowd_pts = np.array([[64, 72], [1216, 72], [1216, 396], [64, 396]], np.int32)
        cv2.polylines(frame, [crowd_pts], True, (220, 150, 0), 2)
        cv2.putText(frame, "CROWD MONITORING ZONE", (80, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 200, 0), 2)

        # Draw Header info
        cv2.putText(frame, f"CAM-07 | Platform 3 CCTV Feed | Frame {frame_idx+1}/{total_frames}", (30, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

        # Update and draw simulated pedestrians
        for ped in pedestrians:
            ped["x"] += ped["dx"]
            ped["y"] += ped["dy"]

            # Bounce off borders
            if ped["x"] <= 50 or ped["x"] >= width - 80:
                ped["dx"] *= -1
            if ped["y"] <= 80 or ped["y"] >= height - 130:
                ped["dy"] *= -1

            x, y, w, h = int(ped["x"]), int(ped["y"]), int(ped["w"]), int(ped["h"])

            # Draw pedestrian head & body figure
            cv2.rectangle(frame, (x, y), (x + w, y + h), (180, 220, 180), 2)
            cv2.circle(frame, (x + w // 2, y + 15), 12, (200, 230, 200), -1) # Head
            cv2.putText(frame, "Person", (x, y - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (180, 220, 180), 1)

        out.write(frame)

    out.release()
    print(f"[SYNTHETIC VIDEO] Done! Created sample CCTV video at {output_path}")

if __name__ == "__main__":
    create_sample_cctv_video()
