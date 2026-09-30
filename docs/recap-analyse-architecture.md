# Récap → Analyse : architecture des trois colonnes

Référentiel du moteur qui remplit **Ce que tu as fait**, **Ce que ça change** et **Ce qui a évolué**.

Le journal des correctifs passés est dans `docs/recap-analyse-moteur.md`. Ce fichier décrit le fonctionnement actuel : quelles données existent, comment une carte naît, ce que le système a le droit d’utiliser, et comment il choisit.

Interface : `src/components/sport/recap/views/RecapAnalyseView.jsx`.
Entrée du calcul : `src/hooks/useRecapTabMetrics.js` → `buildAdaptiveRecapInsights`.
Libellés : `src/utils/translations.js` (`recap.assessment.horizonShort` / `horizonMedium` / `horizonLong`).

Le bandeau violet « Récap sur la période » (`RecapPeriodHighlightsPanel`) n’est pas ces trois colonnes. Il affiche des totaux calendrier (reps, km, kcal, streak, meilleurs mois) et reste replié tant qu’on ne l’ouvre pas.

---

## 1. La règle qui organise tout

La plage choisie dans le récap (Aujourd’hui, 7 jours, 30 jours, 3 mois, 6 mois, 1 an, 2 ans, Toujours) dit **quelles données sont assez denses pour être citées**.

Elle ne dit pas dans quelle colonne une lecture tombe. Chaque analyse a une **nature fixe**, projetée en colonne :

| Nature | Horizon | Colonne |
| --- | --- | --- |
| `now` | `short` | Ce que tu as fait |
| `trajectory` | `medium` | Ce que ça change |
| `journey` | `long` | Ce qui a évolué |

Défini dans `src/utils/sport/recapInsightNature.js` (`KIND_NATURE`, `NATURE_TO_HORIZON`). Un kind absent de la table tombe en `trajectory` par défaut.

La voix de la plage (`periodVoice`) ne change que le vocabulaire (« cette séance », « cette semaine », « ces 30 jours », « cette année », « l’ensemble du suivi ») et l’ordre de priorité des cartes. Une fenêtre sans date de début (Toujours) est reconstituée : 3650 jours, ou 730 / 365 / 183 / 92 / 30 selon la période.

Chaque plage a une question (`PERIOD_QUESTIONS`) :

| Plage | Question |
| --- | --- |
| Aujourd’hui | Qu’est-ce qui caractérise précisément cette séance par rapport à l’habitude ? |
| 7 jours | Qu’est-ce qui s’est réellement passé cette semaine, et comment se compare-t-elle au rythme habituel ? |
| 30 jours | Comment l’entraînement récent évolue-t-il par rapport aux mois précédents ? |
| 3 mois | Quelle trajectoire est réellement en train de se construire ? |
| 6 mois / 1 an / 2 ans | Quelle trajectoire s’est construite sur cette durée ? |
| Toujours | Quelle trajectoire s’est construite depuis les premières saisies ? |

---

## 2. Où le calcul démarre

`useRecapTabMetrics.runFor` calcule d’abord l’assessment brut (`computeRecapUserAssessment`) et l’enrichissement, puis appelle `buildAdaptiveRecapInsights`. Le résultat **remplace** `assessment.insights`. Les trois colonnes lisent uniquement :

- `insights.shortTerm`
- `insights.mediumTerm`
- `insights.longTerm`

Chaque item affiché est une carte `{ title, body, evidence, confidence, rewardTone }` ou, à défaut, un texte brut.

Garde-fou d’affichage : si la même période republie un paquet dont la richesse et la longueur tombent sous 72 % de la version déjà montrée (et que cette version dépassait un score de 80), on garde la version riche. Ça empêche un second passage (Garmin qui arrive) d’effacer les cartes longues.

Cache de session : la clé inclut la période, la fenêtre, les programmes, le questionnaire, le volume coché, l’endurance, Garmin (pas, sommeil) et la nutrition. Préfixe `span4`. Tant que Garmin ou la nutrition chargent, un bundle déjà calculé sur le même entraînement s’affiche sans recalcul. Sans cache et sans sources prêtes, le calcul attend : il ne publie pas une passe partielle.

---

## 3. Les ressources à disposition

Le moteur ne va pas chercher des données ailleurs que dans ces objets. S’il manque un champ, la carte correspondante n’est pas écrite. « Pas assez de données » n’est pas un texte affiché.

### 3.1 Snapshot d’entraînement

Objet courant du `WorkoutContext` (`getCurrentData()`).

| Champ | Usage |
| --- | --- |
| `checkedExercises` | Une clé date::exercice cochée compte comme du travail fait |
| `reps` | Répétitions de cette clé. Seules les clés cochées entrent dans les totaux |
| `enduranceData.sessions.pushups` | Pompes d’endurance, ajoutées si elles ne sont pas déjà dans les totaux workout |
| `enduranceData.sessions.running` | Sorties course stockées dans Momentum |
| `enduranceData.gtg` | Grease the groove : jours et reps sur la fenêtre |
| `sessionFeedbacks` | Ressenti de séance : énergie début/fin, difficulté. Alimente le coût |
| `progressEntries` | Poids (type `metrics`) pour les jalons de poids |
| `trainingPrefs.journeyStartYmd` | Début de parcours, sinon dérivé de la première saisie |

Un jour compte comme jour d’entraînement s’il a des reps enregistrées, un workout coché, une séance d’endurance Momentum, une progression de circuit, ou une activité Garmin (`recapTrainingDayTruth.js`).

### 3.2 Garmin

Fusionné par `mergeGarminDataForRecap` (données complètes + partiel + métriques journalières).

`dailyMetrics[yyyy-mm-dd]` :

| Champ lu | Rôle |
| --- | --- |
| `sleep` ou `sleepData` | Nuit. Durée &lt; 24 est lue en heures, sinon en minutes. Sous 90 minutes, la nuit est ignorée |
| durée, profond, léger, REM, éveil | Architecture du sommeil |
| efficacité / qualité / score (0–100) | Sépare le volume à durée comparable |
| `restingHeartRate`, `heartRate.resting` | FC repos, aussi recopiée sur la séance du jour |
| HRV | Présente sur la nuit, peu citée dans les textes actuels |
| body battery (valeur, début, fin, chargé) | Résumé des nuits récentes |
| kcal actives, pas | Charge calendrier et totaux de fenêtre |
| `activities.cardio` | Course : km, minutes, allure, jours de course pour le lien sommeil → cardio |

Une nuit est la nuit qui **se termine le matin** de la date. Elle est appariée à la séance du même jour. La nuit J-2 est la nuit de la veille (`nightJ2`), pour l’effet décalé.

`extractSleepNight` renvoie : `hours`, `totalMin`, `deepMin`, `lightMin`, `remMin`, `awakeMin`, `efficiency`, `bedTime`, `wakeTime`, `sleepHr`, `rhr`, `hrv`, `bodyBattery*`, `quality`. Les jours sans sommeil sont omis. Il n’y a pas de placeholder « sommeil insuffisant ».

### 3.3 Questionnaire et programme

`normalizeProfileQuestionnaire`. Champs réellement lus par les colonnes :

- objectif physique (`goalPhysique`) ou objectif street (`streetSkillGoal`) : street, hypertrophie / définition, force sèche. Ça module les conséquences (une absence de course pèse moins pour un objectif street ; un déséquilibre poussée pèse plus pour l’hypertrophie) ;
- séances attendues par semaine : dénominateur du score de régularité de l’assessment ;
- estimation de gras : affichée dans le panneau d’assessment, pas dans les trois colonnes.

Programme actif et liste des programmes : jours planifiés, complétion, exercices peu cochés, alignement séance / plan. Sert aux essais « programme » et au phénomène `low_adherence`. Si les découvertes couvrent déjà la colonne « maintenant », cet essai ne s’écrit pas.

### 3.4 Ce que l’assessment calcule avant les colonnes

`computeRecapUserAssessment` (`recapUserAssessment.js`) produit le contexte chiffré, pas les cartes :

- tenure, fenêtre, volume kg×reps, reps totales, reps moyennes par jour de force ;
- jours actifs, régularité (jours actifs / séances attendues sur la durée) ;
- complétion programme, alignement de charge de séance (0–100), difficulté moyenne ;
- niveau 0–100 et palier ;
- pistes legacy `shortTerm` / `mediumTerm` / `longTerm` issues de `buildRecapPistes`.

Ces pistes legacy sont converties en candidats de poids 44 (`legacyToCandidates`). Elles perdent face aux lectures riches. Elles ne remplissent les colonnes que s’il n’y a presque rien d’autre. Sur les longues plages, un texte qui contient « cette semaine » est pénalisé de 55.

---

## 4. Les objets dérivés

Avant d’écrire une phrase, le pipeline construit des objets. Une analyse ne lit jamais le snapshot brut si l’objet dérivé existe.

### 4.1 Mesure d’une fenêtre — `measureRecapWindow`

Pour une fenêtre `{ start, end }` :

| Champ | Sens |
| --- | --- |
| `totalReps` | Reps du calendrier si le bandeau en a, sinon somme des reps cochées |
| `strengthReps` | Somme stricte des reps cochées + pompes endurance non déjà comptées |
| `trainingDays` / `strengthDays` | Jours d’activité / jours avec reps |
| `minutes`, `totalMinutes` | Durée hors course, durée totale |
| `activeKcal`, `runningKm`, `runningMinutes` | Charge Garmin / course |
| `repsPerHour`, `repsPerSession`, `minutesPerSession` | Densité et taille de séance |
| `exercises[]` | `{ id, name, reps, days }` trié par reps |
| `muscles`, `byMuscle`, `pushReps`, `pullReps`, `chestTricepsReps`, `upperReps`, `lowerReps` | Répartition. Poussée = pecs + épaules + triceps. Tirage = dos + biceps |
| `peakDay` | Jour le plus chargé : date, reps, part du total, exercices |
| `repsByDate`, `exercisesByDate` | Détail jour |
| `firstSeen`, `lastSeenBefore` | Première date d’un exercice, dernière date avant la fenêtre |

`buildPeriodComparisons` mesure **six** fenêtres ancrées sur la fin de la plage affichée, quelle que soit cette plage :

| Clé | Fenêtre |
| --- | --- |
| `period` | La plage affichée |
| `d7` | 7 jours finissant ce jour |
| `d30` | 30 jours |
| `d90` | 92 jours |
| `prev30` | Les 30 jours juste avant |
| `first30` | Les 30 premiers jours du trimestre qui finit aujourd’hui |

Plus `identity` (habitude de l’athlète) et `voice`.

### 4.2 Features d’entraînement — `buildRecapTrainingFeatures`

Comparaisons glissantes, indépendantes de la plage affichée :

- reps et jours : 7 / 28 / 90 jours, chacun contre la fenêtre précédente de même longueur ;
- `delta7Pct`, `delta28Pct`, `delta90Pct` ;
- séances/semaine sur 28 j et sur les 28 j d’avant ;
- adhérence : % programme, alignement séance, jours justifiés, exercice le moins coché ;
- nombre d’exercices en baisse récente.

Un delta n’est « plausible » dans l’état d’entraînement que si sa valeur absolue est ≤ 160 (≤ 90 pour la moitié de période). Au-delà, il est ignoré : un pourcentage explosif sur une petite base ne pilote pas la charge.

### 4.3 État d’entraînement — `buildUserTrainingState`

Cinq axes, chacun `{ value, trend, confidence, evidence[], metrics }` :

| Axe | Sources | Valeurs typiques |
| --- | --- | --- |
| Charge | delta 28 j, sinon 7 j, sinon moitié de période, sinon ratio aigu/chronique | `high_rising`, `rising`, `stable`, `falling` |
| Adhérence | complétion programme, sinon régularité, plus alignement si ≥ 3 jours scorés | `high` ≥ 75 % ou 65 %, `medium`, `low` |
| Performance | insights de progression par exercice + vélocité de reps/semaine | souvent `indeterminate` : une baisse de reps n’est pas une perte de capacité |
| Récupération | sommeil Garmin moyen (≥ 7 h suffisant, ≥ 6,2 h incertain), sinon sommeil ressenti, tendance 1re/2e moitié, stress ≥ 48 sur ≥ 4 jours | `sufficient`, `uncertain`, `insufficient` |
| Fatigue | difficulté ressentie (≥ 7,5 haute, ≥ 5,5 modérée) si ≥ 2 saisies, tendance récente si ≥ 3 | `high`, `moderate`, `low` |

Dérivés : `programResponse`, `lifePhase`, `adaptationCost` (`low` / `moderate` / `high` selon perf / volume), `progressionEfficiency`, vélocité et accélération.

L’état de la fenêtre précédente (`priorWindowForComparison`) est calculé à part, pour les transitions d’état. Ces transitions nourrissent les relations, pas directement le titre d’une carte.

### 4.4 Identité et parcours

`buildAthleteTrainingIdentity` : fréquence habituelle (moyenne, bande de variabilité, statut `inside` / `low` / au-dessus), qualités habituelles et leurs écarts. Sert à dire « tu es dans ta variabilité » plutôt que « tu as baissé par rapport au mois d’avant ».

`buildAthleteJourney` parcourt tout l’historique de reps jusqu’à la fin de fenêtre. Pour chaque exercice assez présent, `describeExercise` calcule :

- première référence fiable, niveau habituel (médiane), record, âge du record ;
- jalons internes du mouvement, plateau, intervalle médian entre séances, jours depuis la dernière fois.

`pickNarratives` en tire au plus :

- 3 progressions (`meaningfulProgress`) ;
- 1 record très au-dessus de l’habitude (`prVsLevel`) — c’est la carte « ton record de N reps reste éloigné » ;
- 1 histoire de jalons (≥ 3 paliers) ;
- 1 plateau ;
- jusqu’à 2 abandons (silence ≥ 21 jours, ≥ 5 séances, intervalle habituel ≤ 16 jours).

### 4.5 Baseline d’un exercice — `buildExerciseBaseline`

Minimum 3 séances avec reps &gt; 0. Produit : nombre de séances, dernière perf, moyenne, médiane, p25, p75, record et date, pire, moyenne des 5 premières (`historicalMean`), moyenne récente (`currentMean`), écart au habituel, écart à l’initial, variabilité, `established` (≥ 5 séances avant la dernière), `consolidated` (au moins 3 des 4–5 dernières au niveau de la médiane), `aboveOldMean`.

C’est la ressource de « Pompes inclinées a progressé de 31,7 % » : niveau initial = moyenne des 5 premières, niveau actuel = moyennes récentes hors dernière saisie, consolidé si 4 des 5 dernières dépassent l’ancien niveau.

### 4.6 Catalogue de séances — `buildSessionCatalog`

Une ligne par jour avec des reps, sur toute la vie jusqu’à la fin de fenêtre :

`date`, `totalReps`, `exercises[{id,name,reps}]`, `exerciseIds`, `muscles`, `minutes` (hors course), `night`, `nightJ2`, `sleepHours`, `hoursJ2`, `rhr`, `prevDayReps`.

Sert aux séances comparables (`findComparableSessions`, score minimum 0,32, 5 paires), au sommeil apparié, aux absences, aux jalons.

### 4.7 Phénomènes — `buildTrainingPhenomena`

Pas de texte. Une cause, un objet, qui peut **empêcher** un essai redondant.

| Type | Déclencheur | Supprime |
| --- | --- | --- |
| `contraction` ou `contraction_with_rebound` | Fréquence ≤ −12 % ou exposition 28 j ≤ −12 %. Rebond si les 7 j sont ≥ +5 %. Encore en baisse si les 7 j sont ≤ −8 % | `volume_traj`, `capacity_vs_exposure`, et `recent_vs_identity` si le rythme reste dans l’habitude |
| `specialization_push` | Part poussée ≥ 60 % (≥ 70 % plus fort). Prioritaire si objectif street | `specialization` |
| `low_adherence` | Complétion programme &lt; 55 % | — |
| `quality_absent` | Course absente ≥ 14 jours ou ≥ 8 autres séances depuis | — |
| `observed_output_indeterminate` | Momentum de reps ≤ −12 % **et** exposition ou fréquence en baisse. La perf n’est pas déclarée en chute : les preuves ne sont pas comparables | — |

### 4.8 Candidats sommeil — `publishSleepCandidates`

Nécessite au moins **8** séances appariées à une nuit. Chaque test publie seulement s’il passe `publishable` : au moins 4 séances de chaque côté (parfois 3), écart ≥ 12 % et ≥ 35 reps. Sinon le candidat est `null` et aucune carte n’existe.

| Fonction | Ce qu’elle compare |
| --- | --- |
| `sleepVolumeByThreshold` | Volume après nuit ≥ 7 h 30, et une variante ≥ 8 h, plus les 14 dernières séances |
| `sleepDurationZones` | Trois zones : ≥ 8 h, 7 h 30–8 h, &lt; 7 h 30 |
| `sleepHighLowSeparation` | Séances ≥ 300 reps vs séances &lt; 250, coupées à 7 h 30 |
| `sleepArchitectureByVolume` | Profond / léger / REM selon le volume |
| `sleepDelayedDeficit` | Déficit sur les nuits d’avant, pas seulement la nuit de la veille |
| `sleepEfficiencyControlled` | Même durée (± 0,75 h), efficacité ≥ 90 % vs en dessous |
| `sleepFamilySensitivity` | Poussée vs tirage après nuit &lt; 7 h, contre nuits ≥ 7 h 30 |
| `sleepLagJ2` | Effet de la nuit d’avant-hier |
| `sleepTripleCondition` | ≥ 7 h 45 et efficacité ≥ 90 % et pas de déficit J-2 sous 7 h 30 |
| `sleepPrevLoadInteraction` | Nuit courte après une veille lourde (≥ 280 reps) ou légère (&lt; 80) |
| `sleepIntensityByDensity` | Densité de séance selon la nuit |
| `sleepPerformanceLead` | Le mouvement le plus chargé bouge-t-il autant que le volume |
| `sleepPerceivedEffort` | Difficulté déclarée selon la nuit |
| `sleepCardioByThreshold` | Km / minutes de course après nuit longue vs courte |
| `sleepWindowConcentration` | Part des nuits ≥ 7 h 30 dans la fenêtre (fait de fenêtre, pas candidat global) |
| `sleepDeepStability` | Le profond bouge peu alors que la durée totale bouge |
| `sleepWeekFrequency` | Semaines avec ≥ 4 nuits longues vs ≤ 2 |
| `sleepHighDayShare` | Part des journées ≥ 300 reps précédées d’une nuit ≥ 7 h 30 |

Le texte dit toujours une association. Il ne dit pas que le sommeil cause le volume.

---

## 5. Comment une analyse naît

```
snapshot + garmin + questionnaire + programme + fenêtre
        │
        ├─ assessment + enrichment + features + identity + journey + phénomènes
        │
        ├─ découvertes (detectDiscoveries + jalons)
        │     sélection par nature, priorité de plage, rivales, mémoire
        │
        ├─ essais (buildHorizonEssayCandidates)
        │     recopient les découvertes retenues
        │     ajoutent une lecture générique seulement si la colonne now est vide
        │
        ├─ catalogue de plage (selectAnalysisCatalog) — autre rédacteur, mêmes colonnes
        │
        └─ selectBalancedCandidates
              poids, nouveauté, famille, plafond
              → shortTerm / mediumTerm / longTerm
```

Fichier d’orchestration : `recapInterpretationPipeline.js`. Commentaire d’intention du fichier : une métrique seule n’est pas une analyse. Une analyse est une lecture de plusieurs signaux. Une phrase qui sortirait d’un seul chiffre est un fait, sauf événement assez net (record, reprise).

### 5.1 Une découverte

`discovery()` dans `recapPeriodDiscoveries.js` fabrique l’objet :

```
score = importance × fiabilité × nouveauté × adéquation × 100
relevance = min(0,995 ; 0,88 + score / 900)
```

Champs : `kind`, `nature`, `family`, `title`, `body`, `evidence`, `metrics`.

`detectDiscoveries` empile toutes les découvertes dont les seuils passent. Il peut y en avoir des dizaines. Puis `selectPeriodDiscoveriesWithTrace` choisit.

Ordre de prise :

1. Dédoublonnage : un seul objet par `kind`, le meilleur score.
2. Liste de priorité de la voix (`PERIOD_DISCOVERY_PRIORITY`), angle par angle.
3. Le reste, par score décroissant.
4. Les jalons (`disc_ms_*`) en dernier, avec leur propre plafond.

Un candidat est refusé si :

- score &lt; 36 (jalon &lt; 44) ;
- ce `kind` est déjà pris, toutes colonnes confondues ;
- une rivale du même angle est déjà prise ;
- la même `family` est déjà dans la colonne et le score est &lt; 86 ;
- le plafond de famille de signal est atteint.

Familles de signal (`signalFamilyOfKind`) : `milestone` si `disc_ms_`, `sleep` si `disc_sleep_` ou `disc_rest_assoc`, sinon `sport`.

Plafonds par voix (`SIGNAL_FAMILY_CAPS`). Ce sont des maximums, jamais des planchers. Un slot vide reste vide.

| Voix | now sport / sommeil / jalon | trajectory | journey |
| --- | --- | --- | --- |
| today, week | 5 / 2 / 1 | 5 / 2 / 1 | 4 / 2 / 1 |
| month, long, year | 6 / 2 / 1 | 6 / 2 / 1 | 5 / 2 / 1 |

Totaux UI semaine sans jalon : 7 / 7 / 6. Avec jalon : 8 / 8 / 7.

Rivales (une seule du groupe par colonne) :

- muscle du moment, poussée/tirage, structure de ratio ;
- ancre et continuité de fréquence ;
- arc de trimestre et profil de trimestre ;
- part d’exercice et répertoire ;
- mémoire structurelle et émergence ;
- effacement de famille et émergence ;
- glissement de part musculaire et réorientation ;
- volume-sommeil, association, combo, mois, performance-sommeil ;
- zones de sommeil et trimestre sommeil ;
- intensité sommeil et RPE sommeil.

Mémoire (`memoryFactor`), comptée sur les **jours précédents** seulement :

| Situation | Facteur |
| --- | --- |
| Jamais montré | 1 |
| Portrait (volume, séance en attente, muscle du moment) déjà vu 1 fois / ≥ 2 | 0,9 / 0,8 |
| Autre kind vu 1 fois / ≥ 2 | 0,6 / 0,42 |
| Jalon vu ≥ 2 fois | 0,22 |
| Premier jalon déjà vu | 0,12 |
| Changement de mix déjà vu | 0,15 |
| Jalon de poids déjà vu | 0,18 |

Le score affiché est `score × facteur`, arrondi.

### 5.2 Un essai

`buildHorizonEssayCandidates` émet d’abord **chaque découverte retenue**, telle quelle, via `emit(kind, title, body, evidence)`. La nature de la découverte fixe la colonne. La confiance affichée est celle de l’échantillon : 90 jours pour un `journey`, la longueur de fenêtre sinon.

Ensuite, si au moins une découverte `now` existe (`discCoversNow` ou séance du jour encore vide), les essais génériques de la colonne « maintenant » sont sautés : continuité, trajectoire de volume, programme, absence, performance. C’est pour ça que les cartes visibles sont des découvertes et des analyses de catalogue, pas « ta pratique s’est contractée ».

Les essais de parcours (`journey_progress`, `journey_pr_vs_level`, jalons, plateau) s’écrivent s’ils ne font pas doublon avec `disc_exercise_progress` ou `disc_pending_session`.

`natureSelectionBoost` ajoute du poids après coup : +16 pour tout `disc_`, +10 pour un jalon, +18 si `continuity` porte le phénomène de contraction, −16 si `absence` alors qu’il y a contraction, −40 pour une `situation`, +12 pour `journey_progress`. Le poids est borné à 0–98.

### 5.3 Une analyse de catalogue

`selectAnalysisCatalog` (`recapAnalysisCatalog.js`), exposé aux colonnes par `buildSpanStoryCandidates`.

Contexte propre : jours cochés, reps, exercices, mois, trous ≥ 7 jours, rythme séances/semaine, ressentis, Garmin. La bande (`today`, `week`, `month`, `quarter`, `half`, `year`, `two`, `all`) filtre quelles définitions ont le droit de tourner.

Une définition publie si `strength ≥ 64`, avec titre et corps. Puis :

- maximum **3** cartes par horizon ;
- une seule par `family` ;
- un tag déjà utilisé bloque ;
- un concept déjà raconté bloque (`informationGain` &lt; 1).

La carte entre dans le bassin avec un id `relation.reading.{horizon}.span_{id}`, poids `78 + strength/5`, nature déduite de l’horizon. Sur 30 j et plus, ces cartes sont remontées à un poids d’au moins 97, et un texte qui dit « cette semaine » perd 55.

Le coût de séance est le cas qui **change de colonne** : horizon `medium` dès que la bande n’est pas Aujourd’hui, ou si les preuves se contredisent (la charge monte, la performance par séance tient).

### 5.4 La sélection finale

`selectBalancedCandidates` (`recapAdaptiveInsights.js`), une fois par horizon, avec le plafond de `columnCapsForCandidates`.

Score de départ = poids du candidat, puis :

- +14 si l’id contient `.disc_` ;
- +0 à 12, stable dans la journée, si c’est une lecture riche ;
- −8 pour un candidat pauvre s’il existe une lecture riche ;
- −16 si le groupe sémantique est déjà pris ;
- −8 à −14 si le pilier est déjà pris ;
- −22 puis −10 pour une deuxième piste legacy ;
- petit tie-break par hash de la signature.

En dessous de `MIN_COLUMN_WEIGHT`, on s’arrête. La colonne peut donc être plus courte que son plafond. Texte vide côté UI : « Aucun signal assez robuste. »

Les cartes retenues sont enregistrées dans l’historique local (`insightNoveltyStore`) seulement si la signature du paquet a changé. Signature = période, fenêtre, km, séances course, streak, complétion, reps, nombre de candidats, hash des 12 premiers ids.

`toInsightCard` produit l’objet UI. Si le corps répète le début du titre, la première phrase est coupée. La ligne de confiance n’apparaît que si l’essai a demandé `showConfidence` : `Confiance : {label} · Échantillon : {n} j`.

### 5.5 Couleur de carte

`rewardToneForKind`, indépendant de la colonne :

| Ton | Filet | Kinds |
| --- | --- | --- |
| `daily` | vert | le reste, y compris presque toutes les découvertes sport |
| `discovery` | violet | tout `disc_sleep_*`, `disc_emergence`, `disc_comparable`, `disc_rest_assoc`, `disc_best_month` |
| `jalon` | bleu | `disc_ms_*` non listés ailleurs |
| `transformation` | orange | mix, régime, mémoire structurelle, effacement de famille, glissement de parts, stimulus, arc de trimestre |
| `historic` | rose | première séance, première course, cumul reps, cumul séances, cumul km, cumul heures |

Le catalogue de plage force `discovery` au moment où il est converti seul (`spanStoriesToInsights`). Dans le pipeline normal, le ton vient du kind ; un `span_*` sans kind sommeil retombe en `daily`.

---

## 6. Inventaire — Ce que tu as fait (`now`)

Portrait de la fenêtre. Pas un verdict de niveau.

| Kind | Titre type | Ressource | Seuil pour exister |
| --- | --- | --- | --- |
| `disc_pending_session` | La séance d’aujourd’hui n’est pas encore commencée | période &lt; 20 reps, dernière séance du catalogue, même jour de semaine (6 derniers), d7, nuit du matin | Fenêtre vide. Poids très haut (importance 0,97) |
| `disc_volume_shape` | Le rythme de la semaine reste lisible / peu de journées portent le volume / volume du mois vs mois d’avant | période, habitude de fréquence, d7, prev30 | Semaine ou aujourd’hui avec ≥ 1 jour ; ou mois ≥ 200 reps |
| `disc_density` | Plus dense / moins dense que le rythme / concentre le travail sur moins de temps | reps/h de la période vs 30 j et vs 7 j | Les deux densités existent et l’écart n’est pas nul |
| `disc_muscle_now` | Le dos représente X % des reps | parts musculaires de la période | Un groupe domine le volume identifié |
| `disc_peak_day` | La séance du … concentre une part importante | `peakDay` | ≥ 2 jours et part ≥ 22 % |
| `disc_exercise_share` | Un mouvement pèse une part nette | exercices de la période | Part assez haute d’un seul exercice |
| `disc_vs_habit` | Écart au rythme habituel, pas seulement au mois d’avant | identity | Identité prête et statut hors bande |
| `disc_no_running` | Aucune course, charge entièrement en renforcement | km et minutes course | Volume de reps présent et course absente, ou course qui était là sur 30/90 j |
| `disc_sleep_night` | La nuit du matin | `sleepContext` du jour focus | Heures disponibles |
| `disc_sleep_week` | Lecture sommeil de la semaine | faits de fenêtre | Voix semaine |
| `disc_sleep_deep` | Le profond reste stable malgré la durée | `sleepDeepStability` | Voix semaine et amplitude de profond faible vs durée |
| `disc_pending_context` est en trajectory, pas ici | Le rythme autour, quand la séance n’a pas commencé | d7 ou d30 | ≥ 2 jours et ≥ 80 reps autour |

Priorité Aujourd’hui : séance en attente, densité, nuit, forme du volume, écart à l’habitude, part d’exercice.
Priorité semaine : séance en attente, sommeil semaine, forme du volume, profond, nuit, jour pic, densité.
Priorité mois et au-delà : forme du volume, densité, muscle du moment.

Essais génériques, seulement si cette colonne n’a aucune découverte :

| Kind | Lecture |
| --- | --- |
| `continuity` | Contraction de fréquence, avec ou sans rebond, densité des séances qui tiennent ou non. Compare 28 j contre 28 j, pas le taux de la plage affichée |
| `volume_traj` | Le mois et la semaine ne racontent pas la même chose |
| `program` | Jours non commencés vs séances allégées, exercices peu cochés, alignement |
| `absence` | Un mouvement ou la course est sorti de la rotation pendant que le reste continue |
| `performance` | Momentum, records isolés, remplacements |
| `unknown_fatigue` | Fatigue sans mécanisme clair |
| `journey_abandoned` | Abandon récent, classé `now` malgré le nom |

Catalogue qui peut atterrir ici (selon la bande) :

| Id | Bande | Lecture |
| --- | --- | --- |
| `session_cost` | today, week, month | Coût. Reste en `short` seulement pour Aujourd’hui et sans conflit |
| `streak_break` | today | Premier jour vide après ≥ 4 jours consécutifs, et la veille était active |
| `new_variant` | today, week | Mouvement dont la première apparition est dans la fenêtre, ≤ 2 séances au total, et ≥ 8 jours d’historique. « Entre dans le répertoire » |
| `week_cluster` | week | Presque toutes les séances dans les 4 premiers jours |
| `month_halves` | month | Une moitié ≥ 62 % du volume, total ≥ 80 reps |
| `phase_months` | quarter et plus | Le total se lit mois par mois, ≥ 3 mois |

---

## 7. Inventaire — Ce que ça change (`trajectory`)

Déplacement par rapport au mois ou à l’habitude. Pas encore un nouveau niveau.

| Kind | Titre type | Ressource | Seuil |
| --- | --- | --- | --- |
| `disc_pending_context` | Le rythme autour reste lisible | d7 / d30 quand la période est vide | ≥ 2 jours, ≥ 80 reps |
| `disc_muscle_reorient` | Le stimulus se déplace vers les mollets | reps du groupe dans la période / reps du même groupe sur 30 j | Mois du groupe ≥ 80, période ≥ 25, part ≥ 18 % |
| `disc_push_pull` | Poussée nettement au-dessus du tirage | `pushReps`, dos | Poussée ≥ 80 et (poussée &gt; dos × 1,6 ou dos &lt; 18 % du total) |
| `disc_exercise_base` | Un mouvement porte la base | exercices × jours | Présent sur assez de séances |
| `disc_emergence` | Un mouvement apparaît | `firstSeen` dans la fenêtre, historique avant | Assez de reps pour n’être pas un essai |
| `disc_composition_not_volume` | La composition change, pas le volume | mix muscles période vs habitude | Volume proche, parts différentes |
| `disc_comparable` | Les séances vraiment comparables progressent | `findComparableSessions` | ≥ 2 valeurs dans la série, score ≥ 0,32 |
| `disc_structural_memory` | X devient structurel dans la poussée / le tirage | `recapStimulusCatalog` : part d’un mouvement dans sa famille, avant vs maintenant | Part réelle et hausse nette (ex. 0 % → 14 %) |
| `disc_stimulus_mix` | Le mélange de stimulus a bougé | familles de mouvements | Écart de mix au-dessus du seuil du catalogue |
| `disc_family_fade` | X s’efface de la famille | part passée réelle, part actuelle nulle ou résiduelle | La disparition explique une partie de la baisse de la famille, pas de la fréquence globale |
| `disc_muscle_share_shift` | Les parts musculaires ont glissé | muscles 30 j vs période | Même idée, au niveau des groupes |
| `disc_ratio_structure` | Le ratio poussée/tirage est devenu structurel | push/pull sur deux fenêtres | Écart durable |
| `disc_cardio_strength` | La place de la course vs la force a changé | km et reps sur deux fenêtres | Les deux qualités ont un historique |
| `disc_rest_assoc` | Le repos d’un jour change la séance du lendemain | `prevDayReps` du catalogue | Association repos / volume publiable |
| `disc_sleep_assoc` | Le seuil des 7 h 30 sépare les journées fortes et les journées courtes | `sleepHighLowSeparation` | 300 vs 250 reps, nuit 7 h 30 |
| `disc_sleep_family` | Après une nuit courte, la poussée recule plus que le tirage (ou l’inverse) | `sleepFamilySensitivity` | Nuit &lt; 7 h vs ≥ 7 h 30, deux familles |
| `disc_sleep_volume` | Le volume suit la durée de nuit | seuil 7 h 30 ou 8 h | publishable |
| `disc_sleep_month` | Le mois concentre les nuits longues | faits de fenêtre, voix mois | — |
| `disc_sleep_architecture` | Profond / REM / léger ne bougent pas comme la durée | architecture × volume | — |
| `disc_sleep_efficiency` | À durée comparable, l’efficacité sépare encore le volume | efficacité 90 %, bande ± 0,75 h | — |
| `disc_sleep_combo` | Meilleures journées = durée + efficacité + pas de déficit répété | 7 h 45, 90 %, J-2 | Pas sur la voix semaine |
| `disc_sleep_load` | Nuit courte après une veille lourde | veille ≥ 280 ou &lt; 80 reps | — |
| `disc_sleep_intensity` | La densité, pas seulement le volume | reps/h × nuit | — |
| `disc_sleep_cardio` | La course aussi | jours de course Garmin | — |
| `disc_sleep_perf` | Le mouvement le plus chargé bouge moins que le volume | perf lead | Le texte le dit : le sommeil suit la quantité de travail, pas chaque série |
| `disc_sleep_rpe` | La difficulté déclarée | `sessionFeedbacks` par date | — |

Essais génériques de cette colonne (si non couverts ou non supprimés par un phénomène) :

`program` est classé trajectory dans `KIND_NATURE` mais l’essai historique l’émettait avec la colonne now quand les découvertes ne couvraient pas. La nature du kind gagne au moment du `emit` si elle est passée en extra ; sinon `natureForKind`.

| Kind | Lecture |
| --- | --- |
| `push_share` / `specialization` | Part poussée et conséquence selon l’objectif |
| `pull_hold` | Le tirage de référence tient ou non |
| `redundancy` | Deux mouvements font le même travail |
| `established` | Un mouvement est devenu la base |
| `efficiency` | Beaucoup de volume pour peu de progression, ou l’inverse |
| `goal_gap` | Écart entre l’objectif déclaré et ce qui est exposé |
| `capacity_vs_exposure` | On voit moins de reps parce qu’on expose moins, pas parce que la capacité a baissé |
| `identity` | Le présent sort de la bande habituelle |
| `journey_plateau` | Plateau d’un mouvement, classé trajectory |

Catalogue :

| Id | Bande | Lecture |
| --- | --- | --- |
| `session_cost` | week, month (et conflit) | Coût objectif ou ressenti. Voir § 9 |
| `exercise_return` | today, week | Retour après 10 à 120 jours. Reprise, pas encore une habitude |
| `week_gap` | week, month | Un seul trou (≥ 3 j en semaine, ≥ 6 j en mois) explique la rupture |
| `anchor_exercises` | week, month | ≥ 2 mouvements présents à chaque séance |
| `volume_vs_frequency` | week, month, quarter | La variation vient des séances ou du contenu par séance. Écart de magnitude ≥ 0,4 ou split fréquence/densité ≥ 18. Confiance d’évidence ≥ 0,4 |
| `regularity` | month et plus | Régularité sur la bande longue |
| `acute_week` | month, quarter | Les 7 derniers jours ≥ 38 % du volume, volume ≥ 100, semaine ≥ 40 reps |
| `variety_shift` | month, quarter | Nombre d’exercices × 1,25 ou ÷ 1,25 vs fenêtre précédente, ≥ 4 ids de chaque côté |
| `last_month_break` | quarter, half | Le dernier mois ≥ 40 % du volume et ≥ 90 % de la somme des mois d’avant |
| `rate_shift` | quarter et plus | Changement de régime de fréquence |
| `abandoned_exercise` | half et plus | ≥ 4 séances, silence ≥ 45 jours, et l’entraînement a continué 21 jours après |

Priorité Aujourd’hui (extrait) : contexte d’attente, combo sommeil, volume sommeil, perf, charge, RPE, intensité, efficacité, famille, composition, réorientation, mémoire structurelle, mix.
Priorité semaine : volume sommeil, perf, architecture, charge, course, intensité, base d’exercice, poussée/tirage, mémoire, mix.
Priorité mois : sommeil du mois, perf, charge, course, glissement de parts, effacement, cardio/force, architecture, mix.

---

## 8. Inventaire — Ce qui a évolué (`journey`)

Ce qui s’est installé. Le record n’est pas le niveau. Le niveau est ce qui se reproduit.

| Kind | Titre type | Ressource | Seuil |
| --- | --- | --- | --- |
| `disc_exercise_progress` | X a progressé de N % depuis les premières séances comparables | baseline : `established`, `vsInitialPct`, moyenne des 5 premières, moyenne récente, `consolidated` | \|écart\| ≥ 15 % et moyenne historique ≥ 5. Le plus grand écart gagne |
| `disc_anchor` | Un mouvement est l’ancre | présence longue dans le catalogue | — |
| `disc_repertoire` | Le répertoire s’est installé | exercices vus sur la vie vs la fenêtre | — |
| `disc_freq_continuity` | La fréquence est devenue un régime | identity + d90 | — |
| `disc_kcal_profile` | Le profil de dépense | kcal actives × minutes | ≥ 400 kcal et ≥ 1 jour |
| `disc_quarter_profile` | Le trimestre a une forme | d90, first30 | Voix longue |
| `disc_quarter_arc` | L’arc du trimestre n’est pas une pente plate | trois sous-fenêtres | — |
| `disc_best_month` | Un mois porte l’histoire | `bestCalendarMonths` sur `repsByDate` | Historique de plusieurs mois |
| `disc_sleep_zones` | Trois zones de récupération | `sleepDurationZones` | ≥ 8 h, 7 h 30–8 h, &lt; 7 h 30 |
| `disc_sleep_quarter` | Les journées les plus denses suivent plus souvent de longues nuits | `sleepHighDayShare` sur d90 (aujourd’hui/semaine) ou sur la période | 300 reps, nuit 7 h 30. Le texte refuse la causalité |
| `disc_sleep_delayed` | Le déficit se voit avec un décalage | nuits d’avant | — |
| `disc_sleep_j2` | La nuit d’avant-hier | `sleepLagJ2` | — |
| `disc_sleep_freq` | Les semaines bien dormies entraînent plus souvent | `sleepWeekFrequency` | ≥ 4 nuits longues vs ≤ 2 |

Essais de parcours, avec ligne de confiance :

| Kind | Lecture |
| --- | --- |
| `journey_progress` | Plusieurs mouvements : première référence fiable → médiane habituelle. Sautée si `disc_exercise_progress` est déjà retenu |
| `journey_pr_vs_level` | Record daté, éloigné de la médiane habituelle sur les séances comparables. Ex. 100 reps il y a 78 jours, habitude 40–41 |
| `journey_milestones` | ≥ 3 paliers sur un mouvement |
| `continuity_level` | Le niveau de fréquence du parcours |
| `recent_vs_identity` | Le récent vs la bande de toute la vie |

Catalogue :

| Id | Bande | Lecture |
| --- | --- | --- |
| `weekday_habit` | week et plus | Un jour de semaine ≥ 28 % des jours entraînés, ≥ 12 jours au total |
| `longest_gap` | quarter et plus | Plus long trou ≥ 10 jours |
| `comeback_speed` | half et plus | Après un trou ≥ 14 jours, retour à 80 % du rythme d’avant |
| `peaks` | half et plus | Mois pic vs mois creux, ≥ 3 mois, écart × 1,4 ou +3 jours |
| `durable_exercise` | year, two, all | Mouvement présent ≥ 6 séances et ≥ 60 jours de span |
| `present_was_rare` | half et plus | 12 dernières semaines ≥ rythme ancien + 0,8 séance/semaine, ≥ 16 jours et ≥ 4 mois |
| `history_floor` | all, two, year | Le plancher historique : le présent comparé à ce que le début du suivi atteignait |

Priorité Aujourd’hui : zones sommeil, ancre, fréquence sommeil, J-2, répertoire, progression d’exercice, continuité, trimestre sommeil, déficit décalé.
Priorité semaine : fréquence sommeil, zones, ancre, kcal, répertoire, meilleur mois, trimestre, J-2, décalage.
Priorité mois : zones, J-2, meilleur mois, progression, profil de trimestre.
Priorité année / toujours : trimestre sommeil, meilleur mois, progression, fréquence, décalage, arc.

---

## 9. Le coût de séance en détail

`recapCostQuestion.js`, appelé par le catalogue `session_cost`.

Preuves possibles, chacune avec rôle, force, direction, couverture :

- énergie déclarée (baisse début → fin) ;
- difficulté déclarée ;
- volume de reps vs fenêtre précédente de même longueur ;
- tonnage ;
- séances collées (écart ≤ 1 jour) ;
- sommeil Garmin vs fenêtre précédente (delta en minutes).

`resolveEvidence` choisit une route. Confiance minimum 0,42 et niveau ≥ 1, sinon pas de carte.

| Route | Carte |
| --- | --- |
| `conflict` | « Le coût monte, la performance enregistrée ne suit pas. » La charge ou le ressenti monte, les reps par séance restent ≥ 92 % d’avant |
| `A` avec énergie moyenne ≥ 3 | « La séance a coûté plus d’énergie… » ou « Le coût ressenti est élevé. » C’est le déclaré, pas une déduction du volume |
| `A` / `A_partial` avec difficulté | Difficulté moyenne /10. Si partiel : le chiffre ne décrit pas les séances sans ressenti |
| `B` ou `C` | « Le coût objectif des séances semble avoir augmenté. » Volume ≥ +18 %, et/ou tonnage ≥ +15 %, et/ou ≥ 2 séances collées, et/ou sommeil ≤ −25 min. Si aucun ressenti : la carte le dit |
| `D` | « Le volume monte, le coût ressenti n’est pas observable. » Volume ≥ +18 % sans ressenti et sans autre indicateur de récupération |

Horizon : `medium` si la bande n’est pas Aujourd’hui, ou si la route est `conflict`. Sinon `short`.

---

## 10. Jalons

`detectRecapMilestones` ajoute des découvertes `disc_ms_*` à la fin de `detectDiscoveries`. Elles passent la sélection en dernier, une par colonne au maximum (le plafond `milestone`), score minimum 44. Un jalon n’est éligible que si sa date tombe dans la fenêtre, avec des exceptions pour le tout premier événement absolu selon la voix.

| Kind | Nature | Événement |
| --- | --- | --- |
| `disc_ms_first_session` | now | Première séance |
| `disc_ms_first_run` | now | Première course |
| `disc_ms_first_hour` | now | Première heure |
| `disc_ms_first_load` | now | Première charge |
| `disc_ms_return` | now | Retour après une absence significative (écart vs intervalle médian) |
| `disc_ms_return_run` | now | Retour à la course |
| `disc_ms_return_gtg` | now | Retour au grease the groove |
| `disc_ms_day_volume` | now | Record de volume sur une journée |
| `disc_ms_pr` | now | Record de reps |
| `disc_ms_pr_density` | now | Record de densité : ≥ +8 % et +6 reps/h vs le max précédent, ≥ 4 séances |
| `disc_ms_pr_pace` | now | Record d’allure : ≤ 95 % du meilleur et au moins 0,15 min/km plus vite, sortie ≥ 2 km et ≥ 10 min, ≥ 3 sorties |
| `disc_ms_pr_load` | now | Record de charge / 1RM estimé (Epley) |
| `disc_ms_goal_run` | now | Objectif course atteint |
| `disc_ms_first_exercise` | trajectory | Premier vrai usage d’un mouvement |
| `disc_ms_pr_consolidated` | trajectory | Le record n’est plus isolé : reproduit plusieurs fois dans la fenêtre récente |
| `disc_ms_week_freq` | trajectory | Régime de fréquence hebdomadaire |
| `disc_ms_weight` | trajectory | Évolution de poids |
| `disc_ms_goal` | trajectory | Objectif de reps / force |
| `disc_ms_goal_weight` | trajectory | Objectif de poids |
| `disc_ms_sleep_combo` | trajectory | Journée qui réunit les conditions de nuit |
| `disc_ms_regime` | trajectory | Changement de régime |
| `disc_ms_return_durable` | trajectory | Le retour tient, ce n’est pas une séance unique |
| `disc_ms_event_combo` | trajectory | Deux événements le même jour |
| `disc_ms_cumul` | journey | Seuil de reps cumulées |
| `disc_ms_sessions` | journey | Seuil de séances |
| `disc_ms_km` | journey | Seuil de kilomètres |
| `disc_ms_hours` | journey | Seuil d’heures |
| `disc_ms_mix_shift` | journey | Le mix du parcours a changé |

---

## 11. Ce que le pipeline calcule et n’affiche pas dans les trois colonnes

Ces objets sont sur l’assessment fusionné. Ils servent au debug, au coach, ou à d’autres blocs de l’onglet. Ils ne deviennent une carte que si un essai ou une découverte les cite.

| Objet | Fichier | Rôle |
| --- | --- | --- |
| Transitions d’état | `trainingStateTransitions.js` | Charge, adhérence, perf, récup, fatigue : stable → rising, etc. |
| Robustesse de performance | `performanceRobustness.js` | Une variation de reps tient-elle si on change la fenêtre |
| Événements | `trainingEventDetector.js` | PR, reprise, rupture. Les relations s’en servent |
| Relations | `trainingRelationEngine.js` | Lectures composées. Gardées en compagnon si pertinence ≥ 0,7, texte ≥ 80 caractères, et id pas déjà émis par un essai |
| Comparaisons population | `populationComparisonEngine.js` | « Tu t’entraînes N fois plus que… ». Filtrées : `isColumnInterpretation` rejette `hierarchical_comparison` et les ids `cmp.` |
| Exposition narrative | `recapExposureNarratives.js` | Ancien rédacteur de rythme et de couverture musculaire. Le pipeline actuel passe par les essais et les découvertes |
| Pistes legacy | `recapDeepInsights.js` | Textes courts de semaine. Poids faible |
| Benchmarks | `recapBenchmarkInsights.js` | Records de course, tonnage, comparaisons population. Hors des trois colonnes |
| Calendrier du bandeau | `recapCalendarPeriodAnalytics.js` | Tuiles du panneau violet |
| Coach programme | `buildRecapProgramCoachAnalysis` | Bloc sous les colonnes, dans `RecapAnalyseDetails` |

`isColumnInterpretation` exige un texte ≥ 80 caractères et un id `relation.*` ou un pilier `interpretation`.

---

## 12. Groupes musculaires

Libellés (`MUSCLE_FR`) : pectoraux, dos, épaules, biceps, triceps, avant-bras, fessiers, quadriceps, ischio-jambiers, mollets, gainage/tronc, cou, adducteurs.

| Famille | Groupes |
| --- | --- |
| Poussée | pectoraux, épaules, triceps |
| Tirage | dos, biceps |
| Haut du corps | poussée + tirage + avant-bras + cou |
| Bas du corps | quadriceps, ischio-jambiers, mollets, fessiers, adducteurs, tibia |

`recapStimulusCatalog.js` classe les mouvements dans une famille (poussée, tirage, etc.) pour « devient structurel » et « s’efface ». Un mouvement devient structurel quand il pèse désormais une part réelle de sa famille. Il s’efface quand cette part était réelle et tombe.

L’inférence de groupes (`inferMuscleGroupsForExercise`) se fait par le nom quand l’exercice n’a pas de groupe fiable.

---

## 13. Rendu à l’écran

`InsightColumn` dans `RecapAnalyseView.jsx` :

- pastille de colonne (cyan / teal / émeraude) ;
- cartes séparées par un filet haut ;
- filet gauche selon `rewardTone` ;
- titre 12 px, corps, preuve en 10 px gris, confiance en 10 px gris.

Même forme dans `RecapUserAssessmentPanel` (autre écran, mêmes `insights`).

Rien dans ces cartes n’est éditable. Il n’y a pas de lien vers la séance. La preuve est une chaîne déjà formatée par le rédacteur (`846 reps`, `poussée 71,2 % · tirage 112,0 %`, `24 → 31,6 · +31,7 %`).

---

## 14. Carte des fichiers

| Fichier | Rôle |
| --- | --- |
| `src/hooks/useRecapTabMetrics.js` | Lance le calcul, cache, garde-fou de richesse |
| `src/utils/sport/recapAdaptiveInsights.js` | Assemble, pondère, sélectionne, forme les cartes |
| `src/utils/sport/recapInterpretationPipeline.js` | État, phénomènes, découvertes, essais, relations |
| `src/utils/sport/recapInsightNature.js` | Nature, plafonds, tons, bonus de sélection |
| `src/utils/sport/recapPeriodDiscoveries.js` | Mesures, voix, ~53 découvertes, priorité, rivales, mémoire |
| `src/utils/sport/recapSleepNight.js` | Une nuit Garmin, ou rien |
| `src/utils/sport/recapSleepCorrelation.js` | Tous les tests sommeil et leurs seuils |
| `src/utils/sport/recapPersonalBaselines.js` | Baseline, catalogue de séances, séances comparables |
| `src/utils/sport/recapStimulusCatalog.js` | Structurel / effacé dans une famille |
| `src/utils/sport/recapMilestoneEngine.js` | Jalons |
| `src/utils/sport/recapHorizonEssays.js` | Recopie les découvertes, essais de secours, parcours |
| `src/utils/sport/recapAnalysisCatalog.js` | Bibliothèque de plage, dont le coût |
| `src/utils/sport/recapCostQuestion.js` | Routes de coût A / B / C / D / conflit |
| `src/utils/sport/recapVolumeQuestion.js` | Volume depuis la fréquence ou depuis la densité |
| `src/utils/sport/recapRegularityQuestion.js` | Régularité longue |
| `src/utils/sport/recapHistoryQuestion.js` | Régime de rythme, plancher historique |
| `src/utils/sport/recapReasoning.js` | Gain d’information : ne pas raconter deux fois le même concept |
| `src/utils/sport/userTrainingState.js` | Cinq axes |
| `src/utils/sport/recapTrainingFeatures.js` | Deltas 7 / 28 / 90 |
| `src/utils/sport/athleteTrainingIdentity.js` | Habitude et bande |
| `src/utils/sport/athleteJourney.js` | Parcours, record vs habituel |
| `src/utils/sport/trainingPhenomenonEngine.js` | Causes qui suppriment des essais |
| `src/utils/sport/insightNoveltyStore.js` | Mémoire locale, jour courant exclu |
| `src/components/sport/recap/views/RecapAnalyseView.jsx` | Les trois colonnes |

Tests de référence : `recapPeriodDiscoveries.test.js`, `recapColumnPipeline.test.js`, `recapInterpretationPipeline.test.js`, `recapAdaptiveInsights.test.js`, `recapStimulusCatalog.test.js`.
