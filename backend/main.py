import sys
import os
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from core import TranscriptionEngine
import json
import asyncio

# © 2026 ceob68 / Vaultly. All rights reserved.

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load model in background to not block startup
    asyncio.create_task(engine.initialize_async())
    yield

app = FastAPI(title="OmniScribe API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = TranscriptionEngine()

@app.websocket("/api/v1/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    session_id = engine.create_session()
    
    try:
        while True:
            # Receive audio chunk (binary Int16 PCM)
            data = await websocket.receive_bytes()
            
            # Process chunk and get tokens
            result = engine.process_chunk(session_id, data)
            
            if result:
                # Send back the transcribed text
                await websocket.send_text(json.dumps({
                    "type": "transcription",
                    "text": result,
                    "is_final": True
                }))
    except WebSocketDisconnect:
        engine.close_session(session_id)
    except Exception as e:
        print(f"WS Error: {e}")
        engine.close_session(session_id)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
