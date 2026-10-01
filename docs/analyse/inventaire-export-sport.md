# Inventaire — export Sport (Paramètres)

Bouton **Export Complet Sport** (`exportAllData` dans `src/components/tabs/SettingsTab/hooks/useSettingsExport.js`).
Fichier produit : `momentum-sport-backup-YYYY-MM-DD.json`, `exportType: "Sport Complete"`, `version: "2.0"`.

Date de l’inventaire : 1er octobre 2026. Lecture du code, pas d’un fichier d’export réel.

## Comment le fichier est construit

Trois couches, à ne pas confondre.

| Couche | Où dans le JSON | Ce que ça contient vraiment |
|---|---|---|
| Brut | `data` | Copie de la ligne d’entraînement relue depuis IndexedDB, puis programmes écrasés par la fusion « dernière version ». Garmin, nutrition, livres et budget sont collés ensuite. |
| Journal lisible | `sportExport.dailyJournal` | Une fiche par jour : exercices, étirements cochés, sessions d’endurance. Schéma `2.0`. |
| Volume | `sportExport.dailyLiftVolume` | kg × reps par jour, uniquement les exercices cochés avec un volume > 0. |
| Compteurs | `metadata` | Totaux (nombre de clés, défis, kcal Garmin en résumé, etc.). Ce n’est pas la donnée. |

Source de la séance : `loadFromDB()`, pas l’état React affiché à l’écran.
`loadFromDB` passe par `materializeValidatedFromIdbRow` (liste blanche), puis réinjecte les jours du store `workoutSessions`.
Les programmes viennent d’un second store (`loadSportProgramContext`) fusionné avec le contexte **live** encore en mémoire (`resolveLatestProgramContext`).

Conséquence : une saisie encore dans le debounce d’une seconde (pas encore écrite) n’est pas dans le fichier, sauf les programmes, qui prennent la copie live si elle est plus récente.

Légende utilisée plus bas :

- **Brut** — présent dans `data` (donc dans le fichier, même si le journal ne le reformule pas).
- **Journal** — recopié dans `sportExport.dailyJournal`.
- **Volume** — dans `sportExport.dailyLiftVolume`.
- **Compte** — seulement un nombre dans `metadata` ou l’aperçu Paramètres.
- **Absent** — ni dans le brut, ni dans le journal.

---

## Programmes — dernière version

C’est le seul bloc où l’export ne se contente pas de relire la base.

1. Contexte IndexedDB (`programs`, `activeProgram`, `programHistory`, `weekVariant`, `isGymMode`).
2. Contexte live (les mêmes champs, tels qu’affichés dans l’onglet Programme).
3. Fusion par `id` : on garde l’objet dont `updatedAt` (sinon `createdAt`) est le plus tardif. À date égale, la copie live gagne.
4. Le programme actif est realigné sur cette liste fusionnée.
5. L’historique est concaténé ; un doublon est ignoré s’il a le même `id`, ou le même couple `startDate` + `endDate`.
6. `weekVariant` et `isGymMode` : la valeur live gagne dès qu’elle est définie, même si l’objet programme choisi est l’autre copie.

L’éditeur de programme (`commitProgram`) pose `updatedAt` à chaque enregistrement. Une modification passée par ce chemin est donc celle qui part dans l’export.

Ce que l’objet programme emporte (brut, objet entier, pas une fiche aplatie) :

- identité : `id`, `name`, `createdAt`, `updatedAt`, `uiEpoch`
- `schedule` par jour : exercices (`exercises` / `exercices`), variantes salle semaine A / B, étirements (`etirements` / `stretches`), `circuitIds`
- prescription normalisée sur les exercices (séries, reps, repos, tempo si le normaliseur les a écrits)
- repos : config de jour de repos, `weekAlternation` (`ab_enabled` / `none`)
- `programHistory` : périodes d’activation

Ce qui n’est pas une « dernière version » fiable :

- Un enregistrement qui oublie `updatedAt` et `createdAt` a un score 0. N’importe quelle copie datée gagne, même plus pauvre.
- `weekVariant` et `isGymMode` ne suivent pas la date du programme. On peut exporter le planning le plus récent avec le mode salle / la variante A-B de l’autre copie.
- Les tableaux d’historique de reps (`workoutTables` dans `useWorkoutHistory`) ne vivent qu’en `useState`. Ils ne sont jamais écrits. **Absent.**
- `historyReps` (clés `history_{tableId}_{exerciseId}`) est posé en mémoire par `updateHistoryReps`, mais il n’est ni dans la liste blanche de sauvegarde, ni dans les séances par jour. Après rechargement il a disparu. L’aperçu peut afficher « Historique répétitions » à partir de l’état écran ; le fichier, lui, relit la base. **Absent du fichier.**
- La banque statique `workoutProgram` n’est pas exportée. Elle sert seulement à retrouver un nom d’exercice si le programme ne le contient pas.

Le journal n’embarque pas le planning. Il s’en sert pour mettre un **nom** sur l’`exerciseId` du jour (y compris variantes A/B et étirements du schedule). La prescription (séries prévues, repos, tempo) reste uniquement dans `data.programs`.

---

## Trous qui précèdent le journal

Ces champs existent dans l’app et ne survivent pas au chemin `loadFromDB` utilisé par l’export.

| Donnée | Où elle vit | Dans le fichier |
|---|---|---|
| `historyReps` | Mémoire uniquement | Absent |
| Tableaux d’historique (`workoutTables`) | `useState` uniquement | Absent |
| `garminActivityDateOverrides` (date logique d’une activité Garmin) | Écrit sur l’agrégat par le service, ignoré par la sauvegarde et par la relecture | Absent. Une sauvegarde suivante l’efface aussi de la base. |
| `exerciseSessionPerceived` (difficulté / ressenti / plaisir, 1–5) | Sauvé dans l’agrégat **et** dans `workoutSessions` | Revenu par la fusion des séances, donc **brut + journal** si le jour a une ligne séance. Disparu si seule la ligne agrégat existait (la relecture la jette). |
| Jalons de grades sport et par exercice | `localStorage` | Absent |
| Cache XP sport | `localStorage` | Absent (recalculable si les sources brutes sont là) |
| Signatures d’insights / vues du récap (période, carte, body map) | `localStorage` | Absent (préférences d’affichage) |
| Images de page d’accueil | Store à part | Absent de cet export |

---

## Onglet par onglet

### Anatomie

Référence (maillage, zones). Aucune saisie utilisateur persistée, hors préférence de vue en `localStorage`.

| Donnée | Export |
|---|---|
| Modèle 3D, zones musculaires | Absent (pas une donnée user) |
| Dernière vue (face / dos) | Absent |

### Récap

Tout est calculé à l’affichage (volume, zones, grades, période). Rien n’est stocké comme récap.

| Donnée | Export |
|---|---|
| Volume, séries, répartition | Recalculable depuis le brut (reps, coches, poids) |
| Grades sport, paliers, XP du récap | Absent en tant que snapshot. Les jalons débloqués en localStorage sont absents. |
| Période affichée, vue active | Absent |

### Aujourd’hui

C’est le cœur du journal.

| Donnée | Brut | Journal | Volume |
|---|---|---|---|
| Coche exercice (`checkedExercises`, clé `YYYY-MM-DD_id`) | Oui | Oui (`checked`) | Seulement si coché et volume > 0 |
| Reps (`reps`, même clé) | Oui | Oui (`reps`) | Oui |
| Poids séance (`exerciseWeights`) | Oui | Oui (`weightKg`) | Oui |
| Haltère par bras (`exerciseWeightPerArm`) | Oui | Oui | Pris en compte dans le kg |
| Poids par série (`exerciseSetWeights`) | Oui | Oui (`setWeights`) | Selon le calcul de volume |
| Log de séries (`exerciseSetLogs` : reps / charge par série) | Oui | Non | Non (le volume utilise poids + reps, pas le log) |
| Exercice marqué « lesté » (`exerciseMarkedWeighted`) | Oui | Non | Non |
| Étoiles effort 1–5 (`exerciseSessionEffortStars`) | Oui | Oui | Non |
| Étoiles plaisir 1–5 (`exerciseSessionPleasureStars`) | Oui | Oui | Non |
| Triple ressenti (`exerciseSessionPerceived`) | Oui si la séance jour existe | Oui dans ce cas | Non |
| Variante de semaine sur la clé (`weekVariant` A/B) | Dans la clé | Oui | Non |
| Feedback de séance du jour (`sessionFeedbacks[date]`) | Oui | Oui | Non |
| Variation du jour (`dailyVariations[date]`) | Oui | Oui (objet brut collé) | Non |
| Justification de repos (`dayJustifications[date]` : raison, note, dates) | Oui | Oui | Non |
| Tours de circuit du jour (`circuitProgress[date]`) | Oui | Oui | Non |
| Activité complémentaire (coche `…_complementary_boxe`, etc.) | Oui, dans `reps` / `checkedExercises` | **Non** — le journal ignore toute clé `_complementary_` | Non |
| Minutes complémentaires (`…_complementary_natation_minutes`, boxe, corde) | Oui, dans `reps` | **Non** | Non |
| Nom d’exercice | Recalculé | Oui, depuis le programme le plus récent, sinon la banque | Oui |

Reps vides et exercice non coché : la clé peut rester dans le brut, le journal la saute.

### Saisie / historique de tableaux

Même maps que Aujourd’hui pour les reps du jour (donc exportées).
Les tableaux « clôturer un programme » et les reps d’historique ne le sont pas (voir Programmes).

### Programme

Voir la section dédiée. En plus, dans le brut d’entraînement (pas dans l’objet programme) :

| Donnée | Export |
|---|---|
| Liste `programs` + `activeProgram` + `programHistory` | Brut, version la plus récente |
| `weekVariant` global (A/B) | Brut (live prioritaire) |
| `isGymMode` | Brut (live prioritaire) |
| `startDate` du suivi | Brut |
| Définitions de circuits (`circuitDefinitions`, objet complet) | Brut. Le journal n’a que la progression du jour. |
| Version du schéma circuits | Brut |
| Swap du jour de repos (`restDaySwaps` : programme, semaine, from/to) | Brut seulement |
| Préférence « confirmer le swap repos » (`trainingPrefs`) | Brut seulement |
| Snapshots de mois calendrier (`calendarMonthPlanSnapshots`) | Brut seulement |

### Arrêt (tabac / THC)

Bloc `data.addictionQuitData`, brut entier. Pas dans le journal.

| Champ | Export |
|---|---|
| `tracks.cigarette.quitAtIso`, `tracks.thc.quitAtIso` | Brut |
| Sessions d’arrêt, rechutes (`sessions`, `relapses`) | Brut |
| Envies par jour (`cravingsByDay`) | Brut |
| Estimations (paquets/jour, prix, joints/semaine) | Brut |
| Phrase du jour (`reflectionByDay`), revue de semaine | Brut |
| Actions copilote, focus (routine / sommeil / humeur), privacy | Brut |
| Jauge « 20 ans » | Absente (calculée à l’affichage) |

### Nutrition

Collée dans `data.nutritionData` par un export séparé (IndexedDB nutrition), pas dans le journal sport.
Si la base nutrition n’est pas prête, l’objet part vide et l’export sport continue.

| Donnée | Export |
|---|---|
| Jours (`dailyMeals`) dont totaux du jour | Brut nutrition |
| Repas (`meals`) : aliments, quantités, et les kcal portées par chaque repas / aliment | Brut nutrition |
| Programmes nutrition (dont le programme actif) | Brut nutrition, tel que stocké — pas de fusion `updatedAt` comme le sport |
| Aliments favoris | Brut nutrition |
| Gamification nutrition (succès, XP, séries) | Brut nutrition |
| Hydratation (`hydrationLogs`) | Brut nutrition |
| Photos de progression nutrition | Brut nutrition |
| Modèles ML nutrition | Brut nutrition |
| Config d’export | Brut nutrition |
| Kcal « sport » estimées côté calendrier (moyenne street workout) | Absentes : calcul d’affichage, pas une valeur stockée |

### Exercices (banque / fiches)

Notes de fiche, pas la séance du jour.

| Donnée | Export |
|---|---|
| Notes 1–10 par critère (`exercisePerceivedRatings`, par id d’exercice) | Brut seulement |
| Notes libres (`exercisePersonalNotes`) | Brut seulement |
| Coefficients d’intensité (`exerciseIntensityCoeffs`) | Brut seulement. Ils servent au volume / XP, le journal ne les recopie pas. |
| Notes d’étirement 1–10 (`stretchPerceivedRatings`, par `stretchKey`) | Brut seulement |
| Notes libres d’étirement (`stretchPersonalNotes`) | Brut seulement |
| Étoiles du jour sur un étirement coché (`stretchSessionEffortStars`) | Brut + journal |
| Coche étirement item (`YYYY-MM-DD_stretch_{moment}_{id}`) | Brut + journal (moment, id, nom, coche, étoiles) |
| Coche étirement ancien format (moment seul) | Brut + journal, sans nom |
| Banque d’exercices / d’étirements (textes, GIF) | Absente (référence de l’app) |

### Suivi corporel (dans le même bouton)

| Donnée | Export |
|---|---|
| Photos (`progressPhotos` : image, date, poids, notes, mensurations) | Brut |
| Entrées (`progressEntries`, par type) | Brut |
| Rappels | Brut |
| Préférences de pesée (`bodyTrackingPrefs`) | Brut |
| `bodyTrackingLastUpdated` | Brut + metadata |

### Endurance

`data.enduranceData` est copié en entier (sessions, défis, GTG, sync). Le journal ne déplie qu’une partie.

Activités : boxe, pompes, gainage, natation, corde, course.

| Activité | Champs saisis | Brut | Journal |
|---|---|---|---|
| Pompes | date, heure, séries, reps/série, total, durée, notes, congestion, motivation, sentiment avant/après | Oui | Oui (objet session entier, donc heure, durée, reps) |
| Boxe | date, heure, durée, notes, mêmes notes subjectives | Oui | Oui |
| Gainage | date, heure, count, durée, notes, notes subjectives | Oui | Oui dans le journal. **Le compteur d’aperçu et `enduranceSummary` ne comptent pas le gainage.** |
| Natation | type de nage, longueurs (`laps` : distance, temps), allure/100 m, FC, **kcal**, notes, notes subjectives | Oui | Oui |
| Corde | durée, type (continue / intervalles / double unders), sauts, n° de session, FC max/moy, meilleure série, sauts/min, **kcal**, effort, respiration, régularité, fatigue, fluidité, transpiration, notes | Oui | Oui |
| Course | distance, durée, type, dénivelé, effort, respiration, régularité, fatigue, notes | Oui | Oui |

| Autre bloc endurance | Brut | Journal |
|---|---|---|
| Défis (`challenges`) : nom, type ponctuel/récurrent, activité, dates, fréquence, jours, moment, heure, objectifs (reps, séries, durée, distance, sauts, total), statut, notes | Oui | **Non.** Seulement le nombre dans `metadata.enduranceChallenges`. |
| GTG : exercices choisis, catalogue custom, max déclarés, protocole, réglages par exo | Oui (`enduranceData.gtg.config`) | Non |
| GTG jours (`gtg.days` : séries / reps du jour) | Oui | **Non.** Le jour est créé vide dans le journal, le détail reste dans le brut. |
| Sync GTG → reps du programme (`gtg.workoutSync`) | Oui | Non (les reps résultantes, elles, sont dans `reps`) |
| Sync endurance → reps (`repWorkoutSync`) | Oui | Non (même remarque) |
| Marche du jour (`manualDailyWalkByDate`) | Oui si présent dans `enduranceData` | Non |
| `schemaVersion`, `lastUpdated` | Oui | Compte metadata |
| Fractionné / trophées course | Calculés à l’affichage à partir des sessions et de Garmin | Pas de copie dédiée. Les champs posés sur la session partent avec elle. |

### Calendrier

Pas de store propre. Il lit les maps du jour, l’endurance, Garmin, les snapshots.

| Donnée | Export |
|---|---|
| Ce qui colore un jour (coches, reps, endurance, GTG) | Via les blocs ci-dessus |
| Snapshot « repos planifié » du mois | Brut `calendarMonthPlanSnapshots` |
| Date logique Garmin corrigée à la main | **Absent** (`garminActivityDateOverrides`) |
| Kcal street workout affichées sur le calendrier | Absentes (calcul) |

### Graphiques

100 % dérivés (répartition musculaire, distance natation, activité). Aucune série n’est stockée pour l’export. Les minutes complémentaires existent dans le brut et sont ignorées par le journal, alors que plusieurs graphiques les lisent.

### Défis performances

| Donnée | Brut | Journal |
|---|---|---|
| Record courant (`exerciseMaxRecords` : exo, charge, reps, date, discipline) | Oui | Non |
| Historique des perfs (`exerciseMaxHistory`) | Oui | Non |
| Retests planifiés (`performanceRetestPlans`) | Oui | Non |
| Séances pyramide cochées (`pyramidSessionLog`) | Oui | Non |
| Défis d’endurance | Voir Endurance | Non |

L’aperçu ne fait que compter ces quatre listes.

### Analyses sport

Vues calculées (prédictions, équilibre, historique d’insights). Le store de nouveauté d’insights (`localStorage`) n’est pas exporté. Les entrées sous-jacentes le sont via Aujourd’hui, Endurance et Garmin.

### Garmin

`exportGarminData` → `data.garminData` (activités + métriques quotidiennes + historique de plages forcées + télémétrie + maintenance + graphiques dérivés).
`sportExport.garminDailyIndex` est un **résumé** par jour, pas une seconde copie complète.

| Donnée | Brut Garmin | Index du jour |
|---|---|---|
| Activités natation, corde, cardio (type, date, durée, distance, kcal, FC moy/max/min, sueur, minutes d’intensité, dénivelé) | Oui, objet complet | Résumé. Les tours de course : nombre de laps, pas le détail de chaque tour. |
| Autres types d’activités s’ils ne sont pas dans `swimming` / `jumpRope` / `cardio` | Oui s’ils sont dans `activities` | L’index ne les range que si la clé de bucket existe. Un type inconnu est compté nul dans l’index. |
| Métriques du jour : pas, distance, étages, **kcal** (total / actives / repos), FC repos / moy / max, body battery, stress, respiration, sommeil (durée, qualité, profond, REM), SpO2, minutes d’intensité | Oui | Résumé (sous-champs listés ci-contre, pas toutes les courbes) |
| Séries temporelles (courbes intra-jour) | Selon la base. Une purge automatique retire ce qui a plus de 90 jours **avant** l’export. | Non |
| Graphiques dérivés | Seulement les **30 derniers jours** de métriques | — |
| Télémétrie UI, diagnostics, historique d’auto-sync, résumés de purge | Oui (bruit technique, pas la séance) | Non |
| Date de dernière sync | `localStorage`, pas dans cet objet | Absent |
| Réglages de source Garmin (clés) | `localStorage` | Absent |

Les kcal Garmin du jour sont donc dans `data.garminData.dailyMetrics[date].calories`, et en résumé dans l’index. Les kcal d’une activité sont dans l’activité, et en résumé (`calories`).

### Profil (embarqué par l’export sport)

`data.userProfileSnapshot` : id, pseudo, email, avatar, questionnaire.
`data.profileQuestionnaire` : réponses, tours, compteurs. Fusion à l’import, pas un calcul de « dernière réponse » champ par champ au-delà du merge d’objets.

---

## Reps, temps, kcal, défis — lecture rapide

| Mesure | Où c’est saisi | Dans le fichier |
|---|---|---|
| Reps d’un exercice du programme | Aujourd’hui | Brut + journal |
| Reps par série (log) | Aujourd’hui | Brut seulement |
| Reps pompes / gainage (session endurance) | Endurance | Brut + journal (champs de la session) |
| Reps GTG du jour | Endurance → GTG | Brut `gtg.days` seulement |
| Reps d’un record / pyramide | Défis performances | Brut des listes, pas le journal |
| Reps d’un tableau d’historique | Historique | Absent |
| Heure de séance endurance | Endurance | Brut + journal |
| Durée (boxe, pompes, gainage, corde, course) | Endurance | Brut + journal |
| Temps de longueur (natation) | Endurance | Brut + journal (`laps`) |
| Minutes d’une activité complémentaire (natation / boxe / corde saisies dans Aujourd’hui) | Aujourd’hui | Brut (`reps` sur la clé `_minutes`), **pas le journal** |
| Durée Garmin | Garmin | Brut activité + résumé d’index |
| Sommeil (durée, profond, REM) | Garmin | Brut + résumé d’index |
| Kcal natation / corde saisies à la main | Endurance | Brut + journal |
| Kcal activité Garmin | Garmin | Brut + résumé |
| Kcal du jour Garmin (totales, actives, repos) | Garmin | Brut + résumé |
| Kcal des repas | Nutrition | `data.nutritionData` (repas / journées), pas le journal sport |
| Kcal estimées « street workout » | Calcul calendrier | Absentes |
| Défi endurance (objectif, rythme, statut, validation) | Endurance | Brut `challenges` seulement |
| Record, historique de record, retest, pyramide | Défis performances | Brut seulement |
| Poids, poids par série, par bras, volume kg×reps | Aujourd’hui | Brut + journal ; volume en plus dans `dailyLiftVolume` |
| Étoiles effort / plaisir, ressenti triple | Aujourd’hui | Brut + journal (ressenti triple : seulement si la séance jour a été relue) |
| Étirements cochés + étoiles du jour | Aujourd’hui | Brut + journal |
| Notes de fiche exo / étirement | Exercices | Brut seulement |

---

## Ce que le bouton embarque en plus du sport

Le même JSON contient aussi :

- `data.booksData` (livres + sessions de lecture)
- `data.budgetData` (catégories, dépenses, charges)
- pas QuietQuest ni Apprentissage (boutons d’export séparés)

Ce ne sont pas des données des sous-onglets Sport, mais elles partent avec « Export Complet Sport ».

---

## Écarts les plus utiles à corriger

1. **Complémentaires** (coche + minutes) : dans le brut, absents du journal. Les graphiques et le calendrier s’en servent.
2. **Défis, GTG (détail du jour), records, pyramide, logs de séries** : brut oui, journal non. Un humain qui lit `dailyJournal` croit que la journée est complète.
3. **Gainage** : dans les données, invisible dans les compteurs d’aperçu.
4. **`historyReps` et tableaux d’historique** : affichés comme exportables dans l’aperçu, jamais persistés.
5. **Dates Garmin corrigées** (`garminActivityDateOverrides`) : perdues à la sauvegarde et donc à l’export.
6. **Programmes** : la bonne version part si `updatedAt` est posé. `weekVariant` / `isGymMode` ne suivent pas cette date. La prescription (séries, repos, tempo, étirements du planning, circuits) n’est pas redépliée dans le journal.
7. **Grades, XP, jalons, insights** : recalculables en partie, les déblocages locaux ne partent pas.
8. **Kcal** : trois silos (endurance saisie, Garmin, nutrition). Aucun total du jour dans le journal sport.
