# Rapport complet — Architecture et chronologie du moteur d’analyses Momentum Sport

**Date / heure du document :** 1er novembre 2026, 00:42 (Europe/Paris)  
**Profil live inspecté :** `zingariello1314` (session connectée, données réelles)  
**Console :** `http://localhost:3001` → Sport → Recap → Console diagnostic moteur  
**Contraintes respectées tout au long :** aucun commit Git imposé pour les phases P3.x ; pas de chantier fluidité / refonte UI ; un seul pipeline E0.

Ce document synthétise **tout le parcours documenté** depuis les fondations jusqu’à P3.6, **l’architecture complète** du moteur, et une **lecture live par plage** (7j / 30j / 3m) réalisée dans le navigateur le 1er novembre 2026.

---

## Sommaire

1. [Chronologie complète (première → dernière partie)](#1-chronologie-complète)
2. [Architecture complète du moteur](#2-architecture-complète-du-moteur)
3. [Fonctionnement détaillé par couche](#3-fonctionnement-détaillé-par-couche)
4. [Phases P3.0 → P3.6 — ce qui a été livré](#4-phases-p30--p36)
5. [Inspection navigateur live (1er nov. 2026)](#5-inspection-navigateur-live)
6. [Garanties vs limites](#6-garanties-vs-limites)
7. [Index des documents et fichiers code](#7-index-des-documents-et-fichiers-code)

---

## 1. Chronologie complète

### 1.1 Fondations (fin octobre 2026)

| Étape | Document / livrable | Intention |
|-------|---------------------|-----------|
| Mission majeure | `MISSION-MAJEURE-MOTEUR-ANALYSE-APPROFONDI.md`, `PLAN-MISSION-MAJEURE-MOTEUR-ANALYSE.md` | Raisonnement d’abord ; Finding ≠ profondeur (R1–R4) |
| Inventaire corrélations | `INVENTAIRE-CORRELATIONS-ANALYSES.md` | Matrice données × méthodes |
| Compte-rendu profondeur | `COMPTE-RENDU-MISSION-MAJEURE-ANALYSES.md` | Avant/après volume, assiduité, corps, GTG |
| Architecture factuelle | `ARCHITECTURE-FONCTIONNEMENT-MOTEUR-ANALYSES-2026-10-30.md` | Chaîne d’appel vérifiée dans le code |
| Inventaire console / période | `INVENTAIRE-CONSOLE-ANALYSES-PAR-PERIODE-2026-10-30.md` | Kinds et conditions par plage |

### 1.2 P0 — Trajectoire et sélection

| Étape | Document | Contenu |
|-------|----------|---------|
| Audit + corrections | `AUDIT-CORRECTIONS-P0-TRAJECTOIRE-2026-10-30.md` | Trajectoire exercice, émergence, témoins, séries |
| Validation live | `VALIDATION-P0-POST-CORRECTIONS-2026-10-30.md` | Re-run console 30j |
| Bilan sélection | `BILAN-SELECTION-DECOUVERTES-2026-10-30.md` | Conflits progress/journey, valeur informative |
| Validation finale sélection | `VALIDATION-SELECTION-FINALE-2026-10-30.md` | Pack stable, go-off P3 |

### 1.3 E0 — Fiabilisation de la sélection

| Étape | Document | Contenu |
|-------|----------|---------|
| E0 pertinence | `E0-FIABILISATION-PERTINENCE-SELECTION-2026-10-31.md` | `contentClass`, methodology ≠ publication, demote |
| E0 validation réelle | `E0-VALIDATION-REELLE-ET-P32A-LEDGER-2026-10-31.md` | Pipeline + ledger musculaire |

**Règle E0 centrale :** fiabilité ≠ droit de publication. Les cartes `methodology_limit` sont déclassées vers les notes de fiabilité, pas forcées en tête de pack.

### 1.4 P3 — Adhérence × progression × plan × habitudes

| Phase | Document(s) | Statut |
|-------|-------------|--------|
| **P3.0** Socle matrice plan×réalisé | `P3.0-SOCLE-…`, `VALIDATION-P3.0-…` | Validé (snapshots only pour taux) |
| **P3.1** Découvertes adhérence×progression | `P3.1-…`, `VALIDATION-P3.1-…` | Validé |
| **P3.2** Conception musculaire | `P3.2-AUDIT-…`, `P3.2-REVUE-…` | Conception |
| **P3.2a** Identités + golden ledger | `P3.2a-CLOTURE-…` | Clôturé (reverse hash IDs) |
| **P3.2b** Découvertes musculaires | `P3.2b-DECOUVERTES-…`, `P3.2b-CLOTURE-…` | Clôturé |
| **P3.3** Capture plan sans activité | `P3.3-CAPTURE-…`, `P3.3-VERIFICATION-FINALE-…` | Partiellement validé (proven only) |
| **P3.4** Journal de révisions programme | `P3.4-REVISION-PROGRAMME-JOURNAL-…` | Journal `programRevisionLog` ; pas de rétro-invention |
| **P3.5** GTG × écarts × ressenti | `P3.5-GTG-ECARTS-RESSENTI-…` | Clôturé (sync per-key, dénominateurs) |
| **P3.6** Habitudes comportementales | `P3.6-HABITUDES-COMPORTEMENTALES-CONCEPTION-…`, `P3.6-HABITUDES-IMPLEMENTATION-…` | Clôturable sous réserves |

### 1.5 Correctifs de clôture P3.6 (nuit du 31 oct. → 1er nov.)

1. **Anti-pic** sur `disc_p36_freq_vs_volume_weekday` : si n&lt;3 et `min(valeurs) < seuil`, abstention `load_arm_spike_sensitive` (cas samedi 30j : 332 / 536).  
2. **`strengthClass`** : `punctual_limited` / `descriptive_tendency` / `repeated_habit`.  
3. **Abstention régularité si 0 %** : profil vide ne publie plus « tous les jours à 0 % » (`no_classic_activity_in_window`) — bug observé en console guest, corrigé + test.  
4. Formulations ancrées dans l’**enregistré** (≠ inactivité physique prouvée).

---

## 2. Architecture complète du moteur

### 2.1 Vue d’ensemble

```
UI Recap / Console diagnostic (#dev-analysis-engine)
        │
        ▼
getRecapDateWindow(period)          → { start, end }
        │
        ▼
buildAdaptiveRecapInsights
        │
        ├─ buildComposedInterpretationPipeline
        │     ├─ état athlète, transitions, phénomènes…
        │     ├─ buildPeriodDiscoveryBundle     ★ pool unique des découvertes
        │     │     ├─ P0 / sleep / milestones / span…
        │     │     ├─ P3.0–P3.1 adhérence
        │     │     ├─ P3.2b muscles
        │     │     ├─ P3.4 révisions
        │     │     ├─ P3.5 GTG / day model
        │     │     └─ P3.6 habitudes weekday
        │     ├─ selectPeriodDiscoveriesWithTrace  ★ E0 (rivaux, demote, take)
        │     ├─ buildHorizonEssayCandidates(selected)
        │     └─ renderInterpretations → candidats colonnes
        │
        ├─ span stories + pondérations période
        ├─ filterValidInsights
        ├─ selectNarrativeColumns (short / medium / long)
        └─ insights.shortTerm / mediumTerm / longTerm
```

**Il n’y a pas de second moteur.** P3.6 s’injecte dans le même `buildPeriodDiscoveryBundle` et subit E0 comme les autres.

### 2.2 Axes sémantiques

| Axe | Valeurs |
|-----|---------|
| Période UI | `today`, `7d`, `30d`, `3m`, `6m`, `1y`, `all` (+ `2y` hors console) |
| Voix | today / week / month / long / year |
| Nature discovery | `now` / `trajectory` / `journey` |
| Horizon colonnes | `short` / `medium` / `long` |
| contentClass (E0) | `analytical` / `descriptive` / `methodology_limit` |

Mapping nature → horizon : now→short, trajectory→medium, journey→long.

### 2.3 Objet discovery (contrat)

Construit via `discovery()` puis scopé période :

- `kind` (`disc_…` / `disc_p35_…` / `disc_p36_…`)  
- `title`, `body`  
- `nature`, `family`, `contentClass`  
- `evidence`, `metrics`, `weights` (importance, reliability, novelty, fit, `informativeValue`)  
- `score` après sélection  

### 2.4 Comparaisons W / C / H

| Symbole | Sens |
|---------|------|
| **W** | Fenêtre sélectionnée |
| **C** | Fenêtre précédente de **même durée** (`previousWindowEqualSpan`) |
| **H** | Historique disponible (baselines, milestones, etc.) |

Les taux P3.6 comparent W et C seulement si le weekday a assez d’occurrences éligibles des deux côtés.

---

## 3. Fonctionnement détaillé par couche

### 3.1 Entrée période

- `getRecapDateWindow(period, now)` — `recapMuscleLoadEngine.js`  
- Produit les bornes civiles locales utilisées partout.

### 3.2 Bundle de découvertes — `buildPeriodDiscoveryBundle`

Fichier : `src/utils/sport/recapPeriodDiscoveries.js`

Responsabilités :

1. Construire les **comparaisons** de période (`buildPeriodComparisons`).  
2. Catalogue de séances, sommeil, baselines, associations repos/sommeil.  
3. Appeler les producteurs (P0…P3.6) avec flags `includeP3x…`.  
4. Fusionner dans un pool unique.  
5. Appliquer **E0** : `selectPeriodDiscoveriesWithTrace` → `selected`, `dropped`, `reliabilityNotes`.  

### 3.3 E0 — sélection

Fichiers clés :

- `recapDiscoveryContentClass.js`  
- `selectPeriodDiscoveriesWithTrace` dans `recapPeriodDiscoveries.js`  
- Tests : `recapDiscoverySelectionE0.test.js`

Mécanismes :

- Priorité thématique **sans** forcer les methodology.  
- Tri principal = `discoveryInformativeValue` puis score.  
- Groupes de **rivaux** sémantiques (une seule carte gagne).  
- Demote methodology → notes, pas pack principal.  
- Pas de quota artificiel pour P3.6.

### 3.4 Colonnes narratives

- `buildAdaptiveRecapInsights` / `selectNarrativeColumns`  
- Caps par horizon, rotation légère, familles sous-représentées (`rescueStarvedFamilySlots`).

### 3.5 Console diagnostic

- `AnalysisEngineConsole.jsx` — Relancer, registre, pipeline, familles, texte final.  
- Ouverture depuis Recap Analyse : « Ouvrir la console diagnostic moteur d’analyse ».  
- Même pipeline que l’UI (`collectDiagnostic: true`).

---

## 4. Phases P3.0 → P3.6

### 4.1 P3.0 — Matrice plan × réalisé

- `recapProgramAdherenceProgression.js`  
- Taux d’adhérence **uniquement** sur jours `planSource === snapshot`.  
- GTG hors dénominateur classique.

### 4.2 P3.1 — Cartes adhérence × progression

- `recapProgramAdherenceDiscoveries.js`  
- Relie assiduité et trajectoires sans inventer de plan.

### 4.3 P3.2a / P3.2b — Muscles

- Ledger d’identités (reverse stable hash pour IDs numériques).  
- Découvertes : contraste d’exposition, shift, structure, plan vs actual (si snapshots), limites du ledger.  
- Fichiers : `recapMuscleP32b*.js`, fixtures `p32a-closure-recalc-oct-2026.json`.

### 4.4 P3.3 — Capture de plan

- Snapshots journaliers `calendarDayPlanSnapshots`.  
- `planCompareEligible` exige applicabilité **proven**.  
- Repos prévu ≠ séance manquée.  
- Promote provisional ≠ high automatique.

### 4.5 P3.4 — Journal de révisions

- `workoutData.programRevisionLog` (`p34.v1`).  
- `journalIntroducedAt` : pas d’invention rétroactive.  
- Analyses avant/après révision seulement si comparabilité.

### 4.6 P3.5 — Day model GTG

- `buildP35DayTable` : classic exclusive **per-key** (sync GTG), coexistence, `absenceKind`.  
- Découvertes : coexistence, part mouvement, hors classique, gaps, RPE…  
- Dénominateurs explicites + invariants de partition.

### 4.7 P3.6 — Habitudes

| Module | Rôle |
|--------|------|
| `recapP36Kinds.js` | Kinds + rivaux |
| `recapP36Occasions.js` | Occasions calendaires éligibles / weekday |
| `recapP36Metrics.js` | Régularité, volume, freq≠charge, exercices, stabilité, proven |
| `recapP36Discoveries.js` | Rédaction + `strengthClass` |
| Tests | `__tests__/recapP36.test.js` (21) |
| Replays | `scripts/p36-replay-oct.mjs`, `p36-closure-check.mjs` |

**Six notions non confondues :** régularité · quantité · adhérence prouvée · évolution · stabilité · caractère remarquable.

**Dénominateur régularité :** actifs / **occurrences éligibles** (jamais / jours actifs seuls ; journée courante exclue).

**Familles publiables :** A regularity, B volume / freq_vs_volume, C exercise, D stability, E proven adherence.  
**Non livrées comme cartes :** groupe d’exercices sans champion, rupture/reprise GTG-weekday dédiée.

---

## 5. Inspection navigateur live

**Contexte :** 1er novembre 2026 · utilisateur `zingariello1314` · XP ~85 875 · ~28 924 reps pondérées · séances récentes lun. 26 (79 %), mar. 27 (53 %), ven. 30 (82 %).  
**Outil :** console diagnostic → Relancer sur `7d`, `30d`, `3m`.

### 5.1 Synthèse par plage

| Plage | Cartes « Affichée » (ordre de grandeur) | P3.6 visible ? | Lecture |
|-------|------------------------------------------|----------------|---------|
| **7j** | ~17 | Non (abstention weekday — échantillon) | Densité courte, densités, sommeil, retours d’exos, volume push/pull mono |
| **30j** | ~13 | **Oui** — `Jours habituellement actifs` (lun+mar ~75 %) | Mix P0/P3.5/P3.6 ; volume mois ; GTG coexistence ; reprises |
| **3m** | ~20 | **Oui** — `Jours habituellement actifs` (lun+ven ~76,9 %) | Trajectoire trimestre, composition musculaire, émergences, P3.6 regularity |

### 5.2 Textes P3.6 retenus (live)

**30 jours**  
« Sur cette période, lundi, mardi présentent des fréquences d’entraînement classique enregistré proches (environ 75 % des occurrences éligibles). Aucun jour unique ne se démarque assez pour être présenté comme « le » jour régulier. L’absence d’enregistrement… »

**3 mois**  
« Sur cette période, lundi, vendredi présentent des fréquences d’entraînement classique enregistré proches (environ 76,9 % des occurrences éligibles). … »

Aligné avec les replays fixture `workout-main-jul-oct-2026.json` après anti-pic : sur 30j le croisement freq≠volume (samedi 332/536) est **abstenu** ; la régularité groupée gagne.

### 5.3 Exemples d’autres cartes live (non P3.6) — pour situer le pack

**7j :** densité vs rythme mensuel ; volume sur peu de journées ; nuit plus courte ; pompes inclinées en séances comparables ; meilleure série tractions australiennes 12.  

**30j :** volume mois +9,5 % vs 30j précédents ; GTG coexistence (10 classic-only / 3 gtg-only / 1 both) ; reprise durable dips ; GTG hors planning.  

**3m :** 13 039 reps / 41 jours ; pectoraux ~16,7 % ; poussée vs tirage ; triceps +jours d’exposition ; limites ledger (0 snapshot plan muscle).

### 5.4 Observation méthodologique (session guest antérieure)

Sur profil **vide**, la console avait publié à tort une régularité « tous les jours à ~0 % ».  
**Correctif code :** `no_classic_activity_in_window` dans `summarizeWeekdayRegularity` + test dédié.  
Avec la session réelle, ce cas ne se produit plus.

---

## 6. Garanties vs limites

### Garanties testées

1. Pipeline unique E0 ; phases P3.x en producteurs, pas en moteurs parallèles.  
2. Régularité P3.6 sur occasions **éligibles**.  
3. Quantité ≠ fréquence ; anti-pic sur bras charge.  
4. Sync GTG per-key (P3.5) ; pas de double comptage.  
5. Adhérence prouvée seulement sur snapshots **proven**.  
6. Journal P3.4 non rétroactif.  
7. Tests unitaires P3.5 / P3.6 + replays fixture.  
8. Live console 7j / 30j / 3m cohérente avec les replays sur la régularité weekday.

### Limites restantes

1. Fixture / live souvent **sans** snapshots proven → familles E / plan muscle muettes ou methodology.  
2. P3.6 : pas de cartes groupe d’exercices / rupture-reprise GTG-weekday.  
3. Sur 30j live, `freq_vs_volume` n’apparaît pas (abstention anti-pic ou rivalité regularity) — conforme.  
4. Certaines formulations colonnes restent redondantes (doublons headings P0) — hors chantier fluidité / hors refonte E0 globale.  
5. Console guest ≠ profil live : toujours préciser la source des données.

---

## 7. Index des documents et fichiers code

### Documentation (dossier `docs/analyses-documentation/`)

- Lead historique : `MISSION-MAJEURE-…`, `PLAN-MISSION-MAJEURE-…`, `README.md`  
- Architecture : `ARCHITECTURE-FONCTIONNEMENT-MOTEUR-ANALYSES-2026-10-30.md`  
- E0 : `E0-FIABILISATION-…`, `E0-VALIDATION-…`  
- P3.0 → P3.6 : fichiers `P3.*-*.md` listés en §1.4  
- **Ce rapport :** `RAPPORT-COMPLET-ARCHITECTURE-ANALYSES-2026-11-01-0042.md`

### Code (principaux)

| Zone | Fichiers |
|------|----------|
| Orchestration | `recapAdaptiveInsights.js`, `recapInterpretationPipeline.js` |
| Discoveries + E0 | `recapPeriodDiscoveries.js`, `recapDiscoveryContentClass.js` |
| Essays / colonnes | `recapHorizonEssays.js`, `interpretationRenderer.js` |
| P3.0–P3.1 | `recapProgramAdherenceProgression.js`, `recapProgramAdherenceDiscoveries.js` |
| P3.2b | `recapMuscleP32b*.js` |
| P3.3 | `calendarPlanCaptureP33.js`, `calendarDayPlanSnapshot.js` |
| P3.4 | journal révision (hook programmes + discoveries associées) |
| P3.5 | `recapP35DayModel.js`, `recapP35Metrics.js`, `recapP35Discoveries.js`, `recapP35Kinds.js` |
| P3.6 | `recapP36Occasions.js`, `recapP36Metrics.js`, `recapP36Discoveries.js`, `recapP36Kinds.js` |
| Console | `AnalysisEngineConsole.jsx` |
| UI Recap | `RecapAnalyseView.jsx`, `RecapAnalyseDetails.jsx` |

### Artefacts de rejeu

- `fixtures/workout-main-jul-oct-2026.json`  
- `fixtures/p36-replay-oct-2026.json`  
- `fixtures/p36-closure-check-2026-10-31.json`  

---

## Verdict de synthèse (1er nov. 2026, 00:42)

Le moteur d’analyses Momentum Sport est un **pipeline unique** (Recap → discoveries → E0 → essays → colonnes), enrichi par couches **P0 → E0 → P3.0…P3.6** sans second moteur.

Sur données **réelles** (session connectée) :

- **7j** : pack dense court terme ; P3.6 weekday s’abstient.  
- **30j / 3m** : P3.6 `weekday_regularity` (groupes lun+mar / lun+ven) apparaît dans le pack affiché, cohérent avec les replays fixture et les correctifs anti-pic / anti-0 %.

**P3.6** reste **clôturable sous réserves de couverture** (proven, exercices dominants, ruptures non cartographiées) — voir `P3.6-HABITUDES-IMPLEMENTATION-2026-10-31.md`.

Aucun chantier fluidité engagé dans ce rapport.
