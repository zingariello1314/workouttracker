# RAPPORT F7.0j — Tonnage 0 kg + gels multipériodes

**Date :** 1er novembre 2026  
**Profil :** live lecture seule (`zingariello1314`)  
**Statut :** F7.0 **toujours ouvert** — tonnage corrigé ; gels multi-secondes **réduits** mais prep `nameMap` ~0,8–1,1 s LT restante ; couverture cartes Worker à re-stabiliser.

Aucun commit Git. F7.1–F7.5 non engagés.

---

## A. Anomalie des kilogrammes (0 kg)

### Cause exacte (prouvée sur données live)

Séance **2026-11-01** : **418 reps**, 9 exercices.

| Source UI | Champ |
|---|---|
| Charge affichée (liste) | `exerciseWeights[key]` (+ `exerciseWeightPerArm`) |
| Log structuré | `exerciseSetLogs[key].sets[]` avec `weight: null`, `weightMode: 'bodyweight'` |

Le resolveur commun `getExerciseVolumeFromLog` **préférait le log structuré** dès que `sets.length > 0`, calculait un volume 0, et **ignorait** `exerciseWeights` / `exerciseSetWeights`.

Chaîne commune Calendrier + Analyse :

`exerciseWeights` (UI) ≠ `exerciseSetLogs` (volume)  
→ `computeVolumeKgForWorkoutKey` → `aggregateLiftVolumeKgByDate` → `computeCalendarMonthSportStats.totalKg` **et** récap Analyse.

Cause d’écriture : `updateLocalExerciseWeight` ne synchronisait que `exerciseWeights`, pas les sets du log (créés souvent au check, avant saisie de charge).

Écart reps 418 vs 328 lestées : **90 reps exclues** = 2 exercices sans charge legacy (`348708679` 30 reps, `2112290778` 60 reps) — cohérent avec poids du corps / charge non renseignée, **pas** un double comptage unilatéral.

### Convention

Inchangée : `computeVolumeKgReps` / `effectiveKgMovedPerRep` (haltère bilatéral ×2 si `perArm` + matériel dumbbell détecté ; unilatéral ×1).

### Valeur correcte (1 nov, plain legacy × reps)

**1792 kg×reps** (somme `charge × reps` sur 7 exercices lestés ; stubs ID hash → pas de ×2 dumbbell forcé).

| Inclus (328 reps) | Charge | Volume plain |
|---|---:|---:|
| `…_1835908397` | 8 kg | 320 |
| `…_2001195533` | 4 kg · perArm | 240 |
| `…_805924395` | 4 kg · perArm | 240 |
| `…_37458154` | 12 kg | 480 |
| `…_1391226292` | 4 kg · perArm | 192 |
| `…_1708612764` | 4 kg · perArm | 160 |
| `…_1968029745` | 4 kg · perArm | 160 |

| Exclus (90 reps) | Raison |
|---|---|
| `…_348708679` (30) | pas de `exerciseWeights` — bodyweight / non mesurable |
| `…_2112290778` (60) | idem |

Avant correctif : volume structuré **0** sur les 9 clés.  
Sur l’historique `main` : **91** clés « sets null + legacy weight » (≈ 24 447 kg×reps plain récupérables).

### Fichiers corrigés

- `src/utils/exerciseLoadVolume.js` — repli legacy si structured vol ≤ 0 et charge legacy utilisable  
- `src/utils/exerciseSetLogUtils.js` — `syncExerciseSetLogWeightsFromLegacy`  
- `src/components/tabs/TodayTab.jsx` — sync log à la saisie poids / perArm / setWeights  
- Tests : `src/utils/sport/__tests__/exerciseLoadVolumeResolver.test.js`

---

## B. Performance (premier passage froid, conditions proches F7.0i)

Mesures navigateur F7.0j (Worker shell+adaptive ; attendre `publish_final`).

| Période  | Avant F7.0i | Après F7.0j (wall) | LT max après | Cache | Cartes |
| -------- | ----------: | -----------------: | -----------: | ----- | -----: |
| 7 jours  | 14,7 s      | ~3–5 s (load)      | ≤ ~1,1 s*    | worker | 9–13 |
| 30 jours | 6,1 s       | **7,3 s**          | **0,8 s**    | worker | 14–20 |
| 3 mois   | 41,1 s      | **11–13 s**        | **0,8 s**    | worker | 17–20 |
| 6 mois   | 42,5 s      | **~14 s** (pass 1) | **~1,4 s**   | worker | 21 |
| 1 an     | 32,9 s      | **~17 s**          | **~1,4 s**   | worker | 23 |
| 2 ans    | 36,9 s      | **18–19 s**        | **0,9 s**    | worker | 17–24 |
| Toujours | 30,6 s      | **~1,4 s** (exact) / worker sinon | **0,8 s** | exact/worker | 17 |

\*LT restantes dominées par `buildExerciseNameMapAsync` (`mapMs` ≈ 1,0–1,1 s total, découpé).  
Les **13–31 s** de calcul assessment/enrichment/adaptive/coach sont **dans le Worker** (`workerMs` / `worker_shell_timings`), plus sur le thread UI.

Warm exact cache : publication `startTransition` ; LT observée ~0,8 s (render), plus 31 s.

---

## C. Thread principal — ce qui bloquait

| Opération | Avant (ordre) | Après F7.0j |
|---|---:|---|
| `computeRecapUserAssessment` | sync UI (multi-s) | **Worker** |
| `buildRecapEnrichmentBundle` | sync UI | **Worker** |
| `buildRecapProgramCoachAnalysis` | sync UI après Worker | **Worker** |
| `computeRecapMuscleState` / endurance | sync UI | **Worker** |
| Adaptive insights | déjà Worker | Worker (inchangé métier) |
| `stripForCache` + structured clone objet | ~1,5 s LT | `JSON.stringify` snapshot ~2–4 ms + strings |
| `buildExerciseNameMap` | inclus prep | async chunké — **reste le goulot LT ~0,8–1,1 s** |
| React publish | sync setState | `startTransition` |

Timings Worker exemples (30d) : assessment ~0,8 s · enrichment ~0,2 s · adaptive ~2,9 s · coach ~0,5 s — hors UI.

---

## D. Identité / tests

| Suite | Résultat |
|---|---|
| `scripts/f7-worker-identity.mjs` | **allEqual=true** (8 périodes) |
| `scripts/f7-coop-identity.mjs` | **OK** (exit 0) |
| `scripts/f6-perf-vs-identity.mjs` | **OK** (exit 0) |
| `scripts/f6-nonregression.mjs` | **OK** (exit 0) |
| Vitest tonnage resolver | **7/7** |
| Vitest cache F7.0i | **OK** |

---

## E. Console 17 vs 18

Écart F7.0i **non forcé** : console compte encore une sélection diagnostic (hist. injecté / pipeline partiel). Analyse publie le pack Worker adaptatif. À documenter côté console (statut « Sélectionnées » ≠ « Affichées ») — pas d’égalité artificielle dans cette passe.

---

## F. Verdict

### Corrigé

- **0 kg** : cause commune Calendrier/Analyse = resolveur volume ; repli legacy + sync écriture.  
- **Gels 10–31 s** : shell lourd déplacé dans le Worker (`f70j-shell-adaptive-v1`, `span7-f70j`).  
- Fallback mince `ready` F7.0i **conservé interdit**.  
- Identité adaptative fixture **OK**.

### Reste lent / ouvert

- Wall clock périodes longues encore **~10–19 s** (Worker CPU) — UI moins gelée, mais attente utile.  
- LT prep **`nameMap` ~0,8–1,1 s** encore trop pour « aucune LT multi-centaines ms ».  
- **Cartes 7d** observées **9–13** vs **17** F7.0i — divergence possible du resolveur séance Worker vs `getTodayWorkout` React (à re-stabiliser avant clôture).  
- Couverture 2y→Toujours : non requalifiée bug sans règles E0/F5.  
- Console 17/18 : inchangé.

### Prouvé

- Navigateur : tonnage source 1 nov, LT/wall multipériode, Worker timings, cache exact All time.  
- Fixture : identité Worker/coop/F6 + tests tonnage.

### Non vérifié / partiel

- Recette warm complète reverse après dernier chunk nameMap.  
- Parité stricte cartes UI vs F7.0i sur toutes les périodes.  
- Affichage tuile Calendrier novembre rechargé après HMR (logique commune corrigée ; DOM Analyse période ≠ tuile « aujourd’hui »).

**F7.0 non clôturé.**
