/**
 * Rendu texte des InterpretationCandidate (couche finale).
 */

/**
 * @typedef {import('./trainingRelationEngine.js').InterpretationCandidate} InterpretationCandidate
 * @typedef {import('./userTrainingState.js').UserTrainingState} UserTrainingState
 */

function fmtPct(n) {
  if (n == null || !Number.isFinite(n)) return null;
  const sign = n > 0 ? '+' : '';
  return `${sign}${Math.round(n)} %`;
}

function phaseHint(phase) {
  if (phase === 'RETURNING') return ' après ta reprise';
  if (phase === 'REBUILDING') return ' en phase de reconstruction';
  if (phase === 'PLATEAU') return ' malgré une phase de stagnation';
  return '';
}

const GOAL_LABELS = {
  muscular_defined: 'hypertrophie / définition',
  strength_lean: 'force sèche',
  endurance_lean: 'endurance',
  balanced_functional: 'polyvalence',
  street_skills: 'skills street'
};

/**
 * @param {InterpretationCandidate} c
 * @param {UserTrainingState|null} [state]
 * @returns {string|null}
 */
export function renderInterpretationText(c, state = null) {
  if (!c?.type) return null;

  const m = c.metrics || {};
  const vol = fmtPct(m.volumeDeltaPct);
  const sleep = fmtPct(m.sleepDeltaPct);
  const diff = fmtPct(m.difficultyDeltaPct);
  const perf = fmtPct(m.performanceMomentumPct);
  const phase = c.context?.phase;
  const goalKey = c.context?.goal;
  const goalLabel = goalKey ? GOAL_LABELS[goalKey] || null : null;
  const goalBit = goalLabel ? ` (objectif ${goalLabel})` : '';

  switch (c.type) {
    case 'adaptation_with_recovery_warning':
      return [
        vol
          ? `Ta progression continue malgré une hausse ${Math.abs(m.volumeDeltaPct ?? 0) >= 20 ? 'importante' : 'nette'} du volume (${vol})${phaseHint(phase)}`
          : `Ta progression continue malgré une montée de charge${phaseHint(phase)}`,
        sleep || diff
          ? `, mais ${[sleep ? `ton sommeil se dégrade (${sleep})` : null, diff ? `tes séances deviennent plus difficiles (${diff})` : null].filter(Boolean).join(' et ')}`
          : '',
        '. Pour l\'instant, ta performance suggère que tu t\'adaptes encore à la charge, mais les signaux de récupération commencent à devenir limitants.'
      ].join('');

    case 'possible_overreach':
      return [
        vol ? `Volume en hausse (${vol})` : 'Charge en hausse',
        perf ? ` avec performance en retrait (${perf})` : ' avec performance en baisse',
        sleep || diff
          ? ` ; ${[sleep ? `sommeil ${sleep}` : null, diff ? `difficulté perçue ${diff}` : null].filter(Boolean).join(', ')}`
          : '',
        ' — profil compatible avec une surcharge possible : une semaine plus légère ou plus de repos actif peut éviter une cassure.'
      ].join('');

    case 'adaptation_success':
      return [
        vol ? `Volume ${vol}` : 'Charge montée',
        perf ? ` et performance ${perf}` : ' et progression visible',
        ' — adaptation réussie pour l\'instant',
        recoveryOkPhrase(state),
        goalBit,
        '.'
      ].join('');

    case 'adaptation_under_load':
      return [
        vol ? `Volume ${vol}` : 'Charge en hausse',
        ' : tes performances tiennent le cap',
        perf ? ` (${perf} vs ta baseline récente)` : '',
        recoveryOkPhrase(state) ? ` malgré ${recoveryOkPhrase(state)}` : '',
        ' — ça ressemble davantage à une adaptation qu\'à une surcharge.',
        goalBit,
        '.'
      ].join('');

    case 'effort_without_return':
      return [
        `Adhérence solide${m.programCompletionPct != null ? ` (~${m.programCompletionPct} % du plan)` : ''}`,
        vol ? ` et volume ${vol}` : '',
        ', mais progression encore stable — le programme est bien exécuté sans gain net pour l\'instant ; varier l\'intensité, la technique ou le focus peut débloquer la suite.',
        goalBit,
        '.'
      ].join('');

    case 'recovery_limiting':
      return [
        sleep ? `Sommeil en baisse (${sleep})` : 'Récupération fragilisée',
        perf ? ` et performance ${perf}` : ' et performances en retrait',
        ' — la récupération semble devenir le facteur limitant avant même la charge d\'entraînement.',
        goalBit,
        '.'
      ].join('');

    case 'efficient_progression':
      return [
        perf ? `Progression ${perf}` : 'Progression nette',
        ' sans monter fortement le volume — rendement favorable : tu gagnes sans payer un coût de charge élevé.',
        goalBit,
        '.'
      ].join('');

    case 'successful_return':
      return [
        'Reprise progressive',
        vol ? ` (volume ${vol})` : '',
        perf ? ` avec performance ${perf}` : ' avec niveau qui revient',
        ' — retour au niveau précédent en cours plutôt qu\'un simple redémarrage.',
        goalBit,
        '.'
      ].join('');

    case 'plateau_despite_volume':
      return [
        'Stagnation sur les performances',
        vol ? ` malgré volume ${vol}` : ' malgré plus de travail',
        ' — le corps n\'accroche pas encore : changer l\'angle (intensité, exercices, deload) vaut plus qu\'ajouter du volume.',
        goalBit,
        '.'
      ].join('');

    case 'natural_deload':
      return [
        vol ? `Volume ${vol}` : 'Volume en baisse',
        ' avec performances maintenues — décharge naturelle ou creux utile avant de remonter progressivement.',
        goalBit,
        '.'
      ].join('');

    case 'contradiction_sleep_perf':
      return [
        sleep ? `Sommeil en hausse (${sleep})` : 'Sommeil qui s\'améliore',
        perf ? ` mais performance ${perf}` : ' mais performances en baisse',
        ' — contradiction à creuser (fatigue résiduelle, qualité du sommeil vs durée, stress ou charge musculaire locale).',
        goalBit,
        '.'
      ].join('');

    case 'pr_under_fatigue': {
      const ex = c.context?.exerciseName || 'un exercice clé';
      return [
        `Tu viens de battre un record sur ${ex}`,
        diff ? ` (${diff} de difficulté perçue récemment)` : ' malgré une fatigue montante',
        ' — performance intéressante, mais ce n\'est peut‑être pas le moment d\'augmenter encore le volume.',
        goalBit,
        '.'
      ].join('');
    }

    case 'costly_progression':
      return [
        vol ? `Progression obtenue avec un volume ${vol}` : 'Progression obtenue avec plus de charge',
        m.progressionEfficiency != null
          ? ` — rendement modeste (efficacité ~${m.progressionEfficiency})`
          : ' — rendement modeste par rapport à l\'effort',
        ' : le résultat est là, mais le coût d\'entraînement est élevé ; consolider avant d\'ajouter.',
        goalBit,
        '.'
      ].join('');

    case 'pr_outlier': {
      const ex = c.context?.exerciseName || 'un exercice';
      return [
        `Pic récent sur ${ex} (${m.prReps ?? '—'} reps)`,
        ' — probablement isolé plutôt qu\'un nouveau niveau stable ; confirme sur 2–3 séances avant d\'augmenter la charge.',
        goalBit,
        '.'
      ].join('');
    }

    case 'level_established': {
      const ex = c.context?.exerciseName || 'un exercice clé';
      return [
        `Nouveau palier consolidé sur ${ex}`,
        m.maxReps != null ? ` (~${m.maxReps} reps de façon répétée)` : '',
        ' — ce n\'est pas qu\'un record ponctuel : ton niveau réel semble monter.',
        goalBit,
        '.'
      ].join('');
    }

    case 'transition_narrative':
      return [(c.evidence || []).join(' ; '), goalBit ? ` ${goalBit}.` : '.'].join('').replace(/\.\./g, '.');

    case 'progression_accelerating':
      return [
        m.progressionVelocityPerWeek != null
          ? `Ta vitesse de progression accélère (~+${m.progressionVelocityPerWeek} reps/sem`
          : 'Ta progression accélère',
        m.progressionAcceleration != null ? `, accélération +${m.progressionAcceleration})` : ')',
        ' — dynamique favorable ; reste prudent sur le volume pour ne pas casser la courbe.',
        goalBit,
        '.'
      ].join('');

    default:
      if (c.text) return c.text;
      if (c.evidence?.length) {
        return `${c.evidence.join(' ; ')}${goalBit ? ` ${goalBit}` : ''}.`;
      }
      return null;
  }
}

function recoveryOkPhrase(state) {
  if (!state?.recovery) return '';
  if (state.recovery.value === 'sufficient') return ' avec récupération correcte';
  if (state.recovery.value === 'uncertain') return ' avec récupération mitigée';
  return '';
}

/**
 * @param {InterpretationCandidate[]} interpretations
 * @param {UserTrainingState|null} [state]
 * @returns {InterpretationCandidate[]}
 */
export function renderInterpretations(interpretations, state = null) {
  if (!Array.isArray(interpretations)) return [];
    return interpretations
    .map((c) => {
      const text = renderInterpretationText(c, state) || c.text;
      if (!text) return null;
      return { ...c, text };
    })
    .filter(Boolean);
}
