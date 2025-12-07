/**
 * SmartShoppingSubTab - Wrapper pour le module Smart Shopping
 * Intégration dans l'onglet Finance avec Error Boundary
 */

import SmartShoppingTab from './SmartShoppingTab';
import SmartShoppingErrorBoundary from './SmartShoppingErrorBoundary';

const SmartShoppingSubTab = () => {
  return (
    <SmartShoppingErrorBoundary>
      <SmartShoppingTab />
    </SmartShoppingErrorBoundary>
  );
};

export default SmartShoppingSubTab;



