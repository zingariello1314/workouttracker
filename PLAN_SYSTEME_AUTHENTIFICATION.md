## 🎯 Objectif global

Mettre en place un **système complet de création de compte / connexion** pour Momentum, parfaitement intégré au design actuel, **100 % fonctionnel en local**, extensible plus tard vers une vraie synchronisation multi‑appareils, et accessible depuis :

- **Le header global (toutes les pages sauf la page d’accueil)**  
  - Afficher un bouton **« Se connecter »** si l’utilisateur n’est pas connecté.  
  - Afficher **le nom du compte + un petit avatar rond** si l’utilisateur est connecté (avatar modifiable depuis les paramètres).

- **La page d’accueil**  
  - Le bouton actuel **« Commencer l’entraînement »** doit :  
    - **Rediriger vers la page de connexion / création de compte** si l’utilisateur n’est pas connecté.  
    - Afficher **« Accéder à l’onglet Aujourd’hui »** si l’utilisateur est déjà connecté, et rediriger directement vers cet onglet.  
  - Corriger le problème visuel actuel : le bouton est **coupé en bas** → ajuster la hauteur du bloc / padding pour qu’il soit toujours complètement visible, même en 1080p et avec la barre Windows.

---

## 1. Exigences fonctionnelles

### 1.1. Création de compte

- **Champs minimum** :
  - Nom d’utilisateur (unique, ex. `MomentumUser`).
  - Adresse e‑mail (optionnelle dans un premier temps, mais prévue dans le modèle).
  - Mot de passe.
- **Règles mot de passe** :
  - Longueur minimale (ex. 8–10 caractères).
  - Optionnel : mélanger majuscules / minuscules / chiffres / caractères spéciaux.
- **Validation** :
  - Vérifier que le nom de compte n’est pas déjà pris.
  - Afficher des messages clairs d’erreur (mot de passe trop court, confirmation différente, etc.).
- **Persistance** :
  - Sauvegarder le compte en **IndexedDB** (pas de localStorage volumineux).
  - Stocker uniquement **un hash sécurisé du mot de passe** (jamais le mot de passe en clair).

### 1.2. Connexion

- Formulaire avec : nom d’utilisateur + mot de passe.
- Vérification du hash du mot de passe côté client.
- En cas de succès :
  - Stocker l’**ID de l’utilisateur connecté** dans une petite structure de session (voir 2.2).
  - Mettre à jour le contexte global (`AuthContext`) pour que tout le site sache que l’utilisateur est authentifié.

### 1.3. Déconnexion

- Bouton **« Se déconnecter »** disponible :
  - Dans un menu utilisateur (cliquer sur l’avatar / nom dans le header).
  - Éventuellement dans l’onglet Paramètres.
- Effets :
  - Vider la session (ID utilisateur courant).
  - Revenir à l’état « non connecté » (boutons « Se connecter » / « Commencer l’entraînement » redeviennent des CTA vers la page de connexion).

### 1.4. Avatar et profil

- Dans l’onglet Paramètres :
  - Section **« Profil »** avec :
    - Champ « Nom d’utilisateur » (non modifiable ou modifiable avec vérification de l’unicité).
    - Upload d’une **image d’avatar** (PNG/JPEG).
  - Stockage de l’avatar en **IndexedDB** (comme les covers de livres) + mise en cache mémoire pour les performances.
- Dans le header :
  - Afficher un **petit rond** (32–40 px) avec l’avatar.
  - Si pas d’avatar → utiliser une couleur de fond + initiale du nom (ex. « M » pour MomentumUser).

---

## 2. Modèle de données & persistance

### 2.1. IndexedDB – nouvelle base / nouveaux stores

- Nouveau store dédié dans la base existante (ex. `WorkoutTrackerAuthDB` ou store `users` dans une base partagée) :
  - `users` :
    - `id` (string, UUID).
    - `username` (string, unique, indexé).
    - `email` (string, optionnel).
    - `passwordHash` (string, hex/base64).
    - `passwordSalt` (string, hex/base64).
    - `avatarId` (string | null) → clé vers le store des avatars.
    - `createdAt`, `updatedAt`.
  - `userAvatars` :
    - `id` (string, UUID).
    - `userId`.
    - `blob` (Blob image).
    - `mimeType`.

> Important : rester cohérent avec l’architecture déjà utilisée pour les **covers de livres** et les **PDF**, pour bénéficier des mêmes mécanismes de cache et de nettoyage.

### 2.2. Gestion de la session

- Nouvelle clé/session minimaliste :
  - En IndexedDB : store `authState` avec une seule entrée `{ id: 'current', userId: 'xxx' }`.
  - En localStorage (optionnel) : une clé très légère (`momentum:currentUserId`) uniquement pour accélérer la détection initiale (aucun risque de saturation, car taille très faible).
- **Au chargement de l’app** :
  - Lire `authState` (ou la clé localStorage si présente).
  - Recharger les infos du user correspondant dans IndexedDB.
  - Hydrater le contexte `AuthContext` avec `currentUser`.

---

## 3. Architecture React

### 3.1. Contexte d’authentification

- Nouveau fichier `src/context/AuthContext.jsx` (ou équivalent) :
  - État exposé :
    - `currentUser` (objet complet ou `null`).
    - `isAuthenticated` (booléen).
  - Méthodes :
    - `register({ username, email, password })`.
    - `login({ username, password })`.
    - `logout()`.
    - `updateProfile(partialUser)` (changement de nom, email).
    - `updateAvatar(file)` (upload et mise à jour de l’avatar).
  - Toute la logique IndexedDB / hash / persistance encapsulée dans :
    - `src/hooks/useAuthStorage.js` (similaire à `useBooksStorage`).

### 3.2. Navigation & pages

- **Nouvelle page** `LoginPage` (ou `AuthPage`) :
  - Deux onglets / blocs :
    - **Se connecter**.
    - **Créer un compte**.
  - Design cohérent avec le style « liquid glass » / Momentum.
  - Redirection après succès :
    - Par défaut vers **l’onglet « Aujourd’hui »**.
    - Possibilité de supporter un `redirectTo` (ex. si plus tard on protège d’autres routes).

---

## 4. Intégration dans l’UI existante

### 4.1. Header global (hors page d’accueil)

- Composant concerné : `Header` / `Navbar` (à confirmer dans le code).
- Comportement :
  - **Non connecté** :
    - Afficher un bouton **« Se connecter »** (style proche du bouton violet « Commencer »).
    - Clic → navigation vers `LoginPage`.
  - **Connecté** :
    - Afficher à droite :
      - Un petit avatar rond.
      - Le nom d’utilisateur à côté (ou dans un petit pill).
    - Clic → ouvrir un petit **menu déroulant** :
      - « Accéder à Aujourd’hui ».
      - « Paramètres ».
      - Séparateur.
      - « Se déconnecter ».

### 4.2. Page d’accueil – bouton principal

- Bouton actuel : **« Commencer l’entraînement »**.
- Nouveau comportement :
  - **Non connecté** :
    - Texte : **« Commencer l’entraînement »** (inchangé pour le marketing).
    - Clic → navigation vers `LoginPage`.
  - **Connecté** :
    - Texte : **« Accéder à l’onglet Aujourd’hui »**.
    - Clic → navigation directe vers l’onglet « Aujourd’hui » (onglet déjà existant dans l’app).
- Correction visuelle :
  - Adapter le conteneur du CTA (section de gauche) :
    - Augmenter le `padding-bottom`.
    - Garantir une **hauteur minimale** de la section (`min-height`) suffisante pour que le bouton ne soit jamais coupé (en tenant compte de la barre des tâches Windows + éventuelles barres de navigateur).
    - Vérifier le comportement en 16:9, 1080p, 1440p et 4K.

---

## 5. Sécurité (côté front, sans backend)

### 5.1. Hash du mot de passe

- Utiliser l’API **Web Crypto** (`window.crypto.subtle`) :
  - Générer un **salt** aléatoire (16–32 octets).
  - Combiner `password + salt` et appliquer `SHA-256` (ou idéalement PBKDF2 si possible côté front).
  - Stocker :
    - `passwordSalt` (base64 ou hex).
    - `passwordHash`.
- À la connexion :
  - Refaire le même calcul avec le salt stocké.
  - Comparer avec le hash enregistré.

> Bien sûr, sans backend, on ne peut pas atteindre le niveau de sécurité d’un vrai serveur, mais c’est suffisant pour un **mode local / mono‑machine** avec plusieurs profils.

### 5.2. Protection de la session

- Ne jamais stocker le mot de passe ni le hash dans `localStorage`.
- Stocker uniquement l’**ID utilisateur courant**.
- Prévoir une option « se souvenir de moi » (session persistante) ou non (session volatile effacée à chaque fermeture).

#### 5.2.1. Comportement exact du « Se souvenir de moi »

- Sur le formulaire de connexion, ajouter une case à cocher **« Se souvenir de moi sur cet appareil »**.
- Deux comportements bien distincts :
  - **Case cochée** → session **persistante** :
    - Sauvegarder `currentUser.id` dans :
      - `authState` (IndexedDB) **avec un flag** `rememberMe: true`.
      - ET une clé très légère dans `localStorage` (ex. `momentum:rememberedUserId = <id>`).
    - Au chargement de l’app (même après redémarrage du serveur ou fermeture de l’onglet) :
      - Lire d’abord la clé `momentum:rememberedUserId`.
      - Si elle existe → recharger l’utilisateur correspondant dans IndexedDB et ré‑hydratér `AuthContext` → l’utilisateur est **considéré comme connecté automatiquement**.
  - **Case non cochée** → session **volatile** :
    - Sauvegarder `currentUser.id` uniquement dans `authState` (IndexedDB) **sans** écrit dans `localStorage`.
    - Si on ferme complètement l’onglet / redémarre le serveur, la session est considérée comme expirée → il faudra se reconnecter.

- Dans tous les cas :
  - `logout()` doit :
    - Effacer l’entrée `authState`.
    - Supprimer la clé `momentum:rememberedUserId` de `localStorage`.
    - Remettre `currentUser` à `null` dans `AuthContext`.

#### 5.2.2. Robustesse face aux redémarrages / changements de version

- Si la clé `momentum:rememberedUserId` existe mais que l’utilisateur correspondant n’est plus trouvé dans IndexedDB (changement de version, nettoyage, etc.) :
  - Ne pas planter l’app.
  - Supprimer silencieusement la clé de `localStorage`.
  - Forcer un `logout()` propre (retour à l’état non connecté).

> Résultat : si la case « Se souvenir de moi » est cochée, **le dernier compte connecté reste loggé**, même après fermeture du navigateur ou redémarrage du serveur de dev.

### 5.3. Logging & observabilité spécifiques à l’auth

- Utiliser le **logger déjà présent** dans le projet avec un namespace dédié, par exemple :
  - `[auth]` pour les actions globales (login, logout, auto‑login, échecs).
  - `[auth-migration]` pour la migration des données existantes (`linkAnonymousDataToUser`).
- Règles :
  - **Uniquement en développement** (`process.env.NODE_ENV === 'development'`) pour ne pas polluer la console en prod.
  - Ne jamais logguer :
    - Les mots de passe (même hashés).
    - Les salts.
  - On peut logguer :
    - L’`id` utilisateur (tronqué si nécessaire), le type d’action, le temps que prend une migration par batch, si un auto‑login a réussi ou non, etc.
- Exemples de logs utiles :
  - `[auth] login success userId=... rememberMe=true`
  - `[auth] auto-login from localStorage userId=...`
  - `[auth-migration] start for userId=...`
  - `[auth-migration] batch 3/12 (600 records migrated)`
  - `[auth] logout userId=...`

### 5.4. Préparation à un futur backend

- Garder une séparation stricte :
  - `AuthContext` = API utilisée par toute l’app.
  - `useAuthStorage` = implémentation locale (IndexedDB).
- Si un backend est ajouté plus tard :
  - Seule `useAuthStorage` changera (appel HTTP au lieu de lecture IndexedDB).
  - L’UI (header, home, LoginPage, onglet Aujourd’hui) ne devra pas être modifiée.

---

## 6. Plan d’implémentation détaillé

### Étape 1 – Base technique (back‑end local)

1. ✅ Créer `src/utils/authIndexedDB.js` :
   - Fonctions : `createUser`, `getUserByUsername`, `getUserById`, `updateUser`, `saveAvatar`, `getAvatarByUserId`, `saveAuthState`, `getAuthState`, `clearAuthState`.
2. ✅ Implémenter la couche de hash (utilitaire `hashPassword(password, salt)` + `generateSalt()` dans `src/utils/authCrypto.js`).

### Étape 2 – Contexte & hooks

3. ✅ Créer `AuthContext` + hook `useAuth()` :
   - Gérer `currentUser`, `isAuthenticated`, `loading`, `error`, `rememberMe`.
   - Exposer `register`, `login`, `logout`, `updateProfile`, `updateAvatar`, `linkAnonymousDataToUser`.
4. ✅ Intégrer le provider `AuthProvider` autour de l’app (au même niveau que `WorkoutProvider` et `LanguageProvider`).

### Étape 3 – Pages & navigation

5. ✅ Créer `LoginPage` (`src/components/AuthPage.jsx`) :
   - Deux onglets : **Connexion** / **Créer un compte**.
   - Appelle `auth.register` ou `auth.login`, gère la case « Se souvenir de moi ».
6. ✅ Mettre à jour le routeur / logique de tabs :
   - Nouveau tab interne `auth` rendu par `AuthPage`.
   - Redirection vers l’onglet « Aujourd’hui » lorsque `isAuthenticated === true`.

### Étape 4 – Intégration UI

7. ✅ **Header global** :
   - Remplacer le bouton « Commencer » par :
     - `Se connecter` si `!isAuthenticated` → ouvre l’onglet `auth`.
     - Avatar rond + `username` + bouton « Se déconnecter » si `isAuthenticated`.
8. ✅ **Page d’accueil** :
   - Bouton principal dynamique :
     - Texte traduit existant (`home.cta`) si non connecté.
     - Texte « Accéder à l’onglet Aujourd’hui » si connecté.
   - Clic :
     - Non connecté → navigation vers l’onglet `auth`.
     - Connecté → navigation directe vers l’onglet `today`.
   - Le bouton est déjà hors de tout clipping (padding / min-height ajustés dans la refonte précédente).

### Étape 5 – Paramètres & avatar

9. ✅ Dans l’onglet Paramètres :
   - Section « Profil » :
     - Affichage du nom d’utilisateur courant.
     - Upload / changement d’avatar (avec prévisualisation locale).
10. ✅ Propager l’avatar mis à jour dans le header :
   - Header charge l’avatar depuis IndexedDB (`getAvatarByUserId`) et l’affiche dans le rond au lieu de l’initiale si disponible.

### Étape 6 – Tests & robustesse

11. Tester les cas suivants :
   - Création de compte (username déjà pris / mot de passe trop court).
   - Connexion avec mauvais mot de passe.
   - Rafraîchissement de la page : l’utilisateur reste connecté.
   - Déconnexion : retour à l’état non connecté partout (header + home).
12. Tester en conditions réelles :
   - IndexedDB désactivé / en erreur → messages d’erreur propres, UI qui reste utilisable (au minimum en mode dégradé).
   - Récupération d’une session corrompue → forcer un `logout()` et revenir proprement à l’état non connecté.

### 6.1. Tests unitaires et d’intégration à prévoir

- **Tests unitaires purs (logique)** :
  - ✅ `hashPassword / verifyPassword` (`src/utils/authCrypto.test.js`) :
    - Même mot de passe + même salt → même hash.
    - Mot de passe différent OU salt différent → hash différent.
    - Vérifie que `verifyPassword` retourne `true` pour les bons identifiants et `false` sinon.
  - ✅ `linkAnonymousDataToUser` (via `migrateDataToUser` testé dans `src/utils/authMigration.test.js`) :
    - Données (livres) sans `userId` → reçoivent `userId = X`.
    - Données avec `userId` déjà défini → restent inchangées.
    - Le résultat retourne `migratedBooks` pour refléter le nombre d’éléments migrés et un `success` cohérent même en cas d’échec de sauvegarde.

- **Tests d’intégration (avec IndexedDB mocké ou environnement de test)** :
  - Scénario « rememberMe + redémarrage → auto‑login » :
    1. Simuler un login avec `rememberMe = true`.
    2. Vérifier que `authState` et `momentum:rememberedUserId` sont bien écrits.
    3. Simuler un « redémarrage » (nouvelle initialisation d’`AuthContext`).
    4. Vérifier que `currentUser` est automatiquement hydraté et que `isAuthenticated === true`.
  - Scénario « rememberMe décoché » :
    - Après redémarrage, `currentUser` doit être `null` et la clé `momentum:rememberedUserId` absente.
  - Scénario de migration :
    - Créer un jeu de données Livres avec et sans `userId`.
    - Lancer `linkAnonymousDataToUser`.
    - Vérifier que seules les entrées sans `userId` ont été mises à jour et que `migratedBooks` reflète bien le nombre d’éléments migrés.

---

## 7. Résultat attendu

- **Expérience utilisateur** :
  - Depuis le header ou la page d’accueil, l’utilisateur peut **créer un compte, se connecter, se déconnecter**.
  - Si connecté, le site affiche **son nom + avatar** dans le header.
  - Le bouton de la home n’est plus jamais coupé et s’adapte à l’état de connexion.
- **Technique** :
  - Données d’authentification entièrement stockées en **IndexedDB**, optimisées pour rester légères.
  - Structure extensible pour un futur backend (synchronisation multi‑appareils) sans casser l’API interne (`AuthContext` / `useAuth`).


---

## 8. Stratégie de migration des données existantes vers un compte utilisateur

L’objectif est de te permettre :

- de **lier toutes tes données actuelles** (workouts, livres, nutrition, Garmin, etc.) à TON compte Momentum,  
- tout en gardant la possibilité de **montrer le site « vide »** ou avec des données de démo à d’autres personnes,  
- sans jamais perdre tes vraies données et sans casser les performances.

Cette section décrit une stratégie précise, performante et sûre pour y arriver.

### 8.1. Objectifs fonctionnels

- **O1 – Migration complète** : à tout moment, tu peux cliquer sur un bouton du type  
  **« Associer toutes mes données locales à mon compte »** → toutes les entrées existantes deviennent liées à ton `userId`.
- **O2 – Mode visiteur / démo** :
  - Pouvoir **cacher tes vraies données** et afficher un site « vierge » ou rempli de quelques données de démonstration.
  - Les visiteurs peuvent naviguer, tester l’UI, créer éventuellement des données temporaires **sans toucher à tes vraies données**.
- **O3 – Réversibilité contrôlée** :
  - Ne jamais effacer tes vraies données sans confirmation explicite.
  - Pouvoir retrouver **exactement ton environnement complet** après avoir quitté le mode démo.

### 8.2. Contraintes et principes

- Toutes les données sont déjà stockées en **IndexedDB** (plus éventuellement quelques miettes en localStorage).
- On ne veut pas dupliquer en permanence toutes les données (risque de saturation).
- On veut limiter au maximum les **opérations lourdes** (boucles complètes sur des milliers d’entrées) en les batchant.

Principe de base :

- Ajouter un champ optionnel `userId` dans chaque entité principale :
  - `workouts`, `sessions`, `books`, `nutritionEntries`, `bodyTrackingEntries`, etc.
- Introduire la notion de **profil système** :
  - `null` ou `undefined` → données « anonymes » actuelles (avant migration).
  - `userId = <id_compte>` → données liées à un utilisateur précis.
  - (Optionnel plus tard) `userId = 'demo'` → données de démonstration.

### 8.3. Modèle de données pour la migration

#### 8.3.1. Table de mapping de profils

Créer un petit store IndexedDB, par exemple `profilesMeta` :

- Clé : `'primaryUser'`, `'demoProfile'`, etc.
- Valeurs :
  - `primaryUserId`: l’`id` du compte qui doit recevoir toutes les anciennes données.
  - `demoEnabled`: booléen pour savoir si on est actuellement en mode démo.

Cela permet d’éviter de « hardcoder » un user particulier et de rester flexible.

#### 8.3.2. Marquage des enregistrements

Pour chaque store important :

- Ajouter un champ optionnel `userId`.
- Au moment de la migration :
  - Si `userId` est vide → on le remplit avec `primaryUserId`.
  - Si `userId` est déjà défini → on le laisse tel quel (cas où tu aurais déjà commencé à utiliser les comptes).

### 8.4. Algorithme de migration (vue développeur)

1. **Préparation** :
   - L’utilisateur est connecté → on a `currentUser.id`.
   - On stocke dans `profilesMeta.primaryUserId = currentUser.id`.
2. **Parcours batched par store** (pour limiter la mémoire et ne pas bloquer le thread) :
   - Pour chaque store (`workouts`, `sessions`, `books`, etc.) :
     - Ouvrir un **curseur** (`openCursor`) sur toutes les entrées.
     - Pour chaque entrée sans `userId` :
       - Mettre à jour l’objet : `record.userId = currentUser.id`.
       - `cursor.update(record)`.
     - Faire ça par **lots** (ex. 200–500 enregistrements), avec un `await new Promise(requestAnimationFrame)` entre les lots pour garder l’UI fluide.
3. **Fin de migration** :
   - Marquer dans `profilesMeta` un flag `initialMigrationDone = true`.
   - À partir de là, toutes les nouvelles écritures sont créées directement avec `userId = currentUser.id`.

### 8.5. Mode visiteur / démo

L’idée : **séparer l’affichage** des données de l’utilisateur courant et des données de démo, sans rien casser.

#### 8.5.1. Stratégie simple et robuste

- À l’état normal :
  - Si `isAuthenticated` → toutes les requêtes de données filtrent sur `userId = currentUser.id` (ou `userId` vide pour compat).
  - Si non connecté → on peut choisir :
    - Soit de ne rien charger (site vraiment vide).
    - Soit de ne charger que des données marquées `userId = 'demo'`.
- Activer un **mode démo** depuis les paramètres :
  - Bouton : « **Activer le mode visiteur / démo** ».
  - Effets :
    - Sauvegarder ton `currentUser.id` dans un endroit sûr (déjà le cas via `authState`).
    - **Se déconnecter proprement** via `logout()` : le header repasse en mode « Se connecter », les onglets se comportent comme pour un visiteur.
    - Optionnel : injecter quelques données de démo légères dans les différents stores avec `userId = 'demo'`.
  - Quand tu veux retrouver ton environnement :
    - Tu te reconnectes à ton compte → l’UI repasse sur tes vraies données (filtrées par `userId = tonId`).

Avantage :  
tu n’as pas besoin de copier / dupliquer toutes tes données ; on ne fait que **changer quel `userId` on filtre** dans les hooks de données.

#### 8.5.2. Option avancée : bascule rapide dans les paramètres

Dans l’onglet Paramètres, section « Profil / Données » :

- **Bouton 1 – Migrer mes données locales vers mon compte** :
  - N’apparaît que si on a trouvé des enregistrements sans `userId`.
  - Lance l’algorithme de migration décrit en 8.4.
  - Affiche une petite barre de progression (ex. « 3 200 / 10 000 entrées migrées… »).
- **Bouton 2 – Activer le mode visiteur / démo** :
  - Appelle `logout()` + (optionnel) injection de quelques données de démo.
  - Message clair : « Vos vraies données sont conservées, vous êtes maintenant en mode visiteur. »
- **Bouton 3 – Nettoyer les données de démo** (optionnel) :
  - Supprime toutes les entrées avec `userId = 'demo'` dans les stores (en batch).

### 8.6. Performance et sécurité

- **Performance** :
  - Parcours en **curseur + batch** pour ne jamais bloquer le main thread pendant trop longtemps.
  - Utilisation de `requestAnimationFrame` ou de petits `setTimeout` pour laisser respirer le rendu entre deux lots.
  - Journalisation légère (`console.log` seulement en dev) pour suivre la progression sans saturer la console.
- **Sécurité / intégrité des données** :
  - Toujours travailler sur des copies d’objets retournés par le curseur, ne jamais modifier une référence partagée.
  - En cas d’erreur pendant la migration, afficher un message clair (« Migration interrompue à X %, réessayez plus tard ») sans supprimer les données existantes.
  - Ne jamais supprimer automatiquement les vraies données utilisateur dans ce processus.

### 8.7. Intégration chronologique avec le reste du plan

1. **Mettre en place l’authentification** (sections 1 à 7) : comptes, login, avatar, header, bouton home.
2. **Ajouter le champ `userId`** dans les stores et adapter les hooks pour filtrer selon l’utilisateur courant.
3. **Implémenter la migration 8.4** :
   - Accessible depuis Paramètres → « Migrer mes données locales vers mon compte ».
4. **Mettre en place le mode visiteur / démo 8.5** :
   - Déconnexion + filtrage sur `userId = 'demo'` ou aucune donnée.
5. **Tester les scénarios** :
   - Site avec tes données → migration vers ton compte → mode visiteur → retour sur ton compte.

À la fin, tu auras :

- Un **compte personnel** qui regroupe toutes tes données actuelles.
- Un **site explorables par d’autres** sans exposer tes infos (mode visiteur).
- Une base parfaitement prête pour un futur backend multi‑appareils.

---

### 8.8. Couverture complète par onglet et gestion du contenu « en dur »

Pour garantir une migration **vraiment complète**, il faut lister, onglet par onglet, tout ce qui peut contenir des données saisies ou personnalisées, puis décider :
- si ces données doivent être **propres à un utilisateur** (donc migrées / filtrées par `userId`),
- ou si ce sont des **données système « en dur »** qui ne doivent être visibles que pour l’admin.

#### 8.8.1. Aujourd’hui / Saisie / Historique / Endurance / Statistiques

- Source principale : `WorkoutContext` (`data`, `updateData`, `useWorkoutData`).
- Contenu à migrer :
  - Exercices cochés, répétitions, étirements.
  - Historique complet (`historyReps`, historique programmes, etc.).
  - Données d’endurance (`enduranceData`, sessions, challenges).
  - Justifications de jours (`dayJustifications`).
- Stratégie :
  - Ajouter un champ `userId` au niveau racine des données stockées en DB (ou, plus simplement, une clé par utilisateur dans le store existant).
  - Lors du chargement via `useWorkoutData`, charger :
    - soit le « profil admin » (tes données actuelles),
    - soit un profil neutre / vide pour les autres comptes.
  - Lors de la migration, passer sur la structure persistée et taguer tout l’historique avec `userId = adminId`.

#### 8.8.2. Suivi corporel / BodyTracking

- Données : `progressPhotos`, `progressEntries`, `bodyTrackingReminders`, etc. (déjà centralisées dans la partie BodyTracking).
- Stratégie :
  - Introduire `userId` dans les structures stockées (photos + entrées).
  - Migration :
    - Toutes les photos / entrées actuelles → `userId = adminId`.
  - Filtrage :
    - Si connecté en admin → tu vois tout.
    - Autres comptes → listes filtrées sur leur propre `userId` (probablement vides au début).

#### 8.8.3. Livres (Books)

- Déjà partiellement traité dans `authMigration.js` (migration des livres sans `userId` vers `userId = adminId`).
- À étendre :
  - Associer aussi les **sessions de lecture** et les statistiques au `userId` si ce n’est pas déjà le cas dans les structures.
  - Vérifier que tous les chargements (`useBooksStorage`, `BooksTab`, `BooksDomeGallery`) filtrent bien les livres sur le `userId` courant.

#### 8.8.4. Nutrition

- Données gérées dans les hooks de nutrition (`useNutritionData*`, etc.) et stockées dans IndexedDB.
- Stratégie :
  - Identifier les stores principaux (meals, dailyMeals, programs, favorites…).
  - Ajouter un `userId` ou une clé de partition par utilisateur.
  - Migration :
    - Toutes les entrées actuelles → `userId = adminId`.
  - Filtrage au chargement : ne retourner que les données de l’utilisateur connecté.

#### 8.8.5. Garmin / Données de montres connectées

- Données très personnelles (calories, fréquence cardiaque, historique Garmin).
- Stratégie similaire :
  - Ajouter `userId` dans les stores Garmin.
  - Migrer tout l’historique actuel → `userId = adminId`.
  - Pour d’autres comptes, soit :
    - ne rien charger (par défaut),
    - soit permettre plus tard une connexion Garmin séparée par compte.

#### 8.8.6. Programmes (contenu « en dur »)

- Le fichier `workoutProgram.js` contient un programme « en dur » (structure par défaut).
- Ton besoin : **ce programme doit être visible uniquement pour ton compte admin**.
- Stratégie :
  - Ne pas modifier le fichier de définition (il reste une ressource système), mais contrôler **où** il est injecté :
    - Dans les composants/contexts qui utilisent `workoutProgram`, vérifier `currentUser.role`.
    - Si `role === 'admin'` → utiliser `workoutProgram` complet.
    - Sinon → soit ne rien afficher, soit afficher une version ultra‑réduite / démo.
  - Pour toute personnalisation de programme enregistrée (programHistory, customPrograms) :
    - Ajouter `userId`.
    - Migrer toutes les entrées existantes → `userId = adminId`.

#### 8.8.7. Autres onglets (Prédictions, Balancing, BestDayEver, etc.)

- La plupart de ces onglets consomment des **données dérivées** (analyses, corrélations, prédictions) calculées à partir des données brutes déjà listées plus haut.
- Une fois les données brutes filtrées par `userId`, ces onglets afficheront naturellement **les résultats propres au compte connecté**.
- À vérifier ponctuellement :
  - Qu’aucune structure de cache ou de mémoization globale (ex. `localStorage` brut) ne mélange les données de plusieurs comptes.

#### 8.8.8. Résumé de la migration « parfaite »

- **Objectif** : après migration et connexion avec ton compte admin :
  - Toutes les données que tu as saisies dans le passé (workouts, body tracking, nutrition, Garmin, livres, programmes, etc.) sont rattachées à ton `userId`.
  - Les autres comptes voient un site **vierge ou de démo**, sans rien de tes données.
- **Étapes techniques** :
  1. Ajouter un champ `userId` (ou clé de partition) dans chaque store / structure listée ci‑dessus.
  2. Mettre à jour tous les hooks de chargement/sauvegarde pour filtrer/écrire en fonction de `currentUser.id`.
  3. Étendre `migrateDataToUser` pour couvrir :
     - données workouts (via `useWorkoutData` / DB associée),
     - BodyTracking,
     - Nutrition,
     - Garmin,
     - programmes et historiques,
     - en plus des livres déjà migrés.
  4. Protéger l’affichage de certains contenus « en dur » (comme `workoutProgram`) par `role === 'admin'`.
  5. Tester, onglet par onglet, que :
     - admin retrouve bien tout son historique,
     - un nouveau compte voit un site vide / neutre,
     - le mode visiteur / démo n’affiche aucune de tes vraies données.

Ce sous‑plan 8.8 sert de checklist détaillée pour garantir que **rien n’est oublié** dans la migration vers ton compte admin. Il pourra être implémenté progressivement, en commençant par les zones les plus critiques pour toi (workouts, livres, programmes), puis en étendant aux autres onglets.


