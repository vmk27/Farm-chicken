import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  FarmSettings,
  ProductionRecord,
  SaleRecord,
  ExpenseRecord,
  StockAdjustmentRecord,
  ModalAllocationPercentages,
  DailySummary,
  ActiveTab,
  Flock,
  AppUser,
} from '../types';
import { initialFarmSettings, initialProductions, initialSales, initialExpenses, initialFlocks } from '../data/mockData';
import { getTodayDateString } from '../utils/formatters';
import {
  getStoredUsers,
  saveUsers,
  getStoredCurrentUser,
  saveCurrentUser,
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  getSupabaseClient,
  isSupabaseConfigured,
  testSupabaseConnection,
  SupabaseConfig,
} from '../services/supabase';

interface FarmContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  settings: FarmSettings;
  updateSettings: (newSettings: Partial<FarmSettings>) => void;
  updateAllocations: (newAllocations: ModalAllocationPercentages) => void;

  // Auth & User Management
  currentUser: AppUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  users: AppUser[];
  addUser: (userData: Omit<AppUser, 'id' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
  updateUser: (id: string, updated: Partial<AppUser>) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (id: string) => Promise<{ success: boolean; error?: string }>;
  supabaseConfig: SupabaseConfig;
  updateSupabaseConfig: (config: SupabaseConfig) => void;
  isSupabaseOnline: boolean;
  checkSupabaseStatus: () => Promise<boolean>;

  // Flocks / Kandang Management
  flocks: Flock[];
  addFlock: (flock: Omit<Flock, 'id'>) => Flock;
  updateFlock: (id: string, updated: Partial<Flock>) => void;
  deleteFlock: (id: string) => void;

  // Data
  productions: ProductionRecord[];
  sales: SaleRecord[];
  expenses: ExpenseRecord[];
  stockAdjustments: StockAdjustmentRecord[];

  // CRUD Production
  addProduction: (record: Omit<ProductionRecord, 'id' | 'createdAt'>) => void;
  updateProduction: (id: string, record: Partial<ProductionRecord>) => void;
  deleteProduction: (id: string) => void;

  // CRUD Sales
  addSale: (record: Omit<SaleRecord, 'id' | 'createdAt' | 'invoiceNumber'>) => SaleRecord;
  updateSale: (id: string, record: Partial<SaleRecord>) => void;
  deleteSale: (id: string) => void;
  markSalePaid: (id: string) => void;

  // Stock Adjustments
  addStockAdjustment: (record: Omit<StockAdjustmentRecord, 'id' | 'createdAt'>) => void;

  // Expenses
  addExpense: (record: Omit<ExpenseRecord, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;

  // Computed Real-Time Metrics
  todayDate: string;
  todayProductionKg: number;
  todayProductionEggs: number;
  todaySalesKg: number;
  todaySalesEggs: number;
  todayRevenue: number;
  todayEstimatedCost: number;
  todayProfit: number;

  totalStockKg: number;
  totalStockEggs: number;
  stockGradeA_Kg: number;
  stockGradeB_Kg: number;
  stockCracked_Kg: number;
  stockAssetValue: number;

  // Daily Profit Allocation Calculation for any given profit amount or date
  calculateAllocation: (profitAmount: number) => {
    pakan: number;
    pembelianAyam: number;
    upahKerja: number;
    vitaminVaksin: number;
    listrik: number;
    air: number;
    total: number;
  };

  // Aggregated Summaries
  dailySummaries: DailySummary[];
  getSummaryForDate: (date: string) => DailySummary | undefined;
  getSummaryForRange: (startDate: string, endDate: string) => {
    totalProductionKg: number;
    totalSalesKg: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    avgPricePerKg: number;
    allocation: {
      pakan: number;
      pembelianAyam: number;
      upahKerja: number;
      vitaminVaksin: number;
      listrik: number;
      air: number;
    };
  };

  // Pos Dana Modal Realisasi & Akumulasi
  allocatedVaults: {
    pakan: { allocated: number; spent: number; remaining: number };
    pembelianAyam: { allocated: number; spent: number; remaining: number };
    upahKerja: { allocated: number; spent: number; remaining: number };
    vitaminVaksin: { allocated: number; spent: number; remaining: number };
    listrik: { allocated: number; spent: number; remaining: number };
    air: { allocated: number; spent: number; remaining: number };
  };

  // Reset & Backup & Deletion
  resetToDefaultData: () => void;
  clearAllData: () => void;
  clearProductionData: () => void;
  clearSalesData: () => void;
  clearExpenseData: () => void;
  clearStockAdjustments: () => void;
  deleteStockAdjustment: (id: string) => void;
  exportDatabaseJSON: () => void;
  importDatabaseJSON: (jsonStr: string) => boolean;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SETTINGS: 'telurpro_settings_v1',
  FLOCKS: 'telurpro_flocks_v1',
  PRODUCTIONS: 'telurpro_productions_v1',
  SALES: 'telurpro_sales_v1',
  EXPENSES: 'telurpro_expenses_v1',
  ADJUSTMENTS: 'telurpro_adjustments_v1',
};

// Remote Row <-> Local Entity Converters for Realtime Supabase Sync
const mapProductionFromRemote = (row: any): ProductionRecord => ({
  id: row.id,
  date: row.date,
  flockId: row.flock_id || 'Kandang A',
  flockName: row.flock_name || row.flock_id || 'Kandang A',
  weightKgTotal: Number(row.weight_kg_total || 0),
  henPopulation: row.hen_population ? Number(row.hen_population) : undefined,
  operator: row.operator,
  notes: row.notes,
  createdAt: row.created_at || new Date().toISOString(),
});

const mapProductionToRemote = (rec: ProductionRecord) => ({
  id: rec.id,
  date: rec.date,
  flock_id: rec.flockId,
  flock_name: rec.flockName,
  weight_kg_total: rec.weightKgTotal,
  hen_population: rec.henPopulation || null,
  operator: rec.operator || null,
  notes: rec.notes || null,
  created_at: rec.createdAt,
});

const mapSaleFromRemote = (row: any): SaleRecord => ({
  id: row.id,
  invoiceNumber: row.invoice_number,
  date: row.date,
  grade: (row.grade as any) || 'Telur Standar',
  weightKg: Number(row.weight_kg || 0),
  pricePerKg: Number(row.price_per_kg || 0),
  subtotal: Number(row.subtotal || row.total_revenue || 0),
  discount: Number(row.discount || 0),
  totalRevenue: Number(row.total_revenue || 0),
  paymentStatus: (row.payment_status as any) || 'Lunas',
  paymentMethod: (row.payment_method as any) || 'Tunai',
  amountPaid: Number(row.amount_paid || 0),
  remainingDue: Number(row.remaining_due || 0),
  dueDate: row.due_date || undefined,
  notes: row.notes || undefined,
  createdAt: row.created_at || new Date().toISOString(),
});

const mapSaleToRemote = (rec: SaleRecord) => ({
  id: rec.id,
  invoice_number: rec.invoiceNumber,
  date: rec.date,
  grade: rec.grade || 'Telur Standar',
  weight_kg: rec.weightKg,
  price_per_kg: rec.pricePerKg,
  subtotal: rec.subtotal || rec.totalRevenue,
  discount: rec.discount || 0,
  total_revenue: rec.totalRevenue,
  payment_status: rec.paymentStatus || 'Lunas',
  payment_method: rec.paymentMethod || 'Tunai',
  amount_paid: rec.amountPaid || 0,
  remaining_due: rec.remainingDue || 0,
  due_date: rec.dueDate || null,
  notes: rec.notes || null,
  created_at: rec.createdAt,
});

const mapExpenseFromRemote = (row: any): ExpenseRecord => ({
  id: row.id,
  date: row.date,
  category: row.category,
  amount: Number(row.amount || 0),
  recipient: row.recipient || '',
  description: row.description || '',
  receiptNumber: row.receipt_number || undefined,
  createdAt: row.created_at || new Date().toISOString(),
});

const mapExpenseToRemote = (rec: ExpenseRecord) => ({
  id: rec.id,
  date: rec.date,
  category: rec.category,
  amount: rec.amount,
  recipient: rec.recipient || '',
  description: rec.description || '',
  receipt_number: rec.receiptNumber || null,
  created_at: rec.createdAt,
});

const mapStockAdjustmentFromRemote = (row: any): StockAdjustmentRecord => ({
  id: row.id,
  date: row.date,
  type: row.type,
  weightKg: Number(row.weight_kg || 0),
  reason: row.reason || '',
  operator: row.operator || '',
  createdAt: row.created_at || new Date().toISOString(),
});

const mapStockAdjustmentToRemote = (rec: StockAdjustmentRecord) => ({
  id: rec.id,
  date: rec.date,
  type: rec.type,
  weight_kg: rec.weightKg,
  reason: rec.reason,
  operator: rec.operator,
  created_at: rec.createdAt,
});

const mapFlockFromRemote = (row: any): Flock => ({
  id: row.id,
  name: row.name,
  breed: row.breed,
  henCount: Number(row.hen_count || 0),
  feedKgDaily: row.feed_kg_daily ? Number(row.feed_kg_daily) : undefined,
  operator: row.operator,
  notes: row.notes,
});

const mapFlockToRemote = (flock: Flock) => ({
  id: flock.id,
  name: flock.name,
  breed: flock.breed || 'Lohmann Brown',
  hen_count: flock.henCount,
  feed_kg_daily: flock.feedKgDaily || 0,
  operator: flock.operator || null,
  notes: flock.notes || null,
});

const mapSettingsFromRemote = (row: any, prevSettings: FarmSettings): FarmSettings => ({
  ...prevSettings,
  farmName: row.farm_name || prevSettings.farmName,
  tagline: row.tagline || prevSettings.tagline,
  ownerName: row.owner_name || prevSettings.ownerName,
  phone: row.phone || prevSettings.phone,
  address: row.address || prevSettings.address,
  currentMarketPricePerKg: row.current_market_price_per_kg ? Number(row.current_market_price_per_kg) : prevSettings.currentMarketPricePerKg,
  lowStockThresholdKg: row.low_stock_threshold_kg ? Number(row.low_stock_threshold_kg) : prevSettings.lowStockThresholdKg,
  allocations: {
    pakan: row.alloc_pakan !== undefined && row.alloc_pakan !== null ? Number(row.alloc_pakan) : prevSettings.allocations.pakan,
    pembelianAyam: row.alloc_pembelian_ayam !== undefined && row.alloc_pembelian_ayam !== null ? Number(row.alloc_pembelian_ayam) : prevSettings.allocations.pembelianAyam,
    upahKerja: row.alloc_upah_kerja !== undefined && row.alloc_upah_kerja !== null ? Number(row.alloc_upah_kerja) : prevSettings.allocations.upahKerja,
    vitaminVaksin: row.alloc_vitamin_vaksin !== undefined && row.alloc_vitamin_vaksin !== null ? Number(row.alloc_vitamin_vaksin) : prevSettings.allocations.vitaminVaksin,
    listrik: row.alloc_listrik !== undefined && row.alloc_listrik !== null ? Number(row.alloc_listrik) : prevSettings.allocations.listrik,
    air: row.alloc_air !== undefined && row.alloc_air !== null ? Number(row.alloc_air) : prevSettings.allocations.air,
  },
});

const mapSettingsToRemote = (settings: FarmSettings) => ({
  id: 'default_settings',
  farm_name: settings.farmName,
  tagline: settings.tagline,
  owner_name: settings.ownerName,
  phone: settings.phone,
  address: settings.address,
  current_market_price_per_kg: settings.currentMarketPricePerKg,
  low_stock_threshold_kg: settings.lowStockThresholdKg,
  alloc_pakan: settings.allocations.pakan,
  alloc_pembelian_ayam: settings.allocations.pembelianAyam,
  alloc_upah_kerja: settings.allocations.upahKerja,
  alloc_vitamin_vaksin: settings.allocations.vitaminVaksin,
  alloc_listrik: settings.allocations.listrik,
  alloc_air: settings.allocations.air,
  updated_at: new Date().toISOString(),
});

const mapUserFromRemote = (row: any): AppUser => ({
  id: row.id,
  username: row.username,
  fullName: row.full_name || row.username,
  email: row.email || `${row.username}@sumberrejeki.com`,
  role: row.role || 'operator',
  status: row.status || 'active',
  createdAt: row.created_at || new Date().toISOString(),
  lastLoginAt: row.last_login_at,
});

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Auth & User State
  const [currentUser, setCurrentUser] = useState<AppUser | null>(getStoredCurrentUser);
  const [users, setUsers] = useState<AppUser[]>(getStoredUsers);
  const [supabaseConfig, setSupabaseConfigState] = useState<SupabaseConfig>(getStoredSupabaseConfig);
  const [isSupabaseOnline, setIsSupabaseOnline] = useState<boolean>(false);

  const checkSupabaseStatus = async (): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
      setIsSupabaseOnline(false);
      return false;
    }
    const res = await testSupabaseConnection();
    setIsSupabaseOnline(res.success);
    return res.success;
  };

  useEffect(() => {
    checkSupabaseStatus();
  }, [supabaseConfig]);

  // Restore Supabase Auth session and subscribe to auth state changes
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) return;

    client.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        const u = data.session.user;
        client
          .from('profiles')
          .select('*')
          .eq('id', u.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) {
              const activeUser: AppUser = {
                id: profile.id,
                username: profile.username,
                fullName: profile.full_name || profile.username,
                email: profile.email || u.email,
                role: profile.role || 'operator',
                status: profile.status || 'active',
                createdAt: profile.created_at || new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
              };
              setCurrentUser(activeUser);
              saveCurrentUser(activeUser);
            }
          });
      }
    });

    const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setCurrentUser(null);
        saveCurrentUser(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [supabaseConfig]);

  const updateSupabaseConfig = (newConfig: SupabaseConfig) => {
    setSupabaseConfigState(newConfig);
    saveSupabaseConfig(newConfig);
  };

  // Database-First Supabase Auth & Profile Login
  const login = async (usernameInput: string, passwordInput: string): Promise<{ success: boolean; error?: string }> => {
    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, error: 'Username/email dan password wajib diisi.' };
    }

    const client = getSupabaseClient();

    if (client && isSupabaseConfigured()) {
      try {
        // 1. Direct Database Query: Retrieve user profile from public.profiles table first
        let dbProfile: any = null;
        try {
          const { data: foundProfile } = await client
            .from('profiles')
            .select('*')
            .or(`username.eq.${cleanUser},email.eq.${cleanUser}`)
            .maybeSingle();
          dbProfile = foundProfile;
        } catch (err) {
          console.warn('Direct database profile lookup notice:', err);
        }

        // If user is inactive in database, reject login immediately
        if (dbProfile && dbProfile.status === 'inactive') {
          return { success: false, error: 'Akun Anda saat ini nonaktif. Hubungi admin sistem.' };
        }

        const emailToTry = dbProfile?.email || (cleanUser.includes('@') ? cleanUser : `${cleanUser}@sumberrejeki.com`);

        // 2. Perform Supabase Auth signInWithPassword
        const signInRes = await client.auth.signInWithPassword({
          email: emailToTry,
          password: cleanPass,
        });

        let authUser = signInRes.data?.user;

        // 3. Handle authentication failures & verify password strictly
        if (signInRes.error || !authUser) {
          // If the profile already exists in public.profiles table, any signIn error is a WRONG PASSWORD!
          if (dbProfile) {
            return {
              success: false,
              error: 'Username atau kata sandi yang Anda masukkan tidak sesuai.',
            };
          }

          // If the profile doesn't exist yet (e.g. first login of default system roles: admin, operator, kasir)
          const defaultRole = cleanUser.includes('admin') ? 'admin' : cleanUser.includes('kasir') ? 'kasir' : 'operator';
          const userFullName = cleanUser === 'admin' ? 'Budi Santoso (Pemilik)' : cleanUser === 'kasir' ? 'Siti Rahma (Kasir)' : 'Kang Asep (Operator)';

          const signUpRes = await client.auth.signUp({
            email: emailToTry,
            password: cleanPass,
            options: {
              data: {
                username: cleanUser,
                full_name: userFullName,
                role: defaultRole,
              },
            },
          });

          if (signUpRes.data?.user && !signUpRes.error) {
            authUser = signUpRes.data.user;
          } else {
            return {
              success: false,
              error: 'Username atau kata sandi yang Anda masukkan tidak sesuai.',
            };
          }
        }

        // 4. Build user entity strictly using Database Profile data
        const resolvedUserId = authUser.id;
        const resolvedRole = (dbProfile?.role as AppUser['role']) || (cleanUser.includes('admin') ? 'admin' : cleanUser.includes('kasir') ? 'kasir' : 'operator');
        const resolvedFullName = dbProfile?.full_name || (authUser.user_metadata?.full_name as string) || cleanUser;

        // Ensure database profile is synchronized
        try {
          await client.from('profiles').upsert([
            {
              id: resolvedUserId,
              username: dbProfile?.username || cleanUser,
              full_name: resolvedFullName,
              email: emailToTry,
              role: resolvedRole,
              status: dbProfile?.status || 'active',
              updated_at: new Date().toISOString(),
            },
          ]);
        } catch {
          // ignore
        }

        const loggedUser: AppUser = {
          id: resolvedUserId,
          username: dbProfile?.username || cleanUser,
          fullName: resolvedFullName,
          email: emailToTry,
          role: resolvedRole,
          status: dbProfile?.status || 'active',
          createdAt: dbProfile?.created_at || authUser?.created_at || new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };

        setCurrentUser(loggedUser);
        saveCurrentUser(loggedUser);
        setIsSupabaseOnline(true);
        return { success: true };
      } catch (err) {
        console.warn('Database login attempt notice:', err);
      }
    }

    // Local profile fallback if Supabase is offline or unconfigured
    const found = users.find(
      (u) => u.username.toLowerCase() === cleanUser || (u.email && u.email.toLowerCase() === cleanUser)
    );

    if (found) {
      if (found.status === 'inactive') {
        return { success: false, error: 'Akun Anda dinonaktifkan. Hubungi admin sistem.' };
      }
      const updatedUser: AppUser = { ...found, lastLoginAt: new Date().toISOString() };
      setCurrentUser(updatedUser);
      saveCurrentUser(updatedUser);
      return { success: true };
    }

    if (['admin', 'operator', 'kasir'].includes(cleanUser)) {
      const defaultRole = cleanUser as AppUser['role'];
      const defaultUser: AppUser = {
        id: `USR-${cleanUser.toUpperCase()}`,
        username: cleanUser,
        fullName: cleanUser === 'admin' ? 'Budi Santoso (Pemilik)' : cleanUser === 'kasir' ? 'Siti Rahma (Kasir)' : 'Kang Asep (Operator)',
        email: `${cleanUser}@sumberrejeki.com`,
        role: defaultRole,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      setCurrentUser(defaultUser);
      saveCurrentUser(defaultUser);
      return { success: true };
    }

    return {
      success: false,
      error: 'Username/email atau password tidak valid.',
    };
  };

  const logout = () => {
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      client.auth.signOut().catch(console.error);
    }
    setCurrentUser(null);
    saveCurrentUser(null);
  };

  const addUser = async (userData: { username: string; fullName: string; role: AppUser['role']; status: 'active' | 'inactive'; email?: string; password?: string }): Promise<{ success: boolean; error?: string }> => {
    const cleanUsername = userData.username.trim().toLowerCase();
    const cleanFullName = userData.fullName.trim();
    const userEmail = userData.email?.trim() || `${cleanUsername}@sumberrejeki.com`;
    const userPassword = userData.password || 'UserPassword123!';

    const tempUserId = `USR-${Date.now().toString().slice(-6)}`;
    const newUser: AppUser = {
      id: tempUserId,
      username: cleanUsername,
      fullName: cleanFullName,
      email: userEmail,
      role: userData.role,
      status: userData.status,
      createdAt: new Date().toISOString(),
      lastLoginAt: undefined,
    };

    // 1. Instantly update React users state and localStorage so user appears in UI table
    const nextUsers = [newUser, ...users.filter((u) => u.username !== cleanUsername)];
    setUsers(nextUsers);
    saveUsers(nextUsers);

    // 2. Sync to Supabase Auth & database tables
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        let supabaseUserId = tempUserId;

        // Try registering in Supabase Auth
        const { data: authData, error: authError } = await client.auth.signUp({
          email: userEmail,
          password: userPassword,
          options: {
            data: {
              username: cleanUsername,
              full_name: cleanFullName,
              role: userData.role,
            },
          },
        });

        if (authError) {
          const errMsg = authError.message.toLowerCase();
          if (errMsg.includes('rate limit') || errMsg.includes('exceeded') || authError.status === 429) {
            return {
              success: false,
              error: 'Batas pendaftaran pengguna baru terlampaui (Rate Limit Exceeded). Supabase membatasi pembuatan akun baru dalam waktu singkat. Silakan tunggu 1-2 menit sebelum mencoba lagi.',
            };
          }
          if (!errMsg.includes('already registered')) {
            return {
              success: false,
              error: `Gagal mendaftarkan pengguna ke Supabase Auth: ${authError.message}`,
            };
          }
        }

        if (authData?.user?.id) {
          supabaseUserId = authData.user.id;
          const syncedUser = { ...newUser, id: supabaseUserId };
          const updatedList = [syncedUser, ...nextUsers.filter((u) => u.id !== tempUserId && u.username !== cleanUsername)];
          setUsers(updatedList);
          saveUsers(updatedList);
        }

        // Upsert into public.profiles
        await client.from('profiles').upsert([
          {
            id: supabaseUserId,
            username: cleanUsername,
            full_name: cleanFullName,
            email: userEmail,
            role: userData.role,
            status: userData.status,
            updated_at: new Date().toISOString(),
          },
        ]);

        // Upsert into public.users if table exists
        try {
          await client.from('users').upsert([
            {
              id: supabaseUserId,
              username: cleanUsername,
              full_name: cleanFullName,
              email: userEmail,
              role: userData.role,
              status: userData.status,
              created_at: new Date().toISOString(),
            },
          ]);
        } catch {
          // ignore if table doesn't exist
        }

      } catch (err: any) {
        console.warn('Supabase user database sync notice:', err);
      }
    }

    return { success: true };
  };

  const updateUser = async (id: string, updated: Partial<AppUser>): Promise<{ success: boolean; error?: string }> => {
    const nextUsers = users.map((u) => (u.id === id ? { ...u, ...updated } : u));
    setUsers(nextUsers);
    saveUsers(nextUsers);

    if (currentUser?.id === id) {
      const updatedCur = { ...currentUser, ...updated };
      setCurrentUser(updatedCur);
      saveCurrentUser(updatedCur);
    }

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        await client.from('profiles').update({
          full_name: updated.fullName,
          role: updated.role,
          status: updated.status,
        }).eq('id', id);
      } catch (err) {
        console.warn('Supabase profiles update notice:', err);
      }
    }

    return { success: true };
  };

  const deleteUser = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.id === id) {
      return { success: false, error: 'Tidak dapat menghapus akun yang sedang Anda gunakan.' };
    }

    const nextUsers = users.filter((u) => u.id !== id);
    setUsers(nextUsers);
    saveUsers(nextUsers);

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        await client.from('profiles').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase profiles delete notice:', err);
      }
    }

    return { success: true };
  };

  // Load initial states from LocalStorage or defaults
  const [settings, setSettings] = useState<FarmSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialFarmSettings;
  });

  const [flocks, setFlocks] = useState<Flock[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FLOCKS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialFlocks;
  });

  const [productions, setProductions] = useState<ProductionRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTIONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialProductions;
  });

  const [sales, setSales] = useState<SaleRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialSales;
  });

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialExpenses;
  });

  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustmentRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADJUSTMENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 'ADJ-INIT-1',
        date: '2026-10-04',
        type: 'Penyesuaian Rusak/Pecah',
        weightKg: 8.5,
        reason: 'Pecah saat pemindahan rak telur ke mobil pickup',
        operator: 'Kang Asep',
        createdAt: '2026-10-04T16:00:00.000Z',
      },
    ];
  });

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FLOCKS, JSON.stringify(flocks));
  }, [flocks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTIONS, JSON.stringify(productions));
  }, [productions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADJUSTMENTS, JSON.stringify(stockAdjustments));
  }, [stockAdjustments]);

  // Realtime Supabase Data Fetch & Subscription Listener for Multi-User Live Sync
  useEffect(() => {
    const fetchAllSupabaseData = async () => {
      const client = getSupabaseClient();
      if (!client || !isSupabaseConfigured()) return;

      try {
        // 1. Settings
        const { data: setRows } = await client.from('farm_settings').select('*').limit(1);
        if (setRows && setRows.length > 0) {
          setSettings((prev) => mapSettingsFromRemote(setRows[0], prev));
        }

        // 2. Flocks
        const { data: flockRows } = await client.from('flocks').select('*').order('created_at', { ascending: true });
        if (flockRows && flockRows.length > 0) {
          setFlocks(flockRows.map(mapFlockFromRemote));
        }

        // 3. Productions
        const { data: prodRows } = await client.from('productions').select('*').order('date', { ascending: false });
        if (prodRows && prodRows.length > 0) {
          setProductions(prodRows.map(mapProductionFromRemote));
        }

        // 4. Sales
        const { data: saleRows } = await client.from('sales').select('*').order('date', { ascending: false });
        if (saleRows && saleRows.length > 0) {
          setSales(saleRows.map(mapSaleFromRemote));
        }

        // 5. Expenses
        const { data: expRows } = await client.from('expenses').select('*').order('date', { ascending: false });
        if (expRows && expRows.length > 0) {
          setExpenses(expRows.map(mapExpenseFromRemote));
        }

        // 6. Stock Adjustments
        const { data: adjRows } = await client.from('stock_adjustments').select('*').order('date', { ascending: false });
        if (adjRows && adjRows.length > 0) {
          setStockAdjustments(adjRows.map(mapStockAdjustmentFromRemote));
        }

        // 7. Users
        const { data: userRows } = await client.from('users').select('*').order('created_at', { ascending: true });
        if (userRows && userRows.length > 0) {
          setUsers(userRows.map(mapUserFromRemote));
        }
      } catch (err) {
        console.warn('Supabase initial fetch notice:', err);
      }
    };

    fetchAllSupabaseData();

    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) return;

    // Realtime postgres_changes listener for multi-user synchronization
    const channel = client
      .channel('telurpro_realtime_sync_v2')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          const { table, eventType, new: newRow, old: oldRow } = payload;

          if (table === 'productions') {
            if (eventType === 'INSERT' && newRow) {
              const item = mapProductionFromRemote(newRow);
              setProductions((prev) => [item, ...prev.filter((p) => p.id !== item.id)]);
            } else if (eventType === 'UPDATE' && newRow) {
              const item = mapProductionFromRemote(newRow);
              setProductions((prev) => prev.map((p) => (p.id === item.id ? item : p)));
            } else if (eventType === 'DELETE' && oldRow?.id) {
              setProductions((prev) => prev.filter((p) => p.id !== oldRow.id));
            }
          } else if (table === 'sales') {
            if (eventType === 'INSERT' && newRow) {
              const item = mapSaleFromRemote(newRow);
              setSales((prev) => [item, ...prev.filter((s) => s.id !== item.id)]);
            } else if (eventType === 'UPDATE' && newRow) {
              const item = mapSaleFromRemote(newRow);
              setSales((prev) => prev.map((s) => (s.id === item.id ? item : s)));
            } else if (eventType === 'DELETE' && oldRow?.id) {
              setSales((prev) => prev.filter((s) => s.id !== oldRow.id));
            }
          } else if (table === 'expenses') {
            if (eventType === 'INSERT' && newRow) {
              const item = mapExpenseFromRemote(newRow);
              setExpenses((prev) => [item, ...prev.filter((e) => e.id !== item.id)]);
            } else if (eventType === 'UPDATE' && newRow) {
              const item = mapExpenseFromRemote(newRow);
              setExpenses((prev) => prev.map((e) => (e.id === item.id ? item : e)));
            } else if (eventType === 'DELETE' && oldRow?.id) {
              setExpenses((prev) => prev.filter((e) => e.id !== oldRow.id));
            }
          } else if (table === 'stock_adjustments') {
            if (eventType === 'INSERT' && newRow) {
              const item = mapStockAdjustmentFromRemote(newRow);
              setStockAdjustments((prev) => [item, ...prev.filter((a) => a.id !== item.id)]);
            } else if (eventType === 'UPDATE' && newRow) {
              const item = mapStockAdjustmentFromRemote(newRow);
              setStockAdjustments((prev) => prev.map((a) => (a.id === item.id ? item : a)));
            } else if (eventType === 'DELETE' && oldRow?.id) {
              setStockAdjustments((prev) => prev.filter((a) => a.id !== oldRow.id));
            }
          } else if (table === 'flocks') {
            if (eventType === 'INSERT' && newRow) {
              const item = mapFlockFromRemote(newRow);
              setFlocks((prev) => [...prev.filter((f) => f.id !== item.id), item]);
            } else if (eventType === 'UPDATE' && newRow) {
              const item = mapFlockFromRemote(newRow);
              setFlocks((prev) => prev.map((f) => (f.id === item.id ? item : f)));
            } else if (eventType === 'DELETE' && oldRow?.id) {
              setFlocks((prev) => prev.filter((f) => f.id !== oldRow.id));
            }
          } else if (table === 'farm_settings') {
            if ((eventType === 'INSERT' || eventType === 'UPDATE') && newRow) {
              setSettings((prev) => mapSettingsFromRemote(newRow, prev));
            }
          } else if (table === 'users') {
            if (eventType === 'INSERT' && newRow) {
              const item = mapUserFromRemote(newRow);
              setUsers((prev) => [...prev.filter((u) => u.id !== item.id), item]);
            } else if (eventType === 'UPDATE' && newRow) {
              const item = mapUserFromRemote(newRow);
              setUsers((prev) => prev.map((u) => (u.id === item.id ? item : u)));
            } else if (eventType === 'DELETE' && oldRow?.id) {
              setUsers((prev) => prev.filter((u) => u.id !== oldRow.id));
            }
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [supabaseConfig]);

  // Today Date
  const todayDate = useMemo(() => {
    const dates = [...productions.map((p) => p.date), ...sales.map((s) => s.date)].sort();
    return dates.length > 0 ? dates[dates.length - 1] : getTodayDateString();
  }, [productions, sales]);

  // Settings Handlers
  const updateSettings = (newSettings: Partial<FarmSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      const client = getSupabaseClient();
      if (client && isSupabaseConfigured()) {
        client.from('farm_settings').upsert([mapSettingsToRemote(updated)]).then(({ error }) => {
          if (error) console.error('Supabase settings update error:', error);
        });
      }
      return updated;
    });
  };

  const updateAllocations = (newAllocations: ModalAllocationPercentages) => {
    setSettings((prev) => {
      const updated = { ...prev, allocations: newAllocations };
      const client = getSupabaseClient();
      if (client && isSupabaseConfigured()) {
        client.from('farm_settings').upsert([mapSettingsToRemote(updated)]).then(({ error }) => {
          if (error) console.error('Supabase allocations update error:', error);
        });
      }
      return updated;
    });
  };

  // CRUD Flocks / Kandang
  const addFlock = (flockData: Omit<Flock, 'id'>): Flock => {
    const id = `FLOCK-${Date.now().toString().slice(-6)}`;
    const newFlock: Flock = { ...flockData, id };
    setFlocks((prev) => [...prev, newFlock]);

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      client.from('flocks').insert([mapFlockToRemote(newFlock)]).then(({ error }) => {
        if (error) console.error('Supabase flock insert error:', error);
      });
    }
    return newFlock;
  };

  const updateFlock = (id: string, updatedFields: Partial<Flock>) => {
    setFlocks((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, ...updatedFields } : item));
      const target = next.find((f) => f.id === id);
      if (target) {
        const client = getSupabaseClient();
        if (client && isSupabaseConfigured()) {
          client.from('flocks').update(mapFlockToRemote(target)).eq('id', id).then(({ error }) => {
            if (error) console.error('Supabase flock update error:', error);
          });
        }
      }
      return next;
    });
  };

  const deleteFlock = (id: string) => {
    setFlocks((prev) => prev.filter((item) => item.id !== id));
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      client.from('flocks').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase flock delete error:', error);
      });
    }
  };

  // CRUD Production
  const addProduction = (record: Omit<ProductionRecord, 'id' | 'createdAt'>) => {
    const newRecord: ProductionRecord = {
      ...record,
      id: `PROD-${record.date}-${Date.now().toString().slice(-5)}`,
      createdAt: new Date().toISOString(),
    };
    setProductions((prev) => [newRecord, ...prev]);

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      client.from('productions').insert([mapProductionToRemote(newRecord)]).then(({ error }) => {
        if (error) console.error('Supabase production insert error:', error);
      });
    }
  };

  const updateProduction = (id: string, updatedFields: Partial<ProductionRecord>) => {
    setProductions((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, ...updatedFields } : item));
      const target = next.find((p) => p.id === id);
      if (target) {
        const client = getSupabaseClient();
        if (client && isSupabaseConfigured()) {
          client.from('productions').update(mapProductionToRemote(target)).eq('id', id).then(({ error }) => {
            if (error) console.error('Supabase production update error:', error);
          });
        }
      }
      return next;
    });
  };

  const deleteProduction = (id: string) => {
    setProductions((prev) => prev.filter((item) => item.id !== id));
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      client.from('productions').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase production delete error:', error);
      });
    }
  };

  // CRUD Sales
  const addSale = (record: Omit<SaleRecord, 'id' | 'createdAt' | 'invoiceNumber'>): SaleRecord => {
    const timestamp = Date.now();
    const invoiceNumber = `INV-${record.date.replace(/-/g, '')}-${String(timestamp).slice(-4)}`;
    const newSale: SaleRecord = {
      ...record,
      id: `SALE-${timestamp}`,
      invoiceNumber,
      createdAt: new Date().toISOString(),
    };
    setSales((prev) => [newSale, ...prev]);

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      client.from('sales').insert([mapSaleToRemote(newSale)]).then(({ error }) => {
        if (error) console.error('Supabase sale insert error:', error);
      });
    }
    return newSale;
  };

  const updateSale = (id: string, updatedFields: Partial<SaleRecord>) => {
    setSales((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, ...updatedFields } : item));
      const target = next.find((s) => s.id === id);
      if (target) {
        const client = getSupabaseClient();
        if (client && isSupabaseConfigured()) {
          client.from('sales').update(mapSaleToRemote(target)).eq('id', id).then(({ error }) => {
            if (error) console.error('Supabase sale update error:', error);
          });
        }
      }
      return next;
    });
  };

  const deleteSale = (id: string) => {
    setSales((prev) => prev.filter((item) => item.id !== id));
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      client.from('sales').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase sale delete error:', error);
      });
    }
  };

  const markSalePaid = (id: string) => {
    setSales((prev) => {
      const next = prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            paymentStatus: 'Lunas' as const,
            amountPaid: item.totalRevenue,
            remainingDue: 0,
          };
        }
        return item;
      });
      const target = next.find((s) => s.id === id);
      if (target) {
        const client = getSupabaseClient();
        if (client && isSupabaseConfigured()) {
          client
            .from('sales')
            .update({
              payment_status: 'Lunas',
              amount_paid: target.totalRevenue,
              remaining_due: 0,
            })
            .eq('id', id)
            .then(({ error }) => {
              if (error) console.error('Supabase sale mark paid error:', error);
            });
        }
      }
      return next;
    });
  };

  const addStockAdjustment = (record: Omit<StockAdjustmentRecord, 'id' | 'createdAt'>) => {
    const newAdj: StockAdjustmentRecord = {
      ...record,
      id: `ADJ-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
    };
    setStockAdjustments((prev) => [newAdj, ...prev]);

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      client.from('stock_adjustments').insert([mapStockAdjustmentToRemote(newAdj)]).then(({ error }) => {
        if (error) console.error('Supabase stock adjustment insert error:', error);
      });
    }
  };

  const addExpense = (record: Omit<ExpenseRecord, 'id' | 'createdAt'>) => {
    const newExp: ExpenseRecord = {
      ...record,
      id: `EXP-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExp, ...prev]);

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      client.from('expenses').insert([mapExpenseToRemote(newExp)]).then(({ error }) => {
        if (error) console.error('Supabase expense insert error:', error);
      });
    }
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      client.from('expenses').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Supabase expense delete error:', error);
      });
    }
  };

  // Total Lifetime & Realtime Stocks Computation
  const { totalStockKg, stockGradeA_Kg, stockGradeB_Kg, stockCracked_Kg, totalStockEggs, stockAssetValue } =
    useMemo(() => {
      // Production totals
      let totalProdKg = 0;
      let prodA = 0;
      let prodB = 0;
      let prodCracked = 0;
      let prodEggs = 0;

      productions.forEach((p) => {
        totalProdKg += p.weightKgTotal || 0;
        prodA += p.gradeA_Kg || 0;
        prodB += p.gradeB_Kg || 0;
        prodCracked += p.cracked_Kg || 0;
        prodEggs += p.eggCountTotal || (p.weightKgTotal ? Math.round(p.weightKgTotal * 16) : 0);
      });

      // Sales deductions
      let totalSoldKg = 0;
      let soldA = 0;
      let soldB = 0;
      let soldCracked = 0;
      let soldGeneralKg = 0;
      let soldEggs = 0;

      sales.forEach((s) => {
        totalSoldKg += s.weightKg || 0;
        soldEggs += s.eggCountEstimated || Math.round(s.weightKg * 16);
        if (s.grade === 'Grade A (Super)') soldA += s.weightKg;
        else if (s.grade === 'Grade B (Standar)') soldB += s.weightKg;
        else if (s.grade === 'Retak / Reject') soldCracked += s.weightKg;
        else soldGeneralKg += s.weightKg;
      });

      // Adjustments deductions
      let adjKg = 0;
      stockAdjustments.forEach((a) => {
        adjKg += a.weightKg || 0;
      });

      // Unified total stock
      const totalKg = Math.max(0, totalProdKg - totalSoldKg - adjKg);

      // Distribute graded stock if available
      const totalGradedProd = prodA + prodB + prodCracked;
      let remA = 0;
      let remB = 0;
      let remCracked = 0;

      if (totalGradedProd > 0) {
        const soldA_Total = soldA + soldGeneralKg * (prodA / totalGradedProd);
        const soldB_Total = soldB + soldGeneralKg * (prodB / totalGradedProd);
        const soldCracked_Total = soldCracked + soldGeneralKg * (prodCracked / totalGradedProd) + adjKg;

        remA = Math.max(0, prodA - soldA_Total);
        remB = Math.max(0, prodB - soldB_Total);
        remCracked = Math.max(0, prodCracked - soldCracked_Total);
      } else {
        remA = totalKg;
      }

      const totalEggs = Math.max(0, Math.round(totalKg * (settings.defaultEggCountPerKg || 16)));
      const assetVal = totalKg * (settings.currentMarketPricePerKg || 28500);

      return {
        totalStockKg: Number(totalKg.toFixed(1)),
        stockGradeA_Kg: Number(remA.toFixed(1)),
        stockGradeB_Kg: Number(remB.toFixed(1)),
        stockCracked_Kg: Number(remCracked.toFixed(1)),
        totalStockEggs: totalEggs,
        stockAssetValue: Math.round(assetVal),
      };
    }, [productions, sales, stockAdjustments, settings]);

  // Today Metrics
  const {
    todayProductionKg,
    todayProductionEggs,
    todaySalesKg,
    todaySalesEggs,
    todayRevenue,
    todayEstimatedCost,
    todayProfit,
  } = useMemo(() => {
    const dayProds = productions.filter((p) => p.date === todayDate);
    const daySales = sales.filter((s) => s.date === todayDate);

    const prodKg = dayProds.reduce((acc, curr) => acc + curr.weightKgTotal, 0);
    const prodEggs = dayProds.reduce((acc, curr) => acc + (curr.eggCountTotal || Math.round(curr.weightKgTotal * 16)), 0);

    const sKg = daySales.reduce((acc, curr) => acc + curr.weightKg, 0);
    const sEggs = daySales.reduce((acc, curr) => acc + (curr.eggCountEstimated || curr.weightKg * 16), 0);
    const rev = daySales.reduce((acc, curr) => acc + curr.totalRevenue, 0);

    // Realistic Production Cost calculation (HPP / Cost of Production per kg is around ~Rp 19.500 - 20.500 per kg)
    // Or based on actual daily feed consumption
    const estimatedCostPerKg = 20000;
    const estCost = Math.round(sKg * estimatedCostPerKg);
    const profit = Math.max(0, rev - estCost);

    return {
      todayProductionKg: Number(prodKg.toFixed(1)),
      todayProductionEggs: prodEggs,
      todaySalesKg: Number(sKg.toFixed(1)),
      todaySalesEggs: Math.round(sEggs),
      todayRevenue: rev,
      todayEstimatedCost: estCost,
      todayProfit: profit,
    };
  }, [productions, sales, todayDate]);

  // Daily Profit Allocation Formula (User specified: Pakan 63%, Ayam 20%, Upah 12%, Vitamin/Vaksin 3.5%, Listrik 0.5%, Air 0.5%)
  const calculateAllocation = (profitAmount: number) => {
    const validProfit = Math.max(0, profitAmount);
    const alloc = settings.allocations;

    const pakan = Math.round(validProfit * (alloc.pakan / 100));
    const pembelianAyam = Math.round(validProfit * (alloc.pembelianAyam / 100));
    const upahKerja = Math.round(validProfit * (alloc.upahKerja / 100));
    const vitaminVaksin = Math.round(validProfit * (alloc.vitaminVaksin / 100));
    const listrik = Math.round(validProfit * (alloc.listrik / 100));
    const air = Math.round(validProfit * (alloc.air / 100));

    return {
      pakan,
      pembelianAyam,
      upahKerja,
      vitaminVaksin,
      listrik,
      air,
      total: pakan + pembelianAyam + upahKerja + vitaminVaksin + listrik + air,
    };
  };

  // Build full daily summaries
  const dailySummaries = useMemo(() => {
    // Unique list of dates sorted ascending
    const dateSet = new Set<string>();
    productions.forEach((p) => dateSet.add(p.date));
    sales.forEach((s) => dateSet.add(s.date));

    const sortedDates = Array.from(dateSet).sort();

    let rollingStockKg = 120; // initial starting inventory buffer

    const summaries: DailySummary[] = [];

    sortedDates.forEach((d) => {
      const dayProds = productions.filter((p) => p.date === d);
      const daySales = sales.filter((s) => s.date === d);

      const prodKg = dayProds.reduce((acc, curr) => acc + curr.weightKgTotal, 0);
      const prodEggs = dayProds.reduce((acc, curr) => acc + (curr.eggCountTotal || Math.round(curr.weightKgTotal * 16)), 0);

      const sKg = daySales.reduce((acc, curr) => acc + curr.weightKg, 0);
      const sEggs = daySales.reduce((acc, curr) => acc + (curr.eggCountEstimated || curr.weightKg * 16), 0);
      const rev = daySales.reduce((acc, curr) => acc + curr.totalRevenue, 0);

      const estCost = Math.round(sKg * 20000);
      const profit = Math.max(0, rev - estCost);

      rollingStockKg = Math.max(0, rollingStockKg + prodKg - sKg);

      const avgPrice = sKg > 0 ? Math.round(rev / sKg) : settings.currentMarketPricePerKg;

      const alloc = calculateAllocation(profit);

      summaries.push({
        date: d,
        totalProductionKg: Number(prodKg.toFixed(1)),
        totalProductionEggs: prodEggs,
        totalSalesKg: Number(sKg.toFixed(1)),
        totalSalesEggs: Math.round(sEggs),
        totalRevenue: rev,
        estimatedCost: estCost,
        netProfit: profit,
        stockEndKg: Number(rollingStockKg.toFixed(1)),
        avgSellingPricePerKg: avgPrice,
        modalAllocation: {
          pakan: alloc.pakan,
          pembelianAyam: alloc.pembelianAyam,
          upahKerja: alloc.upahKerja,
          vitaminVaksin: alloc.vitaminVaksin,
          listrik: alloc.listrik,
          air: alloc.air,
        },
      });
    });

    return summaries;
  }, [productions, sales, settings]);

  const getSummaryForDate = (date: string) => {
    return dailySummaries.find((s) => s.date === date);
  };

  const getSummaryForRange = (startDate: string, endDate: string) => {
    const inRange = dailySummaries.filter((s) => s.date >= startDate && s.date <= endDate);

    const totalProductionKg = inRange.reduce((acc, curr) => acc + curr.totalProductionKg, 0);
    const totalSalesKg = inRange.reduce((acc, curr) => acc + curr.totalSalesKg, 0);
    const totalRevenue = inRange.reduce((acc, curr) => acc + curr.totalRevenue, 0);
    const totalCost = inRange.reduce((acc, curr) => acc + curr.estimatedCost, 0);
    const totalProfit = inRange.reduce((acc, curr) => acc + curr.netProfit, 0);
    const avgPricePerKg = totalSalesKg > 0 ? Math.round(totalRevenue / totalSalesKg) : settings.currentMarketPricePerKg;

    const allocation = calculateAllocation(totalProfit);

    return {
      totalProductionKg: Number(totalProductionKg.toFixed(1)),
      totalSalesKg: Number(totalSalesKg.toFixed(1)),
      totalRevenue,
      totalCost,
      totalProfit,
      avgPricePerKg,
      allocation,
    };
  };

  // Pos Dana Modal Realisasi vs Alokasi (Vaults)
  const allocatedVaults = useMemo(() => {
    // Total profit generated
    const totalAllProfit = dailySummaries.reduce((acc, curr) => acc + curr.netProfit, 0);
    const totalAlloc = calculateAllocation(totalAllProfit);

    // Actual spent per category
    const spentMap: Record<string, number> = {
      pakan: 0,
      bibit_ayam: 0,
      upah: 0,
      vaksin: 0,
      listrik: 0,
      air: 0,
    };

    expenses.forEach((e) => {
      if (spentMap[e.category] !== undefined) {
        spentMap[e.category] += e.amount;
      }
    });

    return {
      pakan: {
        allocated: totalAlloc.pakan,
        spent: spentMap.pakan,
        remaining: totalAlloc.pakan - spentMap.pakan,
      },
      pembelianAyam: {
        allocated: totalAlloc.pembelianAyam,
        spent: spentMap.bibit_ayam,
        remaining: totalAlloc.pembelianAyam - spentMap.bibit_ayam,
      },
      upahKerja: {
        allocated: totalAlloc.upahKerja,
        spent: spentMap.upah,
        remaining: totalAlloc.upahKerja - spentMap.upah,
      },
      vitaminVaksin: {
        allocated: totalAlloc.vitaminVaksin,
        spent: spentMap.vaksin,
        remaining: totalAlloc.vitaminVaksin - spentMap.vaksin,
      },
      listrik: {
        allocated: totalAlloc.listrik,
        spent: spentMap.listrik,
        remaining: totalAlloc.listrik - spentMap.listrik,
      },
      air: {
        allocated: totalAlloc.air,
        spent: spentMap.air,
        remaining: totalAlloc.air - spentMap.air,
      },
    };
  }, [dailySummaries, expenses, settings]);

  // Deletion & Reset Handlers
  const resetToDefaultData = () => {
    localStorage.clear();
    setSettings(initialFarmSettings);
    setFlocks(initialFlocks);
    setProductions(initialProductions);
    setSales(initialSales);
    setExpenses(initialExpenses);
    setStockAdjustments([]);
  };

  const clearAllData = () => {
    setProductions([]);
    setSales([]);
    setExpenses([]);
    setStockAdjustments([]);

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      client.from('productions').delete().neq('id', '').then(({ error }) => { if (error) console.error('Clear error:', error); });
      client.from('sales').delete().neq('id', '').then(({ error }) => { if (error) console.error('Clear error:', error); });
      client.from('expenses').delete().neq('id', '').then(({ error }) => { if (error) console.error('Clear error:', error); });
      client.from('stock_adjustments').delete().neq('id', '').then(({ error }) => { if (error) console.error('Clear error:', error); });
    }
  };

  const clearProductionData = () => {
    setProductions([]);
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      client.from('productions').delete().neq('id', '').then(({ error }) => { if (error) console.error('Clear error:', error); });
    }
  };

  const clearSalesData = () => {
    setSales([]);
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      client.from('sales').delete().neq('id', '').then(({ error }) => { if (error) console.error('Clear error:', error); });
    }
  };

  const clearExpenseData = () => {
    setExpenses([]);
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      client.from('expenses').delete().neq('id', '').then(({ error }) => { if (error) console.error('Clear error:', error); });
    }
  };

  const clearStockAdjustments = () => {
    setStockAdjustments([]);
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      client.from('stock_adjustments').delete().neq('id', '').then(({ error }) => { if (error) console.error('Clear error:', error); });
    }
  };

  const deleteStockAdjustment = (id: string) => {
    setStockAdjustments((prev) => prev.filter((item) => item.id !== id));
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      client.from('stock_adjustments').delete().eq('id', id).then(({ error }) => { if (error) console.error('Delete adjustment error:', error); });
    }
  };

  const exportDatabaseJSON = () => {
    const data = {
      settings,
      flocks,
      productions,
      sales,
      expenses,
      stockAdjustments,
      exportedAt: new Date().toISOString(),
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonStr);
    downloadAnchor.setAttribute('download', `telurpro_backup_${getTodayDateString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importDatabaseJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.settings) setSettings(parsed.settings);
      if (parsed.flocks) setFlocks(parsed.flocks);
      if (parsed.productions) setProductions(parsed.productions);
      if (parsed.sales) setSales(parsed.sales);
      if (parsed.expenses) setExpenses(parsed.expenses);
      if (parsed.stockAdjustments) setStockAdjustments(parsed.stockAdjustments);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return (
    <FarmContext.Provider
      value={{
        activeTab,
        setActiveTab,
        settings,
        updateSettings,
        updateAllocations,
        currentUser,
        isAuthenticated: Boolean(currentUser),
        login,
        logout,
        users,
        addUser,
        updateUser,
        deleteUser,
        supabaseConfig,
        updateSupabaseConfig,
        isSupabaseOnline,
        checkSupabaseStatus,
        flocks,
        addFlock,
        updateFlock,
        deleteFlock,
        productions,
        sales,
        expenses,
        stockAdjustments,
        addProduction,
        updateProduction,
        deleteProduction,
        addSale,
        updateSale,
        deleteSale,
        markSalePaid,
        addStockAdjustment,
        addExpense,
        deleteExpense,
        todayDate,
        todayProductionKg,
        todayProductionEggs,
        todaySalesKg,
        todaySalesEggs,
        todayRevenue,
        todayEstimatedCost,
        todayProfit,
        totalStockKg,
        totalStockEggs,
        stockGradeA_Kg,
        stockGradeB_Kg,
        stockCracked_Kg,
        stockAssetValue,
        calculateAllocation,
        dailySummaries,
        getSummaryForDate,
        getSummaryForRange,
        allocatedVaults,
        resetToDefaultData,
        clearAllData,
        clearProductionData,
        clearSalesData,
        clearExpenseData,
        clearStockAdjustments,
        deleteStockAdjustment,
        exportDatabaseJSON,
        importDatabaseJSON,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
};
