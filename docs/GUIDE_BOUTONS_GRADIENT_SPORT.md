# Guide d'implémentation : Boutons Gradient Premium - Onglet Sport

## 📋 Vue d'ensemble

Ce guide détaille l'application de l'esthétique de boutons gradient premium (inspirée de `21st.dev`) à tous les boutons cliquables de l'onglet **Sport** et de tous ses sous-onglets.

**⚠️ IMPORTANT** : L'onglet Sport regroupe **14 sous-onglets** différents. Ce guide doit être suivi méthodiquement pour ne rien oublier.

## 🎯 Structure de l'onglet Sport

L'onglet Sport contient les sous-onglets suivants (définis dans `src/components/layout/Navigation.jsx`) :

1. **TodayTab** - Aujourd'hui
2. **DataEntryTab** - Saisie de données
3. **ProgramTab** - Programmes
4. **NutritionTab** - Nutrition
5. **ExercisesTab** - Exercices
6. **ProgressTab** - Progression
7. **EnduranceTab** - Endurance
8. **CalendarTab** - Calendrier
9. **HistoryTab** - Historique
10. **ChartsTab** - Graphiques
11. **StatsTab** - Statistiques
12. **PredictionsTab** - Prédictions (si existe)
13. **SmartBalancingTab** - Équilibre intelligent
14. **GarminTab** - Garmin

## 🎨 Styles CSS

Les styles CSS sont déjà définis dans `src/index.css`. Les classes suivantes sont disponibles :

- `.gradient-button-premium` : Classe de base
- `.gradient-button-premium-variant` : Variante cyan/blue pour actions secondaires
- `.gradient-button-premium-sm` : Taille petite (pagination, actions discrètes)
- `.gradient-button-premium-md` : Taille moyenne (formulaires, actions principales)
- `.gradient-button-premium-lg` : Taille grande (actions principales importantes)

### Référence CSS

Voir `src/index.css` pour les définitions complètes des `@property` et des classes `.gradient-button-premium*`.

## 🎯 Hiérarchie des couleurs

### Niveau 1 : Actions principales (Purple - par défaut)
- **Utilisation** : Actions principales, création, soumission, validation, démarrage
- **Classes** : `gradient-button-premium gradient-button-premium-md` (ou `-lg` pour les plus importantes)
- **Exemples** :
  - "Sauvegarder", "Enregistrer", "Valider"
  - "Créer", "Ajouter", "Nouveau"
  - "Démarrer", "Lancer", "Commencer"
  - "Exporter", "Télécharger"

### Niveau 2 : Actions secondaires (Cyan - variant)
- **Utilisation** : Modification, navigation active, annulation, actions alternatives
- **Classes** : `gradient-button-premium gradient-button-premium-md gradient-button-premium-variant`
- **Exemples** :
  - "Annuler", "Retour", "Fermer"
  - Navigation sous-onglets (actif)
  - "Éditer", "Modifier"
  - "Importer"

### Niveau 3 : Actions tertiaires (Purple Small)
- **Utilisation** : Actions discrètes, utilitaires, toggle, suppression, filtres
- **Classes** : `gradient-button-premium gradient-button-premium-sm`
- **Exemples** :
  - Boutons de filtres
  - Toggle modes
  - Actions discrètes dans les tableaux
  - Boutons de pagination

## 📝 Liste des boutons par sous-onglet

### 1. TodayTab.jsx

**Fichier** : `src/components/tabs/TodayTab.jsx`

#### 1.1 Boutons de mode (Gym/Home)
- **Lignes** : ~672-691
- **Boutons** : 2 boutons (Home, Gym)
- **Transformation** :
  ```jsx
  // Avant
  <button onClick={() => setIsGymMode(false)}>...</button>
  <button onClick={() => setIsGymMode(true)}>...</button>

  // Après
  <button type="button" onClick={() => setIsGymMode(false)} className="gradient-button-premium gradient-button-premium-sm rounded-lg">...</button>
  <button type="button" onClick={() => setIsGymMode(true)} className="gradient-button-premium gradient-button-premium-sm rounded-lg">...</button>
  ```

#### 1.2 Boutons d'actions sur exercices
- **Lignes** : ~779-912
- **Boutons** : 
  - "Restaurer" (exercice supprimé)
  - "Supprimer" (exercice exceptionnel)
  - "Ajouter exercice exceptionnel"
- **Transformation** : Utiliser `gradient-button-premium-md` pour les actions principales, `gradient-button-premium-sm` pour les actions secondaires

#### 1.3 Boutons de sauvegarde/annulation
- **Lignes** : ~956-997
- **Boutons** :
  - "Annuler modifications" (exercices)
  - "Sauvegarder modifications" (exercices)
  - "Annuler modifications" (étirements)
  - "Sauvegarder modifications" (étirements)
- **Transformation** :
  ```jsx
  // Annuler → gradient-button-premium-variant
  // Sauvegarder → gradient-button-premium (défaut)
  ```

#### 1.4 DayJustificationButton
- **Fichier** : `src/components/tabs/TodayTab/components/DayJustificationButton.jsx`
- **Bouton** : Justification de jour sans activité
- **Transformation** : `gradient-button-premium-md gradient-button-premium-variant`

### 2. DataEntryTab.jsx

**Fichier** : `src/components/tabs/DataEntryTab.jsx`

#### 2.1 Boutons de navigation date
- **Boutons** : Précédent/Suivant pour changer de date
- **Transformation** : `gradient-button-premium-sm`

#### 2.2 Bouton "Sauvegarder"
- **Bouton** : Sauvegarder les répétitions
- **Transformation** : `gradient-button-premium-md`

#### 2.3 Boutons de mode avancé
- **Boutons** : Toggle mode avancé, actions en lot
- **Transformation** : `gradient-button-premium-sm`

#### 2.4 Boutons de collapse/expand jours
- **Boutons** : Afficher/masquer les exercices d'un jour
- **Transformation** : `gradient-button-premium-sm`

### 3. ProgramTab.jsx

**Fichier** : `src/components/tabs/ProgramTab.jsx`

#### 3.1 Bouton "Créer un programme"
- **Bouton** : Ouvrir le formulaire de création
- **Transformation** : `gradient-button-premium-md`

#### 3.2 Boutons d'actions sur programmes
- **Boutons** :
  - "Activer" (programme)
  - "Voir détails"
  - "Éditer"
  - "Supprimer"
- **Transformation** :
  - Activer → `gradient-button-premium-md`
  - Voir détails → `gradient-button-premium-sm gradient-button-premium-variant`
  - Éditer → `gradient-button-premium-sm gradient-button-premium-variant`
  - Supprimer → `gradient-button-premium-sm`

#### 3.3 Boutons dans ProgramDetailView
- **Fichier** : `src/components/ProgramDetailView.jsx`
- **Boutons** :
  - "Retour à la liste"
  - "Désactiver programme"
  - "Importer programme actuel"
- **Transformation** :
  - Retour → `gradient-button-premium-md gradient-button-premium-variant`
  - Désactiver → `gradient-button-premium-md`
  - Importer → `gradient-button-premium-md`

### 4. NutritionTab.jsx

**Fichier** : `src/components/tabs/NutritionTab.jsx`

#### 4.1 Navigation sections
- **Lignes** : ~168-188
- **Boutons** : 7 boutons de navigation (Journal, Programmes, Analyses, Gamification, Défis, Progression, Partage)
- **Transformation** :
  ```jsx
  // Avant
  <Button
    variant={isActive ? 'default' : 'ghost'}
    onClick={() => setActiveSection(section.id)}
    className={...}
  >
    ...
  </Button>

  // Après
  <button
    type="button"
    onClick={() => setActiveSection(section.id)}
    className={`gradient-button-premium gradient-button-premium-md rounded-lg ${
      isActive ? 'gradient-button-premium-variant' : ''
    }`}
  >
    ...
  </button>
  ```

#### 4.2 Boutons dans les sous-composants Nutrition
- **Fichiers** : `src/components/tabs/nutrition/components/*.jsx`
- **Boutons** : À identifier dans chaque composant (NutritionJournal, NutritionPrograms, NutritionAnalyses, etc.)
- **Transformation** : Appliquer la hiérarchie selon le type d'action

### 5. ExercisesTab.jsx

**Fichier** : `src/components/tabs/ExercisesTab.jsx`

#### 5.1 Sélecteur de source de données
- **Boutons** : Default / Active Program / All Programs
- **Transformation** : `gradient-button-premium-sm` avec `variant` si actif

#### 5.2 Boutons de synchronisation
- **Boutons** : "Synchroniser", "Actualiser"
- **Transformation** : `gradient-button-premium-md`

#### 5.3 Boutons de filtres
- **Boutons** : Filtres par catégorie, groupe musculaire, équipement
- **Transformation** : `gradient-button-premium-sm`

#### 5.4 Boutons de navigation programmes
- **Boutons** : Sélectionner un programme, retour
- **Transformation** : `gradient-button-premium-sm gradient-button-premium-variant`

### 6. ProgressTab.jsx

**Fichier** : `src/components/tabs/ProgressTab.jsx`

#### 6.1 Boutons de navigation sections
- **Lignes** : ~76-100
- **Boutons** : 10 boutons (Métriques, Photos, Impédance, Résumé, Rappels, Corrélations, Prédictions, Stabilité, Insights, Commentaires)
- **Transformation** :
  ```jsx
  // Avant
  <button
    onClick={() => setActiveSection(section.id)}
    className={`p-4 rounded-lg border transition-all text-left ${
      activeSection === section.id
        ? 'border-orange-500 bg-orange-600/20 text-white'
        : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
    }`}
  >
    ...
  </button>

  // Après
  <button
    type="button"
    onClick={() => setActiveSection(section.id)}
    className={`gradient-button-premium rounded-lg p-4 text-left ${
      activeSection === section.id
        ? 'gradient-button-premium-variant'
        : ''
    }`}
  >
    ...
  </button>
  ```

#### 6.2 Boutons dans les sous-sections BodyTracking
- **Fichiers** : `src/components/BodyTracking/*.jsx`
- **Boutons** : À identifier dans chaque composant (MetricsSection, PhotoGallerySection, etc.)
- **Transformation** : Appliquer la hiérarchie selon le type d'action

### 7. EnduranceTab.jsx

**Fichier** : `src/components/tabs/EnduranceTab.jsx`

#### 7.1 Navigation onglets activités
- **Boutons** : Boxing, Pushups, Swimming, Jump Rope, Running
- **Transformation** : `gradient-button-premium-md` avec `variant` si actif

#### 7.2 Boutons d'actions sessions
- **Boutons** :
  - "Ajouter session"
  - "Éditer session"
  - "Supprimer session"
- **Transformation** :
  - Ajouter → `gradient-button-premium-md`
  - Éditer → `gradient-button-premium-sm gradient-button-premium-variant`
  - Supprimer → `gradient-button-premium-sm`

#### 7.3 Boutons dans EnduranceSessionForm
- **Fichier** : `src/components/tabs/EnduranceTab/components/EnduranceSessionForm.jsx`
- **Boutons** :
  - "Sauvegarder"
  - "Annuler"
- **Transformation** :
  - Sauvegarder → `gradient-button-premium-md`
  - Annuler → `gradient-button-premium-md gradient-button-premium-variant`

#### 7.4 Boutons de défis
- **Boutons** :
  - "Créer défi"
  - "Éditer défi"
  - "Supprimer défi"
  - "Valider défi"
- **Transformation** : Appliquer la hiérarchie

### 8. CalendarTab.jsx

**Fichier** : `src/components/tabs/CalendarTab.jsx`

#### 8.1 Boutons de navigation
- **Boutons** : Navigation mois précédent/suivant
- **Transformation** : `gradient-button-premium-sm`

#### 8.2 Boutons de filtres
- **Boutons** : Filtres par type d'activité
- **Transformation** : `gradient-button-premium-sm`

### 9. HistoryTab.jsx

**Fichier** : `src/components/tabs/HistoryTab.jsx`

#### 9.1 Boutons de filtres
- **Lignes** : ~18-43
- **Boutons** : All / Program / Exceptional / Suppressed
- **Transformation** : `gradient-button-premium-sm` avec `variant` si actif

### 10. ChartsTab.jsx

**Fichier** : `src/components/tabs/ChartsTab.jsx`

#### 10.1 Sélecteur de période
- **Boutons** : 7 jours / 30 jours / 90 jours / 1 an
- **Transformation** : `gradient-button-premium-sm` avec `variant` si actif

#### 10.2 Boutons de téléchargement
- **Boutons** : "Télécharger graphique"
- **Transformation** : `gradient-button-premium-md`

### 11. StatsTab.jsx

**Fichier** : `src/components/tabs/StatsTab.jsx`

#### 11.1 Sélecteur de période
- **Boutons** : Périodes disponibles
- **Transformation** : `gradient-button-premium-sm` avec `variant` si actif

#### 11.2 Boutons d'actions
- **Boutons** : Actions diverses selon les statistiques
- **Transformation** : Appliquer la hiérarchie

### 12. SmartBalancingTab.jsx

**Fichier** : `src/components/SmartBalancingTab.jsx`

#### 12.1 Sélecteur de composant
- **Boutons** : Workout / Justification / Garmin / Nutrition / BodyTracking / SessionFeedback
- **Transformation** : `gradient-button-premium-md` avec `variant` si actif

#### 12.2 Boutons d'actions
- **Boutons** : Actions diverses selon les analyses
- **Transformation** : Appliquer la hiérarchie

### 13. GarminTab.jsx

**Fichier** : `src/components/tabs/GarminTab.jsx` et composants associés

#### 13.1 Navigation onglets
- **Fichier** : `src/components/tabs/GarminTab/components/TabNavigation.jsx`
- **Boutons** : Navigation entre vues Garmin
- **Transformation** : `gradient-button-premium-md` avec `variant` si actif

#### 13.2 Boutons de synchronisation
- **Fichier** : `src/components/tabs/GarminTab/components/SyncControls.jsx`
- **Boutons** : "Synchroniser", "Forcer sync", etc.
- **Transformation** : `gradient-button-premium-md`

#### 13.3 Boutons de navigation temporelle
- **Fichier** : `src/components/tabs/GarminTab/components/TimeNavigation.jsx`
- **Boutons** : Précédent/Suivant, Aujourd'hui
- **Transformation** : `gradient-button-premium-sm`

#### 13.4 Boutons dans GarminTabView
- **Fichier** : `src/components/tabs/GarminTab/components/GarminTabView.jsx`
- **Boutons** : Actions diverses selon les vues
- **Transformation** : Appliquer la hiérarchie

## ✅ Checklist d'implémentation

### Fichiers principaux à modifier

- [ ] `src/components/tabs/TodayTab.jsx`
  - [ ] Boutons mode Gym/Home
  - [ ] Boutons actions exercices
  - [ ] Boutons sauvegarde/annulation
  - [ ] DayJustificationButton

- [ ] `src/components/tabs/DataEntryTab.jsx`
  - [ ] Navigation date
  - [ ] Bouton sauvegarder
  - [ ] Boutons mode avancé
  - [ ] Boutons collapse/expand

- [ ] `src/components/tabs/ProgramTab.jsx`
  - [ ] Bouton créer programme
  - [ ] Boutons actions programmes
  - [ ] ProgramDetailView

- [ ] `src/components/tabs/NutritionTab.jsx`
  - [ ] Navigation sections (7 boutons)
  - [ ] Sous-composants Nutrition

- [ ] `src/components/tabs/ExercisesTab.jsx`
  - [ ] Sélecteur source données
  - [ ] Boutons synchronisation
  - [ ] Boutons filtres
  - [ ] Navigation programmes

- [ ] `src/components/tabs/ProgressTab.jsx`
  - [ ] Navigation sections (10 boutons)
  - [ ] Sous-composants BodyTracking

- [ ] `src/components/tabs/EnduranceTab.jsx`
  - [ ] Navigation activités
  - [ ] Boutons actions sessions
  - [ ] EnduranceSessionForm
  - [ ] Boutons défis

- [ ] `src/components/tabs/CalendarTab.jsx`
  - [ ] Navigation mois
  - [ ] Boutons filtres

- [ ] `src/components/tabs/HistoryTab.jsx`
  - [ ] Boutons filtres

- [ ] `src/components/tabs/ChartsTab.jsx`
  - [ ] Sélecteur période
  - [ ] Boutons téléchargement

- [ ] `src/components/tabs/StatsTab.jsx`
  - [ ] Sélecteur période
  - [ ] Boutons actions

- [ ] `src/components/SmartBalancingTab.jsx`
  - [ ] Sélecteur composant
  - [ ] Boutons actions

- [ ] `src/components/tabs/GarminTab.jsx` et composants
  - [ ] TabNavigation
  - [ ] SyncControls
  - [ ] TimeNavigation
  - [ ] GarminTabView

### Sous-composants à explorer

- [ ] `src/components/tabs/nutrition/components/*.jsx` (tous les composants)
- [ ] `src/components/BodyTracking/*.jsx` (tous les composants)
- [ ] `src/components/tabs/EnduranceTab/components/*.jsx` (tous les composants)
- [ ] `src/components/tabs/GarminTab/components/*.jsx` (tous les composants)
- [ ] `src/components/tabs/TodayTab/components/*.jsx` (tous les composants)

## 📊 Résumé des transformations

| Sous-onglet | Nombre estimé de boutons | Priorité |
|-------------|-------------------------|----------|
| TodayTab | ~15-20 | Haute |
| DataEntryTab | ~10-15 | Haute |
| ProgramTab | ~10-15 | Moyenne |
| NutritionTab | ~30-40 | Haute |
| ExercisesTab | ~15-20 | Moyenne |
| ProgressTab | ~20-30 | Haute |
| EnduranceTab | ~25-35 | Haute |
| CalendarTab | ~5-10 | Basse |
| HistoryTab | ~5-10 | Basse |
| ChartsTab | ~10-15 | Moyenne |
| StatsTab | ~10-15 | Moyenne |
| SmartBalancingTab | ~15-20 | Moyenne |
| GarminTab | ~30-40 | Haute |

**Total estimé** : ~200-300 boutons (selon la complexité de chaque sous-onglet)

## 🎨 Exemples de transformation complets

### Exemple 1 : Navigation sections (NutritionTab, ProgressTab)

```jsx
// Avant
<Button
  variant={isActive ? 'default' : 'ghost'}
  onClick={() => setActiveSection(section.id)}
  className={...}
>
  <Icon size={18} />
  <span>{section.label}</span>
</Button>

// Après
<button
  type="button"
  onClick={() => setActiveSection(section.id)}
  className={`gradient-button-premium gradient-button-premium-md rounded-lg flex items-center justify-center gap-2 ${
    isActive ? 'gradient-button-premium-variant' : ''
  }`}
>
  <Icon size={18} />
  <span>{section.label}</span>
</button>
```

### Exemple 2 : Boutons sauvegarde/annulation

```jsx
// Avant
<Button onClick={handleSave}>Sauvegarder</Button>
<Button onClick={handleCancel}>Annuler</Button>

// Après
<button
  type="button"
  onClick={handleSave}
  className="gradient-button-premium gradient-button-premium-md rounded-lg"
>
  Sauvegarder
</button>
<button
  type="button"
  onClick={handleCancel}
  className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg"
>
  Annuler
</button>
```

### Exemple 3 : Boutons de filtres

```jsx
// Avant
<button
  onClick={() => setFilter('all')}
  className={`px-3 py-1 rounded ${
    filter === 'all' ? 'bg-blue-600' : 'bg-slate-700'
  }`}
>
  Tous
</button>

// Après
<button
  type="button"
  onClick={() => setFilter('all')}
  className={`gradient-button-premium gradient-button-premium-sm rounded-lg ${
    filter === 'all' ? 'gradient-button-premium-variant' : ''
  }`}
>
  Tous
</button>
```

## 🔍 Points d'attention

1. **Composants Button réutilisables** : Remplacer les composants `<Button>` par des `<button>` natifs avec les classes gradient.

2. **Navigation active** : Toujours utiliser `gradient-button-premium-variant` pour les éléments de navigation actifs.

3. **Sous-composants** : Explorer tous les sous-composants dans les dossiers `components/` de chaque onglet.

4. **Modales et popups** : Vérifier les boutons dans les modales et popups associées.

5. **Formulaires** : Les boutons de soumission doivent utiliser `gradient-button-premium-md`, les boutons d'annulation `gradient-button-premium-variant`.

6. **Actions destructives** : Les boutons de suppression peuvent utiliser `gradient-button-premium-sm` (niveau tertiaire) sauf si c'est une action principale.

## 📚 Références

- Guide Livres : `docs/GUIDE_BOUTONS_GRADIENT_LIVRES.md`
- Guide Finance : `docs/GUIDE_BOUTONS_GRADIENT_FINANCE.md`
- Guide Apprentissage : `docs/GUIDE_BOUTONS_GRADIENT_APPRENTISSAGE.md`
- Guide Quête : `docs/GUIDE_BOUTONS_GRADIENT_QUETE.md`
- Styles CSS : `src/index.css` (section `@layer components`)

## ⚠️ Notes importantes

- **Volume important** : L'onglet Sport contient beaucoup plus de boutons que les autres onglets. Prendre le temps de bien explorer chaque sous-onglet.

- **Composants imbriqués** : Beaucoup de sous-composants peuvent contenir des boutons. Ne pas oublier de les explorer.

- **Tests progressifs** : Tester chaque sous-onglet après transformation pour s'assurer que tout fonctionne correctement.

- **Cohérence** : Maintenir la même hiérarchie de couleurs dans tous les sous-onglets pour une expérience utilisateur cohérente.

