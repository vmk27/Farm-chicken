import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { getTodayDateString, formatKg } from '../../utils/formatters';
import { X, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface StockOpnameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StockOpnameModal: React.FC<StockOpnameModalProps> = ({ isOpen, onClose }) => {
  const { totalStockKg, addStockAdjustment } = useFarm();

  const [date, setDate] = useState(getTodayDateString());
  const [type, setType] = useState<'Penyesuaian Rusak/Pecah' | 'Konsumsi Sendiri' | 'Koreksi Fisik (Opname)'>(
    'Penyesuaian Rusak/Pecah'
  );
  const [weightKg, setWeightKg] = useState<string>('5');
  const [reason, setReason] = useState('');
  const [operator, setOperator] = useState('Kang Asep');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const numWeight = parseFloat(weightKg) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numWeight <= 0) {
      setErrorMsg('Berat penyesuaian harus lebih dari 0 kg.');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('Harap berikan alasan penyesuaian/koreksi stok.');
      return;
    }

    addStockAdjustment({
      date,
      type,
      weightKg: numWeight,
      reason: reason.trim(),
      operator: operator.trim(),
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
        <div className="shrink-0 flex items-center justify-between px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Penyesuaian & Opname Stok Telur</h3>
              <p className="text-xs text-slate-500">
                Pencatatan telur pecah di rak, susut simpan, atau konsumsi karyawan farm
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

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600">Sisa Stok Fisik Sistem Saat Ini:</span>
            <span className="font-bold text-slate-900 font-mono">{formatKg(totalStockKg)}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Penyesuaian *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jenis Penyesuaian *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="Penyesuaian Rusak/Pecah">Pecah / Retak di Rak Gudang</option>
                <option value="Konsumsi Sendiri">Konsumsi Sendiri / Karyawan</option>
                <option value="Koreksi Fisik (Opname)">Koreksi Timbangan Opname</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Jumlah Pengurangan (Kg) *
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alasan & Kronologi *
            </label>
            <input
              type="text"
              placeholder="Contoh: Rak telur tersenggol saat pembersihan gudang"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Penanggung Jawab / Operator *
            </label>
            <input
              type="text"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

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
            <span>Simpan Penyesuaian</span>
          </button>
        </div>
      </form>
    </div>
  </div>
);
};
