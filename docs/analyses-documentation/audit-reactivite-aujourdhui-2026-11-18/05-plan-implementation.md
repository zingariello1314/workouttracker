# Document 5 — Plan d’implémentation progressif

Aucune phase ne part sans accord explicite. Chaque phase est annulable sans réécrire les données déjà stockées.
Les tests cités sont à écrire dans la phase ; ils n’existent pas encore, sauf mention.

Mesures : protocole du document 2. Tant que la phase 0 n’a pas de chiffres, on ne supprime pas d’étape disque « parce que c’est lent ».

---

## Phase 0 — Mesurer sans changer le contrat

**Objectif.** Obtenir médiane / P95 sur les jeux S, M, L pour les marques du document 2. Confirmer ou écarter H1–H8.

**Fichiers.** Ajout d’un module de marques derrière un flag dev, branché aux points listés. Aucun changement de `saveToDB`, de la relecture, ni des formules.

**Risques.** Un log qui imprime le payload. Parade : revue du module, test qui échoue si une marque reçoit un objet workout.

**Tests.** Le flag off laisse les fonctions actuelles strictement inchangées (test de non-appel).

**Acceptation.** Un tableau S/M/L remplit le document 2 section 4.5. Les observations 4–5 s et 3–4 s sont soit reproduites, soit corrigées comme impressions.

**Rollback.** Retirer le flag et le module. Aucune donnée.

---

## Phase 1 — Case et pourcentage sur le brouillon (architecture A, écran seulement)

**Objectif.** Un clic met la case et le pourcentage d’accord avec le brouillon, sans attendre IndexedDB. Le pipeline disque reste celui d’aujourd’hui.

**Fichiers envisagés.**

- `src/components/tabs/TodayTab.jsx` — retirer la `Map` optimiste et le frame d’annulation ; le score lit `getCurrentData()` avec une dépendance sur la version de brouillon (y compris la coche par exercice).
- `src/context/WorkoutContext/hooks/useWorkoutExercises.js` — la coche avec `exerciseId` doit aussi réveiller les lecteurs du score (bump ciblé ou version de jour), sans persister.
- `src/context/WorkoutContext/sessionDraftStore.js` — seulement si un canal manque. Pas de nouveau stockage.

**Garanties touchées.** Aucune écriture. I1–I6 inchangés. I2 s’améliore pour la case (elle n’affirme plus un état que le brouillon n’a pas).

**Risques.** Double rendu, ou pourcentage qui lit un brouillon sans flag sale et affiche un fantôme. Le garde actuel de `getWorkoutDataForSession` doit rester.

**Tests.**

- A : un appel de patch = une clé cochée dans le brouillon.
- B : deux clics rapides sur deux exercices = les deux clés.
- B2 : deux clics sur la même case = décoché.
- Le bouton Enregistrer et `persistWorkoutSessionDay` ne sont pas appelés par le clic (espion).

**Acceptation.** Sur le jeu M, `click → draft` et `click → pct` sous un budget fixé **après** la phase 0 (par exemple P95 du clic à la peinture du pourcentage, sans disque). Pas de budget inventé ici.

**Rollback.** Revenir aux dépendances du memo et à la coche optimiste. Le disque n’a pas changé.

---

## Phase 2 — XP hors du chemin de la case, moteur inchangé

**Objectif.** La barre suit `local` / brouillon via `calculateSportXP` complet, après peinture, sans attendre Enregistrer ni l’idle 800 ms. Les grades suivent ce résultat complet, pas un delta.

**Fichiers.** `useSportXP.js`, `useSportGrade.js`, appelants de `invalidateSportXpCache` sur la séance. Le cache anti-flash à 0 reste.

**Garanties.** Exactitude = celle du moteur sur le snapshot passé. Pas de nouvelle formule.

**Risques.** Calcul complet sur le thread principal à chaque coche, historique L. La phase 0 dit si c’est acceptable. Si P95 `xp-calc` sur L dépasse le budget fixé après mesure, on n’enchaîne pas les classes 1–2 tant que les tests d’égalité ne sont pas là ; on garde le calcul après peinture quand même, parce qu’il reste exact et qu’il n’attend plus le disque.

**Tests.** Test I : pour une liste de fixtures synthétiques (coche, décochage, étirement noté, GTG, pompe, journée qui franchit 80 % puis 100 %), le total après modification égale `calculateSportXP` sur le snapshot. Ce test verrouille le moteur ; il ne le raccourcit pas.

**Acceptation.** `click → xp-published` ne contient plus `idb-put`. Les totaux des fixtures sont identiques au moteur.

**Rollback.** Rebrancher l’XP sur `data` seul. Aucune donnée.

---

## Phase 3 — États confirmé / en vol / échec, même format disque

**Objectif.** Le toast séance ne part qu’après relecture d’existence réussie de **cette** révision. Un timeout non strict ne peut plus ressembler à un succès pour GTG et pompes. Le brouillon n’est plus jeté si la relecture échoue (déjà vrai pour la séance ; à étendre aux domaines qui font `setData` avant l’await).

**Fichiers.** `useWorkoutData.js` (`updateData`, `saveToDB`), `useWorkoutExercises.js`, panneaux GTG et pompes, toasts Aujourd’hui.

**Garanties touchées.** I2 et I1. On ne retire pas `failOnTimeout` du chemin strict. On aligne les autres domaines sur le throw, ou sur un résultat `{ok:false}` explicite. Interdit : avaler `IDB_OPERATION_TIMEOUT` puis afficher un succès.

**Risques.** Un `updateData` lointain comptait sur l’erreur avalée. Inventaire des appelants avant de faire throw partout. Les appelants non Aujourd’hui peuvent garder l’ancien comportement le temps d’une adaptation, mais pas en prétendant que c’est enregistré.

**Tests.** D, E, F, L.

- D : rejet simulé du put → pas d’état confirmé, modification toujours dans `local`.
- E : après succès simulé, rechargement logique (`mergeSessionDaysIntoAggregate`) retrouve la clé.
- F : échec avant relecture → aucun indicateur confirmé.
- L : push cloud rejeté → confirmé local vrai, drapeau cloud faux.

**Acceptation.** Les tests passent. Le chemin séance écrit toujours `workoutSessions` avec la même forme de slice (snapshot de test d’égalité de forme, pas seulement de succès).

**Rollback.** Rétablir `return` sur timeout non strict uniquement si un appelant hors Aujourd’hui casse, et seulement pour cet appelant. Pas de rollback des données : le format n’a pas changé.

---

## Phase 4 — Une file, écritures par domaine

**Objectif.** Séance, GTG et pompes entrent dans une seule file. GTG n’exécute plus le grand nettoyage de toutes les maps de reps. La séance incrémentale n’est plus hors de la file.

**Fichiers.** `useWorkoutData.js`, `workoutDbGateway.js` (seulement si un put endurance dédié existe déjà ; sinon un put de la ligne endurance qui **relit** la ligne courante et ne remplace pas les maps de séance par un snapshot périmé — à concevoir sur le code réel du repository avant d’écrire). Panneaux GTG et pompes. `enduranceWipeGuard.js` inchangé dans son contrat, appelé sur la fusion.

**Garanties.** I3 dans un onglet, I4, I5. I10 : pas de nouveau store. Si le put endurance doit réécrire la ligne `workouts`, il doit repartir de la ligne lue dans la même transaction, pas d’un objet React éventuellement ancien, et ne pas toucher aux clés de jours couvertes par `workoutSessions` … ou accepter que le chargement les remplace. La seconde option est déjà le comportement de fusion ; il faut un test G qui l’exerce : séance confirmée + GTG ensuite + rechargement = les deux présents.

**Risques.** Contournement du garde wipe. Transaction trop large qui ramène le coût de la ligne entière. La phase 0 sur le jeu M sert de comparaison.

**Tests.** C, G, H, J.

- C : modification après le gel de `inflight` présente dans le second payload, absente du premier, présente à la fin.
- G : comme ci-dessus.
- H : jeu L, aucune clé d’un autre jour modifié (comparaison des maps hors date).
- J : export / restauration existants relisent la séance. S’appuyer sur les tests déjà présents (`workoutSessionPersistence.test.js`, `enduranceWipeGuard.test.js`) et les étendre, pas les remplacer.

**Acceptation.** Test G vert. P95 d’une mini-série GTG sur M inférieure à la P95 de la phase 0, sans baisse du nombre de champs relus par le garde.

**Rollback.** Rebrancher GTG sur `updateData` complet. Les lignes déjà écrites restent lisibles par le chargement actuel.

---

## Phase 5 — Flush de fermeture du local non confirmé

**Objectif.** `pagehide` envoie `local` s’il est en avance sur `confirmed`, par la même file et la même tranche.

**Fichiers.** Branchement `pagehide` dans `useWorkoutData.js`, et le module d’état de la phase 3.

**Garanties.** I7 amélioré, pas rendu absolu. Le texte d’aide ou le commentaire d’état doit dire qu’une fermeture brutale peut couper le put.

**Risques.** Double écriture avec un `inflight` déjà parti. La file doit refuser un second put de la même révision et accepter une révision supérieure.

**Tests.** F étendu : simuler un flush qui échoue → pas confirmé. Simuler un flush qui réussit → rechargement OK.

**Acceptation.** Plus aucun flush qui n’envoie que `dataRef` quand `local` est plus récent.

**Rollback.** Rétablir l’ancien flush. Les séances déjà écrites restent valides.

---

## Phase 6 — Classes XP 1 et 2, seulement si les tests d’égalité sont verts

**Objectif.** Raccourcir `xp-calc` sans changer un seul total de fixture.

**Fichiers.** Nouveau module à côté de `xpCalculations.js`, qui n’est pas importé par l’UI tant qu’un test ne compare pas, fixture par fixture, delta et moteur.

**Garanties.** Si une fixture diverge, le terme reste en classe 3. Le complet reste programmé et, en dev, incrémente `xp-divergence` sans données personnelles.

**Risques.** Oublier le plafond de volume ou le bonus 80/100. C’est exactement le test.

**Tests.** I étendu : historique L synthétique, une modification, égalité stricte des totaux et des postes du breakdown concernés.

**Acceptation.** Aucun poste publié par delta sans test vert. Grades toujours sur le total complet tant qu’ils ne sont pas classés.

**Rollback.** Ne plus importer le module delta. L’UI reste en phase 2.

---

## Phase 7 — Champs manquants de la tranche, et seulement ensuite deux onglets

**Objectif champs.** Trancher H8 (`exerciseMarkedWeighted`, `exerciseDisplayNames`) : soit ils entrent dans la tranche avec lecture compatible des vieilles lignes (repli sur l’agrégat si le champ est absent de la ligne séance), soit un test prouve qu’ils survivent déjà via la ligne `workouts`. Pas de migration qui efface l’agrégat.

**Objectif onglets.** Hors livraison tant qu’un protocole n’est pas choisi (comparer `lastSaved` ou une révision au focus de l’onglet, recharger la tranche, ne pas écraser un `local_ahead` sans demander). **Non inclus dans le périmètre validable aujourd’hui.**

**Rollback champs.** Ignorer le nouveau champ de tranche et relire l’agrégat. Prévoir ce repli dans le code de lecture avant d’écrire le champ.

---

## Ordre et critères pour s’arrêter

0 → 1 → 2 → 3 → 4 → 5. La 6 seulement si la 2 est trop lente sur le jeu L **et** que les tests d’égalité passent. La 7 champs peut monter juste après la 4 si H8 est confirmé, parce que c’est de l’intégrité, pas de la vitesse.

On n’enchaîne pas une phase dont les tests listés sont rouges. On n’élargit pas une phase « tant qu’à faire » vers le cloud, les quêtes ou Garmin.

Critère global de réussite, une fois 1–5 vertes et mesurées :

- la case suit le premier clic sur les scénarios A et B ;
- le pourcentage suit le brouillon sans marque `idb-put` entre les deux ;
- l’XP publiée égale le moteur sur les fixtures ;
- GTG ne re-assainit pas les maps de séance (test ou compteur de clés parcourues) ;
- le succès UI n’arrive qu’après relecture locale ;
- un échec disque laisse la modification en place et ne dit pas enregistré ;
- un rechargement après succès retrouve les jeux de tests A, G et J ;
- les P95 sont ceux du tableau de la phase 0 comparé au tableau final, pas ceux de l’impression initiale.
