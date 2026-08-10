import React from 'react';
import { useTranslation } from '../../../utils/translations';
import { SPORT_TIER_ROMAN } from '../../../services/xp/sportGradeCatalog';
import SportGradeEmblem from './SportGradeEmblem';

const GRADE_LABELS = {
  novice: 'Novice',
  adepte: 'Adepte',
  disciple: 'Disciple',
  athlete: 'Athlète',
  champion: 'Champion',
  elite: 'Élite',
  maitre: 'Maître',
  grand_maitre: 'Grand Maître',
  olympien: 'Olympien',
  parangon: 'Parangon'
};

export function sportGradeLabel(gradeId, t) {
  const key = `sport.grades.${gradeId}`;
  const fallback = GRADE_LABELS[gradeId] || gradeId;
  return typeof t === 'function' ? t(key, fallback) : fallback;
}

export function sportPalierLabel(tier, t) {
  const roman = SPORT_TIER_ROMAN[tier] || 'I';
  if (typeof t === 'function') {
    return t('sport.grades.palier', `Palier ${roman}`, { roman });
  }
  return `Palier ${roman}`;
}

/**
 * Emblème + nom de grade + palier (I/II/III).
 * @param {'progression'|'merited'} variant — quel grade/tier afficher
 */
export default function SportGradeIdentity({
  gradeId,
  tier,
  variant = 'progression',
  level,
  compact = false,
  showVariantHint = false,
  className = '',
  onClick,
  title
}) {
  const t = useTranslation();
  if (!gradeId) return null;

  const name = sportGradeLabel(gradeId, t);
  const palier = sportPalierLabel(tier, t);

  const interactive = typeof onClick === 'function';
  const Wrapper = interactive ? 'button' : 'div';
  const wrapperProps = interactive
    ? { type: 'button', onClick, title: title || undefined }
    : {};

  const baseCompact = `flex items-center gap-2 min-w-0 ${className}`;
  const baseCard =
    'flex flex-wrap items-center gap-3 rounded-xl border border-[#0F4C5C]/55 bg-gradient-to-br from-black via-[#041a14]/90 to-black p-3';

  if (compact) {
    return (
      <Wrapper
        {...wrapperProps}
        className={
          interactive
            ? `${baseCompact} text-left rounded-lg px-1 py-0.5 transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/60`
            : baseCompact
        }
      >
        <SportGradeEmblem gradeId={gradeId} layout="bar" />
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-semibold text-white">{name}</div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-teal-500/90">{palier}</div>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper
      {...wrapperProps}
      className={
        interactive
          ? `${baseCard} w-full text-left transition-colors hover:border-teal-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/60 ${className}`
          : `${baseCard} ${className}`
      }
    >
      <SportGradeEmblem gradeId={gradeId} layout="recap" />
      <div className="min-w-0 flex-1">
        {showVariantHint ? (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-600 mb-0.5">
            {variant === 'merited'
              ? t('sport.grades.meritedLabel', 'Grade mérité')
              : t('sport.grades.progressionLabel', 'Progression')}
          </p>
        ) : null}
        <div className="text-lg font-bold text-white tracking-tight">{name}</div>
        <div className="text-xs font-medium text-cyan-200/85">{palier}</div>
        {level != null ? (
          <div className="mt-1 text-[11px] text-slate-500 tabular-nums">
            {t('sport.grades.levelShort', `Niveau ${level}`, { level })}
          </div>
        ) : null}
      </div>
    </Wrapper>
  );
}
