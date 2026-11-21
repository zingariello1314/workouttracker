/**
 * Contexte programmatique transversal (Mission 11).
 * Relie une variation de volume réalisée aux variantes prescrites
 * avant de conclure à un recul/progression de capacité.
 */

import { buildProgramSessionGraph, extractSessionTemplates } from './sessionStructureGraph';

function normName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Cherche si un mouvement apparaît avec des prescriptions différentes
 * dans deux créneaux apparentés (variantes de séance).
 */
export function findProgrammedVolumeVariants(activeProgram, exerciseNameOrId) {
  const templates = extractSessionTemplates(activeProgram);
  const graph = buildProgramSessionGraph(activeProgram);
  if (!graph.available || !templates.length) {
    return {
      available: false,
      reason: 'no_program_graph',
      variants: []
    };
  }

  const needle = normName(exerciseNameOrId);
  const needleId = String(exerciseNameOrId || '');
  const hits = [];

  templates.forEach((tpl) => {
    (tpl.exercises || []).forEach((ex) => {
      const n = normName(ex?.name || ex?.exerciseName);
      const id = String(ex?.originalId ?? ex?.id ?? ex?.exerciseId ?? '');
      if (!n && !id) return;
      const match =
        (needle && n && (n === needle || n.includes(needle) || needle.includes(n))) ||
        (needleId && id && id === needleId);
      if (!match) return;
      const series = String(ex?.series || '').trim();
      const planned =
        (() => {
          const m = series.match(/(\d+)\s*[×xX*]\s*(\d+)/);
          if (m) return Number(m[1]) * Number(m[2]);
          return Number(ex?.plannedReps) || 0;
        })();
      hits.push({
        dayKey: tpl.dayKey,
        sessionName: tpl.name,
        exerciseName: ex?.name || ex?.exerciseName || n,
        series: series || null,
        plannedReps: planned,
        familyId:
          (graph.families || []).find((f) => f.members.includes(tpl.dayKey))?.familyId || null
      });
    });
  });

  if (hits.length < 2) {
    return {
      available: hits.length === 1,
      reason: hits.length === 1 ? 'single_prescription' : 'not_in_program',
      variants: hits
    };
  }

  const plannedSet = new Set(hits.map((h) => `${h.series}|${h.plannedReps}`));
  const distinctPrescriptions = plannedSet.size >= 2;
  const sameFamily = hits.every((h) => h.familyId && h.familyId === hits[0].familyId);

  return {
    available: true,
    reason: distinctPrescriptions
      ? sameFamily
        ? 'programmed_variants_same_family'
        : 'programmed_variants_distinct_slots'
      : 'same_prescription_repeated',
    distinctPrescriptions,
    sameFamily,
    variants: hits,
    implication: distinctPrescriptions
      ? 'Une variation de volume réalisé peut refléter le passage entre variantes prescrites, pas un changement de capacité.'
      : null
  };
}

/**
 * Annote une découverte de trajectoire si une explication programmatique existe.
 * N’invente pas d’historique : se limite au programme courant documenté.
 */
export function annotateTrajectoryWithProgramContext(discovery, activeProgram) {
  if (!discovery || !activeProgram) return discovery;
  const name =
    discovery?.metrics?.exerciseName ||
    discovery?.metrics?.name ||
    discovery?.subject?.key ||
    null;
  const id = discovery?.metrics?.exerciseId || null;
  const ctx = findProgrammedVolumeVariants(activeProgram, name || id);
  if (!ctx.distinctPrescriptions) return discovery;

  const body = String(discovery.body || '');
  const already = /variante|prescription|créneau apparenté|capacité/i.test(body);
  const note =
    ' Attention : ce mouvement a des prescriptions distinctes selon les créneaux apparentés du programme actuel — une baisse de répétitions peut venir du passage d’une variante à l’autre, sans démontrer un recul de capacité. Sans appariement séance↔créneau, les hypothèses restent ouvertes.';

  return {
    ...discovery,
    body: already ? body : `${body}${note}`.trim(),
    text: already ? body : `${body}${note}`.trim(),
    metrics: {
      ...(discovery.metrics || {}),
      programVariantContext: ctx,
      limitations: [
        ...((discovery.metrics?.limits || discovery.limitations || [])),
        'program_variant_confounder'
      ]
    },
    limitations: [
      ...(discovery.limitations || []),
      'program_variant_confounder'
    ]
  };
}
