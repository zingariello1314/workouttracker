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
    <section className="mt-8">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-teal-200/80">
        <ListOrdered className="h-4 w-4 text-teal-400" />
        {t('endurance.running.details.kmSplitsTitle')}
      </h2>
      <div className="overflow-x-auto rounded-2xl border border-teal-500/40 bg-black shadow-lg shadow-black/30">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead className="border-b border-teal-700/50 bg-teal-950/30 text-[11px] font-semibold uppercase tracking-wider text-teal-200/70">
            <tr>
              <th className="px-4 py-3">{t('endurance.running.details.kmSplitsColKm')}</th>
              <th className="px-4 py-3">{t('endurance.running.details.kmSplitsColPace')}</th>
              <th className="px-4 py-3">{t('endurance.running.details.kmSplitsColSpeed')}</th>
              <th className="px-4 py-3">{t('endurance.running.details.kmSplitsColTime')}</th>
            </tr>
          </thead>
          <tbody className="text-teal-50/95">
            {rows.map((row) => (
              <tr
                key={`km-${row.km}-${row.label}`}
                className="border-t border-teal-800/35 transition hover:bg-teal-950/25"
              >
                <td className="px-4 py-3 font-semibold text-white tabular-nums">{row.label}</td>
                <td className="px-4 py-3 tabular-nums text-teal-100">
                  {row.paceSecPerKm != null ? formatPacePerKm(row.paceSecPerKm) : '—'}
                </td>
                <td className="px-4 py-3 tabular-nums text-teal-100">
                  {row.kmh != null ? formatSpeed(row.kmh) : '—'}
                </td>
                <td className="px-4 py-3 tabular-nums text-teal-200/80">
                  {formatDuration(Math.round(row.durationSeconds))}
                </td>
              </tr>
            ))}
          </tbody>
          {totals && (
            <tfoot className="border-t-2 border-teal-500/50 bg-teal-950/40 text-teal-100">
              <tr>
                <td className="px-4 py-4 font-semibold uppercase tracking-wide text-teal-200/90">
                  {t('endurance.running.details.kmSplitsTotal')}
                </td>
                <td className="px-4 py-4 tabular-nums font-semibold text-white">
                  {totals.paceSecPerKm != null ? formatPacePerKm(totals.paceSecPerKm) : '—'}
                  <span className="mt-1 block text-[11px] font-normal text-teal-300/55">
                    {t('endurance.running.details.kmSplitsOverallPace')}
                  </span>
                </td>
                <td className="px-4 py-4 tabular-nums font-semibold text-white">
                  {totals.kmh != null ? formatSpeed(totals.kmh) : '—'}
                </td>
                <td className="px-4 py-4 tabular-nums font-semibold text-white">
                  {totals.durationSeconds > 0
                    ? formatDuration(Math.round(totals.durationSeconds))
                    : '—'}
                  {totals.distanceKm > 0 ? (
                    <span className="mt-1 block text-[11px] font-normal text-teal-300/55">
                      {totals.distanceKm.toFixed(2)} km
                    </span>
                  ) : null}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}
