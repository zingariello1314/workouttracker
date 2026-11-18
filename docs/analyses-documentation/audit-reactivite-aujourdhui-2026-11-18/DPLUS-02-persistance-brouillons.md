# DPLUS-02 — Persistance des brouillons et garanties de durabilité

## 1. Ce que fait le bouton Enregistrer aujourd'hui

Ce n'est pas un simple flush. `handleSaveExercises` (`TodayTab.jsx`) :

1. ignore un second clic si un enregistrement est déjà en cours ;
2. attend deux frames ;
3. peut appliquer un échange de jour de repos (`maybeApplyRestDaySwapBeforeSave`) **avant** l'écriture ;
4. appelle `saveExerciseChanges()` (brouillon → tranche du jour, strict, relecture) ;
5. replie les panneaux de perception ;
6. affiche un toast de succès ;
7. en idle, synchronise les quêtes « liées au sport du jour » (`syncSportLinkedQuestsWithProgramSnapshot`).

Le succès de `persistFullDraft` émet aussi `WORKOUT_UPDATED`, invalide le cache XP et pousse le cloud, dans un autre idle.

Annuler (`discardExerciseChanges` / `clearDraftState`) jette le brouillon mémoire et revient à `data`. Il n'y a rien sur disque à annuler, puisque la coche n'écrit pas.

Changer de date ne flush pas un brouillon sale : le hook ne nettoie que si les flags sont propres. Un brouillon sale survit au changement de date **en mémoire**, pas au crash.

Une séance incomplète enregistrée est une séance enregistrée. Le bouton ne vérifie pas que tout est coché. Il persiste ce qui est dans le brouillon.

Conséquence : **une écriture disque automatique ne doit pas exécuter les étapes 3, 6 et 7, ni `WORKOUT_UPDATED`, ni le push cloud.** Sinon chaque coche valide la séance, coche des quêtes et réplique. Ce serait un changement de règles métier, pas une optimisation.

## 2. Deux contrats

| | Brouillon durable | Séance validée |
| --- | --- | --- |
| Déclencheur | Mutation locale coalescée, et flush de fermeture | Bouton Enregistrer (et seulement lui, plus le swap de repos qui précède ce bouton) |
| Contenu | Tranche du jour + liste des clés touchées depuis la dernière validation | La même tranche, devenue canonique |
| Effets | Aucune quête, aucun toast « séance enregistrée », aucun cloud, aucun `WORKOUT_UPDATED` | Quêtes, toast, cloud, événement sidebar, XP sur données confirmées |
| Annulation | Efface le brouillon durable et revient au canonique | N'existe pas après succès : il faut une nouvelle modification |
| Rechargement | Proposé comme travail non validé, pas fusionné dans le jour canonique | `mergeSessionDaysIntoAggregate` remplace le jour |

Le toast actuel « exercices enregistrés » vise le second contrat. Le garder pour le premier serait une fausse confirmation (I2).

## 3. Stratégies comparées

### A — Écriture immédiate à chaque mutation

Chaque frappe de reps ouvre IndexedDB. Latence du clic : bonne si l'écriture est asynchrone et que l'écran n'attend pas. Nombre d'écritures : mauvais (poids, reps). Crash : bon dès que la transaction a commité. Conflits : autant que d'écritures. Récupération : simple si c'est le canonique, **dangereux** si le loader traite toute ligne `scope:date` comme validée (`buildWorkoutSessionId`).

**Non retenue** comme rythme. Une frappe n'est pas une coche.

### B — Coalescence courte, avec borne

Regrouper les mutations ~200–400 ms, flush immédiat sur coche (pas sur chaque chiffre), sur le bouton, et sur `pagehide`. L'écran n'attend pas. Une coche n'est pas retardée « indéfiniment » : elle entre dans le lot en cours, qui part sans attendre d'autres chiffres.

**Retenue comme rythme**, pas comme lieu de stockage à elle seule.

### C — Stockage de brouillon séparé, puis promotion à la validation

Le canonique (`workoutSessions`, id `scopeKey:dateStr`) ne change qu'au bouton. Le brouillon vit ailleurs. Au chargement, s'il existe, il redevient `local` non confirmé. Annuler le supprime.

**Retenue comme lieu.** Raison : `mergeSessionDaysIntoAggregate` remplace tout le jour de chaque ligne qui a un `dateStr`. Une ligne brouillon avec le même id ou le même `dateStr` **deviendrait** la séance validée au prochain chargement. Ce serait une validation silencieuse. **Démontré** par `sessionRowDate` + `replaceDayKeys`.

Lieu concret le plus simple : `localStorage`, clé `workoutSession_backup_${scope}_${date}`, fonction **déjà écrite** (`backupSessionDayToLocalStorage`) et **jamais appelée**. Charge = une tranche de jour, pas l'historique. `setItem` est synchrone : sur `pagehide`, il a plus de chances d'aboutir qu'une transaction IndexedDB encore en vol. Ce n'est pas une garantie. Quota : le `catch` existe déjà ; l'état doit rester « non persisté », pas « sauvé ».

Variante IDB `scope:draft:date` : plus homogène, mais seulement si `getAllWorkoutSessionsForScope` **ignore** ces ids. Sinon C se ramène à une validation accidentelle. Pas de nouveau store : soit `localStorage`, soit le store actuel avec filtre explicite. Le filtre est un risque de régression plus haut que `localStorage` pour une tranche. **D+ retient `localStorage` pour le brouillon, IndexedDB pour le canonique.**

### D — Écriture incrémentale canonique avec statut `draft|validated`

Un champ sur la ligne `scope:date`. Au chargement, le jour draft remplacerait quand même les clés (le merge ne lit pas un statut aujourd'hui). Il faudrait enseigner ce statut au merge, aux exports et aux tests de restauration. Toute omission affiche un brouillon comme historique définitif.

**Écartée** comme premier pas. Le statut est une bonne idée **après** que tous les lecteurs le connaissent. C n'exige pas de les modifier.

### E — Journal de mutations puis compaction

Utile si on doit rejouer des opérations plus fines qu'une tranche, ou fusionner sans relire la ligne. Une tranche de jour plus la liste des clés touchées tient dans l'enregistrement C. Le journal ajoute un format, un compactage, et un risque de double application. Il ne survit pas mieux à `pagehide` si lui aussi est une transaction IndexedDB non terminée.

**Écarté.** Pas de garantie concrète au-dessus de C + coalescence B.

## 4. Contrat de durabilité (navigateur)

| Moment | Nom | Preuve | Ce que ça ne prouve pas |
| --- | --- | --- | --- |
| Clic peint | Visible | Frame affichée | Rien sur le disque |
| Patch du ref | Accepté en brouillon mémoire | `dirtyFlagsRef` | Survit au crash : non |
| Lot en file | En attente | Révision locale > dernière persistée | Le lot peut mourir avec l'onglet |
| `setItem` du brouillon revenu, ou transaction IDB `complete` | Persisté localement | Callback / absence d'exception quota | Pas la validation métier. Pas le cloud. `setItem` peut échouer au quota. IndexedDB `complete` = commit du moteur de stockage du navigateur, pas un fsync que l'application peut voir. Coupure d'alimentation **après** commit : en général tenu par le moteur ; **pendant** la transaction : rollback. Ceci est la sémantique documentée d'IndexedDB, **non re-testée ici sur une coupure réelle**. |
| Bouton, relecture d'existence OK | Validé fonctionnellement | Toast seulement ici | Le cloud. L'égalité de tous les champs, tant que la relecture ne compare pas le contenu. |
| Push cloud OK | Répliqué | Réponse succès du chemin déjà existant | Les générations locales. Un appareil perdu sans ce push, ou avec un push d'un snapshot incomplet, n'est pas couvert. |

Risque résiduel explicite : fermeture ou crash **avant** le retour de `setItem` / `complete`. La modification était visible et n'est pas durable. L'UI de ce laps est « en attente », jamais « enregistré ».

`pagehide` appelle `setItem` du dernier lot. S'il est tué avant, même règle. Un kill sans `pagehide` ne passe pas par là : d'où la coalescence courte **pendant** la vie de la page, pas seulement à la fermeture.

## 5. Effets de bord à ne pas déplacer

| Effet | Reste sur |
| --- | --- |
| Swap de jour de repos | Bouton Enregistrer |
| Sync quêtes sport | Bouton, idle actuel |
| `WORKOUT_UPDATED` / sidebar | Bouton |
| Push cloud | Après validation locale |
| Toast de séance | Après relecture canonique |
| Invalidation XP « données confirmées » | Bouton |
| XP d'affichage sur le brouillon | Affichage seul, document DPLUS-04 |

Discard : supprimer la clé `localStorage` du jour et les flags mémoire. Ne pas écrire une tranche vide dans le canonique (ça effacerait la dernière séance validée).

Changement de date : le brouillon durable est **par date**. On n'écrit pas le brouillon du lundi sur la clé du mardi.

Séance déjà validée puis modifiée : nouveau brouillon par-dessus. Le canonique reste l'ancienne validation jusqu'au prochain bouton. Au rechargement, on montre le brouillon s'il est plus récent, sans écraser le canonique tant que l'utilisateur n'a pas validé ou annulé.

## 6. Tests de pertinence

- Coche, kill du processus **simulé** par « ne pas appeler Enregistrer, relire la clé localStorage » : la clé contient la coche, le store `workoutSessions` non. Ce n'est pas une preuve de coupure d'alimentation.
- Enregistrer ensuite : la ligne canonique a la coche, la clé brouillon est supprimée, une quête liée ne part pas avant ce moment (espion sur `syncSportLinkedQuestsWithProgramSnapshot`).
- Annuler : clé supprimée, canonique inchangé.
- Quota `setItem` qui jette : état « non persisté », pas de toast.
- Rechargement : le merge canonique ne voit pas la clé localStorage. Un chargeur **dédié** restaure le brouillon en mémoire.

## 7. Décision

Rythme B, lieu C, support `localStorage` de la tranche du jour, promotion seulement au bouton. Pas A, pas D au premier pas, pas E.
