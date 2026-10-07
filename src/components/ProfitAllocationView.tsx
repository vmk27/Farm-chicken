import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  formatRupiah,
  formatNumber,
  formatDateIndo,
  formatKg,
  exportToCSV,
} from '../utils/formatters';
import {
  PieChart,
  Calculator,
  Plus,
  Download,
  Wallet,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Search,
} from 'lucide-react';
import { AllocationDonutChart } from './charts/AllocationDonutChart';
import { NewExpenseModal } from './modals/NewExpenseModal';
import { ExpenseCategory } from '../types';

export const ProfitAllocationView: React.FC = () => {
  const {
    todayDate,
    todayRevenue,
    todayEstimatedCost,
    todayProfit,
    todaySalesKg,
    settings,
    dailySummaries,
    allocatedVaults,
    calculateAllocation,
  } = useFarm();

  // Mode: 'today' | 'history_date' | 'custom'
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const [mode, setMode] = useState<'today' | 'selected' | 'custom'>('today');
  const [customProfitInput, setCustomProfitInput] = useState<string>('3000000');
  const [selectedVaultExpenseCat, setSelectedVaultExpenseCat] = useState<ExpenseCategory | null>(null);
  const [tableSearch, setTableSearch] = useState('');

  // Find summary for selected date
  const selectedSummary = useMemo(() => {
    return dailySummaries.find((s) => s.date === selectedDate);
  }, [dailySummaries, selectedDate]);

  // Current active profit amount to convert
  const activeConversion = useMemo(() => {
    if (mode === 'today') {
      const summary = dailySummaries.find((s) => s.date === todayDate);
      const profit = summary ? summary.netProfit : todayProfit;
      const salesKg = summary ? summary.totalSalesKg : todaySalesKg;
      const revenue = summary ? summary.totalRevenue : todayRevenue;
      const cost = summary ? summary.estimatedCost : todayEstimatedCost;

      return {
        date: todayDate,
        salesKg,
        revenue,
        cost,
        profit,
        allocations: calculateAllocation(profit),
        isAuto: true,
        label: `Hari Ini (${formatDateIndo(todayDate)})`,
      };
    } else if (mode === 'selected' && selectedSummary) {
      return {
        date: selectedSummary.date,
        salesKg: selectedSummary.totalSalesKg,
        revenue: selectedSummary.totalRevenue,
        cost: selectedSummary.estimatedCost,
        profit: selectedSummary.netProfit,
        allocations: calculateAllocation(selectedSummary.netProfit),
        isAuto: true,
        label: formatDateIndo(selectedSummary.date),
      };
    } else {
      const numCustom = parseFloat(customProfitInput) || 0;
      return {
        date: todayDate,
        salesKg: 0,
        revenue: 0,
        cost: 0,
        profit: numCustom,
        allocations: calculateAllocation(numCustom),
        isAuto: false,
        label: 'Simulasi Manual',
      };
    }
  }, [
    mode,
    selectedSummary,
    customProfitInput,
    todayDate,
    todayProfit,
    todaySalesKg,
    todayRevenue,
    todayEstimatedCost,
    dailySummaries,
    calculateAllocation,
  ]);

  // Allocation item cards config
  const allocationConfigs = [
    {
      key: 'pakan' as const,
      cat: 'pakan' as ExpenseCategory,
      title: 'Pakan Layer & Konsentrat',
      pct: settings.allocations.pakan, // 63%
      nominal: activeConversion.allocations.pakan,
      colorBg: 'bg-amber-50/70',
      colorBorder: 'border-amber-200',
      colorText: 'text-amber-900',
      colorBadge: 'bg-amber-100 text-amber-900 border border-amber-300/60',
      desc: 'Pakan merupakan komponen modal terbesar (63%). Otomatis disisihkan dari laba penjualan untuk pasokan konsentrat & jagung.',
      getEquiv: (nominal: number) => {
        const sak = nominal / 430000;
        return `±${formatNumber(sak, 1)} Sak (@50kg)`;
      },
      vault: allocatedVaults.pakan,
    },
    {
      key: 'pembelianAyam' as const,
      cat: 'bibit_ayam' as ExpenseCategory,
      title: 'Pembelian Ayam / Pullet Baru',
      pct: settings.allocations.pembelianAyam, // 20%
      nominal: activeConversion.allocations.pembelianAyam,
      colorBg: 'bg-sky-50/70',
      colorBorder: 'border-sky-200',
      colorText: 'text-sky-900',
      colorBadge: 'bg-sky-100 text-sky-900 border border-sky-300/60',
      desc: 'Dana peremajaan ayam (20%) untuk membeli bibit pullet siap telur (umur 16 minggu) guna regenerasi kandang berkala.',
      getEquiv: (nominal: number) => {
        const pullet = nominal / 85000;
        return `±${formatNumber(pullet, 0)} Ekor Pullet`;
      },
      vault: allocatedVaults.pembelianAyam,
    },
    {
      key: 'upahKerja' as const,
      cat: 'upah' as ExpenseCategory,
      title: 'Upah Kerja & Gaji Karyawan',
      pct: settings.allocations.upahKerja, // 12%
      nominal: activeConversion.allocations.upahKerja,
      colorBg: 'bg-emerald-50/70',
      colorBorder: 'border-emerald-200',
      colorText: 'text-emerald-900',
      colorBadge: 'bg-emerald-100 text-emerald-900 border border-emerald-300/60',
      desc: 'Alokasi penggajian (12%) untuk operator kandang, petugas sortir, kebersihan, dan pemungutan telur.',
      getEquiv: (_nominal: number) => 'Gaji Operator Terjamin',
      vault: allocatedVaults.upahKerja,
    },
    {
      key: 'vitaminVaksin' as const,
      cat: 'vaksin' as ExpenseCategory,
      title: 'Vitamin, Vaksin & Obat-obatan',
      pct: settings.allocations.vitaminVaksin, // 3.5%
      nominal: activeConversion.allocations.vitaminVaksin,
      colorBg: 'bg-purple-50/70',
      colorBorder: 'border-purple-200',
      colorText: 'text-purple-900',
      colorBadge: 'bg-purple-100 text-purple-900 border border-purple-300/60',
      desc: 'Suplemen nutrisi (3.5%) asam amino, mineral kalsium cangkang tebal, probiotik, dan vaksinasi unggas.',
      getEquiv: (_nominal: number) => 'Kesehatan & Daya Tahan Unggas',
      vault: allocatedVaults.vitaminVaksin,
    },
    {
      key: 'listrik' as const,
      cat: 'listrik' as ExpenseCategory,
      title: 'Listrik & Genset Farm',
      pct: settings.allocations.listrik, // 0.5%
      nominal: activeConversion.allocations.listrik,
      colorBg: 'bg-orange-50/70',
      colorBorder: 'border-orange-200',
      colorText: 'text-orange-900',
      colorBadge: 'bg-orange-100 text-orange-900 border border-orange-300/60',
      desc: 'Kebutuhan daya (0.5%) untuk blower kandang tertutup, pompa sirkulasi air, dan lampu induksi bertelur.',
      getEquiv: (_nominal: number) => 'Token Listrik & BBM Genset',
      vault: allocatedVaults.listrik,
    },
    {
      key: 'air' as const,
      cat: 'air' as ExpenseCategory,
      title: 'Air Bersih & Nipple Sanitasi',
      pct: settings.allocations.air, // 0.5%
      nominal: activeConversion.allocations.air,
      colorBg: 'bg-cyan-50/70',
      colorBorder: 'border-cyan-200',
      colorText: 'text-cyan-900',
      colorBadge: 'bg-cyan-100 text-cyan-900 border border-cyan-300/60',
      desc: 'Pasokan air minum bersih (0.5%) 24 jam nonstop via nipple drinker dan sanitasi kandang.',
      getEquiv: (_nominal: number) => 'Filter & Perawatan Pompa Air',
      vault: allocatedVaults.air,
    },
  ];

  // Filter table records
  const filteredDailyList = useMemo(() => {
    return dailySummaries
      .filter((s) => s.date.includes(tableSearch))
      .slice()
      .reverse();
  }, [dailySummaries, tableSearch]);

  const handleExportAllocationsCSV = () => {
    const exportData = dailySummaries.map((s) => ({
      Tanggal: s.date,
      'Volume Terjual (Kg)': s.totalSalesKg,
      'Omset Penjualan (Rp)': s.totalRevenue,
      'Estimasi HPP (Rp)': s.estimatedCost,
      'Laba Bersih Harian (Rp)': s.netProfit,
      'Pakan (63%)': s.modalAllocation.pakan,
      'Pembelian Ayam (20%)': s.modalAllocation.pembelianAyam,
      'Upah Kerja (12%)': s.modalAllocation.upahKerja,
      'Vitamin & Vaksin (3.5%)': s.modalAllocation.vitaminVaksin,
      'Listrik (0.5%)': s.modalAllocation.listrik,
      'Air (0.5%)': s.modalAllocation.air,
      'Status Konversi': 'Otomatis Terkonversi',
    }));
    exportToCSV(`rekap_konversi_alokasi_laba_${new Date().toISOString().slice(0, 10)}`, exportData);
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Konversi Otomatis Alokasi Modal dari Laba Harian
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 bg-emerald-100 rounded-full border border-emerald-300">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Auto-Converted</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Sistem secara otomatis menghitung laba penjualan telur harian dan mengonversinya ke 6 pos modal produksi (100%)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportAllocationsCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Unduh Rekap Alokasi (CSV)</span>
          </button>
        </div>
      </div>

      {/* Mode & Date Control Toolbar */}
      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setMode('today')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'today'
                ? 'bg-white text-emerald-800 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Laba Hari Ini ({formatDateIndo(todayDate)})
          </button>

          <button
            type="button"
            onClick={() => setMode('selected')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'selected'
                ? 'bg-white text-emerald-800 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pilih Tanggal Riwayat
          </button>

          <button
            type="button"
            onClick={() => setMode('custom')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'custom'
                ? 'bg-white text-amber-800 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Simulasi Nominal Bebas
          </button>
        </div>

        {/* Date Selector or Custom Input based on mode */}
        <div className="flex items-center gap-2">
          {mode === 'selected' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Tanggal:</span>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
              >
                {dailySummaries
                  .slice()
                  .reverse()
                  .map((s) => (
                    <option key={s.date} value={s.date}>
                      {formatDateIndo(s.date)} — Laba: {formatRupiah(s.netProfit)}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {mode === 'custom' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Nominal Laba:</span>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-xs font-bold text-slate-400">
                  Rp
                </span>
                <input
                  type="number"
                  step="100000"
                  min="0"
                  value={customProfitInput}
                  onChange={(e) => setCustomProfitInput(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs font-bold font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 w-44 bg-white"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Conversion Overview Card */}
      <div className="p-4 sm:p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
        {/* Conversion Header & Metrics Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Hasil Konversi Laba: {activeConversion.label}
              </h3>
              {activeConversion.isAuto && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dikonversi Otomatis dari Penjualan</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pembagian laba harian 100% dialokasikan ke 6 pos pengeluaran modal produksi
            </p>
          </div>

          {/* Key Financial KPIs for this conversion */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
            {activeConversion.isAuto && (
              <>
                <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <span className="text-[10px] text-slate-500 block">Omset Penjualan</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {formatRupiah(activeConversion.revenue)}
                  </span>
                </div>

                <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <span className="text-[10px] text-slate-500 block">Estimasi HPP Dasar</span>
                  <span className="font-bold text-slate-700 font-mono">
                    {formatRupiah(activeConversion.cost)}
                  </span>
                </div>
              </>
            )}

            <div className="px-3.5 py-2 bg-emerald-50 rounded-lg border border-emerald-300 text-xs">
              <span className="text-[10px] text-emerald-800 font-semibold block">
                Total Laba Bersih yang Dikonversi
              </span>
              <span className="text-base font-bold text-emerald-950 font-mono tabular-nums">
                {formatRupiah(activeConversion.profit)}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Chart and Live Output */}
        <AllocationDonutChart
          profitAmount={activeConversion.profit}
          allocations={settings.allocations}
        />
      </div>

      {/* 6 Capital Envelopes Detailed Grid (Pos Tabungan Modal Otomatis) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">
              Rincian 6 Pos Alokasi Modal ({activeConversion.label})
            </h3>
          </div>
          <span className="text-xs text-emerald-700 font-medium font-mono hidden sm:inline">
            ✓ Total Alokasi 100%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {allocationConfigs.map((item) => {
            const vault = item.vault;

            return (
              <div
                key={item.key}
                className={`p-5 rounded-xl border ${item.colorBorder} ${item.colorBg} shadow-2xs flex flex-col justify-between space-y-4`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${item.colorBadge}`}>
                      {item.pct}% Alokasi
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedVaultExpenseCat(item.cat)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white/90 hover:bg-white px-2.5 py-1 rounded-md border border-slate-200 transition-colors shadow-2xs"
                      title={`Catat Pembelian / Belanja ${item.title}`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>Catat Belanja</span>
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.desc}</p>

                  {/* Nominal Conversion from Daily Profit */}
                  <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block">
                        Alokasi dari Laba Harian:
                      </span>
                      <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                        {formatRupiah(item.nominal)}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-700 font-mono">
                      {item.getEquiv(item.nominal)}
                    </span>
                  </div>
                </div>

                {/* Vault Budget Accumulation Status */}
                <div className="p-3 bg-white/95 rounded-lg border border-slate-200/90 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Terakumulasi:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {formatRupiah(vault.allocated)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Realisasi Terpakai:</span>
                    <span className="font-mono font-semibold text-rose-700">
                      -{formatRupiah(vault.spent)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-900 font-bold">
                    <span>Sisa Saldo Kas Pos:</span>
                    <span className="font-mono text-emerald-800">
                      {formatRupiah(vault.remaining)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily History Table of Automated Profit Allocations */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Tabel Riwayat Konversi Otomatis Alokasi Modal Harian
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rekap harian pembagian laba penjualan ke masing-masing pos modal (Pakan, Ayam, Upah, Vaksin, Listrik, Air)
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari tanggal (YYYY-MM)..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-semibold">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4 text-right">Omset (Rp)</th>
                <th className="py-3 px-4 text-right">Laba Bersih (Rp)</th>
                <th className="py-3 px-4 text-right">Pakan (63%)</th>
                <th className="py-3 px-4 text-right">Ayam (20%)</th>
                <th className="py-3 px-4 text-right">Upah (12%)</th>
                <th className="py-3 px-4 text-right">Vaksin (3.5%)</th>
                <th className="py-3 px-4 text-right">Listrik (0.5%)</th>
                <th className="py-3 px-4 text-right">Air (0.5%)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDailyList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Tidak ada data riwayat yang cocok
                  </td>
                </tr>
              ) : (
                filteredDailyList.map((s) => (
                  <tr
                    key={s.date}
                    onClick={() => {
                      setSelectedDate(s.date);
                      setMode('selected');
                    }}
                    className={`hover:bg-emerald-50/50 cursor-pointer transition-colors ${
                      selectedDate === s.date && mode === 'selected' ? 'bg-emerald-50/80 font-medium' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {formatDateIndo(s.date)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {formatRupiah(s.totalRevenue)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">
                      {formatRupiah(s.netProfit)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-amber-800 font-medium">
                      {formatRupiah(s.modalAllocation.pakan)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-sky-800 font-medium">
                      {formatRupiah(s.modalAllocation.pembelianAyam)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-800 font-medium">
                      {formatRupiah(s.modalAllocation.upahKerja)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-purple-800 font-medium">
                      {formatRupiah(s.modalAllocation.vitaminVaksin)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-orange-800 font-medium">
                      {formatRupiah(s.modalAllocation.listrik)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-cyan-800 font-medium">
                      {formatRupiah(s.modalAllocation.air)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Otomatis</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Modal */}
      {selectedVaultExpenseCat && (
        <NewExpenseModal
          isOpen={!!selectedVaultExpenseCat}
          onClose={() => setSelectedVaultExpenseCat(null)}
          defaultCategory={selectedVaultExpenseCat}
        />
      )}
    </div>
  );
};
