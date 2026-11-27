# P0 — Signature 2,5 s / chunk-WW4AH6NN / useSportXP

Source : `diagnostics/momentum-today-performance-flight-recorder-v2-2026-11-27-02-10-16.json` (segment 3).

## Verdict

La réactivité d’Aujourd’hui est saturée par le **thread principal React**, pas par le traitement métier des coches (~1–3 ms). Le quantum dominant est **~2,5 s**, aligné sur **deux exécutions successives de `calculateSportXP`** (~1,2 s × 2) déclenchées via le scheduler React (`deps/chunk-WW4AH6NN.js`).

## P0-A — Identité de `chunk-WW4AH6NN.js`

| Élément | Valeur |
| --- | --- |
| Cache Vite | `node_modules/.vite/deps/chunk-WW4AH6NN.js` |
| Source map | `scheduler.development.js` + `react-dom.development.js` |
| Invoker LoAF dominant | `event-listener` (= `MessageChannel` du scheduler React) |
| Cumul scripts LoAF (seg. 3) | ~68 164 ms (~94 % des scripts LoAF) |
| Max | ~18 197 ms (démarrage / backlog) |

Ce n’est **pas** un fichier applicatif. Le self-time du chunk **inclut** le travail applicatif exécuté pendant le flush React. Attribution applicative réelle : hooks / calculs montés sous ce flush, en particulier `hooks/useSportXP.js` → `calculateSportXP`.

`chunk-57EGHOTI.js` = `@react-three/fiber` + reconciler (apparition ponctuelle).

## P0-B — Bande des tâches ~2,5 s (lt-30…lt-48)

- 18 tâches > 2 s entre ~121,8 s et ~167,2 s.
- Gaps entre fin d’une tâche et début de la suivante : souvent **9–56 ms**.
- Occupation ≈ **99 %** de la fenêtre murale.
- Médiane ≈ **2 498,5 ms**.
- LoAF de bande : quasi exclusivement `chunk-WW4AH6NN.js` (event-listener), commits TodayTab **0–3 ms**.
- Traitement métier coche : médiane **~1,9 ms**.
- Latences natives click rapprochées : 616, 1264, 1712, 576, 1040, 2000, 1304 ms.

Ce n’est **pas** une boucle infinie pure : c’est une **occupation continue** du scheduler par des paquets de travail de taille stable (~2,5 s), entrecoupés de fenêtres trop étroites pour absorber l’input.

Cause primaire établie pour le quantum 2,5 s :

1. **Plusieurs instances montées de `useSportXP`** (au minimum `SportXPBar` + `GradeArtCardOffer` via `useSportGrade` ; potentiellement `useGlobalXP` / récap chaud).
2. Chaque instance planifiait son propre `calculateSportXP` (double-rAF) pour la **même signature**.
3. Preuve LoAF à t≈104843 (retour visible) : **deux** callbacks `useSportXP` **1340 ms + 1198 ms** dans la même frame ≈ **2 548 ms**.

La bande continue pendant les coches reste attribuée au scheduler (WW4) : le métier de coche n’explique pas la durée ; le thread est déjà saturé par ces paquets React/XP (et effets associés). Les recherches historiques / copies de brouillon restent hors cause principale sur ce dataset.

## P0-D — `useSportXP`

- Consommateurs : `useSportGrade` → `SportXPBar`, `GradeArtCardOffer`, `RecapGradesView`, … ; `useGlobalXP` → barres globales.
- Coût : `calculateSportXP` sur ~813 clés reps / 819 coches + Garmin + nutrition.
- Invalidation cache : surtout persistance **forcée** (`invalidateSportXpCache`), pas la coche brouillon.
- Correction engagée : **single-flight partagé** (`acquireSharedSportXp`) — une seule exécution par `(signature, storageKey)`, abonnés multiples.
- Isolation diag : `momentum:diag:suspendSportXpRecalc`, `suspendGradeArtOfferXp`, `suspendWarmRecap`.

L’XP reste exacte : un seul résultat écrit dans le cache module / snapshot session ; pas de double génération de points.

## P0-F — Démarrage

Segment 3 :

- Préchauffage ~5,2 s
- Montage Aujourd’hui ~47,2 s
- Page **hidden** ~27,1 s → **visible** ~104,8 s
- L’écart préchauffage→montage **n’est pas** une durée CPU utilisateur continue (visibilité).

Blocages 15–18 s (lt-17) : flush initial React/DOM + chargements, attribués WW4.

## P0-E — Flight Recorder 2.1.0

- Classification : `bandMetric = max(nativeClick, windowMs, inputDelay)` — **plus jamais** `legacyTotalMs`.
- Tâches longues : intersection avec `[inputAt, windowEnd]` (même si démarrées avant).
- Association click natif par proximité de timestamp.
- `reliable` / `p95Reliable` documentés (5 vs 30 échantillons).
- Segments : `previousSegmentEvents` exclut le segment courant ; horloges `navigationTimeOrigin` + origines segment.
- `applicationVersion` : mode Vite + `VITE_BUILD_ID` / `VITE_APP_VERSION` si fourni.
- Attribution compilée documentée dans l’export.

## P0-C — Profiling CPU

Protocole unique :

```powershell
.\scripts\today\launch-cdp-flight.ps1
```

Profil Chrome **isolé**, CDP **127.0.0.1** uniquement. Dossier export : Flight Recorder + `cpu-profile.json` + trace filtrée.

## Correctifs déjà dans le code

1. Single-flight XP (`src/hooks/useSportXP.js`)
2. `useSportGrade({ enabled })` + isolation `GradeArtCardOffer`
3. Flag `suspendWarmRecap` dans `App.jsx`
4. Flight Recorder 2.1.0 (`flightAnalysis.js`, `todayDiag.js`, console)
5. Collecteur CDP (`scripts/today/cdp-flight-collector.mjs`)

## Protocole de re-mesure (une capture)

1. Recharger l’app (dev) avec Diag activé.
2. Sport → Aujourd’hui, attendre le calme post-démarrage.
3. Enchaîner ≥ 30 coches/décoches + un enregistrement de séance.
4. Exporter le Flight Recorder V2 (un fichier).
5. Vérifier : plus de bande continue ~2,5 s ; `useSportXP` LoAF ≤ 1 callback coûteux par signature ; bandes natives < 100 ms P95 si `p95Reliable`.
6. Option isolation : un seul flag `localStorage` à la fois, recharger, comparer.

## Limites

- Sans CDP, les frames WW4 sans script applicatif séparé ne détaillent pas les frames React internes.
- 7 interactions : P95 non fiable (`p95Reliable: false`).
- Objectifs < 50 ms / < 100 ms P95 : cibles, pas encore re-mesurés après correctif.
