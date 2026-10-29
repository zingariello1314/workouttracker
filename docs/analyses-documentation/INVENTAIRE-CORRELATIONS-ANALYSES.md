# Inventaire transversal des corrélations — Momentum Sport Analyses

**Date :** 29 oct. 2026  
**Statut :** inventaire code-first (disponibilité réelle). Alimente le [plan](./PLAN-MISSION-MAJEURE-MOTEUR-ANALYSE.md) (exigence R2).  
**Légende dispo :** `ready` = calculable aujourd’hui · `partial` = données ou n souvent insuffisants · `absent` = pas de source fiable inventoriée

---

## Matrice

| # | Relation | Question analytique | Données nécessaires | Dispo code | Méthode | Limites | Analyses à enrichir / produire | Priorité impl. |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C1 | Volume + fréquence + dose/séance | Hausse de niveau de travail ou seulement de volume total ? | Reps fenêtre, nb séances, span | **ready** — features `userTrainingState`, essays, period volume | Décomp Δvol ≈ f(Δfreq, Δdose) ; TraceableNumber | Fenêtres incomparables | Enrichir cartes volume ; Finding `volume.decomp` | **P0** |
| C2 | Volume + perf/série (sets structurés) | Volume↑ avec perf stable/hausse/baisse ? | `exerciseSetLogs`, best set | **partial** — `resolveExercisePerformance` ; beaucoup de séances total-only | Comparer volume séance vs best set sur séances `provenance=structured` | Sans sets → silence sur perf | Progression exercice, reprise | **P0** |
| C3 | Séances comparables (même famille) | Progression réelle à conditions comparables ? | Catalog, baselines, identité exercice | **ready** — `findComparableSessions`, `recapExerciseIdentity` | Série de séances « mêmes mouvements » | Variante différente → non comparable | Reprise, progress, plateau | **P0** |
| C4 | GTG hors planning + max / volume exo GTG | Co-évolution temporelle (pas causalité) | GTG ad hoc, `exerciseMaxHistory` | **ready** — `recapGtgUnplannedReading`, max history | Chevauchement dates + densité GTG vs variation max | n faible → hypothèse seulement | Carte croisée ou lien entre 2 claims | **P0** |
| C5 | Assiduité DOW + groupes musculaires plan | Quelles parties du programme sous-exécutées vs objectifs ? | Planning, checks, muscle scan | **ready** — `computeDayOfWeekAdherence`, `getCompletionForWindow`, `recapProgramCoachAnalysis` exposure | Taux complétion par DOW × muscles du slot | Jour non planifié ≠ manqué | **Nouvelle** famille assiduité Analyse | **P0** |
| C6 | Prévu vs fait (volume / push-pull) | Écart structurel programme ↔ exécution | Plan exposure + actual exposure | **ready** — `mergeMovementExposure`, structure report | Ratio plan/réel par famille | Plan change mid-window | Assiduité + mix | **P1** |
| C7 | Sommeil × volume séance | Association répétée nuit / charge ? | Garmin nights + catalog | **ready** — `publishSleepCandidates`, `computeSleepPerformanceAssociation` | Seuils 7h30, n min | Association ≠ cause ; jours sans séance | Cartes sleep existantes → approfondir conséquence | **P1** |
| C8 | Sommeil × difficulté ressentie | Nuit × RPE ? | Feedbacks difficulté + sleep | **partial** — `sleepPerceivedEffort` existe ; densité feedbacks souvent faible | Assoc si n≥seuil | n faible → ne pas publier | Sleep / récup | **P2** |
| C9 | Objectifs quiz × mix push/pull / lacunes | Cohérence objectif ↔ stimulus reçu ? | `trainingState.context.goal`, pushPct | **ready** — `goalPushConsequence`, `goal_gap` essays | Comparer mix réel vs objectif | Objectif mal renseigné | Enrichir mix / assiduité | **P1** |
| C10 | Poids dans le temps × activité | Évolutions simultanées (sans causalité) | `progressEntries` weight | **ready** — `buildWeightByDateMap` | Δ poids + Δ volume parallèle | 1 mesure → pas de tendance | **Nouvelle** famille body | **P1** |
| C11 | Poids + taille → IMC | Indicateur calculé + limites | weight + height quiz/vitals | **partial** — height souvent quiz ; weight entries | IMC = w/(h²) | Pas masse grasse ; athlètes musclés | Body si h+w | **P1** |
| C12 | Impédance / composition | Évolution MG / MM | entries `type=impedance` | **partial** — champs présents si saisis | Séries datées | Souvent absentes | Body seulement si n≥3 | **P2** |
| C13 | Variantes (ex. pompes déclinées vs sol) | Progression trompeuse cross-variante ? | Identity / movement keys | **partial** — `recapExerciseIdentity`, volumeSharedWithRepSibling | Bloquer ou qualifier comparaison | Heuristique noms | Progress / return | **P1** |
| C14 | Plateau perf + exposition continue | Stagnation malgré volume ? | Max history + sessions | **ready** — journey plateau kinds | Bande stable N séances | Pas pathologie | Plateau cards → conséquence programme | **P1** |
| C15 | Reprise + séances post-retour | Ponctuel vs durable ? | Gap + sessions after | **ready** — milestones return + durable kinds | Trajectoire 3–5 séances | Gap ≠ blessure | Approfondir return (mission ex. B) | **P0** |
| C16 | Course × sommeil | Sorties vs nuits | runDays + nights | **ready** — `sleepCardioByThreshold` | Assoc km vs seuil sommeil | Peu de sorties | Sleep/cardio existant | **P2** |
| C17 | Fréquence identité × absences qualités | Creux global vs qualité délaissée | `athleteTrainingIdentity` unusualQualities | **ready** | Bandes + gaps qualités | Alignement fenêtre (déjà fixé) | Identity cards → conséquence | **P1** |

---

## Décisions d’implémentation immédiates (P0)

Implémenter / approfondir en premier : **C1, C2 (si sets), C3, C4, C5, C15**.

Reporter sans bloquer : C8, C12, C16 (n souvent insuffisant).

Ne **pas** inventer : causalité poids→muscle, sommeil→PR, GTG→+reps affirmé.

---

## Statut livraison (code)

| Relation | Statut | Module / branchement | Test profondeur |
| --- | --- | --- | --- |
| C1 Volume×freq×dose | **livré** | `buildVolumeDecompFinding` → essay `volume_traj` | golden + findings |
| C2 Volume×perf (momentum) | **livré (proxy)** | même Finding via `perfMomentumPct` (sets structurés restent partial) | golden C1×C2 |
| C4 GTG×repère | **livré** | `buildGtgRepereCoevoFinding` → essay `gtg_repere_coevo` | golden C4 |
| C5 Assiduité DOW×muscles | **livré** | `buildAdherenceDowFinding` → essay `adherence_dow` | golden C5 |
| C10/C11 Poids (±IMC) parallèle | **livré** | `buildBodyWeightParallelFinding` → essay `body_weight_parallel` | golden C10 |
| C3 / C15 | en cours / existant partiel | comparables + return milestones | — |

R4 : `recapSelectionDiagnostics` + `boostUnderrepresentedFamilies` + `rescueStarvedFamilySlots` dans `buildAdaptiveRecapInsights`.

---

## Mise à jour

Après chaque relation livrée : cocher ici + golden pack R1/R3 + ligne diagnostic R4.
