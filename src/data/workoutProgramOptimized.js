// Programme d'entraînement SEMAINE COMPLÈTE - CYCLE 3+1 (OPTIMISÉ HAUT PEC / DELTO LAT / TRICEPS / DOS)

export const workoutProgramOptimized = {
  lundi: {
    name: "Street Workout (dos / core / contrôle)",
    focus: "dos / core / contrôle",
    etirements: {
      matin: "1 min respiration nasale lente (assis ou allongé, main sur ventre) + 1 min auto-grandissement assis (aligner tête/colonne/bassin) + 2 min mobilisation cervicale (flexion / extension / rotation douce) + 2 min rotations d'épaules, bras pendants, debout",
      midi: "2 min Étirement passif psoas (fente jambe arrière posée, dos droit) + 1 min étirement en rotation thoracique (couché, bras croisé à 90°) + 2 min pendule d'épaule (buste penché, bras relâché)",
      soir: "3 min jambe à la paroi (décrocher le bassin) + 1 min d'étirement passif des fléchisseurs de hanche + 1 min dead hang passif au chambranle (optionnel si accessible)"
    },
    exercices: [
      { id: 1001, name: "Tractions pronation", series: "4×4-6", materiel: "barre" },
      { id: 1002, name: "Tractions australiennes", series: "4×10", materiel: "barre" },
      { id: 1003, name: "Dips parallèles", series: "4×12 (8 reps normales + 4 reps amplitude complète)", materiel: "parallèles" },
      { id: 1004, name: "Pompes inclinées (pieds sur banc)", series: "4×12", materiel: "banc", notes: "accent haut pec" },
      { id: 1005, name: "Pompes inclinées mains rapprochées", series: "3×10", materiel: "banc", notes: "haut pec + triceps" },
      { id: 1006, name: "Relevés de genoux à la barre", series: "2×20", materiel: "barre" },
      { id: 1007, name: "Relevés de genoux aux parallèles", series: "2×20", materiel: "parallèles" },
      { id: 1008, name: "Row horizontal avec élastique / barre basse", series: "3×12", materiel: "élastique / barre", notes: "rhomboïdes / trap moyen" },
      { id: 1009, name: "Face pulls avec élastique", series: "3×15", materiel: "élastique", notes: "delto post + trap moyen/inf" },
      { id: 1010, name: "Mountain climbers", series: "30 sec", type: "circuit_abdos" },
      { id: 1011, name: "Planche", series: "1 min", type: "circuit_abdos" },
      { id: 1012, name: "Jambes tendues rétroversées", series: "20×", type: "circuit_abdos" },
      { id: 1013, name: "Gainage latéral", series: "30 sec chaque côté", type: "circuit_abdos" },
      { id: 1014, name: "Crunchs inversés", series: "15×", type: "circuit_abdos" },
      { id: 1015, name: "Vacuum allongé", series: "5 cycles", type: "circuit_abdos" },
      { id: 1016, name: "Corde à sauter", series: "10 min", materiel: "corde à sauter", type: "cardio" }
    ],
    duree: "~1 h"
  },

  mardi: {
    name: "Maison : Biceps / Pectoraux / Haut du torse",
    focus: "Biceps / Pectoraux / Haut du torse",
    etirements: {
      matin: "3 min respiration allongée ventre + bassin surélevé + 2 min mobilité scapulaire (cercles bras tendus devant, coude fléchi) + 2 min étirement actif du haut du dos (assis, mains croisées loin devant)",
      midi: "2 min ouverture en Y sur le mur (dos collé, bras glissent) + 1 min posture du sphinx (lombaires relâchées, tête rentrée) + 2 min massage auto myofascial (balle ou main sur pectoraux)",
      soir: "2 min étirement cou + trapèzes (assise, inclinaisons lentes) + 2 min couchée sur rouleau serviette vertical (bras ouverts) + 1 min respiration nasale profonde, tempo 4-4-4"
    },
    exercices: [
      { id: 2001, name: "Pompes classiques", series: "4×12", materiel: "poids du corps" },
      { id: 2002, name: "Pompes inclinées pieds surélevés", series: "4×12", materiel: "support", notes: "accent haut pec" },
      { id: 2003, name: "Curl alterné avec haltère", series: "3×10 par bras", materiel: "haltère" },
      { id: 2004, name: "Curl marteau", series: "3×12 par bras", materiel: "haltère" },
      { id: 2005, name: "Curl Zottman", series: "3×10 par bras", materiel: "haltère" },
      { id: 2006, name: "Pompes serrées diamant", series: "3×12", materiel: "poids du corps", notes: "triceps long chef" },
      { id: 2007, name: "Planche bras tendus", series: "3×30 sec", materiel: "poids du corps" },
      { id: 2008, name: "Élévations latérales avec élastique", series: "3×12-15", materiel: "élastique", notes: "delto lat" },
      { id: 2009, name: "Extensions triceps overhead élastique", series: "3×10-12", materiel: "élastique", notes: "long chef triceps" },
      { id: 2010, name: "Corde à sauter", series: "10 min", materiel: "corde à sauter", type: "cardio" }
    ],
    duree: "50-55 min"
  },

  mercredi: {
    name: "Maison : Pectoraux / Triceps / Épaules",
    focus: "Pectoraux / Triceps / Épaules",
    etirements: {
      matin: "2 min étirement ischio (assis, dos droit, jambes tendues) + 2 min activation fessiers (ponts au sol, 2×15 reps lentes) + 2 min assouplissement psoas (fente + bras opposé en élévation)",
      midi: "3 min assis au mur (angle droit, gainage passif en appui) + 2 min genoux-poitrine allongé (relâchement lombaire) + 1 min respiration nasale dos collé au sol, genoux fléchis",
      soir: "3 min posture de l'enfant (bras loin devant) + 1 min chat-vache lent + 2 min allongé, jambes croisées (étirement piriforme + fessier)"
    },
    exercices: [
      { id: 3001, name: "Pompes déclinées (pieds sur support)", series: "4×10", materiel: "support", notes: "accent haut pec" },
      { id: 3002, name: "Pompes pseudo-planche", series: "3×10", materiel: "poids du corps" },
      { id: 3003, name: "Développé militaire unilatéral", series: "3×10 par bras", materiel: "haltère" },
      { id: 3004, name: "Élévations latérales", series: "3×12-15", materiel: "haltère / élastique", notes: "delto lat" },
      { id: 3005, name: "Oiseaux penché", series: "3×12-15", materiel: "haltère / élastique", notes: "delto post" },
      { id: 3006, name: "Face pull élastique", series: "3×15", materiel: "élastique", notes: "trap moyen / inf" },
      { id: 3007, name: "Extensions triceps unilatérales au-dessus tête", series: "3×10-12", materiel: "haltère", notes: "long chef triceps" },
      { id: 3008, name: "Kickbacks triceps unilatéraux", series: "3×10-12", materiel: "haltère" },
      { id: 3009, name: "Pompes diamant lentes", series: "10-12", materiel: "poids du corps" },
      { id: 3010, name: "Pompes sur poignées tempo lent", series: "3×12", materiel: "poignées" },
      { id: 3011, name: "Corde à sauter", series: "10 min", materiel: "corde à sauter", type: "cardio" }
    ],
    duree: "60-70 min"
  },

  jeudi: {
    name: "Repos / Mobilité",
    focus: "Mobilité thoracique & cou / nuque",
    etirements: {
      matin: "1 min respiration diaphragmatique, main sur le ventre + 2 min rotations cervicales douces (flexion / extension / inclinaisons latérales) + 2 min mobilisation scapulaire (cercles bras tendus, épaules relâchées)",
      midi: "2 min fentes avant, bassin droit, bras levés → étirement psoas / diaphragme + 2 min ouverture thoracique au sol (bras ouverts) + 1 min cat-cow lent",
      soir: "3 min posture de l'enfant, bras tendus + 2 min pendule d'épaule (buste penché) + 2 min respiration nasale profonde, tempo 4-4-4"
    },
    exercices: [
      { id: 4001, name: "Row horizontal léger avec élastique", series: "2×12", materiel: "élastique", notes: "activer trap moyen / rhomboïdes", type: "optionnel" },
      { id: 4002, name: "Pompes inclinées tempo lent", series: "2×12", materiel: "poids du corps", notes: "activer haut pec / delto ant", type: "optionnel" }
    ],
    duree: "20-25 min (repos actif / mobilité)",
    notes: "Jour de repos actif avec focus sur la mobilité"
  },

  vendredi: {
    name: "Street Workout (dos / core / contrôle – variante)",
    focus: "dos / core / contrôle",
    etirements: {
      matin: "1 min respiration diaphragmatique debout + 2 min auto-grandissement (colonne alignée) + 2 min rotations d'épaules bras relâchés + 2 min cat-cow assis / debout",
      midi: "2 min étirement thoracique contre mur + 2 min fente psoas latérale + 1 min pendule épaule / bras relâché",
      soir: "2 min posture de l'enfant + 1 min rotations thoraciques allongé + 2 min respiration profonde allongé"
    },
    exercices: [
      { id: 5001, name: "Tractions supination", series: "4×3", materiel: "barre" },
      { id: 5002, name: "Tractions australiennes pieds surélevés", series: "4×10-12", materiel: "barre" },
      { id: 5003, name: "Dips sur barre parallèle", series: "3×6-8", materiel: "parallèles" },
      { id: 5004, name: "Pompes déclinées", series: "5×10", materiel: "support", notes: "haut pec" },
      { id: 5005, name: "Relevés de genoux à la barre", series: "3×20", materiel: "barre" },
      { id: 5006, name: "Relevés de genoux aux parallèles", series: "2×20", materiel: "parallèles" },
      { id: 5007, name: "Row horizontal élastique ou barre basse", series: "3×12", materiel: "élastique / barre", notes: "rhomboïdes / trap moyen" },
      { id: 5008, name: "Face pull élastique", series: "3×15", materiel: "élastique", notes: "delto post + trap moyen/inf" },
      { id: 5009, name: "Élévations latérales légères", series: "3×12", materiel: "haltère / élastique", notes: "delto lat" },
      { id: 5010, name: "Mountain climbers", series: "30 sec", type: "circuit_abdos" },
      { id: 5011, name: "Planche dynamique", series: "1 min", type: "circuit_abdos" },
      { id: 5012, name: "Crunch bicyclettes", series: "12×", type: "circuit_abdos" },
      { id: 5013, name: "Gainage latéral dynamique", series: "30 sec", type: "circuit_abdos" },
      { id: 5014, name: "Crunch inversés", series: "12×", type: "circuit_abdos" },
      { id: 5015, name: "Vacuum", series: "5 cycles", type: "circuit_abdos" },
      { id: 5016, name: "Corde à sauter", series: "10 min", materiel: "corde à sauter", type: "cardio" }
    ],
    duree: "~1 h"
  },

  samedi: {
    name: "Biceps / Pectoraux / Haut du torse",
    focus: "Biceps / Pectoraux / Haut du torse",
    etirements: {
      matin: "2 min respiration diaphragmatique + 2 min ouverture thoracique allongé, bras en croix + 2 min mobilisation des omoplates (cercles lents)",
      midi: "2 min fente avant, bassin neutre + 1 min cat-cow + 2 min rotations thoraciques allongé",
      soir: "3 min posture de l'enfant + 2 min pendule épaule + 1 min respiration lente"
    },
    // Exercices par défaut (maison) - utilisés quand isGymMode = false
    exercices: [
      { id: 6001, name: "Pompes classiques", series: "4×12", materiel: "poids du corps" },
      { id: 6002, name: "Pompes inclinées pieds surélevés", series: "4×12", materiel: "support", notes: "haut pec" },
      { id: 6003, name: "Curl alterné avec élastique", series: "3×10", materiel: "élastique" },
      { id: 6004, name: "Curl marteau", series: "3×12", materiel: "haltère / élastique" },
      { id: 6005, name: "Curl Zottman", series: "3×10", materiel: "haltère" },
      { id: 6006, name: "Pompes serrées diamant", series: "3×12", materiel: "poids du corps", notes: "triceps long chef" },
      { id: 6007, name: "Planche bras tendus", series: "3×30 sec", materiel: "poids du corps" },
      { id: 6008, name: "Élévations latérales", series: "3×12-15", materiel: "élastique", notes: "delto lat" },
      { id: 6009, name: "Extensions triceps overhead", series: "3×10-12", materiel: "élastique", notes: "long chef triceps" },
      { id: 6010, name: "Corde à sauter", series: "10 min", materiel: "corde à sauter", type: "cardio" }
    ],
    duree: "50-55 min",
    // ✅ FIX : Variantes salle - semaineA = maison (par défaut), semaineB = salle
    salleVariants: {
      semaineA: {
        name: "VARIANTE A – MAISON",
        exercices: [
          { id: 6001, name: "Pompes classiques", series: "4×12", materiel: "poids du corps" },
          { id: 6002, name: "Pompes inclinées pieds surélevés", series: "4×12", materiel: "support", notes: "haut pec" },
          { id: 6003, name: "Curl alterné avec élastique", series: "3×10", materiel: "élastique" },
          { id: 6004, name: "Curl marteau", series: "3×12", materiel: "haltère / élastique" },
          { id: 6005, name: "Curl Zottman", series: "3×10", materiel: "haltère" },
          { id: 6006, name: "Pompes serrées diamant", series: "3×12", materiel: "poids du corps", notes: "triceps long chef" },
          { id: 6007, name: "Planche bras tendus", series: "3×30 sec", materiel: "poids du corps" },
          { id: 6008, name: "Élévations latérales", series: "3×12-15", materiel: "élastique", notes: "delto lat" },
          { id: 6009, name: "Extensions triceps overhead", series: "3×10-12", materiel: "élastique", notes: "long chef triceps" },
          { id: 6010, name: "Corde à sauter", series: "10 min", materiel: "corde à sauter", type: "cardio" }
        ]
      },
      semaineB: {
        name: "VARIANTE B – SALLE",
        exercices: [
          { id: 6101, name: "Row barre ou haltères unilatéral", series: "4×10-12", materiel: "salle", notes: "Focalisation sur rhomboïdes et trap moyen, pause 1–2s en contraction" },
          { id: 6102, name: "Face pull à la poulie", series: "3×15", materiel: "salle", notes: "Delto post + trap moyen/inf, tempo lent" },
          { id: 6103, name: "Tirage horizontal à la poulie basse", series: "3×12-15", materiel: "salle", notes: "Poids modéré, contraction forte, épaules basses" },
          { id: 6104, name: "Pull-over poulie ou haltère", series: "3×12", materiel: "salle", notes: "Accent sur insertion bas du pec + expansion thoracique" },
          { id: 6105, name: "Développé incliné barre ou haltères", series: "4×8-10", materiel: "salle", notes: "haut pec prioritaire" },
          { id: 6106, name: "Développé couché barre ou haltères", series: "3×8-10", materiel: "salle", notes: "volume général pec" },
          { id: 6107, name: "Écarté incliné haltères ou poulie", series: "3×12", materiel: "salle", notes: "haut pec + contraction maximale" },
          { id: 6108, name: "Pompes sur banc / incliné", series: "2×15", materiel: "salle", notes: "finisher contraction haut pec" },
          { id: 6109, name: "Élévations latérales haltères", series: "4×12-15", materiel: "salle", notes: "delto lat priorité" },
          { id: 6110, name: "Oiseaux / reverse fly poulie ou haltères", series: "3×12", materiel: "salle", notes: "delto post / trap moyen" },
          { id: 6111, name: "Développé militaire barre ou haltères", series: "3×8-10", materiel: "salle", notes: "delto ant + volume global" },
          { id: 6112, name: "Curl incliné haltères", series: "3×10-12", materiel: "salle" },
          { id: 6113, name: "Curl marteau", series: "3×12", materiel: "salle" },
          { id: 6114, name: "Extension poulie haute", series: "3×12", materiel: "salle", notes: "long chef" },
          { id: 6115, name: "Dips banc / poids additionnel", series: "3×10-12", materiel: "salle", notes: "sweep triceps" },
          { id: 6116, name: "Relevés de jambes suspendu", series: "3×15", materiel: "salle" },
          { id: 6117, name: "Planche dynamique / twist", series: "3×30 sec", materiel: "salle" },
          { id: 6118, name: "Étirements post-séance", series: "10 min", materiel: "salle", notes: "pectoraux, trap, delto post, triceps", type: "etirement" }
        ]
      }
    }
  },

  dimanche: {
    name: "Street Workout (dos / core / contrôle)",
    focus: "dos / core / contrôle",
    etirements: {
      matin: "1 min respiration diaphragmatique + 2 min mobilisation cervicale + 2 min auto-grandissement debout + 2 min rotations d'épaules bras pendants",
      midi: "2 min fente psoas + 2 min ouverture thoracique (bras ouverts, dos au sol) + 1 min pendule épaule",
      soir: "3 min posture de l'enfant + 2 min chat-vache + 2 min respiration profonde allongé"
    },
    exercices: [
      { id: 7001, name: "Tractions pronation", series: "4×4-6", materiel: "barre" },
      { id: 7002, name: "Tractions australiennes", series: "4×10", materiel: "barre" },
      { id: 7003, name: "Dips parallèles", series: "4×12 (8 reps normales + 4 reps amplitude complète)", materiel: "parallèles" },
      { id: 7004, name: "Pompes inclinées pieds surélevés", series: "4×12", materiel: "support", notes: "haut pec" },
      { id: 7005, name: "Pompes inclinées mains rapprochées", series: "3×10", materiel: "support", notes: "haut pec + triceps" },
      { id: 7006, name: "Relevés de genoux à la barre", series: "2×20", materiel: "barre" },
      { id: 7007, name: "Relevés de genoux aux parallèles", series: "2×20", materiel: "parallèles" },
      { id: 7008, name: "Row horizontal avec élastique", series: "3×12", materiel: "élastique", notes: "rhomboïdes / trap moyen" },
      { id: 7009, name: "Face pull élastique", series: "3×15", materiel: "élastique", notes: "delto post + trap moyen/inf" },
      { id: 7010, name: "Élévations latérales légères", series: "3×12", materiel: "haltère / élastique", notes: "delto lat" },
      { id: 7011, name: "Mountain climbers", series: "30 sec", type: "circuit_abdos" },
      { id: 7012, name: "Planche", series: "1 min", type: "circuit_abdos" },
      { id: 7013, name: "Jambes tendues rétroversées", series: "20×", type: "circuit_abdos" },
      { id: 7014, name: "Gainage latéral", series: "30 sec chaque côté", type: "circuit_abdos" },
      { id: 7015, name: "Crunchs inversés", series: "15×", type: "circuit_abdos" },
      { id: 7016, name: "Vacuum allongé", series: "5 cycles", type: "circuit_abdos" },
      { id: 7017, name: "Corde à sauter", series: "10 min", materiel: "corde à sauter", type: "cardio" }
    ],
    duree: "~1 h"
  }
};

// Variantes de semaine pour certains jours
export const weekVariantsOptimized = {
  A: 'semaineA',
  B: 'semaineB'
};
