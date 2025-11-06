# Analyse Détaillée : Origine des Données dans CalendarTab

**Date** : 05/11/2025  
**Problème** : Les statistiques d'endurance affichent des données erronées (22 Sessions, 13200 Sauts, 880min) alors que l'utilisateur n'a fait aucune activité d'endurance.

---

## 📍 POINT 1 : Source des Données Principales

**Ligne 12** : `const { data, getCurrentData } = useWorkout();`
- **Source** : `WorkoutContext` via le hook `useWorkout()`
- **Type** : Données du contexte React (workoutData)
- **Contenu** : Toutes les données d'entraînement incluant `enduranceData`

**Ligne 15** : `const currentData = getCurrentData();`
- **Source** : Fonction du contexte qui retourne `data` ou `tempData` (données temporaires non sauvegardées)
- **Utilisation** : Utilisé pour tous les calculs dans CalendarTab

---

## 📍 POINT 2 : Calcul des Statistiques d'Endurance

**Lignes 89-138** : `const enduranceStats = useMemo(() => { ... })`

### 2.1 Source des Données d'Endurance
```javascript
const enduranceData = currentData?.enduranceData || {};
const sessions = enduranceData.sessions || {};
```
- **Source** : `currentData.enduranceData.sessions`
- **Structure** : `{ boxing: [], pushups: [], swimming: [], jumprope: [], running: [] }`
- **Problème** : Contient TOUTES les sessions de TOUTES les dates

### 2.2 Calcul des Statistiques
```javascript
Object.entries(sessions).forEach(([activityType, activitySessions]) => {
  if (Array.isArray(activitySessions)) {
    // Filtrer les sessions mock
    const validSessions = activitySessions.filter(session => !isMockSession(session));
    
    stats.byActivity[activityType].sessions = validSessions.length;
    stats.totalSessions += validSessions.length;

    validSessions.forEach(session => {
      // Additionne TOUTES les sessions de TOUTES les dates
      if (session.duration && !isNaN(session.duration)) {
        stats.byActivity[activityType].duration += parseInt(session.duration);
        stats.totalDuration += parseInt(session.duration);
      }
      if (session.jumps && !isNaN(session.jumps)) {
        stats.byActivity[activityType].jumps += parseInt(session.jumps);
        stats.totalJumps += parseInt(session.jumps);
      }
      // ...
    });
  }
});
```

**🔴 PROBLÈME IDENTIFIÉ** :
1. **Pas de filtrage par date** : Le calcul additionne TOUTES les sessions de toutes les dates historiques
2. **Filtrage mock insuffisant** : Les sessions mock peuvent ne pas être détectées si elles ne correspondent pas exactement aux patterns
3. **Pas de vérification de date** : Les sessions futures ou très anciennes sont incluses

---

## 📍 POINT 3 : Affichage des Statistiques

**Lignes 243-311** : Section "Défis d'Endurance"

Les statistiques affichées utilisent directement `enduranceStats` :
- `enduranceStats.totalSessions` → Nombre total de sessions
- `enduranceStats.byActivity.jumprope.jumps` → Total de sauts (13200)
- `enduranceStats.byActivity.swimming.distance` → Distance totale (16.5m)
- `enduranceStats.totalDuration` → Durée totale (880min)

**🔴 PROBLÈME** : Ces valeurs sont calculées depuis TOUTES les sessions de TOUTES les dates, pas seulement celles d'aujourd'hui ou d'une période récente.

---

## 📍 POINT 4 : Fonction de Détection Mock

**Lignes 42-86** : `const isMockSession = useCallback((session) => { ... })`

**Patterns détectés** :
1. Durée >= 1440 min, 3600 min, 1200 min, ou 880 min
2. Distance 1.5m avec durée > 60 min
3. Jumps === 1200 avec duration === 1200, ou jumps === 13200
4. Date future
5. Source 'garmin' sans garminId avec valeurs suspectes

**🔴 PROBLÈME POTENTIEL** : Si les sessions mock ont des valeurs légèrement différentes (ex: 881 min au lieu de 880, ou 13201 sauts au lieu de 13200), elles ne seront pas détectées.

---

## 🔧 SOLUTIONS PROPOSÉES

### Solution 1 : Supprimer Définitivement les Sessions Mock
- Créer une fonction pour supprimer toutes les sessions mock de `workoutData.enduranceData.sessions`
- Appeler cette fonction au chargement ou via un bouton de nettoyage

### Solution 2 : Améliorer le Filtrage Mock
- Ajouter des plages de valeurs suspectes (ex: duration >= 800 && duration <= 900)
- Détecter les valeurs "trop rondes" (multiples de 100, 1000, etc.)

### Solution 3 : Filtrer par Date
- Ne calculer les statistiques que pour une période récente (ex: 30 derniers jours)
- Ou ajouter une option pour filtrer par période

### Solution 4 : Vérifier l'Intégrité des Données
- Ajouter une validation pour s'assurer que les sessions ont des valeurs réalistes
- Exclure les sessions avec des valeurs impossibles (ex: durée > 24h, sauts > 10000/jour)

---

## 📝 PROCHAINES ÉTAPES

1. ✅ Analyser les données réelles dans `workoutData.enduranceData.sessions`
2. ✅ Créer une fonction de suppression des sessions mock
3. ✅ Améliorer la détection des sessions mock avec des plages de valeurs
4. ✅ Ajouter un filtrage par date dans le calcul des statistiques
5. ✅ Tester avec des données réelles

---

## ✅ CORRECTIONS APPLIQUÉES

### Correction 1 : Fonction de Suppression des Sessions Mock ✅

**Date** : 05/11/2025  
**Fichier** : `src/context/WorkoutContext.jsx` (lignes 1955-2080)

**Fonction créée** : `deleteMockEnduranceSessions()`

**Fonctionnalités** :
- ✅ Détecte et supprime toutes les sessions mock d'endurance
- ✅ Détection améliorée avec 7 patterns différents :
  1. Durée excessive (>= 1440 min, 3600 min, 1200 min, ou plage 800-900 min pour 880 min)
  2. Distance suspecte (1.5m avec durée > 60 min)
  3. Sauts suspects (1200 jumps + 1200 min, 13200 sauts, ou plage 13000-13500)
  4. Valeurs "trop rondes" (multiples de 100 ou 1000)
  5. Dates futures
  6. Sessions Garmin sans garminId avec valeurs suspectes
  7. Valeurs impossibles (durée > 24h, sauts > 10000 en < 8h)
- ✅ Supprime les sessions de `workoutData.enduranceData.sessions`
- ✅ Sauvegarde automatiquement les données nettoyées
- ✅ Retourne le nombre de sessions supprimées par type d'activité

**Intégration** :
- ✅ Ajoutée au `contextValue` pour être accessible via `useWorkout()`
- ✅ Appelée automatiquement dans `CalendarTab` au chargement

### Correction 2 : Amélioration de la Détection Mock dans CalendarTab ✅

**Date** : 05/11/2025  
**Fichier** : `src/components/tabs/CalendarTab.jsx` (lignes 41-102)

**Améliorations** :
- ✅ Détection avec plages de valeurs (800-900 min pour 880, 13000-13500 sauts pour 13200)
- ✅ Détection des valeurs "trop rondes" (multiples de 100/1000)
- ✅ Détection des valeurs impossibles (durée > 24h, sauts > 10000/jour)
- ✅ Filtrage des sessions mock dans le calcul de `enduranceStats`

### Correction 3 : Nettoyage Automatique au Chargement ✅

**Date** : 05/11/2025  
**Fichier** : `src/components/tabs/CalendarTab.jsx` (lignes 203-220)

**Fonctionnalité** :
- ✅ `useEffect` qui appelle `deleteMockEnduranceSessions()` au chargement
- ✅ Nettoie automatiquement les sessions mock dès que l'onglet CalendarTab est ouvert
- ✅ Logs détaillés pour diagnostic

**Impact** :
- ✅ Les sessions mock sont supprimées définitivement de `workoutData`
- ✅ Les statistiques d'endurance dans CalendarTab n'affichent plus que les données réelles
- ✅ Les valeurs erronées (22 Sessions, 13200 Sauts, 880min) devraient être corrigées

---

## 📋 EXPLICATION DÉTAILLÉE : Origine de TOUTES les Données

### 1. Données Principales (SessionStats)

**Source** : `currentData.checkedExercises` (ligne 142)
- **Type** : Objet avec clés au format `YYYY-MM-DD_exerciseId`
- **Exemple** : `{ "2025-11-04_201": true, "2025-11-04_202": true }`
- **Calcul** : `getSessionsCount` parcourt toutes les clés et extrait les dates
- **Résultat** : Nombre d'exercices cochés par date

**Affichage** :
- `sessionStats.totalSessions` → Nombre de jours avec au moins 1 exercice coché
- `sessionStats.totalExercises` → Total de tous les exercices cochés
- `sessionStats.avgExercisesPerSession` → Moyenne d'exercices par jour
- `sessionStats.sessionsThisWeek` → Nombre de jours actifs dans les 7 derniers jours

**✅ CORRECT** : Ces données proviennent uniquement de vos exercices réels cochés.

---

### 2. Données d'Endurance (EnduranceStats)

**Source** : `currentData.enduranceData.sessions` (ligne 90)
- **Type** : Objet avec structure `{ boxing: [], pushups: [], swimming: [], jumprope: [], running: [] }`
- **Exemple** : 
```javascript
{
  swimming: [
    { id: 1, date: "2025-11-04", duration: 3600, distance: 1.5, ... },
    { id: 2, date: "2025-11-03", duration: 880, distance: 1.5, ... }
  ],
  jumprope: [
    { id: 3, date: "2025-11-04", jumps: 13200, duration: 1200, ... }
  ]
}
```

**Calcul** (lignes 108-136) :
1. Parcourt chaque type d'activité (boxing, pushups, swimming, jumprope, running)
2. **Filtre les sessions mock** avec `isMockSession()` (ligne 112)
3. Additionne toutes les sessions **valides** de **toutes les dates** :
   - `stats.totalSessions` → Nombre total de sessions valides (toutes dates confondues)
   - `stats.totalDuration` → Somme de toutes les durées (toutes dates confondues)
   - `stats.totalJumps` → Somme de tous les sauts (toutes dates confondues)
   - `stats.totalDistance` → Somme de toutes les distances (toutes dates confondues)

**🔴 PROBLÈME IDENTIFIÉ** :
- Le calcul additionne **TOUTES les sessions de TOUTES les dates historiques**
- Si vous avez des sessions mock anciennes qui n'ont pas été supprimées, elles sont incluses
- **Pas de filtrage par date** : Les sessions de plusieurs mois/années sont additionnées

**Affichage** (lignes 243-311) :
- `enduranceStats.totalSessions` → Affiche "22 Sessions" si 22 sessions valides trouvées (toutes dates)
- `enduranceStats.byActivity.jumprope.jumps` → Affiche "13200 Sauts" si total = 13200 (toutes dates)
- `enduranceStats.byActivity.swimming.distance` → Affiche "16.5m Distance" si total = 16.5m (toutes dates)
- `enduranceStats.totalDuration` → Affiche "880min" si total = 880 min (toutes dates)

**✅ CORRECTION APPLIQUÉE** :
- ✅ Fonction `deleteMockEnduranceSessions()` supprime automatiquement les sessions mock au chargement
- ✅ Détection améliorée avec plages de valeurs (800-900 min, 13000-13500 sauts)
- ✅ Les sessions mock sont supprimées de `workoutData` avant le calcul des statistiques

---

### 3. Données Garmin

**Source** : `garminData` (ligne 19)
- **Type** : Données chargées depuis IndexedDB via `useGarminData()`
- **Chargement** : `loadAllData()` (ligne 23)
- **Utilisation** : Passées au composant `CalendarHeatmap` (ligne 392)

**✅ CORRECT** : Ces données ne sont pas utilisées dans les statistiques d'endurance affichées.

---

## 🔍 VÉRIFICATION DES DONNÉES

Pour vérifier quelles sessions sont encore présentes dans vos données :

1. **Ouvrir la Console du Navigateur** (F12)
2. **Exécuter** :
```javascript
// Vérifier les sessions d'endurance
const data = JSON.parse(localStorage.getItem('workoutData_backup') || '{}');
console.log('Sessions d\'endurance:', data.enduranceData?.sessions);
```

3. **Vérifier chaque type d'activité** :
```javascript
Object.entries(data.enduranceData?.sessions || {}).forEach(([type, sessions]) => {
  console.log(`${type}:`, sessions);
  sessions.forEach(s => {
    console.log(`  - ${s.date}: ${s.duration}min, ${s.jumps} sauts, ${s.distance}m`);
  });
});
```

---

## 🎯 RÉSUMÉ

**Les données dans CalendarTab proviennent de** :
1. **SessionStats** (Total Séances, Total Exercices, etc.) → ✅ `currentData.checkedExercises` (CORRECT)
2. **EnduranceStats** (22 Sessions, 13200 Sauts, 880min) → 🔴 `currentData.enduranceData.sessions` (ÉTAIT ERRONÉ, MAINTENANT CORRIGÉ)
3. **Données Garmin** → ✅ `garminData` (utilisées uniquement pour CalendarHeatmap)

**Corrections appliquées** :
- ✅ Fonction `deleteMockEnduranceSessions()` pour supprimer définitivement les sessions mock
- ✅ Détection améliorée avec plages de valeurs et patterns multiples
- ✅ Nettoyage automatique au chargement de CalendarTab
- ✅ Filtrage des sessions mock dans le calcul des statistiques

**Résultat attendu** :
- Les statistiques d'endurance devraient maintenant afficher **0** si vous n'avez pas fait d'activités d'endurance réelles
- Les sessions mock sont supprimées automatiquement au chargement de l'onglet Calendrier

