import React from 'react';
import { ListOrdered } from 'lucide-react';
import { formatDuration, formatPacePerKm, formatSpeed } from '../../GarminTab/utils/garminFormatters';
import { useTranslation } from '../../../../utils/translations';

/**
 * Tableau km par km : allure, vitesse, synthèse en pied de tableau.
 * @param {{ rows: object[], totals: object }} splits
 */
export default function RunningKmSplitsTable({ splits }) {
  const t = useTranslation();
  if (!splits?.rows?.length) return null;

  const { rows, totals } = splits;

  return (
    <section style={{ marginTop: 28 }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ListOrdered className="ic" />
        {t('endurance.running.details.kmSplitsTitle')}
      </h3>
      <div className="tw">
        <table className="kt">
          <thead>
            <tr>
              <th>{t('endurance.running.details.kmSplitsColKm')}</th>
              <th>{t('endurance.running.details.kmSplitsColPace')}</th>
              <th>{t('endurance.running.details.kmSplitsColSpeed')}</th>
              <th>{t('endurance.running.details.kmSplitsColTime')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`km-${row.km}-${row.label}`}>
                <td>{row.label}</td>
                <td className="num">{row.paceSecPerKm != null ? formatPacePerKm(row.paceSecPerKm) : '—'}</td>
                <td className="num">{row.kmh != null ? formatSpeed(row.kmh) : '—'}</td>
                <td className="num">{formatDuration(Math.round(row.durationSeconds))}</td>
              </tr>
            ))}
            {totals ? (
              <tr className="tt">
                <td>{t('endurance.running.details.kmSplitsTotal')}</td>
                <td className="num">
                  {totals.paceSecPerKm != null ? formatPacePerKm(totals.paceSecPerKm) : '—'}
                  <span className="tiny" style={{ display: 'block', fontWeight: 500 }}>
                    {t('endurance.running.details.kmSplitsOverallPace')}
                  </span>
                </td>
                <td className="num">{totals.kmh != null ? formatSpeed(totals.kmh) : '—'}</td>
                <td className="num">
                  {totals.durationSeconds > 0 ? formatDuration(Math.round(totals.durationSeconds)) : '—'}
                  {totals.distanceKm > 0 ? (
                    <span className="tiny" style={{ display: 'block', fontWeight: 500 }}>
                      {totals.distanceKm.toFixed(2)} km
                    </span>
                  ) : null}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
