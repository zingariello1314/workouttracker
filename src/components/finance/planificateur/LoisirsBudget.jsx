import React, { useMemo } from 'react';
import { useTranslation } from '../../../utils/translations';

/**
 * Composant affichant le budget loisirs mensuel
 */
const LoisirsBudget = ({ budgetMensuel }) => {
  const t = useTranslation();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="loisirs-budget bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/50 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-400 mb-1">Budget Loisirs Mensuel</div>
          <div className="text-3xl font-bold text-white">
            {formatCurrency(budgetMensuel)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Défini dans la répartition salaire
          </div>
        </div>
        <div className="text-5xl">🎮</div>
      </div>

      <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
        <div className="text-xs text-slate-400 space-y-1">
          <div>💡 Utilisation flexible :</div>
          <div>• Dépenser intégralement chaque mois</div>
          <div>• Épargner plusieurs mois pour gros achat</div>
          <div>• Mixer dépenses + épargne</div>
        </div>
      </div>
    </div>
  );
};

export default LoisirsBudget;

