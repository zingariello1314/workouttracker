import { getContextRow } from '../workout/workoutContextGateway.js';
import { readServerTokens } from '../../utils/serverAuthApi.js';
import {
  fetchMomentumApiV1SportProgramContext,
  putMomentumApiV1SportProgramContext
} from '../sync/fetchMomentumApiV1.js';

const DEBOUNCE_MS = 2500;
let timerId = null;

function isSportProgramCloudSyncEnabled() {
  const v = String(import.meta.env?.VITE_SPORT_PROGRAM_CLOUD_SYNC || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

/**
 * Si le snapshot serveur est plus récent que la ligne locale, retourne le contexte à appliquer
 * (conserve `programHistory` local — non synchronisé sur le cloud dans le pilote actuel).
 *
 * @param {Record<string, unknown> | null} localRow — ligne brute `getContextRow` (incl. `lastSaved`).
 * @param {import('../../../contracts/sportProgramContext.v1.js').SportProgramContextGetV1 | null} remote
 * @returns {Record<string, unknown> | null} — payload pour `saveProgramContext` / `applyContext`, sans `id`.
 */
export function buildSportProgramContextFromCloudIfNewer(localRow, remote) {
  if (!remote || typeof remote !== 'object') return null;
  const cloudTs = String(remote.updatedAt || '').trim();
  if (!cloudTs) return null;

  const hasMeaningfulCloud =
    (Array.isArray(remote.programs) && remote.programs.length > 0) ||
    (remote.activeProgram != null &&
      typeof remote.activeProgram === 'object' &&
      Object.keys(remote.activeProgram).length > 0);

  if (!hasMeaningfulCloud) return null;

  const localTs = String(localRow?.lastSaved || '').trim();
  if (localTs && cloudTs && !(cloudTs > localTs)) return null;

  const ph =
    localRow && Array.isArray(localRow.programHistory) ? [...localRow.programHistory] : [];

  return {
    programs: Array.isArray(remote.programs) ? remote.programs : [],
    activeProgram: remote.activeProgram ?? null,
    weekVariant: remote.weekVariant || 'A',
    isGymMode: !!remote.isGymMode,
    programHistory: ph
  };
}

/**
 * GET cloud + comparaison LWW ; pas d’effet si flag désactivé ou scope anonyme.
 *
 * @param {string} contextScopeKey
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function tryMergeSportProgramContextFromCloud(contextScopeKey) {
  if (!isSportProgramCloudSyncEnabled()) return null;
  const sk = String(contextScopeKey || '').trim();
  if (!sk || sk === 'anonymous') return null;
  const { accessToken } = readServerTokens();
  if (!accessToken) return null;

  let remote;
  try {
    remote = await fetchMomentumApiV1SportProgramContext(accessToken);
  } catch {
    return null;
  }
  if (!remote) return null;

  let localRow = null;
  try {
    localRow = await getContextRow(sk);
  } catch {
    localRow = null;
  }

  return buildSportProgramContextFromCloudIfNewer(localRow, remote);
}

/**
 * Planifie un envoi debouncé du contexte programmes (LWW cloud), si le flag Vite est actif.
 *
 * @param {{ accessToken?: string | null, programs: unknown[], activeProgram: unknown, weekVariant: string, isGymMode: boolean }} args
 */
export function scheduleSportProgramContextCloudPush(args) {
  if (!isSportProgramCloudSyncEnabled()) return;
  const token = String(args?.accessToken || '').trim();
  if (!token) return;

  if (timerId != null) clearTimeout(timerId);
  timerId = setTimeout(() => {
    timerId = null;
    const clientMutationId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `sport-pc-${Date.now()}`;
    const programs = Array.isArray(args.programs) ? args.programs : [];
    const activeProgram =
      args.activeProgram != null && typeof args.activeProgram === 'object' ? args.activeProgram : null;
    putMomentumApiV1SportProgramContext(token, {
      clientMutationId,
      programs,
      activeProgram,
      weekVariant: String(args.weekVariant || 'A').slice(0, 8),
      isGymMode: !!args.isGymMode
    }).catch((err) => {
      console.warn('[sportProgramContextCloud] push échoué', err);
    });
  }, DEBOUNCE_MS);
}
