
import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  ArrowDownCircle, 
  Trash2, 
  DollarSign,
  AlertTriangle,
  Zap,
  BarChart4,
  X,
  Users,
  UserCheck,
  Globe,
  Percent,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  PackageSearch,
  Activity
} from 'lucide-react';
import { Transaction, Product, Reminder, Debtor, Supplier } from '../types';

interface DashboardProps {
  products: Product[];
  transactions: Transaction[];
  reminders: Reminder[];
  debtors: Debtor[];
  suppliers: Supplier[];
  rate: number;
  onToggleReminder: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ products, transactions, reminders, rate, debtors, suppliers, onToggleReminder }) => {
  const [detailModal, setDetailModal] = useState<{ title: string, content: React.ReactNode } | null>(null);

  const stats = useMemo(() => {
    let revUSD = 0, revVES = 0, expUSD = 0, wasteUSD = 0, totalCostOfSoldUSD = 0;
    let commissionsUSD = 0;
    
    // Análisis de productos
    const prodAnalysis: Record<string, { qty: number, revenue: number, profit: number, loss: number, stock: number, name: string }> = {};

    products.forEach(p => {
      prodAnalysis[p.id] = { name: p.name, qty: 0, revenue: 0, profit: 0, loss: 0, stock: p.stock };
    });

    transactions.forEach(t => {
      const amtUSD = t.currency === 'USD' ? t.amount : t.amount / t.rateAtTime;
      const amtVES = t.currency === 'VES' ? t.amount : t.amount * t.rateAtTime;

      if (t.type === 'Venta') {
        revUSD += amtUSD;
        revVES += amtVES;

        if (t.paymentMethod === 'Punto') {
          const commRate = t.cardType === 'Credito' ? 0.10 : 0.05;
          commissionsUSD += (amtUSD * commRate);
        }

        const product = products.find(p => p.id === t.productId || p.name === t.productName);
        if (product && prodAnalysis[product.id]) {
          const cost = product.costPrice;
          const selling = product.sellingPrice;
          const margin = (selling - cost);
          
          prodAnalysis[product.id].qty += t.quantity;
          prodAnalysis[product.id].revenue += amtUSD;
          prodAnalysis[product.id].profit += (margin * t.quantity);
          totalCostOfSoldUSD += (cost * t.quantity);
        }
      } else if (t.type === 'Gasto') {
        expUSD += amtUSD;
      } else if (t.type === 'Merma') {
        wasteUSD += amtUSD;
        const product = products.find(p => p.id === t.productId || p.name === t.productName);
        if (product && prodAnalysis[product.id]) {
          prodAnalysis[product.id].loss += (product.costPrice * t.quantity);
        }
      }
    });

    const netProfitUSD = revUSD - totalCostOfSoldUSD - expUSD - wasteUSD - commissionsUSD;
    const inventoryValueUSD = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);

    // Rankings
    const analysisArray = Object.values(prodAnalysis);
    const topSelling = [...analysisArray].sort((a, b) => b.qty - a.qty).slice(0, 3);
    const mostProfitable = [...analysisArray].sort((a, b) => b.profit - a.profit).slice(0, 3);
    const stagnant = [...analysisArray].filter(p => p.qty === 0).slice(0, 3);
    const mostWasted = [...analysisArray].filter(p => p.loss > 0).sort((a, b) => b.loss - a.loss).slice(0, 3);

    return {
      revenueUSD: revUSD,
      commissionsUSD,
      expensesUSD: expUSD,
      wasteUSD,
      costOfSoldUSD: totalCostOfSoldUSD,
      profitUSD: netProfitUSD,
      inventoryValueUSD,
      topSelling,
      mostProfitable,
      stagnant,
      mostWasted
    };
  }, [transactions, products]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Ventas Brutas" valUSD={stats.revenueUSD} valVES={stats.revenueUSD * rate} icon={<TrendingUp className="text-emerald-600" />} color="bg-emerald-50" />
        <StatCard title="Comisiones POS" valUSD={stats.commissionsUSD} valVES={stats.commissionsUSD * rate} icon={<CreditCard className="text-red-600" />} color="bg-red-50" />
        <StatCard title="Gastos Totales" valUSD={stats.expensesUSD} valVES={stats.expensesUSD * rate} icon={<ArrowDownCircle className="text-orange-600" />} color="bg-orange-50" />
        <StatCard title="Valor Inventario" valUSD={stats.inventoryValueUSD} valVES={stats.inventoryValueUSD * rate} icon={<PackageSearch className="text-blue-600" />} color="bg-blue-50" />
      </div>

      {/* Flujo de Caja y Balance Neto */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-gray-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[400px]">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <Activity className="text-emerald-400" size={28} />
              <h3 className="text-2xl font-black tracking-tight">Flujo de Caja Real</h3>
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Ingresos (Ventas)</span>
                <span className="text-2xl font-black text-emerald-400">+ ${stats.revenueUSD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Costo Mercancía Vendida</span>
                <span className="text-xl font-bold text-red-400">- ${stats.costOfSoldUSD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Egresos (Gastos + Comisiones + Mermas)</span>
                <span className="text-xl font-bold text-orange-400">- ${(stats.expensesUSD + stats.commissionsUSD + stats.wasteUSD).toFixed(2)}</span>
              </div>
              <div className="pt-4 flex justify-between items-center">
                <div>
                  <p className="text-emerald-400 font-black text-xs uppercase tracking-widest mb-1">Utilidad Neta Disponible</p>
                  <p className="text-6xl font-black tracking-tighter">${stats.profitUSD.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 font-black text-[10px] uppercase">En Bolívares</p>
                  <p className="text-2xl font-black text-white/80">Bs. {(stats.profitUSD * rate).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
          <DollarSign size={200} className="absolute -bottom-20 -right-20 text-white/5 rotate-12" />
        </div>

        {/* Ranking de Productos */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
            <h4 className="text-gray-900 font-black text-lg mb-6 flex items-center gap-2">
              <ArrowUpRight className="text-emerald-500" /> Ranking de Desempeño
            </h4>
            <div className="space-y-8">
              {/* Más Vendidos */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">🔥 Los más vendidos (Cant.)</p>
                <div className="space-y-2">
                  {stats.topSelling.map((p, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl">
                      <span className="font-bold text-gray-700 text-sm truncate max-w-[150px]">{p.name}</span>
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg font-black text-[10px]">{p.qty.toFixed(1)} Unid</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Más Rentables */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">💰 Mayor Ganancia Neta</p>
                <div className="space-y-2">
                  {stats.mostProfitable.map((p, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl">
                      <span className="font-bold text-gray-700 text-sm truncate max-w-[150px]">{p.name}</span>
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-black text-[10px]">+ ${p.profit.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mayor Merma */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">⚠️ Mayor Pérdida por Merma</p>
                <div className="space-y-2">
                  {stats.mostWasted.map((p, i) => (
                    <div key={i} className="flex justify-between items-center bg-red-50 p-3 rounded-2xl">
                      <span className="font-bold text-red-900 text-sm truncate max-w-[150px]">{p.name}</span>
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-lg font-black text-[10px]">- ${p.loss.toFixed(2)}</span>
                    </div>
                  ))}
                  {stats.mostWasted.length === 0 && <p className="text-xs text-gray-300 italic">No hay mermas registradas.</p>}
                </div>
              </div>

              {/* Estancados */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">🧊 Productos Estancados (0 Ventas)</p>
                <div className="flex flex-wrap gap-2">
                  {stats.stagnant.map((p, i) => (
                    <span key={i} className="bg-gray-100 text-gray-400 px-3 py-1.5 rounded-xl font-bold text-[10px]">{p.name}</span>
                  ))}
                  {stats.stagnant.length === 0 && <p className="text-xs text-gray-300 italic">Todo se está moviendo bien.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, valUSD, valVES, icon, color }: { title: string; valUSD: number; valVES: number; icon: React.ReactNode; color: string }) => (
  <div className={`${color} p-6 rounded-[2.5rem] shadow-sm flex flex-col justify-between h-full transition-all hover:shadow-lg group hover:scale-[1.02]`}>
    <div className="flex items-start justify-between mb-4">
      <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{title}</p>
      <div className="bg-white p-3 rounded-2xl shadow-sm">{icon}</div>
    </div>
    <div>
      <p className="text-3xl font-black text-gray-900 tracking-tighter">${valUSD.toFixed(2)}</p>
      <p className="text-sm font-black text-gray-500 mt-1">Bs. {valVES.toLocaleString()}</p>
    </div>
  </div>
);

export default Dashboard;
