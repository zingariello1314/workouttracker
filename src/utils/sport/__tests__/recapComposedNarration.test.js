import { describe, it, expect } from 'vitest';
import {
  narrateFromComposedEvidence,
  titleFromComposedEvidence,
  applyComposedNarrationToDiscovery
} from '../recapComposedNarration';
import {
  expandIsoDatesInProse,
  fixKnownGrammarInProse,
  polishDiscoveryProse,
  editorialValidateDiscovery
} from '../recapEditorialPolish';
import { segmentRecapProseValues, segmentRecapProseSemantic } from '../recapProseMarks';
import { buildExerciseTrajectory, trajectoryToMetrics } from '../exerciseTrajectoryAnalysis';
import { buildComposedEvidenceFromTrajectory } from '../recapComposedEvidence';

function ymd(offset, base = '2026-09-01') {
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function snapFromSessions(exerciseId, sessions, extra = []) {
  const checkedExercises = {};
  const reps = {};
  const exerciseSetLogs = {};
  const add = (id, list) => {
    list.forEach((s) => {
      const key = `${s.date}_${id}`;
      checkedExercises[key] = true;
      reps[key] = String(s.total);
      if (s.sets) exerciseSetLogs[key] = { sets: s.sets.map((r) => ({ reps: r })) };
    });
  };
  add(exerciseId, sessions);
  extra.forEach((ex) => add(ex.id, ex.sessions));
  return { checkedExercises, reps, exerciseSetLogs };
}

const getName = (id) =>
  ({ 101: 'Pompes déclinées', 102: 'Pompes', 103: 'Dips', 201: 'Hyperextension' }[id] || '');

describe('F4 narration — scénario A profondeur visible', () => {
  it('explique recul via reps/série et témoins localisés', () => {
    const main = [
      { date: ymd(0), total: 36, sets: [12, 12, 12] },
      { date: ymd(5), total: 33, sets: [11, 11, 11] },
      { date: ymd(10), total: 27, sets: [9, 9, 9] },
      { date: ymd(15), total: 24, sets: [8, 8, 8] },
      { date: ymd(20), total: 19, sets: [7, 6, 6] }
    ];
    const traj = buildExerciseTrajectory({
      snapshot: snapFromSessions(101, main, [
        {
          id: 102,
          sessions: [60, 60, 62, 60].map((total, i) => ({
            date: ymd(1 + i * 5),
            total,
            sets: [20, 20, 20]
          }))
        },
        {
          id: 103,
          sessions: [36, 36, 36, 35].map((total, i) => ({
            date: ymd(2 + i * 5),
            total,
            sets: [12, 12, 12]
          }))
        }
      ]),
      exerciseId: 101,
      exerciseName: 'Pompes déclinées',
      window: { start: ymd(0), end: ymd(20) },
      getExerciseNameById: getName,
      mode: 'progress'
    });
    const composed = traj.composedEvidence || buildComposedEvidenceFromTrajectory(traj);
    const narrated = narrateFromComposedEvidence(composed, { metrics: trajectoryToMetrics(traj) }, {
      getExerciseNameById: getName
    });
    expect(narrated.usedComposedNarration).toBe(true);
    expect(narrated.body).toMatch(/série/i);
    expect(narrated.body).toMatch(/répétitions/i);
    expect(narrated.body.toLowerCase()).not.toMatch(/physiolog|surentraînement/);
    expect(narrated.depth).not.toBe('none');
    if (composed.comparators?.verdict === 'localized') {
      expect(narrated.title || narrated.body).toMatch(/recul|moins|baisse|poussée|stables/i);
    }
  });
});

describe('F4 narration — scénario B consolidation', () => {
  it('formule format 3×12 → 4×12 maintenu', () => {
    const sessions = [
      { date: ymd(0), total: 36, sets: [12, 12, 12] },
      { date: ymd(7), total: 36, sets: [12, 12, 12] },
      { date: ymd(14), total: 48, sets: [12, 12, 12, 12] },
      { date: ymd(21), total: 48, sets: [12, 12, 12, 12] },
      { date: ymd(28), total: 48, sets: [12, 12, 12, 12] }
    ];
    const traj = buildExerciseTrajectory({
      snapshot: snapFromSessions(201, sessions),
      exerciseId: 201,
      exerciseName: 'Hyperextension',
      window: { start: ymd(0), end: ymd(28) },
      mode: 'emergence'
    });
    const composed = traj.composedEvidence;
    const narrated = narrateFromComposedEvidence(composed, {}, { getExerciseNameById: getName });
    expect(narrated.body).toMatch(/4\s*×\s*12|4 × 12/);
    expect(narrated.body).toMatch(/33|reproduit|maintient/i);
    // Disclaimer anti-physio autorisé ; affirmation positive interdite
    expect(narrated.body.toLowerCase()).not.toMatch(/prouve une (adaptation|progression) physiologique/);
    expect(titleFromComposedEvidence(composed, { name: 'Hyperextension' })).toMatch(/format|volumineux|maintient/i);
  });
});

describe('F4 narration — pic isolé', () => {
  it('ne parle pas de consolidation', () => {
    const sessions = [
      { date: ymd(0), total: 36, sets: [12, 12, 12] },
      { date: ymd(7), total: 36, sets: [12, 12, 12] },
      { date: ymd(14), total: 48, sets: [12, 12, 12, 12] },
      { date: ymd(21), total: 36, sets: [12, 12, 12] },
      { date: ymd(28), total: 36, sets: [12, 12, 12] }
    ];
    const traj = buildExerciseTrajectory({
      snapshot: snapFromSessions(201, sessions),
      exerciseId: 201,
      exerciseName: 'Hyperextension',
      window: { start: ymd(0), end: ymd(28) },
      mode: 'emergence'
    });
    const narrated = narrateFromComposedEvidence(traj.composedEvidence, {});
    expect(narrated.body || '').not.toMatch(/organisation du travail reproduite/i);
    expect(narrated.title || '').not.toMatch(/se maintient/i);
  });
});

describe('F4 polish & marks', () => {
  it('expand ISO en français long', () => {
    expect(expandIsoDatesInProse('Le 2026-11-01 tu as dormi')).toMatch(/1 novembre 2026/);
  });

  it('corrige 1 séance n’ont', () => {
    expect(fixKnownGrammarInProse('1 séance du creux n’ont qu’un total')).toMatch(/n’a/);
  });

  it('colore 7 h 42 comme durée entière', () => {
    const segs = segmentRecapProseValues('Tu as dormi 7 h 42 cette nuit');
    const marked = segs.filter((s) => s.mark).map((s) => s.text);
    expect(marked.some((t) => /7\s*h\s*42/i.test(t))).toBe(true);
  });

  it('colore 22 min', () => {
    const segs = segmentRecapProseValues('une sortie de 22 min');
    expect(segs.some((s) => s.mark && /22\s*min/i.test(s.text))).toBe(true);
  });

  it('segments sémantiques exercice', () => {
    const segs = segmentRecapProseSemantic('12 tractions australiennes ce jour', {
      entities: [{ type: 'exercise', text: 'tractions australiennes' }]
    });
    expect(segs.some((s) => s.kind === 'exercise' && s.mark)).toBe(true);
    expect(segs.some((s) => s.mark && /12/.test(s.text))).toBe(true);
  });

  it('sommeil : date injectée si anonymat', () => {
    const d = polishDiscoveryProse({
      kind: 'disc_sleep_night',
      title: 'Nuit courte',
      body: 'La nuit associée était plus courte que ton habitude.',
      metrics: { nightYmd: '2026-10-28' }
    });
    expect(d.body).toMatch(/28 octobre 2026/);
    expect(d.body.toLowerCase()).not.toMatch(/nuit associée/);
  });
});

describe('F4 editorial validate', () => {
  it('rejette claim physiologique interdit', () => {
    const v = editorialValidateDiscovery({
      title: 'x',
      body: 'Cela prouve une adaptation physiologique claire.',
      metrics: {
        composedEvidence: { forbiddenConclusions: ['adaptation_physiologique'] }
      }
    });
    expect(v.ok).toBe(false);
    expect(v.rejects).toContain('forbidden_physiological_claim');
  });

  it('applyComposedNarration conserve draft avant', () => {
    const card = applyComposedNarrationToDiscovery({
      kind: 'disc_exercise_progress',
      title: 'Ancien titre',
      body: 'Ancien body sans profondeur.',
      metrics: {
        composedOk: true,
        composedEvidence: {
          ok: true,
          composed: true,
          factCount: 3,
          primaryPhenomenon: {
            name: 'Pompes déclinées',
            exerciseId: 101,
            primaryStory: 'net_decline'
          },
          windows: { primary: { start: '2026-09-01', end: '2026-09-20' }, historical: null },
          observations: [
            { date: '2026-09-01', totalReps: 36, inSelectedWindow: true },
            { date: '2026-09-20', totalReps: 19, inSelectedWindow: true }
          ],
          decomposition: {
            kind: 'same_sets_fewer_reps',
            before: { setCount: 3, perSet: 12 },
            after: { setCount: 3, perSet: 6 },
            maintained: false
          },
          continuity: { kind: 'confirmed_decline', stance: 'probable' },
          volumeAttribution: null,
          comparators: { verdict: 'insufficient', items: [], detail: null },
          lexicon: { maySayPerformance: false, subjectNoun: 'volume' },
          levels: { observed: null, interpreted: null, implication: null },
          proof: { positions: [], limits: [] },
          caveats: [],
          forbiddenConclusions: ['adaptation_physiologique', 'decomposition_series_vs_reps'],
          conclusion: null
        }
      }
    });
    expect(card.metrics.draftBodyBeforeF4).toMatch(/Ancien body/);
    expect(card.body).toMatch(/série|répétitions/i);
    expect(card.metrics.f4Narration?.used).toBe(true);
  });
});
