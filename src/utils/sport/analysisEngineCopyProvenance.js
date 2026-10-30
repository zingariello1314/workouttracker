/**
 * Provenance rédactionnelle d’un candidat — explique COMMENT le titre/texte
 * ont été obtenus (producteur → porte éditoriale → sélection), et quels
 * chiffres des metrics alimentent quelles phrases.
 */

const KIND_PIPELINES = {
  disc_ms_return: {
    producer: 'recapMilestoneEngine.detectRecapMilestones',
    path: [
      'Historique séances (catalog / checkedExercises+reps)',
      'Calcul gap vs intervalle médian habituel',
      'Template reprise (phraseTuViensDe + volume vs moyenne)',
      'Porte éditoriale (rewrite titre « revient après un long silence »)',
      'Essai horizon / sélection colonnes'
    ],
    editorial: [
      {
        id: 'rewrite_ms_return_title',
        module: 'recapEditorialGate.rewrite',
        effect:
          'Titre d’origine « Tu reprends {exo} après N jours » → « {exo} revient après un long silence »'
      },
      {
        id: 'strip_guards',
        module: 'recapEditorialGate.stripGuards',
        effect:
          'Retire les phrases de garde (ex. « Ce volume mesure l’ampleur de la reprise… ») si présentes dans GUARD'
      },
      {
        id: 'nature_now',
        module: 'recapEditorialGate.rewrite',
        effect: 'nature forcée à « now »'
      }
    ]
  },
  disc_ms_return_run: {
    producer: 'recapMilestoneEngine.detectRecapMilestones',
    path: [
      'Timeline courses Garmin / snapshot',
      'Gap vs intervalle course habituel',
      'Template reprise course',
      'Sélection'
    ],
    editorial: []
  },
  disc_ms_return_gtg: {
    producer: 'recapMilestoneEngine.detectRecapMilestones',
    path: ['Historique GTG', 'Gap vs médiane GTG', 'Template reprise GTG', 'Sélection'],
    editorial: []
  },
  disc_ms_return_durable: {
    producer: 'recapMilestoneEngine.pushReturnDurableMilestones',
    path: [
      'Reprises précédentes + suivi séances suivantes',
      'Jugement durabilité de la reprise',
      'Template trajectoire',
      'Sélection'
    ],
    editorial: []
  },
  disc_exercise_progress: {
    producer: 'recapPeriodDiscoveries + exerciseTrajectoryAnalysis',
    path: [
      'buildExerciseBaseline (moyennes) + buildExerciseTrajectory (séances / sets / témoins)',
      'Forme de trajectoire + mécanisme séries si set logs structurés',
      'Comparaison famille movementFamily',
      'renderExerciseTrajectoryCopy → porte éditoriale (titre conservé si trajectoryOk)',
      'Sélection'
    ],
    editorial: [
      {
        id: 'rewrite_progress_title',
        module: 'recapEditorialGate.rewrite',
        effect: 'Titre haut/bas seulement si metrics.trajectoryOk est absent'
      }
    ]
  },
  disc_emergence: {
    producer: 'recapPeriodDiscoveries + exerciseTrajectoryAnalysis',
    path: [
      'firstSeen / returning dans la fenêtre',
      'buildExerciseTrajectory (installation, sets, prev fenêtre)',
      'renderExerciseTrajectoryCopy (+ ancrage groupe musculaire)',
      'Sélection'
    ],
    editorial: []
  },
  disc_volume_shape: {
    producer: 'recapPeriodDiscoveries.detectDiscoveries',
    path: [
      'Agrégats période (totalReps, trainingDays, rates)',
      'Comparaison baseline précédente si disponible',
      'Template volume/rythme',
      'Porte éditoriale (nettoyage jargon)',
      'Sélection'
    ],
    editorial: [
      {
        id: 'clean_volume_shape',
        module: 'recapEditorialGate.rewrite',
        effect: 'Supprime « Répartition identifiée » / « pic relativisé »'
      }
    ]
  },
  disc_best_month: {
    producer: 'recapPeriodDiscoveries.bestCalendarMonths',
    path: [
      'repsByDate → agrégation mensuelle',
      'Choix du mois dominant (share / écart)',
      'Template concentration mensuelle',
      'Sélection'
    ],
    editorial: []
  },
  disc_peak_day: {
    producer: 'recapPeriodDiscoveries.detectDiscoveries',
    path: ['Jour max volume fenêtre', 'Part du total période', 'Template pic', 'nature→now'],
    editorial: [
      {
        id: 'nature_peak_now',
        module: 'recapEditorialGate.rewrite',
        effect: 'nature forcée à « now »'
      }
    ]
  },
  disc_gtg_unplanned_now: {
    producer: 'recapGtgUnplannedReading.buildNowCard',
    path: [
      'GTG days + plan du jour',
      'Jugement rôle (only/catchup/stacked/surplus)',
      'Template hors-planning',
      'Sélection'
    ],
    editorial: []
  },
  disc_gtg_unplanned_role: {
    producer: 'recapGtgUnplannedReading.buildContinuityCard',
    path: ['Historique mini-sets ad hoc', 'Rôles répétés', 'Template trajectoire GTG'],
    editorial: []
  },
  disc_gtg_unplanned_progress: {
    producer: 'recapGtgUnplannedReading.buildJourneyCard',
    path: ['Parcours GTG long', 'Progression / stagnation', 'Template journey'],
    editorial: []
  },
  disc_sleep_assoc: {
    producer: 'recapPeriodDiscoveries + sleep candidates',
    path: [
      'Paires nuit × séance',
      'Comparaison nuits longues vs courtes',
      'Template association',
      'Rewrite éventuel titre « journées lourdes / nuit longue »'
    ],
    editorial: [
      {
        id: 'rewrite_sleep_assoc_730',
        module: 'recapEditorialGate.rewrite',
        effect: 'Si body mentionne 7 h 30 + reps → titre « Les journées lourdes suivent plus souvent une nuit longue »'
      }
    ]
  },
  disc_muscle_reorient: {
    producer: 'recapPeriodDiscoveries.detectDiscoveries',
    path: ['Parts musculaires période', 'Comparaison mois', 'Rewrite titre stimulus'],
    editorial: [
      {
        id: 'rewrite_muscle_reorient',
        module: 'recapEditorialGate.rewrite',
        effect: 'Titre forcé + nature journey + coupe phrase asymétrie'
      }
    ]
  },
  disc_structural_memory: {
    producer: 'recapPeriodDiscoveries.detectDiscoveries',
    path: ['Exercice émergent vs période précédente', 'Rewrite titre place nouvelle'],
    editorial: [
      {
        id: 'rewrite_structural_memory',
        module: 'recapEditorialGate.rewrite',
        effect: 'Titre « prend une place… » + adoucit la phrase fréquence/habitude'
      }
    ]
  }
};

const GENERIC_PIPELINE = {
  producer: 'pipeline discoveries / essays',
  path: [
    'Données snapshot / Garmin',
    'Découverte ou essai horizon',
    'Porte éditoriale éventuelle',
    'Validation + sélection colonnes'
  ],
  editorial: [
    {
      id: 'polish',
      module: 'recapHorizonEssays.polish',
      effect: 'Normalisation espaces / ponctuation sur le body des readings'
    },
    {
      id: 'soft_title',
      module: 'recapCardKinship.softenTitle',
      effect: 'Adoucit les titres trop causaux si le corps est plus prudent'
    },
    {
      id: 'strip_title_echo',
      module: 'recapAdaptiveInsights.stripTitleEcho',
      effect: 'Retire le titre répété en tête du body à l’affichage insight'
    }
  ]
};

function catalogForKind(kind) {
  if (!kind) return GENERIC_PIPELINE;
  if (KIND_PIPELINES[kind]) return KIND_PIPELINES[kind];
  if (String(kind).startsWith('disc_ms_')) {
    return {
      producer: 'recapMilestoneEngine',
      path: [
        'Historique séances / events',
        'Détection jalon (seuil, première, cumul…)',
        'Template jalon',
        'Porte éditoriale éventuelle',
        'Sélection'
      ],
      editorial: []
    };
  }
  if (String(kind).startsWith('disc_sleep_')) {
    return {
      producer: 'recapPeriodDiscoveries / sleep',
      path: ['Nuits Garmin', 'Agrégats / associations', 'Template sommeil', 'Sélection'],
      editorial: []
    };
  }
  if (String(kind).startsWith('disc_gtg_')) {
    return {
      producer: 'recapGtgUnplannedReading',
      path: ['GTG days', 'Jugement', 'Template', 'Sélection'],
      editorial: []
    };
  }
  if (String(kind).startsWith('disc_')) {
    return {
      producer: 'recapPeriodDiscoveries.detectDiscoveries',
      path: [
        'Comparaisons période / baselines',
        'Template découverte',
        'Porte éditoriale éventuelle',
        'Projection reading → sélection'
      ],
      editorial: []
    };
  }
  return GENERIC_PIPELINE;
}

function mergeMetrics(row, discoveryMatch) {
  return {
    ...(discoveryMatch?.metrics || {}),
    ...(row?.interpretation?.metrics || {}),
    ...(row?.metrics || {})
  };
}

function normText(s) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Reconstruit le titre producteur quand le brouillon n’a pas survécu au match. */
function reconstructDraftTitle(kind, metrics, finalTitle) {
  const name = metrics.exerciseName || metrics.name || null;
  const gap = metrics.gapDays ?? metrics.gap ?? null;
  if (kind === 'disc_ms_return' && name && gap != null) {
    return `Tu reprends ${name} après ${Math.round(Number(gap))} jours d'absence`;
  }
  if (kind === 'disc_ms_return_run' && gap != null) {
    return `Tu reprends la course après ${Math.round(Number(gap))} jours`;
  }
  if (kind === 'disc_exercise_progress' && name && metrics.vsInitialPct != null) {
    const up = Number(metrics.vsInitialPct) >= 0;
    return up
      ? `${name} a progressé`
      : `${name} a reculé`;
  }
  // Si le titre final ressemble déjà à un rewrite, ne pas inventer
  if (finalTitle && /revient après un long silence/i.test(finalTitle) && name) {
    return `Tu reprends ${name} après ${gap != null ? Math.round(Number(gap)) : '?'} jours d'absence`;
  }
  return null;
}

/** Détecte dans le texte les valeurs numériques et les relie aux metrics. */
function bindNumericSlots(text, metrics) {
  const bindings = [];
  if (!text || !metrics) return bindings;
  const push = (label, value, why) => {
    if (value == null || value === '') return;
    const str = String(value);
    if (str.length < 1) return;
    const present =
      text.includes(str) ||
      text.includes(str.replace('.', ',')) ||
      (typeof value === 'number' &&
        (text.includes(String(Math.round(value))) ||
          text.includes(String(Math.round(value * 10) / 10).replace('.', ',')) ||
          text.includes(value.toFixed?.(1)?.replace('.', ',') || '')));
    bindings.push({
      slot: label,
      value: typeof value === 'number' && !Number.isInteger(value) ? Math.round(value * 100) / 100 : value,
      inText: Boolean(present),
      why
    });
  };

  push('gapDays', metrics.gapDays ?? metrics.gap, 'Écart calendaire entre dernière séance avant silence et reprise');
  push('habitMedianGap', metrics.habitMedianGap, 'Intervalle médian habituel entre séances de cet exo');
  push('habitIntervalRatio', metrics.habitIntervalRatio ?? metrics.ratio, 'gap / intervalle médian habituel');
  push('returnReps', metrics.returnReps, 'Volume de la séance de reprise');
  push('priorAvg', metrics.priorAvg, 'Moyenne des séances avant interruption');
  push('vsPriorPct', metrics.vsPriorPct, 'returnReps / priorAvg × 100');
  push('vsInitialPct', metrics.vsInitialPct, 'Écart niveau actuel vs premières séances');
  push('historicalMean', metrics.historicalMean, 'Moyenne des premières séances');
  push('currentMean', metrics.currentMean, 'Moyenne des dernières séances');
  push('totalReps', metrics.totalReps, 'Volume total fenêtre');
  push('trainingDays', metrics.trainingDays, 'Jours entraînés fenêtre');
  push('volPct', metrics.volPct, 'Variation volume vs baseline');
  push('peakReps', metrics.peakReps, 'Reps du jour pic');
  push('sharePct', metrics.sharePct ?? metrics.share, 'Part du volume');
  push('date', metrics.date || metrics.peakDate, 'Date événement principal');
  push('prevDate', metrics.prevDate, 'Date de référence / avant silence');
  push('exerciseName', metrics.exerciseName || metrics.name, 'Nom d’exercice dans le texte');
  push('unit', metrics.unit, 'Unité (reps / seconds)');

  (metrics.mates || []).forEach((m, i) => {
    if (!m) return;
    push(`mates[${i}].reps`, m.reps, `Companion même jour : ${m.name || m.id || i}`);
    push(`mates[${i}].name`, m.name, 'Nom companion même muscle / même jour');
  });

  return bindings;
}

function detectTitleTransform(kind, draftTitle, finalTitle) {
  if (!draftTitle || !finalTitle) return null;
  if (normText(draftTitle) === normText(finalTitle)) {
    return { changed: false, from: draftTitle, to: finalTitle, likelyRule: null };
  }
  return {
    changed: true,
    from: draftTitle,
    to: finalTitle,
    likelyRule:
      kind === 'disc_ms_return'
        ? 'recapEditorialGate.rewrite (disc_ms_return)'
        : kind === 'disc_exercise_progress'
          ? 'recapEditorialGate.rewrite (disc_exercise_progress)'
          : kind === 'disc_muscle_reorient'
            ? 'recapEditorialGate.rewrite (disc_muscle_reorient)'
            : kind === 'disc_structural_memory'
              ? 'recapEditorialGate.rewrite (disc_structural_memory)'
              : 'rewrite / softenTitle / polish'
  };
}

function extractClaims(body) {
  return String(body || '')
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 24)
    .slice(0, 12)
    .map((sentence, i) => ({
      index: i + 1,
      sentence,
      hasNumber: /\d/.test(sentence),
      hedges: /associ|observ|mesure|pas (une|un) (cause|preuve)|si\b/i.test(sentence)
        ? 'prudent'
        : /prouve|causé|démontre/i.test(sentence)
          ? 'assertif'
          : 'neutre'
    }));
}

/**
 * @param {object} row — candidat annoté
 * @param {object|null} discoveryMatch
 */
export function buildCopyProvenance(row, discoveryMatch = null) {
  const kind = row?.kind || discoveryMatch?.kind || '';
  const catalog = catalogForKind(kind);
  const metrics = mergeMetrics(row, discoveryMatch);
  const ctx = row?.interpretation?.context || row?.context || {};

  const finalTitle = row?.title || ctx.title || '';
  const finalBody = row?.body || ctx.body || '';

  let draftTitle =
    metrics.draftTitle ||
    discoveryMatch?.metrics?.draftTitle ||
    null;
  let draftBody =
    metrics.draftBody ||
    discoveryMatch?.metrics?.draftBody ||
    null;

  // Ne pas prendre discoveryMatch.title s’il est déjà le titre final (post-gate)
  if (!draftTitle && discoveryMatch?.title && normText(discoveryMatch.title) !== normText(finalTitle)) {
    draftTitle = discoveryMatch.title;
  }
  if (!draftBody && discoveryMatch?.body && normText(discoveryMatch.body) !== normText(finalBody)) {
    draftBody = discoveryMatch.body;
  }

  // Reconstruire le brouillon jalon si l’instrumentation n’a pas survécu au match
  if (!draftTitle || normText(draftTitle) === normText(finalTitle)) {
    const reconstructed = reconstructDraftTitle(kind, metrics, finalTitle);
    if (reconstructed && normText(reconstructed) !== normText(finalTitle)) {
      draftTitle = reconstructed;
    }
  }

  const titleTransform = detectTitleTransform(kind, draftTitle, finalTitle);
  const bodyChanged =
    draftBody && finalBody ? normText(draftBody) !== normText(finalBody) : null;

  const slots = bindNumericSlots(`${finalTitle}\n${finalBody}`, metrics);
  const unbound = slots.filter((s) => !s.inText);
  const bound = slots.filter((s) => s.inText);

  const claims = extractClaims(finalBody);

  const sessionCount = (metrics.dates || metrics.sessions || metrics.daysDetail || []).length;
  const steps = [
    {
      id: 'source_data',
      label: 'Données sources',
      detail:
        sessionCount > 0
          ? `${sessionCount} date(s)/séance(s) attachées aux metrics (couches 1–2)`
          : metrics.gapDays != null || metrics.returnReps != null
            ? 'Agrégats présents (gap/volume) — listes dates à vérifier couches 1–2'
            : 'Voir couches 1–2 (bruts / groupes)'
    },
    {
      id: 'producer',
      label: 'Producteur',
      detail: catalog.producer
    },
    {
      id: 'draft',
      label: 'Brouillon découverte',
      detail: draftTitle
        ? `Titre brouillon : « ${draftTitle} »`
        : 'Brouillon non conservé séparément (titre final = titre producteur ou rewrite immédiat)'
    },
    {
      id: 'editorial',
      label: 'Porte éditoriale',
      detail:
        (catalog.editorial || []).length
          ? (catalog.editorial || []).map((e) => e.effect).join(' · ')
          : 'Pas de rewrite spécifique documenté pour ce kind (polish / soften génériques possibles)'
    },
    {
      id: 'final',
      label: 'Texte final affiché',
      detail: `nature=${row?.nature || ctx.nature || '—'} · tone=${ctx.rewardTone || row?.rewardTone || '—'} · horizon=${row?.horizon || '—'} · stage=${row?.stage || row?.generationStage || '—'}`
    }
  ];

  return {
    kind,
    producer: catalog.producer || row?.moduleHint || row?.producerHint || null,
    path: catalog.path || GENERIC_PIPELINE.path,
    editorialRules: [...(catalog.editorial || []), ...GENERIC_PIPELINE.editorial],
    steps,
    draft: {
      title: draftTitle,
      body: draftBody
    },
    final: {
      title: finalTitle,
      body: finalBody
    },
    titleTransform,
    bodyChanged,
    rewardTone: ctx.rewardTone || row?.rewardTone || null,
    nature: row?.nature || ctx.nature || null,
    generationStage: row?.stage || row?.generationStage || null,
    horizon: row?.horizon || null,
    slots,
    slotsBound: bound,
    slotsUnbound: unbound,
    claims,
    qualityFlags: row?.quality?.flags || [],
    quality: row?.quality || null,
    mates: metrics.mates || [],
    note:
      'Les slots « dans le texte » relient chiffres metrics ↔ phrases. Un slot absent du texte peut être OK (calcul interne) ou signaler une dérive rédactionnelle. Corrige le wording seulement si les couches 1–4 valident l’événement.'
  };
}
