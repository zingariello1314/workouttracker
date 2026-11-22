# Diagnostic hiérarchie et raisonnement — Mission 14

Édition cible : `editorial=p6-sovereign-v13` · `hierarchy=verified-deepening-v1`  
Baseline : `artifacts/analysis-eval/baselines/p6-sovereign-v12-before-mission14.json`

---

## 1. Régression 706 → 578 accessibles

### Chaîne de cause

1. **`markDeepenings` (M13)** rattache tout `disc_format_consolidation|resistance_progression|exercise_progress` au parent `disc_composed_load_phase` dès que le kind matche — **sans** sujet / épisode / dimension.
2. Chaque enfant reçoit `p6Disposition=deepening_of_collective` **et** `collapsedInto=parentId`.
3. **`insightsFromP6`** : toute réserve avec `collapsedInto` → disposition `source_retained` + **return** (non publiée dans `accessibleReserve`).
4. Résultat : ~38 trajectoires indépendantes (Face pull, élévations, Dips, reprises novembre…) sortent du catalogue alors que la phase de charges ne cite que ~5 événements (juillet–août).
5. `lostSilent=0` / `reconciledStrict=true` : les ids sont « expliqués » par `source_retained` — la réconciliation compte une disposition, pas une conservation d’information.

### Correction

| Élément | Avant | Après |
|---|---|---|
| Prédicat deepening | kind regex seul | `justifyParentChildLink` : sujet ∩, épisode ≤45j, dimension compatible |
| Load phase enfants | consolidations + progress | **uniquement** `resistance_progression` / load (pas format_consolidation) |
| Publication | `collapsedInto` ⇒ source_retained | deepening ⇒ `deepening_accessible` **consultable** |
| Indépendants | absorbés | `keep_independent` + preuve de rejet |

---

## 2. Concentration relative — dénominateurs

| Ratio | Valeur | Signification réelle | Verbalisation v12 (fausse) |
|---|---|---|---|
| 180/360 | 50 % | Part du volume **mensuel de ces mouvements** faite en 7j | « 50 % du volume de 7 jours » |
| 1340/6044 | 22,2 % | Part du volume **mensuel global** faite en 7j | « 22,2 % du volume de 30 jours » (ambigu) |
| 50/22,2 | ≈2,26 | Surreprésentation relative | rapport OK |

Correction : prose explicite + faits atomiques `move_share_of_parent` / `global_share_of_parent` + jeu A `swapped_concentration_denominators`.

---

## 3. Catalogue 63 vs 62

Cause probable : filtre titres fusionnés / dédup post-polish encore partiel.  
`finalCatalogReconciliation` exporté ; pushPull manquant accessible mais présent DOM = défaut de correspondance identité/export — à vérifier sur rejeu v13.

---

## 4. Collectif reprises

Seuil abaissé à **2** si lien musculaire/séance documenté ; sinon 3.  
Publication live encore **NON_VÉRIFIÉE**.
