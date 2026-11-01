# Validation technique P3.0 — matrice Adhérence × Progression

**Date :** 30 octobre 2026  
**Périmètre :** audit ciblé + correctifs socle (pas P3.1, pas sélection éditoriale, pas de commit)

---

## 1. Causes des 0 snapshots (1–30 oct. 2026)

### Preuves établies

| Fait | Preuve |
| --- | --- |
| Module `calendarDayPlanSnapshot.js` introduit le **28 oct. 2026** | `git log` → commit `9b973c5f` daté `2026-10-28 19:56` |
| Aggregate live `main` : **0** entrée dans `calendarDayPlanSnapshots` (toute période) | IndexedDB lecture directe |
| Aucune clé `checkedExercises` ≥ `2026-10-28` | Même lecture |
| Derniers jours d’activité classique oct. : 26–27 | Matrice P3.0 |
| Champ `calendarDayPlanSnapshots: {}` présent et persisté | `saveToDB` + defaults — **absence = données vides, pas oubli de lecture** |

### Mécanisme de création (réel)

1. **`ensureDayPlanSnapshot`** — 1ʳᵉ perf / sauvegarde avec liste live ; n’écrase jamais.
2. Appels : `CalendarHeatmap.handleSave`, `useWorkoutLogic.freezeDayPlan` (toggle/reps) **si** `freezeOpts` câblé (l’est dans `WorkoutContext`).
3. **`ensureReconstructedDayPlanSnapshot`** — à l’ouverture d’un jour calendrier avec perfs (lazy) ; produit un snapshot marqué `reconstructed: true` / `programId: 'reconstructed'`.
4. Persistance réelle via `updateData` / `saveToDB` (le champ est bien sérialisé).  
   `updateTempExerciseData` ne fait que le **brouillon** : le gel ne devient durable qu’au commit/auto-persist du draft.

### Interprétation (pas un bug de la matrice)

Les 15 jours actifs d’octobre ont été enregistrés **avant** l’activation du gel (ou sans re-sauvegarde / ouverture calendrier après le 28/10).  
Le mécanisme était **actif après le 28/10**, mais **sans nouvelle activité** ni reconstruction lazy déclenchée → 0 snapshot.  
Ce n’est **pas** une non-récupération : l’objet existe, vide.  
Imports / cloud : merge shallow prévu ; rien n’indique un wipe sélectif sur cette clé (hypothèse faible, non prouvée).

**Recommandation produit (hors P3.0 code)** : P3.3 (snapshots jours échus) reste nécessaire pour l’historique.

---

## 2. Règle des deux dénominateurs

| Dénominateur | Contenu | Usage |
| --- | --- | --- |
| **`initial`** | Tous les exos du snapshot, **y compris suppressed** | Fidélité au plan figé « imprimé » |
| **`adjusted`** (**primary**) | Snapshot **hors** suppressions explicites | Adhérence au plan du jour tel qu’ajusté — aligné `computeProgramCompletionCheckedRatio` |

- Suppressions : toujours dans `suppressedExercises` + gaps `suppressed` (jamais masquées).
- Taux d’adhérence par défaut = **adjusted**.
- `plannedCount` racine = alias de `adjusted.plannedCount` (compat).

---

## 3. Comportement des données d’exécution

| Signal | Classification matrice |
| --- | --- |
| `checked` (+/− reps/sets) | `realized` ; `executionSignals.checkedOnly` si coche seule |
| reps/sets sans coche | `partially_realized` (`uncchecked_with_data`) — **≠** absence totale |
| sets structurés &lt; prescrit | `partially_realized` (`partial_sets`) |
| aucun signal | `not_realized` (`unchecked`) — **≠** « oublié » |
| `suppressedExercises` | `suppressed` |
| `additionalExercises` / touch hors plan | `supplemental` |
| oubli + supplémentaire même jour | gap `possible_replacement_unconfirmed` seulement |

Live oct. échantillonné : pas de `checked` sans reps ni reps sans coche sur les jours vus ; setLogs fréquents les jours « salle ».

---

## 4. Variantes & GTG

- Clés A/B via `collectCalendarRepKeysForExercise` → **1** compteur par exercice.
- GTG canal séparé ; `overlapWithClassicIds` via `resolveGtgWorkoutStorageKey` (ex. pullups→101) ; `exclusiveGtgIds` pour le hors-séance.
- Pas de double comptage dans le dénominateur plan.

---

## 5. Défauts découverts

| Défaut | Gravité | Action |
| --- | --- | --- |
| Snapshot **reconstructed** persisté traité comme plan `high` si on fait confiance à `getDayPlanSnapshot` seul | Haute (latent ; 0 cas live aujourd’hui) | **Corrigé** dans `resolveDayPlanReadOnly` / `isReconstructedPlanSnapshot` |
| Un seul dénominateur masquait la nuance suppression | Moyenne | **Corrigé** : initial + adjusted |
| Overlap GTG/classique naïf sur id brut | Moyenne | **Corrigé** : mapping storage |
| Remplacement affirmable | — | Non affirmé (gap unconfirmed) |
| `recapCompletionTruth` test `priorPct` 100≠50 | Hors P3.0 | **Préexistant** — non modifié |

---

## 6. Fichiers modifiés

- `src/utils/sport/recapProgramAdherenceProgression.js`
- `src/utils/sport/__tests__/recapProgramAdherenceProgression.test.js`
- `docs/analyses-documentation/VALIDATION-P3.0-MATRICE-2026-10-30.md` (ce fichier)
- `docs/analyses-documentation/README.md` (lien)

---

## 7. Tests exécutés

```
npx vitest run \
  src/utils/sport/__tests__/recapProgramAdherenceProgression.test.js \
  src/utils/__tests__/calendarDayPlanSnapshot.test.js
```

| Suite | Résultat |
| --- | --- |
| `recapProgramAdherenceProgression.test.js` | **19 passed** |
| `calendarDayPlanSnapshot.test.js` | **12 passed** |
| `programCompletionService.test.js` | 2 passed (régression OK) |
| `recapCompletionTruth.test.js` | 1 fail préexistant (`priorPct`) — hors périmètre |

---

## Verdict

Socle P3.0 **validable** après correctifs : prudence historique confirmée ; 0 snapshot oct. **expliqué par datation du feature**, pas par un bug de lecture.  
**P3.1 non démarré.**
