# E2 — résultats d’intégration

E2.2 a été activé ensuite. Le compte rendu est [E2.2-ACTIVATION.md](E2.2-ACTIVATION.md). E3 a ensuite branché un contrat opt-in, décrit dans [E3-PERSISTENCE-INTEGRATION.md](E3-PERSISTENCE-INTEGRATION.md). La section 13 ci-dessous décrit l’état avant l’activation d’E2.2. Ce document ne décrit pas E3.

18 novembre 2026. Node v24.11.1, Vitest 4.0.15, environnement jsdom. Aucune écriture dans le profil réel, aucune migration de schéma, aucun déploiement.

| Étape | Statut |
| --- | --- |
| E2.1 protection GTG | **Implémenté en production**, testé, autorisé |
| E2.2 bonus XP indexé | **Préparé hors production**, testé, **non autorisé à activer** |
| E2.3 contrat SUCCESS / FAILURE / UNKNOWN | **Préparé hors production**, testé sur le vrai `updateData`, **non autorisé à activer** |

Les niveaux : les fonctions pures sont le niveau 1. `saveToDB`, `updateData` et `persistEnduranceData` avec un dépôt injecté sont le niveau 2. Aucun navigateur, aucun disque de profil, aucune perte d’alimentation.

---

## 1. Fichiers de production réellement modifiés

Deux fichiers :

- `src/services/endurance/enduranceWipeGuard.js`
- `src/services/endurance/enduranceDataService.js`

`useWorkoutData.js`, `xpCalculations.js` et `programCompletionBonus.js` sont inchangés. Les données déjà stockées ne sont pas réécrites : la nouvelle règle s’applique à la prochaine fusion.

Fichiers hors production ajoutés ou ajustés : tests du garde-fou, `scripts/dplus/e2-save-contract.test.js`, `scripts/dplus/e2-xp-official-engine.test.js`, `scripts/dplus/e2-xp-indexed-engine.test.js`, `scripts/dplus/e2XpFixtures.mjs`, mesures JSON, et les fonctions expérimentales déjà présentes (`experimentalCompletionBonus.mjs`, `saveOutcome.mjs`, `gtgPreservePolicy.mjs`).

---

## 2. Diff précis de E2.1

`persistEnduranceData` transmet `explicitGtgClear: patch.explicitGtgClear === true`, puis retire ce champ de l’objet stocké, comme `allowWipe`.

Le garde-fou garde une seule fusion. La politique expérimentale `mergeEndurancePreservingGtg` appelle cette fusion ; elle n’a plus de règle contraire.

`sessionTypesTouched` contenant `gtg` **n’efface pas**. `EnduranceTab` remplit ce tableau avec toutes les clés qui sont des listes. S’en servir aurait pu effacer le GTG sans geste de suppression.

L’effacement total demande `explicitGtgClear === true` ou `allowWipe === true`. Aucun appelant de production ne pose ces drapeaux aujourd’hui.

Règles ajoutées dans `mergeEnduranceWithoutSilentWipe` :

- `sessions.gtg` vide alors que la liste précédente a des entrées : la liste précédente est gardée, sauf drapeau explicite.
- `gtg` entrant sans aucune clé de jour, alors que le précédent a des jours, ou objet vide `{}` / `{ days: {} }` alors que le précédent a du contenu : l’objet précédent est gardé, sauf drapeau explicite.
- Clé `sessions.gtg` absente : la liste précédente est recopiée. Même traitement pour les autres clés de session inconnues absentes.
- Objet `gtg` qui contient encore au moins un jour : il remplace l’objet précédent. Un passage ou une journée peut donc disparaître.
- Les types `boxing`, `pushups`, `gainage`, `swimming`, `jumprope`, `running` gardent leur règle précédente.
- Les arguments ne sont pas mutés. Les champs inconnus de l’objet d’endurance passent par la copie déjà en place.

`saveToDB` appelle la fusion sans options. Un payload vide est donc bloqué sur ce chemin. Une suppression totale ne peut pas y être exprimée. Elle passe par `persistEnduranceData` avec le drapeau.

---

## 3. Tests exécutés et résultats

Tous verts, sauf le build de production, qui échoue sur un import déjà hors de cette mission.

| Suite | Résultat |
| --- | --- |
| `src/services/endurance/__tests__` (17 fichiers, avec pompes, GTG, défis, trophées) plus `e1-gtg-policy`, `e1-save-to-db`, `integration-idb` | 20 fichiers, 129 tests |
| `src/services/xp/__tests__` | 21 fichiers, 139 tests. Le dossier n’en contient pas 42. |
| `scripts/dplus/e1-xp-equality.test.js` | 9 tests, bonus officiel contre bonus indexé |
| `scripts/dplus/e2-save-contract.test.js` | 12 tests, vrai `updateData` / `saveToDB` |
| `scripts/dplus/e2-xp-official-engine.test.js` | 1 test, moteur complet officiel |
| `scripts/dplus/e2-xp-indexed-engine.test.js` | 1 test, même moteur avec le bonus remplacé |

La suite groupée XP + égalité E1 + garde-fou + contrat de sauvegarde a donné 24 fichiers et 174 tests. 139 + 9 + 14 + 12 = 174.

`vite build` transforme 9274 modules, puis Rollup s’arrête : `openKnowledgeDb` n’est pas exporté par `src/services/knowledge/knowledgeIndexedDB.js`, importé par `src/services/knowledge/tiktopNativeVideos.js`. Ces fichiers ne sont pas dans le diff E2. Les modules d’endurance et `useWorkoutData` sont passés par la transformation Vitest.

Non exécuté : navigateur, deux processus, coupure d’alimentation, profil réel.

---

## 4. Démonstration des deux protections GTG

Niveau 1, `mergeEnduranceWithoutSilentWipe` :

- `sessions.gtg = []` laisse `[{ id: 'list_1', reps: 4 }]`.
- `gtg: { days: {} }` laisse les deux jours et leurs passages.
- Champ `gtg` absent : `{ foo: 1 }` reste. `{ days: {} }` ne remplace pas cet héritage.
- Une écriture de pompes qui omet la clé `gtg` garde la liste GTG, la course et les jours.

Niveau 2, vrai `saveToDB`, clé `e1-synthetic-scope`, `deferLoad`, dépôt en mémoire :

- Premier `updateData` écrit le jour `2026-06-01` et le passage `ah_1`.
- Second `updateData` envoie `sessions.gtg = []` et `gtg: { days: {} }`.
- La relecture contient encore `ah_1` dans les jours et dans la liste, et la pompe `pu_1`.

`persistEnduranceData` avec un `updateData` injecté : le même patch vide conserve le passage et la pompe. Le champ `explicitGtgClear` n’est pas stocké.

---

## 5. Suppressions volontaires

| Geste | Résultat mesuré |
| --- | --- |
| Retirer un passage en laissant les jours | Le passage `ah_1` disparaît, `ah_2` et le jour suivant restent. Les pompes restent. |
| Retirer une journée en laissant une autre | `2026-06-01` disparaît, `2026-06-02` reste. |
| `sessionTypesTouched: ['gtg']` avec listes vides | Rien n’est effacé. |
| `explicitGtgClear: true` | La liste `sessions.gtg` devient `[]` et `gtg` devient `{ days: {} }`. Pompes et course restent. |
| Même drapeau via `persistEnduranceData` | La valeur remise à `updateData` est vide, le drapeau est retiré de l’objet. |

La suppression du dernier jour, si elle produit `{ days: {} }`, est traitée comme un objet vide et bloquée sur `saveToDB`. `removeGtgAdHocPassage` garde la clé du jour même quand `adHoc` devient `[]`, donc la suppression d’un passage reste un snapshot non vide et passe. Aucun appelant actuel ne pose `explicitGtgClear`. Il n’y a pas de bouton de suppression totale branché.

---

## 6. Régressions

Les 7 tests historiques du garde-fou restent verts, ainsi que la restauration localStorage et la reconstruction des pompes. Les 129 tests d’endurance sont verts.

Changement de comportement assumé : une clé de session inconnue absente du payload n’est plus retirée. Avant, seule une clé présente était recopiée. L’absence n’est plus une suppression. Les six types d’activité protégés gardent leur règle, y compris le vide explicite via `sessionTypesTouched`.

Un snapshot GTG non vide et incomplet remplace encore les jours. Ce n’est pas une protection multionglets. C’est réservé à C2.4 / C2.5.

Un objet `{ config, days: {} }` a zéro jour. S’il arrive alors que des jours existent, l’objet précédent entier est gardé, y compris son ancienne config. Les écritures de production observées envoient l’objet complet issu du service, jours compris. Une mise à jour de config qui oublierait les jours serait ignorée plutôt que d’effacer l’historique.

---

## 7. Patch XP préparé et égalité

**Préparé, non intégré.** Le moteur officiel reste `computeProgramCompletionBonusXp` à `xpCalculations.js` ligne 724.

Le patch prêt est le remplacement de cet appel par `computeProgramCompletionBonusXpIndexed` (`scripts/dplus/experimentalCompletionBonus.mjs`). Seuils inchangés : 0, 100 à partir de 0,8, 300 à 1. Même ensemble de dates. Les répétitions seules n’ouvrent pas un jour. Le reste de l’objet, y compris les champs inconnus, est recopié dans la tranche du jour.

Égalité du **moteur complet**, pas d’une reconstruction arithmétique : Vitest remplace la fonction pour le test, `calculateSportXP` l’appelle une fois, et le breakdown entier est comparé à celui du moteur officiel.

| Jeu | totalXP | bonus | breakdown |
| --- | --- | --- | --- |
| Deux journées réelles du programme, 1er et 4 juin 2020 | 3792 des deux côtés | 600 des deux côtés | égal |
| S, 360 clés | 9288 | 0 | égal |
| M, 4800 clés | 123840 | 0 | égal |
| L, 24000 clés | 619200 | 0 | égal |

Les 9 tests différentiels E1 sont verts (bonus nul, 600, journée partielle, étirements, repos, programme modifié, clés doubles, valeurs manquantes, 40 historiques synthétiques). Ils comparent le bonus. Les quatre fixtures historiques de `calculateSportXP` sont dans les 139 tests XP, moteur officiel, assertions inchangées.

Aucune divergence. Pas de cas minimal à isoler. Les jeux S/M/L synthétiques ont un bonus 0 : ils prouvent que le reste du breakdown ne bouge pas. Le bonus non nul du moteur complet est le cas 600.

---

## 8. Performance du moteur XP complet

Deux échantillons par jeu, mêmes objets, Vitest jsdom. La médiane de deux valeurs dans le script est la plus haute. Les deux échantillons sont donc donnés, puis leur moyenne.

| Jeu | Moteur officiel | Moteur avec bonus indexé | Bonus indexé dans l’appel | Construction des dates + index | Ratios | Reste du moteur |
| --- | --- | --- | --- | --- | --- | --- |
| S | 38,85 ms puis 47,23 ms (moyenne 43,0) | 18,39 puis 19,52 (moyenne 19,0) | 6 ms puis 4 ms | index 1 ms | 5 ms puis 3 ms | 13,5 ms puis 14,4 ms |
| M | 1 695,93 puis 1 809,46 (moyenne 1 753) | 134,58 puis 145,22 (moyenne 140) | 46 ms puis 40 ms | dates 1–2 ms, index 6–7 ms | 37 ms puis 33 ms | 99 ms puis 95 ms |
| L | 36 004 ms puis 37 544 ms (moyenne 36 774) | 577,39 puis 616,92 (moyenne 597) | 192 ms puis 209 ms | dates 5–11 ms, index 44–50 ms | 143 ms puis 148 ms | 425 ms puis 368 ms |

Le temps « reste du moteur » est mesuré dans le même appel : durée de `calculateSportXP` moins durée du bonus indexé. Ce n’est pas une extrapolation entre deux processus.

Bonus officiel seul, pour situer le terme remplacé : S 12,69 et 13,63 ms ; M 1 497,59 et 1 650,80 ms ; L 29 717,66 et 32 456,34 ms.

Les deltas de tas changent de signe entre deux échantillons (le ramasse-miettes passe). Ce n’est pas une mesure d’allocation. Pas de Worker : après indexation, L dure environ 0,6 s, dont environ 0,4 s hors bonus. Un Worker ne fait pas partie de ce patch.

---

## 9. Patch C2.1 préparé et tests

**Préparé, non intégré.** `useWorkoutData.js` est inchangé. La fonction nouvelle est `classifyObservedSave` dans `scripts/dplus/saveOutcome.mjs`. `reconcileUnknown` d’E1 est inchangé : il traite encore une valeur relue identique comme un succès. Le nouveau classificateur est plus strict.

Contrat de retour proposé, seulement si l’appelant demande `reportOutcome: true`. Sans cette option, `saveToDB` et `updateData` gardent leur retour actuel. Les 87 appels ne changent pas tant qu’ils ne demandent rien.

| Situation observée sur le vrai hook | Promesse de production, aujourd’hui | Classement proposé | Effet métier |
| --- | --- | --- | --- |
| `put` résolu et relecture conforme | résolue | SUCCESS, opération non prouvée sans identifiant | autorisé |
| Abort avant `put` | stricte : rejet ; non stricte : résolue, 0 `put` | FAILURE, réessai avec le même identifiant | interdit |
| Timeout avant `put` | non stricte : résolue, 0 `put` | FAILURE | interdit |
| Timeout après `put`, valeur présente, pas d’identifiant nouveau | stricte : rejet alors que la ligne est écrite ; non stricte : résolue | UNKNOWN, pas de réessai | interdit |
| Réponse perdue, même scénario que le timeout après `put` | non stricte : résolue, 1 `put` | UNKNOWN | interdit |
| Relecture qui jette | — | UNKNOWN, pas de réessai | interdit |
| Deux `saveToDB` concurrents | 2 `put`, une seule valeur reste | le gagnant SUCCESS ; le perdant UNKNOWN `ack-then-superseded` | effet seulement pour le gagnant |
| Second `put` du même payload | 2 `put`, un seul passage `ah_1` | SUCCESS non prouvé | le remplacement de ligne ne duplique pas |
| Timeout alors que l’identifiant était déjà en base | la ligne est là | UNKNOWN `timeout-same-value-unproven` | interdit |
| Timeout et identifiant absent de la base, puis présent à la relecture | 1 `put` | SUCCESS prouvé | autorisé |
| `reactOnly: true` | aucune écriture | hors classificateur | mémoire seulement |

L’identifiant du dernier cas est un champ de la ligne de test, dans la base injectée. Aucun champ n’est ajouté au schéma de production. Sans identifiant stocké, une valeur égale après timeout reste UNKNOWN : l’égalité de valeur ne prouve pas que cet appel a été commis.

Les 12 tests utilisent `e2-synthetic-scope` et `deferLoad`. Le profil n’est pas ouvert.

---

## 10. Appelants restant à adapter

Recompte graft du 18 novembre 2026 : `updateData(` a **87 occurrences, 57 fonctions, 32 fichiers**. `strict: true` sur un appel `updateData` : **14 sites**. `reactOnly: true` : **un site**, `useAllDataExportImport` ligne 749. Ce site n’écrit pas. Les `strict: true` de `recapMilestoneEngine.js` et de la validation photo ne sont pas des appels `updateData`.

Aucun de ces appelants n’est modifié.

| Groupe | Exemples | Adaptation quand E2.3 sera autorisé |
| --- | --- | --- |
| Déjà stricts | `useWorkoutExercises` persistance, exercices exceptionnels, `markExceptionalExerciseComplete`, cinq sites de `CalendarHeatmap` dont un `.catch` qui avale, grade, deux sauvegardes de circuits, bundle `WorkoutProvider`, import ligne 601 | Afficher une erreur seulement sur FAILURE. Sur UNKNOWN, garder la saisie, ne pas réessayer, relire. Le timeout après commit jette encore aujourd’hui. |
| GTG, non stricts | bannières et panneaux GTG, `persistEnduranceData` | Ne pas afficher un succès sur une promesse résolue. UNKNOWN : garder la saisie, suspendre quête et toast. Réessayer seulement après FAILURE, avec le même identifiant. |
| Pompes, non stricts | `PushupChallengeTodayPanel` | Même règle. Un nouvel `Date.now()` au réessai dupliquerait. |
| Séance hors strict | `useWorkoutExercises` second appel, `TodayTab` | La mémoire est déjà mise à jour avant l’écriture. UNKNOWN : ne pas enchaîner les effets. |
| Circuits non stricts | suppression et tours | Ne pas confirmer la suppression ou le compteur sans relecture. |
| Import | lignes 222 et 767 | UNKNOWN : ne pas annoncer l’import. L’import des autres domaines ne doit pas être relancé en bloc. |
| Corps, calendrier non strict, contexte, historique, logique de programme | rappels, photos, sommeil, réassignation, progression, reset | Afficher un état indéterminé, garder la saisie, suspendre l’effet qui suit. |

Ordre proposé, après accord : d’abord GTG et pompes, ensuite la persistance de séance, ensuite le calendrier strict, ensuite le reste. Pas de bascule générale vers `strict: true`.

---

## 11. Risques résiduels

- Un snapshot GTG non vide peut encore écraser des jours s’il est incomplet ou périmé. Non démontré comme sûr en multionglets.
- `saveToDB` ne peut pas porter `explicitGtgClear`. La suppression totale n’existe que via `persistEnduranceData`.
- Le dernier jour envoyé sous la forme `{ days: {} }` est conservé. C’est voulu pour l’effacement accidentel. Un futur bouton « tout supprimer » doit poser le drapeau.
- `allowWipe: true` efface aussi le GTG. Aucun appelant ne le pose.
- E2.2 : les historiques synthétiques longs ont un bonus nul. L’égalité du bonus non nul dans le moteur complet repose sur le scénario 600 et sur les tests différentiels du bonus.
- E2.3 : sans identifiant d’opération dans le schéma, SUCCESS après un simple `put` résolu signifie « l’appel a été acquitté et la valeur relue correspond ». Deux écritures identiques concurrentes restent indistinguables. Un timeout avec la bonne valeur reste UNKNOWN.
- Le build Rollup échoue sur `openKnowledgeDb`, en dehors de ce diff.

---

## 12. Rollback

| Étape | Rollback |
| --- | --- |
| E2.1 | Revenir les deux fichiers de production. Aucune donnée n’a été migrée. Les lignes déjà en base restent telles quelles. |
| E2.2 | Ne pas changer la ligne 724. Si elle était changée plus tard, la remettre sur `computeProgramCompletionBonusXp`. Aucun format d’XP n’est stocké par ce calcul. |
| E2.3 | Ne pas importer `classifyObservedSave` dans le hook. Si l’option était branchée, cesser de la demander. Ne pas rétablir un retour silencieux une fois qu’un appelant dépend du classement. |

---

## 13. GO / NO-GO pour E2.2

**GO technique, activation non autorisée.**

L’égalité stricte du moteur complet est démontrée sur le scénario 600 et sur S, M, L. Le gain est mesuré sur ce moteur, pas déduit du bonus : L passe d’environ 37 s à environ 0,6 s. Le patch est le remplacement d’un appel. Il n’est pas dans le source de production.

---

## 14. GO / NO-GO pour E2.3

**NO-GO pour l’activation.**

Le classificateur et ses 12 tests de chemin réel sont prêts. Le brancher en changeant le retour par défaut casserait la lecture des 87 appels, et `strict: true` transformerait encore un timeout après commit en exception. L’activation acceptable est une option ignorée par défaut, puis l’adaptation des appelants GTG et pompes. Cette activation attend un accord.

---

## 15. Prochaine étape

Valider ou refuser l’activation d’E2.2. Si elle est acceptée, le changement se limite à l’appel du bonus dans `calculateSportXP`, suivi des 139 tests XP et du test différentiel.

Laisser E2.3 inactif. Le prochain correctif de sauvegarde, après accord, est l’option `reportOutcome` plus les appelants GTG et pompes, sans identifiant de schéma et sans bascule `strict`.

Le trou GTG restant, le snapshot non vide incomplet, reste C2.4 / C2.5. Il n’est pas couvert par E2.1.
