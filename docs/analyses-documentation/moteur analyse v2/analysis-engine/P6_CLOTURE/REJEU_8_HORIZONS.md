# Rejeu analytique indépendant — 8 horizons (v36)

**Verdict : PARTIEL** (périmètre fort démontré)  
**Digest LIVE :** `c3e80330` · **Édition :** `p6-sovereign-v36`  
**Commande :** `npx vite-node artifacts/analysis-eval/p6-closure-v36/run-independent-replay.mjs`  
**Artefact :** `artifacts/analysis-eval/p6-closure-v36/closure/RECONCILIATION_CATALOGUE.json`

## Entrées utilisées (pas les sorties)

Source : `zip/replay/LIVE_INPUTS.json`

| Champ | Présent |
|---|---|
| reps | 809 clés |
| checkedExercises | 815 |
| exerciseWeights | 578 |
| exerciseSetLogs | 602 |
| nameMap | 119 |
| garmin dailyMetrics | 404 jours |
| programme schedule | 7 jours · series |
| memoryInitial | 40 publications · 2 phénomènes |
| analysisWindowEnd | 2026-11-27 |
| lastSessionDate / anchor | 2026-11-24 |

Les fichiers `eight-periods/` et `ANALYTICAL_AUDIT.json` servent **uniquement** à la confrontation, jamais comme entrées du moteur.

## Séparation A / B

| Couche | Méthode |
|---|---|
| **A. Déterminisme** | `buildPeriodDiscoveryBundle` + `insightsFromP6` sans mémoire |
| **B. Mémoire** | Même calcul avec `memoryInitial` du LIVE |

## Programme (déterministe) — PASS

| Jour | Export | Rejeu |
|---|---:|---:|
| lundi…dimanche | 384 / 436 / 424 / 359 / 436 / 418 | **identiques** |
| Familles multi | 3 | 3 |

## Priorités publiées vs rejeu (avec mémoire)

| Horizon | Fenêtre | Intersection prio | Ordre | Mémoire Δ prio |
|---|---|---:|---|---|
| today | ✓ | 6/6 | ✓ | non |
| 7d | ✓ | **10/11** | non | non |
| 30d | ✓ | 11/11 | ✓ | oui |
| 3m | ✓ | 11/11 | ✓ | oui |
| 6m | ✓ | 11/11 | ✓ | oui |
| 1y | ✓ | 11/11 | ✓ | oui |
| 2y | ✓ | 11/11 | ✓ | oui |
| all | **écart start** | 11/11 | ✓ | oui |

### Première divergence causale (7d)

| Publié | Rejeu |
|---|---|
| `disc_calendar_rhythm` — « Ces 7 jours mêlent un bloc chargé et un creux » | `disc_sleep_volume` — alignement volume / nuits longues |

Pas un effet mémoire (`memΔ=false`). Écart de **sélection** entre un rythme calendaire de fenêtre et une association sommeil historique — une seule place de priorité. Les 10 autres priorités 7d coïncident.

### Fenêtre `all`

| | Start | End |
|---|---|---|
| Produit publié | **2025-10-20** (premier jour Garmin) | 2026-11-27 |
| Helper `windowFor` | 2026-01-05 (firstRepKey) | 2026-11-27 |

Cause : « Toujours » produit = couverture multi-sources observée ; helper de rejeu = première clé de reps. **Les 11 priorités restent identiques** malgré l’écart de borne.

### Catalogue accessible

Deltas de 1–10 cartes selon l’horizon (intersection élevée, non bit-identique). Réserve élargie ≠ surface éditoriale prioritaire.

### Fingerprint reconstruit

`65047db4` ≠ `c3e80330` : forme d’assemblage garmin/challenges dans le snapshot reconstruit, **sans** empêcher l’alignement des priorités. Ne pas déclarer PASS sur la seule coïncidence d’empreinte — ici l’inverse : empreinte différente, priorités largement reproductibles.

## Verdict exact

**PARTIEL — programme PASS · fenêtres 7/8 exactes · priorités 82/83 slots alignés (ordre exact sur 7 horizons) · 1 divergence de sélection 7d documentée · accessible non bit-identique · mémoire influence l’ordre sur horizons ≥30d.**
