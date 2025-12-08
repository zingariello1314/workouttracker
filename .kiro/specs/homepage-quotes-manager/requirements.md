# Requirements Document - Système de Gestion des Citations

**Statut:** ✅ COMPLET  
**Version:** 1.0  
**Date:** 7 décembre 2025 - Gestionnaire de Citations Page d'Accueil

## Introduction

Ce document définit les exigences pour un système de gestion de citations/phrases motivantes affichées sur la page d'accueil de Momentum. Le système permettra aux utilisateurs de personnaliser, ajouter, et gérer l'affichage de phrases inspirantes.

## Glossary

- **Citation**: Une phrase motivante affichée sur la page d'accueil, composée de 3 lignes de texte
- **Gestionnaire de Citations**: Interface dans les paramètres permettant de gérer les citations
- **Mode Aléatoire**: Mode par défaut où les citations changent aléatoirement à chaque visite
- **Citation Fixe**: Mode où une seule citation est affichée en permanence
- **IndexedDB**: Base de données locale du navigateur pour stocker les citations de manière persistante
- **Module d'Export**: Section dans les paramètres permettant d'exporter/importer les données en JSON

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur, je veux pouvoir ajouter mes propres citations personnalisées, afin de personnaliser mon expérience sur la page d'accueil.

#### Acceptance Criteria

1. WHEN l'utilisateur accède aux paramètres THEN le système SHALL afficher une section "Gestionnaire de Citations"
2. WHEN l'utilisateur clique sur "Ajouter une citation" THEN le système SHALL afficher un formulaire avec 3 champs de texte (ligne 1, ligne 2, ligne 3)
3. WHEN l'utilisateur remplit les 3 lignes et clique sur "Enregistrer" THEN le système SHALL ajouter la citation à la liste des citations disponibles
4. WHEN une citation est ajoutée THEN le système SHALL persister la citation dans le LocalStorage
5. WHEN l'utilisateur laisse un champ vide THEN le système SHALL empêcher l'enregistrement et afficher un message d'erreur

### Requirement 2

**User Story:** En tant qu'utilisateur, je veux pouvoir voir toutes mes citations enregistrées, afin de gérer ma collection de phrases motivantes.

#### Acceptance Criteria

1. WHEN l'utilisateur accède au gestionnaire de citations THEN le système SHALL afficher la liste de toutes les citations enregistrées
2. WHEN une citation est affichée dans la liste THEN le système SHALL montrer les 3 lignes de texte de manière lisible
3. WHEN l'utilisateur survole une citation THEN le système SHALL afficher des boutons d'action (modifier, supprimer, épingler)
4. WHEN la liste contient plus de 5 citations THEN le système SHALL permettre le défilement de la liste
5. WHEN aucune citation personnalisée n'existe THEN le système SHALL afficher la citation par défaut ("N'attends rien, Apprécie tout.")

### Requirement 3

**User Story:** En tant qu'utilisateur, je veux pouvoir modifier ou supprimer mes citations, afin de maintenir ma collection à jour.

#### Acceptance Criteria

1. WHEN l'utilisateur clique sur "Modifier" THEN le système SHALL afficher le formulaire pré-rempli avec les 3 lignes de la citation
2. WHEN l'utilisateur modifie les champs et clique sur "Enregistrer" THEN le système SHALL mettre à jour la citation dans le LocalStorage
3. WHEN l'utilisateur clique sur "Supprimer" THEN le système SHALL afficher une confirmation avant suppression
4. WHEN l'utilisateur confirme la suppression THEN le système SHALL retirer la citation de la liste et du LocalStorage
5. WHEN la dernière citation personnalisée est supprimée THEN le système SHALL revenir à la citation par défaut

### Requirement 4

**User Story:** En tant qu'utilisateur, je veux pouvoir choisir entre un mode aléatoire et une citation fixe, afin de contrôler l'affichage des citations.

#### Acceptance Criteria

1. WHEN l'utilisateur accède au gestionnaire THEN le système SHALL afficher un toggle "Mode Aléatoire / Citation Fixe"
2. WHEN le mode aléatoire est activé THEN le système SHALL sélectionner une citation aléatoire à chaque visite de la page d'accueil
3. WHEN l'utilisateur sélectionne "Citation Fixe" THEN le système SHALL afficher une liste déroulante des citations disponibles
4. WHEN l'utilisateur choisit une citation fixe THEN le système SHALL afficher uniquement cette citation sur la page d'accueil
5. WHEN l'utilisateur revient en mode aléatoire THEN le système SHALL reprendre la rotation aléatoire des citations

### Requirement 5

**User Story:** En tant qu'utilisateur, je veux que les citations s'affichent dans un ordre toujours différent en mode aléatoire, afin d'avoir une expérience variée.

#### Acceptance Criteria

1. WHEN le mode aléatoire est activé THEN le système SHALL utiliser un algorithme de sélection aléatoire
2. WHEN une citation est affichée THEN le système SHALL éviter d'afficher la même citation deux fois de suite
3. WHEN l'utilisateur visite la page d'accueil THEN le système SHALL sélectionner une citation différente de la précédente visite
4. WHEN il n'y a qu'une seule citation THEN le système SHALL toujours afficher cette citation
5. WHEN il y a deux citations THEN le système SHALL alterner entre les deux

### Requirement 6

**User Story:** En tant qu'utilisateur, je veux que mes préférences de citations soient sauvegardées, afin de ne pas avoir à les reconfigurer à chaque visite.

#### Acceptance Criteria

1. WHEN l'utilisateur ajoute une citation THEN le système SHALL sauvegarder immédiatement dans le LocalStorage
2. WHEN l'utilisateur modifie le mode d'affichage THEN le système SHALL persister le choix dans le LocalStorage
3. WHEN l'utilisateur revient sur l'application THEN le système SHALL charger les citations et préférences depuis le LocalStorage
4. WHEN le LocalStorage est vide THEN le système SHALL initialiser avec la citation par défaut
5. WHEN une erreur de lecture du LocalStorage survient THEN le système SHALL utiliser les valeurs par défaut

### Requirement 7

**User Story:** En tant qu'utilisateur, je veux que les citations soient traduites selon la langue de l'interface, afin d'avoir une expérience cohérente.

#### Acceptance Criteria

1. WHEN l'utilisateur ajoute une citation THEN le système SHALL permettre d'ajouter une traduction en anglais
2. WHEN la langue de l'interface change THEN le système SHALL afficher la citation dans la langue appropriée
3. WHEN une traduction n'existe pas THEN le système SHALL afficher la version française par défaut
4. WHEN l'utilisateur modifie une citation THEN le système SHALL permettre de modifier les deux versions linguistiques
5. WHEN une citation par défaut est affichée THEN le système SHALL utiliser les traductions existantes (fr/en)

### Requirement 8

**User Story:** En tant qu'utilisateur, je veux pouvoir réorganiser l'ordre de mes citations, afin de prioriser mes préférées.

#### Acceptance Criteria

1. WHEN l'utilisateur accède à la liste des citations THEN le système SHALL afficher des poignées de glisser-déposer
2. WHEN l'utilisateur glisse une citation THEN le système SHALL permettre de la déplacer dans la liste
3. WHEN l'utilisateur relâche une citation THEN le système SHALL mettre à jour l'ordre dans le LocalStorage
4. WHEN l'ordre change THEN le système SHALL maintenir cet ordre pour le mode aléatoire
5. WHEN le mode aléatoire est actif THEN le système SHALL respecter les poids/priorités définis par l'ordre

### Requirement 9

**User Story:** En tant qu'utilisateur, je veux pouvoir épingler une citation favorite, afin qu'elle apparaisse plus fréquemment en mode aléatoire.

#### Acceptance Criteria

1. WHEN l'utilisateur clique sur l'icône "épingler" THEN le système SHALL marquer la citation comme favorite
2. WHEN une citation est épinglée THEN le système SHALL afficher un indicateur visuel (étoile, épingle)
3. WHEN le mode aléatoire sélectionne une citation THEN le système SHALL donner une probabilité plus élevée aux citations épinglées
4. WHEN l'utilisateur dé-épingle une citation THEN le système SHALL retirer le statut favori et revenir à la probabilité normale
5. WHEN plusieurs citations sont épinglées THEN le système SHALL répartir équitablement la probabilité accrue entre elles

### Requirement 10

**User Story:** En tant qu'utilisateur, je veux que toutes mes citations soient stockées dans IndexedDB, afin d'avoir un stockage robuste et performant.

#### Acceptance Criteria

1. WHEN l'application démarre THEN le système SHALL initialiser une base de données IndexedDB nommée "MomentumQuotes"
2. WHEN une citation est ajoutée THEN le système SHALL la sauvegarder immédiatement dans IndexedDB
3. WHEN une citation est modifiée THEN le système SHALL mettre à jour l'enregistrement dans IndexedDB
4. WHEN une citation est supprimée THEN le système SHALL retirer l'enregistrement de IndexedDB
5. WHEN l'application charge les citations THEN le système SHALL récupérer toutes les citations depuis IndexedDB en moins de 100ms

### Requirement 11

**User Story:** En tant qu'utilisateur, je veux pouvoir exporter toutes mes citations en JSON, afin de sauvegarder ou partager ma collection.

#### Acceptance Criteria

1. WHEN l'utilisateur accède au module d'export dans les paramètres THEN le système SHALL afficher un bouton "Exporter Citations"
2. WHEN l'utilisateur clique sur "Exporter Citations" THEN le système SHALL générer un fichier JSON contenant toutes les citations
3. WHEN le fichier JSON est généré THEN le système SHALL inclure tous les champs (id, lignes, traductions, ordre, statut épinglé, dates)
4. WHEN le téléchargement démarre THEN le système SHALL nommer le fichier "momentum-quotes-[date].json"
5. WHEN l'export est terminé THEN le système SHALL afficher un message de confirmation

### Requirement 12

**User Story:** En tant qu'utilisateur, je veux pouvoir importer des citations depuis un fichier JSON, afin de restaurer ou partager ma collection.

#### Acceptance Criteria

1. WHEN l'utilisateur accède au module d'export THEN le système SHALL afficher un bouton "Importer Citations"
2. WHEN l'utilisateur sélectionne un fichier JSON THEN le système SHALL valider le format du fichier
3. WHEN le fichier est valide THEN le système SHALL afficher un aperçu des citations à importer
4. WHEN l'utilisateur confirme l'import THEN le système SHALL ajouter les citations à IndexedDB sans écraser les existantes
5. WHEN l'import est terminé THEN le système SHALL afficher le nombre de citations importées avec succès
