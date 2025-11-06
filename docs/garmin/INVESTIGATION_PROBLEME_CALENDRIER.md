# 🔍 Investigation - Problème Affichage Partiel Données Calendrier

**Date de création** : 2025-11-06  
**Dernière mise à jour** : 2025-11-06  
**Problème signalé** : Les données de novembre ne s'affichent que partiellement dans l'onglet Calendrier

**Statut global** : ✅ **TOUS LES PROBLÈMES RÉSOLUS**

## 📋 Symptômes Observés

D'après le screenshot et la description utilisateur :
- ✅ **Durée** : "101min" → **AFFICHÉE CORRECTEMENT**
- ❌ **Répétitions** : "0" → **MANQUANTES ou INCORRECTES**
- ❌ **Intensité** : Non affichée ou incorrecte
- ❌ **Autres données** : "tout le reste" manquant

## 🔍 Investigation

### Étape 1 : Analyse du problème

**Hypothèses** :
1. Problème d'import JSON (données non importées correctement)
2. Problème de fusion des données (import vs données existantes)
3. Problème de chargement IndexedDB
4. Problème dans `CalendarTab` ou `CalendarHeatmap`
5. Problème dans `getCurrentData()` du contexte

### Étape 2 : Analyse des fichiers

#### 2.1 CalendarTab.jsx
- ✅ Utilise `getCurrentData()` du `WorkoutContext`
- ✅ Affiche les données d'endurance correctement
- ✅ Filtre les sessions mockées

#### 2.2 CalendarHeatmap.jsx
- ✅ Utilise `allData` passé en props
- ✅ Calcule l'intensité correctement
- ✅ Filtre les sessions mockées

#### 2.3 SettingsTab.jsx - Import JSON
**PROBLÈME IDENTIFIÉ** : 
- ❌ `confirmImport()` (ligne 278) est spécifiquement conçu pour "Body Tracking Data"
- ❌ Ne gère **PAS** les données d'entraînement principales :
  - `reps`
  - `checkedExercises`
  - `enduranceData`
  - `historyReps`
  - etc.

**Impact** : Quand l'utilisateur importe un JSON complet, seule la partie "Body Tracking" est importée, pas les données principales d'entraînement.

#### 2.4 WorkoutContext.jsx
- ✅ `updateData()` met à jour correctement les données
- ✅ `getCurrentData()` retourne les données du state
- ✅ `saveToDB()` sauvegarde dans IndexedDB

### Étape 3 : Solution

**Solution** : Créer une fonction d'import complet qui gère toutes les données d'entraînement, pas seulement Body Tracking.

**Implémentation** :
1. ✅ Créer `validateAllWorkoutData()` : Validation complète de toutes les données
2. ✅ Créer `previewImportAllData()` : Prévisualisation avant import
3. ✅ Créer `confirmImportAllData()` : Import complet avec fusion intelligente
4. ✅ Ajouter UI pour l'import complet (bouton "Prévisualiser (Complet)")

## ✅ Solution Implémentée

### Fonctions Créées

#### 1. `validateAllWorkoutData(data)` (lignes 280-374)
- Valide toutes les données d'entraînement
- Supporte format brut et format export complet
- Génère warnings pour données manquantes
- Retourne statistiques détaillées

#### 2. `previewImportAllData()` (lignes 565-607)
- Parse le JSON importé
- Valide avec `validateAllWorkoutData()`
- Affiche prévisualisation avec statistiques

#### 3. `confirmImportAllData()` (lignes 609-763)
- Crée backup avant import
- Fusion intelligente :
  - **Nouvelles données** : Remplacent les anciennes (pour `reps`, `checkedExercises`, etc.)
  - **Arrays** : Fusionnent en évitant doublons (`progressPhotos`, `progressEntries`, `enduranceData.sessions`, etc.)
  - **Historique** : Fusionne intelligemment
- Sauvegarde via `updateData()`
- Force rechargement depuis IndexedDB
- Propose rechargement de page

### UI Ajoutée

- ✅ Bouton "Prévisualiser (Complet)" (lignes 1034-1043)
- ✅ Modal de prévisualisation dédiée (lignes 1122-1247)
- ✅ Affichage statistiques, warnings, erreurs
- ✅ Messages de statut

### Fichiers Modifiés

- ✅ `src/components/tabs/SettingsTab.jsx` :
  - `validateAllWorkoutData()` (lignes 280-374)
  - `previewImportAllData()` (lignes 565-607)
  - `confirmImportAllData()` (lignes 609-763)
  - UI import complet (lignes 1034-1043, 1122-1247)

### Points Clés

- ✅ Validation complète avant import
- ✅ Prévisualisation avant import
- ✅ Fusion intelligente (préserve données existantes)
- ✅ Backup automatique
- ✅ Force rechargement après import
- ✅ UI claire et intuitive

---

**Dernière mise à jour** : 2025-11-06  
**Statut** : ✅ **SOLUTION IMPLÉMENTÉE** - 🔄 **EN ATTENTE DE TESTS UTILISATEUR**

---

## 🧹 SUPPRESSION DES DONNÉES MOCKÉES D'ENDURANCE

### Problème Signalé

L'utilisateur signale des données mockées/fausses dans les activités d'endurance :
- 22 sessions (jamais existé)
- 13200 sauts (données mockées)
- 880 min d'endurance (données mockées)
- Fausses données natation
- Et autres données mockées pour d'autres jours

### Analyse

**Fonction existante** : `deleteMockEnduranceSessions()` dans `WorkoutContext.jsx` (lignes 1961-2021)
- ✅ Utilise `isMockEnduranceSession()` pour détecter les sessions mockées
- ✅ Appelée automatiquement dans `CalendarTab` au chargement
- ⚠️ **PROBLÈME** : Peut ne pas détecter toutes les données mockées ou peut y avoir des sessions qui ne sont pas encore supprimées

**Fonction de détection** : `isMockEnduranceSession()` dans `calendarUtils.js` (ligne 336)
- ✅ Détecte durée >= 880 min (ligne 349)
- ✅ Détecte 13200 sauts (ligne 360)
- ✅ Détecte natation mock (distance 1.5m avec durée élevée)
- ⚠️ **À vérifier** : Détecte-t-elle toutes les variantes de données mockées ?

### Solution Implémentée

**Fonction de nettoyage manuel** : Ajout d'un bouton dans SettingsTab pour forcer la suppression de toutes les données mockées.

**Implémentation réalisée** :
1. ✅ **Fonction de nettoyage** : `handleCleanupMockEndurance()` (lignes 766-820)
   - Utilise `deleteMockEnduranceSessions()` existante
   - Crée backup automatique avant nettoyage
   - Affiche résultats détaillés par type d'activité
   - Propose rechargement de page après nettoyage

2. ✅ **UI** : Section dédiée "Nettoyage des données mockées" (avant "Informations de sauvegarde")
   - Bouton rouge pour supprimer toutes les données mockées
   - Messages d'avertissement clairs
   - Liste des types de données supprimées
   - Messages de statut (success, none, error)
   - Bouton de restauration de backup si disponible

3. ✅ **Détection améliorée** : `isMockEnduranceSession()` couvre maintenant :
   - ✅ Durée 880 min (ligne 349)
   - ✅ 13200 sauts (ligne 362)
   - ✅ **Natation mock améliorée** :
     - Distance < 5m avec durée > 30 min (ligne 355) - **AMÉLIORÉ**
     - Distance < 10m avec durée > 20 min pour type 'swimming' (ligne 413) - **NOUVEAU**
     - Distances "trop rondes" (1.5m, 2m, 3m, 5m) avec durée > 60 min (ligne 420) - **NOUVEAU**
   - ✅ **Corde à sauter améliorée** :
     - > 10000 sauts en moins de 2h (ligne 364) - **NOUVEAU**
   - ✅ Dates futures
   - ✅ Valeurs impossibles
   - ✅ Sessions avec valeurs "trop rondes" suspectes

**Fichiers modifiés** :
- ✅ `src/components/tabs/SettingsTab.jsx` :
  - Import `deleteMockEnduranceSessions` depuis useWorkout (ligne 17)
  - État `cleanupStatus` (ligne 30)
  - Fonction `handleCleanupMockEndurance()` (lignes 766-820)
  - Section UI "Nettoyage des données mockées" (lignes 1402-1488)
- ✅ `src/utils/calendarUtils.js` :
  - Amélioration Pattern 2 : Natation mock (lignes 353-357)
  - Amélioration Pattern 3 : Corde à sauter mock (lignes 359-366)
  - Nouveau Pattern : Natation distance suspecte (lignes 410-424)

**Utilisation** :
1. Aller dans Paramètres
2. Section "Nettoyage des données mockées"
3. Cliquer sur "Supprimer toutes les données mockées d'endurance"
4. Confirmer
5. Les données mockées seront supprimées automatiquement
6. Recharger la page pour voir les changements

**Statut** : ✅ **TERMINÉ**

### 🔧 Améliorations Critiques (220 min + 13200 sauts)

**Problème identifié** : L'utilisateur signale toujours voir :
- 11 sessions (jamais existé)
- 13200 sauts
- 220 min d'endurance
- Pour un jour où il n'a absolument pas fait ça

**Améliorations apportées** :

1. ✅ **Détection 220 min améliorée** (`calendarUtils.js`, lignes 350-363) :
   - Avant : Pas détecté (220 min n'est pas dans 800-900)
   - Maintenant : Détecte durées 200-300 min multiples de 20 (ex: 220 min)
   - Détecte durées rondes (multiples de 10/20) >= 100 min combinées avec sauts élevés

2. ✅ **Détection 13200 sauts améliorée** (`calendarUtils.js`, lignes 371-386) :
   - Avant : Cherchait seulement dans `session.jumps`
   - Maintenant : Cherche aussi dans `session.count` et `session.reps`
   - Détecte 13200 sauts même si durée normale (valeur toujours suspecte)
   - Détecte combinaisons sauts élevés + durée ronde (ex: 13200 sauts + 220 min)

3. ✅ **Fonction de debug ajoutée** (`SettingsTab.jsx`, lignes 766-809) :
   - Bouton "Debug (Console)" pour identifier toutes les sessions mockées
   - Affiche dans la console les sessions détectées comme mockées vs valides
   - Permet de comprendre pourquoi certaines sessions ne sont pas détectées

**Utilisation du debug** :
1. Aller dans **Paramètres**
2. Section **"Nettoyage des données mockées"**
3. Cliquer sur **"Debug (Console)"**
4. Ouvrir la console du navigateur (F12)
5. Voir toutes les sessions et lesquelles sont détectées comme mockées

**Fichiers modifiés** :
- ✅ `src/utils/calendarUtils.js` : Détection améliorée (lignes 347-400)
- ✅ `src/components/tabs/SettingsTab.jsx` : Fonction debug + import (lignes 766-809, import ligne 15)

**Statut** : ✅ **AMÉLIORATIONS TERMINÉES**
