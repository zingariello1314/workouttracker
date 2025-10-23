// Programme d'entraînement complet Cycle 3+1

export const workoutProgram = {
  lundi: {
    name: "Street Workout + Boxe",
    focus: "dos / core / contrôle",
    etirements: {
      matin: "1 min respiration nasale lente (assis ou allongé, main sur ventre) + 1 min auto-grandissement assis (aligner tête/colonne/bassin) + 2 min mobilisation cervicale (flexion / extension / rotation douce) + 2 min rotations d'épaules, bras pendants, debout",
      midi: "2 min Étirement passif psoas (fente jambe arrière posée, dos droit) + 1 min étirement en rotation thoracique (couché, bras croisé à 90°) + 2 min pendule d'épaule (buste penché, bras relâché)",
      soir: "3 min jambe à la paroi (décrocher le bassin) + 1 min d'étirement passif des fléchisseurs de hanche + 1 min dead hang passif au chambranle (optionnel si accessible)"
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
      matin: "3 min respiration allongée ventre + bassin surélevé + 2 min mobilité scapulaire (cercles bras tendus devant, coude fléchi) + 2 min étirement actif du haut du dos (assis, mains croisées loin devant)",
      midi: "2 min ouverture en Y sur le mur (dos collé, bras glissent) + 1 min posture du sphinx (lombaires relâchées, tête rentrée) + 2 min massage auto myofascial (balle ou main sur pectoraux)",
      soir: "2 min étirement cou + trapèzes (assise, inclinaisons lentes) + 2 min couchée sur rouleau serviette vertical (bras ouverts) + 1 min respiration nasale profonde, tempo 4-4-4"
    },
    exercices: [
      { id: 201, name: "Pompes lestées", series: "4×10-12", materiel: "gilet lesté", notes: "Focus contrôle + descente lente" },
      { id: 202, name: "Pompes inclinées sur support", series: "4×12", materiel: "support", notes: "haut des pecs" },
      { id: 203, name: "Curl alterné", series: "3×10 par bras", materiel: "haltère" },
      { id: 204, name: "Curl marteau", series: "3×12 par bras", materiel: "haltère" },
      { id: 205, name: "Curl Zottman", series: "3×10 par bras", materiel: "haltère", notes: "montée supination, descente pronation" },
      { id: 206, name: "Pompes serrées diamant", series: "3×12", materiel: "poids du corps" },
      { id: 207, name: "Planche bras tendus", series: "3×30 sec", materiel: "poids du corps", type: "finisher" },
      { id: 208, name: "Natation", series: "1×90min", materiel: "Piscine", type: "cardio_endurance", notes: "19h30-21h - cardio, endurance, recovery" }
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
      matin: "2 min étirement ischio (assis, dos droit, jambes tendues) + 2 min activation fessiers (ponts au sol, 2x15 reps lentes) + 2 min assouplissement psoas (fente + bras opposé en élévation)",
      midi: "3 min assis au mur (angle droit, gainage passif en appui) + 2 min genoux-poitrine allongé (relâchement lombaire) + 1 min respiration nasale dos collé au sol, genoux fléchis",
      soir: "3 min posture de l'enfant (bras loin devant) + 1 min chat-vache lent + 2 min allongé, jambes croisées (étirement piriforme + fessier)"
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
      matin: "2 min assis dos droit, inclinaisons latérales tête + 2 min cercles thoraciques debout (mains sur cage thoracique) + 2 min ouverture en T allongé (mobilité rotation de la colonne)",
      midi: "2 min wall slides (glisser bras contre mur en W) + 1 min étirement sternocléido (main sur clavicule, inclinaison opposée) + 2 min face contre mur, menton rentré, redressement passif",
      soir: "3 min allongé, tête suspendue (bord du lit, traction douce) + 2 min respiration expand belly (main ventre + main poitrine) + 1 min sphinx ou mini-cobra pour relâchement postural"
    },
    exercices: [],
    duree: "Étirements uniquement",
    notes: "Jour de repos actif avec focus sur la mobilité"
  },

  vendredi: {
    name: "Jambes / Fessiers + Boxe",
    focus: "Jambes / Fessiers / Stabilité",
    etirements: {
      matin: "3 min respiration allongée ventre + bassin surélevé + 2 min mobilité scapulaire (cercles bras tendus devant, coude fléchi) + 2 min étirement actif du haut du dos (assis, mains croisées loin devant)",
      midi: "2 min ouverture en Y sur le mur (dos collé, bras glissent) + 1 min posture du sphinx (lombaires relâchées, tête rentrée) + 2 min massage auto myofascial (balle ou main sur pectoraux)",
      soir: "2 min étirement cou + trapèzes (assise, inclinaisons lentes) + 2 min couchée sur rouleau serviette vertical (bras ouverts) + 1 min respiration nasale profonde, tempo 4-4-4"
    },
    exercices: [
      { id: 501, name: "Squats lestés", series: "4×12-15", materiel: "gilet lesté", notes: "Descente contrôlée 3s" },
      { id: 502, name: "Fentes alternées", series: "3×12 par jambe", materiel: "haltère" },
      { id: 503, name: "Squats bulgares", series: "3×10 par jambe", materiel: "support + haltère" },
      { id: 504, name: "Soulevé de terre roumain", series: "4×12", materiel: "haltère", notes: "Focus ischio + fessiers" },
      { id: 505, name: "Hip thrust", series: "3×15", materiel: "support + haltère", notes: "Contraction fessiers 2s" },
      { id: 506, name: "Squats sautés", series: "3×12", materiel: "poids du corps", type: "explosif" },
      { id: 507, name: "Mollets debout", series: "3×20", materiel: "haltère" },
      { id: 508, name: "Gainage latéral", series: "2×30s par côté", materiel: "poids du corps", type: "finisher" },
      { id: 509, name: "Boxe", series: "1×90min", materiel: "Gants de boxe", type: "cardio_technique", notes: "19h30-21h - coordination, cardio, stress_relief" }
    ],
    duree: "55-65 min",
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
      matin: "3 min de marche très lente et consciente + 1 min respiration par narines alternées + 1 min auto-massage trapèze + cou avec les mains",
      midi: "2 min étirement dynamique bras croisés (type nage dos) + 2 min posture du sphinx + inspiration/expiration amplifiée + 2 min pont fessier (pelvis enroulé doucement vers le haut)",
      soir: "3 min assis, jambe croisée (twist lent colonne) + 2 min étirement psoas + 2 min jambes surélevées + respiration basse + yeux fermés"
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
      matin: "3 min allongé, respiration sans tension + 1 min balayage corporel mental (prise de conscience zones tendues) + 1 min bras en croix, ouverture thoracique passive",
      midi: "2 min chat-vache + 2 min cercles lents de cou, bras et hanches + 2 min relâchement psoas + dos au sol",
      soir: "5 min allongé jambes en l'air ou sur un support + Respiration 4-7-8 (inspire 4s – bloque 7s – expire 8s) + Introspection / recentrage / récupération profonde"
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