# E3 — contrat de persistance GTG et pompes

18 novembre 2026. Node v24.11.1, Vitest 4.0.15, jsdom pour le niveau 2. Playwright 1.56.1, Chromium isolé, pour le niveau 3. Aucune écriture dans le profil personnel, aucune migration de schéma, aucun store `workoutDrafts`, aucune règle XP ni de quête modifiée.

Le contrat est dans le source, uniquement quand l’appelant passe `reportOutcome: true`. Les autres appelants de `updateData` ne reçoivent pas cette option.

## 1. Fichiers de production modifiés

- `src/services/workout/saveOutcome.js` — classement SUCCESS / FAILURE / UNKNOWN.
- `src/hooks/useWorkoutData.js` — option `reportOutcome` dans `saveToDB` et `updateData`.
- `src/services/endurance/enduranceDataService.js` — `persistEnduranceData` transmet l’option seulement si on la demande.
- `src/services/endurance/enduranceSessionPersist.js` — une séance pompes de même `id` remplace l’ancienne au lieu de s’ajouter.
- `src/components/tabs/TodayTab/components/GtgTodaySchedulePanel.jsx`
- `src/components/tabs/EnduranceTab/components/GtgSessionsPanel.jsx`
- `src/components/tabs/EnduranceTab/components/GtgProtocolDataBanner.jsx`
- `src/components/tabs/EnduranceTab/components/GtgProtocolGuide.jsx`
- `src/components/tabs/TodayTab/components/PushupChallengeTodayPanel.jsx`

Fichiers de preuve, hors production :

- `scripts/dplus/e3-persistence.test.js`
- `playwright.e3.config.js`
- `tests/e2e/e3-persistence-isolated.spec.js`
- `diagnostics/e3-browser-observation.json`

`scripts/dplus/saveOutcome.mjs` n’est pas modifié. Les tests E1 et E2 continuent de l’utiliser.

## 2. Contrat exact

L’appelant qui passe `{ reportOutcome: true }` reçoit :

```js
{
  status: 'SUCCESS' | 'FAILURE' | 'UNKNOWN',
  reason: '...',
  operationId: '...',
  evidence: { acked, timedOut, readFailed, storedOperationId }
}
```

`updateData` crée un `operationId` et l’ajoute seulement à la ligne envoyée au dépôt, sous `saveOperationId`. L’état React n’emporte pas ce champ. `projectPersistedWorkout` ne le copie pas tout seul : `saveToDB` le recopie après la projection, et seulement s’il est une chaîne non vide.

Ce n’est pas un nouveau store ni un index. La prochaine sauvegarde complète qui n’emporte pas le champ l’enlève. Les lignes historiques ne sont pas réécrites.

| Preuve relue | Issue |
| --- | --- |
| `row.saveOperationId` égal à cette opération | SUCCESS. Raison `ack-and-operation-id` si le dépôt a acquitté, `operation-id-after-timeout` si l’acquittement a manqué. |
| Erreur d’abort (`AbortError`, `TRANSACTION_ABORTED`, `WORKOUT_TX_ABORTED`) et identifiant absent | FAILURE `abort-not-committed` |
| Autre identifiant déjà stocké | UNKNOWN `acked-then-superseded` ou `other-operation-stored` |
| Timeout ou `IDB_OPERATION_TIMEOUT`, identifiant absent | UNKNOWN `timeout-operation-unproven` |
| Acquittement sans identifiant | UNKNOWN `ack-without-operation-id` |
| Relecture en échec | UNKNOWN `reread-failed` |
| Autre erreur, identifiant absent | UNKNOWN `write-error-unproven` |
| Rien de tout cela | UNKNOWN `not-confirmed` |

Une valeur égale sans cet identifiant ne classe pas l’opération. `withIdbOperationTimeout` est un `Promise.race` : il n’annule pas la transaction. Un test qui sait qu’aucun `put` n’a eu lieu ne donne pas cette connaissance à la production. Le timeout sans identifiant relu reste donc UNKNOWN.

`saveOutcomeNotice` : rien sur SUCCESS. Sur FAILURE : « La sauvegarde n’a pas abouti. La saisie est conservée. » Sinon : « Sauvegarde non confirmée. Les données restent visibles pendant la vérification. »

`publishConfirmedSave` (journal de succès, `workoutContextCallback`, invalidation XP des panneaux) ne part que si le statut est SUCCESS. Sans l’option, il part encore après l’attente, y compris quand un timeout a été avalé. C’est le comportement historique.

## 3. Appelants GTG adaptés

Tous passent `{ reportOutcome: true }`.

- `GtgTodaySchedulePanel` — ajout, retrait, bascules. Le payload préparé reste dans une ref. Un nouvel ajout pendant qu’un payload est en attente renvoie ce même payload et ne rappelle pas `addGtgAdHocPassage`.
- `GtgSessionsPanel` — même garde sur l’ajout.
- `GtgProtocolDataBanner` — le repli « enregistré » (`setUserToggled(false)`) n’a lieu qu’après SUCCESS. Le bouton « Réessayer la même sauvegarde » renvoie le même payload.
- `GtgProtocolGuide` — `commitGtg` n’est pas attendu par ses appelants, comme avant. Le résultat met à jour l’avis. Il n’y a pas de verrou anti double clic.

`gtgService.js` n’appelle pas `updateData`. Il n’a pas été modifié.

Aucun de ces gestionnaires n’appelle la synchro de quêtes. Il n’y a pas d’effet de quête à différer, et aucun replay n’a été ajouté.

## 4. Appelants pompes adaptés

`PushupChallengeTodayPanel` :

- le rythme et la séance passent par `reportOutcome` ;
- `invalidateSportXpCache` seulement après SUCCESS ;
- la première construction prend `form.pendingSessionId` ou un seul `Date.now()` ;
- le payload construit est conservé. Un second clic renvoie ce payload et ne rappelle ni `Date.now()` ni `buildWorkoutAfterEnduranceSession` ;
- un envoi déjà en construction (`'building'`) ne lance pas une seconde écriture.

`buildWorkoutAfterEnduranceSession` ne dédoublonne que `activityType === 'pushups'`, par `id`. Les autres activités continuent d’ajouter.

## 5. Comportement par défaut des autres appelants

Sans `reportOutcome` :

- `saveToDB` retourne `undefined` après un put, et après un timeout si `failOnTimeout` est faux ;
- un abort ou une autre erreur est toujours relancé ;
- `updateData` appelle `publishConfirmedSave` puis retourne `undefined` ;
- le mode strict relance encore l’erreur ;
- `persistEnduranceData` retourne `nextData`, pas `{ data, saveOutcome }`.

`EnduranceTab` n’a pas reçu l’option. La normalisation et les autres activités restent sur l’ancien contrat. Les 87 appels historiques de `updateData` ne sont pas migrés.

Le mode éphémère (session non authentifiée) n’écrit pas IndexedDB. Avec l’option, l’absence d’identifiant relu donne UNKNOWN `not-confirmed`. L’interface GTG ou pompes n’annonce donc pas un enregistrement durable tant que l’utilisateur n’est pas authentifié. Sans l’option, l’ancien succès apparent en mémoire reste en place.

## 6. Preuves SUCCESS / FAILURE / UNKNOWN

Démontrées sur le vrai `updateData` avec un dépôt injecté, portée `e3-synthetic-scope` :

- SUCCESS acquitté : identifiant relu, callback une fois.
- FAILURE : abort avant écriture, callback zéro, saisie encore présente.
- UNKNOWN : timeout sans identifiant, même si le double de test a compté zéro put.
- SUCCESS après timeout : l’identifiant est dans la ligne relue.
- UNKNOWN : même marqueur relu, autre identifiant ou identifiant absent.
- UNKNOWN : relecture qui jette, y compris si le put a eu lieu.
- UNKNOWN : deux `saveToDB` parallèles, l’identifiant qui n’est plus stocké est `acked-then-superseded`.

Non démontré en production : le moment exact du commit. Le dépôt de test sait distinguer « avant » et « après ». Le classement de production ne s’en sert pas.

## 7. Tests unitaires

Le classement pur est le premier test de `scripts/dplus/e3-persistence.test.js` : une valeur identique avec un autre identifiant stocké reste UNKNOWN, et l’avis ne contient pas « enregistré ».

Les prototypes `scripts/dplus/saveOutcome.mjs`, `e1-save-to-db.test.js` et `e2-save-contract.test.js` n’ont pas été réécrits.

## 8. Tests d’intégration

Commande :

```text
node node_modules/vitest/vitest.mjs run scripts/dplus/e3-persistence.test.js scripts/dplus/e1-save-to-db.test.js scripts/dplus/e2-save-contract.test.js --reporter=dot
```

Résultat de cette exécution : 3 fichiers, 34 tests, verts, 8,27 s. Les 14 tests E3 importent aussi les cinq panneaux pour vérifier qu’ils se transforment. Ils ne cliquent pas dans l’interface.

| Scénario | Résultat attendu tenu |
| --- | --- |
| T1 écriture acquittée | SUCCESS `ack-and-operation-id` |
| T2 abort avant écriture | FAILURE, effet 0 |
| T3 timeout sans identifiant | UNKNOWN `timeout-operation-unproven`, pas FAILURE |
| T4 timeout après écriture, identifiant relu | SUCCESS `operation-id-after-timeout` |
| T5 valeur conforme, identité non prouvée | UNKNOWN |
| T6 relecture impossible | UNKNOWN `reread-failed` |
| T7 deux écritures | le perdant est UNKNOWN, pas SUCCESS |
| T8 même opération deux fois | deux SUCCESS, un seul passage ad hoc |
| T9 deux opérations | identifiants distincts |
| T10 GTG existants | `ah_1` conservé après payload GTG vide |
| T11 pompes existantes | `pu_1` et `list_1` conservés |
| T12 réessai du même payload | pas de second passage |
| T13 UNKNOWN | avis « non confirmée », pas « enregistré » |
| T14 UNKNOWN | callback 0 |
| T15 FAILURE | liste ad hoc conservée |
| T16 UNKNOWN | brouillon conservé |
| T17 sans option | timeout résolu en `undefined`, pas de `saveOperationId` ; abort strict encore jeté |
| T18 garde E2.1 | payload vide n’efface pas le GTG déjà en état |

T10 attend que React ait publié `ah_1` avant le second appel. `saveToDB` fusionne avec `data.enduranceData` de la closure de rendu, pas avec `dataRef`. Deux sauvegardes dans le même tour, avant re-rendu, voient encore l’endurance précédente. Les clics utilisateur attendent la promesse puis re-rendent. Cette limite n’est pas corrigée ici.

## 9. Tests navigateur

Commande :

```text
node node_modules/playwright/cli.js test --config=playwright.e3.config.js
```

Config isolée : `http://127.0.0.1:3011`, `reuseExistingServer: false`, pas de serveur Garmin, contexte Chromium neuf. Ce n’est pas le profil Chrome personnel et ce n’est pas jsdom.

Deux exécutions vertes (1 test, environ 1,3 min puis 1,0 min). Le test importe `createWorkoutRepository` dans la page, écrit la clé `e3-browser-synthetic` avec le passage `ah_browser`, la pompe `pu_browser` et `saveOperationId` `op-browser-1`, relit, recharge, et relit encore `ah_browser`.

Ce n’est pas le parcours React. L’écran observé (`diagnostics/e3-browser-observation.json`) est l’accueil d’un profil vide : « 0 XP total », « Unlock the app », tableau de bord. Les formulaires GTG et pompes n’ont pas été ouverts ni soumis. Aucun identifiant personnel n’a été saisi.

La session déconnectée est éphémère dans `WorkoutContext` : l’interface n’écrit pas IndexedDB. Un rechargement après un clic réel exigerait un compte de test dédié. Ce compte n’a pas été créé.

## 10. Résultats réels

- Niveau 2 : 34/34 verts sur cette exécution.
- Niveau 3 dépôt : écriture et relecture après rechargement, base du contexte Playwright seulement.
- Niveau 3 interface : non exécuté. Les six contrôles demandés (ajout GTG, ajout pompe, persistance du clic, absence de doublon au réessai visible, absence de succès prématuré à l’écran, garde E2.1 à l’écran) ne sont pas démontrés dans le navigateur.
- Build : échec, voir la section 15.

## 11. Cas non démontrés

- Identité d’opération après un crash du processus, une fois le champ retiré par une sauvegarde ultérieure sans option.
- Moment du commit en production. Le timeout sans identifiant relu reste UNKNOWN, y compris quand un harnais sait qu’aucun put n’a eu lieu.
- Deux onglets. La file `runSerializedSave` sérialise `updateData` dans un onglet. Deux `saveToDB` directs peuvent se chevaucher. L’écriture acquittée puis remplacée est UNKNOWN pour l’identifiant qui n’est plus là. Ce n’est pas une fusion multionglets.
- `GtgProtocolGuide` : deux clics rapides peuvent lancer deux `updateData`. Ils sont sérialisés, le second remplace le payload en attente. Pas de réessai automatique.
- Pendant qu’un payload GTG est en attente, un nouvel envoi du formulaire renvoie l’ancien payload. Les répétitions nouvellement tapées ne partent pas. Le formulaire a déjà vidé ses champs. C’est sûr pour les doublons, et la saisie nouvelle n’est pas celle qui sera réessayée.
- Quêtes : aucun de ces parcours ne les déclenche. Un crash après SUCCESS mais avant un autre écouteur n’est pas couvert. Pas de file de replay.

## 12. Risques de doublons

Le réessai autorisé renvoie le même objet. Pour les pompes, le même `id` remplace la séance. Pour le GTG, le même snapshot remplace la journée.

Un ajout GTG qui rappelle `addGtgAdHocPassage` pendant qu’aucun payload n’est retenu crée un nouvel identifiant. La garde empêche cela seulement tant que la ref est remplie.

Deux onglets peuvent encore écrire deux passages. Le contrat d’erreur ne stabilise pas les identifiants GTG de production.

`commitGtg` sans attente peut empiler deux snapshots. Le dernier écrit gagne dans un même onglet. Ce n’est pas un doublon de ligne IndexedDB, parce que la clé de ligne est la portée utilisateur.

## 13. Risques de perte de données

- UNKNOWN et FAILURE gardent le payload et n’effacent pas le formulaire de séance pompes.
- Le garde E2.1 reste dans `mergeEnduranceWithoutSilentWipe`. Un GTG vide sans `explicitGtgClear` ni `allowWipe` ne remplace pas les jours déjà présents. T18 le vérifie après que l’état React a publié les jours.
- Deux sauvegardes avant ce re-rendu fusionnent avec l’ancienne closure. Un payload vide peut alors être écrit si l’état rendu n’a pas encore les jours. Les panneaux attendent la promesse avant le rendu suivant. Un appelant qui enchaîne deux `updateData` sans attendre n’a pas cette protection.
- Le champ `saveOperationId` disparaît à la sauvegarde complète suivante qui ne le porte pas. Cela retire la preuve, pas les passages.
- Aucune donnée personnelle n’a été lue ni écrite par ces tests. La clé navigateur est `e3-browser-synthetic` dans un profil temporaire.

## 14. Risques liés aux effets métier

`invalidateSportXpCache` et `workoutContextCallback` des appels opt-in ne partent qu’après SUCCESS. `useWorkoutHistory` crée une table sur `data_save` via ce callback. Pour ces parcours, la table n’est pas créée sur UNKNOWN ni FAILURE.

Les règles XP et les quêtes ne sont pas modifiées. Il n’existe pas de contrat d’idempotence de quête, donc aucun report de quête n’a été branché. Si un futur parcours doit créer une quête seulement après persistance, il devra attendre SUCCESS et prévoir lui-même un replay idempotent. E3 ne le fait pas.

Sans l’option, le callback part encore après un timeout avalé. C’est voulu pour T17, et ce n’est pas une confirmation réelle.

## 15. Résultats du build

Commande : `node node_modules/vite/bin/vite.js build`.

Le build n’a pas réussi. Vite 4.5.14 a transformé 759 modules, puis Rollup s’est arrêté sur :

`Identifier 'periodVerb' has already been declared`

Le cadre pointe `src/components/tabs/GarminTab/hooks/useSyncWorker.js`, via le plugin worker. Le double import est dans `src/utils/sport/recapPeriodDetectDiscoveries.js` : `periodVerb` est importé depuis `recapPeriodVoice` à la ligne 29 et de nouveau à la ligne 46. Aucun fichier E3 n’est dans cette pile. Le module connaissance n’a pas été modifié. `openKnowledgeDb` est toujours une fonction non exportée de `src/services/knowledge/knowledgeIndexedDB.js` ; cette exécution ne l’a pas atteinte.

Les modules E3 ont été transformés par Vitest, y compris les cinq panneaux importés par le test. Cela ne remplace pas un build Vite vert.

## 16. Rollback non destructif

Retirer l’option des cinq composants, rétablir le retour de `persistEnduranceData`, retirer la branche `reportOutcome` de `useWorkoutData`, et supprimer `saveOutcome.js`. Remettre l’ajout inconditionnel dans `enduranceSessionPersist.js` si le dédoublonnage pompes doit aussi partir.

Aucune migration à annuler. Les lignes qui ont déjà un `saveOperationId` restent lisibles : le champ est ignoré par les appelants sans option, et une sauvegarde complète suivante peut le retirer. Le profil personnel n’a pas été touché. Le contexte Playwright est jetable.

## 17. GO / NO-GO

**GO partiel, niveau 2, pour les parcours GTG et pompes déjà branchés.** L’option existe sur le vrai `saveToDB` / `updateData`. Les appelants non migrés gardent leur contrat. Ces parcours n’annoncent un succès qu’après un identifiant relu. La saisie reste sur FAILURE et UNKNOWN. Il n’y a pas de réessai qui recrée un identifiant. Les effets de confirmation ne partent pas sur UNKNOWN. Le garde GTG E2.1 est toujours là. Les tests d’intégration de cette exécution passent. Les limites d’identifiant et de concurrence sont celles des sections 11 à 13.

**NO-GO partiel :**

- pas de succès navigateur sur les formulaires ;
- pas de résolution multionglets ;
- pas de preuve durable au-delà du prochain enregistrement qui n’emporte pas l’identifiant ;
- pas de report de quête, parce que l’idempotence n’est pas démontrée et que ces gestionnaires n’en lançaient pas.

Le code opt-in n’est pas retiré : les garanties de niveau 2 tiennent, et présenter le niveau 3 comme réussi serait faux. Il ne faut pas étendre l’option aux autres domaines sur cette base.

## 18. Prochaine étape pour les séances de l’onglet Aujourd’hui

Les coches et « Enregistrer » de la séance du jour appellent encore `updateData` sans `reportOutcome`. Ils peuvent donc encore afficher un succès après un timeout avalé. Les brancher demande le même opt-in, un identifiant stable par intention de séance, et une décision sur `workoutContextCallback`, qui crée aujourd’hui une table dès le callback. Ce n’est pas fait dans E3.

Avant cela, le build doit être rétabli hors de cette mission : le double import `periodVerb` bloque Vite avant les fichiers E3. Le module connaissance reste un second blocage connu, non atteint cette fois.
