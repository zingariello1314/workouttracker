/**
 * Contrats partagés desktop ↔ mobile annexe (Zod).
 * @see docs/sync/ADR-003-client-mobile-annexe-et-contrats-api.md
 */

export {
  MomentumApiV1HealthSchema,
  safeParseMomentumApiV1Health
} from './apiHealth.v1.js';
export { UserProfileV1Schema, safeParseUserProfileV1 } from './userProfile.v1.js';
export {
  IntentionsRecentItemV1Schema,
  IntentionsRecentV1Schema,
  safeParseIntentionsRecentV1
} from './intentionsRecent.v1.js';
export {
  ServerTimeV1Schema,
  safeParseServerTimeV1
} from './serverTime.v1.js';
export {
  XpPortVerifyResponseV1Schema,
  safeParseXpPortVerifyResponseV1
} from './xpPortVerifyResponse.v1.js';
export {
  IntentionMutationResponseV1Schema,
  safeParseIntentionMutationResponseV1
} from './intentionMutationResponse.v1.js';
export {
  MutationEnvelopeV1Schema,
  safeParseMutationEnvelopeV1
} from './mutationEnvelope.v1.js';
export {
  SettingsSnapshotGetV1Schema,
  SettingsSnapshotPutBodyV1Schema,
  SettingsSnapshotPutResponseV1Schema,
  safeParseSettingsSnapshotGetV1,
  safeParseSettingsSnapshotPutBodyV1,
  safeParseSettingsSnapshotPutResponseV1
} from './settingsSnapshot.v1.js';
export {
  SportProgramContextGetV1Schema,
  SportProgramContextPutBodyV1Schema,
  SportProgramContextPutResponseV1Schema,
  safeParseSportProgramContextGetV1,
  safeParseSportProgramContextPutBodyV1,
  safeParseSportProgramContextPutResponseV1
} from './sportProgramContext.v1.js';
export {
  WorkoutAggregateSnapshotGetV1Schema,
  WorkoutAggregateSnapshotPutBodyV1Schema,
  WorkoutAggregateSnapshotPutResponseV1Schema,
  safeParseWorkoutAggregateSnapshotGetV1,
  safeParseWorkoutAggregateSnapshotPutBodyV1,
  safeParseWorkoutAggregateSnapshotPutResponseV1
} from './workoutAggregateSnapshot.v1.js';
