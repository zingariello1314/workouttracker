import React from 'react';
import { useTranslation } from '../../../utils/translations';

export default function ExerciseGradeProgressBars({ progress, compact = false }) {
  const t = useTranslation();
  if (!progress || progress.maxed || !progress.bars?.length) return null;

  return (
    <div className={compact ? 'mt-2 space-y-1.5' : 'space-y-2'}>
      {!compact && progress.nextGradeLabel ? (
        <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-600/90">
          {t('recap.exerciseGrades.nextGrade', 'Prochain : {{grade}}', {
            grade: progress.nextGradeLabel
          })}
        </p>
      ) : null}
      {progress.bars.map((bar) => (
        <div key={bar.labelFallback}>
          <div className="flex justify-between gap-2 text-[9px] text-slate-500">
            <span>{t(bar.labelKey, bar.labelFallback)}</span>
            <span className="tabular-nums shrink-0">
              {bar.current.toLocaleString('fr-FR')} / {bar.target.toLocaleString('fr-FR')}
            </span>
          </div>
          <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-900">
            <div
              className={`h-full transition-all ${bar.met ? 'bg-emerald-500' : 'bg-cyan-600'}`}
              style={{ width: `${Math.min(100, bar.pct)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
