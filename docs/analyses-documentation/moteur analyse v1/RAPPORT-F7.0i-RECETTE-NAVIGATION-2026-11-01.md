# RAPPORT F7.0i — Recette navigation, atomicité, multipériode

**Date :** 1er novembre 2026  
**Profil :** live lecture seule (`zingariello1314`)  
**Statut :** F7.0 **toujours ouvert** — causes 3→17 corrigées ; fluidité longues périodes **non OK**.

---

## 0. Pourquoi 3 cartes puis 17 (prouvé)

Chaîne démontrée :

1. Le Worker adaptatif **calculait** un pack riche (~17).
2. `postMessage` du résultat **échouait** : une fonction (`getExerciseNameById`) trainait dans le graphe → *could not be cloned*.
3. Le `catch` publiait alors un **fallback span** (~1–3 cartes) en `ready` et le **cachait** (`rememberBundle`).
4. Plus tard (Garmin / nouvelle full-key / nouvel essai Worker), un pack **17** remplaçait le cache mince → **3→17**.

Ce n’était **pas** une publication atomique provisoire volontaire F7.0c : c’était un **échec de transfert Worker** masqué par un fallback présenté comme définitif.

### Correctifs F7.0i (conservent F7.0h)

| Correctif | Fichier |
|---|---|
| Sérialisation JSON-safe avant `postMessage` Worker | `recapAdaptiveInsights.worker.js` |
| Plus de fallback span publié/caché comme ready | `useRecapTabMetrics.js` |
| Cache workout `ready` **seulement** si `fullKey` match | `resolveWorkoutCachePolicy` |
| Soft-show = `refreshing` + recalcul obligatoire | idem |
| Clé cache `span6-f70i` + version contrat (invalide IDB mince) | `buildRecapMetricsKey` |
| Trace `window.__f70iPub` (DEV) | `f70iTrace` |
| Tests politique cache | `useRecapTabMetrics.f70i-cache.test.js` |

Après correctif (30j) : `clear_publishable → publish_final:17` — **première carte = définitive (17)**, pas d’étape à 3.

---

## A. Chronologie — Parcours A (froid, attendre définitif)

Mesures DOM + `__f70iPub` + Long Tasks. Temps = clic → résultat stable.

| Période | Première carte | Définitif | LT max | Cartes init = final | Cache source |
|---|---:|---:|---:|---|---|
| 7 jours | 12,3 s | **14,7 s** | 1,9 s | **17 → 17** | worker |
| 30 jours | 2,7 s | **6,1 s** | 1,4 s | **17 → 17** | exact puis worker |
| 3 mois | 24,8 s | **41,1 s** | **13,9 s** | **20 → 20** | worker |
| 6 mois | 41,5 s | **42,5 s** | **13,7 s** | **21 → 21** | worker |
| 1 an | 31,7 s | **32,9 s** | **7,7 s** | **24 → 24** | worker |
| 2 ans | 35,3 s | **36,9 s** | **9,8 s** | **24 → 24** | worker |
| Toujours | 29,7 s | **30,6 s** | **6,2 s** | **17 → 17** | worker |

Aucun titre « ces 30 jours » sous une autre période (fuite inter-périodes absente sur ce passage).

### Parcours C — cache chaud

| Période | Définitif | LT max | Cartes |
|---|---:|---:|---|
| 7 jours | 3,6 s | 1,0 s | 17 |
| 30 jours | 5,8 s | 1,3 s | 17 |
| 3 mois | 19,0 s | **12,8 s** | 20 |
| 6 mois | 20,2 s | **15,1 s** | 21 |
| 1 an | 33,5 s | **28,9 s** | 24 |
| 2 ans | 67,2 s | **31,0 s** | 24 |
| Toujours | 33,4 s | **30,2 s** | 17 |

Les hits `publish_exact_cache` existent, mais le **thread principal reste saturé** (shell / clone / React / calendrier) — d’où des warm « lents » et LT 13–31 s.

### Parcours B — navigation rapide (sans attendre)

Changement de période ~1–2 s pour afficher le pack **en cache** correspondant à la bonne fenêtre (compteurs 17/20/21/24 cohérents avec le libellé). Pas de mélange de titres 30j sous 1 an observé.

---

## B. Cartes définitives vs console

| Période | Cartes DOM définitives | Console sélectionnées | Écart |
|---|---:|---:|---|
| 7 jours | 17 | — (non relancé ce tour) | — |
| 30 jours | **17** | **18** (hist. 124) | +1 console |
| 3 mois | 20 | — | — |
| 6 mois | 21 | — | — |
| 1 an | 24 | — | — |
| 2 ans | 24 | — | — |
| Toujours | 17 | — | — |

**Écart 30j 17 vs 18 :** la carte console en trop observée dans « Texte final » inclut notamment *« Ces 30 jours deviennent un nouveau point d'ancrage… »*. Le diagnostic recalcule assessment/enrichment et lit un historique légèrement différent (124 entrées) — **pipeline volontairement parallèle**, pas une perte DOM de 17→1. Écart **non nul** : à rapprocher (même assessment injecté) dans une passe suivante ; **pas déclaré « acceptable » sans suite**.

---

## C. Causes de ralentissement (prouvées)

| Cause | Preuve | Fichiers |
|---|---|---|
| Shell sync main thread (assessment / enrichment / program coach) | LT 7–31 s pendant transitions longues | `useRecapTabMetrics.js` `runFor` |
| Structured clone / payload Worker | Violations `message` handler (F7.0h) + sérialisation | worker client / worker |
| Calendrier / React pendant calcul | UI lourde au scroll (retour utilisateur + LT) | `RecapAnalyseView`, analytics |
| Ancien fallback span + cache mince | 3→17 | **corrigé F7.0i** |
| Fonction non clonable dans résultat Worker | `postMessage` fail | **corrigé** JSON-safe |

**Non corrigé dans F7.0i :** déplacer assessment/enrichment/programCoach hors UI ; slim payload supplémentaire ; yields calendrier.

---

## D. Publication atomique — verdict

| Garantie | État |
|---|---|
| Pas de cartes d’une autre période en `ready` | OK (F7.0h + fullKey) |
| Pas de fallback span en cache ready | OK (F7.0i) |
| Première carte = pack définitif (froid) | OK sur le parcours A mesuré |
| Soft `refreshing` si fullKey diverge | OK (politique) |
| Site fluide pendant calcul 1y/2y | **NON** |

---

## E. Couverture (nombres définitifs DOM)

Longues périodes **ne sont pas pauvres** une fois le Worker fiable : 20–24 cartes (3m–2y) avec trajectoires, GTG, sommeil, reprise d’exercices, volume/rythme. « Toujours » à 17 peut refléter caps/voix — à auditer en F7.0j sans toucher E0/F5 maintenant.

---

## F. Tests

- Vitest cache F7.0i + diagnostic model : **10/10**
- Scripts identité : today / 7d / 30d `equal=true` (worker) ; chaîne longue interrompue par timeout outillage (~31 s) — **à rejouer localement** `f7-worker-identity`, `f7-coop-identity`, `f6-perf-vs-identity`, `f6-nonregression`

---

## G. Verdict clôture F7.0

**Ne pas clôturer.**

Corrigé : divergence console hist., cache inter-périodes, **cause réelle du 3→17**, atomicité froide mesurée, clés cache invalidées sans wipe user data.

Reste bloquant : **LT 10–30 s** et navigation pénible pendant 3m→Toujours ; écart console 18 vs Analyse 17 non totalement aligné ; recette console 3m/1y incomplète ; scripts identité chaîne non terminée.

Pas de commit. F7.1–F7.5 non engagés.
