/**
 * Composant CalendarPredictive - Calendrier prédictif interactif
 * Affiche les dépenses planifiées avec workflow et statuts visuels
 */

import React, { useState, useMemo } from 'react';
import { useBudget } from '../../../hooks/useBudget';
import { useToast } from '../../ui/Toast';
import ExpenseWorkflow from './ExpenseWorkflow';
import ExpenseForm from './ExpenseForm';

const CalendarPredictive = () => {
  const { budget, categories, depenses, addDepensePlanifiee, updateDepensePlanifiee, deleteDepensePlanifiee } = useBudget();
  const { showToast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month', 'week', 'day'
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Calculer le premier jour du mois et les jours du mois
  const monthStart = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month, 1);
  }, [currentDate]);

  const monthEnd = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month + 1, 0);
  }, [currentDate]);

  const daysInMonth = monthEnd.getDate();
  const firstDayOfWeek = monthStart.getDay();

  // Générer les jours du mois
  const days = useMemo(() => {
    const daysArray = [];
    
    // Jours du mois précédent (pour compléter la première semaine)
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(monthStart);
      date.setDate(date.getDate() - i - 1);
      daysArray.push({ date, isCurrentMonth: false });
    }

    // Jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(monthStart);
      date.setDate(day);
      daysArray.push({ date, isCurrentMonth: true });
    }

    // Jours du mois suivant (pour compléter la dernière semaine)
    const remainingDays = 42 - daysArray.length; // 6 semaines * 7 jours
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(monthEnd);
      date.setDate(date.getDate() + day);
      daysArray.push({ date, isCurrentMonth: false });
    }

    return daysArray;
  }, [monthStart, monthEnd, daysInMonth, firstDayOfWeek]);

  // Grouper les dépenses par date
  const expensesByDate = useMemo(() => {
    const grouped = {};
    depenses.forEach(depense => {
      const dateKey = new Date(depense.date).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(depense);
    });
    return grouped;
  }, [depenses]);

  // Calculer le budget libre pour un mois donné
  const calculateBudgetLibre = (date) => {
    if (!budget) return 0;
    
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const depensesMois = depenses.filter(d => {
      const depenseDate = new Date(d.date);
      return depenseDate.getFullYear() === year && depenseDate.getMonth() === month;
    });
    
    const totalDepenses = depensesMois.reduce((sum, d) => sum + (d.montant || 0), 0);
    return (budget.revenus || 0) - totalDepenses - (budget.epargne?.objectif || 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getEventStyle = (depense) => {
    const colors = {
      planifie: '#3b82f6',
      confirme: '#10b981',
      imminent: '#f59e0b',
      realise: '#6b7280',
      depassement: '#ef4444'
    };
    
    return {
      backgroundColor: colors[depense.statut] || colors.planifie,
      borderLeft: depense.priorite === 'urgent' ? '3px solid #ef4444' : 'none'
    };
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setShowAddForm(true);
    setSelectedExpense(null);
  };

  const handleExpenseClick = (expense) => {
    setSelectedExpense(expense);
    setShowAddForm(false);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  return (
    <div className="calendar-predictive space-y-4">
      {/* Contrôles du calendrier */}
      <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePreviousMonth}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
          >
            ←
          </button>
          <h3 className="text-lg font-semibold text-white min-w-[200px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button
            onClick={handleNextMonth}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
          >
            →
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm"
          >
            Aujourd'hui
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('month')}
            className={`px-3 py-1 rounded text-sm transition-all ${
              view === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Mois
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-3 py-1 rounded text-sm transition-all ${
              view === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Semaine
          </button>
        </div>
      </div>

      {/* Budget libre du mois */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400 mb-1">Budget libre du mois</div>
            <div className={`text-xl font-bold ${
              calculateBudgetLibre(currentDate) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatCurrency(calculateBudgetLibre(currentDate))}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400 mb-1">Revenus</div>
            <div className="text-lg font-semibold text-white">
              {formatCurrency(budget?.revenus || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Calendrier */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
        {/* En-têtes des jours */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-sm font-semibold text-slate-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Jours du calendrier */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const dateKey = day.date.toDateString();
            const dayExpenses = expensesByDate[dateKey] || [];
            const isToday = day.date.toDateString() === new Date().toDateString();
            const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();

            return (
              <div
                key={index}
                onClick={() => handleDateClick(day.date)}
                className={`min-h-[100px] p-2 rounded border transition-all cursor-pointer ${
                  !day.isCurrentMonth
                    ? 'bg-slate-800/30 border-slate-700/30 text-slate-600'
                    : isToday
                    ? 'bg-blue-900/20 border-blue-500/50'
                    : isSelected
                    ? 'bg-slate-700/50 border-blue-500'
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                }`}
              >
                <div className={`text-sm font-semibold mb-1 ${
                  !day.isCurrentMonth ? 'text-slate-600' : isToday ? 'text-blue-400' : 'text-slate-300'
                }`}>
                  {day.date.getDate()}
                </div>
                
                {/* Dépenses du jour */}
                <div className="space-y-1">
                  {dayExpenses.slice(0, 3).map(expense => (
                    <div
                      key={expense.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExpenseClick(expense);
                      }}
                      className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                      style={getEventStyle(expense)}
                    >
                      {expense.titre} - {formatCurrency(expense.montant)}
                    </div>
                  ))}
                  {dayExpenses.length > 3 && (
                    <div className="text-xs text-slate-400">
                      +{dayExpenses.length - 3} autre{dayExpenses.length - 3 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Formulaire d'ajout/édition */}
      {showAddForm && selectedDate && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h4 className="text-md font-semibold text-white mb-4">
            Ajouter une dépense planifiée - {selectedDate.toLocaleDateString('fr-FR')}
          </h4>
          <ExpenseForm
            date={selectedDate}
            onSave={async (expenseData) => {
              try {
                await addDepensePlanifiee({
                  ...expenseData,
                  date: selectedDate.toISOString().split('T')[0]
                });
                showToast('Dépense ajoutée', 'success');
                setShowAddForm(false);
                setSelectedDate(null);
              } catch (error) {
                showToast('Erreur lors de l\'ajout', 'error');
              }
            }}
            onCancel={() => {
              setShowAddForm(false);
              setSelectedDate(null);
            }}
          />
        </div>
      )}

      {/* Détails et workflow d'une dépense */}
      {selectedExpense && !showAddForm && (
        <ExpenseWorkflow
          expense={selectedExpense}
          onUpdate={async (updates) => {
            try {
              await updateDepensePlanifiee(selectedExpense.id, updates);
              showToast('Dépense mise à jour', 'success');
              setSelectedExpense(null);
            } catch (error) {
              showToast('Erreur lors de la mise à jour', 'error');
            }
          }}
          onDelete={async () => {
            try {
              await deleteDepensePlanifiee(selectedExpense.id);
              showToast('Dépense supprimée', 'success');
              setSelectedExpense(null);
            } catch (error) {
              showToast('Erreur lors de la suppression', 'error');
            }
          }}
          onClose={() => setSelectedExpense(null)}
        />
      )}
    </div>
  );
};

export default CalendarPredictive;
