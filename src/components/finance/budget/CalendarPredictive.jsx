import React, { useState, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useBudget } from '../../../hooks/useBudget';
import { useToast } from '../../ui/Toast';
import AddExpenseForm from './AddExpenseForm';
import ExpenseWorkflow from './ExpenseWorkflow';

const localizer = momentLocalizer(moment);

const CalendarPredictive = () => {
  const { depensesPlanifiees, chargesFixes, budget } = useBudget();
  const { showToast } = useToast();
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  function getViewMonths(viewType) {
    switch (viewType) {
      case 'month': return 1;
      case 'week': return 1;
      case 'day': return 1;
      case 'agenda': return 3;
      default: return 1;
    }
  }

  function generateOccurrences(charge, startDate, viewType) {
    const occurrences = [];
    const monthsToShow = getViewMonths(viewType);
    const endDate = moment(startDate).add(monthsToShow, 'months');
    let current = moment(startDate).startOf('month');

    while (current.isBefore(endDate)) {
      if (charge.frequence === 'mensuel') {
        occurrences.push({ date: current.toDate() });
        current.add(1, 'month');
      } else if (charge.frequence === 'trimestriel') {
        occurrences.push({ date: current.toDate() });
        current.add(3, 'months');
      } else if (charge.frequence === 'annuel') {
        occurrences.push({ date: current.toDate() });
        current.add(1, 'year');
      } else {
        current.add(1, 'month');
      }
    }

    return occurrences;
  }

  function getEventStyle(depense) {
    const colors = {
      planifie: '#3b82f6',
      confirme: '#10b981',
      imminent: '#f59e0b',
      realise: '#6b7280',
      depassement: '#ef4444',
      annule: '#ef4444'
    };

    return {
      backgroundColor: colors[depense.statut] || colors.planifie,
      borderLeft: depense.priorite === 'urgent' ? '4px solid #ef4444' : 'none',
      borderRadius: '4px',
      opacity: depense.statut === 'annule' ? 0.5 : 1
    };
  }

  const events = useMemo(() => {
    const allEvents = [];

    depensesPlanifiees.forEach(depense => {
      allEvents.push({
        id: depense.id,
        title: `${depense.titre} - ${formatCurrency(depense.montant)}`,
        start: new Date(depense.date),
        end: new Date(depense.date),
        resource: {
          type: 'DEPENSE',
          ...depense
        },
        style: getEventStyle(depense)
      });
    });

    chargesFixes.forEach(charge => {
      const occurrences = generateOccurrences(charge, date, view);
      occurrences.forEach(occ => {
        allEvents.push({
          id: `${charge.id}_${occ.date.getTime()}`,
          title: `${charge.icone || '💰'} ${charge.nom || charge.type} - ${formatCurrency(charge.montant)}`,
          start: occ.date,
          end: occ.date,
          resource: {
            type: 'CHARGE_FIXE',
            ...charge
          },
          style: { backgroundColor: '#6b7280', borderLeft: '4px solid #9ca3af' }
        });
      });
    });

    return allEvents;
  }, [depensesPlanifiees, chargesFixes, date, view]);

  const budgetLibre = useMemo(() => {
    if (!budget) return 0;
    const mois = moment(date).format('YYYY-MM');
    const revenus = budget.revenus || 0;
    const totalChargesFixes = chargesFixes
      .filter(cf => cf.frequence === 'mensuel')
      .reduce((sum, cf) => sum + cf.montant, 0);
    const totalDepensesPlanifiees = depensesPlanifiees
      .filter(d => {
        const dMois = moment(d.date).format('YYYY-MM');
        return dMois === mois && d.statut !== 'annule';
      })
      .reduce((sum, d) => sum + d.montant, 0);
    return revenus - totalChargesFixes - totalDepensesPlanifiees;
  }, [budget, chargesFixes, depensesPlanifiees, date]);

  return (
    <div className="calendar-predictive space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Calendrier Prédictif</h3>
          <div className="text-sm text-slate-400">
            Budget libre ce mois : <span className={`font-semibold ${budgetLibre >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(budgetLibre)}
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          <span>Ajouter Dépense</span>
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setView('month')}
          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
            view === 'month' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Mois
        </button>
        <button
          onClick={() => setView('week')}
          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
            view === 'week' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Semaine
        </button>
        <button
          onClick={() => setView('day')}
          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
            view === 'day' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Jour
        </button>
        <button
          onClick={() => setView('agenda')}
          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
            view === 'agenda' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Agenda
        </button>
      </div>

      {showAddForm && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <AddExpenseForm
            onSave={async () => {
              setShowAddForm(false);
              showToast('Dépense ajoutée', 'success');
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          onSelectEvent={(event) => setSelectedEvent(event)}
          onSelectSlot={() => {
            setSelectedEvent(null);
            setShowAddForm(true);
          }}
          selectable
          eventPropGetter={(event) => ({ style: event.style || {} })}
          messages={{
            next: 'Suivant',
            previous: 'Précédent',
            today: "Aujourd'hui",
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour',
            agenda: 'Agenda',
            noEventsInRange: 'Aucun événement dans cette période'
          }}
          style={{ height: 600 }}
        />
      </div>

      {selectedEvent && selectedEvent.resource.type === 'DEPENSE' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Détails Dépense</h4>
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-slate-400 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2 mb-4">
            <div>
              <span className="text-slate-400">Titre: </span>
              <span className="text-white font-semibold">{selectedEvent.resource.titre}</span>
            </div>
            <div>
              <span className="text-slate-400">Montant: </span>
              <span className="text-white font-semibold">{formatCurrency(selectedEvent.resource.montant)}</span>
            </div>
            {selectedEvent.resource.statut && (
              <div>
                <span className="text-slate-400">Statut: </span>
                <span className="text-white capitalize">{selectedEvent.resource.statut}</span>
              </div>
            )}
            <div>
              <span className="text-slate-400">Date: </span>
              <span className="text-white">{moment(selectedEvent.start).format('DD/MM/YYYY')}</span>
            </div>
          </div>
          <ExpenseWorkflow depense={selectedEvent.resource} />
        </div>
      )}

      {selectedEvent && selectedEvent.resource.type === 'CHARGE_FIXE' && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Charge Fixe</h4>
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-slate-400 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-slate-400">Nom: </span>
              <span className="text-white font-semibold">{selectedEvent.resource.nom || selectedEvent.resource.type}</span>
            </div>
            <div>
              <span className="text-slate-400">Montant: </span>
              <span className="text-white font-semibold">{formatCurrency(selectedEvent.resource.montant)}</span>
            </div>
            <div>
              <span className="text-slate-400">Fréquence: </span>
              <span className="text-white capitalize">{selectedEvent.resource.frequence}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPredictive;



