/**
 * Drills / pliométrie : pas de .webp pré-généré → éviter le cycle img 404 + file WebGL.
 */
import { stretchDatabase } from '../../data/stretchDatabase';

export function shouldUseLiveAnatomyWebGl({ stretchDatabaseKey, mode }) {
  if (mode !== 'stretch' || !stretchDatabaseKey) return false;
  const key = String(stretchDatabaseKey);
  if (key.startsWith('drill_') || key.startsWith('pliometrie_')) return true;
  const entry = stretchDatabase[key];
  const cat = String(entry?.category || '');
  return cat === 'Drills course' || cat === 'Pliométrie';
}
