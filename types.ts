
export type Category = 'Fruta' | 'Verdura' | 'Hortaliza' | 'Otros';
export type Currency = 'USD' | 'VES';
export type PaymentMethod = 'Efectivo' | 'Punto' | 'Pago Movil' | 'Dolares';
export type CardType = 'Debito' | 'Credito';

export interface Product {
  id: string;
  name: string;
  category: Category;
  stock: number;
  unit: 'kg' | 'unidad' | 'manojo' | 'cesta' | 'saco';
  costPrice: number;
  sellingPrice: number;
  lastUpdated: string;
}

export type TransactionType = 'Venta' | 'Gasto' | 'Merma' | 'Pago Proveedor' | 'Cobro Deudor';

export interface Transaction {
  id: string;
  type: TransactionType;
  productId?: string;
  productName?: string;
  quantity: number;
  amount: number;
  currency: Currency;
  paymentMethod?: PaymentMethod;
  cardType?: CardType; // Para cálculo de comisiones 5% o 10%
  rateAtTime: number;
  description: string;
  date: string;
}

export interface Abono {
  id: string;
  amount: number;
  date: string;
  method: string;
}

export interface SupplierOrder {
  id: string;
  date: string;
  items: any[];
  totalCostUSD: number;
  description?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  category: Category;
  totalDebtUSD: number;
  abonos: Abono[];
  orders: SupplierOrder[];
}

export interface Debtor {
  id: string;
  name: string;
  contact: string;
  totalDebtUSD: number;
  abonos: Abono[];
  description: string;
  paymentDates?: string;
}

export interface SaleEntry {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  paymentMethod: PaymentMethod | 'Credito';
  cardType?: CardType;
  amountUSD: number;
  amountVES?: number; // Monto exacto cobrado en bolívares
  referenceAmountUSD: number;
  debtorId?: string;
}

export interface DailySummary {
  id: string;
  date: string;
  efectivoVES: number;
  puntoVES: number;
  pagoMovilVES: number;
  dolaresUSD: number;
  mermaUSD: number;
  gastosUSD: number;
  commissionsUSD: number; // Nueva: comisiones bancarias totales del día
  totalDayUSD: number;
  salesDetail: SaleEntry[];
}

export interface Reminder {
  id: string;
  text: string;
  date: string;
  completed: boolean;
  priority: 'Baja' | 'Alta';
}

export interface SyncCheckpoint {
  timestamp: string;
  deviceId: string;
  dataHash: string;
}
