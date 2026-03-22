import React, { useState, useEffect } from 'react';

/**
 * Carte objectif mensuel liée à la répartition salaire (lecture + édition).
 */
const InvestissementObjectifLinkedCard = ({
  title,
  hint,
  valueEuros,
  onSave,
  saving = false,
  accentClass = 'from-amber-900/25 to-yellow-900/20 border-amber-500/40'
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(Math.round(valueEuros)));

  useEffect(() => {
    if (!editing) setDraft(String(Math.max(0, Math.round(Number(valueEuros) || 0))));
  }, [valueEuros, editing]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);

  const handleSave = async () => {
    const n = Math.max(0, Math.round(parseFloat(String(draft).replace(',', '.')) || 0));
    if (!onSave) {
      setEditing(false);
      return;
    }
    try {
      await onSave(n);
      setEditing(false);
    } catch {
      /* toast côté parent */
    }
  };

  return (
    <div className={`rounded-xl p-5 border bg-gradient-to-r ${accentClass}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm text-slate-400 mb-1">{title}</div>
          {!editing ? (
            <div className="text-2xl font-bold text-white">{formatCurrency(valueEuros)}</div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <input
                type="number"
                min={0}
                step={10}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={saving}
                className="w-36 px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-lg font-bold"
                aria-label={title}
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
          {hint && <p className="text-xs text-slate-500 mt-2 max-w-xl">{hint}</p>}
          {onSave && !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="mt-2 text-xs text-slate-300 hover:text-white underline"
            >
              Modifier (met à jour la répartition salaire)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestissementObjectifLinkedCard;
