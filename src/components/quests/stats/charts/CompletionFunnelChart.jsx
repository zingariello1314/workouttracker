/**
 * Composant CompletionFunnelChart - Funnel de complétion
 * Visualise le taux de conversion à chaque étape du processus
 */

import React, { useMemo } from 'react';
import LazyChart from '../../../BodyTracking/components/LazyChart';
import { qstatsPanel, qstatsHeaderRow, qstatsAccentBar } from '../questsStatsTheme';

const CompletionFunnelChart = ({ allQuests, validations }) => {
  const funnelData = useMemo(() => {
    if (!allQuests || !validations) return [];

    const totalQuests = allQuests.filter(q => q.active !== false).length;
    
    // Étape 1 : Quêtes disponibles
    const available = totalQuests;

    // Étape 2 : Quêtes commencées (au moins 1 validation)
    const questsWithValidations = new Set(validations.map(v => v.queteId));
    const started = questsWithValidations.size;

    // Étape 3 : Quêtes complétées régulièrement (>50% du temps)
    const questValidationCounts = new Map();
    validations.forEach(v => {
      const count = questValidationCounts.get(v.queteId) || 0;
      questValidationCounts.set(v.queteId, count + 1);
    });

    // Compter les jours uniques avec validations
    const uniqueDates = new Set(validations.map(v => v.date));
    const totalDays = uniqueDates.size || 1;

    const regular = Array.from(questValidationCounts.entries()).filter(([questId, count]) => {
      const quest = allQuests.find(q => q.id === questId);
      if (!quest) return false;
      // Si récurrente, vérifier combien de fois elle devrait apparaître
      if (quest.type === 'recurrente' && Array.isArray(quest.jours)) {
        const expectedOccurrences = (totalDays / 7) * quest.jours.length;
        return count >= expectedOccurrences * 0.5;
      }
      // Pour exceptionnelles, considérer comme régulière si validée
      return count > 0;
    }).length;

    // Étape 4 : Quêtes maîtrisées (>80% du temps)
    const mastered = Array.from(questValidationCounts.entries()).filter(([questId, count]) => {
      const quest = allQuests.find(q => q.id === questId);
      if (!quest) return false;
      if (quest.type === 'recurrente' && Array.isArray(quest.jours)) {
        const expectedOccurrences = (totalDays / 7) * quest.jours.length;
        return count >= expectedOccurrences * 0.8;
      }
      return count > 0;
    }).length;

    return [
      {
        step: 'Disponibles',
        count: available,
        percentage: 100,
        color: '#451a03',
        gradient: 'from-amber-950 to-amber-900',
      },
      {
        step: 'Commençées',
        count: started,
        percentage: available > 0 ? Math.round((started / available) * 100) : 0,
        color: '#92400e',
        gradient: 'from-amber-900 to-amber-800',
      },
      {
        step: 'Régulières',
        count: regular,
        percentage: available > 0 ? Math.round((regular / available) * 100) : 0,
        color: '#d97706',
        gradient: 'from-amber-700 to-amber-600',
      },
      {
        step: 'Maîtrisées',
        count: mastered,
        percentage: available > 0 ? Math.round((mastered / available) * 100) : 0,
        color: '#fbbf24',
        gradient: 'from-amber-500 to-yellow-400',
      },
    ];
  }, [allQuests, validations]);

  if (funnelData.length === 0 || funnelData[0].count === 0) return null;

  // Trouver le max pour normaliser les largeurs
  const maxCount = Math.max(...funnelData.map(d => d.count), 1);

  return (
    <div className={qstatsPanel}>
      <div className={qstatsHeaderRow}>
        <div className={qstatsAccentBar} />
        Funnel de complétion des quêtes
      </div>
      <LazyChart height={350}>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          {funnelData.map((step, index) => {
            const width = (step.count / maxCount) * 100;
            const isFirst = index === 0;
            const isLast = index === funnelData.length - 1;
            const loss = index > 0 ? funnelData[index - 1].percentage - step.percentage : 0;
            
            // Gradients améliorés pour chaque étape
            const gradients = {
              'Disponibles': 'linear-gradient(135deg, #451a03 0%, #78350f 50%, #92400e 100%)',
              'Commençées': 'linear-gradient(135deg, #78350f 0%, #92400e 50%, #b45309 100%)',
              'Régulières': 'linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%)',
              'Maîtrisées': 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #fde68a 100%)',
            };
            
            return (
              <div
                key={index}
                className="relative w-full flex items-center justify-center group"
              >
                {/* Ombre portée */}
                <div
                  className="absolute rounded-xl"
                  style={{
                    width: `${Math.max(width, 15)}%`,
                    minWidth: '140px',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    transform: 'translateY(4px)',
                    filter: 'blur(4px)',
                    opacity: 0.6,
                  }}
                />
                
                {/* Barre du funnel améliorée */}
                <div
                  className={`relative rounded-xl border-2 transition-all duration-300 group-hover:scale-[1.03] ${
                    isFirst ? 'rounded-t-xl' : ''
                  } ${isLast ? 'rounded-b-xl' : ''}`}
                  style={{
                    width: `${Math.max(width, 15)}%`,
                    minWidth: '140px',
                    background: gradients[step.step] || `linear-gradient(135deg, ${step.color} 0%, ${step.color}dd 100%)`,
                    borderColor: `${step.color}90`,
                    borderWidth: '2.5px',
                    boxShadow: `0 0 20px ${step.color}60, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.1)`,
                  }}
                >
                  {/* Overlay pour effet de profondeur */}
                  <div 
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.2) 0%, transparent 50%)',
                    }}
                  />
                  
                  <div className="relative p-5 text-center z-10">
                    <div 
                      className="text-sm font-bold text-white mb-2 uppercase tracking-wider"
                      style={{
                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.6), 0 0 4px rgba(255, 255, 255, 0.3)',
                      }}
                    >
                      {step.step}
                    </div>
                    <div 
                      className="text-3xl font-extrabold text-white mb-2"
                      style={{
                        textShadow: `0 0 16px ${step.color}80, 0 2px 8px rgba(0, 0, 0, 0.7)`,
                      }}
                    >
                      {step.count}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div 
                        className="text-xs font-semibold text-white/95"
                        style={{
                          textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)',
                        }}
                      >
                        {step.percentage}%
                      </div>
                      {index > 0 && loss > 0 && (
                        <>
                          <span className="text-white/60">•</span>
                          <div 
                            className="text-[10px] font-medium text-amber-900"
                            style={{
                              textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
                            }}
                          >
                            -{loss}%
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Indicateur de conversion amélioré */}
                  {index < funnelData.length - 1 && (
                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 z-20">
                      <div className="relative">
                        {/* Flèche principale */}
                        <div
                          className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] transition-all duration-300 group-hover:border-t-[18px]"
                          style={{
                            borderLeftColor: 'transparent',
                            borderRightColor: 'transparent',
                            borderTopColor: step.color,
                            filter: `drop-shadow(0 0 8px ${step.color}80)`,
                          }}
                        />
                        {/* Glow autour de la flèche */}
                        <div
                          className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[18px] opacity-30"
                          style={{
                            borderLeftColor: 'transparent',
                            borderRightColor: 'transparent',
                            borderTopColor: step.color,
                            filter: 'blur(4px)',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </LazyChart>
    </div>
  );
};

export default CompletionFunnelChart;

