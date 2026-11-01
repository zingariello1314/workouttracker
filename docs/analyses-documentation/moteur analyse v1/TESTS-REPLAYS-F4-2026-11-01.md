# Tests et replays F4 — 2026-11-01

## Commandes

```bash
npx vitest run src/utils/sport/__tests__/recapComposedNarration.test.js
npx vitest run src/utils/sport/__tests__/recapComposedEvidence.test.js
npx vite-node scripts/f4-replay-periods.mjs
```

## Résultats session

- Narration F4 : **11/11**
- ComposedEvidence F3 (non-régression) : **18/18**
- Total combiné : **29/29**

## Couverture brief §12.1

| # | Scénario | Statut |
| --- | --- | --- |
| 1 | Recul localisé + sets + témoins | OK (narration A) |
| 2 | Témoins mixed | OK (fixture 30d + texte) |
| 3 | Sans séries | Hérité F3 + narration sans décomp. inventée |
| 4 | Format maintenu | OK (narration B) |
| 5 | Pic isolé | OK |
| 6 | Hausse par fréquence | Replay 30d Relevés |
| 7 | Plateau | Titres « volume stable » |
| 8 | Retour ponctuel/confirmé | F3+F4 continuité |
| 9 | 7j + H qualifié | Texte contexte historique |
| 10 | Nuit W / hors W | Polish date ; pas de causalité |
| 11 | Date FR longue | OK |
| 12 | `7 h 42` | OK marks |
| 13 | Qté + exercice colorés | OK semantic |
| 14 | Nom introuvable | Fallback sûr |
| 15 | Accords | OK |
| 16 | Essay conclusion non prouvée | Non étendu (essais non migrés) — doc |
| 17 | GTG | Garanties P3.5 ; pas de double couche |
| 18 | Abstention données | OK F3+F4 |

## Replays

Artefacts : `fixtures/f4-replay-periods.json`, `f4-replay-brief.json`.  
Périodes : 7d, 30d, 3m, 6m. Live : non inspecté. 1an/2ans/Toujours : pas d’historique fixture suffisant.
