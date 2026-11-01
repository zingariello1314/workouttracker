# Compte rendu — Mission majeure moteur d’analyse

**Date :** 29 oct. 2026  
**Contraintes respectées :** pas de LLM, pas de dépendance payante, pas de migration destructive, pas de refonte UI, pas de commit.

## Livré

| Exigence | Livrable |
| --- | --- |
| R1 Finding ≠ profondeur | `recapAnalyticalFindings.js` : C1(+C2), C4, C5, C10/C11 avec statement / interpretation / consequence |
| R2 Inventaire | [INVENTAIRE-CORRELATIONS-ANALYSES.md](./INVENTAIRE-CORRELATIONS-ANALYSES.md) + statut livraison |
| R3 Golden analytique | `__tests__/recapAnalysisGoldenPack.test.js` — asserts positifs (conclusion, relations, anti-dérobade) |
| R4 Sélection | `recapSelectionDiagnostics` + boost familles rares + `rescueStarvedFamilySlots` dans `buildAdaptiveRecapInsights` |

Branchements essays : `volume_traj`, `adherence_dow`, `body_weight_parallel`, `gtg_repere_coevo`.

## Avant / après (profondeur)

### Volume (C1 × C2)

| | Texte |
| --- | --- |
| **Avant (insuffisant)** | « Le volume de répétitions a augmenté de 18 %. » |
| **Après** | Constat Δ volume + levier fréquence/dose + (si momentum ≈ 0) perf stable + conséquence : capacité à enchaîner plus de jours à niveau de série stable, pas hausse de charge unitaire. Objectif musculaire relié si présent. |

### Assiduité (C5)

| | Texte |
| --- | --- |
| **Avant** | « Adhérence : Lun ~88 % vs Mer ~52 % — caler les séances clés sur tes jours forts. » (candidat calendrier mort / superficiel) |
| **Après** | Écart Lun/Ven vs Mer + groupes du créneau faible (ex. dos/biceps) + blocs rarement cochés + conséquence : trou local d’exposition, pas manque global ; prioriser le jour faible (street → tirage). |

### Corps (C10)

| | Texte |
| --- | --- |
| **Avant** | Absent du pack Analyse, ou risque de remplacer le sport. |
| **Après** | Δ poids + volume/séances en parallèle, épistémique borné (« pas une preuve de causalité »), s’ajoute sans remplacer ; IMC seulement si taille dispo. |

### GTG × repère (C4)

| | Texte |
| --- | --- |
| **Avant** | « Momentum doit rapprocher ces passages… » (dérobade — gate) |
| **Après** | Densité ad hoc + mouvement éventuel du max en co-évolution **hypothèse** ; interdit d’affirmer que le GTG a causé le max. |

## Sélection (R4)

Diagnostics exposés : `selectionDiagnostics`, `starvedFamilies`, `rescuedFamilies`.  
Boost + rescue limitent l’élimination systématique de `adherence` / `body` / `gtg` / `volume` quand des candidats valides existent.

## Tests

```text
vitest : recapAnalyticalFindings, recapAnalysisGoldenPack,
         recapSelectionDiagnostics, recapHorizonEssays, recapEditorialGate
→ verts
```

## Correctifs sélection (général, post-revue live 30 j.)

Pas des rustines sur 14 cartes : règles transversales.

- Plafond sommeil 1/angle + budget total ≤2 (≤1 today).
- Rivaux élargis : assoc sommeil, rythme, GTG now/role (cross-nature).
- RPE sommeil : min n plus haut, mois seulement, paradoxe explicite, poids baissés.
- Titres sleep « robuste » assouplis ; prescription « reps manquantes » → constat.
- Jalons cumul/sessions : franchissement récent sur 7/30 j. ; pénalité parcours long.
- Boost `disc_*` réduit pour sleep ; filet adaptive insights.

## Encore superficiel si données présentes (prochain)

- C3 séances strictement comparables (sets structurés) au-delà du proxy momentum.
- C15 reprise durable : approfondir conséquence post-retour.
- C7 sommeil×volume : conséquence plus nette quand n≥seuil (déjà partiel).

## Plan

Critères de sortie R1–R4 du [plan](./PLAN-MISSION-MAJEURE-MOTEUR-ANALYSE.md) : fondation + pilotes C1/C2/C4/C5/C10 livrés ; inventaire à jour ; golden positif ; instrumentation sélection active.
