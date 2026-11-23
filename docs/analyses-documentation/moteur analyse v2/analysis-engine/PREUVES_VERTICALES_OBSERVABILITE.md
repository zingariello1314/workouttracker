# Preuves verticales — observabilité

Démonstration sur artefacts de structure (même sérialiseur que l’UI). Les cas métier concrets se valident sur un export live 8 horizons.

## Cas couverts par la trace

| Cas | Ce que la trace doit montrer |
|---|---|
| Collectif reprise 11/18 | Conclusion `priority` + phenomenonId épisode + faits/mémoire |
| Composition mensuelle familles | Métriques composition / contributionRegistry via serialize |
| Trajectoire pompes + variantes | Kind trajectoire + transformations éventuelles |
| Association sommeil-volume | Claim sommeil + lifecycle sleep_x_activity |
| Conclusion rejetée à juste titre | `rejectionRegistry` + motif |
| Fusion / approfondissement | `fusionRegistry` + step `merge_or_deepen` |
| Exploration applicable non exécutée | lane `applicable_never_executed` + honesty |

## Contrôle de non-fabrication

Si `moduleExecutionByPeriod.*.instrumented === false`, la carte modules liste des `not_called` **sans** prétendre qu’ils ont tourné. Un recalcul instrumenté doit être étiqueté `executionMode: instrumented_recompute`.

## Parité inspecteur

`RecapCardInspectorModal` et `ANALYTICAL_REASONING_TRACE` partagent `serializeConclusion` pour le même run.
