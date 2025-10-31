import React from 'react';
import SwimmingActivityCard from './ActivityCards/SwimmingActivityCard';
import JumpRopeActivityCard from './ActivityCards/JumpRopeActivityCard';
import CardioActivityCard from './ActivityCards/CardioActivityCard';

/**
 * Composant pour afficher toutes les activités Garmin
 */
export default function GarminActivities({ activities, selectedDate }) {
  // Debug log
  React.useEffect(() => {
    console.log('[GarminActivities] Props:', {
      hasActivities: !!activities,
      activitiesKeys: activities ? Object.keys(activities) : [],
      swimmingCount: activities?.swimming?.length || 0,
      jumpRopeCount: activities?.jumpRope?.length || 0,
      cardioCount: activities?.cardio?.length || 0,
      selectedDate
    });
    if (activities?.swimming?.length > 0) {
      console.log('[GarminActivities] Sample swimming activity:', activities.swimming[0]);
    }
    if (activities?.jumpRope?.length > 0) {
      console.log('[GarminActivities] Sample jumpRope activity:', activities.jumpRope[0]);
    }
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

  // Filtrer par date sélectionnée si nécessaire
  // Normaliser les dates pour la comparaison (YYYY-MM-DD)
  const normalizeDate = (dateStr) => {
    if (!dateStr) return null;
    // Si la date est déjà en YYYY-MM-DD, la retourner telle quelle
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // Sinon essayer de la parser
    try {
      const d = new Date(dateStr);
      return d.toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  };

  const normalizedSelectedDate = normalizeDate(selectedDate);

  const filteredSwimming = normalizedSelectedDate
    ? swimming.filter(act => normalizeDate(act.date) === normalizedSelectedDate)
    : swimming;
  const filteredJumpRope = normalizedSelectedDate
    ? jumpRope.filter(act => normalizeDate(act.date) === normalizedSelectedDate)
    : jumpRope;
  const filteredCardio = normalizedSelectedDate
    ? cardio.filter(act => normalizeDate(act.date) === normalizedSelectedDate)
    : cardio;

  const hasActivities = filteredSwimming.length > 0 || filteredJumpRope.length > 0 || filteredCardio.length > 0;

  return (
    <div className="mt-6">
      <h3 className="text-white font-semibold mb-4">
        🏃 Activités{selectedDate ? ` - ${selectedDate}` : ''}
      </h3>

      {!hasActivities && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
          Aucune activité pour cette période.
        </div>
      )}

      {/* Natation */}
      {filteredSwimming.length > 0 && (
        <div className="mb-6">
          <h4 className="text-slate-300 font-medium mb-3">🏊 Natation ({filteredSwimming.length})</h4>
          <div className="space-y-4">
            {filteredSwimming.map((activity) => (
              <SwimmingActivityCard key={activity.id || `${activity.date}_${activity.time}`} activity={activity} />
            ))}
          </div>
        </div>
      )}

      {/* Corde à sauter */}
      {filteredJumpRope.length > 0 && (
        <div className="mb-6">
          <h4 className="text-slate-300 font-medium mb-3">🪢 Corde à sauter ({filteredJumpRope.length})</h4>
          <div className="space-y-4">
            {filteredJumpRope.map((activity) => (
              <JumpRopeActivityCard key={activity.id || `${activity.date}_${activity.time}`} activity={activity} />
            ))}
          </div>
        </div>
      )}

      {/* Cardio */}
      {filteredCardio.length > 0 && (
        <div className="mb-6">
          <h4 className="text-slate-300 font-medium mb-3">❤️ Cardio ({filteredCardio.length})</h4>
          <div className="space-y-4">
            {filteredCardio.map((activity) => (
              <CardioActivityCard key={activity.id || `${activity.date}_${activity.time}`} activity={activity} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

