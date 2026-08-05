/**

 * Analyses Récap — défis pompes, régularité, part du volume hebdo/mensuel.

 */

import { loadEnduranceData } from '../../services/endurance/enduranceDataService';

import {

  resolvePushupSessionTotalReps,

  resolvePushupChallengePlannedReps,

  formatPushupSessionBreakdown

} from '../../services/endurance/pushupSessionUtils';

import {

  isChallengeScheduledOnDate,

  listPushupChallengesDueOnDate

} from '../../services/endurance/challengeScheduleUtils';

import { resolveSessionCalendarDate, readGarminActivityDateOverrides } from '../sessionCalendarDate';



const PUSHUP_WEEKLY_NORM_BAND = { low: 150, mid: 350, high: 700 };



function sessionYmd(session, overrides) {

  return resolveSessionCalendarDate(session, overrides) || String(session?.date || '').slice(0, 10);

}



function pushupSessionsInRange(workoutData, start, end) {

  const ed = loadEnduranceData(workoutData?.enduranceData || {});

  const list = ed.sessions?.pushups || [];

  const overrides = readGarminActivityDateOverrides(workoutData);

  return list.filter((s) => {

    const y = sessionYmd(s, overrides);

    return y && y >= start && y <= end;

  });

}



function sumReps(sessions) {

  return sessions.reduce((a, s) => a + resolvePushupSessionTotalReps(s), 0);

}



function challengeRepsOnDay(challenges, sessions, dateStr, overrides, workoutData) {

  const due = listPushupChallengesDueOnDate(challenges, dateStr, { workoutData });

  if (due.length === 0) return { planned: 0, done: 0 };

  const daySessions = sessions.filter((s) => sessionYmd(s, overrides) === dateStr);

  const done = sumReps(daySessions);

  const planned = due.reduce((a, c) => a + resolvePushupChallengePlannedReps(c), 0);

  return { planned, done };

}



export function analyzePushupChallengePeriod(workoutData, window) {

  const ed = loadEnduranceData(workoutData?.enduranceData || {});

  const challenges = (ed.challenges || []).filter((c) => c.activityType === 'pushups');

  const overrides = readGarminActivityDateOverrides(workoutData);

  const sessions = pushupSessionsInRange(workoutData, window.start, window.end);

  const totalReps = sumReps(sessions);



  let daysScheduled = 0;

  let daysWithAny = 0;

  let daysHitPlan = 0;

  let daysUnderPlan = 0;

  let daysZero = 0;

  let challengeRepsSum = 0;

  let plannedRepsSum = 0;



  for (let d = new Date(`${window.start}T12:00:00`); ; d.setDate(d.getDate() + 1)) {

    const y = d.toISOString().slice(0, 10);

    if (y > window.end) break;

    const hasSchedule = challenges.some((c) => isChallengeScheduledOnDate(c, y));

    if (!hasSchedule) continue;

    daysScheduled += 1;

    const row = challengeRepsOnDay(challenges, sessions, y, overrides, workoutData);

    plannedRepsSum += row.planned;

    challengeRepsSum += row.done;

    if (row.done > 0) daysWithAny += 1;

    else daysZero += 1;

    if (row.planned > 0 && row.done >= row.planned) daysHitPlan += 1;

    else if (row.planned > 0 && row.done > 0 && row.done < row.planned) daysUnderPlan += 1;

  }



  return {

    totalReps,

    challengeRepsSum,

    plannedRepsSum,

    daysScheduled,

    daysWithAny,

    daysHitPlan,

    daysUnderPlan,

    daysZero,

    adherencePct: daysScheduled > 0 ? Math.round((daysWithAny / daysScheduled) * 100) : null,

    planHitPct: daysScheduled > 0 ? Math.round((daysHitPlan / daysScheduled) * 100) : null,

    challengeSharePct: totalReps > 0 ? Math.round((challengeRepsSum / totalReps) * 100) : 0,

    weeklyNormCompare:

      totalReps >= PUSHUP_WEEKLY_NORM_BAND.high

        ? 'above_high'

        : totalReps >= PUSHUP_WEEKLY_NORM_BAND.mid

          ? 'mid'

          : totalReps >= PUSHUP_WEEKLY_NORM_BAND.low

            ? 'low'

            : 'below_low'

  };

}



export function buildPushupChallengeRecapSnippets(workoutData, window) {

  const stats = analyzePushupChallengePeriod(workoutData, window);

  const lines = [];

  if (stats.daysScheduled < 2 && stats.totalReps < 30) return lines;



  if (stats.daysScheduled >= 3) {

    lines.push(

      `Défis pompes : ${stats.daysWithAny}/${stats.daysScheduled} jours avec séance (${stats.adherencePct} % de présence sur jours prévus).`

    );

    if (stats.daysZero > 0) {

      lines.push(`${stats.daysZero} jour(s) prévu(s) sans pompe — manque surtout de régularité, pas un simple écart de reps.`);

    }

    if (stats.daysUnderPlan > 0) {

      lines.push(`${stats.daysUnderPlan} jour(s) sous le quota prévu du défi.`);

    }

    if (stats.daysHitPlan > 0) {

      lines.push(`${stats.daysHitPlan} jour(s) objectif défi atteint ou dépassé.`);

    }

  }



  if (stats.totalReps >= 40) {

    lines.push(

      `~${stats.challengeRepsSum} pompes sur jours « défi » (${stats.challengeSharePct} % du total ${stats.totalReps} pompes).`

    );

    if (stats.weeklyNormCompare === 'below_low') {

      lines.push(

        `Volume en deçà d’un repère entretien courant (~${PUSHUP_WEEKLY_NORM_BAND.low}–${PUSHUP_WEEKLY_NORM_BAND.mid} pompes / semaine selon niveau).`

      );

    }

  }



  const ed = loadEnduranceData(workoutData?.enduranceData || {});

  const recent = (ed.sessions?.pushups || []).slice(-2);

  for (const s of recent) {

    const br = formatPushupSessionBreakdown(s);

    if (br.includes('×')) {

      lines.push(`Répartition récente : ${br}.`);

      break;

    }

  }



  return lines.slice(0, 5);

}


