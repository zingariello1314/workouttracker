import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
import { emitSidebarEvent, SIDEBAR_EVENTS, sidebarEvents } from '../utils/sidebarEvents';
import { useAuth } from '../context/AuthContext';
import { getHeureSortMinutes } from '../utils/quests';
import logger from '../utils/logger';

const qqLog = logger.module('useQuietQuestEngine');

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

// Récupère les quêtes actives pour une date donnée (récurrentes + exceptionnelles).
// Tri : d'abord par heure prévue (prière calculée, créneau ou heure précise), puis par ordre.
export const getQuestsForDate = (allQuests, targetDate, prayerLocation = null) => {
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
      return true;
    })
    .sort((a, b) => {
      const minA = getHeureSortMinutes(a, targetDate, prayerLocation);
      const minB = getHeureSortMinutes(b, targetDate, prayerLocation);
      if (minA !== minB) return minA - minB;
      return (a.ordre || 0) - (b.ordre || 0);
    });
};

/** Contexte : une seule instance du moteur (évite les courses d’écriture IndexedDB entre Dashboard / Quêtes / sidebar). */
export const QuietQuestContext = createContext(null);

/**
 * Hook centralisant toute la logique QuietQuest (état + persistance + calculs).
 *
 * Objectif : isoler le "moteur" pour le rendre réutilisable et testable,
 * tout en laissant les composants d'UI se concentrer sur le rendu.
 */
function useQuietQuestEngineImpl() {
  const { currentUser, isAuthenticated } = useAuth();
  const [allQuests, setAllQuests] = useState([]);
  const [userData, setUserData] = useState(defaultUserData);
  const [validations, setValidations] = useState([]);
  const [dailyPerformances, setDailyPerformances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [prayerLocation, setPrayerLocationState] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const appState = loadFromStorage(STORAGE_KEYS.appState, {});
      const loc = appState.prayerLocation;
      return loc && typeof loc.lat === 'number' && typeof loc.lng === 'number' ? loc : null;
    } catch {
      return null;
    }
  });

  // Date du jour : mise à jour après minuit pour que l’onglet Quêtes affiche le nouveau jour (quêtes décochées)
  const [todayDate, setTodayDate] = useState(() => getTodayDateStr());
  // Mise à jour de la date du jour : intervalle 10 s + au focus/visibilité (ex. retour après minuit)
  useEffect(() => {
    const refreshToday = () => {
      const current = getTodayDateStr();
      setTodayDate((prev) => (prev === current ? prev : current));
    };
    const interval = setInterval(refreshToday, 10 * 1000);
    const onVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') refreshToday();
    };
    const onFocus = () => refreshToday();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Détection du mode de stockage
  const storageModeRef = useRef('localstorage'); // 'indexeddb' | 'localstorage'
  const dbRef = useRef(null);
  const userId = 'main'; // Pour support multi-utilisateurs futur

  // Cache mémo pour getQuestsForDate (clé: date, valeur: quêtes)
  const questsCacheRef = useRef(new Map());
  const questsVersionRef = useRef(0);
  
  // Pour les utilisateurs connectés : utiliser les vraies quêtes
  // Pour les non-connectés : retourner un tableau vide
  const effectiveQuests = useMemo(() => {
    if (!isAuthenticated) {
      return [];
    }
    return allQuests;
  }, [isAuthenticated, allQuests]);

  // Timers pour debounce des sauvegardes
  const saveQuestsTimerRef = useRef(null);
  const saveValidationsTimerRef = useRef(null);
  const saveDailyPerformancesTimerRef = useRef(null);
  const saveUserDataTimerRef = useRef(null);
  
  // Flag pour éviter les sauvegardes pendant le chargement initial
  const isLoadingRef = useRef(true);
  
  // Refs pour stocker les valeurs actuelles pour la sauvegarde immédiate
  const allQuestsRef = useRef(allQuests);
  const userDataRef = useRef(userData);
  const validationsRef = useRef(validations);
  const dailyPerformancesRef = useRef(dailyPerformances);
  
  // Mettre à jour les refs quand les valeurs changent
  useEffect(() => {
    allQuestsRef.current = allQuests;
  }, [allQuests]);
  
  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);
  
  useEffect(() => {
    validationsRef.current = validations;
  }, [validations]);
  
  useEffect(() => {
    dailyPerformancesRef.current = dailyPerformances;
  }, [dailyPerformances]);
  
  // Fonction de sauvegarde immédiate (sans debounce) pour beforeunload
  const saveAllDataImmediately = async () => {
    if (isLoadingRef.current) return;
    
    if (!dbRef.current && storageModeRef.current === 'indexeddb') {
      const db = await openQuietQuestDB();
      if (db) dbRef.current = db;
    }
    
    const db = dbRef.current;
    const currentQuests = allQuestsRef.current;
    const currentUserData = userDataRef.current;
    const currentValidations = validationsRef.current;
    const currentDaily = dailyPerformancesRef.current;
    
    try {
      // Double sauvegarde : IndexedDB + localStorage
      if (db && storageModeRef.current === 'indexeddb') {
        try {
          await saveQuestsToIndexedDB(db, currentQuests, userId);
          await saveUserDataToIndexedDB(db, currentUserData, userId);
          await saveValidationsToIndexedDB(db, currentValidations, userId);
          await saveDailyPerformancesToIndexedDB(db, currentDaily, userId);
        } catch (error) {
          console.error('[useQuietQuestEngine] Erreur sauvegarde IndexedDB (beforeunload):', error);
        }
      }
      
      // Toujours sauvegarder dans localStorage comme backup
      saveToStorage(STORAGE_KEYS.quests, currentQuests);
      saveToStorage(STORAGE_KEYS.userData, currentUserData);
      saveToStorage(STORAGE_KEYS.validations, currentValidations);
      saveToStorage(STORAGE_KEYS.dailyPerformances, currentDaily);
      
      qqLog.debug('Sauvegarde immédiate complétée');
    } catch (error) {
      console.error('[useQuietQuestEngine] ❌ Erreur sauvegarde immédiate:', error);
    }
  };

  // Sauvegarde avant rechargement de la page
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Sauvegarder immédiatement avant le rechargement (synchronisé pour beforeunload)
      if (typeof window !== 'undefined' && navigator.sendBeacon) {
        // Utiliser sendBeacon pour les données critiques si disponible
        const data = JSON.stringify({
          userData: userDataRef.current,
          validations: validationsRef.current,
          dailyPerformances: dailyPerformancesRef.current,
        });
        try {
          const blob = new Blob([data], { type: 'application/json' });
          navigator.sendBeacon('/api/save-quietquest', blob);
        } catch (e) {
          // Fallback sur localStorage synchrone
          saveToStorage(STORAGE_KEYS.userData, userDataRef.current);
          saveToStorage(STORAGE_KEYS.validations, validationsRef.current);
          saveToStorage(STORAGE_KEYS.dailyPerformances, dailyPerformancesRef.current);
        }
      } else {
        // Sauvegarde synchrone dans localStorage
        saveToStorage(STORAGE_KEYS.userData, userDataRef.current);
        saveToStorage(STORAGE_KEYS.validations, validationsRef.current);
        saveToStorage(STORAGE_KEYS.dailyPerformances, dailyPerformancesRef.current);
      }
    };
    
    const handleVisibilityChange = () => {
      // Sauvegarder quand l'onglet devient invisible (utilisateur change d'onglet)
      if (document.hidden) {
        saveAllDataImmediately();
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('pagehide', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('pagehide', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, []);

  // Chargement initial avec migration automatique
  useEffect(() => {
    isLoadingRef.current = true;
    setIsLoading(true);
    
    const loadData = async () => {
      qqLog.debug('Début chargement données');
      
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

        qqLog.debug('IndexedDB chargé', {
          quests: indexedQuests.length,
          user: indexedUser,
          validations: indexedValidations.length,
          daily: indexedDaily.length
        });

        // Vérifier si IndexedDB a des données valides
        const hasIndexedData = indexedUser && (
          indexedUser.currentXP > 0 || 
          indexedUser.level > 1 || 
          indexedQuests.length > 0 ||
          indexedValidations.length > 0 || 
          indexedDaily.length > 0
        );

        // Si IndexedDB vide ou seulement valeurs par défaut, essayer migration depuis localStorage
        if (!hasIndexedData) {
          const localQuests = loadFromStorage(STORAGE_KEYS.quests, []);
          const localUser = loadFromStorage(STORAGE_KEYS.userData, null);
          const localValidations = loadFromStorage(STORAGE_KEYS.validations, []);
          const localDaily = loadFromStorage(STORAGE_KEYS.dailyPerformances, []);

          const hasLocalData = (localUser && (localUser.currentXP > 0 || localUser.level > 1)) ||
            localQuests.length > 0 || 
            localValidations.length > 0 || 
            localDaily.length > 0;

          if (hasLocalData) {
            qqLog.debug('Données trouvées dans localStorage, migration');
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
              qqLog.debug('Migration localStorage → IndexedDB réussie');
              // NE PAS nettoyer localStorage - garder comme backup
            } catch (error) {
              console.error('[useQuietQuestEngine] ❌ Erreur migration:', error);
            }
            
            // Charger les données migrées
            setAllQuests(Array.isArray(localQuests) ? localQuests : []);
            setUserData({ ...defaultUserData, ...(localUser || {}) });
            setValidations(Array.isArray(localValidations) ? localValidations : []);
            setDailyPerformances(Array.isArray(localDaily) ? localDaily : []);
          } else if (indexedUser) {
            // Utiliser les données IndexedDB même si elles sont par défaut
            setAllQuests(Array.isArray(indexedQuests) ? indexedQuests : []);
            setUserData({ ...defaultUserData, ...indexedUser });
            setValidations(Array.isArray(indexedValidations) ? indexedValidations : []);
            setDailyPerformances(Array.isArray(indexedDaily) ? indexedDaily : []);
          } else {
            // Pas de données, utiliser les valeurs par défaut
            setAllQuests([]);
            setUserData(defaultUserData);
            setValidations([]);
            setDailyPerformances([]);
          }
        } else {
          // Données valides dans IndexedDB
          qqLog.debug('Données chargées depuis IndexedDB');
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
      
      isLoadingRef.current = false;
      setIsLoading(false);
      qqLog.debug('Chargement terminé');
    };

    loadData();
  }, [isAuthenticated]);

  // Invalider le cache quand allQuests change
  useEffect(() => {
    questsVersionRef.current += 1;
    questsCacheRef.current.clear();
  }, [allQuests]);

  // Réagir aux créations/suppressions de quêtes (onglet ou autre instance) pour garder la sidebar et les autres vues à jour
  useEffect(() => {
    const refetchQuests = async () => {
      if (!isAuthenticated) return;
      try {
        if (dbRef.current && storageModeRef.current === 'indexeddb') {
          const fresh = await loadQuestsFromIndexedDB(dbRef.current, userId);
          setAllQuests(Array.isArray(fresh) ? fresh : []);
        } else {
          const stored = loadFromStorage(STORAGE_KEYS.quests, []);
          setAllQuests(Array.isArray(stored) ? stored : []);
        }
      } catch (e) {
        console.warn('[useQuietQuestEngine] Refetch quêtes après événement:', e);
      }
    };
    const onQuestListChange = () => {
      // Court délai pour laisser le temps à la sauvegarde (debounce 300ms) de s'écrire
      setTimeout(refetchQuests, 400);
    };
    const unsubCreate = sidebarEvents.on(SIDEBAR_EVENTS.QUEST_CREATED, onQuestListChange);
    const unsubUpdate = sidebarEvents.on(SIDEBAR_EVENTS.QUEST_UPDATED, onQuestListChange);
    return () => {
      unsubCreate();
      unsubUpdate();
    };
  }, [isAuthenticated]);

  // Créer automatiquement les quêtes "Ménage toute la semaine" et "Repas du soir" si elles n'existent pas
  useEffect(() => {
    if (!isAuthenticated) return;

    const defaultQuests = [
      {
        nom: 'Ménage toute la semaine',
        description: '',
        categorie: 'Ménage',
        difficulte: 2,
        duree: 30,
        type: 'recurrente',
        jours: [1, 2, 3, 4, 5, 6, 7],
        active: true,
      },
      {
        nom: 'Repas du soir',
        description: '',
        categorie: 'Repas',
        difficulte: 3,
        duree: 60,
        type: 'recurrente',
        jours: [1, 2, 3, 4, 5, 6, 7],
        active: true,
      },
      {
        nom: 'Poser des cv (matin)',
        description: '',
        categorie: 'Travail',
        difficulte: 4,
        duree: 35,
        type: 'recurrente',
        jours: [1, 2, 3, 4, 5, 6],
        active: true,
      },
    ];

    setAllQuests((prev) => {
      const questsToAdd = [];
      const existingNames = prev.map((q) => q.nom?.toLowerCase().trim());

      defaultQuests.forEach((defaultQuest) => {
        const questNameLower = defaultQuest.nom.toLowerCase().trim();
        if (!existingNames.includes(questNameLower)) {
          // Trouver le prochain ID disponible (gérer les IDs numériques et string)
          const numericIds = prev
            .map((q) => {
              const id = q.id;
              if (typeof id === 'number') return id;
              if (typeof id === 'string' && /^\d+$/.test(id)) return parseInt(id, 10);
              return 0;
            })
            .filter((id) => id > 0);
          const nextId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
          
          const newQuest = {
            id: nextId,
            ...defaultQuest,
            creeLe: new Date().toISOString().slice(0, 10),
            ordre: prev.length + questsToAdd.length + 1,
            xp: calculateQuestXP(defaultQuest),
          };
          questsToAdd.push(newQuest);
        }
      });

      if (questsToAdd.length > 0) {
        return [...prev, ...questsToAdd];
      }
      return prev;
    });
  }, [isAuthenticated]);

  // Sauvegardes automatiques avec debounce (300ms) + double sauvegarde
  useEffect(() => {
    // Ne pas sauvegarder pendant le chargement initial
    if (isLoadingRef.current) return;
    
    if (saveQuestsTimerRef.current) {
      clearTimeout(saveQuestsTimerRef.current);
    }
    saveQuestsTimerRef.current = setTimeout(async () => {
      const currentQuests = allQuests;
      
      if (storageModeRef.current === 'indexeddb' && dbRef.current) {
        try {
          await saveQuestsToIndexedDB(dbRef.current, currentQuests, userId);
          // Double sauvegarde : toujours sauvegarder dans localStorage aussi
          saveToStorage(STORAGE_KEYS.quests, currentQuests);
        } catch (error) {
          console.error('[useQuietQuestEngine] Erreur sauvegarde quêtes IndexedDB:', error);
          // Fallback localStorage
          saveToStorage(STORAGE_KEYS.quests, currentQuests);
        }
      } else {
        saveToStorage(STORAGE_KEYS.quests, currentQuests);
      }
    }, 300);
    return () => {
      if (saveQuestsTimerRef.current) {
        clearTimeout(saveQuestsTimerRef.current);
      }
    };
  }, [allQuests]);

  useEffect(() => {
    // Ne pas sauvegarder pendant le chargement initial
    if (isLoadingRef.current) return;
    
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
          // Double sauvegarde : toujours sauvegarder dans localStorage aussi
          saveToStorage(STORAGE_KEYS.validations, limited);
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
    // Ne pas sauvegarder pendant le chargement initial
    if (isLoadingRef.current) return;
    
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
          // Double sauvegarde : toujours sauvegarder dans localStorage aussi
          saveToStorage(STORAGE_KEYS.dailyPerformances, limited);
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
    // Ne pas sauvegarder pendant le chargement initial
    if (isLoadingRef.current) return;
    
    if (saveUserDataTimerRef.current) {
      clearTimeout(saveUserDataTimerRef.current);
    }
    saveUserDataTimerRef.current = setTimeout(async () => {
      if (storageModeRef.current === 'indexeddb' && dbRef.current) {
        try {
          await saveUserDataToIndexedDB(dbRef.current, userData, userId);
          // Double sauvegarde : toujours sauvegarder dans localStorage aussi
          saveToStorage(STORAGE_KEYS.userData, userData);
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

  const persistValidationsSnapshot = useCallback((arr) => {
    if (typeof window === 'undefined' || isLoadingRef.current) return;
    const limited = arr.length > 5000 ? arr.slice(arr.length - 5000) : arr;
    saveToStorage(STORAGE_KEYS.validations, limited);
    if (dbRef.current && storageModeRef.current === 'indexeddb') {
      saveValidationsToIndexedDB(dbRef.current, limited, userId).catch(() => {});
    }
  }, [userId]);

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

      const next = { level, currentXP, xpForNextLevel };
      if (typeof window !== 'undefined' && !isLoadingRef.current) {
        saveToStorage(STORAGE_KEYS.userData, next);
        if (dbRef.current && storageModeRef.current === 'indexeddb') {
          saveUserDataToIndexedDB(dbRef.current, next, userId).catch(() => {});
        }
      }
      return next;
    });
  };

  // Version memoized de getQuestsForDate avec cache (inclut prayerLocation pour tri des quêtes prière)
  const getQuestsForDateMemoized = useMemo(() => {
    return (targetDate) => {
      if (!targetDate) return [];
      const locKey = prayerLocation
        ? `${prayerLocation.lat},${prayerLocation.lng},${prayerLocation.method || ''},${JSON.stringify(prayerLocation.adjustments || {})}`
        : '';
      const cacheKey = `${targetDate}:${questsVersionRef.current}:${locKey}`;
      const cached = questsCacheRef.current.get(cacheKey);
      if (cached) return cached;
      const result = getQuestsForDate(effectiveQuests, targetDate, prayerLocation);
      questsCacheRef.current.set(cacheKey, result);
      if (questsCacheRef.current.size > 100) {
        const firstKey = questsCacheRef.current.keys().next().value;
        questsCacheRef.current.delete(firstKey);
      }
      return result;
    };
  }, [effectiveQuests, prayerLocation]);

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

  const toggleQuestValidation = (questId, rawDate, options = {}) => {
    const date = rawDate || getTodayDateStr();
    const quest = effectiveQuests.find((q) => q.id === questId);
    if (!quest) return;

    const xp = quest.xp ?? calculateQuestXP(quest);

    setValidations((prev) => {
      const index = prev.findIndex(
        (v) => v.queteId === questId && v.date === date
      );

      if (index !== -1) {
        // Décocher : interdire pour les jours passés pour ne pas perdre l'XP déjà gagné
        const realToday = getTodayDateStr();
        if (date < realToday) {
          return prev; // ne pas modifier : la validation passée reste cochée, l'XP est conservé
        }
        // Uncompleting quest (date = aujourd'hui uniquement)
        const copy = [...prev];
        const [removed] = copy.splice(index, 1);
        updateUserXP(-(removed?.xpGagne || xp));
        persistValidationsSnapshot(copy);
        setTimeout(() => recalcDailyPerformanceForDate(date), 0);
        
        emitSidebarEvent(SIDEBAR_EVENTS.QUEST_UPDATED, { 
          questId, 
          date, 
          completed: false,
          origin: options.origin || null,
        });
        
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
      persistValidationsSnapshot(next);
      setTimeout(() => recalcDailyPerformanceForDate(date), 0);
      
      // Emit sidebar event for quest completion (désynchronisation externe)
      emitSidebarEvent(SIDEBAR_EVENTS.QUEST_COMPLETED, { 
        questId, 
        date, 
        xp,
        origin: options.origin || null,
      });
      
      return next;
    });
  };

  const deleteQuest = useCallback((id) => {
    const quest = effectiveQuests.find((q) => q.id === id);
    const name = quest?.nom || 'cette quête';
    if (
      typeof window !== 'undefined' &&
      !window.confirm(
        `Supprimer définitivement "${name}" ?\n\nCette action est irréversible. Toutes les validations associées resteront en base.`
      )
    ) {
      return;
    }
    setAllQuests((prev) => prev.filter((q) => q.id !== id));
    emitSidebarEvent(SIDEBAR_EVENTS.QUEST_UPDATED, { questId: id, deleted: true });
  }, [effectiveQuests, setAllQuests]);

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

  // Réagir à la mise à jour de la position prière (depuis Paramètres)
  useEffect(() => {
    const onPrayerLocationUpdated = () => {
      try {
        const appState = loadFromStorage(STORAGE_KEYS.appState, {});
        const loc = appState.prayerLocation;
        setPrayerLocationState(loc && typeof loc.lat === 'number' && typeof loc.lng === 'number' ? loc : null);
      } catch {
        setPrayerLocationState(null);
      }
    };
    window.addEventListener('prayerLocationUpdated', onPrayerLocationUpdated);
    return () => window.removeEventListener('prayerLocationUpdated', onPrayerLocationUpdated);
  }, []);

  const setPrayerLocation = useCallback((loc) => {
    setPrayerLocationState(loc);
    const appState = loadFromStorage(STORAGE_KEYS.appState, {});
    saveToStorage(STORAGE_KEYS.appState, { ...appState, prayerLocation: loc || undefined });
  }, []);

  return {
    allQuests: effectiveQuests,
    setAllQuests,
    userData,
    setUserData,
    validations, // Les validations fonctionnent pour zingariello aussi
    dailyPerformances, // Les performances fonctionnent pour zingariello aussi
    validationsByDate,
    isQuestCompletedOnDate,
    toggleQuestValidation, // La validation fonctionne pour zingariello aussi
    deleteQuest,
    recalcDailyPerformanceForDate,
    getQuestsForDate: getQuestsForDateMemoized,
    isLoading,
    todayDate, // Date du jour, mise à jour après minuit (quêtes “aujourd’hui” décochées)
    prayerLocation,
    setPrayerLocation,
  };
}

export function QuietQuestProvider({ children }) {
  const value = useQuietQuestEngineImpl();
  return createElement(QuietQuestContext.Provider, { value }, children);
}

export function useQuietQuestEngine() {
  const ctx = useContext(QuietQuestContext);
  if (ctx == null) {
    throw new Error('useQuietQuestEngine doit être utilisé dans un QuietQuestProvider (voir App.jsx).');
  }
  return ctx;
}
