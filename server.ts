import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Read SQL Schema
  const sqlSchemaPath = path.resolve(__dirname, 'supabase_schema.sql');
  let sqlContent = '';
  if (fs.existsSync(sqlSchemaPath)) {
    sqlContent = fs.readFileSync(sqlSchemaPath, 'utf-8');
  }

  // 1. Endpoint: Auto-create tables into Database
  app.post('/api/database/create-tables', async (req, res) => {
    const { connectionString, dbPassword, supabaseUrl, serviceRoleKey } = req.body || {};

    let targetConnString = (connectionString || '').trim();

    // If connection string not directly provided, try constructing from supabaseUrl and dbPassword
    if (!targetConnString && supabaseUrl && dbPassword) {
      try {
        const urlObj = new URL(supabaseUrl);
        const hostParts = urlObj.hostname.split('.');
        if (hostParts.length > 0) {
          const projectRef = hostParts[0];
          // Standard direct connection to Supabase Postgres
          targetConnString = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;
        }
      } catch (e) {
        console.warn('Could not parse supabaseUrl for postgres connection:', e);
      }
    }

    // Check if we have a connection string
    if (!targetConnString) {
      return res.status(400).json({
        success: false,
        message:
          'Harap masukkan Connection String Database PostgreSQL (atau Password Database Supabase Anda). Contoh: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres',
      });
    }

    const client = new Client({
      connectionString: targetConnString,
      ssl: {
        rejectUnauthorized: false,
      },
      connectionTimeoutMillis: 15000,
    });

    const logs: string[] = [];

    try {
      logs.push('Menghubungkan ke server PostgreSQL...');
      await client.connect();
      logs.push('Berhasil terhubung ke database PostgreSQL.');

      logs.push('Mengeksekusi skema tabel database (DDL)...');

      // Use the schema SQL file or default schema
      const sqlToExecute = sqlContent || `
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
        CREATE TABLE IF NOT EXISTS public.stock_adjustments (
            id TEXT PRIMARY KEY,
            date DATE NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('Penyesuaian Rusak/Pecah', 'Konsumsi Sendiri', 'Koreksi Fisik (Opname)')),
            weight_kg NUMERIC(10, 2) NOT NULL CHECK (weight_kg > 0),
            reason TEXT NOT NULL,
            operator TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
        );
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
      `;

      await client.query(sqlToExecute);
      logs.push('Semua perintah SQL berhasil dieksekusi.');

      // Check tables count
      const checkRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('profiles', 'users', 'flocks', 'productions', 'sales', 'expenses', 'stock_adjustments', 'farm_settings');
      `);

      const tablesFound = checkRes.rows.map((r) => r.table_name);
      logs.push(`Tabel yang terverifikasi aktif di schema public: ${tablesFound.join(', ')}`);

      await client.end();

      return res.json({
        success: true,
        message: `Berhasil! Sebanyak ${tablesFound.length} tabel database berhasil dibuat dan disiapkan secara otomatis.`,
        tablesCreated: tablesFound,
        logs,
      });
    } catch (err: unknown) {
      try {
        await client.end();
      } catch {
        // ignore
      }
      const msg = err instanceof Error ? err.message : String(err);
      logs.push(`Error: ${msg}`);

      return res.status(500).json({
        success: false,
        message: `Gagal membuat tabel: ${msg}`,
        logs,
      });
    }
  });

  // 2. Endpoint: Get SQL Schema Script
  app.get('/api/database/schema-script', (req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(sqlContent);
  });

  // Vite Integration
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server TelurPro listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
