import React from 'react';
import HomeAboutWidget from './widgets/HomeAboutWidget';
import HomeXpBarWidget from './widgets/HomeXpBarWidget';
import HomeMonthWidget from './widgets/HomeMonthWidget';
import HomeWeekWidget from './widgets/HomeWeekWidget';
import HomeTodayExercisesWidget from './widgets/HomeTodayExercisesWidget';
import HomeStatsWidget from './widgets/HomeStatsWidget';

/**
 * Rend un widget accueil depuis le registre (id + variante + config layout).
 */
export function renderHomeWidget(def, variant, ctx) {
  const { accent, metrics, xpOptions, t, isAuthenticated, onAboutCta } = ctx;

  switch (def.id) {
    case 'about':
      return (
        <HomeAboutWidget
          key={def.id}
          t={t}
          short={variant === 'short'}
          accent={accent}
          isAuthenticated={isAuthenticated}
          onCta={onAboutCta}
        />
      );
    case 'xpBar':
      return (
        <HomeXpBarWidget
          key={def.id}
          variant={variant}
          accent={accent}
          xpOptions={xpOptions}
        />
      );
    case 'month':
      return (
        <HomeMonthWidget key={def.id} variant={variant} accent={accent} metrics={metrics} />
      );
    case 'week':
      return <HomeWeekWidget key={def.id} variant={variant} accent={accent} />;
    case 'todayExercises':
      return <HomeTodayExercisesWidget key={def.id} variant={variant} accent={accent} />;
    case 'stats':
      return (
        <HomeStatsWidget key={def.id} variant={variant} accent={accent} metrics={metrics} />
      );
    default:
      return null;
  }
}
