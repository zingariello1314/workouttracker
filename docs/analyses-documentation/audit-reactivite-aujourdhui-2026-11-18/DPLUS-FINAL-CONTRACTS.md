# Contrats finaux — brouillons, effets, identifiants

18 novembre 2026. Ces contrats remplacent, pour la suite, les points correspondants de `DPLUS-IMPLEMENTATION-READY.md`. Ils ne sont pas encore dans le code de production.

---

## Brouillon

Un brouillon n’est pas une séance. L’écrire ne lance ni swap de repos, ni quête, ni toast de séance, ni `WORKOUT_UPDATED`, ni cloud.

Clé : `scope` + identifiant de brouillon. Jamais une clé unique par profil et par date.

Le brouillon reste jusqu’à l’un de ces quatre faits :

- validation intégrale de ses clés, génération confirmée ;
- annulation explicite par l’utilisateur ;
- fusion confirmée dans le canonique, les clés restantes étant vides ;
- copie strictement identique à un autre brouillon du même profil, même date, même patch, même base.

L’âge ne supprime rien. 14 jours et 48 heures sont retirés du plan. Un brouillon illisible reste en quarantaine, listé, jamais effacé automatiquement.

---

## Instance

L’identifiant d’écriture naît en mémoire avec `crypto.randomUUID()` à la création de la vue. Il n’est pas lu depuis `sessionStorage`.

`sessionStorage` et `BroadcastChannel` ne décident pas de la clé. Un onglet dupliqué reçoit un nouvel identifiant mémoire. Il ne reprend pas la clé de l’autre vue. Les deux peuvent afficher le même brouillon en lecture. Une seule vue le tient en écriture. L’autre le voit verrouillé, ou crée un brouillon distinct si l’utilisateur modifie.

`BroadcastChannel`, s’il existe, annonce seulement « cette clé est ouverte ». S’il manque, la règle mémoire reste : pas de reprise silencieuse d’une clé étrangère.

| Situation | Comportement |
| --- | --- |
| Onglet ouvert | Nouvel id mémoire. Les brouillons du profil sont listés, aucun n’est validé. |
| Onglet dupliqué | Nouvel id. Pas d’écriture sur la clé de l’original. |
| Rechargement | Nouvel id. Le brouillon persisté est proposé, pas promu. |
| Restauration de session | Même règle que le rechargement. |
| Deux onglets | Deux ids. Deux clés si les deux écrivent. |
| Sans `BroadcastChannel` | Pas de fusion silencieuse. L’écriture exige une clé que cette vue a créée ou qu’elle a explicitement reprise. |
| Crash | Le brouillon déjà écrit reste. Le canonique ne change pas. |
| Changement de profil | La liste filtrée par `scope`. Aucune clé d’un autre scope n’est lue ni fusionnée. |

---

## Logout

Le logout ne supprime pas les brouillons. Il cesse de les afficher parce que le scope n’est plus la session active. Au retour du même profil, ils sont de nouveau listés. Un autre profil ne les voit pas.

---

## Rollback

Désactiver C2.3 ou C2.6 arrête la lecture et l’écriture par le mécanisme nouveau. Les clés `workoutDraft_` et le store `workoutDrafts` restent. Un export local de ces enregistrements doit exister avant toute suppression manuelle. La suppression des clés n’est pas un rollback.

---

## Conflit et confirmation

Inchangés dans leur logique, déjà exécutés en mémoire et en fake-indexeddb sur un harness : trois versions, tombeau `{ deleted: true }`, groupe exercice, génération N qui ne retire pas N+1.

Succès : commit, relecture, révision, champs du patch égaux. Échec : abort ou exception, brouillon conservé. Indéterminé : timeout ou lecture impossible, pas de toast, pas de nouvel identifiant, relecture avant rejeu.

Un commit IndexedDB n’est pas une garantie contre la panne du disque.

---

## Effets métier

Ordre inchangé. Le swap de repos reste une écriture antérieure à la séance. S’il est commis et que la séance échoue, l’échec de séance est affiché. Pas d’annulation automatique du swap : ce serait une règle nouvelle.

La séance et le suivi des effets qui en dépendent s’écrivent dans la **même** transaction : la ligne de journée, et un enregistrement `effectsPending` pour cette révision (`quests`, et séparément `cloud`). Coût : un petit enregistrement, pas un journal.

À l’ouverture du profil, si `effectsPending.quests` est posé pour une révision canonique, la synchro de quêtes existante est appelée une fois. Elle ne regarde pas les brouillons. Si elle aboutit, le drapeau est retiré dans une transaction suivante. Si le processus meurt avant le retrait, le chargement suivant recommence. L’idempotence actuelle (« déjà conforme, ne pas rebasculer ») est la condition. T11 doit la verrouiller avant activation. Tant qu’il n’est pas vert, ce rattrapage n’est qu’un contrat.

| Scénario | Contrat |
| --- | --- |
| Séance commise, crash avant les quêtes | Le drapeau reste. Le chargement rattrape. Pas de double crédit si l’idempotence tient. |
| Quête créditée, crash avant le retrait du drapeau | Le chargement rappelle la synchro. Pas de second crédit si l’état est déjà conforme. |
| Timeout | Indéterminé. Pas de drapeau nouveau tant que la relecture n’a pas prouvé la révision. |
| Cloud indisponible | Le drapeau cloud reste. La séance locale confirmée reste. Pas de retour arrière. |
| Modification N+1 pendant les effets de N | N+1 ne relance pas le swap ni la quête de N. |
| Swap commis, séance échouée | Pas de quête. L’échec de séance est visible. Le swap déjà commis le reste. |

Le brouillon automatique n’écrit pas `effectsPending`.

---

## GTG et pompes

`legacy_${type}_${date}_${index}` est rejeté : l’index change si la liste est réordonnée.

Migration, seulement après autorisation, une fois, idempotente :

- une entrée qui a déjà un `id` le garde ;
- une entrée sans `id` reçoit un id dérivé du corps canonique (date, heure, répétitions, distance, type), plus un rang parmi les corps identiques **au moment de cette écriture** ;
- l’id est persisté dans l’entrée ;
- un second passage ne régénère rien ;
- aucune entrée n’est supprimée pour fabriquer l’id.

Limite : deux appareils qui migrent séparément la même sauvegarde encore sans id peuvent numéroter différemment deux corps identiques. Après la migration, l’id stocké fait foi. Une sauvegarde d’avant migration reste lisible : au chargement elle n’est pas réécrite tant que la migration n’est pas autorisée.

Réessai après timeout : même objet, même id, pas de `Math.random()` ni de `Date.now()`. Deux ajouts d’ids distincts : union. Même id, corps différent : conflit, pas d’écrasement. Suppression concurrente : tombeau sur cet id, conflit si l’autre onglet a modifié le même id.

Tant que l’id n’est pas là, deux ajouts concurrents sont refusés ou différés. Pas d’écrasement silencieux.

Fait mesuré sur le garde-fou actuel : `ENDURANCE_ACTIVITY_TYPES` contient `pushups`, pas `gtg`. Une liste `gtg` vide entrante remplace la liste précédente. Une liste `pushups` vide ne le fait pas. Le test `integration-idb.test.js` montre les deux. Protéger `gtg` est un changement de comportement à autoriser avec C2.5, pas une ligne à glisser sans test.

---

## Copie et navigateur

| Niveau | Survit à |
| --- | --- |
| Brouillon dans le profil | Un rechargement. Pas à l’effacement du profil. |
| Séance canonique dans le profil | Un rechargement. Pas à l’effacement du profil. |
| Copie locale dans le même profil | Le même effacement emporte la copie. |
| Export versionné vers un fichier | L’effacement du profil, si le fichier est ailleurs sur le disque. |
| Copie hors du disque de la machine | La perte de l’ordinateur. |
| Restauration vérifiée | Seulement un essai réel sur base de test, somme de contrôle, fichier corrompu refusé. |

B1 à B4 restent les jalons de ce dernier niveau. Aucun export personnel n’est lancé par les tests de cette mission.
