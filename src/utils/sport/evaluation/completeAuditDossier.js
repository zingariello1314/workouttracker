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
import { buildAuditIaMarkdown, buildAuditIaConcise } from './auditIaReport';
import { buildAnalyticalAudit, validateAnalyticalAudit } from './buildAnalyticalAudit';

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
  includeLiveGames = true,
  domVerify = null,
  gamesByPeriod = null
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

  // 0) Rapport d’audit IA + JSON normalisé (Mission 11)
  const auditIaOpts = {
    eightPeriodExport,
    insights,
    measure,
    p6,
    snapshotFingerprint: liveFingerprint,
    gamesByPeriod,
    underexploration: p6?.underexploration || null,
    domVerify,
    mission: null
  };
  push('AUDIT_IA.md', buildAuditIaMarkdown({ ...auditIaOpts, mode: 'detailed' }), {
    source: 'assembled',
    executedAt: assembledAt,
    note: 'Markdown autonome pour évaluateur extérieur'
  });
  push('AUDIT_IA_concise.md', buildAuditIaConcise(auditIaOpts), {
    source: 'assembled',
    executedAt: assembledAt
  });
  const analyticalAudit = buildAnalyticalAudit({
    eightPeriodExport,
    insights,
    measure,
    p6,
    snapshot,
    activeProgram: snapshot?.activeProgram || null,
    gamesByPeriod,
    domVerify,
    memorySummary: {
      note: 'historyCount nul = souvent historique non passé à l’export, pas mémoire vide'
    },
    underexploration: p6?.underexploration || null
  });
  const auditValidation = validateAnalyticalAudit(analyticalAudit);
  if (!auditValidation.ok) {
    warnings.push(`ANALYTICAL_AUDIT validation: ${auditValidation.errors.join(', ')}`);
  }
  push('ANALYTICAL_AUDIT.json', analyticalAudit, {
    source: 'assembled',
    executedAt: assembledAt,
    fingerprint: fpKey(liveFingerprint),
    note: `schema v1 · cards=${auditValidation.counts.cards} · claims=${auditValidation.counts.claims} · candidates=${auditValidation.counts.candidates}`
  });
  push(
    'ANALYTICAL_AUDIT.validation.json',
    { ...auditValidation, assembledAt, edition },
    { source: 'assembled', executedAt: assembledAt }
  );

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

  // 2) Rejeux archivés (localStorage / bridge injecté — jamais simulés depuis l’UI seule)
  const replay = archive.replay || null;
  const replayFp = fpKey(replay?.fingerprint || replay?.dataFingerprint || null);
  const liveFp = fpKey(liveFingerprint);
  const replayStale =
    Boolean(replay && liveFp && replayFp && replayFp !== liveFp) ||
    Boolean(replay?.edition && replay.edition !== edition && !/p6-sovereign-v[45]/.test(String(replay.edition || '')));
  if (replay) {
    push('evaluation/p6-replay.json', replay, {
      source: 'localStorage_or_bridge',
      executedAt: replay.executedAt || archive.updatedAt || null,
      edition: replay.edition || archive.edition || null,
      fingerprint: replayFp,
      stale: replayStale,
      note: replayStale
        ? 'rejeu empreinte/édition différente de la session live — conservé pour comparaison'
        : null
    });
    const replayEditionTag =
      /p6-sovereign-v(\d+)/.exec(String(replay.edition || ''))?.[1] || null;
    if (replayEditionTag) {
      push(`evaluation/p6-replay-v${replayEditionTag}.json`, replay, {
        source: 'localStorage_or_bridge',
        executedAt: replay.executedAt,
        edition: replay.edition,
        note: `rejeu aligné sur l’édition réelle v${replayEditionTag}`
      });
    }
  } else {
    push('evaluation/p6-replay.json', null, {
      note:
        'absent. Lancer: set P4_REPLAY=1&& npx vitest run src/utils/sport/__tests__/p6Mission5BisReplay.test.js puis coller artifacts/analysis-eval/browser-bridge/eval-archive-inject.json via le bouton « Charger artefacts rejeu ».'
    });
  }
  if (archive.v3Baseline || archive.comparisonV3V4) {
    // v3 peut être dans le bridge
  }
  push(
    'evaluation/p6-replay-v3-baseline.json',
    archive.v3Baseline || null,
    {
      note: archive.v3Baseline
        ? null
        : 'baseline v3 absente du bridge — fichier local artifacts/analysis-eval/baselines/…'
    }
  );
  push('evaluation/comparison-v3-v4.json', archive.comparisonV3V4 || replay?.comparisonV3V4 || null, {
    note:
      archive.comparisonV3V4 || replay?.comparisonV3V4
        ? null
        : 'comparaison v3/v4 absente — générée par le rejeu Mission 5 bis'
  });
  push('evaluation/qualitative-blind-pack.json', archive.qualitativeBlind || null, {
    note: archive.qualitativeBlind
      ? 'paquet aveugle — jugement humain NON effectué'
      : 'paquet qualitatif aveugle absent'
  });
  push('evaluation/qualitative-blind-key.json', archive.qualitativeKey || null, {
    note: archive.qualitativeKey
      ? 'clé de déchiffrement — ne pas montrer pendant un jugement humain'
      : 'clé absente'
  });

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

  // 4b) Jeux live par période (si fournis / bridge)
  const byPeriod = gamesByPeriod || archive.games?.bundle?.gamesByPeriod || replay?.gamesByPeriod || null;
  if (byPeriod) {
    push('evaluation/live/games-by-period.json', byPeriod, {
      source: 'bridge_or_replay',
      executedAt: assembledAt
    });
  } else {
    push('evaluation/live/games-by-period.json', null, {
      note: 'jeux par horizon absents — disponibles après rejeu Mission 5 bis'
    });
  }

  // DOM
  if (domVerify && !domVerify.refused) {
    push('evaluation/dom-eight-periods.json', domVerify, {
      source: 'live_dom_verify',
      executedAt: domVerify.finishedAt || assembledAt,
      note: domVerify.editorialMemoryModified
        ? 'ATTENTION mémoire modifiée'
        : 'mémoire éditoriale non modifiée'
    });
  } else {
    push('evaluation/dom-eight-periods.json', null, {
      note:
        domVerify?.reason ||
        'DOM non vérifié dans cet export — utiliser « Vérifier les 8 périodes (DOM) » avant l’export'
    });
  }

  // 5) Réconciliation publication + décisions (extrait live 8 périodes)
  // Les dossiers v2 portent les dispositions sous registry.*, pas insights.*
  if (eightPeriodExport?.periods) {
    const extractDispositions = (dossier) =>
      dossier?.registry?.publicationDispositions ||
      dossier?.insights?.publicationDispositions ||
      dossier?.internal?.publicationDispositions ||
      dossier?.publication?.publicationDispositions ||
      [];
    const extractReconciliation = (dossier) =>
      dossier?.registry?.publicationReconciliation ||
      dossier?.insights?.publicationReconciliation ||
      dossier?.internal?.publicationReconciliation ||
      null;
    const extractCounters = (dossier) =>
      dossier?.registry?.counters ||
      dossier?.internal?.p6?.counters ||
      dossier?.p6?.counters ||
      null;

    const reconciliation = Object.entries(eightPeriodExport.periods).map(([period, dossier]) => {
      const dispositions = extractDispositions(dossier);
      const publicationReconciliation = extractReconciliation(dossier);
      const counters = extractCounters(dossier);
      const registryExpected = counters
        ? (counters.priority || 0) + (counters.reserve || 0)
        : dossier?.registryAccessibleExpected ??
          dossier?.userAccessible?.counts?.accessible ??
          null;
      return {
        period,
        publicationAuthority:
          dossier?.publicationAuthority ||
          dossier?.insights?.publicationAuthority ||
          publicationReconciliation?.authority ||
          null,
        registryExpected,
        publishedAccessible:
          (dossier?.userAccessible?.priority || []).length +
          (dossier?.userAccessible?.reserve || []).length,
        publicationReconciliation,
        dispositionsCount: Array.isArray(dispositions) ? dispositions.length : 0,
        dispositionsSample: Array.isArray(dispositions) ? dispositions.slice(0, 8) : [],
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
    const dispositionsByPeriod = Object.fromEntries(
      Object.entries(eightPeriodExport.periods).map(([period, dossier]) => [
        period,
        extractDispositions(dossier)
      ])
    );
    push(
      'evaluation/selection-dispositions.json',
      {
        note: 'Dispositions par période extraites de registry/insights du JSON principal',
        periods: dispositionsByPeriod,
        concordance: {
          schema: 'momentum.dispositionsConcordance.v1',
          periods: Object.entries(eightPeriodExport.periods).map(([period, dossier]) => {
            const extracted = extractDispositions(dossier);
            const mainCount = Array.isArray(extracted) ? extracted.length : 0;
            return {
              period,
              extractedCount: mainCount,
              matchesMain: mainCount > 0 || !dossier?.registry,
              source: dossier?.registry?.publicationDispositions
                ? 'registry.publicationDispositions'
                : dossier?.insights?.publicationDispositions
                  ? 'insights.publicationDispositions'
                  : 'none'
            };
          })
        }
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

  // 6b) Secteurs Mission 7 — compréhension programme + sous-exploration (si présents live)
  push(
    'program-understanding/program-structure.json',
    p6?.structuralGraph || insights?.structuralGraph || null,
    { note: p6?.structuralGraph || insights?.structuralGraph ? null : 'graphe structurel absent de cette session' }
  );
  push(
    'program-understanding/multidimensional-adherence.json',
    p6?.adherenceVectors || insights?.adherenceVectors || null,
    { note: 'vecteurs d’adhérence si calculés' }
  );
  push(
    'reasoning/underexploration-report.json',
    p6?.underexploration || null,
    { note: p6?.underexploration ? null : 'rapport de sous-exploration absent' }
  );
  push(
    'reasoning/conclusion-hierarchy.json',
    p6?.hierarchy || null,
    { note: p6?.hierarchy ? null : 'hiérarchie des conclusions absente' }
  );
  push(
    'reasoning/p7-actionability-prep.json',
    p6?.p7Prep || { schema: 'momentum.p7ActionabilityPrep.v1', limit: 'préparation P7 — non développé' },
    { source: 'assembled', executedAt: assembledAt }
  );
  const periodKeys = eightPeriodExport?.periods ? Object.keys(eightPeriodExport.periods) : [];
  const cardsMention = (needle) =>
    periodKeys.some((p) => {
      const blob = JSON.stringify(eightPeriodExport?.periods?.[p] || {}).toLowerCase();
      return blob.includes(needle);
    });
  const fp = liveFingerprint || {};
  const statusOf = ({ inEngine, inSnapshot, inFingerprint, inExporter }) => ({
    inEngine: Boolean(inEngine),
    inSnapshot: Boolean(inSnapshot),
    inFingerprint: Boolean(inFingerprint),
    inExporter: Boolean(inExporter),
    // false global historique = souvent « absent du snapshot passé à l’exporteur », pas « moteur sans source »
    legacyBoolean: Boolean(inSnapshot)
  });
  const coverageBySource = {
    program: statusOf({
      inEngine: cardsMention('program') || Boolean(snapshot?.activeProgram),
      inSnapshot: Boolean(snapshot?.activeProgram || snapshot?.programs?.length),
      inFingerprint: (fp.programKeys ?? fp.scheduleDays ?? null) != null,
      inExporter: Boolean(snapshot)
    }),
    identities: statusOf({
      inEngine: cardsMention('exercise') || cardsMention('ex:'),
      inSnapshot: Boolean(snapshot?.exercises || snapshot?.exerciseCatalog || snapshot?.reps),
      inFingerprint: (fp.identityKeys ?? fp.exerciseKeys ?? 0) > 0 || Boolean(fp.repsKeys),
      inExporter: Boolean(snapshot)
    }),
    loads: statusOf({
      inEngine: cardsMention('charge') || cardsMention('resistance_progression') || cardsMention('fromvalue'),
      inSnapshot: Boolean(snapshot?.loads || snapshot?.weightHistory || snapshot?.weights),
      inFingerprint: (fp.weightKeys ?? 0) > 0,
      inExporter: Boolean(snapshot)
    }),
    sets: statusOf({
      inEngine: cardsMention('série') || cardsMention('series') || cardsMention('setcount'),
      inSnapshot: Boolean(snapshot?.history || snapshot?.days || snapshot?.reps),
      inFingerprint: (fp.repsKeys ?? 0) > 0,
      inExporter: Boolean(snapshot)
    }),
    durations: statusOf({
      inEngine: measure?.minutes != null || cardsMention('minute'),
      inSnapshot: Boolean(measure?.minutes != null || measure?.durationContract || snapshot?.sessionDurations),
      inFingerprint: (fp.durationKeys ?? 0) > 0,
      inExporter: Boolean(measure || snapshot)
    }),
    garmin: statusOf({
      inEngine: measure?.activeKcal != null || cardsMention('garmin') || cardsMention('kcal'),
      inSnapshot: Boolean(snapshot?.garminData),
      inFingerprint: Boolean(fp.garminHash || fp.garminKeys),
      inExporter: Boolean(snapshot)
    }),
    sleep: statusOf({
      inEngine: cardsMention('sommeil') || cardsMention('sleep'),
      inSnapshot: Boolean(snapshot?.garminData?.dailyMetrics || snapshot?.sleep),
      inFingerprint: Boolean(fp.sleepKeys || fp.garminHash),
      inExporter: Boolean(snapshot)
    }),
    challenges: statusOf({
      inEngine: cardsMention('défi') || cardsMention('challenge'),
      inSnapshot: Boolean(snapshot?.challenges || measure?.durationContract?.challengeSessionMinutes),
      inFingerprint: (fp.challengeKeys ?? 0) > 0,
      inExporter: Boolean(snapshot)
    })
  };
  push(
    'source-data/data-coverage.json',
    {
      schema: 'momentum.dataCoverage.v3',
      note:
        'Quatre statuts distincts : inEngine (conclusions utilisent la source), inSnapshot (présent dans le snapshot), inFingerprint (empreinte), inExporter (passé à l’assemblage). Un fingerprint weightKeys=0 n’infirme pas des cartes de charges si inEngine=true.',
      liveFingerprint,
      hasSnapshot: Boolean(snapshot),
      hasEightPeriods: Boolean(eightPeriodExport?.periods),
      periodCount: periodKeys.length,
      sources: coverageBySource,
      fingerprintMustCover: [
        'program',
        'identities',
        'loads',
        'sets',
        'durations',
        'garmin',
        'sleep',
        'challenges'
      ]
    },
    { source: 'assembled', executedAt: assembledAt, fingerprint: liveFp }
  );

  // 7) Bilans Mission 9/10 (+ archives) s’ils sont servis localement
  const bilanNames = [
    'MISSION15_BILAN_P6.md',
    'DIAGNOSTIC_INTEGRITE_EXPORTS_MISSION15.md',
    'RAPPORT_COMPARATIF_V13_V14_MISSION15.md',
    'RAPPORT_VALIDATION_P6_MISSION15.md',
    'MISSION14_BILAN_P6.md',
    'DIAGNOSTIC_HIERARCHIE_ET_RAISONNEMENT_MISSION14.md',
    'RAPPORT_COMPARATIF_V12_V13_MISSION14.md',
    'MISSION13_BILAN_P6.md',
    'DIAGNOSTIC_CAUSES_RACINES_MISSION13.md',
    'RAPPORT_CLASSIFICATION_EXERCICES_MISSION13.md',
    'RAPPORT_COMPARATIF_V11_V12_MISSION13.md',
    'RAPPORT_COHERENCE_INTER_HORIZONS_MISSION13.md',
    'MISSION12_BILAN_P6.md',
    'DIAGNOSTIC_RAISONNEMENT_MISSION12.md',
    'MISSION11_BILAN_P6.md',
    'DIAGNOSTIC_INTELLIGENCE_ANALYTIQUE_P6.md',
    'MISSION10_BILAN_P6.md',
    'MISSION9_BILAN_P6.md'
  ];
  for (const name of bilanNames) {
    try {
      const bilanRes = await fetch(
        `/docs/analyses-documentation/moteur%20analyse%20v2/analysis-engine/${name}`,
        { cache: 'no-store' }
      );
      if (bilanRes.ok) {
        push(`evaluation/${name}`, await bilanRes.text(), {
          source: 'docs_fetch',
          executedAt: assembledAt
        });
      } else {
        push(`evaluation/${name}`, null, {
          note: 'bilan non servi par le serveur de dev'
        });
      }
    } catch {
      push(`evaluation/${name}`, null, { note: 'bilan non accessible depuis le navigateur' });
    }
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
    zipFilesPreview: zipFiles.map((f) => f.name),
    // Contenu inspectable hors téléchargement (tests / agent) — pas exposé en public
    zipFiles: download ? undefined : zipFiles
  };
}
