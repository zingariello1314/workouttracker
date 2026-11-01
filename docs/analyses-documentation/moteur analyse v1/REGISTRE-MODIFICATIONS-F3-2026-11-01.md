# Registre des modifications F3 — 2026-11-01

Aucun commit Git. E0 / F4 / F5 / F6 non touchés (hors debug observabilité).

| Fichier | Nature | Justification |
| --- | --- | --- |
| `src/utils/sport/recapComposedEvidence.js` | **Créé** | Couche composition : attribution, continuité, lexique, interdits, `composedEvidence`, enrichissement discoveries |
| `src/utils/sport/exerciseTrajectoryAnalysis.js` | **Modifié** | Branche `classifyVolumeAttribution` dans volume ; attache `composedEvidence` ; lexique volume/performance dans findings ; conjugaison « sont passées / est passé » |
| `src/utils/sport/recapPeriodDiscoveries.js` | **Modifié** | Import enrichissement ; `all = enrichDiscoveriesWithComposedEvidence(scoped.kept)` avant E0 ; debug `composedPool` + flags selected |
| `src/utils/sport/__tests__/recapComposedEvidence.test.js` | **Créé** | Scénarios A–K (synthétiques déterministes) |
| `scripts/f3-replay-periods.mjs` | **Créé** | Replay 7d/30d/3m/6m fixture juil–oct |
| `docs/.../fixtures/f3-replay-periods.json` | **Créé** | Sortie détaillée replay |
| `docs/.../fixtures/f3-replay-brief.json` | **Créé** | Synthèse replay |
| `docs/.../RAPPORT-F3-COMPOSITION-2026-11-01.md` | **Créé** | Livrable A |
| `docs/.../MATRICE-COMPOSITIONS-F3-2026-11-01.md` | **Créé** | Livrable B |
| `docs/.../REGISTRE-MODIFICATIONS-F3-2026-11-01.md` | **Créé** | Livrable C (ce fichier) |
| `docs/.../TESTS-FIXTURES-F3-2026-11-01.md` | **Créé** | Livrable D |
| `docs/.../REPLAYS-F3-2026-11-01.md` | **Créé** | Livrable E |
| `docs/.../TRANSFERT-F3-VERS-F4-F5-2026-11-01.md` | **Créé** | Livrable F |
| `docs/.../TRANSFERT-F3-F4-F5-DEPUIS-F2-2026-11-01.md` | **Annoté** | Marque F3 livré |
| `docs/.../README.md` | **Mis à jour** | État lots + liens F3 |
| `docs/.../FEUILLE-ROUTE-F2-F7-2026-11-01.md` | **Mis à jour** | État F3 |

## Explicitement non modifié

- `selectPeriodDiscoveriesWithTrace` / scores / caps / rivaux / budgets
- `discoveryInformativeValue` (pas de bonus `composedFactCount`)
- Producteurs essays / narration F4
- Contrats F2 (réutilisés)
- Règles P3.5 GTG / P3.6 / P3.2b (hors observation)
- Aucun nouveau `kind`
