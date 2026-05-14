/**
 * Point d’entrée **unique** côté application pour envoyer une intention versionnée (`/api/v1/intentions/mutation`).
 * Utilise le dual-write Phase 3 (file locale + flush) lorsque `VITE_PHASE3_DUAL_WRITE` est actif.
 *
 * Ne pas appeler `postMomentumApiV1IntentionsMutation` directement depuis les features : préférer cette fonction
 * ou `flushIntentionsOutbox` (file) qui garde le POST bas niveau pour le rejouage.
 *
 * @see docs/sync/PHASE3_MIGRATION_DUAL_WRITE.md
 */

export { dualWritePostIntention as sendIntentionMutationV1 } from './phase3/dualWriteIntention.js';
