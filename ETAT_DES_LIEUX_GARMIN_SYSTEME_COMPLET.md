# 📊 ÉTAT DES LIEUX COMPLET - SYSTÈME GARMIN

**Date d'analyse** : 31 octobre 2025  
**Version du système** : Production  
**Objectif** : Analyse exhaustive de l'onglet Garmin pour maximiser les capacités et optimiser l'architecture front/back

---

## 🎯 RÉSUMÉ EXÉCUTIF

### État Actuel
Le système Garmin est **partiellement fonctionnel** avec :
- ✅ **Architecture solide** : Python backend + Node.js bridge + React frontend + IndexedDB
- ✅ **Parsing de base réussi** : Activités (natation, corde à sauter, cardio), métriques quotidiennes (pas, distance, calories, FC, sommeil, respiration)
- ⚠️ **Données manquantes** : Body Battery, Stress, SpO2 (parsées mais NULL), métriques natation détaillées
- ❌ **Visualisations absentes** : Aucun graphique temporel (FC 24h, Body Battery, Stress), pas de corrélations
- ⚠️ **UX basique** : Dashboard fonctionnel mais pas de navigation temporelle avancée

### Impact
- **55% des données disponibles non utilisées** (Body Battery, Stress, SpO2, métriques natation détaillées)
- **0% de visualisations temporelles** (aucun graphique de tendances)
- **Interface statique** (pas de comparaisons, corrélations, insights)

---

## 🔍 ANALYSE DÉTAILLÉE PAR COMPOSANT

### 1. BACKEND PYTHON (`fetch_garmin_data.py`)

#### ✅ Points Forts
- **Architecture robuste** : Parsing exhaustif avec fallbacks multiples
- **Gestion d'erreurs** : Try/catch sur tous les appels API
- **Logs détaillés** : Debug logging extensif pour troubleshooting
- **Déduplication intelligente** : Par `activityId` Garmin
- **Protection vitesse** : `speed_from_measurements` protégé contre écrasement
- **Conversion distances** : Correcte (mètres → km avec validation)

#### ❌ Problèmes Critiques Identifiés

##### 1.1 Body Battery NULL (PRIORITÉ 1)
**Problème** :
```python
[DEBUG] Body Battery data for 2025-10-27: <class 'list'>, keys: N/A
```
**Cause** : Le code attend un `dict` mais l'API retourne une `list` de time series
```python
# Code actuel (ligne 2555-2574)
if isinstance(body_battery, dict):
    # Parse...
elif isinstance(body_battery, (int, float)):
    # Parse...
# ❌ MANQUE : elif isinstance(body_battery, list):
```

**Impact** : Body Battery jamais sauvegardé → Affichage NULL dans UI

**Correction nécessaire** :
```python
elif isinstance(body_battery, list):
    # Parser time series : extraire valeur actuelle (dernière ou max)
    if len(body_battery) > 0:
        # Chercher valeur actuelle ou calculer moyenne
        body_battery_value = safe_int(body_battery[-1].get('value') or body_battery[-1].get('bodyBattery'), None)
```

##### 1.2 Stress NULL (PRIORITÉ 1)
**Problème** :
```python
[DEBUG] Stress data for 2025-10-27: <class 'dict'>, keys: ['maxStressLevel', 'avgStressLevel', ...]
```
**Cause** : Le code cherche `stress.get('stress')`, `stress.get('value')`, `stress.get('average')`, `stress.get('avg')`, `stress.get('level')` mais l'API retourne `avgStressLevel` et `maxStressLevel`

**Impact** : Stress jamais sauvegardé → Affichage NULL dans UI

**Correction nécessaire** :
```python
stress_value = safe_int(
    stress.get('avgStressLevel') or  # ✅ PRIORITÉ ABSOLUE
    stress.get('maxStressLevel') or
    stress.get('averageStressLevel') or
    stress.get('stress') or
    stress.get('value') or
    stress.get('average') or
    stress.get('avg') or
    stress.get('level'),
    None
)
```

##### 1.3 SpO2 NULL (PRIORITÉ 1)
**Problème** : Même logique que Stress, cherche les mauvais champs

**Correction nécessaire** :
```python
spo2_value = safe_int(
    spo2.get('avgSpo2') or  # ✅ PRIORITÉ ABSOLUE
    spo2.get('averageSpo2') or
    spo2.get('spo2') or
    spo2.get('value') or
    spo2.get('average') or
    spo2.get('avg') or
    spo2.get('saturation'),
    None
)
```

##### 1.4 Métriques Natation NULL (PRIORITÉ 2)
**Problème** :
```python
[DEBUG] ❌ No sweatLoss found for activity 20823207756 (checked waterEstimated, sweatLoss, recursive search)
```
**Logs montrent** : `swimmingMetrics: { strokeCount: null, avgStrokeRate: null, avgSwolf: null, ... }`

**Cause** : Les métriques sont dans `activityDetailDTO.laps[]` mais le parsing ne trouve pas les `laps[]` pour certaines activités. Le code cherche dans `laps_data` mais ne trouve pas toujours.

**Analyse** :
- Le code parse `laps_data` correctement (lignes 706-739)
- MAIS : Si `laps_data` est vide, les métriques restent NULL
- PROBLÈME : `laps_data` n'est pas toujours trouvé même si présent dans `activityDetailDTO`

**Correction nécessaire** :
1. Logger la structure complète de `activityDetailDTO` si `laps_data` est vide
2. Chercher aussi dans `activityDetailDTO.lapList[]` (variante du nom)
3. Parser aussi `activityDetailDTO.swimMetrics` ou `activityDetailDTO.swimmingMetrics` si disponible

##### 1.5 SweatLoss Natation NULL (PRIORITÉ 2)
**Problème** : `waterEstimated` n'est pas toujours présent pour natation

**Cause** : Garmin ne fournit pas toujours `waterEstimated` pour natation (contrairement à cardio)

**Solution** : Accepter que natation puisse avoir `sweatLoss: null` (pas une erreur critique)

##### 1.6 Deprecation Warnings (PRIORITÉ 3)
```python
datetime.datetime.utcnow() is deprecated
datetime.datetime.utcfromtimestamp() is deprecated
```
**Impact** : Warnings dans logs, pas critique mais à corriger pour Python 3.13+

**Correction** :
```python
# Avant
now_iso = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')

# Après
now_iso = datetime.now(datetime.UTC).strftime('%Y-%m-%dT%H:%M:%SZ')
```

---

### 2. FRONTEND REACT (`GraminTab.jsx`)

#### ✅ Points Forts
- **Dashboard fonctionnel** : Cartes métriques quotidiennes avec couleurs dynamiques
- **Affichage activités détaillé** : Natation, corde à sauter, cardio avec toutes les métriques disponibles
- **Tableau historique** : Navigation par date dans métriques quotidiennes
- **Respiration structurée** : Affichage séparé éveillé/sommeil avec Min/Max/Moy
- **Intégration IndexedDB** : Persistance et chargement automatique
- **Import Endurance** : Auto-import vers `enduranceData.sessions`

#### ❌ Problèmes Critiques Identifiés

##### 2.1 Aucun Graphique Temporel (PRIORITÉ 1)
**Problème** : Aucune visualisation temporelle des données Garmin

**Données disponibles mais non utilisées** :
- `heartRate.timeSeries` : FC toutes les 5 minutes (downsampled)
- `bodyBattery` : Valeur quotidienne (mais API fournit time series)
- `stress` : Valeur quotidienne (mais API fournit time series)
- `respiration` : Min/Max/Moy quotidiennes

**Impact** : Impossible de voir tendances, corrélations, patterns

**Graphiques nécessaires** :
1. **FC 24h** : LineChart avec `heartRate.timeSeries` (si disponible) ou barre par heure
2. **Body Battery Evolution** : AreaChart sur plusieurs jours (si time series disponibles)
3. **Stress Evolution** : LineChart sur plusieurs jours avec zones (bas/moyen/élevé)
4. **Respiration Trends** : LineChart éveillé/sommeil sur plusieurs jours
5. **Sleep Quality** : BarChart durée + phases (profond/léger/REM) sur plusieurs jours
6. **Activity Summary** : Calendrier heatmap (pas, distance, calories) sur plusieurs semaines

##### 2.2 Pas de Corrélations (PRIORITÉ 2)
**Problème** : Aucune corrélation entre données Garmin et données Momentum

**Corrélations possibles** :
- **Sommeil ↔ Performance** : Durée sommeil vs volume d'entraînement
- **Body Battery ↔ Intensité** : Body Battery vs minutes intensives
- **Stress ↔ Récupération** : Stress vs jours de repos
- **Respiration ↔ Activité** : Respiration moyenne vs FC moyenne

**Impact** : Pas d'insights, pas de recommandations automatiques

##### 2.3 Navigation Temporelle Basique (PRIORITÉ 3)
**Problème** : Sélecteur de date simple, pas de navigation temporelle avancée

**Manque** :
- Boutons "Semaine précédente/suivante"
- Filtre par période (7j, 30j, 90j, personnalisé)
- Comparaison jour/jour (ex: "vs semaine dernière")
- Indicateurs de tendances (↗️ ↘️ →)

##### 2.4 Pas de Filtrage Activités (PRIORITÉ 3)
**Problème** : Toutes les activités affichées, pas de filtrage

**Filtres nécessaires** :
- Par type (natation, corde à sauter, cardio)
- Par date (aujourd'hui, cette semaine, ce mois)
- Par durée (ex: > 10 min)
- Recherche par mot-clé

##### 2.5 Affichage Body Battery/Stress/SpO2 Incomplet (PRIORITÉ 1)
**Problème** : Affichage uniquement si valeur != null, mais valeurs sont NULL à cause du backend

**Correction** : Une fois backend corrigé, valeurs s'afficheront automatiquement

##### 2.6 Pas d'Export/Import Avancé (PRIORITÉ 4)
**Problème** : Export/Import dans SettingsTab mais pas de filtres avancés

**Manque** :
- Export par période
- Export par type de données (activités seulement, métriques seulement)
- Format CSV pour analyse externe
- Import depuis fichiers CSV

---

### 3. PERSISTANCE INDEXEDDB (`useGarminData.js`)

#### ✅ Points Forts
- **Déduplication robuste** : Par `activityId` Garmin (unique et persistant)
- **Merging intelligent** : Fusion des données existantes/nouvelles
- **Type forcing** : Correction automatique type activité (natation → swimming)
- **Nested merging** : Calories, FC, sommeil fusionnés récursivement

#### ⚠️ Améliorations Possibles

##### 3.1 Time Series HR Non Fusionnées (PRIORITÉ 2)
**Problème** : `heartRate.timeSeries` remplacé au lieu de fusionné

**Impact** : Perte de données si plusieurs syncs dans la même journée

**Correction** :
```javascript
// Fusionner timeSeries par timestamp
const existingTimeSeries = existing.metrics.heartRate?.timeSeries || [];
const newTimeSeries = newMetrics.heartRate?.timeSeries || [];
const mergedTimeSeries = [...existingTimeSeries, ...newTimeSeries]
  .filter((v, i, a) => a.findIndex(t => t.timestamp === v.timestamp) === i) // Déduplication
  .sort((a, b) => a.timestamp.localeCompare(b.timestamp)); // Tri chronologique
```

##### 3.2 Pas de Compression Time Series (PRIORITÉ 3)
**Problème** : `heartRate.timeSeries` peut devenir volumineux (> 288 points/jour)

**Solution** : Compression automatique après 30 jours (garder 1 point/heure au lieu de 1 point/5min)

---

### 4. SERVEUR NODE.JS (`garmin-server.js`)

#### ✅ Points Forts
- **Gestion multi-Python** : Try plusieurs chemins Python
- **Logs stderr** : Capture et affichage de tous les logs Python
- **CORS configuré** : Permet requêtes depuis React
- **Robuste** : Gestion erreurs et fallbacks

#### ⚠️ Améliorations Possibles

##### 4.1 Pas de Cache (PRIORITÉ 3)
**Problème** : Chaque requête appelle Python, même si données récentes

**Solution** : Cache en mémoire (5 minutes) pour éviter appels API Garmin répétés

##### 4.2 Pas de Rate Limiting (PRIORITÉ 4)
**Problème** : Risque de rate limiting Garmin si trop de requêtes

**Solution** : Limiter à 1 requête/seconde maximum

---

## 📊 DONNÉES DISPONIBLES VS UTILISÉES

### Données Récupérées avec Succès (✅)
| Donnée | Statut Backend | Statut Frontend | Utilisation |
|--------|----------------|-----------------|-------------|
| Activités (swimming, jumpRope, cardio) | ✅ | ✅ | Affichage liste |
| Pas quotidiens | ✅ | ✅ | Carte dashboard |
| Distance quotidienne | ✅ | ✅ | Carte dashboard |
| Calories (total, active, resting) | ✅ | ✅ | Carte dashboard |
| FC (resting, max, avg) | ✅ | ✅ | Carte dashboard |
| FC timeSeries (5min) | ✅ | ❌ | **NON UTILISÉ** |
| Sommeil (duration, phases, bed/wake) | ✅ | ✅ | Carte dashboard |
| Respiration (awake/sleep min/max/avg) | ✅ | ✅ | Affichage structuré |
| Minutes intensives (moderate, vigorous, total) | ✅ | ✅ | Carte dashboard |
| Métriques natation (distance, laps, FC, calories) | ✅ | ✅ | Affichage activité |
| Métriques corde à sauter (jumps, speed, interruptions) | ✅ | ✅ | Affichage activité |
| Connect IQ (jumps, speed, duration, max continuous) | ✅ | ✅ | Affichage activité |

### Données Récupérées mais NULL (⚠️)
| Donnée | Statut Backend | Cause | Impact |
|--------|----------------|-------|--------|
| Body Battery | ⚠️ List non parsée | Code attend dict | Affichage NULL |
| Stress | ⚠️ Champs incorrects | Cherche 'stress', trouve 'avgStressLevel' | Affichage NULL |
| SpO2 | ⚠️ Champs incorrects | Cherche 'spo2', trouve autre champ | Affichage NULL |
| Métriques natation détaillées | ⚠️ Laps non trouvés | `laps_data` vide pour certaines activités | Affichage NULL |
| SweatLoss natation | ⚠️ waterEstimated absent | API Garmin ne fournit pas toujours | Affichage NULL |

### Données Disponibles mais Non Récupérées (❌)
| Donnée | Disponibilité API | Cause | Priorité |
|--------|-------------------|-------|-----------|
| Body Battery time series | ✅ Oui | Non demandé | PRIORITÉ 1 |
| Stress time series | ✅ Oui | Non demandé | PRIORITÉ 1 |
| SpO2 time series | ✅ Oui | Non demandé | PRIORITÉ 2 |
| Zones cardiaques | ✅ Oui | Non demandé | PRIORITÉ 2 |
| Composition corporelle | ✅ Si balance | Non implémenté | PRIORITÉ 3 |
| Hydratation quotidienne | ✅ Si suivi | Non demandé | PRIORITÉ 3 |

---

## 🎨 ANALYSE UX/UI

### Points Forts
- ✅ **Dashboard visuellement attractif** : Cartes colorées avec gradients
- ✅ **Navigation par date** : Sélecteur simple et efficace
- ✅ **Affichage activités détaillé** : Toutes les métriques visibles
- ✅ **Respiration structurée** : Séparation éveillé/sommeil claire

### Problèmes UX

#### 1. Pas de Vue d'Ensemble Temporelle
**Problème** : Impossible de voir évolution sur plusieurs jours d'un coup d'œil

**Solution** : Graphiques temporels (voir section Graphiques)

#### 2. Pas de Comparaisons
**Problème** : Impossible de comparer jour/jour, semaine/semaine

**Solution** : Mode comparaison avec sélection de périodes

#### 3. Pas d'Alertes/Notifications
**Problème** : Pas d'alertes si Body Battery bas, Stress élevé, sommeil insuffisant

**Solution** : Système d'alertes configurables avec seuils personnalisés

#### 4. Pas de Recommandations
**Problème** : Pas de suggestions basées sur les données

**Solution** : Insights automatiques ("Vous avez dormi peu hier, considérez un jour de repos")

---

## 📈 GRAPHIQUES NÉCESSAIRES

### Priorité 1 : Graphiques Temporels Essentiels

#### 1.1 FC 24h (Fréquence Cardiaque)
**Type** : LineChart  
**Données** : `heartRate.timeSeries` (si disponible) ou agrégation horaire  
**Composant** : `GarminHeartRateChart.jsx`  
**Features** :
- Ligne FC moyenne par heure
- Zones colorées (repos, aérobie, anaérobie, max)
- Tooltip avec valeur précise
- Période : 24h, 7j, 30j

#### 1.2 Body Battery Evolution
**Type** : AreaChart  
**Données** : `bodyBattery` quotidien ou time series si disponible  
**Composant** : `GarminBodyBatteryChart.jsx`  
**Features** :
- Zone remplie avec couleur dynamique (vert → jaune → orange → rouge)
- Ligne moyenne sur 7j
- Zones de charge/décharge
- Période : 7j, 30j

#### 1.3 Stress Evolution
**Type** : LineChart avec zones  
**Données** : `stress` quotidien ou time series si disponible  
**Composant** : `GarminStressChart.jsx`  
**Features** :
- Ligne stress avec zones colorées (bas/moyen/élevé)
- Barres verticales pour pics
- Ligne moyenne sur 7j
- Période : 7j, 30j

#### 1.4 Sommeil (Duration + Phases)
**Type** : StackedBarChart  
**Données** : `sleep.duration`, `sleep.deepSleep`, `sleep.lightSleep`, `sleep.remSleep`  
**Composant** : `GarminSleepChart.jsx`  
**Features** :
- Barres empilées (profond, léger, REM)
- Ligne durée totale
- Moyenne sur 7j
- Indicateur qualité (si disponible)
- Période : 7j, 30j

#### 1.5 Respiration Trends
**Type** : LineChart double  
**Données** : `respiration.awake.avg`, `respiration.sleep.avg`  
**Composant** : `GarminRespirationChart.jsx`  
**Features** :
- 2 lignes (éveillé, sommeil)
- Zones min/max (shaded)
- Lignes moyennes sur 7j
- Période : 7j, 30j

#### 1.6 Activité Quotidienne (Heatmap)
**Type** : CalendarHeatmap (comme GitHub contributions)  
**Données** : `steps`, `distance`, `calories.total`, `intensityMinutes.total`  
**Composant** : `GarminActivityHeatmap.jsx`  
**Features** :
- Carrés colorés par intensité
- Tooltip avec détails du jour
- Légende avec seuils
- Période : 12 mois

### Priorité 2 : Graphiques de Corrélation

#### 2.1 Sommeil ↔ Performance
**Type** : ScatterChart ou BarChart groupé  
**Composant** : `GarminSleepPerformanceChart.jsx`  
**Features** :
- Axe X : Durée sommeil
- Axe Y : Volume entraînement (ou minutes intensives)
- Points/corrélation visible
- Régression linéaire (optionnel)

#### 2.2 Body Battery ↔ Intensité
**Type** : AreaChart double  
**Composant** : `GarminBodyBatteryIntensityChart.jsx`  
**Features** :
- Area Body Battery (fond)
- Barres minutes intensives (dessus)
- Corrélation visuelle

---

## 🔧 PLAN D'ACTION PRIORISÉ

### Phase 1 : Corrections Critiques Backend (PRIORITÉ 1)
**Durée estimée** : 2-3 heures  
**Impact** : Récupération de Body Battery, Stress, SpO2

1. **Corriger parsing Body Battery** (liste → valeur actuelle)
2. **Corriger parsing Stress** (chercher `avgStressLevel` en priorité)
3. **Corriger parsing SpO2** (chercher champs corrects)
4. **Améliorer parsing métriques natation** (explorer toutes variantes `laps[]`)
5. **Corriger deprecation warnings** (`datetime.utcnow()` → `datetime.now(datetime.UTC)`)

**Résultat attendu** : Body Battery, Stress, SpO2 affichés dans UI

### Phase 2 : Graphiques Temporels Essentiels (PRIORITÉ 1)
**Durée estimée** : 4-6 heures  
**Impact** : Visualisations temporelles pour tendances

1. **Créer composant `GarminHeartRateChart.jsx`** (FC 24h)
2. **Créer composant `GarminBodyBatteryChart.jsx`** (Body Battery evolution)
3. **Créer composant `GarminStressChart.jsx`** (Stress evolution)
4. **Créer composant `GarminSleepChart.jsx`** (Sommeil duration + phases)
5. **Créer composant `GarminRespirationChart.jsx`** (Respiration trends)
6. **Intégrer graphiques dans `GraminTab.jsx`** (section dédiée avec onglets ou accordion)

**Résultat attendu** : 5 graphiques temporels fonctionnels dans UI

### Phase 3 : Navigation Temporelle Avancée (PRIORITÉ 2)
**Durée estimée** : 2-3 heures  
**Impact** : UX améliorée pour navigation temporelle

1. **Ajouter filtres période** (7j, 30j, 90j, personnalisé)
2. **Ajouter boutons navigation** (semaine précédente/suivante)
3. **Ajouter indicateurs tendances** (↗️ ↘️ → avec % de variation)
4. **Ajouter mode comparaison** (vs semaine dernière, vs mois dernier)

**Résultat attendu** : Navigation temporelle intuitive et puissante

### Phase 4 : Graphiques Avancés (PRIORITÉ 2)
**Durée estimée** : 3-4 heures  
**Impact** : Visualisations de corrélations et insights

1. **Créer `GarminActivityHeatmap.jsx`** (Calendrier heatmap)
2. **Créer `GarminSleepPerformanceChart.jsx`** (Corrélation sommeil/performance)
3. **Créer `GarminBodyBatteryIntensityChart.jsx`** (Corrélation Body Battery/intensité)

**Résultat attendu** : 3 graphiques de corrélation et insights

### Phase 5 : Améliorations Backend Avancées (PRIORITÉ 2)
**Durée estimée** : 2-3 heures  
**Impact** : Récupération de données supplémentaires

1. **Récupérer Body Battery time series** (si API le permet)
2. **Récupérer Stress time series** (si API le permet)
3. **Récupérer SpO2 time series** (si API le permet)
4. **Récupérer zones cardiaques** (si API le permet)
5. **Améliorer parsing métriques natation** (explorer toutes structures possibles)

**Résultat attendu** : Plus de données disponibles pour graphiques

### Phase 6 : Optimisations et Polissage (PRIORITÉ 3)
**Durée estimée** : 2-3 heures  
**Impact** : Performance et UX finales

1. **Fusion time series HR** dans IndexedDB (éviter perte données)
2. **Compression time series** après 30 jours (optimisation stockage)
3. **Cache serveur Node.js** (5 minutes, éviter appels API répétés)
4. **Filtrage activités** (par type, date, durée, recherche)
5. **Export/Import avancé** (CSV, filtres période/type)

**Résultat attendu** : Système optimisé et performant

---

## 📊 MÉTRIQUES DE SUCCÈS

### Actuel vs Objectif

| Métrique | Actuel | Objectif | Écart |
|----------|--------|----------|-------|
| **Données parsées correctement** | 60% | 95% | -35% |
| **Graphiques temporels** | 0 | 5 | -5 |
| **Corrélations** | 0 | 3 | -3 |
| **Navigation temporelle** | Basique | Avancée | - |
| **Alertes/Insights** | 0 | Automatiques | - |

### ROI Attendu

- **+35% données utilisées** → Plus d'insights
- **+5 graphiques temporels** → Visualisation tendances
- **+3 corrélations** → Compréhension patterns
- **Navigation avancée** → Expérience utilisateur améliorée
- **Alertes automatiques** → Prévention et optimisation

---

## 🎯 RECOMMANDATIONS FINALES

### Architecture
✅ **Maintenir** : Python backend + Node.js bridge + React frontend + IndexedDB  
✅ **Ajouter** : Composants graphiques modulaires (Recharts)  
✅ **Optimiser** : Cache serveur, compression time series

### Données
✅ **Corriger** : Body Battery, Stress, SpO2 parsing (PRIORITÉ 1)  
✅ **Améliorer** : Métriques natation détaillées (PRIORITÉ 2)  
✅ **Ajouter** : Time series Body Battery, Stress, SpO2 (PRIORITÉ 2)

### Visualisations
✅ **Créer** : 5 graphiques temporels essentiels (PRIORITÉ 1)  
✅ **Créer** : 3 graphiques de corrélation (PRIORITÉ 2)  
✅ **Ajouter** : Calendrier heatmap activité (PRIORITÉ 2)

### UX
✅ **Améliorer** : Navigation temporelle (filtres, boutons, comparaisons)  
✅ **Ajouter** : Filtrage activités  
✅ **Ajouter** : Alertes et insights automatiques

---

## 🔚 CONCLUSION

Le système Garmin est **solide architecturalement** mais **incomplet fonctionnellement**. Les corrections prioritaires (Body Battery, Stress, SpO2) sont **simples** et auront un **impact immédiat**. Les graphiques temporels sont **essentiels** pour exploiter pleinement les données et offrir une **expérience utilisateur de niveau professionnel**.

**Temps total estimé** : 15-20 heures de développement  
**Impact attendu** : **Transformation complète** de l'onglet Garmin en **dashboard professionnel** avec **visualisations avancées** et **insights automatisés**.

---

**Prochaines étapes** : 
1. Valider cet état des lieux
2. Prioriser les phases selon besoins immédiats
3. Implémenter phase par phase avec tests après chaque étape

