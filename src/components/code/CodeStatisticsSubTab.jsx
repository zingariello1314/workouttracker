import { useMemo } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useGitHubDashboard } from '../../hooks/useGitHubDashboard';

function toChartPoints(weeks) {
  const points = [];
  for (const w of weeks || []) {
    for (const d of w?.contributionDays || []) {
      if (!d?.date) continue;
      points.push({
        date: d.date,
        contributions: Number(d.contributionCount) || 0,
      });
    }
  }
  return points.sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

function formatDateFr(isoYmd) {
  const [y, m, d] = String(isoYmd || '').split('-');
  if (!y || !m || !d) return String(isoYmd || '');
  return `${d}/${m}/${y}`;
}

export default function CodeStatisticsSubTab() {
  const { currentUser, isAuthenticated } = useAuth();
  const token = currentUser?.github?.accessToken;
  const login = currentUser?.github?.login;
  const connected = !!(isAuthenticated && token && login);
  const gh = useGitHubDashboard(token, connected);

  const points = useMemo(() => toChartPoints(gh.yearWeeks), [gh.yearWeeks]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      <header className="rounded-xl border border-rose-500/45 bg-black/60 px-4 py-4">
        <h1 className="text-2xl font-bold text-white">Statistiques Code</h1>
        <p className="mt-1 text-sm text-rose-200/80">
          Courbe des contributions journalières sur la période du calendrier Code.
        </p>
      </header>

      {!connected ? (
        <div className="rounded-xl border border-rose-500/35 bg-black/45 px-4 py-4 text-sm text-rose-100/90">
          Connecte GitHub pour afficher la courbe de contributions.
        </div>
      ) : null}

      {connected ? (
        <section className="rounded-xl border border-rose-500/35 bg-black/45 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-white">Contributions / jour</h2>
            <span className="text-xs text-rose-200/80">
              {gh.heatmapMode === 'rolling' ? '12 derniers mois' : `Année ${gh.civilYear}`}
            </span>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 16, right: 18, left: 0, bottom: 8 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#fda4af', fontSize: 11 }}
                  minTickGap={24}
                  tickFormatter={(value) => formatDateFr(value)}
                />
                <YAxis tick={{ fill: '#fda4af', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(2,6,23,0.95)',
                    border: '1px solid rgba(244,63,94,0.45)',
                    borderRadius: 10,
                    color: '#ffe4e6',
                  }}
                  formatter={(value) => [`${Number(value) || 0} contribution(s)`, 'Activité']}
                  labelFormatter={(label) => `Date UTC : ${formatDateFr(label)}`}
                />
                <Line
                  type="monotone"
                  dataKey="contributions"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: '#fb7185', strokeWidth: 1, fill: '#fb7185' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : null}
    </div>
  );
}
