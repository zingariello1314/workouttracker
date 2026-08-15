/**
 * Textes de fiche grade — symbolique + conditions de déblocage (Sport & Exercices).
 */

import {
  gateForGradeId,
  tierRowsForGrade,
  hasConditionalTierRequirements
} from './sportGradeCatalog';
import {
  gateTierForGate,
  pathEThresholdPctForGate,
  pathsRequiredForGate
} from './sportGradeResolution';
import { cumulXpForLevel } from './sportLevelCurve';
import { LADDER_PROGRESS_GATES } from './exerciseGradeDiscovery';
import { exerciseGradeFromSortIndex, EXERCISE_GRADE_LADDER } from './exerciseGradeLadder';
import {
  EXERCISE_PENULTIMATE_SORT_INDEX,
  EXERCISE_FINAL_SORT_INDEX,
  pathsRequiredForTargetSortIndex,
  voieEMinPctForTargetSortIndex
} from './exerciseGradePaths';
import { exerciseMaterialLabelFr } from './exerciseGradeLadderUtils';

const SPORT_GRADE_FLAVOR_DEFAULTS = {
  novice:
    'Le seuil de l’aventure : tu découvres Momentum, tu poses tes premières séances et tu apprends à lire ta progression.',
  adepte:
    'La régularité prend forme — tu n’es plus un visiteur, tu entretiens une vraie dynamique d’entraînement.',
  disciple:
    'La discipline s’installe : volume, répétitions et constance commencent à structurer ton historique.',
  athlete:
    'Tu incarnes le programme — fréquence, reps et données Garmin convergent vers un profil athlétique solide.',
  champion:
    'Le titre des combattants : effort visible, séances qualifiées et maîtrise XP au-dessus de la moyenne.',
  elite:
    'Réservé à une minorité — longévité dans l’effort, score de maîtrise élevé et historique dense.',
  maitre:
    'Maîtrise acquise sur la durée : tu maîtrises ton corps, tes données et ta progression sur des mois.',
  grand_maitre:
    'Excellence durable — palier pour ceux qui ont consolidé volume, séances et engagement sur le très long terme.',
  olympien:
    'L’avant-dernière couronne : tu touches au sommet ; les preuves d’activité deviennent plus exigeantes.',
  parangon:
    'Le sommet absolu de Momentum — réserve ultime pour un profil complet, patient et sans compromis.'
};

const EXERCISE_MATERIAL_FLAVOR_DEFAULTS = {
  wood: 'Le socle : tu apprends le mouvement, tu enregistres tes premières performances et tu construis l’habitude.',
  bronze: 'La consolidation : les pics montent, le volume s’accumule et les coches deviennent régulières.',
  silver: 'Le niveau intermédiaire confirmé — technique et volume commencent à se stabiliser.',
  gold: 'L’excellence accessible : performances solides sur le pic, le cumul et la fréquence des séances.',
  platinum: 'L’élite du mouvement — paliers Or et Platine réservés aux profils les plus complets par exercice.'
};

function fmtNum(n, locale = 'fr-FR') {
  return Number(n).toLocaleString(locale);
}

function voieESportLabel(gate, t) {
  const tier = gateTierForGate(gate);
  const pct = pathEThresholdPctForGate(gate);
  const required = pathsRequiredForGate(gate);
  if (tier === 'final') {
    return t(
      'sport.grades.desc.voieEFinal',
      '4 voies complètes (A–D) ou voie E ≥ {{pct}} % sur tous les axes',
      { pct }
    );
  }
  if (tier === 'penultimate') {
    return t(
      'sport.grades.desc.voieEPenultimate',
      '2 voies complètes ou voie E ≥ {{pct}} % sur tous les axes',
      { pct }
    );
  }
  return t(
    'sport.grades.desc.voieEStandard',
    '1 voie complète (A, B, C ou D) ou voie E ≥ {{pct}} %',
    { pct, required }
  );
}

/** @returns {{ flavor: string, tiersHint: string | null, unlockTitle: string, unlockBody: string, highlight: string | null }} */
export function getSportGradeDescription(gradeId, t) {
  const flavor = t(
    `sport.grades.desc.${gradeId}.flavor`,
    SPORT_GRADE_FLAVOR_DEFAULTS[gradeId] || ''
  );

  const rows = tierRowsForGrade(gradeId);
  const tiersHint = hasConditionalTierRequirements(gradeId)
    ? t(
        'sport.grades.desc.tiersHintConditional',
        'Paliers I / II / III (niv. {{l1}} / {{l2}} / {{l3}}) : niveau XP + km courus et autres preuves — exigences croissantes jusqu’au Palier III.',
        {
          l1: rows[0]?.levelMin,
          l2: rows[1]?.levelMin,
          l3: rows[2]?.levelMin
        }
      )
    : rows.length >= 3
      ? t(
          'sport.grades.desc.tiersHint',
          'Paliers I / II / III (niv. {{l1}} / {{l2}} / {{l3}}) : débloqués par le niveau XP seul, sans épreuve supplémentaire.',
          {
            l1: rows[0].levelMin,
            l2: rows[1].levelMin,
            l3: rows[2].levelMin
          }
        )
      : null;

  if (gradeId === 'novice') {
    return {
      flavor,
      tiersHint,
      unlockTitle: t('sport.grades.desc.unlockTitle', 'Obtenir ce grade mérité'),
      unlockBody: t(
        'sport.grades.desc.novice.unlock',
        'Grade mérité automatique — point de départ sans preuve d’activité. Monte en paliers I→III en gagnant de l’XP.'
      ),
      highlight: null
    };
  }

  const gate = gateForGradeId(gradeId);
  if (!gate) {
    return { flavor, tiersHint, unlockTitle: '', unlockBody: '', highlight: null };
  }

  const voieE = voieESportLabel(gate, t);
  const unlockBody = t(
    gate.kmMin ? 'sport.grades.desc.unlockBodyWithF' : 'sport.grades.desc.unlockBody',
    gate.kmMin
      ? 'Niveau {{level}} ({{xp}} XP cumulés) + {{voieE}}. Seuils voies : A maîtrise {{m}} · B {{s}} séances (≥{{min}} min) · C {{r}} reps · D {{k}} kcal actives{{kmLine}}.'
      : 'Niveau {{level}} ({{xp}} XP cumulés) + {{voieE}}. Seuils voies : A maîtrise {{m}} · B {{s}} séances (≥{{min}} min) · C {{r}} reps · D {{k}} kcal actives.',
    {
      level: gate.levelMin,
      xp: fmtNum(cumulXpForLevel(gate.levelMin)),
      voieE,
      m: fmtNum(gate.masteryMin),
      s: gate.sessionsMin,
      min: gate.minutesMin,
      r: fmtNum(gate.repsMin),
      k: fmtNum(gate.kcalMin),
      kmLine: gate.kmMin
        ? t('sport.grades.desc.kmLine', ' · F {{km}} km courus (endurance + Garmin)', {
            km: fmtNum(gate.kmMin)
          })
        : ''
    }
  );

  const tier = gateTierForGate(gate);
  let highlight = null;
  if (tier === 'final') {
    highlight = t(
      'sport.grades.desc.highlightFinal',
      'Dernière frontière — exigences voies au maximum (4 axes ou 90 % partout).'
    );
  } else if (tier === 'penultimate') {
    highlight = t(
      'sport.grades.desc.highlightPenultimate',
      'Avant-dernier grade — il faut déjà 2 voies complètes ou 80 % sur tous les axes.'
    );
  }

  return {
    flavor,
    tiersHint,
    unlockTitle: t('sport.grades.desc.unlockTitle', 'Obtenir ce grade mérité'),
    unlockBody,
    highlight
  };
}

/** Description fiche matériau (Bois → Platine). */
export function getExerciseMaterialDescription(material, t) {
  const label = exerciseMaterialLabelFr(material);
  const flavor = t(
    `sport.exerciseGrades.desc.material.${material}`,
    EXERCISE_MATERIAL_FLAVOR_DEFAULTS[material] || `${label} — paliers par exercice selon pic, volume et coches.`
  );
  const tiers = ['I', 'II', 'III']
    .map((roman) => {
      const idx = ['wood', 'bronze', 'silver', 'gold', 'platinum'].indexOf(material) * 3 + ['I', 'II', 'III'].indexOf(roman);
      const gate = LADDER_PROGRESS_GATES[Math.min(idx, LADDER_PROGRESS_GATES.length - 1)];
      return t(
        'sport.exerciseGrades.desc.materialTierLine',
        '{{label}} {{roman}} — pic {{p}}, vol. {{v}}, {{c}} coches',
        {
          label,
          roman,
          p: fmtNum(gate.peak),
          v: fmtNum(gate.life),
          c: fmtNum(gate.checks)
        }
      );
    })
    .join(' · ');

  return {
    flavor,
    tiersHint: t(
      'sport.exerciseGrades.desc.materialTiers',
      'Seuils indicatifs par palier : {{tiers}}',
      { tiers }
    ),
    unlockTitle: t('sport.exerciseGrades.desc.unlockTitle', 'Monter de grade sur un exercice'),
    unlockBody: t(
      'sport.exerciseGrades.desc.materialUnlock',
      'Voie A (pic du jour), B (reps totales), C (coches) ou voie E (≥ 70 % sur les 3 axes). Platine II/III : 2 puis 3 voies ou polyvalence 80–90 %.'
    ),
    highlight: null
  };
}

/** Description fiche exercice pour un palier précis (sortIndex). */
export function getExerciseGradeDescription(sortIndex, t) {
  const idx = Math.max(0, Math.min(EXERCISE_GRADE_LADDER.length - 1, Math.floor(Number(sortIndex) || 0)));
  const grade = exerciseGradeFromSortIndex(idx);
  const gate = LADDER_PROGRESS_GATES[Math.min(idx, LADDER_PROGRESS_GATES.length - 1)];
  const material = grade.material;
  const roman = grade.label.split(' ').pop();

  const flavor = t(
    `sport.exerciseGrades.desc.grade.${grade.id}.flavor`,
    t(
      'sport.exerciseGrades.desc.gradeGeneric',
      'Palier {{label}} — {{material}} {{roman}} : performance du jour, volume cumulé et régularité des coches.',
      {
        label: grade.label,
        material: exerciseMaterialLabelFr(material),
        roman
      }
    )
  );

  const pathsRequired = pathsRequiredForTargetSortIndex(idx);
  const ePct = voieEMinPctForTargetSortIndex(idx);
  let voieE;
  if (idx >= EXERCISE_FINAL_SORT_INDEX) {
    voieE = t(
      'sport.exerciseGrades.desc.voieEFinal',
      '3 voies complètes ou voie E ≥ {{pct}} %',
      { pct: ePct }
    );
  } else if (idx >= EXERCISE_PENULTIMATE_SORT_INDEX) {
    voieE = t(
      'sport.exerciseGrades.desc.voieEPenultimate',
      '2 voies complètes ou voie E ≥ {{pct}} %',
      { pct: ePct }
    );
  } else {
    voieE = t(
      'sport.exerciseGrades.desc.voieEStandard',
      '1 voie complète ou voie E ≥ {{pct}} %',
      { pct: ePct }
    );
  }

  const unlockBody = t(
    'sport.exerciseGrades.desc.unlockBody',
    'Atteindre {{label}} : pic ≥ {{p}} · volume ≥ {{v}} · {{c}} coches — ou {{voieE}}.',
    {
      label: grade.label,
      p: fmtNum(gate.peak),
      v: fmtNum(gate.life),
      c: fmtNum(gate.checks),
      voieE
    }
  );

  let highlight = null;
  if (idx >= EXERCISE_FINAL_SORT_INDEX) {
    highlight = t(
      'sport.exerciseGrades.desc.highlightFinal',
      'Dernier palier de l’échelle — exigences maximales sur cet exercice.'
    );
  } else if (idx >= EXERCISE_PENULTIMATE_SORT_INDEX) {
    highlight = t(
      'sport.exerciseGrades.desc.highlightPenultimate',
      'Avant-dernier palier — conditions voies renforcées.'
    );
  }

  return {
    flavor,
    tiersHint: null,
    unlockTitle: t('sport.exerciseGrades.desc.unlockTitle', 'Conditions pour ce palier'),
    unlockBody,
    highlight
  };
}
