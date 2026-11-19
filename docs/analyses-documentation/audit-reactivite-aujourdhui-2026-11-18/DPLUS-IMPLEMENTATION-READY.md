# D+ corrigée — prête à implémenter

18 novembre 2026. Ce document remplace, pour l’implémentation, le brouillon partagé de DPLUS-02 et l’effacement de brouillon de DPLUS-04. Il ne migre rien. Le pipeline de production reste celui d’aujourd’hui jusqu’à une autorisation explicite par étape.

La D+ publiée n’est pas assez sûre pour être codée telle quelle. La D+ corrigée ci-dessous l’est, à condition de respecter les gates. La première modification de production recommandée n’est pas le brouillon : c’est le signalement visible des échecs déjà possibles.

---

## Décision

1. On peut préparer tout de suite la catégorie 1 (tests, mesures, sonde non branchée). C’est fait en partie.
2. On n’écrit pas dans `workoutSessions` avec la nouvelle politique tant que les tests T2–T8 et T14 ne sont pas verts sur un gateway de test.
3. Le store `workoutDrafts` et la pose d’ids sur les anciennes séances d’endurance sont des changements de données. Ils attendent une autorisation séparée.
4. Le bouton Enregistrer garde son rôle : swap de repos, sauvegarde de séance, quêtes, toast, `WORKOUT_UPDATED`, cloud. Le brouillon automatique ne les déclenche pas.

---

## Modèle d’état

Une édition de journée porte :

| Champ | Rôle |
| --- | --- |
| `scope`, `date` | Profil et jour. Le brouillon du lundi n’est jamais écrit sur la clé du mardi. |
| `instanceId` | Une vue. Pas partagé entre onglets après le contrôle de duplication. |
| `baseRevision` | Révision canonique lue au début de l’édition. Absente = 0. |
| `baseKeys` | Valeurs canoniques des clés que l’utilisateur a touchées depuis. |
| `patch` | Clés touchées seulement. Valeur, ou `{ deleted: true }`. |
| `generation` | Entier, +1 à chaque modification utilisateur. |
| `inflight` | `{ generation, patch, baseRevision, date }` figé au début d’Enregistrer, ou null. |

L’écran lit le brouillon mémoire pour la coche, le pourcentage et l’XP affichée. Le canonique reste la source des quêtes, du cloud et de l’XP « officielle ».

---

## Contrats de sauvegarde

| Niveau | Preuve exigée avant de le nommer |
| --- | --- |
| 1. Visible | Rendu React de la valeur |
| 2. Mémoire | Ref du brouillon |
| 3. En attente | Écriture lancée, pas encore revenue |
| 4. Brouillon persisté | Écriture revenue et relecture de la même clé |
| 5. Validation en cours | Transaction ouverte sur la génération figée |
| 6. Canonique confirmé | Commit, relecture, révision et champs du patch égaux, pas de baisse du nombre de clés sans tombeau |
| 7. Cloud confirmé | Réponse réussie. Un échec ici ne défait pas le niveau 6 |
| 8. Copie indépendante | Chantier B. Absent pour la séance aujourd’hui |

Timeout = indéterminé, jamais succès, jamais échec confirmé. Relecture avant rejeu. Succès IndexedDB ≠ survie à une panne disque ou à l’effacement du profil.

---

## Stratégie de brouillon

Cible : store `workoutDrafts`, clé `${scope}:${instanceId}:${date}`. Hors du parcours qui promeut `workoutSessions`. À n’ouvrir qu’avec autorisation de schéma.

Pont immédiat, réversible, sans toucher au canonique : une clé `localStorage` par instance. Échec de `setItem` affiché, rien n’est appelé durable. Pas de clé partagée par profil et date.

`crypto.randomUUID()` en mémoire et dans `sessionStorage`. Au démarrage, `BroadcastChannel` : si un pair a le même id (onglet dupliqué), mint un nouvel id et conserver l’ancien enregistrement. Sans `BroadcastChannel`, un id dupliqué n’écrit pas.

Coalescence 200–400 ms pour la frappe. Une coche est écrite tout de suite. `pagehide` écrit le brouillon, il ne promeut pas le canonique.

Annulation : supprimer la clé de brouillon. Ne pas écrire une journée vide dans le canonique.

Nettoyage : brouillon de plus de 14 jours, ou séance passée depuis 48 h et non ouverte, supprimé au chargement. Jamais `workoutSessions`.

Au logout : supprimer les clés de brouillon de ce profil. Le cloud n’est pas appelé.

---

## Fusion, révisions, transaction

`mergePatch` (`scripts/dplus/threeWayMerge.mjs`) est la spécification. Base = snapshot du début d’édition. Local = patch. Distant = ligne lue dans la transaction.

- Clés indépendantes : union.
- Même valeur des deux côtés : une écriture, pas un doublon.
- Valeurs différentes sur la même clé, ou suppression contre modification : conflit. Le canonique déjà présent reste. Le brouillon local reste. Pas de toast.
- Objet imbriqué : la clé entière. Pas de fusion champ par champ.
- Groupe exercice : si une clé du groupe est en conflit, aucune clé du groupe n’est écrite.
- Ligne absente et base vide : le patch crée la révision 1.
- Ligne apparue depuis une base vide : même algorithme à trois versions.

Transaction : lire, fusionner, écrire, relire. Pas de réseau, pas de dialogue, pas de minuteur à l’intérieur.

Succès de la génération G :

- génération courante encore G → supprimer le brouillon ;
- génération supérieure → le garder, retirer les clés déjà égales au canonique, poser la nouvelle base sur la ligne confirmée.

Un clic Enregistrer pendant une écriture arme une suite. Il ne lance pas une seconde transaction ni un second swap.

---

## GTG et pompes

`mergeEntriesById`, puis `mergeEnduranceWithoutSilentWipe` sur le résultat. Ids disjoints : union. Même id, même corps : no-op. Même id, corps différent : conflit, pas de toast. Réessai : réutiliser l’id déjà en mémoire. Ne plus appeler `newAdHocId` ni `Date.now()` pour un rejeu.

Listes anciennes sans id : tant que la migration n’est pas autorisée, un second onglet refuse l’ajout concurrent au lieu d’écraser. La pose d’ids `legacy_${type}_${date}_${index}` est une migration séparée, une seule fois, sans régénérer un id déjà posé.

---

## Effets métier

Ordre inchangé, après succès confirmé seulement, une fois par révision :

1. Swap de repos, avant la séance, comme aujourd’hui. S’il est commis et que la séance échoue, l’échec de séance est affiché. Pas de rollback automatique du swap.
2. Écriture de séance.
3. Toast, quêtes, invalidation XP, `WORKOUT_UPDATED`, cloud.

`effectsEmittedForRevision` empêche un second toast et un second push quand la relecture prouve que la révision est déjà écrite. La synchro de quête existante reste la même fonction. Une coche arrivée pendant les quêtes est N+1 : elle ne relance pas le swap.

Crash après la séance et avant les quêtes : séance vraie, quête en retard, rattrapée au prochain Enregistrer, sans double récompense si l’idempotence actuelle tient. T11 doit le verrouiller.

---

## Compatibilité

Lignes sans `revision` : traiter comme 0. Ne pas réécrire l’historique juste pour ajouter le champ. Le champ est posé sur la journée écrite par un Enregistrer nouveau.

`exerciseMarkedWeighted` et `exerciseDisplayNames` restent dans le brouillon. Leur absence du slice incrémental actuel est le point H8, toujours non testé sur données réelles. Le patch de validation devra les inclure dans la ligne de journée avant qu’on coupe l’écriture agrégée, sinon un rechargement incrémental les perd. Cette inclusion est un changement de contenu de ligne : elle fait partie de l’étape transactionnelle, pas du pont brouillon.

---

## Séquence

### Catégorie 1 — maintenant, sans changer la persistance de production

Déjà posé :

- `scripts/dplus/phase0-isolated.mjs`
- `scripts/dplus/threeWayMerge.mjs` et son test vitest
- `scripts/dplus/phase0-xp-engine.test.js` et `phase0-xp-results.json`
- `scripts/dplus/dplusPhase0Probe.js`, importé par personne

Encore à préparer, toujours sans brancher l’écran :

- tests fake-indexeddb T5–T8, T11–T14 sur une copie du gateway, pas sur la base du profil ;
- inventaire des appelants de `updateData` non strict, avant de changer leur contrat d’erreur.

### Catégorie 2 — après validation explicite, une étape à la fois

Chaque étape a un interrupteur par défaut éteint. Rollback = éteindre l’interrupteur. Pas de migration irréversible dans cette catégorie, sauf mention.

| Étape | Changement | Gate | Rollback |
| --- | --- | --- | --- |
| C2.1 | Timeout non strict : ne plus retourner comme un succès. Afficher l’échec ou l’indetermine. | Inventaire des appelants relu. Tests T7 T8 sur le nouveau contrat. | Revenir à l’ancien retour. |
| C2.2 | Coche, pourcentage et XP d’affichage lisent la mémoire. XP = `calculateSportXP` complet après peinture, résultat jeté si la génération a changé. | T16 : égalité stricte avec l’oracle sur les fixtures existantes. | Revenir à `data`. |
| C2.3 | Pont brouillon par instance. Pas de quêtes, pas de toast de séance, pas de cloud. | T1 T12 T13. | Supprimer les clés `workoutDraft_`. |
| C2.4 | Enregistrer : transaction à trois versions et générations. | T2 T3 T4 T5 T6 T14. | Revenir au `put` de journée actuelle. Les brouillons restent lisibles. |
| C2.5 | GTG et pompes : fusion par id, rejeu sans nouvel id. | T9 T10, et le test d’effacement involontaire existant toujours vert. | Revenir à la liste complète. |
| C2.6 | Store `workoutDrafts` à la place du pont. | Autorisation de schéma. Les lecteurs historiques ignorent ce store. | Laisser le store en place, revenir aux clés `localStorage`. Ne pas supprimer le store dans la même version. |

C2.2 ne dépend pas de C2.4. C2.3 vient après C2.2, pour ne pas persister une coche qui ne tient pas à l’écran. C2.5 ne précède pas C2.1 : un ajout ne doit pas être annoncé enregistré si le timeout est encore un faux succès.

### Catégorie 3 — chantier B, jalons datés par priorité, pas bloquants pour C2.1–C2.3

| Jalon | Contenu | Critère d’acceptation | Priorité |
| --- | --- | --- | --- |
| B1 | Inventaire du chemin d’export réel. `exportWorkout` n’existe pas. `workoutAggregateSnapshot.v1` existe. | Un document désigne le fichier produit et ce qu’il contient. | Avant C2.6 |
| B2 | Export manuel d’un snapshot canonique vers un fichier choisi par l’utilisateur, avec somme de contrôle. Données synthétiques seulement pour le test. | Restauration sur base vide de test : mêmes clés qu’à l’export. Un octet corrompu est refusé. | Le jalon suivant C2.4 |
| B3 | Trois générations de ce fichier, la plus récente ne remplace pas les deux précédentes. | Restaurer génération N-1 après une génération N volontairement mauvaise. | Après B2 |
| B4 | Perte du navigateur. Le cloud ne compte que si le niveau 7 a réussi. Le fichier B2 est la copie que l’utilisateur sort de la machine. | Procédure écrite, testée sur jeu synthétique, sans envoi vers un service nouveau. | Après B2 |

B2 n’est pas optionnel. Il ne retarde pas C2.1.

Confidentialité : pas de télémétrie. Les journaux d’échec sont des codes. Les copies B2 contiennent les mêmes données personnelles que la base ; elles restent sur un fichier local, non envoyées par la phase 0.

---

## Validation et rollback de l’ensemble

On arrête la catégorie 2 si un test T1–T14 ou T16 échoue, ou si une fixture XP diverge de `calculateSportXP`. On n’active pas l’étape suivante pour « compenser ».

Retour arrière d’une étape : interrupteur. Les données canoniques écrites par l’ancienne voie restent lisibles, parce que le format de `workoutSessions` ne change pas avant C2.4, et C2.4 n’ajoute qu’un champ `revision` sur les journées réécrites.

---

## Réponses courtes aux douze questions

1. La D+ publiée, non. La D+ corrigée, oui pour la catégorie 1 immédiatement, et pour la catégorie 2 seulement étape par étape après accord.
2. Démontrés : perte de la clé partagée (simulation) ; id GTG aléatoire et id pompes `Date.now()` (code) ; remplacement de journée entière (code) ; timeout non strict pouvant revenir sans throw (code) ; sauvegardes de séance non branchées (aucun appelant) ; ordre swap-puis-séance (code) ; coût du moteur XP sur jeux synthétiques (mesuré).
3. Hypothèses : deux vrais onglets OS, quota réel, abort IndexedDB sous charge, peinture à l’écran, coupure électrique, crash entre séance et quête sur le binaire actuel.
4. Enregistrement par instance. Pont `localStorage` par instance maintenant ; store `workoutDrafts` quand le schéma sera autorisé.
5. Oui. `mergePatch` couvre les cinq cas, le groupe, la ligne absente. Tests vitest verts.
6. Oui, si le succès ne supprime que la génération confirmée. Démontré sur `retainNewerDrafts`, pas sur l’écran.
7. Oui, par id, avec le garde-fou d’effacement conservé. Les listes sans id restent en refus concurrent jusqu’à migration autorisée.
8. Le brouillon ne lance pas les effets. Le swap et la séance ne sont pas atomiques : l’échec de séance reste visible. Les quêtes ne partent qu’après succès confirmé, une fois par révision. Le double crédit n’est pas rejoué par un test de crash dans cette mission : T11 est obligatoire avant C2.4.
9. Voir DPLUS-PHASE0-RESULTS. Clic vers peinture : non mesuré.
10. C2.1, le signalement des échecs. Pas le brouillon, pas le schéma.
11. Avant C2.1 : T7 et T8 sur le contrat d’erreur, plus les tests d’effacement d’endurance et de persistance de séance déjà présents. Avant toute écriture canonique nouvelle : T2 T3 T4 T5 T6 T14. Avant le brouillon branché : T1 T12 T13. Avant GTG : T9 T10. Avant l’XP d’affichage : T16.
12. Le niveau 8 : export à somme de contrôle, trois générations, refus d’un fichier corrompu, copie hors du navigateur, procédure de perte de machine. Jalons B1–B4.
