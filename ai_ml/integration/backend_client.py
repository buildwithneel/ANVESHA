import requests
import json
from typing import Dict, Any, Optional
from config import config

class BackendClient:
    """
    HTTP Client for sending lightweight AI JSON events to the existing RailGuard AI Backend.
    Does NOT implement backend/API endpoints itself — strictly client request logic.
    """
    def __init__(self, endpoint_url: str = config.AI_DETECTION_ENDPOINT):
        self.endpoint_url = endpoint_url
        self.headers = {"Content-Type": "application/json"}

    def send_event(self, event_payload: Dict[str, Any]) -> bool:
        """
        Sends a normalized AI detection event payload to the backend.
        Returns True on successful ingestion (HTTP 201/200), False otherwise.
        """
        try:
            response = requests.post(
                self.endpoint_url,
                json=event_payload,
                headers=self.headers,
                timeout=3.0
            )
            if response.status_code in [200, 201]:
                print(f"[HTTP SUCCESS {response.status_code}] Event '{event_payload.get('event_type')}' delivered to backend.")
                return True
            else:
                print(f"[HTTP WARNING {response.status_code}] Backend response: {response.text}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"[HTTP ERROR] Failed to connect to existing backend at {self.endpoint_url}: {e}")
            return False

backend_client = BackendClient()
