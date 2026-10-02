/**
 * Rédacteur. Une prétention, un titre court, un corps qui démontre.
 * Pas de phrase de garde-fou. Pas de dump d'axes.
 * 28 % et 8 % sont les bandes déjà utilisées par le pic de séance
 * et par « proche du mois précédent ». Ce ne sont pas de nouveaux seuils.
 */

import { SENSE_NATURE, threadKind, THREADS } from './recapAnalysisThreads';

function fmtInt(n) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return '';
  return v.toLocaleString('fr-FR');
}

function fmtPct(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '';
  return `${v.toFixed(1).replace('.', ',')} %`;
}

function hasNum(n) {
  return n != null && Number.isFinite(Number(n));
}

const ROLE_SENSE = { fact: 'fact', reading: 'relation', evolution: 'transformation' };
const PEAK_SHARE = 28;
const CLOSE_PCT = 8;

function cardFrom(dossier, idea) {
  if (!idea || dossier.sense !== ROLE_SENSE[idea.role]) return null;
  return {
    title: idea.title,
    body: idea.body,
    evidence: idea.evidence || dossier.thread,
    kind: threadKind(dossier.thread, dossier.sense),
    nature: SENSE_NATURE[dossier.sense],
    family: THREADS[dossier.thread].family,
    axes: [...(dossier.axes || [])],
    analysisType: idea.analysisType,
    factId: idea.factId
  };
}

function concentrationIdea(dossier) {
  const o = dossier.observed || {};
  if (o.pending && o.lastSession && hasNum(o.lastSession.reps)) {
    const dur = o.lastSession.durationLabel ? ` en ${o.lastSession.durationLabel}` : '';
    let body = `Aujourd'hui n'a encore aucune répétition enregistrée. Ta dernière séance, le ${o.lastSession.dateLabel}, totalisait ${fmtInt(o.lastSession.reps)} répétitions${dur}.`;
    const share = o.lastSessionShare;
    if (hasNum(share?.share) && hasNum(share?.reps) && hasNum(share?.wideReps)) {
      body += ` Ces ${fmtInt(share.reps)} répétitions représentent ${fmtPct(share.share)} des ${fmtInt(share.wideReps)} répétitions des 7 derniers jours.`;
    }
    return {
      role: 'fact',
      analysisType: 'anomaly',
      title: 'La dernière séance pèse encore sur les 7 jours',
      body,
      factId: `last-session|${o.lastSession.dateLabel}`
    };
  }
  const peak = o.peak;
  if (!peak || !hasNum(peak.reps) || !hasNum(peak.share) || Number(peak.share) < PEAK_SHARE) return null;
  const names = Array.isArray(peak.exerciseNames) && peak.exerciseNames.length
    ? ` Les exercices de ce jour : ${peak.exerciseNames.join(', ')}.`
    : '';
  const of = hasNum(o.reps)
    ? ` des ${fmtInt(o.reps)} répétitions de ${String(dossier.windowLabel || 'la fenêtre').toLowerCase()}`
    : ' de la fenêtre';
  return {
    role: 'fact',
    analysisType: 'anomaly',
    title: `Le ${peak.dateLabel} porte une grande part de ${String(dossier.windowLabel || 'la fenêtre').toLowerCase()}`,
    body: `Le ${peak.dateLabel} concentre ${fmtInt(peak.reps)} répétitions, soit ${fmtPct(peak.share)}${of}.${names} Cela décrit la répartition de cette fenêtre.`,
    factId: `peak|${peak.dateLabel}|${dossier.voice || ''}`
  };
}

function rhythmIdea(dossier) {
  if (dossier.voice === '6m' && dossier.blocks?.a && dossier.blocks?.b && hasNum(dossier.blocks.a.reps) && hasNum(dossier.blocks.b.reps)) {
    const a = dossier.blocks.a;
    const b = dossier.blocks.b;
    const up = a.reps >= b.reps ? a : b;
    const down = up === a ? b : a;
    return {
      role: 'evolution',
      analysisType: 'comparison',
      title: 'Les deux moitiés de ces six mois n\'ont pas le même volume',
      body: `Le bloc ${a.label} compte ${fmtInt(a.reps)} répétitions en ${fmtInt(a.sessions)} jours, et le bloc ${b.label} en compte ${fmtInt(b.reps)} en ${fmtInt(b.sessions)} jours. ${up.label} est au-dessus de ${down.label}.`,
      factId: `blocks|6m|${a.label}|${b.label}`
    };
  }
  if (dossier.voice === '1y' && dossier.coverage) {
    const c = dossier.coverage;
    const lines = [];
    if (c.firstDateLabel) {
      lines.push(
        c.late
          ? `Les répétitions comptées dans cette fenêtre commencent le ${c.firstDateLabel}, pas au premier jour du calendrier affiché.`
          : `Les répétitions comptées courent depuis le ${c.firstDateLabel}.`
      );
    }
    if (c.high && c.low && c.high.label !== c.low.label && hasNum(c.high.reps) && hasNum(c.low.reps)) {
      lines.push(
        `Le mois le plus chargé est ${c.high.label} (${fmtInt(c.high.reps)} répétitions), le plus creux est ${c.low.label} (${fmtInt(c.low.reps)}).`
      );
    }
    if (!lines.length) return null;
    return {
      role: 'fact',
      analysisType: 'comparison',
      title: 'L\'année comptée n\'a pas le même poids chaque mois',
      body: lines.join(' '),
      factId: 'coverage|1y'
    };
  }
  if (dossier.voice === 'today') return null;
  const cmp = dossier.comparison;
  const o = dossier.observed || {};
  if (!cmp || !hasNum(cmp.repsPerSession) || !hasNum(o.repsPerSession) || !(Number(cmp.repsPerSession) > 0)) return null;
  if (!hasNum(o.strengthDays) || !hasNum(cmp.strengthDays)) return null;
  const pct = ((Number(o.repsPerSession) - Number(cmp.repsPerSession)) / Number(cmp.repsPerSession)) * 100;
  if (Math.abs(pct) < CLOSE_PCT) return null;
  const up = pct > 0;
  const label = dossier.windowLabel || 'Cette fenêtre';
  return {
    role: 'reading',
    analysisType: 'anomaly',
    direction: up ? 'haut' : 'bas',
    title: up
      ? `${label} sont au-dessus du rythme de renforcement d'avant`
      : `${label} sont en dessous du rythme de renforcement d'avant`,
    body: `${label} sont à environ ${fmtInt(o.repsPerSession)} répétitions par journée de renforcement (${fmtInt(o.strengthDays)} journées), contre environ ${fmtInt(cmp.repsPerSession)} pour ${cmp.label} (${fmtInt(cmp.strengthDays)} journées).`,
    factId: `rate|${dossier.voice || ''}|${cmp.label}`
  };
}

function continuityIdea(dossier) {
  const c = dossier.continuity;
  if (!c || c.reading !== 'pic confirmé' || !hasNum(c.narrowReps) || !hasNum(c.wideReps)) return null;
  return {
    role: 'evolution',
    analysisType: 'comparison',
    title: `${c.narrowLabel} pèsent une grande part de ${c.wideLabel}`,
    body: `${c.narrowLabel} comptent ${fmtInt(c.narrowReps)} répétitions, soit ${fmtPct(c.share)} des ${fmtInt(c.wideReps)} répétitions de ${c.wideLabel}.`,
    factId: `share|${c.narrowLabel}|${c.wideLabel}`
  };
}

function repertoireIdea(dossier) {
  const exit = dossier.observed?.repertoire?.exited;
  if (!exit || !hasNum(exit.reps)) return null;
  return {
    role: 'evolution',
    analysisType: 'evolution',
    title: `${exit.name} a quitté cette fenêtre`,
    body: `${exit.name} comptait ${fmtInt(exit.reps)} répétitions sur la période précédente et tombe à zéro ici. Ce n'est pas une baisse de volume : le mouvement disparaît du journal. ${
      dossier.voice === 'week' || dossier.voice === 'today'
        ? `Sur une fenêtre courte, la capacité spécifique tient encore. Le risque est que « pas cette fois » devienne le répertoire sans que ce soit décidé. Le reprendre plus bas que ${fmtInt(exit.reps)} montre si le geste revient, au lieu de remettre l'ancien total d'un coup.`
        : `Sur cette durée, l'absence pèse plus qu'une semaine sautée. S'il ne revient pas sur la fenêtre suivante, c'est un changement de répertoire : un autre travail du même rôle prend sa place, ou le trou reste ouvert.`
    }`,
    factId: `exit|${String(exit.name).toLowerCase()}|${dossier.voice || ''}`
  };
}

function ideaFor(dossier) {
  if (dossier.thread === 'concentration') return concentrationIdea(dossier);
  if (dossier.thread === 'rhythm') return rhythmIdea(dossier);
  if (dossier.thread === 'continuity') return continuityIdea(dossier);
  if (dossier.thread === 'repertoire') return repertoireIdea(dossier);
  return null;
}

export function writeThreadCard(dossier) {
  if (!dossier?.thread || !THREADS[dossier.thread] || !dossier.sense) return null;
  if (dossier.thread === 'continuity' && !dossier.continuity?.reading) return null;
  if (dossier.voice === '6m' && dossier.thread === 'rhythm' && !dossier.blocks) return null;
  if (dossier.voice === '1y' && dossier.thread === 'rhythm' && !dossier.coverage) return null;
  return cardFrom(dossier, ideaFor(dossier));
}
