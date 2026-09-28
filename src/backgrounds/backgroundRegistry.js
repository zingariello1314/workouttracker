/** Identifiant du fond historique. Utilisé si rien n’est enregistré ou si l’id stocké n’existe plus. */
export const DEFAULT_BACKGROUND_ID = 'momentum';

/**
 * Un fond enregistré.
 * Pour en ajouter un : créer le composant (plein écran, `pointer-events: none`,
 * nettoyage dans le cleanup de son effet) et une miniature statique, puis pousser
 * une entrée ici. Ne pas monter le shader réel dans la miniature.
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
];

const byId = new Map(backgroundOptions.map((option) => [option.id, option]));

export function getDefaultBackgroundOption() {
  return byId.get(DEFAULT_BACKGROUND_ID) || backgroundOptions[0];
}

/** Retourne l’option demandée, ou le fond par défaut si l’id est absent ou inconnu. */
export function getBackgroundOption(id) {
  if (typeof id === 'string' && byId.has(id)) return byId.get(id);
  return getDefaultBackgroundOption();
}

export function isKnownBackgroundId(id) {
  return typeof id === 'string' && byId.has(id);
}
