/**
 * AddQuoteForm Component
 * Form to add new quotes: one text per language (FR required, EN optional) + bold line range
 */

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import quotesService from '../../services/quotes/quotesService';

const DEFAULT_BOLD_START = 2;
const DEFAULT_BOLD_END = 2;

export function AddQuoteForm({ onAdd, onCancel }) {
  const [formData, setFormData] = useState({
    textFr: '',
    textEn: '',
    boldLineStart: DEFAULT_BOLD_START,
    boldLineEnd: DEFAULT_BOLD_END,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    if (field === 'boldLineStart' || field === 'boldLineEnd') {
      const n = parseInt(value, 10);
      setFormData((prev) => ({ ...prev, [field]: isNaN(n) ? '' : n }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const payload = {
      textFr: formData.textFr.trim(),
      textEn: formData.textEn.trim(),
      boldLineStart: formData.boldLineStart === '' ? DEFAULT_BOLD_START : formData.boldLineStart,
      boldLineEnd: formData.boldLineEnd === '' ? DEFAULT_BOLD_END : formData.boldLineEnd,
    };

    const validation = quotesService.validateQuote(payload);
    if (!validation.valid) {
      setErrors({ submit: validation.errors.join(', ') });
      return;
    }

    const result = await onAdd(payload);

    if (result.success) {
      setFormData({
        textFr: '',
        textEn: '',
        boldLineStart: DEFAULT_BOLD_START,
        boldLineEnd: DEFAULT_BOLD_END,
      });
      setErrors({});
    } else {
      setErrors({ submit: result.error });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-slate-700/30 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Ajouter une citation</h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-slate-300 transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Français */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Français (obligatoire)</label>
        <textarea
          placeholder="Saisissez la phrase en entier. Vous pouvez mettre des retours à la ligne ou laisser l’app découper automatiquement (~28 caractères par ligne)."
          value={formData.textFr}
          onChange={(e) => handleChange('textFr', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[80px]"
        />
      </div>

      {/* Anglais */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">English (optionnel)</label>
        <textarea
          placeholder="Traduction optionnelle. Si vide, le français sera affiché en mode anglais."
          value={formData.textEn}
          onChange={(e) => handleChange('textEn', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[80px]"
        />
      </div>

      {/* Lignes en gras */}
      <div className="space-y-2 pt-2 border-t border-slate-600">
        <label className="text-sm font-medium text-slate-300">Lignes en gras</label>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 text-sm">De la ligne</span>
          <input
            type="number"
            min={1}
            max={10}
            value={formData.boldLineStart === '' ? '' : formData.boldLineStart}
            onChange={(e) => handleChange('boldLineStart', e.target.value)}
            className="w-14 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-slate-200 text-center"
          />
          <span className="text-slate-400 text-sm">à la ligne</span>
          <input
            type="number"
            min={1}
            max={10}
            value={formData.boldLineEnd === '' ? '' : formData.boldLineEnd}
            onChange={(e) => handleChange('boldLineEnd', e.target.value)}
            className="w-14 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-slate-200 text-center"
          />
          <span className="text-slate-500 text-xs">(par défaut : 2 et 2)</span>
        </div>
      </div>

      {errors.submit && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded p-3">
          {errors.submit}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="gradient-button-premium gradient-button-premium-md rounded-lg flex-1 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg flex-1"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
