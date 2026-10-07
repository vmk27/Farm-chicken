import { FarmSettings, ProductionRecord, SaleRecord, ExpenseRecord, Flock } from '../types';

export const initialFlocks: Flock[] = [
  {
    id: 'FLOCK-A',
    name: 'Kandang A (Lohmann Brown)',
    breed: 'Lohmann Brown',
    henCount: 2500,
    feedKgDaily: 275,
    operator: 'Kang Asep',
    notes: 'Kandang utama ayam produktif masa puncak',
  },
  {
    id: 'FLOCK-B',
    name: 'Kandang B (Hy-Line Brown)',
    breed: 'Hy-Line Brown',
    henCount: 2200,
    feedKgDaily: 242,
    operator: 'Pak Dedi',
    notes: 'Kandang timur fase produksi stabil',
  },
  {
    id: 'FLOCK-C',
    name: 'Kandang C (Novogen White)',
    breed: 'Novogen White',
    henCount: 1800,
    feedKgDaily: 195,
    operator: 'Mas Budi',
    notes: 'Kandang barat ayam telur putih',
  },
];

export const initialFarmSettings: FarmSettings = {
  farmName: 'CV Sumber Telur Berkah Farm',
  tagline: 'Peternakan Ayam Petelur Modern & Suplier Telur Segar',
  ownerName: 'H. Sudirman Santoso',
  phone: '0812-3456-7890',
  address: 'Jl. Peternakan Raya No. 45, Cikembar, Sukabumi, Jawa Barat',
  currentMarketPricePerKg: 28500,
  defaultPriceGradeA: 29000,
  defaultPriceGradeB: 27500,
  defaultPriceRetak: 21000,
  defaultEggCountPerKg: 16,
  lowStockThresholdKg: 150,
  allocations: {
    pakan: 63,
    pembelianAyam: 20,
    upahKerja: 12,
    vitaminVaksin: 3.5,
    listrik: 0.5,
    air: 0.5,
  },
};

// Generate realistic 30-day historical data leading up to current date (2026-10-06)
const generateMockHistory = () => {
  const productions: ProductionRecord[] = [];
  const sales: SaleRecord[] = [];
  const expenses: ExpenseRecord[] = [];

  const flocks = [
    { id: 'FLOCK-A', name: 'Kandang A (Lohmann Brown - 2.500 Ekor)', pop: 2500, hdpBase: 88, feedKg: 275 },
    { id: 'FLOCK-B', name: 'Kandang B (Hy-Line Brown - 2.200 Ekor)', pop: 2200, hdpBase: 85, feedKg: 242 },
    { id: 'FLOCK-C', name: 'Kandang C (Novogen White - 1.800 Ekor)', pop: 1800, hdpBase: 82, feedKg: 195 },
  ];

  // Base date: 2026-10-06
  const baseDate = new Date(2026, 9, 6); // October 6, 2026

  let invoiceSeq = 1001;

  for (let i = 29; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // Daily price slight fluctuation
    const dailyPriceVariation = Math.sin(i * 0.4) * 800;
    const currentPrice = Math.round((28500 + dailyPriceVariation) / 100) * 100;

    let dayTotalProdKg = 0;

    // Generate production per flock
    flocks.forEach((flock, fIdx) => {
      const hdpVar = (Math.random() * 4 - 2); // +- 2%
      const actualHdp = Math.min(94, Math.max(75, flock.hdpBase + hdpVar));
      const eggsCount = Math.round((flock.pop * actualHdp) / 100);
      const avgEggWeightGram = 61.5 + (Math.random() * 2 - 1);
      const totalWeightKg = Number(((eggsCount * avgEggWeightGram) / 1000).toFixed(1));

      // Quality separation
      const crackedKg = Number((totalWeightKg * (0.015 + Math.random() * 0.012)).toFixed(1));
      const gradeB_Kg = Number((totalWeightKg * (0.08 + Math.random() * 0.04)).toFixed(1));
      const gradeA_Kg = Number((totalWeightKg - crackedKg - gradeB_Kg).toFixed(1));

      dayTotalProdKg += totalWeightKg;

      productions.push({
        id: `PROD-${dateStr}-${flock.id}`,
        date: dateStr,
        flockId: flock.id,
        flockName: flock.name,
        eggCountTotal: eggsCount,
        weightKgTotal: totalWeightKg,
        gradeA_Kg: gradeA_Kg,
        gradeB_Kg: gradeB_Kg,
        cracked_Kg: crackedKg,
        breakageRatePct: Number(((crackedKg / totalWeightKg) * 100).toFixed(2)),
        henPopulation: flock.pop,
        henDayProductionPct: Number(actualHdp.toFixed(1)),
        feedConsumedKg: flock.feedKg + Math.round(Math.random() * 10 - 5),
        operator: fIdx === 0 ? 'Kang Asep' : fIdx === 1 ? 'Pak Dedi' : 'Mas Budi',
        notes: actualHdp >= 88 ? 'Produksi sangat prima' : 'Kondisi ayam sehat dan aktif',
        createdAt: `${dateStr}T08:30:00.000Z`,
      });
    });

    // Generate 2-4 sales transactions per day
    const numSales = 2 + (i % 3);
    let daySalesTargetKg = dayTotalProdKg * (0.92 + Math.random() * 0.14); // near balance

    for (let s = 0; s < numSales; s++) {
      const portion = s === numSales - 1 ? daySalesTargetKg : daySalesTargetKg / numSales;
      const weightKg = Number(Math.max(15, portion + (Math.random() * 20 - 10)).toFixed(1));
      daySalesTargetKg -= weightKg;

      let grade: 'Grade A (Super)' | 'Grade B (Standar)' | 'Retak / Reject' | 'Campur' = 'Grade A (Super)';
      let unitPrice = currentPrice;
      if (s === 0 && Math.random() > 0.6) {
        grade = 'Grade B (Standar)';
        unitPrice = currentPrice - 1200;
      } else if (s === numSales - 1 && Math.random() > 0.8) {
        grade = 'Retak / Reject';
        unitPrice = currentPrice - 7500;
      }

      const subtotal = Math.round(weightKg * unitPrice);
      const discount = subtotal > 3000000 && Math.random() > 0.5 ? 25000 : 0;
      const totalRevenue = subtotal - discount;

      const isTempo = s === 0 && i > 0 && Math.random() > 0.8;
      const paymentStatus = isTempo ? 'Tempo' : 'Lunas';
      const paymentMethod = s === 0 ? 'Transfer Bank' : s === 1 ? 'QRIS' : 'Tunai';

      sales.push({
        id: `SALE-${invoiceSeq}`,
        invoiceNumber: `INV-${dateStr.replace(/-/g, '')}-${String(invoiceSeq).slice(-3)}`,
        date: dateStr,
        grade: grade,
        weightKg: weightKg,
        eggCountEstimated: Math.round(weightKg * 16),
        pricePerKg: unitPrice,
        subtotal: subtotal,
        discount: discount,
        totalRevenue: totalRevenue,
        paymentStatus: paymentStatus,
        paymentMethod: paymentMethod,
        amountPaid: isTempo ? 0 : totalRevenue,
        remainingDue: isTempo ? totalRevenue : 0,
        dueDate: isTempo ? new Date(new Date(dateStr).getTime() + 7 * 86400000).toISOString().split('T')[0] : undefined,
        notes: isTempo ? 'Jatuh tempo 7 hari' : 'Pembayaran lunas',
        createdAt: `${dateStr}T14:${15 + s * 20}:00.000Z`,
      });

      invoiceSeq++;
    }

    // Historical expenses for realism (e.g. daily feed purchase or utility)
    if (i % 3 === 0) {
      expenses.push({
        id: `EXP-${dateStr}-FEED`,
        date: dateStr,
        category: 'pakan',
        amount: 2150000,
        recipient: 'PT Charoen Pokphand / Japfa Distributor',
        description: 'Pembelian Pakan Konsentrat Layer KLK (5 Sak @ 50kg)',
        receiptNumber: `RCP-FD-${dateStr.replace(/-/g, '')}`,
        createdAt: `${dateStr}T10:00:00.000Z`,
      });
    }
  }

  return { productions, sales, expenses };
};

export const { productions: initialProductions, sales: initialSales, expenses: initialExpenses } = generateMockHistory();
