# P3 — Audit & conception : Adhérence × Progression

**Date :** 30 octobre 2026  
**Nature :** audit + conception technique — **pas d’implémentation** dans ce lot  
**Prérequis validés :** P0 trajectoires · sélection des découvertes  
**Objectif produit :** croiser **intention (programme)** × **exécution (journal)** × **progression (performances)**, pas ajouter quatre cartes statistiques isolées.

---

## 1. Inventaire des données exploitables

### 1.1 Programme actif & bibliothèque

| Source | Stockage | Identification | Granularité | Fiabilité | Limites | Relations |
| --- | --- | --- | --- | --- | --- | --- |
| `activeProgram` | WorkoutContext + persistance programmes (`programs` / cloud partiel) | `id`, `name`, `schedule[lundi…dimanche]`, `startDate`, `updatedAt`, variantes salle A/B, circuits, étirements | Semaine type (jours nommés), pas une date calendaire | Haute pour **l’état courant** | Toute édition **mutante** le schedule live ; `updatedAt` ≠ journal des diffs | → planifié via `getTodayWorkout` / `buildPlannedExerciseListForDateStr` |
| `programs[]` | Même contexte | Liste de programmes (actifs/inactifs) | Structure complète par programme | Haute pour versions **courantes** | Pas d’historique de versions internes (un id = dernière version) | `pickLatestProgram` / merge import |
| Quiz / coach meta | `activeProgram.quizGenerationMeta`, questionnaire profil | Objectifs, evidence, live coach | Session / génération | Variable | Coach live peut **modifier la liste du jour** sans figer l’intention initiale | → `applyLiveCoachToExercises` |

Fichiers pivots : `src/context/WorkoutContext/hooks/useWorkoutPrograms.js`, `WorkoutContext.jsx` (`buildFromProgramDay`), `src/utils/calendarProgramExercises.js`.

### 1.2 Planifié par jour calendaire

| Source | Stockage | ID | Granularité | Fiabilité | Limites | Relations |
| --- | --- | --- | --- | --- | --- | --- |
| **`calendarDayPlanSnapshots[YYYY-MM-DD]`** | Aggregate workout (IndexedDB) | Snapshot : `programId`, `variant`, `exercises[]` (storageId, originalId, name, series…) | **Jour** | **Haute** si présent : figé, non écrasé | Créé surtout au **premier enregistrement significatif** ; jours sans perf → souvent absents | Source prioritaire de `resolveExercisesForCalendarDate` |
| Reconstruction depuis clés | Dérivé de `checkedExercises` / `reps` | `programId: 'reconstructed'` | Jour | **Moyenne** : reconstruit ce qui a été **fait**, pas le plan oublié | Ne connaît pas les exercices planifiés non cochés | Fallback si pas de snapshot |
| Plan **live** | `activeProgram.schedule` + variante semaine | Jour de semaine → exercices | Jour | Haute pour aujourd’hui ; **dangereuse pour le passé** | Réécrit rétroactivement les jours vides / non snapshotés | Utilisé si ni snapshot ni reconstruct |
| `calendarMonthPlanSnapshots[YYYY-MM]` | Aggregate | `plannedRestDates[]` seulement | Mois | Haute pour **repos prévus** figés | **Ne fige pas** la liste d’exercices | Complète l’axe assiduité repos |

Fichiers : `src/utils/calendarDayPlanSnapshot.js`, `calendarMonthRestPlanSnapshot.js`, `calendarProgramExercises.js`.

### 1.3 Complétions & exécution

| Source | Stockage | ID | Granularité | Fiabilité | Limites | Relations |
| --- | --- | --- | --- | --- | --- | --- |
| `checkedExercises` | `{date_exerciseId: true}` | Clé date_id (+ `_semaineA/B`) | Exercice × jour | Haute (acte utilisateur) | Coche ≠ qualité de série | Complétion vs planifié |
| `reps`, `exerciseSetLogs`, `exerciseWeights`, `exerciseSetWeights`, `exerciseMarkedWeighted` | Aggregate | Même clés | Série / charge | Haute si logs structurés ; partielle sinon | Totaux seuls vs sets (déjà géré P0) | Trajectoires, volume lesté |
| `computeProgramCompletionCheckedRatio` | Calculé | Jour | Jour | Haute si plan résolu correctement | Dépend du plan (live vs snapshot) | Features assessment / relations |
| `getCompletionForWindow` | `recapCompletionTruth.js` | Fenêtre | Fenêtre | Haute agrégats | Agrégat ≠ détail exercice | Essays / coach |
| `leastCheckedExercises` | Calculé | Exercice / circuit | Fenêtre | Haute sur jours **avec** activité | Ignore jours sans séance | `exercise_specific_abandonment` |
| `dailyVariations[date]` | Aggregate | Jour | Jour | Haute | Suppressions, additionnels, overrides séries/variante/pyramide | Distingue oubli / remplacement / hors programme |
| Circuits | `circuitDefinitions`, `circuitProgress` | circuitId × date | Circuit × jour | Haute si définis | Exclusion d’exos du bucket « least » | Assiduité structurelle |

### 1.4 Justifications & feedback

| Source | Stockage | Fiabilité | Limites P3 |
| --- | --- | --- | --- |
| Justifications jour (`dayJustificationUtils`) | Workout data | Haute quand renseignées | Explique repos / absence ; rare |
| `sessionFeedbacks` | Par date (ressenti, RPE-like, tags) | Haute si saisie | **Souvent sparse** (déjà flag console « Feedback manquant ») — enrichissement optionnel, pas prérequis P3 cœur |
| Features `justifiedDays` | Assessment | Dérivé | Déjà croisé dans `program_gap_*` |

### 1.5 Historique programmes / snapshots « version »

| Source | Contenu réel | Fiabilité pour « que prévoyait-on le 12/09 ? » |
| --- | --- | --- |
| `programHistory[]` | Entrées légères type `{ programId, programName, tableId, startDate, triggerType }` (création tableau) | **Faible** : pas de `schedule` figé, pas de diff d’exercices |
| `activateProgram` | Change status + `updatedAt` ; **n’archive pas** le schedule précédent | Pas de timeline de structure |
| `programs[]` versions | Un seul objet par `id` (dernière écriture gagne) | Impossible de rejouer un schedule passé via cet id seul |
| Cloud programmes | Sync partielle ; commentaire explicite : `programHistory` **non synchronisé** cloud dans le pilote actuel | Historique local uniquement |

### 1.6 Trajectoires & performances (réutiliser P0)

| Source | Rôle P3 |
| --- | --- |
| `buildExerciseTrajectory` / `disc_exercise_progress` | Progression fenêtre (shape, sets, peers) — **ne pas dupliquer** |
| `athleteJourney` / `journey_progress` | Lifetime référence → habituel |
| `collectLifetimeRepHistory`, baselines, milestones | Fréquence réelle, paliers |
| GTG (`normalizeGtgData`, discoveries GTG) | Exposition hors créneau programme ; pertinent si l’exo est aussi au plan |

### 1.7 Producteurs analytiques déjà proches (à enrichir, pas remplacer)

- `trainingRelationEngine` : `program_gap_adherence|completion|mixed`, `exercise_specific_abandonment` (agrégats % / least-checked).
- `recapProgramCoachAnalysis` : `scanProgramMuscleVolume` vs `scanActualMovementExposure`, structure, jambes, push/pull plan.
- `recapProgramStructureReport`, `recapDenseAnalytics`, `computeDayOfWeekAdherence`.
- Complétion / least-checked / GTG unplanned.

**Conclusion inventaire :** les données de **journal** et de **plan figé par jour (si snapshot)** existent. L’historique **versionné du programme** (schedule à date T) est **largement incomplet** hors `calendarDayPlanSnapshots`.

---

## 2. État réel de l’historique des programmes

### 2.1 Ce qui empêche déjà la réécriture rétroactive

1. **`calendarDayPlanSnapshots`** — à la première perf significative du jour, `ensureDayPlanSnapshot` fige le plan live ; **n’écrase jamais** un snapshot existant.
2. Résolution lecture (`resolveExercisesForCalendarDate`) : **snapshot → reconstruct → live**.
3. **`calendarMonthPlanSnapshots`** — fige les **dates de repos** prévues du mois à la 1ʳᵉ consultation.

### 2.2 Ce qui reste fragile

| Situation | Comportement actuel | Fiabilité « prévu à date T » |
| --- | --- | --- |
| Jour avec snapshot | Plan figé | **Fiable** |
| Jour avec perfs, sans snapshot | Reconstruct = exercices **touchés** | **Partiel** (oublis invisibles) |
| Jour **sans** perfs (manqué / futur passé sans saisie) | Retombe sur **programme live** | **Non fiable** — une édition récente réécrit le « prévu » rétrospectif |
| Édition d’exercices / séries / fréquence du programme | Mute `activeProgram.schedule` + `updatedAt` | Pas de journal de diff |
| Changement de programme (`activateProgram`) | Pas d’archive schedule | Rupture : on sait qu’un autre programme est actif, pas la structure exacte jour par jour avant |
| `programHistory` | Métadonnées d’activation / tableaux | **Insuffisant** pour P3 structurel |

### 2.3 Périodes fiables vs non fiables (règle opérationnelle P3)

| Couche | Fiable si | Non fiable / à exclure des conclusions fortes |
| --- | --- | --- |
| Prévu vs réalisé **par exercice** | `source === 'snapshot'` pour le jour | Jours `live` sans snapshot ; reconstruct pour les « oubliés » |
| Fréquence réelle vs progression | Toujours (journal + trajectoires) | N/A — ne dépend pas du plan |
| Modifications programme vs évolution | Seulement si on peut dater un **changement observable** (snapshot A→B, ou activation avec chevauchement de fenêtres) | Diffs « avant/après édition » sans archive |
| Répartition prévue vs réelle | Prévu : agrégation des snapshots de la fenêtre (ou plan live **étiqueté provisional**) | Prévu live présenté comme historique |

**Prérequis majeur exposé :** sans étendre les snapshots (jours manqués / versions programme), l’axe C (modifs → perf) et une partie de A (oublis sur jours vides) restent **bornés**.

---

## 3. Possibilités analytiques concrètes (4 axes)

### A. Programme prévu vs réalisé

**Détectable dès maintenant (données suffisantes) :**
- Sur jours **snapshotés** : fait / partiel / oublié / hors-plan (`dailyVariations.additionalExercises`) / supprimé du jour (`suppressedExercises`) / override séries.
- Écarts **récurrents** vs ponctuels : même `originalId` oublié ≥ N séances planifiées sur fenêtre.
- Remplacement approximatif : exo planifié absent + exo hors-plan même famille musculaire le même jour (hypothèse **probable**, pas causale).
- Agrégats déjà produits : `program_gap_*`, abandonment spécifique.

**Difficile / impossible sans amélioration données :**
- Oubli sur jour **sans aucune saisie** et sans snapshot → le « prévu » live ment.
- « Déplacé » (même exo un autre jour) : possible heuristique (fait hors jour planifié) mais faible sans plan figé des deux jours.

### B. Fréquence réelle vs progression

**Fort dès maintenant** (réutilise P0) :
- Joindre `collectLifetimeRepHistory` / sessions dans fenêtre × `buildExerciseTrajectory`.
- Classes : progrès + fréquence haute ; progrès + fréquence basse ; fréquence haute + plateau/recul ; données insuffisantes (`trajectoryOk` false / peers insufficient).
- Séparer : **jours d’exposition**, **volume reps**, **qualité de progression** (shape / sets) — trois métriques distinctes dans le finding.

### C. Modifications du programme vs évolution

**Partiel :**
- Comparer trajectoires avant/après une **date de bascule** si on détecte : activation programme, ou changement de composition des snapshots (exo apparaît/disparaît du plan figé sur plusieurs semaines).
- Ne **jamais** affirmer causalité : stance `watch` / `probable` selon n et contrôles (volume global, sommeil).

**Bloqué sans nouveau journal de versions :**
- « Tu as passé 3×8 → 4×8 le 3 octobre » si seule la version live existe.

### D. Répartition prévue vs réelle

**Faisable :**
- Prévu : somme des exercices des **snapshots** de la fenêtre (une fois par jour, pas double-comptage variante A/B).
- Réel : `scanActualMovementExposure` / muscle load / push-pull déjà présents.
- Comparer parts (pectoraux, push/pull, haut/bas) avec dénominateur unique (reps attribuées) — réutiliser `recapMuscleLoadEngine` / coach analysis.
- Étiquette si prévu = live provisional.

---

## 4. Règles analytiques (finding d’abord)

### Principes transverses
1. Calculer un **finding structuré** (metrics + stance + limits) avant toute prose.
2. Références temporelles = conventions P0 (`interpretingWithHistory`, granularité sets).
3. Claims : topics distincts (`programme.adherence.*`, `programme.progress.*`, `programme.mix.*`) pour ne pas collapser avec `exercice.fenetre.*`.
4. Validation : libellés via `userFacingExerciseLabel` ; jamais d’id technique en prose.
5. Sélection : nature `trajectory`/`journey` selon scope ; informativeValue si preuves trajectoire ; pas de quota artificiel famille « programme ».

### Exemples de découvertes (schéma)

| Kind proposé | Données | Calcul | Seuils (indicatif) | Impossible si | Limites | Dedup vs existant |
| --- | --- | --- | --- | --- | --- | --- |
| `disc_plan_follow_rate` | Snapshots + checks fenêtre | % exos planifiés cochés ; récurrence | Fenêtre ≥ 4 jours planifiés snapshotés ; écart ≥ 20 pts vs 100 % | < 3 jours snapshotés | Ne parle pas de perf | Distinct de `program_gap_*` (exo-niveau vs agrégat) |
| `disc_plan_recurring_skip` | Idem | Exos oubliés ≥ k/k_plan | k≥3 ou ≥60 % des apparitions planifiées | Snapshot insuffisant | Pas « abandon » émotionnel | Rival / complément `exercise_specific_abandonment` |
| `disc_offplan_pattern` | `additionalExercises` + plan | Fréquence hors-plan par famille | ≥3 jours | — | Remplacement = hypothèse | Novelty vs span_new_variant |
| `disc_freq_vs_progress` | Trajectoire + sessions | Jointure story × nb séances | `trajectoryOk` ; ≥4 séances ou stance watch | Pas de trajectoire | Fréquence ≠ volume | Complément `disc_exercise_progress` (ne pas rivaliser sur même story) |
| `disc_high_freq_no_progress` | Idem | Fréq. haute + plateau/net_decline | Médiane séances/sem. ≥ seuil perso ; story plateau/decline | Sets partial only → watch | Peut être charge/technique | |
| `disc_prog_despite_low_freq` | Idem | Fréq. basse + net_rise/recovered | — | — | Sélection naturelle / GTG | Mention GTG si partagée |
| `disc_plan_mix_drift` | Snapshots + réel | Δ parts muscles / push-pull | Δ part ≥ 8 pts abs. | Prévu provisional | Attribution multi-muscles | Rival composition stories |
| `disc_program_shift_window` | Bascule datée + traj. | Avant/après sur même exo | ≥4 séances chaque côté | Pas de bascule datée | **Non causal** | |

Seuils exacts à caler en golden tests sur données live (pas de hardcode « pompes »).

---

## 5. Architecture proposée (intégration)

```
Sources
  activeProgram / programs
  calendarDayPlanSnapshots (+ reconstruct)
  dailyVariations
  checkedExercises / reps / sets / weights
  buildExerciseTrajectory / journey
  (optionnel) sessionFeedbacks, GTG
        │
        ▼
┌───────────────────────────────────────┐
│  Couche finding (NOUVEAU module)      │
│  recapProgramAdherenceProgression.js  │
│  — buildPlanRealizationMatrix(window) │
│  — joinFrequencyAndTrajectories(...)  │
│  — buildPlanMixComparison(...)        │
│  — detectProgramShiftCandidates(...)  │
│  Sortie : findings[] (pas de prose)   │
└───────────────────────────────────────┘
        │
        ▼
Producteurs textes (disc_* / relations)
  → editorial gate → filterValidInsights
  → selectPeriodDiscoveries / essays
  → claims / kinship / nature boosts
  → console diagnostic (forensics)
```

**Réutiliser :**
- `buildExerciseTrajectory` (P0)
- `buildPlannedExerciseListForDateStr` / `resolveExercisesForCalendarDate` / `ensureDayPlanSnapshot`
- `computeProgramCompletionCheckedRatio`, `leastCheckedExercises`
- `scanProgramMuscleVolume` / `scanActualMovementExposure`
- `detectTrainingRelations` (étendre ou déléguer aux nouveaux disc_*)
- Pipeline sélection / claims / validation déjà validés

**Ne pas créer :** second moteur de trajectoire ; second muscle-load ; LLM.

**Évolutions données (lots ultérieurs, hors conception pure) — par priorité :**
1. Persister snapshot aussi sur **jours planifiés manqués** (quand le calendrier « voit » le jour passé) — débloque A oubli total.
2. Journal léger `programStructureRevisions[]` : `{ at, programId, hashSchedule, summary }` à chaque `updateProgram` / activate — débloque C.
3. Étendre `programHistory` avec schedule compressé à l’activation (optionnel si 2).

---

## 6. Producteurs à créer / modifier

| Action | Cible |
| --- | --- |
| **Créer** | `src/utils/sport/recapProgramAdherenceProgression.js` (+ tests) — findings purs |
| **Créer** | Rédacteurs minces `compose…` ou branche dans `detectDiscoveries` / `trainingRelationEngine` |
| **Modifier** | `recapNarrativeClaims.js` — topics programme |
| **Modifier** | `insightSemanticThemes.js` / nature kinds |
| **Modifier** | `trainingRelationEngine` ou discoveries : éviter doublon textuel avec `program_gap_*` (complémentarité documentée) |
| **Modifier (lot données)** | Appels `ensureDayPlanSnapshot` sur jours planifiés échus sans perf |
| **Ne pas toucher** | Cœur `exerciseTrajectoryAnalysis` sauf API join propre |

---

## 7. Tests nécessaires

1. **Matrix plan×réalisé** : snapshot + checks → fait/oublié/hors-plan ; jour live sans snapshot → finding `insufficient` / flag provisional.
2. **Récurrence** : 1 oubli vs 4/5 → kinds distincts.
3. **Freq × traj** : fixtures P0 (recovered / plateau) × densités de séances.
4. **Mix** : pas de double-comptage A/B ; parts somment ~100 % sur dénominateur choisi.
5. **Shift** : sans bascule datée → aucun claim causal.
6. **Sélection** : nouvelles cartes coexistent avec `disc_exercise_progress` / `program_gap_mixed` (complément, pas rival aveugle).
7. **Validation** : aucun id technique ; metrics longues OK.
8. **Golden live 30d** : console — produced / shown / drop reasons par famille `programme`.

---

## 8. Ordre d’implémentation priorisé

| Étape | Contenu | Dépendance données |
| --- | --- | --- |
| **P3.0** | Module findings + matrix sur jours `source=snapshot` seulement + jointure freq×trajectoire | Aucune migration |
| **P3.1** | Découvertes A+B branchées pipeline + claims + tests + validation console 30d | — |
| **P3.2** | Axe D (mix prévu snapshoté vs réel) | — |
| **P3.3** | Durcir snapshots jours manqués (écriture) | Changement persistance |
| **P3.4** | Journal de révisions programme + axe C borné (avant/après daté, non causal) | Changement persistance |
| **P3.5** | Affinage GTG × plan, feedback sparse optionnel | — |

**Ne pas commencer par C** tant que P3.3–P3.4 ne clarifient pas l’historique.

---

## 9. Limites assumées (livrable)

1. `programHistory` actuel ≠ archive de structure.
2. Prévu rétrospectif fiable ≈ **intersection des jours snapshotés** (et reconstruct partiel).
3. Feedback séance trop sparse pour être pilier P3.
4. Remplacement / déplacement = heuristiques **probables**.
5. Causalité modif→perf : hors scope affirmations fortes.

---

## 10. Verdict conception

Momentum possède déjà :
- un **journal riche** (checks, reps, sets, variations) ;
- un **mécanisme de gel du plan par jour** (`calendarDayPlanSnapshots`) ;
- des **trajectoires P0** et des **écarts programme agrégés**.

Il manque surtout une **couche de croisement finding** et un **historique de structure** plus complet pour l’axe modifications.

Le chantier P3 est **prêt à démarrer à l’étape P3.0–P3.1** sans attendre toute la migration données ; les axes C et une partie de A « oubli total » devront suivre P3.3–P3.4.

**Implémentation non démarrée dans ce lot. Aucun commit.**
