# Matrice des capacités de raisonnement — F1 (2026-11-01)

Légende : **Dispo** = déjà publié ; **Partiel** = métriques ou textes incomplets ; **Possible** = données accessibles au pipeline, raisonnement non (ou mal) assemblé ; **Manque data** = absente du snapshot/Garmin pour le pipeline ; **Non démontrable** = causal / physiologique interdit.

---

## Musculation

| Capacité | Statut | Preuve code | Commentaire |
| --- | --- | --- | --- |
| Total reps / séance / exercice | Dispo | `reps[ymd_id]`, catalog | Base de presque tous les producers |
| Séries individuelles structurées | Partiel | `exerciseSetLogs` + `resolveExerciseSetsForAnalysis` / `readTrustedSessionSets` | Disponibles ; emergence / progress les utilisent **si trusted** ; sinon fallback total unique |
| Répétitions par série (décomposition baisse) | Possible | Idem | Exemple A : « baisse des reps/série, sets stables » → **possible** avec logs trusted, **pas** systématiquement publié en carte deep |
| Charge / volume kg×reps | Partiel | `volumeProgressionEngine`, load maps | Présent pour exercices chargés ; rare dans copy 7j |
| Nombre de séries | Partiel | setCount dans resolve/emergence | Souvent ~3×N approximatif |
| Variantes d’exercices | Dispo | IDs distincts + names | Pompes vs déclinées = IDs séparés |
| Fréquence / exposition | Dispo | P0 freq, P3.6 exercise_freq | |
| Trajectoire / creux / retour | Dispo | `disc_exercise_progress`, emergence, ms_return | Arc parfois **hors fenêtre** (métrique honest) |
| Plateau (stagnation) | Partiel | `analyzeExerciseProgressionHistory` stagnant | Peu promu en discovery E0 |
| Régression chiffrée vs cousins (push stables) | Possible | baselines + multi-ex ids | Exemple A : comparaison cousins **pas** producteur dédié |
| Retour après interruption | Dispo | `disc_ms_return*`, emergence réapparition | |
| Stabilité de format (sets×reps maintenu) | Partiel | emergence « format repris » | Atteint le niveau B partiellement ; conseils « repartir de 30 » absents |
| Exercices témoins / famille push | Partiel | push_pull, th_pushPull | Agrégats, pas « cousins stables vs cible en baisse » |
| Répartition musculaire | Dispo | muscle_now / share_shift / P32b | Souvent **descriptive** |
| Comparaison au programme | Partiel | P3.5 gaps, adherence P0 | Limites reconstruction historique fréquentes |

## GTG

| Capacité | Statut | Preuve | Commentaire |
| --- | --- | --- | --- |
| Répartition jours classique / GTG / both | Dispo | P3.5 coexistence | |
| Passages / reps GTG | Dispo | gtgService + P3.5 movement share | |
| Coexistence | Dispo | `disc_p35_gtg_coexistence` | |
| Unplanned / hors planning | Dispo | `disc_gtg_unplanned_*` | |
| Continuité volume GTG | Partiel | unplanned_progress (rare) | |
| Limites créneaux historiques | Dispo (methodology) | notes / abstentions | |

## Endurance

| Capacité | Statut | Preuve | Commentaire |
| --- | --- | --- | --- |
| Distance / durée / sorties | Partiel | Garmin activities + running stats | Dépend couverture Garmin |
| FC | Partiel | peaks collectors | Peu dans cartes E0 |
| Trajectoires régularité | Partiel | ms_return_run, km milestones | |
| Double comptage Garmin/manuel | Risque | truth services | À contractualiser F2 |
| Absence running = carte | Dispo | `disc_no_running` | Souvent score-basse sur 7j |

## Sommeil

| Capacité | Statut | Preuve | Commentaire |
| --- | --- | --- | --- |
| Nuit datée (ymd clé Garmin) | Dispo | `extractSleepNight` | Clé = jour métriques Garmin |
| Durée / stades / RHR / HRV | Dispo | même module | |
| Rythme / drift / weekend | Dispo | `sleepRhythmAnalysis` + kinds rhythm_* | |
| Association observationnelle charge | Dispo | sleep_* assoc / rest_assoc | **Non causal** — copy parfois borderline |
| Date explicite dans prose | Partiel | formatYmd / formatFrDate inconsistants | « nuit associée » sans date = défaut F4 |
| Couverture hors fenêtre | Partiel | extractSleepNightsInWindow + scope | Journey peut élargir 91j |
| Causalité sommeil→perf | Non démontrable | — | Interdit |

## Programme

| Capacité | Statut | Preuve | Commentaire |
| --- | --- | --- | --- |
| Follow rate / skips | Partiel | plan_follow / recurring_skip | Souvent methodology_limit |
| Révisions journal | Partiel | P3.4 | Souvent indisponible → note |
| Assiduité démontrable | Partiel | adherence discoveries | |

## Autres

| Source | Accès pipeline | Usage analyses |
| --- | --- | --- |
| Pas / steps | Oui (Garmin/manuel) | Dense analytics / cross-coach, rare E0 |
| Poids | Oui si snapshot | milestones poids conditionnels |
| Mensurations | Hors moteur E0 courant | Non |
| Nutrition | Cross-coach séparé | Pas kinds `disc_*` E0 |
| Feedback / ressenti | Associations RPE conditionnelles | Rare |
| Calories | `disc_kcal_profile` source-only | Non vu fixture |

---

## Exemples de référence A / B

### A — Pompes déclinées (−47 %, sets stables, cousins stables)

1. **Données nécessaires** : totals + sets par séance sur 5+ séances ; setCount stable ; reps/série ; totals cousins (pompes, dips) ; fenêtres datées.
2. **Les avons-nous ?** Totals **oui** ; sets **oui si** `exerciseSetLogs` trusted ; cousins **oui** (IDs séparés).
3. **Stockage** : `workoutData.reps`, `exerciseSetLogs`, names map.
4. **Accessibles moteur ?** Oui via resolve/readTrusted + baselines.
5. **Calculs existants** : `disc_exercise_progress`, `disc_vs_habit`, emergence, `interpretExerciseProgression` (pairwise).
6. **Manque** : producteur « régression isolée vs famille stable » + narration multi-blocs + conseil borné.
7. **Producteur candidat** : extension `exercise_progress` / nouveau kind **interdit en F1** → lot F3.
8. **Preuve pour publier** : ≥N séances, trusted sets ou abstention structure, cousins dans bande ±X %, pas de changement programme confondant.
9. **Formulations interdites** : « tes pectoraux régressent », « surentraînement », « tu dois… » sans borne de volume observé.
10. **Effort** : moyen (F3 raisonnement + F4 copy) — **pas** nouveau stockage.

**Distinction stricte** : aujourd’hui on publie surtout *volume réalisé / vs habit / creux-retour* ; rare *performance sets* ; jamais *adaptation physiologique*.

### B — Hyperextensions (format ↑ puis maintenu)

1. **Données** : set×reps séances successives ; première apparition ; total période vs période N-1.
2. **Dispo ?** Oui (emergence + set structure).
3. **Stockage** : idem muscu.
4. **Accessible ?** Oui — replay montre déjà « volume 3×20→3×20 », « s’installe », « format repris ».
5. **Calculs** : `disc_emergence` (+ ms_return_durable).
6. **Manque** : séparation nette *volume réalisé* vs *progression performance* ; conseil qualité d’exécution (non démontrable) ; totaux cohérents.
7. **Producteur** : emergence actuel ≈ 60–70 % de B.
8. **Preuve** : ≥2 séances au nouveau format ; gap d’historique documenté.
9. **Interdit** : « développe la capacité lombaire » (physio) ; totaux inventés.
10. **Effort** : faible–moyen (F3 narration + garde-fous preuve).
