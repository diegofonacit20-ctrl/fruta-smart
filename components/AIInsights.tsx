
import React, { useState } from 'react';
import { BrainCircuit, Sparkles, Send, Loader2, FileText, BarChart3 } from 'lucide-react';
import { getBusinessInsights } from '../services/geminiService';
import { Product, Transaction } from '../types';

interface AIInsightsProps {
  products: Product[];
  transactions: Transaction[];
  rate: number;
}

const AIInsights: React.FC<AIInsightsProps> = ({ products, transactions, rate }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    const result = await getBusinessInsights(products, transactions, rate);
    setInsight(result || "Ocurrió un error.");
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 p-10 rounded-3xl text-white shadow-2xl relative overflow-hidden border-4 border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-md">
            <BrainCircuit size={48} className="text-emerald-300" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-4xl font-black mb-2 tracking-tight">Análisis Económico Semanal</h2>
            <p className="text-emerald-100 opacity-80 text-lg mb-6 leading-snug font-medium">
              Informe inteligente de capitalización, mermas y comportamiento de la dualidad Bolívares/Dólares en tu frutería.
            </p>
            <button 
              onClick={generateReport}
              disabled={loading}
              className="group flex items-center justify-center gap-3 bg-white text-emerald-900 px-8 py-4 rounded-2xl font-black hover:bg-emerald-50 transition-all disabled:opacity-50 shadow-xl active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" /> : <BarChart3 size={24} className="group-hover:rotate-12 transition-transform" />}
              {loading ? 'Generando Informe...' : 'Obtener Informe de Rendimiento'}
            </button>
          </div>
        </div>
        <div className="absolute -bottom-20 -right-20 opacity-10">
           <FileText size={350} />
        </div>
      </div>

      {insight ? (
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-emerald-100 prose prose-emerald max-w-none animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="flex items-center gap-3 text-emerald-600 mb-8 pb-4 border-b border-gray-100 font-black uppercase tracking-widest text-sm">
            <Sparkles size={20} />
            Informe de Gestión Inteligente
          </div>
          <div className="text-gray-800 whitespace-pre-wrap leading-relaxed font-medium markdown-body">
            {insight}
          </div>
        </div>
      ) : !loading && (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-300">
            <FileText size={40} />
          </div>
          <p className="text-gray-500 font-bold text-xl">¿Listo para el balance semanal?</p>
          <p className="text-gray-400 mt-2">Haz clic arriba para analizar los totales y la salud financiera del negocio.</p>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
