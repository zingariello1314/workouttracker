# Preuves — Facts-first et mémoire (Mission 21)

Édition : `p6-sovereign-v20`. Backup sport : `momentum-sport-backup-2026-11-21.json` (ancre rejeu **21 nov**). Audit utilisateur v19 ancré **22 nov** — fenêtres non confondues.

## 1. Code

| Livraison | Fichier / symbole | Rôle |
|---|---|---|
| GTG à la source | `athleteJourney.collectLifetimeRepHistory` + `classicExclusiveRepsForDay` | Catalogue lifetime exclusif |
| Populations | `canonicalAnalyticalPopulations` | CLASSIC / INCLUSIVE / GTG_SYNC_DEDUCTION |
| Attribution | `monthlyProgramComposition.summarizeWindow` / `decomposeMonthlyProgramChange` | Parts distinctes + registre contributions |
| Faits | `analyticalFacts.buildMigratedAnalyticalFacts` | Identités stables consommées |
| Épisode | `sessionEpisodeLedger.stableReturnEpisodeId` | `return_episode\|date\|p:digest\|n:N` |
| Mémoire | `analyticalMemory.evolveCollectivePhenomenonMemory` / `simulateCollectiveMemoryTimeline` | États + no future leak |
| Câblage | `recapPeriodDetectDiscoveries` | Faits + mémoire + décision publication |
| Prose | `phenomenonComposition.moveDisplayName` | Pas d’IDs numériques dans le corps |

## 2. Exécution

```text
npx vitest run src/utils/sport/__tests__/mission21FactsMemory.test.js
npx vite-node artifacts/analysis-eval/_m21_verify_classic.mjs
npx vite-node artifacts/analysis-eval/_m21_verify_attribution.mjs
npx vite-node artifacts/analysis-eval/_m21_chrono_memory.mjs
npx vite-node scripts/m19-replay-eight.mjs --end=2026-11-21
```

Artefacts :

- `artifacts/analysis-eval/mission21-replay-eight.json`
- `artifacts/analysis-eval/mission21-chrono-memory.json`
- `artifacts/analysis-eval/mission21-attribution-proof.json`
- `artifacts/analysis-eval/mission21-rapport-edition.md`
- `artifacts/analysis-eval/mission21-rapport-edition.json`

## 3. Populations (23 sep – 22 oct)

| Population | Volume | Jours |
|---|---:|---:|
| Brut cohérent (réf. M20) | 4166 | — |
| GTG sync déduit | 85 | — |
| **CLASSIC_SESSION** | **3881** | **12** |
| STRENGTH_INCLUSIVE | 4281 | — |

Hypothèse 3966 − 85 = 3881 **confirmée** après correction à la source.

## 4. Attribution (30j ancre 21 nov, preuve dédiée + rejeu)

| Métrique | Valeur rejeu 30j |
|---|---:|
| recognizedVolumeShareRecent | **51 %** |
| recognizedSessionShareRecent | **44 %** |
| unattributedVolumeShareRecent | **49 %** |
| partitionCoverageShareRecent | **100 %** |
| contributionReconciliationGap | **0** |
| sharedFactCount (carte mensuelle) | **8** |

Le 100 % historique mesurait la partition (résidu inclus), pas le volume reconnu.

## 5. Collectif / mémoire

| Horizon | phenomenonId | memory.state | sharedFacts | confirmation |
|---|---|---|---:|---|
| 7d | `return_episode\|2026-11-11\|p:9a959cbd\|n:9` | confirmed_once | 21 | 2026-11-18 |
| 30d | même | confirmed_once | 21 | 2026-11-18 |
| 3m+ | même | confirmed_once | 21 | 2026-11-18 |

Chrono (`mission21-chrono-memory.json`) :

| Cutoff | État | Fuite futur |
|---|---|---|
| ≤ 2026-11-10 | absent_or_interrupted | non |
| 2026-11-11 / 17 | return_observed | non |
| ≥ 2026-11-18 | confirmed_once | non |

`exposureCounted` reste `false` sur génération catalogue.

## 6. Environnement reproductible (rejeu)

```json
{
  "exerciseBank": { "source": "src/data/exerciseDatabase.js", "keyCount": 1374, "digest": "fee896a6" },
  "nameResolver": "journal+program+exerciseDatabase",
  "matching": "session-slot-v3",
  "gtg": "classic-exclusive-v1",
  "facts": "shared-facts-v1",
  "memory": "collective-vertical-v1"
}
```

## 7. Tests

- `mission21FactsMemory.test.js` : 9 OK
- `mission20PopulationsFamilies.test.js` + `mission19AuthorityLedger.test.js` : non-régression OK
- Vitest globale : **non rejouée** ici (exigence ouverte ; suites ciblées M19–M21 vertes)

## 8. DOM

**NON_OBSERVÉ** — identifiants de cartes disponibles dans le rejeu pour une observation ultérieure.
