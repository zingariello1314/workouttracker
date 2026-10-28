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

  const srcColors = ['var(--d)', 'var(--a2)', 'var(--a1)', 'var(--a3)', 'var(--a5)', 'var(--a4)'];

  return (
    <div className="rb-xp">
      <div className="bl">
        <p className="lb2">
          {t('recap.grades.dailyXpTitle', 'Moyenne journalière d’XP')}
        </p>
        <p className="avg">
          {averageDailyXp.toLocaleString('fr-FR')} XP
          <u>/ {t('recap.grades.dailyXpPerActiveDay', 'jour actif')}</u>
        </p>
        <small>
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
        </small>
      </div>

      {breakdownRows.length > 0 ? (
        <div className="bl">
          <p className="lb2">
            {t('recap.grades.xpBreakdownTitle', 'D’où vient ton XP Sport')}
          </p>
          <div className="srcg">
            {breakdownRows.map((row, index) => {
              const width = Math.max(0, Math.min(100, Number(row.pctOfTotal) || 0));
              return (
                <div key={row.id} className="src" style={{ '--c': srcColors[index % srcColors.length], '--w': `${width}%` }}>
                  <span>{t(row.labelKey, row.fallback)}</span>
                  <span>
                    <b>+{row.xp.toLocaleString('fr-FR')} XP</b>
                    {row.pctOfTotal != null && row.pctOfTotal > 0 ? (
                      <em>({row.pctOfTotal.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %)</em>
                    ) : null}
                  </span>
                  <i />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
