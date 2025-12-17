/**
 * Script simple pour vérifier la structure des données de lecture
 * À exécuter dans la console du navigateur (F12)
 */

console.log('=== VÉRIFICATION STRUCTURE DONNÉES DE LECTURE ===');

function checkReadingDataStructure() {
  const request = indexedDB.open('QuietQuestDB', 1);
  
  request.onsuccess = function(event) {
    const db = event.target.result;
    console.log('📋 Object stores disponibles:', Array.from(db.objectStoreNames));
    
    const transaction = db.transaction(['books'], 'readonly');
    const store = transaction.objectStore('books');
    const getAllRequest = store.getAll();
    
    getAllRequest.onsuccess = function() {
      const books = getAllRequest.result;
      console.log(`\n📚 LIVRES TROUVÉS: ${books.length}`);
      
      if (books.length === 0) {
        console.log('❌ Aucun livre dans la base de données');
        console.log('💡 Ajoutez des livres via l\'onglet Bibliothèque');
        return;
      }
      
      let totalSessions = 0;
      let booksWithSessions = 0;
      
      books.forEach((book, i) => {
        console.log(`\n📖 Livre ${i + 1}:`);
        console.log(`   Titre: "${book.title}"`);
        console.log(`   Auteur: ${book.author || 'Non spécifié'}`);
        console.log(`   ID: ${book.id || 'MANQUANT ❌'}`);
        console.log(`   Statut: ${book.status || 'Non spécifié'}`);
        
        const sessions = book.readingSessions;
        if (sessions && Array.isArray(sessions)) {
          console.log(`   Sessions: ${sessions.length}`);
          totalSessions += sessions.length;
          
          if (sessions.length > 0) {
            booksWithSessions++;
            
            sessions.forEach((session, j) => {
              console.log(`     📝 Session ${j + 1}:`);
              console.log(`        ID: ${session.id || 'MANQUANT ❌'}`);
              console.log(`        Date: ${session.date || 'MANQUANT ❌'}`);
              console.log(`        Pages: ${session.pagesRead} (type: ${typeof session.pagesRead})`);
              console.log(`        Durée: ${session.durationMinutes} min (type: ${typeof session.durationMinutes})`);
              console.log(`        Note: ${session.note || 'Aucune'}`);
              
              // Vérifier la validité
              const hasValidDate = session.date && session.date.match(/^\d{4}-\d{2}-\d{2}$/);
              const hasValidData = (session.pagesRead > 0) || (session.durationMinutes > 0);
              
              if (hasValidDate && hasValidData) {
                console.log(`        ✅ Session valide`);
              } else {
                console.log(`        ❌ Session invalide:`);
                if (!hasValidDate) console.log(`           - Date invalide: ${session.date}`);
                if (!hasValidData) console.log(`           - Aucune donnée quantifiable`);
              }
            });
          }
        } else {
          console.log(`   Sessions: STRUCTURE INVALIDE ❌`);
          console.log(`   Type: ${typeof sessions}, Valeur:`, sessions);
        }
      });
      
      console.log(`\n📊 RÉSUMÉ:`);
      console.log(`   Total livres: ${books.length}`);
      console.log(`   Livres avec sessions: ${booksWithSessions}`);
      console.log(`   Total sessions: ${totalSessions}`);
      
      if (totalSessions === 0) {
        console.log('\n❌ PROBLÈME: Aucune session de lecture');
        console.log('💡 SOLUTIONS:');
        console.log('   1. Ajoutez des sessions via l\'interface');
        console.log('   2. Ou exécutez: fixStatisticsSync() pour créer des données de test');
      } else {
        console.log('\n✅ Sessions trouvées !');
        console.log('💡 Si les statistiques ne s\'affichent pas, exécutez: fixStatisticsSync()');
      }
    };
  };
  
  request.onerror = function() {
    console.error('❌ Erreur lors de l\'ouverture de la base de données');
  };
}

// Exécuter la vérification
checkReadingDataStructure();

// Rendre la fonction disponible globalement
window.checkReadingDataStructure = checkReadingDataStructure;