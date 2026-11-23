# DIAGNOSTIC MÉTRIQUE INDÉPENDANT — Mission 30

Baseline gelée : `artifacts/analysis-eval/mission30-baseline/` (v28).  
Édition code après correction : `p6-sovereign-v29` (`composition=metric-population-v1`).

## Cause démontrée (pas une hypothèse Hyperextension)

Sur le parent parallèle `3m`, le texte publie **8** et **7** séances alors que les totaux 336 / 288 correspondent à **7** et **6** séances × 48.

### 1. Quelle fonction produit 8 et 7 ?

`sessionFingerprint` dans `parallelTrajectoryComposition.js` alimente `trajectories[].sessions`, repris dans la prose (`sur ${t.sessions} séances`).

Avant M30 :

```js
sessionCount: dates.length || Number(m.sessionCount) || null
```

avec `dates = m.dates ∪ m.sessionDates` — **longueur d’arc**, pas effectif fenêtre.

### 2. Quels ensembles d’événements ?

| Mesure | Ensemble réel |
|---|---|
| `recentReps` / `windowTotalReps` | Séances **dans** la fenêtre (`volume.windowTotal` / `windowSessionCount`) |
| `m.dates` (pré-M30) | `trajectory.sessions.trace` = **arc** d’installation (peut déborder) |
| Enfants emergence / structural | Dates filtrées fenêtre → 7 et 6 corrects |

### 3. Pourquoi diffèrent-ils des séances des totaux ?

`trajectoryToMetrics` exposait déjà `sessionCount: vol.windowSessionCount` **et** `dates: trace` (arc). Le fingerprint préférait `dates.length` dès qu’il était > 0, **ignorant** `sessionCount`.

### 4. Pourquoi les enfants sont corrects ?

Ils ne passent pas par ce fingerprint pour leur prose principale : leurs producteurs comptent les dates de leur propre preuve fenêtre.

### 5. Rôles

| Élément | Rôle |
|---|---|
| `sessionFingerprint` | Source des effectifs du parent composé |
| `comparisonSessions` / prev | Comparateur antérieur (totaux) — non en cause sur 8/7 |
| Dates arc vs fenêtre | Mélange silencieux de populations |
| Extracteurs M29 | Ont sécurisé **totaux ≠ moyennes**, pas l’**effectif** lié au total |

### 6. Pourquoi aucune validation n’a détecté ?

`validateCardClaimConsistency` comparait claim↔carte / fenêtres, **pas** l’identité `total ≈ mean × n` ni prose « sur N séances » vs population fenêtre.  
`integrityValidation.ok=true` = intégrité **structurelle**, pas vérité factuelle.

### 7. Autres compositions à risque ?

Tout producteur qui publie un total de fenêtre tout en listant des `dates` d’arc, puis tout consommateur qui fait `dates.length` pour un effectif.

### 8. Contrat commun (kind-agnostic)

`resolvePrimaryWindowSessionPopulation` + `validateSumMeanSampleConsistency` dans `recapMetricContract.js` :

- population d’effectifs = séances `inSelectedWindow` / `windowDates` / `sessionCount` explicite ;
- arc distinct (`arcDates`) ;
- si total, moyenne et effectif déclarent le même référent → vérifier le produit.

## Correction (générique)

1. `trajectoryToMetrics` : `dates` = fenêtre ; `arcDates` = trace.
2. `sessionFingerprint` : population primaire via contrat commun.
3. Validation : triple sum/mean/n + prose vs population.

**Pas** de branche spéciale Hyperextension.

## Preuves

| Preuve | Artéfact |
|---|---|
| Code | `recapMetricContract.js`, `parallelTrajectoryComposition.js`, `exerciseTrajectoryAnalysis.js`, `claimAssertionIdentity.js` |
| Exécution | `npx vitest run …/mission30MetricPopulation.test.js` (vert) |
| Résultat | Parent compose 6 et 7 séances pour totaux 288/336 |
| Non-régression | M28 + M29 tests verts |
