/**
 * Premier parcours de restitution visuelle des analyses.
 * Construit un spec structuré depuis les métriques / faits — jamais depuis le texte.
 */

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function observedValue(m, id) {
  const rows = m?.observedValues;
  if (!Array.isArray(rows)) return null;
  const hit = rows.find((r) => r && r.id === id);
  return hit ? num(hit.value) : null;
}

/**
 * Normalise les formes réelles des discoveries publiées vers un dictionnaire plat
 * consommable par les builders (évite les specs morts sur métriques imbriquées).
 */
export function normalizeVisualMetrics(discovery) {
  const raw = discovery?.metrics || {};
  const kind = String(discovery?.kind || '');
  const nestedRel = raw.relativeConcentration && typeof raw.relativeConcentration === 'object'
    ? raw.relativeConcentration
    : null;
  const decomp =
    (raw.composition?.decomposition && typeof raw.composition.decomposition === 'object'
      ? raw.composition.decomposition
      : null) ||
    (raw.ok === true && raw.frequency != null ? raw : null);

  const flat = {
    ...raw,
    ...(nestedRel || {})
  };

  // Volume décomp — champs symmetricDecomposition publiés tels quels
  if (kind === 'disc_composed_volume_decomp' || decomp?.ok) {
    const frequency = num(flat.freqEffect ?? flat.frequencyEffect ?? flat.frequency ?? decomp?.frequency);
    const content = num(flat.contentEffect ?? flat.content ?? decomp?.content);
    const before =
      num(flat.prevReps ?? flat.previousVolume ?? flat.repsBefore) ??
      observedValue(flat, 'repsBefore') ??
      (num(decomp?.sessionsBefore) != null && num(decomp?.repsPerSessionBefore) != null
        ? decomp.sessionsBefore * decomp.repsPerSessionBefore
        : null);
    const after =
      num(flat.curReps ?? flat.recentVolume ?? flat.repsAfter ?? flat.totalReps) ??
      observedValue(flat, 'repsAfter') ??
      (num(decomp?.sessionsAfter) != null && num(decomp?.repsPerSessionAfter) != null
        ? decomp.sessionsAfter * decomp.repsPerSessionAfter
        : null);
    const observed = num(flat.observed ?? flat.netDelta ?? decomp?.observed);
    if (frequency != null) flat.freqEffect = frequency;
    if (content != null) flat.contentEffect = content;
    if (before != null) flat.prevReps = before;
    if (after != null) flat.curReps = after;
    if (observed != null) flat.netDelta = observed;
    if (!flat.visualKind && frequency != null && content != null) {
      flat.visualKind = 'volume_freq_content';
    }
  }

  // Concentration relative — souvent imbriquée sous relativeConcentration
  if (
    kind === 'disc_composed_relative_concentration' ||
    nestedRel ||
    flat.moveShareOfParentWindow != null
  ) {
    if (flat.moveShareOfParentWindow == null && flat.moveShareOfMonth != null) {
      flat.moveShareOfParentWindow = flat.moveShareOfMonth;
    }
    if (flat.globalShareOfParentWindow == null && flat.weekShareOfMonthGlobal != null) {
      flat.globalShareOfParentWindow = flat.weekShareOfMonthGlobal;
    }
    if (flat.moveNames == null && Array.isArray(flat.exercises)) {
      flat.moveNames = flat.exercises;
    }
    if (flat.localReps == null && Array.isArray(flat.observedValues)) {
      // observedValues : exerciseScopedMetricId('reps'|'monthReps', e)
      const scoped = flat.observedValues
        .filter((r) => /reps/i.test(String(r?.id || '')) && !/month/i.test(String(r?.id || '')))
        .map((r) => num(r.value))
        .filter((n) => n != null);
      if (scoped.length) flat.localReps = scoped.reduce((s, n) => s + n, 0);
      const monthScoped = flat.observedValues
        .filter((r) => /monthReps/i.test(String(r?.id || '')))
        .map((r) => num(r.value))
        .filter((n) => n != null);
      if (monthScoped.length) flat.localRepsInParent = monthScoped.reduce((s, n) => s + n, 0);
    }
    if (flat.globalRepsShort == null && flat.totalReps != null) {
      flat.globalRepsShort = flat.totalReps;
    }
    if (
      !flat.visualKind &&
      flat.moveShareOfParentWindow != null &&
      flat.globalShareOfParentWindow != null
    ) {
      flat.visualKind = 'relative_concentration';
    }
  }

  // Trajectoire — sessions déjà sur metrics via trajectoryToMetrics
  if (
    flat.trajectoryPrimaryStory === 'outlier_driven' ||
    flat.composedEvidence?.continuity?.kind === 'isolated_outlier' ||
    flat.visualKind === 'trajectory_sessions' ||
    (Array.isArray(flat.sessionTotals) && flat.sessionTotals.length >= 3)
  ) {
    if (!flat.visualKind && (flat.sessionTotals?.length >= 3 || flat.sessions?.length >= 3)) {
      flat.visualKind = 'trajectory_sessions';
    }
  }

  return flat;
}

/**
 * @typedef {'volume_freq_content'|'relative_concentration'|'trajectory_sessions'|null} VisualInsightKind
 */

/**
 * @param {object} discovery
 * @returns {{ kind: VisualInsightKind, title: string, alt: string, revision: string|null, series: object[], meta: object }|null}
 */
export function buildVisualInsightSpec(discovery) {
  if (!discovery) return null;
  const m = normalizeVisualMetrics(discovery);
  const kind = String(discovery.kind || '');

  const fromExplicit = buildFromExplicitVisualKind(m, discovery);
  if (fromExplicit) return fromExplicit;

  if (
    kind === 'span_volume_vs_frequency' ||
    kind === 'disc_composed_volume_decomp' ||
    /volume_change:from_/.test(String(m.finding || '')) ||
    (m.freqEffect != null && m.contentEffect != null && (m.prevReps != null || m.curReps != null))
  ) {
    const vol = buildVolumeFreqContent(m, discovery);
    if (vol) return vol;
  }
  if (
    kind === 'disc_composed_relative_concentration' ||
    m.visualKind === 'relative_concentration' ||
    (m.moveShareOfParentWindow != null && m.globalShareOfParentWindow != null)
  ) {
    const rel = buildRelativeConcentration(m, discovery);
    if (rel) return rel;
  }
  if (
    m.composedEvidence?.continuity?.kind === 'isolated_outlier' ||
    m.trajectoryPrimaryStory === 'outlier_driven' ||
    m.composedEvidence?.primaryPhenomenon?.primaryStory === 'outlier_driven' ||
    m.visualKind === 'trajectory_sessions' ||
    (Array.isArray(m.composedEvidence?.observations) && m.composedEvidence.observations.length >= 3) ||
    (Array.isArray(m.sessionTotals) && m.sessionTotals.length >= 3) ||
    (Array.isArray(m.sessions) && m.sessions.length >= 3)
  ) {
    const traj = buildTrajectorySessions(m, discovery);
    if (traj) return traj;
  }
  return null;
}

function revisionOf(discovery, m) {
  return (
    m.dataRevision ||
    m.proofRevision ||
    discovery.publicationId ||
    discovery.phenomenonId ||
    discovery.id ||
    null
  );
}

function buildFromExplicitVisualKind(m, discovery) {
  if (m.visualKind === 'volume_freq_content') return buildVolumeFreqContent(m, discovery);
  if (m.visualKind === 'relative_concentration') return buildRelativeConcentration(m, discovery);
  if (m.visualKind === 'trajectory_sessions') return buildTrajectorySessions(m, discovery);
  return null;
}

function buildVolumeFreqContent(m, discovery) {
  const before = num(m.prevReps ?? m.previousVolume ?? m.volumeBefore);
  const after = num(m.curReps ?? m.recentVolume ?? m.volumeAfter ?? m.totalReps);
  const freq = num(m.freqEffect ?? m.frequencyEffect ?? m.freqContribution ?? m.frequency);
  const content = num(m.contentEffect ?? m.contentContribution ?? m.densityEffect ?? m.content);
  const net = num(m.netDelta ?? m.deltaVolume ?? m.observed ?? (after != null && before != null ? after - before : null));
  if (freq == null || content == null) return null;
  // Inconnu ≠ zéro : si avant/après absents, on affiche quand même les contributions.
  const resolvedNet = net != null ? net : freq + content;
  const reconOk = Math.abs(freq + content - resolvedNet) < 1.5;
  const labelBefore = m.labelBefore || m.prevWindowLabel || null;
  const labelAfter = m.labelAfter || m.recentWindowLabel || null;
  const winBefore = m.prevWindow || m.previousWindow || null;
  const winAfter = m.recentWindow || m.window || null;
  return {
    kind: 'volume_freq_content',
    title: 'Décomposition du volume',
    alt: `Volume ${before ?? '?'} → ${after ?? '?'} : contribution fréquence ${freq >= 0 ? '+' : ''}${Math.round(freq)}, contenu ${content >= 0 ? '+' : ''}${Math.round(content)}, net ${resolvedNet >= 0 ? '+' : ''}${Math.round(resolvedNet)}.`,
    revision: revisionOf(discovery, m),
    series: [
      { id: 'before', label: labelBefore || 'Avant', value: before, unit: 'reps' },
      { id: 'freq', label: 'Effet fréquence', value: Math.round(freq), unit: 'reps', role: 'contribution' },
      { id: 'content', label: 'Effet contenu', value: Math.round(content), unit: 'reps', role: 'contribution' },
      { id: 'after', label: labelAfter || 'Après', value: after, unit: 'reps' },
      { id: 'net', label: 'Variation nette', value: Math.round(resolvedNet), unit: 'reps', role: 'net' }
    ],
    meta: {
      windows: { before: winBefore, after: winAfter },
      windowLabels: { before: labelBefore, after: labelAfter },
      comparisonWindows: m.comparisonWindows || null,
      populations: {
        metric: 'total_reps_comparable_windows',
        note: m.population || 'strength_positive_reps_days'
      },
      reconciliationOk: reconOk,
      signed: {
        freq: Math.round(freq),
        content: Math.round(content),
        net: Math.round(resolvedNet)
      }
    }
  };
}

function buildRelativeConcentration(m, discovery) {
  const moveShare = num(m.moveShareOfParentWindow ?? m.localShare ?? m.moveShareOfMonth);
  const globalShare = num(m.globalShareOfParentWindow ?? m.globalShare ?? m.weekShareOfMonthGlobal);
  if (moveShare == null || globalShare == null) return null;
  const movePct = Math.round(moveShare * 1000) / 10;
  const globalPct = Math.round(globalShare * 1000) / 10;
  const names = (m.moveNames || m.exercises || []).filter(Boolean).slice(0, 4);
  return {
    kind: 'relative_concentration',
    title: 'Deux parts, deux dénominateurs',
    alt: `${movePct} % du volume mensuel des mouvements nommés contre ${globalPct} % du volume mensuel total. Dénominateurs distincts.`,
    revision: revisionOf(discovery, m),
    series: [
      {
        id: 'moves',
        label: names.length ? names.join(', ') : 'Mouvements nommés',
        value: movePct,
        unit: 'pct',
        numerator: num(m.localReps),
        denominator: num(m.localRepsInParent),
        population: 'same_moves_nested_windows'
      },
      {
        id: 'global',
        label: 'Volume total',
        value: globalPct,
        unit: 'pct',
        numerator: num(m.globalRepsShort ?? m.totalReps),
        denominator: num(m.globalRepsParent),
        population: 'all_reps_nested_windows'
      }
    ],
    meta: {
      periodLabel: m.periodLabel || null,
      parentPeriodLabel: m.parentPeriodLabel || null,
      ratio: num(m.ratio) ?? (globalShare > 0 ? moveShare / globalShare : null),
      note: 'Les deux barres ne partagent pas le même dénominateur.'
    }
  };
}

function buildTrajectorySessions(m, discovery) {
  const obs =
    m.composedEvidence?.observations ||
    m.sessions?.trace ||
    m.sessionTrace ||
    m.arcSessions ||
    null;
  let points = [];
  if (Array.isArray(obs) && obs.length) {
    points = obs
      .map((o) => ({
        date: o.date || o.ymd || null,
        value: num(o.totalReps ?? o.reps),
        missing: o.missing === true
      }))
      .filter((p) => p.value != null || p.missing);
  } else if (Array.isArray(m.sessionTotals) && m.sessionTotals.length) {
    points = m.sessionTotals.map((v, i) => ({
      date: Array.isArray(m.sessionDates) ? m.sessionDates[i] || null : null,
      value: num(v),
      missing: false
    }));
  } else if (Array.isArray(m.sessions) && m.sessions.length) {
    points = m.sessions
      .map((s) => ({
        date: s.date || null,
        value: num(s.reps ?? s.totalReps),
        missing: false
      }))
      .filter((p) => p.value != null);
  }
  if (points.length < 3) return null;
  const name =
    m.composedEvidence?.primaryPhenomenon?.name ||
    m.name ||
    m.exerciseName ||
    discovery.title?.split(':')[0] ||
    'Exercice';
  const values = points.map((p) => p.value).filter((n) => n != null);
  const last = values[values.length - 1];
  const plateau = values.slice(0, -1);
  const atypical =
    plateau.length >= 3 &&
    last != null &&
    plateau.every((v) => Math.abs(v - plateau[0]) / Math.max(1, plateau[0]) < 0.12) &&
    last <= plateau[0] * 0.85;
  return {
    kind: 'trajectory_sessions',
    title: `${String(name).trim()} — séances`,
    alt: atypical
      ? `Plateau puis séance atypique : ${plateau.map((v) => Math.round(v)).join(', ')}, puis ${Math.round(last)}.`
      : `Séances : ${values.map((v) => Math.round(v)).join(', ')}.`,
    revision: revisionOf(discovery, m),
    series: points.map((p, i) => ({
      id: `s${i}`,
      label: p.date || `#${i + 1}`,
      date: p.date,
      value: p.value,
      unit: 'reps',
      missing: Boolean(p.missing),
      highlight: atypical && i === points.length - 1 ? 'atypical' : null
    })),
    meta: {
      atypical,
      connectMeans: false,
      note: atypical
        ? 'Point final atypique — ne pas lire comme une baisse progressive.'
        : null
    }
  };
}

/** Attache un visualInsight aux métriques si un spec est constructible. */
export function attachVisualInsight(discovery) {
  if (!discovery) return discovery;
  const spec = buildVisualInsightSpec(discovery);
  if (!spec) return discovery;
  return {
    ...discovery,
    metrics: {
      ...(discovery.metrics || {}),
      visualInsight: spec,
      visualKind: spec.kind
    }
  };
}
