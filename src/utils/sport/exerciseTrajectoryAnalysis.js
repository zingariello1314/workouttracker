/**
 * Couche analytique commune — trajectoire d’un exercice.
 *
 * Produit des faits calculés + une interprétation structurée AVANT rédaction.
 * Prototype branché sur disc_emergence et disc_exercise_progress.
 *
 * Règle d’or : ne jamais inventer de séries. La décomposition sets×reps
 * n’est « établie » que si exerciseSetLogs est structuré.
 */

import { collectLifetimeRepHistory } from './athleteJourney';
import { collectEnrichedExerciseHistory } from './recapExerciseProgressionAnalysis';
import { resolveExerciseSetsForAnalysis } from './exerciseSessionSetsResolver';
import { movementFamily } from './recapExposureNarratives';
import { isDateInRecapWindow } from './recapMuscleLoadEngine';
import { composeAnalyticalReading } from './recapAnalyticalReading';
import { resolveUserFacingExerciseName, userFacingExerciseLabel } from './recapStrengthPeriodStats';

/** @typedef {'established'|'probable'|'watch'|'indeterminate'} Stance */

function round1(n) {
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 10) / 10;
}

function pctDelta(prev, curr) {
  if (!(prev > 0) || !Number.isFinite(curr)) return null;
  return round1(((curr - prev) / prev) * 100);
}

function median(nums) {
  const a = (nums || []).filter((n) => Number.isFinite(n)).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

function mean(nums) {
  const a = (nums || []).filter((n) => Number.isFinite(n));
  if (!a.length) return null;
  return a.reduce((s, n) => s + n, 0) / a.length;
}

function daysBetween(a, b) {
  if (!a || !b) return null;
  const da = new Date(`${a}T12:00:00`);
  const db = new Date(`${b}T12:00:00`);
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return null;
  return Math.round((db - da) / 86400000);
}

/** Identité affichée normalisée — ne suffit jamais à equater deux exercices. */
function normalizeExerciseLabel(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function previousWindow(window) {
  if (!window?.start || !window?.end) return null;
  const span = daysBetween(window.start, window.end);
  if (span == null || span < 0) return null;
  const end = new Date(`${window.start}T12:00:00`);
  end.setDate(end.getDate() - 1);
  const start = new Date(end);
  start.setDate(start.getDate() - span);
  const ymd = (d) => d.toISOString().slice(0, 10);
  return { start: ymd(start), end: ymd(end) };
}

/**
 * Lit les séries d’une séance — trusted seulement si set logs structurés.
 */
export function readTrustedSessionSets(snapshot, date, exerciseId, expectedTotal) {
  const keys = [`${date}_${exerciseId}`, `${date}_${String(exerciseId)}`];
  const n = parseInt(String(exerciseId), 10);
  if (Number.isFinite(n)) keys.push(`${date}_${n}`);

  for (const key of keys) {
    const structured = snapshot?.exerciseSetLogs?.[key];
    const hasStructured = Array.isArray(structured?.sets) && structured.sets.length > 0;
    if (!hasStructured) continue;
    const resolved = resolveExerciseSetsForAnalysis(snapshot, key, null);
    if (!resolved?.sets?.length) continue;
    const reps = resolved.sets.map((s) => Math.floor(Number(s.reps) || 0)).filter((v) => v > 0);
    if (!reps.length) continue;
    const total = reps.reduce((s, v) => s + v, 0);
    if (expectedTotal != null && Math.abs(total - expectedTotal) > 1) {
      return {
        trusted: false,
        contradiction: true,
        setReps: reps,
        setCount: reps.length,
        total,
        expectedTotal,
        source: 'structured_mismatch'
      };
    }
    return {
      trusted: true,
      contradiction: false,
      setReps: reps,
      setCount: reps.length,
      total,
      perSet: total / reps.length,
      source: 'structured',
      schemeLabel: resolved.schemeLabel || `${reps.length}×${Math.round(total / reps.length)}`
    };
  }
  return { trusted: false, contradiction: false, setReps: null, setCount: null, total: expectedTotal ?? null, source: 'absent' };
}

function sessionFromLifetimeRow(snapshot, row, exerciseId) {
  const sets = readTrustedSessionSets(snapshot, row.date, exerciseId, row.reps);
  return {
    date: row.date,
    totalReps: row.reps,
    setCount: sets.trusted ? sets.setCount : null,
    setReps: sets.trusted ? sets.setReps : null,
    perSet: sets.trusted ? sets.perSet : null,
    setsTrusted: sets.trusted,
    setsSource: sets.source,
    contradiction: sets.contradiction || false,
    schemeLabel: sets.trusted ? sets.schemeLabel : null
  };
}

function buildSessionList(snapshot, exerciseId, window) {
  const lifetime = collectLifetimeRepHistory(snapshot, window?.end || null);
  let rows = [];
  for (const key of [exerciseId, String(exerciseId)]) {
    if (lifetime.has(key)) {
      rows = lifetime.get(key) || [];
      break;
    }
  }
  if (!rows.length) {
    const n = parseInt(String(exerciseId), 10);
    if (Number.isFinite(n) && lifetime.has(n)) rows = lifetime.get(n) || [];
  }
  return (rows || []).map((r) => sessionFromLifetimeRow(snapshot, r, exerciseId));
}

/**
 * Forme + chemin observé.
 * Un rebound (remontée depuis un creux) ne doit JAMAIS masquer un recul net
 * early→late : on sépare `kind` (motif local) et `path` / `primaryStory` (bilan).
 */
function classifyShape(sessionTotals, sessionMeta = []) {
  const vals = (sessionTotals || []).filter((n) => Number.isFinite(n) && n > 0);
  if (vals.length < 2) {
    return {
      kind: 'insufficient',
      path: 'insufficient',
      primaryStory: 'insufficient',
      detail: 'Moins de 2 séances comparables',
      atypical: null,
      withoutAtypical: null
    };
  }
  const med = median(vals);
  let atypicalIndex = null;
  if (vals.length >= 3 && med > 0) {
    vals.forEach((v, i) => {
      if (v >= med * 1.8 || v <= med * 0.4) atypicalIndex = i;
    });
  }
  const without =
    atypicalIndex != null ? vals.filter((_, i) => i !== atypicalIndex) : vals;

  const monotoneDown = (arr) => {
    if (arr.length < 3) return false;
    let drops = 0;
    for (let i = 1; i < arr.length; i += 1) if (arr[i] < arr[i - 1] - 1) drops += 1;
    return drops >= arr.length - 2;
  };
  const monotoneUp = (arr) => {
    if (arr.length < 3) return false;
    let rises = 0;
    for (let i = 1; i < arr.length; i += 1) if (arr[i] > arr[i - 1] + 1) rises += 1;
    return rises >= arr.length - 2;
  };

  // Première moitié vs seconde (jamais early===late parce que firstN===lastN)
  const halfK = Math.max(1, Math.min(3, Math.floor(vals.length / 2)));
  const firstN = vals.slice(0, halfK);
  const lastN = vals.slice(-halfK);
  const early = mean(firstN);
  const late = mean(lastN);
  const delta = pctDelta(early, late);
  const absDelta = early != null && late != null ? round1(late - early) : null;
  const troughVal = Math.min(...vals);
  const troughIdx = vals.indexOf(troughVal);
  const lastVal = vals[vals.length - 1];
  const recoveryFromTroughPct = troughVal > 0 ? pctDelta(troughVal, lastVal) : null;
  const recoveredVsEarly =
    early > 0 && lastVal >= early * 0.92
      ? 'full'
      : early > 0 && lastVal >= early * 0.75
        ? 'partial'
        : early > 0 && lastVal < early * 0.85
          ? 'still_down'
          : 'unclear';

  let kind = 'fluctuation';
  if (monotoneDown(lastN) || monotoneDown(vals)) kind = 'steady_decline';
  else if (monotoneUp(lastN) || monotoneUp(vals)) kind = 'steady_rise';
  else if (Math.abs(delta || 0) < 8 && vals.length >= 3) kind = 'plateau';
  else if (delta != null && delta <= -15) kind = 'decline_phases';
  else if (delta != null && delta >= 15) kind = 'rise_phases';

  let path = kind;
  // Creux puis remontée : motif local, sans écraser le bilan net
  const hasTrough =
    troughIdx >= 1 &&
    troughIdx < vals.length - 1 &&
    troughVal < Math.min(med * 0.7, early * 0.55) &&
    lastVal > troughVal * 1.12;
  if (hasTrough) {
    if (recoveredVsEarly === 'full') {
      path = 'decline_then_full_recovery';
      kind = 'rebound';
    } else if (recoveredVsEarly === 'partial' || recoveredVsEarly === 'still_down') {
      path = 'decline_then_partial_recovery';
      kind = 'rebound';
    } else {
      path = 'trough_then_rise';
      kind = 'rebound';
    }
  } else if (kind === 'steady_decline' || kind === 'decline_phases') {
    path = monotoneDown(vals) ? 'progressive_decline' : 'decline_phases';
  } else if (kind === 'steady_rise' || kind === 'rise_phases') {
    path = monotoneUp(vals) ? 'progressive_rise' : 'rise_phases';
  }

  /** Bilan early→late : ce que le titre/conclusion doivent porter en priorité. */
  let primaryStory = 'unclear';
  if (delta != null && delta <= -15) primaryStory = 'net_decline';
  else if (delta != null && delta >= 15) primaryStory = 'net_rise';
  else if (path === 'decline_then_full_recovery') primaryStory = 'recovered';
  else if (path === 'decline_then_partial_recovery') primaryStory = 'partial_recovery';
  else if (kind === 'plateau') primaryStory = 'plateau';
  else if (kind === 'steady_decline' || kind === 'decline_phases') primaryStory = 'net_decline';
  else if (kind === 'steady_rise' || kind === 'rise_phases') primaryStory = 'net_rise';

  let withoutKind = kind;
  if (without.length >= 3) {
    const wk = Math.max(1, Math.min(3, Math.floor(without.length / 2)));
    const we = mean(without.slice(0, wk));
    const wl = mean(without.slice(-wk));
    const wd = pctDelta(we, wl);
    if (wd != null && Math.abs(wd) < 10 && Math.abs(delta || 0) >= 20) {
      withoutKind = 'outlier_driven';
      if (primaryStory === 'net_decline' || primaryStory === 'net_rise') {
        primaryStory = 'outlier_driven';
      }
    }
  }
  // Pic / creux isolé au milieu alors que début≈fin : l’écart affiché est trompeur
  if (
    atypicalIndex != null &&
    atypicalIndex > 0 &&
    atypicalIndex < vals.length - 1 &&
    Math.abs(delta || 0) < 12
  ) {
    withoutKind = 'outlier_driven';
    primaryStory = 'outlier_driven';
    kind = kind === 'plateau' || kind === 'fluctuation' ? 'fluctuation' : kind;
  }

  const earlyDates = sessionMeta.slice(0, halfK).map((s) => s?.date).filter(Boolean);
  const lateDates = sessionMeta.slice(-halfK).map((s) => s?.date).filter(Boolean);

  /**
   * Références nommées — ne pas les confondre dans le texte :
   * - arcEarlyMean = moyenne des premières séances de l’arc (départ d’interprétation)
   * - arcLateMean = moyenne des dernières séances de l’arc (peut mélanger creux+reprise)
   * - lastPerformance = dernière séance seule (niveau final observé)
   * - trough = minimum de l’arc
   * La reprise « pleine » se juge sur lastPerformance vs arcEarlyMean, pas sur arcLateMean.
   */
  const referenceLevels = {
    arcEarlyMean: round1(early),
    arcLateMean: round1(late),
    lastPerformance: round1(lastVal),
    trough: round1(troughVal),
    recoveryJudgedBy: 'last_session_vs_arc_early',
    recoveredVsEarly
  };

  return {
    kind,
    path,
    primaryStory,
    detail: `early≈${round1(early)} → late≈${round1(late)} (${delta != null ? `${delta}%` : '—'}) · last=${round1(lastVal)} · path=${path}`,
    earlyMean: round1(early),
    lateMean: round1(late),
    lastPerformance: round1(lastVal),
    deltaPct: delta,
    absDelta,
    sessionCount: vals.length,
    trough: {
      value: round1(troughVal),
      index: troughIdx,
      date: sessionMeta[troughIdx]?.date || null,
      recoveryFromTroughPct
    },
    recoveredVsEarly,
    referenceLevels,
    earlyDates,
    lateDates,
    atypicalIndex,
    withoutAtypical: {
      kind: withoutKind,
      mean: round1(mean(without)),
      n: without.length
    }
  };
}

/**
 * @param {Array} sessions
 * @param {{ troughDate?: string|null }} [opts]
 */
function classifySetMechanism(sessions, opts = {}) {
  const all = sessions || [];
  const trusted = all.filter((s) => s.setsTrusted && s.setCount >= 1 && s.perSet != null);
  const totalsOnly = all.filter((s) => !s.setsTrusted);
  const granularity =
    trusted.length === 0 ? 'totals_only' : totalsOnly.length === 0 ? 'full' : 'partial';
  const coverage = {
    sessionCount: all.length,
    knownSetSessions: trusted.length,
    totalsOnlySessions: totalsOnly.length,
    totalsOnlyDates: totalsOnly.map((s) => s.date),
    granularity
  };

  if (trusted.length < 2) {
    return {
      available: false,
      reason:
        trusted.length === 0
          ? 'Détail des séries absent (pas de exerciseSetLogs structurés)'
          : 'Une seule séance avec séries lisibles — pas de comparaison de format',
      ...coverage
    };
  }

  const sorted = [...trusted].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  let early;
  let late;
  const troughDate = opts.troughDate || null;

  // Si un creux est connu : comparer uniquement des séances AVANT vs APRÈS (pas de chevauchement)
  if (troughDate) {
    const beforeTrough = sorted.filter((s) => s.date < troughDate);
    const afterTrough = sorted.filter((s) => s.date > troughDate);
    if (beforeTrough.length >= 1 && afterTrough.length >= 1) {
      early = beforeTrough.slice(-Math.min(3, beforeTrough.length));
      late = afterTrough.slice(0, Math.min(3, afterTrough.length));
    }
  }

  if (!early || !late) {
    // Split chronologique sans chevauchement (évite qu’une même séance soit dans before et after)
    const mid = Math.floor(sorted.length / 2);
    early = sorted.slice(0, Math.max(1, mid));
    late = sorted.slice(Math.max(1, mid));
    if (!late.length && early.length >= 2) {
      late = [early[early.length - 1]];
      early = early.slice(0, -1);
    }
  }

  // Sécurité anti-chevauchement
  const earlyDateSet = new Set(early.map((s) => s.date));
  late = late.filter((s) => !earlyDateSet.has(s.date));
  if (!late.length) {
    return {
      available: false,
      reason: 'Pas assez de séances à séries connues distinctes pour comparer un avant/après',
      ...coverage
    };
  }

  const before = {
    setCount: round1(median(early.map((s) => s.setCount))),
    perSet: round1(median(early.map((s) => s.perSet))),
    volume: round1(median(early.map((s) => s.totalReps))),
    n: early.length,
    sample: early.map((s) => ({ date: s.date, scheme: s.schemeLabel, total: s.totalReps }))
  };
  const after = {
    setCount: round1(median(late.map((s) => s.setCount))),
    perSet: round1(median(late.map((s) => s.perSet))),
    volume: round1(median(late.map((s) => s.totalReps))),
    n: late.length,
    sample: late.map((s) => ({ date: s.date, scheme: s.schemeLabel, total: s.totalReps }))
  };

  const countUp = after.setCount - before.setCount >= 0.75;
  const countDown = before.setCount - after.setCount >= 0.75;
  const repsUp = after.perSet - before.perSet > 1;
  const repsDown = before.perSet - after.perSet > 1;

  let kind = 'stable_format';
  let detail = 'Sur les séances où le détail de séries est connu, le format reste du même ordre.';
  if (countUp && !repsDown && !repsUp) {
    kind = 'more_sets_same_reps';
    detail = `Le nombre de séries augmente (${before.setCount} → ${after.setCount}), les répétitions par série restent du même ordre (~${before.perSet}).`;
  } else if (countDown && !repsDown && !repsUp) {
    kind = 'fewer_sets_same_reps';
    detail = `Le nombre de séries baisse (${before.setCount} → ${after.setCount}), les répétitions par série restent du même ordre (~${before.perSet}).`;
  } else if (!countUp && !countDown && repsDown) {
    kind = 'same_sets_fewer_reps';
    detail = `Le nombre de séries reste ~${after.setCount} ; ce qui baisse, ce sont les répétitions par série (~${before.perSet} → ~${after.perSet}).`;
  } else if (!countUp && !countDown && repsUp) {
    kind = 'same_sets_more_reps';
    detail = `Le nombre de séries reste ~${after.setCount} ; les répétitions par série augmentent (~${before.perSet} → ~${after.perSet}).`;
  } else if (countUp && repsDown) {
    kind = 'more_sets_fewer_reps';
    detail = `Plus de séries mais moins de répétitions par série.`;
  } else if (countDown && repsUp) {
    kind = 'fewer_sets_more_reps';
    detail = `Moins de séries mais plus de répétitions par série.`;
  }

  // Pendant un creux sans séries connues : on ne peut pas affirmer la stabilité du format sur toute la trajectoire
  const troughTotalsOnly =
    troughDate &&
    totalsOnly.filter((s) => s.date >= troughDate && !late.some((l) => l.date === s.date));
  const missingDuringTrough = Array.isArray(troughTotalsOnly) ? troughTotalsOnly.length : 0;
  if (granularity === 'partial' && missingDuringTrough > 0) {
    detail = `${detail} ${missingDuringTrough} séance${missingDuringTrough > 1 ? 's' : ''} du creux n’ont qu’un total de répétitions : la structure de séries pendant la baisse n’est pas démontrée.`;
  }

  const volPct = pctDelta(before.volume, after.volume);
  const maintained =
    late.length >= 2 &&
    late.every((s) => Math.abs(s.totalReps - after.volume) / Math.max(after.volume, 1) <= 0.2);

  let stance =
    maintained && (countUp || repsUp || countDown || repsDown) ? 'established' : 'probable';
  if (granularity === 'partial' && missingDuringTrough > 0) stance = 'watch';

  return {
    available: true,
    kind,
    detail,
    before,
    after,
    volumeDeltaPct: volPct,
    maintained,
    stance,
    ...coverage,
    missingSetDetailDuringTrough: missingDuringTrough
  };
}

function classifyInstallation(allSessions, windowSessions, window) {
  const beforeWindow = (allSessions || []).filter((s) => window?.start && s.date < window.start);
  const inWindow = windowSessions || [];
  if (!inWindow.length) {
    return { kind: 'insufficient', detail: 'Aucune séance dans la fenêtre', stance: 'indeterminate' };
  }
  const firstEver = beforeWindow.length === 0;
  const span =
    inWindow.length >= 2
      ? daysBetween(inWindow[0].date, inWindow[inWindow.length - 1].date)
      : 0;

  if (!firstEver && beforeWindow.length) {
    const gap = daysBetween(beforeWindow[beforeWindow.length - 1].date, inWindow[0].date);
    if (gap != null && gap >= 21) {
      return {
        kind: 'returning',
        detail: `Réapparition après ${gap} jours`,
        gapDays: gap,
        sessionsInWindow: inWindow.length,
        firstEver: false,
        stance: 'established'
      };
    }
    return {
      kind: 'already_known',
      detail: 'Exercice déjà présent dans l’historique avant la fenêtre',
      sessionsInWindow: inWindow.length,
      firstEver: false,
      stance: 'established'
    };
  }

  if (inWindow.length === 1) {
    return {
      kind: 'first_session',
      detail: firstEver
        ? 'Première séance connue dans l’historique disponible'
        : 'Une seule séance dans la fenêtre',
      sessionsInWindow: 1,
      firstEver,
      stance: 'established'
    };
  }

  // Installation durable : ≥3 séances sur ≥14 jours
  if (inWindow.length >= 3 && span != null && span >= 14) {
    const vols = inWindow.map((s) => s.totalReps);
    const risingOrFlat = vols[vols.length - 1] >= vols[0] * 0.9;
    return {
      kind: risingOrFlat ? 'installed' : 'installing_irregular',
      detail: `${inWindow.length} séances sur ${span} jours`,
      sessionsInWindow: inWindow.length,
      spanDays: span,
      firstEver,
      stance: risingOrFlat ? 'probable' : 'watch',
      stage: risingOrFlat ? 'durable_integration' : 'installing'
    };
  }

  // Installation progressive : ≥3 séances mais fenêtre encore courte
  if (inWindow.length >= 3 && span != null && span >= 7) {
    return {
      kind: 'installing',
      detail: `${inWindow.length} séances sur ${span} jours — installation progressive, pas encore une habitude durable`,
      sessionsInWindow: inWindow.length,
      spanDays: span,
      firstEver,
      stance: 'probable',
      stage: 'installing'
    };
  }

  // Deux séances espacées = répétition du format / de la présence, PAS une installation
  if (inWindow.length >= 2 && span != null && span >= 7) {
    return {
      kind: 'repeated',
      detail: `${inWindow.length} séances sur ${span} jours — répétition du format, trop tôt pour parler d’installation durable`,
      sessionsInWindow: inWindow.length,
      spanDays: span,
      firstEver,
      stance: 'probable',
      stage: 'repetition'
    };
  }

  return {
    kind: 'first_cluster',
    detail: `${inWindow.length} séances rapprochées`,
    sessionsInWindow: inWindow.length,
    spanDays: span,
    firstEver,
    stance: 'watch',
    stage: 'appearance'
  };
}

/** Familles témoins compatibles (pompes ↔ dips ↔ développé). */
function relatedFamilies(fam) {
  if (fam === 'pushup' || fam === 'push') return new Set(['pushup', 'push']);
  if (fam === 'pull') return new Set(['pull']);
  if (fam === 'legs') return new Set(['legs']);
  return fam && fam !== 'other' ? new Set([fam]) : new Set();
}

function analyzePeers(
  snapshot,
  exerciseId,
  name,
  window,
  getExerciseNameById,
  allSessionsForSubject,
  shapeHint = null
) {
  const fam = movementFamily(exerciseId, name, getExerciseNameById);
  const famSet = relatedFamilies(fam);
  if (!famSet.size) {
    return { available: false, reason: 'Famille de mouvement non classée', verdict: 'insufficient', items: [] };
  }

  const subjectLabel = normalizeExerciseLabel(name);
  const lifetime = collectLifetimeRepHistory(snapshot, window?.end || null);
  const items = [];
  const skippedSameLabel = [];
  for (const [exId, rows] of lifetime.entries()) {
    if (String(exId) === String(exerciseId)) continue;
    const peerName = resolveUserFacingExerciseName(exId, getExerciseNameById);
    if (!peerName || peerName === 'un mouvement') continue;
    // Identité stable : un même libellé + id différent = variante ambiguë, pas un témoin
    if (subjectLabel && normalizeExerciseLabel(peerName) === subjectLabel) {
      skippedSameLabel.push({ exerciseId: String(exId), name: peerName, reason: 'same_display_name_different_id' });
      continue;
    }
    const peerFam = movementFamily(exId, peerName, getExerciseNameById);
    if (!famSet.has(peerFam)) continue;

    const inWin = (rows || []).filter((r) => isDateInRecapWindow(r.date, window));
    if (inWin.length < 3) continue;
    const mid = Math.floor(inWin.length / 2);
    const early = mean(inWin.slice(0, Math.max(1, mid)).map((r) => r.reps));
    const late = mean(inWin.slice(Math.max(1, mid)).map((r) => r.reps));
    const delta = pctDelta(early, late);
    const stable = delta != null && Math.abs(delta) <= 15;
    items.push({
      exerciseId: String(exId),
      name: peerName,
      sessions: inWin.length,
      earlyMean: round1(early),
      lateMean: round1(late),
      deltaPct: delta,
      stable
    });
  }

  items.sort((a, b) => b.sessions - a.sessions);
  // Dédupe entre témoins : un même libellé affiché ne doit apparaître qu’une fois (garde le + de séances)
  const seenPeerLabels = new Set();
  const deduped = [];
  const skippedPeerDupLabels = [];
  for (const it of items) {
    const lab = normalizeExerciseLabel(it.name);
    if (lab && seenPeerLabels.has(lab)) {
      skippedPeerDupLabels.push({
        exerciseId: it.exerciseId,
        name: it.name,
        reason: 'duplicate_peer_display_name'
      });
      continue;
    }
    if (lab) seenPeerLabels.add(lab);
    deduped.push(it);
  }
  const top = deduped.slice(0, 4);
  if (!top.length) {
    return {
      available: false,
      reason: skippedSameLabel.length || skippedPeerDupLabels.length
        ? 'Pas assez de témoins comparables après exclusion des homonymes (même nom, autre id)'
        : 'Pas assez de témoins comparables (≥3 séances)',
      verdict: 'insufficient',
      items: [],
      family: fam,
      skippedSameLabel: [...skippedSameLabel, ...skippedPeerDupLabels]
    };
  }

  const subjectInWin = (allSessionsForSubject || []).filter((s) => isDateInRecapWindow(s.date, window));
  const subjEarly = mean(subjectInWin.slice(0, Math.max(1, Math.floor(subjectInWin.length / 2))).map((s) => s.totalReps));
  const subjLate = mean(subjectInWin.slice(Math.max(1, Math.floor(subjectInWin.length / 2))).map((s) => s.totalReps));
  const subjDelta = pctDelta(subjEarly, subjLate);
  const story = shapeHint?.primaryStory || null;
  const isReboundStory = story === 'recovered' || story === 'partial_recovery' || shapeHint?.kind === 'rebound';

  const stablePeers = top.filter((p) => p.stable);
  const decliningPeers = top.filter((p) => (p.deltaPct || 0) <= -15);

  const peerPhrase = (list) =>
    list
      .slice(0, 3)
      .map((p) => {
        const level = p.lateMean != null ? `autour de ${Math.round(p.lateMean)} répétitions par séance` : 'stables';
        return `${p.name} (${level})`;
      })
      .join(' et ');

  let verdict = 'insufficient';
  let detail = '';
  if (subjDelta != null && subjDelta <= -15 && stablePeers.length >= 1 && decliningPeers.length === 0) {
    verdict = 'localized';
    detail = `Le recul est concentré sur cet exercice : ${peerPhrase(stablePeers)} restent du même ordre. Ce n’est donc pas une baisse générale de la famille ${fam === 'pushup' || fam === 'push' ? 'poussée' : fam}.`;
  } else if (subjDelta != null && subjDelta <= -15 && decliningPeers.length >= 2) {
    verdict = 'shared';
    detail = `Plusieurs mouvements comparables baissent aussi (${peerPhrase(decliningPeers)}) : le signal dépasse cet exercice seul, sans que les données prouvent une cause unique.`;
  } else if (isReboundStory && stablePeers.length >= 1) {
    // Ne pas appeler « hausse localisée » une reprise après creux
    verdict = 'localized_recovery';
    detail = `La trajectoire (creux puis reprise) porte surtout sur cet exercice, tandis que ${peerPhrase(stablePeers)} ${stablePeers.length > 1 ? 'restent' : 'reste'} stable${stablePeers.length > 1 ? 's' : ''}.`;
  } else if (subjDelta != null && subjDelta >= 15 && stablePeers.length >= 1) {
    verdict = 'localized_rise';
    detail = `La hausse porte surtout sur cet exercice, tandis que ${peerPhrase(stablePeers)} ${stablePeers.length > 1 ? 'restent' : 'reste'} stable${stablePeers.length > 1 ? 's' : ''}.`;
  } else {
    verdict = 'mixed';
    detail = 'Les témoins disponibles ne permettent pas d’isoler clairement si le signal est local ou partagé.';
  }

  return {
    available: true,
    family: fam,
    relatedFamilies: [...famSet],
    skippedSameLabel: [...skippedSameLabel, ...skippedPeerDupLabels],
    verdict,
    detail,
    subjectDeltaPct: subjDelta,
    items: top,
    stance: verdict === 'localized' || verdict === 'shared' ? 'probable' : 'watch'
  };
}

function buildFindings({ identity, volume, setMechanism, shape, peers, installation, mode, temporalScope = null }) {
  const limits = [];
  const positions = [];

  if (!setMechanism.available) {
    limits.push({
      id: 'no_set_detail',
      text: setMechanism.reason,
      affects: 'Impossible de décomposer séries vs reps/série'
    });
  } else if (setMechanism.granularity === 'partial') {
    limits.push({
      id: 'partial_set_detail',
      text: `${setMechanism.totalsOnlySessions || 0} séance(s) n’ont qu’un total — la structure de séries n’est pas connue partout`,
      affects: 'Ne pas généraliser l’évolution des reps/série à toute la trajectoire'
    });
  }
  if ((peers.skippedSameLabel || []).length) {
    limits.push({
      id: 'peer_same_label_excluded',
      text: `Témoin(s) exclus pour homonymie (même nom affiché, autre id) : ${(peers.skippedSameLabel || [])
        .map((p) => p.name || 'variante')
        .join(', ')}`,
      affects: 'Comparaison fondée sur des identifiants stables uniquement'
    });
  }
  if (shape.withoutAtypical?.kind === 'outlier_driven' || shape.primaryStory === 'outlier_driven') {
    limits.push({
      id: 'outlier',
      text: 'Une séance atypique influence fortement la moyenne',
      affects: 'Ne pas conclure à une tendance durable sans la retirer'
    });
  }
  if (peers.verdict === 'insufficient') {
    limits.push({
      id: 'no_peers',
      text: peers.reason || 'Témoins insuffisants',
      affects: 'Portée (local vs global) indéterminée'
    });
  }

  let main = null;
  let mechanism = null;
  let peerScope = null;
  let implication = null;
  let titleHint = null;
  let pathNote = null;

  const arcN = shape.sessionCount || temporalScope?.arcSessionCount || volume.windowSessionCount || 0;
  const scopeLead = (() => {
    if (!temporalScope?.interpretingWithHistory) return '';
    const before = temporalScope.contextSessionCountBeforeWindow || 0;
    const inWin = temporalScope.windowSessionCount || 0;
    if (before > 0 && inWin > 0) {
      return `Sur les ${arcN} dernières séances (dont ${before} avant la fenêtre sélectionnée, ${inWin} dedans), `;
    }
    if (before > 0) {
      return `En lisant les ${arcN} dernières séances jusqu’à la fin de la fenêtre (contexte hors fenêtre inclus), `;
    }
    return '';
  })();

  if (mode === 'emergence') {
    if (installation.kind === 'installed' || installation.kind === 'installing') {
      titleHint =
        installation.kind === 'installed'
          ? `${identity.name} s'installe dans ton entraînement`
          : `${identity.name} commence à s'installer`;
      main = {
        stance: installation.stance,
        text: `${identity.name} apparaît sur ${installation.sessionsInWindow} séances réparties sur ${installation.spanDays || '—'} jours${
          installation.firstEver ? ' — première présence connue dans l’historique disponible' : ''
        }.`
      };
    } else if (installation.kind === 'repeated') {
      titleHint = `${identity.name} : format repris, pas encore installé`;
      main = {
        stance: 'probable',
        text: `${identity.name} apparaît sur ${installation.sessionsInWindow} séances réparties sur ${installation.spanDays || '—'} jours${
          installation.firstEver ? ' — première présence connue dans l’historique disponible' : ''
        }. C’est une répétition du format, pas encore une installation durable dans le programme.`
      };
    } else if (installation.kind === 'first_session') {
      titleHint = `${identity.name} entre dans ton historique`;
      main = {
        stance: 'established',
        text: installation.firstEver
          ? `Tu enregistres ${identity.name} pour la première fois dans l’historique disponible : ${volume.windowTotal} répétitions sur cette séance.`
          : `Une seule séance de ${identity.name} dans la période (${volume.windowTotal} répétitions).`
      };
      implication = {
        stance: 'probable',
        text: 'Reproduire ce volume sur la prochaine séance confirme le départ ; augmenter tout de suite le total mélangerait l’apprentissage du geste et une dose nouvelle.'
      };
    } else if (installation.kind === 'returning') {
      titleHint = `${identity.name} revient après une interruption`;
      main = { stance: 'established', text: `${identity.name} : ${installation.detail}.` };
    } else if (installation.kind === 'already_known') {
      titleHint = `${identity.name} repasse dans la période`;
      main = {
        stance: 'established',
        text: `${identity.name} était déjà pratiqué avant cette fenêtre : ce n’est pas une introduction nouvelle, c’est une présence dans la période sélectionnée.`
      };
    } else {
      titleHint = `${identity.name} dans la période`;
      main = { stance: 'indeterminate', text: installation.detail };
    }

    if (setMechanism.available && (setMechanism.kind === 'more_sets_same_reps' || setMechanism.kind === 'same_sets_more_reps')) {
      mechanism = {
        stance: setMechanism.stance,
        text: setMechanism.detail,
        maintained: setMechanism.maintained
      };
      // Ne pas promouvoir en « s'installe » avant le stade installing/installed (≥3 séances)
      if (
        setMechanism.maintained &&
        (installation.kind === 'installed' || installation.kind === 'installing') &&
        installation.sessionsInWindow >= 3
      ) {
        titleHint = `${identity.name} s'installe dans ton entraînement`;
        main = {
          stance: 'probable',
          text: `${identity.name} : tu es passé d’environ ${setMechanism.before.setCount} × ${setMechanism.before.perSet} à environ ${setMechanism.after.setCount} × ${setMechanism.after.perSet}, soit une hausse de ${setMechanism.volumeDeltaPct ?? '—'} % du volume par séance, reproduite sur les séances suivantes.`
        };
      } else if (setMechanism.maintained && installation.kind === 'repeated') {
        mechanism = {
          stance: 'probable',
          text: `Le format connu est repris (≈${setMechanism.after.setCount} × ${setMechanism.after.perSet}) : répétition, pas encore une installation durable.`,
          maintained: true
        };
      }
    }
    if (volume.prevComparable != null && volume.windowTotal > 0 && volume.prevComparable === 0 && installation.firstEver) {
      positions.push({
        claim: 'intro_vs_prev_window',
        stance: 'established',
        text: `Au total, ${volume.windowTotal} répétitions sur la période, contre aucune sur la période précédente comparable.`
      });
    }
  } else {
    // ——— progress : bilan primaryStory d’abord, path ensuite ———
    const story = shape.primaryStory || 'unclear';
    const almostHalf = shape.deltaPct != null && shape.deltaPct <= -40;
    const troughBit =
      shape.trough?.value != null && (shape.path || '').includes('partial_recovery')
        ? ` Après un creux vers ${shape.trough.value} répétitions${
            shape.trough.date ? ` (${shape.trough.date})` : ''
          }, le niveau remonte vers ${shape.lateMean}, mais reste en retrait du départ.`
        : shape.path === 'decline_then_full_recovery'
          ? ` Un creux vers ${shape.trough?.value ?? '—'} a été suivi d’un retour près du niveau de départ.`
          : '';

    if (story === 'outlier_driven' || shape.withoutAtypical?.kind === 'outlier_driven') {
      titleHint = `${identity.name} : une séance tire la moyenne`;
      main = {
        stance: 'watch',
        text: `${scopeLead}l’écart sur ${identity.name} (≈${shape.earlyMean} → ≈${shape.lateMean} répétitions par séance) est surtout tiré par une séance hors norme ; sans elle, la tendance nette disparaît.`
      };
    } else if (story === 'net_decline' || story === 'partial_recovery') {
      titleHint = almostHalf
        ? `${identity.name} : presque deux fois moins de répétitions par séance`
        : story === 'partial_recovery'
          ? `${identity.name} : recul net malgré une reprise partielle`
          : `${identity.name} : le volume par séance recule`;
      main = {
        stance: shape.path === 'progressive_decline' || shape.kind === 'steady_decline' ? 'established' : 'probable',
        text: `${scopeLead}tes performances en ${identity.name.toLowerCase()} sont passées d’environ ${shape.earlyMean} à ${shape.lateMean} répétitions par séance${
          shape.deltaPct != null ? `, soit ${shape.deltaPct} %` : ''
        }${shape.absDelta != null ? ` (${shape.absDelta > 0 ? '+' : ''}${shape.absDelta} reps)` : ''}${
          arcN >= 3 ? ` sur ${arcN} séances` : ''
        }.${troughBit}`
      };
      if (shape.path === 'decline_then_partial_recovery') {
        pathNote = {
          stance: 'probable',
          text: `Le chemin n’est pas une baisse monotone seule : il y a eu un creux puis une reprise partielle ; le niveau final reste toutefois sous le départ.`
        };
      }
    } else if (story === 'recovered') {
      const lastPerf = shape.lastPerformance ?? shape.referenceLevels?.lastPerformance;
      const troughVal = shape.trough?.value ?? '—';
      const troughDate = shape.trough?.date ? ` (${shape.trough.date})` : '';
      titleHint = `${identity.name} : recul puis retour au niveau de départ`;
      main = {
        stance: 'probable',
        text: `${scopeLead}${identity.name} est passé par un creux (≈${troughVal}${troughDate}) puis la dernière séance est revenue à ≈${lastPerf} répétitions, proche du départ de l’arc (≈${shape.earlyMean}). La moyenne des dernières séances de l’arc (≈${shape.lateMean}) mélange encore creux et reprise : ce n’est pas le niveau final.`
      };
    } else if (story === 'net_rise') {
      titleHint = `${identity.name} : le volume par séance progresse`;
      main = {
        stance: 'probable',
        text: `${scopeLead}${identity.name} : d’environ ${shape.earlyMean} à ${shape.lateMean} répétitions par séance (${shape.deltaPct} %)${
          arcN >= 3 ? ` sur ${arcN} séances` : ''
        }.`
      };
    } else if (story === 'plateau') {
      titleHint = `${identity.name} : niveau récemment stable`;
      main = {
        stance: 'probable',
        text: `${scopeLead}le volume par séance de ${identity.name} reste autour de ≈${shape.lateMean} répétitions.`
      };
    } else {
      titleHint = `${identity.name} : évolution irrégulière`;
      main = {
        stance: 'indeterminate',
        text: `${scopeLead}les séances de ${identity.name} ne dessinent pas une tendance nette (${shape.detail}).`
      };
    }

    if (setMechanism.available) {
      mechanism = { stance: setMechanism.stance, text: setMechanism.detail, kind: setMechanism.kind };
    }

    if (
      peers.available &&
      (peers.verdict === 'localized' ||
        peers.verdict === 'shared' ||
        peers.verdict === 'localized_rise' ||
        peers.verdict === 'localized_recovery')
    ) {
      peerScope = { stance: peers.stance, text: peers.detail, verdict: peers.verdict };
    }

    // Implication : règles explicites, cible = niveau récent observé (pas de milieu inventé)
    const netDown = story === 'net_decline' || story === 'partial_recovery';
    const netUp = story === 'net_rise';
    if ((main?.stance === 'established' || main?.stance === 'probable') && shape.lateMean != null) {
      if (netDown && shape.deltaPct != null && shape.deltaPct <= -20 && peers.verdict === 'localized') {
        const recent = Math.max(1, Math.round(shape.lateMean));
        implication = {
          stance: 'probable',
          ruleId: 'stabilize_at_recent_level_when_localized_decline',
          text: `Plutôt que d’augmenter la difficulté, conserve les mêmes conditions d’exécution et cherche d’abord à stabiliser le volume récent observé (autour de ${recent} répétitions par séance) avant de remonter. Ne confonds pas une hausse éventuelle d’activité globale avec une progression sur cet exercice.`
        };
      } else if (netDown && shape.deltaPct != null && shape.deltaPct <= -20 && peers.verdict === 'shared') {
        implication = {
          stance: 'watch',
          ruleId: 'shared_decline_no_isolate_fix',
          text: `Plusieurs mouvements comparables reculent aussi : traiter ce signal comme une baisse de famille, pas comme un problème isolé à cet exercice.`
        };
      } else if (netUp && shape.deltaPct != null && shape.deltaPct >= 15) {
        const recent = Math.max(1, Math.round(shape.lateMean));
        implication = {
          stance: 'watch',
          ruleId: 'hold_recent_raised_volume',
          text: `Consolide d’abord le volume récent observé (autour de ${recent} répétitions par séance) avant d’ajouter une dose nouvelle.`
        };
      } else if (story === 'recovered') {
        implication = {
          stance: 'watch',
          ruleId: 'hold_after_full_recovery',
          text: `Le retour près du niveau de départ est confirmé sur les séances récentes : le maintenir sur les prochaines séances avant de changer la dose.`
        };
      }
    }
  }

  if (main) positions.push({ claim: 'main', ...main });
  if (pathNote) positions.push({ claim: 'path', ...pathNote });
  if (mechanism) positions.push({ claim: 'mechanism', ...mechanism });
  if (peerScope) positions.push({ claim: 'peers', ...peerScope });
  if (implication) positions.push({ claim: 'implication', ...implication });

  return {
    titleHint,
    main,
    pathNote,
    mechanism,
    peerScope,
    implication,
    limits,
    positions,
    primaryStory: shape.primaryStory || null,
    path: shape.path || null
  };
}

/**
 * @param {object} opts
 * @param {object} opts.snapshot
 * @param {string|number} opts.exerciseId
 * @param {string} opts.exerciseName
 * @param {{start?:string,end?:string}} opts.window
 * @param {function} [opts.getExerciseNameById]
 * @param {'emergence'|'progress'} [opts.mode]
 */
export function buildExerciseTrajectory({
  snapshot,
  exerciseId,
  exerciseName,
  window,
  getExerciseNameById = null,
  mode = 'progress'
} = {}) {
  const id = String(exerciseId || '');
  const name = userFacingExerciseLabel(
    exerciseName || resolveUserFacingExerciseName(id, getExerciseNameById),
    id
  );
  const exclusions = [];
  const diagnostics = { missing: [], contradictions: [] };

  if (!snapshot || !id || !window?.end) {
    return {
      ok: false,
      reason: 'snapshot, exerciseId ou window.end manquant',
      identity: { id, name },
      exclusions,
      diagnostics
    };
  }

  const allSessions = buildSessionList(snapshot, id, window);
  const windowSessions = allSessions.filter((s) => isDateInRecapWindow(s.date, window));
  const prevWin = previousWindow(window);
  const prevSessions = prevWin
    ? allSessions.filter((s) => isDateInRecapWindow(s.date, prevWin))
    : [];

  // Enrichissement optionnel (noms / schéma) sans inventer de séries
  try {
    const enriched = collectEnrichedExerciseHistory(snapshot, id, { end: window.end }, getExerciseNameById);
    const byDate = new Map(enriched.map((e) => [e.dateYmd, e]));
    windowSessions.forEach((s) => {
      const e = byDate.get(s.date);
      if (e && !s.setsTrusted && e.source === 'structured' && e.sets?.length > 1) {
        // déjà couvert par readTrustedSessionSets
      }
    });
  } catch {
    /* ignore */
  }

  if (!windowSessions.length && !allSessions.length) {
    diagnostics.missing.push('Aucune séance cochée pour cet exercice');
  }

  windowSessions.forEach((s) => {
    if (s.contradiction) {
      diagnostics.contradictions.push({
        date: s.date,
        text: 'Total agrégé ≠ somme des séries structurées'
      });
    }
  });

  const windowTotals = windowSessions.map((s) => s.totalReps);
  const windowSpan = window?.start ? daysBetween(window.start, window.end) : null;
  const shortWindow = windowSpan != null && windowSpan <= 10;

  // Arc d’interprétation : dernières séances ≤ fin de fenêtre (contexte hors fenêtre si besoin)
  const cappedLifetime = allSessions.filter((s) => !window?.end || s.date <= window.end);
  const arcSessions =
    mode === 'progress'
      ? cappedLifetime.slice(-Math.max(8, shortWindow ? 8 : 5))
      : windowSessions.length >= 2
        ? windowSessions
        : cappedLifetime.slice(-8);
  const contextBefore = arcSessions.filter((s) => window?.start && s.date < window.start);
  // Vrai dès que l’arc consomme des séances antérieures à la fenêtre sélectionnée
  const interpretingWithHistory = mode === 'progress' && contextBefore.length > 0;

  const volume = {
    windowSessionCount: windowSessions.length,
    lifetimeSessionCount: allSessions.length,
    windowTotal: windowTotals.reduce((s, n) => s + n, 0),
    prevComparable: prevSessions.reduce((s, n) => s + n.totalReps, 0),
    prevSessionCount: prevSessions.length,
    /** Moyenne des séances DANS la fenêtre sélectionnée uniquement */
    meanPerSession: round1(mean(windowTotals)),
    medianPerSession: round1(median(windowTotals)),
    firstSessionTotal: windowSessions[0]?.totalReps ?? null,
    lastSessionTotal: windowSessions[windowSessions.length - 1]?.totalReps ?? null,
    frequencyPerWeek:
      windowSessions.length >= 2 && window?.start
        ? round1(
            (windowSessions.length / Math.max(1, daysBetween(window.start, window.end) + 1)) * 7
          )
        : null
  };

  const shapeSource = mode === 'progress' && arcSessions.length >= 2 ? arcSessions : windowSessions;
  const shape = classifyShape(
    shapeSource.map((s) => s.totalReps),
    shapeSource
  );

  const mechSource =
    mode === 'progress' && arcSessions.length >= 2
      ? arcSessions
      : windowSessions.length >= 2
        ? windowSessions
        : allSessions;
  const setMechanism = classifySetMechanism(mechSource, {
    troughDate: shape?.trough?.date || null
  });

  const temporalScope = {
    windowStart: window.start || null,
    windowEnd: window.end || null,
    windowSpanDays: windowSpan,
    windowSessionCount: windowSessions.length,
    windowDates: windowSessions.map((s) => s.date),
    contextSessionCountBeforeWindow: contextBefore.length,
    contextDatesBeforeWindow: contextBefore.map((s) => s.date),
    arcSessionCount: arcSessions.length,
    arcStartDate: arcSessions[0]?.date || null,
    arcEndDate: arcSessions[arcSessions.length - 1]?.date || null,
    interpretingWithHistory,
    /** Séances dans la fenêtre vs utilisées seulement comme contexte */
    distinction:
      interpretingWithHistory
        ? 'events_in_window_plus_pre_window_context'
        : 'window_or_full_arc_aligned'
  };

  const installation = classifyInstallation(allSessions, windowSessions, window);
  const peers = analyzePeers(
    snapshot,
    id,
    name,
    window,
    getExerciseNameById,
    allSessions,
    shape
  );

  const identity = {
    id,
    name,
    family: peers.family || movementFamily(id, name, getExerciseNameById),
    status: installation.kind,
    firstEver: Boolean(installation.firstEver)
  };

  if (!setMechanism.available) exclusions.push({ id: 'sets', reason: setMechanism.reason });
  if (!peers.available) exclusions.push({ id: 'peers', reason: peers.reason });

  const findings = buildFindings({
    identity,
    volume,
    setMechanism,
    shape,
    peers,
    installation,
    mode,
    temporalScope
  });

  return {
    ok: true,
    mode,
    identity,
    windows: {
      selected: window,
      previousComparable: prevWin,
      lifetimeEnd: window.end
    },
    temporalScope,
    sessions: {
      inWindow: windowSessions,
      previous: prevSessions,
      lifetime: allSessions,
      interpretationArc: arcSessions,
      // cap pour metrics/console
      trace: arcSessions.slice(-40)
    },
    volume,
    setMechanism,
    shape,
    peers,
    installation,
    findings,
    exclusions,
    diagnostics
  };
}

/**
 * Rédige titre/body/evidence à partir d’une trajectoire structurée.
 * Aucun recalcul statistique ici.
 */
export function renderExerciseTrajectoryCopy(trajectory, { legacyBits = {} } = {}) {
  if (!trajectory?.ok) {
    return {
      title: legacyBits.title || null,
      body: legacyBits.body || null,
      evidence: legacyBits.evidence || null,
      usedTrajectory: false
    };
  }

  const f = trajectory.findings || {};
  const name = trajectory.identity?.name || 'Cet exercice';
  const title = f.titleHint || legacyBits.title || name;
  const mainText = f.main?.text || '';
  const mechText = f.mechanism?.text || '';
  const alreadyHasScheme = /\d+\s*×\s*\d+/.test(mainText) || /\d+\s*×\s*\d+/.test(mechText);

  let mechanism = null;
  if (mechText && !alreadyHasScheme) {
    mechanism = mechText;
  } else if (
    !alreadyHasScheme &&
    !mechText &&
    trajectory.setMechanism?.available &&
    trajectory.setMechanism.before &&
    trajectory.setMechanism.after
  ) {
    const b = trajectory.setMechanism.before;
    const a = trajectory.setMechanism.after;
    if (b.setCount != null && a.setCount != null && b.perSet != null && a.perSet != null) {
      mechanism = `Le volume par séance passe d’environ ${b.setCount} × ${b.perSet} à environ ${a.setCount} × ${a.perSet}${
        trajectory.setMechanism.volumeDeltaPct != null
          ? ` (${trajectory.setMechanism.volumeDeltaPct} %)`
          : ''
      }${trajectory.setMechanism.maintained ? ', et ce format se maintient sur les séances suivantes' : ''}`;
    }
  } else if (mechText && alreadyHasScheme && !mainText.includes(mechText.slice(0, 24))) {
    if (!/\d+\s*×\s*\d+/.test(mechText)) mechanism = mechText;
  }

  const scopeParts = [];
  if (f.pathNote?.text) scopeParts.push(f.pathNote.text);
  if (f.peerScope?.text) scopeParts.push(f.peerScope.text);
  const introClaim = (f.positions || []).find((p) => p.claim === 'intro_vs_prev_window');
  if (introClaim?.text && !String(mainText).includes(String(trajectory.volume.windowTotal))) {
    scopeParts.push(introClaim.text);
  }

  let limit = null;
  const hardLimit = (f.limits || []).find((l) => l.id === 'outlier' || l.id === 'no_set_detail');
  if (hardLimit && f.main?.stance === 'indeterminate') {
    limit = hardLimit.text;
  } else if (
    hardLimit?.id === 'no_set_detail' &&
    !trajectory.setMechanism?.available &&
    trajectory.mode === 'progress'
  ) {
    limit = 'Sans détail de séries, on lit le volume par séance, pas la structure interne';
  }

  const reading = composeAnalyticalReading({
    titleThesis: title,
    constat: mainText || null,
    mechanism,
    scope: scopeParts.length ? scopeParts.join(' ') : null,
    implication: f.implication?.text || null,
    limit
  });

  const evidenceParts = [
    trajectory.temporalScope?.interpretingWithHistory
      ? `arc ${trajectory.temporalScope.arcSessionCount} (fenêtre ${trajectory.temporalScope.windowSessionCount})`
      : trajectory.volume.windowSessionCount != null
        ? `${trajectory.volume.windowSessionCount} séances`
        : null,
    trajectory.shape?.primaryStory || trajectory.shape?.path || null,
    trajectory.shape?.deltaPct != null ? `${trajectory.shape.deltaPct} %` : null,
    trajectory.setMechanism?.available
      ? `${trajectory.setMechanism.before?.setCount}×${trajectory.setMechanism.before?.perSet}→${trajectory.setMechanism.after?.setCount}×${trajectory.setMechanism.after?.perSet}`
      : null,
    trajectory.peers?.verdict && trajectory.peers.verdict !== 'insufficient'
      ? `témoins:${trajectory.peers.verdict}`
      : null
  ].filter(Boolean);

  return {
    title: reading.title,
    body: reading.body || legacyBits.body || '',
    evidence: evidenceParts.join(' · ') || legacyBits.evidence || '',
    usedTrajectory: true,
    readingBeats: reading.beats,
    trajectorySummary: {
      installation: trajectory.installation?.kind,
      shape: trajectory.shape?.kind,
      path: trajectory.shape?.path || null,
      primaryStory: trajectory.shape?.primaryStory || null,
      setMechanism: trajectory.setMechanism?.available ? trajectory.setMechanism.kind : null,
      peers: trajectory.peers?.verdict || null,
      implicationRule: f.implication?.ruleId || null,
      temporalScope: trajectory.temporalScope || null,
      stances: (f.positions || []).map((p) => `${p.claim}:${p.stance}`)
    }
  };
}

/** Sérialisation légère pour metrics / console (pas de duplication massive). */
export function trajectoryToMetrics(trajectory) {
  if (!trajectory?.ok) return { trajectoryOk: false, trajectoryReason: trajectory?.reason || null };
  const richness =
    (trajectory.setMechanism?.available ? 2 : 0) +
    (trajectory.peers?.available && trajectory.peers.verdict !== 'insufficient' ? 2 : 0) +
    (trajectory.findings?.implication ? 2 : 0) +
    (trajectory.findings?.positions?.length || 0);
  return {
    trajectoryOk: true,
    trajectoryMode: trajectory.mode,
    trajectoryInstallation: trajectory.installation?.kind || null,
    trajectoryShape: trajectory.shape?.kind || null,
    trajectoryPath: trajectory.shape?.path || null,
    trajectoryPrimaryStory: trajectory.shape?.primaryStory || null,
    trajectorySetMechanism: trajectory.setMechanism?.available ? trajectory.setMechanism.kind : null,
    trajectorySetAvailable: Boolean(trajectory.setMechanism?.available),
    trajectorySetGranularity: trajectory.setMechanism?.granularity || null,
    trajectoryPeers: trajectory.peers?.verdict || null,
    trajectoryReferenceLevels: trajectory.shape?.referenceLevels || null,
    peersSkippedSameLabel: trajectory.peers?.skippedSameLabel || [],
    trajectoryTitleHint: trajectory.findings?.titleHint || null,
    trajectoryImplicationRule: trajectory.findings?.implication?.ruleId || null,
    trajectoryRichness: richness,
    trajectoryLimits: (trajectory.findings?.limits || []).map((l) => l.id),
    trajectoryPositions: (trajectory.findings?.positions || []).map((p) => ({
      claim: p.claim,
      stance: p.stance,
      text: p.text
    })),
    temporalScope: trajectory.temporalScope || null,
    dates: (trajectory.sessions?.trace || []).map((s) => s.date),
    sessions: (trajectory.sessions?.trace || []).map((s) => ({
      date: s.date,
      reps: s.totalReps,
      setCount: s.setCount,
      setReps: s.setReps,
      setsTrusted: s.setsTrusted,
      schemeLabel: s.schemeLabel,
      inSelectedWindow: trajectory.temporalScope?.windowDates?.includes(s.date) ?? null
    })),
    volume: trajectory.volume,
    setMechanism: trajectory.setMechanism,
    shape: trajectory.shape,
    peers: {
      verdict: trajectory.peers?.verdict,
      detail: trajectory.peers?.detail,
      items: trajectory.peers?.items || []
    },
    installation: trajectory.installation,
    exclusions: trajectory.exclusions,
    diagnostics: trajectory.diagnostics,
    // Brouillon produit par la couche (avant gate)
    draftTitle: trajectory.findings?.titleHint || null
  };
}
