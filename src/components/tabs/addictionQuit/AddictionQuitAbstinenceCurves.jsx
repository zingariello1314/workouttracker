import React, { useMemo, useCallback } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import Card, { CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { buildAbstinenceCurveSeries } from '../../../utils/addictionQuitAbstinenceChart';
import { resolvePeriodMilestoneLabel } from '../../../utils/addictionQuitPeriodMilestones';

function formatDayTick(dateKey, isFr) {
  const d = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateKey;
  return d.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' });
}

function TrackMilestoneDot({ cx, cy, payload, stroke, healthKey, periodKey }) {
  if (cx == null || cy == null) return false;
  const health = payload?.[healthKey];
  const period = payload?.[periodKey];
  const hasH = health?.length > 0;
  const hasP = period?.length > 0;
  if (!hasH && !hasP) return false;
  return (
    <g>
      {hasP ? (
        <rect
          x={cx - 5}
          y={cy - 5}
          width={10}
          height={10}
          rx={1}
          transform={`rotate(45 ${cx} ${cy})`}
          fill="#fbbf24"
          stroke="#451a03"
          strokeWidth={1}
          opacity={0.95}
        />
      ) : null}
      {hasH ? (
        <circle
          cx={cx}
          cy={cy}
          r={hasP ? 3 : 4}
          fill={stroke}
          stroke="#0f172a"
          strokeWidth={1}
        />
      ) : null}
    </g>
  );
}

export default function AddictionQuitAbstinenceCurves({ aq, journalScope, nowTick, t, isFr }) {
  const data = useMemo(
    () => buildAbstinenceCurveSeries({ aq, journalScope, nowMs: nowTick }),
    [aq, journalScope, nowTick]
  );

  const hasSeries = useMemo(
    () => data.some((r) => r.pctCig != null || r.pctThc != null),
    [data]
  );

  const tooltipContent = useCallback(
    ({ active, payload }) => {
      if (!active || !payload?.length) return null;
      const p = payload[0]?.payload;
      if (!p) return null;

      const lines = [
        { key: 'cig', label: t('addictionQuit.abstinenceLegendCig'), raw: p.pctCig, show: p.pctCigShow, craving: p.cravingCig },
        { key: 'thc', label: t('addictionQuit.abstinenceLegendThc'), raw: p.pctThc, show: p.pctThcShow, craving: p.cravingThc },
        { key: 'mix', label: t('addictionQuit.abstinenceLegendMix'), raw: p.pctMix, show: p.pctMixShow, craving: p.cravingCig || p.cravingThc },
      ];

      return (
        <div className="rounded-lg border border-[#0F4C5C]/55 bg-black px-3 py-2 text-xs text-teal-50 shadow-lg">
          <div className="font-semibold text-teal-100">{p.dateKey}</div>
          <ul className="mt-2 space-y-1">
            {lines.map((row) => {
              if (row.raw == null) return null;
              return (
                <li key={row.key} className="text-teal-100/90">
                  <span className="text-teal-700">{row.label}:</span>{' '}
                  {row.craving ? (
                    <>
                      <span className="text-sky-200/95">0 %</span>
                      <span className="text-teal-800"> ({Math.round(row.raw)} %)</span>
                    </>
                  ) : (
                    <span>{Math.round(row.raw)} %</span>
                  )}
                </li>
              );
            })}
          </ul>
          {(p.milestonesCig?.length || p.milestonesThc?.length) ? (
            <div className="mt-2 border-t border-[#0F4C5C]/40 pt-2 text-[11px] text-emerald-200/90">
              <div className="font-semibold text-teal-700">{t('addictionQuit.abstinenceTooltipMilestones')}</div>
              {p.milestonesCig?.length ? (
                <div className="mt-1 text-cyan-100/90">
                  {p.milestonesCig.map((lab, i) => (
                    <div key={`c${i}`}>{lab}</div>
                  ))}
                </div>
              ) : null}
              {p.milestonesThc?.length ? (
                <div className="mt-1 text-sky-200/90">
                  {p.milestonesThc.map((lab, i) => (
                    <div key={`t${i}`}>{lab}</div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {(p.periodMetaCig?.length || p.periodMetaThc?.length) ? (
            <div className="mt-2 border-t border-[#0F4C5C]/40 pt-2 text-[11px] text-sky-100/95">
              <div className="font-semibold text-teal-700">{t('addictionQuit.abstinenceTooltipPeriodMilestones')}</div>
              {p.periodMetaCig?.length ? (
                <div className="mt-1 text-sky-50/95">
                  {p.periodMetaCig.map((meta, i) => (
                    <div key={`pc${i}`}>{resolvePeriodMilestoneLabel(meta, t)}</div>
                  ))}
                </div>
              ) : null}
              {p.periodMetaThc?.length ? (
                <div className="mt-1 text-sky-100/90">
                  {p.periodMetaThc.map((meta, i) => (
                    <div key={`pt${i}`}>{resolvePeriodMilestoneLabel(meta, t)}</div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {(p.notesMix || p.notesCig || p.notesThc) && (p.cravingCig || p.cravingThc) ? (
            <div className="mt-2 border-t border-[#0F4C5C]/40 pt-2 text-[11px] text-teal-100">
              <div className="font-semibold text-teal-700">{t('addictionQuit.abstinenceTooltipNotes')}</div>
              <p className="mt-1 whitespace-pre-wrap">{p.notesMix || [p.notesCig, p.notesThc].filter(Boolean).join(' · ')}</p>
            </div>
          ) : null}
        </div>
      );
    },
    [t]
  );

  if (!hasSeries) {
    return (
      <Card variant="sport">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-white">{t('addictionQuit.abstinenceChartTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-teal-800">{t('addictionQuit.abstinenceEmpty')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="sport">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-white">{t('addictionQuit.abstinenceChartTitle')}</CardTitle>
        <p className="text-xs text-teal-800">{t('addictionQuit.abstinenceChartDesc')}</p>
        <p className="mt-1 text-[10px] text-teal-900">{t('addictionQuit.abstinenceChartLegendDots')}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[240px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,76,92,0.45)" opacity={0.6} />
              <XAxis
                dataKey="dateKey"
                tick={{ fill: '#5eead4', fontSize: 10 }}
                tickFormatter={(v) => formatDayTick(v, isFr)}
                minTickGap={24}
              />
              <YAxis
                domain={[0, 100]}
                width={36}
                tick={{ fill: '#5eead4', fontSize: 10 }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={tooltipContent} />
              <Legend
                wrapperStyle={{ fontSize: 11, color: '#99f6e4' }}
                formatter={(value) => <span className="text-teal-200">{value}</span>}
              />
              <Line
                type="monotone"
                name={t('addictionQuit.abstinenceLegendCig')}
                dataKey="pctCigShow"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={(props) => (
                  <TrackMilestoneDot
                    {...props}
                    stroke="#22d3ee"
                    healthKey="milestonesCig"
                    periodKey="periodMetaCig"
                  />
                )}
                activeDot={{ r: 6 }}
                connectNulls={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                name={t('addictionQuit.abstinenceLegendThc')}
                dataKey="pctThcShow"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={(props) => (
                  <TrackMilestoneDot
                    {...props}
                    stroke="#38bdf8"
                    healthKey="milestonesThc"
                    periodKey="periodMetaThc"
                  />
                )}
                activeDot={{ r: 6 }}
                connectNulls={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                name={t('addictionQuit.abstinenceLegendMix')}
                dataKey="pctMixShow"
                stroke="#e2e8f0"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                dot={false}
                activeDot={{ r: 5 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-teal-800">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-cyan-400 ring-1 ring-black" aria-hidden />
            {t('addictionQuit.abstinenceDotHealth')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rotate-45 bg-sky-500 ring-1 ring-black"
              aria-hidden
            />
            {t('addictionQuit.abstinenceDotPeriod')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
