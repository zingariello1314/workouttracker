# Transfert F3 → F4 / F5 — 2026-11-01

F3 livré. Ne pas traiter F4/F5 dans ce lot.

## F4 — Narration / présentation

Faits désormais disponibles mais mal formulés :

- Titres « **un mouvement** » (map d’identité / `getExerciseNameById` manquant sur certains ids).
- Accords : « 1 séance du creux **n’ont** » ; conjugaisons mixtes.
- Mécanisme parfois répété (body + phrase `Le volume par séance passe d’environ 3 × 20 à 3 × 20`).
- Mentions « performances » dans copy legacy alors que `lexicon.maySayPerformance === false` (ex. freq_progress_low).
- Dates ISO / coloration encore hors contrats F2 pour certains kinds.
- Conclusions structurées parfois trop techniques pour l’UI (listes d’interdits = machine ; prose utilisateur = F4).

Préparer F4 pour consommer `composedEvidence.levels` / `continuity` / `decomposition` plutôt que re-parser le body.

## F5 — Sélection E0

- `composedFactCount` / `composedOk` **non** branchés sur `discoveryInformativeValue` (volontaire F3).
- Risque : découvertes profondes (A/B) rivalisent mal avec density / calendar_rhythm / quarter_* sur week.
- Doublons : plusieurs `disc_emergence` + `disc_ms_return*` + `disc_exercise_progress` sur le même exercice (pompes déclinées, relevés).
- Caps famille emergence toujours saturés (6m/3m).
- Traces drop vs pool − selected (gates multi-étapes) — inchangé depuis F2.

## Familles où la composition reste insuffisante

- Endurance (distance / FC comparables).
- Sommeil multi-faits (hors causalité).
- Muscles / ledger au-delà de P3.2b.
- Programme : enrichir adherence seulement quand plan historique **prouvé**.

## Hors scope

- F6 perf (replays ~0,7–2,6 s bundle fixture).
- F7 recette globale.
