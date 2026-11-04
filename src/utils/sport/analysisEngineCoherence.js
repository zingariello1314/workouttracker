/**
 * Cohérence inter-cartes d’une même période (et hints cross-période).
 * Ne traite pas automatiquement deux verdicts différents comme contradictoires.
 */

import { sameExerciseIdentity } from './recapEditorialIdentity';

const RETURN_KIND_RE = /disc_ms_return|disc_emergence|disc_structural_memory|exercise_return/i;
const RETURN_PROSE_RE = /revient|reviennent|réapparition|interruption|long silence|après\s+(\d+)\s*jours/i;

function gapFromRow(row) {
  const m = row?.metrics || {};
  if (m.gapDays != null && Number.isFinite(Number(m.gapDays))) return Number(m.gapDays);
  if (m.daysAway != null && Number.isFinite(Number(m.daysAway))) return Number(m.daysAway);
  const blob = `${row?.title || ''} ${row?.body || ''}`;
  const hit = blob.match(/après\s+(\d+)\s*jours/i) || blob.match(/réapparition après\s+(\d+)/i);
  return hit ? Number(hit[1]) : null;
}

function isReturnCard(row) {
  const kind = String(row?.kind || '');
  const blob = `${row?.title || ''} ${row?.body || ''}`;
  return RETURN_KIND_RE.test(kind) || RETURN_PROSE_RE.test(blob);
}

function exerciseKey(row) {
  const id = row?.metrics?.exerciseId;
  if (id != null && id !== '') return `id:${id}`;
  const name = String(row?.metrics?.name || row?.metrics?.exerciseName || '')
    .trim()
    .toLowerCase();
  if (name && !/^un mouvement$/i.test(name)) return `name:${name}`;
  const title = String(row?.title || '')
    .replace(/\s+(revient|reviennent|après|réapparition).*$/i, '')
    .trim()
    .toLowerCase();
  return title ? `title:${title.slice(0, 60)}` : null;
}

/**
 * Détecte des retours contradictoires / redondants sur le même exercice.
 * Ex. 42 jours vs 77 jours — peuvent être compatibles (définitions d’interruption différentes)
 * mais doivent être explicites.
 */
export function detectReturnCoherenceIssues(rows = []) {
  const issues = [];
  const returns = (rows || []).filter(isReturnCard);
  const byEx = new Map();
  for (const r of returns) {
    const key = exerciseKey(r);
    if (!key) continue;
    if (!byEx.has(key)) byEx.set(key, []);
    byEx.get(key).push(r);
  }

  for (const [key, list] of byEx) {
    if (list.length < 2) continue;
    const gaps = list
      .map((r) => ({ row: r, gap: gapFromRow(r), status: r.diagStatus }))
      .filter((x) => x.gap != null);
    if (gaps.length < 2) {
      issues.push({
        id: `coherence.return.dup:${key}`,
        category: 'coherence',
        severity: 'low',
        reason: 'duplicate_return_without_distinct_gap',
        confirmed: false,
        exerciseKey: key,
        cards: list.map((r) => ({
          id: r.id,
          kind: r.kind,
          title: r.title,
          diagStatus: r.diagStatus,
          gapDays: gapFromRow(r)
        })),
        note: 'Plusieurs cartes de retour sans écart d’interruption distinct — vérifier fusion éditoriale.'
      });
      continue;
    }
    const uniqueGaps = [...new Set(gaps.map((g) => g.gap))];
    if (uniqueGaps.length >= 2) {
      const shown = gaps.filter((g) => g.status === 'shown_now' || g.row.diagStatus === 'shown_now');
      const severity = shown.length >= 2 ? 'high' : 'medium';
      issues.push({
        id: `coherence.return.gap_conflict:${key}:${uniqueGaps.sort((a, b) => a - b).join('-')}`,
        category: 'coherence',
        severity,
        reason: 'conflicting_return_gaps',
        confirmed: shown.length >= 2,
        exerciseKey: key,
        gaps: uniqueGaps,
        cards: gaps.map((g) => ({
          id: g.row.id,
          kind: g.row.kind,
          title: g.row.title,
          diagStatus: g.row.diagStatus,
          gapDays: g.gap,
          lastDate: g.row.metrics?.lastDate || g.row.metrics?.dates?.slice?.(-1)?.[0] || null,
          dates: g.row.metrics?.dates || null
        })),
        explanation:
          'Plusieurs durées d’interruption pour le même exercice. Compatibles seulement si les définitions d’épisode (seuil de silence, fenêtre, producteur) diffèrent et sont explicitées au lecteur.',
        action:
          'Fusionner sous un phénomène unique, ou qualifier chaque écart (ex. silence depuis dernière séance force vs dernière variante).'
      });
    }
  }
  return issues;
}

/**
 * Progression et régression simultanées sur la même métrique / même exercice / même fenêtre.
 */
export function detectProgressionCoherenceIssues(rows = []) {
  const issues = [];
  const progress = (rows || []).filter(
    (r) =>
      /progress|hausse|plus haut|en hausse/i.test(`${r.title || ''} ${r.body || ''}`) &&
      /disc_exercise_progress|journey_progress|disc_freq_progress/i.test(String(r.kind || ''))
  );
  const regress = (rows || []).filter(
    (r) =>
      /recul|baisse|plus bas|moins de répétitions|régression/i.test(`${r.title || ''} ${r.body || ''}`) &&
      /disc_exercise_progress|disc_freq_decline|journey_/i.test(String(r.kind || ''))
  );

  for (const p of progress) {
    for (const q of regress) {
      if (p === q) continue;
      if (!sameExerciseIdentity(p, q) && exerciseKey(p) !== exerciseKey(q)) continue;
      const storyP = p.metrics?.trajectoryPrimaryStory || p.metrics?.composedEvidence?.volumeAttribution;
      const storyQ = q.metrics?.trajectoryPrimaryStory || q.metrics?.composedEvidence?.volumeAttribution;
      // Compatible si mécanismes différents (freq vs per-session)
      const compatible =
        (storyP && storyQ && storyP !== storyQ) ||
        (/fréquence|séances/i.test(`${p.body || ''}${q.body || ''}`) &&
          /par séance|volume moyen/i.test(`${p.body || ''}${q.body || ''}`));
      issues.push({
        id: `coherence.progress_vs_regress:${exerciseKey(p) || p.id}`,
        category: 'coherence',
        severity: compatible ? 'low' : 'medium',
        reason: compatible ? 'progress_regress_different_mechanisms' : 'progress_regress_same_metric_suspect',
        confirmed: !compatible,
        cards: [
          { id: p.id, kind: p.kind, title: p.title, story: storyP },
          { id: q.id, kind: q.kind, title: q.title, story: storyQ }
        ],
        note: compatible
          ? 'Baisse et hausse peuvent coexister si les métriques / mécanismes diffèrent — expliciter.'
          : 'Même exercice avec hausse et baisse sans décomposition claire.'
      });
    }
  }
  return issues;
}

export function buildCoherenceReport(report) {
  const rows = report?.registry?.rows || [];
  const returnIssues = detectReturnCoherenceIssues(rows);
  const progressIssues = detectProgressionCoherenceIssues(rows);
  return {
    schemaVersion: 'analysis-engine-coherence-v1',
    period: report?.meta?.period || report?.overview?.period || null,
    issues: [...returnIssues, ...progressIssues],
    counts: {
      returnConflicts: returnIssues.filter((i) => i.reason === 'conflicting_return_gaps').length,
      returnDuplicates: returnIssues.filter((i) => i.reason === 'duplicate_return_without_distinct_gap')
        .length,
      progressRegress: progressIssues.length
    }
  };
}
