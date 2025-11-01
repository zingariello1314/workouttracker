# 📋 PHASE 5.3 : INTÉGRATION CALENDAR TAB - LOGIQUE DÉTAILLÉE

**Date :** 2025-01-31  
**Statut :** 🔄 **À IMPLÉMENTER**

---

## 🎯 COMPRÉHENSION CRITIQUE DE LA LOGIQUE

### **Principe Fondamental**

Les données Garmin ne sont **PAS** des données supplémentaires à ajouter. Ce sont des **mesures précises** faites **PENDANT** l'exécution des exercices programmés.

### **Exemple Concret**

**Scénario :**
- 5 exercices programmés apparaissent dans "Aujourd'hui"
- Temps prévu estimé : 1h
- Utilisateur coche les 5 exercices → système enregistre reps + temps prévu
- **Pendant l'exécution** : montre Garmin allumée → enregistre :
  - Temps réel d'activité cardio (ex: 58 minutes)
  - Fréquence cardiaque
  - Calories brûlées
  - Autres métriques

**Ce qui doit se passer :**
- Les données Garmin servent à **recalibrer** le temps estimé (1h prévu → 58min réel)
- Elles **améliorent la précision** des métriques, pas à créer des doublons

---

## 📊 INFLUENCE SUR LA COULEUR DES CASES CALENDRIER

### **Logique Actuelle (sans Garmin)**

La couleur des cases est actuellement basée sur :
- Nombre de répétitions totales
- Temps estimé/prévu d'entraînement
- Nombre d'exercices complétés

### **Logique Améliorée (avec Garmin)**

La couleur doit être influencée **uniquement** par les métriques qui reflètent directement l'activité physique réelle :

#### ✅ **CE QUI DOIT INFLUENCER LA COULEUR**

1. **Temps réel d'activité (Cardio Activities)**
   - **Utilité** : Recalibrer le temps prévu avec le temps réel
   - **Impact** : Si temps réel > temps prévu → augmenter intensité de couleur
   - **Source** : `activities.cardio[].duration` ou `activities.cardio[].totalTime`
   - **Logique** : `tempsRéel / tempsPrévu` → facteur d'ajustement (0.8 à 1.5)

2. **Records Natation (Distance)**
   - **Utilité** : Détecter si l'utilisateur a nagé plus que sa meilleure performance
   - **Impact** : Si distance actuelle > meilleure distance précédente → augmenter intensité
   - **Source** : `activities.swimming[].distance` ou `activities.swimming[].totalDistance`
   - **Logique** : Comparer avec historique natation, si record → bonus couleur

3. **Records Corde à Sauter (Nombre de Sauts)**
   - **Utilité** : Détecter si l'utilisateur a fait plus de sauts que son record
   - **Impact** : Si sauts actuels > meilleur nombre de sauts précédent → augmenter intensité
   - **Source** : `activities.jumpRope[].jumps`
   - **Logique** : Comparer avec historique corde, si record → bonus couleur

4. **Calories Actives Brûlées**
   - **Utilité** : Refléter l'intensité réelle de l'entraînement
   - **Impact** : Si calories actives > moyenne sur période → légère augmentation
   - **Source** : `dailyMetrics[date].calories.active`
   - **Logique** : Comparer avec moyenne des 7 derniers jours, ajustement modéré (±10%)

#### ❌ **CE QUI NE DOIT PAS INFLUENCER LA COULEUR**

1. **Fréquence Cardiaque Variable**
   - **Raison** : Variable selon fatigue, stress, hydratation → pas représentatif de l'activité
   - **Source** : `dailyMetrics[date].heartRate.resting/max/avg`
   - **Action** : Ignorer complètement pour calcul couleur

2. **Body Battery**
   - **Raison** : Reflète la récupération/énergie, pas l'activité
   - **Source** : `dailyMetrics[date].bodyBattery`
   - **Action** : Ignorer pour calcul couleur

3. **Stress**
   - **Raison** : Peut être élevé pour raisons non-sportives
   - **Source** : `dailyMetrics[date].stress`
   - **Action** : Ignorer pour calcul couleur

4. **Sommeil**
   - **Raison** : Métrique de récupération, pas d'activité
   - **Source** : `dailyMetrics[date].sleep`
   - **Action** : Ignorer pour calcul couleur

5. **Respiration**
   - **Raison** : Trop variable selon contexte
   - **Source** : `dailyMetrics[date].respiration`
   - **Action** : Ignorer pour calcul couleur

6. **Minutes Intensives**
   - **Raison** : Peut être inclus dans temps réel d'activité
   - **Source** : `dailyMetrics[date].intensityMinutes`
   - **Action** : Ignorer (déjà pris en compte via activités)

---

## 🔧 LOGIQUE D'IMPLÉMENTATION

### **Étape 1 : Fonction de Calcul d'Intensité Améliorée**

Créer une fonction `calculateDayIntensity(date, workoutData, garminData)` qui :

1. **Calcule l'intensité de base** (logique actuelle)
   - Nombre de reps
   - Nombre d'exercices
   - Temps prévu

2. **Applique les ajustements Garmin** (si données disponibles pour cette date) :
   - **Ajustement Temps Réel** :
     ```javascript
     const tempsPrévu = workoutData.duration || 0;
     const tempsRéel = garminData.activities.cardio
       .filter(act => act.date === date)
       .reduce((sum, act) => sum + (act.duration || act.totalTime / 60 || 0), 0);
     
     if (tempsRéel > 0 && tempsPrévu > 0) {
       const ratioTemps = tempsRéel / tempsPrévu;
       // Si temps réel > temps prévu, augmenter intensité
       if (ratioTemps > 1.1) intensityMultiplier *= 1.2; // +20% si 10% de dépassement
       else if (ratioTemps > 0.9 && ratioTemps <= 1.1) intensityMultiplier *= 1.0; // Normal
       else if (ratioTemps < 0.9) intensityMultiplier *= 0.9; // -10% si moins que prévu
     }
     ```
   
   - **Bonus Record Natation** :
     ```javascript
     const natationJour = garminData.activities.swimming
       .filter(act => act.date === date);
     
     if (natationJour.length > 0) {
       const distanceJour = natationJour.reduce((sum, act) => sum + (act.distance || 0), 0);
       const meilleureDistance = getMeilleureDistanceNatation(garminData, date); // Historique
       
       if (distanceJour > meilleureDistance) {
         intensityMultiplier *= 1.3; // +30% pour record natation
       } else if (distanceJour > meilleureDistance * 0.8) {
         intensityMultiplier *= 1.1; // +10% si proche du record
       }
     }
     ```
   
   - **Bonus Record Corde à Sauter** :
     ```javascript
     const cordeJour = garminData.activities.jumpRope
       .filter(act => act.date === date);
     
     if (cordeJour.length > 0) {
       const sautsJour = cordeJour.reduce((sum, act) => sum + (act.jumps || 0), 0);
       const meilleurNombreSauts = getMeilleurNombreSauts(garminData, date); // Historique
       
       if (sautsJour > meilleurNombreSauts) {
         intensityMultiplier *= 1.25; // +25% pour record sauts
       } else if (sautsJour > meilleurNombreSauts * 0.8) {
         intensityMultiplier *= 1.1; // +10% si proche du record
       }
     }
     ```
   
   - **Ajustement Calories Actives** (léger) :
     ```javascript
     const caloriesJour = garminData.dailyMetrics[date]?.calories?.active || 0;
     const moyenne7Jours = getMoyenneCalories7Jours(garminData, date);
     
     if (caloriesJour > 0 && moyenne7Jours > 0) {
       const ratio = caloriesJour / moyenne7Jours;
       if (ratio > 1.2) intensityMultiplier *= 1.05; // +5% si 20% au-dessus moyenne
       // Pas de diminution si en dessous (peut être normal)
     }
     ```

3. **Retourne l'intensité finale** (limite entre 0 et 1)

### **Étape 2 : Fonctions Helper pour Records**

```javascript
// Fonction pour obtenir la meilleure distance de natation AVANT cette date
function getMeilleureDistanceNatation(garminData, date) {
  if (!garminData?.activities?.swimming) return 0;
  
  const dateObj = new Date(date);
  const natationsAvant = garminData.activities.swimming
    .filter(act => {
      const actDate = new Date(act.date);
      return actDate < dateObj;
    })
    .map(act => act.distance || act.totalDistance || 0);
  
  return natationsAvant.length > 0 ? Math.max(...natationsAvant) : 0;
}

// Fonction pour obtenir le meilleur nombre de sauts AVANT cette date
function getMeilleurNombreSauts(garminData, date) {
  if (!garminData?.activities?.jumpRope) return 0;
  
  const dateObj = new Date(date);
  const sautsAvant = garminData.activities.jumpRope
    .filter(act => {
      const actDate = new Date(act.date);
      return actDate < dateObj;
    })
    .map(act => act.jumps || 0);
  
  return sautsAvant.length > 0 ? Math.max(...sautsAvant) : 0;
}

// Fonction pour obtenir la moyenne des calories actives sur 7 jours
function getMoyenneCalories7Jours(garminData, date) {
  if (!garminData?.dailyMetrics) return 0;
  
  const dateObj = new Date(date);
  const calories7Jours = [];
  
  for (let i = 1; i <= 7; i++) {
    const checkDate = new Date(dateObj);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    const calories = garminData.dailyMetrics[dateStr]?.calories?.active || 0;
    if (calories > 0) calories7Jours.push(calories);
  }
  
  return calories7Jours.length > 0 
    ? calories7Jours.reduce((sum, c) => sum + c, 0) / calories7Jours.length 
    : 0;
}
```

### **Étape 3 : Modification de CalendarHeatmap**

**Fichier :** `src/components/CalendarHeatmap.jsx`

**Modifications :**

1. **Ajouter prop `garminData`** (optionnel)
   ```javascript
   CalendarHeatmap({
     sessionsCount, // existant
     garminData, // NOUVEAU : { activities: {}, dailyMetrics: {} }
     // ... autres props
   })
   ```

2. **Modifier le calcul de couleur/intensité** pour utiliser `calculateDayIntensity`

3. **Conserver la logique existante** comme base (ne pas tout remplacer)

---

## 🎨 AFFICHAGE DES ICÔNES

### **Logique Simple**

Afficher des icônes dans chaque case pour indiquer la présence d'activités Garmin **sans influencer la couleur de base**.

**Icônes :**
- 🏊 Si natation enregistrée ce jour
- 🪢 Si corde à sauter enregistrée ce jour
- ❤️ Si activité cardio enregistrée ce jour

**Position :** En bas à droite de la case, petits, discrets.

**Fonction :**
```javascript
function getGarminActivityIcons(garminData, date) {
  const icons = [];
  
  const hasSwimming = garminData?.activities?.swimming?.some(act => act.date === date);
  const hasJumpRope = garminData?.activities?.jumpRope?.some(act => act.date === date);
  const hasCardio = garminData?.activities?.cardio?.some(act => act.date === date);
  
  if (hasSwimming) icons.push({ icon: '🏊', label: 'Natation' });
  if (hasJumpRope) icons.push({ icon: '🪢', label: 'Corde à sauter' });
  if (hasCardio) icons.push({ icon: '❤️', label: 'Cardio' });
  
  return icons;
}
```

---

## 📋 RÈGLES DE PRIORITÉ

### **Ordre d'Application des Ajustements**

1. **Base** : Calcul intensité actuel (reps + exercices + temps prévu)
2. **Ajustement Temps Réel** : Appliquer en premier (recalibrage principal)
3. **Bonus Records** : Appliquer ensuite (natation, puis corde)
4. **Ajustement Calories** : Appliquer en dernier (influence légère)

### **Limites de Sécurité**

- **Intensité finale** : Ne jamais dépasser 1.5x l'intensité de base
- **Intensité finale** : Ne jamais descendre en dessous de 0.5x l'intensité de base
- **Pas d'ajustement** : Si aucune donnée Garmin pour cette date → utiliser logique actuelle uniquement

---

## 🔍 CAS LIMITES À GÉRER

### **Cas 1 : Activité Garmin sans exercice programmé**

- **Situation** : Utilisateur fait une activité (natation) enregistrée par Garmin, mais pas d'exercice programmé ce jour
- **Action** : Ne pas créer de nouvelle case de couleur, mais afficher l'icône 🏊

### **Cas 2 : Exercice programmé sans activité Garmin**

- **Situation** : Utilisateur coche des exercices mais n'avait pas sa montre
- **Action** : Utiliser logique actuelle uniquement (pas d'ajustement Garmin)

### **Cas 3 : Données Garmin partiellement disponibles**

- **Situation** : Activité cardio présente mais pas de natation/corde
- **Action** : Appliquer seulement les ajustements pour lesquels on a des données

### **Cas 4 : Multiples activités le même jour**

- **Situation** : Natation + corde + cardio le même jour
- **Action** : Appliquer tous les bonus/ajustements, mais avec plafond d'intensité

---

## ⚙️ IMPLÉMENTATION TECHNIQUE

### **Fichiers à Modifier**

1. **`src/components/CalendarHeatmap.jsx`**
   - Ajouter prop `garminData`
   - Modifier fonction de calcul d'intensité
   - Ajouter affichage icônes

2. **`src/components/tabs/CalendarTab.jsx`**
   - Ajouter hook `useGarminData`
   - Charger données Garmin
   - Passer `garminData` à `CalendarHeatmap`

3. **Nouveau fichier : `src/utils/garminCalendarUtils.js`**
   - Fonction `calculateDayIntensityWithGarmin`
   - Fonctions helper pour records
   - Fonction `getGarminActivityIcons`

### **Structure de Données Attendue**

```javascript
garminData = {
  activities: {
    swimming: [
      { date: "2025-01-30", distance: 200, duration: 15, ... }
    ],
    jumpRope: [
      { date: "2025-01-30", jumps: 1034, duration: 10, ... }
    ],
    cardio: [
      { date: "2025-01-30", duration: 58, totalTime: 3480, ... }
    ]
  },
  dailyMetrics: {
    "2025-01-30": {
      calories: { active: 125, total: 139, ... },
      // ... autres métriques (non utilisées pour couleur)
    }
  }
}
```

---

## ✅ CRITÈRES DE RÉUSSITE

1. ✅ Les icônes Garmin s'affichent correctement dans les cases
2. ✅ La couleur des cases est influencée uniquement par :
   - Temps réel vs prévu
   - Records natation
   - Records corde à sauter
   - Calories actives (léger ajustement)
3. ✅ La logique actuelle du calendrier n'est **pas cassée**
4. ✅ Pas de duplication de données (Garmin recalibre, n'ajoute pas)
5. ✅ Les métriques non-représentatives (FC, Body Battery, etc.) sont ignorées
6. ✅ Performance : Calculs rapides même avec beaucoup de données

---

## 🎯 RÉSUMÉ EXÉCUTIF

**Principe clé :** Les données Garmin sont des **mesures précises pendant l'activité**, pas des activités supplémentaires.

**Utilisation :**
- Recalibrer les temps estimés
- Détecter les records (natation, corde)
- Légèrement ajuster selon calories actives
- Afficher des icônes informatives

**À ne jamais faire :**
- Ajouter les données Garmin comme nouvelles activités
- Influencer la couleur avec des métriques variables (FC, Body Battery, Stress)
- Casser la logique existante du calendrier

---

**Document créé le :** 2025-01-31  
**Prêt pour implémentation :** ✅ Oui


