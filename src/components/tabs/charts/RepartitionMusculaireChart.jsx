import React from 'react';
import { Target } from 'lucide-react';
import { findExerciseInDatabase } from '../../../data/exerciseDatabase';

const RepartitionMusculaireChart = ({ data, colors }) => {
  // Calculer les données réelles des groupes musculaires
  const calculateMuscleGroupData = () => {
    // Structure : data peut être { data: {...} } ou directement {...}
    const actualData = data?.data || data || {};
    const workoutHistory = data?.workoutHistory || [];
    const muscleGroups = {};
    
    // Fonction helper pour convertir en nombre valide
    const safeNumber = (value) => {
      if (typeof value === 'number' && !isNaN(value) && value > 0) return value;
      const parsed = parseInt(value);
      return (!isNaN(parsed) && parsed > 0) ? parsed : 0;
    };
    
    // 1. Compter les exercices normaux (exclure jumprope)
    workoutHistory.forEach(session => {
      session.exercises?.forEach(exercise => {
        // Exclure les exercices de type jumprope (jumps ne comptent pas comme reps)
        const isJumprope = (exercise.id || exercise.exerciseId || '').toString().includes('endurance_jumprope') ||
                          exercise.activityType === 'jumprope' ||
                          exercise.name?.toLowerCase().includes('corde');
        
        if (isJumprope) return; // Skip jumprope exercises
        
        const exerciseInfo = findExerciseInDatabase(exercise.name);
        if (exerciseInfo) {
          const category = exerciseInfo.category;
          const reps = safeNumber(exercise.reps);
          if (reps > 0) {
            muscleGroups[category] = (muscleGroups[category] || 0) + reps;
          }
        }
      });
    });
    
    // 2. Ajouter les activités complémentaires (Aujourd'hui + Endurance)
    const checkedExercises = actualData?.checkedExercises || {};
    const reps = actualData?.reps || {};
    let complementaryMinutes = 0;

    // a) Depuis l'onglet Aujourd'hui (cases cochées)
    Object.keys(checkedExercises).forEach(key => {
      if (!checkedExercises[key]) return;
      const dateMatch = key.match(/^(\d{4}-\d{2}-\d{2})/);
      if (!dateMatch) return;
      const dateStr = dateMatch[1];

      if (key.includes('complementary_natation')) {
        const minutesKey = `${dateStr}_complementary_natation_minutes`;
        complementaryMinutes += parseInt(reps[minutesKey]) || 90;
      }
      if (key.includes('complementary_boxe')) {
        const minutesKey = `${dateStr}_complementary_boxe_minutes`;
        complementaryMinutes += parseInt(reps[minutesKey]) || 90;
      }
      if (key.includes('complementary_corde')) {
        const minutesKey = `${dateStr}_complementary_corde_minutes`;
        complementaryMinutes += parseInt(reps[minutesKey]) || 20;
      }
    });

    // b) Depuis l'onglet Endurance (sessions détaillées)
    const enduranceData = actualData?.enduranceData || {};
    const swimming = enduranceData.sessions?.swimming || [];
    const boxing = enduranceData.sessions?.boxing || [];
    const jumpRope = enduranceData.sessions?.jumpRope || [];

    const toMinutes = (duration, totalTime) => {
      if (typeof duration === 'number' && duration > 0) return duration;
      if (typeof totalTime === 'number' && totalTime > 0) return totalTime / 60;
      const parsed = parseFloat(totalTime);
      return isNaN(parsed) ? 0 : parsed / 60;
    };

    swimming.forEach(s => complementaryMinutes += toMinutes(s.duration, s.totalTime));
    boxing.forEach(s => complementaryMinutes += toMinutes(s.duration, s.totalTime));
    jumpRope.forEach(s => complementaryMinutes += toMinutes(s.duration, s.totalTime));

    // Enregistrer toutes les activités complémentaires sous une même catégorie
    if (complementaryMinutes > 0) {
      muscleGroups['Activités Complémentaires'] = (muscleGroups['Activités Complémentaires'] || 0) + Math.round(complementaryMinutes);
    }
    
    // Convertir en tableau avec couleurs
    const colors = ['#8b5cf6', '#06b6d4', '#ec4899', '#6366f1', '#f59e0b', '#10b981', '#22c55e', '#eab308'];
    let colorIndex = 0;
    
    return Object.entries(muscleGroups)
      .map(([group, reps]) => {
        const safeReps = typeof reps === 'number' ? reps : parseInt(reps) || 0;
        return {
          name: group,
          reps: safeReps,
          percent: 0, // Sera calculé après
          color: colors[colorIndex++ % colors.length]
        };
      })
      .filter(group => group.reps > 0) // Exclure les groupes avec 0 reps
      .sort((a, b) => b.reps - a.reps);
  };

  const muscleGroups = calculateMuscleGroupData();
  const totalReps = muscleGroups.reduce((sum, group) => {
    const reps = typeof group.reps === 'number' ? group.reps : parseInt(group.reps) || 0;
    return sum + reps;
  }, 0);
  
  // Calculer les pourcentages
  muscleGroups.forEach(group => {
    group.percent = totalReps > 0 ? Math.round((group.reps / totalReps) * 100) : 0;
  });

  // Fonction utilitaire pour calculer les coordonnées SVG de manière sécurisée
  const getSafeCoordinates = (group, index, groups) => {
    const total = groups.reduce((sum, g) => {
      const percent = typeof g.percent === 'number' ? g.percent : parseFloat(g.percent) || 0;
      return sum + percent;
    }, 0);
    
    if (total === 0 || !total || isNaN(total)) {
      // Si aucun pourcentage, retourner coordonnées par défaut
      return {
        x1: 80,
        y1: 80,
        x2: 80,
        y2: 20,
        largeArc: 0,
        cx: 80,
        cy: 80
      };
    }
    
    const startAngle = groups
      .slice(0, index)
      .reduce((sum, g) => {
        const percent = typeof g.percent === 'number' ? g.percent : parseFloat(g.percent) || 0;
        return sum + (percent / total) * 360;
      }, 0);
    
    const groupPercent = typeof group.percent === 'number' ? group.percent : parseFloat(group.percent) || 0;
    const angle = (groupPercent / total) * 360;
    const radius = 60;
    const cx = 80;
    const cy = 80;
    
    const x1 = cx + radius * Math.cos((startAngle * Math.PI) / 180);
    const y1 = cy + radius * Math.sin((startAngle * Math.PI) / 180);
    const x2 = cx + radius * Math.cos(((startAngle + angle) * Math.PI) / 180);
    const y2 = cy + radius * Math.sin(((startAngle + angle) * Math.PI) / 180);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    return {
      x1: isNaN(x1) ? cx : x1,
      y1: isNaN(y1) ? cy : y1,
      x2: isNaN(x2) ? cx : x2,
      y2: isNaN(y2) ? cy : y2,
      largeArc,
      cx: isNaN(cx) ? 80 : cx,
      cy: isNaN(cy) ? 80 : cy
    };
  };

  if (muscleGroups.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400">
        <div className="text-center">
          <Target className="mx-auto mb-4 text-slate-500" size={48} />
          <p className="text-lg font-medium">Aucune donnée musculaire</p>
          <p className="text-sm text-slate-500 mt-2">Commencez vos entraînements pour voir la répartition</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center h-48">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full transform -rotate-90">
            {muscleGroups.map((group, idx) => {
              const coords = getSafeCoordinates(group, idx, muscleGroups);
              
              return (
                <path
                  key={idx}
                  d={`M ${coords.cx} ${coords.cy} L ${coords.x1} ${coords.y1} A ${60} ${60} 0 ${coords.largeArc} 1 ${coords.x2} ${coords.y2} Z`}
                  fill={group.color}
                  opacity="0.8"
                  className="hover:opacity-100 transition-opacity duration-300"
                  style={{ filter: `drop-shadow(0 0 8px ${group.color}80)` }}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {typeof totalReps === 'number' ? totalReps.toLocaleString() : '0'}
              </div>
              <div className="text-xs text-slate-400">reps</div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
        {muscleGroups.map((group, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: group.color }}
              />
              <span className="text-slate-300">{group.name}</span>
            </div>
            <span className="text-slate-400">{group.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RepartitionMusculaireChart;
