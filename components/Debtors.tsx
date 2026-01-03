
import React, { useState, useMemo } from 'react';
import { UserCheck, Phone, Plus, History, DollarSign, X, Calendar, MessageSquare, CheckCircle, Globe, Save } from 'lucide-react';
import { Debtor, Abono } from '../types';

interface DebtorsProps {
  debtors: Debtor[];
  rate: number;
  onAddDebtor: (d: Omit<Debtor, 'id' | 'abonos'>) => void;
  onAddPayment: (debtorId: string, amountUSD: number, method: string, customRate: number) => void;
}

const Debtors: React.FC<DebtorsProps> = ({ debtors, rate, onAddDebtor, onAddPayment }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDebtorData, setNewDebtorData] = useState({ name: '', contact: '', description: '', totalDebtUSD: 0, paymentDates: '' });
  const [paymentModal, setPaymentModal] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState({ amount: 0, method: 'Efectivo', currency: 'USD', customRate: rate });
  const [viewingAbonos, setViewingAbonos] = useState<string | null>(null);

  const totalReceivableUSD = useMemo(() => debtors.reduce((sum, d) => sum + d.totalDebtUSD, 0), [debtors]);

  const handleAddDebtorSubmit = () => {
    if (!newDebtorData.name) return;
    onAddDebtor({...newDebtorData});
    setIsModalOpen(false);
    setNewDebtorData({ name: '', contact: '', description: '', totalDebtUSD: 0, paymentDates: '' });
  };

  const handlePayment = () => {
    if (!paymentModal || paymentData.amount <= 0) return;
    const amountUSD = paymentData.currency === 'USD' ? paymentData.amount : paymentData.amount / paymentData.customRate;
    onAddPayment(paymentModal, amountUSD, paymentData.method, paymentData.customRate);
    setPaymentModal(null);
    setPaymentData({ amount: 0, method: 'Efectivo', currency: 'USD', customRate: rate });
    alert("Cobro registrado exitosamente.");
  };

  return (
    <div className="space-y-8">
      <div className="bg-gray-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden border-4 border-emerald-500/10">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
             <div className="bg-emerald-500/20 p-5 rounded-[2.5rem] border border-emerald-500/30"><UserCheck className="text-emerald-400" size={40} /></div>
             <div>
               <h2 className="text-3xl font-black tracking-tight">Cuentas por Cobrar</h2>
               <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Total mercancía fiada a clientes</p>
             </div>
          </div>
          <div className="text-center md:text-right">
             <span className="text-6xl font-black text-white tracking-tighter">${totalReceivableUSD.toFixed(2)}</span>
             <p className="text-emerald-400 font-black text-xl mt-2 flex items-center justify-center md:justify-end gap-2">
               <Globe size={20} /> Bs. {(totalReceivableUSD * rate).toLocaleString()}
             </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center px-4">
        <h2 className="text-2xl font-black text-gray-900">Control de Fiado</h2>
        <button onClick={() => setIsModalOpen(true)} className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3"><Plus size={24} /> Registrar Deudor</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {debtors.map(d => (
          <div key={d.id} className="bg-white rounded-[3rem] border border-gray-100 shadow-sm transition-all flex flex-col overflow-hidden group">
            <div className="p-8 pb-6">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-orange-50 p-4 rounded-2xl text-orange-600"><UserCheck size={28} /></div>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${d.totalDebtUSD > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {d.totalDebtUSD > 0 ? 'Pendiente' : 'Solvente'}
                </span>
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">{d.name}</h3>
              <p className="text-gray-400 text-sm font-bold mt-2 flex items-center gap-2"><Phone size={16} /> {d.contact}</p>
              
              <div className="mt-6 space-y-3">
                 <div className="flex items-center gap-3 text-[11px] font-black text-gray-500 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100">
                    <Calendar size={16} className="text-orange-500" />
                    <span>Promesa: {d.paymentDates || 'Sin fecha'}</span>
                 </div>
              </div>

              <div className="mt-8 p-6 bg-gray-900 rounded-[2rem] text-white">
                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Monto por Cobrar</p>
                <p className="text-3xl font-black">${d.totalDebtUSD.toFixed(2)}</p>
                <p className="text-[10px] font-black text-emerald-400 mt-1 uppercase">Bs. {(d.totalDebtUSD * rate).toLocaleString()}</p>
              </div>
            </div>

            <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 mt-auto">
              <button onClick={() => setPaymentModal(d.id)} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                <DollarSign size={18} /> Cobrar Abono
              </button>
              <button onClick={() => setViewingAbonos(d.id)} className="w-full mt-3 py-3 border border-gray-200 text-gray-400 font-black text-[10px] uppercase hover:bg-white">Ver Historial</button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-md p-8 shadow-2xl">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black">Nuevo Deudor</h3>
                <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
             </div>
             <div className="space-y-4">
                <input value={newDebtorData.name} onChange={(e) => setNewDebtorData({...newDebtorData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold" placeholder="Nombre completo" />
                <input value={newDebtorData.contact} onChange={(e) => setNewDebtorData({...newDebtorData, contact: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold" placeholder="Teléfono" />
                <div className="grid grid-cols-2 gap-4">
                   <input type="number" step="0.01" value={newDebtorData.totalDebtUSD || ""} onChange={(e) => setNewDebtorData({...newDebtorData, totalDebtUSD: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold" placeholder="Deuda Inicial $" />
                   <input value={newDebtorData.paymentDates} onChange={(e) => setNewDebtorData({...newDebtorData, paymentDates: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold" placeholder="Fecha Promesa" />
                </div>
                <textarea value={newDebtorData.description} onChange={(e) => setNewDebtorData({...newDebtorData, description: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold h-24" placeholder="¿Qué mercancía se llevó?"></textarea>
                <button onClick={handleAddDebtorSubmit} className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black shadow-xl">Guardar Deudor</button>
             </div>
           </div>
        </div>
      )}

      {paymentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-sm p-8 shadow-2xl">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black">Registrar Cobro</h3>
                <button onClick={() => setPaymentModal(null)}><X size={24} /></button>
             </div>
             <div className="space-y-4">
                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                  <button onClick={() => setPaymentData({...paymentData, currency: 'USD'})} className={`flex-1 py-2 rounded-lg font-black text-xs ${paymentData.currency === 'USD' ? 'bg-white text-emerald-600' : 'text-gray-400'}`}>USD</button>
                  <button onClick={() => setPaymentData({...paymentData, currency: 'VES'})} className={`flex-1 py-2 rounded-lg font-black text-xs ${paymentData.currency === 'VES' ? 'bg-white text-blue-600' : 'text-gray-400'}`}>BS</button>
                </div>
                <input type="number" step="0.01" value={paymentData.amount || ""} onChange={(e) => setPaymentData({...paymentData, amount: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-black text-xl" placeholder="Monto" />
                {paymentData.currency === 'VES' && <input type="number" step="0.01" value={paymentData.customRate} onChange={(e) => setPaymentData({...paymentData, customRate: Number(e.target.value)})} className="w-full bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 font-black" placeholder="Tasa de cambio" />}
                <select value={paymentData.method} onChange={(e) => setPaymentData({...paymentData, method: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-black">
                  <option value="Efectivo">Efectivo</option>
                  <option value="Pago Movil">Pago Móvil</option>
                  <option value="Punto">Punto de Venta</option>
                  <option value="Dolares">Dólares Cash</option>
                </select>
                <button onClick={handlePayment} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black shadow-xl">Confirmar Cobro</button>
             </div>
           </div>
        </div>
      )}

      {viewingAbonos && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl">
             <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black">Abonos Recibidos</h3><button onClick={() => setViewingAbonos(null)}><X size={24} /></button></div>
             <div className="space-y-3 max-h-96 overflow-y-auto no-scrollbar">
               {debtors.find(d => d.id === viewingAbonos)?.abonos.map(abono => (
                 <div key={abono.id} className="p-5 bg-gray-50 rounded-2xl flex justify-between items-center border border-gray-100">
                    <div><p className="font-black text-lg">${abono.amount.toFixed(2)}</p><p className="text-[10px] text-gray-400 font-bold uppercase">{abono.method} • {new Date(abono.date).toLocaleDateString()}</p></div>
                    <CheckCircle className="text-emerald-500" size={24} />
                 </div>
               ))}
               {debtors.find(d => d.id === viewingAbonos)?.abonos.length === 0 && <p className="text-center py-10 text-gray-400 italic">No hay registros.</p>}
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Debtors;
