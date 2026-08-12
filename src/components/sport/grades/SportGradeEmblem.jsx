import React, { useState, useMemo } from 'react';
import {
  Sprout,
  TrendingUp,
  Target,
  Dumbbell,
  Trophy,
  Star,
  Crown,
  Gem,
  Flame,
  Sparkles
} from 'lucide-react';
import {
  SPORT_GRADE_EMBLEM,
  SPORT_GRADE_ACCENT,
  sportGradeArtUrl,
  hasSportGradeArt,
  sportGradeArtObjectPosition
} from '../../../services/xp/sportGradeCatalog';

const ICONS = {
  Sprout,
  TrendingUp,
  Target,
  Dumbbell,
  Trophy,
  Star,
  Crown,
  Gem,
  Flame,
  Sparkles
};

/** Affichage portrait complet — uniquement fiche détail Grand Maître. */
const GRAND_MAITRE_DETAIL_GRADE_ID = 'grand_maitre';

/**
 * Tailles d’illustration pixel-art par contexte UI.
 * @typedef {'bar'|'recap'|'chip'|'icon'} SportGradeEmblemLayout
 */
const LAYOUT = {
  /** Bandeau XP : portrait compact, lisible sans gonfler la hauteur */
  bar: { width: 52, height: 68, rounded: 'rounded-lg', art: true },
  /** Cartes Récap (identité grade) */
  recap: { width: 88, height: 112, rounded: 'rounded-xl', art: true },
  /** Récap — illustration dominante (carte unique) */
  hero: { fluid: true, rounded: 'rounded-xl', art: true, maxHeight: 384, sizeClass: 'max-h-[24rem] max-w-[min(100%,320px)]' },
  /** Grille parcours des grades */
  gallery: { fluid: true, rounded: 'rounded-lg', art: true, sizeClass: 'max-h-[11rem] max-w-none w-full' },
  /** Fiche grade — cadre portrait serré (pas de bandes latérales) */
  detail: {
    fluid: true,
    rounded: 'rounded-2xl',
    art: true,
    sizeClass: 'w-full aspect-[3/4] max-w-[300px]'
  },
  /** Timeline / listes */
  chip: { width: 34, height: 44, rounded: 'rounded-md', art: true },
  /** Icône Lucide carrée (repli ou grades sans image) */
  icon: { width: 40, height: 40, rounded: 'rounded-xl', art: false }
};

function LucideFallback({ gradeId, size, className, rounded }) {
  const name = SPORT_GRADE_EMBLEM[gradeId] || 'Star';
  const Icon = ICONS[name] || Star;
  const color = SPORT_GRADE_ACCENT[gradeId] || '#2dd4bf';
  return (
    <div
      className={`flex shrink-0 items-center justify-center border border-[#0F4C5C]/60 bg-black/80 shadow-[0_0_20px_-6px] ${rounded} ${className}`}
      style={{
        width: size.width,
        height: size.height,
        boxShadow: `0 0 22px -8px ${color}55`
      }}
    >
      <Icon size={Math.round(Math.min(size.width, size.height) * 0.52)} style={{ color }} strokeWidth={2} />
    </div>
  );
}

export default function SportGradeEmblem({
  gradeId,
  /** @deprecated préférer layout */
  size,
  layout = 'icon',
  className = ''
}) {
  const preset = LAYOUT[layout] || LAYOUT.icon;
  const box = useMemo(() => {
    if (preset.fluid) return preset;
    if (size != null && layout === 'icon') {
      const s = Math.round(Number(size) || 40);
      return { width: s, height: s, rounded: preset.rounded, art: preset.art };
    }
    return preset;
  }, [size, layout, preset]);

  const artUrl = sportGradeArtUrl(gradeId);
  const useArt = box.art && hasSportGradeArt(gradeId);
  const [artFailed, setArtFailed] = useState(false);

  const color = SPORT_GRADE_ACCENT[gradeId] || '#2dd4bf';
  const isGrandMaitreDetail =
    gradeId === GRAND_MAITRE_DETAIL_GRADE_ID && layout === 'detail';

  const fluidAspect = box.tall ? '' : isGrandMaitreDetail ? 'aspect-[2/3]' : 'aspect-[3/4]';
  const fluidImgFit = isGrandMaitreDetail || box.tall ? 'object-contain' : 'object-cover';
  const imgRenderStyle = isGrandMaitreDetail ? 'auto' : 'pixelated';
  const fluidSizeClass = isGrandMaitreDetail
    ? 'w-full aspect-[2/3] max-w-[min(100%,360px)]'
    : box.sizeClass || 'max-h-[24rem] max-w-[min(100%,320px)]';

  if (!useArt || artFailed || !artUrl) {
    if (box.fluid) {
      return (
        <div
          className={`relative mx-auto flex w-full ${fluidAspect} items-center justify-center border border-[#0F4C5C]/60 bg-black/80 ${fluidSizeClass} ${box.rounded} ${className}`}
        >
          <LucideFallback
            gradeId={gradeId}
            size={{ width: 120, height: 120, rounded: 'rounded-lg' }}
            rounded="rounded-lg"
          />
        </div>
      );
    }
    return <LucideFallback gradeId={gradeId} size={box} className={className} rounded={box.rounded} />;
  }

  if (box.fluid) {
    return (
      <div
        className={`relative mx-auto w-full ${fluidAspect} overflow-hidden border border-[#0F4C5C]/70 bg-black/90 ${fluidSizeClass} ${box.rounded} ${className}`}
        style={{ boxShadow: `0 0 32px -12px ${color}88` }}
      >
        <img
          src={artUrl}
          alt=""
          role="presentation"
          decoding="async"
          className={`absolute inset-0 h-full w-full ${fluidImgFit}${isGrandMaitreDetail ? '' : ' image-rendering-pixelated'}`}
          style={{
            imageRendering: imgRenderStyle,
            objectPosition: sportGradeArtObjectPosition(gradeId)
          }}
          onError={() => setArtFailed(true)}
        />
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" aria-hidden />
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 overflow-hidden border border-[#0F4C5C]/70 bg-black/90 ${box.rounded} ${className}`}
      style={{
        width: box.width,
        height: box.height,
        boxShadow: `0 0 24px -10px ${color}66`
      }}
    >
      <img
        src={artUrl}
        alt=""
        role="presentation"
        decoding="async"
        className="h-full w-full object-cover image-rendering-pixelated"
        style={{
          imageRendering: 'pixelated',
          objectPosition: sportGradeArtObjectPosition(gradeId)
        }}
        onError={() => setArtFailed(true)}
      />
      <div
        className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10"
        aria-hidden
      />
    </div>
  );
}
