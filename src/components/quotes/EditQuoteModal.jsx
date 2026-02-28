/**
 * EditQuoteModal Component
 * Modal for editing existing quotes (legacy line1/2/3 or new textFr/textEn)
 * Saves always in new format (textFr, textEn, boldLineStart, boldLineEnd)
 */

import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import quotesService from '../../services/quotes/quotesService';

const DEFAULT_BOLD_START = 2;
const DEFAULT_BOLD_END = 2;

function isLegacyQuote(quote) {
  return quote && typeof quote.line1Fr === 'string';
}

/** Build textFr/textEn from legacy line1/2/3 for form display */
function legacyToText(quote, lang) {
  if (!quote) return '';
  if (lang === 'fr') {
    return [quote.line1Fr, quote.line2Fr, quote.line3Fr].filter(Boolean).join('\n');
  }
  return [quote.line1En, quote.line2En, quote.line3En].filter(Boolean).join('\n');
}

export function EditQuoteModal({ quote, onSave, onClose }) {
  const [formData, setFormData] = useState({
    textFr: '',
    textEn: '',
    boldLineStart: DEFAULT_BOLD_START,
    boldLineEnd: DEFAULT_BOLD_END,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (quote) {
      if (isLegacyQuote(quote)) {
        setFormData({
          textFr: legacyToText(quote, 'fr'),
          textEn: legacyToText(quote, 'en'),
          boldLineStart: DEFAULT_BOLD_START,
          boldLineEnd: DEFAULT_BOLD_END,
        });
      } else {
        setFormData({
          textFr: quote.textFr || '',
          textEn: quote.textEn != null ? quote.textEn : '',
          boldLineStart: quote.boldLineStart ?? DEFAULT_BOLD_START,
          boldLineEnd: quote.boldLineEnd ?? DEFAULT_BOLD_END,
        });
      }
    }
  }, [quote]);

  const handleChange = (field, value) => {
    if (field === 'boldLineStart' || field === 'boldLineEnd') {
      const n = parseInt(value, 10);
      setFormData((prev) => ({ ...prev, [field]: isNaN(n) ? '' : n }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
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

    const result = await onSave(quote.id, payload);
    if (result.success) {
      onClose();
    } else {
      setErrors({ submit: result.error });
    }
  };

  if (!quote) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Modifier la citation</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Français (obligatoire)</label>
            <textarea
              placeholder="Phrase en français..."
              value={formData.textFr}
              onChange={(e) => handleChange('textFr', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">English (optionnel)</label>
            <textarea
              placeholder="Traduction optionnelle..."
              value={formData.textEn}
              onChange={(e) => handleChange('textEn', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[80px]"
            />
          </div>

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
            </div>
          </div>

          {errors.submit && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded p-3">
              {errors.submit}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="gradient-button-premium gradient-button-premium-md rounded-lg flex-1 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Enregistrer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg flex-1"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
