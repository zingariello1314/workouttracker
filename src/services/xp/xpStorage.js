/**
 * Service de stockage pour le système XP centralisé
 * Délègue à `LocalXpRepository` / passerelle IndexedDB (`xpDbGateway`).
 */

import { openXpSystemDb } from './xpDbGateway.js';
import { createXpRepository } from './createXpRepository.js';

let _repo;
const getLocalRepo = () => {
  if (typeof window === 'undefined') return null;
  if (!_repo) _repo = createXpRepository('local');
  return _repo;
};

/** @deprecated préférer `openXpSystemDb` depuis `xpDbGateway` — conservé pour compat. */
export const openXPDB = openXpSystemDb;

export const saveXPData = async (xpData) => {
  const repo = getLocalRepo();
  if (repo) {
    return repo.save(xpData);
  }
  try {
    if (!xpData || xpData.userId === undefined || xpData.userId === null) return;
    const key = `xpData_${xpData.userId}`;
    localStorage.setItem(
      key,
      JSON.stringify({
        ...xpData,
        lastUpdated: new Date().toISOString(),
      })
    );
  } catch (e) {
    console.error('[XPStorage] Erreur fallback SSR:', e);
  }
};

export const loadXPData = async (userId) => {
  const repo = getLocalRepo();
  if (repo) {
    return repo.loadByUserId(String(userId));
  }
  try {
    const key = `xpData_${userId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('[XPStorage] Erreur chargement:', error);
    return null;
  }
};
