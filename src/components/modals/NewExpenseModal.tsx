import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { ExpenseCategory } from '../../types';
import { getTodayDateString, formatRupiah } from '../../utils/formatters';
import { X, Receipt, CheckCircle, AlertCircle } from 'lucide-react';

interface NewExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: ExpenseCategory;
}

export const NewExpenseModal: React.FC<NewExpenseModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'pakan',
}) => {
  const { addExpense, allocatedVaults } = useFarm();

  const [date, setDate] = useState(getTodayDateString());
  const [category, setCategory] = useState<ExpenseCategory>(defaultCategory);
  const [amount, setAmount] = useState<string>('500000');
  const [recipient, setRecipient] = useState('');
  const [description, setDescription] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;

  // Remaining budget in this envelope
  const getCategoryRemaining = (cat: ExpenseCategory) => {
    if (cat === 'pakan') return allocatedVaults.pakan.remaining;
    if (cat === 'bibit_ayam') return allocatedVaults.pembelianAyam.remaining;
    if (cat === 'upah') return allocatedVaults.upahKerja.remaining;
    if (cat === 'vaksin') return allocatedVaults.vitaminVaksin.remaining;
    if (cat === 'listrik') return allocatedVaults.listrik.remaining;
    if (cat === 'air') return allocatedVaults.air.remaining;
    return 0;
  };

  const currentVaultRemaining = getCategoryRemaining(category);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setErrorMsg('Nominal pengeluaran harus lebih dari Rp 0.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Harap berikan keterangan / deskripsi pengeluaran.');
      return;
    }

    addExpense({
      date,
      category,
      amount: numAmount,
      recipient: recipient.trim() || 'Umum / Toko Peternakan',
      description: description.trim(),
      receiptNumber: receiptNumber.trim() || undefined,
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
            <div className="p-2 rounded-lg bg-rose-100 text-rose-800">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Catat Pengeluaran Operasional & Modal
              </h3>
              <p className="text-xs text-slate-500">
                Realisasi belanja dari dana pos alokasi keuntungan
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

          {category !== 'lainnya' && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200/80 flex items-center justify-between text-xs">
              <span className="text-emerald-900">Sisa Saldo Pos Alokasi Ini:</span>
              <span className="font-bold text-emerald-950 font-mono">
                {formatRupiah(currentVaultRemaining)}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Pengeluaran *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pos Alokasi Anggaran *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
              >
                <option value="pakan">Pos Pakan (63%)</option>
                <option value="bibit_ayam">Pos Pembelian Ayam / Pullet (20%)</option>
                <option value="upah">Pos Upah Kerja (12%)</option>
                <option value="vaksin">Pos Vitamin & Vaksin (3.5%)</option>
                <option value="listrik">Pos Listrik / PLN (0.5%)</option>
                <option value="air">Pos Air Bersih (0.5%)</option>
                <option value="lainnya">Beban Operasional Lainnya</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nominal Pengeluaran (Rp) *
            </label>
            <input
              type="number"
              step="10000"
              min="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi / Keterangan Belanja *
            </label>
            <input
              type="text"
              placeholder="Contoh: Beli 10 sak pakan konsentrat layer KLK-36"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Penerima / Toko / Supplier
              </label>
              <input
                type="text"
                placeholder="Contoh: PT Poultry Mandiri"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. Nota / Kwitansi (Opsional)
              </label>
              <input
                type="text"
                placeholder="RCP-12345"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono"
              />
            </div>
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
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Simpan Pengeluaran</span>
          </button>
        </div>
      </form>
    </div>
  </div>
);
};
