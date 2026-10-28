import React from 'react';

/** Garmin + sommeil uniquement — les défis passent dans CoachVisionPanel (.df). */
export default function RecapDenseInsightsPanel({ denseAnalytics, periodLabel }) {
  if (!denseAnalytics) return null;

  const { garminCalendar, sleepCorrelations } = denseAnalytics;
  const hasGarmin = garminCalendar?.totalSessions > 0;
  const hasSleep = sleepCorrelations?.length > 0;

  if (!hasGarmin && !hasSleep) return null;

  return (
    <section className="bx dense-cal">
      <h3>
        Calendrier · récup
        {periodLabel ? <i>{periodLabel}</i> : null}
      </h3>
      <div className="tiles">
        {hasGarmin ? (
          <div className="ok">
            <i>Garmin calendrier</i>
            <b>
              {garminCalendar.totalSessions}
              <small> activité(s)</small>
            </b>
            <span>
              ~{garminCalendar.totalMinutes} min · {garminCalendar.summaryLine}
            </span>
          </div>
        ) : null}
        {hasSleep ? (
          <div className="ok">
            <i>Sommeil → performance</i>
            <ul className="sleep-list">
              {sleepCorrelations.map((c) => (
                <li key={c.exerciseId}>
                  <b>{c.name}</b> : ~{c.shortAvg} reps (nuits &lt;6,5 h) vs ~{c.okAvg} reps (≥7 h) — −
                  {c.dropPct} %
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
