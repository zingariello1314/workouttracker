import React from 'react';
import { useTranslation } from '../../../utils/translations';
import SportGradeEmblem from './SportGradeEmblem';
import { sportGradeLabel, sportPalierLabel } from './SportGradeIdentity';

/**
 * Bandeau XP : une illustration + progression, grade mérité en texte.
 */
export default function SportGradeBarSummary({
  progressionGradeId,
  progressionTier,
  meritedGradeId,
  meritedTier,
  level,
  onClick,
  title
}) {
  const t = useTranslation();
  if (!progressionGradeId) return null;

  const progName = sportGradeLabel(progressionGradeId, t);
  const progPalier = sportPalierLabel(progressionTier, t);
  const merName = sportGradeLabel(meritedGradeId, t);
  const merPalier = sportPalierLabel(meritedTier, t);

  const sameMerited =
    meritedGradeId === progressionGradeId && Number(meritedTier) === Number(progressionTier);

  const Wrapper = onClick ? 'button' : 'div';
  const wrapProps = onClick
    ? { type: 'button', onClick, title: title || undefined }
    : {};

  return (
    <Wrapper
      {...wrapProps}
      className={`flex w-full min-w-0 items-stretch gap-3 rounded-lg text-left transition-colors ${
        onClick
          ? 'hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 px-0.5 py-0.5 -mx-0.5'
          : ''
      }`}
    >
      <SportGradeEmblem gradeId={progressionGradeId} layout="bar" className="self-center" />
      <div className="min-w-0 flex-1 py-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-600">
          {t('sport.grades.progressionLabel', 'Progression')}
        </p>
        <p className="truncate text-base font-bold leading-tight text-white">{progName}</p>
        <p className="text-[11px] font-medium text-teal-400/90">
          {progPalier}
          {level != null ? (
            <>
              <span className="text-slate-600 mx-1">·</span>
              <span className="text-slate-400 tabular-nums">
                {t('sport.grades.levelShort', `Niveau ${level}`, { level })}
              </span>
            </>
          ) : null}
        </p>
        <p className="mt-1.5 text-[10px] leading-snug text-slate-500">
          <span className="font-semibold uppercase tracking-wide text-amber-600/85">
            {t('sport.grades.meritedLabel', 'Grade mérité')}
          </span>
          {sameMerited ? (
            <span className="text-slate-500">
              {' '}
              —{' '}
              {t('sport.grades.meritedSameShort', 'identique à la progression')}
            </span>
          ) : (
            <span className="text-amber-100/90">
              {' '}
              · {merName} · {merPalier}
            </span>
          )}
        </p>
      </div>
    </Wrapper>
  );
}
