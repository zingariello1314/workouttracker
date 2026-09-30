/**
 * Rédacteur. Aucune métrique, aucun seuil.
 * Il n'écrit que les champs déjà présents dans le dossier.
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

function sentencesOf(dossier) {
  const axes = new Set(dossier.axes || []);
  const o = dossier.observed || {};
  const out = [];
  const allow = (axis) => axes.has(axis);

  if (allow('volume') && hasNum(o.reps) && dossier.thread === 'concentration') {
    if (o.pending && o.lastSession && hasNum(o.lastSession.reps)) {
      const dur = o.lastSession.durationLabel ? ` en ${o.lastSession.durationLabel}` : '';
      out.push(
        `Aujourd'hui n'a encore aucune répétition enregistrée. Ta dernière séance, le ${o.lastSession.dateLabel}, totalisait ${fmtInt(o.lastSession.reps)} répétitions${dur}.`
      );
      if (
        dossier.thread === 'concentration' &&
        dossier.sense === 'fact' &&
        o.lastSessionShare &&
        hasNum(o.lastSessionShare.reps) &&
        hasNum(o.lastSessionShare.share) &&
        hasNum(o.lastSessionShare.wideReps)
      ) {
        out.push(
          `Ces ${fmtInt(o.lastSessionShare.reps)} répétitions représentent ${fmtPct(o.lastSessionShare.share)} des ${fmtInt(o.lastSessionShare.wideReps)} répétitions des 7 derniers jours.`
        );
      }
    } else {
      out.push(
        `${dossier.windowLabel} compte ${fmtInt(o.reps)} répétitions${
          allow('frequency') && hasNum(o.sessions) ? ` sur ${fmtInt(o.sessions)} séances` : ''
        }.`
      );
    }
  }

  if (allow('frequency') && hasNum(o.repsPerSession) && hasNum(o.sessions) && !o.pending) {
    out.push(
      `Cela fait environ ${fmtInt(o.repsPerSession)} répétitions par séance. La moyenne ne dit pas si une séance porte le total.`
    );
  }

  if (allow('concentration') && o.peak && hasNum(o.peak.reps)) {
    const share = hasNum(o.peak.share) ? `, soit ${fmtPct(o.peak.share)} de la fenêtre` : '';
    const names = Array.isArray(o.peak.exerciseNames) && o.peak.exerciseNames.length
      ? ` Les exercices de ce jour : ${o.peak.exerciseNames.join(', ')}.`
      : '';
    const others = hasNum(o.peak.otherDaysReps)
      ? ` Les autres journées réunies font ${fmtInt(o.peak.otherDaysReps)} répétitions.`
      : '';
    out.push(
      `Le ${o.peak.dateLabel} concentre ${fmtInt(o.peak.reps)} répétitions${share}.${names}${others}`
    );
  }

  if (allow('exercises') && Array.isArray(o.exerciseNames) && o.exerciseNames.length && !o.peak) {
    out.push(`Les exercices comptés : ${o.exerciseNames.join(', ')}.`);
  }

  if (allow('families') && Array.isArray(o.families) && o.families.length) {
    const bits = o.families.slice(0, 4).map((f) => `${fmtInt(f.reps)} ${f.label}`);
    out.push(`Les familles identifiées portent ${bits.join(', ')}. Cette part décrit la fenêtre, pas une charge identique d'un exercice à l'autre.`);
  }

  if (allow('pushPull') && hasNum(o.pushReps) && hasNum(o.pullReps)) {
    out.push(
      `La poussée compte ${fmtInt(o.pushReps)} répétitions et le tirage ${fmtInt(o.pullReps)}. L'écart décrit la composition du volume, pas un déséquilibre à corriger.`
    );
  }

  if (allow('series') && o.series) {
    if (hasNum(o.series.bestSet)) {
      const official = hasNum(o.series.officialReps)
        ? ` Le record déclaré reste ${fmtInt(o.series.officialReps)}. La série observée ne le remplace pas.`
        : '';
      out.push(
        `Meilleure série observée de ${o.series.name} : ${fmtInt(o.series.bestSet)} répétitions${
          hasNum(o.series.setCount) ? `, sur ${fmtInt(o.series.setCount)} séries saisies` : ''
        }.${hasNum(o.series.volume) ? ` Le volume de la séance est ${fmtInt(o.series.volume)}, ce n'est pas la série.` : ''}${official}`
      );
    } else if (o.series.totalOnly && hasNum(o.series.volume)) {
      out.push(
        `${fmtInt(o.series.volume)} répétitions décrivent le volume de ${o.series.name}, pas une série observée.`
      );
    }
  }

  if (allow('repertoire') && o.repertoire) {
    const enter = o.repertoire.entered;
    const exit = o.repertoire.exited;
    if (enter && hasNum(enter.reps)) {
      out.push(
        `${enter.name} entre dans la fenêtre avec ${fmtInt(enter.reps)} répétitions. Une présence dans la fenêtre n'est pas une habitude installée.`
      );
    }
    if (exit && hasNum(exit.reps)) {
      out.push(`${exit.name} était à ${fmtInt(exit.reps)} répétitions sur la période précédente et n'apparaît plus ici.`);
    }
  }

  if (allow('comparison') && dossier.comparison && hasNum(dossier.comparison.reps)) {
    const freq = hasNum(dossier.comparison.sessions)
      ? ` sur ${fmtInt(dossier.comparison.sessions)} séances`
      : '';
    out.push(
      `${dossier.comparison.label} comptait ${fmtInt(dossier.comparison.reps)} répétitions${freq}.`
    );
  }

  if (allow('continuity') && dossier.continuity && dossier.continuity.reading && hasNum(dossier.continuity.narrowReps) && hasNum(dossier.continuity.wideReps)) {
    out.push(
      `${dossier.continuity.narrowLabel} (${fmtInt(dossier.continuity.narrowReps)} répétitions) face à ${dossier.continuity.wideLabel} (${fmtInt(dossier.continuity.wideReps)} répétitions) : ${dossier.continuity.reading}.`
    );
  }

  if (allow('blocks') && dossier.blocks?.a && dossier.blocks?.b && hasNum(dossier.blocks.a.reps) && hasNum(dossier.blocks.b.reps)) {
    out.push(
      `Le bloc ${dossier.blocks.a.label} compte ${fmtInt(dossier.blocks.a.reps)} répétitions en ${fmtInt(dossier.blocks.a.sessions)} jours, et le bloc ${dossier.blocks.b.label} en compte ${fmtInt(dossier.blocks.b.reps)} en ${fmtInt(dossier.blocks.b.sessions)} jours. Ce n'est pas le même récit qu'un seul mois récent.`
    );
  }

  if (o.monthLead && hasNum(o.monthLead.reps) && dossier.voice === '3m') {
    out.push(
      `Le mois le plus chargé de ces trois mois est ${o.monthLead.label}, avec ${fmtInt(o.monthLead.reps)} répétitions sur ${fmtInt(o.monthLead.sessions)} jours.`
    );
  }

  if (allow('coverage') && dossier.coverage) {
    const c = dossier.coverage;
    if (c.firstDateLabel) {
      out.push(
        c.late
          ? `Les répétitions comptées dans cette fenêtre commencent le ${c.firstDateLabel}, pas au premier jour du calendrier affiché.`
          : `Les répétitions comptées courent depuis le ${c.firstDateLabel}.`
      );
    }
    if (c.high && c.low && c.high.label !== c.low.label && hasNum(c.high.reps) && hasNum(c.low.reps)) {
      out.push(
        `Le mois le plus chargé est ${c.high.label} (${fmtInt(c.high.reps)} répétitions), le plus creux est ${c.low.label} (${fmtInt(c.low.reps)}).`
      );
    }
  }

  if (allow('sleep') && dossier.sleep) {
    const s = dossier.sleep;
    if (s.level === 1 && s.bedLabel && s.wakeLabel) {
      out.push(
        `Observation : coucher à ${s.bedLabel}, lever à ${s.wakeLabel}. Une seule nuit ne suffit pas à décrire un rythme.`
      );
    } else if (s.level === 2 && s.bedLabel && s.wakeLabel) {
      out.push(
        `Actuellement, le coucher est autour de ${s.bedLabel} et le lever autour de ${s.wakeLabel}, sur ${fmtInt(s.n)} nuits.`
      );
    } else if (s.level >= 3 && s.bedLabel && s.wakeLabel) {
      out.push(
        `Rythme habituel récent : coucher autour de ${s.bedLabel}, lever autour de ${s.wakeLabel}, sur ${fmtInt(s.n)} nuits. La durée et le placement restent deux lectures.`
      );
    }
    if (s.regularity === 'stable' && hasNum(s.iqrMin)) {
      out.push(`Les couchers restent groupés, écart typique d'environ ${fmtInt(s.iqrMin)} minutes.`);
    }
    if (s.regularity === 'irregular' && hasNum(s.iqrMin)) {
      out.push(`Les couchers restent dispersés, écart typique d'environ ${fmtInt(s.iqrMin)} minutes.`);
    }
    if (s.weekendAxes && hasNum(s.weekendGapMin)) {
      out.push(`Le week-end, c'est ${s.weekendAxes} qui se décale, d'environ ${fmtInt(s.weekendGapMin)} minutes.`);
    }
    if (s.referenceLabel) {
      out.push(`Repère général : ${s.referenceLabel}. Ce repère ne dit pas que c'est un problème.`);
    }
    if (s.associationLabel) {
      out.push(s.associationLabel);
    }
    if (hasNum(s.driftMin) && s.driftAxis) {
      out.push(`Sur les nuits déjà qualifiées, ${s.driftAxis} s'est décalé d'environ ${fmtInt(s.driftMin)} minutes entre le début et la fin de la série.`);
    }
  }

  return out.map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

function enough(dossier, lines) {
  const axes = dossier.axes || [];
  if (!lines.length) return false;
  if (dossier.thread === 'continuity' && dossier.continuity?.reading) return true;
  if (axes.includes('sleep') && dossier.sleep?.level != null) return true;
  if (dossier.thread && dossier.thread !== 'concentration') return true;
  if (axes.includes('volume') && (axes.includes('exercises') || axes.includes('concentration') || axes.includes('families'))) {
    return true;
  }
  return axes.length >= 2 && lines.length >= 2;
}

export function writeThreadCard(dossier) {
  if (!dossier?.thread || !THREADS[dossier.thread] || !dossier.sense) return null;
  if (dossier.thread === 'continuity' && !dossier.continuity?.reading) return null;
  if (dossier.voice === '6m' && dossier.thread === 'rhythm' && !dossier.blocks) return null;
  if (dossier.voice === '1y' && dossier.thread === 'rhythm' && !dossier.coverage) return null;
  const lines = sentencesOf(dossier);
  if (!enough(dossier, lines)) return null;
  const joined = lines.join(' ');
  if (dossier.sleep?.level === 1 && /habitude/i.test(joined)) return null;
  const nature = SENSE_NATURE[dossier.sense];
  const title = lines[0].replace(/\.$/, '');
  return {
    title: title.length > 140 ? `${title.slice(0, 137)}…` : title,
    body: joined,
    evidence: (dossier.axes || []).join(', '),
    kind: threadKind(dossier.thread, dossier.sense),
    nature,
    family: THREADS[dossier.thread].family,
    axes: [...(dossier.axes || [])]
  };
}
