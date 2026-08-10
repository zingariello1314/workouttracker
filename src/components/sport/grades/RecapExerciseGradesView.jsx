import React, { useMemo, useState } from 'react';
import { useTranslation } from '../../../utils/translations';
import { useExerciseGrades } from '../../../hooks/useExerciseGrades';
import ExerciseGradeVitalsForm, { useExerciseGradeVitalsRefresh } from './ExerciseGradeVitalsForm';
import ExerciseGradeEmblem from './ExerciseGradeEmblem';
import ExerciseGradeProgressBars from './ExerciseGradeProgressBars';
import ExerciseGradeDetailView from './ExerciseGradeDetailView';

function headlineForRow(row) {
  const { metric, metrics, grade } = row;
  if (metric === 'hold_seconds') {
    return { value: metrics.lifetimeHoldSeconds || grade.peakValue || 0, unit: 's' };
  }
  if (metric === 'max_weight_kg') {
    return { value: Math.round(metrics.totalVolumeKg || grade.lifetimeValue || 0), unit: 'kg×reps' };
  }
  return { value: metrics.totalReps ?? grade.lifetimeValue ?? 0, unit: 'reps' };
}

function ExerciseGradeCard({ row, t, onSelect }) {
  const { grade: g, label, muscleGroup, metrics, progress } = row;
  const head = headlineForRow(row);

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(row.benchmarkKey)}
        className="flex h-full w-full flex-col rounded-xl border p-3 text-left transition-colors hover:border-teal-500/50 hover:bg-black/70 border-[#0F4C5C]/45 bg-black/55"
      >
        <div className="flex flex-1 gap-2 min-h-0">
          <ExerciseGradeEmblem gradeId={g.gradeId} gradeLabel={g.gradeLabel} layout="chip" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-white line-clamp-2 leading-tight">{label}</p>
            <p className="mt-0.5 text-[9px] text-slate-500 capitalize line-clamp-1">
              {t(`recap.muscleGroup.${muscleGroup}`, muscleGroup)}
            </p>
            <p className="mt-1 text-[10px] font-bold tabular-nums" style={{ color: g.accent }}>
              {g.gradeLabel}
            </p>
          </div>
        </div>
        <div className="mt-3 border-t border-[#0F4C5C]/30 pt-2">
          <p className="text-2xl font-bold tabular-nums leading-none text-white">
            {Number(head.value).toLocaleString('fr-FR')}
          </p>
          <p className="text-[9px] uppercase tracking-wide text-slate-500">{head.unit}</p>
          {(metrics.checkCount ?? 0) > 0 ? (
            <p className="mt-1 text-[10px] tabular-nums text-teal-400/90">
              {(metrics.checkCount ?? 0).toLocaleString('fr-FR')}×{' '}
              {t('recap.exerciseGrades.checkedShort', 'coché')}
            </p>
          ) : null}
          <ExerciseGradeProgressBars progress={progress} compact />
        </div>
      </button>
    </li>
  );
}

export default function RecapExerciseGradesView() {
  const t = useTranslation();
  const [sortMode, setSortMode] = useState('grade');
  const [selectedKey, setSelectedKey] = useState(null);
  const { tick, bump } = useExerciseGradeVitalsRefresh();
  const { vitals, rows, totalGradedExercises } = useExerciseGrades({
    sortMode,
    vitalsRefreshKey: tick
  });

  const vitalsForForm = useMemo(() => vitals, [vitals, tick]);

  if (selectedKey) {
    return (
      <ExerciseGradeDetailView
        benchmarkKey={selectedKey}
        onBack={() => setSelectedKey(null)}
        vitalsRefreshKey={tick}
      />
    );
  }

  return (
    <div className="space-y-5">
      <ExerciseGradeVitalsForm vitals={vitalsForForm} onSaved={bump} />

      <section className="rounded-xl border border-[#0F4C5C]/45 bg-black/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-cyan-100">
              {t('recap.exerciseGrades.listTitle', 'Classement')}
            </h3>
            <p className="text-[10px] text-slate-500">
              {totalGradedExercises}{' '}
              {t('recap.exerciseGrades.withData', 'exercices suivis')}
            </p>
          </div>
          <label className="flex items-center gap-2 text-[11px] text-slate-400">
            {t('recap.exerciseGrades.sort', 'Trier')}
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              className="rounded-md border border-[#0F4C5C]/50 bg-black px-2 py-1.5 text-xs text-white"
            >
              <option value="grade">{t('recap.exerciseGrades.sortGrade', 'Meilleur → pire grade')}</option>
              <option value="muscle">{t('recap.exerciseGrades.sortMuscle', 'Groupe musculaire')}</option>
              <option value="alpha">{t('recap.exerciseGrades.sortAlpha', 'Alphabétique')}</option>
            </select>
          </label>
        </div>
        <ul className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4 max-h-[min(75vh,720px)] overflow-y-auto pr-1">
          {rows.map((row) => (
            <ExerciseGradeCard key={row.benchmarkKey} row={row} t={t} onSelect={setSelectedKey} />
          ))}
        </ul>
      </section>
    </div>
  );
}
