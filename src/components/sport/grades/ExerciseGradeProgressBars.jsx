import React from 'react';
import { useTranslation } from '../../../utils/translations';

export default function ExerciseGradeProgressBars({ progress, compact = false }) {
  const t = useTranslation();
  if (!progress || progress.maxed) return null;
  const hasBars = progress.bars?.length > 0;
  const voieE = progress.voieE;

  if (!hasBars && !voieE) return null;

  return (
    <div className={compact ? 'mt-2 space-y-1.5' : 'space-y-2'}>
      {!compact && progress.nextGradeLabel ? (
        <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-600/90">
          {t('recap.exerciseGrades.nextGrade', 'Prochain : {{grade}}', {
            grade: progress.nextGradeLabel
          })}
        </p>
      ) : null}
      {!compact && progress.parallelLevel ? (
        <p className="text-[10px] text-slate-400">
          {t('recap.exerciseGrades.parallelLevel', 'Niveau {{n}}', {
            n: progress.parallelLevel
          })}
          {progress.weightedLifetime != null ? (
            <span className="text-slate-500">
              {' '}
              · {Math.round(progress.weightedLifetime).toLocaleString('fr-FR')}{' '}
              {t('recap.exerciseGrades.repEqShort', 'rep eq.')}
            </span>
          ) : null}
        </p>
      ) : null}
      {hasBars
        ? progress.bars.map((bar) => (
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
          ))
        : null}
      {voieE && !progress.maxed ? (
        <div className="rounded-md border border-violet-500/30 bg-violet-950/20 px-2 py-1.5">
          <div className="flex justify-between gap-2 text-[9px]">
            <span className="font-semibold text-violet-200">
              {t('recap.exerciseGrades.voieE', 'Voie E — équilibre 70 %')}
            </span>
            <span className="tabular-nums text-violet-300/90">
              {voieE.minPct.toLocaleString('fr-FR')} %
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-900">
            <div
              className={`h-full ${voieE.met ? 'bg-violet-400' : 'bg-violet-700'}`}
              style={{ width: `${Math.min(100, voieE.minPct)}%` }}
            />
          </div>
          <p className="mt-1 text-[8px] leading-snug text-slate-500">
            {t(
              'recap.exerciseGrades.voieEHint',
              'Pic, volume et coches ≥ {{pct}} % en même temps → grade suivant',
              { pct: progress.voieEMinPct ?? 70 }
            )}
          </p>
        </div>
      ) : null}
    </div>
  );
}
