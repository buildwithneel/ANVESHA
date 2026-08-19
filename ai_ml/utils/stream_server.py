import time
import cv2
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """Handle requests in separate threads so slow clients don't block."""
    daemon_threads = True
    allow_reuse_address = True

class MJPEGStreamHandler(BaseHTTPRequestHandler):
    """
    HTTP Request Handler serving multipart/x-mixed-replace MJPEG stream.
    """
    server_instance = None  # Reference to MJPEGStreamServer instance

    def do_GET(self):
        if self.path in ('/stream', '/stream.mjpg', '/'):
            self.send_response(200)
            self.send_header('Content-type', 'multipart/x-mixed-replace; boundary=frame')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, pre-check=0, post-check=0, max-age=0')
            self.send_header('Pragma', 'no-cache')
            self.end_headers()

            try:
                while getattr(self.server_instance, 'running', True):
                    jpeg_bytes = self.server_instance.get_latest_frame_bytes()
                    if jpeg_bytes:
                        self.wfile.write(b'--frame\r\n')
                        self.send_header('Content-type', 'image/jpeg')
                        self.send_header('Content-length', str(len(jpeg_bytes)))
                        self.end_headers()
                        self.wfile.write(jpeg_bytes)
                        self.wfile.write(b'\r\n')
                        self.wfile.flush()
                    time.sleep(0.04)  # ~25 FPS max stream rate
            except (ConnectionResetError, BrokenPipeError, ConnectionAbortedError):
                pass
            except Exception:
                pass
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        # Suppress HTTP server request logs to keep Python console output clean
        return


class MJPEGStreamServer:
    """
    Lightweight, thread-safe MJPEG stream server for RailGuard AI presentation demo.
    Binds to 127.0.0.1:8090 and exposes annotated pipeline frames via HTTP /stream.
    """
    def __init__(self, host: str = "127.0.0.1", port: int = 8090, jpeg_quality: int = 80):
        self.host = host
        self.port = port
        self.jpeg_quality = jpeg_quality
        self.lock = threading.Lock()
        self.latest_frame_bytes = None
        self.running = False
        self.server = None
        self.thread = None

    def start(self) -> bool:
        """Starts the HTTP MJPEG server in a background daemon thread."""
        try:
            handler_class = type('ConfiguredMJPEGHandler', (MJPEGStreamHandler,), {'server_instance': self})
            self.server = ThreadedHTTPServer((self.host, self.port), handler_class)
            self.running = True
            self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
            self.thread.start()
            print(f"[MJPEG SERVER] Processed camera stream running on http://{self.host}:{self.port}/stream")
            return True
        except Exception as e:
            print(f"[MJPEG SERVER WARNING] Could not start stream server on http://{self.host}:{self.port}/stream: {e}")
            return False

    def update_frame(self, frame):
        """
        Thread-safe update of the latest frame.
        Encodes OpenCV frame (BGR numpy array) to JPEG bytes.
        """
        if frame is None or frame.size == 0:
            return
        try:
            success, encoded_img = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), self.jpeg_quality])
            if success:
                jpeg_bytes = encoded_img.tobytes()
                with self.lock:
                    self.latest_frame_bytes = jpeg_bytes
        except Exception:
            pass

    def get_latest_frame_bytes(self):
        """Thread-safe retrieval of latest encoded JPEG bytes."""
        with self.lock:
            return self.latest_frame_bytes

    def stop(self):
        """Stops the stream server."""
        self.running = False
        if self.server:
            try:
                self.server.shutdown()
                self.server.server_close()
            except Exception:
                pass
        print("[MJPEG SERVER] Stream server stopped.")
