# LEARNING STATUS BLOCK - REFONTE COMPLÈTE

## 📋 Vue d'Ensemble

**Objectif** : Enrichir le LearningStatusBlock actuel avec toutes les fonctionnalités du code Vue.js de référence

**Fichier source** : `docs/finance/codepourleblocapprentissagejusteendessousdesurveillance.md` (Vue.js)  
**Fichier cible** : `src/components/dashboard/LearningStatusBlock.jsx` (React)  
**État actuel** : ~150 lignes (basique)  
**État cible** : ~800-1000 lignes (complet)  
**Complexité** : Modérée

---

## 🎯 Fonctionnalités à Ajouter

### Actuellement Implémenté (Basique)
- ✅ Header avec icône GraduationCap
- ✅ Badge "ATTEINT" si objectif atteint
- ✅ Matière active avec icône
- ✅ Bouton "Session" pour démarrer un timer
- ✅ Barre de progression du temps étudié
- ✅ Statistiques sessions et streak
- ✅ Liste des matières disponibles

### À Ajouter (Code Vue.js de Référence)

#### 1. Header Enrichi
- Badge de statut dynamique (ATTEINT/EN COURS/À RISQUE)
- Couleurs dynamiques selon le statut
- Effet glow sur la card

#### 2. Statistiques Détaillées
- **Streak** : Jours consécutifs avec icône 🔥
- **Sessions** : Complétées/Planifiées (ex: 2/4)
- **Objectif** : Temps quotidien formaté (ex: 2h00)
- **Restant** : Temps restant pour atteindre l'objectif

#### 3. Progression du Jour Améliorée
- Header avec "Sessions aujourd'hui X/Y"
- Barre de progression avec classes dynamiques (completed/good/average/low)
- Détails temps : "⏱️ Xh étudié" + "Xh restant"

#### 4. Objectif Quotidien
- Indicateur visuel avec icône dynamique (✅/🎯/⏳/⚠️)
- Message dynamique selon le statut :
  - completed: "Objectif quotidien atteint !"
  - on-track: "Bon rythme, continuez !"
  - in-progress: "En cours, maintenez l'effort"
  - at-risk: "Objectif à risque, accélérez !"

#### 5. Extras de Statut
- **Si aucune session** : Bouton "▶️ Commencer première session"
- **Si récompense récente** : Affichage "🏆 [Nom récompense] [Date]"

#### 6. Actions Rapides
- Bouton "🎯 Session" (ou "⏱️ En cours" si timer actif)
- Bouton "📝 Notes" pour ouvrir les notes de la matière

#### 7. Interactions
- Click sur la card → Navigation vers le planificateur
- Click sur "Session" → Démarrer un timer (25min Pomodoro par défaut)
- Click sur "Notes" → Ouvrir modal de notes
- Gestion des événements (timer completed, session completed)
- Vérification des nouvelles récompenses

---

## 📊 Comparaison Actuel vs Cible

| Fonctionnalité | Actuel | Cible |
|----------------|--------|-------|
| Lignes de code | ~150 | ~800-1000 |
| Statistiques | 2 (sessions, streak) | 4 (streak, sessions, objectif, restant) |
| Progression | Basique | Détaillée avec temps |
| Objectif quotidien | Implicite | Explicite avec message |
| Actions | 1 bouton | 2 boutons + interactions |
| Récompenses | Non | Oui (dernière récompense) |
| Navigation | Non | Oui (vers planificateur) |
| Timer actif | Non géré | Géré (bouton désactivé) |
| Messages dynamiques | Non | Oui (selon statut) |

---

## 🎨 Design System

### Couleurs par Statut

#### Objectif Status
- **completed** : Vert (objectif atteint ≥100%)
- **on-track** : Cyan (bon rythme ≥75%)
- **in-progress** : Jaune (en cours ≥25%)
- **at-risk** : Rouge (à risque <25%)

#### Progress Bar
- **completed** : Vert (100%)
- **good** : Cyan (≥75%)
- **average** : Jaune (≥50%)
- **low** : Rouge (<50%)

### Icônes

#### Matières
- Écriture: ✍️
- Programmation: 💻
- Langues: 🗣️
- Mathématiques: 🔢
- Sciences: 🔬
- Histoire: 📜
- Philosophie: 🤔
- Défaut: 📚

#### Statuts
- completed: ✅
- on-track: 🎯
- in-progress: ⏳
- at-risk: ⚠️

#### Actions
- Session: 🎯 (ou ⏱️ si actif)
- Notes: 📝
- Play: ▶️
- Récompense: 🏆

---

## 🔧 Props et États

### Props
```javascript
{
  allData: {
    mockData: {
      learningStatus: {
        activeSubject: string,
        subjectType: string,
        sessionsCompleted: number,
        sessionsPlanned: number,
        timeStudiedToday: number, // minutes
        dailyObjectiveMinutes: number,
        streakDays: number,
        latestReward: {
          name: string,
          icon: string,
          date: string
        }
      },
      activeTimer: {
        isActive: boolean
      },
      user: {
        streakDays: number // fallback
      }
    }
  },
  onStartTimer: function,
  onOpenNotes: function,
  onNavigate: function
}
```

### États Internes
```javascript
const [timeStudied, setTimeStudied] = useState(0);
const [sessionsCompleted, setSessionsCompleted] = useState(0);
const [isTimerActive, setIsTimerActive] = useState(false);
```

### Computed Values
```javascript
const progressPercent = (timeStudied / dailyObjective) * 100;
const timeRemaining = Math.max(0, dailyObjective - timeStudied);
const objectiveStatus = getObjectiveStatus(progressPercent);
const progressClass = getProgressClass(progressPercent);
const hasSessionToday = sessionsCompleted > 0;
```

---

## 📝 Fonctions Utilitaires

### formatDuration(minutes)
```javascript
const hours = Math.floor(minutes / 60);
const mins = minutes % 60;
return hours > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${mins}min`;
```

### formatRewardDate(dateString)
```javascript
const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
if (diffDays === 0) return 'aujourd\'hui';
if (diffDays === 1) return 'hier';
if (diffDays < 7) return `il y a ${diffDays} jours`;
return date.toLocaleDateString('fr-FR');
```

### getObjectiveIcon(status)
```javascript
switch (status) {
  case 'completed': return '✅';
  case 'on-track': return '🎯';
  case 'in-progress': return '⏳';
  case 'at-risk': return '⚠️';
  default: return '❓';
}
```

### getObjectiveMessage(status)
```javascript
switch (status) {
  case 'completed': return 'Objectif quotidien atteint !';
  case 'on-track': return 'Bon rythme, continuez !';
  case 'in-progress': return 'En cours, maintenez l\'effort';
  case 'at-risk': return 'Objectif à risque, accélérez !';
  default: return 'Commencez votre apprentissage';
}
```

---

## 🚀 Plan d'Implémentation

### Phase 1 : Enrichissement des Statistiques
- Ajouter les 4 statistiques (streak, sessions, objectif, restant)
- Formater les durées correctement
- Ajouter les icônes appropriées

### Phase 2 : Progression Détaillée
- Améliorer la barre de progression avec classes dynamiques
- Ajouter les détails temps (étudié/restant)
- Ajouter le header "Sessions aujourd'hui X/Y"

### Phase 3 : Objectif Quotidien
- Ajouter la section objectif avec indicateur
- Implémenter les messages dynamiques
- Ajouter les icônes de statut

### Phase 4 : Extras et Actions
- Ajouter le bouton "Commencer première session"
- Ajouter l'affichage de la dernière récompense
- Améliorer les actions rapides (Session + Notes)

### Phase 5 : Interactions
- Implémenter la navigation vers le planificateur
- Gérer l'état du timer actif
- Ajouter les callbacks pour les événements

### Phase 6 : Polish
- Ajouter les effets hover
- Optimiser avec useCallback/useMemo
- Ajouter PropTypes
- Documenter avec JSDoc

---

## ✅ Critères de Succès

- [ ] Toutes les fonctionnalités du code Vue.js implémentées
- [ ] 0 erreur de compilation
- [ ] 0 warning React
- [ ] Code optimisé (useCallback, useMemo)
- [ ] PropTypes complets
- [ ] Documentation JSDoc
- [ ] Design cohérent avec le reste du dashboard
- [ ] Responsive design
- [ ] Accessibilité (aria-labels)

---

## 📚 Références

- **Code Vue.js** : `docs/finance/codepourleblocapprentissagejusteendessousdesurveillance.md`
- **Code React actuel** : `src/components/dashboard/LearningStatusBlock.jsx`
- **Méthodologie** : Même approche que SurveillanceBlock (progressive, documentée)

---

**Prochaine étape** : Créer le plan d'implémentation détaillé avec les tâches spécifiques
