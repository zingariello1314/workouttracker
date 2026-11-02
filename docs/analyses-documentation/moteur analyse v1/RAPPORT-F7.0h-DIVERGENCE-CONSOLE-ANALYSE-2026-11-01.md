# RAPPORT F7.0h — Divergence console / Analyse + fluidité

**Date :** 1er novembre 2026  
**Statut :** P0 divergence **expliquée et corrigée à la source** ; fluidité / couverture **en cours** — F7.0 **non clôturé**.

---

## 0. Verdict P0 (divergence)

| Source | 30 jours (profil live, lecture seule) |
|---|---|
| Onglet Analyse (DOM filtres) | **17** cartes (`All 17`) |
| Console avant correctif | **23** « Affichées » (hist. Worker = vide) |
| Console après correctif | **18** « Sélectionnées » (`hist. 117`) |

**Cause principale (Cas A + vocabulaire Cas C) :**

1. Le Worker diagnostic **n’injectait pas** `insightHistory` / `lastInsightSignature`.
2. Dans le Worker, `loadInsightHistory()` voit `window === undefined` → historique **vide**.
3. Analyse injecte l’historique depuis le thread UI → nouveauté / mémoire **active** → pack plus sélectif.
4. Le libellé **« Affichée (run actuel) »** mesurait le **pack sélectionné du run diagnostic**, **pas** le DOM Analyse.

Δ résiduel **17 vs 18** : acceptable pour l’instant (assessment/enrichment recalculés côté console, Garmin éventuellement plus large, signature légèrement différente). Pas de preuve d’une perte de publication 20→1 sur le chemin DOM actuel.

**Observation utilisateur « 1 carte » / cartes incohérentes :** cause structurelle trouvée — **cache workout cross-période** (`bundlesByWorkout`) republicait le bundle d’une autre période comme `ready` (ex. 17 cartes 30j sous libellé 2 ans). Corrige dans `useRecapTabMetrics` (F7.0h).

---

## 1. Chemins comparés

### Analyse
`Snapshot → shell assessment/enrichment (main) → Worker adaptive (insightHistory injecté) → publication atomique → RecapAnalyseView (short/medium/long) → filtres famille → DOM`

### Console (avant)
`Snapshot → Worker diagnostic → buildAdaptiveRecapInsights(collectDiagnostic, **hist vide**) → registry shown_now → KPI « Affichées »`

### Console (après F7.0h)
Même pipeline + **`insightHistory` / `lastInsightSignature` injectés** depuis `localStorage` (thread UI) ; KPI renommé **Sélectionnées**.

---

## 2. Signification des statuts (après correctif)

| Statut | Signifie | Ne signifie pas |
|---|---|---|
| Sélectionnée (pack diagnostic) | Dans `allPicked` / `candidates.shown` de ce run | Rendu dans l’onglet Analyse |
| Intermédiaire | Produite / discovery_selected hors pack final | |
| Déclassée | ranked_out / dédup / drop E0 | |
| Rejetée | validation / données insuffisantes | |

---

## 3. Correctifs livrés (sans commit)

| Fichier | Changement |
|---|---|
| `recapDiagnosticWorkerClient.js` | Injecte `loadInsightHistory` + signature |
| `recapDiagnostic.worker.js` | Transmet l’historique au rapport |
| `analysisEngineDiagnostic.js` | Accepte hist. ; `persistHistory: false` ; meta `insightHistoryEntryCount` |
| `analysisEngineDiagnosticModel.js` | Libellé / meaning non trompeurs |
| `AnalysisEngineConsole.jsx` | KPI « Sélectionnées » + note + yield avant `setReport` |
| `recapAdaptiveInsights.js` `toInsightCard` | Fallback title/body ; plus d’objet brut → DOM |
| `useRecapTabMetrics.js` | Cache workout **uniquement** si `analysisPeriod` = période demandée |

Tests : `analysisEngineDiagnostic*.test.js` **8/8**.

---

## 3bis. Second bug P0 — cache workout cross-période

**Avant :** miss exact → hit workout (même empreinte données) → `setBundle({...stale, analysisPeriod: newPeriod, ready})` → **return sans recalcul**.

**Effet :** Analyse affiche le pack d’une autre fenêtre ; la console (recalcul propre) montre d’autres cartes → divergence perçue « 1 vs 20 ».

**Après :** hit workout accepté seulement si `stale.analysisPeriod === deferredPeriod`.

---

## 4. Fluidité (constat, pas clôturé)

- Violations Chrome : `'message' handler took 165–508 ms` (handlers Worker / clone / setState).
- Mesure enchaînement périodes (avant correctif cache) : **LT max ~13,5 s**, compteur figé `All 17` + **mêmes titres 30j** sous en-tête 1 an / 2 ans.
- Après correctif cache (reload) : la session live a perdu l’auth dans l’onglet automatisé — **re-validation manuelle requise** une fois reconnecté.
- Diagnostic 30j ~**4 s** ; UI reste lourde sur périodes longues.
- Verdict F7.0g « fluidité quotidienne acceptable » **non validé**.

Prochain : re-mesurer clic→interactive sur profil reconnecté ; alléger postMessage / shell sync (`computeRecapUserAssessment`, calendrier).

---

## 5. Couverture analytique

Reporté après stabilisation des compteurs. Sur 30j live : **17** cartes Analyse avec trajectoires (GTG, reprises, pompes, sommeil, etc.) — le moteur **produit** déjà de la profondeur ; la console surestimait avant F7.0h.

---

## 6. Non-objectifs respectés

- Pas de modification E0/F5 pour « remplir » des cartes.
- Pas de commit Git.
- F7.1–F7.5 non engagés.
- Pas d’effacement de caches profil.
