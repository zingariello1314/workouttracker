# Requirements Document - Personnalisation de la Carte de Profil

## Introduction

Ce document définit les exigences pour un système de personnalisation complète de la carte de profil affichée dans la sidebar. Le système permettra aux utilisateurs de personnaliser l'image de fond de la carte, le texte/arobase affiché dans le rectangle en bas, tout en réutilisant la photo de profil existante. Toutes les données seront persistées dans IndexedDB et gérées par utilisateur.

## Glossaire

- **ProfileCard**: La carte 3D holographique affichée dans la sidebar premium
- **Card Background Image**: L'image/icône centrale de la carte (actuellement le logo avec la flamme)
- **Handle**: Le texte/arobase affiché dans le rectangle en bas de la carte (ex: @zingariello1314)
- **Avatar**: La petite photo ronde dans le rectangle en bas à gauche (réutilise la photo de profil)
- **Username**: Le nom affiché en haut de la carte (ex: zingariello1314)
- **Title**: Le sous-titre affiché sous le username (ex: "Développeur Premium" ou "Utilisateur")
- **Status**: Le texte de statut affiché sous le handle (ex: "En ligne")
- **IndexedDB**: Base de données locale du navigateur pour la persistance
- **SettingsTab**: L'onglet Paramètres où se trouvent les modules de configuration
- **Mock Data**: Données par défaut affichées quand aucun utilisateur n'est connecté

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur, je veux pouvoir choisir une image centrale personnalisée pour ma carte de profil, afin que ma carte reflète mon identité visuelle.

#### Acceptance Criteria

1. WHEN l'utilisateur accède aux paramètres de la carte THEN le système SHALL afficher un module de sélection d'image centrale
2. WHEN l'utilisateur sélectionne une image centrale THEN le système SHALL valider que le fichier est une image (jpg, png, gif, webp, svg)
3. WHEN l'utilisateur upload une image centrale valide THEN le système SHALL stocker l'image dans IndexedDB associée à son compte
4. WHEN l'utilisateur upload une image centrale THEN le système SHALL afficher un aperçu immédiat de la carte avec la nouvelle image
5. WHEN l'utilisateur sauvegarde l'image centrale THEN le système SHALL persister les données et mettre à jour la carte dans la sidebar

### Requirement 2

**User Story:** En tant qu'utilisateur, je veux pouvoir personnaliser le texte/arobase affiché dans le rectangle en bas de ma carte, afin de choisir comment je suis identifié.

#### Acceptance Criteria

1. WHEN l'utilisateur accède aux paramètres de la carte THEN le système SHALL afficher un champ de texte pour modifier le handle
2. WHEN l'utilisateur modifie le handle THEN le système SHALL valider que le texte contient entre 1 et 20 caractères
3. WHEN l'utilisateur saisit un handle avec @ THEN le système SHALL automatiquement retirer le @ au début
4. WHEN l'utilisateur sauvegarde le handle THEN le système SHALL stocker la valeur dans IndexedDB associée à son compte
5. WHEN l'utilisateur sauvegarde le handle THEN le système SHALL mettre à jour immédiatement l'affichage dans la carte de la sidebar

### Requirement 3

**User Story:** En tant qu'utilisateur, je veux que ma photo de profil soit automatiquement utilisée comme avatar dans la carte, afin d'avoir une cohérence visuelle dans l'application.

#### Acceptance Criteria

1. WHEN l'utilisateur a une photo de profil définie THEN le système SHALL utiliser cette photo comme avatar dans la carte
2. WHEN l'utilisateur modifie sa photo de profil dans les paramètres THEN le système SHALL automatiquement mettre à jour l'avatar de la carte
3. WHEN l'utilisateur n'a pas de photo de profil THEN le système SHALL afficher le logo par défaut (/logo.png)
4. WHEN l'avatar est affiché dans la carte THEN le système SHALL maintenir le format rond et les dimensions appropriées
5. WHEN l'utilisateur supprime sa photo de profil THEN le système SHALL revenir au logo par défaut dans la carte

### Requirement 4

**User Story:** En tant qu'utilisateur, je veux que toutes mes personnalisations soient sauvegardées de manière durable dans IndexedDB, afin de les retrouver à chaque session.

#### Acceptance Criteria

1. WHEN l'utilisateur personnalise sa carte THEN le système SHALL stocker les données dans IndexedDB avec son username comme clé
2. WHEN l'utilisateur se reconnecte THEN le système SHALL charger automatiquement ses personnalisations depuis IndexedDB
3. WHEN les données sont sauvegardées THEN le système SHALL inclure un timestamp de dernière modification
4. WHEN une erreur de sauvegarde survient THEN le système SHALL afficher un message d'erreur clair à l'utilisateur
5. WHEN les données sont chargées depuis IndexedDB THEN le système SHALL valider l'intégrité des données avant de les appliquer

### Requirement 5

**User Story:** En tant qu'utilisateur non connecté, je veux voir une carte avec des données mockées par défaut, afin d'avoir un aperçu du système sans compte.

#### Acceptance Criteria

1. WHEN aucun utilisateur n'est connecté THEN le système SHALL afficher une carte avec des données mockées
2. WHEN des données mockées sont affichées THEN le système SHALL utiliser l'image centrale par défaut (logo avec flamme)
3. WHEN des données mockées sont affichées THEN le système SHALL afficher "QuietQuest" comme username et "@QuietQuest" comme handle
4. WHEN des données mockées sont affichées THEN le système SHALL afficher "Utilisateur" comme titre
5. WHEN un utilisateur se connecte après avoir vu les données mockées THEN le système SHALL immédiatement charger ses données personnalisées

### Requirement 6

**User Story:** En tant qu'utilisateur connecté (non-admin), je veux voir uniquement mes propres personnalisations dans ma carte, afin que mon expérience soit personnelle et privée.

#### Acceptance Criteria

1. WHEN un utilisateur non-admin se connecte THEN le système SHALL charger uniquement ses propres données de personnalisation
2. WHEN un utilisateur non-admin modifie sa carte THEN le système SHALL sauvegarder les modifications uniquement pour son compte
3. WHEN plusieurs utilisateurs utilisent l'application THEN le système SHALL isoler complètement les données de chaque utilisateur
4. WHEN un utilisateur se déconnecte THEN le système SHALL revenir aux données mockées par défaut
5. WHEN un utilisateur supprime ses personnalisations THEN le système SHALL revenir aux valeurs par défaut pour cet utilisateur

### Requirement 7

**User Story:** En tant qu'administrateur (zingariello1314), je veux voir mes propres personnalisations dans ma carte avec le titre "Développeur Premium", afin d'avoir une expérience personnalisée et un statut distinct.

#### Acceptance Criteria

1. WHEN l'administrateur se connecte THEN le système SHALL charger ses propres données de personnalisation
2. WHEN l'administrateur modifie sa carte THEN le système SHALL sauvegarder les modifications pour son compte admin
3. WHEN l'administrateur a des personnalisations THEN le système SHALL les afficher de la même manière que pour les autres utilisateurs
4. WHEN l'administrateur est connecté THEN le système SHALL afficher "Développeur Premium" comme titre dans la carte
5. WHEN l'administrateur se déconnecte THEN le système SHALL revenir aux données mockées par défaut

### Requirement 11

**User Story:** En tant qu'utilisateur ou visiteur non-admin, je veux voir le titre "Utilisateur" dans ma carte, afin d'avoir un titre générique approprié.

#### Acceptance Criteria

1. WHEN un utilisateur non-admin est connecté THEN le système SHALL afficher "Utilisateur" comme titre dans la carte
2. WHEN aucun utilisateur n'est connecté THEN le système SHALL afficher "Utilisateur" comme titre dans les données mockées
3. WHEN le titre est affiché THEN le système SHALL utiliser la même position et le même style que pour "Développeur Premium"
4. WHEN un utilisateur non-admin se connecte THEN le système SHALL ne jamais afficher "Développeur Premium"
5. WHEN le username change THEN le système SHALL réévaluer le titre approprié (admin vs utilisateur)

### Requirement 8

**User Story:** En tant qu'utilisateur, je veux que les modules de personnalisation soient intégrés dans l'onglet Paramètres existant, afin d'avoir un accès centralisé à toutes mes configurations.

#### Acceptance Criteria

1. WHEN l'utilisateur ouvre l'onglet Paramètres THEN le système SHALL afficher une section "Personnalisation de la Carte de Profil"
2. WHEN la section est affichée THEN le système SHALL regrouper les deux modules (image de fond et handle) dans une Card
3. WHEN l'utilisateur interagit avec les modules THEN le système SHALL fournir un feedback visuel immédiat
4. WHEN l'utilisateur sauvegarde des modifications THEN le système SHALL afficher un message de confirmation
5. WHEN une erreur survient THEN le système SHALL afficher un message d'erreur clair et actionnable

### Requirement 9

**User Story:** En tant qu'utilisateur, je veux pouvoir prévisualiser mes modifications avant de les sauvegarder, afin de m'assurer que le résultat correspond à mes attentes.

#### Acceptance Criteria

1. WHEN l'utilisateur sélectionne une nouvelle image centrale THEN le système SHALL afficher un aperçu en temps réel
2. WHEN l'utilisateur modifie le handle THEN le système SHALL afficher le changement dans l'aperçu
3. WHEN l'aperçu est affiché THEN le système SHALL maintenir les proportions, le style 3D et les effets holographiques de la carte réelle
4. WHEN l'utilisateur annule les modifications THEN le système SHALL restaurer l'aperçu à l'état précédent
5. WHEN l'utilisateur sauvegarde THEN le système SHALL appliquer les modifications à la carte réelle dans la sidebar

### Requirement 10

**User Story:** En tant qu'utilisateur, je veux pouvoir réinitialiser mes personnalisations aux valeurs par défaut, afin de recommencer à zéro si nécessaire.

#### Acceptance Criteria

1. WHEN l'utilisateur clique sur "Réinitialiser" THEN le système SHALL demander une confirmation
2. WHEN l'utilisateur confirme la réinitialisation THEN le système SHALL supprimer l'image centrale personnalisée et restaurer le logo par défaut
3. WHEN l'utilisateur confirme la réinitialisation THEN le système SHALL restaurer le handle par défaut (username)
4. WHEN la réinitialisation est effectuée THEN le système SHALL mettre à jour immédiatement la carte dans la sidebar
5. WHEN la réinitialisation est effectuée THEN le système SHALL afficher un message de confirmation
