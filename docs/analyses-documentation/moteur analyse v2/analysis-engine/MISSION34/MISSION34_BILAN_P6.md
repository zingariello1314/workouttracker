# BILAN MISSION 34

**Verdict : PARTIEL**  
**P6 ouverte · NO-GO P7 · aucun commit**  
Édition code : `p6-sovereign-v33`  
Référence observation produit : DOM v2 du 26 novembre 2026 (`observed`, 8/8 prêts, 82/82 priorités).

## Synthèse

| Porte | Résultat |
|---|---|
| A Accessibilité 91 | **Cause démontrée + correctif** — pas de virtualisation : filtre UI excluant `deepening_of_collective` / `reserve` |
| B Jeu C | **Correctif** — suppression `multi_detector_same_text` à la sélection collective |
| C Jeu B | **Amélioration ciblée** — valorisation mécanismes étayés ; profondeur live reste à re-prouver sur export v33 |
| D V1/V2 | **Correctifs** — prose plurielle 7j vide ; familles long = contexte ; sommeil associatif |

## Porte A — 91 occurrences

**Pas une virtualisation scroll.** `RecapAnalyseView` ne montait que `valid_reserved` | `demoted_priority`, alors que `accessibleReserve` contient aussi les approfondissements (`deepening_of_collective`, `reserve`). Le DOM comparait le pack entier → faux `VIRTUALISE_ACCESSIBLE`.

| Classification | Statut |
|---|---|
| Deepenings / réserve consultable filtrés UI | **Défaut corrigé** (montage + badge Approfondissement) |
| `source_retained` / rejet factuel | **Hors catalogue utilisateur** (justifié) |
| Compteur « Toutes » | Aligné sur **consultables montés** (`data-analyse-consultable-count`) |

Critère A : parcours = filtre Toutes / familles + section compléments — après correctif, deepenings montés. Re-preuve Chrome v33 attendue.

## Porte B — Jeu C

Cause M33 : 10 doublons textuels (`disc_emergence` + `disc_exercise_progress`, même titre/corps).  
Correctif : `marginalValue` → `multi_detector_same_text` → `exact_duplicate_suppressed` avec destination.  
UT : sélection sans double texte. Rejeu Jeu C 8 horizons = export utilisateur v33.

## Porte C — Jeu B

Références synthétiques inchangées (≥11 hits).  
Sélection : +mécanisme étayé, −émergence/format sans mécanisme, −familles `context_accessible`.  
**Pas de PASS qualité généralisée annoncé** sans nouveau catalogue live + jugement aveugle.

## Porte D

- « Ces 7 jours **n'ont** pas encore… » (periodVerb).
- Semaine vide : ne recycle plus le volume de la même fenêtre comme « autour ».
- Familles de séances : déjà horizonRole ; informative value −18 sur longs.

## Invariants

Identités, GTG, populations, fenêtres, mémoire : non rouverts. DOM architecture : **non rouverte**.

## Clôture P6

**Non.** Reste : Chrome v33 (accessibilité + Jeu C live), notation aveugle humaine, P1 rejeu LIVE==engine.
