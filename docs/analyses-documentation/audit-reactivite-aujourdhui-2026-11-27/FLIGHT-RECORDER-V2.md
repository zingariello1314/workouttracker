# Flight Recorder V2 — fiabilité des mesures

27 novembre 2026. Ceci corrige la lecture de la console, sans changer les règles de coche, d’autofill, d’XP ni de persistance.

## Ce que montrait la session réelle

Trois coches : 21,3 ms, 2 692 ms, 4 862,6 ms. Pour la plus longue, les étapes instrumentées faisaient environ 3,6 ms au total. 85 tâches longues et 77 666 ms cumulées. 126 rendus de cartes, 48 rendus d’Aujourd’hui. Mémoire JavaScript affichée autour de 1 006 Mo.

## Défaut de mesure confirmé dans la V1

Le total affiché était le dernier repère moins le début du gestionnaire. Le dernier repère s’appelait « Peinture » et était posé dans un double `requestAnimationFrame` **après** la fin du gestionnaire.

Si le fil principal reste occupé, ce rappel n’est exécuté qu’à la fin de l’occupation. Les 4 862 ms mesuraient donc surtout l’attente de ce rappel, pas la recherche (1,1 ms) ni le rendu de carte (1 ms). Un `requestAnimationFrame` ne prouve pas qu’un pixel a été présenté.

Les tâches longues étaient datées à l’instant où l’observateur réagissait, pas à `entry.startTime`. Elles ne tombaient donc pas dans la fenêtre de la coche. `buffered: true` rejouait aussi les tâches d’avant la capture, et leur durée était additionnée. Cette somme n’est pas un temps écoulé.

`performance.memory.usedJSHeapSize` est le tas JavaScript de Chrome. 1 006 Mo n’est pas la taille des séances, et une hausse de 976 à 1 006 Mo ne démontre pas une fuite.

## Ce que la V2 sépare

Pour chaque interaction :

- `inputDelayMs` : timestamp de l’événement jusqu’au début du gestionnaire. Direct. `null` si le timestamp manque.
- `processingMs` : début à fin du gestionnaire. Direct.
- `untilNextFrameCallbackMs` : fin du gestionnaire jusqu’au rappel de frame. Approximation. Ce n’est pas la présentation.
- `presentation` : laissée indisponible, sauf si Event Timing fournit plus tard une durée jusqu’à la peinture. Jamais remplacée par 0.
- `unexplained` : trous d’au moins 16 ms après fusion des spans, rendus et tâches longues qui se chevauchent. Deux mesures imbriquées ne sont pas additionnées.
- `legacyTotalMs` : l’ancien total, conservé pour comparer un export V1.

Une page cachée est notée. Elle peut gonfler l’attente de frame. StrictMode double des effets de montage en développement, pas le gestionnaire de clic.

## Ce que la page ne peut pas voir

Depuis le JavaScript de la page : pas de stack CPU échantillonnée, pas de pause de garbage collector identifiée, pas de coût de layout, de peinture ou de compositing. Long Animation Frames donne parfois un nom de script, avec une confiance limitée. Le collecteur CDP n’est pas branché : le diagnostic standard n’en dépend pas. Un collecteur local n’ouvrirait pas de port distant et n’est pas livré ici, parce que les API de la page suffisent à séparer le traitement de l’attente, et qu’un trace Chromium demanderait Chrome lancé avec un port de débogage local.

## Comment lancer une campagne

1. Ouvrir Momentum en développement.
2. Cliquer `Diag Aujourd’hui`, puis `Lancer la campagne`. Pour inclure le démarrage, charger la page avec `?todayDiag=1`.
3. Utiliser Aujourd’hui, y compris les coches lentes. `Marquer un ralentissement` pose un repère si aucun geste n’est reconnu.
4. `Exporter le dossier complet`. Le fichier se nomme `momentum-today-performance-flight-recorder-v2-AAAA-MM-JJ-HH-MM-SS.json`.

`?todayDiag=0` arrête la reprise. Un rechargement avec la capture armée garde le même identifiant de campagne et un nouveau segment, dans la base locale `MomentumDevFlightRecorder`, distincte des séances. Les événements de démarrage et les interactions ne sont pas les premiers effacés si le buffer de 15 000 est dépassé. Le compteur `droppedEvents` le dit.

Les interrupteurs de flou, d’animation et d’ombre sont réversibles et ne sont pas écrits dans les préférences.

## Vérification

`scripts/today/flight-recorder-v2.test.js` : 4 tests verts. Ils reconstruisent une coche dont l’ancien total dépasse 4 800 ms alors que le traitement dure 4 ms, et ils vérifient qu’une mesure absente reste `null`.

`npx playwright test --config=playwright.flight.config.js` : 1 test vert dans Chromium, profil vide, port 3012. Une attente volontaire de 140 ms après le gestionnaire apparaît dans `untilNextFrameCallbackMs`, le traitement reste sous 50 ms, deux interactions coexistent, le buffer plein conserve le démarrage, et l’export contient les sections prévues.

## Fichiers

- `src/dev/todayDiagnostics/flightAnalysis.js`
- `src/dev/todayDiagnostics/todayDiag.js`
- `src/dev/todayDiagnostics/TodayDiagConsole.jsx`
- `src/components/tabs/TodayTab.jsx` — horodatage du clic, dimensions comptées, interaction de répétition
- `src/App.jsx` — Profiler React en développement
- `scripts/today/flight-recorder-v2.test.js`
- `tests/e2e/today-flight-recorder.spec.js`
- `playwright.flight.config.js`
- `diagnostics/flight-recorder-v2-example.json` — exemple synthétique, pas une session réelle
