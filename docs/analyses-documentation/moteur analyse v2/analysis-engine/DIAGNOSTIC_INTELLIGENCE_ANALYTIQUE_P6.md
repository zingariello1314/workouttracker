# Diagnostic d’intelligence analytique P6 (Mission 11)

Document fondé sur le code réel, les tests et l’audit des 63 cartes accessibles (7j, 15–21 nov. 2026).  
Édition courante : `editorial=p6-sovereign-v10` · `program=structural-context-v2` · `sleep=association-prose-v2` · `audit=normalized-export-v1`  
Baseline gelée : `artifacts/analysis-eval/baselines/p6-replay-p6-sovereign-v9-before-mission11.json`

---

## 1. Réponses aux 18 questions (concret)

### 1. Principale limitation d’intelligence aujourd’hui

**Sélection + composition de faits**, pas l’absence totale de producteurs.

Le moteur produit beaucoup d’observations monodimensionnelles (volume, reprise individuelle, sommeil–volume, ratios) puis les **classe** avec des scores. Il compose rarement une **lecture multi-phénomènes** (variante de programme + trajectoire + reprise collective) en une seule conclusion dominante.

- Module : `recapPeriodSelection.js` (scoring / caps) + producteurs isolés dans `recapPeriodDetectDiscoveries.js`
- Conséquence : 82 titres prioritaires stables v8→v9 ; les missions améliorent surtout claims/évaluations
- Correction : chaînes d’exploration transversales (programme → trajectoire → collectif) avant sélection

### 2. Données, raisonnement, production, sélection ou rédaction ?

| Couche | Diagnostic |
|---|---|
| Données | Souvent présentes (banque, schedule, séries, sommeil) |
| Production | Riche mais fragmentée |
| Raisonnement croisé | **Faible** jusqu’à M11 (début de `programVariantContext`) |
| Sélection | Favorise les détecteurs historiques « flashy » |
| Rédaction | Peut écraser (limitation) ou surexprimer (seuil personnel, dense) |

### 3. Mécanismes qui améliorent vraiment les conclusions

- Claims + `observedValues` (exactitude)
- Consolidation sommeil / homonymes
- Graphe de séances **quand** muscles = banque (M11)
- Annotation variantes prescrites sur trajectoires (M11)
- Garde-fou éditorial (`editorialProseGuard`)

### 4. Mécanismes surtout métadonnées

- `reexplored > 0` sans transformation de texte
- `undexplorationReport` peu consommé par la sélection
- Fingerprint répété sans couverture source
- Scores éditoriaux sans rivale explicite dans le produit

### 5. Données sous-exploitées

- `primaryMuscles` / `secondaryMuscles` de `exerciseDatabase` (étaient court-circuités par `programCategory`)
- Prescriptions distinctes A vs A′ sur le même mouvement
- Dates de reprise collectives partagées
- Durées Garmin vs défis (populations)

### 6. Relations jamais recherchées (ou très rarement)

- Exercice × variante de séance → explication de « baisse » de volume
- Reprise collective nominative avec formats partiels vs complets
- Concentration relative (part locale vs part globale) en une carte
- Densité temporelle réelle vs seuil de volume

### 7–8. Producteurs qui se recouvrent / devraient coopérer

Recouvrement : `disc_sleep_volume` / `assoc` / `quarter` / `zones` ; pics du 18 nov. ; pushPull × ratio.

Coopération attendue : `sessionStructureGraph` ↔ trajectoires ↔ `exploreCollectiveReturn` ↔ adhérence.

### 9. Pourquoi le programme n’était pas transversal

`muscleOf()` lisait `programCategory` (`street_workout`, `muscu`, `cardio`) → `muscleKeys` pollués → similarité musculaire absurde → descriptions = juxtaposition d’intitulés libres.

**Corrigé M11** : `resolveExerciseMusclesFromBank` + exclusion des catégories d’activité ; descriptions par dominantes musculaires.

### 10. Phénomènes majeurs sous-valorisés

- Interruption longue (113 j) vs première apparition
- Reprise collective épaules/triceps mi-novembre
- Redistribution prescrit/réalisé entre variantes

### 11. Horizons longs proches

Couverture reps identique 1y/2y/all (33 680) ; 153 vs 166 jours — similarité légitime si faits utiles proches. Manque d’exploitation de l’activité non-reps.

### 12. Cartes prioritaires persistantes

Haut score de nouveauté/fit des détecteurs historiques + soft-cap encore permissif + peu de rivales structurelles mieux scorées.

### 13. Conclusion multi-phénomènes ?

**Partiellement** : consolidation / pass4 existent ; peu de chaînes « volume↓ + fréquence + famille moins exécutée ».

### 14. 4ᵉ passe transforme-t-elle ?

**Partiellement opérationnelle** : `reviewCollectively` peut réécrire le body via `exploration.conclusion` ; preuves live d’enrichissement rare ; métrique `reexplored` insuffisante.

### 15. A/B/C distinguent-ils intéressant vs correct ?

A = exactitude ; B = références synthétiques + heuristiques (faux positif causalité corrigé) ; C = publication. **Aucun ne mesure l’intérêt sportif profond.**

### 16. Exigences P6 présentes non démontrées produit

Mémoire/rotation, DOM 8 périodes, packs généralisation exportés, aveugle humain, rejeu live post-v10.

### 17. Limites sans historique supplémentaire

Plans figés absents → adhérence 0/0 ; versions de programme passées ; appariement séance↔créneau sans snapshot.

### 18. Meilleur rendement qualitatif

1. Banque musculaire (fait M11)  
2. Variante programme ↔ trajectoire (fait M11, à généraliser)  
3. Collectif de reprise  
4. Vocabulaire volume/densité/charge  
5. Consolidation sémantique sommeil/push/reprises  
6. Export AUDIT_IA (fait)

---

## 2. Origine des analyses (familles)

| Famille | Producteur principal | Type dominant dans cartes finales |
|---|---|---|
| Volume / rythme / concentration | `recapPeriodDetectDiscoveries` | Observations + comparaisons |
| Trajectoires exercice | `exerciseTrajectoryAnalysis` | Détections + % |
| Sommeil | `recapSleepCorrelation` + detect | Associations stats |
| Structure programme | `sessionStructureGraph` + structural | Structurel (noms → muscles M11) |
| Adhérence | `recapProgramAdherenceDiscoveries` | Limites doc + taux |
| Collectif | `analyticalExploration.exploreCollectiveReturn` | **Sous-publié** |
| Ratios push/pull | muscle load engine | Comparaisons population |
| Limites méthodo | claims / polish | Métadonnées |

Présentes en priorités finales : surtout volume, sommeil–volume, push, reprises individuelles, structure familles.  
Rares : synthèses collectives, explications multi-niveaux.

---

## 3. Héritage vs P6 (diagnostic)

Sur 7j live (audit indépendant 63 cartes) : majorité = producteurs historiques enrichis de claims/preuves, textes souvent proches.  
Nouveautés structurelles (familles) présentes mais **redondantes** tant que basées sur intitulés.  
Réexploration : peu visible dans les corps.  
Croisements multi-familles : exceptionnels avant M11.

---

## 4. Capacités relationnelles

| Capacité | État M11 |
|---|---|
| Relation non codée pour un exo précis | **Partielle** (banque + heuristiques) |
| Rapprocher séances apparentées | **Opérationnelle** (graphe) |
| Comparer composants | **Opérationnelle** (`compareSessionPairComposition`) |
| Volume ↔ changement programme | **Partiellement** (`programVariantContext`) |
| Trajectoire multi-épisodes | **Partielle** |
| Reprises → réorga collective | **Présente, peu branchée en priorité** |
| Individuel vs contexte | **Partielle** |
| Hypothèses concurrentes | **Partielle** (pass4 / annotation variante) |
| Révision si meilleure preuve | **Partielle** |

---

## 5. Occasions manquées (cas 7j)

| Cas | Stade de disparition |
|---|---|
| Pompes 3×12 vs 5×10 expliquant « −28 % » | Relation non rapprochée (corr. M11 annotation) |
| Reprise collective 18 nov. | Producteur collectif non promu / individuelles gagnent |
| Concentration relative 3 mouvements épaules | Conclusion non construite (3 cartes isolées) |
| 16 vs 17 nov. (100 pompes compl.) | Décomposition superficielle |
| Densité vs volume sommeil | Mauvaise formulation (corr. titre/corps) |
| muscleKeys activity | Données mal typées (corr. banque) |

---

## 6. Jeu B `disc_sleep_quarter` / `sleep_causality_overclaim`

**Conclusion vérifiée d’abord** : le corps niait déjà la causalité (« sans qu'on puisse en conclure que le sommeil cause… »).

**Cause** : faux positif évaluateur — le mot `cause` matchait sans reconnaître la négation.

**Correctif** : regex de dénégation élargie + case enrichi (`referenceData`, texte, span) ; prose source assouplie (« Association observée »).

Ne pas supprimer le contrôle.

---

## 7. Écarts registre 723 vs accessible 713

Pas 10 conclusions perdues silencieuses : fusions / suppressions sémantiques avec dispositions.

Bug rapport : `reconciled=true` dès `lostSilent=[]`, **sans** exiger `countGap` expliqué.

**Correctif** : `gapAudit`, `countsReconciled`, `reconciledStrict`.

Chiffres v8=v9 : même snapshot / même logique d’écart.

---

## 8. Banque d’exercices (complément)

- Source : `exerciseDatabase` + `inferMuscleLoadRolesForExercise`
- Avant : `programCategory` → muscleKeys
- Après : MuscleGroups uniquement ; cardio exclu du socle reps ; tests noms différents / mêmes noms

Épaules ≠ poussée automatique : classification mécanique reste dans `recapMovementClassification` / load engine — à ne pas confondre avec attribution musculaire (audit ratios encore partiel).

---

## 9. Lexique volume / densité / charge / performance

| Terme | Règle M11 |
|---|---|
| Densité | Volume + durée appariée uniquement |
| Fort volume | Seuil de reps (sommeil quarter) |
| Rendement 0 | → densité non calculable |
| Charge | Ne pas = reps seules |
| Performance | ≠ hausse de reps enregistrées |
| Force catalogue | Abstention si stimulus inconnu |

---

## 10. Audit sémantique transversal (à poursuivre live)

- Progression vs variantes programme : annotation ajoutée
- Collectif 18 nov. : **encore insuffisant en publication**
- Ratios 526+224+554 vs 1340 : populations à documenter (non inventé)
- Homonymes répertoire : identité canonique vs lignes stockage
- FR : `editorialProseGuard` en publication

---

## 11. Matrice de couverture (underexplorationReport.v2)

Produit automatiquement par `buildCoverageMatrix` / `buildUnderexplorationReport` (`underexplorationReport.js`).  
Statuts distincts : `tested_with_candidate` · `tested_non_conclusive` · `data_present_not_elevated` · `examined_abstained` · `never_tested` · `applicability_data_dependent`.

| Relation | Exécutée ? | Notes |
|---|---|---|
| Exercice × séance | Partiel | Catalog / comparable ; graphe peut rester non élevé |
| Séance × variante | Oui | Composition + M11 contexte |
| Prévu × réalisé | Partiel | Adhérence si snapshots |
| Fréquence × volume | Oui | Décomposition B |
| Sommeil × activité | Oui | Associations ; sur-interprétation réduite |
| Collectif reprises | Sous-exploité | exploreCollectiveReturn |
| Charge × séries × reps | Partiel | Selon saisie |

Export : section « découvertes manquées » dans `AUDIT_IA.md` + `explorationRuns.underexploration` dans `ANALYTICAL_AUDIT.json`.

---

## 12. Mémoire `historyCount`

Souvent `null` dans les dossiers : `history` non passé à `buildPeriodAuditDossier`, pas forcément mémoire vide.  
M11 : `memory.historyShape` + note explicite (`array` | `insight_history_object` | `absent_not_passed_to_export`).

---

*Ce diagnostic n’est pas une architecture souhaitée : chaque point cite un module ou un défaut live observé.*
