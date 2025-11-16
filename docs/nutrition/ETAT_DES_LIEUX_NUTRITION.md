# 📋 ÉTAT DES LIEUX COMPLET - MODULE NUTRITION

> **Date de création** : 2025-01-16  
> **Objectif** : Documenter exhaustivement tous les fichiers du module nutrition sous-onglet par sous-onglet

---

## 📊 STRUCTURE GÉNÉRALE

Le module nutrition est organisé en **6 sous-onglets principaux** :
1. **Journal** - Saisie et visualisation des repas journaliers
2. **Programmes** - Gestion des programmes nutritionnels
3. **Analyses** - Analyses approfondies et statistiques
4. **Gamification** - Système de gamification et badges
5. **Progression** - Photos de progression
6. **Partage** - Partage de données avec coach

---

## 🏗️ ARCHITECTURE TECHNIQUE

### 📦 Base de Données IndexedDB

**Base de données** : `WorkoutTrackerDB` (extension v2 → v10)  
**Localisation** : `src/hooks/nutritionDataUtils.js`

#### Schéma complet des stores :

1. **`nutrition_dailyMeals`** - Données journalières agrégées
   - **KeyPath** : `date` (format "YYYY-MM-DD")
   - **Indexes** :
     - `date` : Index principal pour requêtes par date
     - `programId` : Requêtes par programme actif
     - `isComplete` : Filtrage jours complets/incomplets
     - `lastModified` : Tri par date de modification
   - **Structure** :
     ```javascript
     {
       date: "2025-01-15",
       programId: "prog_1234567890",
       isActive: true,
       isComplete: true,
       isCatchup: false,
       lastModified: "2025-01-15T20:30:00Z",
       mealIds: ["meal_1736950200000", "meal_1736950300000"],
       dailyTotals: {
         calories: 2200,
         protein: 150.5,
         carbs: 200.3,
         fat: 70.2,
         waterIntake: 2500,
         proteinPercent: 27,
         carbsPercent: 36,
         fatPercent: 29,
         targetCalories: 2500,
         targetProtein: 150,
         targetCarbs: 300,
         targetFat: 80,
         targetWater: 3000,
         complianceCalories: -300,
         complianceProtein: 0.5,
         complianceCarbs: -99.7,
         complianceFat: -9.8,
         complianceWater: -500,
         complianceScore: 78 // Score 0-100
       }
     }
     ```

2. **`nutrition_meals`** - Repas individuels
   - **KeyPath** : `id` (format "meal_<timestamp>")
   - **Indexes** :
     - `date` : Requêtes par jour
     - `type` : Filtrage par type (breakfast, lunch, dinner, snack)
     - `dailyMealId` : Relation avec dailyMeal
     - `timestamp` : Tri chronologique
   - **Structure** :
     ```javascript
     {
       id: "meal_1736950200000",
       date: "2025-01-15",
       dailyMealId: "2025-01-15",
       type: "breakfast",
       timestamp: "2025-01-15T08:30:00.000Z",
       foods: [
         {
           name: "Œufs brouillés",
           quantity: 200, // grammes
           unit: "g",
           nutritionPer100: {
             calories: 155,
             protein: 13,
             carbs: 1.1,
             fat: 11
           },
           totalCalories: 310,
           totalProtein: 26,
           totalCarbs: 2.2,
           totalFat: 22
         }
       ],
       totalCalories: 310,
       totalProtein: 26,
       totalCarbs: 2.2,
       totalFat: 22,
       notes: "Petit-déjeuner équilibré"
     }
     ```

3. **`nutrition_programs`** - Programmes nutritionnels
   - **KeyPath** : `id` (format "prog_<timestamp>")
   - **Indexes** :
     - `isActive` : Requêtes programme actif (un seul à la fois)
     - `startDate` : Tri par date de début
     - `goal` : Filtrage par objectif (bulk, cut, maintain, recomp)
   - **Structure** :
     ```javascript
     {
       id: "prog_1234567890",
       name: "Prise de masse",
       description: "Surplus calorique + protéines élevées",
       goal: "bulk", // bulk | cut | maintain | recomp
       isActive: true,
       targetCalories: 2800,
       targetProtein: 200,
       targetCarbs: 350,
       targetFat: 90,
       targetWater: 3000,
       targetProteinPercent: 29,
       targetCarbsPercent: 50,
       targetFatPercent: 29,
       adjustForWorkout: true,
       workoutDayCalories: 3000,
       restDayCalories: 2500,
       startDate: "2025-01-01",
       endDate: "2025-04-01",
       duration: 90,
       createdAt: "2025-01-01T00:00:00.000Z"
     }
     ```

4. **`nutrition_favoriteFoods`** - Aliments favoris
   - **KeyPath** : `id` (format "food_fav_<timestamp>")
   - **Indexes** :
     - `category` : Filtrage par catégorie
     - `isFavorite` : Aliments favoris uniquement
     - `usageCount` : Tri par popularité
     - `lastUsed` : Tri par dernière utilisation
   - **Structure** :
     ```javascript
     {
       id: "food_fav_1234567890",
       name: "Poulet grillé",
       nutritionPer100: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
       source: "usda",
       sourceId: "food_123",
       category: "viande",
       isFavorite: true,
       usageCount: 15,
       lastUsed: "2025-01-15T08:30:00.000Z"
     }
     ```

5. **`nutrition_hydrationLog`** - Journal d'hydratation
   - **KeyPath** : `date` (format "YYYY-MM-DD")
   - **Indexes** : Aucun (requêtes simples par date)
   - **Structure** :
     ```javascript
     {
       date: "2025-01-15",
       targetWater: 3000, // ml
       waterIntake: 2500, // ml (somme des entries)
       entries: [
         {
           id: "entry_1234567890",
           amount: 500, // ml
           timestamp: "2025-01-15T08:00:00.000Z",
           notes: "Au réveil"
         }
       ],
       lastModified: "2025-01-15T20:00:00.000Z"
     }
     ```

6. **`nutrition_apiCache`** - Cache API externes (OpenFoodFacts, USDA)
   - **KeyPath** : `key` (format "<source>_<identifier>")
   - **Indexes** :
     - `source` : Filtrage par source (openfoodfacts, usda)
     - `timestamp` : Nettoyage cache expiré
   - **Structure** :
     ```javascript
     {
       key: "openfoodfacts_1234567890",
       source: "openfoodfacts",
       data: { /* Produit formaté */ },
       timestamp: 1736950200000,
       ttl: 86400 // secondes (24h)
     }
     ```

7. **`nutrition_gamification`** - Données gamification
   - **KeyPath** : `id` (format unique selon type)
   - **Indexes** : Aucun (données structurées par type)
   - **Structure** :
     ```javascript
     // Achievement (badge débloqué)
     {
       type: "achievement",
       id: "ach_consistency_7days",
       name: "Consistance 7 jours",
       category: "consistency",
       rarity: "common",
       points: 50,
       icon: "🔥",
       unlockedDate: "2025-01-15T00:00:00.000Z"
     }
     // Experience (XP global)
     {
       type: "experience",
       id: "experience_main",
       currentXP: 1250,
       level: 5,
       history: [
         { date: "2025-01-15", xp: 50, reason: "badge_unlocked" }
       ]
     }
     // Streak
     {
       type: "streak",
       id: "streak_nutrition",
       category: "nutrition",
       current: 15, // Avec forgiveness
       actual: 13, // Réelle
       forgivenessUsed: 2,
       maxReached: false,
       status: "active" // active | maintenance
     }
     ```

8. **`nutrition_shareLinks`** - Liens de partage avec coach
   - **KeyPath** : `token` (token cryptographique unique)
   - **Indexes** :
     - `expiresAt` : Nettoyage liens expirés
     - `scope` : Filtrage par scope (all, stats, charts, progress)
   - **Structure** :
     ```javascript
     {
       token: "share_abc123def456...",
       scope: "all", // all | stats | charts | progress
       permissions: ["read"], // read | write (futur)
       expiresAt: "2025-01-22T00:00:00.000Z",
       createdAt: "2025-01-15T00:00:00.000Z",
       url: "https://app.com/nutrition/share/share_abc123..."
     }
     ```

9. **`nutrition_progressPhotos`** - Photos de progression
   - **KeyPath** : `id` (format unique)
   - **Indexes** :
     - `date` : Tri par date
     - `sequenceId` : Regroupement avant/après
     - `[date, type]` : Index composé pour requêtes optimisées
   - **Structure** :
     ```javascript
     {
       id: "photo_1234567890",
       sequenceId: "seq_1234567890",
       type: "before", // before | after
       date: "2025-01-15",
       data: { full: "blob:...", thumbnail: "blob:..." }, // Format v3.0
       // OU
       data: "blob:...", // Format v2.0 (rétrocompatibilité)
       metadata: {
         weight: 75.5, // kg
         measurements: { waist: 85, chest: 100, hips: 95 }, // cm
         notes: "Photo de départ"
       },
       createdAt: "2025-01-15T08:00:00.000Z"
     }
     ```

10. **`nutrition_mlModels`** - Modèles ML entraînés (TensorFlow.js)
    - **KeyPath** : `id` (format "model_<timestamp>")
    - **Indexes** : Aucun
    - **Structure** :
      ```javascript
      {
        id: "model_1234567890",
        type: "weight_prediction",
        version: "1.0",
        modelData: { /* Données binaires TensorFlow.js */ },
        trainingData: {
          startDate: "2024-10-01",
          endDate: "2025-01-15",
          samples: 107
        },
        accuracy: 0.85, // 85% de précision
        createdAt: "2025-01-15T12:00:00.000Z"
      }
      ```

#### Migration et Versioning :

- **Version DB actuelle** : 10
- **Pattern** : Extension de `WorkoutTrackerDB` (v2 → v10)
- **Migration automatique** : Via `onupgradeneeded`
- **Fallback gracieux** : Si erreur, retourne `null` sans bloquer
- **Singleton pattern** : Une seule instance DB globale (garde-fou React StrictMode)

---

### 🧮 CALCULS NUTRITIONNELS DÉTAILLÉS

**Localisation** : `src/hooks/nutritionCalculations.js`

#### 1. Calcul des Totaux Journaliers (`calculateDailyTotals`)

**Formule** :
```
Pour chaque repas du jour :
  totalCalories += repas.totalCalories
  totalProtein += repas.totalProtein
  totalCarbs += repas.totalCarbs
  totalFat += repas.totalFat
  totalWater += repas.waterIntake (si présent)

Calcul des pourcentages macro (basés sur calories) :
  proteinCalories = totalProtein × 4 kcal/g
  carbsCalories = totalCarbs × 4 kcal/g
  fatCalories = totalFat × 9 kcal/g
  totalMacroCalories = proteinCalories + carbsCalories + fatCalories

  proteinPercent = (proteinCalories / totalMacroCalories) × 100 (arrondi)
  carbsPercent = (carbsCalories / totalMacroCalories) × 100 (arrondi)
  fatPercent = (fatCalories / totalMacroCalories) × 100 (arrondi)

Calcul des écarts (conformité) :
  complianceCalories = totalCalories - targetCalories
  complianceProtein = totalProtein - targetProtein
  complianceCarbs = totalCarbs - targetCarbs
  complianceFat = totalFat - targetFat
  complianceWater = totalWater - targetWater

Score de conformité (0-100) :
  complianceScore = calculateComplianceScore({
    calories: { actual: totalCalories, target: targetCalories },
    protein: { actual: totalProtein, target: targetProtein },
    carbs: { actual: totalCarbs, target: targetCarbs },
    fat: { actual: totalFat, target: targetFat }
  })
```

**Coefficients caloriques** :
- Protéines : **4 kcal/g**
- Glucides : **4 kcal/g**
- Lipides : **9 kcal/g**

**Targets par défaut** (si aucun programme actif) :
- Calories : 2500 kcal
- Protéines : 150 g
- Glucides : 300 g
- Lipides : 80 g
- Eau : 3000 ml

---

#### 2. Score de Conformité (`calculateComplianceScore`)

**Pondérations** :
- Calories : **40%** (le plus important)
- Protéines : **30%** (essentielles pour la construction musculaire)
- Glucides : **15%**
- Lipides : **15%**

**Formule de score** :
```
Pour chaque macro (calories, protein, carbs, fat) :
  ratio = actual / target
  
  SI ratio < 0.8 (déficit de >20%) :
    score = 100 × (ratio / 0.8)  // Pénalité progressive
  SINON SI ratio > 1.2 (surplus de >20%) :
    score = 100 × (1.2 / ratio)  // Pénalité progressive
  SINON (0.8 ≤ ratio ≤ 1.2) :
    score = 100  // Score parfait (tolérance ±20%)

Score final (pondéré) :
  totalScore = Σ(score × weight) pour chaque macro
  totalWeight = Σ(weight) pour chaque macro avec target > 0
  complianceScore = Math.round(totalScore / totalWeight)
```

**Exemple de calcul** :
```
Données :
  Calories : 2200 / 2500 (ratio = 0.88) → score = 100 (dans tolérance)
  Protéines : 180 / 150 (ratio = 1.2) → score = 100 (limite tolérance)
  Glucides : 200 / 300 (ratio = 0.67) → score = 100 × (0.67/0.8) = 83.75
  Lipides : 70 / 80 (ratio = 0.875) → score = 100

Score pondéré :
  totalScore = (100 × 0.4) + (100 × 0.3) + (83.75 × 0.15) + (100 × 0.15)
            = 40 + 30 + 12.56 + 15 = 97.56
  complianceScore = Math.round(97.56) = 98
```

**Tolérance** :
- **±20%** autour de la cible = score parfait (100)
- **<80%** ou **>120%** = pénalité progressive

---

#### 3. Bilan Calorique (`calculateCaloricBalance`)

**Formule** :
```
Bilan = Calories Consommées - Calories Dépensées

Classification :
  SI bilan > 200 kcal → 'surplus'
  SI bilan < -200 kcal → 'deficit'
  SINON → 'maintien'

Pourcentage :
  percent = (bilan / caloriesDépensées) × 100 (arrondi)
```

**Source calories dépensées** :
1. **Garmin** (priorité) : `garminData.dailyMetrics[date].calories.total`
2. **Estimation par défaut** : 2000 kcal/jour (TDEE approximatif)

**Seuils** :
- **±200 kcal** = zone de maintien
- **>200 kcal** = surplus (prise de poids)
- **<-200 kcal** = déficit (perte de poids)

---

#### 4. Statistiques Nutritionnelles (`getNutritionStats`)

**Formule** :
```
Filtrer dailyMeals dans plage [startDate, endDate] avec dailyTotals

Moyennes :
  avgCalories = Σ(calories) / days (arrondi)
  avgProtein = Σ(protein) / days (arrondi à 1 décimale)
  avgCarbs = Σ(carbs) / days (arrondi à 1 décimale)
  avgFat = Σ(fat) / days (arrondi à 1 décimale)

Total :
  totalCalories = Σ(calories)

Variabilité (écart-type) :
  mean = Σ(valeur) / n
  variance = Σ((valeur - mean)²) / n
  stdDev = √(variance)
```

**Variabilité** : Mesure de la régularité (écart-type faible = très régulier)

---

#### 5. Conformité Programme (`calculateProgramCompliance`)

**Formule** :
```
Filtrer dailyMeals :
  - Dans plage [startDate, endDate]
  - Pour programme programId (si spécifié)
  - Avec dailyTotals existant

Pour chaque jour avec données :
  totalComplianceScore += dailyTotals.complianceScore
  totalCaloriesCompliance += dailyTotals.complianceCalories
  totalProteinCompliance += dailyTotals.complianceProtein
  totalCarbsCompliance += dailyTotals.complianceCarbs
  totalFatCompliance += dailyTotals.complianceFat
  daysWithData++

Moyennes :
  avgComplianceScore = Math.round(totalComplianceScore / daysWithData)
  caloriesCompliance.avg = Math.round(totalCaloriesCompliance / daysWithData)
  proteinCompliance.avg = Math.round((totalProteinCompliance / daysWithData) × 10) / 10
  carbsCompliance.avg = Math.round((totalCarbsCompliance / daysWithData) × 10) / 10
  fatCompliance.avg = Math.round((totalFatCompliance / daysWithData) × 10) / 10
```

**Retour** :
- `daysTotal` : Nombre total de jours dans la plage
- `daysWithData` : Nombre de jours avec données nutritionnelles
- `avgComplianceScore` : Score moyen de conformité (0-100)
- `caloriesCompliance` : `{ avg: number, days: number }`
- `proteinCompliance` : `{ avg: number, days: number }`
- `carbsCompliance` : `{ avg: number, days: number }`
- `fatCompliance` : `{ avg: number, days: number }`

---

### 🔄 FLUX DE DONNÉES

#### Flux principal : Ajout d'un repas

```
1. Utilisateur ouvre NutritionJournal
   ↓
2. NutritionJournal charge données du jour via `loadDayData()`
   - Appelle `nutritionData.getDailyMeal(dateStr)`
   - Appelle `nutritionData.getMealsByDate(dateStr)`
   - Appelle `nutritionData.getActiveProgram()`
   ↓
3. Utilisateur clique "Ajouter repas"
   ↓
4. MealEntryForm s'ouvre (modal)
   ↓
5. Utilisateur ajoute aliments
   - Option A : Recherche via FoodSearch (OpenFoodFacts/USDA)
   - Option B : Saisie vocale via VoiceInput
   - Option C : Photo via FoodPhotoScanner
   - Option D : Saisie manuelle
   ↓
6. Calculs automatiques à chaque modification aliment
   - `calculateFoodTotals()` : Pour chaque aliment (ratio quantité/100g)
   - `totals` (useMemo) : Totaux du repas (somme de tous les aliments)
   ↓
7. Utilisateur sauvegarde le repas
   ↓
8. MealEntryForm appelle `handleSave()`
   - Valide : au moins un aliment avec nom
   - Appelle `nutritionData.saveMeal(mealData)`
   ↓
9. nutritionDataCRUD.saveMeal() sauvegarde dans IndexedDB
   - Store `nutrition_meals` : Sauvegarde meal complet
   - Store `nutrition_dailyMeals` : Mise à jour dailyMeal
     - Ajoute mealId dans mealIds[]
     - Recalcule dailyTotals via `calculateDailyTotals(meals, program)`
     - Met à jour lastModified
   ↓
10. NutritionJournal recharge données via `loadDayData()`
    ↓
11. UI mise à jour :
    - MealList affiche nouveau repas
    - DailyTotalsCard affiche totaux mis à jour
    - ComplianceDisplay affiche conformité mise à jour
```

#### Flux : Calcul conformité en temps réel

```
DailyTotalsCard reçoit dailyMeal avec dailyTotals :
  ↓
Pour chaque macro affichée :
  1. Affiche valeur actuelle
  2. Affiche valeur cible (depuis activeProgram)
  3. Calcule écart : diff = actual - target
  4. Calcule pourcentage : percent = (actual / target) × 100
  5. Détermine couleur :
     - Vert : |diff| ≤ target × 0.1 (±10%)
     - Orange : diff > target × 0.1 (surplus)
     - Rouge : diff < -target × 0.1 (déficit)
  6. Affiche icône : TrendingUp / TrendingDown / Minus
```

#### Flux : Bilan calorique avec Garmin

```
DailyTotalsCard affiche bilan si garminData disponible :
  ↓
1. Récupère calories consommées : dailyMeal.dailyTotals.calories
   ↓
2. Appelle `nutritionData.calculateCaloricBalance(calories, garminData, dateStr)`
   ↓
3. calculateCaloricBalance() :
   - Récupère calories dépensées : garminData.dailyMetrics[date].calories.total
   - Si non disponible : utilise estimation 2000 kcal
   - Calcule : balance = consumed - burned
   - Classifie : surplus / maintien / deficit (seuils ±200 kcal)
   ↓
4. Retourne :
   {
     consumed: 2200,
     burned: 2400,
     balance: -200,
     classification: 'maintien',
     percent: -8
   }
   ↓
5. DailyTotalsCard affiche :
   - Calories consommées vs dépensées
   - Bilan avec couleur (vert si maintien, orange/rouge si surplus/déficit)
```

---

### 🔌 HOOKS ET SERVICES PRINCIPAUX

#### `useNutritionData` (Hook principal)

**Localisation** : `src/hooks/useNutritionData.js`  
**Rôle** : Interface unifiée pour toutes les opérations nutrition

**Fonctionnalités** :
- Gestion état `dbReady` (singleton pattern avec garde-fou React StrictMode)
- Délégation CRUD à `nutritionDataCRUD`
- Calculs via `nutritionCalculations`
- Export/Import JSON (pour SettingsTab)

**Méthodes exposées** :
```javascript
{
  // DailyMeals
  getDailyMeal(date, options),
  saveDailyMeal(dailyMeal, options),
  getDailyMealsByRange(startDate, endDate),
  deleteDailyMeal(date),
  
  // Meals
  getMeal(id),
  saveMeal(meal),
  getMealsByDate(date),
  getMealsByDateAndType(date, type),
  getMealsByDailyMealId(dailyMealId),
  getAllMeals(),
  deleteMeal(id),
  
  // Programs
  getAllPrograms(),
  getActiveProgram(),
  saveProgram(program),
  deleteProgram(id),
  
  // FavoriteFoods
  getFavoriteFoods(options),
  getFavoriteFood(id),
  saveFavoriteFood(food),
  deleteFavoriteFood(id),
  
  // Hydration
  getHydrationLog(date),
  saveHydrationLog(hydrationLog),
  addWaterIntake(date, amount, notes),
  getHydrationLogByRange(startDate, endDate),
  deleteHydrationLog(date),
  
  // Calculs
  calculateDailyTotals(meals, program),
  calculateCaloricBalance(calories, garminData, date),
  calculateProgramCompliance(programId, dailyMeals, program, startDate, endDate),
  getNutritionStats(dailyMeals, startDate, endDate),
  getMacroDistribution(dailyMeals, startDate, endDate),
  
  // Export/Import
  exportAll(), // Exporte toutes les données JSON
  importAll(jsonData) // Importe depuis JSON
}
```

**Singleton DB** :
- `globalDBReadyPromise` : Promesse d'initialisation globale
- `globalDBReady` : État booléen (évite réinitialisation React StrictMode)

---

### 💾 SYSTÈME DE CACHE MULTI-NIVEAUX

**Localisation** : `src/services/nutrition/openFoodFactsService.js`, `usdaService.js`

#### Architecture cache L1 + L2 :

```
1. L1 - Memory Cache (LRU, limite 100 entrées)
   - Temps d'accès : ~0.1ms (instantané)
   - Limite : 100 entrées (évite memory leak)
   - TTL : Configurable (défaut 24h)
   - Implémentation : `LRUCache` (Map avec taille limitée)

2. L2 - IndexedDB Cache (Store `nutrition_apiCache`)
   - Temps d'accès : ~10-50ms
   - Capacité : Limitée par IndexedDB (~50-100MB)
   - TTL : Configurable (défaut 24h)
   - Index : `source`, `timestamp` (nettoyage automatique)

3. L3 - API Externe (OpenFoodFacts / USDA)
   - Temps d'accès : ~200-1000ms (réseau)
   - Limite : Rate limiting API
   - Fallback : Si API échoue, retourne null
```

#### Flux de cache :

```
1. Recherche produit par code/nom
   ↓
2. Vérifier L1 (Memory)
   - SI trouvé ET non expiré → Retourner immédiatement
   - SINON → Continuer
   ↓
3. Vérifier L2 (IndexedDB)
   - SI trouvé ET non expiré → Promouvoir en L1 + Retourner
   - SINON → Continuer
   ↓
4. Appeler API externe
   - SI succès → Mettre en cache L1 + L2 + Retourner
   - SI erreur → Retourner null (fallback gracieux)
```

#### Nettoyage automatique :

- **L1 (Memory)** : Éviction LRU automatique (limite 100)
- **L2 (IndexedDB)** : Nettoyage au démarrage si TTL expiré
- **TTL par défaut** : 24h (86400 secondes)

---

### 🎮 ALGORITHMES DE GAMIFICATION

**Localisation** : `src/services/nutrition/nutritionGamification.js`

#### 1. Système XP & Niveaux

**Formule XP par niveau** :
```
Niveau 1 : 0 XP (départ)
Niveau 2 : 100 XP
Niveau 3+ : 100 × 2^(level-2) XP (formule exponentielle)

Exemples :
  Niveau 3 : 100 × 2^(3-2) = 100 × 2 = 200 XP
  Niveau 4 : 100 × 2^(4-2) = 100 × 4 = 400 XP
  Niveau 5 : 100 × 2^(5-2) = 100 × 8 = 800 XP
  Niveau 6 : 100 × 2^(6-2) = 100 × 16 = 1600 XP
```

**Récompenses XP** :
- **Repas saisi** (`meal_logged`) : 5 XP
- **Jour complet** (`day_complete`) : 20 XP (tous repas saisis)
- **Respect programme** (`program_compliant`) : 15 XP (conformité ≥80%)
- **Badge débloqué** (`badge_unlocked`) : 50 XP × multiplicateur rareté
  - Common (×1) : 50 XP
  - Rare (×2) : 100 XP
  - Epic (×3) : 150 XP
  - Legendary (×5) : 250 XP
- **Palier série** (`streak_milestone`) : 100 XP (7j, 30j, 100j)

**Calcul progression niveau** :
```
XP actuel = currentXP
XP nécessaire niveau suivant = getXPForLevel(level + 1)
XP actuel niveau = currentXP - getXPForLevel(level)
XP manquant = XP nécessaire niveau suivant - XP actuel

Pourcentage progression :
  progressPercent = (XP actuel niveau / (XP nécessaire niveau suivant - XP actuel niveau)) × 100

Exemple :
  Level 3, currentXP = 250
  XP niveau 4 = 400
  XP actuel niveau 3 = 250 - 200 = 50
  XP manquant = 400 - 250 = 150
  progressPercent = (50 / 150) × 100 = 33.3%
```

**Level up** :
- Déclenché si `newXP >= xpForNextLevel`
- Historique : Ajout entrée `{ date, xp: points, reason }`

---

#### 2. Calcul Streaks avec Forgiveness

**Algorithme** :
```
Initialisation :
  streak = 0
  forgiveness = 2 (jours manqués tolérés)
  today = date du jour (midnight)

Parcourir depuis aujourd'hui vers le passé (max 365 jours) :
  Pour chaque jour i (0 à 365) :
    checkDate = today - i jours
    dateStr = format YYYY-MM-DD
    
    SI jour a des données (repas saisis) :
      streak++
      forgiveness = 2  // Reset forgiveness (jour validé)
    SINON :
      SI forgiveness > 0 :
        forgiveness--  // Utiliser un jour de forgiveness
        streak++       // Continuer série (jour pardonné)
      SINON :
        BREAK  // Fin série (plus de forgiveness)
```

**Logique forgiveness** :
- **2 jours manqués tolérés** : Permet de ne pas perdre la série si oubli ponctuel
- **Reset automatique** : Si jour avec données, forgiveness revient à 2
- **Streak affichée** : Limitée à 30j max (anti-anxiété)
- **Streak réelle** : Peut être > 30j (pour badges)

**Exemple** :
```
Jour 0 (aujourd'hui) : Données ✓ → streak=1, forgiveness=2
Jour 1 : Données ✓ → streak=2, forgiveness=2
Jour 2 : Pas de données ✗ → streak=3, forgiveness=1 (pardonné)
Jour 3 : Pas de données ✗ → streak=4, forgiveness=0 (pardonné)
Jour 4 : Données ✓ → streak=5, forgiveness=2 (reset)
Jour 5 : Pas de données ✗ → streak=6, forgiveness=1
...
```

**Mode maintenance** :
- Activé si `streak >= 30 jours`
- `status = 'maintenance'`
- Badge "Entretien" débloqué
- Philosophie : Focus santé vs perfectionnisme

---

#### 3. Badges et Conditions

**Types de badges** :

1. **Consistance (Consistency)** :
   - `badge_7day_streak` : Streak ≥ 7 jours (Common, 50 XP)
   - `badge_30day_streak` : Streak ≥ 30 jours (Rare, 200 XP)
   - `badge_100day_streak` : Streak ≥ 100 jours (Epic, 500 XP)

2. **Nutrition** :
   - `badge_protein_master` : Objectif protéines ≥95% pendant 30j consécutifs (Rare, 150 XP)
   - `badge_program_100` : Conformité ≥80% pendant 7j consécutifs (Common, 100 XP)
   - `badge_surplus_controlled` : Surplus 0-500 kcal pendant 7j (Rare, 150 XP)
   - `badge_variety_master` : 15 aliments différents sur 7j (Common, 75 XP)
   - `badge_hydration_king` : Objectif hydratation ≥90% pendant 7j (Common, 100 XP)

3. **Progression** :
   - `badge_improvement_20pct` : Amélioration ≥20% sur 30j (Rare, 200 XP)
   - `badge_consistency_master` : Variabilité <10% sur 30j (Epic, 300 XP)

**Vérification badges** :
```
Pour chaque badge non débloqué :
  1. Vérifier condition(badge.condition, userData)
  2. SI condition remplie :
     - Débloquer badge
     - Ajouter XP : badge.points × BADGE_RARITY[badge.rarity].multiplier
     - Sauvegarder dans IndexedDB (store `nutrition_gamification`)
     - Retourner dans newBadges[]
```

**Raretés et multiplicateurs** :
- `common` : ×1 (gris, 50-100 XP)
- `rare` : ×2 (bleu, 100-200 XP)
- `epic` : ×3 (violet, 150-500 XP)
- `legendary` : ×5 (jaune, 250-1000 XP)

---

### 📊 ALGORITHMES DE CORRÉLATIONS STATISTIQUES

**Localisation** : `src/services/nutrition/nutritionCorrelations.js`

#### 1. Coefficient de Corrélation de Pearson

**Formule complète** :
```
Étapes :
1. Vérifier taille échantillon minimum : n >= 10
2. Filtrer valeurs valides (pas de null/undefined/NaN/Infinity)
3. Calculer moyennes :
   meanX = Σ(xi) / n
   meanY = Σ(yi) / n

4. Calculer covariance et variances :
   numerator = Σ((xi - meanX) × (yi - meanY))  // Covariance
   sumSqX = Σ((xi - meanX)²)                   // Variance X
   sumSqY = Σ((yi - meanY)²)                   // Variance Y

5. Calculer coefficient Pearson :
   r = numerator / √(sumSqX × sumSqY)
   
   SI denominator === 0 → r = 0 (pas de variance)
```

**Interprétation** :
- **r = 1** : Corrélation positive parfaite
- **r = 0** : Aucune corrélation
- **r = -1** : Corrélation négative parfaite
- **|r| > 0.7** : Forte corrélation
- **0.4 ≤ |r| < 0.7** : Corrélation modérée
- **0.2 ≤ |r| < 0.4** : Corrélation faible
- **|r| < 0.2** : Négligeable

---

#### 2. Test de Significativité (t-test)

**Formule** :
```
Statistique t :
  t = (r × √(n - 2)) / √(1 - r²)

Degrés de liberté :
  df = n - 2

p-value (approximation t-distribution) :
  SI df < 10 :
    Table t-values (approximation) :
      t > 3.355 → p = 0.01 (99% confiance, df=8)
      t > 2.306 → p = 0.05 (95% confiance, df=8)
      t > 2.262 → p = 0.05 (95% confiance, df=9)
      t > 1.860 → p = 0.10 (90% confiance, df=9)
      SINON → p = 0.20 (non significatif)
  
  SINON (df >= 10) :
    Approximation normale :
      t > 2.576 → p = 0.01 (99% confiance)
      t > 1.96  → p = 0.05 (95% confiance)
      t > 1.645 → p = 0.10 (90% confiance)
      SINON → p = 0.20 (non significatif)
```

**Significativité** :
- **p < 0.05** : Significatif (95% confiance)
- **p < 0.01** : Très significatif (99% confiance)
- **p ≥ 0.05** : Non significatif (peut être dû au hasard)

---

#### 3. Force de Corrélation (ajustée selon échantillon)

**Seuils standards (n >= 30)** :
```
SI p >= 0.05 :
  → 'non_significant' (rouge)

SINON (p < 0.05) :
  SI |r| >= 0.7 → 'strong' (vert, forte corrélation)
  SI |r| >= 0.4 → 'moderate' (jaune, corrélation modérée)
  SI |r| >= 0.2 → 'weak' (bleu, corrélation faible)
  SINON → 'negligible' (gris)
```

**Seuils stricts (n < 30)** :
```
SI p >= 0.05 :
  → 'non_significant' (rouge)

SINON (p < 0.05) :
  SI |r| >= 0.7 → 'moderate' (pas "strong" si n < 30)
  SI |r| >= 0.5 → 'weak'
  SINON → 'negligible'
```

**Raison ajustement** : Petits échantillons → plus de variabilité → seuils plus stricts

---

#### 4. Recommandations Actionnables

**Conditions** :
```
actionable = (p < 0.05) ET (n >= 30)

SI actionable :
  → Recommandation générée
  → Insights détaillés
  → Affichage dans UI

SINON :
  → Warning affiché
  → Pas de recommandation actionnable
```

**Exemples de corrélations analysées** :
1. **Calories vs Poids** : Corrélation entre apport calorique et évolution poids
2. **Protéines vs Performance** : Corrélation entre apport protéines et performance workouts
3. **Hydratation vs Endurance** : Corrélation entre hydratation et endurance workouts
4. **Conformité vs Résultats** : Corrélation entre conformité programme et résultats

**Alignement données par date** :
```
Fonction alignDataByDate(data1, data2) :
  1. Créer Map par date pour accès rapide
  2. Pour chaque date commune :
     - Ajouter valeur data1 dans arrayX
     - Ajouter valeur data2 dans arrayY
  3. Retourner { x: Array<number>, y: Array<number>, dates: Array<string> }
```

---

### 🤖 ALGORITHMES DE PRÉDICTIONS ML

**Localisation** : `src/services/nutrition/nutritionPredictions.js`  
**Framework** : TensorFlow.js (modèle offline, pas de cloud)

#### 1. Modèle de Prédiction de Poids

**Architecture** :
- **Type** : Régression linéaire avec features temporelles
- **Inputs** : Historique poids (minimum 30 jours)
- **Output** : Poids prédit pour horizon (7, 14, 30 jours)
- **Entraînement** : Offline dans le navigateur (non-bloquant UI)

**Features calculées** :
```
Pour chaque jour d'historique :
  - weight : Poids (kg)
  - dayIndex : Index jour (0 = plus ancien, n = plus récent)
  - trend : Tendance (moyenne mobile 7 jours)
  - variability : Variabilité (écart-type 7 jours)
  - acceleration : Accélération (différence de tendance)
```

**Entraînement modèle** :
```
1. Préparer données d'entraînement :
   - Filtrer valeurs valides (pas de null/undefined)
   - Normaliser features (moyenne=0, std=1)
   - Séparer train/test (80/20)

2. Créer modèle TensorFlow.js :
   - Architecture : Sequential
   - Couches : Dense(input), Dense(hidden), Dense(output)
   - Optimiseur : Adam
   - Loss : meanSquaredError
   - Métriques : meanAbsoluteError

3. Entraîner (non-bloquant) :
   - Batch size : 32
   - Epochs : 50-100 (early stopping)
   - Validation split : 0.2
   - Callbacks : onProgress (feedback UI)

4. Évaluer :
   - Calcul accuracy : 1 - (MAE / moyenne poids)
   - Sauvegarder modèle dans IndexedDB (store `nutrition_mlModels`)
```

**Prédiction** :
```
1. Charger modèle depuis IndexedDB
2. Préparer features pour date cible
3. Normaliser features (même normalisation qu'entraînement)
4. Prédire : model.predict(features)
5. Dénormaliser poids prédit
6. Retourner : { predictedWeight, date, daysAhead, confidence }
```

**Conditions minimum** :
- **30 jours de données** requis pour entraînement fiable
- **TensorFlow.js** requis (fallback si non supporté)
- **Modèle sauvegardé** : Réutilisé si déjà entraîné (pas re-entraînement systématique)

**Exemple prédiction** :
```
Données :
  Poids actuel : 75 kg
  Historique : 30 jours (73.5 → 75.0 kg, tendance montante)
  Modèle entraîné : Accuracy 85%

Prédiction 30 jours :
  Poids prédit : 76.2 kg
  Différence : +1.2 kg
  Pourcentage : +1.6%
  Tendance : up
```

---

### 🧠 SYSTÈME EXPERT (RECOMMANDATIONS RULES-BASED)

**Localisation** : `src/services/nutrition/nutritionExpertSystem.js`  
**Philosophie** : 0 MB, <1ms, 100% fiable (pas d'hallucinations)

#### Architecture :

```
Pour chaque règle expert (EXPERT_RULES[]) :
  1. Évaluer condition(userData)
  2. SI condition remplie :
     - Générer advice (fonction ou string)
     - Ajouter à recommendations[] avec priority/category
  3. Trier par priorité (high > medium > low)

Retourner :
  {
    recommendations: [{ id, text, priority, category }],
    summary: generateSummary(),
    timestamp: ISO string,
    dataQuality: { daysAnalyzed, hasGarminData, hasActiveProgram }
  }
```

#### Exemples de règles :

**Priorité HAUTE** :
- `protein_deficit_severe` : Protéines < 70% cible → Conseil augmenter protéines
- `calories_excess_severe` : Calories > 130% cible → Conseil réduire calories
- `hydration_critical` : Eau < 50% objectif → Conseil hydratation urgente

**Priorité MEDIUM** :
- `macro_imbalance` : Distribution macros déséquilibrée → Conseil équilibrer
- `fiber_low` : Fibres < 25g/jour → Conseil augmenter fibres
- `timing_irregular` : Repas irréguliers → Conseil régulariser horaires

**Priorité LOW** :
- `variety_suggestion` : Variété faible (<10 aliments/7j) → Conseil diversifier
- `timing_optimization` : Timing sous-optimal → Conseil optimiser timing

**Catégories** :
- `protein` : Protéines
- `calories` : Calories
- `hydration` : Hydratation
- `timing` : Timing des repas
- `macros` : Distribution macros
- `variety` : Variété alimentaire
- `consistency` : Régularité

---

### ⏱️ ANALYSE CHRONOBIOLOGIQUE

**Localisation** : `src/services/nutrition/nutritionChronobiology.js`

#### Timing Pré-Workout :

```
Algorithme :
1. Pour chaque workout :
   - Trouver repas précédent (dans X heures avant workout)
   - Calculer temps entre repas et workout
   - Classer par créneaux (1h, 2h, 3h, 4h+ avant)

2. Agréger par créneau :
   - Calculer performance moyenne par créneau
   - Identifier créneau optimal (performance max)

3. Retourner :
   {
     optimalHours: 2, // Heures optimales avant workout
     avgPerformance: 85, // Performance moyenne à ce timing
     recommendation: "Repas 2h avant workout recommandé"
   }
```

#### Timing Post-Workout :

```
Algorithme :
1. Pour chaque workout :
   - Trouver repas suivant (dans X heures après workout)
   - Calculer temps entre workout et repas
   - Classer par créneaux (0-30min, 30-60min, 1-2h, 2h+)

2. Agréger par créneau :
   - Calculer récupération moyenne par créneau
   - Identifier créneau optimal (récupération max)

3. Retourner :
   {
     optimalHours: 1, // Heures optimales après workout
     avgRecovery: 90, // Récupération moyenne à ce timing
     recommendation: "Repas 1h après workout recommandé"
   }
```

#### Distribution Protéines :

```
Algorithme :
1. Agréger protéines par type repas :
   - breakfast : Σ(protéines petit-déjeuner) / jours
   - lunch : Σ(protéines déjeuner) / jours
   - dinner : Σ(protéines dîner) / jours
   - total : Σ(toutes protéines) / jours

2. Calculer pourcentages :
   - breakfastPercent = (breakfast / total) × 100
   - lunchPercent = (lunch / total) × 100
   - dinnerPercent = (dinner / total) × 100

3. Recommandation :
   - Si distribution équilibrée (33% chaque) → OK
   - Si déséquilibre → Conseil répartir mieux
```

**Recommandations optimales** :
- **Petit-déjeuner** : 25-30% protéines quotidiennes
- **Déjeuner** : 30-40% protéines quotidiennes
- **Dîner** : 30-40% protéines quotidiennes
- **Pré-workout** : 2-3h avant (glucides + protéines légères)
- **Post-workout** : 30-60min après (protéines + glucides rapides)

---

---

## 1️⃣ SOUS-ONGLET : JOURNAL 📅

**Composant principal** : `NutritionJournal.jsx`  
**Localisation** : `src/components/tabs/nutrition/components/NutritionJournal.jsx`

### 📁 Fichiers du sous-onglet Journal

#### 1.1. **NutritionJournal.jsx** (297 lignes)
**Rôle** : Composant principal orchestrant le journal nutritionnel quotidien

**Fonctionnalités principales** :
- ✅ Sélection de date avec navigation (précédent/suivant)
- ✅ Chargement des données du jour (dailyMeal, meals, activeProgram)
- ✅ Affichage des totaux journaliers via `DailyTotalsCard`
- ✅ Affichage du suivi d'hydratation via `HydrationTracker`
- ✅ Affichage de la liste des repas via `MealList`
- ✅ Formulaire d'ajout/modification de repas via `MealEntryForm` (modal)
- ✅ Modal de confirmation de suppression (remplace `window.confirm`)

**Optimisations appliquées** :
- ✅ **OPT 16** : Utilisation `DateHelper.toYYYYMMDD()` pour cohérence timezone locale (ligne 41)
- ✅ **OPT 17-18** : Mémorisation `loadDayData`, `handleMealSave`, `handleMealDeleteClick`, `handleMealDeleteConfirm`, `handleMealDeleteCancel` avec `useCallback` (lignes 44-119)
- ✅ **OPT 19** : Modal personnalisée pour confirmation suppression au lieu de `window.confirm` (lignes 36-38, 93-119, 252-291)

**Imports** :
- `React`, `useState`, `useEffect`, `useCallback`
- `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `Button`, `Input`, `Modal`
- `Calendar`, `Plus`, `Clock`, `AlertTriangle` (lucide-react)
- `DateHelper` (utils/dateHelper)
- `DailyTotalsCard`, `MealList`, `MealEntryForm`, `HydrationTracker`

**States** :
- `dailyMeal` : Données du jour (totaux, conformité)
- `meals` : Liste des repas du jour
- `activeProgram` : Programme actif (si existe)
- `showMealForm` : Affichage formulaire repas
- `editingMeal` : Repas en cours d'édition (null si création)
- `loading` : État de chargement
- `showDeleteConfirm` : Affichage modal confirmation suppression
- `mealToDelete` : ID du repas à supprimer

**Callbacks** :
- `loadDayData` : Charge les données du jour (dailyMeal, meals, activeProgram)
- `handleMealSave` : Sauvegarde un repas (création ou modification)
- `handleMealDeleteClick` : Ouvre modal de confirmation suppression
- `handleMealDeleteConfirm` : Confirme et exécute la suppression
- `handleMealDeleteCancel` : Annule la suppression

---

#### 1.2. **DailyTotalsCard.jsx** (242 lignes)
**Rôle** : Affiche les totaux nutritionnels du jour avec conformité

**Fonctionnalités principales** :
- ✅ Affichage score de conformité (si programme actif)
- ✅ Affichage calories avec barre de progression et conformité
- ✅ Affichage macros (protéines, glucides, lipides) avec pourcentages et conformité
- ✅ Affichage bilan calorique (avec intégration Garmin si disponible)
- ✅ Affichage hydratation avec barre de progression

**Optimisations appliquées** :
- ✅ **OPT 20** : Helpers extraits en composants réutilisables
  - `ProgressBar` : Composant UI générique (`src/components/ui/ProgressBar.jsx`)
  - `ComplianceDisplay` : Composant spécifique nutrition (`src/components/tabs/nutrition/components/ComplianceDisplay.jsx`)
  - Lignes 18-19, 42-44, 90-95, 124-129, 140-145, 156-161

**Imports** :
- `React`
- `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `Target`, `TrendingUp`, `TrendingDown`, `Minus`, `Droplet` (lucide-react)
- `Badge`
- `ProgressBar` (composant réutilisable)
- `ComplianceDisplay` (composant réutilisable)

**Props** :
- `dailyMeal` : Données du jour (avec `dailyTotals`)
- `activeProgram` : Programme actif (null si aucun)
- `garminData` : Données Garmin (si disponible)
- `dateStr` : Date au format YYYY-MM-DD
- `nutritionData` : Hook `useNutritionData` (pour `calculateCaloricBalance`)

**Affichage conditionnel** :
- Score de conformité : Uniquement si `activeProgram !== null`
- Bilan calorique : Uniquement si `garminData` disponible
- Message "Créer programme" : Si `activeProgram === null`

---

#### 1.3. **ComplianceDisplay.jsx** (46 lignes) ⭐ **NOUVEAU**
**Rôle** : Composant réutilisable pour afficher la conformité nutritionnelle

**Fonctionnalités principales** :
- ✅ Affichage valeur actuelle avec unité
- ✅ Affichage valeur cible et écart (si `showTarget === true`)
- ✅ Calcul automatique pourcentage de conformité
- ✅ Couleurs automatiques selon écart (±10% = bon = vert)

**Optimisations appliquées** :
- ✅ **OPT 20** : Composant extrait de `DailyTotalsCard.jsx` pour réutilisabilité

**Imports** :
- `React`

**Props** :
- `actual` : Valeur actuelle (number)
- `target` : Valeur cible (number)
- `unit` : Unité de mesure (string, ex: 'g', 'kcal')
- `showTarget` : Afficher cible et écart (boolean, défaut: true)

**Logique** :
- `diff = actual - target`
- `percent = (actual / target) * 100` (arrondi)
- `isGood = |diff| <= target * 0.1` (±10%)
- Couleur : vert si bon, orange si surplus, rouge si déficit

---

#### 1.4. **MealList.jsx** (209 lignes)
**Rôle** : Affiche la liste des repas du jour groupés par type

**Fonctionnalités principales** :
- ✅ Groupement des repas par type (petit-déjeuner, déjeuner, dîner, collation)
- ✅ Tri chronologique pour chaque type
- ✅ Affichage heure, aliments, quantités, totaux par repas
- ✅ Actions modifier/supprimer pour chaque repas
- ✅ Bouton ajouter repas

**Optimisations appliquées** :
- ✅ **OPT 21-22** : Mémorisation `mealsByType` avec `useMemo` pour éviter recalcul à chaque rendu (lignes 29-50)
- ✅ **OPT 23** : Mémorisation `formatTime` avec `useCallback` (lignes 52-57)

**Imports** :
- `React`, `useMemo`, `useCallback`
- `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `Button`
- `Clock`, `Edit2`, `Trash2`, `Plus`, `Utensils` (lucide-react)

**Props** :
- `meals` : Liste des repas du jour (array)
- `onEdit` : Callback pour modifier un repas
- `onDelete` : Callback pour supprimer un repas
- `onAdd` : Callback pour ajouter un repas

**Types de repas** :
- `breakfast` : Petit-déjeuner 🌅
- `lunch` : Déjeuner 🍽️
- `dinner` : Dîner 🌙
- `snack` : Collation 🍎

**Calculs mémorisés** :
- `mealsByType` : Groupe et tri les repas par type (useMemo)
- `formatTime` : Formate timestamp en HH:mm (useCallback)

---

#### 1.5. **MealEntryForm.jsx** (557 lignes)
**Rôle** : Formulaire modal pour ajouter ou modifier un repas

**Fonctionnalités principales** :
- ✅ Sélection type de repas (petit-déjeuner, déjeuner, dîner, collation)
- ✅ Sélection heure du repas
- ✅ Ajout d'aliments :
  - Recherche via `FoodSearch` (modal imbriquée)
  - Saisie vocale via `VoiceInput`
  - Reconnaissance photo via `FoodPhotoScanner`
  - Saisie manuelle
- ✅ Modification aliments (nom, quantité, unité, valeurs nutritionnelles/100g)
- ✅ Calcul automatique totaux par aliment et totaux du repas
- ✅ Notes optionnelles
- ✅ Validation avant sauvegarde

**Optimisations appliquées** :
- ✅ **OPT 24** : `new Date().toISOString()` approprié pour timestamp (nécessite temps complet)
- ✅ **OPT 25-26** : Mémorisation callbacks et totaux
  - `handleAddFood`, `handleFoodSelected`, `handleVoiceFoodsSelected`, `handlePhotoFoodsSelected`, `handleRemoveFood`, `handleUpdateFood`, `handleSave` avec `useCallback` (lignes 62-194)
  - `calculateFoodTotals` avec `useCallback` (lignes 121-129)
  - `totals` avec `useMemo` (lignes 132-142)
  - Optimisation calculs répétés dans JSX (lignes 448-471)
- ✅ **OPT 47** : Remplacement `alert()` par toasts `showError` pour validation et erreurs (lignes 22, 25, 148, 155, 189, 194)
- ✅ **OPT 47** : Logger standardisé `log.error` au lieu de `console.error` (lignes 25, 189)

**Imports** :
- `React`, `useState`, `useEffect`, `useCallback`, `useMemo`
- `Modal`, `Button`, `Input`
- `X`, `Plus`, `Trash2`, `Save`, `Search`, `Mic`, `Camera` (lucide-react)
- `FoodSearch`, `VoiceInput`, `FoodPhotoScanner`
- `useToast` (pour toasts)
- `logger` (pour logging standardisé)

**States** :
- `mealType` : Type de repas (breakfast, lunch, dinner, snack)
- `foods` : Liste des aliments du repas
- `notes` : Notes optionnelles
- `timestamp` : Heure du repas (ISO string)
- `loading` : État de chargement sauvegarde
- `showFoodSearch` : Affichage modal recherche aliments

**Callbacks mémorisés** :
- `handleAddFood` : Ajoute un aliment vide à la liste
- `handleFoodSelected` : Ajoute un aliment depuis la recherche
- `handleVoiceFoodsSelected` : Ajoute aliments depuis saisie vocale
- `handlePhotoFoodsSelected` : Ajoute aliments depuis reconnaissance photo
- `handleRemoveFood` : Supprime un aliment
- `handleUpdateFood` : Met à jour un champ d'un aliment
- `calculateFoodTotals` : Calcule totaux d'un aliment (ratio quantité/100)
- `handleSave` : Valide et sauvegarde le repas

**Calculs mémorisés** :
- `totals` : Totaux du repas (calories, protein, carbs, fat) calculés depuis tous les aliments (useMemo)

**Validation** :
- Au moins un aliment requis
- Tous les aliments doivent avoir un nom

---

#### 1.6. **HydrationTracker.jsx** (370 lignes)
**Rôle** : Suivi de l'hydratation quotidienne

**Fonctionnalités principales** :
- ✅ Affichage consommation actuelle vs objectif
- ✅ Barre de progression avec couleurs adaptatives
- ✅ Ajout rapide d'eau (boutons prédéfinis : 250ml, 500ml, 750ml, 1L)
- ✅ Saisie manuelle personnalisée
- ✅ Modification objectif quotidien (édition inline)
- ✅ Historique des entrées du jour
- ✅ Calcul automatique restant

**Optimisations appliquées** :
- ✅ **OPT 48** : Remplacement `alert()` par toasts `showError` pour validation (lignes 20, 34, 122, 151)
- ✅ **OPT 48** : Logger standardisé `log.error` au lieu de `console.error` (lignes 21, 23, 80, 110, 141)
- ✅ Callbacks mémorisés avec `useCallback` (lignes 57-159)

**Imports** :
- `React`, `useState`, `useEffect`, `useCallback`
- `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `Button`, `Input`
- `Droplet`, `Plus`, `Minus`, `Edit2`, `Check`, `X`, `Clock` (lucide-react)
- `useToast` (pour toasts)
- `logger` (pour logging standardisé)

**Props** :
- `date` : Date au format YYYY-MM-DD
- `nutritionData` : Hook `useNutritionData`
- `onUpdate` : Callback appelé après mise à jour

**States** :
- `hydrationLog` : Données d'hydratation du jour (waterIntake, targetWater, entries)
- `loading` : État de chargement
- `editingTarget` : Mode édition objectif
- `customAmount` : Montant personnalisé (pour ajout ou objectif)
- `showCustomInput` : Affichage input personnalisé

**Quantités prédéfinies** :
- 250ml 🥤
- 500ml 💧
- 750ml 🍶
- 1L 🚰

**Validation** :
- Objectif : 1ml - 10000ml
- Quantité personnalisée : 1ml - 5000ml

---

### 📦 Fichiers complémentaires (utilisés par le sous-onglet Journal)

#### 1.7. **FoodSearch.jsx** (utilisé par MealEntryForm)
**Localisation** : `src/components/tabs/nutrition/components/FoodSearch.jsx`  
**Rôle** : Recherche d'aliments dans base de données USDA/OpenFoodFacts  
**Utilisé par** : `MealEntryForm` (modal imbriquée)

#### 1.8. **VoiceInput.jsx** (utilisé par MealEntryForm)
**Localisation** : `src/components/tabs/nutrition/components/VoiceInput.jsx`  
**Rôle** : Saisie vocale d'aliments avec reconnaissance  
**Utilisé par** : `MealEntryForm` (bouton intégré)

#### 1.9. **FoodPhotoScanner.jsx** (utilisé par MealEntryForm)
**Localisation** : `src/components/tabs/nutrition/components/FoodPhotoScanner.jsx`  
**Rôle** : Reconnaissance d'aliments depuis photo  
**Utilisé par** : `MealEntryForm` (bouton intégré)

#### 1.10. **BarcodeScanner.jsx** (utilisé par MealEntryForm via FoodSearch)
**Localisation** : `src/components/tabs/nutrition/components/BarcodeScanner.jsx`  
**Rôle** : Scan code-barres pour recherche aliments  
**Utilisé par** : Indirectement via `FoodSearch`

---

### 🎯 Résumé du sous-onglet Journal

**Fichiers principaux** : 6
1. ✅ NutritionJournal.jsx (297 lignes)
2. ✅ DailyTotalsCard.jsx (242 lignes)
3. ✅ ComplianceDisplay.jsx (46 lignes) ⭐ NOUVEAU
4. ✅ MealList.jsx (209 lignes)
5. ✅ MealEntryForm.jsx (557 lignes)
6. ✅ HydrationTracker.jsx (370 lignes)

**Fichiers complémentaires** : 4
7. FoodSearch.jsx
8. VoiceInput.jsx
9. FoodPhotoScanner.jsx
10. BarcodeScanner.jsx

**Total fichiers** : **10 fichiers**

**Lignes de code** : ~1721 lignes (fichiers principaux)

**Optimisations appliquées** :
- ✅ OPT 16 : DateHelper pour dates
- ✅ OPT 17-18 : useCallback pour callbacks
- ✅ OPT 19 : Modal personnalisée
- ✅ OPT 20 : Composants réutilisables
- ✅ OPT 21-22 : useMemo pour calculs
- ✅ OPT 23 : useCallback pour formatTime
- ✅ OPT 24 : Vérification timestamp ISO
- ✅ OPT 25-26 : Mémorisation totaux
- ✅ OPT 47 : Toasts au lieu d'alert
- ✅ OPT 48 : Toasts pour hydratation

---

---

## 2️⃣ SOUS-ONGLET : PROGRAMMES 📋

**Composant principal** : `NutritionPrograms.jsx`  
**Localisation** : `src/components/tabs/nutrition/components/NutritionPrograms.jsx`

### 📁 Fichiers du sous-onglet Programmes

#### 2.1. **NutritionPrograms.jsx** (488 lignes)
**Rôle** : Composant principal pour la gestion des programmes nutritionnels

**Fonctionnalités principales** :
- ✅ Liste de tous les programmes (actifs, archivés)
- ✅ Affichage du programme actif (mise en avant avec badge)
- ✅ Création de nouveaux programmes (ouvre `NutritionProgramForm`)
- ✅ Modification de programmes existants (ouvre `NutritionProgramForm` en mode édition)
- ✅ Suppression de programmes (modal de confirmation personnalisée)
- ✅ Activation/Désactivation de programmes (un seul actif à la fois)
- ✅ Affichage détails programme (nom, description, objectif, calories, macros, dates)
- ✅ Calcul durée programme (jours, semaines, mois)
- ✅ Formatage objectif (bulk, cut, maintain, recomp)

**Optimisations appliquées** :
- ✅ **OPT 39-40** : Logger standardisé + modal personnalisée pour confirmation suppression
  - Remplacement `console.error` par `log.error` (lignes 23, 56, 72, 84, 96, 116)
  - Remplacement `window.confirm` par modal personnalisée (lignes 33-35, 100-127, 442-482)
  - Import `logger` et initialisation `log = logger.component('NutritionPrograms')` (lignes 23, 25)
  - Callbacks mémorisés avec `useCallback` (lignes 101-127)

**Imports** :
- `React`, `useState`, `useEffect`, `useCallback`
- `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `Button`, `Input`, `Modal`
- `Target`, `Plus`, `Edit2`, `Trash2`, `Play`, `Pause`, `CheckCircle`, `Calendar`, `TrendingUp`, `Archive`, `AlertTriangle` (lucide-react)
- `Badge`
- `NutritionProgramForm` (composant formulaire)
- `logger` (pour logging standardisé)

**Props** :
- `nutritionData` : Hook `useNutritionData`

**States** :
- `programs` : Liste de tous les programmes (array)
- `activeProgram` : Programme actif (null si aucun)
- `showForm` : Affichage formulaire création/modification
- `editingProgram` : Programme en cours d'édition (null si création)
- `loading` : État de chargement
- `showDeleteConfirm` : Affichage modal confirmation suppression
- `programToDelete` : ID du programme à supprimer

**Callbacks** :
- `loadPrograms` : Charge tous les programmes et programme actif
- `handleSaveProgram` : Sauvegarde un programme (création ou modification)
- `handleActivateProgram` : Active un programme (désactive l'ancien si nécessaire)
- `handleDeactivateProgram` : Désactive le programme actif
- `handleDeleteProgramClick` : Ouvre modal de confirmation suppression (useCallback)
- `handleDeleteProgramConfirm` : Confirme et exécute la suppression (useCallback)
- `handleDeleteProgramCancel` : Annule la suppression (useCallback)
- `handleCreateProgram` : Ouvre formulaire création
- `handleEditProgram` : Ouvre formulaire modification

**Fonctions utilitaires** :
- `formatGoal` : Formate objectif (bulk, cut, maintain, recomp) avec icône, label, couleur
- `calculateDuration` : Calcule durée programme en jours/semaines/mois

**Objectifs disponibles** :
- `bulk` : Prise de masse 📈 (orange)
- `cut` : Sèche 📉 (bleu)
- `maintain` : Maintien ⚖️ (vert)
- `recomp` : Recomposition 🔄 (violet)

**Affichage conditionnel** :
- Programme actif : Card spéciale avec gradient bleu/violet, badge "Actif", bouton désactiver
- Programme archivé : Opacité réduite, badge "Archivé"
- Bouton activer : Uniquement si programme non actif et non archivé

---

#### 2.2. **NutritionProgramForm.jsx** (535 lignes)
**Rôle** : Formulaire modal pour créer ou modifier un programme nutritionnel

**Fonctionnalités principales** :
- ✅ Informations de base (nom, description, objectif)
- ✅ Objectifs nutritionnels (calories, protéines, glucides, lipides)
- ✅ Calcul automatique pourcentages de distribution des macros
- ✅ Aperçu visuel distribution macros (barres de progression)
- ✅ Ajustement pour jours workout/repos (optionnel)
- ✅ Durée et dates (début, fin optionnelle)
- ✅ Validation formulaire avant sauvegarde
- ✅ Mode création et mode édition

**Optimisations appliquées** :
- ✅ **OPT 41** : Utilisation `DateHelper.getTodayLocal()` pour dates (cohérence timezone locale)
  - Initialisation `startDate` avec `DateHelper.getTodayLocal()` (lignes 38, 69, 87)
  - Remplacement `new Date().toISOString().split('T')[0]` par `DateHelper.getTodayLocal()`
- ✅ **OPT 42** : Logger standardisé pour erreurs sauvegarde
  - Import `logger` et initialisation `log = logger.component('NutritionProgramForm')` (lignes 20, 22)
  - Remplacement `console.error` par `log.error` (ligne 197)
- ✅ **OPT 43** : Mémorisation calcul pourcentages avec `useMemo` (évite recalcul à chaque rendu)
  - Calcul pourcentages prot/carbs/fat mémorisé (lignes 146-161)
  - Dépendances : `formData.targetProtein`, `formData.targetCarbs`, `formData.targetFat`

**Imports** :
- `React`, `useState`, `useEffect`, `useMemo`
- `Modal`, `Button`, `Input`
- `Save`, `Target` (lucide-react)
- `DateHelper` (utils/dateHelper)
- `logger` (pour logging standardisé)

**Props** :
- `isOpen` : Affichage modal (boolean)
- `onClose` : Callback fermeture modal
- `program` : Programme à modifier (null si création)
- `onSave` : Callback sauvegarde (avec données programme)
- `nutritionData` : Hook `useNutritionData` (pour `generateProgramId`)

**States** :
- `formData` : Données formulaire (nom, description, goal, targets, dates, etc.)
- `loading` : État de chargement sauvegarde
- `errors` : Erreurs de validation (object)

**Données formulaire (`formData`)** :
- `name` : Nom du programme (string, obligatoire)
- `description` : Description (string, optionnel)
- `goal` : Objectif (bulk, cut, maintain, recomp)
- `targetCalories` : Calories cibles/jour (number, 1000-10000)
- `targetProtein` : Protéines cibles/jour en g (number, 0-500)
- `targetCarbs` : Glucides cibles/jour en g (number, 0-1000)
- `targetFat` : Lipides cibles/jour en g (number, 0-500)
- `adjustForWorkout` : Ajuster calories selon workout/repos (boolean)
- `workoutDayCalories` : Calories jour workout (number, si `adjustForWorkout`)
- `restDayCalories` : Calories jour repos (number, si `adjustForWorkout`)
- `duration` : Durée en jours (number, 1-365)
- `startDate` : Date de début (string YYYY-MM-DD, défaut: aujourd'hui)
- `endDate` : Date de fin (string YYYY-MM-DD ou null)

**Objectifs disponibles** :
- `bulk` : Prise de masse 📈 (Surplus calorique pour gagner du muscle)
- `cut` : Sèche 📉 (Déficit calorique pour perdre du gras)
- `maintain` : Maintien ⚖️ (Maintenir poids actuel)
- `recomp` : Recomposition 🔄 (Perdre gras + gagner muscle simultanément)

**Calculs mémorisés** :
- `percentages` : Pourcentages de distribution macros (useMemo)
  - Calcul : `proteinCal = protein * 4`, `carbsCal = carbs * 4`, `fatCal = fat * 9`
  - Total macro calories = `proteinCal + carbsCal + fatCal`
  - Pourcentage = `(macroCal / totalMacroCal) * 100`

**Validation** :
- `name` : Obligatoire, non vide
- `targetCalories` : Entre 1000 et 10000 kcal
- `targetProtein` : Entre 0 et 500 g
- `targetCarbs` : Entre 0 et 1000 g
- `targetFat` : Entre 0 et 500 g
- `workoutDayCalories` : Entre 1000 et 10000 kcal (si `adjustForWorkout`)
- `restDayCalories` : Entre 1000 et 10000 kcal (si `adjustForWorkout`)

**Aperçu visuel** :
- Barres de progression pour distribution macros (prot/carbs/fat)
- Couleurs : bleu (protéines), vert (glucides), orange (lipides)

**Données sauvegardées** :
- Calcul automatique `targetProteinPercent`, `targetCarbsPercent`, `targetFatPercent`
- Arrondi valeurs (calories: entier, macros: 1 décimale)
- `workoutDayCalories` et `restDayCalories` : `null` si `adjustForWorkout === false`

---

### 🎯 Résumé du sous-onglet Programmes

**Fichiers principaux** : 2
1. ✅ NutritionPrograms.jsx (488 lignes)
2. ✅ NutritionProgramForm.jsx (535 lignes)

**Total fichiers** : **2 fichiers**

**Lignes de code** : ~1023 lignes

**Optimisations appliquées** :
- ✅ OPT 39-40 : Logger standardisé + modal personnalisée
- ✅ OPT 41 : DateHelper pour dates
- ✅ OPT 42 : Logger standardisé
- ✅ OPT 43 : useMemo pour calculs pourcentages

**Fonctionnalités clés** :
- Gestion complète CRUD programmes
- Activation/désactivation (un seul actif)
- Validation formulaire robuste
- Calcul automatique pourcentages macros
- Ajustement workout/repos optionnel
- Aperçu visuel distribution macros

---

---

## 3️⃣ SOUS-ONGLET : ANALYSES 📊

**Composant principal** : `NutritionAnalyses.jsx`  
**Localisation** : `src/components/tabs/nutrition/components/NutritionAnalyses.jsx`

### 📁 Fichiers du sous-onglet Analyses

#### 3.1. **NutritionAnalyses.jsx** (751 lignes)
**Rôle** : Composant principal pour les analyses approfondies de la nutrition

**Fonctionnalités principales** :
- ✅ Sélection période d'analyse (7 jours, 30 jours, 90 jours, 1 an)
- ✅ Chargement et traitement données nutrition et Garmin
- ✅ Statistiques globales (calories moyennes, conformité moyenne, protéines moyennes, eau moyenne)
- ✅ Graphique conformité au programme (barres calories + ligne conformité)
- ✅ Graphique bilan calorique avec Garmin (consommé vs dépensé)
- ✅ Graphique évolution macros (aire empilée)
- ✅ Tendances (évolution calories première vs dernière moitié période)
- ✅ Intégration 5 sous-composants d'analyse :
  - `NutritionRecommendations` : Recommandations personnalisées
  - `NutritionCorrelations` : Corrélations nutritionnelles
  - `NutritionChronobiology` : Analyse chronobiologique (timing)
  - `NutritionHealthScore` : Score santé globale
  - `NutritionPredictions` : Prédictions offline (ML)

**Optimisations appliquées** :
- ✅ **OPT 15** : Préférer prop `garminData` si fournie (évite duplication initialisation)
  - Hook toujours appelé pour respecter Règles des Hooks, mais prop utilisée en priorité (lignes 65-68)
- ✅ **OPT 27-28** : Utilisation `DateHelper` pour cohérence timezone locale
  - `DateHelper.getDaysAgoLocal()` et `DateHelper.getTodayLocal()` pour dates (lignes 242-243)
  - `DateHelper.toYYYYMMDD()` et `DateHelper.fromYYYYMMDD()` pour conversions (lignes 148, 143)
- ✅ **OPT 29-30** : Mémorisation `processDataForAnalysis` et `loadAnalysisData` avec `useCallback`
  - `processDataForAnalysis` défini AVANT `loadAnalysisData` car utilisée par cette dernière (lignes 97-233)
  - `loadAnalysisData` mémorisé avec toutes dépendances nécessaires (ligne 236-280)
- ✅ **OPT 31** : Mémorisation filtres `dailyData` avec `useMemo`
  - `filteredDailyData` et `filteredDailyDataWithGarmin` mémorisés (lignes 309-310)
  - IMPORTANT : Hooks appelés AVANT early returns pour respecter Règles des Hooks (lignes 308-310)
- ✅ **OPT 32-33** : Logger standardisé pour warnings et erreurs
  - Import `logger` et initialisation `log = logger.component('NutritionAnalyses')` (lignes 51, 58)
  - Remplacement `console.warn` par `log.warn` (ligne 266)
  - Remplacement `console.error` par `log.error` (ligne 276)
- ✅ Optimisation rendu graphiques : Double `requestAnimationFrame` pour garantir layout calculé (lignes 71-85)
- ✅ Gestion erreurs Garmin : Try/catch avec fallback gracieux (lignes 253-268)

**Imports** :
- `React`, `useState`, `useEffect`, `useMemo`, `useCallback`
- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Button`
- `DateHelper` (utils/dateHelper)
- `TrendingUp`, `TrendingDown`, `Target`, `Calendar`, `BarChart3`, `Activity`, `Flame`, `Droplet`, `AlertCircle`, `CheckCircle`, `Info` (lucide-react)
- Recharts : `LineChart`, `Line`, `BarChart`, `Bar`, `AreaChart`, `Area`, `ComposedChart`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`, `ResponsiveContainer`, `ReferenceLine`
- `useNutritionData`, `useGarminData` (hooks)
- `calculateDailyTotals`, `calculateProgramCompliance`, `getNutritionStats` (nutritionCalculations)
- `logger` (pour logging standardisé)
- `NutritionRecommendations`, `NutritionCorrelations`, `NutritionChronobiology`, `NutritionHealthScore`, `NutritionPredictions` (sous-composants)

**Props** :
- `nutritionData` : Hook `useNutritionData`
- `garminData` : Hook `useGarminData` (optionnel, priorité sur hook interne)

**States** :
- `selectedPeriod` : Période sélectionnée (7days, 30days, 90days, 1year)
- `loading` : État de chargement
- `analysisData` : Données analysées (stats, trend, program, dailyData, hasGarminData)
- `chartsReady` : État pour différer rendu graphiques (double RAF)

**Périodes disponibles** :
- `7days` : 7 jours
- `30days` : 30 jours (défaut)
- `90days` : 90 jours
- `1year` : 1 an (365 jours)

**Callbacks mémorisés** :
- `processDataForAnalysis` : Traite données quotidiennes pour analyse (useCallback, lignes 97-233)
- `loadAnalysisData` : Charge et traite toutes données d'analyse (useCallback, lignes 236-280)

**Calculs mémorisés** :
- `filteredDailyData` : Jours avec données (useMemo, ligne 309)
- `filteredDailyDataWithGarmin` : Jours avec données + Garmin (useMemo, ligne 310)

**Graphiques affichés** :
1. **Conformité Programme** : ComposedChart (barres calories + ligne conformité + ligne cible)
2. **Bilan Calorique** : ComposedChart (barres consommé/dépensé + ligne bilan) - Uniquement si Garmin disponible
3. **Évolution Macros** : AreaChart (aires empilées protéines/glucides/lipides)

**Sous-composants intégrés** :
- `NutritionRecommendations` : Recommandations personnalisées
- `NutritionCorrelations` : Corrélations nutritionnelles
- `NutritionChronobiology` : Chronobiologie (timing optimal)
- `NutritionHealthScore` : Score santé globale
- `NutritionPredictions` : Prédictions ML

---

#### 3.2. **NutritionRecommendations.jsx** (244 lignes)
**Rôle** : Affiche les recommandations nutritionnelles générées par le système expert

**Fonctionnalités principales** :
- ✅ Affichage recommandations triées par priorité (high, medium, low)
- ✅ Résumé global personnalisé
- ✅ Statistiques rapides (nombre recommandations par priorité)
- ✅ Badges de catégorie (protein, calories, hydration, timing, macros, variety, consistency)
- ✅ Icônes personnalisées par catégorie
- ✅ Actions de rafraîchissement
- ✅ Affichage métadonnées qualité données

**Hook utilisé** :
- `useNutritionRecommendations` avec `autoRefresh: true`

**Imports** :
- `React`
- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Button`
- `Lightbulb`, `AlertTriangle`, `Info`, `CheckCircle`, `RefreshCw`, `TrendingUp`, `Droplet`, `Clock`, `Apple`, `Target` (lucide-react)
- `useNutritionRecommendations` (hook)

**Fonctions utilitaires** :
- `getCategoryIcon` : Retourne icône selon catégorie
- `getPriorityColor` : Retourne couleur selon priorité
- `getPriorityBadge` : Retourne badge selon priorité
- `getCategoryLabel` : Retourne label français selon catégorie

**Catégories disponibles** :
- `protein` : Protéines 🎯
- `calories` : Calories 📈
- `hydration` : Hydratation 💧
- `timing` : Timing 🕐
- `macros` : Macros 🍎
- `variety` : Variété 🍎
- `consistency` : Régularité ✅

**Priorités** :
- `high` : Critique (rouge)
- `medium` : Important (jaune)
- `low` : Optimisation (bleu)

---

#### 3.3. **NutritionCorrelations.jsx** (355 lignes)
**Rôle** : Affiche les corrélations nutritionnelles calculées

**Fonctionnalités principales** :
- ✅ Affichage coefficient de corrélation (r) avec formatage
- ✅ p-value et significativité statistique
- ✅ Force de la corrélation (strong, moderate, weak, negligible, non_significant)
- ✅ Direction (positive, negative) avec icône
- ✅ Insights et recommandations par corrélation
- ✅ Warnings pour petits échantillons
- ✅ Statistiques globales (nombre corrélations, actionnables, jours analysés)
- ✅ Filtre corrélations significatives

**Hook utilisé** :
- `useNutritionCorrelations` avec `minDays: 10, maxDays: 90`

**Imports** :
- `React`
- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Button`
- `TrendingUp`, `TrendingDown`, `AlertTriangle`, `Info`, `CheckCircle`, `RefreshCw`, `BarChart3`, `XCircle` (lucide-react)
- `useNutritionCorrelations` (hook)

**Fonctions utilitaires** :
- `getStrengthColor` : Retourne couleur selon force corrélation
- `getStrengthBadge` : Retourne badge selon force
- `getDirectionIcon` : Retourne icône direction (TrendingUp/Down)
- `formatCorrelation` : Formate coefficient (3 décimales)
- `formatPValue` : Formate p-value (4 décimales ou < 0.001)

**Forces de corrélation** :
- `strong` : Forte (vert)
- `moderate` : Modérée (jaune)
- `weak` : Faible (bleu)
- `negligible` : Négligeable (gris)
- `non_significant` : Non significative (rouge)

**Conditions d'affichage** :
- Minimum 10 jours de données nécessaires
- Warning si échantillon insuffisant
- Recommandation connecter Garmin si pas de données Garmin

---

#### 3.4. **NutritionChronobiology.jsx** (240 lignes)
**Rôle** : Analyse du timing optimal des repas par rapport aux entraînements

**Fonctionnalités principales** :
- ✅ Sélection période d'analyse (7, 30, 90 jours, tout l'historique)
- ✅ Résumé données (repas analysés, entraînements, points pré/post-workout)
- ✅ Timing pré-workout optimal (heures avant entraînement)
- ✅ Timing post-workout optimal (heures après entraînement)
- ✅ Distribution protéines par type repas (petit-déjeuner, déjeuner, dîner)
- ✅ Recommandations basées sur analyse
- ✅ Warnings si données insuffisantes

**Hook utilisé** :
- `useNutritionChronobiology` avec période dynamique

**Imports** :
- `React`, `useState`
- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Button`
- `Clock`, `TrendingUp`, `Activity`, `Droplet`, `RefreshCw`, `AlertCircle`, `CheckCircle`, `Info` (lucide-react)
- `useNutritionChronobiology` (hook)

**States** :
- `period` : Période sélectionnée (7days, 30days, 90days, all)

**Données analysées** :
- `preWorkout` : Timing optimal avant entraînement (optimalHours, avgPerformance, recommendation)
- `postWorkout` : Timing optimal après entraînement (optimalHours, avgRecovery, recommendation)
- `proteinDistribution` : Distribution protéines par type repas (breakfast, lunch, dinner, total, recommendation)
- `summary` : Résumé global (totalMeals, totalWorkouts, hasEnoughData)

**Périodes disponibles** :
- `7days` : 7 derniers jours
- `30days` : 30 derniers jours
- `90days` : 90 derniers jours
- `all` : Tout l'historique

---

#### 3.5. **NutritionHealthScore.jsx** (350 lignes)
**Rôle** : Affiche le score santé global composite avec sous-scores

**Fonctionnalités principales** :
- ✅ Score global principal (0-100) avec jauge circulaire SVG
- ✅ Sous-scores détaillés (nutrition, workout, recovery, consistency, balance)
- ✅ Tendances (semaine, mois) avec icônes direction
- ✅ Recommandations prioritaires (high, medium)
- ✅ Barres de progression pour chaque sous-score
- ✅ Couleurs adaptatives selon score (vert ≥80, jaune ≥60, orange ≥40, rouge <40)
- ✅ Labels automatiques (Excellent, Bon, Moyen, À améliorer)

**Hook utilisé** :
- `useNutritionHealthScore` avec `autoRefresh: true`, `refreshInterval: 5 min`

**Imports** :
- `React`
- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Button`
- `Activity`, `TrendingUp`, `TrendingDown`, `Minus`, `RefreshCw`, `AlertCircle`, `CheckCircle`, `Info`, `Apple`, `Dumbbell`, `Moon`, `Flame`, `Target` (lucide-react)
- `useNutritionHealthScore` (hook)

**Sous-scores** :
- `nutrition` : Nutrition 🍎 (rose)
- `workout` : Entraînement 💪 (bleu)
- `recovery` : Récupération 🌙 (violet)
- `consistency` : Consistance 🔥 (orange)
- `balance` : Équilibre 🎯 (vert)

**Seuils de score** :
- ≥ 80 : Excellent (vert)
- ≥ 60 : Bon (jaune)
- ≥ 40 : Moyen (orange)
- < 40 : À améliorer (rouge)

**Tendances** :
- `direction` : up, down, stable
- `lastWeek` : Variation cette semaine
- `lastMonth` : Variation ce mois

**Recommandations** :
- Priorité `high` : Rouge (critique)
- Priorité `medium` : Jaune (important)

---

#### 3.6. **NutritionPredictions.jsx** (548 lignes)
**Rôle** : Prédictions de poids offline avec TensorFlow.js (Machine Learning)

**Fonctionnalités principales** :
- ✅ Détection support TensorFlow.js
- ✅ Entraînement modèle (non-bloquant UI)
- ✅ Prédictions multiples horizons (7, 14, 30 jours)
- ✅ Graphique historique + courbe prédite
- ✅ Statistiques : poids actuel, prédit, différence, tendance
- ✅ Progression entraînement en temps réel
- ✅ Fallback gracieux si TensorFlow.js non supporté
- ✅ Validation données suffisantes (minimum 30 jours)

**Optimisations appliquées** :
- ✅ **OPT 34-35** : Utilisation `DateHelper` pour cohérence timezone locale
  - `DateHelper.toYYYYMMDD()` pour conversions dates (ligne 136)
  - `DateHelper.getTodayLocal()` et `DateHelper.addDays()` pour dates prédictions (ligne 164)
- ✅ **OPT 36** : Utilisation `DateHelper.getMidnightTimestamp()` pour tri cohérent (lignes 139, 143, 186, 191)
- ✅ Optimisation rendu graphiques : Double `requestAnimationFrame` (lignes 115-126)
- ✅ Logger standardisé : `log = logger.component('NutritionPredictions')` (lignes 56, 58)

**Imports** :
- `React`, `useState`, `useEffect`, `useMemo`, `useCallback`
- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Button`
- `Brain`, `TrendingUp`, `TrendingDown`, `Target`, `Calendar`, `AlertCircle`, `CheckCircle`, `Loader2`, `RefreshCw`, `Zap`, `Info` (lucide-react)
- Recharts : `LineChart`, `Line`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`, `ResponsiveContainer`, `ReferenceLine`, `Dot`
- `useNutritionPredictions` (hook)
- `useWorkout` (context pour données poids)
- `DateHelper` (utils/dateHelper)
- `logger` (pour logging standardisé)

**Hook utilisé** :
- `useNutritionPredictions` : Gère logique prédictions ML

**States** :
- `chartsReady` : État pour différer rendu graphiques
- `selectedDays` : Horizon prédiction (7, 14, 30 jours)
- `historicalData` : Historique poids pour graphique

**Horizons prédiction** :
- 7 jours
- 14 jours
- 30 jours (défaut)

**Statistiques calculées** :
- `currentWeight` : Poids actuel (kg)
- `predictedWeight` : Poids prédit (kg)
- `difference` : Différence absolue (kg)
- `differencePercent` : Différence en pourcentage (%)
- `trend` : up, down, stable
- `daysAhead` : Horizon prédiction
- `date` : Date prédiction

**Conditions** :
- Minimum 30 jours de données nécessaires pour entraînement
- TensorFlow.js requis (fallback si non supporté)
- Modèle chargé requis pour prédictions

**Graphique affiché** :
- **LineChart** : Ligne historique (bleue) + ligne prédite (rouge pointillée)

---

### 🎯 Résumé du sous-onglet Analyses

**Fichiers principaux** : 6
1. ✅ NutritionAnalyses.jsx (751 lignes) - Composant principal
2. ✅ NutritionRecommendations.jsx (244 lignes) - Recommandations
3. ✅ NutritionCorrelations.jsx (355 lignes) - Corrélations
4. ✅ NutritionChronobiology.jsx (240 lignes) - Chronobiologie
5. ✅ NutritionHealthScore.jsx (350 lignes) - Score santé
6. ✅ NutritionPredictions.jsx (548 lignes) - Prédictions ML

**Total fichiers** : **6 fichiers**

**Lignes de code** : ~2488 lignes

**Optimisations appliquées** :
- ✅ OPT 15 : Priorité prop garminData
- ✅ OPT 27-28 : DateHelper pour dates
- ✅ OPT 29-30 : useCallback pour callbacks
- ✅ OPT 31 : useMemo pour filtres
- ✅ OPT 32-33 : Logger standardisé
- ✅ OPT 34-35 : DateHelper pour prédictions
- ✅ OPT 36 : DateHelper.getMidnightTimestamp pour tri

**Fonctionnalités clés** :
- Analyse approfondie multi-dimensionnelle
- Graphiques interactifs (Recharts)
- Intégration Garmin (bilan calorique)
- Système expert (recommandations)
- Corrélations statistiques
- Analyse chronobiologique
- Score santé composite
- Prédictions ML (TensorFlow.js)

---

---

## 4️⃣ SOUS-ONGLET : GAMIFICATION 🎮

**Composant principal** : `NutritionGamification.jsx`  
**Localisation** : `src/components/tabs/nutrition/components/NutritionGamification.jsx`

### 📁 Fichiers du sous-onglet Gamification

#### 4.1. **NutritionGamification.jsx** (409 lignes)
**Rôle** : Composant principal pour le système de gamification nutritionnelle

**Fonctionnalités principales** :
- ✅ Affichage badges débloqués et en progression
- ✅ Système XP & Niveau avec barre de progression
- ✅ Streaks (séries) avec système de forgiveness (pardon)
- ✅ Notifications nouveaux badges débloqués
- ✅ Onglets navigation (Vue d'ensemble, Badges, Progression)
- ✅ Statistiques rapides (XP total, streak réelle)
- ✅ Détails progression niveau
- ✅ Détails streak avec mode maintenance (≥30 jours)
- ✅ Tri et affichage badges par rareté et catégorie

**Hook utilisé** :
- `useNutritionGamification` avec `enabled: true`, `autoCheck: true`

**Imports** :
- `React`, `useState`, `useEffect`
- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Button`
- `Trophy`, `Award`, `TrendingUp`, `Flame`, `Star`, `Target`, `Zap`, `Info`, `XCircle`, `CheckCircle` (lucide-react)
- `useNutritionGamification` (hook)

**Props** :
- Aucune prop (composant autonome)

**States** :
- `activeTab` : Onglet actif ('overview' | 'badges' | 'progress')

**Données du hook** :
- `achievements` : Liste des badges débloqués (array)
- `experience` : Données XP (object)
- `streaks` : Données streaks (object avec `nutrition` streak)
- `loading` : État de chargement (boolean)
- `error` : Erreur éventuelle (object ou null)
- `enabled` : Gamification activée (boolean)
- `newBadges` : Nouveaux badges débloqués (array)
- `getLevelProgress` : Fonction calcul progression niveau (function)
- `checkBadges` : Fonction vérification badges (function)

**Onglets disponibles** :
1. **Vue d'ensemble** (`overview`)
   - Badges récents (4 derniers débloqués)
   - Statistiques rapides (XP Total, Streak Réelle)

2. **Badges** (`badges`)
   - Liste complète badges débloqués
   - Tri par date de déblocage (plus récents en premier)
   - Affichage détails : icône, nom, description, rareté, points XP, date déblocage

3. **Progression** (`progress`)
   - Progression niveau détaillée (barre progression avec gradient)
   - Streak détaillée (affichée, réelle, jours pardonnés, mode maintenance)

**Fonctions utilitaires** :
- `getRarityColor` : Retourne classes CSS selon rareté badge
  - `common` : Gris (slate-500)
  - `rare` : Bleu (blue-500)
  - `epic` : Violet (purple-500)
  - `legendary` : Jaune (yellow-500)
- `getCategoryIcon` : Retourne icône selon catégorie badge
  - `consistency` : Flame (orange) - Régularité
  - `nutrition` : Target (vert) - Nutrition
  - `progression` : TrendingUp (bleu) - Progression
  - `performance` : Zap (jaune) - Performance

**Raretés de badges** :
- `common` : Commun (gris)
- `rare` : Rare (bleu)
- `epic` : Épique (violet)
- `legendary` : Légendaire (jaune)

**Catégories de badges** :
- `consistency` : Régularité 🔥
- `nutrition` : Nutrition 🎯
- `progression` : Progression 📈
- `performance` : Performance ⚡

**Système de streaks** :
- **Streak affichée** (`current`) : Streak avec forgiveness appliquée
- **Streak réelle** (`actual`) : Streak réelle sans forgiveness
- **Forgiveness** (`forgivenessUsed`) : Nombre de jours pardonnés (max 2)
- **Mode maintenance** (`status === 'maintenance'`) : Activé si streak ≥ 30 jours

**Données niveau (levelProgress)** :
- `level` : Niveau actuel (number)
- `currentXP` : XP actuel (number)
- `xpForNextLevel` : XP nécessaire pour niveau suivant (number)
- `xpNeeded` : XP manquant pour prochain niveau (number)
- `progressPercent` : Pourcentage progression (0-100)

**Affichage conditionnel** :
- **Gamification désactivée** : Message d'info si `enabled === false`
- **Chargement** : Spinner si `loading === true`
- **Erreur** : Message d'erreur avec bouton réessayer si `error !== null`
- **Notifications nouveaux badges** : Bannière verte en haut si `newBadges.length > 0`
- **Badges récents** : 4 derniers badges triés par date si `achievements.length > 0`
- **Aucun badge** : Message d'encouragement si `achievements.length === 0`

**Optimisations appliquées** :
- ✅ Hook externe `useNutritionGamification` pour logique séparée
- ✅ Auto-vérification badges activée (`autoCheck: true`)
- ✅ États conditionnels pour éviter affichage inutile
- ✅ Fonctions utilitaires pour code DRY

---

### 🎯 Résumé du sous-onglet Gamification

**Fichiers principaux** : 1
1. ✅ NutritionGamification.jsx (409 lignes)

**Total fichiers** : **1 fichier**

**Lignes de code** : ~409 lignes

**Optimisations appliquées** :
- ✅ Hook externe pour logique séparée
- ✅ Auto-vérification badges
- ✅ États conditionnels optimisés

**Fonctionnalités clés** :
- Système badges multi-raretsé
- Système XP & niveaux progressif
- Streaks avec forgiveness
- Mode maintenance (≥30 jours)
- Navigation par onglets
- Notifications nouveaux badges

---

---

## 5️⃣ SOUS-ONGLET : PROGRESSION 📸

**Composant principal** : `NutritionProgressPhotos.jsx`  
**Localisation** : `src/components/tabs/nutrition/components/NutritionProgressPhotos.jsx`

### 📁 Fichiers du sous-onglet Progression

#### 5.1. **NutritionProgressPhotos.jsx** (993 lignes)
**Rôle** : Composant principal pour les photos de progression nutritionnelle (avant/après)

**Fonctionnalités principales** :
- ✅ Galerie des séquences avant/après
- ✅ Slider interactif pour comparaison (style Instagram avec CSS clip-path)
- ✅ Formulaire d'ajout de photos (avant/après)
- ✅ Métadonnées (poids, mesures, notes, date)
- ✅ Gestion des séquences (création, suppression)
- ✅ Compression multi-résolution (thumbnail + full) optimisée
- ✅ Lazy loading images pour performance
- ✅ Calcul différence de poids entre avant/après
- ✅ Affichage thumbnail dans galerie
- ✅ Modal comparaison avec slider interactif
- ✅ Upload avec progression en temps réel

**Optimisations appliquées** :
- ✅ **OPT 44** : Utilisation `DateHelper.getTodayLocal()` pour dates (cohérence timezone locale)
  - Initialisation `date` avec `DateHelper.getTodayLocal()` (lignes 290, 338, 356)
  - Attribut `max` date input avec `DateHelper.getTodayLocal()` (ligne 553)
  - Remplacement `new Date().toISOString().split('T')[0]` par `DateHelper.getTodayLocal()`
- ✅ Optimisation slider avant/après : CSS `clip-path` pour performance maximale (ligne 80, 182)
  - Pas de manipulation DOM lourde
  - Animation fluide 60fps
  - Responsive et accessible
- ✅ Logger standardisé : `log = logger.module('NutritionProgressPhotos')` (lignes 52, 54)
- ✅ Toasts pour feedback utilisateur : `useToast` pour `showSuccess`, `showError`, `showWarning` (ligne 263)
- ✅ Gestion upload avec progression : Callback `onProgress` pour feedback visuel (lignes 340-344)
- ✅ Lazy loading images : Attribut `loading="lazy"` (lignes 190, 210, 901)
- ✅ Compression multi-résolution : Support thumbnail + full (format v3.0)

**Imports** :
- `React`, `useState`, `useEffect`, `useCallback`, `useRef`
- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Button`, `Input`
- `Camera`, `Plus`, `Trash2`, `Eye`, `EyeOff`, `ChevronLeft`, `ChevronRight`, `Download`, `Upload`, `Scale`, `Ruler`, `FileText`, `Calendar`, `TrendingUp`, `TrendingDown`, `ArrowLeft`, `ArrowRight`, `X`, `CheckCircle`, `AlertCircle`, `Loader2` (lucide-react)
- `useNutritionProgressPhotos` (hook)
- `PROGRESS_PHOTO_TYPES` (service constants)
- `useToast` (pour toasts)
- `DateHelper` (utils/dateHelper)
- `logger` (pour logging standardisé)

**Hook utilisé** :
- `useNutritionProgressPhotos` avec `autoLoad: true`

**Props** :
- Aucune prop (composant autonome)

**States** :
- `showAddForm` : Affichage formulaire ajout photo (boolean)
- `selectedSequence` : Séquence sélectionnée dans galerie (object ou null)
- `viewingSequence` : Séquence en vue comparaison (object ou null)
- `uploadProgress` : Progression upload (0-100)
- `uploading` : État upload en cours (boolean)
- `formData` : Données formulaire (type, date, weight, measurements, notes, sequenceId)

**Données du hook** :
- `photos` : Liste de toutes les photos (array)
- `sequences` : Liste des séquences avant/après (array)
- `loading` : État de chargement (boolean)
- `error` : Erreur éventuelle (string ou null)
- `dbReady` : Base de données prête (boolean)
- `addPhoto` : Fonction ajout photo (function)
- `deletePhoto` : Fonction suppression photo (function)
- `updatePhoto` : Fonction mise à jour photo (function)
- `deleteSequence` : Fonction suppression séquence (function)
- `loadPhotos` : Fonction chargement photos (function)
- `loadSequences` : Fonction chargement séquences (function)

**Types de photos** :
- `PROGRESS_PHOTO_TYPES.BEFORE` : Photo "Avant" (début programme)
- `PROGRESS_PHOTO_TYPES.AFTER` : Photo "Après" (résultat progression)

**Données formulaire (`formData`)** :
- `type` : Type photo (BEFORE ou AFTER)
- `date` : Date photo (YYYY-MM-DD, défaut: aujourd'hui)
- `weight` : Poids en kg (number, optionnel)
- `measurements` : Mesures en cm (object, optionnel)
  - `waist` : Taille (number)
  - `chest` : Poitrine (number)
  - `hips` : Hanches (number)
- `notes` : Notes personnelles (string, optionnel)
- `sequenceId` : ID séquence (généré si null)

**Composant interne** :
- `BeforeAfterSlider` : Slider interactif avant/après avec CSS clip-path (lignes 85-257)
  - Gestion drag souris et touch (mobile)
  - Position slider 0-100%
  - Overlays "AVANT" / "APRÈS" avec dates
  - Contrôle range pour desktop

**Fonctions utilitaires** :
- `formatDate` : Formate date complète en français (lignes 59-67)
- `formatDateShort` : Retourne date courte YYYY-MM-DD (lignes 72-75)
- `getImageUrl` : Obtient URL image (thumbnail ou full selon format) (lignes 138-155)
- `calculateWeightDifference` : Calcule différence poids avant/après (lignes 445-461)

**Callbacks mémorisés** :
- `handleFileSelect` : Gère sélection et upload fichier (useCallback, lignes 313-387)
- `handleDeletePhoto` : Gère suppression photo (useCallback, lignes 392-407)
- `handleDeleteSequence` : Gère suppression séquence complète (useCallback, lignes 412-433)
- `handleViewComparison` : Gère affichage modal comparaison (useCallback, lignes 438-440)
- `calculateWeightDifference` : Calcule différence poids (useCallback, lignes 445-461)

**Validations** :
- **Type fichier** : Uniquement images (JPEG, PNG, WebP)
- **Taille max** : 20 MB
- **Date** : Pas de date future (`max={DateHelper.getTodayLocal()}`)

**Système de compression** :
- **Multi-résolution** : Thumbnail (petite) + Full (grande)
- **Format v3.0** : Objet `{ full, thumbnail }`
- **Format v2.0** : String directe (rétrocompatibilité)

**Affichage conditionnel** :
- **DB non prête** : Spinner de chargement
- **Erreur** : Card rouge avec message erreur
- **Formulaire ajout** : Formulaire complet si `showAddForm === true`
- **Upload en cours** : Progression avec barre et pourcentage
- **Modal comparaison** : Slider avant/après si `viewingSequence !== null`
- **Galerie vide** : Message d'encouragement avec bouton ajouter
- **Galerie séquences** : Grid responsive avec thumbnails

**Gestion séquences** :
- **Création automatique** : Nouvelle séquence si `sequenceId === null`
- **Mise à jour** : Utilise `sequenceId` existant pour lier avant/après
- **Badge statut** : "Complète" (vert) si avant + après, "Avant/Après seulement" (jaune) sinon

**Performance** :
- ✅ Lazy loading images (`loading="lazy"`)
- ✅ CSS clip-path pour slider (pas de manipulation DOM)
- ✅ Thumbnails pour galerie (chargement rapide)
- ✅ Traitement async non-bloquant

---

### 🎯 Résumé du sous-onglet Progression

**Fichiers principaux** : 1
1. ✅ NutritionProgressPhotos.jsx (993 lignes)

**Total fichiers** : **1 fichier**

**Lignes de code** : ~993 lignes

**Optimisations appliquées** :
- ✅ OPT 44 : DateHelper pour dates
- ✅ CSS clip-path pour slider (performance)
- ✅ Logger standardisé
- ✅ Toasts pour feedback
- ✅ Compression multi-résolution
- ✅ Lazy loading images

**Fonctionnalités clés** :
- Galerie séquences avant/après
- Slider interactif avec CSS clip-path
- Upload avec progression
- Compression multi-résolution
- Métadonnées complètes (poids, mesures, notes)
- Calcul différence de poids
- Lazy loading pour performance

---

---

## 6️⃣ SOUS-ONGLET : PARTAGE 🤝

**Composants principaux** : `NutritionSharing.jsx`, `CoachDashboard.jsx`  
**Localisation** : `src/components/tabs/nutrition/components/`

### 📁 Fichiers du sous-onglet Partage

#### 6.1. **NutritionSharing.jsx** (668 lignes)
**Rôle** : Composant pour la gestion du partage nutritionnel avec un coach

**Fonctionnalités principales** :
- ✅ Liste liens de partage actifs avec statut (actif/expiré)
- ✅ Création nouveaux liens (scope, expiration, permissions)
- ✅ Génération QR codes pour partage facile (API qr-server.com)
- ✅ Export JSON avec données anonymisées selon scope
- ✅ Révocation liens expirés ou actifs
- ✅ Nettoyage automatique liens expirés (autoCleanup)
- ✅ Copie token/URL dans presse-papier
- ✅ Affichage expiration avec formatage relatif
- ✅ Gestion permissions (lecture seule pour l'instant)

**Optimisations appliquées** :
- ✅ **OPT 37-38** : Logger standardisé + toasts pour feedback utilisateur
  - `log = logger.component('NutritionSharing')` (lignes 40, 42)
  - `useToast` pour `showSuccess`, `showInfo`, `showError` (lignes 39, 141)
  - Remplacement `alert()` par toasts (lignes 210, 240, 251, 280-283, 290-298)
  - Remplacement `console.error` par `log.error` (lignes 210, 240, 251, 295)
- ✅ Optimisation handlers : Délai avec `setTimeout`/`requestIdleCallback` pour éviter blocage UI (lignes 194, 232-243)
- ✅ Auto-nettoyage : Hook `useNutritionSharing` avec `autoCleanup: true`, `cleanupInterval: 60 * 60 * 1000` (ligne 158)

**Imports** :
- `React`, `useState`, `useEffect`, `useCallback`
- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Button`, `Input`, `Badge`
- `Share2`, `Plus`, `Trash2`, `Copy`, `Download`, `QrCode`, `LinkIcon`, `Clock`, `Shield`, `Eye`, `CheckCircle`, `XCircle`, `Info`, `AlertCircle`, `ExternalLink` (lucide-react)
- `useNutritionSharing` (hook)
- `SHARE_SCOPES`, `PERMISSIONS` (service constants)
- `useToast` (pour toasts)
- `logger` (pour logging standardisé)

**Hook utilisé** :
- `useNutritionSharing` avec `autoCleanup: true`, `cleanupInterval: 60 * 60 * 1000`

**Props** :
- Aucune prop (composant autonome)

**States** :
- `showCreateForm` : Affichage formulaire création (boolean)
- `showQRCode` : Token pour lequel afficher QR code (string ou null)
- `copiedToken` : Token copié (string ou null)
- `copiedUrl` : URL copiée (string ou null)
- `creating` : Création en cours (boolean)
- `formData` : Données formulaire (expiresIn, scope, permissions)

**Données du hook** :
- `shareLinks` : Liste des liens de partage (array)
- `currentShareLink` : Lien de partage actuel (object ou null)
- `loading` : État de chargement (boolean)
- `error` : Erreur éventuelle (object ou null)
- `dbReady` : Base de données prête (boolean)
- `createShareLink` : Fonction création lien (function)
- `revokeShareLink` : Fonction révocation lien (function)
- `downloadShareExport` : Fonction export JSON (function)
- `copyTokenToClipboard` : Fonction copie token (function)
- `copyShareUrlToClipboard` : Fonction copie URL (function)
- `cleanup` : Fonction nettoyage liens expirés (function)
- `loadShareLinks` : Fonction chargement liens (function)
- `EXPIRATION_OPTIONS` : Options expiration (object)
- `SHARE_SCOPES` : Scopes disponibles (object)
- `PERMISSIONS` : Permissions disponibles (object)

**Scopes disponibles** :
- `SHARE_SCOPES.all` : Toutes les données
- `SHARE_SCOPES.stats` : Statistiques uniquement
- `SHARE_SCOPES.charts` : Graphiques uniquement
- `SHARE_SCOPES.progress` : Progression uniquement

**Permissions disponibles** :
- `PERMISSIONS.read` : Lecture seule (actuellement seule permission disponible)

**Options expiration (`EXPIRATION_OPTIONS`)** :
- Format : `{ key: milliseconds }` (ex: `{ '24h': 86400000 }`)

**Composant interne** :
- `QRCodeDisplay` : Affichage QR code via API qr-server.com (lignes 50-84)
  - Génération URL QR code via API publique
  - Fallback si image ne charge pas
  - Support taille personnalisable

**Fonctions utilitaires** :
- `formatExpirationDate` : Formate date expiration en relatif (lignes 89-104)
- `formatScope` : Formate scope pour affichage (lignes 109-122)
- `formatPermissions` : Formate permissions pour affichage (lignes 127-138)

**Callbacks mémorisés** :
- `handleCreateLink` : Gère création lien (useCallback, lignes 181-215)
  - Délai avec `setTimeout` pour éviter blocage UI
- `handleRevokeLink` : Gère révocation lien (useCallback, lignes 218-255)
  - Délai avec `requestIdleCallback` ou `setTimeout`
- `handleCopyToken` : Gère copie token (useCallback, lignes 258-264)
- `handleCopyUrl` : Gère copie URL (useCallback, lignes 267-273)
- `handleDownloadExport` : Gère téléchargement export (useCallback, lignes 276-283)
- `handleCleanup` : Gère nettoyage liens expirés (useCallback, lignes 286-298)

**Données formulaire (`formData`)** :
- `expiresIn` : Durée expiration (défaut: '24h')
- `scope` : Scope données partagées (défaut: `SHARE_SCOPES.all`)
- `permissions` : Permissions (défaut: `[PERMISSIONS.read]`)

**Affichage conditionnel** :
- **DB non prête** : Spinner de chargement
- **Chargement** : Spinner si `loading === true` et `shareLinks.length === 0`
- **Erreur** : Card rouge avec message erreur
- **Formulaire création** : Formulaire complet si `showCreateForm === true`
- **Liste vide** : Message d'encouragement avec bouton créer lien
- **Liens actifs** : Cards avec détails, badges statut (actif/expiré), actions
- **QR Code** : Affichage QR code si `showQRCode === link.token`

**Actions disponibles par lien** :
- Afficher/Masquer QR code
- Copier token (avec feedback visuel)
- Copier URL (avec feedback visuel)
- Export JSON (téléchargement)
- Révoquer lien (avec confirmation)

---

#### 6.2. **CoachDashboard.jsx** (865 lignes)
**Rôle** : Dashboard coach pour visualiser les données nutrition partagées (vue lecture seule)

**Fonctionnalités principales** :
- ✅ Import JSON partagé (drag & drop ou bouton)
- ✅ Validation format JSON
- ✅ Affichage données selon scope (stats, charts, progress)
- ✅ Vue lecture seule (pas de modification)
- ✅ Navigation par onglets selon scope disponible
- ✅ Graphiques Recharts (LineChart, AreaChart, PieChart)
- ✅ Statistiques globales et moyennes par période
- ✅ Données progression (streak, niveau, badges)
- ✅ Double `requestAnimationFrame` pour rendu graphiques optimisé
- ✅ Calculs mémorisés avec `useMemo` pour performance

**Optimisations appliquées** :
- ✅ **OPT 45-46** : Logger standardisé + toasts pour feedback utilisateur
  - `useToast` pour `showError` (lignes 38, 118)
  - Remplacement `alert()` par `showError` toasts (lignes 178, 181, 196, 199)
  - Remplacement `console.error` par `log.error` (lignes 177, 195)
- ✅ Double `requestAnimationFrame` : Défère rendu graphiques pour garantir layout CSS (lignes 136-153)
- ✅ Mémorisation calculs : `useMemo` pour `chartData`, `macroDistribution`, `stats`, `progress`, `availableTabs` (lignes 204-267)
- ✅ Callbacks mémorisés : `useCallback` pour handlers drag/drop et sélection fichier (lignes 156-201)

**Imports** :
- `React`, `useState`, `useCallback`, `useRef`, `useMemo`
- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Button`, `Input`, `Badge`
- `Upload`, `FileText`, `BarChart3`, `TrendingUp`, `Trophy`, `Target`, `Calendar`, `CheckCircle`, `XCircle`, `AlertCircle`, `Info`, `Download`, `RefreshCw`, `Eye`, `Lock`, `Shield` (lucide-react)
- `LineChart`, `Line`, `BarChart`, `Bar`, `AreaChart`, `Area`, `PieChart`, `Pie`, `Cell`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`, `ResponsiveContainer`, `ReferenceLine` (recharts)
- `useCoachDashboard` (hook)
- `SHARE_SCOPES` (service constants)
- `useToast` (pour toasts)
- `logger` (pour logging standardisé)

**Hook utilisé** :
- `useCoachDashboard` avec `autoValidate: true`

**Props** :
- Aucune prop (composant autonome)

**States** :
- `dragActive` : État drag & drop actif (boolean)
- `activeTab` : Onglet actif ('stats' | 'charts' | 'progress')
- `chartsReady` : Graphiques prêts à rendre (boolean)
- `fileInputRef` : Référence input fichier (useRef)

**Données du hook** :
- `shareData` : Données partagées importées (object ou null)
- `loading` : État de chargement (boolean)
- `error` : Erreur éventuelle (string ou null)
- `scope` : Scope des données partagées (string)
- `importJson` : Fonction import JSON (function)
- `validateJson` : Fonction validation JSON (function)
- `clearData` : Fonction effacement données (function)
- `SHARE_SCOPES` : Scopes disponibles (object)

**Onglets disponibles** (selon scope) :
1. **Statistiques** (`stats`)
   - Disponible si `scope === all || scope === stats`
   - Total jours, total repas, programme actif
   - Moyennes par période (7j, 30j, 90j) : calories, macros, conformité

2. **Graphiques** (`charts`)
   - Disponible si `scope === all || scope === charts`
   - Timeline calories (LineChart)
   - Timeline macros (AreaChart avec gradients)
   - Distribution macros (PieChart)
   - Timeline conformité (LineChart avec référence 80%)

3. **Progression** (`progress`)
   - Disponible si `scope === all || scope === progress`
   - Streak, niveau, badges, total jours
   - Tendances (7j, 30j) : jours avec données, conformité moyenne, total repas

**Callbacks mémorisés** :
- `handleDrag` : Gère événements drag & drop (useCallback, lignes 156-164)
- `handleDrop` : Gère drop fichier (useCallback, lignes 166-184)
- `handleFileSelect` : Gère sélection fichier (useCallback, lignes 187-201)

**Calculs mémorisés** :
- `chartData` : Données pour graphiques (useMemo, lignes 204-217)
- `macroDistribution` : Distribution macros (useMemo, lignes 220-231)
- `stats` : Statistiques (useMemo, lignes 234-240)
- `progress` : Données progression (useMemo, lignes 243-249)
- `availableTabs` : Onglets disponibles selon scope (useMemo, lignes 252-267)

**Composant interne** :
- `CustomTooltip` : Tooltip personnalisé pour graphiques (lignes 101-115)

**Fonctions utilitaires** :
- `formatExpirationDate` : Formate date expiration en relatif (lignes 63-78)
- `formatScope` : Formate scope pour affichage (lignes 83-96)

**Affichage conditionnel** :
- **Pas de données** : Zone d'import drag & drop avec info mode coach
- **Erreur import** : Message d'erreur rouge
- **Chargement** : Spinner si `loading === true`
- **Données chargées** : Dashboard avec onglets selon scope
- **Graphiques** : Spinner si `chartsReady === false`, graphiques si prêts

**Performance** :
- ✅ Double `requestAnimationFrame` pour rendu graphiques (lignes 143-148)
- ✅ Mémorisation calculs avec `useMemo`
- ✅ Lazy rendering graphiques (attente `chartsReady`)
- ✅ Validation JSON automatique (`autoValidate: true`)

---

### 🎯 Résumé du sous-onglet Partage

**Fichiers principaux** : 2
1. ✅ NutritionSharing.jsx (668 lignes)
2. ✅ CoachDashboard.jsx (865 lignes)

**Total fichiers** : **2 fichiers**

**Lignes de code** : ~1533 lignes

**Optimisations appliquées** :
- ✅ OPT 37-38 : Logger standardisé + toasts (NutritionSharing)
- ✅ OPT 45-46 : Logger standardisé + toasts (CoachDashboard)
- ✅ Handlers optimisés avec délai (setTimeout/requestIdleCallback)
- ✅ Double requestAnimationFrame pour graphiques
- ✅ Mémorisation calculs avec useMemo
- ✅ Auto-nettoyage liens expirés

**Fonctionnalités clés** :
- Création liens de partage sécurisés avec tokens
- QR codes pour partage facile
- Export JSON anonymisé selon scope
- Import JSON avec validation
- Dashboard coach lecture seule
- Graphiques Recharts optimisés
- Scope configurable (all, stats, charts, progress)
- Permissions (lecture seule)
- Auto-nettoyage liens expirés

---

## ✅ ANALYSE TERMINÉE

**Tous les sous-onglets ont été analysés et documentés** :

1. ✅ **JOURNAL** 📝 (10 fichiers, ~4450 lignes)
2. ✅ **PROGRAMMES** 📋 (2 fichiers, ~1084 lignes)
3. ✅ **ANALYSES** 📊 (6 fichiers, ~3973 lignes)
4. ✅ **GAMIFICATION** 🎮 (1 fichier, ~409 lignes)
5. ✅ **PROGRESSION** 📸 (1 fichier, ~993 lignes)
6. ✅ **PARTAGE** 🤝 (2 fichiers, ~1533 lignes)

**Total** : **22 fichiers**, **~12442 lignes de code**

---

*Document mis à jour le 2025-01-16*

