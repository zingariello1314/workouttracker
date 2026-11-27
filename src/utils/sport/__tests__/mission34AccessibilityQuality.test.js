/**
 * Mission 34 — accessibilité réserve consultable, doublons textuels C, prose fenêtre vide.
 */
import { describe, expect, it } from 'vitest';
import { ANALYSIS_EDITION_PARTS } from '../analysisEdition';
import { marginalValue, selectCollectively } from '../collectiveSelection';
import { discoveryInformativeValue } from '../recapPeriodSelection';
import { periodVerb } from '../recapPeriodVoice';
import { runGameCCollective } from '../evaluation/gameCCollective';

describe('Mission 34 — édition', () => {
  it('bumpe editorial v33 + sélection consultable', () => {
    expect(ANALYSIS_EDITION_PARTS.editorial).toMatch(/^p6-sovereign-v3[34]$/);
    expect(ANALYSIS_EDITION_PARTS.selection).toBe('consultable-reserve-v2');
  });
});

describe('Mission 34 — Porte A dispositions consultables (contrat UI)', () => {
  it('documente le set attendu par RecapAnalyseView', () => {
    // Miroir du set CONSULTABLE_RESERVE_DISPOSITIONS (évite d’importer JSX)
    const CONSULTABLE = new Set([
      'valid_reserved',
      'demoted_priority',
      'deepening_of_collective',
      'deepening_accessible',
      'reserve',
      'demoted_partial_redundancy'
    ]);
    expect(CONSULTABLE.has('deepening_of_collective')).toBe(true);
    expect(CONSULTABLE.has('source_retained')).toBe(false);
    expect(CONSULTABLE.has('rejected_factual')).toBe(false);
  });
});

describe('Mission 34 — Porte B doublons textuels multi-détecteurs', () => {
  it('marginalValue marque multi_detector_same_text', () => {
    const a = {
      discovery: {
        id: 'disc_emergence|ex:1',
        kind: 'disc_emergence',
        title: 'Pompes déclinées: moins de répétitions par séance',
        body: 'Sur 8 séances, le volume moyen baisse.',
        informativeValue: 40
      }
    };
    const b = {
      discovery: {
        id: 'disc_exercise_progress|ex:1',
        kind: 'disc_exercise_progress',
        title: 'Pompes déclinées: moins de répétitions par séance',
        body: 'Sur 8 séances, le volume moyen baisse.',
        informativeValue: 50
      }
    };
    const mv = marginalValue(a, [b]);
    expect(mv.overlap).toBe(1);
    expect(mv.overlapReason).toBe('multi_detector_same_text');
    expect(mv.collapsedInto).toBeTruthy();
  });

  it('selectCollectively n’expose pas deux fois le même texte', () => {
    const rows = [
      {
        discovery: {
          id: 'a',
          kind: 'disc_emergence',
          title: 'Curl: volume par séance en hausse',
          body: 'Même constat partagé.',
          informativeValue: 55,
          weights: { importance: 0.8 }
        },
        wasPriority: true
      },
      {
        discovery: {
          id: 'b',
          kind: 'disc_exercise_progress',
          title: 'Curl: volume par séance en hausse',
          body: 'Même constat partagé.',
          informativeValue: 60,
          weights: { importance: 0.85 }
        },
        wasPriority: true
      }
    ];
    const out = selectCollectively(rows, { voiceKey: 'quarter' });
    const accessible = [...out.priority, ...out.reserve];
    const keys = accessible.map(
      (r) =>
        `${String(r.discovery?.title || '').toLowerCase()}|${String(r.discovery?.body || '')
          .toLowerCase()
          .slice(0, 120)}`
    );
    expect(new Set(keys).size).toBe(keys.length);
    expect(out.suppressed.some((r) => r.p6Disposition === 'exact_duplicate_suppressed')).toBe(true);
  });

  it('Jeu C : plus de textualDuplicates sur paquet nettoyé', () => {
    const mk = (id, kind, title, body) => ({
      id,
      kind,
      title,
      body,
      disposition: 'priority'
    });
    const kept = mk('a', 'disc_exercise_progress', 'Curl: hausse', 'Mécanisme : plus de reps/séance.');
    const report = runGameCCollective({
      periodPacks: [
        {
          period: '3m',
          insights: {
            shortTerm: [kept],
            mediumTerm: [],
            longTerm: [],
            accessibleReserve: []
          },
          p6: { counters: { reconciled: true }, priority: [kept], reserve: [] }
        }
      ]
    });
    expect(report.textualDuplicatesAccessible).toBe(0);
  });
});

describe('Mission 34 — Porte D prose & sélection', () => {
  it('periodVerb pluriel pour « ces 7 jours »', () => {
    expect(periodVerb('ces 7 jours', "n'a", "n'ont")).toBe("n'ont");
    expect(periodVerb('cette semaine', "n'a", "n'ont")).toBe("n'a");
  });

  it('valorise un mécanisme étayé au-dessus d’une description générique', () => {
    const explanatory = {
      kind: 'disc_composed_volume',
      title: 'Le total monte surtout parce que tu t’entraînes plus souvent',
      body: 'Parce que la fréquence explique la hausse : 12 puis 20 séances.',
      score: 50,
      metrics: {
        trajectoryOk: true,
        volumeAttribution: { kind: 'frequency_driven_total_rise' },
        observedValues: [
          { id: 'sessionsNow', value: 20 },
          { id: 'sessionsThen', value: 12 }
        ]
      }
    };
    const descriptive = {
      kind: 'disc_emergence',
      title: 'Un exercice apparaît',
      body: 'Tu as 40 reps.',
      score: 50,
      metrics: {}
    };
    expect(discoveryInformativeValue(explanatory, 'week')).toBeGreaterThan(
      discoveryInformativeValue(descriptive, 'week')
    );
  });

  it('pénalise session_families en contexte long', () => {
    const card = {
      kind: 'disc_session_family_structure',
      title: 'Familles',
      body: 'Structure',
      score: 80,
      metrics: { horizonRole: 'context_accessible', familyCount: 3 }
    };
    expect(discoveryInformativeValue(card, 'year')).toBeLessThan(70);
  });
});
