import { postMomentumApiV1IntentionsMutation } from '../fetchMomentumApiV1.js';
import { enqueueIntentionOutbox } from './intentionsOutbox.js';
import { isPhase3DualWriteEnabled } from './phase3Env.js';

/**
 * POST intention avec dual-write optionnel : si échec, enqueue pour flush ultérieur.
 * **Application :** préférer `sendIntentionMutationV1` dans `../sendIntentionMutationV1.js` (même implémentation réexportée).
 *
 * @param {string} accessToken
 * @param {{ clientMutationId: string, intent: string, payload?: Record<string, unknown> }} envelope
 */
export async function dualWritePostIntention(accessToken, envelope) {
  const res = await postMomentumApiV1IntentionsMutation(accessToken, envelope);
  if (res) return res;
  if (isPhase3DualWriteEnabled()) {
    enqueueIntentionOutbox(envelope);
  }
  return null;
}
