import json
import logging
from typing import List, Dict, Any
from fastapi import WebSocket

logger = logging.getLogger("railguard.websocket")

class ConnectionManager:
    """Manages active WebSocket connections and broadcasts typed real-time events."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Remaining: {len(self.active_connections)}")

    async def broadcast(self, event_type: str, data: Dict[str, Any]):
        """
        Broadcasts a structured event payload to all connected clients.
        Standard RailGuard Event Format:
        {
          "type": "new_alert" | "new_detection" | "alert_updated" | "incident_created" | "camera_status_changed",
          "data": { ... }
        }
        """
        payload = {
            "type": event_type,
            "data": data
        }
        message = json.dumps(payload, default=str)
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.warning(f"Error sending message to WebSocket client: {e}")
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)

    async def broadcast_new_detection(self, detection_data: Dict[str, Any]):
        await self.broadcast("new_detection", detection_data)

    async def broadcast_new_alert(self, alert_data: Dict[str, Any]):
        await self.broadcast("new_alert", alert_data)

    async def broadcast_alert_updated(self, alert_data: Dict[str, Any]):
        await self.broadcast("alert_updated", alert_data)

    async def broadcast_incident_created(self, incident_data: Dict[str, Any]):
        await self.broadcast("incident_created", incident_data)

    async def broadcast_camera_status_changed(self, camera_data: Dict[str, Any]):
        await self.broadcast("camera_status_changed", camera_data)

    async def broadcast_crowd_updated(self, crowd_data: Dict[str, Any]):
        await self.broadcast("crowd_updated", crowd_data)

    async def broadcast_worksite_updated(self, worksite_data: Dict[str, Any]):
        await self.broadcast("worksite_updated", worksite_data)

    async def broadcast_worksite_event_created(self, event_data: Dict[str, Any]):
        await self.broadcast("worksite_event_created", event_data)


ws_manager = ConnectionManager()
