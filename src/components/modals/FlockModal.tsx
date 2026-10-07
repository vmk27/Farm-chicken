import React, { useState, useEffect } from 'react';
import { Flock } from '../../types';
import { X, Home, CheckCircle } from 'lucide-react';

interface FlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (flockData: Omit<Flock, 'id'>, id?: string) => void;
  editingFlock?: Flock | null;
}

export const FlockModal: React.FC<FlockModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingFlock,
}) => {
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('Lohmann Brown');
  const [henCount, setHenCount] = useState('2000');
  const [operator, setOperator] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingFlock) {
      setName(editingFlock.name);
      setBreed(editingFlock.breed || 'Lohmann Brown');
      setHenCount(
        editingFlock.henCount !== undefined && editingFlock.henCount !== null
          ? String(editingFlock.henCount)
          : ''
      );
      setOperator(editingFlock.operator || '');
      setNotes(editingFlock.notes || '');
      setErrorMsg('');
    } else {
      setName('');
      setBreed('Lohmann Brown');
      setHenCount('2000');
      setOperator('');
      setNotes('');
      setErrorMsg('');
    }
  }, [editingFlock, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama kandang wajib diisi.');
      return;
    }

    const numHen = parseInt(henCount) || 0;
    if (numHen <= 0) {
      setErrorMsg('Jumlah populasi ayam harus lebih dari 0 ekor.');
      return;
    }

    onSave(
      {
        name: name.trim(),
        breed: breed.trim(),
        henCount: numHen,
        feedKgDaily: Math.round(numHen * 0.11), // est ~110g/hen
        operator: operator.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      editingFlock?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-[92dvh] sm:max-h-[88vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingFlock ? 'Ubah Pengaturan Kandang' : 'Tambah Kandang Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                Atur nama kandang, jenis ayam, dan kapasitas populasi
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
            className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 touch-pan-y"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {errorMsg}
              </div>
            )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Kandang *
            </label>
            <input
              type="text"
              placeholder="Contoh: Kandang 1, Kandang A, Kandang Timur"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ras / Jenis Ayam
              </label>
              <select
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="Lohmann Brown">Lohmann Brown</option>
                <option value="Hy-Line Brown">Hy-Line Brown</option>
                <option value="Novogen White">Novogen White</option>
                <option value="ISA Brown">ISA Brown</option>
                <option value="Hisex Brown">Hisex Brown</option>
                <option value="Lainnya">Lainnya / Campur</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Populasi Ayam *
                </label>
                {henCount && !isNaN(parseInt(henCount)) && parseInt(henCount) > 0 && (
                  <span className="text-[10px] text-amber-800 font-mono font-bold">
                    {parseInt(henCount).toLocaleString('id-ID')} ekor
                  </span>
                )}
              </div>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="Contoh: 2500"
                value={henCount}
                onChange={(e) => setHenCount(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono font-bold"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {[500, 1000, 1500, 2000, 2500, 3000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setHenCount(String(preset))}
                    className="px-1.5 py-0.5 text-[10px] bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-600 rounded font-mono transition-colors"
                  >
                    {preset.toLocaleString('id-ID')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Petugas / Operator PIC Kandang (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Kang Asep / Mas Budi"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Keterangan Tambahan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Fase produksi puncak umur 32 minggu"
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
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{editingFlock ? 'Simpan Perubahan' : 'Tambah Kandang'}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
);
};
