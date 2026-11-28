# Matrice B001–B024 → édition v35 (`8ee0e181`)

Sources : blind-pack v31 (`mission36-baseline/blind-pack.json`) · export v35 `eight-periods.json`.  
Les données calendaires ont bougé (ex. pic 18→24 nov.) — **ne pas comparer les scores numériques comme si les entrées étaient identiques**.

| Blind | Titre historique | v35 | Rôle | Producteur / kind | Classification |
|---|---|---|---|---|---|
| B001 | Séance pas commencée | Même thèse today | priorité | `disc_pending_session` | 3 Amélioration / stabilité |
| B002 | Dernière séance pèse sur 7j | Même thèse today | priorité | `disc_th_concentration_now` | 3 |
| B003 | 3 familles (today) | Corps identique | priorité | `disc_session_family_structure` | 2 persistant (éditorial) → corrigé v36 |
| B004 | Hyperextension 4 séances | Présent | priorité | `disc_structural_memory` | 3 |
| B005 | Semaine récente en attente | Présent | priorité | `disc_pending_context` | 3 |
| B006 | Sommeil 7h30 / journées fortes | Même thèse | **réserve** | `disc_sleep_assoc` | 3 (déclassement éditorial utile) |
| B007 | 3 familles (7d) | Corps identique | priorité | `disc_session_family_structure` | 2 → partiellement traité (today/week conservés) |
| B008 | Socle commun variantes | Présent | priorité | `disc_session_family_variant` | 3 (mécanisme à préserver) |
| B009 | Pic 18 nov. / 41,7 % | Successeur méthodologique **24 nov.** | priorité | `disc_th_concentration_now` | 5 Non comparable (fenêtre) |
| B010 | Peu de journées / séances longues | Présent ; claim « longues » non rejoué ici | priorité | `disc_volume_shape` | 5 / limite preuve durée |
| B011 | Nuit architecture 18 nov. | Remplacé par « nuit plus courte… » | priorité | `disc_sleep_night` | 5 Non comparable |
| B012 | Titre concentration vs densité ↓ | **Absent** du catalogue 7d | — | — | 1 Corrigé / 6 absent |
| B013 | Concentration relative | Présent ; implication trop large en v35 | priorité | `disc_composed_relative_concentration` | 2 → **corrigé v36** |
| B014 | Reprise relevés « durable » | Plus « durable » sur relevés ; dips durable en 30d | réserve/prio selon sujet | `disc_ms_return_durable` / memory | 5 / 1 partiel |
| B015 | Hyperextension parallèles | Présent ; volumes égaux → convergent OK | priorité | `disc_composed_parallel_trajectories` | 3 ; wording proportionné v36 pour écarts proches |
| B016 | Élévations latérales hausse | Présent 30d | réserve | `disc_exercise_progress` | 5 (horizon déplacé) |
| B017 | Mollets s’efface | Présent | priorité | `disc_family_fade` | 3 |
| B018 | Volume 30d > précédent | Présent | réserve | `disc_volume_shape` | 3 ; décomp. prioritaire ailleurs |
| B019 | 3 familles (30d) | Corps identique **priorité #1** | priorité | `disc_session_family_structure` | 2 → **corrigé v36** (rappel / non priorité) |
| B020 | Volume surtout fréquence | Mécanisme présent ; données **contenu −588** | priorité | `disc_composed_volume_decomp` | 2 titre/driver → **corrigé v36** |
| B021 | Socle commun (30d) | Présent | priorité | `disc_session_family_variant` | 3 |
| B022 | Décomp. familles | Présent | priorité | `disc_program_family_volume_decomposition` | 3 **mécanisme à préserver** |
| B023 | Hors planning non prolongés | Présent | priorité | `disc_gtg_unplanned_role` | 3 |
| B024 | Pompes pseudo-planche parallèles | Présent (66 vs 72) | priorité | `disc_composed_parallel_trajectories` | 2 « convergent » → **corrigé v36** |

Raw matching : `artifacts/analysis-eval/mission37-baseline/b001-b024-map-raw.json`
