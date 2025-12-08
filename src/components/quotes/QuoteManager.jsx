/**
 * QuoteManager Component
 * Main container for quote management in Settings
 */

import React, { useState } from 'react';
import { Quote, AlertTriangle, CheckCircle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { useQuotes } from '../../hooks/useQuotes';
import { ModeSelector } from './ModeSelector';
import { QuoteList } from './QuoteList';
import { AddQuoteForm } from './AddQuoteForm';
import { EditQuoteModal } from './EditQuoteModal';
import { ExportImportSection } from './ExportImportSection';

export function QuoteManager() {
  const {
    quotes,
    settings,
    loading,
    error,
    addQuote,
    updateQuote,
    deleteQuote,
    reorderQuotes,
    togglePin,
    updateSettings,
    refresh,
  } = useQuotes();

  const [editingQuote, setEditingQuote] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [actionStatus, setActionStatus] = useState(null); // { type: 'success' | 'error', message: string }

  // Handle mode change
  const handleModeChange = async (newMode) => {
    const result = await updateSettings({ mode: newMode });
    if (result.success) {
      showStatus('success', `Mode ${newMode === 'random' ? 'aléatoire' : 'fixe'} activé`);
    } else {
      showStatus('error', 'Erreur lors du changement de mode');
    }
  };

  // Handle fixed quote change
  const handleFixedQuoteChange = async (quoteId) => {
    const result = await updateSettings({ fixedQuoteId: quoteId || null });
    if (result.success) {
      showStatus('success', 'Citation fixe mise à jour');
    } else {
      showStatus('error', 'Erreur lors de la mise à jour');
    }
  };

  // Handle add quote
  const handleAddQuote = async (quoteData) => {
    const result = await addQuote(quoteData);
    if (result.success) {
      setShowAddForm(false);
      showStatus('success', 'Citation ajoutée avec succès');
    }
    return result;
  };

  // Handle edit quote
  const handleEditQuote = async (id, updates) => {
    const result = await updateQuote(id, updates);
    if (result.success) {
      setEditingQuote(null);
      showStatus('success', 'Citation modifiée avec succès');
    }
    return result;
  };

  // Handle delete quote
  const handleDeleteQuote = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette citation ?')) {
      return;
    }

    const result = await deleteQuote(id);
    if (result.success) {
      showStatus('success', 'Citation supprimée');
    } else {
      showStatus('error', 'Erreur lors de la suppression');
    }
  };

  // Handle toggle pin
  const handleTogglePin = async (id) => {
    const result = await togglePin(id);
    if (result.success) {
      const isPinned = result.quote.isPinned;
      showStatus('success', isPinned ? 'Citation épinglée' : 'Citation désépinglée');
    } else {
      showStatus('error', 'Erreur lors de l\'épinglage');
    }
  };

  // Handle reorder
  const handleReorder = async (quoteIds) => {
    const result = await reorderQuotes(quoteIds);
    if (!result.success) {
      showStatus('error', 'Erreur lors de la réorganisation');
    }
  };

  // Handle import complete
  const handleImportComplete = (result) => {
    refresh();
  };

  // Show status message
  const showStatus = (type, message) => {
    setActionStatus({ type, message });
    setTimeout(() => setActionStatus(null), 3000);
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Quote className="mr-2" size={20} />
            Citations de la page d'accueil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-400">
            Chargement...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Quote className="mr-2" size={20} />
            Citations de la page d'accueil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="mx-auto mb-4 text-red-400" size={48} />
            <p className="text-red-400">Erreur : {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Quote className="mr-2" size={20} />
            Citations de la page d'accueil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Description */}
            <p className="text-gray-300 text-sm">
              Gérez les citations affichées sur votre page d'accueil. Choisissez entre un mode aléatoire
              ou une citation fixe.
            </p>

            {/* Action Status */}
            {actionStatus && (
              <div
                className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
                  actionStatus.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}
              >
                {actionStatus.type === 'success' ? (
                  <CheckCircle size={16} />
                ) : (
                  <AlertTriangle size={16} />
                )}
                <span>{actionStatus.message}</span>
              </div>
            )}

            {/* Mode Selector */}
            <ModeSelector
              mode={settings?.mode || 'random'}
              fixedQuoteId={settings?.fixedQuoteId}
              quotes={quotes}
              onModeChange={handleModeChange}
              onFixedQuoteChange={handleFixedQuoteChange}
            />

            {/* Quote List */}
            <QuoteList
              quotes={quotes}
              onEdit={setEditingQuote}
              onDelete={handleDeleteQuote}
              onTogglePin={handleTogglePin}
              onReorder={handleReorder}
            />

            {/* Add Quote Form */}
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                + Ajouter une citation
              </button>
            ) : (
              <AddQuoteForm
                onAdd={handleAddQuote}
                onCancel={() => setShowAddForm(false)}
              />
            )}

            {/* Export/Import */}
            <ExportImportSection onImportComplete={handleImportComplete} />
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingQuote && (
        <EditQuoteModal
          quote={editingQuote}
          onSave={handleEditQuote}
          onClose={() => setEditingQuote(null)}
        />
      )}
    </>
  );
}
