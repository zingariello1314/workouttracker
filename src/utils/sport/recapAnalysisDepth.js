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
    factId: idea.factId,
    metrics: idea.metrics || null,
    voice: dossier.voice || null
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
    const hi = Math.max(a.reps, b.reps);
    const lo = Math.min(a.reps, b.reps);
    const pct = hi > 0 ? ((hi - lo) / hi) * 100 : 0;
    // B17 — ne pas survenir un écart < 15 %
    if (pct < 15) return null;
    const up = a.reps >= b.reps ? a : b;
    const down = up === a ? b : a;
    return {
      role: 'evolution',
      analysisType: 'comparison',
      title: 'Les deux moitiés de ces six mois n\'ont pas le même volume',
      body: `Le bloc ${a.label} compte ${fmtInt(a.reps)} répétitions en ${fmtInt(a.sessions)} jours, et le bloc ${b.label} en compte ${fmtInt(b.reps)} en ${fmtInt(b.sessions)} jours. ${up.label} est au-dessus de ${down.label}.`,
      factId: `blocks|6m|${a.label}|${b.label}`,
      metrics: { blockAReps: a.reps, blockBReps: b.reps }
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
  // B15 — une fenêtre d'un jour ne peut pas « quitter le répertoire »
  if (dossier.voice === 'today') return null;
  return {
    role: 'evolution',
    analysisType: 'evolution',
    title: `${exit.name} a quitté cette fenêtre`,
    body: `${exit.name} comptait ${fmtInt(exit.reps)} répétitions sur la période précédente et tombe à zéro ici. Le mouvement disparaît du journal sur cette fenêtre. ${
      dossier.voice === 'week'
        ? `Sur une fenêtre courte, la capacité spécifique tient encore. Le reprendre plus bas que ${fmtInt(exit.reps)} montre si le geste revient.`
        : `Sur cette durée, l'absence pèse plus qu'une semaine sautée. S'il ne revient pas sur la fenêtre suivante, c'est un changement de répertoire.`
    }`,
    factId: `exit|${String(exit.name).toLowerCase()}|${dossier.voice || ''}`
  };
}

function pushPullIdea(dossier) {
  const o = dossier.observed || {};
  const push = Number(o.pushReps);
  const pull = Number(o.pullReps);
  if (!Number.isFinite(push) || !Number.isFinite(pull) || push + pull < 120) return null;
  if (push < 40 || pull < 0) return null;
  const ratio = pull > 0 ? push / pull : null;
  if (ratio == null || !(ratio >= 1.55 || ratio <= 0.7)) return null;
  const label = dossier.windowLabel || 'Cette fenêtre';
  const pushHeavy = ratio >= 1.55;
  const meaning = pushHeavy
    ? `${label} exposent surtout le haut du corps en poussée (pectoraux, épaules, triceps), pas en tirage.`
    : `${label} exposent surtout le haut du corps en tirage (dos), pas en poussée.`;
  const numbers = pushHeavy
    ? `Tu cumules ${fmtInt(push)} répétitions de poussée contre ${fmtInt(pull)} de tirage`
    : `Tu cumules ${fmtInt(pull)} répétitions de tirage contre ${fmtInt(push)} de poussée`;
  const ratioBit =
    ratio >= 1.55
      ? `, soit environ ${ratio.toFixed(1).replace('.', ',')} répétitions de poussée pour 1 de tirage`
      : `, soit environ ${(1 / ratio).toFixed(1).replace('.', ',')} répétitions de tirage pour 1 de poussée`;
  return {
    role: dossier.sense === 'transformation' ? 'evolution' : dossier.sense === 'relation' ? 'reading' : 'fact',
    analysisType: 'comparison',
    title: pushHeavy
      ? 'Le haut du corps travaille surtout en poussée'
      : 'Le haut du corps travaille surtout en tirage',
    body: `${meaning} ${numbers}${ratioBit}. Le ratio vient en second : c’est la répartition du volume qui décrit la fenêtre.`,
    factId: `pushPull|${dossier.voice || ''}|${pushHeavy ? 'push' : 'pull'}`,
    metrics: { pushReps: push, pullReps: pull, ratio: Math.round(ratio * 10) / 10 }
  };
}

function compositionIdea(dossier) {
  const families = dossier.observed?.families;
  if (!Array.isArray(families) || families.length < 2) return null;
  const total = Number(dossier.observed?.reps);
  const lead = families[0];
  const second = families[1];
  if (!lead?.label || !hasNum(lead.reps) || !hasNum(total) || total < 80) return null;
  const share = (Number(lead.reps) / total) * 100;
  if (share < 18) return null;
  const label = dossier.windowLabel || 'Cette fenêtre';
  const secondBit =
    second?.label && hasNum(second.reps)
      ? ` Derrière, ${second.label} pèsent ${fmtInt(second.reps)} répétitions.`
      : '';
  return {
    role: 'fact',
    analysisType: 'anomaly',
    title: `${capFirst(lead.label)} portent une part nette de ${String(label).toLowerCase()}`,
    body: `${fmtInt(lead.reps)} des ${fmtInt(total)} répétitions concernent ${lead.label}, soit ${fmtPct(share)}.${secondBit} Ce chiffre décrit où va le volume de ${String(label).toLowerCase()}.`,
    factId: `composition|${String(lead.label).toLowerCase()}|${dossier.voice || ''}`,
    metrics: { leadLabel: lead.label, leadReps: lead.reps, share }
  };
}

function capFirst(s) {
  const t = String(s || '').trim();
  if (!t) return '';
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function ideaFor(dossier) {
  if (dossier.thread === 'concentration') return concentrationIdea(dossier);
  if (dossier.thread === 'rhythm') return rhythmIdea(dossier);
  if (dossier.thread === 'continuity') return continuityIdea(dossier);
  if (dossier.thread === 'repertoire') return repertoireIdea(dossier);
  if (dossier.thread === 'pushPull') return pushPullIdea(dossier);
  if (dossier.thread === 'composition') return compositionIdea(dossier);
  return null;
}

export function writeThreadCard(dossier) {
  if (!dossier?.thread || !THREADS[dossier.thread] || !dossier.sense) return null;
  if (dossier.thread === 'continuity' && !dossier.continuity?.reading) return null;
  if (dossier.voice === '6m' && dossier.thread === 'rhythm' && !dossier.blocks) return null;
  if (dossier.voice === '1y' && dossier.thread === 'rhythm' && !dossier.coverage) return null;
  return cardFrom(dossier, ideaFor(dossier));
}
