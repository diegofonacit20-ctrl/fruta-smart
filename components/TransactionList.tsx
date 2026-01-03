
import React, { useState } from 'react';
import { Plus, Trash2, ShoppingCart, TrendingDown, Package, DollarSign } from 'lucide-react';
import { Transaction, TransactionType, Product, Currency } from '../types';

interface TransactionListProps {
  type: TransactionType;
  transactions: Transaction[];
  products: Product[];
  rate: number;
  onAddTransaction: (t: Omit<Transaction, 'id' | 'date' | 'rateAtTime'>) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ type, transactions, products, rate, onAddTransaction }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');

  const filteredTransactions = transactions.filter(t => t.type === type);
  
  const getIcon = () => {
    switch (type) {
      case 'Venta': return <ShoppingCart className="text-emerald-500" />;
      case 'Gasto': return <TrendingDown className="text-orange-500" />;
      case 'Merma': return <Package className="text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">{getIcon()}</div>
          <h2 className="text-2xl font-black text-gray-900">{type === 'Venta' ? 'Ingresos y Ventas' : type === 'Gasto' ? 'Gastos de Caja' : 'Registro de Mermas'}</h2>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-2xl hover:bg-black transition-all font-bold shadow-lg"
        >
          <Plus size={20} />
          Registrar {type}
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Fecha</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Concepto</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Cantidad</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Monto Original</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Ref. USD</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-400 italic">Sin movimientos registrados.</td>
                </tr>
              ) : (
                filteredTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                  <tr key={t.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                      {new Date(t.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{t.productName || t.description}</p>
                      {t.productName && <p className="text-[10px] text-gray-400 uppercase font-black">{t.description}</p>}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{t.quantity || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`font-black ${t.currency === 'VES' ? 'text-blue-600' : 'text-emerald-600'}`}>
                        {t.currency === 'USD' ? '$' : 'Bs.'} {t.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      ${t.currency === 'USD' ? t.amount.toFixed(2) : (t.amount / t.rateAtTime).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
            <h3 className="text-2xl font-black mb-6">Nuevo Registro de {type}</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const prodId = formData.get('productId') as string;
              const product = products.find(p => p.id === prodId);
              
              onAddTransaction({
                type,
                productId: prodId || undefined,
                productName: product?.name || undefined,
                quantity: Number(formData.get('quantity') || 0),
                amount: Number(formData.get('amount')),
                currency: selectedCurrency,
                description: formData.get('description') as string
              });
              setIsModalOpen(false);
            }} className="space-y-4">
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                <button type="button" onClick={() => setSelectedCurrency('USD')} className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${selectedCurrency === 'USD' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400'}`}>Dólares ($)</button>
                <button type="button" onClick={() => setSelectedCurrency('VES')} className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${selectedCurrency === 'VES' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}>Bolívares (Bs.)</button>
              </div>

              {(type === 'Venta' || type === 'Merma') && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Producto</label>
                  <select name="productId" required className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white font-medium">
                    <option value="">Selecciona...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Ref: ${p.sellingPrice})</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Concepto</label>
                <input name="description" required placeholder="Ejem: Pago de servicios, Venta POS..." className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Cantidad</label>
                  <input name="quantity" type="number" step="0.1" defaultValue="1" className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Monto {selectedCurrency}</label>
                  <input name="amount" type="number" step="0.01" required className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium border-emerald-500" />
                </div>
              </div>
              <p className="text-[10px] text-gray-400 text-center font-bold italic">Calculado a tasa BCV: {rate} VES/USD</p>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold">Cerrar</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
