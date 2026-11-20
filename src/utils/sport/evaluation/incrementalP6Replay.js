/**
 * Rejeu P6 incrémental (Mission 5 bis) — un horizon à la fois, reprise possible.
 * Ne modifie aucune donnée utilisateur.
 */

import fs from 'node:fs';
import path from 'node:path';
import { analysisEditionKey } from '../analysisEdition';
import { snapshotFingerprint } from '../analysisEnvironmentDossier';
import { buildPeriodDiscoveryBundle } from '../recapPeriodDiscoveries';
import { insightsFromP6 } from '../p6Publication';
import { runGameAAccuracy } from './gameAAccuracy';
import { runGameBDiscoveryQuality } from './gameBDiscoveryQuality';
import { runGameCCollective } from './gameCCollective';
import {
  structureGameAReport,
  structureGameBReport,
  structureGameCReport
} from './structuredEvalReports';
import { writeEvalArtifactFiles, EVAL_ARCHIVE_DIRS } from './evalArchive';
import { analyticalJsonStringify, buildZipStore } from '../analysisExportDownload';

export const REPLAY_PERIODS = ['today', '7d', '30d', '3m', '6m', '1y', '2y', 'all'];

export const BACKUP_19_NOV =
  'C:/Users/zinga/.cursor/projects/c-Users-zinga-Desktop-momentum/attachments/2154474a-0603-44f8-8ebb-a86ce443fdec/momentum-sport-backup-2026-11-19.json';

export const PARTIAL_REPLAY_PATH = path.join(
  process.cwd(),
  EVAL_ARCHIVE_DIRS.root,
  'replays',
  'p6-replay-v4-partial.json'
);

export function addDays(ymd, delta) {
  const date = new Date(`${ymd}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

export function windowFor(period, end, firstDate) {
  const spans = { today: 1, '7d': 7, '30d': 30, '3m': 92, '6m': 183, '1y': 365, '2y': 730 };
  if (period === 'all') return { start: firstDate, end };
  return { start: addDays(end, -(spans[period] - 1)), end };
}

export function loadPartialReplay() {
  if (!fs.existsSync(PARTIAL_REPLAY_PATH)) {
    return {
      schema: 'momentum.p6ReplayPartial.v1',
      edition: analysisEditionKey(),
      periods: {},
      updatedAt: null
    };
  }
  return JSON.parse(fs.readFileSync(PARTIAL_REPLAY_PATH, 'utf8'));
}

export function savePartialReplay(partial) {
  fs.mkdirSync(path.dirname(PARTIAL_REPLAY_PATH), { recursive: true });
  fs.writeFileSync(PARTIAL_REPLAY_PATH, analyticalJsonStringify(partial, 2), 'utf8');
  return PARTIAL_REPLAY_PATH;
}

function textKey(card) {
  return `${String(card?.title || '')
    .toLowerCase()
    .trim()}|${String(card?.kind || '')}`;
}

export function replayOnePeriod({ snapshot, period, end, firstDate }) {
  const t0 = Date.now();
  const window = windowFor(period, end, firstDate);
  const bundle = buildPeriodDiscoveryBundle({
    snapshot,
    period,
    window,
    getExerciseNameById: null
  });
  const p6 = bundle.p6 || null;
  const insights = insightsFromP6(p6, { period });
  const priorityCards = [
    ...(insights?.shortTerm || []),
    ...(insights?.mediumTerm || []),
    ...(insights?.longTerm || [])
  ];
  const reserveCards = insights?.accessibleReserve || [];
  const accessible = [...priorityCards, ...reserveCards];
  const seen = new Map();
  let exactDuplicates = 0;
  accessible.forEach((card) => {
    const key = textKey(card);
    seen.set(key, (seen.get(key) || 0) + 1);
  });
  seen.forEach((n) => {
    if (n > 1) exactDuplicates += n - 1;
  });

  const gameA = structureGameAReport(runGameAAccuracy({ insights, measure: null }));
  const gameB = structureGameBReport(runGameBDiscoveryQuality({ insights }));
  const gameC = structureGameCReport(runGameCCollective({ insights, p6 }));

  const dispositions = insights?.publicationDispositions || [];
  const lostSilent = insights?.publicationReconciliation?.lostSilent || [];

  const slimCard = (c) => ({
    id: c.id,
    title: c.title,
    body: String(c.body || '').slice(0, 400),
    kind: c.kind,
    family: c.family || null,
    p6Disposition: c.p6Disposition || c.disposition,
    collapsedInto: c.collapsedInto || null,
    phenomenonId: c.phenomenonId || null,
    claim: c.claim
      ? {
          id: c.claim.id,
          proof: c.claim.proof || null,
          assertions: c.claim.assertions || [],
          limitations: c.claim.limitations || [],
          allowedStatements: c.claim.allowedStatements || []
        }
      : null
  });

  return {
    period,
    ms: Date.now() - t0,
    window,
    produced: (bundle.all || []).length,
    selectedLegacy: (bundle.selected || []).length,
    dropped: (bundle.dropped || []).length,
    p6: p6?.counters || null,
    views: p6?.views || null,
    review: {
      decisions: (p6?.review?.decisions || []).slice(0, 40),
      reexplored: p6?.review?.reexplored || 0
    },
    publication: {
      authority: insights?.publicationAuthority || null,
      registryExpected: (p6?.priority || []).length + (p6?.reserve || []).length,
      publishedAccessible: accessible.length,
      priorityPublished: priorityCards.length,
      reservePublished: reserveCards.length,
      lostSilent,
      dispositions: dispositions.map((d) => ({
        id: d.id,
        disposition: d.disposition,
        reason: d.reason
      })),
      dispositionCounts: dispositions.reduce((acc, d) => {
        acc[d.disposition] = (acc[d.disposition] || 0) + 1;
        return acc;
      }, {}),
      reconciliation: insights?.publicationReconciliation || null
    },
    insightsSlim: {
      shortTerm: (insights?.shortTerm || []).map(slimCard),
      mediumTerm: (insights?.mediumTerm || []).map(slimCard),
      longTerm: (insights?.longTerm || []).map(slimCard),
      accessibleReserve: reserveCards.map(slimCard),
      publicationAuthority: insights?.publicationAuthority || null,
      publicationDispositions: dispositions,
      publicationReconciliation: insights?.publicationReconciliation || null
    },
    p6Slim: {
      counters: p6?.counters || null,
      priority: (p6?.priority || []).map((row) => ({
        id: row.id || row.title,
        title: row.title,
        body: row.body || 'x',
        claim: row.claim || { id: row.id || row.title }
      })),
      reserve: (p6?.reserve || []).map((row) => ({
        id: row.id || row.title,
        title: row.title,
        body: row.body || 'x',
        claim: row.claim || { id: row.id || row.title },
        p6Disposition: row.p6Disposition,
        collapsedInto: row.collapsedInto || null
      }))
    },
    quality: {
      exactDuplicatesAccessible: exactDuplicates,
      fusedSourcesAccessible: accessible.filter(
        (c) => c.p6Disposition === 'source_retained' || c.collapsedInto
      ).length,
      sleepCards: accessible.filter((c) => /sleep|sommeil/i.test(`${c.kind || ''} ${c.title || ''}`))
        .length,
      returnLikeCards: accessible.filter((c) =>
        /return|reprise|revient|retour/i.test(`${c.kind || ''} ${c.title || ''} ${c.body || ''}`)
      ).length,
      priorityTitles: priorityCards.map((c) => c.title).filter(Boolean),
      reserveTitles: reserveCards.slice(0, 20).map((c) => c.title).filter(Boolean),
      examples: priorityCards.slice(0, 8).map((c) => ({
        title: c.title,
        body: String(c.body || '').slice(0, 280),
        kind: c.kind,
        disposition: c.p6Disposition || c.disposition,
        claimProof: c.claim?.proof || null
      }))
    },
    games: {
      A: { pass: gameA.pass, counters: gameA.counters },
      B: { pass: gameB.pass, counters: gameB.counters, humanBlind: false },
      C: { pass: gameC.pass, cases: gameC.cases, counters: gameC.counters }
    },
    fullGames: { A: gameA, B: gameB, C: gameC }
  };
}

export function compareV3V4(v3Replay, v4Periods) {
  const v3Rows = v3Replay?.rows || v3Replay?.periods || [];
  const byPeriod = Array.isArray(v3Rows)
    ? Object.fromEntries(v3Rows.map((r) => [r.period, r]))
    : v3Rows;
  return REPLAY_PERIODS.map((period) => {
    const a = byPeriod[period] || null;
    const b = v4Periods[period] || null;
    if (!a || !b) {
      return { period, status: !a ? 'missing_v3' : 'missing_v4' };
    }
    return {
      period,
      v3: {
        produced: a.produced,
        priority: a.p6?.priority,
        reserve: a.p6?.reserve,
        fused: a.p6?.fused,
        examples: a.examples
      },
      v4: {
        produced: b.produced,
        priority: b.p6?.priority,
        reserve: b.p6?.reserve,
        fused: b.p6?.fused,
        publishedAccessible: b.publication?.publishedAccessible,
        authority: b.publication?.authority,
        lostSilent: b.publication?.lostSilent?.length || 0,
        examples: b.quality?.priorityTitles
      },
      delta: {
        produced: (b.produced || 0) - (a.produced || 0),
        priority: (b.p6?.priority || 0) - (a.p6?.priority || 0),
        reserve: (b.p6?.reserve || 0) - (a.p6?.reserve || 0),
        publishedVsRegistry:
          (b.publication?.publishedAccessible || 0) - (b.publication?.registryExpected || 0)
      }
    };
  });
}

export function buildQualitativeBlindPack(v3Replay, v4Periods) {
  const pack = {
    schema: 'momentum.qualitativeBlindPack.v1',
    note: 'Ordre anonymisé A/B — ne révèle pas quelle version est v3 ou v4. Jugement humain NON effectué.',
    humanBlindPerformed: false,
    cases: []
  };
  ['today', '7d', '30d', '6m', '1y'].forEach((period, index) => {
    const v3 = (v3Replay?.rows || []).find((r) => r.period === period);
    const v4 = v4Periods[period];
    if (!v3 || !v4) return;
    const leftFirst = index % 2 === 0;
    const versionA = leftFirst ? 'v3' : 'v4';
    const versionB = leftFirst ? 'v4' : 'v3';
    const textsA =
      versionA === 'v3'
        ? (v3.examples || []).map((t) => ({ title: t }))
        : v4.quality?.examples || [];
    const textsB =
      versionB === 'v3'
        ? (v3.examples || []).map((t) => ({ title: t }))
        : v4.quality?.examples || [];
    pack.cases.push({
      id: `blind-${period}`,
      period,
      labelA: 'Version A',
      labelB: 'Version B',
      // clé de déchiffrement séparée — pas dans le paquet aveugle utilisateur
      _reveal: { A: versionA, B: versionB },
      versionA: textsA,
      versionB: textsB
    });
  });
  const sealed = {
    ...pack,
    cases: pack.cases.map(({ _reveal, ...rest }) => rest)
  };
  const key = {
    schema: 'momentum.qualitativeBlindKey.v1',
    humanBlindPerformed: false,
    reveals: Object.fromEntries(pack.cases.map((c) => [c.id, c._reveal]))
  };
  return { sealed, key };
}

export function assembleV4ReplayDocument({ snapshot, partial, v3Replay, end }) {
  const periods = partial.periods || {};
  const executedAt = new Date().toISOString();
  const fingerprint = snapshotFingerprint(snapshot);
  const comparison = compareV3V4(v3Replay, periods);
  const qualitative = buildQualitativeBlindPack(v3Replay, periods);
  const periodPacks = Object.entries(periods).map(([period, row]) => ({
    period,
    insights: row.insightsSlim || {
      shortTerm: [],
      mediumTerm: [],
      longTerm: [],
      accessibleReserve: [],
      publicationAuthority: row.publication?.authority,
      publicationDispositions: row.publication?.dispositions || [],
      publicationReconciliation: row.publication?.reconciliation
    },
    p6: row.p6Slim || {
      counters: { ...(row.p6 || {}), reconciled: row.p6?.reconciled === true },
      priority: [],
      reserve: []
    }
  }));

  // Recalcule C par horizon (formule ids uniques à jour) sans relancer A/B ni le moteur.
  const periodGames = {};
  Object.entries(periods).forEach(([period, row]) => {
    const pack = periodPacks.find((p) => p.period === period);
    const freshC = pack
      ? structureGameCReport(runGameCCollective({ insights: pack.insights, p6: pack.p6 }))
      : row.fullGames?.C || null;
    periodGames[period] = {
      A: row.games?.A || null,
      B: row.games?.B || null,
      C: freshC
        ? {
            pass: freshC.pass,
            cases: freshC.cases,
            counters: freshC.counters
          }
        : row.games?.C || null
    };
    if (row.fullGames && freshC) row.fullGames.C = freshC;
  });

  const gameCEight = runGameCCollective({ periodPacks });

  // Strip fullGames from archived periods (keep summary) ; jeux C rafraîchis
  const slimPeriods = Object.fromEntries(
    Object.entries(periods).map(([period, row]) => {
      const { fullGames, ...rest } = row;
      return [period, { ...rest, games: periodGames[period] || rest.games }];
    })
  );

  const replay = {
    schema: 'momentum.p6Replay.v2',
    executedAt,
    edition: analysisEditionKey(),
    fingerprint,
    dataFingerprint: fingerprint,
    snapshotRef: {
      path: BACKUP_19_NOV,
      endDate: end,
      label: 'momentum-sport-backup-2026-11-19'
    },
    periods: slimPeriods,
    rows: REPLAY_PERIODS.map((p) => slimPeriods[p]).filter(Boolean),
    comparisonV3V4: comparison,
    gamesByPeriod: periodGames,
    gameCAcrossEight: {
      pass: gameCEight.pass,
      exactDuplicatesAccessible: gameCEight.exactDuplicatesAccessible,
      fusedSourcesAccessible: gameCEight.fusedSourcesAccessible,
      admissiblePreserved: gameCEight.admissiblePreserved,
      cases: gameCEight.cases,
      humanBlindPerformed: false
    },
    complete: REPLAY_PERIODS.every((p) => Boolean(slimPeriods[p]))
  };

  return { replay, qualitative, gameCEight, comparison };
}

export function writeMission5BisArtifacts({
  snapshot,
  partial,
  v3Replay,
  end,
  bilanMd = null
}) {
  const { replay, qualitative, comparison } = assembleV4ReplayDocument({
    snapshot,
    partial,
    v3Replay,
    end
  });
  const executedAt = replay.executedAt;
  const written = writeEvalArtifactFiles(fs, path, {
    executedAt,
    edition: replay.edition,
    fingerprint: replay.fingerprint,
    snapshotRef: replay.snapshotRef,
    replay,
    notes: [
      'Mission 5 bis — rejeu incrémental v4',
      `Complet: ${replay.complete}`,
      'Baseline v3: artifacts/analysis-eval/baselines/p6-replay-p6-sovereign-v3-before-mission5.json'
    ]
  });

  const root = path.join(process.cwd(), EVAL_ARCHIVE_DIRS.root);
  const completeDir = path.join(root, 'complete');
  fs.mkdirSync(completeDir, { recursive: true });
  fs.mkdirSync(path.join(root, 'comparisons'), { recursive: true });
  fs.mkdirSync(path.join(root, 'qualitative'), { recursive: true });

  const files = [];
  const put = (rel, data) => {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    const text = typeof data === 'string' ? data : analyticalJsonStringify(data, 2);
    fs.writeFileSync(abs, text, 'utf8');
    files.push({ name: rel.replace(/\\/g, '/'), data: text });
    return abs;
  };

  put('comparisons/v3-vs-v4.json', comparison);
  put('qualitative/blind-pack.json', qualitative.sealed);
  put('qualitative/blind-key.json', qualitative.key);
  put('replays/p6-replay-v4-latest.json', replay);
  if (v3Replay) put('replays/p6-replay-v3-baseline.json', v3Replay);
  if (bilanMd) put('summaries/MISSION5_BILAN_P6.md', bilanMd);

  const gamesByPeriod = replay.gamesByPeriod || {};
  const gameCStructured = structureGameCReport({
    ...(replay.gameCAcrossEight || {}),
    pass: replay.gameCAcrossEight?.pass === true,
    cases: replay.gameCAcrossEight?.cases || []
  });
  const firstFull =
    Object.values(partial.periods || {}).find((row) => row.fullGames)?.fullGames || null;
  put('games/games-by-period.json', gamesByPeriod);
  put('games/game-C-across-eight.json', gameCStructured);
  if (firstFull?.A) put('games/game-A-sample.json', firstFull.A);
  if (firstFull?.B) put('games/game-B-sample.json', firstFull.B);

  const reconciliation = REPLAY_PERIODS.map((period) => {
    const row = replay.periods[period];
    if (!row) {
      return { period, status: 'missing' };
    }
    const disp = row.publication?.dispositions || [];
    const byType = disp.reduce((acc, d) => {
      const key = d.disposition || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return {
      period,
      produced: row.produced,
      priority: row.p6?.priority,
      reserve: row.p6?.reserve,
      fused: row.p6?.fused,
      registryRows: (row.p6?.priority || 0) + (row.p6?.reserve || 0),
      publishedAccessible: row.publication?.publishedAccessible,
      authority: row.publication?.authority,
      lostSilent: row.publication?.lostSilent || [],
      dispositionsByType: byType,
      catalogueInterne:
        'priority ∪ reserve du registre P6 (peut contenir plusieurs lignes au même id)',
      catalogueAccessible:
        'shortTerm ∪ mediumTerm ∪ longTerm ∪ accessibleReserve après publication (ids uniques)'
    };
  });
  put('evaluation/publication-reconciliation.json', { periods: reconciliation });

  const artifactStatus = [
    {
      name: 'eight-periods/eight-periods.json',
      status: 'missing',
      cause:
        'export live UI non exécuté dans cet ZIP hors-navigateur — lancer Récap→Analyse→Exporter le dossier d’audit complet après chargement du bridge'
    },
    {
      name: 'evaluation/dom-eight-periods.json',
      status: 'missing',
      cause:
        'navigateur authentifié non exercé ici — bouton « Vérifier les 8 périodes (DOM) » puis ré-export'
    },
    {
      name: 'evaluation/live/game-*.json',
      status: 'missing',
      cause: 'jeux live session UI absents de cet assemblage hors-navigateur'
    },
    {
      name: 'replays/p6-replay-v4-latest.json',
      status: 'included',
      cause: null
    },
    {
      name: 'replays/p6-replay-v3-baseline.json',
      status: v3Replay ? 'included' : 'missing',
      cause: v3Replay ? null : 'baseline v3 absente'
    },
    {
      name: 'comparisons/v3-vs-v4.json',
      status: 'included',
      cause: null
    },
    {
      name: 'qualitative/blind-pack.json',
      status: 'included',
      cause: 'préparé — jugement humain NON effectué'
    },
    {
      name: 'games/games-by-period.json',
      status: 'included',
      cause: null
    },
    {
      name: 'human-blind-verdict.json',
      status: 'missing',
      cause: 'aucune validation humaine à l’aveugle n’a été effectuée'
    }
  ];
  put('ARTIFACT_STATUS.json', {
    schema: 'momentum.artifactStatus.v1',
    executedAt,
    items: artifactStatus
  });

  const summary = [
    '# Mission 5 bis — synthèse rejeu',
    '',
    `Exécuté : ${executedAt}`,
    `Édition : ${replay.edition}`,
    `Complet : ${replay.complete}`,
    `Jeu C 8 périodes : ${replay.gameCAcrossEight?.pass ? 'PASS' : 'FAIL'}`,
    `Doublons exacts accessibles : ${replay.gameCAcrossEight?.exactDuplicatesAccessible ?? '?'}`,
    `Admissible préservé (ids) : ${replay.gameCAcrossEight?.admissiblePreserved}`,
    '',
    '## Horizons',
    ...REPLAY_PERIODS.map((p) => {
      const row = replay.periods[p];
      if (!row) return `- ${p}: MANQUANT`;
      return `- ${p}: produit=${row.produced} prio=${row.p6?.priority} réserve=${row.p6?.reserve} publié=${row.publication?.publishedAccessible} autorité=${row.publication?.authority} lostSilent=${row.publication?.lostSilent?.length || 0} A=${row.games?.A?.pass} B=${row.games?.B?.pass} C=${row.games?.C?.pass} (${row.ms}ms)`;
    }),
    '',
    '## Artefacts manquants dans ce ZIP',
    ...artifactStatus
      .filter((row) => row.status === 'missing')
      .map((row) => `- \`${row.name}\` — ${row.cause}`),
    '',
    '> Aucune validation humaine à l’aveugle n’a été effectuée.',
    ''
  ].join('\n');
  put('summaries/mission5-bis-summary.md', summary);

  const stamp = executedAt.replace(/[:.]/g, '-');
  const zipName = `momentum-p6-mission5-bis-${stamp}.zip`;
  const zipPath = path.join(completeDir, zipName);
  const zipLatest = path.join(completeDir, 'momentum-p6-mission5-bis-latest.zip');
  const manifest = {
    schema: 'momentum.mission5BisComplete.v1',
    executedAt,
    edition: replay.edition,
    completeReplay: replay.complete,
    humanBlindPerformed: false,
    domVerified: false,
    liveEightPeriodsIncluded: false,
    files: files.map((f) => ({ name: f.name, status: 'included' })),
    missing: artifactStatus.filter((row) => row.status === 'missing'),
    notes: [
      'ZIP hors-navigateur : rejeux v3/v4, comparaisons, jeux par horizon, qualitative, réconciliation, bilan.',
      'Pour DOM + 8 périodes live : UI Récap→Analyse → charger bridge → vérifier DOM → exporter dossier complet.'
    ]
  };
  put('MANIFEST.json', manifest);
  const zipBytes = buildZipStore(files);
  fs.writeFileSync(zipPath, zipBytes);
  fs.writeFileSync(zipLatest, zipBytes);

  // Bridge localStorage (pour le bouton UI)
  const bridge = {
    schema: 'momentum.analysisEvalArchive.v1',
    updatedAt: executedAt,
    edition: replay.edition,
    fingerprint: replay.fingerprint,
    replay,
    games: {
      A: firstFull?.A || null,
      B: firstFull?.B || null,
      C: gameCStructured,
      bundle: {
        schema: 'momentum.evalGamesBundle.v1',
        executedAt,
        edition: replay.edition,
        gamesByPeriod: replay.gamesByPeriod,
        gameCAcrossEight: replay.gameCAcrossEight,
        pass: Boolean(replay.gameCAcrossEight?.pass)
      }
    },
    summary,
    comparisonV3V4: comparison,
    qualitativeBlind: qualitative.sealed,
    qualitativeKey: qualitative.key,
    v3Baseline: v3Replay || null,
    v3BaselinePresent: Boolean(v3Replay)
  };
  put('browser-bridge/eval-archive-inject.json', bridge);

  return {
    written: written.written,
    zipPath,
    zipLatest,
    bridgePath: path.join(root, 'browser-bridge/eval-archive-inject.json'),
    replay,
    comparison,
    summary
  };
}
