import React, { useState } from 'react';
import { formatRupiah, formatNumber } from '../../utils/formatters';

interface AllocationDonutChartProps {
  profitAmount: number;
  allocations: {
    pakan: number;
    pembelianAyam: number;
    upahKerja: number;
    vitaminVaksin: number;
    listrik: number;
    air: number;
  };
}

export const AllocationDonutChart: React.FC<AllocationDonutChartProps> = ({
  profitAmount,
  allocations,
}) => {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  const data = [
    {
      id: 'pakan',
      label: 'Pakan Layer & Konsentrat',
      pct: allocations.pakan,
      color: '#d97706', // amber-600
      hoverColor: '#b45309',
      unitNote: 'Estimasi Sak Pakan (@Rp 430.000)',
      calcUnits: (val: number) => `${formatNumber(val / 430000, 1)} Sak (50kg)`,
    },
    {
      id: 'pembelianAyam',
      label: 'Biaya Pembelian Ayam / Pullet',
      pct: allocations.pembelianAyam,
      color: '#0284c7', // sky-600
      hoverColor: '#0369a1',
      unitNote: 'Estimasi Pullet Baru (@Rp 85.000/ekor)',
      calcUnits: (val: number) => `${formatNumber(val / 85000, 0)} Ekor Pullet`,
    },
    {
      id: 'upahKerja',
      label: 'Upah Kerja & Gaji Karyawan',
      pct: allocations.upahKerja,
      color: '#16a34a', // green-600
      hoverColor: '#15803d',
      unitNote: 'Pos Gaji & Tunjangan Operator Kandang',
      calcUnits: (_val: number) => 'Dana Gaji Terjamin',
    },
    {
      id: 'vitaminVaksin',
      label: 'Vitamin, Vaksin & Medikasi',
      pct: allocations.vitaminVaksin,
      color: '#9333ea', // purple-600
      hoverColor: '#7e22ce',
      unitNote: 'Suplemen & Biosecurity Kandang',
      calcUnits: (_val: number) => 'Nutrisi & Daya Tahan',
    },
    {
      id: 'listrik',
      label: 'Listrik (Blower & Penerangan)',
      pct: allocations.listrik,
      color: '#ea580c', // orange-600
      hoverColor: '#c2410c',
      unitNote: 'Token PLN & Cadangan Genset',
      calcUnits: (_val: number) => 'Operasional Ventilasi',
    },
    {
      id: 'air',
      label: 'Air Bersih & Nipple System',
      pct: allocations.air,
      color: '#06b6d4', // cyan-500
      hoverColor: '#0891b2',
      unitNote: 'Sanitasi & Pompa Air Minum',
      calcUnits: (_val: number) => 'Suplai Air 24 Jam',
    },
  ];

  // SVG Geometry
  const size = 260;
  const strokeWidth = 34;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let cumulativePct = 0;

  const currentHoveredItem = data.find((d) => d.id === hoveredSlice) || null;

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      {/* Donut Chart SVG */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background circle track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />

          {data.map((item) => {
            const strokeDasharray = `${(item.pct / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((cumulativePct / 100) * circumference);
            cumulativePct += item.pct;

            const isHovered = hoveredSlice === item.id;

            return (
              <circle
                key={item.id}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={isHovered ? item.hoverColor : item.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredSlice(item.id)}
                onMouseLeave={() => setHoveredSlice(null)}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
          <span className="text-xs text-slate-500 font-medium">
            {currentHoveredItem ? currentHoveredItem.label.split('&')[0] : 'Total Laba'}
          </span>
          <span className="text-base sm:text-lg font-bold text-slate-900 font-mono tabular-nums">
            {currentHoveredItem
              ? formatRupiah((profitAmount * currentHoveredItem.pct) / 100)
              : formatRupiah(profitAmount)}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {currentHoveredItem ? `${currentHoveredItem.pct}% Alokasi` : '100% Terkonversi'}
          </span>
        </div>
      </div>

      {/* Legend & Breakdown Cards */}
      <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {data.map((item) => {
          const itemNominal = (profitAmount * item.pct) / 100;
          const isHovered = hoveredSlice === item.id;

          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredSlice(item.id)}
              onMouseLeave={() => setHoveredSlice(null)}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                isHovered
                  ? 'border-slate-400 bg-slate-50/80 shadow-xs ring-1 ring-slate-300'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded-xs shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-semibold text-slate-800 truncate">
                    {item.label}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-900 font-mono shrink-0">
                  {item.pct}%
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                  {formatRupiah(itemNominal)}
                </span>
                <span className="text-[11px] text-slate-500 truncate">
                  {item.calcUnits(itemNominal)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
