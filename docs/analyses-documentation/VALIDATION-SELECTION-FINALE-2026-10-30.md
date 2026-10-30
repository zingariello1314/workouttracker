# Validation finale — sélection des découvertes

**Date :** 30 octobre 2026  
**Run live :** `30d` · `2026-10-01` → `2026-10-30` · `generatedAt` `2026-10-30T04:29:11.027Z`  
**Objectif :** clôturer le chantier sélection avant P3 (sans lancer P3, sans commit).

---

## 1. Robustesse validation / identifiants

### Constat
`insightRejectReason` ne scanne que title / body / evidence (pas les metrics).  
Le risque restait les **producteurs** qui mettaient `Exercice 1596…`, `#id` ou `[id …]` dans la prose.

### Correctifs (multi-producteurs, pas un seul fichier)
| Zone | Changement |
| --- | --- |
| `recapStrengthPeriodStats` | `userFacingExerciseLabel` + `resolveUserFacingExerciseName` |
| `recapPeriodDiscoveries` | noms d’exercices de fenêtre sanitizés |
| `recapAnalysisDepth` | sortie répertoire sans libellé → **non publiée** |
| `weightedTrainingRecapInsights` | plus de `#${id}` |
| `recapMuscleLoadEngine` | plus de `#${id}` en fallback |
| `exerciseTrajectoryAnalysis` | peers / identity sans id brut |
| `recapTrainingTimeline`, `athleteJourney`, `recapExposureNarratives` | fallback « un mouvement » |

### Traçabilité post-sélection
Rejets après `select` apparaissent avec raison réelle, ex. live :
- `editorial_gate` (`disc_sleep_family`, `disc_stimulus_mix`)
- `insight_validation:internal_chip` (`disc_th_composition_now`)

### Tests
- metrics avec id long **ne rejettent pas**
- prose avec `[id …]` **rejette**
- 101 tests OK sur les suites concernées

**Live :** `rawIdShownCount = 0` sur les 17 cartes.

---

## 2. Pack de 17 cartes (une par une)

| # | Kind | Lecture |
| --- | --- | --- |
| 1–3 | `disc_emergence` ×3 | **Complémentaires** (exercices distincts). Motif narratif proche sur 2 « format repris » — pas une même conclusion chiffrée. |
| 4 | `disc_exercise_progress` | **Précise / étayée** (creux→reprise, séries, témoins). Weight 94. |
| 5–6 | `disc_gtg_unplanned_*` | **Complémentaires** (fenêtre vs parcours GTG). |
| 7–8 | `disc_ms_pr_consolidated`, `disc_ms_return` | **Complémentaires** (niveau reproductible vs retour après silence). |
| 9 | `disc_muscle_share_shift` | Angle mix (quads) — distinct du volume. |
| 10 | `disc_rest_assoc` | Association repos×volume — unique. |
| 11 | `disc_sleep_rhythm_habit` | Sommeil — unique (rescued). |
| 12 | `disc_volume_shape` | Portrait volume mois — unique. |
| 13 | `exercise_specific_abandonment` | Abandon ciblé (circuit abdos). |
| 14 | `journey_progress` | Lifetime multi-mouvements — **complémentaire** de #4 (`complementary: true`). |
| 15 | `program_gap_mixed` | Écart plan / réalisé. |
| 16 | `span_regularity` | Rythme inter-semaines. |
| 17 | `stretch_gap` | Mobilité vs force. |

**Redondance réelle :** aucune paire à fusionner en urgence.  
**Assiduité / mobilité / rythme :** présents.  
**Précis vs générique :** progress (94) et volume (94) ne sont pas relégués derrière journey (63) ni sleep (22).

Pas de retour forcé à 15 cartes.

---

## 3. Stabilité / biais `disc_exercise_progress`

- Test dédié : progress coexiste avec volume, sommeil, jalon et **une** carte composition (pas de monopole).
- Caps familles / rivaux composition inchangés dans leur logique.
- Live : progress selected + shown ; autres familles sport/sleep/gtg/adherence/mobility toujours présentes.

Aucun biais systématique détecté.

---

## 4. Conclusion

**Chantier sélection : suffisamment validé pour passer à P3.**

Problèmes restants (non bloquants) :
1. Pack à 17 (rescues) — acceptable.
2. Motif répété « format repris » sur plusieurs émergences — cosmétique éditorial, pas sélection.
3. Fallback « un mouvement » : mieux que l’id, mais peu informatif ; les sorties sans vrai nom sont surtout **supprimées** (répertoire).

---

## 5. Préparation P3 (non lancé)

**Piste retenue :** adhérence programme × progression réelle.

Questions cibles déjà formulées :
- exercices du plan réellement suivis / remplacés / oubliés ;
- progression malgré faible fréquence vs fréquence sans progression ;
- modifications de programme ↔ changements de perf ;
- répartition prévue vs réalisée.

Prérequis utiles déjà en place : `program_gap_*`, trajectoires exercice, journey lifetime, abandonnements spécifiques — à croiser en P3, pas à refondre ici.
