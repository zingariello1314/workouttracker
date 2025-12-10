# Guide de Résolution: Modules Sidebar Vides

## 🎯 Problème

Les modules de la sidebar (Actions Rapides, Aujourd'hui, Progression Globale, etc.) apparaissent vides même quand tu les déplis.

## ✅ Solution Appliquée

J'ai corrigé le hook `useSidebarData` pour qu'il retourne toujours des valeurs par défaut valides, même si les données ne sont pas encore chargées.

## 🧪 Comment Tester

### 1. Redémarre l'Application

```bash
npm run dev
```

### 2. Ouvre la Console du Navigateur

- Appuie sur `F12`
- Va dans l'onglet "Console"
- Cherche les logs `[useSidebarData]`

Tu devrais voir quelque chose comme:

```
[useSidebarData] État des données: {
  isAuthenticated: true,
  isLoading: false,
  metrics: { xp: 0, level: 1, streak: 0, focus: 0 },
  questsCount: 0,
  sport: { weeklyWorkouts: 0, todayCalories: 0, ... },
  ...
}
```

### 3. Vérifie les Modules

Ouvre la sidebar et déplie chaque module. Tu devrais maintenant voir:

#### ⚡ Actions Rapides
- 8 boutons cliquables:
  - 🎯 Focus 25min
  - 📖 Lire +Pages
  - 💪 Sport
  - ✅ Quêtes
  - 💰 +Revenu
  - 📊 +Dépense
  - 🍽️ +Repas
  - ⚙️ Réglages

#### 📅 Aujourd'hui
- 4 cartes avec données:
  - ✅ Quêtes: 0/0
  - 💪 Sport: À faire
  - 📖 Lecture: 0 pages
  - 🍽️ Repas: 0/3

#### 📊 Progression Globale
- 4 métriques:
  - ⭐ XP Total: 0
  - 🎖️ Niveau: 1
  - 🔥 Jours: 0
  - ⚡ Focus: 0%

#### 🎯 Quêtes du Jour
- Liste vide (ou tes quêtes si tu en as)

#### 💪 Activité Physique
- 4 métriques:
  - Entraînements: 0
  - Calories: 0 kcal
  - Pas: 0
  - FC: 72 bpm

#### 📖 Lecture
- 4 métriques:
  - Livres: 0
  - Pages: 0
  - Minutes: 0
  - Objectif: 30 min

#### 💰 Finances
- 4 métriques:
  - Patrimoine: 0 €
  - Budget: 0 €
  - Épargne: 0 €
  - Investissements: 0 €

#### 🍽️ Nutrition
- 5 métriques:
  - Calories: 0 kcal
  - Protéines: 0 g
  - Glucides: 0 g
  - Lipides: 0 g
  - Conformité: 0%

## 🔍 Si les Modules Sont Toujours Vides

### Étape 1: Vérifie l'Authentification

Dans la console du navigateur:

```javascript
localStorage.getItem('auth_token')
```

Si c'est `null`, tu n'es pas authentifié. Connecte-toi d'abord.

### Étape 2: Vérifie les Données QuietQuest

```javascript
localStorage.getItem('quietquest_userData')
```

Si c'est `null`, tu n'as pas encore de données QuietQuest. Crée quelques quêtes pour initialiser.

### Étape 3: Vérifie les Données Books

```javascript
localStorage.getItem('booksData')
```

Si c'est `null`, tu n'as pas encore de livres. Ajoute un livre pour initialiser.

### Étape 4: Vérifie IndexedDB

1. Ouvre les DevTools (F12)
2. Va dans l'onglet "Application"
3. Dans le menu de gauche, clique sur "Storage" > "IndexedDB"
4. Vérifie que tu as:
   - `garmin-data` (pour les données Garmin)
   - `nutrition-data` (pour les données nutrition)

Si ces bases n'existent pas, c'est normal si tu n'as pas encore utilisé ces fonctionnalités.

## 🎨 Apparence Attendue

Même avec des valeurs à 0, les modules devraient maintenant afficher:
- ✅ Les icônes colorées
- ✅ Les labels descriptifs
- ✅ Les valeurs (même si 0)
- ✅ Les hints de navigation au survol (ex: "Voir quêtes", "Voir activité")

## 🚀 Ajouter des Données Réelles

Pour voir les modules se remplir avec de vraies données:

1. **Quêtes**: Va dans l'onglet Quêtes et crée quelques quêtes
2. **Sport**: Va dans l'onglet Sport et ajoute un entraînement
3. **Lecture**: Va dans l'onglet Livres et ajoute un livre + des pages lues
4. **Nutrition**: Va dans l'onglet Nutrition et ajoute un repas
5. **Finances**: Va dans l'onglet Finance et configure ton budget

Les modules de la sidebar se mettront à jour automatiquement grâce aux événements.

## 📝 Fichiers Modifiés

- ✅ `src/hooks/useSidebarData.js` - Valeurs par défaut robustes
- ✅ `debug_sidebar_modules.js` - Script de diagnostic

## 💡 Astuce

Si tu veux tester avec des données mockées, tu peux temporairement modifier `useSidebarData.js` pour retourner des valeurs hardcodées au lieu des valeurs réelles.

## ❓ Besoin d'Aide ?

Si les modules sont toujours vides après ces étapes:
1. Partage les logs de la console
2. Partage le contenu de `localStorage.getItem('quietquest_userData')`
3. Partage une capture d'écran de la sidebar
