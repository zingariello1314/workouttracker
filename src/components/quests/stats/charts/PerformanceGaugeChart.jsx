/**
 * Composant PerformanceGaugeChart - Score de performance global
 * Jauge semi-circulaire affichant un score composite (0-100%)
 */

import React, { useMemo } from 'react';
import LazyChart from '../../../BodyTracking/components/LazyChart';

const PerformanceGaugeChart = ({ stats }) => {
  const { score, breakdown } = useMemo(() => {
    if (!stats) return { score: 0, breakdown: {} };

    // Calculer le score composite
    // - Taux de complétion moyen (40%)
    const completionWeight = 0.4;
    const completionScore = Math.min(stats.completionRate || 0, 100);

    // - Régularité basée sur streak (30%)
    const regularityWeight = 0.3;
    const maxStreakForScore = 30; // 30 jours = 100%
    const regularityScore = Math.min((stats.currentStreak || 0) / maxStreakForScore * 100, 100);

    // - Diversité des catégories (20%)
    const diversityWeight = 0.2;
    const activeCategories = (stats.categoryStats || []).filter(c => c.validationsCount > 0).length;
    const maxCategories = 7;
    const diversityScore = (activeCategories / maxCategories) * 100;

    // - Progression (XP gagné) (10%)
    const progressionWeight = 0.1;
    // Normaliser sur une base de 10000 XP = 100%
    const maxXPForScore = 10000;
    const progressionScore = Math.min(((stats.totalXP || 0) / maxXPForScore) * 100, 100);

    // Score final
    const finalScore = Math.round(
      completionScore * completionWeight +
      regularityScore * regularityWeight +
      diversityScore * diversityWeight +
      progressionScore * progressionWeight
    );

    return {
      score: finalScore,
      breakdown: {
        completion: completionScore,
        regularity: regularityScore,
        diversity: diversityScore,
        progression: progressionScore,
      },
    };
  }, [stats]);

  // Déterminer la couleur et le label selon le score
  const getScoreInfo = (score) => {
    if (score >= 90) return { color: '#06b6d4', label: 'Exceptionnel', gradient: 'from-cyan-400 to-blue-500' };
    if (score >= 75) return { color: '#10b981', label: 'Excellent', gradient: 'from-emerald-400 to-cyan-500' };
    if (score >= 50) return { color: '#f59e0b', label: 'Bien', gradient: 'from-amber-400 to-orange-500' };
    return { color: '#ef4444', label: 'À améliorer', gradient: 'from-red-400 to-orange-500' };
  };

  const scoreInfo = getScoreInfo(score);
  const percentage = score;

  // Calculer les coordonnées de l'arc de manière correcte
  // La jauge va de 0° (droite) à 180° (gauche)
  const centerX = 128;
  const centerY = 100; // Ajusté pour le nouveau viewBox
  const radius = 88;
  
  // Angle de départ : 0° (point de droite)
  // Angle de fin : basé sur le pourcentage (0% = droite, 100% = gauche)
  const startAngleDeg = 0;
  const endAngleDeg = (percentage / 100) * 180;
  
  // Convertir en radians (SVG : 0° = droite, sens horaire)
  // Ajuster pour que 0° soit à droite (270° en coordonnées SVG)
  const startAngleRad = (startAngleDeg - 90) * (Math.PI / 180);
  const endAngleRad = (endAngleDeg - 90) * (Math.PI / 180);
  
  // Coordonnées des points de départ et d'arrivée
  const startX = centerX + radius * Math.cos(startAngleRad);
  const startY = centerY + radius * Math.sin(startAngleRad);
  const endX = centerX + radius * Math.cos(endAngleRad);
  const endY = centerY + radius * Math.sin(endAngleRad);
  
  // Flag pour grand arc (si angle > 180°)
  const largeArcFlag = endAngleDeg > 180 ? 1 : 0;

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 px-4 py-3 shadow-xl shadow-cyan-500/10 backdrop-blur-sm">
      <div className="text-xs text-cyan-300 mb-4 font-semibold tracking-wide flex items-center gap-2">
        <div className="w-1 h-4 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full"></div>
        Score de performance global
      </div>
      <LazyChart height={320}>
        <div className="flex flex-col items-center justify-center h-full py-2">
          {/* Jauge SVG avec texte intégré */}
          <div className="relative w-full max-w-sm mb-6" style={{ minHeight: '160px' }}>
            {/* Score au-dessus de la jauge */}
            <div className="flex flex-col items-center mb-3">
              <div className={`text-4xl font-bold bg-gradient-to-r ${scoreInfo.gradient} bg-clip-text text-transparent leading-none`}>
                {score}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">/ 100</div>
              <div className={`text-xs font-semibold mt-1.5`} style={{ color: scoreInfo.color }}>
                {scoreInfo.label}
              </div>
            </div>
            
            {/* Jauge SVG */}
            <svg width="100%" height="120" viewBox="0 0 256 120" className="overflow-visible" preserveAspectRatio="xMidYMid meet">
              {/* Fond complet (gris) - arc de 0° à 180° */}
              <path
                d={`M 20 100 A 88 88 0 0 1 236 100`}
                fill="none"
                stroke="#1e293b"
                strokeWidth="16"
                strokeLinecap="round"
                opacity={0.3}
              />
              
              {/* Barre de progression (colorée) */}
              {percentage > 0 && (
                <path
                  d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`}
                  fill="none"
                  stroke={scoreInfo.color}
                  strokeWidth="16"
                  strokeLinecap="round"
                  style={{ 
                    filter: `drop-shadow(0 0 8px ${scoreInfo.color}80)`,
                    transition: 'all 0.5s ease',
                  }}
                />
              )}
              
              {/* Aiguille */}
              {percentage > 0 && (
                <g transform={`rotate(${endAngleDeg - 90} ${centerX} ${centerY})`}>
                  <line
                    x1={centerX}
                    y1={centerY}
                    x2={centerX}
                    y2={centerY - radius + 12}
                    stroke={scoreInfo.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 4px ${scoreInfo.color})` }}
                  />
                  <circle
                    cx={centerX}
                    cy={centerY}
                    r="5"
                    fill={scoreInfo.color}
                    style={{ filter: `drop-shadow(0 0 6px ${scoreInfo.color})` }}
                  />
                </g>
              )}
            </svg>
          </div>

          {/* Détails du breakdown - mieux espacés */}
          <div className="grid grid-cols-2 gap-2.5 w-full max-w-xs">
            <div className="text-center p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="text-[10px] text-slate-400 mb-1.5">Complétion</div>
              <div className="text-base font-semibold text-emerald-400">
                {Math.round(breakdown.completion)}%
              </div>
            </div>
            <div className="text-center p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="text-[10px] text-slate-400 mb-1.5">Régularité</div>
              <div className="text-base font-semibold text-cyan-400">
                {Math.round(breakdown.regularity)}%
              </div>
            </div>
            <div className="text-center p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="text-[10px] text-slate-400 mb-1.5">Diversité</div>
              <div className="text-base font-semibold text-purple-400">
                {Math.round(breakdown.diversity)}%
              </div>
            </div>
            <div className="text-center p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="text-[10px] text-slate-400 mb-1.5">Progression</div>
              <div className="text-base font-semibold text-amber-400">
                {Math.round(breakdown.progression)}%
              </div>
            </div>
          </div>
        </div>
      </LazyChart>
    </div>
  );
};

export default PerformanceGaugeChart;

