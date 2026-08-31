/**
 * Rendu texte des InterpretationCandidate (couche finale).
 */

/**
 * @typedef {import('./trainingRelationEngine.js').InterpretationCandidate} InterpretationCandidate
 * @typedef {import('./userTrainingState.js').UserTrainingState} UserTrainingState
 */

function cap(s) {
  const t = String(s || '').trim();
  if (!t) return '';
  return t.charAt(0).toUpperCase() + t.slice(1);
}

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

    case 'training_discontinuity':
      return [
        'La période récente est marquée par une forte baisse d\'exposition à l\'entraînement',
        vol ? ` (volume ${vol}` : '',
        m.frequencyDeltaPct != null ? `, fréquence ${fmtPct(m.frequencyDeltaPct)}` : '',
        vol ? ')' : '',
        m.decliningExerciseCount >= 2
          ? `. Plusieurs exercices reculent en même temps, mais la baisse de régularité est trop nette pour y lire déjà une perte de capacité`
          : '. Le signal principal n\'est pas la performance brute, mais la continuité',
        '. Avant d\'augmenter le stimulus, retrouver une fréquence plus stable permettra de distinguer une vraie régression d\'un simple manque d\'exposition.',
        goalBit
      ].join('');

    case 'program_gap_adherence':
      return [
        m.programCompletionPct != null
          ? `Le volume réalisé reste inférieur au plan (~${m.programCompletionPct} %)`
          : 'Le réalisé reste en deçà du plan',
        '. L\'écart vient surtout de séances manquées plutôt que d\'exercices abandonnés en cours de séance',
        m.justifiedDays ? ` (${m.justifiedDays} jour(s) justifié(s) sur la période)` : '',
        ' : le levier est la régularité, pas forcément une prescription trop élevée.',
        goalBit
      ].join('');

    case 'program_gap_mixed':
      return [
        m.programCompletionPct != null
          ? `Le réalisé reste nettement sous le plan (~${m.programCompletionPct} %)`
          : 'Le réalisé reste nettement sous le plan',
        '. On ne tranche pas encore entre jours manqués et séances raccourcies',
        m.sessionAlignment != null ? ` (alignement séance ~${Math.round(m.sessionAlignment)}/100)` : '',
        ' : le signal utile est l\'écart d\'exécution, pas un chiffre isolé de volume.',
        goalBit
      ].join('');

    case 'program_gap_completion':
      return [
        m.programCompletionPct != null
          ? `Le réalisé est inférieur au prévu (~${m.programCompletionPct} %)`
          : 'Le réalisé est inférieur au prévu',
        m.sessionAlignment != null ? ` avec des séances souvent incomplètes (alignement ~${Math.round(m.sessionAlignment)}/100)` : '',
        '. La différence vient surtout de séances commencées mais raccourcies, plutôt que de journées entièrement sautées.',
        goalBit
      ].join('');

    case 'exercise_specific_abandonment': {
      const ex = c.context?.exerciseName || 'Un exercice du programme';
      return [
        `${ex} est régulièrement laissé de côté alors que le reste de la séance est davantage réalisé`,
        m.leastCheckedPct != null ? ` (~${m.leastCheckedPct} % de coches)` : '',
        '. Ce n\'est probablement pas un problème général d\'adhérence, mais un bloc mal placé, trop lourd, ou peu utile à tes yeux.',
        goalBit
      ].join('');
    }

    case 'push_pull_stimulus':
    case 'structural_imbalance':
      return [
        m.pushPct != null
          ? `Le haut du corps reste nettement plus exposé en poussée (~${m.pushPct} % push, ratio ${m.pushPullRatio ?? '—'})`
          : 'Le volume de poussée domine nettement le tirage',
        '. Tant que les performances de tirage tiennent, le problème n\'est pas une faiblesse évidente du dos : c\'est surtout une répartition du stimulus qui peut limiter l\'équilibre à moyen terme.',
        goalBit
      ].join('');

    case 'exposure_vs_capacity':
      return [
        vol ? `La charge a diminué (${vol})` : 'La charge d\'entraînement a diminué',
        ' alors que tes performances sur les mouvements suivis ne s\'effondrent pas',
        perf ? ` (${perf})` : '',
        '. Ça ressemble davantage à une baisse d\'exposition qu\'à une perte de capacité : la priorité est de retransformer ce niveau en travail régulier, pas d\'ajouter du volume d\'emblée.',
        goalBit
      ].join('');

    case 'continuity_over_capacity':
      return [
        'Ton historique parle davantage d\'une difficulté de continuité que d\'un manque de capacité',
        vol ? ` (charge récente ${vol}` : '',
        m.frequencyDeltaPct != null ? `, fréquence ${fmtPct(m.frequencyDeltaPct)}` : '',
        vol ? ')' : '',
        '. Les ruptures de rythme pèsent plus que le volume absolu : le levier à long terme est la stabilité de la fréquence, pas une hausse permanente de charge.',
        goalBit
      ].join('');

    case 'adherence_gap':
      return [
        m.exoPct != null && m.stretchPct != null
          ? `Les séances d'exercices sont bien plus tenues (~${m.exoPct} %) que les étirements (~${m.stretchPct} %)`
          : 'Les étirements restent nettement moins tenus que le travail de force',
        '. Sur la durée, cet écart de pratique pèse davantage qu\'un déficit de capacité : la mobilité prévue n\'entre presque pas dans l\'exposition réelle.',
        goalBit
      ].join('');

    case 'exposure_rhythm': {
      const x = c.context || {};
      const rateNow = m.currWeekRate != null ? `soit ~${m.currWeekRate} séance(s)/sem` : '';
      const rateHabit = m.habitWeekRate != null ? `~${m.habitWeekRate}/sem` : '';
      let conclusion =
        'Conclusion : le signal utile est la densité de pratique, pas seulement le volume d\'une séance isolée.';
      if (x.rarer) {
        conclusion =
          'Conclusion : tu t\'exposes moins souvent et probablement moins complètement — retrouver 1–2 séances, même plus courtes, rendrait la lecture de tes progrès beaucoup plus fiable.';
      } else if (x.denser) {
        conclusion =
          'Conclusion : la période affichée est plus dense que ton rythme d\'avant ; surveille récupération et qualité d\'exécution plutôt que d\'ajouter encore du volume.';
      }
      return [
        `${cap(x.nowLabel)} tu t'es entraîné ${m.sessionsCurrent ?? 0} fois`,
        m.avgExCurrent ? ` (${m.avgExCurrent} exercices en moyenne par séance)` : '',
        x.currentMuscles ? `, surtout ${x.currentMuscles}` : '',
        `. ${cap(x.beforeLabel)} c'était ${m.sessionsHabit ?? 0} séances`,
        rateHabit ? ` (${rateHabit})` : '',
        m.avgExHabit ? ` avec ~${m.avgExHabit} exercices/séance` : '',
        x.habitMuscles ? `, davantage autour de ${x.habitMuscles}` : '',
        `. ${rateNow ? `${cap(x.nowLabel)} ${rateNow}. ` : ''}${conclusion}`,
        goalBit
      ].join('');
    }

    case 'muscle_coverage_shift': {
      const x = c.context || {};
      const drop = x.droppedLabels
        ? ` Des zones présentes ${x.beforeLabel} reculent nettement ici (${x.droppedLabels}).`
        : '';
      return [
        `${cap(x.nowLabel)} l'exposition musculaire se concentre sur ${x.currentList || 'quelques groupes'}.`,
        ` ${cap(x.beforeLabel)} la couverture était ${x.habitList || 'plus large'}.`,
        drop,
        ' Conclusion : ce n\'est pas seulement « moins de sport » — le mélange de muscles travaillés a changé, donc une baisse de reps sur un mouvement peut venir d\'un calendrier plus étroit plutôt que d\'une régression isolée.',
        goalBit
      ].join('');
    }

    case 'exercise_strengths': {
      const items = c.context?.items || [];
      const list = items
        .map((e) => `${e.name} (${e.first} → ${e.last} reps sur ${e.sessions} séances)`)
        .join(' ; ');
      return [
        `${cap(c.context?.nowLabel)} tes meilleurs signaux de progression sont : ${list || 'quelques mouvements suivis'}.`,
        ' Conclusion : ces exercices tiennent ou montent malgré le reste du tableau — c\'est la base à préserver (fréquence et technique) avant de chercher à tout augmenter.',
        goalBit
      ].join('');
    }

    case 'exercise_watchlist': {
      const items = c.context?.items || [];
      const list = items.map((e) => `${e.name} (${e.first} → ${e.last} reps)`).join(' ; ');
      const hold = (c.context?.holdingNames || []).join(', ');
      return [
        `${cap(c.context?.nowLabel)} plusieurs mouvements reculent sur leurs dernières séances : ${list}.`,
        hold
          ? ` D'autres restent stables (${hold}), donc le signal n'est pas forcément une fatigue générale.`
          : ' Sans contre-exemple clair sur d\'autres exos, il faut croiser avec la fréquence des séances.',
        ' Conclusion : traite ces baisses comme un cluster local tant que le reste tient ; ne « rattrape » pas les reps d\'emblée si les séances sont plus rares.',
        goalBit
      ].join('');
    }

    case 'exercise_long_arc': {
      const x = c.context || {};
      const up = (x.improving || []).join(' ; ');
      const down = (x.fading || []).join(' ; ');
      return [
        `Sur ~90 jours (${x.longSessions ?? '—'} séances), `,
        up ? `la trajectoire monte surtout sur ${up}` : 'peu de mouvements montrent une hausse nette',
        down ? `, tandis que ${down} s'essoufflent` : '',
        '. Conclusion : le long terme distingue les habitudes qui construisent un niveau de celles qui ne font que passer — priorise la fréquence des premiers avant d\'empiler de nouveaux exercices.',
        goalBit
      ].join('');
    }

    case 'muscle_vs_quarter': {
      const x = c.context || {};
      return [
        `Sur 90 jours tes zones les plus chargées sont ${x.longList || 'réparties'}.`,
        ` ${cap(x.nowLabel)} tu es plutôt sur ${x.currentList || 'un mix plus étroit'}`,
        x.longTop ? ` (le ${x.longTop} domine souvent le trimestre)` : '',
        '. Conclusion : si la période courte ne ressemble plus au trimestre, interprète les PR et les baisses à l\'échelle de ce mix récent, pas comme un verdict sur tout ton profil musculaire.',
        goalBit
      ].join('');
    }

    case 'composed_horizon_read': {
      const body = String(c.context?.body || '').trim();
      if (!body) return null;
      const label = c.context?.confidenceLabel || 'modérée';
      const days = c.context?.sampleDays || 30;
      return `${body}\n\nConfiance : ${label} · Échantillon : ${days} j`;
    }

    case 'coach_reading': {
      const title = String(c.context?.title || '').trim();
      const body = String(c.context?.body || '').trim();
      if (!body) return null;
      const ev = String(c.context?.evidenceLine || '').trim();
      const confLine =
        c.context?.confidenceLabel && c.context?.sampleDays
          ? `Confiance : ${c.context.confidenceLabel} · Échantillon : ${c.context.sampleDays} j`
          : '';
      return [title, body, ev, confLine].filter(Boolean).join('\n\n');
    }

    default:
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
      const text = renderInterpretationText(c, state);
      if (!text) return null;
      return { ...c, text };
    })
    .filter(Boolean);
}
