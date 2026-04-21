import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  Loader2,
  ExternalLink,
  Navigation2,
  Clock,
  Gauge,
  Heart,
  Flame,
  Mountain,
  Footprints,
  MapPin,
  Watch,
  Activity,
  Layers,
  Filter
} from 'lucide-react';
import { useGarminData } from '../../../../hooks/useGarminData';
import { useTranslation } from '../../../../utils/translations';
import { classifyLapPhase } from '../../../../utils/garminRunningLaps';
import { inferDisplayTypeFromGarminActivity, runningSessionTypeLabel } from '../../../../utils/runningSessionTypeLabel';
import { isWalkingLikeRunningSession } from '../../../../utils/runningSessionMovementKind';

function findCardioBySession(activities, session) {
  const cardio = activities?.cardio || [];
  const gid = session?.garminId ?? session?.id;
  if (gid == null) return null;
  return (
    cardio.find(
      (a) =>
        a.garminId === gid ||
        a.id === gid ||
        String(a.garminId) === String(gid) ||
        String(a.id) === String(gid)
    ) || null
  );
}

function formatSec(s) {
  if (s == null || Number.isNaN(Number(s))) return '—';
  const n = Math.round(Number(s));
  const m = Math.floor(n / 60);
  const sec = n % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function osmLink(lat, lng) {
  if (lat == null || lng == null) return null;
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
}

function phaseLabel(phase) {
  switch (phase) {
    case 'effort':
      return 'Effort';
    case 'recovery':
      return 'Récupération';
    case 'warmup':
      return 'Échauffement';
    case 'cooldown':
      return 'Retour au calme';
    default:
      return 'Autre';
  }
}

function phaseStyles(phase) {
  switch (phase) {
    case 'effort':
      return 'border-l-teal-400 bg-teal-950/30';
    case 'recovery':
      return 'border-l-amber-500 bg-amber-950/25';
    case 'warmup':
      return 'border-l-teal-600 bg-teal-950/20';
    case 'cooldown':
      return 'border-l-teal-700 bg-black/80';
    default:
      return 'border-l-teal-800 bg-black/60';
  }
}

function badgeStyles(phase) {
  switch (phase) {
    case 'effort':
      return 'bg-teal-500/20 text-teal-100 border-teal-400/45';
    case 'recovery':
      return 'bg-amber-500/20 text-amber-200 border-amber-500/30';
    case 'warmup':
      return 'bg-teal-600/20 text-teal-100 border-teal-500/35';
    case 'cooldown':
      return 'bg-teal-800/25 text-teal-100 border-teal-600/40';
    default:
      return 'bg-black text-teal-200/80 border-teal-700/40';
  }
}

function formatDeviceShort(deviceInfo) {
  if (!deviceInfo || typeof deviceInfo !== 'object') return null;
  const id = deviceInfo.deviceId != null ? String(deviceInfo.deviceId) : '';
  const tail = id ? `…${id.slice(-4)}` : '';
  return tail ? `Garmin ${tail}` : 'Montre Garmin';
}

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-teal-500/40 bg-black p-5 shadow-lg shadow-black/30">
      <div className="mb-2 flex items-center gap-2 text-teal-200/75">
        <Icon className="h-4 w-4 shrink-0 text-teal-300" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold tracking-tight text-white tabular-nums">{value}</div>
      {hint && <p className="mt-1.5 text-xs text-teal-300/55">{hint}</p>}
    </div>
  );
}

const LAP_FILTER = {
  ALL: 'all',
  EFFORT: 'effort',
  RECOVERY: 'recovery'
};

/**
 * Page pleine colonne : détail séance course (remplace le contenu principal Défis).
 */
export default function RunningSessionDetailPage({ session, onBack }) {
  const t = useTranslation();
  const { loadAllData, dbReady } = useGarminData();
  const [loading, setLoading] = useState(false);
  const [garminFull, setGarminFull] = useState(null);
  const [lapFilter, setLapFilter] = useState(LAP_FILTER.ALL);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack]);

  useEffect(() => {
    if (!session) return;
    const isGarmin = session.source === 'garmin' || session.garminId != null;
    if (!isGarmin || !dbReady) {
      setGarminFull(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const loaded = await loadAllData();
        if (cancelled) return;
        setGarminFull(findCardioBySession(loaded?.activities, session));
      } catch {
        if (!cancelled) setGarminFull(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session, dbReady, loadAllData]);

  const laps = garminFull?.running?.laps;

  const lapsWithPhase = useMemo(() => {
    if (!Array.isArray(laps)) return [];
    return laps.map((lap, i) => ({
      lap,
      phase: classifyLapPhase(lap),
      key: lap.index ?? lap.startTime ?? i
    }));
  }, [laps]);

  const lapStats = useMemo(() => {
    let effort = 0;
    let recovery = 0;
    lapsWithPhase.forEach(({ phase }) => {
      if (phase === 'recovery' || phase === 'cooldown') recovery += 1;
      else effort += 1;
    });
    return { effort, recovery, total: lapsWithPhase.length };
  }, [lapsWithPhase]);

  const isIntervalLike = lapStats.recovery > 0 && lapStats.effort > 0;
  /** Beaucoup de tours sans récup/repos = découpe auto (street / cardio indoor), pas un fractionné. */
  const continuousGarminAutoLaps = useMemo(() => {
    if (!lapsWithPhase.length || isIntervalLike) return false;
    if (lapsWithPhase.length < 6) return false;
    return lapsWithPhase.every(
      ({ phase }) => phase !== 'recovery' && phase !== 'cooldown'
    );
  }, [lapsWithPhase, isIntervalLike]);

  const [showGarminLapsTable, setShowGarminLapsTable] = useState(false);
  useEffect(() => {
    setShowGarminLapsTable(false);
  }, [session?.id, session?.garminId]);

  const effectiveSessionType = useMemo(() => {
    if (isWalkingLikeRunningSession(session, garminFull)) return 'walking';
    return inferDisplayTypeFromGarminActivity(session, garminFull, isIntervalLike);
  }, [session, garminFull, isIntervalLike]);
  const showIntervalBadge = effectiveSessionType === 'interval';

  const filteredLaps = useMemo(() => {
    if (lapFilter === LAP_FILTER.ALL) return lapsWithPhase;
    if (lapFilter === LAP_FILTER.EFFORT) {
      return lapsWithPhase.filter(({ phase }) => phase === 'effort' || phase === 'warmup' || phase === 'other');
    }
    if (lapFilter === LAP_FILTER.RECOVERY) {
      return lapsWithPhase.filter(({ phase }) => phase === 'recovery' || phase === 'cooldown');
    }
    return lapsWithPhase;
  }, [lapsWithPhase, lapFilter]);

  const title = useMemo(() => {
    if (garminFull?.activityName) return garminFull.activityName;
    if (session?.notes && String(session.notes).startsWith('Garmin — ')) {
      return String(session.notes).replace(/^Garmin — /, '').trim();
    }
    return 'Course';
  }, [garminFull, session]);

  const subtitleDate = [session?.date, session?.time].filter(Boolean).join(' · ');

  const rawJson = useMemo(() => {
    if (!garminFull) return '';
    try {
      return JSON.stringify(garminFull, null, 2);
    } catch {
      return '';
    }
  }, [garminFull]);

  const setFilter = useCallback((f) => () => setLapFilter(f), []);

  if (!session) return null;

  return (
    <div className="min-h-full bg-black">
      {/* Barre retour */}
      <div className="sticky top-0 z-20 border-b border-teal-800/40 bg-black/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl border border-teal-500/45 bg-black px-3 py-2 text-sm font-medium text-teal-100 transition hover:bg-teal-950/50 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l&apos;historique
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6">
        {/* En-tête hero */}
        <header className="relative overflow-hidden rounded-3xl border border-teal-500/45 bg-black p-8 shadow-2xl shadow-teal-950/30">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/12 blur-3xl" />
          <div className="relative">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {showIntervalBadge && (
                <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200">
                  {t('endurance.running.badges.interval')}
                </span>
              )}
              {session.source === 'garmin' && (
                <span className="rounded-full border border-teal-500/50 bg-teal-500/15 px-3 py-1 text-xs font-medium text-teal-100">
                  Garmin
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
            <p className="mt-2 text-teal-200/70">{subtitleDate}</p>
            <p className="mt-3 inline-flex rounded-lg border border-teal-800/50 bg-black px-3 py-1 text-sm text-teal-100/90">
              {t('endurance.running.details.typeSession')}{' '}
              <span className="ml-1 text-white">{runningSessionTypeLabel(effectiveSessionType, t)}</span>
            </p>
          </div>
        </header>

        {/* Stats principales */}
        <section className="mt-8">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-teal-200/80">
            <Activity className="h-4 w-4 text-teal-400" />
            Synthèse
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={Navigation2} label="Distance" value={`${session.distance} km`} />
            <StatCard icon={Clock} label="Durée" value={session.duration || '—'} />
            <StatCard icon={Gauge} label="Allure" value={`${session.pace} min/km`} />
            <StatCard icon={Footprints} label="Vitesse moy." value={`${session.speed} km/h`} />
            {session.elevation !== undefined && session.elevation !== '' && (
              <StatCard icon={Mountain} label="Dénivelé +" value={`${session.elevation} m`} />
            )}
            {garminFull?.maxSpeed != null && (
              <StatCard icon={Gauge} label="Vitesse max" value={`${garminFull.maxSpeed} km/h`} hint="Pic sur la séance" />
            )}
            {(garminFull?.avgHR != null || session.avgHR) && (
              <StatCard
                icon={Heart}
                label="Fréquence cardiaque"
                value={
                  garminFull
                    ? `${garminFull.avgHR ?? '—'} / ${garminFull.maxHR ?? '—'} / ${garminFull.minHR ?? '—'}`
                    : String(session.avgHR ?? '—')
                }
                hint="Moy. / max / min (bpm)"
              />
            )}
            {garminFull?.calories && (
              <StatCard
                icon={Flame}
                label="Calories"
                value={
                  typeof garminFull.calories === 'object'
                    ? String(garminFull.calories.total ?? '—')
                    : String(garminFull.calories)
                }
                hint={
                  typeof garminFull.calories === 'object'
                    ? `Actives ${garminFull.calories.active ?? '—'} · Repos ${garminFull.calories.resting ?? '—'}`
                    : undefined
                }
              />
            )}
          </div>
        </section>

        {session.notes && (
          <p className="mt-6 rounded-2xl border border-teal-700/35 bg-black px-5 py-4 text-sm leading-relaxed text-teal-100/90">
            {session.notes}
          </p>
        )}

        {/* Bloc Garmin enrichi */}
        {(session.source === 'garmin' || session.garminId) && (
          <section className="mt-10">
            {loading && (
              <div className="flex items-center gap-3 rounded-2xl border border-teal-500/40 bg-black p-6 text-teal-200/80">
                <Loader2 className="h-5 w-5 animate-spin text-teal-400" />
                Chargement des métriques Garmin…
              </div>
            )}

            {!loading && garminFull && (
              <>
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-teal-200/80">
                  <Heart className="h-4 w-4 text-teal-400" />
                  Physiologie & intensité
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {garminFull.intensityMinutes && (
                    <div className="rounded-2xl border border-teal-500/40 bg-black p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-teal-200/70">Minutes d&apos;intensité</p>
                      <p className="mt-2 text-lg text-white">
                        Modérée <span className="font-semibold text-teal-300">{garminFull.intensityMinutes.moderate ?? '—'}</span>
                        <span className="mx-2 text-teal-700">·</span>
                        Vigoureuse{' '}
                        <span className="font-semibold text-orange-300">{garminFull.intensityMinutes.vigorous ?? '—'}</span>
                        <span className="mx-2 text-teal-700">·</span>
                        Total{' '}
                        <span className="font-semibold text-white">{garminFull.intensityMinutes.total ?? '—'}</span>
                      </p>
                    </div>
                  )}
                  {garminFull.sweatLoss != null && (
                    <div className="rounded-2xl border border-teal-500/40 bg-black p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-teal-200/70">Hydratation (estim.)</p>
                      <p className="mt-2 text-2xl font-bold text-teal-100">{garminFull.sweatLoss} ml</p>
                      <p className="text-xs text-teal-300/55">Perte de sueur indiquée par Garmin</p>
                    </div>
                  )}
                </div>

                {garminFull.running && (
                  <div className="mt-6 rounded-2xl border border-teal-500/40 bg-black p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-teal-100/90">
                        <Layers className="h-5 w-5 text-teal-400" />
                        <span className="font-semibold">Course — agrégats</span>
                      </div>
                      <div className="text-sm text-teal-200/75">
                        Cadence moy. / max :{' '}
                        <span className="font-medium text-white">
                          {garminFull.running.averageCadenceSpm ?? '—'} / {garminFull.running.maxCadenceSpm ?? '—'} spm
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Carte & lieu */}
                {(garminFull.location?.start || garminFull.location?.end) && (
                  <div className="mt-6 rounded-2xl border border-teal-500/40 bg-black p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                      <MapPin className="h-4 w-4 text-teal-400" />
                      Parcours
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {garminFull.location?.start && (
                        <div>
                          <p className="text-xs uppercase text-teal-200/60">Départ</p>
                          {osmLink(garminFull.location.start.lat, garminFull.location.start.lng) ? (
                            <a
                              href={osmLink(garminFull.location.start.lat, garminFull.location.start.lng)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-teal-300 hover:text-teal-200"
                            >
                              {garminFull.location.start.lat?.toFixed(5)}, {garminFull.location.start.lng?.toFixed(5)}
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <p className="text-teal-300/50">—</p>
                          )}
                        </div>
                      )}
                      {garminFull.location?.end && (
                        <div>
                          <p className="text-xs uppercase text-teal-200/60">Arrivée</p>
                          {osmLink(garminFull.location.end.lat, garminFull.location.end.lng) ? (
                            <a
                              href={osmLink(garminFull.location.end.lat, garminFull.location.end.lng)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-teal-300 hover:text-teal-200"
                            >
                              {garminFull.location.end.lat?.toFixed(5)}, {garminFull.location.end.lng?.toFixed(5)}
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <p className="text-teal-300/50">—</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {garminFull.elevation && (
                  <div className="mt-4 rounded-2xl border border-teal-500/40 bg-black p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-200/70">Altitude</p>
                    <p className="mt-2 text-lg text-white">
                      D+ {garminFull.elevation.gain ?? '—'} m · D− {garminFull.elevation.loss ?? '—'} m · max{' '}
                      {garminFull.elevation.max ?? '—'} m · min {garminFull.elevation.min ?? '—'} m
                    </p>
                  </div>
                )}
              </>
            )}

            {!loading && !garminFull && (session.source === 'garmin' || session.garminId) && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 text-sm text-amber-100">
                Données brutes Garmin introuvables en local. Synchronise depuis l&apos;onglet Course ou Garmin pour
                afficher tours, FC détaillée et carte.
              </div>
            )}
          </section>
        )}

        {/* Tours auto (street / cardio) : message si pas fractionné */}
        {Array.isArray(laps) && laps.length > 0 && continuousGarminAutoLaps && (
          <section className="mt-12 rounded-2xl border border-teal-600/40 bg-black p-5">
            <h2 className="text-base font-semibold text-white">
              {t('garmin.cardioActivity.continuousLapsTitle')}
            </h2>
            <p className="mt-2 text-sm text-teal-200/75 leading-relaxed max-w-2xl">
              {t('garmin.cardioActivity.continuousLapsBody', { count: lapStats.total })}
            </p>
            <button
              type="button"
              onClick={() => setShowGarminLapsTable((v) => !v)}
              className="mt-3 text-sm text-teal-300 hover:text-teal-200 underline-offset-2 hover:underline"
            >
              {showGarminLapsTable
                ? t('garmin.cardioActivity.continuousLapsHideTechnical')
                : t('garmin.cardioActivity.continuousLapsShowTechnical')}
            </button>
          </section>
        )}

        {/* Tours — filtres fractionné (masqué par défaut si découpe auto sans repos) */}
        {Array.isArray(laps) && laps.length > 0 && (!continuousGarminAutoLaps || showGarminLapsTable) && (
          <section
            className={
              continuousGarminAutoLaps && showGarminLapsTable ? 'mt-6' : 'mt-12'
            }
          >
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                <Filter className="h-5 w-5 text-teal-400" />
                {isIntervalLike ? 'Tours & intervalles' : 'Tours Garmin'}
                <span className="ml-2 text-sm font-normal text-teal-300/50">({lapStats.total} tours)</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={setFilter(LAP_FILTER.ALL)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    lapFilter === LAP_FILTER.ALL
                      ? 'border-teal-500 bg-teal-500/20 text-teal-100'
                      : 'border-teal-800/60 bg-black text-teal-200/70 hover:border-teal-600 hover:text-white'
                  }`}
                >
                  Tous
                </button>
                <button
                  type="button"
                  onClick={setFilter(LAP_FILTER.EFFORT)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    lapFilter === LAP_FILTER.EFFORT
                      ? 'border-teal-400 bg-teal-500/25 text-teal-50'
                      : 'border-teal-800/60 bg-black text-teal-200/70 hover:border-teal-600 hover:text-white'
                  }`}
                >
                  Effort seulement
                </button>
                <button
                  type="button"
                  onClick={setFilter(LAP_FILTER.RECOVERY)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    lapFilter === LAP_FILTER.RECOVERY
                      ? 'border-amber-500 bg-amber-500/20 text-amber-100'
                      : 'border-teal-800/60 bg-black text-teal-200/70 hover:border-teal-600 hover:text-white'
                  }`}
                >
                  Récupération seulement
                </button>
              </div>
            </div>

            {isIntervalLike && (
              <p className="mb-4 text-sm text-teal-200/75">
                Détection : <span className="text-teal-300">{lapStats.effort}</span> segment(s) d&apos;effort ·{' '}
                <span className="text-amber-300">{lapStats.recovery}</span> segment(s) de récupération / repos.
              </p>
            )}

            <div className="space-y-3">
              {filteredLaps.map(({ lap, phase, key }) => (
                <div
                  key={key}
                  className={`rounded-2xl border border-teal-700/35 border-l-4 bg-black p-4 pl-5 shadow-sm ${phaseStyles(phase)}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badgeStyles(phase)}`}>
                        {phaseLabel(phase)}
                      </span>
                      {lap.intervalTypeKey && (
                        <span className="ml-2 text-xs text-teal-400/50">({lap.intervalTypeKey})</span>
                      )}
                      <p className="mt-2 text-lg font-semibold text-white">Tour {lap.index ?? '—'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-right text-sm sm:grid-cols-3">
                      <div>
                        <span className="block text-xs text-teal-200/60">Distance</span>
                        <span className="font-medium text-white">
                          {lap.distanceKm != null
                            ? `${lap.distanceKm} km`
                            : lap.distanceMeters != null
                              ? `${(lap.distanceMeters / 1000).toFixed(3)} km`
                              : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-teal-200/60">Durée</span>
                        <span className="font-medium text-white">{formatSec(lap.durationSeconds)}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-teal-200/60">Vitesse moy.</span>
                        <span className="font-medium text-white">
                          {lap.avgSpeedKmh != null ? `${lap.avgSpeedKmh} km/h` : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-teal-200/60">FC moy.</span>
                        <span className="font-medium text-white">{lap.avgHR ?? '—'}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-teal-200/60">Calories</span>
                        <span className="font-medium text-white">{lap.calories ?? '—'}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-teal-200/60">Cadence / foulée</span>
                        <span className="font-medium text-white">
                          {lap.averageCadenceSpm ?? '—'} spm · {lap.averageStrideLengthMeters ?? '—'} m
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredLaps.length === 0 && (
              <p className="rounded-xl border border-teal-700/40 bg-black p-6 text-center text-teal-200/70">
                Aucun tour dans cette catégorie. Change de filtre ou vérifie les types de segment Garmin.
              </p>
            )}
          </section>
        )}

        {/* Pied technique discret */}
        {garminFull && (
          <footer className="mt-12 space-y-4 border-t border-teal-900/40 pt-8">
            {garminFull.deviceInfo && (
              <div className="flex items-center gap-3 rounded-xl border border-teal-700/40 bg-black px-4 py-3 text-sm text-teal-200/75">
                <Watch className="h-4 w-4 shrink-0 text-teal-400/80" />
                <span>{formatDeviceShort(garminFull.deviceInfo)}</span>
              </div>
            )}
            <details className="rounded-xl border border-teal-800/50 bg-black">
              <summary className="cursor-pointer px-4 py-3 text-xs font-medium text-teal-300/80">
                Données techniques (diagnostic)
              </summary>
              <div className="border-t border-teal-900/40 px-4 py-3 text-xs text-teal-200/65">
                <p className="mb-2">
                  Heure locale début : {garminFull.startTimeLocal || '—'}
                </p>
                <pre className="max-h-56 overflow-auto rounded-lg bg-black/50 p-3 font-mono text-[10px] leading-relaxed text-teal-400/50">
                  {rawJson}
                </pre>
              </div>
            </details>
          </footer>
        )}

        {(!session.source || session.source !== 'garmin') && !session.garminId && (
          <p className="mt-10 text-center text-sm text-teal-300/55">
            Séance enregistrée manuellement — pas de détail d&apos;activité Garmin.
          </p>
        )}
      </div>
    </div>
  );
}
