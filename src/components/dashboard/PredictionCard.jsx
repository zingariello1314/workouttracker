/**
 * PredictionCard Component
 * Carte de prédiction avec scénarios multiples
 */

const PredictionCard = ({ scenario, date, probability, details, icon }) => {
  const scenarioStyles = {
    optimiste: {
      bg: 'from-green-500/20 to-green-600/20',
      border: 'border-green-500/50',
      text: 'text-green-400',
      icon: '🚀'
    },
    realiste: {
      bg: 'from-blue-500/20 to-blue-600/20',
      border: 'border-blue-500/50',
      text: 'text-blue-400',
      icon: '🎯'
    },
    pessimiste: {
      bg: 'from-orange-500/20 to-orange-600/20',
      border: 'border-orange-500/50',
      text: 'text-orange-400',
      icon: '🐌'
    }
  };

  const style = scenarioStyles[scenario] || scenarioStyles.realiste;

  return (
    <div className={`group relative overflow-hidden bg-gradient-to-br ${style.bg} border-2 ${style.border} rounded-xl p-4 hover:scale-105 transition-all duration-300 cursor-pointer`}>
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="relative space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon || style.icon}</span>
            <h4 className={`text-sm font-bold ${style.text} capitalize`}>
              {scenario}
            </h4>
          </div>
          {probability && (
            <div className={`px-2 py-1 bg-white/10 rounded-lg ${style.text} text-xs font-bold`}>
              {probability}%
            </div>
          )}
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-slate-300">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-semibold">{date}</span>
        </div>

        {/* Details */}
        {details && (
          <div className="space-y-1.5">
            {Object.entries(details).map(([key, value], index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{key}</span>
                <span className="text-white font-semibold">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Progress indicator */}
        <div className="h-1 bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${style.bg.replace('/20', '')} transition-all duration-500`}
            style={{ width: `${probability || 50}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default PredictionCard;
