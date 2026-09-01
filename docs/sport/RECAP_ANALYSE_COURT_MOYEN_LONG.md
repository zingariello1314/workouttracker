# Récap Analyse — Court, Moyen, Long : documentation technique

> **Périmètre.** Uniquement les trois colonnes d’interprétation du sous-onglet **Analyse** (Maintenant / Trajectoire / Parcours).  
> Ce n’est **pas** un mode d’emploi historique du Recap entier (bandeau, Corps, Tendances, Grades, Vision coach, etc.).  
> **Source de vérité :** le code runtime, pas le plan produit. Date de lecture : 1er septembre 2026.

**Oui : tout le système d’analyse suit la plage de temps.** Ce n’est pas un habillage de titres. Quand tu passes de *Aujourd’hui* à *30 jours*, le moteur relance la détection avec une autre fenêtre, une autre **voix** (lexique), d’autres **gardes** (quels kinds ont le droit de parler), d’autres **comparaisons autorisées**, d’autres **jalons éligibles**. Les trois colonnes restent des angles sur *cette* plage — elles ne deviennent pas « 7 jours / 30 jours / 1 an ».

Le § 5 est l’écran opérationnel : une fiche par période, mots, phrases, données dont on parle et données qu’on tait. Le reste du fichier décrit le pipeline, le sommeil, les jalons.

Le document de parcours / jauge (`RECAP_ANALYSE_MOTEUR_INTERPRETATION.md`) décrit *pourquoi* le moteur est fait ainsi.

---

## Table des matières

1. [Ce que sont vraiment Court / Moyen / Long](#1-ce-que-sont-vraiment-court--moyen--long)
2. [Chaîne d’exécution complète](#2-chaîne-dexécution-complète)
3. [Période Recap : les huit plages](#3-période-recap--les-huit-plages)
4. [Voix de période (`periodVoice`)](#4-voix-de-période-periodvoice)
5. [Écran 1 — une fiche par plage](#5-écran-1--une-fiche-par-plage)
6. [Inventaire des données : disponibles vs utilisées](#6-inventaire-des-données--disponibles-vs-utilisées)
7. [Mesure d’une fenêtre](#7-mesure-dune-fenêtre)
8. [Comment une analyse se forme](#8-comment-une-analyse-se-forme)
9. [Les trois colonnes, en détail](#9-les-trois-colonnes-en-détail)
10. [Matrice plage × voix × kinds](#10-matrice-plage--voix--kinds)
11. [Sommeil — traitement particulier](#11-sommeil--traitement-particulier)
12. [Jalons — moteur événementiel](#12-jalons--moteur-événementiel)
13. [Plafonds, rivaux, mémoire, couleurs](#13-plafonds-rivaux-mémoire-couleurs)
14. [Fichiers concernés](#14-fichiers-concernés)
15. [Règles de silence et cas limites](#15-règles-de-silence-et-cas-limites)

---

## 1. Ce que sont vraiment Court / Moyen / Long

Les libellés UI :

| Colonne | Clé interne | Nature | Traduction FR |
|---------|-------------|--------|----------------|
| Court | `short` / `shortTerm` | `now` | *Maintenant · ce qui vient de se passer* |
| Moyen | `medium` / `mediumTerm` | `trajectory` | *Trajectoire · ce qui se construit* |
| Long | `long` / `longTerm` | `journey` | *Parcours · depuis tes débuts* |

**Ce ne sont pas trois durées.** Sur *Aujourd’hui* comme sur *1 an*, les trois colonnes regardent **la même fenêtre Recap**. Ce qui change, c’est l’**angle** :

- **Maintenant** : l’événement, la séance, la forme actuelle de la période (densité, volume du jour / de la semaine, nuit associée, première fois, PR).
- **Trajectoire** : ce qui se construit *dans* cette période (corrélations, régime, mix, objectifs, comparaison à un mois précédent).
- **Parcours** : ce qui se lit seulement avec de l’historique (cumuls, zones de sommeil, meilleur mois, changement de profil sur un an).

Un `kind` a une nature **fixe** (`KIND_NATURE` dans `recapInsightNature.js`). La plage Recap **n’inverse jamais** un kind : `disc_sleep_night` reste `now` que tu sois sur 7 jours ou sur 30. Ce que la plage change, c’est :

1. **quelles données sont assez denses** pour publier le kind ;
2. **la voix** (lexique : « cette séance » vs « ces 30 jours ») ;
3. **la priorité** (`PERIOD_DISCOVERY_PRIORITY`) : quel kind gagne chaque angle ;
4. **l’éligibilité des jalons** (un PR d’il y a 40 jours n’apparaît pas sur *Aujourd’hui*).

Les trois colonnes sont des **plafonds**, jamais un plancher. Une colonne vide affiche *« Aucun signal assez robuste. »* C’est un état valide.

---

## 2. Chaîne d’exécution complète

```
RecapTab
  period picker  (today | 7d | 30d | 3m | 6m | 1y | 2y | all)
  → getRecapDateWindow(period)          // { start, end } calendaire
  → computeRecapMuscleState(...)        // recapState.window = même fenêtre
  → useRecapTabMetrics
       buildAdaptiveRecapInsights
         buildComposedInterpretationPipeline
           UserTrainingState + identity + journey + phenomena
           buildPeriodDiscoveryBundle
             measureRecapWindow (période + d7 + d30 + d90 + prev30 + first30)
             buildSessionCatalog (lifetime jusqu’à end)
             extractSleepNightsInWindow
             publishSleepCandidates  (≥ 8 paires séance×nuit)
             detectDiscoveries       (sport + sommeil + jalons)
             selectPeriodDiscoveries (priorité, rivaux, extra jalons)
           buildHorizonEssayCandidates
             émet les selected discoveries
             coupe continuity / volume_traj si une découverte « now » existe déjà
           renderInterpretations
         applyNoveltyWeights + applyNatureWeights
         columnCapsForCandidates        (2/3/2 ou 3/4/3 si jalon)
         selectBalancedCandidates       (par horizon short / medium / long)
       → assessment.insights.{ shortTerm, mediumTerm, longTerm }
  → RecapAnalyseView.InsightColumn
```

Deux sélections successives, pas une seule :

1. **`selectPeriodDiscoveries`** choisit *quels constats* existent pour cette voix (score, rivaux, familles, slots extra jalons).
2. **`selectBalancedCandidates`** choisit *quelles cartes* tiennent dans la colonne UI (poids, groupe sémantique, pilier, bonus `disc_`).

Un constat détecté mais non retenu à l’étape 1 n’atteint jamais l’UI. Un candidat émis mais sous le seuil de poids (`MIN_COLUMN_WEIGHT = 32`) n’atteint pas non plus l’UI.

Les builders legacy (pistes assessment, Vision coach, benchmarks) **n’alimentent pas** les trois colonnes. Le pipeline le dit explicitement dans `recapInterpretationPipeline.js`.

---

## 3. Période Recap : les huit plages

Définies dans `recapViewPeriods.js`. Calcul calendaire dans `getRecapDateWindow` (`recapMuscleLoadEngine.js`). Fenêtre **inclusive**.

| ID picker | Label produit | `start` | `end` | `spanDays` | Voix |
|-----------|---------------|---------|-------|------------|------|
| `today` | Aujourd’hui | = end | aujourd’hui | 1 | `today` |
| `7d` | 7 jours | end − 6 j. | aujourd’hui | 7 | `week` |
| `30d` | 30 jours | end − 29 j. | aujourd’hui | 30 | `month` |
| `3m` | 3 mois | end − 91 j. | aujourd’hui | 92 | `long` |
| `6m` | 6 mois | end − 182 j. | aujourd’hui | 183 | `year` (unité « semestre ») |
| `1y` | 1 an | end − 364 j. | aujourd’hui | 365 | `year` |
| `2y` | 2 ans | end − 729 j. | aujourd’hui | 730 | `year` |
| `all` | Tout | `null` | aujourd’hui | *voir § 15* | `year` |

`end` est toujours le jour calendaire de référence (`toYmd(new Date())` au moment du calcul).

Question que chaque plage pose (`PERIOD_QUESTIONS`) — c’est le critère de priorité, pas un texte affiché :

| Plage | Question interne |
|-------|------------------|
| `today` | Qu’est-ce qui caractérise précisément cette séance par rapport à ce que je fais habituellement ? |
| `7d` | Qu’est-ce qui s’est réellement passé cette semaine, et comment se compare-t-elle à mon rythme habituel ? |
| `30d` | Comment mon entraînement récent évolue-t-il par rapport aux mois précédents ? |
| `3m` | Quelle trajectoire suis-je réellement en train de construire ? |
| `6m` / `1y` / `2y` / `all` | Quelle trajectoire s’est réellement construite sur cette durée ? |

**Important.** La plage Recap scelle *la fenêtre de volume affichée* (bandeau, muscles 3D, mesure `period`). Elle ne scelle **pas** tout l’historique lu par Analyse. Le catalogue de séances, les baselines d’exercices, les corrélations sommeil et les cumuls de jalons regardent l’historique **jusqu’à `end`**, pas seulement `start…end`.

---

## 4. Voix de période (`periodVoice`)

Fonction : `periodVoice(period, spanDays)` dans `recapPeriodDiscoveries.js`.

La voix n’est pas un simple alias du picker. Elle sert :

- au **lexique** (`thisPeriod`, `ofPeriod` : « cette séance », « cette semaine », « ces 30 jours »…) ;
- aux **gardes** `isToday` / `isWeek` / `isMonth` / `isLongVoice` dans `detectDiscoveries` ;
- à la table **`PERIOD_DISCOVERY_PRIORITY[voiceKey]`** ;
- à **`observationCaps(voiceKey)`** ;
- à **`eligible(...)`** des jalons.

Règles d’affectation :

```
today  OU spanDays ≤ 1          → today
7d     OU span ∈ [6, 8]         → week
30d    OU span ∈ [21, 40]       → month
1y | 2y | all | 6m | span ≥ 180 → year
sinon (typiquement 3m / 92 j.)  → long
```

`isLongVoice` = `long || year`. Beaucoup de kinds sommeil / structure s’ouvrent dès `isLongVoice`, sans distinguer 3 mois et 1 an. La distinction `long` vs `year` joue surtout sur :

- la priorité Parcours (`year` ajoute `disc_exercise_progress`) ;
- le plafond max (year : 8 observations fortes au lieu de 6 pour élargir) ;
- les jalons mix (`disc_ms_mix_shift` exige voix `year`, ou `long` avec span ≥ 150 ; arc 2 ans si span ≥ 500).

---

## 5. Écran 1 — une fiche par plage

C’est **le** fonctionnement du système d’analyse une fois la plage choisie. Les colonnes Court / Moyen / Long ne changent pas de définition ; c’est **tout le reste** qui change : fenêtre mesurée, mots, comparaisons permises, kinds autorisés, jalons visibles.

### 5.0 Ce qui se passe au clic (commun à toutes les plages)

1. `RecapTab` pose `period` (`today` … `all`) → `getRecapDateWindow` calcule `{ start, end }`.
2. `computeRecapMuscleState` + `measureRecapWindow` mesurent **cette** fenêtre (objet `period`).
3. En parallèle, le moteur mesure toujours `d7`, `d30`, `d90`, `prev30`, `first30` — mais **n’a pas le droit** de les citer comme s’ils étaient « la période », sauf si un kind de cette voix le prévoit.
4. `periodVoice(period, spanDays)` pose le dictionnaire de mots.
5. `detectDiscoveries` n’écrit un kind que si sa garde `isToday` / `isWeek` / `isMonth` / `isLongVoice` est vraie **et** que les chiffres tiennent.
6. `selectPeriodDiscoveries` applique la **priorité de cette voix** (`PERIOD_DISCOVERY_PRIORITY[voiceKey]`).
7. Les textes déjà rédigés (titre + corps) partent dans les colonnes selon la nature fixe du kind.

Les trois colonnes UI gardent les mêmes titres (*Maintenant · ce qui vient de se passer*, etc.). Ce n’est pas « Court = 7 jours ». Sur *1 an*, Maintenant parle encore de **cette année telle qu’elle est**, pas d’un autre intervalle.

#### Dictionnaire injecté dans presque toutes les phrases

| Champ voix | today | week (7d) | month (30d) | long (3m) | year 6m | year 1y / 2y / all |
|------------|-------|-----------|-------------|-----------|---------|---------------------|
| `unit` | séance | semaine | mois | trimestre | semestre | année |
| `now` | aujourd'hui | cette semaine | ce mois | cette période | cette période | cette période |
| `thisPeriod` | cette séance | cette semaine | ces 30 jours | cette période | ces derniers mois | cette année |
| `ofPeriod` | de la séance | de la semaine | du mois | de la période | de la période | de l'année |
| `daysWord` | journée | jours | jours | jours | jours | jours |

`agreeEst(v)` : si `thisPeriod` commence par « ces » / « les » → **sont**, sinon → **est**. D’où « ces 30 jours **sont** au-dessus de ton niveau habituel » vs « cette séance **est** en retrait ».

`periodPortraitTail` (queue commune, seulement si les chiffres existent) :

- muscles dominants de **la fenêtre** (pas du lifetime) ;
- pic de jour si ≥ 2 jours entraînés et pic ≥ 22 % du volume **de la période** (`ofPeriod`) ;
- course de **la fenêtre**, ou « aucune course : la charge est entièrement du renforcement » si reps ≥ 80 ;
- kcal actives si ≥ 400 **et** ≥ 1 jour entraîné.

Cette queue est collée derrière `disc_volume_shape` (et portraits pending). Elle ne parle jamais d’une autre plage que `p` (la mesure Recap).

#### Règle d’or des comparaisons

| Plage | Comparaison autorisée dans le texte | Comparaison interdite |
|-------|-------------------------------------|------------------------|
| today | séance vs médiane d’un exo ; séance vs 7 j. (volume/séance, densité vs 30 j.) ; nuit D vs ≥ 4 nuits | « tu t’entraînes 0,6 fois / sem. » à partir d’un jour ; mois vs mois ; trimestre vs trimestre |
| 7d | semaine vs habitude séances/sem. ; densité vs 30 j. ; concentration du volume **de la semaine** | mois vs mois précédent présenté comme « la semaine » ; taux 7 j. extrapolé en année |
| 30d | **ces 30 j. vs les 30 j. d’avant** (`prev30`) ; 28 j. vs 28 j. (fenêtre mois-like) | 7 j. présentés comme le mois ; 92 j. vs 92 j. |
| 3m / 6m / 1y / 2y | rythme **28 j. vs 28 j.** (source `28d`) ; 30 derniers vs 30 premiers du trimestre ; mix 90 vs 90 (ou 180 vs 180) | « X séances/sem. sur la fenêtre entière » (92/183/365 jours × 7) ; 0,6 → 4,5 inventé |

Phrase explicite déjà dans le code long-voix : *« ce n'est pas le taux de la fenêtre entière »*.

---

### 5.1 Aujourd’hui (`today` → voix `today`)

**Fenêtre.** Un seul jour calendaire (`start = end`).  
**Question interne.** *Qu’est-ce qui caractérise précisément cette séance par rapport à ce que je fais habituellement ?*  
**Priorité Maintenant.** `pending_session` → densité → nuit → volume_shape → vs_habit → exercise_share.

#### Mots

On dit : *aujourd'hui*, *cette séance*, *de la séance*, *tu as réalisé*, *réalisé(e)s aujourd'hui*, *la nuit dernière* / *cette nuit* / *la nuit qui se termine ce matin*.  
On ne dit pas : *cette semaine*, *ces 30 jours*, *le trimestre*, *tu t’entraînes moins souvent ce mois-ci* comme verdict du jour.

Titres typiques (code) :

- séance vide : *La séance d'aujourd'hui n'est pas encore commencée*
- volume : *Le volume réalisé aujourd'hui reste élevé par séance*
- densité plus haute : *Une séance plus dense que ton rythme récent*
- densité plus basse : *Une séance légèrement moins dense que ton rythme récent, mais avec un volume par séance toujours élevé*
- muscles : *Cette séance est nettement orientée {pectoraux|dos|…}*
- nuit : *Une nuit plus courte / plus longue que ton niveau récent* (ou *correcte en durée, à lire surtout dans son architecture* si |Δ| < 20 min)

#### Données dont on PARLE

- reps, minutes, reps/h **du jour** (si minutes ≥ 20) ;
- volume/séance du jour vs moyenne des **7 derniers jours** (pas vs le mois, pour ce bit) ;
- densité du jour vs **30 derniers jours** (`d30.repsPerHour`) — le mois sert d’habitude, pas de « tu as fait un mois ») ;
- muscles / poussée-tirage **du jour** ; part d’un exo dans **son** volume de 30 j. (`disc_exercise_share`, nature `now` seulement aujourd’hui) ;
- dernière séance catalogue + les mêmes jours de semaine (*tes lundis récents*) si 0 reps ;
- nuit D vs ≥ 4 nuits récentes ; Body Battery / HR sommeil seulement s’ils sont là ;
- corrélation 7h30 sur les **14 dernières paires** (pas « depuis 2024 ») ; trio 7h45+90 %+J-2 si publiable ;
- jalons dont la **date = aujourd’hui** uniquement (PR du jour, première fois aujourd’hui, 300 reps aujourd’hui).

#### Données qu’on TAIT (même si le moteur les a)

- `prev30` / `first30` comme comparaison de période ;
- pic de jour (`disc_peak_day` exige ≥ 2 jours entraînés — impossible sur 1 jour) ;
- `disc_sleep_week`, `_deep`, `_month`, `_zones`, `_quarter`, `_delayed`, `_j2` (sauf J-2 dans le **trio** combo) ;
- `disc_sleep_cardio` (sorties km : pas une lecture « aujourd’hui ») ;
- `disc_exercise_base` (socle hebdo) ;
- `disc_kcal_profile` (kcal : week ou month seulement) ;
- régime 6 semaines, mix 1 an, cumuls historiques sauf si le palier **tombe aujourd’hui** ;
- gabarit `continuity` / `volume_traj` si une découverte `now` existe **ou** si 0 séance (`skipGenericNow`) ;
- phrase *« pas assez de données de sommeil »*.

#### Les trois colonnes, concrètement

| Colonne | Rôle aujourd’hui | Exemple de contenu | Souvent vide si… |
|---------|------------------|--------------------|------------------|
| Maintenant | la séance (ou l’attente) | pending, volume du jour, densité, nuit, vs habitude, PR du jour | — (presque toujours au moins pending ou volume) |
| Trajectoire | ce que le jour *révèle* de déjà construit | pending_context = **les 7 derniers jours** ; sommeil volume/efficacité/famille/RPE ; composition ≠ volume | historique < 8 paires sommeil et pas de d7 |
| Parcours | ce que le jour *pèse* dans l’histoire | ancre (≥ 5 % du mois), répertoire, continuité de pratique | mois trop mince (`d30` < 400 reps) |

Si 0 reps : Maintenant explique l’**attente**, pas une régression. Trajectoire peut décrire la semaine récente (*Ce n'est pas un substitut d'aujourd'hui*). On ne compare **pas** un zéro à l’habitude.

`disc_vs_habit` a `fit: 1` aujourd’hui, `0.62` ailleurs : le vs-médiane est **fait pour le jour**.

---

### 5.2 7 jours (`7d` → voix `week`)

**Fenêtre.** 7 jours inclusifs.  
**Question.** *Qu’est-ce qui s’est réellement passé cette semaine, et comment se compare-t-elle à mon rythme habituel ?*  
**Priorité Maintenant.** pending → `disc_sleep_week` → volume_shape → nuit → profond → pic de jour → densité.

#### Mots

On dit : *cette semaine*, *de la semaine*, *les mouvements les plus répétés cette semaine*, *les nuits d'au moins 7 h 30 précèdent X reps de la semaine*.  
On ne dit pas : *cette séance* pour le total 7 j. ; *le mois recule* ; *cette année*.

Titres typiques :

- volume concentré : *Le volume de la semaine est concentré sur moins de journées* (si ≤ 3 séances et rythme ≤ habitude)
- sinon : *Le rythme de la semaine reste lisible par rapport à ton habitude*
- pic : *La séance du {date} concentre une part importante de la semaine* (≥ 28 % des reps **de la fenêtre**)
- sommeil : *Ta semaine concentre le volume derrière un petit nombre de nuits* ; *Le sommeil profond reste stable malgré les variations de durée*
- socle : *Le socle hebdomadaire n’est pas le même que ce qui structure une séance*

Le mot « concentré » est volontaire : le code interdit *« en baisse »* comme unique lecture si les séances restantes sont lourdes (≥ 200 reps/séance).

#### Données dont on PARLE

- jours entraînés, reps, minutes **des 7 jours** ; rythme séances/sem. vs `identity.frequency.meanPerWeek` ;
- densité vs **30 j.** (pas vs la semaine précédente dans `disc_density` : `vs7` est coupé en voix week) ;
- pic de jour + top 3 exos du pic vs top 3 de la **semaine** (`disc_exercise_base`) ;
- kcal actives de la fenêtre si ≥ 400 (`disc_kcal_profile`) ;
- faits sommeil **de la fenêtre** : part du volume derrière nuits ≥ 7h30 (`sleep_concentration`) ; min/max profond vs durée (`sleep_deep_stable`) ;
- corrélation 7h30 sur `recent14` ; dose 8 h seulement en semaine (`vol8 && isWeek`) ;
- architecture, cardio×km, RPE, famille, charge de la veille ;
- jalons de **n’importe quel jour des 7** ; pesée au grain **8 jours** (pas chaque pesée) ;
- `disc_sleep_freq` : semaines à ≥ 4 nuits longues vs ≤ 2 — c’est un parcours, pas un total de semaine.

#### Données qu’on TAIT

- mois vs mois (`prev30` n’écrit pas `disc_volume_shape` month) ;
- *ces 30 jours totalisent* ;
- zones 8h / 7h30 / <7h30 (`disc_sleep_zones` : month+ seulement) ;
- déficit de **deux** nuits (`disc_sleep_delayed`) ;
- `disc_sleep_month` / `_quarter` / `_combo` (combo coupé en week) ;
- `disc_sleep_j2` (month+) ;
- première fois hors fenêtre ; régime fréquence 6 sem. vs 6 sem. (coupé en week, forme exo possible) ;
- mix 90/180 jours.

#### Colonnes

| Colonne | Contenu attendu |
|---------|-----------------|
| Maintenant | forme de la semaine, pic, nuit de focus, concentration sommeil-volume, profond |
| Trajectoire | seuil 7h30, architecture, cardio, socle d’exos, fade/mix si d30 le porte, pending_context si 0 reps (alors **30 j.** autour) |
| Parcours | freq nuits longues, ancre si la semaine ≥ 12 % du mois, kcal, best_month rarement |

`disc_peak_day` a `fit: 1` en week, `0.8` sinon : le pic est **le** signal de semaine.

---

### 5.3 30 jours (`30d` → voix `month`)

**Fenêtre.** 30 jours. Voix mois-like (span 21–40) : `comparableWeeklyRates` **a le droit** d’utiliser le taux de la fenêtre vs habitude.  
**Question.** *Comment mon entraînement récent évolue-t-il par rapport aux mois précédents ?*  
**Priorité Maintenant.** volume_shape → densité → muscle_now. Trajectoire : `disc_sleep_month` en tête.

#### Mots

On dit : *ces 30 jours*, *ce mois*, *du mois*, *le mois précédent*, *les 30 jours d'avant*, *le volume du mois dépasse / recule / reste proche*.  
On ne dit pas : *aujourd'hui* comme sujet du total ; *cette semaine concentre* ; *cette année*.

Titres `disc_volume_shape` (branche month, ≥ 200 reps) :

- pas de `prev30` assez fourni : *Le mois a un volume, un rythme et une composition*
- |Δ| < 8 % : *Le volume du mois reste proche du mois précédent*
- Δ > 0 : *Le volume du mois dépasse celui du mois précédent*
- Δ < 0 : *Le volume du mois recule par rapport au mois précédent*

Lectures collées (pas un jugement moral) :

- volume + et fréquence − : *les séances sont plus denses, pas plus nombreuses*
- volume − et fréquence stable : *La fréquence tient, mais chaque séance produit moins de répétitions*
- sinon : *La comparaison utile est donc mois contre mois précédent, pas un jugement isolé du total*
- pas de prev30 : *on lit le mois par son rythme interne … pas par un écart inventé*

Densité : *Le mois précédent était à X reps/h : ces 30 jours sont donc Y % plus/moins denses que les 30 jours d'avant* (référence = `prev30`, **pas** `d30`).

Sommeil : *Ton mois révèle un lien beaucoup plus robuste entre sommeil et volume* — on a le droit de dire « plus robuste » parce que n et concentration de fenêtre sont là. Zones : *Ton profil de récupération se précise en trois zones* (pas encore *Ton historique établit* — ça c’est long-voix).

#### Données dont on PARLE

- totaux 30 j. vs `prev30` (reps, jours, reps/séance) si prev30 ≥ 200 reps ;
- 28 j. suivis vs mois comparable **et** 7 derniers jours (*repartent* si Δ7 > 4 %) — c’est le mois, donc 7 j. = zoom interne, pas une autre plage ;
- muscles du mois vs mois d’avant (`disc_muscle_share_shift`, Δ part ≥ 18 %) ;
- fade de famille, cardio vs force, stimulus mix vs prev30 ;
- `disc_sleep_month` + concentration ; trio `disc_sleep_combo` (7 h 45 + efficacité ≥ 90 % + J-2) ; zones ; J-2 ; efficacité ; famille ; RPE ; cardio km ; perf lead ;
- meilleur mois **calendaire à l’intérieur des 30 j.** seulement s’il écrase vraiment (rare) ;
- jalons : premières fois si date = end ou ≤ **10** j. ; autres jalons toute la fenêtre ; pesée 30 vs 30, Δ ≥ 0,6 kg ;
- régime 6 semaines.

#### Données qu’on TAIT

- *cette séance* / *aujourd'hui* comme cadre du total ;
- `disc_sleep_night` (nuit unique vs 4 nuits : today/week) ;
- `disc_sleep_week` / `_deep` / `_volume` (remplacés par `_month`) ;
- `disc_sleep_delayed` (2 nuits courtes : long/year seulement) ;
- `disc_sleep_quarter` ;
- `disc_sleep_freq` (week ou long, pas month) ;
- `disc_pending_session` (emptyPeriod rare sur 30 j. sauf vrai trou) ;
- `disc_composition_not_volume` (today only) ;
- mix 1 an / 2 ans ;
- taux « séances / 30 × 7 » **sauf** via `comparableWeeklyRates` mois-like (là c’est volontaire).

`disc_vs_habit` : `fit: 0.62` — peut exister si un exo de la fenêtre dévie, mais la priorité now ne le met pas en tête. Souvent évincé.

#### Colonnes

| Colonne | Contenu attendu |
|---------|-----------------|
| Maintenant | mois vs mois d’avant, densité vs prev30, dominante musculaire |
| Trajectoire | sommeil-mois, structure, fade, RPE, combo trio, régime |
| Parcours | zones, J-2, best_month, progression d’exo si |Δ vs initial| ≥ 15 % |

---

### 5.4 3 mois (`3m` → voix `long`, unité trimestre)

**Fenêtre.** 92 jours. **Pas** mois-like → rythme cité = 28 j. vs 28 j., jamais 92/7.  
**Question.** *Quelle trajectoire suis-je réellement en train de construire ?*  
**Priorité Maintenant.** volume_shape → muscle_now → densité. Parcours : sleep_quarter, best_month, sleep_freq, delayed, j2, quarter_arc.

#### Mots

On dit : *cette période*, *de la période*, *le trimestre*, *les 30 derniers jours … contre … au début de la fenêtre*, *ton rythme comparable sur 28 jours … ce n'est pas le taux de la fenêtre entière*.  
Zones sommeil : *Ton historique établit trois zones de récupération* (`isLongVoice`).  
On ne dit pas : *ces 30 jours totalisent* comme s’ils étaient la plage ; *cette semaine* ; *0,6 → 4,5 séances/sem.* sur 92 j.

`disc_volume_shape` long : titre *Le trimestre a un volume et un rythme, pas seulement un total*. Seuil : ≥ 8 jours entraînés **et** ≥ 400 reps.

Densité : référence = **premier mois de la fenêtre** (`first30`), pas prev30 : *Le premier mois de la fenêtre était à X reps/h*.

`disc_quarter_arc` : *Le trimestre a une trajectoire interne, pas seulement un total* — 30 derniers (`d30`) vs 30 premiers (`first30`). Phrase de clôture : *Le long terme ici répond à « quelle trajectoire se construit », pas à une deuxième version du court terme.*

#### Données dont on PARLE

- totaux de **92 j.** (reps, jours, minutes si ≥ 40, muscles) ;
- rythme 28 vs 28 uniquement ;
- densités période vs first30 ;
- sommeil : volume (échantillon `all`), combo, architecture, cardio, zones, **delayed** (2 nuits), J-2, quarter (share des jours ≥ 300 derrière nuits ≥ 7h30), freq semaines ;
- best_month calendaire dans la fenêtre (un mois peut faire ≥ 38 % du trimestre) ;
- fade / share musculaire / cardio-force ;
- jalons premières fois ≤ **21** j. ; cumuls si le palier est franchi **dans** les 92 j. ; mix seulement si span ≥ 150 (92 < 150 → **pas** mix_shift).

#### Données qu’on TAIT

- `disc_sleep_night` / `_week` / `_deep` / `_month` / `_load` / `_intensity` / `_perf` / `_rpe` (RPE et charge veille : today–month seulement) ;
- pending de séance du jour ;
- vs_habit en tête ;
- exercice_base de semaine ;
- comparaison 92 vs 92 précédent (n’existe pas dans le code) ;
- `MIX_2Y`.

#### Colonnes

| Colonne | Contenu attendu |
|---------|-----------------|
| Maintenant | volume + rythme 28 j. + muscles du trimestre |
| Trajectoire | sommeil volume/combo/cardio, structure vs prev30, fade |
| Parcours | quarter_arc, zones, delayed, best_month, sleep_freq |

---

### 5.5 6 mois (`6m` → voix `year`, unité **semestre**)

Même mécanique que 3 mois (`isLongVoice`), avec le dictionnaire **semestre** :

- `thisPeriod` = **ces derniers mois** (pas « cette année ») ;
- `ofPeriod` = **de la période** ;
- `unit` = semestre ;
- `yearish` = false (span 183 < 300).

**Ce qui change concrètement vs 3 mois**

- priorité Parcours = table `year` : ajoute `disc_exercise_progress` (vs premières séances, |Δ| ≥ 15 %) ;
- plafonds max : 8 observations fortes (pas 6) pour ouvrir 2/4/3 ;
- `disc_ms_mix_shift` : voix year **et** span 183 ≥ 150 → **oui**, 90 premiers vs 90 derniers (`MIX_YEAR`, pas encore 180) ;
- régime / pesée 30 vs 30 / cumuls sur 183 j. beaucoup plus plausibles ;
- titres mix : *Sur cette période longue* (span < 300) / *Le mix d'entraînement a changé de profil*.

**Toujours interdit :** appeler ça « cette année » ; extraire un taux séances/sem. sur 183 j.

Sommeil : mêmes kinds long-voix. `disc_sleep_zones` titre *Ton historique établit trois zones*. Le corps dit encore parfois « Sur les 30 jours » pour les moyennes de zones (les paires corrélation sont lifetime) — le cadre de plage reste « ces derniers mois ».

---

### 5.6 1 an (`1y` → voix `year`, unité **année**)

`yearish` = true → *cette année*, *de l'année*, *année*.

**Ce qui change vs 6 mois**

- lexique année partout (`thisPeriod`, `ofPeriod`) ;
- mix : *Sur l'année* + *les 90 premiers jours contre les 90 derniers* ;
- parcours : progression d’exo prioritaire ; best_month plus fréquent (12 mois dans la fenêtre) ;
- cumuls 10k / 25k reps, 100 séances, 100 km deviennent des cartes `historic` possibles ;
- jalons première fois toujours ≤ 21 j. (un PR de juin n’apparaît pas en septembre sur *1 an* s’il a plus de 21 jours — **sauf** si ce n’est pas `firstAbsolute` : les PR « courants » sont éligibles sur **toute** la fenêtre year). Important : seules les *premières fois* sont bornées à 21 j. Un `disc_ms_pr` dans l’année peut donc remonter plus loin qu’un `disc_ms_first_exercise`.

**Interdit :** « tu t’entraînes X fois par semaine » calculé sur 365 jours ; zones présentées comme la nuit d’hier.

---

### 5.7 2 ans (`2y` → voix `year`, span 730)

Même lexique *cette année* / *de l'année* (`yearish` true dès 1y/2y/all, **pas** « ces deux années » dans `periodVoice` — le picker dit 2 ans, la voix dit encore « année »). La question interne `PERIOD_QUESTIONS['2y']` parle bien de *deux années*.

**Ce qui change vs 1 an**

- `disc_ms_mix_shift` : span ≥ 500 → type **`MIX_2Y`**, 180 premiers vs 180 derniers, titre *En deux ans, ton profil d'entraînement a changé*, *Sur deux ans* ;
- importance mix 0.96 (vs 0.94) ;
- davantage de cumuls / best_month / exercise_progress ;
- toujours pas de taux 730 j. × 7.

---

### 5.8 Tout (`all` → voix `year`, `start = null`)

Lexique *cette année* / *de l'année*. Question : *depuis tes premières saisies*.

**État runtime (trou).** Sans `start`, la mesure de période est vide, les nuits de fenêtre absentes, les jalons absents. Le système **ne suit donc pas vraiment** « tout l’historique » côté textes de période. Restent éventuellement les corrélations sommeil lifetime (Garmin chargé sur **365 j.** seulement) et le catalogue muscu lifetime.

Tant que ce trou n’est pas fermé : ne pas documenter *Tout* comme un 1 an élargi. Voir § 15.2.

---

### 5.9 Synthèse — parler / taire (toutes plages)

| Sujet | today | 7d | 30d | 3m | 6m | 1y | 2y |
|-------|:-----:|:--:|:---:|:--:|:--:|:--:|:--:|
| « cette séance / aujourd'hui » | oui | non (sauf un jour nommé) | non | non | non | non | non |
| « cette semaine » | non (sauf pending_context = d7) | oui | zoom 7 j. interne ok | non comme cadre | non | non | non |
| « ces 30 jours / le mois d’avant » | non comme cadre | non comme cadre | **oui, c’est le cadre** | 30 vs 30 du trimestre (arc) | id. | id. | id. |
| « cette période / trimestre » | non | non | non | oui | « ces derniers mois » | « cette année » | « cette année » + mix « deux ans » |
| Nuit unique vs 4 nuits | oui | oui | non | non | non | non | non |
| Concentration sommeil **de la fenêtre** | non | oui (week) | oui (month) | oui (quarter) | oui | oui | oui |
| 3 zones 8h / 7h30 | non | non | oui | oui | oui | oui | oui |
| 2 nuits courtes (delayed) | non | non | non | oui | oui | oui | oui |
| RPE 1–5 | si noté | si noté | si noté | non | non | non | non |
| km × sommeil | non | oui | oui | oui | oui | oui | oui |
| PR / première fois | jour J | 7 j. | premières ≤ 10 j. | premières ≤ 21 j. | ≤ 21 j. | ≤ 21 j. | ≤ 21 j. |
| Mix profil 90/180 j. | non | non | non | non (span 92) | 90 vs 90 | 90 vs 90 | 180 vs 180 |
| Taux séances/sem. fenêtre entière | interdit | ok (7 j.) | ok (mois-like) | interdit (→ 28 vs 28) | interdit | interdit | interdit |
| Phrase d’excuse données manquantes | jamais | jamais | jamais | jamais | jamais | jamais | jamais |

Les gabarits génériques (`continuity`, `volume_traj`) ne s’inventent un récit 28 j. **que si** Maintenant n’a déjà aucune découverte. Dès qu’un `disc_volume_shape` (ou pending, densité, nuit) est retenu, ces gabarits sont coupés : on ne mélange pas « tu t’entraînes moins souvent » avec un vrai portrait de plage.

---

## 6. Inventaire des données : disponibles vs utilisées

### 6.1 Ce qui existe dans le snapshot / Garmin (amont)

| Source | Contenu typique | Où ça vit |
|--------|-----------------|-----------|
| Coches muscu | `checkedExercises` + `reps` par date×exercice | snapshot workout |
| Charges | `exerciseWeights` (kg / e1RM) | snapshot |
| Minutes muscu | durée non-course des séances | calendrier + Garmin activités |
| Course | activités Garmin cardio + `enduranceData.running` | Garmin + snapshot |
| Pompes endurance | `enduranceData.sessions.pushups` | snapshot (id synthétique Recap) |
| GTG | `enduranceData.gtg` | snapshot |
| RPE / ressenti | `exerciseSessionPerceived` (échelle 1–5) | snapshot |
| Pesées | `progressEntries` (poids kg) | snapshot |
| Questionnaire | `profileQuestionnaireRaw` (street skill, `runningGoal`, `targetWeightKg`) | Auth / quiz |
| Garmin quotidien | `dailyMetrics[ymd]` : sommeil, RHR, HRV, Body Battery, kcal | `garminData` |
| Garmin activités | `activities.cardio` | `garminData` |

Le Recap **n’invente pas** de nuit, de RPE, de kg ou de kcal. Si le champ n’est pas là, le kind correspondant se tait.

### 6.2 Ce qui est toujours calculé, quelle que soit la plage

`buildPeriodComparisons` mesure **en parallèle** (même `end`) :

| Objet | Fenêtre | Rôle |
|-------|---------|------|
| `period` | fenêtre Recap exacte | volume / densité / muscles / pic **de la plage choisie** |
| `d7` | 7 derniers jours | habitude courte, contexte « séance en attente », densité vs semaine |
| `d30` | 30 derniers jours | habitude mensuelle, densité vs mois, arc trimestre (dernier mois) |
| `d90` | 92 derniers jours | portrait trimestre (peu utilisé en rédaction directe) |
| `prev30` | les 30 jours **avant** les 30 derniers | comparaison mois vs mois |
| `first30` | 30 premiers jours du trimestre (92 j. se terminant à `end`) | arc `disc_quarter_arc` |

Donc : sur *Aujourd’hui*, le moteur **connaît** déjà tes 7 et 30 derniers jours. Il ne les affiche que si un kind les utilise (ex. `disc_pending_context`, `disc_density` vs 30 j.).

Le **catalogue** `buildSessionCatalog` est lifetime jusqu’à `endYmd` : chaque jour entraîné (≥ reps cochées) avec exercices, minutes, **nuit D**, **nuit J-2**, RHR, reps de la veille.

Les **baselines d’exercices** (`buildExerciseBaselines`) sont lifetime jusqu’à `end`. C’est ce qui permet à *Aujourd’hui* de dire « tes tractions vs ton médian historique ».

### 6.3 Ce que chaque plage *utilise* vraiment

Légende : ● lu et rédigé pour cette voix · ○ calculé mais rarement rédigé · — non utilisé pour cette voix.

| Famille de signal | today | 7d | 30d | 3m | 6m / 1y / 2y |
|-------------------|:-----:|:--:|:---:|:--:|:------------:|
| Volume / séances de **la** fenêtre | ● | ● | ● | ● | ● |
| Densité reps/h de la fenêtre | ● | ● | ● | ● | ● |
| Muscles de la fenêtre | ● | ● | ● | ● | ● |
| Comparaison 7 j. vs fenêtre | ● | ○ | ● | ○ | ○ |
| Comparaison 30 j. vs 30 j. (`prev30`) | — | ○ | ● | ○ | ○ |
| Rythme 28 j. vs 28 j. (`comparableWeeklyRates`) | ○ | ○ | ● (fenêtre mois-like) | ● (source `28d`, **pas** le taux 92 j.) | ● |
| Pic de jour (`disc_peak_day`) | — | ● | ○ | ○ | ○ |
| Séance en attente (`disc_pending_*`) | ● | ● si 0 reps | — | — | — |
| Vs habitude d’un exo (`disc_vs_habit`) | ● | ○ | — | — | — |
| Séances comparables (`disc_comparable`) | ● | ● | ○ | ○ | ○ |
| Progression depuis les premières (`disc_exercise_progress`) | ○ | ○ | ○ | ○ | ● (priorité year) |
| Sommeil nuit unique vs 4+ nuits | ● | ● | — | — | — |
| Sommeil volume 7h30 (14 dernières / all) | ● | ● | ● (kind `month`) | ● | ● |
| Architecture / efficacité / famille | ● | ● | ● | ● | ● |
| Zones 8h / 7h30 / <7h30 | — | — | ● | ● | ● |
| Déficit répété / J-2 / trimestre sommeil | — | — | J-2 | ● | ● |
| RPE × sommeil | ● | ● | ● | — | — |
| Course × sommeil | — | ● | ● | ● | ● |
| Jalons « première fois » | si date = end | toute la semaine | ≤ 10 j. | ≤ 21 j. | ≤ 21 j. |
| Jalons cumuls / mix / régime | filtrés | filtrés | ● | ● | ● |
| Mix 1 an / 2 ans | — | — | — | si span ≥ 150 | ● |

**Comparaisons 28 j.** : dès que la fenêtre n’est **pas** « mois-like » (21–40 j.), `comparableWeeklyRates` refuse d’utiliser le taux de la fenêtre Recap. Sinon *3 mois* inventerait « 0,6 → 4,5 /sem. » à partir d’un −30 % de 28 j. Sur 3 mois / 1 an, le rythme cité est **28 jours vs 28 jours**, jamais « séances / 92 jours × 7 ».

### 6.4 Garmin sur la plage `all`

Dans `RecapTab`, le fetch Garmin de la vue Recap utilise :

```
startYmd: periodWindow.start ?? DateHelper.addDays(periodWindow.end, -365)
```

Donc **« Tout » ne charge que 365 jours de métriques quotidiennes**, pas tout l’historique Garmin. Les coches muscu du snapshot, elles, peuvent remonter plus loin (catalogue lifetime).

---

## 7. Mesure d’une fenêtre

`measureRecapWindow` produit un objet `period` (et les clones `d7` / `d30` / …).

### 7.1 Champs

| Champ | Origine | Condition |
|-------|---------|-----------|
| `totalReps` | `computeCalendarMonthSportStats.totalReps` (bandeau) sinon somme coches | même pile que le bandeau |
| `trainingDays` | stats calendrier, sinon jours avec reps | |
| `minutes` | `otherExerciseMinutes` (non-course) | 0 si pas de durée |
| `totalMinutes` | minutes d’activité (yc course) | |
| `activeKcal` | Garmin | silence si absent |
| `runningKm` / `runningMinutes` | même pile calendrier | |
| `repsPerHour` | `totalReps / minutes × 60` | **null** si minutes = 0 |
| `repsPerSession` | reps / jours de force | |
| `exercises[]` | agrégat coches + pompes endurance | |
| `muscles[]` / `byMuscle` | `computeRecapMuscleState` sur **cette** fenêtre (ou `recapState` si c’est la même) | |
| `pushReps` / `pullReps` / `upperReps` / `lowerReps` | groupes anatomiques | |
| `peakDay` | jour max de reps dans la fenêtre | |
| `repsByDate` / `exercisesByDate` | | |
| `firstSeen` / `lastSeenBefore` | première apparition lifetime / dernière avant `start` | sert émergence / vs habitude |

Les pompes de l’onglet Endurance sont injectées sous l’id `__recap_endurance_pushups__` **sauf** si elles sont déjà dans les totaux workout du jour.

### 7.2 Condition d’existence

```
if (!snapshot || !window.start || !window.end) return emptyMeasure(window)
```

Conséquence pour `all` : `start === null` → mesure période **vide** (0 reps, `spanDays` 0). Voir § 15.

### 7.3 Seuil « période vide »

`emptyPeriod = (p.totalReps || 0) < 20`. En dessous, le moteur ne décrit pas un « mois à zéro capacité » : il décrit une **séance / fenêtre en attente** (`disc_pending_session` + éventuellement `disc_pending_context` avec d7 ou d30).

---

## 8. Comment une analyse se forme

### 8.1 Constat, pas template

Le flux déclaré en tête de `recapPeriodDiscoveries.js` :

> données → comparaisons → constats → scoring → attribution d’angle.  
> La rédaction se fait à partir des constats retenus, pas d’un template Court/Moyen/Long dans lequel on injecte des chiffres.

Un `discovery({ kind, nature, family, title, body, evidence, weights, metrics })` a :

- un **score** = `importance × reliability × novelty × fit × 100` (sauf override) ;
- une **nature** déjà posée (`now` / `trajectory` / `journey`) ;
- une **famille** anti-doublon (deux kinds de la même famille : le second ne passe que si score ≥ 86).

### 8.2 Du constat à la carte

`buildHorizonEssayCandidates` **émet d’abord** tous les `selected` :

```js
(discoveryBundle.selected || []).forEach((d) => {
  emit(d.kind, d.title, d.body, d.evidence, d.relevance, {
    nature: d.nature,
    rewardTone: rewardToneForKind(d.kind)
  });
});
```

`emit` projette `nature → horizon` (`now→short`, `trajectory→medium`, `journey→long`).

Ensuite seulement, les **gabarits génériques** tournent (`continuity`, `volume_traj`, absence, programme, push_share, journey_progress, …). Ils sont **coupés** si une découverte de même angle existe déjà :

- `discCoversNow` → pas de `continuity` / `volume_traj` génériques ;
- `today` + 0 séance → pas de gabarit « maintenant » non plus.

C’est pour ça qu’une semaine avec un vrai `disc_volume_shape` n’affiche pas en plus « tu t’entraînes moins souvent ».

### 8.3 Pondération finale

`applyNoveltyWeights` (mémoire d’affichage) puis `applyNatureWeights` :

- tout `disc_*` : **+16** ;
- tout `disc_ms_*` : **+10** en plus ;
- phénomène contraction : boost `continuity`, malus `absence`.

`selectBalancedCandidates` ajoute encore **+14** si l’id contient `.disc_`, et pénalise le même groupe sémantique (−16) et le même pilier.

Résultat : les découvertes de période **gagnent** presque toujours les gabarits, tant qu’elles ont un texte ≥ 80 caractères.

### 8.4 Carte UI

`toInsightCard` lit `interpretation.context` : `title`, `body`, `evidenceLine`, `confidenceLabel`, `rewardTone`.  
`InsightColumn` affiche au plus **5** cartes (slice), avec bordure colorée selon le ton (§ 13.4). Une colonne sans item : phrase de silence, pas un faux constat.

---

## 9. Les trois colonnes, en détail

### 9.1 Maintenant (`now` → Court)

**Question.** Qu’est-ce qui caractérise *cette* période telle qu’elle est, maintenant — pas ce qu’elle « devrait » devenir.

Kinds typiques (nature `now`) :

| Kind | Idée | Voix où ça s’écrit |
|------|------|--------------------|
| `disc_pending_session` | 0 reps : séance / fenêtre en attente | today, week si vide |
| `disc_volume_shape` | volume, rythme, concentration des jours | today+week ; month (≥ 200 reps) ; long/year (≥ 8 j. et 400 reps) |
| `disc_density` | reps/h vs 7 j. / 30 j. | dès que minutes existent |
| `disc_sleep_night` | cette nuit vs ≥ 4 nuits récentes | today, week |
| `disc_sleep_week` | part du volume derrière nuits ≥ 7h30 | week |
| `disc_sleep_deep` | profond stable vs durée variable | week |
| `disc_peak_day` | un jour concentre le volume | week (≥ 3 exos + pic) |
| `disc_muscle_now` | dominante musculaire de la fenêtre | toutes (si ≥ 2 muscles, ≥ 80 reps identifiées) |
| `disc_exercise_share` | un exo pèse trop / structure la séance | today surtout |
| `disc_vs_habit` | exo du jour vs médiane historique | today |
| `disc_no_running` | charge 100 % renforcement | si course ≈ 0 et reps ≥ 80 |
| `continuity` / `volume_traj` | gabarits 28 j. | **seulement si aucune découverte now** |
| Jalons `disc_ms_first_session`, `_first_run`, `_pr`, `_return`, `_day_volume`, `_first_hour`, `_first_load`, `_pr_load`, `_pr_density`, `_pr_pace`, `_goal_run` | événement | selon `eligible` |

Sur **Aujourd’hui**, Maintenant est la colonne la plus dense : séance du jour, nuit D, vs habitude, éventuellement PR. Trajectoire et Parcours ne se remplissent que s’il existe déjà un historique (corrélation sommeil, progression d’un exo, ancre).

### 9.2 Trajectoire (`trajectory` → Moyen)

**Question.** Qu’est-ce qui *se construit* — un régime, une corrélation, un déplacement de structure — pas un total.

Kinds typiques :

| Kind | Idée | Voix |
|------|------|------|
| `disc_pending_context` | d7/d30 pendant que la séance n’est pas faite | today / week vide |
| `disc_sleep_volume` | ≥ 7h30 vs < 7h30 sur le volume | today, week (échantillon 14 séances si possible) |
| `disc_sleep_month` | même lien, rédigé en mois | month |
| `disc_sleep_assoc` | séparation ≥ 300 vs < 250 reps | week, month, today, long/year |
| `disc_sleep_architecture` | REM / éveil / BB avec le volume | week, month, long/year |
| `disc_sleep_efficiency` | ≥ 90 % à durée comparable | toutes voix |
| `disc_sleep_combo` | trio 7h45 + 90 % + J-2 | today, month, long/year |
| `disc_sleep_family` | poussée vs tirage après nuit < 7h | toutes voix |
| `disc_sleep_load` | nuit courte × séance lourde la veille | today, week, month |
| `disc_sleep_intensity` | reps/h × sommeil | today, week, month |
| `disc_sleep_cardio` | km × sommeil | week, month, long/year |
| `disc_sleep_perf` | mouvement le plus chargé × sommeil | today, week, month (si le volume ne domine pas) |
| `disc_sleep_rpe` | note 1–5 × sommeil | today, week, month — **silence sans notes** |
| `disc_muscle_reorient` / `_share_shift` / `_push_pull` / `_ratio_structure` | structure | week+ |
| `disc_exercise_base` | base d’exos de la semaine | week (≥ 3 exos) |
| `disc_emergence` | exo nouveau vs fenêtre | |
| `disc_composition_not_volume` | le mix change, pas le total | today |
| `disc_structural_memory` / `_stimulus_mix` / `_family_fade` / `_cardio_strength` | mémoire de stimulus | month / long |
| `disc_comparable` | mêmes mouvements, séances jumelles | |
| Jalons `_goal`, `_weight`, `_regime`, `_week_freq`, `_sleep_combo`, `_event_combo`, `_return_durable`, `_pr_consolidated`, `_first_exercise` | construction | |

### 9.3 Parcours (`journey` → Long)

**Question.** Qu’est-ce qui n’existe *que* parce qu’il y a un avant.

Kinds typiques :

| Kind | Idée | Voix |
|------|------|------|
| `disc_anchor` | exo / rythme qui ancre le profil | toutes |
| `disc_repertoire` | largeur du répertoire | |
| `disc_freq_continuity` | continuité de fréquence vs identité | |
| `disc_kcal_profile` | kcal actives comme signature | week+ |
| `disc_quarter_profile` / `_quarter_arc` | premier mois du trimestre vs dernier | long/year |
| `disc_exercise_progress` | vs premières séances comparables (≥ 15 %) | priorité year |
| `disc_best_month` | un mois calendaire concentre le volume | month+ (plusieurs mois dans la fenêtre) |
| `disc_sleep_zones` | 3 zones 8h / 7h30 / <7h30 | month, long/year |
| `disc_sleep_delayed` | 2 nuits courtes vs 2 nuits longues | long/year |
| `disc_sleep_j2` | nuit D-1 courte malgré nuit D ok | month, long/year |
| `disc_sleep_freq` | semaines à ≥ 4 nuits longues → plus de jours actifs | week, long/year |
| `disc_sleep_quarter` | nuits ≥ 7h30 et jours ≥ 300 reps | long/year |
| Jalons `_cumul`, `_sessions`, `_km`, `_hours`, `_mix_shift` | paliers historiques | |

Les gabarits `journey_progress` / `journey_pr_vs_level` / `journey_milestones` du moteur *athleteJourney* ne s’ajoutent que si Parcours n’est pas déjà couvert par des `disc_*`.

---

## 10. Matrice plage × voix × kinds

Résumé kinds × colonne. Le fonctionnement réel (mots, données parlées / tues) est au **§ 5**.

Comment **se forment** les analyses selon le couple (période Recap, terme).

### 10.1 Aujourd’hui × Maintenant

Mesure : 1 jour. Si < 20 reps → `disc_pending_session` (la nuit D peut déjà être citée : « la récupération précède la séance »). Si séance faite : `disc_volume_shape` (volume du jour + minutes) + souvent `disc_density` + `disc_sleep_night` (nuit vs ≥ 4 nuits) + `disc_vs_habit` / `disc_exercise_share`. Jalons du **jour même** seulement (`eligible` today = `date === window.end`).

### 10.2 Aujourd’hui × Trajectoire

Pas de « semaine vs semaine » inventée. Typiquement : `disc_pending_context` (forme des 7 derniers jours) **ou** corrélations sommeil déjà publiables (volume 7h30 sur l’historique, trio, efficacité, famille, RPE). Le texte ancre *aujourd’hui* dans la zone historique (« tu es du côté des nuits longues »).

### 10.3 Aujourd’hui × Parcours

Souvent vide, et c’est normal. Peut se remplir avec `disc_anchor`, `disc_repertoire`, `disc_exercise_progress` si l’historique lifetime le justifie — ce n’est pas « depuis tes débuts aujourd’hui », c’est « ce que cette séance dit de ton parcours ».

### 10.4 7 jours

Maintenant : forme de la semaine (`disc_volume_shape`), pic de jour, nuit de la semaine, concentration du volume derrière peu de nuits (`disc_sleep_week`), profond stable (`disc_sleep_deep`).  
Trajectoire : seuil 7h30 (échantillon `recent14` préféré), architecture, cardio×sommeil, mix d’exos.  
Parcours : `disc_sleep_freq`, ancre, kcal, meilleur mois si la fenêtre le permet (rare sur 7 j.).  
Jalons : **toute date dans la fenêtre**.

### 10.5 30 jours

Maintenant : mois vs `prev30` (même kind `disc_volume_shape`, rédaction différente). Densité, muscles.  
Trajectoire : `disc_sleep_month` (le lien volume/sommeil devient « plus robuste »), fade de famille, cardio/force, share musculaire vs mois précédent.  
Parcours : zones de sommeil, J-2, meilleur mois, progression d’exo.  
Jalons première fois : date = end **ou** ≤ 10 jours.

### 10.6 3 mois (voix `long`)

Maintenant : volume du trimestre **sans** comparer 92 j. à 92 j. Le rythme cité est 28 j. vs 28 j.  
Trajectoire : volume sommeil (échantillon `all`), cardio, mix, architecture.  
Parcours : `disc_sleep_quarter`, `disc_sleep_delayed`, `disc_quarter_arc` (30 derniers vs 30 premiers du trimestre), `disc_best_month`.

### 10.7 6 mois / 1 an / 2 ans (voix `year`)

Même famille que `long`, avec :

- priorité Parcours qui inclut `disc_exercise_progress` ;
- jalon `disc_ms_mix_shift` : 90 premiers vs 90 derniers jours (1 an) **ou** 180 vs 180 si span ≥ 500 (2 ans, type `MIX_2Y`) ;
- besoin de **8** observations fortes (au lieu de 6) pour ouvrir les plafonds max.

### 10.8 Tout (`all`)

Voix `year`, mais `window.start === null` → mesure période vide côté `measureRecapWindow`. Les analyses de *période* (volume_shape, muscles de fenêtre, nuits *dans* la fenêtre) ne partent pas. Restent utilisables : catalogue lifetime, baselines, corrélations sommeil (si Garmin 365 j. fournit ≥ 8 paires), jalons **si** `detectRecapMilestones` a un `start` — or il exige `window.start`, donc **aucun jalon** sur `all` tant que start est null. Voir § 15.

---

## 11. Sommeil — traitement particulier

Le sommeil n’est **pas** un pilier Recap parmi d’autres. Il a trois couches, et aucune n’écrit « pas assez de données de sommeil ».

### 11.1 Convention calendaire (non négociable)

Alignée sur le calendrier Garmin / Recap jour :

- **Nuit de D** = nuit qui **se termine le matin D** = récupération **avant** la séance D.
- **J-2** = nuit qui se termine le matin **D−1** (calendaire), **pas** « la séance précédente ».

On ne décale jamais d’un jour « pour que ça colle mieux ».

### 11.2 Couche 1 — extracteur (`recapSleepNight.js`)

`extractSleepNight(garminData, ymd)` lit `dailyMetrics[ymd].sleep` (aliases duration / deep / rem / light / awake, heures ou minutes).

Règles :

- total < **90 min** → `null` (sieste / bruit, pas une nuit) ;
- pas d’objet sleep → `null` ;
- pas de placeholder. `extractSleepNightsInWindow` **omet** les dates sans nuit.

Champs possibles (tous optionnels sauf `hours` / `totalMin`) : profond, léger, REM, éveil, efficacité (0–100), HR sommeil, RHR, HRV, Body Battery (start / end / charged), horaires.

`sleepNightIsInformative` : hours ≥ 1,5.

### 11.3 Couche 2 — corrélation (`recapSleepCorrelation.js`)

`pairSessionsWithNights(catalog)` : séances du catalogue avec `hours >= 1.5`.

`publishSleepCandidates(catalog)` :

- si **< 8 paires** → `[]` (rien, pas un texte) ;
- sinon calcule des candidats **internes** (pas encore rédigés) :
  - volume ≥ 7h30 (`all` + `recent14` si > 14 paires, `minEach` assoupli à 3) ;
  - volume ≥ 8h (`minEach` 3) ;
  - zones 8h / 7h30–8h / <7h30 ;
  - séparation séances ≥ 300 vs < 250 ;
  - architecture (REM, éveil, BB) selon volume ;
  - déficit retardé (2 nuits courtes) ;
  - efficacité contrôlée à durée comparable (≥ 90 %) ;
  - sensibilité famille poussée/tirage ;
  - lag J-2 ;
  - triple condition (7h45 + 90 % + J-2 ≥ 7h30) ;
  - interaction charge de la veille ;
  - densité reps/h ;
  - perf du mouvement le plus chargé ;
  - RPE 1–5 (`meanDifficultyByDate`) — **absent si aucune note** ;
  - km course (`collectRunDays`).

`publishable(aN, bN, delta, base)` : au moins **4** observations de chaque côté (sauf overrides), et soit **≥ 12 %** d’écart relatif, soit **≥ 35** reps d’écart absolu. En dessous : le candidat n’existe pas.

`publishWindowSleepFacts` : faits **de la fenêtre Recap** (concentration du volume, profond stable, share des jours ≥ 300, fréquence hebdo de nuits longues). Utilisé pour `disc_sleep_week` / `_deep` / `_quarter`.

### 11.4 Couche 3 — rédaction seulement si voix + candidat

Détecté dans `detectDiscoveries` **et** gardé par `isToday` / `isWeek` / `isMonth` / `isLongVoice`. Un candidat « zones » existe toujours dans l’historique dès 8 paires ; il **n’est rédigé** qu’en voix month ou long/year.

Table voix → kinds sommeil :

| Kind | today | week | month | long/year |
|------|:-----:|:----:|:-----:|:---------:|
| `disc_sleep_night` | ● | ● | — | — |
| `disc_sleep_volume` | ● | ● | — (remplacé par `_month`) | ● |
| `disc_sleep_month` | — | — | ● | — |
| `disc_sleep_week` | — | ● | — | — |
| `disc_sleep_deep` | — | ● | — | — |
| `disc_sleep_assoc` | ● | ● | ● | ● |
| `disc_sleep_architecture` | — | ● | ● | ● |
| `disc_sleep_efficiency` | ● | ● | ● | ● |
| `disc_sleep_combo` | ● | — | ● | ● |
| `disc_sleep_family` | ● | ● | ● | ● |
| `disc_sleep_zones` | — | — | ● | ● |
| `disc_sleep_delayed` | — | — | — | ● |
| `disc_sleep_load` | ● | ● | ● | — |
| `disc_sleep_intensity` | ● | ● | ● | — |
| `disc_sleep_cardio` | — | ● | ● | ● |
| `disc_sleep_perf` | ● | ● | ● | — |
| `disc_sleep_rpe` | ● | ● | ● | — |
| `disc_sleep_freq` | — | ● | — | ● |
| `disc_sleep_quarter` | — | — | — | ● |
| `disc_sleep_j2` | — | — | ● | ● |

`disc_sleep_night` exige en plus : nuit du focus + `summarizeRecentNights` avec **n ≥ 4**. Focus = `end` en voix today, sinon jour de pic ou `end`.

Sur today/week, `disc_sleep_volume` préfère l’échantillon **`recent14`** (les 14 dernières paires), pas tout l’historique : la relation doit rester *actuelle*.

### 11.5 Ce que le sommeil ne fait pas

- Pas de phrase « connecte Garmin pour le sommeil ».
- Pas d’analyse RPE sans notes 1–5.
- Pas d’efficacité sans champ efficacité Garmin.
- Pas de Body Battery inventé.
- `disc_sleep_assoc` de repli (par exercice, via `computeSleepPerformanceAssociation`) ne s’écrit que s’il n’y a **pas** déjà un `vol75` : on ne double pas le même constat.

### 11.6 Nuit aussi dans les textes sport

Même hors kinds `disc_sleep_*`, une nuit informative peut **accrocher** un texte existant :

- `disc_pending_session` : « la nuit qui se termine ce matin est déjà là » ;
- `disc_density` : phrase ajoutée « la nuit associée fait partie de cette lecture » (today/week) ;
- `disc_best_month` : `monthSleepExplain` si le mois calendaire a ≥ 8 nuits.

---

## 12. Jalons — moteur événementiel

Fichier : `src/utils/sport/recapMilestoneEngine.js`. Préfixe **`disc_ms_`**.

### 12.1 Rôle

Complément du moteur **analytique**. Un jalon n’est pas une moyenne, c’est un **événement daté** (première fois, retour, PR, palier de cumul, objectif atteint).

Règle produit : **supplément uniquement**. Dans `selectPeriodDiscoveries`, `take()` **refuse** les jalons. Ils n’entrent que dans une passe *extra* : **+1 slot par angle**, au-dessus des caps de base, score ≥ 52. Ils n’évincient pas `disc_volume_shape`.

À la sélection UI, la présence d’un `disc_ms_` dans les candidats ouvre les caps **3 / 4 / 3** (`NATURE_COLUMN_CAPS_WITH_MILESTONES`) au lieu de 2 / 3 / 2.

### 12.2 Éligibilité temporelle (`eligible`)

Un jalon dont la date est hors fenêtre Recap est ignoré (`inWindow` exige start **et** end).

Ensuite, selon la voix :

| Voix | Première fois (`firstAbsolute`) | Autres jalons |
|------|---------------------------------|---------------|
| `today` | date === `window.end` | idem |
| `week` | toute date dans la fenêtre | toute la fenêtre |
| `month` | end **ou** ≤ 10 jours | toute la fenêtre |
| `long` / `year` | ≤ **21** jours pour une première | toute la fenêtre |

Un PR d’il y a 3 semaines peut donc apparaître en *3 mois*, pas en *Aujourd’hui*. Une première séance lifetime n’apparaît sur *Aujourd’hui* que si elle a lieu **aujourd’hui**.

### 12.3 Catalogue des jalons

#### Premières fois

| Kind | Nature | Déclencheur |
|------|--------|-------------|
| `disc_ms_first_session` | now | première séance catalogue ≥ 20 reps, éligible |
| `disc_ms_first_exercise` | now si today, sinon trajectory | première apparition d’un exo (≥ 8 reps), le plus volumineux du jour |
| `disc_ms_first_run` | now | première sortie course (≥ 0,6 km ou ≥ 8 min) |
| `disc_ms_first_hour` | now | première séance ≥ 60 min |
| `disc_ms_first_load` | now | première charge kg saisie |

#### Retours

« Longtemps » n’est **pas** un simple écart calendaire. `isMeaningfulAbsence(gap, medianInterval)` :

- gap < 14 j. → jamais ;
- si médiane d’intervalle ≥ 7 j. : il faut ratio ≥ 2,2 **et** (ratio ≥ 2,5 **ou** gap ≥ 60). Un écart de 40 j. avec une habitude à 45 j. → **silence** ;
- sinon (pas assez d’historique d’intervalles) : gap ≥ 31 j.

Classes d’étiquette (`absenceClass`) : éloignée / longue / très longue / historique / retour historique. C’est du vocabulaire, pas le filtre.

| Kind | Nature | Cible |
|------|--------|-------|
| `disc_ms_return` | now | exercice |
| `disc_ms_return_run` | now | course |
| `disc_ms_return_gtg` | now | GTG |
| `disc_ms_return_durable` | trajectory | le retour **tient** : ≥ 3 séances depuis le retour, J+12 à J+50 (semaine : pas au-delà de 50 j.) |

Pas de durable sur voix `today`.

#### Records (PR)

| Kind | Nature | Mesure |
|------|--------|--------|
| `disc_ms_pr` | now | max reps d’un exo (pas un one-off isolé si non consolidé) |
| `disc_ms_pr_consolidated` | trajectory | le nouveau niveau est reproduit |
| `disc_ms_pr_density` | now | max reps/h de séance |
| `disc_ms_pr_pace` | now | meilleure allure course |
| `disc_ms_pr_load` | now | charge / e1RM (Epley) |

#### Cumuls (paliers franchis **dans** la fenêtre)

Seuils :

- reps : 100, 500, 1 000, 5 000, 10 000, 25 000, 50 000, 100 000 → `disc_ms_cumul` (journey)
- séances : 10, 25, 50, 100, 250, 500 → `disc_ms_sessions` (journey)
- km : 10, 50, 100, 250, 500 → `disc_ms_km` (journey)
- heures : 10, 25, 50, 100, 250 → `disc_ms_hours` (journey)
- volume d’un **jour** : 300, 500 reps → `disc_ms_day_volume` (now)

#### Objectifs (questionnaire)

| Kind | Nature | Source |
|------|--------|--------|
| `disc_ms_goal` | trajectory | street skill tractions (reps cibles) |
| `disc_ms_goal_run` | now | `runningGoal` 5k / 10k / semi / marathon, distance du jour |
| `disc_ms_goal_weight` | trajectory | `targetWeightKg` vs pesées |

Sans objectif quiz, silence. Pas de « tu n’as pas d’objectif ».

#### Poids (`disc_ms_weight`, trajectory)

- première pesée ;
- grain **8 jours** en voix week (pas une pesée quotidienne commentée) ;
- 30 j. vs 30 j. en month/long/year ;
- Δ affiché seulement si **≥ 0,6 kg**.

#### Régime (`disc_ms_regime`, trajectory)

Pas sur `today`. Deux formes :

1. Un exercice devient régulier sur ~6 semaines (rare en intro, fréquent ensuite, delta de taux ≥ 0,18).
2. Sinon (pas week) : fréquence globale 6 sem. vs 6 sem. d’avant, |Δ| ≥ 25 %.

#### Mix (`disc_ms_mix_shift`, journey)

Voix `year`, ou `long` avec span ≥ 150, et span ≥ 150. Compare les 90 (ou 180 si span ≥ 500) premiers jours aux 90/180 derniers. Minimum **600** reps de chaque côté. Type `MIX_YEAR` ou `MIX_2Y`.

#### Combos

| Kind | Nature | Idée |
|------|--------|------|
| `disc_ms_sleep_combo` | trajectory | un jalon du jour coïncide avec une des meilleures nuits (≥ 7h30, parmi le P75, efficacité ≥ 88 si connue) — **rencontre datée**, pas une corrélation |
| `disc_ms_event_combo` | trajectory | un seul combo retenu : PR×densité, ou retour×habitude ≥ 88 %, ou PR×nuit haute, ou objectif×régime, ou poids×volume tenu |

`disc_ms_week_freq` : semaine à fréquence notable (trajectory).

### 12.4 Ce que les jalons ne font pas

- Ils ne remplissent pas une colonne à la place du volume.
- Ils ne se multiplient pas : un kind = au plus une carte (dédup dans `selectPeriodDiscoveries`).
- Retour « parce que 3 semaines » sans rupture d’habitude → silence.
- `detectRecapMilestones` retourne `[]` si pas de `window.start` (plage `all` aujourd’hui).

---

## 13. Plafonds, rivaux, mémoire, couleurs

### 13.1 Caps découvertes (`observationCaps`)

Base **toutes voix** : now 2 / trajectory 3 / journey 2.

Max si assez d’observations score ≥ 72 :

| Voix | Seuil « assez » | Max now / traj / journey |
|------|-----------------|--------------------------|
| today | 6 | 2 / 3 / 2 (inchangé) |
| week | 6 | 2 / 3 / 3 |
| month | 6 | 2 / 4 / 2 |
| long | 6 | 2 / 3 / 3 |
| year | **8** | 2 / 4 / 3 |

Un slot *au-delà de la base* n’accepte qu’un kind **prioritaire** de la voix, score ≥ 72.

Jalons : +1 par angle sur la **base**, indépendamment du max.

### 13.2 Caps UI (`columnCapsForCandidates`)

Sans jalon dans le pool : 2 / 3 / 2.  
Avec au moins un `disc_ms_` : **3 / 4 / 3**.

L’UI slice encore à 5. Dans la pratique on reste sous les caps.

### 13.3 Rivaux (`DISCOVERY_RIVALS`)

Un seul kind d’un groupe rivaux par sélection. Exemples :

- `disc_sleep_volume` ↔ `disc_sleep_assoc` ↔ `disc_sleep_combo` ↔ `disc_sleep_month` ↔ `disc_sleep_perf`
- `disc_sleep_delayed` ↔ `disc_sleep_j2`
- `disc_sleep_architecture` ↔ `disc_sleep_deep`
- `disc_sleep_zones` ↔ `disc_sleep_quarter` ↔ `disc_quarter_profile`
- `disc_muscle_now` ↔ `disc_push_pull` ↔ `disc_ratio_structure`

C’est pour éviter trois cartes qui disent la même chose avec des seuils différents.

### 13.4 Mémoire (`memoryFactor` + `insightNoveltyStore`)

Un kind déjà montré récemment (thèmes `short.{kind}` + `medium.{kind}` + `long.{kind}`) voit son score multiplié (jusqu’à 0,12 pour les « first » jalons, 0,15 mix, 0,22 autres jalons répétés, 0,42 pour un kind sport vu ≥ 2 fois). Les colonnes **changent** d’une visite à l’autre si le pool le permet. Ce n’est pas un RNG : c’est une pénalité de répétition.

Signature persistée : période + fenêtre + km + streak + hash des candidats. Si elle change, l’historique d’affichage est mis à jour.

### 13.5 Tons de récompense (couleur de carte)

`rewardToneForKind` → bordure gauche dans `RecapAnalyseView` :

| Ton | Couleur | Kinds |
|-----|---------|-------|
| `daily` | vert émeraude | volume, densité, gabarits du jour |
| `jalon` | bleu ciel | presque tous les `disc_ms_*` |
| `discovery` | violet | `disc_sleep_*`, émergence, comparable, rest_assoc, best_month |
| `transformation` | orange | mix_shift, régime, mémoire structurelle, fade, share shift, stimulus mix, quarter_arc |
| `historic` | rose / rouge | première séance, première course, cumuls reps/séances/km/heures |

Le ton n’est **pas** un quota. C’est un signal visuel, pas un 5ᵉ horizon.

---

## 14. Fichiers concernés

Tous les chemins sont sous `src/` sauf mention.

### 14.1 Entrée UI et plage

| Fichier | Rôle pour Court / Moyen / Long |
|---------|--------------------------------|
| `components/tabs/RecapTab.jsx` | Picker de plage (localStorage), `getRecapDateWindow`, passe `period` + `periodWindow` + snapshot + Garmin à `useRecapTabMetrics`. Pour `all`, lookback Garmin 365 j. |
| `utils/sport/recapViewPeriods.js` | IDs `today`…`all`, labels i18n. |
| `utils/sport/recapMuscleLoadEngine.js` | `getRecapDateWindow`, `isDateInRecapWindow` (`start == null` ⇒ tout jusqu’à `end` pour le 3D), `computeRecapMuscleState` (muscles de la fenêtre, `recapState.window`). |
| `hooks/useRecapTabMetrics.js` | Orchestre assessment + enrichment + **`buildAdaptiveRecapInsights`**. Fusionne `insights` dans l’assessment. Idle / timeout pour ne pas figer l’UI. |
| `components/sport/recap/views/RecapAnalyseView.jsx` | Trois `InsightColumn` (shortTerm / mediumTerm / longTerm), tons de bordure, panneau DEV (`RecapTrainingStateDebugPanel`). Les autres panneaux (highlights, benchmarks, programme) sont **hors** de ce document. |
| `utils/translations.js` | `recap.assessment.horizonShort/Medium/Long`. |

### 14.2 Pipeline d’interprétation

| Fichier | Rôle |
|---------|------|
| `utils/sport/recapAdaptiveInsights.js` | Point d’entrée Analyse. Nouveauté, caps UI, `selectBalancedCandidates`, `toInsightCard`. Bonus +14 aux ids `.disc_`. |
| `utils/sport/recapInterpretationPipeline.js` | Assemble état athlète, phénomènes, journey, **periodDiscoveries**, events, essays. Filtre `isColumnInterpretation` (texte ≥ 80, pas les comparaisons hiérarchiques). |
| `utils/sport/recapHorizonEssays.js` | Émet les discoveries retenues, puis gabarits `continuity` / `volume_traj` / programme / journey **seulement** si l’angle n’est pas déjà couvert. `comparableWeeklyRates` pour ne pas mentir sur 3 mois. |
| `utils/sport/recapPeriodDiscoveries.js` | **Cœur.** Voix, questions, mesure, détection de tous les `disc_*` et appel jalons, priorité, rivaux, `selectPeriodDiscoveries`, `buildPeriodDiscoveryBundle`. ~2 600 lignes. |
| `utils/sport/recapInsightNature.js` | `KIND_NATURE`, projection nature→horizon, caps 2/3/2 vs 3/4/3, `rewardToneForKind`, `comparableWeeklyRates`, `applyNatureWeights`. |

### 14.3 Données personnelles et stimulus

| Fichier | Rôle |
|---------|------|
| `utils/sport/recapPersonalBaselines.js` | Catalogue séances lifetime (`buildSessionCatalog`) : reps, minutes, **nuit D + J-2**, RHR, prevDayReps. Baselines d’exercices, séances comparables, assoc sommeil/repos par exo, `sleepContextForDate`. |
| `utils/sport/recapStimulusCatalog.js` | Familles (poussée / tirage / jambes / tronc) **par nom**, mix, fade. Id catalogue ≠ nom Recap (`Dips` = poussée). |
| `utils/sport/athleteTrainingIdentity.js` | Rythme habituel (séances/sem.), bande de variabilité. Sert `disc_volume_shape` et les gabarits continuity. |
| `utils/sport/athleteJourney.js` | Parcours / paliers / dédup — gabarits long terme si pas déjà couverts par `disc_*`. |
| `utils/sport/trainingPhenomenonEngine.js` | Contraction, spécialisation, etc. Pondère continuity vs absence. |
| `utils/sport/userTrainingState.js` | État déterministe (fréquence, volume 7/28, fatigue unknown si pas de signal). |
| `utils/calendarMonthSportStats.js` | Minutes, kcal, course, reps bandeau — **même pile** que le bandeau Recap. |

### 14.4 Sommeil

| Fichier | Rôle |
|---------|------|
| `utils/sport/recapSleepNight.js` | Extracteur unique. Null si < 90 min. Aucune analyse. |
| `utils/sport/recapSleepCorrelation.js` | Paires, `publishable`, candidats internes, faits de fenêtre, formatters heures/minutes, `collectRunDays`. Silence si n trop petit. |

### 14.5 Jalons

| Fichier | Rôle |
|---------|------|
| `utils/sport/recapMilestoneEngine.js` | `detectRecapMilestones`, `isMilestoneKind`, `isMeaningfulAbsence`, timelines course / GTG / poids, PR charge Epley, objectifs quiz, combos, mix 1 an / 2 ans. |

### 14.6 Mémoire, thèmes, rendu

| Fichier | Rôle |
|---------|------|
| `utils/sport/insightNoveltyStore.js` | Historique d’affichage, signature. |
| `utils/sport/insightNoveltyEngine.js` | `applyNoveltyWeights`. |
| `utils/sport/insightSemanticThemes.js` | Groupes anti-répétition (`reading_continuity`, sleep, etc.). |
| `utils/sport/interpretationRenderer.js` | Assemble le paragraphe final + contexte title/body/evidence. |
| `components/sport/recap/RecapTrainingStateDebugPanel.jsx` | DEV : liste `periodDiscoveries.all` vs `selected`, voix, question. Pas montré en prod hors admin. |

### 14.7 Tests (contrat)

Sous `utils/sport/__tests__/` notamment :

- `recapPeriodDiscoveries.test.js` — voix, pending, volume_shape, sommeil, caps ;
- `recapHorizonEssays.test.js` — pas de rythme 3 mois vs 3 mois, contraction en Maintenant ;
- `recapInsightNature.test.js` — natures, 28 j. ;
- `recapSleepNight.test.js` / corrélation ;
- `recapMilestoneEngine.test.js` — absence significative, extra slots, mix 2 ans, objectifs.

Si un kind change de voix ou de seuil, c’est ici que le contrat se lit.

---

## 15. Règles de silence et cas limites

### 15.1 Silence volontaire

| Situation | Comportement |
|-----------|--------------|
| Colonne sans candidat assez lourd | *Aucun signal assez robuste.* |
| Nuit absente / < 90 min | Pas de `disc_sleep_*` ; pas de phrase d’excuse |
| < 8 paires séance×nuit | `publishSleepCandidates` = `[]` |
| RPE non noté | pas de `disc_sleep_rpe` |
| Minutes d’exo absentes | `repsPerHour` null → pas de `disc_density` |
| Objectif quiz absent | pas de `disc_ms_goal*` |
| Retour trop proche de l’habitude | pas de `disc_ms_return*` |
| Δ poids < 0,6 kg | pas de commentaire de pesée |
| Période < 20 reps | pending, pas « tu as régressé » |

Une métrique seule n’est pas une analyse (`recapInterpretationPipeline.js`). Exception : événement assez fort (PR, première fois).

### 15.2 Plage `all` (état actuel du code)

`getRecapDateWindow('all')` → `{ start: null, end }`.

Conséquences Analyse :

- `measureRecapWindow` exige `start` → **mesure vide** → `emptyPeriod` vrai → `disc_pending_session` possible même avec un historique énorme ;
- `extractSleepNightsInWindow` exige `start` → **aucune nuit de fenêtre** ;
- `detectRecapMilestones` exige `start` → **aucun jalon** ;
- le catalogue lifetime et les corrélations (si Garmin 365 j. a ≥ 8 paires) peuvent encore produire des `disc_sleep_*` **hors** faits de fenêtre.

C’est un trou d’implémentation, pas un choix produit documenté par ailleurs. Le 3D Recap, lui, gère `start == null` (`isDateInRecapWindow`).

### 15.3 Identifiants exercice vs nom

Le scoring familles / fade / jalons de mouvement passe par **`familyOfExercise(nom)`**, pas par l’id catalogue. « Dips » côté catalogue ≠ « dips » Recap (poussée). Les analyses ne doivent pas relier un id quiz à un nom Recap sans passer par le nom résolu (`getExerciseNameById` / `resolveExerciseNameForRecap`).

### 15.4 Déterminisme

Pas de LLM. Même snapshot + même période + même historique d’affichage → mêmes cartes (la signature hashée fait varier un tie-break de 0–5 points, pas le fond). Les colonnes vides sont un résultat, pas un bug.

---

## Annexe A — Mapping nature → colonne (rappel)

```
KIND_NATURE[kind]  →  now | trajectory | journey
horizonForNature   →  short | medium | long
UI                 →  shortTerm | mediumTerm | longTerm
```

Kind inconnu → `trajectory` (Moyen) par défaut. D’où l’importance d’enregistrer tout nouveau kind dans `KIND_NATURE`.

## Annexe B — Comparaisons toujours en mémoire

Même sur *Aujourd’hui*, le moteur a déjà :

- `d7`, `d30`, `d90`, `prev30`, `first30` ;
- le catalogue jusqu’à hier + aujourd’hui ;
- les baselines d’exos ;
- éventuellement ≥ 8 paires sommeil.

Ce qui s’affiche n’est qu’un **sous-ensemble** filtré par la voix et les caps. Lire `periodDiscoveries.all` vs `selected` dans le panneau DEV pour voir ce qui a été détecté puis écarté (rivaux, score, famille, extra jalons).
