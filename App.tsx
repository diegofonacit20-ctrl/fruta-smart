
import React, { useState, useEffect } from 'react';
import { INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, INITIAL_SUPPLIERS, INITIAL_HISTORY, INITIAL_DEBTORS, NAV_ITEMS } from './constants';
import { Product, Transaction, Supplier, DailySummary, Debtor, SaleEntry } from './types';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Suppliers from './components/Suppliers';
import Debtors from './components/Debtors';
import HistoricalRecord from './components/HistoricalRecord';
import DailyClosing from './components/DailyClosing';
import Expenses from './components/Expenses';
import AIStudio from './components/AIStudio';
import DataSync from './components/DataSync';
import VoiceAssistant from './components/VoiceAssistant';
import { Menu, X, Leaf, Globe, ChevronRight } from 'lucide-react';
import { getLatestBCVRate } from './services/geminiService';
import { initGoogleAuth } from './services/googleDriveService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Data State
  const [products, setProducts] = useState<Product[]>(() => JSON.parse(localStorage.getItem('fs_products') || JSON.stringify(INITIAL_PRODUCTS)));
  const [transactions, setTransactions] = useState<Transaction[]>(() => JSON.parse(localStorage.getItem('fs_transactions') || JSON.stringify(INITIAL_TRANSACTIONS)));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => JSON.parse(localStorage.getItem('fs_suppliers') || JSON.stringify(INITIAL_SUPPLIERS)));
  const [debtors, setDebtors] = useState<Debtor[]>(() => JSON.parse(localStorage.getItem('fs_debtors') || JSON.stringify(INITIAL_DEBTORS)));
  const [history, setHistory] = useState<DailySummary[]>(() => JSON.parse(localStorage.getItem('fs_history') || JSON.stringify(INITIAL_HISTORY)));
  const [bcvRate, setBcvRate] = useState(36.50);

  // Persistence
  useEffect(() => {
    localStorage.setItem('fs_products', JSON.stringify(products));
    localStorage.setItem('fs_transactions', JSON.stringify(transactions));
    localStorage.setItem('fs_suppliers', JSON.stringify(suppliers));
    localStorage.setItem('fs_debtors', JSON.stringify(debtors));
    localStorage.setItem('fs_history', JSON.stringify(history));
  }, [products, transactions, suppliers, debtors, history]);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const rate = await getLatestBCVRate();
        setBcvRate(rate);
      } catch (e) {
        console.error("Error fetching rate", e);
      }
    };
    fetchRate();
    initGoogleAuth();
  }, []);

  const handleImport = (data: any) => {
    if (data.products) setProducts(data.products);
    if (data.transactions) setTransactions(data.transactions);
    if (data.suppliers) setSuppliers(data.suppliers);
    if (data.debtors) setDebtors(data.debtors);
    if (data.history) setHistory(data.history);
  };

  const handleExport = () => ({ products, transactions, suppliers, debtors, history });

  const navigateTo = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  // REGISTRO DE VENTA INDIVIDUAL (TIEMPO REAL)
  const handleRegisterSale = (saleGroup: any) => {
    const newTrans: Transaction[] = saleGroup.items.map((item: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      type: 'Venta',
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      amount: item.quantity * item.unitPriceUSD,
      currency: 'USD',
      paymentMethod: saleGroup.paymentMethod,
      cardType: saleGroup.cardType,
      rateAtTime: bcvRate,
      description: `Venta de ${item.productName}`,
      date: saleGroup.timestamp
    }));

    setTransactions(prev => [...newTrans, ...prev]);

    setProducts(prev => prev.map(p => {
      const saleItem = saleGroup.items.find((it: any) => it.productId === p.id);
      if (saleItem) {
        return { ...p, stock: p.stock - saleItem.quantity, lastUpdated: new Date().toISOString() };
      }
      return p;
    }));

    if (saleGroup.paymentMethod === 'Credito' && saleGroup.debtorId) {
      setDebtors(prev => prev.map(d => {
        if (d.id === saleGroup.debtorId) {
          return { ...d, totalDebtUSD: d.totalDebtUSD + saleGroup.totalUSD };
        }
        return d;
      }));
    }
  };

  // GESTIÓN DE GASTOS
  const handleAddExpense = (expenseData: Omit<Transaction, 'id' | 'rateAtTime'>) => {
    const newExpense: Transaction = {
      ...expenseData,
      id: Math.random().toString(36).substr(2, 9),
      rateAtTime: bcvRate
    };
    setTransactions(prev => [newExpense, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // PROCESAR CIERRE DIARIO (ARCHIVADO)
  const handleConfirmClosing = (summaryData: Omit<DailySummary, 'id'>) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const fullSummary: DailySummary = { ...summaryData, id: newId };
    setHistory(prev => [fullSummary, ...prev]);

    const closingExtras: Transaction[] = [];
    if (summaryData.gastosUSD > 0) {
      closingExtras.push({
        id: Math.random().toString(36).substr(2, 9),
        type: 'Gasto',
        quantity: 0,
        amount: summaryData.gastosUSD,
        currency: 'USD',
        rateAtTime: bcvRate,
        description: 'Gasto reportado en cierre diario',
        date: summaryData.date
      });
    }
    if (summaryData.mermaUSD > 0) {
      closingExtras.push({
        id: Math.random().toString(36).substr(2, 9),
        type: 'Merma',
        quantity: 0,
        amount: summaryData.mermaUSD,
        currency: 'USD',
        rateAtTime: bcvRate,
        description: 'Merma reportada en cierre diario',
        date: summaryData.date
      });
    }
    if (closingExtras.length > 0) {
      setTransactions(prev => [...closingExtras, ...prev]);
    }

    alert("¡Jornada finalizada y archivada correctamente!");
    navigateTo('dashboard');
  };

  const handleQuickPurchase = (purchase: any) => {
    setProducts(prev => prev.map(p => {
      const purchasedItem = purchase.items.find((item: any) => item.productName === p.name);
      if (purchasedItem) {
        return {
          ...p,
          stock: p.stock + purchasedItem.quantity,
          costPrice: purchasedItem.costPerUnitUSD || p.costPrice,
          lastUpdated: new Date().toISOString()
        };
      }
      return p;
    }));

    if (purchase.isPaid) {
      const trans: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'Pago Proveedor',
        amount: purchase.totalCostUSD,
        currency: 'USD',
        quantity: 0,
        rateAtTime: bcvRate,
        description: `Pago contado a proveedor`,
        date: new Date().toISOString()
      };
      setTransactions(prev => [trans, ...prev]);
    } else if (purchase.supplierId) {
      setSuppliers(prev => prev.map(s => {
        if (s.id === purchase.supplierId) {
          const newOrder = {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString(),
            totalCostUSD: purchase.totalCostUSD,
            items: purchase.items
          };
          return { ...s, totalDebtUSD: s.totalDebtUSD + purchase.totalCostUSD, orders: [...(s.orders || []), newOrder] };
        }
        return s;
      }));
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard products={products} transactions={transactions} reminders={[]} rate={bcvRate} debtors={debtors} suppliers={suppliers} onToggleReminder={() => {}} />;
      case 'inventory': return <Inventory products={products} rate={bcvRate} onAddProduct={(p:any)=>setProducts([...products, {...p, id: Math.random().toString(36).substr(2,9), lastUpdated: new Date().toISOString()}])} onUpdateProduct={(id, updates)=>setProducts(products.map(p=>p.id===id?{...p,...updates,lastUpdated:new Date().toISOString()}:p))} onDeleteProduct={(id)=>setProducts(products.filter(p=>p.id!==id))} />;
      case 'closing': return (
        <DailyClosing 
          products={products} 
          debtors={debtors} 
          suppliers={suppliers} 
          rate={bcvRate} 
          onConfirmClosing={handleConfirmClosing} 
          onQuickPurchase={handleQuickPurchase}
          onRegisterSale={handleRegisterSale}
        />
      );
      case 'expenses': return (
        <Expenses 
          transactions={transactions} 
          rate={bcvRate} 
          onAddExpense={handleAddExpense} 
          onDeleteExpense={handleDeleteTransaction}
        />
      );
      case 'suppliers': return <Suppliers suppliers={suppliers} products={products} rate={bcvRate} onAddSupplier={(s:any) => setSuppliers([...suppliers, {...s, id: Math.random().toString(36).substr(2,9), abonos: [], orders: []}])} onAddPayment={()=>{}} onAddOrder={handleQuickPurchase} />;
      case 'debtors': return <Debtors debtors={debtors} rate={bcvRate} onAddDebtor={(d:any)=>setDebtors([...debtors, {...d, id: Math.random().toString(36).substr(2,9), abonos: []}])} onAddPayment={()=>{}} />;
      case 'history': return <HistoricalRecord history={history} rate={bcvRate} />;
      case 'ai': return <AIStudio />;
      case 'sync': return <DataSync onImport={handleImport} onExport={handleExport} />;
      default: return <Dashboard products={products} transactions={transactions} reminders={[]} rate={bcvRate} debtors={debtors} suppliers={suppliers} onToggleReminder={() => {}} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-medium text-gray-900">
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-[70] flex flex-col w-72 h-full bg-white border-r border-gray-100 p-8 transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between lg:justify-start gap-4 text-emerald-600 mb-12">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-600 text-white p-2 rounded-xl"><Leaf size={28} /></div>
            <span className="text-2xl font-black tracking-tighter text-gray-900">FrutaSmart</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-gray-400"><X size={24} /></button>
        </div>
        <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => navigateTo(item.id)} className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === item.id ? 'bg-gray-900 text-white shadow-xl translate-x-1' : 'text-gray-400 hover:bg-gray-50'}`}>
              <div className="flex items-center gap-4">{item.icon} {item.label}</div>
              {activeTab === item.id && <ChevronRight size={14} className="text-emerald-400" />}
            </button>
          ))}
        </nav>
        <div className="mt-8 bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
           <div className="flex justify-between items-center mb-1">
             <span className="text-[10px] font-black uppercase text-emerald-800 tracking-widest">Tasa BCV</span>
             <Globe size={12} className="text-blue-500"/>
           </div>
           <p className="text-2xl font-black text-gray-900 leading-none">Bs. {bcvRate.toFixed(2)}</p>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-4 lg:p-12 relative bg-gray-50">
        <div className="max-w-7xl mx-auto pb-24">
          <header className="mb-10 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Panel de Control</p>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">{NAV_ITEMS.find(n => n.id === activeTab)?.label}</h1>
            </div>
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden bg-gray-900 text-white p-4 rounded-2xl shadow-xl"><Menu size={24}/></button>
          </header>
          {renderContent()}
        </div>
      </main>
      <VoiceAssistant products={products} transactions={transactions} suppliers={suppliers} reminders={[]} onAddTransaction={()=>{}} onAddReminder={()=>{}} onInterpretSales={()=>{}} onInterpretSupplierDelivery={()=>{}} onSyncRequest={() => handleExport()} />
    </div>
  );
};

export default App;
