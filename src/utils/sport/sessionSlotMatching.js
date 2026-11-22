/**
 * Appariement séance réalisée ↔ créneau / variante de programme (Mission 13).
 * Ne s’appuie jamais uniquement sur le jour de la semaine.
 * Ne rétroprojette pas silencieusement le programme actuel sur l’historique absent.
 */

import { extractSessionTemplates, exerciseWorkModality } from './sessionStructureGraph';

function norm(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function movementKeysFromSession(exercises = []) {
  return [
    ...new Set(
      (exercises || [])
        .filter((ex) => exerciseWorkModality(ex) !== 'cardio')
        .map((ex) => norm(ex?.name || ex?.exerciseName))
        .filter(Boolean)
    )
  ];
}

function movementIdsFromSession(exercises = []) {
  return [
    ...new Set(
      (exercises || [])
        .filter((ex) => exerciseWorkModality(ex) !== 'cardio')
        .map((ex) => String(ex?.id ?? ex?.exerciseId ?? ex?.storageId ?? '').trim())
        .filter(Boolean)
    )
  ];
}

function templateIdKeys(tpl) {
  const fromExercises = (tpl.exercises || [])
    .map((ex) => String(ex?.originalId ?? ex?.storageId ?? ex?.id ?? ex?.exerciseId ?? '').trim())
    .filter(Boolean);
  const fromKeys = (tpl.exerciseKeys || [])
    .filter((k) => String(k).startsWith('id:'))
    .map((k) => String(k).slice(3));
  return [...new Set([...fromExercises, ...fromKeys])];
}

function jaccard(a, b) {
  const A = new Set(a || []);
  const B = new Set(b || []);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach((x) => {
    if (B.has(x)) inter += 1;
  });
  return inter / (A.size + B.size - inter);
}

/**
 * @param {object} realizedSession — { date, exercises: [{name, reps, series?}] }
 * @param {object|null} activeProgram
 * @param {{ historicalProgram?: object|null, allowProbable?: boolean }} [opts]
 */
export function matchSessionToProgramSlot(realizedSession, activeProgram, opts = {}) {
  const program = opts.historicalProgram || activeProgram;
  if (!program?.schedule) {
    return {
      status: 'program_history_unknown',
      certainty: 'none',
      candidates: [],
      note: 'Aucun programme applicable documenté pour cette date'
    };
  }
  const templates = extractSessionTemplates(program);
  if (!templates.length) {
    return { status: 'impossible', certainty: 'none', candidates: [], note: 'programme sans séances' };
  }

  const realizedKeys = movementKeysFromSession(realizedSession?.exercises || []);
  const realizedIds = movementIdsFromSession(realizedSession?.exercises || []);
  if (!realizedKeys.length && !realizedIds.length) {
    return { status: 'impossible', certainty: 'none', candidates: [], note: 'séance sans mouvements de renforcement' };
  }

  const scored = templates
    .map((tpl) => {
      const tplKeys = (tpl.exerciseKeys || [])
        .map((k) => String(k).replace(/^name:/, '').replace(/^id:/, ''))
        .map(norm)
        .filter(Boolean);
      const tplIds = templateIdKeys(tpl);
      const nameOverlap = realizedKeys.length && tplKeys.length ? jaccard(realizedKeys, tplKeys) : 0;
      const idOverlap = realizedIds.length && tplIds.length ? jaccard(realizedIds, tplIds) : 0;
      // Mission 20 — composition par noms OU identifiants (ne pas perdre l’info id).
      const overlap = Math.max(nameOverlap, idOverlap);
      const shared = realizedKeys.filter((k) => tplKeys.some((t) => t === k || t.includes(k) || k.includes(t)));
      const sharedIds = realizedIds.filter((id) => tplIds.includes(id));
      const onlyRealized = realizedKeys.filter((k) => !tplKeys.some((t) => t === k || t.includes(k) || k.includes(t)));
      const onlyTemplate = tplKeys.filter((k) => !realizedKeys.some((t) => t === k || t.includes(k) || k.includes(t)));
      return {
        dayKey: tpl.dayKey,
        sessionName: tpl.name,
        familyId: tpl.muscleProfile ? null : null,
        plannedReps: tpl.plannedReps,
        overlap,
        nameOverlap,
        idOverlap,
        sharedMovements: shared.length ? shared : sharedIds,
        missingFromRealized: onlyTemplate,
        extraInRealized: onlyRealized,
        partial: onlyRealized.length > 0 || onlyTemplate.length > 0,
        matchAxis: idOverlap >= nameOverlap && idOverlap > 0 ? 'id' : 'name'
      };
    })
    .sort((a, b) => b.overlap - a.overlap);

  const best = scored[0];
  const second = scored[1];
  if (!best || best.overlap < 0.25) {
    return {
      status: 'off_program',
      certainty: 'supported',
      candidates: scored.slice(0, 3),
      note: 'Composition trop éloignée des créneaux prescrits'
    };
  }

  const closeSecond = second && best.overlap - second.overlap < 0.08 && second.overlap >= 0.35;
  if (closeSecond) {
    return {
      status: 'multiple_compatible_variants',
      certainty: 'probable',
      candidates: scored.slice(0, 3),
      primary: best,
      note: 'Plusieurs variantes compatibles — ne pas forcer un créneau unique'
    };
  }

  if (best.overlap >= 0.7 && best.missingFromRealized.length <= 1) {
    return {
      status: best.partial ? 'partial_session' : 'matched_proven',
      certainty: 'supported',
      candidates: [best],
      primary: best,
      note: best.partial
        ? 'Appariement fort avec omission ou ajout local'
        : 'Appariement prouvé par composition de mouvements'
    };
  }

  if (best.overlap >= 0.45 && opts.allowProbable !== false) {
    return {
      status: 'matched_probable',
      certainty: 'probable',
      candidates: scored.slice(0, 2),
      primary: best,
      note: 'Appariement probable — pas une preuve historique de créneau'
    };
  }

  return {
    status: 'impossible',
    certainty: 'none',
    candidates: scored.slice(0, 2),
    note: 'Chevauchement insuffisant'
  };
}

/**
 * Enrichit une trajectoire si un appariement créneau/variante est démontré.
 */
export function applySlotMatchToTrajectory(discovery, realizedSession, activeProgram) {
  if (!discovery || !activeProgram) return discovery;
  const match = matchSessionToProgramSlot(realizedSession, activeProgram, { allowProbable: true });
  if (!['matched_proven', 'partial_session', 'matched_probable', 'multiple_compatible_variants'].includes(match.status)) {
    return {
      ...discovery,
      metrics: {
        ...(discovery.metrics || {}),
        slotMatch: match
      }
    };
  }
  const primary = match.primary || match.candidates?.[0];
  const body = String(discovery.body || '');
  if (/créneau|variante appariée|prescription documentée/i.test(body)) {
    return { ...discovery, metrics: { ...(discovery.metrics || {}), slotMatch: match } };
  }
  const slotBit = primary
    ? ` Contexte de séance ${match.certainty === 'supported' ? 'apparié' : 'probable'} : ${primary.sessionName || primary.dayKey} (chevauchement ${(primary.overlap * 100).toFixed(0)} %).`
    : '';
  return {
    ...discovery,
    body: `${body}${slotBit}`.trim(),
    text: `${body}${slotBit}`.trim(),
    metrics: {
      ...(discovery.metrics || {}),
      slotMatch: match,
      composition: 'slot_matched_trajectory'
    }
  };
}
