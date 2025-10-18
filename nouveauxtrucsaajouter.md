📊 Détail Complet de Chaque Fonctionnalité

📈 COURBE DE PROGRESSION PAR EXERCICE
Où ça apparaît :

Nouvel onglet "📈 Graphiques"
Au clic sur un exercice dans les stats top 10

Visuel :
COURBE DE PROGRESSION - Pompes Inclinées
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      Reps
      50 |           ╱╲
      45 |         ╱  ╲    ╱
      40 |       ╱      ╲╱
      35 |     ╱
      30 |___╱_________________________
         Jan  Fév  Mar  Avr  Mai
```

### **Paramètres :**
- **Axe X** : dates chronologiques (tous les entraînements de cet exercice)
- **Axe Y** : nombre de reps effectuées
- **Ligne** : courbe lisse montrant la progression
- **Points** : chaque point = une séance
- **Hover** : affiche date + reps exactes
- **Filtres** :
  - Sélectionner période (semaine/mois/année)
  - Exclure/inclure certaines dates
  - Zoom sur une période spécifique

### **Exemple réel :**
- 1er janvier : 30 reps pompes
- 15 janvier : 32 reps
- 1er février : 35 reps
- 1er mars : 40 reps
→ La courbe monte = tu progresses ! 📈

---

## **📊 HISTOGRAMME : REPS PAR JOUR DE LA SEMAINE**

### **Où ça apparaît :**
- Onglet "📈 Graphiques"
- Section "Intensité par jour"

### **Visuel :**
```
REPS PAR JOUR DE LA SEMAINE (Mois actuel)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Reps
    300 |     ██
    250 |     ██  
    200 |  ██ ██ ██  ██
    150 |  ██ ██ ██  ██  ██
    100 |  ██ ██ ██  ██  ██  ██
     50 |  ██ ██ ██  ██  ██  ██  ██
      0 |__██_██_██__██__██__██__██__
        L  M  M  J  V  S  D
       (Lundi la barre est plus haute = tu as fait plus lundi)
```

### **Paramètres :**
- **Axe X** : Lundi à Dimanche
- **Axe Y** : Total de reps effectuées ce jour-là
- **Barres colorées** :
  - 🔴 Rouge/Orange = faible intensité (< 100 reps)
  - 🟡 Jaune = moyen (100-200 reps)
  - 🟢 Vert = intense (> 200 reps)
- **Toggle** : voir la moyenne sur les 4 dernières semaines
- **Affiche aussi** : 
  - Meilleur jour : "Lundi: 280 reps (record)"
  - Jour repos : "Jeudi: 0 reps (repos)"

### **Utilité :**
- Voir si tu t'entraînes plus certains jours
- Identifier tes jours forts vs faibles
- Équilibrer la charge si déséquilibré

---

## **🔄 COMPARAISON : CE MOIS VS MOIS PRÉCÉDENT**

### **Où ça apparaît :**
- Onglet "📈 Graphiques"
- Section "Comparaison mois"

### **Visuel :**
```
COMPARAISON FÉVRIER vs JANVIER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          Janvier  Février  Différence
Total reps  1200    1450    ▲ +250 (+20%) 🟢
Séances      12      14     ▲ +2 séances
Max daily    300     350    ▲ +50 reps
Streak       8 j     12 j   ▲ +4 jours 🔥
```

### **Paramètres :**
- **Deux colonnes côte à côte** : mois actuel vs mois précédent
- **Flèches** :
  - ▲ vert = amélioration
  - ▼ rouge = régression
- **Pourcentage automatique** : calcul (mois2 - mois1) / mois1 × 100
- **Picker de mois** : sélectionner n'importe quel mois pour comparer
- **Metrics affichés** :
  - Total reps
  - Nombre de séances
  - Reps max en un jour
  - Streak
  - Meilleur exercice

### **Exemple :**
```
Janvier : 1200 reps en 12 séances
Février : 1450 reps en 14 séances
→ "Excellent mois ! +20.8% de progression"
```

---

## **📉 TENDANCE : HAUSSE/BAISSE AUTOMATIQUE DÉTECTÉE**

### **Où ça apparaît :**
- **Dashboard principal** (petit badge)
- **Onglet Stats**
- **Onglet Graphiques**

### **Visuel :**
```
┌─────────────────────────┐
│  TENDANCE GLOBALE       │
├─────────────────────────┤
│ 📈 EN HAUSSE            │
│ +12% cette semaine      │
│ 4 exercices progressent │
│ 1 exercice stagne       │
│ 0 exercice régresse     │
└─────────────────────────┘
```

### **Paramètres :**
- **Analyse automatique** :
  - Comparer semaine actuelle vs semaine précédente
  - Comparer mois actuel vs mois précédent
  - Comparer année actuelle vs année précédente
  
- **Calcul** :
  - Si moyenne reps ↑ 5% = "Tendance à la hausse"
  - Si moyenne reps ↓ 5% = "Tendance à la baisse"
  - Si ±5% = "Stable"

- **Détail par exercice** :
```
  ✅ Pompes: +15% (hausse)
  ✅ Tractions: +8% (hausse)
  ⚠️ Biceps: -2% (baisse légère)
  ⏸️ Dips: 0% (stable)
```

- **Recommandations automatiques** :
  - Si hausse : "Continue comme ça ! 🔥"
  - Si baisse : "Attention à la récupération"
  - Si stable : "Essaie d'augmenter progressivement"

---

## **🎯 HEATMAP : INTENSITÉ D'ENTRAÎNEMENT**

### **Où ça apparaît :**
- Nouvel onglet "🗓️ Calendrier Heatmap"
- Vue annuelle ou mensuelle

### **Visuel (Vue mensuelle) :**
```
JANVIER 2024 - INTENSITÉ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  1 🟩 2 🟨 3 ⬜ 4 🟩 5 🟩 6 🟥 7 ⬜
  8 🟨 9 🟨 10⬜ 11🟩 12🟩 13🟥 14⬜
 15 🟩 16🟩 17⬜ 18🟨 19🟥 20🟥 21⬜
 22 🟩 23🟨 24⬜ 25🟨 26🟩 27🟩 28⬜
 29 🟥 30🟥 31⬜

🟥 = Très intense (> 250 reps)
🟩 = Intense (150-250 reps)
🟨 = Modéré (50-150 reps)
⬜ = Repos ou 0 reps
```

### **Paramètres :**
- **Couleurs** :
  - 🟥 Rouge = haute intensité (> 250 reps OU > 3 exercices)
  - 🟩 Vert = bonne intensité (150-250 reps)
  - 🟨 Jaune = modéré (50-150 reps)
  - ⬜ Gris = repos / 0 reps

- **Hover sur une date** : affiche détails du jour
```
  25 janvier
  280 reps total
  Exercices: Pompes, Dips, Tractions
  Durée: 1h15
  Intensité: 🟥 Très haute
```

- **Sélecteur** :
  - Vue mensuelle
  - Vue annuelle (12 mini-calendriers)
  - Filtrer par muscle group (voir intensité pour "dos" uniquement)

- **Patterns visibles** :
  - Si beaucoup de 🟥 : tu t'entraînes dur régulièrement
  - Si beaucoup de ⬜ : repos suffisant ou manque de constance
  - Pattern = lundi-mardi-mercredi 🟥, jeudi ⬜, vendredi-samedi 🟩

---

## **💪 VOLUME TOTAL PAR GROUPE MUSCULAIRE**

### **Où ça apparaît :**
- Onglet "📈 Graphiques"
- Section "Répartition par muscle"

### **Visuel :**
```
VOLUME PAR GROUPE MUSCULAIRE (Mois)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pectoraux    ████████░░ 820 reps (28%)
Dos          ██████████ 950 reps (32%)
Biceps       ███████░░░ 650 reps (22%)
Triceps      ██████░░░░ 580 reps (18%)
```

### **Paramètres :**
- **Mapping automatique** : chaque exercice = groupe musculaire
```
  "Pompes lestées" → Pectoraux
  "Tractions pronation" → Dos
  "Curl marteau" → Biceps
  "Extensions triceps" → Triceps
```

- **Données affichées** :
  - Nombre de reps total par muscle
  - Pourcentage du volume total
  - Barres proportionnelles

- **Graphique pie/donut** :
```
       Dos 32%
      ╱───╲
    Pec   Bic
    28%   22%
      ╲───╱
       Tri 18%
```

- **Période sélectionnable** : semaine/mois/année
- **Alertes d'équilibre** :
  - Si un muscle > 35% : "Attention, tu sur-entraînes un muscle"
  - Si un muscle < 15% : "Augmente le volume pour ce muscle"

---

## **⏱️ TEMPS MOYEN PAR SÉANCE**

### **Où ça apparaît :**
- Onglet "📈 Graphiques"
- Section "Durée & efficacité"

### **Visuel :**
```
TEMPS PAR SÉANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Temps moyen :      1h 15 min
Plus courte :      45 min (lundi dernier)
Plus longue :      1h 45 min (vendredi 15 jan)

Trend :            ▼ -10 min (tu es plus efficace!)
```

### **Paramètres :**
- **Calcul automatique** :
  - Enregistrer heure début/fin de chaque séance
  - Ou estimer par nombre d'exercices

- **Données** :
  - Temps moyen global
  - Temps par jour de la semaine
  - Temps par groupe musculaire
  
- **Graphique** :
```
  Durée (min)
      100 |
       90 |    ••  •
       80 |  ••    •  ••
       70 |           •
         └─────────────────
           Sem 1  Sem 2  Sem 3
```

- **Corrélation** :
  - Moins de temps + plus de reps = plus efficace ✅
  - Plus de temps + même reps = moins efficace ⚠️

---

## **🔥 CALORIES BRÛLÉES ESTIMÉES**

### **Où ça apparaît :**
- Onglet "📈 Graphiques"
- Section "Énergie dépensée"

### **Visuel :**
```
CALORIES BRÛLÉES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Aujourd'hui :      420 kcal
Cette semaine :    2500 kcal
Ce mois :          10,500 kcal

Par exercice :
  Pompes lestées:  180 kcal (43%)
  Tractions:       150 kcal (36%)
  Dips:            90 kcal (21%)
```

### **Paramètres :**
- **Formule d'estimation** :
```
  Calories = (Reps × Poids exercice × 0.012) + (Durée en min × MET × 3.5 × poids corporel / 200)
  
  Simplifié pour toi :
  Pompes lestées = 2 kcal par rep (avec gilet)
  Tractions = 1.5 kcal par rep
  Dips = 1.8 kcal par rep
  Curl = 0.5 kcal par rep
```

- **Variables à entrer** :
  - Poids corporel (pour estimation MET)
  - Poids du gilet lesté
  - Durée approximative de la séance

- **Historique** :
  - Graphique jour par jour
  - Moyenne par semaine
  - Comparaison semaines

- **Objectif** :
  - Fixer un objectif "3000 kcal/semaine"
  - Alerte si atteint ou non

---

## **📈 TAUX DE PROGRESSION MOYEN PAR EXERCICE**

### **Où ça apparaît :**
- Onglet "📊 Stats"
- Colonne dédiée dans le top 10 exercices

### **Visuel :**
```
TAUX DE PROGRESSION (Mensuel)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pompes:        +15% mois/mois ▲ (excellent)
Tractions:     +8% mois/mois ▲ (bon)
Dips:          +3% mois/mois ▲ (stable)
Biceps:        -2% mois/mois ▼ (attention)
```

### **Paramètres :**
- **Calcul** : (reps actuelles - reps mois dernier) / reps mois dernier × 100

- **Période** :
  - Semaine sur semaine
  - Mois sur mois
  - Année sur année

- **Couleurs** :
  - 🟢 Vert : > 5% = progression rapide
  - 🟡 Jaune : 1-5% = progression lente
  - ⚫ Gris : 0-1% = stagnation
  - 🔴 Rouge : < 0% = régression

- **Alert** :
  - "Progression rapide ! Continue comme ça 🚀"
  - "Stagne depuis 3 semaines, augmente progressivement"
  - "Attention, légère baisse"

---

## **🏅 BEST DAY EVER**

### **Où ça apparaît :**
- **Dashboard principal** (carte highlight)
- Onglet "📈 Graphiques"

### **Visuel :**
```
┌─────────────────────────────┐
│ 🏆 TON MEILLEUR JOUR       │
├─────────────────────────────┤
│ 25 janvier 2024             │
│ 450 reps total              │
│ 8 exercices différents       │
│ Durée: 1h 45 min            │
│                              │
│ Détails:                     │
│ • Pompes: 60 reps           │
│ • Tractions: 50 reps        │
│ • Dips: 40 reps             │
│ • ...                        │
│                              │
│ Intensité: 🔥 EXTRÊME      │
└─────────────────────────────┘
```

### **Paramètres** :
- **Détection automatique** : jour avec le plus de reps total
- **Bouton pour changer la métrique** :
  - Meilleur jour par reps total
  - Meilleur jour par nombre d'exercices
  - Meilleur jour par durée
  - Meilleur jour par calories

- **Historique top 5** :
```
  🥇 1er : 25 jan - 450 reps
  🥈 2ème : 18 jan - 420 reps
  🥉 3ème : 11 jan - 410 reps
  4ème : 4 jan - 390 reps
  5ème : 28 déc - 380 reps
```

- **Badge déverrouillé** :
  - "Record personnel 🏆"
  - Notification quand tu bats ton record

---

## **⏱️ RESSENTI/DIFFICULTÉ (Échelle 1-10)**

### **Où ça apparaît :**
- **Onglet "Aujourd'hui"** : après la séance
- **Popup "Fin de séance"**

### **Visuel :**
```
FIN DE SÉANCE - 15 janvier 2024
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Comment tu te sens ?
   ☆ ☆ ☆ ☆ ☆  (clic pour évaluer de 1-5 ou 1-10)
   
2. Difficulté de la séance ?
   🟩🟩🟩🟩🟩🟩⬜⬜⬜⬜ (6/10)
   
3. Énergie au départ ?
   🟩🟩🟩🟩⬜⬜⬜⬜⬜⬜ (4/10)
   
4. Notes :
   [Bon jour | Fatigue | Courbatures | Douleur | ]
Paramètres :

3 questions post-séance :

Ressenti global (1-10 étoiles)
Difficulté perçue (slider 1-10)
Énergie avant séance (slider 1-10)


Stockage :

json  {
    "date": "2024-01-15",
    "ressenti": 8,
    "difficulte": 6,
    "energie_debut": 4,
    "notes": "Bon jour, biceps fatigué"
  }
```

- **Analyse** :
  - Graphique ressenti vs progression
  - Corrélation énergie/performance
  - Meilleure performance à quel ressenti ?

### **Graphique Corrélation** :
```
RESSENTI vs PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reps
 60 |        •
 50 |   •   ••  •
 40 |  •  •  •
 30 | •
    └─────────────────────
      1   3   5   7   9   (Ressenti)
      
Pattern: Meilleure performance quand ressenti 7-8 ✅
```

---

## **📝 NOTES : "BON JOUR", "FATIGUE", etc.**

### **Où ça apparaît** :
- **Popup fin de séance**
- **Onglet Historique** (visible sur chaque séance)

### **Visuel** :
```
NOTES DE LA SÉANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sélectionner :  ☑️ Bon jour
                ☐ Fatigue
                ☑️ Biceps fatigué
                ☐ Douleur
                ☑️ Récupération ok
                ☐ Insomnie
                ☐ Maladie

Ou texte libre :
[_________________________________]
```

### **Paramètres** :
- **Tags prédéfinis** :
  - "Bon jour", "Mauvais jour"
  - "Fatigue", "Courbatures"
  - "Douleur", "Blessure"
  - "Récupération ok", "Insomnie"
  - "Maladie", "Stress élevé"

- **Texte libre** : notes personnalisées

- **Historique** : voir la note en consultant la séance passée

- **Analyse** :
```
  CORRÉLATION NOTES vs PERFORMANCE
  
  Quand "Bon jour" → +15% reps en moyenne
  Quand "Fatigue" → -10% reps en moyenne
  Quand "Insomnie" → -20% reps en moyenne
```

---

## **🔄 VARIATIONS D'EXERCICES**

### **Où ça apparaît** :
- **Onglet "Aujourd'hui"** : sous chaque exercice
- **Modifier le programme**

### **Visuel** :
```
POMPES INCLINÉES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Série: 4×12
Reps: [____]

Variation utilisée :
🔘 Standard (mains sur banc)
⚪ Déclinée (pieds sur banc)
⚪ Large grip
⚪ Diamant
⚪ Autre: ________________

Détail (optionnel):
[___________________________________]
```

### **Paramètres** :
- **Exercice = plusieurs variantes** :
```
  "Pompes" → 
    - Standard
    - Inclinées
    - Déclinées
    - Diamant
    - Large grip
    - Planche pseudo
    
  "Tractions" →
    - Pronation
    - Supination
    - Neutre
    - Large grip
```

- **Pour chaque séance** :
  - Enregistrer quelle variation
  - Sauvegarder les reps par variation
  - Historique des variations

- **Analyse par variation** :
```
  POMPES - COMPARAISON PAR VARIATION
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  Standard:      50 reps avg (fait 8 fois)
  Diamant:       35 reps avg (fait 5 fois)
  Inclinées:     45 reps avg (fait 10 fois)
  
  La meilleure: Inclinées (+ nombreuses séances)
```

---

## **📅 CALENDRIER ANNUEL COMPLET**

### **Où ça apparaît** :
- Nouvel onglet "🗓️ Calendrier"

### **Visuel (Vue annuelle)** :
```
CALENDRIER 2024 - VUE ANNUELLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

JAN                FEV                MAR
L M M J V S D    L M M J V S D    L M M J V S D
1 🟩🟨⬜🟩🟩🟥⬜  ⬜🟩🟩🟩🟨⬜🟩  ⬜🟩🟩🟨🟩🟥🟩
🟨🟨⬜🟩🟩⬜🟩    🟩🟨⬜🟩🟩🟥⬜  🟩🟩⬜🟩🟩🟩⬜

AVR                MAI                JUN
...

AOÛT:  📉 (activité basse - vacances?)
DÉCEM: 🟥🟥🟥 (pic d'activité - préparation?)
```

### **Paramètres** :
- **Vue** : annuelle complète, ou un mois à la fois
- **Couleurs heatmap** :
  - 🟥 Très intense
  - 🟩 Intense
  - 🟨 Modéré
  - ⬜ Repos

- **Click sur une date** : affiche détails du jour

- **Patterns visibles** :
  - Voir les vacances (⬜ blanc)
  - Voir les pics d'entraînement
  - Voir si tu t'entraînes régulièrement

- **Filtre par muscle group** :
  - Voir uniquement les jours où tu as travaillé "dos"
  - Voir uniquement "jambes"
  - Voir mix spécifiques

---

## **✏️ MODIFIER LE PROGRAMME**

### **Où ça apparaît** :
- Nouvel onglet "⚙️ Programme"

### **Visuel** :
```
MODIFIER LE PROGRAMME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🗓️ LUNDI - Street Workout-Boxe

Exercices actuels:
1. Tractions pronation (4×4-6)      [↑ ↓] [✏️] [🗑️]
2. Tractions australiennes (4×10)   [↑ ↓] [✏️] [🗑️]
3. Dips parallèles (4×12)           [↑ ↓] [✏️] [🗑️]

[+ Ajouter exercice]  [📋 Dupliquer]  [💾 Sauvegarder]
```

### **Paramètres** :
- **Ajouter un exercice** :
```
  Nouvelle ligne:
  [Sélectionner exercice ▼] [Séries ▼] [Reps ▼]
```

- **Modifier un exercice** :
  - Click sur ✏️
  - Change nom, séries, reps
  - Enregistre

- **Supprimer** : click 🗑️

- **Réordonner** : flèches ↑↓

- **Dupliquer jour entier** :
  - Copier lundi sur jeudi
  - Réutiliser une séance

- **Créer une variante personnalisée** :
  - "Lundi - Spécial Pectoraux"
  - Ajouter exercices spécifiques

---

## **🔄 GESTION DES CYCLES**

### **Où ça apparaît** :
- Nouvel onglet "🔄 Cycles"
- **Liste des cycles** :

### **Visuel** :
```
MES CYCLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACTIF:
┌──────────────────────────────────────┐
│ 🟢 Cycle 3+1 v1 (Actif)              │
│ Démarré: 1 janvier 2024              │
│ Durée: 3 mois                        │
│ Progression: +22%                    │
│ Total reps: 15,800                   │
│                                      │
│ [Voir détails] [Voir stats]          │
└──────────────────────────────────────┘

HISTORIQUE:
┌──────────────────────────────────────┐
│ Cycle 3+1 v0 (Archivé)               │
│ Période: 1 oct - 31 déc 2023         │
│ Progression: +18%                    │
│ Total reps: 12,400                   │
│                                      │
│ [Basculer vers] [Comparer]           │
└──────────────────────────────────────┘

[+ Créer nouveau cycle]
```

### **Paramètres** :
- **Créer un nouveau cycle** :
```
  Nom: [Cycle 3+1 v2________________]
  Duplication: ⚪ Nouveau
               🔘 Dupliquer cycle actif
  Date de démarrage: [1 avril 2024]

Basculer entre cycles :

Click "Basculer vers"
Données précédentes sauvegardées
Nouveau cycle devient actif


📊 Détail Complet de Chaque Fonctionnalité (Suite)

🔄 GESTION DES CYCLES (Suite)
Comparaison de cycles :
COMPARAISON: Cycle v1 vs Cycle v0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       Cycle v1   Cycle v0   Diff
Reps:  15,800    12,400    +27% ▲
Streak: 25j       18j      +39% ▲
Séances: 42       38       +11% ▲
Progression: +22% +18%    +4% ▲
Meilleur jour: 450 410    +40 ▲

Conclusion: Cycle v1 plus efficace! 🚀
```

- **Export/Import cycles** :
```
  [📥 Importer]  [📤 Exporter JSON]  [🔗 Partager]
```

- **Exporter en JSON** :
  - Fichier téléchargeable
  - Contient tous les exercices + reps + dates
  - Peut être partagé avec coach/ami

- **Importer un cycle** :
  - Upload un fichier JSON
  - Ou copier le JSON d'un ami
  - Cycle importé créé avec tous les historiques

---

## **🔬 STATISTIQUES DÉTAILLÉES (Science)**

### **Où ça apparaît** :
- Nouvel onglet "🔬 Analyse Scientifique"

### **1️⃣ INDICE DE RÉCUPÉRATION**

### **Visuel** :
```
INDICE DE RÉCUPÉRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Aujourd'hui: 7.2/10 (Bon) 🟢

Facteurs:
├─ Jours depuis dernière séance: 1 jour (⚠️ -1 point)
├─ Qualité du sommeil: 8/10 (✅ +2 points)
├─ Ressenti général: 7/10 (✅ +1 point)
├─ Notes: "Récupération ok" (✅ +0.5)
└─ Tendance stress: Normal (✅ 0)

Recommandation: ✅ Tu peux t'entraîner dur aujourd'hui
```

### **Paramètres** :
- **Calcul** :
```
  Indice = (Jours repos × 2) + (Sommeil/10) + (Ressenti/10) - Stress
```

- **Données d'entrée** :
  - Jours depuis dernière séance (auto)
  - Heures de sommeil (à entrer ou estimer)
  - Note ressenti (1-10)
  - Notes qualitatives (bon jour, fatigue, etc.)

- **Seuils** :
  - < 3 : Repos recommandé 🔴
  - 3-6 : Entraînement léger 🟡
  - 6-8 : Entraînement normal 🟢
  - > 8 : Entraînement intensif 🟥

- **Historique graphique** :
```
  Récupération (dernières 4 semaines)
  10 |     •
   8 |  •     •   •
   6 |    •  •  •
   4 |•        •
   2 |
    └─────────────────────
      L M M J V S D L...
      
  Pattern: Mieux le week-end
```

- **Alerte** :
  - "Attention, repos insuffisant!"
  - "Prends un jour de repos"
  - "Parfait pour une séance intense"

---

### **2️⃣ VO2 MAX ESTIMATION**

### **Visuel** :
```
VO2 MAX ESTIMÉ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VO2 Max actuel: 42 ml/kg/min (Bon) 🟢

Historique:
- Il y a 3 mois: 38 ml/kg/min
- Progression: +4 ml/kg/min (+10.5%) ▲

Évolution (3 mois)
45 |      •
43 |   •  •
41 |•  •
39 |
   └─────────────
     M1 M2 M3

Tendance: ↑ Ton endurance augmente!
```

### **Paramètres** :
- **Formule simplifiée** :
```
  VO2 Max ≈ 15.3 × (Max HR / Resting HR)
  
  Pour toi:
  VO2 Max ≈ 15.3 × (Total Reps / Avg Reps) × (Progression%)
```

- **Entrée manuelle** (si tu as une montre/test réel) :
```
  [Entrer VO2 Max réel: ____] ml/kg/min
```

- **Catégories** :
  - < 35: Faible
  - 35-42: Moyen/Bon
  - 42-52: Très bon
  - > 52: Excellent

---

### **3️⃣ CALORIES BRÛLÉES DÉTAILLÉES**

### **Visuel** :
```
CALORIES BRÛLÉES - ANALYSE DÉTAILLÉE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Aujourd'hui: 450 kcal

Répartition:
├─ Exercices (reps × coefficient): 350 kcal (78%)
│  ├─ Pompes lestées: 150 kcal
│  ├─ Tractions: 120 kcal
│  ├─ Dips: 80 kcal
│  └─ Autres: 0 kcal
│
└─ Métabolisme de base: 100 kcal (22%)

Cette semaine: 2,850 kcal
Ce mois: 12,400 kcal
```

### **Paramètres** :
- **Coefficients personnalisables** :
```
  Pompes = 2 kcal/rep
  Tractions = 1.5 kcal/rep
  Dips = 1.8 kcal/rep
  [Ajouter exercice custom]
```

- **Données d'entrée** :
  - Poids corporel (pour BMR)
  - Poids du gilet (ajuste le coefficient)
  - Durée séance

- **Objectif calories** :
```
  Déficit/surplus calorique:
  
  Objectif: 3000 kcal/semaine
  Actuel: 2850 kcal/semaine
  Manque: 150 kcal (1 séance supplémentaire)
```

- **Graphique hebdo** :
```
  Calories/jour (dernière semaine)
  500 | 🟩
  400 | 🟨 🟩 🟩
  300 | 🟩 🟨    🟩
  200 |          🟨
  100 |
      └─────────────────
        L M M J V S D
```

---

## **📸 SUIVI CORPOREL AVANCÉ**

### **Où ça apparaît** :
- Onglet "📸 Suivi Corporel" (amélioré)

### **1️⃣ COMPARAISON AVANT/APRÈS**

### **Visuel** :
```
COMPARAISON: 1 JAN → 15 MARS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

           1 JAN      15 MAR     DELTA
Poids:     75 kg      72 kg      -3 kg ▼
Poitrine:  98 cm      102 cm     +4 cm ▲
Biceps:    32 cm      34 cm      +2 cm ▲
Tour taille: 85 cm   82 cm      -3 cm ▼
Hanches:   92 cm      90 cm      -2 cm ▼
Cuisses:   58 cm      60 cm      +2 cm ▲

INTERPRÉTATION:
✅ Perte de poids: -3 kg
✅ Prise de muscle: +4 cm poitrine, +2 cm biceps, +2 cm cuisses
✅ Perte de graisse: -3 cm tour taille
= Recomposition corporelle excellente!
```

### **Paramètres** :
- **Sélectionner deux dates** :
  - Date 1: [Date picker]
  - Date 2: [Date picker]

- **Affichage** :
  - Côte à côte comparaison
  - Deltas positifs en vert ▲
  - Deltas négatifs en rouge ▼

- **Interprétation auto** :
  - Si -poids +muscle : "Recomposition corporelle" ✅
  - Si -poids -muscle : "Perte de masse" ⚠️
  - Si +poids +muscle : "Prise de masse" ✅

---

### **2️⃣ GRAPHIQUES MENSURATIONS**

### **Visuel** :
```
ÉVOLUTION DES MENSURATIONS (3 mois)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

POIDS (kg)
76 |•
75 |  •
74 |    •  •
73 |       •
72 |         •
   └──────────────
     J  F  M  (mois)

POITRINE (cm)
104 |        •
102 |    •  •
100 |•  •
    └──────────────
     J  F  M

BICEPS (cm)
34 |      •
33 |   •
32 |•  •
31 |     •
   └──────────────
     J  F  M

TOUR TAILLE (cm)
86 |•
85 |  •  •
84 |      •
83 |       •
   └──────────────
     J  F  M
```

### **Paramètres** :
- **Multi-graphiques** : chaque mensuration sa courbe
- **Sélection graphique** :
  - Voir une, deux ou toutes les mensurations
  - Toggle on/off chaque courbe

- **Trend line** :
  - Ligne de tendance automatique
  - Prédiction future (si trend continue)
```
  Poitrine: +2 cm/mois
  À ce rythme, tu atteindras 106 cm en mai
```

- **Corrélation avec reps** :
```
  CORRÉLATION: Biceps vs Reps Tractions
  
  Biceps   Reps Tract
  34 cm    200 reps
  33 cm    180 reps
  32 cm    160 reps
  
  Coefficient: +0.1 cm pour +10 reps ✅
```

---

### **3️⃣ INDEX DE MASSE MUSCULAIRE ESTIMÉ (IMM)**

### **Visuel** :
```
INDEX DE MASSE MUSCULAIRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMM estimé: 18.2 kg

Évolution (3 mois):
- 1 jan: 17.5 kg
- 15 fév: 17.8 kg
- 15 mars: 18.2 kg
+ 0.7 kg = +4% (excellent!) ▲

Graphique:
18.5 |       •
18.0 |    •
17.5 |•
17.0 |
    └──────────────────
      J  F  M

Corrélation reps + IMM: ✅ Positive!
```

### **Paramètres** :
- **Formule IMM** :
```
  IMM ≈ (Poids × 0.3) + (Mensurations × coefficients)
  
  Simplifié:
  IMM ≈ ((Biceps×2 + Poitrine×0.5 + Cuisses×1.5) / 4)
```

- **Entrée manuelle** :
  - Si tu fais une DEXA scan réel
  - Ou bioimpédance (balance connectée)

- **Seuils santé** :
  - Femme: 16-25 kg normal
  - Homme: 20-35 kg normal
  - Ton IMM: 18.2 kg (Bon pour ton profil)

---

## **🤖 INTELLIGENCE ARTIFICIELLE LÉGÈRE**

### **Où ça apparaît** :
- **Dashboard principal** (cartes IA)
- **Notifications**

### **1️⃣ AUTO-FILL DES REPS**

### **Visuel** :
```
POMPES INCLINÉES
Séries: 4×12

💡 Dernière fois (15 jan): 45 reps
Suggestion: 45-50 reps ✅

[Reps effectuées: ____]
```

### **Paramètres** :
- **Calcul** :
  - Chercher dernière séance cet exercice
  - Afficher les reps
  - Suggérer +5-10% (progression progressive)

- **Options** :
  - ☑️ Afficher suggestions
  - ☐ Auto-remplir (cocher la case)
  - Personnaliser % progression (défaut: +5%)

---

### **2️⃣ RECOMMANDATIONS**

### **Visuel** :
```
💡 RECOMMANDATIONS PERSONNALISÉES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ "Pompes: progression excellente +28%!"
   Continue sur cette lancée 🚀

⚠️ "Biceps: stagne depuis 3 semaines"
   Suggestion:
   • Augmente le poids du gilet
   • Ajoute des reps supplémentaires
   • Essaie une variation (curl concentration vs marteau)

✅ "Meilleur rendement: lundi-mardi"
   Tu es plus frais ces jours
   Concentration tes séances les plus dures

💡 "Streak: 15 jours, ton record est 20"
   Tu peux le battre! Continue 🔥
```

### **Paramètres** :
- **Règles IA** :
```
  SI progression > 20% ALORS "Excellent!"
  SI progression < 3% AND durée > 2 semaines ALORS "Stagne"
  SI trend semaine i > trend semaine i-1 ALORS "Hauss€"
  SI jours streak = record - 1 ALORS "Presque là!"
```

- **Notifications** :
  - Tous les jours
  - Quand détecte changement
  - Quand atteint milestone

---

### **3️⃣ ANALYSE AUTOMATIQUE TEXTE**

### **Visuel** :
```
📊 RÉSUMÉ INTELLIGENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"Après 3 mois, tu as progressé de 28%
en 42 séances (3 par semaine régulièrement).

Tes meilleurs exercices sont les pompes (+35%)
et les tractions (+25%).

Ton poids est stable (75 kg) mais tu as gagné
+4 cm de poitrine et +2 cm de biceps
= prise de muscle excellente.

Tendance: ↑ Hausse continue depuis 6 semaines.
À ce rythme, tu atteindras +50% en 2 mois.

Conseil: Augmente progressivement le poids
pour continuer la progression."
```

### **Paramètres** :
- **Générée automatiquement** à partir :
  - Durée programme
  - Nombre séances
  - Progression %
  - Mensurations
  - Poids
  - Trend

- **Fréquence** :
  - Chaque fin de mois
  - Ou manuellement
  - Share sur réseaux

---

## **📤 EXPORT & SCIENCE**

### **Où ça apparaît** :
- Bouton "📥 Exporter" dans chaque section

### **Options d'export** :

**1️⃣ CSV** :
```
date,exercice,reps,poids_gilet,variation,ressenti,difficulte
2024-01-15,Pompes lestées,45,10kg,Standard,8,6
2024-01-15,Tractions,50,0kg,Pronation,7,7
...
```

**2️⃣ PDF Rapport Mensuel** :
- Résumé texte
- Graphiques intégrés
- Progression
- Recommandations
- À imprimer ou envoyer au coach

**3️⃣ JSON Backup** :
- Complet (tout l'historique)
- Transportable
- Importable ailleurs

**4️⃣ Partage Coach** :
```
[🔗 Générer lien partageable]

Lien: https://tracker.com/share/abc123
(Expire dans 7 jours)

Coach reçoit accès lecteur à:
- Toutes les séances
- Graphiques
- Mensurations
- Peut laisser commentaires

📋 EXEMPLE COMPLET D'UNE JOURNÉE
Matin :

Check le dashboard: "Bon jour pour entraînement!" (Indice récupération 7.5/10)
Click "Aujourd'hui" → mercredi
Voit la séance programmée (Boxe - Maison)

Pendant l'entraînement :

Fait pompes: entre "45 reps"
App suggère (auto-fill): "Dernière fois 42, vas pour 45-47" ✅
Fait tractions: entre "48 reps"
Note variation utilisée: "Pronation"

Fin séance :

Popup: "Ressenti? Difficulté? Énergie?"
Note: "Bon jour, très énergique"
Tags: "Bon jour ✅", "Récupération ok ✅"

Après :

Dashboard update automatiquement
Voit: "450 reps aujourd'hui ✅"
Streak augmente: "15 jours 🔥"

Soir :

Check Stats: "Pompes +18% ce mois" 📈
Check Heatmap: "Aujourd'hui intense 🟥"
Check Graphiques: "Progression sur biceps?"

Fin semaine :

Check Comparaison: "Cette semaine +12% vs semaine passée" ✅
Check Suivi: "Poids stable 72kg, biceps +1cm"
Check IA: "Continue comme ça, excellent progression!"

