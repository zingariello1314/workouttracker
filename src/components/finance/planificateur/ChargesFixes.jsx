/**
 * ChargesFixes - Visualisation des charges fixes mensuelles
 */

import React from 'react';
import { Home, TrendingUp, Coins, Wallet } from 'lucide-react';
import { useTranslation } from '../../../utils/translations';

const ChargesFixes = ({ chargesFixes, repartition }) => {
  const t = useTranslation();

  // Construire la liste des charges depuis la répartition
  const charges = React.useMemo(() => {
    if (!repartition) return [];

    const baseCharges = [
      {
        type: 'loyer',
        montant: repartition.loyer || 0,
        frequence: 'mensuel',
        icone: Home,
        couleur: 'text-purple-400',
        bgCouleur: 'bg-purple-900/30',
        borderCouleur: 'border-purple-500/50'
      },
      {
        type: 'or',
        montant: repartition.investissementOr || 0,
        frequence: 'mensuel',
        icone: Coins,
        couleur: 'text-yellow-400',
        bgCouleur: 'bg-yellow-900/30',
        borderCouleur: 'border-yellow-500/50'
      },
      {
        type: 'bourse',
        montant: repartition.investissementBourse || 0,
        frequence: 'mensuel',
        icone: TrendingUp,
        couleur: 'text-blue-400',
        bgCouleur: 'bg-blue-900/30',
        borderCouleur: 'border-blue-500/50'
      },
      {
        type: 'cash',
        montant: repartition.cashAccumulation || 0,
        frequence: 'mensuel',
        icone: Wallet,
        couleur: 'text-emerald-400',
        bgCouleur: 'bg-emerald-900/30',
        borderCouleur: 'border-emerald-500/50'
      }
    ].filter(charge => charge.montant > 0);

    const customCharges = (repartition.categories || [])
      .filter(cat => ['investissement', 'charges', 'epargne'].includes(cat.type) && cat.montant > 0)
      .map(cat => ({
        type: cat.type,
        montant: cat.montant,
        frequence: 'mensuel',
        icone: Wallet,
        couleur: 'text-orange-400',
        bgCouleur: 'bg-orange-900/30',
        borderCouleur: 'border-orange-500/50',
        label: cat.label
      }));

    return [...baseCharges, ...customCharges];
  }, [repartition]);

  const totalCharges = charges.reduce((sum, charge) => sum + charge.montant, 0);

  if (charges.length === 0) {
    return (
      <div className="charges-fixes bg-slate-800/50 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">
          {t('finance.planificateur.3ans.chargesFixes')}
        </h3>
        <div className="text-center py-8 text-slate-400">
          <Wallet size={48} className="mx-auto mb-3 opacity-50" />
          <p>Aucune charge fixe définie</p>
          <p className="text-sm mt-2">Configurez votre répartition salaire pour voir vos charges</p>
        </div>
      </div>
    );
  }

  return (
    <div className="charges-fixes bg-slate-800/50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">
          {t('finance.planificateur.3ans.chargesFixes')}
        </h3>
        <div className="text-right">
          <div className="text-sm text-slate-400">Total mensuel</div>
          <div className="text-2xl font-bold text-white">
            {totalCharges.toLocaleString('fr-FR')}€
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {charges.map((charge) => {
          const Icon = charge.icone;
          const pourcentage = repartition?.netMensuel 
            ? ((charge.montant / repartition.netMensuel) * 100).toFixed(1)
            : 0;

          return (
            <div
              key={charge.type}
              className={`charge-item ${charge.bgCouleur} border-2 ${charge.borderCouleur} rounded-lg p-4 transition-all hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-slate-800/50 ${charge.couleur}`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-300">
                      {charge.label || t(`finance.planificateur.repartition.${charge.type}`)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {charge.frequence}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <div className={`text-2xl font-bold ${charge.couleur}`}>
                    {charge.montant.toLocaleString('fr-FR')}€
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {pourcentage}% du salaire
                  </div>
                </div>
              </div>

              {/* Projection annuelle */}
              <div className="mt-3 pt-3 border-t border-slate-700/50">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Projection annuelle</span>
                  <span className={`font-semibold ${charge.couleur}`}>
                    {(charge.montant * 12).toLocaleString('fr-FR')}€
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Résumé projections */}
      <div className="mt-6 bg-slate-900/50 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-slate-400 mb-1">3 mois</div>
            <div className="text-lg font-bold text-white">
              {(totalCharges * 3).toLocaleString('fr-FR')}€
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">6 mois</div>
            <div className="text-lg font-bold text-white">
              {(totalCharges * 6).toLocaleString('fr-FR')}€
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">12 mois</div>
            <div className="text-lg font-bold text-emerald-400">
              {(totalCharges * 12).toLocaleString('fr-FR')}€
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChargesFixes;
