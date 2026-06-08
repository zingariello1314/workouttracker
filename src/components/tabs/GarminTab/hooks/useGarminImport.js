import { useCallback, useRef } from 'react';
import { useWorkout } from '../../../../context/WorkoutContext';
import logger from '../../../../utils/logger';
import {
  inferRunningSessionTypeFromGarminActivity,
  isGarminRunningLikeActivity,
  isGarminWalkingLikeActivity
} from '../../../../utils/garminRunningLaps';
import { buildEnduranceSessionFromGarminCardio } from '../../../../utils/garminEnduranceSessionBridge';

const log = logger.hook('useGarminImport');

/**
 * 🟡 FIX #21 : Hook pour gérer l'import automatique vers enduranceData.sessions
 * - Vérification robuste des doublons (garminId, id, date+time)
 * - Système de retry automatique en cas d'échec
 * - Logging détaillé pour debugging
 *
 * Défis (endurance) : corde à sauter, pompes, gainage et boxe = **saisie manuelle uniquement**
 * (pas d’import depuis Garmin). Natation + course/marche restent synchronisées Garmin.
 */
export function useGarminImport() {
  const { data: workoutData, updateData } = useWorkout();
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  /**
   * 🟡 FIX #21 : Fonction helper pour générer une clé unique d'une activité
   * Priorité : garminId > id > date+time
   */
  const getActivityKey = useCallback((activity) => {
    if (activity.garminId) return `garmin_${activity.garminId}`;
    if (activity.id) return `id_${activity.id}`;
    return `${activity.date}_${activity.time || '00:00:00'}`;
  }, []);

  /**
   * 🟡 FIX #21 : Vérifier si une activité existe déjà dans les sessions existantes
   */
  const activityExists = useCallback((activity, existingSessions) => {
    const key = getActivityKey(activity);
    
    // Vérifier dans swimming
    const swimming = existingSessions.swimming || [];
    if (swimming.some(s => {
      const sKey = getActivityKey(s);
      return sKey === key || (s.garminId && s.garminId === activity.garminId);
    })) return true;

    // Vérifier dans jumprope
    const jumprope = existingSessions.jumprope || [];
    if (jumprope.some(s => {
      const sKey = getActivityKey(s);
      return sKey === key || (s.garminId && s.garminId === activity.garminId);
    })) return true;

    const running = existingSessions.running || [];
    if (running.some(s => {
      const sKey = getActivityKey(s);
      return sKey === key || (s.garminId && s.garminId === activity.garminId);
    })) return true;

    return false;
  }, [getActivityKey]);

  const importToEndurance = useCallback(async (garminDataForImport, retryAttempt = 0) => {
    if (!garminDataForImport?.activities) {
      log.warn('No activities to import');
      return { success: false, imported: 0, errors: [] };
    }

    try {
      const currentEndurance = workoutData?.enduranceData || {};
      const currentSessions = currentEndurance.sessions || {};
      const newSessions = { ...currentSessions };
      const errors = [];
      let importedCount = 0;

      // 🟡 FIX #21 : Natation - Vérification robuste des doublons
      if (garminDataForImport.activities.swimming && Array.isArray(garminDataForImport.activities.swimming)) {
        const existingSwimming = [...(newSessions.swimming || [])];

        garminDataForImport.activities.swimming.forEach(gAct => {
          try {
            // 🔴 FIX : Validation stricte pour éviter les données mock
            const duration = gAct.duration || 0;
            const distance = gAct.distance || 0;
            const durationMinutes = duration / 60; // Convertir secondes en minutes
            
            // Rejeter les données mock évidentes
            if (durationMinutes >= 1440 || durationMinutes === 3600) {
              log.warn(`Rejeté session swimming mock: durée excessive (${durationMinutes} min)`, gAct);
              errors.push({ type: 'swimming', activity: gAct.id, error: `Durée excessive: ${durationMinutes} min` });
              return;
            }
            
            // Rejeter distance très faible avec durée élevée
            if (distance === 1.5 && durationMinutes > 60) {
              log.warn(`Rejeté session swimming mock: distance 1.5m avec durée ${durationMinutes} min`, gAct);
              errors.push({ type: 'swimming', activity: gAct.id, error: `Distance suspecte: 1.5m avec ${durationMinutes} min` });
              return;
            }
            
            // Vérifier doublons avant import
            if (!activityExists(gAct, { swimming: existingSwimming, jumprope: [], running: newSessions.running || [] })) {
              const session = {
                id: gAct.id || Date.now() + Math.random(),
                garminId: gAct.garminId || gAct.id,
                date: gAct.date,
                time: gAct.time || '',
                duration: durationMinutes, // Stocker en minutes
                distance: distance,
                laps: gAct.laps || 0,
                avgHR: gAct.avgHR || 0,
                maxHR: gAct.maxHR || 0,
                calories: typeof gAct.calories === 'object' ? (gAct.calories?.total || 0) : (gAct.calories || 0),
                avgPace: gAct.avgPace || 0,
                source: 'garmin',
                notes: `Importé depuis Garmin le ${new Date().toLocaleDateString()}`
              };
              existingSwimming.push(session);
              importedCount++;
            }
          } catch (err) {
            errors.push({ type: 'swimming', activity: gAct.id, error: err.message });
            log.error('Error importing swimming activity:', err);
          }
        });
        newSessions.swimming = existingSwimming;
      }

      // Corde à sauter : uniquement saisie manuelle (onglet Défis) — pas d’import Garmin.

      // 🟡 FIX #21 : Cardio (course / marche ; sauts Garmin ne vont plus en jumprope)
      if (garminDataForImport.activities.cardio && Array.isArray(garminDataForImport.activities.cardio)) {
        const existingJumpRope = [...(newSessions.jumprope || [])];
        const existingRunning = [...(newSessions.running || [])];

        garminDataForImport.activities.cardio.forEach(gAct => {
          try {
            // Activités avec compteur de sauts (ex. JumpJump) : ne plus alimenter l’onglet corde — saisie manuelle uniquement.
            if (gAct.jumps && gAct.jumps > 0) {
              return;
            }
            if (isGarminRunningLikeActivity(gAct) || isGarminWalkingLikeActivity(gAct)) {
              const session = buildEnduranceSessionFromGarminCardio(gAct);
              if (!session) return;

              const isWalk = isGarminWalkingLikeActivity(gAct);
              const runType = isWalk ? 'walk' : inferRunningSessionTypeFromGarminActivity(gAct);
              const hasLaps = Array.isArray(gAct?.running?.laps) && gAct.running.laps.length > 0;

              const existingRunningIdx = existingRunning.findIndex((s) => {
                const sKey = getActivityKey(s);
                const aKey = getActivityKey(gAct);
                return (
                  sKey === aKey ||
                  (s.garminId != null &&
                    (gAct.garminId != null || gAct.id != null) &&
                    (s.garminId === gAct.garminId || s.garminId === gAct.id))
                );
              });

              if (existingRunningIdx >= 0) {
                if (existingRunning[existingRunningIdx].type !== runType && (hasLaps || isWalk)) {
                  existingRunning[existingRunningIdx] = {
                    ...existingRunning[existingRunningIdx],
                    type: runType
                  };
                  importedCount++;
                }
              } else if (
                !activityExists(gAct, { swimming: [], jumprope: existingJumpRope, running: existingRunning })
              ) {
                existingRunning.push({
                  ...session,
                  id: gAct.id || Date.now() + Math.random()
                });
                importedCount++;
              }
            }
          } catch (err) {
            errors.push({ type: 'cardio', activity: gAct.id, error: err.message });
            log.error('Error importing cardio activity:', err);
          }
        });
        newSessions.jumprope = existingJumpRope;
        newSessions.running = existingRunning;
      }

      // 🟡 FIX #21 : Mettre à jour enduranceData avec retry en cas d'échec
      try {
        await updateData({
          ...workoutData,
          enduranceData: {
            ...currentEndurance,
            sessions: newSessions,
            lastUpdated: new Date().toISOString()
          }
        });

        log.debug(`Successfully imported ${importedCount} activities`);
        retryCountRef.current = 0; // Reset retry count on success
        return { success: true, imported: importedCount, errors };
      } catch (updateError) {
        log.error('Error updating enduranceData:', updateError);
        
        // 🟡 FIX #21 : Retry automatique avec backoff exponentiel
        if (retryAttempt < MAX_RETRIES) {
          const delay = Math.pow(2, retryAttempt) * 1000; // 1s, 2s, 4s
          log.debug(`Retry attempt ${retryAttempt + 1}/${MAX_RETRIES} in ${delay}ms...`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return importToEndurance(garminDataForImport, retryAttempt + 1);
        }
        
        errors.push({ type: 'update', error: updateError.message });
        return { success: false, imported: importedCount, errors };
      }
    } catch (err) {
      log.error('Fatal error:', err);
      
      // 🟡 FIX #21 : Retry automatique pour erreurs fatales
      if (retryAttempt < MAX_RETRIES) {
        const delay = Math.pow(2, retryAttempt) * 1000;
        log.debug(`Fatal error retry attempt ${retryAttempt + 1}/${MAX_RETRIES} in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return importToEndurance(garminDataForImport, retryAttempt + 1);
      }
      
      return { 
        success: false, 
        imported: 0, 
        errors: [{ type: 'fatal', error: err.message }] 
      };
    }
  }, [workoutData, updateData, activityExists, getActivityKey]);

  return { importToEndurance };
}
