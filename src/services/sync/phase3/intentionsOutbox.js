/**
 * File d’attente locale des intentions à envoyer (dual-write Phase 3).
 * Clé stable : clientMutationId (remplace l’entrée si doublon).
 */

import { safeParseMutationEnvelopeV1 } from '../../../../contracts/mutationEnvelope.v1.js';
import { postMomentumApiV1IntentionsMutation } from '../fetchMomentumApiV1.js';

const KEY = 'momentum_phase3_intentions_outbox_v1';
const MAX_ITEMS = 150;
const MAX_ATTEMPTS = 8;

function readItems() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeItems(items) {
  if (typeof localStorage === 'undefined') return;
  try {
    const trimmed = items.length > MAX_ITEMS ? items.slice(-MAX_ITEMS) : items;
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    /* quota */
  }
}

/**
 * @param {{ clientMutationId: string, intent: string, payload?: Record<string, unknown> }} envelope
 */
export function enqueueIntentionOutbox(envelope) {
  const parsed = safeParseMutationEnvelopeV1(envelope);
  if (!parsed.success) return { ok: false, error: 'INVALID_ENVELOPE' };
  const items = readItems().filter((x) => x?.clientMutationId !== parsed.data.clientMutationId);
  items.push({
    ...parsed.data,
    _queuedAt: new Date().toISOString(),
    _attempts: 0
  });
  writeItems(items);
  return { ok: true };
}

export function listIntentionOutbox() {
  return readItems();
}

export function removeIntentionFromOutbox(clientMutationId) {
  const id = String(clientMutationId || '');
  if (!id) return;
  const next = readItems().filter((x) => String(x?.clientMutationId) !== id);
  writeItems(next);
}

function isMutationSuccess(parsed) {
  if (!parsed || typeof parsed !== 'object') return false;
  if (parsed.accepted === true) return true;
  if (parsed.idempotentReplay === true) return true;
  return false;
}

/**
 * Envoie la file ; retire les entrées acceptées ou déjà rejouées côté serveur.
 * @returns {Promise<{ sent: number, failed: number, remaining: number }>}
 */
export async function flushIntentionsOutbox(accessToken) {
  const token = String(accessToken || '').trim();
  if (!token) return { sent: 0, failed: 0, remaining: 0 };

  let sent = 0;
  let failed = 0;
  const items = readItems();
  const next = [];

  for (const raw of items) {
    const { _queuedAt, _attempts, ...envelope } = raw;
    const attempts = Number(_attempts) || 0;
    if (attempts >= MAX_ATTEMPTS) {
      next.push({ ...raw, _attempts: attempts });
      failed += 1;
      continue;
    }
    const parsed = safeParseMutationEnvelopeV1(envelope);
    if (!parsed.success) {
      continue;
    }
    const res = await postMomentumApiV1IntentionsMutation(token, parsed.data);
    if (isMutationSuccess(res)) {
      sent += 1;
      continue;
    }
    next.push({
      ...parsed.data,
      _queuedAt: _queuedAt || new Date().toISOString(),
      _attempts: attempts + 1
    });
    failed += 1;
  }

  writeItems(next);
  return { sent, failed, remaining: next.length };
}
