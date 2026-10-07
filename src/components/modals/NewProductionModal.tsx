import React, { useState, useMemo, useEffect } from 'react';
import { useFarm } from '../../context/FarmContext';
import { getTodayDateString, formatKg } from '../../utils/formatters';
import { X, Egg, CheckCircle, AlertCircle, Home, Users } from 'lucide-react';

interface NewProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewProductionModal: React.FC<NewProductionModalProps> = ({ isOpen, onClose }) => {
  const { addProduction, flocks, setActiveTab } = useFarm();

  const [date, setDate] = useState(getTodayDateString());
  const [selectedFlockId, setSelectedFlockId] = useState<string>('');
  const [weightKgTotal, setWeightKgTotal] = useState<string>('');
  const [operator, setOperator] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Selected flock details
  const activeFlock = useMemo(() => {
    return flocks.find((f) => f.id === selectedFlockId) || flocks[0] || null;
  }, [flocks, selectedFlockId]);

  // Synchronize when modal opens or flocks change
  useEffect(() => {
    if (isOpen) {
      if (flocks.length > 0) {
        const defaultFlock = flocks.find((f) => f.id === selectedFlockId) || flocks[0];
        setSelectedFlockId(defaultFlock.id);
        setOperator(defaultFlock.operator || '');
      } else {
        setSelectedFlockId('');
        setOperator('');
      }
      setWeightKgTotal('');
      setNotes('');
      setErrorMsg('');
      setDate(getTodayDateString());
    }
  }, [isOpen, flocks]);

  if (!isOpen) return null;

  const handleFlockChange = (id: string) => {
    setSelectedFlockId(id);
    const chosen = flocks.find((f) => f.id === id);
    if (chosen && chosen.operator) {
      setOperator(chosen.operator);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numWeight = parseFloat(weightKgTotal) || 0;

    if (numWeight <= 0) {
      setErrorMsg('Berat panen telur harus lebih dari 0 kg.');
      return;
    }

    if (!activeFlock) {
      setErrorMsg('Silakan pilih kandang terlebih dahulu.');
      return;
    }

    addProduction({
      date,
      flockId: activeFlock.id,
      flockName: activeFlock.name,
      weightKgTotal: numWeight,
      henPopulation: activeFlock.henCount || 0, // Populasi ayam otomatis sesuai data kandang
      operator: operator.trim() || activeFlock.operator || undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[92dvh] sm:max-h-[88vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
              <Egg className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Catat Panen Telur (Tambah Stok)</h3>
              <p className="text-xs text-slate-500">
                Pencatatan berat panen telur untuk menambah stok gudang
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div
            className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 touch-pan-y"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tanggal Panen */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Panen *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            {/* Asal Kandang */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Asal Kandang *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setActiveTab('pengaturan');
                  }}
                  className="text-[11px] text-amber-700 hover:text-amber-800 hover:underline font-medium"
                >
                  + Atur Kandang
                </button>
              </div>
              <select
                value={selectedFlockId}
                onChange={(e) => handleFlockChange(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white"
              >
                {flocks.map((flock) => (
                  <option key={flock.id} value={flock.id}>
                    {flock.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Info Populasi Ayam Otomatis Sesuai Data Kandang */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-700 shrink-0" />
              <div>
                <span className="text-slate-600 block text-[11px]">
                  Populasi Ayam (Otomatis dari Data Kandang):
                </span>
                <span className="font-bold text-amber-950 font-mono text-sm">
                  {activeFlock
                    ? `${activeFlock.henCount.toLocaleString('id-ID')} Ekor`
                    : 'Belum ada data'}
                </span>
              </div>
            </div>
            {activeFlock?.breed && (
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300/60">
                {activeFlock.breed}
              </span>
            )}
          </div>

          {/* Berat Panen Telur (Kg) - Satu Input Utama yang Jelas */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-800">
                Berat Panen Telur (Kg) *
              </label>
              {weightKgTotal && parseFloat(weightKgTotal) > 0 && (
                <span className="text-xs font-mono font-bold text-emerald-700">
                  + {formatKg(parseFloat(weightKgTotal))} masuk stok
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                placeholder="Masukkan berat, contoh: 125.5"
                value={weightKgTotal}
                onChange={(e) => setWeightKgTotal(e.target.value)}
                required
                autoFocus
                className="w-full pl-3 pr-12 py-2.5 text-base font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
              />
              <span className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-sm font-bold text-slate-400">
                Kg
              </span>
            </div>
          </div>

          {/* Petugas / Operator Kandang */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Petugas / Operator PIC (Opsional)
            </label>
            <input
              type="text"
              placeholder="Nama operator yang memanen"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Catatan Panen */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Panen (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Panen pagi hari lancar"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Pinned Action Buttons Footer */}
        <div className="shrink-0 flex items-center justify-end gap-2.5 px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Simpan Data Panen</span>
          </button>
        </div>
      </form>
    </div>
  </div>
);
};
