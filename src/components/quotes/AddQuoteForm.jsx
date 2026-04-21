/**
 * AddQuoteForm Component
 * Form to add new quotes: one text per language (FR required, EN optional) + bold line range
 */

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import quotesService from '../../services/quotes/quotesService';
import { settingsTheme as S } from '../tabs/SettingsTab/settingsThemeClasses';

const DEFAULT_BOLD_START = 2;
const DEFAULT_BOLD_END = 2;

const field = `${S.input} min-h-[80px] resize-y py-2`;
const numField = `${S.input} w-14 px-2 py-1.5 text-center`;

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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-red-900/45 bg-red-950/15 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-red-100">Ajouter une citation</h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={`p-1 transition-colors ${S.muted} hover:text-red-100`}
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="space-y-2">
        <label className={S.label}>Français (obligatoire)</label>
        <textarea
          placeholder="Saisissez la phrase en entier. Vous pouvez mettre des retours à la ligne ou laisser l’app découper automatiquement (~28 caractères par ligne)."
          value={formData.textFr}
          onChange={(e) => handleChange('textFr', e.target.value)}
          rows={4}
          className={field}
        />
      </div>

      <div className="space-y-2">
        <label className={S.label}>English (optionnel)</label>
        <textarea
          placeholder="Traduction optionnelle. Si vide, le français sera affiché en mode anglais."
          value={formData.textEn}
          onChange={(e) => handleChange('textEn', e.target.value)}
          rows={4}
          className={field}
        />
      </div>

      <div className="space-y-2 border-t border-red-900/45 pt-2">
        <label className={S.label}>Lignes en gras</label>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-sm ${S.muted}`}>De la ligne</span>
          <input
            type="number"
            min={1}
            max={10}
            value={formData.boldLineStart === '' ? '' : formData.boldLineStart}
            onChange={(e) => handleChange('boldLineStart', e.target.value)}
            className={numField}
          />
          <span className={`text-sm ${S.muted}`}>à la ligne</span>
          <input
            type="number"
            min={1}
            max={10}
            value={formData.boldLineEnd === '' ? '' : formData.boldLineEnd}
            onChange={(e) => handleChange('boldLineEnd', e.target.value)}
            className={numField}
          />
          <span className="text-xs text-red-400/60">(par défaut : 2 et 2)</span>
        </div>
      </div>

      {errors.submit && (
        <div className="rounded border border-red-600/40 bg-red-950/35 p-3 text-sm text-red-300">
          {errors.submit}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className={`${S.btnPrimary} flex-1`}
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={`${S.btnSecondary} flex-1`}
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
