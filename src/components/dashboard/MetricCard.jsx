/**
 * MetricCard Component
 * Carte métrique compacte réutilisable
 */

const MetricCard = ({ icon, label, value, trend, color = 'blue', onClick, size = 'normal' }) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/50 text-blue-400',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/50 text-purple-400',
    green: 'from-green-500/20 to-green-600/20 border-green-500/50 text-green-400',
    orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/50 text-orange-400',
    red: 'from-red-500/20 to-red-600/20 border-red-500/50 text-red-400',
    indigo: 'from-indigo-500/20 to-indigo-600/20 border-indigo-500/50 text-indigo-400',
    pink: 'from-pink-500/20 to-pink-600/20 border-pink-500/50 text-pink-400',
    yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/50 text-yellow-400'
  };

  const sizeClasses = {
    small: 'p-3',
    normal: 'p-4',
    large: 'p-5'
  };

  const iconSizes = {
    small: 'text-xl',
    normal: 'text-2xl',
    large: 'text-3xl'
  };

  const valueSizes = {
    small: 'text-lg',
    normal: 'text-2xl',
    large: 'text-3xl'
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend > 0) return '↑';
    if (trend < 0) return '↓';
    return '→';
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend > 0) return 'text-green-400';
    if (trend < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  return (
    <div
      className={`group relative overflow-hidden bg-gradient-to-br ${colorClasses[color]} border-2 rounded-xl ${sizeClasses[size]} transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:scale-105' : ''
      }`}
      onClick={onClick}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="relative space-y-2">
        {/* Icon */}
        <div className={iconSizes[size]}>{icon}</div>

        {/* Label */}
        <div className="text-xs text-slate-400 font-medium">{label}</div>

        {/* Value */}
        <div className="flex items-end justify-between">
          <div className={`${valueSizes[size]} font-bold text-white`}>
            {value}
          </div>

          {/* Trend */}
          {trend !== undefined && trend !== null && (
            <div className={`text-sm font-bold ${getTrendColor()} flex items-center gap-1`}>
              <span>{getTrendIcon()}</span>
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
