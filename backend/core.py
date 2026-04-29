import threading
import uuid
import numpy as np
import asyncio
from faster_whisper import WhisperModel
import os

# © 2026 ceob68 / Vaultly. All rights reserved.

class TranscriptionEngine:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._init_state()
        return cls._instance

    def _init_state(self):
        self.model = None
        self.sessions = {}
        self.status = "uninitialized"

    async def initialize_async(self, model_size="base", device="cpu"):
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self.initialize, model_size, device)

    def initialize(self, model_size="base", device="cpu"):
        if self.status != "initialized":
            self.status = "loading"
            models_dir = os.path.join(os.path.expanduser("~"), ".omniscribe", "models")
            os.makedirs(models_dir, exist_ok=True)
            self.model = WhisperModel(model_size, device=device, compute_type="int8", download_root=models_dir)
            self.status = "initialized"

    def create_session(self):
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = {
            "buffer": bytearray(),
            "min_chunk_size": 16000 * 2 * 3 # 3 seconds of 16kHz Int16 audio
        }
        return session_id

    def process_chunk(self, session_id: str, chunk: bytes):
        if self.status != "initialized":
            return None
            
        session = self.sessions.get(session_id)
        if not session:
            return None
            
        session["buffer"].extend(chunk)
        
        # When we have enough audio, process it (Simulated Streaming)
        if len(session["buffer"]) >= session["min_chunk_size"]:
            # Convert Int16 bytes to Float32 numpy array for whisper
            audio_data = np.frombuffer(session["buffer"], dtype=np.int16).astype(np.float32) / 32768.0
            
            # Clear buffer for next utterance
            session["buffer"] = bytearray()
            
            try:
                segments, info = self.model.transcribe(audio_data, language="es", vad_filter=True)
                text = " ".join([seg.text for seg in segments]).strip()
                return text if text else None
            except Exception as e:
                print(f"Transcription error: {e}")
                return None
                
        return None

    def close_session(self, session_id: str):
        if session_id in self.sessions:
            del self.sessions[session_id]
