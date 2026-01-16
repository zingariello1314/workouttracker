# Audit Onglet — Dashboard

Périmètre demandé : fichiers **non-.md**, **fonctionnels**, **liés au Dashboard**.
Tests exclus.  
Version audit : basée sur l’état réel des fichiers listés ci-dessous.

## Portée exacte (fichiers analysés)
- `src/components/tabs/DashboardTab.jsx`
- `src/hooks/useDashboard.js`
- `src/components/dashboard/NewsBlock.jsx`
- `src/components/dashboard/NewsCard.jsx`
- `src/components/dashboard/FilterBar.jsx`
- `src/components/dashboard/GlobalXPBar.jsx`
- `src/hooks/useGlobalXP.js`
- `src/services/dashboard/dashboardStorage.js`
- `src/services/news/newsService.js`

## Note globale
**88/100**

Barème (objectif “Silicon Valley”) :
- Performance & optimisation : 35
- Architecture & qualité du code : 25
- Frontend/UX/Accessibilité : 20
- Robustesse & données : 10
- Scalabilité & tests : 10

## Résumé exécutif
Le Dashboard est solide sur la structure globale (hooks dédiés, API encapsulées, séparation UI/service) et l’UX est cohérente. Les pertes principales viennent :
- d’un **mélange de données mock/prod** dans `dashboardStorage`,
- d’un **coût de rendu inutile** sur les listes d’actualités,
- d’une **accessibilité incomplète** (navigation clavier, ARIA),
- d’un **niveau de cache/annulation réseau perfectible**.

Ce document détaille, fichier par fichier, chaque point perdu et la meilleure solution pour viser 100/100.

---

## 1) `DashboardTab.jsx`
### Points forts
- Chargement conditionnel via `useDashboard`, gestion erreur/loader claire.
- UI premium cohérente et lisible, call-to-action “Refresh”.
- Dashboard réduit à des modules simples (GlobalXP + News).

### Points perdus et solutions
- **(−3) Rendu bloquant sur erreur/chargement sans skeleton spécialisé**
  - **Pourquoi** : loader générique pour tout le Dashboard, pas de skeleton dédié aux modules.
  - **Solution** : créer un skeleton Dashboard (GlobalXP + cards vides) pour limiter le CLS et améliorer la perception de performance.

- **(−3) Couplage direct au service d’actualités**
  - **Pourquoi** : le Dashboard dépend fortement du flux news; pas d’isolat par module.
  - **Solution** : isoler la section News dans un conteneur dédié (ex : `NewsBlockContainer`) et laisser `DashboardTab` orchestrer seulement l’assemblage.

- **(−2) Aucune pagination/virtualisation dans la liste News**
  - **Pourquoi** : si `news` augmente, le rendu devient coûteux.
  - **Solution** : pagination avec `pageSize`, ou virtualisation (react-window).

---

## 2) `useDashboard.js`
### Points forts
- Chargement conditionnel de news pour éviter appels API inutiles.
- Gestion d’erreur claire, `useCallback` pour `loadNews`.

### Points perdus et solutions
- **(−4) Déclenchement par événement DOM global**
  - **Pourquoi** : dépendance fragile à un event custom global (`tab-change`).
  - **Solution** : exposer `activeTab` via un contexte global et déclencher `loadAll()` sur ce state.

- **(−3) `shouldLoadNews` est un état mais ne vérifie pas la présence effective du composant**
  - **Pourquoi** : si le hook est monté ailleurs, on peut charger inutilement.
  - **Solution** : passer `activeTab` en paramètre au hook pour réduire la logique interne.

- **(−2) Pas d’annulation de requêtes**
  - **Pourquoi** : si l’utilisateur quitte le Dashboard, la requête continue.
  - **Solution** : utiliser `AbortController` dans `loadNews`.

---

## 3) `NewsBlock.jsx`
### Points forts
- Interface riche et segmentée (tabs, filtres, tri).
- Design cohérent et structure claire.

### Points perdus et solutions
- **(−6) Filtres statiques avec “count” hardcodé**
  - **Pourquoi** : incohérence avec la réalité des données; problème de crédibilité.
  - **Solution** : calculer `count` dynamiquement depuis `news`.

- **(−4) Calculs filtrage/tri dans le render**
  - **Pourquoi** : chaque render recalculera les mêmes tris.
  - **Solution** : `useMemo` basé sur `news`, `filters`, `activeTab`, `sortBy`.

- **(−3) Pas de pagination interne ni lazy list**
  - **Pourquoi** : risque de ralentissement si la liste grossit.
  - **Solution** : pagination ou virtual list.

- **(−2) Pas d’état “empty” spécifique au filtre**
  - **Pourquoi** : UX faible si aucun résultat après filtre.
  - **Solution** : message dédié “Aucun résultat”.

---

## 4) `NewsCard.jsx`
### Points forts
- Badges propres, code lisible.
- Qualité visualisée via barre + icon.

### Points perdus et solutions
- **(−3) Accessibilité : bouton non focusable**
  - **Pourquoi** : container `div` avec `onClick` sans rôle.
  - **Solution** : utiliser `<button>` ou ajouter `role="button"`, `tabIndex=0`, gestion `onKeyDown`.

- **(−2) Aucune gestion des liens externes**
  - **Pourquoi** : `ExternalLink` n’ouvre pas l’URL.
  - **Solution** : `onClick` doit ouvrir `news.url` en `noopener`.

- **(−2) Labels catégories hardcodés**
  - **Pourquoi** : non localisé.
  - **Solution** : passer `t()` via props.

---

## 5) `FilterBar.jsx`
### Points forts
- Multi-select propre, UX claire.
- Badges actifs bien visibles.

### Points perdus et solutions
- **(−4) Accessibilité : dropdown sans gestion clavier**
  - **Pourquoi** : pas de `aria-expanded`, pas de navigation fléchée.
  - **Solution** : ajouter rôles ARIA et gestion keyboard.

- **(−3) `openFilter` global**
  - **Pourquoi** : clic hors zone par overlay, mais pas de fermeture sur `Esc`.
  - **Solution** : ajouter `keydown` pour `Escape`.

---

## 6) `GlobalXPBar.jsx`
### Points forts
- Lecture claire et visuelle de la progression.
- Utilisation de `useGlobalXP` pour centraliser la logique.

### Points perdus et solutions
- **(−4) Couleur dynamique via className string**
  - **Pourquoi** : classe `text-${category.color}-400` non statique → risque purge Tailwind.
  - **Solution** : mapping explicite (`colorMap`) pour classes.

- **(−2) Pas d’état loading**
  - **Pourquoi** : `useGlobalXP` expose `isLoading` mais pas utilisé.
  - **Solution** : skeleton ou placeholder tant que `isLoading`.

---

## 7) `useGlobalXP.js`
### Points forts
- Memoization et cache de signatures.
- Logique centralisée pour toutes les sources XP.

### Points perdus et solutions
- **(−6) Signature par JSON.stringify**
  - **Pourquoi** : coût CPU élevé sur gros objets.
  - **Solution** : hashing stable (ex : murmurhash) ou champs essentiels uniquement.

- **(−3) Double cache (`cacheRef` + `globalXpCache`)**
  - **Pourquoi** : complexité inutile et risque d’état incohérent.
  - **Solution** : un seul cache global + invalidation claire.

- **(−2) `useEffect` dépend de `userId` sans cleanup**
  - **Pourquoi** : changement user peut déclencher sauvegarde croisée.
  - **Solution** : reset state et cancel loads sur changement user.

---

## 8) `dashboardStorage.js`
### Points forts
- Zod schemas, cache TTL, IndexedDB bien structuré.
- APIs dédiées par domaine (quests, sport, reading, etc.).

### Points perdus et solutions
- **(−8) Data mock en production**
  - **Pourquoi** : plusieurs API retournent des mocks par défaut.
  - **Solution** : séparer clairement `mockService` et `productionService`.

- **(−6) Couplage entre domaines**
  - **Pourquoi** : ce fichier gère aussi budget, learning, etc.
  - **Solution** : scinder par domaine (`dashboard/questsStore.js`, `dashboard/readingStore.js`).

- **(−4) Cache global sans éviction fine**
  - **Pourquoi** : TTL global, pas de limite taille.
  - **Solution** : LRU cache avec max size, eviction policy.

- **(−4) Invalidation cache globale sur `add/update`**
  - **Pourquoi** : `clearCache(storeName)` flush total; coût si accès concurrent.
  - **Solution** : invalidation ciblée par clé.

- **(−3) Utilisation de `localStorage` à côté d’IndexedDB**
  - **Pourquoi** : incohérence stockage (missions).
  - **Solution** : centraliser dans IndexedDB ou abstraire via un service unique.

- **(−3) `newsAPI` retourne des mocks sur erreur**
  - **Pourquoi** : risque de masquer bugs et états réels.
  - **Solution** : renvoyer erreur + fallback UI côté `NewsBlock`.

---

## 9) `newsService.js`
### Points forts
- Multi-sources, cache mémoire, rate-limiting par token bucket.
- Mapping des catégories et heuristiques de sentiment.

### Points perdus et solutions
- **(−8) Fichier trop monolithique**
  - **Pourquoi** : complexité élevée, maintenance difficile.
  - **Solution** : découper par provider (`newsapiProvider.js`, `guardianProvider.js`, etc.).

- **(−6) Pas d’annulation de requêtes**
  - **Pourquoi** : fetch sans abort si l’utilisateur quitte.
  - **Solution** : `AbortController` dans les fetchers.

- **(−4) Heuristiques de catégorisation naïves**
  - **Pourquoi** : simples `includes`, erreurs fréquentes.
  - **Solution** : modèle TF-IDF léger ou règles plus robustes.

- **(−3) Cache mémoire non persistant**
  - **Pourquoi** : cache perdu au reload.
  - **Solution** : cache IndexedDB (pour headlines).

- **(−3) Rate limiting dépend de quotas fixés**
  - **Pourquoi** : pas dynamique selon consommation réelle.
  - **Solution** : tracking par compteur + reset journalier.

---

## Actions prioritaires (pour viser 100/100)
1. **Remplacer mocks par vraies sources** et isoler les mocks.
2. **Virtualiser/paginer les actualités**.
3. **Refactor `newsService` en providers**.
4. **Accessibilité complète** (`aria-*`, navigation clavier).
5. **Cache + AbortController** sur chaque requête.

---

## Statut
Onglet Dashboard terminé.  
Je m’arrête ici conformément à ta demande.  
Dis-moi le prochain onglet à auditer, je créerai le fichier suivant dans le même dossier.
