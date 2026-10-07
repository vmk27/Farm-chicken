import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Play,
  Layers,
  Sparkles,
  Server,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  checkAllTablesStatus,
  executeCreateTablesOnBackend,
  seedInitialDatabaseData,
  TableStatus,
} from '../../services/dbManager';
import { getStoredSupabaseConfig } from '../../services/supabase';
import { SUPABASE_SQL_SCRIPT } from './SqlSchemaModal';

interface AutoDbSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessCreated?: () => void;
}

export const AutoDbSetupModal: React.FC<AutoDbSetupModalProps> = ({
  isOpen,
  onClose,
  onSuccessCreated,
}) => {
  const [tables, setTables] = useState<TableStatus[]>([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(false);
  const [allExist, setAllExist] = useState<boolean>(false);

  // Auto create form state
  const [connectionString, setConnectionString] = useState<string>('');
  const [dbPassword, setDbPassword] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<{
    success?: boolean;
    message?: string;
    logs?: string[];
  } | null>(null);

  // Seeding state
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string } | null>(null);

  // Manual SQL copy state
  const [copied, setCopied] = useState<boolean>(false);
  const [showAdvancedConn, setShowAdvancedConn] = useState<boolean>(false);

  const supabaseConfig = getStoredSupabaseConfig();

  // Extract project ref if available
  let projectRef = '';
  if (supabaseConfig.url) {
    try {
      projectRef = new URL(supabaseConfig.url).hostname.split('.')[0] || '';
    } catch {
      // ignore
    }
  }

  const loadStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await checkAllTablesStatus();
      setTables(res.tables);
      setAllExist(res.allExist);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setExecutionResult(null);
      setSeedResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExecuteAutoCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const payload: {
        connectionString?: string;
        dbPassword?: string;
        supabaseUrl?: string;
      } = {
        supabaseUrl: supabaseConfig.url,
      };

      if (connectionString.trim()) {
        payload.connectionString = connectionString.trim();
      } else if (dbPassword.trim()) {
        payload.dbPassword = dbPassword.trim();
      }

      const res = await executeCreateTablesOnBackend(payload);
      setExecutionResult({
        success: res.success,
        message: res.message,
        logs: res.logs,
      });

      if (res.success) {
        // Refresh tables status
        await loadStatus();
        if (onSuccessCreated) {
          onSuccessCreated();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setExecutionResult({
        success: false,
        message: `Terjadi galat: ${msg}`,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    try {
      const res = await seedInitialDatabaseData();
      setSeedResult(res);
      await loadStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSeedResult({ success: false, message: `Gagal: ${msg}` });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const sqlEditorUrl = projectRef
    ? `https://supabase.com/dashboard/project/${projectRef}/sql/new`
    : 'https://supabase.com/dashboard';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92dvh] sm:max-h-[88vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Buat Tabel Otomatis ke Database</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
                  PostgreSQL / Supabase
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Inisialisasi 7 skema tabel peternakan, RLS, index & data awal
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

        {/* Scrollable Modal Body */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5 touch-pan-y"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* TABEL AUDIT & STATUS CHECKER */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Status 7 Tabel Database di Supabase
                </span>
              </div>
              <button
                type="button"
                onClick={loadStatus}
                disabled={isLoadingStatus}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingStatus ? 'animate-spin' : ''}`} />
                <span>Periksa Ulang</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {tables.map((tbl) => (
                <div
                  key={tbl.name}
                  className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 transition-all ${
                    tbl.exists
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50/70 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="font-mono font-bold block truncate">{tbl.name}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{tbl.label}</span>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    {tbl.exists ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900 font-bold text-[10px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        <span>Tersedia</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-200 text-rose-900 font-bold text-[10px]">
                        <AlertCircle className="w-3 h-3 text-rose-700" />
                        <span>Belum Ada</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {allExist ? (
              <div className="p-3 bg-emerald-100/70 border border-emerald-300 rounded-lg text-emerald-900 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Semua 7 tabel database siap dan aktif di Supabase!</span>
                </div>
                <button
                  type="button"
                  onClick={handleSeedData}
                  disabled={isSeeding}
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md font-bold text-[11px] shrink-0 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{isSeeding ? 'Mengisi...' : 'Isi Data Awal'}</span>
                </button>
              </div>
            ) : (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Beberapa tabel belum dibuat. Pilih salah satu metode otomatis di bawah untuk membuat tabel secara instan.
                </span>
              </div>
            )}
          </div>

          {seedResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                seedResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {seedResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{seedResult.message}</span>
            </div>
          )}

          {/* OPSI 1: EKSEKUSI OTOMATIS VIA BACKEND */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Metode 1: Eksekusi Otomatis Langsung (1-Klik)
                </h4>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                Rekomendasi
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Masukkan <strong>Password Database Supabase</strong> atau <strong>Connection String</strong> Anda. Server akan langsung menghubungkan dan menjalankan pembuatan seluruh 7 tabel dalam 2 detik.
            </p>

            <form onSubmit={handleExecuteAutoCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password Database Supabase (postgres)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="password"
                    placeholder="Masukkan password database Supabase Anda saat buat proyek"
                    value={dbPassword}
                    onChange={(e) => setDbPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                {projectRef && (
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Target host: <code className="font-mono text-slate-700">db.{projectRef}.supabase.co:5432</code>
                  </span>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvancedConn(!showAdvancedConn)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                >
                  <span>Atau gunakan Connection String / Transaction Pooler lengkap</span>
                  {showAdvancedConn ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {showAdvancedConn && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres atau pooler.supabase.com:6543/postgres"
                      value={connectionString}
                      onChange={(e) => setConnectionString(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Dapat disalin dari Supabase Dashboard &gt; Project Settings &gt; Database &gt; Connection string.
                    </span>
                  </div>
                )}
              </div>

              {executionResult && (
                <div
                  className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                    executionResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {executionResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{executionResult.message}</span>
                  </div>
                  {executionResult.logs && executionResult.logs.length > 0 && (
                    <div className="p-2 bg-black/5 rounded text-[11px] font-mono space-y-0.5 max-h-24 overflow-y-auto">
                      {executionResult.logs.map((log, i) => (
                        <div key={i}>&gt; {log}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-1 flex items-center justify-end gap-2">
                <button
                  type="submit"
                  disabled={isExecuting || (!dbPassword && !connectionString)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                >
                  {isExecuting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  <span>{isExecuting ? 'Sedang Membuat Tabel...' : '🚀 Buat Tabel Otomatis Sekarang'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* OPSI 2: 1-KLIK VIA SUPABASE SQL EDITOR */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>Metode 2: 1-Klik Salin ke Supabase SQL Editor</span>
              </h4>
              <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                Tanpa Password
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Jika Anda tidak ingin memasukkan password database, cukup salin skrip SQL dan jalankan di SQL Editor dashboard Supabase Anda:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">1</span>
                  <span>Salin Skrip SQL</span>
                </div>
                <p className="text-[11px] text-slate-500">Klik tombol salin di bawah ini untuk mengambil seluruh kode skema.</p>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">2</span>
                  <span>Buka SQL Editor</span>
                </div>
                <p className="text-[11px] text-slate-500">Buka SQL Editor di dashboard proyek Supabase Anda.</p>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">3</span>
                  <span>Tempel & Run</span>
                </div>
                <p className="text-[11px] text-slate-500">Tempelkan skrip, klik tombol hijau <strong>Run</strong>.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Skrip SQL Tersalin!' : 'Salin Semua Skrip SQL'}</span>
              </button>

              <a
                href={sqlEditorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <span>Buka Supabase SQL Editor</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50">
          <span className="text-[11px] text-slate-500">
            Sistem TelurPro • Satuan Kg Murni • Standar Peternakan
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
