import React from 'react';
import { useFormatters } from '../../../utils/translations/formatters-hook';
import { parseDurationToMinutes } from '../../../utils/calendarUtils';

function formatChallengeGoals(ch, t) {
  const parts = [];
  const gc = ch.goalCount != null && String(ch.goalCount).trim() !== '';
  const gd = ch.goalDuration != null && String(ch.goalDuration).trim() !== '';
  const gdist = ch.goalDistance != null && String(ch.goalDistance).trim() !== '';
  const gj = ch.goalJumps != null && String(ch.goalJumps).trim() !== '';
  if (gc) parts.push(t('recap.challenge.goalPushups', { n: ch.goalCount }));
  if (gd) parts.push(t('recap.challenge.goalDuration', { min: ch.goalDuration }));
  if (gdist) parts.push(t('recap.challenge.goalDistance', { km: ch.goalDistance }));
  if (gj) parts.push(t('recap.challenge.goalJumps', { n: ch.goalJumps }));
  return parts.length ? parts.join(' · ') : t('recap.challenge.noNumericGoal');
}

const RecapEnduranceDigestPanel = ({ digest, t }) => {
  const { formatDate } = useFormatters();
  const { perActivity, challenges } = digest || { perActivity: {}, challenges: [] };
  const activityKeys = ['running', 'jumprope', 'pushups', 'swimming', 'boxing'];

  const hasAnySession = activityKeys.some(
    (k) => perActivity[k] && perActivity[k].sessions && perActivity[k].sessions.length > 0
  );

  return (
    <section className="rounded-xl border border-slate-700/80 bg-slate-900/30 p-4 backdrop-blur-sm">
      <h2 className="text-sm font-semibold text-slate-200 mb-1">{t('recap.endurance.title')}</h2>
      <p className="text-xs text-slate-500 mb-4 leading-relaxed">{t('recap.endurance.intro')}</p>

      {!hasAnySession ? (
        <p className="text-sm text-slate-500">{t('recap.endurance.empty')}</p>
      ) : (
        <div className="space-y-6">
          {activityKeys.map((act) => {
            const block = perActivity[act];
            if (!block || !block.sessions.length) return null;
            const { sessions, totals } = block;
            return (
              <div key={act} className="border-t border-slate-700/60 pt-4 first:border-t-0 first:pt-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                  <h3 className="text-sm font-medium text-white">
                    {t(`recap.endurance.activity.${act}`)}
                  </h3>
                  <div className="text-[11px] text-slate-400 space-x-2">
                    {totals.minutes > 0 && (
                      <span>
                        {t('recap.endurance.sumMinutes', { m: Math.round(totals.minutes) })}
                      </span>
                    )}
                    {act === 'running' && totals.distanceKm > 0 && (
                      <span>
                        {t('recap.endurance.sumKm', {
                          km: totals.distanceKm < 10 ? totals.distanceKm.toFixed(1) : Math.round(totals.distanceKm)
                        })}
                      </span>
                    )}
                    {act === 'pushups' && totals.count > 0 && (
                      <span>{t('recap.endurance.sumPushups', { n: totals.count })}</span>
                    )}
                    {act === 'jumprope' && totals.jumps > 0 && (
                      <span>{t('recap.endurance.sumJumps', { n: totals.jumps })}</span>
                    )}
                    {totals.load > 0 && (
                      <span className="text-slate-500">
                        {t('recap.endurance.sumLoad', { n: Math.round(totals.load) })}
                      </span>
                    )}
                  </div>
                </div>
                <ul className="space-y-2">
                  {sessions.map((row, idx) => {
                    const s = row.raw;
                    const id = s.id != null ? String(s.id) : `${row.dateYmd}-${idx}`;
                    const dateLabel = formatDate(row.dateYmd);
                    const mins = row.minutes || parseDurationToMinutes(s.duration);

                    if (act === 'running') {
                      const rf = row.runningFactors;
                      const km =
                        rf && rf.distanceKm > 0
                          ? rf.distanceKm < 10
                            ? rf.distanceKm.toFixed(1)
                            : String(Math.round(rf.distanceKm))
                          : parseFloat(String(s.distance ?? '').replace(',', '.')) || 0;
                      const typeKey = rf?.type || s.type || 'endurance';
                      return (
                        <li
                          key={id}
                          className="rounded-md bg-slate-950/50 border border-slate-800/80 px-3 py-2 text-xs text-slate-300"
                        >
                          <span className="text-slate-400">{dateLabel}</span>
                          {s.time ? <span className="text-slate-600"> · {s.time}</span> : null}
                          <div className="mt-1 text-slate-200">
                            {km > 0 && <span>{t('recap.endurance.row.km', { km })} </span>}
                            {mins > 0 && <span>{t('recap.endurance.row.min', { m: Math.round(mins) })} </span>}
                            <span className="text-slate-500">
                              {t('recap.endurance.row.runType', { type: typeKey })}
                            </span>
                            {s.elevation ? (
                              <span className="text-slate-500">
                                {' '}
                                · D+ {String(s.elevation).replace(',', '.')} m
                              </span>
                            ) : null}
                            {s.avgHR ? (
                              <span className="text-slate-500"> · FC {s.avgHR}</span>
                            ) : null}
                          </div>
                          {s.notes ? (
                            <p className="mt-1 text-[11px] text-slate-500 italic line-clamp-2">{s.notes}</p>
                          ) : null}
                        </li>
                      );
                    }

                    if (act === 'jumprope') {
                      const jumps = Math.floor(Number(s.jumps) || 0);
                      return (
                        <li
                          key={id}
                          className="rounded-md bg-slate-950/50 border border-slate-800/80 px-3 py-2 text-xs text-slate-300"
                        >
                          <span className="text-slate-400">{dateLabel}</span>
                          <div className="mt-1 text-slate-200">
                            {mins > 0 && <span>{t('recap.endurance.row.min', { m: Math.round(mins) })} </span>}
                            {jumps > 0 && <span>{t('recap.endurance.row.jumps', { n: jumps })} </span>}
                            {s.type ? (
                              <span className="text-slate-500">
                                {t('recap.endurance.row.ropeType', { type: String(s.type) })}
                              </span>
                            ) : null}
                          </div>
                          {s.notes ? (
                            <p className="mt-1 text-[11px] text-slate-500 italic line-clamp-2">{s.notes}</p>
                          ) : null}
                        </li>
                      );
                    }

                    if (act === 'pushups') {
                      const count = Math.floor(Number(s.count ?? s.reps) || 0);
                      return (
                        <li
                          key={id}
                          className="rounded-md bg-slate-950/50 border border-slate-800/80 px-3 py-2 text-xs text-slate-300"
                        >
                          <span className="text-slate-400">{dateLabel}</span>
                          <div className="mt-1 text-slate-200">
                            {count > 0 && <span>{t('recap.endurance.row.pushups', { n: count })} </span>}
                            {mins > 0 && <span>{t('recap.endurance.row.min', { m: Math.round(mins) })}</span>}
                          </div>
                          {s.notes ? (
                            <p className="mt-1 text-[11px] text-slate-500 italic line-clamp-2">{s.notes}</p>
                          ) : null}
                        </li>
                      );
                    }

                    return (
                      <li
                        key={id}
                        className="rounded-md bg-slate-950/50 border border-slate-800/80 px-3 py-2 text-xs text-slate-300"
                      >
                        <span className="text-slate-400">{dateLabel}</span>
                        <div className="mt-1 text-slate-200">
                          {mins > 0 && <span>{t('recap.endurance.row.min', { m: Math.round(mins) })}</span>}
                          {act === 'swimming' && s.swimType ? (
                            <span className="text-slate-500"> · {String(s.swimType)}</span>
                          ) : null}
                        </div>
                        {s.notes ? (
                          <p className="mt-1 text-[11px] text-slate-500 italic line-clamp-2">{s.notes}</p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 border-t border-slate-700/60 pt-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-2">{t('recap.challenges.title')}</h3>
        {!challenges.length ? (
          <p className="text-xs text-slate-500">{t('recap.challenges.empty')}</p>
        ) : (
          <ul className="space-y-2">
            {challenges.map((ch) => {
              const cid = ch.id != null ? String(ch.id) : ch.name;
              const act = ch.activityType || 'pushups';
              return (
                <li
                  key={cid}
                  className="rounded-md border border-slate-800/80 bg-slate-950/40 px-3 py-2 text-xs"
                >
                  <p className="font-medium text-slate-100">{ch.name || t('recap.challenge.unnamed')}</p>
                  <p className="text-slate-500 mt-0.5">
                    {t('recap.challenge.activity', { type: t(`recap.endurance.activity.${act}`, act) })}
                    {ch.status ? (
                      <span>
                        {' '}
                        · {t('recap.challenge.status', { s: ch.status })}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-slate-400 mt-1">{formatChallengeGoals(ch, t)}</p>
                  {ch.lastCompletedDate ? (
                    <p className="text-[11px] text-emerald-500/90 mt-1">
                      {t('recap.challenge.lastDone', { date: formatDate(normalizeChallengeDate(ch.lastCompletedDate)) })}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};

function normalizeChallengeDate(d) {
  if (!d) return '';
  if (typeof d === 'string' && d.includes('T')) return d.split('T')[0];
  return d;
}

export default RecapEnduranceDigestPanel;
