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

## Architecture projetée (non encore dominante)

- Plans de comparaison temporelle multi-stratégies scorés
- Réserve publiable persistante + republication intelligente
- Qualification intrinsèque séparée de la priorité contextuelle (statuts complets)
- Nombre de cartes purement piloté par valeur marginale (caps UI ≠ caps éditoriaux)

Voir `IMPLEMENTATION_PROGRESS.md` pour l’état d’avancement.
