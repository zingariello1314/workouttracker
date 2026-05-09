// Programme d'entraînement complet Cycle 3+1
//
// Format `etirements` : tableau d'items individuels par moment (matin/midi/soir).
// Chaque item référence la banque `stretchDatabase` via `stretchKey` et porte un ID stable
// dans le range 9000-9999 (convention 9<jour 1-7><moment 1-3><idx 1-9>).
// Voir `src/utils/stretchUtils.js` (normalizeStretchSlots) pour la résolution.

export const workoutProgram = {
  lundi: {
    name: "Street Workout + Boxe",
    focus: "dos / core / contrôle",
    etirements: {
      matin: [
        { id: 9111, stretchKey: "respiration_nasale_lente", duration: 60 },
        { id: 9112, stretchKey: "auto_grandissement_assis", duration: 60 },
        { id: 9113, stretchKey: "mobilisation_cervicale", duration: 120 },
        { id: 9114, stretchKey: "rotations_epaules", duration: 120 }
      ],
      midi: [
        { id: 9121, stretchKey: "etirement_passif_psoas", duration: 120 },
        { id: 9122, stretchKey: "etirement_rotation_thoracique", duration: 60 },
        { id: 9123, stretchKey: "pendule_epaule", duration: 120 }
      ],
      soir: [
        { id: 9131, stretchKey: "jambe_a_la_paroi", duration: 180 },
        { id: 9132, stretchKey: "etirement_flechisseurs_hanche_passif", duration: 60 },
        { id: 9133, stretchKey: "dead_hang_passif", duration: 60 }
      ]
    },
    exercices: [
      { id: 101, name: "Tractions pronation", series: "4×4-6", materiel: "barre" },
      { id: 102, name: "Tractions australiennes", series: "4×10", materiel: "barre" },
      { id: 103, name: "Dips parallèles", series: "4×12 (8 normales + 4 amplitude complète)", materiel: "parallèles" },
      { id: 104, name: "Pompes inclinées pieds sur banc", series: "3×12", materiel: "banc" },
      { id: 105, name: "Pompes inclinées mains sur banc", series: "2×12", materiel: "banc" },
      { id: 106, name: "Relevés de genoux à la barre", series: "2×20", materiel: "barre" },
      { id: 107, name: "Relevés de genoux aux parallèles", series: "2×20", materiel: "parallèles" },
      { id: 108, name: "Mountain climbers", series: "30 sec", type: "circuit_abdos" },
      { id: 109, name: "Planche", series: "1 min", type: "circuit_abdos" },
      { id: 110, name: "Jambes tendues rétroversées", series: "20×", type: "circuit_abdos" },
      { id: 111, name: "Gainage latéral", series: "30 sec chaque côté", type: "circuit_abdos" },
      { id: 112, name: "Crunchs inversés", series: "15×", type: "circuit_abdos" },
      { id: 113, name: "Vacuum allongé", series: "5 cycles", type: "circuit_abdos" },
      { id: 114, name: "Boxe", series: "1×90min", materiel: "Gants de boxe", type: "cardio_technique", notes: "19h30-21h - coordination, cardio, stress_relief" }
    ],
    duree: "1h",
    complementaryActivity: {
      name: "Boxe",
      duration: 90,
      timeSlot: "19h30-21h",
      type: "cardio_technique",
      benefits: ["coordination", "cardio", "stress_relief"]
    }
  },

  mardi: {
    name: "Biceps / Pectoraux + Natation",
    focus: "Biceps / Pectoraux / Haut du torse",
    etirements: {
      matin: [
        { id: 9211, stretchKey: "respiration_allongee_bassin_surleve", duration: 180 },
        { id: 9212, stretchKey: "mobilite_scapulaire_cercles_bras", duration: 120 },
        { id: 9213, stretchKey: "etirement_actif_haut_du_dos", duration: 120 }
      ],
      midi: [
        { id: 9221, stretchKey: "ouverture_y_au_mur", duration: 120 },
        { id: 9222, stretchKey: "posture_sphinx", duration: 60 },
        { id: 9223, stretchKey: "auto_massage_pectoraux", duration: 120 }
      ],
      soir: [
        { id: 9231, stretchKey: "etirement_cou_trapezes", duration: 120 },
        { id: 9232, stretchKey: "rouleau_serviette_vertical", duration: 120 },
        { id: 9233, stretchKey: "respiration_nasale_4_4_4", duration: 60 }
      ]
    },
    exercices: [
      { id: 201, name: "Pompes lestées", series: "4×10-12", materiel: "gilet lesté", notes: "Focus contrôle + descente lente" },
      { id: 202, name: "Pompes inclinées sur support", series: "4×12", materiel: "support", notes: "haut des pecs" },
      { id: 203, name: "Curl alterné", series: "3×10 par bras", materiel: "haltère" },
      { id: 204, name: "Curl marteau", series: "3×12 par bras", materiel: "haltère" },
      { id: 205, name: "Curl Zottman", series: "3×10 par bras", materiel: "haltère", notes: "montée supination, descente pronation" },
      { id: 206, name: "Pompes serrées diamant", series: "3×12", materiel: "poids du corps" },
      { id: 207, name: "Planche bras tendus", series: "3×30 sec", materiel: "poids du corps", type: "finisher" }
    ],
    duree: "45-55 min",
    complementaryActivity: {
      name: "Natation",
      duration: 90,
      timeSlot: "19h30-21h",
      type: "cardio_endurance",
      benefits: ["cardio", "endurance", "recovery"]
    }
  },

  mercredi: {
    name: "Pectoraux / Triceps + Boxe",
    focus: "Pectoraux / Triceps / Épaules",
    etirements: {
      matin: [
        { id: 9311, stretchKey: "etirement_ischio_assis", duration: 120 },
        { id: 9312, stretchKey: "ponts_fessiers_activation", duration: 120 },
        { id: 9313, stretchKey: "fente_psoas_bras_oppose_eleve", duration: 120 }
      ],
      midi: [
        { id: 9321, stretchKey: "assis_au_mur_chaise", duration: 180 },
        { id: 9322, stretchKey: "genoux_poitrine_allonge", duration: 120 },
        { id: 9323, stretchKey: "respiration_nasale_dos_au_sol", duration: 60 }
      ],
      soir: [
        { id: 9331, stretchKey: "posture_enfant", duration: 180 },
        { id: 9332, stretchKey: "chat_vache", duration: 60 },
        { id: 9333, stretchKey: "allonge_jambes_croisees_piriforme", duration: 120 }
      ]
    },
    exercices: [
      { id: 301, name: "Pompes déclinées", series: "4×10", materiel: "support", notes: "Gilet sur 2 séries si possible" },
      { id: 302, name: "Pompes pseudo-planche", series: "3×10", materiel: "poids du corps", notes: "Haut des pecs / delto avant" },
      { id: 303, name: "Développé militaire unilatéral", series: "3×10 par bras", materiel: "haltère" },
      { id: 304, name: "Élévations latérales", series: "12-15 par bras", materiel: "haltère", type: "superset_epaules" },
      { id: 305, name: "Oiseaux", series: "12-15", materiel: "haltère", type: "superset_epaules", notes: "élévations postérieures" },
      { id: 306, name: "Face pull", series: "15", materiel: "élastique", type: "superset_epaules" },
      { id: 307, name: "Extensions triceps unilatérales", series: "10-12 par bras", materiel: "haltère", type: "bloc_triceps", notes: "au-dessus de la tête" },
      { id: 308, name: "Kickbacks triceps", series: "10-12 par bras", materiel: "haltère", type: "bloc_triceps" },
      { id: 309, name: "Pompes diamant lentes", series: "10-12", materiel: "poids du corps", type: "bloc_triceps", notes: "3s descente / 1s montée" },
      { id: 310, name: "Pompes sur poignées tempo", series: "3×12", materiel: "poignées", type: "finisher", notes: "Focus contrôle et congestion" },
      { id: 311, name: "Boxe", series: "1×90min", materiel: "Gants de boxe", type: "cardio_technique", notes: "19h30-21h - coordination, cardio, stress_relief" }
    ],
    duree: "60-70 min",
    complementaryActivity: {
      name: "Boxe",
      duration: 90,
      timeSlot: "19h30-21h",
      type: "cardio_technique",
      benefits: ["coordination", "cardio", "stress_relief"]
    }
  },

  jeudi: {
    name: "Repos / Mobilité",
    focus: "Mobilité thoracique & cou / nuque",
    etirements: {
      matin: [
        { id: 9411, stretchKey: "inclinaisons_laterales_tete", duration: 120 },
        { id: 9412, stretchKey: "cercles_thoraciques_debout", duration: 120 },
        { id: 9413, stretchKey: "ouverture_t_allonge", duration: 120 }
      ],
      midi: [
        { id: 9421, stretchKey: "wall_slides_w", duration: 120 },
        { id: 9422, stretchKey: "etirement_sternocleido", duration: 60 },
        { id: 9423, stretchKey: "face_au_mur_menton_rentre", duration: 120 }
      ],
      soir: [
        { id: 9431, stretchKey: "tete_suspendue_bord_de_lit", duration: 180 },
        { id: 9432, stretchKey: "respiration_diaphragmatique_main_ventre", duration: 120 },
        { id: 9433, stretchKey: "mini_cobra", duration: 60 }
      ]
    },
    exercices: [],
    duree: "Étirements uniquement",
    notes: "Jour de repos actif avec focus sur la mobilité"
  },

  vendredi: {
    name: "Street Workout (dos / core / contrôle – variante)",
    focus: "dos / core / contrôle",
    etirements: {
      matin: [
        { id: 9511, stretchKey: "appui_mur_4_points", duration: 120 },
        { id: 9512, stretchKey: "marche_lente_pieds_nus", duration: 60 },
        { id: 9513, stretchKey: "elevations_demi_pointes", duration: 120 }
      ],
      midi: [
        { id: 9521, stretchKey: "squat_passif", duration: 120 },
        { id: 9522, stretchKey: "balancier_bras_jambe_opposee", duration: 60 },
        { id: 9523, stretchKey: "jambes_en_chaise_90", duration: 60 }
      ],
      soir: [
        { id: 9531, stretchKey: "pendule_bras_hanche", duration: 120 },
        { id: 9532, stretchKey: "relachement_lombaire_bascule_bassin", duration: 120 },
        { id: 9533, stretchKey: "jambe_a_la_paroi", duration: 120 }
      ]
    },
    exercices: [
      { id: 501, name: "Tractions supination", series: "4×4-6", materiel: "barre", notes: "Focus traction contrôlée" },
      { id: 502, name: "Tractions australiennes pieds surélevés", series: "4×10-12", materiel: "barre", notes: "Pieds surélevés" },
      { id: 503, name: "Dips sur barre parallèle avec gilet", series: "4×12", materiel: "parallèles + gilet lesté", notes: "Gilet si disponible" },
      { id: 504, name: "Pompes déclinées (pieds sur banc)", series: "5×10", materiel: "banc", notes: "Haut des pecs" },
      { id: 505, name: "Relevés de genoux à la barre", series: "3×20", materiel: "barre" },
      { id: 506, name: "Relevés de genoux aux parallèles", series: "2×20", materiel: "parallèles" },
      { id: 507, name: "Mountain climbers", series: "30 sec", materiel: "poids du corps", type: "circuit_abdos" },
      { id: 508, name: "Planche dynamique", series: "1 min", materiel: "poids du corps", type: "circuit_abdos" },
      { id: 509, name: "Crunch bicyclettes", series: "12×", materiel: "poids du corps", type: "circuit_abdos" },
      { id: 510, name: "Gainage latéral dynamique", series: "30 sec", materiel: "poids du corps", type: "circuit_abdos" },
      { id: 511, name: "Crunch inversés", series: "12×", materiel: "poids du corps", type: "circuit_abdos" },
      { id: 512, name: "Vacuum", series: "5 cycles", materiel: "poids du corps", type: "circuit_abdos" }
    ],
    duree: "~1 h",
    complementaryActivity: {
      name: "Boxe",
      duration: 90,
      timeSlot: "19h30-21h",
      type: "cardio_technique",
      benefits: ["coordination", "cardio", "stress_relief"]
    }
  },

  samedi: {
    name: "Maison - Variante",
    focus: "Biceps / Pectoraux / Haut du torse",
    etirements: {
      matin: [
        { id: 9611, stretchKey: "marche_lente_consciente", duration: 180 },
        { id: 9612, stretchKey: "respiration_narines_alternees", duration: 60 },
        { id: 9613, stretchKey: "auto_massage_trapezes_cou", duration: 60 }
      ],
      midi: [
        { id: 9621, stretchKey: "etirement_dynamique_bras_croises", duration: 120 },
        { id: 9622, stretchKey: "posture_sphinx", duration: 120 },
        { id: 9623, stretchKey: "pont_fessier_pelvis_enroule", duration: 120 }
      ],
      soir: [
        { id: 9631, stretchKey: "assis_jambe_croisee_twist", duration: 180 },
        { id: 9632, stretchKey: "etirement_passif_psoas", duration: 120 },
        { id: 9633, stretchKey: "jambes_surelevees_respiration_basse", duration: 120 }
      ]
    },
    exercices: [
      { id: 601, name: "Pompes inclinées tempo", series: "4×10-12", materiel: "support", notes: "haut pecs, pieds sur support" },
      { id: 602, name: "Pompes serrées tempo", series: "3×12", materiel: "poids du corps", notes: "triceps + pecs internes" },
      { id: 603, name: "Curl concentration assis", series: "3×10 par bras", materiel: "haltère" },
      { id: 604, name: "Curl marteau", series: "3×12 par bras", materiel: "haltère" },
      { id: 605, name: "Curl Zottman", series: "3×10-12 par bras", materiel: "haltère" },
      { id: 606, name: "Planche avec lever de bras alterné", series: "3×30 sec", materiel: "poids du corps" }
    ],
    duree: "45-55 min",
    salleVariants: {
      semaineA: {
        name: "PECS / TRICEPS / BICEPS",
        exercices: [
          { id: 631, name: "Développé incliné haltères", series: "4×8-10", notes: "Contrôle lent, contraction forte en haut (angle 30-40°)" },
          { id: 632, name: "Développé incliné barre ou Smith", series: "3×8-10", notes: "Focus zone claviculaire" },
          { id: 633, name: "Écarté incliné", series: "3×12-15", notes: "Étirement complet, contraction lente" },
          { id: 634, name: "Pompes déclinées ou machine convergente", series: "3×max", notes: "Congestion maximale" },
          { id: 635, name: "Développé couché prise serrée", series: "3×8-10", notes: "Base de force triceps" },
          { id: 636, name: "Extension à la poulie corde", series: "3×12-15", notes: "Monte lentement, descends en contractant" },
          { id: 637, name: "Extension unilatérale à la poulie", series: "3×12-15 par bras", notes: "Bras collé, coude fixe" },
          { id: 638, name: "Curl incliné haltères", series: "4×10-12", notes: "Étirement maximal en bas" },
          { id: 639, name: "Curl marteau", series: "3×10-12", notes: "Cible le brachial" },
          { id: 640, name: "Curl poulie basse unilatéral", series: "3×12-15", notes: "Tension continue" }
        ]
      },
      semaineB: {
        name: "PECS / TRICEPS / BICEPS - VARIANTE",
        exercices: [
          { id: 651, name: "Développé incliné haltères", series: "4×8-10", notes: "Angle 30-40°, amplitude complète" },
          { id: 652, name: "Développé haltères plat", series: "3×8-10", notes: "Focus milieu poitrine" },
          { id: 653, name: "Écarté à la poulie vis-à-vis", series: "3×12-15", notes: "Tension constante" },
          { id: 654, name: "Pompes lestées ou classiques", series: "3×max", notes: "Congestion parfaite" },
          { id: 655, name: "Extension poulie prise pronation", series: "3×10-12", notes: "Focus vaste latéral" },
          { id: 656, name: "Extension poulie prise supination", series: "3×10-12", notes: "Accent longue portion" },
          { id: 657, name: "Extension unilatérale poulie", series: "3×12-15 par bras", notes: "Isolation maximale" },
          { id: 658, name: "Curl incliné haltères", series: "4×10-12", notes: "Étirement profond" },
          { id: 659, name: "Curl marteau", series: "3×10-12", notes: "Épaissit le bras" },
          { id: 660, name: "Curl poulie basse unilatéral", series: "3×12-15", notes: "Mouvement fluide" }
        ]
      }
    }
  },

  dimanche: {
    name: "Maison - Repos",
    focus: "Pectoraux / Triceps / Épaules",
    etirements: {
      matin: [
        { id: 9711, stretchKey: "respiration_nasale_lente", duration: 180 },
        { id: 9712, stretchKey: "balayage_corporel_mental", duration: 60 },
        { id: 9713, stretchKey: "bras_en_croix_ouverture_thoracique", duration: 60 }
      ],
      midi: [
        { id: 9721, stretchKey: "chat_vache", duration: 120 },
        { id: 9722, stretchKey: "cercles_cou_bras_hanches", duration: 120 },
        { id: 9723, stretchKey: "relachement_psoas_dos_au_sol", duration: 120 }
      ],
      soir: [
        { id: 9731, stretchKey: "jambes_surelevees_respiration_basse", duration: 300 },
        { id: 9732, stretchKey: "respiration_4_7_8", duration: 240 },
        { id: 9733, stretchKey: "balayage_corporel_mental", duration: 60 }
      ]
    },
    exercices: [
      { id: 701, name: "Pompes sur poignées avec gilet", series: "4×10-12", materiel: "poignées + gilet" },
      { id: 702, name: "Pompes pseudo-planche inclinées", series: "3×10", materiel: "support", notes: "haut pecs / delto avant" },
      { id: 703, name: "Développé militaire unilatéral assis", series: "3×10 par bras", materiel: "haltère" },
      { id: 704, name: "Élévations frontales", series: "12-15 par bras", materiel: "haltère", type: "superset_epaules" },
      { id: 705, name: "Oiseaux penché", series: "12-15", materiel: "haltère", type: "superset_epaules" },
      { id: 706, name: "Face pull élastique", series: "15", materiel: "élastique", type: "superset_epaules" },
      { id: 707, name: "Extensions triceps allongé", series: "10-12 par bras", materiel: "haltère", type: "bloc_triceps" },
      { id: 708, name: "Kickbacks triceps", series: "10-12 par bras", materiel: "haltère", type: "bloc_triceps" },
      { id: 709, name: "Pompes diamant lentes", series: "10-12", materiel: "poids du corps", type: "bloc_triceps" },
      { id: 710, name: "Pompes tempo sur poignées", series: "3×12", materiel: "poignées", type: "finisher" }
    ],
    duree: "60-70 min",
    salleVariants: {
      semaineA: {
        name: "JAMBES - SPÉCIALE DÉBUTANT / REPRISE",
        exercices: [
          { id: 731, name: "Squat", series: "4×8-10", notes: "Barre ou haltères, pieds largeur épaules" },
          { id: 732, name: "Presse à cuisses", series: "3×10-12", notes: "Pousse avec les talons" },
          { id: 733, name: "Fentes marchées", series: "3×10 par jambe", notes: "Grande amplitude, buste droit" },
          { id: 734, name: "Leg extension", series: "3×12-15", notes: "Monte vite, descends lentement" },
          { id: 735, name: "Leg curl allongé", series: "3×10-12", notes: "Contracte fort en haut" },
          { id: 736, name: "Hip thrust", series: "3×10-12", notes: "Dos sur banc, contraction max" },
          { id: 737, name: "Soulevé de terre jambes semi-tendues", series: "3×10-12", notes: "Légère flexion genoux" },
          { id: 738, name: "Mollets debout", series: "4×15-20", notes: "Contraction 1 sec en haut" },
          { id: 739, name: "Mollets assis", series: "3×15-20", notes: "Cible le soléaire" },
          { id: 740, name: "Gainage", series: "3×30-45 sec", notes: "Stabilité du tronc" }
        ]
      },
      semaineB: {
        name: "JAMBES - VARIANTE",
        exercices: [
          { id: 751, name: "Front squat", series: "4×8-10", notes: "Plus de charge sur quadriceps" },
          { id: 752, name: "Hack squat", series: "3×10-12", notes: "Excellent pour quadriceps" },
          { id: 753, name: "Fentes bulgares", series: "3×10 par jambe", notes: "Pied arrière sur banc" },
          { id: 754, name: "Sissy squat", series: "3×12-15", notes: "Finition quadriceps" },
          { id: 755, name: "Soulevé de terre jambes tendues", series: "3×10-12", notes: "Accent ischios et fessiers" },
          { id: 756, name: "Good morning", series: "3×12-15", notes: "Mouvement de charnière hanche" },
          { id: 757, name: "Glute bridge", series: "3×12-15", notes: "Variante hip thrust" },
          { id: 758, name: "Mollets à la presse", series: "4×15-20", notes: "Descente lente" },
          { id: 759, name: "Mollets unilatéraux debout", series: "3×15 par jambe", notes: "Corriger déséquilibres" },
          { id: 760, name: "Gainage dynamique", series: "3×30-45 sec", notes: "Alternance planche avant/côté" }
        ]
      }
    }
  }
};

// Variantes de semaine pour certains jours
export const weekVariants = {
  A: 'semaineA',
  B: 'semaineB'
};