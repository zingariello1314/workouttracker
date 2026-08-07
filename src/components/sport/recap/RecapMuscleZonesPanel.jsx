import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { MuscleGroups } from '../../../data/workoutProgramEnhanced';
import {
  recapScoreToHexRelative,
  recapDisplayRecoveryBand,
  recapZoneBlendHueScore
} from '../../../utils/sport/recapIntensityColors';
import {
  CARDIO_BLEND,
  RECAP_SYNTHETIC_ENDURANCE_PUSHUPS_ID
} from '../../../utils/sport/recapMuscleLoadEngine';

function exerciseNameIsProgramFallback(name) {
  if (!name || typeof name !== 'string') return false;
  const s = name.trim();
  return /^Exercice\s+\d+$/i.test(s) || /^Exercise\s+\d+$/i.test(s);
}

const ZONE_SECTIONS = [
  {
    titleKey: 'recap.zones.section.upper',
    rows: [
      { groupId: MuscleGroups.CHEST, detailKey: 'recap.zones.detail.chest' },
      { groupId: MuscleGroups.BACK, detailKey: 'recap.zones.detail.back' },
      { groupId: MuscleGroups.SHOULDERS, detailKey: 'recap.zones.detail.shoulders' },
      { groupId: MuscleGroups.CORE, detailKey: 'recap.zones.detail.core' }
    ]
  },
  {
    titleKey: 'recap.zones.section.arms',
    rows: [
      { groupId: MuscleGroups.BICEPS, detailKey: 'recap.zones.detail.biceps' },
      { groupId: MuscleGroups.TRICEPS, detailKey: 'recap.zones.detail.triceps' },
      { groupId: MuscleGroups.FOREARMS, detailKey: 'recap.zones.detail.forearms' }
    ]
  },
  {
    titleKey: 'recap.zones.section.legs',
    rows: [
      { groupId: MuscleGroups.QUADS, detailKey: 'recap.zones.detail.quads' },
      { groupId: MuscleGroups.GLUTES, detailKey: 'recap.zones.detail.glutes' },
      { groupId: MuscleGroups.HAMSTRINGS, detailKey: 'recap.zones.detail.hamstrings' },
      { groupId: MuscleGroups.CALVES, detailKey: 'recap.zones.detail.calves' },
      { groupId: MuscleGroups.TIBIALIS_ANTERIOR, detailKey: 'recap.zones.detail.tibialis_anterior' }
    ]
  },
  {
    titleKey: 'recap.zones.section.poly',
    rows: [{ groupId: MuscleGroups.FULL_BODY, detailKey: 'recap.zones.detail.fullBody' }]
  }
];

function ZoneRow({
  groupId,
  detailKey,
  byGroup,
  maxDisplay,
  colorReferenceMax,
  maxRepShareAcrossGroups,
  repShare,
  repShareForHue,
  maxRepShareForHue,
  volumeCheckedDisplay,
  topExercises,
  endurancePushupTotal,
  cardioMinutes = 0,
  cardioActivationPct = 0,
  t,
  cardioPct,
  hideTechnicalMetrics = false,
  accordionDefaultClosed = false
}) {
  const g = byGroup[groupId] || {
    strengthEffective: 0,
    cardioEffective: 0,
    displayScore: 0
  };
  const hasLoad = g.displayScore > 1e-6;
  const vol = Math.max(0, Math.round(Number(volumeCheckedDisplay) || 0));
  const hasReps = vol > 0;
  const repH = Math.max(0, Number(repShareForHue ?? repShare) || 0);
  const maxRH = Math.max(1e-9, Number(maxRepShareForHue ?? maxRepShareAcrossGroups) || 0);

  const hueScore = recapZoneBlendHueScore({
    vol,
    maxRH,
    repH,
    displayScore: g.displayScore,
    maxDisplay,
    colorReferenceMax,
    forFullBody: groupId === MuscleGroups.FULL_BODY
  });
  const color = recapScoreToHexRelative(hueScore, colorReferenceMax);
  const band = recapDisplayRecoveryBand(g.displayScore);
  const repDenom = Math.max(maxRepShareAcrossGroups, groupId === MuscleGroups.FULL_BODY ? vol : 0);
  const repPct = repDenom > 0 ? Math.min(100, (vol / repDenom) * 100) : 0;
  const loadPct = maxDisplay > 0 ? Math.min(100, (g.displayScore / maxDisplay) * 100) : 0;
  let pct = 0;
  if (!hasReps && hasLoad) {
    pct = Math.min(20, Math.max(3, loadPct * 0.3));
  } else if (hasReps && hasLoad) {
    pct = Math.min(100, Math.max(8, repPct * 0.55 + loadPct * 0.45));
  } else if (hasReps && !hasLoad) {
    pct = Math.min(100, Math.max(10, repPct));
  }
  const label = t(`recap.muscleGroup.${groupId}`, groupId);
  const isLegCardioGroup =
    groupId === MuscleGroups.QUADS ||
    groupId === MuscleGroups.HAMSTRINGS ||
    groupId === MuscleGroups.CALVES ||
    groupId === MuscleGroups.TIBIALIS_ANTERIOR;
  const showCardioMinutesAsPrimary = isLegCardioGroup && !hasReps && cardioMinutes > 0.25;
  const cardioMinutesRounded = Math.round(cardioMinutes);
  const cardioActivationPctRounded = Math.round(cardioActivationPct * 10) / 10;
  const [open, setOpen] = useState(!accordionDefaultClosed);

  return (
    <div
      id={`recap-zone-${groupId}`}
      className={`rounded-lg border border-[#0F4C5C]/55 bg-black scroll-mt-24 ${accordionDefaultClosed ? 'overflow-hidden' : 'px-3 py-2.5'}`}
    >
      {accordionDefaultClosed ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-[#0F4C5C]/15"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-100">{label}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 max-w-[120px] rounded-full bg-black overflow-hidden ring-1 ring-[#0F4C5C]/45">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              <span className="text-xs font-bold tabular-nums text-sky-300">
                {showCardioMinutesAsPrimary
                  ? `${cardioMinutesRounded} min`
                  : vol > 0
                    ? vol
                    : '—'}
              </span>
              <span
                className="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-slate-400"
                title={t(`recap.zones.recovery.${band}`)}
              >
                {t(`recap.zones.recovery.${band}`)}
              </span>
            </div>
          </div>
          <ChevronDown
            size={16}
            className={`shrink-0 text-teal-600 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
      ) : null}

      {(!accordionDefaultClosed || open) && (
        <div className={accordionDefaultClosed ? 'border-t border-[#0F4C5C]/35 px-3 py-2.5' : ''}>
          {!accordionDefaultClosed ? (
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-slate-100">{label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{t(detailKey)}</p>
              </div>
              <span
                className="shrink-0 mt-0.5 h-3.5 w-3.5 rounded-full border border-white/25 shadow-sm"
                style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}99` }}
                title={t(`recap.zones.recovery.${band}`)}
              />
            </div>
          ) : null}
          {!accordionDefaultClosed ? (
            <div
              className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-sky-500/35 bg-black px-3 py-2 ring-1 ring-[#0F4C5C]/30"
              title={
                groupId === MuscleGroups.FULL_BODY
                  ? t('recap.zones.fullBodyVolumeTitle')
                  : t('recap.zones.repsPartsHint')
              }
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-sky-200/95">
                {showCardioMinutesAsPrimary
                  ? t('recap.zones.cardioMinutesTitle', 'Sollicitation cardio')
                  : t('recap.zones.volumeCheckedTitle')}
              </span>
              <span className="text-xl font-bold tabular-nums text-sky-300 drop-shadow-[0_0_14px_rgba(56,189,248,0.35)] sm:text-2xl">
                {showCardioMinutesAsPrimary
                  ? t('recap.zones.cardioMinutesValue', '{{m}} min ({{pct}}%)', {
                      m: cardioMinutesRounded,
                      pct: cardioActivationPctRounded
                    })
                  : vol}
              </span>
            </div>
          ) : null}
          {!accordionDefaultClosed ? (
            <div className="mt-2 h-2.5 w-full rounded-full bg-black overflow-hidden ring-1 ring-[#0F4C5C]/45">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 14px ${color}77` }}
              />
            </div>
          ) : null}
          {!hideTechnicalMetrics ? (
            <>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400">
                <span>
                  {t('recap.zones.loadDisplay')}:{' '}
                  <span className="text-slate-200 font-mono tabular-nums">
                    {g.displayScore < 10 ? g.displayScore.toFixed(1) : Math.round(g.displayScore)}
                  </span>
                </span>
                <span>
                  {t('recap.zones.strength')}:{' '}
                  <span className="text-slate-300 font-mono tabular-nums">
                    {g.strengthEffective < 10 ? g.strengthEffective.toFixed(1) : Math.round(g.strengthEffective)}
                  </span>
                </span>
                <span>
                  {t('recap.zones.cardioRaw')}:{' '}
                  <span className="text-slate-300 font-mono tabular-nums">
                    {g.cardioEffective < 10 ? g.cardioEffective.toFixed(1) : Math.round(g.cardioEffective)}
                  </span>
                  <span className="text-slate-600"> ({cardioPct}%)</span>
                </span>
              </div>
              <p className="mt-1 text-[10px] text-slate-500 leading-snug">
                {groupId === MuscleGroups.FULL_BODY
                  ? t('recap.zones.fullBodyVolumeFoot')
                  : t('recap.zones.repsPartsHint')}
              </p>
            </>
          ) : null}
          {topExercises && topExercises.length > 0 ? (
            <div className={`${accordionDefaultClosed ? 'mt-1' : 'mt-2 pt-2 border-t border-slate-800/80'}`}>
              {!hideTechnicalMetrics ? (
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
                  {t('recap.zones.topFromProgram')}
                </p>
              ) : null}
              <ul className="space-y-0.5">
                {(hideTechnicalMetrics ? topExercises.slice(0, 5) : topExercises).map((ex, i) => {
              const unit = ex.isIso ? t('recap.zones.unitSeconds') : t('recap.zones.unitReps');
              const n = Math.round(ex.repsShare);
              const exLabel =
                ex.id === RECAP_SYNTHETIC_ENDURANCE_PUSHUPS_ID
                  ? t('recap.zones.endurancePushupsExercise')
                  : exerciseNameIsProgramFallback(ex.name)
                    ? t('recap.zones.unmappedExerciseName')
                    : ex.name;
              const puTotal = Math.max(0, Math.round(Number(endurancePushupTotal) || 0));
              const showEnduranceSplit =
                ex.id === RECAP_SYNTHETIC_ENDURANCE_PUSHUPS_ID && puTotal > 0 && n > 0;
              const pctZone =
                showEnduranceSplit && puTotal > 0
                  ? Math.round((n / puTotal) * 1000) / 10
                  : 0;
              const rightCol = showEnduranceSplit
                ? t('recap.zones.endurancePushupsSplitLine', {
                    total: puTotal,
                    parts: n,
                    pct: pctZone
                  })
                : `${n} ${unit}`;
              return (
                <li
                  key={`${groupId}-${ex.id || ex.name}-${i}`}
                  className="text-[11px] text-slate-300 flex justify-between gap-2"
                >
                  <span
                    className="truncate min-w-0"
                    title={exerciseNameIsProgramFallback(ex.name) ? ex.name : undefined}
                  >
                    {exLabel}
                  </span>
                  <span
                    className="shrink-0 max-w-[min(100%,14rem)] text-right font-semibold tabular-nums text-emerald-200/95 leading-snug"
                    title={showEnduranceSplit ? t('recap.zones.endurancePushupsSplitTitle') : undefined}
                  >
                    {rightCol}
                  </span>
                </li>
              );
            })}
              </ul>
            </div>
          ) : null}
          {!hideTechnicalMetrics ? (
            <p className="mt-1.5 text-[11px] text-slate-500">
              {t('recap.zones.recoveryLabel')}: {t(`recap.zones.recovery.${band}`)}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

const RecapMuscleZonesPanel = ({
  recapState,
  t,
  accordionDefaultClosed = false,
  hideTechnicalMetrics = false
}) => {
  const {
    byGroup,
    repShareByGroup = {},
    topExercisesByGroup = {},
    colorReferenceMax = 1e-9,
    maxRepShareAcrossGroups = 0,
    cardioMinutesByGroup = {},
    cardioActivationPctByGroup = {},
    volumeTotals = {}
  } = recapState;
  const cardioPct = Math.round(CARDIO_BLEND * 100);

  const maxDisplay = useMemo(() => {
    const ids = Object.values(MuscleGroups);
    let m = 0;
    ids.forEach((id) => {
      const v = byGroup[id]?.displayScore || 0;
      if (v > m) m = v;
    });
    return m > 0 ? m : 1;
  }, [byGroup]);

  return (
    <section className="rounded-xl border-2 border-[#0F4C5C]/70 bg-black p-4">
      <h2 className="text-sm font-semibold text-teal-100 mb-1">{t('recap.zones.title')}</h2>
      <p className="text-xs text-teal-700 mb-4 leading-relaxed">{t('recap.zones.intro')}</p>
      <div className="space-y-6">
        {ZONE_SECTIONS.map((section) => (
          <div key={section.titleKey}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-400/90 mb-2">
              {t(section.titleKey)}
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {section.rows.map((row) => (
                <ZoneRow
                  key={row.groupId}
                  groupId={row.groupId}
                  detailKey={row.detailKey}
                  byGroup={byGroup}
                  maxDisplay={maxDisplay}
                  colorReferenceMax={colorReferenceMax}
                  maxRepShareAcrossGroups={maxRepShareAcrossGroups}
                  repShare={repShareByGroup[row.groupId] || 0}
                  repShareForHue={
                    row.groupId === MuscleGroups.FULL_BODY
                      ? Math.max(volumeTotals.strengthReps || 0, repShareByGroup[MuscleGroups.FULL_BODY] || 0)
                      : undefined
                  }
                  maxRepShareForHue={
                    row.groupId === MuscleGroups.FULL_BODY
                      ? Math.max(maxRepShareAcrossGroups, volumeTotals.strengthReps || 0)
                      : undefined
                  }
                  volumeCheckedDisplay={
                    row.groupId === MuscleGroups.FULL_BODY
                      ? Math.round(volumeTotals.strengthReps || 0)
                      : Math.round(repShareByGroup[row.groupId] || 0)
                  }
                  topExercises={topExercisesByGroup[row.groupId]}
                  endurancePushupTotal={volumeTotals.endurancePushupReps || 0}
                  cardioMinutes={cardioMinutesByGroup[row.groupId] || 0}
                  cardioActivationPct={cardioActivationPctByGroup[row.groupId] || 0}
                  t={t}
                  cardioPct={cardioPct}
                  hideTechnicalMetrics={hideTechnicalMetrics}
                  accordionDefaultClosed={accordionDefaultClosed}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecapMuscleZonesPanel;
