/**
 * QuoteCard Component
 * Displays individual quote with edit/delete/pin actions (supports legacy and new format)
 */

import React from 'react';
import { Edit2, Trash2, Pin, GripVertical } from 'lucide-react';
import quotesService from '../../services/quotes/quotesService';

export function QuoteCard({ quote, onEdit, onDelete, onTogglePin, draggable = false }) {
  const displayFr = quote ? quotesService.formatQuoteForDisplay(quote, 'fr') : null;
  const displayEn = quote ? quotesService.formatQuoteForDisplay(quote, 'en') : null;
  const linesFr = displayFr?.lines ?? [];
  const linesEn = displayEn?.lines ?? [];
  const boldFrom = displayFr?.boldFrom ?? 2;
  const boldTo = displayFr?.boldTo ?? 2;

  const renderLines = (lines, boldFromVal, boldToVal) =>
    lines.map((line, index) => {
      const oneBased = index + 1;
      const isBold = oneBased >= boldFromVal && oneBased <= boldToVal;
      return (
        <div key={index} className={isBold ? 'font-bold text-blue-400' : ''}>
          {line}
        </div>
      );
    });

  return (
    <div className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700/70 transition-colors group">
      <div className="flex items-start gap-3">
        {draggable && (
          <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-300 pt-1">
            <GripVertical size={20} />
          </div>
        )}

        <div className="flex-1 space-y-1">
          <div className="text-sm text-slate-300">
            {renderLines(linesFr, boldFrom, boldTo)}
          </div>
          {linesEn.length > 0 && (
            <div className="text-xs text-slate-500 mt-2">
              {renderLines(linesEn, displayEn?.boldFrom ?? 2, displayEn?.boldTo ?? 2)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onTogglePin(quote.id)}
            className={`gradient-button-premium gradient-button-premium-sm rounded-lg p-2 ${
              quote.isPinned ? 'gradient-button-premium-variant' : ''
            }`}
            title={quote.isPinned ? 'Désépingler' : 'Épingler (3x plus fréquent)'}
          >
            <Pin size={16} fill={quote.isPinned ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            onClick={() => onEdit(quote)}
            className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg p-2"
            title="Modifier"
          >
            <Edit2 size={16} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(quote.id)}
            className="gradient-button-premium gradient-button-premium-sm rounded-lg p-2"
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {quote.isPinned && (
        <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400">
          <Pin size={12} fill="currentColor" />
          <span>Épinglée (3x plus fréquente)</span>
        </div>
      )}
    </div>
  );
}
