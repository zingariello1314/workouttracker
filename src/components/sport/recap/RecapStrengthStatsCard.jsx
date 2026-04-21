import React, { useMemo, useState, useEffect } from 'react';
import { Dumbbell } from 'lucide-react';
import { ActivityStatsCard } from '../../ui/ActivityStatsCard';
import { useWorkout } from '../../../context/WorkoutContext';
import { useTranslation } from '../../../utils/translations';
import { buildRecapStrengthCompareModel } from '../../../utils/sport/recapStrengthPeriodStats';
import { RECAP_SYNTHETIC_ENDURANCE_PUSHUPS_ID } from '../../../utils/sport/recapMuscleLoadEngine';
import {
  readStoredRecapViewPeriod,
  RECAP_VIEW_PERIODS,
  STRENGTH_CARD_PERIOD_LS,
} from '../../../utils/sport/recapViewPeriods';
import DashboardSportPeriodInsights from '../../dashboard/DashboardSportPeriodInsights.jsx';

const NUM_BARS_SIDEBAR = 5;
const NUM_BARS_DEFAULT = 8;

/**
 * Stats muscu (reps cochées + pompes endurance), même logique que le récap corps.
 * Période indépendante (localStorage) pour chaque instance (récap / dashboard / sidebar).
 *
 * @param {{ variant?: 'embedded' | 'sidebar' }} props
 */
export default function RecapStrengthStatsCard({ variant = 'embedded' }) {
  const t = useTranslation();
  const { data, getCurrentData, getExerciseNameById } = useWorkout();
  const [cardPeriod, setCardPeriod] = useState(() =>
    readStoredRecapViewPeriod(STRENGTH_CARD_PERIOD_LS, '30d')
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(STRENGTH_CARD_PERIOD_LS, cardPeriod);
    } catch {
      // ignore
    }
  }, [cardPeriod]);

  const snapshot = getCurrentData?.() || data || {};
  const numBars = variant === 'sidebar' ? NUM_BARS_SIDEBAR : NUM_BARS_DEFAULT;

  const built = useMemo(
    () =>
      buildRecapStrengthCompareModel(
        snapshot,
        cardPeriod,
        getExerciseNameById,
        new Date(),
        numBars
      ),
    [snapshot, cardPeriod, getExerciseNameById, numBars]
  );

  const mainValue = `${Math.round(built.totalRepsCurr).toLocaleString('fr-FR')} reps`;

  const topExerciseLabel = built.topExercise
    ? built.topExercise.isEndurancePushups || built.topExercise.id === RECAP_SYNTHETIC_ENDURANCE_PUSHUPS_ID
      ? `${t('recap.zones.endurancePushupsExercise', 'Pompes (endurance)')} · ${Math.round(built.topExercise.reps)} reps`
      : `${built.topExercise.name} · ${Math.round(built.topExercise.reps)} reps`
    : '—';

  const wrap =
    variant === 'sidebar'
      ? 'max-w-none [&_.text-3xl]:text-2xl [&_.h-32]:h-24'
      : 'max-w-full sm:max-w-md';

  return (
    <div className={variant === 'sidebar' ? 'w-full' : ''}>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {RECAP_VIEW_PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setCardPeriod(p.id)}
            aria-pressed={cardPeriod === p.id}
            className={`rounded-full border px-2 py-1 text-[11px] font-medium transition ${
              cardPeriod === p.id
                ? variant === 'embedded'
                  ? 'border-[#0F5C45] bg-[#0F5C45]/35 text-white'
                  : 'border-cyan-400/70 bg-cyan-500/25 text-cyan-50'
                : variant === 'embedded'
                  ? 'border-[#0F4C5C]/60 bg-black text-teal-200/90 hover:border-[#0F5C45]/60'
                  : 'border-slate-600/80 bg-slate-800/60 text-slate-300 hover:border-slate-500'
            }`}
          >
            {t(p.labelKey)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <ActivityStatsCard
          className={wrap}
          title="Muscu (enregistré)"
          icon={<Dumbbell className="h-6 w-6" />}
          mainValue={mainValue}
          changeValue={Number(built.changeValue.toFixed(2))}
          changeDescription="vs période précédente"
          chartData={built.chartData}
          sportShell={variant === 'embedded'}
          primaryBarClassName={variant === 'embedded' ? 'bg-[#0F4C5C]' : 'bg-cyan-500'}
          secondaryBarClassName={
            variant === 'embedded'
              ? 'bg-[#0F5C45]/45 dark:bg-[#0F5C45]/35'
              : 'bg-cyan-200/25 dark:bg-cyan-900'
          }
          chartAxisDensity={variant === 'sidebar' ? 'compact' : 'default'}
        />
        <div
          className={`w-full rounded-xl p-3 text-xs ${
            variant === 'embedded'
              ? 'border-2 border-[#0F4C5C]/65 bg-black text-teal-100/90'
              : 'border border-slate-700/80 bg-slate-900/85 text-slate-300'
          } ${variant === 'sidebar' ? 'max-w-none' : 'max-w-sm'}`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div
              className={`rounded-lg border p-2 sm:col-span-2 ${
                variant === 'embedded'
                  ? 'border-[#0F4C5C]/45 bg-black'
                  : 'border-slate-700/70 bg-slate-950/60'
              }`}
            >
              <div className={variant === 'embedded' ? 'text-teal-200/70' : 'text-slate-500'}>
                Exercice avec le plus de reps
              </div>
              <div className="font-semibold text-white truncate">{topExerciseLabel}</div>
            </div>
            <div
              className={`rounded-lg border p-2 ${
                variant === 'embedded'
                  ? 'border-[#0F4C5C]/45 bg-black'
                  : 'border-slate-700/70 bg-slate-950/60'
              }`}
            >
              <div className={variant === 'embedded' ? 'text-teal-200/70' : 'text-slate-500'}>Reps totales</div>
              <div className="font-semibold text-white">
                {Math.round(built.totalRepsCurr).toLocaleString('fr-FR')}
              </div>
            </div>
            <div
              className={`rounded-lg border p-2 ${
                variant === 'embedded'
                  ? 'border-[#0F4C5C]/45 bg-black'
                  : 'border-slate-700/70 bg-slate-950/60'
              }`}
            >
              <div className={variant === 'embedded' ? 'text-teal-200/70' : 'text-slate-500'}>Jours actifs</div>
              <div className="font-semibold text-white">{built.activeDays}</div>
            </div>
            <div
              className={`rounded-lg border p-2 ${
                variant === 'embedded'
                  ? 'border-[#0F4C5C]/45 bg-black'
                  : 'border-slate-700/70 bg-slate-950/60'
              }`}
            >
              <div className={variant === 'embedded' ? 'text-teal-200/70' : 'text-slate-500'}>
                Poids soulevé (kg·rep)
              </div>
              <div className="font-semibold text-white">
                {Math.round(built.totalLiftedKgRepCurr).toLocaleString('fr-FR')}
              </div>
            </div>
            <div
              className={`rounded-lg border p-2 ${
                variant === 'embedded'
                  ? 'border-[#0F4C5C]/45 bg-black'
                  : 'border-slate-700/70 bg-slate-950/60'
              }`}
            >
              <div className={variant === 'embedded' ? 'text-teal-200/70' : 'text-slate-500'}>
                Charge max enregistrée
              </div>
              <div className="font-semibold text-white">
                {built.maxSingleWeight > 0 ? `${built.maxSingleWeight.toFixed(1)} kg` : '—'}
              </div>
            </div>
          </div>
          {variant === 'embedded' ? (
            <DashboardSportPeriodInsights
              variant="embeddedInStrength"
              period={cardPeriod}
              onPeriodChange={setCardPeriod}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
