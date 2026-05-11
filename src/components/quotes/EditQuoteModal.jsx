/**
 * EditQuoteModal Component
 * Modal for editing existing quotes (legacy line1/2/3 or new textFr/textEn)
 * Saves always in new format (textFr, textEn, boldLineStart, boldLineEnd)
 */

import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import quotesService from '../../services/quotes/quotesService';
import { normalizeQuoteLineBreaks } from '../../services/quotes/quoteNewlines';
import { settingsTheme as S } from '../tabs/SettingsTab/settingsThemeClasses';

const DEFAULT_BOLD_START = 2;
const DEFAULT_BOLD_END = 2;

const field = `${S.input} min-h-[80px] resize-y py-2`;
const numField = `${S.input} w-14 px-2 py-1.5 text-center`;

/** Aligné avec quotesService.getLinesFromQuote : textFr/textEn prévalent si non vides */
function quoteHasSeparateTextBlob(quote) {
  const fr = typeof quote?.textFr === 'string' ? quote.textFr.trim() : '';
  const en = typeof quote?.textEn === 'string' ? quote.textEn.trim() : '';
  return fr !== '' || en !== '';
}

function isLegacyQuote(quote) {
  return quote && typeof quote.line1Fr === 'string' && !quoteHasSeparateTextBlob(quote);
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
      textFr: normalizeQuoteLineBreaks(formData.textFr).trim(),
      textEn: normalizeQuoteLineBreaks(formData.textEn).trim(),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className={`${S.modalPanel} max-w-2xl`}>
        <form onSubmit={handleSubmit} className="flex max-h-[90vh] flex-col">
          <div className={S.modalHeader}>
            <h2 className="text-xl font-semibold text-red-100">Modifier la citation</h2>
            <button
              type="button"
              onClick={onClose}
              className={`rounded-lg p-2 transition-colors ${S.muted} hover:bg-red-950/40 hover:text-red-100`}
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto p-6">
            <div className="space-y-2">
              <label className={S.label}>Français (obligatoire)</label>
              <textarea
                placeholder="Phrase en français..."
                value={formData.textFr}
                onChange={(e) => handleChange('textFr', e.target.value)}
                rows={4}
                className={field}
              />
            </div>

            <div className="space-y-2">
              <label className={S.label}>English (optionnel)</label>
              <textarea
                placeholder="Traduction optionnelle..."
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
              </div>
            </div>

            {errors.submit && (
              <div className="rounded border border-red-600/40 bg-red-950/35 p-3 text-sm text-red-300">
                {errors.submit}
              </div>
            )}
          </div>

          <div className={`${S.modalFooter} flex-wrap`}>
            <button type="button" onClick={onClose} className={`${S.btnSecondary} min-w-[120px]`}>
              Annuler
            </button>
            <button type="submit" className={`${S.btnPrimary} min-w-[120px]`}>
              <Save className="h-4 w-4" />
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
