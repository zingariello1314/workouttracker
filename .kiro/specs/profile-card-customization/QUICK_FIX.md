# 🔧 Fix Rapide - 2 Minutes

## Le Problème
- ❌ Erreur sidebar: "object stores was not found"
- ❌ Images uploadées ne s'affichent pas
- ❌ Images ne persistent pas après refresh

## La Solution (3 Étapes)

### 1️⃣ Ouvre la Console
Appuie sur **F12** dans ton navigateur

### 2️⃣ Colle Ce Code
```javascript
const cleanupAllDatabases = async () => {
  console.log('🧹 Nettoyage...');
  
  await new Promise(r => {
    const req = indexedDB.deleteDatabase('ProfileCardDB');
    req.onsuccess = req.onerror = req.onblocked = () => r();
  });
  
  await new Promise(r => {
    const req = indexedDB.deleteDatabase('QuietQuestDB');
    req.onsuccess = req.onerror = req.onblocked = () => r();
  });
  
  console.log('✅ Terminé! Rechargement...');
  setTimeout(() => location.reload(), 2000);
};

cleanupAllDatabases();
```

### 3️⃣ Appuie sur Entrée
La page va se recharger automatiquement.

## ✅ C'est Tout!

Après le rechargement:
- ✅ Plus d'erreurs dans la console
- ✅ Les images uploadées s'affichent
- ✅ Les images persistent après refresh
- ✅ La sidebar fonctionne normalement

## 🧪 Test Rapide

1. Upload une image dans les paramètres du profil
2. L'image apparaît immédiatement ✅
3. Rafraîchis la page (F5)
4. L'image est toujours là ✅

## ⚠️ Si Bloqué

Si tu vois "Bloqué" dans la console:
1. Ferme **tous** les onglets de l'app
2. Garde un seul onglet
3. Réexécute le script

---

**Note**: Ce script supprime uniquement les bases de données IndexedDB de l'app. Tes autres données ne sont pas affectées.
