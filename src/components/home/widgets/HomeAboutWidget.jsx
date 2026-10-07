import React from 'react';
import HomeWidgetShell from '../HomeWidgetShell';

export default function HomeAboutWidget({ t, short = false, accent, isAuthenticated, onCta }) {
  return (
    <HomeWidgetShell title={t('home.about.title')} accent={accent}>
      <div className="flex flex-col gap-3">
        <p
          className="text-sm font-medium leading-snug text-white md:leading-relaxed"
          style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
        >
          {t('home.about.description')}
        </p>
        {!short ? (
          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
            <div>
              <h4
                className="mb-1.5 font-semibold text-white"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
              >
                {t('home.about.features.title')}
              </h4>
              <ul
                className="space-y-1 text-white/90"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.6)' }}
              >
                <li>{t('home.about.features.items.bodyTracking')}</li>
                <li>{t('home.about.features.items.programs')}</li>
                <li>{t('home.about.features.items.predictions')}</li>
                <li>{t('home.about.features.items.analyses')}</li>
                <li>{t('home.about.features.items.code')}</li>
              </ul>
            </div>
            <div>
              <h4
                className="mb-1.5 font-semibold text-white"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
              >
                {t('home.about.data.title')}
              </h4>
              <ul
                className="space-y-1 text-white/90"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.6)' }}
              >
                <li>{t('home.about.data.items.photos')}</li>
                <li>{t('home.about.data.items.metrics')}</li>
                <li>{t('home.about.data.items.history')}</li>
                <li>{t('home.about.data.items.statistics')}</li>
              </ul>
            </div>
          </div>
        ) : null}
        <div className="flex justify-center border-t border-white/10 pt-2 sm:justify-start" data-swipe-ignore>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCta?.();
            }}
            className="max-w-full rounded-lg border border-white/12 bg-white/8 px-3 py-1.5 text-center text-[11px] font-medium leading-snug text-white backdrop-blur-xl transition-all duration-300 hover:border-white/25 hover:bg-white/18 hover:shadow-lg hover:shadow-white/10 md:px-4 md:py-2 md:text-xs"
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.65)' }}
            aria-label={isAuthenticated ? 'Navigate to Today section' : 'Get started with Momentum'}
          >
            {isAuthenticated ? 'Accéder à l’onglet Aujourd’hui' : t('home.cta')}
          </button>
        </div>
      </div>
    </HomeWidgetShell>
  );
}
