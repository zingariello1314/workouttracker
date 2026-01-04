/**
 * Composant QuestSunburstChart - Hiérarchie complète des quêtes
 * Visualise la hiérarchie : Total → Catégories → Difficultés → Quêtes
 */

import React, { useMemo, useState } from 'react';
import LazyChart from '../../../BodyTracking/components/LazyChart';

const QuestSunburstChart = ({ allQuests, validations }) => {
  const [hoveredSegment, setHoveredSegment] = useState(null);

  const sunburstData = useMemo(() => {
    if (!allQuests || !validations || allQuests.length === 0) return null;

    // Compter validations par quête
    const questValidationCounts = new Map();
    validations.forEach(v => {
      const count = questValidationCounts.get(v.queteId) || 0;
      questValidationCounts.set(v.queteId, count + 1);
    });

    // Grouper par catégorie
    const categoryMap = new Map();
    
    allQuests.forEach(quest => {
      if (quest.active === false) return;
      
      const category = quest.categorie || 'Autre';
      const difficulty = quest.difficulte || 1;
      const validationsCount = questValidationCounts.get(quest.id) || 0;

      if (!categoryMap.has(category)) {
        categoryMap.set(category, new Map());
      }

      const difficultyMap = categoryMap.get(category);
      if (!difficultyMap.has(difficulty)) {
        difficultyMap.set(difficulty, []);
      }

      difficultyMap.get(difficulty).push({
        id: quest.id,
        nom: quest.nom,
        validationsCount,
      });
    });

    // Calculer le total
    const total = Array.from(questValidationCounts.values()).reduce((sum, count) => sum + count, 0);

    return {
      total,
      categories: Array.from(categoryMap.entries()).map(([category, difficultyMap]) => {
        const categoryTotal = Array.from(difficultyMap.values())
          .flat()
          .reduce((sum, q) => sum + q.validationsCount, 0);

        return {
          name: category,
          value: categoryTotal,
          difficulties: Array.from(difficultyMap.entries()).map(([difficulty, quests]) => {
            const difficultyTotal = quests.reduce((sum, q) => sum + q.validationsCount, 0);
            
            return {
              difficulty,
              value: difficultyTotal,
              quests: quests.map(q => ({
                ...q,
                value: q.validationsCount,
              })),
            };
          }),
        };
      }),
    };
  }, [allQuests, validations]);

  if (!sunburstData || sunburstData.total === 0) return null;

  // Couleurs par catégorie
  const categoryColors = {
    'Santé': '#10b981',
    'Travail': '#3b82f6',
    'Apprentissage': '#8b5cf6',
    'Lecture': '#ec4899',
    'Sport': '#f59e0b',
    'Ménage': '#06b6d4',
    'Spirituel': '#6366f1',
    'Repas': '#f97316',
    'Projets': '#14b8a6',
    'Hobby': '#a855f7',
    'Social': '#ef4444',
    'Finance': '#22c55e',
    'Créativité': '#eab308',
    'Bien-être': '#06b6d4',
  };

  const difficultyColors = {
    1: '#34d399', // Facile - vert clair
    2: '#22d3ee', // Moyen - cyan
    3: '#fbbf24', // Difficile - amber
    4: '#f87171', // Épique - rouge
  };

  // Calculer les angles pour chaque niveau avec meilleures proportions
  const centerX = 200;
  const centerY = 200;
  const radiusLevel1 = 50;   // Total (centre) - plus grand
  const radiusLevel2 = 120;   // Catégories - plus large
  const radiusLevel3 = 150;   // Difficultés (réservé pour futur)
  const radiusLevel4 = 180;   // Quêtes (réservé pour futur)

  let currentAngle = -90; // Commencer en haut

  return (
    <div className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 px-4 py-3 shadow-xl shadow-rose-500/10 backdrop-blur-sm">
      <div className="text-xs text-rose-300 mb-3 font-semibold tracking-wide flex items-center gap-2">
        <div className="w-1 h-4 bg-gradient-to-b from-rose-400 to-pink-500 rounded-full"></div>
        Hiérarchie complète des quêtes
      </div>
      <LazyChart height={450}>
        <div className="relative w-full flex items-center justify-center" style={{ minHeight: '450px' }}>
          <svg width="400" height="400" viewBox="0 0 400 400" className="overflow-visible">
            <defs>
              {/* Gradient pour le centre */}
              <radialGradient id="totalGradient" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                <stop offset="70%" stopColor="#a78bfa" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#ec4899" stopOpacity={0.7} />
              </radialGradient>
              
              {/* Gradients pour chaque catégorie */}
              {sunburstData.categories.map((category) => {
                const color = categoryColors[category.name] || '#9ca3af';
                return (
                  <linearGradient key={`catGrad-${category.name}`} id={`catGrad-${category.name}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                    <stop offset="50%" stopColor={color} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                  </linearGradient>
                );
              })}
            </defs>
            
            {/* Niveau 1 : Total (cercle central) - amélioré */}
            <g>
              {/* Ombre portée */}
              <circle
                cx={centerX + 2}
                cy={centerY + 2}
                r={radiusLevel1}
                fill="rgba(0, 0, 0, 0.4)"
                opacity={0.5}
              />
              {/* Cercle principal */}
              <circle
                cx={centerX}
                cy={centerY}
                r={radiusLevel1}
                fill="url(#totalGradient)"
                stroke="#fff"
                strokeWidth="2.5"
                style={{
                  filter: 'drop-shadow(0 0 16px rgba(139, 92, 246, 1))',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  setHoveredSegment({ level: 0, name: 'Total', value: sunburstData.total });
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  setHoveredSegment(null);
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              />
              {/* Texte Total */}
              <text
                x={centerX}
                y={centerY - 8}
                textAnchor="middle"
                fill="#fff"
                fontSize="16"
                fontWeight="bold"
                style={{ textShadow: '0 0 8px rgba(139, 92, 246, 0.8)' }}
              >
                Total
              </text>
              {/* Valeur */}
              <text
                x={centerX}
                y={centerY + 12}
                textAnchor="middle"
                fill="#c084fc"
                fontSize="18"
                fontWeight="700"
                style={{ textShadow: '0 0 6px rgba(192, 132, 252, 0.6)' }}
              >
                {sunburstData.total}
              </text>
            </g>

            {/* Niveau 2 : Catégories - amélioré */}
            {sunburstData.categories.map((category, catIndex) => {
              const angle = (category.value / sunburstData.total) * 360;
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              currentAngle = endAngle;

              const startAngleRad = (startAngle * Math.PI) / 180;
              const endAngleRad = (endAngle * Math.PI) / 180;
              const midAngle = (startAngle + angle / 2) * Math.PI / 180;

              const x1 = centerX + radiusLevel1 * Math.cos(startAngleRad);
              const y1 = centerY + radiusLevel1 * Math.sin(startAngleRad);
              const x2 = centerX + radiusLevel2 * Math.cos(startAngleRad);
              const y2 = centerY + radiusLevel2 * Math.sin(startAngleRad);
              const x3 = centerX + radiusLevel2 * Math.cos(endAngleRad);
              const y3 = centerY + radiusLevel2 * Math.sin(endAngleRad);
              const x4 = centerX + radiusLevel1 * Math.cos(endAngleRad);
              const y4 = centerY + radiusLevel1 * Math.sin(endAngleRad);

              const largeArcFlag = angle > 180 ? 1 : 0;
              const color = categoryColors[category.name] || '#9ca3af';
              const gradientId = `catGrad-${category.name}`;

              return (
                <g key={category.name}>
                  {/* Ombre portée */}
                  <path
                    d={`M ${x1 + 2} ${y1 + 2} L ${x2 + 2} ${y2 + 2} A ${radiusLevel2} ${radiusLevel2} 0 ${largeArcFlag} 1 ${x3 + 2} ${y3 + 2} L ${x4 + 2} ${y4 + 2} A ${radiusLevel1} ${radiusLevel1} 0 ${largeArcFlag} 0 ${x1 + 2} ${y1 + 2} Z`}
                    fill="rgba(0, 0, 0, 0.3)"
                    opacity={0.4}
                  />
                  
                  {/* Segment principal avec gradient */}
                  <path
                    d={`M ${x1} ${y1} L ${x2} ${y2} A ${radiusLevel2} ${radiusLevel2} 0 ${largeArcFlag} 1 ${x3} ${y3} L ${x4} ${y4} A ${radiusLevel1} ${radiusLevel1} 0 ${largeArcFlag} 0 ${x1} ${y1} Z`}
                    fill={`url(#${gradientId})`}
                    stroke="#fff"
                    strokeWidth="2"
                    style={{
                      filter: `drop-shadow(0 0 10px ${color}80)`,
                      cursor: 'pointer',
                      transition: 'opacity 0.2s ease, filter 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      setHoveredSegment({ level: 1, name: category.name, value: category.value });
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.filter = `drop-shadow(0 0 16px ${color})`;
                    }}
                    onMouseLeave={(e) => {
                      setHoveredSegment(null);
                      e.currentTarget.style.opacity = '0.85';
                      e.currentTarget.style.filter = `drop-shadow(0 0 10px ${color}80)`;
                    }}
                  />
                  
                  {/* Label catégorie - amélioré */}
                  {angle > 20 && (
                    <g>
                      <text
                        x={centerX + (radiusLevel1 + radiusLevel2) / 2 * Math.cos(midAngle)}
                        y={centerY + (radiusLevel1 + radiusLevel2) / 2 * Math.sin(midAngle) - 4}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize="12"
                        fontWeight="600"
                        dominantBaseline="middle"
                        style={{ textShadow: `0 0 8px ${color}80` }}
                      >
                        {category.name}
                      </text>
                      <text
                        x={centerX + (radiusLevel1 + radiusLevel2) / 2 * Math.cos(midAngle)}
                        y={centerY + (radiusLevel1 + radiusLevel2) / 2 * Math.sin(midAngle) + 10}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize="10"
                        fontWeight="500"
                        opacity={0.9}
                        dominantBaseline="middle"
                        style={{ textShadow: `0 0 6px ${color}60` }}
                      >
                        {category.value}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Tooltip amélioré */}
          {hoveredSegment && (
            <div
              className="absolute bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border rounded-lg p-4 shadow-2xl backdrop-blur-sm z-20"
              style={{
                borderColor: hoveredSegment.level === 0 
                  ? '#8b5cf6' 
                  : categoryColors[hoveredSegment.name] || '#8b5cf6',
                top: '10px',
                right: '10px',
                maxWidth: '220px',
                boxShadow: `0 0 20px ${hoveredSegment.level === 0 ? 'rgba(139, 92, 246, 0.4)' : `${categoryColors[hoveredSegment.name] || '#8b5cf6'}40`}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: hoveredSegment.level === 0 
                      ? '#8b5cf6' 
                      : categoryColors[hoveredSegment.name] || '#8b5cf6',
                    boxShadow: `0 0 8px ${hoveredSegment.level === 0 ? '#8b5cf6' : categoryColors[hoveredSegment.name] || '#8b5cf6'}`,
                  }}
                />
                <p 
                  className="font-semibold text-sm tracking-wide"
                  style={{
                    color: hoveredSegment.level === 0 
                      ? '#c084fc' 
                      : categoryColors[hoveredSegment.name] || '#c084fc',
                  }}
                >
                  {hoveredSegment.name}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm text-slate-300">
                  <span className="text-slate-400">Validations:</span>{' '}
                  <span className="font-bold text-cyan-400">{hoveredSegment.value}</span>
                </p>
                {hoveredSegment.level === 1 && (
                  <p className="text-xs text-slate-400">
                    {Math.round((hoveredSegment.value / sunburstData.total) * 100)}% du total
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </LazyChart>
    </div>
  );
};

export default QuestSunburstChart;

