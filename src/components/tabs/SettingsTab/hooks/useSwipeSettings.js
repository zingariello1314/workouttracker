/**
 * Hook useSwipeSettings - Paramètres de navigation par swipe
 * 
 * ✅ PHASE 4 : Extraction de la logique des paramètres de swipe
 * 
 * Gère l'activation/désactivation et le threshold de la navigation par swipe
 * 
 * @module components/tabs/SettingsTab/hooks/useSwipeSettings
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  getSettings as getSwipeSettings, 
  saveSettings as saveSwipeSettings 
} from '../../../../services/swipeNavigationSettings';

/**
 * Hook pour gérer les paramètres de navigation par swipe
 * 
 * @returns {Object} { 
 *   swipeEnabled, 
 *   swipeThreshold, 
 *   swipeSettingsStatus,
 *   handleSwipeEnabledChange,
 *   handleSwipeThresholdChange
 * }
 */
export const useSwipeSettings = () => {
  const [swipeEnabled, setSwipeEnabled] = useState(true);
  const [swipeThreshold, setSwipeThreshold] = useState(100);
  const [swipeSettingsStatus, setSwipeSettingsStatus] = useState(null); // 'success' | 'error' | null

  // Charger les paramètres de swipe navigation au montage
  useEffect(() => {
    const settings = getSwipeSettings();
    setSwipeEnabled(settings.enabled);
    setSwipeThreshold(settings.threshold);
  }, []);

  const handleSwipeEnabledChange = useCallback((enabled) => {
    setSwipeEnabled(enabled);
    const success = saveSwipeSettings({
      enabled,
      threshold: swipeThreshold,
      velocityThreshold: 0.5,
    });
    
    if (success) {
      // Dispatch custom event to notify HomePage of settings change
      window.dispatchEvent(new CustomEvent('swipeSettingsUpdated'));
      setSwipeSettingsStatus('success');
      setTimeout(() => setSwipeSettingsStatus(null), 2000);
    } else {
      setSwipeSettingsStatus('error');
      setTimeout(() => setSwipeSettingsStatus(null), 3000);
    }
  }, [swipeThreshold]);

  const handleSwipeThresholdChange = useCallback((threshold) => {
    setSwipeThreshold(threshold);
    const success = saveSwipeSettings({
      enabled: swipeEnabled,
      threshold,
      velocityThreshold: 0.5,
    });
    
    if (success) {
      // Dispatch custom event to notify HomePage of settings change
      window.dispatchEvent(new CustomEvent('swipeSettingsUpdated'));
      setSwipeSettingsStatus('success');
      setTimeout(() => setSwipeSettingsStatus(null), 2000);
    } else {
      setSwipeSettingsStatus('error');
      setTimeout(() => setSwipeSettingsStatus(null), 3000);
    }
  }, [swipeEnabled]);

  return {
    swipeEnabled,
    swipeThreshold,
    swipeSettingsStatus,
    handleSwipeEnabledChange,
    handleSwipeThresholdChange,
  };
};

export default useSwipeSettings;
