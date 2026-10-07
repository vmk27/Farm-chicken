export type EggGrade = 'Grade A (Super)' | 'Grade B (Standar)' | 'Retak / Reject' | 'Campur';

export type PaymentStatus = 'Lunas' | 'Tempo' | 'Sebagian';

export type PaymentMethod = 'Tunai' | 'Transfer Bank' | 'QRIS';

export type CustomerCategory = 'Agen / Grosir' | 'Toko Kue & Bakery' | 'Pasar Tradisional' | 'Restoran / Warung' | 'Eceran Langsung';

export type ExpenseCategory = 'pakan' | 'bibit_ayam' | 'upah' | 'listrik' | 'air' | 'vaksin' | 'lainnya';

export interface Flock {
  id: string;
  name: string;
  breed?: string;
  henCount: number;
  feedKgDaily?: number;
  operator?: string;
  notes?: string;
}

export interface ProductionRecord {
  id: string;
  date: string; // YYYY-MM-DD
  flockId: string; // e.g., 'Kandang A'
  flockName: string;
  weightKgTotal: number; // Total kg
  henPopulation?: number; // Populasi ayam produktif (sesuai data kandang)
  eggCountTotal?: number; // Total butir (opsional)
  gradeA_Kg?: number; // kg Grade A (opsional)
  gradeB_Kg?: number; // kg Grade B (opsional)
  cracked_Kg?: number; // kg Retak/Afkir (opsional)
  breakageRatePct?: number; // % retak (opsional)
  henDayProductionPct?: number; // HDP % (opsional)
  feedConsumedKg?: number; // Konsumsi pakan harian (opsional)
  operator?: string;
  notes?: string;
  createdAt: string;
}

export interface SaleRecord {
  id: string;
  invoiceNumber: string;
  date: string; // YYYY-MM-DD
  grade: EggGrade;
  weightKg: number;
  eggCountEstimated?: number;
  pricePerKg: number;
  subtotal: number;
  discount: number;
  totalRevenue: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  remainingDue: number;
  dueDate?: string;
  notes?: string;
  createdAt: string;
}

export interface ExpenseRecord {
  id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  amount: number;
  recipient: string;
  description: string;
  receiptNumber?: string;
  createdAt: string;
}

export interface StockAdjustmentRecord {
  id: string;
  date: string;
  type: 'Penyesuaian Rusak/Pecah' | 'Konsumsi Sendiri' | 'Koreksi Fisik (Opname)';
  weightKg: number;
  reason: string;
  operator: string;
  createdAt: string;
}

export interface ModalAllocationPercentages {
  pakan: number; // 63%
  pembelianAyam: number; // 20%
  upahKerja: number; // 12%
  vitaminVaksin: number; // 3.5%
  listrik: number; // 0.5%
  air: number; // 0.5%
}

export interface FarmSettings {
  farmName: string;
  tagline: string;
  ownerName: string;
  phone: string;
  address: string;
  currentMarketPricePerKg: number;
  defaultPriceGradeA: number;
  defaultPriceGradeB: number;
  defaultPriceRetak: number;
  defaultEggCountPerKg: number; // default ~16 butir/kg
  lowStockThresholdKg: number;
  allocations: ModalAllocationPercentages;
}

export interface DailySummary {
  date: string;
  totalProductionKg: number;
  totalProductionEggs: number;
  totalSalesKg: number;
  totalSalesEggs: number;
  totalRevenue: number;
  estimatedCost: number;
  netProfit: number;
  stockEndKg: number;
  avgSellingPricePerKg: number;
  modalAllocation: {
    pakan: number;
    pembelianAyam: number;
    upahKerja: number;
    vitaminVaksin: number;
    listrik: number;
    air: number;
  };
}

export type UserRole = 'admin' | 'operator' | 'kasir';

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  role: UserRole;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLoginAt?: string;
}

export type ActiveTab = 
  | 'dashboard'
  | 'produksi'
  | 'penjualan'
  | 'stok'
  | 'alokasi'
  | 'laporan'
  | 'pengaturan'
  | 'pengguna';

