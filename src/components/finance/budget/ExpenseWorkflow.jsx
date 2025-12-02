/**
 * Composant ExpenseWorkflow - Workflow des dépenses avec états et notifications
 * Gère les transitions d'état : planifié → confirmé → imminent → réalisé
 */

import React, { useState, useEffect } from 'react';
import { useBudget } from '../../../hooks/useBudget';
import { useToast } from '../../ui/Toast';
import ExpenseForm from './ExpenseForm';

const ExpenseWorkflow = ({ expense, onUpdate, onDelete, onClose }) => {
  const { categories } = useBudget();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [daysUntil, setDaysUntil] = useState(0);

  useEffect(() => {
    if (expense && expense.datePlanifiee) {
      const expenseDate = new Date(expense.datePlanifiee);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expenseDate.setHours(0, 0, 0, 0);
      const diff = Math.ceil((expenseDate - today) / (1000 * 60 * 60 * 24));
      setDaysUntil(diff);
    }
  }, [expense]);

  const category = categories.find(c => c.id === expense.categorie);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusInfo = (statut) => {
    const statuses = {
      planifie: { label: '📌 Planifié', color: 'bg-blue-900/20 border-blue-500/50 text-blue-300', icon: '📌' },
      confirme: { label: '🎯 Confirmé', color: 'bg-green-900/20 border-green-500/50 text-green-300', icon: '🎯' },
      imminent: { label: '⏰ Imminent', color: 'bg-orange-900/20 border-orange-500/50 text-orange-300', icon: '⏰' },
      realise: { label: '✅ Réalisé', color: 'bg-slate-700/50 border-slate-600/50 text-slate-300', icon: '✅' },
      depassement: { label: '🔴 Dépassement', color: 'bg-red-900/20 border-red-500/50 text-red-300', icon: '🔴' }
    };
    return statuses[statut] || statuses.planifie;
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await onUpdate({ statut: newStatus });
      showToast(`Statut changé : ${getStatusInfo(newStatus).label}`, 'success');
    } catch (error) {
      showToast('Erreur lors du changement de statut', 'error');
    }
  };

  const handleSave = async (expenseData) => {
    try {
      await onUpdate(expenseData);
      showToast('Dépense mise à jour', 'success');
      setEditing(false);
    } catch (error) {
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
      try {
        await onDelete();
        showToast('Dépense supprimée', 'success');
      } catch (error) {
        showToast('Erreur lors de la suppression', 'error');
      }
    }
  };

  // Notifications automatiques (désactivées pour éviter les boucles - à implémenter avec un système de notifications externe)
  // useEffect(() => {
  //   if (expense && expense.statut === 'confirme' && daysUntil === 7) {
  //     showToast(`Rappel : ${expense.titre} dans 7 jours`, 'info');
  //   } else if (expense && expense.statut === 'imminent' && daysUntil === 1) {
  //     showToast(`Demain : ${expense.titre} - ${formatCurrency(expense.montant)}`, 'warning');
  //   } else if (expense && expense.statut === 'imminent' && daysUntil === 0) {
  //     showToast(`Aujourd'hui : ${expense.titre}`, 'warning');
  //   }
  // }, [daysUntil, expense]);

  if (editing) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-semibold text-white">Modifier la dépense</h4>
          <button
            onClick={() => setEditing(false)}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        <ExpenseForm
          expense={expense}
          date={new Date(expense.datePlanifiee || expense.date)}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  const statusInfo = getStatusInfo(expense.statut);

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-white mb-1">{expense.titre}</h4>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded border text-xs ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            {expense.priorite === 'urgent' && (
              <span className="px-2 py-1 rounded bg-red-900/20 border border-red-500/50 text-red-300 text-xs">
                🔴 Urgent
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Informations */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-slate-400 mb-1">Montant</div>
          <div className="text-xl font-bold text-white">{formatCurrency(expense.montant)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-1">Catégorie</div>
          <div className="text-lg font-semibold text-white">
            {category ? `${category.icone} ${category.nom}` : 'Non catégorisé'}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-1">Date planifiée</div>
          <div className="text-lg text-slate-300">
            {new Date(expense.datePlanifiee || expense.date).toLocaleDateString('fr-FR')}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-1">Jours restants</div>
          <div className={`text-lg font-semibold ${
            daysUntil < 0 ? 'text-red-400' : daysUntil <= 7 ? 'text-orange-400' : 'text-green-400'
          }`}>
            {daysUntil < 0 ? `Dépassé de ${Math.abs(daysUntil)} jour${Math.abs(daysUntil) > 1 ? 's' : ''}` : 
             daysUntil === 0 ? 'Aujourd\'hui' :
             daysUntil === 1 ? 'Demain' :
             `${daysUntil} jours`}
          </div>
        </div>
      </div>

      {/* Actions workflow */}
      <div className="border-t border-slate-700/50 pt-4">
        <div className="text-sm font-semibold text-slate-300 mb-3">Changer le statut</div>
        <div className="flex flex-wrap gap-2">
          {expense.statut !== 'planifie' && (
            <button
              onClick={() => handleStatusChange('planifie')}
              className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-300 rounded text-sm transition-colors"
            >
              📌 Planifié
            </button>
          )}
          {expense.statut !== 'confirme' && (
            <button
              onClick={() => handleStatusChange('confirme')}
              className="px-3 py-1 bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 text-green-300 rounded text-sm transition-colors"
            >
              🎯 Confirmé
            </button>
          )}
          {expense.statut !== 'imminent' && (
            <button
              onClick={() => handleStatusChange('imminent')}
              className="px-3 py-1 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/50 text-orange-300 rounded text-sm transition-colors"
            >
              ⏰ Imminent
            </button>
          )}
          {expense.statut !== 'realise' && (
            <button
              onClick={() => handleStatusChange('realise')}
              className="px-3 py-1 bg-slate-600/20 hover:bg-slate-600/30 border border-slate-500/50 text-slate-300 rounded text-sm transition-colors"
            >
              ✅ Réalisé
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end border-t border-slate-700/50 pt-4">
        <button
          onClick={() => setEditing(true)}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
        >
          ✏️ Modifier
        </button>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 rounded-lg transition-colors"
        >
          🗑️ Supprimer
        </button>
      </div>
    </div>
  );
};

export default ExpenseWorkflow;

