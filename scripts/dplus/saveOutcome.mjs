/**
 * Contrat expérimental. Aucun chemin de production ne l'importe.
 * SUCCESS : la relecture prouve le marqueur.
 * FAILURE : l'erreur établit l'échec, ou la relecture contredit le résultat attendu.
 * UNKNOWN : timeout ou relecture impossible. Jamais un succès. Pas de réessai tant que la relecture n'a pas tranché.
 */

export const SaveIssue = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  UNKNOWN: 'UNKNOWN'
};

export function classifyCaughtSaveError(error) {
  if (!error) return SaveIssue.FAILURE;
  if (error.message === 'IDB_OPERATION_TIMEOUT') return SaveIssue.UNKNOWN;
  if (error.name === 'AbortError' || error.message === 'AbortError' || error.message === 'TRANSACTION_ABORTED') {
    return SaveIssue.FAILURE;
  }
  return SaveIssue.FAILURE;
}

/**
 * Décision proposée, non branchée sur saveToDB.
 * ack : saveRawWorkoutRow s'est résolu dans cet appel.
 * timedOut : IDB_OPERATION_TIMEOUT vu, même avalé.
 * aborted : AbortError avant commit.
 * operationIdSeen : vrai seulement si cet appel a introduit un identifiant absent de la base.
 * Sans identifiant nouveau, un timeout dont la valeur est présente reste UNKNOWN.
 */
export function classifyObservedSave({
  ack = false,
  timedOut = false,
  aborted = false,
  read,
  expected,
  baseMatchedExpected = false,
  operationIdSeen = () => false
}) {
  let row;
  try {
    row = read();
  } catch {
    return {
      issue: SaveIssue.UNKNOWN,
      retry: false,
      businessEffects: false,
      provenOperation: false,
      reason: 'reread-failed'
    };
  }
  const valueOk = Boolean(expected(row));
  const opOk = Boolean(operationIdSeen(row));
  const base = {
    retry: false,
    businessEffects: false,
    provenOperation: false
  };

  if (aborted) {
    if (valueOk && !baseMatchedExpected) {
      return { ...base, issue: SaveIssue.UNKNOWN, reason: 'abort-but-value-present' };
    }
    return {
      ...base,
      issue: SaveIssue.FAILURE,
      retry: true,
      sameOperationId: true,
      reason: 'abort-before-commit'
    };
  }

  if (timedOut) {
    if (!valueOk) {
      return {
        ...base,
        issue: SaveIssue.FAILURE,
        retry: true,
        sameOperationId: true,
        reason: 'timeout-value-absent'
      };
    }
    if (opOk) {
      return {
        issue: SaveIssue.SUCCESS,
        retry: false,
        businessEffects: true,
        provenOperation: true,
        reason: 'timeout-then-operation-id'
      };
    }
    return {
      ...base,
      issue: SaveIssue.UNKNOWN,
      reason: baseMatchedExpected ? 'timeout-same-value-unproven' : 'timeout-value-present-operation-unproven'
    };
  }

  if (ack && valueOk && opOk) {
    return {
      issue: SaveIssue.SUCCESS,
      retry: false,
      businessEffects: true,
      provenOperation: true,
      reason: 'ack-reread-operation-id'
    };
  }
  if (ack && valueOk) {
    return {
      issue: SaveIssue.SUCCESS,
      retry: false,
      businessEffects: true,
      provenOperation: false,
      reason: 'ack-and-value-without-operation-id'
    };
  }
  if (ack && !valueOk) {
    return { ...base, issue: SaveIssue.UNKNOWN, reason: 'ack-then-superseded' };
  }
  if (!valueOk) {
    return {
      ...base,
      issue: SaveIssue.FAILURE,
      retry: true,
      sameOperationId: true,
      reason: 'value-absent'
    };
  }
  return { ...base, issue: SaveIssue.UNKNOWN, reason: 'resolved-value-present-unproven' };
}

/**
 * À n'appeler qu'après UNKNOWN, par les tests E1.
 * Une égalité de valeur y est encore traitée comme un succès : classifyObservedSave est plus strict.
 */
export function reconcileUnknown({ read, markerPresent }) {
  let row;
  try {
    row = read();
  } catch {
    return { issue: SaveIssue.UNKNOWN, retry: false, reason: 'reread-failed' };
  }
  if (markerPresent(row)) {
    return { issue: SaveIssue.SUCCESS, retry: false, reason: 'reread-matched' };
  }
  return { issue: SaveIssue.FAILURE, retry: true, reason: 'reread-contradicts' };
}
