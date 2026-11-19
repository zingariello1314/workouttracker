# D+ — revue contradictoire (risques A à F)

18 novembre 2026. La D+ publiée dans DPLUS-02 et DPLUS-04 reste la base de travail, avec deux corrections obligatoires : le brouillon partagé `workoutSession_backup_${scope}_${date}` est rejeté, et une confirmation de génération N ne doit pas effacer N+1.

Aucun chemin de sauvegarde de production n’a été modifié pour écrire ce document. La politique de fusion exécutée ici vit dans `scripts/dplus/threeWayMerge.mjs`. Elle n’est importée par aucun écran.

Statuts : **Démontré** (code actuel ou script exécuté), **Hypothèse** (scénario réel non rejoué dans un navigateur).

---

## A — Concurrence entre brouillons

### 1. Comportement actuel

Le brouillon de séance vit en mémoire (`tempDataRef` dans `useWorkoutExercises`). `localStorage` n’a pas de clé `workoutSession_backup_${scope}_${date}`. Les fonctions `backupSessionDayToLocalStorage` et `flushPendingWorkoutBackup` de `src/utils/workoutPersistence.js` n’ont aucun appelant. Au `pagehide`, `useWorkoutData` écrit `dataRef`, c’est-à-dire la séance déjà dans React, pas les coches encore seulement dans le brouillon. Deux onglets qui valident écrivent chacun la journée entière depuis leur mémoire : la dernière écriture remplace l’autre.

### 2. Comportement prévu par la D+ publiée

DPLUS-02 et DPLUS-04 proposent une clé unique par profil et par date, relue, fusionnée, puis réécrite. Cette clé serait déclarée durable.

### 3. Scénario de défaillance

Deux onglets lisent `{ tractions: false }`. L’onglet A écrit `{ tractions: true }`. L’onglet B écrit `{ tractions: false, dips: true }`. `localStorage` n’a pas de read-modify-write atomique entre onglets.

### 4. Données perdues

La coche de tractions, alors que le système l’aurait déjà annoncée comme brouillon durable. Ce n’est pas une perte canonique aujourd’hui, parce que cette clé n’existe pas. Ce serait une perte dès que la D+ publiée serait codée telle quelle.

### 5. Correction minimale

Rejet de la clé partagée. Chaque instance écrit un enregistrement distinct :

- cible, après autorisation de schéma : store IndexedDB `workoutDrafts`, clé `${scope}:${instanceId}:${date}`, jamais lu par `getAllWorkoutSessionsForScope` ;
- pont réversible, sans changer le schéma canonique : `localStorage` `workoutDraft_${scope}_${date}_${instanceId}`.

Identifiant d’instance : `crypto.randomUUID()` en mémoire, recopié dans `sessionStorage`. Chrome duplique `sessionStorage` quand on duplique un onglet. Au démarrage, un `BroadcastChannel` annonce l’identifiant ; si un pair répond le même, l’onglet en mint un nouveau et laisse l’ancien enregistrement pour récupération. Si `BroadcastChannel` manque, l’identifiant mémoire reste unique pour les onglets ouverts normalement ; un onglet dupliqué peut partager l’identifiant jusqu’au prochain chargement complet. Dans ce cas dégradé, le second onglet n’écrit pas : il affiche que le brouillon est déjà tenu par une autre vue.

Expiration : un brouillon de plus de 14 jours, ou dont la date de séance est révolue depuis 48 h et qui n’est pas ouvert, est supprimé au chargement du profil. La suppression ne touche pas `workoutSessions`.

### 6. Garantie

Deux instances n’écrivent pas la même clé. Le script isolé le montre : la clé partagée perd `tractions: true` (`tractionsLost: true`) ; deux enregistrements séparés gardent tractions et dips. Test vitest `threeWayMerge` pour la fusion ultérieure, et le cas « lost update » de `node scripts/dplus/phase0-isolated.mjs`.

### 7. Limites

Le pont `localStorage` peut échouer (quota, navigation privée, stockage désactivé). L’échec est visible ; rien n’est annoncé durable. IndexedDB sérialise les transactions d’un même store, y compris entre onglets, seulement une fois le store `workoutDrafts` autorisé. Le pont n’offre pas cette transaction. Un crash entre deux `setItem` d’instances différentes ne mélange pas leurs clés. La coupure électrique n’est pas couverte.

### 8. Test

**T1.** Type : simulation déterministe dans Node (`phase0-isolated.mjs`), plus un test navigateur à écrire avant branchement (deux contextes Playwright, deux clés, recharge). Ce n’est pas une preuve de coupure électrique.

Fichiers : `scripts/dplus/phase0-isolated.mjs`, `src/hooks/useWorkoutData.js`, `src/utils/workoutPersistence.js`, DPLUS-02, DPLUS-04.

---

## B — Fusion canonique à trois versions

### 1. Comportement actuel

`mergeSessionDaysIntoAggregate` remplace toute la journée dès qu’une ligne porte `dateStr` ou des clés préfixées par la date. La ligne écrite est celle que l’onglet a en mémoire, pas une fusion avec la ligne lue dans la même transaction. **Démontré** par lecture du module `src/utils/workoutSessionPersistence.js`.

### 2. Comportement D+ publié

Patch de clés dans une transaction IndexedDB. La règle exacte base / local / distant, le tombeau de suppression, le groupe métier et la ligne absente n’étaient pas formalisés.

### 3. Scénario

Base tractions 10 et dips 10. Onglet A veut 12 tractions. Onglet B a déjà validé 15 dips. Sans fusion dans la transaction, le `put` de A réécrit dips à 10.

### 4. Données perdues

La modification distante déjà canonique, ou, si l’on « laisse gagner le distant » sans regarder les clés, la modification locale.

### 5. Correction minimale

Politique exécutée par `mergePatch` :

| Cas | Résultat mesuré par le script |
| --- | --- |
| Clés indépendantes (A : tractions 12, B déjà à dips 15) | `{ tractions: 12, dips: 15 }`, statut `ok` |
| Même clé, 12 contre 15 | statut `conflict` ; le candidat canonique reste 15 ; le 12 reste dans le conflit et le brouillon n’est pas effacé |
| Les deux passent de 10 à 12 | statut `ok`, une seule valeur 12 |
| Suppression `{ deleted: true }` contre 15 | conflit ; le 15 canonique reste |
| Deux suppressions (local tombeau, distant déjà sans la clé) | convergence, clé absente |
| Objet `serie` : local change les reps, distant le poids | conflit sur la clé entière, pas de fusion champ par champ |
| Groupe `date_exercice` : une clé du groupe en conflit | aucune clé du groupe n’est écrite ; le brouillon du groupe reste |

La base est celle mémorisée au début de l’édition, stockée dans le brouillon (`baseRevision` + snapshot des clés touchées). Une absence dans le patch signifie « non touché ». Une suppression est `{ deleted: true }`. Une clé présente dans la base et absente de la ligne canonique lue dans la transaction est une suppression distante.

Ligne canonique absente : base vide, distant vide, le patch local est appliqué, révision 1. Si la ligne apparaît entre-temps, la même fonction à trois versions s’applique.

Granularité : une clé de stockage. Deux champs d’un journal de série ne sont pas indépendants. Une coche qui écrit plusieurs clés (`checked`, `reps`, charge) forme un groupe : un conflit sur un membre rejette le groupe entier.

La transaction lit la ligne, appelle `mergePatch`, écrit, relit. Aucun `await` réseau, `setTimeout` ou `window.confirm` à l’intérieur. Les `await` de requêtes IndexedDB de cette transaction restent permis.

### 6. Garantie

Sur les cinq cas du script et les sept tests vitest : pas de résolution silencieuse d’un conflit, pas de faux `ok`, le canonique déjà écrit n’est pas remplacé par l’autre valeur en cas de conflit.

### 7. Limites

La politique n’est pas branchée sur `persistWorkoutSessionDay`. Les tests sont en mémoire, pas deux processus IndexedDB. Un groupe trop large (toute la journée) reviendrait à bloquer des fusions indépendantes : le groupe doit rester l’exercice, pas la séance.

### 8. Test

**T2, T3, T4, T14.** Type : vitest, fonctions pures (`scripts/dplus/threeWayMerge.test.js`), 11 tests verts le 18 novembre 2026. **T15** de non-régression sur une ligne sans champ `revision` : à ajouter au moment du branchement, en traitant `revision` manquant comme 0. IndexedDB fake seulement quand le gateway sera testé ; ce ne sera toujours pas deux onglets OS.

Fichiers : `scripts/dplus/threeWayMerge.mjs`, `src/utils/workoutSessionPersistence.js`, `src/services/workout/workoutDbGateway.js`.

---

## C — Modification pendant une sauvegarde

### 1. Comportement actuel

`handleSaveExercises` pose un verrou (`savingLockRef`) qui ignore un second clic. Le brouillon peut encore changer en mémoire pendant l’attente IndexedDB. À la fin, le succès repart de l’état canonique relu. Une coche posée après le snapshot et avant la fin n’a pas de génération propre. `persistTailRef` peut réessayer un `draftRevision` périmé.

### 2. Comportement D+ publié

Le succès efface le brouillon durable de la date. Il n’y a pas de génération comparée au snapshot envoyé.

### 3. Scénario

Coche tractions, Enregistrer, transaction lancée, coche dips, transaction des tractions confirmée, effacement du brouillon, dips disparus.

### 4. Données perdues

Les dips, y compris s’ils avaient déjà été écrits dans le brouillon durable après le début de la transaction.

### 5. Correction minimale

Chaque modification utilisateur incrémente `generation`. La sauvegarde fige `{ generation: G, patch, base }`. Au succès :

- si la génération courante est encore G, supprimer le brouillon de cette instance ;
- si elle est G+1 ou plus, ne pas le supprimer ;
- retirer du brouillon restant uniquement les clés dont la valeur courante est égale à la ligne canonique confirmée ;
- la nouvelle base du brouillon restant est cette ligne confirmée.

`retainNewerDrafts` exécuté sur `{4, 5}` confirmé à 4 ne garde que 5. Un second clic pendant l’écriture ne démarre pas une seconde transaction : il marque « à relancer » et enchaîne après confirmation, avec le patch le plus récent. Le bouton peut afficher un chargement. Les coches restent actives.

Changement de date pendant l’écriture : le résultat n’est écrit que sur la date figée dans le snapshot. Le brouillon de l’autre date n’est ni effacé ni promu. Démontage React : l’écriture en cours continue ; le succès ne fait pas `setState` sur un composant démonté ; le brouillon durable de génération supérieure reste.

### 6. Garantie

Une confirmation N ne supprime pas l’enregistrement N+1. Démontré sur la fonction pure, pas encore sur l’écran.

### 7. Limites

Si le processus meurt après le commit canonique et avant la réécriture du brouillon N+1, le rechargement voit le canonique N et le brouillon N+1. La réconciliation du chargement doit refaire la même fusion, sans valider le brouillon. Ce rechargement n’a pas été exécuté dans un navigateur.

### 8. Test

**T5, T6, T12.** T5 est vert en vitest sur `retainNewerDrafts`. T6 (deux sauvegardes qui s’enchaînent) et T12 (annuler le brouillon n’écrit pas une journée vide dans le canonique) restent à brancher sur un gateway de test. Type prévu : fake-indexeddb. **T18** (fermeture pendant l’écriture) : test navigateur, et il ne prouve pas la coupure électrique.

Fichiers : `src/components/tabs/TodayTab.jsx` (`handleSaveExercises`), `src/context/WorkoutContext/hooks/useWorkoutExercises.js`.

---

## D — GTG, pompes, écritures concurrentes

### 1. Comportement actuel

`newAdHocId` dans `src/services/endurance/gtgService.js` (lignes 849-852) construit `ah_${date}_${heure}_${Math.random()}`. Chaque appel à `addGtgAdHocPassage` peut donc mint un nouvel id. Le panneau pompes pose `id: Date.now()` (`PushupChallengeTodayPanel.jsx`, ligne 410). `mergeEnduranceWithoutSilentWipe` empêche une liste vide d’effacer un type, puis remplace toute la liste non vide de ce type. `updateData` non strict peut revenir sans throw après un timeout, une fois `setData` déjà fait. **Démontré** par lecture.

### 2. Comportement D+ publié

DPLUS-04 laisse l’écrasement de deux ajouts d’endurance comme limite connue.

### 3. Scénario

Deux onglets ajoutent chacun une mini-séance, ou le même ajout est rejoué après un timeout dont le commit a en fait réussi. La seconde liste complète remplace la première. Un nouvel id aléatoire crée un doublon.

### 4. Données perdues

Une séance GTG ou un passage pompes. Ou un doublon qui comptera deux fois dans l’XP et les défis.

### 5. Correction minimale

Conserver `mergeEnduranceWithoutSilentWipe` comme dernier garde-fou de type. Devant lui, fusionner les listes par id stable avec `mergeEntriesById` :

- ids disjoints : union (script : `ah_1` et `ah_2` → deux entrées) ;
- même id et même corps : une entrée (rejeu sans doublon) ;
- même id et corps différent : conflit, la liste canonique n’est pas remplacée, pas de toast de succès ;
- id manquant : conflit, pas d’append anonyme.

Le réessai réutilise l’objet déjà en mémoire, il ne rappelle pas `newAdHocId` ni `Date.now()`. Les entrées anciennes sans id : au premier chargement de maintenance, leur assigner un id dérivé et stable (`legacy_${type}_${date}_${index}`), écrit une seule fois, jamais régénéré si l’entrée existe déjà. Cette écriture d’id est une migration : elle attend une autorisation. Tant qu’elle n’est pas faite, deux ajouts concurrents sur une liste sans id restent interdits : le second onglet refuse l’ajout avec un message, plutôt que d’écraser.

Opérations répétées après timeout : voir le risque E. On relit avant de rejouer. On ne mint pas un nouvel id tant que le résultat est indéterminé.

### 6. Garantie

Sur des listes qui ont déjà des ids, la fonction pure ne perd pas l’entrée distante et ne duplique pas un rejeu. Ce n’est pas encore le chemin `updateData`.

### 7. Limites

Les données réelles actuelles n’ont pas toutes un id stable. Sans la migration autorisée, la protection concurrente des anciennes listes est un refus explicite, pas une fusion. `mergeEnduranceWithoutSilentWipe` ne sait toujours pas fusionner deux listes non vides : il doit recevoir la liste déjà fusionnée par id, sinon il continue de remplacer le type.

### 8. Test

**T9, T10.** Aujourd’hui : vitest sur `mergeEntriesById` (union, rejeu, conflit). Avant branchement : fake-indexeddb qui appelle le garde-fou existant `enduranceWipeGuard` après la fusion, pour vérifier qu’une liste locale vide ne efface pas le type. Deux onglets réels : Playwright, plus tard. **T7** et **T8** couvrent le timeout.

Fichiers : `src/services/endurance/gtgService.js`, `src/components/tabs/TodayTab/components/PushupChallengeTodayPanel.jsx`, `src/services/endurance/enduranceWipeGuard.js`, `src/hooks/useWorkoutData.js`.

---

## E — Durabilité et confirmation

### 1. Comportement actuel

`persistWorkoutSessionDay` attend le `put` (timeout 10 s) puis relit l’existence de la ligne (`WORKOUT_SESSION_VERIFY_FAILED` si absente). Il ne compare pas les champs. Le timeout de séance est 25 s (`sessionSaveTimeout.js`). En chemin non strict, un timeout IndexedDB peut revenir sans erreur après mise à jour mémoire. La copie `localStorage` d’endurance (`writeEnduranceLocalBackup`) est appelée sur la sauvegarde complète, pas sur le chemin incrémental de journée. Les sauvegardes de séance dans `workoutPersistence.js` ne sont pas branchées.

### 2. Comportement D+ publié

Confirmer après relecture d’existence. Une copie indépendante restaureable reste hors du premier lot.

### 3. Scénario

Le `put` est commis, la relecture dépasse le délai, l’interface annonce un échec et rejoue en mintant une nouvelle séance. Ou l’inverse : le délai est affiché comme un succès parce que la mémoire a été mise à jour.

### 4. Données perdues

Doublon, ou confiance fausse dans une séance absente du disque. Un commit IndexedDB réussi ne protège pas d’une panne disque ensuite.

### 5. Correction minimale

Trois issues, jamais deux :

| Issue | Preuve | UI |
| --- | --- | --- |
| Succès confirmé | transaction terminée sans abort, relecture de la ligne, `revision` égale, chaque clé du patch égale à la valeur écrite, le nombre de clés du jour n’a pas baissé sans tombeau dans le patch | toast de séance enregistrée |
| Échec confirmé | abort, exception `QuotaExceeded`, contrainte, relecture qui contredit le patch | erreur visible, brouillon conservé |
| Indéterminé | timeout, crash, relecture impossible | pas de toast de succès, pas de nouvel id, brouillon conservé ; avant rejeu, relire ; si le patch est déjà là, traiter comme succès ; s’il est absent, rejouer le même patch ; si la lecture échoue, rester indéterminé |

Niveaux et preuves :

1. Visible à l’écran : état React. Preuve : le composant a rendu la valeur.
2. Mémoire : `tempDataRef`. Preuve : la ref contient la clé.
3. Brouillon en attente : file de `setItem` ou `put` non revenu.
4. Brouillon persisté : `setItem` revenu sans exception, ou `put` de `workoutDrafts` revenu, puis relecture de la même clé. `localStorage` peut encore être vidé par l’utilisateur.
5. Validation en cours : transaction ouverte, génération G figée.
6. Validation confirmée : succès confirmé ci-dessus.
7. Réplication externe : réponse cloud réussie. Un échec cloud ne défait pas le niveau 6.
8. Copie indépendante restaureable : absente aujourd’hui pour la séance. Réservée au chantier B.

Comparer les types après sanitation (`"10"` et `10` ne sont pas la même preuve tant que le canonique n’a pas la même forme que celle qu’on a décidé d’écrire).

### 6. Garantie

Le contrat interdit d’appeler « enregistré » un timeout. Il n’est pas encore appliqué dans `updateData`.

### 7. Limites

Même un succès confirmé ne survit pas à la suppression des données du site ni à la perte du profil navigateur. Aucun test de cette mission ne simule une coupure électrique ; un mock de timeout ne la démontre pas.

### 8. Test

**T7** : fake-indexeddb, le `put` résout, la promesse d’attente est rejetée par le minuteur, la relecture trouve le patch, aucun second id. **T8** : transaction abortée, brouillon toujours présent, toast d’erreur. **T17** et **T18** : chantier B et test navigateur. Type de T7/T8 prévu : fake-indexeddb, à écrire au branchement. Non écrits dans cette mission.

Fichiers : `src/services/workout/workoutDbGateway.js`, `src/utils/sessionSaveTimeout.js`, `src/hooks/useWorkoutData.js`, `src/services/endurance/enduranceWipeGuard.js`.

---

## F — Cohérence des effets métier

### 1. Comportement actuel

Ordre dans `TodayTab` : `maybeApplyRestDaySwapBeforeSave` (dialogue, puis écriture du swap, avec son propre toast) ; ensuite `saveExerciseChanges` ; ensuite toast de séance ; ensuite, au ralenti, `syncSportLinkedQuestsWithProgramSnapshot`, invalidation XP, `WORKOUT_UPDATED`, push cloud. Le second clic est ignoré par `savingLockRef`. La synchro de quête ne rebascule un état déjà conforme. Le swap n’est pas annulé si la séance échoue ensuite.

### 2. Comportement D+ publié

Le brouillon automatique ne doit pas lancer ces effets. La D+ le dit. Elle ne décrit pas l’état intermédiaire « swap commis, séance non commise ».

### 3. Scénarios

- Swap commis, séance échouée : le jour de repos a changé, la séance non. Démontré par l’ordre des appels.
- Séance commise, processus tué avant les quêtes : séance vraie, quête non mise à jour. Au prochain Enregistrer, la synchro idempotente rattrape si l’état diffère.
- Double clic : aujourd’hui le second est ignoré. Avec les générations, il devient une sauvegarde en attente, pas un second swap.
- Timeout : issue indéterminée, pas de second swap, pas de second toast de succès.
- Cloud en échec : séance locale confirmée reste confirmée.
- Nouvelle coche pendant la synchro de quêtes : elle appartient à N+1, elle ne relance pas le swap ni la quête.

### 4. Données perdues

Pas la séance, si le brouillon N+1 est conservé. Le risque est un jour de repos déjà échangé sans séance, ou une quête créditée deux fois si la synchro n’est pas idempotente. La lecture du garde « déjà complétée et compte > 0 » indique l’idempotence sur ce chemin ; elle n’a pas été rejouée par un test de crash dans cette mission.

### 5. Correction minimale

Ne pas déplacer ces effets. Ne pas les rendre atomiques avec IndexedDB par un nouveau moteur. Les documenter comme états intermédiaires :

1. Avant toute écriture de séance, le swap est une écriture séparée, déjà le cas. En cas d’échec de séance ensuite, afficher l’échec de séance. Ne pas inventer un rollback du swap : ce serait une règle métier nouvelle.
2. Quêtes, XP officielle, cloud, `WORKOUT_UPDATED` et toast de séance uniquement après succès confirmé de la séance, et une seule fois par génération confirmée. Un drapeau `effectsEmittedForRevision` évite le double toast et le double push si l’utilisateur réessaie alors que la relecture prouve que la révision est déjà là.
3. Le brouillon automatique n’appelle aucune de ces fonctions.

### 6. Garantie

Le brouillon ne valide pas. Les effets de validation restent derrière le succès confirmé. Le double crédit de quête est évité si le drapeau et l’idempotence existante sont respectés. Le swap reste non atomique avec la séance : c’est assumé et visible.

### 7. Limites

Un crash entre séance et quête laisse une séance valide sans quête jusqu’au prochain Enregistrer du même jour. Ce n’est pas une double récompense. Ce n’est pas non plus une quête instantanée. **T11** doit le vérifier par un test qui commit la séance et n’appelle pas la quête, puis rappelle la synchro une fois et une seule.

### 8. Test

**T11, T13.** T13 : rechargement avec brouillon, aucun appel à la synchro de quête ni au swap. Type : fake-indexeddb pour le commit, mock des effets. Test navigateur pour le rechargement réel. Non écrits ici, spécifiés pour le branchement.

Fichiers : `src/components/tabs/TodayTab.jsx`, `src/utils/sidebarEvents.js`.

---

## Ce qui est rejeté

Event sourcing, CRDT, serveur supplémentaire, base supplémentaire, nouveau framework, journal permanent, hash global à chaque coche, worker par défaut, verrou de toute l’application. Le store `workoutDrafts` est le seul ajout de stockage, et il attend une autorisation parce qu’il change le schéma. Le pont par instance dans `localStorage` est la version réversible en attendant.
