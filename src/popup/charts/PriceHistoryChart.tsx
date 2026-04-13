import React from 'react';
import { PriceHistory } from '../../types';
import { formatChartData } from '../../services/priceHistoryService';

interface Props {
  history: PriceHistory;
  currentPrice: number;
}

export const PriceHistoryChart: React.FC<Props> = ({ history, currentPrice }) => {
  const data = formatChartData(history);

  if (data.length < 2) {
    return (
      <div className="chart-placeholder">
        <p>Collecting price history... check back tomorrow!</p>
      </div>
    );
  }

  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 1;

  const chartWidth = 260;
  const chartHeight = 80;
  const padding = 4;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - ((d.price - minPrice) / range) * (chartHeight - padding * 2);
    return { x, y, price: d.price, date: d.date };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Current price line
  const currentY =
    chartHeight - padding - ((currentPrice - minPrice) / range) * (chartHeight - padding * 2);

  return (
    <div className="price-history-chart">
      <div className="chart-header">
        <span className="chart-title">30-Day Price History</span>
        <span className="chart-current">${currentPrice.toFixed(2)} now</span>
      </div>

      <svg width={chartWidth} height={chartHeight} className="chart-svg">
        {/* Area fill */}
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Area */}
        <polygon
          points={`${points[0].x},${chartHeight} ${polylinePoints} ${points[points.length - 1].x},${chartHeight}`}
          fill="url(#chartGrad)"
        />

        {/* Line */}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Current price indicator */}
        <line
          x1={padding}
          y1={currentY}
          x2={chartWidth - padding}
          y2={currentY}
          stroke="#22c55e"
          strokeWidth="1"
          strokeDasharray="4,4"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2" fill="#6366f1" />
        ))}
      </svg>

      <div className="chart-footer">
        <span>${minPrice.toFixed(2)} low</span>
        <span>${history.averagePrice?.toFixed(2)} avg</span>
        <span>${maxPrice.toFixed(2)} high</span>
      </div>
    </div>
  );
};
