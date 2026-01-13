/**
 * Hook pour gérer l'XP globale de tous les onglets
 * Agrège l'XP de : Quêtes, Apprentissage, Nutrition, Livres, Sport
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { loadXPData, saveXPData } from '../services/xp/xpStorage';
import { calculateXPForAllCategories } from '../services/xp/xpCalculations';

// Hook de base - sera complété avec les hooks existants
const useGlobalXP = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const userId = currentUser?.id || 'main';
  
  const [xpData, setXPData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // TODO: Récupérer les données de chaque système
  // const { userData: questsData, validations, effectiveQuests } = useQuietQuestEngine();
  // const { progressionData } = useApprentissageEngine();
  // const { gamificationData } = useNutritionGamification();
  // const { totalXP: booksXP, breakdown: booksBreakdown } = useBooksXP();
  // const { totalXP: sportXP, breakdown: sportBreakdown } = useSportXP();
  
  // Données temporaires pour le développement
  const tempData = {
    quests: { validations: [], allQuests: [] },
    learning: { globalXP: 0 },
    nutrition: { experience: { currentXP: 0 } },
    books: { totalXP: 0, breakdown: { sessions: 0, pages: 0, pagesPerHour: 0 } },
    sport: { totalXP: 0, breakdown: { reps: 0, exercises: 0, calories: 0, steps: 0, challenges: 0, sessions: 0 } }
  };
  
  // Calculer l'XP totale
  const calculatedXP = useMemo(() => {
    return calculateXPForAllCategories(tempData);
  }, []);
  
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
      }).catch(error => {
        console.error('Erreur sauvegarde XP:', error);
      });
    }
  }, [calculatedXP, xpData, isAuthenticated, isLoading]);
  
  // Calculer le niveau et la progression
  const levelInfo = useMemo(() => {
    if (!xpData) return { level: 1, xpForNextLevel: 1000, progress: { percent: 0, xpNeeded: 1000 } };
    
    const totalXP = xpData.totalXP;
    const level = Math.floor(totalXP / 1000) + 1;
    const xpForCurrentLevel = (level - 1) * 1000;
    const xpForNextLevel = level * 1000;
    const xpProgress = totalXP - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - totalXP;
    const percent = ((xpProgress / (xpForNextLevel - xpForCurrentLevel)) * 100);
    
    return {
      level,
      xpForNextLevel,
      progress: {
        percent: Math.min(100, Math.max(0, percent)),
        xpNeeded
      }
    };
  }, [xpData]);
  
  return {
    totalXP: xpData?.totalXP || 0,
    level: levelInfo.level,
    xpByCategory: xpData?.xpByCategory || {},
    progress: levelInfo.progress,
    details: xpData?.details || {},
    isLoading
  };
};

export { useGlobalXP };
