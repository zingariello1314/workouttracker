import React from 'react';
import CoachMetricText from './CoachMetricText';

function StructureKpiCard({ label, value, badge, tone }) {
  const warn = tone === 'warn' || tone === 'bad';
  return (
    <div className={warn ? 'w' : 'ok'}>
      <i>{label}</i>
      <b>{value}</b>
      {badge ? <u className={warn ? 'w' : undefined}>{String(badge).toUpperCase()}</u> : null}
    </div>
  );
}

function MetricBar({ label, display, widthPct, colorVar, split }) {
  return (
    <div className="ml" style={colorVar ? { '--c': colorVar } : undefined}>
      <div className="r">
        <span>{label}</span>
        <span>{display}</span>
      </div>
      {split ? (
        <div className="bar sp">
          <i style={{ width: `${split.a}%`, '--c': 'var(--a1)' }} />
          <i style={{ width: `${split.b}%`, '--c': 'var(--a2)' }} />
        </div>
      ) : (
        <div className="bar">
          <i style={{ width: `${Math.max(0, Math.min(100, widthPct || 0))}%` }} />
        </div>
      )}
    </div>
  );
}

export default function ProgramStructurePanel({ report, dowRows = [], periodLabel }) {
  if (!report) return null;

  const { title, intro, legAnalysis, ratioCommentary, bars, kpiCards, priority, statsRow } = report;

  return (
    <section>
      <div className="sh">
        <h2>Structure du programme</h2>
        {title ? <span className="badge">{title}</span> : null}
        {periodLabel ? <span>{periodLabel}</span> : null}
      </div>

      <div className="pg2">
        <div className="col">
          <div className="bx">
            {(intro || ratioCommentary) && (
              <p>
                {intro ? (
                  <span className="ld">
                    <CoachMetricText text={intro} variant="v" />
                  </span>
                ) : null}
                {ratioCommentary ? (
                  <span className="rs">
                    <CoachMetricText text={ratioCommentary} variant="v" />
                  </span>
                ) : null}
              </p>
            )}
            {legAnalysis ? (
              <p>
                <span className="ld">
                  <CoachMetricText text={legAnalysis} variant="v" />
                </span>
              </p>
            ) : null}
          </div>

          {priority?.text ? (
            <div className="pr">
              <span>!</span>
              <div>
                <b>{priority.title || 'Priorité structurelle'}</b>
                <p>
                  <span className="ld">
                    <CoachMetricText text={priority.text} variant="v" />
                  </span>
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="col">
          {bars ? (
            <div className="bx">
              <div className="duo">
                <div className="a">
                  <span>Push · {bars.push.pct} %</span>
                  <b>
                    {bars.push.reps}
                    <u>reps</u>
                  </b>
                </div>
                <div className="b">
                  <span>Pull · {bars.pull.pct} %</span>
                  <b>
                    {bars.pull.reps}
                    <u>reps</u>
                  </b>
                </div>
              </div>
              {bars.ratio != null ? (
                <div className="ratio">
                  Ratio push/pull coché : {bars.ratio}
                  {bars.planRatio != null ? ` · plan ~${bars.planRatio}` : ''}
                </div>
              ) : null}

              {kpiCards?.length > 0 ? (
                <div className="tiles">
                  {kpiCards.map((c) => (
                    <StructureKpiCard key={c.id} {...c} />
                  ))}
                </div>
              ) : null}
            </div>
          ) : kpiCards?.length > 0 ? (
            <div className="bx">
              <div className="tiles">
                {kpiCards.map((c) => (
                  <StructureKpiCard key={c.id} {...c} />
                ))}
              </div>
            </div>
          ) : null}

          {(dowRows.length > 0 || statsRow) && (
            <div className="bx">
              {dowRows.length > 0 ? (
                <>
                  <h3>Complétion par jour de semaine</h3>
                  {dowRows.map((d) => (
                    <MetricBar
                      key={d.key}
                      label={d.label}
                      display={d.display}
                      widthPct={d.value}
                      colorVar="var(--a5)"
                    />
                  ))}
                </>
              ) : null}

              {statsRow ? (
                <>
                  <h3 style={dowRows.length > 0 ? { marginTop: 18 } : undefined}>
                    Push / pull · adhérence · course
                  </h3>
                  {statsRow.pushPullRatio != null && statsRow.pushPct != null ? (
                    <MetricBar
                      label="Push / pull"
                      display={`${statsRow.pushPullRatio} — ${statsRow.pushPct}% / ${statsRow.pullPct}%`}
                      split={{ a: statsRow.pushPct, b: statsRow.pullPct }}
                      colorVar="var(--a1)"
                    />
                  ) : null}
                  {statsRow.adherencePct != null ? (
                    <MetricBar
                      label="Adhérence exos"
                      display={`${statsRow.adherencePct} %`}
                      widthPct={statsRow.adherencePct}
                      colorVar="var(--d)"
                    />
                  ) : null}
                  {statsRow.globalPct != null && statsRow.globalPct !== statsRow.adherencePct ? (
                    <MetricBar
                      label="Programme complet"
                      display={`${statsRow.globalPct} %`}
                      widthPct={statsRow.globalPct}
                      colorVar="var(--a3)"
                    />
                  ) : null}
                  {statsRow.runningKm >= 1 ? (
                    <MetricBar
                      label="Course période"
                      display={`${Math.round(statsRow.runningKm * 10) / 10} km${
                        statsRow.runningSessions ? ` · ${statsRow.runningSessions} sortie(s)` : ''
                      }`}
                      widthPct={Math.min(100, statsRow.runningKm * 5)}
                      colorVar="var(--a5)"
                    />
                  ) : null}
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
