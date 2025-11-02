# ✅ OPTIMISATIONS RÉCUPÉRATION DONNÉES GARMIN

**Date** : 2025-11-01  
**Objectif** : Optimiser la récupération et le parsing des données Garmin manquantes (FC, calories, minutes intensives, Body Battery)

---

## 🔍 PROBLÈME IDENTIFIÉ

Les données suivantes ne s'affichaient pas dans les graphiques :
- ❌ **Fréquence cardiaque** (resting, max, avg)
- ❌ **Calories** (total, active, resting)
- ❌ **Minutes intensives** (moderate, vigorous, total)
- ❌ **Body Battery**

---

## ✅ OPTIMISATIONS APPORTÉES

### 1. **OPTIMISATION PARSING CALORIES** (`daily_metrics_parser.py`)

**Avant** :
- Cherchait seulement dans 3 champs : `totalKilocalories`, `calories`, `totalCalories`

**Après** :
- Cherche dans **7 champs possibles** pour calories totales :
  - `totalKilocalories`
  - `totalCalories`
  - `calories`
  - `caloriesTotal`
  - `kilocalories`
  - `kcal`
  - `dailyCalories`

- Cherche dans **6 champs possibles** pour calories actives :
  - `activeKilocalories`
  - `activeCalories`
  - `caloriesBurned`
  - `burnedCalories`
  - `activeKcal`
  - `dailyActiveCalories`

- Cherche dans **6 champs possibles** pour calories repos :
  - `bmrKilocalories`
  - `restingCalories`
  - `restingMetabolicRate`
  - `bmr`
  - `basalMetabolicRate`
  - `restingKcal`

**Logique améliorée** :
- Si `total` est 0 mais `active + resting > 0`, calcule automatiquement le total
- Ajoute des logs de débogage pour tracer les valeurs parsées

---

### 2. **OPTIMISATION PARSING FRÉQUENCE CARDIAQUE** (`daily_metrics_parser.py`)

**Avant** :
- Cherchait seulement dans 3 champs pour chaque métrique

**Après** :
- Cherche dans **6 champs possibles** pour FC repos :
  - `restingHeartRate`
  - `restingHR`
  - `avgRestingHeartRate`
  - `averageRestingHeartRate`
  - `restingBpm`
  - `rhr`

- Cherche dans **6 champs possibles** pour FC max :
  - `maxHeartRate`
  - `maxHR`
  - `peakHeartRate`
  - `maximumHeartRate`
  - `maxBpm`
  - `peakBpm`

- Cherche dans **5 champs possibles** pour FC moyenne :
  - `averageHeartRate`
  - `avgHR`
  - `meanHeartRate`
  - `avgBpm`
  - `averageBpm`

**Logique améliorée** :
- Utilise toujours les time series si disponibles
- Calcule max/avg depuis les time series si non trouvées dans stats
- Ajoute des logs de débogage pour tracer les valeurs parsées

---

### 3. **OPTIMISATION LOGS DÉBOGAGE** (`fetch_garmin_data.py`)

**Ajouts** :
- Logs détaillés pour **tous les champs de calories** dans stats
- Logs détaillés pour **tous les champs de fréquence cardiaque** dans stats
- Warnings si **toutes les valeurs sont à 0**
- Warnings si **Body Battery/Stress/SpO2 ne sont pas parsés**
- Warnings si **minutes intensives ne sont pas trouvées**

**Exemple de logs** :
```
Stats calorie keys: ['totalKilocalories', 'activeKilocalories', 'bmrKilocalories', ...]
  totalKilocalories: 2340
  activeKilocalories: 540
  bmrKilocalories: 1800
Parsed calories - total: 2340, active: 540, resting: 1800
Daily calories for 2025-10-29: total=2340, active=540, resting=1800
```

---

### 4. **OPTIMISATION LOGS FRONTEND** (Composants React)

**Ajouts** :
- Logs de débogage dans `GarminHeartRateChart.jsx` pour identifier les problèmes de données
- Logs de débogage dans `GarminBodyBatteryChart.jsx` pour identifier les problèmes de données
- Logs dans `GarminActivities.jsx` pour tracer les activités
- Logs dans `GarminDashboard.jsx` pour tracer les métriques quotidiennes

**Exemple de logs** :
```
[GarminHeartRateChart] No HR data for filtered dates: [
  { date: '2025-10-29', hasHR: true, resting: 65, max: 147, avg: 78 },
  { date: '2025-10-30', hasHR: false, resting: null, max: null, avg: null }
]
```

---

## 🔍 DIAGNOSTIC

### Étapes pour identifier le problème :

1. **Vérifier les logs Python** (console serveur) :
   - Chercher `Stats for YYYY-MM-DD - Type: dict, Keys: [...]`
   - Chercher `Stats calorie keys: [...]`
   - Chercher `Stats HR keys: [...]`
   - Chercher `Parsed calories - total: X, active: Y, resting: Z`
   - Chercher `Parsed HR from stats - resting: X, max: Y, avg: Z`
   - Chercher `⚠️  WARNING: All calories are 0` ou `⚠️  WARNING: All HR values are 0`

2. **Vérifier les logs Frontend** (console navigateur) :
   - Chercher `[GarminTab] Loaded from IndexedDB:`
   - Chercher `[GarminDashboard] Metrics for YYYY-MM-DD:`
   - Chercher `[GarminHeartRateChart] No HR data for filtered dates:`
   - Chercher `[GarminBodyBatteryChart] No Body Battery data for filtered dates:`

3. **Vérifier IndexedDB** :
   - Ouvrir DevTools > Application > IndexedDB > GarminDataDB > dailyMetrics
   - Vérifier que les données sont bien sauvegardées avec les bonnes clés
   - Vérifier que `calories`, `heartRate`, `bodyBattery`, `intensityMinutes` sont présents

---

## 📊 RÉSULTAT ATTENDU

Après synchronisation, vous devriez voir dans les logs :

**Python (serveur)** :
```
Stats for 2025-10-29 - Type: <class 'dict'>, Keys: ['totalKilocalories', 'activeKilocalories', 'restingHeartRate', ...]
Stats calorie keys: ['totalKilocalories', 'activeKilocalories', 'bmrKilocalories']
  totalKilocalories: 2340
  activeKilocalories: 540
  bmrKilocalories: 1800
Parsed calories - total: 2340, active: 540, resting: 1800
Daily calories for 2025-10-29: total=2340, active=540, resting=1800
Stats HR keys: ['restingHeartRate', 'maxHeartRate', 'averageHeartRate']
  restingHeartRate: 65
  maxHeartRate: 147
  averageHeartRate: 78
Parsed HR from stats - resting: 65, max: 147, avg: 78
Daily HR for 2025-10-29: resting=65, max=147, avg=78
✅ Body Battery for 2025-10-29: 67
Daily intensityMinutes for 2025-10-29: moderate=5, vigorous=9, total=23
```

**Frontend (navigateur)** :
```
[GarminTab] Loaded from IndexedDB: { swimming: 2, jumpRope: 1, cardio: 0, dailyMetrics: 7, ... }
[GarminDashboard] Metrics for 2025-10-29: { steps: 5306, distance: 4.5, calories: { total: 2340, active: 540, resting: 1800 }, heartRate: { resting: 65, max: 147, avg: 78 } }
```

---

## 🎯 PROCHAINES ÉTAPES

1. **Synchroniser les données Garmin** pour voir les nouveaux logs
2. **Vérifier les logs Python** pour identifier les champs réels retournés par l'API Garmin
3. **Ajuster le parsing** si nécessaire selon les vrais noms de champs trouvés dans les logs
4. **Vérifier IndexedDB** pour confirmer que les données sont bien sauvegardées

---

## ✅ FICHIERS MODIFIÉS

### Backend Python :
- ✅ `garmin-server/parsers/daily_metrics_parser.py`
  - `parse_daily_calories()` - Optimisé avec 19 champs possibles
  - `parse_daily_heart_rate()` - Optimisé avec 17 champs possibles
- ✅ `garmin-server/fetch_garmin_data.py`
  - Logs détaillés pour calories et HR
  - Warnings si données manquantes
  - Logs pour Body Battery, Stress, SpO2, intensityMinutes

### Frontend React :
- ✅ `src/components/tabs/GarminTab/components/charts/GarminHeartRateChart.jsx`
  - Logs de débogage pour identifier les problèmes de données
- ✅ `src/components/tabs/GarminTab/components/charts/GarminBodyBatteryChart.jsx`
  - Logs de débogage pour identifier les problèmes de données

---

**Les optimisations sont en place. Synchronisez vos données Garmin et vérifiez les logs pour identifier précisément où les données se perdent.**

