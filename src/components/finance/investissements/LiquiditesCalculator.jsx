import React, { useMemo } from 'react';
import moment from 'moment';

const LiquiditesCalculator = ({ stockTotal, objectifMensuel, progression }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Calculer rate mensuel actuel
  const rateMensuel = useMemo(() => {
    if (!progression || progression.length === 0) return 0;

    const now = new Date();
    const moisActuel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    return progression
      .filter(entry => {
        const entryDate = new Date(entry.date);
        const entryMois = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;
        return entryMois === moisActuel;
      })
      .reduce((sum, entry) => sum + (entry.montant || 0), 0);
  }, [progression]);

  // Identifier accélérateurs (bonus, ventes, économies)
  const accelerateurs = useMemo(() => {
    if (!progression || progression.length === 0) return [];

    const sources = {};
    progression.forEach(entry => {
      const source = entry.source || 'autre';
      sources[source] = (sources[source] || 0) + (entry.montant || 0);
    });

    return Object.entries(sources)
      .map(([source, montant]) => ({ source, montant }))
      .sort((a, b) => b.montant - a.montant)
      .slice(0, 3);
  }, [progression]);

  // Calculer temps pour atteindre objectif
  const tempsObjectif = useMemo(() => {
    if (!objectifMensuel || objectifMensuel <= 0) return null;

    const objectifs = [1000, 5000, 10000, 25000, 50000];
    const objectifActuel = objectifs.find(obj => obj > stockTotal) || objectifs[objectifs.length - 1];
    
    if (stockTotal >= objectifActuel) return null;

    const ecart = objectifActuel - stockTotal;
    const moisNecessaires = rateMensuel > 0 ? ecart / rateMensuel : null;
    
    return {
      objectif: objectifActuel,
      ecart,
      moisNecessaires: moisNecessaires ? Math.ceil(moisNecessaires) : null,
      dateEstimee: moisNecessaires ? moment().add(moisNecessaires, 'months').format('MMM YYYY') : null
    };
  }, [stockTotal, objectifMensuel, rateMensuel]);

  return (
    <div className="liquidites-calculator bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
      <h4 className="text-lg font-semibold text-white mb-4">Calculateur Efficacité</h4>

      {/* Rate mensuel */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-300">Rate mensuel actuel</span>
          <span className="text-lg font-bold text-white">{formatCurrency(rateMensuel)}</span>
        </div>
        {objectifMensuel > 0 && (
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${Math.min((rateMensuel / objectifMensuel) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Accélérateurs identifiés */}
      {accelerateurs.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-slate-300 mb-2">Accélérateurs identifiés</div>
          <div className="space-y-2">
            {accelerateurs.map((acc, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                <span className="text-sm text-slate-400 capitalize">{acc.source}</span>
                <span className="text-sm font-semibold text-white">{formatCurrency(acc.montant)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compteur satisfaction */}
      {tempsObjectif && (
        <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
          <div className="text-sm text-slate-300 mb-2">
            Objectif : {formatCurrency(tempsObjectif.objectif)}
          </div>
          {tempsObjectif.moisNecessaires ? (
            <div>
              <div className="text-lg font-bold text-white mb-1">
                {tempsObjectif.moisNecessaires} mois
              </div>
              <div className="text-xs text-slate-400">
                Date estimée : {tempsObjectif.dateEstimee}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Restant : {formatCurrency(tempsObjectif.ecart)}
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400">
              Augmentez votre rate mensuel pour accélérer
            </div>
          )}
        </div>
      )}

      {/* Optimiseur lifestyle */}
      <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
        <div className="text-sm font-medium text-slate-300 mb-2">💡 Optimiseur Lifestyle</div>
        <div className="text-xs text-slate-400">
          Réduire les dépenses de 10% pourrait libérer {formatCurrency(objectifMensuel * 0.1)}/mois supplémentaires
        </div>
      </div>
    </div>
  );
};

export default LiquiditesCalculator;

