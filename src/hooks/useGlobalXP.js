/**
 * Hook pour gérer l'XP globale de tous les onglets
 * Agrège l'XP de : Quêtes, Apprentissage, Nutrition, Livres, Sport, Arrêt addiction, Code / GitHub
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuietQuestEngine } from './useQuietQuestEngine';
import { useApprentissageEngine } from './useApprentissageEngine';
import { useNutritionGamification } from './useNutritionGamification';
import { useBooksXP } from './useBooksXP';
import { useSportXP } from './useSportXP';
import { useAddictionQuitXP } from './useAddictionQuitXP';
import { useCodeXP } from './useCodeXP';
import { loadXPData, saveXPData } from '../services/xp/xpStorage';
import { calculateXPForAllCategories } from '../services/xp/xpCalculations';
import { globalLevelProgressFromTotalXp } from '../utils/globalLevelProgress';
import { levelProgressFromXpAmount } from '../utils/xpLevelFromAmount';

let globalXpCache = { signature: null, calculated: null, data: null };

// Hook de base - sera complété avec les hooks existants
const useGlobalXP = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const userId = currentUser?.id || 'main';
  
  const [xpData, setXPData] = useState(globalXpCache.data);
  const [isLoading, setIsLoading] = useState(true);
  
  const { validations, effectiveQuests, userData } = useQuietQuestEngine();
  const { progressionData } = useApprentissageEngine();
  const { experience: nutritionExperience } = useNutritionGamification();
  const nutritionForCalc = nutritionExperience ? { experience: nutritionExperience } : null;
  const { totalXP: booksXP, breakdown: booksBreakdown, level: booksLevel } = useBooksXP();
  const { totalXP: sportXP, breakdown: sportBreakdown, level: sportLevel } = useSportXP();
  const addictionQuitXPBlock = useAddictionQuitXP();
  const codeXPBlock = useCodeXP();
  const cacheRef = useRef({ signature: null, result: null });
  
  // Calculer l'XP totale
  const calculatedXP = useMemo(() => {
    const signature = [
      validations?.length || 0,
      progressionData?.globalXP || 0,
      nutritionExperience?.currentXP || 0,
      booksXP,
      sportXP,
      addictionQuitXPBlock.totalXP,
      JSON.stringify(booksBreakdown),
      JSON.stringify(sportBreakdown),
      JSON.stringify(addictionQuitXPBlock.breakdown),
      codeXPBlock.totalXP,
      JSON.stringify(codeXPBlock.breakdown),
    ].join('|');

    if (cacheRef.current.signature === signature && cacheRef.current.result) {
      return cacheRef.current.result;
    }
    if (globalXpCache.signature === signature && globalXpCache.calculated) {
      cacheRef.current = { signature, result: globalXpCache.calculated };
      return globalXpCache.calculated;
    }

    const result = calculateXPForAllCategories({
      quests: { validations, allQuests: effectiveQuests },
      learning: progressionData,
      nutrition: nutritionForCalc,
      books: { totalXP: booksXP, breakdown: booksBreakdown },
      sport: { totalXP: sportXP, breakdown: sportBreakdown },
      addictionQuit: addictionQuitXPBlock,
      code: { totalXP: codeXPBlock.totalXP, breakdown: codeXPBlock.breakdown },
    });
    cacheRef.current = { signature, result };
    globalXpCache = { ...globalXpCache, signature, calculated: result };
    return result;
  }, [
    validations,
    effectiveQuests,
    progressionData,
    nutritionExperience,
    booksXP,
    booksBreakdown,
    sportXP,
    sportBreakdown,
    addictionQuitXPBlock.totalXP,
    addictionQuitXPBlock.breakdown,
    codeXPBlock.totalXP,
    codeXPBlock.breakdown,
  ]);
  
  // Charger les données sauvegardées
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    
    const loadData = async () => {
      try {
        const saved = await loadXPData(userId);
        if (saved) {
          setXPData(saved);
        } else {
          // Première fois : calculer depuis les données existantes
          const initialXP = calculatedXP;
          const newData = {
            userId,
            ...initialXP,
            version: '1.0'
          };
          await saveXPData(newData);
          setXPData(newData);
        }
      } catch (error) {
        console.error('Erreur chargement XP:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [userId, isAuthenticated]);
  
  // Sauvegarder quand l'XP change
  useEffect(() => {
    if (!xpData || !isAuthenticated || isLoading) return;
    
    // Comparer avec les données calculées
    const needsUpdate = 
      calculatedXP.totalXP !== xpData.totalXP ||
      JSON.stringify(calculatedXP.xpByCategory) !== JSON.stringify(xpData.xpByCategory);
    
    if (needsUpdate) {
      const updated = {
        ...xpData,
        ...calculatedXP,
        lastUpdated: new Date().toISOString()
      };
      
      saveXPData(updated).then(() => {
        setXPData(updated);
        globalXpCache = { ...globalXpCache, data: updated };
      }).catch(error => {
        console.error('Erreur sauvegarde XP:', error);
      });
    }
  }, [calculatedXP, xpData, isAuthenticated, isLoading]);
  
  // Calculer le niveau et la progression
  const levelInfo = useMemo(() => {
    if (!xpData) return globalLevelProgressFromTotalXp(0);
    return globalLevelProgressFromTotalXp(xpData.totalXP);
  }, [xpData]);

  /** Niveau affiché par case = celui de l’onglet / moteur réel (pas la courbe globale sur la tranche XP). */
  const categoryLevels = useMemo(() => {
    const aqXp = addictionQuitXPBlock?.totalXP ?? 0;
    const codeXp = codeXPBlock?.totalXP ?? 0;
    return {
      quests: Math.max(1, Number(userData?.level) || 1),
      learning: Math.max(1, Number(progressionData?.globalLevel) || 1),
      nutrition: Math.max(1, Number(nutritionExperience?.level) || 1),
      books: Math.max(1, Number(booksLevel) || 1),
      sport: Math.max(1, Number(sportLevel) || 1),
      // Pas de niveau dédié dans l’onglet : paliers 500 XP (lisible, cohérent avec Livres)
      addictionQuit: Math.max(1, levelProgressFromXpAmount(aqXp, 500).level),
      code: Math.max(1, levelProgressFromXpAmount(codeXp).level),
    };
  }, [
    userData?.level,
    progressionData?.globalLevel,
    nutritionExperience?.level,
    nutritionExperience?.currentXP,
    booksLevel,
    sportLevel,
    addictionQuitXPBlock?.totalXP,
    codeXPBlock?.totalXP,
  ]);

  return {
    totalXP: xpData?.totalXP || 0,
    level: levelInfo.level,
    xpByCategory: xpData?.xpByCategory || {},
    progress: levelInfo.progress,
    details: xpData?.details || {},
    categoryLevels,
    isLoading
  };
};

export { useGlobalXP };
