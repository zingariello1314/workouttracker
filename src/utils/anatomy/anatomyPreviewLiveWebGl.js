/**
 * Drills / pliométrie / réf. cardio course : pas de .webp dédié → WebGL direct (évite cadre noir).
 */
import { stretchDatabase } from '../../data/stretchDatabase';

export function shouldUseLiveAnatomyWebGl({ stretchDatabaseKey, mode, exerciseDatabaseKey }) {
  if (mode !== 'stretch' && typeof exerciseDatabaseKey === 'string' && exerciseDatabaseKey.startsWith('cardio_')) {
    return true;
  }
  if (mode !== 'stretch' || !stretchDatabaseKey) return false;
  const key = String(stretchDatabaseKey);
  if (key.startsWith('drill_') || key.startsWith('pliometrie_')) return true;
  const entry = stretchDatabase[key];
  const cat = String(entry?.category || '');
  return cat === 'Drills course' || cat === 'Pliométrie';
}
