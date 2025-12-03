import React, { useState } from 'react';
import { useBudget } from '../../../hooks/useBudget';
import { useToast } from '../../ui/Toast';

const CategoryRules = ({ category }) => {
  const { updateCategory } = useBudget();
  const { showToast } = useToast();
  const [rules, setRules] = useState(category.regles || {
    alerte80: true,
    alerte100: true,
    alerte120: true,
    action80: 'NOTIFICATION',
    action100: 'BLOCK',
    action120: 'BLOCK_STRICT'
  });

  const handleSave = async () => {
    try {
      await updateCategory(category.id, { regles: rules });
      showToast('Règles sauvegardées', 'success');
    } catch (error) {
      showToast('Erreur lors de la sauvegarde', 'error');
    }
  };

  return (
    <div className="category-rules space-y-3">
      <h5 className="text-sm font-semibold text-white mb-3">Règles Automatiques</h5>

      {/* Alerte 80% */}
      <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={rules.alerte80 !== false}
            onChange={(e) => setRules({ ...rules, alerte80: e.target.checked })}
            className="w-4 h-4 text-yellow-600 bg-slate-700 border-slate-600 rounded"
          />
          <label className="text-sm text-slate-300">Alerte à 80%</label>
        </div>
        {rules.alerte80 !== false && (
          <select
            value={rules.action80 || 'NOTIFICATION'}
            onChange={(e) => setRules({ ...rules, action80: e.target.value })}
            className="text-xs bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white"
          >
            <option value="NOTIFICATION">Notification</option>
            <option value="SUGGEST">Suggérer</option>
          </select>
        )}
      </div>

      {/* Alerte 100% */}
      <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={rules.alerte100 !== false}
            onChange={(e) => setRules({ ...rules, alerte100: e.target.checked })}
            className="w-4 h-4 text-orange-600 bg-slate-700 border-slate-600 rounded"
          />
          <label className="text-sm text-slate-300">Alerte à 100%</label>
        </div>
        {rules.alerte100 !== false && (
          <select
            value={rules.action100 || 'BLOCK'}
            onChange={(e) => setRules({ ...rules, action100: e.target.value })}
            className="text-xs bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white"
          >
            <option value="NOTIFICATION">Notification</option>
            <option value="BLOCK">Bloquer</option>
            <option value="SUGGEST">Suggérer</option>
          </select>
        )}
      </div>

      {/* Alerte 120% */}
      <div className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={rules.alerte120 !== false}
            onChange={(e) => setRules({ ...rules, alerte120: e.target.checked })}
            className="w-4 h-4 text-red-600 bg-slate-700 border-slate-600 rounded"
          />
          <label className="text-sm text-slate-300">Alerte à 120%</label>
        </div>
        {rules.alerte120 !== false && (
          <select
            value={rules.action120 || 'BLOCK_STRICT'}
            onChange={(e) => setRules({ ...rules, action120: e.target.value })}
            className="text-xs bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white"
          >
            <option value="NOTIFICATION">Notification</option>
            <option value="BLOCK">Bloquer</option>
            <option value="BLOCK_STRICT">Bloquer strict</option>
          </select>
        )}
      </div>

      <button
        onClick={handleSave}
        className="w-full mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
      >
        Sauvegarder règles
      </button>
    </div>
  );
};

export default CategoryRules;

