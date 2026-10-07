import React from 'react';
import { useFarm } from '../context/FarmContext';
import { ActiveTab } from '../types';
import {
  LayoutDashboard,
  Egg,
  ShoppingBag,
  Layers,
  PieChart,
  BarChart3,
  Settings,
  Flame,
  Users,
  LogOut,
} from 'lucide-react';
import { formatKg } from '../utils/formatters';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, totalStockKg, settings, currentUser, logout } = useFarm();

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: string;
    iconColor: string;
    iconBg: string;
  }[] = [
    { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard, iconColor: 'text-blue-600', iconBg: 'bg-blue-50' },
    { id: 'produksi', label: 'Produksi Telur', icon: Egg, iconColor: 'text-amber-600', iconBg: 'bg-amber-50' },
    { id: 'penjualan', label: 'Telur Terjual', icon: ShoppingBag, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50' },
    { id: 'stok', label: 'Sisa Stok Telur', icon: Layers, badge: formatKg(totalStockKg, 0), iconColor: 'text-sky-600', iconBg: 'bg-sky-50' },
    { id: 'alokasi', label: 'Alokasi Modal (63%)', icon: PieChart, iconColor: 'text-purple-600', iconBg: 'bg-purple-50' },
    { id: 'laporan', label: 'Laporan & Grafik', icon: BarChart3, iconColor: 'text-cyan-600', iconBg: 'bg-cyan-50' },
    { id: 'pengaturan', label: 'Pengaturan & Harga', icon: Settings, iconColor: 'text-slate-600', iconBg: 'bg-slate-100' },
    { id: 'pengguna', label: 'Manajemen User', icon: Users, iconColor: 'text-indigo-600', iconBg: 'bg-indigo-50' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-sm shrink-0">
          <Egg className="w-6 h-6 fill-amber-100" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-bold text-slate-900 truncate leading-tight">
            {settings.farmName.replace('CV ', '')}
          </h1>
          <p className="text-[11px] text-slate-500 truncate">Smart Egg Farm System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    isActive
                      ? 'bg-slate-800 text-amber-400'
                      : `${item.iconBg} ${item.iconColor}`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? 'bg-slate-800 text-amber-300'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Allocation Mini Callout */}
      <div className="p-4 m-3 bg-amber-50/90 rounded-xl border border-amber-200/80">
        <div className="flex items-center gap-1.5 mb-1 text-amber-900">
          <Flame className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="text-[11px] font-bold">Aturan Konversi Laba</span>
        </div>
        <p className="text-[11px] text-amber-800/90 leading-relaxed">
          Otomatis membagi laba harian untuk modal: <strong className="font-semibold">Pakan (63%)</strong>,{' '}
          <strong className="font-semibold">Ayam (20%)</strong>, <strong className="font-semibold">Upah (12%)</strong>, dll.
        </p>
      </div>

      {/* Logged in User Bar */}
      {currentUser && (
        <div className="px-3 pb-2">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {currentUser.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-500 font-medium capitalize">
                  {currentUser.role}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Keluar / Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-200 text-[11px] text-slate-400 flex items-center justify-between">
        <span>TelurPro v2.6 Real-Time</span>
        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
      </div>
    </aside>
  );
};
