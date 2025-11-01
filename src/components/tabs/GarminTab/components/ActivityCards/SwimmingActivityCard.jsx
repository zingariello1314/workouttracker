import React from 'react';
import { formatDuration, formatDistance, formatPace, formatSpeed, formatHeartRate } from '../../utils/garminFormatters';

/**
 * Composant pour afficher une activité natation
 */
export default function SwimmingActivityCard({ activity }) {
  const cal = activity.calories || {};
  const swimming = activity.swimmingMetrics || {};
  const time = activity.timeMetrics || {};
  const intensity = activity.intensityMinutes || {};

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-white font-semibold">🏊 Natation - {activity.date} {activity.time}</h4>
          {(activity.startTimeLocal || activity.startTimeGMT) && (
            <div className="text-slate-400 text-xs mt-1">
              {activity.startTimeLocal && <span>Début (local): {activity.startTimeLocal}</span>}
              {activity.startTimeGMT && <span className="ml-2">Début (GMT): {activity.startTimeGMT}</span>}
            </div>
          )}
        </div>
        <div className="text-slate-400 text-xs">ID: {activity.id}</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        {/* Distance et Laps */}
        <div className="bg-slate-900/60 rounded p-2">
          <div className="text-slate-400 text-xs">Distance</div>
          <div className="text-white font-semibold">{formatDistance(activity.distance)}</div>
        </div>
        <div className="bg-slate-900/60 rounded p-2">
          <div className="text-slate-400 text-xs">Longueurs</div>
          <div className="text-white font-semibold">{swimming.laps || activity.laps || 0}</div>
        </div>
        <div className="bg-slate-900/60 rounded p-2">
          <div className="text-slate-400 text-xs">Durée</div>
          <div className="text-white font-semibold">{formatDuration(activity.duration)}</div>
        </div>

        {/* Métriques de nage */}
        {swimming.strokeCount > 0 && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Mouvements</div>
            <div className="text-white font-semibold">{swimming.strokeCount}</div>
          </div>
        )}
        {swimming.avgStrokeRate > 0 && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Fréquence moyenne</div>
            <div className="text-white font-semibold">{swimming.avgStrokeRate.toFixed(1)} /min</div>
          </div>
        )}
        {swimming.avgMovementsPerLap > 0 && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Mouvements/longueur</div>
            <div className="text-white font-semibold">{swimming.avgMovementsPerLap.toFixed(1)}</div>
          </div>
        )}

        {/* SWOLF */}
        {swimming.avgSwolf > 0 && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">SWOLF moyen</div>
            <div className="text-white font-semibold">{swimming.avgSwolf.toFixed(1)}</div>
          </div>
        )}

        {/* CORRECTION : Métriques natation manquantes */}
        {swimming.avgSpeedMovement > 0 && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Vitesse déplacement</div>
            <div className="text-white font-semibold">{formatSpeed(swimming.avgSpeedMovement)}</div>
          </div>
        )}
        {swimming.avgPaceMovement > 0 && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Allure déplacement</div>
            <div className="text-white font-semibold">{formatPace(swimming.avgPaceMovement)} /100m</div>
          </div>
        )}
        {swimming.maxSpeed > 0 && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Vitesse max</div>
            <div className="text-white font-semibold">{formatSpeed(swimming.maxSpeed)}</div>
          </div>
        )}
        {swimming.poolLength && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Longueur piscine</div>
            <div className="text-white font-semibold">{swimming.poolLength}m</div>
          </div>
        )}

        {/* Allures */}
        {swimming.avgPace > 0 && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Allure moyenne</div>
            <div className="text-white font-semibold">{formatPace(swimming.avgPace)} /100m</div>
          </div>
        )}
        {swimming.bestPace > 0 && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Meilleure allure</div>
            <div className="text-white font-semibold">{formatPace(swimming.bestPace)} /100m</div>
          </div>
        )}
        {swimming.avgSpeed > 0 && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Vitesse moyenne</div>
            <div className="text-white font-semibold">{formatSpeed(swimming.avgSpeed)}</div>
          </div>
        )}

        {/* Temps actif */}
        {time.activeTime > 0 && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Temps actif</div>
            <div className="text-white font-semibold">{formatDuration(time.activeTime)}</div>
          </div>
        )}
        {time.totalTime > 0 && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Temps total</div>
            <div className="text-white font-semibold">{formatDuration(time.totalTime)}</div>
          </div>
        )}

        {/* FC */}
        {activity.avgHR > 0 && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">FC moyenne</div>
            <div className="text-white font-semibold">{formatHeartRate(activity.avgHR)}</div>
          </div>
        )}
        {activity.maxHR > 0 && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">FC max</div>
            <div className="text-white font-semibold">{formatHeartRate(activity.maxHR)}</div>
          </div>
        )}
        {activity.minHR > 0 && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">FC min</div>
            <div className="text-white font-semibold">{formatHeartRate(activity.minHR)}</div>
          </div>
        )}

        {/* Calories */}
        {cal.total > 0 && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Calories</div>
            <div className="text-white font-semibold">{cal.total}</div>
            <div className="text-slate-400 text-xs mt-1">
              Actives: {cal.active || 0} • Repos: {cal.resting || 0}
            </div>
          </div>
        )}

        {/* Transpiration */}
        {activity.sweatLoss > 0 && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Transpiration</div>
            <div className="text-white font-semibold">{activity.sweatLoss} ml</div>
          </div>
        )}

        {/* Intensité */}
        {intensity.total > 0 && (
          <div className="bg-slate-900/60 rounded p-2 md:col-span-2">
            <div className="text-slate-400 text-xs">Minutes intensives</div>
            <div className="text-white font-semibold">{intensity.total} min</div>
            <div className="text-slate-400 text-xs mt-1">
              Modérée: {intensity.moderate || 0} • Soutenue: {intensity.vigorous || 0} (x2)
            </div>
          </div>
        )}

        {/* PHASE 3.3 : Training Effect */}
        {activity.trainingEffect && (
          <div className="bg-slate-900/60 rounded p-2 md:col-span-2">
            <div className="text-slate-400 text-xs mb-1">Training Effect</div>
            <div className="flex gap-4">
              {activity.trainingEffect.aerobic !== undefined && (
                <div>
                  <div className="text-blue-300 text-xs">Aérobie</div>
                  <div className="text-white font-semibold">{activity.trainingEffect.aerobic}/5.0</div>
                </div>
              )}
              {activity.trainingEffect.anaerobic !== undefined && (
                <div>
                  <div className="text-purple-300 text-xs">Anaérobie</div>
                  <div className="text-white font-semibold">{activity.trainingEffect.anaerobic}/5.0</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PHASE 3.3 : Recovery Time */}
        {activity.recoveryTime && activity.recoveryTime > 0 && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Temps de récupération</div>
            <div className="text-white font-semibold">
              {activity.recoveryTime >= 24 
                ? `${Math.floor(activity.recoveryTime / 24)}j ${Math.round(activity.recoveryTime % 24)}h`
                : `${activity.recoveryTime}h`}
            </div>
          </div>
        )}

        {/* Localisation */}
        {activity.location && (
          <div className="bg-slate-900/60 rounded p-2 md:col-span-3 text-xs">
            <div className="text-slate-400 mb-1">Localisation</div>
            {activity.location.start && (
              <div className="text-slate-300">
                Départ: {activity.location.start.lat?.toFixed(6)}, {activity.location.start.lng?.toFixed(6)}
              </div>
            )}
            {activity.location.end && (
              <div className="text-slate-300 mt-1">
                Arrivée: {activity.location.end.lat?.toFixed(6)}, {activity.location.end.lng?.toFixed(6)}
              </div>
            )}
          </div>
        )}

        {/* CORRECTION : Détail des longueurs (laps) */}
        {swimming.laps && Array.isArray(swimming.laps) && swimming.laps.length > 0 ? (
          <div className="bg-slate-900/60 rounded p-2 md:col-span-3 text-xs">
            <div className="text-slate-400 mb-2 font-semibold">Détail des longueurs</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {swimming.laps.map((lap, idx) => (
                <div key={idx} className="bg-slate-800/50 px-2 py-1 rounded">
                  <div className="text-slate-500 text-xs">#{lap.lapNumber}</div>
                  {lap.time > 0 && <div className="text-white text-sm">{formatDuration(lap.time)}</div>}
                  {lap.distance > 0 && <div className="text-slate-400 text-xs">{lap.distance}m</div>}
                  {lap.strokeCount > 0 && <div className="text-slate-400 text-xs">{lap.strokeCount} mouvements</div>}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Élévation */}
        {activity.elevation && (
          <div className="bg-slate-900/60 rounded p-2 md:col-span-3 text-xs">
            <div className="text-slate-400 mb-1">Élévation</div>
            <div className="text-slate-300">
              {activity.elevation.gain > 0 && <span>Gain: +{activity.elevation.gain}m </span>}
              {activity.elevation.loss > 0 && <span>Perte: -{activity.elevation.loss}m </span>}
              {activity.elevation.max && <span>Max: {activity.elevation.max}m </span>}
              {activity.elevation.min && <span>Min: {activity.elevation.min}m</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

