import cv2
import time
import os
from typing import Generator, Tuple, Optional

class VideoStream:
    """
    Video stream handler supporting pre-recorded video files, webcams, and RTSP streams.
    """
    def __init__(self, source: str | int = 0):
        self.source = source
        self.cap: Optional[cv2.VideoCapture] = None
        self.width: int = 0
        self.height: int = 0
        self.fps: float = 0.0
        self.total_frames: int = 0
        self.is_open: bool = False
        
        self.open_stream()

    def open_stream(self) -> bool:
        """Opens the video capture source."""
        # Convert numeric string to int for webcam
        if isinstance(self.source, str) and self.source.isdigit():
            self.source = int(self.source)

        is_webcam = isinstance(self.source, int)
        if is_webcam:
            print("[VIDEO] Opening webcam...")

        self.cap = cv2.VideoCapture(self.source)
        if not self.cap.isOpened():
            if is_webcam:
                print("[ERROR] Could not open webcam.")
                print("Check that:")
                print("- Your laptop camera is connected/enabled.")
                print("- No other application is currently using it.")
                print("- Windows camera permissions are enabled.")
            else:
                print(f"[ERROR] Failed to open video source: {self.source}")
            self.is_open = False
            return False

        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.fps = float(self.cap.get(cv2.CAP_PROP_FPS)) or 25.0
        self.total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        self.is_open = True
        
        if is_webcam:
            print(f"[VIDEO] Webcam (index {self.source}) opened successfully")
        else:
            print(f"[VIDEO] Stream Opened: {self.source} ({self.width}x{self.height} @ {self.fps:.1f} FPS)")
        return True

    def switch_source(self, new_source: str | int) -> bool:
        """Switches active camera/video stream source dynamically."""
        self.release()
        old_source = self.source
        self.source = new_source
        if self.open_stream():
            return True
        else:
            print(f"[CAMERA SWITCH] Could not switch to {new_source}. Reverting to {old_source}.")
            self.source = old_source
            self.open_stream()
            return False

    @staticmethod
    def detect_available_cameras(max_indices: int = 4) -> list[int]:
        """Scans indices 0..max_indices-1 and returns list of available webcam indices."""
        available = []
        backend = cv2.CAP_DSHOW if os.name == 'nt' else cv2.CAP_ANY
        for idx in range(max_indices):
            cap = cv2.VideoCapture(idx, backend)
            if cap.isOpened():
                ret, _ = cap.read()
                if ret:
                    available.append(idx)
                cap.release()
        return available

    def read_frames(self, skip_interval: int = 1) -> Generator[Tuple[int, bool, Optional[cv2.Mat]], None, None]:
        """
        Yields (frame_index, success, frame) for each frame in the stream.
        Optionally skips frames for performance optimization.
        """
        if not self.is_open or not self.cap:
            return

        frame_idx = 0
        while self.cap and self.cap.isOpened():
            ret, frame = self.cap.read()
            if not ret:
                break
            
            frame_idx += 1
            if frame_idx % skip_interval == 0:
                yield frame_idx, ret, frame

        self.release()

    def release(self):
        """Releases video capture resource."""
        if self.cap and self.cap.isOpened():
            self.cap.release()
            self.is_open = False
            print("[VIDEO] Stream Released.")


class VideoWriter:
    """
    Utility for saving annotated output video files for hackathon demonstrations.
    """
    def __init__(self, output_path: str, width: int, height: int, fps: float = 25.0):
        self.output_path = output_path
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        self.writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    def write(self, frame: cv2.Mat):
        if self.writer:
            self.writer.write(frame)

    def release(self):
        if self.writer:
            self.writer.release()
            print(f"[VIDEO] Saved annotated demo video to: {self.output_path}")
