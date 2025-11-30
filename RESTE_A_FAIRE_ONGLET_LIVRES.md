# 📋 Ce qui reste à faire - Onglet Livres

## ✅ Déjà terminé (selon le spec)

1. **Couche de persistance (`useBooksStorage`)** - ✅ Terminé
2. **Module d'export/import avancé (`booksExportImport.js`)** - ✅ Terminé
3. **UX chargement** - ✅ Terminé
4. **Export Livres dédié enrichi** - ✅ Terminé
5. **Stats avancées dans le panneau de détail** - ✅ Terminé
6. **Stockage des assets (PDFs, couvertures)** - ✅ Terminé
7. **Vue 3D `BooksDomeGallery`** - ✅ Terminé (mais on ne touche plus à ça)

---

## ❌ Ce qui reste à faire

### 1. **Intégration Livres dans l'export global (`SettingsTab`)** - 🔴 Priorité haute

**Référence** : `SPEC_ONGLET_LIVRES.md` section 8.2

**Objectif** : Faire en sorte que les données Livres soient incluses dans l'export global depuis les paramètres.

**À implémenter** :

- Dans `SettingsTab.jsx`, dans la fonction `exportAllData` :
  - Récupérer les livres via `getAllBooksFromIndexedDB()` (avec fallback `loadBooks()` depuis localStorage)
  - Appeler `prepareBooksExportData(books, { includeSessions: true, includeMetadata: true })`
  - Ajouter `booksData` dans l'objet d'export global
  - Ajouter `booksSummary` dans les métadonnées globales (nombre de livres, sessions, plage de dates, etc.)
  - **Important** : Si la récupération Livres échoue, l'export global ne doit PAS échouer (logger un warning, mettre `booksData: null`)

**Fichiers à modifier** :
- `src/components/tabs/SettingsTab.jsx`
- Importer depuis `src/utils/booksExportImport.js` : `prepareBooksExportData`
- Importer depuis `src/utils/booksIndexedDB.js` : `getAllBooksFromIndexedDB`
- Importer depuis `src/utils/booksStorage.js` : `loadBooks` (fallback)

---

### 2. **Import global avec Livres** - 🟡 Priorité moyenne

**Référence** : `SPEC_ONGLET_LIVRES.md` section 3.4

**Objectif** : Permettre l'import global depuis les paramètres qui inclut les données Livres.

**À implémenter** :

- Dans `SettingsTab.jsx`, dans les fonctions `previewImportAllData` et `confirmImportAllData` :
  - Détecter la présence de `booksData` dans le fichier importé
  - Appeler `processBooksImportData` pour valider et migrer les données
  - Si valide, appeler `saveBooksToIndexedDB` et `saveBooks` (localStorage)
  - Afficher un aperçu des livres à importer dans `allDataPreviewData`
  - Gérer les erreurs gracieusement (ne pas faire échouer l'import global si les livres échouent)

**Fichiers à modifier** :
- `src/components/tabs/SettingsTab.jsx`
- Importer depuis `src/utils/booksExportImport.js` : `processBooksImportData`
- Importer depuis `src/utils/booksIndexedDB.js` : `saveBooksToIndexedDB`
- Importer depuis `src/utils/booksStorage.js` : `saveBooks`

---

### 3. **Améliorations UX - Windowing/Pagination des carrousels** - 🟡 Priorité moyenne

**Référence** : `SPEC_ONGLET_LIVRES.md` section 4.1 et 6.4

**Objectif** : Optimiser l'affichage des carrousels pour les grandes bibliothèques.

**À implémenter** :

- Actuellement, il y a une pagination basique (`PAGE_SIZE = 30`), mais on pourrait :
  - Implémenter un vrai windowing (n'afficher que les cartes visibles + quelques-unes de chaque côté)
  - Ajouter des indicateurs de pagination plus visibles
  - Améliorer la navigation au clavier (←/→) dans les carrousels

**Fichiers à modifier** :
- `src/components/tabs/BooksTab.jsx`

**Note** : Cette amélioration est optionnelle si les performances actuelles sont suffisantes.

---

### 4. **Améliorations UX - Raccourcis clavier** - 🟢 Priorité basse

**Référence** : `SPEC_ONGLET_LIVRES.md` section 4.1

**Objectif** : Permettre la navigation au clavier dans les carrousels.

**À implémenter** :

- Ajouter des event listeners pour les touches ←/→ dans les carrousels
- Permettre de naviguer entre les livres avec le clavier
- Peut-être ajouter d'autres raccourcis (Escape pour fermer, Enter pour sélectionner, etc.)

**Fichiers à modifier** :
- `src/components/tabs/BooksTab.jsx`

---

### 5. **Tests unitaires** - 🟡 Priorité moyenne

**Référence** : `SPEC_ONGLET_LIVRES.md` section 7.1

**Objectif** : Ajouter des tests pour garantir la qualité du code.

**À implémenter** :

- Tests pour `booksExportImport.js` :
  - Validation de données valides/invalides
  - Migration de versions anciennes
  - Cohérence des métadonnées
- Tests pour `useBooksStorage` :
  - Comportement de chargement avec différents scénarios (IndexedDB OK, fallback localStorage, aucun)
- Tests pour `booksIndexedDB.js` :
  - Création/lecture/mise à jour/suppression de livres
  - Comportement en cas de base vide/non disponible

**Fichiers à créer/modifier** :
- `src/utils/booksExportImport.test.js`
- `src/hooks/useBooksStorage.test.js`
- `src/utils/booksIndexedDB.test.js`

**Note** : Des tests existent déjà pour `BooksDomeGallery` (`buildDomeItems`, `clamp`), mais on ne touche plus à la galerie 3D.

---

### 6. **Améliorations futures (optionnelles)** - 🔵 Priorité très basse

**Référence** : `SPEC_ONGLET_LIVRES.md` section 4.2

**Objectif** : Améliorer progressivement l'UX sans casser l'existant.

**Idées** :
- Ajouter des métriques intelligentes supplémentaires dans le panneau de détail
- Améliorer les messages d'erreur (toasts au lieu d'alertes)
- Ajouter des filtres avancés (par genre, année, score, etc.) - **Déjà partiellement implémenté**
- Améliorer le tri (plus d'options)

**Note** : Ces améliorations sont optionnelles et peuvent être faites progressivement.

---

## 📊 Résumé des priorités

### 🔴 Priorité haute (à faire en premier)
1. **Intégration Livres dans l'export global** - Section 1

### 🟡 Priorité moyenne (à faire ensuite)
2. **Import global avec Livres** - Section 2
3. **Tests unitaires** - Section 5
4. **Windowing/Pagination des carrousels** - Section 3 (si nécessaire)

### 🟢 Priorité basse (améliorations optionnelles)
5. **Raccourcis clavier** - Section 4
6. **Améliorations futures** - Section 6

---

## 🎯 Prochaines étapes recommandées

1. **Commencer par l'intégration dans l'export global** (section 1) car c'est mentionné comme priorité dans le spec et c'est une fonctionnalité importante pour la cohérence des backups.

2. **Ensuite, implémenter l'import global** (section 2) pour compléter le cycle export/import.

3. **Puis, ajouter des tests** (section 5) pour garantir la robustesse du code.

4. **Enfin, améliorer l'UX** (sections 3, 4, 6) selon les besoins et le temps disponible.

---

## 📝 Notes importantes

- **On ne touche plus à la galerie 3D** : La vue 3D est terminée et fonctionnelle selon le spec. Aucune modification n'est nécessaire.

- **Compatibilité** : Toutes les modifications doivent rester compatibles avec l'existant et ne pas casser les fonctionnalités actuelles.

- **Performance** : Garder en tête les contraintes de performance mentionnées dans le spec (debounce, pas de JSON.stringify gigantesques, etc.).

