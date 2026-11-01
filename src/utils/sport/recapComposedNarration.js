/**
 * F4 — Narration fondée sur composedEvidence (preuves structurées).
 * Ne parse jamais le body existant pour en déduire un mécanisme.
 */

import { composeAnalyticalReading } from './recapAnalyticalReading';
import { formatDayFr } from './recapTrainingTimeline';
import { resolveExerciseNameForRecap, userFacingExerciseLabel } from './recapStrengthPeriodStats';

function cleanName(name, exerciseId, getExerciseNameById) {
  let n = String(name || '').trim();
  if ((!n || n === 'un mouvement') && exerciseId != null && getExerciseNameById) {
    n = resolveExerciseNameForRecap(exerciseId, getExerciseNameById) || n;
  }
  return userFacingExerciseLabel(n, exerciseId);
}

function schemePhrase(before, after) {
  if (!before || !after) return null;
  if (before.setCount == null || after.setCount == null) return null;
  if (before.perSet == null || after.perSet == null) return null;
  return `${before.setCount} × ${before.perSet} → ${after.setCount} × ${after.perSet}`;
}

function volumeDeltaPhrase(pct) {
  if (pct == null || !Number.isFinite(Number(pct))) return null;
  const n = Number(pct);
  const abs = Math.abs(n);
  const rounded = Math.round(abs * 10) / 10;
  if (n > 0) return `hausse d’environ ${rounded} %`;
  if (n < 0) return `baisse d’environ ${rounded} %`;
  return 'volume inchangé';
}

/**
 * Titre-thèse à partir des faits composés (pas un code technique).
 */
export function titleFromComposedEvidence(composed, { name } = {}) {
  if (!composed?.ok) return null;
  const label = name || composed.primaryPhenomenon?.name || 'Cet exercice';
  const cont = composed.continuity?.kind;
  const mech = composed.decomposition?.kind;
  const attrib = composed.volumeAttribution?.kind;
  const story = composed.primaryPhenomenon?.primaryStory;
  const peers = composed.comparators?.verdict;

  if (cont === 'consolidated_format' || (mech === 'more_sets_same_reps' && composed.decomposition?.maintained)) {
    return `${label} : un format plus volumineux se maintient`;
  }
  if (cont === 'punctual_format_spike') {
    return `${label} : une séance plus chargée, sans consolidation`;
  }
  if (attrib === 'frequency_driven_total_rise') {
    return `${label} : le total monte surtout parce que tu t’entraînes plus souvent`;
  }
  if (attrib === 'frequency_driven_total_decline') {
    return `${label} : le total baisse surtout parce que tu t’entraînes moins souvent`;
  }
  if (attrib === 'per_session_driven_decline' || mech === 'same_sets_fewer_reps') {
    if (peers === 'localized') {
      return `${label} : moins de répétitions par séance, sans recul comparable ailleurs`;
    }
    return `${label} : moins de répétitions par séance`;
  }
  if (attrib === 'per_session_driven_rise' || mech === 'same_sets_more_reps') {
    return `${label} : davantage de répétitions par séance`;
  }
  if (cont === 'decline_then_recovery' || story === 'recovered' || story === 'partial_recovery') {
    return `${label} : recul puis retour près du niveau de départ`;
  }
  if (cont === 'confirmed_decline' || story === 'net_decline') {
    return `${label} : recul confirmé sur plusieurs séances`;
  }
  if (cont === 'stable_plateau' || story === 'plateau') {
    return `${label} : volume par séance stable`;
  }
  if (cont === 'confirmed_return') {
    return `${label} revient et se réinstalle`;
  }
  if (cont === 'punctual_return') {
    return `${label} revient après une interruption`;
  }
  if (cont === 'isolated_outlier') {
    return `${label} : une séance atypique, pas encore une tendance`;
  }
  if (story === 'net_rise') {
    return `${label} : volume par séance en hausse`;
  }
  return null;
}

function buildObservation(composed, name, lexicon) {
  const positions = composed.proof?.positions || [];
  const main = composed.levels?.observed?.text || positions.find((p) => p.claim === 'main')?.text;
  const obs = composed.observations || [];
  const inWin = obs.filter((o) => o.inSelectedWindow !== false);
  const usable = (inWin.length >= 2 ? inWin : obs).filter(
    (o) => o.totalReps != null && Number.isFinite(Number(o.totalReps))
  );
  if (usable.length >= 2) {
    const first = usable[0];
    const last = usable[usable.length - 1];
    const changed = Number(first.totalReps) !== Number(last.totalReps);
    if (changed) {
      const noun = lexicon?.maySayPerformance ? 'tes performances' : 'le volume de répétitions enregistré';
      const verb = lexicon?.maySayPerformance ? 'passent' : 'passe';
      const nSessions = usable.length;
      const pct =
        first.totalReps > 0
          ? Math.round(((last.totalReps - first.totalReps) / first.totalReps) * 1000) / 10
          : null;
      const pctBit = pct != null && Math.abs(pct) >= 8 ? `, soit une ${volumeDeltaPhrase(pct)}` : '';
      const hist = composed.windows?.historical;
      let scopeLead = '';
      if (hist?.role === 'historicalContextWindow' && composed.windows?.primary) {
        scopeLead = `Sur la période sélectionnée, et en tenant compte du contexte des séances précédentes, `;
      } else {
        scopeLead = nSessions >= 3 ? `Sur ${nSessions} séances comparables, ` : '';
      }
      return `${scopeLead}${noun} sur ${name} ${verb} d’environ ${first.totalReps} à ${last.totalReps} répétitions par séance${pctBit}`;
    }
  }
  // early/late structurés (shape) si présents sur le phénomène / proof
  const early = composed.primaryPhenomenon?.earlyMean;
  const late = composed.primaryPhenomenon?.lateMean;
  if (early != null && late != null && Number(early) !== Number(late)) {
    const noun = lexicon?.maySayPerformance ? 'tes performances' : 'le volume de répétitions enregistré';
    const verb = lexicon?.maySayPerformance ? 'passent' : 'passe';
    const pct = early > 0 ? Math.round(((late - early) / early) * 1000) / 10 : null;
    const pctBit = pct != null && Math.abs(pct) >= 8 ? `, soit une ${volumeDeltaPhrase(pct)}` : '';
    return `${noun} sur ${name} ${verb} d’environ ${early} à ${late} répétitions par séance${pctBit}`;
  }
  if (main) {
    // Strip forbidden performance wording if lexicon forbids
    if (!lexicon?.maySayPerformance) {
      return String(main)
        .replace(/\btes performances\b/gi, 'le volume de répétitions enregistré')
        .replace(/\bperformances\b/gi, 'volume de répétitions');
    }
    return main;
  }
  return null;
}

function buildMechanism(composed) {
  const dec = composed.decomposition;
  if (!dec || dec.available === false) {
    return null;
  }
  const kind = dec.kind;
  const before = dec.before;
  const after = dec.after;
  const scheme = schemePhrase(before, after);
  const maintained = dec.maintained === true;

  if (kind === 'same_sets_fewer_reps' && before && after) {
    return `Le nombre de séries reste proche de ${before.setCount} ; la diminution vient surtout des répétitions par série (environ ${before.perSet} → ${after.perSet})`;
  }
  if (kind === 'same_sets_more_reps' && before && after) {
    return `Le nombre de séries reste proche de ${before.setCount} ; les répétitions par série augmentent (environ ${before.perSet} → ${after.perSet})`;
  }
  if (kind === 'more_sets_same_reps' && before && after) {
    const deltaPct =
      before.setCount > 0
        ? Math.round(((after.setCount - before.setCount) / before.setCount) * 1000) / 10
        : null;
    const base = `Le format passe de ${before.setCount} × ${before.perSet} à ${after.setCount} × ${after.perSet}${
      deltaPct != null ? `, soit une hausse d’environ ${deltaPct} % des répétitions par séance` : ''
    }`;
    return maintained
      ? `${base}. Ce nouveau format a ensuite été reproduit sur les séances suivantes`
      : `${base}`;
  }
  if (kind === 'fewer_sets_same_reps' && before && after) {
    return `Tu fais moins de séries (environ ${before.setCount} → ${after.setCount}), avec des répétitions par série du même ordre`;
  }
  if (kind === 'stable_format' && scheme) {
    return `Sur les séances où le détail de séries est connu, le format reste du même ordre (${scheme.replace(' → ', ' comme ')})`;
  }
  if (composed.volumeAttribution?.detail) {
    return composed.volumeAttribution.detail;
  }
  if (composed.levels?.interpreted?.text) {
    return composed.levels.interpreted.text;
  }
  return dec.detail || null;
}

function buildContinuityNote(composed) {
  const cont = composed.continuity;
  if (!cont || !cont.kind || cont.kind === 'unclear' || cont.kind === 'insufficient') return null;
  switch (cont.kind) {
    case 'consolidated_format':
      return 'Il ne s’agit donc pas seulement d’une séance exceptionnelle : le journal montre une organisation du travail reproduite';
    case 'punctual_format_spike':
      return 'Cette hausse de format n’a pas été reproduite ensuite : on ne peut pas encore parler de consolidation';
    case 'confirmed_decline':
      return 'Le recul se confirme sur plusieurs séances, pas sur un seul point isolé';
    case 'decline_then_recovery':
      return 'Après un creux, les séances récentes reviennent près du niveau de départ';
    case 'stable_plateau':
      return 'Le volume par séance reste récemment stable';
    case 'punctual_return':
      return 'Pour l’instant, c’est un retour ponctuel — trop tôt pour parler de reprise durable';
    case 'confirmed_return':
      return 'Le retour s’observe sur plusieurs séances de la période';
    case 'isolated_outlier':
      return 'L’écart est surtout porté par une séance atypique';
    case 'directional_change':
      return null;
    case 'single_introduction':
      return 'Une seule séance est encore trop peu pour en faire une habitude';
    default:
      return cont.detail && cont.detail !== cont.kind ? cont.detail : null;
  }
}

function buildComparatorNote(composed) {
  const c = composed.comparators;
  if (!c || !c.verdict || c.verdict === 'insufficient') return null;
  if (c.verdict === 'mixed') {
    return 'Les autres mouvements comparables ne permettent pas d’isoler clairement si le signal est local ou partagé';
  }
  if (c.verdict === 'shared') {
    return 'Plusieurs mouvements comparables évoluent dans le même sens : le signal dépasse cet exercice seul, sans prouver une cause unique';
  }
  // Prefer structured peer phrase over raw detail if detail claims "stables" wrongly — use detail when localized*
  if (c.detail) return c.detail;
  return null;
}

function buildHistoricalNote(composed) {
  const h = composed.windows?.historical;
  if (!h || h.role !== 'historicalContextWindow') return null;
  if (h.contextBefore > 0) {
    return `Le contexte historique (${h.contextBefore} séance${h.contextBefore > 1 ? 's' : ''} avant la fenêtre) sert uniquement à situer cette évolution, pas à remplacer la période sélectionnée`;
  }
  return null;
}

function buildImplication(composed) {
  const forbidden = new Set(composed.forbiddenConclusions || []);
  if (forbidden.has('adaptation_physiologique')) {
    // Never imply physio
  }
  const cont = composed.continuity?.kind;
  const peers = composed.comparators?.verdict;
  const mech = composed.decomposition?.kind;

  if (cont === 'consolidated_format') {
    return 'Cela montre une augmentation maintenue du volume réalisé, sans suffire à démontrer à elle seule une progression physiologique';
  }
  if (
    (mech === 'same_sets_fewer_reps' || composed.volumeAttribution?.kind === 'per_session_driven_decline') &&
    peers === 'localized' &&
    !forbidden.has('recul_isole_a_cet_exercice')
  ) {
    return 'Avant d’augmenter la difficulté de cette variante, retrouver un volume régulier sur les prochaines séances peut constituer un repère utile';
  }
  if (cont === 'punctual_return') {
    return null;
  }
  if (cont === 'confirmed_return' || cont === 'decline_then_recovery') {
    return 'Maintenir ce niveau sur les prochaines séances dira s’il se stabilise';
  }
  // Prefer structured implication from levels if present and not forbidden
  const impl = composed.levels?.implication?.text;
  if (impl && !/physiolog|surentraînement|force générale intacte/i.test(impl)) {
    return impl;
  }
  return null;
}

function buildLimit(composed) {
  const forbidden = composed.forbiddenConclusions || [];
  const caveats = composed.caveats || [];
  const parts = [];
  if (forbidden.includes('decomposition_series_vs_reps')) {
    parts.push('Sans détail de séries fiable, on lit le volume par séance, pas la structure interne');
  }
  // Ne pas transformer l’absence de témoins en phrase parasite en fin de carte
  for (const c of caveats) {
    if (typeof c !== 'string' || c.length < 12 || /^[a-z_]+$/.test(c)) continue;
    if (/pas assez de témoins|témoins comparables/i.test(c)) continue;
    if (/^Famille de mouvement/i.test(c)) continue;
    parts.push(c);
  }
  return parts[0] || null;
}

function capitalizeSentence(s) {
  const t = String(s || '').trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Produit title/body depuis composedEvidence.
 * @returns {{ title: string|null, body: string|null, usedComposedNarration: boolean, depth: string, beats: object }|null}
 */
export function narrateFromComposedEvidence(composed, discovery = {}, { getExerciseNameById = null } = {}) {
  if (!composed?.ok || !composed.composed) {
    return { title: null, body: null, usedComposedNarration: false, depth: 'none', beats: null };
  }

  const exerciseId =
    composed.primaryPhenomenon?.exerciseId ||
    discovery.metrics?.exerciseId ||
    null;
  const name = cleanName(
    composed.primaryPhenomenon?.name || discovery.metrics?.name || discovery.metrics?.exerciseName,
    exerciseId,
    getExerciseNameById
  );

  const lexicon = composed.lexicon || { maySayPerformance: false };
  const title =
    titleFromComposedEvidence(composed, { name }) ||
    discovery.title ||
    name;

  const constat = buildObservation(composed, name, lexicon);
  const mechanism = buildMechanism(composed);
  const continuity = buildContinuityNote(composed);
  const comparators = buildComparatorNote(composed);
  const historical = buildHistoricalNote(composed);
  const implication = buildImplication(composed);
  const limit = buildLimit(composed);

  // Deduplicate: if mechanism already equals volumeAttribution detail and continuity repeats, skip
  const scopeParts = [continuity, comparators, historical].filter(Boolean);
  // Drop scope parts that duplicate mechanism text ; joindre en phrases complètes
  const scope = scopeParts
    .filter((s) => !mechanism || !s.includes(mechanism.slice(0, 40)))
    .map((s) => (/[.!?…]$/.test(s) ? s : `${s}.`))
    .join(' ')
    .replace(/\.\s*\./g, '.')
    .trim();

  const reading = composeAnalyticalReading({
    titleThesis: title,
    constat: constat ? capitalizeSentence(constat) : null,
    mechanism: mechanism ? capitalizeSentence(mechanism) : null,
    scope: scope ? capitalizeSentence(scope) : null,
    implication: implication ? capitalizeSentence(implication) : null,
    limit: limit ? capitalizeSentence(limit) : null
  });

  let depth = 'explanatory';
  if (mechanism && (continuity || comparators)) depth = 'composed';
  if (mechanism && continuity && comparators && implication) depth = 'deep';
  if (!mechanism && !continuity && !comparators) depth = 'elementary';

  return {
    title: reading.title,
    body: reading.body,
    usedComposedNarration: Boolean(reading.body),
    depth,
    beats: reading.beats,
    resolvedName: name
  };
}

/**
 * Applique la narration F4 sur une discovery déjà enrichie F3.
 */
export function applyComposedNarrationToDiscovery(discovery, { getExerciseNameById = null } = {}) {
  if (!discovery?.metrics?.composedEvidence?.composed) return discovery;
  const narrated = narrateFromComposedEvidence(discovery.metrics.composedEvidence, discovery, {
    getExerciseNameById
  });
  if (!narrated.usedComposedNarration || !narrated.body) return discovery;

  return {
    ...discovery,
    title: narrated.title || discovery.title,
    body: narrated.body,
    metrics: {
      ...(discovery.metrics || {}),
      f4Narration: {
        used: true,
        depth: narrated.depth,
        resolvedName: narrated.resolvedName || null,
        beats: narrated.beats
      },
      // Conserver brouillon pré-F4 pour audits avant/après
      draftTitleBeforeF4: discovery.metrics?.draftTitleBeforeF4 || discovery.title,
      draftBodyBeforeF4: discovery.metrics?.draftBodyBeforeF4 || discovery.body
    }
  };
}

export function applyComposedNarrationToDiscoveries(discoveries = [], opts = {}) {
  return (discoveries || []).map((d) => applyComposedNarrationToDiscovery(d, opts));
}

/** Exposé pour tests / dates dans narration historique. */
export function formatObservationDateFr(ymd) {
  return formatDayFr(ymd, true);
}
