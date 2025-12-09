# Fix Complet: Nettoyage IndexedDB et Résolution des Erreurs

## Problèmes Identifiés

1. **Sidebar Error**: `NotFoundError: One of the specified object stores was not found`
   - Le store `sidebarPreferences` n'existe pas dans `QuietQuestDB`
   - La version 2 a été définie mais le store n'a jamais été créé

2. **ProfileCard Images**: Les images uploadées ne s'affichent pas et ne persistent pas
   - Conflit potentiel avec l'ancienne base `ProfileCardDB`

## Solution Complète

### Script de Nettoyage Total (À EXÉCUTER UNE SEULE FOIS)

Ouvre la console du navigateur (F12) et exécute ce script:

```javascript
// Script de nettoyage complet IndexedDB
const cleanupAllDatabases = async () => {
  console.log('🧹 Début du nettoyage complet...');
  
  try {
    // 1. Lister toutes les bases de données
    const dbs = await indexedDB.databases();
    console.log('📊 Bases de données trouvées:', dbs.map(db => db.name));
    
    // 2. Supprimer ProfileCardDB (ancienne base)
    await new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase('ProfileCardDB');
      req.onsuccess = () => {
        console.log('✅ ProfileCardDB supprimée');
        resolve();
      };
      req.onerror = () => {
        console.warn('⚠️ ProfileCardDB n\'existe pas ou erreur');
        resolve(); // Continue quand même
      };
      req.onblocked = () => {
        console.warn('⚠️ Suppression bloquée - ferme tous les onglets');
        reject(new Error('Blocked'));
      };
    });
    
    // 3. Supprimer QuietQuestDB (pour recréer proprement)
    await new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase('QuietQuestDB');
      req.onsuccess = () => {
        console.log('✅ QuietQuestDB supprimée');
        resolve();
      };
      req.onerror = () => {
        console.warn('⚠️ QuietQuestDB n\'existe pas ou erreur');
        resolve(); // Continue quand même
      };
      req.onblocked = () => {
        console.warn('⚠️ Suppression bloquée - ferme tous les onglets');
        reject(new Error('Blocked'));
      };
    });
    
    console.log('✅ Nettoyage terminé!');
    console.log('🔄 Recharge la page dans 2 secondes...');
    
    setTimeout(() => {
      location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    console.log('⚠️ Si bloqué, ferme tous les onglets de l\'application et réessaye');
  }
};

// Exécuter le nettoyage
cleanupAllDatabases();
```

### Après le Rechargement

Les bases de données seront recréées automatiquement avec la bonne structure:

1. **ProfileCardDB** (version 1)
   - Store: `profileCards`
   - Contient: avatars, handle, cardIconUrl, etc.

2. **QuietQuestDB** (version 2)
   - Store: `sidebarPreferences`
   - Contient: états des sections de la sidebar

## Vérification

Après le rechargement, vérifie dans DevTools > Application > IndexedDB:

### ProfileCardDB
- ✅ Version: 1
- ✅ Store: `profileCards`
- ✅ Données: vide au départ

### QuietQuestDB
- ✅ Version: 2
- ✅ Store: `sidebarPreferences`
- ✅ Données: préférences par défaut

## Test de Fonctionnement

1. **Upload d'avatar**:
   - Va dans Paramètres du Profil
   - Upload une image
   - L'image doit apparaître immédiatement dans la carte
   - Rafraîchis la page → l'image doit persister

2. **Upload d'icône centrale**:
   - Va dans Paramètres du Profil
   - Upload une image pour l'icône centrale
   - L'image doit remplacer le logo flamme
   - Rafraîchis la page → l'image doit persister

3. **Sidebar**:
   - Ouvre/ferme des sections
   - Rafraîchis la page
   - Les états doivent être sauvegardés

## Si Ça Ne Fonctionne Toujours Pas

### Option 1: Nettoyage Manuel
1. DevTools (F12) > Application
2. IndexedDB > Clique droit sur chaque base
3. "Delete database"
4. Recharge la page

### Option 2: Vérifier les Erreurs Console
Regarde la console pour:
- `[ProfileCardStorage]` → Erreurs de ProfileCard
- `[SidebarStorage]` → Erreurs de Sidebar
- Partage les erreurs si le problème persiste

## Prévention Future

Ces problèmes ne devraient plus se reproduire car:
- Chaque système utilise sa propre base de données
- Les versions sont correctement gérées
- Les stores sont créés lors de l'upgrade
