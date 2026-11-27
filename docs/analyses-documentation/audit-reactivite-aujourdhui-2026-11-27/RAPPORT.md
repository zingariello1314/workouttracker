# Audit de fluidité — Sport → Aujourd’hui

La console a été reprise ensuite : [FLIGHT-RECORDER-V2.md](FLIGHT-RECORDER-V2.md). Le total V1 mélangeait le traitement et l’attente du rappel de frame.

27 novembre 2026. Node v24.11.1, Vitest 4.0.15, jsdom. Aucune donnée personnelle n’a été lue. Aucune règle métier n’a été changée. Les durées de clic dans le navigateur, sur le profil réel, ne sont pas encore mesurées : la console qui permet de les exporter est en place, en développement seulement.

## 1. Cartographie

Aujourd’hui est `TodayTab` (`src/components/tabs/TodayTab.jsx`). Il est chargé en différé, puis gardé monté : dès que l’authentification a fini de se résoudre, `App.jsx` pose `warmToday` et monte l’onglet, même s’il est caché (`display: none`). Rouvrir l’onglet dans la même session ne reconstruit donc pas la page. Le premier montage a lieu pendant le démarrage, pas au moment où l’onglet devient visible.

Le clic sur une case ne passe pas par `toggleCheck`. `TodayExerciseCheck` inverse d’abord un état optimiste local, puis `queueExerciseCheck` attend une frame et appelle `applyExerciseCheck`.

Cette fonction :

1. lit le brouillon en mémoire (`getCurrentData`) ;
2. si c’est une coche, parcourt toutes les clés de `reps` dans `findLastSameWeekdayExercisePerformance` ;
3. copie, à la première modification de la séance, toutes les cartes de brouillon (`copySessionMaps`) ;
4. écrit la coche, les répétitions et la charge dans ce brouillon ;
5. prévient seulement la carte de cet exercice (`bumpExerciseUi`).

« Enregistrer » appelle `saveExerciseChanges`, qui écrit l’agrégat entier via `updateData` (`strict`, `skipReact`, `skipCloud`, puis peinture React après l’écriture). Le toast de succès vient après cette écriture. L’invalidation XP, l’événement de barre latérale et la poussée cloud partent ensuite, au plus tôt dans un `requestIdleCallback` de 800 ms. La synchro des quêtes liées part aussi en idle.

Le pourcentage de séance (`computeTodaySessionComplexity`) est un `useMemo` de `TodayTab`. Ses dépendances sont la date, le programme, `data` et `hasUnsavedExercises`. Une coche ne change aucune de ces valeurs : le pourcentage ne bouge pas au moment de la coche.

## 2. Inventaire présent dans Aujourd’hui

Présents dans le rendu de `TodayTab` :

- navigation de date et de semaine ;
- pastilles de jour et combinaison de plusieurs séances ;
- score de séance (charge réalisée / prévue, nombre d’exercices) ;
- exercices du programme, exercices ajoutés, exercices masqués ;
- coche, répétitions, charge, charges par série, ressenti, adaptation séries × reps du jour ;
- barre Enregistrer / Annuler, partagée entre exercices et étirements ;
- défis pompes et planning GTG ;
- étirements, pliométrie, drills, s’ils existent dans la séance ;
- feedback de séance, proposé après un enregistrement réussi ;
- préparation nutrition et pesée, selon les préférences.

`gtgService` n’est pas sur le chemin de la coche d’exercice. Les quêtes calmes sont lues au montage et resynchronisées pour les étirements, puis après l’enregistrement.

## 3. Chronologie de chargement

Ordre lu dans le code, sans durée d’écran :

1. `main.jsx` monte l’application en `StrictMode` (développement : les effets de montage peuvent partir deux fois).
2. Le module diagnostic note l’instant de chargement si la capture est déjà armée (`?todayDiag=1` ou clé locale).
3. `WorkoutContext` charge l’agrégat IndexedDB (`loadData` : lecture, enrichissement des séances, garde endurance, éventuellement cloud).
4. Après l’auth, Aujourd’hui est préchauffé et fait son premier rendu, encore caché.
5. Le premier rendu appelle `useTodayExercises` (programme du jour, variations, exercices supplémentaires) et le score de séance.
6. `markTodayViewPrepared` libère la suite du pipeline de démarrage.
7. Rendre l’onglet visible ne remonte pas l’arbre.

| Repère | Ce qui est connu |
| --- | --- |
| Avant le premier affichage | Non mesuré à l’écran. Le préchauffage le place pendant le démarrage. |
| Avant le programme | Le programme vient de `getTodayWorkout` dans le même rendu que la liste. |
| Avant l’interactivité | Les cases existent dès ce rendu. Leur coût de clic est indépendant. |
| Avant la restauration | Les valeurs affichées sont celles de l’agrégat déjà en mémoire, ou du brouillon s’il est sale. |
| Informations secondaires | XP de la barre, quêtes, feedback et cloud ne sont pas sur le chemin du premier clic. |
| Stabilisation | Non mesurée. L’index des dernières charges se construit par tranches d’environ 6 ms, en idle, et se met en pause dès qu’une séance est sale. |

Chemins à comparer avec la console, pas encore chronométrés ici : premier lancement, ouverture depuis un autre onglet, réouverture, changement de date, retour à aujourd’hui, rechargement complet.

Le chemin indispensable avant de cocher est : agrégat en mémoire, programme du jour, liste d’exercices. La recherche d’historique, l’index de charges, le score global, les quêtes, le cloud et l’XP n’ont pas besoin d’être finis pour peindre la case.

## 4. Flux de données

```text
case
  → état optimiste (cette case seulement)
  → frame suivante
  → brouillon en mémoire (refs, pas IndexedDB)
  → notification de cette carte, ou de toutes les cartes si la notification est globale
Affichage lu par getCurrentData()
Enregistrer
  → file d’écriture
  → updateData / IndexedDB
  → toast
  → idle : quêtes, invalidation XP, cloud
```

Il n’y a plus d’auto-enregistrement du brouillon : `scheduleAutoPersist` est défini et n’est appelé par personne. Les répétitions passent par `writeExerciseDraftCell`, qui ne notifie pas les cartes. La charge passe par `patchSessionExerciseDraft` sans identifiant d’exercice, donc `bumpSessionDraft`. `TodayDraftReader` écoute ce canal et reconstruit la fonction enfant de chaque carte. Le `memo` de `IsolatedTodayExerciseCard` voit alors une nouvelle fonction et toutes les cartes se re-rendent.

La coche, elle, passe un `exerciseId` et ne réveille que sa carte. Les deux chemins n’ont pas le même rayon.

## 5. Coche, décoche, autofill

Réception : `TodayExerciseCheck` inverse l’optimiste, puis programme `requestAnimationFrame`. Un second clic sur le même exercice annule la frame précédente. Le travail lourd est dans cette frame, donc avant la peinture. L’optimiste peut être déjà dans le DOM et rester invisible tant que la frame n’a pas fini.

Décoche : pas de parcours d’historique. Suppression des répétitions, charges, séries et ressentis des clés de l’exercice, puis notification de cette carte. La disparition visuelle attend la fin de cette frame et le rendu de la carte.

Coche : parcours complet de `reps`, puis copie des cartes si le brouillon n’existe pas encore, puis écriture des valeurs et construction du journal de séries. Les règles de choix sont inchangées : charge du jour, sinon dernier même jour de semaine, sinon index de dernière charge s’il est prêt, sinon rien. Répétitions : mémoire du même jour, sinon prescription.

Une valeur historique n’est pas relue dans IndexedDB à chaque coche. Elle est cherchée dans l’objet déjà en mémoire, mais cet objet est parcouru en entier à chaque coche. L’index de charges, lui, est incrémental et ne sert que s’il est déjà terminé. Une coche le met en pause.

Une réponse tardive de cet index ne réécrit pas une case déjà décochée : la décoche a retiré les clés, et l’index ne fait que lire. Ce qui peut réafficher une valeur est un rendu qui relit encore l’ancienne clé, ou une frame de coche annulée trop tard. Le second cas existe dans le code (frame annulée seulement si elle n’a pas encore démarré) et n’a pas été reproduit à l’écran.

Le ressenti « il faut un deuxième clic » n’a pas été reproduit. Le code peut sortir sans écrire si l’état lu est déjà celui demandé, alors que l’optimiste a été inversé. L’effet de la case le réaligne seulement quand les deux concordent.

## 6. Enregistrement

Avant le clic : le brouillon est seulement en mémoire.

Au clic :

1. le bouton passe à « Enregistrement… » ;
2. deux `yieldToNextPaint` (un dans le bouton, un dans `persistFullDraft`) ;
3. échange éventuel du jour de repos ;
4. normalisation et assainissement de l’agrégat ;
5. attente de la file, puis `updateData` de tout l’agrégat ;
6. toast ;
7. décision de feedback, qui peut ouvrir la modale ;
8. en idle : quêtes, `invalidateSportXpCache`, événement sidebar, poussée cloud.

La confirmation visuelle du bouton précède l’écriture. Le toast de succès la suit. Ce ne sont pas la même chose. Le pourcentage et l’XP ne sont pas recalculés dans le gestionnaire de coche. L’XP est invalidée après l’enregistrement, en différé. Le pourcentage se recalcule quand `data` change, donc après la peinture qui suit l’écriture.

Un second enregistrement pendant le premier est ignoré par `savingLockRef`. Une frappe puis un enregistrement immédiat lit `tempDataRef`, pas une closure périmée.

La durée IndexedDB de cet enregistrement n’a pas été remesurée dans cet audit.

## 7. Mesures obtenues

Jeu synthétique, clés uniques, 7 échantillons, jsdom, pas le profil réel. Fichier : `diagnostics/today-interaction-cost.json`.

| Clés | Recherche même jour, médiane | Copie des cartes, médiane | Score de 8 exercices, médiane |
| --- | ---: | ---: | ---: |
| 501 | 0 ms | 0 ms | 1 ms |
| 4 001 | 3 ms | 3 ms | 8 ms |
| 24 001 | 19 ms | 31 ms | 64 ms |

À 24 001 clés, le maximum observé sur 7 passages est 19 ms pour la recherche, 35 ms pour la copie, 72 ms pour le score. Le 95e percentile est égal à ces maximums : l’échantillon est trop petit pour un percentile stable. La première passe et la médiane sont presque identiques.

La copie mesurée ne remplit que trois cartes (`reps`, coches, charges). Une séance réelle avec journaux de séries en plus coûtera davantage. Ce gain n’est pas mesuré.

La recherche plus la copie, au premier changement d’une grosse séance, occupe déjà environ 50 ms de JavaScript avant le rendu de la carte. La cible visuelle de 50 ms n’a alors plus de marge. À 4 000 clés, le même couple reste autour de 6 ms.

Le score de 64 ms ne part pas à chaque coche. Il part quand le mémo de `TodayTab` est invalidé : changement de date, remplacement de `data`, bascule du drapeau « non enregistré ». Huit exercices parcourent alors toutes les charges.

Aucune médiane de clic, de peinture, d’IndexedDB ou de rendu React n’a été prise dans Chromium sur une séance réelle. Le chiffre « 2 840 ms » du modèle demandé était fictif et ne décrit pas Momentum.

## 8. Problèmes, par impact

### P1 — Une charge réveille toutes les cartes

1. Chaque frappe de charge notifie le canal global du brouillon.
2. `updateLocalExerciseWeight` appelle `patchSessionExerciseDraft` sans `exerciseId`. `bumpSessionDraft` fait rendre `TodayDraftReader`, qui recrée la fonction de chaque carte.
3. Le code de `TodayTab.jsx` autour de l’appel, et `sessionDraftStore.js` `bumpSessionDraft`.
4. Coût de rendu non mesuré. Le fait que toutes les cartes reçoivent une nouvelle fonction enfant est démontré.
5. Chaque caractère dans un champ poids.
6. La saisie de charge peut bloquer le fil alors que la saisie de répétitions, elle, ne notifie pas les cartes.
7. `TodayTab.jsx`, `useWorkoutExercises.js`, `sessionDraftStore.js`.
8. Passer l’identifiant d’exercice, comme la coche le fait déjà. Ne pas changer la valeur enregistrée.
9. Gain potentiel : un seul rendu de carte au lieu de N. Non mesuré.
10. Risque : un indicateur hors carte (score, volume) qui dépendait de ce rendu global resterait ancien. Il l’est déjà pour la coche.
11. Test : une frappe de charge incrémente le compteur « Rendu carte exercice » de 1, pas du nombre d’exercices. Les répétitions et la charge conservées après Enregistrer restent les mêmes.

### P2 — La coche et la décoche travaillent avant la peinture

1. L’inversion optimiste et la recherche d’historique sont dans la même frame.
2. `queueExerciseCheck` utilise `requestAnimationFrame`, et `applyExerciseCheck` y fait la recherche puis la copie.
3. `TodayTab.jsx` `queueExerciseCheck` et `applyExerciseCheck`.
4. À 24 001 clés, 19 ms de recherche et 31 ms de copie, jsdom, avant rendu. Peinture réelle non mesurée.
5. Chaque première coche ou décoche d’une séance ; les coches suivantes évitent la copie si le brouillon est déjà détaché, pas la recherche.
6. La case et les valeurs n’apparaissent qu’ensemble, après ce travail.
7. `TodayTab.jsx`, `sameWeekdayExerciseMemory.js`, `useWorkoutExercises.js`.
8. Peindre l’optimiste, puis chercher. Pour la recherche, un index par exercice et jour de semaine, invalidé à l’écriture, au lieu de `Object.keys(reps)` à chaque fois. Garder les mêmes règles de choix.
9. Potentiel : la case bouge dans la frame du clic, et la recherche ne grandit plus avec tout l’historique. Non mesuré.
10. Un index faux réintroduirait une charge d’un autre jour. Il faut le comparer à la fonction actuelle sur des historiques synthétiques, y compris les clés sans répétitions et les deux séances le même jour.
11. Test de parité de `findLastSameWeekdayExercisePerformance`, puis export console : « Recherche des données » et « Peinture » séparés.

### P3 — Le pourcentage et l’XP ne suivent pas la coche

1. Le score lu à l’écran ne dépend pas du brouillon. L’XP n’est invalidée qu’après l’enregistrement, en idle.
2. Dépendances du `useMemo` `todaySessionComplexity`, et `scheduleTodayCheckIdle(..., 800)` dans `persistFullDraft`.
3. Code cité aux sections 1 et 6. Le score, quand il tourne, coûte 64 ms médianes pour 8 exercices et 24 001 charges, parce que `computeMedianWeightKgForExercise` parcourt toutes les charges pour chaque exercice.
4. 64 ms dans jsdom pour ce recalcul. Le délai jusqu’à l’écran après Enregistrer n’est pas mesuré.
5. Le score est recalculé aux changements de date et après l’écriture. L’XP, après chaque enregistrement de séance.
6. La coche semble ignorée par les compteurs, puis tout arrive d’un coup après Enregistrer.
7. `TodayTab.jsx`, `todaySessionScore.js`, `trainingLoadUtils.js`, `useWorkoutExercises.js`.
8. Calculer le score depuis le brouillon de la carte modifiée, et mémoriser la médiane de charge par exercice. Laisser l’XP après une persistance confirmée.
9. Potentiel : le pourcentage bouge avec la coche, sans attendre IndexedDB, et le parcours des charges n’est plus proportionnel au produit exercices × historique. Non mesuré.
10. Un score local faux serait pire qu’un score en retard. La parité avec `computeTodaySessionComplexity` est obligatoire. Ne pas émettre l’XP deux fois.
11. Tests de parité du score sur séance vide, partielle et complète, puis console : le score bouge avant « Écriture locale ».

### P4 — L’enregistrement confirme après toute l’écriture, puis continue de travailler

1. Le toast attend la fin de `updateData`. Les quêtes, l’XP et le cloud continuent après.
2. `handleSaveExercises` et `persistFullDraft`.
3. Ordre du code. Durée d’écriture non remesurée ici. Les audits du 18 novembre ont déjà montré qu’un timeout peut être pris pour un succès sur le chemin sans contrat d’issue. Aujourd’hui n’utilise pas le contrat E3.
4. Non mesuré dans cet audit.
5. Chaque Enregistrer.
6. Le bouton réagit, puis la page peut rester occupée par l’écriture, le feedback, les quêtes et l’XP.
7. `TodayTab.jsx`, `useWorkoutExercises.js`, `useWorkoutData.js`.
8. Ne pas déclarer le succès avant l’acquittement. Déplacer le feedback et les quêtes après la peinture de confirmation, sans les supprimer. Ne pas étendre E3 à toutes les séances dans la même correction.
9. Potentiel : la page redevient utilisable sans attendre l’XP. L’intégrité de l’écriture ne doit pas bouger.
10. Ouvrir le feedback avant de savoir si l’écriture a tenu afficherait une séance non sûre. Un double enregistrement ne doit pas créer une seconde séance.
11. Export console d’un enregistrement : préparation, écriture, peinture, puis quêtes. Deux clics rapides ne produisent qu’une écriture.

### P5 — Ouvrir l’onglet n’est pas le coût que l’on croit

1. Le montage est anticipé et caché. Le clic sur l’onglet ne fait souvent que le montrer.
2. `warmToday` dans `App.jsx`.
3. Code. Les deux durées (montage caché, affichage) ne sont pas séparées par une mesure d’écran.
4. Non mesuré.
5. Une fois par session pour le montage, à chaque visite pour l’affichage.
6. Une lenteur « à l’ouverture » peut être le démarrage entier, ou seulement la révélation d’un arbre déjà lourd.
7. `App.jsx`, `preloadTabs.js`, `useWorkoutData.js`.
8. Après export : si « Aujourd’hui préchauffé » est loin devant « Aujourd’hui visible », optimiser le démarrage, pas le clic d’onglet.
9. Inconnu tant que les deux marques ne sont pas datées sur une session réelle.
10. Démonter l’onglet pour « aller plus vite » au clic le reconstruirait à chaque visite.
11. Une capture à froid et une capture de réouverture, exportées.

## 9. Causes confirmées, hypothèses, non reproduit

Confirmé par le code :

- la coche ne écrit pas IndexedDB ;
- la recherche d’autofill parcourt toutes les clés `reps` en mémoire ;
- la première édition copie les cartes du brouillon ;
- la charge notifie toutes les cartes, la coche n’en notifie qu’une ;
- le pourcentage ne suit pas la coche ;
- l’XP de confirmation est après l’enregistrement ;
- Aujourd’hui est monté avant d’être montré.

Confirmé par la mesure jsdom : les ordres de grandeur du tableau de la section 7.

Hypothèses ouvertes, à trancher avec un export réel :

- la peinture dépasse 50 ms à cause du rendu des cartes, pas du calcul ;
- le thread est déjà occupé par l’index de charges, le préchauffage ou une tâche longue ;
- le changement de date coûte surtout le score et `useTodayExercises`, pas le réseau ;
- une décoche lente sans historique énorme vient du rendu, puisque la recherche n’a pas lieu.

Non reproduit : second clic obligatoire, réapparition d’une charge après décoche, perte d’une frappe rapide, doublon d’XP. Le code du second clic discordant existe ; il n’a pas été observé.

## 10. Limites de l’instrumentation

La console est `Diag Aujourd’hui`, en bas à droite, uniquement quand `import.meta.env.DEV` est vrai. Elle n’est pas dans le build de production.

Capture arrêtée : les fonctions sortent tout de suite. Ce surcoût n’a pas été comparé dans le navigateur. Capture allumée : un évènement par étape, un buffer de 2 500, un relevé de tâches longues, et un rafraîchissement du panneau deux fois par seconde seulement s’il est ouvert. Le panneau fermé ne se re-rend pas. Aucune répétition, charge ou texte n’est écrit dans le JSON : seulement des durées, des noms d’étapes et des compteurs.

`StrictMode` en développement double certains effets de montage. Un export de développement n’est pas une durée de production.

La mémoire n’apparaît que si le navigateur expose `performance.memory`.

## 11. Plan de correction

Ne pas l’appliquer tant que les exports réels n’ont pas départagé P1 et P2. L’ordre proposé, du plus sûr au plus large :

1. P1, une notification par carte pour la charge. Petit diff, parité fonctionnelle facile.
2. P2, séparer la peinture de la recherche, puis indexer. La parité d’autofill d’abord.
3. P3, score local et médiane mémorisée. Parité du pourcentage avant de s’en servir à l’écran.
4. P4, seulement après les exports d’enregistrement. Ne pas toucher au contrat de succès.
5. P5, décision après les deux captures de chargement. Pas de démontage préventif.

Aucune de ces étapes n’a été codée. Aucun gain de fluidité n’est donc acquis.

## 12. Protocole pour une session réelle

1. Lancer Momentum en développement.
2. Ouvrir n’importe quelle page, cliquer `Diag Aujourd’hui`, puis `Démarrer`. Pour un chargement à froid, ajouter `?todayDiag=1` à l’URL et recharger. `?todayDiag=0` retire la capture.
3. Aller sur Sport → Aujourd’hui. Cocher un exercice, le décocher, modifier des répétitions, modifier une charge, enregistrer. Changer de date et revenir.
4. `Exporter JSON`. Répéter la même série au moins cinq fois si les durées varient.
5. `Geler référence`, recommencer une série, et comparer le nombre d’interactions et les tâches longues.
6. Pour le surcoût : une série capture arrêtée n’est pas exportée. La comparaison avec et sans console demande deux sessions dont une sans avoir cliqué Démarrer, observées au ressenti, puis une session exportée. Le test jsdom ci-dessus ne contient pas la console.

Les champs utiles dans l’export : `Coche d’un exercice`, `Décoche d’un exercice`, `Modification d’une charge`, `Enregistrement de la séance`, les spans `Recherche des données`, `Copie des cartes de séance`, `Écriture locale`, `Rendu carte exercice`, et `longTaskMs`.

## 13. Suite P0 — export réel (signature 2,5 s)

Voir **[P0.3-XP-DISCULPEE-CPU-OBLIGATOIRE.md](./P0.3-XP-DISCULPEE-CPU-OBLIGATOIRE.md)** : **NO-GO** — single-flight OK (1 compute) ; bande 145 s hors XP ; CPU obligatoire via `launch-p0-cpu.ps1`.

## 14. P0.7 — agrégats différés (post 04-38)

Fluidité nominale atteinte (médiane 24 ms / P95 Phase C 32 ms). Problème restant : rafales post-Enregistrer (SidebarPremium ~4,5–5 s). Correctifs : cache agrégats + `useDeferredValue` modules sidebar. Voir **[P0.7-AGGREGATS-DEFERRED-POST-SAVE.md](./P0.7-AGGREGATS-DEFERRED-POST-SAVE.md)**. Révision `p0.7-aggregates-deferred-2026-11-27`. **Pas de clôture** — une campagne unique à froid + post-save.

## 15. P0.8 — calendrier / worker / démarrage (post 04-55)

Caches P0.7 OK ; calendrier ~70 % du coût modules ; lt démarrage 13,3 s + 12,8 s (WW4). Correctifs : index intensités, mois chunké, Worker agrégats, gate visible/idle. Voir **[P0.8-CALENDRIER-WORKER-DEMARRAGE.md](./P0.8-CALENDRIER-WORKER-DEMARRAGE.md)**. Révision `p0.8-calendar-worker-startup-2026-11-27`. Validation via tests Chromium isolés avant nouvel export utilisateur.
