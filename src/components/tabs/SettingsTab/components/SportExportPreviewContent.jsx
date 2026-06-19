/**
 * Liste des statistiques Sport pour l'aperçu export / import.
 */

import React from 'react';
import { settingsTheme as S } from '../settingsThemeClasses';

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : 'Jamais');

/** @param {{ preview: object|null, loading?: boolean, garminSummary?: object|null, garminDailyIndex?: object[]|null, nutritionSummary?: object|null, data?: object }} props */
export function SportExportPreviewContent({
  preview,
  loading = false,
  garminSummary = null,
  garminDailyIndex = null,
  nutritionSummary = null,
  data = null
}) {
  const fallback = data || {};
  const p = preview;

  if (loading && !p) {
    return <p className={`text-sm ${S.muted}`}>Chargement de l&apos;aperçu…</p>;
  }

  const exercises = p?.totalExercises ?? Object.keys(fallback.checkedExercises || {}).length;
  const reps = p?.totalReps ?? Object.keys(fallback.reps || {}).length;
  const repsWithValue = p?.repsWithValue ?? 0;
  const stretches = p?.totalStretches ?? Object.keys(fallback.checkedStretches || {}).length;
  const sessionFeedbacks = p?.sessionFeedbacks ?? Object.keys(fallback.sessionFeedbacks || {}).length;
  const historyReps = p?.historyReps ?? Object.keys(fallback.historyReps || {}).length;
  const dailyVariations = p?.dailyVariations ?? Object.keys(fallback.dailyVariations || {}).length;
  const dayJustifications = p?.dayJustifications ?? Object.keys(fallback.dayJustifications || {}).length;
  const perceived = p?.exerciseSessionPerceived ?? Object.keys(fallback.exerciseSessionPerceived || {}).length;
  const load = p?.loadTracking || {
    exerciseWeightKeys: Object.keys(fallback.exerciseWeights || {}).length,
    exercisePerArmKeys: Object.keys(fallback.exerciseWeightPerArm || {}).filter(
      (k) => fallback.exerciseWeightPerArm[k] === true
    ).length,
    exerciseSetWeightKeys: Object.keys(fallback.exerciseSetWeights || {}).length
  };

  const bt = p?.bodyTracking || {
    photos: (fallback.progressPhotos || []).length,
    progressEntries: (fallback.progressEntries || []).length,
    reminders: (fallback.bodyTrackingReminders || []).length,
    photosWithWeight: (fallback.progressPhotos || []).filter((x) => x.weight).length,
    photosWithNotes: (fallback.progressPhotos || []).filter((x) => x.notes).length,
    photosWithMeasurements: (fallback.progressPhotos || []).filter(
      (x) => x.measurements && Object.keys(x.measurements).length > 0
    ).length,
    lastUpdated: fallback.bodyTrackingLastUpdated || null
  };

  const endurance = p?.endurance || {
    boxing: (fallback.enduranceData?.sessions?.boxing || fallback.enduranceData?.boxingSessions || []).length,
    pushups: (fallback.enduranceData?.sessions?.pushups || fallback.enduranceData?.pushupSessions || []).length,
    swimming: (fallback.enduranceData?.sessions?.swimming || fallback.enduranceData?.swimmingSessions || []).length,
    jumprope: (fallback.enduranceData?.sessions?.jumprope || fallback.enduranceData?.jumpropeSessions || []).length,
    running: (fallback.enduranceData?.sessions?.running || fallback.enduranceData?.runningSessions || []).length,
    challenges: (fallback.enduranceData?.challenges || []).length
  };

  const cfg = p?.configuration || {
    startDate: fallback.startDate,
    weekVariant: fallback.weekVariant || 'A',
    programHistory: (fallback.programHistory || []).length,
    circuitDefinitions: Object.keys(fallback.circuitDefinitions || {}).length,
    circuitProgressDays: Object.keys(fallback.circuitProgress || {}).length,
    exerciseMaxRecords: (fallback.exerciseMaxRecords || []).length,
    exerciseMaxHistory: (fallback.exerciseMaxHistory || []).length,
    performanceRetestPlans: (fallback.performanceRetestPlans || []).length,
    pyramidSessionLog: (fallback.pyramidSessionLog || []).length
  };

  const journal = p?.dailyJournal || { days: 0, exerciseEntries: 0, stretchEntries: 0 };
  const quiz = p?.quiz || { present: false, completed: 0, total: 0 };
  const liftVolume = p?.liftVolume || { totalKg: 0, daysWithVolume: 0, peakDay: null, peakKg: 0 };
  const dailyLiftVolume = p?.dailyLiftVolume || [];
  const garminDays = garminDailyIndex || [];

  const fmtKg = (n) => (Number.isFinite(n) ? `${Math.round(n).toLocaleString('fr-FR')} kg×reps` : '—');

  return (
    <div className={`${S.inset} space-y-3`}>
      <div className="space-y-1">
        <h5 className="text-sm font-medium text-rose-300">🏋️ Entraînement</h5>
        <ul className="space-y-1 text-sm text-red-100/80">
          <li>• Exercices cochés : {exercises} entrées</li>
          <li>• Répétitions (clés) : {reps} entrées</li>
          <li>• Répétitions saisies : {repsWithValue} entrées</li>
          <li>• Poids exercice : {load.exerciseWeightKeys} · par bras : {load.exercisePerArmKeys} · séries : {load.exerciseSetWeightKeys}</li>
          <li>• Ressenti séance : {perceived} entrées</li>
          <li>• Étirements : {stretches} entrées</li>
          <li>• Feedbacks séance : {sessionFeedbacks} entrées</li>
          <li>• Historique répétitions : {historyReps} entrées</li>
          <li>• Variations journalières : {dailyVariations} entrées</li>
          <li>• Justifications repos : {dayJustifications} entrées</li>
        </ul>
      </div>

      <div className={`space-y-1 border-t pt-2 ${S.divide}`}>
        <h5 className="text-sm font-medium text-rose-200">📋 Programmes &amp; profil</h5>
        <ul className="space-y-1 text-sm text-red-100/80">
          <li>• Programmes enregistrés : {p?.programs ?? 0}</li>
          <li>• Programme actif : {p?.activeProgramLabel ?? 'Aucun'}</li>
          <li>• Historique programmes : {p?.programHistory ?? cfg.programHistory} entrées</li>
          <li>
            • Questionnaire profil :{' '}
            {quiz.present
              ? `${quiz.completed}/${quiz.total || '?'} réponses`
              : 'Non renseigné'}
          </li>
          <li>• Journal quotidien : {journal.days} jours · {journal.exerciseEntries} exos · {journal.stretchEntries} étirements</li>
        </ul>
      </div>

      <div className={`space-y-1 border-t pt-2 ${S.divide}`}>
        <h5 className="text-sm font-medium text-rose-200">🏋️ Volume soulevé (kg×reps)</h5>
        <ul className="space-y-1 text-sm text-red-100/80">
          <li>• Total cumulé : {fmtKg(liftVolume.totalKg)}</li>
          <li>• Jours avec charge : {liftVolume.daysWithVolume}</li>
          {liftVolume.peakDay && (
            <li>• Record jour : {fmtKg(liftVolume.peakKg)} le {fmtDate(liftVolume.peakDay)}</li>
          )}
        </ul>
        {dailyLiftVolume.length > 0 && (
          <div className="mt-2 max-h-40 overflow-y-auto rounded border border-red-900/40 bg-red-950/20 p-2 text-xs text-red-100/75">
            {dailyLiftVolume.map((day) => (
              <div key={day.date} className="mb-2 border-b border-red-900/30 pb-2 last:mb-0 last:border-0">
                <div className="font-medium text-red-100">
                  {fmtDate(day.date)} — {fmtKg(day.totalKg)}
                </div>
                <ul className="mt-1 space-y-0.5 pl-2">
                  {day.exercises.map((ex) => (
                    <li key={ex.key}>
                      {ex.name} : {ex.reps} reps
                      {ex.weightKg ? ` @ ${ex.weightKg} kg` : ''}
                      {ex.volumeKg ? ` → ${ex.volumeKg} kg×reps` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`space-y-1 border-t pt-2 ${S.divide}`}>
        <h5 className="text-sm font-medium text-red-300">📊 Suivi Corporel</h5>
        <ul className="space-y-1 text-sm text-red-100/80">
          <li>• Photos de progression : {bt.photos} photos</li>
          <li>• Entrées de progression : {bt.progressEntries} entrées</li>
          <li>• Rappels configurés : {bt.reminders} rappels</li>
          <li>• Photos avec poids : {bt.photosWithWeight}</li>
          <li>• Photos avec notes : {bt.photosWithNotes}</li>
          <li>• Photos avec mesures : {bt.photosWithMeasurements}</li>
          <li>• Dernière mise à jour : {fmtDate(bt.lastUpdated)}</li>
        </ul>
      </div>

      <div className={`space-y-1 border-t pt-2 ${S.divide}`}>
        <h5 className="text-sm font-medium text-rose-200">🏃 Endurance</h5>
        <ul className="space-y-1 text-sm text-red-100/80">
          <li>• Sessions boxe : {endurance.boxing} sessions</li>
          <li>• Sessions pompes : {endurance.pushups} sessions</li>
          <li>• Sessions natation : {endurance.swimming} sessions</li>
          <li>• Sessions corde à sauter : {endurance.jumprope} sessions</li>
          <li>• Sessions course : {endurance.running} sessions</li>
          <li>• Défis actifs : {endurance.challenges} défis</li>
        </ul>
      </div>

      <div className={`space-y-1 border-t pt-2 ${S.divide}`}>
        <h5 className="text-sm font-medium text-red-200">⌚ Garmin</h5>
        <ul className="space-y-1 text-sm text-red-100/80">
          {garminSummary ? (
            <>
              <li>• Activités natation : {garminSummary.swimming}</li>
              <li>• Corde à sauter : {garminSummary.jumpRope}</li>
              <li>• Cardio / course : {garminSummary.cardio}</li>
              <li>• Total activités : {garminSummary.totalActivities}</li>
              <li>• Jours métriques (FC, pas…) : {garminSummary.dailyMetricsDays}</li>
              {garminSummary.activityTypes && Object.keys(garminSummary.activityTypes).length > 0 && (
                <li>
                  • Types :{' '}
                  {Object.entries(garminSummary.activityTypes)
                    .map(([t, n]) => `${t} (${n})`)
                    .join(', ')}
                </li>
              )}
              <li className="text-[11px] text-red-100/55">Inclus dans l&apos;export complet Sport</li>
            </>
          ) : (
            <li>• Chargement des compteurs Garmin…</li>
          )}
        </ul>
        {garminDays.length > 0 && (
          <div className="mt-2 max-h-48 overflow-y-auto rounded border border-red-900/40 bg-red-950/20 p-2 text-xs text-red-100/75">
            {[...garminDays].reverse().slice(0, 30).map((day) => (
              <div key={day.date} className="mb-2 border-b border-red-900/30 pb-2 last:mb-0 last:border-0">
                <div className="font-medium text-red-100">{fmtDate(day.date)}</div>
                {day.metrics && (
                  <div className="mt-0.5 pl-1">
                    {day.metrics.steps != null && <span>Pas {day.metrics.steps} · </span>}
                    {day.metrics.heartRate?.resting != null && (
                      <span>FC repos {day.metrics.heartRate.resting} · </span>
                    )}
                    {day.metrics.heartRate?.avg != null && day.metrics.heartRate.avg > 0 && (
                      <span>FC moy {day.metrics.heartRate.avg} · </span>
                    )}
                    {day.metrics.calories?.total != null && (
                      <span>Kcal {day.metrics.calories.total} · </span>
                    )}
                    {day.metrics.bodyBattery != null && <span>Batterie {day.metrics.bodyBattery}</span>}
                  </div>
                )}
                {day.activityCount > 0 && (
                  <ul className="mt-1 space-y-0.5 pl-2">
                    {[...(day.activities?.swimming || []), ...(day.activities?.jumpRope || []), ...(day.activities?.cardio || [])].map(
                      (act) => (
                        <li key={act.id ?? `${day.date}-${act.activityType}`}>
                          {act.activityType}
                          {act.duration ? ` ${Math.round(act.duration / 60)} min` : ''}
                          {act.distance ? ` · ${Number(act.distance).toFixed(2)} km` : ''}
                          {act.avgHR ? ` · FC moy ${act.avgHR}` : ''}
                          {act.maxHR ? ` / max ${act.maxHR}` : ''}
                        </li>
                      )
                    )}
                  </ul>
                )}
              </div>
            ))}
            {garminDays.length > 30 && (
              <p className="text-[10px] text-red-100/50">… et {garminDays.length - 30} jours de plus dans l&apos;export</p>
            )}
          </div>
        )}
      </div>

      <div className={`space-y-1 border-t pt-2 ${S.divide}`}>
        <h5 className="text-sm font-medium text-rose-300">🍎 Nutrition</h5>
        <ul className="space-y-1 text-sm text-red-100/80">
          {nutritionSummary ? (
            <>
              <li>• Jours suivis : {nutritionSummary.dailyMeals}</li>
              <li>• Repas : {nutritionSummary.meals}</li>
              <li>• Programmes : {nutritionSummary.programs}</li>
              <li>• Aliments favoris : {nutritionSummary.favoriteFoods}</li>
              <li>• Programme actif : {nutritionSummary.activeProgram || 'Aucun'}</li>
              <li className="text-[11px] text-red-100/55">Inclus dans l&apos;export complet Sport</li>
            </>
          ) : (
            <li>• Chargement des compteurs nutrition…</li>
          )}
        </ul>
      </div>

      <div className={`space-y-1 border-t pt-2 ${S.divide}`}>
        <h5 className="text-sm font-medium text-red-300">⚙️ Configuration</h5>
        <ul className="space-y-1 text-sm text-red-100/80">
          <li>• Date de début : {cfg.startDate ? fmtDate(cfg.startDate) : 'Non définie'}</li>
          <li>• Variante de semaine : {cfg.weekVariant}</li>
          <li>• Circuits définis : {cfg.circuitDefinitions}</li>
          <li>• Progression circuits (jours) : {cfg.circuitProgressDays}</li>
          <li>• Records perf. : {cfg.exerciseMaxRecords}</li>
          <li>• Historique records : {cfg.exerciseMaxHistory}</li>
          <li>• Plans retest : {cfg.performanceRetestPlans}</li>
          <li>• Journal pyramide : {cfg.pyramidSessionLog}</li>
        </ul>
      </div>
    </div>
  );
}

/** Grille compacte pour la modale d'import */
export function SportImportStatsGrid({ stats }) {
  if (!stats) return null;
  const s = stats;

  const rows = [
    ['Exercices cochés', s.exercises],
    ['Répétitions', s.reps],
    ['Rép. saisies', s.repsWithValue],
    ['Étirements', s.stretches],
    ['Feedbacks séance', s.sessionFeedbacks],
    ['Historique reps', s.historyReps],
    ['Variations', s.dailyVariations],
    ['Justifications', s.dayJustifications],
    ['Ressenti séance', s.exerciseSessionPerceived],
    ['Poids exercice', s.exerciseWeightKeys],
    ['Programmes', s.programs],
    ['Hist. programmes', s.programHistory],
    ['Questionnaire', s.profileQuestionnaire ? 'Oui' : 'Non'],
    ['Journal (jours)', s.dailyJournalDays],
    ['Journal exos', s.dailyJournalExerciseEntries],
    ['Volume total kg×reps', s.liftVolumeTotalKg],
    ['Jours avec charge', s.liftVolumeDays],
    ['Circuits', s.circuitDefinitions],
    ['Sessions endurance', s.enduranceSessions],
    ['Photos', s.photos],
    ['Entrées progression', s.progressEntries],
    ['Activités Garmin', s.garminActivities],
    ['Jours Garmin', s.garminMetricsDays],
  ];

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm md:grid-cols-3">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-2">
          <span className={S.muted}>{label} :</span>
          <span className="font-semibold text-red-50">{value ?? 0}</span>
        </div>
      ))}
      {s.activeProgramName && (
        <div className="col-span-full flex justify-between gap-2 border-t border-red-900/40 pt-2">
          <span className={S.muted}>Programme actif :</span>
          <span className="font-semibold text-red-50">{s.activeProgramName}</span>
        </div>
      )}
    </div>
  );
}
