import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  formatRupiah,
  formatKg,
  formatDateIndo,
  formatNumber,
} from '../utils/formatters';
import {
  Egg,
  ShoppingBag,
  Layers,
  DollarSign,
  TrendingUp,
  PieChart,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  Receipt,
} from 'lucide-react';
import { AllocationDonutChart } from './charts/AllocationDonutChart';
import { ProductionSalesChart } from './charts/ProductionSalesChart';
import { PriceTrendChart } from './charts/PriceTrendChart';
import { RevenueProfitChart } from './charts/RevenueProfitChart';
import { InvoiceModal } from './modals/InvoiceModal';
import { SaleRecord } from '../types';
import { PhoneAppMenuGrid } from './PhoneAppMenuGrid';

export const Dashboard: React.FC = () => {
  const {
    todayDate,
    todayProductionKg,
    todaySalesKg,
    todayRevenue,
    todayProfit,
    totalStockKg,
    stockAssetValue,
    settings,
    dailySummaries,
    sales,
    productions,
    calculateAllocation,
    setActiveTab,
  } = useFarm();

  const [activeChartTab, setActiveChartTab] = useState<'production' | 'price' | 'revenue'>('production');
  const [selectedSaleForInvoice, setSelectedSaleForInvoice] = useState<SaleRecord | null>(null);

  // Today's allocations
  const todayAllocation = calculateAllocation(todayProfit);

  // Latest 5 sales & productions
  const recentSales = sales.slice(0, 5);
  const recentProductions = productions.slice(0, 4);

  // Stock alert
  const isStockLow = totalStockKg < settings.lowStockThresholdKg;

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Stock Low Warning Banner if applicable */}
      {isStockLow && (
        <div className="p-3.5 sm:p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-amber-900 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Peringatan Sisa Stok Menipis!</span> Sisa stok telur di gudang saat ini ({formatKg(totalStockKg)}) di bawah batas aman ({formatKg(settings.lowStockThresholdKg)}).
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('stok')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors shrink-0 self-end sm:self-auto"
          >
            Cek Stok Gudang
          </button>
        </div>
      )}

      {/* KPI Metrics Grid - 2 cols on mobile, 3 on tablet, 6 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-4">
        {/* Produksi Hari Ini */}
        <div className="p-3 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1 sm:mb-2">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">Produksi Hari Ini</span>
              <div className="p-1 rounded-md bg-amber-50 text-amber-600 shrink-0">
                <Egg className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-bold text-slate-900 font-mono tabular-nums">
              {formatKg(todayProductionKg)}
            </div>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 mt-1.5 sm:mt-2 flex items-center justify-between">
            <span className="truncate">Panen Harian</span>
            <span className="text-amber-600 font-medium hidden sm:inline">Stok Masuk</span>
          </div>
        </div>

        {/* Telur Terjual Hari Ini */}
        <div className="p-3 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1 sm:mb-2">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">Telur Terjual</span>
              <div className="p-1 rounded-md bg-emerald-50 text-emerald-600 shrink-0">
                <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-bold text-slate-900 font-mono tabular-nums">
              {formatKg(todaySalesKg)}
            </div>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 mt-1.5 sm:mt-2 flex items-center justify-between">
            <span className="truncate">Penjualan Harian</span>
            <span className="text-emerald-600 font-medium hidden sm:inline">Telur Terjual</span>
          </div>
        </div>

        {/* Sisa Stok Telur */}
        <div className="p-3 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1 sm:mb-2">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">Sisa Stok Gudang</span>
              <div className="p-1 rounded-md bg-sky-50 text-sky-600 shrink-0">
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-base sm:text-xl font-bold text-slate-900 font-mono tabular-nums">
              {formatKg(totalStockKg)}
            </div>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 mt-1.5 sm:mt-2 flex items-center justify-between">
            <span className="truncate">Estimasi Nilai:</span>
            <span className="text-slate-600 font-mono font-medium hidden sm:inline">{formatRupiah(stockAssetValue)}</span>
          </div>
        </div>

        {/* Pendapatan / Omset Hari Ini */}
        <div className="p-3 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1 sm:mb-2">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">Omset Hari Ini</span>
              <div className="p-1 rounded-md bg-slate-100 text-slate-800 shrink-0">
                <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-sm sm:text-lg font-bold text-slate-900 font-mono tabular-nums truncate">
              {formatRupiah(todayRevenue)}
            </div>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 mt-1.5 sm:mt-2 flex items-center justify-between">
            <span>Penjualan</span>
            <span className="text-emerald-600 font-medium">Real-time</span>
          </div>
        </div>

        {/* Keuntungan Bersih Hari Ini */}
        <div className="p-3 sm:p-4 bg-white rounded-xl border border-emerald-200 bg-emerald-50/20 hover:border-emerald-300 transition-colors shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1 sm:mb-2">
              <span className="text-[11px] sm:text-xs font-semibold text-emerald-800 truncate">Laba Bersih</span>
              <div className="p-1 rounded-md bg-emerald-100 text-emerald-800 shrink-0">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-sm sm:text-lg font-bold text-emerald-950 font-mono tabular-nums truncate">
              {formatRupiah(todayProfit)}
            </div>
          </div>
          <div className="text-[10px] sm:text-xs text-emerald-700 mt-1.5 sm:mt-2 flex items-center justify-between">
            <span>100% Konversi</span>
            <span className="font-semibold text-emerald-800 hidden sm:inline">Modal Farm</span>
          </div>
        </div>

        {/* Harga Jual per Kg Terkini */}
        <div className="p-3 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1 sm:mb-2">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">Harga Acuan / Kg</span>
              <div className="p-1 rounded-md bg-amber-50 text-amber-700 shrink-0">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-sm sm:text-lg font-bold text-slate-900 font-mono tabular-nums truncate">
              {formatRupiah(settings.currentMarketPricePerKg)}
            </div>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 mt-1.5 sm:mt-2 flex items-center justify-between">
            <span className="truncate">Telur Standar</span>
            <span className="text-slate-400 font-mono">/kg</span>
          </div>
        </div>
      </div>

      {/* Menu Pintasan Handphone / Smartphone App Menu Grid */}
      <PhoneAppMenuGrid variant="dashboard" />

      {/* CORE HIGHLIGHT: Daily Profit Allocation to Production Capital */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-amber-100 text-amber-800">
                <PieChart className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Konversi Keuntungan Harian ke Modal Produksi
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Alokasi otomatis dari laba hari ini ({formatRupiah(todayProfit)}) untuk menjamin kelangsungan operasional peternakan
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('alokasi')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-amber-950 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors self-start sm:self-auto"
          >
            <span>Buka Pos Dana & Simulator Alokasi</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Donut Chart & 6 Categorical Capital Envelopes */}
        <AllocationDonutChart
          profitAmount={todayProfit}
          allocations={settings.allocations}
        />

        {/* Informational Formula Strip */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Formula Rasio Modal:</span>
            <span className="font-mono text-slate-700">
              Pakan (63%) + Ayam (20%) + Upah (12%) + Vaksin (3.5%) + Listrik (0.5%) + Air (0.5%) = 100%
            </span>
          </div>
          <div className="text-slate-500 text-[11px] font-mono">
            Total Terkonversi Hari Ini:{' '}
            <strong className="text-emerald-700 font-bold">{formatRupiah(todayAllocation.total)}</strong>
          </div>
        </div>
      </div>

      {/* Real-time Interactive Monthly Charts Section */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Laporan Grafik Performa Bisnis</h3>
            <p className="text-xs text-slate-500">
              Pantau tren produksi, penjualan, harga pasar, dan profitabilitas secara real-time
            </p>
          </div>

          {/* Segmented Tab Controls */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveChartTab('production')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeChartTab === 'production'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Produksi vs Terjual
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('revenue')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeChartTab === 'revenue'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Omset & Laba Bersih
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('price')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeChartTab === 'price'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tren Harga Jual / kg
            </button>
          </div>
        </div>

        {/* Dynamic Chart Display */}
        <div className="pt-2">
          {activeChartTab === 'production' && (
            <ProductionSalesChart data={dailySummaries} />
          )}
          {activeChartTab === 'revenue' && (
            <RevenueProfitChart data={dailySummaries} />
          )}
          {activeChartTab === 'price' && (
            <PriceTrendChart
              data={dailySummaries}
              currentBenchmark={settings.currentMarketPricePerKg}
            />
          )}
        </div>
      </div>

      {/* Two Column Layout: Recent Sales & Recent Harvests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales Table */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Transaksi Penjualan Terkini</h4>
              <p className="text-xs text-slate-500">5 transaksi penjualan telur terakhir</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('penjualan')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentSales.map((sale) => (
              <div
                key={sale.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 px-2 rounded-lg transition-colors cursor-pointer"
                onClick={() => setSelectedSaleForInvoice(sale)}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate font-mono">
                      {sale.invoiceNumber}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                      {sale.grade}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span className="font-semibold text-slate-800">{formatKg(sale.weightKg)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatRupiah(sale.pricePerKg)}/kg</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{formatDateIndo(sale.date)}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-slate-900 font-mono tabular-nums block">
                    {formatRupiah(sale.totalRevenue)}
                  </span>
                  <span
                    className={`text-[10px] font-semibold ${
                      sale.paymentStatus === 'Lunas' ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {sale.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Harvests */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Pencatatan Panen Terkini</h4>
              <p className="text-xs text-slate-500">Panen telur dari masing-masing kandang</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('produksi')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentProductions.map((prod) => (
              <div
                key={prod.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 px-2 rounded-lg transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {prod.flockName.split('(')[0]}
                    </span>
                    {prod.henPopulation && (
                      <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded font-mono">
                        {prod.henPopulation.toLocaleString('id-ID')} Ekor
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span className="font-mono">{formatDateIndo(prod.date)}</span>
                    {prod.operator && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-400">Petugas: {prod.operator}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-slate-900 font-mono tabular-nums block">
                    {formatKg(prod.weightKgTotal)}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium">
                    + Stok Masuk
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invoice Modal if selected */}
      <InvoiceModal
        sale={selectedSaleForInvoice}
        isOpen={!!selectedSaleForInvoice}
        onClose={() => setSelectedSaleForInvoice(null)}
      />
    </div>
  );
};
