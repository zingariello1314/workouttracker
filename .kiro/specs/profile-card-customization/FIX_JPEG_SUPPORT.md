# Fix: Support Complet des Images JPEG

## Problème Identifié

Le système de carte de profil n'accepte pas correctement les images JPEG, ce qui cause la majorité des problèmes d'affichage d'images.

### Symptômes
- Les images JPEG ne s'affichent pas après upload
- Seules les images PNG semblent fonctionner
- Le `accept="image/*"` est trop générique et ne valide pas explicitement JPEG

### Cause Racine
1. **Validation insuffisante** : Le code vérifie seulement `file.type.startsWith('image/')` sans valider les formats spécifiques
2. **Attribut accept trop large** : `accept="image/*"` au lieu de spécifier explicitement les formats supportés
3. **Pas de conversion/normalisation** : Les images JPEG ne sont pas converties en format compatible si nécessaire

## Solution Proposée

### 1. Mise à jour de l'attribut `accept`

**Fichier**: `src/components/sidebar/ProfileCardSettings.jsx`

Remplacer :
```javascript
accept="image/*"
```

Par :
```javascript
accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
```

### 2. Validation explicite des formats

**Fichier**: `src/components/sidebar/ProfileCardSettings.jsx`

Dans `handleAvatarAdd` et `handleCardIconAdd`, ajouter :

```javascript
const handleAvatarAdd = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validation explicite des formats supportés
  const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validFormats.includes(file.type.toLowerCase())) {
    setMessage('❌ Format non supporté. Utilisez: JPEG, PNG, GIF ou WebP');
    return;
  }

  // Vérifier la taille (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    setMessage('❌ L\'image est trop grande (max 5MB)');
    return;
  }

  // ... reste du code
};
```

### 3. Conversion/Optimisation des images

**Fichier**: `src/services/profileCard/profileCardStorage.js`

Ajouter une fonction pour optimiser et normaliser les images :

```javascript
/**
 * Optimise et normalise une image avant stockage
 * @param {File} file - Fichier image
 * @param {number} maxWidth - Largeur maximale (défaut: 800px)
 * @param {number} maxHeight - Hauteur maximale (défaut: 800px)
 * @param {number} quality - Qualité JPEG (0-1, défaut: 0.9)
 * @returns {Promise<string>} Data URL optimisée
 */
export const optimizeImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.9) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculer les nouvelles dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        // Créer un canvas pour redimensionner
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir en Data URL (toujours en JPEG pour optimiser la taille)
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      
      img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};
```

### 4. Utiliser l'optimisation dans le hook

**Fichier**: `src/hooks/useProfileCard.js`

Remplacer `fileToDataUrl` par `optimizeImage` :

```javascript
import {
  // ... autres imports
  optimizeImage  // Au lieu de fileToDataUrl
} from '../services/profileCard/profileCardStorage';

const addNewAvatar = useCallback(async (file) => {
  try {
    // Optimiser l'image avant stockage
    const dataUrl = await optimizeImage(file, 400, 400, 0.85);
    const index = await addAvatar(username, dataUrl);
    
    await loadProfileData();
    return { success: true, index };
  } catch (error) {
    console.error('[useProfileCard] Erreur lors de l\'ajout de l\'avatar:', error);
    return { success: false, error };
  }
}, [username, loadProfileData]);
```

## Bénéfices

1. ✅ **Support JPEG garanti** : Validation et conversion explicites
2. ✅ **Optimisation automatique** : Réduction de la taille des images
3. ✅ **Meilleure performance** : Images redimensionnées avant stockage
4. ✅ **Compatibilité maximale** : Conversion en JPEG pour tous les formats
5. ✅ **Messages d'erreur clairs** : L'utilisateur sait exactement quel format utiliser

## Tests à Effectuer

1. Upload d'une image JPEG → Doit fonctionner
2. Upload d'une image JPG → Doit fonctionner
3. Upload d'une image PNG → Doit fonctionner et être convertie
4. Upload d'une image GIF → Doit fonctionner et être convertie
5. Upload d'une image WebP → Doit fonctionner et être convertie
6. Upload d'un fichier non-image → Doit afficher une erreur claire
7. Upload d'une image > 5MB → Doit afficher une erreur de taille

## Priorité

🔴 **CRITIQUE** - Ce fix résout probablement la majorité des problèmes d'affichage d'images.
