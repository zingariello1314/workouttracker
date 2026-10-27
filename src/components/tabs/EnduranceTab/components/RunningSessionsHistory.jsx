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
  const kindColor = (k) =>
    ({
      endurance: 'var(--t-ef)',
      speed: 'var(--t-vit)',
      interval: 'var(--t-fract)',
      walking: 'var(--t-cl)',
      other: 'var(--bone-3)'
    }[k] || 'var(--accent)');
  const maxDist = Math.max(
    0.001,
    ...filtered.map((s) => parseFloat(String(s.distance ?? '').replace(',', '.')) || 0)
  );

  return (
    <div>
      <div className="sec-h" style={{ marginBottom: 18 }}>
        <h2>{title || t('endurance.history.title')}</h2>
        <span className="mono dim num tiny">
          {filtered.length} séance(s) affichée(s) sur {sessions.length}
        </span>
      </div>

      <div className="toolbar">
        <div className="defis-lab">
          {isWalkingMode ? 'Filtrer l’historique marche' : t('endurance.running.historyFilter.title')}
        </div>
        {!isWalkingMode && (
          <div className="chips">
            {kindKeys.map((k) => (
              <label key={k} className="chip">
                <input
                  type="checkbox"
                  checked={selectedKinds.has(k)}
                  onChange={() => toggleKind(k)}
                />
                <i className="dot" style={{ '--c': kindColor(k) }} />
                {kindLabel(k)}
              </label>
            ))}
          </div>
        )}
        <div className="nums">
          <div className="fld">
            <label className="defis-lab" htmlFor="defis-f-slow">
              {t('endurance.running.historyFilter.minPace')}
            </label>
            <input
              id="defis-f-slow"
              type="text"
              inputMode="decimal"
              value={minPaceMinPerKm}
              onChange={(e) => setMinPaceMinPerKm(e.target.value)}
              placeholder="ex. 5.5"
            />
          </div>
          <div className="fld">
            <label className="defis-lab" htmlFor="defis-f-fast">
              {t('endurance.running.historyFilter.maxPace')}
            </label>
            <input
              id="defis-f-fast"
              type="text"
              inputMode="decimal"
              value={maxPaceMinPerKm}
              onChange={(e) => setMaxPaceMinPerKm(e.target.value)}
              placeholder="ex. 7.2"
            />
          </div>
          <div className="fld">
            <label className="defis-lab" htmlFor="defis-f-dur">
              {t('endurance.running.historyFilter.minDuration')}
            </label>
            <input
              id="defis-f-dur"
              type="text"
              inputMode="decimal"
              value={minDurMin}
              onChange={(e) => setMinDurMin(e.target.value)}
              placeholder="min"
            />
          </div>
          <div className="fld">
            <label className="defis-lab" htmlFor="defis-f-dist">
              {t('endurance.running.historyFilter.minDistance')}
            </label>
            <input
              id="defis-f-dist"
              type="text"
              inputMode="decimal"
              value={minDistKm}
              onChange={(e) => setMinDistKm(e.target.value)}
              placeholder="km"
            />
          </div>
        </div>
        <p className="tiny">{t('endurance.running.historyFilter.paceHint')}</p>
      </div>

      <div>
        {filtered.length === 0 ? (
          <div className="empty" style={{ marginTop: 22 }}>
            <Play className="ic" />
            <h3>{t('endurance.history.noSessions')}</h3>
            <p>
              {isWalkingMode ? 'Aucune marche ne correspond aux filtres.' : t('endurance.running.historyFilter.emptyFiltered')}
            </p>
          </div>
        ) : (
          <div>
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
              const iso = String(session.date || '').match(/(\d{4})-(\d{2})-(\d{2})/);
              const dayNum = iso ? String(Number(iso[3])) : formatEnduranceSessionDateOnly(session.date);
              const kindC = kindColor(displayRunType === 'walking' ? 'walking' : displayRunType === 'interval' ? 'interval' : displayRunType === 'speed' ? 'speed' : 'endurance');

              return (
                <article
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
                  className="log"
                >
                  <div className="dt">
                    <b className="num">{dayNum}</b>
                    <span>{formatEnduranceSessionDateOnly(session.date)}</span>
                    {session.time ? <span>{formatEnduranceTime(session.time)}</span> : null}
                  </div>
                  <div>
                    <div className="tl">
                      <i className="dot" style={{ '--c': kindC }} />
                      <span style={{ color: kindC }}>{presentation.primaryLabel}</span>
                      {presentation.hrSubtitle ? <span className="zone">{presentation.hrSubtitle}</span> : null}
                      {session.validatedChallenges?.length > 0 && (
                        <span className="zone">✓ Défi validé</span>
                      )}
                    </div>
                    {session.notes ? (
                      <div className="nt">
                        <em>{t('endurance.swimming.details.notes')}</em>
                        {session.notes}
                      </div>
                    ) : null}
                    <span className="go">Voir le détail →</span>
                    <div className="dbar" style={{ '--c': kindC }}>
                      <i style={{ width: `${Math.min(100, (dist / maxDist) * 100)}%` }} />
                    </div>
                  </div>
                  <dl className="mx num">
                    <div>
                      <dt>{t('endurance.running.details.distance')}</dt>
                      <dd>{session.distance} km</dd>
                    </div>
                    <div>
                      <dt>{t('endurance.running.details.duration')}</dt>
                      <dd>{session.duration}</dd>
                    </div>
                    <div>
                      <dt>{t('endurance.running.details.pace')}</dt>
                      <dd>{paceStr}</dd>
                    </div>
                    <div>
                      <dt>{t('endurance.running.details.speed')}</dt>
                      <dd>
                        {speedKmh != null && Number.isFinite(speedKmh)
                          ? `${speedKmh.toFixed(2)} km/h`
                          : session.speed
                            ? `${session.speed} km/h`
                            : '—'}
                      </dd>
                    </div>
                  </dl>
                  <div className="ra">
                    <button
                      type="button"
                      className="ib"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.(session.id);
                      }}
                      aria-label="Modifier la session"
                      title="Modifier la session"
                    >
                      <Edit className="ic" />
                    </button>
                    <button
                      type="button"
                      className="ib del"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(session.id, originalIndex);
                      }}
                      aria-label="Supprimer la session"
                      title="Supprimer la session"
                    >
                      <Trash2 className="ic" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
