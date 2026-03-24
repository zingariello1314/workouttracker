import React, { useMemo, useState } from 'react';
import {
  formatDuration,
  formatDistance,
  formatSpeed,
  formatHeartRate,
  formatPacePerKm
} from '../../utils/garminFormatters';

/**
 * Libellé affiché : l’app regroupe course/tapis/corps dans le même bucket « cardio » côté données,
 * mais une séance enregistrée « course à pied » sur la montre doit s’afficher comme telle quand on le détecte.
 */
function getCardioDisplayLabel(activity) {
  const run = activity?.running;
  if (
    run &&
    (run.laps?.length > 0 ||
      run.averagePaceSecondsPerKm > 0 ||
      run.bestPaceSecondsPerKm > 0 ||
      run.averageCadenceSpm > 0 ||
      (run.distanceMeters > 0 && (run.averagePaceSecondsPerKm > 0 || run.averageCadenceSpm > 0)))
  ) {
    return { title: 'Course à pied', emoji: '🏃' };
  }
  const tk = (activity.activityType || '').toLowerCase();
  if (
    /running|treadmill|trail|jog|virtual_run|track_run|street_run|indoor_run|ultra/.test(tk) ||
    tk === 'run'
  ) {
    return { title: 'Course à pied', emoji: '🏃' };
  }
  const name = (activity.activityName || '').toLowerCase();
  if (
    /\bcourse\b|footing|interval|fractionn|fartlek|tempo|vma|tapis|jogging|5k|10k|semi|marathon|\brun\b/.test(
      name
    )
  ) {
    return { title: 'Course à pied', emoji: '🏃' };
  }
  return { title: 'Cardio', emoji: '❤️' };
}

/** Libellé court pour effort / repos / type Garmin sur un tour */
function formatLapIntervalLabel(lap) {
  const phase = lap.intervalPhase;
  const key = lap.intervalTypeKey;
  if (phase && key) return `${phase} · ${key}`;
  if (phase) return String(phase);
  if (key) return String(key);
  return '—';
}

/** Distance d’un tour en mètres */
function lapMeters(lap) {
  if (lap.distanceMeters != null && lap.distanceMeters > 0) return Number(lap.distanceMeters);
  if (lap.distanceKm != null && lap.distanceKm > 0) return lap.distanceKm * 1000;
  return 0;
}

/** Effort / repos / inconnu (libellés Garmin souvent ACTIVE / REST) */
function lapKind(lap) {
  const phase = String(lap.intervalPhase || '').toUpperCase();
  const key = String(lap.intervalTypeKey || '').toUpperCase();
  const blob = `${phase} ${key}`;
  if (
    blob.includes('REST') ||
    blob.includes('RECOVERY') ||
    blob.includes('COOLDOWN') ||
    blob.includes('WALK') ||
    key === 'REST'
  ) {
    return 'rest';
  }
  if (phase.includes('ACTIVE') || key.includes('ACTIVE')) return 'active';
  return 'other';
}

/** Vrai fractionné (effort / repos structuré), pas une sortie continue découpée en tours auto */
function isIntervalStructuredSession(laps) {
  if (!laps || laps.length === 0) return false;
  const hasRest = laps.some((l) => lapKind(l) === 'rest');
  if (hasRest) return true;
  if (laps.length < 4) return false;
  const joined = laps
    .map((l) => `${l.intervalPhase || ''} ${l.intervalTypeKey || ''}`.toUpperCase())
    .join(' ');
  if (
    /\b(WORK|INTERVAL)\b/.test(joined) &&
    /\b(RECOVER|COOLDOWN|REST)\b/.test(joined)
  ) {
    return true;
  }
  return false;
}

/** Allure dérivée distance ÷ temps (prioritaire si pas de avgPaceSecondsPerKm Garmin) */
function lapPaceDerived(lap) {
  const m = lapMeters(lap);
  const dur = lap.durationSeconds;
  if (!m || m <= 0 || !dur || dur <= 0) return null;
  const km = m / 1000;
  const secondsPerKm = dur / km;
  const kmh = (km / dur) * 3600;
  return { secondsPerKm, kmh };
}

function lapEffectivePace(lap) {
  const derived = lapPaceDerived(lap);
  if (derived) return derived;
  if (lap.avgPaceSecondsPerKm != null && lap.avgPaceSecondsPerKm > 0) {
    return {
      secondsPerKm: lap.avgPaceSecondsPerKm,
      kmh: 3600 / lap.avgPaceSecondsPerKm
    };
  }
  return null;
}

/** Totaux distance / durée / allure pondérée (Σkm / Σtemps) pour une liste de tours */
function aggregateLapStats(lapList) {
  let meters = 0;
  let seconds = 0;
  let hrSum = 0;
  let hrN = 0;
  for (const lap of lapList) {
    meters += lapMeters(lap);
    const ds = lap.durationSeconds;
    if (ds != null && ds > 0) seconds += ds;
    if (lap.avgHR != null && lap.avgHR > 0) {
      hrSum += lap.avgHR;
      hrN += 1;
    }
  }
  const km = meters / 1000;
  const paceSecPerKm = km > 0 && seconds > 0 ? seconds / km : null;
  const kmh = km > 0 && seconds > 0 ? (km / seconds) * 3600 : null;
  return {
    totalKm: km,
    totalSeconds: seconds,
    paceSecPerKm,
    kmh,
    avgHR: hrN > 0 ? Math.round(hrSum / hrN) : null
  };
}

/**
 * Composant pour afficher une activité cardio (et courses détectées comme telles)
 */
export default function CardioActivityCard({ activity }) {
  const cal = activity.calories || {};
  const intensity = activity.intensityMinutes || {};
  const run = activity.running || null;
  const laps = Array.isArray(run?.laps) ? run.laps : [];
  const { title: kindTitle, emoji: kindEmoji } = getCardioDisplayLabel(activity);

  const [segmentFilter, setSegmentFilter] = useState('all');

  const lapBreakdown = useMemo(() => {
    let activeKm = 0;
    let restKm = 0;
    let otherKm = 0;
    for (const lap of laps) {
      const km = lapMeters(lap) / 1000;
      const k = lapKind(lap);
      if (k === 'active') activeKm += km;
      else if (k === 'rest') restKm += km;
      else otherKm += km;
    }
    return { activeKm, restKm, otherKm };
  }, [laps]);

  const hasRestSegment = useMemo(() => laps.some((l) => lapKind(l) === 'rest'), [laps]);
  const intervalMode = useMemo(() => isIntervalStructuredSession(laps), [laps]);
  /** Filtres effort/repos : seulement si fractionné réel avec au moins un segment repos */
  const showEffortRestFilters = intervalMode && hasRestSegment;

  const filteredLaps = useMemo(() => {
    if (!showEffortRestFilters) return laps;
    if (segmentFilter === 'all') return laps;
    if (segmentFilter === 'active') return laps.filter((l) => lapKind(l) === 'active');
    return laps.filter((l) => lapKind(l) === 'rest');
  }, [laps, segmentFilter, showEffortRestFilters]);

  const tableStats = useMemo(() => aggregateLapStats(filteredLaps), [filteredLaps]);

  const filterLabel =
    segmentFilter === 'all'
      ? intervalMode
        ? 'Tous les segments'
        : 'Tous les tours'
      : segmentFilter === 'active'
        ? intervalMode
          ? 'Effort uniquement'
          : 'Tours effort'
        : 'Repos uniquement';

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-white font-semibold">
            {kindEmoji} {kindTitle} — {activity.date} {activity.time}
          </h4>
          {(activity.startTimeLocal || activity.startTimeGMT) && (
            <div className="text-slate-400 text-xs mt-1">
              {activity.startTimeLocal && <span>Début (local): {activity.startTimeLocal}</span>}
              {activity.startTimeGMT && <span className="ml-2">Début (GMT): {activity.startTimeGMT}</span>}
            </div>
          )}
          {(activity.activityType || activity.garminTypeKey) && (
            <div className="text-slate-400 text-xs mt-1 space-y-0.5">
              {activity.activityType && (
                <div>
                  Type (affiché) :{' '}
                  <span className="text-slate-300">{activity.activityType}</span>
                </div>
              )}
              {activity.garminTypeKey &&
                activity.garminTypeKey !== activity.activityType && (
                  <div className="text-slate-500">
                    Clé Garmin Connect : {activity.garminTypeKey}
                    <span className="block text-[10px] mt-0.5 opacity-90">
                      (libellé API — peut différer du profil enregistré sur la montre)
                    </span>
                  </div>
                )}
            </div>
          )}
        </div>
        <div className="text-slate-400 text-xs">ID: {activity.id}</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        {/* Durée */}
        <div className="bg-slate-900/60 rounded p-2">
          <div className="text-slate-400 text-xs">Durée</div>
          <div className="text-white font-semibold">{formatDuration(activity.duration)}</div>
        </div>

        {/* Distance (si disponible) */}
        {(activity.distance > 0 || run?.distanceMeters > 0) && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Distance</div>
            <div className="text-white font-semibold">
              {activity.distance > 0
                ? formatDistance(activity.distance)
                : formatDistance((run.distanceMeters || 0) / 1000)}
            </div>
            {laps.length > 0 && (lapBreakdown.activeKm > 0 || lapBreakdown.restKm > 0 || lapBreakdown.otherKm > 0) && (
              <div className="text-slate-400 text-[11px] mt-1.5 space-y-0.5 border-t border-slate-700/80 pt-1.5">
                {lapBreakdown.activeKm > 0 && (
                  <div>
                    {intervalMode ? 'Effort (fractionné) : ' : 'En course (tours) : '}
                    <span className="text-slate-300">{lapBreakdown.activeKm.toFixed(2)} km</span>
                  </div>
                )}
                {lapBreakdown.restKm > 0 && (
                  <div>
                    {intervalMode ? 'Repos (fractionné) : ' : 'Au pas / léger (tours) : '}
                    <span className="text-slate-300">{lapBreakdown.restKm.toFixed(2)} km</span>
                  </div>
                )}
                {lapBreakdown.otherKm > 0 && (
                  <div>
                    Autre (tours) : <span className="text-slate-300">{lapBreakdown.otherKm.toFixed(2)} km</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Allure moyenne (course) */}
        {(activity.avgPaceSecondsPerKm > 0 || run?.averagePaceSecondsPerKm > 0) && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Allure moyenne</div>
            <div className="text-white font-semibold">
              {formatPacePerKm(activity.avgPaceSecondsPerKm || run?.averagePaceSecondsPerKm)}
            </div>
          </div>
        )}

        {run?.bestPaceSecondsPerKm > 0 && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Meilleure allure</div>
            <div className="text-white font-semibold">{formatPacePerKm(run.bestPaceSecondsPerKm)}</div>
          </div>
        )}

        {/* Vitesse (si disponible) */}
        {activity.speed > 0 && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Vitesse moyenne</div>
            <div className="text-white font-semibold">{formatSpeed(activity.speed)}</div>
          </div>
        )}

        {activity.maxSpeed > 0 && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Vitesse max</div>
            <div className="text-white font-semibold">{formatSpeed(activity.maxSpeed)}</div>
          </div>
        )}

        {(run?.averageCadenceSpm > 0 || run?.maxCadenceSpm > 0) && (
          <div className="bg-slate-900/60 rounded p-2 md:col-span-2">
            <div className="text-slate-400 text-xs">Cadence</div>
            <div className="text-white font-semibold">
              moy. {run.averageCadenceSpm ? `${run.averageCadenceSpm} ppm` : '—'}
              {run.maxCadenceSpm ? ` • max ${run.maxCadenceSpm} ppm` : ''}
            </div>
            <div className="text-slate-500 text-[10px] mt-0.5">ppm = pas par minute</div>
          </div>
        )}

        {run?.averageStrideLengthMeters > 0 && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Longueur de foulée (moy.)</div>
            <div className="text-white font-semibold">{run.averageStrideLengthMeters} m</div>
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

        {/* Sauts (pour activités JumpJump Pro) */}
        {(activity.jumps > 0 || activity.jumpRopeMetrics?.jumps > 0) && (
          <div className="bg-slate-900/60 rounded p-2">
            <div className="text-slate-400 text-xs">Sauts</div>
            <div className="text-white font-semibold text-lg">{activity.jumps || activity.jumpRopeMetrics?.jumps || 0}</div>
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

      {/* Tours (sortie classique) ou fractionné — détail Garmin */}
      {laps.length > 0 && (
        <div className="mt-4 border-t border-slate-700 pt-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <div className="text-slate-300 text-sm font-semibold">
              {intervalMode ? 'Fractionné — tours & segments' : 'Tours & segments'} ({laps.length})
            </div>
            {showEffortRestFilters ? (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500">Affichage :</span>
                {[
                  { id: 'all', label: 'Tous' },
                  { id: 'active', label: 'Effort' },
                  { id: 'rest', label: 'Repos' }
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSegmentFilter(id)}
                    className={`rounded px-2 py-1 border transition-colors ${
                      segmentFilter === id
                        ? 'bg-slate-600 border-slate-500 text-white'
                        : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-[11px] max-w-md">
                Sortie continue ou tours auto (pas de phase repos) — pas de filtre effort/repos.
              </p>
            )}
          </div>

          <div className="overflow-x-auto rounded border border-slate-700/80">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/80 text-slate-400">
                <tr>
                  <th className="p-2 font-medium">#</th>
                  <th className="p-2 font-medium">{intervalMode ? 'Phase' : 'Segment'}</th>
                  <th className="p-2 font-medium">Distance</th>
                  <th className="p-2 font-medium">Durée</th>
                  <th className="p-2 font-medium min-w-[7.5rem]">Allure</th>
                  <th className="p-2 font-medium">Cadence</th>
                  <th className="p-2 font-medium">Foulée</th>
                  <th className="p-2 font-medium">FC moy.</th>
                  <th className="p-2 font-medium">D+</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                {filteredLaps.map((lap) => {
                  const pace = lapEffectivePace(lap);
                  return (
                    <tr key={lap.index} className="border-t border-slate-800/90">
                      <td className="p-2">{lap.index}</td>
                      <td className="p-2 max-w-[10rem] whitespace-normal break-words text-slate-300">
                        {formatLapIntervalLabel(lap)}
                      </td>
                      <td className="p-2">
                        {lap.distanceKm != null && lap.distanceKm > 0
                          ? formatDistance(lap.distanceKm)
                          : lap.distanceMeters != null && lap.distanceMeters > 0
                            ? `${Math.round(lap.distanceMeters)} m`
                            : '—'}
                      </td>
                      <td className="p-2">
                        {lap.durationSeconds != null && lap.durationSeconds > 0
                          ? formatDuration(lap.durationSeconds)
                          : '—'}
                      </td>
                      <td className="p-2 align-top">
                        {pace ? (
                          <div className="leading-snug">
                            <div>{formatSpeed(pace.kmh)}</div>
                            <div className="text-slate-400">{formatPacePerKm(pace.secondsPerKm)}</div>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-2">
                        {lap.averageCadenceSpm != null && lap.averageCadenceSpm > 0
                          ? `${lap.averageCadenceSpm} ppm`
                          : '—'}
                      </td>
                      <td className="p-2">
                        {lap.averageStrideLengthMeters != null && lap.averageStrideLengthMeters > 0
                          ? `${lap.averageStrideLengthMeters} m`
                          : '—'}
                      </td>
                      <td className="p-2">
                        {lap.avgHR != null && lap.avgHR > 0 ? formatHeartRate(lap.avgHR) : '—'}
                      </td>
                      <td className="p-2">
                        {lap.elevationGain != null && lap.elevationGain > 0 ? `${lap.elevationGain} m` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {filteredLaps.length > 0 && (
                <tfoot className="bg-slate-900/90 text-slate-300 border-t border-slate-600">
                  <tr>
                    <td colSpan={3} className="p-2 text-slate-400">
                      Synthèse ({filterLabel})
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {tableStats.totalSeconds > 0 ? formatDuration(tableStats.totalSeconds) : '—'}
                    </td>
                    <td className="p-2 align-top">
                      {tableStats.kmh != null && tableStats.paceSecPerKm != null ? (
                        <div className="leading-snug">
                          <div>{formatSpeed(tableStats.kmh)}</div>
                          <div className="text-slate-400">{formatPacePerKm(tableStats.paceSecPerKm)}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">moy. pondérée (Σkm / Σt)</div>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td colSpan={4} className="p-2 text-right text-[11px]">
                      <div>
                        Distance affichée :{' '}
                        <span className="text-white font-semibold">
                          {tableStats.totalKm > 0 ? `${tableStats.totalKm.toFixed(2)} km` : '—'}
                        </span>
                      </div>
                      {tableStats.avgHR != null && (
                        <div className="mt-0.5 text-slate-400">
                          FC moy. (segments) : {tableStats.avgHR} bpm
                        </div>
                      )}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          {filteredLaps.length === 0 && (
            <p className="text-slate-500 text-xs mt-2">Aucun segment pour ce filtre.</p>
          )}
        </div>
      )}
    </div>
  );
}

