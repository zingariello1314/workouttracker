import React from 'react';
import { Award } from 'lucide-react';
import { workoutProgram } from '../../../data/workoutProgram';

const TopExercicesChart = ({ data, colors }) => {
  // Calculer les données réelles des exercices les plus pratiqués
  const calculateTopExercises = () => {
    const workoutHistory = data.workoutHistory || [];
    const actualData = data?.data || data || {};
    const exerciseStats = {};
    
    const isComplementary = (name) => {
      if (!name) return false;
      const n = String(name).toLowerCase();
      return (
        n.includes('boxe') ||
        n.includes('natation') ||
        n.includes('corde') ||
        n.includes('complementary') ||
        n.includes('activité') ||
        n.includes('activity')
      );
    };
    const toCanonicalName = (name) => {
      if (!name) return '';
      let raw = String(name);
      // 1) enlever les suffixes de variante: (Semaine A), (Semaine B), (Salle), etc.
      raw = raw.replace(/\([^)]*\)/g, '');
      // 2) supprimer les mentions explicites de variantes
      raw = raw.replace(/\b(semaine\s*[ab]|variante\s*[ab]?|salle\s*[ab]?)\b/gi, '');
      // 3) normaliser espaces et casse
      raw = raw.replace(/\s+/g, ' ').trim();
      return raw;
    };
    // Construire une map id -> nom depuis le programme
    const idToName = (() => {
      const map = {};
      try {
        Object.values(workoutProgram || {}).forEach(day => {
          (day.exercices || []).forEach(ex => { map[ex.id] = ex.name; });
          if (day.salleVariants) {
            (day.salleVariants.semaineA?.exercices || []).forEach(ex => { map[ex.id] = ex.name; });
            (day.salleVariants.semaineB?.exercices || []).forEach(ex => { map[ex.id] = ex.name; });
          }
        });
      } catch {}
      return map;
    })();
    const nameFromIdOrRaw = (id, rawName) => {
      if (id && String(id).match(/^\d+$/) && idToName[id]) return idToName[id];
      return rawName || '';
    };
    const unifyDisplayName = (canonical) => {
      const n = (canonical || '').toLowerCase();
      if (n.includes('pompe')) return 'Pompes';
      return canonical || '';
    };

    const addRepsToStats = (exerciseKey, exerciseLabel, reps) => {
      const key = String(exerciseKey || exerciseLabel || '').trim();
      const label = toCanonicalName(exerciseLabel || exerciseKey);
      const numReps = Number(reps) || 0;
      if (numReps <= 0) return;
      if (!exerciseStats[key]) {
        exerciseStats[key] = { id: key, name: label, reps: 0, sessions: 0 };
      }
      exerciseStats[key].reps += numReps;
      exerciseStats[key].sessions += 1;
    };

    const seenInSession = new Set();
    workoutHistory.forEach(session => {
      session.exercises?.forEach(exercise => {
        if (isComplementary(exercise.name)) return; // écarter activités non "musculaires"
        const canonical = toCanonicalName(nameFromIdOrRaw(exercise.id, exercise.name));
        const uniqueKey = `${session.date}|${canonical}`;
        // éviter un éventuel doublon du même exercice le même jour (variantes miroir)
        if (seenInSession.has(uniqueKey)) return;
        seenInSession.add(uniqueKey);
        // Clé par nom canonique pour fusionner Semaine A/B
        addRepsToStats(canonical, canonical, exercise.reps);
      });
    });

    // Ajouter les pompes de l'onglet Endurance (pushups)
    try {
      const endurancePushups = actualData?.enduranceData?.sessions?.pushups || [];
      endurancePushups.forEach(session => {
        const reps = session.reps ?? session.count;
        addRepsToStats('endurance:pushups', 'Pompes', reps);
      });
    } catch (_) {}
    
    // Fusionner par nom unifié (ex: Pompes, Pompes lestées, endurance)
    const byName = {};
    Object.values(exerciseStats).forEach(item => {
      const unified = unifyDisplayName(item.name);
      if (!byName[unified]) {
        byName[unified] = { name: unified, reps: 0, sessions: 0 };
      }
      byName[unified].reps += item.reps;
      byName[unified].sessions += item.sessions;
    });

    // Convertir en tableau et trier par répétitions
    const sortedExercises = Object.values(byName)
      .sort((a, b) => b.reps - a.reps)
      .slice(0, 8);
    
    return sortedExercises.map((exercise, index) => {
      // Calculer la tendance réelle basée sur les sessions récentes vs anciennes
      const exerciseSessions = workoutHistory
        .filter(session => session.exercises?.some(ex => unifyDisplayName(toCanonicalName(nameFromIdOrRaw(ex.id, ex.name))) === exercise.name))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      const midPoint = Math.floor(exerciseSessions.length / 2);
      const recentSessions = exerciseSessions.slice(midPoint);
      const previousSessions = exerciseSessions.slice(0, midPoint);
      
      const sumRepsForSet = (set) => set.reduce((sum, session) => {
        const repsInSession = (session.exercises || [])
          .filter(ex => unifyDisplayName(toCanonicalName(nameFromIdOrRaw(ex.id, ex.name))) === exercise.name)
          .reduce((s, ex) => s + (Number(ex.reps) || 0), 0);
        return sum + repsInSession;
      }, 0);

      let recentReps = sumRepsForSet(recentSessions);
      let previousReps = sumRepsForSet(previousSessions);

      // Inclure Endurance pour Pompes
      try {
        if (exercise.name === 'Pompes') {
          const pushups = actualData?.enduranceData?.sessions?.pushups || [];
          const normalized = pushups
            .map(s => ({ date: (s.date && s.date.includes('T')) ? s.date.split('T')[0] : s.date, reps: Number(s.reps ?? s.count) || 0 }))
            .sort((a,b)=> new Date(a.date) - new Date(b.date));
          const mid = Math.floor(normalized.length / 2);
          previousReps += normalized.slice(0, mid).reduce((s,x)=> s + x.reps, 0);
          recentReps += normalized.slice(mid).reduce((s,x)=> s + x.reps, 0);
        }
      } catch (_) {}
      
      const trend = previousReps > 0 ? 
        Math.round(((recentReps - previousReps) / previousReps) * 100) : 
        (recentReps > 0 ? 100 : 0);
      
      const maxReps = sortedExercises[0]?.reps || 1;
      return {
        ...exercise,
        percent: Math.max(0, Math.min(100, Math.round((exercise.reps / maxReps) * 100))),
        trend
      };
    });
  };

  const topExercises = calculateTopExercises();

  if (topExercises.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400">
        <div className="text-center">
          <Award className="mx-auto mb-4 text-slate-500" size={48} />
          <p className="text-lg font-medium">Aucun exercice enregistré</p>
          <p className="text-sm text-slate-500 mt-2">Commencez vos entraînements pour voir vos exercices favoris</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {topExercises.map((ex, idx) => (
        <div key={idx} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-slate-300 truncate">{ex.name}</span>
            <span className="text-sm font-semibold text-cyan-400">{ex.reps}</span>
          </div>
          <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-lg shadow-cyan-500/50"
              style={{ width: `${ex.percent}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default TopExercicesChart;

