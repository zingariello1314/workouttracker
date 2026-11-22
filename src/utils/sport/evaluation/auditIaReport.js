/**
 * Rapport d’audit IA — Markdown autonome (Mission 11).
 * Destiné à être copié / joint sans accès au dépôt.
 */

import { analysisEditionKey, analysisMissionLabel } from '../analysisEdition';
import { auditInsightsProse } from '../editorialProseGuard';

function cardsOf(insights) {
  return [
    ...(insights?.shortTerm || []).map((c) => ({ ...c, _role: 'priority', _column: 'shortTerm' })),
    ...(insights?.mediumTerm || []).map((c) => ({ ...c, _role: 'priority', _column: 'mediumTerm' })),
    ...(insights?.longTerm || []).map((c) => ({ ...c, _role: 'priority', _column: 'longTerm' })),
    ...(insights?.accessibleReserve || []).map((c) => ({ ...c, _role: 'reserve' }))
  ];
}

function renderCard(card, index) {
  const lines = [
    `### ${index + 1}. ${card.title || '(sans titre)'}`,
    '',
    `- id: \`${card.id || card.kind || '—'}\``,
    `- kind: \`${card.kind || '—'}\``,
    `- rôle: ${card._role || card.disposition || '—'}`,
    `- population: ${card.claim?.population?.label || card.metrics?.populationLabel || '—'}`,
    `- limites: ${(card.claim?.limitations || card.limitations || []).join(', ') || '—'}`,
    '',
    '**Corps**',
    '',
    card.body || card.text || '*(vide)*',
    '',
    '**Preuve affichée**',
    '',
    card.evidence || '—',
    ''
  ];
  const obs = card.claim?.proof?.observedValues || card.metrics?.observedValues || [];
  if (obs.length) {
    lines.push('**Valeurs observées**', '', '```json', JSON.stringify(obs.slice(0, 12), null, 2), '```', '');
  }
  return lines.join('\n');
}

/**
 * @param {object} opts
 * @param {'concise'|'detailed'} [opts.mode]
 */
export function buildAuditIaMarkdown({
  mode = 'detailed',
  eightPeriodExport = null,
  insights = null,
  measure = null,
  p6 = null,
  snapshotFingerprint = null,
  gamesByPeriod = null,
  underexploration = null,
  previousEditionCompare = null,
  domVerify = null,
  mission = null
} = {}) {
  const edition = analysisEditionKey();
  const missionLabel = mission || analysisMissionLabel();
  const assembledAt = new Date().toISOString();
  const lines = [];
  lines.push(`# Rapport d’audit IA — ${missionLabel}`);
  lines.push('');
  lines.push(`Mode : **${mode}** · Généré : ${assembledAt} · Fuseau : Europe/Paris (réf. calendrier)`);
  lines.push('');
  lines.push('## 1. Identification du run');
  lines.push('');
  const fpLabel =
    snapshotFingerprint == null
      ? 'non fourni'
      : typeof snapshotFingerprint === 'string'
        ? snapshotFingerprint
        : snapshotFingerprint.digest ||
          snapshotFingerprint.hash ||
          JSON.stringify(snapshotFingerprint);
  lines.push(`- Édition : \`${edition}\``);
  lines.push(`- Fingerprint snapshot : \`${fpLabel}\``);
  lines.push(`- Provenance export 8 périodes : \`${eightPeriodExport?.schema || 'absent'}\``);
  lines.push(`- DOM : ${domVerify ? JSON.stringify(domVerify.summary || domVerify.refused || 'présent') : 'non observé'}`);
  lines.push('');

  lines.push('## 2. Synthèse des huit horizons');
  lines.push('');
  const periods = eightPeriodExport?.periods || {};
  Object.entries(periods).forEach(([period, dossier]) => {
    const counts = dossier?.userAccessible?.counts || {};
    const recon = dossier?.registry?.publicationReconciliation || {};
    lines.push(
      `- **${period}** · prio ${counts.priority ?? '—'} · réserve ${counts.reserve ?? '—'} · accessible ${counts.accessible ?? '—'} · registre ${recon.registryCount ?? '—'} · publié ${recon.publishedCount ?? '—'} · countGap ${recon.countGap ?? '—'} · countsReconciled ${recon.countsReconciled ?? '—'} · provenance ${dossier?.provenance || '—'}`
    );
  });
  if (!Object.keys(periods).length) {
    lines.push('_Aucun dossier huit périodes fourni à cet assemblage._');
  }
  lines.push('');

  const liveInsights = insights || null;
  const liveCards = cardsOf(liveInsights);
  const priority = liveCards.filter((c) => c._role === 'priority');
  const reserve = liveCards.filter((c) => c._role === 'reserve');

  lines.push('## 3. Analyses prioritaires (période courante)');
  lines.push('');
  if (!priority.length) {
    lines.push('_Pas d’insights prioritaires fournis pour la période courante._');
  } else {
    priority.forEach((card, i) => lines.push(renderCard(card, i)));
  }
  lines.push('');

  lines.push('## 4. Analyses complémentaires');
  lines.push('');
  if (mode === 'concise') {
    reserve.forEach((card, i) => {
      lines.push(
        `${i + 1}. \`${card.id || card.kind}\` — ${card.title || '—'} (${card.kind || '—'})`
      );
    });
  } else {
    reserve.forEach((card, i) => lines.push(renderCard(card, i)));
  }
  lines.push('');

  lines.push('## 5. Anomalies');
  lines.push('');
  const proseAudit = auditInsightsProse(liveInsights || {});
  lines.push(`### Lexical / éditorial (${proseAudit.issueCount} findings)`);
  proseAudit.findings.slice(0, 40).forEach((f) => {
    lines.push(`- [${f.type}] ${f.title || f.kind || ''} — ${f.note || f.match || ''}`);
  });
  if (measure?.durationContract?.minutesMostlyChallenge) {
    lines.push(
      `- [durée] minutesMostlyChallenge=true · densités globales à abstener · nonRunning=${measure.minutes} · total=${measure.totalMinutes}`
    );
  }
  const recon = liveInsights?.publicationReconciliation || p6?.publicationReconciliation;
  if (recon?.countGap) {
    lines.push(
      `- [publication] countGap=${recon.countGap} · countsReconciled=${recon.countsReconciled} · unexplained=${(recon.unexplainedCountGaps || []).length}`
    );
    (recon.gapAudit || []).slice(0, 20).forEach((g) => {
      lines.push(`  - \`${g.id}\` → ${g.status} (${g.disposition || '—'} / ${g.reason || '—'})`);
    });
  }
  lines.push('');

  lines.push('## 6. Découvertes manquées / sous-exploration');
  lines.push('');
  const under = underexploration || p6?.underexploration;
  if (under) {
    lines.push(`- occasions non exploitées : ${under.summary?.opportunityUnused ?? '—'}`);
    lines.push(`- indemonstrables : ${under.summary?.indemonstrable ?? '—'}`);
    lines.push(`- relations non élevées : ${under.summary?.relationsNotElevated ?? '—'}`);
    lines.push(`- réexplorations pass4 : ${under.summary?.reexploreActions ?? '—'}`);
    (under.unusedRelations || []).slice(0, 15).forEach((r) => {
      lines.push(`  - ${r.type} ${r.left?.dayKey || ''}↔${r.right?.dayKey || ''} (${r.class})`);
    });
  } else {
    lines.push('_Rapport de sous-exploration absent._');
  }
  lines.push('');

  lines.push('## 7. Résultats A/B/C');
  lines.push('');
  if (gamesByPeriod) {
    Object.entries(gamesByPeriod).forEach(([period, games]) => {
      lines.push(
        `- **${period}** · A=${games?.A?.pass ?? '—'} · B=${games?.B?.pass ?? '—'} (${games?.B?.passScope || ''}) · C=${games?.C?.pass ?? '—'}`
      );
      (games?.B?.cases || [])
        .filter((c) => c.result === 'sleep_causality_overclaim' || c.status === 'fail')
        .forEach((c) => {
          lines.push(`  - FAIL B \`${c.id}\` : ${c.justification || c.reason || c.result}`);
          if (c.referenceData || c.obtained?.body) {
            lines.push(`    texte: ${(c.obtained?.body || c.referenceData?.body || '').slice(0, 240)}`);
          }
        });
    });
  } else {
    lines.push('_Jeux A/B/C par période non fournis à cet assemblage._');
  }
  lines.push('');

  lines.push('## 8. Comparaison d’édition');
  lines.push('');
  if (previousEditionCompare) {
    lines.push('```json');
    lines.push(JSON.stringify(previousEditionCompare, null, 2).slice(0, 4000));
    lines.push('```');
  } else {
    lines.push('_Comparer sur le même fingerprint ; non fourni ici._');
  }
  lines.push('');
  lines.push('---');
  lines.push('_Ce Markdown est autonome. Les preuves détaillées restent dans ANALYTICAL_AUDIT.json._');
  return lines.join('\n');
}

export function buildAuditIaConcise(opts) {
  return buildAuditIaMarkdown({ ...opts, mode: 'concise' });
}
