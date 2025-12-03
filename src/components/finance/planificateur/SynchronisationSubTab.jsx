import React from 'react';
import { useTranslation } from '../../../utils/translations';

const SynchronisationSubTab = () => {
  const t = useTranslation();

  return (
    <div className="synchronisation-sub-tab">
      <h3 className="text-2xl font-bold text-white mb-6">
        {t('finance.planificateur.sync.title')}
      </h3>
      <div className="text-center py-12 text-slate-400">
        <div className="text-6xl mb-4">🔄</div>
        <p className="text-lg mb-2">En cours de développement</p>
        <p className="text-sm">Synchronisation cross-modules</p>
      </div>
    </div>
  );
};

export default SynchronisationSubTab;

