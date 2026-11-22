/**
 * Contexte programmatique transversal (Mission 11–16).
 * Relie une variation de volume réalisée aux variantes prescrites
 * avant de conclure à un recul/progression de capacité.
 *
 * Mission 16 : le programme modifie la thèse, pas seulement le paragraphe final.
 */

import { buildProgramSessionGraph, extractSessionTemplates } from './sessionStructureGraph';
import { matchSessionToProgramSlot } from './sessionSlotMatching';

function normName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function fmtInt(n) {
  return Math.round(Number(n) || 0).toLocaleString('fr-FR');
}

/**
 * Cherche si un mouvement apparaît avec des prescriptions différentes
 * dans deux créneaux apparentés (variantes de séance).
 */
export function findProgrammedVolumeVariants(activeProgram, exerciseNameOrId) {
  const templates = extractSessionTemplates(activeProgram);
  const graph = buildProgramSessionGraph(activeProgram);
  if (!graph.available || !templates.length) {
    return {
      available: false,
      reason: 'no_program_graph',
      variants: []
    };
  }

  const needle = normName(exerciseNameOrId);
  const needleId = String(exerciseNameOrId || '');
  const hits = [];

  templates.forEach((tpl) => {
    (tpl.exercises || []).forEach((ex) => {
      const n = normName(ex?.name || ex?.exerciseName);
      const id = String(ex?.originalId ?? ex?.id ?? ex?.exerciseId ?? '');
      if (!n && !id) return;
      const match =
        (needle && n && (n === needle || n.includes(needle) || needle.includes(n))) ||
        (needleId && id && id === needleId);
      if (!match) return;
      const series = String(ex?.series || '').trim();
      const planned = (() => {
        const m = series.match(/(\d+)\s*[×xX*]\s*(\d+)/);
        if (m) return Number(m[1]) * Number(m[2]);
        return Number(ex?.plannedReps) || 0;
      })();
      hits.push({
        dayKey: tpl.dayKey,
        sessionName: tpl.name,
        exerciseName: ex?.name || ex?.exerciseName || n,
        series: series || null,
        plannedReps: planned,
        familyId:
          (graph.families || []).find((f) => f.members.includes(tpl.dayKey))?.familyId || null
      });
    });
  });

  if (hits.length < 2) {
    return {
      available: hits.length === 1,
      reason: hits.length === 1 ? 'single_prescription' : 'not_in_program',
      variants: hits
    };
  }

  const plannedSet = new Set(hits.map((h) => `${h.series}|${h.plannedReps}`));
  const distinctPrescriptions = plannedSet.size >= 2;
  const sameFamily = hits.every((h) => h.familyId && h.familyId === hits[0].familyId);

  return {
    available: true,
    reason: distinctPrescriptions
      ? sameFamily
        ? 'programmed_variants_same_family'
        : 'programmed_variants_distinct_slots'
      : 'same_prescription_repeated',
    distinctPrescriptions,
    sameFamily,
    variants: hits,
    implication: distinctPrescriptions
      ? 'Une variation de volume réalisé peut refléter le passage entre variantes prescrites, pas un changement de capacité.'
      : null
  };
}

/**
 * Apparie une réalisation (reps) à la prescription la plus proche.
 * Ne s'appuie pas sur le jour de la semaine.
 */
export function matchRealizationToPrescription(realizedReps, variants = []) {
  const reps = Number(realizedReps);
  const usable = (variants || []).filter((v) => Number(v.plannedReps) > 0);
  if (!Number.isFinite(reps) || !usable.length) {
    return { status: 'unknown', variant: null, distance: null };
  }
  const scored = usable
    .map((v) => ({
      variant: v,
      distance: Math.abs(reps - Number(v.plannedReps)),
      rel: Math.abs(reps - Number(v.plannedReps)) / Number(v.plannedReps)
    }))
    .sort((a, b) => a.distance - b.distance);
  const best = scored[0];
  const second = scored[1];
  if (best.rel > 0.35) {
    return { status: 'unknown_variant', variant: null, distance: best.distance, candidates: scored.slice(0, 2) };
  }
  if (second && best.distance === second.distance) {
    return {
      status: 'ambiguous',
      variant: best.variant,
      distance: best.distance,
      candidates: scored.slice(0, 2)
    };
  }
  return {
    status: best.rel <= 0.12 ? 'explicit_near' : 'inferred',
    variant: best.variant,
    distance: best.distance,
    candidates: scored.slice(0, 2)
  };
}

/**
 * Décompose une variation globale en mélange de variantes vs évolution intra-variante.
 *
 * Exemple attendu :
 * - Variante A 36 reps stable, B 50 reps stable
 * - Plus de A récemment → moyenne globale baisse ≠ recul de capacité
 */
export function decomposeVariantMixChange({
  sessions = [],
  variants = [],
  windowStart = null,
  windowEnd = null,
  splitDate = null
} = {}) {
  const usableVariants = (variants || []).filter((v) => Number(v.plannedReps) > 0);
  if (usableVariants.length < 2) {
    return {
      coverage: 'method_unavailable',
      reason: 'fewer_than_two_prescriptions',
      thesis: null
    };
  }

  const dated = (sessions || [])
    .map((s) => ({
      date: String(s.date || s.ymd || '').slice(0, 10),
      reps: Number(s.totalReps ?? s.reps ?? s.realizedReps),
      dayKey: s.dayKey || s.sessionFamilyId || s.slotDayKey || null,
      sessionName: s.sessionName || null
    }))
    .filter((s) => s.date && Number.isFinite(s.reps) && s.reps > 0)
    .filter((s) => (!windowStart || s.date >= windowStart) && (!windowEnd || s.date <= windowEnd))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (dated.length < 2) {
    return { coverage: 'under_explored', reason: 'insufficient_sessions', thesis: null };
  }

  const mid =
    splitDate ||
    dated[Math.floor(dated.length / 2)]?.date ||
    dated[0].date;
  const before = dated.filter((s) => s.date < mid);
  const after = dated.filter((s) => s.date >= mid);
  if (before.length < 1 || after.length < 1) {
    return { coverage: 'under_explored', reason: 'no_temporal_split', thesis: null };
  }

  const labelOf = (v) => v.series || `${v.plannedReps} reps` || v.sessionName || v.dayKey;
  const matchSession = (s) => {
    // Mission 19 : indice indépendant du volume d’abord (créneau / nom de séance).
    if (s.dayKey) {
      const bySlot = usableVariants.find(
        (v) => String(v.dayKey) === String(s.dayKey) || String(v.sessionName) === String(s.dayKey)
      );
      if (bySlot) return { variant: bySlot, status: 'slot_matched', method: 'slot' };
    }
    if (s.sessionName) {
      const byName = usableVariants.find(
        (v) =>
          String(v.sessionName || '')
            .toLowerCase()
            .includes(String(s.sessionName).toLowerCase().slice(0, 12))
      );
      if (byName) return { variant: byName, status: 'session_name_matched', method: 'session_name' };
    }
    const vol = matchRealizationToPrescription(s.reps, usableVariants);
    return { ...vol, method: 'volume_proximity' };
  };
  let independentMatches = 0;
  let volumeOnlyMatches = 0;
  const bucket = (list) => {
    const byKey = new Map();
    let unknown = 0;
    list.forEach((s) => {
      const m = matchSession(s);
      if (m.method === 'slot' || m.method === 'session_name') independentMatches += 1;
      else if (m.method === 'volume_proximity' && m.variant) volumeOnlyMatches += 1;
      if (!m.variant || m.status === 'unknown_variant') {
        unknown += 1;
        return;
      }
      const key = labelOf(m.variant);
      const cur = byKey.get(key) || {
        key,
        plannedReps: Number(m.variant.plannedReps),
        series: m.variant.series,
        sessionName: m.variant.sessionName,
        count: 0,
        repsSum: 0,
        matchStatus: m.status,
        matchMethod: m.method
      };
      cur.count += 1;
      cur.repsSum += s.reps;
      byKey.set(key, cur);
    });
    return { byKey, unknown, n: list.length };
  };

  const b = bucket(before);
  const a = bucket(after);
  const keys = [...new Set([...b.byKey.keys(), ...a.byKey.keys()])];

  const withinDeltas = keys.map((key) => {
    const pb = b.byKey.get(key);
    const pa = a.byKey.get(key);
    const meanB = pb && pb.count ? pb.repsSum / pb.count : null;
    const meanA = pa && pa.count ? pa.repsSum / pa.count : null;
    const shareB = pb && b.n ? pb.count / b.n : 0;
    const shareA = pa && a.n ? pa.count / a.n : 0;
    return {
      key,
      plannedReps: pb?.plannedReps ?? pa?.plannedReps,
      series: pb?.series ?? pa?.series,
      meanBefore: meanB,
      meanAfter: meanA,
      withinDelta:
        meanB != null && meanA != null && meanB > 0 ? ((meanA - meanB) / meanB) * 100 : null,
      shareBefore: shareB,
      shareAfter: shareA,
      shareDelta: shareA - shareB,
      countBefore: pb?.count || 0,
      countAfter: pa?.count || 0
    };
  });

  const mean = (list) =>
    list.length ? list.reduce((s, x) => s + x.reps, 0) / list.length : null;
  const globalBefore = mean(before);
  const globalAfter = mean(after);
  const globalDeltaPct =
    globalBefore > 0 && globalAfter != null
      ? ((globalAfter - globalBefore) / globalBefore) * 100
      : null;

  const knownShare =
    (a.n - a.unknown + (b.n - b.unknown)) / Math.max(1, a.n + b.n);
  if (knownShare < 0.5) {
    return {
      coverage: 'under_explored',
      reason: 'too_many_unknown_variants',
      thesis: 'unknown_variant',
      globalBefore,
      globalAfter,
      globalDeltaPct,
      withinDeltas,
      unknownBefore: b.unknown,
      unknownAfter: a.unknown
    };
  }

  const withBoth = withinDeltas.filter(
    (d) => d.countBefore >= 1 && d.countAfter >= 1 && d.withinDelta != null
  );
  const mixShift = withinDeltas.some((d) => Math.abs(d.shareDelta) >= 0.2);
  // Proche de la prescription appariée ⇒ volume « conforme » à la variante, pas un dérive interne.
  const nearPrescription = [...b.byKey.values(), ...a.byKey.values()].every((v) => {
    const mean = v.count ? v.repsSum / v.count : null;
    return mean != null && Math.abs(mean - v.plannedReps) / v.plannedReps <= 0.12;
  });
  const withinStable =
    withBoth.length >= 1
      ? withBoth.every((d) => Math.abs(d.withinDelta) < 12)
      : nearPrescription;
  const withinDecline =
    withBoth.length >= 1 && withBoth.every((d) => d.withinDelta <= -10);
  const withinRise =
    withBoth.length >= 1 && withBoth.every((d) => d.withinDelta >= 10);

  let thesis = 'inconclusive';
  if (
    mixShift &&
    withinStable &&
    !withinDecline &&
    globalDeltaPct != null &&
    Math.abs(globalDeltaPct) >= 8
  ) {
    // Mélange change, volumes individuels stables (ou absents d’un côté mais conformes prescription)
    thesis = 'variant_mix_shift';
  } else if (withinDecline && !mixShift) {
    thesis = 'within_variant_decline';
  } else if (withinRise && mixShift && globalDeltaPct != null && globalDeltaPct < 0) {
    thesis = 'mix_shift_masks_individual_rise';
  } else if (withinDecline && mixShift) {
    thesis = 'mixed_decline_and_mix';
  } else if (withinRise && !mixShift) {
    thesis = 'within_variant_rise';
  }

  // Mission 19 : interdit de conclure « le mélange explique le volume » si l’appariement
  // repose uniquement sur la proximité de ce même volume (circularité).
  const circularRisk = independentMatches === 0 && volumeOnlyMatches > 0;
  if (thesis === 'variant_mix_shift' && circularRisk) {
    thesis = 'inconclusive';
  }

  return {
    coverage: thesis === 'inconclusive' ? 'under_explored' : 'concluded',
    thesis,
    splitDate: mid,
    globalBefore,
    globalAfter,
    globalDeltaPct,
    withinDeltas,
    mixShift,
    withinStable,
    unknownBefore: b.unknown,
    unknownAfter: a.unknown,
    beforeCount: before.length,
    afterCount: after.length,
    independentMatches,
    volumeOnlyMatches,
    circularRisk,
    reason: circularRisk && thesis === 'inconclusive' ? 'circular_volume_assignment' : null
  };
}

function proseForMix(decomp, ctx) {
  if (!decomp || decomp.coverage !== 'concluded') return null;
  const parts = (ctx?.variants || [])
    .slice(0, 4)
    .map((v) => {
      const slot = v.sessionName || v.dayKey || 'créneau';
      const series = v.series || (v.plannedReps ? `${v.plannedReps} reps prescrites` : null);
      return series ? `${slot} : ${series}` : null;
    })
    .filter(Boolean);

  const deltaBit =
    decomp.globalDeltaPct != null
      ? `La moyenne globale passe d’environ ${fmtInt(decomp.globalBefore)} à ${fmtInt(
          decomp.globalAfter
        )} répétitions (${decomp.globalDeltaPct >= 0 ? '+' : ''}${Math.round(decomp.globalDeltaPct)} %).`
      : '';

  const withinBits = (decomp.withinDeltas || [])
    .filter((d) => d.countBefore + d.countAfter >= 1)
    .slice(0, 4)
    .map((d) => {
      const share = `part ${(d.shareBefore * 100).toFixed(0)} % → ${(d.shareAfter * 100).toFixed(0)} %`;
      if (d.meanBefore != null && d.meanAfter != null) {
        return `${d.key || d.series} : ${fmtInt(d.meanBefore)} → ${fmtInt(d.meanAfter)} reps/séance (${share})`;
      }
      return `${d.key || d.series} : ${share}`;
    });

  if (decomp.thesis === 'variant_mix_shift') {
    const dir = Number(decomp.globalDeltaPct);
    const lead =
      dir > 0
        ? 'La hausse de moyenne ne traduit pas une progression de capacité sur chaque variante.'
        : dir < 0
          ? 'La baisse de moyenne ne traduit pas un recul de capacité sur chaque variante.'
          : 'La moyenne globale reste proche, mais la répartition entre variantes change.';
    const unknownBit =
      (decomp.unknownBefore || 0) + (decomp.unknownAfter || 0) > 0
        ? ` Occurrences non appariées : ${decomp.unknownBefore || 0} avant, ${decomp.unknownAfter || 0} après (${Math.round(
            (((decomp.unknownBefore || 0) + (decomp.unknownAfter || 0)) /
              Math.max(1, (decomp.beforeCount || 0) + (decomp.afterCount || 0))) *
              100
          )} %).`
        : '';
    return [
      lead,
      deltaBit,
      'Les volumes individuels restent proches de leurs prescriptions ; c’est surtout la répartition entre variantes qui change.',
      withinBits.length ? `Détail : ${withinBits.join(' ; ')}.` : null,
      unknownBit || null,
      parts.length >= 2 ? `Prescriptions documentées — ${parts.join(' ; ')}.` : null
    ]
      .filter(Boolean)
      .join(' ');
  }
  if (decomp.thesis === 'within_variant_decline') {
    return [
      'La baisse se retrouve à l’intérieur des variantes comparables, pas seulement dans le mélange.',
      deltaBit,
      withinBits.length ? `Détail : ${withinBits.join(' ; ')}.` : null,
      parts.length >= 2 ? `Prescriptions documentées — ${parts.join(' ; ')}.` : null
    ]
      .filter(Boolean)
      .join(' ');
  }
  if (decomp.thesis === 'mix_shift_masks_individual_rise') {
    return [
      'Chaque variante comparable progresse, mais le mélange récent tire la moyenne globale vers le bas.',
      deltaBit,
      withinBits.length ? `Détail : ${withinBits.join(' ; ')}.` : null
    ]
      .filter(Boolean)
      .join(' ');
  }
  if (decomp.thesis === 'within_variant_rise') {
    return [
      'La hausse se lit à l’intérieur des variantes comparables.',
      deltaBit,
      withinBits.length ? `Détail : ${withinBits.join(' ; ')}.` : null
    ]
      .filter(Boolean)
      .join(' ');
  }
  if (decomp.thesis === 'mixed_decline_and_mix') {
    return [
      'À la fois le mélange de variantes et les volumes individuels évoluent : les deux leviers sont documentés.',
      deltaBit,
      withinBits.length ? `Détail : ${withinBits.join(' ; ')}.` : null
    ]
      .filter(Boolean)
      .join(' ');
  }
  return null;
}

/**
 * Une réécriture mix n’est applicable que si la carte mesure déjà un volume/moyenne
 * de séance — pas une part musculaire, une émergence pure, etc.
 */
export function isVariantMixCompatibleDiscovery(discovery) {
  const kind = String(discovery?.kind || '');
  const title = String(discovery?.title || '');
  const body = String(discovery?.body || '');
  const blob = `${kind} ${title} ${body}`;
  if (/s'efface|part musculaire|family_fade|disc_family_fade|muscle_share|poussée|tirage/i.test(blob)) {
    return false;
  }
  if (/disc_format_consolidation/i.test(kind) && /resumed_former_level|partial_resume/i.test(String(discovery?.metrics?.mechanism || ''))) {
    // Reprise de format ≠ analyse de mélange ; ne pas greffer.
    return false;
  }
  if (
    /disc_exercise_progress|disc_ms_|disc_emergence|decline|recul|baisse|hausse|volume moyen|progression|volume par séance/i.test(
      blob
    )
  ) {
    return true;
  }
  return /volume|reps\/séance|moyenne/i.test(blob);
}

/**
 * Intègre les prescriptions distinctes dans le raisonnement.
 * Si des séances sont fournies, peut changer la thèse (mix vs capacité).
 */
export function rewriteTrajectoryWithPrescriptions(discovery, activeProgram, opts = {}) {
  if (!discovery || !activeProgram) return discovery;
  if (!isVariantMixCompatibleDiscovery(discovery)) return discovery;
  const name = discovery?.metrics?.exerciseName || discovery?.metrics?.name || null;
  const id = discovery?.metrics?.exerciseId || null;
  const ctx = findProgrammedVolumeVariants(activeProgram, name || id);
  if (!ctx.distinctPrescriptions || !ctx.variants?.length) return discovery;

  const sessions = opts.sessions || discovery?.metrics?.exerciseSessions || [];
  const decomp =
    sessions.length >= 2
      ? decomposeVariantMixChange({
          sessions,
          variants: ctx.variants,
          windowStart: opts.windowStart || discovery?.metrics?.windowStart || null,
          windowEnd: opts.windowEnd || discovery?.metrics?.windowEnd || null,
          splitDate: opts.splitDate || null
        })
      : null;

  const mixProse = proseForMix(decomp, ctx);
  if (mixProse && decomp?.thesis === 'variant_mix_shift') {
    const dir = Number(decomp.globalDeltaPct);
    const dirLabel =
      dir > 0 ? 'hausse' : dir < 0 ? 'baisse' : 'redistribution';
    const exerciseLabel =
      name ||
      String(discovery.title || '')
        .split(':')[0]
        .replace(/\s*\(.*$/, '')
        .trim() ||
      'Cet exercice';
    const title = `${exerciseLabel} : le mélange de variantes explique la ${dirLabel} de moyenne`;
    return {
      ...discovery,
      title,
      body: mixProse,
      text: mixProse,
      kind: discovery.kind === 'disc_format_consolidation' ? discovery.kind : 'disc_variant_mix_shift',
      family: 'program_variant_mix',
      metrics: {
        ...(discovery.metrics || {}),
        // Empêche F4 de reconstruire un titre/corps de trajectoire incompatible avec la thèse.
        trajectoryOk: false,
        programVariantContext: ctx,
        variantMixDecomposition: decomp,
        composition: 'program_variant_mix_explains',
        thesis: 'variant_mix_shift',
        certainty: 'supported',
        publishDecision: 'keep_as_program_explanation',
        informativeValue: Math.max(Number(discovery.metrics?.informativeValue) || 0, 92),
        observedValues: [
          ...(Array.isArray(discovery.metrics?.observedValues)
            ? discovery.metrics.observedValues
            : []),
          ...(decomp.globalBefore != null
            ? [{ id: 'meanBefore', value: decomp.globalBefore, unit: 'reps' }]
            : []),
          ...(decomp.globalAfter != null
            ? [{ id: 'meanAfter', value: decomp.globalAfter, unit: 'reps' }]
            : []),
          ...(decomp.globalDeltaPct != null
            ? [{ id: 'globalDeltaPct', value: Math.round(decomp.globalDeltaPct), unit: 'pct' }]
            : [])
        ],
        limitations: [
          ...(discovery.metrics?.limits || discovery.limitations || []),
          'variant_assignment_by_volume_proximity'
        ]
      },
      limitations: [
        ...(discovery.limitations || []),
        'variant_assignment_by_volume_proximity'
      ],
      weights: {
        ...(discovery.weights || {}),
        importance: Math.max(Number(discovery.weights?.importance) || 0, 0.94),
        novelty: Math.max(Number(discovery.weights?.novelty) || 0, 0.9)
      }
    };
  }

  if (mixProse && (decomp?.thesis === 'within_variant_decline' || decomp?.thesis === 'within_variant_rise')) {
    const bodyCore = String(discovery.body || '')
      .replace(/\s*Attention : ce mouvement a des prescriptions[\s\S]*$/i, '')
      .replace(/\s*Prescriptions documentées du programme actuel[\s\S]*$/i, '')
      .replace(/\s*La baisse de moyenne ne traduit pas[\s\S]*$/i, '')
      .trim();
    const composed = `${bodyCore} ${mixProse}`.trim();
    return {
      ...discovery,
      body: composed,
      text: composed,
      metrics: {
        ...(discovery.metrics || {}),
        programVariantContext: ctx,
        variantMixDecomposition: decomp,
        composition: 'program_within_variant_change',
        thesis: decomp.thesis,
        certainty: 'supported',
        observedValues: [
          ...(Array.isArray(discovery.metrics?.observedValues)
            ? discovery.metrics.observedValues
            : []),
          ...(decomp.globalDeltaPct != null
            ? [{ id: 'globalDeltaPct', value: Math.round(decomp.globalDeltaPct), unit: 'pct' }]
            : [])
        ]
      }
    };
  }

  // Fallback : prescriptions documentées sans séances appariables — ouvre les hypothèses, sans forcer.
  const parts = ctx.variants
    .slice(0, 4)
    .map((v) => {
      const slot = v.sessionName || v.dayKey || 'créneau';
      const series = v.series || (v.plannedReps ? `${v.plannedReps} reps prescrites` : null);
      return series ? `${slot} : ${series}` : null;
    })
    .filter(Boolean);

  if (parts.length < 2) return discovery;

  const observed = Number(discovery?.metrics?.repsNow ?? discovery?.metrics?.lastReps);
  const observedBit = Number.isFinite(observed)
    ? ` Le volume observé (${fmtInt(observed)} répétitions) correspond potentiellement à l’une de ces prescriptions, pas à un recul de capacité.`
    : ' Une baisse de répétitions peut donc refléter le passage d’une variante à l’autre, sans démontrer un recul de capacité.';

  const bodyCore = String(discovery.body || '')
    .replace(/\s*Attention : ce mouvement a des prescriptions[\s\S]*$/i, '')
    .replace(/\s*Prescriptions documentées du programme actuel[\s\S]*$/i, '')
    .trim();

  const composed = `${bodyCore} Prescriptions documentées du programme actuel — ${parts.join(' ; ')}.${observedBit} Sans appariement séance↔créneau ni série de volumes par variante, les hypothèses restent ouvertes.`;

  return {
    ...discovery,
    body: composed,
    text: composed,
    metrics: {
      ...(discovery.metrics || {}),
      programVariantContext: ctx,
      variantMixDecomposition: decomp || null,
      composition: 'program_prescription_compare',
      limitations: [
        ...(discovery.metrics?.limits || discovery.limitations || []),
        'program_variant_confounder',
        sessions.length < 2 ? 'no_session_series_for_mix' : 'mix_inconclusive',
        'no_slot_matching'
      ]
    },
    limitations: [...(discovery.limitations || []), 'program_variant_confounder']
  };
}

/**
 * Annote une découverte de trajectoire si une explication programmatique existe.
 * Peut modifier thèse, certitude et publication lorsque le mélange de variantes explique la variation.
 */
export function annotateTrajectoryWithProgramContext(discovery, activeProgram, opts = {}) {
  let next = rewriteTrajectoryWithPrescriptions(discovery, activeProgram, opts);
  if (!opts.realizedSession || !activeProgram) return next;
  const match = matchSessionToProgramSlot(opts.realizedSession, activeProgram, {
    allowProbable: true
  });
  if (
    !['matched_proven', 'partial_session', 'matched_probable', 'multiple_compatible_variants'].includes(
      match.status
    )
  ) {
    return {
      ...next,
      metrics: { ...(next.metrics || {}), slotMatch: match }
    };
  }
  const primary = match.primary || match.candidates?.[0];
  const body = String(next.body || '');
  if (/créneau|variante appariée|prescription documentée|mélange de variantes/i.test(body)) {
    return { ...next, metrics: { ...(next.metrics || {}), slotMatch: match } };
  }
  const slotBit = primary
    ? ` Contexte de séance ${match.certainty === 'supported' ? 'apparié' : 'probable'} : ${
        primary.sessionName || primary.dayKey
      } (chevauchement ${(primary.overlap * 100).toFixed(0)} %).`
    : '';
  return {
    ...next,
    body: `${body}${slotBit}`.trim(),
    text: `${body}${slotBit}`.trim(),
    metrics: {
      ...(next.metrics || {}),
      slotMatch: match,
      composition: next.metrics?.composition || 'slot_matched_trajectory'
    }
  };
}

/**
 * Extrait les séances d’un exercice depuis un catalogue de séances.
 */
export function sessionsForExerciseFromCatalog(catalog = [], exerciseId = null, exerciseName = null) {
  const id = exerciseId != null ? String(exerciseId) : null;
  const needle = normName(exerciseName);
  const out = [];
  (catalog || []).forEach((session) => {
    const date = String(session.date || session.ymd || '').slice(0, 10);
    if (!date) return;
    (session.exercises || []).forEach((ex) => {
      const exId = String(ex.id || ex.exerciseId || '');
      const exName = normName(ex.name || ex.exerciseName);
      const hit =
        (id && exId && exId === id) ||
        (needle && exName && (exName === needle || exName.includes(needle) || needle.includes(exName)));
      if (!hit) return;
      const reps = Number(ex.reps ?? ex.totalReps ?? ex.realizedReps);
      if (!Number.isFinite(reps) || reps <= 0) return;
      out.push({
        date,
        totalReps: reps,
        exercises: session.exercises
      });
    });
  });
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
