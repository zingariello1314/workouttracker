/**
 * Analyse sémantique reps × séries pour Récap > Analyse.
 * Interprète plages de reps, nombre de séries, variation intra-séance et comparaisons inter-séances.
 */

/** @typedef {'max_strength'|'hybrid'|'hypertrophy'|'muscular_endurance'|'endurance'|'unknown'} RepRangeIntent */

/** @typedef {'single_set'|'low_volume'|'standard'|'high_volume'|'very_high_volume'} SetCountIntent */

/**
 * Intent training selon reps moyennes par série.
 * @param {number} avgRepsPerSet
 * @returns {RepRangeIntent}
 */
export function classifyRepRangeIntent(avgRepsPerSet) {
  const avg = Number(avgRepsPerSet);
  if (!Number.isFinite(avg) || avg <= 0) return 'unknown';
  if (avg <= 3) return 'max_strength';
  if (avg <= 6) return 'hybrid';
  if (avg <= 12) return 'hypertrophy';
  if (avg <= 20) return 'muscular_endurance';
  return 'endurance';
}

/**
 * Intent selon le nombre de séries.
 * @param {number} setCount
 * @returns {SetCountIntent}
 */
export function classifySetCountIntent(setCount) {
  const n = Math.max(0, Math.floor(Number(setCount) || 0));
  if (n <= 1) return 'single_set';
  if (n <= 3) return 'low_volume';
  if (n <= 6) return 'standard';
  if (n <= 9) return 'high_volume';
  return 'very_high_volume';
}

/**
 * @param {number[]} setReps — reps par série (ordre chronologique)
 * @returns {{ pattern: string, dropFirstToLast: number, isUniform: boolean, fatigueLevel: 'none'|'normal'|'high'|'extreme' }}
 */
export function analyzeIntraSessionRepPattern(setReps) {
  const reps = (setReps || []).map((r) => Math.max(0, Math.floor(Number(r) || 0))).filter((r) => r > 0);
  if (!reps.length) {
    return { pattern: '', dropFirstToLast: 0, isUniform: true, fatigueLevel: 'none' };
  }

  const first = reps[0];
  const last = reps[reps.length - 1];
  const drop = Math.max(0, first - last);
  const isUniform = reps.every((r) => r === first);
  const pattern = reps.join(' - ');

  let fatigueLevel = 'none';
  if (!isUniform) {
    if (drop >= 5) fatigueLevel = 'extreme';
    else if (drop >= 3) fatigueLevel = 'high';
    else if (drop >= 1) fatigueLevel = 'normal';
  }

  return { pattern, dropFirstToLast: drop, isUniform, fatigueLevel };
}

/**
 * Génère une phrase d'analyse pour la répartition intra-séance.
 * @param {number[]} setReps
 * @param {{ plannedSetCount?: number, plannedRepsPerSet?: number }} [ctx]
 * @returns {string|null}
 */
export function buildIntraSessionRepInsight(setReps, ctx = {}) {
  const reps = (setReps || []).map((r) => Math.max(0, Math.floor(Number(r) || 0))).filter((r) => r > 0);
  if (reps.length < 2) return null;

  const { pattern, dropFirstToLast, isUniform, fatigueLevel } = analyzeIntraSessionRepPattern(reps);
  const plannedPerSet = ctx.plannedRepsPerSet;
  const allAtCeiling =
    plannedPerSet != null && plannedPerSet > 0 && reps.every((r) => r >= plannedPerSet);

  if (isUniform) {
    if (allAtCeiling) {
      return `Tu as atteint le plafond de répétitions prévu sur toutes tes ${reps.length} séries (${pattern}). Tu pourrais envisager d'augmenter la charge lors de la prochaine séance.`;
    }
    return `Tu as réalisé exactement ${reps[0]} répétitions sur chacune de tes ${reps.length} séries. Cette régularité suggère que tu maîtrises très bien cette charge.`;
  }

  if (fatigueLevel === 'normal') {
    return `Tu as perdu ${dropFirstToLast} répétition${dropFirstToLast > 1 ? 's' : ''} entre la première et la dernière série (${pattern}). Cette baisse est cohérente avec une fatigue normale.`;
  }
  if (fatigueLevel === 'high' || fatigueLevel === 'extreme') {
    return `Tu as perdu ${dropFirstToLast} répétitions entre la première et la dernière série (${pattern}). Cette chute importante montre que l'intensité était très élevée ou que la récupération entre séries est insuffisante.`;
  }

  return null;
}

/**
 * Compare deux séances (même exercice).
 * @param {number[]} prevSetReps
 * @param {number[]} currSetReps
 * @returns {string|null}
 */
export function buildInterSessionRepComparison(prevSetReps, currSetReps) {
  const prev = (prevSetReps || []).map((r) => Math.max(0, Math.floor(Number(r) || 0)));
  const curr = (currSetReps || []).map((r) => Math.max(0, Math.floor(Number(r) || 0)));
  if (!prev.length || !curr.length) return null;

  const prevPattern = prev.join(' - ');
  const currPattern = curr.join(' - ');
  const prevTotal = prev.reduce((s, r) => s + r, 0);
  const currTotal = curr.reduce((s, r) => s + r, 0);
  const deltaTotal = currTotal - prevTotal;

  const minLen = Math.min(prev.length, curr.length);
  const perSetGains = [];
  for (let i = 0; i < minLen; i += 1) {
    if (curr[i] > prev[i]) perSetGains.push(i + 1);
  }

  if (perSetGains.length === minLen && minLen >= 2 && perSetGains.every((_, i) => curr[i] === prev[i] + 1)) {
    return `Lors de ta dernière séance tu avais réalisé : ${prevPattern}. Aujourd'hui : ${currPattern}. Tu as gagné exactement une répétition sur chacune de tes ${minLen} séries.`;
  }

  if (deltaTotal > 0 && prev.length === curr.length) {
    return `Tu réalises aujourd'hui ${currTotal} répétitions contre ${prevTotal} lors de ta dernière séance, soit ${deltaTotal} répétition${deltaTotal > 1 ? 's' : ''} supplémentaire${deltaTotal > 1 ? 's' : ''} sans modifier la charge.`;
  }

  if (curr.length > prev.length) {
    return `Tu fais désormais ${curr.length} séries (${currPattern}) alors que ta dernière séance n'en comptait que ${prev.length} (${prevPattern}).`;
  }

  return null;
}

/**
 * Volume réalisé vs prévu.
 * @param {number} doneTotal
 * @param {number} plannedTotal
 * @returns {string|null}
 */
export function buildVolumeCompletionInsight(doneTotal, plannedTotal) {
  const done = Math.max(0, Math.floor(Number(doneTotal) || 0));
  const planned = Math.max(0, Math.floor(Number(plannedTotal) || 0));
  if (planned <= 0 || done <= 0) return null;

  const gap = planned - done;
  if (gap <= 0) {
    return `Tu as complété l'objectif de volume (${done} répétitions sur ${planned} prévues).`;
  }
  if (gap <= 3) {
    return `Tu avais prévu ${planned} répétitions. Tu en réalises ${done}. Tu n'étais qu'à ${gap} répétition${gap > 1 ? 's' : ''} de compléter l'objectif.`;
  }
  return `Sur les ${planned} répétitions prévues, tu en as validé ${done}.`;
}

/**
 * Agrège plusieurs insights pour un exercice (point d'entrée Récap).
 * @param {object} params
 * @param {number[]} params.currentSetReps
 * @param {number[]} [params.previousSetReps]
 * @param {number} [params.plannedTotalReps]
 * @param {number} [params.plannedRepsPerSet]
 * @returns {string[]}
 */
export function buildExerciseRepInsights(params) {
  const insights = [];
  const intra = buildIntraSessionRepInsight(params.currentSetReps, {
    plannedRepsPerSet: params.plannedRepsPerSet
  });
  if (intra) insights.push(intra);

  if (params.previousSetReps?.length) {
    const inter = buildInterSessionRepComparison(params.previousSetReps, params.currentSetReps);
    if (inter) insights.push(inter);
  }

  if (params.currentSetReps?.length >= 2) {
    const first = params.currentSetReps[0];
    const last = params.currentSetReps[params.currentSetReps.length - 1];
    if (last > first) {
      insights.push(
        `Tu termines ta dernière série avec ${last} répétitions, au-dessus de ta première (${first}). Ta résistance à la fatigue progresse.`
      );
    }
    const spread = Math.max(...params.currentSetReps) - Math.min(...params.currentSetReps);
    if (spread === 1 && params.currentSetReps.length >= 3) {
      insights.push(
        `La différence entre ta meilleure et ta moins bonne série n'est que d'une répétition (${params.currentSetReps.join(' - ')}) : excellente stabilité.`
      );
    }
  }

  if (params.plannedTotalReps != null && params.currentSetReps?.length) {
    const done = params.currentSetReps.reduce((s, r) => s + Math.max(0, Number(r) || 0), 0);
    const vol = buildVolumeCompletionInsight(done, params.plannedTotalReps);
    if (vol) insights.push(vol);
  }

  const avg =
    params.currentSetReps?.length > 0
      ? params.currentSetReps.reduce((s, r) => s + (Number(r) || 0), 0) / params.currentSetReps.length
      : 0;
  const repIntent = classifyRepRangeIntent(avg);
  const setIntent = classifySetCountIntent(params.currentSetReps?.length || 0);

  if (repIntent === 'max_strength' && setIntent === 'low_volume') {
    insights.push(
      'Zone force maximale : peu de reps par série avec un volume modéré — le système peut estimer ton PR et suivre l\'évolution du 1RM.'
    );
  } else if (repIntent === 'hypertrophy' && setIntent === 'standard') {
    insights.push(
      'Plage hypertrophie classique : le système analyse surtout la progression musculaire, le volume et la capacité à augmenter les reps avant la charge.'
    );
  }

  return insights;
}
