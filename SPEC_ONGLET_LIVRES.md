## Spécification optimisée – Onglet Livres (version 100/100)

Ce document décrit, de manière indépendante et synthétique, la **meilleure version possible** de l’onglet Livres dans l’application Workout Tracker, en visant une note **100/100** sur :

- **Performance** (rapidité, faible consommation mémoire, I/O minimales),
- **Intelligence** (modèle de données, export/import, statistiques, extensibilité),
- **Logique / architecture** (séparation des responsabilités, testabilité, compatibilité),
- **Interactivité / visuel** (UX fluide, agréable, moderne).

Il s’appuie sur le fichier `nouvelongletlivres.md` comme source détaillée, mais reste autonome pour guider les décisions d’implémentation.

---

## 1. État des lieux actuel (point de départ)

### 1.1 Fonctionnalités déjà en place

- **Onglet `Livres` intégré dans l’app React :**
  - Présent dans :
    - la barre de navigation principale (via `Navigation.jsx` et `nav.books`),
    - la barre de boutons de la page d’accueil (`HomePage.jsx`),
    - le routeur d’onglets (`App.jsx`, `activeTab === 'books'`).
  - Composant principal : `BooksTab.jsx`.

- **UI actuelle de `BooksTab` :**
  - Bloc d’en-tête avec titre, icône et sous-titre expliquant que tout est stocké localement.
  - **Formulaire de livre** (création/édition) comprenant :
    - Titre, auteur, année, nombre de pages,
    - Statut (en cours / terminé),
    - Note personnelle (0–5),
    - Notes / résumé court.
  - **Carrousels horizontaux** (scroll simple) :
    - Livres en cours (`status === 'in-progress'`),
    - Livres terminés (`status === 'completed'`),
    - avec surlignage du livre sélectionné.
  - **Panneau de détail** du livre sélectionné :
    - métadonnées (auteur, année, pages, notes),
    - statistiques simples : temps total de lecture, pages lues au total, nombre de sessions,
    - liste des sessions de lecture (date, durée, pages lues, note),
    - formulaire d’ajout de session (date, durée, pages, note).
  - **Actions d’export/import dédiées** :
    - Export JSON des livres (bouton “Exporter JSON”),
    - Import JSON depuis un fichier (bouton “Importer JSON”).

- **Modèle de données côté UI :**
  - `books: Book[]` dans l’état local du composant.
  - `selectedBookId: string | null`.
  - `form` (livre courant) :
    - `id`, `title`, `author`, `year`, `pages`, `status`, `personalScore`, `notes`.
  - `sessionForm` (session de lecture) :
    - `date`, `durationMinutes`, `pagesRead`, `note`.
  - Chaque `Book` embarque `readingSessions: ReadingSession[]`, avec :
    - `id`, `date`, `durationMinutes`, `pagesRead`, `note`.

### 1.2 Persistance et données

- **LocalStorage (implémenté) :**
  - Module `booksStorage.js` :
    - `loadBooks()` lit depuis la clé `momentum_books` et normalise les sessions.
    - `saveBooks(books)` sérialise un tableau de livres en JSON, en évitant certains champs volatils.
    - `exportBooks(books)` génère un fichier JSON avec :
      - `version`,
      - `exportedAt`,
      - `books: [...]`.
    - `importBooksFromFile(file)` lit un fichier JSON, parse et renvoie un tableau de livres.
  - Les livres sont pour l’instant **totalement indépendants** du reste des données (Workout, Nutrition, Garmin).

- **IndexedDB (préparé, non encore branché) :**
  - Module `booksIndexedDB.js` :
    - Réutilise la base `WorkoutTrackerDB` existante.
    - Crée un store `books` (clé primaire `id`) et un index `status`.
    - `openBooksDB()` gère les cas de `VersionError` en s’inspirant de `useWorkoutData.openDB`.
    - `getAllBooksFromIndexedDB()` et `saveBooksToIndexedDB(books)` offrent une API minimale, robuste,
      mais pour l’instant **non utilisée** par la UI.

- **i18n (terminé pour Livres) :**
  - Namespace `books` avec fichiers :
    - `src/utils/translations/fr/books.json`,
    - `src/utils/translations/en/books.json`.
  - Fallback complet dans `translations.js` (ancien système) pour toutes les clés `books.*`,
    ce qui évite les warnings du validateur et garantit un comportement correct même en cas de
    problème de chargement des namespaces.

### 1.3 Limites identifiées

- **Performance :**
  - Sauvegarde `saveBooks(books)` à chaque changement de `books`, sans debounce avancé.
  - Absence de séparation stricte entre :
    - état en mémoire (React),
    - localStorage,
    - IndexedDB (API prête mais non utilisée).
  - Carrousels simples sans virtualisation : suffisant pour un nombre modéré de livres, mais pas encore optimisé pour des bibliothèques massives.

- **Intelligence / export :**
  - Export JSON Livres rudimentaire :
    - peu de métadonnées,
    - pas de versioning structuré avec migration,
    - pas d’intégration à l’export global dans les paramètres (`SettingsTab.exportAllData`).

- **Stack avancée manquante (par rapport à la version Vue documentée) :**
  - Pas encore de gestion de PDFs en IndexedDB,
  - Pas de stockage / optimisation des couvertures en IndexedDB,
  - Pas de système de sauvegarde avancé multi‑formats (JSON/CSV/XML/ZIP simulé),
  - Pas de vue sphérique 3D (DomeGallery) intégrée,
  - Pas de couche d’intégrité/réparation dédiée pour Livres.

En résumé, l’onglet Livres actuel est **sain, simple et robuste**, mais reste une V1 :
il couvre le “minimum fonctionnel” avec une bonne UX de base, tout en étant loin du potentiel
maximal décrit dans la documentation Vue et dans les plans de sauvegarde avancée.

---

## 2. Vision cible – Onglet Livres « 100/100 »

L’onglet Livres visé doit être :

- **Performant** :
  - Supporter sans broncher plusieurs milliers de livres et de sessions.
  - Réduire au minimum les I/O :
    - regroupement des écritures IndexedDB,
    - utilisation raisonnable de localStorage (backup léger),
    - aucun recalcul inutile côté UI.
  - Export/import qui ne bloquent pas le main thread (par taille et par structure).

- **Intelligent** :
  - Modèle de données extensible :
    - livres avec tags, genres, langue, séries, champs IA (scores, embeddings…),
    - sessions enrichies (périodes de la journée, device de lecture, etc.) si besoin.
  - Système de sauvegarde avancé :
    - versioning explicite du format d’export,
    - validation et migration automatiques des anciens formats,
    - métadonnées détaillées (volume de données, plage de dates, répartition des statuts).
  - Intégration propre avec :
    - le **contexte global** (pour éventuellement croiser Livres avec d’autres données),
    - l’export/import global des paramètres.

- **Architecturalement propre** :
  - `BooksTab` reste focalisé sur l’UI :
    - ne parle qu’en termes de `books`, `onAddBook`, `onUpdateBook`, `onDeleteBook`, `onAddSession`…
  - Une couche `BooksStorageLayer` orchestre **mémoire / IndexedDB / localStorage**.
  - Un `BooksRepository` se charge des détails IndexedDB (transactions, indexes, gestion d’erreurs).
  - Un module `booksExportImport` centralise tout ce qui touche aux échanges de données (fichiers).

- **Très agréable à utiliser** :
  - carrousels fluides, navigation au clavier, filtres et tri intuitifs,
  - messages clairs (toasts / alertes) en cas d’erreurs d’import/export,
  - possibilité d’activer des vues avancées (sphère 3D, statistiques détaillées) sans pénaliser les
    utilisateurs qui ne les utilisent pas (chargement lazy).

---

## 3. Design optimisé – Architecture cible

### 3.1 Repository IndexedDB – `BooksRepository`

Objectif : isoler **toute** la logique IndexedDB dans une classe ou un module dédié, inspiré de
`IndexedDBRepository` côté Nutrition.

- **Responsabilités :**
  - Ouverture de la base `WorkoutTrackerDB` avec gestion de `VersionError`.
  - Garantie de l’existence du store `books` (+ éventuels stores futurs : `bookPdfFiles`, `bookImages`).
  - API de base :
    - `getAllBooks() : Promise<Book[]>`,
    - `getBookById(id) : Promise<Book | null>`,
    - `upsertBook(book) : Promise<void>`,
    - `deleteBook(id) : Promise<void>`,
    - `replaceAllBooks(books) : Promise<void>` (pour les imports complets).
  - Gestion des erreurs :
    - log clair en cas d’exception IndexedDB,
    - recovery minimal (cf. stratégie de `useWorkoutData`),
    - retour de valeurs sûres (listes vides, `null`) plutôt que throw dans la plupart des cas.

- **Schéma pensé pour la performance :**
  - Un store `books` unique, avec `readingSessions` intégrées, pour limiter le nombre de transactions
    et simplifier les requêtes.
  - Indexes additionnels **réfléchis** :
    - `status` (pour séparer en cours / terminé),
    - `createdAt` (pour tri par date d’ajout),
    - éventuellement `updatedAt` pour diagnostics / nettoyage.
  - Keep it simple : pas d’index exotique tant que le besoin n’est pas avéré.

### 3.2 Couche d’orchestration – `BooksStorageLayer`

Objectif : fournir à `BooksTab` une API **simple, performante et stable**, tout en gérant la
complexité de la persistance et de l’import/export.

- **Forme possible :**
  - Un hook `useBooksStorage()` ou un module avec un mini-contexte dédié.

- **API exposée à la UI :**
  - `books` (liste de livres)
  - `selectedBookId`, `setSelectedBookId`
  - Actions :
    - `addOrUpdateBook(partialForm)`,
    - `deleteBook(id)`,
    - `addReadingSession(bookId, sessionData)`,
    - (plus tard) `updateReadingSession`, `deleteReadingSession`.

- **Interne :**
  - Chargement initial :
    - tenter d’abord `BooksRepository.getAllBooks()` (IndexedDB),
    - si échec → tenter `booksStorage.loadBooks()` (localStorage),
    - sinon → état vide.
  - Sauvegardes :
    - gestion d’un état interne `books`,
    - `useEffect` ou callback dédié avec :
      - comparaison `JSON.stringify` ou hash léger pour éviter de sauvegarder sans changement,
      - **debounce** (ex. 500–1000 ms) avant d’appeler :
        - `BooksRepository.replaceAllBooks(books)` (IndexedDB),
        - `booksStorage.saveBooks(books)` (backup localStorage).
  - Import/Export :
    - profil “Livres uniquement” :
      - export : `prepareBooksExportData(books, options)` → téléchargement JSON,
      - import : fichier JSON → `processBooksImportData` → mise à jour de `books` + persistance.
    - profil “Global” (via SettingsTab) :
      - intégration future, en réutilisant la même logique interne.

### 3.3 Module d’export/import avancé – `booksExportImport.js`

Objectif : disposer d’un système d’export/import de niveau professionnel, inspiré de
`BodyTrackingExportImport`.

- **Principales fonctions :**
  - `prepareBooksExportData(books, options)` :
    - `options` (exemples) :
      - `includeSessions` (bool),
      - `includeMetadata` (bool),
      - `format: 'json'` (future extension possible).
    - Produit un objet avec :
      - `version: BOOKS_EXPORT_VERSION`,
      - `exportDate`,
      - `exportType: 'Books Data'`,
      - `appName: 'Workout Tracker - Livres'`,
      - `data: { books: [...] }`,
      - `metadata: { ... }` :
        - nombre total de livres,
        - nombre total de sessions,
        - distribution par statut,
        - plage de dates couverte,
        - taille estimée (en caractères / ko).
  - `validateBooksData(data)` :
    - Vérifie structure, types, champs obligatoires.
    - Retourne `{ valid, errors[], warnings[], stats }`.
  - `migrateBooksImportData(importedData)` :
    - Gère la mise à niveau des anciens formats vers le format actuel.
    - Normalise les dates, les champs absents, etc.
  - `processBooksImportData(importedData, options)` :
    - Parse JSON si besoin,
    - Valide la version,
    - Applique `migrateBooksImportData`,
    - Fait appel à `validateBooksData`,
    - Retourne un objet final prêt à être persistant.

### 3.4 Intégration dans les paramètres (export/import global)

Objectif : faire en sorte que l’onglet Livres **bénéficie** du système de sauvegarde global,
sans le fragiliser.

- **Export global (`SettingsTab.exportAllData`) :**
  - Ajouter un champ `booksData` :
    - obtenu via `BooksStorageLayer` (qui lit depuis IndexedDB / localStorage),
    - sous la forme du format d’export Livres (ou un sous‑ensemble adapté).
  - Enrichir les métadonnées globales avec des infos Livres :
    - `totalBooks`, `totalBookSessions`, plage de dates Livres, etc.

- **Import global :**
  - Facultatif au début (on peut commencer par l’export seulement),
  - Quand implanté :
    - détecter la présence de `booksData`,
    - passer par `processBooksImportData`,
    - insérer le résultat dans `BooksRepository` et actualiser la mémoire via `BooksStorageLayer`.

---

## 4. UX / UI – rendre l’idée de base exceptionnelle

### 4.1 Carrousels et listes

- **Carrousels actuels** :
  - Déjà corrects pour quelques dizaines de livres.
- **Améliorations possibles à viser méthodiquement :**
  - Windowing simple (par ex. n’afficher que 10–20 cartes visibles à la fois).
  - Raccourcis clavier (←/→) pour naviguer dans les livres en cours / terminés.
  - Indicateurs discrets (nombre de livres, pagination).

### 4.2 Détail d’un livre et sessions

- Conserver la vue détaillée actuelle, mais :
  - ajouter des **petites métriques intelligentes** :
    - temps moyen par session,
    - pages moyennes par session,
    - estimation de temps restant (si nombre de pages renseigné).
  - toujours calculées **côté client** sur la base des sessions, sans surcharger la persistance.

### 4.3 Vue 3D (future, mais prévue)

- Introduire une vue 3D type “sphère de couvertures” :
  - **composant séparé** (ex. `BooksDomeGallery`) chargé en lazy.
  - API minimaliste :
    - props : `books`, `onBookOpen(book)`.
  - Contrôles :
    - drag horizontal,
    - inertie,
    - zoom sur une couverture au clic.
- **Performance** :
  - Aucun calcul lourd en continu (limiter les animations à ce qui est nécessaire),
  - possibilité de désactiver la vue 3D sur machines modestes via un paramètre de configuration
    ou une option dans les paramètres utilisateurs.

---

## 5. Plan d’action résumé (ce qu’il reste à faire)

1. **Stabiliser et brancher `BooksStorageLayer`** :
   - Définir l’API finale dans ce document,
   - Implémenter la couche avec usage contrôlé d’IndexedDB + localStorage,
   - Remplacer, dans `BooksTab`, l’usage direct de `booksStorage` par cette couche.

2. **Créer `booksExportImport.js`** :
   - Implémenter `prepareBooksExportData`, `validateBooksData`, `migrateBooksImportData`,
     `processBooksImportData`.
   - Brancher ces fonctions sur les boutons Export/Import de `BooksTab`.

3. **Intégrer Livres dans l’export global (`SettingsTab`)** :
   - Ajouter un bloc `booksData` dans la structure d’export,
   - (Optionnel dans un second temps) gérer l’import complet avec Livres.

4. **Améliorer progressivement l’UX** :
   - Windowing / pagination dans les carrousels,
   - raccourcis clavier,
   - petit panneau de stats avancées dans le détail du livre.

5. **Préparer l’arrivée de la 3D et des assets lourds (PDFs, couvertures)** :
   - Définir très précisément les stores supplémentaires (`bookPdfFiles`, `bookImages`) dans un
     futur document,
   - concevoir la stratégie d’optimisation des images (redimensionnement, compression),
   - intégrer une vue 3D optionnelle.

Ce plan est volontairement progressif : à chaque étape, on vise un gain concret en
performance / intelligence / UX, tout en gardant l’application stable et en évitant
tout surmenage du navigateur.

---

## 6. Stratégie de performance et de robustesse (détails de bas niveau)

Cette section précise **comment** implémenter chaque brique pour rester dans une zone de
performance et de robustesse optimale, même sur des machines modestes (portables, mobiles).

### 6.1 Budgets et contraintes

- **Taille de bibliothèque cible** :
  - Doit rester fluide pour :
    - ~1 000 livres + quelques dizaines de sessions chacun (scénario “power user”),
    - tout en restant confortable pour 10–100 livres (cas le plus courant).
- **Budget de persistance** :
  - Écritures IndexedDB :
    - pas plus d’une écriture groupée toutes les 500–1 000 ms lors d’une phase d’édition active,
    - écriture immédiate seulement lors d’actions “critiques” (import, reset complet, etc.).
  - Écritures localStorage :
    - considérées comme **backup léger**,
    - même cadence que IndexedDB, mais avec possibilité de réduire la fréquence si besoin.
- **CPU / main thread** :
  - Pas de `JSON.stringify` gigantesques dans des boucles serrées sans debounce,
  - pas de tri / filtrage complet sur chaque frappe si la bibliothèque devient énorme :
    - filtrer en mémoire avec throttling,
    - limiter les recomputations via `useMemo` bien ciblés.

### 6.2 Stratégie de sauvegarde (autoSave Livres)

Inspirée de `useWorkoutData.autoSave`, avec adaptation au contexte Livres :

- **Principe** :
  - toute modification de `books` passe par une fonction centrale (ex. `updateBooks(nextBooks)`),
  - cette fonction :
    - met à jour l’état React,
    - planifie une sauvegarde via un timer de debounce.

- **Algorithme recommandé** :
  1. Comparer l’ancienne et la nouvelle valeur :
     - calculer un hash léger (par ex. hash CRC32 sur `JSON.stringify` tronqué ou sur une version compressée),
     - si hash identique → ne rien faire.
  2. Si différent, démarrer / réarmer un **timer de 800–1 000 ms**.
  3. À l’expiration du timer :
     - appeler `BooksRepository.replaceAllBooks(books)` (IndexedDB),
     - puis `booksStorage.saveBooks(books)` (localStorage),
     - loguer en debug le temps pris (optionnel en dev).

- **Erreurs** :
  - Toute erreur IndexedDB :
    - est loguée,
    - mais n’empêche pas :
      - la sauvegarde localStorage,
      - la continuité de l’usage de l’onglet.
  - En dernier recours :
    - l’utilisateur ne perd pas son état en mémoire tant qu’il reste sur la page.

### 6.3 Stratégie de chargement (boot de l’onglet)

- **Étapes** :
  1. `BooksStorageLayer` tente de charger les livres depuis IndexedDB :
     - timeout raisonnable (par ex. 2–3 secondes en dev, plus permissif en prod),
     - si succès → hydrate l’état avec ces données.
  2. Si IndexedDB indisponible ou corrompu :
     - tenter `booksStorage.loadBooks()` depuis localStorage,
     - si succès → hydrater avec ces données.
  3. Sinon :
     - démarrer avec une liste vide,
     - laisser l’utilisateur reconstruire sa bibliothèque (ou importer un JSON).

- **Affichage** :
  - pendant le chargement initial :
    - montrer un état “chargement Livres” discret dans `BooksTab`,
    - ne pas bloquer l’ensemble de l’app (les autres onglets doivent rester utilisables).

### 6.4 Optimisation de l’UI (carrousels, filtres, tri)

- **Carrousels** :
  - pour garder du confort :
    - limiter la largeur des cartes,
    - permettre un scroll horizontal naturel (avec inertie du navigateur),
    - utiliser `overflow-x-auto` + `flex` (déjà le cas).
  - Pour la montée en charge :
    - ne rendre que les X premières cartes en mode “compact”,
    - offrir un bouton “Tout afficher” qui bascule vers une vue liste paginée si besoin.

- **Recherche / filtrage** :
  - Actuellement : filtrage texte simple (titre + auteur).
  - Amélioration :
    - `useMemo` avec dépendances `[books, search]`,
    - éventuellement throttle de la recherche si la bibliothèque est très grande.

---

## 7. Qualité, tests et surveillance

Pour un onglet noté “100/100”, la qualité ne doit pas être un afterthought, mais une partie du design.

### 7.1 Tests unitaires et d’intégration

- **Tests unitaires** :
  - `BooksRepository` :
    - création/lecture/mise à jour/suppression de livres,
    - comportement en cas de base vide / non disponible.
  - `booksExportImport` :
    - validation de données valides / invalides,
    - migration de versions anciennes,
    - cohérence des métadonnées.
  - `BooksStorageLayer` :
    - comportement de chargement avec différents scénarios (IndexedDB OK, fallback localStorage, aucun).

- **Tests d’intégration UI** :
  - Scénarios :
    - ajout/édition/suppression d’un livre,
    - ajout de sessions,
    - export puis import du même fichier (round trip),
    - bascule entre onglets puis retour à Livres (état persistant).

### 7.2 Monitoring en développement

- Logs :
  - utiliser le logger existant pour :
    - signaler les erreurs IndexedDB,
    - mesurer grossièrement la taille des exports,
    - détecter les cas où la bibliothèque dépasse certains seuils (par ex. > 1 000 livres).
  - toujours garder un niveau de log `debug` pour la mise au point, mais discret en production.

### 7.3 Stratégie de migration

- Dès qu’un nouveau champ “important” est ajouté :
  - mettre à jour :
    - le schéma de référence dans cette spec,
    - `BOOKS_EXPORT_VERSION`,
    - `migrateBooksImportData` pour assurer la compatibilité avec les anciennes sauvegardes.
  - s’assurer que :
    - les anciens fichiers d’export restent importables,
    - les nouveaux fichiers contiennent les nouvelles infos de manière cohérente,
    - rien ne casse silencieusement.

---

Ce document (`SPEC_ONGLET_LIVRES.md`) peut maintenant servir de **référence centrale** pour guider
toutes les implémentations futures de l’onglet Livres : chaque nouvelle fonctionnalité ou
optimisation devra se positionner par rapport à ces principes (performance, intelligence, logique,
UX) avant d’être codée.

---

## 8. Suivi de mise en œuvre concrète (check‑list vivante)

Cette section suit, pas à pas, l’application du plan ci‑dessus dans le code React existant.

### 8.1 Étapes déjà réalisées

- **8.1.1 Couche de persistance intelligente (`useBooksStorage`) – terminée**
  - Création du hook `useBooksStorage` (`src/hooks/useBooksStorage.js`) qui :
    - charge les livres au démarrage :
      - tente d’abord `getAllBooksFromIndexedDB()` (store `books` dans `WorkoutTrackerDB`),
      - sinon fallback par `loadBooks()` (localStorage),
    - maintient un état `books` en mémoire comme **source de vérité** pour la UI,
    - applique une stratégie de **sauvegarde débouncée** :
      - calcul d’un hash léger (`computeHash`) sur la structure des livres,
      - si le hash n’a pas changé → aucune I/O,
      - sinon, après ~800 ms sans nouvelle modification :
        - `saveBooksToIndexedDB(books)` (IndexedDB, silencieux en cas d’erreur),
        - `saveBooks(books)` (backup localStorage).
  - Raccordement de `BooksTab.jsx` à ce hook :
    - remplacement de l’état local `useState([])` et du couple `loadBooks` / `saveBooks` par :
      - `const { books, setBooks, isLoading } = useBooksStorage();`
    - toutes les opérations (ajout/édition/suppression de livres, ajout de sessions) passent
      désormais par `setBooks`, ce qui garantit une persistance cohérente sans duplication de logique.

- **8.1.2 Module d’export/import avancé Livres (`booksExportImport.js`) – terminé**
  - Nouveau module `src/utils/booksExportImport.js` fournissant :
    - `BOOKS_EXPORT_VERSION = '1.0'`,
    - `prepareBooksExportData(books, options)` :
      - normalisation des livres et de leurs `readingSessions`,
      - production d’un objet d’export structuré (`version`, `exportDate`, `exportType`, `appName`,
        `data.books`, `metadata` complète),
    - `validateBooksData(data)` :
      - vérifie l’intégrité de `data.data.books` et des tableaux de sessions,
      - renvoie `{ valid, errors, warnings, stats }`,
    - `migrateBooksImportData(importedData)` :
      - garantit la présence de `data.books`,
      - normalise les champs critiques (titre, auteur, status, score, sessions),
      - met à jour la version vers `BOOKS_EXPORT_VERSION` si nécessaire,
    - `processBooksImportData(imported, options)` :
      - accepte soit une string JSON, soit un objet,
      - valide la version,
      - applique la migration et la validation,
      - renvoie un résultat exploitable côté UI : `{ valid, errors, warnings, books, stats }`.
  - Intégration dans `BooksTab.jsx` :
    - **Export** :
      - `handleExport` appelle désormais `prepareBooksExportData(books, { includeSessions: true, includeMetadata: true })`,
      - puis utilise `exportBooks(exportData.data.books)` pour **conserver la compatibilité** avec le format d’export dédié existant (on pourra plus tard faire évoluer `exportBooks` pour utiliser l’objet complet).
    - **Import** :
      - `handleImportFileChange` lit d’abord le fichier via `importBooksFromFile(file)`,
      - passe les données obtenues à `processBooksImportData` (en enveloppant si nécessaire dans `{ data: { books } }`),
      - ne met à jour l’état (`setBooks(result.books)`) que si `result.valid === true`, et affiche un message clair sinon.

### 8.2 Étape suivante (à implémenter) : intégration Livres dans l’export global

Prochaine étape ciblée, avant d’ajouter d’autres fonctionnalités :

- **8.2.1 Ajouter `booksData` dans `SettingsTab.exportAllData`**
  - Importer dans `SettingsTab.jsx` les utilitaires nécessaires :
    - `prepareBooksExportData` depuis `src/utils/booksExportImport`,
    - une fonction de chargement des livres (ex. basée sur `getAllBooksFromIndexedDB` + `loadBooks`).
  - Dans `exportAllData` :
    - récupérer l’état d’entraînement le plus récent (`loadFromDB()`),
    - récupérer les données Nutrition (comme actuellement),
    - **en plus** : récupérer les livres via une petite fonction dédiée (IndexedDB → fallback localStorage),
    - construire un objet `booksExport = prepareBooksExportData(books, { includeSessions: true, includeMetadata: true })`,
    - intégrer :
      - `exportObject.data.booksData = booksExport;` (ou un sous‑ensemble si nécessaire),
      - et un bloc `booksSummary` dans `exportObject.metadata`, avec les compteurs utiles (nombre de livres, de sessions, plage de dates, etc.).
  - Contraintes :
    - si la récupération Livres échoue, l’export global NE doit PAS échouer :
      - loguer un warning,
      - éventuellement placer `booksData` à `null` et `booksSummary` à des valeurs neutres,
      - laisser les autres données (Workout, Nutrition, Garmin…) s’exporter normalement.

Une fois cette intégration réalisée, l’onglet Livres sera pleinement intégré au système de
sauvegarde global, ce qui répond à un des objectifs principaux de la spécification (cohérence
des backups à l’échelle de toute l’application).

### 8.3 UX minimale mais propre autour du chargement (terminée)

Avant d’ajouter des fonctionnalités visuelles lourdes (vue 3D, carrousels complexes), il est
raisonnable d’apporter une **amélioration UX très légère** mais importante :

- Utiliser le signal `isLoading` fourni par `useBooksStorage` pour :
  - afficher un petit état de chargement dans `BooksTab` tant que les données n’ont pas été
    chargées depuis IndexedDB / localStorage,
  - éviter d’afficher des listes vides qui pourraient faire croire à une perte de données.
- Contraintes :
  - ne pas introduire d’animations coûteuses,
  - se contenter d’un message/text UI discret (ex. `t('common.loading')`) ou d’une petite
    carte de type “Chargement de la bibliothèque…”.

Cette étape est maintenant **terminée** :

- `BooksTab` affiche une petite carte de chargement utilisant `t('common.loading')` tant que
  `useBooksStorage` n’a pas fini de charger les livres depuis IndexedDB / localStorage.
- L’impact performance est négligeable (simple texte), mais l’UX est plus claire (l’utilisateur
  voit que la bibliothèque se charge, au lieu d’une liste vide).

### 8.4 Export Livres dédié enrichi (terminé)

Maintenant que :

- les données Livres sont persistées de façon robuste (`useBooksStorage` + IndexedDB/localStorage),
- un module d’export/import avancé (`booksExportImport.js`) existe et est déjà utilisé dans `BooksTab`,
- l’export global (`SettingsTab.exportAllData`) inclut `booksData` et `booksSummary`,

il reste une étape UX/robustesse très significative : **remplacer l’ancien export Livres basique
par un export dédié enrichi** (versionné, avec métadonnées complètes) directement depuis l’onglet.

Objectif :

- Quand l’utilisateur clique sur “Exporter JSON” dans l’onglet Livres :
  - le fichier téléchargé doit contenir :
    - la structure d’export complète (version, métadonnées, etc.) produite par `prepareBooksExportData`,
    - pas seulement un tableau brut de livres.
- Avantages :
  - fichier d’export autoportant (on sait quelle version, combien de livres/sessions, quelles dates),
  - compatibilité directe avec `processBooksImportData` (round‑trip parfait),
  - alignement avec la philosophie de `BodyTrackingExportImport`.

Stratégie :

- Ajouter une fonction dédiée dans `booksExportImport.js`, par exemple :
  - `downloadBooksExportFile(exportData, filename?)` qui :
    - sérialise l’objet `exportData` complet,
    - crée un blob et déclenche le téléchargement (pattern identique à `downloadExportFile` du module BodyTracking),
    - logue la taille et le nom du fichier.
- Modifier `BooksTab.handleExport` pour :
  - appeler `prepareBooksExportData(books, options)` comme actuellement,
  - puis `downloadBooksExportFile(exportData, 'books-data-YYYY-MM-DD.json')`,
  - sans passer par l’ancien `exportBooks` (qui ne gérait qu’un tableau de livres).

Cette amélioration est maintenant **en place** :

- `booksExportImport.js` expose `downloadBooksExportFile(exportData, filename?)` pour télécharger
  un export Livres complet (versionné + métadonnées).
- `BooksTab.handleExport` :
  - prépare un export via `prepareBooksExportData(books, { includeSessions: true, includeMetadata: true })`,
  - appelle ensuite `downloadBooksExportFile(exportData)`,
  - ce qui télécharge un fichier `books-data-YYYY-MM-DD.json` contenant :
    - les livres normalisés,
    - les sessions,
    - et un bloc `metadata` complet.

L’export/import Livres dédié est ainsi aligné sur la philosophie de `BodyTrackingExportImport`
et prêt pour des évolutions futures (nouvelles versions, nouveaux champs, migrations).

### 8.5 Stats avancées légères + limitation DOM des carrousels (partiellement terminées)

Ces optimisations sont maintenant **en grande partie implémentées** :

1. **Stats avancées légères dans le panneau de détail** – terminé :
   - `BooksTab` calcule désormais :
     - la moyenne de pages par session,
     - la durée moyenne par session,
     - un pourcentage de progression estimé du livre si `pages` est renseigné.
   - Ces valeurs sont affichées dans la section de stats du détail du livre, en s’appuyant
     uniquement sur les `readingSessions` déjà présentes (aucune nouvelle donnée persistée).

2. **Limitation du nombre de cartes rendues dans les carrousels** – terminé (v1) :
   - Une constante `MAX_BOOK_CARDS = 50` limite le nombre de cartes rendues dans chaque carrousel
     (en cours / terminés) via `slice(0, MAX_BOOK_CARDS)`.
   - Cela protège le DOM et le main thread pour les bibliothèques volumineuses, tout en restant
     suffisant pour un usage courant.

Reste éventuel (v2) :

- (déjà implémenté) : un texte discret “+ X autres livres non affichés” lorsque la taille réelle
  dépasse `MAX_BOOK_CARDS`, pour informer l’utilisateur qu’il y a davantage de livres que ceux
  affichés dans le carrousel actuel.

### 8.6 Stockage des assets (PDFs, couvertures) – **terminé (v1 ciblée)**

Pour approcher le 100/100, un stockage avancé pour les **assets Livres lourds** a été mis en place et
intégré de manière **sobre et performante** :

- PDFs associés à un livre (ex. ebook),
- couvertures/images (au‑delà d’un simple champ `coverUrl` inline).

Objectif atteint :

- Module `booksAssetsStorage` dédié, inspiré de `pdfStorage` / `imageStorage` de la version Vue, mais :
  - adapté à l’architecture actuelle (React + `WorkoutTrackerDB`),
  - pensé pour limiter les accès disque et la consommation mémoire,
  - avec une API claire et découplée de la UI.

Contraintes respectées :

- Aucun blob (PDF/images) n’est stocké dans les objets `Book` :
  - les exports JSON restent légers,
  - les opérations en mémoire restent peu coûteuses.
- Les livres ne contiennent que des **références** aux assets :
  - booléens `hasPdf`, `hasCover` (et `id` implicite de type `pdf_<bookId>` / `cover_<bookId>`).
- Les assets sont gérés dans des stores séparés d’IndexedDB, avec une clé stable et quelques métadonnées.

Mise en œuvre concrète :

1. Section 9.x ajoutée dans ce document pour :
   - définir le schéma des stores `bookPdfFiles` et `bookImages`,
   - décrire l’API `booksAssetsStorage`,
   - préciser l’impact sur le modèle `Book` (champs de référence, métadonnées).
2. Module `src/utils/booksAssetsStorage.js` implémenté avec une version minimaliste mais robuste :
   - `save/get/delete` pour PDF et cover,
   - gestion silencieuse des erreurs (IndexedDB indisponible, etc.).
3. Branchement progressif dans la UI :
   - champs `hasPdf` / `hasCover` gérés dans le modèle Livres côté UI,
   - boutons dédiés dans `BooksTab` pour :
     - **PDF** : joindre / supprimer (aucun chargement auto),
     - **Couverture** : ajouter/changer, voir, supprimer,
   - ajustement de l’export/import (`booksExportImport` v1.1) pour inclure les métadonnées `hasPdf` / `hasCover`
     et des compteurs d’assets dans les statistiques, sans modifier le stockage des blobs.

### 8.7 Vue 3D légère `BooksDomeGallery` (v1 expérimentale) – terminée

Objectif : offrir une **vue 3D optionnelle** qui donne un effet “dôme de livres” sans jamais surcharger
le navigateur, même sur machines modestes.

- **Composant dédié** :
  - Fichier `src/components/books/BooksDomeGallery.jsx`,
  - importé en lazy dans `BooksTab` via `React.lazy` + `Suspense`,
  - API simple : `books`, `onBookOpen(book)`.
- **Implémentation v1** :
  - aucun accès IndexedDB ni chargement d’images : la vue se base uniquement sur les métadonnées (`title`, `author`, `hasCover`),
  - limitation à 80 livres maximum dans le dôme pour garder le DOM léger,
  - positionnement circulaire via CSS (`transform: rotate(...) translate(...)`) avec une légère variation
    de “profondeur” pour l’effet sphère,
  - clic sur un livre → appelle `onBookOpen(book)` (dans `BooksTab`, cela met à jour `selectedBookId`).
- **Intégration dans `BooksTab`** :
  - état local `show3D` avec un bouton dans l’en‑tête :
    - `books.dome.show` / `books.dome.hide` pour activer/masquer la vue 3D,
  - rendu conditionnel :
    - tant que `show3D === false`, le composant n’est pas chargé, ce qui évite tout coût inutile,
    - lorsqu’il est actif, il est encapsulé dans un `Suspense` avec un fallback texte léger
      (`books.dome.loading`).
- **i18n** :
  - nouvelles clés `books.dome.show`, `books.dome.hide`, `books.dome.loading` ajoutées dans
    `fr/books.json`, `en/books.json` et dans le fallback `translations.js`,
  - ce qui garantit zéro warning i18n et un comportement cohérent avec le reste de l’app.

Cette v1 respecte strictement la contrainte de **sobriété en performances** tout en ouvrant la porte,
plus tard, à une version plus riche (intégration de vraies couvertures, effets supplémentaires) sans
nécessiter de casser l’architecture actuelle.

---

## 9. Spécification détaillée – Stockage des assets Livres (PDFs, couvertures)

Cette section décrit précisément la cible pour la gestion des assets Livres lourds.

### 9.1 Schéma IndexedDB pour les assets

- **Base utilisée** : `WorkoutTrackerDB` (même base que le reste pour limiter les connexions).
- **Stores ajoutés** :
  - `bookPdfFiles` :
    - `keyPath: 'id'` – identifiant string stable, par exemple `pdf_<bookId>`.
    - structure d’un enregistrement :
      - `id: string`,
      - `file: File | Blob` (PDF),
      - `mimeType: string` (ex. `application/pdf`),
      - `size: number | null`,
      - `updatedAt: string` (ISO).
  - `bookImages` :
    - `keyPath: 'id'` – identifiant string stable, par exemple `cover_<bookId>`.
    - structure d’un enregistrement :
      - `id: string`,
      - `blob: Blob` (image compressée/optimisée),
      - `mimeType: string` (ex. `image/jpeg`),
      - `size: number | null`,
      - `updatedAt: string` (ISO),
      - `width?: number`, `height?: number` (optionnel),
      - autres champs optionnels (`meta`) si besoin plus tard.

### 9.2 Impact sur le modèle `Book`

- Ajout de champs **légers** (sans blobs) dans les objets Livres :
  - `hasPdf?: boolean` – indique si un PDF est associé (stocké dans `bookPdfFiles` sous `pdf_<bookId>`).
  - `hasCover?: boolean` – indique si une couverture est associée (stockée dans `bookImages` sous `cover_<bookId>`).
  - Optionnellement (pour des besoins futurs) :
    - `pdfAssetId?: string | null` (par défaut `pdf_<bookId>`),
    - `coverAssetId?: string | null` (par défaut `cover_<bookId>`).
- Ces champs :
  - sont **faciles à exporter/importer** (booléens + strings),
  - n’alourdissent pas la mémoire ni les exports JSON,
  - servent de pont entre la couche Livres et la couche Assets.

### 9.3 API `BooksAssetsStorage` (v1 minimale)

- Fichier : `src/utils/booksAssetsStorage.js`.
- Fonctions exposées (toutes asynchrones, robustes, silencieuses en cas d’erreur) :
  - PDFs :
    - `saveBookPdf(id: string, file: File | Blob): Promise<boolean>`
    - `getBookPdf(id: string): Promise<{ id, file, mimeType, size, updatedAt } | null>`
    - `deleteBookPdf(id: string): Promise<boolean>`
  - Couvertures :
    - `saveBookCover(id: string, blob: Blob, meta?: Object): Promise<boolean>`
    - `getBookCover(id: string): Promise<{ id, blob, mimeType, size, updatedAt, ...meta } | null>`
    - `deleteBookCover(id: string): Promise<boolean>`

### 9.4 Intégration progressive dans `BooksTab`

1. **Étape 1 (en place)** :
   - Implémentation de `booksAssetsStorage.js` avec les stores `bookPdfFiles` et `bookImages`,
   - sans aucun branchement à la UI ou au modèle Livres (zéro changement de comportement).

2. **Étape 2 (à implémenter)** :
   - Ajouter les champs `hasPdf` / `hasCover` dans le modèle Livres côté UI :
     - lors de la création/mise à jour des livres, conserver ces champs si présents,
     - ne pas les éditer dans le formulaire principal (ils seront gérés par des boutons dédiés).
   - Dans le panneau de détail (`BooksTab`) :
     - ajouter deux petites zones :
       - “PDF associé” avec boutons :
         - “Joindre un PDF” (upload → `saveBookPdf` pour `pdf_<bookId>` → mise à jour de `hasPdf = true`),
         - “Supprimer le PDF” (→ `deleteBookPdf` → `hasPdf = false`),
       - “Couverture” avec logique similaire si on souhaite gérer les covers dans cette phase.
   - Contraintes UX/perf :
     - ne charger le PDF ou la couverture (via `getBookPdf` / `getBookCover`) que :
       - sur action explicite de l’utilisateur (ex. clic sur “Télécharger le PDF” ou “Voir la couverture”),
       - jamais automatiquement au montage (pour éviter des lectures IndexedDB inutiles).

3. **Étape 3 (évolution future)** :
   - Étendre éventuellement l’export/import Livres pour inclure :
     - seulement les métadonnées des assets (ex. `hasPdf`, `hasCover`, `mimeType`, `size`),
     - ou un mode d’export “complet” (ZIP simulé) qui regrouperait JSON + assets, si besoin.


