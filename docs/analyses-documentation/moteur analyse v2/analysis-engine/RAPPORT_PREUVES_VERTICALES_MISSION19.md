# RAPPORT DES PREUVES VERTICALES — Mission 19

Édition exécutée : **`p6-sovereign-v18`**.  
Baseline gelée : `artifacts/analysis-eval/baselines/p6-sovereign-v17-before-mission19.json`.  
Snapshot : `artifacts/analysis-eval/snapshots/momentum-sport-backup-2026-11-21.json` (11 et **18** nov. vérifiés).  
Rejeu : `npx vite-node scripts/m19-replay-eight.mjs` → `artifacts/analysis-eval/mission19-replay-eight.json`.

## Livraison 1 — Séances / épisodes / collectif

| Preuve | Contenu |
|---|---|
| Code | `sessionEpisodeLedger.js` ; branchement dans `detectDiscoveries` ; producteur `sessionEpisodeLedger+exploreCollectiveReturn+…` |
| Exécution | Rejeu 8 horizons : collectif présent 7d→all ; **pas** conditionné à une carte individuelle publiée |
| Résultat 7j | Titre confirmation ; corps « commencée le 11… se confirme le 18… » (noms résolus) ; `episodeQual` 9 participants / 9 confirmations |
| Résultat 30j | Mode `return` ; même `episodeId` `return_episode\|2026-11-11` |
| Contre-exemples | Tests ledger : dates distinctes sans cluster ; circularité variantes volume-only |
| Non-régression | Vitest M16/M17/M18/M19 verts (26 tests ciblés) |

**Limites** : today peut encore sélectionner un autre épisode (30 oct.) ; horizons longs répètent la même lecture Nov 11 (angle peu différencié).

## Livraison 2 — Souveraineté de la thèse

| Preuve | Contenu |
|---|---|
| Code | `draftFromClaim.authoritativeBody` ; `exploreDiscovery` court-circuit composition ; `applyP6` n’écrase plus composition |
| Exécution | Corps 7j = composition (plus « 9 mouvements reviennent… » brut) |
| Variantes | Appariement créneau/`dayKey` avant proximité volume ; `circularRisk` → pas de `variant_mix_shift` |
| Contre-exemple | Test M16 « volume seul ne suffit pas » |

**Limites** : doublons 104/504 non consolidés en sélection cette mission ; export slim perd encore certains champs (namedMoves) selon le sérialiseur.

## Livraison 3 — Composition mensuelle

| Preuve | Contenu |
|---|---|
| Code | `monthlyProgramComposition.js` + injection detect (week/month) |
| Exécution | Carte `disc_program_family_volume_decomposition` sur **7d et 30d** du rejeu |
| Résultat 30j | Volume 3966→5803 ; jours 16→18 ; contributeur dominant encore **« non attribué »** (templates programme insuffisamment alignés) |
| Unitaire | Hausse attribuée à une famille Push plus fréquente (test synthétique) |

**Limites** : généralisation A–F packs complets non rejouée ; attribution réelle utilisateur majoritairement non attribuée → preuve **partielle**.

## Quatre niveaux (exigence §13)

| Livraison | Unitaire | Pipeline | Publié (rejeu) | DOM |
|---|---|---|---|---|
| Collectif ledger | oui | oui | oui (sélectionné) | non |
| Autorité thèse | oui | oui | oui | non |
| Familles mensuelles | oui | oui | oui (7d/30d) | non |
| Variantes anti-circulaire | oui | partiel | partiel | non |

## Jeux A/B/C / Vitest globale / aveugle

Non exécutés intégralement cette mission (rejeu 8 horizons + suites ciblées seulement).
