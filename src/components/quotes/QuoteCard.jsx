/**
 * QuoteCard Component
 * Displays individual quote with edit/delete/pin actions
 */

import React from 'react';
import { Edit2, Trash2, Pin, GripVertical } from 'lucide-react';
import Button from '../ui/Button';

export function QuoteCard({ quote, onEdit, onDelete, onTogglePin, draggable = false }) {
  return (
    <div className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700/70 transition-colors group">
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        {draggable && (
          <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-300 pt-1">
            <GripVertical size={20} />
          </div>
        )}

        {/* Quote Content */}
        <div className="flex-1 space-y-1">
          <div className="text-sm text-slate-300">
            <div className="font-medium">{quote.line1Fr}</div>
            <div className="font-bold text-blue-400">{quote.line2Fr}</div>
            <div>{quote.line3Fr}</div>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            <div>{quote.line1En}</div>
            <div className="font-semibold">{quote.line2En}</div>
            <div>{quote.line3En}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onTogglePin(quote.id)}
            className={`p-2 rounded-lg transition-colors ${
              quote.isPinned
                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                : 'text-slate-400 hover:bg-slate-600 hover:text-slate-300'
            }`}
            title={quote.isPinned ? 'Désépingler' : 'Épingler (3x plus fréquent)'}
          >
            <Pin size={16} fill={quote.isPinned ? 'currentColor' : 'none'} />
          </button>

          <button
            onClick={() => onEdit(quote)}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-600 hover:text-blue-400 transition-colors"
            title="Modifier"
          >
            <Edit2 size={16} />
          </button>

          <button
            onClick={() => onDelete(quote.id)}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-600 hover:text-red-400 transition-colors"
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Pin Badge */}
      {quote.isPinned && (
        <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400">
          <Pin size={12} fill="currentColor" />
          <span>Épinglée (3x plus fréquente)</span>
        </div>
      )}
    </div>
  );
}
