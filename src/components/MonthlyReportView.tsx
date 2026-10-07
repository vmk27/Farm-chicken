import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  formatRupiah,
  formatKg,
  formatDateIndo,
  exportToCSV,
  formatNumber,
} from '../utils/formatters';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  Award,
  FileSpreadsheet,
} from 'lucide-react';
import { ProductionSalesChart } from './charts/ProductionSalesChart';
import { RevenueProfitChart } from './charts/RevenueProfitChart';
import { PriceTrendChart } from './charts/PriceTrendChart';

export const MonthlyReportView: React.FC = () => {
  const { dailySummaries, sales, productions, settings } = useFarm();

  const [selectedMonth, setSelectedMonth] = useState('2026-10'); // YYYY-MM
  const [activeReportChart, setActiveReportChart] = useState<'prod' | 'rev' | 'price'>('prod');

  // Filter summaries by selected month
  const monthSummaries = useMemo(() => {
    return dailySummaries.filter((s) => s.date.startsWith(selectedMonth));
  }, [dailySummaries, selectedMonth]);

  const monthSales = useMemo(() => {
    return sales.filter((s) => s.date.startsWith(selectedMonth));
  }, [sales, selectedMonth]);

  const monthProds = useMemo(() => {
    return productions.filter((p) => p.date.startsWith(selectedMonth));
  }, [productions, selectedMonth]);

  // Aggregate monthly totals
  const monthlyMetrics = useMemo(() => {
    const totalProdKg = monthProds.reduce((acc, curr) => acc + curr.weightKgTotal, 0);
    const totalSalesKg = monthSales.reduce((acc, curr) => acc + curr.weightKg, 0);
    const totalRevenue = monthSales.reduce((acc, curr) => acc + curr.totalRevenue, 0);
    const totalCost = monthSummaries.reduce((acc, curr) => acc + curr.estimatedCost, 0);
    const netProfit = Math.max(0, totalRevenue - totalCost);
    const avgPrice = totalSalesKg > 0 ? Math.round(totalRevenue / totalSalesKg) : settings.currentMarketPricePerKg;

    // Capital Allocations for the month
    const allocPakan = Math.round(netProfit * 0.63);
    const allocAyam = Math.round(netProfit * 0.20);
    const allocUpah = Math.round(netProfit * 0.12);
    const allocVaksin = Math.round(netProfit * 0.035);
    const allocListrik = Math.round(netProfit * 0.005);
    const allocAir = Math.round(netProfit * 0.005);

    return {
      totalProdKg: Number(totalProdKg.toFixed(1)),
      totalSalesKg: Number(totalSalesKg.toFixed(1)),
      totalRevenue,
      totalCost,
      netProfit,
      avgPrice,
      allocations: {
        pakan: allocPakan,
        ayam: allocAyam,
        upah: allocUpah,
        vaksin: allocVaksin,
        listrik: allocListrik,
        air: allocAir,
      },
    };
  }, [monthProds, monthSales, monthSummaries, settings]);

  // Sales by Grade Breakdown
  const salesByGrade = useMemo(() => {
    const map: Record<string, { grade: string; kg: number; total: number; count: number }> = {
      'Grade A (Super)': { grade: 'Grade A (Super)', kg: 0, total: 0, count: 0 },
      'Grade B (Standar)': { grade: 'Grade B (Standar)', kg: 0, total: 0, count: 0 },
      'Retak / Reject': { grade: 'Retak / Reject', kg: 0, total: 0, count: 0 },
      'Campur': { grade: 'Campur', kg: 0, total: 0, count: 0 },
    };

    monthSales.forEach((s) => {
      const g = s.grade || 'Grade A (Super)';
      if (!map[g]) {
        map[g] = { grade: g, kg: 0, total: 0, count: 0 };
      }
      map[g].kg += s.weightKg;
      map[g].total += s.totalRevenue;
      map[g].count += 1;
    });

    return Object.values(map).filter((item) => item.kg > 0);
  }, [monthSales]);

  const handleExportMonthCSV = () => {
    const exportData = monthSummaries.map((s) => ({
      Tanggal: s.date,
      'Produksi (Kg)': s.totalProductionKg,
      'Penjualan (Kg)': s.totalSalesKg,
      'Pendapatan (Rp)': s.totalRevenue,
      'Biaya Operasional (Rp)': s.estimatedCost,
      'Laba Bersih (Rp)': s.netProfit,
      'Rata-rata Harga / Kg': s.avgSellingPricePerKg,
    }));
    exportToCSV(`laporan_bulanan_${selectedMonth}`, exportData);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto print:p-0">
      {/* Header with Month Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 print:hidden">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Laporan & Grafik Bulanan</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis komprehensif performa produksi, omset penjualan, dan laporan laba rugi peternakan
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Month Selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-600 font-medium">Bulan:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="font-bold text-slate-900 bg-transparent focus:outline-hidden cursor-pointer"
            >
              <option value="2026-10">Oktober 2026</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-08">Agustus 2026</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportMonthCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* Monthly KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Total Omset Penjualan</span>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {formatRupiah(monthlyMetrics.totalRevenue)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {formatKg(monthlyMetrics.totalSalesKg)} terjual
          </span>
        </div>

        {/* Total Biaya Operasional */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Total HPP & Operasional</span>
          <div className="text-2xl font-bold text-rose-700 font-mono tabular-nums mt-1">
            {formatRupiah(monthlyMetrics.totalCost)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Estimasi pakan & operasional dasar
          </span>
        </div>

        {/* Laba Bersih */}
        <div className="p-5 bg-white rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <span className="text-xs font-semibold text-emerald-800 block">Laba Bersih Bulanan</span>
          <div className="text-2xl font-bold text-emerald-950 font-mono tabular-nums mt-1">
            {formatRupiah(monthlyMetrics.netProfit)}
          </div>
          <span className="text-xs text-emerald-700 mt-1 block font-medium">
            Margin: {monthlyMetrics.totalRevenue > 0 ? ((monthlyMetrics.netProfit / monthlyMetrics.totalRevenue) * 100).toFixed(1) : 0}%
          </span>
        </div>

        {/* Total Panen Telur */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block">Total Panen Telur</span>
          <div className="text-2xl font-bold text-amber-900 font-mono tabular-nums mt-1">
            {formatKg(monthlyMetrics.totalProdKg)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Akumulasi Produksi Bulan Ini
          </span>
        </div>
      </div>

      {/* Monthly Chart Section */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Grafik Analisis Tren Harian di Bulan {selectedMonth}
            </h3>
            <p className="text-xs text-slate-500">
              Visualisasi pergerakan data dari hari ke hari
            </p>
          </div>

          <div className="flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveReportChart('prod')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeReportChart === 'prod'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Panen vs Terjual
            </button>
            <button
              type="button"
              onClick={() => setActiveReportChart('rev')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeReportChart === 'rev'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Omset & Laba
            </button>
            <button
              type="button"
              onClick={() => setActiveReportChart('price')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeReportChart === 'price'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tren Harga / kg
            </button>
          </div>
        </div>

        <div className="pt-2">
          {activeReportChart === 'prod' && (
            <ProductionSalesChart data={monthSummaries.length > 0 ? monthSummaries : dailySummaries} />
          )}
          {activeReportChart === 'rev' && (
            <RevenueProfitChart data={monthSummaries.length > 0 ? monthSummaries : dailySummaries} />
          )}
          {activeReportChart === 'price' && (
            <PriceTrendChart
              data={monthSummaries.length > 0 ? monthSummaries : dailySummaries}
              currentBenchmark={settings.currentMarketPricePerKg}
            />
          )}
        </div>
      </div>

      {/* Laporan Laba Rugi Akuntansi Peternakan & Top Pelanggan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Laba Rugi Sheet (2 cols) */}
        <div className="lg:col-span-2 p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Laporan Laba Rugi & Rekap Alokasi Modal
              </h3>
              <p className="text-xs text-slate-500">
                Periode Bulan: <span className="font-semibold text-slate-800">{selectedMonth}</span>
              </p>
            </div>
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded-md">
              Standar Peternakan
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Revenue section */}
            <div>
              <div className="font-bold text-slate-900 mb-1">1. PENDAPATAN USAHA (OMSET)</div>
              <div className="pl-4 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Penjualan Telur Ayam Segar ({formatKg(monthlyMetrics.totalSalesKg)})</span>
                  <span className="font-mono text-slate-900">
                    {formatRupiah(monthlyMetrics.totalRevenue)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100 mt-1 pl-4">
                <span>Total Pendapatan Bersih</span>
                <span className="font-mono">{formatRupiah(monthlyMetrics.totalRevenue)}</span>
              </div>
            </div>

            {/* Cost section */}
            <div className="pt-2">
              <div className="font-bold text-slate-900 mb-1">2. BEBAN & ESTIMASI HPP</div>
              <div className="pl-4 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Estimasi Biaya Pokok Produksi (HPP Pakan & Operasional)</span>
                  <span className="font-mono text-rose-700">
                    -{formatRupiah(monthlyMetrics.totalCost)}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Profit */}
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex justify-between items-center text-sm font-bold text-emerald-950">
              <span>3. LABA BERSIH PETERNIKAN</span>
              <span className="font-mono text-base">{formatRupiah(monthlyMetrics.netProfit)}</span>
            </div>

            {/* Modal Allocation breakdown */}
            <div className="pt-2">
              <div className="font-bold text-slate-900 mb-2">
                4. REKAP ALOKASI MODAL DARI LABA BERSIH (100% TERKONVERSI)
              </div>
              <div className="pl-4 grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-50 rounded-md border border-slate-200 flex justify-between">
                  <span className="text-slate-600">Pakan (63%):</span>
                  <span className="font-mono font-bold text-amber-900">
                    {formatRupiah(monthlyMetrics.allocations.pakan)}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded-md border border-slate-200 flex justify-between">
                  <span className="text-slate-600">Pembelian Ayam (20%):</span>
                  <span className="font-mono font-bold text-sky-900">
                    {formatRupiah(monthlyMetrics.allocations.ayam)}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded-md border border-slate-200 flex justify-between">
                  <span className="text-slate-600">Upah Kerja (12%):</span>
                  <span className="font-mono font-bold text-emerald-900">
                    {formatRupiah(monthlyMetrics.allocations.upah)}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded-md border border-slate-200 flex justify-between">
                  <span className="text-slate-600">Vitamin & Vaksin (3.5%):</span>
                  <span className="font-mono font-bold text-purple-900">
                    {formatRupiah(monthlyMetrics.allocations.vaksin)}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded-md border border-slate-200 flex justify-between">
                  <span className="text-slate-600">Listrik (0.5%):</span>
                  <span className="font-mono font-bold text-orange-900">
                    {formatRupiah(monthlyMetrics.allocations.listrik)}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded-md border border-slate-200 flex justify-between">
                  <span className="text-slate-600">Air Bersih (0.5%):</span>
                  <span className="font-mono font-bold text-cyan-900">
                    {formatRupiah(monthlyMetrics.allocations.air)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Summary Card */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <Award className="w-4 h-4 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Kinerja Penjualan Telur Standar</h3>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">Total Transaksi Penjualan:</span>
              <span className="font-bold text-slate-900 font-mono">{monthSales.length} Transaksi</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">Total Volume Terjual:</span>
              <span className="font-bold text-emerald-800 font-mono">{formatKg(monthlyMetrics.totalSalesKg)}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">Rata-rata Terjual per Hari:</span>
              <span className="font-bold text-slate-900 font-mono">
                {monthSummaries.length > 0
                  ? formatKg(monthlyMetrics.totalSalesKg / monthSummaries.length)
                  : '0 kg'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">Rata-rata Harga Pasar:</span>
              <span className="font-bold text-slate-900 font-mono">
                {formatRupiah(monthlyMetrics.avgPrice)}/kg
              </span>
            </div>
            <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200 flex items-center justify-between text-xs">
              <span className="text-emerald-900 font-medium">Total Omset Bulan Ini:</span>
              <span className="font-bold text-emerald-950 font-mono text-sm">
                {formatRupiah(monthlyMetrics.totalRevenue)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
