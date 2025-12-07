import React from 'react';

const ExpenseStatus = ({ statut, priorite }) => {
  const getStatusConfig = (statut) => {
    const configs = {
      planifie: { icon: '📌', label: 'Planifié', color: 'text-blue-400' },
      confirme: { icon: '🎯', label: 'Confirmé', color: 'text-green-400' },
      imminent: { icon: '⏰', label: 'Imminent', color: 'text-yellow-400' },
      realise: { icon: '✅', label: 'Réalisé', color: 'text-slate-400' },
      analyse: { icon: '📊', label: 'Analysé', color: 'text-purple-400' },
      depassement: { icon: '🔴', label: 'Dépassement', color: 'text-red-400' },
      impact: { icon: '⚠️', label: 'Impact budget', color: 'text-orange-400' },
      reajustement: { icon: '🔄', label: 'Réajustement', color: 'text-blue-400' },
      optimise: { icon: '✨', label: 'Optimisé', color: 'text-green-400' },
      annule: { icon: '❌', label: 'Annulé', color: 'text-red-400' },
      economie: { icon: '💡', label: 'Économie', color: 'text-green-400' },
      reinvestissement: { icon: '📈', label: 'Réinvestissement', color: 'text-blue-400' },
      bonus: { icon: '🎉', label: 'Bonus épargne', color: 'text-green-400' }
    };
    return configs[statut] || configs.planifie;
  };

  const config = getStatusConfig(statut);

  return (
    <div className={`flex items-center gap-2 ${config.color}`}>
      <span className="text-lg">{config.icon}</span>
      <span className="text-sm font-medium">{config.label}</span>
      {priorite === 'urgent' && (
        <span className="text-xs bg-red-600/30 text-red-300 px-2 py-1 rounded">
          Urgent
        </span>
      )}
    </div>
  );
};

export default ExpenseStatus;



