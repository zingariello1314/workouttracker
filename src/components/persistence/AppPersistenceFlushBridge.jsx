import { useEffect } from 'react';
import { flushAllAppPersistence } from '../../services/persistence/appPersistenceFlush.js';

/**
 * Flush global avant fermeture / rechargement de l’onglet navigateur.
 */
export default function AppPersistenceFlushBridge() {
  useEffect(() => {
    const onHide = () => {
      void flushAllAppPersistence();
    };
    window.addEventListener('pagehide', onHide);
    window.addEventListener('beforeunload', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('beforeunload', onHide);
    };
  }, []);
  return null;
}
