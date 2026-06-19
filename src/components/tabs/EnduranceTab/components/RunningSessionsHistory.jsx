import React, { useMemo, useState } from 'react';
import { Edit, Play, Trash2 } from 'lucide-react';
import { useTranslation } from '../../../../utils/translations';
import { useFormatters } from '../../../../utils/translations/formatters-hook';
import { paceMinPerKmFromSession, parseRunningSessionDurationMinutes, formatPaceMinPerKm } from '../../../../utils/runningPersonalRecords';
import { isWalkingLikeRunningSession } from '../../../../utils/runningSessionMovementKind';
import { inferRunningSessionKindFromSession } from '../../../../utils/runningSessionClassification';
import { resolveRunningSessionDisplayType } from '../../../../utils/runningSessionTypeLabel';
import { resolveRunningSessionPresentation } from '../../../../utils/runningSessionPresentation';
import { estimateMaxHeartRate } from '../../../../utils/sport/runningCardioStatsAnalytics';

const KIND_KEYS_RUNNING = ['endurance', 'speed', 'interval', 'other'];
const KIND_KEYS_WALKING = ['walking'];

function sessionKind(session, garminActivity, inferredFromGarmin) {
  if (isWalkingLikeRunningSession(session, garminActivity)) return 'walking';
  const resolved =
    inferredFromGarmin ?? inferRunningSessionKindFromSession(session, garminActivity, {});
  if (resolved === 'interval') return 'interval';
  if (resolved === 'speed') return 'speed';
  const disp = resolveRunningSessionDisplayType(session, resolved);
  if (disp === 'interval') return 'interval';
  if (disp === 'speed') return 'speed';
  if (!session?.type || session.type === 'endurance') return 'endurance';
  return 'other';
}

export default function RunningSessionsHistory({
  sessions = [],
  garminById = null,
  garminRunningKindByGarminId = null,
  classificationCtx = null,
  mode = 'running',
  title = null,
  onOpenDetail,
  onEdit,
  onDelete
}) {
  const t = useTranslation();
  const { formatEnduranceSessionDateOnly, formatEnduranceTime } = useFormatters();
  const isWalkingMode = mode === 'walking';
  const kindKeys = isWalkingMode ? KIND_KEYS_WALKING : KIND_KEYS_RUNNING;
  const [selectedKinds, setSelectedKinds] = useState(() => new Set(kindKeys));
  const [minPaceMinPerKm, setMinPaceMinPerKm] = useState('');
  const [maxPaceMinPerKm, setMaxPaceMinPerKm] = useState('');
  const [minDurMin, setMinDurMin] = useState('');
  const [minDistKm, setMinDistKm] = useState('');

  const getG = (session) => {
    if (!garminById || typeof garminById.get !== 'function') return null;
    const key = session?.garminId != null ? String(session.garminId) : String(session?.id ?? '');
    return garminById.get(key) || null;
  };

  const getInferred = (session) => {
    const gid = session?.garminId ?? session?.id;
    if (gid == null || !garminRunningKindByGarminId) return undefined;
    return garminRunningKindByGarminId.get(String(gid));
  };

  const toggleKind = (k) => {
    setSelectedKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const fcMax = useMemo(
    () =>
      estimateMaxHeartRate(sessions, garminById, {
        ageYears: classificationCtx?.age ?? null,
        garminCardioActivities: garminById instanceof Map ? [...garminById.values()] : null
      }),
    [sessions, garminById, classificationCtx]
  );

  const filtered = useMemo(() => {
    const list = Array.isArray(sessions) ? [...sessions] : [];
    const minP = parseFloat(String(minPaceMinPerKm).replace(',', '.'));
    const maxP = parseFloat(String(maxPaceMinPerKm).replace(',', '.'));
    const minD = parseFloat(String(minDurMin).replace(',', '.'));
    const minKm = parseFloat(String(minDistKm).replace(',', '.'));

    return list
      .filter((session) => {
        const g = getG(session);
        const inf = getInferred(session);
        const kind = sessionKind(session, g, inf);
        if (isWalkingMode && kind !== 'walking') return false;
        if (!isWalkingMode && kind === 'walking') return false;
        if (selectedKinds.size > 0 && !selectedKinds.has(kind)) return false;

        const pace = paceMinPerKmFromSession(session);
        if (Number.isFinite(minP) && minP > 0 && (pace == null || pace < minP)) return false;
        if (Number.isFinite(maxP) && maxP > 0 && (pace == null || pace > maxP)) return false;

        const dur = parseRunningSessionDurationMinutes(session?.duration);
        if (Number.isFinite(minD) && minD > 0 && dur < minD) return false;

        const dist = parseFloat(String(session?.distance ?? '').replace(',', '.')) || 0;
        if (Number.isFinite(minKm) && minKm > 0 && dist < minKm) return false;

        return true;
      })
      .sort((a, b) => new Date(`${b.date} ${b.time || ''}`) - new Date(`${a.date} ${a.time || ''}`));
  }, [
    sessions,
    garminById,
    garminRunningKindByGarminId,
    isWalkingMode,
    selectedKinds,
    minPaceMinPerKm,
    maxPaceMinPerKm,
    minDurMin,
    minDistKm
  ]);

  const kindLabel = (k) => t(`endurance.running.historyFilter.kind.${k}`);

  return (
    <div>
      <h3 className="mb-4 text-2xl font-bold text-white">{title || t('endurance.history.title')}</h3>

      <div className="mb-4 rounded-xl border border-[#0F4C5C]/50 bg-black/60 p-4">
        <p className="mb-3 text-xs font-medium text-teal-600">
          {isWalkingMode ? 'Filtrer l’historique marche' : t('endurance.running.historyFilter.title')}
        </p>
        {!isWalkingMode && (
          <div className="mb-3 flex flex-wrap gap-3">
            {kindKeys.map((k) => (
              <label key={k} className="flex cursor-pointer items-center gap-2 text-sm text-teal-100">
                <input
                  type="checkbox"
                  checked={selectedKinds.has(k)}
                  onChange={() => toggleKind(k)}
                  className="rounded border-[#0F4C5C]/60 bg-black text-sky-500 focus:ring-sky-500/40"
                />
                {kindLabel(k)}
              </label>
            ))}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-slate-500">
              {t('endurance.running.historyFilter.minPace')}
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={minPaceMinPerKm}
              onChange={(e) => setMinPaceMinPerKm(e.target.value)}
              placeholder="ex. 5.5"
              className="w-full rounded-lg border border-[#0F4C5C]/50 bg-black px-2 py-1.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-slate-500">
              {t('endurance.running.historyFilter.maxPace')}
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={maxPaceMinPerKm}
              onChange={(e) => setMaxPaceMinPerKm(e.target.value)}
              placeholder="ex. 7.2"
              className="w-full rounded-lg border border-[#0F4C5C]/50 bg-black px-2 py-1.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-slate-500">
              {t('endurance.running.historyFilter.minDuration')}
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={minDurMin}
              onChange={(e) => setMinDurMin(e.target.value)}
              placeholder="min"
              className="w-full rounded-lg border border-[#0F4C5C]/50 bg-black px-2 py-1.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wide text-slate-500">
              {t('endurance.running.historyFilter.minDistance')}
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={minDistKm}
              onChange={(e) => setMinDistKm(e.target.value)}
              placeholder="km"
              className="w-full rounded-lg border border-[#0F4C5C]/50 bg-black px-2 py-1.5 text-sm text-white"
            />
          </div>
        </div>
        <p className="mt-2 text-[10px] text-slate-500">{t('endurance.running.historyFilter.paceHint')}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#0F4C5C]/50 bg-black">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Play className="mx-auto mb-4 h-16 w-16 text-slate-600" />
            <p className="text-lg text-slate-400">{t('endurance.history.noSessions')}</p>
            <p className="mt-2 text-sm text-slate-500">
              {isWalkingMode ? 'Aucune marche ne correspond aux filtres.' : t('endurance.running.historyFilter.emptyFiltered')}
            </p>
          </div>
        ) : (
          <div className="space-y-4 p-6">
            {filtered.map((session, idx) => {
              const originalIndex = sessions.findIndex((s) => s === session);
              const gid = session.garminId ?? session.id;
              const g = getG(session);
              const inferredFromGarmin = gid != null ? garminRunningKindByGarminId?.get(String(gid)) : undefined;
              const isWalk = isWalkingLikeRunningSession(session, g);
              const presentation = isWalk
                ? {
                    primaryLabel: t('endurance.running.sessionTypes.walking'),
                    primaryType: 'walking',
                    hrSubtitle: null,
                    zone: null
                  }
                : resolveRunningSessionPresentation(session, g, {
                    fcMax,
                    inferredKind: inferredFromGarmin,
                    classificationCtx: classificationCtx || {},
                    t
                  });
              const displayRunType = presentation.primaryType;
              const paceNum = paceMinPerKmFromSession(session);
              const paceStr = paceNum != null ? formatPaceMinPerKm(paceNum) : String(session.pace || '—');
              const dist = parseFloat(String(session.distance ?? '').replace(',', '.')) || 0;
              const durMin = parseRunningSessionDurationMinutes(session.duration);
              const speedKmh = durMin > 0 ? dist / (durMin / 60) : null;

              return (
                <div
                  key={`running-${session.id}-${idx}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenDetail?.(session)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpenDetail?.(session);
                    }
                  }}
                  className="cursor-pointer rounded-xl border border-[#0F4C5C]/45 bg-black p-6 transition-all hover:border-[#0F5C45]/45 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/50"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span
                          className={`text-lg font-bold tracking-tight ${
                            displayRunType === 'interval'
                              ? 'text-amber-200'
                              : displayRunType === 'speed'
                                ? 'text-rose-300'
                              : displayRunType === 'walking'
                                ? 'text-sky-300'
                                : 'text-emerald-200'
                          }`}
                        >
                          {presentation.primaryLabel}
                        </span>
                        {presentation.hrSubtitle ? (
                          <span className="rounded-md border border-rose-500/25 bg-rose-950/30 px-2 py-0.5 text-xs font-medium text-rose-200/90">
                            {presentation.hrSubtitle}
                          </span>
                        ) : null}
                        <span className="hidden text-slate-500 sm:inline" aria-hidden>
                          ·
                        </span>
                        <span className="text-lg font-bold text-white">
                          {formatEnduranceSessionDateOnly(session.date)}
                        </span>
                        {session.time ? (
                          <span className="text-base font-medium text-slate-400">
                            {formatEnduranceTime(session.time)}
                          </span>
                        ) : null}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                        <div>
                          <span className="text-slate-400">{t('endurance.running.details.distance')}</span>
                          <span className="ml-2 font-bold text-white">{session.distance} km</span>
                        </div>
                        <div>
                          <span className="text-slate-400">{t('endurance.running.details.duration')}</span>
                          <span className="ml-2 font-bold text-white">{session.duration}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">{t('endurance.running.details.pace')}</span>
                          <span className="ml-2 font-bold text-white">{paceStr}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">{t('endurance.running.details.speed')}</span>
                          <span className="ml-2 font-bold text-white">
                            {speedKmh != null && Number.isFinite(speedKmh)
                              ? `${speedKmh.toFixed(2)} km/h`
                              : session.speed
                                ? `${session.speed} km/h`
                                : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.validatedChallenges?.length > 0 && (
                        <span className="rounded-lg border border-green-500/30 bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-3 py-1 text-xs font-medium text-green-400">
                          ✓ Défi validé
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit?.(session.id);
                        }}
                        className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg p-2"
                        title="Modifier la session"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete?.(session.id, originalIndex);
                        }}
                        className="gradient-button-premium gradient-button-premium-sm rounded-lg p-2"
                        title="Supprimer la session"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {session.notes && (
                    <div className="mt-4 text-sm text-slate-400">
                      <span className="font-medium">{t('endurance.swimming.details.notes')}</span> {session.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
