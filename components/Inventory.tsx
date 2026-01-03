
import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Filter, DollarSign, TrendingUp, ArrowUpRight, BarChart4, Globe, X } from 'lucide-react';
import { Product, Category } from '../types';

interface InventoryProps {
  products: Product[];
  rate: number;
  onAddProduct: (p: Omit<Product, 'id' | 'lastUpdated'>) => void;
  onUpdateProduct: (id: string, updates: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
}

const Inventory: React.FC<InventoryProps> = ({ products, rate, onAddProduct, onUpdateProduct, onDeleteProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'Todos'>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Todos' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de eliminar "${name}" del inventario?`)) {
      onDeleteProduct(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Inventario y Márgenes</h2>
          <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest flex items-center gap-2">
            <Globe size={14} /> Valorizado a tasa BCV: {rate.toFixed(2)} VES
          </p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl transition-all font-black shadow-lg shadow-emerald-100 active:scale-95"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre (tomate, cebolla...)" 
            className="w-full pl-12 pr-4 py-3 border border-gray-100 bg-gray-50 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="border border-gray-100 rounded-xl px-4 py-3 bg-gray-50 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-gray-600"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as Category | 'Todos')}
        >
          <option value="Todos">Todas las categorías</option>
          <option value="Fruta">Frutas</option>
          <option value="Verdura">Verduras</option>
          <option value="Hortaliza">Hortalizas</option>
          <option value="Otros">Otros</option>
        </select>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Producto</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock Actual</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Costo (Ref. $)</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Venta (Ref. $)</th>
                <th className="px-6 py-5 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50/30">Ganancia Unit.</th>
                <th className="px-6 py-5 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50/30">Valor Total Stock</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map(product => {
                const profitUnit = product.sellingPrice - product.costPrice;
                const profitTotal = profitUnit * product.stock;
                const marginPercent = product.costPrice > 0 ? (profitUnit / product.costPrice) * 100 : 0;
                const totalStockValue = product.sellingPrice * product.stock;
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-black text-gray-900">{product.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.category}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${product.stock <= 5 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
                        {product.stock.toFixed(2)} <span className="text-[9px] uppercase opacity-60">{product.unit}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-700">${product.costPrice.toFixed(2)}</p>
                      <p className="text-[10px] font-black text-gray-400">≈ Bs. {(product.costPrice * rate).toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-emerald-700">${product.sellingPrice.toFixed(2)}</p>
                      <p className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-1 rounded inline-block">≈ Bs. {(product.sellingPrice * rate).toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4 bg-emerald-50/10">
                      <div className="flex items-center gap-1 font-black text-emerald-700">
                        <ArrowUpRight size={14} />
                        ${profitUnit.toFixed(2)}
                      </div>
                      <p className="text-[9px] text-gray-400 font-bold mb-1">Bs. {(profitUnit * rate).toFixed(2)}</p>
                      <span className="text-[9px] font-black text-emerald-500 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                        {marginPercent.toFixed(1)}% Margen
                      </span>
                    </td>
                    <td className="px-6 py-4 bg-blue-50/10">
                      <div className="flex items-center gap-1 font-black text-blue-700">
                        <BarChart4 size={14} />
                        ${totalStockValue.toFixed(2)}
                      </div>
                      <p className="text-[10px] font-black text-blue-500">≈ Bs. {(totalStockValue * rate).toLocaleString()}</p>
                      <p className="text-[9px] text-gray-400 font-medium">Potencial de venta</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenEdit(product)}
                          className="p-2 hover:bg-white text-gray-400 hover:text-emerald-600 rounded-xl transition-all border border-transparent hover:border-emerald-100"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id, product.name)}
                          className="p-2 hover:bg-white text-gray-400 hover:text-red-600 rounded-xl transition-all border border-transparent hover:border-red-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-900">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all"><X size={24} /></button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const productData = {
                name: formData.get('name') as string,
                category: formData.get('category') as Category,
                stock: Number(formData.get('stock')),
                unit: formData.get('unit') as any,
                costPrice: Number(formData.get('costPrice')),
                sellingPrice: Number(formData.get('sellingPrice'))
              };

              if (editingProduct) {
                onUpdateProduct(editingProduct.id, productData);
              } else {
                onAddProduct(productData);
              }
              setIsModalOpen(false);
            }} className="space-y-4">
              <div className="bg-gray-50 p-6 rounded-[2rem] space-y-4 border border-gray-100">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Nombre Comercial</label>
                  <input name="name" defaultValue={editingProduct?.name || ''} required placeholder="Ej: Tomate Manzano" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Categoría</label>
                    <select name="category" defaultValue={editingProduct?.category || 'Fruta'} className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-emerald-500 font-bold">
                      <option value="Fruta">Fruta</option>
                      <option value="Verdura">Verdura</option>
                      <option value="Hortaliza">Hortaliza</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Unidad Medida</label>
                    <select name="unit" defaultValue={editingProduct?.unit || 'kg'} className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white font-bold">
                      <option value="kg">Kilo (kg)</option>
                      <option value="unidad">Unidad</option>
                      <option value="manojo">Manojo</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <label className="block text-[10px] font-black text-blue-500 uppercase mb-1 tracking-wider">Precio Coste ($)</label>
                  <input name="costPrice" type="number" step="0.01" defaultValue={editingProduct?.costPrice || ''} required placeholder="0.00" className="w-full bg-transparent text-xl font-black text-blue-700 outline-none" />
                </div>
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <label className="block text-[10px] font-black text-emerald-500 uppercase mb-1 tracking-wider">Precio Venta ($)</label>
                  <input name="sellingPrice" type="number" step="0.01" defaultValue={editingProduct?.sellingPrice || ''} required placeholder="0.00" className="w-full bg-transparent text-xl font-black text-emerald-700 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Stock Actual</label>
                <input name="stock" type="number" step="0.01" defaultValue={editingProduct?.stock || 0} required className="w-full border border-gray-200 rounded-xl px-4 py-3 font-black text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-4 border border-gray-200 text-gray-600 rounded-2xl font-black hover:bg-gray-50 transition-all">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all active:scale-95">
                  {editingProduct ? 'Actualizar Producto' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
