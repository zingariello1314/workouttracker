/**
 * Update Quantities - Interface mise à jour quantités
 * Édition Or/Bourse/Cash avec recalcul automatique
 */

import { useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../../../utils/planificateurUtils';

const UpdateQuantities = ({ patrimoine, onUpdate }) => {
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState({
    orGrammes: patrimoine?.or?.grammes || 0,
    orCoursActuel: patrimoine?.or?.grammes > 0 ? patrimoine.or.valorisation / patrimoine.or.grammes : 65,
    bourseValorisationPortfolio: patrimoine?.bourse?.valorisation || 0,
    cashStock: patrimoine?.cash?.valorisation || 0
  });

  const handleSave = async (type) => {
    if (!onUpdate) return;

    let updatedPatrimoine = { ...patrimoine };

    switch (type) {
      case 'or':
        const nouvelleValorisationOr = values.orGrammes * values.orCoursActuel;
        updatedPatrimoine.or = {
          ...updatedPatrimoine.or,
          grammes: values.orGrammes,
          valorisation: nouvelleValorisationOr,
          plusValue: nouvelleValorisationOr - updatedPatrimoine.or.capitalInvesti,
          plusValuePourcent: updatedPatrimoine.or.capitalInvesti > 0 
            ? ((nouvelleValorisationOr - updatedPatrimoine.or.capitalInvesti) / updatedPatrimoine.or.capitalInvesti) * 100 
            : 0
        };
        break;

      case 'bourse':
        updatedPatrimoine.bourse = {
          ...updatedPatrimoine.bourse,
          valorisation: values.bourseValorisationPortfolio,
          plusValue: values.bourseValorisationPortfolio - updatedPatrimoine.bourse.capitalInvesti,
          plusValuePourcent: updatedPatrimoine.bourse.capitalInvesti > 0 
            ? ((values.bourseValorisationPortfolio - updatedPatrimoine.bourse.capitalInvesti) / updatedPatrimoine.bourse.capitalInvesti) * 100 
            : 0
        };
        break;

      case 'cash':
        updatedPatrimoine.cash = {
          ...updatedPatrimoine.cash,
          valorisation: values.cashStock,
          capitalInvesti: values.cashStock,
          plusValue: 0,
          plusValuePourcent: 0
        };
        break;
    }

    // Recalcul total
    updatedPatrimoine.total = {
      investi: updatedPatrimoine.or.capitalInvesti + updatedPatrimoine.bourse.capitalInvesti + updatedPatrimoine.cash.capitalInvesti,
      valorise: updatedPatrimoine.or.valorisation + updatedPatrimoine.bourse.valorisation + updatedPatrimoine.cash.valorisation,
      plusValue: updatedPatrimoine.or.plusValue + updatedPatrimoine.bourse.plusValue + updatedPatrimoine.cash.plusValue,
      plusValuePourcent: 0
    };
    updatedPatrimoine.total.plusValuePourcent = updatedPatrimoine.total.investi > 0 
      ? (updatedPatrimoine.total.plusValue / updatedPatrimoine.total.investi) * 100 
      : 0;

    await onUpdate(updatedPatrimoine);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      {/* Or */}
      <div className="bg-slate-800/50 border border-yellow-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🪙</span>
            <div>
              <h3 className="text-lg font-semibold text-white">Mettre à jour Or</h3>
              <p className="text-sm text-slate-400">Grammes détenus et cours actuel</p>
            </div>
          </div>
          {editing !== 'or' && (
            <button
              onClick={() => setEditing('or')}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm"
            >
              ✏️ Modifier
            </button>
          )}
        </div>

        {editing === 'or' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Grammes détenus</label>
              <input
                type="number"
                step="0.01"
                value={values.orGrammes}
                onChange={(e) => setValues({ ...values, orGrammes: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">Cours or actuel (€/g)</label>
              <input
                type="number"
                step="0.01"
                value={values.orCoursActuel}
                onChange={(e) => setValues({ ...values, orCoursActuel: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="text-sm text-slate-300">Nouvelle valorisation</div>
              <div className="text-xl font-bold text-white">
                {formatCurrency(values.orGrammes * values.orCoursActuel)}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSave('or')}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Enregistrer
              </button>
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Grammes actuels</span>
              <span className="text-white font-medium">{patrimoine?.or?.grammes?.toFixed(2) || 0}g</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Valorisation</span>
              <span className="text-white font-medium">{formatCurrency(patrimoine?.or?.valorisation || 0)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bourse */}
      <div className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📈</span>
            <div>
              <h3 className="text-lg font-semibold text-white">Mettre à jour Bourse</h3>
              <p className="text-sm text-slate-400">Valorisation portfolio actuelle</p>
            </div>
          </div>
          {editing !== 'bourse' && (
            <button
              onClick={() => setEditing('bourse')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              ✏️ Modifier
            </button>
          )}
        </div>

        {editing === 'bourse' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Valorisation portfolio (€)</label>
              <input
                type="number"
                step="0.01"
                value={values.bourseValorisationPortfolio}
                onChange={(e) => setValues({ ...values, bourseValorisationPortfolio: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="text-sm text-slate-300">Plus-value calculée</div>
              <div className="text-xl font-bold text-white">
                {formatCurrency(values.bourseValorisationPortfolio - (patrimoine?.bourse?.capitalInvesti || 0))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSave('bourse')}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Enregistrer
              </button>
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Valorisation actuelle</span>
              <span className="text-white font-medium">{formatCurrency(patrimoine?.bourse?.valorisation || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Positions</span>
              <span className="text-white font-medium">{patrimoine?.bourse?.positions || 0}</span>
            </div>
          </div>
        )}
      </div>

      {/* Cash */}
      <div className="bg-slate-800/50 border border-green-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💵</span>
            <div>
              <h3 className="text-lg font-semibold text-white">Mettre à jour Cash</h3>
              <p className="text-sm text-slate-400">Stock cash physique</p>
            </div>
          </div>
          {editing !== 'cash' && (
            <button
              onClick={() => setEditing('cash')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
            >
              ✏️ Modifier
            </button>
          )}
        </div>

        {editing === 'cash' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Stock cash (€)</label>
              <input
                type="number"
                step="0.01"
                value={values.cashStock}
                onChange={(e) => setValues({ ...values, cashStock: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSave('cash')}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Enregistrer
              </button>
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Stock actuel</span>
              <span className="text-white font-medium">{formatCurrency(patrimoine?.cash?.valorisation || 0)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <RefreshCw className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300">
            <div className="font-semibold text-white mb-1">Recalcul automatique</div>
            Toutes les modifications déclenchent un recalcul automatique du Net Worth et des graphiques.
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateQuantities;
