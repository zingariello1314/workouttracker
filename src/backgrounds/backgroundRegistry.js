import { getVariant, listVariants } from './backgroundVariants';
import { normalizeParams, studioFor } from './backgroundStudio';
export const DEFAULT_BACKGROUND_ID = 'momentum';

/**
 * Un fond enregistré.
 * Pour en ajouter un : créer le composant (il remplit son parent en
 * `position: absolute; inset: 0`, `pointer-events: none`, sans `z-index`
 * négatif — le cadre autour est déjà derrière l'interface), une miniature
 * statique, puis une entrée ici. Le `fallbackBackground` ne doit rester
 * visible que le temps du premier pixel : le canvas se pose au-dessus.
 * Ne pas monter le shader réel dans la miniature.
 *
 * @typedef {Object} BackgroundOption
 * @property {string} id
 * @property {string} name
 * @property {'animated' | 'static'} type
 * @property {() => Promise<{ default: import('react').ComponentType<{ className?: string }> }>} load
 * @property {() => Promise<{ default: import('react').ComponentType }>} loadThumbnail
 * @property {string} fallbackBackground dégradé visible le temps que le calque se prépare
 */

/** @type {BackgroundOption[]} */
export const backgroundOptions = [
  {
    id: DEFAULT_BACKGROUND_ID,
    name: 'Momentum',
    type: 'animated',
    load: () => import('../components/ui/AnimatedBackground'),
    loadThumbnail: () => import('./thumbnails/MomentumBackgroundThumbnail'),
    fallbackBackground: 'linear-gradient(135deg, #0a2e1a 0%, #1a4d2e 50%, #0a2e1a 100%)',
  },
  {
    id: 'particle-saturn',
    name: 'Saturne',
    type: 'animated',
    load: () => import('./ParticleSaturnBackground'),
    loadThumbnail: () => import('./thumbnails/ParticleSaturnThumbnail'),
    fallbackBackground: 'linear-gradient(180deg, #07060a 0%, #1a1408 100%)',
  },
  {
    id: 'accretion-disc-03',
    name: "Disque d'accrétion",
    type: 'animated',
    load: () => import('./AccretionDiscBackground'),
    loadThumbnail: () => import('./thumbnails/AccretionDiscThumbnail'),
    fallbackBackground: 'linear-gradient(180deg, #000000 0%, #07001a 100%)',
  },
  {
    id: 'chain-vortex',
    name: 'Vortex de chaînes',
    type: 'animated',
    load: () => import('./ChainVortexBackground'),
    loadThumbnail: () => import('./thumbnails/ChainVortexThumbnail'),
    fallbackBackground: 'linear-gradient(180deg, #070000 0%, #1a0808 100%)',
  },
  {
    id: 'chrome-cells',
    name: 'Cellules chromées',
    type: 'animated',
    load: () => import('./ChromeCellsBackground'),
    loadThumbnail: () => import('./thumbnails/ChromeCellsThumbnail'),
    fallbackBackground: 'linear-gradient(180deg, #040405 0%, #161618 100%)',
  },
  {
    id: 'cosmic-bg',
    name: 'Cosmos',
    type: 'animated',
    load: () => import('./CosmicBackground'),
    loadThumbnail: () => import('./thumbnails/CosmicThumbnail'),
    fallbackBackground: 'linear-gradient(180deg, #05010f 0%, #1a0533 100%)',
  },
  {
    id: 'grass-field',
    name: "Champ d'herbe",
    type: 'animated',
    load: () => import('./GrassFieldBackground'),
    loadThumbnail: () => import('./thumbnails/GrassFieldThumbnail'),
    fallbackBackground: 'linear-gradient(180deg, #000000 0%, #062000 100%)',
  },
  {
    id: 'tornado',
    name: 'Tornade',
    type: 'animated',
    load: () => import('./TornadoBackground'),
    loadThumbnail: () => import('./thumbnails/TornadoThumbnail'),
    fallbackBackground: 'linear-gradient(180deg, #000000 0%, #2a120c 100%)',
  },
  {
    id: 'lattice-flight',
    name: 'Vol de lattice',
    type: 'animated',
    load: () => import('./LatticeFlightBackground'),
    loadThumbnail: () => import('./thumbnails/LatticeFlightThumbnail'),
    fallbackBackground: 'linear-gradient(180deg, #000000 0%, #001820 100%)',
  },
];

const byId = new Map(backgroundOptions.map((option) => [option.id, option]));

const BASE_NAMES = new Set(backgroundOptions.map((option) => option.name.trim().toLocaleLowerCase('fr')));

function variantToOption(variant) {
  const base = byId.get(variant.baseId);
  if (!base || !studioFor(variant.baseId)) return null;
  return {
    ...base,
    id: variant.id,
    name: variant.name,
    params: normalizeParams(variant.baseId, variant.params),
    baseId: variant.baseId,
    variant: true
  };
}

export function listBackgroundOptions() {
  const created = listVariants().map(variantToOption).filter(Boolean);
  return [...backgroundOptions, ...created];
}

export function baseNameTaken(name) {
  return BASE_NAMES.has(String(name || '').trim().toLocaleLowerCase('fr'));
}

export function getDefaultBackgroundOption() {
  return byId.get(DEFAULT_BACKGROUND_ID) || backgroundOptions[0];
}

/** Retourne l’option demandée, ou le fond par défaut si l’id est absent ou inconnu. */
export function getBackgroundOption(id) {
  if (typeof id === 'string' && byId.has(id)) return byId.get(id);
  if (typeof id === 'string') {
    const variant = getVariant(id);
    const option = variant ? variantToOption(variant) : null;
    if (option) return option;
  }
  return getDefaultBackgroundOption();
}

export function isKnownBackgroundId(id) {
  if (typeof id !== 'string') return false;
  if (byId.has(id)) return true;
  return Boolean(getVariant(id) && variantToOption(getVariant(id)));
}
