import React, { useState } from 'react';
import { exerciseGradeById } from '../../../services/xp/exerciseGradeLadder';
import {
  exerciseGradeArtObjectPosition,
  exerciseGradeArtUrl
} from '../../../services/xp/exerciseGradeArt';

/**
 * Badge visuel grade exercice — aligné sur SportGradeEmblem (gallery / detail).
 */
export default function ExerciseGradeEmblem({ gradeId, gradeLabel, layout = 'row', className = '' }) {
  const src = exerciseGradeArtUrl(gradeId);
  const g = exerciseGradeById(gradeId);
  const match = String(gradeLabel || '').match(/^(.*?)\s+(I{1,3})$/);
  const roman = match ? match[2] : null;
  const objectPosition = exerciseGradeArtObjectPosition(gradeId);
  const [failed, setFailed] = useState(false);

  const isGallery = layout === 'gallery';
  const isDetail = layout === 'detail';
  const isHero = layout === 'hero';
  const isFluid = isGallery || isDetail || isHero;

  if (isFluid) {
    const sizeClass =
      layout === 'detail'
        ? 'max-h-[24rem] max-w-[min(100%,320px)] w-full aspect-[3/4]'
        : layout === 'hero'
          ? 'max-h-[24rem] max-w-[min(100%,320px)] w-full aspect-[3/4]'
          : 'max-h-[11rem] max-w-none w-full aspect-[3/4]';
    const accent = g.accent || '#2dd4bf';
    const rounded = layout === 'detail' ? 'rounded-none' : 'rounded-lg';
    return (
      <div
        className={`relative mx-auto w-full overflow-hidden border border-[#0F4C5C]/70 bg-black/90 ${sizeClass} ${rounded} ${className}`}
        style={layout === 'gallery' ? undefined : { boxShadow: `0 0 32px -12px ${accent}88` }}
      >
        {!failed ? (
          <img
            src={src}
            alt={gradeLabel || ''}
            role="presentation"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover image-rendering-pixelated"
            style={{ imageRendering: 'pixelated', objectPosition }}
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
            {gradeLabel}
          </div>
        )}
        {roman && layout !== 'detail' && layout !== 'gallery' ? (
          <span className="absolute bottom-0 inset-x-0 bg-black/75 py-0.5 text-center text-[9px] font-bold tabular-nums text-white">
            {roman}
          </span>
        ) : null}
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" aria-hidden />
      </div>
    );
  }

  const imgSize = layout === 'chip' ? 'h-14 w-14' : 'h-12 w-12';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`relative shrink-0 overflow-hidden rounded-lg border border-[#0F4C5C]/40 bg-black/80 ${imgSize}`}
      >
        {!failed ? (
          <img
            src={src}
            alt={gradeLabel || 'Grade exercice'}
            className="h-full w-full object-cover image-rendering-pixelated"
            style={{ imageRendering: 'pixelated', objectPosition }}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
          />
        ) : null}
        {roman ? (
          <span className="absolute bottom-0 inset-x-0 bg-black/75 py-0.5 text-center text-[9px] font-bold tabular-nums text-white">
            {roman}
          </span>
        ) : null}
      </div>
      {layout !== 'chip' && gradeLabel ? (
        <span className="text-xs font-semibold text-slate-200">{gradeLabel}</span>
      ) : null}
    </div>
  );
}
