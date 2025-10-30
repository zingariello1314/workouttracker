import React from 'react';
import { Target } from 'lucide-react';
import { workoutProgram } from '../../../data/workoutProgram';

const ObjectifsPerformanceChart = ({ data, colors }) => {
  // Récupérer le programme actif depuis les données
  const activeProgram = data?.activeProgram || null;
  
  // Fonctions utilitaires
  const getPeriodDays = (period) => {
    switch (period) {
      case '7days': return 7;
      case '30days': return 30;
      case '90days': return 90;
      case '1year': return 365;
      default: return 30;
    }
  };
  
  const convertActiveProgramToFormat = (activeProgram) => {
    const convertedProgram = {};
    Object.entries(activeProgram.schedule).forEach(([day, dayData]) => {
      convertedProgram[day.toLowerCase()] = {
        exercices: dayData.exercises || [],
        salleVariants: dayData.salleVariants ? {
          semaineA: { exercices: dayData.salleVariants.semaineA?.exercises || [] },
          semaineB: { exercices: dayData.salleVariants.semaineB?.exercises || [] }
        } : undefined
      };
    });
    return convertedProgram;
  };
  
  const calculateWeeklyRepsFromProgram = (program) => {
    let totalWeeklyReps = 0;
    
    // Parcourir tous les jours de la semaine
    const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    
      days.forEach(day => {
        const dayProgram = program[day];
        if (dayProgram && dayProgram.exercices) {
          dayProgram.exercices.forEach(exercise => {
            // Parser les series (format: "4×4-6", "3×12", "30 sec", "1 min", "20×")
            const seriesText = exercise.series || '0';
            
            // Format 1: "4×4-6" ou "3×12"
            const repsMatch = seriesText.match(/(\d+)×(\d+)(?:-(\d+))?/);
            if (repsMatch) {
              const sets = parseInt(repsMatch[1]);
              const minReps = parseInt(repsMatch[2]);
              const maxReps = parseInt(repsMatch[3]) || minReps;
              const avgReps = (minReps + maxReps) / 2;
              const totalReps = sets * avgReps;
              totalWeeklyReps += totalReps;
              return;
            }
            
            // Format 2: "20×" (répétitions simples)
            const simpleRepsMatch = seriesText.match(/(\d+)×$/);
            if (simpleRepsMatch) {
              const reps = parseInt(simpleRepsMatch[1]);
              totalWeeklyReps += reps;
              return;
            }
            
            // Format 3: "30 sec", "1 min" (temps - compter comme 1 rep)
            const timeMatch = seriesText.match(/(\d+)\s*(sec|min)/);
            if (timeMatch) {
              totalWeeklyReps += 1; // Compter comme 1 "rep" pour le temps
              return;
            }
            
            // Format 4: "5 cycles" (cycles - compter comme 1 rep)
            const cycleMatch = seriesText.match(/(\d+)\s*cycles/);
            if (cycleMatch) {
              totalWeeklyReps += 1; // Compter comme 1 "rep" pour les cycles
              return;
            }
            
            // Format 5: "12-15" ou "10-12 par bras" (répétitions simples)
            const simpleRangeMatch = seriesText.match(/(\d+)-(\d+)/);
            if (simpleRangeMatch) {
              const minReps = parseInt(simpleRangeMatch[1]);
              const maxReps = parseInt(simpleRangeMatch[2]);
              const avgReps = (minReps + maxReps) / 2;
              totalWeeklyReps += avgReps;
              return;
            }
            
            // Format 6: "15" (répétitions simples sans plage)
            const simpleNumberMatch = seriesText.match(/^(\d+)$/);
            if (simpleNumberMatch) {
              const reps = parseInt(simpleNumberMatch[1]);
              totalWeeklyReps += reps;
              return;
            }
          });
        }
      });
    return totalWeeklyReps;
  };
  
  // Calculer les données réelles à partir de l'historique et des métriques
  const calculateObjectivesData = () => {
    const workoutHistory = data.workoutHistory || [];
    const progressEntries = data.data?.progressEntries || [];
    const selectedPeriod = data.selectedPeriod || '30days';
    
    // 1. REPS/SEMAINE - Calcul basé sur le programme actif et la période sélectionnée
    const calculateRepsObjective = () => {
      // Obtenir le programme actif ou par défaut
      const program = activeProgram?.schedule ? 
        convertActiveProgramToFormat(activeProgram) : 
        workoutProgram;
      
      // Calculer la durée de la période en jours
      const periodDays = getPeriodDays(selectedPeriod);
      const periodWeeks = Math.ceil(periodDays / 7);
      
      // Calculer les reps prévues par semaine dans le programme
      const weeklyReps = calculateWeeklyRepsFromProgram(program);
      
      // Calculer les reps prévues pour la période
      const plannedReps = weeklyReps * periodWeeks;
      
      // Calculer les reps réalisées (hors corde à sauter)
      const isJumpRope = (name = '') => {
        const n = String(name).toLowerCase();
        return n.includes('corde') || n.includes('jump') || n.includes('jumprope');
      };
      const actualReps = workoutHistory.reduce((sum, session) => {
        const reps = (session.exercises || [])
          .filter(ex => !isJumpRope(ex.name))
          .reduce((s, ex) => s + (parseInt(ex.reps) || 0), 0);
        return sum + reps;
      }, 0);
      
      // Debug optionnel (décommentez pour diagnostiquer)
      // console.log('🔍 DEBUG ObjectifsPerformanceChart:');
      // console.log(`  - Période: ${selectedPeriod} (${periodDays} jours)`);
      // console.log(`  - Sessions dans l'historique: ${workoutHistory.length}`);
      // console.log(`  - Reps réalisées: ${actualReps}`);
      // console.log(`  - Programme actif: ${activeProgram ? 'Présent' : 'Absent'}`);
      // console.log(`  - Programme utilisé: ${program ? 'OK' : 'ERREUR'}`);
      // console.log(`  - Reps/semaine du programme: ${weeklyReps}`);
      // console.log(`  - Reps prévues pour la période: ${plannedReps}`);
      
      // Objectif basé sur les reps prévues
      const targetReps = plannedReps;
      const currentRepsPerWeek = periodWeeks > 0 ? actualReps / periodWeeks : 0;
      
      // Calcul de progression correct
      const progress = plannedReps > 0 ? Math.min(100, (actualReps / plannedReps) * 100) : 0;
      
      return {
        current: Math.round(currentRepsPerWeek),
        target: Math.round(weeklyReps),
        actualReps,
        plannedReps,
        progress: progress
      };
    };
    
    // 2. POIDS et TOUR DE TAILLE - Vérifier la liaison avec les métriques
    const calculateMetricsObjectives = () => {
      // Récupérer les dernières métriques
      const latestMetrics = progressEntries
        .filter(entry => entry.type === 'metrics')
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      
      // Récupérer les premières métriques pour calculer les objectifs
      const firstMetrics = progressEntries
        .filter(entry => entry.type === 'metrics')
        .sort((a, b) => new Date(a.date) - new Date(a.date))
        .slice(-1)[0]; // Première entrée (la plus ancienne)
      
      // Si pas de métriques, afficher un message
      if (!latestMetrics) {
        return {
          weight: { hasData: false, message: 'Aucune donnée de poids enregistrée' },
          waist: { hasData: false, message: 'Aucune donnée de tour de taille enregistrée' }
        };
      }
      
      const currentWeight = latestMetrics.weight;
      const currentWaist = latestMetrics.measurements?.waist;
      const firstWeight = firstMetrics?.weight || currentWeight;
      const firstWaist = firstMetrics?.measurements?.waist || currentWaist;
      
      // Objectifs réalistes (5% de réduction)
      const targetWeight = Math.max(60, Math.round(firstWeight * 0.95));
      const targetWaist = Math.max(70, Math.round(firstWaist * 0.95));
      
      // Calculer les progressions
      const weightProgress = firstWeight > targetWeight ? 
        Math.max(0, Math.min(100, ((firstWeight - currentWeight) / (firstWeight - targetWeight)) * 100)) : 0;
      const waistProgress = firstWaist > targetWaist ? 
        Math.max(0, Math.min(100, ((firstWaist - currentWaist) / (firstWaist - targetWaist)) * 100)) : 0;
      
      return {
        weight: {
          hasData: true,
          current: currentWeight,
          target: targetWeight,
          firstValue: firstWeight,
          progress: weightProgress,
          achieved: currentWeight <= targetWeight
        },
        waist: {
          hasData: true,
          current: currentWaist,
          target: targetWaist,
          firstValue: firstWaist,
          progress: waistProgress,
          achieved: currentWaist <= targetWaist
        }
      };
    };
    
    // Calculer les objectifs
    const repsObjective = calculateRepsObjective();
    const metricsObjectives = calculateMetricsObjectives();
    
    // Construire le tableau des objectifs
    const getRepsLabel = (period) => {
      switch (period) {
        case '7days': return 'Reps/semaine';
        case '30days': return 'Reps/30 jours';
        case '90days': return 'Reps/90 jours';
        case '1year': return 'Reps/année';
        default: return 'Reps/semaine';
      }
    };
    
    const objectives = [
      {
        name: getRepsLabel(selectedPeriod),
        current: repsObjective.actualReps, // Afficher les reps totales réalisées
        target: repsObjective.plannedReps, // Afficher les reps totales prévues
        unit: 'reps',
        achieved: repsObjective.progress >= 100,
        progress: repsObjective.progress,
        hasData: true
      },
      {
        name: 'Poids',
        current: metricsObjectives.weight.hasData ? metricsObjectives.weight.current : 0,
        target: metricsObjectives.weight.hasData ? metricsObjectives.weight.target : 0,
        unit: 'kg',
        achieved: metricsObjectives.weight.hasData ? metricsObjectives.weight.achieved : false,
        progress: metricsObjectives.weight.hasData ? metricsObjectives.weight.progress : 0,
        hasData: metricsObjectives.weight.hasData,
        message: metricsObjectives.weight.message
      },
      {
        name: 'Tour de taille',
        current: metricsObjectives.waist.hasData ? metricsObjectives.waist.current : 0,
        target: metricsObjectives.waist.hasData ? metricsObjectives.waist.target : 0,
        unit: 'cm',
        achieved: metricsObjectives.waist.hasData ? metricsObjectives.waist.achieved : false,
        progress: metricsObjectives.waist.hasData ? metricsObjectives.waist.progress : 0,
        hasData: metricsObjectives.waist.hasData,
        message: metricsObjectives.waist.message
      }
    ];
    
    return objectives;
  };

  const objectives = calculateObjectivesData();

  return (
    <div className="space-y-4">
      {objectives.map((obj, idx) => {
        // Si pas de données, afficher un message
        if (!obj.hasData) {
          return (
            <div 
              key={idx}
              className="bg-slate-800/50 rounded-lg p-4 border border-gray-600/20"
            >
              <div className="text-xs text-slate-400 mb-2">{obj.name.toUpperCase()}</div>
              <div className="text-sm text-gray-400 flex items-center gap-2">
                <span>⚠️</span>
                <span>{obj.message}</span>
              </div>
            </div>
          );
        }
        
        const progress = obj.progress || (obj.current / obj.target) * 100;
        const isAchieved = obj.achieved || progress >= 100;
        
        return (
          <div 
            key={idx}
            className={`bg-slate-800/50 rounded-lg p-4 border ${
              isAchieved ? 'border-emerald-500/20' : 'border-amber-500/20'
            }`}
          >
            <div className="text-xs text-slate-400 mb-2">{obj.name.toUpperCase()}</div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {obj.current}
              </span>
              <span className="text-sm text-slate-400">/ {obj.target}</span>
              {isAchieved && <span className="ml-auto">🎉</span>}
            </div>
            <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`absolute inset-y-0 left-0 rounded-full shadow-lg transition-all duration-500 ${
                  isAchieved 
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 shadow-emerald-500/50'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/50'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ObjectifsPerformanceChart;
