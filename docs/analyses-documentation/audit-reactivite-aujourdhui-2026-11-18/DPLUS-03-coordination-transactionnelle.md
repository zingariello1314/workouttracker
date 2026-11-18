# DPLUS-03 — Coordination transactionnelle et conflits

## 1. Ce qu'une file JavaScript garantit

Une file dans la page sérialise les `saveToDB` qui l'empruntent, dans cet onglet, tant qu'on ne la réinitialise pas.

Elle ne voit pas :

- un autre onglet ;
- un `pagehide` qui écrit à côté ;
- le chemin qui n'entre pas dans la file (`strict && sessionDay` aujourd'hui) ;
- un `priority: true` qui remplace `saveChainRef` par `Promise.resolve()` et laisse l'ancienne écriture continuer.

**Réponse à la question « la file unique de D suffit-elle ? »** Non, pas seule. Elle reste nécessaire **dans** l'onglet pour ne pas empiler des snapshots. L'atomicité entre onglets est une transaction IndexedDB qui relit la ligne **dans** la transaction, applique un patch, et écrit. La file ne remplace pas cette relecture.

Aucun `navigator.locks` dans le dépôt. Pas de `BroadcastChannel`. L'écoute `storage` de l'accueil ne concerne que les réglages de swipe.

## 2. Ce que le navigateur fournit

IndexedDB, pour une origine : une transaction `readwrite` sur un object store bloque les autres `readwrite` sur les stores qu'elle nomme, y compris depuis un autre onglet, jusqu'au commit ou à l'abandon. **Sémantique du standard, non re-testée ici sur deux fenêtres réelles.**

Ça ne protège que le code qui lit et écrit **dans la même transaction**. Le code actuel lit la mémoire React, puis écrit plus tard. Deux onglets partent de deux mémoires anciennes. Chacun écrit sa tranche complète. Le commit le plus tardif remplace le jour. Les tractions de A disparaissent si B n'avait pas les tractions dans son snapshot. La transaction a été correcte ; le snapshot était obsolète.

`navigator.locks` (Chromium, Firefox 96+, Safari 15.4+) peut empêcher deux onglets d'entrer en même temps dans cette section. Ce n'est pas une transaction : si le processus meurt, le verrou tombe et l'écriture non commitée aussi. Utile en plus, pas à la place. Si l'API manque, la transaction seule suffit **à condition** que le merge soit dedans.

Une notification (`BroadcastChannel`, événement `storage`) dit « quelqu'un a écrit ». Elle n'empêche pas deux écritures de se croiser. **Non retenue comme mécanisme d'exclusion.**

## 3. Granularité

| Grain | Effet | Jugement |
| --- | --- | --- |
| Version globale workout | Toute coche sérialise GTG, photos, nutrition embarquée | Trop gros. Reproduit le coût qu'on cherche à quitter. |
| Version par domaine (séance / endurance / GTG) | Une coche n'attend pas une photo. GTG et séance ne s'écrasent pas s'ils n'écrivent pas les mêmes stores. | Bon complément, pas suffisant pour tractions vs dips : les deux sont le domaine séance du même jour. |
| Version par journée | Une ligne `scope:date`. Deux jours ne se bloquent pas. | **Grain retenu** pour la séance. |
| Version par exercice | Beaucoup de compteurs, peu de gain : la ligne du jour est déjà l'unité de `put`. | **Non retenu.** La fusion se fait au niveau des **clés** à l'intérieur de la version du jour. |

Endurance / GTG : version du sous-arbre endurance sur la ligne agrégat, pas la version du jour de séance. Une mini-série ne bumpe pas la version séance, et une coche ne bumpe pas la version GTG.

## 4. Cas obligatoire : deux onglets, tractions et dips

État canonique du jour : aucune des deux coches. Version de ligne `v = 4`.

1. A et B ont lu `v = 4`.
2. A coche les tractions. Son patch = `{ cléTractions: true }`.
3. B coche les dips depuis le même snapshot. Son patch = `{ cléDips: true }`.

Transaction de A :

- `get` de `scope:date` → `v = 4` ;
- les clés du patch ne sont pas en conflit avec la ligne (absentes ou égales) ;
- écrit la ligne avec tractions, `v = 5`.

Transaction de B, après :

- `get` → `v = 5`, tractions présentes ;
- le patch dips ne touche pas la clé tractions ;
- écrit dips **et garde** tractions, `v = 6`.

Les deux survivent. Aucune des deux n'a réécrit la tranche depuis son snapshot initial.

Cas incompatible : A met 10 reps sur les tractions, B met 12, même clé, valeurs différentes, les deux partent de `v = 4`.

- Le premier commit gagne cette clé et passe à `v = 5` (ou on fige les deux si on veut tout signaler : **politique D+**).
- Le second voit `v ≠ 4` et valeur ≠ patch.
- Il n'écrase pas. Il enregistre un conflit `{clé, valeurLocale, valeurDistante, révision}` et laisse la valeur déjà commitée.
- L'UI de B montre le conflit. Elle ne toast pas « enregistré » pour cette clé.

Politique explicite :

- clés disjointes ou même valeur : fusion silencieuse ;
- même clé, valeurs différentes : **pas** de dernière écriture silencieuse ; conflit visible ; la valeur canonique reste celle déjà commitée jusqu'à un choix ;
- décochage contre coche : conflit, pas une fusion.

« Dernière écriture gagnante » reste le comportement **actuel** et celui de D. D+ le retire pour les clés divergentes. Ce n'est pas encore démontré en exécution : c'est le contrat à tester (document DPLUS-05).

## 5. Réessais sans duplication

Le patch est idempotent : réécrire `cléTractions = true` deux fois laisse `true`. On n'ajoute pas une opération « +1 coche ». Un réessai de la même révision, après succès, ne réapplique pas : la ligne a déjà `revisionApplied >= n`.

Le `stale` actuel (révision mémoire) reste pour l'onglet : si l'utilisateur a encore modifié, on n'écrase pas la mémoire avec l'ancien snapshot ; on construit un **nouveau patch** (clés touchées depuis), pas une tranche complète copiée d'une mémoire ancienne.

Écrire la tranche complète depuis la mémoire de l'onglet reviendrait au bug des dips. Le payload en file est un **ensemble de clés**, plus les suppressions explicites. Au moment de la transaction, on relit et on applique cet ensemble. Les clés non touchées par cet onglet restent celles du disque.

## 6. Mutations en attente

Si la transaction échoue (quota, store fermé), le patch reste dans le brouillon durable (DPLUS-02) et dans la file mémoire. Pas de second patch fantôme. L'état est `failed` pour ces clés, pas `confirmed`.

## 7. Verrou et navigateurs

Ordre d'implémentation proposé :

1. Transaction read-modify-write sur `workoutSessions` pour l'id `scope:date`. C'est le mécanisme qui porte la garantie.
2. `navigator.locks.request('momentum:'+scope+':'+date)` autour de cette transaction si l'API existe, pour éviter deux préparations concurrentes. Sinon, la transaction seule.
3. Pas de BroadcastChannel dans le chemin d'écriture. On pourra s'en servir plus tard pour **rafraîchir** l'autre onglet après commit, jamais pour décider qui a le droit d'écrire.

Safari mode privé et Firefox peuvent refuser IndexedDB ou `localStorage`. Déjà des `catch`. D+ doit les traiter comme `failed`, pas comme succès.

## 8. Ce qu'il ne faut pas construire

- Un verrou global de tout le workout.
- Un journal pour « rejouer » tractions et dips : le patch de clés dans la transaction est plus court et suffit à ce cas.
- Une synchronisation serveur pour arbitrer deux onglets locaux. Le cloud n'est pas dans cette décision.
