# Architecture Momentum — onglets, sous-onglets et données

**Date de génération :** 2026-10-07  
**Source de vérité :** code runtime (`src/App.jsx`, `Navigation.jsx`, gateways IndexedDB, services)  
**Périmètre :** ce repository = **l’application Momentum** (pas le site `momentum-os.download`)

> Document de cartographie. Il décrit **ce qui existe aujourd’hui**, pas un plan d’évolution.  
> Les analyses métier profondes (ex. moteur Récap) restent dans leurs docs dédiés et sont citées en renvoi.

---

## 0. Fraîcheur des docs existants

| Document | Statut | Commentaire |
| --- | --- | --- |
| `docs/ANALYSE_COMPLETE_ONGLETS_ET_SOUS_ONGLETS.md` (2025-01-09) | **Obsolète comme carte** | Audit de failles ; sous-onglets incomplets (pas Knowledge, Rubiks, Sport Analytics hub, etc.) |
| `src/utils/subtabActivation.js` → `SUBTAB_CONFIGURATIONS` | **Partiellement décalé** | Utile pour la nav précise DOM ; ne reflète pas toujours les IDs UI réels (ex. Quests `today` vs `daily`, Books `library` vs `reading`, Nutrition sections élargies) |
| `docs/recap-analyse-architecture.md` | **À jour pour le moteur Récap** | Référentiel des 3 colonnes Analyse — à croiser, pas à recopier ici |
| Docs Garmin / Nutrition / Finance / Body-tracking | **Spécialisés** | Valides dans leur domaine ; ce fichier est la **carte globale** |

---

## 1. Vue d’ensemble du système

```text
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT (React / Vite)                                          │
│  src/App.jsx → activeTab (WorkoutContext) → renderTabContent()  │
│  Navigation principale + barre Sport / Code                     │
│  Sidebar, Header, HomePageScrollTransition (home↔dashboard)     │
└───────────────┬─────────────────────────┬───────────────────────┘
                │                         │
                ▼                         ▼
     IndexedDB + localStorage      APIs HTTP (optionnelles)
     (données métier locales)      backend/ (FastAPI / zlib_server)
                │                         │
                │                         ▼
                │              Auth, XP, Knowledge, sync prefs,
                │              R2 / Supabase (selon config)
                │
                ▼
     garmin-server/ (fetch + parse Garmin → client IndexedDB)
```

### Couches principales

| Couche | Emplacement | Rôle |
| --- | --- | --- |
| UI onglets | `src/components/tabs/*`, `HomePage.jsx` | Affichage et interaction |
| État global sport | `src/context/WorkoutContext.jsx` | `activeTab`, programmes, snapshot entraînement |
| Persistance workout | `WorkoutTrackerDB` + `WorkoutTrackerContextDB` | Séances, reps, programmes, contexte |
| Domaines isolés | Gateways `src/services/*/…DbGateway.js` | Nutrition, Garmin, Finance, Books, etc. |
| Backend | `backend/*.py` | Auth, knowledge, XP, meta, sync prefs |
| Pipeline Garmin | `garmin-server/` | Collecte / parsing → sync client |
| Assets exercices | `dossiergifs/`, `src/data/` | Médias + registres anatomie / exercices |
| Contrats API | `contracts/` | Schémas versionnés (intentions, mutations…) |

### Hotspots runtime (couplage fort)

- `useTranslation` — i18n transversal  
- `useWorkout` / `WorkoutContext` — hub navigation + données sport  
- `openNutritionDB` / repository nutrition  
- `useGarminData` / `loadAllData`  
- `DateHelper` — dates locales cohérentes partout  

---

## 2. Navigation : onglets principaux

Source UI : `src/components/layout/Navigation.jsx`  
Routage contenu : `src/App.jsx` → `renderTabContent`  
IDs nav accueil personnalisable : `HOME_NAV_TAB_IDS` (`src/utils/homeAppearancePreference.js`)

### Barre principale (méta-onglets)

| ID nav | Label | Comportement |
| --- | --- | --- |
| `home` | Accueil | `HomePage` ; scroll partagé avec dashboard |
| `dashboard` | Tableau de bord | `DashboardTab` |
| `sport` | Sport | **Méta** → dernier sous-onglet (`sport.lastSubTab`, défaut `today`) |
| `quests` | Quêtes | `QuestsTab` |
| `apprentissage` | Apprentissage | `ApprentissageTab` |
| `rubiks` | Rubik’s cube | `RubiksTab` |
| `books` | Livres | `BooksTab` |
| `knowledge` | Knowledge | `KnowledgeTab` |
| `code` | Code | **Méta** → dernier sous-onglet (`code.lastSubTab`, défaut `code-calendar`) |
| `finance` | Finance | `FinanceTab` |
| `settings` | Paramètres | `SettingsTab` |

Onglets hors barre (accès direct / auth) : `auth`, `pricing`, `coach` (CoachDashboard nutrition).

### Méta Sport — sous-onglets (`SPORT_SUB_TAB_IDS`)

Source : `src/constants/sportSubTabs.js` + liste `Navigation.jsx`.

| ID | Composant | Rôle |
| --- | --- | --- |
| `anatomy` | `AnatomyTab` | Anatomie / familles musculaires |
| `recap` | `RecapTab` (monté hors switch, warm) | Récap + analyses |
| `today` | `TodayTab` (warm) | Séance du jour |
| `data-entry` | `DataEntryTab` | Saisie / édition données |
| `program` | `ProgramTab` | Programmes d’entraînement |
| `addiction-quit` | `AddictionQuitTab` | Arrêt addictions |
| `nutrition` | `NutritionTab` | Nutrition |
| `exercises` | `ExercisesTab` | Banque d’exercices |
| `progress` | `ProgressTab` | Suivi corporel |
| `endurance` | `EnduranceTab` | Endurance multi-activités |
| `calendar` | `CalendarTab` (warm) | Calendrier sport |
| `charts` | `ChartsTab` | Graphiques sport |
| `performance-challenges` | `PerformanceChallengesTab` | Défis performance |
| `sport-analytics` | `SportAnalyticsHubTab` | Hub stats / historique / prédictions / équilibre |
| `garmin` | `GarminTab` | Données montre (admin si connecté) |

Legacy redirigés vers le hub : `stats`, `history`, `predictions`, `smart-balancing`.

### Méta Code — sous-onglets

| ID | Contenu |
| --- | --- |
| `code-calendar` | Calendrier contributions / activité code |
| `code-journal` | Journal de code (`MomentumCodeDB`) |
| `code-stats` | Statistiques code |

---

## 3. Données transverses (lues par plusieurs onglets)

### 3.1 Snapshot entraînement (`WorkoutContext` / `getCurrentData`)

Persistance typique :

- **IndexedDB** `WorkoutTrackerDB` → stores `workouts`, sessions  
- **IndexedDB** `WorkoutTrackerContextDB` → `contextData` (programmes, prefs)  
- Backup `localStorage` (`workoutData_backup`, clés scopées utilisateur)

Champs structurants (non exhaustif) :

| Champ | Usage |
| --- | --- |
| `checkedExercises` | Clés `date::exercice` cochées |
| `reps` | Répétitions par clé |
| `enduranceData` | Sessions endurance + `gtg` + syncs |
| `sessionFeedbacks` | Ressenti séance |
| `progressEntries` | Mesures / poids (type `metrics`, etc.) |
| `programs` / `activeProgram` | Programmes actifs |
| `circuitDefinitions` / `circuitProgress` | Circuits |
| `dailyVariations` | Suppressions / variations jour |
| `trainingPrefs` | Préférences parcours (`journeyStartYmd`…) |

Consommateurs lourds : Today, Recap, Calendar, Charts, Sport Analytics, Endurance (sync reps), Nutrition (lien programme sport), Dashboard.

### 3.2 XP centralisé

Port backend `backend/xp_port.py` + API `api_v1_xp.py` ; barre XP sport sur sous-onglets Sport ; apparence `xpAppearancePreference.js`.

### 3.3 Préférences de navigation synchronisables

Liste blanche `NAV_PREFERENCE_KEYS` → sync backend optionnelle :

`finance.activeSubTab`, `finance.planificateur.activeSection`, `sport.lastSubTab`, `quests.activeSubTab`, `dashboard.sport.recapPeriod`, `dashboard.sportInsights.period`, Spotify sidebar, `progress.activeSection`.

### 3.4 Auth / accès

`AuthContext` + `canAccessTab` ; Garmin complet réservé admin connecté ; non-auth peut voir shell Garmin vide.

---

## 4. Inventaire IndexedDB (par domaine)

| Base | Gateway / service | Stores principaux | Domaine |
| --- | --- | --- | --- |
| `WorkoutTrackerDB` | `workoutDbGateway`, nutrition, books, apprentissage (partagé) | `workouts`, sessions, nutrition stores, books… | Sport + partagé historique |
| `WorkoutTrackerContextDB` | `workoutContextGateway` | `contextData` | Programmes / contexte |
| `GarminDataDB` | `garminDbGateway` | activities, dailyMetrics, deviceMeta, forcedRanges, telemetry, autoSyncHistory | Garmin |
| Nutrition (dans WorkoutTrackerDB) | `nutritionDbGateway` | dailyMeals, meals, programs, favoriteFoods, mealPhotos, hydrationLog, apiCache, gamification, shareLinks, progressPhotos, mlModels, offlineQueue | Nutrition |
| `BudgetDB` | `budgetDbGateway` | budget, categories, depenses, depensesPlanifiees, chargesFixes, historique | Finance budget |
| `FinanceDB` | `financeDbGateway` | portfolio, yahooCache, calculations, history, exchangeRates | Bourse |
| `InvestissementsDB` | `investissementsDbGateway` | or, liquidites, bourseCrypto, acquisitions, allocation | Investissements |
| `PlanificateurDB` | `planificateurDbGateway` | salaire, repartition, achatsLoisirs, objectifs, chargesFixes, historique | Planificateur |
| `SyntheseDB` | `syntheseDbGateway` | patrimoine, projections, planEpargne, historique | Synthèse |
| `WorkoutTrackerBooksAssets` | `booksAssetsDbGateway` | PDF, images livres | Livres médias |
| `momentum_knowledge_v1` | `knowledgeIndexedDB` | categories, videos, blobs, thumbnails, articles, notes, userPrefs | Knowledge |
| `MomentumCodeDB` | `codeJournalDbGateway` | journal entries, meta | Code |
| `QuietQuestDashboard` | `dashboardDbGateway` | quests, sportSessions, readingSessions, books, patrimony, settings, muscleGroups, performanceHistory, achievements | Dashboard agrégats |
| `HomepageImagesDB` | `homepageImagesDbGateway` | images accueil | Home |
| `MuscleImagesDB` / `photoAnalysisCache` | bodyTracking gateways | images muscles, cache analyse | Progress / photos |
| `MomentumAppLockDB` | `appLockDbGateway` | verrouillage par user | Sécurité |

---

## 5. Détail par onglet / sous-onglet

Format de chaque entrée :

- **UI** — composant  
- **État UI** — clé localStorage / state  
- **Données lues / écrites** — stores, contextes, APIs  

---

### 5.1 Accueil — `home`

| | |
| --- | --- |
| **UI** | `src/components/HomePage.jsx` |
| **Données** | Citations (prefs + storage) ; images `HomepageImagesDB` ; widgets / apparence `momentum.homeAppearance.v1` ; robot optionnel ; transition scroll → dashboard |
| **Écrit** | Prefs apparence, images bannière/accueil |

---

### 5.2 Dashboard — `dashboard`

| | |
| --- | --- |
| **UI** | `DashboardTab` |
| **Données** | Agrégats `QuietQuestDashboard` ; modules croisant sport / quêtes / lecture / patrimoine ; news (API si clés) ; insights sport (périodes `dashboard.sport.*`) |
| **Écrit** | Settings dashboard, caches modules |

---

### 5.3 Sport › Anatomie — `anatomy`

Sous-onglets shell : Accueil · Famille · Fiche muscle · **Atlas** (`#anatomy/atlas`).

| | |
| --- | --- |
| **UI** | `AnatomyTab` (+ `atlas/AnatomyAtlasView` pour l’explorateur 3D BodyParts3D) |
| **Données** | Registres `src/data` / `anatomyRegistry` ; contenus blocs anatomie ; assets Atlas dans `public/human-atlas/models/` |
| **Écrit** | Peu / prefs de vue |
| **Atlas** | Contenu confiné au conteneur (pas de plein écran sur sidebar / nav Sport) ; attribution CC BY 4.0 |

---

### 5.4 Sport › Récap — `recap`

| | |
| --- | --- |
| **UI** | `RecapTab` + vues `src/components/sport/recap/` |
| **Données** | Snapshot workout ; Garmin fusionné (`mergeGarminDataForRecap`) ; nutrition (si prête) ; programmes / questionnaire ; moteur `useRecapTabMetrics` → `buildAdaptiveRecapInsights` |
| **Doc dédiée** | `docs/recap-analyse-architecture.md` |
| **Écrit** | Prefs période / cache session insights |

---

### 5.5 Sport › Aujourd’hui — `today`

| | |
| --- | --- |
| **UI** | `TodayTab` |
| **Données** | Programme actif, exercices du jour, `reps` / `checkedExercises`, feedbacks, barre XP, endurance du jour, éventuel Garmin du jour |
| **Écrit** | Snapshot workout (séance), feedbacks, sync endurance/GTG vers reps |

---

### 5.6 Sport › Saisie — `data-entry`

| | |
| --- | --- |
| **UI** | `DataEntryTab` |
| **Données** | Même snapshot workout ; édition historique / corrections |
| **Écrit** | `workouts` / données jour |

---

### 5.7 Sport › Programme — `program`

| | |
| --- | --- |
| **UI** | `ProgramTab` |
| **Données** | `programs`, `activeProgram`, historique programmes, quiz / features `src/features` (budgets hebdo, street skill…) |
| **Écrit** | `WorkoutTrackerContextDB` + workout data liée |

---

### 5.8 Sport › Addiction — `addiction-quit`

| | |
| --- | --- |
| **UI** | `AddictionQuitTab` |
| **Données** | Suivi abstinence / courbes (storage dédié + éventuel croisement dates) |
| **Écrit** | Entrées abstinence / jalons |

---

### 5.9 Sport › Nutrition — `nutrition`

**Sections UI réelles** (`NutritionTab` `activeSection`) :

| Section | Contenu typique | Données |
| --- | --- | --- |
| `journal` | Suivi quotidien repas / hydratation | `dailyMeals`, `meals`, `hydrationLog` |
| `programs` | Programmes nutrition | `programs` nutrition ; lien `progressEntries` + programmes sport |
| `analyses` | Analyses macros / tendances | Agrégats meals + goals |
| `gamification` | Badges / XP nutrition | `gamification` |
| `challenges` | Défis | gamification / règles défis |
| `progress` | Photos progression nutrition | `progressPhotos` |
| `sharing` | Partage coach | `shareLinks` ; `CoachDashboard` |

APIs externes possibles : recherche aliments / cache `apiCache` ; queue offline `offlineQueue`.

> `SUBTAB_CONFIGURATIONS.nutrition` (`daily|analysis|goals`) est **en retard** sur ces sections.

---

### 5.10 Sport › Exercices — `exercises`

| | |
| --- | --- |
| **UI** | `ExercisesTab` |
| **Données** | Banque exercices / GIFs (`dossiergifs`, enrichissements) ; ajout aux programmes (`BankAddToProgramModal`) |
| **Écrit** | Programmes / favoris selon flux |

---

### 5.11 Sport › Progress (suivi corporel) — `progress`

**Sections** (`progress.activeSection`, défaut `metrics`) :

| Section | Données |
| --- | --- |
| `metrics` | `progressEntries` poids / mesures |
| `photos` | Photos + `MuscleImagesDB` / caches pagination & analyse |
| `impedance` | Impédancemétrie dans progress entries |
| `summary` | Synthèse mesures |
| `reminders` | Rappels saisie |
| `correlations` | Corrélations mesures ↔ entraînement / nutrition |
| `predictions` | Prédictions trajectoire |
| `stability` | Stabilité métriques |
| `insights` | Insights corps |
| `comments` | Commentaires / notes |

Docs domaine : `docs/body-tracking/*`.

---

### 5.12 Sport › Endurance — `endurance`

**Sous-vues** (`enduranceState.activeTab`) :

`boxing` · `pushups` · `swimming` · `jumprope` · `gainage` · `running` · `walking` · `trophies` · `circuits` · `gtg` · `pyramid` · `performance` · `calendar`

| | |
| --- | --- |
| **Données** | `enduranceData.sessions.*` ; GTG (`gtgService`) ; trophées running ; circuits ; sync vers `reps`/`checkedExercises` ; Garmin cardio pour courses/marche quand dispo |
| **Écrit** | Sessions endurance + ledgers sync (`repWorkoutSync`, `gtg.workoutSync`) |

---

### 5.13 Sport › Calendrier — `calendar`

| | |
| --- | --- |
| **UI** | `CalendarTab` |
| **Données** | Jours d’entraînement (reps, checks, endurance, Garmin activités) ; régularité ; éventuels mocks filtrés (`calendarUtils`) |
| **Écrit** | Variantes jour / repos dynamique selon settings |

---

### 5.14 Sport › Charts — `charts`

| | |
| --- | --- |
| **UI** | `ChartsTab` |
| **Données** | Séries dérivées du snapshot + endurance (+ Garmin selon graphiques) |
| **Écrit** | Prefs d’affichage |

---

### 5.15 Sport › Performance challenges — `performance-challenges`

| | |
| --- | --- |
| **UI** | `PerformanceChallengesTab` (aussi panneau dans Endurance) |
| **Données** | Défis / records dérivés séances + endurance |
| **Écrit** | Progression défis |

---

### 5.16 Sport › Analytics hub — `sport-analytics`

| | |
| --- | --- |
| **UI** | `SportAnalyticsHubTab` (remplace legacy stats/history/predictions/smart-balancing) |
| **Données** | Snapshot workout, historique, moteurs stats/prédictions/équilibre IA |
| **Écrit** | Prefs panels |

---

### 5.17 Sport › Garmin — `garmin`

**Sous-onglets** (`garmin.activeSubTab`) :

| ID | Rôle | Données |
| --- | --- | --- |
| `dashboard` | Vue synthèse | dailyMetrics + activités récentes |
| `activities` | Liste activités | store `activities` |
| `metrics` | Métriques jour | `dailyMetrics` (pas, sommeil, FC, stress, body battery, SpO2…) |
| `charts` | Graphiques période | séries filtrées période / dates custom |
| `settings` | Sync / device | `deviceMeta`, forced ranges, historique auto-sync |

Pipeline : `garmin-server` → sync client → `GarminDataDB` → `useGarminData` / `loadAllData`.  
Docs : `docs/garmin/*`.

---

### 5.18 Quêtes — `quests`

**Sous-onglets UI** :

| ID | Rôle |
| --- | --- |
| `today` | Quêtes du jour |
| `week` | Semaine |
| `quests` | Catalogue « Mes quêtes » |
| `stats` | Statistiques |
| `security` | Sécurité / export sensible |
| `calendar` | Calendrier validations |

| | |
| --- | --- |
| **Moteur** | `useQuietQuestEngine` |
| **Données** | `allQuests`, `validations` / `validationsByDate`, `dailyPerformances`, `userData`, localisation prière |
| **État** | `quests.activeSubTab` |
| **Écrit** | Persistance quêtes + validations (engine flush) |

---

### 5.19 Apprentissage — `apprentissage`

**Sous-onglets** : `matieres` · `sessions` · `trophees` · `calendrier`

| | |
| --- | --- |
| **Données** | Stores `subjects`, `progression`, `sessions_history`, `planner`, `timer` (dans `WorkoutTrackerDB` via `apprentissageDbGateway`) |
| **Écrit** | Matières, sessions, planner, timer |

---

### 5.20 Rubik’s — `rubiks`

**Sous-onglets** : `solve` · `timer` · `methods` · `settings`

| | |
| --- | --- |
| **Données** | Modèle cube `src/lib` (moves, notation) ; chronos / méthodes (storage local du module) |
| **Écrit** | Temps, prefs méthodes |

---

### 5.21 Livres — `books`

**Sous-onglets UI** : `library` · `statistics` · `calendar` · `bookfinder`

| | |
| --- | --- |
| **Données** | Store books (`useBooksStorage` / `booksDbGateway`) ; assets PDF/images `WorkoutTrackerBooksAssets` ; sessions de lecture (stats) ; covers |
| **État** | `books.activeSubTab` (défaut `library`) |
| **Écrit** | Livres, pages lues, préférences stats |

---

### 5.22 Knowledge — `knowledge`

| | |
| --- | --- |
| **UI** | `KnowledgeTab` |
| **Données** | `momentum_knowledge_v1` (catégories, vidéos/blobs, articles, notes) ; API backend `api_v1_knowledge.py` si sync remote |
| **Écrit** | Contenu knowledge local + éventuellement serveur |

---

### 5.23 Code — `code-*`

| Sous-onglet | Données |
| --- | --- |
| `code-calendar` | Activité / contributions (GitHub settings si configuré) |
| `code-journal` | `MomentumCodeDB` entries |
| `code-stats` | Agrégats journal + calendrier |

État : `code.lastSubTab`.

---

### 5.24 Finance — `finance`

**Sous-onglets** (défaut cache `bourse`) :

| ID | Composant | Bases / données |
| --- | --- | --- |
| `bourse` | `BourseSubTab` | `FinanceDB` portfolio, Yahoo cache, rates |
| `budget` | `BudgetSubTab` | `BudgetDB` revenus, catégories, dépenses, charges |
| `investissements` | `InvestissementsSubTab` | `InvestissementsDB` or, liquidités, crypto, allocation |
| `smart-shopping` | `SmartShoppingSubTab` | Listes / comparaisons (module shopping) |
| `planificateur` | `PlanificateurSubTab` | `PlanificateurDB` salaire, répartition, objectifs |
| `calendrier` | `FinanceCalendarView` | Échéances croisées budget / planificateur |
| `synthese` | `SyntheseSubTab` | `SyntheseDB` patrimoine, projections, épargne |

État : `finance.activeSubTab`. Provider : `FinanceProvider`.

---

### 5.25 Paramètres — `settings`

Sections (ancres `settings-*`) — non exhaustif fonctionnel :

Quiz · Profil · GitHub · Spotify · Garmin · Verrouillage · Apparence (accueil, XP, fonds app) · Fonds d’écran · Carte profil · Bannières · Citations · Export · Quêtes · Livres · Budget · Apprentissage · Import · Nettoyage · Navigation swipe · Repos dynamique · Langue · Prière · Infos

| | |
| --- | --- |
| **Données** | Touche presque tous les stores (export/import) ; prefs localStorage ; AppLock DB ; apparence home |
| **Écrit** | Prefs + opérations import/export destructives |

---

### 5.26 Auth / Pricing / Coach

| ID | Rôle | Données |
| --- | --- | --- |
| `auth` | Connexion | Backend auth / session |
| `pricing` | Tarification plein écran | Contenu statique / offre |
| `coach` | `CoachDashboard` | Données nutrition partage / stats coach |

---

## 6. Backend (`backend/`)

| Fichier | Rôle |
| --- | --- |
| `zlib_server.py` | Serveur principal (auth, routes, nav prefs) |
| `api_v1_knowledge.py` | API knowledge |
| `api_v1_xp.py` / `xp_port.py` | XP |
| `api_v1_phase2.py` | Phase sync / features v1 |
| `api_v1_meta.py` | Meta |
| `knowledge_store.py` | Store knowledge serveur |
| `r2_storage.py` | Stockage objet |
| `supabase_remote.py` | Remote Supabase |

Le client reste **local-first** : la majorité des onglets fonctionnent sans backend ; le serveur enrichit auth, sync sélective, knowledge, XP.

---

## 7. Flux de données croisés (qui lit quoi)

```text
Workout snapshot ──► Today, Recap, Calendar, Charts, Analytics, Endurance sync, Nutrition (sport day)
GarminDataDB     ──► Garmin tab, Recap, Calendar/Endurance running, Dashboard
Nutrition DB     ──► Nutrition, Recap (si prêt), Progress correlations, Coach
Progress entries ──► Progress tab, Nutrition programmes, Recap jalons poids
Books DB         ──► Books, Dashboard reading modules
Quests engine    ──► Quests, Dashboard quests
Finance DBs      ──► Finance subtabs, Dashboard patrimony
```

---

## 8. Comment maintenir ce document à jour

1. Après ajout/suppression d’un onglet : mettre à jour `Navigation.jsx` **et** ce fichier (sections 2 et 5).  
2. Après nouveau store IndexedDB : section 4.  
3. Ne pas faire confiance à `SUBTAB_CONFIGURATIONS` seul — vérifier le composant Tab.  
4. Pour le détail métier d’un moteur (Récap, Garmin sync, Nutrition) : renvoyer vers le doc spécialisé, ne pas dupliquer.  
5. Régénérer une passe « fraîcheur » en confrontant `SPORT_SUB_TAB_IDS` + `renderTabContent` + listes `subTabs` de chaque Tab.

---

## 9. Renvois utiles

| Sujet | Doc / code |
| --- | --- |
| Moteur analyses Récap | `docs/recap-analyse-architecture.md` |
| Objectifs qualité analyses | `docs/analyse/but a atteidnre en temre danalyses .md` |
| Garmin | `docs/garmin/` |
| Nutrition | `docs/nutrition/ARCHITECTURE_NUTRITION.md` |
| Sync multi-device | `docs/sync/` |
| Body tracking | `docs/body-tracking/` |
| ZIP portable / release download | `docs/RELEASE_PORTABLE_ZIP.md` · `npm run package:portable` |
| Switch onglets | `src/App.jsx` L313–401 |
| Liste Sport | `src/constants/sportSubTabs.js` |

---

*Fin du référentiel — généré depuis le graphe graft + sources listées, aligné sur le code du 2026-10-07.*
