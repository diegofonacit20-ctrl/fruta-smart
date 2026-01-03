
import React, { useState, useMemo } from 'react';
import { Users, Phone, Plus, History, ShoppingCart, DollarSign, X, Calendar, Wallet, Globe, Save, Trash2, Layers } from 'lucide-react';
import { Supplier, Product, Category } from '../types';

interface SuppliersProps {
  suppliers: Supplier[];
  products: Product[];
  rate: number;
  onAddSupplier: (s: Omit<Supplier, 'id' | 'abonos' | 'orders'>) => void;
  onAddPayment: (supplierId: string, amountUSD: number, method: string, customRate: number) => void;
  onAddOrder: (pur: any) => void;
}

const Suppliers: React.FC<SuppliersProps> = ({ suppliers, products, rate, onAddSupplier, onAddPayment, onAddOrder }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Fixed: Added totalDebtUSD to match the required properties of Omit<Supplier, 'id' | 'abonos' | 'orders'>
  const [newSupData, setNewSupData] = useState({ name: '', contact: '', category: 'Otros' as Category, totalDebtUSD: 0 });
  
  const [paymentModal, setPaymentModal] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState({ amount: 0, method: 'Efectivo', currency: 'USD', customRate: rate });
  
  const [purchaseModal, setPurchaseModal] = useState<string | null>(null);
  const [purchaseItems, setPurchaseItems] = useState<any[]>([{ productName: '', quantity: 0, costUSD: 0, costVES: 0 }]);
  const [isPurchasePaid, setIsPurchasePaid] = useState(true);

  const [viewingOrders, setViewingOrders] = useState<string | null>(null);

  const totalGlobalDebtUSD = useMemo(() => suppliers.reduce((sum, s) => sum + s.totalDebtUSD, 0), [suppliers]);

  const handleAddSupplierSubmit = () => {
    if (!newSupData.name) return;
    onAddSupplier(newSupData);
    setIsModalOpen(false);
    // Fixed: Reset state with totalDebtUSD
    setNewSupData({ name: '', contact: '', category: 'Otros', totalDebtUSD: 0 });
  };

  const handlePayment = () => {
    if (!paymentModal || paymentData.amount <= 0) return;
    const amountUSD = paymentData.currency === 'USD' ? paymentData.amount : paymentData.amount / paymentData.customRate;
    onAddPayment(paymentModal, amountUSD, paymentData.method, paymentData.customRate);
    setPaymentModal(null);
    setPaymentData({ amount: 0, method: 'Efectivo', currency: 'USD', customRate: rate });
  };

  const handlePurchaseSubmit = () => {
    if (!purchaseModal || purchaseItems.some(i => !i.productName || i.quantity <= 0)) {
      alert("Completa todos los campos de los productos.");
      return;
    }
    const totalUSD = purchaseItems.reduce((acc, curr) => acc + (curr.quantity * curr.costUSD), 0);
    const orderPayload = {
      supplierId: purchaseModal,
      isPaid: isPurchasePaid,
      totalCostUSD: totalUSD,
      items: purchaseItems.map(i => ({
        productName: i.productName,
        quantity: i.quantity,
        unit: products.find(p => p.name === i.productName)?.unit || 'kg',
        costPerUnitUSD: i.costUSD
      }))
    };
    onAddOrder(orderPayload);
    setPurchaseModal(null);
    setPurchaseItems([{ productName: '', quantity: 0, costUSD: 0, costVES: 0 }]);
    alert("Carga de mercancía procesada con éxito.");
  };

  const updatePurchaseItem = (index: number, updates: any) => {
    const newItems = [...purchaseItems];
    const item = { ...newItems[index], ...updates };
    
    if ('costUSD' in updates) item.costVES = updates.costUSD * rate;
    if ('costVES' in updates) item.costUSD = updates.costVES / rate;
    
    newItems[index] = item;
    setPurchaseItems(newItems);
  };

  return (
    <div className="space-y-8">
      <div className="bg-gray-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden border-4 border-red-500/10">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
             <div className="bg-red-500/20 p-5 rounded-[2.5rem] border border-red-500/30"><Wallet className="text-red-400" size={40} /></div>
             <div>
               <h2 className="text-3xl font-black tracking-tight">Cuentas por Pagar</h2>
               <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Total adeudado a proveedores</p>
             </div>
          </div>
          <div className="text-center md:text-right">
             <span className="text-6xl font-black text-white tracking-tighter">${totalGlobalDebtUSD.toFixed(2)}</span>
             <p className="text-emerald-400 font-black text-xl mt-2 flex items-center justify-center md:justify-end gap-2">
               <Globe size={20} /> Bs. {(totalGlobalDebtUSD * rate).toLocaleString()}
             </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center px-4">
        <h2 className="text-2xl font-black text-gray-900">Proveedores Registrados</h2>
        <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-lg shadow-emerald-100"><Plus size={24} /> Nuevo Proveedor</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {suppliers.map(s => (
          <div key={s.id} className="bg-white rounded-[3rem] border border-gray-100 shadow-sm transition-all flex flex-col overflow-hidden group hover:shadow-xl">
            <div className="p-8 pb-6">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600"><Users size={28} /></div>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${s.totalDebtUSD > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {s.totalDebtUSD > 0 ? 'Pendiente' : 'Solvente'}
                </span>
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">{s.name}</h3>
              <p className="text-gray-400 text-sm font-bold flex items-center gap-2 mt-2"><Phone size={16} className="text-emerald-500" /> {s.contact}</p>
              
              <div className="mt-8 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Saldo Deudor</p>
                <p className={`text-3xl font-black ${s.totalDebtUSD > 0 ? 'text-red-600' : 'text-emerald-600'}`}>${s.totalDebtUSD.toFixed(2)}</p>
                <p className="text-[10px] font-black text-gray-400 mt-1 uppercase">≈ Bs. {(s.totalDebtUSD * rate).toLocaleString()}</p>
              </div>
            </div>

            <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 mt-auto">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setPurchaseModal(s.id)} className="bg-blue-600 text-white py-4 rounded-2xl font-black text-xs hover:bg-blue-700 flex items-center justify-center gap-2 transition-all shadow-md">
                  <ShoppingCart size={16} /> Cargar
                </button>
                <button onClick={() => setPaymentModal(s.id)} className="bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs hover:bg-emerald-700 flex items-center justify-center gap-2 transition-all shadow-md">
                  <DollarSign size={16} /> Abonar
                </button>
              </div>
              <button onClick={() => setViewingOrders(s.id)} className="w-full mt-3 py-3 border border-gray-200 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-gray-900 rounded-xl transition-all">Ver Movimientos</button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL NUEVO PROVEEDOR */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-2xl font-black text-gray-900">Nuevo Proveedor</h3>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={24}/></button>
              </div>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-1">Nombre o Empresa</label>
                    <input value={newSupData.name} onChange={e => setNewSupData({...newSupData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold" placeholder="Ej: Distribuidora Los Andes" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-1">Teléfono / Contacto</label>
                    <input value={newSupData.contact} onChange={e => setNewSupData({...newSupData, contact: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold" placeholder="0412-0000000" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-1">Rubro Principal</label>
                    <select value={newSupData.category} onChange={e => setNewSupData({...newSupData, category: e.target.value as Category})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold">
                       <option value="Fruta">Frutas</option>
                       <option value="Verdura">Verduras</option>
                       <option value="Hortaliza">Hortalizas</option>
                       <option value="Otros">Otros</option>
                    </select>
                 </div>
                 <button onClick={handleAddSupplierSubmit} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-emerald-100 mt-4 uppercase">Registrar Proveedor</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL CARGA MERCANCÍA */}
      {purchaseModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center mb-8">
                 <div className="flex items-center gap-3">
                    <ShoppingCart className="text-blue-600" size={28}/>
                    <h3 className="text-2xl font-black">Cargar Mercancía</h3>
                 </div>
                 <button onClick={() => setPurchaseModal(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={24}/></button>
              </div>

              <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 mb-8 flex justify-between items-center">
                 <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Proveedor Seleccionado</p>
                    <p className="text-lg font-black">{suppliers.find(s => s.id === purchaseModal)?.name}</p>
                 </div>
                 <div className="flex gap-2 p-1 bg-white rounded-2xl border border-blue-100">
                    <button onClick={() => setIsPurchasePaid(true)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase ${isPurchasePaid ? 'bg-blue-600 text-white' : 'text-blue-400'}`}>Contado</button>
                    <button onClick={() => setIsPurchasePaid(false)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase ${!isPurchasePaid ? 'bg-orange-600 text-white' : 'text-orange-400'}`}>Crédito</button>
                 </div>
              </div>

              <div className="space-y-4">
                 {purchaseItems.map((item, idx) => (
                    <div key={idx} className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 relative group">
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="md:col-span-2">
                             <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Producto</label>
                             <select value={item.productName} onChange={e => updatePurchaseItem(idx, { productName: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-bold">
                                <option value="">Seleccionar...</option>
                                {products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                             </select>
                          </div>
                          <div>
                             <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Cantidad (Kg/Unid)</label>
                             <input type="number" value={item.quantity || ""} onChange={e => updatePurchaseItem(idx, { quantity: Number(e.target.value) })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-bold" placeholder="0" />
                          </div>
                          <div>
                             <label className="text-[9px] font-black text-blue-600 uppercase block mb-1">Costo Unit ($)</label>
                             <input type="number" step="0.01" value={item.costUSD || ""} onChange={e => updatePurchaseItem(idx, { costUSD: Number(e.target.value) })} className="w-full bg-white border-2 border-blue-100 rounded-xl px-4 py-3 font-black text-blue-600" placeholder="0.00" />
                          </div>
                          <div className="md:col-span-1 lg:col-span-1">
                             <label className="text-[9px] font-black text-emerald-600 uppercase block mb-1">Costo Unit (Bs)</label>
                             <input type="number" step="0.01" value={item.costVES || ""} onChange={e => updatePurchaseItem(idx, { costVES: Number(e.target.value) })} className="w-full bg-emerald-50 border-2 border-emerald-100 rounded-xl px-4 py-3 font-black text-emerald-700" placeholder="0.00" />
                          </div>
                       </div>
                       {purchaseItems.length > 1 && (
                         <button onClick={() => setPurchaseItems(purchaseItems.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 bg-white border border-red-100 text-red-500 p-2 rounded-xl shadow-sm hover:bg-red-50 transition-colors"><Trash2 size={16}/></button>
                       )}
                    </div>
                 ))}
                 <button onClick={() => setPurchaseItems([...purchaseItems, { productName: '', quantity: 0, costUSD: 0, costVES: 0 }])} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-[2rem] text-gray-400 font-black text-xs uppercase hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                    <Plus size={16}/> Añadir otro ítem
                 </button>
              </div>

              <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between">
                 <div className="bg-gray-900 text-white px-8 py-4 rounded-[1.5rem] shadow-xl">
                    <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Total Inversión</p>
                    <p className="text-3xl font-black">${purchaseItems.reduce((acc, curr) => acc + (curr.quantity * curr.costUSD), 0).toFixed(2)}</p>
                 </div>
                 <button onClick={handlePurchaseSubmit} className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black shadow-xl shadow-blue-100 uppercase flex items-center gap-3">
                    <Save size={24}/> Guardar Factura
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL PAGO (ABONO) */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
           <div className="bg-white rounded-[3rem] w-full max-sm p-10 shadow-2xl">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-900">Registrar Pago</h3>
                <button onClick={() => setPaymentModal(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={24} /></button>
             </div>
             <div className="space-y-4">
                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                  <button onClick={() => setPaymentData({...paymentData, currency: 'USD'})} className={`flex-1 py-2 rounded-lg font-black text-xs ${paymentData.currency === 'USD' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}>USD</button>
                  <button onClick={() => setPaymentData({...paymentData, currency: 'VES'})} className={`flex-1 py-2 rounded-lg font-black text-xs ${paymentData.currency === 'VES' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>BS</button>
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Monto a pagar</label>
                   <input type="number" step="0.01" value={paymentData.amount || ""} onChange={(e) => setPaymentData({...paymentData, amount: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-black text-xl" placeholder="0.00" />
                </div>
                {paymentData.currency === 'VES' && (
                  <div>
                     <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Tasa de Cambio (Bs/$)</label>
                     <input type="number" step="0.01" value={paymentData.customRate} onChange={(e) => setPaymentData({...paymentData, customRate: Number(e.target.value)})} className="w-full bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 font-black" />
                  </div>
                )}
                <div>
                   <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Vía de Pago</label>
                   <select value={paymentData.method} onChange={(e) => setPaymentData({...paymentData, method: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-black">
                     <option value="Efectivo">Bolívares Efectivo</option>
                     <option value="Dolares">Dólares Cash</option>
                     <option value="Pago Movil">Pago Móvil</option>
                     <option value="Transferencia">Transferencia</option>
                   </select>
                </div>
                <button onClick={handlePayment} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-emerald-100 mt-4 uppercase">Confirmar Abono</button>
             </div>
           </div>
        </div>
      )}

      {/* MODAL HISTORIAL */}
      {viewingOrders && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 shadow-2xl animate-in zoom-in">
             <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                   <Layers className="text-gray-900" size={28}/>
                   <h3 className="text-2xl font-black">Historial: {suppliers.find(s => s.id === viewingOrders)?.name}</h3>
                </div>
                <button onClick={() => setViewingOrders(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={24} /></button>
             </div>
             <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
               <section>
                  <p className="text-[10px] font-black uppercase text-emerald-600 border-b-2 border-emerald-50 pb-2 tracking-widest mb-4">Pagos y Abonos</p>
                  <div className="space-y-3">
                    {suppliers.find(s => s.id === viewingOrders)?.abonos?.map(ab => (
                      <div key={ab.id} className="flex justify-between items-center bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50">
                        <div>
                           <p className="font-black text-emerald-900">${ab.amount.toFixed(2)}</p>
                           <p className="text-[10px] text-gray-500 font-bold uppercase">{new Date(ab.date).toLocaleDateString()} • {ab.method}</p>
                        </div>
                        <DollarSign className="text-emerald-400" size={20}/>
                      </div>
                    ))}
                    {(!suppliers.find(s => s.id === viewingOrders)?.abonos || suppliers.find(s => s.id === viewingOrders)?.abonos.length === 0) && <p className="text-center text-gray-300 italic py-4">No hay pagos registrados.</p>}
                  </div>
               </section>

               <section>
                  <p className="text-[10px] font-black uppercase text-blue-600 border-b-2 border-blue-50 pb-2 tracking-widest mb-4">Entradas de Mercancía</p>
                  <div className="space-y-3">
                    {suppliers.find(s => s.id === viewingOrders)?.orders?.map(order => (
                      <div key={order.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 group transition-all">
                         <div className="flex justify-between mb-3">
                            <span className="text-xs font-black text-gray-400 uppercase">{new Date(order.date).toLocaleDateString()}</span>
                            <span className="font-black text-blue-600 text-lg">${order.totalCostUSD.toFixed(2)}</span>
                         </div>
                         <div className="flex flex-wrap gap-2">
                            {order.items.map((it, idx) => (
                               <span key={idx} className="bg-white px-3 py-1 rounded-lg border border-gray-100 text-[10px] font-bold text-gray-600">
                                  {it.productName}: {it.quantity} {it.unit}
                               </span>
                            ))}
                         </div>
                      </div>
                    ))}
                    {(!suppliers.find(s => s.id === viewingOrders)?.orders || suppliers.find(s => s.id === viewingOrders)?.orders.length === 0) && <p className="text-center text-gray-300 italic py-4">No hay compras registradas.</p>}
                  </div>
               </section>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
