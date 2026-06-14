import { pathology, ex, st, tx } from './pathologyHelpers';

/** 30 pathologies — street workout & musculation */
export const pathologyStrength = [
  pathology({
    id: 'str_lateral_epicondylitis',
    sport: 'strength',
    name: 'Tendinite du coude (épicondylite latérale)',
    shortName: 'Épicondylite / tennis elbow',
    bodyZone: 'coude',
    order: 1,
    difficultRecovery: true,
    symptoms: ['Douleur externe du coude', 'Douleur à la prise ou extension de poignet'],
    causes: ['Grip excessif', 'Volume de tractions / curls élevé', 'Progression trop rapide'],
    items: [
      ex('curl poignet excentrique', '3×15', 'Excentriques'),
      ex('rotation externe élastique', '3×15', 'Épaule / avant-bras')
    ],
    frequency: '1 à 2 séances / jour (excentriques)',
    recoveryTime: '6 à 12 semaines',
    prevention: ['Éviter de serrer excessivement les barres', 'Progression graduelle du grip']
  }),
  pathology({
    id: 'str_medial_epicondylitis',
    sport: 'strength',
    name: 'Épitrochléite (épicondylite médiale)',
    shortName: 'Épitrochléite / golfer elbow',
    bodyZone: 'coude',
    order: 2,
    difficultRecovery: true,
    symptoms: ['Douleur interne du coude', 'Douleur en flexion de poignet ou prise'],
    causes: ['Trop de curls / chin-ups', 'Grip pronation répétée'],
    items: [
      ex('flexion poignet excentrique', '3×15', 'Excentriques'),
      tx('Renforcement pronateur rond léger (élastique)', '3×15', 'Avant-bras')
    ],
    frequency: '1 à 2 séances / jour',
    recoveryTime: '6 à 12 semaines',
    prevention: ['Équilibrer extenseurs / fléchisseurs avant-bras']
  }),
  pathology({
    id: 'str_long_biceps',
    sport: 'strength',
    name: 'Tendinopathie du long biceps',
    shortName: 'Long biceps',
    bodyZone: 'epaule',
    order: 3,
    difficultRecovery: true,
    symptoms: ['Douleur avant de l’épaule', 'Gêne en flexion ou supination lourde'],
    causes: ['Tractions lourdes', 'Figures bras tendus (front lever)', 'Volume excessif'],
    items: [
      ex('rotation externe élastique', '3×15', 'Coiffe'),
      ex('face pull', '3×15', 'Coiffe / scapula'),
      ex('y raise debout', '3×15', 'Trapèze inférieur')
    ],
    frequency: '3 à 5 séances / semaine',
    recoveryTime: '4 à 12 semaines',
    prevention: ['Renforcer coiffe avant charges lourdes']
  }),
  pathology({
    id: 'str_subacromial',
    sport: 'strength',
    name: 'Conflit sous-acromial',
    shortName: 'Conflit sous-acromial',
    bodyZone: 'epaule',
    order: 4,
    difficultRecovery: true,
    symptoms: ['Douleur lors des élévations', 'Gêne en développé ou handstand'],
    causes: ['Déséquilibre poussée / tirage', 'Manque rotation externe', 'Volume overhead'],
    items: [
      ex('face pull', '3×15', 'Coiffe'),
      ex('rotation externe élastique', '3×15', 'Rotation externe'),
      ex('y raise debout', '3×15', 'Trapèzes inférieurs'),
      st('wall_slides_w', '3×15', 'Mobilité scapulaire')
    ],
    frequency: '3 à 5 séances / semaine',
    recoveryTime: '6 à 12 semaines',
    prevention: ['Ratio tirage / poussée équilibré', 'Échauffement épaules']
  }),
  pathology({
    id: 'str_triceps_tendon',
    sport: 'strength',
    name: 'Tendinite des triceps',
    shortName: 'Triceps',
    bodyZone: 'coude',
    order: 5,
    symptoms: ['Douleur arrière du coude', 'Gêne en extension lourde'],
    causes: ['Dips lourds', 'Extensions triceps en volume élevé'],
    items: [
      tx('Extension triceps légère (câble ou élastique)', '3×15', 'Renforcement'),
      ex('curl poignet excentrique', '3×12', 'Excentriques complémentaires')
    ],
    frequency: '3 séances / semaine',
    recoveryTime: '4 à 8 semaines',
    prevention: ['Progression lente sur dips et extensions']
  }),
  pathology({
    id: 'str_pec_tendon',
    sport: 'strength',
    name: 'Tendinite des pectoraux',
    shortName: 'Pectoraux',
    bodyZone: 'epaule',
    order: 6,
    symptoms: ['Douleur à l’insertion du pec (sterno-costo)', 'Gêne en dips profonds'],
    causes: ['Dips excessifs', 'Pompes déclinées en volume', 'Muscle-up répétés'],
    items: [
      tx('Réduction temporaire des dips et pompes profondes', '', 'Repos relatif'),
      ex('pompes scapulaires', '3×15', 'Scapula'),
      st('et_poitrine_double_encadrement', '2×30 s', 'Ouverture antérieure')
    ],
    frequency: '3 à 4 séances / semaine',
    recoveryTime: '4 à 12 semaines',
    prevention: ['Réintroduction progressive des dips']
  }),
  pathology({
    id: 'str_patellar',
    sport: 'strength',
    name: "Tendinopathie rotulienne (jumper's knee)",
    shortName: 'Genou du sauteur',
    bodyZone: 'genou',
    order: 7,
    difficultRecovery: true,
    symptoms: ['Douleur sous la rotule', 'Gêne en sauts, squats profonds, pistols'],
    causes: ['Plyométrie excessive', 'Squats / sauts sans préparation', 'Manque force ischios'],
    items: [
      st('mob_genou_spanish_squat', '3×30 s', 'Isométriques'),
      ex('squat décliné rééducation', '3×10', 'Squat décliné'),
      st('mob_genou_wall_sit', '3×45 s', 'Isométriques')
    ],
    frequency: '4 à 5 séances / semaine',
    recoveryTime: '6 à 16 semaines',
    prevention: ['Renforcement quadriceps isométrique régulier']
  }),
  pathology({
    id: 'str_rotator_cuff',
    sport: 'strength',
    name: 'Douleur de la coiffe des rotateurs',
    shortName: 'Coiffe des rotateurs',
    bodyZone: 'epaule',
    order: 8,
    symptoms: ['Douleur épaule en élévation ou rotation', 'Faiblesse en tirage'],
    causes: ['Déséquilibre musculaire', 'Volume overhead', 'Manque rotation externe'],
    items: [
      ex('rotation externe élastique', '3×15', 'Rotation externe'),
      ex('face pull', '3×15', 'Face pull'),
      ex('cuban press', '3×12 léger', 'Cuban press')
    ],
    frequency: '3 à 5 séances / semaine',
    recoveryTime: '4 à 12 semaines',
    prevention: ['Travail coiffe en prévention 2–3× / semaine']
  }),
  pathology({
    id: 'str_pubalgia',
    sport: 'strength',
    name: 'Pubalgie',
    shortName: 'Pubalgie',
    bodyZone: 'aine',
    order: 9,
    difficultRecovery: true,
    symptoms: ['Douleur aine / pubis', 'Gêne en adduction ou sprint'],
    causes: ['Déséquilibre adducteurs / abdominaux', 'Surcharge changements de direction'],
    items: [
      ex('copenhagen plank', '3×20 s', 'Copenhagen'),
      ex('adduction hanche élastique', '3×15', 'Adducteurs')
    ],
    frequency: '3 à 4 séances / semaine',
    recoveryTime: '6 à 16 semaines',
    prevention: ['Renforcement adducteurs et core']
  }),
  pathology({
    id: 'str_supraspinatus',
    sport: 'strength',
    name: 'Tendinopathie du supra-épineux',
    shortName: 'Supra-épineux',
    bodyZone: 'epaule',
    order: 10,
    symptoms: ['Douleur lors des élévations latérales', 'Gêne entre 60° et 120°'],
    causes: ['Volume développé / élévations', 'Conflit sous-acromial associé'],
    items: [
      ex('rotation externe élastique', '3×15', 'Rotation externe'),
      ex('face pull', '3×15', 'Face pull')
    ],
    frequency: '3 à 5 séances / semaine',
    recoveryTime: '6 à 16 semaines',
    prevention: ['Limiter élévations lourdes en phase aiguë']
  }),
  pathology({
    id: 'str_scapular_instability',
    sport: 'strength',
    name: 'Instabilité scapulaire',
    shortName: 'Instabilité scapulaire',
    bodyZone: 'epaule',
    order: 11,
    symptoms: ['Omoplate qui « décolle » ou bouge excessivement', 'Perte de force en poussée'],
    causes: ['Faiblesse serratus / trapèze inférieur', 'Volume poussée > tirage'],
    items: [
      ex('pompes scapulaires', '3×15', 'Push-up plus'),
      st('wall_slides_w', '3×15', 'Wall slides')
    ],
    frequency: '4 à 5 séances / semaine',
    recoveryTime: '6 à 12 semaines',
    prevention: ['Travail scapulaire en échauffement']
  }),
  pathology({
    id: 'str_winged_scapula',
    sport: 'strength',
    name: 'Scapula alata',
    shortName: 'Scapula alata',
    bodyZone: 'epaule',
    order: 12,
    symptoms: ['Omoplate très visible, décollée du thorax', 'Fatigue rapide en poussée'],
    causes: ['Faiblesse dentelé antérieur (serratus)', 'Neuropathie possible — avis si sévère'],
    items: [
      ex('pompes scapulaires', '3×15', 'Push-up plus'),
      ex('serratus punch', '3×15', 'Serratus punch')
    ],
    frequency: '4 à 5 séances / semaine',
    recoveryTime: 'Plusieurs mois',
    prevention: ['Renforcement serratus régulier']
  }),
  pathology({
    id: 'str_lats_tendon',
    sport: 'strength',
    name: 'Tendinopathie du grand dorsal',
    shortName: 'Grand dorsal',
    bodyZone: 'epaule',
    order: 13,
    symptoms: ['Douleur arrière de l’épaule', 'Gêne en traction ou front lever'],
    causes: ['Tractions lourdes', 'Front lever prématuré'],
    items: [
      tx('Tirages légers progressifs', '3×12', 'Renforcement'),
      st('mob_hanche_worlds_greatest', '2×30 s', 'Mobilité épaules / thorax')
    ],
    frequency: '3 séances / semaine',
    recoveryTime: '4 à 12 semaines',
    prevention: ['Progression lente sur tractions et figures']
  }),
  pathology({
    id: 'str_brachialis',
    sport: 'strength',
    name: 'Tendinopathie du brachial',
    shortName: 'Brachial',
    bodyZone: 'coude',
    order: 14,
    symptoms: ['Douleur avant du bras', 'Gêne en flexion de coude lourde'],
    causes: ['Trop de tractions en volume', 'Chin-ups répétés'],
    items: [ex('curl marteau', '3×15 léger', 'Curl marteau')],
    frequency: '3 séances / semaine',
    recoveryTime: '4 à 10 semaines',
    prevention: ['Varier les prises et le volume de tractions']
  }),
  pathology({
    id: 'str_distal_biceps',
    sport: 'strength',
    name: 'Tendinopathie du biceps distal',
    shortName: 'Biceps distal',
    bodyZone: 'coude',
    order: 15,
    symptoms: ['Douleur pli du coude', 'Gêne en curl lourd'],
    causes: ['Curls lourds', 'Tractions supination répétées'],
    items: [ex('curl marteau', '3×12 excentrique', 'Curl excentrique')],
    frequency: '3 séances / semaine',
    recoveryTime: '6 à 12 semaines',
    prevention: ['Limiter curls maximaux en phase irritative']
  }),
  pathology({
    id: 'str_thoracic_outlet',
    sport: 'strength',
    name: 'Syndrome du défilé thoraco-brachial',
    shortName: 'Défilé thoraco-brachial',
    bodyZone: 'epaule',
    order: 16,
    symptoms: ['Fourmillements bras', 'Main froide ou engourdie'],
    causes: ['Compression nerfs ou vaisseaux', 'Posture voûtée + volume overhead'],
    items: [
      st('et_poitrine_double_encadrement', '2×30 s quotidien', 'Ouverture thoracique'),
      st('rouleau_serviette_vertical', '2 min', 'Extension thoracique'),
      ex('face pull', '3×15', 'Posture')
    ],
    frequency: 'Quotidien (étirements) + 3× renforcement',
    recoveryTime: 'Variable — avis médical si vasculaire',
    prevention: ['Mobilité thoracique quotidienne']
  }),
  pathology({
    id: 'str_costochondritis',
    sport: 'strength',
    name: 'Costochondrite',
    shortName: 'Costochondrite',
    bodyZone: 'thorax',
    order: 17,
    symptoms: ['Douleur côtes / sternum', 'Douleur à la pression ou dips'],
    causes: ['Dips lourds', 'Pompes excessives', 'Inflammation costo-sternale'],
    items: [
      tx('Repos relatif des dips et pompes profondes', '', 'Repos'),
      st('rouleau_serviette_vertical', '2 min', 'Ouverture thorax')
    ],
    frequency: 'Repos + mobilité douce',
    recoveryTime: 'Quelques semaines à plusieurs mois',
    prevention: ['Progression lente sur dips']
  }),
  pathology({
    id: 'str_flexor_digitorum',
    sport: 'strength',
    name: 'Tendinopathie des fléchisseurs des doigts',
    shortName: 'Fléchisseurs doigts',
    bodyZone: 'poignet',
    order: 18,
    difficultRecovery: true,
    symptoms: ['Douleur avant-bras / poignet', 'Gêne au grip'],
    causes: ['Tractions', 'Front lever', 'Grips excessifs'],
    items: [
      ex('ouverture main élastique', '3×20', 'Ouvertures main'),
      ex('curl poignet excentrique', '3×15', 'Excentriques poignet')
    ],
    frequency: '1 à 2 / jour',
    recoveryTime: '6 à 12 semaines',
    prevention: ['Équilibrer grip et extenseurs']
  }),
  pathology({
    id: 'str_extensor_digitorum',
    sport: 'strength',
    name: 'Tendinopathie des extenseurs des doigts',
    shortName: 'Extenseurs doigts',
    bodyZone: 'poignet',
    order: 19,
    symptoms: ['Dessus de l’avant-bras douloureux', 'Gêne en extension de doigts'],
    causes: ['Reverse curls excessifs', 'Keyboard + grip combinés'],
    items: [ex('extension doigts élastique', '3×20', 'Extensions doigts')],
    frequency: '3 séances / semaine',
    recoveryTime: '4 à 12 semaines',
    prevention: ['Progression graduelle reverse curls']
  }),
  pathology({
    id: 'str_carpal_tunnel',
    sport: 'strength',
    name: 'Syndrome du canal carpien',
    shortName: 'Canal carpien',
    bodyZone: 'poignet',
    order: 20,
    symptoms: ['Fourmillements pouce-index-majeur', 'Gêne nocturne', 'Faiblesse de préhension'],
    causes: ['Appuis répétés (handstand, pompes)', 'Compression poignet'],
    items: [
      st('mob_poignet_nerve_glide', '10 reps', 'Glissements nerveux'),
      tx('Réduction charge et appuis poignet', '', 'Modification charge')
    ],
    frequency: 'Quotidien léger',
    recoveryTime: 'Variable — avis spécialisé si persistant',
    prevention: ['Limiter volume handstand sur douleur']
  }),
  pathology({
    id: 'str_subscapularis',
    sport: 'strength',
    name: 'Tendinopathie du subscapulaire',
    shortName: 'Subscapulaire',
    bodyZone: 'epaule',
    order: 21,
    symptoms: ['Douleur avant épaule', 'Rotation interne douloureuse'],
    causes: ['Volume poussée / dips', 'Déséquilibre rotateurs'],
    items: [
      tx('Rotation interne légère élastique', '3×15', 'RI'),
      ex('pompes scapulaires', '3×15', 'Stabilité')
    ],
    frequency: '3 à 4 séances / semaine',
    recoveryTime: '6 à 12 semaines',
    prevention: ['Travail coiffe équilibré']
  }),
  pathology({
    id: 'str_infraspinatus',
    sport: 'strength',
    name: "Tendinopathie de l'infra-épineux",
    shortName: 'Infra-épineux',
    bodyZone: 'epaule',
    order: 22,
    symptoms: ['Douleur arrière de l’épaule', 'Gêne en rotation externe'],
    causes: ['Volume tirage lourd', 'Manque échauffement'],
    items: [
      ex('rotation externe élastique', '3×15', 'Rotation externe'),
      ex('face pull', '3×15', 'Face pull')
    ],
    frequency: '3 à 5 séances / semaine',
    recoveryTime: '6 à 12 semaines',
    prevention: ['Échauffement rotateurs systématique']
  }),
  pathology({
    id: 'str_teres_minor',
    sport: 'strength',
    name: 'Tendinopathie du petit rond',
    shortName: 'Petit rond',
    bodyZone: 'epaule',
    order: 23,
    symptoms: ['Douleur postérieure de l’épaule', 'Gêne en rotation externe'],
    causes: ['Tractions lourdes', 'Déséquilibre coiffe'],
    items: [
      ex('rotation externe élastique', '3×15', 'Rotations externes'),
      ex('pompes scapulaires', '3×15', 'Contrôle scapulaire')
    ],
    frequency: '3 à 4 séances / semaine',
    recoveryTime: '4 à 12 semaines',
    prevention: ['Renforcement rotateurs']
  }),
  pathology({
    id: 'str_ac_joint',
    sport: 'strength',
    name: 'Entorse acromio-claviculaire',
    shortName: 'AC joint',
    bodyZone: 'epaule',
    order: 24,
    symptoms: ['Douleur dessus de l’épaule', 'Gonflement possible', 'Gêne en dips'],
    causes: ['Chute sur épaule', 'Dips mal contrôlés'],
    items: [
      tx('Repos relatif et immobilisation selon grade', '', 'Phase aiguë'),
      ex('rotation externe élastique', '3×15', 'Reprise progressive')
    ],
    frequency: 'Selon grade',
    recoveryTime: '2 à 12 semaines',
    prevention: ['Contrôle technique dips']
  }),
  pathology({
    id: 'str_slap',
    sport: 'strength',
    name: 'Lésion SLAP (bourrelet glénoïdien)',
    shortName: 'SLAP',
    bodyZone: 'epaule',
    order: 25,
    difficultRecovery: true,
    symptoms: ['Claquements dans l’épaule', 'Perte de force', 'Douleur overhead'],
    causes: ['Tractions explosives', 'Muscle-up', 'Charges overhead'],
    items: [
      ex('pompes scapulaires', '3×15', 'Stabilité scapulaire'),
      ex('rotation externe élastique', '3×15', 'Coiffe'),
      ex('face pull', '3×15', 'Coiffe')
    ],
    frequency: '3 à 4 séances / semaine',
    recoveryTime: '2 à 6 mois',
    prevention: ['Éviter tractions explosives sur fatigue']
  }),
  pathology({
    id: 'str_upper_trap',
    sport: 'strength',
    name: 'Tendinopathie / surcharge trapèze supérieur',
    shortName: 'Trapèze supérieur',
    bodyZone: 'cou',
    order: 26,
    symptoms: ['Nuque tendue', 'Douleur haut épaule', 'Tension post-handstand'],
    causes: ['Handstand', 'Shrugs excessifs', 'Posture bureau'],
    items: [
      ex('y raise debout', '3×15', 'Trapèze moyen/inférieur'),
      ex('face pull', '3×15', 'Trapèze inférieur'),
      st('mob_cervical_neck_flexion_stretch', '2×30 s', 'Mobilité cervicale')
    ],
    frequency: '3 à 5 séances / semaine',
    recoveryTime: '4 à 12 semaines',
    prevention: ['Renforcer trapèzes inférieurs vs supérieur']
  }),
  pathology({
    id: 'str_mechanical_neck',
    sport: 'strength',
    name: 'Cervicalgie mécanique',
    shortName: 'Cervicalgie',
    bodyZone: 'cou',
    order: 27,
    symptoms: ['Douleur du cou', 'Raideur rotationnelle', 'Tension post-figure'],
    causes: ['Handstand', 'Mauvaise posture', 'Volume overhead'],
    items: [
      st('face_au_mur_menton_rentre', '3×15', 'Chin tucks'),
      st('mob_cervical_rotation_lente', '2×30 s', 'Mobilité cervicale')
    ],
    frequency: 'Quotidien léger',
    recoveryTime: '2 à 8 semaines',
    prevention: ['Chin tucks réguliers', 'Limiter volume handstand sur douleur']
  }),
  pathology({
    id: 'str_levator_scapulae',
    sport: 'strength',
    name: 'Syndrome du muscle élévateur de la scapula',
    shortName: 'Élévateur scapula',
    bodyZone: 'cou',
    order: 28,
    symptoms: ['Douleur entre cou et omoplate', 'Raideur en rotation tête'],
    causes: ['Posture voûtée', 'Stress + volume tirage'],
    items: [
      st('mob_cervical_levator_scapulae_stretch', '2×30 s', 'Étirement'),
      st('face_au_mur_menton_rentre', '3×15', 'Posture')
    ],
    frequency: 'Quotidien',
    recoveryTime: '2 à 8 semaines',
    prevention: ['Posture et pauses régulières']
  }),
  pathology({
    id: 'str_teres_major',
    sport: 'strength',
    name: 'Tendinopathie du grand rond',
    shortName: 'Grand rond',
    bodyZone: 'epaule',
    order: 29,
    symptoms: ['Douleur arrière de l’aisselle', 'Gêne en traction lourde'],
    causes: ['Tractions lourdes', 'Progression trop rapide'],
    items: [tx('Réintroduction progressive des tirages', '3×8 léger', 'Tirages')],
    frequency: '3 séances / semaine',
    recoveryTime: '4 à 12 semaines',
    prevention: ['Progression linéaire sur tractions']
  }),
  pathology({
    id: 'str_costovertebral',
    sport: 'strength',
    name: 'Syndrome costo-vertébral',
    shortName: 'Costo-vertébral',
    bodyZone: 'thorax',
    order: 30,
    symptoms: ['Douleur entre les omoplates', 'Douleur à l’inspiration profonde'],
    causes: ['Charges lourdes', 'Mauvaise mobilité thoracique'],
    items: [
      st('mob_thoracic_open_book', '2×30 s', 'Rotation thoracique'),
      st('rouleau_serviette_vertical', '2 min', 'Extension thoracique')
    ],
    frequency: '3 à 5 séances / semaine',
    recoveryTime: '4 à 12 semaines',
    prevention: ['Mobilité thoracique régulière']
  })
];
