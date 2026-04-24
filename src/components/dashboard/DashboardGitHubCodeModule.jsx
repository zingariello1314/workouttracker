import { useMemo } from 'react';
import {
  BarChart3,
  Code2,
  ExternalLink,
  Github,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkout } from '../../context/WorkoutContext';
import { useGitHubDashboard } from '../../hooks/useGitHubDashboard';
import { useGlobalXP } from '../../hooks/useGlobalXP';
import { getGitHubClientId, startGitHubOAuthFlow } from '../../utils/githubApi';
import { levelProgressFromXpAmount } from '../../utils/xpLevelFromAmount';
import Button from '../ui/Button';
import GitHubHeatmapGrid from '../code/GitHubHeatmapGrid';

const DashboardGitHubCodeModule = ({
  variant = 'default',
  heatmapAccent: heatmapAccentProp,
  /** Onglet Code calendrier : grille heatmap + périodes en premier (sous la barre XP / intro). */
  calendarHeroFirst = false,
  onDayClick = null,
  calendarDetailsNode = null,
}) => {
  const isEmbedded = variant === 'embedded';
  const heatmapAccent = heatmapAccentProp || (isEmbedded ? 'rose' : 'emerald');
  const heroCalendar = isEmbedded && calendarHeroFirst;

  const { currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const { setActiveTab } = useWorkout();
  const token = currentUser?.github?.accessToken;
  const login = currentUser?.github?.login;
  const connected = !!(isAuthenticated && token && login);

  const gh = useGitHubDashboard(token, connected);
  const { xpByCategory, totalXP } = useGlobalXP();
  const codeXp = Math.round(xpByCategory?.code ?? 0);
  const codeLevelInfo = useMemo(() => levelProgressFromXpAmount(codeXp), [codeXp]);
  const codeSlicePct = totalXP > 0 ? Math.min(100, (codeXp / totalXP) * 100) : 0;

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

  const shellClass = isEmbedded
    ? 'space-y-5'
    : 'scroll-mt-24 rounded-2xl border-2 border-rose-500/50 bg-black p-5 shadow-lg shadow-rose-950/30 md:p-6';

  const inner = (
    <>
      {isEmbedded && (
        <div className="flex flex-wrap items-center justify-end gap-2 pb-2">
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
            Paramètres GitHub
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
      )}

      {!isEmbedded && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-rose-500/45 bg-rose-950/25 p-2.5">
              <Code2 className="h-7 w-7 text-rose-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white md:text-2xl">Code & GitHub</h2>
              <p className="mt-1 max-w-2xl text-sm text-rose-200/75">
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
      )}

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
        <div className="rounded-xl border border-rose-500/40 bg-black/60 p-6 text-center">
          <Github className="mx-auto mb-3 h-12 w-12 text-rose-400/90" />
          <p className="mb-1 text-lg font-semibold text-white">Relie ton compte GitHub</p>
          <p className="mx-auto mb-5 max-w-lg text-sm text-slate-400">
            Tu seras redirigé vers GitHub pour autoriser la lecture du profil (
            <code className="text-rose-300/90">read:user</code>
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
          {heroCalendar ? null : (
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
                  className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300"
                >
                  Profil GitHub <ExternalLink className="h-3 w-3" />
                </a>
                </div>
              </div>
            </div>
          )}

          {heroCalendar ? null : (
            <div className="rounded-xl border border-rose-500/45 bg-black/45 px-4 py-3 shadow-inner shadow-rose-950/20">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-300/90">XP Code</p>
                  <p className="text-sm text-rose-100/85">
                    <span className="font-bold text-white">{codeXp.toLocaleString('fr-FR')}</span> XP — niveau Code{' '}
                    <span className="text-white">{codeLevelInfo.level}</span>
                  </p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  Total Momentum :{' '}
                  <span className="font-medium text-slate-200">{totalXP.toLocaleString('fr-FR')}</span> XP
                </div>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full border border-rose-500/35 bg-slate-900">
                <div
                  className="h-full bg-gradient-to-r from-rose-950 via-rose-600 to-fuchsia-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, codeLevelInfo.progress.percent))}%` }}
                  title="Progression du niveau Code (1000 XP par palier)"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">
                Prochain palier Code :{' '}
                <span className="text-rose-200/90">{codeLevelInfo.progress.xpNeeded.toLocaleString('fr-FR')}</span> XP — part
                Code dans le total Momentum : <span className="text-rose-200/90">{codeSlicePct.toFixed(1)} %</span>.
              </p>
            </div>
          )}

          <div
            className={`flex flex-col gap-4 lg:flex-row lg:items-start ${
              heroCalendar
                ? 'rounded-2xl border-2 border-rose-500/45 bg-black/45 p-3 shadow-xl shadow-rose-950/30 md:p-5'
                : ''
            }`}
          >
            <div className="min-w-0 flex-1 rounded-xl border border-slate-700/80 bg-black/30 p-4 md:p-5">
              <div className="mb-4 border-b border-slate-700/60 pb-4">
                <p className="text-lg font-semibold text-white">
                  {gh.yearTotal != null ? (
                    <>
                      <span className="text-emerald-300">{gh.yearTotal}</span>{' '}
                      <span className="font-normal text-slate-200">
                        {gh.heatmapMode === 'rolling'
                          ? 'contributions sur les 12 derniers mois'
                          : `contributions en ${gh.civilYear}`}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400">Contributions</span>
                  )}
                </p>
              </div>

              <div className="mb-5 flex min-w-0 flex-wrap items-center gap-2 text-sm text-slate-300">
                <BarChart3 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span className="font-medium text-white">Période des statistiques</span>
                <select
                  value={gh.statsScope === 'current' ? 'current' : gh.statsScope === 'all' ? 'all' : String(gh.statsScope)}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === 'current') gh.setStatsScope('current');
                    else if (v === 'all') gh.setStatsScope('all');
                    else gh.setStatsScope(Number(v));
                  }}
                  className="min-w-0 max-w-full rounded-lg border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-white sm:max-w-xs"
                >
                  <option value="current">
                    {gh.heatmapMode === 'rolling'
                      ? 'Alignée sur le graphe (12 derniers mois)'
                      : `Alignée sur le graphe (${gh.civilYear})`}
                  </option>
                  <option value="all">Toutes les années</option>
                  {gh.availableYears.map((y) => (
                    <option key={`s-${y}`} value={String(y)}>
                      Année {y}
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
              {!gh.loading && !gh.error && (
                <GitHubHeatmapGrid weeks={gh.yearWeeks} accent={heatmapAccent} onDayClick={onDayClick} />
              )}
              {calendarDetailsNode ? <div className="mt-4">{calendarDetailsNode}</div> : null}

            {stats && (
              <div className="mt-8 border-t border-slate-700/70 pt-6">
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                  <BarChart3 className="h-5 w-5 text-emerald-400" />
                  Statistiques
                </h3>
                <ul className="mx-auto max-w-4xl space-y-3 text-sm text-slate-300">
                  <li className="flex flex-col justify-between gap-1 border-b border-slate-800/80 pb-3 sm:flex-row sm:items-center">
                    <span>Période</span>
                    <span className="font-medium text-white sm:text-right">{stats.label}</span>
                  </li>
                  <li className="flex flex-col justify-between gap-1 border-b border-slate-800/80 pb-3 sm:flex-row sm:items-center">
                    <span>Jours avec au moins 1 contribution</span>
                    <span className="font-medium text-emerald-300 sm:text-right">{stats.activeCodingDays}</span>
                  </li>
                  <li className="flex flex-col justify-between gap-1 border-b border-slate-800/80 pb-3 sm:flex-row sm:items-center">
                    <span>Total contributions (période)</span>
                    <span className="font-medium text-white sm:text-right">{stats.totalCommits}</span>
                  </li>
                  <li className="flex flex-col justify-between gap-1 border-b border-slate-800/80 pb-3 sm:flex-row sm:items-center">
                    <span>Meilleur jour</span>
                    <span className="font-medium text-white sm:text-right">
                      {bestDayLabel}
                      {stats.bestDay ? (
                        <span className="mt-0.5 block text-xs font-normal text-emerald-400/90">
                          {stats.bestDay.count} contribution{stats.bestDay.count !== 1 ? 's' : ''}
                        </span>
                      ) : null}
                    </span>
                  </li>
                  <li className="flex flex-col justify-between gap-1 border-b border-slate-800/80 pb-3 sm:flex-row sm:items-center">
                    <span>Moyenne / jour avec activité</span>
                    <span className="font-medium text-white sm:text-right">{stats.avgPerActiveDay.toFixed(2)}</span>
                  </li>
                  <li className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                    <span>Moyenne / jour calendaire (période)</span>
                    <span className="font-medium text-white sm:text-right">{stats.avgPerCalendarDay.toFixed(2)}</span>
                  </li>
                </ul>
                <p className="mx-auto mt-6 max-w-4xl text-[11px] leading-relaxed text-slate-500">
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
            )}
            </div>

            <nav
              className="flex shrink-0 flex-row flex-wrap gap-2 lg:w-[5.25rem] lg:flex-col lg:items-stretch lg:gap-1 lg:pt-1"
              aria-label="Période du calendrier"
            >
              <button
                type="button"
                onClick={() => gh.setHeatmapMode('rolling')}
                className={`rounded-lg border px-2.5 py-2 text-center text-sm font-medium transition-colors lg:py-1.5 ${
                  gh.heatmapMode === 'rolling'
                    ? 'border-sky-500 bg-sky-600 text-white shadow-md shadow-sky-900/40'
                    : 'border-slate-600 bg-slate-900/80 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
                }`}
              >
                12 mois
              </button>
              {[...gh.availableYears].reverse().map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    gh.setHeatmapMode('civil');
                    gh.setCivilYear(y);
                  }}
                  className={`rounded-lg border px-2.5 py-2 text-center text-sm font-medium transition-colors lg:py-1.5 ${
                    gh.heatmapMode === 'civil' && gh.civilYear === y
                      ? 'border-sky-500 bg-sky-600 text-white shadow-md shadow-sky-900/40'
                      : 'border-slate-600 bg-slate-900/80 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
                  }`}
                >
                  {y}
                </button>
              ))}
            </nav>
          </div>

          {heroCalendar ? (
            <>
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
                      className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300"
                    >
                      Profil GitHub <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-rose-500/45 bg-black/45 px-4 py-3 shadow-inner shadow-rose-950/20">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-300/90">XP Code</p>
                    <p className="text-sm text-rose-100/85">
                      <span className="font-bold text-white">{codeXp.toLocaleString('fr-FR')}</span> XP — niveau Code{' '}
                      <span className="text-white">{codeLevelInfo.level}</span>
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    Total Momentum : <span className="font-medium text-slate-200">{totalXP.toLocaleString('fr-FR')}</span> XP
                  </div>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full border border-rose-500/35 bg-slate-900">
                  <div
                    className="h-full bg-gradient-to-r from-rose-950 via-rose-600 to-fuchsia-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, codeLevelInfo.progress.percent))}%` }}
                    title="Progression du niveau Code (1000 XP par palier)"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Prochain palier Code :{' '}
                  <span className="text-rose-200/90">{codeLevelInfo.progress.xpNeeded.toLocaleString('fr-FR')}</span> XP — part
                  Code dans le total Momentum : <span className="text-rose-200/90">{codeSlicePct.toFixed(1)} %</span>.
                </p>
              </div>
            </>
          ) : null}
        </div>
      )}
    </>
  );

  return isEmbedded ? <div className={shellClass}>{inner}</div> : <section className={shellClass}>{inner}</section>;
};

export default DashboardGitHubCodeModule;
