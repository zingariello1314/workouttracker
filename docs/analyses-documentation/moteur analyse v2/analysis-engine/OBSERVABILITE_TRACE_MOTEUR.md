# Observabilité et traçabilité — complément P6

Mission complémentaire. Ne démarre pas P7. Aucun second moteur.

## Cartographie des sources

| Surface | Source de données | Mode |
|---|---|---|
| Cartes Récap → Analyse | Pack publié worker (`recapAssessment.insights`) | Produit |
| Bouton Inspecter | Même carte + `serializeConclusion` | Produit |
| Console développeur | Rejeu indépendant **ou** observation dernier run | Diagnostic / observation |
| Registre candidats | `periodDiscoveries.p6` + dossiers période | Produit / export |
| Scripts de rejeu | Artefacts JSON / `computeMissing` | Rejeu |
| Exports 8 horizons | `buildPeriodAuditDossier` → `serializeConclusion` | Produit + cache |
| ANALYTICAL_AUDIT | Registres normalisés (slim + faits + mémoire) | Assemblage |
| ANALYTICAL_REASONING_TRACE | Dossiers 8 périodes + modules + sous-exploration | Assemblage |

## Pourquoi console ≠ pack Analyse

La console recalcule un diagnostic (`diagnostic_recompute`) pour expérimenter sans écrire la mémoire utilisateur ni remplacer le pack affiché.

- Avantages : liberté expérimentale, isolation, pas de fausses expositions mémoire.
- Risques : divergences d’entrée, population, fingerprint, mémoire, programme, config ou ordre d’exécution → conclusions non comparables au pack produit si on ignore le mode.

**Comparabilité** : mode « Dernier run produit » lit `__momentumLastProductObservation` + cache publié (aucun recalcul). Le rejeu reste disponible et est étiqueté comme tel. Ne pas supprimer la liberté diagnostique.

## Exports

- **ANALYTICAL_AUDIT** : registre normalisé (identité, claims, faits, mémoire, dispositions).
- **ANALYTICAL_REASONING_TRACE** : étapes, transformations (diffs), modules exécutés, lifecycle de sous-exploration, anomalies, index bulk d’inspection.
- Même `analysisRunId` / édition / fingerprint pour rapprochement.
- Pas de fabrication rétrospective si le pipeline n’a pas été instrumenté (`instrumented: false`).

## Sous-exploration v3

Lanes : données indisponibles · non applicable · applicable jamais exécutée · explorée sans conclusion · rejetée preuves insuffisantes · produite · validée non sélectionnée · publiée.

Absence de candidat ≠ relation correctement explorée.

## Performance

Collecte détaillée via export optionnel ; registres par références ; diffs plutôt que copies ; coût nul si l’utilisateur n’exporte pas la trace.

Banc synthétique 8×12 conclusions (`artifacts/analysis-eval/_obs_size_bench.mjs`) :

| Artefact | Taille JSON | Temps assemblage |
|---|---|---|
| ANALYTICAL_AUDIT | ~165 Ko | ~6 ms |
| ANALYTICAL_REASONING_TRACE | ~229 Ko (×1,39) | ~3 ms (réutilise dossiers) |

Pas de double calcul métier : la trace lit les dossiers déjà sérialisés.
