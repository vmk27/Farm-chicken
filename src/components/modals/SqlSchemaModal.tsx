import React, { useState } from 'react';
import { X, Copy, Check, Database, Terminal, Sparkles } from 'lucide-react';
import { AutoDbSetupModal } from './AutoDbSetupModal';

interface SqlSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SUPABASE_SQL_SCRIPT = `-- ==============================================================================
-- TELURPRO - SKEMA SQL DATABASE SUPABASE (POSTGRESQL)
-- ==============================================================================

-- 1. TABEL PENGGUNA (USERS) - Otentikasi Tanpa Email
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'operator', 'kasir')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    password_hash TEXT NOT NULL DEFAULT 'admin123',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- 2. TABEL KANDANG & POPULASI AYAM (FLOCKS)
CREATE TABLE IF NOT EXISTS public.flocks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    breed TEXT DEFAULT 'Lohmann Brown',
    hen_count INTEGER NOT NULL DEFAULT 1000,
    feed_kg_daily NUMERIC(10, 2) DEFAULT 0,
    operator TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 3. TABEL PENCATATAN PANEN TELUR (PRODUCTIONS) - MURNI KG
CREATE TABLE IF NOT EXISTS public.productions (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    flock_id TEXT REFERENCES public.flocks(id) ON DELETE SET NULL,
    flock_name TEXT NOT NULL,
    weight_kg_total NUMERIC(10, 2) NOT NULL CHECK (weight_kg_total > 0),
    hen_population INTEGER,
    operator TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_productions_date ON public.productions(date);
CREATE INDEX IF NOT EXISTS idx_productions_flock_id ON public.productions(flock_id);

-- 4. TABEL PENJUALAN TELUR & KASIR (SALES) - MURNI KG
CREATE TABLE IF NOT EXISTS public.sales (
    id TEXT PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    date DATE NOT NULL,
    grade TEXT NOT NULL DEFAULT 'Telur Standar',
    weight_kg NUMERIC(10, 2) NOT NULL CHECK (weight_kg > 0),
    price_per_kg NUMERIC(12, 2) NOT NULL CHECK (price_per_kg > 0),
    subtotal NUMERIC(14, 2) NOT NULL,
    discount NUMERIC(12, 2) DEFAULT 0,
    total_revenue NUMERIC(14, 2) NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'Lunas' CHECK (payment_status IN ('Lunas', 'Tempo', 'Sebagian')),
    payment_method TEXT NOT NULL DEFAULT 'Tunai' CHECK (payment_method IN ('Tunai', 'Transfer Bank', 'QRIS')),
    amount_paid NUMERIC(14, 2) DEFAULT 0,
    remaining_due NUMERIC(14, 2) DEFAULT 0,
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON public.sales(invoice_number);

-- 5. TABEL PENGELUARAN & ALOKASI MODAL (EXPENSES)
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('pakan', 'bibit_ayam', 'upah', 'listrik', 'air', 'vaksin', 'lainnya')),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    recipient TEXT NOT NULL,
    description TEXT NOT NULL,
    receipt_number TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 6. TABEL PENYESUAIAN STOK (STOCK_ADJUSTMENTS)
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Penyesuaian Rusak/Pecah', 'Konsumsi Sendiri', 'Koreksi Fisik (Opname)')),
    weight_kg NUMERIC(10, 2) NOT NULL CHECK (weight_kg > 0),
    reason TEXT NOT NULL,
    operator TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 7. TABEL PENGATURAN (FARM_SETTINGS) - TELUR STANDAR
CREATE TABLE IF NOT EXISTS public.farm_settings (
    id TEXT PRIMARY KEY DEFAULT 'default_settings',
    farm_name TEXT NOT NULL DEFAULT 'CV Sumber Rejeki',
    tagline TEXT DEFAULT 'Peternakan Ayam Petelur Modern',
    owner_name TEXT NOT NULL DEFAULT 'H. Budi Santoso',
    phone TEXT DEFAULT '0812-3456-7890',
    address TEXT DEFAULT 'Jl. Raya Peternakan No. 88, Subang, Jawa Barat',
    current_market_price_per_kg NUMERIC(12, 2) DEFAULT 28500,
    low_stock_threshold_kg NUMERIC(10, 2) DEFAULT 250,
    alloc_pakan NUMERIC(5, 2) DEFAULT 63.00,
    alloc_pembelian_ayam NUMERIC(5, 2) DEFAULT 20.00,
    alloc_upah_kerja NUMERIC(5, 2) DEFAULT 12.00,
    alloc_vitamin_vaksin NUMERIC(5, 2) DEFAULT 3.50,
    alloc_listrik NUMERIC(5, 2) DEFAULT 0.50,
    alloc_air NUMERIC(5, 2) DEFAULT 0.50,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access flocks" ON public.flocks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access productions" ON public.productions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access sales" ON public.sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access stock_adjustments" ON public.stock_adjustments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access farm_settings" ON public.farm_settings FOR ALL USING (true) WITH CHECK (true);

-- DATA AWAL / SEED USERS
INSERT INTO public.users (id, username, full_name, role, status, password_hash)
VALUES
    ('USR-ADMIN', 'admin', 'Budi Santoso (Pemilik)', 'admin', 'active', 'admin123'),
    ('USR-OP-1', 'operator', 'Kang Asep (Operator Kandang)', 'operator', 'active', 'operator123'),
    ('USR-KASIR-1', 'kasir', 'Siti Rahma (Kasir Penjualan)', 'kasir', 'active', 'kasir123')
ON CONFLICT (id) DO UPDATE 
SET full_name = EXCLUDED.full_name,
    password_hash = EXCLUDED.password_hash;`;

export const SqlSchemaModal: React.FC<SqlSchemaModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-3xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92dvh] sm:max-h-[88vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Skema SQL Database Supabase</h3>
                <p className="text-xs text-slate-500">
                  Skrip pembuatan tabel database PostgreSQL & Supabase untuk TelurPro
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Instructions banner */}
          <div className="shrink-0 p-3.5 bg-emerald-50/70 border-b border-emerald-200 text-xs text-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Cara pasang:</strong> Tempel skrip ini di <strong>Supabase SQL Editor</strong> lalu klik <strong>Run</strong>. Atau buat otomatis 1-klik.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setIsAutoModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Buat Otomatis 1-Klik</span>
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin Semua SQL'}</span>
              </button>
            </div>
          </div>

          {/* SQL Code View Area */}
          <div
            className="flex-1 overflow-y-auto overscroll-contain p-4 bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed select-all touch-pan-y"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <pre className="whitespace-pre-wrap">{SUPABASE_SQL_SCRIPT}</pre>
          </div>

          {/* Footer */}
          <div className="shrink-0 flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50">
            <span className="text-[11px] text-slate-500 font-medium">
              7 Tabel • RLS Aktif • Satuan Kg Murni • Tanpa Email Pengguna
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAutoModalOpen(true)}
                className="px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Buka Pembuat Tabel Otomatis</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>

      <AutoDbSetupModal
        isOpen={isAutoModalOpen}
        onClose={() => setIsAutoModalOpen(false)}
      />
    </>
  );
};
