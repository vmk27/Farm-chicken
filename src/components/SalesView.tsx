import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  formatRupiah,
  formatKg,
  formatDateIndo,
  exportToCSV,
} from '../utils/formatters';
import {
  ShoppingBag,
  Search,
  Download,
  Plus,
  Printer,
  CheckCircle,
  Clock,
  Trash2,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { NewSaleModal } from './modals/NewSaleModal';
import { InvoiceModal } from './modals/InvoiceModal';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';
import { SaleRecord } from '../types';

export const SalesView: React.FC = () => {
  const {
    sales,
    deleteSale,
    markSalePaid,
    clearSalesData,
    totalStockKg,
    stockAssetValue,
    settings,
  } = useFarm();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [selectedInvoiceSale, setSelectedInvoiceSale] = useState<SaleRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id?: string; type: 'single' | 'all'; title: string; desc: string } | null>(null);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchSearch =
        s.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.date.includes(searchTerm) ||
        (s.notes && s.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus =
        selectedStatus === 'ALL' || s.paymentStatus === selectedStatus;

      return matchSearch && matchStatus;
    });
  }, [sales, searchTerm, selectedStatus]);

  const stats = useMemo(() => {
    const totalKg = filteredSales.reduce((acc, curr) => acc + curr.weightKg, 0);
    const totalRevenue = filteredSales.reduce((acc, curr) => acc + curr.totalRevenue, 0);
    const totalPaid = filteredSales.reduce((acc, curr) => acc + curr.amountPaid, 0);
    const totalDue = filteredSales.reduce((acc, curr) => acc + curr.remainingDue, 0);
    const avgPrice = totalKg > 0 ? Math.round(totalRevenue / totalKg) : 0;

    return {
      totalKg: Number(totalKg.toFixed(1)),
      totalRevenue,
      totalPaid,
      totalDue,
      avgPrice,
    };
  }, [filteredSales]);

  const handleExportCSV = () => {
    const exportData = filteredSales.map((s) => ({
      'No. Transaksi': s.invoiceNumber,
      Tanggal: s.date,
      'Grade Telur': s.grade,
      'Berat (Kg)': s.weightKg,
      'Harga / Kg': s.pricePerKg,
      Subtotal: s.subtotal,
      Diskon: s.discount,
      'Total Pendapatan (Rp)': s.totalRevenue,
      'Status Pembayaran': s.paymentStatus,
      'Metode Pembayaran': s.paymentMethod,
      'Sisa Tempo / Piutang': s.remainingDue,
      'Jatuh Tempo': s.dueDate || '',
      Catatan: s.notes || '',
    }));
    exportToCSV(`rekap_penjualan_telur_${new Date().toISOString().slice(0, 10)}`, exportData);
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Manajemen Penjualan & Kasir Telur</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan transaksi kasir, harga jual per kg, total pendapatan, dan pemotongan stok gudang
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {sales.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setDeleteTarget({
                  type: 'all',
                  title: 'Hapus Semua Data Penjualan Telur?',
                  desc: 'Seluruh riwayat transaksi penjualan dan nota faktur akan dihapus permanen.',
                })
              }
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua Penjualan</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Unduh CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewSaleOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Jual Telur Baru</span>
          </button>
        </div>
      </div>

      {/* TAMPILKAN TOTAL STOK TELUR DAHULU SEBELUM TRANSAKSI */}
      <div
        className={`p-5 rounded-2xl border transition-all shadow-2xs ${
          totalStockKg <= 0
            ? 'bg-rose-50/90 border-rose-300'
            : totalStockKg < settings.lowStockThresholdKg
            ? 'bg-amber-50/90 border-amber-300'
            : 'bg-emerald-50/70 border-emerald-300'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                totalStockKg <= 0
                  ? 'bg-rose-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Total Stok Telur Siap Jual di Gudang
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    totalStockKg <= 0
                      ? 'bg-rose-200 text-rose-800'
                      : totalStockKg < settings.lowStockThresholdKg
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-emerald-200 text-emerald-800'
                  }`}
                >
                  {totalStockKg <= 0
                    ? 'Stok Kosong'
                    : totalStockKg < settings.lowStockThresholdKg
                    ? 'Stok Menipis'
                    : 'Stok Tersedia'}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                  {formatKg(totalStockKg)}
                </span>
                <span className="text-xs text-slate-600 font-medium">
                  Stok Telur Siap Kirim
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <div className="text-right hidden sm:block">
              <span className="text-[11px] text-slate-500 block">Nilai Valuasi Stok:</span>
              <span className="text-sm font-bold font-mono text-emerald-800">
                {formatRupiah(stockAssetValue)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsNewSaleOpen(true)}
              disabled={totalStockKg <= 0}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all ${
                totalStockKg <= 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>
                {totalStockKg <= 0
                  ? 'Stok Habis'
                  : `+ Jual Telur (Maks: ${formatKg(totalStockKg)})`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 block">Total Volume Terjual</span>
          <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
            {formatKg(stats.totalKg)}
          </span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 block">Total Omset Pendapatan</span>
          <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
            {formatRupiah(stats.totalRevenue)}
          </span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
          <span className="text-[11px] text-emerald-800 block">Kas Masuk (Lunas)</span>
          <span className="text-base font-bold text-emerald-950 font-mono tabular-nums">
            {formatRupiah(stats.totalPaid)}
          </span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-amber-200 bg-amber-50/30 shadow-2xs">
          <span className="text-[11px] text-amber-800 block">Piutang / Tempo</span>
          <span className="text-base font-bold text-amber-950 font-mono tabular-nums">
            {formatRupiah(stats.totalDue)}
          </span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 block">Rata-rata Harga / Kg</span>
          <span className="text-base font-bold text-sky-700 font-mono tabular-nums">
            {formatRupiah(stats.avgPrice)}
          </span>
        </div>
      </div>

      {/* Filter and Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari no nota, tanggal, catatan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Status Bayar</option>
              <option value="Lunas">Lunas</option>
              <option value="Tempo">Tempo (Hutang)</option>
              <option value="Sebagian">Sebagian (DP)</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-mono self-end sm:self-auto">
            Menampilkan <strong className="text-slate-800">{filteredSales.length}</strong> transaksi penjualan
          </div>
        </div>

        {/* Sales Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-semibold">
                <th className="py-3 px-4">Tanggal & No. Nota</th>
                <th className="py-3 px-4">Produk</th>
                <th className="py-3 px-4 text-right">Berat Terjual (Kg)</th>
                <th className="py-3 px-4 text-right">Harga Jual / Kg</th>
                <th className="py-3 px-4 text-right">Total Pendapatan</th>
                <th className="py-3 px-4 text-center">Status Bayar</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-600">
                      Tidak ada data penjualan yang cocok
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Silakan klik tombol "+ Jual Telur Baru" untuk mencatat transaksi.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">
                        {sale.invoiceNumber}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {formatDateIndo(sale.date)}
                      </span>
                      {sale.notes && (
                        <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                          {sale.notes}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-900 font-medium">Telur Standar</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900 font-bold">
                      {formatKg(sale.weightKg)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {formatRupiah(sale.pricePerKg)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                      {formatRupiah(sale.totalRevenue)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                            sale.paymentStatus === 'Lunas'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {sale.paymentStatus}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          {sale.paymentMethod}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceSale(sale)}
                          className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="Lihat / Cetak Nota Faktur"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {sale.paymentStatus !== 'Lunas' && (
                          <button
                            type="button"
                            onClick={() => markSalePaid(sale.id)}
                            className="p-1 rounded-md text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                            title="Tandai Lunas"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({
                              id: sale.id,
                              type: 'single',
                              title: `Hapus Transaksi ${sale.invoiceNumber}?`,
                              desc: `Transaksi ${sale.grade} seberat ${formatKg(
                                sale.weightKg
                              )} senilai ${formatRupiah(sale.totalRevenue)} akan dihapus.`,
                            })
                          }
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewSaleModal
        isOpen={isNewSaleOpen}
        onClose={() => setIsNewSaleOpen(false)}
        onSuccessCreated={(created) => setSelectedInvoiceSale(created)}
      />

      <InvoiceModal
        sale={selectedInvoiceSale}
        isOpen={!!selectedInvoiceSale}
        onClose={() => setSelectedInvoiceSale(null)}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.title || 'Hapus Data'}
        description={deleteTarget?.desc || ''}
        onConfirm={() => {
          if (deleteTarget?.type === 'all') {
            clearSalesData();
          } else if (deleteTarget?.id) {
            deleteSale(deleteTarget.id);
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
