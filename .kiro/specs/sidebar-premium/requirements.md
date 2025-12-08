# Requirements Document - Sidebar Premium QuietQuest

## Introduction

La Sidebar Premium QuietQuest est un composant d'interface utilisateur fixe qui affiche toutes les informations vitales de l'utilisateur dans une interface cyberpunk élégante. Elle doit être visible sur toutes les pages de l'application, à l'exception de la HomePage et de la page Paramètres (SettingsTab).

## Glossary

- **Sidebar**: Barre latérale fixe de 300px de largeur positionnée à gauche de l'écran
- **Zone Fixe**: Section non-scrollable en haut de la sidebar contenant l'horloge et les statuts
- **Zone Scrollable**: Section centrale de la sidebar contenant les sections d'information
- **Section**: Bloc d'information pliable/dépliable dans la zone scrollable
- **Carte Développeur**: Composant 3D avec effet tilt affichant le profil utilisateur
- **Actions Rapides**: Boutons d'accès rapide aux fonctionnalités principales
- **Métriques Vitales**: Indicateurs numériques des performances utilisateur
- **Thème Cyberpunk**: Palette de couleurs Magenta-Orange-Or avec effets de lueur

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur, je veux voir une sidebar premium sur toutes les pages (sauf HomePage et Paramètres), afin d'avoir un accès constant aux informations vitales et actions rapides.

#### Acceptance Criteria

1. WHEN l'utilisateur navigue vers n'importe quel onglet THEN le système SHALL afficher la sidebar premium à gauche de l'écran
2. WHEN l'utilisateur est sur la HomePage THEN le système SHALL masquer la sidebar premium
3. WHEN l'utilisateur est sur la page Paramètres THEN le système SHALL masquer la sidebar premium
4. WHEN la sidebar est affichée THEN le système SHALL réserver 300px de largeur à gauche de l'écran
5. WHEN la sidebar est affichée THEN le système SHALL ajuster le contenu principal pour ne pas chevaucher la sidebar

### Requirement 2

**User Story:** En tant qu'utilisateur, je veux voir une zone d'horloge fixe en haut de la sidebar, afin de toujours connaître l'heure et la date actuelles.

#### Acceptance Criteria

1. WHEN la sidebar est affichée THEN le système SHALL afficher l'heure actuelle au format HH:MM
2. WHEN la sidebar est affichée THEN le système SHALL afficher la date actuelle au format "Jour DD Mois YYYY"
3. WHEN une minute s'écoule THEN le système SHALL mettre à jour l'affichage de l'heure automatiquement
4. WHEN l'heure ou la date change THEN le système SHALL appliquer le dégradé de couleurs Magenta-Orange-Or au texte
5. WHEN la zone d'horloge est affichée THEN le système SHALL rester fixe en haut sans défiler avec le contenu

### Requirement 3

**User Story:** En tant qu'utilisateur, je veux voir une carte développeur 3D avec mon profil, afin d'avoir une représentation visuelle personnalisée de mon compte.

#### Acceptance Criteria

1. WHEN la sidebar est affichée THEN le système SHALL afficher la carte développeur sous la zone d'horloge
2. WHEN l'utilisateur survole la carte THEN le système SHALL appliquer un effet de tilt 3D basé sur la position du curseur
3. WHEN l'utilisateur quitte la carte avec le curseur THEN le système SHALL ramener la carte à sa position initiale avec une animation fluide
4. WHEN la carte est affichée THEN le système SHALL charger l'avatar utilisateur depuis IndexedDB
5. WHEN aucun avatar n'est disponible THEN le système SHALL afficher un avatar par défaut

### Requirement 4

**User Story:** En tant qu'utilisateur, je veux voir les statuts système en temps réel, afin de connaître l'état actuel de mon système et de mes activités.

#### Acceptance Criteria

1. WHEN la sidebar est affichée THEN le système SHALL afficher une grille 2x2 de statuts sous la carte développeur
2. WHEN le système est actif THEN le système SHALL afficher le statut "SYSTÈME ACTIF" avec un point pulsant vert
3. WHEN le mode nuit est activé THEN le système SHALL afficher le statut "MODE NUIT" avec une icône lune
4. WHEN l'utilisateur est connecté THEN le système SHALL afficher le statut "CONNECTÉ" avec une icône signal
5. WHEN une session focus est active THEN le système SHALL afficher le pourcentage de focus avec une icône batterie

### Requirement 5

**User Story:** En tant qu'utilisateur, je veux accéder rapidement aux actions principales via des boutons dédiés, afin de lancer des activités sans naviguer dans les menus.

#### Acceptance Criteria

1. WHEN la section Actions Rapides est ouverte THEN le système SHALL afficher une grille 2x2 de boutons principaux
2. WHEN l'utilisateur clique sur un bouton d'action THEN le système SHALL déclencher l'action correspondante
3. WHEN l'utilisateur survole un bouton THEN le système SHALL appliquer une animation de levée et de lueur
4. WHEN la section Actions Rapides est ouverte THEN le système SHALL afficher une ligne de 4 boutons secondaires sous les boutons principaux
5. WHEN un bouton est cliqué THEN le système SHALL fournir un retour visuel immédiat

### Requirement 6

**User Story:** En tant qu'utilisateur, je veux voir mes métriques vitales en un coup d'œil, afin de suivre mes performances globales.

#### Acceptance Criteria

1. WHEN la section Métriques Vitales est ouverte THEN le système SHALL afficher les métriques principales en grille 2x2
2. WHEN une métrique change THEN le système SHALL mettre à jour la valeur affichée en temps réel
3. WHEN l'utilisateur survole une carte métrique THEN le système SHALL appliquer un effet de levée et de lueur
4. WHEN les métriques sont affichées THEN le système SHALL utiliser des couleurs distinctes pour chaque type de métrique
5. WHEN les métriques sont affichées THEN le système SHALL afficher les valeurs avec des polices de grande taille et des effets de lueur

### Requirement 7

**User Story:** En tant qu'utilisateur, je veux voir mes quêtes actives avec leur progression, afin de suivre mes objectifs en cours.

#### Acceptance Criteria

1. WHEN la section Quêtes Actives est ouverte THEN le système SHALL afficher la liste des quêtes en cours
2. WHEN une quête est affichée THEN le système SHALL montrer le titre, l'icône et le pourcentage de progression
3. WHEN une quête est affichée THEN le système SHALL afficher une barre de progression visuelle
4. WHEN une quête progresse THEN le système SHALL mettre à jour la barre de progression avec une animation fluide
5. WHEN l'utilisateur survole une quête THEN le système SHALL appliquer un effet de levée et de lueur

### Requirement 8

**User Story:** En tant qu'utilisateur, je veux pouvoir plier et déplier les sections de la sidebar, afin de personnaliser l'affichage selon mes besoins.

#### Acceptance Criteria

1. WHEN l'utilisateur clique sur l'en-tête d'une section THEN le système SHALL basculer l'état ouvert/fermé de la section
2. WHEN une section est fermée THEN le système SHALL masquer le contenu et afficher un symbole ▼
3. WHEN une section est ouverte THEN le système SHALL afficher le contenu et afficher un symbole ▲
4. WHEN l'état d'une section change THEN le système SHALL animer la transition d'ouverture/fermeture
5. WHEN l'utilisateur ferme une section THEN le système SHALL sauvegarder l'état dans le localStorage

### Requirement 9

**User Story:** En tant qu'utilisateur, je veux que la sidebar soit scrollable, afin d'accéder à toutes les sections même sur un petit écran.

#### Acceptance Criteria

1. WHEN le contenu de la sidebar dépasse la hauteur de l'écran THEN le système SHALL activer le scroll vertical
2. WHEN l'utilisateur scrolle dans la sidebar THEN le système SHALL maintenir la zone d'horloge fixe en haut
3. WHEN l'utilisateur scrolle dans la sidebar THEN le système SHALL afficher une scrollbar personnalisée cyan
4. WHEN la scrollbar est affichée THEN le système SHALL utiliser une largeur de 6px
5. WHEN l'utilisateur survole la scrollbar THEN le système SHALL augmenter l'opacité de la scrollbar

### Requirement 10

**User Story:** En tant qu'utilisateur, je veux que la sidebar utilise le thème cyberpunk cohérent, afin d'avoir une expérience visuelle harmonieuse.

#### Acceptance Criteria

1. WHEN la sidebar est affichée THEN le système SHALL utiliser le dégradé de fond bleu-noir foncé vers noir profond
2. WHEN des éléments de texte importants sont affichés THEN le système SHALL appliquer le dégradé Magenta-Orange-Or
3. WHEN des bordures sont affichées THEN le système SHALL utiliser des couleurs or semi-transparentes
4. WHEN des effets de lueur sont appliqués THEN le système SHALL utiliser les couleurs du thème avec transparence
5. WHEN des animations sont déclenchées THEN le système SHALL utiliser des transitions fluides avec cubic-bezier

### Requirement 11

**User Story:** En tant qu'utilisateur, je veux que la sidebar soit performante, afin de ne pas ralentir l'application.

#### Acceptance Criteria

1. WHEN la sidebar est affichée THEN le système SHALL utiliser moins de 50MB de mémoire
2. WHEN des animations sont jouées THEN le système SHALL maintenir 60 FPS
3. WHEN l'utilisateur interagit avec la sidebar THEN le système SHALL répondre en moins de 100ms
4. WHEN la sidebar charge des données THEN le système SHALL utiliser des techniques de lazy loading
5. WHEN des images sont chargées THEN le système SHALL optimiser la taille et le format des images

### Requirement 12

**User Story:** En tant qu'utilisateur, je veux que la sidebar soit accessible, afin que tous les utilisateurs puissent l'utiliser.

#### Acceptance Criteria

1. WHEN la sidebar est affichée THEN le système SHALL respecter les normes WCAG 2.1 AA
2. WHEN l'utilisateur navigue au clavier THEN le système SHALL permettre l'accès à tous les éléments interactifs
3. WHEN un élément reçoit le focus clavier THEN le système SHALL afficher un indicateur de focus visible
4. WHEN des couleurs sont utilisées THEN le système SHALL maintenir un ratio de contraste minimum de 4.5:1
5. WHEN des animations sont jouées THEN le système SHALL respecter les préférences de mouvement réduit de l'utilisateur

### Requirement 13

**User Story:** En tant qu'utilisateur, je veux que la sidebar s'adapte à différentes tailles d'écran, afin de l'utiliser sur différents appareils.

#### Acceptance Criteria

1. WHEN l'écran a une largeur inférieure à 1024px THEN le système SHALL masquer automatiquement la sidebar
2. WHEN l'écran a une largeur supérieure à 1024px THEN le système SHALL afficher la sidebar
3. WHEN la sidebar est masquée sur mobile THEN le système SHALL permettre l'accès via un bouton toggle
4. WHEN l'utilisateur ouvre la sidebar sur mobile THEN le système SHALL l'afficher en overlay
5. WHEN l'utilisateur ferme la sidebar sur mobile THEN le système SHALL animer la fermeture vers la gauche

### Requirement 14

**User Story:** En tant qu'utilisateur, je veux que mes préférences de sidebar soient sauvegardées, afin de retrouver mon configuration à chaque visite.

#### Acceptance Criteria

1. WHEN l'utilisateur plie/déplie une section THEN le système SHALL sauvegarder l'état dans localStorage
2. WHEN l'utilisateur revient sur l'application THEN le système SHALL restaurer l'état des sections depuis localStorage
3. WHEN l'utilisateur modifie une préférence THEN le système SHALL sauvegarder immédiatement sans délai
4. WHEN les données localStorage sont corrompues THEN le système SHALL utiliser des valeurs par défaut
5. WHEN l'utilisateur se déconnecte THEN le système SHALL conserver les préférences de sidebar

### Requirement 15

**User Story:** En tant qu'utilisateur, je veux voir des badges de notification sur les sections, afin d'être alerté des nouveaux éléments.

#### Acceptance Criteria

1. WHEN une section contient des éléments non lus THEN le système SHALL afficher un badge avec le nombre d'éléments
2. WHEN le nombre d'éléments change THEN le système SHALL mettre à jour le badge en temps réel
3. WHEN le badge est affiché THEN le système SHALL utiliser une animation pulsante
4. WHEN l'utilisateur consulte les éléments THEN le système SHALL réduire le compteur du badge
5. WHEN le compteur atteint zéro THEN le système SHALL masquer le badge
