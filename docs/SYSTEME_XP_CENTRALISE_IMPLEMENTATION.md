# 🎯 Système XP Centralisé - Guide d'Implémentation Complet

## 📋 Vue d'Ensemble

Ce document décrit **l'état réel** du système XP centralisé dans le code actuel, ainsi que les écarts par rapport à l'objectif initial.

**Objectif visé :**
- **Persistant** : toutes les données XP sont sauvegardées dans IndexedDB, avec fallback localStorage.
- **Proportionnel** : l'XP est calculée en fonction de l'effort réel fourni.
- **Centralisé** : une barre globale agrège toutes les catégories.

**Statut actuel (important) :**
- L'infrastructure **stockage + calculs** existe (`xpStorage`, `xpCalculations`).
- Le hook global **n'est pas encore branché** aux vrais systèmes (quêtes, apprentissage, nutrition, livres, sport).
- Les hooks spécialisés **Books/Sport** et les barres associées **n'existent pas** dans le code.
- La migration automatique **n'est pas implémentée**.

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
// src/services/xp/xpStorage.js (extrait fidèle au code actuel)
const DB_NAME = 'QuietQuestDB';
const STORE_NAME = 'xpSystem';

export const openXPDB = async () => {
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      console.warn('[XPStorage] IndexedDB non disponible, utilisation localStorage');
      resolve(null);
      return;
    }

    const request = indexedDB.open(DB_NAME);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
        store.createIndex('lastUpdated', 'lastUpdated', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
};

export const saveXPData = async (xpData) => {
  const db = await openXPDB();
  if (!db) {
    localStorage.setItem(`xpData_${xpData.userId}`, JSON.stringify(xpData));
    return;
  }
  // ... écriture IndexedDB + backup localStorage
};

export const loadXPData = async (userId) => {
  const db = await openXPDB();
  if (!db) {
    const raw = localStorage.getItem(`xpData_${userId}`);
    return raw ? JSON.parse(raw) : null;
  }
  // ... lecture IndexedDB + fallback localStorage
};
```

---

## 🎨 Composants UI

### 1. Barre XP Dashboard (existant)

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
            style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
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

### 2. Barres XP Livres / Sport (absentes)

Les composants `BooksXPBar` et `SportXPBar` ne sont pas présents dans le code actuel.

---

## 🪝 Hooks Personnalisés

### 1. Hook Global XP (existant, **partiellement branché**)

Le hook existe mais **ne consomme pas encore** les données réelles des autres modules. Il utilise des données temporaires (`tempData`) et calcule donc une XP à 0 tant que l'intégration n'est pas faite.

```javascript
// src/hooks/useGlobalXP.js (extrait)
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { loadXPData, saveXPData } from '../services/xp/xpStorage';
import { calculateXPForAllCategories } from '../services/xp/xpCalculations';

// TODO: connecter useQuietQuestEngine / useApprentissageEngine / useNutritionGamification
// TODO: ajouter des hooks Books/Sport dédiés si besoin
const useGlobalXP = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const userId = currentUser?.id || 'main';
  const [xpData, setXPData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const tempData = {
    quests: { validations: [], allQuests: [] },
    learning: { globalXP: 0 },
    nutrition: { experience: { currentXP: 0 } },
    books: { totalXP: 0, breakdown: { sessions: 0, pages: 0, pagesPerHour: 0 } },
    sport: { totalXP: 0, breakdown: { reps: 0, exercises: 0, calories: 0, steps: 0, challenges: 0, sessions: 0 } }
  };

  const calculatedXP = useMemo(() => calculateXPForAllCategories(tempData), []);
  // ... chargement/écriture via loadXPData/saveXPData
};
```

### 2. Hooks Books/Sport XP (absents)

Il n'existe **pas** de hooks `useBooksXP` ou `useSportXP` dans le code.  
Si besoin, ils devront :
- agréger les données réelles (`readingSessions` pour les livres, `useWorkout` + `useGarminData` pour le sport),
- écrire dans `xpStorage` via `saveXPData`,
- mettre à jour `xpByCategory` et `details`.

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
  const questsXP = calculateQuestsXP(data.quests?.validations, data.quests?.allQuests);
  const learningXP = calculateLearningXP(data.learning);
  const nutritionXP = calculateNutritionXP(data.nutrition);
  const booksXP = data.books?.totalXP || 0;
  const sportXP = data.sport?.totalXP || 0;
  
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
          completed: data.quests?.validations?.filter(v => v.completed).length || 0,
          difficulty: {
            1: 0, 2: 0, 3: 0, 4: 0
          }
        }
      },
      learning: {
        totalXP: learningXP,
        lastCalculated: new Date().toISOString(),
        breakdown: {
          studyTime: data.learning?.totalStudyTime || 0,
          sessions: Object.values(data.learning?.subjects || {}).reduce((sum, s) => sum + (s.sessions || 0), 0),
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
        breakdown: data.books?.breakdown || { sessions: 0, pages: 0, pagesPerHour: 0 }
      },
      sport: {
        totalXP: sportXP,
        lastCalculated: new Date().toISOString(),
        breakdown: data.sport?.breakdown || { reps: 0, exercises: 0, calories: 0, steps: 0, challenges: 0, sessions: 0 }
      }
    }
  };
};
```

---

## 🔄 Migration des Données Existantes

**Non implémenté dans le code actuel.**  
Le document précédent proposait un script qui appelait des hooks React depuis un service : ce n'est **pas valide** (les hooks ne peuvent être utilisés que dans des composants ou d'autres hooks).

Si une migration est nécessaire, il faut :
- l'exécuter **dans un hook** (ex : `useGlobalXP` au premier chargement),
- ou injecter les données **déjà préparées** (sans utiliser de hooks dans le service).

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

### BooksTab.jsx / TodayTab.jsx

Pas d'intégration XP spécifique actuellement (les barres `BooksXPBar` / `SportXPBar` n'existent pas).

---

## ✅ Checklist d'Implémentation (état réel)

- [x] Créer le service de stockage XP (`src/services/xp/xpStorage.js`)
- [x] Créer les fonctions de calcul (`src/services/xp/xpCalculations.js`)
- [x] Créer le hook `useGlobalXP` (actuellement **non branché** aux vrais modules)
- [ ] Créer le hook `useBooksXP`
- [ ] Créer le hook `useSportXP`
- [x] Créer le composant `GlobalXPBar`
- [ ] Créer le composant `BooksXPBar`
- [ ] Créer le composant `SportXPBar`
- [x] Intégrer `GlobalXPBar` dans `DashboardTab`
- [ ] Intégrer `BooksXPBar` dans `BooksTab`
- [ ] Intégrer `SportXPBar` dans `TodayTab`
- [ ] Mettre en place une migration (dans un hook, sans hooks dans un service)
- [ ] Vérifier la persistance après rafraîchissement avec données réelles
- [ ] Tester les calculs avec des données réelles

---

## 🎯 Points d'Attention (écarts et risques)

1. **Branchement incomplet** : `useGlobalXP` utilise `tempData`, donc l'XP globale est à 0 tant que les vrais hooks ne sont pas connectés.
2. **Migration absente** : aucune migration automatique n'existe actuellement.
3. **Synchronisation partielle** : l'XP globale ne réagit pas aux données réelles (quêtes, apprentissage, nutrition, livres, sport).
4. **Persistance** : IndexedDB + fallback localStorage OK, mais la donnée persistée peut rester figée sans recalcul réel.
5. **Multi-utilisateur** : `userId` utilise `currentUser?.id || 'main'` (comportement à valider côté auth).

---

## 📝 Notes Finales

- Les formules XP peuvent être ajustées selon les besoins
- Le système est extensible pour ajouter de nouvelles catégories
- Les barres XP sont responsive et s'adaptent aux différentes tailles d'écran
- Les couleurs et styles peuvent être personnalisés selon le design system
