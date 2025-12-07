/**
 * SyntheseSubTab - Wrapper pour le module Synthèse Financière
 * Intégration dans l'onglet Finance avec Error Boundary
 */

import SyntheseTab from './SyntheseTab';
import SyntheseErrorBoundary from './SyntheseErrorBoundary';

const SyntheseSubTab = () => {
  return (
    <SyntheseErrorBoundary>
      <SyntheseTab />
    </SyntheseErrorBoundary>
  );
};

export default SyntheseSubTab;



