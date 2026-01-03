
import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  TrendingUp, 
  Trash2, 
  DollarSign, 
  Sparkles,
  Users,
  History,
  ClipboardList,
  UserCheck,
  Cloud,
  Receipt
} from 'lucide-react';
import { Product, Transaction, Supplier, DailySummary, Debtor } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Manzana Gala', category: 'Fruta', stock: 50, unit: 'kg', costPrice: 1.20, sellingPrice: 2.50, lastUpdated: new Date().toISOString() },
  { id: '5', name: 'Tomate pera', category: 'Hortaliza', stock: 40, unit: 'kg', costPrice: 0.80, sellingPrice: 1.90, lastUpdated: new Date().toISOString() },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_SUPPLIERS: Supplier[] = [];
export const INITIAL_DEBTORS: Debtor[] = [];
export const INITIAL_HISTORY: DailySummary[] = [];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Resumen', icon: <LayoutDashboard size={20} /> },
  { id: 'inventory', label: 'Inventario', icon: <Package size={20} /> },
  { id: 'closing', label: 'Ventas y Compras', icon: <ClipboardList size={20} /> },
  { id: 'expenses', label: 'Gastos de Caja', icon: <Receipt size={20} /> },
  { id: 'suppliers', label: 'Proveedores', icon: <Users size={20} /> },
  { id: 'debtors', label: 'Fiado a Clientes', icon: <UserCheck size={20} /> },
  { id: 'history', label: 'Histórico', icon: <History size={20} /> },
  { id: 'ai', label: 'IA Studio', icon: <Sparkles size={20} /> },
  { id: 'sync', label: 'Sincronizar', icon: <Cloud size={20} /> },
];
