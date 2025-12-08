/**
 * QuoteList Component
 * Displays list of quotes with drag-and-drop reordering
 */

import React, { useState } from 'react';
import { QuoteCard } from './QuoteCard';
import { AlertTriangle } from 'lucide-react';

export function QuoteList({ quotes, onEdit, onDelete, onTogglePin, onReorder }) {
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

    // Reorder quotes
    const newQuotes = [...quotes];
    const [draggedQuote] = newQuotes.splice(draggedIndex, 1);
    newQuotes.splice(dropIndex, 0, draggedQuote);

    // Update order
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
      <div className="text-center py-12 text-slate-400">
        <AlertTriangle size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">Aucune citation</p>
        <p className="text-sm mt-2">Ajoutez votre première citation ci-dessous</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-300">
          Citations ({quotes.length})
        </h3>
        <p className="text-xs text-slate-500">
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
            draggedIndex === index ? 'opacity-50 scale-95' : ''
          } ${
            dragOverIndex === index && draggedIndex !== index
              ? 'border-t-2 border-blue-500 pt-2'
              : ''
          }`}
        >
          <QuoteCard
            quote={quote}
            onEdit={onEdit}
            onDelete={onDelete}
            onTogglePin={onTogglePin}
            draggable
          />
        </div>
      ))}
    </div>
  );
}
