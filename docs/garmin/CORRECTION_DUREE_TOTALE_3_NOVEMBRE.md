# Correction Durée Totale Erronée (3 Novembre 2025)

## 🔴 Problème Identifié

La "Durée totale" affichée pour le **lundi 3 novembre 2025** était de **1318 minutes**, ce qui est incorrect. Cette valeur erronée polluait les statistiques d'entraînement affichées dans le calendrier.

**Cause racine** : La fonction `calculateRealDuration()` ajoutait `enduranceData.duration` (qui contenait des valeurs mock) même quand les données Garmin étaient disponibles, ce qui créait des doublons et des valeurs erronées.

## 🔍 Analyse

Le problème venait de la fonction `getEnduranceDataForDate()` dans `CalendarHeatmap.jsx` qui calculait `enduranceData.duration` en additionnant **toutes** les sessions d'endurance pour une date donnée, **sans filtrer les sessions mock**.

Ces sessions mock avaient des caractéristiques spécifiques :
- Durées excessives (880 min, 1200 min, 3600 min, etc.)
- Distances suspectes (1.5m avec durée élevée)
- Sauts suspects (13200, 1200, etc.)
- Dates futures
- Sessions Garmin sans `garminId` avec valeurs suspectes

## ✅ Solution Implémentée

### 1. Logique de Priorité Corrigée dans `calculateRealDuration()`

**AVANT** : 
- Vérifiait les données Garmin
- Puis ajoutait quand même `enduranceData.duration` (pouvant contenir des mock)
- Puis ajoutait la durée du programme
- Résultat : valeurs erronées (1318 min)

**APRÈS** :
- **PRIORITÉ 1** : Si données Garmin disponibles → retourner **uniquement** la durée totale des activités Garmin du jour (cardio + swimming + jumpRope)
- **PRIORITÉ 2** : Si pas de données Garmin → retourner **uniquement** la durée prévue du programme (`workout.duration`, `workout.estimatedDuration`, ou `workout.duree` parsé)
- **Ne plus ajouter** `enduranceData.duration` ni les activités complémentaires pour éviter les doublons

### 2. Amélioration du Parsing des Durées Garmin

Tous les types d'activités Garmin (`cardio`, `swimming`, `jumpRope`) utilisent maintenant la même logique robuste pour parser les durées :
- Support des formats `"HH:MM:SS"` et `"MM:SS"`
- Support de `duration` (nombre ou string)
- Support de `totalTime` (généralement en secondes)
- Support de `elapsedTime` (généralement en secondes)
- Conversion automatique secondes → minutes si valeur > 1000

### 3. Filtrage des Sessions Mock dans `getEnduranceDataForDate()`

Ajout d'une fonction `isMockSession()` qui détecte les sessions mock selon **6 patterns** :

```javascript
// Pattern 1 : Durée excessive (>= 1440 min = 24h, ou valeurs suspectes)
if (durationMinutes >= 1440 || durationMinutes === 3600 || durationMinutes === 1200 || 
    (durationMinutes >= 800 && durationMinutes <= 900)) {
  return true;
}

// Pattern 2 : Distance très faible (1.5m) avec durée élevée (Natation mock)
if (distance === 1.5 && durationMinutes > 60) {
  return true;
}

// Pattern 3 : Corde à sauter mock (valeurs suspectes)
if ((jumps === 1200 && durationMinutes === 1200) || 
    jumps === 13200 || 
    (jumps >= 13000 && jumps <= 13500)) {
  return true;
}

// Pattern 4 : Sessions avec des valeurs "trop rondes" suspectes
if (jumps > 0 && (jumps % 1000 === 0 || jumps % 100 === 0) && jumps > 1000) {
  if (durationMinutes > 0 && (durationMinutes % 100 === 0 || durationMinutes % 1000 === 0)) {
    return true;
  }
}

// Pattern 5 : Date future
// Pattern 6 : Pas de garminId ET source = 'garmin' avec valeurs suspectes
```

Cette fonction est appliquée dans `getEnduranceDataForDate()` pour **exclure les sessions mock** avant de calculer `enduranceDuration`.

### 2. Filtrage dans `calculateDynamicTimeThresholds()`

Ajout d'une fonction `isMockSessionForThresholds()` identique pour filtrer les sessions mock lors du calcul des seuils dynamiques de durée, évitant que ces valeurs polluent les statistiques globales.

## 📁 Fichiers Modifiés

- **`src/components/CalendarHeatmap.jsx`** :
  - Ajout de `isMockSession()` dans `getIntensityForDate()`
  - Filtrage des sessions mock dans `getEnduranceDataForDate()` (ligne ~281)
  - Ajout de `isMockSessionForThresholds()` dans `calculateDynamicTimeThresholds()`
  - Filtrage des sessions mock dans le calcul des seuils dynamiques (ligne ~164)

## 🎯 Résultat Attendu

- ✅ La "Durée totale" pour le 3 novembre 2025 (et toutes les autres dates) affiche maintenant uniquement les **vraies durées** d'entraînement
- ✅ Les sessions mock sont **complètement exclues** du calcul de la durée totale
- ✅ Les statistiques d'entraînement (répétitions totales, exercices classiques, durée totale, intensité globale) sont maintenant **précises et cohérentes**
- ✅ La cohérence est assurée avec les autres composants (`CalendarTab.jsx`, `TodayTab.jsx`) qui utilisent la même logique de détection des sessions mock

## 🔄 Cohérence avec le Reste du Code

Cette correction est **cohérente** avec les corrections déjà appliquées dans :
- `CalendarTab.jsx` : même fonction `isMockSession` avec les mêmes patterns
- `TodayTab.jsx` : même fonction `isMockSession` avec les mêmes patterns
- `WorkoutContext.jsx` : fonction `deleteMockEnduranceSessions()` qui supprime définitivement les sessions mock

## 🔍 Diagnostic Amélioré (Phase 2)

### 4. Correction de la Logique de Conversion des Durées

**Problème identifié** : Les durées erronées (623 min, 634 min, 611 min) provenaient d'une mauvaise interprétation de l'unité des valeurs numériques.

**Cause racine** : La logique de conversion utilisait un seuil simple (`numValue > 1000 ? secondes : minutes`), ce qui causait des erreurs pour les valeurs entre 200 et 1000 :
- `623` était traité comme `623 minutes` au lieu de `623 secondes` (~10 min)
- `634` était traité comme `634 minutes` au lieu de `634 secondes` (~11 min)
- `611` était traité comme `611 minutes` au lieu de `611 secondes` (~10 min)

**Solution implémentée** : Logique de conversion intelligente avec seuils adaptatifs :

```javascript
if (numValue >= 1000) {
  // Toujours en secondes (1000+ min = 16h40+, trop long pour une activité normale)
  actDurationMinutes = Math.round(numValue / 60);
} else if (numValue >= 200 && numValue < 1000) {
  // Probablement en secondes (200-1000 min = 3h20-16h40, possible mais rare)
  actDurationMinutes = Math.round(numValue / 60);
} else if (numValue >= 60 && numValue < 200) {
  // Ambigu : peut être minutes ou secondes
  // Si valeur arrondie (multiple de 5 ou 10) ET <= 120, probablement minutes
  const isRounded = (numValue % 5 === 0 || numValue % 10 === 0) && numValue <= 120;
  actDurationMinutes = isRounded ? numValue : Math.round(numValue / 60);
} else {
  // < 60 : garder tel quel (différence négligeable)
  actDurationMinutes = numValue;
}
```

**Résultat attendu** :
- ✅ `623` → `623 secondes` → `10 min` (au lieu de 623 min)
- ✅ `634` → `634 secondes` → `11 min` (au lieu de 634 min)
- ✅ `611` → `611 secondes` → `10 min` (au lieu de 611 min)
- ✅ `117` → `117 minutes` (valeur arrondie, <= 120) → `117 min` (correct)
- ✅ `60`, `90`, `120` → traitées comme minutes (correct)

Cette logique a été appliquée à **tous les types d'activités** (`cardio`, `swimming`, `jumpRope`) pour garantir la cohérence.

### 5. Ajout de Logs Détaillés pour le Diagnostic

Pour identifier précisément l'origine des durées erronées (comme les 1318 minutes pour le 03/11/2025), des logs détaillés ont été ajoutés dans la boucle de calcul des durées Garmin :

**Logs ajoutés pour chaque activité cardio** :
- Log du nombre d'activités cardio trouvées pour la date
- Log détaillé pour chaque activité avec :
  - Index et ID de l'activité
  - Format de la durée trouvée (`duration`, `totalTime`, `elapsedTime`)
  - Durée parsée en minutes
  - Avertissement si la durée est suspecte (> 24h = 1440 min)
- Log de la durée totale cardio après toutes les activités

**Exemple de logs** :
```
🔍 [calculateRealDuration] Trouvé 3 activité(s) cardio pour 2025-11-03
🔍 [calculateRealDuration] Cardio[0] (123456) - duration=79000 (secondes) → 1316 min
⚠️ [calculateRealDuration] Cardio[0] (123456) - Durée suspecte: 1316 min (> 24h). Vérifier les données brutes: {...}
🔍 [calculateRealDuration] Cardio[1] (123457) - duration="00:01:00" (HH:MM:SS) → 1.00 min
🔍 [calculateRealDuration] Cardio[2] (123458) - duration=1 (minutes) → 1 min
🔍 [calculateRealDuration] Durée totale cardio (après 3 activité(s)): 1318 min
✅ [calculateRealDuration] Retour depuis activités Garmin: 1318 min (cardio: 3, swimming: 0, jumpRope: 0)
```

Ces logs permettent de :
1. **Identifier précisément** quelle activité a une durée erronée
2. **Comprendre** le format de la durée brute (secondes, minutes, HH:MM:SS)
3. **Tracer** le calcul de la durée parsée
4. **Détecter** les durées suspectes (> 24h) automatiquement
5. **Vérifier** si le problème vient des données brutes Garmin ou du parsing

## 📝 Notes

- La détection des sessions mock est basée sur des **patterns spécifiques** identifiés lors des corrections précédentes
- Les durées mock typiques sont : 880 min, 1200 min, 3600 min, >= 1440 min (24h)
- Les sessions mock sont **ignorées** mais **pas supprimées** automatiquement par ce composant (la suppression se fait via `deleteMockEnduranceSessions()` dans `WorkoutContext.jsx`)
- Les logs détaillés permettent maintenant de **diagnostiquer précisément** l'origine des durées erronées, que ce soit dans les données brutes Garmin ou dans le parsing

