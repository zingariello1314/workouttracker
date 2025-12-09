# Guide d'Utilisation - Modules Carte de Profil

## 🎯 Accès Rapide

### Depuis les Paramètres

1. **Ouvrir l'onglet Paramètres** ⚙️
2. **Descendre après la section "Mon Profil"**
3. **Deux nouveaux modules apparaissent**:

```
┌─────────────────────────────────────────────┐
│  📷 Image de la Carte de Profil             │
│  ─────────────────────────────────────────  │
│  Personnalisez l'image centrale qui         │
│  apparaît sur votre carte de profil         │
│                                             │
│  À propos:                                  │
│  • Remplace le logo par défaut              │
│  • Formats: JPG, PNG, GIF, SVG              │
│  • Taille max: 5 MB                         │
│  • Stockage local                           │
│                                             │
│  [Gérer l'Image de la Carte] 🎨            │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  👤 Handle de la Carte (@username)          │
│  ─────────────────────────────────────────  │
│  Personnalisez le @handle qui apparaît      │
│  dans le rectangle au bas de votre carte    │
│                                             │
│  À propos:                                  │
│  • Apparaît en bas de la carte              │
│  • Symbole @ automatique                    │
│  • Indépendant du nom d'utilisateur         │
│  • Sauvegarde automatique                   │
│                                             │
│  [Gérer le Handle de la Carte] 💙          │
└─────────────────────────────────────────────┘
```

### Depuis la Carte de Profil (Sidebar)

1. **Cliquer sur le bouton "Profil"** en bas de la carte
2. **Le modal s'ouvre avec 3 sections**:
   - Avatars (galerie de photos de profil)
   - Image de la Carte (image centrale)
   - Handle (@username)

## 📸 Module 1: Image de la Carte

### Que fait-il?
Change l'image qui apparaît **au centre** de ta carte de profil dans la sidebar.

### Où apparaît l'image?
```
┌─────────────────────┐
│   zingariello1314   │  ← Nom d'utilisateur
│  Développeur Premium│  ← Titre
│                     │
│      🔥 ou 🖼️      │  ← IMAGE CENTRALE (ici!)
│                     │
│  ┌───────────────┐  │
│  │ 👤 @handle    │  │  ← Rectangle du bas
│  │ En ligne      │  │
│  │   [Profil]    │  │
│  └───────────────┘  │
└─────────────────────┘
```

### Comment l'utiliser?

1. **Cliquer sur "Gérer l'Image de la Carte"**
2. **Le modal s'ouvre sur la section "Image de la Carte"**
3. **Cliquer sur "📷 Changer l'image de la carte"**
4. **Sélectionner une image** (JPG, PNG, GIF, SVG)
5. **L'image apparaît immédiatement** sur la carte!

### Formats acceptés
- ✅ JPG / JPEG
- ✅ PNG
- ✅ GIF
- ✅ SVG
- ❌ Max 5 MB

## 👤 Module 2: Handle de la Carte

### Que fait-il?
Change le **@handle** qui apparaît dans le petit rectangle en bas de ta carte.

### Où apparaît le handle?
```
┌─────────────────────┐
│   zingariello1314   │
│  Développeur Premium│
│                     │
│         🔥          │
│                     │
│  ┌───────────────┐  │
│  │ 👤 @handle    │  │  ← HANDLE (ici!)
│  │ En ligne      │  │
│  │   [Profil]    │  │
│  └───────────────┘  │
└─────────────────────┘
```

### Comment l'utiliser?

1. **Cliquer sur "Gérer le Handle de la Carte"**
2. **Le modal s'ouvre sur la section "Handle"**
3. **Taper le nouveau handle** (sans le @)
4. **Cliquer sur "Mettre à jour le handle"**
5. **Le handle change immédiatement** sur la carte!

### Exemples
- `zingariello1314` → affiche `@zingariello1314`
- `dev_premium` → affiche `@dev_premium`
- `quietquest` → affiche `@quietquest`

## 🎨 Design des Modules

### Module Image
- **Couleur**: Gradient Purple → Pink 💜💗
- **Icône**: 📷 Image
- **Position**: Après "Mon Profil"

### Module Handle
- **Couleur**: Gradient Blue → Cyan 💙💎
- **Icône**: 👤 User
- **Position**: Après "Image de la Carte"

## 💾 Sauvegarde

### Où sont stockées les données?
- **IndexedDB** (base de données locale du navigateur)
- **Isolées par utilisateur** (chaque compte a ses propres données)
- **Persistantes** (restent même après fermeture du navigateur)

### Structure de stockage
```javascript
{
  username: 'zingariello1314',
  cardIconUrl: 'data:image/png;base64,...',  // Image centrale
  handle: 'zingariello1314',                  // Handle
  avatarUrl: 'data:image/png;base64,...',     // Avatar
  avatars: [...],                             // Galerie
  activeAvatarIndex: 0,
  lastModified: '2025-12-09T...'
}
```

## 🔄 Synchronisation

### Quand les changements apparaissent?
- **Immédiatement** après la sauvegarde
- **Automatiquement** sur la carte dans la sidebar
- **Persistants** entre les sessions

### Multi-utilisateurs
- Chaque utilisateur a ses propres paramètres
- Les données ne se mélangent jamais
- Admin (zingariello1314) a le titre "Développeur Premium"
- Autres utilisateurs ont le titre "Utilisateur"

## ❓ FAQ

### Q: Puis-je utiliser n'importe quelle image?
**R**: Oui, tant qu'elle fait moins de 5 MB et est au format JPG, PNG, GIF ou SVG.

### Q: L'image est-elle visible par d'autres?
**R**: Non, c'est uniquement local sur ton navigateur.

### Q: Puis-je revenir à l'image par défaut?
**R**: Oui, il suffit de ne pas uploader d'image personnalisée.

### Q: Le handle doit-il être unique?
**R**: Non, c'est juste pour l'affichage sur ta carte.

### Q: Puis-je avoir plusieurs handles?
**R**: Non, un seul handle actif à la fois.

### Q: Les données sont-elles sauvegardées si je change de navigateur?
**R**: Non, les données sont locales au navigateur. Utilise l'export/import pour transférer.

## 🚀 Prochaines Étapes

1. **Essayer les modules** dans les Paramètres
2. **Uploader une image personnalisée** pour la carte
3. **Changer le @handle** pour personnaliser
4. **Profiter de ta carte unique!** 🎉
