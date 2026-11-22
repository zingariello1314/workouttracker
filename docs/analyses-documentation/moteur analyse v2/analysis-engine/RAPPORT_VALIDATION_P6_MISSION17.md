# Mission 17 — Rapport de validation P6

**Résultat : FAIL candidature P6** — correctifs d’intelligence ciblés prouvés hors navigateur ; preuve produit 8 horizons live absente.

Édition : `editorial=p6-sovereign-v16`.  
Baseline : v15 (`artifacts/analysis-eval/baselines/p6-sovereign-v15-before-mission17.json`).

**Aucun commit. NO-GO P7.**

---

## Jeu A

| Contrôle | Résultat |
|----------|----------|
| Direction mix hausse ≠ prose baisse | PASS |
| Greffe refusée sur fade musculaire / reprise format | PASS |
| Fait périodique ≠ sujet day | PASS |
| pop objet sérialisé | PASS |
| Contradiction titre/corps direction | corrigée en code |

## Jeu B

| Capacité | Résultat |
|----------|----------|
| Collectif via co-occurrence 11 nov | PASS synthétique |
| Confirmation 18 ≠ reprise 11 | PASS synthétique |
| Collectif simultané non lié | abstention PASS |
| Mix variantes directionnel | PASS |
| Décomp. familles mensuelle | NON_EXÉCUTÉ |
| Adhérence longitudinale packs | NON_EXÉCUTÉ |
| Sommeil contextualisé | NON_EXÉCUTÉ |

## Jeu C

| Contrôle | Résultat |
|----------|----------|
| Boost sélection collectif / mix | code ; live NON_VÉRIFIÉ |
| Pic 18 nov redondant v15 | mécanisme M16 ; live encore redondant en baseline |
| Accessibilité 717 vs 720 | non re-mesuré |

## Tests

```
npx vitest run …mission12…mission17…
→ 60 PASS (7 fichiers)
```

## Rejeu utilisateur

**Impératif avant candidature :** recalculer Recap 8 horizons sur la sauvegarde réelle, exporter JSON v16, vérifier :

1. ≥1 carte `disc_collective_return` sur 30d (reprise) et/ou 7d (confirmation).  
2. Aucune prose « baisse » avec delta positif.  
3. Aucun titre « s’efface… : mélange de variantes ».  
4. Faits `period_volume:…` pour totaux hebdo/mensuels.  
5. Rapport Markdown titré Mission 17.

DOM : `NON_VÉRIFIÉ` tant que non observé.

## ASPECT P6

Critères non assouplis. Candidature **refusée** jusqu’au rejeu live + livraisons restantes (familles, adhérence, mémoire, sommeil, fingerprint).
