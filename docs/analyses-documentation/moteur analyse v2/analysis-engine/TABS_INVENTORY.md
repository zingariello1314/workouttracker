# Inventaire technique et métier — espaces hors programme principal

Préparation d’un chantier ultérieur. **Aucun développement d’intégration massive dans P6.**  
Sources principales : `enduranceData` (schéma `2.0.0`), `circuitDefinitions` / `circuitProgress`, GTG, pyramide, Garmin.

Clé commune workout : `reps` + `checkedExercises` sous la forme `{YYYY-MM-DD}_{exerciseId}`.

---

## 1. Pompes (espace Défis / Endurance)

| Point | Contenu |
|---|---|
| **Fonctionnalités** | Historique de séances pompes, défis (ponctuel / récurrent / période / cumul), trophées, sync vers le total workout, calendrier Endurance |
| **Saisies** | `date`, `time`, `count` (reps), `setCount`, `repsPerSet` (ou `sets`), `duration`, `notes`, ressentis (`congestion`, `motivation`, `sentimentAvant`/`Apres`) |
| **Calculées** | Objectif défi atteint, rythme hebdo, calories estimées, trophées, minutes de séance |
| **Stockage** | `snapshot.enduranceData.sessions.pushups[]` ; défis dans `enduranceData.challenges` (`activityType: 'pushups'`) ; miroir workout `…_complementary_endurance_pushups` |
| **Prévu / réalisé** | **Prévu** = prescription défi (ex. 100 reps / 15 min, N×/semaine). **Réalisé** = séances. La fréquence prescrite ≠ fréquence observée |
| **Identifiants** | Session `id` stable (`pushups-…`) ; défi `challenge.id` ; workout `complementary_endurance_pushups` |
| **Versions** | `enduranceData.schemaVersion` ; pas d’historique versionné des défis séance par séance (état courant + dates de complétion) |
| **Chevauchement `reps`** | Sync volontaire vers clé complémentaire ; anciennes entrées peuvent n’exister que comme coches reconstruites |
| **Intégration analyse** | Volume total, attribution poussée, densités (minutes défi), `challengeFormatTimeAnalysis`, stimulus `physiologicalUnknown` |
| **Double comptage** | Élevé si sync + session endurance lues sans `endurancePushupsAlreadyInWorkoutTotals` / exclusive ledger |
| **Déjà possible** | Temps à format constant, contribution poussée, régularité vs prescription, jours avec/sans défi |
| **Futur** | Congestion/motivation comme contexte (pas RPE auto) ; versions historiques de la prescription ; autres défis pompes |

---

## 2. Gainage

| Point | Contenu |
|---|---|
| **Fonctionnalités** | Séances de maintien, défis presets, trophées simples, calendrier |
| **Saisies** | `date`, `time`, `count` (secondes de planche), `duration` (min session), notes, ressentis |
| **Calculées** | Stats trophées (temps cumulé), calories estimées éventuelles |
| **Stockage** | `enduranceData.sessions.gainage[]` ; défis `activityType: 'gainage'` |
| **Prévu / réalisé** | Défi = objectif temps ; réalisé = secondes saisies |
| **Identifiants** | Session `id` ; pas de miroir `reps` standard (isométrie) |
| **Versions** | Schéma endurance global ; pas de journal de révision dédié |
| **Chevauchement `reps`** | Aucun (unité temps, pas répétitions) |
| **Intégration analyse** | Quasi nulle dans le moteur de conclusions P6 (hors minutes d’activité éventuelles) |
| **Double comptage** | Faible vs `reps` ; possible dans « temps total » si minutes gainage + autres |
| **Déjà possible** | Régularité, durée max, streaks (si historique non vide) |
| **Futur** | Trajectoire isométrique séparée des volumes de reps ; lien récupération |

---

## 3. Corde à sauter

| Point | Contenu |
|---|---|
| **Fonctionnalités** | Séances, défis presets, trophées, métriques optionnelles FC / cadence |
| **Saisies** | `date`, `time`, `duration`, `type`, `jumps`, `jumpsPerMin`, `hrMax`/`hrAvg`, effort, notes, ressentis étendus |
| **Calculées** | Trophées, calories, densités sauts/min |
| **Stockage** | `enduranceData.sessions.jumprope[]` |
| **Prévu / réalisé** | Défi vs séance réalisée |
| **Identifiants** | Session `id` ; pas d’id exercice programme |
| **Versions** | Schéma endurance |
| **Chevauchement `reps`** | Aucun (unité = sauts) |
| **Intégration analyse** | Calendrier / minutes d’activité ; pas de discoveries métier dédiées P6 |
| **Double comptage** | Faible ; Garmin jump_rope possible en parallèle |
| **Déjà possible** | Volume de sauts, régularité, densité |
| **Futur** | Appariement Garmin `jump_rope` ; charge cardio vs renforcement |

---

## 4. Grease the Groove (GTG)

| Point | Contenu |
|---|---|
| **Fonctionnalités** | Config exercices, créneaux, mini-sets, passages ad hoc, ressenti jour, sync vers `reps`, max déclarés, XP |
| **Saisies** | Config (`selectedIds`, horaires, doses) ; par jour : slots faits, ad hoc, feel ; max manuel |
| **Calculées** | Plan du jour, reps/set depuis max, streaks, résumé fenêtre, XP, ledger sync |
| **Stockage** | `enduranceData.gtg` (`config`, `days`, `workoutSync`) |
| **Prévu / réalisé** | **Prévu** = plan créneaux / doses. **Réalisé** = toggles + ad hoc. Rôle catchup / hors plan analysé |
| **Identifiants** | Ids GTG builtin (`pullups`, …) ou banque → mapping vers ids programme (`resolveExerciseIdentityLinks`) |
| **Versions** | Normalisation / migrations de jour ; pas d’historique de config versionné riche |
| **Chevauchement `reps`** | **Fort** : `workoutSync` écrit dans `reps` ; contrats P3.5 `classicExclusive` / `gtgSyncedReps` |
| **Intégration analyse** | Riche : `disc_gtg_unplanned_*`, P35 coexistence, KPI adaptatifs, calendrier jours GTG-only |
| **Double comptage** | Critique si on additionne GTG natif + sync sans exclusive |
| **Déjà possible** | Hors plan, coexistence, part mouvement, progression max, streaks |
| **Futur** | Versions de protocole ; lien causal prudent avec séances classiques |

---

## 5. Pyramide

| Point | Contenu |
|---|---|
| **Fonctionnalités** | Générateur de suggestions, application d’un `pyramidTemplate` au programme, journal de séances pyramide, stats |
| **Saisies** | Choix exercice, preset (asc/full/light), pic, rattachement programme / jour |
| **Calculées** | Séquences de séries, volume indicatif, suggestions depuis max observé + historique |
| **Stockage** | Template sur exercice programme (`pyramidTemplate`) ; `pyramidSessionLog[]` ; signaux via `reps` + `exerciseMaxRecords` |
| **Prévu / réalisé** | **Prévu** = template / plan du jour. **Réalisé** = coches séance + log pyramide (si utilisé) |
| **Identifiants** | `exerciseId` programme ; entrées de log datées |
| **Versions** | Template courant sur le programme ; pas d’archive complète des templates passés |
| **Chevauchement `reps`** | Le volume réalisé vit dans `reps` du programme, pas dans un silo endurance |
| **Intégration analyse** | Indirecte (format / séries dans trajectoires d’exercice) ; peu de cartes « pyramide » dédiées |
| **Double comptage** | Faible si on ne recompte pas le log + `reps` |
| **Déjà possible** | Détection de formats pyramidaux dans les séries saisies |
| **Futur** | Adhérence template vs exécuté ; évolution du pic |

---

## 6. Course

| Point | Contenu |
|---|---|
| **Fonctionnalités** | Saisie manuelle, import Garmin, classification course-like, stats, défis running, bandeau km/minutes |
| **Saisies** | `distance`, `duration`, `type`, dénivelé, effort, notes, ressentis ; ou activité Garmin |
| **Calculées** | km, allure, classification course vs marche, trophées, calories |
| **Stockage** | `enduranceData.sessions.running[]` (+ métadonnées Garmin / `logicalDate`) ; activités Garmin côté DB Garmin |
| **Prévu / réalisé** | Défis running éventuels ; sinon surtout du réalisé |
| **Identifiants** | Session `id` ; `garminActivityId` si import ; overrides de date |
| **Versions** | Schéma endurance ; historique = liste de séances (pas de versions d’une même séance) |
| **Chevauchement `reps`** | Aucun |
| **Intégration analyse** | Bandeau (`runningKm`, `runningMinutes`), discoveries course / gaps, exclusion des densités de reps |
| **Double comptage** | Garmin ↔ séance stockée (dédup / exclusion `shouldExcludeStoredGarminRunningSession`) |
| **Déjà possible** | Volume km, interruptions, contraste cardio vs musculation |
| **Futur** | Phases d’entraînement course ; allure zones ; lien sommeil plus fin |

---

## 7. Marche

| Point | Contenu |
|---|---|
| **Fonctionnalités** | Pas de sous-onglet « Marche » totalement séparé : classification walk-like dans `sessions.running`, stats Garmin marche, saisie manuelle de pas |
| **Saisies** | Session running typée marche / notes ; ou `enduranceData.manualDailyWalkByDate` (pas, distance) ; Garmin daily steps / activités walk |
| **Calculées** | `walkingKm`, `walkingSteps`, séparation course/marche |
| **Stockage** | Même bucket `sessions.running` (filtré) + `manualDailyWalkByDate` + Garmin `dailyMetrics` / activités |
| **Prévu / réalisé** | Réalisé dominant |
| **Identifiants** | Date jour ; ids Garmin activité |
| **Versions** | Non |
| **Chevauchement** | Pas / km vs séances running ; risque de double lecture pas Garmin + manuel |
| **Intégration analyse** | Pas / steps discoveries ; marche souvent hors volume de renforcement |
| **Double comptage** | Pas manuels + Garmin ; km marche vs course mal classés |
| **Déjà possible** | Volume de pas, jours actifs locomotion |
| **Futur** | Canal « marche » premier citoyen distinct de la course dans les claims |

---

## 8. Circuits

| Point | Contenu |
|---|---|
| **Fonctionnalités** | Définition de circuits (exercices, tours), assignation à un jour de programme, suivi de progression / tours, XP, trophées, calendrier |
| **Saisies** | Définition (`name`, items, muscles) ; progression jour (`roundsCompleted`, etc.) |
| **Calculées** | XP circuits, historique journalier, trophées |
| **Stockage** | `snapshot.circuitDefinitions` ; `snapshot.circuitProgress` (date → circuitId → état) — **hors** `enduranceData.sessions` |
| **Prévu / réalisé** | Circuit assigné au programme = prévu ; `circuitProgress` = réalisé |
| **Identifiants** | `circuitId` ; items peuvent référencer `exerciseId` / noms |
| **Versions** | Définition courante ; sync legacy programme possible ; pas d’historique riche des définitions |
| **Chevauchement `reps`** | Selon si les tours écrivent aussi dans `reps` / programme — à vérifier par flux d’exécution (risque réel si double écriture) |
| **Intégration analyse** | Faible dans P6 (XP / trophées) ; peu de claims circuits |
| **Double comptage** | Moyen à élevé si volume circuit + coches programme |
| **Déjà possible** | Régularité des jours circuit, tours vs cible |
| **Futur** | Contribution musculaire des circuits ; adhérence template |

---

## 9. Boxe

| Point | Contenu |
|---|---|
| **Fonctionnalités** | Séances durée, ressentis, calendrier, trophées simples éventuels |
| **Saisies** | `date`, `time`, `duration`, notes, ressentis |
| **Calculées** | Minutes, calories estimées |
| **Stockage** | `enduranceData.sessions.boxing[]` |
| **Prévu / réalisé** | Réalisé (défis possibles via presets génériques) |
| **Identifiants** | Session `id` |
| **Versions** | Schéma endurance |
| **Chevauchement `reps`** | Aucun |
| **Intégration analyse** | Minutes d’activité ; pas de discoveries boxe dédiées |
| **Double comptage** | Faible |
| **Déjà possible** | Fréquence, durée cumulée |
| **Futur** | Intensité / rounds si champs enrichis |

---

## 10. Natation

| Point | Contenu |
|---|---|
| **Fonctionnalités** | Séances avec tours, allure, FC, calories ; import Garmin swimming possible côté serveur |
| **Saisies** | `swimType`, `laps[]` (distance, time), `heartRate`, `calories`, `pace100m`, notes |
| **Calculées** | Distance totale, temps, allure, trophées |
| **Stockage** | `enduranceData.sessions.swimming[]` |
| **Prévu / réalisé** | Réalisé |
| **Identifiants** | Session `id` ; Garmin activity id si import |
| **Versions** | Schéma endurance |
| **Chevauchement `reps`** | Aucun |
| **Intégration analyse** | Minutes / calendrier ; faible dans conclusions musculation |
| **Double comptage** | Garmin natation ↔ séance locale |
| **Déjà possible** | Volume distance, régularité |
| **Futur** | Architecture par nage ; lien charge globale |

---

## 11. Autres activités éventuelles

| Espace | Notes |
|---|---|
| **Défis génériques** | `enduranceData.challenges` multi-`activityType` ; validation à la session |
| **Marche manuelle / pas** | `manualDailyWalkByDate` (voir §7) |
| **Sommeil manuel** | `manualSleepByDate` (hors Endurance strict, calendrier) |
| **Performance / max** | `exerciseMaxRecords`, `exerciseMaxHistory` — partagés GTG / pyramide / grades |
| **Garmin cardio générique** | Activités classées cardio (hors run/walk/swim/jumprope) — peu exploitées en discoveries P6 |

---

## Synthèse pour un chantier futur

1. **Déjà structurés et partiellement analysés** : pompes défi, GTG, course, (pas/marche via Garmin).  
2. **Données présentes, analyse mince** : gainage, corde, boxe, natation, circuits, pyramide.  
3. **Règle transversale** : ne jamais inférer une nature physiologique depuis le seul onglet / défi.  
4. **Priorité d’intégration** (si un jour) : (a) inventaire de couverture par compte, (b) contrats d’unités, (c) anti double-compte avec `reps`, (d) seulement ensuite des detections.

Document lié : résumé court dans `MISSION4_BILAN_P6.md` §F.
