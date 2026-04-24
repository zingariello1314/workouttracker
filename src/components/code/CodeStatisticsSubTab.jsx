import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useGitHubDashboard } from '../../hooks/useGitHubDashboard';
import { loadCodeJournalEntriesAsync } from '../../services/code/codeJournalIDB';

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

function isoWeekKeyFromYmd(ymd) {
  const [y, m, d] = String(ymd || '').split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() + 3 - dayNum);
  const isoYear = date.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() + 3 - firstDayNum);
  const week = 1 + Math.round((date - firstThursday) / (7 * 24 * 3600 * 1000));
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

export default function CodeStatisticsSubTab() {
  const { currentUser, isAuthenticated } = useAuth();
  const userId = currentUser?.id || 'main';
  const token = currentUser?.github?.accessToken;
  const login = currentUser?.github?.login;
  const connected = !!(isAuthenticated && token && login);
  const gh = useGitHubDashboard(token, connected);
  const [journalEntries, setJournalEntries] = useState([]);

  const points = useMemo(() => toChartPoints(gh.yearWeeks), [gh.yearWeeks]);
  const pointsWithSma = useMemo(
    () =>
      points.map((p, idx) => {
        const from = Math.max(0, idx - 6);
        const window = points.slice(from, idx + 1);
        const sum = window.reduce((acc, row) => acc + row.contributions, 0);
        return { ...p, sma7: sum / window.length };
      }),
    [points],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await loadCodeJournalEntriesAsync(userId);
        if (!cancelled) setJournalEntries(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setJournalEntries([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const metrics = useMemo(() => {
    const byDay = new Map(points.map((p) => [p.date, p.contributions]));
    const sortedDates = points.map((p) => p.date).sort();
    const streakRuns = [];
    let run = 0;
    for (const day of sortedDates) {
      const c = byDay.get(day) || 0;
      if (c > 0) run += 1;
      else if (run > 0) {
        streakRuns.push(run);
        run = 0;
      }
    }
    if (run > 0) streakRuns.push(run);
    const recordStreak = streakRuns.length ? Math.max(...streakRuns) : 0;
    const currentStreak = (() => {
      let r = 0;
      for (let i = sortedDates.length - 1; i >= 0; i -= 1) {
        if ((byDay.get(sortedDates[i]) || 0) > 0) r += 1;
        else break;
      }
      return r;
    })();
    const resumes = Math.max(0, streakRuns.length - 1);

    const weekLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const weeklyDistribution = weekLabels.map((label) => ({ label, value: 0 }));
    for (const p of points) {
      const [y, m, d] = p.date.split('-').map(Number);
      const w = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
      weeklyDistribution[w].value += p.contributions;
    }

    const hourlyBuckets = [
      { label: '00h-06h', from: 0, to: 6, value: 0 },
      { label: '06h-12h', from: 6, to: 12, value: 0 },
      { label: '12h-18h', from: 12, to: 18, value: 0 },
      { label: '18h-24h', from: 18, to: 24, value: 0 },
    ];
    for (const entry of journalEntries) {
      if (!entry?.createdAt) continue;
      const dt = new Date(entry.createdAt);
      if (Number.isNaN(dt.getTime())) continue;
      const h = dt.getHours();
      const bucket = hourlyBuckets.find((b) => h >= b.from && h < b.to);
      if (bucket) bucket.value += 1;
    }
    const dominantHourBucket = hourlyBuckets.reduce((best, cur) => (cur.value > best.value ? cur : best), hourlyBuckets[0]);

    const topDays = [...points]
      .sort((a, b) => b.contributions - a.contributions || String(a.date).localeCompare(String(b.date)))
      .slice(0, 5);
    const weekTotals = new Map();
    for (const p of points) {
      const wk = isoWeekKeyFromYmd(p.date);
      if (!wk) continue;
      weekTotals.set(wk, (weekTotals.get(wk) || 0) + p.contributions);
    }
    const topWeeks = [...weekTotals.entries()]
      .map(([week, total]) => ({ week, total }))
      .sort((a, b) => b.total - a.total || a.week.localeCompare(b.week))
      .slice(0, 5);

    const last7 = points.slice(-7);
    const prev7 = points.slice(-14, -7);
    const avg = (arr) => (arr.length ? arr.reduce((s, x) => s + x.contributions, 0) / arr.length : 0);
    const avgLast7 = avg(last7);
    const avgPrev7 = avg(prev7);
    const trendDelta = avgLast7 - avgPrev7;
    const trendLabel = trendDelta > 0.2 ? 'hausse' : trendDelta < -0.2 ? 'baisse' : 'stable';

    const now = new Date();
    const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const monthPoints = points.filter((p) => p.date.startsWith(currentMonth));
    const monthTotal = monthPoints.reduce((s, p) => s + p.contributions, 0);
    const monthGoal = 300;
    const daysElapsed = now.getUTCDate();
    const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
    const projectedMonthTotal = daysElapsed > 0 ? Math.round((monthTotal / daysElapsed) * daysInMonth) : 0;
    const monthGoalPercent = Math.min(100, (monthTotal / monthGoal) * 100);

    const journalDays = new Set(
      journalEntries
        .map((e) => String(e?.githubDayUtc || e?.createdAt || '').slice(0, 10))
        .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)),
    );
    let withJournalDays = 0;
    let withoutJournalDays = 0;
    let withJournalContrib = 0;
    let withoutJournalContrib = 0;
    for (const p of points) {
      if (journalDays.has(p.date)) {
        withJournalDays += 1;
        withJournalContrib += p.contributions;
      } else {
        withoutJournalDays += 1;
        withoutJournalContrib += p.contributions;
      }
    }
    const journalCorrelation = {
      withJournalDays,
      withoutJournalDays,
      avgWithJournal: withJournalDays ? withJournalContrib / withJournalDays : 0,
      avgWithoutJournal: withoutJournalDays ? withoutJournalContrib / withoutJournalDays : 0,
    };

    const distribution = [
      { bucket: '0', count: 0 },
      { bucket: '1-2', count: 0 },
      { bucket: '3-5', count: 0 },
      { bucket: '6-10', count: 0 },
      { bucket: '10+', count: 0 },
    ];
    for (const p of points) {
      const c = p.contributions;
      if (c === 0) distribution[0].count += 1;
      else if (c <= 2) distribution[1].count += 1;
      else if (c <= 5) distribution[2].count += 1;
      else if (c <= 10) distribution[3].count += 1;
      else distribution[4].count += 1;
    }

    return {
      recordStreak,
      currentStreak,
      resumes,
      weeklyDistribution,
      hourlyBuckets,
      dominantHourBucket,
      topDays,
      topWeeks,
      trendDelta,
      trendLabel,
      avgLast7,
      avgPrev7,
      monthTotal,
      monthGoal,
      projectedMonthTotal,
      monthGoalPercent,
      journalCorrelation,
      distribution,
    };
  }, [points, journalEntries]);

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
        <div className="space-y-4">
          <section className="rounded-xl border border-rose-500/35 bg-black/45 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-white">Contributions / jour</h2>
              <span className="text-xs text-rose-200/80">
                {gh.heatmapMode === 'rolling' ? '12 derniers mois' : `Année ${gh.civilYear}`}
              </span>
            </div>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pointsWithSma} margin={{ top: 16, right: 18, left: 0, bottom: 8 }}>
                  <XAxis dataKey="date" tick={{ fill: '#fda4af', fontSize: 11 }} minTickGap={24} tickFormatter={(value) => formatDateFr(value)} />
                  <YAxis tick={{ fill: '#fda4af', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(2,6,23,0.95)',
                      border: '1px solid rgba(244,63,94,0.45)',
                      borderRadius: 10,
                      color: '#ffe4e6',
                    }}
                    formatter={(value, name) => [
                      name === 'sma7' ? Number(value || 0).toFixed(2) : `${Number(value) || 0} contribution(s)`,
                      name === 'sma7' ? 'Moyenne glissante 7j' : 'Activité',
                    ]}
                    labelFormatter={(label) => `Date UTC : ${formatDateFr(label)}`}
                  />
                  <Line type="monotone" dataKey="contributions" stroke="#f43f5e" strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: '#fb7185', strokeWidth: 1, fill: '#fb7185' }} />
                  <Line type="monotone" dataKey="sma7" stroke="#fda4af" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-rose-500/35 bg-black/45 p-4 text-sm text-rose-100">
              <h3 className="mb-2 text-base font-semibold text-white">Streak avancée</h3>
              <p>Record : <strong>{metrics.recordStreak}</strong> jours</p>
              <p>Streak actuelle : <strong>{metrics.currentStreak}</strong> jours</p>
              <p>Reprises : <strong>{metrics.resumes}</strong></p>
            </div>
            <div className="rounded-xl border border-rose-500/35 bg-black/45 p-4 text-sm text-rose-100 md:col-span-2">
              <h3 className="mb-2 text-base font-semibold text-white">Tendance</h3>
              <p>Moyenne 7j : <strong>{metrics.avgLast7.toFixed(2)}</strong> — période précédente : <strong>{metrics.avgPrev7.toFixed(2)}</strong></p>
              <p>Indicateur : <strong className="text-rose-200">{metrics.trendLabel}</strong> ({metrics.trendDelta >= 0 ? '+' : ''}{metrics.trendDelta.toFixed(2)} contrib/jour)</p>
            </div>
          </section>

          <section className="rounded-xl border border-rose-500/35 bg-black/45 p-4">
            <h3 className="mb-2 text-base font-semibold text-white">Répartition hebdo (lun → dim)</h3>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.weeklyDistribution}>
                  <XAxis dataKey="label" tick={{ fill: '#fda4af', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#fda4af', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'rgba(2,6,23,0.95)', border: '1px solid rgba(244,63,94,0.45)', borderRadius: 10 }} formatter={(v) => [`${v} contribution(s)`, 'Total']} />
                  <Bar dataKey="value" fill="#e11d48" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-rose-500/35 bg-black/45 p-4">
              <h3 className="mb-2 text-base font-semibold text-white">Heat productivité horaire (journal)</h3>
              <p className="mb-2 text-xs text-rose-200/80">Tranche dominante : <strong>{metrics.dominantHourBucket?.label || '—'}</strong></p>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.hourlyBuckets}>
                    <XAxis dataKey="label" tick={{ fill: '#fda4af', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#fda4af', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: 'rgba(2,6,23,0.95)', border: '1px solid rgba(244,63,94,0.45)', borderRadius: 10 }} formatter={(v) => [`${v} entrée(s)`, 'Journal']} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {metrics.hourlyBuckets.map((row, idx) => (
                        <Cell key={row.label} fill={idx === 3 ? '#fb7185' : '#e11d48'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-xl border border-rose-500/35 bg-black/45 p-4 text-sm text-rose-100">
              <h3 className="mb-2 text-base font-semibold text-white">Top jours / top semaines</h3>
              <div className="mb-3">
                <p className="mb-1 text-xs uppercase tracking-wide text-rose-300/90">Top 5 jours</p>
                <ul className="space-y-1">
                  {metrics.topDays.map((d) => (
                    <li key={d.date} className="flex items-center justify-between">
                      <span>{formatDateFr(d.date)}</span>
                      <strong>{d.contributions}</strong>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-rose-300/90">Top 5 semaines</p>
                <ul className="space-y-1">
                  {metrics.topWeeks.map((w) => (
                    <li key={w.week} className="flex items-center justify-between">
                      <span>{w.week}</span>
                      <strong>{w.total}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-rose-500/35 bg-black/45 p-4 text-sm text-rose-100">
              <h3 className="mb-2 text-base font-semibold text-white">Objectif mensuel</h3>
              <p>Objectif : <strong>{metrics.monthGoal}</strong> contributions</p>
              <p>Actuel : <strong>{metrics.monthTotal}</strong> — Projection fin de mois : <strong>{metrics.projectedMonthTotal}</strong></p>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full border border-rose-500/40 bg-black">
                <div className="h-full bg-gradient-to-r from-rose-700 to-fuchsia-600" style={{ width: `${Math.max(0, Math.min(100, metrics.monthGoalPercent))}%` }} />
              </div>
              <p className="mt-1 text-xs text-rose-200/80">{metrics.monthGoalPercent.toFixed(1)} % de l’objectif</p>
            </div>
            <div className="rounded-xl border border-rose-500/35 bg-black/45 p-4 text-sm text-rose-100">
              <h3 className="mb-2 text-base font-semibold text-white">Corrélation journal ↔ contributions</h3>
              <p>Jours avec entrée journal : <strong>{metrics.journalCorrelation.withJournalDays}</strong> — moyenne : <strong>{metrics.journalCorrelation.avgWithJournal.toFixed(2)}</strong></p>
              <p>Jours sans entrée journal : <strong>{metrics.journalCorrelation.withoutJournalDays}</strong> — moyenne : <strong>{metrics.journalCorrelation.avgWithoutJournal.toFixed(2)}</strong></p>
            </div>
          </section>

          <section className="rounded-xl border border-rose-500/35 bg-black/45 p-4">
            <h3 className="mb-2 text-base font-semibold text-white">Distribution des contributions / jour</h3>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.distribution}>
                  <XAxis dataKey="bucket" tick={{ fill: '#fda4af', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#fda4af', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'rgba(2,6,23,0.95)', border: '1px solid rgba(244,63,94,0.45)', borderRadius: 10 }} formatter={(v) => [`${v} jour(s)`, 'Occurrences']} />
                  <Bar dataKey="count" fill="#be123c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
