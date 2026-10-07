import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppUser } from '../types';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

const STORAGE_KEYS = {
  SUPABASE_CONFIG: 'telurpro_supabase_config_v1',
  AUTH_USER: 'telurpro_current_user_v1',
  USERS_LIST: 'telurpro_users_list_v1',
};

// Initial default users for profile display
export const initialUsers: AppUser[] = [
  {
    id: 'USR-ADMIN',
    username: 'admin',
    fullName: 'Budi Santoso (Pemilik)',
    email: 'admin@sumberrejeki.com',
    role: 'admin',
    status: 'active',
    createdAt: '2026-10-01T08:00:00.000Z',
    lastLoginAt: '2026-10-06T20:00:00.000Z',
  },
  {
    id: 'USR-OP-1',
    username: 'operator',
    fullName: 'Kang Asep (Operator Kandang)',
    email: 'asep@sumberrejeki.com',
    role: 'operator',
    status: 'active',
    createdAt: '2026-10-02T08:00:00.000Z',
    lastLoginAt: '2026-10-06T15:30:00.000Z',
  },
  {
    id: 'USR-KASIR-1',
    username: 'kasir',
    fullName: 'Siti Rahma (Kasir Penjualan)',
    email: 'siti@sumberrejeki.com',
    role: 'kasir',
    status: 'active',
    createdAt: '2026-10-03T08:00:00.000Z',
    lastLoginAt: '2026-10-05T17:00:00.000Z',
  },
];

export const getStoredSupabaseConfig = (): SupabaseConfig => {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
  }

  const saved = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    } catch {
      // ignore
    }
  }

  return { url: '', anonKey: '' };
};

export const saveSupabaseConfig = (config: SupabaseConfig) => {
  localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(config));
  cachedClient = null; // reset cached instance
};

let cachedClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (cachedClient) return cachedClient;

  const config = getStoredSupabaseConfig();
  if (config.url && config.anonKey) {
    try {
      cachedClient = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return cachedClient;
    } catch (e) {
      console.error('Error initializing Supabase client:', e);
      return null;
    }
  }

  return null;
};

export const isSupabaseConfigured = (): boolean => {
  const config = getStoredSupabaseConfig();
  return Boolean(config.url && config.anonKey && config.url.startsWith('https://'));
};

export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase URL dan Anon Key belum diatur.',
    };
  }

  try {
    // Try pinging health or querying profiles table
    const { error } = await client.from('profiles').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      // 42P01 is table does not exist (connection still valid)
      return {
        success: false,
        message: `Koneksi gagal: ${error.message}`,
      };
    }
    return {
      success: true,
      message: 'Berhasil terhubung ke database Supabase!',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Gagal menjangkau server Supabase: ${msg}`,
    };
  }
};

// Local users state storage
export const getStoredUsers = (): AppUser[] => {
  const saved = localStorage.getItem(STORAGE_KEYS.USERS_LIST);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // fallback
    }
  }
  return initialUsers;
};

export const saveUsers = (users: AppUser[]) => {
  localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(users));
};

export const getStoredCurrentUser = (): AppUser | null => {
  const saved = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
};

export const saveCurrentUser = (user: AppUser | null) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  }
};
