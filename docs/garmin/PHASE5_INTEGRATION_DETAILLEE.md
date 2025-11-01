# 📋 PHASE 5 : INTÉGRATION AVEC AUTRES ONGLETS - PLAN DÉTAILLÉ

**Date :** 2025-01-31  
**Statut :** 🔄 **À IMPLÉMENTER**

---

## 🎯 OBJECTIF GLOBAL

Intégrer les données Garmin dans les onglets existants (`ChartsTab`, `StatsTab`, `CalendarTab`) pour offrir une vue unifiée des performances, sans nécessiter de basculer entre différents onglets.

---

## 📊 PHASE 5.1 : INTÉGRATION CHARTS TAB - SECTION GARMIN

### **Objectif**
Ajouter une section dédiée "Garmin" dans l'onglet Graphiques qui affiche les graphiques Garmin existants au même format que les autres graphiques.

### **Structure actuelle de ChartsTab**

**Fichier :** `src/components/tabs/ChartsTab.jsx`

**Caractéristiques :**
- Grille 3x3 de graphiques
- Système de configuration via `chartConfigs` array
- Filtrage par période (7j, 30j, 90j, 1an)
- Utilise `useWorkout()` pour les données
- Thème unifié avec `themeColors`

**Graphiques existants :**
1. Volume & Répétitions
2. Activité & Régularité
3. Objectifs
4. Évolution du Volume
5. Répartition Musculaire
6. Top Exercices
7. Calendrier Activité
8. Distribution Temporelle
9. Progression Individuelle
10. Boxe Activité
11. Natation Performance
12. Natation Évolution Distance
13. Natation Temps & Allure
14. Natation Volume & Régularité
15. Étirements par Zone

### **Implémentation prévue**

#### **Étape 1 : Ajouter hook useGarminData**

```javascript
import { useGarminData } from '../../hooks/useGarminData';

const ChartsTab = () => {
  const { data, getWorkoutHistory, activeProgram } = useWorkout();
  const { loadAllData, dbReady } = useGarminData(); // NOUVEAU
  
  // Charger données Garmin au montage
  const [garminData, setGarminData] = React.useState(null);
  
  React.useEffect(() => {
    if (dbReady) {
      loadAllData().then(setGarminData).catch(console.error);
    }
  }, [dbReady, loadAllData]);
  
  // ...
};
```

#### **Étape 2 : Créer composants graphiques Garmin réutilisables**

**Fichiers à créer :**

1. `src/components/tabs/charts/GarminHeartRateEvolutionChart.jsx`
   - Graphique ligne montrant l'évolution de la FC moyenne/max sur la période sélectionnée
   - Utilise `dailyMetrics` de Garmin
   - Format compatible avec `ChartsTab` (reçoit `data` et `colors` props)

2. `src/components/tabs/charts/GarminBodyBatteryEvolutionChart.jsx`
   - Graphique ligne montrant l'évolution du Body Battery
   - Moyenne par jour sur la période

3. `src/components/tabs/charts/GarminStepsEvolutionChart.jsx`
   - Graphique barres montrant l'évolution des pas quotidiens
   - Comparaison avec objectif quotidien (si disponible)

4. `src/components/tabs/charts/GarminActivitiesVolumeChart.jsx`
   - Graphique barres groupées : natation, corde à sauter, cardio
   - Volume d'activités par semaine/mois selon période

5. `src/components/tabs/charts/GarminSleepQualityChart.jsx`
   - Graphique combiné (ligne + barres) : durée sommeil + qualité
   - Comparaison durée vs recommandé (8h)

6. `src/components/tabs/charts/GarminCaloriesIntensityChart.jsx`
   - Graphique combiné : calories actives + minutes intensives
   - Deux axes Y pour visualiser corrélation

#### **Étape 3 : Ajouter section Garmin dans chartConfigs**

**Position :** Après les graphiques existants (nouvelle rangée ou intégration)

**Ajout dans `chartConfigs` :**

```javascript
// ... graphiques existants ...

// SECTION GARMIN
{
  id: 'garmin-heart-rate',
  title: 'Évolution FC Garmin',
  icon: Activity, // ou Heart icon
  color: 'red',
  bgColor: 'bg-red-500/20',
  textColor: 'text-red-400',
  component: GarminHeartRateEvolutionChart,
  props: { 
    data: chartData, // données workout existantes
    garminData: garminData, // NOUVEAU : données Garmin
    colors: themeColors,
    selectedPeriod: selectedPeriod
  },
  condition: garminData && garminData.dailyMetrics // Afficher seulement si données disponibles
},
{
  id: 'garmin-body-battery',
  title: 'Body Battery',
  icon: Zap,
  color: 'green',
  bgColor: 'bg-green-500/20',
  textColor: 'text-green-400',
  component: GarminBodyBatteryEvolutionChart,
  props: { 
    data: chartData,
    garminData: garminData,
    colors: themeColors,
    selectedPeriod: selectedPeriod
  },
  condition: garminData && garminData.dailyMetrics
},
{
  id: 'garmin-steps',
  title: 'Évolution Pas Garmin',
  icon: Activity,
  color: 'blue',
  bgColor: 'bg-blue-500/20',
  textColor: 'text-blue-400',
  component: GarminStepsEvolutionChart,
  props: { 
    data: chartData,
    garminData: garminData,
    colors: themeColors,
    selectedPeriod: selectedPeriod
  },
  condition: garminData && garminData.dailyMetrics
},
{
  id: 'garmin-activities-volume',
  title: 'Volume Activités Garmin',
  icon: Waves,
  color: 'cyan',
  bgColor: 'bg-cyan-500/20',
  textColor: 'text-cyan-400',
  component: GarminActivitiesVolumeChart,
  props: { 
    data: chartData,
    garminData: garminData,
    colors: themeColors,
    selectedPeriod: selectedPeriod
  },
  condition: garminData && garminData.activities
},
{
  id: 'garmin-sleep-quality',
  title: 'Qualité Sommeil',
  icon: Clock,
  color: 'purple',
  bgColor: 'bg-purple-500/20',
  textColor: 'text-purple-400',
  component: GarminSleepQualityChart,
  props: { 
    data: chartData,
    garminData: garminData,
    colors: themeColors,
    selectedPeriod: selectedPeriod
  },
  condition: garminData && garminData.dailyMetrics
},
{
  id: 'garmin-calories-intensity',
  title: 'Calories & Intensité',
  icon: Flame,
  color: 'orange',
  bgColor: 'bg-orange-500/20',
  textColor: 'text-orange-400',
  component: GarminCaloriesIntensityChart,
  props: { 
    data: chartData,
    garminData: garminData,
    colors: themeColors,
    selectedPeriod: selectedPeriod
  },
  condition: garminData && garminData.dailyMetrics
}
```

#### **Étape 4 : Filtrage conditionnel**

**Modifier le rendu pour afficher seulement si `condition` est true :**

```javascript
const memoizedChartConfigs = useMemo(() => 
  chartConfigs.filter(config => config.condition !== false), // Filtrer les graphiques sans condition ou avec condition=true
  [chartData, themeColors, selectedPeriod, garminData]
);

// Dans le rendu :
{memoizedChartConfigs.map((config) => {
  // Si condition est définie et false, ne pas afficher
  if (config.condition === false) return null;
  
  // ...
})}
```

#### **Étape 5 : Design cohérent**

**Séparateur visuel :**
- Ajouter un séparateur visuel entre graphiques workout et graphiques Garmin
- Titre de section "📊 Données Garmin Connect" (optionnel, peut être intégré naturellement)

**Style :**
- Utiliser le même format de carte que les autres graphiques
- Icônes cohérentes avec le thème
- Couleurs harmonieuses avec le reste de l'interface

---

## 📊 PHASE 5.2 : INTÉGRATION STATS TAB - MÉTRIQUES GARMIN

### **Objectif**
Ajouter une section "Métriques Garmin" dans l'onglet Statistiques qui affiche des statistiques agrégées des données Garmin (pas de graphiques, juste des chiffres).

### **Structure actuelle de StatsTab**

**Fichier :** `src/components/tabs/StatsTab.jsx`

**Caractéristiques :**
- Statistiques par période (semaine, mois, année)
- Calculs basés sur `workoutHistory`
- Affichage en cartes (grid)
- Section "Activités Complémentaires" pour endurance
- Sections : Total Workouts, Total Reps, Total Stretches, Active Days, Current Streak, Longest Streak

### **Implémentation prévue**

#### **Étape 1 : Ajouter hook useGarminData**

```javascript
import { useGarminData } from '../../hooks/useGarminData';

const StatsTab = () => {
  const { /* ... */ } = useWorkout();
  const { loadAllData, dbReady } = useGarminData(); // NOUVEAU
  
  const [garminData, setGarminData] = React.useState(null);
  
  React.useEffect(() => {
    if (dbReady) {
      loadAllData().then(setGarminData).catch(console.error);
    }
  }, [dbReady, loadAllData]);
  
  // ...
};
```

#### **Étape 2 : Fonction de calcul statistiques Garmin**

**Nouvelle fonction `calculateGarminStats` :**

```javascript
const calculateGarminStats = (period) => {
  if (!garminData || !garminData.dailyMetrics) {
    return null;
  }

  const now = new Date();
  let startDate;
  
  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  // Filtrer dailyMetrics par période
  const filteredMetrics = Object.entries(garminData.dailyMetrics)
    .filter(([date]) => {
      const dateObj = new Date(date);
      return dateObj >= startDate && dateObj <= now;
    })
    .map(([, metrics]) => metrics);

  if (filteredMetrics.length === 0) return null;

  // Calculer agrégations
  const stats = {
    // Pas
    totalSteps: filteredMetrics.reduce((sum, m) => sum + (m.steps || 0), 0),
    avgSteps: Math.round(filteredMetrics.reduce((sum, m) => sum + (m.steps || 0), 0) / filteredMetrics.length),
    maxSteps: Math.max(...filteredMetrics.map(m => m.steps || 0)),
    
    // Distance
    totalDistance: filteredMetrics.reduce((sum, m) => sum + (m.distance || 0), 0),
    avgDistance: filteredMetrics.reduce((sum, m) => sum + (m.distance || 0), 0) / filteredMetrics.length,
    
    // Calories
    totalCalories: filteredMetrics.reduce((sum, m) => {
      const cal = m.calories || {};
      return sum + (cal.total || cal.active || 0);
    }, 0),
    avgCalories: filteredMetrics.reduce((sum, m) => {
      const cal = m.calories || {};
      return sum + (cal.total || cal.active || 0);
    }, 0) / filteredMetrics.length,
    
    // FC
    avgRestingHR: Math.round(filteredMetrics.reduce((sum, m) => {
      const hr = m.heartRate || {};
      return sum + (hr.resting || 0);
    }, 0) / filteredMetrics.filter(m => m.heartRate?.resting).length) || 0,
    maxHR: Math.max(...filteredMetrics.map(m => {
      const hr = m.heartRate || {};
      return hr.max || 0;
    })),
    
    // Body Battery
    avgBodyBattery: Math.round(filteredMetrics.reduce((sum, m) => {
      const bb = m.bodyBattery;
      const value = typeof bb === 'object' && bb.current !== undefined ? bb.current : (typeof bb === 'number' ? bb : 0);
      return sum + value;
    }, 0) / filteredMetrics.filter(m => {
      const bb = m.bodyBattery;
      return (typeof bb === 'object' && bb.current !== undefined) || typeof bb === 'number';
    }).length) || 0,
    
    // Sommeil
    avgSleepDuration: filteredMetrics.reduce((sum, m) => {
      const sleep = m.sleep || {};
      return sum + (sleep.duration || 0);
    }, 0) / filteredMetrics.filter(m => m.sleep?.duration).length || 0,
    avgSleepQuality: Math.round(filteredMetrics.reduce((sum, m) => {
      const sleep = m.sleep || {};
      return sum + (sleep.quality || 0);
    }, 0) / filteredMetrics.filter(m => m.sleep?.quality).length) || 0,
    
    // Minutes intensives
    totalIntensityMinutes: filteredMetrics.reduce((sum, m) => {
      const intensity = m.intensityMinutes || {};
      return sum + (intensity.total || 0);
    }, 0),
    
    // Activités
    totalActivities: (garminData.activities?.swimming?.length || 0) +
                     (garminData.activities?.jumpRope?.length || 0) +
                     (garminData.activities?.cardio?.length || 0),
    
    // Jours avec données
    activeDays: filteredMetrics.length
  };

  return stats;
};
```

#### **Étape 3 : Ajouter section dans le rendu**

**Position :** Après la section "Statistiques principales" et avant "Défis d'Endurance"

**Code :**

```javascript
const garminStats = calculateGarminStats(statsPeriod);

// Dans le rendu :
{garminStats && (
  <Card className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-500/30">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-white">
        <Activity className="text-green-400" size={24} />
        Métriques Garmin Connect
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pas */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Total Pas</div>
          <div className="text-2xl font-bold text-white">{garminStats.totalSteps.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">Moy: {garminStats.avgSteps}/jour</div>
        </div>
        
        {/* Distance */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Distance Totale</div>
          <div className="text-2xl font-bold text-white">{garminStats.totalDistance.toFixed(1)} km</div>
          <div className="text-xs text-slate-500 mt-1">Moy: {garminStats.avgDistance.toFixed(1)} km/jour</div>
        </div>
        
        {/* Calories */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Calories Totales</div>
          <div className="text-2xl font-bold text-white">{garminStats.totalCalories.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">Moy: {Math.round(garminStats.avgCalories)}/jour</div>
        </div>
        
        {/* FC Repos */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">FC Repos Moy.</div>
          <div className="text-2xl font-bold text-white">{garminStats.avgRestingHR} bpm</div>
          <div className="text-xs text-slate-500 mt-1">FC Max: {garminStats.maxHR} bpm</div>
        </div>
        
        {/* Body Battery */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Body Battery Moy.</div>
          <div className="text-2xl font-bold text-white">{garminStats.avgBodyBattery}/100</div>
          <div className="text-xs text-slate-500 mt-1">Moyenne sur période</div>
        </div>
        
        {/* Sommeil */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Sommeil Moy.</div>
          <div className="text-2xl font-bold text-white">{Math.floor(garminStats.avgSleepDuration)}h{Math.round((garminStats.avgSleepDuration % 1) * 60)}m</div>
          <div className="text-xs text-slate-500 mt-1">Qualité: {garminStats.avgSleepQuality}/100</div>
        </div>
        
        {/* Minutes Intensives */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Minutes Intensives</div>
          <div className="text-2xl font-bold text-white">{garminStats.totalIntensityMinutes} min</div>
          <div className="text-xs text-slate-500 mt-1">Total sur période</div>
        </div>
        
        {/* Activités */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="text-slate-400 text-sm mb-1">Activités Garmin</div>
          <div className="text-2xl font-bold text-white">{garminStats.totalActivities}</div>
          <div className="text-xs text-slate-500 mt-1">Jours actifs: {garminStats.activeDays}</div>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

---

## 📅 PHASE 5.3 : INTÉGRATION CALENDAR TAB - ICÔNES ACTIVITÉS

### **Objectif**
Afficher des icônes d'activités Garmin dans le calendrier pour visualiser rapidement quelles activités ont été enregistrées chaque jour.

### **Structure actuelle de CalendarTab**

**Fichier :** `src/components/tabs/CalendarTab.jsx`

**Caractéristiques :**
- Utilise `CalendarHeatmap` component
- Affiche compteur de séances par jour
- Sections : Compteur de Séances, Défis d'Endurance, Graphique 7 derniers jours
- Calendrier heatmap avec intensité de couleur

### **Implémentation prévue**

#### **Étape 1 : Examiner CalendarHeatmap**

**Fichier :** `src/components/CalendarHeatmap.jsx`

**Besoin :** Comprendre comment le calendrier affiche les données pour y ajouter les icônes Garmin.

#### **Étape 2 : Fonction de calcul activités par jour**

**Nouvelle fonction `getGarminActivitiesByDate` :**

```javascript
const getGarminActivitiesByDate = useMemo(() => {
  if (!garminData || !garminData.activities) return {};
  
  const activitiesByDate = {};
  
  // Parcourir toutes les activités Garmin
  ['swimming', 'jumpRope', 'cardio'].forEach(type => {
    const activities = garminData.activities[type] || [];
    activities.forEach(activity => {
      const date = activity.date;
      if (!activitiesByDate[date]) {
        activitiesByDate[date] = [];
      }
      activitiesByDate[date].push({
        type: type,
        name: activity.activityName || activity.type,
        icon: type === 'swimming' ? '🏊' : type === 'jumpRope' ? '🪢' : '❤️'
      });
    });
  });
  
  return activitiesByDate;
}, [garminData]);
```

#### **Étape 3 : Modifier CalendarHeatmap**

**Options :**

**Option A : Modifier CalendarHeatmap directement**
- Ajouter props `garminActivities` (objet date → array activités)
- Afficher icônes dans chaque cellule du calendrier
- Position : En bas de la cellule ou en overlay

**Option B : Créer composant wrapper**
- Créer `GarminCalendarOverlay.jsx`
- Superposer les icônes sur le calendrier existant

**Recommandation : Option A (plus simple et intégré)**

**Modifications dans CalendarHeatmap.jsx :**

```javascript
// Props
CalendarHeatmap({
  sessionsCount, // existant
  garminActivities = {}, // NOUVEAU : { "2025-01-30": [{ type: "swimming", icon: "🏊" }] }
  // ...
})

// Dans le rendu de chaque cellule :
<div className="relative">
  {/* Nombre de séances existant */}
  <div className={/* ... */}>
    {count}
  </div>
  
  {/* Icônes Garmin */}
  {garminActivities[dateStr] && (
    <div className="absolute bottom-1 right-1 flex gap-1">
      {garminActivities[dateStr].slice(0, 3).map((act, idx) => (
        <span key={idx} className="text-xs" title={act.name}>
          {act.icon}
        </span>
      ))}
      {garminActivities[dateStr].length > 3 && (
        <span className="text-xs text-slate-400">+{garminActivities[dateStr].length - 3}</span>
      )}
    </div>
  )}
</div>
```

#### **Étape 4 : Passer données dans CalendarTab**

**Modifier CalendarTab.jsx :**

```javascript
const CalendarTab = () => {
  // ... code existant ...
  
  const { loadAllData, dbReady } = useGarminData(); // NOUVEAU
  const [garminData, setGarminData] = React.useState(null);
  
  React.useEffect(() => {
    if (dbReady) {
      loadAllData().then(setGarminData).catch(console.error);
    }
  }, [dbReady, loadAllData]);
  
  const garminActivitiesByDate = getGarminActivitiesByDate(garminData);
  
  // Dans le rendu :
  <CalendarHeatmap
    sessionsCount={getSessionsCount}
    garminActivities={garminActivitiesByDate} // NOUVEAU
    // ... autres props existantes ...
  />
};
```

#### **Étape 5 : Tooltip amélioré**

**Ajouter tooltip au survol des icônes :**

```javascript
// Dans CalendarHeatmap, pour chaque icône :
<span 
  key={idx} 
  className="text-xs cursor-help" 
  title={`${act.name} - ${formatDuration(activity.duration)}`}
>
  {act.icon}
</span>
```

---

## 📦 RÉCAPITULATIF DES MODIFICATIONS

### **Fichiers à modifier :**

1. **`src/components/tabs/ChartsTab.jsx`**
   - Ajouter import `useGarminData`
   - Charger données Garmin au montage
   - Ajouter 6 nouveaux graphiques dans `chartConfigs`
   - Filtrer conditionnellement l'affichage

2. **`src/components/tabs/StatsTab.jsx`**
   - Ajouter import `useGarminData`
   - Charger données Garmin
   - Créer fonction `calculateGarminStats`
   - Ajouter section "Métriques Garmin Connect" dans le rendu

3. **`src/components/tabs/CalendarTab.jsx`**
   - Ajouter import `useGarminData`
   - Charger données Garmin
   - Créer fonction `getGarminActivitiesByDate`
   - Passer `garminActivities` à `CalendarHeatmap`

4. **`src/components/CalendarHeatmap.jsx`**
   - Ajouter prop `garminActivities`
   - Afficher icônes dans chaque cellule
   - Ajouter tooltips

### **Nouveaux fichiers à créer :**

1. **`src/components/tabs/charts/GarminHeartRateEvolutionChart.jsx`**
2. **`src/components/tabs/charts/GarminBodyBatteryEvolutionChart.jsx`**
3. **`src/components/tabs/charts/GarminStepsEvolutionChart.jsx`**
4. **`src/components/tabs/charts/GarminActivitiesVolumeChart.jsx`**
5. **`src/components/tabs/charts/GarminSleepQualityChart.jsx`**
6. **`src/components/tabs/charts/GarminCaloriesIntensityChart.jsx`**

---

## ✅ CRITÈRES DE RÉUSSITE

### **PHASE 5.1 (ChartsTab)**
- ✅ 6 graphiques Garmin s'affichent dans ChartsTab
- ✅ Graphiques filtrés par période sélectionnée
- ✅ Style cohérent avec les autres graphiques
- ✅ Affichage conditionnel (seulement si données disponibles)

### **PHASE 5.2 (StatsTab)**
- ✅ Section "Métriques Garmin Connect" visible
- ✅ 8 statistiques principales affichées
- ✅ Calculs corrects selon la période sélectionnée
- ✅ Affichage conditionnel (seulement si données disponibles)

### **PHASE 5.3 (CalendarTab)**
- ✅ Icônes Garmin visibles dans le calendrier
- ✅ Maximum 3 icônes par cellule (+ compteur si plus)
- ✅ Tooltips informatifs au survol
- ✅ Style cohérent avec le calendrier existant

---

## ⏱️ ESTIMATION TEMPS

- **PHASE 5.1 :** 3-4 heures (6 graphiques + intégration)
- **PHASE 5.2 :** 1-2 heures (calculs + affichage)
- **PHASE 5.3 :** 1-2 heures (modification CalendarHeatmap)

**Total :** 5-8 heures

---

## 🎯 PRIORITÉ D'IMPLÉMENTATION

1. **PHASE 5.2** (StatsTab) - Le plus rapide et impact immédiat
2. **PHASE 5.3** (CalendarTab) - Visualisation rapide
3. **PHASE 5.1** (ChartsTab) - Le plus complexe mais le plus riche

---

**Document créé le :** 2025-01-31  
**Prêt pour implémentation :** ✅ Oui


