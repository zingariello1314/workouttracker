# Workout — repository Phase 1

Façade alignée sur `docs/sync/REPOSITORY_SIGNATURES_PHASE1.md`.

## API

- `createWorkoutRepository('local' | 'memory')` — `src/services/workout/createWorkoutRepository.js`
- **Local** : `WorkoutTrackerDB` + `WorkoutTrackerContextDB` via gateways (`workoutDbGateway.js`, `workoutContextGateway.js`).
- **Memory** : tests / hors navigateur.

## Intégration

- **`useWorkoutData`** : `createWorkoutRepository('local')` → store `workouts` (`loadRawWorkoutRow` / `saveRawWorkoutRow`) via `workoutDbGateway`. Optionnel : sync snapshot cloud (`VITE_WORKOUT_AGGREGATE_CLOUD_SYNC`) via `workoutAggregateCloudSync.js` ([`docs/sync/MOBILE_CLIENT_BOOTSTRAP.md`](../../../docs/sync/MOBILE_CLIENT_BOOTSTRAP.md)).
- **`useWorkoutContextStorage`** : `createWorkoutRepository('local')` → `LocalWorkoutRepository.loadProgramContext` / `saveProgramContext` (`workoutContextGateway`).

## Tests

```bash
npx vitest run src/services/workout/__tests__
```
