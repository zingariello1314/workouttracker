# 🎯 Clarification de la logique : Natation

## 📋 **Logique actuelle clarifiée :**

### **1. Onglet Aujourd'hui (Natation) :**
- **Rôle** : Enregistrer SEULEMENT le temps passé (90min)
- **Sauvegarde** : 
  - `checkedExercises[date_complementary_natation] = true`
  - `reps[date_complementary_natation_minutes] = 90`
- **Calendrier** : Affichage basé sur la durée uniquement (intensité)
- **Impact** : ✅ Compte dans l'intensité du calendrier

### **2. Onglet Endurance (Natation) :**
- **Rôle** : Détails de ce qui s'est passé à la piscine
- **Sauvegarde** : `enduranceData.sessions.swimming[]`
- **Calendrier** : Pas d'impact sur l'intensité, juste des détails
- **Impact** : ❌ Ne compte PAS dans l'intensité du calendrier

### **3. Export :**
- **Toutes les données** : ✅ Inclut `enduranceData` dans l'export complet
- **Sauvegarde** : ✅ Les deux systèmes sauvegardent correctement

## 🔧 **Modifications apportées :**

1. **CalendarHeatmap.jsx** :
   - Les sessions d'endurance détaillées n'impactent plus l'intensité
   - Seules les activités complémentaires de l'onglet Aujourd'hui comptent
   - Commentaires ajoutés pour clarifier la logique

2. **EnduranceTab.jsx** :
   - Correction de l'erreur `setShowSessionForm`
   - Les sessions sont bien sauvegardées dans `enduranceData`

3. **Export** :
   - Les données d'endurance sont incluses dans l'export
   - Métadonnées complètes pour les sessions d'endurance

## 🎯 **Résultat attendu :**

- **Onglet Aujourd'hui** : Coche natation → 90min → Calendrier coloré
- **Onglet Endurance** : Sessions détaillées → Détails dans l'historique
- **Calendrier** : Intensité basée uniquement sur l'onglet Aujourd'hui
- **Export** : Toutes les données sont exportées

## ✅ **Test :**

1. Cocher natation dans l'onglet Aujourd'hui → Calendrier coloré
2. Ajouter une session détaillée dans l'onglet Endurance → Détails dans l'historique
3. Exporter les données → Tout est inclus
4. L'intensité du calendrier ne dépend que de l'onglet Aujourd'hui
