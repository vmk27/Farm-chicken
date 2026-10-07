import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { AppUser, UserRole } from '../types';
import { formatDateIndo } from '../utils/formatters';
import {
  Users,
  Plus,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  Edit3,
  Trash2,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Search,
  KeyRound,
  ExternalLink,
  Lock,
  Terminal,
} from 'lucide-react';
import { UserModal } from './modals/UserModal';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';
import { SqlSchemaModal } from './modals/SqlSchemaModal';
import { AutoDbSetupModal } from './modals/AutoDbSetupModal';
import { testSupabaseConnection } from '../services/supabase';

export const UserManagementView: React.FC = () => {
  const {
    users,
    addUser,
    updateUser,
    deleteUser,
    currentUser,
    supabaseConfig,
    updateSupabaseConfig,
    isSupabaseOnline,
    checkSupabaseStatus,
  } = useFarm();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isAutoDbModalOpen, setIsAutoDbModalOpen] = useState(false);

  // Supabase connection edit state
  const [isEditingSupabase, setIsEditingSupabase] = useState(false);
  const [sbUrl, setSbUrl] = useState(supabaseConfig.url);
  const [sbKey, setSbKey] = useState(supabaseConfig.anonKey);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState<{ success: boolean; text: string } | null>(null);

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase());

    const matchRole = selectedRole === 'ALL' || u.role === selectedRole;
    return matchSearch && matchRole;
  });

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionMessage(null);
    try {
      // Temporarily apply current input config if editing
      if (isEditingSupabase) {
        updateSupabaseConfig({ url: sbUrl.trim(), anonKey: sbKey.trim() });
      }
      const res = await testSupabaseConnection();
      await checkSupabaseStatus();
      setConnectionMessage({ success: res.success, text: res.message });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setConnectionMessage({ success: false, text: `Gagal: ${msg}` });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateSupabaseConfig({ url: sbUrl.trim(), anonKey: sbKey.trim() });
    setIsEditingSupabase(false);
    handleTestConnection();
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <ShieldCheck className="w-3 h-3 text-purple-600" />
            <span>Admin</span>
          </span>
        );
      case 'operator':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <UserCheck className="w-3 h-3 text-amber-600" />
            <span>Operator Kandang</span>
          </span>
        );
      case 'kasir':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <KeyRound className="w-3 h-3 text-emerald-600" />
            <span>Kasir Penjualan</span>
          </span>
        );
    }
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Manajemen Pengguna & Hak Akses</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola akun pengguna, otorisasi peran, dan integrasi otentikasi database Supabase
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingUser(null);
            setIsUserModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-xl shadow-xs transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Supabase Integration Card */}
      <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Integrasi Otentikasi Supabase
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    isSupabaseOnline
                      ? 'bg-emerald-100 text-emerald-800'
                      : supabaseConfig.url
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSupabaseOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  {isSupabaseOnline ? 'Terhubung ke Cloud' : 'Siap Dikonfigurasi'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Hubungkan ke project Supabase Anda untuk otentikasi cloud & sinkronisasi data antar perangkat
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setIsAutoDbModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              title="Buat 7 tabel database secara otomatis"
            >
              <Database className="w-3.5 h-3.5" />
              <span>🛠️ Buat Tabel Otomatis</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSqlModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              title="Lihat & salin skrip SQL tabel database untuk Supabase"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-600" />
              <span>Skema SQL</span>
            </button>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
              <span>{testingConnection ? 'Memeriksa...' : 'Test Koneksi'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditingSupabase(!isEditingSupabase)}
              className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
            >
              {isEditingSupabase ? 'Batal Ubah' : 'Atur URL & Kunci'}
            </button>
          </div>
        </div>

        {/* Connection Test Feedback */}
        {connectionMessage && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              connectionMessage.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {connectionMessage.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{connectionMessage.text}</span>
          </div>
        )}

        {/* Config Inputs Form */}
        {isEditingSupabase ? (
          <form onSubmit={handleSaveSupabaseConfig} className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supabase Project URL (VITE_SUPABASE_URL)
                </label>
                <input
                  type="text"
                  required
                  value={sbUrl}
                  onChange={(e) => setSbUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supabase Anon Public API Key (VITE_SUPABASE_ANON_KEY)
                </label>
                <input
                  type="password"
                  required
                  value={sbKey}
                  onChange={(e) => setSbKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors"
              >
                Simpan & Sambungkan
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-slate-400 block text-[11px]">URL Proyek Supabase:</span>
              <span className="font-mono text-slate-700 font-medium">
                {supabaseConfig.url || '(Belum disetel — Menggunakan penyimpanan akun lokal)'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Kunci Anonim (Anon Key):</span>
              <span className="font-mono text-slate-700 font-medium">
                {supabaseConfig.anonKey
                  ? '•••••••••••••••••••••••••••••••• (Tersimpan)'
                  : '(Belum disetel)'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Users Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Filter Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama, username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">Semua Peran</option>
              <option value="admin">Admin</option>
              <option value="operator">Operator Kandang</option>
              <option value="kasir">Kasir Penjualan</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-mono self-end sm:self-auto">
            Total <strong className="text-slate-800">{filteredUsers.length}</strong> pengguna
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-semibold">
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Peran / Otorisasi</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Login Terakhir</th>
                <th className="py-3 px-4">Terdaftar</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-600">
                      Tidak ada pengguna yang sesuai
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = currentUser?.id === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-xs shadow-2xs">
                            {user.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-slate-900">
                              <span>{user.fullName}</span>
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-mono">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">{getRoleBadge(user.role)}</td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            user.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {user.status === 'active' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                        {user.lastLoginAt ? formatDateIndo(user.lastLoginAt.slice(0, 10)) : '-'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {formatDateIndo(user.createdAt.slice(0, 10))}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(user);
                              setIsUserModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                            title="Edit Pengguna"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(user)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Hapus Pengguna"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingUser(null);
        }}
        editingUser={editingUser}
        onSave={async (userData, id) => {
          if (id) {
            return updateUser(id, userData);
          } else {
            return addUser(userData);
          }
        }}
      />

      {/* Delete User Confirmation */}
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={Boolean(deleteTarget)}
          title="Hapus Pengguna?"
          description={`Akun pengguna ${deleteTarget.fullName} (@${deleteTarget.username}) akan dihapus dari sistem.`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (deleteTarget) {
              deleteUser(deleteTarget.id);
              setDeleteTarget(null);
            }
          }}
        />
      )}

      {/* Supabase SQL Schema Viewer Modal */}
      <SqlSchemaModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />

      {/* Auto Database Tables Setup Modal */}
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
