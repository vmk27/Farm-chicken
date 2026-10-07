import React, { useState, useMemo } from 'react';
import { DailySummary } from '../../types';
import { formatNumber, formatDateIndo } from '../../utils/formatters';

interface ProductionSalesChartProps {
  data: DailySummary[];
}

export const ProductionSalesChart: React.FC<ProductionSalesChartProps> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Take the last 15-30 days of data for optimal legibility
  const chartData = useMemo(() => {
    return data.slice(-20);
  }, [data]);

  const maxVal = useMemo(() => {
    let max = 0;
    chartData.forEach((d) => {
      const prod = d.totalProductionKg;
      const sales = d.totalSalesKg;
      if (prod > max) max = prod;
      if (sales > max) max = sales;
    });
    return max > 0 ? Math.ceil(max * 1.15) : 100;
  }, [chartData]);

  const chartWidth = 720;
  const chartHeight = 220;
  const padding = { top: 20, right: 20, bottom: 40, left: 55 };

  const usableWidth = chartWidth - padding.left - padding.right;
  const usableHeight = chartHeight - padding.top - padding.bottom;

  const getX = (index: number) => {
    if (chartData.length <= 1) return padding.left;
    return padding.left + (index / (chartData.length - 1)) * usableWidth;
  };

  const getY = (val: number) => {
    return padding.top + usableHeight - (val / maxVal) * usableHeight;
  };

  // Build SVG Path for Production & Sales
  const prodPoints = chartData.map((d, i) => {
    const val = d.totalProductionKg;
    return `${getX(i)},${getY(val)}`;
  });

  const salesPoints = chartData.map((d, i) => {
    const val = d.totalSalesKg;
    return `${getX(i)},${getY(val)}`;
  });

  const prodLinePath = prodPoints.length > 0 ? `M ${prodPoints.join(' L ')}` : '';
  const salesLinePath = salesPoints.length > 0 ? `M ${salesPoints.join(' L ')}` : '';

  const prodAreaPath =
    prodPoints.length > 0
      ? `M ${prodPoints[0]} L ${prodPoints.join(' L ')} L ${getX(chartData.length - 1)},${
          padding.top + usableHeight
        } L ${getX(0)},${padding.top + usableHeight} Z`
      : '';

  const hoveredItem = hoveredIndex !== null ? chartData[hoveredIndex] : null;

  return (
    <div className="w-full flex flex-col">
      {/* Header with Metric Segmented Control & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-amber-500 inline-block" />
            <span className="font-medium text-slate-700">Produksi Telur</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-600 inline-block" />
            <span className="font-medium text-slate-700">Telur Terjual</span>
          </div>
        </div>

        <div className="flex items-center px-3 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700">
          Satuan: Kilogram (Kg)
        </div>
      </div>

      {/* SVG Container */}
      <div className="relative w-full overflow-hidden bg-slate-50/50 rounded-lg border border-slate-200/80 p-2">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-56 sm:h-64 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
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
                  {formatNumber(val, 0)} kg
                </text>
              </g>
            );
          })}

          {/* Area under Production */}
          {prodAreaPath && <path d={prodAreaPath} fill="url(#prodGrad)" />}

          {/* Lines */}
          {prodLinePath && (
            <path
              d={prodLinePath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {salesLinePath && (
            <path
              d={salesLinePath}
              fill="none"
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive vertical hover line & points */}
          {hoveredIndex !== null && (
            <g>
              <line
                x1={getX(hoveredIndex)}
                y1={padding.top}
                x2={getX(hoveredIndex)}
                y2={padding.top + usableHeight}
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(chartData[hoveredIndex].totalProductionKg)}
                r="4.5"
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(chartData[hoveredIndex].totalSalesKg)}
                r="4.5"
                fill="#059669"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}

          {/* X Axis Date labels */}
          {chartData.map((d, i) => {
            // Show every 3rd or 4th date to prevent overlapping
            const showLabel = i % 3 === 0 || i === chartData.length - 1;
            if (!showLabel) return null;
            const x = getX(i);
            const datePart = d.date.slice(8); // DD
            const monthPart = d.date.slice(5, 7); // MM
            return (
              <text
                key={d.date}
                x={x}
                y={chartHeight - 12}
                textAnchor="middle"
                className="text-[10px] fill-slate-500 font-mono"
              >
                {datePart}/{monthPart}
              </text>
            );
          })}

          {/* Transparent click/hover targets */}
          {chartData.map((_, i) => {
            const x = getX(i);
            const w = usableWidth / chartData.length;
            return (
              <rect
                key={i}
                x={x - w / 2}
                y={padding.top}
                width={w}
                height={usableHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>

        {/* Floating Tooltip info */}
        {hoveredItem && (
          <div className="mt-2 p-2.5 bg-white border border-slate-200 rounded-md shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="font-semibold text-slate-800">
              {formatDateIndo(hoveredItem.date)}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-amber-500 inline-block" />
                <span className="text-slate-600">Produksi:</span>
                <span className="font-bold text-slate-900 font-mono tabular-nums">
                  {formatNumber(hoveredItem.totalProductionKg, 1)} kg
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-emerald-600 inline-block" />
                <span className="text-slate-600">Terjual:</span>
                <span className="font-bold text-slate-900 font-mono tabular-nums">
                  {formatNumber(hoveredItem.totalSalesKg, 1)} kg
                </span>
              </div>
              <div className="text-slate-500 font-mono text-[11px]">
                Sisa Stok:{' '}
                <span className="font-semibold text-slate-700">
                  {formatNumber(hoveredItem.stockEndKg, 1)} kg
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
