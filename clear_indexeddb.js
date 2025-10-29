// Script à exécuter dans la console du navigateur (F12)
console.log('🔧 NETTOYAGE INDEXEDDB - Exécutez ceci dans la console du navigateur');

// Fonction pour nettoyer IndexedDB
const clearIndexedDB = async () => {
  console.log('🗑️ Suppression des bases de données...');
  
  // Supprimer WorkoutTrackerDB
  await new Promise((resolve) => {
    const deleteRequest = indexedDB.deleteDatabase('WorkoutTrackerDB');
    deleteRequest.onsuccess = () => {
      console.log('✅ WorkoutTrackerDB supprimée');
      resolve();
    };
    deleteRequest.onerror = () => {
      console.log('⚠️ Erreur suppression WorkoutTrackerDB');
      resolve();
    };
  });
  
  // Supprimer HomepageImagesDB
  await new Promise((resolve) => {
    const deleteRequest = indexedDB.deleteDatabase('HomepageImagesDB');
    deleteRequest.onsuccess = () => {
      console.log('✅ HomepageImagesDB supprimée');
      resolve();
    };
    deleteRequest.onerror = () => {
      console.log('⚠️ Erreur suppression HomepageImagesDB');
      resolve();
    };
  });
  
  console.log('🎉 Nettoyage terminé ! Rechargez la page maintenant.');
};

// Exécuter le nettoyage
clearIndexedDB();
