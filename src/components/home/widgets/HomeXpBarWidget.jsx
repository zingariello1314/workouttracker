import React from 'react';
import { useSportGrade } from '../../../hooks/useSportGrade';
import SportGradeEmblem from '../../sport/grades/SportGradeEmblem';
import { sportGradeLabel, sportPalierLabel } from '../../sport/grades/SportGradeIdentity';
import { useTranslation } from '../../../utils/translations';
import SportXPBar from '../../tabs/TodayTab/components/SportXPBar';
import HomeWidgetShell from '../HomeWidgetShell';

function fmt(n) {
  return Number(n || 0).toLocaleString('fr-FR');
}

function MinimalXpStrip({ accent, xpOptions }) {
  const { totalXP, level, progress, grades, isLoading } = useSportGrade();
  const t = useTranslation();
  const progGradeId = grades?.progression?.gradeId;
  const progTier = grades?.progression?.tier;
  const progName = sportGradeLabel(progGradeId, t);
  const progPalier = sportPalierLabel(progTier, t);
  const xpNeeded = progress.xpNeeded ?? 0;
  const pct = Math.min(100, Math.max(0, progress.percent ?? 0));
  const showImage = xpOptions?.image !== false;
  const showTotal = xpOptions?.total !== false;
  const showPercent = xpOptions?.percent !== false;

  if (isLoading) {
    return (
      <HomeWidgetShell title="Progression XP" accent={accent}>
        <div className="h-8 animate-pulse rounded bg-white/10" />
      </HomeWidgetShell>
    );
  }

  return (
    <HomeWidgetShell title="Progression XP" accent={accent}>
      <div className="flex items-center gap-2.5" data-swipe-ignore>
        {showImage && progGradeId ? (
          <div className="h-11 w-9 shrink-0 overflow-hidden rounded-sm border border-white/15">
            <SportGradeEmblem
              gradeId={progGradeId}
              layout="bar"
              className="!h-full !w-full !max-h-none !max-w-none !rounded-none !border-0 !bg-transparent !shadow-none"
            />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[11px] text-white/90">
            <span className="font-semibold text-white">{progName || '—'}</span>
            <span className="text-white/55">
              {progPalier || '—'} · Niv. {level}
            </span>
            {showTotal ? (
              <span className="tabular-nums text-white/70">{fmt(totalXP)} XP</span>
            ) : null}
          </div>
          <div
            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-out"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${accent}, color-mix(in srgb, ${accent} 55%, #fff))`
              }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] tabular-nums text-white/55">
            <span style={{ color: accent }}>{fmt(xpNeeded)} XP restants</span>
            {showPercent ? <span>{Math.round(pct)} %</span> : null}
          </div>
        </div>
      </div>
    </HomeWidgetShell>
  );
}

/**
 * Barre XP accueil — réutilise le module SportXPBar (compact / détaillé)
 * ou une ligne minimale. `embed` masque le sélecteur de couleur.
 */
export default function HomeXpBarWidget({ variant = 'compact', accent, xpOptions }) {
  if (variant === 'minimal') {
    return <MinimalXpStrip accent={accent} xpOptions={xpOptions} />;
  }

  return (
    <div className="home-xp-embed w-full max-w-full overflow-x-auto overflow-y-hidden rounded-2xl" data-swipe-ignore>
      <SportXPBar previewMode={variant === 'detailed'} embed />
    </div>
  );
}
