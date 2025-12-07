// ================ BLOC STATUS APPRENTISSAGE - AUJOURD'HUI - PRIORITÉ ÉLEVÉE ================

window.LearningStatusBlock = {
  template: `
    <div class="dashboard-card learning-status-card priority-high" @click="navigateToPlanner">
      <div class="card-glow"></div>
      
      <div class="card-header">
        <span class="card-icon">{{ subjectIcon }}</span>
        <h3 class="card-title">APPRENTISSAGE</h3>
        <span class="card-badge" :class="objectiveStatus">{{ objectiveText }}</span>
      </div>
      
      <div class="card-content">
        <!-- Matière active aujourd'hui -->
        <div class="active-subject">
          <div class="subject-display">
            <span class="subject-icon-large">{{ subjectIcon }}</span>
            <div class="subject-info">
              <div class="subject-name">{{ activeSubject }}</div>
              <div class="subject-type">{{ subjectType }}</div>
            </div>
          </div>
          <div class="learning-stats">
            <div class="stat">
              <span class="stat-label">Streak</span>
              <span class="stat-value">{{ streakDays }} jours</span>
            </div>
            <div class="stat">
              <span class="stat-label">Sessions</span>
              <span class="stat-value">{{ sessionsCompleted }}/{{ sessionsPlanned }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Objectif</span>
              <span class="stat-value">{{ formatDuration(dailyObjectiveMinutes) }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Restant</span>
              <span class="stat-value">{{ formatDuration(timeRemainingToday) }}</span>
            </div>
          </div>
        </div>
        
        <!-- Progression du jour -->
        <div class="daily-progress">
          <div class="progress-header">
            <span class="progress-label">Sessions aujourd'hui</span>
            <span class="progress-count">{{ sessionsCompleted }}/{{ sessionsPlanned }}</span>
          </div>
          
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }" :class="progressClass"></div>
          </div>
          
          <div class="progress-details">
            <div class="time-studied">
              <span class="time-icon">⏱️</span>
              <span class="time-text">{{ formatDuration(timeStudiedToday) }} étudié</span>
            </div>
            
            <div class="time-remaining">
              <span class="remaining-text">{{ formatDuration(timeRemainingToday) }} restant</span>
            </div>
          </div>
        </div>
        
        <!-- Objectif quotidien -->
        <div class="daily-objective" :class="objectiveStatus">
          <div class="objective-indicator">
            <span class="objective-icon">{{ getObjectiveIcon() }}</span>
            <span class="objective-text">{{ getObjectiveMessage() }}</span>
          </div>
        </div>
        
        <!-- Timer discret ou dernière récompense -->
        <div class="status-extras">
          <div v-if="!hasSessionToday && !isTimerActive" class="start-timer">
            <button class="start-session-btn" @click.stop="startFirstSession">
              <span class="btn-icon">▶️</span>
              <span class="btn-text">Commencer première session</span>
            </button>
          </div>
          
          <div v-if="latestReward" class="latest-reward">
            <div class="reward-display">
              <span class="reward-icon">🏆</span>
              <span class="reward-text">{{ latestReward.name }}</span>
              <span class="reward-date">{{ formatRewardDate(latestReward.date) }}</span>
            </div>
          </div>
        </div>
        
        <!-- Actions rapides -->
        <div class="quick-actions">
          <button class="action-btn primary" @click.stop="startSession" :disabled="isTimerActive">
            <span class="btn-icon">{{ isTimerActive ? '⏱️' : '🎯' }}</span>
            <span class="btn-text">{{ isTimerActive ? 'En cours' : 'Session' }}</span>
          </button>
          
          <button class="action-btn secondary" @click.stop="openNotes">
            <span class="btn-icon">📝</span>
            <span class="btn-text">Notes</span>
          </button>
        </div>
      </div>
    </div>
  `,
  
  props: {
    allData: {
      type: Object,
      required: true
    }
  },
  
  computed: {
    learningData() {
      return this.allData?.mockData?.learningStatus || {};
    },

    // Fallback si non fourni dans learningStatus
    streakDays() {
      const fromLearning = this.learningData.streakDays;
      const fromUser = this.allData?.mockData?.user?.streakDays;
      const value = fromLearning ?? fromUser ?? 0;
      return Number.isFinite(Number(value)) ? Number(value) : 0;
    },

    // Style inline pour neutraliser 100% des lueurs et gradients
    flatBtnStyle() {
      return {
        background: 'rgba(0,245,255,0.08)',
        color: 'var(--neon-cyan)',
        border: '1px solid rgba(0,245,255,0.28)',
        boxShadow: 'none',
        filter: 'none',
        backgroundImage: 'none'
      };
    },
    
    activeSubject() {
      return this.learningData.activeSubject || 'Aucune matière';
    },
    
    subjectType() {
      return this.learningData.subjectType || 'apprentissage';
    },
    
    subjectIcon() {
      const iconMap = {
        'Écriture': '✍️',
        'Programmation': '💻',
        'Langues': '🗣️',
        'Mathématiques': '🔢',
        'Sciences': '🔬',
        'Histoire': '📜',
        'Philosophie': '🤔'
      };
      return iconMap[this.activeSubject] || '📚';
    },
    
    sessionsCompleted() {
      return this.learningData.sessionsCompleted || 0;
    },
    
    sessionsPlanned() {
      return this.learningData.sessionsPlanned || 0;
    },
    
    progressPercent() {
      if (this.sessionsPlanned === 0) return 0;
      return Math.min((this.sessionsCompleted / this.sessionsPlanned) * 100, 100);
    },
    
    progressClass() {
      if (this.progressPercent >= 100) return 'completed';
      if (this.progressPercent >= 75) return 'good';
      if (this.progressPercent >= 50) return 'average';
      return 'low';
    },
    
    timeStudiedToday() {
      return this.learningData.timeStudiedToday || 0; // en minutes
    },
    
    dailyObjectiveMinutes() {
      return this.learningData.dailyObjectiveMinutes || 120; // 2h par défaut
    },
    
    timeRemainingToday() {
      return Math.max(0, this.dailyObjectiveMinutes - this.timeStudiedToday);
    },
    
    objectiveStatus() {
      const percent = (this.timeStudiedToday / this.dailyObjectiveMinutes) * 100;
      if (percent >= 100) return 'completed';
      if (percent >= 75) return 'on-track';
      if (percent >= 25) return 'in-progress';
      return 'at-risk';
    },
    
    objectiveText() {
      const percent = (this.timeStudiedToday / this.dailyObjectiveMinutes) * 100;
      if (percent >= 100) return 'ATTEINT';
      if (percent >= 75) return 'EN COURS';
      return 'À RISQUE';
    },
    
    hasSessionToday() {
      return this.sessionsCompleted > 0;
    },
    
    isTimerActive() {
      return this.allData?.mockData?.activeTimer?.isActive || false;
    },
    
    latestReward() {
      return this.learningData.latestReward || null;
    }
  },
  
  methods: {
    getObjectiveIcon() {
      switch (this.objectiveStatus) {
        case 'completed': return '✅';
        case 'on-track': return '🎯';
        case 'in-progress': return '⏳';
        case 'at-risk': return '⚠️';
        default: return '❓';
      }
    },
    
    getObjectiveMessage() {
      switch (this.objectiveStatus) {
        case 'completed': return 'Objectif quotidien atteint !';
        case 'on-track': return 'Bon rythme, continuez !';
        case 'in-progress': return 'En cours, maintenez l\'effort';
        case 'at-risk': return 'Objectif à risque, accélérez !';
        default: return 'Commencez votre apprentissage';
      }
    },
    
    formatDuration(minutes) {
      const value = typeof minutes === 'object' && minutes ? (minutes.minutes ?? 0) : Number(minutes) || 0;
      const hours = Math.floor(value / 60);
      const mins = value % 60;
      return hours > 0 ? `${hours}h${mins > 0 ? mins.toString().padStart(2, '0') : ''}` : `${mins}min`;
    },
    
    formatRewardDate(dateString) {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'aujourd\'hui';
      if (diffDays === 1) return 'hier';
      if (diffDays < 7) return `il y a ${diffDays} jours`;
      return date.toLocaleDateString('fr-FR');
    },
    
    startFirstSession() {

      this.startSession();
    },
    
    startSession() {
      if (this.isTimerActive) {

        return;
      }
      

      
      // Émettre l'événement pour démarrer un timer
      this.$emit('update-data', {
        type: 'start-learning-session',
        subject: this.activeSubject,
        duration: 25, // Pomodoro par défaut
        timestamp: new Date()
      });
    },
    
    openNotes() {

      
      // Émettre événement pour ouvrir les notes
      this.$emit('open-modal', {
        type: 'learning-notes',
        subject: this.activeSubject
      });
    },
    
    navigateToPlanner() {

      
      // Émettre événement de navigation
      this.$emit('navigate-to', 'planificateur');
    },
    
    onTimerCompleted(timerData) {
      if (timerData.subject === this.activeSubject) {

        
        // Mettre à jour les statistiques locales
        this.$emit('update-data', {
          type: 'session-completed',
          subject: this.activeSubject,
          duration: timerData.duration || 25,
          timestamp: new Date()
        });
      }
    },
    
    onSessionCompleted(sessionData) {

      // Vérifier si un nouveau badge a été débloqué
      this.checkForNewRewards();
    },
    
    checkForNewRewards() {
      const totalSessions = this.sessionsCompleted;
      const totalTime = this.timeStudiedToday;
      if (totalSessions === 1 && !this.hasSessionToday) {
        this.unlockReward('Premier pas', '🎯', 'Première session de la journée');
      }
      if (totalTime >= this.dailyObjectiveMinutes) {
        this.unlockReward('Objectif atteint', '🏆', 'Objectif quotidien accompli');
      }
    },
    
    unlockReward(name, icon, description) {

      if (typeof window.showNotification === 'function') {
        window.showNotification(`🎉 Badge débloqué : ${name}`, 'success');
      }
    }
  },
  
  mounted() {

  }
};


# Bloc Status Apprentissage - Documentation Complète des Classes CSS

## 📋 Informations Générales

- **Nom du bloc** : Status Apprentissage (Learning Status Block)
- **Priorité** : HIGH
- **Fichier JavaScript** : `src/components/dashboard/blocks/priority-high/LearningStatusBlock.js`
- **Fichier CSS Principal** : `src/styles/modular-dashboard-extended.css` (lignes 21-350)
- **Position** : Ligne 3, Colonne 1 du dashboard
- **Couleur signature** : Rose néon (#ff1493)

---

## 🎨 Structure Hiérarchique des Classes CSS

### 1. CONTENEUR PRINCIPAL

```css
.learning-status-card
```
- Conteneur racine du bloc
- `overflow: visible`
- Permet l'affichage des effets de lueur

```css
.learning-status-card .card-content
```
- Conteneur du contenu
- `overflow: visible`

```css
.learning-status-card .card-glow
```
- Effet de lueur du bloc (si activé)

---

### 2. HEADER (EN-TÊTE)

```css
.learning-status-card .card-header
```
- Conteneur de l'en-tête
- `border-bottom: 0.0625rem solid rgba(255, 20, 147, 0.4)`
- `padding-bottom: 0.375rem`
- `margin-bottom: 0.625rem`

```css
.learning-status-card .card-title
```
- Titre "APPRENTISSAGE"
- `background: linear-gradient(90deg, #ff1493, #ff69b4)`
- `-webkit-background-clip: text`
- `color: transparent`
- `letter-spacing: 0.03125rem`

```css
.learning-status-card .card-badge
```
- Badge de statut (ATTEINT / EN COURS / À RISQUE)
- `background: rgba(255,20,147,0.15)`
- `border: 1px solid rgba(255,20,147,0.4)`
- `color: #ff1493`


---

### 3. MATIÈRE ACTIVE (SUBJECT DISPLAY)

```css
.learning-status-card .subject-display
```
- Conteneur de la matière active
- `display: flex`
- `align-items: center`
- `gap: 12px`

```css
.learning-status-card .subject-icon-large
```
- Grande icône de la matière (📚, 💻, ✍️, etc.)
- `font-size: 20px`
- `filter: drop-shadow(0 0 6px rgba(255,20,147,0.6))`

```css
.learning-status-card .subject-info
```
- Conteneur des informations de la matière

```css
.learning-status-card .subject-info .subject-name
```
- Nom de la matière
- `font-weight: 800`
- `font-size: 16px`
- `letter-spacing: 0.3px`

```css
.learning-status-card .subject-info .subject-type
```
- Type de matière ("apprentissage")
- `color: #ff1493`
- `font-size: 12px`
- `opacity: 0.85`
- `text-transform: none`
- `letter-spacing: 0`

---

### 4. STATISTIQUES (LEARNING STATS)

```css
.learning-status-card .learning-stats
```
- Grid des 4 statistiques
- `display: grid`
- `grid-template-columns: repeat(4, 1fr)`
- `gap: 10px`
- `margin-top: 10px`

```css
.learning-status-card .learning-stats .stat
```
- Carte de statistique individuelle
- `position: relative`
- `overflow: hidden`
- `background: rgba(0,245,255,0.06)`
- `border: 1px solid rgba(0,245,255,0.18)`
- `border-radius: 12px`
- `padding: 10px 12px`
- `text-align: center`

```css
.learning-status-card .learning-stats .stat::after
```
- Pseudo-élément pour neutraliser les glows
- `content: ''`
- `position: absolute`
- `inset: 0`
- `pointer-events: none`
- `box-shadow: none !important`

```css
.learning-status-card .learning-stats .stat-label
```
- Label de la statistique (Streak, Sessions, Objectif, Restant)
- `color: var(--text-secondary)`
- `font-size: 11px`
- `letter-spacing: 0.2px`

```css
.learning-status-card .learning-stats .stat-value
```
- Valeur de la statistique
- `font-family: 'Orbitron', monospace`
- `font-weight: 900`
- `color: var(--neon-cyan)`
- `font-size: 15px`
- `letter-spacing: 0.3px`

```css
.learning-status-card .learning-stats .streak-pill
```
- Élément désactivé (supprimé du markup)
- `display: none !important`

---

### 5. BARRE DE PROGRESSION (PROGRESS BAR)

```css
.learning-status-card .progress-header
```
- En-tête de la barre de progression
- `display: flex`
- `justify-content: space-between`
- `align-items: center`
- `margin: 8px 0 6px`

```css
.learning-status-card .progress-label
```
- Label "Sessions aujourd'hui"
- `color: var(--neon-cyan)`
- `font-weight: 700`
- `font-family: 'Orbitron', monospace`

```css
.learning-status-card .progress-count
```
- Compteur de sessions (ex: 2/4)
- `color: var(--text-secondary)`
- `font-size: 12px`

```css
.learning-status-card .progress-bar
```
- Conteneur de la barre de progression
- `position: relative`
- `height: 8px`
- `border-radius: 999px`
- `background: rgba(0,245,255,0.12)`
- `overflow: hidden`

```css
.learning-status-card .progress-fill
```
- Remplissage de la barre (gradient jaune)
- `height: 100%`
- `background: linear-gradient(90deg, #ffe86b, #ffeea1)`
- `box-shadow: 0 0 12px rgba(255, 232, 107, 0.5)`
- `transition: width 300ms ease`

```css
.learning-status-card .progress-details
```
- Détails sous la barre (temps étudié / restant)
- `display: flex`
- `justify-content: space-between`
- `font-size: 12px`
- `margin-top: 6px`
- `color: var(--text-secondary)`

---

### 6. OBJECTIF QUOTIDIEN (DAILY OBJECTIVE)

```css
.learning-status-card .daily-objective
```
- Section objectif quotidien
- `margin-top: 12px`

```css
.learning-status-card .objective-indicator
```
- Indicateur avec icône et message
- `display: flex`
- `align-items: center`
- `gap: 8px`
- `padding: 6px 10px`
- `border-radius: 999px`
- `border: 1px solid rgba(0,245,255,0.25)`
- `background: rgba(0,245,255,0.06)`
- `color: var(--neon-cyan)`
- `width: fit-content`

---

### 7. ACTIONS RAPIDES (QUICK ACTIONS)

```css
.learning-status-card .quick-actions
```
- Conteneur des boutons d'action
- `display: flex`
- `flex-direction: column`
- `gap: 8px`
- `margin-top: 16px`
- `width: 100%`
- `box-sizing: border-box`
- `align-items: center`
- `grid-template-columns: 1fr 1fr` (force même largeur)


```css
.learning-status-card .quick-actions .action-btn
```
- Bouton d'action générique
- `display: flex`
- `align-items: center`
- `justify-content: center`
- `gap: 6px`
- `padding: 8px 12px`
- `border-radius: 10px`
- `min-height: 44px`
- `width: calc(100% - 12px)`
- `margin: 0 auto`
- `min-width: 0`
- `white-space: nowrap`
- `overflow: hidden`
- `text-overflow: ellipsis`
- `border: 1px solid rgba(255, 20, 147, 0.4)`
- `background: rgba(255,20,147,0.1)`
- `color: #ff1493`
- `text-transform: none !important`
- `letter-spacing: 0 !important`
- `box-shadow: none`
- `font-size: 11px`
- `line-height: 1.2`
- `box-sizing: border-box`
- `cursor: pointer`
- `transition: all 0.3s ease`
- `position: relative`
- `user-select: none`

```css
.learning-status-card .quick-actions .action-btn.primary
```
- Bouton "Session" (primaire)
- Hérite de `.action-btn`
- `background: rgba(255,20,147,0.1) !important`
- `color: #ff1493 !important`
- `border-color: rgba(255, 20, 147, 0.4) !important`
- `font-weight: 800`

```css
.learning-status-card .quick-actions .action-btn.secondary
```
- Bouton "Notes" (secondaire)
- Hérite de `.action-btn`
- Mêmes styles que `.primary`

```css
.learning-status-card .quick-actions .action-btn .btn-icon
```
- Icône du bouton
- `font-size: 12px`
- `flex: 0 0 auto`
- `position: relative`
- `z-index: 3`
- `transition: all 0.3s ease`

```css
.learning-status-card .quick-actions .action-btn .btn-text
```
- Texte du bouton
- `display: inline-block !important`
- `line-height: 1.2`
- `white-space: nowrap`
- `overflow: hidden`
- `text-overflow: ellipsis`
- `max-width: 100%`
- `font-size: 11px`
- `font-weight: 500`
- `flex-shrink: 1`
- `min-width: 0`
- `position: relative`
- `z-index: 3`
- `transition: all 0.3s ease`

---

### 8. EFFETS PSEUDO-ÉLÉMENTS DES BOUTONS

```css
.learning-status-card .quick-actions .action-btn::before
```
- Effet de gradient au survol
- `content: ''`
- `position: absolute`
- `top: 0`
- `left: 0`
- `right: 0`
- `bottom: 0`
- `background: linear-gradient(135deg, rgba(255, 20, 147, 0.15) 0%, rgba(255, 20, 147, 0.08) 50%, rgba(255, 20, 147, 0.15) 100%)`
- `opacity: 0`
- `transition: all 0.4s ease`
- `z-index: 1`
- `border-radius: inherit`

```css
.learning-status-card .quick-actions .action-btn::after
```
- Effet de ripple radial
- `content: ''`
- `position: absolute`
- `top: -50%`
- `left: -50%`
- `width: 200%`
- `height: 200%`
- `background: radial-gradient(circle, rgba(255, 20, 147, 0.3) 0%, rgba(255, 20, 147, 0.15) 30%, transparent 70%)`
- `opacity: 0`
- `transition: all 0.6s ease`
- `z-index: 2`
- `border-radius: 50%`
- `transform: scale(0)`

---

### 9. ÉTATS HOVER (SURVOL)

```css
.learning-status-card .quick-actions .action-btn:hover
```
- État au survol du bouton
- `background: rgba(255, 20, 147, 0.2) !important`
- `border-color: rgba(255, 20, 147, 0.7) !important`
- `box-shadow: 0 0 20px rgba(255, 20, 147, 0.5), 0 0 40px rgba(255, 20, 147, 0.3), inset 0 0 20px rgba(255, 20, 147, 0.15)`
- `transform: translateY(-3px) scale(1.02) !important`
- `color: #ffffff !important`

```css
.learning-status-card .quick-actions .action-btn:hover::before
```
- Pseudo-élément au survol
- `opacity: 1 !important`
- `background: linear-gradient(135deg, rgba(255, 20, 147, 0.3) 0%, rgba(255, 20, 147, 0.2) 50%, rgba(255, 20, 147, 0.3) 100%)`

```css
.learning-status-card .quick-actions .action-btn:hover::after
```
- Effet ripple au survol
- `opacity: 1 !important`
- `transform: scale(1) !important`
- `animation: ripple 1.5s ease-out infinite`

```css
.learning-status-card .quick-actions .action-btn:hover .btn-icon
```
- Icône au survol
- `transform: scale(1.15) rotate(5deg) !important`
- `filter: drop-shadow(0 0 12px rgba(0, 245, 255, 0.8))`
- `text-shadow: 0 0 10px rgba(0, 245, 255, 0.6)`

```css
.learning-status-card .quick-actions .action-btn:hover .btn-text
```
- Texte au survol
- `text-shadow: 0 0 8px rgba(0, 245, 255, 0.5)`
- `font-weight: 600 !important`

---

### 10. ÉTATS ACTIVE (CLIC)

```css
.learning-status-card .quick-actions .action-btn:active
```
- État au clic
- `transform: translateY(-1px) scale(0.96) !important`
- `background: rgba(0, 245, 255, 0.25) !important`
- `box-shadow: 0 0 30px rgba(0, 245, 255, 0.6), 0 0 60px rgba(0, 245, 255, 0.3), inset 0 0 30px rgba(0, 245, 255, 0.2)`

```css
.learning-status-card .quick-actions .action-btn:active::before
```
- Pseudo-élément au clic
- `background: linear-gradient(135deg, rgba(0, 245, 255, 0.4) 0%, ...)`

---

### 11. ÉTATS FOCUS

```css
.learning-status-card .quick-actions .action-btn:focus
```
- État focus (accessibilité)
- `outline: none`
- `box-shadow: 0 0 0 2px rgba(0, 245, 255, 0.3) !important`

```css
.learning-status-card .quick-actions .action-btn:focus-visible
```
- Focus visible (clavier)
- `outline: none !important`
- `box-shadow: none !important`
- `filter: none !important`

---

### 12. NEUTRALISATION DES EFFETS

```css
.learning-status-card .quick-actions .action-btn
.learning-status-card .quick-actions .action-btn.primary
.learning-status-card .quick-actions .action-btn.secondary
```
- Neutralisation des glows globaux
- `box-shadow: none !important`
- `filter: none !important`
- `background-image: none !important`

```css
.learning-status-card .quick-actions .action-btn::before
.learning-status-card .quick-actions .action-btn::after
```
- Désactivation des pseudo-éléments par défaut
- `content: none !important` (sauf en hover/active)

---

### 13. ANIMATIONS

```css
@keyframes ripple
```
- Animation de ripple pour l'effet au survol
- **0%** : `transform: scale(0)`, `opacity: 0.8`
- **50%** : `transform: scale(1)`, `opacity: 0.4`
- **100%** : `transform: scale(1.2)`, `opacity: 0`

```css
.learning-status-card .quick-actions .action-btn.active
```
- Animation de pulsation pour bouton actif
- `animation: pulse-glow 2s infinite`

---

## 🎨 Palette de Couleurs Complète

### Couleurs Principales
- **Rose néon primaire** : `#ff1493` (Deep Pink)
- **Rose néon secondaire** : `#ff69b4` (Hot Pink)
- **Cyan néon** : `#00f5ff` (var(--neon-cyan))
- **Jaune progression** : `#ffe86b` → `#ffeea1`

### Couleurs avec Opacité
- **Rose 15%** : `rgba(255, 20, 147, 0.15)` - Backgrounds
- **Rose 10%** : `rgba(255, 20, 147, 0.1)` - Boutons
- **Rose 40%** : `rgba(255, 20, 147, 0.4)` - Bordures
- **Rose 70%** : `rgba(255, 20, 147, 0.7)` - Bordures hover
- **Cyan 6%** : `rgba(0, 245, 255, 0.06)` - Backgrounds stats
- **Cyan 12%** : `rgba(0, 245, 255, 0.12)` - Progress bar background
- **Cyan 18%** : `rgba(0, 245, 255, 0.18)` - Bordures stats
- **Cyan 25%** : `rgba(0, 245, 255, 0.25)` - Bordures objectif

### Couleurs de Texte
- **Texte secondaire** : `var(--text-secondary)` - rgba(255, 255, 255, 0.7)
- **Blanc** : `#ffffff` - Texte hover

---

## 📐 Dimensions et Espacements

### Espacements
- **Gap stats** : `10px`
- **Gap boutons** : `8px`
- **Gap icône-texte** : `6px`
- **Padding stats** : `10px 12px`
- **Padding boutons** : `8px 12px`
- **Padding objectif** : `6px 10px`
- **Margin top stats** : `10px`
- **Margin top actions** : `16px`
- **Margin top objectif** : `12px`

### Tailles
- **Hauteur barre progression** : `8px`
- **Hauteur minimale bouton** : `44px`
- **Largeur bouton** : `calc(100% - 12px)`
- **Font-size titre** : Hérité du parent
- **Font-size icône large** : `20px`
- **Font-size nom matière** : `16px`
- **Font-size type matière** : `12px`
- **Font-size stat label** : `11px`
- **Font-size stat value** : `15px`
- **Font-size bouton** : `11px`
- **Font-size icône bouton** : `12px`

### Border Radius
- **Stats** : `12px`
- **Boutons** : `10px`
- **Objectif** : `999px` (pill)
- **Progress bar** : `999px` (pill)

---

## 🔤 Typographie

### Polices Utilisées
- **Orbitron** : Statistiques, labels de progression
  - Weights: 400, 700, 900
- **Rajdhani** : Texte général (hérité)
- **JetBrains Mono** : Code/monospace (si nécessaire)

### Font Weights
- **900** : Valeurs de statistiques, titres
- **800** : Nom de matière, boutons primary/secondary
- **700** : Labels de progression
- **600** : Texte hover
- **500** : Texte boutons

### Letter Spacing
- **Titre** : `0.03125rem` (0.5px)
- **Nom matière** : `0.3px`
- **Stat label** : `0.2px`
- **Stat value** : `0.3px`
- **Boutons** : `0` (neutralisé)

---

## 🎭 Effets Visuels

### Box Shadows
- **Progress fill** : `0 0 12px rgba(255, 232, 107, 0.5)`
- **Hover bouton** : `0 0 20px rgba(255, 20, 147, 0.5), 0 0 40px rgba(255, 20, 147, 0.3), inset 0 0 20px rgba(255, 20, 147, 0.15)`
- **Active bouton** : `0 0 30px rgba(0, 245, 255, 0.6), 0 0 60px rgba(0, 245, 255, 0.3), inset 0 0 30px rgba(0, 245, 255, 0.2)`
- **Focus bouton** : `0 0 0 2px rgba(0, 245, 255, 0.3)`

### Filters
- **Icône large** : `drop-shadow(0 0 6px rgba(255,20,147,0.6))`
- **Icône hover** : `drop-shadow(0 0 12px rgba(0, 245, 255, 0.8))`

### Text Shadows
- **Icône hover** : `0 0 10px rgba(0, 245, 255, 0.6)`
- **Texte hover** : `0 0 8px rgba(0, 245, 255, 0.5)`

### Transforms
- **Hover bouton** : `translateY(-3px) scale(1.02)`
- **Active bouton** : `translateY(-1px) scale(0.96)`
- **Hover icône** : `scale(1.15) rotate(5deg)`

### Transitions
- **Progress fill** : `width 300ms ease`
- **Boutons** : `all 0.3s ease`
- **Pseudo ::before** : `all 0.4s ease`
- **Pseudo ::after** : `all 0.6s ease`

---

## 📱 Responsive Design

Le bloc utilise un système de grid flexible qui s'adapte automatiquement :
- **Stats** : Grid 4 colonnes sur desktop, peut se réduire sur mobile
- **Boutons** : Largeur flexible avec `calc(100% - 12px)`
- **Texte** : `text-overflow: ellipsis` pour éviter les débordements

---

## ✅ Classes de Statut

### États d'Objectif
- `.completed` - Objectif atteint (100%+)
- `.on-track` - Bon rythme (75%+)
- `.in-progress` - En cours (25%+)
- `.at-risk` - À risque (<25%)

### États de Progression
- `.completed` - Barre verte (100%)
- `.good` - Barre cyan (75%+)
- `.average` - Barre jaune (50%+)
- `.low` - Barre orange (<50%)

---

## 🔧 Variables CSS Utilisées

```css
--neon-cyan: #00f5ff
--text-secondary: rgba(255, 255, 255, 0.7)
--bg-card: rgba(20, 20, 30, 0.95)
```

---

## 📝 Notes Techniques

1. **Neutralisation des effets** : Le CSS contient de nombreuses règles `!important` pour neutraliser les effets globaux de glow et néon
2. **Z-index** : Les pseudo-éléments utilisent `z-index: 1, 2, 3` pour superposer les effets
3. **Overflow** : `overflow: hidden` sur les stats pour clipper les effets de fond
4. **Box-sizing** : `box-sizing: border-box` pour un calcul précis des dimensions
5. **User-select** : `user-select: none` sur les boutons pour éviter la sélection de texte

---

## 🎯 Hiérarchie Complète des Sélecteurs

```
.learning-status-card
├── .card-glow
├── .card-header
│   ├── .card-icon
│   ├── .card-title
│   └── .card-badge
├── .card-content
│   ├── .active-subject
│   │   └── .subject-display
│   │       ├── .subject-icon-large
│   │       └── .subject-info
│   │           ├── .subject-name
│   │           └── .subject-type
│   ├── .learning-stats
│   │   └── .stat (x4)
│   │       ├── .stat-label
│   │       └── .stat-value
│   ├── .daily-progress
│   │   ├── .progress-header
│   │   │   ├── .progress-label
│   │   │   └── .progress-count
│   │   ├── .progress-bar
│   │   │   └── .progress-fill
│   │   └── .progress-details
│   │       ├── .time-studied
│   │       │   ├── .time-icon
│   │       │   └── .time-text
│   │       └── .time-remaining
│   │           └── .remaining-text
│   ├── .daily-objective
│   │   └── .objective-indicator
│   │       ├── .objective-icon
│   │       └── .objective-text
│   ├── .status-extras
│   │   ├── .start-timer
│   │   │   └── .start-session-btn
│   │   └── .latest-reward
│   │       └── .reward-display
│   └── .quick-actions
│       └── .action-btn (x2)
│           ├── .btn-icon
│           └── .btn-text
```

---

## 📊 Statistiques du Fichier CSS

- **Nombre total de classes** : ~60 classes
- **Nombre de sélecteurs** : ~100+ sélecteurs
- **Lignes de code** : ~330 lignes
- **Animations** : 2 animations (@keyframes ripple, pulse-glow)
- **Pseudo-éléments** : ::before, ::after (sur boutons)
- **États interactifs** : :hover, :active, :focus, :focus-visible

---

## 🎨 Exemples d'Utilisation

### Exemple 1 : Stat Card
```html
<div class="stat">
  <span class="stat-label">Streak</span>
  <span class="stat-value">12 jours</span>
</div>
```

### Exemple 2 : Bouton Action
```html
<button class="action-btn primary">
  <span class="btn-icon">🎯</span>
  <span class="btn-text">Session</span>
</button>
```

### Exemple 3 : Progress Bar
```html
<div class="progress-bar">
  <div class="progress-fill" style="width: 50%"></div>
</div>
```

---

**Fin de la documentation complète des classes CSS du bloc Status Apprentissage**
