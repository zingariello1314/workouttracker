# RAPPORT F6 — Performance, fraîcheur et fiabilité

**Date :** 1er novembre 2026  
**Lot :** F6 uniquement — **aucun commit Git** — **F7 non engagé**

---

### 1. Verdict

**Partiellement réussi** (lot technique).  
**Clôture usage actuel :** voir [`RAPPORT-CLOTURE-F6-2026-11-01.md`](./RAPPORT-CLOTURE-F6-2026-11-01.md) — proposé **clôturable** après validation navigateur live (lecture seule).

Justifications :

- Pipeline réel cartographié ; instrumentation activable ; baseline Node reproductible.
- Optimisations mesurées et non régressives (mémo requête lifetime/trajectoires, revision snapshot, isolation compte cache).
- Non-régression analytique **prouvée** sur fixture juil–oct (7d/30d/3m) et mini-fixture.
- Gains de latence **modestes** sur fixture historique (bruit JIT ; warm ≈ inchangé) ; coût dominant long-historique **non résolu**.
- Profil live et navigateur guest : **non vérifiés**.

---

### 2. Tableau des coûts (fixture juil–oct, Node/vite-node)

Conditions : froid = 1er passage ; chaud = médiane 3 passes ; **ne pas lire le gain froid « all » 72 % comme gain F6** (artefact de chauffe JIT — warm ≈ 843 ms des deux côtés).

| Étape / période | Avant (sans scope, froid ms) | Après (scope, froid ms) | Δ abs | Δ % | Appels / remarque |
|---|---:|---:|---:|---:|---|
| today total | 645 | 421 | −224 | −35 % | bruit froid |
| 7d total | 509 | 511 | +2 | 0 % | |
| 30d total | 1172 | 1177 | +5 | 0 % | |
| 3m total | 1782 | 1697 | −85 | −5 % | |
| 6m total | 1717 | 1676 | −41 | −2 % | hist. limité |
| lifetime scans / requête | ≥3 | 1 miss + 2 hits | — | — | **prouvé** |
| detectDiscoveries (today) | — | ~40 ms incl. | — | — | instrumenté |
| f3Enrich / f4Polish / e0f5 | — | <2 ms | — | — | instrumenté |

Détail : `BASELINE-BENCHMARKS-F6-2026-11-01.md` + `fixtures/f6-benchmark-brief.json`.

---

### 3. Trois principales causes de lenteur

#### 1) Rescans `collectLifetimeRepHistory`

- **Cause :** catalog + baselines + adhérence rescannaient l’historique.
- **Preuve :** compteurs `lifetimeMisses: 1`, `lifetimeHits: 2` par bundle.
- **Correction :** `createRecapComputeScope.memoLifetime` + branchement.
- **Gain :** élimination de 2 scans complets / requête (temps dépend de la taille).

#### 2) `find` O(n) dans construction lifetime

- **Cause :** `list.find(date)` à chaque clé reps.
- **Preuve :** code `athleteJourney.collectLifetimeRepHistory` ; charge synthétique dense.
- **Correction :** `Map` date→reps puis tri.
- **Gain :** sémantique identique ; sur synthétique 2y le total reste ~110 s → **pas le goulot unique**.

#### 3) Trajectoires × exercices (échelle)

- **Cause :** nombreuses `buildExerciseTrajectory` (misses 16–28 sur synthétique) sans index partagé bas niveau.
- **Preuve :** `TESTS-CHARGE-F6` ; trajHits ≈ 1.
- **Correction partielle :** mémo trajectoire par (id, fenêtre, mode, revision) — utile si collision.
- **Gain mesuré :** faible sur producteurs actuels (clés distinctes) ; reste le sujet principal pour F7.

---

### 4. Fraîcheur

- Scope borné à la requête + `snapshotRevisionOf` sensible au contenu des reps.
- Cache UI : `accountScope` + `clearRecapMetricsCache` au changement de compte.
- `genRef` conserve la protection anti-écrasement async.
- Matrice : `MATRICE-FRAICHEUR-F6-2026-11-01.md`.
- Mutation reps unitaire : OK. Scénarios UI A–G navigateur : **NV**.

---

### 5. Non-régression

**Confirmée** sur fixture historique 7d/30d/3m (`allEqual: true`) et tests unitaires F6.  
Aucun changement E0 / F5 / F4 / F3 métier.

**Document prioritaire pour la validation humaine :**  
[`RAPPORT-F6-PERF-VS-IDENTITE-2026-11-01.md`](./RAPPORT-F6-PERF-VS-IDENTITE-2026-11-01.md) — compare gains ms et identité sémantique (sélection + pool + drops) sur today/7d/30d/3m/6m ; `anySilentRegression: false`.

---

### 6. Limites

| Statut | Contenu |
|---|---|
| Prouvé fixture | Graphe, baseline Node, non-régression, lifetime hits, charge synthétique |
| Prouvé navigateur guest | **Non** |
| Prouvé profil live | **Non** (inaccessible) |
| Hypothèse | Gain perçu retour onglet via cache existant + accountScope ; console admin coût surtout à l’ouverture |

---

### 7. Fichiers modifiés

Voir `REGISTRE-MODIFICATIONS-F6-2026-11-01.md` (liste exhaustive).

---

### 8. Transfert F7

Voir `TRANSFERT-F6-VERS-F7-2026-11-01.md` — échelle 1–2 ans, UI fraîcheur compte, profil live, mutualisation index séances.

---

## Critères de clôture (17)

| # | Critère | Statut |
|---|---|---|
| 1 | Pipeline cartographié | OK |
| 2 | Coûts initiaux mesurés | OK (Node) |
| 3 | Goulots identifiés | OK |
| 4 | Optimisations justifiées | OK |
| 5 | Redondances réduites | OK (lifetime) |
| 6 | React audité | OK (doc) |
| 7 | Caches clés/invalidation | OK |
| 8 | Isolation comptes | STRUCT / NV UI |
| 9–15 | Mutations séances/programme/GTG/Garmin/sommeil/fenêtres | STRUCT + unit ; UI NV |
| 16 | Pas d’écrasement stale | STRUCT (genRef) |
| 17–18 | Packs/textes identiques | OK |
| 19 | Charge documentée | OK |
| 20 | Gains conditions comparables | OK (avec caveats JIT) |
| 21 | Limites signalées | OK |
| 22 | Pas de commit | OK |
| 23 | F7 non engagé | OK |
