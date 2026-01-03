
import React, { useState } from 'react';
import { 
  Sparkles, Image as ImageIcon, Video, MessageSquare, 
  Brain, Send, Loader2, Maximize, Trash2, Edit3, 
  Search, MapPin, ExternalLink, Zap
} from 'lucide-react';
import { chatWithGemini, generateImage, editImage, generateVeoVideo } from '../services/geminiService';

const AIStudio: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'chat' | 'images' | 'video'>('chat');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState<any[]>([]);
  
  // Media State
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);

  const handleChat = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    const newUserMsg = { role: 'user', parts: [{ text: prompt }] };
    setMessages(prev => [...prev, newUserMsg]);
    setPrompt('');

    try {
      const result = await chatWithGemini(prompt, messages, thinking);
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: result.text }], sources: result.sources }]);
    } catch (e) {
      alert("Error en la conexión con Gemini.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    setIsLoading(true);
    const img = await generateImage(prompt);
    setGeneratedImg(img);
    setIsLoading(false);
  };

  const handleGenerateVideo = async () => {
    setIsLoading(true);
    const vid = await generateVeoVideo(prompt);
    setGeneratedVideo(vid);
    setIsLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex bg-white p-2 rounded-[2.5rem] shadow-sm border border-gray-100 mb-8 overflow-x-auto no-scrollbar">
        <button onClick={() => setActiveTool('chat')} className={`flex-1 min-w-[120px] py-4 rounded-[2rem] font-black flex items-center justify-center gap-2 transition-all ${activeTool === 'chat' ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-400'}`}><MessageSquare size={18}/> Chat Pro</button>
        <button onClick={() => setActiveTool('images')} className={`flex-1 min-w-[120px] py-4 rounded-[2rem] font-black flex items-center justify-center gap-2 transition-all ${activeTool === 'images' ? 'bg-emerald-600 text-white shadow-xl' : 'text-gray-400'}`}><ImageIcon size={18}/> Laboratorio Imagen</button>
        <button onClick={() => setActiveTool('video')} className={`flex-1 min-w-[120px] py-4 rounded-[2rem] font-black flex items-center justify-center gap-2 transition-all ${activeTool === 'video' ? 'bg-blue-600 text-white shadow-xl' : 'text-gray-400'}`}><Video size={18}/> Studio Video Veo</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[600px]">
        <div className="lg:col-span-8 flex flex-col bg-white rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden">
          {activeTool === 'chat' ? (
            <div className="flex-1 flex flex-col p-8 bg-gray-50/50">
              <div className="flex-1 overflow-y-auto space-y-6 no-scrollbar">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-6 rounded-[2rem] shadow-sm ${m.role === 'user' ? 'bg-gray-900 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                      <p className="whitespace-pre-wrap font-medium">{m.parts[0].text}</p>
                      {m.sources && m.sources.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                           <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Fuentes de búsqueda:</p>
                           {m.sources.map((s: any, idx: number) => (
                             <a key={idx} href={s.web?.uri || s.maps?.uri} target="_blank" className="text-[10px] text-gray-400 hover:text-blue-600 flex items-center gap-1 underline">
                               <ExternalLink size={10}/> {s.web?.title || s.maps?.title || 'Fuente'}
                             </a>
                           ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 animate-pulse flex gap-2">
                       <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                       <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                       <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12 bg-gray-50">
              {activeTool === 'images' ? (
                generatedImg ? <img src={generatedImg} className="max-w-full max-h-[500px] rounded-[2rem] shadow-2xl animate-in zoom-in" /> : <div className="text-center text-gray-400 font-bold"><ImageIcon size={64} className="mx-auto mb-4 opacity-20"/> Describe la imagen que quieres crear...</div>
              ) : (
                generatedVideo ? <video src={generatedVideo} controls className="max-w-full max-h-[500px] rounded-[2rem] shadow-2xl" /> : <div className="text-center text-gray-400 font-bold"><Video size={64} className="mx-auto mb-4 opacity-20"/> Genera un clip publicitario para tus redes...</div>
              )}
            </div>
          )}

          <div className="p-8 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <input 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (activeTool === 'chat' ? handleChat() : activeTool === 'images' ? handleGenerateImage() : handleGenerateVideo())}
                  placeholder={activeTool === 'chat' ? "Pregunta sobre tendencias, precios o análisis..." : "Describe el diseño creativo..."}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-6 pr-16 py-4 font-bold outline-none focus:ring-2 focus:ring-gray-900"
                />
                <button 
                  disabled={isLoading}
                  onClick={activeTool === 'chat' ? handleChat : activeTool === 'images' ? handleGenerateImage : handleGenerateVideo}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white p-2.5 rounded-xl hover:scale-105 transition-all disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-xl">
            <h4 className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-6 flex items-center gap-2"><Zap size={16}/> Configuración Pro</h4>
            
            <div className="space-y-6">
              {activeTool === 'chat' && (
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div>
                    <p className="text-xs font-black">Thinking Mode</p>
                    <p className="text-[10px] text-gray-400">Razonamiento profundo para análisis</p>
                  </div>
                  <button onClick={() => setThinking(!thinking)} className={`w-12 h-6 rounded-full transition-all relative ${thinking ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${thinking ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>
              )}

              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                 <p className="text-[10px] font-black uppercase text-gray-500">Herramientas Activas</p>
                 <div className="flex flex-wrap gap-2">
                    <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-[10px] font-black border border-blue-500/30 flex items-center gap-1"><Search size={10}/> Google Search</span>
                    <span className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-[10px] font-black border border-red-500/30 flex items-center gap-1"><MapPin size={10}/> Google Maps</span>
                 </div>
              </div>

              <div className="pt-4 mt-4 border-t border-white/10">
                 <p className="text-[10px] text-gray-400 leading-relaxed italic">"Usa el chat para comparar precios de la competencia o ubicar proveedores cercanos mediante Maps Grounding."</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIStudio;
