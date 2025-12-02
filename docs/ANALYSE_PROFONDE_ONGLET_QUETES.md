## 1. Objectif stratégique de l’onglet **Quêtes**

L’onglet Quêtes a un rôle très particulier dans l’écosystème de ton app : c’est le **cerveau de planification** de tout le système QuietQuest.  
Toutes les autres vues (Aujourd’hui, Semaine, Stats, Sécurité) sont des projections de ce référentiel unique de quêtes.

- **But fonctionnel**  
  - Centraliser *toutes* les missions / habitudes / objectifs récurrents dans un modèle unique (`allQuests`).
  - Permettre un **design de vie gamifié** : difficulté, durée, XP, récurrence, statut actif/inactif.
  - Servir de base de calcul aux onglets métiers (Today / Week / Stats) via `getQuestsForDate`, `validations`, `dailyPerformances`, `userData`.

- **But UX / produit**  
  - Donner à l’utilisateur la sensation d’avoir un **arsenal de missions parfaitement organisé**.
  - Permettre des manipulations massives (filtres, tri, actions en lot, drag & drop) **sans friction**.
  - Faire sentir que l’onglet est **intelligent** : cohérent avec le reste du site, rapide, prévisible, sans bugs subtils.

Conclusion : l’onglet Quêtes doit être traité comme un **mini‑sous‑produit** dans le produit, avec ses propres exigences de performance, de robustesse et de clarté métier.

---

## 2. État actuel vs. spécification `nouvelongletquêtes.md`

### 2.1. Ce qui est déjà en place (backend logique)

- **Modèle de données**
  - `allQuests` conforme à la spec (id, nom, description, categorie, difficulte, duree, type, jours/date, active, creeLe, ordre).
  - XP des quêtes via `calculateQuestXP` (base par difficulté + durée en heures) respecté.

- **Persistance**
  - `quietquest_quests` entièrement géré (chargement + sauvegarde auto).
  - `quietquest_validations` en place (structure { queteId, date, xpGagne, heureValidation }).
  - `quietquest_user_data` en place, avec progression de niveau simple mais fonctionnelle.
  - `quietquest_daily_performances` calculé et persisté (par date, avec totalQuests, completedQuests, xpTotal, successRate).
  - `quietquest_app_state` déjà utilisé pour sauver filtres + tri de l’onglet Quêtes.
  - Clés meta `quietquest_last_visit` et `quietquest_last_cleanup` implémentées (changement de jour + nettoyage > 1 an).

- **Fonctions cœur QuietQuest**
  - `getQuestsForDate(allQuests, date)` (récurrentes + exceptionnelles, filtrage par jour, tri par `ordre`).
  - `toggleQuestValidation(questId, date)` avec :
    - ajout / retrait validation,
    - mise à jour XP utilisateur,
    - recalcul `dailyPerformances` pour la date.
  - `isQuestCompletedOnDate(questId, date)` utilisé dans Today & Week.

### 2.2. Ce qui est déjà en place (UI et UX)

- **Sous‑navigation interne QuietQuest**
  - Today / Week / Mes quêtes / Stats / Security fonctionnent comme **vues cohérentes** au sein d’un même tab React.

- **Vue "Mes quêtes"**
  - CRUD complet avec popup (création, édition, duplication, suppression).
  - Filtres (catégorie, difficulté, jour, exceptionnelles, inactives).
  - Recherche textuelle (nom, description, catégorie).
  - Tri multi‑colonnes (nom, categorie, difficulte, duree, recurrence, xp).
  - Sélection multiple + actions en lot (activer, désactiver, supprimer).
  - Drag & drop avec recalcul `ordre`.
  - UX globale déjà de niveau "outil expert" (tableau dense mais puissant).

- **Vue "Aujourd’hui"**
  - Calcul dynamique des quêtes du jour via `getQuestsForDate`.
  - Cartes de missions avec nom, catégorie, description, durée, difficulté, XP.
  - Stats du jour (quêtes complétées/total, XP théorique, taux de réussite avec barre).
  - Bouton de validation par carte qui appelle `toggleQuestValidation` et met à jour tout le pipeline (XP + dailyPerformances).

- **Vue "Cette semaine"**
  - Construction d’une semaine (Lundi → Dimanche) centrée sur la date du jour.
  - Colonnes par jour avec :
    - nombre de quêtes,
    - barre de réussite par jour,
    - mini‑liste de quêtes togglables appelant `toggleQuestValidation`.

- **Vue "Statistiques"**
  - XP total gagné (somme des performances quotidiennes).
  - Streak actuel + meilleur streak (jours consécutifs avec successRate > 0).
  - Taux de réussite moyen (barre + pourcentage).

- **Vue "Sécurité"**
  - Export JSON complet (quests + validations + userData + dailyPerformances).
  - Import JSON avec validation minimale et remplacement complet des stores.
  - Reset complet (données QuietQuest + meta‑clés).

### 2.3. Écarts par rapport à la spec initiale

- **Chart.js / graphes avancés**
  - Les graphes promis (XP au fil du temps, répartition par catégories, prédictions) ne sont pas encore concrètement implémentés (pas de Chart.js connecté à `dailyPerformances`).

- **Granularité des stats**
  - Pas encore de filtre d’intervalle (7j, 1 mois, 3 mois, 6 mois, 1 an) sur la vue Stats.
  - Pas de breakdown visuel par catégorie / difficulté.

- **Nettoyage intelligent des quêtes exceptionnelles**
  - Implémenté dans une version simplifiée (suppression des quêtes exceptionnelles passées) sans différencier "complétées" vs "non complétées".

- **Architecture & réutilisabilité**
  - Toute la logique est dans un **seul composant** `QuestsTab.jsx` (fidèle à la spec QuietQuest originale, mais lourd pour ton codebase React/Vite global).
  - Pas encore de décomposition en hooks/utilitaires spécialisés (`useQuietQuestEngine`, `useQuietQuestStats`, etc.).

Globalement : la spec est respectée sur **80–85 %** du scope, avec un fonctionnement complet end‑to‑end. Les points qui manquent pour le niveau "100/100" sont surtout : **graphique et analytics avancés**, **optimisation/perf**, et **architecture modulaire**.

---

## 3. Axes d’amélioration backend (logique & perf)

### 3.1. Extraire un "moteur QuietQuest" réutilisable

**Problème actuel**
- Toute la logique QuietQuest vit dans `QuestsTab.jsx` (états, calculs, persistance).
- Difficulté à réutiliser plus tard depuis d’autres onglets (par exemple un résumé QuietQuest sur la page d’accueil ou dans des notifications).

**Amélioration proposée**
- Créer un module dédié, par exemple :
  - `src/hooks/useQuietQuestEngine.js`  
  - `src/utils/quietQuestStorage.js`

- `useQuietQuestEngine` exposerait :
  - `allQuests`, `validations`, `userData`, `dailyPerformances`.
  - `getQuestsForDate`, `isQuestCompletedOnDate`, `toggleQuestValidation`.
  - `recalcDailyPerformanceForDate`, `getWeekOverview`, `getStatsOverview`.
  - Toute la logique de persistance (localStorage) encapsulée, avec détection de changement de jour et nettoyage.

**Bénéfices**
- **Lisibilité** accrue de `QuestsTab.jsx` (centré sur le rendu).
- Réutilisation possible future dans d’autres vues sans dupliquer la logique.
- Meilleure testabilité unitaire (tests ciblés sur le hook/util).

---

### 3.2. Optimiser les recalculs (memo, structures de données)

**Problème actuel**
- `filteredAndSortedQuests` refait un `map + filter + sort` complet à chaque changement de filtre/tri/recherche ou de `allQuests`.
- Les fonctions liées aux validations (`toggleQuestValidation`, `recalcDailyPerformanceForDate`) font des `filter`/`some` sur les tableaux complets.

**Améliorations**

- **Indexation légère des validations**
  - Maintenir en mémoire une Map indexée par `date` :
    - `validationsByDate = useMemo(() => groupBy(validations, v => v.date), [validations])`.
  - `isQuestCompletedOnDate` devient O(1 + petite longueur) au lieu d’un `some` sur tout le tableau.
  - `recalcDailyPerformanceForDate` lit `validationsByDate[date]` directement.

- **Pré‑calcul des XP par quête**
  - Ajouter un champ dérivé `xp` au modèle de quête lors de la création/édition :
    - éviter de recalculer `calculateQuestXP(quest)` en boucle sur le même objet.
  - Maintenir la cohérence : recalculer `xp` seulement quand on change `difficulte` ou `duree`.

- **Mémoïsation de `getQuestsForDate`**
  - Comme les quêtes et les jours changent peu souvent, créer un petit cache LRU :
    - clé : `${date}:${hash(allQuestsVersion)}`.
  - Invalider le cache dès que `allQuests` change (en incrémentant un `version`).

**Résultat attendu**
- Vue Today et Week beaucoup plus fluide quand le nombre de quêtes devient important (100+).
- Moins de recalculs inutiles à chaque re‑render React.

---

### 3.3. Politique d’expiration et robustesse du stockage

**Améliorations possibles**

- **Versionnage de `quietquest_app_state`**
  - Ajouter un champ `version` dans l’objet sauvegardé pour gérer les migrations plus facilement (éviter des erreurs si la structure change).

- **Limitation de la taille de l’historique**
  - En plus de l’année glissante, prévoir une **limite absolue** en nombre d’entrées (ex. max 366 `dailyPerformances` + 5000 validations).
  - Si dépassé, purger les plus anciennes (garantie de perf sur le long terme).

---

## 4. Axes d’amélioration frontend (UX, UI, interactivité)

### 4.1. Vue "Mes quêtes" – ergonomie & lisibilité

**Idées d’amélioration**

- **Regroupement visuel par catégorie**
  - Ajouter un mode "groupé par catégorie" (toggle) : les quêtes s’affichent par blocs avec header par catégorie.
  - Permet un scan visuel plus rapide qu’un tableau plat quand le nombre de quêtes augmente.

- **Résumé en haut de la vue**
  - Bandeau de KPI :
    - nombre total de quêtes,
    - quêtes actives vs inactives,
    - XP théorique total par jour/semaine.

- **Feedback instantané**
  - Snackbars / mini‑toasts (déjà présents via `ToastProvider`) pour :
    - création/édition de quête,
    - duplication,
    - actions en lot (ex. "5 quêtes activées").

### 4.2. Vue "Aujourd’hui" – gamification et micro‑interactions

- **Micro‑animations**
  - Ajouter des transitions de type `scale/opacity` sur les cartes lors de la validation.
  - Utiliser des badges (ex. "Priorité", "Rapide", "Long terme") si on enrichit le modèle plus tard.

- **Tri intelligent**
  - Ordre par défaut :
    - quêtes exceptionnelles du jour en haut,
    - puis quêtes récurrentes triées par difficulté décroissante ou par XP décroissant.

### 4.3. Vue "Cette semaine" – densité d’information contrôlée

- **Affichage progressif**
  - Bouton "afficher tout" dans chaque colonne si > 6 quêtes, pour éviter le scroll vertical trop chargé.
  - Indicateur "… +X autres" sous la liste.

- **Code couleur**
  - Bordure verte pour les jours avec 100 % de réussite, orange pour 50–99 %, rouge < 50 %.

### 4.4. Vue "Statistiques" – graphiques et analyses avancées

**Implémentation step‑by‑step (sans exploser la perf)**

- **Étape 1 – Graphique XP dans le temps (Recharts)**
  - Utiliser `Recharts` (déjà utilisé ailleurs dans le projet plutôt que Chart.js).
  - Ligne XP/jour basée sur `dailyPerformances`.
  - Filtre de période (7j, 30j, 90j, 180j, 365j) appliqué côté JS avant de passer les données au graphe.

- **Étape 2 – Répartition par catégorie**
  - Construire une map { categorie → total XP / nombre de validations }.
  - Afficher en bar chart horizontal ou pie chart selon ce qui s’intègre le mieux à l’existant.

- **Étape 3 – Intelligence minimale**
  - Dégager 2–3 insights textuels calculés :
    - "Ta catégorie la plus régulière est X avec Y% de réussite."
    - "Tu gagnes en moyenne Z XP par jour où tu valides au moins une quête."

### 4.5. Vue "Sécurité" – clarté et prévention des erreurs

- **Pré‑visualisation avant import**
  - Afficher un petit résumé du fichier (nombre de quêtes, dates min/max des validations) avant de confirmer l’overwrite.

- **Sauvegarde locale rapide**
  - Bouton "Sauvegarder maintenant" qui ne fait qu’un `localStorage` flush (déjà automatique, mais rassurant pour l’utilisateur).

---

## 5. Critères objectifs pour un onglet noté 100/100

### 5.1. Performance
- Temps de rendu initial de l’onglet Quêtes < **50 ms** sur une machine moyenne (hors réseau).
- Interaction `toggleQuestValidation` → mise à jour UI < **16 ms** (1 frame).
- Pas de blocage même avec **200+ quêtes** et **1000+ validations** (grâce au memo et aux index).

### 5.2. Robustesse
- Aucune corruption possible des données si :
  - le JSON importé est invalide (fallback + message d’erreur clair).
  - le `localStorage` atteint ses limites (échec silencieux sans casser l’UI).
- Tests unitaires sur :
  - `calculateQuestXP`,
  - `getQuestsForDate`,
  - `toggleQuestValidation`,
  - calcul des streaks.

### 5.3. UX / UI
- Layout sans scroll horizontal, lisible aussi sur petits écrans.
- Toutes les actions critiques demandent une confirmation explicite (supprimer en lot, reset, import overwrite).
- Feedback visuel systématique sur les actions (valider, sauvegarder, importer, reset).

### 5.4. Architecture
- Logique métier isolée dans 1–2 hooks/utilitaires dédiés.
- Composants UI découplés :
  - `QuestsTable`,
  - `TodayView`,
  - `WeekView`,
  - `StatsView`,
  - `SecurityView`.
- Chaque composant reste < ~300 lignes de code pour rester maintenable.

---

## 6. Plan d’implémentation pour atteindre l’excellence

### Phase 1 – Refactor logique (backend dans le front)
1. Créer `useQuietQuestEngine` dans `src/hooks/useQuietQuestEngine.js` :
   - Y déplacer toute la logique liée à `allQuests`, `validations`, `userData`, `dailyPerformances`, `toggleQuestValidation`, `getQuestsForDate`, `recalcDailyPerformanceForDate`, maintenance `lastVisit/lastCleanup`.
   - Exposer une API propre pour les vues.
2. Adapter `QuestsTab.jsx` pour consommer ce hook et alléger au maximum le composant.

### Phase 2 – Optimisation perfs
3. Introduire `validationsByDate` (computed) pour accélérer `isQuestCompletedOnDate` et les calculs hebdo.
4. Ajouter un champ `xp` dérivé au modèle de quête et réutiliser partout au lieu de recalculer.
5. Ajouter un petit cache mémo sur `getQuestsForDate`.

### Phase 3 – Refactor UI en sous‑composants
6. Créer des composants dédiés dans `src/components/quests/` :
   - `QuestsTodayView.jsx`
   - `QuestsWeekView.jsx`
   - `QuestsTableView.jsx`
   - `QuestsStatsView.jsx`
   - `QuestsSecurityView.jsx`
7. Déplacer le markup actuel de `QuestsTab.jsx` vers ces composants, en ne laissant dans `QuestsTab` que la nav interne + le router de sous‑vues.

### Phase 4 – Graphiques & analyses avancées
8. Ajouter un graphe **XP dans le temps** en utilisant Recharts + un wrapper `LazyChart` (déjà existant) pour éviter le rendu hors viewport.
9. Ajouter un graphe **répartition par catégorie / difficulté**.
10. Ajouter 2–3 insights textuels dérivés des stats (catégorie la plus forte, jour le plus régulier, etc.).

### Phase 5 – Finitions UX / garde‑fous
11. Améliorer les dialogues de confirmation (copy claire, conséquences explicites).
12. Ajouter des toasts pour toutes les actions importantes.
13. Rendre responsive proprement la vue Today/Week (breakpoints bien testés).

Une fois ces 5 phases réalisées, l’onglet Quêtes sera au niveau que tu vises : **architecture propre, perfs maîtrisées, UX fluide et logique métier riche**, digne d’un projet construit par une équipe d’étudiants élite.  


