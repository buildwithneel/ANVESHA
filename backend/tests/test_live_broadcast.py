import asyncio
import json
import requests
import websockets

async def test_live_event_broadcast():
    uri = "ws://127.0.0.1:8000/ws/events"
    async with websockets.connect(uri) as ws:
        print("[WS Receiver] Connected to ws://127.0.0.1:8000/ws/events")

        # Ingest a detection via HTTP POST
        ml_payload = {
            "camera_id": "CAM-07",
            "event_type": "track_intrusion",
            "confidence": 0.94,
            "risk_score": 92,
            "metadata": {
                "bbox": [120, 80, 320, 420]
            }
        }
        resp = requests.post("http://127.0.0.1:8000/api/detections", json=ml_payload)
        print(f"[HTTP Ingest Status]: {resp.status_code}")
        assert resp.status_code == 201

        # Wait for WebSocket events: new_detection and new_alert
        received_events = []
        for _ in range(2):
            msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
            event_data = json.loads(msg)
            print(f"[WS Received]: Type = '{event_data.get('type')}', Data = {event_data.get('data')}")
            received_events.append(event_data.get("type"))

        assert "new_detection" in received_events
        assert "new_alert" in received_events
        print("[TEST PASSED] Live WebSocket broadcast delivered to connected client successfully!")

if __name__ == "__main__":
    asyncio.run(test_live_event_broadcast())
