/**
 * Mission 19/20 — décomposition volume × familles de séances.
 * Population : CLASSIC_SESSION (catalogue lifetime, hors complémentaire).
 * Attribution : structurelle via matchSessionToProgramSlot + familles clusterisées.
 * Ne confond pas créneau et famille ; ne force pas l’égalité avec le volume inclusif.
 */

import {
  extractSessionTemplates,
  clusterSessionFamilies,
  relateSessionTemplates
} from './sessionStructureGraph';
import { matchSessionToProgramSlot } from './sessionSlotMatching';
import { POPULATION_ID, POPULATION_LABEL } from './canonicalAnalyticalPopulations';

function ymd(d) {
  return String(d || '').slice(0, 10);
}

function attributionLevel(match) {
  if (!match) return 'unattributable';
  if (match.status === 'matched_proven' || match.status === 'partial_session') {
    return match.status === 'partial_session' ? 'structurally_recognized' : 'structurally_recognized';
  }
  if (match.status === 'matched_probable' || match.status === 'multiple_compatible_variants') {
    return 'probably_related';
  }
  return 'unattributable';
}

function buildFamilyIndex(activeProgram) {
  const templates = activeProgram ? extractSessionTemplates(activeProgram) : [];
  if (!templates.length) {
    return { templates: [], familyByDayKey: new Map(), families: [] };
  }
  const relations = relateSessionTemplates(templates) || [];
  const families = clusterSessionFamilies(templates, relations);
  const familyByDayKey = new Map();
  families.forEach((fam) => {
    const memberTemplates = templates.filter((t) => fam.members.includes(t.dayKey));
    const label =
      memberTemplates.map((t) => t.name || t.dayKey).filter(Boolean).join(' / ') || fam.familyId;
    fam.members.forEach((dayKey) => {
      familyByDayKey.set(dayKey, {
        familyId: fam.familyId,
        familyName: label,
        variantDayKey: dayKey,
        variantName: memberTemplates.find((t) => t.dayKey === dayKey)?.name || dayKey
      });
    });
  });
  // Créneaux sans relation → famille singleton
  templates.forEach((t) => {
    if (!familyByDayKey.has(t.dayKey)) {
      familyByDayKey.set(t.dayKey, {
        familyId: `slot:${t.dayKey}`,
        familyName: t.name || t.dayKey,
        variantDayKey: t.dayKey,
        variantName: t.name || t.dayKey
      });
    }
  });
  return { templates, familyByDayKey, families };
}

function enrichSessionNames(session, getExerciseNameById) {
  return {
    ...session,
    exercises: (session.exercises || []).map((e) => {
      const id = e.id ?? e.exerciseId;
      let resolved = '';
      if (typeof getExerciseNameById === 'function' && id != null) {
        resolved = String(getExerciseNameById(id) || '').trim();
        if (/^Exercice\s+#?/i.test(resolved)) resolved = '';
      }
      return {
        ...e,
        name: e.name || resolved || ''
      };
    })
  };
}

function matchFamily(session, activeProgram, familyIndex) {
  if (!activeProgram || !familyIndex?.templates?.length) {
    return {
      familyId: 'unattributed',
      familyName: 'non attribué',
      confidence: 0,
      level: 'unattributable',
      certainty: 'none',
      variantDayKey: null,
      variantName: null,
      historicalDocumented: false
    };
  }
  const match = matchSessionToProgramSlot(session, activeProgram, { allowProbable: true });
  const primary = match.primary || match.candidates?.[0];
  const level = attributionLevel(match);
  if (!primary || level === 'unattributable') {
    return {
      familyId: 'unattributed',
      familyName: 'non attribué',
      confidence: primary?.overlap || 0,
      level: 'unattributable',
      certainty: match.certainty || 'none',
      variantDayKey: null,
      variantName: null,
      historicalDocumented: false,
      matchStatus: match.status
    };
  }
  const mapped = familyIndex.familyByDayKey.get(primary.dayKey) || {
    familyId: `slot:${primary.dayKey}`,
    familyName: primary.sessionName || primary.dayKey,
    variantDayKey: primary.dayKey,
    variantName: primary.sessionName || primary.dayKey
  };
  return {
    familyId: mapped.familyId,
    familyName: mapped.familyName,
    confidence: primary.overlap || 0,
    level,
    certainty: match.certainty || 'probable',
    variantDayKey: mapped.variantDayKey,
    variantName: mapped.variantName,
    historicalDocumented: false,
    matchStatus: match.status
  };
}

function summarizeWindow(sessions, activeProgram, familyIndex, getExerciseNameById) {
  const byFamily = new Map();
  let totalReps = 0;
  const days = new Set();
  let attributedVolume = 0;
  let unattributedVolume = 0;
  const levelCounts = {
    structurally_recognized: 0,
    probably_related: 0,
    unattributable: 0
  };

  (sessions || []).forEach((raw) => {
    const s = enrichSessionNames(raw, getExerciseNameById);
    const date = ymd(s.date);
    if (!date) return;
    days.add(date);
    const reps = Number(s.totalReps) || 0;
    totalReps += reps;
    const fam = matchFamily(s, activeProgram, familyIndex);
    levelCounts[fam.level] = (levelCounts[fam.level] || 0) + 1;
    if (fam.level === 'unattributable') unattributedVolume += reps;
    else attributedVolume += reps;

    const row = byFamily.get(fam.familyId) || {
      familyId: fam.familyId,
      familyName: fam.familyName,
      confidenceMean: 0,
      sessions: 0,
      days: new Set(),
      volume: 0,
      levels: {},
      variants: new Map(),
      occurrenceDates: []
    };
    row.sessions += 1;
    row.days.add(date);
    row.volume += reps;
    row.confidenceMean += fam.confidence;
    row.levels[fam.level] = (row.levels[fam.level] || 0) + 1;
    row.occurrenceDates.push(date);
    const variantKey = fam.variantName || fam.variantDayKey || 'unknown';
    if (variantKey) row.variants.set(variantKey, (row.variants.get(variantKey) || 0) + 1);
    byFamily.set(fam.familyId, row);
  });

  const families = [...byFamily.values()].map((r) => ({
    familyId: r.familyId,
    familyName: r.familyName,
    sessions: r.sessions,
    days: r.days.size,
    volume: r.volume,
    meanContent: r.sessions ? Math.round(r.volume / r.sessions) : 0,
    confidence: r.sessions ? Math.round((r.confidenceMean / r.sessions) * 100) / 100 : 0,
    levels: r.levels,
    occurrenceDates: [...new Set(r.occurrenceDates || [])].sort(),
    topVariants: [...r.variants.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([k, n]) => ({ composition: k, sessions: n }))
  }));

  const sessionCount = (sessions || []).length;
  const recognizedSessions =
    (levelCounts.structurally_recognized || 0) + (levelCounts.probably_related || 0);
  const structurallyVolume = families
    .filter((f) => f.familyId !== 'unattributed')
    .reduce((sum, f) => {
      const struct = f.levels?.structurally_recognized || 0;
      const totalLevel =
        (f.levels?.structurally_recognized || 0) +
        (f.levels?.probably_related || 0) +
        (f.levels?.unattributable || 0);
      if (!totalLevel) return sum;
      return sum + (f.volume * struct) / Math.max(1, f.sessions);
    }, 0);

  return {
    trainingDays: days.size,
    sessions: sessionCount,
    volume: totalReps,
    meanPerDay: days.size ? Math.round(totalReps / days.size) : 0,
    attributedVolume,
    unattributedVolume,
    /** @deprecated alias → recognizedVolumeShare (ne compte pas le résidu) */
    attributionShare: totalReps > 0 ? attributedVolume / totalReps : 0,
    /** Couverture du partitionnement (familles + résidu) — toujours ≈ 1 si chaque séance est classée. */
    partitionCoverageShare: sessionCount > 0 ? 1 : 0,
    /** Part du volume relié à une vraie famille (hors « non attribué »). */
    recognizedVolumeShare: totalReps > 0 ? attributedVolume / totalReps : 0,
    recognizedSessionShare: sessionCount > 0 ? recognizedSessions / sessionCount : 0,
    unattributedVolumeShare: totalReps > 0 ? unattributedVolume / totalReps : 0,
    structurallyRecognizedSessionShare:
      sessionCount > 0 ? (levelCounts.structurally_recognized || 0) / sessionCount : 0,
    probablyRelatedSessionShare:
      sessionCount > 0 ? (levelCounts.probably_related || 0) / sessionCount : 0,
    historicallyDocumentedShare: 0, // aucune preuve historique datée dans ce socle
    structurallyRecognizedVolumeApprox: Math.round(structurallyVolume),
    levelCounts,
    families: families.sort((a, b) => b.volume - a.volume),
    populationId: POPULATION_ID.CLASSIC_SESSION,
    populationLabel: POPULATION_LABEL[POPULATION_ID.CLASSIC_SESSION]
  };
}

/**
 * Contribution nette explicite :
 * ΔV ≈ Σ (freq_effect + content_effect)
 * freq_effect = (days_r - days_p) * mean_p
 * content_effect = days_r * (mean_r - mean_p)
 */
function contributionMath(r, p) {
  const recentDays = r?.days || 0;
  const previousDays = p?.days || 0;
  const recentMean = r?.meanContent || 0;
  const previousMean = p?.meanContent || 0;
  const freqEffect = (recentDays - previousDays) * previousMean;
  const contentEffect = recentDays * (recentMean - previousMean);
  const explained = freqEffect + contentEffect;
  const volumeDelta = (r?.volume || 0) - (p?.volume || 0);
  return {
    freqEffect: Math.round(freqEffect),
    contentEffect: Math.round(contentEffect),
    explained: Math.round(explained),
    residual: Math.round(volumeDelta - explained)
  };
}

export function decomposeMonthlyProgramChange({
  catalog = [],
  window = null,
  previousWindow = null,
  activeProgram = null,
  getExerciseNameById = null
} = {}) {
  if (!window?.start || !window?.end) {
    return { ok: false, reason: 'window_required' };
  }
  const familyIndex = buildFamilyIndex(activeProgram);
  const inWin = (s, w) => s?.date && s.date >= w.start && s.date <= w.end;
  const recentSessions = (catalog || []).filter((s) => inWin(s, window));
  let prevWin = previousWindow;
  if (!prevWin) {
    const span =
      Math.round(
        (new Date(`${window.end}T12:00:00`) - new Date(`${window.start}T12:00:00`)) / 86400000
      ) + 1;
    const prevEnd = (() => {
      const d = new Date(`${window.start}T12:00:00`);
      d.setDate(d.getDate() - 1);
      return d.toISOString().slice(0, 10);
    })();
    const prevStart = (() => {
      const d = new Date(`${prevEnd}T12:00:00`);
      d.setDate(d.getDate() - (span - 1));
      return d.toISOString().slice(0, 10);
    })();
    prevWin = { start: prevStart, end: prevEnd };
  }
  const prevSessions = (catalog || []).filter((s) => inWin(s, prevWin));
  const recent = summarizeWindow(recentSessions, activeProgram, familyIndex, getExerciseNameById);
  const previous = summarizeWindow(prevSessions, activeProgram, familyIndex, getExerciseNameById);
  const deltaVolume = recent.volume - previous.volume;
  const deltaDays = recent.trainingDays - previous.trainingDays;

  const famIds = new Set([
    ...recent.families.map((f) => f.familyId),
    ...previous.families.map((f) => f.familyId)
  ]);
  const contributions = [];
  let attributed = 0;
  famIds.forEach((id) => {
    const r = recent.families.find((f) => f.familyId === id);
    const p = previous.families.find((f) => f.familyId === id);
    const volDelta = (r?.volume || 0) - (p?.volume || 0);
    attributed += volDelta;
    const math = contributionMath(r, p);
    let evolution = 'stable';
    if (!p && r) evolution = 'appearance';
    else if (p && !r) evolution = 'disappearance';
    else if ((r?.days || 0) > (p?.days || 0)) evolution = 'frequency_up';
    else if ((r?.days || 0) < (p?.days || 0)) evolution = 'frequency_down';
    else if (Math.abs((r?.meanContent || 0) - (p?.meanContent || 0)) >= 8) evolution = 'content_change';
    contributions.push({
      familyId: id,
      familyName: r?.familyName || p?.familyName || id,
      recentDays: r?.days || 0,
      previousDays: p?.days || 0,
      recentVolume: r?.volume || 0,
      previousVolume: p?.volume || 0,
      volumeDelta: volDelta,
      recentMeanContent: r?.meanContent || 0,
      previousMeanContent: p?.meanContent || 0,
      evolution,
      ...math,
      confidence: r?.confidence ?? p?.confidence ?? 0,
      topVariantsRecent: r?.topVariants || [],
      topVariantsPrevious: p?.topVariants || []
    });
  });
  contributions.sort((a, b) => Math.abs(b.volumeDelta) - Math.abs(a.volumeDelta));

  const reconciliationGap = Math.round(deltaVolume - attributed);
  const drivers = contributions.filter(
    (c) => Math.abs(c.volumeDelta) >= Math.max(40, Math.abs(deltaVolume) * 0.12)
  );
  const driversVolumeSum = drivers.reduce((s, c) => s + c.volumeDelta, 0);
  const proseRemainder = Math.round(deltaVolume - driversVolumeSum);

  const coverageRecent = recent.recognizedVolumeShare || 0;
  const coveragePrevious = previous.recognizedVolumeShare || 0;
  const coverageDelta = coverageRecent - coveragePrevious;
  /** Hausse de couverture pouvant être confondue avec une hausse de fréquence familiale. */
  const coverageComparability = {
    recent: coverageRecent,
    previous: coveragePrevious,
    delta: coverageDelta,
    caution:
      coverageDelta >= 0.2 &&
      Math.abs(deltaVolume) >= 100 &&
      (recent.unattributedVolumeShare || 0) < (previous.unattributedVolumeShare || 0) - 0.15
  };

  const direction =
    deltaVolume > 30 ? 'up' : deltaVolume < -30 ? 'down' : 'stable';

  let conclusion = null;
  let conclusionScope = 'full_training';
  if (Math.abs(deltaVolume) < 30 && Math.abs(deltaDays) <= 1) {
    conclusion = null;
  } else if (drivers.length) {
    const bits = drivers.slice(0, 3).map((d) => {
      const mathBit = `effet fréquence ${d.freqEffect >= 0 ? '+' : ''}${d.freqEffect}, effet contenu ${
        d.contentEffect >= 0 ? '+' : ''
      }${d.contentEffect}`;
      if (d.evolution === 'appearance') {
        return `${d.familyName} apparaît et apporte ${d.volumeDelta} répétitions (${mathBit})`;
      }
      if (d.evolution === 'frequency_up') {
        return `${d.familyName} est plus fréquente (${d.previousDays}→${d.recentDays} j, Δ ${d.volumeDelta} reps ; ${mathBit})`;
      }
      if (d.evolution === 'frequency_down') {
        return `${d.familyName} est moins fréquente (${d.previousDays}→${d.recentDays} j, Δ ${d.volumeDelta} reps ; ${mathBit})`;
      }
      if (d.evolution === 'content_change') {
        return `${d.familyName} change de contenu moyen (${d.previousMeanContent}→${d.recentMeanContent} reps/séance ; ${mathBit})`;
      }
      return `${d.familyName} : Δ ${d.volumeDelta} reps (${mathBit})`;
    });
    const dayBit =
      Math.abs(deltaDays) >= 1
        ? `Les journées de renforcement classique passent de ${previous.trainingDays} à ${recent.trainingDays}.`
        : `Le nombre de journées classiques reste proche (${recent.trainingDays}).`;
    const verb =
      direction === 'up' ? 'passe de' : direction === 'down' ? 'passe de' : 'reste proche entre';
    conclusion = `Le volume classique ${verb} ${previous.volume} à ${recent.volume} répétitions. ${dayBit} Principaux contributeurs : ${bits.join(' ; ')}.`;
    if (proseRemainder !== 0) {
      conclusion += ` Autres familles (hors top) : ${proseRemainder >= 0 ? '+' : ''}${proseRemainder} reps (exact).`;
    }
    const unAttr = recent.unattributedVolume || 0;
    if (unAttr > 0) {
      conclusion += ` Résidu non attribué (période récente) : ${unAttr} reps (${Math.round(
        (recent.unattributedVolumeShare || 0) * 100
      )} % du volume).`;
    }
    if (coverageComparability.caution) {
      conclusionScope = 'recognized_sessions_only';
      conclusion += ` Attention : la couverture d’attribution s’améliore (${Math.round(
        coveragePrevious * 100
      )} % → ${Math.round(coverageRecent * 100)} %) — une part de la hausse familiale peut refléter une meilleure reconnaissance plutôt qu’une évolution sportive seule.`;
    }
    if (Math.abs(reconciliationGap) > 0) {
      conclusion += ` Écart de réconciliation des contributions : ${reconciliationGap}.`;
    }
  }

  return {
    ok: true,
    window,
    previousWindow: prevWin,
    recent,
    previous,
    deltaVolume,
    deltaDays,
    direction,
    contributions,
    contributionRegistry: contributions.map((c) => {
      const rFam = recent.families.find((f) => f.familyId === c.familyId);
      const pFam = previous.families.find((f) => f.familyId === c.familyId);
      return {
        familyId: c.familyId,
        familyName: c.familyName,
        stableIdentity: c.familyId,
        window,
        previousWindow: prevWin,
        previousVolume: c.previousVolume,
        recentVolume: c.recentVolume,
        previousDays: c.previousDays,
        recentDays: c.recentDays,
        volumeDelta: c.volumeDelta,
        freqEffect: c.freqEffect,
        contentEffect: c.contentEffect,
        residual: c.residual,
        confidence: c.confidence,
        coverage: {
          recognizedVolumeShareRecent: recent.recognizedVolumeShare,
          recognizedSessionShareRecent: recent.recognizedSessionShare
        },
        evolution: c.evolution,
        occurrenceDatesRecent: rFam?.occurrenceDates || [],
        occurrenceDatesPrevious: pFam?.occurrenceDates || [],
        topVariantsRecent: c.topVariantsRecent,
        topVariantsPrevious: c.topVariantsPrevious
      };
    }),
    drivers,
    driversVolumeSum,
    proseRemainder,
    reconciliationGap,
    conclusion,
    conclusionScope,
    coverageComparability,
    templatesUsed: familyIndex.templates.length,
    familyClusters: familyIndex.families.length,
    evidenceLevel: familyIndex.templates.length ? 'program_templates_structural' : 'unattributed_only',
    populationId: POPULATION_ID.CLASSIC_SESSION,
    populationLabel: POPULATION_LABEL[POPULATION_ID.CLASSIC_SESSION],
    attribution: {
      /** @deprecated use recognizedVolumeShareRecent */
      recentShare: recent.recognizedVolumeShare,
      previousShare: previous.recognizedVolumeShare,
      recognizedVolumeShareRecent: recent.recognizedVolumeShare,
      recognizedVolumeSharePrevious: previous.recognizedVolumeShare,
      recognizedSessionShareRecent: recent.recognizedSessionShare,
      partitionCoverageShareRecent: recent.partitionCoverageShare,
      unattributedVolumeShareRecent: recent.unattributedVolumeShare,
      structurallyRecognizedSessionShareRecent: recent.structurallyRecognizedSessionShare,
      probablyRelatedSessionShareRecent: recent.probablyRelatedSessionShare,
      historicallyDocumentedShareRecent: recent.historicallyDocumentedShare,
      recentLevelCounts: recent.levelCounts,
      previousLevelCounts: previous.levelCounts
    }
  };
}

export function titleForFamilyVolumeDecomposition(decomp) {
  const direction = decomp?.direction || (decomp?.deltaVolume > 0 ? 'up' : decomp?.deltaVolume < 0 ? 'down' : 'stable');
  if (direction === 'down') {
    return 'La baisse de volume se lit dans la composition des familles de séances';
  }
  if (direction === 'stable') {
    return 'Le volume se lit dans la composition des familles de séances';
  }
  return 'La hausse de volume se lit dans la composition des familles de séances';
}

export function discoveryFromMonthlyComposition(decomp, { voiceKey = 'month', sharedFacts = null } = {}) {
  if (!decomp?.ok || !decomp.conclusion) return null;
  const title = titleForFamilyVolumeDecomposition(decomp);
  const pct = (v) => Math.round((Number(v) || 0) * 100);
  const attr = decomp.attribution || {};
  const factIds = (sharedFacts?.facts || sharedFacts || []).map((f) => f.id || f).filter(Boolean);
  return {
    kind: 'disc_program_family_volume_decomposition',
    nature: 'trajectory',
    family: 'program_structure',
    title,
    body: decomp.conclusion,
    evidence: decomp.drivers
      .slice(0, 4)
      .map((d) => `${d.familyName}:${d.volumeDelta}`)
      .join(' · '),
    weights: { importance: 0.93, reliability: 0.82, novelty: 0.88, fit: voiceKey === 'month' ? 1 : 0.75 },
    drafting: { authority: 'composition' },
    metrics: {
      thesis: 'program_family_volume_decomposition',
      narrativeAuthority: 'composition',
      composition: { conclusion: decomp.conclusion, kind: 'monthly_family_decomposition' },
      decomposition: decomp,
      direction: decomp.direction,
      populationId: decomp.populationId,
      populationLabel: decomp.populationLabel,
      observedValues: [
        { id: 'volumeRecent', value: decomp.recent.volume, unit: 'reps', populationId: decomp.populationId },
        { id: 'volumePrevious', value: decomp.previous.volume, unit: 'reps', populationId: decomp.populationId },
        { id: 'deltaVolume', value: decomp.deltaVolume, unit: 'reps' },
        { id: 'daysRecent', value: decomp.recent.trainingDays, unit: 'days' },
        { id: 'daysPrevious', value: decomp.previous.trainingDays, unit: 'days' },
        { id: 'recognizedVolumeShareRecent', value: pct(attr.recognizedVolumeShareRecent), unit: 'pct' },
        { id: 'recognizedSessionShareRecent', value: pct(attr.recognizedSessionShareRecent), unit: 'pct' },
        { id: 'unattributedVolumeShareRecent', value: pct(attr.unattributedVolumeShareRecent), unit: 'pct' },
        { id: 'partitionCoverageShareRecent', value: pct(attr.partitionCoverageShareRecent), unit: 'pct' },
        {
          id: 'structurallyRecognizedSessionShareRecent',
          value: pct(attr.structurallyRecognizedSessionShareRecent),
          unit: 'pct'
        },
        {
          id: 'probablyRelatedSessionShareRecent',
          value: pct(attr.probablyRelatedSessionShareRecent),
          unit: 'pct'
        },
        {
          id: 'historicallyDocumentedShareRecent',
          value: pct(attr.historicallyDocumentedShareRecent),
          unit: 'pct'
        },
        { id: 'contributionReconciliationGap', value: decomp.reconciliationGap || 0, unit: 'reps' },
        { id: 'proseRemainderExact', value: decomp.proseRemainder || 0, unit: 'reps' }
      ],
      contributionRegistry: decomp.contributionRegistry || decomp.contributions || [],
      coverageComparability: decomp.coverageComparability || null,
      conclusionScope: decomp.conclusionScope || 'full_training',
      sharedFacts: factIds,
      factRegistry: sharedFacts || null,
      informativeValue: 90,
      producer: 'decomposeMonthlyProgramChange',
      phenomenonId: `program_family_volume|${decomp.populationId}|${decomp.window?.start}|${decomp.window?.end}`
    }
  };
}
