## QuietQuest – Analyse complète de l’onglet **Quêtes**

Ce document décrit en détail le fonctionnement de l’interface QuietQuest, avec un focus particulier sur **l’onglet “Mes quêtes”** et ses vues associées (“Aujourd’hui”, “Cette semaine”, “Statistiques”, “Sécurité”). L’objectif est de permettre à une IA de **recréer à l’identique** cet onglet et son environnement : structure HTML/Vue, logique métier, gestion de l’état, et rendu visuel (CSS).

---

## 1. Architecture générale du projet

- **Technologies principales**
  - **Vue 3 (CDN, API Composition)** : l’application est créée avec `createApp({ setup() { ... }, template: `...` })` directement dans `app.js`. Aucun système de composants séparés, tout est dans **un seul composant racine**.
  - **Chart.js** : utilisé dans l’onglet **Statistiques** pour afficher des graphiques (XP, streaks, répartition par catégories, etc.).
  - **localStorage** : utilisé pour **persister toutes les données** (quêtes, validations quotidiennes, stats, état de navigation, etc.).

- **Fichiers clés**
  - `index.html` : structure minimale qui charge Vue, Chart.js, `style.css` et `app.js`, avec un seul conteneur `#app`.
  - `app.js` : contient **toute la logique** de l’application (données, calculs, watchers, navigation par onglets, template HTML).
  - `style.css` : gère presque tout le style visuel (layout global, navigation, cartes quotidiennes, vue hebdo, onglet quêtes, popup, tableau, etc.).
  - `table-fix.css` : version spécialisée des styles du tableau des quêtes (dupliquée/équivalente à la section correspondante dans `style.css`).

- **Structure HTML globale**
  - Dans le `template` Vue de `app.js`, le contenu est structuré ainsi :
    - Un **header** avec le logo et le titre “QuietQuest”.
    - Une **barre de navigation par onglets** (Aujourd’hui, Cette semaine, Mes quêtes, Statistiques, Sécurité).
    - Une **barre d’XP globale** (niveau et progression).
    - Un **contenu principal** conditionnel, affiché selon `currentTab` :
      - `today` → vue “Aujourd’hui”.
      - `week` → vue “Cette semaine”.
      - `quests` → vue “Mes quêtes”.
      - `stats` → vue “Statistiques”.
      - `security` → vue “Sécurité”.
    - Un **popup de création/édition de quête** (hors focus ici, mais essentiel au CRUD).

---

## 2. Modèle de données et persistance

### 2.1. Clés de stockage

Les clés de `localStorage` sont centralisées dans `STORAGE_KEYS` :

- **`quietquest_quests`** : liste de toutes les quêtes (référentiel principal).
- **`quietquest_validations`** : validations quotidiennes (quêtes cochées par jour).
- **`quietquest_user_data`** : niveau, XP courant, XP pour prochain niveau.
- **`quietquest_daily_performances`** : stats quotidiennes agrégées (taux de réussite, XP gagné, etc.).
- **`quietquest_app_state`** : état de l’interface (onglet courant, filtres, tri, période de stats).
- **`quietquest_last_visit`** : date de dernière visite (pour gérer les changements de jour).

Les fonctions utilitaires `saveToStorage(key, data)` et `loadFromStorage(key, defaultValue)` encapsulent la lecture/écriture JSON sur `localStorage`, avec gestion d’erreur.

### 2.2. Objet Quête

Une **quête** (élément du tableau `allQuests`) possède les propriétés principales suivantes :

- **`id`** : identifiant numérique unique (généré en prenant `max(id existants) + 1`).
- **`nom`** : nom de la quête (obligatoire).
- **`description`** : description textuelle (facultative).
- **`categorie`** : chaîne parmi la liste fixe :
  - `['Santé', 'Travail', 'Apprentissage', 'Lecture', 'Sport', 'Ménage', 'Spirituel']`
- **`difficulte`** : entier 1 à 4, correspondant à **Facile, Moyen, Difficile, Épique**.
- **`duree`** : durée estimée en **minutes** (5 à 420, pas de 10min).
- **`type`** : `'recurrente'` ou `'exceptionnelle'`.
- **`jours`** :
  - Pour les quêtes **récurrentes** : tableau de jours numérotés 1–7 (1 = Lundi, …, 7 = Dimanche).
  - Pour les quêtes **exceptionnelles** : `null`.
- **`date`** :
  - Pour les quêtes exceptionnelles : date ISO `YYYY-MM-DD`.
  - Pour les récurrentes : `null`.
- **`active`** : booléen (true = la quête est prise en compte dans les vues Today/Week, false = inactive).
- **`creeLe`** : date de création (ISO, générée à la création).
- **`ordre`** : entier permettant de trier manuellement les quêtes dans le tableau (drag & drop).

### 2.3. Validations (quêtes cochées)

Les validations quotidiennes sont conservées dans `validations` :

- Chaque validation est un objet :
  - **`queteId`** : référence à l’`id` de la quête.
  - **`date`** : `YYYY-MM-DD` pour le jour concerné.
  - **`xpGagne`** : XP gagné pour cette validation (dépend de la difficulté et de la durée).
  - **`heureValidation`** : timestamp ISO du moment où la quête a été cochée.

La fonction `toggleQuest(questId, date)` ajoute ou retire une validation pour ce couple (`queteId`, `date`), ajuste l’XP utilisateur, recalcule la performance quotidienne et déclenche des **effets visuels de validation** (sur les cartes de la vue Today).

### 2.4. Données utilisateur & XP

- `userData` contient :
  - `level` (entier).
  - `currentXP` (entier).
  - `xpForNextLevel` (entier, ex. 2500).
- `calculateQuestXP(quest)` calcule l’XP de base :
  - Base par difficulté : {1: 250, 2: 375, 3: 500, 4: 750}.
  - Multiplicateur proportionnel à la durée en heures : `quest.duree / 60`.
  - XP final arrondi : `Math.round(base * multiplier)`.
- Des fonctions de progression (non détaillées ici) gèrent le passage de niveau lorsqu’assez d’XP est accumulé.

---

## 3. Gestion de la navigation et des onglets

### 3.1. État de navigation

- **`currentTab`** : ref Vue initialisée à `'today'`.
- **`tabs`** : tableau statique d’objets :
  - `{ id: 'today',  label: "Aujourd'hui", icon: '📅' }`
  - `{ id: 'week',   label: 'Cette semaine', icon: '📊' }`
  - `{ id: 'quests', label: 'Mes quêtes', icon: '⚡' }`
  - `{ id: 'stats',  label: 'Statistiques', icon: '📈' }`
  - `{ id: 'security', label: 'Sécurité', icon: '🔒' }`
- **`setActiveTab(tabId)`** met à jour `currentTab`.

L’état d’onglet (`currentTab`), les filtres et la config de tri sont **persistés** via `saveAppState()` dans `quietquest_app_state`, et rechargés au `onMounted()` via `loadSavedAppState()`.

### 3.2. Rendu visuel de la barre d’onglets

- **HTML (template Vue)**
  - Conteneur : `<nav class="main-navigation">`.
  - Liste d’onglets : `<div class="nav-tabs" :data-active="currentTab">`.
  - Boutons d’onglets :
    - `v-for="tab in tabs"`.
    - `@click="setActiveTab(tab.id)"`.
    - `:class="['nav-tab', { active: currentTab === tab.id }]"`
    - Contenu : `span.nav-icon` (emoji) + `span.nav-label` (texte).

- **CSS clé**
  - `.main-navigation` : largeur 85%, centrée.
  - `.nav-tabs` : fond **verre dépoli** (gradient + blur), bord arrondi, ombre portée.
  - `.nav-tab` : boutons verticaux (icône + label), avec transition, hover (léger lift + changement de couleur), animation de balayage lumineux via `::before`.
  - `.nav-tab.active` : gradient vert/émeraude, texte sombre, effet “pill active” très visible.

Ce système d’onglets est **purement visuel** (CSS) et **logique** (Vue via `currentTab`) ; aucune navigation URL n’est utilisée.

---

## 4. Vue “Aujourd’hui” (currentTab === 'today')

Même si ce n’est pas l’onglet “Mes quêtes”, il est important de comprendre que **toutes les vues reposent sur le même référentiel de quêtes**.

### 4.1. Récupération des quêtes du jour

- **`currentDate`** : date du jour (`YYYY-MM-DD`).
- **`getQuestsForDate(targetDate)`** :
  - Calcule le day-of-week (1–7, avec Dimanche = 7).
  - Ajoute :
    - Toutes les quêtes **récurrentes actives** dont `jours` contient ce jour.
    - Toutes les quêtes **exceptionnelles actives** dont `date` == `targetDate` (qu’elles soient complétées ou non).
  - Enrichit chaque quête de champs **dérivés** (pour les vues) :
    - `xp`: XP calculé par `calculateQuestXP`.
    - `completed`: booléen via `isQuestCompletedOnDate(quest.id, targetDate)`.
    - `isUrgent`: booléen si c’est le jour courant et si `isUrgencyTime()`.
  - Trie par `ordre`.

`todayQuests` est dérivé de cette fonction pour `currentDate`.

### 4.2. Layout de la vue Today

- Si `todayQuests` est vide :
  - Affichage d’un état vide avec icône 🎯, texte explicatif et bouton “Créer ma première mission”.
- Sinon :
  - **En-tête de jour** avec date en toutes lettres (`currentDateDisplay`).
  - **Stats du jour** :
    - Nombre total de missions.
    - XP total théorique.
    - Taux de réussite (`todayStats.successRate`), affiché avec gros pourcentage + barre de progression lumineuse, couleur déterminée par `getScoreColor(score)` (classe CSS `gold`, `green`, `orange`, `red`).
  - **Grille de cartes de quêtes** (`.quests-grid-premium`):
    - Pour chaque quête :
      - Carte `.quest-card-premium` avec classes additionnelles `completed`, `urgent`, `priority`.
      - Affichage du **rang** (#1, #2, …), du nom, de la catégorie (avec icône), de la durée (formatée par `formatDuration`), de l’XP et de la difficulté sous forme d’étoiles (`getDifficultyStars`).
      - **Bouton de validation** `.quest-checkbox-ultra` :
        - `@click="toggleQuest(quest.id)"`.
        - Classe `checked` si `quest.completed`.
        - Animations de ripple et de glow.

Cette vue donne une présentation **gamifiée et riche** des quêtes du jour, en s’appuyant sur la même base de données que l’onglet “Mes quêtes”.

---

## 5. Vue “Cette semaine” (currentTab === 'week')

Cette vue regroupe les quêtes sur **7 jours** avec un layout en **colonnes par jour**.

- **`weekDays`** : tableau de 7 objets jours (date, nom court, numéro, drapeau `isToday`, `dayOfWeek`).
- **`weekStats`** : pour chaque jour :
  - `date`, `dayName`, `dayNumber`, `isToday`.
  - `quests`: liste des quêtes pour ce jour (via `getQuestsForDate`).
  - `total`: nombre de quêtes.
  - `successRate`: taux de réussite.
  - `xp` agrégés.

### 5.1. Layout hebdomadaire

- **Si aucune quête** : état vide avec bouton pour créer des quêtes.
- Sinon :
  - `week-header` avec titre et résumé du nombre total de quêtes cette semaine.
  - `week-grid` composé de `.day-column` pour chaque jour :
    - En-tête de colonne avec jour, numéro, taux de réussite, et éventuellement une prédiction de streak via `dayStreakPrediction`.
    - Liste `.day-quests` de mini-quêtes :
      - Nom tronqué.
      - Icône de catégorie et durée (`getCategoryIcon`, `quest.duree` en minutes).
      - Checkbox `mini-checkbox` pour cocher/décocher la quête pour ce jour spécifique (`toggleQuest(quest.id, day.date)`).
    - Bouton `.day-add-btn` (“+”) pour ouvrir le popup de nouvelle quête.

---

## 6. Vue “Mes quêtes” (currentTab === 'quests') – Cœur de l’onglet Quêtes

C’est **l’interface principale de gestion des quêtes**. Elle permet de :

- Créer, éditer, dupliquer, supprimer des quêtes.
- Filtrer par catégorie, difficulté, jour ou type.
- Rechercher par texte.
- Activer/désactiver, manipuler plusieurs quêtes en bloc.
- Réordonner les quêtes via drag & drop.

### 6.1. Structure HTML de base

Quand `currentTab === 'quests'` :

- Si `allQuests.length === 0` :
  - Bloc `.empty-quests` avec icône ⚡, message explicatif et bouton “Créer ma première quête”.
- Sinon :
  - **Header** `.quests-header` :
    - Titre `.quests-title` “Arsenal de Missions”.
  - **Barre de filtres et actions** `.filters-bar` :
    - À gauche : `.filters-group` (recherche + selects + checkbox).
    - À droite : `.action-bar` (actions de masse + bouton “Nouvelle quête”).
  - **Tableau des quêtes** `.quests-table-container` contenant `<table class="quests-table">`.

### 6.2. Filtres et recherche

#### 6.2.1. État des filtres (`questFilters`)

- Ref `questFilters` avec structure :
  - `categorie`: `'all'` ou une des catégories (`'Santé'`, etc.).
  - `difficulte`: `'all'` ou valeur numérique (1–4) encodée en string dans le `select`.
  - `jour`: `'all'`, `'exceptionnelles'` ou valeur numérique (1–7).
  - `showInactive`: booléen (afficher les quêtes inactives ou non).

Cet objet est **persisté dans l’`APP_STATE`** et rechargé au démarrage (watchers `watch(questFilters, ...)`).

#### 6.2.2. Composants de filtrage dans le template

- **Recherche textuelle**
  - `input.search-input` avec `v-model="searchQuery"` et placeholder "🔍 Rechercher...".
  - Sert à filtrer sur `nom`, `description` ou `categorie` en minuscule.

- **Select Catégorie** (`questFilters.categorie`)
  - `<select v-model="questFilters.categorie" class="filter-select">`.
  - `<option value="all">Toutes catégories</option>`.
  - `<option v-for="cat in categories" :value="cat">{{ cat }}</option>`.

- **Select Difficulté** (`questFilters.difficulte`)
  - `<select v-model="questFilters.difficulte" class="filter-select">`.
  - `<option value="all">Toutes difficultés</option>`.
  - `<option v-for="diff in difficultes" :value="diff.value">{{ diff.label }}</option>`.

- **Select Jour** (`questFilters.jour`)
  - `<select v-model="questFilters.jour" class="filter-select">`.
  - `<option value="all">Tous les jours</option>`.
  - `<option v-for="jour in jours" :value="jour.value">{{ jour.label }}</option>`.
  - `<option value="exceptionnelles">Exceptionnelles</option>`.

- **Checkbox “Inactives”** (`questFilters.showInactive`)
  - `<label class="filter-checkbox"> <input type="checkbox" v-model="questFilters.showInactive"> Inactives </label>`.

#### 6.2.3. Logique de filtrage (`filteredAndSortedQuests`)

`filteredAndSortedQuests` est un `computed` central qui part de `allQuests.value` et applique successivement :

- **Filtre catégorie** :
  - Si `questFilters.categorie !== 'all'`, ne garder que les quêtes dont `quest.categorie` correspond.
- **Filtre difficulté** :
  - Si `questFilters.difficulte !== 'all'`, comparer `quest.difficulte` à `parseInt(questFilters.difficulte)`.
- **Filtre jour / exceptionnelles** :
  - Si `questFilters.jour === 'exceptionnelles'` :
    - Ne garder que les quêtes `type === 'exceptionnelle'`.
  - Si `questFilters.jour` est un jour 1–7 :
    - Ne garder que les quêtes `type === 'recurrente'` avec `quest.jours.includes(jour)`.
- **Filtre actifs/inactifs** :
  - Si `showInactive` est `false`, ne garder que les quêtes `quest.active === true`.
- **Recherche textuelle** :
  - Si `searchQuery` non vide :
    - Transformer en minuscule et vérifier si elle apparaît dans
      - `quest.nom`,
      - `quest.description` (si définie),
      - `quest.categorie`.

Le résultat de ce filtrage est ensuite **trié** (voir section Tri).

Un alias `filteredQuests` est également défini pour compatibilité, mais l’onglet utilise `filteredAndSortedQuests`.

### 6.3. Tri des quêtes

#### 6.3.1. État du tri

- `sortConfig` (ref) :
  - `column`: `null` ou l’un de `'nom' | 'categorie' | 'difficulte' | 'duree' | 'xp' | 'recurrence'`.
  - `direction`: `'asc'` ou `'desc'`.

#### 6.3.2. Contrôles de tri dans le tableau

Dans le `<thead>` de la table :

- Chaque `<th>` correspondant à une colonne cliquable a :
  - `@click="sortQuests('nom')"` (ou autre nom de colonne).
  - `class="sortable"`.
  - Texte + icône dynamique `{{ getSortIcon('nom') }}` affichant `↕️`, `▲` ou `▼`.

#### 6.3.3. Logique de tri

Dans `filteredAndSortedQuests` :

- Si `sortConfig.column` est non nul, le tableau filtré est trié via un comparateur qui :
  - `nom`      → compare `a.nom.toLowerCase()` et `b.nom.toLowerCase()`.
  - `categorie`→ compare `a.categorie` et `b.categorie`.
  - `difficulte`→ compare `a.difficulte` et `b.difficulte`.
  - `duree`    → compare `a.duree` et `b.duree`.
  - `xp`       → compare `calculateQuestXP(a)` et `calculateQuestXP(b)`.
  - `recurrence` → compare `a.jours.length` vs `b.jours.length` pour les quêtes récurrentes, 0 sinon.
- Le sens (`asc` ou `desc`) dépend de `sortConfig.direction`.

`sortQuests(column)` :

- Si la `column` est déjà sélectionnée → inverse la direction (`asc` ↔ `desc`).
- Sinon → fixe `column` à cette valeur et `direction` à `asc`.

### 6.4. Sélection multiple et actions en lot

#### 6.4.1. État de sélection

- `selectedQuests`: `ref(new Set())`.

Méthodes :

- `toggleQuestSelection(questId)` :
  - Ajoute/retire `questId` du set.
- `selectAllQuests()` :
  - Si `selectedQuests.size === filteredAndSortedQuests.length` → vide la sélection.
  - Sinon → sélectionne **toutes les quêtes visibles** (par filtre) en plaçant leurs `id` dans un nouveau `Set`.
- `hasSelectedQuests` (computed) :
  - `selectedQuests.size > 0`.

#### 6.4.2. Actions en lot (bulkActions)

Objet `bulkActions` avec les méthodes :

- **`delete()`**
  - Confirmation via `confirm(...)`.
  - Pour chaque `questId` dans `selectedQuests` :
    - Trouve l’index dans `allQuests`.
    - Supprime la quête (`splice`).
    - Supprime les validations associées (`validations = validations.filter(v => v.queteId !== questId)`).
  - Vide la sélection et appelle `recalculateAllPerformances()`.

- **`activate()`**
  - Pour chaque `questId` ⇒ `quest.active = true`.
  - Vide la sélection + `recalculateAllPerformances()`.

- **`deactivate()`**
  - Pour chaque `questId` ⇒ `quest.active = false`.
  - Vide la sélection + `recalculateAllPerformances()`.

- **`changeCategory(newCategory)`**
  - Pour chaque `questId` ⇒ `quest.categorie = newCategory`.
  - Vide la sélection.

Dans le template :

- Un bloc `.bulk-actions` est affiché seulement si `hasSelectedQuests` est vrai.
- Ce bloc contient :
  - Un select pour changer la catégorie en masse.
  - Trois boutons pour Activer, Désactiver, Supprimer.

### 6.5. Tableau des quêtes (vue liste)

#### 6.5.1. En-tête du tableau

- `<table class="quests-table">`
- `<thead>` contient une ligne `<tr>` avec 8 colonnes :
  1. **Checkbox globale** pour sélectionner/désélectionner toutes les quêtes visibles.
  2. **Nom de la quête** + tri sur `nom`.
  3. **Type/Catégorie** + tri sur `categorie`.
  4. **Niveau (difficulté)** + tri sur `difficulte`.
  5. **Temps (durée)** + tri sur `duree`.
  6. **Répétition (recurrence)** + tri sur `recurrence`.
  7. **Récompense (XP)** + tri sur `xp`.
  8. **Contrôles** (actions individuelles).

#### 6.5.2. Lignes du tableau (corps)

Pour chaque `quest in filteredAndSortedQuests` :

- `<tr>` avec classes dynamiques :
  - `'quest-row'`.
  - `'inactive'` si `!quest.active`.
  - `'selected'` si `selectedQuests.has(quest.id)`.
  - `'dragging'` si `draggedQuest && draggedQuest.id === quest.id`.
- Attributs drag & drop :
  - `draggable="true"`.
  - `@dragstart="startDrag(quest)"`.
  - `@dragover.prevent`.
  - `@drop="onDrop(quest)"`.

Cellules :

1. **Checkbox ligne** :
   - `input.row-checkbox` avec `:checked="selectedQuests.has(quest.id)"`.
   - `@change="toggleQuestSelection(quest.id)"`.
2. **Nom + description** :
   - `div.quest-name-cell` :
     - `{{ quest.nom }}`.
     - Optionnellement, `div.quest-description` si `quest.description` existe.
3. **Catégorie** :
   - `div.category-cell` :
     - `span.category-icon` avec `{{ getCategoryIcon(quest.categorie) }}`.
     - Texte de la catégorie.
4. **Difficulté** :
   - `div.difficulty-cell` avec deux boucles `v-for` :
     - Étoiles pleines `.difficulty-star` pour `getDifficultyStars(quest.difficulte).filled`.
     - Étoiles vides `.difficulty-star.empty` pour `...empty`.
5. **Durée** :
   - `span.duration-cell` avec `{{ formatDuration(quest.duree) }}`.
6. **Récurrence** :
   - `span.recurrence-cell` avec `{{ formatRecurrence(quest) }}`.
7. **XP** :
   - `span.xp-cell` avec `{{ calculateQuestXP(quest) }}`.
8. **Actions** :
   - `td.actions-cell` → `div.action-buttons` contenant 4 boutons `.action-btn` :
     - **Activer/Désactiver** :
       - `@click="toggleQuestActive(quest.id)"`.
       - Classe `play-btn` si inactif, `pause-btn` si actif.
       - Icône `▶️` (activer) ou `⏸️` (désactiver).
     - **Éditer** :
       - `@click="openEditQuestPopup(quest.id)"`.
       - Classe `edit-btn`, icône `✏️`.
     - **Dupliquer** :
       - `@click="duplicateQuest(quest.id)"`.
       - Classe `duplicate-btn`, icône `📋`.
     - **Supprimer** :
       - `@click="deleteQuest(quest.id)"`.
       - Classe `delete-btn`, icône `🗑️`.

#### 6.5.3. État “aucune quête trouvée”

En dessous du tableau :

- Si `filteredAndSortedQuests.length === 0` :
  - Bloc `.empty-state` avec :
    - Titre “Aucune quête trouvée”.
    - Texte “Ajustez vos filtres ou créez une nouvelle quête”.

### 6.6. Drag & Drop (réorganisation manuelle)

- **État** :
  - `draggedQuest = ref(null)`.

- **`startDrag(quest)`** :
  - Assigne `draggedQuest.value = quest`.

- **`onDrop(targetQuest)`** :
  - Si `draggedQuest` est nul ou identique à `targetQuest` → rien faire.
  - Sinon :
    - Trouve `draggedIndex` et `targetIndex` dans `allQuests`.
    - Retire la quête déplacée (`splice`) puis l’insère à la position cible.
    - Recalcule `ordre` pour toutes les quêtes (index + 1).
  - Remet `draggedQuest.value = null`.

L’effet visuel de la ligne en cours de drag est géré via la classe `.quest-row.dragging` (dans `style.css`).

### 6.7. Création / édition / duplication / suppression des quêtes

#### 6.7.1. Formulaire de quête (`questForm`)

- Ref `questForm` avec structure :
  - `nom`, `description`, `categorie`, `difficulte`, `duree`, `type`, `jours`, `date`.
- **Presets de récurrence** (`recurrencePresets`) :
  - `{ label: 'Tous les jours', jours: [1,2,3,4,5,6,7] }`
  - `{ label: 'Semaine', jours: [1,2,3,4,5] }`
  - `{ label: 'Week-end', jours: [6,7] }`
- **Durées possibles** (`durationOptions`) :
  - Générées dynamiquement de 0 à 420 minutes (pas de 10), en labels type `30 min`, `1h20`, etc.

#### 6.7.2. Fonctions de gestion

- `openNewQuestPopup()` :
  - Réinitialise le formulaire (`resetQuestForm()`).
  - `editingQuest = null`.
  - `showQuestPopup = true`, ajoute une classe `popup-open` au `body` pour le style.

- `openEditQuestPopup(questId)` :
  - Récupère la quête concernée.
  - Remplit `questForm` avec ses valeurs (copie profonde de `jours`).
  - `editingQuest = quest`.
  - Ouvre la popup (`showQuestPopup = true` + `popup-open`).

- `saveQuest()` :
  - Vérifie :
    - Nom non vide.
    - Si type `recurrente` → au moins un jour sélectionné.
    - Si type `exceptionnelle` → date renseignée.
  - Construit `questData` (sans `id`, `creeLe`, `ordre`).
  - Si on édite :
    - `Object.assign(editingQuest, questData)`.
  - Sinon (nouvelle quête) :
    - Calcule un nouvel `id` unique.
    - Ajoute `creeLe = getCurrentDate()` et `ordre = allQuests.length + 1`.
    - `allQuests.push(newQuest)`.
  - Ferme la popup et `recalculateAllPerformances()`.

- `toggleQuestActive(questId)` :
  - Trouve la quête et inverse `quest.active`.
  - Recalcule les performances.

- `deleteQuest(questId)` :
  - Confirmation.
  - Supprime la quête de `allQuests`.
  - Supprime les validations associées.
  - Recalcule les performances.

- `duplicateQuest(questId)` :
  - Copie la quête (spread).
  - Crée un nouvel `id`, modifie le `nom` en ajoutant “(copie)”.
  - Met à jour `creeLe` et `ordre`.
  - Pousse dans `allQuests`.

---

## 7. Vue “Statistiques” (currentTab === 'stats') – Contexte

Même si ce n’est pas l’onglet de gestion directe des quêtes, il dépend fortement des données de l’onglet Quêtes (quêtes actives, validations, XP).

### 7.1. Contenu principal

- **Métriques globales** (XP total, streak actuel, meilleur streak, moyenne 7 jours).
- **Sélecteur de période** (`selectedPeriod`) :
  - Boutons pour 7j, 2 semaines, 1 mois, 3 mois, 6 mois, 1 an.
- **Graphiques Chart.js** :
  - XP quotidiens avec ligne de tendance et texte de tendance (`xpTrendInfo`).
  - Évolution des streaks avec prédiction (`streakPredictionInfo`).
  - Répartition par catégories, etc.

Les graphiques sont mis à jour :

- À l’entrée dans l’onglet stats (`watch(currentTab)`).
- Lors de la modification des validations (watch sur `validations`).

---

## 8. Vue “Sécurité” (currentTab === 'security') – Contexte

Cette vue offre des **actions administratives** sur les données :

- **Export** des quêtes, validations, userData, dailyPerformances dans un fichier JSON (`exportQuests()`).
- **Import** depuis un JSON (`importQuests(event)`), avec remplacement complet des données après confirmation.
- **Sauvegarde manuelle** dans `localStorage` (`saveToLocalStorage()` – même si la sauvegarde est déjà automatique).
- **Réinitialisation totale** (`resetAllData()`) :
  - Vide toutes les listes.
  - Réinitialise l’utilisateur (niveau 1, 0 XP).
  - Nettoie les clés de `localStorage`.

Visuellement, cette vue utilise les mêmes codes graphiques (cartes, boutons lumineux, etc.).

---

## 9. Style visuel global de l’onglet Quêtes

### 9.1. Thème général

- **Ambiance** : cyberpunk / néon vert sur fond sombre.
- **Couleurs dominantes** :
  - Fonds : dégradés vert sombre (`#003c30`, `#001d18`).
  - Accents : vert néon (`#00ffc8`, `#32ff9f`).
  - Ombres : `rgba(0,0,0,0.4+)`.
- **Typographies** :
  - Titres : `Orbitron`, `Michroma`, `Audiowide`.
  - Texte : `Saira`.
  - UI (boutons, labels) : `Electrolize` pour un rendu “tech”.

### 9.2. Styles spécifiques à la vue “Mes quêtes”

- `.quests-view` :
  - Largeur max 1600px, padding généreux, min-height proche du viewport.
  - Centrée, sans scroll horizontal.

- `.quests-header` / `.quests-title` :
  - Titre centré, grand, en dégradé animé, avec ligne de séparation lumineuse sous le header.

- `.filters-bar` :
  - Conteneur horizontal avec **background glassmorphique** (gradient, blur).
  - Bords arrondis, ombre intérieure, ligne lumineuse en haut (pseudo-élément `::before`).
  - Contient :
    - `.filters-group` (flex, gap 15px).
    - `.filter-select` (selects stylisés).
    - `.search-input` (champ texte stylé, focus glow, placeholder clair).
    - `.filter-checkbox` pour “Inactives”.
  - `.new-quest-btn` :
    - Gros bouton à gradient néon, bord arrondi, effet de balayage lumineux au hover, ombre lumineuse.

- `.quests-table-container` et `.quests-table` :
  - Fond dégradé sombre + bord néon + blur.
  - `table-layout: auto`, large, sur fond translucide.
  - `thead` avec fond gradient et ligne lumineuse en bas (`::after`).
  - `th` finement espacés, typographie uppercase, couleur vert néon.
  - `tbody tr` :
    - Fond gradient subtil, bord inférieur semi-transparent.
    - Hover → changement de gradient, soulignement, légère translation vers le haut, ombre verte.
    - États `.inactive`, `.selected`, `.urgent` avec styles dédiés (opacité, bordures colorées, backgrounds spéciaux).

- `.quest-name-cell`, `.quest-description`, `.category-cell`, `.difficulty-cell`, `.duration-cell`, `.recurrence-cell`, `.xp-cell` :
  - Alignement propre, textes truncés (`text-overflow: ellipsis`), typographie cohérente.

- `.action-buttons` et `.action-btn` :
  - Petits boutons carrés/arrondis, chacun avec une couleur associée :
    - `play-btn` → vert.
    - `pause-btn` → orange.
    - `edit-btn` + `duplicate-btn` → bleu.
    - `delete-btn` → rouge.
  - Hover → translation légère, ombre, renforcement du gradient.

- `.search-input`, `.bulk-actions`, `.quest-row.selected` :
  - La recherche est encadrée par un style futuriste (icône, focus glow).
  - Les actions en masse apparaissent comme un groupe de contrôles secondaires à droite.
  - La ligne `.quest-row.selected` est mise en évidence (fond/contour accentué).

### 9.3. Scrollbars et responsive

- Scrollbars globales customisées (Chrome/Edge & Firefox).
- Media queries pour adapter :
  - Les paddings.
  - La taille des boutons (`.action-btn`, `.new-quest-btn`).
  - La disposition de `.filters-bar` sur les écrans plus petits (éventuel passage en multi-lignes).

---

## 10. Comportements automatiques et maintenance

Quelques logiques de fond à prendre en compte pour recréer un comportement identique :

- **Changement de jour automatique**
  - `checkDateChange()` se base sur `quietquest_last_visit`.
  - Si la date a changé :
    - Met à jour `currentDate`, `lastVisitDate`, `weekDays`.
    - Sauvegarde la nouvelle date.
    - Appelle `cleanupCompletedExceptionalQuests()` pour supprimer du référentiel les quêtes exceptionnelles complétées dont la date est passée.
    - Recalcule toutes les performances (`recalculateAllPerformances()`).
    - Met à jour les graphiques si on se trouve sur l’onglet Stats.
  - Un watcher périodique (`setInterval` toutes les 60s) appelle `checkDateChange()`.

- **Nettoyage périodique des données anciennes**
  - `cleanupOldData()` supprime :
    - Les validations et performances de plus d’un an.
  - Déclenché au démarrage si plus de 7 jours se sont écoulés depuis le dernier nettoyage (`quietquest_last_cleanup`).

- **Sauvegarde automatique de l’état de l’application**
  - Watchers sur :
    - `currentTab`, `selectedPeriod`, `questFilters`, `sortConfig`.
  - À chaque changement, `saveAppState()` écrit un objet dans `quietquest_app_state`, avec un champ `version` pour compatibilité.

---

## 11. Synthèse pour une recréation fidèle

Pour recréer exactement cet onglet “Mes quêtes” et son environnement :

- **Structure Vue / HTML**
  - Un composant racine Vue 3 en API Composition, avec :
    - `currentTab`, `tabs`, `allQuests`, `validations`, `userData`, `dailyPerformances`, `questFilters`, `sortConfig`, `selectedQuests`, `draggedQuest`, `questForm`, etc.
    - Un `template` unique qui :
      - Affiche la barre d’onglets.
      - Affiche la vue Today / Week / Quests / Stats / Security selon `currentTab`.
      - Intègre le tableau des quêtes avec filtres, recherche, tri, sélection multiple, drag & drop et actions.

- **Logique métier**
  - **Modèle de quête** tel que décrit plus haut, persistant dans `localStorage`.
  - Fonctions pour :
    - Charger/sauvegarder les données et l’état de l’interface.
    - Calculer `getQuestsForDate`, `calculateQuestXP`, `isQuestCompletedOnDate`.
    - Gérer les validations (toggle), la progression XP, les performances quotidiennes.
    - Filtrer + trier + rechercher les quêtes pour la vue “Mes quêtes”.
    - Gérer le CRUD et la duplication.
    - Réordonner les quêtes par drag & drop via l’attribut `ordre`.

- **Style**
  - Reproduire le **thème cyberpunk vert** :
    - Fond sombre à dégradés.
    - Typographies importées (`Orbitron`, `Audiowide`, `Electrolize`, `Saira`, `Michroma`).
    - Effets de glow, ombres portées, dégradés sur les boutons.
  - Appliquer les classes-clés :
    - Layout : `main-navigation`, `nav-tabs`, `main-content`, `quests-view`.
    - Filtres : `filters-bar`, `filter-select`, `search-input`, `bulk-actions`.
    - Tableau : `quests-table-container`, `quests-table`, `quest-row`, `quest-name-cell`, `quest-description`, `difficulty-star`, `xp-cell`, `action-btn` (+ variantes).
    - États : `inactive`, `selected`, `urgent`.

En respectant ces structures de données, ces noms de propriétés, ces états Vue et ces classes CSS, une IA pourra **reconstruire à l’identique l’onglet “Mes quêtes”** ainsi que les vues connexes sur un site distinct.


