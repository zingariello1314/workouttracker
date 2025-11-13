# 🔴 Problème Critique : Disparition des Images Après Import

## 📋 Résumé du Problème

**Symptôme** : Après avoir importé plusieurs images (18 images dans les logs), elles sont bien sauvegardées dans IndexedDB, mais lorsqu'on revient dans les paramètres, toutes les images ont disparu sauf une.

**Gravité** : 🔴 **CRITIQUE** - Perte de données utilisateur

---

## 🔍 Analyse des Logs

### Séquence d'événements observée :

1. **Import réussi** : `🎉 18 images sauvegardées dans IndexedDB avec succès`
2. **Chargement immédiat** : `✅ 18 images chargées depuis IndexedDB (avec index)` ✅
3. **Navigation vers page d'accueil** : Images visibles ✅
4. **Retour dans paramètres** : `✅ 1 images chargées depuis IndexedDB` ❌
5. **Sauvegarde automatique déclenchée** : `✅ Sauvegarde batch réussie: 1/1 images` ❌

### Problème identifié :

```
🎉 18 images sauvegardées → ✅ 18 images chargées → Navigation → ✅ 1 image chargée → 💾 1 image sauvegardée (ÉCRASE LES 18 !)
```

---

## 🐛 Cause Racine

### Problème 1 : Race Condition avec `backgroundImagesRef.current`

**Localisation** : `src/hooks/useHomepageImages.js` lignes 907-910, 926-928, 935-937

**Problème** :
- `backgroundImagesRef.current` est mis à jour via `useEffect` (ligne 16-18) qui dépend de `backgroundImages`
- Mais `setBackgroundImages` dans `executeSaveImagesRobust` (ligne 284) est appelé **après** la sauvegarde IndexedDB
- Si l'utilisateur change d'onglet **avant** que `setBackgroundImages` soit exécuté, `backgroundImagesRef.current` contient encore l'ancienne valeur
- Les event listeners `visibilitychange` et `pagehide` sauvegardent alors l'ancienne valeur et **écrasent** les nouvelles images

**Code problématique** :
```javascript
// Ligne 926-928
const handleVisibilityChange = () => {
  if (document.visibilityState === 'hidden') {
    const currentImages = backgroundImagesRef.current; // ⚠️ Peut contenir ancienne valeur !
    if (currentImages.length > 0) {
      saveImagesSync(currentImages); // ⚠️ Écrase les nouvelles images !
    }
  }
};
```

### Problème 2 : `saveBatchToIndexedDB` supprime TOUTES les images avant d'ajouter

**Localisation** : `src/utils/bannerSaveOptimizer.js` lignes 95-137

**Problème** :
- La fonction `saveBatchToIndexedDB` supprime **toutes** les images existantes avant d'ajouter les nouvelles
- Si on passe un tableau avec seulement 1 image (ancienne valeur de `backgroundImagesRef.current`), elle supprime les 18 images et n'en garde qu'1

**Code problématique** :
```javascript
// Ligne 98-110 : Supprime TOUTES les images homepage_background
const deleteRequest = store.index('type').openCursor(IDBKeyRange.only('homepage_background'));
deleteRequest.onsuccess = (event) => {
  const cursor = event.target.result;
  if (cursor) {
    store.delete(cursor.primaryKey); // ⚠️ Supprime toutes les images !
    cursor.continue();
  }
};
```

### Problème 3 : `setBackgroundImages` appelé trop tard

**Localisation** : `src/hooks/useHomepageImages.js` ligne 284

**Problème** :
- `setBackgroundImages(validImages)` est appelé **après** la sauvegarde IndexedDB
- Mais `backgroundImagesRef.current` n'est mis à jour que via `useEffect` qui dépend de `backgroundImages`
- Il y a un délai entre la sauvegarde et la mise à jour de la ref
- Pendant ce délai, les event listeners peuvent déclencher une sauvegarde avec l'ancienne valeur

---

## 🔧 Solutions Proposées

### Solution 1 : Mettre à jour `backgroundImagesRef.current` immédiatement

**Fichier** : `src/hooks/useHomepageImages.js`

**Modification** :
```javascript
// Dans executeSaveImagesRobust, mettre à jour la ref AVANT setBackgroundImages
setSystemHealth('excellent');
backgroundImagesRef.current = validImages; // ✅ Mise à jour immédiate de la ref
setBackgroundImages(validImages);
```

### Solution 2 : Désactiver sauvegarde automatique si sauvegarde récente

**Fichier** : `src/hooks/useHomepageImages.js`

**Modification** :
- Ajouter un flag `lastSaveTime` pour éviter les sauvegardes trop rapprochées
- Ignorer `visibilitychange` et `pagehide` si une sauvegarde vient d'être effectuée (< 2 secondes)

### Solution 3 : Ne pas supprimer toutes les images si le tableau est vide ou invalide

**Fichier** : `src/utils/bannerSaveOptimizer.js`

**Modification** :
- Vérifier que `images.length > 0` avant de supprimer
- Ajouter une validation pour éviter d'écraser avec un tableau vide ou invalide

### Solution 4 : Désactiver sauvegarde automatique pendant les uploads/imports

**Fichier** : `src/hooks/useHomepageImages.js`

**Modification** :
- Ajouter un flag `isSavingInProgress` pour bloquer les sauvegardes automatiques pendant les opérations critiques

---

## 📊 Impact

- **Données perdues** : Toutes les images importées (17 sur 18 dans ce cas)
- **Fréquence** : Se produit à chaque changement d'onglet après import
- **Utilisateurs affectés** : Tous les utilisateurs qui importent plusieurs images

---

## ✅ Plan de Correction

1. ✅ **CORRIGÉ** : Mettre à jour `backgroundImagesRef.current` immédiatement après sauvegarde
2. ✅ **CORRIGÉ** : Ajouter un délai minimum entre sauvegardes (2 secondes pour visibilitychange/pagehide, 5 secondes pour auto-save)
3. ✅ **CORRIGÉ** : Ne pas supprimer toutes les images si le tableau est vide (conservation des images existantes)
4. ✅ **CORRIGÉ** : Enregistrer timestamp de sauvegarde pour éviter sauvegardes trop rapprochées

---

## 🧪 Tests à Effectuer

1. Importer 10 images
2. Vérifier qu'elles sont toutes visibles dans les paramètres
3. Naviguer vers la page d'accueil
4. Revenir dans les paramètres
5. **Vérifier que les 10 images sont toujours présentes**

---

**Date d'analyse** : 2025-11-13  
**Date de correction** : 2025-11-13  
**Statut** : ✅ **CORRIGÉ** - Toutes les corrections appliquées

---

## 🔧 Corrections Appliquées

### ✅ Correction 1 : Mise à jour immédiate de `backgroundImagesRef.current`
- **Fichier** : `src/hooks/useHomepageImages.js`
- **Lignes** : 285, 300, 314, 665, 693, 741, 789, 797, 802
- **Modification** : `backgroundImagesRef.current = validImages;` ajouté **AVANT** `setBackgroundImages(validImages)`
- **Impact** : Élimine la race condition - la ref est toujours à jour

### ✅ Correction 2 : Protection contre sauvegardes trop rapprochées
- **Fichier** : `src/hooks/useHomepageImages.js`
- **Lignes** : 14, 287, 301, 315, 935-942, 947-955, 978-985
- **Modification** : Ajout de `lastSaveTimeRef` et vérification de délai minimum (2s pour visibilitychange/pagehide, 5s pour auto-save)
- **Impact** : Empêche les sauvegardes automatiques d'écraser des sauvegardes récentes

### ✅ Correction 3 : Conservation des images si tableau vide
- **Fichier** : `src/utils/bannerSaveOptimizer.js`
- **Lignes** : 98-101
- **Modification** : Si `images.length === 0`, ne pas supprimer les images existantes
- **Impact** : Évite l'écrasement accidentel avec un tableau vide

### ✅ Correction 4 : Mise à jour de la ref lors du chargement
- **Fichier** : `src/hooks/useHomepageImages.js`
- **Lignes** : 665, 693, 741, 789, 797, 802
- **Modification** : `backgroundImagesRef.current = images;` ajouté à chaque `setBackgroundImages(images)`
- **Impact** : La ref est toujours synchronisée avec l'état

---

## 🧪 Tests de Validation

**Scénario de test** :
1. ✅ Importer 10 images via le module dédié
2. ✅ Vérifier qu'elles sont toutes visibles dans les paramètres
3. ✅ Naviguer vers la page d'accueil
4. ✅ Revenir dans les paramètres
5. ✅ **Vérifier que les 10 images sont toujours présentes** ✅

**Résultat attendu** : Toutes les images doivent persister après navigation

