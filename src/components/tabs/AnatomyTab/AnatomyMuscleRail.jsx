import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import BodyMap from '../../sport/recap/BodyMap';
import { useTranslation } from '../../../utils/translations';
import { useWorkout } from '../../../context/WorkoutContext';
import {
  computeRecapMuscleState,
  RECAP_SYNTHETIC_ENDURANCE_PUSHUPS_ID
} from '../../../utils/sport/recapMuscleLoadEngine';
import { getAnatomyMuscle } from '../../../data/anatomy/anatomyRegistry';
import { buildFamilyFocusMeshColors } from '../../../services/anatomy/ecorcheMeshColors';

function formatExerciseLabel(row, t) {
  const raw = row.name || row.exerciseId || '';
  if (raw === RECAP_SYNTHETIC_ENDURANCE_PUSHUPS_ID) {
    return t('anatomy.endurancePushupsLabel', 'Pompes (onglet Endurance)');
  }
  if (String(raw).startsWith('__recap_')) {
    return t('anatomy.syntheticExercise', 'Volume agrégé');
  }
  return raw;
}

function RailCard({ title, children, className = '' }) {
  return (
    <div
      className={`rounded-xl border border-slate-700/40 bg-slate-950/45 p-4 space-y-3 ${className}`}
    >
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
      {children}
    </div>
  );
}

/** Colonne droite fiche muscle (maquettes). */
export default function AnatomyMuscleRail({ muscleId, relatedMuscles = [] }) {
  const t = useTranslation();
  const { getCurrentData, getExerciseNameById, setActiveTab } = useWorkout();
  const muscle = getAnatomyMuscle(muscleId);
  const groupId = muscle?.visualGroupId;

  const insight = useMemo(() => {
    if (!groupId) return null;
    const data = getCurrentData?.();
    if (!data) return null;
    const state = computeRecapMuscleState(data, '7d', getExerciseNameById, new Date());
    const share = Math.round(state.repShareByGroup?.[groupId] ?? 0);
    const top = (state.topExercisesByGroup?.[groupId] || []).slice(0, 3);
    return { share, top, window: state.window };
  }, [groupId, getCurrentData, getExerciseNameById]);

  const locColors = useMemo(() => {
    if (!groupId) return {};
    return buildFamilyFocusMeshColors([groupId], { dimOthers: true });
  }, [groupId]);

  if (!muscle) return null;

  const statusLabel =
    insight && insight.share >= 8
      ? t('anatomy.statusWellTrained', 'Bien entraîné')
      : insight && insight.share >= 3
        ? t('anatomy.statusModerate', 'Volume modéré')
        : t('anatomy.statusLow', 'Peu sollicité');

  const statusClass =
    insight && insight.share >= 8
      ? 'text-emerald-400'
      : insight && insight.share >= 3
        ? 'text-cyan-300/90'
        : 'text-slate-500';

  return (
    <aside className="space-y-3 lg:sticky lg:top-[10.5rem]">
      <RailCard title={t('anatomy.inYourProgram', 'Dans ton programme')}>
        {insight ? (
          <>
            <div>
              <div className="text-[11px] text-slate-500 mb-1">
                {t('anatomy.weeklyVolume', 'Volume hebdo')}
              </div>
              <div className="text-lg font-semibold text-slate-100 tabular-nums">
                {insight.share} {t('anatomy.repsShareShort', 'parts reps')}
              </div>
              <div className="mt-2 h-1 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan-500/80"
                  style={{ width: `${Math.min(100, insight.share * 4)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">{t('anatomy.status', 'Statut')}</div>
              <div className={`text-sm font-medium ${statusClass}`}>{statusLabel}</div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('recap')}
              className="inline-flex items-center gap-1 text-[11px] text-cyan-400/90 hover:text-cyan-300"
            >
              {t('anatomy.openRecap', 'Récap corps')}
              <ChevronRight className="h-3 w-3" />
            </button>
          </>
        ) : (
          <p className="text-xs text-slate-500">{t('anatomy.noRecentVolume', 'Peu ou pas de volume récent.')}</p>
        )}
      </RailCard>

      {insight?.top?.length ? (
        <RailCard title={t('anatomy.sessionExercises', 'Exercices de ta séance')}>
          <ul className="space-y-2 text-xs text-slate-400">
            {insight.top.map((row) => (
              <li key={row.exerciseId ?? row.name} className="leading-snug">
                {formatExerciseLabel(row, t)}
              </li>
            ))}
          </ul>
        </RailCard>
      ) : null}

      {relatedMuscles.length > 0 ? (
        <RailCard title={t('anatomy.relatedMuscles', 'Muscles liés')}>
          <ul className="space-y-1.5 text-xs text-slate-400">
            {relatedMuscles.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </RailCard>
      ) : null}

      <RailCard title={t('anatomy.location', 'Localisation')}>
        <BodyMap
          muscleColors={locColors}
          pickMode
          detailSidebar
          forcedViewPreset="frontLow"
        />
        <p className="text-center text-xs font-medium text-cyan-400/90">{muscle.name}</p>
      </RailCard>
    </aside>
  );
}
