import React from 'react';
import CoachMetricText from './CoachMetricText';

function kpiPct(value, note) {
  const fromVal = String(value || '').match(/([\d.,]+)\s*%/);
  if (fromVal) return Math.max(0, Math.min(100, parseFloat(fromVal[1].replace(',', '.'))));
  if (note && /^\d+\s*\/\s*\d+$/.test(String(note).trim())) {
    const [a, b] = String(note)
      .split('/')
      .map((x) => Number(x.trim()));
    if (b > 0) return Math.max(0, Math.min(100, (a / b) * 100));
  }
  return null;
}

function classifyPara(text, index) {
  const t = String(text || '');
  if (/dernière séance|a produit|en \d+\s*min/i.test(t)) return 'fa';
  if (/autour de toi|autour,|les \d+ derniers jours totalisent/i.test(t)) return 'ar';
  if (/tant qu'|on ne compare pas|on décrit l'attente/i.test(t)) return 'rl';
  if (/côté charge|groupe dominant|à surveiller/i.test(t)) return 'wn';
  if (index === 0) return 'ld';
  return '';
}

function ChallengeCard({ rows, periodLabel }) {
  if (!rows?.length) return null;
  return (
    <div className="df">
      <div className="l">◎ Défis</div>
      <h3>{periodLabel ? `Calendrier · récap · défis · ${periodLabel}` : 'Calendrier · récap · défis'}</h3>
      {rows.slice(0, 2).map((row) => {
        const rowPct = row.progressPct ?? 0;
        return (
          <React.Fragment key={row.id}>
            <div className="d">
              <div>
                <b>{row.title}</b>
                {row.type ? <small>{row.type}</small> : null}
              </div>
              <span>{row.status === 'completed' ? 'OK' : `${rowPct} %`}</span>
            </div>
            {row.status !== 'completed' ? (
              <div className="gz">
                <i style={{ '--w': `${Math.max(0, Math.min(100, rowPct))}%` }} />
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function CoachVisionPanel({
  report,
  fallbackText,
  periodLabel,
  challengeRows = []
}) {
  const kpis = report?.kpis || [];
  const lead = report?.lead;
  const sections = report?.sections || [];
  const paragraphs =
    report?.paragraphs?.length > 0
      ? report.paragraphs
      : report?.text
        ? report.text.split('\n\n').filter(Boolean)
        : fallbackText
          ? [fallbackText]
          : [];

  if (!paragraphs.length && !lead && !kpis.length && !sections.length) {
    return null;
  }

  const programSection = sections.find((s) => s.id === 'program');
  const otherSections = sections.filter((s) => s.id !== 'program');
  const useSections = sections.length > 0;

  return (
    <section>
      <div className="sh">
        <h2>Vision coach</h2>
        {periodLabel ? <span>{periodLabel}</span> : null}
      </div>
      <div className="cg">
        <div className="art">
          {lead ? (
            <p>
              <CoachMetricText text={lead} />
            </p>
          ) : null}

          {useSections
            ? otherSections.map((sec) => (
                <section key={sec.id} className="bk">
                  {sec.title ? <h4>{sec.title}</h4> : null}
                  {sec.bullets?.map((b, i) => {
                    const cls = classifyPara(b, i);
                    return (
                      <p key={i} className={cls || undefined}>
                        <CoachMetricText text={b} />
                      </p>
                    );
                  })}
                </section>
              ))
            : paragraphs.length > 0
              ? (() => {
                  const body = lead ? paragraphs : paragraphs.slice(1);
                  const head = lead ? null : paragraphs[0];
                  return (
                    <>
                      {head ? (
                        <p>
                          <CoachMetricText text={head} />
                        </p>
                      ) : null}
                      {body.length > 0 ? (
                        <section className="bk">
                          {body.map((para, i) => {
                            const cls = classifyPara(para, i);
                            return (
                              <p key={i} className={cls || undefined}>
                                <CoachMetricText text={para} />
                              </p>
                            );
                          })}
                        </section>
                      ) : null}
                    </>
                  );
                })()
              : null}

          {programSection ? (
            <section className="bk rec">
              {programSection.bullets?.map((b, i) => (
                <p key={i} className={i === 0 ? 'ld' : undefined}>
                  <CoachMetricText text={b} />
                </p>
              ))}
            </section>
          ) : null}
        </div>

        {kpis.length > 0 || challengeRows.length > 0 ? (
          <div className="side">
            {kpis.length > 0 ? (
              <div className="k2g">
                {kpis.map((k, index) => {
                  const pct = kpiPct(k.value, k.note);
                  return (
                    <div key={k.id} className={index === 0 ? 'kp e' : 'kp'}>
                      <i>{k.label}</i>
                      <b>{k.value}</b>
                      {k.note ? <span>{k.note}</span> : null}
                      {pct != null ? (
                        <div className="gz">
                          <i style={{ '--w': `${pct}%` }} />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
            <ChallengeCard rows={challengeRows} periodLabel={periodLabel} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
