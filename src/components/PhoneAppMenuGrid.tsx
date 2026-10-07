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
  Home,
  Settings,
  Users,
  Sparkles,
} from 'lucide-react';
import { formatKg } from '../utils/formatters';

interface PhoneAppMenuGridProps {
  onItemClick?: () => void;
  variant?: 'dashboard' | 'drawer' | 'compact';
}

interface MenuItem {
  id: ActiveTab;
  title: string;
  subtitle: string;
  icon: React.FC<{ className?: string }>;
  gradient: string;
  shadowColor: string;
  badge?: string;
  badgeColor?: string;
}

export const PhoneAppMenuGrid: React.FC<PhoneAppMenuGridProps> = ({
  onItemClick,
  variant = 'dashboard',
}) => {
  const {
    activeTab,
    setActiveTab,
    totalStockKg,
    todayProductionKg,
    todaySalesKg,
    flocks,
  } = useFarm();

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      subtitle: 'Ringkasan Utama',
      icon: LayoutDashboard,
      gradient: 'from-blue-500 to-indigo-600',
      shadowColor: 'shadow-blue-500/25',
      badge: 'Live',
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'produksi',
      title: 'Panen Telur',
      subtitle: 'Catat Hasil Harian',
      icon: Egg,
      gradient: 'from-amber-400 to-orange-500',
      shadowColor: 'shadow-amber-500/25',
      badge: todayProductionKg > 0 ? `${formatKg(todayProductionKg, 0)}` : 'Input',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'penjualan',
      title: 'Jual Telur',
      subtitle: 'Kasir & Faktur',
      icon: ShoppingBag,
      gradient: 'from-emerald-400 to-emerald-600',
      shadowColor: 'shadow-emerald-500/25',
      badge: todaySalesKg > 0 ? `${formatKg(todaySalesKg, 0)}` : 'Kasir',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'stok',
      title: 'Sisa Stok',
      subtitle: 'Gudang Telur',
      icon: Layers,
      gradient: 'from-sky-400 to-blue-600',
      shadowColor: 'shadow-sky-500/25',
      badge: formatKg(totalStockKg, 0),
      badgeColor: 'bg-sky-100 text-sky-800',
    },
    {
      id: 'alokasi',
      title: 'Alokasi Modal',
      subtitle: 'Konversi Laba Harian',
      icon: PieChart,
      gradient: 'from-violet-500 to-purple-600',
      shadowColor: 'shadow-purple-500/25',
      badge: '63% Pakan',
      badgeColor: 'bg-purple-100 text-purple-800',
    },
    {
      id: 'laporan',
      title: 'Laporan',
      subtitle: 'Grafik & Tren Bulanan',
      icon: BarChart3,
      gradient: 'from-cyan-500 to-teal-600',
      shadowColor: 'shadow-cyan-500/25',
      badge: 'Grafik',
      badgeColor: 'bg-teal-100 text-teal-800',
    },
    {
      id: 'pengaturan',
      title: 'Kandang',
      subtitle: 'Nama & Populasi',
      icon: Home,
      gradient: 'from-rose-400 to-pink-600',
      shadowColor: 'shadow-rose-500/25',
      badge: `${flocks.length} Unit`,
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      id: 'pengaturan',
      title: 'Pengaturan',
      subtitle: 'Harga & Sistem',
      icon: Settings,
      gradient: 'from-slate-600 to-slate-800',
      shadowColor: 'shadow-slate-500/25',
      badge: 'Sistem',
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'pengguna',
      title: 'Manajemen User',
      subtitle: 'Akses & Supabase',
      icon: Users,
      gradient: 'from-indigo-500 to-purple-600',
      shadowColor: 'shadow-indigo-500/25',
      badge: 'Supabase',
      badgeColor: 'bg-indigo-100 text-indigo-800',
    },
  ];

  const handleSelect = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (onItemClick) {
      onItemClick();
    }
  };

  const isDrawer = variant === 'drawer';
  const isCompact = variant === 'compact';

  return (
    <div className={variant === 'dashboard' ? 'bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5' : ''}>
      {variant === 'dashboard' && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Menu Aplikasi (Tampilan Ponsel)
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Ikon aplikasi layar sentuh cepat untuk operasional peternakan
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
            Lucide React Icons
          </span>
        </div>
      )}

      {/* Grid of Mobile Phone App Icons */}
      <div
        className={`grid ${
          isDrawer
            ? 'grid-cols-4 gap-x-2 gap-y-4'
            : isCompact
            ? 'grid-cols-4 gap-2.5'
            : 'grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3 sm:gap-4'
        }`}
      >
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id && (item.title !== 'Kandang' || activeTab === 'pengaturan');

          return (
            <button
              key={`${item.id}-${item.title}-${idx}`}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`group flex flex-col items-center text-center p-1.5 sm:p-2 rounded-2xl transition-all duration-150 active:scale-95 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 ${
                isActive
                  ? 'bg-amber-50/80 ring-1 ring-amber-300'
                  : 'hover:bg-slate-50/80'
              }`}
            >
              {/* App Icon (Squircle shape like iOS / Android) */}
              <div className="relative mb-1.5">
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${
                    item.gradient
                  } flex items-center justify-center text-white shadow-md ${
                    item.shadowColor
                  } ring-2 ${
                    isActive ? 'ring-amber-400 ring-offset-2 scale-105' : 'ring-white/80'
                  } group-hover:scale-105 transition-all duration-200`}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow-xs" />
                </div>

                {/* Badge / Pill like mobile app notification */}
                {item.badge && (
                  <span
                    className={`absolute -top-1 -right-1.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-white shadow-xs max-w-[65px] truncate ${
                      item.badgeColor || 'bg-slate-900 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              {/* App Label */}
              <span className="text-[11px] sm:text-xs font-semibold text-slate-800 group-hover:text-amber-900 leading-tight truncate w-full">
                {item.title}
              </span>

              {/* Subtitle (only shown on dashboard or larger screens) */}
              {variant === 'dashboard' && (
                <span className="text-[10px] text-slate-400 truncate w-full hidden sm:block mt-0.5">
                  {item.subtitle}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
