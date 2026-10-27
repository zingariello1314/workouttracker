import React, { useMemo } from 'react';
import { useFormatters } from '../../../../utils/translations/formatters-hook';
import {
  buildRunningSessionRows,
  computeRunningVolumeHighlights
} from '../../../../utils/sport/runningCardioStatsAnalytics';
import {
  computeRunningPersonalRecords,
  formatPaceMinPerKm
} from '../../../../utils/runningPersonalRecords';

export default function RunningCourseKpiBoard({
  sessions = [],
  garminById = null,
  garminRunningKindByGarminId = null,
  classificationCtx = null
}) {
  const { formatDate } = useFormatters();

  const rows = useMemo(
    () =>
      buildRunningSessionRows(
        sessions,
        garminById,
        classificationCtx || {},
        garminRunningKindByGarminId
      ),
    [sessions, garminById, classificationCtx, garminRunningKindByGarminId]
  );

  const highlights = useMemo(() => computeRunningVolumeHighlights(rows), [rows]);
  const records = useMemo(
    () => computeRunningPersonalRecords(sessions, garminById || null),
    [sessions, garminById]
  );

  const withDist = rows.filter((r) => r?.dist > 0).length;
  const totalKm =
    highlights?.totalKm != null
      ? highlights.totalKm
      : Math.round(rows.reduce((s, r) => s + (r.dist > 0 ? r.dist : 0), 0) * 100) / 100;

  const totalLabel = Number(totalKm || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  return (
    <section className="board" aria-label="Chiffres clés" style={{ marginBottom: 8 }}>
      <div>
        <span className="lab">Distance totale</span>
        <b className="num">
          {withDist ? totalLabel : '—'}
          {withDist ? <i>km</i> : null}
        </b>
        <div className="s">{rows.length} séance{rows.length > 1 ? 's' : ''}</div>
      </div>
      <div>
        <span className="lab">Meilleure allure</span>
        <b className="num">{records.bestPace ? formatPaceMinPerKm(records.bestPace.pace) : '—'}</b>
        <div className="s">
          {records.bestPace
            ? `${formatDate(records.bestPace.session.date)} · ${
                parseFloat(String(records.bestPace.session.distance).replace(',', '.')) || 0
              } km`
            : '—'}
        </div>
      </div>
      <div>
        <span className="lab">Plus longue distance</span>
        <b className="num">
          {records.longestDistance ? records.longestDistance.dist.toFixed(2).replace('.', ',') : '—'}
          {records.longestDistance ? <i>km</i> : null}
        </b>
        <div className="s">
          {records.longestDistance
            ? `${formatDate(records.longestDistance.session.date)} · ${records.longestDistance.paceStr || '—'}`
            : '—'}
        </div>
      </div>
      <div>
        <span className="lab">Plus grosse semaine</span>
        <b className="num">
          {highlights.bestWeek ? String(highlights.bestWeek.km).replace('.', ',') : '—'}
          {highlights.bestWeek ? <i>km</i> : null}
        </b>
        <div className="s">{highlights.bestWeek ? highlights.bestWeek.weekLabel : '—'}</div>
      </div>
    </section>
  );
}
