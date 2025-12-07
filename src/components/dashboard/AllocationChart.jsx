/**
 * AllocationChart Component
 * Graphique circulaire (donut) pour répartition
 */

const AllocationChart = ({ data, title, size = 200 }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>Aucune donnée d'allocation</p>
      </div>
    );
  }

  const total = Object.values(data).reduce((sum, val) => sum + val, 0);
  const entries = Object.entries(data);

  // Colors for each category
  const colors = [
    { from: 'from-blue-500', to: 'to-indigo-500', text: 'text-blue-400', bg: 'bg-blue-500/20' },
    { from: 'from-purple-500', to: 'to-pink-500', text: 'text-purple-400', bg: 'bg-purple-500/20' },
    { from: 'from-green-500', to: 'to-teal-500', text: 'text-green-400', bg: 'bg-green-500/20' },
    { from: 'from-orange-500', to: 'to-red-500', text: 'text-orange-400', bg: 'bg-orange-500/20' },
    { from: 'from-yellow-500', to: 'to-amber-500', text: 'text-yellow-400', bg: 'bg-yellow-500/20' }
  ];

  // Calculate percentages and angles
  let currentAngle = 0;
  const segments = entries.map(([key, value], index) => {
    const percentage = (value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    return {
      key,
      value,
      percentage: percentage.toFixed(1),
      startAngle,
      endAngle: currentAngle,
      color: colors[index % colors.length]
    };
  });

  // SVG donut chart
  const radius = size / 2;
  const strokeWidth = size * 0.2;
  const innerRadius = radius - strokeWidth;
  const circumference = 2 * Math.PI * innerRadius;

  const createArc = (startAngle, endAngle) => {
    const start = (startAngle - 90) * (Math.PI / 180);
    const end = (endAngle - 90) * (Math.PI / 180);

    const x1 = radius + innerRadius * Math.cos(start);
    const y1 = radius + innerRadius * Math.sin(start);
    const x2 = radius + innerRadius * Math.cos(end);
    const y2 = radius + innerRadius * Math.sin(end);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  return (
    <div className="space-y-4">
      {title && <h4 className="text-sm font-semibold text-slate-300">{title}</h4>}

      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Donut Chart */}
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={radius}
              cy={radius}
              r={innerRadius}
              fill="none"
              stroke="rgba(71, 85, 105, 0.3)"
              strokeWidth={strokeWidth}
            />

            {/* Segments */}
            {segments.map((segment, index) => (
              <path
                key={index}
                d={createArc(segment.startAngle, segment.endAngle)}
                fill="none"
                stroke={`url(#gradient-${index})`}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                className="transition-all duration-300 hover:opacity-80 cursor-pointer"
              />
            ))}

            {/* Gradients */}
            <defs>
              {segments.map((segment, index) => (
                <linearGradient key={index} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className={segment.color.from.replace('from-', 'stop-')} />
                  <stop offset="100%" className={segment.color.to.replace('to-', 'stop-')} />
                </linearGradient>
              ))}
            </defs>
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-white">{total.toLocaleString()}€</div>
            <div className="text-xs text-slate-400">Total</div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {segments.map((segment, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg ${segment.color.bg} border border-slate-700/50 hover:scale-105 transition-transform cursor-pointer`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${segment.color.from} ${segment.color.to}`}></div>
                <span className="text-sm font-medium text-white capitalize">{segment.key}</span>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${segment.color.text}`}>
                  {segment.value.toLocaleString()}€
                </div>
                <div className="text-xs text-slate-400">{segment.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AllocationChart;
