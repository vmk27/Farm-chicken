-- ==============================================================================
-- TELURPRO - SKEMA SQL DATABASE SUPABASE & ARSITEKTUR KEAMANAN (POSTGRESQL + RLS)
-- Sistem Manajemen Peternakan Telur, Kasir Penjualan & Alokasi Modal
-- ==============================================================================
-- Catatan Keamanan:
-- 1. Otentikasi kata sandi dikelola 100% oleh Supabase Auth (auth.users).
-- 2. Data profil, nama, username, dan role disimpan pada public.profiles.
-- 3. Row Level Security (RLS) diaktifkan secara ketat pada seluruh tabel.
-- ==============================================================================

-- 1. TABEL PROFIL PENGGUNA (PROFILES) - TERHUBUNG KE auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator', 'kasir')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Indeks tabel profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

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

-- 3. TABEL PENCATATAN PANEN TELUR (PRODUCTIONS)
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

-- 4. TABEL PENJUALAN TELUR & KASIR (SALES)
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
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(payment_status);

-- 5. TABEL PENGELUARAN & REALISASI MODAL (EXPENSES)
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

CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);

-- 6. TABEL PENYESUAIAN & OPNAME STOK (STOCK_ADJUSTMENTS)
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Penyesuaian Rusak/Pecah', 'Konsumsi Sendiri', 'Koreksi Fisik (Opname)')),
    weight_kg NUMERIC(10, 2) NOT NULL CHECK (weight_kg > 0),
    reason TEXT NOT NULL,
    operator TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_adjustments_date ON public.stock_adjustments(date);

-- 7. TABEL PENGATURAN PETERNAKAN & ALOKASI LABA (FARM_SETTINGS)
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

-- ==============================================================================
-- FUNGSI BANTUAN UNTUK OTORISASI PERAN (SECURITY DEFINER)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = user_id LIMIT 1;
$$;

-- FUNGSI OTOMATIS PEMBUATAN PROFIL DARI SUPABASE AUTH (TRIGGER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, email, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'operator'),
    'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Public access users" ON public.profiles;
    DROP POLICY IF EXISTS "Authenticated users view profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Users update own profile or admin updates all" ON public.profiles;
    DROP POLICY IF EXISTS "Admin can insert profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Admin can delete profiles" ON public.profiles;
    
    DROP POLICY IF EXISTS "Public access flocks" ON public.flocks;
    DROP POLICY IF EXISTS "Public access productions" ON public.productions;
    DROP POLICY IF EXISTS "Public access sales" ON public.sales;
    DROP POLICY IF EXISTS "Public access expenses" ON public.expenses;
    DROP POLICY IF EXISTS "Public access stock_adjustments" ON public.stock_adjustments;
    DROP POLICY IF EXISTS "Public access farm_settings" ON public.farm_settings;
END $$;

-- 1. Profiles Policies
CREATE POLICY "Authenticated users view profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users update own profile or admin updates all"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id OR public.get_user_role(auth.uid()) = 'admin')
    WITH CHECK (auth.uid() = id OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admin can insert profiles"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (public.get_user_role(auth.uid()) = 'admin' OR auth.uid() = id);

CREATE POLICY "Admin can delete profiles"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin');

-- 2. Flocks Policies
CREATE POLICY "Auth users select flocks" ON public.flocks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users insert flocks" ON public.flocks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users update flocks" ON public.flocks FOR UPDATE TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users delete flocks" ON public.flocks FOR DELETE TO authenticated USING (true);

-- 3. Productions Policies
CREATE POLICY "Auth users select productions" ON public.productions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users insert productions" ON public.productions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users update productions" ON public.productions FOR UPDATE TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users delete productions" ON public.productions FOR DELETE TO authenticated USING (true);

-- 4. Sales Policies
CREATE POLICY "Auth users select sales" ON public.sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users insert sales" ON public.sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users update sales" ON public.sales FOR UPDATE TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users delete sales" ON public.sales FOR DELETE TO authenticated USING (true);

-- 5. Expenses Policies
CREATE POLICY "Auth users select expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users update expenses" ON public.expenses FOR UPDATE TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users delete expenses" ON public.expenses FOR DELETE TO authenticated USING (true);

-- 6. Stock Adjustments Policies
CREATE POLICY "Auth users select stock_adjustments" ON public.stock_adjustments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users insert stock_adjustments" ON public.stock_adjustments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users update stock_adjustments" ON public.stock_adjustments FOR UPDATE TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users delete stock_adjustments" ON public.stock_adjustments FOR DELETE TO authenticated USING (true);

-- 7. Farm Settings Policies
CREATE POLICY "Auth users select farm_settings" ON public.farm_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users insert farm_settings" ON public.farm_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users update farm_settings" ON public.farm_settings FOR UPDATE TO authenticated WITH CHECK (true);

-- ==============================================================================
-- SEED DATA AWAL
-- ==============================================================================
INSERT INTO public.flocks (id, name, breed, hen_count, feed_kg_daily, operator, notes)
VALUES
    ('FLK-001', 'Kandang A (Puncak Produksi)', 'Lohmann Brown', 2500, 275.0, 'Kang Asep', 'Umur 32 minggu, performa puncak'),
    ('FLK-002', 'Kandang B (Produksi Stabil)', 'Isa Brown', 2000, 220.0, 'Mas Budi', 'Umur 45 minggu, produksi stabil'),
    ('FLK-003', 'Kandang C (Ayam Pullet Muda)', 'Hy-Line Brown', 1800, 198.0, 'Pak Joko', 'Baru masuk bertelur umur 22 minggu')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.farm_settings (id, farm_name, owner_name, current_market_price_per_kg)
VALUES ('default_settings', 'CV Sumber Rejeki', 'H. Budi Santoso', 28500)
ON CONFLICT (id) DO NOTHING;
