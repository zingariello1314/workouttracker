import React, { useRef, useCallback, useTransition } from 'react';
import { useThrottle } from '../../../../hooks/useThrottle';
import { DEBOUNCE_DELAY_MS, DATE_RANGE, ARIA_LABELS, KEYBOARD } from '../constants';

/**
 * 🟡 FIX #17 : Composant de navigation temporelle avancée avec optimisations
 * - Throttling pour navigation boutons (200ms)
 * - useTransition pour navigation non-bloquante
 * - Debouncing pour sélecteur de date (300ms)
 * - Mémorisation des calculs de dates
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
  
  // 🟡 FIX #17 : useTransition pour navigation non-bloquante
  const [isPending, startTransition] = useTransition();
  
  // 🟡 FIX #17 : Throttling pour navigation boutons (200ms pour réactivité)
  const throttledSetSelectedDate = useThrottle(
    useCallback((date) => {
      startTransition(() => {
        setSelectedDate(date);
      });
    }, [setSelectedDate]),
    200 // THROTTLE_DELAY_MS - pourrait être ajouté aux constantes si nécessaire
  );

  // 🔴 FIX #51-60: Utiliser constante pour debounce delay
  const debounceTimerRef = useRef(null);

  const debouncedSetSelectedDate = useCallback((date) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    // Mettre à jour rapidement avec transition pour feedback visuel immédiat
    debounceTimerRef.current = setTimeout(() => {
      startTransition(() => {
        setSelectedDate(date);
      });
    }, DEBOUNCE_DELAY_MS);
  }, [setSelectedDate]);

  // Cleanup du timer au démontage
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Calculer les dates de comparaison possibles
  const availableCompareDates = React.useMemo(() => 
    dateKeys.filter(d => d !== selectedDate),
    [dateKeys, selectedDate]
  );

  // 🟡 FIX #17 : Navigation optimisée avec throttling et transition
  const goToPrevious = useCallback(() => {
    if (!selectedDate || dateKeys.length === 0) return;
    const currentIndex = dateKeys.indexOf(selectedDate);
    if (currentIndex > 0) {
      throttledSetSelectedDate(dateKeys[currentIndex - 1]);
    }
  }, [selectedDate, dateKeys, throttledSetSelectedDate]);

  const goToNext = useCallback(() => {
    if (!selectedDate || dateKeys.length === 0) return;
    const currentIndex = dateKeys.indexOf(selectedDate);
    if (currentIndex < dateKeys.length - 1) {
      throttledSetSelectedDate(dateKeys[currentIndex + 1]);
    }
  }, [selectedDate, dateKeys, throttledSetSelectedDate]);

  // 🔴 FIX : goToToday doit vraiment chercher "aujourd'hui", et le sélectionner même s'il n'existe pas encore
  const goToToday = useCallback(() => {
    // Obtenir "aujourd'hui" en date locale (pas UTC)
    const now = new Date();
    const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    // 🔴 FIX : Toujours sélectionner aujourd'hui, même s'il n'est pas dans les dates disponibles
    // Cela permettra de voir qu'il n'y a pas de données et de déclencher une sync si nécessaire
    startTransition(() => {
      setSelectedDate(todayLocal);
    });
    
    // Afficher un message si la date n'est pas disponible
    if (dateKeys.length > 0 && !dateKeys.includes(todayLocal)) {
      console.log(`[TimeNavigation] Aujourd'hui (${todayLocal}) n'est pas dans les données disponibles. Synchronisation recommandée.`);
    }
  }, [dateKeys, setSelectedDate]);

  const goToFirst = useCallback(() => {
    if (dateKeys.length > 0) {
      startTransition(() => {
        setSelectedDate(dateKeys[0]);
      });
    }
  }, [dateKeys, setSelectedDate]);

  const goToLast = useCallback(() => {
    if (dateKeys.length > 0) {
      startTransition(() => {
        setSelectedDate(dateKeys[dateKeys.length - 1]);
      });
    }
  }, [dateKeys, setSelectedDate]);

  // 🟡 FIX #17 : Filtres de période optimisés (calculs mémorisés)
  const applyPeriodFilter = useCallback((period) => {
    setPeriodFilter(period);
    if (!dateKeys || dateKeys.length === 0) return;

    const today = new Date();
    let filteredDates = [];

    switch (period) {
      case 'week':
        // 🔴 FIX #51-60: Utiliser constante pour période
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - DATE_RANGE.ACTIVITIES_DAYS);
        filteredDates = dateKeys.filter(d => new Date(d) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setDate(today.getDate() - 30); // 30 jours = 1 mois
        filteredDates = dateKeys.filter(d => new Date(d) >= monthAgo);
        break;
      case '3months':
        // 🔴 FIX #51-60: Utiliser constante pour métriques (90 jours)
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setDate(today.getDate() - DATE_RANGE.METRICS_DAYS);
        filteredDates = dateKeys.filter(d => new Date(d) >= threeMonthsAgo);
        break;
      case '6months':
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setDate(today.getDate() - 180); // 180 jours = 6 mois
        filteredDates = dateKeys.filter(d => new Date(d) >= sixMonthsAgo);
        break;
      case 'year':
        // 🔴 FIX #51-60: Utiliser constante pour historique max
        const yearAgo = new Date(today);
        yearAgo.setDate(today.getDate() - DATE_RANGE.MAX_HISTORY_DAYS);
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
      startTransition(() => {
        setSelectedDate(filteredDates[filteredDates.length - 1]);
      });
    }
  }, [dateKeys, customStartDate, customEndDate, setPeriodFilter, setSelectedDate]);

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Navigation principale */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToFirst}
            disabled={!selectedDate || dateKeys.indexOf(selectedDate) === 0}
            aria-label="Aller à la première date"
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            {/* 🔴 FIX : Sélecteur de date libre pour permettre de choisir n'importe quelle date */}
            <input
              type="date"
              value={selectedDate || ''}
              onChange={(e) => {
                const newDate = e.target.value;
                if (newDate) {
                  // Vérifier si la date est disponible dans dateKeys
                  if (dateKeys.includes(newDate)) {
                    debouncedSetSelectedDate(newDate);
                  } else {
                    // Si la date n'est pas disponible, la sélectionner quand même
                    // (elle sera synchronisée si nécessaire)
                    startTransition(() => {
                      setSelectedDate(newDate);
                    });
                  }
                }
              }}
              disabled={isPending}
              aria-label={ARIA_LABELS.DATE_SELECTOR}
              aria-busy={isPending}
              className="bg-slate-900 border-0 text-white font-semibold text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              max={(() => {
                // Limiter aux dates jusqu'à aujourd'hui
                const now = new Date();
                return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
              })()}
            />
            {isPending && (
              <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            )}
            {/* 🔴 FIX : Afficher un indicateur si la date sélectionnée n'est pas dans les données disponibles */}
            {selectedDate && !dateKeys.includes(selectedDate) && (
              <span className="text-yellow-400 text-xs" title="Cette date n'a pas encore de données. Synchronisez pour récupérer les données.">
                ⚠️ Pas de données
              </span>
            )}
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

