import React from 'react';

/**
 * Composant de navigation temporelle avancée avec filtres, boutons et comparaisons
 */
export default function TimeNavigation({
  selectedDate,
  setSelectedDate,
  dateKeys,
  comparisonMode,
  setComparisonMode,
  compareDate,
  setCompareDate,
  periodFilter,
  setPeriodFilter,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate
}) {
  const [showFilters, setShowFilters] = React.useState(false);
  const [showComparison, setShowComparison] = React.useState(false);

  // Calculer les dates de comparaison possibles
  const availableCompareDates = dateKeys.filter(d => d !== selectedDate);

  // Navigation entre dates
  const goToPrevious = () => {
    if (!selectedDate || dateKeys.length === 0) return;
    const currentIndex = dateKeys.indexOf(selectedDate);
    if (currentIndex > 0) {
      setSelectedDate(dateKeys[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (!selectedDate || dateKeys.length === 0) return;
    const currentIndex = dateKeys.indexOf(selectedDate);
    if (currentIndex < dateKeys.length - 1) {
      setSelectedDate(dateKeys[currentIndex + 1]);
    }
  };

  const goToToday = () => {
    if (dateKeys.length > 0) {
      setSelectedDate(dateKeys[dateKeys.length - 1]);
    }
  };

  const goToFirst = () => {
    if (dateKeys.length > 0) {
      setSelectedDate(dateKeys[0]);
    }
  };

  const goToLast = () => {
    if (dateKeys.length > 0) {
      setSelectedDate(dateKeys[dateKeys.length - 1]);
    }
  };

  // Filtres de période
  const applyPeriodFilter = (period) => {
    setPeriodFilter(period);
    if (!dateKeys || dateKeys.length === 0) return;

    const today = new Date();
    let filteredDates = [];

    switch (period) {
      case 'week':
        // 7 derniers jours
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        filteredDates = dateKeys.filter(d => new Date(d) >= weekAgo);
        break;
      case 'month':
        // 30 derniers jours
        const monthAgo = new Date(today);
        monthAgo.setDate(today.getDate() - 30);
        filteredDates = dateKeys.filter(d => new Date(d) >= monthAgo);
        break;
      case '3months':
        // 90 derniers jours
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setDate(today.getDate() - 90);
        filteredDates = dateKeys.filter(d => new Date(d) >= threeMonthsAgo);
        break;
      case '6months':
        // 180 derniers jours
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setDate(today.getDate() - 180);
        filteredDates = dateKeys.filter(d => new Date(d) >= sixMonthsAgo);
        break;
      case 'year':
        // 365 derniers jours
        const yearAgo = new Date(today);
        yearAgo.setDate(today.getDate() - 365);
        filteredDates = dateKeys.filter(d => new Date(d) >= yearAgo);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          filteredDates = dateKeys.filter(d => {
            const date = new Date(d);
            return date >= new Date(customStartDate) && date <= new Date(customEndDate);
          });
        }
        break;
      case 'all':
      default:
        filteredDates = dateKeys;
        break;
    }

    if (filteredDates.length > 0) {
      setSelectedDate(filteredDates[filteredDates.length - 1]);
    }
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Navigation principale */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToFirst}
            disabled={!selectedDate || dateKeys.indexOf(selectedDate) === 0}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            title="Première date"
          >
            ««
          </button>
          <button
            onClick={goToPrevious}
            disabled={!selectedDate || dateKeys.indexOf(selectedDate) === 0}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Jour précédent"
          >
            ‹
          </button>
          
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded">
            <span className="text-slate-400 text-sm">Date:</span>
            <select
              value={selectedDate || ''}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-900 border-0 text-white font-semibold text-sm cursor-pointer focus:outline-none"
            >
              {dateKeys.map((dk) => (
                <option key={dk} value={dk}>{dk}</option>
              ))}
            </select>
          </div>

          <button
            onClick={goToNext}
            disabled={!selectedDate || dateKeys.indexOf(selectedDate) === dateKeys.length - 1}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Jour suivant"
          >
            ›
          </button>
          <button
            onClick={goToLast}
            disabled={!selectedDate || dateKeys.indexOf(selectedDate) === dateKeys.length - 1}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            title="Dernière date"
          >
            »»
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
            title="Aujourd'hui"
          >
            Aujourd'hui
          </button>
        </div>

        {/* Boutons de filtres et comparaison */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              showFilters
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            🔍 Filtres
          </button>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              comparisonMode
                ? 'bg-purple-600 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            📊 Comparer
          </button>
        </div>
      </div>

      {/* Panneau Filtres */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <h5 className="text-white font-medium mb-3">Filtres de période</h5>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => applyPeriodFilter('week')}
              className={`px-3 py-1 rounded text-sm ${
                periodFilter === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              }`}
            >
              7 derniers jours
            </button>
            <button
              onClick={() => applyPeriodFilter('month')}
              className={`px-3 py-1 rounded text-sm ${
                periodFilter === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              }`}
            >
              30 derniers jours
            </button>
            <button
              onClick={() => applyPeriodFilter('3months')}
              className={`px-3 py-1 rounded text-sm ${
                periodFilter === '3months'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              }`}
            >
              3 derniers mois
            </button>
            <button
              onClick={() => applyPeriodFilter('6months')}
              className={`px-3 py-1 rounded text-sm ${
                periodFilter === '6months'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              }`}
            >
              6 derniers mois
            </button>
            <button
              onClick={() => applyPeriodFilter('year')}
              className={`px-3 py-1 rounded text-sm ${
                periodFilter === 'year'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              }`}
            >
              1 an
            </button>
            <button
              onClick={() => applyPeriodFilter('all')}
              className={`px-3 py-1 rounded text-sm ${
                periodFilter === 'all' || !periodFilter
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              }`}
            >
              Toutes les dates
            </button>
          </div>

          {/* Filtre personnalisé */}
          <div className="mt-3 pt-3 border-t border-slate-700">
            <h6 className="text-slate-300 text-sm mb-2">Période personnalisée</h6>
            <div className="flex gap-3 items-end">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Début</label>
                <input
                  type="date"
                  value={customStartDate || ''}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    if (e.target.value && customEndDate) {
                      applyPeriodFilter('custom');
                    }
                  }}
                  className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Fin</label>
                <input
                  type="date"
                  value={customEndDate || ''}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    if (customStartDate && e.target.value) {
                      applyPeriodFilter('custom');
                    }
                  }}
                  className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                />
              </div>
              <button
                onClick={() => {
                  if (customStartDate && customEndDate) {
                    setPeriodFilter('custom');
                    applyPeriodFilter('custom');
                  }
                }}
                disabled={!customStartDate || !customEndDate}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Appliquer
              </button>
              <button
                onClick={() => {
                  setCustomStartDate('');
                  setCustomEndDate('');
                  setPeriodFilter('all');
                  applyPeriodFilter('all');
                }}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panneau Comparaison */}
      {showComparison && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <h5 className="text-white font-medium mb-3">Mode Comparaison</h5>
          <div className="flex items-center gap-3 mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={comparisonMode}
                onChange={(e) => {
                  setComparisonMode(e.target.checked);
                  if (!e.target.checked) {
                    setCompareDate(null);
                  }
                }}
                className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-300 text-sm">Activer la comparaison</span>
            </label>
          </div>

          {comparisonMode && (
            <div className="flex gap-3 items-end">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Date de comparaison</label>
                <select
                  value={compareDate || ''}
                  onChange={(e) => setCompareDate(e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                >
                  <option value="">Sélectionner une date...</option>
                  {availableCompareDates.map((dk) => (
                    <option key={dk} value={dk}>{dk}</option>
                  ))}
                </select>
              </div>
              {compareDate && (
                <div className="px-3 py-2 bg-purple-900/30 border border-purple-700 rounded text-sm">
                  <span className="text-purple-300">Comparaison active:</span>
                  <span className="text-white ml-2 font-semibold">{compareDate}</span>
                  <span className="text-slate-400 ml-2">vs</span>
                  <span className="text-white ml-2 font-semibold">{selectedDate}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

