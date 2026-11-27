/**
 * Mission 32/33 — paquet d’entrées live pour rejeu (≠ export de conclusions).
 * Lecture seule : ne modifie ni IndexedDB ni mémoire éditoriale.
 *
 * Contrat : un paquet de rejeu doit représenter toutes les entrées nécessaires
 * à la reproduction du calcul qu’il prétend rejouer. Si programme / Garmin /
 * mémoire utilisés par le moteur manquent ici, déclarer non_reproductible —
 * ne jamais inventer program/garmin depuis un état partiel.
 */

import { analysisEditionKey, ANALYSIS_EDITION_PARTS } from '../analysisEdition';
import { snapshotFingerprint } from '../analysisEnvironmentDossier';

function countKeys(obj) {
  return obj && typeof obj === 'object' ? Object.keys(obj).length : 0;
}

/** Parse « 4×8 » / « 3x10 » — même contrat que sessionStructureGraph (source, pas dérivé). */
function parseSeriesScheme(text) {
  const raw = String(text || '').trim();
  const matched = raw.match(/(\d+)\s*[×xX*]\s*(\d+)/);
  if (!matched) return { sets: null, repsPerSet: null, total: null };
  const sets = Number(matched[1]);
  const repsPerSet = Number(matched[2]);
  return { sets, repsPerSet, total: sets * repsPerSet };
}

function slimExercise(ex) {
  // Mission 36 — la prescription moteur lit surtout `series` (ex. « 4×8 »), pas sets/reps seuls.
  const series = ex?.series || ex?.scheme || null;
  const scheme = parseSeriesScheme(series);
  const sets =
    scheme.sets != null
      ? scheme.sets
      : ex?.sets != null
        ? Number(ex.sets)
        : Number(ex?.meta?.setCount) || null;
  const reps =
    scheme.repsPerSet != null
      ? scheme.repsPerSet
      : ex?.reps != null && ex.reps !== ''
        ? ex.reps
        : ex?.targetReps ?? ex?.meta?.repsMax ?? null;
  return {
    id: ex?.originalId ?? ex?.storageId ?? ex?.id ?? ex?.exerciseId ?? null,
    name: ex?.name || null,
    series: series ? String(series) : null,
    sets: Number.isFinite(Number(sets)) && Number(sets) > 0 ? Number(sets) : null,
    reps: reps != null && reps !== '' ? reps : null,
    plannedReps: scheme.total,
    gtg: ex?.gtg === true || ex?.isGtg === true || null
  };
}

function slimSchedule(schedule) {
  if (!schedule || typeof schedule !== 'object') return null;
  const out = {};
  Object.entries(schedule).forEach(([day, val]) => {
    out[day] = {
      label: val?.label || val?.name || null,
      exercises: (val?.exercises || []).map(slimExercise)
    };
  });
  return Object.keys(out).length ? out : null;
}

function slimProgram(program) {
  if (!program || typeof program !== 'object') return null;
  const schedule = slimSchedule(program.schedule);
  return {
    id: program.id || program.programId || null,
    name: program.name || null,
    active: program.active ?? null,
    version: program.version || program.updatedAt || program.modifiedAt || null,
    scheduleDayCount: countKeys(program.schedule),
    // Mission 35 — squelette de séances pour rejouer familles / prescriptions.
    schedule,
    // prescriptions légères : ids + noms seulement (compat M33)
    exerciseNameHints: (() => {
      const out = {};
      Object.values(program.schedule || {}).forEach((day) => {
        (day?.exercises || []).forEach((ex) => {
          const id = ex?.originalId ?? ex?.storageId ?? ex?.id ?? ex?.exerciseId;
          if (id != null && ex?.name) out[String(id)] = String(ex.name);
        });
      });
      return out;
    })()
  };
}

function slimGarmin(garmin) {
  if (!garmin || typeof garmin !== 'object') return null;
  const daily = garmin.dailyMetrics || garmin.daily || null;
  const dates = daily && typeof daily === 'object' ? Object.keys(daily).sort() : [];
  return {
    dailyMetricsDays: dates.length,
    firstDay: dates[0] || null,
    lastDay: dates[dates.length - 1] || null,
    // Conservé pour rejeu sommeil / charge : métriques journalières telles quelles
    dailyMetrics: daily || null,
    hasSleep: dates.some((d) => daily[d]?.sleep != null || daily[d]?.sleepScore != null),
    hasHrv: dates.some((d) => daily[d]?.hrv != null || daily[d]?.hrvStatus != null)
  };
}

function slimMemory(memory) {
  if (!memory || typeof memory !== 'object') return null;
  return {
    phenomenonIds: Object.keys(memory.phenomena || {}),
    publicationCount: Array.isArray(memory.publications) ? memory.publications.length : 0,
    exposureCount: Array.isArray(memory.exposures) ? memory.exposures.length : 0,
    // Pas de dump intégral des textes — ids + états pour idempotence
    publications: (memory.publications || []).slice(0, 200).map((p) => ({
      id: p.id || p.publicationId || null,
      phenomenonId: p.phenomenonId || null,
      period: p.period || null,
      knownAt: p.knownAt || p.at || null
    })),
    phenomena: Object.fromEntries(
      Object.entries(memory.phenomena || {}).map(([id, phen]) => [
        id,
        {
          state: phen?.state || null,
          subjectKey: phen?.subjectKey || null,
          lastTransition: phen?.lastTransition || null
        }
      ])
    )
  };
}

function assessReproducibility({
  program,
  garmin,
  memory,
  engineFingerprint = null,
  packDigest = null
}) {
  const gaps = [];
  const engine = engineFingerprint && typeof engineFingerprint === 'object' ? engineFingerprint : null;
  if (engine?.programId && !program) {
    gaps.push({
      field: 'program',
      engine: engine.programId,
      pack: null,
      note: 'Le calcul 8 périodes a consommé un programme ; LIVE_INPUTS ne le contient pas'
    });
  }
  if ((engine?.garminSleepDays || 0) > 0 && !garmin) {
    gaps.push({
      field: 'garmin',
      engine: { garminSleepDays: engine.garminSleepDays },
      pack: null,
      note: 'Le calcul 8 périodes a consommé Garmin ; LIVE_INPUTS ne le contient pas'
    });
  }
  if (engine?.digest && packDigest && engine.digest !== packDigest) {
    gaps.push({
      field: 'fingerprint_digest',
      engine: engine.digest,
      pack: packDigest,
      note: 'Empreinte des entrées LIVE ≠ empreinte du run 8 périodes'
    });
  }
  // Mémoire : absence ≠ inventer ; signaler si le run en a une
  if (!memory && engine) {
    // soft gap — n’empêche pas le rejeu des calculs purs, mais limite l’édition
  }
  if (gaps.length) {
    return {
      status: 'non_reproductible',
      reason: 'inputs_incomplete_vs_engine_run',
      gaps,
      note: 'Ne pas fabriquer program/garmin manquants. Ré-exporter avec contextes hydratés.'
    };
  }
  return {
    status: 'reproductible_si_sources_completes',
    reason: 'pack_matches_declared_contexts',
    gaps: [],
    note: 'Rejeu exact possible uniquement si sources.reps / setLogs / etc. sont présents et inchangés'
  };
}

/**
 * @param {object} opts
 * @param {object} opts.snapshot — snapshot sportif consommé
 * @param {object} [opts.garminData]
 * @param {object} [opts.activeProgram]
 * @param {object} [opts.nameMap]
 * @param {object} [opts.analyticalMemory] — lecture seule
 * @param {string} [opts.anchorDate] — déprécié : préférer lastSessionDate / analysisWindowEnd
 * @param {string} [opts.analysisWindowEnd] — fin de fenêtre d’analyse (souvent « aujourd’hui »)
 * @param {object} [opts.selectionParams]
 * @param {object} [opts.workerInfo]
 * @param {object} [opts.engineFingerprint] — fingerprint du run 8 périodes pour contrôle croisé
 */
export function buildLiveReplayInputPack({
  snapshot = null,
  garminData = null,
  activeProgram = null,
  nameMap = null,
  analyticalMemory = null,
  anchorDate = null,
  analysisWindowEnd = null,
  timezone = 'Europe/Paris',
  selectionParams = null,
  workerInfo = null,
  observedResultsRef = null,
  engineFingerprint = null
} = {}) {
  if (!snapshot || typeof snapshot !== 'object') {
    return {
      schema: 'momentum.liveReplayInputPack.v2',
      ok: false,
      reason: 'snapshot_missing',
      reproducibility: {
        status: 'non_reproductible',
        reason: 'snapshot_missing',
        gaps: [{ field: 'snapshot', note: 'aucune entrée' }]
      }
    };
  }

  const program = activeProgram || snapshot.activeProgram || null;
  const garmin = garminData || snapshot.garminData || null;
  const names =
    nameMap ||
    snapshot.nameMap ||
    snapshot.exerciseNameMap ||
    null;

  const fingerprint = snapshotFingerprint(snapshot, {
    activeProgram: program,
    garminData: garmin,
    nameMap: names
  });

  const lastSessionDate = fingerprint?.lastRepKey?.slice?.(0, 10) || null;
  // anchorDate historique = dernière clé de reps (dernière séance), PAS la fin de fenêtre.
  const resolvedLastSession = anchorDate || lastSessionDate;
  const windowEnd = analysisWindowEnd || null;

  const sources = {
    reps: snapshot.reps || null,
    checkedExercises: snapshot.checkedExercises || null,
    exerciseWeights: snapshot.exerciseWeights || snapshot.weights || null,
    exerciseSetLogs: snapshot.exerciseSetLogs || snapshot.setLogs || null,
    enduranceData: snapshot.enduranceData
      ? {
          gtg: snapshot.enduranceData.gtg || null,
          sessions: snapshot.enduranceData.sessions || null,
          manualDailyWalkByDate: snapshot.enduranceData.manualDailyWalkByDate || null
        }
      : null,
    manualSleepByDate: snapshot.manualSleepByDate || null,
    challenges: snapshot.challenges || null,
    sessionDurations: snapshot.sessionDurations || snapshot.sessionFeedbacks || null
  };

  const programSlim = slimProgram(program);
  const reproducibility = assessReproducibility({
    program,
    garmin,
    memory: analyticalMemory,
    engineFingerprint,
    packDigest: fingerprint?.digest || null
  });
  // Mission 35 — qualifier la limite programme sans faux PASS déclaratif.
  if (
    programSlim &&
    programSlim.scheduleDayCount > 0 &&
    !programSlim.schedule
  ) {
    reproducibility.status = 'reproductible_si_sources_completes_limite_programme';
    reproducibility.gaps = [
      ...(reproducibility.gaps || []),
      {
        field: 'program.schedule',
        note: 'Jours de programme comptés sans squelette de séances exporté'
      }
    ];
    reproducibility.note =
      'Digest aligné, mais familles/prescriptions exigent le programme chargé par l’app ou un squelette schedule';
  } else if (programSlim?.schedule) {
    const exRows = Object.values(programSlim.schedule).flatMap((d) => d?.exercises || []);
    const withSeries = exRows.filter((e) => e?.series || (e?.sets != null && e?.reps != null && e.reps !== ''));
    reproducibility.programStructure =
      withSeries.length > 0 ? 'schedule_with_prescriptions' : 'schedule_skeleton_ids_only';
    if (exRows.length && withSeries.length === 0) {
      reproducibility.status = 'reproductible_si_sources_completes_limite_prescriptions';
      reproducibility.gaps = [
        ...(reproducibility.gaps || []),
        {
          field: 'program.schedule.series',
          note: 'Squelette d’exercices sans champ series/sets/reps — totaux planifiés non recalculables depuis le pack'
        }
      ];
      reproducibility.note =
        'Digest aligné, mais prescriptions (series) absentes : familles OK, volumes planifiés non rejouables hors app';
    }
  } else if (programSlim) {
    reproducibility.programStructure = 'names_only';
  }

  return {
    schema: 'momentum.liveReplayInputPack.v2',
    ok: true,
    capturedAt: new Date().toISOString(),
    separation: {
      inputs: 'sources + program + garmin + identities + memoryInitial',
      parameters: 'edition + selectionParams + lastSessionDate + analysisWindowEnd + timezone + worker',
      observedResults: observedResultsRef || 'see sibling ANALYTICAL_AUDIT / eight-periods (not duplicated here)'
    },
    parameters: {
      timezone,
      // Mission 33 — nommage explicite (évite la confusion ancre = fin de fenêtre)
      lastSessionDate: resolvedLastSession,
      analysisWindowEnd: windowEnd,
      // Conservé pour compat lecteurs M32 : même valeur que lastSessionDate
      anchorDate: resolvedLastSession,
      anchorDateMeaning:
        'lastSessionDate — date de la dernière répétition cochée (pas la fin de la fenêtre d’analyse)',
      editionKey: analysisEditionKey(),
      editionParts: { ...ANALYSIS_EDITION_PARTS },
      selectionParams: selectionParams || {
        note: 'paramètres implicites de ANALYSIS_EDITION_PARTS.selection / review'
      },
      worker: workerInfo || null
    },
    fingerprints: {
      snapshot: fingerprint,
      digest: fingerprint?.digest || null,
      sources: fingerprint?.sources || null,
      nameMapSize: fingerprint?.nameMapSize ?? (names ? countKeys(names) : 0),
      engineRunDigest: engineFingerprint?.digest || null
    },
    reproducibility,
    sources,
    program: programSlim,
    programsIndex: Array.isArray(snapshot.programs)
      ? snapshot.programs.map((p) => ({ id: p?.id, name: p?.name, active: p?.active }))
      : null,
    identities: {
      nameMapSize: names ? countKeys(names) : 0,
      nameMap: names && countKeys(names) <= 500 ? names : names ? { _truncated: true, size: countKeys(names) } : null,
      resolverNote: 'UI: journal + programme + exerciseDatabase ; nameMap exporté s’il est présent dans le snapshot'
    },
    garmin: slimGarmin(garmin),
    memoryInitial: slimMemory(analyticalMemory),
    limits: [
      'Aucun credential.',
      'Pas de duplication des traces / audits (référencés, non recopiés).',
      'Lecture seule — aucune écriture IndexedDB / mémoire.',
      'Si reproducibility.status=non_reproductible : ne pas inventer les contextes manquants.',
      'Mission 35 : program.schedule est un squelette (ids/noms/sets) — pas un dump UI complet.'
    ]
  };
}
