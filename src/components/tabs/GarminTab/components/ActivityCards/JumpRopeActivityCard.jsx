import React from 'react';
import { formatDuration, formatDistance, formatSpeed, formatHeartRate } from '../../utils/garminFormatters';

/**
 * Composant pour afficher une activité corde à sauter
 */
export default function JumpRopeActivityCard({ activity }) {
  const cal = activity.calories || {};
  const jumpRope = activity.jumpRopeMetrics || {};
  const connectIQ = activity.connectIQ || {};
  const intensity = activity.intensityMinutes || {};

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-white font-semibold">🪢 Corde à sauter - {activity.date} {activity.time}</h4>
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
        {/* Sauts */}
        {(jumpRope.jumps > 0 || activity.jumps > 0) && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Sauts</div>
            <div className="text-white font-semibold text-lg">{jumpRope.jumps || activity.jumps || 0}</div>
          </div>
        )}

        {/* Durée */}
        <div className="bg-slate-900/60 rounded p-2">
          <div className="text-slate-400 text-xs">Durée</div>
          <div className="text-white font-semibold">{formatDuration(activity.duration)}</div>
        </div>

        {/* Vitesse */}
        {jumpRope.speed > 0 && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Vitesse</div>
            <div className="text-white font-semibold">{jumpRope.speed.toFixed(1)} sauts/min</div>
          </div>
        )}

        {/* Connect IQ - Durée */}
        {connectIQ.duration && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Durée (Connect IQ)</div>
            <div className="text-white font-semibold">{connectIQ.duration}</div>
          </div>
        )}

        {/* Interruptions */}
        {jumpRope.interruptions !== undefined && jumpRope.interruptions !== null && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Interruptions</div>
            <div className="text-white font-semibold">{jumpRope.interruptions}</div>
          </div>
        )}

        {/* Série continue max */}
        {jumpRope.maxContinuousJumps > 0 && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Série continue max</div>
            <div className="text-white font-semibold">{jumpRope.maxContinuousJumps}</div>
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

        {/* Distance (si disponible) */}
        {activity.distance > 0 && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Distance</div>
            <div className="text-white font-semibold">{formatDistance(activity.distance)}</div>
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
      </div>
    </div>
  );
}

