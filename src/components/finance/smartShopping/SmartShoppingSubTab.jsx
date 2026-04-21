/**
 * SmartShoppingSubTab - Wrapper pour le module Smart Shopping
 * Intégration dans l'onglet Finance avec Error Boundary
 */

import SmartShoppingTab from './SmartShoppingTab';
import SmartShoppingErrorBoundary from './SmartShoppingErrorBoundary';
import '../financeSmartSyntheseThemeOverrides.css';

const SmartShoppingSubTab = () => {
  return (
    <SmartShoppingErrorBoundary>
      <div className="finance-smart-synthese-scope">
        <SmartShoppingTab />
      </div>
    </SmartShoppingErrorBoundary>
  );
};

export default SmartShoppingSubTab;



