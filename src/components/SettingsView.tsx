import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { formatRupiah } from '../utils/formatters';
import {
  Settings,
  DollarSign,
  Building,
  PieChart,
  Database,
  Save,
  RotateCcw,
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  Trash2,
  Home,
  Plus,
  Edit3,
  Users,
  CloudDownload,
  RefreshCw,
  Lock,
  Key,
} from 'lucide-react';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';
import { FlockModal } from './modals/FlockModal';
import { AutoDbSetupModal } from './modals/AutoDbSetupModal';
import { Flock } from '../types';
import { downloadSupabaseDatabaseDump } from '../services/dbManager';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    updateAllocations,
    flocks,
    productions,
    sales,
    expenses,
    stockAdjustments,
    addFlock,
    updateFlock,
    deleteFlock,
    exportDatabaseJSON,
    importDatabaseJSON,
    resetToDefaultData,
    clearAllData,
    clearProductionData,
    clearSalesData,
    clearExpenseData,
    clearStockAdjustments,
  } = useFarm();

  // Flock & DB Management State
  const [isFlockModalOpen, setIsFlockModalOpen] = useState(false);
  const [isAutoDbModalOpen, setIsAutoDbModalOpen] = useState(false);
  const [editingFlock, setEditingFlock] = useState<Flock | null>(null);
  const [isDumping, setIsDumping] = useState(false);

  // Protected Backup & Restore Token State
  const [securityToken, setSecurityToken] = useState('');
  const [isBackupUnlocked, setIsBackupUnlocked] = useState(false);
  const [tokenError, setSecurityTokenError] = useState('');

  // Price States
  const [marketPrice, setMarketPrice] = useState(String(settings.currentMarketPricePerKg));
  const [priceGradeA, setPriceGradeA] = useState(String(settings.defaultPriceGradeA));
  const [priceGradeB, setPriceGradeB] = useState(String(settings.defaultPriceGradeB));
  const [priceRetak, setPriceRetak] = useState(String(settings.defaultPriceRetak));
  const [lowStockThreshold, setLowStockThreshold] = useState(String(settings.lowStockThresholdKg));

  // Profile States
  const [farmName, setFarmName] = useState(settings.farmName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);

  // Allocation States (Defaults 63, 20, 12, 3.5, 0.5, 0.5)
  const [allocPakan, setAllocPakan] = useState(String(settings.allocations.pakan));
  const [allocAyam, setAllocAyam] = useState(String(settings.allocations.pembelianAyam));
  const [allocUpah, setAllocUpah] = useState(String(settings.allocations.upahKerja));
  const [allocVaksin, setAllocVaksin] = useState(String(settings.allocations.vitaminVaksin));
  const [allocListrik, setAllocListrik] = useState(String(settings.allocations.listrik));
  const [allocAir, setAllocAir] = useState(String(settings.allocations.air));

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(
    null
  );

  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'all' | 'production' | 'sales' | 'expense' | 'adjustments' | 'reset_demo' | 'flock';
    id?: string;
    title: string;
    description: string;
  } | null>(null);

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    switch (deleteTarget.type) {
      case 'flock':
        if (deleteTarget.id) {
          deleteFlock(deleteTarget.id);
          setNotification({ type: 'success', msg: 'Data kandang berhasil dihapus!' });
        }
        break;
      case 'all':
        clearAllData();
        setNotification({ type: 'success', msg: 'Seluruh data berhasil dikosongkan (mulai dari 0)!' });
        break;
      case 'production':
        clearProductionData();
        setNotification({ type: 'success', msg: 'Semua data produksi panen berhasil dihapus!' });
        break;
      case 'sales':
        clearSalesData();
        setNotification({ type: 'success', msg: 'Semua data transaksi penjualan berhasil dihapus!' });
        break;
      case 'expense':
        clearExpenseData();
        setNotification({ type: 'success', msg: 'Semua data pengeluaran operasional berhasil dihapus!' });
        break;
      case 'adjustments':
        clearStockAdjustments();
        setNotification({ type: 'success', msg: 'Riwayat opname stok berhasil dihapus!' });
        break;
      case 'reset_demo':
        resetToDefaultData();
        setNotification({ type: 'success', msg: 'Data berhasil direset ke data standar peternakan!' });
        break;
    }
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSaveFlock = (flockData: Omit<Flock, 'id'>, id?: string) => {
    if (id) {
      updateFlock(id, flockData);
      setNotification({ type: 'success', msg: `Data ${flockData.name} berhasil diperbarui!` });
    } else {
      addFlock(flockData);
      setNotification({ type: 'success', msg: `Kandang baru ${flockData.name} berhasil ditambahkan!` });
    }
    setTimeout(() => setNotification(null), 3500);
  };

  const numAllocPakan = parseFloat(allocPakan) || 0;
  const numAllocAyam = parseFloat(allocAyam) || 0;
  const numAllocUpah = parseFloat(allocUpah) || 0;
  const numAllocVaksin = parseFloat(allocVaksin) || 0;
  const numAllocListrik = parseFloat(allocListrik) || 0;
  const numAllocAir = parseFloat(allocAir) || 0;

  const totalAllocationPct = Number(
    (
      numAllocPakan +
      numAllocAyam +
      numAllocUpah +
      numAllocVaksin +
      numAllocListrik +
      numAllocAir
    ).toFixed(2)
  );

  const isAlloc100 = Math.abs(totalAllocationPct - 100) < 0.01;

  const handleSavePrices = (e: React.FormEvent) => {
    e.preventDefault();
    const stdPrice = parseFloat(marketPrice) || 28500;
    updateSettings({
      currentMarketPricePerKg: stdPrice,
      defaultPriceGradeA: stdPrice,
      defaultPriceGradeB: stdPrice,
      defaultPriceRetak: stdPrice,
      lowStockThresholdKg: parseFloat(lowStockThreshold) || 150,
    });
    setNotification({ type: 'success', msg: 'Harga jual telur standar dan batas stok berhasil disimpan!' });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      farmName: farmName.trim(),
      tagline: tagline.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
    });
    setNotification({ type: 'success', msg: 'Informasi profil peternakan berhasil disimpan!' });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSaveAllocations = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAlloc100) {
      setNotification({
        type: 'error',
        msg: `Total persentase alokasi saat ini ${totalAllocationPct}%. Harus tepat 100%!`,
      });
      return;
    }

    updateAllocations({
      pakan: numAllocPakan,
      pembelianAyam: numAllocAyam,
      upahKerja: numAllocUpah,
      vitaminVaksin: numAllocVaksin,
      listrik: numAllocListrik,
      air: numAllocAir,
    });
    setNotification({ type: 'success', msg: 'Persentase konversi modal berhasil diperbarui!' });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleResetDefaultAllocations = () => {
    setAllocPakan('63');
    setAllocAyam('20');
    setAllocUpah('12');
    setAllocVaksin('3.5');
    setAllocListrik('0.5');
    setAllocAir('0.5');
  };

  const handleVerifyToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (securityToken.trim().toUpperCase() === 'LINGGAMANDIRI') {
      setIsBackupUnlocked(true);
      setSecurityTokenError('');
      setNotification({ type: 'success', msg: 'Akses Pencadangan & Pemulihan Database berhasil dibuka!' });
      setTimeout(() => setNotification(null), 3000);
    } else {
      setSecurityTokenError('Token tidak valid! Gunakan token (LINGGAMANDIRI) untuk memunculkan settingan.');
    }
  };

  const handleBackupSupabaseData = async () => {
    setIsDumping(true);
    try {
      const res = await downloadSupabaseDatabaseDump({
        settings,
        flocks,
        productions,
        sales,
        expenses,
        stockAdjustments,
      });
      setNotification({
        type: 'success',
        msg: res.message,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setNotification({
        type: 'error',
        msg: `Gagal mengunduh backup data: ${msg}`,
      });
    } finally {
      setIsDumping(false);
      setTimeout(() => setNotification(null), 4500);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const success = importDatabaseJSON(content);
      if (success) {
        setNotification({ type: 'success', msg: 'Data berhasil diimpor dari file JSON!' });
      } else {
        setNotification({ type: 'error', msg: 'Format file JSON tidak valid!' });
      }
      setTimeout(() => setNotification(null), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">Pengaturan Harga & Sistem Peternakan</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Sesuaikan harga acuan telur per kg, rasio alokasi konversi modal, profil kop surat, dan backup data
        </p>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Section Pengaturan Nama Kandang (Flock Management) */}
      <div className="p-6 bg-white rounded-xl border border-amber-200 bg-amber-50/10 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Pengaturan & Daftar Nama Kandang
              </h3>
              <p className="text-xs text-slate-500">
                Kelola nama kandang, jenis ras ayam, kapasitas populasi, dan petugas PIC
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingFlock(null);
              setIsFlockModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Kandang Baru</span>
          </button>
        </div>

        {flocks.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-lg border border-dashed border-amber-300">
            <Home className="w-8 h-8 mx-auto text-amber-300 mb-2" />
            <p className="text-sm font-semibold text-slate-800">Belum ada data kandang</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Tambahkan nama kandang peternakan Anda untuk mulai mencatat panen harian.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingFlock(null);
                setIsFlockModalOpen(true);
              }}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kandang Pertama</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {flocks.map((flock) => (
              <div
                key={flock.id}
                className="p-4 bg-white rounded-xl border border-slate-200 hover:border-amber-300 transition-colors shadow-2xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {flock.name}
                    </h4>
                    {flock.breed && (
                      <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60 shrink-0">
                        {flock.breed}
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 space-y-1 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Populasi Ayam:</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {flock.henCount.toLocaleString('id-ID')} Ekor
                      </span>
                    </div>

                    {flock.operator && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Petugas PIC:</span>
                        <span className="font-medium text-slate-800">{flock.operator}</span>
                      </div>
                    )}

                    {flock.notes && (
                      <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-100 mt-1 line-clamp-1">
                        {flock.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFlock(flock);
                      setIsFlockModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Ubah Nama</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDeleteTarget({
                        type: 'flock',
                        id: flock.id,
                        title: `Hapus ${flock.name}?`,
                        description: `Data pengaturan kandang "${flock.name}" dengan kapasitas ${flock.henCount.toLocaleString('id-ID')} ekor akan dihapus.`,
                      })
                    }
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Hapus Kandang"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid 2 Columns: Master Harga & Profil Peternakan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Master Harga Telur */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Master Harga Jual Telur per Kg
              </h3>
              <p className="text-xs text-slate-500">Harga default yang otomatis terisi pada form kasir</p>
            </div>
          </div>

          <form onSubmit={handleSavePrices} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Harga Jual Telur Standar per Kg (Rp/Kg) *
              </label>
              <input
                type="number"
                step="100"
                value={marketPrice}
                onChange={(e) => setMarketPrice(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Harga acuan telur ayam standar peternakan yang otomatis digunakan pada kasir penjualan
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Batas Peringatan Sisa Stok Menipis (Kg) *
              </label>
              <input
                type="number"
                step="10"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Sistem akan memunculkan peringatan jika total stok telur di gudang berada di bawah angka ini
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Harga Jual</span>
              </button>
            </div>
          </form>
        </div>

        {/* Profil Peternakan & Kop Nota */}
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <Building className="w-5 h-5 text-slate-700" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Profil Peternakan & Kop Nota
              </h3>
              <p className="text-xs text-slate-500">
                Data identitas yang tampil pada cetak faktur & invoice resmi
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Peternakan / Badan Usaha *
              </label>
              <input
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Slogan / Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Pemilik Farm
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. Telepon / WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Lokasi Peternakan
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Profil</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Konfigurasi Persentase Alokasi Modal (Formula Laba Harian) */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Formula Rasio Konversi Laba ke Modal Produksi
              </h3>
              <p className="text-xs text-slate-500">
                Standar: Pakan (63%), Beli Ayam (20%), Upah (12%), Vaksin (3.5%), Listrik (0.5%), Air (0.5%)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetDefaultAllocations}
            className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ke Standar (63% : 20% : 12% : 3.5% : 0.5% : 0.5%)</span>
          </button>
        </div>

        <form onSubmit={handleSaveAllocations} className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                Pakan Layer (63%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={allocPakan}
                  onChange={(e) => setAllocPakan(e.target.value)}
                  required
                  className="w-full pr-7 pl-2.5 py-1.5 text-xs font-bold border border-amber-300 rounded-lg bg-amber-50/40 font-mono"
                />
                <span className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-xs font-bold text-slate-400">
                  %
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-sky-900 mb-1">
                Pembelian Ayam (20%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={allocAyam}
                  onChange={(e) => setAllocAyam(e.target.value)}
                  required
                  className="w-full pr-7 pl-2.5 py-1.5 text-xs font-bold border border-sky-300 rounded-lg bg-sky-50/40 font-mono"
                />
                <span className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-xs font-bold text-slate-400">
                  %
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                Upah Kerja (12%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={allocUpah}
                  onChange={(e) => setAllocUpah(e.target.value)}
                  required
                  className="w-full pr-7 pl-2.5 py-1.5 text-xs font-bold border border-emerald-300 rounded-lg bg-emerald-50/40 font-mono"
                />
                <span className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-xs font-bold text-slate-400">
                  %
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                Vitamin & Vaksin (3.5%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={allocVaksin}
                  onChange={(e) => setAllocVaksin(e.target.value)}
                  required
                  className="w-full pr-7 pl-2.5 py-1.5 text-xs font-bold border border-purple-300 rounded-lg bg-purple-50/40 font-mono"
                />
                <span className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-xs font-bold text-slate-400">
                  %
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-orange-900 mb-1">
                Listrik & Genset (0.5%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={allocListrik}
                  onChange={(e) => setAllocListrik(e.target.value)}
                  required
                  className="w-full pr-7 pl-2.5 py-1.5 text-xs font-bold border border-orange-300 rounded-lg bg-orange-50/40 font-mono"
                />
                <span className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-xs font-bold text-slate-400">
                  %
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-cyan-900 mb-1">
                Air Bersih (0.5%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={allocAir}
                  onChange={(e) => setAllocAir(e.target.value)}
                  required
                  className="w-full pr-7 pl-2.5 py-1.5 text-xs font-bold border border-cyan-300 rounded-lg bg-cyan-50/40 font-mono"
                />
                <span className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-xs font-bold text-slate-400">
                  %
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="text-xs">
              <span className="text-slate-600">Total Akumulasi Persentase: </span>
              <span
                className={`font-mono font-bold text-sm ${
                  isAlloc100 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {totalAllocationPct}% {isAlloc100 ? '(✓ Pas 100%)' : '(✗ Harus 100%)'}
              </span>
            </div>

            <button
              type="submit"
              disabled={!isAlloc100}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg shadow-xs transition-colors ${
                isAlloc100
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>Simpan Rasio Konversi</span>
            </button>
          </div>
        </form>
      </div>

      {/* Pusat Hapus Data (Clear Data) */}
      <div className="p-6 bg-white rounded-xl border border-rose-200 bg-rose-50/20 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-rose-200/80">
          <Trash2 className="w-5 h-5 text-rose-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Pusat Hapus & Bersihkan Data
            </h3>
            <p className="text-xs text-slate-500">
              Hapus seluruh data untuk memulai pembukuan dari nol, atau hapus kategori tertentu
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Hapus Semua Data */}
          <div className="p-4 bg-white rounded-lg border border-rose-200 flex flex-col justify-between space-y-3">
            <div>
              <span className="font-bold text-xs text-rose-900 block">Kosongkan Semua Data</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Hapus seluruh panen, penjualan, biaya & stok untuk memulai aplikasi dari nol (0).
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setDeleteTarget({
                  type: 'all',
                  title: 'Kosongkan Seluruh Data?',
                  description:
                    'Semua catatan produksi, riwayat transaksi penjualan, biaya, dan opname stok akan dihapus permanen. Saldo akan kembali 0.',
                })
              }
              className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua Data (Mulai dari Nol)</span>
            </button>
          </div>

          {/* Hapus Data Produksi */}
          <div className="p-4 bg-white rounded-lg border border-slate-200 flex flex-col justify-between space-y-3">
            <div>
              <span className="font-bold text-xs text-slate-800 block">Hapus Data Produksi Telur</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Hapus hanya daftar catatan panen harian telur tanpa menghapus master harga & profil.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setDeleteTarget({
                  type: 'production',
                  title: 'Hapus Semua Data Produksi?',
                  description:
                    'Semua histori panen telur di semua kandang akan dihapus. Perhitungan stok akan disesuaikan.',
                })
              }
              className="w-full py-1.5 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Hapus Data Panen Saja</span>
            </button>
          </div>

          {/* Hapus Data Penjualan */}
          <div className="p-4 bg-white rounded-lg border border-slate-200 flex flex-col justify-between space-y-3">
            <div>
              <span className="font-bold text-xs text-slate-800 block">Hapus Data Penjualan Telur</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Hapus hanya riwayat penjualan kasir, invoice, dan data piutang tempo pelanggan.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setDeleteTarget({
                  type: 'sales',
                  title: 'Hapus Semua Data Penjualan?',
                  description:
                    'Semua transaksi penjualan telur dan nota faktur akan dibersihkan.',
                })
              }
              className="w-full py-1.5 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Hapus Data Penjualan Saja</span>
            </button>
          </div>

          {/* Hapus Pengeluaran */}
          <div className="p-4 bg-white rounded-lg border border-slate-200 flex flex-col justify-between space-y-3">
            <div>
              <span className="font-bold text-xs text-slate-800 block">Hapus Data Beban Biaya</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Hapus catatan realisasi belanja operasional (pakan, upah, listrik, vaksin, air).
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setDeleteTarget({
                  type: 'expense',
                  title: 'Hapus Semua Data Beban Biaya?',
                  description:
                    'Catatan pengeluaran operasional akan dibersihkan dan saldo kas pos modal akan tereset.',
                })
              }
              className="w-full py-1.5 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Hapus Data Pengeluaran Saja</span>
            </button>
          </div>

          {/* Hapus Opname */}
          <div className="p-4 bg-white rounded-lg border border-slate-200 flex flex-col justify-between space-y-3">
            <div>
              <span className="font-bold text-xs text-slate-800 block">Hapus Catatan Opname Stok</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Hapus histori penyesuaian telur pecah di rak gudang atau konsumsi pribadi.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setDeleteTarget({
                  type: 'adjustments',
                  title: 'Hapus Riwayat Opname Stok?',
                  description:
                    'Histori penyesuaian telur pecah dan opname gudang akan dihapus.',
                })
              }
              className="w-full py-1.5 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Hapus Riwayat Opname Saja</span>
            </button>
          </div>
        </div>
      </div>

      {/* Backup & Restore Database - Hidden behind Token (LINGGAMANDIRI) */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-slate-700" />
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Pencadangan & Pemulihan Database (Backup / Restore)</span>
                {!isBackupUnlocked && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Terkunci Token
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Simpan salinan data transaksi atau pulihkan dari file cadangan JSON
              </p>
            </div>
          </div>

          {isBackupUnlocked && (
            <button
              type="button"
              onClick={() => setIsBackupUnlocked(false)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Kunci Kembali</span>
            </button>
          )}
        </div>

        {!isBackupUnlocked ? (
          <form onSubmit={handleVerifyToken} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Key className="w-4 h-4 text-amber-600" />
              <span>Masukkan Token Keamanan untuk Membuka Settingan Pencadangan Data:</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 max-w-md">
              <input
                type="password"
                value={securityToken}
                onChange={(e) => {
                  setSecurityToken(e.target.value);
                  setSecurityTokenError('');
                }}
                placeholder="Masukkan Token (contoh: LINGGAMANDIRI)"
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono tracking-wider"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Buka Settingan</span>
              </button>
            </div>

            {tokenError && (
              <p className="text-xs text-rose-600 font-medium flex items-center gap-1 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{tokenError}</span>
              </p>
            )}
            <p className="text-[11px] text-slate-500">
              Gunakan Token <strong className="text-slate-800 font-mono">LINGGAMANDIRI</strong> untuk memunculkan settingan pencadangan dan pemulihan database.
            </p>
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-3 animate-in fade-in">
            {/* Main 'Backup Data' Supabase Dump Button */}
            <button
              type="button"
              onClick={handleBackupSupabaseData}
              disabled={isDumping}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg shadow-xs transition-all disabled:opacity-50"
              title="Unduh dump database Supabase saat ini ke penyimpanan lokal"
            >
              {isDumping ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <CloudDownload className="w-4 h-4 text-white" />
              )}
              <span>{isDumping ? 'Mengunduh Dump...' : '📥 Backup Data (Dump Supabase)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAutoDbModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors"
            >
              <Database className="w-4 h-4 text-emerald-600" />
              <span>🛠️ Buat Tabel Otomatis</span>
            </button>

            <button
              type="button"
              onClick={exportDatabaseJSON}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Unduh Cadangan JSON</span>
            </button>

            <label className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer">
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Pulihkan dari File JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {/* Flock Modal for Add / Edit */}
      <FlockModal
        isOpen={isFlockModalOpen}
        editingFlock={editingFlock}
        onClose={() => {
          setIsFlockModalOpen(false);
          setEditingFlock(null);
        }}
        onSave={handleSaveFlock}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.title || 'Konfirmasi Hapus Data'}
        description={deleteTarget?.description || ''}
        confirmLabel={
          deleteTarget?.type === 'reset_demo' ? 'Ya, Reset Data' : 'Ya, Hapus Permanen'
        }
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Auto Database Setup Modal */}
      <AutoDbSetupModal
        isOpen={isAutoDbModalOpen}
        onClose={() => setIsAutoDbModalOpen(false)}
      />
    </div>
  );
};
