/**
 * ProgressBar - Barre de progression horizontale réutilisable
 * Utilisée pour afficher des progressions linéaires avec animations
 */

const ProgressBar = ({ 
  value, 
  max = 100, 
  height = 'h-3',
  color = 'from-purple-500 to-pink-500',
  backgroundColor = 'bg-slate-700/50',
  showLabel = false,
  label = '',
  showPercentage = false,
  className = ''
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={`progress-bar ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-slate-400">{label}</span>
          {showPercentage && (
            <span className="text-white font-semibold">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className={`relative ${height} ${backgroundColor} rounded-full overflow-hidden`}>
        <div 
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${color} rounded-full transition-all duration-1000 ease-out`}
          style={{ 
            width: `${percentage}%`,
            boxShadow: `0 0 20px ${color.includes('purple') ? 'rgba(168, 85, 247, 0.5)' : 'rgba(59, 130, 246, 0.5)'}`
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
