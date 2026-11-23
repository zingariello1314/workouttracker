# DIAGNOSTIC — Régression v23 (Mission 25)

Édition de départ : `p6-sovereign-v23` → correction : `p6-sovereign-v24`.  
P6 non clôturée. NO-GO P7. Aucun commit.

## Faits d’export (utilisateur)

| Indicateur | v22 | v23 |
|---|---:|---:|
| cardRegistry | 688 | 296 |
| Priorités | 83 | 166 |
| Complémentaires | 605 | 130 |
| claimRegistry | 688 | 14 |
| factRegistry | 58 | 0 |
| candidateRegistry | 1449 | 1459 |

- today : 14 cartes / 14 claims.
- 7 autres horizons : cartes présentes, **0 claim**.
- Trace P6 exécutée (validation→…→publication).
- `schemaValidation.ok=true` malgré la perte.
- Sur 7d : select=11, audit priorités=17, publication=11 ; cardRefs=8 vs 25 cartes.

Les exports bruts v22/v23 n’étaient pas présents dans le dépôt ; le gel local est `artifacts/analysis-eval/mission25-baseline/`.

## Cause racine (démontrée)

**Fichier** : `src/utils/sport/p6Pipeline.js`  
**Fonction** : `applyP6`  
**Appelant** : pipeline période → `insightsFromP6` → `buildAdaptiveRecapInsights`

Après Mission 24, `applyParallelTrajectoryComposition` **ajoute** des parents composés au pool **après** `wrap`.  
`reconcileCounters` comparait :

```
admissible = produced - rejected   // produced = wrapped.length
right = priority + reserve + fused + blocked + suppressed
```

Les parents composés gonflent `right` sans entrer dans `produced` → `reconciled=false`.

### Chaîne réelle

1. P6 s’exécute (trace OK).
2. `counters.reconciled === false`.
3. `insightsFromP6` → `publicationAuthority: 'p6_unavailable'`.
4. `buildAdaptiveRecapInsights` bascule sur **`legacy_fallback`**.
5. `publishableCard` / `toInsightCard` **n’attachent aucun claim**.
6. Dossiers hors today = cartes sans claim → `claimRegistry` réduit à today (seul horizon encore réconcilié, souvent sans clusters parallèles).
7. Priorités legacy ↑ (pas de budget P6) ; réserve/complémentaires ↓ ; `factRegistry` vide ; `publicationCount`/`registryCount` null.

### Preuve minimale (reproductible)

```text
artifacts/analysis-eval/mission25-baseline/probe-parallel-counters.mjs
→ composed=1, priority+reserve=3, produced=2, reconciled=false
```

```text
artifacts/analysis-eval/mission25-baseline/probe-applyP6-parallel.mjs (après fix)
→ reconciled=true, authority=p6, parallel.hasClaim=true
```

## Réponses aux questions obligatoires

| # | Réponse | Nature |
|---|---|---|
| 1 | today a peu/pas de clusters parallèles → compteurs OK → P6 conserve les claims ; les autres horizons cassent plus souvent | **Conclusion démontrée** (mécanisme) ; incidence exacte par horizon = **hypothèse** sans export figé local |
| 2 | Les conclusions P6 existent dans `periodDiscoveries.p6` mais la publication utilisateur bascule legacy | **Démontré** |
| 3 | Les candidats (raw) restent stables : détection amont inchangée | **Démontré** |
| 4 | Le fallback legacy remplit short/medium/long sans sélection P6 → priorités ↑ | **Démontré** |
| 5 | Absentes du produit publié (autorité legacy), pas seulement de l’export | **Démontré** pour le chemin code ; DOM **NON_OBSERVÉ** |
| 6 | Oui : `legacy_fallback` dans `recapAdaptiveInsights.js` | **Démontré** |
| 7 | Déclenché par `!p6.counters.reconciled` (et P6 absent) | **Démontré** |
| 8 | Tests M24 unitaires ne traversaient pas compteurs+fallback+serialize 8 horizons | **Démontré** |
| 9 | `validateAnalyticalAudit` ne vérifiait que le schéma / claims orphelins, pas l’absence massive de claims ni le fallback | **Démontré** |

## Distinctions

- **Faits** : compteurs export ; `reconciled=false` dès +1 parent parallèle ; legacy sans claim.
- **Hypothèses** : fréquence exacte des clusters parallèles par horizon sur le jeu utilisateur.
- **Conclusions démontrées** : rupture = publication après sélection (compteurs), pas la détection ; correction = compter `composedParallel` + claim sur parent + validation intégrité.

## Non-causes écartées

- Pas une purge mémoire.
- Pas une reconstruction texte de claims.
- Pas un cache édition seule (l’édition v23 *introduit* le bug via parallèles).
- Pas `serializeConclusion` comme premier point de rupture (elle transporte le claim s’il existe).
