import { useEffect, useMemo, useRef, useState } from 'react';
import {
  openQuietQuestDB,
  loadQuestsFromIndexedDB,
  saveQuestsToIndexedDB,
  loadValidationsFromIndexedDB,
  saveValidationsToIndexedDB,
  loadUserDataFromIndexedDB,
  saveUserDataToIndexedDB,
  loadDailyPerformancesFromIndexedDB,
  saveDailyPerformancesToIndexedDB,
  loadAppStateFromIndexedDB,
  saveAppStateToIndexedDB,
} from '../utils/quietQuestIndexedDB';
import { emitSidebarEvent, SIDEBAR_EVENTS } from '../utils/sidebarEvents';
import { useAuth } from '../context/AuthContext';

// Clés de stockage QuietQuest (pour fallback localStorage)
export const STORAGE_KEYS = {
  quests: 'quietquest_quests',
  validations: 'quietquest_validations',
  userData: 'quietquest_user_data',
  dailyPerformances: 'quietquest_daily_performances',
  appState: 'quietquest_app_state',
};

export const META_KEYS = {
  lastVisit: 'quietquest_last_visit',
  lastCleanup: 'quietquest_last_cleanup',
};

export const defaultUserData = {
  level: 1,
  currentXP: 0,
  xpForNextLevel: 2500,
};

// Helpers de persistance (fallback localStorage)
export function loadFromStorage(key, defaultValue) {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

export function saveToStorage(key, data) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Silent fail: on ne casse jamais l'UI pour un souci de quota
  }
}

// XP par difficulté (spec)
export const DIFFICULTY_XP_BASE = {
  1: 250,
  2: 375,
  3: 500,
  4: 750,
};

export function calculateQuestXP(quest) {
  const base = DIFFICULTY_XP_BASE[quest.difficulte] || DIFFICULTY_XP_BASE[1];
  const multiplier = (quest.duree || 60) / 60;
  return Math.round(base * multiplier);
}

// Helpers date
export const getTodayDateStr = () => new Date().toISOString().slice(0, 10);

export const getDayOfWeekFromDateStr = (dateStr) => {
  const d = new Date(dateStr);
  const jsDay = d.getDay(); // 0 (dimanche) → 6 (samedi)
  return jsDay === 0 ? 7 : jsDay; // 1 = lundi, ... 7 = dimanche
};

export const addDays = (dateStr, delta) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
};

// Récupère les quêtes actives pour une date donnée (récurrentes + exceptionnelles)
export const getQuestsForDate = (allQuests, targetDate) => {
  if (!targetDate) return [];
  const dayOfWeek = getDayOfWeekFromDateStr(targetDate);

  return allQuests
    .filter((quest) => quest && quest.active !== false)
    .filter((quest) => {
      if (quest.type === 'exceptionnelle') {
        return quest.date === targetDate;
      }
      if (quest.type === 'recurrente') {
        if (!Array.isArray(quest.jours)) return false;
        return quest.jours.includes(dayOfWeek);
      }
      // Fallback : considérer comme récurrente tous les jours
      return true;
    })
    .sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
};

/**
 * Quêtes codées en dur pour zingariello1314
 */
const HARDCODED_QUESTS_FOR_ZINGARIELLO = [
  { id: 'hardcoded_1', nom: 'Brosser les dents (Matin)', description: '', categorie: 'Santé', difficulte: 1, duree: 15, type: 'recurrente', jours: [1, 2, 3, 4, 5, 6, 7], active: true, ordre: 1 },
  { id: 'hardcoded_2', nom: 'Douche Matin', description: '', categorie: 'Santé', difficulte: 1, duree: 25, type: 'recurrente', jours: [1, 2, 3, 4, 5, 6, 7], active: true, ordre: 2 },
  { id: 'hardcoded_3', nom: 'Étirements Matin', description: '', categorie: 'Santé', difficulte: 2, duree: 15, type: 'recurrente', jours: [1, 2, 3, 4, 5, 6, 7], active: true, ordre: 3 },
  { id: 'hardcoded_4', nom: 'Codage Matin', description: 'Dev Vizora', categorie: 'Travail', difficulte: 3, duree: 65, type: 'recurrente', jours: [1, 2, 3, 4, 5, 6, 7], active: true, ordre: 4 },
  { id: 'hardcoded_5', nom: 'Brosser les dents Midi', description: '', categorie: 'Santé', difficulte: 1, duree: 15, type: 'recurrente', jours: [1, 2, 3, 4, 5, 6, 7], active: true, ordre: 5 },
  { id: 'hardcoded_6', nom: 'Étirements Midi', description: '', categorie: 'Santé', difficulte: 1, duree: 15, type: 'recurrente', jours: [1, 2, 3, 4, 5, 6, 7], active: true, ordre: 6 },
  { id: 'hardcoded_7', nom: 'Repas Midi', description: '', categorie: 'Repas', difficulte: 2, duree: 65, type: 'recurrente', jours: [1, 2, 3, 4, 5, 6, 7], active: true, ordre: 7 },
  { id: 'hardcoded_8', nom: 'Poser des cv pendant collation petits suisses', description: '', categorie: 'Travail', difficulte: 1, duree: 25, type: 'recurrente', jours: [1, 2, 3, 4, 5, 6, 7], active: true, ordre: 8 },
  { id: 'hardcoded_9', nom: 'Codage', description: 'DEV Vizora', categorie: 'Projets', difficulte: 3, duree: 125, type: 'recurrente', jours: [1, 2, 3, 4, 5, 6, 7], active: true, ordre: 9 },
  { id: 'hardcoded_10', nom: 'Sport', description: 'Séance du jour.', categorie: 'Sport', difficulte: 4, duree: 95, type: 'recurrente', jours: [1, 2, 3, 4, 5, 6, 7], active: true, ordre: 10 },
  { id: 'hardcoded_11', nom: 'Douche', description: 'Douche d\'après sport', categorie: 'Bien-être', difficulte: 1, duree: 25, type: 'recurrente', jours: [1, 2, 3, 4, 5, 6, 7], active: true, ordre: 11 },
  { id: 'hardcoded_12', nom: 'Lecture plaisir', description: 'Lecture post repas', categorie: 'Santé', difficulte: 3, duree: 65, type: 'recurrente', jours: [1, 2, 3, 4, 5, 6, 7], active: true, ordre: 12 },
  { id: 'hardcoded_13', nom: 'Codage Soir', description: 'Dev Projet perso et/ou Vizora', categorie: 'Projets', difficulte: 3, duree: 125, type: 'recurrente', jours: [1, 2, 3, 4, 5, 6, 7], active: true, ordre: 13 },
  { id: 'hardcoded_14', nom: 'Lecture Spécifique', description: 'Lecture Technique sur un sujet pointu le soir', categorie: 'Lecture', difficulte: 4, duree: 65, type: 'recurrente', jours: [1, 2, 3, 4, 5, 6, 7], active: true, ordre: 14 },
  { id: 'hardcoded_15', nom: 'Brosser les dents Soir', description: '', categorie: 'Santé', difficulte: 1, duree: 15, type: 'recurrente', jours: [1, 2, 3, 4, 5, 6, 7], active: true, ordre: 15 },
  { id: 'hardcoded_16', nom: 'Étirements soir', description: '', categorie: 'Santé', difficulte: 1, duree: 15, type: 'recurrente', jours: [1, 2, 3, 4, 5, 6, 7], active: true, ordre: 16 },
].map(quest => ({
  ...quest,
  xp: calculateQuestXP(quest)
}));

/**
 * Hook centralisant toute la logique QuietQuest (état + persistance + calculs).
 * 
 * Objectif : isoler le "moteur" pour le rendre réutilisable et testable,
 * tout en laissant les composants d'UI se concentrer sur le rendu.
 */
export function useQuietQuestEngine() {
  const { currentUser, isAuthenticated } = useAuth();
  const [allQuests, setAllQuests] = useState([]);
  const [userData, setUserData] = useState(defaultUserData);
  const [validations, setValidations] = useState([]);
  const [dailyPerformances, setDailyPerformances] = useState([]);
  
  // Vérifier si c'est l'utilisateur zingariello1314
  const isZingariello = currentUser?.username === 'zingariello1314';

  // Détection du mode de stockage
  const storageModeRef = useRef('localstorage'); // 'indexeddb' | 'localstorage'
  const dbRef = useRef(null);
  const userId = 'main'; // Pour support multi-utilisateurs futur

  // Cache mémo pour getQuestsForDate (clé: date, valeur: quêtes)
  const questsCacheRef = useRef(new Map());
  const questsVersionRef = useRef(0);
  
  // Pour zingariello1314 : utiliser les quêtes hardcodées
  // Pour les autres utilisateurs connectés : utiliser les vraies quêtes
  // Pour les non-connectés : retourner un tableau vide
  const effectiveQuests = useMemo(() => {
    if (isZingariello) {
      return HARDCODED_QUESTS_FOR_ZINGARIELLO;
    }
    if (!isAuthenticated) {
      return [];
    }
    return allQuests;
  }, [isZingariello, isAuthenticated, allQuests]);

  // Timers pour debounce des sauvegardes
  const saveQuestsTimerRef = useRef(null);
  const saveValidationsTimerRef = useRef(null);
  const saveDailyPerformancesTimerRef = useRef(null);
  const saveUserDataTimerRef = useRef(null);

  // Chargement initial avec migration automatique
  useEffect(() => {
    const loadData = async () => {
      // Pour zingariello1314, charger seulement validations et userData (pas les quêtes)
      if (isZingariello) {
        const db = await openQuietQuestDB();
        if (db) {
          storageModeRef.current = 'indexeddb';
          dbRef.current = db;
          const indexedUser = await loadUserDataFromIndexedDB(db, userId);
          const indexedValidations = await loadValidationsFromIndexedDB(db, userId);
          const indexedDaily = await loadDailyPerformancesFromIndexedDB(db, userId);
          
          // Si IndexedDB vide, essayer localStorage
          if (!indexedUser && indexedValidations.length === 0) {
            const localUser = loadFromStorage(STORAGE_KEYS.userData, null);
            const localValidations = loadFromStorage(STORAGE_KEYS.validations, []);
            const localDaily = loadFromStorage(STORAGE_KEYS.dailyPerformances, []);
            
            if (localUser || localValidations.length > 0 || localDaily.length > 0) {
              // Migrer vers IndexedDB
              try {
                if (localUser) await saveUserDataToIndexedDB(db, localUser, userId);
                if (localValidations.length > 0) await saveValidationsToIndexedDB(db, localValidations, userId);
                if (localDaily.length > 0) await saveDailyPerformancesToIndexedDB(db, localDaily, userId);
                // Nettoyer localStorage
                if (typeof window !== 'undefined') {
                  window.localStorage.removeItem(STORAGE_KEYS.userData);
                  window.localStorage.removeItem(STORAGE_KEYS.validations);
                  window.localStorage.removeItem(STORAGE_KEYS.dailyPerformances);
                }
              } catch (error) {
                console.error('[useQuietQuestEngine] Erreur migration zingariello:', error);
              }
              // Charger les données migrées
              setUserData({ ...defaultUserData, ...(localUser || {}) });
              setValidations(Array.isArray(localValidations) ? localValidations : []);
              setDailyPerformances(Array.isArray(localDaily) ? localDaily : []);
            } else {
              // Pas de données, utiliser les valeurs par défaut
              setUserData(defaultUserData);
              setValidations([]);
              setDailyPerformances([]);
            }
          } else {
            // Données dans IndexedDB
            setUserData({ ...defaultUserData, ...(indexedUser || {}) });
            setValidations(Array.isArray(indexedValidations) ? indexedValidations : []);
            setDailyPerformances(Array.isArray(indexedDaily) ? indexedDaily : []);
          }
        } else {
          // Fallback localStorage pour zingariello
          storageModeRef.current = 'localstorage';
          const storedUser = loadFromStorage(STORAGE_KEYS.userData, defaultUserData);
          const storedValidations = loadFromStorage(STORAGE_KEYS.validations, []);
          const storedDaily = loadFromStorage(STORAGE_KEYS.dailyPerformances, []);
          setUserData({ ...defaultUserData, ...(storedUser || {}) });
          setValidations(Array.isArray(storedValidations) ? storedValidations : []);
          setDailyPerformances(Array.isArray(storedDaily) ? storedDaily : []);
        }
        return;
      }
    
      const db = await openQuietQuestDB();

      if (db) {
        // Mode IndexedDB
        storageModeRef.current = 'indexeddb';
        dbRef.current = db;

        // Charger depuis IndexedDB
        const indexedQuests = await loadQuestsFromIndexedDB(db, userId);
        const indexedUser = await loadUserDataFromIndexedDB(db, userId);
        const indexedValidations = await loadValidationsFromIndexedDB(db, userId);
        const indexedDaily = await loadDailyPerformancesFromIndexedDB(db, userId);

        // Si IndexedDB vide, essayer migration depuis localStorage
        if (
          indexedQuests.length === 0 &&
          indexedValidations.length === 0 &&
          !indexedUser
        ) {
          const localQuests = loadFromStorage(STORAGE_KEYS.quests, []);
          const localUser = loadFromStorage(STORAGE_KEYS.userData, null);
          const localValidations = loadFromStorage(STORAGE_KEYS.validations, []);
          const localDaily = loadFromStorage(STORAGE_KEYS.dailyPerformances, []);

          if (localQuests.length > 0 || localValidations.length > 0 || localUser) {
            // Migration depuis localStorage
            try {
              if (localQuests.length > 0) {
                await saveQuestsToIndexedDB(db, localQuests, userId);
              }
              if (localUser) {
                await saveUserDataToIndexedDB(db, localUser, userId);
              }
              if (localValidations.length > 0) {
                await saveValidationsToIndexedDB(db, localValidations, userId);
              }
              if (localDaily.length > 0) {
                await saveDailyPerformancesToIndexedDB(db, localDaily, userId);
              }
              // Nettoyer localStorage après migration réussie
              Object.values(STORAGE_KEYS).forEach((key) => {
                if (typeof window !== 'undefined') {
                  window.localStorage.removeItem(key);
                }
              });
              console.log('[useQuietQuestEngine] ✅ Migration localStorage → IndexedDB réussie');
            } catch (error) {
              console.error('[useQuietQuestEngine] ❌ Erreur migration:', error);
            }
          }

          // Charger les données (migrées ou vides)
          setAllQuests(Array.isArray(localQuests) ? localQuests : []);
          setUserData({ ...defaultUserData, ...(localUser || {}) });
          setValidations(Array.isArray(localValidations) ? localValidations : []);
          setDailyPerformances(Array.isArray(localDaily) ? localDaily : []);
        } else {
          // Données déjà dans IndexedDB
          setAllQuests(Array.isArray(indexedQuests) ? indexedQuests : []);
          setUserData({ ...defaultUserData, ...(indexedUser || {}) });
          setValidations(Array.isArray(indexedValidations) ? indexedValidations : []);
          setDailyPerformances(Array.isArray(indexedDaily) ? indexedDaily : []);
        }
      } else {
        // Mode localStorage (fallback)
        storageModeRef.current = 'localstorage';
        const storedQuests = loadFromStorage(STORAGE_KEYS.quests, []);
        const storedUser = loadFromStorage(STORAGE_KEYS.userData, defaultUserData);
        const storedValidations = loadFromStorage(STORAGE_KEYS.validations, []);
        const storedDaily = loadFromStorage(STORAGE_KEYS.dailyPerformances, []);

        setAllQuests(Array.isArray(storedQuests) ? storedQuests : []);
        setUserData({ ...defaultUserData, ...(storedUser || {}) });
        setValidations(Array.isArray(storedValidations) ? storedValidations : []);
        setDailyPerformances(Array.isArray(storedDaily) ? storedDaily : []);
      }
    };

    loadData();
  }, [isZingariello]);

  // Invalider le cache quand allQuests change
  useEffect(() => {
    questsVersionRef.current += 1;
    questsCacheRef.current.clear();
  }, [allQuests]);

  // Sauvegardes automatiques avec debounce (300ms)
  useEffect(() => {
    if (saveQuestsTimerRef.current) {
      clearTimeout(saveQuestsTimerRef.current);
    }
    saveQuestsTimerRef.current = setTimeout(async () => {
      if (storageModeRef.current === 'indexeddb' && dbRef.current) {
        try {
          await saveQuestsToIndexedDB(dbRef.current, allQuests, userId);
        } catch (error) {
          console.error('[useQuietQuestEngine] Erreur sauvegarde quêtes IndexedDB:', error);
          // Fallback localStorage
          saveToStorage(STORAGE_KEYS.quests, allQuests);
        }
      } else {
        saveToStorage(STORAGE_KEYS.quests, allQuests);
      }
    }, 300);
    return () => {
      if (saveQuestsTimerRef.current) {
        clearTimeout(saveQuestsTimerRef.current);
      }
    };
  }, [allQuests]);

  useEffect(() => {
    if (saveValidationsTimerRef.current) {
      clearTimeout(saveValidationsTimerRef.current);
    }
    // Limiter à 5000 validations
    const limited =
      validations.length > 5000
        ? validations.slice(validations.length - 5000)
        : validations;
    saveValidationsTimerRef.current = setTimeout(async () => {
      if (storageModeRef.current === 'indexeddb' && dbRef.current) {
        try {
          await saveValidationsToIndexedDB(dbRef.current, limited, userId);
        } catch (error) {
          console.error('[useQuietQuestEngine] Erreur sauvegarde validations IndexedDB:', error);
          saveToStorage(STORAGE_KEYS.validations, limited);
        }
      } else {
        saveToStorage(STORAGE_KEYS.validations, limited);
      }
    }, 300);
    return () => {
      if (saveValidationsTimerRef.current) {
        clearTimeout(saveValidationsTimerRef.current);
      }
    };
  }, [validations]);

  useEffect(() => {
    if (saveDailyPerformancesTimerRef.current) {
      clearTimeout(saveDailyPerformancesTimerRef.current);
    }
    // Limiter à 366 entrées
    const limited =
      dailyPerformances.length > 366
        ? dailyPerformances.slice(dailyPerformances.length - 366)
        : dailyPerformances;
    saveDailyPerformancesTimerRef.current = setTimeout(async () => {
      if (storageModeRef.current === 'indexeddb' && dbRef.current) {
        try {
          await saveDailyPerformancesToIndexedDB(dbRef.current, limited, userId);
        } catch (error) {
          console.error('[useQuietQuestEngine] Erreur sauvegarde dailyPerformances IndexedDB:', error);
          saveToStorage(STORAGE_KEYS.dailyPerformances, limited);
        }
      } else {
        saveToStorage(STORAGE_KEYS.dailyPerformances, limited);
      }
    }, 300);
    return () => {
      if (saveDailyPerformancesTimerRef.current) {
        clearTimeout(saveDailyPerformancesTimerRef.current);
      }
    };
  }, [dailyPerformances]);

  useEffect(() => {
    if (saveUserDataTimerRef.current) {
      clearTimeout(saveUserDataTimerRef.current);
    }
    saveUserDataTimerRef.current = setTimeout(async () => {
      if (storageModeRef.current === 'indexeddb' && dbRef.current) {
        try {
          await saveUserDataToIndexedDB(dbRef.current, userData, userId);
        } catch (error) {
          console.error('[useQuietQuestEngine] Erreur sauvegarde userData IndexedDB:', error);
          saveToStorage(STORAGE_KEYS.userData, userData);
        }
      } else {
        saveToStorage(STORAGE_KEYS.userData, userData);
      }
    }, 300);
    return () => {
      if (saveUserDataTimerRef.current) {
        clearTimeout(saveUserDataTimerRef.current);
      }
    };
  }, [userData]);

  // Index des validations par date
  const validationsByDate = useMemo(() => {
    const map = new Map();
    for (const v of validations) {
      if (!v || !v.date) continue;
      const existing = map.get(v.date);
      if (existing) {
        existing.push(v);
      } else {
        map.set(v.date, [v]);
      }
    }
    return map;
  }, [validations]);

  const isQuestCompletedOnDate = (questId, date) => {
    const list = validationsByDate.get(date);
    if (!list) return false;
    return list.some((v) => v.queteId === questId);
  };

  const updateUserXP = (delta) => {
    if (!delta) return;
    setUserData((prev) => {
      let currentXP = (prev.currentXP || 0) + delta;
      let level = prev.level || 1;
      let xpForNextLevel = prev.xpForNextLevel || 2500;

      while (currentXP >= xpForNextLevel) {
        currentXP -= xpForNextLevel;
        level += 1;
        xpForNextLevel = Math.round(xpForNextLevel * 1.1);
      }

      if (currentXP < 0) currentXP = 0;

      return { level, currentXP, xpForNextLevel };
    });
  };

  // Version memoized de getQuestsForDate avec cache
  const getQuestsForDateMemoized = useMemo(() => {
    return (targetDate) => {
      if (!targetDate) return [];
      const cacheKey = `${targetDate}:${questsVersionRef.current}`;
      const cached = questsCacheRef.current.get(cacheKey);
      if (cached) return cached;
      const result = getQuestsForDate(effectiveQuests, targetDate);
      questsCacheRef.current.set(cacheKey, result);
      // Limiter la taille du cache à 100 entrées (LRU simple)
      if (questsCacheRef.current.size > 100) {
        const firstKey = questsCacheRef.current.keys().next().value;
        questsCacheRef.current.delete(firstKey);
      }
      return result;
    };
  }, [effectiveQuests]);

  const recalcDailyPerformanceForDate = (date) => {
    if (!date) return;

    const questsOfDay = getQuestsForDateMemoized(date);
    const total = questsOfDay.length;

    if (!total) {
      setDailyPerformances((prev) => prev.filter((d) => d.date !== date));
      return;
    }

    const validationsOfDay = validationsByDate.get(date) || [];
    const completedQuests = new Set(validationsOfDay.map((v) => v.queteId));

    const completedCount = completedQuests.size;
    const xpTotal = validationsOfDay.reduce(
      (sum, v) => sum + (v.xpGagne || 0),
      0
    );
    const successRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    setDailyPerformances((prev) => {
      const others = prev.filter((d) => d.date !== date);
      return [
        ...others,
        {
          date,
          totalQuests: total,
          completedQuests: completedCount,
          xpTotal,
          successRate,
        },
      ];
    });
  };

  const toggleQuestValidation = (questId, rawDate) => {
    const date = rawDate || getTodayDateStr();
    const quest = effectiveQuests.find((q) => q.id === questId);
    if (!quest) return;

    const xp = quest.xp ?? calculateQuestXP(quest);

    setValidations((prev) => {
      const index = prev.findIndex(
        (v) => v.queteId === questId && v.date === date
      );

      if (index !== -1) {
        // Uncompleting quest
        const copy = [...prev];
        const [removed] = copy.splice(index, 1);
        updateUserXP(-(removed?.xpGagne || xp));
        setTimeout(() => recalcDailyPerformanceForDate(date), 0);
        
        // Emit sidebar event for quest update
        emitSidebarEvent(SIDEBAR_EVENTS.QUEST_UPDATED, { questId, date, completed: false });
        
        return copy;
      }

      // Completing quest
      const next = [
        ...prev,
        {
          queteId: questId,
          date,
          xpGagne: xp,
          heureValidation: new Date().toISOString(),
        },
      ];
      updateUserXP(xp);
      setTimeout(() => recalcDailyPerformanceForDate(date), 0);
      
      // Emit sidebar event for quest completion
      emitSidebarEvent(SIDEBAR_EVENTS.QUEST_COMPLETED, { questId, date, xp });
      
      return next;
    });
  };

  // Maintenance automatique (changement de jour + cleanup > 1 an)
  // NOTE: Seules les quêtes exceptionnelles passées sont supprimées automatiquement
  // Les quêtes récurrentes restent pour toujours tant qu'elles ne sont pas supprimées manuellement
  useEffect(() => {
    const today = getTodayDateStr();

    const lastVisit =
      (typeof window !== 'undefined' && window.localStorage.getItem(META_KEYS.lastVisit)) ||
      null;
    if (!lastVisit || lastVisit !== today) {
      // Supprimer uniquement les quêtes exceptionnelles dont la date est passée
      // Les quêtes récurrentes (q.type !== 'exceptionnelle') ne sont JAMAIS supprimées ici
      setAllQuests((prev) =>
        prev.filter(
          (q) =>
            q.type !== 'exceptionnelle' || // Garde toutes les récurrentes
            !q.date || // Garde les exceptionnelles sans date
            q.date >= today // Garde les exceptionnelles futures ou aujourd'hui
        )
      );
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(META_KEYS.lastVisit, today);
      }
    }

    const lastCleanup =
      (typeof window !== 'undefined' && window.localStorage.getItem(META_KEYS.lastCleanup)) ||
      null;
    const now = new Date(today);
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearAgoStr = oneYearAgo.toISOString().slice(0, 10);

    if (!lastCleanup || lastCleanup < today) {
      setValidations((prev) => prev.filter((v) => v.date >= oneYearAgoStr));
      setDailyPerformances((prev) => prev.filter((d) => d.date >= oneYearAgoStr));
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(META_KEYS.lastCleanup, today);
      }
    }
  }, []);

  return {
    allQuests: effectiveQuests,
    setAllQuests: isZingariello ? () => {} : setAllQuests, // Pas de modification pour zingariello (quêtes hardcodées)
    userData,
    setUserData,
    validations, // Les validations fonctionnent pour zingariello aussi
    dailyPerformances, // Les performances fonctionnent pour zingariello aussi
    validationsByDate,
    isQuestCompletedOnDate,
    toggleQuestValidation, // La validation fonctionne pour zingariello aussi
    recalcDailyPerformanceForDate,
    getQuestsForDate: getQuestsForDateMemoized,
  };
}


