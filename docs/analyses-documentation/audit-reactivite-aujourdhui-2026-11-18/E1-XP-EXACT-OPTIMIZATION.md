# E1 — bonus de complétion indexé

18 novembre 2026. `calculateSportXP` et `computeProgramCompletionBonusXp` de production ne sont pas modifiés.

L’expérience est `scripts/dplus/experimentalCompletionBonus.mjs`. Elle choisit les dates avec la même expression que l’oracle (clés `AAAA-MM-JJ_` dans les coches et les étirements ; les répétitions seules n’ouvrent pas un jour). Elle range ces clés en un passage, puis appelle `computeProgramCompletionCheckedRatio` sur la tranche du jour, en conservant le reste de l’objet (variations, endurance, champs inconnus).

---

## Égalité

Commande : `node node_modules/vitest/vitest.mjs run scripts/dplus/e1-xp-equality.test.js`

9 tests verts, 98 ms de tests.

| Cas | Résultat |
| --- | --- |
| B1, B14 jour complet, 2020-06-01 et 2020-06-04 | bonus **600** des deux côtés ; total moteur inchangé |
| B2 partiel | bonus identique |
| B3, B5 repos, 0 exercice planifié le 2020-06-04 | identique |
| B4, B6 étirements, deux jours | identique, y compris le breakdown du moteur |
| B7 programme custom | identique |
| B8 deux clés du même exercice, B9 reps sans coche, B10 coche sans reps, B11 coche retirée | identique ; reps seules = 0 |
| B12, B13, B18 null, vide, date invalide, clé legacy | identique |
| B16 quatre fixtures des tests XP (isométrie, charge, défis pompes, étirement noté) | `programCompletionBonusXp` et le breakdown entier identiques |
| B17 40 historiques, graine `20261118` | aucune différence |

B16 ne rejoue pas les 42 fichiers de `src/services/xp/__tests__/`. Seulement les 13 appels à `calculateSportXP`, ramenés à 4 objets représentatifs. Les autres fichiers de ce dossier ne calculent pas le bonus de séance.

Le moteur substitué n’a pas été exécuté : on n’a pas remplacé l’import dans `xpCalculations.js`. Quand le bonus indexé égale le bonus du breakdown, le total officiel ne change pas, parce que ce total ajoute ce seul champ. C’est une conséquence arithmétique, pas un second moteur lancé.

---

## Mesures, mêmes objets, vitest jsdom, Node v24.11.1

Commande : `node node_modules/vitest/vitest.mjs run scripts/dplus/e1-xp-benchmark.test.js`

Fichier 115 s. Détail : `scripts/dplus/e1-xp-benchmark.json`. Sur chaque jeu, les deux bonus renvoient la même valeur (0 : les ids 1…12 ne complètent pas le programme). L’égalité non nulle reste le 600 du test B14.

| Jeu | Clés | Bonus officiel | Bonus indexé | Moteur officiel |
| --- | ---: | --- | --- | --- |
| S | 360 | 3 passages, médiane 8,25 ms (7,48 ; 8,25 ; 13,05) | médiane 3,38 ms (2,89 ; 3,38 ; 4,83) | 2 passages, 26,09 et 44,83 ms |
| D100 | 1 200 | médiane 50,13 ms | médiane 6,09 ms | 53,16 et 68,48 ms |
| D200 | 2 400 | 184,52 et 186,06 ms | 19,30 et 26,46 ms | 289,77 et 397,90 ms |
| M | 4 800 | 883,82 et 904,22 ms | 21,29 et 27,60 ms | 1 012,71 et 1 197,27 ms |
| D800 | 9 600 | 4 123,50 et 4 542,46 ms | 55,06 et 65,07 ms | **un** passage, 4 647,77 ms |
| L | 24 000 | 30 444,57 et 35 293,17 ms, médiane 35 293 ms | 137,43 et 158,24 ms, médiane 158,24 ms | **un** passage, 29 557,43 ms |

Le tas bouge dans les deux sens (négatif sur D100). Ce n’est pas une mesure d’allocation. On ne publie pas un gain mémoire.

Le moteur de L n’a qu’un passage : pas de médiane. Il inclut encore l’ancien bonus. On ne soustrait pas 35 s de 29 s : les passages ne sont pas les mêmes, le résultat serait absurde. Le gain **mesuré** est celui du bonus : de l’ordre de 30–35 s à 0,14–0,16 s sur L, et de 0,9 s à 0,02–0,03 s sur M.

---

## Worker

Sur ces jeux, le bonus indexé tient sous 160 ms même à 24 000 clés. Ce n’est pas une raison d’introduire un worker pour ce terme. Le reste du moteur n’a pas été rechronométré sans l’ancien bonus. Avant de décider un worker, il faudra une mesure du moteur complet **après** branchement, sur les mêmes jeux.

158 ms sur le thread principal peut encore accrocher une frame. Ce n’est plus une attente de dizaines de secondes.

---

## Limites

- Endurance vide dans le benchmark. Trophées, course et défis ne sont pas le coût mesuré.
- Le ratio appelle encore la liste du programme pour chaque jour. C’est inclus dans les 158 ms.
- Un champ historique inconnu est recopié par le spread de l’objet, puis les trois maps sont remplacées par la tranche. Si un futur calcul lisait une coche d’un autre jour à l’intérieur du ratio, l’index divergerait. Les cas lancés aujourd’hui ne montrent pas cette lecture.

## Intégration minimale, plus tard

Remplacer le corps de `computeProgramCompletionBonusXp` par l’index, en laissant la signature et les seuils 100 / 300. Relancer `e1-xp-equality` et les tests XP existants. Pas dans cette mission.

## GO / NO-GO

**GO pour préparer l’intégration, NO-GO pour la faire maintenant.** L’égalité tient sur la suite exécutée, y compris 600 XP. Le gain du bonus est mesuré. Le moteur de production n’a pas bougé.
