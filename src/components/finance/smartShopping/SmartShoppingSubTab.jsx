import React from 'react';
import { useTranslation } from '../../../utils/translations';

const SmartShoppingSubTab = () => {
  const t = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="text-6xl mb-6">🛒</div>
      <h2 className="text-2xl font-bold text-white mb-4">
        {t('finance.subTabs.smartShopping')}
      </h2>
      <p className="text-lg text-slate-300 mb-4">
        {t('finance.underDevelopment')}
      </p>
      <div className="inline-block bg-blue-600/20 border border-blue-500/50 rounded-lg px-6 py-3 text-blue-300">
        <p className="text-sm font-medium">
          {t('finance.comingSoon')}
        </p>
      </div>
    </div>
  );
};

export default SmartShoppingSubTab;

