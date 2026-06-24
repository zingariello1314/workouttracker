import React from 'react';
import { Dumbbell, Sparkles } from 'lucide-react';

function ScoreBar({ score, accent = 'sky' }) {
  const tone =
    accent === 'amber'
      ? 'bg-amber-400'
      : accent === 'emerald'
        ? 'bg-emerald-400'
        : 'bg-sky-400';
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, score)}%` }} />
    </div>
  );
}

function CriterionRow({ label, score, detail }) {
  if (score == null) return null;
  return (
    <div className="rounded-lg border border-slate-600/40 bg-slate-900/40 p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-sm text-slate-200">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-sky-100">{score}/100</span>
      </div>
      <ScoreBar score={score} />
      {detail ? <p className="mt-2 text-xs leading-relaxed text-slate-400">{detail}</p> : null}
    </div>
  );
}

/**
 * Notes musculation + globale dans le détail jour calendrier.
 */
export default function CalendarDayTrainingScorePanel({ strength, holistic, t }) {
  const tr = t || ((k, d) => d);
  if (!strength?.score && !holistic?.score) return null;

  return (
    <div className="space-y-4">
      {strength?.score != null ? (
        <div className="rounded-xl border border-violet-500/35 bg-violet-950/20 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="flex items-center gap-2 font-medium text-violet-100">
              <Dumbbell className="h-4 w-4" />
              {tr('calendar.heatmap.dayDetails.strengthScoreTitle', 'Note musculation')}
            </h4>
            <span className="text-2xl font-bold tabular-nums text-violet-50">{strength.score}</span>
          </div>
          <ScoreBar score={strength.score} accent="amber" />
          <p className="mt-2 text-xs text-violet-200/75">
            {tr(
              'calendar.heatmap.dayDetails.strengthScoreHint',
              'Reps, difficulté des exercices et kg soulevés — le poids du corps est valorisé via la difficulté (tractions, dips…).'
            )}
          </p>
          <div className="mt-3 space-y-2">
            {strength.criteria?.map((c) => (
              <CriterionRow key={c.id} label={c.label} score={c.score} detail={c.detail} />
            ))}
          </div>
        </div>
      ) : null}

      {holistic?.score != null ? (
        <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/15 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="flex items-center gap-2 font-medium text-emerald-100">
              <Sparkles className="h-4 w-4" />
              {tr('calendar.heatmap.dayDetails.holisticScoreTitle', 'Note globale du jour')}
            </h4>
            <span className="text-2xl font-bold tabular-nums text-emerald-50">{holistic.score}</span>
          </div>
          <ScoreBar score={holistic.score} accent="emerald" />
          <p className="mt-2 text-xs text-emerald-200/75">
            {tr(
              'calendar.heatmap.dayDetails.holisticScoreHint',
              'Combine musculation, endurance, Garmin et ressenti si saisis. Plus vous complétez, plus la note est fiable — sans pénaliser l’absence de sommeil ou de stress.'
            )}
          </p>
          <div className="mt-3 space-y-2">
            {holistic.criteria?.map((c) => (
              <CriterionRow key={c.id} label={c.label} score={c.score} detail={c.detail} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
