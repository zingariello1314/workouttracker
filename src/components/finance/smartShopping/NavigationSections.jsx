/**
 * Navigation Sections - Navigation Smart Shopping
 * 
 * ✅ PHASE 2 - Étape 2.2 : Composant extrait de SmartShoppingTab
 */

import React, { memo } from 'react';
import { BarChart3, Target, List, Zap, Package, Activity, Settings } from 'lucide-react';

const NavigationSections = memo(({ activeSection, onSectionChange }) => {
  const sections = [
    { id: 'command-center', icon: BarChart3, label: 'Command Center', ariaLabel: 'Afficher le command center' },
    { id: 'workflow', icon: Target, label: 'Workflow', ariaLabel: 'Workflow complet' },
    { id: 'listes', icon: List, label: 'Mes Listes', ariaLabel: 'Afficher les listes' },
    { id: 'execution', icon: Zap, label: 'Exécution', ariaLabel: 'Mode exécution' },
    { id: 'inventaire', icon: Package, label: 'Inventaire', ariaLabel: 'Gérer inventaire' },
    { id: 'analytics', icon: Activity, label: 'Analytics', ariaLabel: 'Voir analytics' },
    { id: 'settings', icon: Settings, label: 'Paramètres', ariaLabel: 'Paramètres' }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {sections.map(({ id, icon: Icon, label, ariaLabel }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSectionChange(id)}
          className={`gradient-button-premium gradient-button-premium-md rounded-lg flex flex-col items-center gap-2 ${
            activeSection === id
              ? 'gradient-button-premium-variant'
              : ''
          }`}
          aria-label={ariaLabel}
        >
          <Icon className={`w-5 h-5 transition-transform duration-300 ${activeSection === id ? 'rotate-12' : 'group-hover:rotate-12'}`} />
          <span className="text-xs sm:text-sm">{label}</span>
        </button>
      ))}
    </div>
  );
});

NavigationSections.displayName = 'NavigationSections';

export default NavigationSections;
