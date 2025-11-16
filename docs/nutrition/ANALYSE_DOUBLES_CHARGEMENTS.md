# 🔍 ANALYSE : Doubles Chargements dans les Logs

**Date** : 2025-01-16  
**Problème** : Logs qui se répètent 2-3 fois au chargement (IndexedDB ouvert plusieurs fois, images chargées plusieurs fois)

---

## 📋 OBSERVATIONS DES LOGS

### Logs qui se répètent :

1. **`useHomepageImages.js:698 🔍 Chargement avec récupération automatique...`** - Apparaît **2 fois**
2. **`useHomepageImages.js:120 ✅ IndexedDB ouvert: HomepageImagesDB v3`** - Apparaît **3-4 fois**
3. **`useHomepageImages.js:507 ✅ 40 images chargées depuis IndexedDB (avec index)`** - Apparaît **2 fois**
4. **`logger.js:35 [DEBUG] [garminRetryUtils] [retryWithBackoff] Attempt 1/4`** - Apparaît **2 fois**
5. **`useWorkoutData.js:489 🧹 Nettoyage automatique du localStorage effectué`** - Apparaît **2 fois**

---

## 🔴 CAUSE RACINE IDENTIFIÉE

### 1. **React.StrictMode** (ligne 172 de `main.jsx`)

```javascript
// src/main.jsx
<React.StrictMode>
  <App />
</React.StrictMode>
```

**Comportement** : En mode développement, React.StrictMode monte les composants **deux fois** pour détecter les effets de bord.

**Impact** :
- Les hooks sont appelés deux fois rapidement
- Les `useEffect` sont exécutés deux fois (d'où les doubles logs)

---

### 2. **IndexedDB ouvert plusieurs fois** (`useHomepageImages.js`)

**Problème** : `openDB()` est appelé à chaque fois que `loadImagesFromIndexedDB()` est exécuté, même si IndexedDB est déjà ouvert.

```javascript
// src/hooks/useHomepageImages.js (ligne 55-162)
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('HomepageImagesDB', 3);
    // ❌ PROBLÈME : Nouvelle ouverture à chaque appel
    // ❌ PROBLÈME : Pas de cache de connexion
  });
};
```

**Impact** :
- Plusieurs connexions IndexedDB ouvertes simultanément
- Logs `✅ IndexedDB ouvert` multiples
- Performance dégradée (ouverture DB coûteuse)

---

### 3. **Protection `initializedRef` incomplète**

**Localisation** : `src/hooks/useHomepageImages.js` (lignes 1098-1123)

```javascript
const initializedRef = useRef(false);

useEffect(() => {
  if (initializedRef.current) {
    return; // ✅ Protection contre double appel
  }
  initializedRef.current = true;
  
  await loadImagesWithRecovery(); // ❌ Peut être appelé plusieurs fois si montage/démontage rapide
}, []);
```

**Problème** :
- `initializedRef` protège le `useEffect`, mais pas `openDB()` directement
- Si le composant se monte/démonte rapidement (React.StrictMode), plusieurs appels peuvent se chevaucher

---

## ✅ SOLUTIONS PROPOSÉES

### Solution 1 : Singleton IndexedDB (comme `useNutritionData`)

**Pattern** : Créer un singleton global pour IndexedDB, similaire à `useNutritionData.js`

```javascript
// src/hooks/useHomepageImages.js

// Singleton global pour IndexedDB
let globalDBInstance = null;
let dbOpeningPromise = null;

const ensureDBReady = async () => {
  // Si DB déjà ouverte, retourner l'instance
  if (globalDBInstance) {
    return globalDBInstance;
  }
  
  // Si ouverture en cours, retourner la promesse existante
  if (dbOpeningPromise) {
    return dbOpeningPromise;
  }
  
  // Créer nouvelle promesse d'ouverture
  dbOpeningPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('HomepageImagesDB', 3);
    
    request.onsuccess = (event) => {
      globalDBInstance = event.target.result;
      dbOpeningPromise = null; // Réinitialiser
      resolve(globalDBInstance);
    };
    
    request.onerror = (event) => {
      dbOpeningPromise = null; // Réinitialiser en cas d'erreur
      reject(event.target.error);
    };
    
    // ... onupgradeneeded, etc.
  });
  
  return dbOpeningPromise;
};
```

**Avantages** :
- ✅ Une seule connexion IndexedDB partagée
- ✅ Évite ouvertures multiples
- ✅ Pattern déjà utilisé dans `useNutritionData.js`

---

### Solution 2 : Cache connexion dans ref

**Pattern** : Mettre en cache la connexion DB dans une ref

```javascript
const dbInstanceRef = useRef(null);
const openingPromiseRef = useRef(null);

const openDB = async () => {
  // Si DB déjà ouverte, retourner l'instance
  if (dbInstanceRef.current) {
    return dbInstanceRef.current;
  }
  
  // Si ouverture en cours, retourner la promesse existante
  if (openingPromiseRef.current) {
    return openingPromiseRef.current;
  }
  
  // Créer nouvelle promesse d'ouverture
  openingPromiseRef.current = new Promise((resolve, reject) => {
    const request = indexedDB.open('HomepageImagesDB', 3);
    
    request.onsuccess = (event) => {
      dbInstanceRef.current = event.target.result;
      openingPromiseRef.current = null;
      resolve(dbInstanceRef.current);
    };
    
    request.onerror = (event) => {
      openingPromiseRef.current = null;
      reject(event.target.error);
    };
  });
  
  return openingPromiseRef.current;
};
```

**Avantages** :
- ✅ Plus simple que singleton global
- ✅ Cache par instance de hook
- ✅ Fonctionne avec React.StrictMode

---

### Solution 3 : Debounce chargement images

**Pattern** : Débouncer `loadImagesWithRecovery()` pour éviter appels multiples

```javascript
const loadingRef = useRef(false);

const loadImagesWithRecovery = async () => {
  // ✅ Protection contre chargement multiple
  if (loadingRef.current) {
    return;
  }
  
  loadingRef.current = true;
  
  try {
    console.log('🔍 Chargement avec récupération automatique...');
    // ... chargement ...
  } finally {
    loadingRef.current = false;
  }
};
```

**Avantages** :
- ✅ Simple à implémenter
- ✅ Évite chargements multiples
- ✅ Complémentaire avec Solution 1 ou 2

---

## 🎯 RECOMMANDATION

**Solution recommandée** : **Solution 1 (Singleton IndexedDB) + Solution 3 (Debounce)**

**Raison** :
1. **Cohérence** : Pattern déjà utilisé dans `useNutritionData.js`
2. **Performance** : Une seule connexion DB partagée
3. **Robustesse** : Protection contre React.StrictMode + montage/démontage rapide
4. **Maintenabilité** : Code plus simple et réutilisable

---

**Date de création** : 2025-01-16  
**Dernière mise à jour** : 2025-01-16  
**Statut** : ✅ Analyse complète - Solutions proposées

