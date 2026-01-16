# Audit Onglet — Sport (et sous‑onglets)

Périmètre demandé : fichiers **non-.md**, **fonctionnels**, **liés au Sport**.  
Tests exclus.  
Le rapport est structuré : onglet Sport → sous‑onglets (un à un).  

## Portée exacte (périmètre technique)
- Routage/Navigation : `src/App.jsx`, `src/components/layout/Navigation.jsx`
- Sous‑onglets Sport (fichiers principaux) :
  - `src/components/tabs/TodayTab.jsx` + `src/components/tabs/TodayTab/**`
  - `src/components/tabs/DataEntryTab.jsx`
  - `src/components/tabs/ProgramTab.jsx`
  - `src/components/tabs/NutritionTab.jsx` + `src/components/tabs/nutrition/**`
  - `src/components/tabs/ExercisesTab.jsx`
  - `src/components/tabs/ProgressTab.jsx`
  - `src/components/tabs/EnduranceTab.jsx` + `src/components/tabs/EnduranceTab/**`
  - `src/components/tabs/CalendarTab.jsx`
  - `src/components/tabs/HistoryTab.jsx`
  - `src/components/tabs/ChartsTab.jsx` + `src/components/tabs/charts/**`
  - `src/components/tabs/StatsTab.jsx`
  - `src/components/PredictionsTab.jsx`
  - `src/components/SmartBalancingTab.jsx`
  - `src/components/tabs/GarminTab.jsx` + `src/components/tabs/GarminTab/**`

## Note globale Sport
**84/100** (moyenne pondérée des sous‑onglets)

Barème cible “Silicon Valley” :
- Performance & optimisation : 35
- Architecture & qualité du code : 25
- Frontend/UX/Accessibilité : 20
- Robustesse & données : 10
- Scalabilité & tests : 10

---

## 0) Onglet Sport (meta‑navigation / routing)
### Fichiers analysés
- `src/components/layout/Navigation.jsx`
- `src/App.jsx`

### Points forts
- Regroupement clair de tous les sous‑onglets Sport dans une seule navigation.
- Lazy loading généralisé des onglets.

### Points perdus et solutions
- **(−6) “Sport” est un pseudo‑onglet**
  - **Pourquoi** : clique sur Sport → redirection forcée vers `today`, pas de route explicite `sport`.
  - **Solution** : créer un vrai onglet `sport` et sélectionner un sous‑onglet par défaut via state (`sport.activeSubTab`).

- **(−5) Layout inline basé sur `activeTab`**
  - **Pourquoi** : `marginTop` est hardcodé par tab dans `App.jsx`.
  - **Solution** : isoler la logique layout dans un composant `TabLayout` + classes CSS par tab.

- **(−4) Accessibilité des onglets**
  - **Pourquoi** : boutons sans `aria-current`, navigation clavier limitée.
  - **Solution** : `role="tablist"`, `role="tab"`, `aria-selected`, roving tabindex.

---

## 1) Sous‑onglet “Aujourd’hui”
### Fichiers analysés
- `src/components/tabs/TodayTab.jsx`
- `src/components/tabs/TodayTab/components/*`
- `src/components/tabs/TodayTab/hooks/*`

### Points forts
- Logique de journée complète (exercices, défis, endurance, justifications).
- Hooks dédiés (`useTodayWorkout`, `useExerciseTracking`, etc.) bien séparés.

### Points perdus et solutions
- **(−8) Composant monolithique**
  - **Pourquoi** : `TodayTab.jsx` > 1000 lignes, mélange de logique + UI.
  - **Solution** : extraire sections (défis, exercices, étirements, endurance) + un hook `useTodayTabState`.

- **(−5) Usage direct du DOM**
  - **Pourquoi** : `document.querySelector` + `setTimeout` pour scroll.
  - **Solution** : refs React + `scrollIntoView` via callback stable.

- **(−4) Logique debug résiduelle**
  - **Pourquoi** : fonctions `inspectIndexedDB` dans le composant.
  - **Solution** : déplacer en util “dev‑only” ou behind flag.

#### Détails hooks (cohérence performance)
- `useActiveChallenges.js`
  - **(−3)** Dépendance `now` recréée à chaque render → annule la mémoïsation.
  - **Solution** : `const now = useMemo(() => new Date(), [todayStr])`.
- `useSessionDuration.js`
  - **(−2)** dépendance `data` non utilisée → recalculs inutiles.
  - **Solution** : supprimer `data` de la liste.
- `useExerciseTracking.js`
  - **(−2)** écritures `reps: { key: undefined }` → risque de pollution des objets.
  - **Solution** : supprimer la clé via `delete` ou un helper immuable.

---

## 2) Sous‑onglet “Saisie”
### Fichiers analysés
- `src/components/tabs/DataEntryTab.jsx`

### Points forts
- Validation forte des entrées, feedback utilisateur clair.
- Gestion admin/non‑admin pour protéger les données.

### Points perdus et solutions
- **(−6) Boucles lourdes dans le render**
  - **Pourquoi** : initialisation répétée des reps + variantes.
  - **Solution** : hook `useDataEntryState` + memoization.

- **(−5) Parsing répétitif et fragile**
  - **Pourquoi** : `parseInt` sans radix, conversions multiples.
  - **Solution** : util `parseReps()` centralisée avec schema.

- **(−5) UX bloquante (confirm)**
  - **Pourquoi** : `window.confirm` bloque le thread.
  - **Solution** : modal non‑bloquante.

---

## 3) Sous‑onglet “Programmes”
### Fichiers analysés
- `src/components/tabs/ProgramTab.jsx`

### Points forts
- Fonctionnalités riches (CRUD, activation, import program).
- Protection admin + conversion du format legacy.

### Points perdus et solutions
- **(−6) Mapping de programme dans l’UI**
  - **Pourquoi** : transformation logic dans le component.
  - **Solution** : service `ProgramMapper` + tests unitaires.

- **(−5) Validation insuffisante des données**
  - **Solution** : schema zod/yup + validation au submit.

- **(−4) State local volumineux**
  - **Solution** : reducer + découpage en sections.

---

## 4) Sous‑onglet “Nutrition”
### Fichiers analysés
- `src/components/tabs/NutritionTab.jsx`
- `src/components/tabs/nutrition/components/*`

### Points forts
- Lazy loading des sections, préservation d’état, thème dynamique.
- Service worker différé + config performance.

### Points perdus et solutions
- **(−5) État de section non persisté**
  - **Solution** : `useNavigationCache` ou `localStorage`.

- **(−4) LRU simplifié**
  - **Solution** : vrai LRU (timestamp usage).

- **(−4) Sections lourdes chargées sans prefetch**
  - **Solution** : prefetch à l’hover.

---

## 5) Sous‑onglet “Exercices”
### Fichiers analysés
- `src/components/tabs/ExercisesTab.jsx`

### Points forts
- Synchronisation auto des programmes vers exercices.
- Modes avancés (programmes actifs, tous programmes).

### Points perdus et solutions
- **(−7) Sync déclenchée trop souvent**
  - **Pourquoi** : `useEffect` sans throttling.
  - **Solution** : debounce + worker.

- **(−5) Conversion format répétée**
  - **Solution** : normaliser une seule fois.

- **(−4) Couplage UI / data**
  - **Solution** : hook `useExercisesData`.

---

## 6) Sous‑onglet “Progression”
### Fichiers analysés
- `src/components/tabs/ProgressTab.jsx`

### Points forts
- Sections bien structurées, error boundary dédiée.
- UI claire et riche.

### Points perdus et solutions
- **(−5) Pas de persistance de section**
  - **Solution** : `localStorage` ou URL param.

- **(−5) Sections non lazy**
  - **Solution** : lazy loading des sections avancées.

- **(−3) Navigation sections sans ARIA**
  - **Solution** : `role="tablist"`, `aria-selected`, focus.

---

## 7) Sous‑onglet “Endurance”
### Fichiers analysés
- `src/components/tabs/EnduranceTab.jsx`
- `src/components/tabs/EnduranceTab/components/*`

### Points forts
- Normalisation et migration des données robustes.
- Services dédiés, hooks bien isolés.

### Points perdus et solutions
- **(−7) Composant monolithique**
  - **Solution** : découper par sections, reducer global.

- **(−5) Logs debug en prod**
  - **Solution** : logger conditionnel.

- **(−4) State très profond**
  - **Solution** : store dédié (zustand/RTK).

---

## 8) Sous‑onglet “Calendrier”
### Fichiers analysés
- `src/components/tabs/CalendarTab.jsx`

### Points forts
- Statistiques détaillées, nettoyage automatique des mocks.

### Points perdus et solutions
- **(−6) Chargement Garmin sans gating auth**
  - **Solution** : bloquer si `isAuthenticated === false`.

- **(−5) Nettoyage mock automatique au mount**
  - **Solution** : action explicite utilisateur + confirmation.

- **(−4) Calculs lourds sans selectors**
  - **Solution** : hooks mémoïsés par section.

---

## 9) Sous‑onglet “Historique”
### Fichiers analysés
- `src/components/tabs/HistoryTab.jsx`

### Points forts
- Filtres utiles, statistiques propres, UX claire.

### Points perdus et solutions
- **(−6) Pas de virtualisation**
  - **Solution** : react-window pour grandes listes.

- **(−4) Calculs cumulés dans render**
  - **Solution** : `useMemo` par section.

---

## 10) Sous‑onglet “Graphiques”
### Fichiers analysés
- `src/components/tabs/ChartsTab.jsx`
- `src/components/tabs/charts/*`

### Points forts
- Config centralisée, intégration Garmin.

### Points perdus et solutions
- **(−6) Imports massifs**
  - **Solution** : lazy loading par chart.

- **(−5) Chart data recalculé globalement**
  - **Solution** : hooks `useChartData` par section.

---

## 11) Sous‑onglet “Stats”
### Fichiers analysés
- `src/components/tabs/StatsTab.jsx`

### Points forts
- Intégration Garmin + filtres d’endurance.

### Points perdus et solutions
- **(−7) Calculs complexes dans le component**
  - **Solution** : service `statsService` + memo.

- **(−4) Répétitions logique date**
  - **Solution** : centraliser `periodRange`.

---

## 12) Sous‑onglet “Prédictions”
### Fichiers analysés
- `src/components/PredictionsTab.jsx`

### Points forts
- Algorithmes variés (EMA, régression, cycles).

### Points perdus et solutions
- **(−7) Calculs lourds sur thread UI**
  - **Solution** : worker + cache.

- **(−4) Fonctions analytiques recréées par render**
  - **Solution** : module util externe.

---

## 13) Sous‑onglet “Smart Balancing”
### Fichiers analysés
- `src/components/SmartBalancingTab.jsx`

### Points forts
- Multi‑sources (nutrition, Garmin, body tracking).
- Score unifié et corrélations.

### Points perdus et solutions
- **(−8) Monolithique**
  - **Solution** : découper par domaines + Suspense.

- **(−6) Effets multiples en cascade**
  - **Solution** : orchestration data layer.

- **(−6) Calculs lourds sans worker**
  - **Solution** : offload analytics.

---

## 14) Sous‑onglet “Garmin”
### Fichiers analysés (hors tests)
- `src/components/tabs/GarminTab.jsx`
- `src/components/tabs/GarminTab/components/*`
- `src/components/tabs/GarminTab/constants.js`
- `src/components/tabs/GarminTab/constants/keyboard.js`
- `src/components/tabs/GarminTab/hooks/*`
- `src/components/tabs/GarminTab/services/*`
- `src/components/tabs/GarminTab/utils/*`
- `src/components/tabs/GarminTab/workers/*`

### Points forts
- Architecture Container/View propre.
- Cache multi‑niveaux, sync pipeline modulaire.
- Très bonne gestion telemetry + diagnostics.

### Points perdus et solutions
- **(−6) `useGarminTabContainer` très long**
  - **Solution** : découper en hooks spécifiques (data, UI, scheduler).

- **(−4) Multiples effets `useEffect` + timers**
  - **Solution** : isoler avec un orchestrateur d’effets.

- **(−3) Flags de feature désactivés**
  - **Solution** : activer `USE_SYNC_PIPELINE` et `USE_SWR_CACHE` progressivement.

- **(−3) Dépendance DOM directe**
  - **Pourquoi** : `document.getElementById` pour aria-live.
  - **Solution** : ref React + composant announcer.

---

## Actions prioritaires pour 100/100 (Sport)
1. **Découper les composants monolithiques** (Today, Endurance, SmartBalancing).
2. **Virtualiser/paginer** toutes les listes longues (News/History/Charts).
3. **Centraliser le layout** des onglets Sport (pas de marges inline).
4. **Offloader analytics** (Predictions, SmartBalancing) vers workers.
5. **Accessibilité complète** sur navigation et cartes.

---

## Statut
Onglet Sport terminé.  
Dis‑moi le prochain onglet à auditer.
