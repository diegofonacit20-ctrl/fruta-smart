
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { Mic, MicOff, Loader2, Volume2, X, Sparkles } from 'lucide-react';
import { Product, Transaction, Reminder, Supplier } from '../types';

interface VoiceAssistantProps {
  products: Product[];
  transactions: Transaction[];
  suppliers: Supplier[];
  reminders: Reminder[];
  onAddTransaction: (t: any) => void;
  onAddReminder: (text: string, date: string) => void;
  onInterpretSales: (items: { productName: string, quantity: number, paymentMethod: string, debtorName?: string }[]) => void;
  onInterpretSupplierDelivery: (supplierName: string, items: { productName: string, quantity: number, cost: number }[]) => void;
  // Updated onSyncRequest type to be more flexible and match the handleExport return type in App.tsx
  onSyncRequest: () => any;
}

// Audio Utils (Reutilizando implementación robusta del sistema)
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ 
  products, transactions, suppliers, reminders, 
  onAddTransaction, onAddReminder, onInterpretSales, onInterpretSupplierDelivery, onSyncRequest 
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const functions: FunctionDeclaration[] = [
    {
      name: 'interpretar_ventas',
      description: 'Captura ventas para el cierre. Ej: "Vendí 1 kilo de papa por punto" o "Le fié 2 lechugas a Carmen".',
      parameters: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                productName: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                paymentMethod: { type: Type.STRING, description: 'Efectivo, Punto, Pago Movil, Dolares, Credito' },
                debtorName: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  ];

  const stopAudio = () => {
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  const startSession = async () => {
    setIsConnecting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          tools: [{ functionDeclarations: functions }],
          systemInstruction: `Eres el Asistente de FrutaSmart.
          Tu objetivo es capturar datos de ventas y gastos en lenguaje coloquial venezolano.
          Ejemplos: 
          - "Vendí": paymentMethod es el que mencionen, si no mencionan, asume Dolares.
          - "Fié" o "Le anoté a": paymentMethod es "Credito" y debtorName es el nombre del cliente.
          - "Llegó mercancía": Usa interpretar_recibo_mercancia.
          Confirma siempre repitiendo lo entendido de forma breve.`
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            const source = inputContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              const audioData = message.serverContent.modelTurn.parts[0].inlineData.data;
              const buffer = await decodeAudioData(decode(audioData), audioContextRef.current!, 24000, 1);
              const source = audioContextRef.current!.createBufferSource();
              source.buffer = buffer;
              source.connect(audioContextRef.current!.destination);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current!.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'interpretar_ventas') {
                  onInterpretSales(fc.args.items as any);
                  setLastAction(`${(fc.args.items as any[]).length} productos registrados.`);
                }
                sessionPromise.then(s => s.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { status: "ok" } } }));
              }
            }
            if (message.serverContent?.interrupted) stopAudio();
          },
          onclose: () => setIsActive(false),
          onerror: (e) => {
            console.error('Session error', e);
            setIsActive(false);
          }
        }
      });
    } catch (err) {
      console.error(err);
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end flex-col gap-4">
      {isActive && (
        <div className="bg-emerald-900 text-white p-6 rounded-[2.5rem] shadow-2xl w-72 border-2 border-emerald-400/20">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-black tracking-widest uppercase">IA Activa</span>
            <button onClick={() => setIsActive(false)}><X size={18} /></button>
          </div>
          <p className="text-sm font-bold text-emerald-100">{lastAction || 'Escuchando tu dictado...'}</p>
          <div className="mt-6 flex justify-center h-8 gap-1 items-center">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="w-1.5 bg-emerald-400/60 rounded-full animate-pulse" style={{ height: `${40 + Math.random() * 60}%` }}></div>
            ))}
          </div>
        </div>
      )}
      <button onClick={isActive ? () => setIsActive(false) : startSession} disabled={isConnecting}
        className={`w-20 h-20 rounded-[2rem] shadow-2xl flex items-center justify-center transition-all ${isActive ? 'bg-red-500' : 'bg-emerald-600 hover:scale-110 shadow-emerald-500/20'}`}>
        {isConnecting ? <Loader2 className="animate-spin text-white" /> : isActive ? <MicOff className="text-white" /> : <Mic className="text-white" />}
      </button>
    </div>
  );
};

export default VoiceAssistant;
