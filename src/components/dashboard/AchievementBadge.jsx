/**
 * AchievementBadge Component
 * Badge d'achievement avec animation
 */

const AchievementBadge = ({ icon, name, description, unlocked, rarity = 'common' }) => {
  const rarityColors = {
    common: 'from-slate-600 to-slate-700 border-slate-500',
    rare: 'from-blue-600 to-blue-700 border-blue-500',
    epic: 'from-purple-600 to-purple-700 border-purple-500',
    legendary: 'from-yellow-600 to-yellow-700 border-yellow-500'
  };

  const rarityGlow = {
    common: 'shadow-slate-500/20',
    rare: 'shadow-blue-500/30',
    epic: 'shadow-purple-500/40',
    legendary: 'shadow-yellow-500/50'
  };

  return (
    <div
      className={`group relative p-3 rounded-xl border-2 transition-all duration-300 ${
        unlocked
          ? `bg-gradient-to-br ${rarityColors[rarity]} ${rarityGlow[rarity]} hover:scale-105 cursor-pointer`
          : 'bg-slate-800/30 border-slate-700/50 opacity-50'
      }`}
    >
      {/* Glow effect for unlocked */}
      {unlocked && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
      )}

      <div className="relative flex items-center gap-3">
        {/* Icon */}
        <div className={`text-3xl ${unlocked ? 'animate-bounce-slow' : 'grayscale'}`}>
          {icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`text-sm font-bold ${unlocked ? 'text-white' : 'text-slate-600'}`}>
              {name}
            </h4>
            {unlocked && rarity !== 'common' && (
              <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-white font-semibold">
                {rarity.toUpperCase()}
              </span>
            )}
          </div>
          <p className={`text-xs mt-0.5 ${unlocked ? 'text-slate-300' : 'text-slate-600'}`}>
            {description}
          </p>
        </div>

        {/* Lock icon for locked achievements */}
        {!unlocked && (
          <div className="text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        )}
      </div>

      {/* Sparkle effect for legendary */}
      {unlocked && rarity === 'legendary' && (
        <div className="absolute -top-1 -right-1 text-yellow-400 animate-pulse">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default AchievementBadge;
