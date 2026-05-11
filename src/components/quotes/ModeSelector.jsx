/**
 * ModeSelector Component
 * Toggle between random and fixed quote modes
 */

import React from 'react';
import { Shuffle, Pin } from 'lucide-react';
import quotesService from '../../services/quotes/quotesService';
import { settingsTheme as S } from '../tabs/SettingsTab/settingsThemeClasses';

function quotePreview(quote, autoSplitLineGoal) {
  if (!quote) return '';
  const gn =
    autoSplitLineGoal != null && autoSplitLineGoal !== ''
      ? Number(autoSplitLineGoal)
      : null;
  const splitOpts =
    gn != null && Number.isFinite(gn) ? { autoSplitLineGoal: gn } : {};
  const display = quotesService.formatQuoteForDisplay(quote, 'fr', splitOpts);
  const text = display?.lines?.join(' ') ?? '';
  return text.length > 60 ? text.slice(0, 57) + '…' : text;
}

const btnBase = 'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 transition-all';

export function ModeSelector({
  mode,
  fixedQuoteId,
  quotes,
  onModeChange,
  onFixedQuoteChange,
  autoSplitLineGoal = null,
}) {
  return (
    <div className={`space-y-4 rounded-lg border border-red-900/45 bg-red-950/15 p-4`}>
      <h3 className={S.label}>Mode d'affichage</h3>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onModeChange('random')}
          className={`${btnBase} ${
            mode === 'random'
              ? `${S.btnPrimary} shadow-lg shadow-red-950/40`
              : `${S.btnSecondary} border-red-900/40`
          }`}
        >
          <Shuffle size={18} />
          <span className="font-medium">Aléatoire</span>
        </button>

        <button
          type="button"
          onClick={() => onModeChange('fixed')}
          className={`${btnBase} ${
            mode === 'fixed'
              ? `${S.btnPrimary} shadow-lg shadow-red-950/40`
              : `${S.btnSecondary} border-red-900/40`
          }`}
        >
          <Pin size={18} />
          <span className="font-medium">Fixe</span>
        </button>
      </div>

      <div className={`text-xs ${S.muted}`}>
        {mode === 'random' ? (
          <div className="space-y-1">
            <p>• Les citations changent aléatoirement à chaque visite</p>
            <p>• Les citations épinglées apparaissent 3x plus souvent</p>
            <p>• Évite la répétition immédiate</p>
          </div>
        ) : (
          <p>• Affiche toujours la même citation sur la page d'accueil</p>
        )}
      </div>

      {mode === 'fixed' && quotes.length > 0 && (
        <div className="space-y-2 border-t border-red-900/45 pt-4">
          <label className={S.label}>
            Citation à afficher
          </label>
          <select
            value={fixedQuoteId || ''}
            onChange={(e) => onFixedQuoteChange(e.target.value)}
            className={S.input}
          >
            <option value="">Sélectionner une citation...</option>
            {quotes.map((quote) => (
              <option key={quote.id} value={quote.id}>
                {quotePreview(quote, autoSplitLineGoal)}
              </option>
            ))}
          </select>
        </div>
      )}

      {mode === 'fixed' && !fixedQuoteId && quotes.length > 0 && (
        <div className="rounded border border-amber-700/40 bg-amber-950/25 p-2 text-xs text-amber-200">
          Veuillez sélectionner une citation à afficher
        </div>
      )}
    </div>
  );
}
