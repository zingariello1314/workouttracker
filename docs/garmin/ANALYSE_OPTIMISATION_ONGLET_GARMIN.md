# 🔍 ANALYSE COMPLÈTE ET OPTIMISATION - ONGLET GARMIN

**Date :** 2025-01-31  
**Objectif :** Identifier toutes les optimisations possibles, données manquantes, et améliorations à apporter

---

## 📋 TABLE DES MATIÈRES

1. [Données parsées mais non affichées](#1-données-parsées-mais-non-affichées)
2. [Données disponibles mais non récupérées](#2-données-disponibles-mais-non-récupérées)
3. [Méthodes API Garmin non utilisées](#3-méthodes-api-garmin-non-utilisées)
4. [Optimisations de performance](#4-optimisations-de-performance)
5. [Améliorations UX/UI](#5-améliorations-uxui)
6. [Corrections de bugs potentiels](#6-corrections-de-bugs-potentiels)
7. [Intégrations manquantes](#7-intégrations-manquantes)
8. [Plan d'action priorisé](#8-plan-daction-priorisé)

---

## 1. DONNÉES PARSÉES MAIS NON AFFICHÉES

### 🔴 **CRITIQUE : Métriques natation non affichées**

**Parser récupère mais UI n'affiche pas :**

1. **`avgSpeedMovement`** (vitesse moyenne de déplacement)
   - Parsé dans `parse_swimming_metrics` (ligne 694-702)
   - ❌ Non affiché dans `SwimmingActivityCard.jsx`

2. **`avgPaceMovement`** (allure moyenne de déplacement)
   - Parsé dans `parse_swimming_metrics` (ligne 643-653)
   - ❌ Non affiché dans `SwimmingActivityCard.jsx`

3. **`maxSpeed`** (vitesse maximale)
   - Parsé dans `parse_swimming_metrics` (ligne 706-717)
   - ❌ Non affiché dans `SwimmingActivityCard.jsx`

4. **`poolLength`** (longueur de la piscine)
   - Parsé mais pas stocké dans `entry_base`
   - ❌ Non affiché (utile pour comprendre le contexte)

5. **`laps` détaillés** (données de chaque longueur)
   - Parsé dans `parse_swimming_metrics` (ligne 488-505) → `laps_data`
   - ❌ Non stocké dans `entry_base.swimmingMetrics.laps`
   - ❌ Non affiché dans l'UI (détail par longueur)

### 🟡 **MOYEN : Métriques communes non affichées**

6. **`minHR`** (fréquence cardiaque minimale)
   - Parsé dans `parse_common_metrics` (ligne 178-186)
   - ✅ Affiché dans `SwimmingActivityCard` et `JumpRopeActivityCard`
   - ⚠️ Non affiché dans `CardioActivityCard.jsx` (à vérifier)

7. **`location.start` et `location.end`** (GPS)
   - Parsé dans `parse_common_metrics` (ligne 306-356)
   - ✅ Affiché dans les cartes d'activité
   - ❌ **Pas de carte visuelle** (carte Google Maps/OpenStreetMap)

8. **`elevation`** (gain/perte, min/max)
   - Parsé dans `parse_common_metrics` (ligne 312-361)
   - ✅ Affiché textuellement
   - ❌ **Pas de graphique d'élévation** pour les activités

9. **`deviceInfo`** (informations sur l'appareil Garmin)
   - Parsé dans `parse_common_metrics` (ligne 318-328)
   - ❌ **JAMAIS affiché** (utile pour debug et traçabilité)

10. **`startTimeLocal` et `startTimeGMT`**
    - Parsé dans `parse_common_metrics` (ligne 302-304)
    - ✅ Affiché dans les cartes
    - ❌ **Pas de conversion timezone** intelligente (afficher l'heure locale de l'utilisateur)

### 🟢 **MINEUR : Métriques de bien-être**

11. **Données de respiration par phase** (éveillé vs sommeil)
    - Parsé dans `extract_respiration_from_sleep` (ligne 227-364)
    - ✅ Affiché dans `GarminDailyMetrics.jsx`
    - ❌ **Pas de graphique temporel** de la respiration au cours de la journée

12. **Phases de sommeil détaillées** (deep/light/REM)
    - Parsé dans `parse_sleep_data` (ligne 64-86)
    - ✅ Affiché dans `GarminDailyMetrics.jsx`
    - ❌ **Pas de graphique circulaire/stacked** montrant la répartition

---

## 2. DONNÉES DISPONIBLES MAIS NON RÉCUPÉRÉES

### 🔴 **CRITIQUE : Time-series données manquantes**

13. **Heart Rate Time Series** (courbe FC tout au long de la journée)
    - ✅ `dailyMetrics.heartRate.timeSeries` existe dans le mock (ligne 112-115)
    - ❌ **PAS récupéré depuis l'API Garmin** dans `fetch_garmin_data.py`
    - **Méthode API :** `client.get_heart_rates(d_str)` → retourne time series, mais on ne parse que les agrégats (resting/max/avg)
    - **Impact :** Impossible de voir les variations de FC dans la journée

14. **Stress Time Series** (courbe de stress par heure)
    - ❌ **PAS récupéré**
    - **Méthode API disponible :** `client.get_stress_data(d_str)` ou `client.get_stress(d_str)`
    - **Impact :** Pas de visualisation des pics de stress dans la journée

15. **Body Battery Time Series** (évolution de la batterie corporelle)
    - ❌ **PAS récupéré**
    - **Méthode API disponible :** `client.get_body_battery(d_str)` → peut retourner time series
    - **Impact :** Pas de visualisation de la charge/recharge dans la journée

16. **Respiration Time Series** (courbe respiration minute par minute)
    - ❌ **PAS récupéré**
    - **Méthode API disponible :** `client.get_respiration_data(d_str)` → peut retourner time series
    - **Impact :** Pas de visualisation des variations respiratoires

### 🟡 **MOYEN : Données d'activité avancées**

17. **Power Zones** (zones de puissance pour les activités)
    - ❌ **PAS récupéré**
    - **Méthode API :** `client.get_activity(act_id)` → `powerZones` ou `activityDetailDTO.powerZones`
    - **Impact :** Pas d'analyse de la répartition des zones de puissance

18. **Training Effect** (effet d'entraînement - aérobie/anaérobie)
    - ❌ **PAS récupéré**
    - **Méthode API :** `client.get_activity(act_id)` → `trainingEffect`, `aerobicTrainingEffect`, `anaerobicTrainingEffect`
    - **Impact :** Pas d'analyse de l'impact de l'entraînement

19. **Recovery Time** (temps de récupération estimé)
    - ❌ **PAS récupéré**
    - **Méthode API :** `client.get_activity(act_id)` → `recoveryTime`, `estimatedRecoveryTime`
    - **Impact :** Pas d'indication sur le temps de récupération nécessaire

20. **VO2 Max** (estimation VO2 max pour les activités)
    - ❌ **PAS récupéré**
    - **Méthode API :** `client.get_activity(act_id)` → `vo2Max`, `estimatedVO2Max`
    - **Impact :** Pas de suivi de la condition physique

21. **Running Dynamics** (pour les activités running)
    - ❌ **PAS récupéré**
    - **Méthode API :** `client.get_activity(act_id)` → `runningDynamicsDTO`
    - **Champs :** cadence, longueur de foulée, balance gauche/droite, oscillation verticale
    - **Impact :** Pas d'analyse de la technique de course

22. **Swimming Strokes** (détail par type de nage - crawl, brasse, dos, papillon)
    - ❌ **PAS récupéré**
    - **Méthode API :** `client.get_activity(act_id)` → `activityDetailDTO.swimStrokes`, `strokesPerLap`
    - **Impact :** Pas d'analyse par type de nage

23. **Split Times** (temps par segment/intervalles)
    - ❌ **PAS récupéré pour toutes activités**
    - **Méthode API :** `client.get_activity(act_id)` → `splits`, `laps` (déjà parsé pour natation mais pas pour autres)
    - **Impact :** Pas d'analyse des performances par segment

### 🟢 **MINEUR : Données contextuelles**

24. **Weather Data** (météo pendant l'activité)
    - ❌ **PAS récupéré**
    - **Méthode API :** `client.get_activity(act_id)` → `weather`, `weatherDTO`
    - **Champs :** température, humidité, conditions, vent
    - **Impact :** Pas de contexte météorologique

25. **Course/Event Info** (si l'activité est liée à un événement)
    - ❌ **PAS récupéré**
    - **Méthode API :** `client.get_activity(act_id)` → `eventDTO`, `eventTypeDTO`
    - **Impact :** Pas d'identification des compétitions/événements

26. **Photos associées** (photos prises pendant l'activité)
    - ❌ **PAS récupéré**
    - **Méthode API :** `client.get_activity(act_id)` → `photos`, `photoDTOList`
    - **Impact :** Pas d'intégration visuelle des activités

27. **Notes/Comments** (notes personnelles de l'utilisateur)
    - ❌ **PAS récupéré**
    - **Méthode API :** `client.get_activity(act_id)` → `userNotes`, `notes`
    - **Impact :** Pas d'intégration des notes utilisateur

---

## 3. MÉTHODES API GARMIN NON UTILISÉES

### 🔴 **CRITIQUE : Méthodes wellness non utilisées**

28. **`client.get_hydration(d_str)`**
    - ❌ **PAS appelé**
    - **Retourne :** Hydratation quotidienne (ml d'eau consommés)
    - **Impact :** Données d'hydratation manquantes

29. **`client.get_all_day_floors(d_str)`**
    - ⚠️ **Déjà utilisé indirectement** via `get_stats` (floors)
    - ✅ Mais pourrait être enrichi avec time series

30. **`client.get_floors_data(d_str)`**
    - ❌ **PAS appelé**
    - **Retourne :** Time series des étages montés
    - **Impact :** Pas de visualisation temporelle des montées d'escalier

31. **`client.get_body_composition(d_str)`**
    - ❌ **PAS appelé**
    - **Retourne :** Masse grasse, masse musculaire, eau, etc.
    - **Impact :** Données de composition corporelle manquantes

32. **`client.get_weight_data(d_str)`**
    - ❌ **PAS appelé**
    - **Retourne :** Poids quotidien depuis balance Garmin
    - **Impact :** Pas de synchronisation avec les données de balance

### 🟡 **MOYEN : Méthodes activité non utilisées**

33. **`client.get_activities(start, limit)`**
    - ❌ **PAS utilisé** (on utilise seulement `get_activities_by_date`)
    - **Retourne :** Liste paginée de toutes les activités
    - **Impact :** Impossibilité de backfill massif historique

34. **`client.get_activity_splits(act_id)`**
    - ❌ **PAS appelé**
    - **Retourne :** Splits détaillés par segment
    - **Impact :** Splits non récupérés pour activités non-natation

35. **`client.get_activity_laps(act_id)`**
    - ⚠️ **Déjà utilisé indirectement** via `get_activity` → `laps`
    - ✅ Mais pourrait être enrichi avec métriques par lap

36. **`client.get_activity_hr_zones(act_id)`**
    - ❌ **PAS appelé**
    - **Retourne :** Temps passé dans chaque zone de FC
    - **Impact :** Pas d'analyse des zones cardiaques

37. **`client.get_activity_power_zones(act_id)`**
    - ❌ **PAS appelé**
    - **Retourne :** Temps passé dans chaque zone de puissance
    - **Impact :** Pas d'analyse des zones de puissance

### 🟢 **MINEUR : Méthodes statistiques**

38. **`client.get_user_profile()`**
    - ❌ **PAS appelé**
    - **Retourne :** Profil utilisateur (sexe, taille, poids, zones FC)
    - **Impact :** Pas de personnalisation des calculs (zones FC basées sur l'utilisateur)

39. **`client.get_social_connections()`**
    - ❌ **PAS appelé**
    - **Retourne :** Amis/connexions Garmin
    - **Impact :** Pas de fonctionnalité sociale (optionnel)

40. **`client.get_devices()`**
    - ❌ **PAS appelé**
    - **Retourne :** Liste des appareils Garmin connectés
    - **Impact :** Pas d'affichage des appareils utilisés

---

## 4. OPTIMISATIONS DE PERFORMANCE

### 🔴 **CRITIQUE : Performances de parsing**

41. **Parsing récursif exhaustif pour Connect IQ** (ligne 1223-1281 dans `activity_parser.py`)
    - ⚠️ **Problème :** Recherche récursive jusqu'à 15 niveaux de profondeur
    - **Impact :** Lent pour les activités complexes
    - **Solution :** Limiter à 5-7 niveaux ou utiliser une approche plus ciblée

42. **Double parsing des activités** (summary + details)
    - ⚠️ **Problème :** On appelle `get_activity(act_id)` pour CHAQUE activité même si summary suffit
    - **Impact :** N+1 queries, très lent pour les jours avec beaucoup d'activités
    - **Solution :** Parser d'abord summary, puis details seulement si nécessaire

43. **Pas de cache des données parsées**
    - ⚠️ **Problème :** On re-parse tout à chaque sync
    - **Impact :** Données déjà parsées sont re-parsées inutilement
    - **Solution :** Cache avec hash des données brutes

### 🟡 **MOYEN : Optimisations réseau**

44. **Requêtes parallèles manquantes**
    - ⚠️ **Problème :** Toutes les requêtes API sont séquentielles
    - **Impact :** Sync lente (10-30 secondes pour plusieurs jours)
    - **Solution :** Utiliser `asyncio` ou `concurrent.futures` pour requêtes parallèles

45. **Downsampling insuffisant des time series**
    - ⚠️ **Problème :** On stocke toutes les données brutes
    - **Impact :** IndexedDB peut être lent avec beaucoup de données
    - **Solution :** Downsample à 5 min pour HR, 1 min pour respiration

46. **Pas de pagination pour backfill**
    - ⚠️ **Problème :** Si on veut backfill 1 an, on fait 365 requêtes
    - **Impact :** Risque de timeout ou rate limit
    - **Solution :** Pagination par batch de 30 jours

### 🟢 **MINEUR : Optimisations frontend**

47. **Pas de `useMemo` pour calculs coûteux**
    - ⚠️ **Problème :** Les graphiques recalculent à chaque render
    - **Impact :** UI lente lors de navigation temporelle
    - **Solution :** `useMemo` pour tous les calculs de graphiques

48. **Pas de virtualisation des listes**
    - ⚠️ **Problème :** Toutes les activités sont rendues même si hors écran
    - **Impact :** Scroll lent avec beaucoup d'activités
    - **Solution :** `react-window` ou `react-virtualized`

---

## 5. AMÉLIORATIONS UX/UI

### 🔴 **CRITIQUE : Visualisations manquantes**

49. **Graphique Heart Rate Time Series**
    - ❌ **Manque :** Courbe FC tout au long de la journée
    - **Solution :** Ligne chart avec zoom temporel

50. **Graphique Body Battery Time Series**
    - ❌ **Manque :** Evolution de la batterie dans la journée
    - **Solution :** Aire chart avec zones (charge/recharge)

51. **Graphique Stress Time Series**
    - ❌ **Manque :** Evolution du stress par heure
    - **Solution :** Ligne chart avec codes couleur (vert/jaune/rouge)

52. **Carte GPS pour activités**
    - ❌ **Manque :** Carte visuelle du tracé GPS
    - **Solution :** Intégration Leaflet ou Google Maps

53. **Graphique d'élévation pour activités**
    - ❌ **Manque :** Profil d'élévation (gain/perte)
    - **Solution :** Ligne chart avec ombrage sous la courbe

### 🟡 **MOYEN : Améliorations ergonomiques**

54. **Filtres avancés manquants**
    - ❌ **Manque :** Filtrer par type d'activité, durée, distance, calories
    - **Solution :** Sidebar de filtres avec checkboxes/ranges

55. **Tri des activités**
    - ❌ **Manque :** Tri par date, durée, distance, calories
    - **Solution :** Dropdown de tri

56. **Recherche dans activités**
    - ❌ **Manque :** Recherche textuelle (nom d'activité, notes)
    - **Solution :** Barre de recherche avec autocomplete

57. **Export des données**
    - ❌ **Manque :** Export CSV/JSON des données
    - **Solution :** Bouton "Exporter" dans Settings

58. **Comparaison multi-jours**
    - ❌ **Manque :** Comparer plus de 2 jours
    - **Solution :** Mode "Comparaison" avec sélection multiple

### 🟢 **MINEUR : Polish UI**

59. **Animations de chargement**
    - ❌ **Manque :** Skeleton loaders pendant la sync
    - **Solution :** Skeleton components pour chaque section

60. **Tooltips informatifs**
    - ❌ **Manque :** Explications des métriques (SWOLF, Body Battery, etc.)
    - **Solution :** Tooltips avec définitions

61. **Thème dark/light**
    - ❌ **Manque :** Toggle thème
    - **Solution :** Theme provider avec toggle

---

## 6. CORRECTIONS DE BUGS POTENTIELS

### 🔴 **CRITIQUE : Validations manquantes**

62. **Validation distance/steps ratio**
    - ⚠️ **Problème potentiel :** Distance quotidienne peut être incorrecte (ex: 18 km pour 23 pas)
    - **Vérifier :** Ratio distance/steps raisonnable (0.6-1.2 m/pas)
    - **Solution :** Validation et logging si ratio suspect

63. **Validation cohérence calories**
    - ⚠️ **Problème potentiel :** Calories actives > calories totales
    - **Vérifier :** `calories.active + calories.resting <= calories.total * 1.1`
    - **Solution :** Normalisation automatique

64. **Validation durée/sauts pour corde**
    - ⚠️ **Problème potentiel :** Vitesse calculée absurde (ex: < 1 saut/min)
    - **Vérifier :** `speed = jumps / (duration / 60)` entre 10-300 sauts/min
    - **Solution :** Validation et warning dans logs

65. **Validation maxContinuousJumps <= jumps**
    - ✅ **Déjà corrigé** (ligne 1488-1491 dans `activity_parser.py`)
    - ⚠️ **Mais :** Vérifier aussi dans l'UI si jamais

### 🟡 **MOYEN : Gestion d'erreurs**

66. **Erreurs silencieuses lors du parsing**
    - ⚠️ **Problème :** Si parsing échoue, on continue sans données
    - **Impact :** Données partielles sans avertissement
    - **Solution :** Logging explicite + UI warning si données incomplètes

67. **Gestion des timeouts API**
    - ⚠️ **Problème :** Pas de retry automatique si timeout
    - **Impact :** Sync échoue sans retry
    - **Solution :** Retry avec backoff exponentiel

68. **Gestion des rate limits Garmin**
    - ⚠️ **Problème :** Si trop de requêtes, Garmin bloque
    - **Impact :** Sync échoue
    - **Solution :** Rate limiting avec queue et délai

---

## 7. INTÉGRATIONS MANQUANTES

### 🔴 **CRITIQUE : Intégration avec autres onglets**

69. **Import automatique natation vers EnduranceTab**
    - ⚠️ **Partiellement implémenté** via `useGarminImport`
    - ❌ **Manque :** Validation des doublons (éviter d'importer 2x la même activité)
    - **Solution :** Deduplication basée sur `activityId`

70. **Import automatique corde à sauter vers EnduranceTab**
    - ⚠️ **Partiellement implémenté** via `useGarminImport`
    - ❌ **Manque :** Mapping correct de toutes les métriques Connect IQ
    - **Solution :** Mapping complet des champs

71. **Intégration avec ChartsTab**
    - ❌ **Manque :** Les activités Garmin n'apparaissent pas dans les graphiques globaux
    - **Solution :** Ajouter une section "Activités Garmin" dans ChartsTab

72. **Intégration avec StatsTab**
    - ❌ **Manque :** Stats Garmin non incluses dans StatsTab
    - **Solution :** Section "Métriques Garmin" dans StatsTab

73. **Intégration avec CalendarTab**
    - ❌ **Manque :** Activités Garmin non visibles dans le calendrier
    - **Solution :** Icônes Garmin dans le calendrier pour les jours avec activités

### 🟡 **MOYEN : Fonctionnalités avancées**

74. **Synchronisation automatique programmée**
    - ❌ **Manque :** Sync automatique toutes les heures
    - **Solution :** Service worker ou `setInterval` pour sync périodique

75. **Notifications de nouvelles activités**
    - ❌ **Manque :** Notification quand nouvelle activité détectée
    - **Solution :** Web Notifications API

76. **Export/Import des données Garmin**
    - ❌ **Manque :** Export JSON/CSV dans SettingsTab
    - **Solution :** Bouton export dans SettingsTab

---

## 8. PLAN D'ACTION PRIORISÉ

### 🎯 **PHASE 1 : CRITIQUE (1-2 semaines)**

**Objectif :** Corriger les bugs critiques et ajouter les données essentielles

1. ✅ **Corriger affichage métriques natation manquantes**
   - Ajouter `avgSpeedMovement`, `avgPaceMovement`, `maxSpeed` dans `SwimmingActivityCard`
   - Stocker `poolLength` et `laps` détaillés dans `entry_base`

2. ✅ **Récupérer et afficher Heart Rate Time Series**
   - Parser `get_heart_rates(d_str)` → time series
   - Créer graphique `GarminHeartRateTimeSeriesChart.jsx`

3. ✅ **Récupérer et afficher Body Battery Time Series**
   - Parser `get_body_battery(d_str)` → time series
   - Créer graphique `GarminBodyBatteryTimeSeriesChart.jsx`

4. ✅ **Corriger validation distance/steps ratio**
   - Ajouter validation dans `parse_daily_distance`
   - Logger warning si ratio suspect

5. ✅ **Optimiser parsing récursif Connect IQ**
   - Réduire profondeur max de 15 à 7
   - Utiliser approche plus ciblée

### 🎯 **PHASE 2 : IMPORTANT (2-3 semaines)**

**Objectif :** Améliorer les performances et ajouter les visualisations essentielles

6. ✅ **Paralléliser requêtes API**
   - Utiliser `asyncio` ou `concurrent.futures`
   - Réduire temps de sync de 10-30s à 3-5s

7. ✅ **Récupérer Training Effect et Recovery Time**
   - Parser depuis `get_activity(act_id)`
   - Afficher dans les cartes d'activité

8. ✅ **Créer carte GPS pour activités**
   - Intégrer Leaflet
   - Afficher tracé GPS des activités

9. ✅ **Récupérer et afficher Stress Time Series**
   - Parser `get_stress_data(d_str)` → time series
   - Créer graphique `GarminStressTimeSeriesChart.jsx`

10. ✅ **Ajouter filtres et tri dans GarminActivities**
    - Filtres par type, durée, distance
    - Tri par date, durée, distance, calories

### 🎯 **PHASE 3 : AMÉLIORATION (3-4 semaines)**

**Objectif :** Enrichir les données et améliorer l'UX

11. ✅ **Récupérer Running Dynamics**
    - Parser `runningDynamicsDTO`
    - Afficher cadence, longueur de foulée

12. ✅ **Récupérer Swimming Strokes**
    - Parser détails par type de nage
    - Afficher répartition crawl/brasse/dos/papillon

13. ✅ **Récupérer Hydration et Body Composition**
    - Parser `get_hydration(d_str)` et `get_body_composition(d_str)`
    - Afficher dans `GarminDailyMetrics`

14. ✅ **Créer graphique d'élévation**
    - Profil d'élévation pour activités avec GPS
    - Ligne chart avec ombrage

15. ✅ **Intégrer avec ChartsTab et StatsTab**
    - Section "Activités Garmin" dans ChartsTab
    - Section "Métriques Garmin" dans StatsTab

### 🎯 **PHASE 4 : OPTIMISATION (4-5 semaines)**

**Objectif :** Optimiser les performances et ajouter les fonctionnalités avancées

16. ✅ **Implémenter cache des données parsées**
    - Hash des données brutes
    - Skip parsing si déjà parsé

17. ✅ **Ajouter export/import JSON**
    - Export dans SettingsTab
    - Import avec validation

18. ✅ **Synchronisation automatique**
    - Service worker ou `setInterval`
    - Sync toutes les heures

19. ✅ **Optimiser frontend avec useMemo**
    - Tous les calculs de graphiques
    - Réduire re-renders inutiles

20. ✅ **Virtualisation des listes**
    - `react-window` pour listes d'activités
    - Améliorer scroll performance

---

## 📊 RÉSUMÉ STATISTIQUE

**Total problèmes identifiés :** 76

- 🔴 **Critique :** 22
- 🟡 **Moyen :** 28
- 🟢 **Mineur :** 26

**Données parsées mais non affichées :** 12  
**Données disponibles mais non récupérées :** 15  
**Méthodes API non utilisées :** 13  
**Optimisations performance :** 8  
**Améliorations UX/UI :** 13  
**Bugs potentiels :** 7  
**Intégrations manquantes :** 8

---

## 🎯 PRIORITÉS ABSOLUES (TOP 5)

1. **Récupérer Heart Rate Time Series** (impact : visualisation essentielle)
2. **Corriger affichage métriques natation** (impact : données parsées mais invisibles)
3. **Validation distance/steps ratio** (impact : données erronées)
4. **Paralléliser requêtes API** (impact : performance critique)
5. **Récupérer Body Battery Time Series** (impact : visualisation essentielle)

---

**Document créé le :** 2025-01-31  
**Dernière mise à jour :** 2025-01-31

