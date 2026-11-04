# Registre des défauts et régressions — v2

## ISS-2026-11-04-VOL-SHAPE

- **Symptôme :** `disc_volume_shape` publié ; `span_volume_vs_frequency` produit mais absent
- **Cause :** pas de rivalité de phénomène global entre catalogue et discoveries
- **Correction :** kinship `global_volume_period` (kinds exacts) + boost adaptive/IV
- **Tests :** ✅ kinship + non-fusion exo/densité/GTG
- **Live :** ❌ non vérifié navigateur
- **Statut :** corrigé tests ; live ouvert

## ISS-2026-11-04-RETURN-42-77

- **Symptôme :** deux cartes relevés (42 j et 77 j)
- **Cause :** collapse par id ; buckets gap distincts ; homonyme non borné
- **Correction :** `returnEpisodeCollapseKey` = nom+date de retour (ou id) ; `sameHistoricalEpisode` refuse homonyme sans date partagée
- **Tests :** ✅ fusion même date ; ✅ non-fusion dates/ids distincts
- **Live :** ❌
- **Statut :** corrigé tests ; live ouvert

## ISS-2026-11-04-DIPS-REFERENTS

- **Symptôme :** « reste proche » + early/late 20→48 sans distinction
- **Correction :** F4 frequency_driven ; hard consistency
- **Tests :** ✅
- **Live :** ❌

## ISS-2026-11-04-EMPTY-WINDOW-LESTEES

- **Symptôme :** Pompes lestées / gilet hors fenêtre
- **Correction :** `recapDiscoveryPeriodScope` (session antérieure)
- **Tests :** ✅ (vagues antérieures)
- **Live :** à reconfirmer

## ISS-2026-11-04-DELTA-387

- **Cause :** snapshot A sans jour 2026-11-02 (387 reps) — voir `../RECONCILIATION-387-REPS-2026-11-04.md`
- **Statut :** documenté ; ne pas égaliser artificiellement

## ISS-2026-11-04-GLOBAL-VOLUME-REGEX (nouveau, traité)

- **Symptôme potentiel :** rivalité volume trop large
- **Correction :** suppression matching blob ; exclusion si `exerciseId`
- **Tests :** ✅ non-fusion trajectoire / densité / GTG
- **Statut :** corrigé tests

## Ouverts

- P0 live navigateur
- Propagation metric facts hors attribution
- Branchement rédactionnel des `temporalPlans`
- `punctualClaim` producteurs + réserve persistante
- Console « pourquoi perdu »
