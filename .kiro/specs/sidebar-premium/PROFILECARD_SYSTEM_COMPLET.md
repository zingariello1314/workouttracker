# Système ProfileCard 3D Complet - Architecture

## 📅 Date
9 décembre 2025

## 🎯 Vue d'ensemble

Système complet de gestion de profil utilisateur avec:
- ✅ Carte 3D holographique
- ✅ Stockage persistant dans IndexedDB
- ✅ Gestion multi-utilisateurs
- ✅ Upload d'avatars personnalisés
- ✅ Modification du handle (@username)
- ✅ Affichage automatique du nom d'utilisateur
- ✅ Titre basé sur le rôle (Admin = "Développeur Premium", autres = "Utilisateur")

## 🏗️ Architecture

### 1. Service de Stockage
**Fichier**: `src/services/profileCard/profileCardStorage.js`

Fonctions principales:
- `saveProfileData(username, profileData)` - Sauvegarde complète
- `getProfileData(username)` - Récupération des données
- `saveAvatar(username, avatarDataUrl)` - Sauvegarde avatar
- `saveHandle(username, handle)` - Sauvegarde handle
- `getUserTitle(username)` - Détermine le titre selon le rôle
- `fileToDataUrl(file)` - Convertit File en Data URL

**Stockage IndexedDB**:
- Base: `QuietQuestDB`
- Store: `profileCards`
- Key: `username`
- Index: `username` (unique), `lastModified`

### 2. Hook d'Authentification
**Fichier**: `src/hooks/useAuth.js`

Gère l'utilisateur connecté:
- Stockage dans localStorage
- Utilisateur par défaut: `zingariello1314` (admin)
- Fonctions: `login()`, `logout()`

### 3. Hook ProfileCard
**Fichier**: `src/hooks/useProfileCard.js`

Gère les données du profil:
- Charge automatiquement les données depuis IndexedDB
- Fonctions: `updateAvatar()`, `updateHandle()`, `refresh()`
- État: `avatarUrl`, `handle`, `title`, `status`, `isLoading`

### 4. Composant ProfileCard3D
**Fichier**: `src/components/sidebar/ProfileCard3D.jsx`

Carte 3D avec:
- Effet holographique
- Affichage des infos utilisateur en bas
- Bouton "Profil" qui ouvre les paramètres
- Photo de profil dans le petit rond (dissociée de l'image de fond)

### 5. Modal de Paramètres
**Fichier**: `src/components/sidebar/ProfileCardSettings.jsx`

Interface pour:
- Upload d'avatar (JPG, PNG, GIF, max 5MB)
- Modification du handle (@username)
- Messages de confirmation/erreur

## 🔄 Flux de Données

```
Utilisateur connecté (useAuth)
    ↓
ProfileCard3D reçoit username
    ↓
useProfileCard charge depuis IndexedDB
    ↓
Affichage des données:
  - Avatar uploadé (ou /logo.png par défaut)
  - Handle personnalisé (ou username par défaut)
  - Titre automatique (Admin ou Utilisateur)
  - Statut "En ligne"
    ↓
Clic sur "Profil" → Modal de paramètres
    ↓
Modifications → Sauvegarde IndexedDB
    ↓
Rechargement automatique des données
```

## 📊 Règles de Gestion

### Titres Automatiques
```javascript
username === 'zingariello1314' → "Développeur Premium"
autres usernames → "Utilisateur"
```

### Avatars
- Par défaut: `/logo.png`
- Personnalisé: Data URL stocké dans IndexedDB
- Formats: JPG, PNG, GIF
- Taille max: 5MB
- Persistance: Par utilisateur

### Handles
- Par défaut: username
- Personnalisable via paramètres
- Préfixe @ ajouté automatiquement
- Persistance: Par utilisateur

## 🎨 Affichage

### Carte principale
- Image de fond: Avatar uploadé
- Nom: Username connecté
- Titre: Automatique selon rôle

### Petit rond en bas
- Photo: Avatar uploadé (même que fond)
- Handle: @username personnalisable
- Statut: "En ligne"
- Bouton: "Profil" (ouvre paramètres)

## 💾 Persistance

Toutes les données sont sauvegardées dans IndexedDB:
- Séparées par username
- Restaurées automatiquement à la reconnexion
- Pas de perte de données entre sessions

## 🚀 Utilisation

### Dans SidebarPremium.jsx
```jsx
const { user } = useAuth();

<ProfileCard3D
  username={user?.username || 'guest'}
  showUserInfo={true}
  enableTilt={true}
/>
```

### Modifier le profil
1. Cliquer sur le bouton "Profil" en bas de la carte
2. Modal s'ouvre
3. Upload avatar ou modifier handle
4. Sauvegarde automatique dans IndexedDB
5. Affichage mis à jour instantanément

## 🔧 Fichiers Créés

1. `src/services/profileCard/profileCardStorage.js` - Service IndexedDB
2. `src/hooks/useAuth.js` - Authentification
3. `src/hooks/useProfileCard.js` - Gestion profil
4. `src/components/sidebar/ProfileCardSettings.jsx` - Modal paramètres
5. `src/components/sidebar/ProfileCardSettings.css` - Styles modal

## ✅ Fonctionnalités

- [x] Stockage persistant IndexedDB
- [x] Multi-utilisateurs
- [x] Upload d'avatars
- [x] Modification du handle
- [x] Titre automatique selon rôle
- [x] Affichage nom utilisateur
- [x] Photo dissociée dans le petit rond
- [x] Modal de paramètres
- [x] Validation des fichiers
- [x] Messages de confirmation
