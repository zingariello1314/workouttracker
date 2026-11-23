# BILAN MISSION 31

**Verdict : PARTIEL**  
**P6 non clôturée · NO-GO P7 · aucun commit**  
Édition : `p6-sovereign-v30`

## Porte A — Intégrité métrique

- 75/75 divergences v29 classées **faux échecs** (`dates.fallback_possibly_arc`).
- Correctif : effectif non inventé ; triple seulement si population liée ; sinon note `noncomparable`.
- Cas artificiellement faux (lié + incoherent) : **toujours rejeté**.
- Preuves : UT M31 + revalidation sur export réel.

## Porte B — Rejeu

- Pipeline 8 horizons exécuté (`m19-replay-eight`) sur backup 21/11.
- Comparaison v28/v29 : 711 vs 717, même digest live `c8aa227e`.
- Hyperextension 3m v29 : 7/6 séances — acquis M30 confirmé.
- UI 7d : 11 priorités + 47 complémentaires = 58.
- DOM : **NON_OBSERVÉ** (pas d’onglet app).

## Porte C — Qualité

- Registre éditorial V1/V2 renseigné (E1–E8).
- Pas de refonte ; pas de nouvelle instrumentation cosmétique.

## Commandes

```bash
npx vitest run src/utils/sport/__tests__/mission31PopulationIntegrity.test.js
npx vite-node artifacts/analysis-eval/_m31_revalidate_and_compare.mjs
npx vite-node scripts/m19-replay-eight.mjs --end=2026-11-21
```

## Dossier

`docs/.../MISSION31/` + `artifacts/analysis-eval/mission31-{baseline,results}/`
