# Latence coche, enregistrement, pourcentages, barre d’XP

Relevé d’architecture au 18 novembre 2026. Rien n’est corrigé ici : ce document nomme les problèmes, le fichier qui les porte, et l’ordre dans lequel ils s’additionnent.

Symptômes visés :

- cocher un exercice n’est pas fluide ; il faut parfois cliquer une deuxième fois pour que la case reste cochée ;
- Enregistrer met longtemps à finir ;
- les pourcentages de complétion bougent environ 4 à 5 secondes après la coche ;
- la barre d’XP bouge encore 3 à 4 secondes après ces pourcentages ;
- le même décalage se retrouve sur un défi pompes, un Grease the Groove et les étirements.

Il n’y a pas un minuteur de 4 secondes. Le délai est la somme de files d’attente, d’écritures disque et de calculs qui ne démarrent qu’une fois la précédente terminée.

---

## 1. Trois couches qui ne se mettent pas à jour ensemble

| Couche | Ce qu’elle contient | Quand elle bouge au clic sur une case |
| --- | --- | --- |
| Brouillon séance | `tempDataRef` dans `useWorkoutExercises` | Tout de suite, en mémoire |
| Donnée React persistée | `data` du `WorkoutContext` | Seulement après la fin de l’écriture disque |
| XP publié | `publishedXp` dans `useSportXP` | Seulement après un nouveau calcul sur `data` |

La coche d’un exercice n’écrit pas `data`. Elle n’invalide pas l’XP. Le pourcentage de séance et la barre d’XP lisent `data`, donc ils attendent l’enregistrement.

Fichiers pivots :

- `src/components/tabs/TodayTab.jsx` — coche, score de séance, bouton Enregistrer
- `src/context/WorkoutContext/hooks/useWorkoutExercises.js` — brouillon et persistance
- `src/context/WorkoutContext/sessionDraftStore.js` — qui a le droit de se redessiner
- `src/hooks/useWorkoutData.js` — `updateData` / IndexedDB
- `src/services/workout/workoutDbGateway.js` — écriture du jour + relecture de contrôle
- `src/hooks/useSportXP.js` — cache et publication de la barre
- `src/hooks/useSportGrade.js` — notes et agrégats recalculés après l’XP
- `src/components/tabs/TodayTab/components/SportXPBar.jsx` — affichage

---

## 2. Ce qui se passe quand on coche un exercice

### 2.1 La case (immédiat, fragile)

`TodayExerciseCheck` (`TodayTab.jsx`, vers 263–286) ne lit pas le brouillon au moment du clic.

1. Elle pose une coche optimiste dans une `Map` module (`setOptimisticCheck`).
2. Elle appelle `onToggle(next)`.
3. Un `useEffect` retire la coche optimiste dès que la prop `checked` vaut la même chose.

`queueExerciseCheck` (vers 938–953) n’applique pas la coche dans le même tour. Il l’envoie au frame d’animation suivant, et annule le frame déjà prévu pour le même exercice.

`applyExerciseCheck` (vers 766–933) relit `getCurrentData()`. Si l’état lu est déjà celui demandé, la fonction **sort sans écrire et sans retirer la coche optimiste**. Sinon elle passe par `patchSessionExerciseDraft`.

Travail synchrone fait dans ce handler avant même d’avoir fini d’écrire le brouillon : résolution de l’exercice, collecte de toutes les clés, mémoire du même jour de semaine, poids, journal de séries (`buildSetLogFromPrescription`). Une exception est avalée par `queueExerciseCheck`, qui **retire** la coche optimiste. La case revient en arrière. Le clic suivant retente.

### 2.2 Le brouillon (la carte bouge, le reste non)

`patchSessionExerciseDraft` (`useWorkoutExercises.js`, vers 431–448) :

- copie les maps de séance si besoin ;
- marque `dirtyFlagsRef.exercises = true` ;
- appelle `setSessionCommitDirty({ exercises: true })` (le bouton Enregistrer apparaît) ;
- si un `exerciseId` est fourni — c’est le cas de toutes les coches — appelle **seulement** `bumpExerciseUi(exerciseId)` puis **return**.

Conséquences :

- la carte de cet exercice se redessine (`IsolatedTodayExerciseCard` écoute `useExerciseUiVersion`) ;
- `bumpSessionDraft` n’est pas appelé ;
- `hasUnsavedExercises` (state React) n’est pas mis à `true` ; seul le ref `dirtyFlagsRef` l’est ;
- le canal XP du store (`subscribeSessionDraftXp` / `urgentXp`) n’a **aucun abonné**, et la coche ne l’utilise pas.

`scheduleAutoPersist` (délai `AUTO_PERSIST_MS = 2000`, même fichier vers 185–191) n’est appelé nulle part. L’auto-enregistrement prévu n’existe pas. Tant qu’on n’appuie pas sur Enregistrer, `data` ne change pas.

### 2.3 Le pourcentage de séance (il ignore la coche)

Le score affiché (`TodayTab.jsx`, vers 1677–1680 et 2199–2221) :

```js
useMemo(
  () => computeTodaySessionComplexity(currentDate, workout, getCurrentData(), isGymMode),
  [currentDate, workout, isGymMode, getCurrentData, data, hasUnsavedExercises]
)
```

`getCurrentData()` lit bien le brouillon **si** le memo se recalcule. Il ne se recalcule pas à la coche :

- `data` ne change pas ;
- `hasUnsavedExercises` ne change pas (le ref sale ne fait pas partie des dépendances) ;
- `TodayTab` n’écoute ni `useSessionDraftVersion` ni `useExerciseUiVersion`.

Le libellé de volume sur la carte (`evaluateVolumeCompletion`, vers 2478) est dans `IsolatedTodayExerciseCard`. Lui peut suivre la coche, parce que la carte se redessine. La barre et le pourcentage de séance, non.

`TodayDraftReader` (vers 315–319 et 2417) enveloppe la liste et écoute le brouillon global. Une coche avec `exerciseId` ne notifie pas ce canal. La liste globale ne se reconstruit pas pour autant.

Le pourcentage bouge quand `data` change, c’est-à-dire à la fin de l’enregistrement, dans un `startTransition`.

### 2.4 Enregistrer (le temps long)

`handleSaveExercises` (`TodayTab.jsx`, vers 1071–1084) :

1. ignore le clic si un enregistrement est déjà en cours (`savingLockRef`) ;
2. attend deux frames (`yieldToNextPaint`) ;
3. peut lancer un échange de jour de repos (`maybeApplyRestDaySwapBeforeSave`), lui-même un `updateData` ;
4. appelle `saveExerciseChanges()`, plafonné à **25 s** (`SESSION_SAVE_TIMEOUT_MS` dans `src/utils/sessionSaveTimeout.js`).

`saveExerciseChanges` est `saveSessionDraft` (`useWorkoutExercises.js`, vers 329–358). Il peut relancer jusqu’à 4 fois si une frappe arrive pendant l’écriture (`result === 'stale'`).

`persistFullDraft` (vers 222–325), pour un enregistrement forcé :

1. attend la promesse d’écriture précédente (`persistTailRef`) — les clics s’alignent, ils ne se parallélisent pas ;
2. attend encore deux frames ;
3. normalise et assainit le brouillon (`sanitizeDraftForPersist` parcourt reps et poids) ;
4. appelle `updateData` avec `strict: true`, `skipReact: true`, `skipCloud: true`, `applyReactAfterPaint: true`.

`updateData` (`useWorkoutData.js`, vers 1335–1410) :

- avec `skipReact`, **ne fait pas** `setData` avant le disque ;
- avec `strict` + un jour de séance, passe par `saveSessionDayIncremental` sans la file globale ;
- sinon entre dans `runSerializedSave` (vers 309–319), une seule écriture à la fois.

`saveSessionDayIncremental` (vers 719–733) écrit la tranche du jour via `persistWorkoutSessionDay`.

`persistWorkoutSessionDay` (`workoutDbGateway.js`, vers 369–397) :

1. import dynamique du gateway à **chaque** enregistrement ;
2. `put` IndexedDB, timeout **10 s** (`SESSION_PUT_TIMEOUT_MS`) ;
3. **relit** la ligne pour vérifier qu’elle existe (deuxième aller-retour disque, autre timeout).

Si le store des séances manque, repli : lecture de **toute** la ligne workout, fusion, réécriture de l’agrégat (`saveSessionDayOntoAggregate`, timeout 12 s). C’est l’ancien chemin lent.

Le commentaire dans `workoutDbGateway.js` (vers 360–363) dit que l’écriture de la ligne `workouts` entière a été retirée du chemin normal parce qu’elle clonait photos, endurance et historique sur le fil de l’interface. Le repli et les autres activités (GTG, pompes) réouvrent ce coût.

Après un `force` réussi (`useWorkoutExercises.js`, vers 275–303) :

- le brouillon est jeté ;
- `setData` n’a toujours pas eu lieu (il est dans `applyReactAfterPaint`) ;
- `bumpSessionDraft` et `bumpSessionCommitEpoch` ne sont **pas** appelés ;
- `invalidateSportXpCache` est repoussé dans `scheduleTodayCheckIdle(..., 800)`.

`scheduleTodayCheckIdle` (`todayCheckMeasure.js`, vers 37–54) = deux frames, puis `requestIdleCallback` avec un timeout de 800 ms. Dans ce callback : invalidation XP, événement sidebar, et `flushWorkoutAggregateCloudPushNow` de **toute** la ligne.

`applyReactAfterPaint` (`useWorkoutData.js`, vers 1396–1402) : encore deux frames, puis `startTransition(() => setData(...))`.

C’est ce `setData` qui autorise enfin le `useMemo` du pourcentage à se relancer.

Ordre réel après le clic sur Enregistrer :

1. frames d’attente (handler + persistance) ;
2. file d’écriture si une autre est en cours ;
3. put IndexedDB + relecture de contrôle ;
4. deux frames + `startTransition` ;
5. rendu de `TodayTab` et de tous les consommateurs de `useWorkout()` ;
6. **pendant ce rendu**, `useSportXP` recalcule une signature en parcourant toutes les clés cochées, caractère par caractère (`useSportXP.js`, vers 314–349) ;
7. le pourcentage peut enfin se peindre ;
8. ensuite seulement l’effet XP (section 3).

Le « 4 à 5 secondes après la coche » est ce tuyau, pas un délai écrit `4000`. Si l’utilisateur coche puis enregistre tout de suite, il mesure les deux d’affilée. Sans Enregistrer, le pourcentage de séance n’a aucune raison de bouger.

---

## 3. Pourquoi la barre d’XP arrive après les pourcentages

`useSportXP` (`useSportXP.js`, vers 184–185) :

```js
/** Totaux / XP : uniquement les données déjà enregistrées, pas le brouillon de coche. */
const workoutData = data;
```

Tant que `data` n’a pas changé, la signature ne change pas, l’effet ne part pas, la barre ne bouge pas. La coche seule ne peut pas la faire bouger.

Quand `data` change enfin :

1. le rendu qui peint les pourcentages paie déjà le parcours de signature (toutes les coches, étirements, étoiles, circuits, GTG, nutrition, Garmin) ;
2. l’effet (vers 489–545) attend encore `scheduleSportXpAfterPaint` = **deux** `requestAnimationFrame` ;
3. il lance `calculateSportXP` (`src/services/xp/xpCalculations.js`, vers 326–756) sur tout l’historique, pas sur la journée ;
4. il écrit le cache module et `sessionStorage`, puis `setPublishedXp` ;
5. `SportXPBar` ne lit pas `useSportXP` directement : elle lit `useSportGrade` (`useSportGrade.js`, vers 7–38), qui refait maîtrise, agrégats et grades à partir du nouvel XP.

L’invalidation à +800 ms (`invalidateSportXpCache`) ne fait que mettre `signature: null` sur le cache module. Elle ne relance pas le calcul. Le calcul part parce que la chaîne de signature a changé avec `setData`. Les 800 ms servent au push cloud et à l’événement sidebar, en plus, sur le thread déjà occupé.

D’où l’ordre observé : pourcentages au commit de `data`, barre d’XP un effet plus tard, le temps du calcul complet. Les 3 à 4 secondes ne sont pas un deuxième timer : c’est `calculateSportXP` + grades, démarrés seulement après la peinture des pourcentages, et encore décalés de deux frames.

Le cache garde l’ancien total exprès (commentaire vers 80–87) pour éviter un flash à 0. La barre reste donc sur l’ancienne valeur pendant tout ce temps. Ce n’est pas un squelette de chargement, c’est l’ancienne XP.

---

## 4. Problème « il faut cocher deux fois »

Plusieurs mécanismes se cumulent. Le plus cohérent avec « parfois, le premier clic ne tient pas » :

1. **Coche optimiste retirée sans écriture.** `queueExerciseCheck` efface l’optimiste si `applyExerciseCheck` jette. Le handler fait beaucoup de travail synchrone (mémoire du jour, journal de séries). Une exception remet la case à l’état précédent. Le clic suivant refait le chemin.
2. **Sortie anticipée.** Si `getCurrentData()` dit déjà « coché » alors que la prop `checked` de la carte dit encore « non » (lecture pas la même, frame annulé, brouillon pas encore visible), `applyExerciseCheck` n’écrit rien. L’effet retire l’optimiste dès que les deux booléens coïncident un instant, puis un rendu suivant relit l’ancienne donnée. La case se décoche visuellement.
3. **Deuxième `onChange` dans le même tour.** La case est contrôlée (`checked={shown}`). Le clic met l’optimiste à `true` et programme un frame. Si un rendu parent repasse `checked` à `false` avant que le state local ait suivi, React ramène l’input natif à faux, ce qui peut relancer `onChange`. Le second passage lit l’optimiste `true`, donc envoie `false`, et `queueExerciseCheck` **annule** le frame du premier clic. Résultat net : rien. Le clic d’après coche pour de bon.
4. **File d’un frame par exercice.** Deux notifications rapprochées pour le même id : la première est annulée, seule la dernière valeur est appliquée.

La carte et le pourcentage ne partagent pas le même signal (`bumpExerciseUi` contre `data`). On peut voir la case bouger (optimiste) pendant que le reste de l’écran, lui, n’a rien enregistré. Au rendu suivant l’optimiste est jeté et la case revient.

---

## 5. Défi pompes, Grease the Groove, étirements

Même séparation brouillon / `data` / XP, avec une différence importante : pompes et GTG n’utilisent **pas** le brouillon de séance. Chaque action appelle `updateData` sur l’objet workout entier et attend la fin.

### Grease the Groove

`GtgTodaySchedulePanel.jsx`, `persistGtg` (vers 62–91).

- Cocher une mini-série, ajouter ou retirer un passage : `await updateData(merged)` **sans** `strict`, **sans** `sessionDay`, **sans** `skipReact`.
- `updateData` fait donc `setData` tout de suite, puis `runSerializedSave` → `saveToDB` sur le chemin **complet** (assainissement de toutes les reps, poids, séries, logs de tout l’historique — `useWorkoutData.js` vers 788–911), pas l’écriture du jour seul.
- La barre de progression GTG (`dayPlan.progressPct`, vers 135) dépend de `data`. Elle attend ce `setData`, donc elle attend aussi le rendu de tous les consommateurs du contexte, signature XP comprise.
- `invalidateSportXpCache()` n’est appelé qu’**après** le `await updateData`. La barre d’XP, elle, part de l’effet déclenché par `setData`, puis paie `calculateSportXP` en entier.
- Pendant `setSaving(true)`, l’UI de la carte est en enregistrement. Le clic suivant est couplé à la file `runSerializedSave`.

### Défi pompes

`PushupChallengeTodayPanel.jsx`, `onSave` (vers 385–433).

- Construit d’abord la séance (`buildWorkoutAfterEnduranceSession`), puis `await updateData(payload)` dans les mêmes conditions que le GTG : pas de chemin incrémental.
- `invalidateSportXpCache()` seulement après l’écriture.
- Le formulaire local est vidé après coup. Le pourcentage et l’XP suivent `data`, pas le formulaire.

### Étirements

`useStretchTracking.js`, `toggleStretch` (vers 62–79) → `updateTempStretchData`.

- Le brouillon est marqué sale et `bumpSessionDraft()` est appelé (pas de canal par item). La liste d’étirements, elle, se redessine (`StretchList` / `StretchItem` écoutent `useSessionDraftVersion`).
- `hasUnsavedStretches` (state) n’est pas mis à `true` ici non plus. Le score de séance, qui dépend de `data` et `hasUnsavedExercises`, ne bouge toujours pas.
- L’enregistrement passe par `saveStretchChanges` = le même `saveSessionDraft` que les exercices (même file, mêmes frames, même IndexedDB, même XP à +800 ms).
- `handleStretchDataChange` dans `TodayTab` synchronise en plus les quêtes liées aux étirements sur le clic. Travail en plus sur le fil du clic, sans faire avancer l’XP.

### Autres coches (même famille, autre écran)

Ces chemins font `updateTemp…` puis `await saveExerciseChanges()` / `saveStretchChanges()` dans le clic, donc ils encaissent la latence d’enregistrement **dans** le geste de coche :

- `src/components/dashboard/DashboardGarminSportRecapBlock.jsx`
- `src/components/sidebar/historical/SidebarSportPlanningModule.jsx`

Le widget d’accueil `HomeTodayExercisesWidget.jsx` coche via `useExerciseTracking` sans le pipeline optimiste de `TodayTab`. Il n’est pas la source du double clic décrit plus haut, mais il écrit le même brouillon.

---

## 6. Problèmes à cibler

Chaque ligne est un levier distinct. Les corriger dans le désordre (par exemple recalculer l’XP plus tôt sans changer qui lit quoi) ne rendra pas la case fluide.

### P1 — La case et la donnée affichée ne sont pas la même source

- Fichiers : `TodayTab.jsx` (`TodayExerciseCheck`, `queueExerciseCheck`, `applyExerciseCheck`), `sessionDraftStore.js`.
- La coche visible est une `Map` optimiste, réconciliée un frame plus tard, annulable, et retirée si le handler jette ou si la prop `checked` la rattrape trop tôt.
- Effet : premier clic perdu, case qui revient en arrière, impression qu’il faut cocher deux fois.
- Cible : une seule écriture du brouillon dans le clic, sans frame d’écart, et ne pas effacer l’affichage tant que le brouillon n’a pas la valeur demandée.

### P2 — Le pourcentage de séance n’écoute pas le brouillon

- Fichiers : `TodayTab.jsx` (memo vers 1677), `useWorkoutExercises.js` (`patchSessionExerciseDraft` ne met pas à jour `hasUnsavedExercises` et ne bumpe pas le brouillon global quand il y a un `exerciseId`).
- Effet : la barre de complétion reste figée jusqu’au `setData` de fin d’enregistrement (les 4–5 s).
- Cible : faire dépendre ce memo du brouillon de séance (ou d’une version par jour), pas de `data`.

### P3 — L’enregistrement bloque l’affichage alors que le brouillon est déjà bon

- Fichiers : `useWorkoutExercises.js` (`skipReact: true`, deux `yieldToNextPaint`), `useWorkoutData.js` (`applyReactAfterPaint` + `startTransition`), `workoutDbGateway.js` (put + relecture, import dynamique, repli agrégat).
- Effet : Enregistrer ne « prend effet » qu’après le disque. Le `startTransition` peut encore être doublé par le calcul de signature XP dans le même rendu.
- Cible : publier `data` (ou au moins les maps du jour) avant l’attente IndexedDB ; garder la relecture de contrôle hors du chemin qui débloque l’UI ; ne pas réimporter le gateway à chaque clic.

### P4 — Pompes et GTG réécrivent tout l’historique

- Fichiers : `GtgTodaySchedulePanel.jsx`, `PushupChallengeTodayPanel.jsx`, branche non incrémentale de `saveToDB`.
- Effet : le même geste paie l’assainissement de toutes les maps et la file `runSerializedSave`, puis seulement l’XP.
- Cible : le même contrat que la séance (`strict` + jour, ou une écriture limitée à `enduranceData`), et un `setData` qui ne reconstruit pas tout le contexte avant d’avoir rendu la main.

### P5 — L’XP est un deuxième pipeline, volontairement en retard

- Fichiers : `useSportXP.js` (lecture de `data` seul, double frame, `calculateSportXP` global), `useSportGrade.js`, `useWorkoutExercises.js` (invalidation idle 800 ms), `sessionDraftStore.js` (canal XP sans abonné).
- Effet : la barre bouge 3 à 4 secondes après les pourcentages, y compris quand le pourcentage a déjà la bonne valeur.
- Cible : publier un delta du jour (exercice coché, reps GTG, série de pompes, étirement) sans rebalayer l’historique et sans attendre l’idle. Garder le recalcul complet pour l’arrière-plan. Le commentaire « pas le brouillon » est la cause du décalage, pas un détail.

### P6 — La signature XP ralentit le rendu qui devrait montrer les pourcentages

- Fichier : `useSportXP.js`, memo `xpSignature` (vers 314–487), exécuté chez chaque composant qui appelle le hook, sur le rendu déclenché par `setData`.
- Effet : le moment où les pourcentages apparaissent est aussi le moment où l’on parcourt toutes les clés. Ça allonge les 4–5 s et ça repousse le départ du calcul de barre.
- Cible : signature incrémentale (compteurs du jour), pas un checksum de chaque caractère de chaque clé.

### P7 — File unique et timeouts longs

- `persistTailRef` + `runSerializedSave` : une écriture GTG bloque l’enregistrement de séance, et l’inverse.
- Plafonds : 25 s côté bouton, 10 s côté put du jour, 8 s côté opération IndexedDB générique, 12 s côté repli agrégat. L’UI a le droit d’attendre jusque-là avant de dire que ça a échoué.
- Le push cloud de la ligne entière est dans l’idle d’après enregistrement. Il ne doit pas rester sur le chemin qui met à jour les pourcentages.

### P8 — Code mort qui laisse croire qu’un raccourci existe

- `scheduleAutoPersist` / `AUTO_PERSIST_MS = 2000` : jamais appelés. Il n’y a pas d’enregistrement deux secondes après la coche.
- `subscribeSessionDraftXp` : aucun appelant. `urgentXp` ne réveille pas la barre.
- `flushDirtySessionDraft` retourne `undefined`. Le commentaire dit « plus de sauvegarde cachée ».

---

## 7. Ordre de correction utile

1. P1, pour que la case tienne au premier clic, sans attendre le disque.
2. P2, pour que le pourcentage suive le brouillon dans le même rendu que la carte.
3. P5 et P6 ensemble, pour que la barre d’XP suive ce pourcentage au lieu d’attendre un calcul d’historique.
4. P3, pour que Enregistrer ne soit plus ce qui débloque l’écran.
5. P4, pour aligner pompes, GTG et étirements sur le même contrat que la séance.
6. P7 en dernier : il raccourcit le pire cas, il ne change pas l’ordre des couches.

P8 se nettoie au passage, pour ne pas réactiver un auto-save de 2 s qui réintroduirait la file disque dans le clic.
