/**
 * P3.5 — Découvertes GTG × classique, écarts de réalisation, ressenti.
 * Abstention silencieuse si preuves insuffisantes (pas de cartes méthodologiques forcées).
 *
 * @module recapP35Discoveries
 */

import { CONTENT_CLASS } from './recapDiscoveryContentClass';
import { computeP35WindowMetrics } from './recapP35Metrics';
import { P35_KINDS, P35_RIVAL_GROUPS } from './recapP35Kinds';

export { P35_KINDS, P35_RIVAL_GROUPS };

function card({
  kind,
  title,
  body,
  nature = 'trajectory',
  contentClass = CONTENT_CLASS.ANALYTICAL,
  evidence = {},
  weights = {},
  metrics = {}
}) {
  const informative = Number(weights.informativeValue) || 70;
  const isDescriptive = contentClass === CONTENT_CLASS.DESCRIPTIVE;
  // E0 scoreOf = I×R×N×F×100. Viser ~48–58 pour l’analytique solide (compétitif,
  // pas monopolistique) ; descriptif ressenti un cran plus bas.
  return {
    kind,
    title,
    body,
    nature,
    family: 'p35',
    contentClass,
    evidence: { phase: 'P3.5', ...evidence },
    weights: {
      importance: Math.min(0.92, Math.max(0.55, informative / 100)),
      reliability: isDescriptive ? 0.82 : 0.9,
      novelty: isDescriptive ? 0.58 : 0.72,
      fit: 0.92,
      ...weights
    },
    metrics: {
      phase: 'P3.5',
      contentClass,
      informativeValue: informative,
      ...metrics
    }
  };
}

/**
 * @param {object} opts
 * @param {object} opts.snapshot
 * @param {{ start: string, end: string }} opts.window
 * @param {object} [opts.liveActiveProgram]
 * @param {function} [opts.getExerciseNameById]
 * @param {boolean} [opts.includeP35Discoveries]
 */
export function buildP35Discoveries({
  snapshot = null,
  window = null,
  liveActiveProgram = null,
  getExerciseNameById = null,
  includeP35Discoveries = true
} = {}) {
  if (!includeP35Discoveries) {
    return { discoveries: [], metrics: null, abstentions: ['opt_out'] };
  }
  if (!snapshot || !window?.start || !window?.end) {
    return { discoveries: [], metrics: null, abstentions: ['missing_window'] };
  }

  const metrics = computeP35WindowMetrics(snapshot, window, {
    liveActiveProgram,
    getExerciseNameById
  });

  const discoveries = [];
  const nameOf = (id) => {
    if (typeof getExerciseNameById === 'function') {
      try {
        const n = getExerciseNameById(id);
        if (n) return String(n);
      } catch {
        /* ignore */
      }
    }
    return `exercice ${id}`;
  };

  // ── A1 coexistence ───────────────────────────────────────────────────────
  if (metrics.coexistence.publishable) {
    const c = metrics.coexistence;
    const body = buildCoexistenceBody(c);
    if (body) {
      discoveries.push(
        card({
          kind: P35_KINDS.GTG_COEXISTENCE,
          title: 'GTG et séances classiques',
          body,
          evidence: {
            classicOnlyDays: c.classicOnlyDays,
            gtgOnlyDays: c.gtgOnlyDays,
            bothDays: c.bothDays,
            activeChannelDays: c.activeChannelDays
          },
          metrics: {
            ...c.denominators,
            gtgShareOfActiveDays: c.gtgShareOfActiveDays,
            bothShareOfGtgDays: c.bothShareOfGtgDays,
            proofLevel: 'observed_channels'
          },
          weights: { informativeValue: 72 }
        })
      );
    }
  }

  // ── A2 même mouvement ────────────────────────────────────────────────────
  if (metrics.movementShares.publishable && metrics.movementShares.topCombined) {
    const m = metrics.movementShares.topCombined;
    const label = nameOf(m.id);
    discoveries.push(
      card({
        kind: P35_KINDS.GTG_MOVEMENT_SHARE,
        title: `${label} : classique et GTG`,
        body:
          `Sur cette période, tu as enregistré ${m.classicExclusiveReps} répétitions de séance classique ` +
          `(hors injection GTG synchronisée) et ${m.gtgReps} en GTG sur ${label} ` +
          `(${m.days} jour${m.days > 1 ? 's' : ''} en commun). ` +
          `Le GTG représente ${fmtPct(m.gtgSharePct)} des répétitions documentées sur ce mouvement.`,
        evidence: {
          id: m.id,
          classicExclusiveReps: m.classicExclusiveReps,
          gtgReps: m.gtgReps,
          totalDocumentedReps: m.totalDocumentedReps,
          days: m.days,
          identityConfidence: m.identityConfidence
        },
        metrics: {
          exerciseId: m.id,
          gtgSharePct: m.gtgSharePct,
          unit: 'reps',
          proofLevel: 'certain_identity_no_double_count',
          trajectoryOk: true
        },
        weights: { informativeValue: 88, specificity: 0.85 }
      })
    );
  }

  // ── A3 hors classique ────────────────────────────────────────────────────
  if (metrics.gtgContinuity.publishable) {
    const g = metrics.gtgContinuity;
    const restNote =
      g.plannedRestWithGtg > 0
        ? ` Dont ${g.plannedRestWithGtg} jour${g.plannedRestWithGtg > 1 ? 's' : ''} de repos prévu démontré.`
        : '';
    const unknownNote =
      g.unknownPlanWithGtg > 0
        ? ` Pour ${g.unknownPlanWithGtg} jour${g.unknownPlanWithGtg > 1 ? 's' : ''}, le programme historique n’est pas démontré : ce ne sont pas des « repos » affirmés.`
        : '';
    discoveries.push(
      card({
        kind: P35_KINDS.GTG_OUTSIDE_CLASSIC,
        title: 'GTG hors séances classiques',
        body:
          `Sur les ${g.daysWithoutClassicExclusive} journées sans séance classique ` +
          `(hors reps GTG synchronisées), ` +
          `${g.daysWithoutClassicWithGtg} comportent du GTG (${fmtPct(g.sharePct)}). ` +
          `Ce n’est pas la même chose que des passages hors horaires prévus.` +
          restNote +
          unknownNote,
        evidence: { ...g },
        metrics: {
          ...g.denominators,
          sharePct: g.sharePct,
          proofLevel: 'observed_absence_of_classic_exclusive'
        },
        weights: { informativeValue: 78 }
      })
    );
  }

  // ── B écarts ─────────────────────────────────────────────────────────────
  if (metrics.gaps.publishable) {
    const g = metrics.gaps;
    const body = buildGapBody(g);
    if (body) {
      discoveries.push(
        card({
          kind: P35_KINDS.GAP_NATURE,
          title: 'Nature des écarts au programme',
          body,
          contentClass: CONTENT_CLASS.ANALYTICAL,
          evidence: {
            usableDemonstratedDays: g.usableDemonstratedDays,
            partialSessions: g.partialSessions,
            missedSessions: g.missedSessions,
            daysWithSupplemental: g.daysWithSupplemental,
            daysWithSuppressed: g.daysWithSuppressed
          },
          metrics: {
            proofLevel: 'demonstrated_snapshots_only',
            usableDemonstratedDays: g.usableDemonstratedDays,
            recurringAdaptations: g.recurringAdaptations
          },
          weights: { informativeValue: 80 }
        })
      );
    }
  }

  // ── C ressenti (conditionnel) ────────────────────────────────────────────
  if (metrics.feedback.publishable) {
    const f = metrics.feedback;
    let body =
      `Tu as renseigné une difficulté (échelle 1–10 de l’app, pas un RPE standardisé) ` +
      `sur ${f.difficulteDays} séances. Moyenne : ${f.meanDifficulte}/10` +
      (f.highDifficulteDays > 0
        ? `, dont ${f.highDifficulteDays} séance${f.highDifficulteDays > 1 ? 's' : ''} ≥ 7.`
        : '.');
    if (
      f.meanDifficultePartial != null &&
      f.meanDifficulteFull != null &&
      f.partialSessionsWithDifficulte >= 2 &&
      f.fullSessionsWithDifficulte >= 2
    ) {
      body +=
        ` Sur les séances à plan démontré, les partielles affichent ${f.meanDifficultePartial}/10 ` +
        `en moyenne, contre ${f.meanDifficulteFull}/10 pour les séances complètes — ` +
        `constat descriptif, sans causalité.`;
    }
    discoveries.push(
      card({
        kind: P35_KINDS.FEEDBACK_DIFFICULTE,
        title: 'Difficulté ressentie',
        body,
        contentClass: CONTENT_CLASS.DESCRIPTIVE,
        evidence: {
          scale: f.scale,
          difficulteDays: f.difficulteDays,
          meanDifficulte: f.meanDifficulte
        },
        metrics: {
          scale: f.scale,
          inventRpeForbidden: true,
          proofLevel: 'user_entered_feedback'
        },
        weights: { informativeValue: 70 }
      })
    );
  }

  // ── D croisement ─────────────────────────────────────────────────────────
  if (metrics.cross.publishable) {
    const x = metrics.cross;
    const delta = Math.abs(
      (x.bothArm.meanDifficulte || 0) - (x.classicOnlyArm.meanDifficulte || 0)
    );
    if (delta >= 0.8) {
      discoveries.push(
        card({
          kind: P35_KINDS.CROSS_GTG_DIFFICULTE,
          title: 'Difficulté les jours combinés',
          body:
            `Sur ${x.bothArm.n + x.classicOnlyArm.n} séances avec difficulté renseignée, ` +
            `les ${x.bothArm.n} jours combinant GTG et séance classique affichent ` +
            `${x.bothArm.meanDifficulte}/10 en moyenne, contre ${x.classicOnlyArm.meanDifficulte}/10 ` +
            `pour les ${x.classicOnlyArm.n} jours de séance classique seule. ` +
            `Échantillon encore fragile : observation, pas preuve d’effet du GTG.`,
          contentClass: CONTENT_CLASS.DESCRIPTIVE,
          evidence: { bothArm: x.bothArm, classicOnlyArm: x.classicOnlyArm },
          metrics: {
            causalityForbidden: true,
            deltaMean: Math.round(delta * 10) / 10,
            proofLevel: 'descriptive_small_sample'
          },
          weights: { informativeValue: 62 }
        })
      );
    }
  }

  return {
    discoveries: discoveries.filter(
      (d) => d?.title && String(d.body || '').length >= 40
    ),
    metrics,
    abstentions: metrics.abstentions || []
  };
}

function fmtPct(n) {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${String(n).replace('.', ',')} %`;
}

function buildCoexistenceBody(c) {
  if (c.activeChannelDays < 4) return null;
  const parts = [];
  const bothLabel =
    c.bothDays === 1
      ? 'et 1 combine les deux'
      : `et ${c.bothDays} combinent les deux`;
  parts.push(
    `Sur ${c.activeChannelDays} jours avec activité enregistrée (séance classique hors sync GTG et/ou GTG), ` +
      `${c.classicOnlyDays} sont exclusivement classiques, ${c.gtgOnlyDays} exclusivement GTG, ` +
      `${bothLabel}.`
  );
  if (c.bothShareOfGtgDays != null && c.gtgOnlyDays + c.bothDays > 0) {
    parts.push(
      `Parmi tes jours GTG actifs, ${fmtPct(c.bothShareOfGtgDays)} coïncident aussi avec une séance classique.`
    );
  }
  if (c.gtgOnPlannedRestDays > 0) {
    parts.push(
      `${c.gtgOnPlannedRestDays} jour${c.gtgOnPlannedRestDays > 1 ? 's' : ''} de repos prévu démontré comportent du GTG.`
    );
  }
  if (c.gtgOnNonReconstructibleDays > 0) {
    parts.push(
      `${c.gtgOnNonReconstructibleDays} jour${c.gtgOnNonReconstructibleDays > 1 ? 's' : ''} GTG sans programme historiquement démontré : non classés comme repos.`
    );
  }
  return parts.join(' ');
}

function buildGapBody(g) {
  const bits = [];
  bits.push(
    `Sur ${g.usableDemonstratedDays} jours à plan historiquement démontré, ` +
      `${g.fullyRealizedSessions} séance${g.fullyRealizedSessions > 1 ? 's' : ''} entièrement réalisée${g.fullyRealizedSessions > 1 ? 's' : ''}, ` +
      `${g.partialSessions} partielle${g.partialSessions > 1 ? 's' : ''}, ` +
      `${g.missedSessions} prévue${g.missedSessions > 1 ? 's' : ''} sans réalisation.`
  );
  if (g.daysWithSuppressed > 0) {
    bits.push(
      `${g.daysWithSuppressed} jour${g.daysWithSuppressed > 1 ? 's' : ''} avec exercice(s) volontairement retiré(s) du plan du jour ` +
        `(exception quotidienne, pas une révision globale).`
    );
  }
  if (g.daysWithSupplemental > 0) {
    bits.push(
      `${g.daysWithSupplemental} jour${g.daysWithSupplemental > 1 ? 's' : ''} avec exercice(s) supplémentaire(s).`
    );
  }
  if (g.plannedRestWithActivity > 0) {
    bits.push(
      `${g.plannedRestWithActivity} jour${g.plannedRestWithActivity > 1 ? 's' : ''} de repos prévu avec activité enregistrée.`
    );
  }
  if (g.recurringAdaptations) {
    bits.push(
      `Ces ajustements du jour apparaissent assez souvent pour constituer une habitude observable — sans juger le programme.`
    );
  }
  return bits.join(' ');
}
