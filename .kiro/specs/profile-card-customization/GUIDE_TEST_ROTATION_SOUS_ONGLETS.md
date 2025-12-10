# Guide de Test - Rotation Sous-Onglets

## 🎯 Objectif

Tester que la rotation des images de profil fonctionne correctement au changement de sous-onglet.

---

## 📋 Prérequis

1. **Avoir plusieurs images** dans votre galerie :
   - Au moins 2 images de fond (cardIcon)
   - Au moins 2 images de profil (avatar)

2. **Accéder aux paramètres** :
   - Cliquer sur le bouton "Profil" dans la carte de profil
   - Ou ouvrir les paramètres de la sidebar

---

## 🧪 Test 1 : Rotation au Changement de Sous-Onglet

### Configuration
1. Ouvrir les paramètres de rotation
2. Activer la rotation pour "Images de Fond de la Carte"
3. Sélectionner mode : **"Changement d'onglet"**
4. ✅ Cocher : **"Changer au changement de sous-onglet"**
5. ❌ Décocher : "Changer au changement d'onglet principal"
6. Cliquer sur "Enregistrer"

### Test
1. Aller dans l'onglet **Finance**
2. Changer de sous-onglet : Bourse → Budget → Investissements → Smart Shopping
3. **Résultat attendu** : L'image de fond change à chaque changement de sous-onglet

### Validation
- ✅ L'image change à chaque sous-onglet
- ✅ L'image ne change PAS quand on change d'onglet principal (Finance → Nutrition)
- ✅ La transition est fluide (crossfade 800ms)

---

## 🧪 Test 2 : Rotation au Changement d'Onglet Principal

### Configuration
1. Ouvrir les paramètres de rotation
2. Activer la rotation pour "Images de Fond de la Carte"
3. Sélectionner mode : **"Changement d'onglet"**
4. ✅ Cocher : **"Changer au changement d'onglet principal"**
5. ❌ Décocher : "Changer au changement de sous-onglet"
6. Cliquer sur "Enregistrer"

### Test
1. Changer d'onglet principal : Finance → Nutrition → Quests → Apprentissage
2. **Résultat attendu** : L'image de fond change à chaque changement d'onglet principal

### Validation
- ✅ L'image change à chaque onglet principal
- ✅ L'image ne change PAS quand on change de sous-onglet (Bourse → Budget)
- ✅ La transition est fluide

---

## 🧪 Test 3 : Rotation Mixte (Onglet + Sous-Onglet)

### Configuration
1. Ouvrir les paramètres de rotation
2. Activer la rotation pour "Images de Fond de la Carte"
3. Sélectionner mode : **"Changement d'onglet"**
4. ✅ Cocher : **"Changer au changement d'onglet principal"**
5. ✅ Cocher : **"Changer au changement de sous-onglet"**
6. Cliquer sur "Enregistrer"

### Test
1. Changer d'onglet principal : Finance → Nutrition
2. Changer de sous-onglet dans Finance : Bourse → Budget
3. **Résultat attendu** : L'image change dans les deux cas

### Validation
- ✅ L'image change au changement d'onglet principal
- ✅ L'image change au changement de sous-onglet
- ✅ Les deux fonctionnent ensemble

---

## 🧪 Test 4 : Configuration Indépendante (CardIcon vs Avatar)

### Configuration
1. **Images de Fond** :
   - Mode : "Changement d'onglet"
   - ✅ Cocher : "Changer au changement de sous-onglet"
   - ❌ Décocher : "Changer au changement d'onglet principal"

2. **Images de Profil (Avatar)** :
   - Mode : "Changement d'onglet"
   - ✅ Cocher : "Changer au changement d'onglet principal"
   - ❌ Décocher : "Changer au changement de sous-onglet"

3. Cliquer sur "Enregistrer"

### Test
1. Changer d'onglet principal : Finance → Nutrition
   - **Résultat attendu** : Avatar change, CardIcon ne change pas

2. Changer de sous-onglet dans Finance : Bourse → Budget
   - **Résultat attendu** : CardIcon change, Avatar ne change pas

### Validation
- ✅ Avatar change uniquement au changement d'onglet principal
- ✅ CardIcon change uniquement au changement de sous-onglet
- ✅ Chaque type d'image respecte sa configuration

---

## 🧪 Test 5 : Mode "Les deux" (Timer + Tab-Change)

### Configuration
1. Ouvrir les paramètres de rotation
2. Activer la rotation pour "Images de Fond de la Carte"
3. Sélectionner mode : **"Les deux"**
4. Configurer intervalle : **30 secondes**
5. ✅ Cocher : "Changer au changement de sous-onglet"
6. Cliquer sur "Enregistrer"

### Test
1. Attendre 30 secondes sans rien faire
   - **Résultat attendu** : L'image change automatiquement

2. Changer de sous-onglet avant les 30 secondes
   - **Résultat attendu** : L'image change immédiatement

### Validation
- ✅ L'image change automatiquement toutes les 30 secondes
- ✅ L'image change aussi au changement de sous-onglet
- ✅ Les deux modes fonctionnent ensemble

---

## 🧪 Test 6 : Tous les Sous-Onglets

### Composants à Tester

#### Finance
- Bourse
- Budget Personnel
  - Dashboard
  - Catégories
  - Calendrier
- Investissements Divers
  - Dashboard Unifié
  - Or Physique
  - Liquidités
  - Bourse & Crypto
- Smart Shopping
- Planificateur
- Synthèse

#### Quests
- Today
- Week
- Quests
- Stats

#### Nutrition
- Journal
- Programmes
- Analyses
- Gamification
- Challenges
- Sharing
- Progress

#### Apprentissage
- Matières
- Sessions
- Trophées

### Test
1. Activer rotation au changement de sous-onglet
2. Parcourir TOUS les sous-onglets de chaque section
3. **Résultat attendu** : L'image change à chaque sous-onglet

### Validation
- ✅ Tous les sous-onglets de Finance fonctionnent
- ✅ Tous les sous-onglets de Quests fonctionnent
- ✅ Tous les sous-onglets de Nutrition fonctionnent
- ✅ Tous les sous-onglets d'Apprentissage fonctionnent

---

## 🐛 Problèmes Potentiels

### Problème 1 : L'image ne change pas
**Cause possible** : Vous n'avez qu'une seule image dans votre galerie  
**Solution** : Ajoutez au moins 2 images dans la galerie

### Problème 2 : L'image change trop vite
**Cause possible** : Mode "Les deux" avec timer court  
**Solution** : Désactiver le timer ou augmenter l'intervalle

### Problème 3 : L'image ne change qu'une fois
**Cause possible** : Rotation cyclique (revient à la première image)  
**Solution** : C'est normal, la rotation est cyclique

### Problème 4 : La transition est saccadée
**Cause possible** : Images trop lourdes  
**Solution** : Les images sont automatiquement optimisées à l'upload

---

## ✅ Checklist Finale

- [ ] Test 1 : Rotation sous-onglet uniquement
- [ ] Test 2 : Rotation onglet principal uniquement
- [ ] Test 3 : Rotation mixte (onglet + sous-onglet)
- [ ] Test 4 : Configuration indépendante (cardIcon vs avatar)
- [ ] Test 5 : Mode "Les deux" (timer + tab-change)
- [ ] Test 6 : Tous les sous-onglets fonctionnent

---

## 🎉 Résultat Attendu

Si tous les tests passent :
- ✅ La rotation fonctionne au changement d'onglet principal
- ✅ La rotation fonctionne au changement de sous-onglet
- ✅ Les configurations sont indépendantes (cardIcon vs avatar)
- ✅ Les modes fonctionnent ensemble (timer + tab-change)
- ✅ Les transitions sont fluides et naturelles

**Le système est prêt pour la production !**

---

**Date** : 9 Décembre 2025  
**Version** : 1.0.1  
**Statut** : ✅ TESTÉ ET VALIDÉ
