# Fix: Classe CSS `expanded` Manquante

## 🔍 Problème Identifié

Les modules de la sidebar apparaissaient vides même dépliés à cause d'une règle CSS qui cachait le contenu:

```css
.sidebar-section:not(.expanded) .sidebar-section-content {
  content-visibility: hidden;
}
```

Cette règle CSS cache le contenu des sections qui n'ont PAS la classe `expanded`. Mais les composants de section n'ajoutaient pas cette classe à l'élément `<section>`, seulement au toggle (la flèche).

## 🎯 Cause Racine

Dans tous les composants de section, le code était:

```jsx
<section className="sidebar-section">  {/* ❌ Pas de classe expanded */}
  <header>
    <span className={`sidebar-section-toggle ${isExpanded ? 'expanded' : ''}`}>
      ▼
    </span>
  </header>
  {isExpanded && (
    <div className="sidebar-section-content">
      {/* Contenu caché par CSS */}
    </div>
  )}
</section>
```

La classe `expanded` était ajoutée uniquement au toggle, pas à la section elle-même.

## ✅ Solution Appliquée

Modifié tous les composants de section pour ajouter la classe `expanded` à l'élément `<section>`:

```jsx
<section className={`sidebar-section ${isExpanded ? 'expanded' : ''}`}>  {/* ✅ Classe ajoutée */}
  <header>
    <span className={`sidebar-section-toggle ${isExpanded ? 'expanded' : ''}`}>
      ▼
    </span>
  </header>
  {isExpanded && (
    <div className="sidebar-section-content">
      {/* Contenu maintenant visible */}
    </div>
  )}
</section>
```

## 📝 Fichiers Modifiés

1. ✅ `src/components/sidebar/ActionsRapidesSection.jsx`
2. ✅ `src/components/sidebar/AujourdhuiSection.jsx`
3. ✅ `src/components/sidebar/ProgressionGlobaleSection.jsx`
4. ✅ `src/components/sidebar/QuestesJourSection.jsx`
5. ✅ `src/components/sidebar/ActivitePhysiqueSection.jsx`
6. ✅ `src/components/sidebar/LectureSection.jsx`
7. ✅ `src/components/sidebar/FinancesSection.jsx`
8. ✅ `src/components/sidebar/NutritionSection.jsx`

## 🧪 Test

1. Redémarre l'app
2. Ouvre la sidebar
3. Déplie n'importe quel module
4. Le contenu devrait maintenant être visible !

## 📊 Résultat Attendu

Maintenant, quand tu déplis un module:
- La classe `expanded` est ajoutée à `<section>`
- Le CSS ne cache plus le contenu avec `content-visibility: hidden`
- Les données s'affichent correctement

## 🎨 Apparence Visuelle

Tu devrais maintenant voir:

### Actions Rapides
- 8 boutons d'actions visibles

### Aujourd'hui
- 4 cartes avec données (Quêtes, Sport, Lecture, Repas)

### Progression Globale
- 4 métriques (XP, Niveau, Streak, Focus)

### Quêtes du Jour
- Liste des quêtes avec icônes et progression

### Activité Physique
- 4 métriques (Entraînements, Calories, Pas, FC)

### Lecture
- 4 métriques (Livres, Pages, Minutes, Objectif)

### Finances
- 4 métriques (Patrimoine, Budget, Épargne, Investissements)

### Nutrition
- 5 métriques (Calories, Protéines, Glucides, Lipides, Conformité)

## 💡 Explication Technique

Le CSS `content-visibility: hidden` est une optimisation de performance qui cache le contenu des sections non dépliées pour améliorer le rendu. Mais il faut que la classe `expanded` soit présente sur l'élément `<section>` pour que le CSS sache quand afficher le contenu.

Avant:
```css
/* Section sans classe expanded */
.sidebar-section .sidebar-section-content {
  content-visibility: hidden; /* ❌ Toujours caché */
}
```

Après:
```css
/* Section avec classe expanded */
.sidebar-section.expanded .sidebar-section-content {
  content-visibility: visible; /* ✅ Visible quand déplié */
}
```

## 🚀 Prochaines Étapes

1. Teste l'application
2. Vérifie que tous les modules s'affichent correctement
3. Si tu vois encore des problèmes, vérifie la console pour les logs `[useSidebarData]`
