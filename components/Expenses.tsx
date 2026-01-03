
import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Plus, 
  Trash2, 
  DollarSign, 
  Calendar, 
  CreditCard, 
  Wallet, 
  Smartphone,
  X,
  Search,
  ArrowDownCircle,
  Globe
} from 'lucide-react';
import { Transaction, PaymentMethod, Currency } from '../types';

interface ExpensesProps {
  transactions: Transaction[];
  rate: number;
  onAddExpense: (expense: Omit<Transaction, 'id' | 'rateAtTime'>) => void;
  onDeleteExpense: (id: string) => void;
}

const Expenses: React.FC<ExpensesProps> = ({ transactions, rate, onAddExpense, onDeleteExpense }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para el nuevo gasto
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: 0,
    currency: 'USD' as Currency,
    paymentMethod: 'Efectivo' as PaymentMethod,
    date: new Date().toISOString().split('T')[0]
  });

  const expenseList = useMemo(() => {
    return transactions
      .filter(t => t.type === 'Gasto')
      .filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm]);

  const totalExpensesUSD = useMemo(() => {
    return expenseList.reduce((acc, curr) => {
      const amt = curr.currency === 'USD' ? curr.amount : curr.amount / curr.rateAtTime;
      return acc + amt;
    }, 0);
  }, [expenseList]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || newExpense.amount <= 0) return;

    onAddExpense({
      type: 'Gasto',
      ...newExpense,
      quantity: 0,
      date: new Date(newExpense.date).toISOString()
    });

    setIsModalOpen(false);
    setNewExpense({
      description: '',
      amount: 0,
      currency: 'USD',
      paymentMethod: 'Efectivo',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'Punto': return <CreditCard size={14} className="text-blue-500" />;
      case 'Pago Movil': return <Smartphone size={14} className="text-purple-500" />;
      case 'Efectivo': return <Wallet size={14} className="text-emerald-500" />;
      case 'Dolares': return <DollarSign size={14} className="text-emerald-600" />;
      default: return <Receipt size={14} className="text-gray-400" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-orange-100 p-4 rounded-3xl text-orange-600">
              <ArrowDownCircle size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Control de Gastos</h2>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Egresos operativos de caja</p>
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto bg-gray-900 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
          >
            <Plus size={24} /> Registrar Gasto
          </button>
        </div>

        <div className="bg-gray-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-center">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Total Gastos del Mes</p>
            <p className="text-4xl font-black tracking-tighter">${totalExpensesUSD.toFixed(2)}</p>
            <p className="text-xs font-bold text-gray-400 mt-2 flex items-center gap-2">
              <Globe size={14} /> ≈ Bs. {(totalExpensesUSD * rate).toLocaleString()}
            </p>
          </div>
          <Receipt size={120} className="absolute -bottom-6 -right-6 text-white/5 rotate-12" />
        </div>
      </div>

      {/* Filter & List */}
      <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="text" 
              placeholder="Buscar gasto por descripción..." 
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {expenseList.length} Gastos registrados
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descripción</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Método</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Monto Original</th>
                <th className="px-8 py-5 text-[10px] font-black text-orange-600 uppercase tracking-widest">Equivalente $</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {expenseList.map(exp => (
                <tr key={exp.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <Calendar size={14} className="text-gray-300" />
                      <span className="font-bold text-gray-900">{new Date(exp.date).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-black text-gray-800 uppercase text-xs tracking-tight">{exp.description}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-xl w-fit">
                      {getMethodIcon(exp.paymentMethod || '')}
                      <span className="text-[10px] font-black text-gray-500 uppercase">{exp.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`font-black ${exp.currency === 'VES' ? 'text-blue-600' : 'text-emerald-600'}`}>
                      {exp.currency === 'USD' ? '$' : 'Bs.'} {exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-black text-orange-600">
                      ${(exp.currency === 'USD' ? exp.amount : exp.amount / exp.rateAtTime).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => onDeleteExpense(exp.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {expenseList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-gray-300 italic font-bold">
                    No se han encontrado gastos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Gasto */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <Receipt className="text-orange-500" size={24} />
                <h3 className="text-2xl font-black text-gray-900">Registrar Egresos</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block ml-1">Descripción del Gasto</label>
                <input 
                  required
                  placeholder="Ej: Pago de Luz, Almuerzos, Bolsas..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-orange-500"
                  value={newExpense.description}
                  onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block ml-1">Moneda</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 font-bold outline-none"
                    value={newExpense.currency}
                    onChange={e => setNewExpense({...newExpense, currency: e.target.value as Currency})}
                  >
                    <option value="USD">Dólares ($)</option>
                    <option value="VES">Bolívares (Bs)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block ml-1">Monto</label>
                  <input 
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 font-black outline-none focus:ring-2 focus:ring-orange-500"
                    value={newExpense.amount || ''}
                    onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block ml-1">Método de Pago</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold outline-none"
                  value={newExpense.paymentMethod}
                  onChange={e => setNewExpense({...newExpense, paymentMethod: e.target.value as PaymentMethod})}
                >
                  <option value="Efectivo">Efectivo Bolívares</option>
                  <option value="Dolares">Dólares Cash</option>
                  <option value="Punto">Punto de Venta</option>
                  <option value="Pago Movil">Pago Móvil</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block ml-1">Fecha de Registro</label>
                <input 
                  type="date"
                  required
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold outline-none"
                  value={newExpense.date}
                  onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-orange-100 mt-4 uppercase active:scale-95 transition-all"
              >
                Guardar Gasto
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
