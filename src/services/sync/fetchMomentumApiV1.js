import { safeParseMomentumApiV1Health } from '../../../contracts/apiHealth.v1.js';
import { safeParseUserProfileV1 } from '../../../contracts/userProfile.v1.js';
import { safeParseIntentionsRecentV1 } from '../../../contracts/intentionsRecent.v1.js';
import { safeParseIntentionMutationResponseV1 } from '../../../contracts/intentionMutationResponse.v1.js';
import { safeParseMutationEnvelopeV1 } from '../../../contracts/mutationEnvelope.v1.js';
import { safeParseServerTimeV1 } from '../../../contracts/serverTime.v1.js';
import { safeParseXpPortVerifyResponseV1 } from '../../../contracts/xpPortVerifyResponse.v1.js';
import {
  safeParseSettingsSnapshotGetV1,
  safeParseSettingsSnapshotPutResponseV1
} from '../../../contracts/settingsSnapshot.v1.js';
import {
  safeParseSportProgramContextGetV1,
  safeParseSportProgramContextPutBodyV1,
  safeParseSportProgramContextPutResponseV1
} from '../../../contracts/sportProgramContext.v1.js';
import {
  safeParseWorkoutAggregateSnapshotGetV1,
  safeParseWorkoutAggregateSnapshotPutBodyV1,
  safeParseWorkoutAggregateSnapshotPutResponseV1
} from '../../../contracts/workoutAggregateSnapshot.v1.js';

/**
 * Base URL du backend FastAPI (même origine que l’auth livres aujourd’hui).
 */
export function getMomentumApiV1Base() {
  const fromEnv = String(import.meta.env.VITE_MOMENTUM_API_V1_BASE || '').trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const auth = String(import.meta.env.VITE_AUTH_SERVER_BASE || '').trim();
  if (auth) return auth.replace(/\/$/, '');
  return 'http://127.0.0.1:8000';
}

const DEFAULT_API_FETCH_TIMEOUT_MS = 10000;

/**
 * @param {string} url
 * @param {RequestInit} [options]
 * @param {number} [timeoutMs]
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_API_FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * GET /api/v1/health — jalon « serveur Momentum » (optionnel : drapeaux Supabase).
 *
 * @returns {Promise<import('../../../contracts/apiHealth.v1.js').MomentumApiV1Health | null>}
 */
export async function fetchMomentumApiV1Health() {
  const base = getMomentumApiV1Base();
  const res = await fetch(`${base}/api/v1/health`, {
    method: 'GET',
    headers: { Accept: 'application/json' }
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  const parsed = safeParseMomentumApiV1Health(json);
  return parsed.success ? parsed.data : null;
}

/**
 * GET /api/v1/server-time — sans auth ; horloge UTC serveur.
 *
 * @returns {Promise<import('../../../contracts/serverTime.v1.js').ServerTimeV1 | null>}
 */
export async function fetchMomentumApiV1ServerTime() {
  const base = getMomentumApiV1Base();
  const res = await fetch(`${base}/api/v1/server-time`, {
    method: 'GET',
    headers: { Accept: 'application/json' }
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  const parsed = safeParseServerTimeV1(json);
  return parsed.success ? parsed.data : null;
}

/**
 * GET /api/v1/user-profile — Bearer requis (même jeton que /auth/me).
 *
 * @param {string} accessToken
 * @returns {Promise<import('../../../contracts/userProfile.v1.js').UserProfileV1 | null>}
 */
export async function fetchMomentumApiV1UserProfile(accessToken) {
  const token = String(accessToken || '').trim();
  if (!token) return null;
  const base = getMomentumApiV1Base();
  const res = await fetch(`${base}/api/v1/user-profile`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  const parsed = safeParseUserProfileV1(json);
  return parsed.success ? parsed.data : null;
}

/**
 * POST /api/v1/intentions/mutation — Bearer + enveloppe alignée contrat Zod.
 *
 * @param {string} accessToken
 * @param {{ clientMutationId: string, intent: string, payload?: Record<string, unknown> }} envelope
 * @returns {Promise<import('../../../contracts/intentionMutationResponse.v1.js').IntentionMutationResponseV1 | null>}
 */
export async function postMomentumApiV1IntentionsMutation(accessToken, envelope) {
  const token = String(accessToken || '').trim();
  if (!token) return null;
  const parsedEnv = safeParseMutationEnvelopeV1(envelope);
  if (!parsedEnv.success) return null;
  const base = getMomentumApiV1Base();
  const res = await fetch(`${base}/api/v1/intentions/mutation`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(parsedEnv.data)
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  const parsed = safeParseIntentionMutationResponseV1(json);
  return parsed.success ? parsed.data : null;
}

/**
 * GET /api/v1/intentions/recent — Bearer requis.
 *
 * @param {string} accessToken
 * @param {number} [limit]
 * @returns {Promise<import('../../../contracts/intentionsRecent.v1.js').IntentionsRecentV1 | null>}
 */
export async function fetchMomentumApiV1IntentionsRecent(accessToken, limit = 50) {
  const token = String(accessToken || '').trim();
  if (!token) return null;
  const base = getMomentumApiV1Base();
  const q = new URLSearchParams();
  q.set('limit', String(Math.min(200, Math.max(1, Number(limit) || 50))));
  const res = await fetch(`${base}/api/v1/intentions/recent?${q}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  const parsed = safeParseIntentionsRecentV1(json);
  return parsed.success ? parsed.data : null;
}

/**
 * POST /api/v1/xp/port-verify — Bearer + corps JSON (meals, champs XP optionnels).
 *
 * @param {string} accessToken
 * @param {Record<string, unknown>} body
 * @returns {Promise<import('../../../contracts/xpPortVerifyResponse.v1.js').XpPortVerifyResponseV1 | null>}
 */
export async function postMomentumApiV1XpPortVerify(accessToken, body) {
  const token = String(accessToken || '').trim();
  if (!token) return null;
  const base = getMomentumApiV1Base();
  const res = await fetch(`${base}/api/v1/xp/port-verify`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body && typeof body === 'object' ? body : {})
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  const parsed = safeParseXpPortVerifyResponseV1(json);
  return parsed.success ? parsed.data : null;
}

/**
 * GET /api/v1/settings/snapshot — Bearer requis (pilote Phase 2 : snapshot JSON utilisateur).
 *
 * @param {string} accessToken
 * @returns {Promise<import('../../../contracts/settingsSnapshot.v1.js').SettingsSnapshotGetV1 | null>}
 */
export async function fetchMomentumApiV1SettingsSnapshot(accessToken) {
  const token = String(accessToken || '').trim();
  if (!token) return null;
  const base = getMomentumApiV1Base();
  const res = await fetch(`${base}/api/v1/settings/snapshot`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  const parsed = safeParseSettingsSnapshotGetV1(json);
  return parsed.success ? parsed.data : null;
}

/**
 * PUT /api/v1/settings/snapshot — Bearer + corps idempotent (pilote Phase 2).
 *
 * @param {string} accessToken
 * @param {{ clientMutationId: string, settings?: Record<string, unknown> }} body
 * @returns {Promise<import('../../../contracts/settingsSnapshot.v1.js').SettingsSnapshotPutResponseV1 | null>}
 */
export async function putMomentumApiV1SettingsSnapshot(accessToken, body) {
  const token = String(accessToken || '').trim();
  if (!token) return null;
  const base = getMomentumApiV1Base();
  const res = await fetch(`${base}/api/v1/settings/snapshot`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      clientMutationId: String(body?.clientMutationId || '').trim(),
      settings: body?.settings && typeof body.settings === 'object' ? body.settings : {}
    })
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  const parsed = safeParseSettingsSnapshotPutResponseV1(json);
  return parsed.success ? parsed.data : null;
}

/**
 * GET /api/v1/sport/program-context — Bearer requis (pilote : snapshot programmes / variante).
 *
 * @param {string} accessToken
 * @returns {Promise<import('../../../contracts/sportProgramContext.v1.js').SportProgramContextGetV1 | null>}
 */
export async function fetchMomentumApiV1SportProgramContext(accessToken) {
  const token = String(accessToken || '').trim();
  if (!token) return null;
  const base = getMomentumApiV1Base();
  const res = await fetch(`${base}/api/v1/sport/program-context`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  const parsed = safeParseSportProgramContextGetV1(json);
  return parsed.success ? parsed.data : null;
}

/**
 * PUT /api/v1/sport/program-context — Bearer + corps idempotent (pilote Sport).
 *
 * @param {string} accessToken
 * @param {{ clientMutationId: string, programs?: unknown[], activeProgram?: Record<string, unknown> | null, weekVariant?: string, isGymMode?: boolean }} body
 * @returns {Promise<import('../../../contracts/sportProgramContext.v1.js').SportProgramContextPutResponseV1 | null>}
 */
export async function putMomentumApiV1SportProgramContext(accessToken, body) {
  const token = String(accessToken || '').trim();
  if (!token) return null;
  const raw = {
    clientMutationId: String(body?.clientMutationId || '').trim(),
    programs: Array.isArray(body?.programs) ? body.programs : [],
    activeProgram:
      body?.activeProgram != null && typeof body.activeProgram === 'object' ? body.activeProgram : null,
    weekVariant: (() => {
      const w = String(body?.weekVariant ?? 'A').slice(0, 8);
      return w.length ? w : 'A';
    })(),
    isGymMode: !!body?.isGymMode
  };
  const parsedBody = safeParseSportProgramContextPutBodyV1(raw);
  if (!parsedBody.success) return null;
  const base = getMomentumApiV1Base();
  const res = await fetch(`${base}/api/v1/sport/program-context`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(parsedBody.data)
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  const parsed = safeParseSportProgramContextPutResponseV1(json);
  return parsed.success ? parsed.data : null;
}

/**
 * GET /api/v1/workout/aggregate — Bearer requis (pilote : snapshot agrégat workout).
 *
 * @param {string} accessToken
 * @returns {Promise<import('../../../contracts/workoutAggregateSnapshot.v1.js').WorkoutAggregateSnapshotGetV1 | null>}
 */
export async function fetchMomentumApiV1WorkoutAggregate(accessToken) {
  const token = String(accessToken || '').trim();
  if (!token) return null;
  const base = getMomentumApiV1Base();
  try {
    const res = await fetchWithTimeout(`${base}/api/v1/workout/aggregate`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    const parsed = safeParseWorkoutAggregateSnapshotGetV1(json);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * PUT /api/v1/workout/aggregate — Bearer + corps idempotent (pilote workout).
 *
 * @param {string} accessToken
 * @param {{ clientMutationId: string, aggregate?: Record<string, unknown> }} body
 * @returns {Promise<import('../../../contracts/workoutAggregateSnapshot.v1.js').WorkoutAggregateSnapshotPutResponseV1 | null>}
 */
export async function putMomentumApiV1WorkoutAggregate(accessToken, body) {
  const token = String(accessToken || '').trim();
  if (!token) return null;
  const raw = {
    clientMutationId: String(body?.clientMutationId || '').trim(),
    aggregate: body?.aggregate && typeof body.aggregate === 'object' ? body.aggregate : {}
  };
  const parsedBody = safeParseWorkoutAggregateSnapshotPutBodyV1(raw);
  if (!parsedBody.success) return null;
  const base = getMomentumApiV1Base();
  try {
    const res = await fetchWithTimeout(`${base}/api/v1/workout/aggregate`, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(parsedBody.data)
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    const parsed = safeParseWorkoutAggregateSnapshotPutResponseV1(json);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
