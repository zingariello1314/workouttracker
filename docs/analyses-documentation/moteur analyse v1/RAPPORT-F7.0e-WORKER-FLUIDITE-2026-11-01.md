# F7.0e — Web Worker contrôlé & suppression des gels analytiques

**Date :** 1er novembre 2026  
**Profil live :** `zingariello1314` (lecture seule)  
**Aucun commit** — F7.1 non engagé  
**Arrêt pour validation humaine.**

---

## Verdict de clôture F7.0

| Critère | Statut | Preuve |
|---|---|---|
| Analyse s’ouvre / structure | **OK** | Navigateur |
| Périodes sans gel multi-secondes (pipeline lourd) | **OK** (LT max ~1–2 s résiduelles shell) | Navigateur |
| 2y → 7j pendant calcul | **OK** (~2,7 s prêt ; LT max 843 ms) | Navigateur vs **17 s** F7.0d |
| Cache court | Amélioré ; pas encore systématiquement &lt; 200 ms | Navigateur |
| Publication atomique | **OK** | Live + tests |
| Libellé / dates cohérents | **Corrigé** (2y → 2024→2026) | Navigateur |
| Console sans auto-run | **OK** (LT max 90 ms à l’ouverture) | Navigateur |
| Identité analytique sync ↔ Worker path | **allEqual true** (8 périodes) | Fixture Node |
| Clôture F7.0 absolue (&lt;100 ms clic, zéro LT &gt;50 ms) | **Partielle** | Shell UI encore sync |

**Verdict proposé :** F7.0e **atteint l’objectif principal** (plus d’immobilisation 15–17 s du pipeline adaptatif). Des Long Tasks résiduelles **&lt; 2 s** restent sur assessment / enrichment / header calendaire côté UI — hors Worker. Clôture totale F7.0 possible après validation humaine ; résiduels documentés pour une passe éventuelle hors F7.1 métier.

---

## 1. Architecture Worker retenue

| Élément | Choix |
|---|---|
| Création | `new Worker(new URL('../../workers/recapAdaptiveInsights.worker.js', import.meta.url), { type: 'module' })` |
| Entrée Worker | `src/workers/recapAdaptiveInsights.worker.js` |
| Cœur métier | `computeAdaptiveInsightsPayload` → `buildComposedInterpretationPipeline` (coop) + `buildAdaptiveRecapInsights` |
| Client | `src/utils/sport/recapAdaptiveInsightsWorkerClient.js` |
| Contrat | `RECAP_ADAPTIVE_WORKER_CONTRACT = f70e-adaptive-v1` |
| Chemin sync | **Conservé** (tests, fixtures, diagnostics) |

### Déplacé hors thread UI

- Pipeline composé (discoveries P3.x, essays, training state, …)
- Sélection adaptative / insights finaux

### Conservé sur le thread UI

- `computeRecapUserAssessment`, `buildRecapEnrichmentBundle`, shell publication
- `buildRecapProgramCoachAnalysis` (après résultat Worker)
- Cache mémoire / IDB, `insightsPublication`
- Calendrier header (phase `header`) ; phase `full` différée après loading
- Persistance `insightHistory` / signature (après `historyUpdate` Worker)

---

## 2. Contrat de messages

**Requête :** `requestId`, `accountScope`, `period`, `windowStart`, `windowEnd`, `dataRevision`, `contractVersion`, `snapshot`, `nameMap`, `enrichment`, `assessment`, `recapState`, Garmin, `insightHistory`, `lastInsightSignature`, programmes…

**Réponse :** mêmes clés d’identité + `status` (`ok` / `cancelled` / `error`) + `result` adaptatif complet (pas un fingerprint seul).

**Gate publication :** `matchesWorkerPublicationGate` — toutes les clés doivent matcher ; sinon rejet.

---

## 3. Annulation & priorité

1. Soft cancel (`CANCEL` + `shouldAbort` entre étapes coop).
2. **Terminate + recreate** à chaque nouvelle demande / bump de génération — une requête 2 ans obsolète **ne retient plus** le CPU pour un 7 jours.
3. Un seul Worker à la fois.
4. Pas de fallback sync lourd UI en cas d’échec Worker (erreur contrôlée / span léger).

---

## 4. Identité

`scripts/f7-worker-identity.mjs` — fingerprint étendu (cartes, discoveries, scores, fenêtres, phénomènes…).

| Période | equal |
|---|---|
| today, 7d, 30d, 3m, 6m, 1y, 2y, all | **true** |

Aussi : `f7-coop-identity` allEqual ; `f6-perf-vs-identity` / non-régression OK ; vitest publication + cohérence fenêtre OK.

---

## 5. Anomalie libellé / dates

**Cause (code) :** `periodAnalytics` stale + `resolvedWindow = periodWindow ?? enrichment?.window` + panel préférant `analytics.window`.

**Correctifs :**

- `resolvedWindow = periodWindow` uniquement
- Invalidation immédiate analytics ; affichage seulement si fenêtre analytics === période
- `clearPublishableInsights` purge aussi `enrichment` et porte `windowStart/End`
- Test navigation rapide `recapPeriodWindowCoherence.f70e.test.js`

**Live :** header `2 years · samedi 2 novembre 2024 → dimanche 1 novembre 2026`.

---

## 6. Console (E)

- Auto-run **supprimé**
- Ouverture → structure + message « lancez un diagnostic explicite »
- Bouton « Lancer le diagnostic » / « Relancer »
- Live : ouverture ~400 ms, **LT max 90 ms**, aucun rapport sync automatique

Diagnostic lourd reste sync **sur clic explicite** (Worker diagnostic non branché — priorité interactions Recap).

---

## 7. Mesures navigateur (profil réel)

Référence F7.0d : LT max **15–17 s** ; 2y→7j **~17 s**.

| Scénario | Avant (F7.0d) | Après (F7.0e) | LT max | Verdict |
|---|---:|---:|---:|---|
| 7j → 30j | ~15,9 s / LT 3,3 s | calcul Worker ; LT max **1 105** ms (5 LT) | **1 105** | Gain fort |
| 30j → 7j | ~15 s froid / ~240 ms chaud | ~1–7 s selon cache ; LT max **≤900** | ≤900 | Amélioré |
| Warm 7j | ~240 ms | ~**1 030** ms / LT 637 | 637 | Cache pas encore &lt;200 ms systématique |
| 2y → 7j pendant calcul | **~17 s** gel | prêt **~2,7 s** ; pressed ~1,4 s ; LT max **843** | **843** | **Objectif atteint** |
| 2y affiché (cache IDB plausible) | 15–59 s | ~2,6 s / 24 cartes / dates 2024→2026 | 1 404 | OK |
| Ouvrir console | gel sync rapport | structure immédiate / LT **90** | **90** | OK |

**Important :** les durées Worker ne sont **pas** des Long Tasks du thread principal.

Interactions réelles pendant 2y→7j : clic pris en compte, période 7j pressée, cartes 7j publiées sans attendre la fin du 2y.

---

## 8. Risques & limites

1. Shell UI (assessment / enrichment / calendar header) peut encore produire des LT **0,6–1,9 s**.
2. Coût structured-clone du snapshot (double RAM ponctuelle).
3. Terminate fréquent = perte de mémo Worker interne (acceptable).
4. Console diagnostic complet encore sync au clic « Lancer ».
5. Cache exact &lt;200 ms non garanti à chaque navigation rapide (empreinte Garmin / gen bump).

---

## 9. Fichiers clés

- `src/workers/recapAdaptiveInsights.worker.js`
- `src/utils/sport/recapAdaptiveWorkerContract.js`
- `src/utils/sport/recapAdaptiveWorkerCompute.js`
- `src/utils/sport/recapAdaptiveInsightsWorkerClient.js`
- `src/hooks/useRecapTabMetrics.js`
- `src/utils/sport/recapAdaptiveInsights.js` (`persistHistory` / `insightHistory`)
- `src/components/sport/recap/views/RecapAnalyseView.jsx`
- `src/components/sport/recap/RecapPeriodHighlightsPanel.jsx`
- `src/components/dev/AnalysisEngineConsole.jsx`
- `scripts/f7-worker-identity.mjs`

---

## 10. Demande de validation

Confirmer :

1. Clôture F7.0e / F7.0 sur la base « plus de gel 10–17 s » malgré LT résiduelles shell &lt; 2 s ?
2. Suite éventuelle : Worker aussi pour assessment/enrichment / diagnostic console — **sans** ouvrir F7.1 métier ?
3. Commit Git — seulement sur demande explicite.

**Aucun commit effectué. F7.1 non engagé.**
