import React, { useState, useEffect } from 'react';
import { useFarm } from '../../context/FarmContext';
import { PaymentMethod, PaymentStatus, SaleRecord } from '../../types';
import { formatRupiah, getTodayDateString, formatKg } from '../../utils/formatters';
import { X, ShoppingBag, CheckCircle, AlertCircle, AlertTriangle, Layers, ArrowRight } from 'lucide-react';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessCreated?: (sale: SaleRecord) => void;
}

export const NewSaleModal: React.FC<NewSaleModalProps> = ({ isOpen, onClose, onSuccessCreated }) => {
  const { settings, totalStockKg, addSale } = useFarm();

  const [date, setDate] = useState(getTodayDateString());
  const [weightKg, setWeightKg] = useState<string>('');
  const [pricePerKg, setPricePerKg] = useState<string>(String(settings.currentMarketPricePerKg || 28500));
  const [discount, setDiscount] = useState<string>('0');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Lunas');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Tunai');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Set sensible initial weight when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setDate(getTodayDateString());
      setPricePerKg(String(settings.currentMarketPricePerKg || 28500));
      setDiscount('0');
      setPaymentStatus('Lunas');
      setPaymentMethod('Tunai');
      setNotes('');
      // Default weight: if stock > 0, propose 10 kg or max available stock
      if (totalStockKg > 0) {
        setWeightKg(String(Math.min(10, totalStockKg)));
      } else {
        setWeightKg('0');
      }
    }
  }, [isOpen, settings.currentMarketPricePerKg, totalStockKg]);

  if (!isOpen) return null;

  const numWeight = parseFloat(weightKg) || 0;
  const numPrice = parseFloat(pricePerKg) || 0;
  const numDiscount = parseFloat(discount) || 0;
  const subtotal = Math.round(numWeight * numPrice);
  const totalRevenue = Math.max(0, subtotal - numDiscount);

  // Validation: Sale cannot exceed available stock
  const isExceedingStock = numWeight > totalStockKg;
  const isStockEmpty = totalStockKg <= 0;
  const excessAmount = Math.max(0, numWeight - totalStockKg);
  const remainingStockAfterSale = Math.max(0, totalStockKg - numWeight);

  const handleUseMaxStock = () => {
    setWeightKg(String(totalStockKg));
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isStockEmpty) {
      setErrorMsg('Stok telur di gudang habis (0 kg). Anda tidak dapat melakukan transaksi penjualan sebelum ada stok masuk dari panen.');
      return;
    }

    if (numWeight <= 0) {
      setErrorMsg('Berat telur yang dijual harus lebih dari 0 kg.');
      return;
    }

    if (numWeight > totalStockKg) {
      setErrorMsg(
        `Penjualan telur tidak boleh melebihi stok! Stok telur tersedia saat ini hanya ${formatKg(
          totalStockKg
        )}, sedangkan Anda memasukkan ${formatKg(numWeight)} (melebihi batas ${formatKg(excessAmount)}).`
      );
      return;
    }

    if (numPrice <= 0) {
      setErrorMsg('Harga jual per kg harus lebih dari Rp 0.');
      return;
    }

    let paidVal = totalRevenue;
    let dueVal = 0;

    if (paymentStatus === 'Tempo') {
      paidVal = 0;
      dueVal = totalRevenue;
    } else if (paymentStatus === 'Sebagian') {
      paidVal = parseFloat(amountPaid) || 0;
      dueVal = Math.max(0, totalRevenue - paidVal);
    }

    const createdSale = addSale({
      date,
      grade: 'Grade A (Super)', // Telur standar
      weightKg: numWeight,
      eggCountEstimated: Math.round(numWeight * (settings.defaultEggCountPerKg || 16)),
      pricePerKg: numPrice,
      subtotal,
      discount: numDiscount,
      totalRevenue,
      paymentStatus,
      paymentMethod,
      amountPaid: paidVal,
      remainingDue: dueVal,
      dueDate: paymentStatus === 'Tempo' || paymentStatus === 'Sebagian' ? dueDate : undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
    if (onSuccessCreated) {
      onSuccessCreated(createdSale);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92dvh] sm:max-h-[88vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Catat Penjualan Telur</h3>
              <p className="text-xs text-slate-500">
                Pencatatan kasir transaksi telur standar & pemotongan stok otomatis
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div
            className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 touch-pan-y"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1 font-medium">{errorMsg}</div>
              </div>
            )}

          {/* 1. INFORMASI STOK TELUR TERSEDIA (TAMPILKAN STOK DAHULU) */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              isStockEmpty
                ? 'bg-rose-50 border-rose-300 text-rose-950'
                : isExceedingStock
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
            }`}
          >
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-current/15">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Total Sisa Stok Telur Siap Jual
                </span>
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isStockEmpty
                    ? 'bg-rose-200 text-rose-800'
                    : isExceedingStock
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-emerald-200 text-emerald-800'
                }`}
              >
                {isStockEmpty
                  ? 'Stok Habis'
                  : isExceedingStock
                  ? 'Melebihi Stok!'
                  : 'Stok Tersedia'}
              </span>
            </div>

            <div className="mt-2.5 flex items-baseline justify-between">
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums leading-none">
                  {formatKg(totalStockKg)}
                </div>
                <div className="text-[11px] opacity-80 mt-1">
                  Stok Telur Standar Siap Jual
                </div>
              </div>

              {numWeight > 0 && !isExceedingStock && !isStockEmpty && (
                <div className="text-right text-xs">
                  <span className="text-slate-500 block text-[10px]">Sisa setelah dijual:</span>
                  <span className="font-bold font-mono text-emerald-800">
                    {formatKg(remainingStockAfterSale)}
                  </span>
                </div>
              )}
            </div>

            {/* Warning if stock empty */}
            {isStockEmpty && (
              <div className="mt-2.5 pt-2.5 border-t border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Stok kosong (0 kg). Harap catat panen telur terlebih dahulu sebelum menjual!</span>
              </div>
            )}

            {/* Warning & Quick Action if user enters weight exceeding stock */}
            {isExceedingStock && !isStockEmpty && (
              <div className="mt-2.5 pt-2.5 border-t border-amber-300 text-xs space-y-2">
                <div className="font-semibold text-rose-700 flex items-start gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>
                    Input penjualan ({formatKg(numWeight)}) melebihi stok tersedia ({formatKg(totalStockKg)}) sebesar{' '}
                    <strong>{formatKg(excessAmount)}</strong>!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleUseMaxStock}
                  className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Gunakan Maksimal Stok ({formatKg(totalStockKg)})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Tanggal & Jenis Telur (Standar) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Penjualan *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jenis Produk Telur
              </label>
              <div className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-300 rounded-lg text-slate-800 font-semibold flex items-center justify-between">
                <span>Telur Ayam Standar</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-mono">
                  Standar Ras
                </span>
              </div>
            </div>
          </div>

          {/* Berat Terjual & Harga Jual per Kg */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Berat Terjual (Kg) *
                </label>
                <span className="text-[10px] text-slate-500">
                  Maks: <strong className="font-mono text-emerald-700">{formatKg(totalStockKg)}</strong>
                </span>
              </div>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max={totalStockKg > 0 ? totalStockKg : undefined}
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                required
                disabled={isStockEmpty}
                placeholder={`Maks ${totalStockKg} kg`}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-hidden font-mono font-bold transition-colors ${
                  isExceedingStock
                    ? 'border-rose-500 bg-rose-50/30 text-rose-900 focus:ring-2 focus:ring-rose-500'
                    : 'border-slate-300 focus:ring-2 focus:ring-emerald-500'
                }`}
              />
              {isExceedingStock && (
                <span className="text-[10px] text-rose-600 font-semibold mt-1 block">
                  Melebihi stok gudang!
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Harga Jual per Kg (Rp) *
              </label>
              <input
                type="number"
                step="100"
                min="1000"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono font-bold"
              />
            </div>
          </div>

          {/* Payment & Calculation Breakdown */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Metode Bayar
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="Tunai">Tunai / Cash</option>
                  <option value="Transfer Bank">Transfer Bank</option>
                  <option value="QRIS">QRIS</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Bayar
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="Lunas">Lunas</option>
                  <option value="Tempo">Tempo (Hutang)</option>
                  <option value="Sebagian">Sebagian (DP)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Diskon Potongan (Rp)
                </label>
                <input
                  type="number"
                  step="500"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 font-mono bg-white"
                />
              </div>
            </div>

            {/* Conditional fields for non-Lunas */}
            {paymentStatus === 'Sebagian' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jumlah Dibayar di Muka / DP (Rp) *
                  </label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    required
                    placeholder="Contoh: 500000"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Jatuh Tempo Pelunasan
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>
            )}

            {paymentStatus === 'Tempo' && (
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Jatuh Tempo Pembayaran
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            )}

            {/* Total Summary Row */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Subtotal: {formatKg(numWeight)} × {formatRupiah(numPrice)}
                {numDiscount > 0 && (
                  <span className="text-emerald-600 block">
                    Diskon: -{formatRupiah(numDiscount)}
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Total Pendapatan</span>
                <span className="text-base sm:text-lg font-bold text-slate-900 font-mono tabular-nums">
                  {formatRupiah(totalRevenue)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Penjualan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Penjualan toko sembako / pasar"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
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
            disabled={isExceedingStock || isStockEmpty || numWeight <= 0}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg shadow-xs transition-colors ${
              isExceedingStock || isStockEmpty || numWeight <= 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>
              {isStockEmpty
                ? 'Stok Telur Habis'
                : isExceedingStock
                ? 'Melebihi Stok Tersedia'
                : 'Simpan Penjualan'}
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
);
};
