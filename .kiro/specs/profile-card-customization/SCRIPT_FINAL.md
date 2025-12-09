# Script Final - Copie-Colle Direct

## ⚠️ IMPORTANT
Tu DOIS exécuter ce script pour que tout fonctionne. Sans ça, les bases de données sont cassées.

## 📋 Instructions

1. **Ouvre la console** (F12)
2. **Copie-colle** le script ci-dessous
3. **Appuie sur Entrée**
4. **Attends** 3 secondes
5. La page va se recharger automatiquement

## 🔧 Script à Copier-Coller

```javascript
(async () => {
  console.log('🧹 Nettoyage des bases de données...');
  
  // Supprimer ProfileCardDB
  await new Promise(r => {
    const req = indexedDB.deleteDatabase('ProfileCardDB');
    req.onsuccess = req.onerror = req.onblocked = () => {
      console.log('✅ ProfileCardDB nettoyée');
      r();
    };
  });
  
  // Supprimer QuietQuestDB
  await new Promise(r => {
    const req = indexedDB.deleteDatabase('QuietQuestDB');
    req.onsuccess = req.onerror = req.onblocked = () => {
      console.log('✅ QuietQuestDB nettoyée');
      r();
    };
  });
  
  console.log('✅ Nettoyage terminé!');
  console.log('🔄 Rechargement dans 3 secondes...');
  
  setTimeout(() => location.reload(), 3000);
})();
```

## ✅ Après le Rechargement

1. **Plus d'erreurs** dans la console
2. **Upload une image** dans les paramètres
3. **L'image apparaît** immédiatement dans la carte
4. **Rafraîchis** (F5) → l'image persiste

## 🚨 Si Ça Ne Marche Toujours Pas

Si après avoir exécuté le script et rechargé la page, les images ne s'affichent toujours pas:

1. Ouvre DevTools (F12) > Application > IndexedDB
2. Vérifie que tu vois:
   - `ProfileCardDB` (version 1)
   - `QuietQuestDB` (version 2)
3. Partage une capture d'écran de la console

## 💡 Pourquoi Ce Script Est Nécessaire

Les bases de données sont dans un état incohérent:
- QuietQuestDB existe en version 1 sans le store `sidebarPreferences`
- ProfileCardDB peut avoir des données corrompues

Ce script nettoie tout et laisse le code recréer les bases proprement.
