import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../utils/translations';
import { FinanceProvider } from '../../context/FinanceContext';
import BourseSubTab from '../finance/bourse/BourseSubTab';
import BudgetSubTab from '../finance/budget/BudgetSubTab';
import InvestissementsSubTab from '../finance/investissements/InvestissementsSubTab';
import SmartShoppingSubTab from '../finance/smartShopping/SmartShoppingSubTab';
import PlanificateurSubTab from '../finance/planificateur/PlanificateurSubTab';
import SyntheseSubTab from '../finance/synthese/SyntheseSubTab';

const FinanceTab = () => {
  const t = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState('bourse');

  // Émettre un événement lors du changement de sous-onglet pour la rotation des images de profil
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('tab-change', { 
      detail: { tab: activeSubTab, isSubTab: true } 
    }));
  }, [activeSubTab]);

  const subTabs = [
    { id: 'bourse', labelKey: 'finance.subTabs.bourse', icon: '📈' },
    { id: 'budget', labelKey: 'finance.subTabs.budget', icon: '💰' },
    { id: 'investissements', labelKey: 'finance.subTabs.investissements', icon: '🥇' },
    { id: 'smart-shopping', labelKey: 'finance.subTabs.smartShopping', icon: '🛒' },
    { id: 'planificateur', labelKey: 'finance.subTabs.planificateur', icon: '📅' },
    { id: 'synthese', labelKey: 'finance.subTabs.synthese', icon: '📊' }
  ];

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'bourse':
        return <BourseSubTab />;
      case 'budget':
        return <BudgetSubTab />;
      case 'investissements':
        return <InvestissementsSubTab />;
      case 'smart-shopping':
        return <SmartShoppingSubTab />;
      case 'planificateur':
        return <PlanificateurSubTab />;
      case 'synthese':
        return <SyntheseSubTab />;
      default:
        return <BourseSubTab />;
    }
  };

  return (
    <FinanceProvider>
      <div className="finance-tab-container min-h-[calc(100vh-140px)]">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('finance.title')}
          </h1>
          <p className="text-slate-400">
            {t('finance.subtitle')}
          </p>
        </div>

        {/* Navigation sous-onglets */}
        <div className="finance-sidebar mb-6">
          <nav className="sub-tabs-navigation flex flex-wrap gap-2">
            {subTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`sub-tab-button flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeSubTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="font-medium">{t(tab.labelKey)}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Contenu sous-onglet actif */}
        <div className="finance-main-content bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          {renderSubTabContent()}
        </div>
      </div>
      </div>
    </FinanceProvider>
  );
};

export default FinanceTab;
