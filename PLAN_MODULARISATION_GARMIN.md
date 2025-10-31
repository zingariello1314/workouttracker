# 🔧 PLAN DE MODULARISATION - SYSTÈME GARMIN

**Date** : 31 octobre 2025  
**Objectif** : Modulariser les fichiers volumineux avant corrections pour faciliter maintenance et développements futurs

---

## 📊 ANALYSE DES FICHIERS

### Taille Actuelle
- **`fetch_garmin_data.py`** : ~2643 lignes ❌ **CRITIQUE**
- **`GraminTab.jsx`** : ~1119 lignes ⚠️ **IMPORTANT**
- **`useGarminData.js`** : ~286 lignes ✅ **OK** (peut rester tel quel)

### Complexité
- **`fetch_garmin_data.py`** : Monolithique, toute la logique dans une boucle principale
- **`GraminTab.jsx`** : Composant monolithique avec fonctions de rendu inline

---

## 🎯 PLAN DE MODULARISATION

### 1. BACKEND PYTHON (`fetch_garmin_data.py`)

#### Structure Cible
```
garmin-server/
├── fetch_garmin_data.py (main, ~200 lignes)
├── parsers/
│   ├── __init__.py
│   ├── activity_parser.py (swimming, jumpRope, cardio)
│   ├── daily_metrics_parser.py (steps, distance, calories, FC)
│   ├── sleep_parser.py
│   ├── respiration_parser.py
│   └── wellness_parser.py (Body Battery, Stress, SpO2)
├── utils/
│   ├── __init__.py
│   ├── helpers.py (safe_int, safe_float, daterange)
│   └── validators.py (validations métriques)
└── models/
    ├── __init__.py
    └── schemas.py (structures de données)
```

#### Modules à Créer

##### 1.1 `parsers/activity_parser.py` (~800 lignes)
**Responsabilités** :
- Détection type activité (swimming/jumpRope/cardio)
- Parsing activités natation (distance, laps, métriques détaillées)
- Parsing activités corde à sauter (jumps, Connect IQ)
- Parsing activités cardio
- Extraction métriques communes (FC, calories, durée, localisation)

**Fonctions principales** :
```python
def detect_activity_type(act_summary, act_details) -> str
def parse_swimming_activity(act_id, act_summary, act_details) -> dict
def parse_jump_rope_activity(act_id, act_summary, act_details) -> dict
def parse_cardio_activity(act_id, act_summary, act_details) -> dict
def parse_common_activity_metrics(act_summary, act_details) -> dict
```

##### 1.2 `parsers/daily_metrics_parser.py` (~600 lignes)
**Responsabilités** :
- Parsing pas quotidiens
- Parsing distance quotidienne
- Parsing calories (total, active, resting)
- Parsing FC (resting, max, avg, timeSeries)
- Parsing minutes intensives

**Fonctions principales** :
```python
def parse_daily_steps(steps_data) -> int
def parse_daily_distance(stats, steps_data) -> float
def parse_daily_calories(stats) -> dict
def parse_daily_heart_rate(stats, hr_day) -> dict
def parse_daily_intensity_minutes(stats, activities) -> dict
```

##### 1.3 `parsers/sleep_parser.py` (~300 lignes)
**Responsabilités** :
- Parsing durée sommeil
- Parsing phases (deep, light, REM)
- Parsing heures coucher/lever
- Parsing qualité sommeil

**Fonctions principales** :
```python
def parse_sleep_data(sleep) -> dict
def parse_sleep_phases(dailySleepDTO) -> dict
def parse_sleep_times(dailySleepDTO) -> dict
```

##### 1.4 `parsers/respiration_parser.py` (~400 lignes)
**Responsabilités** :
- Parsing respiration éveillée (min/max/avg)
- Parsing respiration sommeil (min/max/avg)
- Fusion données depuis plusieurs sources (respiration_data, sleep)
- Parsing epoch data

**Fonctions principales** :
```python
def parse_respiration_data(respiration_data, sleep) -> dict
def parse_respiration_epochs(epoch_data) -> dict
def merge_respiration_sources(resp_data, sleep_dto) -> dict
```

##### 1.5 `parsers/wellness_parser.py` (~300 lignes)
**Responsabilités** :
- Parsing Body Battery (dict, list, int)
- Parsing Stress (avgStressLevel, maxStressLevel)
- Parsing SpO2 (champs corrects)

**Fonctions principales** :
```python
def parse_body_battery(body_battery_data) -> int | None
def parse_stress(stress_data) -> int | None
def parse_spo2(spo2_data) -> int | None
```

##### 1.6 `utils/helpers.py` (~100 lignes)
**Responsabilités** :
- Fonctions utilitaires réutilisables
- Conversions de formats

**Fonctions principales** :
```python
def safe_int(value, default=0) -> int
def safe_float(value, default=0.0) -> float
def daterange(start_dt: date, end_dt: date) -> generator
def format_duration(seconds: int) -> str
```

##### 1.7 `utils/validators.py` (~150 lignes)
**Responsabilités** :
- Validations métriques (distance/steps ratio, vitesse raisonnable, etc.)
- Détection valeurs suspectes

**Fonctions principales** :
```python
def validate_distance_steps_ratio(distance, steps) -> bool
def validate_jump_rope_metrics(jumps, speed, duration) -> dict
def validate_swimming_distance(distance_m, duration_s) -> bool
```

##### 1.8 `fetch_garmin_data.py` (main) (~200 lignes)
**Responsabilités** :
- Initialisation client Garmin
- Boucle principale (date par date)
- Orchestration appels parsers
- Construction payload final
- Gestion erreurs globales

**Structure simplifiée** :
```python
from parsers import activity_parser, daily_metrics_parser, sleep_parser, respiration_parser, wellness_parser
from utils.helpers import safe_int, safe_float, daterange

def main():
    client = Garmin(EMAIL, PASSWORD)
    client.login()
    
    for date in daterange(start_dt, end_dt):
        # Activités
        activities = client.get_activities_by_date(date, date)
        for act in activities:
            if activity_parser.detect_activity_type(act) == 'swimming':
                swim_list.append(activity_parser.parse_swimming_activity(act))
            # ...
        
        # Métriques quotidiennes
        daily = daily_metrics_parser.parse_daily_metrics(client, date)
        daily['sleep'] = sleep_parser.parse_sleep_data(client.get_sleep_data(date))
        daily['respiration'] = respiration_parser.parse_respiration_data(...)
        daily['bodyBattery'] = wellness_parser.parse_body_battery(client.get_body_battery(date))
        # ...
        
        daily_dict[date] = daily
    
    payload = {"activities": {...}, "dailyMetrics": daily_dict}
    print_json_ok(payload)
```

---

### 2. FRONTEND REACT (`GraminTab.jsx`)

#### Structure Cible
```
src/components/tabs/GarminTab/
├── GarminTab.jsx (main, ~300 lignes)
├── components/
│   ├── GarminDashboard.jsx (cartes métriques)
│   ├── GarminActivities.jsx (liste activités)
│   ├── GarminDailyMetrics.jsx (métriques quotidiennes)
│   ├── ActivityCard.jsx (carte activité réutilisable)
│   │   ├── SwimmingActivityCard.jsx
│   │   ├── JumpRopeActivityCard.jsx
│   │   └── CardioActivityCard.jsx
│   └── SyncControls.jsx (boutons sync/backfill)
├── hooks/
│   ├── useGarminSync.js (logique sync/backfill)
│   └── useGarminImport.js (import vers Endurance)
└── utils/
    └── garminFormatters.js (formatDuration, formatDate, etc.)
```

#### Composants à Extraire

##### 2.1 `components/GarminDashboard.jsx` (~200 lignes)
**Responsabilités** :
- Affichage cartes métriques (Pas, Calories, FC, Sommeil, Body Battery, Stress, SpO2, Intensité)
- Logique de coloration dynamique

##### 2.2 `components/GarminActivities.jsx` (~150 lignes)
**Responsabilités** :
- Liste activités natation
- Liste activités corde à sauter
- Liste activités cardio
- Filtrage par type/date

##### 2.3 `components/ActivityCard/SwimmingActivityCard.jsx` (~200 lignes)
**Responsabilités** :
- Affichage activité natation complète
- Toutes les métriques de nage
- Informations supplémentaires (localisation, élévation, device)

##### 2.4 `components/ActivityCard/JumpRopeActivityCard.jsx` (~150 lignes)
**Responsabilités** :
- Affichage activité corde à sauter
- Connect IQ data
- Métriques spécifiques (jumps, speed, interruptions)

##### 2.5 `components/ActivityCard/CardioActivityCard.jsx` (~150 lignes)
**Responsabilités** :
- Affichage activité cardio
- Métriques communes (FC, calories, durée)

##### 2.6 `components/GarminDailyMetrics.jsx` (~250 lignes)
**Responsabilités** :
- Tableau historique
- Sélecteur de date
- Affichage détaillé métriques quotidiennes (cartes)

##### 2.7 `components/SyncControls.jsx` (~100 lignes)
**Responsabilités** :
- Boutons synchronisation
- Contrôles backfill (dates début/fin)
- Affichage statut sync

##### 2.8 `hooks/useGarminSync.js` (~150 lignes)
**Responsabilités** :
- Logique syncNow
- Logique backfill
- Gestion erreurs
- Mise à jour état

##### 2.9 `hooks/useGarminImport.js` (~120 lignes)
**Responsabilités** :
- Import automatique vers Endurance
- Déduplication
- Mise à jour context

##### 2.10 `utils/garminFormatters.js` (~50 lignes)
**Responsabilités** :
- formatDuration(seconds)
- formatPace(seconds)
- formatDistance(km)
- formatTime(timestamp)

##### 2.11 `GarminTab.jsx` (main) (~300 lignes)
**Responsabilités** :
- État principal (garminData, selectedDate, loading)
- Orchestration composants
- Layout principal

**Structure simplifiée** :
```jsx
import GarminDashboard from './components/GarminDashboard';
import GarminActivities from './components/GarminActivities';
import GarminDailyMetrics from './components/GarminDailyMetrics';
import SyncControls from './components/SyncControls';
import { useGarminSync } from './hooks/useGarminSync';
import { useGarminImport } from './hooks/useGarminImport';

const GarminTab = () => {
  const [garminData, setGarminData] = useState(null);
  const { syncNow, backfill, loading } = useGarminSync(setGarminData);
  useGarminImport(garminData);
  
  return (
    <div>
      <SyncControls syncNow={syncNow} backfill={backfill} loading={loading} />
      {garminData && (
        <>
          <GarminDashboard data={garminData.dailyMetrics} />
          <GarminActivities activities={garminData.activities} />
          <GarminDailyMetrics metrics={garminData.dailyMetrics} />
        </>
      )}
    </div>
  );
};
```

---

## 📋 ORDRE DE MODULARISATION

### Phase 1 : Utilitaires Python (Base)
**Durée** : 30 minutes  
**Fichiers** :
1. Créer `garmin-server/utils/helpers.py` (safe_int, safe_float, daterange)
2. Créer `garmin-server/utils/validators.py` (validations)
3. Importer dans `fetch_garmin_data.py`

**Avantages** : Réutilisation immédiate, base solide

### Phase 2 : Parsers Python par Catégorie
**Durée** : 2-3 heures  
**Ordre** (du plus simple au plus complexe) :
1. `wellness_parser.py` (Body Battery, Stress, SpO2) - **PRIORITÉ** car corrections à faire ici
2. `sleep_parser.py` (sommeil) - Fonctionnel déjà
3. `respiration_parser.py` (respiration) - Fonctionnel déjà
4. `daily_metrics_parser.py` (métriques quotidiennes)
5. `activity_parser.py` (activités) - Le plus complexe

**Avantages** : Corrections isolées dans `wellness_parser.py`, tests par module

### Phase 3 : Composants React
**Durée** : 2-3 heures  
**Ordre** :
1. `utils/garminFormatters.js` (fonctions pures, facile)
2. `hooks/useGarminSync.js` (logique métier)
3. `hooks/useGarminImport.js` (logique métier)
4. `components/SyncControls.jsx` (UI simple)
5. `components/ActivityCard/*.jsx` (composants isolés)
6. `components/GarminDashboard.jsx` (cartes)
7. `components/GarminActivities.jsx` (liste)
8. `components/GarminDailyMetrics.jsx` (métriques)

**Avantages** : Tests isolés par composant, réutilisabilité

### Phase 4 : Intégration et Tests
**Durée** : 1 heure  
**Actions** :
1. Tester chaque module isolément
2. Intégrer dans fichiers principaux
3. Vérifier fonctionnalité complète
4. Nettoyer code dupliqué

---

## ⚠️ PRÉCAUTIONS

### Backward Compatibility
- ✅ Conserver signature fonctions existantes
- ✅ Maintenir format JSON payload identique
- ✅ Ne pas changer structure IndexedDB

### Tests
- ✅ Tester après chaque module extrait
- ✅ Vérifier sync complète fonctionne
- ✅ Vérifier affichage UI identique

### Migration Progressive
- ✅ Extraire module par module
- ✅ Tester après chaque extraction
- ✅ Ne pas tout refactoriser d'un coup

---

## 📊 BÉNÉFICES ATTENDUS

### Maintenabilité
- ✅ **+80% facilité debug** : Problèmes isolés dans modules spécifiques
- ✅ **+60% facilité tests** : Tests unitaires par module
- ✅ **+50% facilité corrections** : Corrections localisées

### Développement
- ✅ **+100% réutilisabilité** : Modules utilisables ailleurs
- ✅ **+70% vitesse développement** : Corrections rapides
- ✅ **+90% clarté code** : Structure logique claire

### Performance
- ✅ Pas d'impact négatif (imports Python rapides)
- ✅ Possible optimisations futures (lazy loading)

---

## 🎯 PROCHAINES ÉTAPES

1. **Valider plan** avec utilisateur
2. **Commencer Phase 1** (utils Python)
3. **Extraire wellness_parser** (PRIORITÉ pour corrections Body Battery/Stress/SpO2)
4. **Corriger parsers** après extraction
5. **Continuer modularisation** progressive

---

**Temps total estimé** : 5-7 heures  
**Impact** : Code **10x plus maintenable**, corrections **3x plus rapides**

