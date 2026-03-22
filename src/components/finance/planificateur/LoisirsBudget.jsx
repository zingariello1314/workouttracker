import React, { useState, useEffect } from 'react';

/**
 * Composant affichant le budget loisirs mensuel (synchronisé avec la répartition V2).
 */
const LoisirsBudget = ({ budgetMensuel, onBudgetChange, saving = false }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(Math.round(budgetMensuel)));

  useEffect(() => {
    if (!editing) setDraft(String(Math.max(0, Math.round(Number(budgetMensuel) || 0))));
  }, [budgetMensuel, editing]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleSave = async () => {
    const n = Math.max(0, Math.round(parseFloat(String(draft).replace(',', '.')) || 0));
    if (!onBudgetChange) {
      setEditing(false);
      return;
    }
    try {
      await onBudgetChange(n);
      setEditing(false);
    } catch {
      /* erreur déjà signalée par le parent */
    }
  };

  return (
    <div className="loisirs-budget bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/50 rounded-lg p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-sm text-slate-400 mb-1">Budget Loisirs Mensuel</div>
          {!editing ? (
            <div className="text-3xl font-bold text-white">
              {formatCurrency(budgetMensuel)}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <input
                type="number"
                min={0}
                step={10}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="w-36 px-3 py-2 rounded-lg bg-slate-900 border border-purple-500/40 text-white text-xl font-bold"
                disabled={saving}
                aria-label="Nouveau budget loisirs mensuel"
              />
              <span className="text-slate-400">€</span>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? '…' : 'Enregistrer'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-200 text-sm"
              >
                Annuler
              </button>
            </div>
          )}
          <div className="text-xs text-slate-400 mt-2">
            Lié à la ligne « Loisirs » de la répartition salaire (total des budgets type loisirs)
          </div>
          {onBudgetChange && !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="mt-2 text-xs text-purple-300 hover:text-purple-200 underline"
            >
              Modifier le montant ici
            </button>
          )}
        </div>
        <div className="text-5xl shrink-0">🎮</div>
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



