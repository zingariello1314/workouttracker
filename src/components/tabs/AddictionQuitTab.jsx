import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import {
  CIGARETTE_TIMELINE_FR,
  THC_TIMELINE_FR,
  TWENTY_YEARS_MS,
  progressTwentyYears,
  elapsedMs,
  formatElapsedDetailed,
  isoToDatetimeLocal,
  MS,
} from '../../utils/addictionQuitConstants';
import { getNextMilestone, formatTimeUntilFr, formatTimeUntilEn } from '../../utils/addictionQuitHelpers';
import {
  getPeriodMilestoneDefinitions,
  resolvePeriodMilestoneLabel,
  getNextPeriodMilestone,
  periodMilestoneGaugeT,
} from '../../utils/addictionQuitPeriodMilestones';
import {
  mergeAddictionQuitData,
  applyQuitAtChange,
  applyRelapse,
  applyRelapseBoth,
  findPastSessionReachedMilestone,
  getActiveSession,
} from '../../utils/addictionQuitSessionsXp';
import { useAddictionQuitXP } from '../../hooks/useAddictionQuitXP';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { useTranslation } from '../../utils/translations';
import { LANGUAGES } from '../../utils/translations/constants';
import { useLanguage } from '../../context/LanguageContext';
import { Ban, HeartPulse, Flame, Skull } from 'lucide-react';
import AddictionQuitCravingsPanel from './addictionQuit/AddictionQuitCravingsPanel';

const SUB_KEY = 'addictionQuit.lastSub';

function formatSessionLabel(iso, isFr) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(isFr ? 'fr-FR' : 'en-US', { dateStyle: 'short', timeStyle: 'short' });
}

function TimelineGauge({ trackId, quitAtIso, milestones, accentClass, nowTick, t, isFr, aq }) {
  const pct = quitAtIso ? progressTwentyYears(quitAtIso, nowTick) : 0;
  const elapsed = quitAtIso ? elapsedMs(quitAtIso, nowTick) : 0;
  const label = formatElapsedDetailed(elapsed);
  const pctRounded = Math.round(pct * 1000) / 10;
  const pctWhole = Math.min(100, Math.floor(pct * 100));
  const next = quitAtIso ? getNextMilestone(milestones, elapsed) : null;
  const nextMs = next ? next.milestone.ms : -1;
  const whenFn = isFr ? formatTimeUntilFr : formatTimeUntilEn;
  const nextLine = next
    ? t('addictionQuit.nextMilestone', {
        label: next.milestone.label,
        when: whenFn(next.msUntil),
      })
    : quitAtIso
      ? t('addictionQuit.allMilestonesDone')
      : '';

  const nextPeriod = quitAtIso ? getNextPeriodMilestone(elapsed, t) : null;
  const periodDefs = useMemo(() => getPeriodMilestoneDefinitions(), []);

  const progressAria =
    trackId === 'cigarette'
      ? t('addictionQuit.progressAriaTobacco', { pct: String(pctRounded) })
      : t('addictionQuit.progressAriaThc', { pct: String(pctRounded) });

  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const nowRef = useRef(nowTick);
  nowRef.current = nowTick;
  useEffect(() => {
    if (!quitAtIso) {
      setLiveAnnouncement('');
      return;
    }
    const now = nowRef.current;
    const el = elapsedMs(quitAtIso, now);
    const pctR = Math.round(progressTwentyYears(quitAtIso, now) * 1000) / 10;
    const n = getNextMilestone(milestones, el);
    const wf = isFr ? formatTimeUntilFr : formatTimeUntilEn;
    const nl = n
      ? t('addictionQuit.nextMilestone', { label: n.milestone.label, when: wf(n.msUntil) })
      : t('addictionQuit.allMilestonesDone');
    const pa =
      trackId === 'cigarette'
        ? t('addictionQuit.progressAriaTobacco', { pct: String(pctR) })
        : t('addictionQuit.progressAriaThc', { pct: String(pctR) });
    setLiveAnnouncement(`${pa} ${nl}`);
  }, [quitAtIso, pctWhole, nextMs, trackId, milestones, t, isFr]);

  return (
    <div className="mt-6 space-y-3">
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </p>
      {quitAtIso && nextLine && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-sm text-amber-100">
          {nextLine}
        </p>
      )}
      {quitAtIso && nextPeriod && (
        <p className="rounded-lg border border-slate-600/50 bg-slate-900/50 px-3 py-2 text-xs text-slate-300">
          {t('addictionQuit.nextPeriodMilestone', {
            label: nextPeriod.label,
            when: whenFn(nextPeriod.msUntil),
          })}
        </p>
      )}
      <div className="flex items-center justify-between gap-2 text-xs text-slate-400 uppercase tracking-wide">
        <span>{t('addictionQuit.benefits20y')}</span>
        <span>{t('addictionQuit.gaugePct', { pct: String(pctRounded) })}</span>
      </div>
      <div
        className="relative rounded-xl border border-slate-600/50 bg-slate-900/60 p-3 pt-10 pb-2"
        role="region"
        aria-label={progressAria}
      >
        <div
          className="pointer-events-none absolute top-1 z-20 max-w-[min(96%,18rem)] -translate-x-1/2 truncate rounded-lg border border-amber-400/60 bg-slate-950/95 px-2 py-1 text-[11px] font-bold text-amber-200 shadow-lg sm:max-w-none sm:whitespace-nowrap sm:text-xs"
          style={{ left: `${Math.min(100, Math.max(0, pct * 100))}%` }}
          aria-hidden="true"
        >
          {label}
        </div>
        <div
          className="relative h-4 overflow-hidden rounded-full bg-slate-800"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pctWhole}
          aria-valuetext={t('addictionQuit.gaugeValueText', {
            pct: String(pctRounded),
            nextPart: next ? t('addictionQuit.gaugeNextPart', { label: next.milestone.label }) : '',
          })}
        >
          <div
            className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${accentClass} opacity-90 transition-[width] duration-700 ease-out`}
            style={{ width: `${pct * 100}%` }}
          />
          {periodDefs.map((d, i) => (
            <div
              key={`pdef-${i}`}
              className="pointer-events-none absolute bottom-0 w-px bg-amber-400/35"
              style={{
                left: `${Math.min(100, periodMilestoneGaugeT(d.ms) * 100)}%`,
                height: '42%',
              }}
              aria-hidden="true"
            />
          ))}
          {milestones.map((m, i) => (
            <div
              key={i}
              className="absolute top-0 h-full w-px bg-white/25"
              style={{ left: `${Math.min(100, m.t * 100)}%` }}
              aria-hidden="true"
            />
          ))}
          <div
            className="absolute top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-300 bg-amber-500 shadow-[0_0_12px_rgba(251,191,36,0.7)]"
            style={{ left: `${Math.min(100, Math.max(0, pct * 100))}%` }}
            aria-hidden="true"
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-slate-500 sm:text-xs">
          <span>0</span>
          <span>+20 ans ({Math.round(TWENTY_YEARS_MS / (365.25 * 24 * 3600 * 1000))} ans)</span>
        </div>
      </div>
      <ul className="max-h-[min(72vh,52rem)] space-y-1.5 overflow-y-auto pr-1 text-xs text-slate-300 sm:text-sm">
        {milestones.map((m, i) => {
          const reached = quitAtIso && elapsed >= m.ms - 1;
          const past = !reached && aq ? findPastSessionReachedMilestone(aq, trackId, m.ms) : null;
          return (
            <li
              key={i}
              className={`rounded-lg border px-2 py-1.5 ${
                reached
                  ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-100'
                  : past
                    ? 'border-amber-600/35 bg-amber-950/25 text-amber-50/95'
                    : 'border-slate-700/60 bg-slate-800/40 text-slate-500'
              }`}
            >
              <div>{m.label}</div>
              {reached && (
                <div className="mt-0.5 text-[10px] font-medium text-emerald-300/90">
                  {t('addictionQuit.milestoneCurrent')}
                </div>
              )}
              {past && (
                <div className="mt-0.5 text-[10px] text-amber-200/90">
                  {t('addictionQuit.milestonePastSession', { date: formatSessionLabel(past.startedAtIso, isFr) })}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <details className="mt-3 rounded-lg border border-slate-700/80 bg-slate-900/40 px-2 py-1.5">
        <summary className="cursor-pointer select-none text-xs font-semibold text-amber-100/90">
          {t('addictionQuit.periodMilestonesTitle')}
          <span className="ml-1 font-normal text-slate-500">({t('addictionQuit.periodMilestonesHint')})</span>
        </summary>
        <ul className="mt-2 max-h-52 space-y-1 overflow-y-auto pr-1 text-xs text-slate-300">
          {periodDefs.map((m, i) => {
            const reached = quitAtIso && elapsed >= m.ms - 1;
            const past = !reached && aq ? findPastSessionReachedMilestone(aq, trackId, m.ms) : null;
            const lab = resolvePeriodMilestoneLabel(m, t);
            return (
              <li
                key={`pd-${i}`}
                className={`rounded-lg border px-2 py-1 ${
                  reached
                    ? 'border-amber-500/40 bg-amber-950/25 text-amber-50'
                    : past
                      ? 'border-slate-600/50 bg-slate-800/50 text-slate-200'
                      : 'border-slate-700/60 bg-slate-800/30 text-slate-500'
                }`}
              >
                <div>{lab}</div>
                {reached && (
                  <div className="mt-0.5 text-[10px] font-medium text-amber-200/90">
                    {t('addictionQuit.milestoneCurrent')}
                  </div>
                )}
                {past && (
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    {t('addictionQuit.milestonePastSession', { date: formatSessionLabel(past.startedAtIso, isFr) })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </details>
    </div>
  );
}

function BigTimerBlock({
  trackId,
  track,
  onSetQuit,
  onRename,
  milestones,
  accentClass,
  nowTick,
  estimates,
  onPatchEstimates,
  onPatchTrackFocus,
  onPatchActiveSessionTitle,
  t,
  isFr,
  aq,
}) {
  const activeSess = getActiveSession(aq, trackId);
  const focus = aq.trackFocus?.[trackId] || { routine: true, sleep: false, mood: false };
  const elapsed = track.quitAtIso ? elapsedMs(track.quitAtIso, nowTick) : 0;
  const parts = useMemo(() => {
    if (!track.quitAtIso || elapsed <= 0) {
      return { y: 0, d: 0, h: 0, m: 0, s: 0 };
    }
    let r = Math.floor(elapsed / 1000);
    const y = Math.floor(r / (365.25 * 24 * 3600));
    r -= Math.floor(y * 365.25 * 24 * 3600);
    const d = Math.floor(r / (24 * 3600));
    r -= d * 24 * 3600;
    const h = Math.floor(r / 3600);
    r -= h * 3600;
    const m = Math.floor(r / 60);
    const s = r - m * 60;
    return { y, d, h, m, s };
  }, [track.quitAtIso, elapsed]);

  const dl = isoToDatetimeLocal(track.quitAtIso);
  const daysElapsed = elapsed > 0 ? elapsed / MS.DAY : 0;

  const packs = Number(estimates?.packsPerDay);
  const price = Number(estimates?.packPriceEur);
  const jointsW = Number(estimates?.jointsPerWeek);

  const avoidedPacks =
    trackId === 'cigarette' && track.quitAtIso && !Number.isNaN(packs) && packs > 0
      ? packs * daysElapsed
      : null;
  const euros =
    avoidedPacks != null && !Number.isNaN(price) && price > 0 ? avoidedPacks * price : null;
  const avoidedJoints =
    trackId === 'thc' && track.quitAtIso && !Number.isNaN(jointsW) && jointsW > 0
      ? (jointsW / 7) * daysElapsed
      : null;

  const unitYears = t('addictionQuit.years');
  const unitDays = t('addictionQuit.days');
  const unitHours = t('addictionQuit.hours');
  const unitMin = t('addictionQuit.minutes');
  const unitSec = t('addictionQuit.seconds');

  return (
    <Card className="border-slate-600/60 bg-gradient-to-b from-slate-900/95 to-slate-950/95 shadow-xl shadow-black/40">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            value={track.displayName || ''}
            onChange={(e) => onRename(trackId, e.target.value)}
            className="w-full max-w-xs border-b border-transparent bg-transparent text-xl font-bold text-white outline-none focus:border-cyan-400/50 sm:text-2xl"
            aria-label={t('addictionQuit.trackNameAria')}
          />
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="datetime-local"
              value={dl}
              onChange={(e) => onSetQuit(trackId, e.target.value)}
              className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
              aria-label={t('addictionQuit.quitDateTime')}
            />
            {track.quitAtIso && (
              <Button
                type="button"
                variant="secondary"
                className="border-slate-600 text-slate-300"
                onClick={() => {
                  if (window.confirm(t('addictionQuit.clearQuitConfirm'))) onSetQuit(trackId, '');
                }}
              >
                {t('addictionQuit.clearQuit')}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!track.quitAtIso ? (
          <p className="text-center text-slate-400">{t('addictionQuit.defineQuit')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
            {[
              [unitYears, parts.y],
              [unitDays, parts.d],
              [unitHours, parts.h],
              [unitMin, parts.m],
              [unitSec, parts.s],
            ].map(([lab, val]) => (
              <div
                key={lab}
                className="rounded-2xl border border-cyan-500/25 bg-slate-950/80 px-2 py-4 text-center shadow-inner"
              >
                <div className="font-mono text-3xl font-black tabular-nums text-cyan-200 sm:text-4xl md:text-5xl">
                  {val}
                </div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">
                  {lab}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 rounded-xl border border-slate-600/50 bg-slate-950/40 p-3">
          <h4 className="mb-2 text-sm font-semibold text-slate-200">{t('addictionQuit.estimateTitle')}</h4>
          <p className="mb-3 text-xs text-slate-500">{t('addictionQuit.estimateDisclaimer')}</p>
          {trackId === 'cigarette' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-slate-400">
                {t('addictionQuit.packsPerDay')}
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={estimates?.packsPerDay ?? ''}
                  onChange={(e) =>
                    onPatchEstimates({
                      packsPerDay: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
                />
              </label>
              <label className="text-xs text-slate-400">
                {t('addictionQuit.packPrice')}
                <input
                  type="number"
                  min={0}
                  step={0.05}
                  value={estimates?.packPriceEur ?? ''}
                  onChange={(e) =>
                    onPatchEstimates({
                      packPriceEur: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
                />
              </label>
            </div>
          ) : (
            <label className="text-xs text-slate-400">
              {t('addictionQuit.jointsPerWeek')}
              <input
                type="number"
                min={0}
                step={0.5}
                value={estimates?.jointsPerWeek ?? ''}
                onChange={(e) =>
                  onPatchEstimates({
                    jointsPerWeek: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
                className="mt-1 w-full max-w-xs rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
              />
            </label>
          )}
          {track.quitAtIso && elapsed > 0 && (
            <div className="mt-3 space-y-1 text-sm text-cyan-100/90">
              {avoidedPacks != null && (
                <p>
                  {t('addictionQuit.packsAvoided', {
                    n: avoidedPacks.toFixed(avoidedPacks >= 10 ? 0 : 1),
                  })}
                </p>
              )}
              {euros != null && (
                <p>
                  {t('addictionQuit.moneySaved', {
                    n: euros.toFixed(euros >= 100 ? 0 : 1),
                  })}
                </p>
              )}
              {avoidedJoints != null && (
                <p>
                  {t('addictionQuit.jointsAvoided', {
                    n: avoidedJoints.toFixed(avoidedJoints >= 10 ? 0 : 1),
                  })}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-slate-600/50 bg-slate-950/35 p-3">
          <p className="mb-2 text-xs font-medium text-slate-400">{t('addictionQuit.trackFocusTitle')}</p>
          <div className="flex flex-wrap gap-3 text-xs text-slate-300">
            {[
              ['routine', t('addictionQuit.focusRoutine')],
              ['sleep', t('addictionQuit.focusSleep')],
              ['mood', t('addictionQuit.focusMood')],
            ].map(([key, lab]) => (
              <label key={key} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!focus[key]}
                  onChange={(e) => onPatchTrackFocus(trackId, key, e.target.checked)}
                  className="rounded border-slate-500"
                />
                {lab}
              </label>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-slate-600">{t('addictionQuit.trackFocusHelp')}</p>
        </div>

        {track.quitAtIso && activeSess && (
          <div className="mt-3 rounded-lg border border-violet-500/30 bg-violet-950/20 p-3">
            <label className="block text-xs text-violet-200/90">
              {t('addictionQuit.sessionTitleLabel')}
              <input
                type="text"
                value={activeSess.userTitle || ''}
                onChange={(e) => onPatchActiveSessionTitle(trackId, e.target.value)}
                placeholder={t('addictionQuit.sessionTitlePlaceholder')}
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-2 py-2 text-sm text-white"
              />
            </label>
          </div>
        )}

        <TimelineGauge
          trackId={trackId}
          quitAtIso={track.quitAtIso}
          milestones={milestones}
          accentClass={accentClass}
          nowTick={nowTick}
          t={t}
          isFr={isFr}
          aq={aq}
        />
      </CardContent>
    </Card>
  );
}

const AddictionQuitTab = () => {
  const { data, updateData } = useWorkout();
  const t = useTranslation();
  const { language } = useLanguage();
  const isFr = language === LANGUAGES.FR;
  const addictionXp = useAddictionQuitXP();
  const [relapseOpen, setRelapseOpen] = useState(false);
  const [relapseMode, setRelapseMode] = useState('both');
  const [relapseAt, setRelapseAt] = useState('');
  const [relapseNote, setRelapseNote] = useState('');
  const [relapseSessionTitle, setRelapseSessionTitle] = useState('');
  const [relapseSessionReflection, setRelapseSessionReflection] = useState('');

  const [sub, setSub] = useState(() => {
    try {
      const s = localStorage.getItem(SUB_KEY);
      if (s === 'timers' || s === 'cravings') return s;
    } catch {
      /* ignore */
    }
    return 'timers';
  });

  useEffect(() => {
    try {
      localStorage.setItem(SUB_KEY, sub);
    } catch {
      /* ignore */
    }
  }, [sub]);

  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const aq = useMemo(() => mergeAddictionQuitData(data?.addictionQuitData), [data?.addictionQuitData]);

  const onSaveData = useCallback(
    async (nextAq) => {
      await updateData({
        ...data,
        addictionQuitData: nextAq,
      });
    },
    [data, updateData]
  );

  const onSetQuit = (trackId, datetimeLocal) => {
    let quitAtIso = null;
    if (datetimeLocal) {
      const d = new Date(datetimeLocal);
      if (!Number.isNaN(d.getTime())) quitAtIso = d.toISOString();
    }
    onSaveData(applyQuitAtChange(aq, trackId, quitAtIso, nowTick));
  };

  const onRename = (trackId, displayName) => {
    const tr = aq.tracks[trackId] || {};
    onSaveData({
      ...aq,
      tracks: {
        ...aq.tracks,
        [trackId]: { ...tr, displayName: displayName.trim() || tr.displayName },
      },
    });
  };

  const onPatchEstimates = (patch) => {
    onSaveData({
      ...aq,
      estimates: { ...aq.estimates, ...patch },
    });
  };

  const onPatchTrackFocus = useCallback(
    (tid, key, val) => {
      const cur = aq.trackFocus?.[tid] || {};
      onSaveData({
        ...aq,
        trackFocus: { ...aq.trackFocus, [tid]: { ...cur, [key]: val } },
      });
    },
    [aq, onSaveData]
  );

  const onPatchActiveSessionTitle = useCallback(
    (tid, title) => {
      const act = getActiveSession(aq, tid);
      if (!act) return;
      onSaveData({
        ...aq,
        sessions: {
          ...aq.sessions,
          [tid]: (aq.sessions[tid] || []).map((s) => (s.id === act.id ? { ...s, userTitle: title } : s)),
        },
      });
    },
    [aq, onSaveData]
  );

  const openRelapseModal = () => {
    const pad = (n) => String(n).padStart(2, '0');
    const d = new Date();
    setRelapseAt(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    setRelapseNote('');
    setRelapseSessionTitle('');
    setRelapseSessionReflection('');
    setRelapseMode('both');
    setRelapseOpen(true);
  };

  const submitRelapse = () => {
    const d = relapseAt ? new Date(relapseAt) : new Date();
    const atIso = Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    const sessionMeta = { userTitle: relapseSessionTitle, reflection: relapseSessionReflection };
    let next = aq;
    if (relapseMode === 'both') next = applyRelapseBoth(aq, atIso, relapseNote, sessionMeta);
    else next = applyRelapse(aq, relapseMode, atIso, relapseNote, sessionMeta);
    onSaveData(next);
    setRelapseOpen(false);
  };

  const xpPct =
    addictionXp.totalXP > 0 ? Math.min(100, (addictionXp.totalXP % 1000) / 10) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-3 pt-[1cm] pb-24 sm:px-4">
      <header className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/50 via-slate-900/90 to-cyan-950/40 p-6 shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              <Ban className="h-10 w-10 shrink-0 text-amber-400" aria-hidden="true" />
              {t('addictionQuit.title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">{t('addictionQuit.subtitle')}</p>
            <div className="mt-4 max-w-md rounded-xl border border-amber-500/30 bg-slate-950/60 p-3">
              <div className="flex items-center justify-between text-xs text-amber-100/90">
                <span>{t('addictionQuit.xpModuleTitle')}</span>
                <span className="font-mono font-bold text-white">{addictionXp.totalXP} XP</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-500">{t('addictionQuit.xpModuleHint')}</p>
            </div>
          </div>
          <HeartPulse className="hidden h-24 w-24 text-rose-400/40 lg:block" aria-hidden="true" />
        </div>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-slate-700 pb-2" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={sub === 'timers'}
          onClick={() => setSub('timers')}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            sub === 'timers'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
          }`}
        >
          {t('addictionQuit.sub.timers')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={sub === 'cravings'}
          onClick={() => setSub('cravings')}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            sub === 'cravings'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
          }`}
        >
          {t('addictionQuit.sub.cravings')}
        </button>
      </div>

      {sub === 'timers' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <BigTimerBlock
              trackId="cigarette"
              track={aq.tracks.cigarette}
              onSetQuit={onSetQuit}
              onRename={onRename}
              milestones={CIGARETTE_TIMELINE_FR}
              accentClass="from-rose-700 via-orange-600 to-amber-400"
              nowTick={nowTick}
              estimates={aq.estimates}
              onPatchEstimates={onPatchEstimates}
              onPatchTrackFocus={onPatchTrackFocus}
              onPatchActiveSessionTitle={onPatchActiveSessionTitle}
              t={t}
              isFr={isFr}
              aq={aq}
            />
            <BigTimerBlock
              trackId="thc"
              track={aq.tracks.thc}
              onSetQuit={onSetQuit}
              onRename={onRename}
              milestones={THC_TIMELINE_FR}
              accentClass="from-purple-800 via-violet-600 to-cyan-400"
              nowTick={nowTick}
              estimates={aq.estimates}
              onPatchEstimates={onPatchEstimates}
              onPatchTrackFocus={onPatchTrackFocus}
              onPatchActiveSessionTitle={onPatchActiveSessionTitle}
              t={t}
              isFr={isFr}
              aq={aq}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/35 bg-rose-950/20 p-4">
            <div>
              <h2 className="text-lg font-semibold text-white">{t('addictionQuit.relapseTitle')}</h2>
              <p className="text-sm text-slate-400">{t('addictionQuit.relapseHelp')}</p>
            </div>
            <Button
              type="button"
              className="bg-rose-600 hover:bg-rose-500"
              onClick={openRelapseModal}
            >
              <Skull className="mr-2 h-4 w-4" />
              {t('addictionQuit.relapseButton')}
            </Button>
          </div>
          {(aq.relapses || []).length > 0 && (
            <Card className="border-slate-600/60 bg-slate-900/60">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-lg font-semibold text-white">
                  <Flame className="h-5 w-5 text-slate-400" />
                  {t('addictionQuit.relapseHistory')}
                </div>
              </CardHeader>
              <CardContent className="max-h-48 overflow-y-auto text-sm">
                <ul className="space-y-2">
                  {[...(aq.relapses || [])]
                    .sort((a, b) => String(b.atIso).localeCompare(String(a.atIso)))
                    .map((r) => (
                      <li
                        key={r.id}
                        className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2"
                      >
                        <span className="font-medium text-slate-200">
                          {r.trackId === 'cigarette'
                            ? aq.tracks?.cigarette?.displayName || 'Tabac'
                            : aq.tracks?.thc?.displayName || 'THC'}
                        </span>
                        <span className="text-slate-400">
                          {formatSessionLabel(r.atIso, isFr)}
                        </span>
                        {r.note ? <span className="w-full text-xs text-slate-500">{r.note}</span> : null}
                        {r.sessionTitle ? (
                          <span className="w-full text-xs text-violet-200/90">
                            {t('addictionQuit.relapseSessionLine', { title: r.sessionTitle })}
                          </span>
                        ) : null}
                        {r.sessionReflection ? (
                          <span className="w-full text-xs text-slate-400 italic">
                            {t('addictionQuit.relapseReflectionLine', { text: r.sessionReflection })}
                          </span>
                        ) : null}
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {relapseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog">
          <Card className="w-full max-w-md border-slate-600 bg-slate-900 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white">{t('addictionQuit.relapseModalTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-slate-400">{t('addictionQuit.relapseModalBody')}</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    ['both', t('addictionQuit.relapseBoth')],
                    ['cigarette', t('addictionQuit.filterCig')],
                    ['thc', t('addictionQuit.filterThc')],
                  ].map(([id, lab]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setRelapseMode(id)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        relapseMode === id ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {lab}
                    </button>
                  ))}
                </div>
                <label className="block text-xs text-slate-400">
                  {t('addictionQuit.relapseAt')}
                  <input
                    type="datetime-local"
                    value={relapseAt}
                    onChange={(e) => setRelapseAt(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
                  />
                </label>
                <label className="block text-xs text-slate-400">
                  {t('addictionQuit.relapseNote')}
                  <textarea
                    value={relapseNote}
                    onChange={(e) => setRelapseNote(e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
                  />
                </label>
                <label className="block text-xs text-slate-400">
                  {t('addictionQuit.relapseSessionTitle')}
                  <input
                    type="text"
                    value={relapseSessionTitle}
                    onChange={(e) => setRelapseSessionTitle(e.target.value)}
                    placeholder={t('addictionQuit.relapseSessionTitlePlaceholder')}
                    className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
                  />
                </label>
                <label className="block text-xs text-slate-400">
                  {t('addictionQuit.relapseReflection')}
                  <input
                    type="text"
                    value={relapseSessionReflection}
                    onChange={(e) => setRelapseSessionReflection(e.target.value)}
                    placeholder={t('addictionQuit.relapseReflectionPlaceholder')}
                    className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
                  />
                </label>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 bg-rose-600 hover:bg-rose-500" onClick={submitRelapse}>
                    {t('addictionQuit.relapseConfirm')}
                  </Button>
                  <Button variant="secondary" className="flex-1 border-slate-600" onClick={() => setRelapseOpen(false)}>
                    {t('addictionQuit.cancel')}
                  </Button>
                </div>
            </CardContent>
          </Card>
        </div>
      )}

      {sub === 'cravings' && <AddictionQuitCravingsPanel aq={aq} onSaveData={onSaveData} />}
    </div>
  );
};

export default AddictionQuitTab;
