/**
 * Export dossier d’investigation complet (hors UI).
 * Schéma : analysis-investigation-v1
 */
import { detectReportIssues, buildDiagnosticComparison, compareDomToPack } from './analysisEngineComparison';
import { buildPhenomenonRecord } from './recapPhenomenonContract';

export const INVESTIGATION_SCHEMA_VERSION = 'analysis-investigation-v1';

function countsContract(report) {
  const c = report?.registry?.counts || {};
  const sum =
    (c.shown_now || 0) +
    (c.intermediate || 0) +
    (c.demoted || 0) +
    (c.rejected || 0) +
    (c.unknown || 0);
  return {
    ...c,
    hors_pack: c.hors_pack ?? sum - (c.shown_now || 0),
    conservation: c.conservation || {
      formula: 'total = shown_now + intermediate + demoted + rejected + unknown',
      holds: c.total == null ? null : c.total === sum,
      sumStatuses: sum
    },
    definitions: {
      total: 'Candidats uniques du registre (après dédup de clé)',
      shown_now: 'Sélectionnés dans le pack diagnostic de ce run (≠ DOM Analyse)',
      intermediate: 'Retenus hors pack affiché',
      demoted: 'Écartés par sélection / rivalité / cap / identité',
      rejected: 'Rejet validation',
      unknown: 'Statut non déterminé',
      cross: 'Sous-ensemble flag (pas une part exclusive)',
      hors_pack: 'intermediate + demoted + rejected + unknown'
    }
  };
}

function candidateDossier(row) {
  const phen = row._phenomenonRecord || buildPhenomenonRecord(row);
  return {
    id: row.id || row.registryKey,
    kind: row.kind,
    family: row.family,
    title: row.title,
    body: row.body,
    evidence: row.evidence || null,
    diagStatus: row.diagStatus,
    decisionReason: row.decisionReason || row.reason || null,
    informativeValue: row.informativeValue ?? null,
    score: row.score ?? null,
    phenomenon: phen,
    metrics: row.metrics || null,
    identity: {
      exerciseId: row.metrics?.exerciseId ?? null,
      name: row.metrics?.name || row.metrics?.exerciseName || null,
      resolutionSource: row.metrics?.identityResolutionSource || row.metrics?.nameRepair?.resolutionSource || null,
      unresolved: row.decisionReason === 'unresolved_exercise_name' || Boolean(row.metrics?.identityUnresolvedReason)
    },
    editorialTrail: row.editorialTrail || null,
    rivals: row.rivals || row._rivals || null,
    collapsedInto: row._collapsedInto || null
  };
}

function lostOpportunities(report) {
  const rows = report?.registry?.rows || [];
  const groups = {};
  rows
    .filter((r) => r.diagStatus !== 'shown_now')
    .forEach((r) => {
      const reason = r.decisionReason || r.reason || r.diagStatus || 'other';
      if (!groups[reason]) {
        groups[reason] = { reason, count: 0, candidates: [], highIv: 0 };
      }
      groups[reason].count += 1;
      if ((r.informativeValue || 0) >= 70) groups[reason].highIv += 1;
      if (groups[reason].candidates.length < 12) {
        groups[reason].candidates.push({
          kind: r.kind,
          title: r.title,
          informativeValue: r.informativeValue,
          exerciseId: r.metrics?.exerciseId || null
        });
      }
    });
  return Object.values(groups).sort((a, b) => b.highIv - a.highIv || b.count - a.count);
}

function editorialAudit(report) {
  const shown = (report?.registry?.rows || []).filter((r) => r.diagStatus === 'shown_now');
  const defects = [];
  shown.forEach((r) => {
    const text = `${r.title || ''} ${r.body || ''}`;
    if (/un mouvement|Exercice\s+\d+|disc_|\[object Object\]|undefined|NaN/i.test(text)) {
      defects.push({ type: 'technical_artifact', kind: r.kind, title: r.title, severity: 'high' });
    }
    if (/\b(Ces|ces)\s+\d+\s+jours?\s+plus\s+dense\b/.test(text)) {
      defects.push({ type: 'grammar_agreement', kind: r.kind, title: r.title, severity: 'medium' });
    }
    if (/de ta tronc|de ta gainage/i.test(text)) {
      defects.push({ type: 'gender_agreement', kind: r.kind, title: r.title, severity: 'medium' });
    }
    if (/5\s*[×x]\s*10\s*→\s*5\s*[×x]\s*10/.test(text) && /progress|hausse|monte/i.test(text)) {
      defects.push({ type: 'metric_contradiction', kind: r.kind, title: r.title, severity: 'high' });
    }
  });
  return { shownCount: shown.length, defects, defectCount: defects.length };
}

function runHealth(report, issues) {
  const stages = report?.stagesDetailed || [];
  const techOk = stages.every((s) => s.stageStatus !== 'error');
  const highIssues = (issues || []).filter((i) => i.severity === 'high').length;
  const editorial = editorialAudit(report);
  const cons = countsContract(report).conservation;
  return {
    execution: techOk ? 'ok' : 'error',
    integrity: cons?.holds === false ? 'fail' : highIssues ? 'warn' : 'ok',
    analyticalQuality: editorial.defectCount ? 'warn' : 'ok',
    publication: 'unknown_until_dom_capture',
    explanations: {
      execution: techOk ? 'Toutes les étapes se sont terminées sans erreur technique.' : 'Au moins une étape en erreur.',
      integrity: cons?.holds === false ? 'Compteurs incohérents.' : `${highIssues} anomalie(s) haute gravité.`,
      analyticalQuality: `${editorial.defectCount} défaut(s) rédactionnels détectés sur le pack.`,
      publication: 'Non affirmé sans capture DOM compatible.'
    }
  };
}

/**
 * @param {{
 *   report: object,
 *   reportB?: object|null,
 *   domCapture?: object|null,
 *   context?: object
 * }} opts
 */
export function buildInvestigationExport(opts = {}) {
  const { report, reportB = null, domCapture = null, context = {} } = opts;
  if (!report) {
    return { schemaVersion: INVESTIGATION_SCHEMA_VERSION, error: 'missing_report' };
  }
  const issues = detectReportIssues(report, 'A');
  if (reportB) issues.push(...detectReportIssues(reportB, 'B'));
  const rows = (report.registry?.rows || []).map(candidateDossier);
  const comparison = reportB ? buildDiagnosticComparison(report, reportB, context) : null;
  const dom = compareDomToPack(report, domCapture);

  return {
    schemaVersion: INVESTIGATION_SCHEMA_VERSION,
    metadata: {
      generatedAt: new Date().toISOString(),
      engineVersion: report.meta?.engineVersion || report.meta?.version || null,
      period: report.meta?.period || report.overview?.period || null,
      dateRange: report.overview?.window || null,
      runId: report.meta?.runId || report.meta?.generatedAt || null,
      snapshotFingerprint: report.meta?.dataSignature || report.meta?.snapshotSignature || null,
      cacheStatus: report.meta?.cacheStatus || 'non_instrumenté',
      mode: reportB ? 'comparison' : 'single',
      shareable: false,
      note: 'Export local DEV — peut contenir données sportives personnelles.'
    },
    runManifest: report.meta?.runManifest || null,
    health: runHealth(report, issues),
    counts: countsContract(report),
    sources: report.dataCatalog?.items || report.dataInventory || [],
    pipeline: report.stagesDetailed || [],
    candidates: rows,
    phenomena: [...new Set(rows.map((r) => r.phenomenon?.id).filter(Boolean))],
    selectionDecisions: rows.map((r) => ({
      id: r.id,
      status: r.diagStatus,
      reason: r.decisionReason,
      informativeValue: r.informativeValue,
      collapsedInto: r.collapsedInto
    })),
    publishedCards: rows.filter((r) => r.diagStatus === 'shown_now'),
    domComparison: dom,
    coherence: report.coherence || null,
    issues,
    lostOpportunities: lostOpportunities(report),
    families: report.families || [],
    correlations: report.correlations || [],
    performance: {
      totalMs: report.overview?.totalMs ?? null,
      stagesMsSum: (report.stagesDetailed || []).reduce((s, st) => s + (st.ms || 0), 0),
      note: 'stagesMsSum peut dépasser totalMs si étapes imbriquées / chevauchantes.'
    },
    editorialAudit: editorialAudit(report),
    comparison,
    limitations: report.limits || []
  };
}

export function buildInvestigationMarkdown(dossier) {
  if (!dossier || dossier.error) return '# Export investigation invalide';
  const c = dossier.counts || {};
  const h = dossier.health || {};
  const lines = [
    `# Dossier d’investigation — ${dossier.metadata?.period || '?'}`,
    '',
    `- Schéma : ${dossier.schemaVersion}`,
    `- Généré : ${dossier.metadata?.generatedAt}`,
    `- Santé : exécution=${h.execution} · intégrité=${h.integrity} · qualité=${h.analyticalQuality} · publication=${h.publication}`,
    '',
    '## Compteurs',
    '',
    `- Total : ${c.total}`,
    `- Sélectionnés (pack) : ${c.shown_now}`,
    `- Intermédiaires : ${c.intermediate}`,
    `- Déclassés : ${c.demoted}`,
    `- Rejetés : ${c.rejected}`,
    `- Non déterminés : ${c.unknown}`,
    `- Hors pack : ${c.hors_pack}`,
    `- Conservation : ${c.conservation?.holds ? 'OK' : 'ÉCHEC'} (${c.conservation?.formula})`,
    '',
    '## Problèmes prioritaires',
    ''
  ];
  (dossier.issues || []).slice(0, 30).forEach((i) => {
    lines.push(`- [${i.severity}/${i.category}] ${i.reason} · ${i.kind || i.title || ''}`);
  });
  lines.push('', '## Opportunités perdues', '');
  (dossier.lostOpportunities || []).slice(0, 15).forEach((g) => {
    lines.push(`- **${g.reason}** : ${g.count} (dont ${g.highIv} IV≥70)`);
  });
  lines.push('', '## Cartes pack (textes)', '');
  (dossier.publishedCards || []).forEach((card) => {
    lines.push(`### ${card.title || card.kind}`);
    lines.push('');
    lines.push(card.body || '_(vide)_');
    lines.push('');
    lines.push(`- Statut : ${card.diagStatus} · IV ${card.informativeValue ?? '—'} · ${card.phenomenon?.id || ''}`);
    lines.push('');
  });
  lines.push('## Audit rédactionnel', '');
  lines.push(`- Défauts : ${dossier.editorialAudit?.defectCount ?? 0}`);
  (dossier.editorialAudit?.defects || []).forEach((d) => {
    lines.push(`- [${d.severity}] ${d.type} · ${d.title}`);
  });
  return lines.join('\n');
}
