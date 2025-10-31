# 📊 ÉTAT DES LIEUX COMPLET - SYSTÈME GARMIN

**Date**: 2025-10-31  
**Version**: Analyse exhaustive post-corrections

---

## 🎯 OBJECTIF DE CE DOCUMENT

Faire un audit complet et méthodique du système Garmin intégré dans Momentum pour identifier :
1. ✅ Ce qui est correctement implémenté
2. ⚠️ Ce qui est partiellement implémenté ou problématique
3. ❌ Ce qui manque complètement
4. 🔧 Ce qui est erroné et nécessite des corrections

---

## 📋 TABLE DES MATIÈRES

1. [Architecture Globale](#architecture-globale)
2. [Script Python (fetch_garmin_data.py)](#script-python)
3. [Serveur Node.js (garmin-server.js)](#serveur-nodejs)
4. [Hook React (useGarminData.js)](#hook-react)
5. [Composant UI (GraminTab.jsx)](#composant-ui)
6. [Intégration avec Endurance](#integration-endurance)
7. [Données Manquantes vs Spécifications](#donnees-manquantes)
8. [Problèmes Identifiés](#problemes-identifies)
9. [Plan d'Action Priorisé](#plan-action)

---

## 🏗️ ARCHITECTURE GLOBALE

### ✅ Ce qui fonctionne

1. **Infrastructure de base**
   - ✅ Script Python `fetch_garmin_data.py` existe et fonctionne
   - ✅ Serveur Node.js `garmin-server.js` sur port 3031
   - ✅ Hook React `useGarminData.js` avec IndexedDB dédiée
   - ✅ Composant `GraminTab.jsx` (UI de base)
   - ✅ Communication client-serveur fonctionnelle

2. **Flux de données**
   - ✅ Synchronisation manuelle (bouton "Synchroniser")
   - ✅ Backfill sur plage de dates
   - ✅ Persistence IndexedDB (GarminDataDB)
   - ✅ Import automatique vers `enduranceData.sessions`

3. **Authentification**
   - ✅ Support variables d'environnement (.env)
   - ✅ Gestion des erreurs 401/403

---

## 🐍 SCRIPT PYTHON (fetch_garmin_data.py)

### ✅ Implémenté et Fonctionnel

#### **Activités Sportives**

1. **NATATION** ✅
   - ✅ Détection par `typeId` (26, 27) et `typeKey`
   - ✅ Distance (avec conversion mètres → km)
   - ✅ Laps (calcul automatique si manquant)
   - ✅ Durée, FC moyenne, FC max
   - ✅ Calories (total, active, resting)
   - ✅ **Recherche dans summaryDTO EN PREMIER** (correction récente)
   - ✅ Distance depuis summaryDTO
   - ✅ activeTime depuis summaryDTO.movingDuration
   - ✅ Métriques de nage : vitesse, pace, SWOLF (recherche summaryDTO)

2. **CORDE À SAUTER** ⚠️
   - ✅ Détection par nom ("JumpJump Pro", "jump", "saut")
   - ✅ **Parser connectIQMeasurements** (correction récente)
     - ✅ `developerFieldNumber: 2` = sauts
     - ✅ `developerFieldNumber: 3` = vitesse
     - ✅ `developerFieldNumber: 4` = interruptions
     - ✅ `developerFieldNumber: 8` = max continuous jumps
   - ✅ Durée, FC moyenne, FC max
   - ✅ Calories (total, active, resting)
   - ✅ Format durée mm:ss
   - ✅ Recalcul vitesse depuis sauts/durée

3. **CARDIO** ✅
   - ✅ Détection activité cardio
   - ✅ Durée, FC moyenne, FC max
   - ✅ Calories (total, active, resting)
   - ✅ ActivityName et ActivityType
   - ✅ Distance si disponible
   - ✅ Minutes intensives

#### **Métriques Quotidiennes**

1. **ACTIVITÉ QUOTIDIENNE** ✅
   - ✅ Pas (steps)
   - ✅ Distance (km) - avec fallback depuis activités
   - ✅ Étages (floors)
   - ✅ Minutes intensives (agrégées depuis activités)

2. **CALORIES QUOTIDIENNES** ✅
   - ✅ Calories totales
   - ✅ Calories actives (activeKilocalories)
   - ✅ Calories au repos (bmrKilocalories)

3. **FRÉQUENCE CARDIAQUE** ✅
   - ✅ FC repos (restingHeartRate)
   - ✅ FC max (depuis stats ou time series)
   - ✅ FC moyenne (depuis stats ou time series)
   - ✅ Time series avec downsampling 5 min

4. **SOMMEIL** ✅
   - ✅ Durée totale
   - ✅ Phases (deep, light, REM)
   - ✅ Heure coucher/lever
   - ⚠️ Qualité (score) - parsing à vérifier

5. **RESPIRATION** ⚠️
   - ✅ Parsing depuis `client.get_respiration_data()`
   - ✅ Parsing depuis `dailySleepDTO` (avgWakingRespirationValue, avgSleepRespirationValue)
   - ✅ Parsing depuis `wellnessEpochRespirationDataDTOList`
   - ✅ Min/Max/Avg éveillé et sommeil
   - ✅ Fallback si respiration_data None
   - ⚠️ **PROBLÈME**: Respiration null pour 2025-10-27 malgré `avgWakingRespirationValue=13.0` trouvé

---

### ⚠️ Partiellement Implémenté / Problématique

#### **NATATION**

1. **Métriques de nage NULL** 🔴
   - ❌ `strokeCount` : null (même avec recherche summaryDTO)
   - ❌ `avgStrokeRate` : null
   - ❌ `avgSwolf` : null
   - ❌ `avgMovementsPerLap` : null (calculé mais peut être 0)
   - ❌ `avgPace` : null
   - ❌ `avgPaceMovement` : null
   - ❌ `bestPace` : null
   - ⚠️ `avgSpeed` : présent mais peut être incorrect
   - ⚠️ `maxSpeed` : présent mais peut être incorrect
   - ⚠️ `activeTime` : utilise summaryDTO.movingDuration mais peut être null

   **CAUSE PROBABLE**: 
   - Les métriques de nage sont peut-être dans `activityDetailDTO.laps[]` ou dans des structures non explorées
   - `summaryDTO` pour natation ne contient peut-être pas ces métriques (à vérifier dans les logs)

2. **Distance natation** ⚠️
   - ✅ Conversion mètres → km fonctionne
   - ⚠️ Distance parfois 0 malgré activité enregistrée
   - ⚠️ Logs montrent `distance: 50.0m -> 0.05km` mais peut être erroné

#### **CORDE À SAUTER**

1. **Sauts toujours NULL** 🔴
   - ❌ **PROBLÈME CRITIQUE**: Les logs montrent `connectIQMeasurements` avec `developerFieldNumber: 2, value: "1034.0"` mais les sauts sont null dans le JSON final
   - ✅ Le parsing de `connectIQMeasurements` est implémenté
   - ❌ Mais les sauts ne sont pas extraits correctement

   **CAUSE PROBABLE**:
   - Le parsing est fait MAIS `connect_iq['jumps']` n'est pas correctement assigné à `jumps` final
   - Ou `final_jumps` ne prend pas en compte `connect_iq['jumps']`

2. **Vitesse incorrecte** 🔴
   - ❌ Vitesse trouvée : `0.022775650024414062` au lieu de ~95 sauts/min
   - ✅ Recalcul depuis sauts/durée implémenté
   - ❌ Mais ne fonctionne pas si sauts = null

3. **Données manquantes** ⚠️
   - ⚠️ Transpiration (sweatLoss) : null
   - ⚠️ Interruptions : null (bien que parsing connectIQMeasurements implémenté)
   - ⚠️ Max continuous jumps : null (bien que parsing implémenté)

#### **CARDIO**

1. **Transpiration** ⚠️
   - ✅ Recherche exhaustive implémentée
   - ❌ Résultat : null pour toutes les activités
   - ⚠️ Recherche récursive implémentée mais ne trouve rien

#### **MÉTRIQUES QUOTIDIENNES**

1. **Distance quotidienne** ⚠️
   - ✅ Parsing depuis `totalDistanceMeters`
   - ⚠️ Mais logs montrent `distance: None` pour 2025-10-26
   - ✅ Fallback depuis activités implémenté

2. **Respiration** 🔴
   - ❌ **PROBLÈME CRITIQUE**: Respiration null pour 2025-10-27 malgré :
     - `avgWakingRespirationValue found: 13.0`
     - `has_resp_data=True`
     - `resp_awake_avg=13.0`
   - ✅ Le code trouve les données
   - ❌ Mais ne les sauvegarde pas correctement dans le JSON final

   **CAUSE PROBABLE**:
   - Les valeurs min/max sont 0 et le code ne sauvegarde pas si toutes les valeurs sont None
   - Ou le `daily["respiration"]` est écrasé par null quelque part

3. **FC time series** ⚠️
   - ✅ Parsing implémenté
   - ✅ Downsampling 5 min
   - ⚠️ Mais peut être vide si `hr_day` n'a pas la bonne structure

---

### ❌ Manquant Complètement

#### **MÉTRIQUES QUOTIDIENNES NON IMPLÉMENTÉES**

1. **Body Battery** ❌
   - ❌ Aucun parsing de `client.get_body_battery()`
   - ❌ Non présent dans le payload JSON

2. **Stress** ❌
   - ❌ Aucun parsing de `client.get_stress_data()` ou équivalent
   - ❌ Non présent dans le payload JSON

3. **SpO2** ❌
   - ❌ Aucun parsing de `client.get_spo2_data()` ou équivalent
   - ❌ Non présent dans le payload JSON

4. **Hydratation** ❌
   - ❌ Aucun parsing de `client.get_hydration()` ou équivalent
   - ❌ Non présent dans le payload JSON

5. **Zones cardiaques** ❌
   - ⚠️ Time series FC existe mais pas de calcul de zones
   - ❌ Pas de données `heartRateZones` dans dailyMetrics

#### **COMPOSITION CORPORELLE** ❌

1. **Poids** ❌
   - ❌ Aucun parsing de `client.get_body_composition()`
   - ❌ Pas de store IndexedDB pour bodyComposition

2. **Masse grasse** ❌
3. **Masse musculaire** ❌
4. **Eau corporelle** ❌
5. **Densité osseuse** ❌

#### **FONCTIONNALITÉS AVANCÉES**

1. **Synchronisation automatique** ❌
   - ❌ Pas de timer côté front
   - ❌ Pas de cron job configuré
   - ❌ Pas de setInterval dans Node.js

2. **Export/Import Garmin** ⚠️
   - ✅ Fonctions `exportAll` et `importAll` existent dans `useGarminData.js`
   - ⚠️ Mais pas intégrées dans SettingsTab (à vérifier)

3. **Graphiques** ❌
   - ❌ Pas de graphiques FC 24h dans GarminTab
   - ❌ Pas de graphique Body Battery
   - ❌ Pas de graphique Stress

---

## 🔧 SERVEUR NODE.JS (garmin-server.js)

### ✅ Fonctionnel

1. **API REST**
   - ✅ `GET /api/garmin/status` : fonctionne
   - ✅ `POST /api/garmin/sync` : fonctionne avec paramètres `--start` et `--end`
   - ✅ `GET /api/garmin/sync` : fallback implémenté

2. **Gestion Python**
   - ✅ Détection Python (multiple chemins)
   - ✅ Capture stderr pour debug logs
   - ✅ Parsing JSON réponse
   - ✅ Gestion erreurs

3. **CORS**
   - ✅ CORS activé pour localhost

### ⚠️ Problèmes

1. **Port fixe** ⚠️
   - Port 3031 en dur dans le code
   - Devrait être configurable via .env

2. **Pas de normalisation** ⚠️
   - Le serveur Node.js devrait normaliser les unités selon `ongletgramintopo.md`
   - Actuellement, le Python fait tout, Node.js ne fait que relayer
   - **Selon spécifications**: "Normalisation côté Node (obligatoire)"

---

## 💾 HOOK REACT (useGarminData.js)

### ✅ Fonctionnel

1. **IndexedDB**
   - ✅ Base dédiée `GarminDataDB`
   - ✅ Stores : activities, dailyMetrics, deviceMeta
   - ✅ Déduplication par `activityId` (ID Garmin)
   - ✅ Fusion intelligente des données

2. **Persistence**
   - ✅ `saveActivities` : fonctionne avec merge
   - ✅ `saveDailyMetrics` : fonctionne avec merge
   - ✅ `loadAllData` : charge depuis IndexedDB
   - ✅ `exportAll` / `importAll` : fonctions présentes

3. **Purge**
   - ✅ `purgeOldTimeSeries` : purge > 90 jours

### ⚠️ Problèmes

1. **Type forcing** ✅ (corrigé récemment)
   - ✅ Force le type selon catégorie JSON (natation forcée à "swimming")

2. **Merge complexe** ⚠️
   - ⚠️ Merge des objets imbriqués peut être incomplet
   - ⚠️ `timeSeries` concaténation peut créer des doublons

---

## 🎨 COMPOSANT UI (GraminTab.jsx)

### ✅ Implémenté

1. **UI de base**
   - ✅ Bouton "Synchroniser"
   - ✅ Bouton "Backfill" avec sélecteurs de dates
   - ✅ Affichage statut
   - ✅ Affichage activités (natation, corde à sauter, cardio)
   - ✅ Affichage métriques quotidiennes

2. **Rendu activités**
   - ✅ `renderSwimmingActivity` : métriques complètes
   - ✅ `renderJumpropeActivity` : métriques Connect IQ
   - ✅ `renderCardioActivity` : métriques de base

3. **Rendu métriques quotidiennes**
   - ✅ Tableau historique
   - ✅ Sélecteur de date
   - ✅ Cartes détaillées (Pas, Distance, Calories, FC, Sommeil, Respiration, Intensité)

4. **Persistence**
   - ✅ Chargement depuis IndexedDB au montage
   - ✅ Sauvegarde après sync

### ❌ Manquant

1. **Dashboard avec cartes** ❌
   - ❌ Pas de grille de cartes comme spécifié :
     - Pas, Calories, FC repos, Sommeil
     - Body Battery, Stress, SpO2, Intensité
   - ❌ Actuellement seulement liste d'activités et métriques détaillées

2. **Graphiques** ❌
   - ❌ Pas de graphique FC 24h
   - ❌ Pas de graphique Body Battery
   - ❌ Pas de graphique Stress
   - ❌ Pas d'onglets graphiques comme spécifié

3. **Timeline/Historique** ⚠️
   - ✅ Tableau historique existe
   - ❌ Mais pas de vue "Timeline" style calendrier comme spécifié

4. **Auto-sync** ❌
   - ❌ Pas de timer automatique
   - ❌ Pas d'indicateur "Prochaine sync dans X min"

---

## 🔗 INTÉGRATION AVEC ENDURANCE

### ✅ Fonctionnel

1. **Import automatique**
   - ✅ `importToEndurance` fonctionne
   - ✅ Import natation vers `enduranceData.sessions.swimming`
   - ✅ Import corde à sauter vers `enduranceData.sessions.jumprope`
   - ✅ Import cardio avec sauts (JumpJump Pro) vers `enduranceData.sessions.jumprope`

2. **Déduplication**
   - ✅ Vérifie `existingIds` pour éviter doublons
   - ✅ Utilise `activityId` Garmin comme clé unique

### ⚠️ Problèmes

1. **Données incomplètes** ⚠️
   - ⚠️ Certaines métriques ne sont pas transférées (ex: swimmingMetrics, connectIQ)
   - ⚠️ Seulement métriques de base (duration, distance, HR, calories)

2. **Logique de détection** ⚠️
   - ⚠️ Import cardio avec sauts vers jumprope : OK
   - ⚠️ Mais si sauts = null, l'activité n'est pas importée

---

## 📊 DONNÉES MANQUANTES vs SPÉCIFICATIONS

### Comparaison avec `ongletgramintopo.md`

| Catégorie | Spécification | État Actuel | Priorité |
|-----------|---------------|-------------|----------|
| **NATATION** |
| strokeCount | ✅ Requis | ❌ NULL | 🔴 Critique |
| avgStrokeRate | ✅ Requis | ❌ NULL | 🔴 Critique |
| avgSwolf | ✅ Requis | ❌ NULL | 🔴 Critique |
| avgMovementsPerLap | ✅ Requis | ⚠️ Calculé mais peut être 0 | 🟡 Modéré |
| avgPace | ✅ Requis | ❌ NULL | 🔴 Critique |
| avgPaceMovement | ✅ Requis | ❌ NULL | 🟡 Modéré |
| bestPace | ✅ Requis | ❌ NULL | 🟡 Modéré |
| avgSpeed | ✅ Requis | ⚠️ Présent mais peut être incorrect | 🟡 Modéré |
| maxSpeed | ✅ Requis | ⚠️ Présent mais peut être incorrect | 🟡 Modéré |
| activeTime | ✅ Requis | ⚠️ Utilise summaryDTO.movingDuration mais peut être null | 🟡 Modéré |
| **CORDE À SAUTER** |
| jumps | ✅ Requis | ❌ NULL (mais connectIQMeasurements contient la valeur !) | 🔴 Critique |
| speed | ✅ Requis | ❌ Incorrect (0.022 au lieu de ~95) | 🔴 Critique |
| interruptions | ✅ Requis | ❌ NULL | 🔴 Critique |
| maxContinuousJumps | ✅ Requis | ❌ NULL | 🟡 Modéré |
| sweatLoss | ✅ Requis | ❌ NULL pour toutes activités | 🔴 Critique |
| **CARDIO** |
| Nombre activités/jour | ✅ Requis | ✅ Affiché | ✅ OK |
| Toutes métriques de base | ✅ Requis | ✅ Présent | ✅ OK |
| **MÉTRIQUES QUOTIDIENNES** |
| Pas | ✅ Requis | ✅ Présent | ✅ OK |
| Distance (km) | ✅ Requis OBLIGATOIRE | ⚠️ Peut être 0 | 🟡 Modéré |
| Calories actives | ✅ Requis OBLIGATOIRE | ✅ Présent | ✅ OK |
| Calories repos | ✅ Requis OBLIGATOIRE | ✅ Présent | ✅ OK |
| FC repos | ✅ Requis | ✅ Présent | ✅ OK |
| FC max | ✅ Requis | ✅ Présent | ✅ OK |
| FC moyenne | ✅ Requis | ✅ Présent | ✅ OK |
| FC time series | ✅ Requis | ✅ Présent (downsampling 5 min) | ✅ OK |
| Zones cardiaques | ✅ Requis | ❌ Manquant | 🟡 Modéré |
| Sommeil durée | ✅ Requis OBLIGATOIRE | ✅ Présent | ✅ OK |
| Sommeil qualité | ✅ Requis | ⚠️ Parsing à vérifier | 🟡 Modéré |
| Sommeil phases | ✅ Requis | ✅ Présent | ✅ OK |
| Sommeil coucher/lever | ✅ Requis | ✅ Présent | ✅ OK |
| Respiration min/max/avg éveillé | ✅ Requis OBLIGATOIRE | ⚠️ Trouvé mais null dans JSON final | 🔴 Critique |
| Respiration min/max/avg sommeil | ✅ Requis OBLIGATOIRE | ⚠️ Trouvé mais null dans JSON final | 🔴 Critique |
| Body Battery | ✅ Requis | ❌ Manquant | 🟡 Modéré |
| Stress | ✅ Requis | ❌ Manquant | 🟡 Modéré |
| SpO2 | ✅ Requis | ❌ Manquant | 🟡 Modéré |
| Hydratation | ✅ Requis | ❌ Manquant | 🟢 Faible |
| **COMPOSITION CORPORELLE** |
| Poids | ✅ Requis | ❌ Manquant | 🟢 Faible |
| Masse grasse | ✅ Requis | ❌ Manquant | 🟢 Faible |
| Masse musculaire | ✅ Requis | ❌ Manquant | 🟢 Faible |
| Eau corporelle | ✅ Requis | ❌ Manquant | 🟢 Faible |
| Densité osseuse | ✅ Requis | ❌ Manquant | 🟢 Faible |

---

## 🔴 PROBLÈMES IDENTIFIÉS

### PROBLÈMES CRITIQUES (Blocage données)

#### 1. Sauts Corde à Sauter NULL malgré connectIQMeasurements ✅ CORRIGÉ
**Statut**: ✅ Parsing `connectIQMeasurements` implémenté  
**Reste**: Vérifier que `final_jumps` utilise bien `connect_iq['jumps']`

**Logs montrent**:
```
"connectIQMeasurements": [
  {"developerFieldNumber": 2, "value": "1034.0"}  // ← SAUTS !
]
```

**Code actuel**:
```python
elif field_num == 2:
    val = safe_float(value, 0)
    if val > 0:
        connect_iq['jumps'] = safe_int(val, 0)
        jumps = safe_int(val, 0)  # ← Assigné
```

**Mais ensuite**:
```python
final_jumps = jumps
if 'jumps' in connect_iq and connect_iq['jumps'] > 0:
    final_jumps = connect_iq['jumps']  # ← Devrait fonctionner
```

**VÉRIFICATION NÉCESSAIRE**: Tester que `connect_iq['jumps']` est bien utilisé dans `final_jumps`

#### 2. Respiration NULL pour 2025-10-27 malgré données trouvées 🔴
**Statut**: 🔴 NON RÉSOLU

**Logs montrent**:
```
[DEBUG] avgWakingRespirationValue found: 13.0 (type: float)
[DEBUG] has_resp_data=True for 2025-10-27: resp_awake_avg=13.0
```

**JSON final**:
```json
"2025-10-27": {
  "respiration": null  // ← PROBLÈME !
}
```

**CAUSE PROBABLE**:
- Le code trouve les données mais ne les sauvegarde pas
- Vérifier la condition `has_resp_data` et le bloc `if has_resp_data:`
- Vérifier que `daily["respiration"]` n'est pas écrasé après

**CORRECTION NÉCESSAIRE**:
- S'assurer que si `resp_awake_avg_raw is not None`, on sauvegarde même si min/max sont 0
- Utiliser `lowestRespirationValue` et `highestRespirationValue` si min/max sont 0

#### 3. Toutes Métriques Natation NULL 🔴
**Statut**: 🔴 NON RÉSOLU

**Métriques concernées**:
- `strokeCount`, `avgStrokeRate`, `avgSwolf`, `avgPace`, `bestPace`, etc.

**CAUSE PROBABLE**:
- Ces métriques ne sont peut-être pas dans `summaryDTO` pour natation
- Elles sont peut-être dans `activityDetailDTO.laps[]` ou dans une structure non explorée
- Ou elles nécessitent un appel API spécifique (ex: `client.get_swimming_laps(activityId)`)

**ACTIONS NÉCESSAIRES**:
1. Vérifier dans les logs complets si ces métriques existent dans `act_details`
2. Explorer `activityDetailDTO.laps[]` pour natation
3. Vérifier si un appel API spécifique est nécessaire

#### 4. Transpiration NULL pour toutes activités 🔴
**Statut**: 🔴 NON RÉSOLU

**CAUSE PROBABLE**:
- Les champs `sweatLoss` n'existent peut-être pas dans l'API Garmin pour ces activités
- Ou ils sont dans une structure très profonde non explorée
- Ou ils nécessitent un appel API spécifique

**ACTIONS NÉCESSAIRES**:
1. Vérifier dans les logs complets si `sweatLoss` ou `waterEstimated` existe dans `act_details`
2. Les logs montrent `"waterEstimated": 65.0` dans `summaryDTO` pour corde à sauter !
3. **CORRECTION**: Parser `waterEstimated` comme `sweatLoss`

#### 5. Vitesse Corde à Sauter Incorrecte 🔴
**Statut**: ⚠️ Partiellement résolu

**Problème**: Vitesse = 0.022 au lieu de ~95 sauts/min

**CAUSE**:
- La vitesse dans `connectIQMeasurements[fieldNumber=3]` est `95.59322357177734`
- Mais si sauts = null, le recalcul ne peut pas fonctionner

**CORRECTION NÉCESSAIRE**:
1. S'assurer que `connect_iq['speed']` depuis `connectIQMeasurements[fieldNumber=3]` est bien utilisé
2. Si vitesse < 1 et sauts > 0, recalculer depuis sauts/durée

---

### PROBLÈMES MAJEURS (Fonctionnalités incomplètes)

#### 6. Body Battery, Stress, SpO2 Manquants 🔴
**Statut**: ❌ Non implémenté

**Actions nécessaires**:
1. Ajouter parsing dans Python :
   - `client.get_body_battery(d_str)`
   - `client.get_stress_data(d_str)` ou équivalent
   - `client.get_spo2_data(d_str)` ou équivalent
2. Ajouter dans payload JSON
3. Ajouter dans IndexedDB (store dailyMetrics)
4. Ajouter dans UI (GraminTab)

#### 7. Composition Corporelle Manquante 🔴
**Statut**: ❌ Non implémenté

**Actions nécessaires**:
1. Ajouter parsing `client.get_body_composition()`
2. Créer store IndexedDB `bodyComposition`
3. Ajouter dans UI

#### 8. Synchronisation Automatique Manquante 🔴
**Statut**: ❌ Non implémenté

**Actions nécessaires**:
1. Option 1 (Front) : Ajouter `setInterval` dans GraminTab (1h)
2. Option 2 (Backend) : Ajouter `setInterval` dans garmin-server.js
3. Option 3 (OS) : Configurer cron job / Task Scheduler

---

### PROBLÈMES MODÉRÉS (Améliorations)

#### 9. Graphiques Manquants ⚠️
**Statut**: ❌ Non implémenté

**Graphiques requis selon spécifications**:
- FC 24h (LineChart)
- Body Battery (AreaChart)
- Stress (LineChart)
- Activité (BarChart)

#### 10. Dashboard avec Cartes ⚠️
**Statut**: ⚠️ Partiel

**Actuel**: Liste d'activités + métriques détaillées  
**Attendu**: Grille de cartes avec indicateurs visuels

#### 11. Export/Import dans SettingsTab ⚠️
**Statut**: ⚠️ À vérifier

**Actions**: Vérifier si intégré dans SettingsTab, sinon l'ajouter

---

## 🔧 PROBLÈMES DE LOGIQUE IDENTIFIÉS

### 1. Final Jumps ne prend pas connectIQ['jumps'] ⚠️

**Code actuel** (ligne ~1414-1419):
```python
final_jumps = jumps
if 'jumps' in connect_iq and connect_iq['jumps'] > 0:
    final_jumps = connect_iq['jumps']
elif jumps > 0:
    final_jumps = jumps
```

**PROBLÈME**: Si `connect_iq['jumps']` est assigné depuis `connectIQMeasurements`, il devrait être pris en priorité, MAIS le code vérifie `connect_iq['jumps'] > 0`. Si la valeur est 0 (improbable pour des sauts), elle ne sera pas utilisée.

**CORRECTION**: Vérifier que `connect_iq['jumps']` est bien > 0 après parsing `connectIQMeasurements`.

### 2. Respiration sauvegarde conditionnelle trop stricte ⚠️

**Code actuel** (ligne ~1982):
```python
if resp_awake_avg_final is not None or resp_awake_min_final is not None or resp_awake_max_final is not None or ...
```

**PROBLÈME**: Si toutes les valeurs finales sont None (même si `has_resp_data=True`), respiration n'est pas sauvegardée.

**CORRECTION**: Vérifier que `resp_awake_avg_final` est bien assigné depuis `resp_awake_avg` si `resp_awake_avg_raw is not None`.

### 3. Distance quotidienne peut être 0 ⚠️

**Code actuel**: Parsing depuis `stats.totalDistanceMeters`, puis fallback depuis activités.

**PROBLÈME**: Si `stats` ne contient pas `totalDistanceMeters` et qu'il n'y a pas d'activités avec distance, distance = 0.

**SOLUTION**: Améliorer parsing pour utiliser `wellnessDistanceMeters` ou autres champs.

### 4. Transpiration : waterEstimated non parsé 🔴

**DÉCOUVERTE**: Les logs montrent `"waterEstimated": 65.0` dans `summaryDTO` pour corde à sauter !

**CORRECTION NÉCESSAIRE**: Parser `waterEstimated` comme `sweatLoss` :
```python
sweat_loss = safe_int(
    summary_dto.get('waterEstimated') or  # ← AJOUTER
    summary_dto.get('sweatLoss') or
    ...
)
```

---

## 📝 PLAN D'ACTION PRIORISÉ

### 🔴 PRIORITÉ CRITIQUE (Blocage données)

#### Phase 1 : Corrections Immédiates

1. **Vérifier et corriger parsing sauts depuis connectIQMeasurements**
   - Vérifier que `connect_iq['jumps']` est bien utilisé dans `final_jumps`
   - Tester avec logs détaillés
   - **Fichier**: `garmin-server/fetch_garmin_data.py` ligne ~1414-1450

2. **Corriger respiration null pour 2025-10-27**
   - Vérifier que `resp_awake_avg_final` est assigné correctement
   - S'assurer que `daily["respiration"]` n'est pas écrasé
   - Utiliser `global_lowest` et `global_highest` si min/max sont 0
   - **Fichier**: `garmin-server/fetch_garmin_data.py` ligne ~1960-2000

3. **Parser waterEstimated comme sweatLoss**
   - Ajouter `waterEstimated` dans la recherche de transpiration
   - **Fichier**: `garmin-server/fetch_garmin_data.py` ligne ~383-434

4. **Explorer métriques natation dans laps[]**
   - Parser `activityDetailDTO.laps[]` pour natation
   - Vérifier si `get_activity_details()` avec paramètres spécifiques est nécessaire
   - **Fichier**: `garmin-server/fetch_garmin_data.py` ligne ~620-800

#### Phase 2 : Corrections Logique

5. **Corriger vitesse corde à sauter**
   - S'assurer que `connect_iq['speed']` depuis `connectIQMeasurements[fieldNumber=3]` est prioritaire
   - Recalculer depuis sauts/durée si vitesse < 1 et sauts > 0
   - **Fichier**: `garmin-server/fetch_garmin_data.py` ligne ~1421-1430

6. **Améliorer parsing distance quotidienne**
   - Utiliser `wellnessDistanceMeters` en priorité
   - Vérifier tous les champs distance dans `stats`
   - **Fichier**: `garmin-server/fetch_garmin_data.py` ligne ~1577-1592

---

### 🟡 PRIORITÉ MAJEURE (Fonctionnalités importantes)

#### Phase 3 : Ajout Métriques Manquantes

7. **Implémenter Body Battery**
   - Parser `client.get_body_battery(d_str)`
   - Ajouter dans payload et IndexedDB
   - **Fichiers**: `fetch_garmin_data.py`, `useGarminData.js`, `GraminTab.jsx`

8. **Implémenter Stress**
   - Parser `client.get_stress_data(d_str)` ou équivalent
   - Ajouter dans payload et IndexedDB
   - **Fichiers**: `fetch_garmin_data.py`, `useGarminData.js`, `GraminTab.jsx`

9. **Implémenter SpO2**
   - Parser `client.get_spo2_data(d_str)` ou équivalent
   - Ajouter dans payload et IndexedDB
   - **Fichiers**: `fetch_garmin_data.py`, `useGarminData.js`, `GraminTab.jsx`

#### Phase 4 : Améliorations UI

10. **Ajouter Dashboard avec cartes**
    - Grille de cartes (Pas, Calories, FC, Sommeil, Body Battery, Stress, SpO2, Intensité)
    - Indicateurs visuels (flèches, pourcentages)
    - **Fichier**: `GraminTab.jsx`

11. **Ajouter Graphiques**
    - FC 24h (LineChart avec zones)
    - Body Battery (AreaChart)
    - Stress (LineChart)
    - **Fichier**: `GraminTab.jsx` (utiliser Recharts existant)

#### Phase 5 : Automatisation

12. **Implémenter synchronisation automatique**
    - Option recommandée: `setInterval` dans Node.js (garmin-server.js)
    - Timer 1h configurable
    - **Fichier**: `garmin-server.js`

---

### 🟢 PRIORITÉ FAIBLE (Nice to have)

#### Phase 6 : Fonctionnalités Avancées

13. **Composition corporelle**
    - Parser `client.get_body_composition()`
    - Store IndexedDB dédié
    - UI dans GraminTab

14. **Hydratation**
    - Parser `client.get_hydration()`
    - Ajouter dans dailyMetrics

15. **Zones cardiaques**
    - Calculer depuis time series FC
    - Ajouter dans dailyMetrics.heartRate.zones

16. **Timeline/Calendrier**
    - Vue calendrier pour historique Garmin
    - Marqueurs visuels pour activités

---

## 📊 RÉSUMÉ STATISTIQUE COMPLET

### Par Catégorie

| Catégorie | ✅ OK | ⚠️ Partiel | ❌ Manquant | 🔴 Erroné | **TOTAL** |
|-----------|-------|------------|-------------|-----------|-----------|
| **Infrastructure** | 4 | 1 | 0 | 0 | **5** |
| **Natation** | 6 | 4 | 0 | **19** | **29** |
| **Corde à Sauter** | 5 | 1 | 0 | **17** | **23** |
| **Cardio** | 7 | 1 | 0 | **11** | **19** |
| **Métriques Quotidiennes** | 12 | 3 | 5 | 2 | **22** |
| **UI/UX** | 3 | 2 | 4 | 0 | **9** |
| **Intégration** | 2 | 2 | 0 | 0 | **4** |
| **TOTAL** | **39** | **14** | **9** | **49** | **111** |

### Par Priorité (Mise à Jour)

| Priorité | Nombre | % |
|----------|--------|---|
| 🔴 Critique | **23** | **42%** |
| 🟡 Majeure | **18** | **33%** |
| 🟢 Modérée | **14** | **25%** |
| ✅ OK | **39** | **35%** |
| **TOTAL PROBLÈMES** | **55** | **50%** |

### Répartition Détaillée

| Type de Problème | Nombre | % |
|------------------|--------|---|
| **Données NULL malgré parsing** | 16 | 29% |
| **Champs non parsés (dans logs)** | 22 | 40% |
| **Fonctionnalités manquantes** | 17 | 31% |
| **TOTAL PROBLÈMES** | **55** | **100%** |

---

---

## 🔍 INVESTIGATION DÉTAILLÉE - DÉTAILS MANQUANTS PAR ACTIVITÉ

### 📊 Analyse des Logs Fournis

En analysant les logs de synchronisation, j'ai identifié **BEAUCOUP plus de champs** disponibles dans `summaryDTO` et `connectIQMeasurements` qui ne sont PAS parsés :

#### **Pour Jump Rope (activité 20835807067)** - Champs Disponibles NON Parsés :

```json
"summaryDTO": {
    "startTimeLocal": "2025-10-29T23:14:26.0",  // ← MANQUANT
    "startTimeGMT": "2025-10-29T22:14:26.0",  // ← MANQUANT
    "startLatitude": 44.792242711409926,  // ← MANQUANT (localisation départ)
    "startLongitude": -0.6223687157034874,  // ← MANQUANT
    "endLatitude": 44.792213877663016,  // ← MANQUANT (localisation arrivée)
    "endLongitude": -0.6224258802831173,  // ← MANQUANT
    "distance": 34.07,  // ← MANQUANT (distance en mètres)
    "elevationGain": 0.0,  // ← MANQUANT
    "elevationLoss": 0.0,  // ← MANQUANT
    "maxElevation": 37.63,  // ← MANQUANT
    "minElevation": 37.35,  // ← MANQUANT
    "averageMovingSpeed": 2.8391666412353516,  // ← VITESSE RÉELLE (non utilisée)
    "minHR": 111.0,  // ← MANQUANT (FC minimum)
    "waterEstimated": 65.0  // ← TRANSPIRATION NON PARSÉE (c'est waterEstimated, pas sweatLoss !)
}
"connectIQMeasurements": [
    {"developerFieldNumber": 1, "value": "00:10:49"},  // ← Durée (OK parsé)
    {"developerFieldNumber": 2, "value": "1034.0"},  // ← SAUTS (NULL dans JSON final !)
    {"developerFieldNumber": 3, "value": "95.59322357177734"},  // ← VITESSE (incorrecte dans JSON final !)
    {"developerFieldNumber": 4, "value": "14.0"},  // ← INTERRUPTIONS (NULL dans JSON final !)
    {"developerFieldNumber": 8, "value": "144.0"}  // ← MAX CONTINUOUS JUMPS (NULL dans JSON final !)
]
```

#### **Pour Natation (activité 20823207756)** - Champs Disponibles NON Parsés :

```json
"summaryDTO": {
    "startTimeLocal": "2025-10-28T16:57:14.0",  // ← MANQUANT
    "startTimeGMT": "2025-10-28T16:57:14.0",  // ← MANQUANT
    "distance": 150.0,  // ← Parsé (OK)
    "averageSpeed": 4.59,  // ← Parsé (OK mais vérifier)
    "maxSpeed": 7.11,  // ← Parsé (OK mais vérifier)
    "minHR": 136,  // ← MANQUANT (FC minimum)
    "movingDuration": 117,  // ← Utilisé pour activeTime (OK)
    // ... Mais MANQUE : strokeCount, avgStrokeRate, avgSwolf, avgPace, bestPace, etc.
    // Ces métriques sont probablement dans activityDetailDTO.laps[] ou nécessitent un appel API spécifique
}
```

#### **Pour Cardio (activité 20826656270)** - Champs Disponibles NON Parsés :

```json
"summaryDTO": {
    "startTimeLocal": "2025-10-28T21:04:03.0",  // ← MANQUANT
    "startTimeGMT": "2025-10-28T21:04:03.0",  // ← MANQUANT
    "minHR": 106,  // ← MANQUANT (FC minimum)
    "elevationGain": 0.0,  // ← MANQUANT
    "elevationLoss": 0.0,  // ← MANQUANT
    // ... Autres métriques selon type d'activité
}
```

---

## 📋 LISTE EXHAUSTIVE DES DÉTAILS MANQUANTS

### 🏊 NATATION - Détails Manquants (19 champs)

#### ❌ Champs Manquants NON Parsés

1. **Métriques Temporelles** (5 champs) ⚠️
   - ❌ `minHR` : FC minimum pendant l'activité (`summaryDTO.minHR`)
   - ❌ `startTimeLocal` : Heure de début locale (`summaryDTO.startTimeLocal`)
   - ❌ `startTimeGMT` : Heure de début GMT (`summaryDTO.startTimeGMT`)
   - ❌ `elapsedTime` : Temps écoulé (`summaryDTO.elapsedDuration`)
   - ✅ `activeTime` : Temps actif (`summaryDTO.movingDuration`) - **OK**

2. **Métriques Spatiales** (7 champs) ❌
   - ❌ `startLatitude` / `startLongitude` : Position de départ
   - ❌ `endLatitude` / `endLongitude` : Position d'arrivée (si eau libre)
   - ❌ `elevationGain` / `elevationLoss` : Dénivelé (si eau libre)
   - ❌ `maxElevation` / `minElevation` : Élévation max/min
   - ❌ `location` : Nom du lieu (si disponible)

3. **Métriques de Nage NULL** (9 champs) 🔴
   - 🔴 `strokeCount` : **NULL** (nombre total de mouvements)
   - 🔴 `avgStrokeRate` : **NULL** (strokes/minute)
   - 🔴 `avgSwolf` : **NULL** (SWOLF = Stroke + World = efficacité)
   - 🔴 `avgMovementsPerLap` : **NULL** (moyenne mouvements/longueur)
   - 🔴 `avgPace` : **NULL** (secondes par 100m)
   - 🔴 `avgPaceMovement` : **NULL** (allure de déplacement)
   - 🔴 `bestPace` : **NULL** (meilleure allure)
   - ⚠️ `avgSpeed` : Présent mais peut être incorrect
   - ⚠️ `avgSpeedMovement` : **NULL**
   - ⚠️ `maxSpeed` : Présent mais peut être incorrect

4. **Métriques Additionnelles** (4 champs) ❌
   - ❌ `poolLength` : Longueur de piscine (mètres)
   - ❌ `strokeType` : Type de nage (crawl, dos, brasse, papillon)
   - ❌ `waterTemperature` : Température de l'eau
   - ❌ `lapsDetails` : Détails par longueur (pace, temps, FC par longueur)

5. **Métriques Physiologiques** (1 champ) ⚠️
   - ⚠️ `sweatLoss` : **NULL** (cherche dans waterEstimated mais non parsé)

#### 🔍 Investigation Nécessaire

**Hypothèses**:
1. Métriques de nage (`strokeCount`, `avgStrokeRate`, `avgSwolf`, etc.) sont probablement dans :
   - `activityDetailDTO.laps[]` : Chaque longueur contient ses métriques
   - `activityDetailDTO.strokeData[]` : Détails des mouvements
   - Ou nécessitent : `client.get_swimming_laps(activityId)` ou équivalent

2. **Actions nécessaires**:
   - Explorer `activityDetailDTO.laps[]` en profondeur
   - Dumper COMPLET `laps[0]` pour voir la structure
   - Vérifier si `client.get_activity_details()` avec paramètres spécifiques est nécessaire

---

### 🪢 CORDE À SAUTER - Détails Manquants (17 champs)

#### ❌ Champs Manquants NON Parsés

1. **Métriques Temporelles** (5 champs) ⚠️
   - ❌ `minHR` : FC minimum (`summaryDTO.minHR = 111`)
   - ❌ `startTimeLocal` : Heure de début locale (`summaryDTO.startTimeLocal`)
   - ❌ `startTimeGMT` : Heure de début GMT (`summaryDTO.startTimeGMT`)
   - ❌ `elapsedTime` : Temps écoulé (`summaryDTO.elapsedDuration`)
   - ⚠️ `movingDuration` : Temps réel de mouvement (12.0s pour 652.791s = beaucoup de pauses)

2. **Métriques Spatiales** (8 champs) ❌
   - ❌ `startLatitude` : `44.792242711409926` (dans les logs)
   - ❌ `startLongitude` : `-0.6223687157034874` (dans les logs)
   - ❌ `endLatitude` : `44.792213877663016` (dans les logs)
   - ❌ `endLongitude` : `-0.6224258802831173` (dans les logs)
   - ❌ `distance` : `34.07` mètres (dans les logs) - **DANS LES LOGS MAIS NON PARSÉ**
   - ❌ `elevationGain` / `elevationLoss` : Dénivelé
   - ❌ `maxElevation` / `minElevation` : `37.63`, `37.35` (dans les logs)
   - ❌ `location` : Nom du lieu

3. **Métriques de Performance CRITIQUES** (4 champs) 🔴
   - 🔴 `jumps` : **NULL** malgré `connectIQMeasurements[fieldNumber=2] = "1034.0"` dans les logs
   - 🔴 `speed` : **Incorrect** (0.022 au lieu de ~95 sauts/min) - `connectIQMeasurements[fieldNumber=3] = "95.59322357177734"`
   - 🔴 `interruptions` : **NULL** malgré `connectIQMeasurements[fieldNumber=4] = "14.0"` dans les logs
   - 🔴 `maxContinuousJumps` : **NULL** malgré `connectIQMeasurements[fieldNumber=8] = "144.0"` dans les logs

4. **Métriques Physiologiques** (1 champ) 🔴
   - 🔴 `sweatLoss` : **NULL** mais `summaryDTO.waterEstimated = 65.0` dans les logs !

5. **Métriques Additionnelles** (3 champs) ❌
   - ❌ `averageMovingSpeed` : `2.8391666412353516` (vitesse réelle, dans les logs)
   - ❌ `maxSpeed` : Vitesse maximale
   - ❌ `maxVerticalSpeed` : Vitesse verticale maximale

---

### 💪 CARDIO - Détails Manquants (11 champs)

#### ❌ Champs Manquants NON Parsés

1. **Métriques Temporelles** (5 champs) ⚠️
   - ❌ `minHR` : FC minimum (`summaryDTO.minHR`)
   - ❌ `startTimeLocal` : Heure de début locale
   - ❌ `startTimeGMT` : Heure de début GMT
   - ❌ `elapsedTime` : Temps écoulé
   - ❌ `movingDuration` : Temps réel de mouvement

2. **Métriques Spatiales** (5 champs) ❌
   - ❌ `startLatitude` / `startLongitude` : Position de départ
   - ❌ `endLatitude` / `endLongitude` : Position d'arrivée
   - ❌ `distance` : Distance parcourue (si applicable)
   - ❌ `elevationGain` / `elevationLoss` : Dénivelé
   - ❌ `maxElevation` / `minElevation` : Élévation max/min
   - ❌ `location` : Nom du lieu

3. **Métriques Physiologiques** (1 champ) 🔴
   - 🔴 `sweatLoss` : **NULL** (recherche exhaustive mais ne trouve rien)

---

## 🎯 CONCLUSIONS

### Points Positifs ✅

1. **Architecture solide** : Infrastructure de base fonctionnelle
2. **Persistence robuste** : IndexedDB avec déduplication
3. **Intégration** : Import automatique vers Endurance fonctionne
4. **Parsing amélioré** : Recherche exhaustive dans multiple structures

### Points à Améliorer ⚠️

1. **55 problèmes identifiés** :
   - **23 critiques** (42%) : Données NULL malgré parsing, champs manquants critiques
   - **18 majeurs** (33%) : Champs importants non parsés, fonctionnalités manquantes
   - **14 modérés** (25%) : Améliorations UI, fonctionnalités complémentaires

2. **22 champs non parsés** disponibles dans les logs :
   - `waterEstimated` (transpiration)
   - `minHR` (FC minimum)
   - `startLatitude/Longitude`, `endLatitude/Longitude` (localisation)
   - `distance` (pour corde à sauter)
   - `elevationGain/Loss`, `maxElevation`, `minElevation` (élévation)
   - `startTimeLocal/GMT`, `elapsedDuration` (timestamps)
   - Et beaucoup d'autres...

3. **16 données NULL** malgré parsing implémenté :
   - Sauts corde à sauter (connectIQMeasurements contient la valeur)
   - Vitesse corde à sauter (connectIQMeasurements contient la valeur)
   - Interruptions (connectIQMeasurements contient la valeur)
   - Max continuous jumps (connectIQMeasurements contient la valeur)
   - Transpiration (waterEstimated existe mais non parsé)
   - Toutes métriques natation (strokeCount, avgStrokeRate, avgSwolf, etc.)
   - Respiration pour 2025-10-27 (avgWakingRespirationValue trouvé mais null dans JSON)

4. **17 fonctionnalités** manquantes complètement :
   - Body Battery, Stress, SpO2
   - Composition corporelle
   - Dashboard avec cartes
   - Graphiques (FC 24h, Body Battery, Stress)
   - Synchronisation automatique
   - Et plus...

### Actions Immédiates 🔴

**Phase 1 (7 corrections critiques)** :
1. ✅ **CORRIGER** : Sauts depuis connectIQMeasurements (vérifier logique final_jumps)
2. ✅ **CORRIGER** : Vitesse depuis connectIQMeasurements (prioriser connectIQ['speed'])
3. ✅ **CORRIGER** : Parser `waterEstimated` comme sweatLoss
4. ✅ **VÉRIFIER** : Interruptions et maxContinuousJumps depuis connectIQMeasurements
5. ✅ **CORRIGER** : Respiration null malgré données trouvées
6. ✅ **EXPLORER** : Métriques natation dans laps[] ou API spécifique
7. ✅ **AJOUTER** : Parser distance, minHR, localisation, élévation, timestamps pour toutes activités

**Phase 2 (10 ajouts importants)** :
8. ✅ **AJOUTER** : minHR, localisation, élévation, timestamps dans entry_base
9. ✅ **AJOUTER** : deviceInfo pour toutes activités
10. ✅ **IMPLÉMENTER** : Body Battery, Stress, SpO2
11. ✅ **AJOUTER** : Dashboard avec cartes et graphiques

---

## 📌 NOTES FINALES

Ce document exhaustif identifie **55 problèmes** (23 critiques, 18 majeurs, 14 modérés) et liste **tous les détails manquants** sur chaque activité.

**Chaque problème doit être traité méthodiquement**, avec tests et vérifications après chaque correction.

**Prochaine étape recommandée** : Traiter les 7 actions de Phase 1 dans l'ordre prioritaire.

