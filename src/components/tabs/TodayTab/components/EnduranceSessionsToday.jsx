/**
 * ⚡ COMPOSANT ENDURANCE SESSIONS TODAY
 * 
 * Composant pour afficher les sessions d'endurance du jour.
 * Affiche toutes les sessions d'endurance enregistrées pour la date donnée.
 * 
 * @module EnduranceSessionsToday
 */

import React, { memo, useMemo } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Zap } from 'lucide-react';
import { useWorkout } from '../../../../context/WorkoutContext';
import { getDateStr } from '../../../../utils/dateUtils';

/**
 * Mappe les types d'activité vers leurs noms affichables
 */
const ACTIVITY_NAMES = {
  boxing: 'Boxe',
  pushups: 'Pompes',
  swimming: 'Natation',
  jumprope: 'Corde à sauter',
  running: 'Course'
};

/**
 * Composant pour afficher les sessions d'endurance du jour
 * 
 * @param {Object} props
 * @param {Date} props.date - Date pour laquelle afficher les sessions
 * 
 * @example
 * <EnduranceSessionsToday date={currentDate} />
 */
const EnduranceSessionsToday = memo(({ date }) => {
  const { data } = useWorkout();
  const dateStr = getDateStr(date);

  // Memoizer les sessions du jour (dépend de data.enduranceData et dateStr)
  const todayEnduranceSessions = useMemo(() => {
    const enduranceData = data?.enduranceData || {};
    const sessions = enduranceData.sessions || {};
    const todaySessions = [];
    
    // Collecter toutes les sessions d'endurance du jour
    Object.entries(sessions).forEach(([activityType, activitySessions]) => {
      if (Array.isArray(activitySessions)) {
        activitySessions.forEach(session => {
          if (session.date === dateStr) {
            todaySessions.push({
              ...session,
              activityType,
              activityName: ACTIVITY_NAMES[activityType] || activityType
            });
          }
        });
      }
    });
    
    return todaySessions;
  }, [data?.enduranceData?.sessions, dateStr]);

  // Ne pas afficher si aucune session
  if (todayEnduranceSessions.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20">
      <CardHeader>
        <CardTitle className="flex items-center text-orange-200">
          <Zap className="mr-2" size={20} />
          Sessions d'endurance d'aujourd'hui
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {todayEnduranceSessions.map((session, index) => (
            <div 
              key={`${session.id || index}-${session.activityType}`} 
              className="bg-orange-700/20 rounded-lg p-3 border border-orange-500/30"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-orange-200">{session.activityName}</h4>
                {session.time && (
                  <span className="text-orange-300 text-sm">{session.time}</span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {session.count && (
                  <div className="text-center">
                    <div className="text-orange-200 font-bold">{session.count}</div>
                    <div className="text-orange-300">Répétitions</div>
                  </div>
                )}
                {session.duration && (
                  <div className="text-center">
                    <div className="text-orange-200 font-bold">{session.duration}min</div>
                    <div className="text-orange-300">Durée</div>
                  </div>
                )}
                {session.distance && (
                  <div className="text-center">
                    <div className="text-orange-200 font-bold">{session.distance}m</div>
                    <div className="text-orange-300">Distance</div>
                  </div>
                )}
                {session.jumps && (
                  <div className="text-center">
                    <div className="text-orange-200 font-bold">{session.jumps}</div>
                    <div className="text-orange-300">Sauts</div>
                  </div>
                )}
              </div>
              {session.notes && (
                <div className="mt-2 text-orange-300 text-sm italic">
                  "{session.notes}"
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

EnduranceSessionsToday.displayName = 'EnduranceSessionsToday';

export default EnduranceSessionsToday;

