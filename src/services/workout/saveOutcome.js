/**
 * Contrat opt-in de sauvegarde.
 * SUCCESS : la ligne relue contient l'identifiant de cette opération.
 * FAILURE : la transaction a été annulée et cet identifiant est absent.
 * UNKNOWN : timeout, relecture impossible, ou ligne tenue par une autre opération.
 * Une valeur identique sans cet identifiant ne suffit pas.
 */

export const SaveStatus = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  UNKNOWN: 'UNKNOWN'
};

export function createSaveOperationId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `save-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function isAbortSaveError(error) {
  if (!error) return false;
  const name = error.name;
  const message = error.message;
  return name === 'AbortError'
    || message === 'AbortError'
    || message === 'TRANSACTION_ABORTED'
    || message === 'WORKOUT_TX_ABORTED';
}

export function classifySaveOutcome({
  operationId,
  acked = false,
  timedOut = false,
  error = null,
  row = null,
  readFailed = false
}) {
  const storedOperationId = typeof row?.saveOperationId === 'string' ? row.saveOperationId : null;
  const evidence = {
    acked: Boolean(acked),
    timedOut: Boolean(timedOut),
    readFailed: Boolean(readFailed),
    storedOperationId
  };
  const base = { operationId, evidence };

  if (readFailed) {
    return { ...base, status: SaveStatus.UNKNOWN, reason: 'reread-failed' };
  }
  if (storedOperationId === operationId) {
    return {
      ...base,
      status: SaveStatus.SUCCESS,
      reason: acked ? 'ack-and-operation-id' : 'operation-id-after-timeout'
    };
  }
  if (isAbortSaveError(error)) {
    return { ...base, status: SaveStatus.FAILURE, reason: 'abort-not-committed' };
  }
  if (storedOperationId && storedOperationId !== operationId) {
    return {
      ...base,
      status: SaveStatus.UNKNOWN,
      reason: acked ? 'acked-then-superseded' : 'other-operation-stored'
    };
  }
  if (timedOut || error?.message === 'IDB_OPERATION_TIMEOUT') {
    return { ...base, status: SaveStatus.UNKNOWN, reason: 'timeout-operation-unproven' };
  }
  if (acked) {
    return { ...base, status: SaveStatus.UNKNOWN, reason: 'ack-without-operation-id' };
  }
  if (error) {
    return { ...base, status: SaveStatus.UNKNOWN, reason: 'write-error-unproven' };
  }
  return { ...base, status: SaveStatus.UNKNOWN, reason: 'not-confirmed' };
}

export function saveOutcomeNotice(outcome) {
  if (!outcome || outcome.status === SaveStatus.SUCCESS) return null;
  if (outcome.status === SaveStatus.FAILURE) {
    return 'La sauvegarde n’a pas abouti. La saisie est conservée.';
  }
  return 'Sauvegarde non confirmée. Les données restent visibles pendant la vérification.';
}

export function isConfirmedSave(outcome) {
  return outcome?.status === SaveStatus.SUCCESS;
}
