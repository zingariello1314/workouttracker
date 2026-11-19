# Résultats d’intégration

18 novembre 2026. Machine Windows, Node v24.11.1, vitest 4.0.15, jsdom. Base `momentum-dplus-integration-test` créée et détruite dans fake-indexeddb. Aucun profil navigateur ouvert. Aucune base Momentum de l’utilisateur.

---

## Exécutés

### Politique de fusion, mémoire

Commande : `node node_modules/vitest/vitest.mjs run scripts/dplus/threeWayMerge.test.js`

Environnement : vitest, fonctions pures.

Résultat : 11 tests verts (session précédente du 18 novembre, non relancés aujourd’hui). Assertions : clés indépendantes, conflit sans écraser le canonique, convergence, tombeau contre modification, deux suppressions, groupe exercice, ligne absente, génération N+1, union d’ids, rejeu sans doublon, même id et corps différent.

Limite : pas une transaction, pas deux onglets.

### Bonus de complétion, valeur non nulle

Commande : `node node_modules/vitest/vitest.mjs run scripts/dplus/phase0-xp-bonus-equality.test.js`

Environnement : vitest jsdom, programme réel `workoutProgram`, deux dates synthétiques entièrement cochées.

Résultat : vert. Bonus officiel 600, passe par jour 600. Lundi planifié 14 exercices et 10 étirements. Jeudi 0 exercice et 9 étirements.

Limite : ce n’est pas `calculateSportXP` entier, ni un historique personnel.

### Profil de durée

Commande : `node node_modules/vitest/vitest.mjs run scripts/dplus/phase0-xp-profile.test.js`

Environnement : vitest jsdom. Durée du fichier : 102 s. Le fichier de sortie `scripts/dplus/phase0-xp-profile.json` a été écrit. L’assertion finale lisait un champ renommé et a échoué après l’écriture. Le test a été corrigé. Les chiffres du JSON sont ceux de l’exécution. Détail dans `DPLUS-XP-PROFILING.md`.

Limite : endurance vide. Pas le thread d’un navigateur.

### Harness IndexedDB

Commande : `node node_modules/vitest/vitest.mjs run scripts/dplus/integration-idb.test.js`

Environnement : fake-indexeddb 5, bibliothèque `idb`, base détruite en fin de fichier. 10 tests verts, 14 ms de tests, environ 2,3 s avec l’environnement.

| Test | Assertion vérifiée | Limite |
| --- | --- | --- |
| Clés indépendantes | Dans une transaction : tractions 12 et dips 10, révision 4, `noteHistorique` et `extraHistorique` conservés | Harness, pas `persistWorkoutSessionDay` |
| Même clé | Conflit, aucun `put`, canonique 15, révision 2 | Idem |
| Sans champ `revision` | Traité comme 0, devient 1, `legacyField` recopié par le spread de la ligne | Le gateway de production ne fait pas encore ce spread |
| Générations | Confirmation 4 retire le brouillon 4 en mémoire de la politique ; le brouillon 5 reste en base | La suppression du 4 est faite par le test après la politique, pas par un écran |
| Abort | `put` puis `abort` : la ligne relue reste révision 1, tractions 10 | fake-indexeddb, pas un crash processus |
| Timeout et commit réussi | La ligne est déjà à 12. La relecture le voit. Aucun second `put`. Le nombre de lignes ne change pas | Le timeout est un booléen, pas un minuteur qui perd la réponse d’un vrai disque |
| Timeout et commit échoué | Abort. Canonique inchangé. Brouillon `{ tractions: 12 }` toujours présent | Idem |
| Pompes vides | `mergeEnduranceWithoutSilentWipe` garde la séance `pu_1` en base | Type `pushups` seulement |
| Type `gtg` | Le même garde-fou **remplace** `gtg` par `[]` | Comportement actuel démontré, pas corrigé |
| Ids | `ah_1` ∪ `ah_2`, rejeu de `ah_2` : toujours 2 entrées | Fonction pure, puis pas de seconde écriture en base sur ce test |

---

## Non exécutés

| Test demandé | Pourquoi il n’a pas été lancé |
| --- | --- |
| Clic → coche peinte, pourcentage peint, XP peinte | La sonde n’est pas branchée dans `TodayTab`. Aucune session Playwright. Un `setState` de test n’est pas une peinture. |
| Thread principal dans Chrome, long tasks, rendus React | Pas de navigateur. |
| IndexedDB du gateway réel, files, relecture de `persistWorkoutSessionDay` | Le harness n’appelle pas le gateway. Le brancher ouvrirait le chemin de production. |
| Deux onglets OS, onglet dupliqué, rechargement de brouillon | Pas de profil temporaire Playwright. Le lancer contre le serveur de développement avec le profil réel est refusé. |
| T11 crash entre séance et quêtes sur le code actuel | Non écrit. Le contrat de rattrapage n’est pas dans le code. |
| Égalité de `calculateSportXP` sur toutes les fixtures `src/services/xp/__tests__/` | Non relancée dans cette mission. |
| Coupure électrique, perte du profil | Hors d’atteinte d’un test simulé. |

Playwright est dans les devDependencies. Il n’a pas été démarré. Un contexte vierge n’a pas de séance à cocher tant qu’un chargeur de fixture isolé n’existe pas. Ce chargeur n’a pas été ajouté, pour ne pas ouvrir un chemin d’écriture vers les données réelles.
