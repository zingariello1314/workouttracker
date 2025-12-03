import React from 'react';

/**
 * Composant affichant les statuts visuels des achats
 */
const StatutsVisuels = ({ statut }) => {
  const statutsConfig = {
    'planifie': { icon: '📌', label: 'Prévu', color: 'bg-blue-600/30 text-blue-300 border-blue-500/50' },
    'a-venir': { icon: '⏰', label: 'À venir', color: 'bg-yellow-600/30 text-yellow-300 border-yellow-500/50' },
    'realise': { icon: '✅', label: 'Réalisé', color: 'bg-green-600/30 text-green-300 border-green-500/50' },
    'depassement': { icon: '🔴', label: 'Dépassement', color: 'bg-red-600/30 text-red-300 border-red-500/50' },
    'annule': { icon: '❌', label: 'Annulé', color: 'bg-slate-600/30 text-slate-300 border-slate-500/50' },
    'reporte': { icon: '🔄', label: 'Reporté', color: 'bg-orange-600/30 text-orange-300 border-orange-500/50' }
  };

  const config = statutsConfig[statut] || statutsConfig['planifie'];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${config.color}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};

export default StatutsVisuels;

