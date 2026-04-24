import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardGitHubCodeModule from '../dashboard/DashboardGitHubCodeModule';
import CodeContributionsTrophiesPanel from './CodeContributionsTrophiesPanel';
import { loadCodeJournalEntriesAsync } from '../../services/code/codeJournalIDB';
import {
  fetchViewerMeta,
  fetchMultiYearContributions,
  contributionYearSpanUtc,
  contributionTierHistogramFromWeeks,
  contributionStreaksFromWeeks,
} from '../../utils/githubContributions';

export default function CodeCalendarSubTab() {
  const { currentUser, isAuthenticated } = useAuth();
  const userId = currentUser?.id || 'main';
  const token = currentUser?.github?.accessToken;
  const login = currentUser?.github?.login;
  const connected = !!(isAuthenticated && token && login);
  const [detail, setDetail] = useState(null);
  const [journalEntries, setJournalEntries] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);

  const formatDayFr = (isoYmd) => {
    if (!isoYmd) return '';
    try {
      return new Date(`${isoYmd}T12:00:00Z`).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      });
    } catch {
      return isoYmd;
    }
  };

  const utcYmdFromIso = (iso) => {
    const s = String(iso || '');
    const d = s.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    return null;
  };

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

  const selectedDayEntries = useMemo(() => {
    if (!selectedDay?.date) return [];
    const day = selectedDay.date;
    return journalEntries.filter((entry) => {
      const key = entry.githubDayUtc || utcYmdFromIso(entry.createdAt);
      return key === day;
    });
  }, [journalEntries, selectedDay]);

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

      <DashboardGitHubCodeModule
        variant="embedded"
        calendarHeroFirst
        heatmapAccent="rose"
        onDayClick={(day) =>
          setSelectedDay({
            date: day?.date || null,
            contributionCount: Number(day?.contributionCount) || 0,
          })
        }
        calendarDetailsNode={
          selectedDay?.date ? (
            <div className="rounded-xl border border-rose-500/45 bg-[#06080d]/90 p-4 text-rose-100 shadow-lg shadow-black/40">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Détail du jour</h2>
                  <p className="text-sm text-rose-200/85">{formatDayFr(selectedDay.date)} (UTC)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="rounded-md border border-rose-500/45 bg-black/50 px-2.5 py-1 text-xs hover:bg-rose-950/35"
                >
                  Fermer
                </button>
              </div>
              <div className="mb-4 rounded-lg border border-rose-500/35 bg-black/40 p-3 text-sm">
                Contributions GitHub :{' '}
                <strong className="text-white">
                  {selectedDay.contributionCount} contribution{selectedDay.contributionCount > 1 ? 's' : ''}
                </strong>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-rose-300/90">
                  Journal & directives enregistrés ce jour
                </h3>
                {selectedDayEntries.length === 0 ? (
                  <p className="text-sm text-rose-200/65">Aucune entrée enregistrée dans le journal ce jour-là.</p>
                ) : (
                  <ul className="space-y-2">
                    {selectedDayEntries.map((entry) => (
                      <li key={entry.id} className="rounded-lg border border-rose-500/25 bg-black/45 p-3">
                        <div className="mb-1 text-xs text-rose-300/80">
                          {entry.createdAt
                            ? new Date(entry.createdAt).toLocaleString('fr-FR', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })
                            : 'Date inconnue'}
                        </div>
                        <p className="whitespace-pre-wrap text-sm text-rose-50/95">
                          {entry.text || '(Entrée sans texte)'}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null
        }
      />

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
