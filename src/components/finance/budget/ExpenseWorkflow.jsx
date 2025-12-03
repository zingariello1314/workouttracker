import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { useBudget } from '../../../hooks/useBudget';
import { useToast } from '../../ui/Toast';
import { notificationService } from '../../../utils/notifications';

const ExpenseWorkflow = ({ depense }) => {
  const { updateDepensePlanifiee } = useBudget();
  const { showToast } = useToast();
  const [currentStatut, setCurrentStatut] = useState(depense.statut || 'planifie');

  useEffect(() => {
    setCurrentStatut(depense.statut || 'planifie');
  }, [depense]);

  useEffect(() => {
    // Notifications automatiques selon statut et date
    const daysUntil = moment(depense.date).diff(moment(), 'days');

    // Si confirmé et J-7
    if (currentStatut === 'confirme' && daysUntil === 7) {
      notificationService.showFinanceAlert(
        depense.titre,
        `Rappel : ${depense.titre} dans 7 jours`,
        'high'
      );
      handleStatusChange('imminent');
    }

    // Si imminent et J-1
    if (currentStatut === 'imminent' && daysUntil === 1) {
      notificationService.showFinanceAlert(
        depense.titre,
        `Demain : ${depense.titre} - ${formatCurrency(depense.montant)}`,
        'high'
      );
    }

    // Si imminent et J+0
    if (currentStatut === 'imminent' && daysUntil === 0) {
      notificationService.showFinanceAlert(
        depense.titre,
        `Aujourd'hui : ${depense.titre}`,
        'critical'
      );
    }
  }, [depense, currentStatut]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleStatusChange = async (newStatut) => {
    try {
      await updateDepensePlanifiee(depense.id, { statut: newStatut });
      setCurrentStatut(newStatut);
      showToast(`Statut changé : ${newStatut}`, 'success');
    } catch (error) {
      showToast('Erreur lors du changement de statut', 'error');
    }
  };

  const getStatusIcon = (statut) => {
    const icons = {
      planifie: '📌',
      confirme: '🎯',
      imminent: '⏰',
      realise: '✅',
      analyse: '📊',
      depassement: '🔴',
      annule: '❌'
    };
    return icons[statut] || '📌';
  };

  const getStatusColor = (statut) => {
    const colors = {
      planifie: 'bg-blue-600/20 border-blue-500/50 text-blue-300',
      confirme: 'bg-green-600/20 border-green-500/50 text-green-300',
      imminent: 'bg-yellow-600/20 border-yellow-500/50 text-yellow-300',
      realise: 'bg-slate-600/20 border-slate-500/50 text-slate-300',
      analyse: 'bg-purple-600/20 border-purple-500/50 text-purple-300',
      depassement: 'bg-red-600/20 border-red-500/50 text-red-300',
      annule: 'bg-red-900/20 border-red-700/50 text-red-400'
    };
    return colors[statut] || colors.planifie;
  };

  const getAvailableActions = (statut) => {
    const actions = {
      planifie: ['confirme', 'annule'],
      confirme: ['imminent', 'annule'],
      imminent: ['realise', 'annule'],
      realise: ['analyse'],
      analyse: [],
      annule: []
    };
    return actions[statut] || [];
  };

  const availableActions = getAvailableActions(currentStatut);

  return (
    <div className="expense-workflow space-y-4">
      {/* Statut actuel */}
      <div className={`border rounded-lg p-4 ${getStatusColor(currentStatut)}`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{getStatusIcon(currentStatut)}</span>
          <div>
            <div className="font-semibold">Statut: {currentStatut}</div>
            <div className="text-sm opacity-80">
              {moment(depense.date).format('DD/MM/YYYY')} - {formatCurrency(depense.montant)}
            </div>
          </div>
        </div>
      </div>

      {/* Actions disponibles */}
      {availableActions.length > 0 && (
        <div>
          <div className="text-sm font-medium text-slate-300 mb-2">Actions disponibles</div>
          <div className="flex gap-2 flex-wrap">
            {availableActions.map(action => (
              <button
                key={action}
                onClick={() => handleStatusChange(action)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  action === 'annule'
                    ? 'bg-red-600/30 hover:bg-red-600/50 text-red-300'
                    : 'bg-blue-600/30 hover:bg-blue-600/50 text-blue-300'
                }`}
              >
                {action === 'confirme' && '✓ Confirmer'}
                {action === 'imminent' && '⏰ Marquer imminent'}
                {action === 'realise' && '✅ Marquer réalisé'}
                {action === 'analyse' && '📊 Analyser'}
                {action === 'annule' && '❌ Annuler'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timeline workflow */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
        <div className="text-sm font-medium text-slate-300 mb-3">Workflow</div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {['planifie', 'confirme', 'imminent', 'realise', 'analyse'].map((statut, index) => {
            const isActive = currentStatut === statut;
            const isPast = ['planifie', 'confirme', 'imminent', 'realise', 'analyse'].indexOf(currentStatut) > index;
            
            return (
              <React.Fragment key={statut}>
                <div className={`flex flex-col items-center min-w-[80px] ${
                  isActive ? 'text-white' : isPast ? 'text-green-400' : 'text-slate-500'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                    isActive ? 'bg-blue-600' : isPast ? 'bg-green-600' : 'bg-slate-700'
                  }`}>
                    {getStatusIcon(statut)}
                  </div>
                  <div className="text-xs mt-1 text-center capitalize">{statut}</div>
                </div>
                {index < 4 && (
                  <div className={`h-1 w-8 ${
                    isPast ? 'bg-green-600' : 'bg-slate-700'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExpenseWorkflow;

