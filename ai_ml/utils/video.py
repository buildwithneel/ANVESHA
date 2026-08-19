import cv2
import time
import os
from typing import Generator, Tuple, Optional

# Suppress internal OpenCV C++ backend warnings
try:
    cv2.utils.logging.setLogLevel(cv2.utils.logging.LOG_LEVEL_SILENT)
except Exception:
    pass

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
            print(f"[VIDEO] Opening webcam (index {self.source})...")

        self.cap = cv2.VideoCapture(self.source)

        if not self.cap or not self.cap.isOpened():
            if is_webcam:
                print(f"[ERROR] Could not open webcam at index {self.source}.")
                print("Check that:")
                print("- Your laptop camera is connected/enabled.")
                print("- No other application is currently using it.")
                print("- Windows camera permissions are enabled.")
            else:
                print(f"[ERROR] Failed to open video source: {self.source}")
            self.is_open = False
            return False

        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 1280
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 720
        self.fps = float(self.cap.get(cv2.CAP_PROP_FPS)) or 25.0
        self.total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        self.is_open = True
        
        if is_webcam:
            print(f"[VIDEO] Webcam (index {self.source}) opened successfully ({self.width}x{self.height} @ {self.fps:.1f} FPS)")
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
            print(f"[CAMERA SWITCH] Could not switch to camera {new_source}. Reverting to camera {old_source}.")
            self.source = old_source
            self.open_stream()
            return False

    @staticmethod
    def detect_available_cameras(max_indices: int = 4) -> list[int]:
        """Scans indices 0..max_indices-1 and returns list of available webcam indices."""
        available = []
        for idx in range(max_indices):
            try:
                cap = cv2.VideoCapture(idx)
                if cap.isOpened():
                    ret, _ = cap.read()
                    if ret:
                        available.append(idx)
                    cap.release()
            except Exception:
                pass
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
            if not ret or frame is None or frame.size == 0:
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
    Automatically handles frame resizing if stream source resolution changes dynamically.
    """
    def __init__(self, output_path: str, width: int, height: int, fps: float = 25.0):
        self.output_path = output_path
        self.width = max(320, width)
        self.height = max(240, height)
        self.fps = fps
        self.writer = None
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        try:
            self.writer = cv2.VideoWriter(output_path, fourcc, fps, (self.width, self.height))
        except Exception as e:
            print(f"[VIDEO WRITER WARNING] Could not initialize VideoWriter for {output_path}: {e}")

    def write(self, frame: cv2.Mat):
        if frame is None or frame.size == 0 or not self.writer or not self.writer.isOpened():
            return
        try:
            fh, fw = frame.shape[:2]
            if (fw, fh) != (self.width, self.height):
                frame_to_write = cv2.resize(frame, (self.width, self.height))
            else:
                frame_to_write = frame
            self.writer.write(frame_to_write)
        except Exception:
            pass

    def release(self):
        if self.writer and self.writer.isOpened():
            try:
                self.writer.release()
                print(f"[VIDEO] Saved annotated demo video to: {self.output_path}")
            except Exception:
                pass
