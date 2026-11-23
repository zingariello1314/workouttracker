# BILAN MISSION 30 — P6

**P6 non clôturée. NO-GO P7. Aucun commit.**

Édition : `p6-sovereign-v29` (baseline observée gelée : v28).

## Ce qui a changé

| Domaine | Résultat |
|---|---|
| Diagnostic effectifs | Cause = `dates.length` (arc) vs `sessionCount` (fenêtre) |
| Contrat population | `resolvePrimaryWindowSessionPopulation` + sum≈mean×n |
| Composition | Fingerprint d’effectif aligné fenêtre |
| Validation | Prose « sur N séances » vs population |
| Jeu A | Corpus indépendant + harness vert |
| Abondance | Distincts/31e OK ; reformulations complémentaires ouvertes |
| Reproductibilité | Manifeste pack unique |
| Jeux B/C | Corpus aveugle préparé, **non clôturés** |

## Conservation M25–29

Invariants rejoués en tests unitaires M28/M29/M30. Rejeu produit 8 horizons **v29** encore dû (P1).

## Signaux v28 qualifiés (sans correctif automatique)

| Signal | Nature |
|---|---|
| Effectifs parent 8/7 | **Défaut démontré** → corrigé en code v29 |
| evaluations=null | Défaut d’observabilité / non branché |
| proseAudit.cardCount=0 / DOM | Défaut d’observabilité (≠ PASS DOM) |
| hypothesesNotExplored 28 / modulesExpectedNotRun 80 | Généralisation / exploration — G2 |
| memoryAbsentOrIgnored 258 | Limitation + observabilité ; 1 phénomène mémoire |
| nameMapSize=0 | Limitation des données exportées |
| Analyses récentes multi-horizons | Fonctionnement / politique éditoriale à juger en Jeu B |
| period_activity générique | Défaut rédactionnel possible (G6) — non prioritaire vs Jeu A |

## Strates

1. **Intégrité technique** : améliorée (B3 effectifs) ; rejeu v29 requis.  
2. **Candidature ASPECT** : **non** — V1 partiel, V2 partiel, P2 NON_OBSERVÉ.  
3. **Clôture P6** : **non**.

## Commandes

```bash
npx vitest run src/utils/sport/__tests__/mission30MetricPopulation.test.js
npx vitest run src/utils/sport/__tests__/mission28ConvergenceIntegrity.test.js src/utils/sport/__tests__/mission29ContractAuthority.test.js
npx vite-node artifacts/analysis-eval/_m30_run_gameA_abundance.mjs
```
