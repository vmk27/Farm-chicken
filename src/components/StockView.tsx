import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  formatKg,
  formatRupiah,
  formatDateIndo,
} from '../utils/formatters';
import {
  Layers,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Warehouse,
  History,
} from 'lucide-react';
import { StockOpnameModal } from './modals/StockOpnameModal';

export const StockView: React.FC = () => {
  const {
    totalStockKg,
    stockGradeA_Kg,
    stockGradeB_Kg,
    stockCracked_Kg,
    stockAssetValue,
    settings,
    stockAdjustments,
    dailySummaries,
  } = useFarm();

  const [isOpnameOpen, setIsOpnameOpen] = useState(false);

  // Calculate average daily sales in the last 7 days to estimate stock days remaining
  const last7Days = dailySummaries.slice(-7);
  const avgDailySalesKg =
    last7Days.length > 0
      ? last7Days.reduce((acc, curr) => acc + curr.totalSalesKg, 0) / last7Days.length
      : 100;
  const daysStockRemaining =
    avgDailySalesKg > 0 ? (totalStockKg / avgDailySalesKg).toFixed(1) : '∞';

  const isLowStock = totalStockKg < settings.lowStockThresholdKg;

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Manajemen Gudang & Sisa Stok Telur</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring inventaris telur real-time, estimasi nilai aset gudang, dan riwayat penyesuaian stok
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpnameOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>+ Catat Opname / Telur Pecah</span>
        </button>
      </div>

      {/* Main Stock Banner Card */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Sisa Stok Gudang Siap Jual
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tabular-nums">
              {formatKg(totalStockKg)}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-mono font-medium text-emerald-700">
                Nilai Aset: {formatRupiah(stockAssetValue)}
              </span>
            </div>
          </div>

          <div className="space-y-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Status Cadangan Stok:</span>
              <span
                className={`font-semibold flex items-center gap-1 ${
                  isLowStock ? 'text-amber-700' : 'text-emerald-700'
                }`}
              >
                {isLowStock ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" /> Stok Menipis
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Stok Aman
                  </>
                )}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(10, (totalStockKg / (settings.lowStockThresholdKg * 2.5)) * 100)
                  )}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Batas Minimal: {formatKg(settings.lowStockThresholdKg)}</span>
              <span>Kapasitas: 1.000 kg</span>
            </div>
          </div>

          <div className="space-y-1 p-4 bg-sky-50/50 rounded-lg border border-sky-100">
            <span className="text-xs text-sky-900 font-semibold block">
              Ketahanan Stok (Runway)
            </span>
            <div className="text-2xl font-bold text-sky-950 font-mono">
              ~{daysStockRemaining} Hari
            </div>
            <p className="text-[11px] text-sky-800">
              Berdasarkan rata-rata penjualan 7 hari terakhir ({formatKg(avgDailySalesKg)}/hari)
            </p>
          </div>
        </div>
      </div>

      {/* Standard Egg Stock Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stok Tersedia */}
        <div className="p-5 bg-white rounded-xl border border-emerald-200 bg-emerald-50/10 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <h4 className="text-sm font-bold text-slate-900">Stok Telur Standar</h4>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Siap Jual
            </span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums">
              {formatKg(totalStockKg)}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              100% Stok Telur Segar Siap Jual
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 flex justify-between">
            <span>Harga Acuan:</span>
            <span className="font-mono font-bold text-slate-800">
              {formatRupiah(settings.currentMarketPricePerKg)}/kg
            </span>
          </div>
        </div>

        {/* Nilai Aset */}
        <div className="p-5 bg-white rounded-xl border border-sky-200 bg-sky-50/10 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sky-500 inline-block" />
              <h4 className="text-sm font-bold text-slate-900">Valuasi Aset Telur</h4>
            </div>
            <span className="text-xs font-mono font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
              Inventaris
            </span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums">
              {formatRupiah(stockAssetValue)}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              Nilai perputaran modal telur
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 flex justify-between">
            <span>Status Aset:</span>
            <span className="font-bold text-sky-800">
              {totalStockKg > 0 ? 'Likuid / Siap Kas' : 'Kosong'}
            </span>
          </div>
        </div>

        {/* Ketahanan Stok */}
        <div className="p-5 bg-white rounded-xl border border-amber-200 bg-amber-50/10 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <h4 className="text-sm font-bold text-slate-900">Ketahanan Pasokan</h4>
            </div>
            <span className="text-xs font-mono font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              Runway
            </span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums">
              ~{daysStockRemaining} Hari
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              Konsumsi ±{formatKg(avgDailySalesKg)}/hari
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 flex justify-between">
            <span>Batas Aman:</span>
            <span className="font-mono font-bold text-amber-900">
              Min. {formatKg(settings.lowStockThresholdKg)}
            </span>
          </div>
        </div>
      </div>

      {/* Stock Opname & Adjustment History */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">
              Riwayat Opname & Penyesuaian Telur Pecah / Rusak
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {stockAdjustments.length} Catatan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-semibold">
                <th className="py-2.5 px-4">Tanggal</th>
                <th className="py-2.5 px-4">Jenis Koreksi</th>
                <th className="py-2.5 px-4 text-right">Pengurangan (Kg)</th>
                <th className="py-2.5 px-4">Alasan / Kronologi</th>
                <th className="py-2.5 px-4">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stockAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Belum ada catatan opname atau penyesuaian susut
                  </td>
                </tr>
              ) : (
                stockAdjustments.map((adj) => (
                  <tr key={adj.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-mono text-slate-800">
                      {formatDateIndo(adj.date)}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{adj.type}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-700">
                      -{formatKg(adj.weightKg)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{adj.reason}</td>
                    <td className="py-2.5 px-4 text-slate-600">{adj.operator}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StockOpnameModal
        isOpen={isOpnameOpen}
        onClose={() => setIsOpnameOpen(false)}
      />
    </div>
  );
};
