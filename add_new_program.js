/**
 * Script pour ajouter un nouveau programme d'entraînement
 * à la session de l'utilisateur zingariello131
 */

// Structure du nouveau programme
const newProgram = {
  id: `program-${Date.now()}`,
  name: "Programme Musculation - Haut Pectoraux & Épaules",
  description: "Programme d'entraînement axé sur le développement du haut des pectoraux, des épaules et des bras",
  duration: 4, // 4 semaines
  goal: "Développement musculaire ciblé - Haut de pecs, épaules, dos, jambes",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: 'inactive', // Ne pas activer automatiquement
  schedule: {
    lundi: {
      name: "HAUT DES PECS + ÉPAULES (PRIORITÉ)",
      focus: "Haut de pecs + deltoïde latéral",
      duration: "60-75 min",
      notes: "",
      etirements: {
        matin: {
          name: "Étirements matinaux",
          duration: "5-7 min",
          instructions: ""
        },
        midi: {
          name: "Pause active",
          duration: "4-6 min",
          instructions: ""
        },
        soir: {
          name: "Récupération",
          duration: "5-7 min",
          instructions: ""
        }
      },
      exercises: [
        {
          id: "pompes_declinees",
          name: "Pompes déclinées sur poignées",
          series: "4×8–15",
          reps: "",
          rest: 90,
          intensity: "heavy",
          notes: "tempo 4–1–1",
          materiel: "poignées",
          type: "standard"
        },
        {
          id: "developpe_sol_unilateral",
          name: "Développé au sol unilatéral (angle claviculaire)",
          series: "4×10–12",
          reps: "",
          rest: 90,
          intensity: "heavy",
          notes: "/ bras",
          materiel: "haltères",
          type: "standard"
        },
        {
          id: "ecartes_elastique",
          name: "Écartés élastique bas → haut",
          series: "4×15–25",
          reps: "",
          rest: 60,
          intensity: "moderate",
          notes: "pause 2s en haut",
          materiel: "élastique",
          type: "standard"
        },
        {
          id: "elevations_laterales_haltères",
          name: "Élévations latérales haltère strictes",
          series: "5×12–15",
          reps: "",
          rest: 45,
          intensity: "moderate",
          notes: "repos 45s",
          materiel: "haltères",
          type: "standard"
        },
        {
          id: "elevations_laterales_elastique",
          name: "Élévations latérales élastique (tension continue)",
          series: "3×20–25",
          reps: "",
          rest: 45,
          intensity: "moderate",
          notes: "",
          materiel: "élastique",
          type: "standard"
        },
        {
          id: "circuit_abdos_lundi",
          name: "Circuit abdos",
          series: "2 TOURS",
          reps: "",
          rest: 30,
          intensity: "moderate",
          notes: "",
          materiel: "poids du corps",
          type: "circuit"
        },
        {
          id: "finisher_pompes_lundi",
          name: "Finisher - 100 pompes",
          series: "5×20 ou 10×10",
          reps: "",
          rest: 60,
          intensity: "moderate",
          notes: "pas de corde ce jour-là",
          materiel: "poids du corps",
          type: "finisher"
        }
      ]
    },
    mardi: {
      name: "DOS LARGEUR + BICEPS",
      focus: "V-taper + bras pleins",
      duration: "60-75 min",
      notes: "",
      etirements: {
        matin: {
          name: "Étirements matinaux",
          duration: "5-7 min",
          instructions: ""
        },
        midi: {
          name: "Pause active",
          duration: "4-6 min",
          instructions: ""
        },
        soir: {
          name: "Récupération",
          duration: "5-7 min",
          instructions: ""
        }
      },
      exercises: [
        {
          id: "tirage_elastique_bras_tendus",
          name: "Tirage élastique bras tendus",
          series: "4×15–20",
          reps: "",
          rest: 60,
          intensity: "moderate",
          notes: "",
          materiel: "élastique",
          type: "standard"
        },
        {
          id: "tractions_australiennes",
          name: "Tractions australiennes (barres parallèles)",
          series: "4×8–12",
          reps: "",
          rest: 90,
          intensity: "heavy",
          notes: "",
          materiel: "barres parallèles",
          type: "standard"
        },
        {
          id: "rowing_elastique_lourd",
          name: "Rowing élastique lourd",
          series: "5×10–15",
          reps: "",
          rest: 90,
          intensity: "heavy",
          notes: "pause 2s",
          materiel: "élastique",
          type: "standard"
        },
        {
          id: "curl_incline_sol",
          name: "Curl incliné au sol (lent)",
          series: "4×10–12",
          reps: "",
          rest: 60,
          intensity: "moderate",
          notes: "",
          materiel: "haltères",
          type: "standard"
        },
        {
          id: "curl_marteau_elastique",
          name: "Curl marteau élastique",
          series: "3×12–15",
          reps: "",
          rest: 60,
          intensity: "moderate",
          notes: "",
          materiel: "élastique",
          type: "standard"
        },
        {
          id: "circuit_abdos_mardi",
          name: "Circuit abdos",
          series: "1 TOUR",
          reps: "",
          rest: 30,
          intensity: "moderate",
          notes: "",
          materiel: "poids du corps",
          type: "circuit"
        },
        {
          id: "cardio_corde_mardi",
          name: "Corde à sauter",
          series: "8–10 min",
          reps: "",
          rest: 0,
          intensity: "moderate",
          notes: "rythme modéré - pas de pompes ce jour-là",
          materiel: "corde à sauter",
          type: "cardio"
        }
      ]
    },
    mercredi: {
      name: "JAMBES + ABDOS",
      focus: "Hormones + équilibre + gainage",
      duration: "60-75 min",
      notes: "",
      etirements: {
        matin: {
          name: "Étirements matinaux",
          duration: "5-7 min",
          instructions: ""
        },
        midi: {
          name: "Pause active",
          duration: "4-6 min",
          instructions: ""
        },
        soir: {
          name: "Récupération",
          duration: "5-7 min",
          instructions: ""
        }
      },
      exercises: [
        {
          id: "squat_gobelet_lourd",
          name: "Squat gobelet lourd",
          series: "4×10–15",
          reps: "",
          rest: 90,
          intensity: "heavy",
          notes: "",
          materiel: "haltère",
          type: "standard"
        },
        {
          id: "fentes_arriere_longues",
          name: "Fentes arrière longues",
          series: "4×10–12",
          reps: "",
          rest: 90,
          intensity: "moderate",
          notes: "/ jambe",
          materiel: "poids du corps",
          type: "standard"
        },
        {
          id: "pont_fessier_charge",
          name: "Pont fessier au sol chargé",
          series: "4×15–20",
          reps: "",
          rest: 60,
          intensity: "moderate",
          notes: "pause 2s",
          materiel: "haltère",
          type: "standard"
        },
        {
          id: "mollets_debout_haltère",
          name: "Mollets debout haltère",
          series: "5×15–25",
          reps: "",
          rest: 45,
          intensity: "moderate",
          notes: "",
          materiel: "haltère",
          type: "standard"
        },
        {
          id: "circuit_abdos_mercredi",
          name: "Circuit abdos",
          series: "3 TOURS",
          reps: "",
          rest: 30,
          intensity: "moderate",
          notes: "jour principal abdos",
          materiel: "poids du corps",
          type: "circuit"
        },
        {
          id: "cardio_corde_mercredi",
          name: "Corde à sauter",
          series: "8 min",
          reps: "",
          rest: 0,
          intensity: "moderate",
          notes: "",
          materiel: "corde à sauter",
          type: "cardio"
        }
      ]
    },
    jeudi: {
      name: "REPOS TOTAL",
      focus: "Récupération",
      duration: "0 min",
      notes: "Récupération obligatoire",
      etirements: {
        matin: {
          name: "Étirements matinaux",
          duration: "5-7 min",
          instructions: "Marche légère / mobilité si envie"
        },
        midi: {
          name: "Pause active",
          duration: "4-6 min",
          instructions: ""
        },
        soir: {
          name: "Récupération",
          duration: "5-7 min",
          instructions: ""
        }
      },
      exercises: []
    },
    vendredi: {
      name: "ÉPAULES + BRAS (TRICEPS PRIORITÉ)",
      focus: "Largeur d'épaules + bras plus épais",
      duration: "60-75 min",
      notes: "",
      etirements: {
        matin: {
          name: "Étirements matinaux",
          duration: "5-7 min",
          instructions: ""
        },
        midi: {
          name: "Pause active",
          duration: "4-6 min",
          instructions: ""
        },
        soir: {
          name: "Récupération",
          duration: "5-7 min",
          instructions: ""
        }
      },
      exercises: [
        {
          id: "elevations_laterales_mecaniques",
          name: "Élévations latérales mécaniques",
          series: "3 rounds",
          reps: "",
          rest: 60,
          intensity: "moderate",
          notes: "12 strictes → 10 partielles → 20 rapides",
          materiel: "haltères",
          type: "standard"
        },
        {
          id: "oiseau_elastique",
          name: "Oiseau élastique",
          series: "4×15–20",
          reps: "",
          rest: 60,
          intensity: "moderate",
          notes: "",
          materiel: "élastique",
          type: "standard"
        },
        {
          id: "dips_barres_paralleles",
          name: "Dips aux barres parallèles (buste droit)",
          series: "4×8–12",
          reps: "",
          rest: 90,
          intensity: "heavy",
          notes: "",
          materiel: "barres parallèles",
          type: "standard"
        },
        {
          id: "extension_triceps_tete",
          name: "Extension triceps au-dessus de la tête (haltère)",
          series: "4×10–12",
          reps: "",
          rest: 60,
          intensity: "moderate",
          notes: "",
          materiel: "haltère",
          type: "standard"
        },
        {
          id: "curl_concentration",
          name: "Curl concentration",
          series: "3×12",
          reps: "",
          rest: 60,
          intensity: "moderate",
          notes: "/ bras",
          materiel: "haltère",
          type: "standard"
        },
        {
          id: "circuit_abdos_vendredi",
          name: "Circuit abdos",
          series: "1 TOUR",
          reps: "",
          rest: 30,
          intensity: "moderate",
          notes: "",
          materiel: "poids du corps",
          type: "circuit"
        },
        {
          id: "finisher_pompes_vendredi",
          name: "Finisher - 100 pompes",
          series: "100",
          reps: "",
          rest: 60,
          intensity: "moderate",
          notes: "pas de corde",
          materiel: "poids du corps",
          type: "finisher"
        }
      ]
    },
    samedi: {
      name: "DOS ÉPAISSEUR + LOMBAIRES",
      focus: "Dos dense et solide",
      duration: "60-75 min",
      notes: "",
      etirements: {
        matin: {
          name: "Étirements matinaux",
          duration: "5-7 min",
          instructions: ""
        },
        midi: {
          name: "Pause active",
          duration: "4-6 min",
          instructions: ""
        },
        soir: {
          name: "Récupération",
          duration: "5-7 min",
          instructions: ""
        }
      },
      exercises: [
        {
          id: "rowing_elastique_prise_basse",
          name: "Rowing élastique prise basse",
          series: "5×8–12",
          reps: "",
          rest: 90,
          intensity: "heavy",
          notes: "",
          materiel: "élastique",
          type: "standard"
        },
        {
          id: "tirage_elastique_prise_neutre",
          name: "Tirage élastique prise neutre",
          series: "4×12–15",
          reps: "",
          rest: 60,
          intensity: "moderate",
          notes: "pause 2s",
          materiel: "élastique",
          type: "standard"
        },
        {
          id: "face_pull_elastique",
          name: "Face pull élastique",
          series: "4×15–20",
          reps: "",
          rest: 60,
          intensity: "moderate",
          notes: "",
          materiel: "élastique",
          type: "standard"
        },
        {
          id: "extensions_lombaires_sol",
          name: "Extensions lombaires au sol",
          series: "3×15–20",
          reps: "",
          rest: 60,
          intensity: "moderate",
          notes: "",
          materiel: "poids du corps",
          type: "standard"
        },
        {
          id: "gainage_lateral_statique",
          name: "Gainage latéral statique",
          series: "3×40s",
          reps: "",
          rest: 60,
          intensity: "moderate",
          notes: "/ côté",
          materiel: "poids du corps",
          type: "standard"
        },
        {
          id: "cardio_corde_samedi",
          name: "Corde à sauter",
          series: "8–10 min",
          reps: "",
          rest: 0,
          intensity: "moderate",
          notes: "",
          materiel: "corde à sauter",
          type: "cardio"
        }
      ]
    },
    dimanche: {
      name: "PECS COMPLETS + RAPPELS",
      focus: "Volume pecs + rappel épaules / triceps",
      duration: "60-75 min",
      notes: "",
      etirements: {
        matin: {
          name: "Étirements matinaux",
          duration: "5-7 min",
          instructions: ""
        },
        midi: {
          name: "Pause active",
          duration: "4-6 min",
          instructions: ""
        },
        soir: {
          name: "Récupération",
          duration: "5-7 min",
          instructions: ""
        }
      },
      exercises: [
        {
          id: "pompes_lentes_poignees",
          name: "Pompes lentes sur poignées",
          series: "4×max propre",
          reps: "",
          rest: 90,
          intensity: "moderate",
          notes: "",
          materiel: "poignées",
          type: "standard"
        },
        {
          id: "developpe_haltère_sol",
          name: "Développé haltère au sol",
          series: "4×8–12",
          reps: "",
          rest: 90,
          intensity: "heavy",
          notes: "",
          materiel: "haltères",
          type: "standard"
        },
        {
          id: "ecartes_elastique_lents",
          name: "Écartés élastique lents",
          series: "3×20",
          reps: "",
          rest: 60,
          intensity: "moderate",
          notes: "",
          materiel: "élastique",
          type: "standard"
        },
        {
          id: "elevations_laterales_legeres",
          name: "Élévations latérales légères",
          series: "3×25",
          reps: "",
          rest: 45,
          intensity: "light",
          notes: "",
          materiel: "haltères",
          type: "standard"
        },
        {
          id: "extension_triceps_elastique",
          name: "Extension triceps élastique",
          series: "3×15–20",
          reps: "",
          rest: 60,
          intensity: "moderate",
          notes: "",
          materiel: "élastique",
          type: "standard"
        },
        {
          id: "circuit_abdos_dimanche",
          name: "Circuit abdos",
          series: "2 TOURS",
          reps: "",
          rest: 30,
          intensity: "moderate",
          notes: "",
          materiel: "poids du corps",
          type: "circuit"
        },
        {
          id: "cardio_corde_dimanche",
          name: "Corde à sauter",
          series: "8 min",
          reps: "",
          rest: 0,
          intensity: "moderate",
          notes: "pas de 100 pompes (elles sont déjà incluses via l'entraînement)",
          materiel: "corde à sauter",
          type: "cardio"
        }
      ]
    }
  }
};

// Fonction pour ouvrir la base de données
function openContextDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB non supporté'));
      return;
    }

    const request = indexedDB.open('WorkoutTrackerContextDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('contextData')) {
        db.createObjectStore('contextData', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('contextData')) {
        reject(new Error('Structure de base de données invalide'));
        return;
      }
      resolve(db);
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// Fonction pour charger le contexte
async function loadContext() {
  try {
    const db = await openContextDB();
    const transaction = db.transaction(['contextData'], 'readonly');
    const store = transaction.objectStore('contextData');
    
    return new Promise((resolve, reject) => {
      const request = store.get('context');
      
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Retirer l'id et lastSaved pour obtenir les données pures
          const { id, lastSaved, ...contextData } = result;
          resolve(contextData);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ Erreur chargement contexte:', error);
    return null;
  }
}

// Fonction pour sauvegarder le contexte
async function saveContext(contextData) {
  try {
    const db = await openContextDB();
    const transaction = db.transaction(['contextData'], 'readwrite');
    const store = transaction.objectStore('contextData');
    
    const dataToSave = {
      id: 'context',
      ...contextData,
      lastSaved: new Date().toISOString()
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(dataToSave);
      
      request.onsuccess = () => {
        // Sauvegarde de secours en localStorage
        try {
          localStorage.setItem('workoutContext_backup', JSON.stringify(dataToSave));
        } catch (localStorageError) {
          console.warn('⚠️ Impossible de sauvegarder le contexte en localStorage:', localStorageError);
        }
        resolve();
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ Erreur sauvegarde contexte:', error);
    throw error;
  }
}

// Fonction principale
async function addNewProgram() {
  try {
    console.log('📥 Chargement du contexte existant...');
    const context = await loadContext();
    
    if (!context) {
      console.log('⚠️ Aucun contexte trouvé, création d\'un nouveau contexte...');
      const newContext = {
        programs: [newProgram],
        activeProgram: null,
        programHistory: [],
        weekVariant: 'A',
        isGymMode: false
      };
      await saveContext(newContext);
      console.log('✅ Nouveau programme ajouté avec succès !');
      return;
    }
    
    // Vérifier si le programme existe déjà (par nom)
    const existingPrograms = context.programs || [];
    const programExists = existingPrograms.some(p => p.name === newProgram.name);
    
    if (programExists) {
      console.log('⚠️ Un programme avec ce nom existe déjà. Mise à jour du programme existant...');
      const updatedPrograms = existingPrograms.map(p => 
        p.name === newProgram.name ? { ...newProgram, id: p.id } : p
      );
      context.programs = updatedPrograms;
    } else {
      console.log('📝 Ajout du nouveau programme à la liste existante...');
      context.programs = [...existingPrograms, newProgram];
    }
    
    // S'assurer que les autres propriétés existent
    if (!context.activeProgram) {
      context.activeProgram = null;
    }
    if (!context.programHistory) {
      context.programHistory = [];
    }
    if (!context.weekVariant) {
      context.weekVariant = 'A';
    }
    if (context.isGymMode === undefined) {
      context.isGymMode = false;
    }
    
    console.log('💾 Sauvegarde du contexte mis à jour...');
    await saveContext(context);
    
    console.log('✅ Programme ajouté avec succès !');
    console.log(`📊 Total de programmes: ${context.programs.length}`);
    console.log(`📋 Nom du nouveau programme: ${newProgram.name}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du programme:', error);
    throw error;
  }
}

// Exécuter le script
if (typeof window !== 'undefined') {
  // Dans le navigateur
  addNewProgram().catch(console.error);
} else {
  // Dans Node.js (pour test)
  console.log('⚠️ Ce script doit être exécuté dans le navigateur (console du navigateur)');
  console.log('📋 Structure du programme à ajouter:');
  console.log(JSON.stringify(newProgram, null, 2));
}


