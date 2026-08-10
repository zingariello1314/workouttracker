import React from 'react';
import {
  Activity,
  BarChart3,
  Brain,
  Footprints,
  LayoutDashboard,
  Medal
} from 'lucide-react';
import { useTranslation } from '../../../../utils/translations';
import { RECAP_NAV_SECTIONS, RECAP_VIEW_IDS } from '../../../../utils/sport/recapViewConfig';
import { RECAP_VIEW_PERIODS } from '../../../../utils/sport/recapViewPeriods';

const VIEW_ICONS = {
  [RECAP_VIEW_IDS.SNAPSHOT]: LayoutDashboard,
  [RECAP_VIEW_IDS.ANALYSE]: Brain,
  [RECAP_VIEW_IDS.GRADES]: Medal,
  [RECAP_VIEW_IDS.CORPS]: Activity,
  [RECAP_VIEW_IDS.TENDANCES]: BarChart3,
  [RECAP_VIEW_IDS.SESSIONS]: Footprints
};

function scoreDotClass(level) {
  if (level >= 75) return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]';
  if (level >= 55) return 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]';
  if (level >= 28) return 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]';
  return 'bg-slate-400';
}

/**
 * Shell Récap : topbar sticky + sidenav + zone de contenu.
 */
export default function RecapShellLayout({
  activeView,
  onViewChange,
  period,
  onPeriodChange,
  scoreLevel,
  scoreTier,
  gradeHeader,
  children
}) {
  const t = useTranslation();

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1400px] flex-col px-3 py-4 text-slate-100 sm:px-4">
      <header className="sticky top-0 z-30 mb-4 rounded-xl border border-[#0F4C5C]/55 bg-black/95 px-4 py-3 shadow-lg shadow-black/40 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3 gap-y-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-600">
              {t('recap.breadcrumbSport', 'Sport')}
            </p>
            <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">{t('recap.title')}</h1>
          </div>

          {gradeHeader ? (
            <div className="w-full sm:w-auto order-last sm:order-none">{gradeHeader}</div>
          ) : null}

          {scoreLevel != null ? (
            <div
              className="flex items-center gap-2 rounded-full border border-[#0F4C5C]/50 bg-[#041a14]/90 px-3 py-1.5"
              title={t('recap.assessment.scoreHint')}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${scoreDotClass(scoreLevel)}`}
                aria-hidden
              />
              <span className="text-sm font-bold tabular-nums text-white">{scoreLevel}</span>
              <span className="hidden text-xs text-emerald-300/90 sm:inline">· {scoreTier}</span>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-1.5 sm:ml-auto">
            {RECAP_VIEW_PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPeriodChange(p.id)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  period === p.id
                    ? 'border-[#0F5C45]/90 bg-[#0F5C45]/90 text-white shadow-md shadow-black/30'
                    : 'border-[#0F4C5C]/55 bg-black text-teal-100/90 hover:border-[#0F5C45]/70'
                }`}
              >
                {t(p.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex flex-1 gap-4 lg:gap-5">
        <aside className="sticky top-[5.5rem] hidden h-[calc(100vh-6.5rem)] w-[160px] shrink-0 flex-col lg:flex">
          <nav className="flex flex-col gap-1 rounded-xl border border-[#0F4C5C]/55 bg-black/80 p-2">
            {RECAP_NAV_SECTIONS.map((section, si) => (
              <React.Fragment key={section.id}>
                {si > 0 ? <div className="my-2 border-t border-[#0F4C5C]/40" aria-hidden /> : null}
                {section.items.map((item) => {
                  const Icon = VIEW_ICONS[item.id] || LayoutDashboard;
                  const active = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onViewChange(item.id)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                        active
                          ? 'bg-[#0F5C45]/35 text-emerald-100 ring-1 ring-[#0F5C45]/50'
                          : 'text-slate-400 hover:bg-[#0F4C5C]/20 hover:text-teal-100'
                      }`}
                    >
                      <Icon size={16} className={active ? 'text-emerald-400' : 'text-teal-600'} />
                      <span>{t(item.labelKey, item.defaultLabel)}</span>
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-20 lg:pb-8">{children}</main>
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-[#0F4C5C]/55 bg-black/95 px-1 py-1 backdrop-blur-md lg:hidden"
        aria-label={t('recap.nav.mobile', 'Navigation Récap')}
      >
        {RECAP_NAV_SECTIONS.flatMap((s) => s.items).map((item) => {
          const Icon = VIEW_ICONS[item.id] || LayoutDashboard;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onViewChange(item.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] ${
                active ? 'text-emerald-300' : 'text-slate-500'
              }`}
            >
              <Icon size={18} />
              <span>{t(item.labelKey, item.defaultLabel)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
