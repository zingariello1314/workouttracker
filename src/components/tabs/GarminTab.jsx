import React from 'react';
import { useGarminTabContainer } from './GarminTab/components/GarminTabContainer';
import { GarminTabView } from './GarminTab/components/GarminTabView';

/**
 * Composant principal GarminTab
 * 
 * Architecture Container/View :
 * - Container (useGarminTabContainer) : logique, hooks, state, effets
 * - View (GarminTabView) : présentation pure, JSX uniquement
 * 
 * Avantages :
 * - Séparation claire des responsabilités
 * - Testabilité améliorée (Container testable isolément, View testable avec props mockées)
 * - Réduction des re-renders (isolation DebugPanel via portail)
 * - Maintenabilité accrue
 */
const GarminTab = () => {
  const containerProps = useGarminTabContainer();

  return <GarminTabView {...containerProps} />;
};

export default GarminTab;
