# F7.0 — Validation résiduelle : coût long vs blocage interactif

**Date :** 1er novembre 2026  
**Périmètre :** F7.0 uniquement — **aucun commit** — F7.1 non engagé  
**Données live :** aucune mutation sportive

---

## Verdict de clôture F7.0

| Critère | Statut |
|---|---|
| Problème A (coût calcul long) | **Mesuré** — reste élevé sur 2 ans ; non « résolu » (hors brief) |
| Problème B (blocage interactions) | **Partiellement adressé** — yields entre frontières sûres ; **non validé navigateur** |
| Cause du bloc sync dominant | **Révisée** — ce n’est **pas** `detectDiscoveries` seul |
| Identité analytique fixtures | **OK** (`sync ≡ async`, `anySilentRegression: false`) |
| Remesure navigateur après correctifs | **Bloquée** — écran « Unlock the app » |

**F7.0 n’est pas annoncé comme réussi.**  
Le blocage interactif résiduel (chunks sync individuels encore longs, surtout `p36` / calendrier) n’est pas clôturable sans remesure humaine sur profil réel.

**Arrêt pour validation humaine.**

---

## 1. Remesure navigateur

Session `localhost:3001` : overlay **Loading Momentum** à 100 %, bouton **Unlock the app**.

Conformément au brief : **aucun contournement du verrouillage**.  
Scénarios 7j → 2y → 7j / annulation mid-flight / Toujours → 30j : **non rejoués** sur profil live.

Les mesures « après » ci-dessous sont donc **isolées (Node / fixtures / synthétique)**, pas des Long Tasks PerformanceObserver navigateur.

---

## 2. Distinction A / B

| | Problème A — coût long | Problème B — blocage UI |
|---|---|---|
| Nature | Analyse 2 ans coûteuse | Thread principal monopolisé → clic 7j non traité |
| Priorité brief | Documenter, ne pas appauvrir | **Prioritaire** |
| Avant F7.0 | Long Tasks 15–28 s (live) | Clic 2y→7j ~29 s + header désaligné |
| Correctifs F7.0 initiaux | — | période immédiate, `computing` honnête, abort **entre** étapes pipeline |
| Correctif F7.0b (cette passe) | — | yields **dans** le bundle (comparaisons + producteurs) |
| Reste ouvert | p36 / calendrier / p35 / p32b / adhérence lourds | Chunk sync max encore = producteur le plus lent (souvent `p36`) |

---

## 3. Bloc synchrone dominant — mesures internes

Source : `scripts/f7-profile-discoveries.mjs` → `fixtures/f7-profile-discoveries.json`.

### 3.1. Synthèse (synthétique dense 2 ans — **pas un profil réel**)

Total bundle ≈ **109 s**. Top exclusive :

| Étape | Inclusive ms | Exclusive ms | Appels | Volume |
|---|---:|---:|---:|---|
| `p36` | 34 973 | 34 973 | 1 | fenêtre 730 j, ~7300 clés reps |
| `computeCalendarMonthSportStats` (via `calendarLoad`) | 19 499 | 19 499 | 7 | énumération calendaire × 7 fenêtres |
| `p35` | 19 139 | 19 139 | 1 | idem fenêtre |
| `p32b` | 17 888 | 17 888 | 1 | idem |
| `programAdherence` | 15 210 | 15 210 | 1 | trajectoires adhérence |
| `detectDiscoveries` | 1 734 | 1 503 | 1 | — |
| `buildExerciseTrajectory` (dans detect) | 231 | 231 | 9 | — |

**Conclusion :** attribuer les 15–25 s live à `detectDiscoveries` seul était **incorrect**.  
Le Long Task unique observé en navigateur est la **somme séquentielle** de comparaisons calendaires + producteurs P3.x + adhérence, exécutés dans **un seul** appel sync `buildPeriodDiscoveryBundle`.

### 3.2. Fixture historique fenêtre « 2y » (données ~juil–oct seulement)

Total ≈ **2,7 s** — top exclusive : `p36` 663 ms, `computeCalendarMonthSportStats` 599 ms, `p35` 359 ms, `p32b` 328 ms, adhérence 319 ms, `detectDiscoveries` ≈ 102 ms.

Utile pour coût calendaire à span long même avec historique court.

### 3.3. Fixture 7j / 30j

| Label | Total | Dominant |
|---|---:|---|
| hist-7d | ~1,2 s | `comparisons` / `measureRecapWindow:d90` |
| hist-30d | ~0,8 s | `p32b` |

---

## 4. Effet des corrections F7.0 déjà livrées (passe précédente)

| Correctif | Effet sur A | Effet sur B |
|---|---|---|
| Période immédiate (plus de deferred) | — | Aligne libellé ↔ fenêtre / cache |
| `computing` jusqu’à fin adaptive | — | Plus de fausse idle UI |
| Abort + yield **entre** trainingState / discoveries / essays | — | Stop publication stale ; yield **avant/après** le gros chunk seulement |
| `shouldAbort` entrée bundle | — | Abort si chunk pas encore entamé |

**Limite laissée ouverte :** le cœur discoveries restait **un** bloc sync → clic pendant ce bloc toujours gelé.

---

## 5. Correction supplémentaire (F7.0b) — coop minimale

### Fait

- Instrumentation fine (`calendarLoad`, `measureRecapWindow:*`, `p32b`/`p34`/`p35`/`p36`, trajectoires, etc.).
- `buildPeriodComparisonsAsync` — yield/abort **entre** chaque fenêtre de mesure.
- `buildPeriodDiscoveryBundleAsync` — yield/abort **entre** catalog/baselines, sleep, adhérence, p32b, p34, p35, p36, puis assemblage sync (detect + F3/F4/E0/F5).
- Pipeline coop branche sur `buildPeriodDiscoveryBundleAsync`.
- Chemin sync inchangé pour tests / scripts.

### Préservé (prouvé fixtures)

- Ordre / sélection : `scripts/f7-coop-identity.mjs` → **allEqual: true** (7d, 30d, 2y).
- F6 : `anySilentRegression: false`, non-régression OK, vitest F6 + pipeline OK.

### Non fait (volontaire)

- Web Worker.
- Asyncification totale du moteur.
- Découpage interne de `p36` / `computeCalendarMonthSportStats` / `detectDiscoveries` (chunks encore mono-thread longs).
- Réduction richesse analytique.

### Options si B reste insuffisant après remesure humaine

1. Yields **à l’intérieur** de `calendarLoad` (paquets de jours) — faible risque identité si agrégat final identique.  
2. Yields / abort dans `computeP36WindowMetrics` / occasion table — à analyser.  
3. Mémo partagée `calendarLoad` entre les 7 `measureRecapWindow` (réduit A, demande preuve identité).  
4. Worker — coût transfert snapshot + dépendances UI ; analyse dédiée avant.

---

## 6. Mesures avant / après (comparabilité)

| Indicateur | Avant (live, rapport F7.0) | Après correctifs F7.0b |
|---|---|---|
| Long Task max 2y | 24–26 s (PO navigateur) | **Non remesuré navigateur** (verrou) |
| 2y → 7j clic→header | ~29,6 s + dates 2y sous label 7j | Attendu : alignement label/dates (F7.0) + possibilité d’abort **entre** chunks ; **à confirmer humainement** |
| Identité fixtures | baseline F6 | sync ≡ async ; anySilentRegression false |
| Chunk sync max théorique (synth 2y) | ~109 s monolithe | ≈ max(p36, calendrier fenêtre, p35…) ≈ **15–35 s** par chunk |

---

## 7. Identité analytique

| Check | Résultat |
|---|---|
| `f7-coop-identity.mjs` | allEqual **true** |
| `f6-perf-vs-identity.mjs` | anySilentRegression **false** |
| `f6-nonregression.mjs` | OK |
| vitest recapF6 + pipeline | 11/11 OK |

---

## 8. Limites

1. Pas de remesure Long Task navigateur post-fix.  
2. Un producteur seul (`p36`, calendrier `prevSameLength`/`period`) peut encore bloquer > 50 ms (souvent plusieurs secondes sur données denses).  
3. `detectDiscoveries` + F3/F4/sélection restent un chunk sync en fin de bundle (secondaire sur longues fenêtres, non nul).  
4. Profil live 2 ans ≠ synthétique 109 s — ordres de grandeur live historiques 15–28 s restent la référence UI.

---

## 9. Checklist tests obligatoires

| Test | Statut |
|---|---|
| Cohérence période / fenêtre | Correctif F7.0 ; **reconfirm navigateur requis** |
| Clic pris pendant calcul long | Théorique oui **entre** chunks ; **non prouvé navigateur** |
| Calcul annulé ne publie pas | Conservé (`genRef` + abort coop) |
| Analyses identiques fixtures | **OK** |
| Cache période courte réutilisable | Conservé (période immédiate) ; remesure live requise |
| `computing` reflète calcul actif | Conservé F7.0 |
| Pas de double calcul inutile | `precomputedComposed` + precomputed packs async |
| Rejeu F6/F7.0 scripts | **OK** |

---

## 10. Décision

- Diagnostic affiné : **producteurs P3.x + calendrier**, pas `detectDiscoveries` comme unique coupable.  
- Correction coop **minimale** livrée localement, identité fixtures intacte.  
- **Ne pas clôturer F7.0 en succès** tant que la remesure 2y→7j navigateur n’a pas montré un retour interactif acceptable.  
- **Ne pas lancer F7.1** sans validation humaine.  
- **Aucun commit Git.**

### Demande à l’humain

1. Déverrouiller l’app.  
2. Rejouer les 6 scénarios du brief.  
3. Noter Long Task max, délai 2y→7j, alignement libellé/dates, comportement `computing`.  
4. Valider ou non la poursuite (approfondir yields internes vs F7.1).
