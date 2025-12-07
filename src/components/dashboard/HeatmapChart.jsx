/**
 * HeatmapChart Component
 * Heatmap de performance par créneau horaire
 */

const HeatmapChart = ({ data, title }) => {
  const hours = ['6h', '9h', '12h', '15h', '18h', '21h'];
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const getIntensityColor = (value) => {
    if (value === 0) return 'bg-slate-800/50';
    if (value < 30) return 'bg-indigo-900/50';
    if (value < 60) return 'bg-indigo-700/70';
    if (value < 90) return 'bg-indigo-500/80';
    return 'bg-indigo-400';
  };

  return (
    <div className="space-y-3">
      {title && <h4 className="text-sm font-semibold text-slate-300">{title}</h4>}
      
      <div className="space-y-1">
        {/* Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          <div className="text-xs text-slate-500"></div>
          {hours.map((hour, i) => (
            <div key={i} className="text-xs text-slate-500 text-center">{hour}</div>
          ))}
        </div>

        {/* Heatmap Grid */}
        {days.map((day, dayIndex) => (
          <div key={dayIndex} className="grid grid-cols-7 gap-1">
            <div className="text-xs text-slate-400 flex items-center">{day}</div>
            {hours.map((_, hourIndex) => {
              const value = data?.[dayIndex]?.[hourIndex] || 0;
              return (
                <div
                  key={hourIndex}
                  className={`h-8 rounded ${getIntensityColor(value)} border border-slate-700/50 transition-all duration-300 hover:scale-110 hover:border-indigo-400/50 cursor-pointer group relative`}
                  title={`${day} ${hours[hourIndex]}: ${value}min`}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-bold text-white">{value}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mt-3">
        <span>Moins</span>
        <div className="flex gap-1">
          {[0, 30, 60, 90, 120].map((val, i) => (
            <div key={i} className={`w-4 h-4 rounded ${getIntensityColor(val)}`}></div>
          ))}
        </div>
        <span>Plus</span>
      </div>
    </div>
  );
};

export default HeatmapChart;
