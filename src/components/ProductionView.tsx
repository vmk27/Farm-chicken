import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  formatKg,
  formatDateIndo,
  exportToCSV,
  formatNumber,
} from '../utils/formatters';
import {
  Egg,
  Search,
  Download,
  Plus,
  Trash2,
  Users,
  Home,
  Scale,
} from 'lucide-react';
import { NewProductionModal } from './modals/NewProductionModal';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';

export const ProductionView: React.FC = () => {
  const { productions, deleteProduction, clearProductionData, flocks } = useFarm();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFlock, setSelectedFlock] = useState<string>('ALL');
  const [isNewProdOpen, setIsNewProdOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id?: string; type: 'single' | 'all'; title: string; desc: string } | null>(null);

  // Filtered productions
  const filteredList = useMemo(() => {
    return productions.filter((item) => {
      const matchSearch =
        item.flockName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.operator && item.operator.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.date.includes(searchTerm) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchFlock =
        selectedFlock === 'ALL' || item.flockId === selectedFlock;

      return matchSearch && matchFlock;
    });
  }, [productions, searchTerm, selectedFlock]);

  // Aggregate statistics of filtered list (purely weight-focused & coop capacity)
  const stats = useMemo(() => {
    const totalKg = filteredList.reduce((acc, curr) => acc + (curr.weightKgTotal || 0), 0);
    const uniqueDates = new Set(filteredList.map((p) => p.date)).size;
    const avgKg = uniqueDates > 0 ? totalKg / uniqueDates : totalKg;
    const totalHens = flocks.reduce((acc, curr) => acc + (curr.henCount || 0), 0);

    return {
      totalKg: Number(totalKg.toFixed(1)),
      count: filteredList.length,
      avgKg: Number(avgKg.toFixed(1)),
      totalHens,
    };
  }, [filteredList, flocks]);

  const handleExportCSV = () => {
    const exportData = filteredList.map((p) => ({
      'ID Panen': p.id,
      Tanggal: p.date,
      Kandang: p.flockName,
      'Populasi Ayam (Ekor)': p.henPopulation || 0,
      'Berat Panen (Kg)': p.weightKgTotal,
      Petugas: p.operator || '-',
      Catatan: p.notes || '',
    }));
    exportToCSV(`rekap_panen_telur_${new Date().toISOString().slice(0, 10)}`, exportData);
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Manajemen Produksi & Panen Telur</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan penambahan stok telur dari hasil panen kandang dalam satuan Kilogram (Kg)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {productions.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setDeleteTarget({
                  type: 'all',
                  title: 'Hapus Semua Data Panen Telur?',
                  desc: 'Seluruh histori panen telur akan dihapus permanen. Aksi ini tidak dapat dibatalkan.',
                })
              }
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua Panen</span>
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
            onClick={() => setIsNewProdOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Panen Baru</span>
          </button>
        </div>
      </div>

      {/* Aggregate Stat Strip - Purely Kg & Kandang without butir or grade */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-xs font-semibold text-slate-500">Total Berat Panen</span>
            <div className="p-1 rounded-md bg-amber-50 text-amber-700">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {formatKg(stats.totalKg)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1">Total akumulasi panen</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-xs font-semibold text-slate-500">Jumlah Catatan Panen</span>
            <div className="p-1 rounded-md bg-emerald-50 text-emerald-700">
              <Egg className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {formatNumber(stats.count)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1">Pencatatan tersimpan</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-xs font-semibold text-slate-500">Rata-rata Panen / Hari</span>
            <div className="p-1 rounded-md bg-sky-50 text-sky-700">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl sm:text-2xl font-bold text-sky-800 font-mono tabular-nums">
            {formatKg(stats.avgKg)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1">Per hari aktif</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-xs font-semibold text-slate-500">Populasi Ayam Kandang</span>
            <div className="p-1 rounded-md bg-purple-50 text-purple-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl sm:text-2xl font-bold text-purple-900 font-mono tabular-nums">
            {formatNumber(stats.totalHens)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1">Ekor produktif</span>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari tanggal, kandang, petugas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <select
              value={selectedFlock}
              onChange={(e) => setSelectedFlock(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">Semua Kandang</option>
              {flocks.map((flock) => (
                <option key={flock.id} value={flock.id}>
                  {flock.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-500 font-mono self-end sm:self-auto">
            Menampilkan <strong className="text-slate-800">{filteredList.length}</strong> catatan panen
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-semibold">
                <th className="py-3 px-4">Tanggal Panen</th>
                <th className="py-3 px-4">Asal Kandang</th>
                <th className="py-3 px-4 text-right">Populasi Ayam (Kandang)</th>
                <th className="py-3 px-4 text-right">Berat Panen (Kg)</th>
                <th className="py-3 px-4">Petugas / Operator</th>
                <th className="py-3 px-4">Catatan</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Egg className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-600">
                      Tidak ada catatan panen yang sesuai filter
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Silakan klik tombol "+ Catat Panen Baru" untuk menambah data panen.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {formatDateIndo(item.date)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {item.flockName}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {item.henPopulation ? `${item.henPopulation.toLocaleString('id-ID')} Ekor` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900 font-bold text-sm">
                      {formatKg(item.weightKgTotal)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {item.operator || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                      {item.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            id: item.id,
                            type: 'single',
                            title: `Hapus Catatan Panen ${item.date}?`,
                            desc: `Catatan panen kandang "${item.flockName}" seberat ${formatKg(
                              item.weightKgTotal
                            )} akan dihapus.`,
                          })
                        }
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Hapus data panen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewProductionModal
        isOpen={isNewProdOpen}
        onClose={() => setIsNewProdOpen(false)}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.title || 'Hapus Data'}
        description={deleteTarget?.desc || ''}
        onConfirm={() => {
          if (deleteTarget?.type === 'all') {
            clearProductionData();
          } else if (deleteTarget?.id) {
            deleteProduction(deleteTarget.id);
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
