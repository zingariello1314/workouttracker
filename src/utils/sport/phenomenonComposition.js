/**
 * Composition multi-phénomènes (Mission 12).
 * Relie des faits déjà produits en une lecture unique — sans détecteur ad hoc par exercice.
 */

import { symmetricDecomposition, formatRepDelta } from './volumeChangeDecomposition';

function fmtInt(n) {
  return Math.round(Number(n) || 0).toLocaleString('fr-FR');
}

function fmtPct(n) {
  if (!Number.isFinite(Number(n))) return null;
  const r = Math.round(Number(n) * 10) / 10;
  return `${r > 0 ? '+' : ''}${r} %`;
}

/**
 * Enrichit un retour collectif avec rythme de réinstallation des formats
 * lorsque les volumes antérieurs / courants sont documentés.
 */
export function composeCollectiveReturnReading({
  namedMoves = [],
  dates = [],
  confirmationDates = [],
  spanDays = 0,
  families = [],
  sessionFamilyLinked = false,
  readingMode = 'return',
  baseConclusion = null
} = {}) {
  const moves = (namedMoves || []).filter((m) => m?.name);
  // Mission 14 : 2 mouvements suffisent si lien de séance/famille documenté ; sinon ≥ 3
  const linked = Boolean(sessionFamilyLinked) || (families || []).filter(Boolean).length >= 1;
  if (moves.length < 2 || (moves.length < 3 && !linked)) {
    return {
      coverage: 'under_explored',
      conclusion: null,
      role: 'insufficient'
    };
  }

  const withLevels = moves.filter(
    (m) =>
      Number.isFinite(Number(m.prevReps)) &&
      Number.isFinite(Number(m.currentReps)) &&
      Number(m.prevReps) > 0
  );
  const full = withLevels.filter((m) => Number(m.currentReps) >= Number(m.prevReps) * 0.9);
  const partial = withLevels.filter((m) => Number(m.currentReps) < Number(m.prevReps) * 0.9);

  const returnDate = dates.length ? dates[0] : null;
  const confDates = (confirmationDates || []).filter(Boolean);
  const weeksLabel =
    moves[0]?.gapDays != null
      ? `après environ ${Math.round(Number(moves[0].gapDays) / 7)} semaines d’interruption`
      : null;

  const fromMoves = moves.flatMap((m) =>
    Array.isArray(m.muscleGroups) && m.muscleGroups.length
      ? m.muscleGroups
      : m.muscleGroup
        ? [m.muscleGroup]
        : []
  );
  const uniqueFamilies = [
    ...new Set(
      [...(families || []), ...fromMoves]
        .map(String)
        .filter((g) => g && !/^full[_ ]?body$/i.test(g))
    )
  ];
  const familyBit =
    uniqueFamilies.length >= 3
      ? `Les groupes musculaires documentés pour ces mouvements : ${uniqueFamilies.join(', ')} — la séance n’est pas réduite à un seul groupe.`
      : uniqueFamilies.length >= 1
        ? `Groupes musculaires documentés : ${uniqueFamilies.join(', ')}.`
        : sessionFamilyLinked
          ? 'Ces retours appartiennent à une même organisation de séance documentée.'
          : null;

  const formatBit =
    withLevels.length >= 2
      ? [
          full.length
            ? `${full.length} mouvement${full.length > 1 ? 's' : ''} retrouvent un volume proche de leur niveau antérieur (${full
                .slice(0, 3)
                .map((m) => m.name)
                .join(', ')}${full.length > 3 ? '…' : ''}).`
            : null,
          partial.length
            ? `${partial.length} restent encore en retrait (${partial
                .slice(0, 3)
                .map((m) => `${m.name} : ${fmtInt(m.currentReps)} vs ${fmtInt(m.prevReps)}`)
                .join(' ; ')}).`
            : null,
          'Le phénomène porte sur la réorganisation d’une famille de travail, pas seulement sur la progression indépendante de chaque exercice.'
        ]
          .filter(Boolean)
          .join(' ')
      : 'Les formats antérieurs ne sont pas tous documentés : la lecture reste limitée à la simultanéité et au lien structurel.';

  const gaps = moves
    .map((m) => Number(m.gapDays))
    .filter((n) => Number.isFinite(n) && n > 0);
  const gapBit = gaps.length
    ? `Les interruptions documentées vont de ${Math.min(...gaps)} à ${Math.max(...gaps)} jours.`
    : null;

  const moveList = `${moves
    .slice(0, 9)
    .map((m) => m.name)
    .join(', ')}${moves.length > 9 ? `… (${moves.length} au total)` : ''}`;

  let lead = null;
  if (readingMode === 'confirmation' && returnDate && confDates.length) {
    lead = `La reprise de cette composante de tes séances, commencée le ${returnDate}${
      weeksLabel ? ` ${weeksLabel}` : ''
    }, se confirme le ${confDates[0]} : ${moveList}.`;
  } else if (returnDate) {
    lead = `Une composante de ton entraînement se réinstalle autour du ${returnDate}${
      weeksLabel ? `, ${weeksLabel}` : ''
    } : ${moveList}.`;
  } else {
    lead = `Une composante de ton entraînement se réinstalle : ${moveList}.`;
  }

  const confirmationBit =
    readingMode === 'confirmation'
      ? null
      : confDates.length
        ? `Les séances ultérieures (${confDates.join(', ')}) permettent de distinguer une reprise ponctuelle d’une réinstallation progressive.`
        : 'Une seule date de retour est documentée : la confirmation sur les séances suivantes reste à observer.';

  const conclusion = [lead, familyBit, gapBit, formatBit, confirmationBit, baseConclusion ? null : null]
    .filter(Boolean)
    .join(' ');

  return {
    coverage: 'concluded',
    conclusion,
    role: 'composed_collective_return',
    readingMode,
    stats: {
      moveCount: moves.length,
      spanDays,
      returnDate,
      confirmationDates: confDates,
      fullRecoveryCount: full.length,
      partialRecoveryCount: partial.length,
      levelsDocumented: withLevels.length,
      gapMin: gaps.length ? Math.min(...gaps) : null,
      gapMax: gaps.length ? Math.max(...gaps) : null
    }
  };
}

/**
 * Décomposition volume : fréquence vs contenu — conclusion composée prioritaire.
 */
export function composeVolumeFrequencyContentReading({
  repsBefore,
  repsAfter,
  daysBefore,
  daysAfter,
  labelBefore = 'premier bloc',
  labelAfter = 'second bloc'
} = {}) {
  const split = symmetricDecomposition(
    { sessions: daysBefore, reps: repsBefore },
    { sessions: daysAfter, reps: repsAfter }
  );
  if (!split.ok) {
    return { coverage: 'no_data', conclusion: null, decomposition: split };
  }

  const volPct = split.volumePct;
  const freqLed = Math.abs(split.frequency) >= Math.abs(split.content) * 1.2;
  const contentLed = Math.abs(split.content) >= Math.abs(split.frequency) * 1.2;
  const contrast =
    (volPct < -5 && split.contentPct > 5) || (volPct > 5 && split.contentPct < -5);

  let driver;
  if (contrast && volPct < 0 && split.contentPct > 0) {
    driver =
      'Le volume total baisse alors que le contenu moyen des journées actives augmente : la baisse vient surtout d’une fréquence plus faible, pas d’un allègement des séances.';
  } else if (contrast && volPct > 0 && Math.abs(split.contentPct) < 3) {
    driver =
      'Le volume monte surtout parce que tu ajoutes des journées actives ; le contenu moyen par journée reste quasiment inchangé.';
  } else if (freqLed) {
    driver = `La variation s’explique surtout par la fréquence (${fmtPct(split.frequencyPct)} de jours actifs), pas par le contenu des séances (${fmtPct(split.contentPct)}).`;
  } else if (contentLed) {
    driver = `La variation s’explique surtout par le contenu des journées actives (${fmtPct(split.contentPct)}), alors que la fréquence bouge moins (${fmtPct(split.frequencyPct)}).`;
  } else {
    driver = `Fréquence (${fmtPct(split.frequencyPct)}) et contenu (${fmtPct(split.contentPct)}) contribuent tous les deux.`;
  }

  const conclusion = [
    `${labelBefore} : ${fmtInt(repsBefore)} répétitions en ${daysBefore} journées de renforcement (≈${fmtInt(split.repsPerSessionBefore)} / journée).`,
    `${labelAfter} : ${fmtInt(repsAfter)} répétitions en ${daysAfter} journées de renforcement (≈${fmtInt(split.repsPerSessionAfter)} / journée).`,
    `Écart total ${fmtPct(volPct)} — contribution fréquence ${formatRepDelta(split.frequency)}, contenu ${formatRepDelta(split.content)}.`,
    driver
  ].join(' ');

  return {
    coverage: 'concluded',
    conclusion,
    title: contrast
      ? volPct < 0
        ? 'Volume en baisse, journées actives plus chargées'
        : 'Hausse de volume surtout fréquentielle'
      : freqLed
        ? 'Le volume suit surtout ta fréquence'
        : contentLed
          ? 'Le volume suit surtout le contenu des séances'
          : 'Fréquence et contenu co-expliquent le volume',
    decomposition: split,
    kind: 'disc_composed_volume_decomp'
  };
}

/**
 * Concentration relative : part locale vs part globale.
 */
/**
 * Concentration relative — sémantique des parts :
 * - moveShareOfParentWindow = reps(mouvements, fenêtre courte) / reps(mêmes mouvements, fenêtre large)
 *   ex. 180/360 = 50 % du volume mensuel de CES mouvements réalisé dans la semaine
 * - globalShareOfParentWindow = reps(total, fenêtre courte) / reps(total, fenêtre large)
 *   ex. 1340/6044 ≈ 22,2 % du volume mensuel global réalisé dans la semaine
 * Ne jamais verbaliser moveShare comme « % du volume de la semaine ».
 */
export function composeRelativeConcentrationReading({
  localReps,
  localShareOfPeriod,
  globalShareOfPeriod,
  moveNames = [],
  periodLabel = 'cette période',
  parentPeriodLabel = 'la période plus large',
  /** @deprecated alias — préférer les noms explicites ci-dessous */
  moveShareOfParentWindow = null,
  globalShareOfParentWindow = null,
  localRepsInParent = null,
  globalRepsShort = null,
  globalRepsParent = null
} = {}) {
  const local = Number(localReps);
  const moveShare = Number(
    moveShareOfParentWindow != null ? moveShareOfParentWindow : localShareOfPeriod
  );
  const globalShare = Number(
    globalShareOfParentWindow != null ? globalShareOfParentWindow : globalShareOfPeriod
  );
  if (![local, moveShare, globalShare].every((n) => Number.isFinite(n)) || globalShare <= 0) {
    return { coverage: 'no_data', conclusion: null };
  }
  const ratio = moveShare / globalShare;
  if (ratio < 1.4) {
    return { coverage: 'no_phenomenon', conclusion: null, ratio };
  }
  const names = (moveNames || []).filter(Boolean).slice(0, 4);
  const movePct = Math.round(moveShare * 1000) / 10;
  const globalPct = Math.round(globalShare * 1000) / 10;
  const parentMoveClause =
    localRepsInParent != null && Number.isFinite(Number(localRepsInParent))
      ? ` (${fmtInt(local)} / ${fmtInt(localRepsInParent)} reps de ces mouvements sur ${parentPeriodLabel})`
      : '';
  const globalClause =
    globalRepsShort != null &&
    globalRepsParent != null &&
    Number.isFinite(Number(globalRepsShort)) &&
    Number.isFinite(Number(globalRepsParent))
      ? ` (${fmtInt(globalRepsShort)} / ${fmtInt(globalRepsParent)} reps totales)`
      : '';
  const conclusion = [
    names.length
      ? `${names.join(', ')} totalisent ${fmtInt(local)} répétitions sur ${periodLabel}.`
      : `${fmtInt(local)} répétitions se concentrent sur un sous-ensemble de mouvements.`,
    `Cela représente environ ${movePct} % du volume de ces mouvements sur ${parentPeriodLabel}${parentMoveClause}, alors que ${periodLabel} ne porte que environ ${globalPct} % du volume total de ${parentPeriodLabel}${globalClause}.`,
    `Rapport des concentrations ≈${Math.round(ratio * 100) / 100}× : ces mouvements sont surreprésentés dans ${periodLabel} par rapport au volume général.`
  ].join(' ');

  return {
    coverage: 'concluded',
    conclusion,
    title: 'Concentration relative au-delà du volume général',
    kind: 'disc_composed_relative_concentration',
    ratio,
    metrics: {
      localReps: local,
      moveShareOfParentWindow: moveShare,
      globalShareOfParentWindow: globalShare,
      // aliases conservés pour compat
      localShare: moveShare,
      globalShare,
      ratio,
      meaning: {
        moveShare: `part du volume ${parentPeriodLabel} de ces mouvements réalisée pendant ${periodLabel}`,
        globalShare: `part du volume total ${parentPeriodLabel} réalisée pendant ${periodLabel}`,
        notMeaning: `pas la part de ces mouvements dans le volume de ${periodLabel}`
      }
    },
    facts: [
      {
        id: 'move_share_of_parent',
        numerator: local,
        denominator: localRepsInParent,
        value: moveShare,
        population: 'same_moves_nested_windows',
        meaning: `reps(${periodLabel})/reps(${parentPeriodLabel}) pour ces mouvements`
      },
      {
        id: 'global_share_of_parent',
        numerator: globalRepsShort,
        denominator: globalRepsParent,
        value: globalShare,
        population: 'all_reps_nested_windows',
        meaning: `reps totales(${periodLabel})/reps totales(${parentPeriodLabel})`
      }
    ]
  };
}

/**
 * Phase collective d’augmentation de charge à format stable.
 */
export function composeLoadProgressionPhase({ events = [] } = {}) {
  const rows = (events || []).filter(
    (e) =>
      e?.name &&
      Number.isFinite(Number(e.loadBefore ?? e.fromValue)) &&
      Number.isFinite(Number(e.loadAfter ?? e.toValue)) &&
      Number(e.loadAfter ?? e.toValue) > Number(e.loadBefore ?? e.fromValue)
  ).map((e) => ({
    ...e,
    loadBefore: Number(e.loadBefore ?? e.fromValue),
    loadAfter: Number(e.loadAfter ?? e.toValue),
    date: e.date || e.changeDate || null,
    referenceDate: e.referenceDate || e.fromDate || null
  }));
  if (rows.length < 3) {
    return { coverage: 'under_explored', conclusion: null };
  }
  const dates = [...new Set(rows.map((r) => String(r.date || '').slice(0, 10)).filter(Boolean))].sort();
  const refDates = [...new Set(rows.map((r) => String(r.referenceDate || '').slice(0, 10)).filter(Boolean))].sort();
  const span =
    dates.length >= 2
      ? Math.round(
          (new Date(`${dates[dates.length - 1]}T12:00:00`) - new Date(`${dates[0]}T12:00:00`)) /
            86400000
        )
      : 0;
  if (dates.length >= 2 && span > 45) {
    return {
      coverage: 'under_explored',
      conclusion: null,
      reason: 'load_raises_too_spread'
    };
  }
  const byCanonical = new Map();
  rows.forEach((r) => {
    const key = String(r.exerciseId || r.canonicalId || r.name).toLowerCase();
    if (!byCanonical.has(key)) byCanonical.set(key, []);
    byCanonical.get(key).push(r);
  });
  const exerciseCount = byCanonical.size;
  const eventCount = rows.length;
  const formatStable = rows.filter((r) => r.formatStable !== false);
  const list = [...byCanonical.entries()]
    .slice(0, 6)
    .map(([key, evs]) => {
      const first = evs[0];
      const last = evs[evs.length - 1];
      const label = first.name || key;
      if (evs.length === 1) {
        return `${label} (${first.loadBefore} → ${first.loadAfter} kg)`;
      }
      return `${label} (${first.loadBefore} → ${last.loadAfter} kg, ${evs.length} hausses)`;
    })
    .join(', ');
  const changeWindow =
    dates.length > 0
      ? `Changements observés ${dates[0]}${dates.length > 1 ? `–${dates[dates.length - 1]}` : ''}`
      : 'Phase courte';
  const refClause =
    refDates.length && refDates[0] < (dates[0] || '9999')
      ? ` Les charges de référence remontent au moins à ${refDates[0]} : la phase ne commence pas au premier jour de hausse sélectionné.`
      : '';
  const conclusion = [
    `${eventCount} hausses de charge sur ${exerciseCount} exercice${exerciseCount > 1 ? 's' : ''} distinct${exerciseCount > 1 ? 's' : ''} (${changeWindow}) : ${list}${exerciseCount > 6 ? '…' : ''}.${refClause}`,
    formatStable.length >= Math.ceil(rows.length * 0.6)
      ? 'Pour la majorité, le format de séries/répétitions reste comparable : la progression porte sur la charge, pas sur une hausse de volume de répétitions.'
      : 'Les formats ne sont pas tous documentés comme stables : la lecture charge reste prudente.',
    'Ce n’est pas une affirmation de force maximale ni d’hypertrophie — seulement une phase documentée d’augmentation de charge externe.'
  ].join(' ');

  return {
    coverage: 'concluded',
    conclusion,
    title: 'Phase collective d’augmentation de charge',
    kind: 'disc_composed_load_phase',
    namedMoves: rows,
    metrics: {
      eventCount,
      exerciseCount,
      changeDates: dates,
      referenceDates: refDates,
      composition: { coverage: 'concluded' }
    }
  };
}
