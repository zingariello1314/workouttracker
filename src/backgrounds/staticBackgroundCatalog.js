/**
 * Fonds d’écran statiques pour l’app (hors page d’accueil).
 * Sources = banque wallpaper-bank (mêmes fichiers que les bannières).
 * Pour en ajouter : une entrée ici suffit — pas de composant React dédié.
 */
import { createElement } from 'react';

/** @typedef {{ id: string, name: string, src: string, thumb?: string, theme?: string }} StaticBackgroundDef */

/** @type {StaticBackgroundDef[]} */
export const STATIC_BACKGROUND_DEFS = [
  {
    id: 'static-alchimie',
    name: 'Alchimie nocturne',
    theme: 'Scènes',
    src: '/wallpaper-bank/full/w201.png',
    thumb: '/wallpaper-bank/thumbs/w201.webp',
  },
  {
    id: 'static-atelier',
    name: 'Atelier pastel',
    theme: 'Art',
    src: '/wallpaper-bank/full/w202.png',
    thumb: '/wallpaper-bank/thumbs/w202.webp',
  },
  {
    id: 'static-atrium-aqua',
    name: 'Atrium aquatique',
    theme: 'Cyberpunk',
    src: '/wallpaper-bank/full/w203.png',
    thumb: '/wallpaper-bank/thumbs/w203.webp',
  },
  {
    id: 'static-atrium-neon',
    name: 'Atrium reflets néon',
    theme: 'Cyberpunk',
    src: '/wallpaper-bank/full/w204.png',
    thumb: '/wallpaper-bank/thumbs/w204.webp',
  },
  {
    id: 'static-avion',
    name: 'Ville en ruines',
    theme: 'Urbain',
    src: '/wallpaper-bank/full/w208.png',
    thumb: '/wallpaper-bank/thumbs/w208.webp',
  },
  {
    id: 'static-balcons',
    name: 'Balcons brumeux',
    theme: 'Nature',
    src: '/wallpaper-bank/full/w209.png',
    thumb: '/wallpaper-bank/thumbs/w209.webp',
  },
  {
    id: 'static-bar-japon',
    name: 'Bar aux cerisiers',
    theme: 'Japon',
    src: '/wallpaper-bank/full/w212.png',
    thumb: '/wallpaper-bank/thumbs/w212.webp',
  },
  {
    id: 'static-cavalier',
    name: 'Cavalier orageux',
    theme: 'Action',
    src: '/wallpaper-bank/full/w216.png',
    thumb: '/wallpaper-bank/thumbs/w216.webp',
  },
  {
    id: 'static-cerveau',
    name: 'Cerveau glitché',
    theme: 'Sombre',
    src: '/wallpaper-bank/full/w217.png',
    thumb: '/wallpaper-bank/thumbs/w217.webp',
  },
  {
    id: 'static-chambre-neon',
    name: 'Chambre panoramique néon',
    theme: 'Cyberpunk',
    src: '/wallpaper-bank/full/w218.png',
    thumb: '/wallpaper-bank/thumbs/w218.webp',
  },
  {
    id: 'static-clairiere',
    name: 'Clairière brumeuse',
    theme: 'Nature',
    src: '/wallpaper-bank/full/w237.png',
    thumb: '/wallpaper-bank/thumbs/w237.webp',
  },
  {
    id: 'static-parking-neige',
    name: 'Parking enneigé',
    theme: 'Hiver',
    src: '/wallpaper-bank/full/w264.png',
    thumb: '/wallpaper-bank/thumbs/w264.webp',
  },
  {
    id: 'static-metropole',
    name: 'Métropole Art déco',
    theme: 'Cyberpunk',
    src: '/wallpaper-bank/full/w258.png',
    thumb: '/wallpaper-bank/thumbs/w258.webp',
  },
  {
    id: 'static-nuit-mer',
    name: 'Nuit étoilée en mer',
    theme: 'Nature',
    src: '/wallpaper-bank/full/w260.png',
    thumb: '/wallpaper-bank/thumbs/w260.webp',
  },
  {
    id: 'static-guerrier-horizon',
    name: 'Guerrier à l’horizon',
    theme: 'Action',
    src: '/wallpaper-bank/full/w244.png',
    thumb: '/wallpaper-bank/thumbs/w244.webp',
  },
  {
    id: 'static-village-lanternes',
    name: 'Village aux lanternes',
    theme: 'Japon',
    src: '/wallpaper-bank/full/w280.png',
    thumb: '/wallpaper-bank/thumbs/w280.webp',
  },
];

function makeStaticThumbnail(def) {
  const src = def.thumb || def.src;
  return function StaticBackgroundThumbnail() {
    return createElement('img', {
      src,
      alt: '',
      className: 'absolute inset-0 h-full w-full object-cover',
      loading: 'lazy',
      decoding: 'async',
      'aria-hidden': 'true',
    });
  };
}

/**
 * Convertit le catalogue en options compatibles backgroundRegistry.
 */
export function listStaticBackgroundOptions() {
  return STATIC_BACKGROUND_DEFS.map((def) => ({
    id: def.id,
    name: def.name,
    type: 'static',
    theme: def.theme,
    params: { src: def.src },
    load: () => import('./StaticImageBackground'),
    loadThumbnail: () =>
      Promise.resolve({
        default: makeStaticThumbnail(def),
      }),
    fallbackBackground: '#0a0a0a',
  }));
}

export function isStaticBackgroundId(id) {
  return STATIC_BACKGROUND_DEFS.some((def) => def.id === id);
}
