import React from 'react';
import { useFarm } from '../../context/FarmContext';
import { SaleRecord } from '../../types';
import { formatRupiah, formatDateIndo, formatKg } from '../../utils/formatters';
import { X, Printer, CheckCircle, Clock } from 'lucide-react';

interface InvoiceModalProps {
  sale: SaleRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ sale, isOpen, onClose }) => {
  const { settings, markSalePaid } = useFarm();

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs print:p-0 print:bg-white transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-t-2xl sm:rounded-xl shadow-xl border border-slate-200 overflow-hidden max-h-[92dvh] sm:max-h-[88vh] flex flex-col print:border-none print:shadow-none print:w-full print:max-h-none animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Actions Bar (hidden during print) */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 bg-slate-50 print:hidden">
          <span className="text-xs font-semibold text-slate-700">
            Faktur & Nota Resmi Penjualan Telur
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Cetak PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Document */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-8 space-y-6 print:p-0 text-slate-900 print:overflow-visible touch-pan-y"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Header & Letterhead */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {settings.farmName}
              </h2>
              <p className="text-xs text-slate-600 max-w-xs mt-0.5">{settings.tagline}</p>
              <p className="text-xs text-slate-500 mt-1">{settings.address}</p>
              <p className="text-xs text-slate-500 font-mono">Telp/WA: {settings.phone}</p>
            </div>

            <div className="sm:text-right">
              <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
                NOTA PENJUALAN
              </span>
              <span className="text-base font-bold text-slate-900 font-mono">
                {sale.invoiceNumber}
              </span>
              <div className="text-xs text-slate-500 mt-1">
                Tanggal: <span className="font-mono text-slate-700">{formatDateIndo(sale.date)}</span>
              </div>
            </div>
          </div>

          {/* Status & Transaction Bar */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-500 block">Kualitas / Grade Telur:</span>
              <span className="font-bold text-slate-900 text-sm">{sale.grade}</span>
              <div className="text-slate-600 mt-0.5">
                Total Berat: <strong className="font-mono text-slate-900">{formatKg(sale.weightKg)}</strong>
              </div>
            </div>

            <div className="text-right">
              <span className="text-slate-500 block">Status Pembayaran:</span>
              <div className="inline-flex items-center gap-1.5 mt-1 font-semibold">
                {sale.paymentStatus === 'Lunas' ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> LUNAS ({sale.paymentMethod})
                  </span>
                ) : (
                  <span className="text-amber-700 flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {sale.paymentStatus.toUpperCase()}
                  </span>
                )}
              </div>
              {sale.dueDate && (
                <div className="text-slate-500 text-[11px] mt-1">
                  Jatuh Tempo: <span className="font-mono text-amber-900">{formatDateIndo(sale.dueDate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-slate-900/80 text-slate-600 text-left">
                <th className="py-2 font-semibold">Deskripsi Barang</th>
                <th className="py-2 text-right font-semibold">Kuantitas</th>
                <th className="py-2 text-right font-semibold">Harga / Kg</th>
                <th className="py-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-3">
                  <span className="font-semibold text-slate-900 block">
                    Telur Ayam Segar ({sale.grade})
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Telur Segar Pilihan Kualitas Standar
                  </span>
                </td>
                <td className="py-3 text-right font-mono tabular-nums text-slate-800">
                  {formatKg(sale.weightKg)}
                </td>
                <td className="py-3 text-right font-mono tabular-nums text-slate-800">
                  {formatRupiah(sale.pricePerKg)}
                </td>
                <td className="py-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                  {formatRupiah(sale.subtotal)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Calculation Breakdown */}
          <div className="border-t border-slate-200 pt-3 space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal Penjualan</span>
              <span className="font-mono">{formatRupiah(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Diskon Khusus Pelanggan</span>
                <span className="font-mono">-{formatRupiah(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Tagihan Bersih</span>
              <span className="font-mono tabular-nums">{formatRupiah(sale.totalRevenue)}</span>
            </div>

            {sale.paymentStatus !== 'Lunas' && (
              <div className="pt-2 space-y-1 text-[11px] border-t border-dashed border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Sudah Dibayar (DP / Titip):</span>
                  <span className="font-mono text-emerald-700 font-medium">
                    {formatRupiah(sale.amountPaid)}
                  </span>
                </div>
                <div className="flex justify-between text-rose-700 font-bold text-xs">
                  <span>Sisa Piutang / Kekurangan:</span>
                  <span className="font-mono">{formatRupiah(sale.remainingDue)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {sale.notes && (
            <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
              <span className="font-semibold text-slate-700 block mb-0.5">Catatan:</span>
              {sale.notes}
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-2 pt-8 text-center text-xs">
            <div>
              <span className="text-slate-500 block mb-12">Kasir / Operator Farm</span>
              <span className="font-semibold text-slate-800 underline">
                Petugas Kasir
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-12">Penanggung Jawab Farm,</span>
              <span className="font-semibold text-slate-800 underline">
                {settings.ownerName}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3.5 sm:px-6 sm:py-4 border-t border-slate-200 bg-slate-50 print:hidden">
          {sale.paymentStatus !== 'Lunas' ? (
            <button
              type="button"
              onClick={() => markSalePaid(sale.id)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Tandai Lunas Sekarang</span>
            </button>
          ) : (
            <span className="text-xs text-emerald-700 font-medium">
              ✓ Transaksi telah lunas penuh
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
