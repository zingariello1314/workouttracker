# Phase 0 — Boot & flux de données (vue simplifiée)

Ordre **logique** (réel = lazy selon onglets visités) :

1. **Auth** — `loadInitialAuth` → `WorkoutTrackerAuthDB` + tokens serveur éventuels.
2. **WorkoutContext** — calcule `storageKey` (`main` / `user-<id>` / `anonymous`) → `useWorkoutData` + `useWorkoutContextStorage`.
3. **Données satellite** — au premier accès module : Garmin, Finance, Nutrition, XP (`QuietQuestDB`), etc.

```mermaid
sequenceDiagram
  participant App
  participant Auth as AuthDB
  participant W as WorkoutTrackerDB
  participant C as WorkoutTrackerContextDB
  App->>Auth: loadInitialAuth
  App->>W: loadAggregate(storageKey)
  App->>C: loadProgramContext(storageKey)
```

**Repository Phase 1** : `useWorkoutData` s’appuie sur `LocalWorkoutRepository` (`loadRawWorkoutRow` / `saveRawWorkoutRow`) pour le document `workouts` ; le contexte programmes reste dans `useWorkoutContextStorage` jusqu’à alignement.
