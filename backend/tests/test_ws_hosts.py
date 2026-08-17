import asyncio
import websockets

async def test_host(host, origin):
    uri = f"ws://{host}:8000/ws/events"
    try:
        kwargs = {}
        if origin:
            kwargs["additional_headers"] = {"Origin": origin}
        async with websockets.connect(uri, **kwargs) as ws:
            await ws.send("ping")
            resp = await ws.recv()
            print(f"[{host}] (Origin: {origin}) WS Connected & response: {resp}")
    except Exception as e:
        print(f"[{host}] (Origin: {origin}) WS Connection FAILED: {e}")

async def main():
    await test_host("localhost", "http://localhost:5173")
    await test_host("127.0.0.1", "http://localhost:5173")
    await test_host("localhost", "http://127.0.0.1:5173")
    await test_host("127.0.0.1", "http://127.0.0.1:5173")
    await test_host("localhost", None)

if __name__ == "__main__":
    asyncio.run(main())
