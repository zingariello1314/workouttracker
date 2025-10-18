// Programme d'entraînement complet Cycle 3+1
export const workoutProgram = {
  lundi: {
    name: "Street Workout-Boxe",
    focus: "dos / core / contrôle",
    etirements: {
      matin: "1 min respiration nasale lente (assis ou allongé, main sur ventre) + 1 min auto-grandissement assis (aligner tête/colonne/bassin) + 2 min mobilisation cervicale (flexion / extension / rotation douce) + 2 min rotations d'épaules, bras pendants, debout",
      midi: "2 min Étirement passif psoas (fente jambe arrière posée, dos droit) + 1 min étirement en rotation thoracique (couché, bras croisé à 90°) + 2 min pendule d'épaule (buste penché, bras relâché)",
      soir: "3 min jambe à la paroi (décrocher le bassin) + 1 min d'étirement passif des fléchisseurs de hanche + 1 min dead hang passif au chambranle (optionnel si accessible)"
    },
    exercices: [
      { id: 1, name: "Tractions pronation", series: "4×4-6", materiel: "barre" },
      { id: 2, name: "Tractions australiennes", series: "4×10", materiel: "barre" },
      { id: 3, name: "Dips parallèles", series: "4×12 (8 normales + 4 amplitude complète)", materiel: "parallèles" },
      { id: 4, name: "Pompes inclinées pieds sur banc", series: "3×12", materiel: "banc" },
      { id: 5, name: "Pompes inclinées mains sur banc", series: "2×12", materiel: "banc" },
      { id: 6, name: "Relevés de genoux à la barre", series: "2×20", materiel: "barre" },
      { id: 7, name: "Relevés de genoux aux parallèles", series: "2×20", materiel: "parallèles" },
      { id: 8, name: "Mountain climbers", series: "30 sec", type: "circuit_abdos" },
      { id: 9, name: "Planche", series: "1 min", type: "circuit_abdos" },
      { id: 10, name: "Jambes tendues rétroversées", series: "20×", type: "circuit_abdos" },
      { id: 11, name: "Gainage latéral", series: "30 sec chaque côté", type: "circuit_abdos" },
      { id: 12, name: "Crunchs inversés", series: "15×", type: "circuit_abdos" },
      { id: 13, name: "Vacuum allongé", series: "5 cycles", type: "circuit_abdos" }
    ],
    duree: "1h",
    notes: "Boxe 1h30 de 19h30 à 21h"
  },

  mardi: {
    name: "Natation / Maison",
    focus: "Biceps / Pectoraux / Haut du torse",
    etirements: {
      matin: "3 min respiration allongée ventre + bassin surélevé + 2 min mobilité scapulaire (cercles bras tendus devant, coude fléchi) + 2 min étirement actif du haut du dos (assis, mains croisées loin devant)",
      midi: "2 min ouverture en Y sur le mur (dos collé, bras glissent) + 1 min posture du sphinx (lombaires relâchées, tête rentrée) + 2 min massage auto myofascial (balle ou main sur pectoraux)",
      soir: "2 min étirement cou + trapèzes (assise, inclinaisons lentes) + 2 min couchée sur rouleau serviette vertical (bras ouverts) + 1 min respiration nasale profonde, tempo 4-4-4"
    },
    exercices: [
      { id: 1, name: "Pompes lestées", series: "4×10-12", materiel: "gilet lesté", notes: "Focus contrôle + descente lente" },
      { id: 2, name: "Pompes inclinées sur support", series: "4×12", materiel: "support", notes: "haut des pecs" },
      { id: 3, name: "Curl alterné", series: "3×10 par bras", materiel: "haltère" },
      { id: 4, name: "Curl marteau", series: "3×12 par bras", materiel: "haltère" },
      { id: 5, name: "Curl Zottman", series: "3×10 par bras", materiel: "haltère", notes: "montée supination, descente pronation" },
      { id: 6, name: "Pompes serrées diamant", series: "3×12", materiel: "poids du corps" },
      { id: 7, name: "Planche bras tendus", series: "3×30 sec", materiel: "poids du corps", type: "finisher" }
    ],
    duree: "45-55 min",
    notes: "Natation 2h + récup. Option lourde : gilet sur les 2 premières séries de pompes"
  },

  mercredi: {
    name: "Boxe - Maison",
    focus: "Pectoraux / Triceps / Épaules",
    etirements: {
      matin: "2 min étirement ischio (assis, dos droit, jambes tendues) + 2 min activation fessiers (ponts au sol, 2x15 reps lentes) + 2 min assouplissement psoas (fente + bras opposé en élévation)",
      midi: "3 min assis au mur (angle droit, gainage passif en appui) + 2 min genoux-poitrine allongé (relâchement lombaire) + 1 min respiration nasale dos collé au sol, genoux fléchis",
      soir: "3 min posture de l'enfant (bras loin devant) + 1 min chat-vache lent + 2 min allongé, jambes croisées (étirement piriforme + fessier)"
    },
    exercices: [
      { id: 1, name: "Pompes déclinées", series: "4×10", materiel: "support", notes: "Gilet sur 2 séries si possible" },
      { id: 2, name: "Pompes pseudo-planche", series: "3×10", materiel: "poids du corps", notes: "Haut des pecs / delto avant" },
      { id: 3, name: "Développé militaire unilatéral", series: "3×10 par bras", materiel: "haltère" },
      { id: 4, name: "Élévations latérales", series: "12-15 par bras", materiel: "haltère", type: "superset_epaules" },
      { id: 5, name: "Oiseaux", series: "12-15", materiel: "haltère", type: "superset_epaules", notes: "élévations postérieures" },
      { id: 6, name: "Face pull", series: "15", materiel: "élastique", type: "superset_epaules" },
      { id: 7, name: "Extensions triceps unilatérales", series: "10-12 par bras", materiel: "haltère", type: "bloc_triceps", notes: "au-dessus de la tête" },
      { id: 8, name: "Kickbacks triceps", series: "10-12 par bras", materiel: "haltère", type: "bloc_triceps" },
      { id: 9, name: "Pompes diamant lentes", series: "10-12", materiel: "poids du corps", type: "bloc_triceps", notes: "3s descente / 1s montée" },
      { id: 10, name: "Pompes sur poignées tempo", series: "3×12", materiel: "poignées", type: "finisher", notes: "Focus contrôle et congestion" }
    ],
    duree: "60-70 min",
    notes: "Superset épaules - 3 à 4 tours (30s entre exos / 90s entre tours). Bloc triceps - 3 à 4 tours (30-45s entre exos / 90s entre tours)"
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
    name: "Street Workout variante",
    focus: "dos / core / contrôle - variante",
    etirements: {
      matin: "2 min en appui contre mur (tête/omoplates/fesses/talons) + 1 min marche lente pieds nus (ancrage plantaire) + 2 min élévation sur demi-pointes (activation mollets/posture)",
      midi: "2 min squat passif (ou assis sur talons si trop dur) + 1 min balancier bras jambe opposée debout + 1 min allongé, jambes en chaise à 90°, focus respiration",
      soir: "2 min pendule bras + hanche + 2 min relâchement lombaire (genoux pliés, bascule douce bassin) + 2 min jambe à la verticale (décompression veineuse + bassin)"
    },
    exercices: [
      { id: 1, name: "Tractions supination", series: "4×3", materiel: "barre + gilet lesté" },
      { id: 2, name: "Tractions australiennes pieds surélevés", series: "4×10-12", materiel: "barre + support" },
      { id: 3, name: "Dips sur barre parallèle avec gilet", series: "3×6-8", materiel: "parallèles + gilet" },
      { id: 4, name: "Pompes déclinées", series: "5×10", materiel: "support", notes: "haut des pecs" },
      { id: 5, name: "Relevés de genoux à la barre", series: "3×20", materiel: "barre" },
      { id: 6, name: "Relevés de genoux aux parallèles", series: "2×20", materiel: "parallèles" },
      { id: 7, name: "Mountain climbers", series: "30 sec", type: "circuit_abdos" },
      { id: 8, name: "Planche dynamique", series: "1 min", type: "circuit_abdos" },
      { id: 9, name: "Crunch bicyclettes", series: "12×", type: "circuit_abdos" },
      { id: 10, name: "Gainage latéral dynamique", series: "30 sec", type: "circuit_abdos" },
      { id: 11, name: "Crunch inversés", series: "12×", type: "circuit_abdos" },
      { id: 12, name: "Vacuum", series: "5 cycles", type: "circuit_abdos" }
    ],
    duree: "1h"
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
      { id: 1, name: "Pompes inclinées tempo", series: "4×10-12", materiel: "support", notes: "haut pecs, pieds sur support" },
      { id: 2, name: "Pompes serrées tempo", series: "3×12", materiel: "poids du corps", notes: "triceps + pecs internes" },
      { id: 3, name: "Curl concentration assis", series: "3×10 par bras", materiel: "haltère" },
      { id: 4, name: "Curl marteau", series: "3×12 par bras", materiel: "haltère" },
      { id: 5, name: "Curl Zottman", series: "3×10-12 par bras", materiel: "haltère" },
      { id: 6, name: "Planche avec lever de bras alterné", series: "3×30 sec", materiel: "poids du corps" }
    ],
    duree: "45-55 min",
    salleVariants: {
      semaineA: {
        name: "PECS / TRICEPS / BICEPS",
        exercices: [
          { id: 1, name: "Développé incliné haltères", series: "4×8-10", notes: "Contrôle lent, contraction forte en haut (angle 30-40°)" },
          { id: 2, name: "Développé incliné barre ou Smith", series: "3×8-10", notes: "Focus zone claviculaire" },
          { id: 3, name: "Écarté incliné", series: "3×12-15", notes: "Étirement complet, contraction lente" },
          { id: 4, name: "Pompes déclinées ou machine convergente", series: "3×max", notes: "Congestion maximale" },
          { id: 5, name: "Développé couché prise serrée", series: "3×8-10", notes: "Base de force triceps" },
          { id: 6, name: "Extension à la poulie corde", series: "3×12-15", notes: "Monte lentement, descends en contractant" },
          { id: 7, name: "Extension unilatérale à la poulie", series: "3×12-15 par bras", notes: "Bras collé, coude fixe" },
          { id: 8, name: "Curl incliné haltères", series: "4×10-12", notes: "Étirement maximal en bas" },
          { id: 9, name: "Curl marteau", series: "3×10-12", notes: "Cible le brachial" },
          { id: 10, name: "Curl poulie basse unilatéral", series: "3×12-15", notes: "Tension continue" }
        ]
      },
      semaineB: {
        name: "PECS / TRICEPS / BICEPS - VARIANTE",
        exercices: [
          { id: 1, name: "Développé incliné haltères", series: "4×8-10", notes: "Angle 30-40°, amplitude complète" },
          { id: 2, name: "Développé haltères plat", series: "3×8-10", notes: "Focus milieu poitrine" },
          { id: 3, name: "Écarté à la poulie vis-à-vis", series: "3×12-15", notes: "Tension constante" },
          { id: 4, name: "Pompes lestées ou classiques", series: "3×max", notes: "Congestion parfaite" },
          { id: 5, name: "Extension poulie prise pronation", series: "3×10-12", notes: "Focus vaste latéral" },
          { id: 6, name: "Extension poulie prise supination", series: "3×10-12", notes: "Accent longue portion" },
          { id: 7, name: "Extension unilatérale poulie", series: "3×12-15 par bras", notes: "Isolation maximale" },
          { id: 8, name: "Curl incliné haltères", series: "4×10-12", notes: "Étirement profond" },
          { id: 9, name: "Curl marteau", series: "3×10-12", notes: "Épaissit le bras" },
          { id: 10, name: "Curl poulie basse unilatéral", series: "3×12-15", notes: "Mouvement fluide" }
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
      { id: 1, name: "Pompes sur poignées avec gilet", series: "4×10-12", materiel: "poignées + gilet" },
      { id: 2, name: "Pompes pseudo-planche inclinées", series: "3×10", materiel: "support", notes: "haut pecs / delto avant" },
      { id: 3, name: "Développé militaire unilatéral assis", series: "3×10 par bras", materiel: "haltère" },
      { id: 4, name: "Élévations frontales", series: "12-15 par bras", materiel: "haltère", type: "superset_epaules" },
      { id: 5, name: "Oiseaux penché", series: "12-15", materiel: "haltère", type: "superset_epaules" },
      { id: 6, name: "Face pull élastique", series: "15", materiel: "élastique", type: "superset_epaules" },
      { id: 7, name: "Extensions triceps allongé", series: "10-12 par bras", materiel: "haltère", type: "bloc_triceps" },
      { id: 8, name: "Kickbacks triceps", series: "10-12 par bras", materiel: "haltère", type: "bloc_triceps" },
      { id: 9, name: "Pompes diamant lentes", series: "10-12", materiel: "poids du corps", type: "bloc_triceps" },
      { id: 10, name: "Pompes tempo sur poignées", series: "3×12", materiel: "poignées", type: "finisher" }
    ],
    duree: "60-70 min",
    salleVariants: {
      semaineA: {
        name: "JAMBES - SPÉCIALE DÉBUTANT / REPRISE",
        exercices: [
          { id: 1, name: "Squat", series: "4×8-10", notes: "Barre ou haltères, pieds largeur épaules" },
          { id: 2, name: "Presse à cuisses", series: "3×10-12", notes: "Pousse avec les talons" },
          { id: 3, name: "Fentes marchées", series: "3×10 par jambe", notes: "Grande amplitude, buste droit" },
          { id: 4, name: "Leg extension", series: "3×12-15", notes: "Monte vite, descends lentement" },
          { id: 5, name: "Leg curl allongé", series: "3×10-12", notes: "Contracte fort en haut" },
          { id: 6, name: "Hip thrust", series: "3×10-12", notes: "Dos sur banc, contraction max" },
          { id: 7, name: "Soulevé de terre jambes semi-tendues", series: "3×10-12", notes: "Légère flexion genoux" },
          { id: 8, name: "Mollets debout", series: "4×15-20", notes: "Contraction 1 sec en haut" },
          { id: 9, name: "Mollets assis", series: "3×15-20", notes: "Cible le soléaire" },
          { id: 10, name: "Gainage", series: "3×30-45 sec", notes: "Stabilité du tronc" }
        ]
      },
      semaineB: {
        name: "JAMBES - VARIANTE",
        exercices: [
          { id: 1, name: "Front squat", series: "4×8-10", notes: "Plus de charge sur quadriceps" },
          { id: 2, name: "Hack squat", series: "3×10-12", notes: "Excellent pour quadriceps" },
          { id: 3, name: "Fentes bulgares", series: "3×10 par jambe", notes: "Pied arrière sur banc" },
          { id: 4, name: "Sissy squat", series: "3×12-15", notes: "Finition quadriceps" },
          { id: 5, name: "Soulevé de terre jambes tendues", series: "3×10-12", notes: "Accent ischios et fessiers" },
          { id: 6, name: "Good morning", series: "3×12-15", notes: "Mouvement de charnière hanche" },
          { id: 7, name: "Glute bridge", series: "3×12-15", notes: "Variante hip thrust" },
          { id: 8, name: "Mollets à la presse", series: "4×15-20", notes: "Descente lente" },
          { id: 9, name: "Mollets unilatéraux debout", series: "3×15 par jambe", notes: "Corriger déséquilibres" },
          { id: 10, name: "Gainage dynamique", series: "3×30-45 sec", notes: "Alternance planche avant/côté" }
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