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
import { buildFamilyFocusMeshColors, buildMuscleFocusMeshColors } from '../../../services/anatomy/ecorcheMeshColors';
import { ANATOMY } from './anatomyTheme';

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
    <div className={`${ANATOMY.card} ${ANATOMY.cardPad} space-y-3 ${className}`}>
      <h3 className={ANATOMY.labelUpper}>{title}</h3>
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
    const focused = buildMuscleFocusMeshColors(muscleId, groupId, { dimOthers: true });
    if (focused) return focused;
    if (!groupId) return {};
    return buildFamilyFocusMeshColors([groupId], { dimOthers: true });
  }, [muscleId, groupId]);

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
        ? 'text-[#3897F0]'
        : ANATOMY.muted;

  return (
    <aside className="space-y-3 lg:sticky lg:top-28">
      <RailCard title={t('anatomy.location', 'Localisation')}>
        <BodyMap
          muscleColors={locColors}
          pickMode
          detailSidebar
          forcedViewPreset="frontLow"
        />
        <p className={`text-center text-xs font-medium ${ANATOMY.accent}`}>{muscle.name}</p>
      </RailCard>

      <RailCard title={t('anatomy.inYourProgram', 'Dans ton programme')}>
        {insight ? (
          <>
            <div>
              <div className={`text-[11px] mb-1 ${ANATOMY.muted}`}>
                {t('anatomy.weeklyVolume', 'Volume hebdo')}
              </div>
              <div className="text-lg font-semibold text-white tabular-nums">
                {insight.share} {t('anatomy.repsShareShort', 'parts reps')}
              </div>
              <div className={`mt-2 ${ANATOMY.progressTrack}`}>
                <div
                  className={ANATOMY.progressFill}
                  style={{ width: `${Math.min(100, insight.share * 4)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[11px] ${ANATOMY.muted}`}>{t('anatomy.status', 'Statut')}</span>
              <span className={`text-sm font-medium ${statusClass}`}>{statusLabel}</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('recap')}
              className={`inline-flex items-center gap-1 text-[11px] ${ANATOMY.accent} ${ANATOMY.accentHover}`}
            >
              {t('anatomy.openRecap', 'Ouvrir le Récap corps')}
              <ChevronRight className="h-3 w-3" />
            </button>
          </>
        ) : (
          <p className={`text-xs ${ANATOMY.muted}`}>{t('anatomy.noRecentVolume', 'Peu ou pas de volume récent.')}</p>
        )}
      </RailCard>

      {insight?.top?.length ? (
        <RailCard title={t('anatomy.sessionExercises', 'Exercices de ta séance')}>
          <ul className="divide-y divide-white/[0.06]">
            {insight.top.map((row) => (
              <li
                key={row.exerciseId ?? row.name}
                className={`py-2 text-xs leading-snug ${ANATOMY.muted}`}
              >
                {formatExerciseLabel(row, t)}
              </li>
            ))}
          </ul>
        </RailCard>
      ) : null}

      {relatedMuscles.length > 0 ? (
        <RailCard title={t('anatomy.relatedMuscles', 'Muscles liés')}>
          <ul className="space-y-1.5 text-xs">
            {relatedMuscles.map((line) => (
              <li key={line} className={ANATOMY.muted}>
                {line}
              </li>
            ))}
          </ul>
        </RailCard>
      ) : null}
    </aside>
  );
}
