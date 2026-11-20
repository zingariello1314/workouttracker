/**
 * Assemble et télécharge le dossier d’audit P6 complet (ZIP).
 * Ne relance pas la suite vitest / rejeu ; réutilise exports live + artefacts archivés.
 */

import { analysisEditionKey } from '../analysisEdition';
import { snapshotFingerprint } from '../analysisEnvironmentDossier';
import {
  analyticalJsonStringify,
  buildZipStore,
  downloadTextFile,
  renderAuditMarkdown
} from '../analysisExportDownload';
import {
  emptyEvalArchive,
  fetchPublicEvalArtifacts,
  loadEvalArchiveFromStorage,
  upsertEvalArchiveSlice
} from './evalArchive';
import { runStructuredEvalSuite } from './structuredEvalReports';

function fpKey(fp) {
  if (!fp) return null;
  if (typeof fp === 'string') return fp;
  try {
    return analyticalJsonStringify(fp, 0);
  } catch {
    return String(fp);
  }
}

function fileEntry({
  name,
  status,
  source = null,
  executedAt = null,
  edition = null,
  fingerprint = null,
  note = null
}) {
  return { name, status, source, executedAt, edition, fingerprint, note };
}

function asJson(data) {
  return typeof data === 'string' ? data : analyticalJsonStringify(data, 2);
}

function downloadZipBlob(files, filename) {
  if (typeof document === 'undefined') return { ok: false, reason: 'no_document' };
  try {
    const zip = buildZipStore(files);
    const blob = new Blob([zip], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return { ok: true, filename, format: 'zip', fileCount: files.length };
  } catch (error) {
    return { ok: false, reason: String(error?.message || error) };
  }
}

/**
 * @param {object} opts
 * @param {object|null} opts.eightPeriodExport — export 8 périodes déjà calculé (ou null)
 * @param {object|null} opts.insights — insights live pour jeux A/B/C légers
 * @param {object|null} opts.measure
 * @param {object|null} opts.p6
 * @param {object|null} opts.snapshot — pour fingerprint live
 * @param {boolean} opts.download
 * @param {boolean} opts.includeLiveGames — calcule A/B/C live (pas vitest)
 */
export async function assembleCompleteAuditDossier({
  eightPeriodExport = null,
  insights = null,
  measure = null,
  p6 = null,
  snapshot = null,
  download = true,
  includeLiveGames = true
} = {}) {
  const assembledAt = new Date().toISOString();
  const edition = analysisEditionKey();
  const liveFingerprint = snapshot ? snapshotFingerprint(snapshot) : null;
  const archive = loadEvalArchiveFromStorage() || emptyEvalArchive();
  const publicArtifacts = await fetchPublicEvalArtifacts();

  const zipFiles = [];
  const manifestFiles = [];
  const warnings = [];

  const push = (name, data, meta = {}) => {
    if (data == null) {
      manifestFiles.push(
        fileEntry({
          name,
          status: 'missing',
          source: meta.source || null,
          note: meta.note || 'indisponible'
        })
      );
      warnings.push(`${name}: indisponible`);
      return false;
    }
    zipFiles.push({ name, data: asJson(data) });
    manifestFiles.push(
      fileEntry({
        name,
        status: meta.stale ? 'stale' : 'included',
        source: meta.source || 'live',
        executedAt: meta.executedAt || null,
        edition: meta.edition || edition,
        fingerprint: meta.fingerprint || null,
        note: meta.note || null
      })
    );
    return true;
  };

  // 1) Export 8 périodes + markdown + comparaisons
  if (eightPeriodExport && !eightPeriodExport.refused) {
    push('eight-periods/eight-periods.json', eightPeriodExport, {
      source: 'live_export',
      executedAt: eightPeriodExport.capturedAt || assembledAt,
      edition: eightPeriodExport.analysisEdition || edition,
      fingerprint: fpKey(liveFingerprint)
    });
    const md = renderAuditMarkdown(eightPeriodExport);
    push('eight-periods/analyses-report.md', md, {
      source: 'live_export',
      executedAt: eightPeriodExport.capturedAt || assembledAt
    });
    const comparisons = eightPeriodExport.comparisons || {};
    Object.entries(comparisons).forEach(([key, value]) => {
      push(`comparisons/${key}.json`, value, {
        source: 'live_export',
        executedAt: eightPeriodExport.capturedAt || assembledAt,
        note: value?.refused ? `refused:${value.reason}` : null
      });
    });
    if (!eightPeriodExport.complete) {
      warnings.push('Export 8 périodes incomplet');
      (eightPeriodExport.unavailable || []).forEach((row) => {
        warnings.push(`période ${row.period}: ${row.reason}`);
      });
    }
  } else {
    push('eight-periods/eight-periods.json', null, {
      note: eightPeriodExport?.reason || 'eight_period_export_missing'
    });
    push('eight-periods/analyses-report.md', null, { note: 'dépend de eight-periods' });
    ['7d_vs_30d', '6m_vs_1y', '1y_vs_2y', '2y_vs_all'].forEach((key) => {
      push(`comparisons/${key}.json`, null, { note: 'dépend de eight-periods' });
    });
  }

  // 2) Replay archivé (localStorage uniquement — jamais simulé depuis l’export navigateur)
  const replay = archive.replay || null;
  const replayFp = fpKey(replay?.fingerprint || replay?.dataFingerprint || null);
  const liveFp = fpKey(liveFingerprint);
  const replayStale =
    Boolean(replay && liveFp && replayFp && replayFp !== liveFp) ||
    Boolean(replay?.edition && replay.edition !== edition);
  if (replay) {
    push('evaluation/p6-replay.json', replay, {
      source: archive.replay ? 'localStorage' : 'public_analysis_eval',
      executedAt: replay.executedAt || archive.updatedAt || null,
      edition: replay.edition || archive.edition || null,
      fingerprint: replayFp,
      stale: replayStale,
      note: replayStale
        ? 'résultat de rejeu ancien ou empreinte / édition différente de la session live'
        : null
    });
  } else {
    push('evaluation/p6-replay.json', null, {
      note:
        'aucun rejeu dans localStorage. Générer via P4_REPLAY=1 npx vitest run src/utils/sport/__tests__/p4IdentityReplay.test.js → artifacts/analysis-eval/replays/p6-replay-latest.json (hors miroir public, données personnelles).'
    });
  }

  // 3) Jeux A/B/C archivés (localStorage — pas de PII publique)
  const archivedGames = archive.games?.bundle || null;
  const gameAArchived = archive.games?.A || archivedGames?.games?.A || null;
  const gameBArchived = archive.games?.B || archivedGames?.games?.B || null;
  const gameCArchived = archive.games?.C || archivedGames?.games?.C || null;

  push('evaluation/game-A.json', gameAArchived, {
    source: archive.games?.A ? 'localStorage' : archivedGames ? 'public_or_bundle' : null,
    executedAt: gameAArchived?.executedAt || null,
    edition: gameAArchived?.edition || null,
    note: gameAArchived ? null : 'résultat jeu A archivé indisponible'
  });
  push('evaluation/game-B.json', gameBArchived, {
    source: archive.games?.B ? 'localStorage' : archivedGames ? 'public_or_bundle' : null,
    executedAt: gameBArchived?.executedAt || null,
    edition: gameBArchived?.edition || null,
    note: gameBArchived
      ? gameBArchived.humanBlindComparison?.performed
        ? null
        : 'aucune comparaison humaine à l’aveugle dans cet artefact'
      : 'résultat jeu B archivé indisponible'
  });
  push('evaluation/game-C.json', gameCArchived, {
    source: archive.games?.C ? 'localStorage' : archivedGames ? 'public_or_bundle' : null,
    executedAt: gameCArchived?.executedAt || null,
    edition: gameCArchived?.edition || null,
    note: gameCArchived ? null : 'résultat jeu C archivé indisponible'
  });

  // 4) Jeux live (rapides, pas la suite vitest) — clairement étiquetés
  let liveSuite = null;
  if (includeLiveGames && insights) {
    liveSuite = runStructuredEvalSuite({ insights, measure, p6 });
    push('evaluation/live/game-A.json', liveSuite.A, {
      source: 'live_insights_snapshot',
      executedAt: liveSuite.A.executedAt,
      edition,
      fingerprint: liveFp,
      note: 'calculé à l’export depuis les insights de la session ; ce n’est pas un rejeu vitest'
    });
    push('evaluation/live/game-B.json', liveSuite.B, {
      source: 'live_insights_snapshot',
      executedAt: liveSuite.B.executedAt,
      edition,
      fingerprint: liveFp,
      note: liveSuite.B.humanBlindComparison.performed
        ? null
        : 'aucune comparaison humaine à l’aveugle n’a été effectuée'
    });
    push('evaluation/live/game-C.json', liveSuite.C, {
      source: 'live_insights_snapshot',
      executedAt: liveSuite.C.executedAt,
      edition,
      fingerprint: liveFp
    });
    upsertEvalArchiveSlice({
      edition,
      fingerprint: liveFingerprint,
      games: {
        A: liveSuite.A,
        B: liveSuite.B,
        C: liveSuite.C,
        bundle: liveSuite.bundle
      },
      summary: liveSuite.summaryMd
    });
  } else if (includeLiveGames) {
    ['evaluation/live/game-A.json', 'evaluation/live/game-B.json', 'evaluation/live/game-C.json'].forEach(
      (name) =>
        push(name, null, {
          note: 'insights live indisponibles — jeux live non calculés'
        })
    );
  }

  // 5) Réconciliation publication + décisions (extrait live 8 périodes)
  if (eightPeriodExport?.periods) {
    const reconciliation = Object.entries(eightPeriodExport.periods).map(([period, dossier]) => {
      const insights = dossier?.insights || dossier?.userAccessible || null;
      const p6 = dossier?.internal?.p6 || dossier?.p6 || null;
      return {
        period,
        publicationAuthority: insights?.publicationAuthority || dossier?.publicationAuthority || null,
        registryExpected: p6?.counters
          ? (p6.counters.priority || 0) + (p6.counters.reserve || 0)
          : null,
        publishedAccessible:
          (dossier?.userAccessible?.priority || []).length +
          (dossier?.userAccessible?.reserve || []).length,
        publicationReconciliation: insights?.publicationReconciliation || null,
        dispositionsCount: (insights?.publicationDispositions || []).length,
        dom: {
          verified: dossier?.domVerified === true,
          status: dossier?.domVerified
            ? 'rendered_and_verified'
            : dossier?.provenance === 'computed_not_rendered'
              ? 'computed_not_rendered'
              : dossier?.provenance === 'published_rendered'
                ? 'rendered_divergent_or_incomplete'
                : 'not_verifiable'
        }
      };
    });
    push('evaluation/publication-reconciliation.json', { periods: reconciliation }, {
      source: 'live_export',
      executedAt: eightPeriodExport.capturedAt || assembledAt
    });
    push(
      'evaluation/selection-dispositions.json',
      {
        note: 'Dispositions par période lorsque présentes dans le paquet',
        periods: Object.fromEntries(
          Object.entries(eightPeriodExport.periods).map(([period, dossier]) => [
            period,
            dossier?.insights?.publicationDispositions ||
              dossier?.internal?.publicationDispositions ||
              []
          ])
        )
      },
      { source: 'live_export', executedAt: eightPeriodExport.capturedAt || assembledAt }
    );
  } else {
    push('evaluation/publication-reconciliation.json', null, { note: 'dépend de eight-periods' });
    push('evaluation/selection-dispositions.json', null, { note: 'dépend de eight-periods' });
  }

  // 6) Synthèse d’évaluation
  const archivedSummary =
    (typeof archive.summary === 'string' && archive.summary) ||
    publicArtifacts.available?.summary ||
    null;
  const summaryParts = [
    '# Rapport synthétique d’évaluation P6',
    '',
    `Assemblé : ${assembledAt}`,
    `Édition live : \`${edition}\``,
    `Fingerprint live : \`${liveFp || 'n/a'}\``,
    '',
    '## Artefacts',
    ...manifestFiles.map(
      (f) =>
        `- \`${f.name}\` — **${f.status}**${f.source ? ` (${f.source})` : ''}${f.note ? ` — ${f.note}` : ''}`
    ),
    '',
    '## Avertissements',
    ...(warnings.length ? warnings.map((w) => `- ${w}`) : ['- aucun']),
    '',
    '## Synthèse live A/B/C',
    liveSuite
      ? [
          `- A : ${liveSuite.A.pass ? 'PASS' : 'FAIL'}`,
          `- B : ${liveSuite.B.pass ? 'PASS' : 'FAIL'} (aveugle humain : non)`,
          `- C : ${liveSuite.C.pass ? 'PASS' : 'FAIL'}`,
          '',
          '> Aucune comparaison humaine à l’aveugle n’a été réalisée dans cet export.'
        ].join('\n')
      : '_jeux live non calculés_',
    '',
    '## Synthèse archivée (si présente)',
    archivedSummary || '_aucune synthèse archivée_',
    '',
    '## Rejeu',
    replay
      ? `Présent (exécuté ${replay.executedAt || 'n/a'}, édition ${replay.edition || 'n/a'}).`
      : 'Absent du navigateur. Générer hors UI : `P4_REPLAY=1 npx vitest run src/utils/sport/__tests__/p4IdentityReplay.test.js` → `artifacts/analysis-eval/replays/`.',
    '',
    '## DOM',
    'Toute preuve DOM absente est marquée non vérifiée. Aucune validation DOM n’est fabriquée.',
    '',
    '## Comparaison humaine à l’aveugle',
    '**Non effectuée** dans cet assemblage.'
  ];
  const summaryMd = summaryParts.join('\n');
  push('evaluation/evaluation-summary.md', summaryMd, {
    source: 'assembled',
    executedAt: assembledAt,
    edition,
    fingerprint: liveFp
  });

  // 7) Bilan Mission 5 s’il est servi localement (fetch optionnel)
  try {
    const bilanRes = await fetch('/docs/analyses-documentation/moteur%20analyse%20v2/analysis-engine/MISSION5_BILAN_P6.md', {
      cache: 'no-store'
    });
    if (bilanRes.ok) {
      push('evaluation/MISSION5_BILAN_P6.md', await bilanRes.text(), {
        source: 'docs_fetch',
        executedAt: assembledAt
      });
    } else {
      push('evaluation/MISSION5_BILAN_P6.md', null, {
        note: 'bilan non servi par le serveur de dev — joindre le fichier docs localement si besoin'
      });
    }
  } catch {
    push('evaluation/MISSION5_BILAN_P6.md', null, {
      note: 'bilan non accessible depuis le navigateur'
    });
  }

  const manifest = {
    schema: 'momentum.completeAuditManifest.v1',
    assembledAt,
    edition,
    liveFingerprint,
    didNotRerunVitestSuite: true,
    didNotRerunP6Replay: true,
    publicFetch: {
      fetchedAt: publicArtifacts.fetchedAt,
      missing: publicArtifacts.missing
    },
    files: manifestFiles,
    warnings,
    humanBlindComparison: {
      performed: false,
      reason: 'not_performed_in_this_assembly'
    }
  };
  push('MANIFEST.json', manifest, {
    source: 'assembled',
    executedAt: assembledAt,
    edition,
    fingerprint: liveFp
  });

  const stamp = assembledAt.replace(/[:.]/g, '-');
  const filename = `momentum-p6-complete-audit-${stamp}.zip`;
  let downloadResult = null;
  if (download) {
    downloadResult = downloadZipBlob(zipFiles, filename);
    if (!downloadResult.ok && zipFiles[0]) {
      // repli : au moins le manifeste
      downloadResult = downloadTextFile(
        `momentum-p6-complete-audit-manifest-${stamp}.json`,
        asJson(manifest),
        'application/json'
      );
    }
  }

  return {
    schema: 'momentum.completeAuditDossier.v1',
    assembledAt,
    edition,
    liveFingerprint,
    fileCount: zipFiles.length,
    warnings,
    manifest,
    download: downloadResult,
    zipFilesPreview: zipFiles.map((f) => f.name)
  };
}
