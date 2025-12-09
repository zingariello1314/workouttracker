# Comment Tester la ProfileCard

## 🚀 Lancer l'Application

```bash
npm run dev
```

## 📍 Localisation

La carte est dans la **sidebar à droite**, entre l'heure/date et les statuts système.

## ✅ Tests à Faire

### 1. Vérifier l'affichage de base
- [ ] Le nom affiché est votre username (zingariello1314)
- [ ] Le titre est "Développeur Premium"
- [ ] Le handle est @zingariello1314
- [ ] Le statut est "En ligne"

### 2. Tester la galerie d'avatars
- [ ] Cliquer sur "Profil" en bas de la carte
- [ ] Le modal s'ouvre
- [ ] Cliquer sur "+ Ajouter un avatar"
- [ ] Sélectionner une image
- [ ] L'avatar apparaît dans la galerie
- [ ] Ajouter 2-3 autres avatars

### 3. Tester la sélection d'avatar
- [ ] Cliquer sur un avatar dans la galerie
- [ ] Le badge ✓ se déplace sur cet avatar
- [ ] L'avatar actif en haut change
- [ ] Fermer le modal
- [ ] La carte affiche le nouvel avatar

### 4. Tester la suppression d'avatar
- [ ] Ouvrir les paramètres
- [ ] Survoler un avatar
- [ ] Le bouton ✕ apparaît
- [ ] Cliquer sur ✕
- [ ] Confirmer la suppression
- [ ] L'avatar disparaît de la galerie

### 5. Tester le handle
- [ ] Ouvrir les paramètres
- [ ] Modifier le handle (ex: "dev_premium")
- [ ] Cliquer sur "Mettre à jour le handle"
- [ ] Message "✅ Handle mis à jour!"
- [ ] Fermer le modal
- [ ] La carte affiche @dev_premium

### 6. Tester la persistance
- [ ] Ajouter 2-3 avatars
- [ ] Sélectionner un avatar spécifique
- [ ] Modifier le handle
- [ ] Recharger la page (F5)
- [ ] Vérifier que tout est resté identique

### 7. Tester avec un autre compte (si possible)
- [ ] Se déconnecter
- [ ] Se connecter avec un autre compte
- [ ] Vérifier que le titre est "Utilisateur"
- [ ] Vérifier que les avatars sont différents
- [ ] Ajouter des avatars pour ce compte
- [ ] Se reconnecter avec zingariello1314
- [ ] Vérifier que les avatars sont bien séparés

## 🐛 Problèmes Possibles

### L'avatar ne change pas
- Vérifier que vous avez bien cliqué sur l'avatar dans la galerie
- Vérifier le message de confirmation
- Recharger la page

### Les avatars ne persistent pas
- Vérifier que IndexedDB est activé dans le navigateur
- Ouvrir DevTools > Application > IndexedDB > QuietQuestDB
- Vérifier que le store "profileCards" existe

### Le modal ne s'ouvre pas
- Vérifier la console pour les erreurs
- Vérifier que le bouton "Profil" est cliquable

## ✅ Résultat Attendu

Si tous les tests passent:
- ✅ Nom automatique
- ✅ Titre basé sur compte
- ✅ Handle modifiable et persistant
- ✅ Multi-avatars fonctionnel
- ✅ Galerie visuelle
- ✅ Persistance complète
- ✅ Séparation par session

**TOUT FONCTIONNE!** 🎉
