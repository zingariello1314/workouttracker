import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ChevronDown, Crown, GripVertical } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatCalendarHighlightDayLabel } from '../../utils/calendarMonthHighlights';
import {
  CALENDAR_MONTH_TILE_GROUPS,
  CALENDAR_MONTH_TILE_LAYOUT_EVENT,
  layoutOrderFromSections,
  orderedCalendarMonthSections,
  readCalendarMonthTileLayout,
  visibleCalendarMonthTileIds,
  writeCalendarMonthTileLayout
} from '../../utils/calendarMonthTileLayout';
import { weekHonorsForMonth, weekHonorEmoji, CALENDAR_WEEK_HONOR_TITLES } from '../../utils/calendarWeekLeaders';
import {
  calendarMonthExpandId,
  isCalendarMonthExpanded,
  setCalendarMonthExpanded
} from '../../utils/calendarExpandedMonths';

const ACCENTS = {
  training: 'bg-blue-500',
  running: 'bg-teal-400',
  steps: 'bg-emerald-500',
  energy: 'bg-amber-500',
  recovery: 'bg-violet-500'
};

const SECTION_TITLES = {
  training: ['calendar.stats.monthSectionTraining', 'Musculation'],
  running: ['calendar.stats.monthSectionRunning', 'Course'],
  steps: ['calendar.stats.monthSectionSteps', 'Pas'],
  energy: ['calendar.stats.monthSectionEnergy', 'Énergie'],
  recovery: ['calendar.stats.monthSectionRecovery', 'Récupération']
};

function useCalendarMonthTileIds() {
  const [ids, setIds] = useState(() => visibleCalendarMonthTileIds(readCalendarMonthTileLayout()));
  useEffect(() => {
    const sync = () => setIds(visibleCalendarMonthTileIds(readCalendarMonthTileLayout()));
    window.addEventListener(CALENDAR_MONTH_TILE_LAYOUT_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CALENDAR_MONTH_TILE_LAYOUT_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return ids;
}

function formatInt(value) {
  return Math.round(Number(value) || 0).toLocaleString('fr-FR');
}

function formatKm(value) {
  const n = Number(value) || 0;
  return `${n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`;
}

function formatSleep(hours) {
  const n = Number(hours) || 0;
  const text = Number.isInteger(n)
    ? String(n)
    : n.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `${text} h`;
}

function formatDuration(minutes) {
  const total = Math.round(Number(minutes) || 0);
  if (total <= 0) return '0 min';
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h <= 0) return `${m} min`;
  if (m <= 0) return `${h} h`;
  return `${h} h ${String(m).padStart(2, '0')}`;
}

function WeekHonorMark({ levels, metric }) {
  const emoji = weekHonorEmoji(metric, levels);
  if (!emoji) return null;
  const title = (Array.isArray(levels) ? levels : [])
    .map((level) => CALENDAR_WEEK_HONOR_TITLES[metric]?.[level])
    .filter(Boolean)
    .join(' + ');
  return (
    <span className="inline-flex items-center text-[12px] leading-none" title={title} aria-label={title}>
      {emoji}
    </span>
  );
}

function SummaryStat({ dot, value, label, crowned }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
        <span className="truncate text-[13px] font-semibold tabular-nums leading-none text-white">{value}</span>
        {crowned ? <Crown className="h-3 w-3 shrink-0 text-amber-300" aria-hidden /> : null}
      </div>
      <div className="mt-1 truncate pl-3 text-[10px] leading-tight text-slate-400">{label}</div>
    </div>
  );
}

function WeekBars({ values, formatValue, honors, metric, barClass }) {
  const list = Array.isArray(values) && values.length > 0 ? values : [0];
  const max = Math.max(...list, 0);
  return (
    <div className="mt-3 space-y-1.5">
      {list.map((value, i) => {
        const pct = max > 0 ? Math.round((value / max) * 100) : 0;
        return (
          <div key={`s${i + 1}`} className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-[11px] text-slate-500">S{i + 1}</span>
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-800/90">
              <div className={`h-full rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="flex shrink-0 items-center justify-end gap-1 text-[11px] tabular-nums text-slate-200">
              <WeekHonorMark levels={honors?.[i]} metric={metric} />
              {formatValue(value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DetailRow({ label, children, onOpen }) {
  const clickable = typeof onOpen === 'function';
  const Tag = clickable ? 'button' : 'div';
  return (
    <Tag
      type={clickable ? 'button' : undefined}
      onClick={clickable ? onOpen : undefined}
      className={`flex w-full items-baseline justify-between gap-3 border-t border-slate-800/90 py-1.5 text-left ${
        clickable ? 'transition hover:text-white' : ''
      }`}
    >
      <span className="text-[11px] text-slate-400">{label}</span>
      <span className="text-right text-[11px] text-slate-100">{children}</span>
    </Tag>
  );
}

function DatedValue({ value, dateYmd }) {
  return (
    <>
      <span className="font-semibold tabular-nums">{value}</span>
      {dateYmd ? (
        <span className="ml-1.5 font-normal text-slate-400">{formatCalendarHighlightDayLabel(dateYmd)}</span>
      ) : null}
    </>
  );
}

function BigStat({ value, label, crowned, align = 'left' }) {
  return (
    <div className={align === 'right' ? 'text-right' : 'text-left'}>
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        {crowned ? <Crown className="h-3 w-3 text-amber-300" aria-hidden /> : null}
        <span className="text-[15px] font-semibold tabular-nums leading-none text-white">{value}</span>
      </div>
      <div className="mt-1 text-[10px] text-slate-400">{label}</div>
    </div>
  );
}

function SectionFrame({ accent, title, children, editable, shown, onToggle, dragHandleProps }) {
  return (
    <section
      className={`rounded-xl border border-slate-800 bg-[#0c1424] px-3 py-2.5 ${
        shown ? '' : 'opacity-40'
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        {editable ? (
          <button
            type="button"
            className="cursor-grab text-slate-500 active:cursor-grabbing"
            aria-label={`Déplacer ${title}`}
            {...dragHandleProps}
          >
            <GripVertical size={14} />
          </button>
        ) : null}
        <span className={`h-2 w-2 shrink-0 rounded-[2px] ${accent}`} />
        <span className="text-[12px] font-medium text-slate-100">{title}</span>
        {editable ? (
          <button
            type="button"
            onClick={onToggle}
            className="ml-auto rounded-md border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300"
          >
            {shown ? 'Masquer' : 'Afficher'}
          </button>
        ) : null}
      </div>
      {shown ? children : null}
    </section>
  );
}

export default function CalendarMonthSportTiles({
  sportStats,
  highlights,
  holders,
  monthIndex,
  t,
  onOpenHighlight,
  weekLeaders = null,
  calendarYear,
  calendarMonth,
  editable = false,
  layout,
  onLayoutChange,
  defaultExpanded = false
}) {
  const s = sportStats || {};
  const h = highlights || {};
  const weeks = Array.isArray(h.weekStepAvgs) ? h.weekStepAvgs : [0, 0, 0, 0];
  const weekReps = Array.isArray(h.weekRepTotals) ? h.weekRepTotals : [0, 0, 0, 0];
  const weekKm = Array.isArray(h.weekKmTotals) ? h.weekKmTotals : [0, 0, 0, 0];
  const bestSteps = h.bestDaySteps;
  const bestReps = h.bestDayReps;
  const bestVol = h.bestDayVolumeKg;
  const bestRun = h.bestRun;
  const bestKcal = h.bestKcalDay;
  const bestActivityKcal = h.bestActivityKcalDay;
  const storedIds = useCalendarMonthTileIds();
  const { currentUser } = useAuth();
  const userId = currentUser?.id != null ? String(currentUser.id) : '';
  const honorYearForKey = calendarYear ?? new Date().getFullYear();
  const honorMonthForKey = calendarMonth ?? monthIndex;
  const expandId = calendarMonthExpandId(honorYearForKey, honorMonthForKey);
  const [expanded, setExpanded] = useState(() => {
    if (editable) return defaultExpanded;
    if (!userId) return false;
    return isCalendarMonthExpanded(userId, expandId);
  });
  useEffect(() => {
    if (editable) return;
    if (!userId) return;
    setExpanded(isCalendarMonthExpanded(userId, expandId));
  }, [editable, userId, expandId]);
  const [editLayout, setEditLayout] = useState(() => layout || readCalendarMonthTileLayout());
  useEffect(() => {
    if (layout) setEditLayout(layout);
  }, [layout]);
  const activeLayout = editable ? editLayout : readCalendarMonthTileLayout();
  const visibleIds = editable ? visibleCalendarMonthTileIds(activeLayout) : storedIds;
  const shown = new Set(visibleIds);
  const honorYear = calendarYear ?? new Date().getFullYear();
  const honorMonth = calendarMonth ?? monthIndex;
  const honors = weekHonorsForMonth(weekLeaders, honorYear, honorMonth);
  const sections = orderedCalendarMonthSections(activeLayout);
  const isRecord = (metric) => holders?.[metric] === monthIndex;

  const commitLayout = (next) => {
    const saved = writeCalendarMonthTileLayout(next);
    setEditLayout(saved);
    onLayoutChange?.(saved);
  };

  const toggleParts = (parts, force) => {
    const anyShown = parts.some((id) => !activeLayout.hidden.includes(id));
    const hide = force == null ? anyShown : !force;
    const hidden = hide
      ? [...new Set([...activeLayout.hidden, ...parts])]
      : activeLayout.hidden.filter((id) => !parts.includes(id));
    commitLayout({ ...activeLayout, hidden });
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;
    const next = [...sections];
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    commitLayout({ ...activeLayout, order: layoutOrderFromSections(next, activeLayout) });
  };

  const open = (dateYmd, anchor) => {
    if (dateYmd) onOpenHighlight?.(dateYmd, anchor);
  };

  const summary = [];
  if (shown.has('training')) {
    summary.push(
      { key: 'reps', dot: 'bg-blue-500', value: formatInt(s.totalReps), label: t('calendar.stats.monthReps', 'Reps'), crowned: isRecord('totalReps') },
      { key: 'kg', dot: 'bg-blue-500', value: formatInt(s.totalKg), label: t('calendar.stats.monthKgLifted', 'Kg soulevés'), crowned: isRecord('totalKg') },
      { key: 'days', dot: 'bg-blue-500', value: formatInt(s.trainingDays), label: t('calendar.stats.monthTrainingDays', 'Jours entraînés'), crowned: isRecord('trainingDays') }
    );
  }
  if (shown.has('steps')) {
    summary.push({
      key: 'steps',
      dot: 'bg-emerald-500',
      value: formatInt(s.totalSteps || h.totalSteps),
      label: t('calendar.stats.monthTotalSteps', 'Pas du mois'),
      crowned: isRecord('totalSteps')
    });
  }
  if (shown.has('running')) {
    summary.push({
      key: 'km',
      dot: 'bg-emerald-400',
      value: formatKm(s.runningKm),
      label: t('calendar.stats.monthRunningKm', 'Km courus'),
      crowned: isRecord('runningKm')
    });
  }
  if (shown.has('recovery')) {
    summary.push({
      key: 'sleep',
      dot: 'bg-violet-500',
      value: formatSleep(h.avgSleepHours),
      label: t('calendar.stats.monthCardSleep', 'Sommeil moyen'),
      crowned: false
    });
  }

  const runs = s.runningSessionCount || 0;
  const groupLabels = Object.fromEntries(CALENDAR_MONTH_TILE_GROUPS.map((group) => [group.id, group.label]));

  const bodies = {
    training: (
      <>
        {shown.has('training') ? (
          <div className="grid grid-cols-3 gap-2">
            <BigStat value={formatInt(s.totalReps)} label={t('calendar.stats.monthReps', 'Reps')} crowned={isRecord('totalReps')} />
            <BigStat value={formatInt(s.totalKg)} label={t('calendar.stats.monthKgLifted', 'Kg soulevés')} crowned={isRecord('totalKg')} />
            <BigStat value={formatInt(s.trainingDays)} label={t('calendar.stats.monthTrainingDays', 'Jours entraînés')} crowned={isRecord('trainingDays')} />
          </div>
        ) : null}
        {shown.has('weekReps') ? (
          <WeekBars
            values={weekReps}
            formatValue={(value) => formatInt(value)}
            honors={honors.reps}
            metric="reps"
            barClass="bg-blue-500"
          />
        ) : null}
        {shown.has('training') ? (
          <div className="mt-2">
            <DetailRow label={t('calendar.stats.monthCardExerciseTime', "Temps d'exercice")}>
              <span className="font-semibold tabular-nums">{formatDuration(s.otherExerciseMinutes)}</span>
              {isRecord('otherExerciseMinutes') ? <Crown className="ml-1 inline h-3 w-3 text-amber-300" aria-hidden /> : null}
            </DetailRow>
            <DetailRow label={t('calendar.stats.monthTotalTime', 'Temps total')}>
              <span className="font-semibold tabular-nums">{formatDuration(s.totalMinutes)}</span>
              {isRecord('totalMinutes') ? <Crown className="ml-1 inline h-3 w-3 text-amber-300" aria-hidden /> : null}
            </DetailRow>
            <DetailRow label={t('calendar.stats.monthCardStreak', 'Série max')}>
              <span className="font-semibold tabular-nums">{s.longestStreak || 0} j</span>
              {isRecord('longestStreak') ? <Crown className="ml-1 inline h-3 w-3 text-amber-300" aria-hidden /> : null}
            </DetailRow>
          </div>
        ) : null}
        {shown.has('highlights') ? (
          <div className={shown.has('training') || shown.has('weekReps') ? 'mt-2' : ''}>
            <DetailRow
              label={t('calendar.stats.monthCardBestReps', 'Meilleur jour en reps')}
              onOpen={bestReps ? () => open(bestReps.dateYmd, bestReps.scrollAnchor) : undefined}
            >
              <DatedValue value={bestReps ? formatInt(bestReps.value) : '—'} dateYmd={bestReps?.dateYmd} />
            </DetailRow>
            <DetailRow
              label={t('calendar.stats.monthCardBestVolume', 'Meilleur jour en volume')}
              onOpen={bestVol ? () => open(bestVol.dateYmd, bestVol.scrollAnchor) : undefined}
            >
              <DatedValue
                value={bestVol ? `${formatInt(bestVol.valueKg)} kg` : '—'}
                dateYmd={bestVol?.dateYmd}
              />
            </DetailRow>
            <DetailRow label={t('calendar.stats.monthTopMuscles', 'Top muscles')}>
              <span>
                {h.topMuscles?.length ? h.topMuscles.map((m, i) => `${i + 1}. ${m.label}`).join(' ') : '—'}
              </span>
            </DetailRow>
          </div>
        ) : null}
      </>
    ),
    running: (
      <>
        {shown.has('running') ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              <BigStat value={formatKm(s.runningKm)} label={t('calendar.stats.monthCardDistance', 'Distance')} crowned={isRecord('runningKm')} />
              <BigStat value={formatDuration(s.runningMinutes)} label={t('calendar.stats.monthCardRunTime', 'Temps')} crowned={isRecord('runningMinutes')} />
              <BigStat
                value={formatInt(runs)}
                label={
                  runs > 1
                    ? t('calendar.stats.monthCardSessions', 'Sorties')
                    : t('calendar.stats.monthCardSession', 'Sortie')
                }
                crowned={isRecord('runningSessionCount')}
              />
            </div>
          </>
        ) : null}
        {shown.has('weekKm') ? (
          <WeekBars
            values={weekKm}
            formatValue={(value) => formatKm(value)}
            barClass="bg-teal-400"
          />
        ) : null}
        {shown.has('running') ? (
          <div className="mt-2">
            <DetailRow
              label={t('calendar.stats.monthBestRun', 'Meilleure course')}
              onOpen={bestRun ? () => open(bestRun.dateYmd, bestRun.scrollAnchor) : undefined}
            >
              <DatedValue value={bestRun ? formatKm(bestRun.km) : '—'} dateYmd={bestRun?.dateYmd} />
            </DetailRow>
          </div>
        ) : null}
      </>
    ),
    steps: shown.has('steps') ? (
      <>
        <div className="flex items-start justify-between gap-3">
          <BigStat
            value={formatInt(s.totalSteps || h.totalSteps)}
            label={t('calendar.stats.monthTotalSteps', 'Pas du mois')}
            crowned={isRecord('totalSteps')}
          />
          <BigStat
            align="right"
            value={formatInt(h.avgStepsPerDay)}
            label={t('calendar.stats.monthCardAvgSteps', 'Moy. par jour actif')}
          />
        </div>
        <WeekBars
          values={weeks}
          formatValue={(value) => formatInt(value)}
          honors={honors.steps}
          metric="steps"
          barClass="bg-emerald-500"
        />
        <div className="mt-2">
          <DetailRow
            label={t('calendar.stats.monthCardBestSteps', 'Jour le plus actif')}
            onOpen={bestSteps ? () => open(bestSteps.dateYmd, bestSteps.scrollAnchor) : undefined}
          >
            <DatedValue value={bestSteps ? formatInt(bestSteps.steps) : '—'} dateYmd={bestSteps?.dateYmd} />
          </DetailRow>
        </div>
      </>
    ) : null,
    energy: (
      <div className={`grid gap-3 ${shown.has('dailyKcal') && shown.has('activityKcal') ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {shown.has('dailyKcal') ? (
          <div>
            <div className="text-[10px] text-slate-400">{t('calendar.stats.monthDailyKcalCol', 'Journée')}</div>
            <div className="mt-0.5 flex items-center gap-1 text-[15px] font-semibold tabular-nums text-white">
              {formatInt(s.activeKcal)} kcal
              {isRecord('activeKcal') ? <Crown className="h-3 w-3 text-amber-300" aria-hidden /> : null}
            </div>
            <DetailRow label={t('calendar.stats.monthAvgKcalShort', 'Moyenne')}>
              <span className="font-semibold tabular-nums">{formatInt(h.avgKcalPerDay)}</span>
            </DetailRow>
            <DetailRow
              label={t('calendar.stats.monthRecordShort', 'Record')}
              onOpen={bestKcal ? () => open(bestKcal.dateYmd, bestKcal.scrollAnchor) : undefined}
            >
              <DatedValue value={bestKcal ? formatInt(bestKcal.value) : '—'} dateYmd={bestKcal?.dateYmd} />
            </DetailRow>
          </div>
        ) : null}
        {shown.has('activityKcal') ? (
          <div>
            <div className="text-[10px] text-slate-400">{t('calendar.stats.monthActivityKcalCol', 'Activités')}</div>
            <div className="mt-0.5 text-[15px] font-semibold tabular-nums text-white">
              {formatInt(h.activityKcalTotal)} kcal
            </div>
            <DetailRow label={t('calendar.stats.monthAvgKcalShort', 'Moyenne')}>
              <span className="font-semibold tabular-nums">{formatInt(h.avgActivityKcalPerDay)}</span>
            </DetailRow>
            <DetailRow
              label={t('calendar.stats.monthRecordShort', 'Record')}
              onOpen={bestActivityKcal ? () => open(bestActivityKcal.dateYmd, bestActivityKcal.scrollAnchor) : undefined}
            >
              <DatedValue
                value={bestActivityKcal ? formatInt(bestActivityKcal.value) : '—'}
                dateYmd={bestActivityKcal?.dateYmd}
              />
            </DetailRow>
          </div>
        ) : null}
      </div>
    ),
    recovery: shown.has('recovery') ? (
      <div className="grid grid-cols-3 gap-2">
        <BigStat value={formatSleep(h.avgSleepHours)} label={t('calendar.stats.monthCardSleep', 'Sommeil moyen')} />
        <BigStat
          value={`${h.restDaysChecked || 0}/${h.restDaysPlanned || 0}`}
          label={t('calendar.stats.monthRestChecked', 'Repos cochés')}
        />
        <BigStat value={formatInt(h.stretchCount)} label={t('calendar.stats.monthStretches', 'Étirements')} />
      </div>
    ) : null
  };

  const partToggles = {
    training: [
      ['weekReps', 'Semaines'],
      ['highlights', 'Records']
    ],
    running: [['weekKm', 'Semaines']],
    energy: [
      ['dailyKcal', 'Journée'],
      ['activityKcal', 'Activités']
    ]
  };

  const renderSection = (section, dragHandleProps) => {
    const anyShown = section.parts.some((id) => shown.has(id));
    const toggles = editable && anyShown ? partToggles[section.id] : null;
    return (
      <SectionFrame
        accent={ACCENTS[section.id]}
        title={t(SECTION_TITLES[section.id][0], SECTION_TITLES[section.id][1])}
        editable={editable}
        shown={anyShown}
        onToggle={() => toggleParts(section.parts)}
        dragHandleProps={dragHandleProps}
      >
        {bodies[section.id]}
        {toggles ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {toggles.map(([id, label]) => {
              const on = shown.has(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleParts([id], !on)}
                  className={`rounded-full px-2 py-0.5 text-[10px] ring-1 ${
                    on
                      ? 'bg-slate-100/10 text-slate-100 ring-slate-500/40'
                      : 'text-slate-500 ring-slate-700'
                  }`}
                >
                  {groupLabels[id] || label}
                </button>
              );
            })}
          </div>
        ) : null}
      </SectionFrame>
    );
  };

  if (!editable && visibleIds.length === 0) return null;

  const summaryGrid =
    !expanded && summary.length > 0 ? (
      <div className="mt-3 grid grid-cols-3 gap-x-2 gap-y-3">
        {summary.map(({ key, ...item }) => (
          <SummaryStat key={key} {...item} />
        ))}
      </div>
    ) : null;

  const sectionList = !expanded ? (
    editable ? (
      <p className="mt-2 text-[11px] text-slate-500">
        Déplie la carte pour masquer, réafficher ou réordonner les blocs.
      </p>
    ) : null
  ) : editable ? (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="calendar-month-sections">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="mt-3 space-y-2">
            {sections.map((section, index) => (
              <Draggable key={section.id} draggableId={section.id} index={index}>
                {(drag, snapshot) => (
                  <div ref={drag.innerRef} {...drag.draggableProps} className={snapshot.isDragging ? 'z-30' : ''}>
                    {renderSection(section, drag.dragHandleProps)}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  ) : (
    <div className="mt-3 space-y-2">
      {sections.map((section) => {
        if (!section.parts.some((id) => shown.has(id))) return null;
        return <React.Fragment key={section.id}>{renderSection(section)}</React.Fragment>;
      })}
    </div>
  );

  return (
    <div className="mt-2 rounded-xl border border-slate-700/70 bg-[#070d18] px-3 py-2.5 text-left">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-slate-100">
          {t('calendar.stats.monthCardTitle', 'Stats du mois')}
        </span>
        <button
          type="button"
          onClick={() => {
            const next = !expanded;
            setExpanded(next);
            if (!editable && userId) setCalendarMonthExpanded(userId, expandId, next);
          }}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1 rounded-md border border-slate-600/80 bg-slate-900/70 px-2 py-0.5 text-[11px] text-slate-300"
        >
          {expanded
            ? t('calendar.stats.monthCardCollapse', 'Réduire')
            : t('calendar.stats.monthCardExpand', 'Tout voir')}
          <ChevronDown className={`h-3 w-3 transition ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {summaryGrid}
      {sectionList}
    </div>
  );
}
