import { pathology, ex, st, tx } from './pathologyHelpers';

/** 30 pathologies courantes — course à pied */
export const pathologyRunning = [
  pathology({
    id: 'run_it_band',
    sport: 'running',
    name: "Syndrome de l'essuie-glace (TFL / bandelette ilio-tibiale)",
    shortName: 'Essuie-glace / ITB',
    bodyZone: 'genou',
    order: 1,
    difficultRecovery: true,
    symptoms: [
      'Douleur sur le côté externe du genou',
      'Apparition souvent après plusieurs kilomètres',
      'Descente et escaliers douloureux'
    ],
    causes: [
      'Faiblesse des fessiers (surtout moyen fessier)',
      'Augmentation trop rapide du volume ou de l’intensité',
      'Surstride (foulée trop longue) et faible cadence'
    ],
    items: [
      st('mob_hanche_clamshells', '3×15', 'Renforcement moyen fessier'),
      ex('monster walk', '3×15 m', 'Renforcement moyen fessier'),
      ex('abduction hanche debout élastique', '3×15', 'Renforcement moyen fessier'),
      ex('step-down contrôlé', '3×10', 'Contrôle du genou'),
      ex('squat une jambe', '3×8', 'Contrôle du genou')
    ],
    frequency: '3 à 4 séances / semaine',
    recoveryTime: '2 à 8 semaines',
    prevention: [
      'Renforcer régulièrement les fessiers',
      'Augmenter le kilométrage progressivement (règle des 10 %)',
      'Travailler la cadence et éviter la foulée trop longue'
    ],
    rehabNote:
      'Les étirements seuls guérissent rarement : baisse temporaire de charge + renforcement progressif du moyen fessier + retour graduel à la course.'
  }),
  pathology({
    id: 'run_femoropatellar',
    sport: 'running',
    name: 'Syndrome fémoro-patellaire',
    shortName: 'Douleur rotulienne antérieure',
    bodyZone: 'genou',
    order: 2,
    symptoms: [
      'Douleur devant le genou (autour ou sous la rotule)',
      'Escaliers, squat et position assise prolongée douloureux',
      'Crépitements parfois sans gravité'
    ],
    causes: [
      'Faiblesse quadriceps et fessiers',
      'Mauvais alignement fémoro-patellaire',
      'Augmentation brutale de volume ou de dénivelé'
    ],
    items: [
      st('mob_genou_spanish_squat', '3×30 s', 'Quadriceps isométrique'),
      st('mob_genou_wall_sit', '3×45 s', 'Quadriceps isométrique'),
      ex('hip thrust', '3×12', 'Fessiers'),
      ex('step-up', '3×10', 'Fessiers / quadriceps')
    ],
    frequency: '3 à 5 séances / semaine',
    recoveryTime: '4 à 12 semaines',
    prevention: ['Renforcement régulier jambes et fessiers', 'Progression de charge maîtrisée']
  }),
  pathology({
    id: 'run_shin_splints',
    sport: 'running',
    name: 'Périostite tibiale (syndrome de stress tibial médial léger)',
    shortName: 'Périostite tibiale',
    bodyZone: 'cheville',
    order: 3,
    symptoms: [
      'Douleur sur le bord interne du tibia',
      'Apparition en début de séance, parfois persistante'
    ],
    causes: ['Trop de volume trop vite', 'Chaussures usées ou inadaptées', 'Manque de force mollet / pied'],
    items: [
      ex('mollets debout', '3×15', 'Mollets'),
      ex('mollets assis', '3×15', 'Mollets (soléaire)'),
      st('mob_genou_tibialis_raises', '3×20', 'Tibial antérieur / pied'),
      st('mob_cheville_toe_walks', '3×30 s', 'Pied / mollets')
    ],
    frequency: '3 à 4 séances / semaine',
    recoveryTime: '2 à 8 semaines',
    prevention: ['Progression graduelle du volume', 'Surveiller l’usure des chaussures'],
    rehabNote: 'Si douleur très localisée au repos → écarter une fracture de fatigue (consultation).'
  }),
  pathology({
    id: 'run_stress_fracture',
    sport: 'running',
    name: 'Fracture de fatigue tibiale',
    shortName: 'Fracture de fatigue',
    bodyZone: 'cheville',
    order: 4,
    difficultRecovery: true,
    symptoms: [
      'Douleur très localisée sur le tibia',
      'Douleur à la marche et parfois au repos',
      'Douleur à la percussion ou au test du « hop »'
    ],
    causes: ['Surcharge répétée sans récupération', 'Déficit calorique ou carence osseuse', 'Volume trop rapide'],
    items: [tx('Arrêt de la course et charge d’impact', '', 'Traitement principal')],
    frequency: 'Repos relatif — reprise selon avis médical',
    recoveryTime: '6 à 12 semaines minimum (souvent plus)',
    prevention: ['Progression très graduelle', 'Nutrition et sommeil adéquats', 'Ne pas courir sur douleur focalisée']
  }),
  pathology({
    id: 'run_achilles',
    sport: 'running',
    name: "Tendinopathie d'Achille",
    shortName: 'Tendon d’Achille',
    bodyZone: 'cheville',
    order: 5,
    difficultRecovery: true,
    symptoms: ['Douleur derrière la cheville / tendon', 'Raideur matinale', 'Échauffement parfois transitoire'],
    causes: ['Pic de volume ou d’intensité', 'Manque de force excentrique mollet', 'Chaussures ou surface inadaptées'],
    items: [
      ex('descente excentrique mollet', '3×15 matin + soir', 'Protocole excentrique'),
      st('mob_cheville_achilles_eccentric', '3×15', 'Protocole excentrique'),
      ex('mollets debout', '3×15', 'Renforcement'),
      st('et_mollet_mur_profond', '2×30 s', 'Souplesse')
    ],
    frequency: 'Quotidien pour excentriques si toléré',
    recoveryTime: '6 à 12 semaines (parfois plus)',
    prevention: ['Renforcer les mollets en excentrique', 'Éviter les pics de volume']
  }),
  pathology({
    id: 'run_plantar_fasciitis',
    sport: 'running',
    name: 'Fasciite plantaire',
    shortName: 'Fasciite plantaire',
    bodyZone: 'pied',
    order: 6,
    difficultRecovery: true,
    symptoms: ['Douleur sous le talon ou voûte plantaire', 'Premiers pas du matin très douloureux'],
    causes: ['Charge d’impact excessive', 'Raideur mollet / pied faible', 'Chaussures inadaptées'],
    items: [
      ex('ramassage serviette orteils', '3×15', 'Voûte plantaire'),
      st('mob_cheville_short_foot', '3×10', 'Voûte plantaire'),
      st('et_mollet_mur_profond', '2×30 s', 'Mollets'),
      st('et_mollet_genou_plie_sol', '2×30 s', 'Soléaire')
    ],
    frequency: '3 à 5 séances / semaine',
    recoveryTime: '4 à 16 semaines',
    prevention: ['Renforcement intrinsèque du pied', 'Progression de course prudente']
  }),
  pathology({
    id: 'run_ankle_sprain',
    sport: 'running',
    name: 'Entorse de cheville',
    shortName: 'Entorse cheville',
    bodyZone: 'cheville',
    order: 7,
    symptoms: ['Douleur externe (souvent)', 'Gonflement', 'Instabilité résiduelle possible'],
    causes: ['Terrain irrégulier', 'Fatigue', 'Historique d’entorse non rééduquée'],
    items: [
      ex('équilibre unipodal', '3×1 min', 'Proprioception'),
      ex('éversion cheville élastique', '3×15', 'Renforcement'),
      ex('inversion cheville élastique', '3×15', 'Renforcement'),
      st('mob_cheville_single_leg_balance', '3×45 s', 'Proprioception')
    ],
    frequency: '3 à 5 séances / semaine',
    recoveryTime: '2 à 8 semaines selon grade',
    prevention: ['Proprioception après toute entorse', 'Renforcement fibulaires']
  }),
  pathology({
    id: 'run_glute_med',
    sport: 'running',
    name: 'Tendinopathie du moyen fessier',
    shortName: 'Moyen fessier',
    bodyZone: 'hanche',
    order: 8,
    symptoms: ['Douleur sur le côté de la hanche', 'Douleur en appui unipodal ou en course'],
    causes: ['Faiblesse abducteurs', 'Surcharge en volume', 'Bassin instable'],
    items: [
      st('mob_hanche_clamshells', '3×15', 'Activation'),
      ex('hip thrust', '3×12', 'Renforcement'),
      ex('monster walk', '3×15 m', 'Renforcement'),
      ex('abduction hanche debout élastique', '3×15', 'Renforcement')
    ],
    frequency: '3 à 4 séances / semaine',
    recoveryTime: '4 à 12 semaines',
    prevention: ['Renforcement régulier moyen fessier', 'Éviter les pics de volume']
  }),
  pathology({
    id: 'run_low_back',
    sport: 'running',
    name: 'Lombalgie du coureur',
    shortName: 'Lombalgie',
    bodyZone: 'dos',
    order: 9,
    symptoms: ['Douleur bas du dos', 'Parfois raideur après course longue'],
    causes: ['Faiblesse core / fessiers', 'Hyperlordose ou manque de mobilité hanche', 'Volume excessif'],
    items: [
      ex('bird dog', '3×10', 'Stabilité lombaire'),
      ex('dead bug', '3×10', 'Stabilité lombaire'),
      st('mob_bassin_plank', '3×30 s', 'Gainage'),
      st('mob_bassin_bird_dog', '3×10', 'Stabilité')
    ],
    frequency: '3 à 5 séances / semaine',
    recoveryTime: '2 à 8 semaines',
    prevention: ['Core et fessiers réguliers', 'Progression de volume']
  }),
  pathology({
    id: 'run_piriformis',
    sport: 'running',
    name: 'Syndrome du piriforme',
    shortName: 'Piriforme',
    bodyZone: 'hanche',
    order: 10,
    symptoms: [
      'Douleur profonde dans la fesse',
      'Irradiation parfois vers l’arrière de la cuisse',
      'Aggravé en position assise prolongée'
    ],
    causes: ['Surutilisation', 'Faiblesse fessiers', 'Mauvais contrôle du bassin'],
    items: [
      st('allonge_jambes_croisees_piriforme', '2–3×30 s', 'Étirement'),
      st('mob_hanche_clamshells', '3×15', 'Renforcement'),
      ex('hip thrust', '3×12', 'Renforcement'),
      ex('monster walk', '3×15 m', 'Renforcement')
    ],
    frequency: '3 à 4 séances / semaine',
    recoveryTime: '4 à 12 semaines',
    prevention: ['Renforcer les fessiers', 'Limiter les longues positions assises avant grosse séance']
  }),
  pathology({
    id: 'run_prox_hamstring',
    sport: 'running',
    name: 'Tendinopathie des ischio-jambiers proximaux',
    shortName: 'Ischios proximaux',
    bodyZone: 'hanche',
    order: 11,
    difficultRecovery: true,
    symptoms: ['Douleur sous la fesse / ischion', 'Douleur en montée, sprint ou accélération'],
    causes: ['Trop de vitesse ou de côtes', 'Manque de force ischios', 'Progression trop rapide'],
    items: [
      st('mob_bassin_hamstring_stretch', '2×30 s', 'Souplesse'),
      ex('hip thrust unilatéral', '3×30 s', 'Isométrique'),
      ex('soulevé de terre jambes semi-tendues', '3×8', 'Renforcement lourd'),
      st('mob_genou_nordic_assiste', '3×5', 'Excentrique ischios')
    ],
    frequency: '2 à 3 séances lourdes / semaine + travail léger',
    recoveryTime: '6 à 16 semaines',
    prevention: ['Renforcement ischios progressif', 'Limiter les sprints sur fatigue']
  }),
  pathology({
    id: 'run_tarsal_tunnel',
    sport: 'running',
    name: 'Syndrome du tunnel tarsien',
    shortName: 'Tunnel tarsien',
    bodyZone: 'pied',
    order: 12,
    symptoms: ['Brûlures sous le pied', 'Fourmillements', 'Paresthésies médiales'],
    causes: ['Compression nerveuse', 'Pied plat ou surcharge'],
    items: [
      st('mob_poignet_nerve_glide', '10 reps', 'Mobilisation nerveuse (adapter poignet → cheville/pied)'),
      st('mob_cheville_short_foot', '3×10', 'Renforcement pied'),
      st('mob_cheville_foot_rockers', '2×30 s', 'Mobilité pied')
    ],
    frequency: 'Quotidien léger',
    recoveryTime: 'Variable — avis spécialisé si persistant',
    prevention: ['Surveiller douleurs neuropathiques', 'Renforcement pied']
  }),
  pathology({
    id: 'run_posterior_tibial',
    sport: 'running',
    name: 'Tendinopathie du tibial postérieur',
    shortName: 'Tibial postérieur',
    bodyZone: 'cheville',
    order: 13,
    symptoms: ['Douleur face interne cheville', 'Affaissement du pied possible', 'Fatigue à la course'],
    causes: ['Pied plat fonctionnel', 'Surentraînement', 'Historique entorses'],
    items: [
      ex('mollets debout', '3×15', 'Élévations'),
      ex('inversion cheville élastique', '3×15', 'Inversion'),
      st('mob_cheville_short_foot', '3×10', 'Voûte plantaire')
    ],
    frequency: '3 à 4 séances / semaine',
    recoveryTime: '6 à 12 semaines',
    prevention: ['Renforcement pied et invertisseurs', 'Chaussage adapté']
  }),
  pathology({
    id: 'run_peroneal',
    sport: 'running',
    name: 'Tendinopathie des fibulaires',
    shortName: 'Fibulaires',
    bodyZone: 'cheville',
    order: 14,
    symptoms: ['Douleur externe cheville', 'Gêne en appui ou en virage'],
    causes: ['Entorse non rééduquée', 'Surcharge en trail / virages'],
    items: [
      ex('éversion cheville élastique', '3×15', 'Éversion'),
      ex('équilibre unipodal', '3×1 min', 'Équilibre')
    ],
    frequency: '3 à 4 séances / semaine',
    recoveryTime: '4 à 10 semaines',
    prevention: ['Rééducation complète après entorse']
  }),
  pathology({
    id: 'run_medial_tibial_stress',
    sport: 'running',
    name: 'Syndrome de stress tibial médial',
    shortName: 'Stress tibial médial',
    bodyZone: 'cheville',
    order: 15,
    symptoms: ['Douleur diffuse sur plusieurs centimètres du bord interne du tibia'],
    causes: ['Augmentation brutale du volume', 'Surface dure', 'Déficit force mollet / pied'],
    items: [
      ex('mollets debout', '3×15', 'Mollets'),
      ex('mollets assis', '3×15', 'Soléaire'),
      st('mob_genou_tibialis_raises', '3×20', 'Tibial antérieur'),
      st('mob_cheville_barefoot_walking', '2–5 min', 'Pied')
    ],
    frequency: '3 à 4 séances / semaine',
    recoveryTime: '2 à 8 semaines',
    prevention: ['Progression graduelle', 'Réduire impact si douleur']
  }),
  pathology({
    id: 'run_soleus_overload',
    sport: 'running',
    name: 'Syndrome de surcharge du soléaire',
    shortName: 'Surcharge soléaire',
    bodyZone: 'cheville',
    order: 16,
    symptoms: ['Douleur profonde dans le mollet (souvent genou fléchi)'],
    causes: ['Volume élevé', 'Manque de force soléaire', 'Peu de travail genou fléchi'],
    items: [
      ex('mollets assis', '4×15', 'Mollets genou fléchi'),
      st('et_mollet_genou_plie_sol', '2×30 s', 'Étirement soléaire'),
      st('mob_genou_wall_sit', '5×30 s', 'Isométriques')
    ],
    frequency: '4 séances / semaine',
    recoveryTime: '2 à 8 semaines',
    prevention: ['Inclure mollets genou fléchi dans la préparation']
  }),
  pathology({
    id: 'run_compartment',
    sport: 'running',
    name: "Syndrome des loges d'effort",
    shortName: 'Loges d’effort',
    bodyZone: 'cheville',
    order: 17,
    difficultRecovery: true,
    symptoms: [
      'Mollets extrêmement tendus et douloureux en effort',
      'Douleur qui disparaît rapidement à l’arrêt'
    ],
    causes: ['Pression excessive dans les compartiments musculaires', 'Volume / intensité élevés'],
    items: [
      tx('Modification de l’entraînement (réduction impact)', '', 'Traitement principal'),
      st('et_mollet_mur_profond', '2×30 s', 'Souplesse complémentaire')
    ],
    frequency: 'Selon avis médical',
    recoveryTime: 'Variable — parfois chirurgie',
    prevention: ['Éviter les pics d’intensité sur mollets fatigués']
  }),
  pathology({
    id: 'run_trochanteric_bursitis',
    sport: 'running',
    name: 'Bursite trochantérienne',
    shortName: 'Bursite hanche',
    bodyZone: 'hanche',
    order: 18,
    symptoms: ['Douleur côté hanche', 'Douleur en appui ou couché sur le côté'],
    causes: ['Faiblesse moyen fessier', 'Irritation répétée TFL / ITB'],
    items: [
      ex('hip thrust', '3×12', 'Renforcement'),
      st('mob_hanche_clamshells', '3×15', 'Activation'),
      ex('monster walk', '3×15 m', 'Renforcement')
    ],
    frequency: '3 à 4 séances / semaine',
    recoveryTime: '4 à 12 semaines',
    prevention: ['Renforcement moyen fessier régulier']
  }),
  pathology({
    id: 'run_rectus_femoris',
    sport: 'running',
    name: 'Tendinopathie du droit fémoral',
    shortName: 'Droit fémoral',
    bodyZone: 'hanche',
    order: 21,
    symptoms: ['Douleur à l’avant de la hanche', 'Douleur en sprint ou montée'],
    causes: ['Sprints et côtes', 'Faiblesse fléchisseurs de hanche'],
    items: [
      ex('relevé genoux élastique', '3×15', 'Renforcement'),
      ex('step-up', '3×10', 'Step-up haut')
    ],
    frequency: '3 à 4 séances / semaine',
    recoveryTime: '4 à 10 semaines',
    prevention: ['Renforcement progressif fléchisseurs de hanche']
  }),
  pathology({
    id: 'run_adductor',
    sport: 'running',
    name: 'Tendinopathie des adducteurs',
    shortName: 'Adducteurs',
    bodyZone: 'aine',
    order: 22,
    symptoms: ['Douleur à l’intérieur de la cuisse', 'Gêne à l’accélération ou changements de direction'],
    causes: ['Surcharge', 'Déséquilibre adducteurs / abducteurs'],
    items: [
      ex('copenhagen plank', '3×20 s', 'Copenhagen'),
      ex('adduction hanche élastique', '3×15', 'Adduction élastique')
    ],
    frequency: '3 à 4 séances / semaine',
    recoveryTime: '6 à 12 semaines',
    prevention: ['Renforcement adducteurs en complément des abducteurs']
  }),
  pathology({
    id: 'run_prepatellar_bursitis',
    sport: 'running',
    name: 'Bursite prépatellaire',
    shortName: 'Bursite rotule',
    bodyZone: 'genou',
    order: 23,
    symptoms: ['Gonflement devant la rotule', 'Sensation de « poche d’eau »'],
    causes: ['Pressions répétées sur le genou', 'Chutes à genoux'],
    items: [
      tx('Réduction des contraintes en flexion forcée', '', 'Repos relatif'),
      tx('Compression et glace selon tolérance', '', 'Soins')
    ],
    frequency: 'Repos relatif',
    recoveryTime: 'Quelques semaines',
    prevention: ['Éviter les impacts directs répétés sur la rotule']
  }),
  pathology({
    id: 'run_hoffa',
    sport: 'running',
    name: 'Hoffite (coussinet graisseux de Hoffa)',
    shortName: 'Hoffite',
    bodyZone: 'genou',
    order: 24,
    symptoms: ['Douleur juste sous la rotule', 'Pire en extension complète du genou'],
    causes: ['Hyperextension répétée', 'Foulée avec grande extension de genou'],
    items: [
      st('mob_genou_spanish_squat', '3×30 s', 'Quadriceps'),
      ex('step-down contrôlé', '3×10', 'Contrôle genou'),
      ex('squat décliné rééducation', '3×10', 'Quadriceps')
    ],
    frequency: '3 à 4 séances / semaine',
    recoveryTime: '4 à 12 semaines',
    prevention: ['Contrôle moteur du genou', 'Éviter extension brutale répétée']
  }),
  pathology({
    id: 'run_synovial_plica',
    sport: 'running',
    name: 'Syndrome de la plica synoviale',
    shortName: 'Plica synoviale',
    bodyZone: 'genou',
    order: 25,
    symptoms: ['Claquement interne du genou', 'Sensation de frottement'],
    causes: ['Irritation de la plica médiale', 'Volume ou flexions répétées'],
    items: [
      st('mob_genou_wall_sit', '3×45 s', 'Quadriceps'),
      ex('hip thrust', '3×12', 'Contrôle hanche'),
      ex('step-down contrôlé', '3×10', 'Contrôle genou')
    ],
    frequency: '3 à 4 séances / semaine',
    recoveryTime: 'Variable',
    prevention: ['Renforcement quadriceps et contrôle hanche']
  }),
  pathology({
    id: 'run_popliteus',
    sport: 'running',
    name: 'Tendinopathie du poplité',
    shortName: 'Poplité',
    bodyZone: 'genou',
    order: 26,
    symptoms: ['Douleur arrière-externe du genou', 'Souvent en descente'],
    causes: ['Descentes techniques', 'Terrain irrégulier'],
    items: [
      ex('équilibre unipodal', '3×1 min', 'Équilibre'),
      ex('step-down contrôlé', '3×10', 'Step-down')
    ],
    frequency: '3 à 4 séances / semaine',
    recoveryTime: '4 à 8 semaines',
    prevention: ['Renforcement proprioceptif en descente']
  }),
  pathology({
    id: 'run_morton',
    sport: 'running',
    name: 'Névrome de Morton',
    shortName: 'Névrome de Morton',
    bodyZone: 'pied',
    order: 27,
    symptoms: ['Sensation de caillou sous l’avant-pied', 'Brûlures entre les orteils'],
    causes: ['Compression nerveuse', 'Chaussures étroites'],
    items: [
      st('mob_cheville_short_foot', '3×10', 'Renforcement pied'),
      tx('Écartement des orteils (élastique entre orteils)', '2×1 min', 'Mobilité orteils')
    ],
    frequency: 'Quotidien léger',
    recoveryTime: 'Variable',
    prevention: ['Chaussures avec espace avant-pied', 'Renforcement intrinsèque']
  }),
  pathology({
    id: 'run_hallux_rigidus',
    sport: 'running',
    name: 'Hallux rigidus',
    shortName: 'Hallux rigidus',
    bodyZone: 'pied',
    order: 28,
    symptoms: ['Gros orteil raide', 'Difficulté à pousser en propulsion'],
    causes: ['Usure articulaire', 'Mobilité limitée du gros orteil'],
    items: [
      st('mob_cheville_foot_rockers', '2×30 s', 'Mobilité gros orteil'),
      st('mob_cheville_short_foot', '3×10', 'Voûte plantaire')
    ],
    frequency: 'Quotidien',
    recoveryTime: 'Chronique — gestion',
    prevention: ['Mobilité régulière du gros orteil']
  }),
  pathology({
    id: 'run_hallux_valgus',
    sport: 'running',
    name: 'Hallux valgus douloureux',
    shortName: 'Hallux valgus',
    bodyZone: 'pied',
    order: 29,
    symptoms: ['Oignon', 'Douleur à l’appui', 'Rougeur possible'],
    causes: ['Chaussage', 'Alignement du pied', 'Charge répétée'],
    items: [
      st('mob_cheville_short_foot', '3×10', 'Contrôle gros orteil'),
      ex('ramassage serviette orteils', '3×15', 'Intrinsèques')
    ],
    frequency: 'Quotidien',
    recoveryTime: 'Gestion chronique',
    prevention: ['Chaussures larges à l’avant-pied', 'Renforcement pied']
  }),
  pathology({
    id: 'run_metatarsalgia',
    sport: 'running',
    name: 'Métatarsalgie',
    shortName: 'Métatarsalgie',
    bodyZone: 'pied',
    order: 30,
    symptoms: ['Douleur sous l’avant-pied', 'Sensation de marcher sur un caillou'],
    causes: ['Surcharge avant-pied', 'Chaussures inadaptées'],
    items: [
      st('mob_cheville_short_foot', '3×10', 'Renforcement pied'),
      st('mob_cheville_foot_rockers', '2×30 s', 'Mobilité orteils'),
      st('mob_cheville_barefoot_walking', '2 min', 'Proprioception')
    ],
    frequency: '3 à 5 séances / semaine',
    recoveryTime: '2 à 8 semaines',
    prevention: ['Répartir la charge', 'Renforcement voûte plantaire']
  })
];
