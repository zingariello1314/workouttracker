import { useRemoteSettingsUiSync } from '../../hooks/useRemoteSettingsUiSync';

/** Hydratation / push distants swipe + langue (`/v1/settings/ui` ou snapshot Phase 2 selon flags). */
export default function SettingsUiRemoteSyncEffects() {
  useRemoteSettingsUiSync();
  return null;
}
