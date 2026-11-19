# Profil du moteur XP

18 novembre 2026. Node v24.11.1, vitest 4.0.15, environnement jsdom. Données synthétiques. Aucun historique personnel. Le moteur de production n’a pas été modifié.

`calculateSportXP` reste l’oracle. Rien ici n’est activé dans l’application.

---

## Où part le temps

`calculateSportXP` (`src/services/xp/xpCalculations.js`, lignes 326-756) enchaîne des parcours distincts. Sur les jeux de cette mission (endurance vide, pas de Garmin, clés `date_index`), un seul domine.

`computeProgramCompletionBonusXp` (`src/utils/programCompletionBonus.js`, lignes 225-244) parcourt chaque date trouvée dans les clés. Pour chaque date, `buildPlannedExerciseListForDateStr` (lignes 132-150) reparcourt **toutes** les clés de `reps` et **toutes** les clés de `checkedExercises`, et ne garde que le préfixe du jour.

Avec D jours et K clés, ce sont de l’ordre de D × K × 2 inspections de clés. Ce n’est pas une déduction après coup : c’est la boucle du code, et les durées mesurées suivent ce produit.

Les autres étapes mesurées à part restent petites sur ces jeux :

| Étape | Rôle | L, 24 000 clés |
| --- | --- | ---: |
| `aggregateCheckedRepsByDateAndExerciseId` | une passe, déduplication | 18,73 ms |
| `computeLifetimeExerciseAndChallengeMinutes` | une passe des dates, endurance vide | 7,28 ms |
| `computeProgramCompletionBonusXp` | une passe complète des clés **par jour** | 28 295,80 ms |
| `calculateSportXP` entier | inclut le bonus | médiane 28 853,22 ms |

Le bonus isolé représente l’essentiel du moteur dès 400 jours. À 2 000 jours, 28,3 s sur 28,9 s. La signature caractère par caractère mesurée avant (4,41 ms pour 16 000 clés) n’est pas le sujet.

`resolveExerciseScoring` est un accès par map, pas un scan du catalogue à chaque clé. Il n’explique pas ces secondes. Les trophées, la course et les défis n’ont presque rien à faire quand `enduranceData.sessions` est vide : ce profil ne dit rien de leur coût sur un vrai journal d’endurance.

---

## Mesures, forme constante : 12 clés cochées par jour

Commande : `node node_modules/vitest/vitest.mjs run scripts/dplus/phase0-xp-profile.test.js`

Le détail est dans `scripts/dplus/phase0-xp-profile.json`. Arrêt prévu si un passage dépasse le plafond du palier. Aucun palier n’a été coupé. Le tas JS est relevé autour du bloc, pas allocation par allocation : le GC le rend instable (delta négatif sur S).

| Jeu | Jours | Clés | Inspections si scan complet par jour | Moteur | Bonus officiel | Passe par jour |
| --- | ---: | ---: | ---: | --- | ---: | ---: |
| S | 30 | 360 | 21 600 | 3 passages, médiane 22,69 ms (21,74–40,47) | 8,98 ms, 1 passage | 3,83 ms |
| D100 | 100 | 1 200 | 240 000 | 3 passages, médiane 64,07 ms (59,50–94,84) | 49,43 ms | 9,30 ms |
| D200 | 200 | 2 400 | 960 000 | 2 passages, 218,98 et 264,31 ms | 183,67 ms | 18,14 ms |
| M | 400 | 4 800 | 3 840 000 | 2 passages, 900,16 et 921,81 ms | 949,83 ms | 36,97 ms |
| D800 | 800 | 9 600 | 15 360 000 | 2 passages, 3 945,90 et 4 088,96 ms | 3 822,85 ms | 46,75 ms |
| L | 2 000 | 24 000 | 96 000 000 | 2 passages, 28 688,92 et 28 853,22 ms | 28 295,80 ms | 260,35 ms |

Quand les jours et les clés sont multipliés par deux, le travail du scan est multiplié par quatre. De 400 à 800 jours, le bonus passe de 950 ms à 3 823 ms, facteur 4,0. De 800 à 2 000 jours (facteur 2,5, produit des tailles 6,25), le bonus passe à 28 296 ms, facteur 7,4. L’ordre de grandeur est celui du produit jours × clés, pas celui d’une droite.

La passe par jour fabrique d’abord un sac de clés par date, puis appelle le même `computeProgramCompletionCheckedRatio` sur ce sac. Le bonus XP obtenu est identique au bonus officiel sur tous ces jeux. Sur ces jeux-là, ce bonus vaut 0 : les identifiants `1…12` ne complètent pas le programme du jour. L’égalité 0 = 0 prouve que les deux chemins s’accordent, elle ne prouve pas à elle seule un bonus non nul.

---

## Le résultat L

Le passage unique de la phase 0 (24 636 ms, autre processus, après S et M seulement) et les deux passages d’aujourd’hui (28 689 ms et 28 853 ms) sont la même classe de coût. L n’est plus un point isolé. Deux passages ne font pas un percentile.

La passe par jour sur L dure 260 ms, un seul passage. Le rapport avec le bonus officiel est d’environ 100 fois sur ce jeu. Ce 260 ms inclut encore, pour chaque jour, la construction de la liste du programme. Ce n’est pas un chiffre navigateur.

---

## Égalité sur un bonus non nul

Commande : `node node_modules/vitest/vitest.mjs run scripts/dplus/phase0-xp-bonus-equality.test.js`

Deux dates, exercices et étirements planifiés tous cochés :

| Date | Exercices planifiés | Étirements planifiés |
| --- | ---: | ---: |
| 2020-06-01 | 14 | 10 |
| 2020-06-04 | 0 | 9 |

Bonus officiel : **600**. Passe par jour : **600**. Test vert. Ce n’est pas l’historique réel, et ce n’est pas tout le breakdown de `calculateSportXP`. C’est le terme qui consomme le temps.

---

## Ce qui n’est pas indépendant d’un jour à l’autre

Le bonus de complétion additionne 100 ou 300 par jour, sans plafond global dans `computeProgramCompletionBonusXp`. Une tranche du jour suffit **pour ce terme**, une fois les clés du jour isolées.

D’autres termes ne se recalculent pas depuis une seule coche :

- le plafond de volume soulevé ;
- le chevauchement fractionné qui retire des XP d’exercices ;
- les trophées et les seuils GTG, qui lisent l’historique du type ;
- la déduplication de plusieurs clés du même exercice le même jour.

Un cache par jour est exact pour le bonus de complétion. Il ne l’est pas, sans somme globale conservée, pour le volume plafonné.

---

## Stratégies

| Stratégie | Effet sur ce profil | Décision |
| --- | --- | --- |
| A. Moteur complet après la peinture | L’interface peut peindre avant les 29 s. Le thread reste bloqué pendant ces 29 s, car l’appel est synchrone. Une génération lue à la fin n’interrompt pas l’appel. | Transition possible pour la coche. Pas l’objectif XP. |
| B. Cache par dépendances | Le bonus se range par jour. Le volume plafonné a besoin du cumul, pas seulement du jour. | Utile après l’index, pas à la place. |
| C. Recalcul partiel exact | Changer une coche ne doit relire que les clés de son jour pour le bonus. Le plafond de volume peut quand même exiger le cumul. | Oui pour le bonus. Pas pour tout le moteur d’un coup. |
| D. Préagrégats | Sac de clés par jour, reconstruit depuis les données canoniques, jamais source de vérité. | C’est la forme de C. |
| E. Worker | Déplace les 29 s hors du thread React. Le CPU reste. Le transfert des 24 000 clés s’ajoute. L’XP arrive toujours après coup. | Seulement si, une fois le scan corrigé, le reste bloque encore. Pas avant. |
| F. Hybride | Coche et pourcentage sur la mémoire du jour. Bonus par sac de clés. Moteur complet comme oracle de test. Worker seulement si la mesure d’après correctif le demande. | Recommandation. |

La recommandation n’est pas un moteur nouveau. C’est de remplacer, dans le bonus de complétion, le scan de toutes les clés à chaque jour par une répartition préalable. Le résultat doit rester celui de `computeProgramCompletionBonusXp`, puis celui de `calculateSportXP` sur les fixtures déjà présentes dans `src/services/xp/__tests__/`. Cette égalité large n’a pas été rejouée ici : seulement le bonus 600 et les jeux à bonus 0.

Coût mémoire : non établi. Les deltas de tas changent de signe selon le GC. On ne publie pas un chiffre d’allocation.

Aucun temps navigateur n’a été pris. Un appel synchrone de 29 s sur le thread principal bloquerait l’interface pendant 29 s. C’est une conséquence du code, pas une mesure Chrome.
