# E1 — C2.1, contrat d’erreur de `saveToDB`

18 novembre 2026. Le code de production n’a pas été modifié. Les tests appellent le vrai `updateData` et le vrai `saveToDB` (`src/hooks/useWorkoutData.js`), avec un dépôt en mémoire à la place de `createWorkoutRepository('local')`. `deferLoad: true` empêche la lecture IndexedDB. Clé `e1-synthetic-scope`. Aucune base de profil.

Niveau 2. Ce n’est pas un navigateur, ni le disque réel.

---

## Défaut reproduit

`saveToDB`, lignes 1127-1131 : si l’erreur est `IDB_OPERATION_TIMEOUT` et `failOnTimeout` est faux, la fonction **retourne sans jeter**.

`updateData` met `failOnTimeout` à vrai seulement si `strict` est vrai (ligne 1384). Ensuite, lignes 1392-1408 : un retour normal est journalisé comme une sauvegarde réussie. Le `catch` (1406-1409) ne relance l’erreur que si `strict` est vrai.

Conséquence mesurée :

| Appel | Mode du dépôt | Promesse | Écritures |
| --- | --- | --- | --- |
| non strict | timeout après `put` | résolue | 1, les données sont là |
| non strict | timeout avant `put` | résolue | 0 |
| non strict | abort avant `put` | résolue | 0 |
| strict | timeout après `put` | rejet `IDB_OPERATION_TIMEOUT` | le `put` a quand même eu lieu |
| strict | abort avant `put` | rejet `AbortError` | 0 |
| strict ou non | succès | résolue | 1 |

Le strict ne suffit pas. Il transforme un timeout **après commit** en exception. Un appelant qui réessaie sur toute exception peut dupliquer. Le test A1 le montre : un second `updateData` sans relecture fait passer le compteur de `put` de 1 à 2.

Retourner une exception pour tout timeout serait une mauvaise correction. L’issue juste est UNKNOWN, puis une relecture.

---

## Inventaire

`updateData(` : **87 appels, 57 fonctions, 32 fichiers** sous `src` (graft, 18 novembre 2026). Le chiffre 52 ne couvrait que `src/components`.

Ils partagent un seul contrat. Ce qui change est le booléen `strict`, le `await`, et ce que l’appelant fait après.

### Stricts — l’exception remonte

| Lieu | Données | Après retour |
| --- | --- | --- |
| `useWorkoutExercises` persistance, L260 | séance du jour | effets d’enregistrement seulement si la promesse tient |
| `useWorkoutExceptionalExercises` L122, L203 | exercice exceptionnel | idem |
| `markExceptionalExerciseComplete` L1514 | complétion | idem |
| `CalendarHeatmap` L781, L2342, L2395, L2469, L4637 | séance, reps, suppression | L781 avale avec `.catch(() => {})` |
| `ExerciseGradeDetailView` L293 | grade | await |
| `saveCircuitDefinition` L1617, `saveCircuitDefinitionsBatch` L1638 | circuits | await |
| `WorkoutProvider` L300 | bundle | strict |
| `useAllDataExportImport` L601 | import entraînement | catch local, les autres domaines continuent |

Un strict qui reçoit un timeout après commit voit un échec alors que la ligne est peut-être écrite. Il doit relire avant de réessayer. Aujourd’hui il ne le fait pas.

### Non stricts — la promesse résolue n’est pas une preuve

Groupe et risque de faux succès. Un réessai qui recrée un identifiant peut dupliquer.

| Groupe | Exemples | Effet si l’appelant continue |
| --- | --- | --- |
| GTG | `GtgTodaySchedulePanel` L75, `GtgSessionsPanel` L115, `GtgProtocolGuide` L377 et L394, `GtgProtocolDataBanner` L131, `persistEnduranceData` L108 | toast ou état « enregistré » possible sans preuve |
| Pompes | `PushupChallengeTodayPanel` L396 et L420 | nouvel `id: Date.now()` si l’appelant recommence |
| Séance hors strict | `useWorkoutExercises` L579, `TodayTab` L1481, L1600, L530, L634 | mise à jour mémoire déjà faite avant l’écriture |
| Circuits | `deleteCircuitDefinition` L1664, tours L1728 et L1741 | suppression ou compteur cru persisté |
| Réglages | import L222 et L767 ; L749 est `reactOnly` (pas d’écriture) | import cru réussi |
| Corps | rappels, photos, impédance | préférences crues enregistrées |
| Calendrier non strict | sommeil, réassignation de date, L2815, L2886 | date crue déplacée |
| Contexte | progression, justifications, variantes, photos, L321 `uncertainData`, L614, L648, L1585 | suite métier après une promesse résolue |
| Historique / logique | `useWorkoutHistory` L149, `useWorkoutLogic` semaine, départ, reset | idem |

`reactOnly` ne touche pas IndexedDB. Il est hors du défaut de timeout.

Aucun de ces appelants n’a été modifié.

---

## Contrat recommandé

| Issue | Preuve | Ce que l’appelant peut faire |
| --- | --- | --- |
| SUCCESS | relecture : la ligne contient le marqueur attendu | effets métier une fois |
| FAILURE | abort avant écriture, ou relecture qui contredit le marqueur | garder la saisie ; réessayer seulement avec le même identifiant |
| UNKNOWN | `IDB_OPERATION_TIMEOUT`, ou relecture qui jette | pas de toast, pas de nouvel id, pas de quête |

Module expérimental : `scripts/dplus/saveOutcome.mjs`. Il n’est pas branché.

A1 : timeout après écriture → UNKNOWN, relecture → SUCCESS, `put` reste à 1. Sans relecture, le second appel passe à 2.

A3 : relecture en échec → UNKNOWN, `retry: false`.

---

## Tests exécutés

Commande : `node node_modules/vitest/vitest.mjs run scripts/dplus/e1-save-to-db.test.js`

7 tests verts, 107 ms de tests, fichier environ 6 s. Code traversé : `updateData`, `saveToDB`, `mergeEnduranceWithoutSilentWipe` pour A6.

A6 : après un premier succès, une liste `pushups` vide relue depuis le dépôt garde `pu_1`.

Les tests `enduranceWipeGuard.test.js` existants : 7 verts dans la même session.

---

## Correctif proposé, non appliqué

Ne pas mettre `failOnTimeout: true` partout. Cela ferait passer un commit réel pour un échec.

1. `saveToDB` ne retourne plus silencieusement sur timeout. Il signale UNKNOWN, y compris en strict.
2. Avant tout réessai, relire la clé. Marqueur présent : SUCCESS, stop. Absent : FAILURE, réessai du même payload. Lecture impossible : rester UNKNOWN.
3. Migrer d’abord les appelants qui affichent un succès ou qui créent un id (GTG, pompes, import). Les autres peuvent continuer à attendre une promesse, mais cette promesse ne doit plus se résoudre sur UNKNOWN.

Rollback : le classificateur est un module à part. Tant qu’il n’est pas importé par `useWorkoutData`, le retour arrière est de ne pas le brancher. Une fois branché, le retour arrière ne rétablit pas le `return` silencieux.

## GO / NO-GO

**NO-GO pour activer C2.1.** Le défaut est reproduit sur le vrai chemin, le contrat est testé à côté, et un simple durcissement `strict` créerait des réessais après un commit réel. L’activation attend un accord, puis un branchement du classificateur sans changer le défaut actuel dans le même geste que les toasts.
