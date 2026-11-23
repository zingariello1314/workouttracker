# Rapport de preuves verticales — Mission 22

Édition : `p6-sovereign-v21`. Backup : `momentum-sport-backup-2026-11-21.json`.

## 1. Code (modules)

| Chaîne | Fichiers |
|---|---|
| Export faits/mémoire | `evaluation/buildAnalyticalAudit.js` (`slimCard`, `factRegistry`, `memoryEvidence`) |
| Assemblage ZIP | `evaluation/completeAuditDossier.js` |
| Export UI | `components/tabs/RecapTab.jsx` (`memorySummary`) |
| Mémoire | `analyticalMemory.js`, injection `recapPeriodDiscoveries` / `recapInterpretationPipeline` / worker / `useRecapTabMetrics` |
| Continuité épisode | `sessionEpisodeLedger.resolveContinuousEpisodeId` |
| Fingerprint v4 | `analysisEnvironmentDossier.snapshotFingerprint` |
| Attribution | `monthlyProgramComposition` (inchangé conceptuellement ; parité mesurée) |

## 2. Exécution

```text
npx vitest run src/utils/sport/__tests__/mission22Convergence.test.js
npx vitest run src/utils/sport/__tests__/mission21FactsMemory.test.js src/utils/sport/__tests__/mission19AuthorityLedger.test.js
npx vite-node artifacts/analysis-eval/_m22_parity_attribution.mjs
npx vite-node scripts/m19-replay-eight.mjs --end=2026-11-21
```

## 3. Résultats

### Attribution (ancre 21 nov)

| Run | recognizedVolume | partition | structural sessions | probable |
|---|---:|---:|---:|---:|
| basic journal+DB | ~51 % | 100 % | 0 % | ~44 % |
| enriched identity | ~51 % | 100 % | 0 % | ~44 % |
| enriched end=22 | ~51 % | 100 % | 0 % | ~44 % |

Volumes : recent 5803, previous 3881, gap contributions 0.  
App v20 à 100 % recognized : **non reproduite** ici → écart d’environnement.

### Export (test)

- `sharedFacts` présents sur carte slim.  
- `memory.state=confirmed_once` exporté.  
- `factRegistry` count > 2.  
- `memoryEvidence.status=loaded` si résumé fourni.

### Mémoire scénarios (tests)

| # | Scénario | Statut |
|---|---|---|
| 1 | Première découverte | OK |
| 2 | Recalcul identique | OK |
| 3 | Restauration profil | OK (localStorage mock) |
| 4 | Publication ≠ exposition | OK |
| 5 | Confirmation | OK |
| 6 | knowledgeCutoff | OK |
| 7 | Continuité digest | OK |
| 8 | Famille hors collectif nov. | OK |

### Hiérarchie

- Lien parent collectif / enfant retour : `verified_parent_child` (UT).  
- Observation UI : **NON_OBSERVÉ**.

## 4. Non-régression

Suites M19–M22 ciblées vertes après assouplissement des assertions d’édition.

### Vitest globale

```text
Commande : npx vitest run
Constat : exécutée ; échecs massifs hors moteur sport (ex. useBooksStorage hors BooksStorageProvider, useAuth hors AuthProvider, composants sidebar).
Suites sport M19–M22 : non bloquées.
Exigence Vitest globale : reste OUVERTE — diagnostic = environnement de test UI/providers, pas régression M22 analytique.
```

## 5. Exigences P6 (extrait registre)

Voir `REGISTRE_CLOTURE_P6.md` mis à jour — états NC / IMP / UT / PIPE / PUB / DOM / QUAL.

## 6. Paquet aveugle

Non évalué. Préparer ultérieurement un export anonymisé `qualitative-blind/` sans prétendre à une notation.
