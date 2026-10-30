/**
 * Modèle d’affichage / statut pour la console diagnostic.
 * Aucun calcul métier parallèle : dérive uniquement du rapport d’exécution.
 */

import {
  normalizePipelineStages,
  buildPipelineSummary
} from './analysisEnginePipelineModel.js';

/** Statuts métier exclusifs (un candidat = une case). */
export const DIAG_STATUS = {
  SHOWN_NOW: 'shown_now',
  INTERMEDIATE: 'intermediate',
  DEMOTED: 'demoted',
  REJECTED: 'rejected',
  UNKNOWN: 'unknown',
  CROSS: 'cross'
};

export const DIAG_STATUS_META = {
  [DIAG_STATUS.SHOWN_NOW]: {
    label: 'Affichée (run actuel)',
    tone: 'green',
    meaning: 'Présente dans le pack final de cette exécution — pas un historique ancien.'
  },
  [DIAG_STATUS.INTERMEDIATE]: {
    label: 'Candidate intermédiaire',
    tone: 'blue',
    meaning: 'Générée et retenue à une étape, mais pas affichée dans ce run.'
  },
  [DIAG_STATUS.DEMOTED]: {
    label: 'Déclassée / filtrée',
    tone: 'orange',
    meaning: 'Produite puis écartée par caps, rivaux, dédup ou sélection.'
  },
  [DIAG_STATUS.REJECTED]: {
    label: 'Rejet / validation',
    tone: 'red',
    meaning: 'Rejet explicite (données insuffisantes, validation, erreur).'
  },
  [DIAG_STATUS.UNKNOWN]: {
    label: 'Non déterminé',
    tone: 'gray',
    meaning: 'Statut impossible à tracer avec l’instrumentation actuelle.'
  },
  [DIAG_STATUS.CROSS]: {
    label: 'Transversale',
    tone: 'violet',
    meaning: 'Conclusion croisant plusieurs familles de données.'
  }
};

export const DATA_STATUS_META = {
  ok: { label: 'Exploitées', tone: 'green' },
  present_unused: { label: 'Présentes non utilisées', tone: 'blue' },
  sparse: { label: 'Couverture faible', tone: 'orange' },
  invalid: { label: 'Invalides', tone: 'red' },
  missing: { label: 'Manquantes', tone: 'gray' },
  excluded: { label: 'Exclues par règle', tone: 'orange' },
  unknown_origin: { label: 'Provenance inconnue', tone: 'gray' },
  error: { label: 'Erreur lecture', tone: 'red' },
  not_instrumented: { label: 'Non instrumenté', tone: 'gray' }
};

export const STAGE_STATUS_META = {
  ok: { label: 'Exécutée OK', tone: 'green' },
  warn: { label: 'Exécutée avec avertissement', tone: 'orange' },
  error: { label: 'Exécutée en erreur', tone: 'red' },
  skipped: { label: 'Ignorée volontairement', tone: 'blue' },
  na: { label: 'Non applicable', tone: 'gray' },
  not_run: { label: 'Non exécutée', tone: 'gray' },
  untraceable: { label: 'Non traçable', tone: 'gray' }
};

const CROSS_KIND_RE = /sleep|relation\.|cross|corr|x_/i;

/**
 * Mappe un statut brut du pipeline vers un statut console exclusif.
 * `shown` = run actuel uniquement (collectDiagnostic).
 */
export function mapRawStatusToDiag(row) {
  const raw = row?.status || '';
  const reason = String(row?.reason || '');
  const kind = String(row?.kind || '');

  if (raw === 'shown') {
    return CROSS_KIND_RE.test(kind) && /sleep|corr/.test(kind)
      ? DIAG_STATUS.SHOWN_NOW
      : DIAG_STATUS.SHOWN_NOW;
  }
  if (raw === 'discovery_selected') return DIAG_STATUS.INTERMEDIATE;
  if (raw === 'produced') return DIAG_STATUS.INTERMEDIATE;
  if (
    raw === 'discovery_dropped' ||
    reason.includes('ranked_out') ||
    reason.includes('dedup') ||
    reason.includes('discovery_drop') ||
    reason.includes('rival') ||
    reason.includes('cap')
  ) {
    return DIAG_STATUS.DEMOTED;
  }
  if (
    raw === 'rejected' ||
    reason.includes('insufficient') ||
    reason.includes('invalid') ||
    reason.includes('error')
  ) {
    return DIAG_STATUS.REJECTED;
  }
  if (raw === 'discovery_not_selected') return DIAG_STATUS.UNKNOWN;
  return DIAG_STATUS.UNKNOWN;
}

function evidenceCount(row) {
  const m = row?.metrics || {};
  let n = 0;
  if (row?.evidence) n += 1;
  if (Array.isArray(m.evidence)) n += m.evidence.length;
  if (m.nHigh != null || m.highN != null) n += 1;
  if (m.nLow != null || m.lowN != null) n += 1;
  if (m.sampleSize != null) n += 1;
  if (m.days != null) n += 1;
  return n;
}

function sourceHintCount(row) {
  const blob = `${row?.producerHint || ''} ${row?.kind || ''} ${JSON.stringify(row?.metrics || {}).slice(0, 200)}`;
  let n = 0;
  if (/garmin|sleep|dailyMetrics/i.test(blob)) n += 1;
  if (/snapshot|reps|checked/i.test(blob)) n += 1;
  if (/enrichment|completion|gtg/i.test(blob)) n += 1;
  if (/program|assessment/i.test(blob)) n += 1;
  return n || (row?.metrics ? 1 : 0);
}

/**
 * Registre dédupliqué : priorité shown_now > intermediate > demoted > rejected > unknown.
 */
export function buildAnalysisRegistry(report) {
  if (!report) return { rows: [], counts: emptyCounts(), overlapping: {} };

  const priority = {
    [DIAG_STATUS.SHOWN_NOW]: 5,
    [DIAG_STATUS.CROSS]: 5,
    [DIAG_STATUS.INTERMEDIATE]: 4,
    [DIAG_STATUS.DEMOTED]: 3,
    [DIAG_STATUS.REJECTED]: 2,
    [DIAG_STATUS.UNKNOWN]: 1
  };

  const list = [
    ...(report.candidates?.shown || []),
    ...(report.candidates?.produced || []),
    ...(report.candidates?.discoveries || []),
    ...(report.rejections || [])
  ];

  const byKey = new Map();
  list.forEach((raw) => {
    const diagStatus = mapRawStatusToDiag(raw);
    const cross =
      CROSS_KIND_RE.test(String(raw.kind || '')) &&
      (diagStatus === DIAG_STATUS.SHOWN_NOW || diagStatus === DIAG_STATUS.INTERMEDIATE);
    const status = cross && diagStatus === DIAG_STATUS.SHOWN_NOW ? DIAG_STATUS.SHOWN_NOW : diagStatus;
    const key = String(raw.id || `${raw.kind}|${raw.title || ''}`);
    const row = {
      ...raw,
      registryKey: key,
      diagStatus: status,
      diagMeta: DIAG_STATUS_META[status],
      displayScope: status === DIAG_STATUS.SHOWN_NOW ? 'current_run' : 'not_shown_this_run',
      isCrossFamily: Boolean(cross),
      evidenceCount: evidenceCount(raw),
      sourceCount: sourceHintCount(raw),
      crossedFamilies: cross ? estimateCrossedFamilies(raw) : 1,
      generationStage: raw.stage || null,
      finalStageReached: status === DIAG_STATUS.SHOWN_NOW ? 'final' : raw.stage || null,
      moduleHint: raw.producerHint || null,
      decisionReason: raw.reason || (status === DIAG_STATUS.SHOWN_NOW ? 'selected_for_display' : null)
    };
    const prev = byKey.get(key);
    if (!prev || (priority[row.diagStatus] || 0) > (priority[prev.diagStatus] || 0)) {
      byKey.set(key, row);
    }
  });

  const rows = [...byKey.values()].sort((a, b) => {
    const pd = (priority[b.diagStatus] || 0) - (priority[a.diagStatus] || 0);
    if (pd) return pd;
    return String(a.kind).localeCompare(String(b.kind));
  });

  const counts = emptyCounts();
  rows.forEach((r) => {
    counts.total += 1;
    if (r.diagStatus === DIAG_STATUS.SHOWN_NOW) counts.shown_now += 1;
    else if (r.diagStatus === DIAG_STATUS.INTERMEDIATE) counts.intermediate += 1;
    else if (r.diagStatus === DIAG_STATUS.DEMOTED) counts.demoted += 1;
    else if (r.diagStatus === DIAG_STATUS.REJECTED) counts.rejected += 1;
    else counts.unknown += 1;
    if (r.isCrossFamily) counts.cross += 1;
  });

  const overlapping = {
    withoutEvidence: rows.filter((r) => r.evidenceCount === 0).length,
    thinCopy: rows.filter((r) => (r.quality?.flags || []).includes('thin_copy')).length,
    deferred: rows.filter((r) => (r.quality?.flags || []).includes('deferred_reasoning')).length,
    possibleDupes: countPossibleDupes(rows)
  };

  return { rows, counts, overlapping };
}

function emptyCounts() {
  return {
    total: 0,
    shown_now: 0,
    intermediate: 0,
    demoted: 0,
    rejected: 0,
    unknown: 0,
    cross: 0,
    errors: 0
  };
}

function estimateCrossedFamilies(row) {
  const k = String(row.kind || '').toLowerCase();
  let n = 1;
  if (/sleep/.test(k)) n += 1;
  if (/volume|reps|load/.test(k)) n += 1;
  if (/rpe|effort|cardio|run/.test(k)) n += 1;
  return Math.min(n, 3);
}

function countPossibleDupes(rows) {
  const titles = new Map();
  rows.forEach((r) => {
    const t = String(r.title || r.body || '')
      .slice(0, 48)
      .toLowerCase()
      .trim();
    if (!t) return;
    titles.set(t, (titles.get(t) || 0) + 1);
  });
  let n = 0;
  titles.forEach((c) => {
    if (c > 1) n += c;
  });
  return n;
}

/** Relations connues dans l’architecture — statut d’après l’exécution réelle. */
export const ARCHITECTURE_RELATIONS = [
  {
    id: 'sleep_x_volume',
    left: 'sleep',
    right: 'volume',
    label: 'Sommeil ↔ volume / charge',
    kindHints: [/sleep.*volume|sleepVolume|volumeByThreshold|sleepHighLow/i]
  },
  {
    id: 'sleep_x_rpe',
    left: 'sleep',
    right: 'effort',
    label: 'Sommeil ↔ effort perçu (RPE)',
    kindHints: [/sleepPerceived|sleep.*rpe|perceivedEffort/i]
  },
  {
    id: 'sleep_x_cardio',
    left: 'sleep',
    right: 'cardio',
    label: 'Sommeil ↔ cardio',
    kindHints: [/sleepCardio|sleep.*run|sleep.*cardio/i]
  },
  {
    id: 'adherence_x_progression',
    left: 'adherence',
    right: 'exercise',
    label: 'Assiduité ↔ progression',
    kindHints: [/adherence.*progress|completion.*progress|continuity.*pr/i]
  },
  {
    id: 'volume_x_performance',
    left: 'volume',
    right: 'exercise',
    label: 'Volume ↔ performance',
    kindHints: [/volume.*progress|density|peak|decomp/i]
  },
  {
    id: 'program_x_executed',
    left: 'adherence',
    right: 'exercise',
    label: 'Programme prévu ↔ exécuté',
    kindHints: [/completion|pending|program|adherence/i]
  },
  {
    id: 'gtg_x_exercise',
    left: 'gtg',
    right: 'exercise',
    label: 'GTG ↔ travail exercice',
    kindHints: [/gtg/i]
  },
  {
    id: 'body_x_performance',
    left: 'body',
    right: 'exercise',
    label: 'Poids / mensurations ↔ perfs',
    kindHints: [/body|weight|imc|impedance/i]
  },
  {
    id: 'freq_x_progression',
    left: 'rhythm',
    right: 'exercise',
    label: 'Fréquence ↔ progression',
    kindHints: [/freq|rhythm|identity/i]
  }
];

export function buildCorrelationLab(report) {
  const kinds = [];
  (report?.candidates?.shown || []).forEach((r) => kinds.push(r.kind));
  (report?.candidates?.produced || []).forEach((r) => kinds.push(r.kind));
  (report?.candidates?.discoveries || []).forEach((r) => kinds.push(r.kind));
  (report?.signals?.correlations || []).forEach((c) => kinds.push(c.type));
  (report?.signals?.sleepCandidateTypes || []).forEach((t) => kinds.push(t));
  const kindBlob = kinds.filter(Boolean).join('|');

  const data = Object.fromEntries((report?.dataInventory || []).map((d) => [d.id, d]));

  return ARCHITECTURE_RELATIONS.map((rel) => {
    const matchedKinds = kinds.filter((k) => rel.kindHints.some((re) => re.test(String(k))));
    const leftOk = familyDataOk(rel.left, data);
    const rightOk = familyDataOk(rel.right, data);

    let status = 'not_instrumented';
    let certainty = 'low';
    if (matchedKinds.length) {
      status = 'calculated';
      certainty = 'high';
    } else if (!leftOk.present || !rightOk.present) {
      status = 'impossible_with_data';
      certainty = 'medium';
    } else if (leftOk.present && rightOk.present) {
      // Données des deux côtés sans candidat : opportunité ou absente
      status = relationLikelyImplemented(rel) ? 'not_triggered' : 'not_implemented';
      certainty = 'medium';
    }

    return {
      id: rel.id,
      label: rel.label,
      left: rel.left,
      right: rel.right,
      status,
      certainty,
      matchedKinds,
      leftData: leftOk,
      rightData: rightOk,
      note:
        status === 'not_instrumented'
          ? 'Impossible de confirmer hors kinds produits — instrumentation partielle.'
          : status === 'not_triggered'
            ? 'Les deux familles ont des données ; aucun candidat de ce croisement dans ce run.'
            : status === 'not_implemented'
              ? 'Aucun producteur connu n’a émis ce croisement dans l’exécution observée.'
              : status === 'impossible_with_data'
                ? 'Données insuffisantes d’un côté pour évaluer le croisement.'
                : 'Au moins un candidat / signal de ce type a été produit dans ce run.'
    };
  });
}

function familyDataOk(fam, data) {
  const map = {
    sleep: data.sleep,
    volume: data.reps || data.checked,
    exercise: data.reps || data.checked,
    adherence: data.completion || data.dow,
    gtg: data.gtg,
    body: data.weight,
    rhythm: data.dow,
    effort: data.reps,
    cardio: data.sleep
  };
  const row = map[fam];
  if (!row) return { present: false, status: 'not_instrumented', label: fam };
  return {
    present: row.status === 'ok' || row.status === 'sparse',
    status: row.status,
    label: row.label,
    n: row.n
  };
}

function relationLikelyImplemented(rel) {
  return /sleep_x_|gtg_x_|program_x_|volume_x_/.test(rel.id);
}

export function buildFamilyExplorer(report, registryRows = []) {
  // Import lazy via string labels already on rows (familyLabel) when present
  const byFamily = report?.selectionDiagnostics?.byFamily || {};
  const fams = new Set([
    ...Object.keys(byFamily),
    ...registryRows.map((r) => r.family || 'misc')
  ]);
  const shownTotal = registryRows.filter((r) => r.diagStatus === DIAG_STATUS.SHOWN_NOW).length;
  return [...fams]
    .filter(Boolean)
    .map((fam) => {
      const b = byFamily[fam] || {};
      const rows = registryRows.filter((r) => r.family === fam);
      const shown = rows.filter((r) => r.diagStatus === DIAG_STATUS.SHOWN_NOW).length;
      return {
        family: fam,
        familyLabel: rows[0]?.familyLabel || fam,
        produced: b.produced ?? rows.length,
        shown: b.shown ?? shown,
        rejected:
          (b.insufficient_data || 0) +
          (b.deduped || 0) +
          (b.ranked_out || 0),
        intermediate: rows.filter((r) => r.diagStatus === DIAG_STATUS.INTERMEDIATE).length,
        demoted: rows.filter((r) => r.diagStatus === DIAG_STATUS.DEMOTED).length,
        withoutEvidence: rows.filter((r) => r.evidenceCount === 0).length,
        kindsProduced: b.kindsProduced || [],
        kindsShown: b.kindsShown || [],
        shareOfShown: shownTotal > 0 ? shown / shownTotal : 0
      };
    })
    .sort((a, b) => b.shown - a.shown || b.produced - a.produced);
}

export function buildMissingOpportunities(report, correlations, registryRows) {
  const out = [];
  (report?.overview?.starvedFamilies || []).forEach((f) => {
    out.push({
      id: `starved:${f.family}`,
      kind: 'starved_family',
      label: `Famille « ${f.family} » produite mais 0 affichée`,
      signal: `${f.produced || 0} candidats produits`,
      family: f.family,
      reason: 'produced_then_eliminated',
      certainty: 'high',
      detail: f
    });
  });

  (correlations || []).forEach((c) => {
    if (c.status === 'not_triggered') {
      out.push({
        id: `gap:${c.id}`,
        kind: 'relation_not_triggered',
        label: c.label,
        signal: `Données ${c.left} + ${c.right} présentes`,
        family: `${c.left}×${c.right}`,
        reason: 'rule_not_triggered_or_filtered',
        certainty: c.certainty,
        detail: c
      });
    } else if (c.status === 'not_implemented') {
      out.push({
        id: `absent:${c.id}`,
        kind: 'relation_absent',
        label: c.label,
        signal: `Données ${c.left} + ${c.right} présentes`,
        family: `${c.left}×${c.right}`,
        reason: 'feature_absent_in_run',
        certainty: c.certainty,
        detail: c
      });
    } else if (c.status === 'impossible_with_data') {
      out.push({
        id: `data:${c.id}`,
        kind: 'insufficient_data',
        label: c.label,
        signal: 'Couverture insuffisante',
        family: `${c.left}×${c.right}`,
        reason: 'insufficient_data',
        certainty: c.certainty,
        detail: c
      });
    }
  });

  const shownKinds = new Set(
    registryRows.filter((r) => r.diagStatus === DIAG_STATUS.SHOWN_NOW).map((r) => r.kind)
  );
  const producedOnly = registryRows.filter(
    (r) =>
      r.diagStatus === DIAG_STATUS.INTERMEDIATE ||
      r.diagStatus === DIAG_STATUS.DEMOTED ||
      r.diagStatus === DIAG_STATUS.REJECTED
  );
  if (producedOnly.length && shownKinds.size < 3) {
    out.push({
      id: 'narrow_pack',
      kind: 'selection_narrow',
      label: 'Pack final étroit vs volume de candidats',
      signal: `${producedOnly.length} non affichés · ${shownKinds.size} kinds affichés`,
      family: 'selection',
      reason: 'candidate_then_eliminated',
      certainty: 'medium',
      detail: { producedOnly: producedOnly.length, shownKinds: [...shownKinds] }
    });
  }

  return out;
}

export function buildStageStatuses(stages = []) {
  // Délègue au modèle pipeline (unités, timings, pertes typées).
  // Import dynamique évité : fonction pure locale miroir — enrichDiagnosticReport
  // appelle aussi normalize via pipelineSummary quand disponible.
  return stages.map((st, index) => {
    let status = 'ok';
    if (st.executed === false && st.errors?.length) status = 'error';
    else if (st.executed === false && st.skippedReason) status = 'skipped';
    else if (st.executed === false) status = 'not_run';
    else if (st.errors?.length) status = 'error';
    else if (st.warnings?.length) status = 'warn';
    else if (st.executed !== false && st.outCount == null && st.inCount == null && st.ms == null) {
      status = 'untraceable';
    }
    const countsComparable =
      st.inCount != null &&
      st.outCount != null &&
      st.countUnit !== 'bundle' &&
      st.countUnit !== 'unknown';
    const dropped =
      st.dropped ??
      st.filtered ??
      (countsComparable && st.inCount >= st.outCount ? st.inCount - st.outCount : null);
    return {
      ...st,
      order: index + 1,
      stageStatus: status,
      stageMeta: STAGE_STATUS_META[status],
      droppedApprox: dropped,
      countsComparable,
      hasTiming: st.ms != null,
      technicallyExecuted: st.executed !== false,
      functionallyOk:
        st.executed !== false && !st.errors?.length && status !== 'untraceable' && status !== 'warn'
    };
  });
}

export function buildDataCoverageInsights(dataInventory = []) {
  const byId = Object.fromEntries(dataInventory.map((d) => [d.id, d]));
  const insights = [];
  const push = (id, text, kind) => insights.push({ id, text, kind });

  if (byId.checked?.status === 'ok' && byId.reps?.status === 'ok' && (byId.reps.n || 0) < 5) {
    push('few_perfs', 'Exercices cochés présents, mais peu de performances exploitables.', 'coverage');
  }
  if (byId.weight?.status === 'sparse') {
    push('weight_sparse', 'Historique de poids présent mais trop mince pour une tendance fiable.', 'coverage');
  }
  if (byId.weight?.status === 'missing') {
    push('weight_missing', 'Aucune mesure de poids / mensurations dans le snapshot.', 'absence');
  }
  if (byId.sleep?.status === 'missing') {
    push('sleep_missing', 'Sommeil absent : corrélations sommeil impossibles sur ce run.', 'absence');
  } else if (byId.sleep?.status === 'sparse' || (byId.sleep?.n || 0) < 8) {
    push(
      'sleep_thin',
      'Sommeil présent mais couverture probablement insuffisante pour des croisements robustes.',
      'coverage'
    );
  }
  if (byId.gtg?.status === 'ok' && byId.completion?.status === 'missing') {
    push('gtg_no_program', 'GTG présent alors que la complétion programme est absente / sparse.', 'coverage');
  }
  if (byId.dow?.status === 'ok' && byId.completion?.status === 'sparse') {
    push(
      'assiduity_vs_completion',
      'Assiduité partielle disponible ; complétion programme peu exploitable.',
      'coverage'
    );
  }
  return insights;
}

export const TECHNICAL_LIMITS = [
  {
    id: 'no_prior_run_memory',
    text: 'Le vert = pack de CE run diagnostic. La comparaison avec un run métier précédent (insight history) n’est pas branchée ici.'
  },
  {
    id: 'evidence_heuristic',
    text: 'Le nombre de preuves / sources est heuristique à partir des metrics exposées — pas un compteur moteur officiel.'
  },
  {
    id: 'relation_matrix_partial',
    text: 'La matrice de corrélations croise kinds observés et relations d’architecture ; « non implémenté » = aucun kind de ce type dans ce run, pas une preuve d’absence totale du code.'
  },
  {
    id: 'pipeline_drop_counts',
    text: 'Pertes = in−out seulement si les compteurs sont de même unité (candidats). Assessment/enrichment exposent des agrégats (bundle=1), pas des cartes — ne pas les comparer aux étapes candidats.'
  },
  {
    id: 'pipeline_timing_scope',
    text: 'Les durées des sous-étapes adaptive (composed→select) sont chronométrées dans collectDiagnostic ; assessment/enrichment le sont au niveau diagnostic. Une étape « exécutée OK » ≠ conclusion métier correcte.'
  },
  {
    id: 'data_consumed_partial',
    text: '« Enregistrements consommés » par famille n’est pas encore tracé finement — l’inventaire expose disponibilités, pas le lineage record→insight.'
  }
];

export function enrichDiagnosticReport(report) {
  if (!report) return null;
  const registry = buildAnalysisRegistry(report);
  const correlations = buildCorrelationLab(report);
  const families = buildFamilyExplorer(report, registry.rows);
  const opportunities = buildMissingOpportunities(report, correlations, registry.rows);
  const stages = normalizePipelineStages(report.stages || []).map((st) => ({
    ...st,
    stageMeta: STAGE_STATUS_META[st.stageStatus] || STAGE_STATUS_META.untraceable
  }));
  const pipelineSummary = buildPipelineSummary(stages);
  const coverage = buildDataCoverageInsights(report.dataInventory || []);
  return {
    ...report,
    registry,
    correlations,
    families,
    opportunities,
    stagesDetailed: stages,
    pipelineSummary,
    coverageInsights: coverage,
    limits: TECHNICAL_LIMITS,
    statusLegend: DIAG_STATUS_META,
    dataStatusLegend: DATA_STATUS_META,
    stageStatusLegend: STAGE_STATUS_META
  };
}
