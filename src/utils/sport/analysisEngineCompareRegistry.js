/**
 * Registre comparatif A/B pour la console diagnostic.
 */
import { matchRegistryRows, buildDiagnosticComparison, detectReportIssues } from './analysisEngineComparison';
import { buildPhenomenonRecord } from './recapPhenomenonContract';

function tagRow(row, periodKey, periodLabel) {
  const rec = row._phenomenonRecord || buildPhenomenonRecord(row);
  return {
    ...row,
    _periodKey: periodKey,
    _periodLabel: periodLabel,
    _phenomenonRecord: rec,
    _phenomenonId: row._phenomenonId || rec.id,
    registryKey: `${periodKey}:${row.registryKey || row.id || row.kind}`
  };
}

export function buildMergedCompareRegistry(reportA, reportB, labels = {}) {
  const labelA = labels.a || reportA?.meta?.period || 'A';
  const labelB = labels.b || reportB?.meta?.period || 'B';
  const rowsA = (reportA?.registry?.rows || []).map((r) => tagRow(r, 'A', labelA));
  const rowsB = (reportB?.registry?.rows || []).map((r) => tagRow(r, 'B', labelB));
  const { matched, onlyA, onlyB } = matchRegistryRows(rowsA, rowsB);
  const matchIndex = new Map();
  matched.forEach((m) => {
    matchIndex.set(m.a.registryKey, m);
    matchIndex.set(m.b.registryKey, m);
  });
  const all = [...rowsA, ...rowsB].map((r) => {
    const m = matchIndex.get(r.registryKey);
    return {
      ...r,
      _matchConfidence: m?.matchConfidence || (r._periodKey === 'A' && onlyA.includes(r) ? 'only_a' : r._periodKey === 'B' ? 'only_b' : null),
      _peerStatus: m ? (r._periodKey === 'A' ? m.statusB : m.statusA) : null,
      _peerTitle: m ? (r._periodKey === 'A' ? m.titleB : m.titleA) : null,
      _matchedPair: m || null
    };
  });
  return { rows: all, matched, onlyA, onlyB };
}

export function filterCompareRows(rows, compareFilter) {
  if (!compareFilter || compareFilter === 'all') return rows;
  return rows.filter((r) => {
    const m = r._matchedPair;
    if (compareFilter === 'common') return Boolean(m);
    if (compareFilter === 'only_a') return r._periodKey === 'A' && !m;
    if (compareFilter === 'only_b') return r._periodKey === 'B' && !m;
    if (compareFilter === 'status_flip') return m && m.statusA !== m.statusB;
    if (compareFilter === 'sel_a_dem_b') {
      return m && m.statusA === 'shown_now' && m.statusB === 'demoted';
    }
    if (compareFilter === 'dem_a_sel_b') {
      return m && m.statusA === 'demoted' && m.statusB === 'shown_now';
    }
    return true;
  });
}

export function buildIssuesBundle(reportA, reportB = null, comparison = null) {
  const issues = [
    ...detectReportIssues(reportA, 'A'),
    ...(reportB ? detectReportIssues(reportB, 'B') : [])
  ];
  if (comparison?.issues?.length) {
    comparison.issues.forEach((i) => {
      if (!issues.some((x) => x.reason === i.reason && x.title === i.title && x.period === i.period)) {
        issues.push(i);
      }
    });
  }
  const severityRank = { high: 0, medium: 1, low: 2 };
  issues.sort((a, b) => (severityRank[a.severity] ?? 9) - (severityRank[b.severity] ?? 9));
  return issues;
}

export { buildDiagnosticComparison };
