# Mission 14 — Bilan P6

**Verdict : régression hiérarchique et dénominateurs de concentration corrigés en code (v13) — preuves live 8 horizons NON_VÉRIFIÉES — P6 non candidate — NO-GO P7.**

Édition : `editorial=p6-sovereign-v13` · `hierarchy=verified-deepening-v1` · `composition=phenomenon-compose-v3` · `review=collective-pass4-v9`

Baseline v12 : `artifacts/analysis-eval/baselines/p6-sovereign-v12-before-mission14.json`

**Aucun commit. Aucun P7.**

---

## Réponses aux 20 questions

1. **Pourquoi 38 absorptions ?** `markDeepenings` matchait les kinds `format_consolidation|resistance|progress` sans sujet/épisode ; puis `collapsedInto` les faisait sortir d’accessible via `source_retained`.
2. **Rapprochements légitimes ?** Typiquement ≤5 (événements de charge de la phase). Les consolidations novembre ≠ phase août.
3. **Informations restaurées ?** En code : tout enfant sans `justifyParentChildLink.ok` reste indépendant et publiable. Quantité live : **NON_VÉRIFIÉ**.
4. **Preuve parent–enfant ?** `hierarchyLink.js` : sujets partagés + épisode + dimension + contribution.
5. **63 vs 62 ?** Disposition published vs filtre catalogue/export ; cas pushPull. Réconciliation finale renforcée mais live **NON_VÉRIFIÉ**.
6. **Réconciliation 8 horizons ?** **NON_VÉRIFIÉ** (rejeu requis).
7. **Cause dénominateurs ?** `composeRelativeConcentrationReading` verbalisait `moveShare` comme « % du volume de 7 jours » alors que c’est « % du volume mensuel de ces mouvements ».
8. **Jeu A détecte mauvaise interprétation ?** **OUI** (tests) — `swapped_concentration_denominators` / `correct_ratio_wrong_denominator_verbalization`.
9. **Producteurs appariement ?** `sessionSlotMatching` + `programVariantContext` / trajectoires — adoption partielle.
10. **Conclusions prescription-aware ?** Partiel (réécriture trajectoire) — live **NON_VÉRIFIÉ**.
11. **Collectif absent ?** Seuil 3 + liens muscle/séance faibles + sélection. Seuil 2 si lié.
12. **Collectifs publiés ?** **NON_VÉRIFIÉ** live.
13. **Phase charges ?** Événements ≠ exercices (dédup canonique) ; dates de référence vs changements.
14. **Approfondissements réels ?** Seulement enfants vérifiés ; pas reformulation globale.
15. **Contradictions inter-horizons ?** Contrôle existe ; adoption producteurs partielle.
16. **Relations non cherchées ?** Adhérence multidimensionnelle longitudinale, sleep composition, Garmin hors reps — partiel.
17. **Données sous-exploitées ?** Programme variantes, charges fingerprint, mémoire.
18. **Mémoire consommée ?** Export `history` souvent absent — **NON_VÉRIFIÉ**.
19. **Exports autonomes = même run ?** Mission label unifié M14 ; fingerprint Object — à revalider live.
20. **Pour P6 candidate ?** Rejeu 8 packs + A/B/C + DOM + restoration visible + collectif/adhérence publiés + exports 2 fichiers complets.

---

## Matrice

| Résultat | Statut |
|---|---|
| Stop absorption injustifiée load_phase | **TESTÉ** · **ACTIVÉ** · PUBLIÉ live **NON_VÉRIFIÉ** |
| Deepening consultable ≠ source_retained | **TESTÉ** · **ACTIVÉ** |
| Concentration dénominateurs corrects | **TESTÉ** · **ACTIVÉ** |
| Jeu A mauvaise interprétation | **TESTÉ** |
| Jeu C dispositions sémantiques | **IMPLÉMENTÉ** · **TESTÉ** partiel |
| Collectif seuil 2 si lié | **ACTIVÉ** · PUBLIÉ **NON_VÉRIFIÉ** |
| Classification indeterminate | **ACTIVÉ** |
| Phase charges event≠exercise | **TESTÉ** |
| Rejeu 8 horizons / DOM / mémoire | **NON_VÉRIFIÉ** |

---

## Avant / après (exemples)

### Concentration (texte attendu)

**Avant (v12)** : « … environ 50 % du volume de 7 jours, contre 22,2 % du volume de 30 jours. »  
**Après (v13)** : « … environ 50 % du volume de ces mouvements sur 30 jours (180 / 360 …), alors que 7 jours ne porte que environ 22,2 % du volume total de 30 jours (1340 / 6044 …). Rapport ≈2,26×. »

### Hiérarchie

**Avant** : Face pull novembre → `source_retained` sous phase charges août.  
**Après** : `keep_independent` (dimension/épisode) ; curl resistance août → deepening vérifié **accessible**.

---

## Procédure utilisateur

1. Recharger app (édition v13).  
2. Récap → Analyse → exporter AUDIT_IA + ANALYTICAL_AUDIT + dossier.  
3. Horizons longs : vérifier disparition des dizaines de `source_retained`/`deepening_of_collective` injustifiés.  
4. Compter accessibles 6m/1y/2y/all vs baseline 74/82/80/80.  
5. Lire carte concentration 7j : dénominateurs explicites.  
6. Chercher deepenings consultables sous phase charges (composants load uniquement).

**P6 non candidate. NO-GO P7.**
