import { getSupabaseClient, isSupabaseConfigured, getStoredSupabaseConfig } from './supabase';
import { initialUsers } from './supabase';

export interface TableStatus {
  name: string;
  label: string;
  exists: boolean;
  rowCount?: number;
  error?: string;
}

export const REQUIRED_TABLES = [
  { name: 'profiles', label: 'Tabel Profil Pengguna & Role (Supabase Auth)' },
  { name: 'flocks', label: 'Tabel Kandang & Populasi Ayam' },
  { name: 'productions', label: 'Tabel Catatan Panen Telur (Kg)' },
  { name: 'sales', label: 'Tabel Penjualan Telur Kasir (Kg)' },
  { name: 'expenses', label: 'Tabel Pengeluaran & Alokasi Modal' },
  { name: 'stock_adjustments', label: 'Tabel Opname & Penyesuaian Stok' },
  { name: 'farm_settings', label: 'Tabel Pengaturan Peternakan' },
];

/**
 * Check which tables exist in Supabase using the client
 */
export const checkAllTablesStatus = async (): Promise<{
  allExist: boolean;
  tables: TableStatus[];
}> => {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    return {
      allExist: false,
      tables: REQUIRED_TABLES.map((t) => ({ ...t, exists: false, error: 'Supabase belum terhubung' })),
    };
  }

  const results: TableStatus[] = [];

  for (const table of REQUIRED_TABLES) {
    try {
      const { data, count, error } = await client
        .from(table.name)
        .select('*', { count: 'exact', head: true });

      if (error) {
        // Code 42P01 means table does not exist
        if (error.code === '42P01' || error.message.toLowerCase().includes('does not exist')) {
          results.push({
            name: table.name,
            label: table.label,
            exists: false,
            error: 'Tabel belum dibuat di database',
          });
        } else {
          // If error is permission or other, table likely exists
          results.push({
            name: table.name,
            label: table.label,
            exists: true,
            rowCount: count ?? undefined,
            error: error.message,
          });
        }
      } else {
        results.push({
          name: table.name,
          label: table.label,
          exists: true,
          rowCount: count ?? (Array.isArray(data) ? data.length : 0),
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        name: table.name,
        label: table.label,
        exists: false,
        error: msg,
      });
    }
  }

  const allExist = results.length > 0 && results.every((r) => r.exists);
  return { allExist, tables: results };
};

/**
 * Call backend server to execute database table creation
 */
export const executeCreateTablesOnBackend = async (payload: {
  connectionString?: string;
  dbPassword?: string;
  supabaseUrl?: string;
  serviceRoleKey?: string;
}): Promise<{
  success: boolean;
  message: string;
  tablesCreated?: string[];
  logs?: string[];
}> => {
  try {
    const res = await fetch('/api/database/create-tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: data.message || `Gagal mengeksekusi (HTTP ${res.status})`,
        logs: data.logs,
      };
    }

    return data;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Koneksi ke endpoint pembuatan database gagal: ${msg}. Pastikan server aktif atau gunakan panduan SQL Editor.`,
    };
  }
};

/**
 * Seed initial data (users, flocks, settings) into existing Supabase tables
 */
export const seedInitialDatabaseData = async (): Promise<{
  success: boolean;
  message: string;
  insertedCount: number;
}> => {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    return { success: false, message: 'Supabase client belum siap.', insertedCount: 0 };
  }

  let count = 0;
  const errors: string[] = [];

  // 1. Seed profiles
  try {
    const profilesToInsert = initialUsers.map((u) => ({
      id: u.id.startsWith('USR-') ? '00000000-0000-0000-0000-000000000001' : u.id,
      username: u.username,
      full_name: u.fullName,
      email: u.email,
      role: u.role,
      status: u.status,
    }));

    const { error: userErr } = await client
      .from('profiles')
      .upsert(profilesToInsert, { onConflict: 'username' });

    if (!userErr) count += profilesToInsert.length;
    else errors.push(`Profiles: ${userErr.message}`);
  } catch (e: unknown) {
    errors.push(`Profiles: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 2. Seed flocks
  try {
    const initialFlocks = [
      {
        id: 'FLK-001',
        name: 'Kandang A (Puncak Produksi)',
        breed: 'Lohmann Brown',
        hen_count: 2500,
        feed_kg_daily: 275.0,
        operator: 'Kang Asep',
        notes: 'Umur 32 minggu, performa puncak',
      },
      {
        id: 'FLK-002',
        name: 'Kandang B (Produksi Stabil)',
        breed: 'Isa Brown',
        hen_count: 2000,
        feed_kg_daily: 220.0,
        operator: 'Mas Budi',
        notes: 'Umur 45 minggu, produksi stabil',
      },
      {
        id: 'FLK-003',
        name: 'Kandang C (Ayam Pullet Muda)',
        breed: 'Hy-Line Brown',
        hen_count: 1800,
        feed_kg_daily: 198.0,
        operator: 'Pak Joko',
        notes: 'Baru masuk bertelur umur 22 minggu',
      },
    ];

    const { error: flockErr } = await client
      .from('flocks')
      .upsert(initialFlocks, { onConflict: 'id' });

    if (!flockErr) count += initialFlocks.length;
    else errors.push(`Flocks: ${flockErr.message}`);
  } catch (e: unknown) {
    errors.push(`Flocks: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 3. Seed farm_settings
  try {
    const defaultSettings = {
      id: 'default_settings',
      farm_name: 'CV Sumber Rejeki',
      tagline: 'Peternakan Ayam Petelur Modern',
      owner_name: 'H. Budi Santoso',
      phone: '0812-3456-7890',
      address: 'Jl. Raya Peternakan No. 88, Subang, Jawa Barat',
      current_market_price_per_kg: 28500,
      low_stock_threshold_kg: 250,
      alloc_pakan: 63.0,
      alloc_pembelian_ayam: 20.0,
      alloc_upah_kerja: 12.0,
      alloc_vitamin_vaksin: 3.5,
      alloc_listrik: 0.5,
      alloc_air: 0.5,
    };

    const { error: setErr } = await client
      .from('farm_settings')
      .upsert([defaultSettings], { onConflict: 'id' });

    if (!setErr) count += 1;
    else errors.push(`Settings: ${setErr.message}`);
  } catch (e: unknown) {
    errors.push(`Settings: ${e instanceof Error ? e.message : String(e)}`);
  }

  if (errors.length > 0 && count === 0) {
    return {
      success: false,
      message: `Gagal mengisi data awal: ${errors.join(', ')}`,
      insertedCount: 0,
    };
  }

  return {
    success: true,
    message: `Berhasil mengisi data awal (${count} entitas data tersimpan ke Supabase)!`,
    insertedCount: count,
  };
};

/**
 * Download a dump of the current Supabase database (all 7 tables) to user's local disk
 */
export const downloadSupabaseDatabaseDump = async (fallbackData?: {
  settings: any;
  flocks: any;
  productions: any;
  sales: any;
  expenses: any;
  stockAdjustments: any;
}): Promise<{
  success: boolean;
  message: string;
  totalRecords: number;
}> => {
  const client = getSupabaseClient();
  const config = getStoredSupabaseConfig();
  const dateStr = new Date().toISOString().split('T')[0];

  const dumpObject: Record<string, any> = {
    metadata: {
      appName: 'TelurPro Enterprise',
      description: 'Supabase Database Dump & Local Storage Backup',
      exportedAt: new Date().toISOString(),
      supabaseUrl: config.url || 'Local Storage Fallback Mode',
      version: '1.0.0',
    },
    tables: {},
  };

  let totalRecords = 0;
  let fetchedFromSupabase = false;

  if (client && isSupabaseConfigured()) {
    try {
      for (const t of REQUIRED_TABLES) {
        const { data, error } = await client.from(t.name).select('*');
        if (!error && Array.isArray(data)) {
          dumpObject.tables[t.name] = data;
          totalRecords += data.length;
          fetchedFromSupabase = true;
        } else {
          dumpObject.tables[t.name] = [];
        }
      }
    } catch (e) {
      console.warn('Notice: Failed fetching some Supabase tables for dump:', e);
    }
  }

  // If no records from Supabase (or offline), populate fallback data
  if (!fetchedFromSupabase && fallbackData) {
    dumpObject.tables = {
      farm_settings: fallbackData.settings ? [fallbackData.settings] : [],
      flocks: fallbackData.flocks || [],
      productions: fallbackData.productions || [],
      sales: fallbackData.sales || [],
      expenses: fallbackData.expenses || [],
      stock_adjustments: fallbackData.stockAdjustments || [],
    };
    totalRecords =
      (fallbackData.flocks?.length || 0) +
      (fallbackData.productions?.length || 0) +
      (fallbackData.sales?.length || 0) +
      (fallbackData.expenses?.length || 0) +
      (fallbackData.stockAdjustments?.length || 0) +
      1;
  }

  dumpObject.metadata.totalRecords = totalRecords;

  // Create & trigger file download to user's local disk
  const jsonString = JSON.stringify(dumpObject, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = url;
  downloadAnchor.download = `supabase_dump_telurpro_${dateStr}.json`;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);

  const sourceMsg = fetchedFromSupabase
    ? 'langsung dari server Supabase Cloud'
    : 'dari memori lokal sistem';

  return {
    success: true,
    message: `Dump database (${totalRecords} data ${sourceMsg}) berhasil diunduh ke penyimpanan lokal Anda!`,
    totalRecords,
  };
};
