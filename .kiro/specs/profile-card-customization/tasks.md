# Tasks - Personnalisation de la Carte de Profil

## Implémentation

- [x] 1. Étendre le storage pour gérer l'image centrale
  - Ajouter `saveCardIcon()` et `getCardIcon()` dans profileCardStorage.js
  - Stocker `cardIconUrl` dans IndexedDB

- [x] 2. Étendre le hook useProfileCard
  - Ajouter `cardIconUrl` dans l'état
  - Ajouter la fonction `updateCardIcon()`
  - Charger `cardIconUrl` depuis IndexedDB

- [x] 3. Mettre à jour ProfileCard3D
  - Utiliser `cardIconUrl` du hook
  - Fallback sur `iconUrl` par défaut si pas de personnalisation

- [x] 4. Ajouter le module dans ProfileCardSettings
  - Module de sélection d'image centrale
  - Aperçu de l'image actuelle
  - Upload et validation d'image
  - Styles CSS pour le module

- [x] 5. Tester l'implémentation
  - Vérifier qu'il n'y a pas d'erreurs de compilation
  - Le système est prêt à être testé manuellement

## Fonctionnalités implémentées

✅ **Image centrale personnalisée** : L'utilisateur peut uploader une image qui remplace le logo par défaut au centre de la carte

✅ **Handle personnalisé** : L'utilisateur peut modifier le @handle affiché dans le rectangle en bas (déjà existant, conservé)

✅ **Avatar automatique** : La photo de profil est automatiquement réutilisée comme avatar rond (déjà existant, conservé)

✅ **Titre dynamique** : "Développeur Premium" pour admin (zingariello1314), "Utilisateur" pour les autres (déjà existant via getUserTitle)

✅ **Persistance IndexedDB** : Toutes les données sont sauvegardées de manière durable

✅ **Multi-utilisateurs** : Chaque utilisateur a ses propres personnalisations isolées

## Pour tester

1. Ouvrir l'application
2. Cliquer sur le bouton "Profil" dans la carte de la sidebar
3. Dans le modal qui s'ouvre :
   - Section "Image de la Carte" : Cliquer sur "📷 Changer l'image de la carte" pour uploader une image
   - Section "Handle" : Modifier le @handle et cliquer sur "Mettre à jour le handle"
4. Fermer le modal et voir les changements appliqués sur la carte
5. Recharger la page pour vérifier que les changements persistent
