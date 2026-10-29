import React, { useMemo, useState } from 'react';
import { useTranslation } from '../../../../utils/translations';
import { useSportGrade } from '../../../../hooks/useSportGrade';
import { useWorkout } from '../../../../context/WorkoutContext';
import { useSportGradeMilestones } from '../../../../hooks/useSportGradeMilestones';
import SportGradeRecapHero from '../../grades/SportGradeRecapHero';
import { sportGradeLabel } from '../../grades/SportGradeIdentity';
import SportGradeEmblem from '../../grades/SportGradeEmblem';
import SportGradeLadderGallery from '../../grades/SportGradeLadderGallery';
import SportGradeDetailPage from '../../grades/SportGradeDetailPage';
import RecapExerciseGradesView from '../../grades/RecapExerciseGradesView';
import { useExerciseGradeVitalsRefresh } from '../../grades/ExerciseGradeVitalsForm';
import { useExerciseGrades } from '../../../../hooks/useExerciseGrades';
import {
  SPORT_TIER_ROMAN
} from '../../../../services/xp/sportGradeCatalog';

function PathRow({ pathKey, data }) {
  if (!data) return null;
  const pct = Math.round(data.pct ?? 0);
  return (
    <div className={`cd ${data.met ? 'ok' : ''}`}>
      <h4>
        {pathKey} — {data.label}
      </h4>
      {data.met ? <span className="ck">✓</span> : <span className="pc">{pct} %</span>}
      <div className="gz">
        <i style={{ '--w': `${Math.min(100, pct)}%` }} />
      </div>
      <small>
        {Number(data.current).toLocaleString('fr-FR')} / {Number(data.target).toLocaleString('fr-FR')}
      </small>
    </div>
  );
}

export default function RecapGradesView({ paneActive = true }) {
  const t = useTranslation();
  const { totalXP, level, masteryScore, grades, progress, isLoading, aggregates, dailyInsights } = useSportGrade();
  const { getCurrentData } = useWorkout();
  const workoutData = getCurrentData();
  const timeline = useSportGradeMilestones({ level, grades, totalXP });
  const timelineCurrentId = useMemo(() => {
    const prog = grades?.progression;
    if (!prog?.gradeId || !prog?.tier) return null;
    return `tier:${prog.gradeId}:${prog.tier}`;
  }, [grades?.progression?.gradeId, grades?.progression?.tier]);
  const [selectedGradeId, setSelectedGradeId] = useState(null);
  const [gradesSubTab, setGradesSubTab] = useState('sport');
  const [exerciseSortMode, setExerciseSortMode] = useState('grade');
  const { tick, bump } = useExerciseGradeVitalsRefresh();
  const exerciseGrades = useExerciseGrades({
    sortMode: exerciseSortMode,
    vitalsRefreshKey: tick,
    enabled: Boolean(paneActive) && gradesSubTab === 'exercises'
  });

  /** Attendre la fin du bootstrap XP (workout + Garmin + nutrition), pas seulement totalXP === 0. */
  const gradesDataPending = isLoading;

  const prog = grades?.progression;
  const mer = grades?.merited;
  const next = grades?.nextGateProgress;

  return (
    <div className="rb-grades">
      <section id="recap-grades-section" className="scroll-mt-28">
        <p className="sub">
          {t('recap.grades.title', 'Grades & progression')}
        </p>
        <p className="sub">
          {gradesSubTab === 'sport'
            ? t(
                'recap.grades.intro',
                'Le niveau monte avec toute ton XP Sport. Les paliers I / II / III suivent le niveau. Passer au grade supérieur exige aussi une preuve d’activité (maîtrise, séances, reps ou kcal).'
              )
            : t(
                'recap.exerciseGrades.introShort',
                'Grades par mouvement (Bois → Platine) selon ton pic du jour, ton volume total et ton profil physique.'
              )}
        </p>
        <div className="rb-gtabs">
          <button
            type="button"
            onClick={() => setGradesSubTab('sport')}
            aria-pressed={gradesSubTab === 'sport'}
          >
            {t('recap.grades.subTabSport', 'Grades Sport (XP)')}
          </button>
          <button
            type="button"
            onClick={() => setGradesSubTab('exercises')}
            aria-pressed={gradesSubTab === 'exercises'}
          >
            {t('recap.grades.subTabExercises', 'Grades exercices')}
          </button>
        </div>
      </section>

      {gradesSubTab === 'exercises' ? (
        <div className="rb-gex">
        <RecapExerciseGradesView
          sortMode={exerciseSortMode}
          onSortModeChange={setExerciseSortMode}
          vitals={exerciseGrades.vitals}
          rows={exerciseGrades.rows}
          totalGradedExercises={exerciseGrades.totalGradedExercises}
          isComputing={exerciseGrades.isComputing}
          onVitalsSaved={bump}
          vitalsRefreshKey={tick}
        />
        </div>
      ) : gradesDataPending ? (
        <div className="rb-skel" aria-hidden />
      ) : selectedGradeId ? (
        <SportGradeDetailPage
          gradeId={selectedGradeId}
          onBack={() => setSelectedGradeId(null)}
          level={level}
          totalXP={totalXP}
          masteryScore={masteryScore}
          aggregates={aggregates}
          workoutData={workoutData}
          grades={grades}
        />
      ) : (
        <>
      <section id="g-grade">
      <div className="sh"><h2>{t('recap.grades.currentGrade', 'Grade actuel')}</h2></div>
      <SportGradeRecapHero
        progressionGradeId={prog?.gradeId}
        progressionTier={prog?.tier}
        meritedGradeId={mer?.gradeId}
        meritedTier={mer?.tier}
        level={level}
        totalXP={totalXP}
        dailyInsights={dailyInsights}
      />
      </section>
      <section id="g-xp">
        <div className="sh"><h2>{t('recap.grades.xpBlock', 'XP & niveau')}</h2></div>
        <div className="rb-xpn">
        <p className="big">{totalXP.toLocaleString('fr-FR')}<u>XP</u></p>
        <p className="lv">
          {t(
            'recap.grades.levelLine',
            `Niveau ${level} — ${progress.xpOnLevel} / ${progress.xpForLevel} XP sur ce palier`,
            {
              level,
              current: progress.xpOnLevel?.toLocaleString('fr-FR'),
              max: progress.xpForLevel?.toLocaleString('fr-FR')
            }
          )}
        </p>
        <div className="gz">
          <i style={{ '--w': `${progress.percent ?? 0}%` }} />
        </div>
        <p id="recap-grades-mastery" className="ms">
          {t(
            'recap.grades.masteryLine',
            `Score de maîtrise : ${masteryScore.toLocaleString('fr-FR')}`,
            { score: masteryScore.toLocaleString('fr-FR') }
          )}
        </p>
        </div>
      </section>

      {next ? (
        <section id="g-next">
          <div className="sh"><h2>{t('recap.grades.nextSection', 'Prochain grade')}</h2></div>
          <div className="rb-nxt">
          <p className="eb">{t('recap.grades.nextObjective', 'Objectif')}</p>
          <h3>
            {t(
              'recap.grades.nextGate',
              `Prochain grade : ${sportGradeLabel(next.gate.toGradeId, t)}`,
              { grade: sportGradeLabel(next.gate.toGradeId, t) }
            )}
          </h3>
          <p className="mn">
            {t(
              'recap.grades.nextGateLevel',
              `Niveau minimum : ${next.gate.levelMin} (actuel : ${level})`,
              { n: next.gate.levelMin, level }
            )}
            {level >= next.gate.levelMin ? (
              <span className="text-emerald-400 ml-1">✓</span>
            ) : (
              <span className="text-amber-400 ml-1">—</span>
            )}
          </p>
          <div className="cdg">
            <PathRow pathKey="A" data={next.paths.A} />
            <PathRow pathKey="B" data={next.paths.B} />
            <PathRow pathKey="C" data={next.paths.C} />
            <PathRow pathKey="D" data={next.paths.D} />
            {next.paths.F ? <PathRow pathKey="F" data={next.paths.F} /> : null}
          </div>
          <p className="nt">
            {next.pathsRequired >= 4
              ? t(
                  'recap.grades.pathEHintFinalWithF',
                  'Voie E : 4 voies à 100 % ou ≥ {{pct}} % sur A, B, C, D et F simultanément.',
                  { pct: next.pathEThresholdPct ?? 90 }
                )
              : next.pathsRequired >= 2
                ? t(
                    'recap.grades.pathEHintPenultimateWithF',
                    'Voie E : 2 voies à 100 % ou ≥ {{pct}} % sur A, B, C, D et F simultanément.',
                    { pct: next.pathEThresholdPct ?? 80 }
                  )
                : t(
                    'recap.grades.pathEHint',
                    'Voie E (polyvalence) : atteindre {{pct}} % sur A, B, C et D simultanément.',
                    { pct: next.pathEThresholdPct ?? 70 }
                  )}
          </p>
          </div>
        </section>
      ) : null}

      <div id="g-parcours">
      <SportGradeLadderGallery
        level={level}
        progressionGradeId={prog?.gradeId}
        progressionTier={prog?.tier}
        onSelectGrade={setSelectedGradeId}
        aggregates={aggregates}
        masteryScore={masteryScore}
      />

      </div>
      <section id="g-hist">
        <div className="sh"><h2>{t('recap.grades.timelineTitle', 'Historique des grades')}</h2></div>
        <div className="rb-hst">
        <p className="sub">
          {t(
            'recap.grades.timelineIntro',
            `Parcours reconstitué d’après ton niveau ${level} : du premier palier jusqu’à ta position actuelle. Les dates sont enregistrées à chaque nouveau palier ou grade débloqué.`,
            { level }
          )}
        </p>
        {timeline.length === 0 ? (
          <p className="text-xs text-slate-600">{t('recap.grades.timelineEmpty', 'Aucun événement enregistré pour l’instant.')}</p>
        ) : (
          <ol className="tl">
            {timeline.map((ev) => {
              const gradeName = sportGradeLabel(ev.gradeId, t);
              const roman = SPORT_TIER_ROMAN[ev.tier] || ev.tier;
              const isCurrent = ev.id === timelineCurrentId;
              const dateLabel = ev.at
                ? new Date(ev.at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })
                : null;
              const title =
                ev.kind === 'gate'
                  ? t('recap.grades.timelineGate', `Passage au grade ${gradeName}`, { grade: gradeName })
                  : t('recap.grades.timelineTier', `Palier ${roman} — ${gradeName}`, {
                      grade: gradeName,
                      palier: roman
                    });
              const levelLine =
                ev.levelMin != null
                  ? t('sport.grades.levelShort', `Niveau ${ev.levelMin}`, { level: ev.levelMin })
                  : null;
              return (
                <li key={ev.id} className={`tli ${isCurrent ? 'cur' : 'pass'}`}>
                  <SportGradeEmblem gradeId={ev.gradeId} layout="chip" />
                  <div>
                    <b>
                      {title}
                      {isCurrent ? <em>{t('recap.grades.timelineYouAreHere', 'Actuel')}</em> : null}
                    </b>
                    <span>
                        {levelLine}
                        {dateLabel ? ` · ${dateLabel}` : null}
                        {ev.kind === 'gate' && ev.path
                          ? ` · ${t('recap.grades.timelinePath', `Voie ${ev.path}`, { path: ev.path })}`
                          : null}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        </div>
      </section>
        </>
      )}
    </div>
  );
}
