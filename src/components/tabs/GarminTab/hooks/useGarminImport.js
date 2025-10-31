import { useCallback } from 'react';
import { useWorkout } from '../../../../context/WorkoutContext';

/**
 * Hook pour gérer l'import automatique vers enduranceData.sessions
 */
export function useGarminImport() {
  const { data: workoutData, updateData } = useWorkout();

  const importToEndurance = useCallback(async (garminDataForImport) => {
    if (!garminDataForImport?.activities) return;

    const currentEndurance = workoutData?.enduranceData || {};
    const currentSessions = currentEndurance.sessions || {};
    const newSessions = { ...currentSessions };

    // Natation
    if (garminDataForImport.activities.swimming && Array.isArray(garminDataForImport.activities.swimming)) {
      const existingSwimming = newSessions.swimming || [];
      const existingIds = new Set(existingSwimming.map(s => s.id || `${s.date}_${s.time}`).filter(Boolean));

      garminDataForImport.activities.swimming.forEach(gAct => {
        const key = gAct.id || `${gAct.date}_${gAct.time}`;
        if (!existingIds.has(key) && gAct.source === 'garmin') {
          const session = {
            id: gAct.id || Date.now() + Math.random(),
            date: gAct.date,
            time: gAct.time || '',
            duration: gAct.duration || 0,
            distance: gAct.distance || 0,
            laps: gAct.laps || 0,
            avgHR: gAct.avgHR || 0,
            maxHR: gAct.maxHR || 0,
            calories: gAct.calories || 0,
            avgPace: gAct.avgPace || 0,
            source: 'garmin',
            notes: `Importé depuis Garmin`
          };
          existingSwimming.push(session);
        }
      });
      newSessions.swimming = existingSwimming;
    }

    // Corde à sauter
    if (garminDataForImport.activities.jumpRope && Array.isArray(garminDataForImport.activities.jumpRope)) {
      const existingJumpRope = newSessions.jumprope || [];
      const existingIds = new Set(existingJumpRope.map(s => s.id || `${s.date}_${s.time}`).filter(Boolean));

      garminDataForImport.activities.jumpRope.forEach(gAct => {
        const key = gAct.id || `${gAct.date}_${gAct.time}`;
        if (!existingIds.has(key) && gAct.source === 'garmin') {
          const session = {
            id: gAct.id || Date.now() + Math.random(),
            date: gAct.date,
            time: gAct.time || '',
            duration: gAct.duration || 0,
            jumps: gAct.jumps || 0,
            avgHR: gAct.avgHR || 0,
            maxHR: gAct.maxHR || 0,
            calories: gAct.calories || 0,
            source: 'garmin',
            notes: `Importé depuis Garmin`
          };
          existingJumpRope.push(session);
        }
      });
      newSessions.jumprope = existingJumpRope;
    }

    // Cardio (peut contenir JumpJump Pro ou autres activités)
    if (garminDataForImport.activities.cardio && Array.isArray(garminDataForImport.activities.cardio)) {
      const existingJumpRope = newSessions.jumprope || [];
      const existingIds = new Set(existingJumpRope.map(s => s.id || `${s.date}_${s.time}`).filter(Boolean));

      garminDataForImport.activities.cardio.forEach(gAct => {
        const key = gAct.id || `${gAct.date}_${gAct.time}`;
        if (!existingIds.has(key) && gAct.source === 'garmin') {
          // Si c'est une activité avec sauts (JumpJump Pro), importer comme jumprope
          if (gAct.jumps && gAct.jumps > 0) {
            const session = {
              id: gAct.id || Date.now() + Math.random(),
              date: gAct.date,
              time: gAct.time || '',
              duration: gAct.duration || 0,
              jumps: gAct.jumps || 0,
              avgHR: gAct.avgHR || 0,
              maxHR: gAct.maxHR || 0,
              calories: gAct.calories?.total || gAct.calories || 0,
              connectIQ: gAct.connectIQ || null,
              source: 'garmin',
              notes: `Importé depuis Garmin (Cardio/JumpJump Pro)`
            };
            existingJumpRope.push(session);
          }
          // Pour autres activités cardio, on pourrait les ajouter dans un type 'cardio' si nécessaire
        }
      });
      newSessions.jumprope = existingJumpRope;
    }

    // Mettre à jour enduranceData
    await updateData({
      ...workoutData,
      enduranceData: {
        ...currentEndurance,
        sessions: newSessions,
        lastUpdated: new Date().toISOString()
      }
    });
  }, [workoutData, updateData]);

  return { importToEndurance };
}

