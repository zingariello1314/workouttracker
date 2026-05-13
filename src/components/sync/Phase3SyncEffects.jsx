import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { readServerTokens } from '../../utils/serverAuthApi';
import { isPhase3DualWriteEnabled, isPhase3MigrationOnFocusEnabled } from '../../services/sync/phase3/phase3Env';
import { migrateLocalDataToBackend } from '../../services/sync/phase3/migrateLocalDataToBackend';

/**
 * Effets globaux Phase 3 : flush outbox après auth ; optionnel au focus fenêtre.
 */
export default function Phase3SyncEffects() {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!isPhase3DualWriteEnabled() || loading || !isAuthenticated) return undefined;
    const { accessToken } = readServerTokens();
    if (!accessToken) return undefined;
    let cancelled = false;
    (async () => {
      try {
        if (!cancelled) await migrateLocalDataToBackend(accessToken);
      } catch {
        /* journal côté migrate si besoin */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, loading]);

  useEffect(() => {
    if (!isPhase3DualWriteEnabled() || !isPhase3MigrationOnFocusEnabled()) return undefined;
    const onFocus = () => {
      const { accessToken } = readServerTokens();
      if (!accessToken) return;
      migrateLocalDataToBackend(accessToken).catch(() => {});
    };
    if (typeof window === 'undefined') return undefined;
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  return null;
}
