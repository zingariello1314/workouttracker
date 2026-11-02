# F7.0d — Fluidité réelle, calcul hors thread, console

**Date :** 1er novembre 2026  
**Profil :** `zingariello1314` — lecture seule  
**Aucun commit** — F7.1 non engagé  
**Arrêt avant intégration Worker navigateur (validation humaine).**

---

## Verdict

| Critère | Statut | Preuve |
|---|---|---|
| Accès navigateur | **OK** (session déverrouillée) | Live |
| Publication atomique F7.0c | **Confirmée live** (loading + dates cohérentes sur 7→30) | Navigateur |
| Changement période sans gel | **NON** — Long Tasks 3–17 s encore | Navigateur |
| Cache court froid/chaud | Chaud 7↔30 ~**240 ms** ; 2y→7j encore ~**17 s** | Navigateur |
| Mémo calendaire locale | **Appliquée** (identité OK) | Code + fixtures |
| Console découplée paint | **Partielle** (idle + yields avant rapport sync) | Code |
| Worker | **Prototype isolé seulement** — pas branché UI | Fixture script |
| Clôture F7.0 | **Non** — navigateur encore immobilisable | — |

---

## 1. Mesures navigateur initiales (profil réel, correctifs F7.0c présents)

Instrument : `PerformanceObserver` longtask + polls header/loading.

| Scénario | Temps → résultat | Long Task max | # LT | Notes |
|---|---:|---:|---:|---|
| Recap/Analyse déjà chaud 7j | — | — | — | 20 cartes, dates 26 oct→1 nov **OK** |
| 7j → 2y (1ʳᵉ fois session) | ~fin calcul + **LT 15 071 ms** | **15 071** | 5 | Header 2y **2024→2026** OK |
| 2y → 7j (après 2y) | **15 062 ms** | **14 673** | 2 | Header 7j OK — **pas un cache instantané** |
| 7j → 30j (soigné) | **15 904 ms** | **3 272** | **26** | Loading **true** à 100 ms ; dates 3 oct→1 nov **OK** |
| 30j → 7j (chaud) | **~244 ms** | **237** | 2 | Cache hit plausible |
| 2y mid-click→7j (2y déjà en cache) | **813 ms** | **797** | 2 | Pas un cold 2y |
| TODAY → 2y (après HMR/re-nav) | **59 076 ms** | **16 738** | 29 | Header 2y correct ; chunks 16.7 / 11 / 5.2 / 3.7 s |
| 2y → 7j (après ce 2y) | **17 718 ms** | **17 264** | 2 | Toujours bloquant |

### Lecture

1. **F7.0b yields** : visibles sur 7→30 (26 LT, max ~3.3 s) vs monolithe 15 s.  
2. **F7.0c atomique** : sur 7→30, période + dates correctes immédiatement, état loading avant cartes.  
3. **Problème B non résolu** : retours depuis 2y et cold 2y produisent encore des LT **> 10 s**.  
4. Cache court **chaud** est fluide (~200 ms).  
5. Une fausse impression « 2y prêt en 1 s » a été observée avec **libellé 2y + dates 30j** (contamination affichage / cache) — à traiter comme risque fraîcheur UI.

Légende : chiffres ci-dessus = **prouvé navigateur profil réel**.

---

## 2. Diagnostic Long Tasks résiduelles

Causes cumulées (code + profilage F7.0 + live) :

| Source | Rôle |
|---|---|
| Producteurs p36 / p35 / p32b / adhérence | Chunks sync multi-secondes |
| `calendarLoad` × fenêtres comparisons | Énumération jours + stats |
| `buildRecapPeriodCalendarAnalytics` phase `full` | Mois × 2y après insights |
| Thread principal unique | Abort n’arrête pas le chunk en cours |

---

## 3. Calculs redondants & optimisation locale

### Appliqué

`calendarLoad` / `measureRecapWindow` / `buildPeriodComparisons(+Async)` :

- `getCalendarSportStatsCache` partagé dans une passe comparisons.  
- `Map` mémo `start|end` → agrégat calendaire (hits quand fenêtres identiques, ex. période = d7).

Identité : `f7-coop-identity` **allEqual true** ; `anySilentRegression: false`.

### Non appliqué (risque / gain)

- Découpage interne p36/p35 (demande validation).  
- Mémo inter-requêtes persistante des producteurs.

---

## 4. Console (E)

### Diagnostic (code)

`AnalysisEngineConsole` auto-`run()` → `buildAnalysisEngineDiagnosticReport` **sync** complet (`collectDiagnostic: true`), sans réutiliser le bundle Recap.

### Correction locale appliquée

- Yields frame + macrotask **avant** le rapport (premier paint possible).  
- Auto-run différé via `requestIdleCallback` (timeout 700 ms).  
- Le **cœur sync du rapport** peut encore geler après le paint — Worker / découpage diagnostics **non intégrés**.

### Remesure console live

**Non aboutie** dans cette passe (overlay sidebar / HMR / focus). À rejouer humainement : ouvrir « console diagnostic moteur d’analyse ».

---

## 5. Prototype Worker (Phase 3 — isolé)

`scripts/f7-worker-prototype.mjs` → `fixtures/f7-worker-prototype.json` :

- Taille JSON snapshot fixture + round-trip parse.  
- Identité sync après round-trip JSON.  
- Design messages in/out, cancel par `requestId`, sync path conservé.  
- **Aucun Worker Vite branché à l’UI.**

### Comparaison stratégies (état)

| Critère | Coop interne | Worker | Hybride |
|---|---|---|---|
| Réactivité UI | Partielle (yields) ; LT max encore 10–17 s live | Non mesuré navigateur | — |
| Identité | Sync path OK | À prouver sur même API | — |
| Complexité | Faible–moyenne | Élevée (Vite, clone, comptes) | Élevée |
| Recommandation | Continuer mémo + découpe producteurs | **Prototype navigateur après accord** | Probable cible |

**Critère décisif brief :** absence de gel. Tant que LT > plusieurs secondes, F7.0 non clos — **Worker justifié** si découpe interne ne passe pas sous ~50–100 ms de blocs.

---

## 6. Publication atomique & cache

| Check | Live |
|---|---|
| Pas de pistes legacy visibles (7→30 loading) | OK (loading détecté) |
| Dates = période (7, 30, 2y cold) | OK sur mesures soignées |
| Libellé 2y + dates 30j (cas rapide) | **Anomalie observée** — à surveiller |
| Cache 7↔30 chaud | ~240 ms |
| 2y→7j | Encore ~15–18 s |

---

## 7. Tests

```
recapInsightsPublication.f70c   OK
recapF6PerfFreshness            OK
recapInterpretationPipeline     OK
f7-coop-identity                allEqual true
f6-perf-vs-identity             anySilentRegression false
f7-worker-prototype             identityAfterRoundtrip true
```

---

## 8. Limites / risques

1. Long Tasks 10–17 s sur 2y / retour 7j.  
2. Rapport console encore sync.  
3. Analytics calendaire UI phase full potentiellement lourde.  
4. HMR / overlay ont interrompu certaines remesures.  
5. Texte loading i18n : regex FR peut manquer en EN.

---

## 9. Demande de validation

Avant intégration :

1. **Worker navigateur** branché sur `buildPeriodDiscoveryBundleAsync` (même API métier, requestId, cancel) — oui/non ?  
2. Découpe interne **p36** (occasions / jours) en complément — oui/non ?  
3. Console : diagnostics **strictement à la demande** (plus d’auto-run) — oui/non ?

**Si le calcul 2 ans reste long mais le site reste utilisable (pas de LT multi-secondes), F7.0 pourra clôturer.**  
**État actuel : calcul parfois long ET gel encore présent → non clôturable.**
