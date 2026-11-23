# RAPPORT COMPARAISON v24 → v25 — Mission 26

Baseline : AUDIT/TRACE utilisateur v24 (intégrité technique M25 validée).  
Cible : `p6-sovereign-v25` (intégrité sémantique).

## Ce que v24 a prouvé (conservé)

| Indicateur | v24 |
|---|---:|
| cardRegistry | 697 |
| Priorités | 83 |
| Complémentaires | 614 |
| Claims | 697 |
| Faits | 58 |
| Liens hiérarchiques | 108 |
| Parents parallèles | 9 |
| Autorité P6 | 8/8 horizons |

687 cartes v22 conservées mot pour mot. Mission 25 **validée** sur la restauration du parcours.

## Défauts sémantiques v24 (cibles M26)

| Cas | Horizon | Défaut |
|---|---|---|
| Pompes déclinées parallèle | 3m | `ex:504 · ex:504` — 2 producteurs, 1 stockage |
| Hyperextension parallèle | 7d→all | Regroupement éditorial, preuves faibles, sujet period |
| Collectif 11/18 | multi | Référentiel last-before-gap vs habituel non distingué |
| Hiérarchie minGap | 30d | Nuage de dates ≠ ancre d’épisode |
| removedByFusedTitleFilter | 7 horizons | Exclusion par titre |
| Mémoire store | profil | pack≠store ; 30d previousState=null |

## Comportement attendu v25 (prouvé en UT / pipeline ciblé)

| Cas | Avant (v24) | Après (v25) |
|---|---|---|
| Même ex, 2 kinds | Parent parallèle faux | `composedCount=0`, rejectedSameSubject |
| 2 ex distincts Hyperextension | Parent générique | Parent avec volumes, sourceEvents, subject parallel: |
| Horizon 1y + preuves 30j | Priorité forte | temporalMismatch, wasPriority=false |
| Collectif + habitualReps | « niveau antérieur » ambigu | last-before-gap + alerte habituel |
| Enfant dates 1/8 vs parent 11 | minGap≈1 possible | Ancres seules |
| Filtre fused | Par titre | Par identité |
| Mémoire campagne | Non sauvée | `saved_to_store` merge |

## Non-régression technique

- Suites M12, M22–M26, p6AnalyticalIntelligence, analysisPeriodExport : **77/77 OK** (lot ciblé).
- Compteurs parallèles M25 (reconcile) conservés.
- Pas de retour legacy silencieux (injection counters toujours `p6_unavailable`).

## Non exécuté ici

- Rejeu 8 horizons live sur le profil utilisateur sous v25 (DOM/QUAL).
- Suite Vitest monorepo complète.
- Porte D (sommeil / horizons longs) — ouverte.

## Artefacts

- `artifacts/analysis-eval/mission26-baseline/AUDIT-v24.json`
- `artifacts/analysis-eval/mission26-baseline/AUDIT_IA-v24.md`
- TRACE v24 : `docs/.../momentum-ANALYTICAL_REASONING_TRACE-p6-sovereign-v24-2026-11-22T15-28-10-920Z.json`
