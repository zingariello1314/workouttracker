/**
 * Registre mince de constats analytiques partagés.
 * Un Finding n'est PAS une analyse complète : interpretation + consequence
 * doivent être renseignés quand les données le permettent (plan R1).
 */

/** @typedef {'fact'|'interpretation'|'hypothesis'} EpistemicLevel */

/**
 * @typedef {object} AnalyticalFinding
 * @property {string} id
 * @property {string} family — volume | adherence | sleep | gtg | body | exercise | mix
 * @property {string} kind
 * @property {string} [subject]
 * @property {{ start?: string, end?: string }} [window]
 * @property {string} [eventYmd]
 * @property {Record<string, number|string|boolean|null|undefined>} metrics
 * @property {string[]} [supportRefs]
 * @property {string[]} [relationIds]
 * @property {number} [n]
 * @property {'ok'|'sparse'|'missing'} [quality]
 * @property {EpistemicLevel} epistemic
 * @property {string} [statement] — constat factuel court
 * @property {string} [interpretation] — lecture fondée
 * @property {string} [consequence] — implication concrète si justifiée
 * @property {string[]} [forbidden] — conclusions refusées
 */

/**
 * @param {Partial<AnalyticalFinding> & { id: string, family: string, kind: string }} partial
 * @returns {AnalyticalFinding}
 */
export function createFinding(partial) {
  const epistemic = partial.epistemic || 'fact';
  return {
    id: partial.id,
    family: partial.family,
    kind: partial.kind,
    subject: partial.subject || null,
    window: partial.window || null,
    eventYmd: partial.eventYmd || null,
    metrics: partial.metrics || {},
    supportRefs: partial.supportRefs || [],
    relationIds: partial.relationIds || [],
    n: partial.n ?? null,
    quality: partial.quality || 'ok',
    epistemic,
    statement: partial.statement || '',
    interpretation: partial.interpretation || '',
    consequence: partial.consequence || '',
    forbidden: partial.forbidden || []
  };
}

/**
 * Profondeur atteinte par le Finding (pour tests R1).
 * 0 = vide · 1 = constat seul · 2 = + interprétation · 3 = + conséquence
 */
export function findingDepthLevel(finding) {
  if (!finding?.statement && !Object.keys(finding?.metrics || {}).length) return 0;
  if (finding.consequence && String(finding.consequence).trim()) return 3;
  if (finding.interpretation && String(finding.interpretation).trim()) return 2;
  if (finding.statement && String(finding.statement).trim()) return 1;
  return Object.keys(finding?.metrics || {}).length ? 1 : 0;
}

/**
 * @param {AnalyticalFinding[]} findings
 * @param {string} id
 */
export function findById(findings, id) {
  return (findings || []).find((f) => f.id === id) || null;
}

/**
 * @param {AnalyticalFinding[]} findings
 * @param {string} family
 */
export function findingsByFamily(findings, family) {
  return (findings || []).filter((f) => f.family === family);
}

/**
 * Décomposition volume ↔ fréquence ↔ dose (C1), optionnellement × perf (C2).
 * @returns {AnalyticalFinding|null}
 */
export function buildVolumeDecompFinding({
  window = null,
  currentReps,
  previousReps,
  currentSessions,
  previousSessions,
  currentLen,
  previousLen,
  goal = null,
  /** Momentum perf/série si dispo (C2) — null = silence */
  perfMomentumPct = null
} = {}) {
  const curR = Number(currentReps);
  const prevR = Number(previousReps);
  const curS = Number(currentSessions);
  const prevS = Number(previousSessions);
  const curL = Math.max(1, Number(currentLen) || 1);
  const prevL = Math.max(1, Number(previousLen) || 1);
  if (![curR, prevR, curS, prevS].every((n) => Number.isFinite(n)) || prevR <= 0 || prevS <= 0) {
    return null;
  }
  if (curS < 1) return null;

  const curDose = curR / curS;
  const prevDose = prevR / prevS;
  const curFreq = (curS / curL) * 7;
  const prevFreq = (prevS / prevL) * 7;
  const volPct = ((curR - prevR) / prevR) * 100;
  const freqPct = prevFreq > 0 ? ((curFreq - prevFreq) / prevFreq) * 100 : null;
  const dosePct = prevDose > 0 ? ((curDose - prevDose) / prevDose) * 100 : null;
  const mom = Number.isFinite(Number(perfMomentumPct)) ? Number(perfMomentumPct) : null;

  const absF = Math.abs(freqPct ?? 0);
  const absD = Math.abs(dosePct ?? 0);
  let driver = 'mixed';
  if (absF >= absD * 1.25) driver = 'frequency';
  else if (absD >= absF * 1.25) driver = 'dose';

  const volLabel = `${volPct >= 0 ? '+' : ''}${Math.round(volPct)} %`;
  const statement = `Le volume de répétitions est passé de ${Math.round(prevR)} à ${Math.round(curR)} (${volLabel}) entre deux fenêtres comparables.`;

  let interpretation = '';
  if (driver === 'frequency') {
    interpretation = `Cette variation vient surtout de la fréquence d'entraînement (${formatPct(freqPct)} séances/sem.), pas d'une dose moyenne par séance (${formatPct(dosePct)} reps/séance).`;
  } else if (driver === 'dose') {
    interpretation = `Cette variation vient surtout de la dose par séance (${formatPct(dosePct)} reps/séance), alors que la fréquence bouge peu (${formatPct(freqPct)}).`;
  } else {
    interpretation = `Fréquence (${formatPct(freqPct)}) et dose par séance (${formatPct(dosePct)}) contribuent toutes les deux ; ce n'est pas un seul levier.`;
  }

  if (mom != null && Math.abs(mom) <= 8 && volPct > 8) {
    interpretation += ` Sur la même période, les performances par série restent stables (${formatPct(mom)}) : tu accumules du travail sans perte nette de production observée.`;
  } else if (mom != null && mom < -12 && volPct > 8) {
    interpretation += ` En parallèle, la production observée par exercice recule (${formatPct(mom)}) : le volume total monte, mais pas forcément le niveau par série.`;
  } else if (mom != null && mom > 8 && volPct > 8) {
    interpretation += ` Les performances observées montent aussi (${formatPct(mom)}) : volume et production bougent dans le même sens.`;
  }

  let consequence = '';
  if (driver === 'frequency' && volPct > 8) {
    consequence =
      mom != null && Math.abs(mom) <= 8
        ? 'Tu confirmes surtout une capacité à enchaîner plus de jours de travail à niveau de série stable — progression de volume de présence, pas encore une hausse de charge unitaire.'
        : 'Tu accumules davantage de jours de travail : le niveau de volume suit surtout ta présence, pas une montée de charge par séance.';
  } else if (driver === 'dose' && volPct > 8) {
    consequence =
      mom != null && Math.abs(mom) <= 8
        ? 'Les séances portent plus de répétitions à perf stable : hausse du travail accumulé par jour entraîné, sans signal de surcharge unitaire.'
        : 'Les séances portent plus de répétitions : c’est une hausse du travail par jour entraîné, pas seulement plus de jours cochés.';
  } else if (volPct < -8) {
    consequence =
      driver === 'frequency'
        ? 'Le creux de volume suit surtout des séances moins fréquentes ; ce n’est pas forcément une baisse de capacité sur une séance isolée.'
        : 'Le creux porte surtout sur la dose par séance ; la fréquence seule n’explique pas tout le mouvement.';
  }

  if (goal === 'muscular_defined' && driver === 'frequency' && volPct > 8) {
    consequence = `${consequence} Pour un objectif de volume/définition, cette hausse de présence est un levier cohérent — à condition que les groupes ciblés restent exposés.`.trim();
  }

  const relationIds = ['C1'];
  if (mom != null) relationIds.push('C2');

  return createFinding({
    id: `volume.decomp|${window?.start || ''}|${window?.end || ''}`,
    family: 'volume',
    kind: 'finding_volume_decomp',
    window,
    metrics: {
      currentReps: curR,
      previousReps: prevR,
      volPct: round1(volPct),
      freqPct: freqPct != null ? round1(freqPct) : null,
      dosePct: dosePct != null ? round1(dosePct) : null,
      driver,
      currentFreq: round1(curFreq),
      previousFreq: round1(prevFreq),
      currentDose: round1(curDose),
      previousDose: round1(prevDose),
      perfMomentumPct: mom != null ? round1(mom) : null
    },
    relationIds,
    n: curS + prevS,
    quality: curS + prevS >= 4 ? 'ok' : 'sparse',
    epistemic: 'interpretation',
    statement,
    interpretation,
    consequence,
    forbidden: [
      'affirmer une progression de force ou d’hypertrophie sur la seule base du volume',
      'affirmer une causalité hors données'
    ]
  });
}

/**
 * Assiduité par jour de semaine × groupes / blocs négligés (C5).
 * @returns {AnalyticalFinding|null}
 */
export function buildAdherenceDowFinding({
  window = null,
  dayOfWeek = [],
  leastCheckedNames = [],
  weakDayMuscleLabels = [],
  strongDayMuscleLabels = [],
  goal = null,
  minGapPct = 8
} = {}) {
  const trained = (dayOfWeek || []).filter(
    (d) => (d.plannedDays || 0) > 0 && d.avgCompletionPct != null && Number.isFinite(d.avgCompletionPct)
  );
  if (trained.length < 3) return null;

  const best = [...trained].sort((a, b) => b.avgCompletionPct - a.avgCompletionPct)[0];
  const worst = [...trained].sort((a, b) => a.avgCompletionPct - b.avgCompletionPct)[0];
  const gap = best.avgCompletionPct - worst.avgCompletionPct;
  if (gap < minGapPct) return null;
  if (best.dow === worst.dow) return null;

  const statement = `Tes jours les plus suivis (${best.label}, ~${Math.round(best.avgCompletionPct)} % de complétion) et les moins suivis (${worst.label}, ~${Math.round(worst.avgCompletionPct)} %) s’écartent de ${Math.round(gap)} points sur la fenêtre.`;

  const weakMuscles = (weakDayMuscleLabels || []).filter(Boolean).slice(0, 3);
  const strongMuscles = (strongDayMuscleLabels || []).filter(Boolean).slice(0, 3);
  const least = (leastCheckedNames || []).filter(Boolean).slice(0, 3);

  let interpretation = `L’écart n’est pas uniforme : ${best.label} porte mieux le plan que ${worst.label}.`;
  if (weakMuscles.length) {
    interpretation += ` Le créneau ${worst.label} du programme cible surtout ${fmtList(weakMuscles)}.`;
  }
  if (strongMuscles.length) {
    interpretation += ` À l’inverse, ${best.label} expose davantage ${fmtList(strongMuscles)}.`;
  }
  if (least.length) {
    interpretation += ` Parmi ce qui revient rarement coché : ${fmtList(least)}.`;
  }

  let consequence = `Si tu veux rééquilibrer l’exécution, priorise la complétion du ${worst.label} plutôt que d’ajouter du volume sur tes jours déjà solides (${best.label}).`;
  if (weakMuscles.length) {
    consequence = `En sous-exécutant le ${worst.label}, tu réduis surtout l’exposition à ${fmtList(weakMuscles)} — ce n’est pas un manque global d’assiduité, c’est un trou local dans le plan.`;
  }
  if (goal === 'street_skills' && /traction|tirage|dos|pull/i.test(weakMuscles.join(' ') || least.join(' '))) {
    consequence += ' Pour un objectif street / tirage, ce trou pèse plus qu’un mercredi jambes partiel.';
  } else if (goal === 'muscular_defined' && weakMuscles.length) {
    consequence += ' Pour un objectif de volume/définition, ces groupes sous-exposés freinent l’objectif plus qu’un simple « jour manqué ».';
  }

  return createFinding({
    id: `adherence.dow|${window?.start || ''}|${window?.end || ''}|${worst.dow}|${best.dow}`,
    family: 'adherence',
    kind: 'adherence_dow',
    window,
    metrics: {
      bestDow: best.dow,
      bestLabel: best.label,
      bestPct: best.avgCompletionPct,
      worstDow: worst.dow,
      worstLabel: worst.label,
      worstPct: worst.avgCompletionPct,
      gapPct: round1(gap),
      weakMuscles: weakMuscles.join(','),
      leastNames: least.join(',')
    },
    relationIds: ['C5'],
    n: trained.reduce((s, d) => s + (d.plannedDays || 0), 0),
    quality: trained.length >= 4 ? 'ok' : 'sparse',
    epistemic: 'interpretation',
    statement,
    interpretation,
    consequence,
    forbidden: [
      'affirmer qu’un jour non planifié est une séance manquée',
      'attribuer le trou à une blessure sans donnée'
    ]
  });
}

/**
 * Poids (± IMC) en parallèle de l’activité — sans causalité (C10 / C11).
 * @returns {AnalyticalFinding|null}
 */
export function buildBodyWeightParallelFinding({
  window = null,
  startKg = null,
  endKg = null,
  deltaKg = null,
  nWeightPoints = 0,
  volumeDeltaPct = null,
  sessionsCurrent = null,
  heightM = null
} = {}) {
  const start = Number(startKg);
  const end = Number(endKg);
  const delta = deltaKg != null ? Number(deltaKg) : Number.isFinite(start) && Number.isFinite(end) ? end - start : null;
  const n = Number(nWeightPoints) || 0;
  if (!Number.isFinite(delta) || n < 2) return null;
  if (Math.abs(delta) < 0.4) return null;

  const direction = delta > 0 ? 'monté' : 'baissé';
  const statement = `Ton poids est ${direction} de ${Math.abs(round1(delta))} kg sur la fenêtre (${round1(start)} → ${round1(end)} kg, ${n} mesures).`;

  const vol = Number.isFinite(Number(volumeDeltaPct)) ? Number(volumeDeltaPct) : null;
  const sessions = Number.isFinite(Number(sessionsCurrent)) ? Number(sessionsCurrent) : null;

  let interpretation = 'C’est une évolution corporelle observée en même temps que ta pratique, pas une preuve que l’entraînement a causé ce mouvement.';
  if (vol != null && Math.abs(vol) >= 8) {
    interpretation +=
      vol > 0
        ? ` Sur la même fenêtre, le volume de répétitions est en hausse (${formatPct(vol)})${sessions != null ? ` avec ${sessions} séances` : ''}.`
        : ` Sur la même fenêtre, le volume de répétitions est en retrait (${formatPct(vol)})${sessions != null ? ` avec ${sessions} séances` : ''}.`;
  } else if (sessions != null && sessions >= 4) {
    interpretation += ` Tu as ${sessions} séances sur la période : les deux séries (poids et entraînement) coexistent, sans lien causal affirmé.`;
  }

  let imcBit = '';
  const h = Number(heightM);
  if (Number.isFinite(h) && h > 1.2 && h < 2.5 && Number.isFinite(end)) {
    const imc = end / (h * h);
    imcBit = ` IMC indicatif ~${round1(imc)} (poids/taille²) — repère grossier, pas une composition corporelle.`;
  }

  const consequence =
    Math.abs(delta) >= 1.5
      ? `Si ton objectif touche au poids, ce delta mérite d’être suivi à part des cartes sportives : il s’ajoute à la lecture, il ne la remplace pas.${imcBit}`
      : `Le mouvement reste modéré : garde-le comme contexte, sans en faire le verdict de ta progression sportive.${imcBit}`;

  return createFinding({
    id: `body.weight|${window?.start || ''}|${window?.end || ''}`,
    family: 'body',
    kind: 'body_weight_parallel',
    window,
    metrics: {
      startKg: round1(start),
      endKg: round1(end),
      deltaKg: round1(delta),
      nWeightPoints: n,
      volumeDeltaPct: vol != null ? round1(vol) : null,
      sessionsCurrent: sessions,
      heightM: Number.isFinite(h) ? round1(h) : null
    },
    relationIds: Number.isFinite(h) ? ['C10', 'C11'] : ['C10'],
    n,
    quality: n >= 3 ? 'ok' : 'sparse',
    epistemic: 'interpretation',
    statement,
    interpretation,
    consequence,
    forbidden: [
      'affirmer une causalité poids↔entraînement',
      'affirmer que l’entraînement a fait perdre ou prendre du poids',
      'diagnostiquer une composition corporelle sans impedance'
    ]
  });
}

/**
 * GTG hors planning × mouvement du repère max — co-évolution, pas cause (C4).
 * @returns {AnalyticalFinding|null}
 */
export function buildGtgRepereCoevoFinding({
  window = null,
  exerciseLabel = null,
  adHocDays = 0,
  adHocReps = 0,
  maxBefore = null,
  maxAfter = null,
  maxTouched = false
} = {}) {
  const label = String(exerciseLabel || '').trim();
  const days = Number(adHocDays) || 0;
  const reps = Number(adHocReps) || 0;
  if (!label || days < 2 || reps < 8) return null;

  const before = Number(maxBefore);
  const after = Number(maxAfter);
  const hasMaxPair = Number.isFinite(before) && before > 0 && Number.isFinite(after) && after > 0;
  const maxDelta = hasMaxPair ? after - before : null;

  const statement = `Sur la fenêtre, ${label} cumule ${days} jours de passages GTG hors planning (~${Math.round(reps)} reps ajoutées).`;

  let interpretation = '';
  let consequence = '';
  let epistemic = 'interpretation';

  if (hasMaxPair && maxDelta != null && maxDelta > 0) {
    interpretation = `Dans le même intervalle, le repère max enregistré pour ${label} passe de ${Math.round(before)} à ${Math.round(after)} reps. Les deux mouvements coexistent dans le temps ; ce n’est pas une preuve que le GTG a produit le max.`;
    consequence =
      'Tu peux traiter le GTG comme volume d’exposition utile, et le max comme un autre signal — à mettre à jour si le test de séance dépasse nettement l’ancien plafond.';
    epistemic = 'hypothesis';
  } else if (hasMaxPair && maxDelta === 0) {
    interpretation = `Le repère max de ${label} reste à ${Math.round(after)} reps malgré ces passages hors planning : le GTG densifie l’exposition sans mouvement du plafond.`;
    consequence =
      'Les mini-séries contribuent au volume de pratique, pas à une hausse de repère visible sur cette fenêtre.';
  } else if (maxTouched) {
    interpretation = `Un max a été touché sur la période pendant que le GTG hors planning était actif — coïncidence temporelle seulement.`;
    consequence =
      'Sépare mentalement travail léger fréquent et test de plafond : l’un n’explique pas l’autre sans séances comparables.';
    epistemic = 'hypothesis';
  } else {
    interpretation = `Aucun mouvement de repère max n’est lisible en parallèle : on ne peut parler que de densité GTG, pas de progression de plafond.`;
    consequence =
      'Tant que le max ne bouge pas (ou n’est pas mesuré), ces passages restent une lecture de volume/continuité, pas de performance max.';
  }

  return createFinding({
    id: `gtg.repere|${label}|${window?.start || ''}|${window?.end || ''}`,
    family: 'gtg',
    kind: 'gtg_repere_coevo',
    subject: label,
    window,
    metrics: {
      adHocDays: days,
      adHocReps: reps,
      maxBefore: hasMaxPair ? before : null,
      maxAfter: hasMaxPair ? after : null,
      maxDelta: maxDelta != null ? round1(maxDelta) : null,
      maxTouched: Boolean(maxTouched)
    },
    relationIds: ['C4'],
    n: days,
    quality: days >= 3 && hasMaxPair ? 'ok' : 'sparse',
    epistemic,
    statement,
    interpretation,
    consequence,
    forbidden: [
      'affirmer que le GTG a causé la hausse du max',
      'promettre une progression de force via mini-séries seules'
    ]
  });
}

/**
 * Compose le corps de carte Analyse à partir d’un Finding (niveaux 1–3).
 */
export function proseFromFinding(finding) {
  if (!finding) return '';
  const parts = [finding.statement, finding.interpretation, finding.consequence].filter(
    (p) => p && String(p).trim()
  );
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function round1(n) {
  return Math.round(Number(n) * 10) / 10;
}

function formatPct(n) {
  if (n == null || !Number.isFinite(n)) return 'n/d';
  return `${n >= 0 ? '+' : ''}${Math.round(n)} %`;
}

function fmtList(names) {
  const cut = (names || []).filter(Boolean).slice(0, 3);
  if (!cut.length) return '';
  if (cut.length === 1) return cut[0];
  return `${cut.slice(0, -1).join(', ')} et ${cut[cut.length - 1]}`;
}
