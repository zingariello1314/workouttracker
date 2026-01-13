# 🎯 Système XP Centralisé - Guide d'Implémentation Complet

## 📋 Vue d'Ensemble

Ce document détaille l'implémentation d'un système XP centralisé qui agrège l'expérience de tous les onglets de l'application. Le système est conçu pour être :
- **Persistant** : Toutes les données XP sont sauvegardées dans IndexedDB
- **Proportionnel** : L'XP est calculée en fonction de l'effort réel fourni
- **Intelligent** : Migration automatique des données existantes
- **Performant** : Calculs optimisés avec cache et memoization

---

## 🏗️ Architecture

### Structure des Données XP

```javascript
// Structure dans IndexedDB : xpSystem
{
  userId: string,                    // ID utilisateur (ou 'main' pour admin)
  totalXP: number,                   // XP totale cumulée
  level: number,                     // Niveau global
  xpByCategory: {                    // XP par catégorie
    quests: number,                  // XP des quêtes
    learning: number,                 // XP de l'apprentissage
    nutrition: number,                // XP de la nutrition
    books: number,                    // XP des livres
    sport: number                     // XP du sport
  },
  details: {                         // Détails par catégorie
    quests: {
      totalXP: number,
      lastCalculated: string,        // ISO date
      breakdown: {                   // Détail par type
        completed: number,
        difficulty: { [1-4]: number }
      }
    },
    learning: {
      totalXP: number,
      lastCalculated: string,
      breakdown: {
        studyTime: number,           // Minutes d'étude
        sessions: number,            // Nombre de sessions
        subjects: { [subjectId]: number } // XP par matière
      }
    },
    nutrition: {
      totalXP: number,
      lastCalculated: string,
      breakdown: {
        meals: number,
        goals: number,
        streaks: number
      }
    },
    books: {
      totalXP: number,
      lastCalculated: string,
      breakdown: {
        sessions: number,            // Nombre de sessions
        pages: number,               // Pages lues
        pagesPerHour: number,        // Vitesse moyenne
        books: { [bookId]: number } // XP par livre
      }
    },
    sport: {
      totalXP: number,
      lastCalculated: string,
      breakdown: {
        reps: number,                // Total répétitions
        exercises: number,           // Exercices cochés
        calories: number,            // Calories brûlées (Garmin)
        steps: number,               // Pas (Garmin)
        challenges: number,          // Défis complétés
        sessions: number             // Sessions complètes
      }
    }
  },
  lastUpdated: string,               // ISO timestamp
  version: string                    // Version du schéma
}
```

---

## 📊 Formules de Calcul XP

### 1. **XP Livres** 📚

#### Base de Calcul
```javascript
// XP par session de lecture
const calculateBooksXP = (sessions) => {
  let totalXP = 0;
  
  sessions.forEach(session => {
    // Base : 10 XP par session
    let sessionXP = 10;
    
    // Bonus pages : 1 XP par page lue
    sessionXP += session.pagesRead || 0;
    
    // Bonus durée : 0.5 XP par minute (max 30 min = 15 XP)
    const durationBonus = Math.min((session.durationMinutes || 0) * 0.5, 15);
    sessionXP += durationBonus;
    
    // Bonus vitesse : +20% si > 20 pages/heure, +50% si > 40 pages/heure
    if (session.durationMinutes > 0 && session.pagesRead > 0) {
      const pagesPerHour = (session.pagesRead / session.durationMinutes) * 60;
      if (pagesPerHour >= 40) {
        sessionXP *= 1.5;
      } else if (pagesPerHour >= 20) {
        sessionXP *= 1.2;
      }
    }
    
    totalXP += Math.round(sessionXP);
  });
  
  return totalXP;
};
```

#### Migration des Données Existantes
```javascript
// Récupérer toutes les sessions depuis les livres
const migrateBooksXP = async (books) => {
  const allSessions = [];
  
  books.forEach(book => {
    if (book.readingSessions && Array.isArray(book.readingSessions)) {
      book.readingSessions.forEach(session => {
        allSessions.push({
          date: session.date,
          pagesRead: session.pagesRead || 0,
          durationMinutes: session.durationMinutes || 0,
          bookId: book.id
        });
      });
    }
  });
  
  return calculateBooksXP(allSessions);
};
```

---

### 2. **XP Sport** 💪

#### Base de Calcul
```javascript
// XP par activité sportive
const calculateSportXP = (workoutData, garminData, enduranceData) => {
  let totalXP = 0;
  
  // 1. XP des répétitions : 0.1 XP par répétition
  const totalReps = Object.values(workoutData.reps || {}).reduce((sum, reps) => {
    return sum + (parseInt(reps) || 0);
  }, 0);
  totalXP += Math.round(totalReps * 0.1);
  
  // 2. XP des exercices cochés : 5 XP par exercice complété
  const checkedExercises = Object.values(workoutData.checkedExercises || {}).filter(v => v === true).length;
  totalXP += checkedExercises * 5;
  
  // 3. XP des calories (Garmin) : 0.5 XP par calorie active
  if (garminData?.dailyMetrics) {
    Object.values(garminData.dailyMetrics).forEach(day => {
      if (day.calories?.active) {
        totalXP += Math.round(day.calories.active * 0.5);
      }
    });
  }
  
  // 4. XP des pas (Garmin) : 0.01 XP par pas
  if (garminData?.dailyMetrics) {
    Object.values(garminData.dailyMetrics).forEach(day => {
      if (day.steps) {
        totalXP += Math.round(day.steps * 0.01);
      }
    });
  }
  
  // 5. XP des défis d'endurance : 50 XP par défi complété
  if (enduranceData?.challenges) {
    const completedChallenges = enduranceData.challenges.filter(c => c.status === 'completed').length;
    totalXP += completedChallenges * 50;
  }
  
  // 6. XP des sessions complètes : 25 XP par session avec feedback
  if (workoutData.sessionFeedbacks) {
    const sessionsWithFeedback = Object.keys(workoutData.sessionFeedbacks).length;
    totalXP += sessionsWithFeedback * 25;
  }
  
  return Math.round(totalXP);
};
```

#### Migration des Données Existantes
```javascript
const migrateSportXP = async (workoutData, garminData, enduranceData) => {
  return calculateSportXP(workoutData, garminData, enduranceData);
};
```

---

### 3. **XP Quêtes** ⚡

#### Base de Calcul
```javascript
// Utiliser le système existant de useQuietQuestEngine
const calculateQuestsXP = (validations, allQuests) => {
  let totalXP = 0;
  
  validations.forEach(validation => {
    const quest = allQuests.find(q => q.id === validation.questId);
    if (quest && validation.completed) {
      // Utiliser la fonction existante calculateQuestXP
      totalXP += calculateQuestXP(quest);
    }
  });
  
  return totalXP;
};
```

---

### 4. **XP Apprentissage** 📖

#### Base de Calcul
```javascript
// Utiliser le système existant de useApprentissageEngine
const calculateLearningXP = (progressionData) => {
  // L'XP est déjà calculée dans progressionData.globalXP
  return progressionData.globalXP || 0;
};
```

---

### 5. **XP Nutrition** 🥗

#### Base de Calcul
```javascript
// Utiliser le système existant de useNutritionGamification
const calculateNutritionXP = (gamificationData) => {
  // L'XP est déjà calculée dans gamificationData.experience.currentXP
  return gamificationData?.experience?.currentXP || 0;
};
```

---

## 🗄️ Persistance IndexedDB

### Structure de la Base de Données

```javascript
// Store: xpSystem
{
  keyPath: 'userId',
  indexes: [
    { name: 'lastUpdated', unique: false }
  ]
}
```

### Fonctions de Persistance

```javascript
// src/services/xp/xpStorage.js
import { openDB } from '../indexedDB';

const DB_NAME = 'QuietQuestDB';
const STORE_NAME = 'xpSystem';

export const openXPDB = async () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
        store.createIndex('lastUpdated', 'lastUpdated', { unique: false });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveXPData = async (xpData) => {
  const db = await openXPDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.put({
      ...xpData,
      lastUpdated: new Date().toISOString()
    });
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const loadXPData = async (userId) => {
  const db = await openXPDB();
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.get(userId);
    
    request.onsuccess = () => {
      resolve(request.result || null);
    };
    
    request.onerror = () => reject(request.error);
  });
};
```

---

## 🎨 Composants UI

### 1. Barre XP Dashboard

```javascript
// src/components/dashboard/GlobalXPBar.jsx
import React from 'react';
import { useGlobalXP } from '../../hooks/useGlobalXP';
import { Star, TrendingUp, BookOpen, Dumbbell, Target, Apple } from 'lucide-react';

const GlobalXPBar = () => {
  const { totalXP, level, xpByCategory, progress } = useGlobalXP();
  
  const categories = [
    { key: 'quests', label: 'Quêtes', icon: Target, color: 'purple' },
    { key: 'learning', label: 'Apprentissage', icon: BookOpen, color: 'blue' },
    { key: 'nutrition', label: 'Nutrition', icon: Apple, color: 'green' },
    { key: 'books', label: 'Livres', icon: BookOpen, color: 'indigo' },
    { key: 'sport', label: 'Sport', icon: Dumbbell, color: 'red' }
  ];
  
  return (
    <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Star className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Niveau {level}</h3>
            <p className="text-sm text-slate-400">{totalXP.toLocaleString('fr-FR')} XP total</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">Prochain niveau</div>
          <div className="text-lg font-bold text-white">{progress.xpNeeded} XP</div>
        </div>
      </div>
      
      {/* Barre de progression principale */}
      <div className="mb-4">
        <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>
      
      {/* Détail par catégorie */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {categories.map(category => {
          const Icon = category.icon;
          const xp = xpByCategory[category.key] || 0;
          const percent = totalXP > 0 ? (xp / totalXP) * 100 : 0;
          
          return (
            <div
              key={category.key}
              className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 text-${category.color}-400`} />
                <span className="text-xs text-slate-400">{category.label}</span>
              </div>
              <div className="text-lg font-bold text-white">{xp.toLocaleString('fr-FR')}</div>
              <div className="text-xs text-slate-500">{percent.toFixed(1)}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GlobalXPBar;
```

### 2. Barre XP Livres

```javascript
// src/components/tabs/BooksTab/components/BooksXPBar.jsx
import React from 'react';
import { useBooksXP } from '../../../hooks/useBooksXP';
import { BookOpen, Clock, FileText, TrendingUp } from 'lucide-react';

const BooksXPBar = () => {
  const { totalXP, level, breakdown, progress } = useBooksXP();
  
  return (
    <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold text-white">Niveau {level}</span>
        </div>
        <span className="text-sm text-slate-300">{totalXP.toLocaleString('fr-FR')} XP</span>
      </div>
      
      <div className="w-full bg-slate-700 rounded-full h-2 mb-3">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <FileText className="w-3 h-3 text-indigo-400" />
          <span className="text-slate-400">{breakdown.sessions} sessions</span>
        </div>
        <div className="flex items-center gap-1">
          <BookOpen className="w-3 h-3 text-indigo-400" />
          <span className="text-slate-400">{breakdown.pages} pages</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-indigo-400" />
          <span className="text-slate-400">{breakdown.pagesPerHour.toFixed(1)} p/h</span>
        </div>
      </div>
    </div>
  );
};

export default BooksXPBar;
```

### 3. Barre XP Sport

```javascript
// src/components/tabs/TodayTab/components/SportXPBar.jsx
import React from 'react';
import { useSportXP } from '../../../hooks/useSportXP';
import { Dumbbell, Flame, Footprints, Target, CheckCircle } from 'lucide-react';

const SportXPBar = () => {
  const { totalXP, level, breakdown, progress } = useSportXP();
  
  return (
    <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/30 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-red-400" />
          <span className="font-semibold text-white">Niveau {level}</span>
        </div>
        <span className="text-sm text-slate-300">{totalXP.toLocaleString('fr-FR')} XP</span>
      </div>
      
      <div className="w-full bg-slate-700 rounded-full h-2 mb-3">
        <div
          className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <Dumbbell className="w-3 h-3 text-red-400" />
          <span className="text-slate-400">{breakdown.reps.toLocaleString('fr-FR')} reps</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-red-400" />
          <span className="text-slate-400">{breakdown.exercises} exercices</span>
        </div>
        <div className="flex items-center gap-1">
          <Flame className="w-3 h-3 text-red-400" />
          <span className="text-slate-400">{breakdown.calories.toLocaleString('fr-FR')} cal</span>
        </div>
        <div className="flex items-center gap-1">
          <Footprints className="w-3 h-3 text-red-400" />
          <span className="text-slate-400">{breakdown.steps.toLocaleString('fr-FR')} pas</span>
        </div>
        <div className="flex items-center gap-1">
          <Target className="w-3 h-3 text-red-400" />
          <span className="text-slate-400">{breakdown.challenges} défis</span>
        </div>
      </div>
    </div>
  );
};

export default SportXPBar;
```

---

## 🪝 Hooks Personnalisés

### 1. Hook Global XP

```javascript
// src/hooks/useGlobalXP.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuietQuestEngine } from './useQuietQuestEngine';
import { useApprentissageEngine } from './useApprentissageEngine';
import { useNutritionGamification } from './useNutritionGamification';
import { useBooksXP } from './useBooksXP';
import { useSportXP } from './useSportXP';
import { loadXPData, saveXPData } from '../services/xp/xpStorage';
import { calculateXPForAllCategories } from '../services/xp/xpCalculations';

export const useGlobalXP = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const userId = currentUser?.id || 'main';
  
  const [xpData, setXPData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Récupérer les données de chaque système
  const { userData: questsData, validations, effectiveQuests } = useQuietQuestEngine();
  const { progressionData } = useApprentissageEngine();
  const { gamificationData } = useNutritionGamification();
  const { totalXP: booksXP, breakdown: booksBreakdown } = useBooksXP();
  const { totalXP: sportXP, breakdown: sportBreakdown } = useSportXP();
  
  // Calculer l'XP totale
  const calculatedXP = useMemo(() => {
    return calculateXPForAllCategories({
      quests: { validations, allQuests: effectiveQuests },
      learning: progressionData,
      nutrition: gamificationData,
      books: { totalXP: booksXP, breakdown: booksBreakdown },
      sport: { totalXP: sportXP, breakdown: sportBreakdown }
    });
  }, [validations, effectiveQuests, progressionData, gamificationData, booksXP, sportXP]);
  
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
    if (!xpData) return { level: 1, xpForNextLevel: 100, progress: { percent: 0, xpNeeded: 100 } };
    
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
```

### 2. Hook Books XP

```javascript
// src/hooks/useBooksXP.js
import { useState, useEffect, useMemo } from 'react';
import { useBooksStorage } from './useBooksStorage';
import { calculateBooksXP } from '../services/xp/xpCalculations';
import { loadXPData, saveXPData } from '../services/xp/xpStorage';
import { useAuth } from '../context/AuthContext';

export const useBooksXP = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const userId = currentUser?.id || 'main';
  const { books } = useBooksStorage();
  
  const [xpData, setXPData] = useState(null);
  
  // Calculer l'XP depuis les sessions
  const calculatedXP = useMemo(() => {
    if (!books || books.length === 0) return { totalXP: 0, breakdown: { sessions: 0, pages: 0, pagesPerHour: 0 } };
    
    const allSessions = [];
    let totalPages = 0;
    let totalMinutes = 0;
    
    books.forEach(book => {
      if (book.readingSessions && Array.isArray(book.readingSessions)) {
        book.readingSessions.forEach(session => {
          allSessions.push(session);
          totalPages += session.pagesRead || 0;
          totalMinutes += session.durationMinutes || 0;
        });
      }
    });
    
    const totalXP = calculateBooksXP(allSessions);
    const pagesPerHour = totalMinutes > 0 ? (totalPages / totalMinutes) * 60 : 0;
    
    return {
      totalXP,
      breakdown: {
        sessions: allSessions.length,
        pages: totalPages,
        pagesPerHour: Math.round(pagesPerHour * 10) / 10
      }
    };
  }, [books]);
  
  // Charger/sauvegarder
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const syncXP = async () => {
      const saved = await loadXPData(userId);
      const booksXPData = saved?.details?.books || null;
      
      if (!booksXPData || booksXPData.totalXP !== calculatedXP.totalXP) {
        // Mettre à jour dans les données globales
        const globalData = saved || { userId, totalXP: 0, xpByCategory: {}, details: {}, version: '1.0' };
        globalData.details.books = {
          totalXP: calculatedXP.totalXP,
          lastCalculated: new Date().toISOString(),
          breakdown: calculatedXP.breakdown
        };
        globalData.xpByCategory.books = calculatedXP.totalXP;
        globalData.totalXP = Object.values(globalData.xpByCategory).reduce((sum, xp) => sum + xp, 0);
        
        await saveXPData(globalData);
        setXPData(calculatedXP);
      } else {
        setXPData({ totalXP: booksXPData.totalXP, breakdown: booksXPData.breakdown });
      }
    };
    
    syncXP();
  }, [calculatedXP, userId, isAuthenticated]);
  
  // Calculer niveau et progression
  const levelInfo = useMemo(() => {
    const totalXP = xpData?.totalXP || 0;
    const level = Math.floor(totalXP / 500) + 1;
    const xpForCurrentLevel = (level - 1) * 500;
    const xpForNextLevel = level * 500;
    const xpProgress = totalXP - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - totalXP;
    const percent = ((xpProgress / (xpForNextLevel - xpForCurrentLevel)) * 100);
    
    return {
      level,
      progress: {
        percent: Math.min(100, Math.max(0, percent)),
        xpNeeded
      }
    };
  }, [xpData]);
  
  return {
    totalXP: xpData?.totalXP || 0,
    level: levelInfo.level,
    breakdown: xpData?.breakdown || { sessions: 0, pages: 0, pagesPerHour: 0 },
    progress: levelInfo.progress
  };
};
```

### 3. Hook Sport XP

```javascript
// src/hooks/useSportXP.js
import { useState, useEffect, useMemo } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useGarminData } from './useGarminData';
import { calculateSportXP } from '../services/xp/xpCalculations';
import { loadXPData, saveXPData } from '../services/xp/xpStorage';
import { useAuth } from '../context/AuthContext';

export const useSportXP = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const userId = currentUser?.id || 'main';
  const { data: workoutData } = useWorkout();
  const { loadAllData: loadGarminData } = useGarminData();
  
  const [xpData, setXPData] = useState(null);
  const [garminData, setGarminData] = useState(null);
  
  // Charger données Garmin
  useEffect(() => {
    if (!isAuthenticated) return;
    
    loadGarminData().then(data => {
      setGarminData(data);
    }).catch(error => {
      console.error('Erreur chargement Garmin:', error);
    });
  }, [isAuthenticated, loadGarminData]);
  
  // Calculer l'XP
  const calculatedXP = useMemo(() => {
    if (!workoutData) return { totalXP: 0, breakdown: { reps: 0, exercises: 0, calories: 0, steps: 0, challenges: 0, sessions: 0 } };
    
    const result = calculateSportXP(workoutData, garminData, workoutData.enduranceData);
    return result;
  }, [workoutData, garminData]);
  
  // Charger/sauvegarder
  useEffect(() => {
    if (!isAuthenticated || !calculatedXP) return;
    
    const syncXP = async () => {
      const saved = await loadXPData(userId);
      const sportXPData = saved?.details?.sport || null;
      
      if (!sportXPData || sportXPData.totalXP !== calculatedXP.totalXP) {
        const globalData = saved || { userId, totalXP: 0, xpByCategory: {}, details: {}, version: '1.0' };
        globalData.details.sport = {
          totalXP: calculatedXP.totalXP,
          lastCalculated: new Date().toISOString(),
          breakdown: calculatedXP.breakdown
        };
        globalData.xpByCategory.sport = calculatedXP.totalXP;
        globalData.totalXP = Object.values(globalData.xpByCategory).reduce((sum, xp) => sum + xp, 0);
        
        await saveXPData(globalData);
        setXPData(calculatedXP);
      } else {
        setXPData({ totalXP: sportXPData.totalXP, breakdown: sportXPData.breakdown });
      }
    };
    
    syncXP();
  }, [calculatedXP, userId, isAuthenticated]);
  
  // Calculer niveau et progression
  const levelInfo = useMemo(() => {
    const totalXP = xpData?.totalXP || 0;
    const level = Math.floor(totalXP / 1000) + 1;
    const xpForCurrentLevel = (level - 1) * 1000;
    const xpForNextLevel = level * 1000;
    const xpProgress = totalXP - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - totalXP;
    const percent = ((xpProgress / (xpForNextLevel - xpForCurrentLevel)) * 100);
    
    return {
      level,
      progress: {
        percent: Math.min(100, Math.max(0, percent)),
        xpNeeded
      }
    };
  }, [xpData]);
  
  return {
    totalXP: xpData?.totalXP || 0,
    level: levelInfo.level,
    breakdown: xpData?.breakdown || { reps: 0, exercises: 0, calories: 0, steps: 0, challenges: 0, sessions: 0 },
    progress: levelInfo.progress
  };
};
```

---

## 🔧 Services de Calcul

### Service Principal

```javascript
// src/services/xp/xpCalculations.js

// Calcul XP Livres
export const calculateBooksXP = (sessions) => {
  let totalXP = 0;
  
  sessions.forEach(session => {
    let sessionXP = 10; // Base
    
    sessionXP += session.pagesRead || 0; // 1 XP par page
    
    const durationBonus = Math.min((session.durationMinutes || 0) * 0.5, 15);
    sessionXP += durationBonus;
    
    if (session.durationMinutes > 0 && session.pagesRead > 0) {
      const pagesPerHour = (session.pagesRead / session.durationMinutes) * 60;
      if (pagesPerHour >= 40) {
        sessionXP *= 1.5;
      } else if (pagesPerHour >= 20) {
        sessionXP *= 1.2;
      }
    }
    
    totalXP += Math.round(sessionXP);
  });
  
  return totalXP;
};

// Calcul XP Sport
export const calculateSportXP = (workoutData, garminData, enduranceData) => {
  let totalXP = 0;
  const breakdown = {
    reps: 0,
    exercises: 0,
    calories: 0,
    steps: 0,
    challenges: 0,
    sessions: 0
  };
  
  // Répétitions
  const totalReps = Object.values(workoutData.reps || {}).reduce((sum, reps) => {
    return sum + (parseInt(reps) || 0);
  }, 0);
  breakdown.reps = totalReps;
  totalXP += Math.round(totalReps * 0.1);
  
  // Exercices cochés
  const checkedExercises = Object.values(workoutData.checkedExercises || {}).filter(v => v === true).length;
  breakdown.exercises = checkedExercises;
  totalXP += checkedExercises * 5;
  
  // Calories Garmin
  if (garminData?.dailyMetrics) {
    let totalCalories = 0;
    Object.values(garminData.dailyMetrics).forEach(day => {
      if (day.calories?.active) {
        totalCalories += day.calories.active;
      }
    });
    breakdown.calories = totalCalories;
    totalXP += Math.round(totalCalories * 0.5);
  }
  
  // Pas Garmin
  if (garminData?.dailyMetrics) {
    let totalSteps = 0;
    Object.values(garminData.dailyMetrics).forEach(day => {
      if (day.steps) {
        totalSteps += day.steps;
      }
    });
    breakdown.steps = totalSteps;
    totalXP += Math.round(totalSteps * 0.01);
  }
  
  // Défis
  if (enduranceData?.challenges) {
    const completedChallenges = enduranceData.challenges.filter(c => c.status === 'completed').length;
    breakdown.challenges = completedChallenges;
    totalXP += completedChallenges * 50;
  }
  
  // Sessions avec feedback
  if (workoutData.sessionFeedbacks) {
    const sessionsWithFeedback = Object.keys(workoutData.sessionFeedbacks).length;
    breakdown.sessions = sessionsWithFeedback;
    totalXP += sessionsWithFeedback * 25;
  }
  
  return {
    totalXP: Math.round(totalXP),
    breakdown
  };
};

// Calcul XP Quêtes (utilise système existant)
export const calculateQuestsXP = (validations, allQuests) => {
  let totalXP = 0;
  
  validations.forEach(validation => {
    const quest = allQuests.find(q => q.id === validation.questId);
    if (quest && validation.completed) {
      const base = DIFFICULTY_XP_BASE[quest.difficulte] || DIFFICULTY_XP_BASE[1];
      const multiplier = (quest.duree || 60) / 60;
      totalXP += Math.round(base * multiplier);
    }
  });
  
  return totalXP;
};

// Calcul XP Apprentissage (utilise système existant)
export const calculateLearningXP = (progressionData) => {
  return progressionData.globalXP || 0;
};

// Calcul XP Nutrition (utilise système existant)
export const calculateNutritionXP = (gamificationData) => {
  return gamificationData?.experience?.currentXP || 0;
};

// Calcul global de toutes les catégories
export const calculateXPForAllCategories = (data) => {
  const questsXP = calculateQuestsXP(data.quests.validations, data.quests.allQuests);
  const learningXP = calculateLearningXP(data.learning);
  const nutritionXP = calculateNutritionXP(data.nutrition);
  const booksXP = data.books.totalXP || 0;
  const sportXP = data.sport.totalXP || 0;
  
  const totalXP = questsXP + learningXP + nutritionXP + booksXP + sportXP;
  
  return {
    totalXP,
    xpByCategory: {
      quests: questsXP,
      learning: learningXP,
      nutrition: nutritionXP,
      books: booksXP,
      sport: sportXP
    },
    details: {
      quests: {
        totalXP: questsXP,
        lastCalculated: new Date().toISOString(),
        breakdown: {
          completed: data.quests.validations.filter(v => v.completed).length,
          difficulty: {
            1: 0, 2: 0, 3: 0, 4: 0
          }
        }
      },
      learning: {
        totalXP: learningXP,
        lastCalculated: new Date().toISOString(),
        breakdown: {
          studyTime: data.learning.totalStudyTime || 0,
          sessions: Object.values(data.learning.subjects || {}).reduce((sum, s) => sum + (s.sessions || 0), 0),
          subjects: {}
        }
      },
      nutrition: {
        totalXP: nutritionXP,
        lastCalculated: new Date().toISOString(),
        breakdown: {
          meals: 0,
          goals: 0,
          streaks: 0
        }
      },
      books: {
        totalXP: booksXP,
        lastCalculated: new Date().toISOString(),
        breakdown: data.books.breakdown || { sessions: 0, pages: 0, pagesPerHour: 0 }
      },
      sport: {
        totalXP: sportXP,
        lastCalculated: new Date().toISOString(),
        breakdown: data.sport.breakdown || { reps: 0, exercises: 0, calories: 0, steps: 0, challenges: 0, sessions: 0 }
      }
    }
  };
};
```

---

## 🔄 Migration des Données Existantes

### Script de Migration

```javascript
// src/services/xp/xpMigration.js
import { loadXPData, saveXPData } from './xpStorage';
import { calculateXPForAllCategories } from './xpCalculations';
import { useQuietQuestEngine } from '../../hooks/useQuietQuestEngine';
import { useApprentissageEngine } from '../../hooks/useApprentissageEngine';
import { useNutritionGamification } from '../../hooks/useNutritionGamification';
import { useBooksStorage } from '../../hooks/useBooksStorage';
import { useWorkout } from '../../context/WorkoutContext';
import { useGarminData } from '../../hooks/useGarminData';

export const migrateExistingXPData = async (userId) => {
  // Récupérer toutes les données existantes
  const questsData = useQuietQuestEngine();
  const learningData = useApprentissageEngine();
  const nutritionData = useNutritionGamification();
  const { books } = useBooksStorage();
  const { data: workoutData } = useWorkout();
  const { loadAllData: loadGarminData } = useGarminData();
  
  const garminData = await loadGarminData();
  
  // Calculer l'XP pour chaque catégorie
  const allSessions = [];
  books.forEach(book => {
    if (book.readingSessions) {
      allSessions.push(...book.readingSessions);
    }
  });
  
  const booksXP = calculateBooksXP(allSessions);
  const sportXP = calculateSportXP(workoutData, garminData, workoutData.enduranceData);
  
  const xpData = calculateXPForAllCategories({
    quests: {
      validations: questsData.validations,
      allQuests: questsData.effectiveQuests
    },
    learning: learningData.progressionData,
    nutrition: nutritionData.gamificationData,
    books: {
      totalXP: booksXP,
      breakdown: {
        sessions: allSessions.length,
        pages: allSessions.reduce((sum, s) => sum + (s.pagesRead || 0), 0),
        pagesPerHour: 0 // Calculé dynamiquement
      }
    },
    sport: {
      totalXP: sportXP.totalXP,
      breakdown: sportXP.breakdown
    }
  });
  
  // Sauvegarder
  const finalData = {
    userId,
    ...xpData,
    version: '1.0',
    lastUpdated: new Date().toISOString()
  };
  
  await saveXPData(finalData);
  return finalData;
};
```

---

## 📍 Intégration dans les Composants

### DashboardTab.jsx

```javascript
// Ajouter la barre XP au-dessus de NewsBlock
import GlobalXPBar from '../dashboard/GlobalXPBar';

// Dans le return, avant NewsBlock :
<div className="space-y-6">
  <GlobalXPBar />
  <NewsBlock newsData={newsData} onRefresh={refreshNews} />
</div>
```

### BooksTab.jsx

```javascript
// Ajouter la barre XP en haut de l'onglet
import BooksXPBar from './components/BooksXPBar';

// Dans le return, en haut :
<BooksXPBar />
```

### TodayTab.jsx (Sport)

```javascript
// Ajouter la barre XP en haut de l'onglet
import SportXPBar from './components/SportXPBar';

// Dans le return, en haut :
<SportXPBar />
```

---

## ✅ Checklist d'Implémentation

- [ ] Créer le service de stockage XP (`src/services/xp/xpStorage.js`)
- [ ] Créer les fonctions de calcul (`src/services/xp/xpCalculations.js`)
- [ ] Créer le hook `useGlobalXP`
- [ ] Créer le hook `useBooksXP`
- [ ] Créer le hook `useSportXP`
- [ ] Créer le composant `GlobalXPBar`
- [ ] Créer le composant `BooksXPBar`
- [ ] Créer le composant `SportXPBar`
- [ ] Intégrer `GlobalXPBar` dans `DashboardTab`
- [ ] Intégrer `BooksXPBar` dans `BooksTab`
- [ ] Intégrer `SportXPBar` dans `TodayTab`
- [ ] Tester la migration des données existantes
- [ ] Vérifier la persistance après rafraîchissement
- [ ] Tester les calculs avec des données réelles

---

## 🎯 Points d'Attention

1. **Performance** : Les calculs sont memoizés pour éviter les recalculs inutiles
2. **Persistance** : Toutes les données sont sauvegardées dans IndexedDB avec backup localStorage
3. **Migration** : Les données existantes sont automatiquement migrées au premier chargement
4. **Synchronisation** : L'XP est recalculée automatiquement quand les données sources changent
5. **Isolation** : Chaque utilisateur a ses propres données XP (multi-utilisateurs)

---

## 📝 Notes Finales

- Les formules XP peuvent être ajustées selon les besoins
- Le système est extensible pour ajouter de nouvelles catégories
- Les barres XP sont responsive et s'adaptent aux différentes tailles d'écran
- Les couleurs et styles peuvent être personnalisés selon le design system
