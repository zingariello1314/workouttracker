/**
 * SyntheseSubTab - Wrapper pour le module Synthèse Financière
 * Intégration dans l'onglet Finance avec Error Boundary
 */

import SyntheseTab from './SyntheseTab';
import SyntheseErrorBoundary from './SyntheseErrorBoundary';
import '../financeSmartSyntheseThemeOverrides.css';

const SyntheseSubTab = () => {
  return (
    <SyntheseErrorBoundary>
      <div className="finance-smart-synthese-scope">
        <SyntheseTab />
      </div>
    </SyntheseErrorBoundary>
  );
};

export default SyntheseSubTab;



