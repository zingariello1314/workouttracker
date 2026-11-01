# F3 — Raisonnement composé multi-faits  
**2026-11-01** — Lot unique. Arrêt après F3. Aucun commit Git.

## Verdict

F3 ajoute une couche **déterministe** `composedEvidence` branchée sur les trajectoires déjà calculées (`buildExerciseTrajectory` → producers prioritaires → `buildPeriodDiscoveryBundle`). Les faits (décomposition séries/reps, continuité, attribution fréquence vs contenu, témoins, conclusions interdites) sont **structurés et traçables**. Aucun second moteur, aucun retune E0, aucun nouveau kind. La profondeur A (recul localisé / décomposition) et B (format consolidé / attribution) sont démontrées en synthétique **et** sur la fixture juil–oct 2026.

---

## Architecture retenue

```
données fiables
  → buildExerciseTrajectory (sets, shape, peers, installation, findings)
  → classifyVolumeAttribution / classifyContinuity / resolveVolumeLexicon
  → buildComposedEvidenceFromTrajectory → metrics.composedEvidence
  → enrichDiscoveriesWithComposedEvidence (pool post-scope, pré-E0)
  → selectPeriodDiscoveriesWithTrace (E0 inchangé)
  → essays / UI
```

Pipeline public inchangé. La composition enrichit `metrics` / preuves ; elle ne parse jamais les textes.

### Modules

| Rôle | Fichier |
| --- | --- |
| Couche F3 | `src/utils/sport/recapComposedEvidence.js` |
| Trajectoire (mécanisme + copy) | `exerciseTrajectoryAnalysis.js` |
| Branchement pool | `recapPeriodDiscoveries.js` (`enrichDiscoveriesWithComposedEvidence`) |
| Producteurs enrichis via `trajectoryToMetrics` | `disc_exercise_progress`, `disc_vs_habit`, `disc_emergence`, `disc_freq_*`, retours / structural_memory / adherence |
| Contrats F2 réutilisés | `recapTemporalContracts`, `recapDayContracts` |

### Contrat `composedEvidence` (synthèse)

`ok`, `composed`, `factCount`, `primaryPhenomenon`, `windows` (W/C/H), `observations`, `decomposition`, `continuity`, `volumeAttribution`, `comparators`, `lexicon`, `levels` (observé / interprété / implication), `proof`, `caveats`, `forbiddenConclusions`, `conclusion`, `sources`.

---

## Compositions implémentées

1. **Décomposition séries × reps** (sets trusted) — `same_sets_fewer_reps`, `more_sets_same_reps`, etc.
2. **Attribution volume** — `frequency_driven_total_*` vs `per_session_driven_*`.
3. **Continuité** — pic ponctuel, format consolidé, recul confirmé, plateau, retour ponctuel/confirmé, outlier.
4. **Témoins** — localized / shared / mixed / insufficient ; interdits si shared ou insufficient.
5. **Lexique** — « performances » seulement si structure + témoins OK ; sinon « volume de répétitions enregistré ».
6. **Niveaux 1–3** — fait / interprétation / implication (niveau 3 optionnel, règles existantes).
7. **Conclusions interdites** — adaptation physio, causalité sommeil, diagnostic, consolidation/reprise durable injustifiées, décomposition inventée.

## Compositions non implémentées (documentées)

| Famille | Statut |
| --- | --- |
| Endurance distance/FC composée | Conditionnelle — données comparabilité insuffisantes hors scope F3 |
| Sommeil × charge multi-faits | Non — faits sommeil F2 conservés ; causalité interdite |
| Programme plan prouvé × volume | Partiel via adherence existante ; pas de nouveau moteur |
| Muscles / ledger composition profonde | Non — P3.2b inchangé ; F5 pour rivalités |
| GTG composition volume croisée | Garanties P3.5 intactes ; pas de double comptage ajouté |
| Nouveaux kinds | Aucun (validation non demandée) |

---

## Modifications code (résumé)

Voir `REGISTRE-MODIFICATIONS-F3-2026-11-01.md`.

- Nouveau : `recapComposedEvidence.js` + tests + script replay.
- `exerciseTrajectoryAnalysis.js` : attribution volume, `composedEvidence`, lexique volume/performance, dates FR creux.
- `recapPeriodDiscoveries.js` : enrichissement pool + debug `composedPool`.

**Non modifié :** scores E0, caps, rivaux, quotas, essays F4, sélection F5.

---

## Résultats tests synthétiques

`npx vitest run src/utils/sport/__tests__/recapComposedEvidence.test.js` → **18/18**.  
Suite trajectoire existante → **27/27** (inchangée fonctionnellement).

Couverture scénarios A–K : voir `TESTS-FIXTURES-F3-2026-11-01.md`.

---

## Replays fixture (`workout-main-jul-oct-2026.json`)

Source : `scripts/f3-replay-periods.mjs` → `fixtures/f3-replay-periods.json` / `f3-replay-brief.json`.  
Profil live : **non inspecté** (non connecté dans cette session).

| Période | ms | pool | selected | composed pool | composed selected | Continuités notables |
| --- | --- | --- | --- | --- | --- | --- |
| 7d | 701 | 31 | 12 | 4 | 3 | punctual_return, decline_then_recovery |
| 30d | 1555 | 43 | 19 | 12 | 7 | directional, plateau, recovery, punctual_return |
| 3m | 2596 | 52 | 21 | 11 | 5 | directional, plateau, recovery |
| 6m | 2606 | 54 | 20 | 11 | 5 | **consolidated_format**, plateau, recovery |

### Profondeur A (fixture 30d)

`disc_freq_decline_low_exposure` — Pompes déclinées :

- `setMechanism: same_sets_fewer_reps`
- `attribution: per_session_driven_decline`
- Conclusion structurée : « Le nombre de séries reste ~4 ; ce qui baisse, ce sont les répétitions par série (~15 → ~10). »
- Lexique volume (témoins `mixed`, pas « force générale »).

### Profondeur B (fixture 6m / 30d)

- Tractions australiennes : `4×10 → 4×12`, `continuity: consolidated_format`.
- Relevés de genoux : total ↑ via `frequency_driven_total_rise`, format `3×20` stable.

### Avant / après (nature du gain)

| Avant F3 | Après F3 |
| --- | --- |
| Faits trajectoire épars dans metrics | `composedEvidence` unifié (faits + continuité + interdits) |
| Copy parfois déjà riche (P0) | Même copy + champs exploitables F4/F5 (`composedFactCount`, continuity, attribution) |
| E0 ne « voit » pas la profondeur | Documenté pour F5 — **pas** retuné ici |

---

## Limites

1. Noms « un mouvement » quand map d’identité absente → F4.
2. Accords / redondances rédactionnelles (« 1 séance … n’ont ») → F4.
3. `informativeValue` n’utilise pas encore `composedFactCount` → F5.
4. Rivalités emergence × return × progress → F5.
5. Composition endurance / sommeil / muscles non livrée (voir matrice).
6. 1an / 2ans non rejoués : fixture sans historique suffisant.

---

## Critères de clôture F3 (auto-évaluation)

| # | Critère | OK |
| --- | --- | --- |
| 1–2 | Pipeline unique, pas de 2ᵉ sélection | oui |
| 3–4 | Preuves structurées, pas de parse texte | oui |
| 5–8 | Décomposition, témoins, volume≠perf, continuité | oui (tests + fixture) |
| 9–11 | Stabilité, F2, P0–P3.6 | oui |
| 12–15 | Tests, replays, A+B e2e, densité info | oui |
| 16–19 | Limites doc, pas E0/F4+/commit | oui |

**F3 livré pour validation humaine. F4 non engagé.**
