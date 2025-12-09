# Guide d'Utilisation - ProfileCard 3D Holographique

## 🎯 Vue d'ensemble

La ProfileCard 3D est une carte interactive avec effets holographiques qui remplace l'ancienne carte de profil dans la sidebar.

## 📍 Emplacement

La carte se trouve dans la sidebar, juste en dessous du bloc horloge/date.

## ✨ Effets Visuels

### Au repos
- Dégradés holographiques subtils
- Animations de fond douces
- Ombres légères

### Au survol
- Rotation 3D suivant le curseur
- Effets de brillance arc-en-ciel
- Reflets dynamiques
- Ombres accentuées

## 🎨 Personnalisation

Pour modifier la carte, éditez `src/components/sidebar/SidebarPremium.jsx`:

```jsx
<ProfileCard3D
  avatarUrl="/logo.png"           // Chemin de l'image
  name="QuietQuest"                // Nom affiché
  title="Développeur Premium"      // Titre affiché
  handle="quietquest"              // Handle (si showUserInfo=true)
  status="En ligne"                // Statut (si showUserInfo=true)
  showUserInfo={false}             // Afficher infos en bas
  enableTilt={true}                // Activer effet 3D
  enableMobileTilt={false}         // Activer gyroscope mobile
/>
```

## 🎨 Personnalisation Avancée

### Couleurs des effets holographiques

Éditez `src/components/sidebar/ProfileCard3D.css`:

```css
:root {
  --sunpillar-1: hsl(2, 100%, 73%);    /* Rouge */
  --sunpillar-2: hsl(53, 100%, 69%);   /* Jaune */
  --sunpillar-3: hsl(93, 100%, 69%);   /* Vert */
  --sunpillar-4: hsl(176, 100%, 76%);  /* Cyan */
  --sunpillar-5: hsl(228, 100%, 74%);  /* Bleu */
  --sunpillar-6: hsl(283, 100%, 73%);  /* Violet */
}
```

### Taille de la carte

```css
.pc-card {
  height: 200px;  /* Ajuster selon besoin */
}
```

## 📱 Comportement Mobile

Sur mobile (< 1024px):
- La carte est légèrement plus petite
- L'effet 3D est désactivé par défaut
- Peut être activé avec `enableMobileTilt={true}`

## 🔧 Dépannage

### La carte ne s'affiche pas
- Vérifier que `/logo.png` existe
- Vérifier la console pour les erreurs

### Les effets ne fonctionnent pas
- Vérifier que `enableTilt={true}`
- Vérifier que le CSS est bien importé

### Performance lente
- Désactiver `enableMobileTilt` sur mobile
- Réduire la complexité des animations dans le CSS

## 🎯 Prochaines Étapes

Pour ajouter plus de fonctionnalités:
1. Activer `showUserInfo={true}` pour afficher les infos en bas
2. Ajouter un `onContactClick` pour gérer les clics
3. Personnaliser les couleurs holographiques
