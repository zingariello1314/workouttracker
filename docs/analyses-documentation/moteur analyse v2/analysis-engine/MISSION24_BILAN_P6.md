# MISSION 24 — Bilan P6

Édition : `p6-sovereign-v23` · memory v4 · hierarchy v3 · sleep v5 · selection parallel-trajectories-v1 · audit v10 · observability v3.

**P6 non clôturée. NO-GO P7. Aucun commit.**

## Livraisons

| # | Contrat | Cause | Correction | Preuve |
|---|---|---|---|---|
| L1 Mémoire | empty_profile + expositions sans phénomènes ; 7 horizons « new » | `noteExposure` pouvait écraser ; export 8h sans mémoire figée ; packs cache | Merge save ; freeze campagne ; memorySummary pack/store | UT M24 |
| L1 Hiérarchie | 90 parentId, 0 hierarchyLink | **`serializeConclusion` omettait hierarchyLink** (pas la validation) | Transport parentId/link/childIds ; slimCard sans parent orphelin | UT M24 |
| L1 Réconcil. | 709/685/688 | ensembles dispositions ≠ accessibles ≠ registry | Indicateurs unifiés M23 ; écarts d’identité documentés, pas de purge cosmétique | code + registre |
| L2 Sélection | 2× Hyperextension priorité | `same_title_distinct_subjects` → non redondant | `parallelTrajectoryComposition` | UT M24 |
| L3 Généralisation | « pas de runner A–F » | Packs = tests M7/M8/M16, non un runner nommé | Inventaire + branchement pipeline réel | dialogue |
| L3 Sommeil | 17 vs 4 lu comme 7j | Échantillon historique sur voix week | Abstention sparse/imbalance | detectDiscoveries |
| L4 Fingerprint | nameMapSize=0, MD≠JSON | callsites sans contexte | `analysisRunEnvelope` + wiring export | UT M24 |

## ASPECT

Voir `RAPPORT_VALIDATION_ASPECT_MISSION24.md`. DOM et QUAL aveugle restent NC.
