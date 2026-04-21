/**
 * QuoteManager Component
 * Main container for quote management in Settings
 */

import React, { useState } from 'react';
import { Quote, AlertTriangle, CheckCircle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { settingsTheme as S } from '../tabs/SettingsTab/settingsThemeClasses';
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
      <Card variant="settings">
        <CardHeader variant="settings">
          <CardTitle tone="settings" className="flex items-center normal-case tracking-normal">
            <Quote className="mr-2 text-red-400" size={20} />
            Citations de la page d'accueil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`py-8 text-center ${S.muted}`}>
            Chargement...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="settings">
        <CardHeader variant="settings">
          <CardTitle tone="settings" className="flex items-center normal-case tracking-normal">
            <Quote className="mr-2 text-red-400" size={20} />
            Citations de la page d'accueil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <AlertTriangle className="mx-auto mb-4 text-red-400" size={48} />
            <p className="text-red-400">Erreur : {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card variant="settings">
        <CardHeader variant="settings">
          <CardTitle tone="settings" className="flex items-center normal-case tracking-normal">
            <Quote className="mr-2 text-red-400" size={20} />
            Citations de la page d'accueil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Description */}
            <p className={`text-sm ${S.body}`}>
              Gérez les citations affichées sur votre page d'accueil. Choisissez entre un mode aléatoire
              ou une citation fixe.
            </p>

            {/* Action Status */}
            {actionStatus && (
              <div
                className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
                  actionStatus.type === 'success'
                    ? 'border-emerald-700/40 bg-emerald-950/25 text-emerald-300'
                    : 'border-red-700/45 bg-red-950/30 text-red-300'
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
                type="button"
                onClick={() => setShowAddForm(true)}
                className={`${S.btnPrimary} w-full`}
              >
                <span>+</span>
                <span>Ajouter une citation</span>
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
