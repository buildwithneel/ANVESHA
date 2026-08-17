import asyncio
import websockets

async def main():
    # Test /ws (which existed in the running process)
    try:
        async with websockets.connect("ws://127.0.0.1:8000/ws") as ws:
            await ws.send("ping")
            resp = await ws.recv()
            print(f"[/ws] CONNECTED! Response: {resp}")
    except Exception as e:
        print(f"[/ws] Failed: {e}")

    # Test /ws/events (which was added after the process started)
    try:
        async with websockets.connect("ws://127.0.0.1:8000/ws/events") as ws:
            await ws.send("ping")
            resp = await ws.recv()
            print(f"[/ws/events] CONNECTED! Response: {resp}")
    except Exception as e:
        print(f"[/ws/events] Failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
