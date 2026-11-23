/**
 * Rapport de sous-exploration (Mission 7 / P6 / Mission 11).
 * Distingue occasion non exploitée vs hypothèse impossible à démontrer.
 * Matrice de couverture : relation × statut (exécutée / non concluante / jamais testée).
 */

const COVERAGE_RELATIONS = Object.freeze([
  {
    id: 'exercise_x_session',
    question: 'Le format dépend-il du contexte de séance ?',
    signals: [/session_family|program_structure|variant/i]
  },
  {
    id: 'session_x_variant',
    question: 'Comment la variante redistribue-t-elle le travail ?',
    signals: [/variant|program_variant|redistrib/i]
  },
  {
    id: 'session_x_cycle',
    question: 'Les séances se complètent-elles réellement ?',
    signals: [/cycle|complement|adherence|omission/i]
  },
  {
    id: 'cycle_x_cycle',
    question: 'Le rythme et la composition se maintiennent-ils ?',
    signals: [/rhythm|streak|calendar|composition/i]
  },
  {
    id: 'prescribed_x_realized',
    question: 'Quelles composantes du programme sont exécutées ou omises ?',
    signals: [/adherence|omission|prescribed|program_practice/i]
  },
  {
    id: 'exercise_x_muscle',
    question: 'Une évolution individuelle modifie-t-elle la répartition collective ?',
    signals: [/muscle|share|ratio|repartition|push_pull/i]
  },
  {
    id: 'frequency_x_volume',
    question: 'Le volume change-t-il par fréquence ou contenu ?',
    signals: [/volume|frequency|density|trajectory|quarter/i]
  },
  {
    id: 'load_x_sets_x_reps',
    question: 'Les conditions d’exécution restent-elles comparables ?',
    signals: [/load|resistance|sets|reps_comparable|progression/i]
  },
  {
    id: 'interruption_x_return',
    question: 'Quels éléments reviennent, à quel niveau et pour quelle durée ?',
    signals: [/return|reprise|interruption|gap|comeback|collective/i]
  },
  {
    id: 'sleep_x_activity',
    question: 'Existe-t-il une association documentée sur des populations appariées ?',
    signals: [/sleep/i]
  },
  {
    id: 'challenge_x_program',
    question: 'Quel rôle le défi joue-t-il dans la pratique globale ?',
    signals: [/challenge|défi|timed/i]
  }
]);

function discoveryKind(d) {
  return String(d?.kind || d?.discovery?.kind || '');
}

function matchRelation(rel, discoveries) {
  const hits = (discoveries || []).filter((d) => rel.signals.some((re) => re.test(discoveryKind(d))));
  return hits;
}

/**
 * Matrice orientée valeur informative — pas un produit cartésien aveugle.
 */
export function buildCoverageMatrix({
  discoveries = [],
  graph = null,
  assessments = [],
  reviewDecisions = []
} = {}) {
  const pass4 = (reviewDecisions || []).filter((d) => d.action === 'targeted_reexplore');
  const rows = COVERAGE_RELATIONS.map((rel) => {
    const hits = matchRelation(rel, discoveries);
    const graphRelevant =
      rel.id === 'exercise_x_session' ||
      rel.id === 'session_x_variant' ||
      rel.id === 'exercise_x_muscle';
    const graphHas =
      graphRelevant &&
      graph?.available &&
      Array.isArray(graph.relations) &&
      graph.relations.some((r) =>
        /shared_movement|shared_muscle|variant|complement/i.test(String(r.type || ''))
      );

    let status;
    let method = null;
    let abstention = null;
    if (hits.length > 0) {
      const conclusive = hits.filter(
        (d) =>
          (d?.body || d?.title || d?.claim) &&
          (d?.disposition === 'priority' ||
            d?.p6Disposition === 'priority' ||
            d?.metrics?.composition ||
            d?.exploration?.coverage === 'concluded')
      );
      // kind compatible ≠ méthode exécutée / conclusion publiée
      status = conclusive.length
        ? 'tested_with_candidate'
        : hits.some((d) => d?.body || d?.title)
          ? 'candidate_kind_present_not_elevated'
          : 'tested_non_conclusive';
      method = `kinds:${[...new Set(hits.map(discoveryKind))].slice(0, 6).join(',')}`;
    } else if (graphHas && (rel.id === 'exercise_x_session' || rel.id === 'exercise_x_muscle')) {
      status = 'data_present_not_elevated';
      method = 'sessionStructureGraph.relations';
      abstention = 'relation_in_graph_not_published_as_discovery';
    } else if (
      rel.id === 'prescribed_x_realized' &&
      (assessments || []).length > 0 &&
      !(assessments || []).some((a) => a && !a.abstained && a.omissionCallable)
    ) {
      status = 'examined_abstained';
      method = 'program_adherence_assessments';
      abstention = 'no_callable_omission_in_window';
    } else if (rel.id.startsWith('sleep') || rel.id.includes('challenge')) {
      status = 'applicability_data_dependent';
      method = null;
      abstention = 'requires_paired_population';
    } else {
      status = 'never_tested';
      abstention = 'no_producer_or_trigger_in_window';
    }

    const reexplored = pass4.filter((d) =>
      rel.signals.some((re) => re.test(String(d?.kind || d?.targetKind || '')))
    );

    return {
      relation: rel.id,
      question: rel.question,
      applicability: status === 'applicability_data_dependent' ? 'conditional' : 'in_scope',
      status,
      /** tested_non_conclusive ≠ never_tested */
      methodExecuted: method,
      candidatesExamined: hits.length,
      hypothesesPlausible: hits.slice(0, 3).map((d) => d?.title || discoveryKind(d)),
      conclusions: hits
        .filter((d) => d?.disposition === 'priority' || d?.p6Disposition === 'priority')
        .map((d) => d?.id || discoveryKind(d))
        .slice(0, 5),
      abstentionReason: abstention,
      pass4Touches: reexplored.length,
      limits:
        status === 'never_tested'
          ? 'Relation jamais recherchée dans cette fenêtre — pas une preuve d’absence de phénomène'
          : status === 'tested_non_conclusive'
            ? 'Relation testée sans conclusion publiable'
            : null
    };
  });

  return {
    schema: 'momentum.underexplorationCoverageMatrix.v1',
    rows,
    summary: {
      neverTested: rows.filter((r) => r.status === 'never_tested').length,
      testedWithCandidate: rows.filter((r) => r.status === 'tested_with_candidate').length,
      testedNonConclusive: rows.filter((r) => r.status === 'tested_non_conclusive').length,
      dataPresentNotElevated: rows.filter((r) => r.status === 'data_present_not_elevated').length,
      examinedAbstained: rows.filter((r) => r.status === 'examined_abstained').length
    }
  };
}

export function buildUnderexplorationReport({
  discoveries = [],
  reviewDecisions = [],
  graph = null,
  assessments = [],
  voiceKey = null
} = {}) {
  const underExplored = [];
  const impossible = [];
  const abstentions = [];
  const unusedRelations = [];
  const pass4 = (reviewDecisions || []).filter((d) => d.action === 'targeted_reexplore');

  (discoveries || []).forEach((d) => {
    const cov = d?.exploration?.coverage || d?.metrics?.exploration?.coverage;
    const kind = d?.kind || d?.discovery?.kind;
    if (cov === 'under_explored') {
      underExplored.push({
        kind,
        id: d?.id || d?.occurrenceId || null,
        title: d?.title || d?.discovery?.title || null,
        reason: 'coverage_under_explored',
        class: 'opportunity_unused'
      });
    } else if (cov === 'method_unavailable' || cov === 'no_data') {
      impossible.push({
        kind,
        id: d?.id || null,
        title: d?.title || null,
        reason: cov,
        class: 'hypothesis_indemonstrable'
      });
    }
  });

  if (graph?.available && Array.isArray(graph.relations)) {
    const usedTypes = new Set(
      (discoveries || [])
        .filter((d) => /session_family|program_structure/i.test(String(d?.kind || '')))
        .map((d) => d?.metrics?.relationType)
        .filter(Boolean)
    );
    graph.relations.forEach((rel) => {
      if (
        !usedTypes.has(rel.type) &&
        (rel.type === 'shared_movement' || rel.type === 'shared_muscle_exposure')
      ) {
        unusedRelations.push({
          type: rel.type,
          left: rel.left,
          right: rel.right,
          certainty: rel.certainty,
          class: 'relation_not_examined_as_discovery',
          note: 'Relation détectée dans le graphe, pas élevée en conclusion autonome'
        });
      }
    });
  }

  const callable = (assessments || []).filter((a) => a && !a.abstained && a.omissionCallable);
  if (callable.length === 0 && (assessments || []).length > 0) {
    abstentions.push({
      family: 'program_adherence',
      reason: 'no_callable_omission_in_window',
      class: 'data_insufficient_or_day_open'
    });
  }

  const coverageMatrix = buildCoverageMatrix({
    discoveries,
    graph,
    assessments,
    reviewDecisions
  });

  const lifecycleLanes = {
    data_unavailable: impossible.filter((x) => x.reason === 'no_data').length,
    relation_not_applicable: abstentions.length,
    applicable_never_executed: coverageMatrix.summary.neverTested,
    explored_no_conclusion:
      coverageMatrix.summary.testedNonConclusive + coverageMatrix.summary.dataPresentNotElevated,
    hypothesis_rejected_insufficient_proof: impossible.filter(
      (x) => x.reason === 'method_unavailable'
    ).length,
    conclusion_produced: coverageMatrix.summary.testedWithCandidate,
    validated_not_selected: coverageMatrix.rows.filter(
      (r) => r.status === 'candidate_kind_present_not_elevated'
    ).length,
    published: coverageMatrix.rows.reduce((n, r) => n + (r.conclusions?.length || 0), 0)
  };

  return {
    schema: 'momentum.underexplorationReport.v3',
    voiceKey,
    underExplored,
    impossible,
    unusedRelations: unusedRelations.slice(0, 40),
    abstentions,
    pass4Decisions: pass4,
    coverageMatrix,
    /** Distingue absence de candidat ≠ relation correctement explorée */
    lifecycleLanes,
    potentialCrossings: COVERAGE_RELATIONS.map((rel) => ({
      id: rel.id,
      question: rel.question,
      note: 'Croisement potentiel — ne pas inférer exécution sans methodExecuted'
    })),
    summary: {
      opportunityUnused: underExplored.length,
      indemonstrable: impossible.length,
      relationsNotElevated: unusedRelations.length,
      reexploreActions: pass4.length,
      coverageNeverTested: coverageMatrix.summary.neverTested,
      coverageTested: coverageMatrix.summary.testedWithCandidate,
      lifecycle: lifecycleLanes
    },
    limit:
      'Une occasion non exploitée ≠ une hypothèse fausse. Une hypothèse indemonstrable ≠ une omission de qualité. tested_non_conclusive ≠ never_tested. Absence de candidat ≠ relation correctement explorée.'
  };
}
