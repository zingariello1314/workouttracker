import { useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Code2,
  ExternalLink,
  Github,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkout } from '../../context/WorkoutContext';
import { useGitHubDashboard } from '../../hooks/useGitHubDashboard';
import { contributionLevelToTier, tierToHeatClass } from '../../utils/githubContributions';
import { getGitHubClientId, startGitHubOAuthFlow } from '../../utils/githubApi';
import Button from '../ui/Button';

const TIER_CLASS = {
  gh0: 'bg-[#161b22] border border-slate-800/70',
  gh1: 'bg-[#0e4429]',
  gh2: 'bg-[#006d32]',
  gh3: 'bg-[#26a641]',
  gh4: 'bg-[#39d353]',
};

/** Libellés à gauche (style GitHub : Lun / Mer / Ven). */
const ROW_LABELS = ['', 'Lun', '', 'Mer', '', 'Ven', ''];

function monthShortFr(utcMonthIndex) {
  try {
    return new Date(Date.UTC(2000, utcMonthIndex, 1)).toLocaleDateString('fr-FR', { month: 'short' });
  } catch {
    return '';
  }
}

function HeatmapGrid({ weeks }) {
  const monthRow = useMemo(() => {
    return (weeks || []).map((week, wi) => {
      const first = week?.contributionDays?.[0];
      if (!first?.date) return { key: wi, label: '' };
      const m = new Date(`${first.date}T12:00:00Z`).getUTCMonth();
      const prev = wi > 0 ? weeks[wi - 1]?.contributionDays?.[0]?.date : null;
      let label = '';
      if (!prev) label = monthShortFr(m);
      else {
        const pm = new Date(`${prev}T12:00:00Z`).getUTCMonth();
        if (pm !== m) label = monthShortFr(m);
      }
      return { key: wi, label };
    });
  }, [weeks]);

  if (!weeks?.length) {
    return <div className="py-8 text-center text-sm text-slate-500">Aucune donnée pour cette année.</div>;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <div className="flex shrink-0 flex-col gap-[3px] pt-[22px] text-[10px] leading-[10px] text-slate-500">
        {ROW_LABELS.map((lab, ri) => (
          <div key={ri} className="flex h-[10px] items-center justify-end pr-1">
            {lab}
          </div>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="mb-1 grid gap-x-[3px] text-[10px] leading-none text-slate-500"
          style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 10px))` }}
        >
          {monthRow.map((c) => (
            <div key={c.key} className="truncate text-center">
              {c.label}
            </div>
          ))}
        </div>
        <div className="flex gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {(week.contributionDays || []).map((day) => {
                const tier = contributionLevelToTier(day.contributionLevel);
                const cls = tierToHeatClass(tier);
                const bg = TIER_CLASS[cls] || TIER_CLASS.gh0;
                const tip = `${day.date} · ${day.contributionCount} contribution${day.contributionCount !== 1 ? 's' : ''}`;
                return (
                  <div
                    key={day.date}
                    title={tip}
                    className={`h-[10px] w-[10px] shrink-0 rounded-sm ${bg}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-end gap-2 text-xs text-slate-500">
          <span>Moins</span>
          <div className="flex gap-[3px]">
            {[0, 1, 2, 3, 4].map((t) => (
              <div key={t} className={`h-[10px] w-[10px] rounded-sm ${TIER_CLASS[`gh${t}`]}`} />
            ))}
          </div>
          <span>Plus</span>
        </div>
      </div>
    </div>
  );
}

const DashboardGitHubCodeModule = () => {
  const { currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const { setActiveTab } = useWorkout();
  const token = currentUser?.github?.accessToken;
  const login = currentUser?.github?.login;
  const connected = !!(isAuthenticated && token && login);

  const gh = useGitHubDashboard(token, connected);

  const clientConfigured = !!getGitHubClientId();

  const stats = gh.statsForUi;
  const bestDayLabel = useMemo(() => {
    if (!stats?.bestDay?.date) return '—';
    try {
      return new Date(`${stats.bestDay.date}T12:00:00`).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return stats.bestDay.date;
    }
  }, [stats?.bestDay]);

  const onConnect = () => {
    if (!isAuthenticated) {
      setActiveTab('auth');
      return;
    }
    if (!clientConfigured) {
      setActiveTab('settings');
      setTimeout(() => document.getElementById('settings-github')?.scrollIntoView({ behavior: 'smooth' }), 300);
      return;
    }
    startGitHubOAuthFlow();
  };

  return (
    <section className="scroll-mt-24 rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-black p-5 shadow-lg shadow-emerald-950/20 md:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-2.5">
            <Code2 className="h-7 w-7 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white md:text-2xl">Code & GitHub</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Calendrier de contributions façon GitHub, jours actifs, meilleur jour et moyennes — lié à ton compte
              Momentum.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={Settings}
            onClick={() => {
              setActiveTab('settings');
              setTimeout(() => document.getElementById('settings-github')?.scrollIntoView({ behavior: 'smooth' }), 300);
            }}
          >
            Paramètres
          </Button>
          {connected && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={RefreshCw}
              onClick={() => gh.refresh()}
              disabled={gh.loading}
            >
              Rafraîchir
            </Button>
          )}
        </div>
      </div>

      {!authLoading && !isAuthenticated && (
        <div className="rounded-xl border border-slate-700 bg-black/40 p-6 text-center">
          <Github className="mx-auto mb-3 h-10 w-10 text-slate-500" />
          <p className="text-slate-300">Connecte-toi à Momentum pour lier GitHub et afficher tes stats ici.</p>
          <Button type="button" variant="primary" className="mt-4" onClick={() => setActiveTab('auth')}>
            Se connecter
          </Button>
        </div>
      )}

      {isAuthenticated && !connected && (
        <div className="rounded-xl border border-emerald-600/30 bg-black/50 p-6 text-center">
          <Github className="mx-auto mb-3 h-12 w-12 text-emerald-400/90" />
          <p className="mb-1 text-lg font-semibold text-white">Relie ton compte GitHub</p>
          <p className="mx-auto mb-5 max-w-lg text-sm text-slate-400">
            Tu seras redirigé vers GitHub pour autoriser la lecture du profil (
            <code className="text-emerald-300/90">read:user</code>
            ). Le jeton est enregistré sur ton profil Momentum (IndexedDB).
          </p>
          <Button type="button" variant="primary" icon={Github} onClick={onConnect}>
            Se connecter à GitHub
          </Button>
          {!clientConfigured && (
            <p className="mt-4 text-xs text-amber-200/80">
              Définis <code className="text-amber-100">VITE_GITHUB_CLIENT_ID</code> (et le secret côté serveur) — voir
              Paramètres → Intégration GitHub.
            </p>
          )}
        </div>
      )}

      {connected && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700/80 bg-black/35 px-4 py-3">
            <div className="flex items-center gap-3">
              {currentUser.github?.avatarUrl ? (
                <img
                  src={currentUser.github.avatarUrl}
                  alt=""
                  className="h-10 w-10 rounded-full border border-slate-600"
                />
              ) : (
                <Github className="h-9 w-9 text-slate-400" />
              )}
              <div>
                <div className="font-semibold text-white">@{login}</div>
                <a
                  href={currentUser.github?.htmlUrl || `https://github.com/${login}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                >
                  Profil GitHub <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            <div className="text-sm text-slate-400">
              {gh.yearTotal != null ? (
                <span>
                  <strong className="text-emerald-300">{gh.yearTotal}</strong> contributions (
                  {gh.displayYear})
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-700/80 bg-black/30 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                <Calendar className="h-4 w-4 text-emerald-400" />
                <span className="font-medium text-white">Année du calendrier</span>
                <select
                  value={gh.displayYear}
                  onChange={(e) => gh.setDisplayYear(Number(e.target.value))}
                  className="ml-auto rounded-lg border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-white"
                >
                  {gh.availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              {gh.loading && <div className="py-6 text-center text-slate-500">Chargement…</div>}
              {gh.error && (
                <div className="rounded-lg border border-rose-700/50 bg-rose-950/30 p-3 text-sm text-rose-100">
                  {gh.error}
                </div>
              )}
              {!gh.loading && !gh.error && <HeatmapGrid weeks={gh.yearWeeks} />}
            </div>

            <div className="rounded-xl border border-slate-700/80 bg-black/30 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-400" />
                <span className="font-medium text-white">Statistiques</span>
                <select
                  value={gh.statsScope === 'current' ? 'current' : gh.statsScope === 'all' ? 'all' : String(gh.statsScope)}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === 'current') gh.setStatsScope('current');
                    else if (v === 'all') gh.setStatsScope('all');
                    else gh.setStatsScope(Number(v));
                  }}
                  className="ml-auto max-w-[200px] rounded-lg border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-white"
                >
                  <option value="current">Année affichée ({gh.displayYear})</option>
                  <option value="all">Toutes les années</option>
                  {gh.availableYears.map((y) => (
                    <option key={`s-${y}`} value={String(y)}>
                      Année {y}
                    </option>
                  ))}
                </select>
              </div>
              {stats && (
                <ul className="space-y-3 text-sm text-slate-300">
                  <li className="flex justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <span>Période</span>
                    <span className="font-medium text-white">{stats.label}</span>
                  </li>
                  <li className="flex justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <span>Jours avec au moins 1 contribution</span>
                    <span className="font-medium text-emerald-300">{stats.activeCodingDays}</span>
                  </li>
                  <li className="flex justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <span>Total contributions (période)</span>
                    <span className="font-medium text-white">{stats.totalCommits}</span>
                  </li>
                  <li className="flex justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <span>Meilleur jour</span>
                    <span className="text-right font-medium text-white">
                      {bestDayLabel}
                      {stats.bestDay ? (
                        <span className="block text-xs font-normal text-emerald-400/90">
                          {stats.bestDay.count} contribution{stats.bestDay.count !== 1 ? 's' : ''}
                        </span>
                      ) : null}
                    </span>
                  </li>
                  <li className="flex justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <span>Moyenne / jour avec activité</span>
                    <span className="font-medium text-white">{stats.avgPerActiveDay.toFixed(2)}</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span>Moyenne / jour calendaire (période)</span>
                    <span className="font-medium text-white">{stats.avgPerCalendarDay.toFixed(2)}</span>
                  </li>
                </ul>
              )}
              <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
                Les mêmes règles que GitHub s&apos;appliquent aux contributions (
                <a
                  href="https://docs.github.com/account-and-profile/setting-up-and-managing-your-github-profile/managing-contribution-settings-on-your-profile/why-are-my-contributions-not-showing-up-on-my-profile"
                  className="text-emerald-500/90 underline hover:text-emerald-400"
                  target="_blank"
                  rel="noreferrer"
                >
                  documentation GitHub
                </a>
                ).
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default DashboardGitHubCodeModule;
