# Plan d'amélioration : Statistiques QuietQuest - Tracking approfondi

## 📋 Vue d'ensemble

Ce document détaille l'implémentation complète d'un système de statistiques avancé pour l'onglet Statistiques de QuietQuest. L'objectif est de permettre un tracking approfondi des quêtes avec des métriques temporelles, catégorielles, et des insights automatiques.

---

## 🔍 Analyse du code existant

### Structure des données disponibles

#### 1. **`allQuests`** (Array)
Structure d'une quête :
```javascript
{
  id: string,                    // Identifiant unique
  nom: string,                   // Nom de la quête
  description: string,           // Description
  categorie: string,             // 'Santé', 'Travail', 'Apprentissage', 'Lecture', 'Sport', 'Ménage', 'Spirituel'
  difficulte: number,            // 1 (Facile), 2 (Moyen), 3 (Difficile), 4 (Épique)
  duree: number,                 // Durée en minutes
  type: 'recurrente' | 'exceptionnelle',
  jours: number[],               // [1-7] pour récurrentes (1=Lundi, 7=Dimanche)
  date: string,                  // 'YYYY-MM-DD' pour exceptionnelles
  active: boolean,               // Si la quête est active
  creeLe: string,                // 'YYYY-MM-DD' date de création
  ordre: number,                 // Ordre d'affichage
  xp: number                     // XP pré-calculé (optionnel)
}
```

#### 2. **`validations`** (Array)
Structure d'une validation :
```javascript
{
  queteId: string,               // ID de la quête validée
  date: string,                  // 'YYYY-MM-DD' date de validation
  xpGagne: number,               // XP gagné pour cette validation
  heureValidation: string        // ISO timestamp de validation
}
```

#### 3. **`dailyPerformances`** (Array)
Structure d'une performance quotidienne :
```javascript
{
  date: string,                  // 'YYYY-MM-DD'
  totalQuests: number,           // Nombre total de quêtes disponibles ce jour
  completedQuests: number,       // Nombre de quêtes complétées
  xpTotal: number,               // XP total gagné ce jour
  successRate: number             // Taux de réussite en % (0-100)
}
```

#### 4. **`userData`** (Object)
```javascript
{
  level: number,                 // Niveau actuel
  currentXP: number,             // XP actuel
  xpForNextLevel: number         // XP nécessaire pour niveau suivant
}
```

### Accès aux données dans le composant

**Fichier actuel** : `src/components/tabs/QuestsTab.jsx`

**Hook utilisé** : `useQuietQuestEngine()`
```javascript
const {
  allQuests,              // Toutes les quêtes
  validations,            // Toutes les validations
  dailyPerformances,      // Performances quotidiennes
  validationsByDate,      // Map<date, validations[]> (index optimisé)
  isQuestCompletedOnDate, // (questId, date) => boolean
  getQuestsForDate,       // (date) => quêtes[] (memoized)
} = useQuietQuestEngine();
```

### Bibliothèque de graphiques

**Recharts** est utilisée dans tout le projet :
```javascript
import {
  LineChart, Line,
  BarChart, Bar,
  AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
```

**Pattern utilisé** : `LazyChart` wrapper pour chargement différé
```javascript
<LazyChart height={260}>
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={chartData}>
      {/* Configuration */}
    </LineChart>
  </ResponsiveContainer>
</LazyChart>
```

---

## 📊 Spécifications détaillées par métrique

### 1. Taux de complétion par période

#### Objectif
Afficher le taux de complétion moyen pour différentes périodes (semaine, mois, 6 mois, année) avec comparaison avec la période précédente.

#### Source de données
- **`dailyPerformances`** : filtrer par période, calculer moyenne de `successRate`
- **Périodes** : 7j, 30j, 90j, 180j, 365j, all

#### Calcul
```javascript
// Fonction utilitaire pour calculer le taux de complétion moyen
const calculateCompletionRate = (performances, periodStartDate) => {
  const filtered = performances.filter(p => p.date >= periodStartDate);
  if (filtered.length === 0) return 0;
  const totalRate = filtered.reduce((sum, p) => sum + (p.successRate || 0), 0);
  return Math.round(totalRate / filtered.length);
};

// Comparaison avec période précédente
const currentPeriod = calculateCompletionRate(performances, currentStartDate);
const previousPeriod = calculateCompletionRate(performances, previousStartDate);
const variation = currentPeriod - previousPeriod;
const variationPercent = previousPeriod > 0 
  ? Math.round((variation / previousPeriod) * 100) 
  : 0;
```

#### Graphique proposé
**Type** : Barres groupées (BarChart)
- **Axe X** : Périodes (Semaine, Mois, 6 mois, Année)
- **Axe Y** : Taux de complétion (%)
- **Séries** : 
  - Barre 1 : Période actuelle
  - Barre 2 : Période précédente
- **Couleurs** : 
  - Actuelle : `#22c55e` (emerald-400)
  - Précédente : `#64748b` (slate-500)

#### Tooltip personnalisé
```javascript
const CompletionRateTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const current = payload.find(p => p.dataKey === 'current')?.value || 0;
    const previous = payload.find(p => p.dataKey === 'previous')?.value || 0;
    const variation = current - previous;
    const variationPercent = previous > 0 ? Math.round((variation / previous) * 100) : 0;
    
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-white font-medium mb-2">{label}</p>
        <p className="text-sm text-emerald-300">
          Actuelle: <span className="font-bold">{current}%</span>
        </p>
        <p className="text-sm text-slate-400">
          Précédente: <span className="font-bold">{previous}%</span>
        </p>
        {variation !== 0 && (
          <p className={`text-sm mt-1 ${variation > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {variation > 0 ? '↑' : '↓'} {Math.abs(variation)}% ({variationPercent > 0 ? '+' : ''}{variationPercent}%)
          </p>
        )}
      </div>
    );
  }
  return null;
};
```

#### Implémentation
**Fichier** : `src/components/quests/stats/CompletionRateChart.jsx`
```javascript
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LazyChart from '../../ui/LazyChart';
import { getTodayDateStr, addDays } from '../../../hooks/useQuietQuestEngine';

const CompletionRateChart = ({ dailyPerformances, selectedPeriod }) => {
  const chartData = useMemo(() => {
    const periods = [
      { key: 'week', label: 'Semaine', days: 7 },
      { key: 'month', label: 'Mois', days: 30 },
      { key: '6months', label: '6 mois', days: 180 },
      { key: 'year', label: 'Année', days: 365 },
    ];

    return periods.map(period => {
      const today = getTodayDateStr();
      const currentStart = addDays(today, -period.days);
      const previousStart = addDays(today, -period.days * 2);
      const previousEnd = addDays(today, -period.days);

      const currentPerfs = dailyPerformances.filter(p => p.date >= currentStart);
      const previousPerfs = dailyPerformances.filter(p => p.date >= previousStart && p.date < previousEnd);

      const currentRate = currentPerfs.length > 0
        ? Math.round(currentPerfs.reduce((sum, p) => sum + (p.successRate || 0), 0) / currentPerfs.length)
        : 0;
      
      const previousRate = previousPerfs.length > 0
        ? Math.round(previousPerfs.reduce((sum, p) => sum + (p.successRate || 0), 0) / previousPerfs.length)
        : 0;

      return {
        period: period.label,
        current: currentRate,
        previous: previousRate,
      };
    });
  }, [dailyPerformances]);

  return (
    <LazyChart height={300}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="period" 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
          />
          <YAxis 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            domain={[0, 100]}
          />
          <Tooltip content={<CompletionRateTooltip />} />
          <Legend />
          <Bar dataKey="current" name="Période actuelle" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="previous" name="Période précédente" fill="#64748b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </LazyChart>
  );
};

export default CompletionRateChart;
```

---

### 2. Moyennes de quêtes complétées (quotidienne, hebdomadaire, mensuelle)

#### Objectif
Afficher la moyenne de quêtes complétées par jour/semaine/mois avec évolution dans le temps.

#### Source de données
- **`dailyPerformances`** : `completedQuests` par jour
- Calculer moyennes glissantes (7j, 30j, 90j)

#### Calcul
```javascript
// Moyenne quotidienne sur N jours
const calculateDailyAverage = (performances, days) => {
  const today = getTodayDateStr();
  const startDate = addDays(today, -days);
  const filtered = performances.filter(p => p.date >= startDate);
  if (filtered.length === 0) return 0;
  const total = filtered.reduce((sum, p) => sum + (p.completedQuests || 0), 0);
  return Math.round((total / filtered.length) * 100) / 100; // 2 décimales
};

// Moyenne hebdomadaire (somme des quêtes de la semaine / 7)
const calculateWeeklyAverage = (performances) => {
  const today = getTodayDateStr();
  const weekStart = addDays(today, -7);
  const filtered = performances.filter(p => p.date >= weekStart);
  const total = filtered.reduce((sum, p) => sum + (p.completedQuests || 0), 0);
  return Math.round((total / 7) * 100) / 100;
};

// Moyenne mensuelle (somme des quêtes du mois / nombre de jours)
const calculateMonthlyAverage = (performances) => {
  const today = getTodayDateStr();
  const monthStart = addDays(today, -30);
  const filtered = performances.filter(p => p.date >= monthStart);
  const total = filtered.reduce((sum, p) => sum + (p.completedQuests || 0), 0);
  return Math.round((total / filtered.length) * 100) / 100;
};
```

#### Graphique proposé
**Type** : Ligne avec zones (AreaChart)
- **Axe X** : Date (format court : "01 Jan")
- **Axe Y** : Nombre de quêtes complétées
- **Séries** :
  - Ligne 1 : Quêtes complétées par jour (barres)
  - Ligne 2 : Moyenne mobile 7j (ligne lisse)
  - Ligne 3 : Moyenne mobile 30j (ligne lisse)
- **Couleurs** :
  - Quêtes/jour : `#22c55e` (emerald-400)
  - Moyenne 7j : `#3b82f6` (blue-500)
  - Moyenne 30j : `#8b5cf6` (purple-500)

#### Tooltip personnalisé
```javascript
const DailyAverageTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const date = new Date(label).toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
    
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-white font-medium mb-2">{date}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value.toFixed(1)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};
```

#### Implémentation
**Fichier** : `src/components/quests/stats/DailyAverageChart.jsx`
```javascript
import React, { useMemo } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LazyChart from '../../ui/LazyChart';

const DailyAverageChart = ({ dailyPerformances, selectedPeriod }) => {
  const chartData = useMemo(() => {
    // Trier par date
    const sorted = [...dailyPerformances].sort((a, b) => a.date.localeCompare(b.date));
    
    // Calculer moyennes mobiles
    return sorted.map((perf, index) => {
      // Moyenne mobile 7j
      const weekStart = Math.max(0, index - 6);
      const weekData = sorted.slice(weekStart, index + 1);
      const weekAvg = weekData.length > 0
        ? weekData.reduce((sum, p) => sum + (p.completedQuests || 0), 0) / weekData.length
        : 0;

      // Moyenne mobile 30j
      const monthStart = Math.max(0, index - 29);
      const monthData = sorted.slice(monthStart, index + 1);
      const monthAvg = monthData.length > 0
        ? monthData.reduce((sum, p) => sum + (p.completedQuests || 0), 0) / monthData.length
        : 0;

      return {
        date: perf.date,
        completed: perf.completedQuests || 0,
        avg7d: Math.round(weekAvg * 100) / 100,
        avg30d: Math.round(monthAvg * 100) / 100,
      };
    });
  }, [dailyPerformances]);

  return (
    <LazyChart height={300}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            }}
          />
          <YAxis 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
          />
          <Tooltip content={<DailyAverageTooltip />} />
          <Legend />
          <Bar dataKey="completed" name="Quêtes complétées" fill="#22c55e" opacity={0.6} />
          <Line type="monotone" dataKey="avg7d" name="Moyenne 7j" stroke="#3b82f6" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="avg30d" name="Moyenne 30j" stroke="#8b5cf6" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </LazyChart>
  );
};

export default DailyAverageChart;
```

---

### 3. Répartition par catégorie (Top 5 / Bottom 5)

#### Objectif
Afficher les catégories les plus et moins complétées avec taux de réussite.

#### Source de données
- **`validations`** : filtrer par période
- **`allQuests`** : récupérer `categorie` pour chaque validation
- Compter validations par catégorie
- Calculer taux de réussite (validations / quêtes disponibles)

#### Calcul
```javascript
// Calculer statistiques par catégorie
const calculateCategoryStats = (validations, allQuests, dailyPerformances, periodStartDate) => {
  const periodValidations = validations.filter(v => v.date >= periodStartDate);
  const categoryMap = new Map();

  // Pour chaque catégorie
  const categories = ['Santé', 'Travail', 'Apprentissage', 'Lecture', 'Sport', 'Ménage', 'Spirituel'];
  
  categories.forEach(category => {
    // Quêtes de cette catégorie
    const categoryQuests = allQuests.filter(q => q.categorie === category && q.active !== false);
    
    // Validations de cette catégorie
    const categoryValidations = periodValidations.filter(v => {
      const quest = allQuests.find(q => q.id === v.queteId);
      return quest && quest.categorie === category;
    });

    // Compter quêtes disponibles dans la période (approximation)
    const totalAvailable = categoryQuests.length * (periodValidations.length > 0 ? 
      new Set(periodValidations.map(v => v.date)).size : 1);

    // XP total gagné
    const xpTotal = categoryValidations.reduce((sum, v) => sum + (v.xpGagne || 0), 0);

    // Taux de réussite
    const completionRate = totalAvailable > 0 
      ? Math.round((categoryValidations.length / totalAvailable) * 100)
      : 0;

    categoryMap.set(category, {
      category,
      questsCount: categoryQuests.length,
      validationsCount: categoryValidations.length,
      xpTotal,
      completionRate,
    });
  });

  return Array.from(categoryMap.values());
};
```

#### Graphique proposé
**Type** : Barres horizontales (BarChart horizontal)
- **Axe X** : Nombre de validations / Taux de réussite (%)
- **Axe Y** : Catégories
- **Deux graphiques** :
  1. Top 5 catégories (triées par validations décroissant)
  2. Bottom 5 catégories (triées par validations croissant)
- **Couleurs** : Dégradé selon performance (vert = bon, rouge = faible)

#### Tooltip personnalisé
```javascript
const CategoryTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload; // Données complètes de la catégorie
    
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-white font-medium mb-2">{label}</p>
        <p className="text-sm text-slate-300">
          Quêtes: <span className="font-bold">{data.questsCount}</span>
        </p>
        <p className="text-sm text-emerald-300">
          Validations: <span className="font-bold">{data.validationsCount}</span>
        </p>
        <p className="text-sm text-blue-300">
          XP total: <span className="font-bold">{data.xpTotal.toLocaleString('fr-FR')} XP</span>
        </p>
        <p className="text-sm text-purple-300">
          Taux de réussite: <span className="font-bold">{data.completionRate}%</span>
        </p>
      </div>
    );
  }
  return null;
};
```

#### Implémentation
**Fichier** : `src/components/quests/stats/CategoryDistributionChart.jsx`
```javascript
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import LazyChart from '../../ui/LazyChart';

const CategoryDistributionChart = ({ validations, allQuests, dailyPerformances, selectedPeriod }) => {
  const { topCategories, bottomCategories } = useMemo(() => {
    const today = getTodayDateStr();
    const periodStartDate = selectedPeriod === 'all' 
      ? '2000-01-01' 
      : addDays(today, -parseInt(selectedPeriod));

    const stats = calculateCategoryStats(validations, allQuests, dailyPerformances, periodStartDate);
    
    // Trier par validations
    const sorted = [...stats].sort((a, b) => b.validationsCount - a.validationsCount);
    
    return {
      topCategories: sorted.slice(0, 5),
      bottomCategories: sorted.slice(-5).reverse(),
    };
  }, [validations, allQuests, dailyPerformances, selectedPeriod]);

  // Fonction pour déterminer la couleur selon le taux de réussite
  const getColor = (completionRate) => {
    if (completionRate >= 70) return '#22c55e'; // emerald-400
    if (completionRate >= 50) return '#3b82f6'; // blue-500
    if (completionRate >= 30) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Top 5 */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3">
        <div className="text-xs text-slate-400 mb-2 font-semibold">🏆 Top 5 Catégories</div>
        <LazyChart height={250}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={topCategories} 
              layout="vertical"
              margin={{ top: 10, right: 20, left: 60, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <YAxis 
                type="category" 
                dataKey="category" 
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                width={50}
              />
              <Tooltip content={<CategoryTooltip />} />
              <Bar dataKey="validationsCount" name="Validations">
                {topCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry.completionRate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </LazyChart>
      </div>

      {/* Bottom 5 */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3">
        <div className="text-xs text-slate-400 mb-2 font-semibold">📉 Catégories à améliorer</div>
        <LazyChart height={250}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={bottomCategories} 
              layout="vertical"
              margin={{ top: 10, right: 20, left: 60, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <YAxis 
                type="category" 
                dataKey="category" 
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                width={50}
              />
              <Tooltip content={<CategoryTooltip />} />
              <Bar dataKey="validationsCount" name="Validations">
                {bottomCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry.completionRate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </LazyChart>
      </div>
    </div>
  );
};

export default CategoryDistributionChart;
```

---

### 4. Analyse par difficulté

#### Objectif
Afficher la répartition des complétions par difficulté avec taux de réussite et XP moyen.

#### Source de données
- **`validations`** : filtrer par période
- **`allQuests`** : récupérer `difficulte` pour chaque validation

#### Calcul
```javascript
const calculateDifficultyStats = (validations, allQuests, periodStartDate) => {
  const periodValidations = validations.filter(v => v.date >= periodStartDate);
  const difficultyMap = new Map();

  [1, 2, 3, 4].forEach(difficulty => {
    const difficultyLabel = {
      1: 'Facile',
      2: 'Moyen',
      3: 'Difficile',
      4: 'Épique'
    }[difficulty];

    // Quêtes de cette difficulté
    const difficultyQuests = allQuests.filter(q => q.difficulte === difficulty && q.active !== false);
    
    // Validations de cette difficulté
    const difficultyValidations = periodValidations.filter(v => {
      const quest = allQuests.find(q => q.id === v.queteId);
      return quest && quest.difficulte === difficulty;
    });

    // XP total et moyen
    const xpTotal = difficultyValidations.reduce((sum, v) => sum + (v.xpGagne || 0), 0);
    const xpAverage = difficultyValidations.length > 0 
      ? Math.round(xpTotal / difficultyValidations.length)
      : 0;

    // Taux de réussite (approximation)
    const totalAvailable = difficultyQuests.length * (periodValidations.length > 0 ? 
      new Set(periodValidations.map(v => v.date)).size : 1);
    const completionRate = totalAvailable > 0 
      ? Math.round((difficultyValidations.length / totalAvailable) * 100)
      : 0;

    difficultyMap.set(difficulty, {
      difficulty,
      label: difficultyLabel,
      questsCount: difficultyQuests.length,
      validationsCount: difficultyValidations.length,
      xpTotal,
      xpAverage,
      completionRate,
    });
  });

  return Array.from(difficultyMap.values());
};
```

#### Graphique proposé
**Type** : Camembert (PieChart) + Barres (BarChart)
- **Graphique 1 (Pie)** : Répartition des validations par difficulté
- **Graphique 2 (Bar)** : XP moyen par difficulté
- **Couleurs** :
  - Facile (1) : `#22c55e` (emerald-400)
  - Moyen (2) : `#3b82f6` (blue-500)
  - Difficile (3) : `#f59e0b` (amber-500)
  - Épique (4) : `#ef4444` (red-500)

#### Tooltip personnalisé
```javascript
const DifficultyTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-white font-medium mb-2">{data.label}</p>
        <p className="text-sm text-slate-300">
          Quêtes: <span className="font-bold">{data.questsCount}</span>
        </p>
        <p className="text-sm text-emerald-300">
          Validations: <span className="font-bold">{data.validationsCount}</span>
        </p>
        <p className="text-sm text-blue-300">
          XP total: <span className="font-bold">{data.xpTotal.toLocaleString('fr-FR')} XP</span>
        </p>
        <p className="text-sm text-purple-300">
          XP moyen: <span className="font-bold">{data.xpAverage} XP</span>
        </p>
        <p className="text-sm text-yellow-300">
          Taux de réussite: <span className="font-bold">{data.completionRate}%</span>
        </p>
      </div>
    );
  }
  return null;
};
```

#### Implémentation
**Fichier** : `src/components/quests/stats/DifficultyAnalysisChart.jsx`
```javascript
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LazyChart from '../../ui/LazyChart';

const COLORS = {
  1: '#22c55e', // Facile - emerald
  2: '#3b82f6', // Moyen - blue
  3: '#f59e0b', // Difficile - amber
  4: '#ef4444', // Épique - red
};

const DifficultyAnalysisChart = ({ validations, allQuests, selectedPeriod }) => {
  const difficultyStats = useMemo(() => {
    const today = getTodayDateStr();
    const periodStartDate = selectedPeriod === 'all' 
      ? '2000-01-01' 
      : addDays(today, -parseInt(selectedPeriod));
    
    return calculateDifficultyStats(validations, allQuests, periodStartDate);
  }, [validations, allQuests, selectedPeriod]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Répartition (Pie) */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3">
        <div className="text-xs text-slate-400 mb-2 font-semibold">Répartition par difficulté</div>
        <LazyChart height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={difficultyStats}
                dataKey="validationsCount"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
              >
                {difficultyStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.difficulty]} />
                ))}
              </Pie>
              <Tooltip content={<DifficultyTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </LazyChart>
      </div>

      {/* XP moyen (Bar) */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3">
        <div className="text-xs text-slate-400 mb-2 font-semibold">XP moyen par difficulté</div>
        <LazyChart height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={difficultyStats} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="label" 
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
              />
              <YAxis 
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
              />
              <Tooltip content={<DifficultyTooltip />} />
              <Legend />
              <Bar dataKey="xpAverage" name="XP moyen">
                {difficultyStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.difficulty]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </LazyChart>
      </div>
    </div>
  );
};

export default DifficultyAnalysisChart;
```

---

### 5. Heatmap calendrier (activité par jour)

#### Objectif
Afficher un calendrier avec intensité de couleur selon le nombre de quêtes complétées chaque jour.

#### Source de données
- **`dailyPerformances`** : `completedQuests` par jour
- Créer une grille calendrier (semaines × jours)

#### Calcul
```javascript
const generateCalendarHeatmap = (dailyPerformances, selectedPeriod) => {
  const today = getTodayDateStr();
  const periodStartDate = selectedPeriod === 'all' 
    ? '2000-01-01' 
    : addDays(today, -parseInt(selectedPeriod));

  // Créer Map date -> completedQuests
  const dateMap = new Map();
  dailyPerformances
    .filter(p => p.date >= periodStartDate)
    .forEach(p => {
      dateMap.set(p.date, p.completedQuests || 0);
    });

  // Générer grille calendrier (12 semaines max pour lisibilité)
  const weeks = [];
  const startDate = new Date(periodStartDate);
  const endDate = new Date(today);
  
  // Ajuster au lundi de la semaine de début
  const dayOfWeek = startDate.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startDate.setDate(startDate.getDate() + diff);

  let currentDate = new Date(startDate);
  let currentWeek = [];

  while (currentDate <= endDate && weeks.length < 12) {
    const dateStr = currentDate.toISOString().slice(0, 10);
    const completed = dateMap.get(dateStr) || 0;
    
    currentWeek.push({
      date: dateStr,
      completed,
      day: currentDate.getDate(),
      month: currentDate.getMonth(),
    });

    if (currentWeek.length === 7) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
};
```

#### Graphique proposé
**Type** : Heatmap personnalisé (pas de Recharts, SVG/HTML)
- **Grille** : Semaines (lignes) × Jours (colonnes)
- **Couleurs** : Dégradé selon `completedQuests`
  - 0 : `#1e293b` (slate-800)
  - 1-2 : `#334155` (slate-700)
  - 3-5 : `#475569` (slate-600)
  - 6-8 : `#22c55e` (emerald-400)
  - 9+ : `#10b981` (emerald-500)

#### Tooltip personnalisé
```javascript
const HeatmapTooltip = ({ date, completed, totalQuests }) => {
  const dateObj = new Date(date);
  const dateStr = dateObj.toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-white font-medium mb-2">{dateStr}</p>
      <p className="text-sm text-emerald-300">
        Quêtes complétées: <span className="font-bold">{completed}</span>
      </p>
      {totalQuests > 0 && (
        <p className="text-sm text-slate-300">
          Taux de réussite: <span className="font-bold">{Math.round((completed / totalQuests) * 100)}%</span>
        </p>
      )}
    </div>
  );
};
```

#### Implémentation
**Fichier** : `src/components/quests/stats/CalendarHeatmap.jsx`
```javascript
import React, { useMemo, useState } from 'react';
import { getTodayDateStr, addDays } from '../../../hooks/useQuietQuestEngine';

const CalendarHeatmap = ({ dailyPerformances, selectedPeriod }) => {
  const [hoveredDate, setHoveredDate] = useState(null);

  const weeks = useMemo(() => {
    return generateCalendarHeatmap(dailyPerformances, selectedPeriod);
  }, [dailyPerformances, selectedPeriod]);

  // Fonction pour déterminer la couleur
  const getColor = (completed) => {
    if (completed === 0) return 'bg-slate-800';
    if (completed <= 2) return 'bg-slate-700';
    if (completed <= 5) return 'bg-slate-600';
    if (completed <= 8) return 'bg-emerald-400';
    return 'bg-emerald-500';
  };

  // Trouver le max pour normaliser
  const maxCompleted = useMemo(() => {
    return Math.max(...weeks.flat().map(d => d.completed), 1);
  }, [weeks]);

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3">
      <div className="text-xs text-slate-400 mb-4 font-semibold">Calendrier d'activité</div>
      
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Légende jours */}
          <div className="flex gap-1 mb-2">
            <div className="w-3"></div>
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
              <div key={index} className="w-3 text-xs text-slate-400 text-center">
                {day}
              </div>
            ))}
          </div>

          {/* Grille */}
          <div className="flex flex-col gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex gap-1 items-center">
                {/* Numéro de semaine (optionnel) */}
                <div className="w-3 text-xs text-slate-500 text-right">
                  {weekIndex % 4 === 0 ? weekIndex + 1 : ''}
                </div>
                
                {/* Jours de la semaine */}
                {week.map((day, dayIndex) => {
                  const intensity = day.completed / maxCompleted;
                  const opacity = Math.max(0.3, intensity);
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`w-3 h-3 rounded-sm ${getColor(day.completed)} cursor-pointer transition-all hover:scale-125 hover:z-10 relative`}
                      style={{ opacity }}
                      onMouseEnter={() => setHoveredDate(day)}
                      onMouseLeave={() => setHoveredDate(null)}
                    >
                      {hoveredDate?.date === day.date && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-20">
                          <HeatmapTooltip 
                            date={day.date} 
                            completed={day.completed}
                            totalQuests={dailyPerformances.find(p => p.date === day.date)?.totalQuests || 0}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
        <span>Moins</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-slate-800"></div>
          <div className="w-3 h-3 rounded-sm bg-slate-700"></div>
          <div className="w-3 h-3 rounded-sm bg-slate-600"></div>
          <div className="w-3 h-3 rounded-sm bg-emerald-400"></div>
          <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
        </div>
        <span>Plus</span>
      </div>
    </div>
  );
};

export default CalendarHeatmap;
```

---

### 6. Top 10 / Bottom 10 quêtes

#### Objectif
Afficher les quêtes les plus et moins complétées avec statistiques détaillées.

#### Source de données
- **`validations`** : compter validations par `queteId`
- **`allQuests`** : récupérer détails de chaque quête

#### Calcul
```javascript
const calculateQuestStats = (validations, allQuests, periodStartDate) => {
  const periodValidations = validations.filter(v => v.date >= periodStartDate);
  const questMap = new Map();

  allQuests.forEach(quest => {
    const questValidations = periodValidations.filter(v => v.queteId === quest.id);
    const validationsCount = questValidations.length;
    const xpTotal = questValidations.reduce((sum, v) => sum + (v.xpGagne || 0), 0);
    
    // Calculer taux de réussite (validations / jours disponibles dans la période)
    const daysInPeriod = periodValidations.length > 0 
      ? new Set(periodValidations.map(v => v.date)).size 
      : 1;
    const completionRate = daysInPeriod > 0 
      ? Math.round((validationsCount / daysInPeriod) * 100)
      : 0;

    questMap.set(quest.id, {
      id: quest.id,
      nom: quest.nom,
      categorie: quest.categorie,
      difficulte: quest.difficulte,
      validationsCount,
      xpTotal,
      completionRate,
      lastValidation: questValidations.length > 0
        ? questValidations[questValidations.length - 1].date
        : null,
    });
  });

  return Array.from(questMap.values());
};
```

#### Graphique proposé
**Type** : Tableau interactif (pas de graphique, liste détaillée)
- **Colonnes** : Nom, Catégorie, Difficulté, Validations, XP total, Taux, Dernière validation
- **Tri** : Par validations (décroissant pour Top 10, croissant pour Bottom 10)
- **Couleurs** : Badge de difficulté coloré

#### Implémentation
**Fichier** : `src/components/quests/stats/TopBottomQuestsTable.jsx`
```javascript
import React, { useMemo } from 'react';
import { getTodayDateStr, addDays } from '../../../hooks/useQuietQuestEngine';

const DIFFICULTY_LABELS = {
  1: { label: 'Facile', color: 'bg-emerald-500' },
  2: { label: 'Moyen', color: 'bg-blue-500' },
  3: { label: 'Difficile', color: 'bg-amber-500' },
  4: { label: 'Épique', color: 'bg-red-500' },
};

const TopBottomQuestsTable = ({ validations, allQuests, selectedPeriod }) => {
  const { topQuests, bottomQuests } = useMemo(() => {
    const today = getTodayDateStr();
    const periodStartDate = selectedPeriod === 'all' 
      ? '2000-01-01' 
      : addDays(today, -parseInt(selectedPeriod));

    const stats = calculateQuestStats(validations, allQuests, periodStartDate);
    
    const sorted = [...stats].sort((a, b) => b.validationsCount - a.validationsCount);
    
    return {
      topQuests: sorted.slice(0, 10),
      bottomQuests: sorted.slice(-10).reverse(),
    };
  }, [validations, allQuests, selectedPeriod]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Top 10 */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3">
        <div className="text-xs text-slate-400 mb-3 font-semibold">🏆 Top 10 Quêtes</div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {topQuests.map((quest, index) => (
            <div key={quest.id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs text-slate-500 w-6">#{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{quest.nom}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${DIFFICULTY_LABELS[quest.difficulte].color} text-white`}>
                      {DIFFICULTY_LABELS[quest.difficulte].label}
                    </span>
                    <span className="text-xs text-slate-400">{quest.categorie}</span>
                  </div>
                </div>
              </div>
              <div className="text-right ml-2">
                <p className="text-sm font-semibold text-emerald-300">{quest.validationsCount}</p>
                <p className="text-xs text-slate-400">{quest.xpTotal} XP</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom 10 */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3">
        <div className="text-xs text-slate-400 mb-3 font-semibold">📉 Quêtes à relancer</div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {bottomQuests.map((quest, index) => (
            <div key={quest.id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs text-slate-500 w-6">#{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{quest.nom}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${DIFFICULTY_LABELS[quest.difficulte].color} text-white`}>
                      {DIFFICULTY_LABELS[quest.difficulte].label}
                    </span>
                    <span className="text-xs text-slate-400">{quest.categorie}</span>
                  </div>
                </div>
              </div>
              <div className="text-right ml-2">
                <p className="text-sm font-semibold text-red-300">{quest.validationsCount}</p>
                <p className="text-xs text-slate-400">{quest.xpTotal} XP</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopBottomQuestsTable;
```

---

### 7. Insights automatiques avancés

#### Objectif
Générer des insights textuels intelligents basés sur les données.

#### Source de données
- Toutes les métriques calculées précédemment
- Comparaisons temporelles
- Détections de patterns

#### Calcul
```javascript
const generateInsights = (stats) => {
  const insights = [];

  // Insight 1 : Catégorie la plus productive
  if (stats.topCategory) {
    insights.push({
      type: 'success',
      icon: '🏆',
      text: `Ta catégorie la plus productive est **${stats.topCategory.categorie}** avec ${stats.topCategory.validationsCount} validations (${stats.topCategory.percentage}% du total). Continue comme ça !`,
    });
  }

  // Insight 2 : Amélioration du taux de complétion
  if (stats.completionRateVariation > 5) {
    insights.push({
      type: 'success',
      icon: '📈',
      text: `Excellent ! Ton taux de complétion a augmenté de **${stats.completionRateVariation}%** ce mois par rapport au mois dernier.`,
    });
  } else if (stats.completionRateVariation < -5) {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      text: `Attention, ton taux de complétion a baissé de **${Math.abs(stats.completionRateVariation)}%** ce mois. Relance-toi !`,
    });
  }

  // Insight 3 : Streak actuel
  if (stats.currentStreak >= 7) {
    insights.push({
      type: 'success',
      icon: '🔥',
      text: `Incroyable ! Tu es sur un streak de **${stats.currentStreak} jours** consécutifs. Ne lâche rien !`,
    });
  }

  // Insight 4 : Quête jamais complétée
  if (stats.neverCompletedQuests.length > 0) {
    insights.push({
      type: 'info',
      icon: '💡',
      text: `Tu as **${stats.neverCompletedQuests.length} quête${stats.neverCompletedQuests.length > 1 ? 's' : ''}** que tu n'as jamais complétée${stats.neverCompletedQuests.length > 1 ? 's' : ''}. Pourquoi ne pas essayer ?`,
    });
  }

  // Insight 5 : Jour le plus productif
  if (stats.mostProductiveDay) {
    insights.push({
      type: 'info',
      icon: '📅',
      text: `Ton jour le plus productif est le **${stats.mostProductiveDay.name}** avec une moyenne de ${stats.mostProductiveDay.avgQuests.toFixed(1)} quêtes complétées.`,
    });
  }

  // Insight 6 : Difficulté préférée
  if (stats.preferredDifficulty) {
    insights.push({
      type: 'info',
      icon: '🎯',
      text: `Tu complètes principalement des quêtes **${stats.preferredDifficulty.label}** (${stats.preferredDifficulty.percentage}% de tes validations).`,
    });
  }

  return insights;
};
```

#### Implémentation
**Fichier** : `src/components/quests/stats/InsightsPanel.jsx`
```javascript
import React from 'react';

const InsightsPanel = ({ insights }) => {
  if (insights.length === 0) return null;

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-900/30 border-emerald-700 text-emerald-200';
      case 'warning':
        return 'bg-amber-900/30 border-amber-700 text-amber-200';
      case 'info':
        return 'bg-blue-900/30 border-blue-700 text-blue-200';
      default:
        return 'bg-slate-800/50 border-slate-700 text-slate-200';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3">
      <div className="text-xs text-slate-400 mb-3 font-semibold">💡 Insights automatiques</div>
      <div className="space-y-2">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${getTypeStyles(insight.type)}`}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">{insight.icon}</span>
              <p
                className="text-sm leading-relaxed flex-1"
                dangerouslySetInnerHTML={{
                  __html: insight.text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>'),
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InsightsPanel;
```

---

## 🏗️ Architecture et organisation

### Structure des fichiers

```
src/components/quests/stats/
├── QuestsStatsView.jsx          # Composant principal (remplace renderStatsView)
├── charts/
│   ├── CompletionRateChart.jsx  # Taux de complétion par période
│   ├── DailyAverageChart.jsx    # Moyennes quotidiennes/hebdo/mensuelles
│   ├── CategoryDistributionChart.jsx  # Top/Bottom 5 catégories
│   ├── DifficultyAnalysisChart.jsx   # Analyse par difficulté
│   ├── CalendarHeatmap.jsx      # Heatmap calendrier
│   └── TopBottomQuestsTable.jsx # Top/Bottom 10 quêtes
├── components/
│   ├── InsightsPanel.jsx        # Panel d'insights
│   ├── PeriodSelector.jsx       # Sélecteur de période amélioré
│   └── KPICards.jsx             # Cartes KPI (XP, Streak, Taux)
└── utils/
    ├── statsCalculations.js     # Fonctions de calcul réutilisables
    └── dateHelpers.js           # Helpers dates pour stats
```

### Hook personnalisé pour les statistiques

**Fichier** : `src/hooks/useQuietQuestStats.js`
```javascript
import { useMemo } from 'react';
import { useQuietQuestEngine, getTodayDateStr, addDays } from './useQuietQuestEngine';
import {
  calculateCompletionRate,
  calculateDailyAverage,
  calculateCategoryStats,
  calculateDifficultyStats,
  calculateQuestStats,
  generateCalendarHeatmap,
  generateInsights,
} from '../components/quests/stats/utils/statsCalculations';

export const useQuietQuestStats = (selectedPeriod = '30d') => {
  const {
    allQuests,
    validations,
    dailyPerformances,
    validationsByDate,
  } = useQuietQuestEngine();

  const today = getTodayDateStr();
  const periodStartDate = selectedPeriod === 'all' 
    ? '2000-01-01' 
    : addDays(today, -parseInt(selectedPeriod));

  // Calculer toutes les métriques en une fois (memoized)
  const stats = useMemo(() => {
    return {
      // Taux de complétion
      completionRate: calculateCompletionRate(dailyPerformances, periodStartDate),
      completionRateByPeriod: calculateCompletionRateByPeriod(dailyPerformances),
      
      // Moyennes
      dailyAverage: calculateDailyAverage(dailyPerformances, 7),
      weeklyAverage: calculateDailyAverage(dailyPerformances, 30),
      monthlyAverage: calculateDailyAverage(dailyPerformances, 90),
      
      // Catégories
      categoryStats: calculateCategoryStats(validations, allQuests, dailyPerformances, periodStartDate),
      topCategory: calculateCategoryStats(validations, allQuests, dailyPerformances, periodStartDate)
        .sort((a, b) => b.validationsCount - a.validationsCount)[0],
      
      // Difficulté
      difficultyStats: calculateDifficultyStats(validations, allQuests, periodStartDate),
      
      // Quêtes
      questStats: calculateQuestStats(validations, allQuests, periodStartDate),
      topQuests: calculateQuestStats(validations, allQuests, periodStartDate)
        .sort((a, b) => b.validationsCount - a.validationsCount)
        .slice(0, 10),
      bottomQuests: calculateQuestStats(validations, allQuests, periodStartDate)
        .sort((a, b) => a.validationsCount - b.validationsCount)
        .slice(0, 10),
      
      // Calendrier
      calendarHeatmap: generateCalendarHeatmap(dailyPerformances, selectedPeriod),
      
      // Insights
      insights: generateInsights({
        topCategory: /* ... */,
        completionRateVariation: /* ... */,
        currentStreak: /* ... */,
        // ... autres données
      }),
    };
  }, [allQuests, validations, dailyPerformances, selectedPeriod, periodStartDate]);

  return stats;
};
```

---

## 📋 Plan d'implémentation en phases

### Phase 1 : Infrastructure et utilitaires (2-3h)

**Objectifs** :
- Créer la structure de dossiers
- Créer les fonctions utilitaires de calcul
- Créer le hook `useQuietQuestStats`

**Tâches** :
1. ✅ Créer `src/components/quests/stats/utils/statsCalculations.js`
   - Implémenter toutes les fonctions de calcul
   - Tester avec données de test
2. ✅ Créer `src/hooks/useQuietQuestStats.js`
   - Utiliser `useMemo` pour optimiser les calculs
   - Exposer toutes les métriques
3. ✅ Créer `src/components/quests/stats/utils/dateHelpers.js`
   - Helpers pour manipulation de dates
   - Formatage de dates pour affichage

**Critères de validation** :
- Toutes les fonctions de calcul retournent des résultats corrects
- Le hook ne recalcule que si les dépendances changent
- Pas d'erreurs de lint

---

### Phase 2 : Composants de base (3-4h)

**Objectifs** :
- Créer les composants KPI et sélecteur de période
- Créer le composant principal `QuestsStatsView`

**Tâches** :
1. ✅ Créer `src/components/quests/stats/components/KPICards.jsx`
   - 3-4 cartes KPI (XP total, Streak, Taux moyen, Moyenne quotidienne)
   - Design cohérent avec l'existant
2. ✅ Créer `src/components/quests/stats/components/PeriodSelector.jsx`
   - Sélecteur amélioré avec icônes
   - Animation de transition
3. ✅ Créer `src/components/quests/stats/QuestsStatsView.jsx`
   - Structure de base avec hook `useQuietQuestStats`
   - Intégrer KPICards et PeriodSelector
   - Remplacer `renderStatsView` dans `QuestsTab.jsx`

**Critères de validation** :
- Les KPIs s'affichent correctement
- Le sélecteur de période fonctionne
- Le composant se charge sans erreur

---

### Phase 3 : Graphiques temporels (4-5h)

**Objectifs** :
- Implémenter les graphiques de tendance temporelle

**Tâches** :
1. ✅ Créer `CompletionRateChart.jsx`
   - Barres groupées période actuelle vs précédente
   - Tooltip personnalisé avec variation
2. ✅ Créer `DailyAverageChart.jsx`
   - ComposedChart avec barres + lignes (moyennes mobiles)
   - Tooltip avec date formatée
3. ✅ Intégrer dans `QuestsStatsView.jsx`
   - Ajouter sections pour chaque graphique
   - Gérer le chargement lazy

**Critères de validation** :
- Les graphiques s'affichent correctement
- Les tooltips sont informatifs
- Les données sont correctes
- Performance acceptable (< 100ms pour calculs)

---

### Phase 4 : Graphiques catégoriels (3-4h)

**Objectifs** :
- Implémenter les analyses par catégorie et difficulté

**Tâches** :
1. ✅ Créer `CategoryDistributionChart.jsx`
   - Top 5 et Bottom 5 en barres horizontales
   - Couleurs selon performance
2. ✅ Créer `DifficultyAnalysisChart.jsx`
   - PieChart + BarChart pour difficulté
   - Tooltips détaillés
3. ✅ Intégrer dans `QuestsStatsView.jsx`

**Critères de validation** :
- Les catégories sont correctement triées
- Les couleurs reflètent la performance
- Les tooltips affichent toutes les infos

---

### Phase 5 : Heatmap et tableaux (4-5h)

**Objectifs** :
- Implémenter le heatmap calendrier et les tableaux Top/Bottom

**Tâches** :
1. ✅ Créer `CalendarHeatmap.jsx`
   - Grille calendrier avec intensité de couleur
   - Tooltip au survol
   - Légende
2. ✅ Créer `TopBottomQuestsTable.jsx`
   - Top 10 et Bottom 10 quêtes
   - Design responsive
   - Badges de difficulté
3. ✅ Intégrer dans `QuestsStatsView.jsx`

**Critères de validation** :
- Le heatmap est lisible et informatif
- Les tableaux sont triés correctement
- Le design est cohérent

---

### Phase 6 : Insights automatiques (2-3h)

**Objectifs** :
- Implémenter le système d'insights intelligents

**Tâches** :
1. ✅ Créer `InsightsPanel.jsx`
   - Affichage des insights avec icônes et couleurs
   - Support markdown pour formatage
2. ✅ Améliorer `generateInsights` dans `statsCalculations.js`
   - Ajouter plus de détections de patterns
   - Améliorer les messages
3. ✅ Intégrer dans `QuestsStatsView.jsx`

**Critères de validation** :
- Les insights sont pertinents
- Les messages sont clairs et motivants
- Le formatage est correct

---

### Phase 7 : Optimisations et polish (2-3h)

**Objectifs** :
- Optimiser les performances
- Améliorer l'UX
- Ajouter des animations

**Tâches** :
1. ✅ Optimiser les calculs avec `useMemo`
   - Vérifier que tous les calculs sont memoized
   - Éviter les recalculs inutiles
2. ✅ Améliorer les tooltips
   - Uniformiser le style
   - Ajouter plus d'informations
3. ✅ Ajouter des animations
   - Transitions smooth pour les graphiques
   - Loading states
4. ✅ Tests de performance
   - Vérifier avec 1000+ validations
   - Vérifier avec 100+ quêtes
   - Optimiser si nécessaire

**Critères de validation** :
- Performance < 200ms pour tous les calculs
- Pas de lag lors du changement de période
- UX fluide et agréable

---

## 🎨 Design et UX

### Palette de couleurs

- **Succès/Positif** : `#22c55e` (emerald-400)
- **Info** : `#3b82f6` (blue-500)
- **Attention** : `#f59e0b` (amber-500)
- **Erreur/Négatif** : `#ef4444` (red-500)
- **Neutre** : `#64748b` (slate-500)
- **Fond** : `#0f172a` (slate-900)
- **Cartes** : `#1e293b` (slate-800) avec bordure `#334155` (slate-700)

### Typographie

- **Titres** : `text-2xl md:text-3xl font-bold text-slate-100`
- **Sous-titres** : `text-lg font-semibold text-white`
- **Labels** : `text-xs text-slate-400`
- **Valeurs** : `text-xl font-semibold text-emerald-300`

### Espacements

- **Gap entre sections** : `space-y-4` ou `gap-4`
- **Padding cartes** : `px-4 py-3`
- **Marges graphiques** : `margin={{ top: 10, right: 20, left: 0, bottom: 20 }}`

---

## ✅ Checklist finale

### Phase 1 : Infrastructure ✅
- [x] `statsCalculations.js` créé avec toutes les fonctions
  - ✅ Toutes les fonctions de calcul implémentées
  - ✅ Fonctions pures et optimisées
- [x] `useQuietQuestStats.js` créé et testé
  - ✅ Hook centralisé avec useMemo pour performance
  - ✅ Gestion des cas vides (early return)
- [x] `dateHelpers.js` créé
  - ✅ Tous les helpers de dates implémentés

### Phase 2 : Composants de base ✅
- [x] `KPICards.jsx` créé
  - ✅ 4 cartes KPI (XP total, Streak, Taux, Moyenne)
- [x] `PeriodSelector.jsx` créé
  - ✅ Sélecteur amélioré avec icônes
- [x] `QuestsStatsView.jsx` créé et intégré
  - ✅ Remplace `renderStatsView` dans `QuestsTab.jsx`
  - ✅ Intégration complète avec hook

### Phase 3 : Graphiques temporels ✅
- [x] `CompletionRateChart.jsx` créé
  - ✅ Barres groupées avec comparaison période précédente
  - ✅ Tooltip personnalisé avec variation
- [x] `DailyAverageChart.jsx` créé
  - ✅ ComposedChart avec barres + lignes (moyennes mobiles)
  - ✅ Tooltip avec date formatée
- [x] Intégration dans `QuestsStatsView.jsx`
  - ✅ Tous les graphiques intégrés

### Phase 4 : Graphiques catégoriels ✅
- [x] `CategoryDistributionChart.jsx` créé
  - ✅ Top 5 et Bottom 5 en barres horizontales
  - ✅ Couleurs selon performance
- [x] `DifficultyAnalysisChart.jsx` créé
  - ✅ PieChart + BarChart pour difficulté
  - ✅ Tooltips détaillés
- [x] Intégration dans `QuestsStatsView.jsx`
  - ✅ Tous les graphiques intégrés

### Phase 5 : Heatmap et tableaux ✅
- [x] `CalendarHeatmap.jsx` créé
  - ✅ Grille calendrier avec intensité de couleur
  - ✅ Tooltip au survol
  - ✅ Légende
- [x] `TopBottomQuestsTable.jsx` créé
  - ✅ Top 10 et Bottom 10 quêtes
  - ✅ Design responsive avec badges
- [x] Intégration dans `QuestsStatsView.jsx`
  - ✅ Tous les composants intégrés

### Phase 6 : Insights ✅
- [x] Insights intégrés dans `QuestsStatsView.jsx`
  - ✅ Panel d'insights avec types (success, warning, info)
  - ✅ Formatage markdown
- [x] `generateInsights` amélioré
  - ✅ 7 types d'insights différents
  - ✅ Détection de patterns intelligente
- [x] Intégration dans `QuestsStatsView.jsx`
  - ✅ Affichage conditionnel selon données

### Phase 7 : Optimisations ✅
- [x] Tous les calculs memoized
  - ✅ `useMemo` dans tous les composants
  - ✅ Hook `useQuietQuestStats` optimisé
- [x] Tooltips uniformisés
  - ✅ Style cohérent pour tous les tooltips
  - ✅ Informations détaillées
- [x] Gestion des cas vides
  - ✅ Early returns si pas de données
  - ✅ Placeholders appropriés
- [x] Performance
  - ✅ Calculs optimisés avec filtrage préalable
  - ✅ Lazy loading des graphiques (LazyChart)

---

## 📝 Notes techniques

### Performance

1. **Memoization** : Tous les calculs doivent être dans `useMemo` avec les bonnes dépendances
2. **Lazy loading** : Utiliser `LazyChart` pour les graphiques lourds
3. **Indexation** : Utiliser `validationsByDate` (déjà disponible) pour accès rapide
4. **Limites** : Filtrer les données avant calculs (période)

### Robustesse

1. **Gestion d'erreurs** : Vérifier que les données existent avant calculs
2. **Valeurs par défaut** : Retourner 0 ou [] si pas de données
3. **Validation** : Vérifier types de données avant traitement

### Accessibilité

1. **Labels** : Tous les graphiques doivent avoir des labels clairs
2. **Couleurs** : Ne pas utiliser uniquement la couleur pour transmettre l'info
3. **Tooltips** : Accessibles au clavier (si possible)

---

**Ce document sert de référence complète pour l'implémentation. Chaque phase peut être implémentée indépendamment, permettant un développement itératif et testable.**

