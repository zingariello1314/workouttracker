# DPLUS-06 — Décision architecturale et plan

## 1. D+ est-elle meilleure, ou seulement plus grosse ?

Meilleure **sur les trous que D laisse ouverts**, pas sur tout le tableau.

D suffit pour la réactivité de la case et du pourcentage, et pour cesser de mentir sur le toast, **si** on l'implémente. Elle ne protège pas le brouillon au crash, et elle garde « dernière tranche gagnante » entre onglets.

D+ est le même édifice plus une copie de jour hors du canonique, et un patch de clés dans la transaction. Ce n'est pas un event sourcing. Les pièces refusées (journal, Worker par défaut, nouveau store, serveur) ne font pas partie de D+.

Tant que les tests DPLUS-05 ne sont pas verts, les cases « attendu » ci-dessous ne sont pas des garanties.

### Comparaison

Légende : **Dém.** = déjà vrai dans le code actuel ou mécanique déjà là. **Att.** = vrai si D ou D+ est construit comme écrit. **Hyp.** = pas testé, y compris le gain de temps.

| Dimension | Aujourd'hui | D | D+ |
| --- | --- | --- | --- |
| Réactivité coche | Optimiste fragile. **Dém.** | Mémoire, sans frame d'annulation. **Att.** | Identique à D. **Att.** |
| Réactivité pourcentage | Attend `data`. **Dém.** | Suit la mémoire. **Att.** | Identique. **Att.** |
| XP exacte | Moteur complet après `data`. **Dém.** Lent : **hyp.** | Même moteur après peinture, sur mémoire. **Att.** Exactitude **dém.** si c'est le même appel. Rapidité **hyp.** | Identique, plus rejet d'un résultat de vieille révision. **Att.** |
| Temps de sauvegarde perçu | Disque puis peinture. **Dém.** | Confirmation encore liée au disque, peinture non. **Att.** | Idem, plus `setItem` coalescé qui n'est pas le bouton. **Att.** Coût **hyp.** |
| Protection des brouillons | Mémoire seule. **Dém.** | `pagehide` seulement. **Att.**, limite **dém.** du cycle de vie | `localStorage` coalescé + `pagehide`. **Att.** Pas une garantie de kill. |
| Crash | Perte du non validé. **Dém.** | Idem si pas de `pagehide`. | Tenu si `setItem` a réussi. **Att.** Coupure secteur **hyp.** |
| Conflits deux onglets | Dernier `put` du jour. **Dém.** | Inchangé. | Fusion des clés disjointes, conflit sinon. **Att.** |
| Écrasement intra-onglet | `stale` partiel, files non unifiées. **Dém.** | Une file. **Att.** | File + transaction qui relit. **Att.** |
| Compatibilité historique | Fusion séances. **Dém.** | Même format. **Att.** | Même id canonique. Brouillon hors merge. **Att.** Ligne sans `revision` acceptée. **Att.** |
| Confidentialité | Cloud après save, logs d'erreur possibles. | Pas de télémétrie nouvelle. | Brouillon local en plus, effacé à la validation et à la déconnexion. Pas de push avant le bouton. **Att.** |
| Restauration | Endurance : 1 slot localStorage. Séance : backup non branché. Cloud best-effort. **Dém.** | N'ajoute pas de générations. | N'ajoute pas non plus de niveau 4. Le dit. Générations = chantier séparé, pas un prérequis de la coche. |
| CPU | Signature + moteur sur le rendu de `data`. **Dém.** | Moteur hors du clic, toujours sur le thread. **Att.** | Idem. Worker seulement si mesuré. |
| Mémoire | Gros snapshot répété. **Hyp.** sur la taille | Snapshots d'état en plus. **Hyp.** | Patch + une tranche de jour en `localStorage`. **Att.** comme forme, taille **hyp.** |
| IndexedDB | Tranche au bouton ; agrégat sur GTG. **Dém.** | GTG sans les maps de séance. **Att.** | Séance : un `get`+`put` de la ligne du jour au bouton, pas à chaque frappe. **Att.** |
| Migration | — | États + branchements. | Idem + une clé `localStorage` + filtre mental « pas dans le merge ». Pas de migration de lignes. |
| Maintenance à 5–10 ans | Déjà difficile (deux files, backup mort). | Moins de files, mêmes stores. | Un contrat de plus (brouillon ≠ validé). Tenue si les tests S6 et S9 restent. Un journal serait pire. |
| Réversibilité | — | Revenir aux lectures de `data`. | Cesser d'écrire la clé brouillon. Les lignes canoniques restent lisibles. |
| Régression | — | Lecteurs de `data` oubliés. | Brouillon promu par erreur si on le met dans `workoutSessions` sans filtre. D+ l'interdit. |

Conclusion du tableau : D+ est meilleure là où D acceptait une perte (crash, deux coches compatibles). Elle n'est pas plus rapide que D sur la peinture. Elle n'est pas une stratégie de survie à la perte du disque. Le prétendre serait faux.

---

## 2. Réponses

1. **Protéger dès le clic sans ralentir l'affichage ?** Oui, si l'écran peint la mémoire et si l'écriture part après, sans `await` sur le clic. La protection commence au retour du `setItem`, pas au clic lui-même. Le laps entre les deux reste un risque nommé.

2. **Meilleure stratégie de brouillon ?** Coalescence courte (immédiate pour une coche, groupée pour les frappes) vers la clé `localStorage` de jour déjà prévue dans le code et non branchée. Promotion au canonique seulement au bouton. Pas un journal.

3. **Le bouton reste-t-il une validation distincte ?** Oui. Il porte le swap de repos, les quêtes, le toast, le cloud et `WORKOUT_UPDATED`. Une sauvegarde de brouillon qui ferait ça changerait les règles.

4. **Une file JavaScript suffit-elle ?** Non. Elle sert dans l'onglet. L'exclusion entre onglets est la transaction qui relit la ligne.

5. **Éviter les écrasements entre onglets ?** Patch de clés disjointes appliqué sur la ligne relue dans la transaction. Même clé, valeurs différentes : conflit visible, pas d'écrasement silencieux. `navigator.locks` en renfort si présent, pas comme seule garantie.

6. **Confirmer qu'une modification est persistée ?** Brouillon : `setItem` sans exception. Séance validée : transaction commitée puis `get` avec révision et valeurs du patch. Ça ne prouve pas un fsync observable, ni le cloud, ni le reste de l'historique.

7. **GTG et pompes plus rapides sans baisser les garanties ?** Oui pour le coût : ne plus parcourir toutes les reps, ne plus remplacer les maps de séance, garder le garde anti-wipe, échouer bruyamment sur timeout. Non pour la fusion de deux listes de séances ajoutées en parallèle : D+ ne le résout pas encore. Ne pas l'annoncer.

8. **XP exacte sans bloquer ?** Appeler le moteur complet après peinture, sur la mémoire, et jeter un résultat dont la révision est dépassée. Raccourci seulement après égalité stricte avec le moteur. Pas de Worker avant mesure.

9. **Pertes qui restent ?** Kill avant la fin du `setItem`. Quota. Effacement des données du site. Deux onglets sur le brouillon `localStorage` (le canonique, lui, est transactionnel). Deux ajouts endurance concurrents. Coupure pendant une transaction non commitée. Profil navigateur détruit sans cloud réussi.

10. **Perte de l'ordinateur ?** Rien dans D+ ne l'assure. Seul un export que l'utilisateur conserve ailleurs, ou un cloud déjà réussi, est un niveau 4. D+ ne crée pas de service. Elle exige de ne pas appeler « sauvé » un simple IndexedDB.

11. **Protections actuelles insuffisantes ?** Brouillon non écrit. Backups séance en `localStorage` non appelés. Backup endurance une seule génération, chemin complet seulement. Relecture = existence. Files qui ne s'excluent pas. Timeout non strict silencieux. Pas de versions de ligne. Pas de test de restauration séance.

12. **Quoi ne pas faire ?** Journal permanent, event sourcing, nouveau store, serveur, CRDT, hash global à chaque frappe, Worker par défaut, version par exercice, autosave qui valide les quêtes, mettre le brouillon dans `workoutSessions` sans l'exclure du merge.

13. **Plus petit ensemble utile ?** (a) échecs disque non silencieux sur GTG/pompes, (b) case et pourcentage sur la mémoire, (c) brouillon `localStorage` coalescé non validant, (d) transaction de patch à la validation, (e) XP complète après peinture. Le reste attend une mesure ou un besoin de niveau 4.

---

## 3. Priorités

P0 perte ou fausse confirmation. P1 cohérence des écritures. P2 réactivité. P3 XP. P4 copies indépendantes.

L'ordre n'est pas P0 puis P4. P2 peut partir tôt parce qu'il ne touche pas au disque. P0 « ne pas dire succès sur un timeout » doit précéder toute optimisation GTG. P4 générations n'est pas un prérequis de la coche.

| Phase | Classe | Préconditions | Périmètre | Rollback |
| --- | --- | --- | --- | --- |
| 0 Mesures | toutes | Aucune | Marques locales, jeux S/M/L. Pas de changement de `saveToDB`. | Retirer le flag |
| 1 Vérité des échecs | P0 | 0 souhaitée, pas bloquante | GTG, pompes, `updateData` non strict : timeout = échec visible. Inventaire des appelants avant de faire throw partout. | Rétablir l'ancien `return` par appelant |
| 2 Écran | P2 | Aucune sur le disque | Case sans `Map` optimiste, pourcentage sur le brouillon mémoire. Tests A/B du document 5 initial. | Revenir aux deps du memo |
| 3 Brouillon durable | P0 | 2, pour ne pas persister une coche fantôme | Brancher `backupSessionDayToLocalStorage` en coalescé. Chargeur au démarrage vers la mémoire, pas vers le merge. Discard et déconnexion effacent la clé. Pas de quêtes. | Cesser d'écrire la clé |
| 4 Validation transactionnelle | P1 | 1 et 3 | Au bouton : get/merge/put, relecture révision + clés, toast après. Une file dans l'onglet, plus de `priority` qui lâche la chaîne. | Revenir au `put` de tranche actuelle. Les lignes déjà écrites restent lisibles si le format id ne change pas |
| 5 GTG sans parcours de reps | P1 | 1 et 4 pour le canonique séance | Transaction endurance + garde. Test : coche validée + GTG + rechargement. | Ancien `updateData` complet |
| 6 XP après peinture | P3 | 2 | Moteur complet, révision. Raccourci plus tard, tests d'égalité. | Rebrancher sur `data` |
| 7 Générations | P4 | export réel identifié | Seulement après avoir relu le geste d'export existant. Deux fichiers minimum, restauration sur fixture, schéma sans `revision`. Pas de réseau nouveau. | Arrêter d'écrire les copies. Ne pas effacer les anciennes |

Dépendances : 4 exige 3 pour ne pas perdre le patch si la transaction échoue. 5 exige 4 pour ne pas réintroduire un `put` de maps de séance. 6 n'exige pas 4 : l'XP d'affichage lit la mémoire. 1 peut être parallèle à 2.

Critère d'arrêt : un test de perte, de doublon, de fausse confirmation ou d'égalité XP rouge. On ne « continue en optimisant ».

Fichiers touchés le moment venu, pas maintenant : `TodayTab.jsx`, `useWorkoutExercises.js`, `useWorkoutData.js`, `workoutPersistence.js` (brancher, pas réécrire le format), `workoutSessionDbGateway.js` (get dans la transaction), `enduranceWipeGuard.js` (appel, pas affaiblissement), `useSportXP.js`. Aucune migration de lignes dans les phases 1–6.

---

## 4. Arbitrages à valider avant le code

1. Accepter que le brouillon durable **ne** valide **pas** les quêtes ni le cloud.
2. Accepter le conflit visible quand deux onglets changent la même clé, plutôt que la dernière écriture.
3. Accepter que deux ajouts endurance simultanés ne sont pas fusionnés dans cette livraison.
4. Accepter `localStorage` comme filet de brouillon (quota, pas une transaction), et IndexedDB comme seul canonique.
5. Reporter le niveau 4 (générations, perte de machine) après les phases 1–6, sauf si vous voulez l'inverse.

Sans un « non » sur ces points, la recommandation est de les tenir.

---

## 5. Premières actions sûres, si vous les autorisez ensuite

Aucune n'est faite dans cette mission.

1. Phase 0, flag dev, aucun changement de persistance.
2. Phase 1, seulement le signalement d'échec, après la liste des appelants de `updateData` non strict.
3. Phase 2, seulement l'écran.

Pas de phase 3 tant que 2 n'a pas montré qu'une coche mémoire tient au premier clic : inutile de rendre durable une coche qui se défait.

---

## 6. Recommandation

Construire **D+**, pas D seule, pas une architecture plus lourde.

D+ est D plus un brouillon de journée hors du store canonique, plus une fusion de clés dans la transaction de validation. Elle est plus fiable que D sur le crash et sur deux coches compatibles. Elle n'est pas plus ambitieuse sur la peinture, et elle ne prétend pas sauver l'historique si le navigateur disparaît.

Le plus petit ensemble est les phases 1, 2, 3, 4 et 6. La 5 suit pour GTG. La 7 est un autre projet.

Momentum devient plus rapide parce que l'écran, le filet disque et la validation cessent de s'attendre pour rien. Il ne devient pas plus rapide en confirmant moins.
