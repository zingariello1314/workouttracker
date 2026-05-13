# Phase 0 — `userId` / `storageKey` (scan rapide)

Règle **workout + contexte** : voir **ADR-000** (`WorkoutContext.jsx` — `main` si admin, sinon `user-${id}`, sinon `anonymous`).

| Domaine | Clé / champ | Fichiers d’ancrage |
|---------|-------------|-------------------|
| Workout aggregate | `id` = `storageKey` dans `WorkoutTrackerDB.workouts` | `useWorkoutData.js`, `workoutDbGateway.js` |
| Programmes contexte | `id` = `context:${storageKey}` dans `WorkoutTrackerContextDB` | `useWorkoutContextStorage.js`, `workoutContextGateway.js` |
| XP | `userId` sur store `xpSystem` (`QuietQuestDB`) | `xpStorage.js` |
| QuietQuest | `userId` optionnel sur enregistrements ; legacy `main` | `quietQuestIndexedDB.js` |
| Nutrition | `userId` sur lignes concernées | schémas nutrition / repository |
| Garmin | `userId` optionnel sur activités | `garminDataUtils.js` |
| Finance | IndexedDB par store ; pas toujours `userId` explicite côté portfolio | `financeStorage.js` |
| Code journal | `userId` + clé meta | `codeJournalIDB.js` |
| App lock | `userId` keyPath | `appLockStorage.js` |

**Verdict** : hétérogène hors workout ; **cible** : tout nouveau repository reçoit un **`UserScope`** explicite (id auth) ou un `scopeKey` dérivé centralisé (éviter les magic strings dispersées).
