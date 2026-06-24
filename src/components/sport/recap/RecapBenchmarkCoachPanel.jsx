import React, { useMemo, useState } from 'react';
import { Gauge, Mountain, PersonStanding, Sparkles, Timer, TrendingUp } from 'lucide-react';
import { useWorkout } from '../../../context/WorkoutContext';
import { buildRecapBenchmarkInsights } from '../../../utils/sport/recapBenchmarkInsights';
import { RecapSection } from './components/RecapUiBlocks';
import RecapBenchmarkInsightDetailModal from './RecapBenchmarkInsightDetailModal';

const CATEGORY_META = {
  running: { icon: Timer, label: 'Course', accent: 'border-sky-500/35 bg-sky-950/20' },
  consistency: { icon: Gauge, label: 'Régularité', accent: 'border-teal-500/35 bg-teal-950/25' },
  strength: { icon: PersonStanding, label: 'Street / force', accent: 'border-violet-500/35 bg-violet-950/20' },
  progression: { icon: TrendingUp, label: 'Progression séries/reps', accent: 'border-cyan-500/35 bg-cyan-950/20' },
  wow: { icon: Mountain, label: 'Comparaisons', accent: 'border-amber-500/35 bg-amber-950/20' }
};

function InsightCard({ insight, onSelect }) {
  const meta = CATEGORY_META[insight.category] || CATEGORY_META.wow;
  const Icon = meta.icon;
  const clickable = Boolean(insight.drillDown);

  const inner = (
    <>
      <div className="mb-2 flex items-center gap-2">
        <Icon size={14} className="opacity-80" aria-hidden />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {meta.label}
        </span>
        {clickable ? (
          <span className="ml-auto text-[10px] text-teal-400/80">
            Détail →
          </span>
        ) : null}
      </div>
      <p className="text-[12px] leading-relaxed text-slate-100/95">{insight.text}</p>
    </>
  );

  if (!clickable) {
    return (
      <div className={`rounded-xl border p-4 ${meta.accent}`}>
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(insight)}
      className={`w-full rounded-xl border p-4 text-left transition-colors hover:border-teal-400/50 hover:bg-white/[0.02] ${meta.accent}`}
    >
      {inner}
    </button>
  );
}

/**
 * Section « Coach repères » — sous la première rangée d'insights horizon (vue Analyse).
 */
export default function RecapBenchmarkCoachPanel({
  snapshot,
  enrichment,
  garminData,
  assessment,
  getExerciseNameById,
  profileQuestionnaireRaw,
  period,
  t
}) {
  const tr = t || ((k, d) => d);
  const { requestOpenCalendarDay } = useWorkout();
  const [selectedInsight, setSelectedInsight] = useState(null);

  const { insights } = useMemo(
    () =>
      buildRecapBenchmarkInsights({
        snapshot,
        enrichment,
        garminData,
        assessment,
        getExerciseNameById,
        profileQuestionnaireRaw,
        period
      }),
    [snapshot, enrichment, garminData, assessment, getExerciseNameById, profileQuestionnaireRaw, period]
  );

  if (!insights?.length) return null;

  return (
    <>
      <RecapSection
        title={tr('recap.benchmark.title', 'Repères & comparaisons')}
        subtitle={tr(
          'recap.benchmark.subtitle',
          'Votre profil comparé aux standards course, street workout et population — pas seulement des chiffres bruts.'
        )}
      >
        <div className="mb-3 flex items-center gap-2 text-[11px] text-teal-200/80">
          <Sparkles size={14} className="text-teal-400" aria-hidden />
          <span>
            {tr(
              'recap.benchmark.hint',
              'Estimations locales basées sur vos données Momentum et des repères sportifs publics. Cliquez sur une carte pour le détail.'
            )}
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {insights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onSelect={setSelectedInsight}
            />
          ))}
        </div>
      </RecapSection>

      {selectedInsight ? (
        <RecapBenchmarkInsightDetailModal
          insight={selectedInsight}
          onClose={() => setSelectedInsight(null)}
          onOpenCalendarDay={requestOpenCalendarDay}
          t={tr}
        />
      ) : null}
    </>
  );
}
