# 📋 Ce qui reste à faire - Onglet Nutrition

**Date** : 2025-01-15  
**Statut global** : 🟡 ~85% complété

---

## ✅ CE QUI EST FAIT (Phases 0-6)

- ✅ **Phase 0** : Setup & Navigation (100%)
- ✅ **Phase 1** : Structure IndexedDB (100%)
- ✅ **Phase 2** : Hooks & Utils (100%)
- ✅ **Phase 3** : Composants UI (100%)
- ✅ **Phase 4** : Intégrations API (100%)
- ✅ **Phase 5** : IA & Analyses (100%)
- ✅ **Phase 6** : Export/Import (100%)

---

## 🔴 CE QUI RESTE À FAIRE

### **1. GAMIFICATION (Phase 2 - Priorité Moyenne)**

**Statut** : ❌ Non commencé

**À implémenter** :
- [ ] Système badges (structure IndexedDB)
  - Badges consistance (7j, 30j, 100j streaks)
  - Badges performance nutrition (protéines, conformité, etc.)
  - Badges variété alimentaire
- [ ] Système XP & Niveaux
  - Points XP selon actions (repas saisi, jour complet, etc.)
  - Formule niveaux (exponentielle)
  - Notifications level up
- [ ] Système Streaks avec Forgiveness
  - Calcul streaks avec 2 jours tolérés
  - Limite affichage à 30j (anti-anxiété)
  - Badges progression vs perfectionnisme
- [ ] Option désactiver gamification (Settings)

**Fichiers à créer** :
- `src/services/nutrition/nutritionGamification.js`
- `src/hooks/useNutritionGamification.js`
- `src/components/tabs/nutrition/components/NutritionGamification.jsx`
- Extension IndexedDB : store `gamification` (si pas déjà fait)

**Estimation** : 2-3 jours

---

### **2. SCAN CODE-BARRES (Phase 1 - Priorité Moyenne)**

**Statut** : ❌ Non commencé

**À implémenter** :
- [ ] Intégration Quagga2 (`@ericblade/quagga2`)
- [ ] Composant scan avec caméra
- [ ] Timeout 10 secondes
- [ ] Fallback saisie manuelle
- [ ] Intégration dans `FoodSearch.jsx` ou `MealEntryForm.jsx`

**Fichiers à créer/modifier** :
- `src/services/nutrition/barcodeScanner.js`
- `src/components/tabs/nutrition/components/BarcodeScanner.jsx`
- Modifier `FoodSearch.jsx` pour ajouter bouton scan

**Estimation** : 1-2 jours

---

### **3. COMPRESSION DONNÉES (Phase 1 - Priorité Basse)**

**Statut** : ❌ Non commencé

**À implémenter** :
- [ ] Compression JSON avec `fflate` (70-90% réduction)
- [ ] Compression photos (WebP avec qualité réduite)
- [ ] Auto-compression lors sauvegarde IndexedDB
- [ ] Décompression lors chargement

**Fichiers à créer** :
- `src/utils/compression.js` (ou intégrer dans `nutritionDataUtils.js`)

**Estimation** : 1 jour

---

### **4. PHASE 3 - FEATURES OPTIONNELLES (Priorité Basse)**

**Statut** : ❌ Non commencé (optionnel)

#### **4.1 Saisie Vocale (Web Speech API)**
- [ ] Détection voix pour saisie aliments
- [ ] Parsing intelligent (Regex ou TensorFlow.js NLP)
- [ ] Intégration dans `MealEntryForm.jsx`
- **Estimation** : 1-2 jours

#### **4.2 Scan Photo (TensorFlow.js MobileNet)**
- [ ] Chargement modèle MobileNet (quantifié, ~4-6MB)
- [ ] Détection aliments depuis photo
- [ ] Estimation calories/macros
- [ ] Intégration dans `MealEntryForm.jsx`
- **Estimation** : 2-3 jours

#### **4.3 Chronobiologie (Timing Optimal)**
- [ ] Analyse timing repas vs performance
- [ ] Recommandations timing optimal
- [ ] Graphiques chronobiologie
- **Estimation** : 1-2 jours

#### **4.4 Score Santé Globale**
- [ ] Calcul score composite (nutrition + workout + récupération)
- [ ] Widget Home avec score
- [ ] Graphiques évolution score
- **Estimation** : 1-2 jours

#### **4.5 Fonctionnalités Sociales**
- [ ] Partage avec coach (liens sécurisés)
- [ ] Comparaison photos avant/après
- **Estimation** : 2-3 jours

#### **4.6 Prédictions Offline (TensorFlow.js)**
- [ ] Entraînement modèle ML local
- [ ] Prédictions poids, calories optimales
- **Estimation** : 3-5 jours (complexe)

#### **4.7 Compression Avancée (Brotli)**
- [ ] Compression Brotli pour exports
- **Estimation** : 0.5 jour

#### **4.8 Thème Dynamique**
- [ ] Thème adaptatif selon état utilisateur
- **Estimation** : 1 jour

---

## 📊 RÉSUMÉ PAR PRIORITÉ

### **🔥 PRIORITÉ HAUTE (MVP Complet)**
1. ✅ Structure IndexedDB - **FAIT**
2. ✅ Composants UI de base - **FAIT**
3. ✅ Intégrations API - **FAIT**
4. ✅ Système expert - **FAIT**
5. ✅ Analyses & Corrélations - **FAIT**

### **🟡 PRIORITÉ MOYENNE (Améliorer Expérience)**
1. ❌ **Gamification** (badges, XP, streaks) - **2-3 jours**
2. ❌ **Scan code-barres** (Quagga2) - **1-2 jours**
3. ❌ **Compression données** (fflate) - **1 jour**

**Total Priorité Moyenne** : ~4-6 jours

### **🟢 PRIORITÉ BASSE (Nice to Have)**
1. ❌ Saisie vocale - **1-2 jours**
2. ❌ Scan photo - **2-3 jours**
3. ❌ Chronobiologie - **1-2 jours**
4. ❌ Score santé globale - **1-2 jours**
5. ❌ Fonctionnalités sociales - **2-3 jours**
6. ❌ Prédictions offline - **3-5 jours**
7. ❌ Compression Brotli - **0.5 jour**
8. ❌ Thème dynamique - **1 jour**

**Total Priorité Basse** : ~12-19 jours

---

## 🎯 RECOMMANDATION

**Pour MVP Complet** :
- ✅ **Core fonctionnel** : 100% complété
- 🟡 **Améliorer expérience** : Implémenter Gamification + Scan code-barres (~4-5 jours)
- 🟢 **Polish** : Features optionnelles selon besoins utilisateur

**Prochaines étapes suggérées** :
1. **Gamification** (2-3 jours) - Améliore engagement
2. **Scan code-barres** (1-2 jours) - Améliore UX saisie
3. **Compression** (1 jour) - Optimise performance stockage

**Total pour MVP complet** : ~4-6 jours supplémentaires

---

## 📝 NOTES

- **Toutes les fonctionnalités critiques sont implémentées**
- **L'onglet Nutrition est fonctionnel et utilisable**
- **Les features restantes sont des améliorations/optimisations**
- **Phase 3 features sont optionnelles et peuvent être reportées**

