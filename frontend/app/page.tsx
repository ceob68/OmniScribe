"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      wsRef.current = new WebSocket("ws://localhost:8000/api/v1/stream");
      
      wsRef.current.onopen = () => {
        setIsRecording(true);
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const source = audioContextRef.current.createMediaStreamSource(stream);
        processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
        
        source.connect(processorRef.current);
        processorRef.current.connect(audioContextRef.current.destination);
        
        processorRef.current.onaudioprocess = (e) => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            const float32Array = e.inputBuffer.getChannelData(0);
            const int16Array = new Int16Array(float32Array.length);
            for (let i = 0; i < float32Array.length; i++) {
              int16Array[i] = Math.max(-32768, Math.min(32767, float32Array[i] * 32768));
            }
            wsRef.current.send(int16Array.buffer);
          }
        };
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "transcription" && data.text) {
          setTranscripts(prev => [...prev, data.text]);
        }
      };
      
    } catch (err) {
      console.error("Error accessing mic:", err);
    }
  };

  const stopRecording = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
    setIsRecording(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A12] text-white font-sans selection:bg-emerald-500/30">
      <div className="max-w-5xl mx-auto p-8">
        <header className="flex justify-between items-center mb-12 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center font-bold text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              OS
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              OmniScribe
            </h1>
          </div>
          <button 
            onClick={isRecording ? stopRecording : startRecording}
            className={`px-6 py-2.5 rounded-full font-medium transition-all duration-300 flex items-center gap-2 shadow-lg ${
              isRecording 
              ? "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 shadow-red-500/20" 
              : "bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-500/20"
            }`}
          >
            {isRecording ? (
              <><span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" /> Detener</>
            ) : (
              "Iniciar Grabación"
            )}
          </button>
        </header>

        <div className="relative min-h-[60vh] bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent blur-sm rounded-full" />
          
          <div className="space-y-4">
            {transcripts.length === 0 && !isRecording && (
              <div className="text-center text-white/30 pt-32">
                <p className="text-xl">Presiona "Iniciar Grabación" para comenzar a transcribir en tiempo real.</p>
              </div>
            )}
            
            {transcripts.map((text, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                key={i} 
                className="text-lg leading-relaxed tracking-wide text-white/90 bg-white/5 p-4 rounded-xl border border-white/5 shadow-inner"
              >
                {text}
              </motion.div>
            ))}
            
            {isRecording && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 text-emerald-400/70 p-4"
              >
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{animationDelay: "0ms"}} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{animationDelay: "150ms"}} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{animationDelay: "300ms"}} />
                </div>
                <span className="text-sm">Escuchando y enviando paquetes al servidor...</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
