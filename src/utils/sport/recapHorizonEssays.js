/**
 * Lectures de coach : plusieurs analyses courtes par horizon, pas un paragraphe unique.
 * Données → observation → comparaison → relation → interprétation (hypothèse prudente).
 */

import { getCompletionForWindow } from './recapCompletionTruth';
import {
  deriveExposureWindows,
  summarizeExposure,
  muscleProfile,
  classifyExerciseShifts,
  weeklyRate,
  movementFamily
} from './recapExposureNarratives';
import { classifyMovement } from './recapMovementClassification';
import {
  buildExerciseTimeline,
  findSpecificAbsences,
  formatDayFr,
  isCardioLikeName
} from './recapTrainingTimeline';
import {
  buildAthleteTrainingIdentity,
  formatRateFr,
  identityCanClaimUnusual,
  identityFrequencyStatus
} from './athleteTrainingIdentity';

function sampleDays(window) {
  if (!window?.end) return 30;
  if (!window.start) return 90;
  const a = new Date(`${window.start}T12:00:00`);
  const b = new Date(`${window.end}T12:00:00`);
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

export function confidenceFromSample(sessions, days) {
  if (sessions >= 20 || days >= 80) return { label: 'élevée', score: 0.88 };
  if (sessions >= 10 || days >= 25) return { label: 'modérée à élevée', score: 0.78 };
  if (sessions >= 4 || days >= 7) return { label: 'modérée', score: 0.66 };
  return { label: 'faible — échantillon limité', score: 0.5 };
}

function fmtList(names, max = 3) {
  const slice = (names || []).filter(Boolean).slice(0, max);
  if (!slice.length) return '';
  if (slice.length === 1) return slice[0];
  return `${slice.slice(0, -1).join(', ')} et ${slice[slice.length - 1]}`;
}

function polish(s) {
  return String(s || '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ *\n */g, '\n')
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/\.{2,}/g, '.')
    .trim()
    .replace(/\.+$/, '.');
}

function identityBandPhrase(identity) {
  const f = identity?.frequency;
  if (!f) return '';
  return `${formatRateFr(f.bandLow)}–${formatRateFr(f.bandHigh)} séances/sem.`;
}

function identityFreqParagraph(identity) {
  if (!identity?.ready) return '';
  const f = identity.frequency;
  const band = identityBandPhrase(identity);
  const mean = formatRateFr(f.meanPerWeek);
  const cur = formatRateFr(f.currentPerWeek);
  if (f.status === 'inside') {
    return ` Ton rythme habituel se situe autour de ${mean} séances par semaine (souvent ${band}). ${cur} reste dans cette variabilité : ce n'est pas un changement de profil.`;
  }
  if (identityCanClaimUnusual(identity) && f.status === 'low') {
    return ` Habituellement tu es plutôt à ${mean} séances par semaine (souvent ${band}, ±${formatRateFr(f.stdPerWeek)}). ${cur} sort de cette plage : ce n'est plus seulement « un peu moins que le mois d'avant », c'est inhabituel pour toi.`;
  }
  if (identityCanClaimUnusual(identity) && f.status === 'high') {
    return ` Tu es au-dessus de ton rythme habituel (${mean}/sem., souvent ${band}) : ${cur} est chargé par rapport à ce que tu fais généralement.`;
  }
  return '';
}

function identityGapParagraph(q) {
  if (!q?.unusualGap) return '';
  return ` Pour ${q.name}, tu reviens d'habitude tous les ${formatRateFr(q.medianIntervalDays)} jours environ (rarement au-delà de ${Math.round(q.p80IntervalDays)}). ${q.currentGapDays} jours sans ${q.name}, pendant que le reste continue, dépasse largement cet intervalle : ça ressemble davantage à une qualité délaissée qu'à une simple semaine un peu plus large.`;
}

function identityPerfParagraph(q) {
  if (!q?.unusualPerf) return '';
  return ` Sur ${q.name}, tu vis plutôt autour de ${Math.round(q.habitRepsMean)} reps (±${formatRateFr(q.habitRepsStd)}). ${q.lastReps} sort de cette plage habituelle.`;
}

function matchingIdentityQuality(identity, name) {
  const n = String(name || '').toLowerCase();
  return (identity?.qualities || []).find((q) => {
    if (q.key === 'run' && isCardioLikeName(name)) return true;
    if (q.key === 'pullup' && /traction|pull|australien/i.test(n)) return true;
    if (q.key === 'pushup' && /pompe|push-up|pushup/i.test(n)) return true;
    if (q.key === 'dip' && /dip/i.test(n)) return true;
    return n.includes(String(q.name || ''));
  }) || null;
}

/** Ignore les % aberrants (fenêtre précédente trop vide, ex. +703 %). */
export function plausiblePct(n, maxAbs = 160) {
  if (n == null || !Number.isFinite(n)) return null;
  if (Math.abs(n) > maxAbs) return null;
  return n;
}

function pctPhrase(n) {
  const v = plausiblePct(n);
  if (v == null) return null;
  const abs = Math.abs(Math.round(v));
  if (v > 0) return `environ ${abs} % de plus`;
  if (v < 0) return `environ ${abs} % de moins`;
  return 'à peu près au même niveau';
}

function halfWords(pct) {
  if (pct == null) return null;
  if (pct < 35) return 'largement moins de la moitié';
  if (pct < 48) return 'un peu moins de la moitié';
  if (pct <= 58) return 'un peu plus de la moitié';
  if (pct <= 75) return 'une bonne partie';
  return 'la majeure partie';
}

function pushVariantCount(summary, getExerciseNameById) {
  const ids = new Set();
  (summary?.exercises || []).forEach((e) => {
    if (movementFamily(e.id, e.name, getExerciseNameById) === 'pushup') ids.add(e.id);
  });
  return ids.size;
}

function muscleShare(profile, labelPart) {
  return (profile?.muscles || []).find((m) => String(m.label || '').includes(labelPart));
}

function themeSeenCount(history, kind) {
  return (history?.entries || []).filter((e) => String(e.id || e.theme || '').includes(kind)).reduce(
    (n, e) => n + (e.count || 1),
    0
  );
}

function goalPushConsequence(goal) {
  if (goal === 'street_skills') {
    return "Pour un objectif street / tractions, ça laisse relativement peu d'exposition au tirage : ce n'est pas anodin.";
  }
  if (goal === 'muscular_defined') {
    return "Pour une hypertrophie ou une définition générales, ce déséquilibre pèse davantage que la baisse de volume total : tu n'exposes plus les mêmes qualités.";
  }
  if (goal === 'strength_lean') {
    return 'Pour un objectif de force sèche, concentrer le travail restant sur la poussée peut être voulu — encore faut-il que le tirage de référence tienne.';
  }
  return "Ce n'est donc pas seulement « moins de sport » : tu continues surtout ce que tu fais déjà, et tu laisses d'autres qualités de côté.";
}

function splitPullFamily(summary, getExerciseNameById) {
  const vert = [];
  const acc = [];
  (summary?.exercises || []).forEach((e) => {
    const cls = classifyMovement({ id: e.id, name: e.name }, getExerciseNameById);
    if (cls.isPullup) vert.push(e);
    else if (cls.isPull) acc.push(e);
  });
  return { vert, acc };
}

function pickCardioAbsence(absences, least) {
  const cardioAbs = (absences || []).filter((a) => isCardioLikeName(a.name));
  const prefer =
    cardioAbs.find((a) => /endurance fondamentale|\bcourse\b/i.test(a.name) && !/fractionn/i.test(a.name)) ||
    cardioAbs[0];
  if (prefer) return prefer;
  const fromLeast = (least || []).find((n) => isCardioLikeName(n));
  if (!fromLeast) return null;
  return { name: fromLeast, daysSince: null, sessionsSince: 0, lastDate: null };
}

function dedupeEstablished(rows) {
  const seen = new Set();
  const out = [];
  (rows || []).forEach((r) => {
    const k = String(r.exerciseName || r.exerciseId || '');
    if (!k || seen.has(k)) return;
    seen.add(k);
    out.push(r);
  });
  return out;
}

function reading({ horizon, kind, title, body, evidence = '', relevance, conf, days, extra = {} }) {
  return {
    id: `relation.reading.${horizon}.${kind}`,
    type: 'coach_reading',
    pillar: 'interpretation',
    horizon,
    state: 'composed',
    evidence: extra.evidence || [],
    metrics: extra.metrics || {},
    confidence: conf.score,
    relevance,
    novelty: 0.86,
    actionability: 0.72,
    severity: extra.severity ?? 0.28,
    context: {
      title,
      body: polish(body),
      evidenceLine: evidence,
      kind,
      confidenceLabel: extra.showConfidence ? conf.label : null,
      sampleDays: extra.showConfidence ? days : null
    }
  };
}

/**
 * @returns {import('./trainingRelationEngine.js').InterpretationCandidate[]}
 */
export function buildHorizonEssayCandidates(opts = {}) {
  const {
    snapshot = {},
    window = null,
    period = '30d',
    getExerciseNameById = null,
    garminData = null,
    trainingState = null,
    enrichment = null,
    assessment = null,
    programs = null,
    activeProgram = null,
    performanceRobustness = [],
    trainingEvents = [],
    insightHistory = null,
    athleteIdentity = null
  } = opts;

  const wins = deriveExposureWindows(period, window);
  if (!wins) return [];

  const identity =
    athleteIdentity ||
    buildAthleteTrainingIdentity({ snapshot, window, getExerciseNameById });

  const current = summarizeExposure(snapshot, wins.current, getExerciseNameById, garminData);
  const habit = summarizeExposure(snapshot, wins.habit, getExerciseNameById, garminData);
  const longTerm = summarizeExposure(snapshot, wins.longTerm, getExerciseNameById, garminData);
  const days = sampleDays(window);
  const conf = confidenceFromSample(current.sessions || longTerm.sessions, days);
  const longConf = confidenceFromSample(longTerm.sessions, 90);

  const currP = muscleProfile(current);
  const habitP = muscleProfile(habit);
  const longP = muscleProfile(longTerm);
  const shifts = classifyExerciseShifts(current, habit, getExerciseNameById);
  const longShifts = classifyExerciseShifts(longTerm, habit, getExerciseNameById);

  const completion = getCompletionForWindow(snapshot, wins.current, {
    programs: programs || [],
    activeProgram: activeProgram || null
  });
  const planned = completion?.plannedDays ?? null;
  const started = completion?.activeTrainingDays ?? current.sessions;
  const finished = completion?.daysFullyComplete ?? null;
  const partial = completion?.daysPartial ?? null;
  const missed = planned != null && started != null ? Math.max(0, planned - started) : null;
  const programPct =
    assessment?.programCompletion28?.ratio != null
      ? Math.round(assessment.programCompletion28.ratio * 100)
      : completion?.exoPct != null
        ? Math.round(completion.exoPct)
        : trainingState?.features?.programCompletionPct ?? null;

  const f = trainingState?.features || {};
  const d7 = plausiblePct(f.volumeDelta7Pct, 140);
  const d28 = plausiblePct(f.volumeDelta28Pct, 140);
  const d90 = plausiblePct(f.volumeDelta90Pct, 140);
  const freqDelta = plausiblePct(f.frequencyDeltaPct, 140);
  const mom = plausiblePct(f.performanceMomentumPct, 140);
  const alignment = f.sessionAlignment;
  const efficiency = f.progressionEfficiency;
  const currRate = weeklyRate(current.sessions, wins.currentLen);
  const habitRate = weeklyRate(habit.sessions, wins.habitLen);
  const longRate = weeklyRate(longTerm.sessions, 90);
  const least = (enrichment?.leastCheckedExercises || []).slice(0, 3).map((x) => x.name).filter(Boolean);
  const pushPct = f.pushPct ?? currP.pushPct;
  const pullPct = f.pullPct ?? currP.pullPct;
  const ratioEnr = f.pushPullRatio ?? currP.ratio;
  const ratioThen = habitP.ratio;
  const endYmd = window?.end;
  const timeline = buildExerciseTimeline(snapshot, getExerciseNameById);
  const absences = findSpecificAbsences(timeline, endYmd, { minGap: 8, minSessionsSince: 3 });
  const cardioGone = pickCardioAbsence(absences, least);
  const established = dedupeEstablished(
    (performanceRobustness || []).filter((r) => r.kind === 'LEVEL_ESTABLISHED')
  );
  const prEvents = (trainingEvents || []).filter((e) => e.type === 'pr_reps').slice(0, 3);
  const pullFam = splitPullFamily(current, getExerciseNameById);
  const pushSeen = themeSeenCount(insightHistory, 'push_share');
  const goal = trainingState?.context?.goal;
  const idStatus = identityFrequencyStatus(identity);
  const idFreqNote = identityFreqParagraph(identity);
  const unusualGapQ = (identity?.unusualQualities || []).find((q) => q.unusualGap) || null;
  const unusualPerfQ = (identity?.unusualQualities || []).find((q) => q.unusualPerf) || null;
  const fatigueUnknown = !trainingState?.fatigue?.value || trainingState.fatigue.value === 'unknown'
    || (trainingState.fatigue.confidence != null && trainingState.fatigue.confidence < 0.45);
  const loadFalling = trainingState?.load?.trend === 'falling';
  const perfFalling = trainingState?.performance?.trend === 'falling';
  const risingNames = shifts.rising.map((e) => e.name);
  const out = [];

  const short = (kind, title, body, evidence, relevance, extra) =>
    out.push(reading({ horizon: 'short', kind, title, body, evidence, relevance, conf, days, extra }));
  const medium = (kind, title, body, evidence, relevance, extra) =>
    out.push(reading({ horizon: 'medium', kind, title, body, evidence, relevance, conf, days, extra }));
  const long = (kind, title, body, evidence, relevance, extra) =>
    out.push(reading({ horizon: 'long', kind, title, body, evidence, relevance, conf: longConf, days: 90, extra }));

  // ——— COURT TERME : ce qui vient de changer ———
  if (current.sessions + habit.sessions >= 1) {
    const denser =
      current.avgExercisesPerSession &&
      habit.avgExercisesPerSession &&
      current.avgExercisesPerSession >= habit.avgExercisesPerSession - 0.25;
    let continuityTitle = "Tu t'entraînes moins souvent, mais pas moins longtemps quand tu t'y mets";
    if (identity?.ready && idStatus === 'inside') {
      continuityTitle = 'Ton rythme actuel reste dans ta variabilité habituelle';
    } else if (identityCanClaimUnusual(identity) && idStatus === 'low') {
      continuityTitle = "Tu sors de ton rythme habituel, pas seulement du mois d'avant";
    }
    short(
      'continuity',
      continuityTitle,
      [
        `Tu es passé d'environ ${habitRate} à ${currRate} séances par semaine`,
        freqDelta != null ? ` (${pctPhrase(freqDelta)} sur ~28 jours)` : '',
        '. ',
        denser
          ? identity?.ready && idStatus === 'inside'
            ? `Quand une séance a lieu, elle reste dans le même ordre de grandeur qu'avant (environ ${current.avgExercisesPerSession} exercices contre ${habit.avgExercisesPerSession}).`
            : `En revanche, quand une séance a lieu, elle reste proche de ton habitude : environ ${current.avgExercisesPerSession} exercices contre ${habit.avgExercisesPerSession} auparavant. Tu n'as donc pas « allégé » tes entraînements : tu en as simplement fait moins. C'est un changement de comportement, pas une preuve que tu es devenu incapable de tenir une séance dense.`
          : current.avgExercisesPerSession
            ? `Tes séances sont aussi un peu moins chargées (${current.avgExercisesPerSession} exercices contre ${habit.avgExercisesPerSession || '—'} auparavant). Ici, fréquence et contenu baissent ensemble : il faudra regarder si c'est voulu ou si les séances sont coupées.`
            : 'Le rythme des séances a changé ; la densité par séance n’est pas assez claire pour en dire plus.',
        idFreqNote,
        '\n\n',
        denser
          ? identity?.ready && idStatus === 'inside'
            ? `Pas besoin d'en faire un signal de rupture : le premier levier, s'il y en a un, c'est de rester dans cette plage, pas de « corriger » un rythme qui est déjà le tien.`
            : `Conséquence : une partie du volume perdu vient du calendrier (jours sans séance), pas d'une séance plus pauvre. Tant que cette densité tient, le premier levier pour remonter le volume, c'est de revenir plus souvent — pas d'empiler encore des exercices le jour où tu t'entraînes.`
          : 'À surveiller : si les séances continuent de s’alléger en plus d’être plus rares, le signal devient plus sérieux qu’une simple baisse de fréquence.'
      ].join(''),
      `${started} séance${started > 1 ? 's' : ''} · ${currRate}/sem. · ${habitRate}/sem. avant${
        identity?.ready ? ` · habitude ${formatRateFr(identity.frequency.meanPerWeek)}` : ''
      }`,
      identity?.ready && idStatus === 'inside' ? 0.93 : 0.97
    );
  }

  if (d7 != null || d28 != null) {
    let body;
    if (d28 != null && d28 < -12 && d7 != null && d7 > 4) {
      body = `Sur un mois comparable (28 jours contre 28 jours), tu as fait ${pctPhrase(d28)} de volume que sur le mois d'avant. Les 7 derniers jours repartent pourtant à ${pctPhrase(d7)} par rapport à la semaine précédente. Ces deux fenêtres ne se contredisent pas : le mois reste creux, mais la contraction ne s'accélère plus — le rythme le plus récent ressemble à une stabilisation, voire à un début de reprise.\n\nCe n'est pas encore une reconstruction confirmée. Une seule semaine plus chargée peut être un rattrapage, un week-end plus libre, ou le début d'un vrai retour. À surveiller : si la semaine suivante reste au-dessus du creux du mois, le signal de reprise se solidifie ; si elle retombe, le +${Math.round(d7)} % n'était qu'un à-coup.`;
    } else if (d28 != null && d28 < -12 && d7 != null && d7 < -8) {
      body = `Le volume est en retrait sur le mois (${pctPhrase(d28)}) et les 7 derniers jours ne corrigent pas encore la tendance (${pctPhrase(d7)}). Ici, la baisse n'est pas qu'une photo du mois : elle se prolonge encore sur la semaine récente.\n\nÇa mérite plus d'attention qu'un mois creux suivi d'une semaine qui remonte. Tant que le rythme court reste orienté à la baisse, il est trop tôt pour parler de simple « creux déjà derrière toi ».`;
    } else if (d28 != null) {
      body = `Ton volume des 28 derniers jours est ${pctPhrase(d28)} que sur les 28 jours d'avant${d7 != null ? `, tandis que la dernière semaine est ${pctPhrase(d7)}` : ''}. Il faut lire ces deux fenêtres ensemble : un mois creux et une semaine qui remonte (ou l'inverse) ne racontent pas la même histoire.\n\nLa comparaison 28 j. vs 28 j. décrit la tendance de fond. Les 7 jours disent seulement si cette tendance est encore en train de s'écrire. Ni l'une ni l'autre ne dit, à elle seule, si tu perds de la capacité.`;
    } else {
      body = `Sur 7 jours, ton volume est ${pctPhrase(d7)} que la semaine précédente. C'est trop court pour un verdict de mois, mais ça dit déjà si le rythme récent accélère ou ralentit. Avec si peu de jours, une ou deux séances suffisent à faire bouger le pourcentage : on le note, on ne le transforme pas en conclusion de cycle.`;
    }
    if (idFreqNote) {
      body += `\n\n${idFreqNote.trim()}`;
    }
    short(
      'volume_traj',
      'Le volume du mois et celui de la semaine ne racontent pas la même chose',
      body,
      [d28 != null ? `28 j. ${d28 > 0 ? '+' : ''}${Math.round(d28)} %` : null, d7 != null ? `7 j. ${d7 > 0 ? '+' : ''}${Math.round(d7)} %` : null]
        .filter(Boolean)
        .join(' · '),
      0.96
    );
  }

  if (programPct != null) {
    const half = halfWords(programPct);
    const startBit =
      started != null && planned != null
        ? `Tu as commencé ${started} séance${started > 1 ? 's' : ''} alors que ${planned} jour${planned > 1 ? 's' : ''} avaient du contenu prévu`
        : `Tu n'as fait qu'${half} de ce qui était prévu`;
    const missBit =
      missed > 0 && denserLike(started, finished, partial)
        ? `. Le trou vient surtout des jours non commencés (${missed}), plus que d'un effondrement de chaque séance`
        : finished != null && started > 0
          ? `. Parmi les séances commencées, ${finished} vont au bout${partial ? ` et ${partial} restent partielles` : ''}`
          : '';
    const skipBit = least.length
      ? `. Les mêmes blocs reviennent souvent dans ce qui n'est pas fait : ${fmtList(least)}. Ce n'est pas un abandon uniforme : tu sélectionnes. Hypothèse à vérifier — pas une certitude : leur place dans la séance ou dans la semaine les rend peut-être trop faciles à sacrifier.`
      : '.';
    const alignBit =
      alignment != null && alignment < 45
        ? ` L'alignement avec le contenu prévu reste bas (~${Math.round(alignment)}/100) : quand tu t'entraînes, tu ne suis pas forcément le plan dans l'ordre ou jusqu'au bout.`
        : '';
    short(
      'program',
      'Le programme est davantage laissé de côté que tes séances ne sont allégées',
      `${startBit}${missBit}. Sur la période, ça représente ${half} du plan (~${programPct} %).${skipBit}${alignBit}\n\nLe chiffre de ${programPct} % tout seul ne dit presque rien : ce qui compte, c'est la structure de ce qui manque. Des jours non commencés, ce n'est pas la même chose que des séances systématiquement coupées à la fin. Si les mêmes blocs reviennent dans les non-faits, le programme est peut-être trop chargé pour la fréquence actuelle — ou mal placé dans la semaine. Hypothèse à vérifier, pas un verdict.`,
      `~${programPct} % du plan${alignment != null ? ` · alignement ${Math.round(alignment)}/100` : ''}`,
      0.94
    );
  }

  if (cardioGone && (cardioGone.daysSince >= 8 || least.some((n) => isCardioLikeName(n)))) {
    const last = cardioGone.lastDate
      ? `Ta dernière ${/course/i.test(cardioGone.name) ? 'course' : 'séance cardio'} (${cardioGone.name}) était le ${formatDayFr(cardioGone.lastDate, true)}`
      : `${cardioGone.name} revient très peu dans tes séances récentes`;
    const gap = cardioGone.daysSince != null ? `. Cela fait ${cardioGone.daysSince} jours` : '';
    const mid =
      cardioGone.sessionsSince >= 3
        ? `, alors que tu as continué à t'entraîner (${cardioGone.sessionsSince} autres séances). Ce n'est pas un arrêt du sport : une qualité précise n'est plus exposée.`
        : `. Les autres séances continuent ; l'absence est spécifique.`;
    const goalBit =
      goal === 'street_skills'
        ? " Si l'endurance n'est pas ta priorité, ça peut rester secondaire."
        : " Si tu voulais garder de l'endurance, le sujet n'est pas le volume de musculation : c'est la place réelle de la course.";
    const gapQ = matchingIdentityQuality(identity, cardioGone.name) || (unusualGapQ?.key === 'run' ? unusualGapQ : null);
    const body = `${last}${gap}${mid}${goalBit}${identityGapParagraph(gapQ)}\n\nCe n'est pas forcément un problème en soi. Mais une qualité sans exposition ne se maintient pas indéfiniment : au-delà de deux semaines, la première séance de retour n'est plus comparable à ton meilleur niveau — c'est une reprise. Les données ne disent pas encore pourquoi elle a disparu (récupération serrée autour des jours de musculation, choix, oubli, ou séance trop proche d'un gros jour).`;
    const horizonAbs = cardioGone.daysSince >= 45 ? 'long' : 'short';
    const fn = horizonAbs === 'long' ? long : short;
    fn(
      'absence',
      'La course (ou le cardio) a glissé hors de ta routine, pas toute ton activité',
      body,
      cardioGone.lastDate
        ? `${formatDayFr(cardioGone.lastDate, true)} · ${cardioGone.daysSince} j. · ${cardioGone.sessionsSince} séances entre-temps`
        : cardioGone.name,
      cardioGone.daysSince >= 14 ? 0.95 : 0.88
    );
  } else if (absences[0] && absences[0].daysSince >= 12) {
    const a = absences[0];
    const gapQ = matchingIdentityQuality(identity, a.name) || unusualGapQ;
    short(
      'absence',
      `${a.name} est sorti de la rotation, alors que tu continues`,
      `Tu n'as plus fait ${a.name} depuis ${a.daysSince} jours (dernière fois le ${formatDayFr(a.lastDate, true)}), alors que ${a.sessionsSince} autres séances ont eu lieu. L'absence est ciblée : ce n'est pas un arrêt d'entraînement.${identityGapParagraph(gapQ)}\n\nCertaines zones ou certains mouvements sortent progressivement du calendrier pendant que d'autres restent. Si ${a.name} faisait partie de ce que tu voulais développer, le trou n'est plus un oubli d'une séance : c'est une qualité qui n'est plus dans la rotation. La prochaine fois que tu le refais, lis-le comme un retour, pas comme une régression par rapport à ton meilleur souvenir.`,
      `${formatDayFr(a.lastDate)} · ${a.daysSince} j. · ${a.sessionsSince} séances entre-temps`,
      gapQ?.unusualGap ? 0.94 : 0.88
    );
  } else if (unusualGapQ && identityCanClaimUnusual(identity)) {
    short(
      'absence',
      `${unusualGapQ.name.charAt(0).toUpperCase()}${unusualGapQ.name.slice(1)} sort de ton rythme habituel`,
      `Tu n'as plus fait ${unusualGapQ.name} depuis ${unusualGapQ.currentGapDays} jours (dernière fois le ${formatDayFr(unusualGapQ.lastDate, true)}), alors que le reste de l'entraînement continue.${identityGapParagraph(unusualGapQ)}\n\nCe n'est pas un arrêt du sport : une qualité précise n'est plus dans son intervalle habituel. La prochaine séance se lira comme une reprise, pas comme une comparaison à ton meilleur niveau récent.`,
      `${formatDayFr(unusualGapQ.lastDate, true)} · ${unusualGapQ.currentGapDays} j. · habitude ~${formatRateFr(unusualGapQ.medianIntervalDays)} j.`,
      0.93
    );
  }

  if (mom != null || risingNames.length || shifts.replacements.length || shifts.performanceDrops.length) {
    const momBit =
      mom != null && mom < -12
        ? `En moyenne, tes répétitions récentes reculent (${pctPhrase(mom)}).`
        : mom != null && mom > 8
          ? `En moyenne, tes répétitions récentes montent encore (${pctPhrase(mom)}).`
          : 'Le momentum global des répétitions ne bascule pas clairement.';
    const prBit = prEvents.length
      ? ` Dans le même temps, ${fmtList(prEvents.map((e) => e.exerciseName))} a encore marqué un meilleur niveau : ce n'est donc pas une baisse uniforme.`
      : '';
    const holdBit = risingNames.length
      ? ` Pourtant ${fmtList(risingNames)} continue${risingNames.length > 1 ? 'nt' : ''} de progresser.`
      : '';
    const varBit = shifts.replacements.length
      ? ` Sur ${fmtList(shifts.replacements.map((e) => e.name))}, la baisse de reps ressemble surtout à un changement de variante, pas à une perte de niveau.`
      : shifts.performanceDrops.length
        ? ` ${fmtList(shifts.performanceDrops.map((e) => e.name))} baissent tout en restant pratiqués : signal local, trop étroit pour une perte générale de force.`
        : '';
    short(
      'performance',
      mom != null && mom < -12
        ? 'Tes performances baissent en moyenne, mais pas partout'
        : 'Tes performances ne racontent pas la même histoire que le volume',
      `${momBit}${holdBit}${prBit}${varBit}${identityPerfParagraph(unusualPerfQ)}\n\nTu travailles moins souvent, mais sur les séries que tu fais encore, le niveau ne s'effondre pas partout. Le momentum global mélange des exercices que tu as moins touchés, des variantes que tu as remplacées, et ceux que tu suis vraiment. Pour l'instant ça ressemble davantage à moins d'exposition (et parfois à un changement de sélection) qu'à une perte générale de capacité. Une régression, ça se dirait si tes mouvements de référence reculaient alors qu'ils restent pratiqués — ce n'est pas le tableau actuel.`,
      [mom != null ? `momentum ${Math.round(mom)} %` : null, prEvents[0]?.exerciseName || risingNames[0] || null]
        .filter(Boolean)
        .join(' · '),
      0.92
    );
  }

  if ((pushPct != null && pushPct >= 60) || (ratioEnr != null && ratioEnr >= 1.6)) {
    const triNow = muscleShare(currP, 'triceps');
    const triThen = muscleShare(habitP, 'triceps');
    const shNow = muscleShare(currP, 'épaule');
    const shThen = muscleShare(habitP, 'épaule');
    const rel =
      triNow && triThen
        ? ` Tes triceps pèsent maintenant ~${triNow.sharePct} % de ton volume, contre ~${triThen.sharePct} % sur la période d'avant.`
        : '';
    const sh =
      shNow && shThen
        ? ` Les épaules passent d'environ ${shThen.sharePct} % à ${shNow.sharePct} %.`
        : '';
    const legs =
      habitP.legReps > 80 && currP.legReps < habitP.legReps * 0.65
        ? ' En parallèle, le bas du corps prend beaucoup moins de place.'
        : '';
    const persist = pushSeen >= 2
      ? ' Ce déséquilibre n’est plus un accident de semaine : il commence à s’installer dans ton historique.'
      : pushSeen >= 1
        ? ' La dominance de la poussée persiste par rapport à la dernière fois qu’on l’a regardée.'
        : '';
    short(
      'push_share',
      persist ? 'La poussée reste dominante' : 'La poussée prend de plus en plus de place',
      `Environ ${Math.round(pushPct || currP.pushPct)} % de ton volume récent vient de mouvements de poussée, contre ~${Math.round(pullPct || currP.pullPct || 0)} % de tirage${ratioEnr != null ? ` (à peu près ${ratioEnr} pour 1)` : ''}.${rel}${sh}${legs}\n\nÇa vient surtout de ce que tu continues à faire — triceps et épaules — pas d'une hausse générale du volume. Le volume restant s'est recomposé : tu n'as pas « tout baissé pareil ». ${goalPushConsequence(goal)}${persist} À surveiller : pas le pourcentage d'un muscle isolé, mais si le tirage de référence et le bas du corps restent assez exposés pour ne pas sortir de la rotation.`,
      ratioEnr != null ? `push/pull ~${ratioEnr} · ~${Math.round(pushPct)} % poussée` : `~${Math.round(pushPct)} % poussée`,
      persist ? 0.93 : 0.9
    );
  }

  const vertHold = pullFam.vert.filter((e) => e.sessions >= 2 && e.lastReps >= e.firstReps - 3);
  const accDrop = pullFam.acc.filter((e) => e.sessions <= 2);
  if (vertHold.length && (habitP.muscles.find((m) => m.label === 'dos') || accDrop.length)) {
    const estPull = established.filter((e) => /traction|australien|pull/i.test(e.exerciseName || ''));
    medium(
      'pull_hold',
      'Ton tirage vertical ne semble pas régresser',
      `${fmtList(vertHold.map((e) => e.name))} restent dans leur niveau habituel, même si tu t'entraînes moins souvent. ${estPull.length ? `Leur niveau est assez établi pour servir de référence personnelle (${fmtList(estPull.map((e) => e.exerciseName))}) : une séance un peu plus basse ne suffit pas à parler de perte de capacité. ` : ''}Si le volume de dos recule, c'est surtout moins d'accessoires ou moins de séances — pas encore une baisse claire de tes mouvements de référence.\n\nC'est la distinction utile : exposition (combien tu les travailles) contre capacité (ce que tu arrives encore à produire quand tu les fais). Tant que les tractions / variantes verticales tiennent sur les séries réalisées, « pull en baisse » décrit surtout le calendrier, pas forcément la force de tirage. À surveiller : une baisse simultanée de plusieurs mouvements de la même famille, pratiqués régulièrement.`,
      vertHold.map((e) => e.name).slice(0, 3).join(' · '),
      0.91
    );
  }

  if (fatigueUnknown && loadFalling && !(d7 != null && d7 > 8)) {
    short(
      'unknown_fatigue',
      'Fatigue : on ne peut pas encore trancher',
      `Les données ne permettent pas de distinguer une baisse de charge volontaire d'une réduction liée à la fatigue. ${trainingState?.recovery?.value === 'sufficient' ? 'Le sommeil ou la récupération mesurée ne crient pas au rouge, ce qui rend une fatigue « évidente » encore moins probable.' : 'La récupération n’est pas assez claire non plus : on n’a pas de signal robuste pour l’incriminer, ni pour l’écarter.'}\n\nPlusieurs signaux seraient nécessaires en même temps (charge qui monte, sommeil qui baisse, séances plus dures, performances de référence qui reculent alors qu'elles sont encore pratiquées). Ce n'est pas le tableau actuel. Tant que le ressenti (difficulté, énergie) reste trop mince, attribuer la baisse à la fatigue serait de la spéculation. Silence plutôt que faux diagnostic.`,
      'signal insuffisant',
      0.58
    );
  }

  // ——— MOYEN TERME : ce qui se construit ———
  if (currP.total >= 40 || habitP.total >= 40) {
    const triNow = muscleShare(currP, 'triceps');
    const shNow = muscleShare(currP, 'épaule');
    const biNow = muscleShare(currP, 'biceps');
    medium(
      'specialization',
      'Ton entraînement devient progressivement plus spécialisé',
      [
        `Sur un cycle de quelques semaines, tu consacres une part croissante du travail aux épaules et aux triceps`,
        triNow && shNow ? ` (~${shNow.sharePct} % et ~${triNow.sharePct} % du volume)` : '',
        biNow ? `, avec encore les biceps autour de ${biNow.sharePct} %` : '',
        '. ',
        ratioEnr != null && ratioThen != null
          ? `Le rapport poussée/tirage passe d'environ ${ratioThen} à ${ratioEnr}.`
          : '',
        '\n\n',
        'Ce qui se construit, ce n’est pas « plus de sport partout » : c’est une spécialisation. Certaines qualités reçoivent beaucoup plus d’exposition que d’autres, séance après séance. Ça peut être cohérent si tu priorises volontairement le haut du corps / la poussée. Ça le devient moins si tu visais un développement plus équilibré : alors le déséquilibre du mix pèse autant que la quantité totale.\n\n',
        'À ne pas confondre avec une régression générale. Une spécialisation, c’est un déplacement du travail. Le jugement utile, c’est : est-ce que les qualités laissées de côté (tirage, jambes, endurance) font encore partie de ce que tu veux garder ?'
      ].join(''),
      shareEvidence(currP),
      0.94
    );
  }

  const pushN = pushVariantCount(current, getExerciseNameById);
  if (pushN >= 4 && pushPct < 68) {
    medium(
      'redundancy',
      'Beaucoup de variantes de pompes, pas forcément plus de stimulus différent',
      `Tu as ${pushN} variantes de pompes (ou proches) dans la période. Elles pèsent lourd dans la poussée, mais beaucoup d'entre elles stimulent le même pattern : poussée horizontale au poids du corps, avec des inclinaisons différentes.\n\nEmpiler les noms d'exercices ne diversifie pas automatiquement le travail. Tu peux avoir l'impression de « varier » alors que le stimulus reste concentré. Avant d'en ajouter d'autres, il est souvent plus utile de stabiliser deux ou trois mouvements que tu répètes vraiment — c'est sur ceux-là que le niveau devient lisible.`,
      `${pushN} variantes de poussée au sol`,
      0.82
    );
  }

  if (established.length >= 2 && vertHold.length < 2) {
    medium(
      'established',
      'Les mouvements que tu répètes sont ceux dont le niveau devient lisible',
      `${fmtList(established.map((e) => e.exerciseName))} ont assez d'historique pour être considérés comme établis, pas comme un pic isolé. Une performance sur un exercice rare reste difficile à lire : trop peu de séances comparables, trop de place au hasard d'un bon jour.\n\nUne progression (ou une stagnation) sur un mouvement que tu retravailles souvent est beaucoup plus solide. C'est à ça qu'il faut comparer les prochaines séances — toi contre toi, sur les mêmes mouvements — pas à un record d'un jour ni à une moyenne abstraite. Si l'un de ces exercices recule alors qu'il reste fréquent, le signal devient nettement plus crédible qu'une baisse sur une variante que tu as presque arrêtée.`,
      established.map((e) => e.exerciseName).slice(0, 3).join(' · '),
      0.8
    );
  }

  if (efficiency != null && (loadFalling || (mom != null && mom < 0))) {
    medium(
      'efficiency',
      'Le rendement de progression se lit avec la fréquence, pas tout seul',
      `La progression récente est moins favorable : tu investis du volume pour un retour de performances plutôt négatif (efficacité autour de ${efficiency}). Une partie de ce ralentissement peut venir du simple fait que tu t'exposes moins souvent, pas d'une incapacité à progresser. Moins de séances, c'est moins d'occasions d'améliorer un mouvement — le « rendement » baisse mécaniquement.\n\nTant que la fréquence reste plus basse, juger ce chiffre comme un plafond de niveau serait trop tôt. Il redevient intéressant si tu retrouves un rythme régulier et que les performances de référence ne suivent toujours pas : là, on pourrait parler de réponse à l'entraînement plus faible, pas seulement de calendrier.`,
      efficiency != null ? `efficacité ~${efficiency}` : '',
      0.84
    );
  }

  if (
    (goal === 'muscular_defined' || goal === 'strength_lean') &&
    programPct != null &&
    programPct < 65 &&
    (freqDelta != null && freqDelta < -12)
  ) {
    medium(
      'goal_gap',
      'Ton objectif demande de la régularité, ta pratique récente en donne moins',
      `Un objectif d'hypertrophie, de définition ou de force sèche s'appuie sur une exposition répétée : les muscles et les mouvements progressent si tu les retravailles assez souvent, assez longtemps. Or tu fais moins de séances et tu t'éloignes du plan (~${programPct} % réalisé).\n\nLe premier levier n'est probablement pas d'ajouter des variantes ni de « mieux choisir » les exercices. C'est de retrouver assez souvent le travail déjà prévu. Ce n'est pas un verdict de motivation — c'est un écart entre ce que tu vises et ce qui est réellement fait. Si cet écart dure, l'objectif reste affiché, mais la pratique construit autre chose : moins de volume, plus de spécialisation sur ce que tu continues de cocher.`,
      `objectif · ~${programPct} % du plan · fréquence ${freqDelta}%`,
      0.86
    );
  }

  if (loadFalling && current.avgExercisesPerSession && habit.avgExercisesPerSession) {
    medium(
      'capacity_vs_exposure',
      "Le risque actuel ressemble davantage à un trou de rythme qu'à un manque de capacité",
      `Ta fréquence a reculé, mais l'historique montre que tu es encore capable de tenir des séances relativement denses quand tu les fais (~${current.avgExercisesPerSession} exercices). La capacité à enchaîner une séance n'est pas le problème observé : c'est la régularité d'exposition.${idFreqNote}\n\nSi ça continue, le premier risque n'est pas forcément de tout perdre d'un coup. Les mouvements établis tiennent souvent quelques semaines. Ce qui souffre d'abord, c'est la progression de ce que tu n'exposes plus assez souvent, et les qualités déjà en marge (course, jambes, accessoires). À surveiller sur les prochaines semaines : est-ce un creux, ou le début d'un rythme plus bas qui devient ta nouvelle normale ?`,
      `${currRate}/sem. · densité ${current.avgExercisesPerSession}`,
      0.88,
      { showConfidence: true }
    );
  }

  // ——— LONG TERME : ce qui caractérise la trajectoire (pas du remplissage) ———
  if (longTerm.sessions >= 4) {
    const durable = (longShifts.rising.length
      ? longShifts.rising
      : longTerm.exercises.filter((e) => e.sessions >= 4 && e.lastReps >= e.firstReps + 2)
    ).slice(0, 3);
    if (durable.length) {
      long(
        'continuity_level',
        'Ce qui progresse durablement, c’est ce qui revient souvent',
        `${fmtList(durable.map((e) => e.name))} tiennent ou montent sur le trimestre, surtout parce qu'ils reviennent régulièrement. Un PR isolé sur un exercice rare dit peu : trop peu de séances, trop de hasard. Une hausse lente sur un mouvement que tu répètes dit davantage — le niveau devient comparable d'une semaine à l'autre.\n\nSur plusieurs mois, c'est ça qui caractérise vraiment ta pratique : tu construis un niveau là où tu reviens. Les mouvements intermittents peuvent afficher une belle séance sans produire de trajectoire. Si tu veux qu'une qualité progresse durablement, la question n'est pas d'abord d'ajouter un exercice, c'est de lui laisser une place répétée dans le calendrier.`,
        durable.map((e) => e.name).join(' · '),
        0.9
      );
    }

    if (currRate && longRate && currRate < longRate * 0.85) {
      const idBit = identity?.ready
        ? ` Ton rythme habituel, lui, se situe autour de ${formatRateFr(identity.frequency.meanPerWeek)} séances/sem. (souvent ${identityBandPhrase(identity)})${
            idStatus === 'low'
              ? ` : la période actuelle (${formatRateFr(identity.frequency.currentPerWeek)}) sort de cette plage.`
              : idStatus === 'inside'
                ? ` : malgré l'écart aux 90 jours, ${formatRateFr(identity.frequency.currentPerWeek)} reste encore dans ta variabilité personnelle.`
                : '.'
          }`
        : '';
      long(
        'recent_vs_identity',
        identity?.ready && idStatus === 'low'
          ? 'La période actuelle s’écarte de ton rythme habituel, pas seulement des 90 jours'
          : 'La période actuelle s’écarte de ta trajectoire des mois précédents',
        `Tu es autour de ${currRate} séances par semaine, contre plutôt ${longRate} sur ~90 jours.${idBit} La question n'est pas seulement « moins de volume ». C'est de savoir si ce creux est une parenthèse, ou le début d'un autre rythme — un entraînement encore dense les jours où tu y vas, mais plus rare.\n\nTes mouvements établis peuvent tenir un moment : l'historique long sert précisément à ça. Ce qui souffre d'abord, c'est la progression de ce que tu n'exposes plus assez, et les qualités déjà sorties de la rotation. Si dans trois ou quatre semaines tu es encore autour de ${currRate}/sem., ce n'est plus un accident de calendrier : c'est un changement de trajectoire. Si tu reviens vers ${longRate}, le trimestre reste ta référence, et la période actuelle n'aura été qu'un creux.`,
        `${currRate}/sem. maintenant · ${longRate}/sem. sur 90 j.${
          identity?.ready ? ` · habitude ${formatRateFr(identity.frequency.meanPerWeek)}` : ''
        }`,
        0.91
      );
    }
  }

  if (identityCanClaimUnusual(identity) && idStatus === 'low') {
    const qBits = (identity.unusualQualities || [])
      .filter((q) => q.unusualGap)
      .slice(0, 2)
      .map((q) => identityGapParagraph(q).trim())
      .filter(Boolean);
    medium(
      'identity',
      'Ce rythme n’est plus le tien : il sort de ta variabilité habituelle',
      `Sur ${identity.weeksUsed} semaines de pratique lisible, tu t'entraînes d'habitude autour de ${formatRateFr(identity.frequency.meanPerWeek)} séances par semaine (souvent ${identityBandPhrase(identity)}, confiance ${identity.confidenceLabel}). La période actuelle est à ${formatRateFr(identity.frequency.currentPerWeek)} — en dehors de cette plage, pas seulement en dessous du mois d'avant.\n\n${qBits.length ? `${qBits.join(' ')}\n\n` : ''}Ce n'est pas un verdict de motivation. C'est un écart à ce que tu fais généralement, avec assez d'historique pour le dire. Si ça se recale dans la plage d'ici deux ou trois semaines, ce n'était qu'un creux. Si ${formatRateFr(identity.frequency.currentPerWeek)}/sem. devient le nouveau rythme, ce n'est plus ta variabilité : c'est un autre profil.`,
      `habitude ${formatRateFr(identity.frequency.meanPerWeek)} · actuel ${formatRateFr(identity.frequency.currentPerWeek)} · ${identity.weeksUsed} sem.`,
      0.93
    );
  }

  return out.filter((c) => (c.relevance || 0) >= 0.76 || c.context?.kind === 'unknown_fatigue');
}

function denserLike(started, finished, partial) {
  if (started == null || started <= 0) return false;
  if (finished == null) return true;
  return finished / started >= 0.45 || (partial || 0) > 0;
}

function shareEvidence(profile) {
  return (profile?.muscles || [])
    .slice(0, 3)
    .map((m) => `${m.label} ${m.sharePct}%`)
    .join(' · ');
}

/** Conservé pour les tests / debug : un seul gros texte n'est plus le chemin UI. */
export function buildHorizonEssayCandidatesLegacy(opts) {
  return buildHorizonEssayCandidates(opts);
}
