import asyncio
import websockets
import json

async def main():
    uri = "ws://127.0.0.1:8000/ws"
    async with websockets.connect(uri) as websocket:
        print("[WS CLIENT] Connected to WebSocket endpoint.")
        await websocket.send("ping")
        response = await websocket.recv()
        print(f"[WS CLIENT] Received response: {response}")
        assert response == "pong"
        print("[WS CLIENT] WebSocket test PASSED!")

if __name__ == "__main__":
    asyncio.run(main())
