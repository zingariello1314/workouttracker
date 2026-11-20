# Mission 4 — Bilan P6 (édition `p6-sovereign-v3`)

Verdict : **P6 partiellement démontrée — NO-GO P7.**  
Progrès réels sur souveraineté de publication, densités, défi pompes, sélection collective, rédaction depuis thèse et jeux A/B/C reconstitués. Plusieurs critères §19 restent partiels ou non vérifiés (DOM, sommeil, horizons différenciés, mémoire/rotation, comparaison qualitative live 20 nov.).

Édition active :  
`consolidation=narrative-coherence-v2;duration=paired-density-v3;editorial=p6-sovereign-v3;…;stimulus=challenge-unknown-v1`

Rejeu : sauvegarde **19 nov. 2026** → `%TEMP%/p6-replay.json` (`P4_REPLAY=1`).  
Exports UI du **20 nov.** non rejoués ici (fingerprint / borne différents).

---

## A. Diagnostic des causes

| Problème | Cause réelle | Composants | Classe | Correction | Non-régression |
|---|---|---|---|---|---|
| Pack public ≠ registre P6 | `selectNarrativeColumns` + réserve legacy republiaient des sources fusionnées après P6 | `recapAdaptiveInsights.js`, `p6Publication.js` | Contournement pipeline | `insightsFromP6` = autorité si `counters.reconciled` | `p6Publication.test.js`, jeu C |
| Sources fusionnées accessibles | Réserve héritée + titres fusionnés encore dans le catalogue | `insightsFromP6`, `NarrativeCoherenceEngine` | Publication | Exclusion `source_retained` / `collapsedInto` ; doublons → `exact_duplicate_suppressed` | jeu C, `p6AnalyticalIntelligence` |
| « Endurance musculaire » = volume défi | `classifyStimulus` classait le libellé d’espace | `recapStimulusCatalog.js` | Population / sémantique | `physiologicalUnknown` pour défi / appellation d’espace | `recapStimulusCatalog.test.js`, jeu A |
| Densité 3 277 reps/h | Minutes hors course ≈ défis, numérateur = volume global | `recapPeriodMeasure.js`, `detectDiscoveries` | Populations incompatibles | `densityPaired` ; `repsPerHour=null` sinon ; gate découverte | jeu A |
| Sélection = copie du legacy | `wasPriority` obligatoire pour entrer en priorité | `collectiveSelection.js` | Éditorial | Classement marginal ; promotion fusion / overturn legacy | test promotion fusion |
| Texte hérité = autorité | Claim rempli après coup depuis titre/corps | `draftFromClaim.js`, `p6Pipeline.js` | Rédaction | Draft depuis claim + exploration | `draftFromClaim.test.js` |
| Concentration 14 nov. faible | Peak day sans test de quasi-égalité | `recapPeriodDetectDiscoveries.js`, `exploreNearEqualSessions` | Raisonnement | Comparaison composition si volumes proches | `draftFromClaim.test.js` |
| Harnais P1 A/B/C absent | Jamais versionné / perdu hors dépôt | `evaluation/*` | Évaluation | Reconstitution distincte, baselines B0/B1 non réécrites | `evaluationGames.test.js` |

---

## B. Tableau des huit périodes (même snapshot 19 nov.)

| Horizon | Produits | Admissibles | Fusionnées | Priorité P6 | Réserve | Priority legacy in | ms | Réconcilié |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Aujourd’hui | 6 | 6 | 0 | 6 | 0 | 2 | 7 046 | oui |
| 7 j | 51 | 51 | 12 | 11 | 28 | 13 | 6 467 | oui |
| 30 j | 72 | 72 | 12 | 11 | 49 | 25 | 7 341 | oui |
| 3 m | 93 | 93 | 12 | 11 | 70 | 27 | 11 389 | oui |
| 6 m | 99 | 99 | 12 | 11 | 76 | 26 | 11 439 | oui |
| 1 an | 91 | 91 | 3 | 12 | 76 | 29 | 12 358 | oui |
| 2 ans | 89 | 89 | 3 | 12 | 74 | 29 | 13 947 | oui |
| Toujours | 87 | 87 | 3 | 12 | 72 | 29 | 11 804 | oui |

Lecture : la priorité P6 (11–12) **n’égale plus** l’entrée legacy (13–29) sur les horizons longs → la sélection collective **remet en cause** les anciens arbitrages.  
Catalogue accessible attendu = priorité + réserve (sources fusionnées hors pack).  
**DOM / export 20 nov. non confrontés** à cette édition.

Ouverts : redondances sémantiques sommeil ; `portion` encore détectée sur 30 j dans le rejeu ; Aujourd’hui sans séance = cartes d’attente (attendu sur ce snapshot).

Volumes octobre : 4 167 cochées + 200 pompes hors `reps` = 4 367, écart **expliqué**. Six mois : 31 341 + 500 hors `reps`.

---

## C. Preuves qualitatives (méthodes, pas textes figés)

1. **Consolidation / progression** — cohérence narrative sur un même niveau (ex. 36 vs médiane) : fusions avec preuves conservées (`NarrativeCoherenceEngine`).  
2. **Reprise** — retours individuels + `exploreCollectiveReturn` si ≥3 retours dans ≤14 j.  
3. **Transformation collective** — famille d’épaules/triceps : détection structurale, pas huit reformulations identiques comme seule sortie.  
4. **Comparaison de séances** — 14/16/17 nov. : `exploreNearEqualSessions` (défi, largeur de répertoire, mix poussée) au lieu d’une « concentration exceptionnelle » si volumes proches.  
5. **Décomposition de volume** — `exploreVolumeChange` + décomposition symétrique (fréquence vs contenu) pour hausses **et** baisses.  
6. **Relation transversale** — challenge format × volume programme ; densités séparées.  
7. **Sommeil** — consolidation partielle via cohérence ; **redondance multi-seuils encore ouverte**.  
8. **Trajectoire longue** — arcs mensuels / parcours conservés ; pertinence 1 an vs 2 ans / Toujours encore trop proche quand la couverture est identique.  
9. **Défi pompes** — `challengeFormatTimeAnalysis` : même 5×20 / 100 reps, temps ↓ ; `physiologicalNature=unknown` ; pas de force/hypertrophie inventée.

---

## D. Évaluation indépendante

| Élément | État |
|---|---|
| `evaluationTypes` / `gameA` / `gameC` | Présents (reconstitués) |
| `gameBDiscoveryQuality` | Reconstitué (cas synthétiques) |
| Harnais P1 historique (`gameAAccuracy` original, baselines B0/B1, `replayTestDoubles`, etc.) | **Non retrouvé** dans le dépôt / branches accessibles |
| Jeu A | Exécuté — claims, densités non appariées, défi ≠ endurance |
| Jeu B | Exécuté — hits de référence ; **pas** de paquet à l’aveugle externe |
| Jeu C | Exécuté — doublons / fusionnés / préservation admissible |
| Comparaison humaine à l’aveugle | **Absente** |

---

## E. Preuves produit

| Contrôle | Résultat |
|---|---|
| Édition observée (rejeu) | `editorial=p6-sovereign-v3` |
| Inspecteur carte | Bouton « Inspecter » DEV/admin dans `RecapAnalyseView` (claim, preuves, disposition) |
| DOM 8 périodes | **Non vérifié** — `localhost:3001` répond 404 |
| Exports 8 périodes / comparaison | Code `buildEightPeriodAudit` + hooks `window.momentumExport*` ; tests unitaires OK |
| Concordance paquet↔DOM | **Non acquise** |

### Obtenir les exports depuis l’app

1. Lancer Momentum (Vite) sur un port qui sert l’UI.  
2. Onglet Récap → période voulue → attendre publication `ready`.  
3. Console d’analyse (admin/DEV) ou `window.momentumExportEightPeriods()`, `window.momentumExportPeriodComparison({ a:'7d', b:'30d' })`, export période courante.  
4. Fichiers JSON téléchargés : schéma `momentum.analysisEnvironmentDossier.v2` / `momentum.analysisEightPeriodExport.v1`.  
5. Vérifier `agreement.edition`, `domVerified` (ne jamais forcer à true hors DOM réel), `userAccessible` vs `internal.p6`.

---

## F. Inventaire des autres onglets (préparation future, hors P6)

Inventaire détaillé (12 points × espace) : [`TABS_INVENTORY.md`](./TABS_INVENTORY.md).

Résumé : pompes défi + GTG + course déjà partiellement dans le moteur ; gainage / corde / boxe / natation / circuits / pyramide ont des données mais peu ou pas de discoveries P6 ; marche = classification + Garmin + `manualDailyWalkByDate`, pas un silo séparé.

---

## G. Dossier analytique exportable

- Rejeu moteur : `C:/Users/zinga/AppData/Local/Temp/p6-replay.json`  
- Tests : `npx vitest run src/utils/sport/__tests__/p6*.test.js … evaluationGames …` (41+ tests cœur P6 verts sur le batch Mission 4)  
- Exports app : voir §E (nécessite UI live)

---

## Critères bloquants §19

| Critère | Statut |
|---|---|
| Aucun contournement pipeline visible | **Partiel** — publication via `insightsFromP6` ; chemin legacy conservé si P6 non réconcilié |
| Cartes accessibles avec claim inspectable | **Validé** côté contrat publication |
| Aucun doublon exact accessible | **Validé** en tests ; à confirmer DOM |
| Aucune source fusionnée équivalente | **Validé** en tests |
| Aucune contradiction factuelle packs contrôlés | **Partiel** — moteur bloque ; packs UI 20 nov. non recontrôlés |
| Populations incompatibles | **Validé** densités ; autres métriques à surveiller |
| Réconciliation volumes/durées | **Partiel** — octobre expliqué ; densités abstention |
| Séparation défi pompes | **Validé** |
| Quatre passes | **Partiel** — passes 1–3 renforcées ; passe 4 diagnostic incomplet |
| Raisonnements transversaux | **Partiel** — généralisables posés, couverture limitée |
| Amélioration qualitative perceptible | **Partiel** — méthodes oui ; DOM non relu |
| Sélection collective overturn legacy | **Validé** (rejeu priorité ≪ inputPriority) |
| Pas de perte admissible par plafond | **Validé** contrat (réserve = catalogue) |
| Mémoire / rotation inter-horizons | **Partiel** — `analyticalMemory` présent ; jitter legacy encore dans l’ancien sélecteur |
| Pertinence temporelle différenciée | **Partiel** |
| Rédaction depuis thèse | **Partiel** — `draftFromClaim` branché ; héritage encore présent si pas d’exploration |
| Catégories cohérentes | **Partiel** |
| Inspecteur depuis cartes | **Validé** code ; DOM non testé |
| Exports exacts période | **Validé** code/tests ; DOM non testé |
| Concordance compteurs UI | **Non vérifié** |
| Jeux A/B/C distincts | **Partiel** — reconstitués, B sans aveugle humain |
| Comparaison avant/après mêmes données | **Partiel** — rejeu v3 vs compteurs legacy input |
| Non-régression P0–P5 | **Partiel** — suite ciblée verte ; suite entière non rejouée ici |

**GO P7 : NON.**
