import React, { useState, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * ProgressionChart Component - 7-day progression chart with volume and intensity
 * 
 * @param {Object} props
 * @param {Array} props.data - Array of 7 data points
 * @param {Function} props.onHover - Callback when hovering over a point
 */
const ProgressionChart = ({
  data = [],
  onHover
}) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const chartRef = useRef(null);

  // Chart dimensions
  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Ensure we have 7 days of data
  const chartData = data.length === 7 ? data : Array(7).fill(null).map((_, i) => ({
    day: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][i],
    volume: 0,
    intensity: 0,
    records: 0
  }));

  // Find max values for scaling
  const maxVolume = Math.max(...chartData.map(d => d.volume), 100);
  const maxIntensity = 100; // Intensity is always 0-100%

  // Scale functions
  const scaleX = (index) => padding.left + (index * chartWidth) / 6;
  const scaleYVolume = (value) => padding.top + chartHeight - (value / maxVolume) * chartHeight;
  const scaleYIntensity = (value) => padding.top + chartHeight - (value / maxIntensity) * chartHeight;

  // Generate path for volume curve
  const volumePath = chartData.map((d, i) => {
    const x = scaleX(i);
    const y = scaleYVolume(d.volume);
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');

  // Generate path for intensity curve
  const intensityPath = chartData.map((d, i) => {
    const x = scaleX(i);
    const y = scaleYIntensity(d.intensity);
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');

  // Calculate statistics
  const avgVolume = Math.round(chartData.reduce((sum, d) => sum + d.volume, 0) / 7);
  const avgIntensity = Math.round(chartData.reduce((sum, d) => sum + d.intensity, 0) / 7);
  const totalRecords = chartData.reduce((sum, d) => sum + d.records, 0);
  
  // Find best day
  const bestDayIndex = chartData.reduce((maxIdx, d, i, arr) => 
    d.volume > arr[maxIdx].volume ? i : maxIdx, 0
  );
  const bestDay = chartData[bestDayIndex];

  // Calculate trend
  const firstHalf = chartData.slice(0, 3).reduce((sum, d) => sum + d.volume, 0) / 3;
  const secondHalf = chartData.slice(4, 7).reduce((sum, d) => sum + d.volume, 0) / 3;
  const trend = secondHalf > firstHalf ? 'up' : secondHalf < firstHalf ? 'down' : 'stable';

  // Handle point hover
  const handlePointHover = (point, index, event) => {
    if (chartRef.current) {
      const rect = chartRef.current.getBoundingClientRect();
      setTooltipPos({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
    }
    setHoveredPoint({ ...point, index });
    if (onHover) onHover(point, index);
  };

  // Check if today
  const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  const todayIndex = today === 0 ? 6 : today - 1; // Convert to our index (0 = Monday)

  return (
    <div className="progression-chart bg-gray-800 border border-gray-700 rounded-lg p-6">
      {/* Header */}
      <div className="chart-header mb-6">
        <h3 className="text-lg font-bold text-orange-400 mb-2">
          Progression sur 7 jours
        </h3>
        
        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="stat-item">
            <div className="text-gray-400">Moyenne Volume</div>
            <div className="text-white font-bold">{avgVolume} reps</div>
          </div>
          <div className="stat-item">
            <div className="text-gray-400">Moyenne Intensité</div>
            <div className="text-white font-bold">{avgIntensity}%</div>
          </div>
          <div className="stat-item">
            <div className="text-gray-400">Records</div>
            <div className="text-white font-bold">{totalRecords}</div>
          </div>
          <div className="stat-item">
            <div className="text-gray-400">Tendance</div>
            <div className="flex items-center gap-1">
              {trend === 'up' && <TrendingUp size={16} className="text-green-500" />}
              {trend === 'down' && <TrendingDown size={16} className="text-red-500" />}
              {trend === 'stable' && <Minus size={16} className="text-gray-500" />}
              <span className={`font-bold ${
                trend === 'up' ? 'text-green-500' :
                trend === 'down' ? 'text-red-500' :
                'text-gray-500'
              }`}>
                {trend === 'up' ? 'Hausse' : trend === 'down' ? 'Baisse' : 'Stable'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="chart-container relative" ref={chartRef}>
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percent) => {
            const y = padding.top + chartHeight - (percent / 100) * chartHeight;
            return (
              <g key={percent}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#374151"
                  strokeWidth="1"
                  strokeDasharray="4"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="#9CA3AF"
                  fontSize="12"
                >
                  {percent}%
                </text>
              </g>
            );
          })}

          {/* Volume curve */}
          <path
            d={volumePath}
            fill="none"
            stroke="#F97316"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Intensity curve */}
          <path
            d={intensityPath}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 4"
          />

          {/* Data points */}
          {chartData.map((point, index) => {
            const x = scaleX(index);
            const yVolume = scaleYVolume(point.volume);
            const yIntensity = scaleYIntensity(point.intensity);
            const isToday = index === todayIndex;
            const isHovered = hoveredPoint?.index === index;

            return (
              <g key={index}>
                {/* Volume point */}
                <circle
                  cx={x}
                  cy={yVolume}
                  r={isToday ? 8 : isHovered ? 6 : 4}
                  fill="#F97316"
                  stroke={isToday ? '#FFF' : 'none'}
                  strokeWidth={isToday ? 2 : 0}
                  className="cursor-pointer transition-all"
                  onMouseEnter={(e) => handlePointHover(point, index, e)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />

                {/* Intensity point */}
                <circle
                  cx={x}
                  cy={yIntensity}
                  r={isToday ? 8 : isHovered ? 6 : 4}
                  fill="#3B82F6"
                  stroke={isToday ? '#FFF' : 'none'}
                  strokeWidth={isToday ? 2 : 0}
                  className="cursor-pointer transition-all"
                  onMouseEnter={(e) => handlePointHover(point, index, e)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />

                {/* Day label */}
                <text
                  x={x}
                  y={height - padding.bottom + 20}
                  textAnchor="middle"
                  fill={isToday ? '#F97316' : '#9CA3AF'}
                  fontSize="14"
                  fontWeight={isToday ? 'bold' : 'normal'}
                >
                  {point.day}
                </text>

                {/* Today indicator */}
                {isToday && (
                  <text
                    x={x}
                    y={height - padding.bottom + 35}
                    textAnchor="middle"
                    fill="#F97316"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    AUJOURD'HUI
                  </text>
                )}
              </g>
            );
          })}

          {/* Legend */}
          <g transform={`translate(${width - 150}, 20)`}>
            <line x1="0" y1="0" x2="30" y2="0" stroke="#F97316" strokeWidth="3" />
            <text x="35" y="4" fill="#9CA3AF" fontSize="12">Volume</text>
            
            <line x1="0" y1="20" x2="30" y2="20" stroke="#3B82F6" strokeWidth="3" strokeDasharray="6 4" />
            <text x="35" y="24" fill="#9CA3AF" fontSize="12">Intensité</text>
          </g>
        </svg>

        {/* Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-10 bg-gray-900 border border-orange-500/30 rounded-lg p-3 shadow-lg pointer-events-none"
            style={{
              left: `${tooltipPos.x + 10}px`,
              top: `${tooltipPos.y - 80}px`
            }}
          >
            <div className="text-sm font-bold text-orange-400 mb-1">
              {hoveredPoint.day}
            </div>
            <div className="text-xs text-gray-300 space-y-1">
              <div>Volume: <span className="text-white font-bold">{hoveredPoint.volume} reps</span></div>
              <div>Intensité: <span className="text-white font-bold">{hoveredPoint.intensity}%</span></div>
              <div>Records: <span className="text-white font-bold">{hoveredPoint.records}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Best Day Highlight */}
      {bestDay.volume > 0 && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="text-sm text-green-400">
            🏆 Meilleur jour: <span className="font-bold">{bestDay.day}</span> avec {bestDay.volume} reps
          </div>
        </div>
      )}
    </div>
  );
};

// Memoize for performance (Phase 6)
export default React.memo(ProgressionChart);
