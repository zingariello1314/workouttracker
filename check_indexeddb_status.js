// Script de vérification du statut IndexedDB
console.log('🔍 VÉRIFICATION DU STATUT INDEXEDDB');

const checkIndexedDBStatus = async () => {
  console.log('\n📊 Vérification des bases de données...');
  
  // Vérifier WorkoutTrackerDB
  try {
    const request1 = indexedDB.open('WorkoutTrackerDB');
    await new Promise((resolve) => {
      request1.onsuccess = () => {
        const db = request1.target.result;
        console.log(`✅ WorkoutTrackerDB: v${db.version} - Stores: ${Array.from(db.objectStoreNames)}`);
        db.close();
        resolve();
      };
      request1.onerror = () => {
        console.log('❌ WorkoutTrackerDB: Base supprimée ou inaccessible');
        resolve();
      };
    });
  } catch (error) {
    console.log('❌ WorkoutTrackerDB: Erreur -', error.message);
  }
  
  // Vérifier HomepageImagesDB
  try {
    const request2 = indexedDB.open('HomepageImagesDB');
    await new Promise((resolve) => {
      request2.onsuccess = () => {
        const db = request2.target.result;
        console.log(`✅ HomepageImagesDB: v${db.version} - Stores: ${Array.from(db.objectStoreNames)}`);
        db.close();
        resolve();
      };
      request2.onerror = () => {
        console.log('❌ HomepageImagesDB: Base supprimée ou inaccessible');
        resolve();
      };
    });
  } catch (error) {
    console.log('❌ HomepageImagesDB: Erreur -', error.message);
  }
  
  console.log('\n🎯 Si les bases sont supprimées, rechargez la page maintenant !');
};

checkIndexedDBStatus();
