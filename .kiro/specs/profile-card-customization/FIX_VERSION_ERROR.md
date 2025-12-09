# Fix: IndexedDB Version Error - RÉSOLU ✅

## Problème Initial
```
VersionError: The requested version (1) is less than the existing version (2)
NotFoundError: One of the specified object stores was not found
```

## Cause
Conflit avec d'autres systèmes utilisant `QuietQuestDB` (sidebar, dashboard, etc.)

## Solution Appliquée ✅
**Base de données séparée**: ProfileCard utilise maintenant `ProfileCardDB` au lieu de `QuietQuestDB`

## Nettoyage Requis (Une seule fois)

### Console du navigateur (RECOMMANDÉ)
1. Ouvre la console du navigateur (F12)
2. Colle et exécute ce code:

```javascript
// Supprimer l'ancienne base ProfileCard
indexedDB.deleteDatabase('ProfileCardDB').onsuccess = () => {
  console.log('✅ Ancienne base ProfileCardDB supprimée');
  location.reload();
};
```

3. La page se rechargera automatiquement

### Option 2: DevTools Application
1. Ouvre DevTools (F12)
2. Va dans l'onglet "Application" (ou "Stockage")
3. Dans le menu de gauche, trouve "IndexedDB"
4. Clique droit sur "QuietQuestDB"
5. Sélectionne "Delete database"
6. Recharge la page

### Option 3: Script de nettoyage automatique
Exécute ce script dans la console:

```javascript
const cleanupProfileCardDB = async () => {
  try {
    // Fermer toutes les connexions
    const dbs = await indexedDB.databases();
    console.log('📊 Bases de données trouvées:', dbs);
    
    // Supprimer QuietQuestDB
    await new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase('QuietQuestDB');
      request.onsuccess = () => {
        console.log('✅ QuietQuestDB supprimée avec succès');
        resolve();
      };
      request.onerror = () => {
        console.error('❌ Erreur lors de la suppression');
        reject(request.error);
      };
      request.onblocked = () => {
        console.warn('⚠️ Suppression bloquée - ferme tous les onglets de l\'app');
        reject(new Error('Blocked'));
      };
    });
    
    console.log('🔄 Recharge la page maintenant');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
};

cleanupProfileCardDB();
```

## Vérification
Après avoir rechargé la page, vérifie dans DevTools > Application > IndexedDB > QuietQuestDB:
- La version doit être **2**
- Le store "profileCards" doit exister

## Prévention
Ce problème ne devrait plus se reproduire. La version 2 est maintenant correctement définie dans le code.
