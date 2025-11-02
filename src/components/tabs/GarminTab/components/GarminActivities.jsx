import React from 'react';
import SwimmingActivityCard from './ActivityCards/SwimmingActivityCard';
import JumpRopeActivityCard from './ActivityCards/JumpRopeActivityCard';
import CardioActivityCard from './ActivityCards/CardioActivityCard';
import { normalizeGarminDate } from '../utils/garminFormatters';
import AdvancedFilters from './AdvancedFilters';
import ActivitySearch from './ActivitySearch';
import { useAdvancedFilters } from '../hooks/useAdvancedFilters';
import { PAGINATION } from '../constants';
import logger from '../../../../utils/logger';

const log = logger.component('GarminActivities');

/**
 * Composant pour afficher toutes les activités Garmin
 * 🟡 FIX #19: Pagination pour éviter lag avec beaucoup d'activités
 */
export default function GarminActivities({ activities, selectedDate }) {
  // 🔴 FIX #71-80: État pour filtres avancés et recherche
  const [filters, setFilters] = React.useState({
    type: 'all',
    startDate: null,
    endDate: null,
    minDistance: null,
    maxDistance: null,
    minDuration: null,
    maxDuration: null,
    minCalories: null,
    maxCalories: null
  });
  const [searchTerm, setSearchTerm] = React.useState('');

  // 🟡 FIX #19: État de pagination - utilise constante
  const [page, setPage] = React.useState(PAGINATION.INITIAL_PAGE);
  // Debug log (seulement en développement)
  React.useEffect(() => {
    log.debug('Props:', {
      hasActivities: !!activities,
      activitiesKeys: activities ? Object.keys(activities) : [],
      swimmingCount: activities?.swimming?.length || 0,
      jumpRopeCount: activities?.jumpRope?.length || 0,
      cardioCount: activities?.cardio?.length || 0,
      selectedDate
    });
  }, [activities, selectedDate]);

  if (!activities) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        Aucune activité disponible. Synchronisez vos données Garmin.
      </div>
    );
  }

  const swimming = activities.swimming || [];
  const jumpRope = activities.jumpRope || [];
  const cardio = activities.cardio || [];

  // 🔴 FIX #4: Utiliser normalizeGarminDate centralisé au lieu de recréer la fonction
  // 🟡 FIX #14: Memoization des activités filtrées avec cache de dates normalisées
  const dateCache = React.useRef(new Map());
  
  const getNormalizedDate = React.useCallback((dateStr) => {
    if (!dateStr) return null;
    if (dateCache.current.has(dateStr)) {
      return dateCache.current.get(dateStr);
    }
    const normalized = normalizeGarminDate(dateStr);
    dateCache.current.set(dateStr, normalized);
    return normalized;
  }, []);

  // 🟡 FIX #14: Optimisation du filtrage avec Map pour lookup O(1)
  // Si selectedDate est null ou vide, afficher toutes les activités
  const dateFilteredActivities = React.useMemo(() => {
    const normalizedSelectedDate = getNormalizedDate(selectedDate);
    if (!normalizedSelectedDate || !selectedDate) {
      // Afficher toutes les activités si aucune date sélectionnée
      return { swimming, jumpRope, cardio };
    }
    
    // Filtrer par date si une date est sélectionnée
    return {
      swimming: swimming.filter(act => getNormalizedDate(act.date) === normalizedSelectedDate),
      jumpRope: jumpRope.filter(act => getNormalizedDate(act.date) === normalizedSelectedDate),
      cardio: cardio.filter(act => getNormalizedDate(act.date) === normalizedSelectedDate)
    };
  }, [swimming, jumpRope, cardio, selectedDate, getNormalizedDate]);

  // 🔴 FIX #71-80: Appliquer filtres avancés et recherche
  const { filteredActivities, totalFilteredCount } = useAdvancedFilters(
    dateFilteredActivities,
    searchTerm,
    filters
  );

  const filteredSwimming = filteredActivities.swimming;
  const filteredJumpRope = filteredActivities.jumpRope;
  const filteredCardio = filteredActivities.cardio;

  // 🔴 FIX #71-80: Utiliser les activités filtrées avancées
  // 🟡 FIX #19: Calculer toutes les activités pour pagination
  const allActivities = React.useMemo(() => {
    return [
      ...filteredActivities.swimming.map(act => ({ ...act, type: 'swimming' })),
      ...filteredActivities.jumpRope.map(act => ({ ...act, type: 'jumpRope' })),
      ...filteredActivities.cardio.map(act => ({ ...act, type: 'cardio' }))
    ].sort((a, b) => {
      // Trier par date décroissante (plus récent en premier)
      const dateA = new Date(a.date + 'T' + (a.time || '00:00:00'));
      const dateB = new Date(b.date + 'T' + (b.time || '00:00:00'));
      return dateB - dateA;
    });
  }, [filteredActivities]);

  // 🟡 FIX #19: Pagination - utilise constante
  // 🔴 FIX #71-80: Reset à la page 1 si filtres/recherche changent
  React.useEffect(() => {
    setPage(PAGINATION.INITIAL_PAGE);
  }, [selectedDate, filters, searchTerm]);

  const totalPages = Math.ceil(allActivities.length / PAGINATION.ACTIVITIES_PER_PAGE);
  const startIndex = (page - 1) * PAGINATION.ACTIVITIES_PER_PAGE;
  const endIndex = startIndex + PAGINATION.ACTIVITIES_PER_PAGE;
  const paginatedActivities = allActivities.slice(startIndex, endIndex);

  const hasActivities = allActivities.length > 0;

  return (
    <div className="mt-6">
      {/* 🔴 FIX #71-80: Recherche et filtres avancés */}
      <ActivitySearch 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchResultsCount={totalFilteredCount}
      />
      <AdvancedFilters 
        filters={filters}
        onFiltersChange={setFilters}
        activitiesCount={totalFilteredCount}
      />

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">
          🏃 Activités{selectedDate ? ` - ${selectedDate}` : ''}
        </h3>
        {/* 🟡 FIX #19: Info pagination */}
        {allActivities.length > PAGINATION.ACTIVITIES_PER_PAGE && (
          <div className="text-slate-400 text-sm">
            {startIndex + 1}-{Math.min(endIndex, allActivities.length)} sur {allActivities.length}
          </div>
        )}
      </div>

      {!hasActivities && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
          Aucune activité pour cette période.
        </div>
      )}

      {/* 🟡 FIX #19: Afficher activités paginées */}
      {hasActivities && (
        <div className="space-y-4">
          {paginatedActivities.map((activity) => {
            const ActivityComponent = 
              activity.type === 'swimming' ? SwimmingActivityCard :
              activity.type === 'jumpRope' ? JumpRopeActivityCard :
              CardioActivityCard;
            
            return (
              <ActivityComponent 
                key={activity.id || `${activity.date}_${activity.time}`} 
                activity={activity} 
              />
            );
          })}
        </div>
      )}

      {/* 🟡 FIX #19: Contrôles de pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              page === 1
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-slate-700 text-white hover:bg-slate-600'
            }`}
          >
            ← Précédent
          </button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              page === totalPages
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-slate-700 text-white hover:bg-slate-600'
            }`}
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}

