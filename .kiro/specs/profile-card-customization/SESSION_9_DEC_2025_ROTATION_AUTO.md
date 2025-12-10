# Session 9 Décembre 2025 - Rotation Automatique des Images

## 🎯 Objectif

Implémenter un système de rotation automatique des images de la carte de profil avec plusieurs déclencheurs et options de configuration.

## 📋 Fonctionnalités Demandées

### 1. **Rotation au Changement d'Onglet/Sous-onglet**
- Changer l'image de fond de la carte à chaque changement d'onglet
- Changer l'image de fond à chaque changement de sous-onglet
- Option pour activer/désactiver cette fonctionnalité

### 2. **Rotation Temporelle**
- Rotation automatique toutes les X minutes (configurable)
- Timer indépendant qui tourne en arrière-plan
- Option pour activer/désactiver cette fonctionnalité

### 3. **Configuration Indépendante**
- **Images de fond (cardIcons)** : rotation configurable séparément
- **Images d'avatar** : rotation configurable séparément
- Exemple : cardIcons changent toutes les minutes, avatars changent seulement au changement d'onglet

### 4. **Interface de Configuration**
Accessible depuis 2 endroits :
- **Paramètres du site** (SettingsTab)
- **Bouton "Profil" de la carte** (ProfileCardSettings)

## 🎨 Options de Configuration

### Pour les Images de Fond (cardIcons)
```javascript
{
  rotationEnabled: true/false,
  rotationMode: 'tab-change' | 'timer' | 'both' | 'none',
  timerInterval: 60, // en secondes (1 minute par défaut)
  changeOnTabSwitch: true/false,
  changeOnSubTabSwitch: true/false
}
```

### Pour les Avatars
```javascript
{
  rotationEnabled: true/false,
  rotationMode: 'tab-change' | 'timer' | 'both' | 'none',
  timerInterval: 120, // en secondes (2 minutes par défaut)
  changeOnTabSwitch: true/false,
  changeOnSubTabSwitch: true/false
}
```

## 🔧 Architecture Technique

### 1. **Storage (profileCardStorage.js)**
Ajouter les fonctions :
- `getRotationSettings(username)` - Récupérer les paramètres de rotation
- `saveRotationSettings(username, settings)` - Sauvegarder les paramètres
- `getNextImage(username, type)` - Obtenir l'image suivante dans la rotation

### 2. **Hook (useProfileCard.js)**
Ajouter :
- État pour les paramètres de rotation
- Fonction `rotateToNextImage(type)` - Passer à l'image suivante
- Timer pour la rotation automatique
- Écoute des changements d'onglets

### 3. **Composant (ProfileCard3D.jsx)**
- Écouter les événements de changement d'onglet
- Déclencher la rotation selon la configuration
- Gérer le timer de rotation automatique

### 4. **Interface de Configuration**
Créer un nouveau composant : `ProfileCardRotationSettings.jsx`
- Toggles pour activer/désactiver
- Sélecteur de mode de rotation
- Slider pour l'intervalle de temps
- Aperçu en temps réel

## 📊 Flux de Données

```
Changement d'onglet → App.jsx
                    ↓
            useProfileCard (écoute)
                    ↓
        Vérifie rotationSettings
                    ↓
    Si activé → rotateToNextImage()
                    ↓
        Mise à jour de l'index actif
                    ↓
        ProfileCard3D se met à jour
```

## 🎯 Plan d'Implémentation

### Phase 1 : Storage et Configuration
1. Ajouter les fonctions de storage pour les paramètres de rotation
2. Définir la structure de données pour les settings
3. Créer les fonctions de rotation (next image)

### Phase 2 : Hook et Logique
1. Modifier `useProfileCard.js` pour gérer la rotation
2. Implémenter le timer de rotation automatique
3. Implémenter l'écoute des changements d'onglets

### Phase 3 : Interface Utilisateur
1. Créer `ProfileCardRotationSettings.jsx`
2. Intégrer dans `ProfileCardSettings.jsx`
3. Intégrer dans `SettingsTab.jsx`

### Phase 4 : Tests et Ajustements
1. Tester la rotation au changement d'onglet
2. Tester la rotation temporelle
3. Tester les configurations indépendantes
4. Ajuster les performances

## 💡 Détails Techniques

### Détection du Changement d'Onglet
```javascript
// Dans App.jsx ou un contexte global
useEffect(() => {
  // Émettre un événement custom lors du changement d'onglet
  window.dispatchEvent(new CustomEvent('tab-change', { 
    detail: { tab: activeTab, subTab: activeSubTab } 
  }));
}, [activeTab, activeSubTab]);
```

### Timer de Rotation
```javascript
// Dans useProfileCard.js
useEffect(() => {
  if (!rotationSettings.cardIcon.rotationEnabled) return;
  if (rotationSettings.cardIcon.rotationMode === 'none') return;
  if (rotationSettings.cardIcon.rotationMode === 'tab-change') return;
  
  const interval = setInterval(() => {
    rotateToNextImage('cardIcon');
  }, rotationSettings.cardIcon.timerInterval * 1000);
  
  return () => clearInterval(interval);
}, [rotationSettings]);
```

### Rotation Cyclique
```javascript
const rotateToNextImage = async (type) => {
  const images = type === 'cardIcon' ? cardIcons : avatars;
  const currentIndex = type === 'cardIcon' ? activeCardIconIndex : activeAvatarIndex;
  
  if (images.length === 0) return;
  
  // Passer à l'image suivante (cyclique)
  const nextIndex = (currentIndex + 1) % images.length;
  
  if (type === 'cardIcon') {
    await selectCardIcon(nextIndex);
  } else {
    await selectAvatar(nextIndex);
  }
};
```

## 🎨 Interface Utilisateur Proposée

### Dans ProfileCardSettings
```
┌─────────────────────────────────────┐
│ 🔄 Rotation Automatique             │
├─────────────────────────────────────┤
│                                     │
│ Images de Fond                      │
│ ☑ Activer la rotation               │
│                                     │
│ Mode de rotation:                   │
│ ○ Changement d'onglet               │
│ ○ Timer automatique                 │
│ ● Les deux                          │
│                                     │
│ Intervalle: [====●====] 60s         │
│                                     │
│ ☑ Changer au changement d'onglet    │
│ ☑ Changer au changement de sous-onglet │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ Images de Profil (Avatar)           │
│ ☑ Activer la rotation               │
│                                     │
│ Mode de rotation:                   │
│ ● Changement d'onglet               │
│ ○ Timer automatique                 │
│ ○ Les deux                          │
│                                     │
│ ☑ Changer au changement d'onglet    │
│ ☐ Changer au changement de sous-onglet │
│                                     │
└─────────────────────────────────────┘
```

## 🚀 Avantages

1. **Dynamisme** : La carte change constamment, jamais monotone
2. **Personnalisation** : Chaque utilisateur configure selon ses préférences
3. **Performance** : Rotation intelligente sans surcharge
4. **Flexibilité** : Configuration indépendante pour chaque type d'image

## ⚠️ Points d'Attention

1. **Performance** : Ne pas surcharger avec trop de rotations
2. **UX** : Transition fluide entre les images
3. **Persistance** : Sauvegarder l'état de rotation
4. **Synchronisation** : Éviter les conflits entre timer et changement d'onglet

## 📝 Notes

- Les paramètres par défaut seront : rotation désactivée pour ne pas surprendre l'utilisateur
- L'utilisateur devra activer manuellement la fonctionnalité
- Un indicateur visuel pourrait montrer quand la rotation est active
- Possibilité d'ajouter une animation de transition entre les images

---

**Status**: 🟡 En attente d'implémentation
**Priorité**: Haute
**Complexité**: Moyenne
