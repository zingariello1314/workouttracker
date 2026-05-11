/**
 * QuoteCard Component
 * Displays individual quote with edit/delete/pin actions (supports legacy and new format)
 */

import React from 'react';
import { Edit2, Trash2, Pin, GripVertical } from 'lucide-react';
import quotesService from '../../services/quotes/quotesService';
import { settingsTheme as S } from '../tabs/SettingsTab/settingsThemeClasses';

export function QuoteCard({
  quote,
  onEdit,
  onDelete,
  onTogglePin,
  draggable = false,
  listPosition = null,
  autoSplitLineGoal = null,
}) {
  const gn =
    autoSplitLineGoal != null && autoSplitLineGoal !== ''
      ? Number(autoSplitLineGoal)
      : null;
  const splitOpts =
    gn != null && Number.isFinite(gn) ? { autoSplitLineGoal: gn } : {};
  const displayFr = quote ? quotesService.formatQuoteForDisplay(quote, 'fr', splitOpts) : null;
  const displayEn = quote ? quotesService.formatQuoteForDisplay(quote, 'en', splitOpts) : null;
  const linesFr = displayFr?.lines ?? [];
  const linesEn = displayEn?.lines ?? [];
  const boldFrom = displayFr?.boldFrom ?? 2;
  const boldTo = displayFr?.boldTo ?? 2;

  const renderLines = (lines, boldFromVal, boldToVal) =>
    lines.map((line, index) => {
      const oneBased = index + 1;
      const isBold = oneBased >= boldFromVal && oneBased <= boldToVal;
      return (
        <div key={index} className={isBold ? 'font-bold text-red-300' : ''}>
          {line}
        </div>
      );
    });

  return (
    <div className="group rounded-lg border border-red-900/45 bg-red-950/15 p-4 transition-colors hover:border-red-700/50 hover:bg-red-950/25">
      <div className="flex items-start gap-3">
        {draggable && (
          <div className={`shrink-0 cursor-grab pt-1 active:cursor-grabbing ${S.muted}`}>
            <GripVertical size={20} />
          </div>
        )}

        {listPosition != null && (
          <div
            className={`flex w-8 shrink-0 select-none items-start justify-center pt-1 text-sm font-semibold tabular-nums ${S.muted}`}
            aria-label={`Citation ${listPosition}`}
          >
            {listPosition}
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-1">
          <div className={`text-sm ${S.body}`}>
            {renderLines(linesFr, boldFrom, boldTo)}
          </div>
          {linesEn.length > 0 && (
            <div className={`mt-2 text-xs ${S.mutedXs}`}>
              {renderLines(linesEn, displayEn?.boldFrom ?? 2, displayEn?.boldTo ?? 2)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onTogglePin(quote.id)}
            className={`${S.btnSm} p-2 ${quote.isPinned ? 'border-red-400/70 bg-red-900/40' : ''}`}
            title={quote.isPinned ? 'Désépingler' : 'Épingler (3x plus fréquent)'}
          >
            <Pin size={16} fill={quote.isPinned ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            onClick={() => onEdit(quote)}
            className={`${S.btnSm} border-red-900/55 p-2`}
            title="Modifier"
          >
            <Edit2 size={16} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(quote.id)}
            className={`${S.btnSm} p-2`}
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {quote.isPinned && (
        <div className="mt-2 inline-flex items-center gap-1 rounded border border-amber-700/35 bg-amber-950/25 px-2 py-1 text-xs text-amber-200">
          <Pin size={12} fill="currentColor" />
          <span>Épinglée (3x plus fréquente)</span>
        </div>
      )}
    </div>
  );
}
