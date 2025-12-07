/**
 * StreakFlame - Flamme animée dont la taille varie selon le streak
 * Utilisée pour visualiser la régularité
 */

const StreakFlame = ({ streak, size = 'normal', className = '' }) => {
  // Calculate flame size based on streak
  const getFlameSize = () => {
    if (streak === 0) return { scale: 0.5, opacity: 0.3 };
    if (streak < 3) return { scale: 0.7, opacity: 0.5 };
    if (streak < 7) return { scale: 0.9, opacity: 0.7 };
    if (streak < 14) return { scale: 1.1, opacity: 0.9 };
    if (streak < 30) return { scale: 1.3, opacity: 1 };
    return { scale: 1.5, opacity: 1 };
  };

  const getFlameColor = () => {
    if (streak === 0) return 'grayscale';
    if (streak < 7) return 'text-orange-400';
    if (streak < 14) return 'text-orange-500';
    if (streak < 30) return 'text-red-500';
    return 'text-red-600';
  };

  const { scale, opacity } = getFlameSize();
  const colorClass = getFlameColor();

  const sizeMap = {
    small: 'text-4xl',
    normal: 'text-6xl',
    large: 'text-8xl'
  };

  return (
    <div className={`streak-flame relative inline-block ${className}`}>
      <div 
        className={`${sizeMap[size]} ${colorClass} transition-all duration-500 ${
          streak > 0 ? 'animate-pulse' : ''
        }`}
        style={{ 
          transform: `scale(${scale})`,
          opacity,
          filter: streak === 0 ? 'grayscale(100%)' : 'none'
        }}
      >
        🔥
      </div>
      {streak > 0 && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/50 rounded-full">
          <div className="text-xs font-bold text-white whitespace-nowrap">
            {streak} {streak === 1 ? 'jour' : 'jours'}
          </div>
        </div>
      )}
    </div>
  );
};

export default StreakFlame;
