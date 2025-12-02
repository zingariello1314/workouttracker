import { useEffect, useMemo, useState } from 'react';

// Clés de stockage QuietQuest
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

// Helpers de persistance
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
 * Hook centralisant toute la logique QuietQuest (état + persistance + calculs).
 * 
 * Objectif : isoler le "moteur" pour le rendre réutilisable et testable,
 * tout en laissant les composants d'UI se concentrer sur le rendu.
 */
export function useQuietQuestEngine() {
  const [allQuests, setAllQuests] = useState([]);
  const [userData, setUserData] = useState(defaultUserData);
  const [validations, setValidations] = useState([]);
  const [dailyPerformances, setDailyPerformances] = useState([]);

  // Chargement initial
  useEffect(() => {
    const storedQuests = loadFromStorage(STORAGE_KEYS.quests, []);
    const storedUser = loadFromStorage(STORAGE_KEYS.userData, defaultUserData);
    const storedValidations = loadFromStorage(STORAGE_KEYS.validations, []);
    const storedDaily = loadFromStorage(STORAGE_KEYS.dailyPerformances, []);

    setAllQuests(Array.isArray(storedQuests) ? storedQuests : []);
    setUserData({ ...defaultUserData, ...(storedUser || {}) });
    setValidations(Array.isArray(storedValidations) ? storedValidations : []);
    setDailyPerformances(Array.isArray(storedDaily) ? storedDaily : []);
  }, []);

  // Sauvegardes automatiques
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.quests, allQuests);
  }, [allQuests]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.validations, validations);
  }, [validations]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.dailyPerformances, dailyPerformances);
  }, [dailyPerformances]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.userData, userData);
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

  const recalcDailyPerformanceForDate = (date) => {
    if (!date) return;

    const questsOfDay = getQuestsForDate(allQuests, date);
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
    const quest = allQuests.find((q) => q.id === questId);
    if (!quest) return;

    const xp = quest.xp ?? calculateQuestXP(quest);

    setValidations((prev) => {
      const index = prev.findIndex(
        (v) => v.queteId === questId && v.date === date
      );

      if (index !== -1) {
        const copy = [...prev];
        const [removed] = copy.splice(index, 1);
        updateUserXP(-(removed?.xpGagne || xp));
        setTimeout(() => recalcDailyPerformanceForDate(date), 0);
        return copy;
      }

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
      return next;
    });
  };

  // Maintenance automatique (changement de jour + cleanup > 1 an)
  useEffect(() => {
    const today = getTodayDateStr();

    const lastVisit =
      (typeof window !== 'undefined' && window.localStorage.getItem(META_KEYS.lastVisit)) ||
      null;
    if (!lastVisit || lastVisit !== today) {
      setAllQuests((prev) =>
        prev.filter(
          (q) =>
            q.type !== 'exceptionnelle' ||
            !q.date ||
            q.date >= today
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
    allQuests,
    setAllQuests,
    userData,
    setUserData,
    validations,
    dailyPerformances,
    validationsByDate,
    isQuestCompletedOnDate,
    toggleQuestValidation,
    recalcDailyPerformanceForDate,
  };
}


