/**
 * CircularGauge - Jauge circulaire SVG réutilisable
 * Utilisé pour afficher des progressions en cercle avec animations
 */

const CircularGauge = ({ 
  value, 
  max = 100, 
  size = 120, 
  strokeWidth = 10,
  color = '#8b5cf6',
  backgroundColor = '#1e293b',
  showPercentage = true,
  label = '',
  className = ''
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min((value / max) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 8px ${color})`
          }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <div className="text-2xl font-bold text-white">
            {Math.round(percentage)}%
          </div>
        )}
        {label && (
          <div className="text-xs text-slate-400 mt-1">{label}</div>
        )}
      </div>
    </div>
  );
};

export default CircularGauge;
