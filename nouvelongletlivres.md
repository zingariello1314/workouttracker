## Onglet Livres – Documentation technique du projet

### 1. Vue d’ensemble

**Onglet Livres** est une application web monopage basée sur **Vue 3** (chargé en global, sans bundler) qui tourne entièrement dans le navigateur.  
Elle permet de :

- **Gérer une bibliothèque personnelle** : ajout/édition/suppression de livres, suivis de lecture, notes et résumés.
- **Suivre les sessions de lecture** : dates, durée, pages lues, notes, statistiques.
- **Visualiser la bibliothèque** via :
  - des **carrousels** (livres en cours, livres terminés) ;
  - une **sphère 3D immersive** qui affiche les couvertures.
- **Sauvegarder et restaurer** les données de manière robuste via :
  - `localStorage` (livres, paramètres),
  - **IndexedDB** (PDFs et images),
  - un **système de sauvegarde évolué** (backups complets + export/import multi‑formats).

L’architecture est organisée en plusieurs couches :

- **Interface utilisateur (UI Vue)** : `main.js`, `App.js`, `DomeGallery.js`, `BackupManager.js`.
- **Store central de données** : `bookStore.js`.
- **Services de stockage** : `bookStorage.js`, `pdfStorage.js`, `imageStorage.js`.
- **Système de sauvegarde avancé** : `backupSystem.js`, `cloudBackup.js`, `dataIntegrity.js`.

---

### 2. `index.html` – Point d’entrée et câblage

- **Rôle** : point d’entrée de l’application, charge les styles, Vue 3 et tous les scripts JS dans le bon ordre, puis monte l’app sur `<div id="app">`.
- **Ce que fait le fichier** :
  - Charge Tailwind + CSS modulaires (`src/css/main.css`, `backup-manager.css`, etc.).
  - Charge Vue 3 en global (`https://unpkg.com/vue@3/dist/vue.global.js`).
  - Charge, dans cet ordre logique :
    - les **services** (`bookStorage`, `pdfStorage`, `backupSystem`, `imageStorage`, `cloudBackup`, `dataIntegrity`),
    - les **utils** (`calculations`, `formUtils`, `dateUtils`),
    - le **store** (`bookStore`),
    - les **composants** (`DomeGallery`, `BackupManager`, `App`),
    - enfin `main.js` qui crée et monte le composant racine.
- **Pourquoi ce design** :
  - Pas de build, pas de bundler : tout est géré par `<script>` classiques, idéal pour un **projet statique** déployé facilement (GitHub Pages, hébergement simple, etc.).

---

### 3. `src/js/main.js` – Composant Vue racine et layout

- **Rôle** : transformer la classe `App` en **composant Vue 3** et déclarer tout le template HTML de l’interface.
- **Fonctionnement** :
  - Instancie la logique métier :
    - `const app = new App();`
    - expose l’instance sur `window.app` (debug, console).
  - Définit `AppComponent` avec :
    - un **template très riche** comprenant :
      - header avec logo et navigation (onglet “Livres”) ;
      - formulaire structuré d’ajout/édition de livres (infos principales, fichiers, résumés, notation) ;
      - barre de progression de remplissage de formulaire ;
      - recherche texte ;
      - boutons d’export/import JSON ;
      - carrousel des livres en cours ;
      - carrousel des livres terminés ;
      - **section de vue 3D** (dôme) qui utilise `buildItems` ;
      - vue détaillée d’un livre (infos complètes + historique de lecture + formulaire de session).
  - Dans `setup()` :
    - Retourne toutes les **refs et méthodes** de l’instance `App` (ex. `currentView`, `form`, `libraryBooks`, `addBook`, `scrollCarousel`, etc.) pour que le template puisse les utiliser directement.
  - Dans `mounted()` :
    - Appelle `app.onMounted()` (configuration des contrôles carrousels, clavier/touch).
    - Récupère dans le DOM les éléments de la sphère 3D (`.sphere-root`, `.sphere-main`, `.sphere`, `.frame`, `.viewer`, `.scrim`) et appelle `app.initDomeGalleryWithRefs(...)`.
    - Ajoute des **animations de focus** sur les champs du formulaire (scale léger sur focus/blur).
- **Pourquoi** :
  - `App` reste une **classe de logique métier** indépendante du template Vue.
  - `main.js` sert uniquement de glue entre cette logique et la **vue déclarative Vue 3**.

---

### 4. `src/js/components/App.js` – Cœur fonctionnel

`App` est la classe principale qui orchestre toute l’application côté front.

#### 4.1 Initialisation et état réactif

- Nettoie éventuellement `localStorage` si `quietquest_backup_system` devient trop volumineux (protection contre dépassement de quota).
- Instancie les services principaux :
  - `this.bookStore = new BookStore();`
  - `this.pdfStorage = new PdfStorage();`
- Déclare de nombreuses **refs et objets réactifs** via `Vue.ref` / `Vue.reactive` :
  - Vue/navigation : `currentView`, `isLongSummaryExpanded`, `starRating`.
  - Carrousels : `librarySlideIndex`, `completedSlideIndex`, `libraryCarouselRef`, `completedCarouselRef`, `BOOKS_PER_VIEW` (6).
  - Formulaire principal : `form` (titre, auteur, année, genre, pages, couverture, résumés, statut, note, pdfFile).
  - Formulaires de sessions de lecture : `sessionForm`, `sessionEditForm`, `editingSessionIndex`.
  - États de soumission : `formProgress`, `isSubmitting`, `submitSuccess`.

#### 4.2 Pont avec le `BookStore`

- Fournit des getters qui proxient simplement les propriétés du `BookStore` :
  - `libraryBooks`, `completedBooks`, `filteredLibraryBooks`, `filteredCompletedBooks`,
  - `hasSelectedBook`, `selectedBook`, `editingBookId`, `books`,
  - `searchQuery` (getter/setter qui propage la valeur dans le store).
- **Idée** : conserver la **source de vérité** des données dans `BookStore` et n’utiliser `App` que comme couche intermédiaire entre Vue (UI) et le store.

#### 4.3 Intégration de la vue 3D (`DomeGallery`)

- `initDomeGallery()` :
  - Crée une instance `DomeGallery` avec une configuration fine (rayon min/max, segments, inertie, sensibilité de drag, etc.).
  - Enregistre un callback `setOnBookOpen(book => this.openBook(book))` pour ouvrir un livre quand on clique sur une tuile de la sphère.
  - Push la liste des livres en cours dans la sphère : `this.domeGallery.updateBooks(this.libraryBooks.value)`.
- `initDomeGalleryWithRefs(rootRef, mainRef, sphereRef, frameRef, viewerRef, scrimRef)` :
  - Transmet les références DOM à `DomeGallery.init(...)`.
  - Désactive toute rotation automatique ; ajoute un **drag manuel horizontal seulement** (`addDragInteraction`) avec inertie maison.
- `buildItems(books, segments = 35)` :
  - Génère une grille de coordonnées (offset X/Y) pour placer des tuiles sur une sphère virtuelle.
  - Réplique les couvertures des livres (en évitant les doublons visibles côte à côte) sur l’ensemble des slots.
  - Emballe à chaque fois `src`, `alt`, `bookId` et `book` complet pour pouvoir ouvrir le bon livre au clic.
- `openBookFromItem(item)` :
  - Si `item.book` est défini, appelle directement `openBook(item.book)`.
  - Sinon, cherche le livre par `bookId` dans `libraryBooks` et l’ouvre.
  - Force la vue à repasser sur l’onglet `livres`.

**Pourquoi ce design** :  
Séparer la logique 3D complexe (`DomeGallery`) de la logique métier (`App`) tout en gardant une communication simple (callback `onBookOpen` + liste de livres à jour).

#### 4.4 Formulaire de livre & gestion des fichiers

- **Progression de formulaire** :
  - `updateFormProgress()` délègue à `FormUtils.updateFormProgress(this.form)` pour produire un pourcentage 0–100.
  - `resetForm()` utilise `FormUtils.resetForm(this.form)` puis remet à zéro `editingBookId`, `starRating`, `formProgress`.
- **Upload / drag & drop couverture** :
  - `triggerCoverUpload()` simule un clic sur l’`<input type="file" accept="image/*">`.
  - `handleCoverDrop(event)` récupère les fichiers du drag & drop et appelle `handleCoverUpload`.
  - `handleCoverUpload(event)` :
    - Lit le fichier image en DataURL via `FormUtils.readFileAsDataURL`.
    - Stocke ce DataURL dans `form.coverUrl` (et met à jour la progression).
- **Upload / drag & drop PDF** :
  - `triggerPdfUpload()` simule un clic sur l’`<input type="file" accept="application/pdf">`.
  - `handlePdfDrop(event)` récupère le fichier et appelle `handlePdfUpload`.
  - `handlePdfUpload(event)` :
    - Stocke le `File` brut dans `form.pdfFile`.
    - Si on est en édition (`editingBookId` non nul), demande à `PdfStorage.savePdf` de persister immédiatement le fichier dans IndexedDB.

**Objectif** : offrir une UX riche (clic, drag & drop, preview) tout en stockant efficacement les vraies données binaires dans IndexedDB (et non directement dans `localStorage`).

#### 4.5 Gestion des livres (CRUD complet)

- `addBook()` :
  - Active `isSubmitting` (état de chargement du bouton).
  - Valide le formulaire via `FormUtils.validateForm(this.form)` ; en cas d’erreurs, affiche un `alert` et arrête.
  - Génère un `bookId` (nouveau livre ou livre en édition).
  - Sauvegarde le PDF associé dans `PdfStorage` si `form.pdfFile` est présent.
  - Construit un objet `bookData` avec toutes les infos (y compris `personalScore` à partir de `starRating`).
  - Appelle `this.bookStore.addBook(bookData)` pour mettre à jour le store et le stockage.
  - Lance une **animation de succès** (modification de `submitSuccess` pendant 2s), réinitialise le formulaire et ferme le livre en cours dans le store.
- `editBook(book)` :
  - Ferme le livre sélectionné dans le store.
  - Remplit `this.form` à partir des données du livre (sauf `pdfFile` / `coverFile`, remis à `null`).
  - Met à jour `this.bookStore.editingBookId` et `currentView` pour revenir sur l’onglet formulaire.
  - Recalcule `starRating` en fonction de la chaîne `personalScore`.
- `deleteBook(book)` :
  - Confirme via `confirm(...)` puis appelle `bookStore.deleteBook(book)` et `bookStore.closeBook()`.
- `openBook(book)` :
  - Force `currentView` sur “livres”.
  - Crée une **copie réactive** du livre (via `Vue.reactive`) pour éviter de manipuler directement l’original.
  - Initialise `readingSessions` si absent.
  - Passe cette copie à `bookStore.openBook()`.
  - Lance en arrière-plan `loadPdfInBackground(copiedBook)` pour récupérer le PDF depuis `PdfStorage` et créer un `_pdfBlobUrl` cliquable.
- `closeBook()` : délègue à `bookStore.closeBook()`.

#### 4.6 Sessions de lecture et statistiques

- `addReadingSession()` :
  - Vérifie qu’un livre est sélectionné et qu’une durée est renseignée.
  - Appelle `bookStore.addReadingSession(this.sessionForm)` (persistant dans les livres).
  - Réinitialise tous les champs de `sessionForm` et remet la date à `DateUtils.getCurrentDateISO()`.
- `editSession(idx)`, `saveEditedSession()`, `cancelEditSession()`, `deleteSession(idx)` :
  - Permettent d’éditer une session existante, de sauvegarder les modifications ou de supprimer une entrée.
- Statistiques :
  - `getTotalReadingTime(book)`, `getTotalPagesRead(book)` → délèguent à `BookStore` / `ReadingCalculations`.
  - `formatDate(dateStr)` → délègue à `DateUtils.formatDate`.

#### 4.7 Carrousels

- `scrollCarousel(type, direction)` :
  - Calcule le nouvel index de “page” pour le carrousel (`library` ou `completed`) avec navigation **cyclique** (quand on dépasse la fin, on revient au début).
  - Calcule la translation en pixels et anime le `transform: translateX(...)` avec une transition CSS.
- `debugCarousel(type)` et `resetCarousel(type)` :
  - Méthodes de debug pour comprendre la largeur, les positions des cartes, et pour remettre les carrousels à zéro.
- `setupTouchControls(carouselRef, carouselType)` :
  - Ajoute un drag tactile sur mobile/tablette qui se traduit en `scrollCarousel(...)` quand on dépasse un certain seuil.
- `setupKeyboardControls()` :
  - Ajoute une navigation au clavier (flèches gauche/droite) lorsqu’un carrousel a le focus.

**Pourquoi** : proposer une **expérience fluide** sur desktop et mobile, tout en gardant une logique de pagination simple basée sur un nombre fixe de cartes par vue (`BOOKS_PER_VIEW`).

#### 4.8 Initialisation globale

- `onMounted()` :
  - Active les contrôles clavier.
  - Après un `Vue.nextTick()`, installe les contrôles tactiles pour chaque carrousel si les refs DOM existent.

---

### 5. `src/js/components/DomeGallery.js` – Moteur de sphère 3D

- **Rôle** : encapsuler **toute la logique 3D/interaction** de la galerie en dôme : placement des tuiles, rotations, drag, inertie, zoom sur une image, fermeture.
- **Principaux concepts** :
  - Stocke de nombreuses refs (`rootRef`, `mainRef`, `sphereRef`, `frameRef`, `viewerRef`, `scrimRef`) via `Vue.ref` pour manipuler le DOM.
  - Gère un état de rotation `rotationRef` (angles X/Y) et des états de drag (`draggingRef`, `startPosRef`, etc.).
  - Définit des utilitaires mathématiques (`clamp`, `normalizeAngle`, etc.).
- **Placement des items** :
  - `buildItems(books, segments)` crée une grille pseudo‑sphérique en alternant lignes paires/impaires pour les Y, puis remplit chaque slot avec une couverture de livre.
  - Évite les doublons consécutifs et renvoie des objets `{ x, y, sizeX, sizeY, src, alt, book }` qui sont utilisés par le template Vue (dans `main.js`) pour construire les `<div class="item">`.
- **Rotation, drag et inertie** :
  - `setupDragHandlers()` écoute `mousedown / mousemove / mouseup` et `touchstart / touchmove / touchend` sur `mainRef` pour mettre à jour `rotationRef` et appliquer `applyTransform(...)` sur `sphereRef`.
  - `startInertia(vx, vy)` utilise `requestAnimationFrame` pour prolonger le mouvement après le relâchement (effet d’inertie).
- **Zoom/agrandissement** :
  - `openItemFromElement(el)` calcule la position de la tuile dans le viewport, crée un overlay `.enlarge` au bon endroit avec l’image, puis anime l’overlay pour le centrer/agrandir dans `viewerRef`.
  - `closeOverlay()` fait l’animation inverse pour revenir sur la tuile d’origine.
- **Intégration avec le reste** :
  - `updateBooks(newBooks)` : met à jour la liste interne de livres (utilisé par `App`).
  - `setOnBookOpen(callback)` : permet à `App` de fournir une fonction pour ouvrir un livre quand on clique sur un item.

**Pourquoi** : tu maintiens une **brique 3D autonome et réutilisable**, tout en gardant un couplage léger vers le reste de l’application (un simple callback et une liste de livres).

---

### 6. `src/js/components/BackupManager.js` – UI de gestion de sauvegardes

- **Rôle** : composant Vue (en style Options API) qui fournit une interface utilisateur pour le système de sauvegarde robuste.
- **Fonctionnement** :
  - Au `mounted()`, charge :
    - `stats` via `this.$parent.getBackupStats()` (exposé par le `BookStore`/`App`),
    - `backupList` via `this.$parent.backupSystem.getBackupList()`.
  - Affiche :
    - **Statistiques** : nombre de sauvegardes, espace utilisé, nombre d’images, état d’intégrité.
    - **Actions principales** :
      - Sauvegarde : `createBackup`, `exportBackup`.
      - Restauration : import de fichier, `checkIntegrity`.
      - Maintenance : `repairData`, `cleanupData`.
    - **Liste des sauvegardes** locales : chaque entrée a des boutons “Restaurer” et “Supprimer”.
    - **Résultats de vérification d’intégrité** détaillés (liste de checks, issues critiques/warnings, etc.).
- **Communication avec la logique métier** :
  - Se repose sur des méthodes du parent (`this.$parent`) qui doivent exister sur l’instance Vue racine / `App` (ex. `createCompleteBackup`, `exportBackup`, `importBackup`, `checkDataIntegrity`, `repairData`, `cleanupData`).
- **Pourquoi** :
  - Isoler la **logique UI de sauvegarde** dans un composant dédié, tout en tirant parti de la puissance du système de sauvegarde défini dans les services (`BackupSystem`, `CloudBackup`, `DataIntegrity`, `ImageStorage`).

---

### 7. `src/js/stores/bookStore.js` – Store de livres et intégration sauvegarde

`BookStore` est la **source de vérité** pour toutes les données de livres.

#### 7.1 Données et services

- Contient :
  - `this.bookStorage = new BookStorage();`
  - `this.books = Vue.reactive([]);`
  - `this.selectedBook = Vue.ref(null);`
  - `this.editingBookId = Vue.ref(null);`
  - `this.searchQuery = Vue.ref('');`
- Système de sauvegarde complet instancié ici :
  - `this.backupSystem = new BackupSystem();`
  - `this.imageStorage = new ImageStorage();`
  - `this.cloudBackup = new CloudBackup();`
  - `this.dataIntegrity = new DataIntegrity();`
  - `initializeBackupServices()` configure les liens entre ces services.
- Charge les livres au démarrage via `this.loadBooks()`.

#### 7.2 Propriétés calculées (Vue.computed)

- `libraryBooks` : livres avec `status === 'en cours'`.
- `completedBooks` : livres avec `status === 'terminé'`.
- `filteredLibraryBooks` / `filteredCompletedBooks` : appliquent le **filtre de recherche** (titre/auteur contient la query).
- `hasSelectedBook` : indique si un livre est actuellement ouvert dans la vue détail.

#### 7.3 CRUD des livres

- `loadBooks()` / `saveBooks()` : passent par `BookStorage` (wrapper autour de `localStorage`).
- `addBook(bookData)` :
  - Gère à la fois l’ajout et l’édition :
    - Crée un id (nouveau ou `editingBookId`).
    - Construit un objet `book` qui conserve les `readingSessions` existantes si on édite.
  - Met à jour `this.books` (remplace ou ajoute), puis appelle `saveBooks()`.
  - Réinitialise `editingBookId`.
- `deleteBook(book)` : supprime dans `this.books` et persiste via `saveBooks()`.
- `openBook(book)` : met `selectedBook` sur une copie réactive du livre, et garantit que `readingSessions` existe.
- `closeBook()` : remet `selectedBook` à `null`.

#### 7.4 Sessions de lecture

- `addReadingSession(sessionData)` :
  - Ajoute une session au `selectedBook`.
  - Met à jour le livre correspondant dans `this.books`.
  - Utilise `ReadingCalculations.isBookCompleted` pour éventuellement passer le livre en `terminé`.
  - Persiste via `saveBooks()`.
- `updateReadingSession(sessionIndex, sessionData)` / `deleteReadingSession(sessionIndex)` :
  - Modifient/suppriment une session et répercutent les changements dans `this.books` + `saveBooks()`.

#### 7.5 Export/import des livres

- `exportBooks()` : délègue à `BookStorage.exportBooks(this.books)` (génère un fichier JSON à télécharger).
- `importBooks(file)` : lit un fichier JSON via `BookStorage.importBooks`, remplace les livres en mémoire, puis `saveBooks()`.

#### 7.6 Intégration du système de sauvegarde robuste

- `initializeBackupServices()` :
  - `this.cloudBackup.initialize(this.backupSystem, this.imageStorage);`
  - `this.dataIntegrity.initialize(this.backupSystem, this.imageStorage, new PdfStorage());`
- Méthodes de haut niveau :
  - `performAutoBackup()` : appelle `backupSystem.performAutoBackup()`.
  - `createCompleteBackup()` : crée une sauvegarde complète et la stocke.
  - `exportBackup()` / `importBackup(file)` : export/import d’une sauvegarde complète.
  - `checkDataIntegrity()` : appelle `dataIntegrity.performFullIntegrityCheck()`.
  - `repairData()` : appelle `dataIntegrity.performAutoRepair()`.
  - `getBackupStats()` : agrège infos de `backupSystem`, `imageStorage`, `dataIntegrity` pour alimenter `BackupManager`.
  - `cleanupData()` : nettoie images orphelines + limite le nombre de sauvegardes stockées.

**Pourquoi** : centraliser **TOUS les accès aux données** (et aux services de sauvegarde) dans un seul store, ce qui rend la logique de l’app **plus prévisible et testable**.

---

### 8. Services de stockage simples

#### 8.1 `src/js/services/bookStorage.js` – Livres dans `localStorage`

- **Rôle** : encapsuler l’accès à `localStorage` pour les livres.
- **Fonctionnement** :
  - `saveBooks(books)` :
    - Clone chaque livre, supprime les champs volatiles liés aux PDF (`pdfFileUrl`, `_pdfBlobUrl`).
    - Sérialise le tout en JSON sous la clé `quietquest_books`.
  - `loadBooks()` :
    - Lit la clé `quietquest_books`.
    - Parse le JSON, garantit l’existence d’un tableau `readingSessions` pour chaque livre.
  - `exportBooks(books)` :
    - Génère un `data:text/json` avec l’ensemble des livres et déclenche un téléchargement `quietquest_books_backup.json`.
  - `importBooks(file)` :
    - Lit un fichier JSON utilisateur via `FileReader` et renvoie le tableau de livres.

#### 8.2 `src/js/services/pdfStorage.js` – PDFs en IndexedDB

- **Rôle** : stocker les fichiers PDF associés à chaque livre dans **IndexedDB** (base `quietquest_pdf_db`, store `pdfFiles`).
- **Fonctions principales** :
  - `openDb()` : ouvre/crée la base IndexedDB, avec un object store `pdfFiles` indexé par `id`.
  - `savePdf(id, file)` : enregistre un blob `file` sous la clé `id`.
  - `getPdf(id)` : récupère le blob associé à un `id` (ou `null`).
  - `deletePdf(id)` : supprime le PDF correspondant.

#### 8.3 `src/js/services/imageStorage.js` – Images/couvertures en IndexedDB

- **Rôle** : gérer toutes les **images/couvertures** dans une autre base IndexedDB (`quietquest_images_db`, store `images`).  
  Supporte :
  - Sauvegarde et lecture d’images (par id, par livre).
  - Suppression (par id, par livre, images orphelines).
  - **Optimisation des images** (redimensionnement + compression).
  - Statistiques et export/import d’images.
- **Exemples de méthodes** :
  - `optimizeImage(file, options)` : redimensionne l’image dans un `<canvas>`, compresse en `image/jpeg` et renvoie blob + dataURL + métadonnées (largeur, hauteur, taille…).
  - `saveCover(bookId, coverData)` : spécialisation de `saveImage` pour les couvertures, id du type `cover_<bookId>`.
  - `getCover(bookId)` / `deleteCover(bookId)`.
  - `getStorageStats()` : nombre total d’images, taille totale, stats par livre.
  - `cleanupOrphanedImages()` : supprime les images dont le `bookId` n’existe plus dans `quietquest_books`.
  - `exportAllImages()` / `importImages(importData)` : pour exporter/importer toutes les images.

**Pourquoi** : découpler le stockage lourd (binaire) du reste des données, tout en offrant des outils de maintenance (nettoyage, stats).

---

### 9. Système de sauvegarde avancé

Le système complet est documenté en détail dans `SYSTEME_SAUVEGARDE.md`. Voici une synthèse rapide de chaque service.

#### 9.1 `src/js/services/backupSystem.js` – Sauvegardes complètes locales

- **Rôle** : créer des **snapshots complets** de l’état de l’application et les stocker : livres, PDFs, couvertures, paramètres.
- **Fonctionnalités** :
  - Sauvegarde auto (timer, actuellement commenté) via `performAutoBackup()`.
  - `createCompleteBackup()` : assemble un objet contenant tous les livres, PDFs, covers et settings, avec métadonnées (taille, nombre de livres, etc.).
  - `saveBackupToStorage(backupData, type)` :
    - Ajoute la sauvegarde à une liste `quietquest_backup_system` dans `localStorage`, en gardant au plus `maxBackups` entrées.
    - Sauvegarde aussi la sauvegarde brute dans une IndexedDB dédiée (`quietquest_backup_db`).
  - `exportCompleteBackup()` : télécharge un fichier JSON complet.
  - `importCompleteBackup(file)` / `restoreFromBackup(backupData)` :
    - Valident et restaurent : livres (`quietquest_books`), PDFs, couvertures et paramètres (`localStorage`).
  - `getBackupList()` : renvoie une liste simplifiée de backups pour la UI (`BackupManager`).
  - `deleteBackup(backupId)` / `restoreBackup(backupId)` : gestion basique par id.
  - `verifyDataIntegrity()` : vérification de base de la cohérence (livres, PDFs, covers).

#### 9.2 `src/js/services/cloudBackup.js` – Export/import multi‑formats et cloud (simulé)

- **Rôle** : couche de plus haut niveau autour de `BackupSystem` pour :
  - sauvegarder vers différents services (local, Google Drive, Dropbox, OneDrive – ces derniers sont simulés),
  - exporter/importer des backups dans plusieurs formats (JSON, CSV, XML, ZIP simulé).
- **Fonctions clés** :
  - `backupToCloud(service, options)` : crée une backup complète et la “pousse” vers le service (local = téléchargement direct ; les autres sont simulés).
  - `exportToMultipleFormats({ formats })` :
    - Appelle `exportToFormat` pour chaque format (JSON, CSV, XML, ZIP).
  - `importFromFile(file)` :
    - Détecte l’extension (`.json`, `.csv`, `.xml`), parse le contenu, transforme en objet de backup compatible, puis délègue à `backupSystem.restoreFromBackup(...)`.
  - Outils de conversion :
    - `convertToCSV(backupData)`, `convertToXML(backupData)`.
    - Parse inverses `parseCSVToBackup(csvText)`, `parseXMLToBackup(xmlText)`.
  - `checkCloudConnectivity()` : simule l’état des différents services cloud (utile pour un futur branchement réel).

#### 9.3 `src/js/services/dataIntegrity.js` – Vérification et réparation

- **Rôle** : vérifier régulièrement l’**intégrité des données** et proposer une **réparation automatique**.
- **Configuration** :
  - `initialize(backupSystem, imageStorage, pdfStorage)` enregistre les dépendances.
  - `setupIntegrityChecks()` enregistre une liste de checks (structure des livres, cohérence des données, PDFs, images, fichiers orphelins, quotas).
  - `setupRepairStrategies()` enregistre les stratégies de réparation associées à chaque check.
- **Vérification** :
  - `performFullIntegrityCheck()` :
    - Exécute chaque check, agrège les résultats (valid/invalid, issues, summary).
    - Calcule un résumé global (nombre de checks réussis/échoués, issues critiques, warnings).
- **Réparation** :
  - `performAutoRepair()` :
    - Parcourt les checks ayant des stratégies de réparation associées.
    - Pour chacun, appelle la stratégie correspondante (ex. `repairBooksStructure`, `repairBooksDataConsistency`, `repairPdfFilesIntegrity`, etc.).
    - Retourne un résumé des réparations (réussites/échecs).
- **Exemples de stratégies** :
  - `repairBooksStructure()` :
    - Ajoute des IDs manquants, remplit des valeurs par défaut (titre vide → “Livre sans titre”, etc.), garantit l’existence de `readingSessions`.
  - `repairBooksDataConsistency()` :
    - Force les pages/durations négatives à 0, normalise les statuts invalides.
  - `repairPdfFilesIntegrity()` / `repairImageFilesIntegrity()` :
    - Suppriment les références à des blobs non accessibles (PDF/couvertures disparus).
  - `repairStorageQuota()` :
    - Nettoie les anciennes sauvegardes pour réduire la pression sur `localStorage`.

**Pourquoi** : apporter une **couche de sécurité supplémentaire** au-dessus des simples sauvegardes, en détectant puis en corrigeant automatiquement de nombreuses incohérences potentielles.

---

### 10. Conclusion

Ton projet **Onglet Livres** n’est pas juste une petite app de suivi de livres :  
c’est une **mini‑plateforme locale** avec :

- une interface riche (formulaire avancé, carrousels, vue 3D),
- un **store centralisé** bien organisé,
- un **stack de stockage avancé** (localStorage + IndexedDB pour PDFs et images),
- et un **système de sauvegarde / intégrité** digne d’une appli pro.

Cette documentation reflète la structure actuelle du code et peut servir de base pour :  
- ajouter de nouveaux écrans (statistiques, tags, recommandations),  
- brancher de vrais services cloud,  
- ou migrer plus tard vers une version avec bundler (Vite/Webpack) en conservant la même architecture logique.

---

### 11. Suivi d’implémentation dans le projet React principal

Cette section suit, pas à pas, l’intégration de l’onglet Livres dans l’application React principale (Workout Tracker), en gardant le présent document comme **fil rouge**.

#### 11.1 Phase 1 – Intégration minimale et sûre (terminée)

Objectif : disposer d’un onglet Livres fonctionnel mais volontairement simple, sans impacter le reste du site, en s’assurant que chaque décision est réversible et compréhensible.

- **Composant React dédié** : `BooksTab` dans `src/components/tabs/BooksTab.jsx`.
- **Scope limité** : aucune dépendance externe, aucune modification des contextes ou hooks globaux existants.
- **Fonctionnalités couvertes** :
  - Formulaire de création/édition de livre (titre, auteur, année, pages, statut, note perso, notes).
  - Deux “carrousels” horizontaux simples (scroll horizontal) pour les livres en cours / terminés.
  - Panneau de détail du livre sélectionné avec sessions de lecture (date, durée, pages lues, note) et statistiques basiques (temps total, pages totales, nombre de sessions).
  - Sauvegarde locale via `localStorage` (module `src/utils/booksStorage.js`) avec export/import JSON indépendant du reste de l’app.
- **Choix d’architecture** :
  - Pas encore de `IndexedDB` ni de système de sauvegarde avancé → cela évite de créer un deuxième “sous‑système” complexe avant d’avoir validé l’ergonomie et le modèle de données.
  - Utilisation des composants UI existants (`Card`, `Button`, `Input`, `TextArea`, `Select`) pour rester cohérent avec le design système global.
  - Données structurées de manière proche de ce que décrit `bookStore.js` (id, status, personalScore, readingSessions), mais dans un store React local pour l’instant.

Cette phase sert de **socle stable** : elle peut rester telle quelle si nécessaire, et toutes les phases suivantes viseront à rapprocher progressivement l’implémentation React de l’architecture complète décrite en sections 3 à 9 (IndexedDB, sauvegardes avancées, vue 3D), en gardant une compatibilité ascendante autant que possible.

#### 11.2 Phase 2 – Conception du stockage avancé (en cours)

Objectif : définir une **API de stockage Livres** claire et extensible (incluant IndexedDB) qui s’intègre proprement dans l’écosystème existant :

- Respecter les contraintes actuelles :
  - L’application utilise déjà `IndexedDB` pour le contexte global (`WorkoutContextDB`) et pour les données d’entraînement (`WorkoutTrackerDB`), ainsi que des repositories avancés pour la Nutrition.
  - Les exports globaux (dans l’onglet Paramètres) s’appuient sur un modèle de données “central” (`loadFromDB()` + métadonnées détaillées).
- Décisions en cours de conception (sans implémentation brutale) :
  - **Option A** : créer un sous‑système dédié `BooksRepository` + `IndexedDB` propre (base `BooksDB`, stores `books`, `pdfFiles`, `images`) sur le modèle de la documentation Vue, avec une couche d’adaptation React.
  - **Option B** : intégrer Livres dans la base existante `WorkoutTrackerDB` via un store supplémentaire (`books` + éventuelle table de sessions) pour limiter le nombre de bases ouvertes.
  - **Option C** : combiner A et B via une façade commune (`BooksStorageLayer`) capable de jongler entre `IndexedDB` et `localStorage` en fonction des capacités du navigateur (pattern déjà utilisé pour d’autres parties de l’app).
- Lignes directrices pour la phase suivante :
  - Garder `localStorage` comme **fallback simple et fiable**, même après introduction d’`IndexedDB`.
  - Concevoir un format d’export Livres compatible avec :
    - l’export global `exportAllData` des paramètres,
    - un futur export dédié Livres (similaire à BodyTracking / Nutrition en termes de métadonnées et de robustesse).

Les étapes exactes d’implémentation (création du repository IndexedDB, branchement progressif dans `BooksTab`, ajout contrôlé dans l’export global) seront détaillées dans des sous‑sections suivantes (11.3, 11.4, …) au fur et à mesure, afin de garder une traçabilité fine de chaque décision technique.


#### 11.3 Conception du schéma IndexedDB et de l’API Livres (conçue, implémentation minimale en place)

**Objectif** : définir un schéma IndexedDB extrêmement simple, aligné sur les patterns existants (`WorkoutTrackerDB`, `Nutrition IndexedDBRepository`), tout en restant peu coûteux pour le navigateur et en conservant `localStorage` comme fallback fiable.

##### 11.3.1 Choix de haut niveau

- **Base de données** : réutiliser la base `WorkoutTrackerDB` existante plutôt que créer une nouvelle base séparée, afin de :
  - limiter le nombre de connexions ouvertes à IndexedDB,
  - rester cohérent avec `useWorkoutData` qui gère déjà les mécanismes de récupération/corruption sur cette base,
  - éviter une explosion du nombre de stores à surveiller côté navigateur.
- **Nouveau store** : `books` dans `WorkoutTrackerDB` :
  - `keyPath: 'id'` (chaîne de type `book_<timestamp>`),
  - contenu structuré pour rester proche du modèle actuel de `BooksTab`.
- **Sessions de lecture** :
  - intégrées **dans chaque entrée de livre** via un tableau `readingSessions` (comme dans la V1 locale) pour limiter le nombre de stores et de transactions,
  - chaque session reste un petit objet JSON (pas de blobs ni fichiers, donc coût mémoire très faible).
- **PDFs / images** :
  - **non gérés** dans cette première itération IndexedDB pour éviter d’introduire trop de complexité d’un coup,
  - prévus dans une future phase via un store dédié (`bookPdfFiles`, `bookImages`) calqué sur `pdfStorage` / `imageStorage` de la version Vue.

Ce design permet de bénéficier très tôt d’un stockage persistant robuste (IndexedDB) pour les métadonnées livres + sessions, sans surcharger la structure ni le navigateur.

##### 11.3.2 Schéma de données détaillé

**Store `books` (dans `WorkoutTrackerDB`)** :

- Clé primaire : `id: string`  
- Champs principaux :
  - `title: string` – titre du livre (obligatoire côté UI, mais jamais `null` en DB).
  - `author: string` – auteur (facultatif, chaîne vide si inconnu).
  - `year: number | ''` – année de publication ; gardée en nombre quand possible, sinon chaîne vide (pour rester compatible avec l’implémentation actuelle de `BooksTab`).
  - `pages: number | ''` – nombre total de pages ; même convention que `year`.
  - `status: 'in-progress' | 'completed'` – état de lecture.
  - `personalScore: number` – note personnelle 0–5 (conservée en nombre, conversion en étoiles faite côté UI).
  - `notes: string` – notes libres / résumé court.
  - `createdAt: string` – ISO `YYYY-MM-DDTHH:mm:ss.sssZ` (optionnel en V1, mais présent si on le connaît).
  - `updatedAt: string` – ISO ; mis à jour à chaque modification (sert plus tard pour des statistiques d’usage ou de nettoyage).
  - `version: string` – version du schéma Livres (ex. `'1.0'`) pour permettre des migrations futures.
- `readingSessions: Array<ReadingSession>` :
  - chaque entrée suit le format :
    - `id: string` – `session_<timestamp>`.
    - `date: string` – date ISO `YYYY-MM-DD` (comme les autres modules de l’app).
    - `durationMinutes: number` – durée en minutes (≥ 0, bornée par une validation métier côté UI pour éviter des valeurs aberrantes).
    - `pagesRead: number` – pages lues pendant la session (≥ 0).
    - `note: string` – mini‑note optionnelle.
  - ces objets restent **petits et purement JSON**, donc très peu coûteux en stockage et en I/O.

Ce schéma est volontairement conservateur : il reprend exactement ce que la V1 de `BooksTab` sait déjà gérer, afin d’éviter toute divergence entre UI, localStorage et IndexedDB.

##### 11.3.3 API Repository minimale (non branchée pour l’instant)

Pour ne pas coupler trop tôt la UI au backend IndexedDB, l’implémentation suit un pattern similaire à `useWorkoutData.openDB` :

- Module `src/utils/booksIndexedDB.js` (créé dans cette phase, non utilisé directement par `BooksTab` pour l’instant).
- Fonctions exposées :
  - `openBooksDB()` :
    - ouvre `WorkoutTrackerDB` via `indexedDB.open('WorkoutTrackerDB')`,
    - dans `onupgradeneeded`, crée le store `books` avec `keyPath: 'id'` s’il n’existe pas encore,
    - en cas d’erreur `VersionError`, suit la stratégie de `useWorkoutData` (suppression puis recréation contrôlée de la base) pour rester cohérent,
    - retourne `null` si IndexedDB n’est pas disponible, de sorte que l’appelant puisse basculer vers `localStorage`.
  - `getAllBooksFromIndexedDB()` :
    - lit toutes les entrées du store `books` dans une transaction `readonly`,
    - retourne `[]` en cas d’erreur, sans throw (robustesse).
  - `saveBooksToIndexedDB(books)` :
    - remplace l’ensemble du contenu du store `books` par la liste passée (stratégie **full replace** cohérente avec la façon dont `WorkoutContext` sauvegarde son état),
    - utilise une transaction `readwrite` avec `clear()` puis `put()` pour chaque livre,
    - ne jette pas d’exception vers l’extérieur : en cas de problème, l’appelant pourra s’appuyer sur `localStorage` comme aujourd’hui.
- Contraintes :
  - Aucun de ces appels n’est utilisé par la UI à ce stade → **zéro changement de comportement** pour l’utilisateur final.
  - Toutes les opérations sont pensées pour être **peu fréquentes** (synchronisation ponctuelle plutôt que écriture à chaque frappe), ce qui limitera la pression sur IndexedDB et sur le main thread.

Dans la prochaine sous‑phase (11.4), cette API sera enveloppée dans une façade `BooksStorageLayer` qui orchestrera :

- lecture prioritaire via IndexedDB (si disponible),
- fallback transparent vers `localStorage`,
- et option de “synchronisation manuelle” ou automatique entre les deux, tout en restant parfaitement compatible avec l’export JSON existant dans `SettingsTab` (ajout soigné d’un bloc `booksData` dans l’export global uniquement une fois le modèle stabilisé).


### 12. Spécification d’un onglet Livres « 100/100 » (performance, intelligence, logique, UX)

Cette section décrit la version **cible** de l’onglet Livres dans le projet React Workout Tracker : un onglet au moins aussi riche que la version Vue décrite plus haut, mais conçu pour obtenir une note **100/100** sur :

- **Performance** : temps de réponse, consommation mémoire, I/O disques (IndexedDB/localStorage) minimales.
- **Intelligence** : modèle de données bien pensé, exports/imports robustes, statistiques utiles, structure prête pour IA/reco.
- **Logique / architecture** : séparation claire des responsabilités, facilité de test, compatibilité ascendante.
- **Interactivité / visuel** : UX fluide, animations maîtrisées, lisibilité, plaisir d’usage.

Cette spécification inclut un **état des lieux** de la situation actuelle (V1) et la liste structurée de tout ce qui reste à faire.

#### 12.1 État des lieux – où en est l’onglet Livres dans l’app React

**Ce qui existe déjà (V1 intégrée) :**

- **UI / UX :**
  - Un onglet `Livres` (`BooksTab.jsx`) intégré :
    - dans la barre de navigation globale (`Navigation.jsx`),
    - dans la barre de boutons de la page d’accueil (`HomePage.jsx`),
    - dans le routeur d’onglets (`App.jsx`, via `activeTab === 'books'`).
  - Un layout principal en 3 blocs :
    - Panneau de **formulaire livre** (création/édition).
    - Deux sections de type **carrousel horizontal** (scroll horizontal simple) pour :
      - Livres en cours (`status === 'in-progress'`),
      - Livres terminés (`status === 'completed'`).
    - Panneau de **détail du livre sélectionné** :
      - métadonnées (titre, auteur, année, pages, note perso, notes),
      - statistiques simples (temps total, pages lues, nombre de sessions),
      - historique des sessions de lecture + formulaire d’ajout de session.
  - Design cohérent avec le reste du site via les composants `Card`, `Button`, `Input`, `TextArea`, `Select`.

- **Modèle de données actuel :**
  - Côté UI :
    - `books: Book[]` dans l’état local du composant `BooksTab`.
    - `selectedBookId: string | null`.
    - `form` (livre courant) avec champs : `id`, `title`, `author`, `year`, `pages`, `status`, `personalScore`, `notes`.
    - `sessionForm` (session de lecture) avec champs : `date`, `durationMinutes`, `pagesRead`, `note`.
  - Chaque `Book` contient un tableau `readingSessions`, chaque session étant un objet léger (date/durée/pages/note).

- **Persistance :**
  - **LocalStorage** via `booksStorage.js` :
    - `loadBooks()` lit depuis `momentum_books`.
    - `saveBooks(books)` sérialise en JSON (en excluant les éventuels champs volatils).
    - `exportBooks(books)` génère un fichier JSON avec un petit wrapper `{ version, exportedAt, books: [...] }`.
    - `importBooksFromFile(file)` lit un fichier JSON et renvoie `books`.
  - Le stockage est **isolé** de `WorkoutTrackerDB` (workouts) et des repositories Nutrition / Garmin.

- **IndexedDB (pré‑travail) :**
  - Module `booksIndexedDB.js` déjà posé :
    - `openBooksDB()` traverse `WorkoutTrackerDB` et garantit l’existence d’un store `books`.
    - `getAllBooksFromIndexedDB()` et `saveBooksToIndexedDB(books)` fournissent une API minimale, robuste, mais **non branchée** à la UI.

- **i18n :**
  - Namespace `books` reconnu dans `useTranslation`.
  - Fichiers `fr/books.json` et `en/books.json` présents, plus un fallback complet des clés `books.*` dans l’ancien système (`translations.js`), ce qui rend l’onglet Livres compatible avec le validateur et le hot‑reload i18n.

**Limites actuelles (V1) :**

- **Performance :**
  - Sauvegarde à chaque changement d’état `books` (useEffect → `saveBooks`) sans stratégie fine de debounce/throttle (acceptable pour V1, mais améliorable).
  - Pas encore de séparation claire entre stockage en mémoire, localStorage et IndexedDB (couche d’orchestration manquante).
  - Pas de pagination réelle ni de virtualisation : carrousels simples, ce qui suffit pour quelques dizaines/centaines de livres, mais pas encore pour des milliers.

- **Intelligence / export :**
  - Export JSON dédié Livres rudimentaire (un seul format, sans métadonnées élaborées, sans versioning structuré).
  - Aucune intégration dans l’export global (`SettingsTab.exportAllData`) → l’onglet Livres n’apparaît pas encore dans les backups “complets” de l’app.
  - Pas de système avancé de **migration** de versions du schéma Livres (contrairement à `BodyTracking`).

- **Stack avancé Vue non encore porté :**
  - Pas encore :
    - de stockage des PDFs dans IndexedDB,
    - de stockage des couvertures/images optimisées dans IndexedDB,
    - de système de sauvegarde multi‑formats (CSV/XML/ZIP simulé),
    - de sphère 3D (DomeGallery) pour visualiser les livres,
    - ni d’intégration avec un système d’intégrité / réparation comme `dataIntegrity.js`.

En résumé : on a une **V1 saine, simple, robuste**, mais encore loin de la vision finale “mini‑plateforme Livres” décrite dans la partie Vue / sauvegarde avancée.

#### 12.2 Vision cible – À quoi ressemble un onglet Livres « 100/100 »

L’onglet idéal doit être :

- **Performant** :
  - Chargement initial rapide, même avec plusieurs milliers de livres et de sessions.
  - I/O IndexedDB **regroupées et débouncées** (pattern similaire à `useWorkoutData.autoSave`).
  - Export/import **stream‑friendly** (formats maîtrisés, compressions optionnelles) qui ne bloquent pas le main thread inutilement.

- **Intelligent** :
  - Modèle de données capable de supporter :
    - tags, genres, séries, recommandations futures,
    - liens vers PDFs, couvertures optimisées, métadonnées enrichies (pages, langue, éditeur, etc.),
    - statistiques avancées (temps de lecture par jour/semaine/mois, productivité, habitudes horaires).
  - Système de sauvegarde avancé inspiré de `BodyTrackingExportImport` :
    - versioning explicite (`booksExportVersion`),
    - validation stricte des données à l’import,
    - migration automatique des anciennes versions,
    - métadonnées complètes (nombre de livres, sessions, plage de dates, tailles approximatives, etc.).
  - API de stockage modulable :
    - `BooksRepository` capable de travailler avec :
      - IndexedDB (backend principal),
      - localStorage (fallback, mode “essentiel”),
      - export/import JSON (sauvegardes offline).

- **Logique / architecture** :
  - Séparation nette entre :
    - `BooksTab` (pure UI + logique de présentation),
    - `BooksStorageLayer` (orchestration entre mémoire / IndexedDB / localStorage),
    - `BooksRepository` IndexedDB (accès bas niveau),
    - modules d’export/import (`booksExportImport.js`) alignés sur le pattern `BodyTrackingExportImport`.
  - Intégration propre avec :
    - `WorkoutContext` (sans le polluer, via un sous‑contexte ou un hook spécialisé),
    - `SettingsTab` pour les exports/imports globaux,
    - le système de logs / erreurs existant.

- **Interactivité / visuel** :
  - UI claire, évolutive, avec :
    - carrousels fluides (scroll custom amélioré, touche clavier, drag sur mobile).
    - transitions douces mais **peu coûteuses** (opacity/transform seulement).
  - À terme, une **vue 3D** (type DomeGallery) soignée :
    - intégration progressive pour ne pas alourdir le main bundle,
    - chargement lazy et débrayable sur options (pour préserver les machines modestes).

#### 12.3 Design optimisé – Architecture cible (minimal mais exceptionnel)

Pour atteindre cette vision sans surcharger le navigateur, on propose une trajectoire par couches :

1. **Couche Repository IndexedDB (backend local robuste)**  
   - Évoluer de `booksIndexedDB.js` vers un vrai `BooksRepository` :
     - `getAllBooks()`, `saveAllBooks()`, `getBookById()`, `upsertBook()`, `deleteBook()`.
     - Gestion fine des erreurs (détection corruption, fallback, logs).
     - Support d’index additionnels réfléchis (par `status`, par `createdAt`) pour les futures stats, sans surindexer.

2. **Couche `BooksStorageLayer` (orchestrateur intelligent)**  
   - Un module (ou hook) responsable de :
     - charger les livres au démarrage :
       - tenter IndexedDB → si échec, basculer sur localStorage → sinon, état initial vide.
     - maintenir un **état en mémoire** (React) qui sert de source de vérité pour la UI.
     - déclencher des sauvegardes :
       - vers IndexedDB avec **debounce** (ex. 500–1000 ms) et détection de modifications réelles (comme `autoSave`),
       - vers localStorage en backup léger (structure compacte).
     - orchestrer import/export :
       - import dédié Livres → map vers le format interne → écriture dans repository + mise à jour de l’état mémoire,
       - export dédié Livres → lecture repository + enrichissement métadonnées → génération du fichier.

3. **Couche Export/Import avancée (`booksExportImport.js`)**  
   - Calquée sur `BodyTrackingExportImport` :
     - `BOOKS_EXPORT_VERSION` (ex. `'1.0'` → `2.0` plus tard).
     - `prepareBooksExportData(books, options)` :
       - normalise les livres et sessions (dates ISO, tags, etc.),
       - calcule métadonnées (total livres, sessions, plage de dates, distribution des statuts, tailles estimées),
       - supporte options (inclure/exclure sessions, inclure métadonnées, etc.).
     - `validateBooksData(data)` :
       - vérifie structure, types, valeurs extrêmes,
       - retourne `{ valid, errors, warnings, stats }`.
     - `migrateBooksImportData(importedData)` :
       - gère anciens schémas (ex. V1 sans `createdAt`/`updatedAt`),
       - s’assure que les champs critiques existent avec valeurs par défaut.
     - `processBooksImportData(importedData, options)` :
       - parse JSON si nécessaire,
       - valide version,
       - migre,
       - retourne un objet prêt à être persisté dans le repository.

4. **Intégration dans `SettingsTab` (export/import global)**  
   - Ajout d’un bloc `booksData` dans l’export global :
     - récupéré via `BooksStorageLayer` ou directement via `BooksRepository`,
     - enrichi de métadonnées (nombre de livres, sessions, date range, etc.).
   - Option d’**import global** qui sait aussi restaurer les livres si présents.
   - Respect stricte des erreurs : si l’import Livres échoue, ne pas casser le reste (Nutrition, Workouts…).

5. **Améliorations UI progressives**  
   - Optimiser les carrousels :
     - limiter le nombre d’éléments montés (ex. windowing simple),
     - ajouter raccourcis clavier (←/→), pagination, badges de statut.
   - Ajouter petit à petit :
     - filtres avancés (statut, auteur, année, tags),
     - tri (par date, note, temps total de lecture).
   - Préparer un **point d’extension** pour la vue 3D (sphère) :
     - composant séparé, lazy‑loaded,
     - API claire (`books` + callback `onBookOpen`), déjà décrite dans la doc Vue.

#### 12.4 Plan d’action – ce qu’il reste à faire (synthèse)

À partir de l’état actuel et du design cible, les grandes étapes sont :

1. **Finaliser `BooksStorageLayer`** (Phase 11.4 à écrire puis implémenter) :
   - Hook ou module qui :
     - au montage : charge les livres via IndexedDB → fallback localStorage,
     - expose une API simple à `BooksTab` (`books`, `upsertBook`, `deleteBook`, `addSession`, etc.),
     - gère les sauvegardes avec debounce et contrôles d’intégrité basiques.

2. **Créer `booksExportImport.js`** :
   - Copier les patterns de `BodyTrackingExportImport` (validation, migration, métadonnées, taille estimée, logs de debug),
   - fournir :
     - `prepareBooksExportData(books, options)`,
     - `processBooksImportData(importedData, options)`.

3. **Brancher Livres dans `SettingsTab`** :
   - Ajouter un bloc `booksData` dans `exportAllData` (avec métadonnées propres),
   - Ajouter, plus tard, une option d’import global Livres (ou un bouton dédié 'Import Livres').

4. **Améliorer progressivement l’UX de `BooksTab`** :
   - Carrousels plus intelligents (windowing, tri, filtres),
   - gestion d’états de chargement (spinner discret pendant les grosses opérations d’import/export),
   - ouverture vers la future vue 3D via un onglet ou une section dédiée.

5. **Étendre le modèle de données Livres** sans casser l’existant :
   - Ajouter prudemment :
     - tags, genres, langue, lien vers PDF/couverture,
     - champs techniques pour intégration IA (scores, embeddings, etc.),
   - toujours via des migrations explicites dans `migrateBooksImportData`.

Chaque sous‑étape sera documentée dans de nouvelles sous‑sections (11.4, 11.5, 12.5, etc.) avant toute implémentation, pour rester en phase avec le mot d’ordre : **prendre son temps et viser la justesse parfaite** à chaque caractère ajouté.

