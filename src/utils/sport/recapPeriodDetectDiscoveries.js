/**
 * Production des découvertes période (detectDiscoveries + helpers).
 * Extrait de recapPeriodDiscoveries.js — comportement inchangé.
 */

import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import { addCalendarDays, inclusiveCalendarSpanDays } from './garminRunningPeriodStats';
import { formatRateFr } from './athleteTrainingIdentity';
import { formatDayFr, daysBetweenYmd } from './recapTrainingTimeline';
import { createSetShiftReader } from './recapSetShift';
import { describeCalendarShape } from './recapCalendarShape';
import { describeStepReadings } from './recapStepReading';
import { describeRestDay } from './recapRestDayReading';
import { primaryGroup, sameDayCompanions, writeExerciseEvent } from './recapFactReading';
import { CONTENT_CLASS } from './recapDiscoveryContentClass';
import {
  buildExerciseTrajectory,
  renderExerciseTrajectoryCopy,
  trajectoryToMetrics
} from './exerciseTrajectoryAnalysis';
import {
  composeAnalyticalReading,
  densityImplication,
  pushPullImplication,
  volumeShapeImplication,
  peakDayImplication
} from './recapAnalyticalReading';
import { baselineTraceMetrics } from './recapPersonalBaselines';
import { possessiveMuscleShare } from './recapPeriodVoice';
import {
  detectFamilyFades,
  detectStructuralShifts,
  stimulusContrast,
  tallyStimulus
} from './recapStimulusCatalog';
import { detectRecapMilestones } from './recapMilestoneEngine';
import {
  buildMonthlyVolumeArcDiscoveries,
  buildRunningGapDiscoveries
} from './monthlyVolumeArcDiscoveries';
import { buildTrainingRhythmDiscoveries } from './trainingRhythmDiscoveries';
import { formatSleepHoursFr, formatSleepMinutesFr, summarizeRecentNights } from './recapSleepCorrelation';
import { comparableWeeklyRates } from './recapInsightNature';
import { sessionRhythmClause } from './recapPeriodComparisons';
import {
  periodVerb,
  isLongVoice,
  agreeEst,
  agreeVerb,
  agreePorteLabel,
  weekdayFr,
  lastCatalogSession,
  sameWeekdaySessions,
  muscleAvecArticle,
  capLabel,
  peakPortrait,
  runPortrait,
  kcalPortrait,
  periodPortraitTail,
  continuityTail,
  fmtInt,
  fmt1,
  fmtPct,
  fmtSignedPct,
  formatDurationFr,
  pctChange,
  share,
  discovery
} from './recapPeriodVoice';

export function detectDiscoveries(cmp, extras = {}) {
  const out = [];
  const { period: p, d7, d30, d90, prev30, prevSameLength, first30, identity, voice: v } = cmp;
  const volumeBaseline =
    isLongVoice(v) && prevSameLength ? prevSameLength : prev30;
  const volumeBaselineLabel = isLongVoice(v)
    ? 'la période précédente de même durée'
    : 'les 30 jours d\'avant';
  if (!p) return out;

  const isToday = v.key === 'today';
  const isWeek = v.key === 'week';
  const isMonth = v.key === 'month';
  const emptyPeriod = (p.totalReps || 0) < 20;
  const baselines = extras.baselines || [];
  const comparable = extras.comparable || null;
  const sleepAssoc = extras.sleepAssoc || [];
  const sleepCtx = extras.sleepContext || null;
  const restAssoc = extras.restAssoc || null;
  const features = extras.features || {};
  const catalog = extras.catalog || [];
  const trajPerf = extras.perfTimer || null;
  const measureTraj = (fn) =>
    trajPerf?.measure ? trajPerf.measure('buildExerciseTrajectory', fn) : fn();

  if (emptyPeriod) {
    const restToday = isToday ? describeRestDay({
      program: extras.activeProgram,
      snapshot: extras.snapshot,
      date: p.window?.end
    }) : null;
    if (restToday) {
      out.push(
        discovery({
          kind: 'disc_rest_day',
          nature: 'now',
          family: 'rest_day',
          title: restToday.title,
          body: restToday.body,
          evidence: restToday.evidence,
          weights: { importance: 0.98, reliability: 0.96, novelty: 0.9, fit: 1 }
        })
      );
    }
    const end = p.window?.end;
    const last = lastCatalogSession(catalog, end);
    const twins = sameWeekdaySessions(catalog, end, end);
    const wd = weekdayFr(end);
    const recentTwins = twins.slice(-6);
    const twinMean =
      recentTwins.length >= 2
        ? recentTwins.reduce((s, r) => s + r.totalReps, 0) / recentTwins.length
        : null;
    const lastEx = (last?.exercises || []).slice(0, 3);
    const lastBit = last
      ? ` Ta dernière séance (${formatDayFr(last.date, true)}) a produit ${fmtInt(last.totalReps)} répétitions${
          last.minutes >= 20 ? ` en ${formatDurationFr(last.minutes)}` : ''
        }${lastEx.length ? ` — ${lastEx.map((e) => `${fmtInt(e.reps)} ${String(e.name || '').toLowerCase()}`).join(', ')}` : ''}.`
      : '';
    const twinBit =
      twinMean != null && wd
        ? ` Tes ${wd}s récents se situent autour de ${fmtInt(twinMean)} reps (${twins.length} ${wd}s comparables) : ce n'est pas un jour « off » par défaut, c'est une séance encore devant toi.`
        : wd
          ? ` ${wd.charAt(0).toUpperCase()}${wd.slice(1)} n'est pas encore commencé.`
          : '';
    const weekBit =
      d7?.trainingDays >= 1
        ? ` Autour de toi, les 7 derniers jours totalisent déjà ${fmtInt(d7.totalReps)} reps en ${d7.trainingDays} séance${d7.trainingDays > 1 ? 's' : ''}${
            d7.repsPerSession != null ? ` (≈${fmtInt(d7.repsPerSession)} reps/séance)` : ''
          }.`
        : '';
    const sleepBit =
      sleepCtx?.hours != null
        ? ` La nuit qui se termine ce matin est déjà là (${fmt1(sleepCtx.hours)} h${
            sleepCtx.habitHours != null ? `, habitude ~${fmt1(sleepCtx.habitHours)} h` : ''
          }) : la récupération précède la séance, elle ne l'attend pas.`
        : '';
    if (!restToday) {
    out.push(
      discovery({
        kind: 'disc_pending_session',
        nature: 'now',
        family: 'pending',
        title: isToday
          ? "La séance d'aujourd'hui n'est pas encore commencée"
          : `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} n'a pas encore de volume entraîné`,
        body: isToday
          ? `Aujourd'hui, tu n'as encore rien coché (0 répétition). Ce n'est pas un jour vide d'analyse : c'est une séance en attente.${lastBit}${twinBit}${weekBit}${sleepBit} Le bandeau à zéro décrit l'attente, pas une baisse de capacité. La lecture d'aujourd'hui se fera dès que tu auras réalisé l'entraînement.`
          : `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} totalise 0 répétition cochée.${lastBit}${weekBit} Tant qu'aucune séance n'est saisie sur la fenêtre, on ne compare pas un zéro à ton habitude : on décrit l'attente, puis le rythme autour.`,
        evidence: last ? `dernière séance ${formatDayFr(last.date, true)} · ${fmtInt(last.totalReps)} reps` : '0 reps',
        weights: { importance: 0.97, reliability: 0.95, novelty: 0.9, fit: 1 }
      })
    );
    const ctxSrc = isToday ? d7 : d30;
    if (ctxSrc && ctxSrc.trainingDays >= 2 && ctxSrc.totalReps >= 80) {
      const per =
        ctxSrc.repsPerSession != null
          ? `, soit environ ${fmtInt(ctxSrc.repsPerSession)} reps${
              ctxSrc.minutesPerSession ? ` et ${formatDurationFr(ctxSrc.minutesPerSession)}` : ''
            } par séance`
          : '';
      out.push(
        discovery({
          kind: 'disc_pending_context',
          nature: 'trajectory',
          family: 'pending_context',
          title: isToday
            ? "En attendant la séance, ta semaine récente a déjà une forme"
            : `Le rythme autour ${v.ofPeriod} reste lisible`,
          body: `${isToday ? 'Les 7 derniers jours' : 'Les 30 derniers jours'} représentent ${ctxSrc.trainingDays} séance${ctxSrc.trainingDays > 1 ? 's' : ''}, ${fmtInt(ctxSrc.totalReps)} répétitions et ${formatDurationFr(ctxSrc.minutes || ctxSrc.totalMinutes)} d'entraînement${per}.${periodPortraitTail(ctxSrc, {
            ...v,
            thisPeriod: isToday ? 'cette semaine récente' : 'ces 30 jours',
            ofPeriod: isToday ? 'de la semaine récente' : 'du mois récent'
          })} Ce n'est pas un substitut d'aujourd'hui : c'est ce qui se construit pendant que la séance du jour n'est pas encore faite.`,
          evidence: `${ctxSrc.trainingDays} séances · ${fmtInt(ctxSrc.totalReps)} reps`,
          weights: { importance: 0.88, reliability: 0.9, novelty: 0.84, fit: 1 }
        })
      );
    }
    }
  }

  const calendar = !isToday
    ? describeCalendarShape({
        repsByDate: p.repsByDate,
        start: p.window?.start,
        end: p.window?.end,
        thisPeriod: v.thisPeriod
      })
    : null;
  if (calendar) {
    out.push(
      discovery({
        kind: 'disc_calendar_rhythm',
        nature: 'now',
        family: 'calendar_rhythm',
        title: calendar.title,
        body: calendar.body,
        evidence: calendar.evidence,
        metrics: calendar.metrics || null,
        weights: { importance: 0.84, reliability: 0.9, novelty: 0.8, fit: isWeek ? 1 : 0.86 }
      })
    );
  }

  describeStepReadings({
    dailyMetrics: extras.garminData?.dailyMetrics,
    start: p.window?.start,
    end: p.window?.end,
    trainingDates: Object.keys(p.repsByDate || {}),
    thisPeriod: v.thisPeriod
  }).forEach((step) => {
    out.push(
      discovery({
        kind: step.nature === 'now' ? 'disc_steps_split' : 'disc_steps_level',
        nature: step.nature,
        family: 'steps',
        title: step.title,
        body: step.body,
        evidence: step.evidence,
        weights: { importance: 0.8, reliability: 0.88, novelty: 0.84, fit: 0.9 }
      })
    );
  });

  if ((isToday || isWeek) && !emptyPeriod && p.repsPerHour != null && p.minutes >= 20) {
    const densityRef = isToday || isWeek ? d30 : isMonth ? prev30 : first30;
    const vs30 =
      densityRef?.repsPerHour != null ? pctChange(p.repsPerHour, densityRef.repsPerHour) : null;
    const vs7 = !isWeek && !isMonth && v.key !== 'long' && d7.repsPerHour != null
      ? pctChange(p.repsPerHour, d7.repsPerHour)
      : null;
    if (vs30 != null || vs7 != null) {
      const denser = (vs30 ?? vs7) > 3;
      const lighter = (vs30 ?? vs7) < -3;
      const title = isToday
        ? denser
          ? 'Une séance plus dense que ton rythme récent'
          : lighter
            ? 'Une séance légèrement moins dense que ton rythme récent, mais avec un volume par séance toujours élevé'
            : 'Une densité de séance proche de ton rythme récent'
        : denser
          ? `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} ${periodVerb(v.thisPeriod, 'est', 'sont')} plus dense${/jours/i.test(v.thisPeriod) ? 's' : ''} que ton rythme habituel`
          : lighter
            ? `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} ${periodVerb(v.thisPeriod, 'concentre', 'concentrent')} le travail sur moins de temps`
            : `La densité ${v.ofPeriod} reste proche de ton rythme habituel`;
      const hourBit = `${fmtInt(p.totalReps)} répétitions en ${formatDurationFr(p.minutes)}, soit environ ${fmtInt(p.repsPerHour)} reps par heure`;
      const monthBit =
        vs30 != null
          ? isMonth
            ? `Le mois précédent était à environ ${fmtInt(prev30.repsPerHour)} reps par heure : ${v.thisPeriod} ${periodVerb(v.thisPeriod, 'est', 'sont')} donc ${fmtPct(Math.abs(vs30))} ${vs30 >= 0 ? 'plus dense' : 'moins dense'}${/jours/i.test(v.thisPeriod) ? 's' : ''} que les 30 jours d'avant`
            : isLongVoice(v)
              ? `Le premier mois de la fenêtre était à environ ${fmtInt(first30.repsPerHour)} reps/h : ${v.thisPeriod} ${periodVerb(v.thisPeriod, 'est', 'sont')} ${fmtPct(Math.abs(vs30))} ${vs30 >= 0 ? 'plus dense' : 'moins dense'}${/jours/i.test(v.thisPeriod) ? 's' : ''} que ce début de période`
              : `Sur tes 30 derniers jours, tu réalises en moyenne environ ${fmtInt(d30.repsPerHour)} reps par heure : ${v.thisPeriod} ${periodVerb(v.thisPeriod, 'est', 'sont')} donc ${fmtPct(Math.abs(vs30))} ${vs30 >= 0 ? 'plus dense' : 'moins dense'}${/jours/i.test(v.thisPeriod) ? 's' : ''} que ton rythme mensuel`
          : '';
      const weekBit =
        vs7 != null
          ? `, tout en restant ${Math.abs(vs7) < 4 ? 'quasiment au niveau' : vs7 >= 0 ? 'au-dessus' : 'en retrait'} de ta moyenne des 7 derniers jours (${fmtInt(d7.repsPerHour)} reps/h)`
          : '';
      const sessBit = sessionRhythmClause(p, { today: isToday, d7 });
      const vsMain = vs30 ?? vs7;
      const densReading = composeAnalyticalReading({
        titleThesis: title,
        constat: `${isToday ? 'Tu as réalisé' : `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} ${periodVerb(v.thisPeriod, 'concentre', 'concentrent')}`} ${hourBit}`,
        mechanism: monthBit || null,
        scope: `${weekBit ? weekBit.replace(/^,\s*/, '') : ''}${sessBit || ''}`.trim() || null,
        implication: densityImplication({
          denser,
          lighter,
          vsPct: vsMain,
          sleepHours: sleepCtx?.hours,
          sleepHabitHours: sleepCtx?.habitHours
        }),
        limit:
          sleepCtx?.hours != null && (isToday || isWeek)
            ? `La nuit${
                sleepCtx?.night?.ymd ? ` du ${formatDayFr(sleepCtx.night.ymd)}` : ''
              } (${fmt1(sleepCtx.hours)} h${
                sleepCtx.habitHours != null ? `, habitude ~${fmt1(sleepCtx.habitHours)} h` : ''
              }) entre dans cette lecture sans en faire une preuve de causalité`
            : null
      });
      out.push(
        discovery({
          kind: 'disc_density',
          nature: 'now',
          family: 'density',
          title: densReading.title,
          body: densReading.body,
          evidence: [
            `${fmtInt(p.repsPerHour)} reps/h`,
            d30.repsPerHour != null ? `30 j. ${fmtInt(d30.repsPerHour)}/h` : null,
            d7.repsPerHour != null && !isWeek ? `7 j. ${fmtInt(d7.repsPerHour)}/h` : null
          ]
            .filter(Boolean)
            .join(' · '),
          weights: { importance: 0.88, reliability: 0.92, novelty: 0.86, fit: isToday || isWeek || isMonth ? 1 : 0.86 },
          metrics: { repsPerHour: p.repsPerHour, vs30, vs7, readingBeats: densReading.beats }
        })
      );
    }
  }

  const habitRate = identity?.frequency?.meanPerWeek;
  if (p.trainingDays >= 1 && (isWeek || isToday)) {
    const weekRate = isToday
      ? d7.trainingDays > 0
        ? Math.round((d7.trainingDays / 7) * 7 * 10) / 10
        : null
      : Math.round((p.trainingDays / Math.max(1, p.spanDays)) * 7 * 10) / 10;
    const sessionsBit = isToday
      ? `Tu as réalisé ${fmtInt(p.totalReps)} répétitions en ${formatDurationFr(p.minutes || p.totalMinutes)}`
      : `${p.trainingDays} séance${p.trainingDays > 1 ? 's' : ''}, ${fmtInt(p.totalReps)} répétitions et ${formatDurationFr(p.minutes || p.totalMinutes)} d'entraînement`;
    const perSess = isToday ? '' : sessionRhythmClause(p);
    const habitBit =
      habitRate != null && weekRate != null
        ? `. Ton rythme hebdomadaire reste donc ${Math.abs(weekRate - habitRate) < 0.6 ? 'proche' : weekRate < habitRate ? 'inférieur' : 'supérieur'} à ton niveau habituel de ${formatRateFr(habitRate)} séances/semaine`
        : weekRate != null
          ? `. Tu es actuellement autour de ${formatRateFr(weekRate)} séances par semaine`
          : '';
    const sparse =
      !isToday &&
      p.trainingDays <= 2 &&
      habitRate != null &&
      weekRate != null &&
      weekRate + 0.8 < habitRate;
    const concentrate = sparse
      ? p.trainingDays === 1
        ? `La baisse vient du nombre de journées entraînées, pas d'une séance particulièrement courte. ${fmtInt(p.totalReps)} reps sur une seule journée, c'est une organisation plus dense que ton rythme habituel`
        : `Tu n'as pas seulement réduit le total : tu as changé la façon dont il est réparti. Une semaine isolée ne pose pas de problème en soi ; elle rompt avec une organisation habituellement étalée sur plusieurs jours`
      : !isToday && p.trainingDays >= 2 && p.repsPerSession != null && p.repsPerSession >= 200
        ? `Les séances restent longues. Ce qui change, c'est le nombre de journées, pas la durée de chacune`
        : '';
    const volumeTitle = isToday
      ? 'Le volume réalisé aujourd\'hui reste élevé par séance'
      : sparse && p.trainingDays === 1
        ? 'Une seule séance porte tout le volume'
        : sparse || (p.trainingDays <= 3 && (habitRate == null || weekRate <= habitRate))
          ? 'Peu de journées portent le volume'
          : `Le rythme ${v.ofPeriod} reste lisible par rapport à ton habitude`;
    const volReading = composeAnalyticalReading({
      titleThesis: volumeTitle,
      constat: `${sessionsBit}${perSess}${habitBit}`
        .replace(/^\s*\.\s*/, '')
        .replace(/\.\s*\./g, '.')
        .replace(/\.\s*$/, '')
        .trim(),
      mechanism: concentrate || null,
      scope: String(continuityTail(v, p, d7, d30) || '')
        .replace(/^\s*\.\s*/, '')
        .trim() || null,
      implication: volumeShapeImplication({
        sparse,
        singleDay: sparse && p.trainingDays === 1,
        habitBelow:
          habitRate != null && weekRate != null && weekRate + 0.8 < habitRate
      })
    });
    out.push(
      discovery({
        kind: 'disc_volume_shape',
        nature: 'now',
        family: 'volume_shape',
        title: volReading.title,
        body: volReading.body,
        evidence: '',
        weights: { importance: 0.96, reliability: 0.94, novelty: 0.82, fit: 1 },
        metrics: periodTraceMetrics(p, { weekRate, habitRate, readingBeats: volReading.beats })
      })
    );
  }

  if (isMonth && p.totalReps >= 200) {
    const base = volumeBaseline;
    const strengthDays = p.strengthDays ?? p.trainingDays;
    const baseStrengthDays = base?.strengthDays ?? base?.trainingDays;
    const volPct = base?.totalReps >= 200 ? pctChange(p.totalReps, base.totalReps) : null;
    const freqPct = baseStrengthDays >= 1 ? pctChange(strengthDays, baseStrengthDays) : null;
    const vsPrev =
      base?.totalReps >= 200
        ? `, contre ${fmtInt(base.totalReps)} reps sur ${baseStrengthDays} jours avec répétitions de renforcement sur ${volumeBaselineLabel} (${fmtSignedPct(volPct)}${
            freqPct != null ? `, fréquence ${fmtSignedPct(freqPct)}` : ''
          }${
            base.repsPerSession != null && p.repsPerSession != null
              ? `, ${fmtInt(p.repsPerSession)} vs ${fmtInt(base.repsPerSession)} reps/séance`
              : ''
          })`
        : '';
    const vsRead =
      volPct != null
        ? freqPct != null && volPct > 4 && freqPct < -4
          ? 'Le volume monte alors que tu t’entraînes moins souvent : les séances sont plus denses, pas plus nombreuses'
            : freqPct != null && volPct < -4 && Math.abs(freqPct) < 6
            ? 'La fréquence tient, mais chaque séance produit moins de répétitions'
            : freqPct != null && volPct < -8 && freqPct < -8
              ? `Une partie du recul vient du nombre de jours avec répétitions de renforcement (${baseStrengthDays} → ${strengthDays}), pas seulement de séances plus petites`
              : 'La comparaison utile est donc période contre période de même durée'
        : 'Sans période précédente assez fournie, on lit ces 30 jours par leur rythme interne';
    const monthVolTitle =
      volPct == null
        ? 'Ces 30 jours ont un volume, un rythme et une composition'
        : Math.abs(volPct) < 8
          ? 'Le volume de ces 30 jours reste proche de la période précédente'
          : volPct > 0
            ? 'Le volume de ces 30 jours dépasse la période précédente'
            : 'Le volume de ces 30 jours recule par rapport à la période précédente';
    const monthVolReading = composeAnalyticalReading({
      titleThesis: monthVolTitle,
      constat: `Ces 30 jours totalisent ${fmtInt(p.totalReps)} répétitions sur ${strengthDays} jours avec répétitions de renforcement${sessionRhythmClause(p)}${vsPrev}`,
      mechanism: vsRead,
      scope:
        Number.isFinite(features.volumeDelta28Pct) && Number.isFinite(features.volumeDelta7Pct)
          ? `Les répétitions suivies sur 28 jours sont ${fmtSignedPct(features.volumeDelta28Pct)} que le mois comparable, tandis que les 7 derniers jours ${
              features.volumeDelta7Pct > 4 ? 'repartent' : 'restent'
            } (${fmtSignedPct(features.volumeDelta7Pct)})`
          : null,
      implication:
        freqPct != null && volPct != null && volPct > 4 && freqPct < -4
          ? 'Ce n’est pas plus de séances : c’est plus de travail par séance sur la même durée de calendrier'
          : null
    });
    out.push(
      discovery({
        kind: 'disc_volume_shape',
        nature: 'now',
        family: 'volume_shape',
        title: monthVolReading.title,
        body: monthVolReading.body,
        evidence: base?.totalReps >= 200
          ? `${fmtInt(p.totalReps)} vs ${fmtInt(base.totalReps)} · ${fmtSignedPct(volPct)}`
          : `${fmtInt(p.totalReps)} reps · ${strengthDays} j.`,
        weights: { importance: 0.95, reliability: 0.92, novelty: 0.86, fit: 1 },
        metrics: periodTraceMetrics(p, {
          volPct,
          freqPct,
          windowSpanDays: p.spanDays,
          baselineSpanDays: base?.spanDays ?? 30,
          baselineSameLength: true,
          readingBeats: monthVolReading.beats
        })
      })
    );
  }

  if (isLongVoice(v) && p.trainingDays >= 8 && p.totalReps >= 400) {
    const rates = comparableWeeklyRates({
      features,
      identity,
      windowLen: p.spanDays,
      currRate:
        p.spanDays > 0 ? Math.round((p.trainingDays / p.spanDays) * 7 * 10) / 10 : null,
      habitRate: identity?.frequency?.meanPerWeek ?? null
    });
    const perSess = p.repsPerSession != null ? ` soit environ ${fmtInt(p.repsPerSession)} reps par séance` : '';
    const rateBit =
      rates.current != null && rates.previous != null && rates.source === '28d'
        ? ` Ton rythme comparable sur 28 jours est de ${formatRateFr(rates.current)} séances/semaine, contre ${formatRateFr(rates.previous)} sur les 28 jours d'avant — ce n'est pas le taux de la fenêtre entière.`
        : rates.current != null && rates.previous != null && rates.source !== 'fallback'
          ? ` Ton rythme récent se situe autour de ${formatRateFr(rates.current)} séances/semaine, contre ${formatRateFr(rates.previous)} en référence.`
          : '';
    const muscleBit =
      p.muscles.length >= 2
        ? ` Répartition identifiée : ${p.muscles
            .slice(0, 4)
            .map((m) => `${fmtInt(m.reps)} ${m.label}`)
            .join(', ')}.`
        : '';
    const repDates = Object.keys(p.repsByDate || {}).sort();
    const firstRep = repDates[0];
    const historyGap =
      v.key === 'year' && firstRep && p.window?.start
        ? daysBetweenYmd(p.window.start, firstRep)
        : 0;
    const historyBit =
      historyGap > 60
        ? ` Les répétitions comptées commencent le ${formatDayFr(firstRep, true)}, pas au premier jour du calendrier de la fenêtre.`
        : '';
    const longTitle =
      v.unit === 'année'
        ? "L'année suivie a un volume et un rythme, pas seulement un total"
        : v.unit === 'semestre'
          ? 'Ces six mois ont un volume et un rythme, pas seulement un total'
          : 'Le trimestre a un volume et un rythme, pas seulement un total';
    out.push(
      discovery({
        kind: 'disc_volume_shape',
        nature: 'now',
        family: 'volume_shape',
        title: longTitle,
        body: `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} totalise ${fmtInt(p.totalReps)} répétitions en ${p.trainingDays} jours entraînés,${perSess}.${historyBit}${rateBit}${muscleBit} La question n'est pas « tu manques de régularité » : c'est comment ce volume se construit.${peakPortrait(p, v)}${runPortrait(p)}${kcalPortrait(p)}${continuityTail(v, p, d7, d30)}`,
        evidence: [
          `${fmtInt(p.totalReps)} reps`,
          `${p.trainingDays} j.`,
          rates.current != null && rates.previous != null
            ? `${formatRateFr(rates.current)} vs ${formatRateFr(rates.previous)}/sem.`
            : null
        ]
          .filter(Boolean)
          .join(' · '),
        weights: { importance: 0.93, reliability: 0.92, novelty: 0.86, fit: 1 },
        metrics: { totalReps: p.totalReps, trainingDays: p.trainingDays, rateSource: rates.source }
      })
    );
  }

  if (p.muscles.length >= 2 && p.identifiedMuscleReps >= 80) {
    const top = p.muscles.slice(0, 4);
    const topShare = share(top[0].reps, p.totalReps);
    const extra = p.muscles.find((m) => m.group === MuscleGroups.CORE && !top.some((t) => t.group === m.group));
    const extraBit = extra && extra.reps >= 20 ? `, auxquels s'ajoutent ${fmtInt(extra.reps)} reps de ${extra.label}` : '';
    const pullShare = share(p.byMuscle[MuscleGroups.BACK]?.reps || 0, p.totalReps);
    const tirageBit =
      pullShare != null && top[0].group !== MuscleGroups.BACK
        ? `, et le tirage pèse environ ${fmtPct(pullShare)} du volume`
        : '';
    const nearBit =
      top.length > 1 && top[0].reps - top[1].reps <= Math.max(20, top[0].reps * 0.08)
        ? ` L'écart entre ${top[0].label} et ${top[1].label} n'est que de ${fmtInt(top[0].reps - top[1].reps)} reps : la première place est serrée.`
        : '';
    const pushNow = p.pushReps || 0;
    const backNow = p.byMuscle[MuscleGroups.BACK]?.reps || 0;
    const ratioBit =
      pushNow >= 80 && backNow > 0 && pushNow > backNow * 1.6
        ? ` Les mouvements de poussée (pectoraux, épaules, triceps) totalisent ${fmtInt(pushNow)} reps, contre ${fmtInt(backNow)} pour le dos : le haut du corps est clairement plus exposé en poussée.`
        : '';
    const missingPull =
      pushNow > backNow * 2
        ? ` À volume de poussée égal, le dos reste nettement derrière dans cette fenêtre (écart ~${fmtInt(Math.round(pushNow / 2 - backNow))} reps) — constat de répartition, pas un quota à rattraper.`
        : '';
    const indirect =
      top[0].group === MuscleGroups.SHOULDERS &&
      (p.exercises || []).some((exercise) => /pomp|développé|developpe/i.test(exercise.name || ''))
        ? ` Les pompes et les développés de la fenêtre ne sont pas tous dans ces reps d'épaules : la charge réelle sur l'épaule dépasse cette part.`
        : '';
    {
      const titleThesis = isToday
        ? `${capLabel(top[0].label)} mène le volume d’aujourd’hui`
        : topShare != null
          ? `${capLabel(top[0].label)} ${agreePorteLabel(capLabel(top[0].label))} ${fmtPct(topShare)} du volume de ${v.thisPeriod}`
          : `${capLabel(top[0].label)} mène le volume de ${v.thisPeriod}`;
      const muscleReading = composeAnalyticalReading({
        titleThesis,
        constat: `${fmtInt(top[0].reps)} reps attribuées à ${muscleAvecArticle(top[0].label)} sur ${fmtInt(p.totalReps)} reps de la fenêtre${
          top.length > 1
            ? `, contre ${top
                .slice(1)
                .map((m) => `${fmtInt(m.reps)} pour ${muscleAvecArticle(m.label)}`)
                .join(', ')}`
            : ''
        }${extraBit}`,
        mechanism: nearBit.trim() || null,
        scope: `Ce n'est pas le pic d'un seul exercice : plusieurs mouvements vont dans le même sens${tirageBit}.${ratioBit}${missingPull}${indirect}`.trim(),
        implication: pushPullImplication({ pushReps: pushNow, pullReps: backNow }),
        limit:
          `Répartition indicative (parts conventionnelles primary/secondary), pas une mesure anatomique exacte. Composition de ${v.thisPeriod}, pas d'une séance isolée`
      });
      out.push(
        discovery({
          kind: 'disc_muscle_now',
          nature: 'now',
          family: 'muscle_now',
          contentClass: CONTENT_CLASS.DESCRIPTIVE,
          title: muscleReading.title,
          body: muscleReading.body,
          evidence: `${top.length} groupes · ${fmtInt(p.identifiedMuscleReps)} reps attribuées (indicatif)`,
          weights: { importance: 0.7, reliability: 0.72, novelty: 0.58, fit: 0.9 },
          metrics: {
            topGroup: top[0].group,
            topShare,
            readingBeats: muscleReading.beats,
            attributionMode: 'conventional_rep_share'
          }
        })
      );
    }
  }

  if (p.peakDay && p.trainingDays >= 2 && (p.peakDay.sharePct || 0) >= 28) {
    const peakEx = (p.peakDay.exercises || p.exercisesByDate?.[p.peakDay.date] || []).slice(0, 3);
    const otherReps = Math.max(0, (p.totalReps || 0) - p.peakDay.reps);
    const sessionValues = Object.values(p.repsByDate || {})
      .map(Number)
      .filter((n) => n > 0)
      .sort((a, b) => a - b);
    const mid = Math.floor(sessionValues.length / 2);
    const sessionMedian = sessionValues.length
      ? sessionValues.length % 2
        ? sessionValues[mid]
        : (sessionValues[mid - 1] + sessionValues[mid]) / 2
      : null;
    const namedPeak = peakEx.filter(
      (e) => e?.name && String(e.name).trim() && !/^un mouvement$/i.test(String(e.name))
    );
    const leadPeak = namedPeak[0] || peakEx[0];
    const peakMates = leadPeak
      ? sameDayCompanions(leadPeak, { [p.peakDay.date]: p.peakDay.exercises || [] }).filter(
          (m) => m?.name && !/^un mouvement$/i.test(String(m.name))
        )
      : [];
    const aboveMedian = sessionMedian != null && p.peakDay.reps > sessionMedian * 1.12;
    const peakReading = composeAnalyticalReading({
      titleThesis: `La séance du ${formatDayFr(p.peakDay.date, true)} concentre une part importante ${v.ofPeriod}`,
      constat: `La séance du ${formatDayFr(p.peakDay.date, true)} concentre ${fmtInt(p.peakDay.reps)} reps, soit ${fmtPct(p.peakDay.sharePct)} de la fenêtre${
        otherReps > 0 ? ` ; les autres jours cumulent ${fmtInt(otherReps)} reps` : ''
      }`,
      mechanism: namedPeak.length
        ? `Les volumes du jour se répartissent surtout ainsi : ${namedPeak
            .map((e) => `${fmtInt(e.reps)} reps de ${String(e.name).toLowerCase()}`)
            .join(', ')}${
            peakMates.length && leadPeak?.name
              ? ` — ${fmtInt(leadPeak.reps + peakMates[0].reps)} de ces reps (${String(leadPeak.name).toLowerCase()} et ${String(peakMates[0].name).toLowerCase()}) portent sur le même groupe`
              : ''
          }`
        : null,
      scope: aboveMedian
        ? `La médiane des séances de la fenêtre est ${fmtInt(Math.round(sessionMedian))} reps : ce pic dépasse ce niveau, sans en faire à lui seul une exception hors historique`
        : `Sur une fenêtre courte, le jour le plus volumineux n'est pas forcément exceptionnel : c'est d'abord le maximum de ces ${fmtInt(p.trainingDays)} séances`,
      implication: peakDayImplication({
        sharePct: p.peakDay.sharePct,
        aboveMedian
      })
    });
    out.push(
      discovery({
        kind: 'disc_peak_day',
        nature: 'now',
        family: 'peak_day',
        title: peakReading.title,
        body: peakReading.body,
        evidence: `${formatDayFr(p.peakDay.date, true)} · ${fmtInt(p.peakDay.reps)} reps · ${fmtPct(p.peakDay.sharePct)}`,
        weights: { importance: 0.87, reliability: 0.93, novelty: 0.88, fit: isWeek ? 1 : 0.8 },
        metrics: periodTraceMetrics(p, {
          peakDate: p.peakDay.date,
          peakReps: p.peakDay.reps,
          sharePct: p.peakDay.sharePct,
          dates: [p.peakDay.date, ...Object.keys(p.repsByDate || {})].filter(Boolean),
          readingBeats: peakReading.beats
        })
      })
    );
  }

  if (p.runningKm <= 0.2 && p.runningMinutes <= 0 && p.totalReps >= 80) {
    const hadRun = (d30.runningKm || 0) > 1 || (d90.runningKm || 0) > 3;
    const noRunReading = composeAnalyticalReading({
      titleThesis: hadRun
        ? `Aucune course enregistrée ${v.now}, la charge vient du renforcement`
        : `La charge ${v.ofPeriod} provient entièrement des exercices de renforcement`,
      constat: `Aucune course n'a été enregistrée ${isToday ? "aujourd'hui" : `sur ${v.thisPeriod}`}`,
      mechanism: `La charge d'entraînement ${v.ofPeriod} provient donc entièrement des exercices de renforcement`,
      scope: hadRun
        ? `Par rapport à tes périodes précédentes où la course représentait une partie identifiable du volume d'activité, ${v.thisPeriod} marque un déplacement net vers le travail de force/endurance musculaire`
        : null,
      implication: hadRun
        ? 'Ce n’est pas une absence à combler automatiquement : c’est le stimulus réellement reçu sur cette fenêtre'
        : null
    });
    out.push(
      discovery({
        kind: 'disc_no_running',
        nature: 'now',
        family: 'no_running',
        title: noRunReading.title,
        body: noRunReading.body,
        evidence: hadRun ? '0 km · course présente sur 30/90 j.' : '0 km',
        weights: { importance: hadRun ? 0.78 : 0.55, reliability: 0.95, novelty: hadRun ? 0.88 : 0.55, fit: 0.9 },
        metrics: { readingBeats: noRunReading.beats }
      })
    );
  }

  const monthMuscles = d30.muscles;
  if (monthMuscles.length && p.muscles.length) {
    const contrasts = p.muscles
      .map((m) => {
        const month = d30.byMuscle[m.group]?.reps || 0;
        const pct = share(m.reps, month);
        return { ...m, monthReps: month, ofMonthPct: pct };
      })
      .filter((m) => m.monthReps >= 80 && m.reps >= 25 && m.ofMonthPct != null)
      .sort((a, b) => b.ofMonthPct - a.ofMonthPct);
    const lead = contrasts[0];
    const low = contrasts.filter((m) => m.group !== lead?.group && m.ofMonthPct < 12).slice(0, 2);
    // Tautologie : fenêtre ≈ 30 j. comparée à d30 (même période) → ofMonthPct ~100 %.
    // BUGFIX (isolé de la modularisation) : contrasts peut être vide → lead undefined.
    // Avant : TypeError sur lead.ofMonthPct (repro : recapSetShift « niveau habituel »).
    const comparesPeriodToItself =
      isMonth ||
      (Number(p.spanDays) >= 28 && Number(p.spanDays) <= 32) ||
      (lead?.ofMonthPct != null && lead.ofMonthPct >= 95 && Number(lead.reps) === Number(lead.monthReps));
    if (lead && lead.ofMonthPct >= 18 && !comparesPeriodToItself) {
      const reorientReading = composeAnalyticalReading({
        titleThesis: isToday
          ? `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} concentre une part élevée des ${lead.label} du mois`
          : `La part attribuée aux ${lead.label} ${v.ofPeriod} ressort face aux 30 derniers jours`,
        constat: `Les ${lead.label} représentent ${v.now} ${fmtInt(lead.reps)} reps attribuées (répartition indicative), contre ${fmtInt(lead.monthReps)} sur les 30 derniers jours`,
        mechanism: `À elle seule, ${v.thisPeriod} concentre environ ${fmtPct(lead.ofMonthPct)} de l’exposition attribuée ${lead.label} du dernier mois`,
        scope: low.length
          ? `Le contraste est notable avec ${low
              .map((m) => `${fmtInt(m.reps)} reps ${m.label} (≈${fmtPct(m.ofMonthPct)} de leur volume mensuel attribué)`)
              .join(' et ')}`
          : null,
        implication: isToday
          ? `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} déplace la composition attribuée vers les ${lead.label} par rapport au mois`
          : `Lecture de composition (parts conventionnelles), pas une mesure de stimulation musculaire`,
        limit: 'Parts issues d’une attribution conventionnelle des répétitions ; pas une preuve d’hypertrophie ni de déséquilibre à corriger'
      });
      out.push(
        discovery({
          kind: 'disc_muscle_reorient',
          nature: 'trajectory',
          family: 'muscle_shift',
          contentClass: CONTENT_CLASS.DESCRIPTIVE,
          title: reorientReading.title,
          body: reorientReading.body,
          evidence: contrasts
            .slice(0, 4)
            .map((m) => `${m.label} ${fmtPct(m.ofMonthPct)} du mois`)
            .join(' · '),
          weights: { importance: 0.72, reliability: 0.7, novelty: 0.7, fit: 0.88 },
          metrics: {
            leadGroup: lead.group,
            ofMonthPct: lead.ofMonthPct,
            readingBeats: reorientReading.beats,
            attributionMode: 'conventional_rep_share'
          }
        })
      );
    }
  }

  const pullNow = p.byMuscle[MuscleGroups.BACK]?.reps || 0;
  const pushNow = p.pushReps;
  if (pushNow >= 80 && (pushNow > pullNow * 1.6 || share(pullNow, p.totalReps) < 18)) {
    const monthPull = d30.byMuscle[MuscleGroups.BACK]?.reps || 0;
    const ofMonth = share(pullNow, monthPull);
    const monthShareOfWindow = share(monthPull, pullNow);
    {
      const titleThesis =
        ofMonth != null && ofMonth >= 12 && isToday
          ? 'Ton tirage reste présent malgré une dominante poussée'
          : `La poussée domine nettement le tirage ${v.ofPeriod}`;
      const monthScope =
        (isToday || isWeek) && ofMonth != null && ofMonth <= 100 && monthPull >= 80
          ? `Avec ${fmtInt(pullNow)} reps dos, tu réalises ${v.now} environ ${fmtPct(ofMonth)} du volume de dos des 30 derniers jours`
          : isLongVoice(v) && monthShareOfWindow != null && monthPull >= 80 && pullNow > monthPull * 1.15
            ? `Les 30 derniers jours portent ${fmtPct(monthShareOfWindow)} du dos de cette fenêtre (${fmtInt(monthPull)} sur ${fmtInt(pullNow)})`
            : null;
      const ppReading = composeAnalyticalReading({
        titleThesis,
        constat: `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} totalise environ ${fmtInt(pullNow)} reps attribuées dos contre ${fmtInt(p.chestTricepsReps || pushNow)} reps pectoraux + triceps${
          pushNow !== (p.chestTricepsReps || 0)
            ? ` (et ${fmtInt(pushNow)} en comptant aussi les épaules de poussée)`
            : ''
        }`,
        mechanism: 'La composition attribuée du haut du corps penche nettement poussée plutôt que tirage',
        scope: monthScope,
        implication: pushPullImplication({ pushReps: pushNow, pullReps: pullNow }),
        limit:
          'Répartition indicative (parts conventionnelles), pas un jugement d’équilibre idéal ni une mesure anatomique exacte'
      });
      out.push(
        discovery({
          kind: 'disc_push_pull',
          nature: 'trajectory',
          family: 'push_pull',
          contentClass: CONTENT_CLASS.DESCRIPTIVE,
          title: ppReading.title,
          body: ppReading.body,
          evidence: `dos ${fmtInt(pullNow)} · pecs+triceps ${fmtInt(p.chestTricepsReps || 0)}`,
          weights: { importance: 0.68, reliability: 0.72, novelty: 0.6, fit: 0.9 },
          metrics: {
            pullNow,
            pushNow,
            ofMonth,
            readingBeats: ppReading.beats,
            attributionMode: 'conventional_rep_share'
          }
        })
      );
    }
  }

  const ofMonthEx = p.exercises
    .map((e) => {
      const month = d30.byExercise[e.id]?.reps || 0;
      return { ...e, monthReps: month, ofMonthPct: share(e.reps, month) };
    })
    .filter(
      (e) =>
        (isToday || isWeek) &&
        e.monthReps >= 48 &&
        e.reps >= 24 &&
        e.ofMonthPct != null &&
        e.ofMonthPct >= 18 &&
        e.ofMonthPct <= 100
    )
    .sort((a, b) => b.ofMonthPct - a.ofMonthPct)
    .slice(0, 3);
  if (ofMonthEx.length) {
    const bits = ofMonthEx.map((e) => {
      const exact = Math.abs(e.ofMonthPct - 25) < 1.2;
      return `Les ${fmtInt(e.reps)} ${e.name.toLowerCase()} ${isToday ? "réalisé(e)s aujourd'hui" : v.now} représentent ${exact ? 'exactement' : 'environ'} ${fmtPct(e.ofMonthPct)} de tout ton volume de 30 jours sur ce mouvement (${fmtInt(e.monthReps)} reps)`;
    });
    const shareReading = composeAnalyticalReading({
      titleThesis:
        ofMonthEx.length === 1
          ? `${ofMonthEx[0].name} pèse beaucoup plus lourd dans ton mois que le total de reps ne le dit`
          : `${ofMonthEx.length} mouvements concentrent une part importante de ton travail récent`,
      constat: bits.join('. '),
      mechanism: null,
      scope: null,
      implication: `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} pèse beaucoup plus lourd dans ton historique récent que ses ${fmtInt(p.totalReps)} reps totales ne le laissent penser`
    });
    out.push(
      discovery({
        kind: 'disc_exercise_share',
        nature: isToday ? 'now' : 'trajectory',
        family: 'exercise_share',
        title: shareReading.title,
        body: shareReading.body,
        evidence: ofMonthEx.map((e) => `${e.name} ${fmtPct(e.ofMonthPct)}`).join(' · '),
        weights: { importance: 0.92, reliability: 0.94, novelty: 0.9, fit: 1 },
        metrics: { exercises: ofMonthEx.map((e) => e.name), readingBeats: shareReading.beats }
      })
    );
  }

  if (isWeek && p.exercises.length >= 3 && p.peakDay) {
    const weekTop = p.exercises.slice(0, 3);
    out.push(
      discovery({
        kind: 'disc_exercise_base',
        nature: 'trajectory',
        family: 'exercise_structure',
        title: 'Le socle hebdomadaire n’est pas le même que ce qui structure une séance',
        body: `Les mouvements les plus répétés ${v.now} (${weekTop
          .map((e) => `${e.name.toLowerCase()} ${fmtInt(e.reps)}`)
          .join(', ')}) forment le socle de la semaine. La séance du ${formatDayFr(p.peakDay.date, true)} peut raconter autre chose${
          (p.peakDay.exercises || []).length
            ? ` : ${p.peakDay.exercises
                .slice(0, 3)
                .map((e) => `${fmtInt(e.reps)} ${String(e.name || '').toLowerCase()}`)
                .join(', ')}`
            : ''
        }. On distingue donc les exercices que tu reproduis souvent de ceux qui structurent une séance dense — ce n'est pas le même signal.`,
        evidence: weekTop.map((e) => `${e.name} ${fmtInt(e.reps)}`).join(' · '),
        weights: { importance: 0.8, reliability: 0.86, novelty: 0.82, fit: 0.92 }
      })
    );
  }

  const emerging = p.exercises.filter((e) => {
    const first = p.firstSeen[e.id];
    return first && first >= p.window.start && e.reps >= 24;
  });
  const returning = p.exercises.filter((e) => {
    const gapDate = p.lastSeenBefore[e.id];
    if (!gapDate) return false;
    const gap = inclusiveCalendarSpanDays(gapDate, p.window.start) - 1;
    return gap >= 21 && e.reps >= 24;
  });
  // Fenêtre riche : jusqu’à 14 épisodes émergence/retour distincts (pas un quota).
  const named = [...emerging, ...returning]
    .filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i)
    .sort((a, b) => b.reps - a.reps)
    .slice(0, v.key === 'today' ? 4 : v.key === 'week' ? 10 : 14);
  if (named.length) {
    const eventReader = createSetShiftReader(extras.snapshot, p.window?.end);
    named.forEach((e) => {
      const neu = emerging.some((x) => x.id === e.id);
      const dates = Object.keys(p.exercisesByDate || {})
        .filter((date) => (p.exercisesByDate[date] || []).some((other) => String(other.id) === String(e.id)))
        .sort();
      const lastDate = dates[dates.length - 1];
      const dayReps = lastDate
        ? (p.exercisesByDate[lastDate] || []).find((other) => String(other.id) === String(e.id))?.reps
        : null;
      const setBit = lastDate ? eventReader.forSession(e.id, lastDate, dayReps) : '';
      const gapDate = p.lastSeenBefore?.[e.id];
      // Gap = dernière séance avant → première séance DANS la fenêtre (pas → début calendaire).
      // Évite 77 j vs 42 j pour le même retour selon la borne de période.
      const firstInWindow = dates[0] || null;
      const gapDays =
        !neu && gapDate && firstInWindow
          ? Math.max(0, inclusiveCalendarSpanDays(gapDate, firstInWindow) - 1)
          : !neu && gapDate
            ? Math.max(0, inclusiveCalendarSpanDays(gapDate, p.window.start) - 1)
            : null;
      const companions = sameDayCompanions(e, p.exercisesByDate);
      const groupId = primaryGroup(e.name);
      const group = groupId ? p.muscles?.find((muscle) => muscle.group === groupId) : null;
      const peer = named.find(
        (other) =>
          other.id !== e.id &&
          !emerging.some((row) => row.id === other.id) &&
          !neu &&
          primaryGroup(other.name) &&
          primaryGroup(other.name) === groupId
      );
      const legacyTitle = neu
        ? `${e.name} apparaît dans ${v.thisPeriod}`
        : `${e.name} revient dans ${v.thisPeriod}`;
      const legacyBody = writeExerciseEvent({
        exercise: e,
        totalReps: p.totalReps,
        emerging: neu,
        gapDays,
        companions,
        setBit,
        voice: v.key,
        groupReps: group?.reps || null,
        groupLabel: group?.label || '',
        pushReps: p.pushReps || 0,
        backReps: p.byMuscle?.[MuscleGroups.BACK]?.reps || 0,
        peer: peer || null
      });
      const traj = measureTraj(() =>
        buildExerciseTrajectory({
          snapshot: extras.snapshot,
          exerciseId: e.id,
          exerciseName: e.name,
          window: p.window,
          getExerciseNameById: extras.getExerciseNameById || null,
          mode: 'emergence',
          computeScope: extras.computeScope || null
        })
      );
      const rendered = renderExerciseTrajectoryCopy(traj, {
        legacyBits: {
          title: legacyTitle,
          body: legacyBody,
          evidence: `${e.name} · ${fmtInt(e.reps)} reps`
        }
      });
      // Conserver un ancrage groupe / companion si la trajectoire ne l’a pas déjà couvert
      let body = rendered.body || legacyBody;
      if (rendered.usedTrajectory && group?.reps > e.reps && group?.label) {
        if (!/des \d[\d\s]*répétitions de/i.test(body)) {
          body = `${body} Ces ${fmtInt(e.reps)} répétitions font ${fmtPct((e.reps / group.reps) * 100)} des ${fmtInt(group.reps)} répétitions de ${group.label} de la période.`;
        }
      }
      out.push(
        discovery({
          id: `disc_emergence:${e.id}`,
          kind: 'disc_emergence',
          nature: 'trajectory',
          family: 'emergence',
          score: 94 - named.indexOf(e),
          title: rendered.title || legacyTitle,
          body,
          evidence: rendered.evidence || `${e.name} · ${fmtInt(e.reps)} reps`,
          weights: { importance: 0.9, reliability: 0.88, novelty: 0.96, fit: 0.98 },
          metrics: {
            exerciseId: String(e.id),
            factId: `emergence|${e.id}`,
            name: e.name,
            dates,
            sessionCount: dates.length,
            lastDate: lastDate || null,
            gapDays,
            draftTitle: legacyTitle,
            draftBody: legacyBody,
            legacyTitle,
            legacyBody,
            ...trajectoryToMetrics(traj)
          }
        })
      );
    });
  }

  if (
    isToday &&
    p.repsPerSession != null &&
    d7.repsPerSession != null &&
    Math.abs(pctChange(p.repsPerSession, d7.repsPerSession) || 0) < 8 &&
    ofMonthEx.length
  ) {
    out.push(
      discovery({
        kind: 'disc_composition_not_volume',
        nature: 'trajectory',
        family: 'composition',
        title: "Le signal actuel est davantage une modification de la composition qu'une modification du volume",
        body: `Avec ${d7.trainingDays} séances sur les 7 derniers jours, tu es actuellement autour de ${formatRateFr((d7.trainingDays / 7) * 7)} séances par semaine. ${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} apporte un volume de ${fmtInt(p.totalReps)} reps, quasiment identique au volume moyen par séance observé sur les 7 derniers jours (≈${fmtInt(d7.repsPerSession)} reps/séance). La dynamique actuelle porte donc davantage sur la manière dont tu distribues ton entraînement que sur une hausse ou une baisse brutale de la quantité de travail.`,
        evidence: `${fmtInt(p.totalReps)} vs ≈${fmtInt(d7.repsPerSession)} reps/séance`,
        weights: { importance: 0.84, reliability: 0.9, novelty: 0.86, fit: 1 }
      })
    );
  }

  const ofMonthVol = share(p.totalReps, d30.totalReps);
  // Tautologie : la fenêtre de 30 j. ne peut pas « représenter » 100 % d’elle-même.
  const anchorIsSelf =
    (p.spanDays != null && p.spanDays >= 28 && p.spanDays <= 31) ||
    (ofMonthVol != null && ofMonthVol >= 95);
  if (
    ofMonthVol != null &&
    !anchorIsSelf &&
    d30.totalReps >= 400 &&
    (isToday ? ofMonthVol >= 5 : ofMonthVol >= 12)
  ) {
    out.push(
      discovery({
        kind: 'disc_anchor',
        nature: 'journey',
        family: 'period_weight',
        title: isToday
          ? `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} ajoute une confirmation de ton profil d'entraînement actuel`
          : `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} devient un nouveau point d'ancrage dans ton historique`,
        body: `Sur les 30 derniers jours, tu as accumulé ${fmtInt(d30.totalReps)} reps en ${d30.trainingDays} jours calendaires d’entraînement, et ${v.thisPeriod} représente ${fmtPct(ofMonthVol)} de ce volume glissant (pas un mois calendaire complet).${
          isToday
            ? ` Une seule journée pèse donc une part importante de ces 30 jours.`
            : ` À cette échelle, le long terme ne doit pas produire une deuxième version du court terme : ${v.thisPeriod} sert de nouveau point d'ancrage.`
        }`,
        evidence: `${fmtInt(p.totalReps)} / ${fmtInt(d30.totalReps)} · ${fmtPct(ofMonthVol)}`,
        weights: { importance: 0.85, reliability: 0.93, novelty: 0.8, fit: 0.94 },
        metrics: {
          ofMonthVol,
          monthReps: d30.totalReps,
          monthDays: d30.trainingDays,
          dayContract: 'calendar_training',
          windowSpanDays: p.spanDays
        }
      })
    );
  }

  const tracked = ofMonthEx.length ? ofMonthEx : p.exercises.filter((e) => (d30.byExercise[e.id]?.reps || 0) >= 80).slice(0, 3);
  if (tracked.length && d30.totalReps >= 400) {
    out.push(
      discovery({
        kind: 'disc_repertoire',
        nature: 'journey',
        family: 'repertoire',
        title: 'Tes mouvements de référence commencent à disposer d’un historique assez fourni',
        body: `${tracked
          .map((e) => {
            const month = e.monthReps || d30.byExercise[e.id]?.reps || 0;
            return `${e.name} : ${fmtInt(e.reps)} ${v.now} sur ${fmtInt(month)} en 30 jours`;
          })
          .join('. ')}. Ces volumes permettent de ne plus analyser uniquement ton entraînement comme un ensemble : Momentum peut suivre l'évolution de chaque mouvement, en distinguant ceux qui progressent, ceux qui se maintiennent et ceux dont l'exposition reste insuffisante.`,
        evidence: tracked.map((e) => e.name).join(' · '),
        weights: { importance: 0.82, reliability: 0.9, novelty: 0.84, fit: 0.9 }
      })
    );
  }

  if (d30.trainingDays >= 6 && p.trainingDays >= 1 && p.spanDays >= 1) {
    const recentPct = share(p.trainingDays, p.spanDays);
    const monthPct = share(d30.trainingDays, 30);
    // La fenêtre de 30 jours est déjà d30 : la comparer à elle-même ne dit rien.
    const comparesItself = p.spanDays === 30 && p.trainingDays === d30.trainingDays;
    if (recentPct != null && monthPct != null && !comparesItself) {
      out.push(
        discovery({
          kind: 'disc_freq_continuity',
          nature: 'journey',
          family: 'freq_span',
          title: `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} s'inscrit dans une pratique déjà documentée`,
          body: `La période se lit avec ${d30.trainingDays} jours entraînés sur les 30 derniers jours et ${p.trainingDays} jour${p.trainingDays > 1 ? 's' : ''} sur ${p.spanDays === 1 ? 'cette séance' : `les ${p.spanDays} derniers jours`}, soit une fréquence d'environ ${fmtPct(monthPct, 0)} des jours sur 30 jours${
            p.spanDays > 1 ? ` contre environ ${fmtPct(recentPct, 0)} sur ${v.thisPeriod}` : ''
          }. ${
            isToday
              ? `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} s'inscrit donc dans une pratique déjà suffisamment documentée pour que ses performances soient replacées dans ton historique plutôt que jugées isolément.`
              : `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} n'est donc pas une rupture brutale de continuité : elle s'inscrit dans une pratique où l'entraînement reste présent régulièrement.`
          }`,
          evidence: `${d30.trainingDays}/30 j. · ${p.trainingDays}/${p.spanDays} j.`,
          weights: { importance: 0.78, reliability: 0.92, novelty: 0.72, fit: isWeek || isToday ? 0.88 : 0.7 }
        })
      );
    }
  }

  if (p.activeKcal >= 400 && p.trainingDays >= 1 && (isWeek || v.key === 'month')) {
    out.push(
      discovery({
        kind: 'disc_kcal_profile',
        nature: 'journey',
        family: 'kcal_profile',
        title: 'La dépense de la période distingue densité et fréquence',
        body: `Les ${fmtInt(p.activeKcal)} kcal actives enregistrées ${v.now} donnent une mesure de la charge globale indépendante des seules répétitions. Croisée avec ${formatDurationFr(p.minutes || p.totalMinutes)} d'exercices, cette donnée permet de distinguer une période où l'activité est élevée parce que les séances sont nombreuses d'une période où elle est élevée parce que les séances sont particulièrement denses. ${
          p.trainingDays <= 4
            ? `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} correspond au second profil : peu de journées d'entraînement, mais une dépense et un volume concentrés sur ces journées.`
            : `Ici la dépense se répartit sur ${p.trainingDays} journées.`
        }`,
        evidence: `${fmtInt(p.activeKcal)} kcal · ${formatDurationFr(p.minutes || p.totalMinutes)}`,
        weights: { importance: 0.72, reliability: 0.85, novelty: 0.78, fit: 0.86 }
      })
    );
  }

  if (d90.totalReps >= 1500 && p.muscles.length >= 2) {
    const contrasts = p.muscles.slice(0, 4).map((m) => {
      const q = d90.byMuscle[m.group]?.reps || 0;
      return { ...m, quarter: q, ofQuarter: share(m.reps, q) };
    });
    const shifted = contrasts.filter((m) => m.quarter >= 200);
    if (shifted.length >= 2) {
      out.push(
        discovery({
          kind: 'disc_quarter_profile',
          nature: 'journey',
          family: 'quarter_profile',
          title: "Ton entraînement actuel n'est pas seulement plus ou moins volumineux : il devient identifiable par son profil",
          body: `Sur le trimestre, tu as réalisé ${fmtInt(d90.totalReps)} répétitions, dont ${contrasts
            .map((m) => `environ ${fmtInt(m.quarter)} ${m.label}`)
            .join(', ')}. ${v.now.charAt(0).toUpperCase()}${v.now.slice(1)}, la répartition observée ${
            isToday ? "s'écarte" : 'peut s’écarter'
          } de cette structure historique (${p.muscles
            .slice(0, 4)
            .map((m) => `${fmtInt(m.reps)} ${m.label}`)
            .join(', ')}). ${
            isToday
              ? `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} confirme que ton entraînement récent peut alterner fortement la priorité donnée aux différents groupes musculaires, plutôt que de reproduire constamment la même distribution.`
              : `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} sert de nouvelle observation dans cette trajectoire.`
          }`,
          evidence: `trimestre ${fmtInt(d90.totalReps)} reps`,
          weights: { importance: 0.8, reliability: 0.84, novelty: 0.82, fit: 0.88 }
        })
      );
    }
  }

  const setShifts = createSetShiftReader(extras.snapshot, p.window?.end);
  const habitHits = baselines
    .filter((b) => b.established && b.median != null && b.last?.date >= p.window.start && Math.abs(b.vsHabitPct || 0) >= 12)
    .sort((a, b) => Math.abs(b.vsHabitPct) - Math.abs(a.vsHabitPct));
  const habitLead = habitHits[0];
  if (
    habitLead &&
    habitLead.last?.date >= p.window.start &&
    String(habitLead.name || '').trim() &&
    !/^un mouvement$/i.test(String(habitLead.name))
  ) {
    const above = habitLead.vsHabitPct > 0;
    const windowEx = p.byExercise?.[habitLead.id] || p.byExercise?.[String(habitLead.id)];
    const periodBit =
      !isToday && windowEx?.reps
        ? ` Sur ${v.thisPeriod}, tu as accumulé ${fmtInt(windowEx.reps)} répétitions de ce mouvement (${windowEx.days || 1} séance${(windowEx.days || 1) > 1 ? 's' : ''}).`
        : '';
    const stableHabit =
      habitLead.p25 != null && habitLead.p75 != null && Math.abs(habitLead.p75 - habitLead.p25) < 1;
    const habitClause = stableHabit
      ? `à ${fmt1(habitLead.median)} répétitions`
      : `autour de ${fmt1(habitLead.median)} répétitions (médiane, écart interquartile ${fmt1(habitLead.p25)}–${fmt1(habitLead.p75)})`;
    const setBit = setShifts.forSession(habitLead.id, habitLead.last.date, habitLead.lastReps);
    out.push(
      discovery({
        kind: 'disc_vs_habit',
        nature: 'now',
        family: 'vs_habit',
        title: above
          ? `${habitLead.name} : ${v.thisPeriod} ${agreeEst(v)} au-dessus de ton niveau habituel`
          : `${habitLead.name} : ${v.thisPeriod} ${agreeEst(v)} en retrait de ton niveau habituel`,
        body: `Tes séances de ${habitLead.name.toLowerCase()} se situent habituellement ${habitClause}. Les ${fmtInt(habitLead.lastReps)} répétitions ${isToday ? "réalisées aujourd'hui" : `du ${formatDayFr(habitLead.last.date, true)}`} placent cette séance environ ${fmtPct(Math.abs(habitLead.vsHabitPct))} ${above ? 'au-dessus' : 'en dessous'} de ton niveau habituel.${setBit ? ` ${setBit}` : ''}${periodBit} Ce n'est pas un record : c'est un écart à ce que tu reproduis d'habitude.`,
        evidence: `${fmtInt(habitLead.lastReps)} vs habituel ${fmt1(habitLead.median)} · ${fmtSignedPct(habitLead.vsHabitPct)}`,
        weights: {
          importance: isToday ? 0.94 : 0.7,
          reliability: habitLead.sessions >= 8 ? 0.93 : 0.84,
          novelty: 0.88,
          fit: isToday ? 1 : 0.62
        },
        metrics: baselineTraceMetrics(habitLead, {
          lastReps: habitLead.lastReps,
          median: habitLead.median
        })
      })
    );
  }

  const peers = comparable?.peers || [];
  const target = comparable?.target;
  const comparableLead =
    habitLead ||
    (target
      ? baselines.find((b) => b.established && (target.exerciseIds || []).includes(b.id))
      : null);
  if (target && peers.length >= 2 && comparableLead) {
    const series = [...peers]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((s) => {
        const hit = (s.exercises || []).find((e) => e.id === comparableLead.id);
        return hit ? hit.reps : null;
      })
      .filter((n) => n != null);
    if (series.length >= 2) {
      const first = series[0];
      const last = series[series.length - 1];
      const deltaPct =
        first > 0 ? Math.round(((comparableLead.lastReps - first) / first) * 100) : null;
      const rising = deltaPct != null && deltaPct >= 12;
      const falling = deltaPct != null && deltaPct <= -12;
      const traj = measureTraj(() =>
        buildExerciseTrajectory({
          snapshot: extras.snapshot,
          exerciseId: comparableLead.id,
          exerciseName: comparableLead.name,
          window: p.window,
          getExerciseNameById: extras.getExerciseNameById || null,
          mode: 'progress',
          computeScope: extras.computeScope || null
        })
      );
      const setLevel = setShifts.acrossLevel(comparableLead.id);
      let mechBit = '';
      if (traj?.ok && traj.setMechanism?.available && traj.setMechanism.before && traj.setMechanism.after) {
        const b = traj.setMechanism.before;
        const a = traj.setMechanism.after;
        mechBit = ` Derrière la série, le format de travail passe d’environ ${b.setCount} × ${b.perSet} à environ ${a.setCount} × ${a.perSet}.`;
      } else if (setLevel) {
        mechBit = ` ${setLevel}`;
      }
      const arcBit = rising
        ? ` Sur cette lignée comparable, le volume monte (${fmtInt(first)} → ${fmtInt(comparableLead.lastReps)}${
            deltaPct != null ? `, ${fmtSignedPct(deltaPct)}` : ''
          }).`
        : falling
          ? ` Sur cette lignée comparable, le volume recule (${fmtInt(first)} → ${fmtInt(comparableLead.lastReps)}${
              deltaPct != null ? `, ${fmtSignedPct(deltaPct)}` : ''
            }).`
          : ` Sur cette lignée, le niveau reste du même ordre (${fmtInt(first)} → ${fmtInt(comparableLead.lastReps)}).`;
      const title = rising
        ? `${comparableLead.name} : les séances comparables montrent une progression`
        : falling
          ? `${comparableLead.name} : les séances comparables montrent un recul`
          : `${comparableLead.name} : les séances comparables restent du même ordre`;
      out.push(
        discovery({
          kind: 'disc_comparable',
          nature: 'trajectory',
          family: 'comparable',
          title,
          body: `${isToday ? "Aujourd'hui" : v.thisPeriod.charAt(0).toUpperCase() + v.thisPeriod.slice(1)} : ${fmtInt(comparableLead.lastReps)} ${comparableLead.name.toLowerCase()}. Les ${series.length} séances précédentes vraiment comparables (mêmes mouvements principaux, volume proche) donnaient ${series.map((n) => fmtInt(n)).join(' → ')} → ${fmtInt(comparableLead.lastReps)}.${arcBit}${mechBit} On ne compare donc pas ${v.thisPeriod} à la veille : on la compare aux séances de la même famille.`,
          evidence: `comparables ${peers.length} · ${series.join('→')}`,
          weights: { importance: 0.91, reliability: 0.86, novelty: 0.94, fit: isToday || isWeek ? 1 : 0.8 },
          metrics: {
            ...baselineTraceMetrics(comparableLead, {
              series,
              peerDates: [...peers].map((s) => s.date).filter(Boolean)
            }),
            ...trajectoryToMetrics(traj)
          }
        })
      );
    }
  }

  // Plusieurs progressions distinctes (pas seulement le top 1) — limite adaptative.
  const progressLeads = baselines
    .filter((b) => b.established && b.vsInitialPct != null && Math.abs(b.vsInitialPct) >= 15 && b.historicalMean >= 5)
    .sort((a, b) => Math.abs(b.vsInitialPct) - Math.abs(a.vsInitialPct))
    .slice(0, v.key === 'today' ? 2 : v.key === 'week' ? 4 : 6);
  progressLeads.forEach((progressLead, progressIdx) => {
    const setLevel = setShifts.acrossLevel(progressLead.id);
    const legacyTitle = `${progressLead.name} a ${progressLead.vsInitialPct >= 0 ? 'progressé' : 'reculé'} de ${fmtPct(Math.abs(progressLead.vsInitialPct))} depuis tes premières séances comparables`;
    const legacyBody = `Niveau initial (moyenne des ${Math.min(5, progressLead.sessions)} premières séances) : environ ${fmt1(progressLead.historicalMean)} reps. Niveau actuel (moyenne des dernières séances, dernière saisie comprise) : environ ${fmt1(progressLead.currentMean)} reps, soit ${fmtSignedPct(progressLead.vsInitialPct)}. Les premières séances servent aussi à apprendre le geste : une partie de l'écart avec ce départ peut venir de là.${
      progressLead.recentMean != null && progressLead.last?.reps != null
        ? ` Sans la dernière saisie, la moyenne récente est ${fmt1(progressLead.recentMean)} reps. La dernière séance (${fmtInt(progressLead.last.reps)} reps) se lit à part.`
        : ''
    }${
      /pomp/i.test(progressLead.name || '')
        ? (() => {
            const kin = (p.exercises || []).find(
              (exercise) =>
                /pomp/i.test(exercise.name || '') &&
                String(exercise.name).toLowerCase() !== String(progressLead.name).toLowerCase() &&
                (exercise.reps || 0) >= 40
            );
            return kin
              ? ` Dans la même fenêtre, ${kin.name.toLowerCase()} compte ${fmtInt(kin.reps)} répétitions : poignets, coudes et épaules encaissent les deux.`
              : '';
          })()
        : ''
    } ${setLevel ? `${setLevel} ` : ''}${
      progressLead.consolidated
        ? `Surtout, cette progression est désormais consolidée : ${progressLead.aboveOldMean} de tes ${progressLead.last5Count} dernières performances dépassent ton ancien niveau moyen.`
        : `Le record (${fmtInt(progressLead.best)} le ${progressLead.bestDate ? formatDayFr(progressLead.bestDate, true) : '—'}) n'est pas le niveau : le niveau, c'est ce que tu reproduis.`
    }`;
    const traj = measureTraj(() =>
      buildExerciseTrajectory({
        snapshot: extras.snapshot,
        exerciseId: progressLead.id,
        exerciseName: progressLead.name,
        window: p.window,
        getExerciseNameById: extras.getExerciseNameById || null,
        mode: 'progress',
        computeScope: extras.computeScope || null
      })
    );
    // Pas de carte si l’exercice n’apparaît pas dans la fenêtre (historique seul = époque révolue).
    const winSessions =
      traj?.volume?.windowSessionCount ?? traj?.temporalScope?.windowSessionCount ?? 0;
    if (!(Number(winSessions) > 0)) return;
    // Dernière baseline hors fenêtre → ignorer (ex. id 201 Pompes lestées arrêtées).
    if (
      progressLead.last?.date &&
      p.window?.start &&
      progressLead.last.date < p.window.start
    ) {
      return;
    }
    const rendered = renderExerciseTrajectoryCopy(traj, {
      legacyBits: {
        title: legacyTitle,
        body: legacyBody,
        evidence: `${fmt1(progressLead.historicalMean)} → ${fmt1(progressLead.currentMean)} · ${fmtSignedPct(progressLead.vsInitialPct)}`
      }
    });
    out.push(
      discovery({
        kind: 'disc_exercise_progress',
        nature: 'journey',
        family: 'exercise_progress',
        title: rendered.title || legacyTitle,
        body: rendered.body || legacyBody,
        evidence:
          rendered.evidence ||
          `${fmt1(progressLead.historicalMean)} → ${fmt1(progressLead.currentMean)} · ${fmtSignedPct(progressLead.vsInitialPct)}`,
        weights: {
          importance: Math.max(0.78, 0.9 - progressIdx * 0.03),
          reliability: 0.88,
          novelty: Math.max(0.72, 0.86 - progressIdx * 0.02),
          fit: 0.92
        },
        metrics: {
          ...baselineTraceMetrics(progressLead),
          draftTitle: legacyTitle,
          draftBody: legacyBody,
          legacyTitle,
          legacyBody,
          ...trajectoryToMetrics(traj)
        }
      })
    );
  });

  const night = sleepCtx?.night;
  const catalogNights = (catalog || [])
    .map((s) => s.night)
    .filter((n) => n && n.hours != null)
    .slice(-8);
  const recentHabit =
    summarizeRecentNights(sleepCtx?.recentNights || []) || summarizeRecentNights(catalogNights);
  if (night && recentHabit && recentHabit.n >= 4 && (isToday || isWeek)) {
    const deltaMin = Math.round((night.hours - recentHabit.hours) * 60);
    const smallGap = Math.abs(deltaMin) < 20;
    const archBits = [];
    if (night.deepMin != null) archBits.push(`${formatSleepMinutesFr(night.deepMin)} de sommeil profond`);
    if (night.remMin != null) archBits.push(`${formatSleepMinutesFr(night.remMin)} de REM`);
    if (night.lightMin != null) archBits.push(`${formatSleepMinutesFr(night.lightMin)} de sommeil léger`);
    const awakeBit =
      night.awakeMin != null
        ? night.awakeMin <= 25
          ? `, avec seulement ${formatSleepMinutesFr(night.awakeMin)} éveillé`
          : `, avec ${formatSleepMinutesFr(night.awakeMin)} éveillé`
        : '';
    const archSentence = archBits.length
      ? smallGap
        ? ` La différence se situe davantage dans l'architecture : ${archBits.join(', ')}${awakeBit}.`
        : ` L'architecture : ${archBits.join(', ')}${awakeBit}.`
      : '';
    const hrBit =
      night.sleepHr != null && recentHabit.sleepHr != null
        ? ` Ta fréquence cardiaque nocturne moyenne est de ${fmtInt(night.sleepHr)} bpm, contre ${fmtInt(recentHabit.sleepHr)} bpm sur tes ${recentHabit.n} dernières nuits.`
        : '';
    const bbSpan =
      night.bodyBatteryStart != null && night.bodyBatteryEnd != null
        ? `passe de ${fmtInt(night.bodyBatteryStart)} à ${fmtInt(night.bodyBatteryEnd)} pendant la nuit`
        : null;
    const bbBit =
      night.bodyBatteryCharged != null
        ? bbSpan
          ? ` Ton Body Battery ${bbSpan}. La recharge atteint donc ${night.bodyBatteryCharged >= 0 ? '+' : ''}${fmtInt(night.bodyBatteryCharged)} points${
              recentHabit.bbCharged != null ? `, contre +${fmt1(recentHabit.bbCharged)} en moyenne` : ''
            }.`
          : ` Ton Body Battery se recharge de ${night.bodyBatteryCharged >= 0 ? '+' : ''}${fmtInt(night.bodyBatteryCharged)} points${
              recentHabit.bbCharged != null ? `, contre +${fmt1(recentHabit.bbCharged)} en moyenne` : ''
            }.`
        : '';
    const physioClose =
      (night.sleepHr != null && recentHabit.sleepHr != null) || night.bodyBatteryCharged != null
        ? ' La nuit se lit donc aussi sur des indicateurs de récupération indépendants de la seule durée.'
        : '';
    out.push(
      discovery({
        kind: 'disc_sleep_night',
        nature: 'now',
        family: 'sleep_night',
        title: smallGap
          ? 'Une nuit correcte en durée, à lire surtout dans son architecture'
          : deltaMin < 0
            ? 'Une nuit plus courte que ton niveau récent'
            : 'Une nuit plus longue que ton niveau récent',
        body: `${
          isToday
            ? night.ymd
              ? `Cette nuit (${formatDayFr(night.ymd)})`
              : 'Cette nuit'
            : night.ymd
              ? `La nuit du ${formatDayFr(night.ymd)}`
              : 'Une nuit récente'
        }, tu as dormi ${formatSleepHoursFr(night.hours)}, contre ${formatSleepHoursFr(recentHabit.hours)} de moyenne sur tes ${recentHabit.n} dernières nuits.${
          smallGap
            ? ` L'écart de ${Math.abs(deltaMin)} minutes est faible et ne constitue donc pas une réduction significative de ton temps de sommeil.`
            : ` L'écart est de ${Math.abs(deltaMin)} minutes.`
        }${archSentence}${hrBit}${bbBit}${physioClose}`,
        evidence: `${night.ymd || 'nuit'} · ${formatSleepHoursFr(night.hours)} vs ${formatSleepHoursFr(recentHabit.hours)} · ${recentHabit.n} nuits`,
        weights: { importance: 0.9, reliability: 0.9, novelty: 0.88, fit: 0.96 },
        metrics: {
          hours: night.hours,
          habitHours: recentHabit.hours,
          deltaMin,
          nightYmd: night.ymd || null,
          sleepAttachment: night.attachment || null,
          sleepWindowRole: 'primary_observation'
        }
      })
    );
  }

  const sleepCands = extras.sleepCandidates || [];
  const vol75all = sleepCands.filter((c) => c.type === 'sleep_volume_threshold' && c.threshold === 7.5);
  const vol75 =
    (isToday || isWeek
      ? vol75all.find((c) => c.sample === 'recent14') || vol75all[0]
      : vol75all.find((c) => c.sample === 'all') || vol75all[0]) || null;
  const vol8 = sleepCands.find((c) => c.type === 'sleep_volume_threshold' && c.threshold === 8);
  const zones = sleepCands.find((c) => c.type === 'sleep_zones');
  const sep = sleepCands.find((c) => c.type === 'sleep_separation');
  const archSleep = sleepCands.find((c) => c.type === 'sleep_architecture');
  const delayed = sleepCands.find((c) => c.type === 'sleep_delayed');
  const effCand = sleepCands.find((c) => c.type === 'sleep_efficiency');
  const famSleep = sleepCands.find((c) => c.type === 'sleep_family');
  const j2 = sleepCands.find((c) => c.type === 'sleep_j2');
  const combo = sleepCands.find((c) => c.type === 'sleep_combo');
  const windowFacts = extras.sleepWindowFacts || [];
  const journeyFacts = extras.sleepJourneyFacts || [];
  const conc = windowFacts.find((c) => c.type === 'sleep_concentration');
  const deepStab = windowFacts.find((c) => c.type === 'sleep_deep_stable');
  const highShareWindow = windowFacts.find((c) => c.type === 'sleep_high_day_share');
  const highShareJourney = journeyFacts.find((c) => c.type === 'sleep_high_day_share');
  const highShare = isToday || isWeek ? highShareJourney : highShareWindow || highShareJourney;
  const weekFreqWindow = windowFacts.find((c) => c.type === 'sleep_week_freq');
  const weekFreqJourney = journeyFacts.find((c) => c.type === 'sleep_week_freq');
  const weekFreq = isToday || isWeek ? weekFreqJourney || weekFreqWindow : weekFreqWindow || weekFreqJourney;
  const prevLoad = sleepCands.find((c) => c.type === 'sleep_prev_load');
  const densSleep = sleepCands.find((c) => c.type === 'sleep_intensity');
  const cardioSleep = sleepCands.find((c) => c.type === 'sleep_cardio');
  const perfSleep = sleepCands.find((c) => c.type === 'sleep_performance');
  const rpeSleep = sleepCands.find((c) => c.type === 'sleep_rpe');

  if (vol75 && (isToday || isWeek)) {
    const nLabel = vol75.sample === 'recent14' ? 'les 14 dernières séances' : 'les séances observées';
    const todayPlace =
      isToday && sleepCtx?.hours != null && p.totalReps >= 80
        ? sleepCtx.hours >= 7.5
          ? ` La nuit dernière, avec ${formatSleepHoursFr(sleepCtx.hours)}, te situe donc dans la plage où ton historique montre habituellement tes séances les plus volumineuses. Ta séance d'aujourd'hui atteint ${fmtInt(p.totalReps)} reps, soit ${fmtInt(Math.abs(p.totalReps - vol75.highVol))} reps ${p.totalReps >= vol75.highVol ? 'au-dessus' : 'sous'} de cette moyenne.`
          : ` Aujourd'hui, avec ${formatSleepHoursFr(sleepCtx.hours)}, tu te situes côté nuits plus courtes (moyenne ${fmtInt(vol75.lowVol)} reps).`
        : '';
    const minBit =
      vol75.highMin != null && vol75.lowMin != null
        ? ` Tes séances réalisées après des nuits d'au moins 7 h 30 présentent également une durée moyenne de ${formatDurationFr(vol75.highMin)}, contre ${formatDurationFr(vol75.lowMin)} après les nuits sous 7 h 30.${
            isToday && p.minutes >= 20
              ? ` Aujourd'hui, tu t'entraînes pendant ${formatDurationFr(p.minutes)}.`
              : ''
          }`
        : '';
    const dose8 =
      vol8 && isWeek
        ? ` La relation devient encore plus nette avec les nuits dépassant 8 h : ${fmtInt(vol8.highVol)} reps en moyenne, soit environ ${fmtPct(vol8.deltaPct)} de plus que les journées suivant moins de 7 h 30.`
        : '';
    out.push(
      discovery({
        kind: 'disc_sleep_volume',
        nature: 'trajectory',
        family: 'sleep_volume',
        title: isToday
          ? 'La nuit précédente te place dans une zone de volume déjà visible dans ton historique'
          : 'Tes journées à fort volume s’alignent sur un seuil de sommeil personnel',
        body: `Sur ${nLabel}, celles précédées d'au moins 7 h 30 de sommeil totalisent en moyenne ${fmtInt(vol75.highVol)} reps, contre ${fmtInt(vol75.lowVol)} lorsque le sommeil passe sous 7 h 30. L'écart est de ${fmtInt(vol75.delta)} reps, soit environ ${fmtPct(vol75.deltaPct)}.${todayPlace}${minBit}${dose8} Ce n'est pas une cause : c'est une séparation reproductible (${vol75.highN} et ${vol75.lowN} séances).`,
        evidence: `≥ 7 h 30 ${fmtInt(vol75.highVol)} · < 7 h 30 ${fmtInt(vol75.lowVol)} · n=${vol75.highN + vol75.lowN}`,
        weights: {
          importance: 0.93,
          reliability: vol75.confidence === 'high' ? 0.92 : 0.82,
          novelty: 0.94,
          fit: 0.97
        },
        metrics: vol75
      })
    );
  }

  if (vol75 && isMonth) {
    const perDay = p.trainingDays > 0 ? p.totalReps / p.trainingDays : null;
    const header = `Sur les 30 derniers jours, tu as réalisé ${p.trainingDays} jour${p.trainingDays > 1 ? 's' : ''} d'entraînement pour ${fmtInt(p.totalReps)} reps${
      perDay != null ? `, soit environ ${fmtInt(perDay)} reps par jour entraîné` : ''
    }.`;
    const concBit = conc
      ? ` Les journées précédées d'au moins 7 h 30 représentent ${conc.highTrainedN} séance${conc.highTrainedN > 1 ? 's' : ''} et concentrent ${fmtInt(conc.highReps)} reps, soit ${fmtPct(conc.volShare)} de ton volume réalisé, alors qu'elles représentent ${fmtPct(conc.nightShare)} de tes séances.`
      : '';
    const perNight =
      conc?.highPer != null && conc?.lowPer != null
        ? ` Les nuits sous 7 h 30 sont associées à ${fmtInt(conc.lowPer)} reps par séance suivante, contre ${fmtInt(conc.highPer)} après une nuit suffisamment dormie.`
        : '';
    out.push(
      discovery({
        kind: 'disc_sleep_month',
        nature: 'trajectory',
        family: 'sleep_month',
        title:
          (vol75.highN || 0) + (vol75.lowN || 0) >= 16
            ? 'Sur le mois, le volume se sépare nettement selon le sommeil précédent'
            : 'Sur le mois, volume et sommeil précédent se séparent — avec un échantillon encore limité',
        body: `${header}${concBit}${perNight} Les séances suivant plus de 7 h 30 totalisent en moyenne ${fmtInt(vol75.highVol)} reps, contre ${fmtInt(vol75.lowVol)} après une nuit courte (écart ${fmtInt(vol75.delta)}, ${vol75.highN} et ${vol75.lowN} séances). Ce n'est pas une preuve que le sommeil provoque le volume : c'est une co-variation observée sur la fenêtre.`,
        evidence: `${fmtInt(p.totalReps)} reps · ≥ 7 h 30 ${fmtInt(vol75.highVol)} · < 7 h 30 ${fmtInt(vol75.lowVol)}`,
        weights: {
          importance: 0.86,
          reliability: (vol75.highN || 0) + (vol75.lowN || 0) >= 16 ? 0.86 : 0.72,
          novelty: 0.84,
          fit: 0.9
        },
        metrics: { ...vol75, conc }
      })
    );
  }

  if (conc && isWeek) {
    out.push(
      discovery({
        kind: 'disc_sleep_week',
        nature: 'now',
        family: 'sleep_week',
        title: 'Ta semaine concentre le volume derrière un petit nombre de nuits',
        body: `Les nuits d'au moins 7 h 30 précèdent ${fmtInt(conc.highReps)} des ${fmtInt(conc.totalReps)} reps de la semaine, soit ${fmtPct(conc.volShare)} du volume, alors qu'elles représentent ${fmtPct(conc.nightShare)} des nuits observées.${
          conc.highPer != null && conc.lowPer != null
            ? ` Soit environ ${fmtInt(conc.highPer)} reps par nuit suffisamment dormie, contre ${fmtInt(conc.lowPer)} après une nuit plus courte.`
            : ''
        }`,
        evidence: `${fmtPct(conc.volShare)} du volume · ${fmtPct(conc.nightShare)} des nuits`,
        weights: { importance: 0.9, reliability: 0.86, novelty: 0.92, fit: 0.96 },
        metrics: conc
      })
    );
  }

  if (deepStab && isWeek) {
    const remBit =
      deepStab.remMin != null && deepStab.remMax != null
        ? ` Le REM présente en revanche une amplitude plus importante : ${formatSleepMinutesFr(deepStab.remMin)} à ${formatSleepMinutesFr(deepStab.remMax)}.`
        : '';
    out.push(
      discovery({
        kind: 'disc_sleep_deep',
        nature: 'now',
        family: 'sleep_deep',
        title: 'Le sommeil profond reste stable malgré les variations de durée',
        body: `Ton sommeil profond varie entre ${formatSleepMinutesFr(deepStab.deepMin)} et ${formatSleepMinutesFr(deepStab.deepMax)}, alors que la durée totale va de ${formatSleepHoursFr(deepStab.totMinHours)} à ${formatSleepHoursFr(deepStab.totMaxHours)}. Cette stabilité relative signifie que tes nuits courtes proviennent principalement d'une réduction du sommeil léger et du REM, plutôt que d'une disparition proportionnelle du sommeil profond.${remBit}`,
        evidence: `profond ${formatSleepMinutesFr(deepStab.deepMin)}–${formatSleepMinutesFr(deepStab.deepMax)}`,
        weights: { importance: 0.82, reliability: 0.84, novelty: 0.9, fit: 0.9 },
        metrics: deepStab
      })
    );
  }

  if (sep && (isWeek || isMonth || isToday || isLongVoice(v))) {
    out.push(
      discovery({
        kind: 'disc_sleep_assoc',
        nature: 'trajectory',
        family: 'sleep_assoc',
        title: 'Autour de 7 h 30, les journées fortes et les journées courtes ne se répartissent pas pareil',
        body: `Sur ${sep.highN} séances dépassant 300 reps, ${sep.highOk} ont été précédées d'au moins 7 h 30 de sommeil. À l'inverse, ${sep.lowShort} des ${sep.lowN} séances sous 250 reps ont suivi une nuit plus courte. ${
          (sep.highN || 0) + (sep.lowN || 0) < 20
            ? `L'écart porte sur ${(sep.highN || 0) + (sep.lowN || 0)} séances : assez pour être suivi, pas assez pour en faire une règle. `
            : ''
        }${
          sep.highN > 0 && sep.lowN > 0
            ? `L'écart entre les deux proportions est d'environ ${fmtInt(Math.abs(Math.round((sep.highOk / sep.highN - (sep.lowN - sep.lowShort) / sep.lowN) * 100)))} points. `
            : ''
        }${
          p.trainingDays > 0 && p.spanDays > p.trainingDays
            ? `Cette fenêtre a aussi des jours sans séance : une nuit plus longue peut venir de ces jours-là, pas seulement précéder le volume. `
            : ''
        }${
          perfSleep?.volumeDominates
            ? `Le phénomène concerne surtout la quantité de travail réalisée : les performances sur le mouvement le plus chargé varient moins (${fmtPct(Math.abs(perfSleep.deltaPct || 0))}) que le volume total de séance (${fmtPct(Math.abs(perfSleep.volDeltaPct || 0))}).`
            : `Le phénomène concerne surtout la quantité de travail réalisée : le sommeil semble davantage associé à ta capacité à maintenir une séance longue et volumineuse qu'à une augmentation automatique de chaque série.`
        }`,
        evidence: `${sep.highOk}/${sep.highN} ≥ 300 · ${sep.lowShort}/${sep.lowN} < 250`,
        weights: { importance: 0.88, reliability: 0.86, novelty: 0.9, fit: 0.92 },
        metrics: sep
      })
    );
  }

  if (archSleep) {
    const bits = [];
    if (archSleep.hoursHigh != null && archSleep.hoursLow != null) {
      bits.push(`${formatSleepHoursFr(archSleep.hoursHigh)} vs ${formatSleepHoursFr(archSleep.hoursLow)} de sommeil`);
    }
    if (archSleep.awakeHigh != null && archSleep.awakeLow != null) {
      bits.push(`${formatSleepMinutesFr(archSleep.awakeHigh)} éveillé contre ${formatSleepMinutesFr(archSleep.awakeLow)}`);
    }
    if (archSleep.remHigh != null && archSleep.remLow != null) {
      bits.push(`${formatSleepMinutesFr(archSleep.remHigh)} de REM contre ${formatSleepMinutesFr(archSleep.remLow)}`);
    }
    if (archSleep.bbHigh != null && archSleep.bbLow != null) {
      bits.push(`+${fmt1(archSleep.bbHigh)} vs +${fmt1(archSleep.bbLow)} de Body Battery`);
    }
    const deepBit =
      archSleep.deepStable && archSleep.deepHigh != null
        ? ` Le sommeil profond reste beaucoup plus stable (autour de ${formatSleepMinutesFr(archSleep.deepHigh)}).`
        : '';
    const todayAwake =
      isToday && night?.awakeMin != null
        ? ` Aujourd'hui, tu n'as passé que ${formatSleepMinutesFr(night.awakeMin)} éveillé.`
        : '';
    if (bits.length) {
      out.push(
        discovery({
          kind: 'disc_sleep_architecture',
          nature: 'trajectory',
          family: 'sleep_architecture',
          title: 'La continuité du sommeil accompagne tes journées à fort volume',
          body: `Les séances dépassant 300 reps sont précédées de nuits à ${bits.join(', ')}.${todayAwake} Le facteur discriminant n'est pas seulement la durée : REM, éveil et recharge nocturne bougent avec le volume du lendemain.${deepBit}`,
          evidence: bits.join(' · '),
          weights: { importance: 0.86, reliability: 0.84, novelty: 0.91, fit: 0.9 },
          metrics: archSleep
        })
      );
    }
  }

  if (effCand && (isToday || isWeek || isMonth || isLongVoice(v))) {
    out.push(
      discovery({
        kind: 'disc_sleep_efficiency',
        nature: 'trajectory',
        family: 'sleep_efficiency',
        title: 'À durée comparable, l’efficacité des nuits reste associée au volume',
        body: `À durée de sommeil comparable (autour de ${formatSleepHoursFr(effCand.medianHours)}), tes journées précédées d'une nuit avec une efficacité ≥ 90 % produisent en moyenne ${fmtInt(effCand.highVol)} reps, contre ${fmtInt(effCand.lowVol)} lorsque l'efficacité descend sous 90 %. L'écart est de ${fmtPct(effCand.deltaPct)} (${effCand.highN} et ${effCand.lowN} séances). La durée seule n'explique donc pas entièrement ton volume.`,
        evidence: `≥ 90 % ${fmtInt(effCand.highVol)} · < 90 % ${fmtInt(effCand.lowVol)}`,
        weights: { importance: 0.88, reliability: 0.84, novelty: 0.94, fit: 0.92 },
        metrics: effCand
      })
    );
  }

  if (combo && (isToday || isMonth || isLongVoice(v))) {
    out.push(
      discovery({
        kind: 'disc_sleep_combo',
        nature: 'trajectory',
        family: 'sleep_combo',
        title: 'Tes meilleures journées réunissent durée, efficacité et absence de déficit répété',
        body: `Tes meilleures journées d'entraînement apparaissent surtout lorsque trois conditions sont réunies : au moins 7 h 45 de sommeil, efficacité ≥ 90 % et absence de déficit important sur les deux nuits précédentes. Dans cette configuration, ton volume moyen atteint ${fmtInt(combo.okVol)} reps, contre ${fmtInt(combo.restVol)} lorsque ces conditions ne sont pas réunies (${fmtPct(combo.deltaPct)}, ${combo.okN} et ${combo.restN} séances).`,
        evidence: `trio ${fmtInt(combo.okVol)} · hors trio ${fmtInt(combo.restVol)}`,
        weights: { importance: 0.92, reliability: 0.84, novelty: 0.95, fit: 0.94 },
        metrics: combo
      })
    );
  }

  if (famSleep && (isToday || isWeek || isMonth || isLongVoice(v))) {
    const pushBit = `${fmtPct(famSleep.pushRetain)} de leur volume habituel`;
    const pullHigh = Number.isFinite(Number(famSleep.pullRetain)) && Number(famSleep.pullRetain) > 100;
    const pullBit = pullHigh
      ? `atteignent ${fmtPct(famSleep.pullRetain)} de leur volume habituel`
      : `sont à ${fmtPct(famSleep.pullRetain)} de leur volume habituel`;
    const smallSample = (famSleep.shortN || 0) <= 12 && (famSleep.longN || 0) <= 12;
    const sensitiveBit = smallSample
      ? ''
      : ` ${famSleep.sensitive === 'tirage' ? 'Le tirage' : 'La poussée'} apparaît comme la qualité la plus sensible à une mauvaise récupération dans cet historique (${famSleep.shortN} et ${famSleep.longN} séances).`;
    out.push(
      discovery({
        kind: 'disc_sleep_family',
        nature: 'trajectory',
        family: 'sleep_family',
        title: pullHigh
          ? 'Après une nuit courte, poussée et tirage ne bougent pas de la même façon'
          : `Après une nuit courte, ${famSleep.sensitive === 'tirage' ? 'le tirage' : 'la poussée'} recule davantage que l’autre famille`,
        body: `Après une nuit de moins de 7 h, tes séances de poussée conservent ${pushBit}, tandis que tes séances de tirage ${pullBit}. Le déficit ne touche pas toutes les qualités de la même manière.${sensitiveBit}`,
        evidence: `poussée ${fmtPct(famSleep.pushRetain)} · tirage ${fmtPct(famSleep.pullRetain)}`,
        weights: { importance: 0.87, reliability: 0.8, novelty: 0.95, fit: 0.9 },
        metrics: famSleep
      })
    );
  }

  if (zones) {
    const exposeBit =
      vol75?.highMin != null && vol75?.lowMin != null
        ? ` Le sommeil agit surtout sur ta capacité à maintenir l'exposition : tes meilleures journées correspondent aux séances où tu accumules beaucoup de travail sans réduire fortement la durée (${formatDurationFr(vol75.highMin)} contre ${formatDurationFr(vol75.lowMin)}).`
        : '';
    const zoneScope = isToday || isWeek ? 'Dans tes séances documentées' : isLongVoice(v) ? 'Sur le trimestre' : 'Sur les 30 jours';
    out.push(
      discovery({
        kind: 'disc_sleep_zones',
        nature: 'journey',
        family: 'sleep_zones',
        title: isToday
          ? "Cette séance s'inscrit dans trois zones de récupération déjà visibles"
          : isWeek
            ? 'Cette semaine confirme trois zones de récupération'
            : isLongVoice(v)
              ? 'Ton historique établit trois zones de récupération'
              : 'Ton profil de récupération se précise en trois zones',
        body: `${zoneScope}, tes données établissent trois zones : au-dessus de 8 h, environ ${fmtInt(zones.z8.vol)} reps le lendemain${
          zones.z75 ? ` ; entre 7 h 30 et 8 h, environ ${fmtInt(zones.z75.vol)}` : ''
        } ; sous 7 h 30, environ ${fmtInt(zones.zLow.vol)}. L'écart entre la première et la troisième zone atteint ${fmtInt(zones.delta)} reps (${fmtPct(zones.deltaPct)}).${exposeBit} Le seuil ne dit pas qu'une nuit courte empêche l'entraînement : il sépare deux régimes de volume.`,
        evidence: `≥ 8 h ${fmtInt(zones.z8.vol)} · < 7 h 30 ${fmtInt(zones.zLow.vol)}`,
        weights: { importance: 0.9, reliability: 0.88, novelty: 0.9, fit: 0.96 },
        metrics: zones
      })
    );
  }

  if (delayed) {
    out.push(
      discovery({
        kind: 'disc_sleep_delayed',
        nature: 'journey',
        family: 'sleep_delayed',
        title: isToday
          ? "Cette séance s'inscrit dans un effet de déficit répété"
          : isWeek
            ? 'Cette semaine confirme que le déficit se lit surtout quand il se répète'
            : 'Le déficit de sommeil se lit surtout quand il se répète',
        body: `Après deux nuits sous 7 h, ton volume moyen tombe à ${fmtInt(delayed.shortVol)} reps, contre ${fmtInt(delayed.longVol)} lorsque les deux nuits précédentes dépassent 7 h 30 (${delayed.shortN} et ${delayed.longN} cas). Une seule nuit courte ne suffit pas à faire décrocher le volume dans cet historique.`,
        evidence: `2 nuits courtes ${fmtInt(delayed.shortVol)} · 2 nuits longues ${fmtInt(delayed.longVol)}`,
        weights: { importance: 0.88, reliability: 0.82, novelty: 0.94, fit: 0.9 },
        metrics: delayed
      })
    );
  }

  if (prevLoad && (isToday || isWeek || isMonth)) {
    out.push(
      discovery({
        kind: 'disc_sleep_load',
        nature: 'trajectory',
        family: 'sleep_load',
        title: 'Une nuit courte pèse surtout après une séance lourde la veille',
        body: `Après une nuit de moins de 7 h suivant une séance lourde la veille, ton volume tombe à ${fmtInt(prevLoad.shortHeavyVol)} reps, contre ${fmtInt(prevLoad.shortLightVol)} lorsque la même nuit courte suit un jour léger ou de repos (écart ${fmtInt(prevLoad.delta)}, ${prevLoad.shortHeavyN} et ${prevLoad.shortLightN} cas). Le déficit de sommeil n'agit pas isolément : il se lit surtout combiné à la charge précédente.`,
        evidence: `nuit courte + lourd ${fmtInt(prevLoad.shortHeavyVol)} · + léger ${fmtInt(prevLoad.shortLightVol)}`,
        weights: { importance: 0.88, reliability: 0.8, novelty: 0.96, fit: 0.9 },
        metrics: prevLoad
      })
    );
  }

  if (densSleep && (isToday || isWeek || isMonth)) {
    out.push(
      discovery({
        kind: 'disc_sleep_intensity',
        nature: 'trajectory',
        family: 'sleep_intensity',
        title: 'Le sommeil se lit aussi sur la densité de séance, pas seulement le volume',
        body: `Après les nuits d'au moins 7 h 30, tu réalises en moyenne ${fmtInt(densSleep.highDens)} reps par heure, contre ${fmtInt(densSleep.lowDens)} après une nuit sous 7 h (écart ${fmtInt(densSleep.delta)}, ${fmtPct(densSleep.deltaPct)}). Ce n'est pas une preuve que tu t'entraînes plus près de l'échec : c'est une densité de travail plus élevée, reproductible sur ${densSleep.highN} et ${densSleep.lowN} séances.`,
        evidence: `${fmtInt(densSleep.highDens)} vs ${fmtInt(densSleep.lowDens)} reps/h`,
        weights: { importance: 0.86, reliability: 0.82, novelty: 0.93, fit: 0.9 },
        metrics: densSleep
      })
    );
  }

  if (cardioSleep && (isWeek || isMonth || isLongVoice(v))) {
    out.push(
      discovery({
        kind: 'disc_sleep_cardio',
        nature: 'trajectory',
        family: 'sleep_cardio',
        title: 'Tes sorties course changent avec le sommeil, pas seulement tes reps',
        body: `Après les nuits d'au moins 7 h 30, tes sorties atteignent en moyenne ${fmt1(cardioSleep.highKm)} km, contre ${fmt1(cardioSleep.lowKm)} km lorsque le sommeil passe sous 7 h (écart ${fmt1(cardioSleep.delta)} km, ${fmtPct(cardioSleep.deltaPct)}, ${cardioSleep.highN} et ${cardioSleep.lowN} sorties).${
          cardioSleep.highPace != null && cardioSleep.lowPace != null
            ? ` L'allure moyenne passe de ${fmt1(cardioSleep.lowPace)} à ${fmt1(cardioSleep.highPace)} min/km.`
            : ''
        } Le sommeil n'est pas un bloc Garmin à part : il se lit aussi dans la distance que tu arrives à tenir.`,
        evidence: `${fmt1(cardioSleep.highKm)} km · ${fmt1(cardioSleep.lowKm)} km`,
        weights: { importance: 0.88, reliability: 0.8, novelty: 0.94, fit: 0.92 },
        metrics: cardioSleep
      })
    );
  }

  if (perfSleep && !perfSleep.volumeDominates && (isToday || isWeek || isMonth)) {
    out.push(
      discovery({
        kind: 'disc_sleep_perf',
        nature: 'trajectory',
        family: 'sleep_perf',
        title: 'Le sommeil se lit aussi sur le mouvement le plus chargé, pas seulement le total',
        body: `Sur le mouvement le plus chargé de tes séances, tu fais en moyenne ${fmt1(perfSleep.highLead)} reps après au moins 7 h 30 de sommeil, contre ${fmt1(perfSleep.lowLead)} après une nuit sous 7 h (écart ${fmtPct(Math.abs(perfSleep.deltaPct || 0))}, ${perfSleep.highN} et ${perfSleep.lowN} séances). Ce n'est pas un PR : c'est le niveau que tu reproduis sur le mouvement qui pèse le plus ce jour-là.`,
        evidence: `${fmt1(perfSleep.highLead)} vs ${fmt1(perfSleep.lowLead)} reps`,
        weights: { importance: 0.85, reliability: 0.8, novelty: 0.92, fit: 0.88 },
        metrics: perfSleep
      })
    );
  }

  // RPE sommeil : plages courtes exclues (sticky + n fragile). Mois seulement, et prudente si paradoxe.
  if (rpeSleep && isMonth && !isToday && !isWeek) {
    const paradoxBit = rpeSleep.paradoxical
      ? ` Ici les notes sont plus élevées après les nuits plus longues : ça peut refléter une charge plus ambitieuse quand tu es frais, pas seulement une récupération « plus dure ».`
      : ` L'effort perçu n'est pas un RPE laboratoire : c'est ta propre échelle, et elle sépare deux régimes de récupération sur cet échantillon.`;
    out.push(
      discovery({
        kind: 'disc_sleep_rpe',
        nature: 'trajectory',
        family: 'sleep_rpe',
        title: rpeSleep.paradoxical
          ? 'Tes notes de difficulté et le sommeil précédent ne vont pas dans le sens attendu'
          : 'Tes notes de difficulté bougent avec le sommeil précédent',
        body: `Après une nuit sous 7 h, tu notes tes séances à ${fmt1(rpeSleep.lowDiff)} / 5 de difficulté, contre ${fmt1(rpeSleep.highDiff)} / 5 après au moins 7 h 30 (${rpeSleep.lowN} et ${rpeSleep.highN} séances notées).${paradoxBit}`,
        evidence: `${fmt1(rpeSleep.lowDiff)} vs ${fmt1(rpeSleep.highDiff)} / 5`,
        weights: {
          importance: rpeSleep.paradoxical ? 0.62 : 0.72,
          reliability: rpeSleep.confidence === 'high' ? 0.8 : 0.68,
          novelty: 0.78,
          fit: 0.75
        },
        metrics: rpeSleep
      })
    );
  }

  if (weekFreq) {
    const sleepDelta =
      weekFreq.delta != null
        ? Number(weekFreq.delta)
        : Number(weekFreq.highDays) - Number(weekFreq.lowDays);
    // B6 — titre dérivé du signe ; silence si écart négligeable
    if (Number.isFinite(sleepDelta) && Math.abs(sleepDelta) >= 0.4) {
      const moreActive = sleepDelta > 0;
      out.push(
        discovery({
          kind: 'disc_sleep_freq',
          nature: 'journey',
          family: 'sleep_freq',
          title: moreActive
            ? 'Les semaines bien dormies comptent plus de jours actifs'
            : 'Les semaines bien dormies ne comptent pas plus de jours actifs',
          body: `Tes semaines contenant au moins 4 nuits au-dessus de 7 h 30 présentent une moyenne de ${fmt1(weekFreq.highDays)} jours actifs, contre ${fmt1(weekFreq.lowDays)} lorsque ce seuil n'est atteint que deux fois ou moins (${weekFreq.highWeeks} et ${weekFreq.lowWeeks} semaines). ${
            moreActive
              ? 'La différence porte sur le nombre de jours où tu t\'entraînes.'
              : 'Sur cet historique, mieux dormir ne va pas avec plus de jours entraînés — autre chose limite la fréquence.'
          }`,
          evidence: `${fmt1(weekFreq.highDays)} j. · ${fmt1(weekFreq.lowDays)} j.`,
          weights: { importance: 0.86, reliability: 0.82, novelty: 0.92, fit: 0.9 },
          metrics: { ...weekFreq, delta: sleepDelta }
        })
      );
    }
  }

  if (highShare) {
    const qSrc = isToday || isWeek ? d90 : p;
    const streak = maxConsecutiveTrainingDays(qSrc.repsByDate || p.repsByDate);
    const lowBit =
      highShare.lowShortShare != null
        ? ` Les périodes sous 7 h 30 sont au contraire surreprésentées dans les journées à faible volume.`
        : '';
    const streakBit =
      streak >= 8
        ? ` Ton record de ${streak} jours consécutifs montre que ta capacité à maintenir l'entraînement existe. La différence entre une période productive et une période moins productive réside davantage dans la répétition de journées suffisamment récupérées que dans un niveau maximal ponctuel.`
        : '';
    out.push(
      discovery({
        kind: 'disc_sleep_quarter',
        nature: 'journey',
        family: 'sleep_quarter',
        title: 'Les journées les plus denses suivent plus souvent de longues nuits',
        body: `${highShare.highOk} des ${highShare.highN} journées à au moins 300 reps ont été précédées d'une nuit d'au moins 7 h 30. Ces nuits représentent ${fmtPct(highShare.nightShare)} de l'ensemble des nuits enregistrées.${lowBit} Le lien est net, sans qu'on puisse en conclure que le sommeil cause le volume : d'autres facteurs peuvent intervenir. Ce qui ressort, c'est que le volume élevé apparaît plus souvent après une nuit longue.${streakBit}`,
        evidence: `${highShare.highOk}/${highShare.highN} journées ≥ 300 reps après ≥ 7 h 30`,
        weights: { importance: 0.93, reliability: 0.86, novelty: 0.94, fit: 0.97 },
        metrics: { ...highShare, streak }
      })
    );
  }

  if (j2) {
    out.push(
      discovery({
        kind: 'disc_sleep_j2',
        nature: 'journey',
        family: 'sleep_j2',
        title: isToday
          ? "Cette séance suit un schéma connu autour de la nuit d'avant-hier"
          : isWeek
            ? "Ces 7 jours rappellent le schéma de la nuit d'avant-hier"
            : 'Le volume du jour J reste associé au sommeil d’avant-hier',
        body: `Même après une nuit précédente d'au moins 7 h 30, un sommeil sous 7 h deux nuits plus tôt est associé à ${fmtInt(j2.isolatedVol)} reps le jour J, contre ${fmtInt(j2.okVol)} lorsque les deux nuits dépassent 7 h 30 (${j2.isolatedN} et ${j2.okN} cas). C’est une association observée, pas une preuve que la nuit d’avant-hier cause à elle seule le volume.`,
        evidence: `J-2 court ${fmtInt(j2.isolatedVol)} · deux nuits ok ${fmtInt(j2.okVol)}`,
        weights: { importance: 0.86, reliability: 0.8, novelty: 0.95, fit: 0.88 },
        metrics: j2
      })
    );
  }

  const assoc = sleepAssoc[0];
  if (assoc && Math.abs(assoc.deltaPct) >= 10 && !vol75) {
    out.push(
      discovery({
        kind: 'disc_sleep_assoc',
        nature: 'trajectory',
        family: 'sleep_assoc',
        title: `Tes données montrent une association entre sommeil et ${assoc.name.toLowerCase()}`,
        body: `Tes séances réalisées après plus de 7 h 30 de sommeil produisent en moyenne ${fmtPct(Math.abs(assoc.deltaPct))} ${assoc.deltaPct >= 0 ? 'plus' : 'moins'} de répétitions sur ${assoc.name.toLowerCase()} que celles réalisées après moins de 6 h 30 (${fmt1(assoc.longAvg)} vs ${fmt1(assoc.shortAvg)}, ${assoc.longN} et ${assoc.shortN} séances). Ce n'est pas une preuve que le sommeil provoque ce résultat : c'est une association visible dans tes propres données.`,
        evidence: `${assoc.name} ${fmtSignedPct(assoc.deltaPct)} · ${assoc.longN}/${assoc.shortN}`,
        weights: { importance: 0.88, reliability: Math.min(0.92, 0.7 + assoc.longN * 0.04), novelty: 0.93, fit: 0.9 },
        metrics: { ...assoc }
      })
    );
  }

  if (restAssoc && Math.abs(restAssoc.deltaPct) >= 10 && restAssoc.restedN >= 2 && restAssoc.denseN >= 2) {
    out.push(
      discovery({
        kind: 'disc_rest_assoc',
        nature: 'trajectory',
        family: 'rest_assoc',
        title: 'Tes données montrent une association entre repos et volume de séance',
        body: `Tes séances réalisées après au moins 48 h depuis la précédente produisent en moyenne ${fmtPct(Math.abs(restAssoc.deltaPct))} ${restAssoc.deltaPct >= 0 ? 'plus' : 'moins'} de répétitions que celles enchaînées le lendemain (${fmtInt(restAssoc.restedAvg)} vs ${fmtInt(restAssoc.denseAvg)}, ${restAssoc.restedN} et ${restAssoc.denseN} séances). Ce n'est pas une preuve que le repos provoque ce résultat : c'est une association dans ton historique.`,
        evidence: `${fmtSignedPct(restAssoc.deltaPct)} · 48 h vs J+1`,
        weights: { importance: 0.84, reliability: 0.82, novelty: 0.9, fit: 0.88 },
        metrics: restAssoc
      })
    );
  }

  if (prev30 && prev30.identifiedMuscleReps >= 120 && p.identifiedMuscleReps >= 80) {
    const shifts = p.muscles
      .map((m) => {
        const nowShare = share(m.reps, p.identifiedMuscleReps);
        const thenShare = share(prev30.byMuscle[m.group]?.reps || 0, prev30.identifiedMuscleReps);
        if (nowShare == null || thenShare == null || thenShare < 4) return null;
        return {
          ...m,
          nowShare,
          thenShare,
          relPct: pctChange(nowShare, thenShare)
        };
      })
      .filter((m) => m && Math.abs(m.relPct) >= 18)
      .sort((a, b) => Math.abs(b.relPct) - Math.abs(a.relPct));
    const lead = shifts[0];
    if (lead && (isWeek || isMonth || isLongVoice(v))) {
      out.push(
        discovery({
          kind: 'disc_muscle_share_shift',
          nature: 'trajectory',
          family: 'muscle_shift',
          contentClass: CONTENT_CLASS.DESCRIPTIVE,
          title: `La part attribuée aux ${lead.label} a ${lead.relPct >= 0 ? 'augmenté' : 'diminué'} plus vite que le volume global`,
          body: `Les ${lead.label} représentent actuellement ${fmtPct(lead.nowShare)} du volume musculaire attribué (indicatif), contre ${fmtPct(lead.thenShare)} sur les 30 jours précédents. Sa part a donc ${lead.relPct >= 0 ? 'augmenté' : 'diminué'} de ${fmtPct(Math.abs(lead.relPct))} relativement, alors que le volume global ${
            prev30.totalReps > 0
              ? `est ${fmtSignedPct(pctChange(p.totalReps, prev30.totalReps) || 0)}`
              : 'n’a pas le même ordre de grandeur'
          }.${(() => {
            const gone = (prev30.exercises || [])
              .filter((exercise) => (exercise.reps || 0) >= 48 && !(p.byExercise?.[exercise.id]?.reps > 0))
              .sort((a, b) => b.reps - a.reps)[0];
            return gone
              ? ` ${gone.name} comptait ${fmtInt(gone.reps)} répétitions sur la période précédente et n'apparaît plus ici. Une partie du changement de part vient de cette disparition, pas seulement d'une baisse générale.`
              : '';
          })()} Lecture de structure de parts conventionnelles, pas une mesure anatomique exacte.`,
          evidence: `${lead.label} ${fmtPct(lead.thenShare)} → ${fmtPct(lead.nowShare)}`,
          weights: { importance: 0.7, reliability: 0.7, novelty: 0.72, fit: 0.9 },
          metrics: {
            group: lead.group,
            nowShare: lead.nowShare,
            thenShare: lead.thenShare,
            attributionMode: 'conventional_rep_share'
          }
        })
      );
    }
  }

  if (p.identifiedMuscleReps >= 80 && (isWeek || isMonth || isLongVoice(v))) {
    const pullShare = share(p.pullReps, p.identifiedMuscleReps);
    const pushShare = share(p.pushReps, p.identifiedMuscleReps);
    const lowerShare = share(p.lowerReps, p.identifiedMuscleReps);
    const volPerDay = p.trainingDays > 0 ? p.totalReps / p.trainingDays : null;
    const bits = [];
    if (pushShare != null && pullShare != null) {
      bits.push(`poussée/tirage ${fmtPct(pushShare)} / ${fmtPct(pullShare)}`);
    }
    if (lowerShare != null) {
      bits.push(`bas du corps ${fmtPct(lowerShare)} du volume identifié`);
    }
    if (p.minutes > 0 && p.totalReps > 0) {
      bits.push(`rendement ${fmtInt(p.repsPerHour)} reps/h`);
    }
    if (bits.length >= 2) {
      out.push(
        discovery({
          kind: 'disc_ratio_structure',
          nature: 'trajectory',
          family: 'ratios',
          title: `La structure ${v.ofPeriod} se lit dans les ratios, pas seulement dans le total`,
          body: `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} : ${bits.join(', ')}${
            volPerDay != null ? `, soit ${fmtInt(volPerDay)} reps par jour entraîné` : ''
          }. ${
            (lowerShare || 0) < 8
              ? 'Le bas du corps est presque absent de cette structure.'
              : (pullShare || 0) < 18
                ? 'Le tirage reste minoritaire dans le rapport de forces du haut du corps.'
                : 'Ces rapports décrivent le stimulus reçu, pas seulement la quantité de travail.'
          }`,
          evidence: bits.join(' · '),
          weights: { importance: 0.8, reliability: 0.9, novelty: 0.78, fit: 0.88 }
        })
      );
    }
  }

  if (isLongVoice(v) && first30 && first30.totalReps >= 200 && d30.totalReps >= 200) {
    const volPct = pctChange(d30.totalReps, first30.totalReps);
    const freqPct = pctChange(d30.trainingDays, first30.trainingDays);
    if (volPct != null) {
      const quarterOfLonger = v.key === 'year';
      out.push(
        discovery({
          kind: 'disc_quarter_arc',
          nature: 'journey',
          family: 'quarter_profile',
          title: quarterOfLonger
            ? 'Les trois derniers mois ont une trajectoire interne'
            : 'Le trimestre a une trajectoire interne, pas seulement un total',
          body: `${quarterOfLonger ? 'À l’intérieur des trois derniers mois, les' : 'Les'} 30 derniers jours totalisent ${fmtInt(d30.totalReps)} reps en ${d30.trainingDays} jours, contre ${fmtInt(first30.totalReps)} reps en ${first30.trainingDays} jours au début ${quarterOfLonger ? 'de ces trois mois' : 'du trimestre'} (${fmtSignedPct(volPct)}${
            freqPct != null ? `, fréquence ${fmtSignedPct(freqPct)}` : ''
          }). ${
            quarterOfLonger
              ? `Cette comparaison ne résume pas ${v.thisPeriod} : elle dit seulement comment les trois derniers mois se terminent par rapport à leur propre début.`
              : 'Le long terme ici répond à « quelle trajectoire se construit », pas à une deuxième version du court terme.'
          }`,
          evidence: `fin ${fmtInt(d30.totalReps)} vs début ${fmtInt(first30.totalReps)}`,
          weights: { importance: 0.86, reliability: 0.88, novelty: 0.84, fit: 1 }
        })
      );
    }
  }

  const structSrc = isToday || isWeek ? d30 : p;
  const structThen = prev30;
  const structural = detectStructuralShifts(structSrc, structThen);
  const structLeads = structural
    .filter((row) => (p.byExercise[row.id]?.reps || 0) >= 24)
    .slice(0, v.key === 'today' ? 1 : v.key === 'week' ? 2 : 3);
  structLeads.forEach((structLead, structIdx) => {
    const thenBit =
      structLead.thenReps >= 12
        ? `contre ${fmtInt(structLead.thenReps)} reps (${fmtPct(structLead.thenShare)} de la ${structLead.family}) sur les 30 jours d'avant`
        : `alors qu'ils étaient encore marginaux ou absents sur les 30 jours d'avant`;
    const structWin = structSrc.window || p.window;
    const traj = measureTraj(() =>
      buildExerciseTrajectory({
        snapshot: extras.snapshot,
        exerciseId: structLead.id,
        exerciseName: structLead.name,
        window: structWin,
        getExerciseNameById: extras.getExerciseNameById || null,
        mode: 'emergence',
        computeScope: extras.computeScope || null
      })
    );
    const shareLead = `${structLead.name} pèsent désormais ${fmtInt(structLead.nowReps)} reps sur ${structLead.nowDays} séances des 30 derniers jours, soit ${fmtPct(structLead.nowShare)} ${possessiveMuscleShare(structLead.family)}, ${thenBit}.`;
    const legacyTitle =
      structLead.nowDays < 6
        ? `${structLead.name} entre dans ${possessiveMuscleShare(structLead.family)}`
        : `${structLead.name} devient structurel dans ${possessiveMuscleShare(structLead.family)}`;
    const legacyBody = `${shareLead} ${
      structLead.nowDays < 6
        ? `Ce n'est plus une séance isolée, mais pas encore une habitude installée de cette famille.`
        : `Ce n'est plus un mouvement ponctuel : il structure le stimulus de cette famille, plutôt que de n'apparaître qu'en complément.`
    }`;
    const rendered = renderExerciseTrajectoryCopy(traj, {
      legacyBits: {
        title: legacyTitle,
        body: legacyBody,
        evidence: `${structLead.name} ${fmtPct(structLead.thenShare)} → ${fmtPct(structLead.nowShare)} de la ${structLead.family}`
      }
    });
    let body = shareLead;
    if (rendered.usedTrajectory && traj?.ok) {
      const mech =
        traj.setMechanism?.available && traj.setMechanism.before && traj.setMechanism.after
          ? ` Le volume par séance passe d’environ ${traj.setMechanism.before.setCount} × ${traj.setMechanism.before.perSet} à environ ${traj.setMechanism.after.setCount} × ${traj.setMechanism.after.perSet}${
              traj.setMechanism.maintained ? ', format maintenu sur les séances suivantes' : ''
            }.`
          : '';
      const installBit =
        traj.installation?.kind === 'installed' ||
        traj.installation?.kind === 'installing' ||
        traj.installation?.kind === 'repeated'
          ? ` ${structLead.name} apparaît sur ${traj.installation.sessionsInWindow} séances${
              traj.installation.spanDays != null ? ` en ${traj.installation.spanDays} jours` : ''
            }${traj.installation.kind === 'repeated' ? ' (répétition, pas encore installation durable)' : ''}.`
          : '';
      const shapeBit =
        traj.shape?.kind === 'steady_rise' || traj.shape?.kind === 'rise_phases'
          ? ` Le volume par séance progresse d’environ ${traj.shape.earlyMean} à ${traj.shape.lateMean} répétitions.`
          : traj.shape?.kind === 'steady_decline' || traj.shape?.kind === 'decline_phases'
            ? ` Le volume par séance recule d’environ ${traj.shape.earlyMean} à ${traj.shape.lateMean} répétitions.`
            : '';
      const close =
        structLead.nowDays < 6
          ? ` Ce n'est plus une séance isolée ; répéter ce volume sur les prochaines séances dira s'il structure vraiment la ${structLead.family}.`
          : ` Il structure désormais le stimulus de cette famille, plutôt que de n'apparaître qu'en complément.`;
      body = `${shareLead}${installBit}${mech || shapeBit}${close}`;
    } else {
      body = legacyBody;
    }
    const title =
      rendered.usedTrajectory && traj?.findings?.titleHint && traj.installation?.kind === 'installed'
        ? `${structLead.name} s'installe dans ta ${structLead.family}`
        : rendered.title || legacyTitle;
    out.push(
      discovery({
        kind: 'disc_structural_memory',
        nature: 'trajectory',
        family: 'structural_memory',
        title,
        body,
        evidence:
          rendered.evidence ||
          `${structLead.name} ${fmtPct(structLead.thenShare)} → ${fmtPct(structLead.nowShare)} de la ${structLead.family}`,
        weights: {
          importance: Math.max(0.8, 0.91 - structIdx * 0.04),
          reliability: 0.88,
          novelty: Math.max(0.84, 0.94 - structIdx * 0.03),
          fit: 0.96
        },
        metrics: {
          name: structLead.name,
          family: structLead.family,
          nowShare: structLead.nowShare,
          thenShare: structLead.thenShare,
          exerciseId: String(structLead.id),
          draftTitle: legacyTitle,
          draftBody: legacyBody,
          legacyTitle,
          legacyBody,
          ...trajectoryToMetrics(traj)
        }
      })
    );
  });

  const nowMix = tallyStimulus(p);
  const refMix = tallyStimulus(isToday || isWeek ? d30 : prev30 && prev30.totalReps >= 80 ? prev30 : d30);
  const mix = stimulusContrast(nowMix.buckets, refMix.buckets);
  if (mix && nowMix.buckets.total >= 120) {
    const bits = [
      `${fmtPct(mix.compound)} de mouvements polyarticulaires contre ${fmtPct(mix.isolation)} d'isolation`,
      `${fmtPct(mix.strength)} de travail de force contre ${fmtPct(mix.endurance)} d'endurance musculaire`,
      mix.weighted >= 4
        ? `${fmtPct(mix.weighted)} de volume lesté, le reste au poids du corps`
        : `la quasi-totalité du volume reste au poids du corps`
    ];
    if ((mix.vertical || 0) >= 8 || (mix.horizontal || 0) >= 8) {
      bits.push(
        `${fmtPct(mix.vertical || 0)} de tirage/poussée vertical contre ${fmtPct(mix.horizontal || 0)} d'horizontal`
      );
    }
    if ((mix.unilateral || 0) >= 8) {
      bits.push(`${fmtPct(mix.unilateral)} de travail unilatéral`);
    }
    const shiftBits = [];
    if (mix.thenIsolation != null && Math.abs(mix.isolation - mix.thenIsolation) >= 8) {
      shiftBits.push(
        `la part d'isolation est ${mix.isolation > mix.thenIsolation ? 'plus élevée' : 'plus basse'} que sur la référence récente (${fmtPct(mix.thenIsolation)} → ${fmtPct(mix.isolation)})`
      );
    }
    if (mix.thenEndurance != null && Math.abs(mix.endurance - mix.thenEndurance) >= 8) {
      shiftBits.push(
        `l'endurance musculaire passe de ${fmtPct(mix.thenEndurance)} à ${fmtPct(mix.endurance)}`
      );
    }
    out.push(
      discovery({
        kind: 'disc_stimulus_mix',
        nature: 'trajectory',
        family: 'stimulus_mix',
        title: `Le mix force / endurance / poly ${v.ofPeriod} se lit dans les parts, pas dans le total`,
        body: `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} ${agreeVerb(v, 'répartit', 'répartissent')} ${fmtInt(nowMix.buckets.total)} reps identifiées ainsi : ${bits.join(', ')}.${
          shiftBits.length
            ? ` Par rapport à ta référence récente, ${shiftBits.join(' et ')}.`
            : ' Ces parts décrivent le type de stimulus reçu, pas seulement la quantité de travail.'
        }`,
        evidence: `poly ${fmtPct(mix.compound)} · force ${fmtPct(mix.strength)} · lesté ${fmtPct(mix.weighted)}`,
        weights: { importance: 0.84, reliability: 0.9, novelty: 0.86, fit: 0.9 },
        metrics: mix
      })
    );
  }

  const runKm = Number(p.runningKm) || 0;
  const runMin = Number(p.runningMinutes) || 0;
  const runBase = volumeBaseline || prev30;
  const prevKm = Number(runBase?.runningKm) || 0;
  // Ne publier la carte générique que s'il y a un contraste réel course ↔ renforcement.
  // Un simple cumul « X km + Y reps » est trop faible face aux arcs / interruptions course.
  if ((runKm >= 1.5 || runMin >= 15) && p.totalReps >= 80) {
    const kmPct = prevKm >= 1.5 ? pctChange(runKm, prevKm) : null;
    const repsPct = runBase?.totalReps >= 80 ? pctChange(p.totalReps, runBase.totalReps) : null;
    const hasContrast =
      (kmPct != null && repsPct != null && Math.abs(kmPct) >= 12 && Math.abs(repsPct) >= 8 && Math.sign(kmPct) !== Math.sign(repsPct)) ||
      (kmPct == null && prevKm < 1 && runKm >= 3);
    if (hasContrast) {
      let read = 'Course et renforcement coexistent sur la période.';
      if (kmPct != null && repsPct != null && kmPct < -12 && repsPct > 8) {
        read = `Le volume de course recule (${fmtSignedPct(kmPct)}) tandis que les reps de renforcement augmentent (${fmtSignedPct(repsPct)}).`;
      } else if (kmPct != null && repsPct != null && kmPct > 12 && repsPct < -8) {
        read = `La course augmente (${fmtSignedPct(kmPct)}) alors que les reps de renforcement reculent (${fmtSignedPct(repsPct)}).`;
      } else if (kmPct == null && prevKm < 1) {
        read = 'La course réapparaît à côté du renforcement.';
      }
      const runClock = runMin >= 10 ? ` en ${formatDurationFr(runMin)}` : '';
      out.push(
        discovery({
          kind: 'disc_cardio_strength',
          nature: 'trajectory',
          family: 'cardio_strength',
          title: 'Course et renforcement divergent sur la période',
          body: `${v.thisPeriod.charAt(0).toUpperCase()}${v.thisPeriod.slice(1)} combine ${fmt1(runKm)} km de course${runClock} et ${fmtInt(p.totalReps)} reps de renforcement.${
            prevKm >= 1 || runBase?.totalReps >= 80
              ? ` Sur ${volumeBaselineLabel} : ${fmt1(prevKm)} km et ${fmtInt(runBase.totalReps)} reps.`
              : ''
          } ${read}`,
          evidence: `${fmt1(runKm)} km · ${fmtInt(p.totalReps)} reps`,
          weights: { importance: 0.8, reliability: 0.88, novelty: 0.86, fit: 0.9 },
          metrics: {
            runKm,
            runMin,
            kmPct,
            repsPct,
            windowSpanDays: p.spanDays,
            baselineSpanDays: runBase?.spanDays ?? null,
            baselineSameLength: !isLongVoice(v) || (runBase?.spanDays != null && Math.abs((runBase.spanDays || 0) - (p.spanDays || 0)) < 3),
            contrastOnly: true
          }
        })
      );
    }
  }

  const fadeSrc = isToday || isWeek ? d30 : p;
  const fadeThen = prev30;
  const fades = detectFamilyFades(fadeSrc, fadeThen);
  const fadeLead = fades[0];
  if (fadeLead && (isWeek || isMonth || isLongVoice(v))) {
    const fadeWin = fadeThen?.window || {
      start: addCalendarDays(p.window?.end || fadeSrc.window?.end, -60),
      end: p.window?.end || fadeSrc.window?.end
    };
    const fadeTraj = measureTraj(() =>
      buildExerciseTrajectory({
        snapshot: extras.snapshot,
        exerciseId: fadeLead.id,
        exerciseName: fadeLead.name,
        window: fadeWin,
        getExerciseNameById: extras.getExerciseNameById || null,
        mode: 'progress',
        computeScope: extras.computeScope || null
      })
    );
    let fadeExtra = '';
    if (fadeTraj?.ok && fadeTraj.shape?.kind && fadeTraj.shape.earlyMean != null && fadeTraj.shape.lateMean != null) {
      if (fadeTraj.shape.kind === 'steady_decline' || fadeTraj.shape.kind === 'decline_phases') {
        fadeExtra = ` Sur les séances encore présentes, le volume par séance est passé d’environ ${fadeTraj.shape.earlyMean} à ${fadeTraj.shape.lateMean} répétitions.`;
      } else if (fadeLead.nowReps === 0) {
        fadeExtra = ` Aucune séance de ${fadeLead.name} dans la période récente : ce n’est pas un volume réduit, c’est une absence.`;
      }
    } else if (fadeLead.nowReps === 0) {
      fadeExtra = ` Aucune séance de ${fadeLead.name} dans la période récente.`;
    }
    out.push(
      discovery({
        kind: 'disc_family_fade',
        nature: 'trajectory',
        family: 'family_fade',
        title: `${fadeLead.name} s'efface de ${possessiveMuscleShare(fadeLead.family)}`,
        body: `${fadeLead.name} représentaient ${fmtPct(fadeLead.thenShare)} ${possessiveMuscleShare(fadeLead.family)} sur les 30 jours d'avant (${fmtInt(fadeLead.thenReps)} reps), contre ${fmtPct(fadeLead.nowShare)} aujourd'hui${
          fadeLead.nowReps > 0 ? ` (${fmtInt(fadeLead.nowReps)} reps)` : ''
        }.${fadeExtra} Leur disparition explique une part de la baisse d'exposition de cette famille.`,
        evidence: `${fadeLead.name} ${fmtPct(fadeLead.thenShare)} → ${fmtPct(fadeLead.nowShare)} ${possessiveMuscleShare(fadeLead.family)}`,
        weights: { importance: 0.9, reliability: 0.86, novelty: 0.93, fit: 0.94 },
        metrics: {
          ...fadeLead,
          ...trajectoryToMetrics(fadeTraj)
        }
      })
    );
  }

  if ((isMonth || isLongVoice(v)) && p.repsByDate) {
    const months = bestCalendarMonths(p.repsByDate, p.window);
    if (months.length >= 2 && months[0].reps >= 200) {
      const lead = months[0];
      const rest = months.slice(1).reduce((s, m) => s + m.reps, 0);
      const leadShare = share(lead.reps, p.totalReps);
      // Tautologie : un mois qui couvre ~toute la fenêtre n’apporte rien.
      if (
        leadShare != null &&
        leadShare < 92 &&
        (leadShare >= 38 || lead.reps >= (months[1]?.reps || 0) * 1.15)
      ) {
        const leadLabel = lead.partial
          ? `${formatYmFr(lead.ym)} (portion dans la fenêtre)`
          : formatYmFr(lead.ym);
        const other = months[1];
        const otherLabel = other
          ? other.partial
            ? `${formatYmFr(other.ym)} (portion dans la fenêtre)`
            : formatYmFr(other.ym)
          : null;
        out.push(
          discovery({
            kind: 'disc_best_month',
            nature: 'journey',
            family: 'best_month',
            title: `${leadLabel} concentre la part la plus productive de la période`,
            body: `${leadLabel} totalise ${fmtInt(lead.reps)} reps en ${lead.days} jours avec séance dans la fenêtre, soit ${fmtPct(leadShare)} du volume ${v.ofPeriod}${
              other ? `, contre ${fmtInt(other.reps)} en ${otherLabel}` : ''
            }. ${
              rest > 0
                ? lead.partial || other?.partial
                  ? 'Ce sont des portions de mois calendaires dans la fenêtre glissante, pas des mois complets comparés à durée égale.'
                  : 'La période n’est donc pas un volume uniforme : un mois concentre davantage d’exposition que les autres.'
                : ''
            }${monthSleepExplain(lead, extras.allNights, extras.catalog)}`,
            evidence: `${formatYmFr(lead.ym)} · ${fmtInt(lead.reps)} reps · ${fmtPct(leadShare)}${lead.partial ? ' · partiel' : ''}`,
            weights: { importance: 0.88, reliability: 0.9, novelty: 0.86, fit: 0.95 },
            metrics: {
              ym: lead.ym,
              reps: lead.reps,
              days: lead.days,
              share: leadShare,
              partial: Boolean(lead.partial),
              dates: lead.dates || [],
              daysDetail: (lead.dates || []).map((date) => ({
                date,
                reps: Number(p.repsByDate?.[date]) || 0
              })),
              sessions: (lead.dates || []).map((date) => ({
                date,
                reps: Number(p.repsByDate?.[date]) || 0
              }))
            }
          })
        );
      }
    }

    // Arcs multi-mois (fréquence vs densité) — prioritaire sur les longs horizons.
    if (isLongVoice(v) || (isMonth && Object.keys(p.repsByDate || {}).length >= 40)) {
      buildMonthlyVolumeArcDiscoveries(p.repsByDate, {
        windowEndYmd: p.window?.end || null,
        snapshot: extras.snapshot || null,
        garminData: extras.garminData || null
      }).forEach((partial) => out.push(discovery(partial)));
    }
  }

  // Interruption de course documentée (données runDays de la fenêtre).
  if (isLongVoice(v) && Array.isArray(extras.runDays) && extras.runDays.length >= 2) {
    buildRunningGapDiscoveries(extras.runDays, {
      windowStartYmd: p.window?.start || null,
      windowEndYmd: p.window?.end || null
    }).forEach((partial) => out.push(discovery(partial)));
  }

  // Rythme transversal : streaks, coupures, répartition hebdomadaire.
  if (!emptyPeriod && (isWeek || isMonth || isLongVoice(v))) {
    buildTrainingRhythmDiscoveries(p.repsByDate || {}, p.window || {}, {
      minActiveDays: isWeek ? 2 : 4
    }).forEach((partial) => out.push(discovery(partial)));
  }

  appendMilestoneDiscoveries(out, extras, v);
  return out;
}

export function appendMilestoneDiscoveries(out, extras, v) {
  const milestones = detectRecapMilestones({
    snapshot: extras.snapshot || {},
    window: extras.window || null,
    catalog: extras.catalog || [],
    garminData: extras.garminData || null,
    getExerciseNameById: extras.getExerciseNameById || null,
    voiceKey: v.key,
    profileQuestionnaireRaw: extras.profileQuestionnaireRaw || null
  });
  milestones.forEach((m) => {
    const dates = [m.prevDate, m.date].filter(Boolean);
    const sessions = [];
    if (m.prevDate) {
      sessions.push({
        date: m.prevDate,
        reps: m.priorAvg != null ? Math.round(m.priorAvg) : null,
        role: 'last_before_gap'
      });
    }
    if (m.date) {
      sessions.push({
        date: m.date,
        reps: m.returnReps ?? null,
        role: 'return_session',
        name: m.exerciseName || null
      });
    }
    (m.mates || []).forEach((mate) => {
      sessions.push({
        date: mate.date || m.date,
        reps: mate.reps,
        name: mate.name,
        role: 'same_day_companion'
      });
    });
    out.push(
      discovery({
        kind: m.kind,
        nature: m.nature || 'now',
        family: m.family || 'ms_event',
        title: m.title,
        body: m.body,
        evidence: m.evidence || '',
        weights: {
          importance: m.importance || 0.9,
          reliability: 0.92,
          novelty: 0.96,
          fit: 0.95
        },
        score: m.exerciseId ? 91 : undefined,
        metrics: {
          ...(m.metrics && typeof m.metrics === 'object' ? m.metrics : {}),
          type: m.type,
          date: m.date,
          prevDate: m.prevDate || null,
          dates,
          sessions,
          daysDetail: dates.map((d) => ({ date: d })),
          threshold: m.threshold != null ? m.threshold : undefined,
          exerciseId: m.exerciseId || m.metrics?.exerciseId || undefined,
          exerciseName: m.exerciseName || null,
          gapDays: m.gap ?? m.metrics?.gapDays ?? null,
          habitMedianGap: m.habitMedianGap ?? null,
          habitIntervalRatio: m.ratio ?? null,
          returnReps: m.returnReps ?? null,
          priorAvg: m.priorAvg ?? null,
          vsPriorPct: m.vsPriorPct ?? null,
          unit: m.unit || null,
          mates: m.mates || [],
          factId: m.exerciseId ? `ms|${m.kind}|${m.exerciseId}` : undefined,
          name: m.exerciseName || m.title,
          // Brouillon avant porte éditoriale (titre/body d’origine jalon)
          draftTitle: m.title,
          draftBody: m.body
        }
      })
    );
  });
}

const MONTHS_FR = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre'
];

export function maxConsecutiveTrainingDays(repsByDate) {
  const dates = Object.keys(repsByDate || {})
    .filter((d) => (Number(repsByDate[d]) || 0) >= 20)
    .sort();
  if (!dates.length) return 0;
  let best = 1;
  let cur = 1;
  for (let i = 1; i < dates.length; i += 1) {
    if (dates[i] === addCalendarDays(dates[i - 1], 1)) {
      cur += 1;
      if (cur > best) best = cur;
    } else {
      cur = 1;
    }
  }
  return best;
}

export function monthSleepExplain(lead, nights, catalog) {
  if (!lead?.ym) return '';
  const monthNights = (nights || []).filter((n) => String(n.ymd || '').startsWith(lead.ym) && n.hours != null);
  if (monthNights.length < 8) return '';
  const hours = monthNights.reduce((s, n) => s + n.hours, 0) / monthNights.length;
  const highShare = monthNights.filter((n) => n.hours >= 7.5).length / monthNights.length;
  const monthSess = (catalog || []).filter((s) => String(s.date).startsWith(lead.ym));
  const minutes = monthSess.reduce((s, row) => s + (Number(row.minutes) || 0), 0);
  const minBit = minutes >= 40 ? ` et ${formatDurationFr(minutes)} d'exercice` : '';
  return ` ${formatYmFr(lead.ym)} illustre cette dynamique avec ${fmtInt(lead.reps)} reps, ${lead.days} jours entraînés${minBit} : le sommeil y est en moyenne de ${formatSleepHoursFr(hours)}, et ${fmtPct(highShare * 100)} des nuits dépassent 7 h 30.`;
}

export function formatYmFr(ym) {
  const [y, m] = String(ym || '').split('-').map(Number);
  if (!y || !m) return String(ym || '');
  return `${MONTHS_FR[m - 1]} ${y}`;
}

export function bestCalendarMonths(repsByDate, window = null) {
  const by = {};
  Object.entries(repsByDate || {}).forEach(([ymd, reps]) => {
    const ym = String(ymd).slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(ym)) return;
    if (!by[ym]) by[ym] = { ym, reps: 0, days: 0, dates: [] };
    by[ym].reps += Number(reps) || 0;
    by[ym].days += 1;
    by[ym].dates.push(ymd);
  });
  const winStart = window?.start ? String(window.start).slice(0, 10) : null;
  const winEnd = window?.end ? String(window.end).slice(0, 10) : null;
  return Object.values(by)
    .map((row) => {
      const [y, m] = String(row.ym).split('-').map(Number);
      const monthStart = `${row.ym}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      const monthEnd = `${row.ym}-${String(lastDay).padStart(2, '0')}`;
      const partial =
        (winStart && winStart > monthStart) || (winEnd && winEnd < monthEnd) || row.days < lastDay;
      return { ...row, partial: Boolean(partial), monthDayCount: lastDay };
    })
    .sort((a, b) => b.reps - a.reps);
}

/** Trace diagnostic depuis une fenêtre période (repsByDate). */
export function periodTraceMetrics(periodObj, extra = {}) {
  const repsByDate = periodObj?.repsByDate || {};
  const dayRows = Object.entries(repsByDate)
    .map(([date, reps]) => ({ date, reps: Number(reps) || 0 }))
    .filter((r) => r.reps > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  return {
    ...extra,
    dates: dayRows.map((r) => r.date),
    daysDetail: dayRows,
    sessions: dayRows,
    trainingDays: periodObj?.trainingDays ?? dayRows.length,
    totalReps: periodObj?.totalReps ?? null,
    windowStart: periodObj?.window?.start || null,
    windowEnd: periodObj?.window?.end || null
  };
}

/**
 * Mémoire de kind : évite de resservir le même constat.
 * Les trajectoires riches (preuves séances/sets/témoins) ne doivent pas
 * être éliminées du pack uniquement parce que le kind a déjà été vu.
 */
