/**
 * Timeline3Ans - Timeline interactive avec vues multiples (3 mois, 6 mois, 12 mois, 3 ans)
 */

import React, { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../utils/translations';

const Timeline3Ans = ({ 
  objectifs = [], 
  chargesFixes = null, 
  budgetLoisirs = 0,
  onObjectifClick 
}) => {
  const t = useTranslation();
  const [timelineView, setTimelineView] = useState('12-mois'); // 3-mois, 6-mois, 12-mois, 3-ans
  const [startMonth, setStartMonth] = useState(0); // Offset en mois depuis aujourd'hui

  const timelineOptions = [
    { id: '3-mois', label: '3 mois', months: 3 },
    { id: '6-mois', label: '6 mois', months: 6 },
    { id: '12-mois', label: '12 mois', months: 12 },
    { id: '3-ans', label: '3 ans', months: 36 }
  ];

  const currentOption = timelineOptions.find(opt => opt.id === timelineView);

  // Générer les mois à afficher
  const months = useMemo(() => {
    const result = [];
    const today = new Date();
    
    for (let i = startMonth; i < startMonth + currentOption.months; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      result.push({
        date,
        label: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        isCurrentMonth: i === 0
      });
    }
    
    return result;
  }, [startMonth, currentOption]);

  // Calculer budget disponible cumulé
  const budgetCumule = useMemo(() => {
    return months.map((month, index) => ({
      ...month,
      budgetDisponible: budgetLoisirs * (index + 1)
    }));
  }, [months, budgetLoisirs]);

  // Grouper objectifs par mois
  const objectifsParMois = useMemo(() => {
    const grouped = {};
    
    objectifs.forEach(obj => {
      const moisKey = obj.moisCible || obj.date?.substring(0, 7);
      if (!grouped[moisKey]) {
        grouped[moisKey] = [];
      }
      grouped[moisKey].push(obj);
    });
    
    return grouped;
  }, [objectifs]);

  // Navigation
  const handlePrevious = () => {
    setStartMonth(Math.max(0, startMonth - currentOption.months));
  };

  const handleNext = () => {
    setStartMonth(startMonth + currentOption.months);
  };

  const canGoPrevious = startMonth > 0;

  return (
    <div className="timeline-3ans bg-slate-800/50 rounded-lg p-6">
      {/* Header avec sélection vue */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar size={24} className="text-blue-400" />
          {t('finance.planificateur.3ans.timeline')}
        </h3>
        
        <div className="flex gap-2">
          {timelineOptions.map(option => (
            <button
              key={option.id}
              onClick={() => {
                setTimelineView(option.id);
                setStartMonth(0); // Reset au début
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timelineView === option.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation timeline */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          className={`p-2 rounded-lg transition-all ${
            canGoPrevious
              ? 'bg-slate-700 text-white hover:bg-slate-600'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className="text-slate-300 text-sm">
          {months[0]?.label} - {months[months.length - 1]?.label}
        </div>
        
        <button
          onClick={handleNext}
          className="p-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-all"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Timeline grid */}
      <div className="timeline-grid overflow-x-auto">
        <div className="flex gap-2 min-w-full pb-4">
          {budgetCumule.map((month, index) => {
            const objectifsDuMois = objectifsParMois[month.key] || [];
            const totalObjectifs = objectifsDuMois.reduce((sum, obj) => sum + (obj.montant || 0), 0);
            const budgetSuffisant = month.budgetDisponible >= totalObjectifs;
            
            return (
              <div
                key={month.key}
                className={`timeline-month flex-1 min-w-[120px] bg-slate-700/50 rounded-lg p-3 border-2 transition-all ${
                  month.isCurrentMonth
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
              >
                {/* Mois */}
                <div className="text-center mb-3">
                  <div className={`text-sm font-semibold ${
                    month.isCurrentMonth ? 'text-blue-300' : 'text-slate-300'
                  }`}>
                    {month.label}
                  </div>
                  {month.isCurrentMonth && (
                    <div className="text-xs text-blue-400 mt-1">Aujourd'hui</div>
                  )}
                </div>

                {/* Budget disponible */}
                <div className="bg-slate-800/50 rounded p-2 mb-3">
                  <div className="text-xs text-slate-400 mb-1">Budget cumulé</div>
                  <div className="text-sm font-bold text-emerald-400">
                    {month.budgetDisponible.toLocaleString('fr-FR')}€
                  </div>
                </div>

                {/* Objectifs du mois */}
                {objectifsDuMois.length > 0 && (
                  <div className="space-y-2">
                    {objectifsDuMois.map(obj => (
                      <div
                        key={obj.id}
                        onClick={() => onObjectifClick?.(obj)}
                        className={`p-2 rounded cursor-pointer transition-all ${
                          budgetSuffisant
                            ? 'bg-emerald-900/30 border border-emerald-500/50 hover:bg-emerald-900/50'
                            : 'bg-red-900/30 border border-red-500/50 hover:bg-red-900/50'
                        }`}
                      >
                        <div className="text-xs font-medium text-white truncate">
                          {obj.titre || obj.nom}
                        </div>
                        <div className={`text-xs font-bold ${
                          budgetSuffisant ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {(obj.montant || 0).toLocaleString('fr-FR')}€
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Indicateur si pas d'objectifs */}
                {objectifsDuMois.length === 0 && (
                  <div className="text-center text-xs text-slate-500 py-2">
                    Aucun objectif
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-500/50 rounded"></div>
          <span>Budget suffisant</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500/50 rounded"></div>
          <span>Budget insuffisant</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500/50 rounded"></div>
          <span>Mois actuel</span>
        </div>
      </div>
    </div>
  );
};

export default Timeline3Ans;
