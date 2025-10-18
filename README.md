# 🚀 Momentum - Suivi d'Entraînement Personnel

<div align="center">

[![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge)](https://github.com/zingariello1314/workouttracker)
![Momentum](https://img.shields.io/badge/Momentum-Fitness-purple?style=for-the-badge&logo=dumbbell)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0+-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

*Une application web moderne et élégante pour suivre vos entraînements de musculation*

[🚀 Demo Live](#) • [📖 Documentation](#fonctionnalités) • [🛠️ Installation](#installation) • [🤝 Contribuer](#contribution)

</div>

---

## 🎯 À Propos

**Momentum** est une application web progressive (PWA) conçue pour les passionnés de fitness qui souhaitent suivre leurs entraînements de musculation de manière efficace et motivante. Avec son interface moderne au thème sombre élégant et son logo distinctif, l'application offre une expérience utilisateur exceptionnelle pour planifier, exécuter et analyser vos séances d'entraînement.

### ✨ Points Forts

- 🎨 **Interface Moderne** : Thème sombre élégant avec des gradients colorés et des effets visuels
- 📱 **Responsive Design** : Parfaitement adapté aux mobiles, tablettes et ordinateurs
- 💾 **Stockage Local** : Vos données restent privées et accessibles hors ligne
- 📊 **Analyses Détaillées** : Statistiques complètes et suivi de progression
- 🔄 **Temps Réel** : Interface réactive avec mises à jour instantanées

---

## 🚀 Fonctionnalités

### 📅 Onglet "Aujourd'hui"
- **Navigation par Date** : Parcourez facilement vos entraînements passés et futurs
- **Programme Adaptatif** : Système de semaines A/B pour varier les exercices
- **Étirements Intégrés** : Section dédiée aux étirements avec instructions détaillées
- **Suivi en Temps Réel** : Enregistrement instantané des répétitions effectuées
- **Interface Intuitive** : Boutons d'incrémentation/décrémentation pour chaque exercice

### 📊 Onglet "Statistiques"
- **Métriques Globales** :
  - Total des répétitions effectuées
  - Nombre d'exercices différents pratiqués
  - Moyenne de répétitions par exercice
- **Système de Streaks** :
  - Série actuelle d'entraînements consécutifs
  - Record personnel de série la plus longue
- **Analyses Temporelles** :
  - Vue par semaine, mois ou année
  - Progression détaillée par exercice
- **Top Exercices** : Classement des exercices les plus pratiqués avec indicateurs de progression

### 📚 Onglet "Historique"
- **Chronologie Complète** : Historique détaillé de tous vos entraînements
- **Filtrage Intelligent** : Recherche par date, exercice ou type d'entraînement
- **Détails Contextuels** : Informations sur le jour, la date et les performances
- **Interface Élégante** : Présentation claire avec codes couleur et animations

### 📸 Onglet "Suivi Corporel"
- **Photos de Progression** : Galerie organisée de vos photos avant/après
- **Mesures Corporelles** :
  - Poids avec suivi des variations
  - Mensurations détaillées (poitrine, taille, hanches, bras, cuisses)
- **Journal Personnel** : Notes et commentaires sur vos progrès
- **Visualisation Temporelle** : Évolution de vos mesures dans le temps

---

## 🛠️ Technologies Utilisées

### Frontend
- **React 18.3.1** : Framework JavaScript moderne avec hooks
- **Vite 5.4.10** : Build tool ultra-rapide pour le développement
- **Tailwind CSS 3.4.14** : Framework CSS utilitaire pour un design moderne

### Icônes & UI
- **Lucide React** : Bibliothèque d'icônes SVG élégantes et cohérentes
- **Animations CSS** : Transitions fluides et effets visuels

### Stockage & Données
- **IndexedDB** : Base de données locale pour la persistance des données
- **LocalStorage** : Stockage rapide pour les préférences utilisateur

### Outils de Développement
- **ESLint** : Linting pour maintenir la qualité du code
- **PostCSS** : Traitement CSS avancé avec autoprefixer

---

## 📦 Installation

### Prérequis
- **Node.js** (version 16 ou supérieure)
- **npm** ou **yarn**

### Étapes d'Installation

1. **Cloner le repository**
   ```bash
   git clone https://github.com/zingariello1314/workouttracker.git
   cd workouttracker
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

4. **Ouvrir l'application**
   - Naviguer vers `http://localhost:3000`
   - L'application se recharge automatiquement lors des modifications

### Build de Production

```bash
# Créer le build optimisé
npm run build

# Prévisualiser le build
npm run preview
```

---

## 🎨 Design System

### Palette de Couleurs
- **Arrière-plan Principal** : `slate-900` - Noir profond élégant
- **Cartes & Composants** : `slate-800/80` avec effet backdrop-blur
- **Bordures** : `slate-700` et `slate-600` pour la hiérarchie
- **Texte Principal** : `white` pour une lisibilité optimale
- **Texte Secondaire** : `gray-400` et `gray-500` pour les détails

### Gradients & Accents
- **Primaire** : Violet vers Rose (`purple-500` → `pink-500`)
- **Succès** : Vert vers Émeraude (`green-400` → `emerald-400`)
- **Attention** : Orange vers Rouge (`orange-400` → `red-400`)

### Effets Visuels
- **Ombres** : `shadow-xl` pour la profondeur
- **Flou d'Arrière-plan** : `backdrop-blur-sm` pour l'élégance
- **Transitions** : `transition-all duration-200` pour la fluidité

---

## 📱 Structure du Projet

```
workout-tracker/
├── 📁 public/                 # Fichiers statiques
├── 📁 src/
│   ├── 📄 App.jsx            # Composant principal de l'application
│   ├── 📄 main.jsx           # Point d'entrée React
│   ├── 📄 index.css          # Styles globaux et Tailwind
│   └── 📁 data/
│       └── 📄 workoutProgram.js  # Configuration des exercices
├── 📄 package.json           # Dépendances et scripts
├── 📄 vite.config.js         # Configuration Vite
├── 📄 tailwind.config.js     # Configuration Tailwind CSS
└── 📄 README.md              # Documentation (ce fichier)
```

---

## 🔧 Configuration

### Programme d'Entraînement
Le fichier `src/data/workoutProgram.js` contient la configuration complète des exercices :

```javascript
// Exemple de structure
export const workoutProgram = {
  Lundi: {
    nom: "Pectoraux & Triceps",
    exercices: [
      {
        id: 1,
        name: "Pompes",
        reps: "3x12",
        description: "Exercice de base pour les pectoraux"
      }
      // ... autres exercices
    ]
  }
  // ... autres jours
};
```

### Personnalisation
- **Exercices** : Modifiez `workoutProgram.js` pour adapter les exercices
- **Thème** : Ajustez les couleurs dans `tailwind.config.js`
- **Fonctionnalités** : Étendez `App.jsx` pour de nouvelles fonctionnalités

---

## 🚀 Fonctionnalités Avancées

### Système de Persistance
- **Sauvegarde Automatique** : Toutes les données sont sauvegardées en temps réel
- **Récupération Intelligente** : Restauration automatique en cas de fermeture inattendue
- **Export/Import** : Fonctionnalités de sauvegarde et restauration des données

### Performance & Optimisation
- **Lazy Loading** : Chargement optimisé des composants
- **Memoization** : Optimisation des re-rendus React
- **Bundle Splitting** : Code splitting pour des temps de chargement réduits

### Accessibilité
- **Navigation Clavier** : Support complet de la navigation au clavier
- **Lecteurs d'Écran** : Attributs ARIA pour l'accessibilité
- **Contraste Élevé** : Respect des standards WCAG 2.1

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment participer :

### Processus de Contribution

1. **Fork** le projet
2. **Créer** une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. **Commiter** vos changements (`git commit -m 'Add some AmazingFeature'`)
4. **Pousser** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrir** une Pull Request

### Guidelines de Développement

- **Code Style** : Suivre les conventions ESLint configurées
- **Commits** : Utiliser des messages de commit descriptifs
- **Tests** : Ajouter des tests pour les nouvelles fonctionnalités
- **Documentation** : Mettre à jour la documentation si nécessaire

---

## 📈 Roadmap

### Version 2.0 (À venir)
- [ ] 🔐 **Authentification** : Comptes utilisateur et synchronisation cloud
- [ ] 📊 **Graphiques Avancés** : Visualisations interactives des progrès
- [ ] 🏆 **Système de Récompenses** : Badges et achievements
- [ ] 👥 **Mode Social** : Partage et défis entre amis
- [ ] 🎵 **Intégration Musique** : Playlists d'entraînement
- [ ] ⌚ **Support Wearables** : Intégration montres connectées

### Version 1.5 (Prochaine)
- [ ] 📱 **PWA Complète** : Installation sur mobile
- [ ] 🔄 **Synchronisation** : Backup automatique
- [ ] 🎯 **Objectifs Personnalisés** : Définition d'objectifs
- [ ] 📝 **Templates d'Entraînement** : Programmes prédéfinis

---

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 👨‍💻 Auteur

**Zingariello1314**
- GitHub: [@zingariello1314](https://github.com/zingariello1314)
- Repository: [workouttracker](https://github.com/zingariello1314/workouttracker)

---

## 🙏 Remerciements

- **React Team** pour le framework exceptionnel
- **Tailwind CSS** pour le système de design
- **Lucide** pour les icônes élégantes
- **Vite** pour l'expérience de développement fluide

---

<div align="center">

**⭐ Si ce projet vous plaît, n'hésitez pas à lui donner une étoile ! ⭐**

*Développé avec ❤️ pour la communauté fitness*

</div>