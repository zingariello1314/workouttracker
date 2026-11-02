# F7.0 — Performance navigateur : blocage après période longue

**Date :** 1er novembre 2026  
**Périmètre :** F7.0 uniquement — **aucun commit** — F7.1+ non engagés  
**Données :** profil live en lecture seule (aucune mutation sportive)

---

## 1. Verdict F7.0

| Point | Statut |
|---|---|
| Cause du blocage 2y → 7j | **Démontrée** puis **affinée** (voir validation résiduelle) |
| Correction ciblée | **Appliquée** (coop pipeline + yields internes F7.0b) |
| Identité analytique | **Préservée** (`anySilentRegression: false`, sync≡async) |
| Coût absolu du calcul 2 ans | **Toujours élevé** — dominant = p36 / calendrier / p35 / p32b / adhérence, **pas** `detectDiscoveries` seul |
| Remesure navigateur après correctifs | **Bloquée** (Unlock the app) — F7.0 **non clôturé succès** |

Voir [`RAPPORT-F7.0-VALIDATION-RESIDUELLE-2026-11-01.md`](./RAPPORT-F7.0-VALIDATION-RESIDUELLE-2026-11-01.md).

**Arrêt pour validation humaine avant F7.1.**

---

## 2. Reproduction et mesures (avant correctif)

Env. : Vite `localhost:3001`, profil `zingariello1314`, `PerformanceObserver` longtask.

### 2.1. Passage vers 2 ans

| Indicateur | Valeur |
|---|---:|
| Temps jusqu’à apparition header 2y | ~27 s |
| Long Task max | **24 390 ms** puis **25 843 ms** |
| Somme Long Tasks (chevauchements inclus) | ~55 s |

### 2.2. 2 ans → 7 jours

| Indicateur | Valeur |
|---|---:|
| `pressedMs` / `headerMatchMs` | ~**29 583 ms** |
| Long Task après clic | **28 852 ms** |
| Header observé | `7 days · samedi 2 novembre 2024 → dimanche 1 novembre 2026` |

Ce header est **incohérent** : libellé « 7 days » + fenêtre d’une fenêtre **2 ans**.

### 2.3. Remontage Recap (F6)

~0,6–1,2 s — cache hit plausible (hors scénario 2y→7j).

---

## 3. Cause démontrée

### 3.1. Graphe après clic période

```
clic bouton période
  → setPeriod (avant F7.0 : startTransition)
  → useDeferredValue(period)          ← décalage libellé vs fenêtre
  → useRecapTabMetrics effect
       ├─ cache exact ? → publish + return
       ├─ sinon scheduleHeavyWork(setTimeout 0)
       └─ runFor (async)
            ├─ yieldFrame
            ├─ muscleState / endurance  → publish shell
            ├─ setComputing(false)     ← TROP TÔT (avant F7.0)
            ├─ assessment / enrichment (+ yields)
            └─ buildAdaptiveRecapInsights  ← SYNC 15–28 s
                 └─ buildPeriodDiscoveryBundle (dominant)
  genRef++ au cleanup empêche la PUBLICATION stale
  mais N’ARRÊTE PAS le travail sync déjà entamé
```

### 3.2. Réponses aux questions obligatoires

| Question | Réponse |
|---|---|
| Le calcul 2 ans continue-t-il après changement de période ? | **Oui**, jusqu’à la fin du chunk sync en cours. `genRef` jette le résultat, pas le CPU. |
| `genRef` empêche-t-il seulement la publication ? | **Oui.** |
| Thread principal bloqué ? | **Oui** — Long Tasks 20–28 s (`self`). |
| Les clics sont-ils traités pendant le calcul ? | **Non** tant que le Long Task court. |
| Cache 7j consulté ? | Seulement **après** libération du thread ; souvent **après** un gros travail encore 2y. |
| Cache hit avant préparation coûteuse ? | Non dans le scénario mesuré (effet + deferred retardés / mismatch). |
| Recalcul global malgré période connue ? | Possible si clé full miss ; le mismatch deferred faisait croire à un 7j alors que la fenêtre restait 2y. |
| React déclenche un nouveau calcul ? | Oui via deps `deferredPeriod` / `inputKey`. |
| Garmin / enrichissements ? | Contributifs en amont ; le Long Task dominant reste le pipeline composé / discoveries. |
| Calendrier longues plages ? | Facteur de coût (énumérations) — pas la seule cause du blocage interaction. |
| Délai = vrai blocage ou détection ? | **Vrai blocage** (Long Tasks) **et** détection faussée (header 7j + dates 2y). |

### 3.3. Synthèse causale

Trois défauts se cumulent :

1. **Calcul synchrone non coopératif** de `buildAdaptiveRecapInsights` / `buildPeriodDiscoveryBundle` sur le thread UI.  
2. **`setComputing(false)` prématuré** après le shell → l’UI paraît prête pendant 20–30 s de blocage.  
3. **Double différé** (`startTransition` + `useDeferredValue`) → libellé période et fenêtre/cache **désalignés** (preuve header).

---

## 4. Corrections appliquées (ciblées)

| Fichier | Changement |
|---|---|
| `src/utils/sport/recapComputeCoop.js` | **Nouveau** — `coopGate`, abort, `browserYieldFrame` |
| `src/utils/sport/recapInterpretationPipeline.js` | Mode `coop` async : yields entre trainingState / discoveries / essays ; `shouldAbort` |
| `src/hooks/useRecapTabMetrics.js` | Pipeline coop avant adaptive ; `precomputedComposed` ; **ne plus** `setComputing(false)` avant la fin adaptive ; catch abort |
| `src/utils/sport/recapAdaptiveInsights.js` | Option `precomputedComposed` (pas de double calcul) |
| `src/utils/sport/recapPeriodDiscoveries.js` | `shouldAbort` en entrée de bundle |
| `src/components/tabs/RecapTab.jsx` | Période **immédiate** (plus de `useDeferredValue` / `startTransition` sur le changement) |

### Non fait (volontairement)

- Worker dédié.
- Refonte trajectoires / découpage interne de `detectDiscoveries` (~2200 lignes sync).
- Réduction artificielle des fenêtres W/C/H.
- Modification F3/F4/F5/F5.1 métier.

---

## 5. Effet attendu vs limites

### Attendu après correctif

- Libellé période **aligné** sur la fenêtre réellement calculée.  
- Cache 7j : hit possible **dès que** le thread est libre et que 7j a déjà été calculé.  
- Abort **entre** étapes majeures du pipeline (plus de publication stale).  
- UI ne se déclare plus « idle » pendant le gros calcul.  
- Long Task unique de discoveries **peut rester ~15–25 s** sur 2y (chunk non découpé à l’intérieur).

### Limite ouverte

Le cœur `buildPeriodDiscoveryBundle` / `detectDiscoveries` reste un bloc sync.  
Un clic **au milieu** de ce bloc attend toujours la fin du chunk.  
Dette : time-slicing interne des trajectoires (validation humaine avant refonte).

---

## 6. Non-régression

```text
recapF6PerfFreshness.test.js          OK
recapInterpretationPipeline.test.js   OK
scripts/f6-perf-vs-identity.mjs       anySilentRegression: false
scripts/f6-nonregression.mjs          allEqual: true
```

Aucune exclusion de champs sémantiques.

---

## 7. Remesure après correctif

Tentative navigateur après HMR/reload : écran **« Unlock the app »** (bouton disabled) — **session verrouillée**, pas de revalidation interactive complète sans action humaine.

**À valider manuellement :**

1. Déverrouiller l’app.  
2. Recap → chauffer **7 DAYS** (attendre fin réelle).  
3. **2 YEARS** → attendre fin (computing reste true).  
4. Cliquer **7 DAYS** → mesurer temps jusqu’au header `7 days` avec bornes ~1 semaine (pas 2024).  
5. Pendant un 2y en cours : tenter un clic 7d — noter si le clic est pris en compte après le chunk discoveries ou plus tôt.

---

## 8. Décision

F7.0 : **diagnostic solide + correctifs de cause racine partiels livrés**.

- Le blocage n’est **pas** un artefact de mesure seul.  
- Les correctifs adressent mismatch cache/période, fausse fin de calcul, et abort coopératif.  
- Le coût CPU 2y reste une **dette** explicitement ouverte.

**Ne pas lancer F7.1–F7.5 sans validation humaine de la remesure 2y→7j.**

**Aucun commit Git.**
