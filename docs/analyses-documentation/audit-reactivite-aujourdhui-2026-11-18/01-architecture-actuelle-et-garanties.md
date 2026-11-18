# Document 1 — Architecture actuelle et garanties

Lecture du code au 18 novembre 2026. Aucune modification de production.
Les durées utilisateur (4–5 s, 3–4 s, double clic) sont des observations, pas des mesures.

Légende : **Démontré**, **Supposé**, **Non assuré**, **Non mesuré**.

---

## 1. Sources de vérité aujourd’hui

Plusieurs objets portent « l’état de la séance ». Ils ne sont pas équivalents.

| Source | Où | Ce qu’elle représente | Qui la lit pour l’écran |
| --- | --- | --- | --- |
| Brouillon | `tempDataRef` + `dirtyFlagsRef` dans `useWorkoutExercises` | Modifications pas encore confiées à `updateData` | `getCurrentData` / `getWorkoutDataForSession`, si le flag sale est vrai |
| Coche optimiste | `Map` module dans `TodayTab.jsx` | Intention de clic, un frame avant le brouillon | `TodayExerciseCheck` seulement |
| État React `data` | `useWorkoutData` | Dernier snapshot publié dans le contexte | Pourcentages de séance (dépendances du memo), barre d’XP, GTG, pompes |
| Store `workoutSessions` | IndexedDB, une ligne par jour | Tranche du jour confirmée par put + relecture | Rechargement, via `mergeSessionDaysIntoAggregate` |
| Ligne `workouts` | IndexedDB, agrégat | Photos, endurance, métadonnées, et encore les maps de séance si le chemin complet écrit | Rechargement, puis écrasé jour par jour par le store séances |
| Cloud | `flushWorkoutAggregateCloudPushNow` | Copie serveur best-effort | Pas le toast « enregistré » de la séance |
| Cache XP | module + `sessionStorage` | Dernier total calculé | `SportXPBar` via `useSportGrade` |

`getWorkoutDataForSession` ne renvoie le brouillon que si `dirty.exercises` ou `dirty.stretches` est vrai. Un brouillon sans flag sale est ignoré. **Démontré** (`useWorkoutExercises.js`).

La barre d’XP lit `data`, jamais le brouillon. Commentaire explicite dans `useSportXP.js`. **Démontré**.

---

## 2. Chemin d’une coche d’exercice

1. `TodayExerciseCheck` pose une coche optimiste et appelle `onToggle`.
2. `queueExerciseCheck` reporte `applyExerciseCheck` au frame suivant et annule le frame déjà armé pour le même id.
3. `applyExerciseCheck` relit `getCurrentData()`. Si l’état lu égale déjà la demande, il sort sans écrire. Sinon `patchSessionExerciseDraft`.
4. Le patch marque le ref sale, `setSessionCommitDirty`, et `bumpExerciseUi(exerciseId)` seulement. Pas de `bumpSessionDraft`. Pas de `setHasUnsavedExercises(true)`.
5. La carte `IsolatedTodayExerciseCard` se redessine. Le memo du score de séance ne dépend pas de cette version. Il dépend de `data` et `hasUnsavedExercises`.
6. Rien n’écrit IndexedDB tant que l’utilisateur n’appelle pas Enregistrer. `scheduleAutoPersist` (2 s) n’a aucun appelant. **Démontré**.

Enregistrer (`handleSaveExercises`) :

1. Verrou `savingLockRef`.
2. `yieldToNextPaint` (deux frames).
3. Échange de jour de repos éventuel, lui-même un `updateData`.
4. `saveSessionDraft` / `persistFullDraft` avec `force: true`, timeout bouton 25 s.
5. File `persistTailRef` : on attend l’écriture précédente.
6. Encore deux frames, normalisation, `sanitizeDraftForPersist`.
7. `updateData({ strict, sessionDay, skipReact: true, skipCloud: true, applyReactAfterPaint: force })`.
8. Écriture du jour, relecture de contrôle.
9. Si la révision du brouillon a bougé pendant l’écriture : retour `stale`, le brouillon n’est pas jeté, jusqu’à 4 tentatives avec un snapshot plus récent.
10. Succès : brouillon jeté, puis idle (deux frames + `requestIdleCallback` timeout 800 ms) pour invalider le cache XP, émettre l’événement sidebar et pousser le cloud.
11. `applyReactAfterPaint` : encore deux frames, puis `startTransition(setData)`.

Le toast de succès de `TodayTab` part quand `saveExerciseChanges()` se résout, donc après l’écriture locale stricte, pas après le cloud. **Démontré**.

---

## 3. Mécanismes : fonction, justification, garantie, coût, nécessité

Le coût chiffré est **non mesuré**. La colonne coût décrit le travail visible dans le code (appels, parcours, allers-retours), pas une durée.

### 3.1 `persistTailRef`

- **Fonction.** Chaîne les `persistFullDraft` : chaque appel attend la promesse précédente, même si elle a échoué (`.catch(() => {})`).
- **Justification.** Empêcher deux normalisations / deux `updateData` de séance de s’entrelacer dans le hook de brouillon. **Supposé** comme intention ; le code fait la mise en file. **Démontré**.
- **Garantie apportée.** Ordre des snapshots de séance pris par ce hook. **Démontré** pour ce hook seulement.
- **Ce qu’il ne couvre pas.** Les `updateData` GTG et pompes n’entrent pas dans `persistTailRef`. Ils passent par `runSerializedSave` ou, s’ils sont `strict` + jour, par `saveToDB` direct. Une séance `strict` + jour **ne passe pas** par `runSerializedSave`. Les deux files ne s’excluent pas mutuellement. **Démontré**.
- **Nécessité.** Utile tant que deux enregistrements de brouillon peuvent partir. Insuffisant comme verrou global entre domaines.

### 3.2 `runSerializedSave`

- **Fonction.** Une promesse unique `saveChainRef`. Option `priority` remet la chaîne à `Promise.resolve()` et annule le timer de debounce.
- **Justification.** Commentaire proche : ne pas laisser un autosave monolithique bloquer la file. L’autosave sur chaque `setData` est désactivé (commentaire vers 1431). **Démontré** comme état actuel du code.
- **Garantie.** Les `saveToDB` qui passent par cette fonction s’exécutent l’un après l’autre. **Démontré**.
- **Trou.** `priority: true` abandonne l’attente de la chaîne précédente (`saveChainRef = Promise.resolve()`). L’écriture précédente peut encore tourner. Deux `saveToDB` peuvent donc se chevaucher. **Démontré**.
- **Trou.** Le chemin séance `strict && sessionDay` n’utilise pas cette file. **Démontré**.
- **Nécessité.** La sérialisation reste nécessaire. Le contournement `priority` et le double canal (séance / reste) affaiblissent la garantie d’exclusion.

### 3.3 `strict`

- **Fonction.** Coupe le timer d’autosave, pose `suppressAutoSaveUntilRef` (3 s, ou 20 s si `importFast`), choisit l’écriture incrémentale si un `sessionDay` est présent, et **relance** l’erreur. `failOnTimeout` suit `strict`.
- **Justification.** Un enregistrement explicite ne doit pas être avalé par le debounce, ni déclaré réussi sur un timeout IndexedDB.
- **Garantie.** Pour le bouton Enregistrer de la séance : une erreur ou un timeout remonte, le brouillon n’est pas effacé (le `force` ne nettoie qu’après succès, et le `catch` re-signale les flags). **Démontré**.
- **Non assuré pour GTG et pompes.** Leurs `updateData` n’ont pas `strict`. Un timeout `IDB_OPERATION_TIMEOUT` dans `saveToDB` fait `return` sans throw si `failOnTimeout` est faux. `updateData` considère alors la sauvegarde réussie. **Démontré**.

### 3.4 `skipReact`

- **Fonction.** N’appelle pas `setData` avant le disque. Le ref `dataRef` est quand même mis à jour tout de suite.
- **Justification.** Éviter un rendu géant de tous les consommateurs de `useWorkout()` au milieu du clic, et éviter l’ancien autosave déclenché par `setData`. L’autosave sur `setData` est déjà retiré. **Supposé** pour la part « perf » ; **démontré** pour l’effet : l’UI qui dépend de `data` ne voit pas la séance avant `applyReactAfterPaint`.
- **Garantie de cohérence.** `dataRef` et l’écran divergent jusqu’au `startTransition`. Un flush `pagehide` lit `dataRef` (`flushPendingSaveNow`), pas le brouillon. Voir 3.14.
- **Nécessité.** Le découplage écran / disque est sain. Le placer *après* le disque pour la publication, et *avant* pour le ref, mélange « pas encore montré » et « déjà considéré comme dernier snapshot » .

### 3.5 `skipCloud`

- **Fonction.** Sur le chemin complet, programme un push différé au lieu d’un push immédiat. Sur le chemin séance incrémental, le push dans `saveSessionDayIncremental` est sauté ; un push de la ligne entière est relancé dans l’idle d’après succès.
- **Justification.** Ne pas mettre le réseau sur le chemin du bouton. **Démontré** comme ordre des appels.
- **Garantie.** Le cloud n’est pas une condition du toast séance. Un échec de push logue un avertissement et renvoie `false`. Le drapeau dirty n’est effacé que si le push a réussi et qu’aucune autre ligne dirty plus récente n’est apparue. **Démontré**.
- **Non assuré.** L’UI ne distingue pas « durable en local » et « répliqué ». I2 est tenu pour IndexedDB strict, pas pour le cloud.

### 3.6 `applyReactAfterPaint`

- **Fonction.** Après succès disque : deux frames, puis `setData` dans `startTransition`, puis callback contexte en idle.
- **Justification.** Peindre autre chose avant de republier le gros état. **Supposé**. Effet **démontré** : les pourcentages branchés sur `data` attendent la fin du disque et un tour de rendu basse priorité.
- **Nécessité.** La publication différée est légitime. La lier au succès disque est ce qui crée le délai perçu « le pourcentage attend l’enregistrement ». Ce n’est pas une garantie de durabilité ; la durabilité est déjà tranchée avant cet appel.

### 3.7 `saveSessionDayIncremental` et `persistWorkoutSessionDay`

- **Fonction.** Extrait la tranche du jour (`extractDaySliceFromAggregate`), l’assainit, l’écrit dans `workoutSessions`. Ne réécrit pas la ligne `workouts` sur ce chemin. Commentaire du gateway : l’écriture de la ligne entière clonait photos, endurance et historique sur le fil UI. **Démontré**.
- **Contenu de la tranche.** `SESSION_MAP_FIELDS` : coches, reps, poids, séries, logs, étirements, étoiles. Plus `dailyVariations` et `circuitProgress` du jour s’ils existent. Une map vide est écrite quand même : au rechargement, une map absente ne veut pas dire « garder l’ancien ». **Démontré** (commentaire et `replaceDayKeys`).
- **Relecture.** Après le put (timeout 10 s), `getWorkoutSessionDay` doit renvoyer une ligne, sinon `WORKOUT_SESSION_VERIFY_FAILED`. **Démontré**.
- **Garantie.** Le jour confirmé remplace les clés de cette date au chargement (`mergeSessionDaysIntoAggregate`, tri par `lastSaved`). Une décochage ne revient pas parce qu’une vieille clé traînerait dans l’agrégat. **Démontré** comme règle de fusion.
- **Ce que la relecture ne prouve pas.** Elle prouve qu’une ligne existe, pas que chaque champ du slice relu égale le slice écrit. **Démontré** (test d’existence seulement).
- **Champs hors tranche.** Le brouillon copie aussi `exerciseDisplayNames` et `exerciseMarkedWeighted` (`SESSION_MAP_KEYS`). Ces deux champs ne sont pas dans `SESSION_MAP_FIELDS`. Le chemin incrémental ne les met pas dans `workoutSessions`. Le chemin complet, lui, copie `exerciseMarkedWeighted` dans la ligne `workouts`. **Démontré** comme écart de couverture. Conséquence au rechargement : **non mesurée** (dépend du fait que la ligne agrégat soit encore relue pour ce champ).
- **Repli.** Si le store séances manque : lecture de toute la ligne, fusion, put de l’agrégat, timeout 12 s. **Démontré**. C’est le chemin que le commentaire du gateway cherchait à quitter.
- **Nécessité.** L’écriture par jour est la bonne frontière pour I4. La relecture d’existence est une garantie partielle, pas un luxe à jeter. Elle peut quitter le chemin qui débloque l’écran seulement si la confirmation « enregistré » l’attend encore.

### 3.8 `sanitizeDraftForPersist` et le grand nettoyage de `saveToDB`

- **Fonction brouillon.** Vérifie que les maps sont des objets, borne les reps 0–999, les poids 0–999, force les coches d’étirements en booléens.
- **Fonction chemin complet.** Reparcours de toutes les maps historiques (reps, poids, séries, logs, étoiles, photos, etc.) avant `saveRawWorkoutRow`. Le chemin incrémental retourne avant ce parcours.
- **Justification.** Ne pas persister des valeurs corrompues ; ne pas laisser un tableau à la place d’une map.
- **Garantie.** Bornes numériques sur le snapshot qui part au disque. **Démontré**. Ce n’est pas une preuve d’intégrité référentielle (un id d’exercice inconnu passe).
- **Coût.** Le chemin GTG / pompes / tout `updateData` non incrémental paie ce parcours sur tout l’historique, puis écrit la ligne entière. **Démontré** comme volume de travail. Durée **non mesurée**.
- **Nécessité.** Les bornes restent utiles. Les appliquer à tout l’historique à chaque mini-série GTG n’est pas exigé par la borne elle-même.

### 3.9 Révision `stale`

- **Fonction.** `draftRevisionRef` augmente à chaque patch. `persistFullDraft` capture la révision avant `updateData`. Si elle a changé, ou si `tempDataRef` n’est plus le snapshot écrit, retour `stale` sans effacer le brouillon. `saveSessionDraft` réessaie jusqu’à 4 fois puis jette `SESSION_DRAFT_STILL_DIRTY` si c’est encore sale.
- **Justification.** Une saisie pendant l’écriture ne doit pas être effacée par la fin de l’écriture ancienne.
- **Garantie partielle.** Le snapshot plus récent est renvoyé au disque si une tentative suivante réussit. L’écriture ancienne a **déjà** été commise avant la détection `stale`. La suivante doit la remplacer. **Démontré** comme ordre dans un seul hook, si la seconde écriture est une tranche complète du jour et non un delta. `extractDaySliceFromAggregate` extrait tout le jour du snapshot, pas un diff. **Démontré**.
- **Non assuré.** Au-delà de 4 tentatives, l’erreur remonte et le brouillon reste. Comportement UI : toast d’erreur si `TodayTab` l’attrape. Pas de file durable hors mémoire.
- **Nécessité.** Le principe (ne pas jeter un brouillon plus récent) est indispensable. Quatre essais puis erreur est un garde-fou, pas une preuve que toutes les frappes tiennent sous charge.

### 3.10 Timeouts

| Constante | Valeur dans le code | Effet |
| --- | --- | --- |
| `SESSION_SAVE_TIMEOUT_MS` | 25 s | Le bouton rejette `SESSION_SAVE_TIMEOUT`. La promesse disque continue. |
| `SESSION_PUT_TIMEOUT_MS` | 10 s | Put du jour |
| `IDB_OPERATION_TIMEOUT_MS` | 8 s | Autres opérations enveloppées |
| Repli agrégat | 12 s | `saveSessionDayOntoAggregate` |
| Idle XP / cloud séance | 800 ms | `scheduleTodayCheckIdle` après succès |

**Démontré.** Un timeout bouton ne cancel pas la transaction IndexedDB. L’écriture peut finir après que l’UI a dit « trop long ». **Non assuré** : pas d’annulation réelle, et pas de rapprochement explicite entre ce timeout et la tentative suivante. Risque de deux écritures du même jour encore en vol. **Supposé** comme risque ; le code ne montre pas de `abort()` sur la transaction du jour.

Timeout non strict : voir 3.3. Succès menteur possible. **Démontré**.

### 3.11 `flushWorkoutAggregateCloudPushNow`

- **Fonction.** Push immédiat de la ligne, si le flag cloud est actif, la clé n’est pas `anonymous`, et un jeton existe. Échec : avertissement, `false`.
- **Justification.** Répliquer l’agrégat après un enregistrement local.
- **Garantie locale.** Aucune. Le local est déjà décidé.
- **Garantie cloud.** Best-effort. Pas de file visible côté Aujourd’hui qui dirait « en attente de réplication ». Le dirty flag évite d’effacer un dirty plus récent. **Démontré**.
- **Confidentialité.** Le push envoie la ligne workout au serveur déjà utilisé par la synchro agrégat. Ce n’est pas un nouveau service. Le détail du contrat réseau n’est pas ré-auditée ici.
- **Nécessité.** La réplication peut rester hors du chemin visuel. Elle ne doit pas être présentée comme la confirmation locale.

### 3.12 Invalidation et calcul XP

- **Fonction.** `invalidateSportXpCache` met `signature: null` sans jeter le dernier total (anti-flash à 0). Le recalcul part quand la signature dérivée de `data` change, après deux frames, via `calculateSportXP`, puis `useSportGrade`.
- **Justification.** Ne pas afficher 0 pendant le calcul ; ne pas recalculer si la signature est identique.
- **Garantie d’exactitude.** Le moteur historique est la référence tant qu’on l’exécute sur le snapshot complet. **Démontré** comme chemin actuel. Exactitude mathématique de chaque formule : pas ré-prouvée dans cet audit.
- **Coût structurel démontré, durée non mesurée.** La signature parcourt toutes les clés cochées, caractère par caractère, dans le rendu qui suit `setData`. `calculateSportXP` reparcours l’historique (reps, coches, étirements planifiés, Garmin, pas, défis, bonus de complétion, trophées, volume plafonné).
- **Canal brouillon XP.** `subscribeSessionDraftXp` n’a aucun abonné. `urgentXp` n’est pas passé par la coche. **Démontré**.

### 3.13 Brouillon et publication React

Trois canaux (`sessionDraftStore.js`) :

- version globale de brouillon (`bumpSessionDraft`) — listes hors carte ;
- version par exercice (`bumpExerciseUi`) — une carte ;
- epoch / dirty de commit — bouton Enregistrer.

La coche n’émet que le canal par exercice. Les étirements émettent le canal global. Le score de séance n’écoute aucun des deux. **Démontré**.

`startTransition` sur `setData` après peinture : React peut retarder ce rendu derrière une interaction. **Démontré** comme API utilisée. Impact en millisecondes **non mesuré**.

`hasUnsavedExercises` / `hasUnsavedStretches` ne sont presque plus alimentés par les patches. Le bouton réel s’appuie sur `useSessionCommitDirty`. Le memo du score, lui, dépend encore de `hasUnsavedExercises`. **Démontré** comme branchement mort pour la coche.

### 3.14 Fermeture de page

`pagehide` et `beforeunload` appellent `flushPendingSaveNow`, qui écrit `dataRef` si la clé n’est pas anonyme. Le brouillon (`tempDataRef`) n’est pas inclus, sauf s’il a déjà été copié dans `dataRef` par un `updateData` `skipReact`. Une coche non enregistrée n’y est pas. **Démontré**.

Donc : quitter l’onglet avec des coches non enregistrées les perd. **Non assuré** (I6 / I7 pour l’état 1). Ce n’est pas un bug de timeout ; c’est l’absence de persistance de l’état 1.

### 3.15 `mergeEnduranceWithoutSilentWipe`

Sur le chemin complet, `enduranceData` vide ou listes vidées ne remplace pas l’endurance précédente, sauf `allowWipe` ou type explicitement touché. **Démontré**.

Le chemin séance incrémental n’écrit pas `enduranceData`. Une coche d’exercice ne passe pas par ce garde. **Démontré**.

GTG et pompes passent par le chemin complet : le garde s’applique à la fusion `previous` (closure `data` du hook) / `incoming`. Il protège contre une liste vidée par erreur. Il ne fusionne pas deux éditions concurrentes du même tableau de séances : la liste incoming non vide remplace la précédente. **Démontré**.

### 3.16 Deux onglets

Aucun `BroadcastChannel` dans le dépôt indexé. L’écoute `storage` de `HomePage` ne concerne `swipeNavigationSettings`, pas le workout. IndexedDB est partagé par origine sans protocole de version entre onglets dans ce flux. **Démontré** comme absence de coordination.

Dernier écrivain gagne, par store. Au rechargement, les lignes séance sont réappliquées par `lastSaved` croissant. Deux onglets qui écrivent le même jour : la ligne au `lastSaved` le plus récent remplace tout le jour, pas un merge champ à champ. **Démontré** comme règle. Scénario réel deux onglets **non exécuté**.

### 3.17 Quota, crash, transaction coupée

`saveToDB` documente qu’un timeout fréquent laisse les données en mémoire et qu’un prochain cycle réessaiera. Le prochain cycle autosave sur `setData` est désactivé. Qui réessaie une séance `strict` échouée : l’utilisateur, via le bouton, tant que le brouillon est encore là. **Démontré**.

Pas de journal de mutations. Pas de `durability: 'strict'` visible sur le put du jour dans le passage lu. La durabilité réelle est celle par défaut d’IndexedDB dans le navigateur (transaction commit = durable selon le moteur, pas selon un fsync exposé à l’app). **Non assuré** au-delà du commit de transaction. Un crash pendant la transaction : la transaction n’est pas commitée (garantie IndexedDB standard). **Supposé** comme comportement du navigateur, pas re-testé ici.

Quota plein : erreur IndexedDB, chemin strict remonte, chemin non strict peut timeout ou throw selon le message. Pas de dégradation guidée « stockage plein » sur Aujourd’hui. **Non assuré** comme UX ; **démontré** comme absence de branche dédiée dans le flux séance.

---

## 4. Invariants demandés, état réel

| Id | Exigence | État |
| --- | --- | --- |
| I1 | Pas de perte silencieuse d’une sauvegarde confirmée | **Partiel.** Chemin strict : erreur remonte, brouillon gardé. Chemin non strict : timeout IndexedDB peut revenir sans erreur après `setData`. Relecture = existence, pas égalité des champs. |
| I2 | Pas de fausse confirmation | **Partiel.** Toast séance après put + relecture d’existence. Il ne couvre pas le cloud. GTG/pompes n’ont pas ce contrat strict. La coche optimiste n’est pas étiquetée « non enregistrée » sur la case elle-même ; le bouton dirty le dit pour la séance. |
| I3 | Pas d’écrasement entre modifications successives | **Partiel** dans un seul hook de brouillon (`stale` + tranche complète). **Non assuré** entre `persistTailRef` et `runSerializedSave`, ni entre deux onglets (remplacement du jour entier). |
| I4 | Un jour n’écrase pas les autres jours | **Démontré** pour l’écriture incrémentale (préfixe de date + `replaceDayKeys`). **Non assuré** si le repli réécrit l’agrégat depuis un snapshot incomplet. |
| I5 | Une écriture GTG n’efface pas la séance, et l’inverse | **Partiel.** L’incrémental n’écrit pas l’endurance. Le chemin complet réécrit les maps de séance présentes dans le snapshot mémoire. Le garde endurance empêche une liste vide silencieuse, pas un conflit de deux listes non vides. Au chargement, le store séances reprend la main sur les maps du jour. |
| I6 | Après redémarrage, le confirmé revient | **Démontré** comme intention de la fusion store séances → agrégat. **Non exécuté** dans cet audit (pas de test de rechargement réel). Le non confirmé (brouillon) ne revient pas. |
| I7 | Interruptions | Voir 3.14 et 3.17. Fermeture avec brouillon sale : perte. Crash milieu de transaction : **supposé** rollback navigateur. Deux onglets : dernier `lastSaved` du jour. Cloud down : local peut être bon, cloud non ; l’UI séance ne le dit pas. |
| I8 | Seul le demandé change | **Partiel.** La tranche remplace tout le jour. Un snapshot de brouillon incomplet pour une map du jour efface les clés absentes au rechargement. C’est voulu pour la décochage, dangereux si la copie est partielle. |
| I9 | Pas de fuite | Cet audit n’ajoute pas de télémétrie. Les `console.error` existants peuvent contenir des objets d’erreur ; pas de revue ligne à ligne des logs. Le push cloud est le canal déjà existant, pas un nouveau. **Non assuré** comme audit de confidentialité complet. |
| I10 | Anciennes données lisibles | La fusion séances + agrégat est le chemin de compatibilité actuel. Aucune migration nouvelle n’est proposée dans ce dossier. |

---

## 5. Domaines de l’onglet Aujourd’hui

| Domaine | Déclencheur | État local | Persistance | Invalidation XP | Risque principal |
| --- | --- | --- | --- | --- | --- |
| Coche exercice | Clic case | Optimiste + brouillon, canal carte | Bouton, incrémental strict | Après succès, idle, puis calcul sur `data` | Double clic ; % et XP aveugles au brouillon |
| Reps, poids, séries | Saisie | Brouillon, parfois `silent` donc pas de bump global | Même bouton | Idem | Même fichier disque que la coche |
| Étirements | `toggleStretch` | Brouillon + bump global | Même `saveSessionDraft` | Idem | Le score de séance n’écoute pas le bump |
| Quêtes liées | Après coche ou étirement | Moteur de quêtes séparé | Non relu ici en détail | Hors barre sport si le moteur quête est ailleurs | Travail synchrone sur le clic étirement |
| GTG | Clic mini-série | `data` après `setData` immédiat | Chemin complet, non strict, file `runSerializedSave` | `invalidate` après l’await, calcul sur `data` | Réécriture d’agrégat ; timeout silencieux |
| Pompes | Enregistrer le formulaire | Idem | Idem + construction de séance avant | Idem | Idem |
| Endurance déjà dans l’agrégat | Via les deux ci-dessus | Mémoire React | Garde anti-wipe sur liste vide | Selon le calcul XP endurance | Liste non vide remplace, pas de merge fin |
| Garmin | Chargement hook XP | État Garmin séparé | Pas déclenché par une coche | Entré dans `calculateSportXP` | Recalcul complet même si la coche ne touche pas Garmin |
| Nutrition (part XP) | Chargement repas | État repas | Pas le bouton séance | Dans la même signature | Idem |

---

## 6. Ce que l’architecture protège vraiment

Elle protège surtout ceci, et c’est à garder :

- ne pas réécrire photos et endurance à chaque coche, tant que le chemin incrémental est celui qui part ;
- remplacer un jour entier au rechargement pour qu’une décochage tienne ;
- refuser de jeter un brouillon de séance si une frappe arrive pendant l’écriture ;
- refuser, sur le bouton séance, de traiter un timeout disque comme un succès ;
- refuser de remplacer l’endurance par une liste vide accidentelle sur le chemin complet ;
- garder l’ancien total XP à l’écran plutôt que 0 pendant un recalcul.

Elle ne protège pas encore :

- le brouillon à la fermeture ;
- l’exclusion réelle entre séance incrémentale et écriture GTG ;
- deux onglets sur le même jour ;
- l’égalité byte à byte après relecture ;
- la distinction visuelle « local confirmé » / « cloud confirmé » ;
- les champs de brouillon absents de `SESSION_MAP_FIELDS`.
