# Requirements Document - Sidebar Interactive & Cohérente

## Introduction

La sidebar QuietQuest actuelle présente 17 modules allant de "Actions Rapides" à "Statistiques Globales". Bien que visuellement impressionnante, elle manque de cohérence avec le contenu réel de l'application et d'interactivité profonde. Cette refonte vise à transformer la sidebar en un véritable hub de navigation intelligent où chaque donnée affichée est cliquable et mène directement à l'endroit précis où elle a été générée dans l'application.

## Glossary

- **Sidebar**: Barre latérale gauche de 300px affichant les informations vitales
- **Module**: Section repliable de la sidebar (ex: "Sport & Santé", "Finances")
- **Donnée cliquable**: Métrique ou information qui, au clic, navigue vers sa source
- **Navigation contextuelle**: Redirection vers l'onglet ET la sous-section exacte
- **Cohérence de données**: Alignement entre ce qui est affiché et ce qui existe réellement
- **QuietQuest Engine**: Système de quêtes et XP de l'application
- **Garmin Data**: Données de santé et activité physique
- **IndexedDB**: Base de données locale du navigateur
- **useSidebarData**: Hook centralisé qui agrège toutes les données

## Requirements

### Requirement 1: Audit et Nettoyage des Modules

**User Story:** En tant qu'utilisateur, je veux que la sidebar n'affiche que des modules correspondant à du contenu réel dans l'application, afin d'éviter la confusion et les fonctionnalités fantômes.

#### Acceptance Criteria

1. WHEN l'application démarre THEN le système SHALL identifier tous les modules de la sidebar qui n'ont pas de contenu correspondant dans l'application
2. WHEN un module n'a pas de données réelles THEN le système SHALL soit le masquer soit afficher un état "En développement" clair
3. WHEN un module affiche des données THEN ces données SHALL provenir de sources réelles (IndexedDB, localStorage, API)
4. WHEN l'utilisateur consulte la sidebar THEN tous les modules visibles SHALL avoir un lien direct avec un onglet ou sous-onglet existant
5. WHEN un module est marqué "En développement" THEN il SHALL être visuellement distinct et non-cliquable

### Requirement 2: Navigation Contextuelle Profonde

**User Story:** En tant qu'utilisateur, je veux pouvoir cliquer sur n'importe quelle donnée de la sidebar et être redirigé exactement à l'endroit où cette donnée a été générée, afin de gagner du temps et comprendre le contexte.

#### Acceptance Criteria

1. WHEN l'utilisateur clique sur "12 Entraînements" dans Sport & Santé THEN le système SHALL naviguer vers l'onglet Sport, sous-onglet Historique, avec le filtre "Cette semaine" appliqué
2. WHEN l'utilisateur clique sur "8,542 Pas" THEN le système SHALL naviguer vers l'onglet Garmin, sous-onglet Métriques, avec la date du jour sélectionnée
3. WHEN l'utilisateur clique sur "2,450 Calories" THEN le système SHALL naviguer vers l'onglet Garmin, sous-onglet Métriques, section Calories
4. WHEN l'utilisateur clique sur "72 BPM" THEN le système SHALL naviguer vers l'onglet Garmin, sous-onglet Fréquence Cardiaque, avec le graphique du jour affiché
5. WHEN l'utilisateur clique sur "42.5K€ Patrimoine" THEN le système SHALL naviguer vers l'onglet Finance, sous-onglet Synthèse, section Patrimoine Net
6. WHEN l'utilisateur clique sur "3 Livres en cours" THEN le système SHALL naviguer vers l'onglet Livres, avec les livres en cours affichés en premier
7. WHEN l'utilisateur clique sur "45 Pages lues" THEN le système SHALL naviguer vers l'onglet Livres, sous-onglet Statistiques, avec les données du jour
8. WHEN l'utilisateur clique sur une quête active THEN le système SHALL naviguer vers l'onglet Quêtes avec cette quête mise en évidence
9. WHEN l'utilisateur clique sur "12.5K XP" THEN le système SHALL naviguer vers l'onglet Quêtes, section Progression
10. WHEN l'utilisateur clique sur "Niveau 42" THEN le système SHALL naviguer vers l'onglet Quêtes, section Niveau avec l'historique de progression

### Requirement 3: Modules Sport & Santé - Intégration Complète

**User Story:** En tant qu'utilisateur sportif, je veux que le module Sport & Santé reflète précisément mes données Garmin et mes entraînements, avec des liens directs vers chaque métrique.

#### Acceptance Criteria

1. WHEN des données Garmin sont disponibles THEN le module SHALL afficher les métriques du jour en temps réel
2. WHEN l'utilisateur a fait des entraînements cette semaine THEN le compteur SHALL afficher le nombre exact avec un lien vers l'historique
3. WHEN l'utilisateur clique sur "Calories" THEN le système SHALL ouvrir le graphique détaillé des calories brûlées
4. WHEN l'utilisateur clique sur "Pas" THEN le système SHALL ouvrir la vue détaillée avec l'objectif quotidien et la progression
5. WHEN l'utilisateur clique sur "BPM" THEN le système SHALL ouvrir le graphique de fréquence cardiaque avec les zones
6. WHEN aucune donnée Garmin n'est disponible THEN le module SHALL afficher un message clair avec un lien vers la configuration
7. WHEN l'utilisateur survole une métrique THEN un tooltip SHALL afficher le contexte (ex: "Objectif: 10,000 pas")

### Requirement 4: Modules Finances - Navigation Précise

**User Story:** En tant qu'utilisateur gérant mes finances, je veux que chaque donnée financière de la sidebar me mène directement à sa source détaillée dans le module Finance.

#### Acceptance Criteria

1. WHEN l'utilisateur clique sur "Patrimoine" THEN le système SHALL naviguer vers Finance > Synthèse > Vue Patrimoine Net avec le graphique d'évolution
2. WHEN l'utilisateur clique sur "Investissements" THEN le système SHALL naviguer vers Finance > Synthèse > Section Investissements avec le détail par actif
3. WHEN l'utilisateur clique sur "Budget" THEN le système SHALL naviguer vers Finance > Planificateur > Répartition Salaire
4. WHEN l'utilisateur clique sur "Épargne" THEN le système SHALL naviguer vers Finance > Planificateur > Section Épargne avec les objectifs
5. WHEN le taux d'épargne est affiché THEN cliquer dessus SHALL ouvrir une vue comparative mensuelle
6. WHEN les données financières sont manquantes THEN le module SHALL afficher un lien vers la configuration initiale

### Requirement 5: Modules Livres & Apprentissage - Liens Contextuels

**User Story:** En tant qu'utilisateur lisant des livres, je veux que mes statistiques de lecture dans la sidebar me permettent d'accéder rapidement à mes livres et sessions.

#### Acceptance Criteria

1. WHEN l'utilisateur clique sur "Livres en cours" THEN le système SHALL naviguer vers l'onglet Livres avec la liste des livres en cours
2. WHEN l'utilisateur clique sur "Pages lues" THEN le système SHALL naviguer vers l'onglet Livres > Statistiques avec le graphique du jour
3. WHEN l'utilisateur clique sur "Temps de lecture" THEN le système SHALL naviguer vers l'onglet Livres > Statistiques avec le détail des sessions
4. WHEN l'utilisateur clique sur "Objectif quotidien" THEN le système SHALL ouvrir les paramètres d'objectifs de lecture
5. WHEN la progression du jour est affichée THEN cliquer dessus SHALL ouvrir la vue détaillée avec l'historique

### Requirement 6: Modules Quêtes - Navigation Intelligente

**User Story:** En tant qu'utilisateur du système de quêtes, je veux pouvoir cliquer sur n'importe quelle quête ou métrique XP pour voir les détails et l'historique.

#### Acceptance Criteria

1. WHEN l'utilisateur clique sur une quête active THEN le système SHALL naviguer vers l'onglet Quêtes avec cette quête en focus et scrollée en vue
2. WHEN l'utilisateur clique sur "XP Total" THEN le système SHALL naviguer vers l'onglet Quêtes > Section Progression avec l'historique d'XP
3. WHEN l'utilisateur clique sur "Niveau" THEN le système SHALL naviguer vers l'onglet Quêtes > Section Niveau avec les paliers et récompenses
4. WHEN l'utilisateur clique sur "Streak" THEN le système SHALL naviguer vers l'onglet Quêtes > Statistiques avec le calendrier de streak
5. WHEN l'utilisateur clique sur "Focus" THEN le système SHALL naviguer vers l'onglet Quêtes > Statistiques avec le graphique de focus
6. WHEN une quête est complétée THEN cliquer dessus SHALL afficher une modal de célébration avec les récompenses

### Requirement 7: Actions Rapides - Liens Fonctionnels

**User Story:** En tant qu'utilisateur, je veux que les boutons d'actions rapides déclenchent réellement les actions correspondantes ou ouvrent les bons modules.

#### Acceptance Criteria

1. WHEN l'utilisateur clique sur "Focus +25min" THEN le système SHALL démarrer une session Pomodoro de 25 minutes
2. WHEN l'utilisateur clique sur "Lire +1 Page" THEN le système SHALL ouvrir l'onglet Livres avec le formulaire d'ajout de pages
3. WHEN l'utilisateur clique sur "Sport 30min" THEN le système SHALL ouvrir l'onglet Sport avec le formulaire de nouvelle séance
4. WHEN l'utilisateur clique sur "Valider Quête" THEN le système SHALL ouvrir l'onglet Quêtes avec les quêtes du jour
5. WHEN l'utilisateur clique sur "+Revenus" THEN le système SHALL ouvrir Finance > Planificateur > Ajout Revenu
6. WHEN l'utilisateur clique sur "+Film" THEN le système SHALL ouvrir le module Films (si implémenté) ou afficher un message
7. WHEN l'utilisateur clique sur "Journal" THEN le système SHALL ouvrir le module Journal (si implémenté) ou afficher un message
8. WHEN l'utilisateur clique sur "Méditer" THEN le système SHALL démarrer une session de méditation (si implémenté) ou afficher un message

### Requirement 8: Suppression des Modules Fantômes

**User Story:** En tant qu'utilisateur, je ne veux voir que les modules qui correspondent à des fonctionnalités réelles de l'application, afin d'éviter la confusion.

#### Acceptance Criteria

1. WHEN l'application charge THEN le système SHALL masquer tous les modules sans implémentation backend
2. WHEN un module est "En développement" THEN il SHALL être visuellement distinct avec une opacité réduite et un badge "Bientôt"
3. WHEN l'utilisateur clique sur un module "En développement" THEN rien ne SHALL se passer (pas de navigation)
4. WHEN un module devient fonctionnel THEN il SHALL automatiquement passer en mode actif
5. WHEN l'utilisateur consulte la sidebar THEN les modules SHALL être ordonnés par priorité (fonctionnels en premier)

### Requirement 9: Indicateurs Visuels de Navigation

**User Story:** En tant qu'utilisateur, je veux des indicateurs visuels clairs pour savoir quelles données sont cliquables et où elles me mèneront.

#### Acceptance Criteria

1. WHEN l'utilisateur survole une donnée cliquable THEN le curseur SHALL changer en pointeur et la donnée SHALL avoir un effet hover
2. WHEN l'utilisateur survole une donnée cliquable THEN un tooltip SHALL apparaître indiquant la destination (ex: "Voir dans Sport > Historique")
3. WHEN une donnée n'est pas cliquable THEN elle SHALL avoir un curseur par défaut et pas d'effet hover
4. WHEN l'utilisateur clique sur une donnée THEN une animation de transition SHALL indiquer la navigation
5. WHEN la navigation est en cours THEN un indicateur de chargement SHALL être affiché si nécessaire

### Requirement 10: Synchronisation des Données en Temps Réel

**User Story:** En tant qu'utilisateur, je veux que les données de la sidebar se mettent à jour automatiquement quand je modifie quelque chose dans l'application.

#### Acceptance Criteria

1. WHEN l'utilisateur complète une quête THEN le compteur de quêtes actives SHALL se mettre à jour immédiatement
2. WHEN l'utilisateur ajoute un entraînement THEN le compteur d'entraînements SHALL s'incrémenter sans rechargement
3. WHEN l'utilisateur lit des pages THEN le compteur de pages SHALL se mettre à jour en temps réel
4. WHEN l'utilisateur modifie son budget THEN les données financières SHALL se rafraîchir automatiquement
5. WHEN les données Garmin sont synchronisées THEN les métriques de santé SHALL se mettre à jour
6. WHEN une mise à jour échoue THEN un indicateur d'erreur SHALL être affiché avec un bouton de retry

### Requirement 11: Modules Prioritaires à Conserver

**User Story:** En tant qu'utilisateur, je veux que les modules essentiels soient toujours visibles et fonctionnels.

#### Acceptance Criteria

1. WHEN l'application charge THEN les modules "Actions Rapides", "Métriques Vitales", "Quêtes Actives" SHALL toujours être visibles
2. WHEN l'application charge THEN les modules "Sport & Santé", "Finances", "Livres" SHALL être visibles s'ils ont des données
3. WHEN l'application charge THEN les modules "Apprentissage", "Journal & Films", "Session Focus" SHALL être masqués ou marqués "En développement"
4. WHEN l'application charge THEN les modules "Achievements", "Focus RPG", "Météo", "Motivation" SHALL être masqués ou marqués "En développement"
5. WHEN l'application charge THEN les modules "Notifications", "Récompenses", "Historique", "Paramètres Rapides" SHALL être évalués pour pertinence

### Requirement 12: Architecture de Navigation Extensible

**User Story:** En tant que développeur, je veux une architecture de navigation claire et extensible pour faciliter l'ajout de nouveaux liens.

#### Acceptance Criteria

1. WHEN un nouveau module est ajouté THEN le système SHALL fournir un pattern clair pour définir les liens de navigation
2. WHEN une navigation est définie THEN elle SHALL inclure l'onglet cible, le sous-onglet, et les paramètres optionnels
3. WHEN une navigation est déclenchée THEN le système SHALL valider que la destination existe avant de naviguer
4. WHEN une destination n'existe pas THEN le système SHALL afficher un message d'erreur et ne pas naviguer
5. WHEN une navigation inclut des paramètres THEN ces paramètres SHALL être passés correctement au composant cible

### Requirement 13: Tests de Cohérence des Données

**User Story:** En tant que développeur, je veux des tests automatisés qui vérifient que les données de la sidebar correspondent aux données réelles de l'application.

#### Acceptance Criteria

1. WHEN les tests s'exécutent THEN ils SHALL vérifier que chaque donnée affichée provient d'une source valide
2. WHEN les tests s'exécutent THEN ils SHALL vérifier que chaque lien de navigation pointe vers une destination existante
3. WHEN les tests s'exécutent THEN ils SHALL vérifier que les compteurs correspondent aux données réelles
4. WHEN les tests s'exécutent THEN ils SHALL vérifier que les modules masqués n'ont effectivement pas de données
5. WHEN un test échoue THEN il SHALL fournir un message clair indiquant quelle donnée ou lien est incohérent
