# Porte D — Autorité du rejeu LIVE

## Verdict : **LIMITÉ** (pas un PASS déclaratif)

| Élément | Export v33 `f0f758c4` |
|---|---|
| Digest LIVE == moteur | **Oui** (`f0f758c4`) |
| `sources.reps` / setLogs | Présents (806 clés reps) |
| Garmin | Présent |
| `program.schedule` | **Absent** du pack (seulement `scheduleDayCount:7` + `exerciseNameHints`) |
| `program.active` | `null` |
| `programsIndex` | `null` |
| `parameters.worker` | `null` |
| Rejeu P6 pendant export | Non relancé (manifeste) |

## Dépendance documentée

Les familles de séances / prescriptions / comparaisons plan×réalisé du run Chrome s’appuyaient sur le **programme chargé par l’application**, non sur le squelette LIVE_INPUTS v33.

## Correction ciblée (captures futures)

`slimProgram` exporte désormais `schedule` (ids, noms, sets, reps, gtg) sans nouveau format concurrent.  
`reproducibility.programStructure = schedule_skeleton_exported` quand présent.

## Rejeu huit horizons

Non exécuté ici sur sources figées complètes (schedule manquant dans le ZIP).  
Critère D : **limite explicitement qualifiée**, digest aligné ≠ rejeu exact des conclusions programme.
