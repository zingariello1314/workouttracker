/**
 * Hook pour calculer l'XP d'apprentissage à partir des données de progression
 */

import { useMemo, useRef } from 'react';
import { useApprentissageEngine } from './useApprentissageEngine';

const DEFAULT_BREAKDOWN = {
  sessions: 0,
  subjects: 0,
  studyTime: 0, // en heures
  totalTime: 0, // en secondes
};

let apprentissageXpCache = {
  signature: null,
  result: { totalXP: 0, breakdown: DEFAULT_BREAKDOWN },
};

export const useApprentissageXP = () => {
  const { progressionData, isLoading } = useApprentissageEngine();
  const cacheRef = useRef({
    signature: null,
    result: { totalXP: 0, breakdown: DEFAULT_BREAKDOWN },
  });

  const calculated = useMemo(() => {
    if (!progressionData) {
      if (isLoading && apprentissageXpCache.signature) {
        return apprentissageXpCache.result;
      }
      return { totalXP: 0, breakdown: DEFAULT_BREAKDOWN };
    }

    const totalXP = progressionData.globalXP || 0;
    const subjects = progressionData.subjects || {};
    const subjectsCount = Object.keys(subjects).length;

    // Calculer le nombre total de sessions
    const totalSessions = Object.values(subjects).reduce(
      (sum, subject) => sum + (subject.sessions || 0),
      0
    );

    // Calculer le temps total d'étude (en secondes)
    const totalTime = progressionData.totalStudyTime || 0;
    const studyTimeHours = totalTime / 3600; // Convertir en heures

    const signature = [
      totalXP,
      subjectsCount,
      totalSessions,
      totalTime,
    ].join('|');

    if (cacheRef.current.signature === signature) {
      return cacheRef.current.result;
    }
    if (apprentissageXpCache.signature === signature) {
      cacheRef.current = { signature, result: apprentissageXpCache.result };
      return apprentissageXpCache.result;
    }

    const result = {
      totalXP,
      breakdown: {
        sessions: totalSessions,
        subjects: subjectsCount,
        studyTime: Math.round(studyTimeHours * 10) / 10, // Arrondir à 1 décimale
        totalTime,
      },
    };

    cacheRef.current = { signature, result };
    apprentissageXpCache = { ...apprentissageXpCache, signature, result };
    return result;
  }, [progressionData, isLoading]);

  const levelInfo = useMemo(() => {
    const totalXP = calculated.totalXP || 0;
    
    // Utiliser le niveau global depuis progressionData (calculé avec la formule officielle)
    const level = progressionData?.globalLevel || 1;
    
    // Utiliser la formule XP_CONFIG.level_formula pour calculer les seuils
    const levelFormula = (lvl) => Math.floor(Math.pow(lvl, 1.8) * 150);
    
    const xpForCurrentLevel = level > 1 ? levelFormula(level) : 0;
    const xpForNextLevel = levelFormula(level + 1);
    const xpProgress = totalXP - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - totalXP;
    const xpForNextLevelProgress = xpForNextLevel - xpForCurrentLevel;
    const percent = xpForNextLevelProgress > 0 
      ? (xpProgress / xpForNextLevelProgress) * 100 
      : 0;

    return {
      level,
      progress: {
        percent: Math.min(100, Math.max(0, percent)),
        xpNeeded: Math.max(0, xpNeeded),
        currentXP: Math.max(0, xpProgress),
        nextLevelXP: xpForNextLevelProgress,
      },
    };
  }, [calculated.totalXP, progressionData?.globalLevel]);

  return {
    totalXP: calculated.totalXP || 0,
    level: levelInfo.level,
    breakdown: calculated.breakdown || DEFAULT_BREAKDOWN,
    progress: levelInfo.progress,
    isLoading,
  };
};
