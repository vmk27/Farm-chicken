import React, { useState, useMemo } from 'react';
import { DailySummary } from '../../types';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';

interface PriceTrendChartProps {
  data: DailySummary[];
  currentBenchmark: number;
}

export const PriceTrendChart: React.FC<PriceTrendChartProps> = ({
  data,
  currentBenchmark,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartData = useMemo(() => {
    return data.slice(-20);
  }, [data]);

  const { minPrice, maxPrice } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    chartData.forEach((d) => {
      if (d.avgSellingPricePerKg < min) min = d.avgSellingPricePerKg;
      if (d.avgSellingPricePerKg > max) max = d.avgSellingPricePerKg;
    });
    if (currentBenchmark < min) min = currentBenchmark;
    if (currentBenchmark > max) max = currentBenchmark;

    // Floor and ceil to nice thousand boundaries
    return {
      minPrice: Math.floor((min - 1000) / 1000) * 1000,
      maxPrice: Math.ceil((max + 1000) / 1000) * 1000,
    };
  }, [chartData, currentBenchmark]);

  const chartWidth = 720;
  const chartHeight = 220;
  const padding = { top: 20, right: 20, bottom: 40, left: 75 };

  const usableWidth = chartWidth - padding.left - padding.right;
  const usableHeight = chartHeight - padding.top - padding.bottom;

  const priceRange = maxPrice - minPrice || 1000;

  const getX = (index: number) => {
    if (chartData.length <= 1) return padding.left;
    return padding.left + (index / (chartData.length - 1)) * usableWidth;
  };

  const getY = (val: number) => {
    return padding.top + usableHeight - ((val - minPrice) / priceRange) * usableHeight;
  };

  const points = chartData.map((d, i) => `${getX(i)},${getY(d.avgSellingPricePerKg)}`);
  const linePath = points.length > 0 ? `M ${points.join(' L ')}` : '';

  const hoveredItem = hoveredIndex !== null ? chartData[hoveredIndex] : null;

  return (
    <div className="w-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-sky-600 inline-block" />
            <span className="font-medium text-slate-700">Rata-rata Harga Jual / kg</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-500 inline-block border-b border-dashed border-amber-600" />
            <span className="font-medium text-slate-700">
              Acuan Pasar ({formatRupiah(currentBenchmark)}/kg)
            </span>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-hidden bg-slate-50/50 rounded-lg border border-slate-200/80 p-2">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-56 sm:h-64 overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Y Axis Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, idx) => {
            const y = padding.top + usableHeight * (1 - ratio);
            const val = minPrice + priceRange * ratio;
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
                  {formatRupiah(val)}
                </text>
              </g>
            );
          })}

          {/* Benchmark Line */}
          <line
            x1={padding.left}
            y1={getY(currentBenchmark)}
            x2={chartWidth - padding.right}
            y2={getY(currentBenchmark)}
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="5 4"
          />

          {/* Main Price Trend Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Dots */}
          {chartData.map((d, i) => (
            <circle
              key={d.date}
              cx={getX(i)}
              cy={getY(d.avgSellingPricePerKg)}
              r={hoveredIndex === i ? '5' : '3'}
              fill="#0284c7"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          ))}

          {/* X Axis Labels */}
          {chartData.map((d, i) => {
            const showLabel = i % 3 === 0 || i === chartData.length - 1;
            if (!showLabel) return null;
            const x = getX(i);
            const datePart = d.date.slice(8);
            const monthPart = d.date.slice(5, 7);
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

          {/* Transparent Hover Hitboxes */}
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

        {hoveredItem && (
          <div className="mt-2 p-2.5 bg-white border border-slate-200 rounded-md shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-slate-800">
              {formatDateIndo(hoveredItem.date)}
            </span>
            <div className="flex items-center gap-4">
              <div className="text-slate-600">
                Rata-rata Realisasi:{' '}
                <span className="font-bold text-sky-700 font-mono tabular-nums">
                  {formatRupiah(hoveredItem.avgSellingPricePerKg)} / kg
                </span>
              </div>
              <div className="text-slate-500 font-mono text-[11px]">
                Volume Terjual:{' '}
                <span className="font-semibold text-slate-700">
                  {hoveredItem.totalSalesKg} kg
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
