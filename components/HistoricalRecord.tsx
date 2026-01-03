
import React from 'react';
import { Calendar, Download, TrendingUp, DollarSign, Wallet, CreditCard, ShoppingBag } from 'lucide-react';
import { DailySummary } from '../types';

interface HistoricalRecordProps {
  history: DailySummary[];
  rate: number;
}

const HistoricalRecord: React.FC<HistoricalRecordProps> = ({ history, rate }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Histórico de Cierres Diarios</h2>
          <p className="text-gray-500 font-medium">Hoja de totales consolidados por día.</p>
        </div>
        <button className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl text-gray-600 font-bold hover:bg-gray-200 transition-all">
          <Download size={18} /> Exportar Excel
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Efectivo (Bs)</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Punto (Bs)</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pago Móvil (Bs)</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Dólares ($)</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Mermas ($)</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Gastos ($)</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total Día ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {history.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(day => (
                <tr key={day.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {new Date(day.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">{day.efectivoVES.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-600 font-medium">{day.puntoVES.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-600 font-medium">{day.pagoMovilVES.toLocaleString()}</td>
                  <td className="px-6 py-4 text-emerald-600 font-black">${day.dolaresUSD.toFixed(2)}</td>
                  <td className="px-6 py-4 text-red-400 font-medium">${day.mermaUSD.toFixed(2)}</td>
                  <td className="px-6 py-4 text-orange-400 font-medium">${day.gastosUSD.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl font-black">
                      ${day.totalDayUSD.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoricalRecord;
