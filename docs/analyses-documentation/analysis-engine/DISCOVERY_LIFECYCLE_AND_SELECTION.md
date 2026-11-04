# Cycle de vie des découvertes et sélection

## Identité

- Technique : `kind` + sujet (`discoveryIdentity`)
- Phénomène : `buildPhenomenonRecord` (sujet + classe + mécanisme / bucket gap)
- Éditoriale : `sameHistoricalEpisode` / `sameExerciseIdentity`

Les titres et hashs volatils ne définissent pas l’identité.

## Statuts (cible ; partiellement implémentés)

`signal` → `enrichi` → `non_publiable` | `publiable` → `publiable_non_selectionnee` | `publiee` → `actualisee` | `consolidee` | `archivee` | `invalidee`

## Sélection

1. Qualité intrinsèque (gate FR, cohérence F4, fenêtre)
2. IV informative + ajustements éditoriaux
3. Collapse identité + phénomène + reprises (nom normalisé)
4. Rivalités pack (`editorialCanTake`, kinship volume)
5. Colonnes narratives (short / medium / long)

## Règle volume (P0)

Sur le phénomène « volume global de la période » :

- `span_volume_vs_frequency` (mécanisme fréquence/densité) **gagne**
- `disc_volume_shape` (portrait) **perd** s’il n’ajoute pas de fait distinct

## Règle reprise (P0)

Un seul épisode de retour par mouvement normalisé, même si gaps 42 j et 77 j et storage ids distincts.

## Quotas

Refus des plafonds éditoriaux arbitraires comme critère de qualité.  
Les caps de colonnes / perf restent des garde-fous techniques documentés — pas un jugement de valeur.

## Réserve

Les analyses publiables non retenues doivent rester inspectables (console) et réévaluables. Persistance complète = travail restant.
