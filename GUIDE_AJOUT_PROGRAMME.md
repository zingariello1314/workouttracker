# Guide d'ajout du nouveau programme d'entraînement

## Instructions

Pour ajouter le nouveau programme "Programme Musculation - Haut Pectoraux & Épaules" à votre session :

### Méthode 1 : Via la console du navigateur (Recommandé)

1. **Ouvrir l'application** dans votre navigateur (connecté avec le compte zingariello131)

2. **Ouvrir la console développeur** :
   - Appuyer sur `F12` ou `Ctrl+Shift+I` (Windows/Linux)
   - Ou `Cmd+Option+I` (Mac)
   - Aller dans l'onglet "Console"

3. **Copier et coller le script** :
   - Ouvrir le fichier `add_program_to_browser.js`
   - Copier tout le contenu
   - Coller dans la console du navigateur
   - Appuyer sur `Entrée`

4. **Vérifier le résultat** :
   - Vous devriez voir des messages de confirmation dans la console
   - Recharger la page (`F5` ou `Ctrl+R`)
   - Aller dans l'onglet "Programme"
   - Vous devriez maintenant voir 2 programmes au lieu d'un seul

### Méthode 2 : Intégration directe (Alternative)

Si vous préférez, je peux intégrer directement le programme dans le code de l'application pour qu'il soit disponible automatiquement.

## Détails du programme ajouté

- **Nom** : Programme Musculation - Haut Pectoraux & Épaules
- **Durée** : 4 semaines
- **Objectif** : Développement musculaire ciblé - Haut de pecs, épaules, dos, jambes
- **Statut** : Inactif (vous pourrez l'activer depuis l'onglet Programme)

### Structure hebdomadaire

- **Lundi** : Haut des pecs + Épaules (priorité)
- **Mardi** : Dos largeur + Biceps
- **Mercredi** : Jambes + Abdos
- **Jeudi** : Repos total
- **Vendredi** : Épaules + Bras (triceps priorité)
- **Samedi** : Dos épaisseur + Lombaires
- **Dimanche** : Pecs complets + Rappels

## Vérification

Après avoir exécuté le script, vous pouvez vérifier que le programme a été ajouté :

1. Aller dans l'onglet "Programme"
2. Vous devriez voir la liste des programmes avec le nouveau programme
3. Le programme existant reste intact
4. Vous pouvez activer le nouveau programme en cliquant sur "Activer"

## Dépannage

Si le script ne fonctionne pas :

1. Vérifier que vous êtes bien connecté avec le compte zingariello131
2. Vérifier que la console ne montre pas d'erreurs
3. Essayer de recharger la page et réexécuter le script
4. Vérifier que IndexedDB est bien supporté par votre navigateur

## Note importante

Le script ajoute le programme sans supprimer les programmes existants. Si un programme avec le même nom existe déjà, il sera mis à jour au lieu d'être dupliqué.


