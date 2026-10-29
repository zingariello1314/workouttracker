import React, { useLayoutEffect, useRef, useState } from 'react';
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
import '../recap-board.css';

const RECAP_THEMES = [
  { id: 'gold', name: 'Or', c: '#ffb938' },
  { id: 'blue', name: 'Bleu', c: '#4f9dff' },
  { id: 'cyan', name: 'Cyan', c: '#2ad4ff' },
  { id: 'violet', name: 'Violet', c: '#a98bff' },
  { id: 'pink', name: 'Rose', c: '#f26fb5' },
  { id: 'red', name: 'Rouge', c: '#ff5a4a' },
  { id: 'orange', name: 'Orange', c: '#ff8a3d' }
];

const RECAP_THEME_LS = 'recap-theme';

const PAGE_LINKS = {
  [RECAP_VIEW_IDS.SNAPSHOT]: [
    ['#sn-ind', 'Indicateurs'],
    ['#sn-stat', 'Statut'],
    ['#sn-def', 'Période'],
    ['#sn-quiz', 'Quiz profil'],
    ['#sn-zones', 'Zones']
  ],
  [RECAP_VIEW_IDS.ANALYSE]: [
    ['#recap', 'Récap'],
    ['#reperes', 'Repères'],
    ['#coach', 'Vision coach'],
    ['#prog', 'Programme'],
    ['#synth', 'Synthèse']
  ],
  [RECAP_VIEW_IDS.GRADES]: [
    ['#g-grade', 'Grade actuel'],
    ['#g-xp', 'XP & niveau'],
    ['#g-next', 'Prochain grade'],
    ['#g-parcours', 'Parcours'],
    ['#g-hist', 'Historique']
  ],
  [RECAP_VIEW_IDS.CORPS]: [
    ['#c-map', 'Carte corporelle'],
    ['#c-rep', 'Répartition'],
    ['#c-zones', 'Détail par zone'],
    ['#c-trp', 'Trophées']
  ],
  [RECAP_VIEW_IDS.TENDANCES]: [
    ['#mensuel', 'Mensuel'],
    ['#quotidien', 'Quotidien'],
    ['#records', 'Records course'],
    ['#modules', 'Course · Marche · Muscu']
  ],
  [RECAP_VIEW_IDS.SESSIONS]: [
    ['#j-journal', 'Journal'],
    ['#j-prog', 'Progression'],
    ['#j-hist', 'Historique']
  ]
};

function scrollToSection(event, href) {
  event.preventDefault();
  document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function PageLinks({ view, className }) {
  const links = PAGE_LINKS[view] || [];
  if (!links.length) return null;
  return (
    <div className={className}>
      {links.map(([href, label]) => (
        <a key={href} href={href} onClick={(event) => scrollToSection(event, href)}>
          {label}
        </a>
      ))}
    </div>
  );
}

const VIEW_ICONS = {
  [RECAP_VIEW_IDS.SNAPSHOT]: LayoutDashboard,
  [RECAP_VIEW_IDS.ANALYSE]: Brain,
  [RECAP_VIEW_IDS.GRADES]: Medal,
  [RECAP_VIEW_IDS.CORPS]: Activity,
  [RECAP_VIEW_IDS.TENDANCES]: BarChart3,
  [RECAP_VIEW_IDS.SESSIONS]: Footprints
};

function scoreDotTone(level) {
  if (level >= 75) return 'ok';
  if (level >= 55) return 'mid';
  if (level >= 28) return 'warn';
  return 'dim';
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
  showTopMetrics = true,
  children
}) {
  const t = useTranslation();
  const boardRef = useRef(null);
  useLayoutEffect(() => {
    const root = boardRef.current;
    if (!root) return undefined;
    const apply = () => {
      root.querySelectorAll('.rb-fit').forEach((el) => {
        if (el.hidden || el.classList.contains('rb-park')) return;
        const inner = el.querySelector(':scope > .rb-scale');
        if (!inner) return;
        const next = Math.ceil(inner.offsetHeight * 0.9);
        if (next > 0 && el.style.height !== `${next}px`) el.style.height = `${next}px`;
      });
    };
    apply();
    const ro = new ResizeObserver(apply);
    root.querySelectorAll('.rb-scale').forEach((el) => ro.observe(el));
    return () => ro.disconnect();
  }, [activeView]);
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem(RECAP_THEME_LS);
      if (stored && RECAP_THEMES.some((item) => item.id === stored)) return stored;
    } catch {
      /* ignore */
    }
    return 'gold';
  });

  const setRecapTheme = (id) => {
    setTheme(id);
    try {
      localStorage.setItem(RECAP_THEME_LS, id);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      ref={boardRef}
      className="recap-board mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1640px] flex-col px-3 py-4 sm:px-6"
      data-theme={theme}
    >
      <header className="rb-top">
        <div className="min-w-0">
          <p className="rb-kicker">{t('recap.breadcrumbSport', 'Sport')}</p>
          <h1>{t('recap.title')}</h1>
        </div>

        {gradeHeader ? <div className="w-full sm:w-auto">{gradeHeader}</div> : null}

        <div className="rb-tools">
          {showTopMetrics && scoreLevel != null ? (
            <div className="rb-lvl" title={t('recap.assessment.scoreHint')}>
              <i className={`rb-dot ${scoreDotTone(scoreLevel)}`} aria-hidden />
              <b>{scoreLevel}</b>
              {scoreTier ? <span>{scoreTier}</span> : null}
            </div>
          ) : null}

          {showTopMetrics ? (
            <div className="rb-seg" role="group" aria-label={t('recap.period.today', 'Période')}>
              {RECAP_VIEW_PERIODS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={period === p.id}
                  onClick={() => onPeriodChange(p.id)}
                >
                  {t(p.labelKey)}
                </button>
              ))}
            </div>
          ) : null}

          <div className="rb-th">
            <span>{t('recap.color', 'Couleur')}</span>
            {RECAP_THEMES.map((swatch) => (
              <button
                key={swatch.id}
                type="button"
                style={{ '--c': swatch.c }}
                title={swatch.name}
                aria-label={swatch.name}
                aria-pressed={theme === swatch.id}
                onClick={() => setRecapTheme(swatch.id)}
              />
            ))}
          </div>
        </div>
      </header>

      <div className="rb-body">
        <aside className="rb-side">
          <nav aria-label={t('recap.title')}>
            {RECAP_NAV_SECTIONS.map((section) => (
              <React.Fragment key={section.id}>
                {section.id === 'data' ? (
                  <div className="rb-lb">{t('recap.nav.data', 'Données')}</div>
                ) : null}
                {section.items.map((item) => {
                  const Icon = VIEW_ICONS[item.id] || LayoutDashboard;
                  const active = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onViewChange(item.id)}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon size={16} />
                      <span>{t(item.labelKey, item.defaultLabel)}</span>
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
            <div className="rb-lb">{t('recap.nav.thisPage', 'Cette page')}</div>
            <PageLinks view={activeView} className="rb-nv" />
          </nav>
        </aside>

        <main className="rb-main">
          <PageLinks view={activeView} className="rb-page" />
          {children}
        </main>
      </div>

      <nav className="rb-dock" aria-label={t('recap.nav.mobile', 'Navigation Récap')}>
        {RECAP_NAV_SECTIONS.flatMap((s) => s.items).map((item) => {
          const Icon = VIEW_ICONS[item.id] || LayoutDashboard;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onViewChange(item.id)}
              aria-current={active ? 'page' : undefined}
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
