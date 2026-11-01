# Registre des modifications F4 — 2026-11-01

Aucun commit Git. E0 / F5 / F6 / F7 non touchés (scores, caps, rivaux).

| Fichier | Nature | Justification | Tests |
| --- | --- | --- | --- |
| `src/utils/sport/recapComposedNarration.js` | **Créé** | Narration title/body depuis `composedEvidence` (A/B, continuité, témoins, densités) | `recapComposedNarration.test.js` |
| `src/utils/sport/recapEditorialPolish.js` | **Créé** | ISO→FR, accords connus, sommeil daté, `editorialValidateDiscovery` | idem |
| `src/utils/sport/recapProseMarks.js` | **Modifié** | `7 h 42`, schémas, ISO, `segmentRecapProseSemantic` | marks tests |
| `src/utils/sport/recapComposedEvidence.js` | **Modifié** | Branche narration F4 ; `reps`↔`totalReps` ; early/lateMean | F3+F4 tests |
| `src/utils/sport/recapPeriodDiscoveries.js` | **Modifié** | enrich+polish+debug `f4` avant E0 | replay F4 |
| `src/utils/sport/recapInsightValidate.js` | **Modifié** | Rejets F4 (physio, causalité sommeil, ISO title/body) | validate |
| `src/utils/sport/__tests__/recapComposedNarration.test.js` | **Créé** | 11 tests narration/polish/marks | vitest |
| `scripts/f4-replay-periods.mjs` | **Créé** | Replay avant/après + score profondeur visible | script |
| `docs/.../fixtures/f4-replay-*.json` | **Créé** | Artefacts replay | — |
| Livrables A–G F4 | **Créés** | Rapport, registre, matrice, audit, validation, tests, transfert | — |
| `README.md` / feuille de route | **Màj** | État F4 | — |

## Non modifié

- `selectPeriodDiscoveriesWithTrace`, scores, caps, rivaux, budgets
- `discoveryInformativeValue` / `composedFactCount` scoring
- P3.5 GTG sync, contrats F2 calculatoires
- Essays horizon (pas de réécriture massive)
- Aucun nouveau `kind`
