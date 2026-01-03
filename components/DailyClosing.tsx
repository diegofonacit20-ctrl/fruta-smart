
import React, { useState, useMemo, useRef } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  X,
  Search,
  Zap,
  Truck,
  Save,
  Download,
  CreditCard,
  Calculator,
  ShoppingCart,
  PlusCircle,
  History as HistoryIcon
} from 'lucide-react';
import { Product, DailySummary, SaleEntry, Debtor, Supplier, CardType, PaymentMethod } from '../types';

interface DailyClosingProps {
  products: Product[];
  debtors: Debtor[];
  suppliers: Supplier[];
  rate: number;
  onConfirmClosing: (summary: Omit<DailySummary, 'id'>, purchases: any[]) => void;
  onQuickPurchase: (pur: any) => void;
  onRegisterSale: (saleGroup: any) => void;
}

interface SaleGroup {
  id: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPriceUSD: number;
    unit: string;
  }[];
  paymentMethod: PaymentMethod | 'Credito';
  cardType?: CardType;
  amountVES?: number;
  debtorId?: string;
  totalUSD: number;
  timestamp: string;
}

const DailyClosing: React.FC<DailyClosingProps> = ({ products, debtors, suppliers, rate, onConfirmClosing, onQuickPurchase, onRegisterSale }) => {
  const [recordedSales, setRecordedSales] = useState<SaleGroup[]>([]);
  const [activeSale, setActiveSale] = useState<SaleGroup | null>(null);
  const [purchases, setPurchases] = useState<any[]>([]); 
  const [merma, setMerma] = useState(0);
  const [gastos, setGastos] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [finalSummary, setFinalSummary] = useState<Omit<DailySummary, 'id'> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState<'ventas' | 'compras'>('ventas');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredProductOptions = useMemo(() => {
    if (!searchTerm) return [];
    return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5);
  }, [products, searchTerm]);

  const dayTotals = useMemo(() => {
    let efectivo = 0, punto = 0, pagoMovil = 0, dolares = 0, commissions = 0;
    recordedSales.forEach(sale => {
      const saleUSD = sale.totalUSD;
      const saleVES = sale.amountVES || (saleUSD * rate);
      if (sale.paymentMethod === 'Efectivo') efectivo += saleVES;
      else if (sale.paymentMethod === 'Punto') {
        punto += saleVES;
        const commRate = sale.cardType === 'Credito' ? 0.10 : 0.05;
        commissions += (saleUSD * commRate);
      }
      else if (sale.paymentMethod === 'Pago Movil') pagoMovil += saleVES;
      else if (sale.paymentMethod === 'Dolares') dolares += saleUSD;
    });
    const totalUSD = dolares + (efectivo + punto + pagoMovil) / rate;
    return { efectivo, punto, pagoMovil, dolares, totalUSD, commissions };
  }, [recordedSales, rate]);

  const startOrAddToSale = (pId: string) => {
    const product = products.find(p => p.id === pId);
    if (!product) return;
    const newItem = { productId: pId, productName: product.name, quantity: 1, unitPriceUSD: product.sellingPrice, unit: product.unit };
    if (!activeSale) {
      setActiveSale({
        id: Math.random().toString(36).substr(2, 9),
        items: [newItem],
        paymentMethod: 'Dolares',
        cardType: 'Debito',
        totalUSD: product.sellingPrice,
        timestamp: new Date().toISOString()
      });
    } else {
      const updatedItems = [...activeSale.items, newItem];
      const newTotalUSD = updatedItems.reduce((acc, curr) => acc + (curr.quantity * curr.unitPriceUSD), 0);
      setActiveSale({ ...activeSale, items: updatedItems, totalUSD: newTotalUSD, amountVES: newTotalUSD * rate });
    }
    setSearchTerm('');
  };

  const updateActiveItemQty = (index: number, qty: number) => {
    if (!activeSale) return;
    const newItems = [...activeSale.items];
    newItems[index].quantity = qty;
    const newTotalUSD = newItems.reduce((acc, curr) => acc + (curr.quantity * curr.unitPriceUSD), 0);
    setActiveSale({ ...activeSale, items: newItems, totalUSD: newTotalUSD, amountVES: newTotalUSD * rate });
  };

  const removeActiveItem = (index: number) => {
    if (!activeSale) return;
    const newItems = activeSale.items.filter((_, i) => i !== index);
    if (newItems.length === 0) { setActiveSale(null); return; }
    const newTotalUSD = newItems.reduce((acc, curr) => acc + (curr.quantity * curr.unitPriceUSD), 0);
    setActiveSale({ ...activeSale, items: newItems, totalUSD: newTotalUSD, amountVES: newTotalUSD * rate });
  };

  const processSale = () => {
    if (!activeSale) return;
    // Registro inmediato en el estado global (Dashboard e Inventario)
    onRegisterSale(activeSale);
    // Registro en la lista visual local de hoy
    setRecordedSales([activeSale, ...recordedSales]);
    setActiveSale(null);
    alert("Venta procesada y reflejada en el tablero.");
  };

  const handleConfirmClosing = () => {
    const flatSales: SaleEntry[] = recordedSales.flatMap(group => 
      group.items.map(item => ({
        id: group.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        paymentMethod: group.paymentMethod,
        cardType: group.cardType,
        amountUSD: item.quantity * item.unitPriceUSD,
        referenceAmountUSD: item.quantity * item.unitPriceUSD,
        amountVES: group.amountVES ? (item.quantity * item.unitPriceUSD / group.totalUSD) * group.amountVES : undefined
      }))
    );
    const summary: Omit<DailySummary, 'id'> = {
      date: new Date().toISOString(),
      efectivoVES: dayTotals.efectivo,
      puntoVES: dayTotals.punto,
      pagoMovilVES: dayTotals.pagoMovil,
      dolaresUSD: dayTotals.dolares,
      mermaUSD: merma,
      gastosUSD: gastos,
      commissionsUSD: dayTotals.commissions,
      totalDayUSD: dayTotals.totalUSD,
      salesDetail: flatSales
    };
    setFinalSummary(summary);
    setShowReceipt(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex gap-4 mb-4">
        <button onClick={() => setActiveView('ventas')} className={`flex-1 py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all ${activeView === 'ventas' ? 'bg-emerald-600 text-white shadow-xl scale-[1.01]' : 'bg-white text-gray-400 border border-gray-100'}`}>
          <ShoppingBag size={20} /> Registrar Venta
        </button>
        <button onClick={() => setActiveView('compras')} className={`flex-1 py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all ${activeView === 'compras' ? 'bg-blue-600 text-white shadow-xl scale-[1.01]' : 'bg-white text-gray-400 border border-gray-100'}`}>
          <Truck size={20} /> Compras Inventario
        </button>
      </div>

      {activeView === 'ventas' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
              <div className="relative w-full">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                <input ref={searchInputRef} type="text" placeholder="Busca producto..." className="w-full pl-16 pr-8 py-7 bg-gray-50 rounded-[2.5rem] font-black text-xl outline-none focus:ring-4 focus:ring-emerald-500/20" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                {filteredProductOptions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[2rem] shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {filteredProductOptions.map(p => (
                      <button key={p.id} onClick={() => startOrAddToSale(p.id)} className="w-full px-10 py-6 text-left hover:bg-emerald-50 flex items-center justify-between border-b border-gray-50 group">
                        <div>
                          <p className="font-black text-gray-900 group-hover:text-emerald-700 text-lg">{p.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Stock: {p.stock.toFixed(2)} {p.unit} • Ref: ${p.sellingPrice.toFixed(2)}</p>
                        </div>
                        <PlusCircle size={32} className="text-emerald-200 group-hover:text-emerald-500 transition-all" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {activeSale ? (
              <div className="bg-white rounded-[3rem] shadow-2xl border-4 border-emerald-500/20 overflow-hidden animate-in slide-in-from-bottom-6">
                <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
                  <div className="flex items-center gap-3"><ShoppingCart size={24} /><h3 className="text-xl font-black">Cuadro de Venta Activa</h3></div>
                  <button onClick={() => setActiveSale(null)} className="hover:bg-white/20 p-2 rounded-full"><X size={24} /></button>
                </div>
                <div className="p-8 space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                  {activeSale.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-6 rounded-[2rem] border border-gray-100 group">
                      <div className="flex-1"><p className="font-black text-gray-900 text-lg">{item.productName}</p><p className="text-[10px] text-gray-400 font-bold uppercase">Ref: ${item.unitPriceUSD.toFixed(2)}</p></div>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-3 py-1 shadow-sm">
                          <input type="number" step="0.1" value={item.quantity} onChange={(e) => updateActiveItemQty(idx, Number(e.target.value))} className="w-16 bg-transparent text-center font-black py-2 outline-none text-emerald-700 text-lg" />
                          <span className="text-[10px] font-black text-gray-400 uppercase pr-1">{item.unit}</span>
                        </div>
                        <p className="font-black text-gray-900 text-lg min-w-[80px] text-right">${(item.quantity * item.unitPriceUSD).toFixed(2)}</p>
                        <button onClick={() => removeActiveItem(idx)} className="text-gray-300 hover:text-red-500 p-2"><Trash2 size={24} /></button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => { setSearchTerm(''); searchInputRef.current?.focus(); }} className="w-full py-6 border-4 border-dashed border-gray-100 rounded-[2.5rem] flex items-center justify-center gap-4 text-gray-300 hover:text-emerald-500 hover:border-emerald-200 transition-all group mt-4"><Plus size={32} /><span className="font-black text-xl uppercase">Añadir otro producto</span></button>
                </div>
                <div className="p-8 bg-gray-50 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Método de Pago</label>
                      <select value={activeSale.paymentMethod} onChange={(e) => setActiveSale({...activeSale, paymentMethod: e.target.value as any})} className="w-full bg-white border-2 border-gray-100 rounded-2xl px-6 py-4 font-black">
                        <option value="Dolares">Dólares $</option><option value="Efectivo">Efectivo Bs</option><option value="Punto">Punto Bs</option><option value="Pago Movil">Pago Móvil</option><option value="Credito">Fiado (Anotar)</option>
                      </select>
                    </div>
                    {activeSale.paymentMethod === 'Punto' && (
                      <div className="animate-in zoom-in">
                        <label className="text-[10px] font-black text-blue-500 uppercase block mb-2">Tarjeta</label>
                        <select value={activeSale.cardType} onChange={(e) => setActiveSale({...activeSale, cardType: e.target.value as CardType})} className="w-full bg-blue-50 border-2 border-blue-200 rounded-2xl px-6 py-4 font-black text-blue-700">
                          <option value="Debito">Débito (5%)</option><option value="Credito">Crédito (10%)</option>
                        </select>
                      </div>
                    )}
                    {activeSale.paymentMethod === 'Credito' && (
                      <div className="animate-in zoom-in">
                        <label className="text-[10px] font-black text-orange-500 uppercase block mb-2">Deudor</label>
                        <select value={activeSale.debtorId} onChange={(e) => setActiveSale({...activeSale, debtorId: e.target.value})} className="w-full bg-orange-50 border-2 border-orange-200 rounded-2xl px-6 py-4 font-black text-orange-700">
                          <option value="">¿Quién debe?</option>
                          {debtors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                    )}
                    {['Efectivo', 'Punto', 'Pago Movil'].includes(activeSale.paymentMethod) && (
                      <div className="animate-in zoom-in">
                        <label className="text-[10px] font-black text-emerald-600 uppercase block mb-2">Cobrado Bs.</label>
                        <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-emerald-400">Bs.</span>
                           <input type="number" value={activeSale.amountVES || ""} placeholder={(activeSale.totalUSD * rate).toFixed(2)} onChange={(e) => setActiveSale({...activeSale, amountVES: Number(e.target.value)})} className="w-full bg-white border-2 border-emerald-200 rounded-2xl pl-12 pr-6 py-4 font-black text-emerald-700 outline-none" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6"><div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Cobro</p><p className="text-5xl font-black text-gray-900">${activeSale.totalUSD.toFixed(2)}</p></div><div className="h-12 w-[2px] bg-gray-200"></div><div><p className="text-[10px] font-black text-emerald-500 uppercase mb-1">Ref. BCV</p><p className="text-2xl font-black text-emerald-600">Bs. {(activeSale.totalUSD * rate).toLocaleString()}</p></div></div>
                    <button onClick={processSale} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-6 rounded-[2.5rem] font-black text-2xl shadow-xl active:scale-95 transition-all"><CheckCircle2 size={32} className="inline mr-3"/> Registrar Pago</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border-4 border-dashed border-gray-200 rounded-[3rem] p-24 text-center">
                 <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"><Plus size={48} className="text-gray-200" /></div>
                 <h4 className="text-2xl font-black text-gray-300">Usa el buscador para iniciar la venta</h4>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col">
              <div className="flex items-center gap-3 mb-6"><HistoryIcon className="text-emerald-500" size={20}/><h3 className="text-lg font-black text-gray-900">Historial Reciente (Hoy)</h3></div>
              <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar">
                {recordedSales.map((sale, i) => (
                  <div key={sale.id} className="bg-gray-50 p-6 rounded-3xl border border-gray-100 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2"><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">#V{recordedSales.length - i}</span><span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${sale.paymentMethod === 'Credito' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>{sale.paymentMethod}</span></div>
                    <div className="space-y-1 mb-3">{sale.items.map((it, idx) => (<p key={idx} className="text-xs font-bold text-gray-700 flex justify-between"><span>{it.quantity} {it.unit} {it.productName}</span><span className="text-gray-400">${(it.quantity * it.unitPriceUSD).toFixed(2)}</span></p>))}</div>
                    <p className="text-lg font-black text-gray-900 pt-2 border-t">${sale.totalUSD.toFixed(2)}</p>
                  </div>
                ))}
                {recordedSales.length === 0 && <p className="text-center py-10 text-gray-300 italic font-bold">Sin ventas procesadas.</p>}
              </div>
            </div>
            <div className="bg-gray-900 rounded-[3rem] p-10 text-white border-4 border-emerald-500/10">
               <p className="text-xs text-emerald-400 font-black uppercase tracking-widest mb-2">Ingresos Brutos Hoy</p>
               <p className="text-6xl font-black tracking-tighter leading-none">${dayTotals.totalUSD.toFixed(2)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
           <div className="flex justify-between items-center bg-blue-50/50 p-6 rounded-[2.5rem] border border-blue-100">
             <div className="flex items-center gap-4"><Truck className="text-blue-600" size={32} /><h3 className="text-2xl font-black text-blue-900">Mercancía de Proveedores</h3></div>
             <button onClick={() => setPurchases([...purchases, { id: Math.random().toString(36).substr(2, 9), supplierId: '', isPaid: true, items: [{ productName: '', quantity: 1, unit: 'kg', costPerUnitUSD: 0, totalKg: 1 }], totalCostUSD: 0 }])} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-lg active:scale-95 transition-all"><Plus size={24} /> Nueva Carga</button>
          </div>
          {purchases.map((purchase) => (
            <div key={purchase.id} className="p-10 bg-white rounded-[3rem] border-2 border-gray-100 shadow-xl space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div><label className="text-[11px] font-black text-gray-400 uppercase block mb-2">Proveedor</label><select value={purchase.supplierId} onChange={(e) => setPurchases(purchases.map(p => p.id === purchase.id ? { ...p, supplierId: e.target.value } : p))} className="w-full bg-gray-50 border-2 border-gray-100 rounded-3xl px-6 py-4 font-black">{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                 <div className="flex gap-2 p-2 bg-gray-100 rounded-[2rem] self-end"><button onClick={() => setPurchases(purchases.map(p => p.id === purchase.id ? { ...p, isPaid: true } : p))} className={`flex-1 py-3 rounded-[1.5rem] font-black text-xs uppercase ${purchase.isPaid ? 'bg-white shadow-md text-emerald-600' : 'text-gray-400'}`}>Contado</button><button onClick={() => setPurchases(purchases.map(p => p.id === purchase.id ? { ...p, isPaid: false } : p))} className={`flex-1 py-3 rounded-[1.5rem] font-black text-xs uppercase ${!purchase.isPaid ? 'bg-white shadow-md text-orange-600' : 'text-gray-400'}`}>Crédito</button></div>
              </div>
              <div className="space-y-4">{purchase.items.map((item: any, i: number) => (
                <div key={i} className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-6"><div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end"><div className="md:col-span-4"><label className="text-[10px] font-black text-gray-500 uppercase block mb-2">Producto</label><select value={item.productName} onChange={(e) => { const newItems = [...purchase.items]; newItems[i].productName = e.target.value; setPurchases(purchases.map(p => p.id === purchase.id ? { ...p, items: newItems } : p)); }} className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 font-black">{products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div><div className="md:col-span-3"><label className="text-[10px] font-black text-gray-500 uppercase block mb-2">Cantidad Total</label><input type="number" step="0.1" value={item.totalKg} onChange={(e) => { const newItems = [...purchase.items]; newItems[i].totalKg = Number(e.target.value); setPurchases(purchases.map(p => p.id === purchase.id ? { ...p, items: newItems, totalCostUSD: newItems.reduce((acc, curr) => acc + (curr.totalKg * curr.costPerUnitUSD), 0) } : p)); }} className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 font-black" /></div><div className="md:col-span-3"><label className="text-[10px] font-black text-blue-500 uppercase block mb-2">Costo ($)</label><input type="number" step="0.01" value={item.costPerUnitUSD} onChange={(e) => { const newItems = [...purchase.items]; newItems[i].costPerUnitUSD = Number(e.target.value); setPurchases(purchases.map(p => p.id === purchase.id ? { ...p, items: newItems, totalCostUSD: newItems.reduce((acc, curr) => acc + (curr.totalKg * curr.costPerUnitUSD), 0) } : p)); }} className="w-full bg-white border-2 border-blue-200 rounded-2xl px-6 py-4 font-black text-blue-600" /></div><div className="md:col-span-2 text-right"><button onClick={() => { const newItems = purchase.items.filter((_: any, idx: number) => idx !== i); setPurchases(purchases.map(p => p.id === purchase.id ? { ...p, items: newItems, totalCostUSD: newItems.reduce((acc, curr) => acc + (curr.totalKg * curr.costPerUnitUSD), 0) } : p)); }} className="p-3 text-red-300"><Trash2 size={28}/></button></div></div></div>))}</div>
              <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center gap-10"><div className="bg-gray-900 text-white p-8 rounded-[2rem] px-12 shadow-xl"><p className="text-[9px] font-black text-gray-400 uppercase mb-1">Total Compra</p><p className="text-4xl font-black">${purchase.totalCostUSD.toFixed(2)}</p></div><button onClick={() => { onQuickPurchase(purchase); setPurchases(purchases.filter(p => p.id !== purchase.id)); alert("Mercancía cargada al inventario."); }} className="flex-1 bg-blue-600 text-white p-8 rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 shadow-xl active:scale-95 transition-all"><Save size={32} /> Registrar Compra</button></div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-10">
         <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100"><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Merma Diaria $</p><input type="number" step="0.01" value={merma || ""} onChange={(e) => setMerma(Number(e.target.value))} className="w-full bg-transparent text-xl font-black text-red-500 outline-none" placeholder="0.00" /></div>
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100"><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Gastos Diarios $</p><input type="number" step="0.01" value={gastos || ""} onChange={(e) => setGastos(Number(e.target.value))} className="w-full bg-transparent text-xl font-black text-orange-500 outline-none" placeholder="0.00" /></div>
            <div className="col-span-2 bg-emerald-50 p-6 rounded-3xl border border-emerald-100"><p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Total Ingresos Día ($)</p><p className="text-3xl font-black text-emerald-700">${dayTotals.totalUSD.toFixed(2)}</p></div>
         </div>
         <button onClick={handleConfirmClosing} className="w-full lg:w-auto bg-gray-900 text-white px-16 py-8 rounded-[2.5rem] font-black text-2xl shadow-2xl flex items-center justify-center gap-4 hover:bg-black active:scale-95 transition-all"><HistoryIcon size={32} /> Finalizar Jornada</button>
      </div>

      {showReceipt && finalSummary && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[4rem] w-full max-w-md my-auto flex flex-col overflow-hidden animate-in zoom-in shadow-2xl">
              <div className="p-10 border-b flex justify-between items-center bg-gray-50"><h3 className="text-2xl font-black text-gray-900">Reporte Diario</h3><button onClick={() => setShowReceipt(false)} className="p-3 text-gray-400"><X size={28} /></button></div>
              <div className="flex-1 overflow-y-auto p-12 bg-white font-mono text-[11px] text-gray-800 border-x border-gray-100">
                 <div className="text-center mb-10 space-y-2"><p className="text-4xl font-black uppercase">FrutaSmart</p><p className="font-bold border-y border-dashed py-3 border-gray-300">RESUMEN DE CIERRE</p><p className="pt-2">{new Date(finalSummary.date).toLocaleString('es-VE')}</p></div>
                 <div className="space-y-4 mb-10 text-right"><div className="flex justify-between"><span>BS EFECTIVO:</span> <span className="font-bold">{finalSummary.efectivoVES.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div><div className="flex justify-between"><span>BS PUNTO:</span> <span className="font-bold">{finalSummary.puntoVES.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div><div className="flex justify-between font-black border-t-2 border-dashed pt-4 text-lg"><span>TOTAL CAJA USD:</span> <span>$ {finalSummary.totalDayUSD.toFixed(2)}</span></div></div>
                 <div className="bg-gray-950 text-white p-10 rounded-[3rem] text-center border-4 border-emerald-500/30"><p className="text-[10px] font-black uppercase text-emerald-400 mb-2">Utilidad Neta Real</p><p className="text-6xl font-black">${(finalSummary.totalDayUSD - finalSummary.commissionsUSD - finalSummary.mermaUSD - finalSummary.gastosUSD).toFixed(2)}</p></div>
              </div>
              <div className="p-10 bg-gray-50 flex gap-5"><button onClick={() => window.print()} className="flex-1 bg-gray-900 text-white py-6 rounded-3xl font-black flex items-center justify-center gap-3"><Download size={24} /> Imprimir</button><button onClick={() => { onConfirmClosing(finalSummary, purchases); setShowReceipt(false); }} className="flex-1 bg-emerald-600 text-white py-6 rounded-3xl font-black flex items-center justify-center gap-3 active:scale-95 transition-all"><CheckCircle2 size={24} /> Confirmar Cierre</button></div>
           </div>
        </div>
      )}
    </div>
  );
};

export default DailyClosing;
