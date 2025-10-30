/*
  Script d'audit Top Exercices à exécuter dans la console du navigateur.
  Objectif: recalculer les 8 exercices avec le plus de répétitions
  directement depuis IndexedDB (et Endurance: pompes), sans dépendre du code UI.

  Utilisation:
  1) Ouvrir l'app dans le navigateur (onglet Graphiques ou n'importe où)
  2) Ouvrir DevTools > Console
  3) Coller le contenu de ce fichier et appuyer Entrée
*/

(async () => {
  const openDB = (name, version) => new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });

  const getWorkoutData = async () => {
    try {
      const db = await openDB('WorkoutTrackerDB', 3);
      const tx = db.transaction(['workoutData'], 'readonly');
      const store = tx.objectStore('workoutData');
      const getReq = store.get('main');
      return await new Promise((resolve, reject) => {
        getReq.onsuccess = () => resolve(getReq.result || {});
        getReq.onerror = () => reject(getReq.error);
      });
    } catch (e) {
      console.warn('IndexedDB WorkoutTrackerDB indisponible:', e);
      return {};
    }
  };

  const data = await getWorkoutData();
  const repsMap = data.reps || {};
  const endurance = (data.enduranceData && data.enduranceData.sessions) || {};

  // Agrégations
  const byExercise = new Map(); // nom/id -> total reps

  const addReps = (keyName, reps) => {
    const val = Number(reps);
    if (!Number.isFinite(val) || val <= 0) return;
    byExercise.set(keyName, (byExercise.get(keyName) || 0) + val);
  };

  // 1) Répétitions classiques (data.reps)
  Object.entries(repsMap).forEach(([key, value]) => {
    // clé: YYYY-MM-DD_exerciseId(_variant?)
    const parts = key.split('_');
    if (parts.length < 2) return;
    const exId = parts[1];
    // Exclure activités complémentaires (ids non numériques ou préfixes)
    if (!/^\d+$/.test(exId)) return;
    addReps(`id:${exId}`, value);
  });

  // 2) Endurance: Pompes (pushups)
  (endurance.pushups || []).forEach(s => {
    const reps = s.reps ?? s.count;
    addReps('Pompes', reps);
  });

  // Construction du classement
  const rows = Array.from(byExercise.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // Affichage
  console.table(rows);

  // Totaux de contrôle
  const totalReps = rows.reduce((s, r) => s + r.total, 0);
  console.log('Somme Top8:', totalReps);

  // Détails optionnels: afficher le top complet non tronqué
  // const full = Array.from(byExercise.entries()).map(([name,total])=>({name,total})).sort((a,b)=>b.total-a.total);
  // console.table(full);
})();


