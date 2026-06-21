/**
 * Rapport Vision Coach structuré — KPIs, synthèse dense, sections filtrées (2025+ en 2026).
 */

import DateHelper from '../dateHelper';
import { JUSTIFICATION_REASONS } from '../dayJustificationUtils';
import { buildCoachVisionNarrative, computeGarminSleepAverage } from './recapCoachVision';
import {
  buildMonthlyCoachStats,
  findBestMonthFromMonths,
  monthLabelFr,
  relevantMonthCutoff,
  discoverSnapshotDateBounds,
  computeMonthCoachSnapshot
} from './recapCoachVisionTemporal';
import { getCompletionForWindow, compareExoCompletionWeekBlocks } from './recapCompletionTruth';
import { countTrainingDaysInRange } from './recapTrainingDayTruth';
import { resolveStreetSkillPlan } from '../../features/profileQuestionnaire/quizStreetSkillGoal';
import { normalizeProfileQuestionnaire } from '../../features/profileQuestionnaire/schema';
import { challengeProgressPct } from './recapInsightHelpers';
import { resolveRunningPeriodStats } from './runningVolumeTruth';
import { buildIntegratedCoachVisionProse } from './recapCoachVisionDenseProse';

const WEEKDAY_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

const ACCENT_MAP = {
  temporal: 'teal',
  adherence: 'cyan',
  load: 'teal',
  endurance: 'sky',
  recovery: 'indigo',
  program: 'amber'
};

function round1(n) {
  return Math.round(Number(n) * 10) / 10;
}

function formatMonthYear(mk) {
  return mk ? `${monthLabelFr(mk)} ${mk.slice(0, 4)}` : '';
}

function priorMonthKey(mk) {
  const y = parseInt(mk.slice(0, 4), 10);
  const m = parseInt(mk.slice(5, 7), 10);
  if (m <= 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, '0')}`;
}

/** Supprime insights trop anciens (ex. creux 2024 quand on est en 2026). */
function isStaleInsight(text, endYmd) {
  const t = String(text || '');
  const currentYear = parseInt(String(endYmd).slice(0, 4), 10);
  const minYear = currentYear - 1;

  if (/creux de régularité|Arc mensuel/i.test(t)) return true;

  const years = [...t.matchAll(/\b(20\d{2})\b/g)].map((m) => parseInt(m[1], 10));
  if (years.some((y) => y < minYear)) return true;

  return false;
}

function dedupeSimilar(bullets) {
  const out = [];
  bullets.forEach((b) => {
    const key = b.slice(0, 40).toLowerCase();
    if (!out.some((x) => x.slice(0, 40).toLowerCase() === key)) out.push(b);
  });
  return out;
}

function classifyParagraph(p) {
  if (/^Garmin/i.test(p)) return 'recovery';
  if (/^Charge & performance/i.test(p)) return 'load';
  if (/^« .+ » cadre|^Programme actif/i.test(p)) return 'program';
  if (/^Dynamique récente|^Micro-dynamique/i.test(p)) return 'temporal';
  return 'temporal';
}

function splitIntoBullets(paragraph) {
  return paragraph
    .replace(/^[^:]+:\s*/, '')
    .split(/\s*[·•;]\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);
}

function topDayOfWeek(dayOfWeek) {
  const trained = (dayOfWeek || []).filter((d) => d.plannedDays >= 2);
  if (!trained.length) return null;
  return {
    best: [...trained].sort((a, b) => b.plannedDays - a.plannedDays)[0],
    weak: [...trained].sort((a, b) => a.plannedDays - b.plannedDays)[0]
  };
}

function paragraphExists(paragraphs, pattern) {
  return paragraphs.some((p) => pattern.test(p));
}

function buildEnrichmentExtras(enrichment, assessment, snapshot, garminData, window, denseAnalytics) {
  const extras = { adherence: [], load: [], endurance: [], recovery: [] };
  const comp = enrichment?.completion;
  const just = enrichment?.justifications;
  const fb = enrichment?.feedback;
  const least = enrichment?.leastCheckedExercises?.slice(0, 2) || [];
  const dow = topDayOfWeek(enrichment?.dayOfWeek);
  const stretch = enrichment?.stretchZones;

  if (comp?.stretchPct != null && comp.exoPct != null && comp.exoPct - comp.stretchPct >= 25) {
    extras.adherence.push(`Étirements ~${comp.stretchPct} % vs exos ~${comp.exoPct} %.`);
  }

  if (just?.byReason?.[JUSTIFICATION_REASONS.MALADIE] >= 1) {
    extras.adherence.push(`${just.byReason[JUSTIFICATION_REASONS.MALADIE]} j. maladie/blessure au calendrier.`);
  }

  if (dow?.best) {
    extras.adherence.push(`Jour le plus actif : ${WEEKDAY_FR[dow.best.dow]} (${dow.best.plannedDays} séances).`);
  }

  if (least.length >= 1) {
    extras.adherence.push(`Exos à renforcer : ${least.map((e) => e.name).join(', ')}.`);
  }

  if (fb?.count >= 3 && fb.difficulte != null) {
    extras.adherence.push(`Difficulté ressentie ~${fb.difficulte}/10 (${fb.count} feedbacks).`);
  }

  const pp = enrichment?.pushPull;
  if (pp?.pushPct != null && (pp.push || 0) + (pp.pull || 0) >= 80) {
    extras.load.push(`Push/pull : ${pp.pushPct} % / ${pp.pullPct} % (${pp.push} vs ${pp.pull} reps).`);
  }

  const muscles = enrichment?.muscleShareRows?.slice(0, 2) || [];
  if (muscles.length >= 1) {
    extras.load.push(`Dominante : ${muscles.map((m) => m.groupId).join(', ')}.`);
  }

  const runStats =
    denseAnalytics?.runningPeriod || resolveRunningPeriodStats(snapshot, garminData, window);
  if (runStats.distanceKm >= 5) {
    const avgKm =
      runStats.sessions >= 1 ? round1(runStats.distanceKm / runStats.sessions) : null;
    extras.endurance.push(
      `${round1(runStats.distanceKm)} km · ${runStats.sessions} sortie(s)${avgKm != null ? ` (~${avgKm} km/sortie)` : ''}.`
    );
  }

  const completed = (enrichment?.digest?.challenges || []).filter((c) => c?.status === 'completed');
  if (completed.length >= 1) {
    extras.endurance.push(`${completed.length} défi(s) validé(s).`);
  }

  return extras;
}

function buildLead({
  periodComp,
  bestMonth,
  currentMk,
  streak,
  enrichment,
  answers,
  endYmd,
  trainingDaysInPeriod
}) {
  const parts = [];
  const street = resolveStreetSkillPlan(answers || {});

  if (periodComp?.exoPct != null) {
    parts.push(
      periodComp.exoPct >= 80
        ? `adhérence solide (~${periodComp.exoPct} % des exos cochés)`
        : `complétion exos ~${periodComp.exoPct} %`
    );
  }

  if (bestMonth?.monthKey === currentMk) {
    parts.push(`${formatMonthYear(currentMk)} est ton meilleur mois récent (${bestMonth.trainedDays} j.)`);
  } else if (bestMonth) {
    parts.push(`meilleur mois récent : ${formatMonthYear(bestMonth.monthKey)} (${bestMonth.trainedDays} j.)`);
  }

  if ((streak?.current ?? 0) >= 3) {
    parts.push(`série de ${streak.current} j.${streak.longest ? ` (record ${streak.longest} j.)` : ''}`);
  }

  const km = enrichment?.digest?.perActivity?.running?.totals?.distanceKm;
  if (km >= 8) parts.push(`${round1(km)} km de course sur la période`);

  if (street.labelFr) parts.push(`cap « ${street.labelFr} »`);

  if (trainingDaysInPeriod >= 5 && !parts.some((p) => /j\./.test(p))) {
    parts.push(`${trainingDaysInPeriod} j. d'activité enregistrés`);
  }

  if (!parts.length) return null;
  const year = endYmd.slice(0, 4);
  return `En ${year}, ${parts.join(' · ')}.`;
}

function buildDenseVisionParagraphs(opts) {
  const {
    text,
    snapshot,
    endYmd,
    windowStart,
    ctx,
    garminData,
    garminPartial,
    periodComp,
    enrichment,
    assessment,
    activeProgram,
    trainingDaysInPeriod,
    ytdTrainingDays
  } = opts;

  const paragraphs = text
    .split('\n\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !isStaleInsight(p, endYmd));

  const currentYear = parseInt(endYmd.slice(0, 4), 10);
  const bounds = discoverSnapshotDateBounds(snapshot);
  const histStartYear = bounds?.start ? parseInt(bounds.start.slice(0, 4), 10) : currentYear;

  if (ytdTrainingDays >= 1 && !paragraphExists(paragraphs, /cumule|d'entraînement enregistr|j\. d'activité/i)) {
    let line = `${currentYear} : ${ytdTrainingDays} j. d'entraînement enregistrés (muscu, endurance, circuits ou activité Garmin hors marche)`;
    if (histStartYear >= currentYear - 1) {
      line += ` · historique ${currentYear - 1} encore limité dans Momentum`;
    }
    paragraphs.unshift(`${line}.`);
  }

  if (
    periodComp?.exoPct != null &&
    !paragraphExists(paragraphs, /complétion exos|exos cochés|exos sur les jours/i)
  ) {
    let line = `Complétion sur les jours entraînés : ~${periodComp.exoPct} % exos`;
    if (periodComp.exoCheckedPerDay != null && periodComp.exoPlannedPerDay != null) {
      line += ` (~${periodComp.exoCheckedPerDay}/${periodComp.exoPlannedPerDay}/j · ${periodComp.exoChecked}/${periodComp.exoTotal})`;
    }
    if (periodComp.globalPct != null && periodComp.globalPct < periodComp.exoPct - 10) {
      line += `. Score programme complet ~${periodComp.globalPct} % (étirements rarement cochés).`;
    } else {
      line += '.';
    }
    paragraphs.push(line);
  }

  const weekCmp = compareExoCompletionWeekBlocks(snapshot, endYmd, windowStart, ctx);
  if (weekCmp && !paragraphExists(paragraphs, /semaine.*%|Semaine récente/i)) {
    paragraphs.push(
      `Semaine récente : ~${weekCmp.recentPct} % complétion exos vs ~${weekCmp.priorPct} % la semaine précédente.`
    );
  }

  const streak = enrichment?.streak;
  if (streak?.current >= 3 && !paragraphExists(paragraphs, /série.*j\./i)) {
    paragraphs.push(
      `Série en cours : ${streak.current} j.${streak.longest ? ` (record ${streak.longest} j.)` : ''}.`
    );
  }

  const pp = enrichment?.pushPull;
  if (pp?.ratio != null && (pp.push || 0) + (pp.pull || 0) >= 100 && !paragraphExists(paragraphs, /push.*pull|68\.|push\/pull/i)) {
    paragraphs.push(
      `Répartition cochée ~${pp.pushPct} % push / ${pp.pullPct} % pull (${pp.push} vs ${pp.pull} reps, ratio ${pp.ratio}).`
    );
  }

  const mom = assessment?.repsMomentumRatio;
  if (mom != null && (mom >= 1.1 || mom <= 0.9) && !paragraphExists(paragraphs, /volume street|quinzaine/i)) {
    paragraphs.push(
      mom >= 1.1
        ? `Volume street +${Math.round((mom - 1) * 100)} % vs la quinzaine précédente.`
        : `Volume street en retrait (~${Math.round((1 - mom) * 100)} % vs la quinzaine précédente).`
    );
  }

  const sleepStart = windowStart || DateHelper.addDays(endYmd, -27);
  const sleepWnd = computeGarminSleepAverage(garminPartial, sleepStart, endYmd);
  if (sleepWnd?.avgHours != null && sleepWnd.sampleDays >= 3 && !paragraphExists(paragraphs, /sommeil/i)) {
    paragraphs.push(
      `Garmin sommeil : ~${sleepWnd.avgHours.toFixed(1)} h/j (${sleepWnd.sampleDays} nuit${sleepWnd.sampleDays > 1 ? 's' : ''} mesurée${sleepWnd.sampleDays > 1 ? 's' : ''}).`
    );
  }

  if (periodComp?.stretchPct != null && periodComp.exoPct != null && periodComp.exoPct - periodComp.stretchPct >= 15) {
    if (!paragraphExists(paragraphs, /étirement/i)) {
      paragraphs.push(
        `Étirements ~${periodComp.stretchPct} % vs exos ~${periodComp.exoPct} % — le gap mobilité peut freiner la récup si le volume monte.`
      );
    }
  }

  const stretchZone = enrichment?.stretchZones?.rows?.[0];
  if (stretchZone && !paragraphs.some((p) => p.includes(stretchZone.zone))) {
    paragraphs.push(`Zone d'étirement la plus cochée : ${stretchZone.zone} (${stretchZone.count}×).`);
  }

  const currentMk = endYmd.slice(0, 7);
  const priorMk = priorMonthKey(currentMk);
  const currentMonth = computeMonthCoachSnapshot(snapshot, currentMk, endYmd, ctx, garminData);
  const priorMonth = computeMonthCoachSnapshot(
    snapshot,
    priorMk,
    `${priorMk}-${String(new Date(parseInt(priorMk.slice(0, 4), 10), parseInt(priorMk.slice(5, 7), 10), 0).getDate()).padStart(2, '0')}`,
    ctx,
    garminData
  );
  if (
    currentMonth &&
    priorMonth &&
    priorMonth.trainedDays >= 2 &&
    !paragraphExists(paragraphs, /vs.*mois|progression nette/i)
  ) {
    paragraphs.push(
      `${monthLabelFr(currentMk)} ${currentYear} (${currentMonth.calendarDays} j. écoulés) : ${currentMonth.trainedDays} j. entraînés` +
        (currentMonth.exoPct != null ? `, ~${currentMonth.exoPct} % exos` : '') +
        (currentMonth.runningKm >= 5 ? `, ~${round1(currentMonth.runningKm)} km course` : '') +
        ` vs ${monthLabelFr(priorMk)} (${priorMonth.trainedDays} j.` +
        (priorMonth.exoPct != null ? `, ~${priorMonth.exoPct} % exos` : '') +
        (priorMonth.runningKm >= 5 ? `, ~${round1(priorMonth.runningKm)} km` : '') +
        ').'
    );
  }

  if (activeProgram?.name && !paragraphExists(paragraphs, /cadre la suite|Programme actif/i)) {
    const street = resolveStreetSkillPlan(normalizeProfileQuestionnaire(opts.profileQuestionnaireRaw).answers || {});
    let fwd = `« ${activeProgram.name} » cadre la suite`;
    if (street.labelFr) fwd += ` avec « ${street.labelFr} » comme fil rouge`;
    const load = assessment?.sessionLoadAlignment28;
    if (load?.avgScore0to100 != null && load.avgScore0to100 < 60) {
      fwd += ' — priorité court terme : exécuter le plan tel qu’écrit plutôt que d’ajouter du volume.';
    } else {
      fwd += ' — l’enjeu est surtout de tenir ce rythme sans brûler la régularité.';
    }
    paragraphs.push(`${fwd}`);
  }

  if (trainingDaysInPeriod >= 1 && trainingDaysInPeriod !== ytdTrainingDays && !paragraphExists(paragraphs, /fenêtre affichée|sur la période/i)) {
    paragraphs.push(`Sur la fenêtre affichée : ${trainingDaysInPeriod} j. d'activité · ${periodComp?.exoChecked ?? '—'} exos cochés au total.`);
  }

  return dedupeSimilar(paragraphs);
}

/**
 * @returns {{ kpis, sections, lead, text, paragraphs }}
 */
export function buildCoachVisionReport(opts = {}) {
  const text = buildCoachVisionNarrative(opts);
  const {
    snapshot = {},
    window = null,
    enrichment = null,
    assessment = null,
    activeProgram = null,
    profileQuestionnaireRaw = null,
    programs = [],
    getTodayWorkout = null,
    isAdmin = false,
    isAuthenticated = false,
    garminData = null,
    garminPartial = null,
    denseAnalytics = null
  } = opts;

  const endYmd = window?.end || DateHelper.getTodayLocal();
  const windowStart = window?.start ?? null;
  const ctx = {
    programs,
    activeProgram,
    getTodayWorkout,
    isAdmin,
    isAuthenticated,
    alignWithCalendar: true
  };
  const answers = normalizeProfileQuestionnaire(profileQuestionnaireRaw).answers || {};
  const periodComp =
    enrichment?.completion || getCompletionForWindow(snapshot, { start: windowStart, end: endYmd }, ctx);

  const effectiveStart =
    windowStart ?? discoverSnapshotDateBounds(snapshot)?.start ?? DateHelper.addDays(endYmd, -365);
  const trainingDaysInPeriod = countTrainingDaysInRange(snapshot, effectiveStart, endYmd, garminData);
  const ytdTrainingDays = countTrainingDaysInRange(
    snapshot,
    `${endYmd.slice(0, 4)}-01-01`,
    endYmd,
    garminData
  );

  const months = buildMonthlyCoachStats(snapshot, endYmd, ctx, {
    windowStart,
    garminData,
    minMonthKey: relevantMonthCutoff(endYmd, 1)
  });
  const bestMonth = findBestMonthFromMonths(months);
  const currentMk = endYmd.slice(0, 7);

  const grouped = {
    temporal: [],
    adherence: [],
    load: [],
    endurance: [],
    recovery: [],
    program: []
  };

  text.split('\n\n').forEach((para) => {
    if (isStaleInsight(para, endYmd)) return;
    const bucket = classifyParagraph(para);
    const body = para.replace(/^[^:]+:\s*/, '').trim() || para;
    const bullets = body.includes('·') || body.includes(';') ? splitIntoBullets(para) : [body];
    bullets.forEach((b) => {
      const line = b.replace(/\.$/, '');
      if (!isStaleInsight(line, endYmd)) grouped[bucket].push(line);
    });
  });

  const extras = buildEnrichmentExtras(
    enrichment,
    assessment,
    snapshot,
    garminData,
    window,
    denseAnalytics
  );
  Object.keys(extras).forEach((k) => {
    extras[k].forEach((line) => {
      if (!grouped[k].some((x) => x.includes(line.slice(0, 20)))) grouped[k].push(line);
    });
  });

  const sectionMeta = {
    temporal: { title: 'Évolution récente' },
    adherence: { title: 'Calendrier & cohérence' },
    load: { title: 'Charge & muscles' },
    endurance: { title: 'Cardio & défis' },
    recovery: { title: 'Récupération' },
    program: { title: 'Priorité maintenant' }
  };

  const sections = ['temporal', 'adherence', 'load', 'endurance', 'recovery', 'program']
    .map((id) => {
      let bullets = dedupeSimilar(grouped[id]).filter((b) => !isStaleInsight(b, endYmd));

      if (id === 'program') {
        const street = resolveStreetSkillPlan(answers);
        if (street.labelFr && !bullets.some((b) => b.includes(street.labelFr))) {
          bullets.unshift(`Objectif : ${street.labelFr}.`);
        }
        const load = assessment?.sessionLoadAlignment28;
        if (load?.avgScore0to100 != null && load.avgScore0to100 < 60) {
          bullets.push('Exécuter le plan tel qu’écrit — pas de volume en plus.');
        } else if ((periodComp?.exoPct ?? 0) >= 85) {
          bullets.push('Consolider avant d’ajouter une contrainte.');
        } else {
          bullets.push('Tenir le rythme sans brûler la régularité.');
        }
      }

      bullets = bullets.slice(0, id === 'program' ? 3 : 2);
      if (!bullets.length) return null;

      return {
        id,
        title: sectionMeta[id].title,
        accent: ACCENT_MAP[id],
        summary: id === 'program' && activeProgram?.name ? activeProgram.name : undefined,
        bullets
      };
    })
    .filter(Boolean);

  const kpis = [];
  if (periodComp?.exoPct != null) {
    kpis.push({
      id: 'exo',
      label: 'Exos',
      value: `${periodComp.exoPct} %`,
      note: periodComp.exoChecked != null ? `${periodComp.exoChecked}/${periodComp.exoTotal}` : undefined,
      accent: 'teal'
    });
  }
  if (trainingDaysInPeriod >= 1) {
    kpis.push({
      id: 'days',
      label: 'Jours',
      value: String(trainingDaysInPeriod),
      note: 'activité',
      accent: 'cyan'
    });
  }
  const streak = enrichment?.streak;
  if (streak?.current >= 2) {
    kpis.push({
      id: 'streak',
      label: 'Série',
      value: `${streak.current} j.`,
      note: streak.longest ? `rec. ${streak.longest} j.` : undefined,
      accent: 'violet'
    });
  }
  const runStats =
    denseAnalytics?.runningPeriod || resolveRunningPeriodStats(snapshot, garminData, window);
  if (runStats.distanceKm >= 1) {
    kpis.push({
      id: 'run',
      label: 'Course',
      value: `${round1(runStats.distanceKm)} km`,
      note: runStats.sessions >= 1 ? `${runStats.sessions} sortie${runStats.sessions > 1 ? 's' : ''}` : undefined,
      accent: 'sky'
    });
  }
  const wLoad = denseAnalytics?.weeklyLoad?.avgKgRepsPerWeek;
  if (wLoad >= 100) {
    kpis.push({
      id: 'load',
      label: 'Charge',
      value: `~${Math.round(wLoad).toLocaleString('fr-FR')}`,
      note: 'kg×reps/sem',
      accent: 'amber'
    });
  }
  const legReps = denseAnalytics?.legReps;
  if (legReps >= 50 && kpis.length < 5) {
    kpis.push({
      id: 'legs',
      label: 'Jambes',
      value: String(Math.round(legReps)),
      note: 'reps',
      accent: 'lime'
    });
  }

  const integratedProse = buildIntegratedCoachVisionProse({
    snapshot,
    window,
    enrichment,
    assessment,
    denseAnalytics,
    garminPartial,
    garminData,
    activeProgram,
    profileQuestionnaireRaw,
    getExerciseNameById: opts.getExerciseNameById,
    programs,
    getTodayWorkout,
    isAdmin,
    isAuthenticated,
    trainingDaysInPeriod,
    periodComp
  });

  const paragraphs =
    integratedProse.paragraphs.length > 0
      ? integratedProse.paragraphs
      : buildDenseVisionParagraphs({
          text,
          snapshot,
          endYmd,
          windowStart,
          ctx,
          garminData,
          garminPartial,
          periodComp,
          enrichment,
          assessment,
          activeProgram,
          profileQuestionnaireRaw,
          trainingDaysInPeriod,
          ytdTrainingDays
        });

  const lead = integratedProse.lead || buildLead({
    periodComp,
    bestMonth,
    currentMk,
    streak: enrichment?.streak,
    enrichment,
    answers,
    endYmd,
    trainingDaysInPeriod
  });

  return { kpis: kpis.slice(0, 5), sections, lead, text, paragraphs };
}
