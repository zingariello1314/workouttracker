# Document 2 — Diagnostic instrumenté

18 novembre 2026. Aucun scénario n’a été joué dans le navigateur pour cet audit.
Toutes les durées de l’observation utilisateur restent **non mesurées**.
Ce document sépare ce que le code impose, ce qui reste une hypothèse, et le protocole à exécuter avant de figer l’architecture.

---

## 1. Observations à ne pas prendre pour des mesures

| Observation | Statut |
| --- | --- |
| Il faut parfois deux clics pour qu’une case reste cochée | Observation utilisateur. Mécanismes capables de la produire : **démontrés**. Fréquence : **non mesurée**. |
| Enregistrer met plusieurs secondes | Observation. Travail disproportionné sur certains chemins : **démontré**. Part de chaque étape : **non mesurée**. |
| Pourcentages ~4 à 5 s après la coche, si l’enregistrement a lieu | Cohérent avec le branchement « le memo attend `data` », et `data` attend le disque. La valeur 4–5 s : **non mesurée**. |
| Barre d’XP ~3 à 4 s après les pourcentages | Cohérent avec « calcul après le rendu de `data` », pas avec un timer de 3 s. La valeur : **non mesurée**. |
| GTG, pompes, étirements « pareil » | Même symptôme possible, chemins différents. À mesurer séparément. |

Le premier relevé (`LATENCE-COCHE-ENREGISTREMENT-XP-2026-11-18.md`) reste une carte. Il n’est pas une preuve de causalité chiffrée.

---

## 2. Causes confirmées par le code (sans chronomètre)

Ces faits suffisent à expliquer un écran qui ne suit pas le clic. Ils ne disent pas quelle part des secondes chacun prend.

### C1 — La case, le pourcentage et l’XP n’ont pas la même source

**Démontré.**

- Case : optimiste, puis brouillon, canal `bumpExerciseUi`.
- Pourcentage de séance : `useMemo` sur `data` et `hasUnsavedExercises`. La coche ne change ni l’un ni l’autre.
- XP : `data` seulement, puis deux frames, puis `calculateSportXP` sur tout l’historique, puis grades.

Conséquence logique : même un disque instantané laisserait l’XP derrière le pourcentage, et un pourcentage branché sur `data` resterait faux tant que `setData` n’a pas couru. Le disque ajoute un délai *avant* ce `setData` à cause de `skipReact` + `applyReactAfterPaint`.

### C2 — Aucun enregistrement n’est déclenché par la coche

**Démontré.** `scheduleAutoPersist` n’est pas appelé. Le flush `pagehide` n’envoie pas le brouillon.

Conséquence : les 4–5 s ne peuvent pas être « la coche qui se sauvegarde seule ». Ils incluent l’action Enregistrer, ou un autre `updateData` (GTG, pompes). Le protocole doit horodater ces deux gestes séparément.

### C3 — Le chemin séance attend le disque avant de publier `data`

**Démontré.** `skipReact: true` puis `applyReactAfterPaint` seulement après `saveToDB`. Dedans : put, puis relecture d’existence, timeouts 10 s / ouverture. Import dynamique du gateway à chaque écriture.

### C4 — GTG et pompes n’utilisent pas la tranche du jour

**Démontré.** `updateData` sans `strict` ni `sessionDay` : grand nettoyage de toutes les maps, écriture de la ligne agrégat, file `runSerializedSave`, `setData` *avant* l’await. Timeout disque non strict peut revenir sans erreur.

### C5 — L’XP n’est pas un delta, et le code ne tente pas d’en faire un

**Démontré** dans `calculateSportXP` :

- XP « exercice coché » : nombre de paires (date, exercice) dédupliquées × constante. Un ajout est additif **sauf** chevauchement fractionné, qui soustrait des XP d’exercices.
- Volume soulevé : produit puis **plafond** `SPORT_XP_LIFTED_VOLUME_CAP`. Près du plafond, un kilo de plus ne vaut plus le même XP.
- Bonus de programme : par jour, 0 / 100 / 300 selon le ratio ≥ 80 % ou 100 %. Une coche peut faire sauter un seuil, pas ajouter une constante.
- Étirements : XP selon la note ou la fiche planifiée ce jour-là. Une coche sans note n’a pas le même XP qu’une coche notée.
- Trophées, pas, calories, défis, GTG (jours à 50 % et 100 %) : agrégats historiques ou seuils.

Un « +N XP » local sans rejouer au moins la journée et les seuils **modifierait les règles**. Ce n’est pas acceptable.

### C6 — Deux files d’écriture ne s’excluent pas

**Démontré.** `persistTailRef` pour le brouillon ; `runSerializedSave` pour le reste ; le chemin `strict && sessionDay` n’entre pas dans `runSerializedSave` ; `priority: true` lâche la chaîne précédente.

### C7 — Mécanismes coûteux qui restent justifiés

À ne pas classer comme « du gaspillage » sans substitut :

- tranche par jour plutôt que la ligne entière (le commentaire du gateway dit pourquoi la ligne entière était trop chère) ;
- `replaceDayKeys` pour que la décochage survive au rechargement ;
- garde anti-wipe endurance ;
- `stale` pour ne pas jeter une frappe en cours ;
- throw sur timeout pour le bouton séance ;
- conservation du dernier total XP pour éviter un flash à 0.

---

## 3. Hypothèses encore ouvertes

| Id | Hypothèse | Ce qui la rend plausible | Ce qui manque |
| --- | --- | --- | --- |
| H1 | Le double clic vient surtout d’un second `onChange` parce que la case contrôlée est ramenée à faux avant le frame | Le code annule le frame précédent et inverse l’optimiste si un second événement lit déjà `true` | Trace d’événements sur un vrai clic |
| H2 | Le double clic vient d’une exception dans `applyExerciseCheck` (mémoire du jour, journal de séries) qui efface l’optimiste | Le `catch` de `queueExerciseCheck` efface l’optimiste | Compteur d’exceptions, sans logger les données |
| H3 | Le double clic vient de la sortie anticipée « déjà dans l’état demandé » alors que la prop `checked` est encore fausse | Les deux lectures existent | Corrélation prop `checked` / `getCurrentData()` au moment du return |
| H4 | La majorité des secondes d’Enregistrer est le put + la relecture | Deux allers IndexedDB sont sur le chemin critique | Marques autour du put et du get |
| H5 | La majorité est le rendu React après `setData` (signature XP + `TodayTab`) | La signature parcourt toutes les clés dans le rendu | Profiler React, temps de `xpSignature` |
| H6 | La majorité de l’écart pourcentage → XP est `calculateSportXP` + grades | Ils sont après le commit, sur deux frames | Marques autour de ces deux fonctions |
| H7 | Le repli « store séances absent » est encore pris en production | Le code existe | Compteur du message `WORKOUT_SESSION_STORE_MISSING` |
| H8 | `exerciseMarkedWeighted` / `exerciseDisplayNames` se perdent au rechargement après un enregistrement seulement incrémental | Absents de `SESSION_MAP_FIELDS` | Test de rechargement sur ces champs |

Aucune de H1–H8 ne doit servir à supprimer une vérification.

---

## 4. Protocole d’instrumentation

À ajouter plus tard, derrière un flag de développement, jamais en télémétrie réseau.
Interdit dans les logs : noms d’exercices, reps, poids, identifiants utilisateur, contenu de séance.
Autorisé : durées, tailles (nombre de clés, octets du slice), codes d’étape, hash court non réversible d’une clé technique si nécessaire.

### 4.1 Points de marque

Un seul identifiant de geste (`gestureId` aléatoire), transmis du clic jusqu’au `setPublishedXp`.

| Marque | Endroit |
| --- | --- |
| `click` | `TodayExerciseCheck` onChange |
| `draft` | fin de `patchSessionExerciseDraft` |
| `optimistic-cleared` | `clearOptimisticCheck`, avec raison : `match`, `throw`, `unmount` |
| `pct-commit` | le `useMemo` du score a changé de valeur |
| `save-request` | début de `handleSaveExercises` / `persistGtg` / `onSave` pompes |
| `save-prepare` | après sanitize, avant IndexedDB |
| `idb-put-start` / `idb-put-end` | `persistWorkoutSessionDay` et le put agrégat |
| `idb-verify-start` / `idb-verify-end` | relecture |
| `react-publish` | entrée du `setData` |
| `xp-signature` | durée du memo signature |
| `xp-calc` | durée de `calculateSportXP` |
| `grades` | durée du memo `useSportGrade` |
| `xp-published` | `setPublishedXp` |
| `cloud-result` | `true` / `false` / `skipped`, sans payload |

`performance.mark` / `measure` suffisent. Les agréger en console dev, pas les envoyer.

### 4.2 Ce qu’il faut rapporter

Pour chaque geste, sur un historique synthétique (section 4.3) :

- médiane, P95, P99 dès qu’il y a au moins 30 essais par taille ;
- en dessous de 30 essais : min, max, et le dire ;
- thread principal : long tasks > 50 ms entre `click` et `xp-published` (`PerformanceObserver`, `longtask`) ;
- nombre de commits React entre ces deux marques (profiler) ;
- distinguer **promesse `updateData` résolue**, **relecture revenue**, **frame peinte** (`requestAnimationFrame` après le setState).

Ne pas conclure qu’une étape est « le » goulot tant que sa P95 n’est pas comparée aux autres sur le même essai.

### 4.3 Jeux synthétiques

Trois tailles, générées en local, jamais à partir d’un export personnel :

| Jeu | Contenu |
| --- | --- |
| S | 30 jours, 8 exercices / jour, pas de photos, endurance courte |
| M | 400 jours, maps de reps et coches remplies, 20 défis, GTG sur 60 jours |
| L | 2000 jours, séries détaillées, endurance multi-types, pour approcher un historique long |

Les générateurs doivent produire des clés `YYYY-MM-DD_…` valides et des types déjà acceptés par `sanitize`. Pas de noms réels.

### 4.4 Scénarios minimaux avant de choisir A/B/C/D

1. Coche seule, sans Enregistrer : `click` → `draft` → la case peinte. Le pourcentage ne doit pas bouger aujourd’hui ; le mesurer quand même pour le confirmer.
2. Coche puis Enregistrer : toutes les marques jusqu’à `xp-published`.
3. GTG une mini-série : mêmes marques, chemin agrégat.
4. Pompes : idem.
5. Étirement puis Enregistrer.
6. Coche pendant qu’un Enregistrer est déjà en vol (test C du cahier).
7. Forcer un rejet IndexedDB (store fermé en test) et vérifier qu’aucun toast de succès séance ne part.

### 4.5 Résultats de cette mission

| Mesure | Résultat |
| --- | --- |
| Toutes les marques ci-dessus | **Non exécutées** |
| Profiler React | **Non exécuté** |
| Jeux S/M/L | **Non générés** |
| Test de rechargement | **Non exécuté** |
| Deux onglets | **Non exécuté** |

Le choix d’architecture du document 4 s’appuie sur la structure du code et sur les invariants, pas sur un P95. La phase 0 du plan d’implémentation est justement d’obtenir ces chiffres avant d’élargir le périmètre.

---

## 5. Contribution attendue, à confirmer par les mesures

Ordre **structurel** (qui attend qui), pas un budget en millisecondes :

1. Clic → brouillon : synchrone + un frame. Devrait rester court. Si H1 ou H2 se confirme, la case échoue ici, avant tout disque.
2. Brouillon → pourcentage : aujourd’hui cet arc n’existe pas. Le pourcentage attend l’étape 4.
3. Demande de sauvegarde → fin de relecture : frames volontaires + file + put + get. Candidat principal au temps « Enregistrer », **non mesuré**.
4. Relecture → pourcentage peint : `startTransition` + rendu `TodayTab` + signature XP dans le même rendu. Candidat au temps « après le disque, avant le % ».
5. Pourcentage peint → XP peinte : deux frames + `calculateSportXP` + grades. Candidat à l’écart de 3–4 s, **non mesuré**.
6. Cloud : après l’idle 800 ms, hors toast séance. Ne doit pas être compté dans la confirmation locale, mais son coût CPU peut encore gêner la barre si le push prépare une grosse ligne sur le thread principal. **Non mesuré**.

---

## 6. Instrumentation déjà présente

`startTodayCheckMeasure` ne logue qu’en build DEV, du handler jusqu’au patch, pas jusqu’au disque ni à l’XP. Utile pour H2 sur la coche, insuffisant pour le reste. Ne pas le prendre pour le protocole ci-dessus.
