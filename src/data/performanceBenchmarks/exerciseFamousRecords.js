/**
 * Repères publics affichés dans le détail d'un insight (records France / monde / références).
 * `value` : texte lisible ; `seconds` optionnel pour comparaison numérique (maintiens).
 */

export const EXERCISE_FAMOUS_RECORDS = {
  gainage_static: [
    { scope: 'Record Guinness (maintien)', holder: 'Mao Weidong', value: '8 h 15 min', seconds: 29700 },
    { scope: 'Référence amateur confirmé', holder: '—', value: '5–6 min', seconds: 330 },
    { scope: 'Bon niveau loisir', holder: '—', value: '2 min', seconds: 120 }
  ],
  plank_straight_arm: [
    { scope: 'Référence amateur avancé', holder: '—', value: '90 s', seconds: 90 },
    { scope: 'Bon niveau', holder: '—', value: '60 s', seconds: 60 },
    { scope: 'Débutant structuré', holder: '—', value: '30 s', seconds: 30 }
  ],
  side_plank: [
    { scope: 'Bon niveau par côté', holder: '—', value: '60 s', seconds: 60 },
    { scope: 'Référence amateur', holder: '—', value: '45 s', seconds: 45 }
  ],
  wall_sit: [
    { scope: 'Référence amateur', holder: '—', value: '2 min', seconds: 120 },
    { scope: 'Bon niveau', holder: '—', value: '3 min', seconds: 180 }
  ],
  pullups_strict: [
    { scope: 'Record mondial (24 h)', holder: 'Réf. Guinness', value: '8 794 reps', seconds: null },
    { scope: 'Série stricte élite', holder: '—', value: '30+ reps', seconds: null },
    { scope: 'Avancé street', holder: '—', value: '20 reps', seconds: null }
  ],
  pushups: [
    { scope: 'Record mondial (24 h)', holder: 'Réf. Guinness', value: '10 507 reps', seconds: null },
    { scope: 'Série amateur forte', holder: '—', value: '75 reps', seconds: null }
  ],
  dips: [
    { scope: 'Série amateur avancée', holder: '—', value: '30 reps', seconds: null },
    { scope: 'Excellent', holder: '—', value: '40+ reps', seconds: null }
  ],
  muscle_up: [
    { scope: 'Élite street workout', holder: '—', value: '15+ reps', seconds: null },
    { scope: 'Très bon', holder: '—', value: '10 reps', seconds: null }
  ],
  '5k': [
    { scope: 'Record mondial', holder: 'Kipchoge / Bekele', value: '12:35', seconds: 755 },
    { scope: 'Élite nationale France', holder: '—', value: '~14:00', seconds: 840 },
    { scope: 'Bon amateur', holder: '—', value: '27:00', seconds: 1620 }
  ],
  '10k': [
    { scope: 'Record mondial', holder: 'Cheptegei', value: '26:11', seconds: 1571 },
    { scope: 'Élite amateur', holder: '—', value: '35:00', seconds: 2100 },
    { scope: 'Bon amateur', holder: '—', value: '50:00', seconds: 3000 }
  ],
  marathon: [
    { scope: 'Record mondial', holder: 'Kipchoge', value: '2:01:09', seconds: 7269 },
    { scope: 'Élite amateur', holder: '—', value: '2:40:00', seconds: 9600 },
    { scope: 'Bon amateur', holder: '—', value: '4:00:00', seconds: 14400 }
  ]
};
