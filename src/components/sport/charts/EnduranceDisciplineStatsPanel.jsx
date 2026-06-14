import React, { useMemo } from 'react';
import DenseDailyLineChart from './DenseDailyLineChart';
import { getDateStr } from '../../../utils/dateUtils';
import { buildDenseDailyPoints, defaultActivityRange } from '../../../utils/sport/dailyDenseTimeSeries';
import {
  aggregateRunningKmByDate,
  aggregatePushupRepsByDate,
  aggregateGainageSecondsByDate,
  aggregateJumpropeJumpsByDate,
  aggregateCircuitRoundsByDate
} from '../../../utils/sport/enduranceDailyAggregates';
import { aggregateGtgRepsByDate } from '../../../services/endurance/gtgService';

const todayStr = () => getDateStr(new Date());

/**
 * @param {'running'|'walking'|'pushups'|'jumprope'|'gainage'|'circuits'|'gtg'} kind
 * @param {any[]} sessions — uniquement pour les types session-based
 * @param {object} [circuitPayload] — { circuitProgress, circuitDefinitions } pour circuits
 * @param {object} [gtgPayload] — { gtgData, ctx } pour GTG
 */
const EnduranceDisciplineStatsPanel = ({ kind, sessions = [], circuitPayload = null, gtgPayload = null }) => {
  const { points, meta } = useMemo(() => {
    const end = todayStr();
    let raw = new Map();

    if (kind === 'running' || kind === 'walking') {
      raw = aggregateRunningKmByDate(sessions);
    } else if (kind === 'pushups') {
      raw = aggregatePushupRepsByDate(sessions);
    } else if (kind === 'gainage') {
      raw = aggregateGainageSecondsByDate(sessions);
    } else if (kind === 'jumprope') {
      raw = aggregateJumpropeJumpsByDate(sessions);
    } else if (kind === 'circuits' && circuitPayload) {
      raw = aggregateCircuitRoundsByDate(circuitPayload.circuitProgress, circuitPayload.circuitDefinitions);
    } else if (kind === 'gtg' && gtgPayload?.gtgData) {
      raw = aggregateGtgRepsByDate(gtgPayload.gtgData, gtgPayload.ctx || {});
    }

    const { start, end: endClamped } = defaultActivityRange(raw, end);
    const pts = buildDenseDailyPoints(raw, start, endClamped);

    const metaByKind = {
      running: { label: 'km', color: '#38bdf8', fmt: (v) => (Math.round(v * 100) / 100).toFixed(2) },
      walking: { label: 'km', color: '#34d399', fmt: (v) => (Math.round(v * 100) / 100).toFixed(2) },
      pushups: { label: 'reps', color: '#f472b6', fmt: (v) => String(Math.round(v)) },
      gainage: { label: 'secondes', color: '#a78bfa', fmt: (v) => String(Math.round(v)) },
      jumprope: { label: 'sauts', color: '#fbbf24', fmt: (v) => String(Math.round(v)) },
      circuits: { label: 'tours', color: '#22d3ee', fmt: (v) => String(Math.round(v)) },
      gtg: { label: 'reps GTG', color: '#a78bfa', fmt: (v) => String(Math.round(v)) }
    };

    return {
      points: pts,
      meta: metaByKind[kind] || metaByKind.running
    };
  }, [kind, sessions, circuitPayload, gtgPayload]);

  const title =
    kind === 'running'
      ? 'Course — km par jour'
      : kind === 'walking'
        ? 'Marche — km par jour'
        : kind === 'pushups'
          ? 'Pompes — reps par jour'
          : kind === 'gainage'
            ? 'Gainage — secondes par jour'
            : kind === 'jumprope'
              ? 'Corde — sauts par jour'
              : kind === 'gtg'
                ? 'Grease the Groove — reps par jour'
                : 'Circuits — tours par jour';

  return (
    <div className="rounded-2xl border border-[#0F4C5C]/55 bg-black p-5">
      <h3 className="mb-1 text-sm font-semibold text-white">{title}</h3>
      <p className="mb-4 text-[11px] text-slate-500">
        Un point par jour calendaire depuis la première activité enregistrée jusqu&apos;à aujourd&apos;hui. Les jours sans
        séance sont à 0.
      </p>
      <DenseDailyLineChart
        seriesA={points.map((p) => ({ date: p.date, value: p.value }))}
        metaA={{ label: meta.label, color: meta.color }}
        valueFormatA={meta.fmt}
        height={200}
        emptyMessage="Aucune séance sur cette discipline pour l’instant."
      />
    </div>
  );
};

export default EnduranceDisciplineStatsPanel;
