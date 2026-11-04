/**
 * F4 / F4.1 — Narration fondée sur composedEvidence (preuves structurées).
 * Ne parse jamais le body existant pour en déduire un mécanisme.
 * F4.1 : cohérence titre↔chiffres, mécanismes démontrables, préservation F3,
 * français utilisateur (pas de jargon de fenêtres).
 */

import { composeAnalyticalReading } from './recapAnalyticalReading';
import { formatDayFr } from './recapTrainingTimeline';
import { resolveExerciseNameForRecap, userFacingExerciseLabel } from './recapStrengthPeriodStats';

function cleanName(name, exerciseId, getExerciseNameById) {
  let n = String(name || '').trim();
  if ((!n || n === 'un mouvement') && exerciseId != null && getExerciseNameById) {
    n = resolveExerciseNameForRecap(exerciseId, getExerciseNameById) || n;
  }
  if ((!n || n === 'un mouvement') && exerciseId != null) {
    n = resolveExerciseNameForRecap(exerciseId, null) || n;
  }
  return userFacingExerciseLabel(n, exerciseId);
}

/** Typographie FR : 53,3 */
export function formatFrNumber(n, digits = 1) {
  if (n == null || !Number.isFinite(Number(n))) return '';
  const v = Number(n);
  const rounded = Math.round(v * 10 ** digits) / 10 ** digits;
  if (Number.isInteger(rounded) || digits === 0) return String(Math.round(rounded));
  return String(rounded).replace('.', ',');
}

export function isPluralExerciseLabel(name) {
  const n = String(name || '').trim();
  if (!n) return false;
  if (/^(les|des)\s/i.test(n)) return true;
  return /\b(pompes|dips|tractions|relevés|extensions|hyperextensions|oiseaux|développés)\b/i.test(n);
}

function returnVerb(name) {
  return isPluralExerciseLabel(name) ? 'reviennent' : 'revient';
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
  const rounded = formatFrNumber(abs, 1);
  if (n > 0) return `hausse d’environ ${rounded} %`;
  if (n < 0) return `baisse d’environ ${rounded} %`;
  return 'volume inchangé';
}

/**
 * Direction numérique unique pour titre + observation (évite les contradictions).
 * @returns {{ early: number|null, late: number|null, deltaPct: number|null, direction: 'up'|'down'|'flat'|'unknown', nSessions: number|null, source: string }}
 */
export function resolveVolumeDirection(composed) {
  const early = composed?.primaryPhenomenon?.earlyMean;
  const late = composed?.primaryPhenomenon?.lateMean;
  const deltaShape = composed?.primaryPhenomenon?.deltaPct;

  if (early != null && late != null && Number.isFinite(Number(early)) && Number.isFinite(Number(late))) {
    const deltaPct =
      deltaShape != null && Number.isFinite(Number(deltaShape))
        ? Number(deltaShape)
        : early > 0
          ? Math.round(((late - early) / early) * 1000) / 10
          : null;
    let direction = 'flat';
    if (deltaPct != null && deltaPct >= 8) direction = 'up';
    else if (deltaPct != null && deltaPct <= -8) direction = 'down';
    else if (Number(late) > Number(early) + 1) direction = 'up';
    else if (Number(late) < Number(early) - 1) direction = 'down';
    return {
      early: Number(early),
      late: Number(late),
      deltaPct,
      direction,
      nSessions: (composed.observations || []).filter((o) => o.totalReps != null).length || null,
      source: 'shape'
    };
  }

  const obs = (composed?.observations || []).filter(
    (o) => o.totalReps != null && Number.isFinite(Number(o.totalReps))
  );
  if (obs.length >= 2) {
    const first = Number(obs[0].totalReps);
    const last = Number(obs[obs.length - 1].totalReps);
    const deltaPct = first > 0 ? Math.round(((last - first) / first) * 1000) / 10 : null;
    let direction = 'flat';
    if (deltaPct != null && deltaPct >= 8) direction = 'up';
    else if (deltaPct != null && deltaPct <= -8) direction = 'down';
    return {
      early: first,
      late: last,
      deltaPct,
      direction,
      nSessions: obs.length,
      source: 'observations'
    };
  }

  return {
    early: null,
    late: null,
    deltaPct: null,
    direction: 'unknown',
    nSessions: null,
    source: 'none'
  };
}

/**
 * Titre-thèse cohérent avec la direction numérique réelle.
 */
export function titleFromComposedEvidence(composed, { name } = {}) {
  if (!composed?.ok) return null;
  const label = name || composed.primaryPhenomenon?.name || 'Cet exercice';
  const cont = composed.continuity?.kind;
  const mech = composed.decomposition?.kind;
  const attrib = composed.volumeAttribution?.kind;
  const story = composed.primaryPhenomenon?.primaryStory;
  const peers = composed.comparators?.verdict;
  const dir = resolveVolumeDirection(composed);

  if (cont === 'consolidated_format' || (mech === 'more_sets_same_reps' && composed.decomposition?.maintained)) {
    return `${label} : un format plus volumineux se maintient`;
  }
  if (cont === 'punctual_format_spike') {
    return `${label} : une séance plus chargée, sans consolidation`;
  }

  // Attribution fréquence : uniquement si métriques de séances présentes
  const attrM = composed.volumeAttribution?.metrics;
  if (attrib === 'frequency_driven_total_rise' && attrM?.prevSessionCount != null && attrM?.windowSessionCount != null) {
    return `${label} : le total monte surtout parce que tu t’entraînes plus souvent`;
  }
  if (attrib === 'frequency_driven_total_decline' && attrM?.prevSessionCount != null && attrM?.windowSessionCount != null) {
    return `${label} : le total baisse surtout parce que tu t’entraînes moins souvent`;
  }

  if (
    (attrib === 'per_session_driven_decline' || mech === 'same_sets_fewer_reps') &&
    dir.direction !== 'up'
  ) {
    if (peers === 'localized') {
      return `${label} : moins de répétitions par séance, sans recul comparable ailleurs`;
    }
    return `${label} : moins de répétitions par séance`;
  }
  if (
    (attrib === 'per_session_driven_rise' || mech === 'same_sets_more_reps') &&
    dir.direction !== 'down'
  ) {
    return `${label} : davantage de répétitions par séance`;
  }

  if (cont === 'decline_then_recovery' || story === 'recovered' || story === 'partial_recovery') {
    return `${label} : recul puis retour près du niveau de départ`;
  }

  // Recul / hausse : imposer cohérence avec dir
  if (cont === 'confirmed_decline' || story === 'net_decline') {
    if (dir.direction === 'up') {
      return `${label} : volume par séance en hausse`;
    }
    if (dir.direction === 'flat') {
      return `${label} : volume par séance récemment stable`;
    }
    return `${label} : recul confirmé sur plusieurs séances`;
  }
  if (story === 'net_rise') {
    if (dir.direction === 'down') {
      return `${label} : moins de répétitions par séance`;
    }
    return `${label} : volume par séance en hausse`;
  }

  if (cont === 'stable_plateau' || story === 'plateau') {
    return `${label} : volume par séance stable`;
  }
  if (cont === 'confirmed_return') {
    return `${label} ${returnVerb(label)} et se réinstalle`;
  }
  if (cont === 'punctual_return') {
    return `${label} ${returnVerb(label)} après une interruption`;
  }
  if (cont === 'isolated_outlier') {
    return `${label} : une séance atypique, pas encore une tendance`;
  }

  // Directionnel générique aligné sur les chiffres
  if (dir.direction === 'down') return `${label} : moins de répétitions par séance`;
  if (dir.direction === 'up') return `${label} : volume par séance en hausse`;
  if (dir.direction === 'flat') return `${label} : volume par séance stable`;

  return null;
}

function enrichMainWithLexicon(main, lexicon) {
  if (!main) return null;
  if (!lexicon?.maySayPerformance) {
    return String(main)
      .replace(/\btes performances\b/gi, 'le volume de répétitions enregistré')
      .replace(/\bperformances\b/gi, 'volume de répétitions');
  }
  return main;
}

/**
 * Observation : privilégie le constat F3 riche (creux, dates) quand pertinent ;
 * sinon moyennes early/late avec décimales FR.
 */
function buildObservation(composed, name, lexicon, discovery = {}) {
  const positions = composed.proof?.positions || [];
  const main = enrichMainWithLexicon(
    composed.levels?.observed?.text || positions.find((p) => p.claim === 'main')?.text,
    lexicon
  );
  const story = composed.primaryPhenomenon?.primaryStory;
  const cont = composed.continuity?.kind;
  const dir = resolveVolumeDirection(composed);

  // Préservation F3 : chronologie creux/reprise déjà rédigée dans le fait principal
  if (
    main &&
    (cont === 'decline_then_recovery' ||
      story === 'recovered' ||
      story === 'partial_recovery' ||
      /creux|revenu|dernière séance|arc/i.test(main))
  ) {
    return main;
  }

  // Retour : garder le constat d’installation / réapparition s’il est précis
  if (main && (cont === 'punctual_return' || cont === 'confirmed_return') && /réapparition|revient|jours/i.test(main)) {
    return main;
  }

  if (dir.early != null && dir.late != null && dir.direction !== 'flat') {
    const noun = lexicon?.maySayPerformance ? 'tes performances' : 'le volume moyen de répétitions enregistré';
    const verb = lexicon?.maySayPerformance
      ? isPluralExerciseLabel(name)
        ? 'passent'
        : 'passent'
      : 'passe';
    const nBit =
      dir.nSessions >= 3 ? `Sur ${dir.nSessions} séances, ` : '';
    const pctBit =
      dir.deltaPct != null && Math.abs(dir.deltaPct) >= 8
        ? `, soit une ${volumeDeltaPhrase(dir.deltaPct)}`
        : '';
    return `${nBit}${noun} pour ${name} ${verb} d’environ ${formatFrNumber(dir.early)} à ${formatFrNumber(dir.late)} répétitions par séance${pctBit}`;
  }

  if (main) return main;

  // Fallback draft F3 si observation structurée trop pauvre
  const draft = discovery.metrics?.draftBodyBeforeF4;
  if (draft && String(draft).length > 40) {
    return String(draft).split(/(?<=[.!?…])\s+/)[0];
  }
  return null;
}

function buildMechanism(composed, dir) {
  const dec = composed.decomposition;
  const attrib = composed.volumeAttribution;

  // Attribution fréquence : toujours démontrer les comptes de séances
  if (attrib?.kind?.startsWith('frequency_driven_') && attrib.metrics) {
    const m = attrib.metrics;
    const per =
      m.perSessionPct != null && Math.abs(m.perSessionPct) <= 12
        ? `alors que le volume par séance reste proche`
        : `tandis que le volume par séance évolue aussi`;
    if (m.prevSessionCount != null && m.windowSessionCount != null) {
      return `Tu es passé de ${m.prevSessionCount} à ${m.windowSessionCount} séances sur la période comparable, ${per}`;
    }
  }

  if (!dec || dec.available === false) {
    if (attrib?.detail && !/fenêtre|contrat|primaryWindow/i.test(attrib.detail)) {
      return attrib.detail;
    }
    return null;
  }

  const kind = dec.kind;
  const before = dec.before;
  const after = dec.after;
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
      deltaPct != null ? `, soit une hausse d’environ ${formatFrNumber(deltaPct)} % des répétitions par séance` : ''
    }`;
    return maintained
      ? `${base}. Ce nouveau format a ensuite été reproduit sur les séances suivantes`
      : base;
  }
  if (kind === 'fewer_sets_same_reps' && before && after) {
    return `Tu fais moins de séries (environ ${before.setCount} → ${after.setCount}), avec des répétitions par série du même ordre`;
  }

  if (kind === 'stable_format' && before && after) {
    const same =
      before.setCount === after.setCount && Number(before.perSet) === Number(after.perSet);
    // Moyenne qui bouge + format stable : clarifier les deux lectures
    if (dir && dir.direction !== 'flat' && same) {
      return `Sur les séances où les séries sont détaillées, le format reste identique (${before.setCount} × ${before.perSet}) : l’évolution du volume moyen par séance ne vient donc pas d’un changement de schéma séries × reps sur ces séances documentées`;
    }
    if (same) {
      // Stabilité de format seule : utile seulement si on parle de plateau / retour
      if (
        composed.continuity?.kind === 'stable_plateau' ||
        composed.continuity?.kind === 'punctual_return' ||
        composed.continuity?.kind === 'confirmed_return'
      ) {
        return `Le format de séries observé est resté identique (${before.setCount} × ${before.perSet})`;
      }
      return null; // ne pas afficher « 3×20 comme 3×20 » inutile
    }
  }

  if (attrib?.detail && !/fenêtre|contrat|primaryWindow/i.test(attrib.detail)) {
    return attrib.detail;
  }
  if (composed.levels?.interpreted?.text) {
    const t = composed.levels.interpreted.text;
    if (/fenêtre|contrat|primaryWindow|historicalContext/i.test(t)) return null;
    return t;
  }
  return null;
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
      return null; // déjà dans le constat F3 riche
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
    return 'Plusieurs mouvements comparables évoluent dans le même sens : le signal dépasse ce mouvement seul, sans prouver une cause unique';
  }
  // Ne pas affirmer « stables » si mixed — localized* OK via detail
  if (c.verdict === 'localized' || c.verdict === 'localized_rise' || c.verdict === 'localized_recovery') {
    return c.detail || null;
  }
  if (c.detail && !/restent du même ordre|restent stables/i.test(c.detail)) return c.detail;
  return c.detail || null;
}

/** Plus de jargon « fenêtre / contrat / historicalContext » pour l’utilisateur. */
function buildHistoricalNote(composed) {
  const h = composed.windows?.historical;
  if (!h || h.role !== 'historicalContextWindow') return null;
  if (h.contextBefore > 0) {
    return `Cette lecture s’appuie aussi sur ${h.contextBefore} séance${h.contextBefore > 1 ? 's' : ''} antérieure${h.contextBefore > 1 ? 's' : ''} pour situer l’évolution`;
  }
  return null;
}

function buildImplication(composed) {
  const forbidden = new Set(composed.forbiddenConclusions || []);
  const cont = composed.continuity?.kind;
  const peers = composed.comparators?.verdict;
  const mech = composed.decomposition?.kind;
  const dir = resolveVolumeDirection(composed);

  if (cont === 'consolidated_format') {
    return 'Cela montre une augmentation maintenue du volume réalisé, sans suffire à démontrer à elle seule une progression physiologique';
  }
  if (
    (mech === 'same_sets_fewer_reps' || composed.volumeAttribution?.kind === 'per_session_driven_decline') &&
    peers === 'localized' &&
    dir.direction !== 'up' &&
    !forbidden.has('recul_isole_a_cet_exercice')
  ) {
    return 'Avant d’augmenter la difficulté de cette variante, retrouver un volume régulier sur les prochaines séances peut constituer un repère utile';
  }
  if (cont === 'punctual_return') return null;
  if (cont === 'confirmed_return' || cont === 'decline_then_recovery') {
    return 'Maintenir ce niveau sur les prochaines séances dira s’il se stabilise';
  }
  const impl = composed.levels?.implication?.text;
  if (impl && !/physiolog|surentraînement|force générale intacte|fenêtre|contrat/i.test(impl)) {
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
  for (const c of caveats) {
    if (typeof c !== 'string' || c.length < 12 || /^[a-z_]+$/.test(c)) continue;
    if (/pas assez de témoins|témoins comparables|fenêtre|contrat|primaryWindow/i.test(c)) continue;
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
 * Contrôles sémantiques F4.1 — exploitent faits structurés + texte produit.
 * @returns {{ ok: boolean, issues: string[] }}
 */
const HARD_CONSISTENCY = new Set([
  'title_down_vs_values_up',
  'title_up_vs_values_down',
  'frequency_claim_without_session_counts',
  'frequency_title_without_frequency_in_body',
  'tautological_format_comparison',
  'consolidation_vs_punctual_spike',
  'durable_return_vs_punctual',
  'mixed_peers_called_stable',
  'developer_jargon_in_prose'
]);

export function assertNarrationConsistency({ title, body, composed } = {}) {
  const issues = [];
  const soft = [];
  const t = String(title || '');
  const b = String(body || '');
  const text = `${t}\n${b}`;
  const dir = resolveVolumeDirection(composed || {});

  if (/recul confirmé|moins de répétitions|baisse/i.test(t) && dir.direction === 'up') {
    issues.push('title_down_vs_values_up');
  }
  if (/en hausse|davantage de répétitions|monte surtout/i.test(t) && dir.direction === 'down') {
    issues.push('title_up_vs_values_down');
  }
  if (/s’entraînes plus souvent|plus souvent/i.test(t)) {
    const m = composed?.volumeAttribution?.metrics;
    if (!(m?.prevSessionCount != null && m?.windowSessionCount != null)) {
      issues.push('frequency_claim_without_session_counts');
    }
    if (!/\d+\s*.*\d+\s*séances/i.test(b) && !/de \d+ à \d+ séances/i.test(b)) {
      issues.push('frequency_title_without_frequency_in_body');
    }
  }
  if (/comme \d+\s*×\s*\d+/i.test(b)) {
    issues.push('tautological_format_comparison');
  }
  if (/consolidation|se maintient/i.test(t) && composed?.continuity?.kind === 'punctual_format_spike') {
    issues.push('consolidation_vs_punctual_spike');
  }
  if (/reprise durable|se réinstalle/i.test(t) && composed?.continuity?.kind === 'punctual_return') {
    issues.push('durable_return_vs_punctual');
  }
  if (
    /restent stables|reste stable/i.test(b) &&
    composed?.comparators?.verdict === 'mixed' &&
    !/ne permettent pas d’isoler/i.test(b)
  ) {
    issues.push('mixed_peers_called_stable');
  }
  if (/\b20\d{2}-\d{2}-\d{2}\b/.test(text)) soft.push('iso_date_in_prose');
  if (/\d+\.\d+\s*répétitions|\d+\.\d+\s*à\s*\d+/i.test(text)) {
    soft.push('ascii_decimal_in_prose');
  }
  if (/primaryWindow|historicalContext|composedEvidence|trajectoryOk/i.test(text)) {
    issues.push('developer_jargon_in_prose');
  }
  if (/\bun mouvement\b/i.test(t)) {
    soft.push('unresolved_exercise_name');
  }
  // Jargon utilisateur encore trop technique
  if (/avant la fenêtre sélectionnée|fenêtre sélectionnée/i.test(text)) {
    soft.push('window_jargon_in_prose');
  }

  const hardIssues = issues.filter((i) => HARD_CONSISTENCY.has(i));
  return {
    ok: hardIssues.length === 0,
    issues: [...hardIssues, ...soft],
    hardIssues,
    softIssues: soft
  };
}

/**
 * Produit title/body depuis composedEvidence.
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
    composed.primaryPhenomenon?.name ||
      discovery.metrics?.name ||
      discovery.metrics?.exerciseName ||
      discovery.metrics?.resolvedName,
    exerciseId,
    getExerciseNameById
  );

  const lexicon = composed.lexicon || { maySayPerformance: false };
  const dir = resolveVolumeDirection(composed);

  let title =
    titleFromComposedEvidence(composed, { name }) ||
    discovery.title ||
    name;

  // Accords pluriels sur « revient »
  if (name && name !== 'un mouvement') {
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    title = String(title).replace(
      new RegExp(`^(${esc})\\s+revient\\b`, 'i'),
      (_, lab) => `${lab} ${returnVerb(lab)}`
    );
  }

  const constat = buildObservation(composed, name, lexicon, discovery);
  const mechanism = buildMechanism(composed, dir);
  const continuity = buildContinuityNote(composed);
  const comparators = buildComparatorNote(composed);
  const historical = buildHistoricalNote(composed);
  const implication = buildImplication(composed);
  const limit = buildLimit(composed);

  const scopeParts = [continuity, comparators, historical].filter(Boolean);
  const scope = scopeParts
    .filter((s) => !mechanism || !s.includes(String(mechanism).slice(0, 40)))
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

  const consistency = assertNarrationConsistency({
    title: reading.title,
    body: reading.body,
    composed
  });

  // Si contradiction dure titre↔direction : ne pas publier cette narration
  const hard = consistency.issues.filter((i) =>
    /title_down_vs_values_up|title_up_vs_values_down|consolidation_vs_punctual|durable_return_vs_punctual|frequency_claim_without_session_counts/.test(
      i
    )
  );
  if (hard.length) {
    return {
      title: null,
      body: null,
      usedComposedNarration: false,
      depth: 'none',
      beats: null,
      consistency,
      abstained: true,
      abstainReasons: hard
    };
  }

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
    resolvedName: name,
    consistency,
    volumeDirection: dir
  };
}

/** Kinds dont le corps structurel (parts familiales, reprise, etc.) ne doit pas être écrasé par F4. */
const PRESERVE_STRUCTURAL_BODY = new Set([
  'disc_family_fade',
  'disc_structural_memory',
  'disc_best_month',
  'disc_ms_return',
  'disc_ms_return_durable',
  'disc_ms_first_exercise',
  'disc_ms_pr'
]);

export function applyComposedNarrationToDiscovery(discovery, { getExerciseNameById = null } = {}) {
  if (!discovery?.metrics?.composedEvidence?.composed) return discovery;
  if (PRESERVE_STRUCTURAL_BODY.has(String(discovery.kind || ''))) {
    return {
      ...discovery,
      metrics: {
        ...(discovery.metrics || {}),
        f4Narration: {
          used: false,
          abstained: true,
          abstainReasons: ['preserve_structural_body'],
          depth: 'none'
        }
      }
    };
  }
  const draftTitle = discovery.metrics?.draftTitleBeforeF4 || discovery.title;
  const draftBody = discovery.metrics?.draftBodyBeforeF4 || discovery.body;

  const narrated = narrateFromComposedEvidence(discovery.metrics.composedEvidence, discovery, {
    getExerciseNameById
  });

  if (!narrated.usedComposedNarration || !narrated.body) {
    return {
      ...discovery,
      metrics: {
        ...(discovery.metrics || {}),
        f4Narration: {
          used: false,
          abstained: Boolean(narrated.abstained),
          abstainReasons: narrated.abstainReasons || narrated.consistency?.issues || [],
          depth: 'none'
        },
        draftTitleBeforeF4: draftTitle,
        draftBodyBeforeF4: draftBody
      }
    };
  }

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
        beats: narrated.beats,
        consistencyOk: narrated.consistency?.ok !== false,
        consistencyIssues: narrated.consistency?.issues || [],
        consistencyHard: narrated.consistency?.hardIssues || [],
        consistencySoft: narrated.consistency?.softIssues || [],
        volumeDirection: narrated.volumeDirection || null
      },
      draftTitleBeforeF4: draftTitle,
      draftBodyBeforeF4: draftBody
    }
  };
}

export function applyComposedNarrationToDiscoveries(discoveries = [], opts = {}) {
  return (discoveries || []).map((d) => applyComposedNarrationToDiscovery(d, opts));
}

export function formatObservationDateFr(ymd) {
  return formatDayFr(ymd, true);
}
