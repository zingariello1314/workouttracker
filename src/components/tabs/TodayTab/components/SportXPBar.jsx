/**
 * Barre XP Sport — HUD repliable (grille, hachures, ghost niveau).
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useSportGrade } from '../../../../hooks/useSportGrade';
import SportGradeEmblem from '../../../sport/grades/SportGradeEmblem';
import { sportGradeLabel, sportPalierLabel } from '../../../sport/grades/SportGradeIdentity';
import { navigateFromSportXpBar } from '../../../../utils/sport/sportXpBarNavigate';
import { useWorkout } from '../../../../context/WorkoutContext';
import {
  SPORT_XP_PER_TOTAL_KG_VOLUME,
  SPORT_XP_LIFTED_VOLUME_CAP,
  SPORT_XP_PER_NUTRITION_FOOD_REGISTERED,
  SPORT_XP_PER_ACTIVE_CALORIE,
  SPORT_XP_PER_CHECKED_EXERCISE,
  sportXpReferenceTenRepsTwoStarBodyweight
} from '../../../../services/xp/xpCalculations';
import { STEPS_XP_RATE_VERIFIED, STEPS_XP_RATE_DECLARATIVE } from '../../../../utils/sport/manualDailyWalkUtils';
import { useTranslation } from '../../../../utils/translations';
import { formatCalendarSportDuration } from '../../../../utils/calendarSportStatsFormat';
import {
  compareDetailFieldOrder,
  getLayoutOrder,
  getXpAppearancePreference,
  isDetailFieldOn,
  listAllSportXpAccents,
  resolveSportXpAccentHex,
  subscribeXpAppearance,
  updateXpAppearancePreference
} from '../../../../utils/xpAppearancePreference';
import styles from './SportXPBar.module.css';

function fmt(n, opts) {
  return Number(n || 0).toLocaleString('fr-FR', opts);
}

function pctOf(part, total) {
  if (!total || total <= 0) return '0 %';
  const x = (part / total) * 100;
  if (x > 0 && x < 0.1) return '<0,1 %';
  return `${x.toFixed(1).replace('.', ',')} %`;
}

const ROW_FIELD = {
  weightedReps: 'rowWeightedReps',
  checked: 'rowChecked',
  volume: 'rowVolume',
  stretches: 'rowStretches',
  challenges: 'rowChallenges',
  weightedTime: 'rowWeightedTime',
  circuits: 'rowCircuits',
  gtg: 'rowGtg',
  feedback: 'rowFeedback',
  programBonus: 'rowProgramBonus',
  calories: 'rowCalories',
  steps: 'rowSteps',
  food: 'rowFood',
  running: 'rowRunning',
  pushups: 'rowPushups',
  jumpRope: 'rowJumpRope',
  plank: 'rowPlank',
  dailyAvg: 'rowDailyAvg',
  mastery: 'rowMastery'
};

function buildXpGroups(breakdown, t, refTwoStarTenReps, dailyInsights, masteryScore, preference) {
  const on = (id) => isDetailFieldOn(id, preference);

  const trainingRows = [
    {
      id: 'weightedReps',
      name: 'Reps pondérées',
      hint: `Réf. charge 10 reps ~2★ ≈ ${refTwoStarTenReps} XP`,
      amount: fmt(breakdown.reps),
      unit: 'reps',
      xp: Math.round(breakdown.weightedRepsXp || 0)
    },
    {
      id: 'checked',
      name: 'Exercices cochés',
      hint: `×${SPORT_XP_PER_CHECKED_EXERCISE} XP / exercice`,
      amount: fmt(breakdown.exercises),
      unit: 'exercices',
      xp: Math.round(breakdown.exercisesXp || 0)
    },
    {
      id: 'volume',
      name: 'Volume cumulé',
      hint: `${SPORT_XP_PER_TOTAL_KG_VOLUME.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 3
      })} XP/kg · plafond ${SPORT_XP_LIFTED_VOLUME_CAP.toLocaleString('fr-FR')} · dédup. 1 exo/jour`,
      amount: fmt(breakdown.liftedVolumeKg ?? 0, { maximumFractionDigits: 0 }),
      unit: 'kg×reps',
      xp: Math.round(breakdown.liftedVolumeKgXp || 0)
    },
    {
      id: 'stretches',
      name: 'Étirements',
      hint: '100→300 XP / coche selon notes',
      amount: fmt(breakdown.stretches ?? 0),
      unit: (breakdown.stretches ?? 0) > 0 ? `étirements (${breakdown.stretches} cochés)` : 'étirements',
      xp: Math.round(breakdown.stretchesXp || 0)
    },
    {
      id: 'challenges',
      name: 'Défis',
      hint: '×50 XP',
      amount: fmt(breakdown.challenges),
      unit: 'défis',
      xp: Math.round(breakdown.challengesXp || 0)
    },
    {
      id: 'weightedTime',
      name: 'Temps pondéré',
      hint: '',
      amount: formatCalendarSportDuration(breakdown.timeMinutes ?? 0),
      unit: 'exos en durée',
      xp: Math.round(breakdown.weightedTimeXp || 0)
    },
    {
      id: 'circuits',
      name: 'Circuits',
      hint:
        (breakdown.circuitTripleAchievedDays ?? 0) > 0
          ? `${breakdown.circuitTripleAchievedDays}× 3× cible`
          : '',
      amount: fmt(breakdown.circuitCompletedDays ?? 0),
      unit: 'circuits',
      xp: Math.round(breakdown.circuitsXp || 0)
    },
    {
      id: 'gtg',
      name: 'GTG',
      hint: (breakdown.gtgReps ?? 0) > 0 ? `${fmt(breakdown.gtgReps)} reps` : '',
      amount: fmt(breakdown.gtgReps ?? 0),
      unit: 'reps GTG',
      xp: Math.round(breakdown.gtgXp || 0)
    },
    {
      id: 'feedback',
      name: 'Séances + feedback',
      hint: '×25 XP',
      amount: '',
      unit: '',
      xp: Math.round(breakdown.sessionsFeedbackXp || 0)
    },
    {
      id: 'programBonus',
      name: 'Bonus complétion programme',
      hint: '',
      amount: '',
      unit: '',
      xp: Math.round(breakdown.programCompletionBonusXp || 0)
    },
    {
      id: 'mastery',
      name: 'Score de maîtrise',
      hint: 'Agrégat utilisé pour les grades (reps, séances, kcal…)',
      amount: masteryScore != null ? fmt(masteryScore, { maximumFractionDigits: 0 }) : '',
      unit: 'pts',
      xp: 0,
      forceShow: masteryScore != null && masteryScore > 0
    }
  ].filter((row) => on(ROW_FIELD[row.id]));

  const stepsHint =
    (breakdown.stepsXpDeclarative ?? 0) > 0
      ? `${fmt(breakdown.stepsXpVerified ?? breakdown.stepsXp ?? 0)} montre + ${fmt(
          breakdown.stepsXpDeclarative
        )} déclaratif ×50 %`
      : `${STEPS_XP_RATE_VERIFIED.toLocaleString('fr-FR', {
          minimumFractionDigits: 4,
          maximumFractionDigits: 4
        })}× pas montre · ${STEPS_XP_RATE_DECLARATIVE.toLocaleString('fr-FR', {
          minimumFractionDigits: 4,
          maximumFractionDigits: 4
        })}× déclaratif`;

  const activityRows = [
    {
      id: 'calories',
      name: 'Calories',
      hint: `${SPORT_XP_PER_ACTIVE_CALORIE.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}× kcal actives Garmin cumulées`,
      amount: fmt(breakdown.calories),
      unit: 'cal',
      xp: Math.round(breakdown.caloriesXp || 0)
    },
    {
      id: 'steps',
      name: 'Pas',
      hint: stepsHint,
      amount: fmt(breakdown.steps),
      unit: 'pas',
      xp: Math.round(breakdown.stepsXp || 0)
    },
    {
      id: 'food',
      name: 'Aliments',
      hint: `${SPORT_XP_PER_NUTRITION_FOOD_REGISTERED}× lignes journal`,
      amount: fmt(breakdown.nutritionFoodItems ?? 0),
      unit: 'aliments',
      xp: Math.round(breakdown.nutritionFoodXp || 0)
    },
    {
      id: 'dailyAvg',
      name: 'Moyenne XP / jour actif',
      hint:
        dailyInsights?.daysWithXp > 0
          ? `${fmt(dailyInsights.daysWithXp)} jours avec XP`
          : 'Aucun jour actif encore',
      amount: dailyInsights?.averageDailyXp != null ? fmt(dailyInsights.averageDailyXp) : '',
      unit: 'XP / jour',
      xp: 0,
      forceShow: (dailyInsights?.averageDailyXp || 0) > 0
    }
  ].filter((row) => on(ROW_FIELD[row.id]));

  const trophyRows = [
    {
      id: 'running',
      name: 'Course',
      hint: '',
      amount: fmt(breakdown.runningTotalDistanceKm ?? 0, { maximumFractionDigits: 1 }),
      unit: `km cumul · ${fmt(breakdown.runningSessionCount ?? 0)} sorties`,
      xp: Math.round(breakdown.runningTrophies || 0)
    },
    {
      id: 'pushups',
      name: 'Pompes',
      hint: '',
      amount: '',
      unit: '',
      xp: Math.round(breakdown.pushupTrophies || 0)
    },
    {
      id: 'jumpRope',
      name: 'Corde',
      hint: '',
      amount: '',
      unit: '',
      xp: Math.round(breakdown.jumpRopeTrophies || 0)
    },
    {
      id: 'plank',
      name: 'Gainage',
      hint: '',
      amount: '',
      unit: '',
      xp: Math.round(breakdown.gainageTrophies || 0)
    }
  ].filter((row) => on(ROW_FIELD[row.id]));

  const sortRows = (rows) =>
    [...rows].sort((a, b) => {
      const byOrder = compareDetailFieldOrder(ROW_FIELD[a.id], ROW_FIELD[b.id], preference);
      if (byOrder !== 0) return byOrder;
      return (b.xp || 0) - (a.xp || 0);
    });

  return [
    { id: 'training', name: 'Entraînement & défis', color: 'var(--c1)', rows: trainingRows },
    { id: 'activity', name: 'Activité & nutrition', color: 'var(--c2)', rows: activityRows },
    { id: 'trophies', name: 'Trophées', color: 'var(--c3)', rows: trophyRows }
  ].map((group) => {
    const total = group.rows.reduce((sum, row) => sum + (row.xp || 0), 0);
    return { ...group, total, rows: sortRows(group.rows) };
  });
}

const SportXPBar = ({ previewMode = false, embed = false, forceCollapsed = false }) => {
  const { totalXP, level, breakdown, progress, grades, isLoading, dailyInsights, masteryScore } =
    useSportGrade();
  const { setActiveTab, requestOpenEnduranceSubTab } = useWorkout();
  const t = useTranslation();
  const [open, setOpen] = useState(Boolean(previewMode) && !forceCollapsed);
  const [preference, setPreference] = useState(getXpAppearancePreference);

  useEffect(() => {
    if (forceCollapsed) {
      setOpen(false);
      return;
    }
    if (previewMode) setOpen(true);
  }, [previewMode, forceCollapsed]);

  useEffect(() => subscribeXpAppearance(setPreference), []);

  const accentHex = resolveSportXpAccentHex(preference);
  const accents = listAllSportXpAccents(preference);
  const refTwoStarTenReps = sportXpReferenceTenRepsTwoStarBodyweight();

  const goNav = (targetId, event) => {
    event?.stopPropagation?.();
    event?.preventDefault?.();
    navigateFromSportXpBar(targetId, { setActiveTab, requestOpenEnduranceSubTab });
  };

  const goRecapGrades = (event) => {
    goNav('grades', event);
  };

  const gradesHint = t('recap.grades.openGradesHint', 'Voir le détail dans Récap → Grades');
  const xpOnLevel = progress.xpOnLevel ?? 0;
  const xpForLevel = progress.xpForLevel ?? 1000;
  const xpNeeded = progress.xpNeeded ?? 0;
  const pct = Math.min(100, Math.max(0, progress.percent ?? 0));

  const progGradeId = grades?.progression?.gradeId;
  const progTier = grades?.progression?.tier;
  const merGradeId = grades?.merited?.gradeId;
  const merTier = grades?.merited?.tier;
  const progName = sportGradeLabel(progGradeId, t);
  const progPalier = sportPalierLabel(progTier, t);
  const merName = sportGradeLabel(merGradeId, t);
  const merPalier = sportPalierLabel(merTier, t);
  const sameMerited = merGradeId === progGradeId && Number(merTier) === Number(progTier);

  const groups = useMemo(
    () =>
      buildXpGroups(breakdown || {}, t, refTwoStarTenReps, dailyInsights, masteryScore, preference),
    [breakdown, t, refTwoStarTenReps, dailyInsights, masteryScore, preference]
  );

  const maxRowXp = useMemo(
    () => Math.max(1, ...groups.flatMap((g) => g.rows.map((r) => r.xp || 0))),
    [groups]
  );

  const groupsById = useMemo(() => {
    const map = {};
    groups.forEach((g) => {
      map[g.id] = g;
    });
    return map;
  }, [groups]);

  const layoutOrder = getLayoutOrder(preference);
  const trainingPlusActivity =
    (groupsById.training?.total || 0) + (groupsById.activity?.total || 0);
  const stackPieces = useMemo(() => {
    const pieces = [];
    const orderedGroups = layoutOrder
      .filter((id) => id.startsWith('group'))
      .map((id) => {
        if (id === 'groupTraining') return groupsById.training;
        if (id === 'groupActivity') return groupsById.activity;
        if (id === 'groupTrophies') return groupsById.trophies;
        return null;
      })
      .filter(Boolean);
    const list = orderedGroups.length ? orderedGroups : groups;
    list.forEach((group) => {
      group.rows
        .filter((r) => r.xp > 0)
        .forEach((row, i) => {
          pieces.push({
            key: `${group.id}-${row.id}`,
            flex: row.xp,
            color: group.color,
            opacity: Math.max(0.4, 1 - i * 0.18),
            title: `${row.name} · ${fmt(row.xp)} XP`
          });
        });
    });
    return pieces;
  }, [groups, groupsById, layoutOrder]);

  const setAccent = (id) => {
    updateXpAppearancePreference({ sportAccentId: id });
  };

  const toggleOpen = () => {
    if (forceCollapsed) return;
    setOpen((value) => !value);
  };

  const renderGroupTable = (group) => {
    if (!group || !isDetailFieldOn('breakdownRows', preference)) return null;
    if (!group.rows.length) return null;
    return (
      <div key={group.id} style={{ '--c': group.color }}>
        <div className={styles.gh}>
          <strong>{group.name}</strong>
          <span>
            {fmt(group.total)}
            <small>
              XP · {pctOf(group.total, totalXP)}
            </small>
          </span>
        </div>
        <div className={styles.col}>
          <span>Source</span>
          <span>Ce que tu as fait</span>
          <span>XP gagné</span>
          <span>Part</span>
        </div>
        {group.rows.map((row) => (
          <div
            key={row.id}
            role="button"
            tabIndex={0}
            className={`${styles.r} ${styles.rClick}${row.xp === 0 ? ` ${styles.z}` : ''}`}
            style={{
              '--w': `${Math.min(100, (row.xp / maxRowXp) * 100).toFixed(1)}%`
            }}
            title={`Voir : ${row.name}`}
            onClick={(e) => goNav(row.id, e)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                goNav(row.id, e);
              }
            }}
          >
            <div className={styles.n}>
              {row.name}
              {row.hint ? <small>{row.hint}</small> : null}
            </div>
            <div className={styles.a}>
              {row.amount ? (
                <>
                  {row.amount} <span>{row.unit}</span>
                </>
              ) : null}
            </div>
            <div className={styles.xv}>
              {row.xp === 0 && !row.forceShow ? '+0' : row.xp > 0 ? fmt(row.xp) : '—'}
              {row.xp > 0 ? <small>XP</small> : null}
            </div>
            <div className={styles.pc}>{row.xp > 0 ? pctOf(row.xp, totalXP) : '—'}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderLayoutBlock = (blockId) => {
    switch (blockId) {
      case 'headerCards':
        if (
          !(
            isDetailFieldOn('meritedBox', preference) ||
            isDetailFieldOn('levelXpBox', preference)
          )
        ) {
          return null;
        }
        return (
          <div key="headerCards" className={styles.strip}>
            {isDetailFieldOn('meritedBox', preference) ? (
              <button
                type="button"
                className={`${styles.box} ${styles.gradeBtn}`}
                onClick={goRecapGrades}
                title={gradesHint}
              >
                <div className={styles.k}>Grade mérité</div>
                <div className={styles.v}>
                  {merName} · {merPalier}
                </div>
                <p>
                  {sameMerited
                    ? 'identique à la progression'
                    : `${merName} · ${merPalier}`}
                </p>
              </button>
            ) : null}
            {isDetailFieldOn('levelXpBox', preference) ? (
              <div className={styles.box}>
                <div className={styles.k}>XP sur le palier niveau {level}</div>
                <div className={styles.v}>
                  {fmt(xpOnLevel)} <small>/ {fmt(xpForLevel)} XP</small>
                </div>
                <p>
                  Encore {fmt(xpNeeded)} XP jusqu&apos;au niveau {level + 1}
                </p>
              </div>
            ) : null}
          </div>
        );
      case 'breakdownStack':
        if (!isDetailFieldOn('breakdownStack', preference)) return null;
        return (
          <React.Fragment key="breakdownStack">
            <div className={styles.stack} aria-hidden="true">
              {stackPieces.map((piece, index) => (
                <i
                  key={piece.key}
                  title={piece.title}
                  style={{
                    flex: piece.flex,
                    background: piece.color,
                    opacity: piece.opacity,
                    transitionDelay: `${index * 60}ms`
                  }}
                />
              ))}
            </div>
            <div className={styles.leg}>
              {(['training', 'activity', 'trophies']
                .map((id) => groupsById[id])
                .filter(Boolean)
              ).map((group) => (
                <button
                  key={group.id}
                  type="button"
                  className={styles.linkish}
                  style={{
                    '--c': group.color,
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    background: 'var(--pan2)',
                    border: '1px solid var(--ln)',
                    borderTop: '3px solid var(--c)',
                    padding: '10px 14px',
                    color: 'inherit',
                    font: 'inherit',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    textDecoration: 'none'
                  }}
                  onClick={(e) =>
                    goNav(
                      group.id === 'training'
                        ? 'groupTraining'
                        : group.id === 'activity'
                          ? 'groupActivity'
                          : 'groupTrophies',
                      e
                    )
                  }
                >
                  {group.name}
                  <b
                    style={{
                      display: 'block',
                      color: 'var(--c)',
                      fontSize: 22,
                      marginTop: 3,
                      textTransform: 'none'
                    }}
                  >
                    {fmt(group.total)} XP
                    <small
                      style={{
                        fontSize: 12,
                        color: 'var(--mut)',
                        fontWeight: 500,
                        marginLeft: 5
                      }}
                    >
                      {pctOf(group.total, totalXP)}
                    </small>
                  </b>
                </button>
              ))}
            </div>
          </React.Fragment>
        );
      case 'groupTraining':
        return renderGroupTable(groupsById.training);
      case 'groupActivity':
        return renderGroupTable(groupsById.activity);
      case 'groupTrophies':
        return renderGroupTable(groupsById.trophies);
      case 'misc':
        if (
          !(
            isDetailFieldOn('miscSessions', preference) ||
            isDetailFieldOn('miscTrophies', preference)
          )
        ) {
          return null;
        }
        return (
          <div key="misc" className={styles.misc}>
            {isDetailFieldOn('miscSessions', preference) ? (
              <button
                type="button"
                className={styles.linkish}
                style={{
                  background: 'none',
                  border: 0,
                  padding: 0,
                  color: 'inherit',
                  font: 'inherit'
                }}
                onClick={(e) => goNav('miscSessions', e)}
              >
                Séances cumulées{' '}
                <b>{formatCalendarSportDuration(breakdown.sessionMinutes ?? 0)}</b>
              </button>
            ) : null}
            {isDetailFieldOn('miscTrophies', preference) ? (
              <button
                type="button"
                className={styles.linkish}
                style={{
                  background: 'none',
                  border: 0,
                  padding: 0,
                  color: 'inherit',
                  font: 'inherit'
                }}
                onClick={(e) => goNav('miscTrophies', e)}
              >
                <b>{fmt(breakdown.runningTrophyTiers ?? 0)}</b> paliers ·{' '}
                <b>{fmt(breakdown.runningTrophiesUnlocked ?? 0)}</b> trophées avec au moins un
                palier
              </button>
            ) : null}
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className={styles.wrap}>
        <section className={styles.xp} style={{ '--acb': accentHex }}>
          <div className={styles.loading} aria-hidden="true">
            <div className={styles.pulse} style={{ width: '42%' }} />
            <div className={styles.pulse} style={{ width: '72%' }} />
            <div className={styles.pulse} style={{ width: '55%' }} />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {!embed ? (
        <div className={styles.sw} onClick={(e) => e.stopPropagation()}>
          <span>Couleur</span>
          {accents.map((item) => (
            <button
              key={item.id}
              type="button"
              data-a={item.id}
              style={{ background: item.hex }}
              aria-label={item.label}
              aria-pressed={preference.sportAccentId === item.id}
              onClick={() => setAccent(item.id)}
            />
          ))}
        </div>
      ) : null}

      <section
        className={`${styles.xp}${open ? ` ${styles.open}` : ''}`}
        style={{ '--acb': accentHex }}
      >
        <div
          className={styles.top}
          onClick={forceCollapsed ? undefined : toggleOpen}
          onKeyDown={
            forceCollapsed
              ? undefined
              : (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleOpen();
                  }
                }
          }
          role={forceCollapsed ? undefined : 'button'}
          tabIndex={forceCollapsed ? undefined : 0}
          aria-expanded={forceCollapsed ? undefined : open}
        >
          <div className={styles.bgl} />
          <div className={styles.hat} />
          <div className={styles.ghost} aria-hidden="true">
            {level}
          </div>
          <div className={styles.edge} />

          <button
            type="button"
            className={styles.gradeBtn}
            onClick={goRecapGrades}
            title={gradesHint}
            aria-label={gradesHint}
          >
            <div className={styles.img}>
              {progGradeId ? (
                <SportGradeEmblem
                  gradeId={progGradeId}
                  layout={open ? 'recap' : 'bar'}
                  className="!h-full !w-full !max-h-none !max-w-none !border-0 !bg-transparent !shadow-none !rounded-sm"
                />
              ) : null}
            </div>
          </button>

          <button type="button" className={`${styles.gradeBtn} ${styles.grd}`} onClick={goRecapGrades} title={gradesHint}>
            <div className={styles.k}>Grade</div>
            <div className={styles.gname}>{progName || '—'}</div>
            <div className={styles.chips}>
              <span className={styles.chip}>{progPalier || '—'}</span>
              {level != null ? <span className={styles.lv}>Niveau {level}</span> : null}
            </div>
          </button>

          <div className={styles.pr}>
            <div className={styles.ends}>
              <span>
                <b>Niveau {level}</b>
              </span>
              <span>Niveau {level + 1}</span>
            </div>
            <div
              className={styles.trk}
              role="progressbar"
              aria-valuenow={Math.round(pct)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <i style={{ width: `${pct}%` }} />
              <b style={{ left: `${pct}%` }} />
            </div>
            <div className={styles.rem}>
              <strong>
                {fmt(xpNeeded)}
                <span>XP restants</span>
              </strong>
              <em>
                <b>{Math.round(pct)} %</b> · {fmt(xpOnLevel)} / {fmt(xpForLevel)} XP
              </em>
            </div>
          </div>

          <button
            type="button"
            className={`${styles.tot} ${styles.gradeBtn}`}
            onClick={(e) => goNav('totalXp', e)}
            title={gradesHint}
          >
            <span>XP TOTAL</span>
            <b>{fmt(totalXP)}</b>
          </button>

          {!forceCollapsed ? (
            <button
              type="button"
              className={styles.tg}
              aria-expanded={open}
              aria-label={open ? 'Réduire' : 'Détails'}
              onClick={(e) => {
                e.stopPropagation();
                toggleOpen();
              }}
            >
              <i aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className={styles.body}>
          <div>
            <div className={styles.in}>
              <div className={styles.sh}>
                <h2>D&apos;où vient ton XP</h2>
                <span>
                  <b>{fmt(totalXP)}</b>XP au total
                </span>
              </div>
              <p className={styles.lead}>
                Chaque ligne : ce que tu as fait → l&apos;XP que ça t&apos;a rapporté. Ordre
                personnalisable dans Apparence. Entraînement + Activité hors trophées :{' '}
                <b>{fmt(trainingPlusActivity)} XP</b>.
              </p>
              {layoutOrder.map((blockId) => renderLayoutBlock(blockId))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SportXPBar;
