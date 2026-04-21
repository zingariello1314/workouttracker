import { useMemo } from 'react';
import { Dumbbell } from 'lucide-react';
import { buildRecapStrengthCompareModel } from '../../utils/sport/recapStrengthPeriodStats';
import { DASHBOARD_RECAP_PERIODS } from '../sidebar/historical/sidebarBodyRecapShared';
import DashboardSportPeriodInsights from './DashboardSportPeriodInsights.jsx';

const BAR_COLOR = '#0d9488';
const BORDER = 'border-[#2dd4bf]/55';
const ACCENT = 'text-teal-300';

/**
 * Bloc « Muscu (enregistré) » : reps cochées + pompes endurance, histogramme et stats période.
 * La période est pilotée par le parent (souvent la même que le récap corps Garmin).
 */
export default function DashboardStrengthRecordedModule({
  allData,
  recapPeriod,
  getExerciseNameById,
  refDate,
  onRecapPeriodChange
}) {
  const model = useMemo(
    () => buildRecapStrengthCompareModel(allData, recapPeriod, getExerciseNameById, refDate || new Date(), 8),
    [allData, recapPeriod, getExerciseNameById, refDate]
  );

  const changePct = model.changeValue;
  const trendArrow = changePct > 0.05 ? '↗' : changePct < -0.05 ? '↘' : '→';
  const trendColor =
    changePct > 0.05 ? 'text-emerald-300' : changePct < -0.05 ? 'text-rose-300' : 'text-slate-400';

  const te = model.topExercise;
  const topLabel =
    !te || !te.reps
      ? '—'
      : te.isEndurancePushups
        ? `Pompes (saisie Endurance) · ${te.reps.toLocaleString('fr-FR')} reps`
        : `${te.name && String(te.name).trim() ? te.name : `Exercice ${te.id}`} · ${te.reps.toLocaleString('fr-FR')} reps`;

  const maxLoadLabel =
    model.maxSingleWeight > 0 ? `${model.maxSingleWeight.toLocaleString('fr-FR')} kg` : '—';

  const periodLabel =
    DASHBOARD_RECAP_PERIODS.find((p) => p.id === recapPeriod)?.labelFull ||
    DASHBOARD_RECAP_PERIODS.find((p) => p.id === recapPeriod)?.label ||
    recapPeriod;

  return (
    <div className={`rounded-2xl border ${BORDER} bg-black p-4 shadow-[0_0_24px_rgba(45,212,191,0.12)] space-y-4`}>
      <div className={`rounded-xl border ${BORDER} bg-black/80 p-4 space-y-3`}>
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-teal-400 shrink-0" strokeWidth={2} />
          <div>
            <h4 className="text-sm font-semibold text-white tracking-tight">Muscu (enregistré)</h4>
            <p className="text-[10px] text-teal-200/70 mt-0.5">Période : {periodLabel} (sélecteur sous « Corps »)</p>
          </div>
        </div>

        <div>
          <div className="text-3xl font-bold text-white tabular-nums">
            {model.totalRepsCurr.toLocaleString('fr-FR')} reps
          </div>
          <div className={`mt-1 text-xs ${trendColor}`}>
            {trendArrow}{' '}
            {Math.abs(changePct).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}% vs période précédente
          </div>
        </div>

        <div className="flex h-28 items-end justify-between gap-1 pt-2 border-t border-teal-900/40">
          {model.chartData.map((bar, i) => (
            <div
              key={`str-bar-${bar.label}-${i}`}
              className="flex flex-1 h-full min-h-0 flex-col items-center justify-end gap-1"
            >
              <div
                className="w-full max-w-[28px] mx-auto rounded-t-sm min-h-[6px] transition-all"
                style={{
                  height: `${bar.currentValue}%`,
                  backgroundColor: BAR_COLOR
                }}
                title={`${bar.label}`}
              />
              <span className="text-[9px] text-slate-500 truncate w-full text-center leading-none">{bar.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={`rounded-xl border ${BORDER} bg-black/80 p-3 space-y-2`}>
        <div className="rounded-lg border border-teal-900/50 bg-black/60 px-3 py-2">
          <div className={`text-[10px] font-semibold uppercase tracking-wide ${ACCENT}`}>
            Exercice avec le plus de reps
          </div>
          <div className="text-sm font-semibold text-white mt-0.5 leading-snug">{topLabel}</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-teal-900/50 bg-black/60 px-3 py-2">
            <div className={`text-[10px] font-semibold uppercase tracking-wide ${ACCENT}`}>Reps totales</div>
            <div className="text-lg font-bold text-white tabular-nums">
              {model.totalRepsCurr.toLocaleString('fr-FR')}
            </div>
          </div>
          <div className="rounded-lg border border-teal-900/50 bg-black/60 px-3 py-2">
            <div className={`text-[10px] font-semibold uppercase tracking-wide ${ACCENT}`}>Jours actifs</div>
            <div className="text-lg font-bold text-white tabular-nums">{model.activeDays}</div>
          </div>
          <div className="rounded-lg border border-teal-900/50 bg-black/60 px-3 py-2">
            <div className={`text-[10px] font-semibold uppercase tracking-wide ${ACCENT}`}>Poids soulevé (kg·rep)</div>
            <div className="text-lg font-bold text-white tabular-nums">
              {Math.round(model.totalLiftedKgRepCurr).toLocaleString('fr-FR')}
            </div>
          </div>
          <div className="rounded-lg border border-teal-900/50 bg-black/60 px-3 py-2">
            <div className={`text-[10px] font-semibold uppercase tracking-wide ${ACCENT}`}>Charge max enregistrée</div>
            <div className="text-lg font-bold text-white tabular-nums">{maxLoadLabel}</div>
          </div>
        </div>
      </div>

      <DashboardSportPeriodInsights
        variant="embeddedInStrength"
        period={recapPeriod}
        onPeriodChange={onRecapPeriodChange}
      />
    </div>
  );
}
