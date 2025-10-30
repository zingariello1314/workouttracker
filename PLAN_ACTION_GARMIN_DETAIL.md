# PLAN D'ACTION - Récupération Complète des Données Garmin

## Date: 2025-01-27

## Objectif
Implémenter la récupération complète de TOUTES les métriques Garmin spécifiées, y compris:
- Données détaillées des activités (natation, corde à sauter, cardio)
- Métriques quotidiennes (sommeil, calories actives/repos, respiration, distance km/jour)
- Données Connect IQ (JumpJump Pro)

---

## ANALYSE DE L'EXISTANT

### Problèmes Identifiés

1. **Activités - Récupération Incomplète**
   - ❌ Utilise seulement `get_activities_by_date()` qui retourne des métriques de base
   - ❌ Ne récupère PAS les détails complets via `get_activity(activity_id)`
   - ❌ Manque: calories actives/repos par activité, transpiration, minutes intensives, SWOLF natation, métriques Connect IQ

2. **Métriques Quotidiennes - Données Manquantes**
   - ❌ Sommeil: récupéré mais peut-être incomplet
   - ❌ Respiration: NON récupéré (min/max/moyenne éveillé/sommeil)
   - ❌ Distance km/jour: normalisé mais peut être 0
   - ❌ Calories actives/repos: récupéré mais peut être incomplet
   - ❌ Intensité minutes: NON récupéré

3. **Type d'Activité - Détection Incomplète**
   - ❌ Cardio/Cordio détecté mais métriques détaillées manquantes
   - ❌ Connect IQ (JumpJump Pro) non récupéré

---

## PLAN D'ACTION DÉTAILLÉ

### ÉTAPE 1: Améliorer Récupération Activités Détaillées

**Objectif**: Récupérer TOUTES les métriques de chaque activité via `get_activity(activity_id)`

**Actions**:
1. Pour chaque activité retournée par `get_activities_by_date()`:
   - Récupérer `activity_id`
   - Appeler `client.get_activity(activity_id)` pour détails complets
   - Parser toutes les métriques disponibles

**Métriques à Extraire par Type d'Activité**:

#### A. NATATION
- ✅ De base: distance, durée, laps, FC moyenne/max
- ➕ À ajouter:
  - `strokeCount` ou `totalStrokes` → nombre de mouvements
  - `averageStrokeRate` → fréquence mouvement moyenne (strokes/min)
  - `averageSwolf` → SWOLF moyen
  - `poolLength` + calcul → nombre moyen mouvements/longueur
  - `pace` / `avgPace` → allure moyenne
  - `avgSpeed` / `maxSpeed` → vitesse moyenne/max
  - `activeTime` → temps de déplacement actif
  - `elapsedTime` → temps écoulé total
  - `caloriesResting` → calories au repos (exercice)
  - `caloriesActive` → calories actives (exercice)
  - `totalCalories` → calories totales
  - `intensityMinutesModerate` → minutes modérées
  - `intensityMinutesVigorous` → minutes soutenues
  - `totalIntensityMinutes` → total minutes intensives

#### B. CORDE À SAUTER / CARDIO (JumpJump Pro)
- ✅ De base: durée, sauts, FC moyenne/max
- ➕ À ajouter:
  - Données Connect IQ:
    - Chercher dans `activityDetailDTO` ou `activitySummaryDTO` pour champs Connect IQ
    - `jumps` → nombre de sauts (déjà présent)
    - `duration` → durée format mm:ss
    - `speed` ou `jumpsPerMinute` → vitesse sauts/min
    - `interruptions` → nombre interruptions
    - `maxContinuousJumps` → max sauts en continu
  - Métriques activité:
    - `caloriesResting` → calories au repos (exercice)
    - `caloriesActive` → calories actives (exercice)
    - `totalCalories` → calories totales
    - `sweatLoss` ou `estimatedSweatLoss` → transpiration (ml)
    - `intensityMinutesModerate` → minutes modérées
    - `intensityMinutesVigorous` → minutes soutenues (x2)
    - `totalIntensityMinutes` → total minutes intensives

#### C. CARDIO / AUTRES
- ➕ À ajouter (même structure que corde à sauter):
  - `caloriesResting`, `caloriesActive`, `totalCalories`
  - `sweatLoss`
  - `intensityMinutesModerate`, `intensityMinutesVigorous`, `totalIntensityMinutes`
  - Compter le nombre d'activités par jour

**Code à Modifier**: `garmin-server/fetch_garmin_data.py` lignes 156-210

---

### ÉTAPE 2: Récupérer Métriques Quotidiennes Complètes

**Objectif**: Récupérer TOUTES les métriques quotidiennes manquantes

**Actions**:

1. **Sommeil - Améliorer**
   - Utiliser `client.get_sleep_data(date)` (déjà fait mais vérifier complétude)
   - Extraire:
     - `sleepTimeSeconds` → durée totale
     - `sleepQuality` ou `sleepScore` → qualité
     - `deepSleepSeconds`, `lightSleepSeconds`, `remSleepSeconds` → phases
     - `bedTime`, `wakeTime` → heures coucher/lever

2. **Respiration - NOUVEAU**
   - Utiliser `client.get_respiration_data(date)` ou `client.get_respiration_values(date)`
   - Extraire:
     - Respirations éveillé: min, max, moyenne
     - Respirations sommeil: min, max, moyenne
   - Si pas de méthode directe, chercher dans:
     - `client.get_body_battery(date)` → peut contenir respiration
     - `client.get_stats(date)` → vérifier champs respiration

3. **Distance Quotidienne - Améliorer**
   - Vérifier pourquoi `stats.get('totalDistance')` retourne 0
   - Essayer plusieurs méthodes:
     - `client.get_steps_data(date)` → peut contenir distance
     - `client.get_daily_summary(date)` → si existe
     - Calculer depuis activités de la journée si stats retourne 0

4. **Calories Actives/Repos Quotidiennes - Améliorer**
   - Vérifier que `stats.get('activeKilocalories')` et `stats.get('bmrKilocalories')` sont corrects
   - Si 0, essayer:
     - `client.get_daily_summary(date)` → si existe
     - Somme des calories activités de la journée

5. **Intensité Minutes Quotidiennes - NOUVEAU**
   - Utiliser `client.get_intensity_minutes(date)` ou chercher dans `stats`
   - Extraire:
     - Minutes modérées
     - Minutes soutenues
     - Total minutes intensives

**Code à Modifier**: `garmin-server/fetch_garmin_data.py` lignes 212-320

---

### ÉTAPE 3: Gérer Connect IQ (JumpJump Pro)

**Objectif**: Récupérer les données des apps Connect IQ comme JumpJump Pro

**Problème**: Les données Connect IQ peuvent être dans:
- Les détails de l'activité (`get_activity()`)
- Dans un champ spécial comme `activityDetailDTO.measurements`
- Ou dans les métadonnées de l'activité

**Actions**:
1. Après avoir récupéré les détails de l'activité via `get_activity(activity_id)`:
   - Chercher dans `activityDetailDTO` ou `measurements` ou `splits`
   - Parser les champs custom qui peuvent contenir les données Connect IQ
   - Pour JumpJump Pro: chercher `jumps`, `interruptions`, `maxContinuousJumps`, `speed`

2. Si les données ne sont pas directement accessibles:
   - Ajouter des logs pour voir la structure complète de `get_activity()`
   - Identifier où sont stockées les données Connect IQ

**Code à Modifier**: Section activités dans `fetch_garmin_data.py`

---

### ÉTAPE 4: Normalisation et Structure des Données

**Objectif**: Créer une structure JSON complète avec TOUTES les métriques

**Structure JSON Cible**:

```json
{
  "activities": {
    "swimming": [{
      "id": 1234567890,
      "date": "2025-10-29",
      "time": "14:30",
      "duration": 3600,
      "distance": 1.5,
      "laps": 60,
      "avgHR": 145,
      "maxHR": 172,
      "calories": {
        "resting": 50,
        "active": 400,
        "total": 450
      },
      "intensityMinutes": {
        "moderate": 20,
        "vigorous": 40,
        "total": 60
      },
      "swimmingMetrics": {
        "strokeCount": 1200,
        "avgStrokeRate": 20,
        "avgSwolf": 35,
        "avgMovementsPerLap": 20,
        "avgPace": 140,
        "avgPaceMovement": 135,
        "bestPace": 130,
        "avgSpeed": 1.5,
        "avgSpeedMovement": 1.6,
        "maxSpeed": 2.0
      },
      "timeMetrics": {
        "totalTime": 3600,
        "activeTime": 3400,
        "elapsedTime": 3600
      },
      "source": "garmin"
    }],
    "jumprope": [{
      "id": 1234567891,
      "date": "2025-10-29",
      "time": "23:14",
      "duration": 653,
      "jumps": 1034,
      "avgHR": 160,
      "maxHR": 183,
      "calories": {
        "resting": 14,
        "active": 125,
        "total": 139
      },
      "sweatLoss": 65,
      "intensityMinutes": {
        "moderate": 1,
        "vigorous": 9,
        "total": 19
      },
      "connectIQ": {
        "jumps": 1034,
        "duration": "00:10:49",
        "speed": 95.59,
        "interruptions": 14,
        "maxContinuousJumps": 144
      },
      "source": "garmin"
    }],
    "cardio": [{
      // Structure similaire à jumprope
    }]
  },
  "dailyMetrics": {
    "2025-10-29": {
      "steps": 5306,
      "distance": 4.2,
      "floors": 12,
      "calories": {
        "total": 2902,
        "active": 924,
        "resting": 1978
      },
      "heartRate": {
        "resting": 59,
        "max": 183,
        "avg": 78,
        "timeSeries": [...]
      },
      "sleep": {
        "duration": 9.32,
        "quality": 85,
        "deepSleep": 1.5,
        "lightSleep": 6.0,
        "remSleep": 1.82,
        "bedTime": "23:15",
        "wakeTime": "06:45"
      },
      "respiration": {
        "awake": {
          "min": 11,
          "max": 22,
          "avg": 14
        },
        "sleep": {
          "min": 12,
          "max": 18,
          "avg": 15
        }
      },
      "intensityMinutes": {
        "moderate": 45,
        "vigorous": 20,
        "total": 65
      }
    }
  }
}
```

---

### ÉTAPE 5: Mise à Jour UI

**Objectif**: Afficher toutes les nouvelles métriques dans l'onglet Garmin

**Actions**:
1. Modifier `GraminTab.jsx` pour afficher:
   - Toutes les métriques natation détaillées
   - Toutes les métriques corde à sauter (y compris Connect IQ)
   - Respiration (éveillé/sommeil)
   - Intensité minutes quotidiennes et par activité
   - Transpiration
   - Calories actives/repos séparées partout

2. Améliorer les tableaux d'activités:
   - Ajouter colonnes pour toutes les nouvelles métriques
   - Organiser par type d'activité avec sections dédiées

---

## ORDRE D'EXÉCUTION RECOMMANDÉ

1. **Phase 1 - Récupération Activités Détaillées** (Priorité HAUTE)
   - Modifier `fetch_garmin_data.py` pour appeler `get_activity()` sur chaque activité
   - Parser toutes les métriques natation, corde à sauter, cardio
   - Tester avec une date connue (29/10/2025)

2. **Phase 2 - Métriques Quotidiennes** (Priorité HAUTE)
   - Ajouter récupération respiration
   - Améliorer sommeil
   - Corriger distance km/jour
   - Ajouter intensité minutes quotidiennes
   - Tester avec une date connue

3. **Phase 3 - Connect IQ** (Priorité MOYENNE)
   - Identifier où sont stockées les données Connect IQ
   - Parser JumpJump Pro
   - Tester avec une activité connue

4. **Phase 4 - UI** (Priorité MOYENNE)
   - Mettre à jour l'affichage
   - Tester l'affichage de toutes les métriques

---

## POINTS D'ATTENTION

1. **Performance**: `get_activity()` pour chaque activité peut être lent si beaucoup d'activités
   - Solution: Paralléliser les appels ou limiter à X activités par jour
   - Cache les résultats pour éviter appels redondants

2. **API Rate Limiting**: Garmin peut limiter le nombre d'appels
   - Solution: Ajouter retry avec backoff
   - Espacer les appels (sleep entre appels)

3. **Données Manquantes**: Certaines métriques peuvent ne pas être disponibles
   - Solution: Gérer gracieusement les valeurs None/null
   - Logger les métriques manquantes pour debug

4. **Structure API Variable**: Les structures peuvent changer selon le modèle de montre
   - Solution: Essayer plusieurs champs possibles
   - Normaliser dans le script Python

---

## VALIDATION

Pour valider chaque étape:
1. Synchroniser avec une date connue (29/10/2025)
2. Comparer avec les captures d'écran Garmin Connect
3. Vérifier que TOUTES les métriques sont présentes et correctes
4. Logger les métriques manquantes pour investigation

---

## PROCHAINES ACTIONS IMMÉDIATES

1. ✅ Analyser la structure complète de `get_activity()` en ajoutant des logs
2. ✅ Identifier les méthodes API pour respiration, intensité minutes
3. ✅ Implémenter récupération activités détaillées
4. ✅ Implémenter récupération métriques quotidiennes complètes
5. ✅ Tester avec date 29/10/2025 et comparer avec captures d'écran

---

**STATUT**: Prêt pour implémentation
**ESTIMATION**: 4-6 heures de développement + tests

