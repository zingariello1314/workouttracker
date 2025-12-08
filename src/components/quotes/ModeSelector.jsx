/**
 * ModeSelector Component
 * Toggle between random and fixed quote modes
 */

import React from 'react';
import { Shuffle, Pin } from 'lucide-react';

export function ModeSelector({ mode, fixedQuoteId, quotes, onModeChange, onFixedQuoteChange }) {
  return (
    <div className="space-y-4 bg-slate-700/30 rounded-lg p-4">
      <h3 className="text-sm font-medium text-slate-300">Mode d'affichage</h3>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => onModeChange('random')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
            mode === 'random'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          }`}
        >
          <Shuffle size={18} />
          <span className="font-medium">Aléatoire</span>
        </button>

        <button
          onClick={() => onModeChange('fixed')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
            mode === 'fixed'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          }`}
        >
          <Pin size={18} />
          <span className="font-medium">Fixe</span>
        </button>
      </div>

      {/* Mode Description */}
      <div className="text-xs text-slate-400">
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

      {/* Fixed Quote Selector */}
      {mode === 'fixed' && quotes.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-slate-600">
          <label className="text-sm font-medium text-slate-300">
            Citation à afficher
          </label>
          <select
            value={fixedQuoteId || ''}
            onChange={(e) => onFixedQuoteChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sélectionner une citation...</option>
            {quotes.map((quote) => (
              <option key={quote.id} value={quote.id}>
                {quote.line1Fr} {quote.line2Fr} {quote.line3Fr}
              </option>
            ))}
          </select>
        </div>
      )}

      {mode === 'fixed' && !fixedQuoteId && quotes.length > 0 && (
        <div className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
          ⚠️ Veuillez sélectionner une citation à afficher
        </div>
      )}
    </div>
  );
}
