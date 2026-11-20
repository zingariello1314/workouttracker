# Archive d’évaluation P6

Emplacement **stable** des derniers résultats de rejeu et des jeux A/B/C.

## Chemins

| Rôle | Chemin |
|------|--------|
| Racine | `artifacts/analysis-eval/` |
| Rejeux (datés + latest) | `artifacts/analysis-eval/replays/` |
| Jeux A/B/C | `artifacts/analysis-eval/games/` |
| Synthèses | `artifacts/analysis-eval/summaries/` |
| Miroir navigateur (fetch) | `public/analysis-eval/` |

Les fichiers `*-latest.*` sont écrasés à chaque exécution. Les fichiers datés (`p6-replay-2026-…json`) sont **conservés** pour comparaison.

## Génération

```bash
# Rejeu 8 périodes → p6-replay-latest.json
P4_REPLAY=1 npx vitest run src/utils/sport/__tests__/p4IdentityReplay.test.js

# Jeux A/B/C structurés → games-bundle-latest.json
npx vitest run src/utils/sport/__tests__/evaluationGames.test.js
```

## Contenu attendu d’un rejeu (`p6-replay*.json`)

- édition évaluée
- date d’exécution
- fingerprint des données
- snapshot de référence
- huit périodes
- compteurs détaillés
- conclusions / décisions éditoriales
- problèmes détectés
- temps de calcul

## Accès navigateur

Le dossier d’audit complet (Récap → Analyse → **Exporter le dossier d’audit complet**) lit :

1. l’export live des 8 périodes ;
2. `localStorage` (`momentum.analysisEvalArchive.v1`) pour rejeu / jeux s’ils y ont été poussés ;
3. le miroir public `/analysis-eval/` **limité** (manifeste + résumé) — **pas** de rejeu ni jeux bruts (données personnelles).

Les rejeux restent sous `artifacts/analysis-eval/replays/` (privé, local).  
Baseline figée avant Mission 5 : `artifacts/analysis-eval/baselines/p6-replay-p6-sovereign-v3-before-mission5.json`.

Aucun accès arbitraire au système de fichiers depuis le navigateur.
