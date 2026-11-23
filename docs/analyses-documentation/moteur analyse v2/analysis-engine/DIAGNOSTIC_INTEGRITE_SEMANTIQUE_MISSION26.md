# DIAGNOSTIC INTÉGRITÉ SÉMANTIQUE — Mission 26

Baseline gelée : exports utilisateur **v24**  
(`artifacts/analysis-eval/mission26-baseline/AUDIT-v24.json` + TRACE v24 fournie).

Édition corrigée : `p6-sovereign-v25`. P6 non clôturée. NO-GO P7.

## A1 — Faux parallèle Pompes déclinées (3m)

### Fait (audit v24)

Claim `3m|…|pompes déclinées : 2 créneaux parallèles (~9 séances)` :

- `evidenceIds`: `ex:504 · ex:504`
- `subject.key`: `period_activity`
- `proof.sourceEvents`: `[]`
- Enfants : `disc_emergence|ex:504|…` et `disc_exercise_progress|ex:504|dates:…` — **même exercice**, même corps.

### Fonctionnement actuel (v24)

`findParallelTrajectoryClusters` regroupait par titre. Si les titres matchaient, le filtre `substantiveEquivalence` était contourné (`if lt===rt continue` n’excluait pas).  
Deux **cartes** du même `ex:504` devenaient « 2 créneaux ».

### Cause démontrée

Confusion **nombre de cartes / producteurs** ≠ **nombre d’enregistrements de stockage**.

### Correction

- Exiger ≥2 `subjectKey` concrets **distincts** (`ex:` / `match:` / `grp:`).
- Même sujet → `rejectedSameSubject`, pas de composition.
- Calendriers de dates identiques → pas « similaires » (souvent même trajectoire).

### Preuve

Test `refuse deux producteurs du même stockage 504` → `composedCount=0`.

---

## A2 — Parallèle Hyperextension

### Fait v24

Parents affirment le regroupement (« 2 identités… ») sans volumes 192/144/96, `sourceEvents` vides, sujet `period_activity`.

### Correction

- Corps avec détail par trajectoire (reps récentes, Δ vs réf., séances).
- `claim.subject.key = parallel:ex:A+ex:B`.
- `proof.sourceEvents` remontés depuis enfants / dates.
- `observedValues` par trajectoire.

---

## A3 — Portée temporelle

### Fait v24

Parallèle Hyperextension ~4 séances / 30j prioritaire aussi sur 6m–all.

### Correction

- `observationWindow` / `comparisonWindow` / `presentationHorizon`.
- `temporalMismatch` si preuves récentes sur horizon ≥90j → poids ↓, `wasPriority=false`, prose explicite.

---

## B1 — Collectif 11/18 nov. / référentiels

### Fait

Parent : « volume proche du niveau antérieur ».  
Enfants Kickbacks / Extension : reprise incomplète vs habituel (48↔60, 42↔48).  
Ledger : 48↔48, 42↔42 (dernière séance avant gap).

### Cause

`prevReps` = **last_before_gap**. Les enfants comparent parfois un **habituel**. Le collectif ne nommait pas le référentiel.

### Correction

- Prose : « dernière séance avant interruption ».
- Si `habitualReps` fourni et en retrait : phrase distincte.
- `stats.referenceKind = last_before_gap`.

---

## B2 — Liens hiérarchiques / minGap

### Cause

`episodeDatesOf` injectait tout `metrics.dates` (nuage trajectoire) → proximité artificielle avec l’épisode parent.

### Correction

Ancres uniquement : `returnDate`, `date`, `namedMoves`, `confirmationDates`.  
Pas le nuage pour `return_or_format` / collectifs.

---

## C1 — Réconciliation

### Fait v24

`removedByFusedTitleFilter` excluait par **titre** homonyme → écarts publication/accessible.

### Correction + avis

Réconciliation **par ensembles d’identités** (`finalCatalogReconciliation.v3`, `method: identity_sets`).  
Faisable sans refonte : remplacer le filtre titre par `fusedIdSet`. Compteurs dérivés des sets, pas d’accumulation manuelle.

---

## C2 — Mémoire

### Fait v24

`packPhenomena=1`, `storePhenomena=0`. 30d : `previousState=null` alors que 7d connaît l’épisode.

### Cause démontrée

Campagne 8 horizons **ne persistait pas** `analyticalMemoryOut` dans `localStorage` (seulement noteExposure).

### Correction

Après export 8 périodes : merge + `saveAnalyticalMemory` profil `u:{id}` ; flag `analyticalMemoryPersisted`.

### Preuve UT

Deux sessions save/load + exposition sans purge des phénomènes.

---

## Porte D

Non prioritaire : sommeil / horizons longs notés ouverts dans le registre. Pas d’extension moteur.

## Observabilité

`memoryAbsentOrIgnored` limité aux kinds où la mémoire est **applicable** (plus chaque carte).
