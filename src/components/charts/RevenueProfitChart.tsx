import React, { useState, useMemo } from 'react';
import { DailySummary } from '../../types';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';

interface RevenueProfitChartProps {
  data: DailySummary[];
}

export const RevenueProfitChart: React.FC<RevenueProfitChartProps> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartData = useMemo(() => {
    return data.slice(-16);
  }, [data]);

  const maxVal = useMemo(() => {
    let max = 0;
    chartData.forEach((d) => {
      if (d.totalRevenue > max) max = d.totalRevenue;
    });
    return max > 0 ? Math.ceil(max * 1.15) : 10000000;
  }, [chartData]);

  const chartWidth = 720;
  const chartHeight = 220;
  const padding = { top: 20, right: 20, bottom: 40, left: 75 };

  const usableWidth = chartWidth - padding.left - padding.right;
  const usableHeight = chartHeight - padding.top - padding.bottom;

  const barGroupWidth = usableWidth / chartData.length;
  const barWidth = Math.max(6, Math.min(18, barGroupWidth * 0.35));

  const getY = (val: number) => {
    return padding.top + usableHeight - (val / maxVal) * usableHeight;
  };

  const hoveredItem = hoveredIndex !== null ? chartData[hoveredIndex] : null;

  return (
    <div className="w-full flex flex-col">
      {/* Header / Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-slate-800 inline-block" />
            <span className="font-medium text-slate-700">Pendapatan Kotor (Omset)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" />
            <span className="font-medium text-slate-700">Keuntungan Bersih (Laba)</span>
          </div>
        </div>

        <span className="text-xs text-slate-500 font-mono">16 Hari Terakhir</span>
      </div>

      {/* SVG Bar Chart */}
      <div className="relative w-full overflow-hidden bg-slate-50/50 rounded-lg border border-slate-200/80 p-2">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-56 sm:h-64 overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padding.top + usableHeight * (1 - ratio);
            const val = maxVal * ratio;
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {val >= 1000000 ? `${(val / 1000000).toFixed(1)} jt` : val}
                </text>
              </g>
            );
          })}

          {/* Bar Pairs */}
          {chartData.map((d, i) => {
            const groupCenterX = padding.left + i * barGroupWidth + barGroupWidth / 2;
            const revBarH = usableHeight * (d.totalRevenue / maxVal);
            const profitBarH = usableHeight * (d.netProfit / maxVal);

            const isHovered = hoveredIndex === i;

            return (
              <g key={d.date} className="cursor-pointer">
                {/* Revenue Bar */}
                <rect
                  x={groupCenterX - barWidth - 1}
                  y={padding.top + usableHeight - revBarH}
                  width={barWidth}
                  height={Math.max(0, revBarH)}
                  fill={isHovered ? '#0f172a' : '#334155'}
                  rx="2"
                  className="transition-colors"
                />

                {/* Profit Bar */}
                <rect
                  x={groupCenterX + 1}
                  y={padding.top + usableHeight - profitBarH}
                  width={barWidth}
                  height={Math.max(0, profitBarH)}
                  fill={isHovered ? '#059669' : '#10b981'}
                  rx="2"
                  className="transition-colors"
                />

                {/* Hover backdrop */}
                <rect
                  x={padding.left + i * barGroupWidth}
                  y={padding.top}
                  width={barGroupWidth}
                  height={usableHeight}
                  fill={isHovered ? 'rgba(0,0,0,0.03)' : 'transparent'}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}

          {/* X Axis Labels */}
          {chartData.map((d, i) => {
            const groupCenterX = padding.left + i * barGroupWidth + barGroupWidth / 2;
            const datePart = d.date.slice(8);
            const monthPart = d.date.slice(5, 7);
            return (
              <text
                key={d.date}
                x={groupCenterX}
                y={chartHeight - 12}
                textAnchor="middle"
                className="text-[10px] fill-slate-500 font-mono"
              >
                {datePart}/{monthPart}
              </text>
            );
          })}
        </svg>

        {/* Hover Tooltip Details */}
        {hoveredItem && (
          <div className="mt-2 p-2.5 bg-white border border-slate-200 rounded-md shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-slate-800">
              {formatDateIndo(hoveredItem.date)}
            </span>
            <div className="flex items-center gap-4">
              <div className="text-slate-600">
                Omset:{' '}
                <span className="font-bold text-slate-900 font-mono tabular-nums">
                  {formatRupiah(hoveredItem.totalRevenue)}
                </span>
              </div>
              <div className="text-emerald-700">
                Laba Bersih:{' '}
                <span className="font-bold font-mono tabular-nums">
                  {formatRupiah(hoveredItem.netProfit)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
