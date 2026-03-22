import { useState, useEffect, useCallback } from 'react';
import { applySmartShoppingMonthlyBudgetToPlanificateur } from '../../../services/finance/budgetPlanificateurBridge';
import { formatCurrency } from '../../../utils/planificateurUtils';

/**
 * Budget mensuel courses : même source que la ligne « Courses » (cat_courses) du planificateur / budget personnel.
 */
const SmartShoppingCoursesPlanifSync = ({ budget, refreshData }) => {
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    setDraft(String(Math.round(budget?.mensuel ?? 0)));
  }, [budget?.mensuel]);

  const apply = useCallback(async () => {
    const v = Math.max(0, parseFloat(draft) || 0);
    setSaving(true);
    setMsg(null);
    try {
      await applySmartShoppingMonthlyBudgetToPlanificateur(v);
      refreshData?.();
      setMsg({ type: 'ok', text: 'Synchronisé avec le planificateur et le budget personnel.' });
    } catch (e) {
      setMsg({ type: 'err', text: e?.message || 'Erreur' });
    } finally {
      setSaving(false);
    }
  }, [draft, refreshData]);

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-emerald-200">Budget courses (répartition salaire)</h3>
      <p className="text-xs text-slate-400">
        Identique à la ligne « Courses » dans Finance → Planificateur et à la catégorie liée dans Budget personnel.
        Une modification ici met à jour planificateur, budget et cet écran.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          min={0}
          step={10}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-32 px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm"
          aria-label="Budget courses mensuel en euros"
        />
        <span className="text-slate-400 text-sm">€ / mois</span>
        <button
          type="button"
          disabled={saving}
          onClick={apply}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium"
        >
          {saving ? '…' : 'Appliquer'}
        </button>
      </div>
      <p className="text-xs text-slate-500">Valeur en cours : {formatCurrency(budget?.mensuel || 0)}</p>
      {msg && (
        <p className={`text-xs ${msg.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>
      )}
    </div>
  );
};

export default SmartShoppingCoursesPlanifSync;
