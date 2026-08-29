# Inventaire Garmin — ce qui est récupéré, stocké, exposé

Date de l’audit : **29 août 2026**  
Périmètre : code actuel du pont `garmin-server` + app React (IndexedDB `GarminDataDB`).  
Ce fichier décrit **uniquement** le flux **API Garmin Connect → payload JSON → stockage local → écrans**. Les services de démo / enrichissement (`garminEnhancedDataService`, `garminRealDataService.generateHeartRateZones` sans série réelle) ne sont **pas** des données d’API.

---

## 1. Pipeline

1. Le client appelle `POST /api/garmin/sync` (`garmin-server/garmin-server.js`).
2. Le serveur lance `garmin-server/fetch_garmin_data.py` (bibliothèque **python-garminconnect**).
3. Réponse JSON :
   ```json
   {
     "activities": { "swimming": [], "jumpRope": [], "cardio": [] },
     "dailyMetrics": { "YYYY-MM-DD": { ... } },
     "parsing_errors": [],
     "error_stats": {},
     "recent_errors": []
   }
   ```
4. Le front fusionne et enregistre dans IndexedDB (`src/services/garmin/garminDbGateway.js`) :
   - store `activities` (clé `id`)
   - store `dailyMetrics` (clé `date`)
   - stores annexes : `deviceMeta`, `forcedRangesHistory`, `telemetryHistory`, `autoSyncHistory` (pas des métriques Garmin corporelles)

Sans identifiants Garmin, le Python peut renvoyer un **mock** ; un utilisateur réel sans email/session obtient un payload vide (`dailyMetrics: {}`).

Filtre optionnel `deviceIds` : les activités dont `deviceInfo.deviceId` n’est pas dans la liste sont **retirées** ; une activité **sans** `deviceInfo` est **conservée**.

---

## 2. Appels API Garmin Connect (python-garminconnect)

Toutes les méthodes ci-dessous sont tentées **par jour** de la fenêtre de synchro (sauf activités, déjà bornées par date). Fallbacks `AttributeError` si la méthode n’existe pas dans la version du client.

| Méthode client | Usage |
|---|---|
| `get_activities_by_date(start, end)` | Liste des activités du jour |
| `get_activity(id)` | Détail activité (calories, GPS, cadence, etc.) |
| `get_activity_splits` / `get_activity_typed_splits` / `get_activity_split_summaries` / `get_activity_details` | Tours / intervalles / série FC activité (course, marche, cardio) |
| `get_steps_data` | Pas |
| `get_stats` puis `get_daily_summary` puis `get_wellness_summary` | Stats jour (calories, distance, étages, intensité…) |
| `get_heart_rates` | FC jour + série temporelle |
| `get_sleep_data` | Sommeil (DTO + epochs) |
| `get_respiration_data` / `get_respiration_values` | Respiration éveil / sommeil |
| `get_intensity_minutes` / `get_wellness_intensity_minutes` | Minutes modérées / soutenues |
| `get_body_battery` / `_data` / `_values` | Body Battery |
| `get_stress_data` / `_values` / `get_stress` | Stress |
| `get_spo2_data` / `_values` / `get_spo2` | SpO2 |

**Non appelé** (donc **jamais** dans le payload actuel) : poids corporel Garmin, hydratation, menstruel, HRV dédié, training readiness, calendrier menstruel, météo, fichiers FIT bruts, messages, badges sociaux, etc.

---

## 3. Classification des activités

`classify_activity` (`parsers/activity_parser.py`) range chaque séance dans **un seul** seau :

- **swimming** : typeId 26/27, `typeKey` swim / pool / open water, nom « swim / natation / pool »
- **jumpRope** : jump_rope / skipping / nom jump / saut / jumpro
- **cardio** (fourre-tout) : indoor_cardio, course (`is_running_like_activity`), marche/rando (`is_walking_like_activity`), **et tout le reste** (vélo, musculation, HIIT, etc. tombe dans le `else` et est stocké dans `activities.cardio`)

Les activités **course / marche** reçoivent en plus un bloc `running` (tours, allure, cadence) via `parse_run_cardio_metrics` si `get_activity` a réussi.

---

## 4. `dailyMetrics[date]` — champs persistés

Initialisation + parsers dans `fetch_garmin_data.py` / `daily_metrics_parser.py` / `wellness_parser.py` / `sleep_parser.py` / `respiration_parser.py` / `performance_parser.py`.

### 4.1 Toujours présents (valeurs 0 / `None` possibles)

| Champ | Forme | Source |
|---|---|---|
| `steps` | `int` | `get_steps_data` |
| `distance` | `float` (km) | stats + pas + somme distances activités |
| `floors` | `int` | stats |
| `calories` | `{ total, active, resting }` | stats / steps |
| `heartRate` | `{ resting, max, avg, timeSeries[] }` | `get_heart_rates` + fusion série **activités** + éventuellement epochs sommeil |
| `respiration` | `{ awake: {min,max,avg}, sleep: {min,max,avg} }` ou `null` | respiration API + DTO sommeil |
| `intensityMinutes` | `{ moderate, vigorous, total }` ou `null` | intensité API + stats + somme activités |
| `bodyBattery` | `{ current, timeSeries[] }` ou `null` | Body Battery API ; fallback champs sommeil |
| `stress` | `{ average, max, timeSeries[] }` ou `null` | Stress API (série souvent **downsamplée** à ~1 pt/heure) |
| `spo2` | `int` 0–100 ou `null` | SpO2 API (moyenne / clé prioritaire, **pas** une série) |

### 4.2 Ajoutés si le parseur a des données

| Champ | Forme | Source |
|---|---|---|
| `sleep` | voir §4.3 | `get_sleep_data` |
| `heartRateZones` | `{ zone1…zone5: {time, percentage}, total, zonesDefinition? }` | calcul depuis **série FC du jour** (si assez de points) |
| `performance` | agrégat des activités du jour | `aggregate_daily_performance_metrics` |

**Pas de `stepsGoal` écrit par le serveur.** Le calendrier le lit (`calendarDayRecapDetail.js`) mais il n’est **pas** produit par `fetch_garmin_data.py` → objectif de pas Garmin **non récupéré**.

**Pas de `weight`** dans `dailyMetrics`. Nutrition cherche `m.weight` → corrélation calories/poids Garmin **ne part pas** de l’API Garmin.

### 4.3 Objet `sleep`

Produit par `parse_sleep_data` :

| Clé | Contenu réel |
|---|---|
| `duration` | heures (float) |
| `quality` | score 0–100 (sleepScore) |
| `deepSleep` / `lightSleep` / `remSleep` | heures ou `null` |
| `bedTime` / `wakeTime` | `"HH:MM"` |
| `awakenings` | **toujours `null`** — `parse_sleep_awakenings` est un **stub** |
| `movements` | **toujours `null`** — stub |
| `phasesDetails` | **toujours `null`** — stub |

**Non stockés** alors que Garmin les envoie souvent dans `dailySleepDTO` : durée éveillé (`awake`), SpO2 sommeil, FC min/moy/max **dans l’objet sleep** (la FC sommeil est plutôt **fusionnée** dans `heartRate.timeSeries` du jour).

`extract_respiration_from_sleep` est aussi un **stub** (`return {}`) ; la respiration sommeil passe surtout par `merge_respiration_sources` + champs DTO `avgSleepRespirationValue` / waking.

---

## 5. Objet activité (commun + spécialisations)

`parse_common_metrics` puis parsers natation / corde / course.

### 5.1 Commun (toutes catégories)

| Champ | Notes |
|---|---|
| `id`, `date`, `time`, `type`, `source: "garmin"` | |
| `duration` | secondes |
| `calories` | `{ total, resting?, active? }` |
| `avgHR`, `maxHR`, `minHR` | |
| `distance` | km si connue |
| `speed`, `maxSpeed` | km/h |
| `avgPaceSecondsPerKm` | si calculable |
| `sweatLoss` | ml, souvent vide |
| `intensityMinutes` | moderate / vigorous / total |
| `startTimeLocal`, `startTimeGMT` | ISO UTC |
| `location` | `{ start: {lat,lng}, end }` |
| `elevation` | gain / loss / max / min |
| `deviceInfo` | `{ deviceId, deviceTypePk, deviceVersionPk }` |
| `trainingEffect` | `{ aerobic, anaerobic }` |
| `recoveryTime` | heures |
| `vo2Max` | |
| `trainingStatus` | |
| `trainingLoad` | |
| `performanceCondition` | `{ pre, during, post }` |
| `heartRateZones` | temps par zone **de l’activité** |

### 5.2 Natation (`type: swimming`) — `swimmingMetrics` / laps / SWOLF / strokes…

Cartes : `SwimmingActivityCard.jsx`.

### 5.3 Corde (`type: jumpRope`) — `jumpRopeMetrics`, `connectIQ`

Sauts, vitesse sauts/min, interruptions, série max, champs Connect IQ (JumpJump Pro, `developerFieldNumber` 1–8).

### 5.4 Cardio / course / marche — bloc `running`

Tours (`laps[]` : distance, durée, allure, FC, cadence, foulée, type d’intervalle), cadence moy/max, foulée, meilleures allures, etc.

La série FC **horaire du jour** n’est **pas** recopiée sur l’activité ; elle est mergée dans `dailyMetrics.heartRate.timeSeries`.

---

## 6. `dailyMetrics.performance` (agrégat jour)

Si au moins une activité ce jour :

- `trainingEffect.aerobic` / `anaerobic` : **moyennes**
- `recoveryTime` : **max**
- `vo2Max` : **max**
- `trainingLoad` : **somme**
- `trainingStatus` : valeur la plus fréquente
- `performanceCondition.pre/during/post` : moyennes

---

## 7. Où c’est exposé (UI et modules)

Légende : **OUI** = affiché ou utilisé dans un calcul visible ; **PARTIEL** = résumé / tooltip / graphique sans tout le détail ; **NON** = stocké mais pas d’écran dédié.

### 7.1 Sport → sous-onglet Garmin (`GarminTab`)

Sous-onglets : `dashboard` · `activities` · `metrics` · `charts` · `settings`.

| Donnée | Dashboard | Activités (cartes) | Métriques quotidiennes | Graphiques |
|---|---|---|---|---|
| Pas, distance, calories T/A/R | OUI | via activités | OUI | heatmap / corrélations |
| Étages (`floors`) | NON (debug seulement) | NON | **OUI** | NON |
| FC repos / max / moy | OUI | OUI (séance) | OUI | tendance + **série temporelle jour** |
| `heartRate.timeSeries` | NON (chiffres) | NON | NON | **OUI** (`GarminHeartRateTimeSeriesChart`) |
| Zones FC **jour** | NON (log debug `hasHeartRateZones`) | — | **NON** | NON dans ChartsSection |
| Zones FC **activité** | — | **NON** (cartes) | — | — |
| Sommeil durée / score / phases / coucher-lever | OUI (durée surtout) | — | **OUI** | `GarminSleepChart` |
| Sleep awakenings / movements / phasesDetails | — | — | NON (null) | NON |
| Respiration éveil/sommeil min-moy-max | NON dashboard | — | **OUI** | `GarminRespirationChart` |
| Minutes intensité | PARTIEL | OUI sur cartes | **OUI** | NON dédié |
| Body Battery `current` | OUI | — | **OUI** | tendance |
| Body Battery `timeSeries` | NON | — | NON | **OUI** (`GarminBodyBatteryChart`) |
| Stress moyenne | OUI | — | **OUI** | tendance |
| Stress max / série | PARTIEL | — | max **non** dans la grille (moyenne seulement) | **OUI** série |
| SpO2 | NON dashboard | — | **OUI** (si nombre) | NON |
| `performance` jour (VO2, load, status…) | **NON** (seulement log) | — | **NON** | NON |
| Transpiration | — | **OUI** si > 0 | — | — |
| Training Effect aéro/anaé | — | **OUI** | — | — |
| Recovery time | — | **OUI** (cardio) | — | — |
| `vo2Max` / `trainingLoad` / `trainingStatus` / `performanceCondition` **activité** | — | **NON** | — | — |
| GPS / élévation | — | **OUI** (cardio) | — | — |
| Tours course | — | **OUI** | — | — |
| Natation SWOLF, longueurs, strokes | — | **OUI** | — | — |
| Corde sauts / Connect IQ | — | **OUI** | — | — |

JSON brut : toggle `showRaw` dans l’onglet Garmin (debug). Export PDF / stats avancées consomment surtout les agrégats déjà listés.

### 7.2 Calendrier (heatmap + détail jour)

Fichiers : `calendarDayGarminStripes.js`, `calendarGarminDayRecap.js`, `calendarDayRecapDetail.js`, `CalendarDayRecapDetailPanel.jsx`, `SleepPhasesChart.jsx`.

**Traits de case :** présence d’activités Garmin, sommeil (durée ou phases), pas ≥ 180 (fusion pas Garmin + pas manuels).

**Panneau détail jour :** pas (+ breakdown manuel), étages, calories, FC (zones si présentes **dans** l’objet HR), sommeil (durée, profond/léger/REM, qualité, coucher/lever), respiration sommeil, SpO2 (`parseNum` sur int **ou** `sleep.avgSpO2` — ce dernier **n’est pas** écrit par le parser), FC sommeil si clés `avgHR` etc. sur `sleep` (**non écrites** par le parser actuel), stress moy/max + série, Body Battery + série.

**Éveils sommeil :** le détail essaie `sleep.awake` — **jamais rempli** par le serveur.

### 7.3 Récap sport

Pas Garmin, heures de sommeil, volumes course depuis `activities.cardio` (stats, trophées, graphiques tendances). Calories / intensité selon les agrégats recap. **Pas** d’écran Récap dédié VO2 / training load Garmin.

### 7.4 Aujourd’hui / accueil dashboard

Calories rue / « leader » kcal, pas, nombre d’activités Garmin (`DashboardMomentumBlock`, `DashboardCombinedActivityCalendar`, `DashboardGarminSportRecapBlock`). Cartes **marche** et **course** (`GarminWalkingStatsCard`, `GarminRunningStatsCard`) : distance, durée, cadence, allure issues des activités cardio classées marche/course.

Le module sidebar « Garmin » **ne navigue pas** vers l’onglet Garmin : deep link **Sport → Aujourd’hui**.

### 7.5 Sidebar — `GarminMetricsModule`

Via `useRealGarminData` → `garminRealDataService.format…` :

Affiche (si `hasData`) : calories, Body Battery, pas, FC, sommeil **durée**. Graphiques : zones FC (souvent **générées** pour la sidebar, pas forcément `dailyMetrics.heartRateZones`), série FC, phases sommeil, stress.

**Piège :** le formateur lit `sleep.deep` / `light` / `rem` / `awake`, alors que l’API persiste `deepSleep` / `lightSleep` / `remSleep`. Les **phases** sidebar peuvent rester à 0 même si les métriques quotidiennes Garmin sont correctes.

### 7.6 Endurance — fiche séance course

`RunningSessionDetailPage.jsx` (activité Garmin liée) : vitesse max, FC moy/max/min, calories, minutes intensité, transpiration, cadence, GPS, dénivelé, device, heure de début, tours. **Pas** VO2 / training load / zones FC.

Pont `garminEnduranceSessionBridge.js` : importe course/marche Garmin vers l’historique endurance (seuils durée/distance).

### 7.7 XP sport (`xpCalculations.js` / `useSportXP.js`)

Utilise `dailyMetrics.calories.active`, `dailyMetrics.steps` (fusion pas manuels), et les activités `cardio` (trophées / fractionné / minutes). **N’utilise pas** sommeil, stress, SpO2, Body Battery, VO2.

### 7.8 Nutrition — corrélations

`nutritionCorrelations.js` attend :

- `dailyMetrics[].weight` → **absent** du sync Garmin
- `activities[].performance` et `activities[].endurance` → **pas** les champs produits (`trainingEffect`, `vo2Max`, etc.)

Ces corrélations **ne se branchent pas** sur le payload réel actuel.

### 7.9 Réglages — export / import

`garminExportSummary.js` : résumé activités (id, type, date, durée, distance, calories, FC, sueur, intensité, élévation, nb tours) + résumé jour (pas, distance, étages, calories, FC sans **timeSeries**, BB current, stress moy/max, respiration, sommeil **sans** lightSleep ni éveils, intensité, SpO2).

Export sport complet peut embarquer le blob IndexedDB Garmin (données brutes plus riches que le résumé).

### 7.10 Autres

- **Body tracking** : pas d’impédance Garmin ; analyses peuvent croiser l’activité de façon générique.
- **GraminTab.jsx** : ancien composant encore présent, sueur affichée ; le flux principal est `GarminTab`.
- **Debug** : `/api/garmin/metrics`, panel debug, erreurs `parsing_errors`.

---

## 8. Récupéré (ou calculé) mais **peu ou pas** montré à l’utilisateur

À traiter comme « dans IndexedDB, pas d’UI métier » :

1. **`dailyMetrics.performance` entier** (VO2 jour, charge, statut d’entraînement, condition, TE agrégé, récupération max).
2. **`vo2Max`, `trainingLoad`, `trainingStatus`, `performanceCondition`** sur chaque activité.
3. **`heartRateZones` jour** et **activité** (sauf génération sidebar / recap si l’objet HR les contient).
4. **`heartRate.timeSeries`** : seulement graphiques onglet Garmin (pas dashboard ni métriques en chiffres).
5. **Série Body Battery / stress** : graphiques Garmin + détail calendrier ; les grilles n’affichent que le scalaire.
6. **`sleep.awakenings` / `movements` / `phasesDetails`** : clés présentes, **toujours vides** (stubs Python).
7. **Durée éveillé**, SpO2/FC **dans** l’objet sleep : **non parsés**.
8. **Objectif de pas Garmin**.
9. **Poids Garmin**.
10. **Device info** : peu visible (fiche course surtout).
11. **Timestamps fin d’activité**, métadonnées deviceTypePk / version.
12. Corrélations nutrition `weight` / `activity.performance` / `activity.endurance`.

---

## 9. Incohérences à connaître (pour ne pas se tromper)

| Sujet | Réalité code |
|---|---|
| SpO2 serveur | **entier** (ou `null`), pas `{ average }` |
| SpO2 calendrier | `parseNum` accepte objet **si** un jour d’anciennes données ont un objet |
| Affichage SpO2 métriques Garmin | `d.spo2%` **sans** extraire un objet → casse si format objet |
| Sommeil sidebar | attend `deep` pas `deepSleep` |
| Nutrition vs Garmin | champs attendus ≠ champs sync |
| Activités « perdues » | vélo / muscu **sont** dans `cardio`, pas un 4ᵉ tableau |
| Mock vs réel | sidebar peut afficher une démo si IndexedDB vide |

---

## 10. Fichiers d’entrée (pour revérifier)

- Fetch : `garmin-server/fetch_garmin_data.py`
- Parsers : `garmin-server/parsers/{activity,sleep,wellness,respiration,daily_metrics,performance,heart_rate_zones}_parser.py`
- Pont HTTP : `garmin-server/garmin-server.js`
- Stockage : `src/services/garmin/garminDbGateway.js`, fusion `src/hooks/garminDataFusion.js`
- UI Garmin : `src/components/tabs/GarminTab/`
- Calendrier : `src/utils/calendarDayRecapDetail.js`, `calendarDayGarminStripes.js`
- Sidebar : `src/components/sidebar/historical/GarminMetricsModule.jsx`, `src/services/garmin/garminRealDataService.js`

---

## 11. Écarts vs catalogue « tout ce qu’on peut récupérer » (liste métier)

Comparaison du **29 août 2026** : champs / concepts d’une liste exhaustive Garmin **présents dans cette liste mais absents** de l’inventaire ci-dessus (non appelés, non persistés, ou seulement partiels au point d’être considérés manquants).

### Activités
- Date/heure de fin (non persistée)
- Temps écoulé (distinct de la durée)
- Temps en mouvement
- Pas au niveau de la séance (hors corde à sauter)
- Trace GPS complète (seulement départ / arrivée)
- Série temporelle d’activité point par point : horodatage, latitude, longitude, distance, vitesse, allure, FC, cadence, altitude, calories, fréquence respiratoire

### Santé / performance
- Âge fitness
- Prédictions de course
- Historique d’entraînement Garmin (objet dédié, hors liste d’activités)
- Précision GPS

### Course / marche / vélo
- Prédictions de course
- Trace GPS complète
- Cadence vélo (spécifique, distincte de la cadence course)

### HIIT
- Séries
- Répétitions

### Sommeil
- Sommeil éveillé
- Réveils (clé présente, toujours vide / stub)
- FC sommeil **dans** l’objet sommeil (fusionnée dans la FC du jour, pas exposée comme champ sleep)

### Quotidien
- Objectif de pas
- Progression de l’objectif

---

*Fin de l’inventaire. Toute évolution de parser ou d’écran doit mettre à jour ce fichier.*
