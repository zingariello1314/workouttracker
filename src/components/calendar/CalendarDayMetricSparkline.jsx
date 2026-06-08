import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

/**
 * Mini graphique ligne / aire pour FC ou stress (récap calendrier).
 */
export default function CalendarDayMetricSparkline({
  data,
  dataKey = 'value',
  color = '#ef4444',
  yDomain,
  unit = '',
  height = 200
}) {
  const chartData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.map((d, i) => ({
      ...d,
      value: d[dataKey] ?? d.bpm ?? d.level ?? 0,
      idx: i
    }));
  }, [data, dataKey]);

  if (chartData.length < 2) return null;

  const domain = yDomain || ['auto', 'auto'];

  return (
    <div className="rounded-xl border border-slate-700/60 bg-black/80 p-3" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`calSpark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis domain={domain} tick={{ fill: '#94a3b8', fontSize: 10 }} width={36} />
          <Tooltip
            contentStyle={{
              background: '#0a0a0a',
              border: '1px solid #475569',
              borderRadius: 8,
              fontSize: 12
            }}
            formatter={(v) => [`${v}${unit}`, '']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={`url(#calSpark-${color.replace('#', '')})`}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
