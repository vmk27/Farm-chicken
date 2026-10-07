import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  Egg,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Database,
  ShieldCheck,
  CheckCircle2,
  Settings,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { testSupabaseConnection } from '../services/supabase';
import { AutoDbSetupModal } from './modals/AutoDbSetupModal';

export const LoginView: React.FC = () => {
  const { login, settings, isSupabaseOnline, supabaseConfig, updateSupabaseConfig, checkSupabaseStatus } = useFarm();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loginSuccessMsg, setLoginSuccessMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Supabase quick setting toggle on login screen
  const [showSbConfig, setShowSbConfig] = useState(false);
  const [isAutoDbModalOpen, setIsAutoDbModalOpen] = useState(false);
  const [sbUrlInput, setSbUrlInput] = useState(supabaseConfig.url);
  const [sbKeyInput, setSbKeyInput] = useState(supabaseConfig.anonKey);
  const [testingSb, setTestingSb] = useState(false);
  const [sbMessage, setSbMessage] = useState<{ success: boolean; text: string } | null>(null);

  const handleTestAndSaveSb = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestingSb(true);
    setSbMessage(null);
    try {
      updateSupabaseConfig({ url: sbUrlInput.trim(), anonKey: sbKeyInput.trim() });
      const res = await testSupabaseConnection();
      await checkSupabaseStatus();
      setSbMessage({ success: res.success, text: res.message });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSbMessage({ success: false, text: `Koneksi gagal: ${msg}` });
    } finally {
      setTestingSb(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoginSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await login(username, password);
      if (res.success) {
        setLoginSuccessMsg('✓ Login Berhasil! Selamat datang di Sistem Manajemen Peternakan Telur.');
      } else {
        setErrorMessage(
          res.error || '❌ Login Gagal! Username atau kata sandi yang Anda masukkan tidak sesuai.'
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`❌ Login Gagal: Terjadi kesalahan sistem (${msg}).`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-amber-500/10 via-slate-50 to-emerald-500/10 font-sans">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 items-center justify-center text-white shadow-md shadow-amber-500/30 ring-4 ring-amber-100 mb-1">
              <Egg className="w-8 h-8 fill-amber-100" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {settings.farmName || 'CV Sumber Rejeki'}
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Sistem Manajemen Peternakan Telur, Kasir Penjualan & Alokasi Modal
            </p>
          </div>

          {/* Supabase Status Indicator & Config Toggle */}
          <div className="space-y-2">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-600 font-medium">Database Backend:</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSupabaseOnline
                        ? 'bg-emerald-500 animate-pulse'
                        : supabaseConfig.url
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    }`}
                  />
                  <span
                    className={
                      isSupabaseOnline
                        ? 'text-emerald-700'
                        : supabaseConfig.url
                        ? 'text-amber-700'
                        : 'text-blue-700'
                    }
                  >
                    {isSupabaseOnline
                      ? 'Supabase Terhubung'
                      : supabaseConfig.url
                      ? 'Supabase Siap'
                      : 'Database Supabase Aktif'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSbConfig(!showSbConfig)}
                  className="p-1 rounded-md text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                  title="Atur Koneksi Supabase"
                >
                  {showSbConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Expandable Supabase Config Form */}
            {showSbConfig && (
              <form onSubmit={handleTestAndSaveSb} className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-2.5 text-xs animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 text-[11px] flex items-center gap-1">
                    <Database className="w-3 h-3 text-amber-600" />
                    Koneksi Supabase Cloud
                  </span>
                  <span className="text-[10px] text-slate-400">Project Credentials</span>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Supabase Project URL
                  </label>
                  <input
                    type="text"
                    required
                    value={sbUrlInput}
                    onChange={(e) => setSbUrlInput(e.target.value)}
                    placeholder="https://xyz.supabase.co"
                    className="w-full px-2.5 py-1.5 text-[11px] bg-white border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Anon Public Key
                  </label>
                  <input
                    type="password"
                    required
                    value={sbKeyInput}
                    onChange={(e) => setSbKeyInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                    className="w-full px-2.5 py-1.5 text-[11px] bg-white border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {sbMessage && (
                  <div
                    className={`p-2 rounded-lg text-[11px] flex items-center gap-1.5 ${
                      sbMessage.success
                        ? 'bg-emerald-100/70 text-emerald-800'
                        : 'bg-rose-100/70 text-rose-800'
                    }`}
                  >
                    {sbMessage.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    )}
                    <span>{sbMessage.text}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAutoDbModalOpen(true)}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                  >
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                    <span>🛠️ Buat Tabel Otomatis</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowSbConfig(false)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200/50 rounded-lg"
                    >
                      Tutup
                    </button>
                    <button
                      type="submit"
                      disabled={testingSb}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                    >
                      {testingSb && <RefreshCw className="w-3 h-3 animate-spin" />}
                      <span>{testingSb ? 'Menguji...' : 'Simpan & Tes'}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Success Banner */}
          {loginSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex-1 font-semibold">{loginSuccessMsg}</div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Username Akun
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username (cth: admin)"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden transition-all font-medium text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden transition-all font-medium text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  aria-label="Lihat kata sandi"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                />
                <span>Ingat saya</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                Sesi tersimpan aman
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke Sistem</span>
                </>
              )}
            </button>
          </form>

        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-400 mt-4">
          TelurPro Enterprise • Otentikasi Supabase & Manajemen Akses
        </p>
      </div>

      <AutoDbSetupModal
        isOpen={isAutoDbModalOpen}
        onClose={() => setIsAutoDbModalOpen(false)}
        onSuccessCreated={() => {
          checkSupabaseStatus();
        }}
      />
    </div>
  );
};
