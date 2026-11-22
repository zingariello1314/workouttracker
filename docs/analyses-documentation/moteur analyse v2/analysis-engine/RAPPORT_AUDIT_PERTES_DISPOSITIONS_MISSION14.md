# Audit pertes et dispositions sémantiques — Mission 14

## Dispositions distinguées

| Disposition | Signification | Catalogue accessible ? |
|---|---|---|
| `priority` / published | Conclusion indépendante prioritaire | Oui |
| `demoted_priority` | Indépendante en réserve | Oui |
| `deepening_accessible` | Approfondissement vérifié, consultable | **Oui** |
| `deepening_of_collective` (reserve row) | Idem, avant publication | → deepening_accessible |
| `source_retained` | Source intégralement représentée / fusion | Non |
| `exact_duplicate_suppressed` | Doublon démontré | Non |
| `keep_independent` (decision) | Candidat deepening rejeté | Reste indépendant |
| `unpublished_invalid` | Invalide | Non |

## Règle

`collapsedInto` **seul** ne justifie plus `source_retained`.  
Un deepening doit porter `hierarchyLink.reason === 'verified_parent_child'`.

## Jeu C

Contrôles ajoutés : `unjustified_deepening_or_absorption`, `parent_absorbs_many_without_proofs`, `deepening_declared_but_not_accessible`.
