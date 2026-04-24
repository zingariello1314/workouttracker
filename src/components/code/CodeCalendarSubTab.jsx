import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardGitHubCodeModule from '../dashboard/DashboardGitHubCodeModule';
import CodeContributionsTrophiesPanel from './CodeContributionsTrophiesPanel';
import {
  fetchViewerMeta,
  fetchMultiYearContributions,
  contributionYearSpanUtc,
  contributionTierHistogramFromWeeks,
  contributionStreaksFromWeeks,
} from '../../utils/githubContributions';

export default function CodeCalendarSubTab() {
  const { currentUser, isAuthenticated } = useAuth();
  const token = currentUser?.github?.accessToken;
  const login = currentUser?.github?.login;
  const connected = !!(isAuthenticated && token && login);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (!connected || !token) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const v = await fetchViewerMeta(token);
        const years = contributionYearSpanUtc(v?.createdAt);
        const multi = await fetchMultiYearContributions(token, years);
        if (!cancelled) setDetail(multi);
      } catch {
        if (!cancelled) setDetail(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connected, token, login]);

  const allWeeks = useMemo(() => detail?.years?.flatMap((y) => y.weeks || []) || [], [detail]);
  const hist = useMemo(
    () => (allWeeks.length ? contributionTierHistogramFromWeeks(allWeeks) : [0, 0, 0, 0, 0]),
    [allWeeks],
  );
  const streaks = useMemo(
    () =>
      allWeeks.length
        ? contributionStreaksFromWeeks(allWeeks)
        : { longest: 0, current: 0, activeDaysTotal: 0 },
    [allWeeks],
  );

  const yearRows = useMemo(() => {
    if (!detail?.perYearTotals) return [];
    return Object.entries(detail.perYearTotals).sort(([a], [b]) => Number(b) - Number(a));
  }, [detail]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-6">
      <header className="rounded-xl border border-rose-500/45 bg-black/60 px-4 py-4">
        <h1 className="text-2xl font-bold text-white">Calendrier & activité GitHub</h1>
        <p className="mt-1 text-sm text-rose-200/80">
          Statistiques agrégées sur tout ton historique profil, puis calendrier (12 mois ou année civile). GitHub ne
          expose pas le nombre de lignes modifiées dans ce graphe public — seulement les contributions comptabilisées
          sur le profil.
        </p>
      </header>

      <DashboardGitHubCodeModule variant="embedded" calendarHeroFirst heatmapAccent="rose" />

      {connected && detail?.stats ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-rose-500/40 bg-black/50 p-4 text-sm text-rose-100/90">
            <h2 className="mb-3 text-base font-semibold text-white">Séries & volume</h2>
            <ul className="space-y-2">
              <li>
                Série la plus longue : <strong className="text-white">{streaks.longest}</strong> jours consécutifs avec
                activité
              </li>
              <li>
                Série « en cours » (fin = dernier jour actif) :{' '}
                <strong className="text-white">{streaks.current}</strong> jours
              </li>
              <li>
                Jours avec au moins une contribution :{' '}
                <strong className="text-white">{streaks.activeDaysTotal.toLocaleString('fr-FR')}</strong>
              </li>
              <li>
                Total contributions (agrégat) :{' '}
                <strong className="text-white">{detail.stats.totalCommits?.toLocaleString('fr-FR')}</strong>
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-rose-500/40 bg-black/50 p-4 text-sm text-rose-100/90">
            <h2 className="mb-2 text-base font-semibold text-white">Répartition par palier d’intensité</h2>
            <p className="mb-3 text-xs text-slate-500">
              Chaque case du calendrier est classée 0–4 selon le quartile d’activité ce jour-là (comme sur GitHub).
            </p>
            <ul className="flex flex-wrap gap-2">
              {hist.map((n, i) => (
                <li key={i} className="rounded-lg border border-rose-500/35 bg-black/40 px-3 py-1.5">
                  Palier {i} : <strong className="text-white">{n.toLocaleString('fr-FR')}</strong> jours
                </li>
              ))}
            </ul>
          </div>

          {yearRows.length > 0 ? (
            <div className="rounded-xl border border-rose-500/40 bg-black/50 p-4 lg:col-span-2">
              <h2 className="mb-3 text-base font-semibold text-white">Contributions par année civile</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-rose-100/90">
                  <thead>
                    <tr className="border-b border-rose-500/35 text-rose-300">
                      <th className="py-2 pr-4">Année</th>
                      <th className="py-2">Total (API)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearRows.map(([y, t]) => (
                      <tr key={y} className="border-b border-rose-500/15">
                        <td className="py-2 pr-4 font-medium text-white">{y}</td>
                        <td className="py-2">{Number(t).toLocaleString('fr-FR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {connected && allWeeks.length > 0 ? <CodeContributionsTrophiesPanel weeks={allWeeks} /> : null}
    </div>
  );
}
