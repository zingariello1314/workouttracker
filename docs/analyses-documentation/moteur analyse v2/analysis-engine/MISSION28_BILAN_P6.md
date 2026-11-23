# MISSION 28 — Bilan P6

Édition de départ : `p6-sovereign-v26`.  
Édition code : `p6-sovereign-v27`.  
**P6 non clôturée. NO-GO P7. Aucun commit.**

## Ce qui était incorrect dans v26

1. Parent parallèle recent30 **supprimé** en 3m sans destination (`exact_duplicate_suppressed`, `collapsedInto=null`) → 2 `orphan_parent`.
2. `subjectKey()` préférait `name:hyperextension` à `parallel:ex:A+ex:B` → fausse équivalence.
3. Composition lisait `windowMeanPerSession` comme volume → « 48 vs 48 » au lieu de 192/96/144.
4. `publicationCount=0` : registre `publications[]` jamais alimenté (expositions ≠ publications).

## Ce qui est désormais démontré (code + UT)

- Aspects parallèles distincts non fusionnés.
- Sélection avec destination si suppression.
- Réconciliation orphan à la publication (redirect ou détachement).
- Contrat métrique total ≠ moyenne dans la composition.
- `appendPublication` pour le registre mémoire.
- Tests M25–M28 : 33/33.

## Encore P6

- Rejeu produit 8 horizons v27.
- Remontée systématique des totaux structurés chez les producteurs enfants.
- Migration réelle (cartographie), exploration honnête, horizons, sommeil, programme, jeux A/B/C live, DOM.

## Phases ultérieures

HypothesisPlanner, implications P7, VIE avancée, incrémental P8.

## Preuves manquantes

Rejeu AUDIT/TRACE/DOM v27 ; jeu A pipeline ; aveugle B.

## Obstacles réels à la clôture

Pas l’absence de moteur P6 — les **contrats** et les **preuves campagne unique**. Tant que B1–B8 du plan fini ne sont pas verts → pas de P7.

## Stratégie la plus courte et solide

1. Stabiliser intégrité (fait en code).  
2. Un seul rejeu 8 horizons.  
3. Boucler B5/B7/B8 + O6.  
4. Traiter O2/O4 seulement s’ils bloquent encore la lecture produit.  
5. Refuser toute nouvelle « mission ouverte » sans critère du plan fini.
