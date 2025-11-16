# 🔍 CONTRE-ANALYSE APPROFONDIE - SOUS-ONGLET ANALYSES

**Date** : 2025-01-16  
**Analysé par** : AI Assistant  
**Méthodologie** : Analyse complète ligne par ligne de tous les fichiers du sous-onglet Analyses

---

## 📋 SCOPING

**Fichiers analysés en profondeur** :
- ✅ `src/components/tabs/nutrition/components/NutritionAnalyses.jsx` (751 lignes)
- ✅ `src/components/tabs/nutrition/components/NutritionRecommendations.jsx` (244 lignes)
- ✅ `src/components/tabs/nutrition/components/NutritionCorrelations.jsx` (355 lignes)
- ✅ `src/components/tabs/nutrition/components/NutritionChronobiology.jsx` (240 lignes)
- ✅ `src/components/tabs/nutrition/components/NutritionHealthScore.jsx` (350 lignes)
- ✅ `src/hooks/useNutritionRecommendations.js` (312 lignes)
- ✅ `src/hooks/useNutritionCorrelations.js` (248 lignes)
- ✅ `src/hooks/useNutritionChronobiology.js` (211 lignes)
- ✅ `src/hooks/useNutritionHealthScore.js` (219 lignes)
- ✅ `src/services/nutrition/nutritionExpertSystem.js` (analyse partielle)
- ✅ `src/services/nutrition/nutritionCorrelations.js` (analyse partielle)
- ✅ `src/services/nutrition/nutritionChronobiology.js` (analyse partielle)

**Méthode d'analyse** :
- Vérification des patterns de performance React
- Analyse des requêtes IndexedDB (séquentielles vs parallèles)
- Identification des re-renders inutiles
- Détection des calculs répétés (corrélations, scores, recommandations)
- Recherche des optimisations manquantes (memo, useMemo, useCallback)
- Analyse des patterns de cache
- Vérification des optimisations UI/UX
- Analyse des calculs statistiques (performance CPU)
- Vérification du cleanup async operations

---

## 🎯 OPTIMISATIONS IDENTIFIÉES (par catégorie)

### 🔴 CATÉGORIE 1 : REQUÊTES INDEXEDDB (Performance critique)

#### OPT 1.1 : Requêtes séquentielles dans `loadAnalysisData`

**Problème identifié** (Lignes 236-280 dans `NutritionAnalyses.jsx`) :

```javascript
// ❌ PROBLÈME : Requêtes séquentielles (bloquantes)
const loadAnalysisData = useCallback(async () => {
  try {
    setLoading(true);
    
    const period = periods.find(p => p.value === selectedPeriod) || periods[1];
    const startDateStr = DateHelper.getDaysAgoLocal(period.days);
    const endDateStr = DateHelper.getTodayLocal();

    // 1. Charger dailyMeals
    const dailyMeals = await nutritionData.getDailyMealsByRange(startDateStr, endDateStr);
    
    // 2. Puis charger programme actif
    const activeProgram = await nutritionData.getActiveProgram();
    
    // 3. Puis charger données Garmin si disponible
    let garminData = null;
    if (garminDbReady && loadDataByRange) {
      try {
        const garminDataResult = await loadDataByRange(startDateStr, endDateStr);
        // ...
      }
    }

    // 4. Puis traiter données
    const processedData = await processDataForAnalysis(dailyMeals, activeProgram, garminData, startDateStr, endDateStr);
    
    setAnalysisData(processedData);
  } catch (error) {
    log.error('Erreur chargement données', error);
  } finally {
    setLoading(false);
  }
}, [/* ... */]);
```

**Impact** :
- ⏱️ **Performance** : 3 requêtes séquentielles (~50ms chacune) = ~150ms total
- 💾 **IndexedDB** : 3 transactions séparées au lieu d'1 transaction unique ou parallèle
- 🔄 **UX** : Chargement visible plus long

**Solution proposée** :

```javascript
// ✅ SOLUTION : Requêtes parallèles avec Promise.all (2-3x plus rapide)
const loadAnalysisData = useCallback(async () => {
  try {
    setLoading(true);
    
    const period = periods.find(p => p.value === selectedPeriod) || periods[1];
    const startDateStr = DateHelper.getDaysAgoLocal(period.days);
    const endDateStr = DateHelper.getTodayLocal();

    // ✅ Requêtes parallèles : exécution simultanée (~50ms total au lieu de 150ms)
    const [dailyMeals, activeProgram, garminDataResult] = await Promise.all([
      nutritionData.getDailyMealsByRange(startDateStr, endDateStr),
      nutritionData.getActiveProgram(),
      garminDbReady && loadDataByRange
        ? loadDataByRange(startDateStr, endDateStr).catch(err => {
            log.warn('Erreur chargement Garmin', err);
            return null;
          })
        : Promise.resolve(null)
    ]);

    // ✅ Transformer données Garmin
    let garminData = null;
    if (garminDataResult?.dailyMetrics) {
      garminData = Object.entries(garminDataResult.dailyMetrics).map(([date, metrics]) => ({
        date,
        ...metrics
      }));
    }

    // Traiter données
    const processedData = await processDataForAnalysis(dailyMeals, activeProgram, garminData, startDateStr, endDateStr);
    
    if (isMountedRef.current) {
      setAnalysisData(processedData);
    }
  } catch (error) {
    if (isMountedRef.current) {
      log.error('Erreur chargement données', error);
    }
  } finally {
    if (isMountedRef.current) {
      setLoading(false);
    }
  }
}, [/* ... */]);
```

**Gain estimé** : **2-3x plus rapide** (~50ms au lieu de ~150ms)

---

#### OPT 1.2 : `getAllMeals()` charge tous les repas dans plusieurs hooks

**Problème identifié** (Lignes 48-79 dans `useNutritionRecommendations.js`, 48-82 dans `useNutritionCorrelations.js`, 113 dans `useNutritionChronobiology.js`) :

```javascript
// ❌ PROBLÈME : getAllMeals() charge TOUS les repas (potentiellement des milliers)
// ❌ Utilisé dans plusieurs hooks simultanément → duplication données en mémoire

// useNutritionRecommendations.js
const [dailyMeals, meals, programs] = await Promise.all([
  getDailyMealsByRange(startDateStr, endDateStr),
  getAllMeals(), // ⚠️ Charge TOUS les repas (milliers potentiellement)
  getAllPrograms()
]);

// useNutritionChronobiology.js
const allMeals = await getAllMeals(); // ⚠️ Charge TOUS les repas
const filteredMeals = allMeals.filter(meal => { // ⚠️ Filtre ensuite en mémoire
  if (!meal.timestamp) return false;
  const mealDate = new Date(meal.timestamp);
  return mealDate >= dateRange.startDate && mealDate <= dateRange.endDate;
});
```

**Impact** :
- ⏱️ **Performance** : Charge tous les repas même si on a besoin seulement d'une période
- 💾 **Mémoire** : Duplication données en mémoire (plusieurs hooks chargent tout)
- 📊 **IndexedDB** : Requête inutilement lourde

**Solution proposée** : **Utiliser `getMealsByDateRange` partout**

```javascript
// ✅ SOLUTION : Utiliser getMealsByDateRange pour période spécifique
// useNutritionRecommendations.js
const [dailyMeals, meals, programs] = await Promise.all([
  getDailyMealsByRange(startDateStr, endDateStr),
  getMealsByDateRange(startDateStr, endDateStr), // ✅ Seulement période nécessaire
  getAllPrograms()
]);

// useNutritionChronobiology.js
const dateRange = calculateDateRange(period);
const startDateStr = DateHelper.toYYYYMMDD(dateRange.startDate);
const endDateStr = DateHelper.toYYYYMMDD(dateRange.endDate);

const meals = await getMealsByDateRange(startDateStr, endDateStr); // ✅ Seulement période nécessaire
// Plus besoin de filtrer en mémoire
```

**Gain estimé** : **50-90% réduction mémoire** (selon historique) + **2-5x plus rapide** (requête ciblée)

---

#### OPT 1.3 : `getAllMeals()` dans `useNutritionHealthScore` charge tous les repas

**Problème identifié** (Lignes 79-83 dans `useNutritionHealthScore.js`) :

```javascript
// ❌ PROBLÈME : getAllMeals() charge TOUS les repas alors qu'on a besoin seulement 7 jours
const [dailyMeals, allMeals, programs] = await Promise.all([
  getDailyMealsByRange(nutritionStartStr, nutritionEndStr), // 7 jours
  getAllMeals(), // ⚠️ Charge TOUS les repas (milliers)
  getAllPrograms()
]);
```

**Impact** :
- ⏱️ **Performance** : Charge tous les repas même si score basé sur 7 jours
- 💾 **Mémoire** : Données inutiles en mémoire

**Solution proposée** :

```javascript
// ✅ SOLUTION : Utiliser getMealsByDateRange pour période spécifique
const [dailyMeals, meals, programs] = await Promise.all([
  getDailyMealsByRange(nutritionStartStr, nutritionEndStr),
  getMealsByDateRange(nutritionStartStr, nutritionEndStr), // ✅ Seulement 7 jours
  getAllPrograms()
]);
```

**Gain estimé** : **50-90% réduction mémoire** + **2-5x plus rapide**

---

#### OPT 1.4 : Import dynamique inutile dans `processDataForAnalysis`

**Problème identifié** (Lignes 109-112 dans `NutritionAnalyses.jsx`) :

```javascript
// ❌ PROBLÈME : Import dynamique à chaque exécution (surcharge)
const { getMealsByDateRange } = await import('../../../../hooks/nutritionDataCRUD').catch(() => ({ getMealsByDateRange: null }));
const allMeals = getMealsByDateRange 
  ? await getMealsByDateRange(startDate, endDate)
  : [];
```

**Impact** :
- ⏱️ **Performance** : Import dynamique à chaque traitement (surcharge)
- 💻 **CPU** : Parsing module à chaque fois

**Solution proposée** : **Import statique**

```javascript
// ✅ SOLUTION : Import statique en haut du fichier
import { getMealsByDateRange } from '../../../../hooks/nutritionDataCRUD';

// Dans processDataForAnalysis :
const allMeals = await getMealsByDateRange(startDate, endDate);
```

**Gain estimé** : **10-20ms réduction par exécution** (élimination import dynamique)

---

### 🟡 CATÉGORIE 2 : OPTIMISATIONS REACT (Performance UI)

#### OPT 2.1 : `processDataForAnalysis` recalcule tout à chaque changement période

**Problème identifié** (Lignes 97-233 dans `NutritionAnalyses.jsx`) :

```javascript
// ❌ PROBLÈME : processDataForAnalysis est un useCallback mais recalcule tout même si données inchangées
const processDataForAnalysis = useCallback(async (dailyMeals, program, garminData, startDate, endDate) => {
  // Calculs lourds : parcours chaque jour, calculs totaux, statistiques, tendances
  // ...
  
  while (currentDate <= end) {
    // Calculs pour chaque jour (potentiellement 365 jours)
    const totals = calculateDailyTotals(meals, program);
    const compliance = calculateProgramCompliance(totals, program);
    // ...
  }
  
  // Calculs statistiques
  // Calculs tendances
}, []); // ⚠️ Pas de dépendances mais fonction pure
```

**Impact** :
- ⏱️ **Performance** : Recalcul complet à chaque changement période (même si données identiques)
- 💻 **CPU** : Calculs lourds (totaux, conformité, statistiques) répétés

**Solution proposée** : **Cache avec TTL basé sur hash données**

```javascript
// ✅ SOLUTION : Cache avec hash données pour éviter recalculs inutiles
const analysisCacheRef = useRef({ 
  data: null, 
  hash: null, 
  timestamp: 0, 
  TTL: 60000 // 1 minute
});

const processDataForAnalysis = useCallback(async (dailyMeals, program, garminData, startDate, endDate) => {
  // ✅ Générer hash des données pour détecter changements
  const dataHash = JSON.stringify({
    dailyMealsCount: dailyMeals?.length || 0,
    programId: program?.id || null,
    garminDataCount: garminData?.length || 0,
    startDate,
    endDate
  });
  
  const cached = analysisCacheRef.current;
  const now = Date.now();
  
  // ✅ Vérifier cache : même hash + pas expiré
  if (cached.data && cached.hash === dataHash && (now - cached.timestamp) < cached.TTL) {
    return cached.data; // ✅ Retourner cache
  }
  
  // Calculs (seulement si données changées ou cache expiré)
  // ... calculs existants ...
  
  const result = {
    dailyData,
    stats,
    trend,
    program,
    hasGarminData: garminMap.size > 0
  };
  
  // ✅ Mettre en cache
  analysisCacheRef.current = {
    data: result,
    hash: dataHash,
    timestamp: now,
    TTL: 60000
  };
  
  return result;
}, []);
```

**Gain estimé** : **80-95% réduction calculs** (si période change souvent mais données identiques)

---

#### OPT 2.2 : `CustomTooltip` recréé à chaque rendu

**Problème identifié** (Lignes 290-304 dans `NutritionAnalyses.jsx`) :

```javascript
// ❌ PROBLÈME : Fonction CustomTooltip recréée à chaque rendu
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
        {/* ... */}
      </div>
    );
  }
  return null;
};

// Utilisé dans plusieurs graphiques
<Tooltip content={<CustomTooltip />} /> {/* ⚠️ Nouvelle fonction à chaque rendu */}
```

**Impact** :
- 🔄 **React** : Props instables pour Recharts Tooltip
- 🎨 **UI** : Re-render inutile des tooltips

**Solution proposée** : **useMemo ou fonction externe mémorisée**

```javascript
// ✅ SOLUTION 1 : useMemo pour mémoriser composant
const CustomTooltip = useMemo(() => {
  return ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value}{entry.unit || ''}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
}, []);

// ✅ SOLUTION 2 : Fonction externe (meilleure pour Recharts)
const CustomTooltip = React.memo(({ active, payload, label }) => {
  // ...
});

// Utilisation :
<Tooltip content={CustomTooltip} /> {/* ✅ Fonction stable */}
```

**Gain estimé** : **Stabilité props** (pas de re-render inutile des tooltips)

---

#### OPT 2.3 : Calculs de tendances répétés à chaque rendu

**Problème identifié** (Lignes 211-224 dans `NutritionAnalyses.jsx`) :

```javascript
// ❌ PROBLÈME : Calculs tendances dans processDataForAnalysis mais aussi potentiellement recalculés
const firstHalf = dailyData.slice(0, Math.floor(dailyData.length / 2));
const secondHalf = dailyData.slice(Math.floor(dailyData.length / 2));

const firstHalfAvg = firstHalf.length > 0
  ? firstHalf.reduce((sum, d) => sum + (d.calories || 0), 0) / firstHalf.length
  : 0;
const secondHalfAvg = secondHalf.length > 0
  ? secondHalf.reduce((sum, d) => sum + (d.calories || 0), 0) / secondHalf.length
  : 0;

const trend = secondHalfAvg > 0 && firstHalfAvg > 0
  ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
  : 0;
```

**Note** : Ces calculs sont déjà dans `processDataForAnalysis`, donc pas de problème actuel. Mais on peut mémoriser `trend` si `analysisData` change souvent.

**Solution proposée** : **Mémoriser trend si analysisData change souvent**

```javascript
// ✅ SOLUTION : useMemo pour trend si nécessaire
const trend = useMemo(() => {
  if (!analysisData?.trend) return 0;
  return analysisData.trend;
}, [analysisData?.trend]);
```

**Gain estimé** : **Stabilité** (évite recalculs si trend déjà calculé)

---

#### OPT 2.4 : Pas de mémorisation pour `periods` array

**Problème identifié** (Lignes 88-93 dans `NutritionAnalyses.jsx`) :

```javascript
// ❌ PROBLÈME : Array recréé à chaque rendu
const periods = [
  { value: '7days', label: '7 jours', days: 7 },
  { value: '30days', label: '30 jours', days: 30 },
  { value: '90days', label: '90 jours', days: 90 },
  { value: '1year', label: '1 an', days: 365 }
];
```

**Impact** :
- 🔄 **React** : Array instable si utilisé comme prop ou dans useMemo

**Solution proposée** : **useMemo ou constante externe**

```javascript
// ✅ SOLUTION : useMemo ou constante externe
const PERIODS = [
  { value: '7days', label: '7 jours', days: 7 },
  { value: '30days', label: '30 jours', days: 30 },
  { value: '90days', label: '90 jours', days: 90 },
  { value: '1year', label: '1 an', days: 365 }
];

// Ou useMemo si nécessaire dans composant
const periods = useMemo(() => PERIODS, []);
```

**Gain estimé** : **Stabilité** (array stable)

---

#### OPT 2.5 : Composants enfants non mémorisés (Recommendations, Correlations, etc.)

**Problème identifié** (Lignes 371-383 dans `NutritionAnalyses.jsx`) :

```javascript
// ❌ PROBLÈME : Composants enfants re-render à chaque changement état NutritionAnalyses
<NutritionRecommendations />
<NutritionCorrelations />
<NutritionChronobiology />
<NutritionHealthScore />
<NutritionPredictions />
```

**Impact** :
- 🔄 **React** : Re-render inutile de tous les composants enfants si état parent change
- ⏱️ **Performance** : Tous les hooks enfants recalculent même si données identiques

**Note** : Les composants enfants sont déjà indépendants (hooks propres), mais on peut éviter re-renders inutiles.

**Solution proposée** : **React.memo pour composants enfants**

```javascript
// ✅ SOLUTION : Mémoriser composants enfants avec React.memo
// NutritionRecommendations.jsx
export default React.memo(NutritionRecommendations);

// NutritionCorrelations.jsx
export default React.memo(NutritionCorrelations);

// NutritionChronobiology.jsx
export default React.memo(NutritionChronobiology);

// NutritionHealthScore.jsx
export default React.memo(NutritionHealthScore);
```

**Gain estimé** : **50-80% réduction re-renders** (re-render seulement si props changent)

---

### 🟢 CATÉGORIE 3 : OPTIMISATIONS CALCULS (Performance CPU)

#### OPT 3.1 : Calculs corrélations recalculés à chaque refresh

**Problème identifié** (Lignes 85-103 dans `useNutritionCorrelations.js`) :

```javascript
// ❌ PROBLÈME : calculateCorrelations recalculé même si données identiques
const calculateCorrelations = useCallback(() => {
  if (!nutritionDbReady || !nutritionDataCache) {
    return null;
  }

  try {
    const result = analyzeAllNutritionCorrelations(
      nutritionDataCache,
      garminData,
      { minDays, maxDays }
    );

    return result;
  } catch (err) {
    log.error('Erreur calcul corrélations:', err);
    setError(err);
    return null;
  }
}, [nutritionDataCache, garminData, nutritionDbReady, minDays, maxDays]);
```

**Impact** :
- ⏱️ **Performance** : Calculs corrélations lourds (Pearson, t-test, p-value) recalculés même si données identiques
- 💻 **CPU** : Calculs statistiques coûteux (O(n) pour Pearson, O(n) pour t-test)

**Solution proposée** : **Cache avec hash données**

```javascript
// ✅ SOLUTION : Cache avec hash pour éviter recalculs corrélations
const correlationsCacheRef = useRef({
  data: null,
  hash: null,
  timestamp: 0,
  TTL: 300000 // 5 minutes (corrélations changent peu)
});

const calculateCorrelations = useCallback(() => {
  if (!nutritionDbReady || !nutritionDataCache) {
    return null;
  }

  try {
    // ✅ Générer hash des données
    const dataHash = JSON.stringify({
      dailyMealsCount: nutritionDataCache.dailyMeals?.length || 0,
      garminDataCount: garminData ? (garminData.activities ? Object.keys(garminData.activities).length : 0) : 0,
      minDays,
      maxDays
    });
    
    const cached = correlationsCacheRef.current;
    const now = Date.now();
    
    // ✅ Vérifier cache
    if (cached.data && cached.hash === dataHash && (now - cached.timestamp) < cached.TTL) {
      return cached.data; // ✅ Retourner cache
    }
    
    const result = analyzeAllNutritionCorrelations(
      nutritionDataCache,
      garminData,
      { minDays, maxDays }
    );
    
    // ✅ Mettre en cache
    correlationsCacheRef.current = {
      data: result,
      hash: dataHash,
      timestamp: now,
      TTL: 300000
    };
    
    return result;
  } catch (err) {
    log.error('Erreur calcul corrélations:', err);
    setError(err);
    return null;
  }
}, [nutritionDataCache, garminData, nutritionDbReady, minDays, maxDays]);
```

**Gain estimé** : **90-95% réduction calculs** (si données identiques pendant 5 min)

---

#### OPT 3.2 : Calculs recommandations recalculés à chaque refresh

**Problème identifié** (Lignes 88-106 dans `useNutritionRecommendations.js`) :

```javascript
// ❌ PROBLÈME : generateRecommendations recalculé même si données identiques
const generateRecommendations = useCallback(() => {
  try {
    if (!nutritionDbReady || !nutritionDataCache) {
      return null;
    }

    const advice = generateNutritionAdvice(
      nutritionDataCache,
      garminData,
      activeProgram
    );

    return advice;
  } catch (err) {
    log.error('Erreur génération recommandations:', err);
    setError(err);
    return null;
  }
}, [nutritionDataCache, garminData, activeProgram, nutritionDbReady]);
```

**Impact** :
- ⏱️ **Performance** : Évaluation de toutes les règles expert recalculée même si données identiques
- 💻 **CPU** : Parcours de toutes les règles (potentiellement 20+ règles)

**Solution proposée** : **Cache avec hash données**

```javascript
// ✅ SOLUTION : Cache avec hash pour éviter recalculs recommandations
const recommendationsCacheRef = useRef({
  data: null,
  hash: null,
  timestamp: 0,
  TTL: 300000 // 5 minutes
});

const generateRecommendations = useCallback(() => {
  try {
    if (!nutritionDbReady || !nutritionDataCache) {
      return null;
    }

    // ✅ Générer hash des données
    const dataHash = JSON.stringify({
      dailyMealsCount: nutritionDataCache.dailyMeals?.length || 0,
      mealsCount: nutritionDataCache.meals?.length || 0,
      programId: activeProgram?.id || null,
      garminDataCount: garminData ? Object.keys(garminData).length : 0
    });
    
    const cached = recommendationsCacheRef.current;
    const now = Date.now();
    
    // ✅ Vérifier cache
    if (cached.data && cached.hash === dataHash && (now - cached.timestamp) < cached.TTL) {
      return cached.data; // ✅ Retourner cache
    }

    const advice = generateNutritionAdvice(
      nutritionDataCache,
      garminData,
      activeProgram
    );
    
    // ✅ Mettre en cache
    recommendationsCacheRef.current = {
      data: advice,
      hash: dataHash,
      timestamp: now,
      TTL: 300000
    };
    
    return advice;
  } catch (err) {
    log.error('Erreur génération recommandations:', err);
    setError(err);
    return null;
  }
}, [nutritionDataCache, garminData, activeProgram, nutritionDbReady]);
```

**Gain estimé** : **90-95% réduction calculs** (si données identiques pendant 5 min)

---

#### OPT 3.3 : Calculs chronobiologie recalculés à chaque changement période

**Problème identifié** (Lignes 99-184 dans `useNutritionChronobiology.js`) :

```javascript
// ❌ PROBLÈME : loadData recalcule tout même si données identiques pour période
const loadData = useCallback(async () => {
  // ...
  const result = analyzeChronobiology(
    {
      meals: filteredMeals,
      workouts: workouts
    },
    {
      dateRange: {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString()
      }
    }
  );

  setAnalysis(result);
}, [nutritionDbReady, garminDbReady, period, getAllMeals, loadDataByRange, calculateDateRange]);
```

**Impact** :
- ⏱️ **Performance** : Calculs chronobiologie lourds (analyse timing, corrélations) recalculés même si données identiques
- 💻 **CPU** : Parcours de tous les repas et workouts pour analyser timing

**Solution proposée** : **Cache avec hash période + données**

```javascript
// ✅ SOLUTION : Cache avec hash période + données
const chronobiologyCacheRef = useRef({
  data: null,
  hash: null,
  timestamp: 0,
  TTL: 300000 // 5 minutes
});

const loadData = useCallback(async () => {
  if (!nutritionDbReady || !garminDbReady) {
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const dateRange = calculateDateRange(period);
    
    // ✅ Générer hash période + données chargées
    const startDateStr = DateHelper.toYYYYMMDD(dateRange.startDate);
    const endDateStr = DateHelper.toYYYYMMDD(dateRange.endDate);
    
    // Charger données
    const allMeals = await getAllMeals();
    const filteredMeals = allMeals.filter(meal => {
      if (!meal.timestamp) return false;
      const mealDate = new Date(meal.timestamp);
      return mealDate >= dateRange.startDate && mealDate <= dateRange.endDate;
    });

    const garminData = await loadDataByRange(startDateStr, endDateStr);
    const workouts = []; // ... transformer activités ...

    // ✅ Générer hash
    const dataHash = JSON.stringify({
      period,
      mealsCount: filteredMeals.length,
      workoutsCount: workouts.length
    });
    
    const cached = chronobiologyCacheRef.current;
    const now = Date.now();
    
    // ✅ Vérifier cache
    if (cached.data && cached.hash === dataHash && (now - cached.timestamp) < cached.TTL) {
      setAnalysis(cached.data); // ✅ Utiliser cache
      setLoading(false);
      return;
    }

    // Calculs (seulement si données changées ou cache expiré)
    const result = analyzeChronobiology(
      {
        meals: filteredMeals,
        workouts: workouts
      },
      {
        dateRange: {
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString()
        }
      }
    );

    // ✅ Mettre en cache
    chronobiologyCacheRef.current = {
      data: result,
      hash: dataHash,
      timestamp: now,
      TTL: 300000
    };

    setAnalysis(result);
  } catch (err) {
    log.error('Erreur analyse chronobiologie:', err);
    setError(err);
  } finally {
    setLoading(false);
  }
}, [nutritionDbReady, garminDbReady, period, getAllMeals, loadDataByRange, calculateDateRange]);
```

**Gain estimé** : **90-95% réduction calculs** (si période/données identiques pendant 5 min)

---

#### OPT 3.4 : Calculs score santé recalculés à chaque refresh

**Problème identifié** (Lignes 62-163 dans `useNutritionHealthScore.js`) :

```javascript
// ❌ PROBLÈME : loadHealthScore recalcule tout même si données identiques
const loadHealthScore = useCallback(async () => {
  // ...
  const score = calculateGlobalHealthScore({
    nutrition: nutritionData,
    workouts: workoutsData,
    garmin: garminRecoveryData,
    gamification: gamificationData,
    muscleBalance: null
  });

  setHealthScore(score);
}, [/* ... */]);
```

**Impact** :
- ⏱️ **Performance** : Calculs score santé lourds (sous-scores, tendances, recommandations) recalculés même si données identiques
- 💻 **CPU** : Calculs composites complexes

**Solution proposée** : **Cache avec hash données**

```javascript
// ✅ SOLUTION : Cache avec hash pour éviter recalculs score santé
const healthScoreCacheRef = useRef({
  data: null,
  hash: null,
  timestamp: 0,
  TTL: 300000 // 5 minutes
});

const loadHealthScore = useCallback(async () => {
  if (!nutritionDbReady) {
    return;
  }

  setLoading(true);
  setError(null);

  try {
    // Charger données
    const today = DateHelper.getTodayLocal();
    const nutritionStartStr = DateHelper.getDaysAgoLocal(7);
    const nutritionEndStr = today;

    const [dailyMeals, meals, programs] = await Promise.all([
      getDailyMealsByRange(nutritionStartStr, nutritionEndStr),
      getMealsByDateRange(nutritionStartStr, nutritionEndStr), // ✅ OPT 1.3
      getAllPrograms()
    ]);

    const activeProgram = programs.find(p => p.isActive) || null;

    // ✅ Générer hash des données
    const dataHash = JSON.stringify({
      dailyMealsCount: dailyMeals?.length || 0,
      mealsCount: meals?.length || 0,
      programId: activeProgram?.id || null,
      gamificationXP: gamificationState?.experience?.currentXP || 0
    });
    
    const cached = healthScoreCacheRef.current;
    const now = Date.now();
    
    // ✅ Vérifier cache
    if (cached.data && cached.hash === dataHash && (now - cached.timestamp) < cached.TTL) {
      setHealthScore(cached.data); // ✅ Utiliser cache
      setLastUpdate(new Date());
      setLoading(false);
      return;
    }

    // Calculs (seulement si données changées ou cache expiré)
    // ... calculs existants ...

    // ✅ Mettre en cache
    healthScoreCacheRef.current = {
      data: score,
      hash: dataHash,
      timestamp: now,
      TTL: 300000
    };

    setHealthScore(score);
    setLastUpdate(new Date());
  } catch (err) {
    log.error('Erreur calcul score santé global:', err);
    setError(err);
  } finally {
    setLoading(false);
  }
}, [/* ... */]);
```

**Gain estimé** : **90-95% réduction calculs** (si données identiques pendant 5 min)

---

#### OPT 3.5 : Calculs `getMealsByDateRange` dans `processDataForAnalysis` peut être optimisé

**Problème identifié** (Lignes 109-125 dans `NutritionAnalyses.jsx`) :

```javascript
// ❌ PROBLÈME : Charger tous les meals pour période puis créer Map en mémoire
const allMeals = getMealsByDateRange 
  ? await getMealsByDateRange(startDate, endDate)
  : [];
  
  // Créer map des meals par date pour accès rapide
  const mealsByDate = new Map();
  if (allMeals && Array.isArray(allMeals)) {
    allMeals.forEach(meal => {
      if (meal.date) {
        if (!mealsByDate.has(meal.date)) {
          mealsByDate.set(meal.date, []);
        }
        mealsByDate.get(meal.date).push(meal);
      }
    });
  }
```

**Impact** :
- ⏱️ **Performance** : Création Map en mémoire à chaque traitement
- 💻 **CPU** : Parcours de tous les meals pour créer Map

**Note** : Le code est correct, mais on peut mémoriser la Map si `allMeals` ne change pas.

**Solution proposée** : **Mémoriser mealsByDate si allMeals identique**

```javascript
// ✅ SOLUTION : Mémoriser mealsByDate avec useMemo si nécessaire
// (Dans processDataForAnalysis, peut être optimisé avec cache global)
```

**Gain estimé** : **Minime** (création Map rapide)

---

### 🔵 CATÉGORIE 4 : OPTIMISATIONS HOOKS (Performance React)

#### OPT 4.1 : Pas de cleanup pour async operations dans hooks

**Problème identifié** (Lignes 43-79 dans `useNutritionRecommendations.js`, 49-82 dans `useNutritionCorrelations.js`, 99-184 dans `useNutritionChronobiology.js`) :

```javascript
// ❌ PROBLÈME : Pas de cleanup si composant démonté pendant chargement
const loadNutritionData = async () => {
  try {
    // ...
    const [dailyMeals, meals, programs] = await Promise.all([
      getDailyMealsByRange(startDateStr, endDateStr),
      getAllMeals(),
      getAllPrograms()
    ]);

    // ⚠️ setState possible sur composant démonté
    setNutritionDataCache({
      dailyMeals: dailyMeals || [],
      meals: meals || [],
      programs: programs || []
    });
  } catch (err) {
    // ⚠️ setError possible sur composant démonté
    log.error('Erreur chargement données nutrition:', err);
    setNutritionDataCache({ /* ... */ });
  }
};
```

**Impact** :
- 🐛 **Bugs** : Memory leaks si composant démonté pendant async
- ⚠️ **Warnings** : React warnings "Can't perform a React state update on an unmounted component"

**Solution proposée** : **Ref pour cleanup**

```javascript
// ✅ SOLUTION : Ref pour cleanup async operations
const isMountedRef = useRef(true);

const loadNutritionData = async () => {
  try {
    const [dailyMeals, meals, programs] = await Promise.all([
      getDailyMealsByRange(startDateStr, endDateStr),
      getAllMeals(),
      getAllPrograms()
    ]);

    // ✅ Vérifier si composant toujours monté avant setState
    if (isMountedRef.current) {
      setNutritionDataCache({
        dailyMeals: dailyMeals || [],
        meals: meals || [],
        programs: programs || []
      });
    }
  } catch (err) {
    if (isMountedRef.current) {
      log.error('Erreur chargement données nutrition:', err);
      setNutritionDataCache({ /* ... */ });
    }
  }
};

useEffect(() => {
  isMountedRef.current = true;
  if (nutritionDbReady) {
    loadNutritionData();
  }
  
  return () => {
    isMountedRef.current = false;
  };
}, [nutritionDbReady, /* ... */]);
```

**Gain estimé** : **Pas de memory leaks** (cleanup correct)

---

#### OPT 4.2 : Auto-refresh avec `setInterval` peut créer fuites

**Problème identifié** (Lignes 139-154 dans `useNutritionRecommendations.js`, 135-150 dans `useNutritionCorrelations.js`) :

```javascript
// ❌ PROBLÈME : setInterval peut continuer après démontage si cleanup incorrect
useEffect(() => {
  if (!autoRefresh || !nutritionDbReady || !nutritionDataCache) {
    return;
  }

  const interval = setInterval(() => {
    log.debug('Auto-refresh recommandations...');
    const advice = generateRecommendations();
    if (advice) {
      setRecommendations(advice); // ⚠️ setState possible après démontage
      setLastUpdate(new Date());
    }
  }, refreshInterval);

  return () => clearInterval(interval);
}, [autoRefresh, refreshInterval, nutritionDbReady, nutritionDataCache, generateRecommendations]);
```

**Note** : Le cleanup `clearInterval` est présent, mais on peut améliorer avec ref.

**Solution proposée** : **Ref pour vérifier montage dans interval**

```javascript
// ✅ SOLUTION : Ref pour vérifier montage dans interval
const isMountedRef = useRef(true);

useEffect(() => {
  if (!autoRefresh || !nutritionDbReady || !nutritionDataCache) {
    return;
  }

  const interval = setInterval(() => {
    if (!isMountedRef.current) return; // ✅ Vérifier montage
    
    log.debug('Auto-refresh recommandations...');
    const advice = generateRecommendations();
    if (advice && isMountedRef.current) {
      setRecommendations(advice);
      setLastUpdate(new Date());
    }
  }, refreshInterval);

  return () => {
    clearInterval(interval);
    isMountedRef.current = false;
  };
}, [autoRefresh, refreshInterval, nutritionDbReady, nutritionDataCache, generateRecommendations]);

useEffect(() => {
  isMountedRef.current = true;
  return () => {
    isMountedRef.current = false;
  };
}, []);
```

**Gain estimé** : **Pas de memory leaks** (cleanup correct)

---

#### OPT 4.3 : DateHelper non utilisé dans plusieurs hooks

**Problème identifié** (Lignes 51-55 dans `useNutritionRecommendations.js`, 57-61 dans `useNutritionCorrelations.js`) :

```javascript
// ❌ PROBLÈME : Utilisation new Date().toISOString().split('T')[0] au lieu de DateHelper
const today = new Date();
const startDate = new Date(today);
startDate.setDate(startDate.getDate() - 7);
const startDateStr = startDate.toISOString().split('T')[0];
const endDateStr = today.toISOString().split('T')[0];
```

**Impact** :
- 🐛 **Bugs potentiels** : Incohérence timezone (UTC vs local)
- 📝 **Maintenance** : Code dupliqué au lieu d'utiliser DateHelper

**Solution proposée** : **Utiliser DateHelper partout**

```javascript
// ✅ SOLUTION : Utiliser DateHelper pour cohérence timezone locale
import { DateHelper } from '../utils/dateHelper';

const startDateStr = DateHelper.getDaysAgoLocal(7);
const endDateStr = DateHelper.getTodayLocal();
```

**Gain estimé** : **Cohérence timezone** (pas de bugs timezone)

---

### 🟣 CATÉGORIE 5 : OPTIMISATIONS UI/UX

#### OPT 5.1 : Pas de debounce pour changement période

**Problème identifié** (Lignes 353-366 dans `NutritionAnalyses.jsx`) :

```javascript
// ❌ PROBLÈME : Changement période déclenche recalcul immédiat (pas de debounce)
{periods.map((period) => (
  <Button
    key={period.value}
    onClick={() => setSelectedPeriod(period.value)} // ⚠️ Recalcul immédiat
    variant={selectedPeriod === period.value ? 'default' : 'ghost'}
    size="sm"
    className={/* ... */}
  >
    {period.label}
  </Button>
))}
```

**Impact** :
- ⏱️ **Performance** : Recalculs si utilisateur clique rapidement sur différentes périodes
- 💻 **CPU** : Calculs lourds déclenchés à chaque clic

**Solution proposée** : **Debounce changement période**

```javascript
// ✅ SOLUTION : Debounce changement période (évite recalculs multiples rapides)
const [debouncedPeriod, setDebouncedPeriod] = useState(selectedPeriod);

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedPeriod(selectedPeriod);
  }, 300); // Debounce 300ms
  
  return () => clearTimeout(timer);
}, [selectedPeriod]);

// Utiliser debouncedPeriod dans loadAnalysisData
const loadAnalysisData = useCallback(async () => {
  const period = periods.find(p => p.value === debouncedPeriod) || periods[1];
  // ...
}, [debouncedPeriod, /* ... */]);
```

**Gain estimé** : **Réduction recalculs** (si utilisateur clique rapidement)

---

#### OPT 5.2 : Pas de loading state individuel pour sous-composants

**Problème identifié** (Lignes 371-383 dans `NutritionAnalyses.jsx`) :

```javascript
// ❌ PROBLÈME : Pas de feedback visuel si sous-composants chargent indépendamment
<NutritionRecommendations />
<NutritionCorrelations />
<NutritionChronobiology />
<NutritionHealthScore />
<NutritionPredictions />
```

**Note** : Les sous-composants gèrent leur propre loading, mais on pourrait avoir un skeleton loader global.

**Solution proposée** : **Skeleton loaders pour meilleure UX**

```javascript
// ✅ SOLUTION : Skeleton loaders (optionnel, amélioration UX)
// Déjà géré par chaque composant individuellement, OK
```

**Gain estimé** : **Meilleure UX** (déjà géré individuellement)

---

#### OPT 5.3 : Pas de toast pour erreurs dans sous-composants

**Problème identifié** (Lignes 108-124 dans `NutritionRecommendations.jsx`, 101-118 dans `NutritionCorrelations.jsx`) :

```javascript
// ❌ PROBLÈME : Erreurs affichées seulement dans composant, pas de toast global
if (error) {
  return (
    <Card>
      <CardContent>
        <p className="text-red-400">Erreur lors du chargement des recommandations.</p>
        <Button onClick={refresh}>Réessayer</Button>
      </CardContent>
    </Card>
  );
}
```

**Impact** :
- 🎨 **UX** : Erreurs peuvent passer inaperçues si composant hors vue

**Solution proposée** : **Toast pour erreurs critiques**

```javascript
// ✅ SOLUTION : Toast pour erreurs critiques (optionnel)
import { useToast } from '../../../ui/Toast/ToastProvider';

const { showError } = useToast();

useEffect(() => {
  if (error) {
    showError('Erreur chargement recommandations', error.message);
  }
}, [error, showError]);
```

**Gain estimé** : **Meilleure UX** (erreurs visibles)

---

### 🔴 CATÉGORIE 6 : OPTIMISATIONS MÉMOIRE

#### OPT 6.1 : Pas de cleanup pour async operations (déjà OPT 4.1)

Voir OPT 4.1.

---

#### OPT 6.2 : Cache de données nutrition dupliqué entre hooks

**Problème identifié** (Lignes 40 dans `useNutritionRecommendations.js`, 46 dans `useNutritionCorrelations.js`, etc.) :

```javascript
// ❌ PROBLÈME : Chaque hook maintient son propre cache nutritionDataCache
// ❌ Données dupliquées en mémoire si plusieurs hooks utilisés simultanément

// useNutritionRecommendations.js
const [nutritionDataCache, setNutritionDataCache] = useState(null);

// useNutritionCorrelations.js
const [nutritionDataCache, setNutritionDataCache] = useState(null);

// useNutritionChronobiology.js (pas de cache mais charge données)
```

**Impact** :
- 💾 **Mémoire** : Duplication données en mémoire (dailyMeals, meals, programs)
- 🔄 **Données** : Plusieurs requêtes IndexedDB pour mêmes données

**Solution proposée** : **Cache global partagé avec TTL**

```javascript
// ✅ SOLUTION : Cache global partagé (optionnel, complexité moyenne)
// Créer un hook useSharedNutritionCache qui gère cache global
// Tous les hooks utilisent ce cache partagé
// TTL 5 minutes pour données nutrition

// hooks/useSharedNutritionCache.js
const globalNutritionCache = {
  data: null,
  timestamp: 0,
  TTL: 300000
};

export const useSharedNutritionCache = (startDate, endDate) => {
  // Gérer cache global partagé
  // Tous les hooks utilisent ce cache
};
```

**Gain estimé** : **50-70% réduction mémoire** (si plusieurs hooks utilisés)

**Note** : Complexité moyenne, peut être reporté si besoin.

---

#### OPT 6.3 : `getAllMeals()` charge tous les repas même si non nécessaire

**Problème identifié** (Voir OPT 1.2, 1.3)

Voir OPT 1.2 et OPT 1.3.

---

### 🟡 CATÉGORIE 7 : OPTIMISATIONS CALCULS STATISTIQUES

#### OPT 7.1 : Calculs Pearson peuvent être optimisés pour gros échantillons

**Problème identifié** (Lignes 78-92 dans `nutritionCorrelations.js`) :

```javascript
// ❌ PROBLÈME : Calculs Pearson avec réductions séquentielles (peut être optimisé)
const meanX = validPairs.reduce((sum, pair) => sum + pair.x, 0) / validN;
const meanY = validPairs.reduce((sum, pair) => sum + pair.y, 0) / validN;

let numerator = 0;
let sumSqX = 0;
let sumSqY = 0;

for (const pair of validPairs) {
  const diffX = pair.x - meanX;
  const diffY = pair.y - meanY;
  
  numerator += diffX * diffY;
  sumSqX += diffX * diffX;
  sumSqY += diffY * diffY;
}
```

**Impact** :
- ⏱️ **Performance** : Pour gros échantillons (n > 1000), calculs peuvent être optimisés
- 💻 **CPU** : 2 réductions + 1 boucle = 3 parcours de données

**Note** : Le code actuel est correct et efficace. Pour n < 1000, pas d'optimisation nécessaire.

**Solution proposée** : **Optimisation pour n > 1000 (calculs parallèles ou SIMD)**

```javascript
// ✅ SOLUTION : Optimisation pour gros échantillons (optionnel, n > 1000)
// Utiliser Web Workers pour calculs parallèles si n > 1000
// Ou utiliser TypedArrays pour meilleures performances
```

**Gain estimé** : **20-40% réduction calculs** (seulement pour n > 1000)

**Note** : Peu probable d'avoir n > 1000 pour corrélations nutrition (90 jours max), donc optionnel.

---

#### OPT 7.2 : Calculs tendances peuvent être optimisés

**Problème identifié** (Lignes 211-224 dans `NutritionAnalyses.jsx`) :

```javascript
// ❌ PROBLÈME : 2 réductions séparées pour firstHalf et secondHalf
const firstHalf = dailyData.slice(0, Math.floor(dailyData.length / 2));
const secondHalf = dailyData.slice(Math.floor(dailyData.length / 2));

const firstHalfAvg = firstHalf.length > 0
  ? firstHalf.reduce((sum, d) => sum + (d.calories || 0), 0) / firstHalf.length
  : 0;
const secondHalfAvg = secondHalf.length > 0
  ? secondHalf.reduce((sum, d) => sum + (d.calories || 0), 0) / secondHalf.length
  : 0;
```

**Impact** :
- ⏱️ **Performance** : 2 réductions + 2 slices = 4 parcours de données

**Note** : Pour n < 365, impact minime. Mais on peut optimiser.

**Solution proposée** : **Calcul en un seul parcours**

```javascript
// ✅ SOLUTION : Calcul en un seul parcours (optimisation mineure)
const midPoint = Math.floor(dailyData.length / 2);
let firstHalfSum = 0;
let secondHalfSum = 0;

dailyData.forEach((d, index) => {
  const calories = d.calories || 0;
  if (index < midPoint) {
    firstHalfSum += calories;
  } else {
    secondHalfSum += calories;
  }
});

const firstHalfAvg = midPoint > 0 ? firstHalfSum / midPoint : 0;
const secondHalfAvg = (dailyData.length - midPoint) > 0 
  ? secondHalfSum / (dailyData.length - midPoint) 
  : 0;
```

**Gain estimé** : **25% réduction calculs** (1 parcours au lieu de 4)

---

## 📊 RÉSUMÉ DES OPTIMISATIONS

### Impact estimé par optimisation :

| OPT | Catégorie | Impact | Effort | Priorité |
|-----|-----------|--------|--------|----------|
| **1.1** | IndexedDB | ⚡ 2-3x plus rapide | Faible | 🔴 Critique |
| **1.2** | IndexedDB | ⚡ 2-5x plus rapide, 50-90% réduction mémoire | Moyen | 🔴 Critique |
| **1.3** | IndexedDB | ⚡ 2-5x plus rapide, 50-90% réduction mémoire | Faible | 🔴 Critique |
| **1.4** | IndexedDB | ⚡ 10-20ms réduction | Faible | 🟡 Haute |
| **2.1** | React | ⚡ 80-95% réduction calculs | Moyen | 🟡 Haute |
| **2.2** | React | 🎯 Stabilité props | Faible | 🟢 Moyenne |
| **2.3** | React | 🎯 Stabilité | Faible | 🟢 Faible |
| **2.4** | React | 🎯 Stabilité | Faible | 🟢 Faible |
| **2.5** | React | ⚡ 50-80% réduction re-renders | Faible | 🟡 Haute |
| **3.1** | Calculs | ⚡ 90-95% réduction calculs | Moyen | 🟡 Haute |
| **3.2** | Calculs | ⚡ 90-95% réduction calculs | Moyen | 🟡 Haute |
| **3.3** | Calculs | ⚡ 90-95% réduction calculs | Moyen | 🟡 Haute |
| **3.4** | Calculs | ⚡ 90-95% réduction calculs | Moyen | 🟡 Haute |
| **3.5** | Calculs | ⚡ Minime | Faible | 🟢 Faible |
| **4.1** | Hooks | 🐛 Pas de memory leaks | Faible | 🟡 Haute |
| **4.2** | Hooks | 🐛 Pas de memory leaks | Faible | 🟡 Haute |
| **4.3** | Hooks | 🐛 Cohérence timezone | Faible | 🟢 Moyenne |
| **5.1** | UI/UX | ⚡ Réduction recalculs | Moyen | 🟢 Moyenne |
| **5.2** | UI/UX | 🎨 Déjà géré | - | - |
| **5.3** | UI/UX | 🎨 Meilleure UX | Faible | 🟢 Faible |
| **6.1** | Mémoire | 🐛 Pas de memory leaks | Faible | 🟡 Haute |
| **6.2** | Mémoire | ⚡ 50-70% réduction mémoire | Moyen | 🟢 Moyenne |
| **6.3** | Mémoire | Voir OPT 1.2, 1.3 | - | - |
| **7.1** | Stats | ⚡ 20-40% réduction (n > 1000) | Moyen | 🟢 Faible |
| **7.2** | Stats | ⚡ 25% réduction calculs | Faible | 🟢 Faible |

### Gains totaux estimés :

- ⚡ **Performance IndexedDB** : **2-5x plus rapide** (requêtes parallèles + requêtes ciblées)
- 💾 **Mémoire** : **50-90% réduction** (requêtes ciblées + cache partagé)
- 💻 **CPU** : **90-95% réduction calculs** (cache avec hash)
- 🔄 **Re-renders React** : **50-80% réduction** (memo + useMemo + useCallback)
- 🐛 **Stabilité** : **Pas de memory leaks** (cleanup async)
- 🎨 **UX** : **Debounce changement période** (réduction recalculs multiples)

---

## ✅ IMPLÉMENTATION RECOMMANDÉE

**Ordre d'implémentation recommandé** :

1. **Phase 1 - Critiques** (Impact maximum) :
   - ✅ OPT 1.1 : Requêtes parallèles dans `loadAnalysisData`
   - ✅ OPT 1.2 : Utiliser `getMealsByDateRange` dans `useNutritionRecommendations`
   - ✅ OPT 1.3 : Utiliser `getMealsByDateRange` dans `useNutritionHealthScore`
   - ✅ OPT 4.1 : Cleanup async operations dans tous les hooks

2. **Phase 2 - Hautes priorités** (Performance UI + Calculs) :
   - ✅ OPT 2.1 : Cache avec hash pour `processDataForAnalysis`
   - ✅ OPT 3.1 : Cache avec hash pour corrélations
   - ✅ OPT 3.2 : Cache avec hash pour recommandations
   - ✅ OPT 3.3 : Cache avec hash pour chronobiologie
   - ✅ OPT 3.4 : Cache avec hash pour score santé
   - ✅ OPT 2.5 : React.memo pour composants enfants

3. **Phase 3 - Moyennes priorités** (Améliorations) :
   - ✅ OPT 1.4 : Import statique au lieu de dynamique
   - ✅ OPT 2.2 : useMemo pour CustomTooltip
   - ✅ OPT 4.2 : Ref pour cleanup setInterval
   - ✅ OPT 4.3 : DateHelper partout
   - ✅ OPT 5.1 : Debounce changement période
   - ✅ OPT 7.2 : Optimisation calculs tendances

4. **Phase 4 - Faibles priorités** (Nice to have) :
   - ✅ OPT 2.3 : useMemo pour trend
   - ✅ OPT 2.4 : useMemo pour periods
   - ✅ OPT 5.3 : Toast pour erreurs
   - ✅ OPT 6.2 : Cache global partagé (complexité moyenne)
   - ✅ OPT 7.1 : Optimisation Pearson pour n > 1000 (peu probable)

---

**Date de création** : 2025-01-16  
**Dernière mise à jour** : 2025-01-16  
**Statut** : ✅ Analyse complète terminée

