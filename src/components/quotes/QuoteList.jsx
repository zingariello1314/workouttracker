/**
 * QuoteList Component
 * Displays list of quotes with drag-and-drop reordering
 */

import React, { useState } from 'react';
import { QuoteCard } from './QuoteCard';
import { AlertTriangle } from 'lucide-react';
import { settingsTheme as S } from '../tabs/SettingsTab/settingsThemeClasses';

export function QuoteList({
  quotes,
  onEdit,
  onDelete,
  onTogglePin,
  onReorder,
  autoSplitLineGoal = null,
}) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newQuotes = [...quotes];
    const [draggedQuote] = newQuotes.splice(draggedIndex, 1);
    newQuotes.splice(dropIndex, 0, draggedQuote);

    const quoteIds = newQuotes.map((q) => q.id);
    await onReorder(quoteIds);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (quotes.length === 0) {
    return (
      <div className={`py-12 text-center ${S.muted}`}>
        <AlertTriangle size={48} className="mx-auto mb-4 opacity-50 text-red-400/50" />
        <p className="text-lg font-medium text-red-100/90">Aucune citation</p>
        <p className={`mt-2 text-sm ${S.muted}`}>Ajoutez votre première citation ci-dessous</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className={S.label}>
          {quotes.length === 1 ? '1 citation au total' : `${quotes.length} citations au total`}
        </h3>
        <p className={S.mutedXs}>
          Glissez-déposez pour réorganiser
        </p>
      </div>

      {quotes.map((quote, index) => (
        <div
          key={quote.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={`transition-all ${
            draggedIndex === index ? 'scale-95 opacity-50' : ''
          } ${
            dragOverIndex === index && draggedIndex !== index
              ? 'border-t-2 border-red-500 pt-2'
              : ''
          }`}
        >
          <QuoteCard
            quote={quote}
            onEdit={onEdit}
            onDelete={onDelete}
            onTogglePin={onTogglePin}
            draggable
            listPosition={index + 1}
            autoSplitLineGoal={autoSplitLineGoal}
          />
        </div>
      ))}
    </div>
  );
}
