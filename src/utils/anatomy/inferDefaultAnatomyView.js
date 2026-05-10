import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import { VISUAL_GROUP_SURFACE_BIAS } from './visualGroupMeta';

/** Clés alignées sur `BODY_VIEW_PRESETS` (BodyMap / AnatomyHighlight). */
export const ANATOMY_VIEW_KEYS = [
  'frontLow',
  'frontHighWide',
  'frontWideHang',
  'front',
  'back',
  'backLower',
  'side',
  'top'
];

/**
 * Choisit une vue caméra par défaut selon les zones sollicitées (primaires ×2, secondaires ×1).
 * Objectif : éviter « dos » coloré avec caméra face uniquement.
 */
export function inferDefaultAnatomyView(primaryIds, secondaryIds) {
  const G = MuscleGroups;
  const p = primaryIds instanceof Set ? primaryIds : new Set(primaryIds || []);
  const s = secondaryIds instanceof Set ? secondaryIds : new Set(secondaryIds || []);

  let posterior = 0;
  let anterior = 0;
  let lateral = 0;

  const bump = (id, w) => {
    const bias = VISUAL_GROUP_SURFACE_BIAS[id];
    if (!bias) return;
    if (bias === 'posterior') posterior += w;
    else if (bias === 'anterior') anterior += w;
    else if (bias === 'lateral') lateral += w;
  };

  p.forEach((id) => bump(id, 2));
  s.forEach((id) => bump(id, 1));

  /** Postérieur jambe mollet /ischio bien cadrés (sans cuisse avant dominante). */
  /** Primaires mollets/arrière cuisse uniquement ; pas de primaire cuisse avant (épargne les mouvements « mollets stabilisateurs » au secondaire). */
  const posteriorLegLean =
    !p.has(G.QUADS) && (p.has(G.CALVES) || p.has(G.HAMSTRINGS));

  if (p.has(G.FULL_BODY) || s.has(G.FULL_BODY)) {
    return 'frontLow';
  }

  /** Mollets/isochios/arrière cuisse avant mollets au secondaire (ex. tibialis+molets). */
  if (posteriorLegLean) {
    return 'backLower';
  }

  /** Trapèzes / épaules : mieux vaut un trois-quarts que la face pure. */
  if (lateral >= 2 && anterior + posterior <= 1) {
    return 'frontLow';
  }

  /** Core primaire sans dos en primaire : privilégier face élargie (gainage abdo). */
  if (p.has(G.CORE) && !p.has(G.BACK) && anterior >= posterior - 1) {
    return 'frontHighWide';
  }

  const domPost = posterior - anterior;
  const domAnt = anterior - posterior;

  if (domPost >= 2) return 'back';
  if (domAnt >= 2) return 'front';
  if (domPost > 0 && domAnt <= 0) return 'back';
  if (domAnt > 0 && domPost <= 0) return 'front';
  if (posterior > 0 && anterior > 0) return 'frontLow';
  return 'frontLow';
}
