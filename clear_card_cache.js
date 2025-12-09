// Script pour nettoyer le cache de la carte de profil
// Ouvre la console (F12) et colle ce script

console.log('🧹 Nettoyage du cache de la carte de profil...');

// 1. Vider le localStorage
Object.keys(localStorage).forEach(key => {
  if (key.includes('profile') || key.includes('card') || key.includes('icon')) {
    console.log(`Suppression localStorage: ${key}`);
    localStorage.removeItem(key);
  }
});

// 2. Vider le sessionStorage
Object.keys(sessionStorage).forEach(key => {
  if (key.includes('profile') || key.includes('card') || key.includes('icon')) {
    console.log(`Suppression sessionStorage: ${key}`);
    sessionStorage.removeItem(key);
  }
});

// 3. Recharger IndexedDB
indexedDB.databases().then(dbs => {
  console.log('Bases de données IndexedDB:', dbs);
  dbs.forEach(db => {
    if (db.name.includes('Profile') || db.name.includes('Card')) {
      console.log(`Suppression DB: ${db.name}`);
      indexedDB.deleteDatabase(db.name);
    }
  });
});

console.log('✅ Nettoyage terminé! Rafraîchis la page (Ctrl+F5)');
