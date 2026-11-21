# Architecture et contrats — moteur d’analyse

**Statut :** architecture **implémentée** (2026-11-04) + écarts connus.  
**Ne pas confondre** avec l’architecture projetée (mémoire éditoriale complète, plans temporels multi-stratégies généralisés).

## Pipeline réel (DOM)

```
snapshot / window / period
  → buildComposedInterpretationPipeline
      → detectDiscoveries + trajectoires + composedEvidence + F4
      → selectPeriodDiscoveriesWithTrace (IV + collapse + rivalités)
  → buildSpanStoryCandidates (selectAnalysisCatalog / evaluateVolumeChange…)
  → merge candidates (span + composed)
  → novelty / nature weights
  → keepDistinctProofCards (parenté + reprises + rivalité volume)
  → filterValidInsights → selectNarrativeColumns
  → insights.shortTerm | mediumTerm | longTerm  ← rendu RecapAnalyseView
```

`periodDiscoveries.selected` alimente la console / debug ; le DOM utilisateur lit surtout `insights.*`.

## Distinction des objets

| Objet | Rôle |
|---|---|
| Événement | Séance / reps / séries enregistrées |
| Signal | Agrégat ou détecteur brut |
| Preuve composée | `composedEvidence` (faits + mécanismes) |
| Phénomène | `buildPhenomenonRecord` — identité stable hors titre |
| Analyse publiable | Qualité intrinsèque OK |
| Sélectionnée | Gagne IV + rivalités + colonnes |
| Carte DOM | Entrée de `insights.*` après kinship |

## Modules et responsabilités

| Module | Responsabilité |
|---|---|
| `recapInterpretationPipeline.js` | Orchestration composée |
| `recapComposedEvidence.js` | Preuves + `classifyVolumeAttribution` |
| `recapComposedNarration.js` | Narration F4 + cohérence |
| `exerciseTrajectoryAnalysis.js` | Trajectoires / séries / continuity |
| `recapVolumeQuestion.js` | Attribution catalogue → `span_volume_vs_frequency` |
| `recapPhenomenonContract.js` | Identité phénomène + collapse |
| `recapPeriodSelection.js` | IV E0 + collapse reprises |
| `recapEditorialSelection.js` | Ajustements IV F5 + rivalités |
| `recapCardKinship.js` | Dédup pack insights (DOM) |
| `recapDiscoveryPeriodScope.js` | Fenêtre morte / exercice hors période |
| `insightNoveltyEngine.js` | Nouveauté vs historique |

## Invariants

1. **Référentiels** — toute comparaison chiffrée nomme sa population (fenêtre vs précédente, early/late d’arc, etc.).
2. **Pas de mélange silencieux** — « volume/séance stable » et « 20 → 48 » interdits sans distinction explicite.
3. **Un épisode de reprise / mouvement** — gaps 42 j et 77 j ne coexistent pas s’ils racontent le même retour.
4. **Meilleure interprétation** — `span_volume_vs_frequency` (mécanisme) bat `disc_volume_shape` (portrait) sur le même phénomène de volume global.
5. **Fenêtre** — pas de carte exercice si `windowSessionCount === 0` dans la période affichée.

## Contrats ajoutés (v2)

| Module | Rôle |
|---|---|
| `recapMetricContract.js` | Affirmations numériques traçables (`buildMetricFact`, comparabilité référentiels) |
| `recapTemporalStrategy.js` | Plans de découpage scorés (pas course au %) |
| `recapEditorialLifecycle.js` | Statuts + fraîcheur ponctuelle + réserve méta |
| `returnEpisodeCollapseKey` | Collapse reprise nom+date / id (pas homonyme inventé) |

`classifyVolumeAttribution` annote désormais `metrics.metricFacts`.  
`buildAdaptiveInsights` expose `temporalPlans` (sélection scorée) — **rédaction long horizon pas encore pilotée par ces plans**.

## P6 branché

`buildPeriodDiscoveryBundle` appelle `applyP6`. Le paquet porte `p6.counters`, les vues À retenir / Toutes / Autres angles, et `inspection` sur chaque conclusion retenue. Une conclusion n'hérite la priorité que si la carte déjà retenue a le même kind, le même exercice, le même mécanisme, le même titre et la même preuve. Le corps peut être réécrit sans créer une autre conclusion. Une conclusion consolidée remplace ses sources lorsqu'au moins l'une d'elles était prioritaire. Le budget 11 est un budget de colonne. Le diagnostic recalculé lit `raw.p6` et reste distinct du paquet `pipeline` puis du paquet `published`.

## Architecture projetée (reste)

- Propagation metric facts à tous les producteurs
- Plans temporels → choix de narration / preuves long horizon
- Réserve publiable persistante
- Caps UI ≠ éditorial
- Console « pourquoi perdu »

Voir `IMPLEMENTATION_PROGRESS.md`.

---

## Chapitre Mission 7 — Compréhension structurelle et historique des programmes

**Édition :** `editorial=p6-sovereign-v6` · `program=structural-adherence-v1` · `review=collective-pass4-v3`

### Niveaux navigables

Le moteur relie, sans second pipeline indépendant :

1. Répétitions → 2. Séries → 3. Exercices → 4. Variantes → 5. Groupes musculaires → 6. Fonctions → 7. Blocs → 8. Séances → 9. Familles de séances → 10. Cycles → 11. Programmes → 12. Versions historiques → 13. Parcours réel.

Modules : `sessionStructureGraph.js`, `multidimensionalAdherence.js`, `structuralProgramDiscoveries.js`, contrats P3–P5 (`plannedVsPerformedAssessment`, `recapProgramStructureReport`, ledger musculaire).

### Distinction structurante

| Source | Signification |
|---|---|
| Structure programmée (`activeProgram.schedule`) | Intention documentée |
| Structure reconstruite (pratique) | Exécution observée |
| Plan historique inconnu | Abstention — jamais le programme actuel appliqué au passé |

Les catégories (PPL, upper/lower, full body…) sont des **repères descriptifs**, pas des cases obligatoires. La similarité de séances repose sur le contenu (exercices, muscles, volume), jamais sur une règle calendaire fixe.

### Adhérence multidimensionnelle

Vecteur (`momentum.adherenceVector.v1`) : reps, séries, exercices, groupes intégralement couverts, concentration des omissions, travail hors prescription. **Les dimensions ne sont pas interchangeables.** Patterns : `targeted_omission`, `uniform_reduction`, `broad_shortfall`, `complete`. Contextualisation multi-jours : omission isolée vs récurrente, sans attribution d’intention.

### Profondeur des conclusions

Grammaire (dimensions choisies selon la valeur) : quoi / comment / contexte / nouveauté / depuis quand / fréquence / explications démontrables / hypothèses exclues / effet organisationnel / incertitude / implications ultérieures (préparation) / surveillance.

Conséquences **organisationnelles démontrables** autorisées en P6. Conséquences physiologiques, recommandations sportives complètes et projections → **P7 uniquement** (`conclusionHierarchyContract.p7ActionabilityPrepFields`).

### Hiérarchie fonctionnelle des conclusions

Rôles : principale · approfondissement · complémentaire autonome · catalogue admissible · historique analytique. Aucun quota arbitraire de cartes. Une preuve supplémentaire n’est pas une nouvelle principale (`conclusionHierarchyContract.js`).

### Quatrième passe

`collectiveReview` réexplore si couverture faible, concentration faible vs journées proches, composition near_equal sous-explorée, ou reprises individuelles sans lecture collective.

### Export d’audit

Secteurs : `source-data/`, `program-understanding/`, conclusions 8 périodes, `reasoning/` (dont `underexploration-report.json`), évaluation A/B/C, DOM, diagnostic. Noms d’artefacts alignés sur l’édition réelle (`p6-replay-v6-latest.json`, jamais un « v4 » silencieux pour une autre édition).
