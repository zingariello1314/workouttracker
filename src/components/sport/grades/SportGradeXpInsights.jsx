import React from 'react';
import { useTranslation } from '../../../utils/translations';

/**
 * Moyenne XP / jour actif + répartition par source (sous « Grade mérité »).
 */
export default function SportGradeXpInsights({ dailyInsights, totalXP }) {
  const t = useTranslation();
  if (!dailyInsights) return null;

  const { daysWithXp, averageDailyXp, breakdownRows } = dailyInsights;
  const total = Math.max(0, Math.round(Number(totalXP) || 0));

  if (total <= 0 && daysWithXp <= 0) return null;

  return (
    <div className="mt-4 space-y-3 border-t border-[#0F4C5C]/35 pt-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-500/90">
          {t('recap.grades.dailyXpTitle', 'Moyenne journalière d’XP')}
        </p>
        <p className="mt-1 text-lg font-bold tabular-nums text-white">
          {averageDailyXp.toLocaleString('fr-FR')} XP
          <span className="text-sm font-normal text-slate-500">
            {' '}
            / {t('recap.grades.dailyXpPerActiveDay', 'jour actif')}
          </span>
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          {daysWithXp > 0
            ? t(
                'recap.grades.dailyXpExplain',
                `${total.toLocaleString('fr-FR')} XP au total ÷ ${daysWithXp.toLocaleString('fr-FR')} jours calendrier où tu as gagné de l’XP (reps, kcal, pas, défis, etc.).`,
                {
                  total: total.toLocaleString('fr-FR'),
                  days: daysWithXp.toLocaleString('fr-FR')
                }
              )
            : t(
                'recap.grades.dailyXpNoDays',
                'Aucun jour avec activité XP enregistré pour l’instant — la moyenne apparaîtra dès que tu coches des séances ou synchronises Garmin.'
              )}
        </p>
      </div>

      {breakdownRows.length > 0 ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {t('recap.grades.xpBreakdownTitle', 'D’où vient ton XP Sport')}
          </p>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {breakdownRows.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-2 rounded-md border border-[#0F4C5C]/30 bg-black/40 px-2.5 py-1.5 text-[11px]"
              >
                <span className="min-w-0 truncate text-slate-400">{t(row.labelKey, row.fallback)}</span>
                <span className="shrink-0 font-semibold tabular-nums text-cyan-200/95">
                  +{row.xp.toLocaleString('fr-FR')} XP
                  {row.pctOfTotal != null && row.pctOfTotal > 0 ? (
                    <span className="ml-1.5 font-normal text-slate-500">
                      ({row.pctOfTotal.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %)
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
