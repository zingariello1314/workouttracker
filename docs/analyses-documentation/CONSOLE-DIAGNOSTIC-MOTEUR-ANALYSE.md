# Console diagnostic · moteur d’analyse — architecture & inventaire

Document d’architecture de la **console de développement** Momentum dédiée au moteur Sport → Récap → Analyse.  
Inventaire exhaustif de ce qu’elle montre, comment elle fonctionne, et des panneaux satellites liés.

> Captures UI vérifiées le **2026-11-04** sur profil réel (`localhost:3001`, mode DEV) : run 30 jours → **90** candidats registre, **31** sélectionnées, **24** intermédiaires, **34** déclassées, **0** rejetées, Garmin **branché** (87 j.), durée **2901 ms**.

---

## 1. À quoi sert cette console ?

Ce n’est **pas** l’onglet Analyse utilisateur. C’est un **studio d’observabilité** qui :

1. Relance le **même pipeline** que l’UI Analyse (`buildAdaptiveRecapInsights` avec `collectDiagnostic: true`).
2. **N’écrit pas** l’historique d’insights (`persistHistory: false`) pour éviter de polluer la mémoire éditoriale.
3. Produit un **rapport enrichi** (registre, étapes, données, familles, corrélations, absences, limites).
4. Permet d’**inspecter un candidat** couche par couche : bruts → groupes → découverte → preuves → texte → sélection.

Objectif métier annoncé dans l’UI :

> *Localiser le défaut (données / calcul / découverte / rédaction / sélection) avant de retoucher le vocabulaire.*

---

## 2. Accès & gating

| Condition | Effet |
|---|---|
| `import.meta.env.DEV` | Accès console + panneau debug Récap |
| Compte **admin** (`isAdminUser`) | Idem en build non-DEV |
| Sinon | Bannière « réservée au mode développement ou au compte admin » |

### Chemins d’entrée

1. **Récap → Analysis** (sous-onglet) → bouton  
   `Ouvrir la console diagnostic moteur d’analyse`  
   → `setActiveTab('dev-analysis-engine')`  
   Fichier : `src/components/sport/recap/views/RecapAnalyseDetails.jsx`

2. **Onglet applicatif** `dev-analysis-engine` monté dans `src/App.jsx` (lazy load) :

```jsx
case 'dev-analysis-engine':
  // Console diagnostic moteur d’analyse — DEV ou admin uniquement
  return <AnalysisEngineConsole />;
```

Offset layout dédié : `mainOffsetByTab['dev-analysis-engine'] = '-480px'` (moins remonté que les autres onglets).

Il n’y a **pas** de deep-link URL stable (`?tab=…` n’active pas automatiquement cet onglet) : l’entrée passe par la navigation React.

---

## 3. Carte des fichiers

```
UI
├── src/components/dev/AnalysisEngineConsole.jsx     (~2400 lignes) — shell + 9 modules + inspecteur forensique
├── src/components/dev/AnalysisEngineConsole.css     — thème « aec-* »
├── src/components/dev/AnalysisEnginePipelinePanel.jsx — module Pipeline (flux / table / perf)
└── src/components/sport/recap/RecapTrainingStateDebugPanel.jsx — panneau satellite dans Récap Analyse

Rapport
├── src/utils/sport/analysisEngineDiagnostic.js      — buildAnalysisEngineDiagnosticReport()
├── src/utils/sport/analysisEngineDiagnosticModel.js — enrichissement affichage (statuts, registre, familles…)
├── src/utils/sport/analysisEnginePipelineModel.js   — normalisation étapes + historique local runs
├── src/utils/sport/analysisEngineFindingForensics.js — buildFindingForensics(row, report)
├── src/utils/sport/analysisEngineDataCatalog.js     — catalogue sources par onglet
└── src/utils/sport/recapSelectionDiagnostics.js     — labels familles / resolveAnalysisFamily

Exécution hors thread
├── src/utils/sport/recapDiagnosticWorkerClient.js   — requestDiagnosticViaWorker / cancel
└── src/workers/recapDiagnostic.worker.js            — build + enrich dans le Worker

Tests
├── src/utils/sport/__tests__/analysisEngineDiagnostic.test.js
└── src/utils/sport/__tests__/analysisEngineDiagnosticModel.test.js
```

---

## 4. Architecture d’exécution (flux)

```
┌──────────────────────────── UI (AnalysisEngineConsole) ────────────────────────────┐
│  Période + vs + « Lancer / Relancer »                                               │
│  Charge snapshot (useWorkout) + Garmin (useGarminData / useRecapCrossCoachGarmin)   │
│  Injecte insightHistory depuis localStorage (UI)                                    │
└───────────────────────────────────┬────────────────────────────────────────────────┘
                                    │ requestDiagnosticViaWorker(payload)
                                    ▼
┌──────────────────────────── Worker (recapDiagnostic.worker) ───────────────────────┐
│  nameMap sérialisé (pas de getExerciseNameById dans le Worker)                      │
│  buildAnalysisEngineDiagnosticReport({…, collectDiagnostic via adaptive})           │
│  enrichDiagnosticReport(report)                                                     │
└───────────────────────────────────┬────────────────────────────────────────────────┘
                                    │ postMessage({ report })
                                    ▼
┌──────────────────────────── UI hydrate ────────────────────────────────────────────┐
│  KPI strip · Modules · Registre · DetailInspector (forensics) · Export JSON/MD      │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### Pipeline métier observé (dans le rapport)

`buildAnalysisEngineDiagnosticReport` enchaîne notamment :

1. **`computeRecapUserAssessment`** — état / phénomènes / identité
2. **`buildRecapEnrichmentBundle`** — métriques d’enrichissement Recap
3. **`buildAdaptiveRecapInsights({ collectDiagnostic: true, persistHistory: false })`** — découvertes période + sélection narrative
4. Annotation des candidats (`annotateCandidate`) → packs `shown` / `produced` / `discoveries` / `rejections`
5. **`buildAnalysisEngineDataCatalog`** — inventaire des sources
6. **`enrichDiagnosticReport`** — registre unifié, familles, corrélations, opportunités, `stagesDetailed`

Point critique documenté dans le code (`displayScopeNote`) :

> *Sélectionnée = pack final de **CE** run diagnostic. Ce n’est **pas** une preuve que la carte est rendue dans l’onglet Analyse.*

---

## 5. Shell UI — contrôles globaux

Fichier : `AnalysisEngineConsole.jsx`

### Barre du haut

| Contrôle | Rôle |
|---|---|
| Sélecteur **Période** | `today`, `7d`, `30d`, `3m`, `6m`, `1y`, `all` (`DIAGNOSTIC_PERIODS`) |
| Sélecteur **vs** | Deuxième période optionnelle → `compareDiagnosticOverviews` |
| **Lancer / Relancer** | Lance le Worker (aucun recalcul auto à l’ouverture — F7.0e) |
| **JSON** | Télécharge le rapport complet |
| **MD** | Export résumé (counts + limites) |
| **Copier** | Clipboard JSON de la ligne sélectionnée |
| Pastille run | Idle / busy / prêt |

### Bandeau KPI (après run)

| KPI | Signification |
|---|---|
| Période + fenêtre | Labels + `window.start → window.end` |
| Sélectionnées | `registry.counts.shown_now` — pack diagnostic |
| Interméd. | Retenues à une étape, hors pack final |
| Déclassées | Caps / rivaux / dédup / gate |
| Rejetées | Validation / insuffisance / erreur |
| Garmin | `branché` / `partiel` / `sans signal` / `off` + jours steps |
| Durée | `overview.totalMs` |

Exemple live (30 j., 2026-10-06 → 2026-11-04) : **31 / 24 / 34 / 0**, Garmin branché, **2901 ms**.

### Navigation modules (gauche)

Constante `SECTIONS` :

| id | Label UI | Compteur nav |
|---|---|---|
| `overview` | Vue d’ensemble | `shown_now` |
| `registry` | Registre | total candidats uniques |
| `pipeline` | Pipeline | `stagesDetailed.length` |
| `data` | Données | items catalogue |
| `families` | Familles | familles analytiques |
| `correlations` | Corrélations | relations lab |
| `gaps` | Absences | opportunités |
| `prose` | Texte final | `shown_now` |
| `limits` | Limites | textes de limites |

### Pied de console (`aec-statusline`)

État (Idle / Exécution / Prêt) · `generatedAt` · durée · warnings · erreurs d’étapes · kind sélectionné.

---

## 6. Module par module — ce que l’on voit en détail

### 6.1 Vue d’ensemble

- Légende des **statuts diagnostic** (`DIAG_STATUS_META`).
- Rappel explicite : pack diagnostic ≠ cartes rendues dans Analyse.
- Comparaison de périodes si `vs` renseigné (Δ affichés / rejetés / signaux).
- **Piste pipeline cliquable** (8 premières étapes) → bascule vers module Pipeline.
- Warnings globaux (données manquantes, familles « starvées »…).
- Sources de données (version courte) + lien vers module Données.
- Top étapes les plus lentes (barres).

### 6.2 Registre des analyses (cœur)

Deux layouts :

1. **Par famille** (cartes groupées, collapse, max 40 cartes/groupe puis invite à filtrer).
2. **Table dense** paginée (`PAGE_SIZE = 24`) : Statut · Famille · Titre · Kind · Raison, tri colonnes.

Filtres rapides (`QUICK_FILTERS`) :

| Filtre | Critère |
|---|---|
| Toutes | — |
| Sélectionnées | `diagStatus === shown_now` |
| Intermédiaires | `intermediate` |
| Déclassées | `demoted` |
| Rejetées | `rejected` |
| Sans preuve | `evidenceCount === 0` |
| Redondances | même préfixe titre/body 48 car. ≥ 2 |
| Transversales | `isCrossFamily` |
| Non traçables | `unknown` |

+ recherche texte (id / kind / family / title / body / reason)  
+ filtre famille.

Chaque carte / ligne ouvre l’**inspecteur forensique** (panneau droit).

### 6.3 Pipeline (`AnalysisEnginePipelinePanel`)

Trois modes :

| Mode | Contenu |
|---|---|
| **Flux** | Cartes d’étapes ordonnées, connecteurs de perte (`−N`), barre de part de temps |
| **Tableau** | Filtre statut / recherche / tri (order, ms, in/out…) |
| **Performance** | Focus coût |

KPIs pipeline : étapes exécutées, durée chronométrée, plus coûteuse, pertes mesurables, répartition OK/warn/error.

**Historique local** des runs (`loadPipelineRunHistory` / `pushPipelineRunHistory`) pour comparer deux exécutions (`comparePipelineRuns`).

Chaque étape expose typiquement : `id`, `label`, `module`, `stageStatus`, `ms`, `inCount`/`outCount`, unité de compte, warnings/errors, sémantique des compteurs (agrégats ≠ candidats).

### 6.4 Données

Catalogue issu de `analysisEngineDataCatalog` :

- Totaux : sources / ok / sparse / missing.
- Section **Absences** avec `fixHint` (« Que faire »).
- Groupes **par onglet** d’origine (`tab › subtab`), chemin `originPath`, champs, `usedBy`, `n` / `nInPeriod`.
- Fallback table `dataInventory` si pas de `byTab`.

Statuts données (`DATA_STATUS_META`) : Exploitées, Présentes non utilisées, Couverture faible, Invalides, Manquantes, Exclues, Provenance inconnue, Erreur, Non instrumenté.

### 6.5 Familles

Pour chaque famille analytique :

- Affichées / produites / intermédiaires / filtrées  
- `% du pack` = part des textes **affichés ce run** (pas des candidats produits)  
- Clic → ouvre le Registre filtré sur cette famille.

### 6.6 Corrélations

- **Matrice** familles × familles :  
  `✓` calculated · `~` not_triggered · `×` not_implemented · `∅` impossible_with_data
- Table détail : relation, statut, certitude, data G/D, kinds matchés, note.
- Sous-liste **sommeil publié** (`signals.correlations`).

Règle UI : jamais présenter une simple coexistence comme une corrélation calculée.

### 6.7 Absences

Opportunités / écarts (`report.opportunities`) groupés par `kind` — **jamais** présentés comme analyses générées.  
Liens vers Corrélations / Registre.

### 6.8 Texte final

Vue « prose » forcée sur filtre `shown_now` : cartes titre + body + flags qualité (`thin_copy`, `overconfident`, `deferred_reasoning`, etc.).  
Inspecteur forensique disponible sous la grille.

### 6.9 Limites

Liste `report.limits` regroupée heuristiquement :

- données · traçabilité · logique · fiabilité · performance · autres

Inclut la note de scope d’affichage (`meta.displayScopeNote`).

---

## 7. Inspecteur forensique d’un candidat

Composant `DetailInspector` + `ForensicLayerBody`  
Données : `buildFindingForensics(row, report)`.

### Onglets

| Onglet | Contenu détaillé |
|---|---|
| **Général** | Empile les couches 1→6 (stack) avec lien « Isoler → » |
| **Chaîne** | 6 étapes instrumentées / trou ; preview body + evidence |
| **1 · Bruts** | Dates distinctes, enregistrements listés, prev→date, gap / médiane / ratio |
| **2 · Groupes** | Séries / séances / jours + agrégats numériques |
| **3 · Découverte** | Kind, type/factId, nature, étape, producteur, score/poids/pertinence, match discoveries, exercice + id, brouillon, **trajectoire** (primaryStory, path, shape, installation, mécanisme séries, témoins, implication, richesse, temporalScope, positions, legacy body), displaceLog / droppedBy, parcours producteur, scope JSON |
| **4 · Preuves** | Preuves textuelles + slots numériques présents dans le texte |
| **5 · Texte** | Producteur, kind, étape, tone, nature, horizon ; texte final ; flags ; parcours ; chaîne de rédaction ; brouillon pré-gate ; transform titre ; règles éditoriales ; companions même jour ; slots bound/unbound ; phrases/claims (hedges / chiffre) |
| **6 · Sélection** | Statut registre + pipeline, raison, horizon, poids/score, pack current_run ?, noveltyKey, evidenceFamilyId, étape finale, bucket famille, caps JSON |
| **JSON** | Dump `{ row, forensics }` |

Indices de défaut (`defectHints`) : pastilles pointant la couche suspecte (données / copy / sélection…).

---

## 8. Statuts diagnostic (modèle)

`analysisEngineDiagnosticModel.js` — `DIAG_STATUS` :

| Code | Label UI | Sens |
|---|---|---|
| `shown_now` | Sélectionnée (pack diagnostic) | Dans le pack final **de ce run** |
| `intermediate` | Candidate intermédiaire | Générée / retenue partiellement |
| `demoted` | Déclassée / filtrée | Caps, rivaux, dédup, gate… |
| `rejected` | Rejet / validation | Insuffisance, invalid, erreur |
| `unknown` | Non déterminé | Instrumentation incomplète |
| `cross` | Transversale | Croisement multi-familles (badge) |

Mapping brut → diag : `mapRawStatusToDiag` (`shown`, `discovery_selected`, `discovery_dropped`, raisons `cap`/`rival`/`dedup`, etc.).

---

## 9. Rapport — structure utile

Sortie de `buildAnalysisEngineDiagnosticReport` puis `enrichDiagnosticReport` :

```text
report
├── meta { generatedAt, period, samePipeline, sideEffectsSuppressed,
│         insightHistoryInjected, insightHistoryEntryCount, displayScopeNote }
├── overview { window, signalsDetected, candidates*, totalMs, warnings, signature… }
├── stages / stagesDetailed / pipelineSummary
├── dataInventory / dataCatalog / dataCatalogShort
├── signals { phenomena, sleep*, milestones*, correlations }
├── candidates { discoveries, produced, shown }
├── rejections[]
├── selectionDiagnostics
├── quality { shownFlags, deferredShown }
├── registry { rows[], counts{ total, shown_now, intermediate, demoted, rejected, unknown } }
├── families[]
├── correlations[]
├── opportunities[]   ← module Absences
├── limits[]
├── insights          ← short/medium/long du run
└── raw { periodDiscoveriesDebug, caps, candidateStages counts }
```

Chaque **row** de registre porte au minimum : `registryKey`, `diagStatus`, `kind`, `family`, `title`, `body`, `decisionReason`, `evidenceCount`, `metrics`, `quality`, `producerHint`, flags transversalité, etc.

---

## 10. Worker — détail technique

### Client (`recapDiagnosticWorkerClient.js`)

- Instancie `new Worker(…/recapDiagnostic.worker.js, { type: 'module' })`.
- Annule la requête précédente avant un nouveau run.
- Sérialise `nameMap` via `buildExerciseNameMap`.
- **Injecte** `insightHistory` + `lastInsightSignature` depuis `insightNoveltyStore` (le Worker n’a pas `localStorage`).
- Codes d’erreur : `unavailable`, `cancelled`, `error`, `runtime`.

### Worker (`recapDiagnostic.worker.js`)

- Message `diagnostic` → build + enrich → `result`.
- Message `cancel` → ignore le résultat.
- Renvoie `workerMs` + `contractVersion` (`RECAP_ADAPTIVE_WORKER_CONTRACT`).

### Coop UI

`browserYieldFrame()` avant / après hydratation du gros rapport (F7.0h) pour ne pas geler le thread principal.

---

## 11. Panneau satellite — « Moteur d’interprétation (dev) »

Fichier : `RecapTrainingStateDebugPanel.jsx`  
Visible dans Récap → Analysis **au-dessus** du bouton console (même gating DEV/admin).

Accordion qui montre l’état d’interprétation **déjà calculé** pour la période Recap courante (pas un second pipeline Worker) :

| Bloc | Contenu |
|---|---|
| Chips phase / coût / tier / signature / rejets | `summarizeRecapRejectLog()` |
| Identité fréquence | actuel /sem · habitude · bande |
| Question de période | `periodDiscoveries.question` + nb retenues |
| Parcours athlète | startYmd, jours, reps, narratives progress |
| Découvertes période | selected chips (nature · score · titre · evidence) |
| Fiabilité / methodology | `reliabilityNotes` |
| Tuyau sommeil / jalons | paires, nuits, candidats détectés/retenus, droppedBy |
| Découvertes écartées | kind · nature · signalFamily · reason · score |
| Phénomènes | type, nature, signaux, priorité |
| Axes d’état | Exposition, Sortie, Récup., Fatigue, Adhérence, Réponse |
| Features JSON | `trainingState.features` |
| Fenêtre précédente | résumé load/performance/recovery |
| Transitions / Événements / Robustesse | chips |
| Comparaisons hiérarchiques | populationComparisons |
| Interprétations composées | composedInterpretations |

Ce panneau et la console **se complètent** : le premier observe le résultat déjà branché sur l’onglet Analyse ; la seconde **rejoue** le pipeline en mode diagnostic instrumenté.

---

## 12. Comment ça « décide » ce qu’on voit (rappels)

1. Production : `periodDiscoveries` + producteurs P3.x / sleep / milestones / GTG… via `buildAdaptiveRecapInsights`.
2. Annotation diagnostic : statuts discovery_selected / dropped / shown / rejected.
3. Enrichissement modèle : unification registre + compteurs exclusifs.
4. UI : filtres / familles / forensics — **aucune règle métier nouvelle**.

Toute correction de qualité d’analyse doit donc se faire dans les modules métier (producteurs, sélection, gate), pas dans la console — la console sert à **prouver** où ça casse.

---

## 13. Exports

### JSON

Fichier `analysis-engine-diag-{period}-{timestamp}.json` = rapport entier (idéal pour diffs avant/après refactor).

### Markdown

```markdown
# Diagnostic moteur — {period}
- Généré : …
- Sélectionnées / Intermédiaires / Déclassées / Rejetées
- Durée
## Limites
- …
```

### Copier

JSON de la **row** sélectionnée uniquement.

---

## 14. Séquence utilisateur typique

1. Ouvrir **Récap → Analysis** (période voulue).
2. (Optionnel) Déplier **Moteur d’interprétation (dev)** pour l’aperçu local.
3. Cliquer **Ouvrir la console diagnostic…**
4. Choisir période (+ vs si comparaison).
5. **Lancer le diagnostic** (attendre Worker ~1–10+ s selon fenêtre).
6. Lire KPI → **Registre** filtré (ex. Déclassées / Sans preuve).
7. Cliquer une carte → forensics couches 1→6.
8. Si doute perf → **Pipeline** mode Performance.
9. Si doute source → **Données** / Absences.
10. Exporter **JSON** pour archive ou ticket.

---

## 15. Pièges à connaître

1. **Vert ≠ visible dans Analyse** — pack diagnostic du run, pas le DOM Analyse.
2. **Pas de run auto** à l’ouverture — il faut cliquer Lancer/Relancer.
3. **Historique insights** : injecté depuis l’UI ; si `hist. 0`, le scoring mémoire peut différer d’une session Analyse déjà « chauffée ».
4. **Worker obligatoire** : si indisponible → message de rechargement.
5. **Unités pipeline hétérogènes** : in/out d’une étape peuvent être des bundles, pas des candidats — lire `countSemantics`.
6. **Onglet `2y`** absent des `DIAGNOSTIC_PERIODS` console (today…all seulement).

---

## 16. Glossaire rapide

| Terme | Définition |
|---|---|
| Pack diagnostic | Ensemble `shown` / `shown_now` du run |
| Déclassée | Produite puis écartée (cap, rival, gate, IV…) |
| Intermédiaire | Vivante hors pack final |
| Forensics | Remontée instrumentée d’un candidat |
| Famille analytique | Bucket éditorial (`resolveAnalysisFamily`) |
| Kind | Identifiant de type de découverte (`disc_…`) |
| Evidence slot | Chiffre metrics retrouvé dans le texte |

---

## 17. Références code (ancres)

| Sujet | Fichier · zone |
|---|---|
| Shell console | `AnalysisEngineConsole.jsx` L1013+ |
| Sections / filtres | L77–109 |
| Forensics UI | L177–858, L860–958 |
| Build rapport | `analysisEngineDiagnostic.js` L127–488 |
| Statuts | `analysisEngineDiagnosticModel.js` L12–76 |
| Forensics data | `analysisEngineFindingForensics.js` L224+ |
| Worker | `recapDiagnostic.worker.js` |
| Entrée App | `App.jsx` case `dev-analysis-engine` |
| Bouton Récap | `RecapAnalyseDetails.jsx` ~L178–193 |
| Debug interprétation | `RecapTrainingStateDebugPanel.jsx` |

---

*Document généré pour inventaire architecture console — à mettre à jour si de nouveaux modules SECTIONS ou couches FORENSIC_TABS sont ajoutés.*
