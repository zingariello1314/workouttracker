# Guide Utilisateur - Système de Gestion des Citations

## Vue d'ensemble

Le système de gestion des citations vous permet de personnaliser les citations affichées sur votre page d'accueil. Vous pouvez créer, modifier, organiser et exporter vos citations préférées.

## Accès au Gestionnaire

1. Cliquez sur l'onglet **Paramètres** dans la navigation
2. Faites défiler jusqu'à la section **Citations de la page d'accueil**

## Fonctionnalités Principales

### 1. Modes d'Affichage

#### Mode Aléatoire (Recommandé)
- Les citations changent automatiquement toutes les 90 secondes
- Cliquez n'importe où sur la page d'accueil pour changer manuellement
- L'algorithme évite de répéter la même citation immédiatement
- Les citations épinglées apparaissent 3x plus souvent

#### Mode Fixe
- Affiche toujours la même citation
- Sélectionnez votre citation préférée dans la liste déroulante
- Parfait pour une citation inspirante permanente

### 2. Gestion des Citations

#### Ajouter une Citation
1. Cliquez sur **+ Ajouter une citation**
2. Remplissez les 6 champs (3 lignes en français + 3 lignes en anglais)
3. Cliquez sur **Ajouter**

**Conseils:**
- Gardez les lignes courtes pour un meilleur rendu visuel
- Maximum 500 caractères par ligne
- Tous les champs sont obligatoires

#### Modifier une Citation
1. Cliquez sur l'icône **crayon** sur la citation
2. Modifiez les champs souhaités
3. Cliquez sur **Enregistrer**

#### Supprimer une Citation
1. Cliquez sur l'icône **poubelle** sur la citation
2. Confirmez la suppression

**⚠️ Attention:** La suppression est définitive et ne peut pas être annulée.

#### Épingler une Citation
- Cliquez sur l'icône **punaise** pour épingler/désépingler
- Les citations épinglées ont une bordure dorée
- En mode aléatoire, elles apparaissent 3x plus souvent

#### Réorganiser les Citations
- Glissez-déposez les citations pour changer leur ordre
- L'ordre affecte la sélection en mode aléatoire

### 3. Export / Import

#### Exporter vos Citations
1. Cliquez sur **Exporter les citations**
2. Un fichier JSON est téléchargé automatiquement
3. Conservez ce fichier comme sauvegarde

**Le fichier contient:**
- Toutes vos citations personnalisées
- Vos paramètres (mode, citation fixe)
- Les métadonnées (date d'export, statistiques)

#### Importer des Citations
1. Cliquez sur **Importer des citations**
2. Sélectionnez un fichier JSON d'export
3. Prévisualisez les citations à importer
4. Choisissez la stratégie de fusion:
   - **Fusionner:** Ajoute les nouvelles citations sans supprimer les existantes
   - **Remplacer:** Supprime toutes les citations existantes et importe les nouvelles

**⚠️ Attention:** Le mode "Remplacer" efface toutes vos citations actuelles.

## Comportement sur la Page d'Accueil

### Changement Automatique
- Toutes les 90 secondes, une nouvelle citation s'affiche
- Animation fluide avec fondu et mouvement vertical
- Aucun texte "Chargement..." entre les transitions

### Changement Manuel
- Cliquez n'importe où sur la page d'accueil
- La citation change instantanément
- Le timer de 90 secondes se réinitialise

### Changement de Langue
- Basculez entre français et anglais dans les paramètres
- La citation s'adapte automatiquement à la langue sélectionnée
- Aucun rechargement nécessaire

## Stockage des Données

### IndexedDB
- Toutes les citations sont stockées localement dans votre navigateur
- Accès ultra-rapide (< 1ms) grâce au cache LRU
- Aucune connexion internet requise
- Les données persistent même après fermeture du navigateur

### Sauvegarde Recommandée
- Exportez régulièrement vos citations
- Conservez le fichier JSON dans un endroit sûr
- Permet de restaurer vos citations sur un autre appareil

## Résolution de Problèmes

### La citation ne change pas
1. Vérifiez que vous avez au moins 2 citations
2. Vérifiez que le mode est bien sur "Aléatoire"
3. Essayez de cliquer sur la page d'accueil

### Erreur lors de l'import
1. Vérifiez que le fichier est bien un export valide
2. Assurez-vous que le fichier n'est pas corrompu
3. Essayez de réexporter depuis l'appareil source

### Les citations ne s'affichent pas
1. Vérifiez qu'au moins une citation existe
2. Videz le cache du navigateur
3. Rechargez la page

### Message d'erreur persistant
1. Cliquez sur **Réessayer** dans le message d'erreur
2. Si le problème persiste après 3 tentatives, videz le cache
3. En dernier recours, réinitialisez les paramètres

## Astuces et Bonnes Pratiques

### Création de Citations
- **Soyez concis:** Les citations courtes ont plus d'impact
- **Variez les thèmes:** Motivation, sagesse, humour, inspiration
- **Testez le rendu:** Prévisualisez sur la page d'accueil
- **Utilisez l'épinglage:** Pour vos citations préférées

### Organisation
- **Ordre logique:** Groupez les citations par thème
- **Rotation équilibrée:** Évitez d'avoir trop de citations épinglées
- **Nettoyage régulier:** Supprimez les citations qui ne vous parlent plus

### Sauvegarde
- **Export mensuel:** Créez une sauvegarde chaque mois
- **Nommage clair:** `citations-backup-2025-12-07.json`
- **Stockage multiple:** Cloud + disque local

## Raccourcis Clavier

Aucun raccourci clavier n'est actuellement disponible pour ce module.

## Compatibilité

### Navigateurs Supportés
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Appareils
- ✅ Desktop (Windows, macOS, Linux)
- ✅ Mobile (iOS, Android)
- ✅ Tablette

### Fonctionnalités Requises
- IndexedDB (activé par défaut)
- JavaScript (obligatoire)
- LocalStorage (pour les paramètres)

## Support

Pour toute question ou problème:
1. Consultez d'abord ce guide
2. Vérifiez la console du navigateur (F12) pour les erreurs
3. Exportez vos données avant toute manipulation risquée

## Mises à Jour

Le système est conçu pour évoluer sans perte de données:
- Les migrations sont automatiques
- Vos citations sont préservées
- Les exports restent compatibles

---

**Version:** 1.0  
**Dernière mise à jour:** 7 décembre 2025
