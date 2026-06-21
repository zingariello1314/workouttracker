/**
 * Rapport « Structure du programme » pour Récap > Analyse.
 * Croise plan hebdo, reps cochées (push/pull), exposition jambes structurelle et priorité.
 */

import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import { resolveStreetSkillPlan } from '../../features/profileQuestionnaire/quizStreetSkillGoal';
import { normalizeProfileQuestionnaire } from '../../features/profileQuestionnaire/schema';
import {
  inferProgramCadenceLabel,
  scanStructuralLegPlan
} from './recapMovementClassification';

const MUSCLE_LABEL_FR = {
  [MuscleGroups.CHEST]: 'pectoraux',
  [MuscleGroups.BACK]: 'dos',
  [MuscleGroups.SHOULDERS]: 'épaules',
  [MuscleGroups.BICEPS]: 'biceps',
  [MuscleGroups.TRICEPS]: 'triceps',
  [MuscleGroups.QUADS]: 'quadriceps',
  [MuscleGroups.HAMSTRINGS]: 'ischio-jambiers',
  [MuscleGroups.CALVES]: 'mollets',
  [MuscleGroups.CORE]: 'abdominaux'
};

function round1(n) {
  return Math.round(Number(n) * 10) / 10;
}

function resolveStructuralLegFrequency(exposure, program) {
  const fromExposure = exposure?.legSlotsPlan;
  if (fromExposure != null && fromExposure >= 0) return round1(fromExposure);
  return scanStructuralLegPlan(program).legSlotsPerWeek;
}

function countActiveScheduleDays(program) {
  const schedule = program?.schedule;
  if (!schedule || typeof schedule !== 'object') return 0;
  return Object.values(schedule).filter((day) => {
    if (!day || day.active === false) return false;
    const hasMain = (day.exercises?.length || day.exercices?.length || 0) > 0;
    const hasVariants = Object.values(day.salleVariants || {}).some(
      (v) => (v?.exercises?.length || v?.exercices?.length || 0) > 0
    );
    const hasBlocks = Array.isArray(day.blocks) && day.blocks.some((b) => b && b !== 'rest');
    return hasMain || hasVariants || hasBlocks || Boolean(day.complementaryActivity);
  }).length;
}

function pickDominantMuscleRow(muscleShareRows) {
  if (!Array.isArray(muscleShareRows) || !muscleShareRows.length) return null;
  const top = muscleShareRows[0];
  return {
    groupId: top.groupId,
    label: MUSCLE_LABEL_FR[top.groupId] || top.groupId,
    reps: Math.round(top.reps || 0)
  };
}

function buildIntroParagraph(program, answers, exposure, pushPull, planRatio) {
  const street = resolveStreetSkillPlan(answers || {});
  const cadence = inferProgramCadenceLabel(program);
  const legStructural = resolveStructuralLegFrequency(exposure, program);
  const pushPlan = exposure?.pushDaysPlan ?? 0;
  const pullPlan = exposure?.pullDaysPlan ?? 0;

  const cadenceText = cadence
    ? `format ${cadence.intenseDays} jours intensifs + ${cadence.deloadDays} jour de décharge`
    : `format ${countActiveScheduleDays(program)} j. actifs / semaine`;

  let intro = `Le programme est construit sur un ${cadenceText}, dominante haut du corps (push/pull/épaules) avec un volet street (tractions, dips, pompes) en fil rouge.`;
  intro += ` Cohérent sur le papier avec l'objectif « musclé et défini », priorité haut du corps`;
  if (street.labelFr) intro += ` et « ${street.labelFr} »`;
  intro += ' — mais la répartition réelle des groupes sollicités révèle un déséquilibre que le programme ne corrige pas structurellement.';

  if (pushPull?.ratio != null && pushPull.ratio >= 1.5) {
    intro += ` Ratio push/pull coché ~${pushPull.ratio} (${pushPull.pushPct} % push · ${pushPull.pullPct} % pull · ${pushPull.push} vs ${pushPull.pull} reps)${planRatio != null ? `, au-dessus du ~${planRatio} planifié` : ''}.`;
  }

  if (legStructural < 1) {
    intro += ` Slots jambes structurels au plan : ~${legStructural}/sem seulement`;
    if (exposure?.optionalLegSlotsPlan >= 1) {
      intro += ' (variante salle jambes en option, pas la piste principale)';
    }
    intro += '.';
  }

  if (pushPlan >= 1 || pullPlan >= 1) {
    const slots = [];
    if (pushPlan >= 1) slots.push(`~${pushPlan} j. poussée`);
    if (pullPlan >= 1) slots.push(`~${pullPlan} j. tirage`);
    if (slots.length) intro += ` Répartition planifiée : ${slots.join(', ')}.`;
  }

  return intro;
}

function buildLegStructureAnalysis(exposure, legReps, legStructural, legWeeklyActual, runKm, pushPull, program) {
  const optional = exposure?.optionalLegSlotsPlan ?? scanStructuralLegPlan(program).optionalLegSlots;

  if (legStructural < 1) {
    let text =
      'Le programme ne prévoit quasiment aucun exercice jambes dédié — le peu visible vient du cardio (squats sautés ponctuels, course)';
    if (optional >= 1) {
      text += " ou d'une variante salle jambes optionnelle que tu n'exécutes pas systématiquement";
    }
    text +=
      ". Pas forcément un défaut vu l'objectif « haut du corps + cardio » du quiz, mais si l'ambition est un développement plus complet à moyen terme, c'est la structure même qu'il faudra ajuster : même à 100 % d'adhérence, le volume jambes structurel resterait proche de zéro";
    if (legReps >= 100) {
      text += ` (les ${legReps} reps jambes cochées viennent surtout du réalisé/accessoires, pas du squelette du plan).`;
    } else {
      text += '.';
    }
    if (runKm >= 10) {
      text += ` Les ~${round1(runKm)} km de course compensent partiellement mais ne remplacent pas un travail force jambes.`;
    }
    return text;
  }

  if (legWeeklyActual >= 1 && legReps >= 80) {
    return `En pratique, tu cumules ${legReps} reps jambes (~${legWeeklyActual}/sem) — au-delà du squelette du plan (~${legStructural}/sem structurel). Le levier principal reste le ratio push/pull${pushPull?.ratio != null ? ` (${pushPull.ratio})` : ''}.`;
  }

  return null;
}

function buildRatioCommentary(pushPull, planRatio, exposure, verticalPull) {
  if (!pushPull?.ratio) return null;
  const r = pushPull.ratio;
  const pullPlan = exposure?.pullDaysPlan ?? 0;

  if (r >= 2) {
    let text = `Un ratio push/pull de ${r} pour 1 est élevé pour un objectif équilibré — la zone épaules concentre l'essentiel du volume`;
    if (verticalPull?.totalReps >= 40) {
      text += `, alors que le tirage progresse bien (~${verticalPull.totalReps} reps sur ${verticalPull.sessions} séances) mais en quantité nettement inférieure`;
    }
    text += `. Ce n'est pas un problème d'exécution : c'est la conception du programme qui propose plus de slots push que pull`;
    if (pullPlan < 2) text += ' (peu de jours tirage au plan)';
    text += `. Ajouter 1-2 exercices de tirage par semaine rééquilibrerait sans toucher au reste`;
    if (planRatio != null) text += ` (plan ~${planRatio}, réalisé ${r})`;
    return `${text}.`;
  }

  if (r <= 0.7) {
    return `Le tirage domine (${pushPull.pullPct} % des reps) — vérifie que poussée et triceps reçoivent assez de stimulus si tu vises l'équilibre.`;
  }
  return `Push/pull relativement équilibré (~${pushPull.pushPct} % / ${pushPull.pullPct} %) sur la période affichée.`;
}

function buildPriorityText(structuralItems, pushPull, enrichment, legStructural = 0) {
  const texts = (structuralItems || [])
    .map((x) => (typeof x === 'string' ? x : x?.text))
    .filter(Boolean);

  const stretchGap =
    enrichment?.completion?.exoPct != null &&
    enrichment?.completion?.stretchPct != null &&
    enrichment.completion.exoPct - enrichment.completion.stretchPct >= 20;

  const issues = [];
  if (pushPull?.ratio >= 1.8) issues.push("l'écart push/pull");
  if (legStructural < 1) issues.push('les jambes quasi absentes au plan');

  let text = "Le programme sert bien l'objectif « haut du corps + street » mais creuse mécaniquement ";
  text += issues.length ? `${issues.join(' et ')}. ` : 'certains déséquilibres de répartition. ';
  text += "Avant d'ajouter du volume, c'est la répartition des slots hebdomadaires qui mérite d'être revue";
  if (pushPull?.ratio >= 1.8) text += ' — en priorité push/pull';
  if (stretchGap) {
    text += ` ; les étirements (~${enrichment.completion.stretchPct} %) restent très en retard sur les exos (~${enrichment.completion.exoPct} %)`;
  }
  text += '.';

  if (issues.length || stretchGap) return text;

  const hit = texts.find((t) => /déséquilibre|push|pull|jambes|sous-représenté/i.test(t));
  if (hit) return hit;

  return "Structure globalement cohérente — consolide la régularité avant d'ajouter une contrainte (charge, fréquence ou objectif chiffré).";
}

/**
 * @returns {object|null}
 */
export function buildProgramStructureReport(opts = {}) {
  const {
    activeProgram = null,
    programCoachAnalysis = null,
    enrichment = null,
    assessment = null,
    profileQuestionnaireRaw = null,
    window = enrichment?.window,
    denseAnalytics = null
  } = opts;

  if (!activeProgram?.schedule && !programCoachAnalysis?.hasProgram) return null;

  const answers = normalizeProfileQuestionnaire(profileQuestionnaireRaw).answers || {};
  const pushPull = enrichment?.pushPull;
  const exposure = programCoachAnalysis?.exposure || {};
  const structural = programCoachAnalysis?.levels?.structural || [];
  const planRatio = programCoachAnalysis?.pushPullRatio;
  const dominant = pickDominantMuscleRow(enrichment?.muscleShareRows);
  const cadence = inferProgramCadenceLabel(activeProgram);
  const legStructural = resolveStructuralLegFrequency(exposure, activeProgram);
  const legWeeklyPlan = round1(exposure?.legDaysPlan ?? exposure?.legDays ?? 0);
  const legWeeklyActual = round1(exposure?.legDaysWeeklyActual ?? denseAnalytics?.legDaysWeeklyActual ?? 0);
  const legReps = denseAnalytics?.legReps ?? 0;
  const verticalPull = denseAnalytics?.verticalPull ?? null;

  const kpiCards = [];

  if (cadence) {
    kpiCards.push({
      id: 'daysWeek',
      label: 'Jours / semaine',
      value: cadence.label,
      badge: 'Cohérent',
      tone: 'good'
    });
  }

  kpiCards.push({
    id: 'legFreq',
    label: 'Fréq. jambes',
    value: `~${legStructural}/sem`,
    badge: legStructural >= 1.5 ? 'OK' : legStructural >= 1 ? 'Modéré' : 'Faible',
    tone: legStructural >= 1.5 ? 'good' : legStructural >= 1 ? 'warn' : 'bad'
  });

  if (dominant) {
    kpiCards.push({
      id: 'dominantVol',
      label: `Volume ${dominant.label}`,
      value: `${dominant.reps} reps`,
      badge: 'Dominant',
      tone: 'warn'
    });
  }

  const bars =
    pushPull?.pushPct != null
      ? {
          push: {
            pct: pushPull.pushPct,
            reps: pushPull.push,
            color: '#c084fc'
          },
          pull: {
            pct: pushPull.pullPct,
            reps: pushPull.pull,
            color: '#38bdf8'
          },
          ratio: pushPull.ratio,
          planRatio
        }
      : null;

  const runKm =
    (denseAnalytics?.runningPeriod?.distanceKm ??
      enrichment?.digest?.perActivity?.running?.totals?.distanceKm) ||
    0;

  const legAnalysis = buildLegStructureAnalysis(
    exposure,
    legReps,
    legStructural,
    legWeeklyActual,
    runKm,
    pushPull,
    activeProgram
  );

  return {
    title: activeProgram?.name || programCoachAnalysis?.programName || 'Programme actif',
    subtitle: planRatio != null ? `Ratio push/pull planifié ~${planRatio}` : null,
    intro: buildIntroParagraph(activeProgram, answers, exposure, pushPull, planRatio),
    legAnalysis,
    ratioCommentary: buildRatioCommentary(pushPull, planRatio, exposure, verticalPull),
    bars,
    kpiCards,
    priority: {
      title: 'Priorité structurelle',
      text: buildPriorityText(structural, pushPull, enrichment, legStructural)
    },
    statsRow: {
      pushPullRatio: pushPull?.ratio,
      pushPct: pushPull?.pushPct,
      pullPct: pushPull?.pullPct,
      pushReps: pushPull?.push,
      pullReps: pushPull?.pull,
      legReps,
      legWeeklyPlan,
      legWeeklyActual,
      legStructural,
      weeklyLoadKgReps:
        denseAnalytics?.weeklyLoad?.avgKgRepsPerWeek >= 1
          ? round1(denseAnalytics.weeklyLoad.avgKgRepsPerWeek)
          : null,
      mostRegularExercises: (denseAnalytics?.mostRegularExercises || []).slice(0, 3),
      adherencePct: enrichment?.completion?.exoPct ?? assessment?.programCompletion28?.pct,
      adherenceLabel: enrichment?.completion?.exoDetailLabel,
      runningKm: denseAnalytics?.runningPeriod?.distanceKm ?? enrichment?.digest?.perActivity?.running?.totals?.distanceKm,
      runningSessions:
        denseAnalytics?.runningPeriod?.sessions ??
        enrichment?.digest?.perActivity?.running?.totals?.sessions,
      globalPct: enrichment?.completion?.globalPct
    }
  };
}
