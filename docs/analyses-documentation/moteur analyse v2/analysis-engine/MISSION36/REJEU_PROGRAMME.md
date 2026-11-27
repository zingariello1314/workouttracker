# Porte C — Rejeu programme

## Verdict : **LIMITÉ** (pas un PASS de rejeu exact)

| Élément | Export `8ee0e181` |
|---|---|
| Digest LIVE == moteur | **Oui** |
| `program.schedule` | 7 jours · 57 exercices |
| `series` / sets / reps | **Tous vides** (`sets=null`, `reps=""`) |
| `program.active` | `null` |
| `program-structure.json` | Totaux dérivés (ex. lundi 384 reps / 32 séries) depuis le programme **app** |

## Cause

Le moteur lit la prescription dans `exercise.series` (`4×8`), via `parseSeriesScheme` (`sessionStructureGraph`).  
Le slim LIVE M35 exportait `sets`/`reps` directs — absents du modèle réel — **sans** le champ source `series`.

## Correction (captures futures)

`slimExercise` exporte désormais `series` + sets/reps/plannedReps **dérivés de ce champ source** (pas des totaux `program-structure`).

## Rejeu 8 horizons

**Non démontré** sur ce ZIP : sans `series`, les volumes planifiés / familles chiffrées ne sont pas recalculables hors app.  
Digest identique = condition nécessaire, **pas** conclusion de rejeu exact.

Mémoire éditoriale : non rejouée (évolutive) — à distinguer des calculs déterministes sources.
