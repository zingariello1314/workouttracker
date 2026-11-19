# Onglet Analyse — architecture, module du haut, évolution

**Date :** 2026-11-18  
**Périmètre :** Sport → Récap → vue **Analyse**, et en particulier le module du haut (« Récap sur la période ») plus les cartes d’analyses qui changent avec la plage.  
**Méthode :** code actuel, dossiers `moteur analyse v0 / v1 / v2`, puis recette dans l’app déjà ouverte sur `http://localhost:3001/` (compte connecté, onglet Recap → Analysis), le 18 novembre 2026 vers 17 h 40–17 h 50. Les chiffres de la section 12 sont ceux de cet écran, pas une fixture.  
**État moteur :** dernière session d’implémentation consignée le **2026-11-04** (v2). Le code lu le 18 novembre confirme cette architecture, avec quelques écarts par rapport à la cartographie du 2 novembre (section 8).

---

## 1. Où on en est

L’onglet Analyse n’est pas un tableau de bord figé. C’est deux lectures de la **même plage**, peintes l’une au-dessus de l’autre :

1. **Le module du haut** (« Récap sur la période ») compte ce qui s’est passé dans la fenêtre : bande de jours, répétitions, jours d’entraînement, minutes, kilos, kilocalories. Il ne choisit pas une interprétation. Il agrège.
2. **La grille de cartes** en dessous propose des lectures rédigées (activité, progression, sommeil, rythme, répertoire, alerte). Le moteur décide lesquelles méritent d’être dites *pour cette durée-là*, avec une question, une voix, une baseline et des plafonds qui changent avec la plage.

Changer Aujourd’hui / 7 j. / 30 j. / 3 mois / 6 mois / 1 an / 2 ans / Tout le suivi ne filtre pas une liste unique. Ça **recalcule la fenêtre**, **change la question posée au moteur**, **change le référentiel de comparaison**, puis **republie un pack différent**. Le bandeau du haut, lui, ne change que les totaux et la densité du calendrier.

Le moteur qui alimente les cartes est le moteur v2, posé sur le pipeline v1 (lots F1–F7) lui-même posé sur les producteurs v0 (P0 → P3.6). Voir la section 7.

Ce qui n’est **pas** fait au 18 novembre, d’après `moteur analyse v2/analysis-engine/IMPLEMENTATION_PROGRESS.md` (session du 4 novembre, non contredite par le code lu) :

- recette navigateur authentifiée du P0 (volume, reprises, dips, fenêtre vide) ;
- propagation de `buildMetricFact` à tous les producteurs ;
- les plans temporels (`temporalPlans`) sont calculés, ils ne pilotent pas encore la rédaction des longs horizons ;
- le cycle de vie ponctuel J1–J6 n’est actif en production que si les producteurs posent `punctualClaim` ;
- console « pourquoi cette carte a perdu » et gate français sur le DOM final ;
- rapport des 8 périodes au format mission (lot F).

---

## 2. Surface — ce que l’on voit

### 2.1 Le sélecteur de plage n’est pas dans la vue Analyse

Il vit dans l’en-tête du shell Récap, `RecapShellLayout`, groupe `.rb-seg`. Les huit boutons viennent de `RECAP_VIEW_PERIODS` :

| id | Rôle |
|---|---|
| `today` | Aujourd’hui |
| `7d` | 7 jours |
| `30d` | 30 jours |
| `3m` | 3 mois |
| `6m` | 6 mois |
| `1y` | 1 an |
| `2y` | 2 ans |
| `all` | tout le suivi |

`RecapTab` mémorise le choix (`localStorage`, clé de période du récap) et le défaut au premier passage est **`today`**. La valeur est passée telle quelle : le commentaire F7.0 dans `RecapTab` dit qu’on ne double plus le délai (`startTransition` + `useDeferredValue`). `deferredPeriod` est aujourd’hui un alias de `period`.

La même plage est partagée avec Corps, Tendances, Séances et l’instantané. Seule Analyse attend en plus un pack d’insights publié pour la fenêtre demandée.

### 2.2 Ordre vertical de la vue Analyse

`RecapAnalyseView` peint, de haut en bas :

1. **`RecapPeriodHighlightsPanel` `part="head"`** — le module du haut. Section `#recap`.
2. **Filtres de famille** — Toutes, puis Activité / Progression / Sommeil / Rythme / Répertoire / Alerte, seulement si la famille a au moins une carte.
3. **Grille `.igrid`** — une `article.k` par analyse retenue, ou le message « Préparation des analyses… », ou « Pas assez de signal fiable sur cette fenêtre. »
4. **`RecapAnalyseDetails`** — bloc terrain (jours, reps, volume, jours de la semaine, coach). Il n’apparaît qu’après la phase calendrier `full` (`setDetailsOn(true)` dans `runFull`). Un changement de plage le referme tout de suite.
5. **`RecapPeriodHighlightsPanel` `part="tail"`** — « Statistiques de la période » : le reste des métriques, meilleurs mois, top exercices, série, zones, course. Uniquement quand l’analytique calendrier est en phase `full` **et** que sa fenêtre égale la fenêtre demandée.

Les cartes et le module du haut ne partagent pas le même calcul. Les cartes viennent du Worker (`assessment.insights`). Le module du haut vient d’un calcul calendrier sur le thread UI, lancé au repos, **après** que le chargement des insights est terminé.

---

## 3. Le module du haut — « Récap sur la période »

Fichier : `src/components/sport/recap/RecapPeriodHighlightsPanel.jsx`.  
Calcul : `buildRecapPeriodCalendarAnalytics` dans `src/utils/sport/recapCalendarPeriodAnalytics.js`.

### 3.1 Ce qu’il affiche

En-tête repliable (ouvert par défaut) :

- pastille « Analyse » ;
- titre « Récap sur la période » ;
- ligne `libellé de plage · date début → date fin`.

Corps, si les stats existent :

- **bande de jours** (`weekStrip`) : un bouton par jour de la fenêtre. Libellé, numéro, répétitions (ou « — »). Clic = détail du jour (mouvements cochés et reps). Classes visuelles de densité : `d1` jusqu’à 8 jours, `d2` jusqu’à 16, `d3` jusqu’à 45, `d4` au-delà. Sur 2 ans ou « tout », la bande devient une longue rangée, pas une semaine.
- **cinq tuiles**, dans cet ordre fixe : répétitions, jours d’entraînement, minutes totales, kilos, kilocalories actives.

Le jour « aujourd’hui » est marqué `now`. Un jour avec des reps est marqué `on`.

Si le panneau est ouvert, que l’analytique est cohérente, et qu’il n’y a pas de `periodStats`, le texte est « Pas assez de données sur cette période. » Tant que le parent passe `analytics={null}` (fenêtre pas encore recalculée, ou chargement insights), le corps reste vide : on n’affiche pas l’ancienne plage.

### 3.2 Deux phases, un seul mémo

`RecapAnalyseView` invalide l’analytique dès que la plage ou la fenêtre change (`setPeriodAnalytics(null)`), puis :

| Phase | Quand | Timeout idle | Contenu |
|---|---|---|---|
| `header` | dès que les insights ne sont plus en `loading` | 400 ms | `periodStats` + `weekStrip`. Mois, tops, série, course : vides. |
| `full` | ensuite | 1 600 ms | mois calendaires clippés, meilleur mois par métrique, top exercices (5), plus longue série, zones musculaires, course (meilleures séances, répartition). Ouvre aussi les détails. |

Pendant `analysisLoading` ou `analysisStatus === 'loading'`, **aucun** de ces deux calculs ne part. Les dates affichées viennent seulement de `periodWindow`. C’est le correctif F7.0f : l’agrégation calendrier synchrone au changement de plage saccadait l’interface, et mélangeait un libellé « 2 ans » avec des dates « 30 jours ».

Le parent ne passe au panneau que l’analytique dont `window.start/end` égalent la fenêtre demandée (`coherentAnalytics`). Le panneau peut aussi recalculer tout seul si on ne lui passe pas `analytics` ; ici il est contrôlé.

Mémo module (`periodAnalyticsMemo`) : même snapshot, mêmes Garmin, même période, mêmes dates, même phase → résultat réutilisé. Une demande `header` alors qu’un `full` identique est déjà en mémo renvoie le `full` (le bandeau n’a pas à redevenir pauvre).

### 3.3 D’où viennent les chiffres

Pour `[start, end]` inclus :

1. cache sport calendrier du snapshot + Garmin ;
2. lookup reps par jour (cases cochées) ;
3. `computeCalendarMonthSportStats` sur les jours de la plage → `periodStats` ;
4. `buildRecapWeekStrip` → un item par jour (label, reps, mouvements).

Phase `full` seulement : découpe en mois calendaires **clippés** à la fenêtre (un mois partiel compte pour les jours réellement dans la plage), records mensuels, modèle force (`buildRecapStrengthCompareModel`, top 5), série la plus longue dans l’intervalle, muscles depuis `recapState` sinon depuis le modèle force, lignes de course filtrées à la fenêtre.

Métriques connues du calendrier sport : `totalReps`, `runningKm`, `runningMinutes`, `otherExerciseMinutes`, `totalMinutes`, `totalKg`, `longestStreak`, `activeKcal`, `trainingDays`. Le **haut** n’en montre que cinq. La **queue** montre celles qui ne sont pas dans le haut (course, autres minutes, série, etc.) plus les classements.

Conséquence pratique : élargir la plage **augmente les totaux et allonge la bande**, et, une fois la phase `full` passée, fait apparaître des « meilleurs mois » et des tops qui n’existent pas sur une fenêtre trop courte. Ce n’est pas une autre analyse rédactionnelle. C’est le même agrégat sur un intervalle plus large.

`all` n’a pas de `start` dans `getRecapDateWindow`. L’analytique calendrier exige `start` et `end` ; sans start le builder retourne `null` et le module du haut reste vide. Le moteur d’insights, lui, reconstitue un start (voir 4.2). Les deux chemins ne traitent pas « tout le suivi » de la même façon.

---

## 4. Comment la plage change les analyses proposées

### 4.1 La fenêtre calendaire

`getRecapDateWindow` (`recapMuscleLoadEngine.js`), fin = aujourd’hui local :

| Plage | Fenêtre |
|---|---|
| `today` | **24 h glissantes**, pas minuit → maintenant. `mode: 'rolling-24h'`. Le start et le end peuvent tomber sur deux dates calendaires. |
| `7d` | 7 jours inclusifs |
| `30d` | 30 jours |
| `3m` | 92 jours |
| `6m` | 183 jours |
| `1y` | 365 jours |
| `2y` | 730 jours |
| `all` | `start: null`, `end` = aujourd’hui → tout l’historique jusqu’à aujourd’hui |

Garmin pour le récap n’est pas limité à cette fenêtre courte : `RecapTab` demande au moins 90 jours en arrière (ou la fenêtre elle-même si elle est plus longue ; 365 jours si `all` n’a pas de start). Le sommeil et le cardio ont donc un contexte plus large que la plage affichée. Les cartes doivent étiqueter ce qui est hors fenêtre ; c’est un invariant v2.

### 4.2 La question et la voix

Chaque plage a une question (`PERIOD_QUESTIONS`, `recapPeriodVoice.js`), attachée aux comparaisons (`buildPeriodComparisons`) et visible dans le panneau debug admin, pas dans le module du haut :

| Plage | Question que le moteur se pose |
|---|---|
| today | Qu’est-ce qui caractérise précisément cette séance par rapport à l’habitude ? |
| 7d | Qu’est-ce qui s’est passé cette semaine, face au rythme habituel ? |
| 30d | Comment l’entraînement récent évolue-t-il face aux mois précédents ? |
| 3m | Quelle trajectoire est en train de se construire ? |
| 6m | Quelle trajectoire s’est construite sur ces derniers mois ? |
| 1y | … sur cette année ? |
| 2y | … sur ces deux années ? |
| all | … depuis les premières saisies ? |

`periodVoice(period, spanDays)` traduit ça en ton rédactionnel :

| Condition | `voice.key` | Manière de dire la période |
|---|---|---|
| `today` ou span ≤ 1 j. | `today` | « cette séance », « aujourd’hui » |
| `7d` ou span 6–8 j. | `week` | « ces 7 jours » |
| `30d` ou span 21–40 j. | `month` | « ces 30 jours », « ce mois » |
| `3m` (span ~92, donc &lt; 180 et pas dans la branche année) | `long` | « cette période », unité « trimestre » |
| `6m`, `1y`, `2y`, `all`, ou span ≥ 180 j. | `year` | semestre / année / deux années / parcours, selon l’id |

`isLongVoice` = `long` ou `year`. Ça change le **référentiel de volume** dans `detectDiscoveries` :

- voix courte (today, week, month) : on compare au **bloc des 30 jours d’avant** (`prev30`), libellé « les 30 jours d’avant » ;
- voix longue (3 mois et au-delà) : on compare à la **période précédente de même durée** (`prevSameLength`).

Comparer 6 mois aux 30 jours d’avant, ou 7 jours à une « année », est précisément ce que les pénalités de `buildAdaptiveRecapInsights` empêchent ensuite (section 4.5).

### 4.3 Les mesures calculées pour chaque plage, pas seulement la fenêtre visible

`buildPeriodComparisons` mesure toujours, en plus de la fenêtre demandée :

| Mesure | Fenêtre |
|---|---|
| `period` | la plage choisie |
| `d7` | 7 jours finissant aujourd’hui |
| `d30` | 30 jours finissant aujourd’hui |
| `d90` | 92 jours finissant aujourd’hui |
| `prev30` | les 30 jours **avant** la fin (bloc précédent) |
| `prevSameLength` | le bloc juste avant, **même nombre de jours** que la plage |
| `first30` | les 30 premiers jours du trimestre qui finit aujourd’hui |

Si `all` arrive sans `start`, les comparaisons en inventent un (2 ans, 1 an, 6 mois, 3 mois, 30 j., sinon ~10 ans selon l’id) pour pouvoir mesurer. La voix et la question restent celles de `all`.

Une période avec moins de 20 répétitions est traitée comme vide : carte « jour de repos » si c’est aujourd’hui et que le programme le dit, sinon un texte de contexte (dernière séance, même jour de semaine, les 7 jours autour, nuit en cours). On ne fabrique pas une trajectoire sur un quasi-silence.

### 4.4 Du snapshot aux cartes — pipeline réel

Chaîne telle qu’elle est dans le code (contrat v2, `ARCHITECTURE_AND_CONTRACTS.md`, confirmée par `buildAdaptiveRecapInsights` et `buildComposedInterpretationPipelineSync`) :

```
RecapTab
  period + getRecapDateWindow
  useRecapTabMetrics
    cache mémoire / politique workout (même période seulement)
    sinon Worker : buildAdaptiveRecapInsights
      buildComposedInterpretationPipeline
        état d’entraînement + état de la fenêtre précédente
        identité, parcours, phénomènes
        buildPeriodDiscoveryBundle
          comparaisons (4.3)
          catalogue de séances, nuits, baselines
          detectDiscoveries(voix, baselines)
          adhérence programme, P32b muscles, P34 révisions,
          P35 GTG, P36 (table de jours partagée)
          selectPeriodDiscoveriesWithTrace
        essais d’horizon + relations
      buildSpanStoryCandidates (lectures « span », ex. volume vs fréquence)
      fusion, rivalité volume, pénalités selon la longueur
      nouveauté, nature, familles sous-représentées
      keepDistinctProofCards (parenté, reprises, volume)
      filterValidInsights (voix + fenêtre)
      selectNarrativeColumns → short / medium / long
    publication { status, period, windowStart, windowEnd }
RecapAnalyseView
  n’affiche les cartes que si publication ready ET même période ET même fenêtre
```

`periodDiscoveries.selected` alimente la console / le debug. L’utilisateur lit `insights.shortTerm | mediumTerm | longTerm`.

Les trois colonnes ne sont pas « court / moyen / long terme calendaire ». Ce sont trois **natures** (`recapInsightNature.js`) :

| Nature | Colonne UI | Sens |
|---|---|---|
| `now` | short | ce qui s’est passé |
| `trajectory` | medium | ce que ça change |
| `journey` | long | ce qui a évolué dans le temps |

La plage ne change pas la nature d’un `kind`. Elle change **lesquelles** sont détectables, comparables, et gardées.

### 4.5 Ce qui diffère vraiment d’une plage à l’autre

**Détection.** `detectDiscoveries` branche sur `isToday` / `isWeek` / `isMonth` et sur `isLongVoice`. Aujourd’hui parle de la séance, du jour de repos, des jumeaux du même jour de semaine, de la nuit qui se termine. La semaine parle du rythme et des reprises récentes. Le mois parle de trajectoires. À partir de 3 mois, le volume se compare à un bloc de même longueur, pas aux 30 jours d’avant. Les jalons de parcours (cumul vie, centaines de jours) et les formulations « cette année » sont des kinds de voix longue.

**Pénalités après fusion** (`buildAdaptiveRecapInsights`) :

- plages `30d`, `3m`, `6m`, `1y`, `2y`, `all` : les cartes `span_*` sont remontées (poids ≥ 97) ; un texte qui dit « cette semaine » est lourdement pénalisé (−55) ;
- plages `today`, `7d`, `30d` : un texte « cette année » / cumul annuel (−48), les jalons `disc_ms_cumul|sessions|km|hours` et les « depuis ta première » (−28), les associations sommeil RPE / intensité (−22).

30 jours est dans les deux listes : on veut le mécanisme de volume (`span_volume_vs_frequency`) **et** on ne veut pas le portrait d’année.

**Rivalité volume (P0 v2).** S’il existe une lecture `span_volume_vs_frequency` (ou un finding `volume_change:from_…`), le portrait `disc_volume_shape` perd 36 de poids et l’attribution passe à 98. Une seule interprétation du volume global : le mécanisme (fréquence vs densité) bat le portrait.

**Sélection.** `selectPeriodDiscoveriesWithTrace` score la valeur informative, applique la mémoire (ne pas répéter la même découverte), collapse les identités et les épisodes de reprise (un retour = une carte, même si deux écarts 42 j et 77 j), respecte les rivalités, puis remplit les angles dans les plafonds. `filterDiscoveriesByPeriodScope` jette une carte exercice ou course si la fenêtre affichée n’a aucune séance correspondante.

**Plafonds par voix** (`SIGNAL_FAMILY_CAPS`) — garde-fous, pas un objectif de remplissage. Slot vide si le signal n’est pas publiable.

| Voix (plages) | Sport / angle | Sommeil / angle | Jalons / angle | Budget sommeil total | Débordement souple (si IV haute) |
|---|---|---|---|---|---|
| `today` | 8 | 1 (0 en journey) | 2 | 1 | +8 si IV ≥ 68 |
| `week` (7 j.) | 14 | 1 | 2 | 2 | +16 si IV ≥ 64 |
| `month` (30 j.) | 18 | 1 | 3 | 1 | +24 si IV ≥ 62 |
| `long` (3 mois) | 22 | 1 | 3 | 1 | +32 si IV ≥ 58 |
| `year` (6 mois, 1 an, 2 ans, tout) | 22 | 1 | 3 | 1 | +32 si IV ≥ 66 |

Les caps de colonnes UI (`columnCapsForCandidates`) additionnent sport + sommeil + jalons **seulement si** un jalon a été détecté.

**Politique éditoriale** (`TEMPORAL_ANALYSIS_POLICY.md`), ce que chaque plage doit chercher et éviter :

| Plage | Chercher | Éviter |
|---|---|---|
| Aujourd’hui | séance, écarts au programme, records du jour, retour du jour | un PR vieux de 6 jours vendu comme nouveauté |
| 7 jours | nouveautés, rythme, reprises récentes, vs semaine précédente | recycler le quotidien sans évolution |
| 30 jours | trajectoires, fréquence vs densité, interruptions | portraits « année » |
| 3 mois | phases, ruptures, blocs comparables | une saisonnalité inventée |
| 6 mois | trimestres, tiers, avant/après une coupure ou un programme | toutes les découpes mécaniques |
| 1 an / 2 ans / tout | grandes phases, niveau historique, répertoire | une tendance longue sur un historique trop court |

Les plans de découpage scorés (`recapTemporalStrategy.js`) existent et sont exposés par `buildAdaptiveInsights`. Au 4 novembre ils **ne rédigent pas encore** les cartes de long horizon. La différence 6 mois / 1 an / 2 ans vient donc surtout de la fenêtre, de `prevSameLength`, de la voix, et des pénalités — pas encore d’un plan temporel qui choisirait trimestres contre semestres.

### 4.6 Comment une carte est peinte

`RecapAnalyseView` aplatit short + medium + long. Le badge visuel n’est pas la colonne : `motifClass` relit le `kind` (filet : le texte) :

| Classe | Badge | Déclencheur typique |
|---|---|---|
| `a` | Activité | volume, densité, pic, cumul, GTG |
| `p` | Progression | retour, PR, progress, journey |
| `s` | Sommeil | kind contenant sleep / sommeil |
| `r` | Rythme | rhythm, regular, continuity, freq |
| `m` | Répertoire | émergence, nouveau mouvement, span_new |
| `al` | Alerte | pending, absence, alert |

Le chiffre mis en avant (`leadFigure`) est la première proportion, flèche ou « vs » trouvée dans le titre ou le corps. Les nombres du texte sont marqués via `segmentRecapProseValues`.

Gate d’affichage, plus stricte que la cartographie du 2 novembre :

- publication `status === 'ready'` ;
- `period` identique (ou absent) ;
- `windowStart` / `windowEnd` identiques à la fenêtre demandée s’ils sont posés ;
- sinon, mode legacy : pas d’objet publication, pas de loading, assessment présent.

`refreshing` **sans** publication alignée ne montre pas les cartes de l’autre plage. Le commentaire dans la vue le dit : écran vide ou loader. On ne mélange pas un libellé et des cartes d’une autre durée.

### 4.7 Le bloc détails, sous les cartes

`RecapAnalyseDetails` n’est pas le module du haut. Il s’ouvre quand la phase calendrier `full` a tourné. Il raconte le terrain de **la même fenêtre** : jours avec activité, reps (`assessment.totalReps28` — le suffixe `28` est historique, le scope est la fenêtre active), volume kg×reps, mouvements distincts cochés, jours de la semaine (`enrichment.dayOfWeek`), cartes coach (sport, nutrition, calendrier), défis. Le panneau debug (dev ou admin) montre la question de période, les découvertes retenues / écartées, les notes de fiabilité.

---

## 5. Orchestration — ce qui se passe au clic sur une plage

1. `onPeriodChange` met à jour `period` et l’écrit en localStorage.
2. `periodWindow` est recalculé.
3. La plage Garmin s’élargit si besoin (plancher 90 jours).
4. `useRecapTabMetrics` construit une clé (snapshot, période, fenêtre, programme, quiz, Garmin, nutrition, compte).
5. Hit cache exact, ou hit workout **de la même période** et de la même clé : republication immédiate.
6. Sinon : statut loading, insights vidés, Worker. Un seul calcul lourd à la fois ; enchaîner 6 mois puis 1 an peut faire attendre la file (constat v1, toujours structurellement vrai : un client Worker).
7. À la publication `ready` alignée, la grille se remplit.
8. Ensuite seulement, idle 400 ms → bandeau + 5 tuiles ; idle 1,6 s → queue statistique + détails.

Le module du haut peut donc apparaître **après** les cartes, et rester vide pendant le calcul des insights. C’est voulu : ne pas aggréger le calendrier en même temps que le Worker.

Caches : mémoire par clé complète, IndexedDB des bundles, isolation par compte (`accountScope`). Changer de compte vide le cache métriques.

---

## 6. Producteurs qui nourrissent le pool (héritage v0, toujours appelés)

Dans `buildPeriodDiscoveryBundle`, après les comparaisons et le catalogue :

| Bloc | Rôle | Branche |
|---|---|---|
| `detectDiscoveries` | le gros du discours selon la voix (volume, rythme, vide, sommeil contextuel, trajectoires) | toujours |
| adhérence programme | plan × réalisé | toujours |
| P32b | découvertes muscles plan vs réel | défaut oui (`includeP32bMuscleDiscoveries !== false`) |
| P34 | révisions structurelles | défaut oui |
| P35 | GTG × classique, écarts, ressenti | défaut oui |
| P36 | partage la table jour avec P35 | même cache |

Autour, le pipeline composé ajoute : état d’entraînement et transitions vs fenêtre précédente, robustesse, identité, parcours, phénomènes, événements, essais d’horizon, relations. `buildSpanStoryCandidates` ajoute les lectures de span (volume expliqué par la fréquence, etc.) qui, sur les plages longues, sont volontairement favorisées.

Le catalogue parallèle `selectAnalysisCatalog` (`recapAnalysisCatalog.js`) est l’autre famille de lectures « span » : une définition ne tourne que si sa `band` contient la bande de la plage, force minimale 64, puis dédoublonnage par horizon, famille, tags, concepts. Ce n’est pas un second onglet. C’est une source de candidats fusionnée avant la sélection de colonnes.

---

## 7. Évolution — comment on est arrivés là

Trois couches de documentation, trois époques de code. La couche du dessus n’a pas effacé les producteurs du dessous.

### 7.1 v0 — fin octobre 2026 — « produire des découvertes »

Dossier `moteur analyse v0`. Mission : un moteur qui raisonne, pas une liste de compteurs.

- Socle trajectoire exercice, sélection par valeur informative, console de diagnostic.
- P3.0–P3.1 : matrice plan × réalisé, adhérence × fréquence / progression.
- P3.2b muscles, P3.4 révisions, P3.5 / P3.6 GTG et table jour — toujours les fonctions appelées dans le bundle.
- Inventaires par période (30 oct.) et architecture du 30 oct. : pipeline, producteurs, formulation.
- Problème déjà nommé : la sélection peut écraser une bonne détection ; Finding ≠ profondeur.

À la fin de la v0, le système **sait détecter** beaucoup de phénomènes. Il ne garantit pas encore qu’une carte publiée est la bonne lecture, ni qu’elle reste fluide sur 1 an.

### 7.2 v1 — 1er–2 novembre 2026 — « contrat, narration, sélection, fluidité »

Dossier `moteur analyse v1`. Le README v1 figé au 1er novembre matin dit encore F5–F7 bloqués. Les rapports du 1er et du 2 novembre montrent la suite livrée. Le README d’entrée v1 est en retard sur les rapports ; pour l’état réel de la v1, ce sont les rapports F5–F7 et `ARCHITECTURE-ANALYSE-COMPLETE-2026-11-02.md` qui font foi.

| Lot | Ce que ça a changé pour l’onglet |
|---|---|
| F1 | audit transversal |
| F2 | contrats : `strengthDays` ≠ `trainingDays`, temps, preuves, matrice temporelle |
| F3 | preuves composées (`composedEvidence`) sur les trajectoires existantes, sans nouveau kind |
| F4 / F4.1 | la narration écrit vraiment la composition ; titre et chiffres cohérents (`narrationCoherentVerified`) |
| F5 / F5.1 | sélection E0 par valeur informative, identités, traces de décision |
| F6 | fraîcheur, caches, perf vs identité |
| F7.0 → F7.0i | Worker coopératif, publication atomique, ne plus montrer les cartes d’une autre plage, analytics calendrier en idle, fluidité au changement de période |

La cartographie du **2 novembre** décrit déjà les deux chemins (header calendrier vs insights Worker) et les huit plages. C’est le document d’architecture v1. Plusieurs de ses phrases ne décrivent plus le code du 18 novembre : voir section 8.

Le 2 novembre aussi : réconciliation du Δ 387 répétitions (jour 2026-11-02, 4502 vs 4889) — écart de périmètre de comptage, pas un bug d’agrégat du moteur. Et clôture cohérence / finalisation.

### 7.3 v2 — 4 novembre 2026 — « une seule vérité par phénomène »

Dossier `moteur analyse v2`. Consolidation, pas un troisième onglet.

Ajouts branchés dans le pipeline :

| Module | Effet |
|---|---|
| `recapMetricContract.js` | un chiffre publié est un fait (`buildMetricFact`) avec sa population |
| `recapTemporalStrategy.js` | plans de découpage scorés ; exposés, pas encore rédacteurs |
| `recapEditorialLifecycle.js` | fraîcheur ; une claim ponctuelle sans preuve nouvelle est pénalisée (jusqu’à −32) |
| `recapCardKinship.js` | au moment du pack DOM, parenté : le mécanisme de volume bat le portrait ; on ne fusionne pas exercice / densité / GTG entre eux |
| `recapEditorialIdentity.js` | une reprise = un épisode (nom + date), pas une fusion d’homonymes inventée |
| `recapPhenomenonContract.js` | identité stable du phénomène, indépendante du titre |

Invariants tenus par le code et les tests du 4 novembre (54 tests, 6 fichiers : parenté, narration F4.1, éditorial F5, contrat métrique, stratégie temporelle, cycle de vie) :

1. toute comparaison nomme son référentiel ;
2. on ne mélange pas « volume par séance stable » et « 20 → 48 » sans le dire ;
3. un seul épisode de reprise par mouvement ;
4. `span_volume_vs_frequency` bat `disc_volume_shape` sur le volume global ;
5. pas de carte exercice si la fenêtre affichée a zéro séance.

La recette **navigateur** de ce P0 n’a pas été faite (session non authentifiée le 4 novembre). Les tests passent ; l’écran réel n’a pas été rejoué dans cette vague.

### 7.4 18 novembre 2026 — lecture du code, pas une nouvelle vague

Aucune session moteur postérieure au 4 novembre dans `IMPLEMENTATION_PROGRESS.md`. Le code de la vue, du calendrier, de la voix, des comparaisons et de `buildAdaptiveRecapInsights` est celui décrit ci-dessus. L’évolution « où on en est » :

- **Surface stable** depuis F7 : shell 8 plages, module du haut en deux phases, grille gated par publication alignée, détails après le `full`.
- **Intelligence des cartes** = producteurs v0 + sélection / narration v1 + rivalités, faits métriques et cycle de vie v2.
- **Trou principal** : les longues plages ne sont pas encore *écrites* par les plans temporels. Elles sont *filtrées et comparées* (même durée précédente, pénalités anti « cette semaine » / anti « cette année »). La différence 3 mois / 6 mois / 1 an / 2 ans est réelle, mais moins riche que la politique temporelle le prévoit.
- **Trou de preuve** : le P0 v2 n’a pas de validation live. Un texte faux peut encore passer si un producteur n’attache pas la date de retour ou ne pose pas `punctualClaim`.

---

## 8. Écarts entre la cartographie du 2 novembre et le code du 18

La cartographie v1 reste la bonne carte des fichiers. Ces points ont bougé :

| Sujet | Doc 2026-11-02 | Code 2026-11-18 |
|---|---|---|
| Aujourd’hui | « 1 jour » | 24 h glissantes (`rolling-24h`), deux dates possibles |
| `deferredPeriod` | délai pour ne pas saturer React | alias direct de `period` (plus de double délai) |
| Affichage si `refreshing` | la doc dit que refreshing peut garder les cartes | la vue n’affiche que `status === 'ready'` **et** période + fenêtre alignées, ou le legacy sans objet publication |
| Module du haut | « header 9 tuiles » | **5 tuiles** dans le head ; le reste est la queue `part="tail"`, après la phase `full` |
| Détails | présents dans la vue | oui, mais seulement après `runFull` (`detailsOn`) |
| Voix 3 mois | parfois décrite comme un « quarter » à part | `voice.key === 'long'` (trimestre). `year` commence à `6m` ou span ≥ 180 j. |
| Plans temporels | pas encore un module | module v2 présent, rédaction long horizon pas branchée |

---

## 9. Lecture par plage — ce que l’utilisateur doit voir changer

Synthèse opératoire, sans capture live :

| Plage | Module du haut | Analyses proposées |
|---|---|---|
| Aujourd’hui | 1 ou 2 jours dans la bande (24 h). Totaux du jour glissant. | Séance, repos, écart au programme, records du jour. Baseline = 30 jours d’avant pour le volume. Presque pas de parcours. Budget sommeil 1. |
| 7 jours | ~7 boutons, densité `d1`. | Semaine vs habitude. Reprises récentes. Sommeil un peu plus présent (budget 2). Textes « cette année » pénalisés. |
| 30 jours | ~30 boutons, densité `d3`. | Trajectoire récente, fréquence vs densité. Span volume favorisé **et** anti-portrait annuel. Caps sport 18. |
| 3 mois | ~92 jours, densité `d4`. Meilleurs mois possibles en queue. | Voix trimestre. Volume vs les 92 jours d’avant. Phases et ruptures. Caps sport 22. |
| 6 mois | bande longue. Queue : meilleurs mois, tops. | Voix année / semestre (« ces derniers mois »). Baseline = 183 jours précédents. |
| 1 an | idem, plus large. | « Cette année ». Jalons et niveau historique deviennent légitimes (ils étaient pénalisés à 7–30 j.). |
| 2 ans | ~730 boutons. Coût Worker élevé sans cache. | « Ces deux années ». Même famille de caps que 6 mois / 1 an. La différence est la fenêtre et `prevSameLength`, pas un plafond plus haut. |
| Tout | le module du haut reste vide si `start` est null (le builder calendrier exige un start). Les insights, eux, reconstituent une fenêtre. | Question « depuis les premières saisies ». Voix parcours. Même risque de coût que 2 ans. |

Sur toutes les plages, une fenêtre sous ~20 reps ne produit pas un roman de progression : repos ou contexte de la dernière séance.

---

## 10. Index des fichiers (code)

```
src/components/tabs/RecapTab.jsx                          plage, fenêtre, props Analyse
src/components/sport/recap/shell/RecapShellLayout.jsx     boutons des 8 plages
src/utils/sport/recapViewPeriods.js                       RECAP_VIEW_PERIODS
src/utils/sport/recapMuscleLoadEngine.js                  getRecapDateWindow
src/components/sport/recap/views/RecapAnalyseView.jsx     ordre vertical, gates, idle
src/components/sport/recap/RecapPeriodHighlightsPanel.jsx module du haut + queue
src/utils/sport/recapCalendarPeriodAnalytics.js           header / full
src/components/sport/recap/views/RecapAnalyseDetails.jsx  détails sous les cartes
src/hooks/useRecapTabMetrics.js                           cache, Worker, publication
src/utils/sport/recapAdaptiveInsights.js                  fusion, pénalités, colonnes
src/utils/sport/recapInterpretationPipeline.js            pipeline composé
src/utils/sport/recapPeriodDiscoveries.js                 bundle de découvertes
src/utils/sport/recapPeriodComparisons.js                 d7 d30 d90 prev30 prevSameLength
src/utils/sport/recapPeriodVoice.js                       voix + PERIOD_QUESTIONS
src/utils/sport/recapPeriodDetectDiscoveries.js           détection selon la voix
src/utils/sport/recapPeriodSelection.js                   valeur informative, rivalités
src/utils/sport/recapInsightNature.js                     natures et plafonds
src/utils/sport/recapDiscoveryPeriodScope.js              hors fenêtre / fenêtre vide
src/utils/sport/recapAnalysisCatalog.js                   candidats span par bande
src/utils/sport/recapTemporalStrategy.js                  plans (pas encore rédacteurs)
src/utils/sport/recapMetricContract.js                    faits chiffrés
src/utils/sport/recapEditorialLifecycle.js                fraîcheur ponctuelle
src/utils/sport/recapCardKinship.js                       parenté du pack affiché
```

Docs à lire ensuite, dans l’ordre :

1. `moteur analyse v2/analysis-engine/IMPLEMENTATION_PROGRESS.md` — reprise de travail
2. `moteur analyse v2/analysis-engine/ARCHITECTURE_AND_CONTRACTS.md` — pipeline et invariants
3. `moteur analyse v2/analysis-engine/TEMPORAL_ANALYSIS_POLICY.md` — intention par plage
4. `moteur analyse v1/ARCHITECTURE-ANALYSE-COMPLETE-2026-11-02.md` — carte v1, à lire avec la section 8 ci-dessus
5. `moteur analyse v0/README.md` — genèse des producteurs P3

---

## 11. Chrome de l’écran (vu, pas seulement lu)

Compte affiché : `@zingariello1314`. Langue de l’interface **anglaise** pour le shell, **française** pour la prose des cartes. Les badges de famille restent les libellés français codés en dur dans `FAMILY_META`, passés en capitales par le CSS.

Navigation qui mène ici :

- barre principale : Sport, puis **Recap** (entrée distincte, pas un sous-onglet perdu dans Sport) ;
- colonne du récap : Snapshot, **Analysis** (actif), Grades, puis le groupe Data (Body, Trends, Sessions) ;
- sous « This page » : ancres **Récap**, **Repères**, **Vision coach**, **Programme**, **Synthèse**. Ce sont des liens de la page Analyse, pas d’autres onglets. Le module du haut est la cible de « Récap ».

Le sélecteur de plage, au-dessus de cette colonne, affiche en anglais : TODAY, 7 DAYS, 30 DAYS, 3 MONTHS, 6 MONTHS, 1 YEAR, 2 YEARS, ALL TIME.

Au premier essai, une modale « Remplir mon profil » (quiz, question 1/30, 0/30) couvrait le récap. Elle se ferme par « Fermer la modale ». Elle ne fait pas partie du moteur d’analyse ; tant qu’elle est ouverte, le module du haut est invisible.

État transitoire au changement de plage, observé à chaque saut vers 6 mois, 1 an, 2 ans : le libellé de dates du bandeau change **tout de suite**, le filtre affiche `ALL …`, le corps du bandeau et la grille sont vides, le statut dit « Preparing insights… ». Les tuiles n’arrivent qu’avec les cartes. Durées mesurées sur cette machine, cache froid ou file Worker :

| Saut | Temps jusqu’aux cartes stables |
|---|---|
| Today | ~9 s |
| 30 days | ~9 s |
| 3 months | ~23 s |
| 6 months | ~44 s |
| 1 year | ~48 s |
| 2 years | ~22 s (la file avait déjà commencé) |
| All time | de l’ordre de 1 à 2 min ; cartes oui, bandeau non |

---

## 12. Recette live — les huit plages, le 18 novembre 2026

Aujourd’hui calendaire de la session : **mercredi 18 novembre 2026**, 17 h 41. Aucune répétition cochée ce jour-là.

### 12.1 Le module du haut, chiffre par chiffre

Les cinq tuiles sont toujours Reps, Training days, Total time, Kg lifted, Daily kcal. La bande est une **grille de jours** (pas une seule ligne) dès que la densité passe en `d3` : à 30 jours on voit un calendrier, le 18 est surligné (aujourd’hui, vert), les jours avec reps sont teintés, les jours vides montrent « — ».

| Plage | Dates affichées | Jours dans la bande | Reps | Jours | Temps | Kg | kcal | Course (queue) |
|---|---|---|---|---|---|---|---|---|
| Today | mar. 17 → mer. 18 nov. 2026 | 2, les deux à « — » | 0 | 0 | 0 m | 0 kg | 0 | 0 km |
| 7 days | jeu. 12 → mer. 18 nov. | 7 | 1 002 | 3 | 3 h 15 | 1 464 kg | 3 162 | 0 km |
| 30 days | mar. 20 oct. → mer. 18 nov. | 30 | 5 211 | 16 | 15 h 21 | 15 388 kg | 16 649 | 0 km |
| 3 months | mer. 19 août → mer. 18 nov. | 92 | 13 209 | 43 | 40 h 48 | 35 972 kg | 40 097 | 0 km |
| 6 months | mer. 20 mai → mer. 18 nov. | 183 | 31 510 | 105 | 96 h 31 | 93 092 kg | 84 085 | **54,7 km**, 6 h 41 |
| 1 year | mer. 19 nov. 2025 → mer. 18 nov. 2026 | 365 | 32 768 | 150 | 124 h 29 | 95 066 kg | 117 931 | **83 km**, 9 h 40 |
| 2 years | mar. 19 nov. 2024 → mer. 18 nov. 2026 | 730 | **32 768** | 163 | 139 h 43 | **95 066 kg** | 128 125 | **83 km**, 9 h 40 |
| All time | libellé seul : « All time », **aucune date** | **0** | tuiles absentes | — | — | — | — | queue absente |

Lecture de cette table, qui est le cœur de « ce que la plage change » sur **ce** compte :

- **Today** est bien glissant : deux dates, pas « le 18 seulement ». Les deux cases sont vides. Le bandeau dit donc 0 partout, alors que la veille au soir (16 novembre, 319 reps) existe — elle est hors des 24 h.
- De 7 jours à 6 mois, les reps, le temps et les kilos **montent** avec la fenêtre. La course reste à 0 km jusqu’à 3 mois inclus : il n’y a pas de course dans le dernier trimestre. Elle apparaît à 6 mois (54,7 km) et le reste de la course connue est dans l’année (83 km). Juin 2026 porte le pic course : 34,5 km, 4 h 20.
- **1 an et 2 ans ont les mêmes reps (32 768), les mêmes kilos (95 066) et les mêmes 83 km.** L’année supplémentaire (nov. 2024 → nov. 2025) ajoute des jours d’activité (+13), du temps (+15 h) et des kcal, pas de répétitions cochées ni de course. Le renforcement suivi dans Momentum, sur ce compte, ne commence pas deux ans en arrière. Une carte le dit ailleurs : première saisie de pompes inclinées le **5 janvier 2026**.
- **All time ne peint pas le module du haut.** `getRecapDateWindow('all')` renvoie `start: null`. Le builder calendrier exige un start et retourne `null`. Les cartes, elles, sortent quand même (section 12.3) : le Worker reconstitue une fenêtre, l’UI du bandeau non. Écart de chemin confirmé à l’écran, pas seulement dans le code.

Jours de la bande 7 jours, tels qu’affichés : jeu 12 —, ven 13 **351**, sam 14 **332**, dim 15 —, lun 16 **319**, mar 17 —, mer 18 —. Trois séances, fin de fenêtre vide. C’est exactement ce que la carte « le volume repose sur peu de journées » raconte ensuite.

Clic sur le **11 novembre** (426 reps, vu dans la grille 30 jours) ouvre le détail du jour, au-dessus des tuiles :

> mercredi 11 novembre 2026 · 426 reps  
> Élévations latérales 60 · Bent-Arm Lateral Dumbbell Raise 60 · Face pull 60 · Kickbacks triceps 48 · Extension triceps debout avec haltère 42 · Développé Arnold 40 · Single-Arm Dumbbell Lying Triceps Extension 40 · Side-Lying Single-Arm Dumbbell Triceps Extension 40 · Pompes pseudo-planche 36

Le détail est la liste des mouvements cochés ce jour-là, pas une analyse. Fermeture par « Fermer ». Deux libellés d’élévations latérales et deux extensions triceps couchées coexistent : le bandeau ne fusionne pas les homonymes.

### 12.2 La queue, et où elle contredit le bandeau

La queue (« Period statistics ») n’existe qu’après la phase `full`. Sur All time elle n’apparaît pas.

Ce qu’elle ajoute, vu en live :

- km, temps de course, autre temps d’exercice, « best streak » ;
- meilleurs mois **clippés à la fenêtre** (juin 2026 domine reps, km, temps et kcal dès que la fenêtre l’inclut ; à 30 jours, novembre mène les reps 3 652 et octobre mène la série) ;
- top exercices ;
- phrase de série avec dates ;
- zones (chest, triceps, shoulders, core, back) avec un « ~N reps » qui n’est **pas** le total de la tuile Reps.

Contradictions lues sur le même écran :

| Plage | Tuile ou phrase A | Tuile ou phrase B |
|---|---|---|
| 7 days | queue « Best streak **5** » | phrase « Meilleure série : **2 j.** · 13 → 14 novembre » |
| 30 days | queue « Best streak **6** » et « Best streak 6 · octobre 2026 » | phrase « Meilleure série : **5 j.** · 7 → 11 novembre » |
| 1 year et 2 years | tuile période « Best streak **0** » | meilleur mois « Best streak **6** · juin 2026 » |
| Today | bandeau 0 reps, 0 jour | queue « Best streak **5** · novembre 2026 » et des zones (chest, back…) sans reps |
| 30 days | bandeau **16** training days sur la fenêtre | meilleur mois « Training days **11** · novembre 2026 » (novembre seul, pas la fenêtre) |
| 7 days | tuile temps **3 h 15** | carte kcal : « croisée avec **9 min** d’exercices » |
| 30 days | tuile temps **15 h 21** | carte kcal : « croisée avec **58 min** d’exercices » |
| 7 days | top « Relevés de genoux à la barre **60** » **deux fois** de suite | le jour du 13 parle de 60 reps d’un seul libellé |

Deux définitions de série cohabitent (stats calendrier du mois vs série calculée sur l’intervalle) et ne sont pas étiquetées comme telles. Le « best streak 0 » sur 1 an et 2 ans, alors qu’un mois intérieur a une série de 6, est un trou du total de période, pas un mois sans entraînement. Le « 9 min » contre « 3 h 15 » est deux métriques de durée (minutes d’exercice d’un producteur vs temps calendrier) présentées sans les nommer l’une à côté de l’autre.

### 12.3 Les cartes — le pack change de taille, de familles, et de voix

Filtres affichés (le badge n’apparaît que si le compte est > 0) :

| Plage | All | Activité | Progression | Sommeil | Rythme | Répertoire | Alerte |
|---|---|---|---|---|---|---|---|
| Today | 4 | 1 | 1 | 1 | — | — | 1 |
| 7 days | 20 | 4 | 9 | 2 | 5 | — | — |
| 30 days | 30 | 4 | 16 | 2 | 8 | — | — |
| 3 months | 31 | 7 | 15 | 2 | 5 | **2** | — |
| 6 months | 43 | 8 | 15 | 2 | 9 | **9** | — |
| 1 year | 44 | 8 | 14 | 2 | 10 | **10** | — |
| 2 years | 46 | 8 | 15 | 2 | 11 | 10 | — |
| All time | **37** | 5 | 11 | **1** | 10 | 10 | — |

Le plafond « 22 sport » de la section 4.5 est **par nature** (now / trajectory / journey), pas un total de cartes. En live le pack publié va de 4 à 46. Le répertoire n’existe pas sous 30 jours sur cet écran ; il s’ouvre à 3 mois et devient une famille pleine à partir de 6 mois. L’alerte n’existe qu’aujourd’hui. Le sommeil plafonne à 2, et retombe à 1 sur « tout le suivi ». All time publie **moins** de cartes que 2 ans (37 contre 46) : la voix parcours ne se contente pas d’empiler.

La voix se lit dans les titres, mot pour mot :

- 7 days : « ces 7 jours » ;
- 30 days : « ces 30 jours », « ce mois », « Lundi : jour le plus régulier » ;
- 3 months : « cette période » ;
- 6 months : « ces derniers mois » ;
- 1 year : « cette année » ;
- 2 years : « ces deux années » ;
- all time : « l’ensemble du suivi ».

Même squelette, sujet qui change avec la largeur. Exemple du bloc chargé / creux :

- 7 j. : « Ces 7 jours : le volume repose sur peu de journées » (creux 17–18 nov., 3 séances / 4 jours vides) ;
- 30 j. : « Ces 30 jours mêlent un bloc chargé et un creux » (pic 426 le 11 nov., médiane de séance 332, trou 3–6 nov.) ;
- 3 mois : « Cette période mêle un bloc chargé et un creux » ;
- 6 mois : « Ces derniers mois mêlent… » et juin 2026 domine (22 jours, 6 947 reps), novembre est le plus bas ;
- 1 an : « Cette année mêle… » et une interruption de **113 jours** (19 janv. → 13 mai 2026) devient un sujet, invisible à 7 jours ;
- 2 ans : « Ces deux années mêlent… » — le titre change, le pic juin et la reprise de course restent ;
- tout : « L’ensemble du suivi mêle… ».

### 12.4 Today — les 4 cartes, en entier dans leur rôle

Bandeau à 0. Le moteur ne se tait pas. Il publie une séance en attente, plus trois lectures qui **sortent** de la fenêtre :

1. **Alerte** — « La séance d'aujourd'hui n'est pas encore commencée ». 0 répétition cochée. Dernière séance citée : **16 novembre, 319 reps** (60, 48, 48). Les mercredis récents servent de jumeaux. C’est `disc_pending_session` / contexte, pas un agrégat du bandeau.
2. **Activité** — « Pompes déclinées a été remplacé, pas abandonné au hasard ». Dernière fois le **22 juillet 2026**, 119 jours, retour habituel ~7 j., 8 séances. La famille continue via pompes inclinées pieds sur banc. Cette carte est **aussi** dans le pack 7 jours, 30 jours, 3 mois et au-delà. Elle ne dépend pas du fait qu’on a choisi Aujourd’hui.
3. **Sommeil** — le seuil 7 h 30 : 291 reps au-dessus, 233 en dessous, +58 reps, +25,1 %, « 16 et 4 séances ». Le texte dit que ce n’est pas une cause. L’échantillon (20 séances) est plus large que la fenêtre de 24 h.
4. **Progression**, chiffre mis en avant **50 %** — « Depuis ta première référence, Pompes inclinées mains sur banc +50 % ». Première saisie 24 reps le **5 janvier 2026**, habituel ~36, meilleure série 18 il y a 16 jours. Lecture lifetime, explicitement distincte de la fenêtre.

Donc « aujourd’hui » ne montre pas la séance du jour (il n’y en a pas). Il montre l’absence, et il **emprunte** l’historique. La politique v2 demandait de ne pas recycler un vieux record comme nouveauté du jour : ici le +50 % et les 119 jours sont quand même dans le pack de 4.

### 12.5 Sept jours — les 20 cartes

Bandeau : 1 002 reps, 3 jours, 3 h 15, 1 464 kg, 3 162 kcal. Fenêtre 12–18 novembre.

| # | Famille | Chiffre en tête | Titre ou première ligne |
|---|---|---|---|
| 1 | Activité | — | La séance du 13 nov. concentre 351 reps, 35,0 % de la fenêtre (les autres jours 651). Détail : 60 relevés de genoux barre, 48 tractions australiennes pieds surélevés. Le texte dit que sur 3 séances le max n’est pas un exploit. |
| 2 | Rythme | — | Volume sur peu de journées. Creux 17–18 nov. 3 jours avec séance, 4 sans. |
| 3 | Sommeil | — | Nuit du 13 nov. : 8 h 23 contre 9 h 12 sur 7 nuits (−49 min). Architecture : 41 min profond, 50 min REM, 6 h 52 léger. |
| 4 | Activité | — | Séances incomplètes : réalisé ~50 % du prévu, alignement ~34/100. Raccourcies, pas sautées. |
| 5 | Activité | — | « Les séances sont regroupées en début de fenêtre » — 2 des 3 séances dans les quatre premiers jours. Pas de titre `h4`, le corps sert de titre. |
| 6 | Activité | — | Pompes déclinées remplacées (119 j., 22 juil.). Même carte qu’aujourd’hui. |
| 7 | Sommeil | — | Seuil 7 h 30, 291 vs 233 reps, 16 et 4 séances. Même mécanisme qu’aujourd’hui, échantillon hors fenêtre. |
| 8 | Progression | — | 20 reps de relevés de genoux à la barre, reproductibles sur 5/5 dernières séances. |
| 9 | Progression | **−46 %** | 3 séances / 1 002 reps contre 5 séances / 1 845 sur la fenêtre d’avant. −40 % de séances, −9 % de reps par séance. La composition a changé, comparaison de volume limitée. Le −46 % est le chiffre extrait en tête de carte. |
| 10 | Progression | — | Dips sur barre parallèle : 17,1 % de la poussée sur les 30 jours d’avant (144 reps) contre **7,0 % « aujourd’hui » (96 reps)**. Le mot « aujourd’hui » est faux pour une vue 7 jours : c’est la fenêtre courante. |
| 11 | Progression | — | Pas : médiane 8 418 (5 jours) contre 7 491 sur les 30 jours d’avant (+12 %). Le texte dit que ce n’est pas une séance. |
| 12 | Progression | — | Plateau relevés de genoux aux parallèles, ~40 reps depuis 127 jours, 6 séances. |
| 13 | Progression | — | Pompes inclinées mains sur banc : volume/séance 30,7 → 36 (+17,4 %), format 2×18 inchangé, appui sur 7 séances **avant** la période. |
| 14 | Rythme | — | Relevés de genoux à la barre « repasse » : 240 reps / 4 séances / 34,7 % du tronc sur 30 jours, contre 120 reps / 25,2 % avant. Accord faux : « de la tronc », « structure vraiment la tronc ». |
| 15 | Progression | — | Dips barre : volume/séance stable ≈48, format 4×12, **7 séances avant** la période et 1 dedans. |
| 16 | Progression | — | Pompes déclinées pieds sur banc : 50 → 36 reps/séance (−28 %), séries 5 → 4, encore 7 séances antérieures. |
| 17 | Rythme | — | 3 162 kcal « ces 7 jours », croisées avec **9 min** d’exercices, pour dire « peu de journées, dépense concentrée ». Le 9 min ne colle pas aux 3 h 15 du bandeau. |
| 18 | Rythme | — | 15 jours entraînés / 30 (~50 %) contre 3/7 (~43 %). « Pas une rupture ». |
| 19 | Rythme | **100 %** | Exercices tenus ~100 %, étirements ~0 %. |
| 20 | Progression | — | Niveaux de référence lifetime : pompes inclinées 24→36 (+50 %), tractions supination 16→20 (+25 %), australiennes 40→48 (+20 %). « Depuis le 5 janvier 2026, 108 jours entraînés sur 317 ». Le texte dit que c’est une lecture lifetime, distincte des trajectoires de fenêtre. |

Ce que 7 jours fait vraiment, sur ce compte : il raconte la **concentration** (un jour = 35 %), le **creux de fin de fenêtre**, l’**incomplétude des séances**, et le **−46 %** expliqué par le nombre de séances. Il laisse passer des lectures dont les preuves sont hors fenêtre (119 jours, 127 jours, janvier 2026, 16+4 nuits, 7 séances antérieures), à condition que le texte le dise parfois (« séances antérieures », « lecture lifetime »). Il ne le dit pas pour le mot « aujourd’hui » de la carte dips, ni pour les 9 minutes.

### 12.6 Trente jours — ce qui s’ajoute

Bandeau 20 oct. → 18 nov. : **5 211 reps, 16 jours, 15 h 21, 15 388 kg, 16 649 kcal.** 30 cartes. Familles : activité 4, progression 16, sommeil 2, rythme 8. Toujours pas de répertoire.

Faits nouveaux par rapport à 7 jours (titres relevés) :

- reprise Face pull après **28 jours** (« il y a une semaine », 60 reps, écart > 4× l’intervalle habituel) ;
- réalisé ~**58 %**, alignement ~41/100 (à 7 jours c’était ~50 % et ~34) — les pourcentages **changent** avec la fenêtre, ce n’est pas un texte figé ;
- pic du 11 nov. (426) au-dessus de la médiane 332, trou du 3 au 6 nov. ;
- lundi : 4/4 lundis éligibles, jour le plus régulier ;
- pectoraux : plus de jours d’exposition entre 20 sept.→19 oct. et 20 oct.→18 nov. ;
- dips parallèles : volume/séance **20 → 48** ;
- chiffre en tête **25 %** sur deux cartes distinctes (volume intérieur des séances ; charge qui monte : 5 211 vs 4 178 reps, tonnage +75 %) ;
- **15 %** : « Volume +15 % et progression visible — adaptation réussie » (formule plus courte, moins sourcée que les cartes span) ;
- série de 5 jours (7→11 nov.), ~3,5 séances/semaine, semaines entre 1 et 5 contre 2,5 avant ;
- pas : médiane 7 814 (28 jours) contre 5 358 (27 jours) ;
- sommeil du mois : 15 jours, 5 211 reps, ~347 reps par jour entraîné, séparé par le seuil 7 h 30 ;
- **100e séance**, 29 174 répétitions cumulées pour y arriver, ~292 reps/séance — jalon de parcours, absent du pack 7 jours ;
- novembre (portion dans la fenêtre) = 3 652 reps / 10 jours = 70,1 % du volume « du mois », contre 1 559 en octobre ;
- Curl Zottman : meilleure série 12 le **28 juillet**, il y a 113 j., éloignée de l’habituel ;
- pompes inclinées : le total monte parce que les séances passent de 1 à 4, pas parce que le volume/séance bouge (≈36 → ≈36).

La carte dips « 7,0 % aujourd’hui » est **encore là** sur 30 jours. La voix n’a pas été corrigée. Les cartes plateau, pompes déclinées 119 j., 20 reps reproductibles, et le tableau lifetime 24→36 / 16→20 / 40→48 **survivent** au changement de plage.

### 12.7 Trois mois — le répertoire s’ouvre, la course non

19 août → 18 nov. Bandeau : **13 209 reps, 43 jours, 40 h 48, 35 972 kg, 40 097 kcal, 0 km.** 31 cartes. **Répertoire 2** pour la première fois.

Queue : octobre domine les reps (4 367), le temps et les kcal (14 487). Novembre domine les kilos (11 436 kg) — pas le même mois gagnant selon la métrique. Top : pompes endurance 1 300, dips 516.

Titres qui n’étaient pas dans le pack 30 jours :

- GTG qui ne tient que par un passage hors planning ;
- jours sans séance = moins de pas que les jours entraînés ;
- octobre domine, **août est le plus bas** (5 jours, 1 462 reps ; septembre 13 jours) ;
- « GTG hors séances classiques » ;
- répertoire : pompes inclinées sur support reviennent après interruption ;
- élévations latérales : progression malgré une exposition faible ;
- dos : plus de jours d’exposition que la période précédente ;
- interruption de **9 jours** entre deux séances de renforcement ;
- chiffre **−28 %** : 44 séances et 13 209 reps, le volume bouge parce que le nombre de séances bouge ;
- répertoire : **85 exercices** sur la fenêtre contre un effectif plus petit avant (« le répertoire s’élargit sans que le volume l’explique seul ») ;
- push **98,4 %**, ratio 60,7 ;
- le +15 % « adaptation réussie » est encore là ;
- octobre portion de fenêtre = mois le plus productif (le texte 30 jours disait novembre : **le mois gagnant a changé** parce que la fenêtre a changé) ;
- pompes lestées en baisse de reps/séance ; pompes diamant lentes en hausse ;
- étirements ~0 % contre exercices ~99,2 % (à 7 jours c’était 100 % / 0 %).

### 12.8 Six mois et un an — la course, juin, le trou de 113 jours

**6 mois** (20 mai → 18 nov.) : 31 510 reps, 105 jours, 96 h 31, 93 092 kg, 84 085 kcal, **54,7 km / 6 h 41**. 43 cartes (activité 8, progression 15, sommeil 2, rythme 9, répertoire 9). Voix « ces derniers mois ». Juin domine (6 947 reps, 34,5 km, 22 jours). Meilleure série mensuelle 6, tuile de période « best streak 3 » — encore deux chiffres.

Titres propres à cette largeur : « Tu reprends la course après 33 jours », « 50e séance enregistrée », interruption de 9 jours encore citée. Le 100e séance du pack 30 jours n’est plus le jalon mis en avant ; le 50e apparaît. Les deux existent dans l’historique ; la sélection n’en garde qu’une tête d’affiche selon la plage.

**1 an** (19 nov. 2025 → 18 nov. 2026) : 32 768 reps, 150 jours, 124 h 29, 95 066 kg, 117 931 kcal, **83 km / 9 h 40**. 44 cartes. Répertoire 10. ~48 s de calcul.

Ce que l’année ajoute comme **sujets**, pas seulement comme totaux :

- « Cette année mêle un bloc chargé et un creux » ;
- juin domine, novembre est le plus bas du contraste mensuel (alors qu’à 3 mois août était le plancher) ;
- reprise de course après 33 jours, et « course et renforcement divergent » ;
- première semaine à 6 entraînements ;
- interruption de **113 jours** de renforcement, et une carte rythme qui reprend le même trou (« après 113 jours d’arrêt, 11 jours pour revenir au rythme », « entre le 19 janvier et le 13 mai ») ;
- « le rythme récent (~3,5 / semaine sur ~12 semaines) aurait été rare plus tôt » ;
- octobre 2026 **interrompt la baisse depuis juin** ;
- **50e séance** (le 100e n’est plus dans les titres relevés) ;
- répertoire massif : tractions australiennes (format plus volumineux, et volume/séance en hausse), dips parallèles « séance atypique », pompes inclinées pieds sur banc « atypique », relevés de genoux stables, curl marteau stable, élévations latérales et face pull « s’installent », dips barre en hausse, pompes déclinées en recul ;
- push ~99 %, ratio 102,7 ;
- étirements ~0,8 % contre exercices ~98 % ;
- **« exercice 301 a quitté la rotation »** — identifiant brut, 8 séances puis plus rien depuis 119 jours (22 juillet). Le gate « pas d’id d’exercice anonyme » n’a pas retenu cette carte. C’est le défaut P0 encore visible ;
- « Oiseaux s'installe dans ta tirage » — accord faux, même famille que « de la tronc ».

La tuile Best streak de la **période** vaut **0** sur l’année, alors que juin a une série de 6. Le module du haut et la queue ne racontent pas la même série.

### 12.9 Deux ans — la voix change, les reps non

730 cases. **Mêmes 32 768 reps, mêmes 95 066 kg, mêmes 83 km** que l’année. Ce qui bouge : 163 jours (au lieu de 150), 139 h 43 (au lieu de 124 h 29), 128 125 kcal (au lieu de 117 931). 46 cartes. Titres au pluriel de la voix : « Ces deux années mêlent un bloc chargé et un creux », « Ces deux années s'inscrit dans une pratique déjà documentée » (accord « années / s'inscrit » faux). La reprise de course à 33 jours, la divergence course/renforcement, la semaine à 6, le trou depuis juin interrompu en octobre : **mêmes événements**, habillage « deux années ». Le moteur n’a pas trouvé un second cycle 2024-2025 de renforcement, parce que les reps n’y sont pas.

Best streak période encore **0**, juin encore **6**.

### 12.10 All time — cartes sans bandeau

Libellé « All time », pas de flèche de dates, **0 case**, **0 tuile**, **pas de queue**. 37 cartes quand même. Voix « L’ensemble du suivi ». Sommeil retombe à 1, activité à 5, progression à 11, rythme 10, répertoire 10. Le trou de 113 jours et « octobre interrompt la baisse depuis juin » restent. Le bandeau ne peut pas confirmer les totaux : il n’est pas calculé. C’est le seul mode où les analyses proposées n’ont **aucun** total de contrôle au-dessus d’elles.

### 12.11 Ce qui ne change pas quand on change la plage

Cartes revues sur plusieurs largeurs, parfois mot pour mot :

- pompes déclinées remplacées, 119 jours, 22 juillet 2026 ;
- plateau relevés de genoux aux parallèles, ~40 reps, 127 jours ;
- 20 reps reproductibles sur 5/5 (relevés barre) ;
- tableau lifetime 24→36, 16→20, 40→48, ancré au 5 janvier 2026 ;
- séances commencées mais incomplètes (le **pourcentage** bouge : ~50 % à 7 j., ~58 % à 30 j.) ;
- seuil de sommeil 7 h 30, 291 contre 233 ;
- « adaptation réussie / volume +15 % » sur 30 j. et 3 mois ;
- GTG hors planning, à partir de 3 mois, encore en tête à 6 mois, 1 an et 2 ans.

La plage change la **question d’ouverture** et les **totaux**. Elle ne reconstruit pas un pack disjoint. Une part du pack est du contexte de parcours, réinjectée dès qu’elle passe les pénalités. Sur 7 jours ces pénalités existent dans le code (textes « cette année » à −48) mais les cartes lifetime passent quand même, parce qu’elles ne disent pas « cette année » : elles disent « depuis le 5 janvier » et « lecture lifetime ».

### 12.12 Défauts vus, à ne pas confondre avec le design

1. Bandeau absent sur All time, cartes présentes.
2. Best streak : 5 vs 2 j. (7 jours), 6 vs 5 j. (30 jours), **0 vs 6** (1 an et 2 ans).
3. Durée « 9 min » / « 58 min » dans la carte kcal contre 3 h 15 / 15 h 21 dans le bandeau.
4. Top exercices : le même nom deux fois (relevés de genoux à la barre, 60 et 60) sur 7 jours.
5. « aujourd’hui » pour désigner la fenêtre 7 jours ou 30 jours (carte dips).
6. « exercice 301 » publié sur l’année.
7. Accords : « de de ta poussée », « de la tronc », « dans ta tirage », « deux années s'inscrit », « ce mois correspond » traité au masculin/féminin de travers sur la carte kcal 7 jours (« Ces 7 jours correspond »).
8. Le +15 % « adaptation réussie » et le « palier consolidé ~N reps » sont des formules courtes, répétées, dont le N change (10, puis 15, puis 5) sans la même chaîne de preuves que les cartes span.
9. Deux élévations latérales et deux extensions triceps dans le détail du 11 novembre : le module du haut liste les lignes cochées, il ne dédoublonne pas les noms.

---

## 13. Catalogue des détections qui alimentent ces cartes

`detectDiscoveries` (`recapPeriodDetectDiscoveries.js`) pose ces `kind` (un même kind peut être émis plusieurs fois, ex. trois `disc_volume_shape`) :

| Kind | Rôle lisible dans les cartes live |
|---|---|
| `disc_rest_day` | jour de repos prévu (pas vu le 18 : la séance est « en attente », pas repos) |
| `disc_pending_session` / `disc_pending_context` | « séance pas encore commencée » + dernière séance / jumeaux du jour de semaine |
| `disc_calendar_rhythm` | creux, blocs, jours vides |
| `disc_density` | volume reposé sur peu de journées |
| `disc_volume_shape` | portrait du volume ; perd face à `span_volume_vs_frequency` quand les deux existent (le −46 % des 7 jours est cette victoire : séances −40 %, reps/séance −9 %) |
| `disc_muscle_now` / `disc_muscle_reorient` / `disc_muscle_share_shift` | part musculaire du moment, réorientation |
| `disc_peak_day` | le 13 nov. = 35 % ; le 11 nov. = pic au-dessus de la médiane |
| `disc_no_running` | explicite l’absence de course sur les fenêtres courtes (le bandeau affiche 0 km) |
| `disc_push_pull` | 98–99 % push |
| `disc_exercise_share` / `disc_exercise_base` / `disc_anchor` | part d’un mouvement, ancre |
| `disc_emergence` / `disc_repertoire` | répertoire, retours après trou (ouvert à partir de 3 mois à l’écran) |
| `disc_composition_not_volume` | « la composition a changé, comparaison de volume limitée » |
| `disc_freq_continuity` | 50 % sur 30 j. vs 43 % sur 7 j. |
| `disc_kcal_profile` | carte 3 162 kcal / 16 649 kcal |
| `disc_quarter_profile` / `disc_quarter_arc` | profil et arc de trimestre |
| `disc_vs_habit` / `disc_comparable` | vs habitude, séances comparables |
| `disc_exercise_progress` | 30,7→36, 50→36, 20→48, stables à 48 |
| `disc_sleep_*` | nuit datée, volume, mois, semaine, profond, association, architecture, efficacité, combo, famille, zones, décalé, charge, intensité, cardio, perf, RPE, fréquence, trimestre, J+2. Le live n’en publie que 1 ou 2 : le budget sommeil coupe le reste |
| `disc_rest_assoc` | repos × perf, famille sport, pas le budget sommeil |
| `disc_ratio_structure` / `disc_structural_memory` | structure push/pull, mémoire (pompes déclinées remplacées) |
| `disc_stimulus_mix` / `disc_cardio_strength` | mix de stimuli ; course vs renfo, visible dès que les km existent (6 mois+) |
| `disc_family_fade` | famille qui s’efface (dips dans la poussée) |
| `disc_best_month` | juin / octobre / novembre selon la fenêtre — c’est la queue « best months » racontée en carte |

Autres producteurs, kinds vus dans le code et pour une partie dans les titres live :

| Origine | Kinds |
|---|---|
| Jalons `recapMilestoneEngine` | `disc_ms_first_session`, `first_exercise`, `first_run`, `return_run`, `return`, `return_gtg`, `day_volume`, `first_hour`, `cumul`, `sessions` (**50e**, **100e**), `km`, `hours`, `pr`, `pr_consolidated`, `week_freq`, `weight` |
| Arc mensuel | `disc_monthly_volume_arc`, `disc_running_gap` |
| GTG non planifié | `disc_gtg_unplanned_now`, `_role`, `_progress` — « ne tient que par un passage hors planning », « les passages hors planning de la fenêtre d’avant ne se sont pas prolongés » (12 puis 0) |
| Adhérence | `disc_plan_follow_rate`, `disc_plan_data_insufficient` (ce dernier est une limite méthodologique : il ne doit pas prendre un slot principal) |
| Fréquence × plan | `disc_freq_progress_high`, `disc_freq_progress_low`, `disc_freq_decline_low_exposure` |
| Concentration / trajectoire horizon | `disc_th_concentration_now`, `_trajectory`, `_journey`, `disc_th_composition_now`, `disc_th_series_journey`, `disc_th_continuity_journey`, `disc_th_pushPull_now`, `disc_th_repertoire_fact` |
| Sommeil rythme | `disc_sleep_rhythm_habit`, `disc_sleep_rhythm_obs`, `disc_sleep_drift`, `disc_sleep_regularity`, `disc_sleep_reference` |
| Span (pas un `disc_` ) | `span_volume_vs_frequency` et les autres lectures `span_*`, remontées dès 30 jours |

La sélection (`selectPeriodDiscoveriesWithTrace`) ne publie pas cette liste. Elle score la valeur informative, applique la mémoire anti-répétition, collapse deux reprises du même mouvement, écarte les rivaux, puis remplit les trois natures dans les plafonds. Ce qui reste est ensuite re-filtré au moment des colonnes (`selectNarrativeColumns`) et de la parenté (`keepDistinctProofCards`). Le chiffre « 20 » ou « 44 » est le **reste**, pas le nombre de détections.

---

## 14. Détail d’un jour et ancres sous les cartes

Le clic d’un jour ne relance pas le moteur. Il ouvre `DayDetail` dans le module du haut : date, total de reps, une ligne par mouvement coché, bouton Fermer. Si le jour est aujourd’hui, le libellé porte « aujourd’hui ». Un second clic sur le même jour referme.

Les ancres « This page » descendent dans la **même** vue, une fois la phase `full` passée (`detailsOn`) :

- Récap → le module du haut (`#recap`) ;
- Repères, Vision coach, Programme, Synthèse → blocs de `RecapAnalyseDetails` (jours d’activité, reps de la fenêtre, volume kg×reps, jours de la semaine, cartes coach sport / nutrition / calendrier, défis, et en admin la question de période plus les découvertes écartées).

Ces blocs ne sont pas un second moteur. Ils relisent `assessment` et `enrichment` déjà calculés pour la fenêtre. Les suffixes `*28` dans les champs (`totalReps28`) sont un nom historique : le nombre affiché est celui de la fenêtre active (1 002 sur 7 jours, 5 211 sur 30 jours, pas un 28 jours figé).

---

## 15. Ce que la première rédaction de ce fichier avait aplati

La version écrite avant la recette décrivait le mécanisme et citait les plafonds théoriques. Elle ne montrait pas :

- les totaux réels, ni le palier 32 768 reps / 95 066 kg / 83 km entre 1 an et 2 ans ;
- que la course est à 0 km jusqu’à 3 mois puis 54,7 km à 6 mois et 83 km ensuite ;
- que All time a des cartes et pas de bandeau ;
- que le pack va de 4 à 46 cartes, que le répertoire naît à 3 mois, que l’alerte est réservée au jour vide ;
- que les mêmes cartes de parcours traversent les plages ;
- les contradictions de série, de durée et d’identifiant `exercice 301` ;
- le délai réel (environ 45–50 s à 6 mois et 1 an) pendant lequel le libellé de dates est déjà le bon et les tuiles sont encore absentes ;
- le détail du 11 novembre et la grille 30 jours telle qu’elle est peinte (calendrier, pas une ligne de 30 pastilles illisibles).

La section 9 reste la carte d’intention. La section 12 est ce que le compte montrait le 18 novembre. Quand les deux divergent, la section 12 a raison pour l’écran, le code a raison pour la cause (start null, deux calculs de série, budget sommeil, pénalités contournées par le mot « lifetime »).

---

## 16. Livraison du 18 novembre — corrections dont la cause était établie

Fenêtre observée dans Cursor, compte @zingariello1314, 7 jours (12 → 18 novembre 2026), avant rechargement de la page.

| Surface | Avant | Après, sur l’écran ou sur un passage frais du moteur |
| --- | --- | --- |
| Tuile « Best streak » | 5, série de novembre entier | 2 · novembre 2026 (portion) |
| Phrase sous le module | 2 j. · 13 → 14 novembre | BEST STREAK : 2 j. · vendredi 13 novembre 2026 → samedi 14 novembre 2026 |
| Durée de la carte kcal | paquet publié : « 9 min d'exercices » | passage frais : « 3 h 15 hors course », 3 162 kcal |
| Bandeau et mesure | — | 195 min des deux côtés, course 0, 1 002 reps, 3 jours |

La carte encore affichée disait 9 min parce que le paquet publié ne portait pas d’édition du moteur : la mesure fraîche du même instant valait déjà 195 min. La clé de cache inclut désormais `m1-window-streak-v1`. Les anciens paquets restent en base ; le prochain calcul de la période ne les reprend pas comme vérité.

Expérience isolée, même page, historique non réécrit, snapshot réel non modifié. Moteur actuel sur les données telles quelles : 22 cartes. Même passage après ajout d’une séance synthétique de 332 reps le 17 novembre : 21 cartes, aucune identité `kind + titre` disparue, aucune nouvelle. L’écart d’un exemplaire est un doublon, pas une conclusion perdue. Le paquet affiché à ce moment en comptait 20 : il n’était pas le passage frais.

`exercice 301` est rejeté par `insightRejectReason` (`anonymous_exercise_label`). « Toujours » prend comme début la première preuve datée, sans année inventée ; `getRecapDateWindow('all')` reste sans début pour les autres appelants.

Tests : `recapMission1Metrics.test.js` et le cas « exercice 301 » dans `recapExerciseIdentityDisplay.test.js`, 23 tests verts.

