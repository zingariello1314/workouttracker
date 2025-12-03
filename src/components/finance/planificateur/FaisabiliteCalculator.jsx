import React from 'react';

/**
 * Composant affichant le calcul de faisabilité d'un achat
 */
export const FaisabiliteCalculator = ({ faisabilite, prix, moisCible, budgetMensuel }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (!faisabilite) return null;

  const statutColor = faisabilite.possible
    ? 'bg-green-900/30 border-green-500/50 text-green-300'
    : faisabilite.manque < budgetMensuel * 0.5
    ? 'bg-yellow-900/30 border-yellow-500/50 text-yellow-300'
    : 'bg-red-900/30 border-red-500/50 text-red-300';

  const statutIcon = faisabilite.possible
    ? '✅'
    : faisabilite.manque < budgetMensuel * 0.5
    ? '⚠️'
    : '❌';

  const statutMessage = faisabilite.possible
    ? 'Possible - Budget suffisant'
    : faisabilite.manque < budgetMensuel * 0.5
    ? `Limite - Utilise ${((prix / faisabilite.budgetDisponible) * 100).toFixed(0)}% du budget`
    : `Impossible - Manque ${formatCurrency(faisabilite.manque)} sur budget loisirs alloué`;

  return (
    <div className={`faisabilite-calculator rounded-lg p-4 border ${statutColor}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{statutIcon}</span>
        <span className="font-semibold">Faisabilité</span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-300">Budget disponible jusqu'au {moisCible}:</span>
          <span className="font-semibold text-white">{formatCurrency(faisabilite.budgetDisponible)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-300">Prix achat:</span>
          <span className="font-semibold text-white">{formatCurrency(prix)}</span>
        </div>
        {faisabilite.manque > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-300">Manque:</span>
            <span className="font-semibold text-red-400">{formatCurrency(faisabilite.manque)}</span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-current/20">
        <p className="text-sm font-medium mb-2">{statutMessage}</p>
      </div>

      {/* Suggestions */}
      {faisabilite.suggestions && faisabilite.suggestions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-current/20">
          <div className="text-xs font-medium mb-2">💡 Suggestions:</div>
          <ul className="text-xs space-y-1 opacity-90">
            {faisabilite.suggestions.map((suggestion, index) => (
              <li key={index}>• {suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

