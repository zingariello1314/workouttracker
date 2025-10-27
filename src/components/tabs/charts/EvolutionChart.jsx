import React from 'react';
import { TrendingUp } from 'lucide-react';

const EvolutionChart = ({ data, colors }) => {
  // Calculer les données d'évolution
  const evolutionData = React.useMemo(() => {
    return data.workoutHistory
      .map(session => ({
        date: session.date,
        totalReps: session.totalReps,
        exercises: session.exercises?.length || 0,
        duration: session.duration || 0
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [data.workoutHistory]);

  if (evolutionData.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-400">
        <div className="text-center">
          <TrendingUp className="mx-auto mb-4 text-gray-500" size={48} />
          <p className="text-lg font-medium">Aucune donnée pour cette période</p>
          <p className="text-sm text-gray-500 mt-2">Commencez vos entraînements pour voir vos progrès !</p>
        </div>
      </div>
    );
  }

  const maxReps = Math.max(...evolutionData.map(d => d.totalReps));
  const minReps = Math.min(...evolutionData.map(d => d.totalReps));
  const range = Math.max(maxReps - minReps, 1); // Éviter la division par zéro
  
  // Fonction utilitaire pour calculer les coordonnées de manière sécurisée
  const getCoordinates = (data, index) => {
    if (evolutionData.length <= 1) {
      return { x: 50, y: 50 };
    }
    
    // Validation stricte des données
    const totalReps = Number(data.totalReps) || 0;
    const safeMinReps = Number(minReps) || 0;
    const safeRange = Number(range) || 1;
    
    const x = Math.max(0, Math.min(100, (index / (evolutionData.length - 1)) * 100));
    const normalizedReps = Math.max(0, Math.min(1, (totalReps - safeMinReps) / safeRange));
    const y = Math.max(0, Math.min(100, 100 - normalizedReps * 80));
    
    // Validation finale des coordonnées
    return { 
      x: isNaN(x) ? 50 : x, 
      y: isNaN(y) ? 50 : y 
    };
  };

  return (
    <div className="space-y-4">
      {/* Graphique */}
      <div className="h-80 relative">
        <svg width="100%" height="100%" className="overflow-visible">
          <defs>
            {/* Gradient pour la ligne */}
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.8"/>
              <stop offset="50%" stopColor={colors.purple} stopOpacity="0.9"/>
              <stop offset="100%" stopColor={colors.pink} stopOpacity="0.8"/>
            </linearGradient>
            
            {/* Gradient pour la zone sous la courbe */}
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.3"/>
              <stop offset="100%" stopColor={colors.primary} stopOpacity="0.05"/>
            </linearGradient>
          </defs>
          
          {/* Grille de fond subtile */}
          <g opacity="0.1">
            {[...Array(6)].map((_, i) => (
              <line
                key={i}
                x1="0"
                y1={`${(i / 5) * 100}%`}
                x2="100%"
                y2={`${(i / 5) * 100}%`}
                stroke="white"
                strokeWidth="1"
              />
            ))}
          </g>
          
          {/* Zone sous la courbe */}
          {evolutionData.length > 1 && (
            <path
              d={`M 0,100% ${evolutionData.map((d, i) => {
                const coords = getCoordinates(d, i);
                return `L ${coords.x}%,${coords.y}%`;
              }).join(' ')} L 100%,100% Z`}
              fill="url(#areaGradient)"
            />
          )}
          
          {/* Ligne de progression avec gradient */}
          {evolutionData.length > 1 && (
            <polyline
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={evolutionData.map((d, i) => {
                const coords = getCoordinates(d, i);
                return `${coords.x}%,${coords.y}%`;
              }).join(' ')}
            />
          )}
          
          {/* Points de données */}
          {evolutionData.map((d, i) => {
            const coords = getCoordinates(d, i);
            
            return (
              <circle
                key={i}
                cx={`${coords.x}%`}
                cy={`${coords.y}%`}
                r="6"
                fill={colors.primary}
                className="hover:r-8 transition-all duration-300 cursor-pointer"
                style={{
                  filter: 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.4))'
                }}
                title={`${new Date(d.date).toLocaleDateString('fr-FR')}: ${d.totalReps} répétitions`}
              />
            );
          })}
        </svg>
        
        {/* Légende */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-2">
            <span className="text-xs text-gray-300">Min: </span>
            <span className="text-sm font-semibold text-blue-400">{minReps}</span>
          </div>
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-2">
            <span className="text-xs text-gray-300">Max: </span>
            <span className="text-sm font-semibold text-pink-400">{maxReps}</span>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Total</div>
          <div className="text-lg font-bold text-blue-400">
            {evolutionData.reduce((sum, d) => sum + d.totalReps, 0)}
          </div>
          <div className="text-xs text-gray-500">répétitions</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Moyenne</div>
          <div className="text-lg font-bold text-purple-400">
            {evolutionData.length > 0 ? Math.round(evolutionData.reduce((sum, d) => sum + d.totalReps, 0) / evolutionData.length) : 0}
          </div>
          <div className="text-xs text-gray-500">rép/séance</div>
        </div>
      </div>
    </div>
  );
};

export default EvolutionChart;
