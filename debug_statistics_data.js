/**
 * Script de diagnostic pour les données de statistiques
 * À exécuter dans la console du navigateur (F12)
 */

console.log('=== DIAGNOSTIC DONNÉES STATISTIQUES ===');

// Fonction pour vérifier les données dans IndexedDB
async function checkBooksData() {
  try {
    console.log('🔍 Vérification des données dans IndexedDB...');
    
    const request = indexedDB.open('QuietQuestDB', 1);
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      const transaction = db.transaction(['books'], 'readonly');
      const store = transaction.objectStore('books');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = function() {
        const books = getAllRequest.result;
        console.log(`📚 Nombre total de livres: ${books.length}`);
        
        if (books.length === 0) {
          console.log('❌ Aucun livre trouvé dans IndexedDB');
          console.log('💡 Solution: Ajoutez des livres via le formulaire dans l\'onglet Bibliothèque');
          return;
        }
        
        let totalSessions = 0;
        let booksWithSessions = 0;
        
        books.forEach((book, i) => {
          const sessions = book.readingSessions || [];
          totalSessions += sessions.length;
          if (sessions.length > 0) booksWithSessions++;
          
          console.log(`\n📖 Livre ${i+1}: "${book.title}"`);
          console.log(`   Auteur: ${book.author || 'Non spécifié'}`);
          console.log(`   Statut: ${book.status || 'Non spécifié'}`);
          console.log(`   Sessions de lecture: ${sessions.length}`);
          
          if (sessions.length > 0) {
            sessions.forEach((session, j) => {
              console.log(`     📝 Session ${j+1}: ${session.date} - ${session.pagesRead || 0} pages - ${session.durationMinutes || 0} min`);
            });
          } else {
            console.log('     ⚠️ Aucune session de lecture enregistrée');
          }
        });
        
        console.log(`\n📊 RÉSUMÉ:`);
        console.log(`   Total livres: ${books.length}`);
        console.log(`   Livres avec sessions: ${booksWithSessions}`);
        console.log(`   Total sessions: ${totalSessions}`);
        
        if (totalSessions === 0) {
          console.log('\n❌ PROBLÈME IDENTIFIÉ: Aucune session de lecture');
          console.log('💡 SOLUTION:');
          console.log('   1. Sélectionnez un livre dans la bibliothèque');
          console.log('   2. Utilisez le formulaire "Ajouter une session de lecture"');
          console.log('   3. Remplissez au moins la date et les pages lues');
          console.log('   4. Les statistiques apparaîtront automatiquement');
        } else {
          console.log('\n✅ Des sessions existent, vérification des données...');
          
          // Vérifier la structure des sessions
          const firstBookWithSessions = books.find(b => b.readingSessions?.length > 0);
          if (firstBookWithSessions) {
            const firstSession = firstBookWithSessions.readingSessions[0];
            console.log('\n🔍 Structure de la première session:');
            console.log(JSON.stringify(firstSession, null, 2));
          }
        }
      };
      
      getAllRequest.onerror = function() {
        console.error('❌ Erreur lors de la lecture des données');
      };
    };
    
    request.onerror = function() {
      console.error('❌ Erreur lors de l\'ouverture de la base de données');
    };
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Fonction pour tester les services de statistiques
function testStatisticsServices() {
  console.log('\n🧪 Test des services de statistiques...');
  
  // Créer des données de test
  const testBooks = [
    {
      id: 'test1',
      title: 'Livre Test',
      author: 'Auteur Test',
      genre: 'Fiction',
      pages: 300,
      status: 'in-progress',
      readingSessions: [
        {
          id: 'session1',
          date: '2024-12-01',
          pagesRead: 50,
          durationMinutes: 60,
          note: 'Session test'
        },
        {
          id: 'session2', 
          date: '2024-12-02',
          pagesRead: 30,
          durationMinutes: 45,
          note: 'Session test 2'
        }
      ]
    }
  ];
  
  console.log('📝 Données de test créées:', testBooks);
  
  // Tester SessionAggregator si disponible
  if (typeof window !== 'undefined' && window.SessionAggregator) {
    try {
      const result = window.SessionAggregator.aggregateSessions(testBooks, '1m', {});
      console.log('✅ SessionAggregator fonctionne:', result);
    } catch (error) {
      console.error('❌ Erreur SessionAggregator:', error);
    }
  } else {
    console.log('⚠️ SessionAggregator non disponible dans window');
  }
}

// Exécuter les diagnostics
console.log('🚀 Démarrage du diagnostic...');
checkBooksData();
testStatisticsServices();

console.log('\n📋 INSTRUCTIONS:');
console.log('1. Copiez ce script complet');
console.log('2. Ouvrez la console du navigateur (F12)');
console.log('3. Collez et exécutez le script');
console.log('4. Analysez les résultats pour identifier le problème');