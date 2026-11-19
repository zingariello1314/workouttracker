# Plan d’exécution révisé

18 novembre 2026. La persistance de production ne change pas tant qu’une étape n’est pas autorisée explicitement. Chaque étape s’arrête si son test obligatoire est rouge.

Le coût XP mesuré ne renverse pas l’ordre d’intégrité. Il retire « appeler le moteur complet après la peinture » comme solution du calcul.

---

## Ordre

| Étape | Dépend de | GO | NO-GO |
| --- | --- | --- | --- |
| C2.1 Contrat d’erreur | Inventaire des appelants déjà commencé | T7 et T8 sur la branche réelle de timeout, dans une base de test. Les tests d’effacement d’endurance existants restent verts. | Un appelant non classé. Un retour silencieux encore possible. |
| C2.2a Coche et pourcentage | C2.1 | Le premier clic peint la coche et le pourcentage depuis la mémoire, sans `calculateSportXP`. | Le pourcentage attend encore la séance canonique, ou une coche disparaît au second clic. |
| C2.2b XP | C2.2a, et l’égalité large | Le bonus de complétion ne reparcourt plus toutes les clés par jour. `calculateSportXP` inchangé sur les fixtures XP existantes, plus le cas 600. Nouvelle mesure S/M/L après le correctif. | Un total ou un breakdown diverge. On ne branche pas un worker pour compenser. |
| C2.3 Brouillons | C2.2a | T1, T12, T13. Pas de suppression par âge. Pas de suppression au logout. Rollback sans effacer les clés. | Une clé partagée. Un effacement automatique. |
| C2.4 Validation | C2.1 et C2.3 | T2, T3, T4, T5, T6, T14 sur le gateway de test, pas seulement le harness. T11 vert avant le drapeau de quêtes. | Conflit silencieux, ou N qui efface N+1. |
| C2.5 GTG et pompes | C2.1 | T9, T10. Id persisté, pas l’index de liste. `gtg` protégé comme `pushups`, test à l’appui. Rejeu sans nouvel id. | Une liste vide de `gtg` peut encore effacer. |
| C2.6 Store `workoutDrafts` | Autorisation de schéma, C2.3 prouvé | Les lecteurs de séances ignorent le store. Les brouillons du pont sont copiés, pas détruits. | Création du store sur le profil réel pendant un essai. |

C2.2b ne bloque pas C2.2a. C2.3 ne bloque pas C2.2b. C2.5 ne précède pas C2.1 : un ajout ne doit pas être annoncé enregistré tant que le timeout peut mentir.

---

## C2.1, première modification de production

Site unique du mensonge actuel : `saveToDB` dans `src/hooks/useWorkoutData.js` retourne sans throw sur `IDB_OPERATION_TIMEOUT` quand `failOnTimeout` est faux. `updateData` ne met `failOnTimeout` que si `strict` est vrai. Graft compte 52 appels `updateData(` dans 24 fichiers de `src/components`. Quelques chemins calendrier et la fiche de grade passent `strict: true`. Les panneaux GTG et pompes d’Aujourd’hui, l’import de réglages, le suivi corporel, n’en passent pas.

Avant d’écrire le correctif :

- classer chaque appelant : déjà strict, ou doit afficher échec / indéterminé ;
- T7 : le commit a eu lieu, le minuteur a perdu la réponse, la relecture voit le patch, pas de second enregistrement, pas de nouvel id ;
- T8 : la transaction a avorté, l’erreur est visible, le brouillon ou la saisie reste ;
- relancer les tests `enduranceWipeGuard`.

Rollback : retirer le correctif seulement si le nouveau signalement est faux. Ne pas réintroduire le retour silencieux par un interrupteur. Si un appelant cassait parce qu’il comptait sur ce retour, on adapte l’appelant. On ne restaure pas la fausse confirmation.

Les 10 tests du harness sont verts. Ils ne suffisent pas à autoriser C2.1 : ils n’exécutent pas `saveToDB`.

---

## C2.2b, après les preuves d’aujourd’hui

Le correctif candidat est localisé : `buildPlannedExerciseListForDateStr` ne doit plus recevoir l’historique entier à chaque date. Une répartition des clés par jour, puis le même calcul de ratio.

GO supplémentaire : rejouer `src/services/xp/__tests__/` et le test 600. Puis remesurer. Si le moteur retombe à quelques dizaines de millisecondes sur M et sous une seconde sur L synthétique, pas de worker. S’il bloque encore le thread au-delà de ce que la peinture peut absorber, le worker devient un déplacement du reste, pas une excuse pour garder le scan.

Le plafond de volume et les trophées ne sont pas couverts par la passe par jour. On ne les « optimise » pas dans la même étape.

---

## C2.3

Contrats de `DPLUS-FINAL-CONTRACTS.md`. Le rollback désactive le mécanisme et laisse les clés. Le logout filtre par scope. L’identifiant d’écriture naît en mémoire.

---

## C2.4

Même transaction : ligne canonique et `effectsPending`. Au chargement, rattrapage des quêtes si le drapeau est là. Pas de quête depuis un brouillon. T11 avant l’activation du drapeau. Le swap reste non atomique avec la séance, et l’échec reste visible.

---

## C2.5

Id dérivé du corps, persisté une fois, jamais recalculé depuis la position dans la liste. Migration séparée, autorisée à part, sur copie de test d’abord. Jusque-là, deux ajouts concurrents sans id sont refusés. Le trou `gtg` du garde-fou est corrigé dans cette étape, avec un test qui échoue aujourd’hui si on exige la conservation : le test actuel **constate** l’effacement, il ne le corrige pas.

---

## Conservation hors navigateur

| Jalon | Protège contre | Ne protège pas contre | Preuve attendue |
| --- | --- | --- | --- |
| B1 Inventaire d’export | Rien encore. Désigne le fichier et les stores hors séances. | — | Document, pas un export personnel. |
| B2 Fichier à somme de contrôle, choisi par l’utilisateur | Effacement du profil, si le fichier n’est pas dans ce profil | Perte du disque | Restauration sur base vide de test. Octet corrompu refusé. |
| B3 Trois générations | Une génération mauvaise qui écrase la dernière | Perte du disque | Restaurer N-1. |
| B4 Copie hors de la machine | Perte de l’ordinateur | Un cloud non confirmé | Procédure écrite. Le niveau 7 cloud ne compte que si la réponse a réussi. |

Le brouillon durable et la séance canonique vivent dans le profil. Ils ne sont pas B2. Une copie dans le même profil n’est pas B4. Une copie sur le même disque n’est pas B4.

Aucun de ces jalons ne bloque C2.1. B2 vient après C2.4, avant C2.6. B2 n’est pas facultatif.

---

## Risques encore ouverts

- Fausse confirmation des `updateData` non stricts, jusqu’à C2.1.
- Scan XP qui bloque un thread s’il est appelé tel quel, jusqu’à C2.2b. Non mesuré dans Chrome.
- Brouillons : le mécanisme n’existe pas encore en production. Le risque actuel est la perte au rechargement, pas une suppression à 14 jours.
- `gtg` effaçable par une liste vide. Démontré sur le garde-fou.
- Ids GTG aléatoires et ids pompes `Date.now()` : un réessai peut dupliquer. Démontré par lecture, pas par un test de réessai du service.
- Swap commis et séance échouée : état intermédiaire réel, sans réparation automatique.
- Deux onglets sur le canonique actuel : dernière journée entière gagnante. Non rejoué en Playwright.
- Coupure électrique et perte du profil : non couvertes.
