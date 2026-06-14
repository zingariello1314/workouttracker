import { guide, ex, st, tx } from './pathologyHelpers';

/** Guides transversaux : prévention, figures SW, principes rééducation */
export const pathologyMeta = [
  guide({
    id: 'prev_insurance_exercises',
    name: 'Exercices « assurance vie » (course + street)',
    shortName: 'Assurance vie',
    bodyZone: 'dos',
    order: 1,
    summary:
      'Si tu cours ET fais du street workout, ces exercices préviennent le plus de blessures en renforçant pied, hanche, épaule et tronc.',
    items: [
      ex('hip thrust', '3×12', 'Fessiers'),
      ex('fentes bulgares', '3×8', 'Unilatéral'),
      ex('mollets debout', '3×20', 'Mollets'),
      ex('mollets assis', '3×20', 'Soléaire'),
      st('mob_hanche_clamshells', '3×15', 'Moyen fessier'),
      ex('monster walk', '3×15 m', 'Moyen fessier'),
      ex('face pull', '3×15', 'Épaule postérieure'),
      ex('rotation externe élastique', '3×15', 'Coiffe'),
      ex('bird dog', '3×10', 'Core'),
      ex('dead bug', '3×10', 'Core'),
      ex('équilibre unipodal', '3×1 min', 'Proprioception')
    ],
    prevention: [
      '2 à 3 séances courtes / semaine suffisent en prévention',
      'Prioriser la qualité et la facilité ressentie (GTG compatible)'
    ],
    rehabNote:
      'Ces exercices ne remplacent pas une rééducation ciblée si tu es déjà blessé — adapte ou consulte.'
  }),
  guide({
    id: 'prev_neglected_zones',
    name: 'Les 3 zones les plus souvent négligées',
    shortName: '3 zones oubliées',
    bodyZone: 'pied',
    order: 2,
    summary:
      'Pied, moyen fessier et coiffe des rotateurs sont impliqués dans une grande partie des blessures genou / hanche / cheville / épaule.',
    sections: [
      {
        title: '1. Le pied',
        items: [
          st('mob_cheville_short_foot', '3×10', 'Toe yoga / pied court'),
          tx('Écartement actif des orteils', '2×1 min', 'Mobilité'),
          st('mob_cheville_barefoot_walking', '2–5 min', 'Marche pieds nus contrôlée')
        ]
      },
      {
        title: '2. Le moyen fessier',
        items: [
          st('mob_hanche_clamshells', '3×15', 'Clamshell'),
          ex('monster walk', '3×15 m', 'Monster walk'),
          ex('step-down contrôlé', '3×10', 'Step-down')
        ]
      },
      {
        title: '3. Coiffe des rotateurs',
        items: [
          ex('rotation externe élastique', '3×15', 'Rotation externe'),
          ex('face pull', '3×15', 'Face pull'),
          ex('y raise debout', '3×15', 'Y raise')
        ]
      }
    ],
    prevention: ['Intégrer ces blocs en échauffement ou en fin de séance 2–3× / semaine']
  }),
  guide({
    id: 'prev_hard_recovery_running',
    name: 'Blessures les plus longues à récupérer — course',
    shortName: 'Récup difficile (course)',
    bodyZone: 'genou',
    order: 3,
    summary: 'À anticiper : patience, charge réduite et renforcement tendon/muscle cible.',
    bulletList: [
      "Tendinopathie d'Achille",
      'Fasciite plantaire',
      "Syndrome de l'essuie-glace chronique",
      'Syndrome des loges',
      'Fracture de fatigue',
      'Tendinopathie des ischios proximaux'
    ],
    rehabNote:
      'Réduire la charge, renforcer progressivement, corriger les erreurs d’entraînement, reprise graduelle.'
  }),
  guide({
    id: 'prev_hard_recovery_strength',
    name: 'Blessures les plus longues à récupérer — street / muscu',
    shortName: 'Récup difficile (SW)',
    bodyZone: 'coude',
    order: 4,
    summary: 'Souvent liées au volume de grip, overhead ou figures avancées.',
    bulletList: [
      'Épicondylite latérale',
      'Épitrochléite',
      'Tendinopathie du long biceps',
      'Conflit sous-acromial',
      'Tendinopathie rotulienne',
      'Instabilité scapulaire',
      'Tendinopathies des doigts'
    ],
    rehabNote:
      'Les étirements seuls guérissent rarement : charge ↓, renforcement progressif, correction technique, retour progressif.'
  }),
  guide({
    id: 'prev_rehab_principles',
    name: 'Principes clés de rééducation',
    shortName: 'Principes rééducation',
    bodyZone: 'dos',
    order: 5,
    summary: 'Ce qui règle durablement la majorité des tendinopathies et syndromes de surcharge.',
    bulletList: [
      'Diminution temporaire de la charge (pas forcément arrêt total)',
      'Renforcement progressif du tendon / muscle concerné (souvent excentrique ou isométrique)',
      'Correction des erreurs d’entraînement (volume, technique, récupération)',
      'Retour progressif au sport (règle des 10 %, tests sans douleur)',
      'Sommeil, nutrition et gestion du stress comme multiplicateurs'
    ],
    rehabNote:
      'Contenu éducatif — consulte un professionnel de santé en cas de doute, douleur nocturne, fièvre ou déficit neurologique.'
  }),
  guide({
    id: 'prev_figure_front_lever',
    name: 'Figures SW — Front lever',
    shortName: 'Front lever',
    bodyZone: 'epaule',
    order: 10,
    summary: 'Blessures fréquentes liées à la figure.',
    bulletList: [
      'Tendinopathie du grand dorsal',
      'Tendinopathie du long biceps',
      'Épicondylite',
      'Douleur sternale',
      'Tendinite des fléchisseurs des doigts'
    ],
    items: [
      ex('rotation externe élastique', '3×15', 'Prévention épaule'),
      ex('ouverture main élastique', '3×20', 'Équilibre avant-bras'),
      tx('Progression par tuck → advanced tuck → straddle', '', 'Technique')
    ]
  }),
  guide({
    id: 'prev_figure_planche',
    name: 'Figures SW — Planche',
    shortName: 'Planche',
    bodyZone: 'poignet',
    order: 11,
    summary: 'Charge importante poignets et épaules.',
    bulletList: [
      'Tendinite du poignet',
      'Conflit sous-acromial',
      'Douleur long biceps',
      'Douleur pectorale'
    ],
    items: [
      st('mob_poignet_nerve_glide', '10 reps', 'Poignet'),
      ex('pompes scapulaires', '3×15', 'Scapula'),
      ex('face pull', '3×15', 'Épaule')
    ]
  }),
  guide({
    id: 'prev_figure_handstand',
    name: 'Figures SW — Handstand',
    shortName: 'Handstand',
    bodyZone: 'cou',
    order: 12,
    summary: 'Appuis poignet + compression cervicale.',
    bulletList: [
      'Syndrome du canal carpien',
      'Tendinites des poignets',
      'Cervicalgies',
      'Conflits d’épaule'
    ],
    items: [
      st('face_au_mur_menton_rentre', '3×15', 'Cou'),
      st('mob_poignet_nerve_glide', '10 reps', 'Nerf médian'),
      ex('rotation externe élastique', '3×15', 'Épaules')
    ]
  }),
  guide({
    id: 'prev_figure_muscle_up',
    name: 'Figures SW — Muscle-up',
    shortName: 'Muscle-up',
    bodyZone: 'epaule',
    order: 13,
    summary: 'Mouvement explosif à fort stress épaule / coude.',
    bulletList: [
      'Lésion SLAP',
      'Long biceps',
      'Épicondylite',
      'Tendinite pectorale'
    ],
    items: [
      ex('face pull', '3×15', 'Pré-activation'),
      ex('rotation externe élastique', '3×15', 'Coiffe'),
      tx('Maîtriser pull-up strict + dip strict séparément avant enchaînement', '', 'Prérequis')
    ]
  })
];
