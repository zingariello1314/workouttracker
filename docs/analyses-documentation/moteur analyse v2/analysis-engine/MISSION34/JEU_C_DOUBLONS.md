# Jeu C — causes et correctifs (Mission 34)

## Constat M33 (catalogue v31)

- `textualDuplicatesAccessible = 10`
- Sur 3m…all : `multi_detector_same_text` (`disc_emergence` + `disc_exercise_progress`, même titre/corps)
- today / 7d / 30d : 0 doublon textuel intra-horizon
- Préservation d’ids OK ; pas de fusion parasite

## Distinction

| Type | Traitement |
|---|---|
| Même fait, même conclusion (même texte) | **Supprimer** le second du catalogue accessible |
| Même fait, mécanisme différent | Conserver (pas touché si textes distincts) |
| Même phénomène, horizon différent | Légitime si fenêtre apporte une observation |
| Reformulation partielle | Réserve (`demoted_partial_redundancy`), pas suppression |

## Correctif

`collectiveSelection.marginalValue` : clé titre+corps (120 car.) identique → `overlap=1`, `overlapReason=multi_detector_same_text`, destination = carte déjà retenue → `exact_duplicate_suppressed`.

Pas de déduplication globale nouvelle étape : réutilise le chemin de suppression existant avec preuve de destination.

## Après

UT Mission 34 : sélection sans double texte.  
Évaluation 8 horizons live : **à rejouer** sur export v33 (pas annoncé PASS ici).
