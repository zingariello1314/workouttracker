# 📚 ANALYSE APPROFONDIE - ONGLET APPRENTISSAGE
## QuietQuest - Documentation Complète des Modules

---

## 📋 TABLE DES MATIÈRES

1. [Structure Générale de l'Onglet Apprentissage](#structure-générale)
2. [Sous-Onglet 1: Matières](#sous-onglet-1-matières)
3. [Sous-Onglet 2: Sessions](#sous-onglet-2-sessions)
4. [Sous-Onglet 3: Trophées](#sous-onglet-3-trophées)
5. [Système de Navigation](#système-de-navigation)
6. [Système de Progression et XP](#système-de-progression)
7. [Styles et Design Cyberpunk](#styles-et-design)

---

## 🏗️ STRUCTURE GÉNÉRALE DE L'ONGLET APPRENTISSAGE {#structure-générale}

### Vue Principale
- **Variable de contrôle**: `currentView = 'apprentissage'`
- **Variable de sous-onglet**: `currentSubView` peut être:
  - `'matieres'` (par défaut)
  - `'sessions'`
  - `'trophees'`

### Header Principal
**Emplacement**: Ligne 3104-3141 dans `app.js`

**Composants**:
1. **Logo Container** (`.logo-container`)
   - Image logo: `logo.png` (100x100px)
   - Titre avec gradient animé: "QuietQuest"
   - Animation: `logoFloat` (flottement vertical 3s)
   - Filtre: `drop-shadow` avec lueur verte/cyan

2. **Bouton Navigation Principal**
   - Classe: `.nav-button` / `.nav-button-active`
   - Texte: "📖 Apprentissage"
   - Action: `@click="currentView = 'apprentissage'"`
   - Style: Effet shimmer au survol

3. **Navigation Sous-Onglets** (visible uniquement si `currentView === 'apprentissage'`)
   - Container: `.sub-nav-container`
   - Container boutons: `.sub-nav-buttons`
   - 3 boutons:
     - 📚 Matières
     - ⏱️ Sessions
     - 🏆 Trophées
   - Classe active: `.sub-nav-active`
   - Fonction: `switchToSubView(subView)`

4. **Status de Sauvegarde**
   - Affichage conditionnel: `v-if="saveStatus"`
   - Classe: `.save-status`
   - Durée d'affichage: 3 secondes
   - Animation: fade in/out

---

## 📚 SOUS-ONGLET 1: MATIÈRES {#sous-onglet-1-matières}

### Conditions d'Affichage
```javascript
v-show="currentView === 'apprentissage' && currentSubView === 'matieres' && !isLoading"
```

### Container Principal
- Classe: `.matieres-container`
- Largeur max: 1200px
- Centré avec margin auto
- Padding: `var(--spacing-xl)` vertical, `var(--spacing-md)` horizontal

---

### MODULE 1: Message Vide

**Emplacement**: Ligne 4094-4096

**Affichage**: `v-if="!subjects.length"`

**Contenu**:
```
"NO PROTOCOLS DETECTED... INITIALIZE YOUR FIRST LEARNING MODULE"
```

**Style**:
- Classe: `.empty-message`
- Couleur: `var(--text-primary)`
- Centré
- Taille police: 1.2rem
- Style cyberpunk avec effet de lueur

---

### MODULE 2: Formulaire d'Ajout de Matière

**Emplacement**: Ligne 4099-4125

**Container**: `.form-container`

**Structure**:

1. **Titre du Formulaire**
   - Classe: `.form-title`
   - Texte: "📚 NEW PROTOCOL INITIALIZATION"
   - Style:
     - Font-size: 1.5rem
     - Font-weight: 800
     - Couleur: `var(--primary-green)` (#32ff9f)
     - Text-align: center
     - Text-transform: uppercase
     - Letter-spacing: 2px
     - Text-shadow: 0 0 15px rgba(50, 255, 159, 0.5)
   - Emoji avant: 📚 (2rem, avec drop-shadow)

2. **Champ Nom de Matière**
   - Type: `input` text
   - Variable: `v-model="newSubject.name"`
   - Classe: `.form-input`
   - Placeholder: "Protocol name (ex: NEURAL HISTORY)"
   - Attributs:
     - `required`
     - `maxlength="100"`
   - Style:
     - Width: 100%
     - Padding: 0.8rem var(--spacing-md)
     - Margin-bottom: var(--spacing-md)
     - Background: rgba(0, 0, 0, 0.3)
     - Border: 2px solid rgba(50, 255, 159, 0.5)
     - Border-radius: 10px
     - Color: var(--text-primary)
     - Font-size: 1rem
     - Backdrop-filter: blur(5px)
   - Focus:
     - Border-color: var(--primary-cyan)
     - Background: rgba(0, 255, 170, 0.05)
     - Box-shadow: 0 0 20px rgba(0, 255, 200, 0.3), inset 0 0 10px rgba(0, 255, 170, 0.1)
     - Transform: scale(1.02)

3. **Champ Upload Fichiers**
   - Type: `input` file
   - Attributs:
     - `multiple`
     - `@change="handleFileUpload"`
     - `accept=".odt,.ods,.pdf,.docx,.xlsx,.txt,.md"`
   - Classe: `.form-input .file-input`
   - Style: Identique aux autres inputs

4. **Champ Résumé (Textarea)**
   - Type: `textarea`
   - Variable: `v-model="newSubject.summary"`
   - Classe: `.form-input .form-textarea`
   - Placeholder: "Protocol summary (optional)"
   - Attributs:
     - `rows="3"`
     - `maxlength="2000"`
   - Style:
     - Resize: vertical
     - Min-height: 80px

5. **Bouton Soumettre**
   - Type: `button` submit
   - Classe: `.form-submit`
   - Texte: "➕ INITIALIZE PROTOCOL"
   - Attributs:
     - `:disabled="!newSubject.name || !newSubject.name.trim()"`
   - Style:
     - Width: 100%
     - Padding: var(--spacing-md) var(--spacing-xl)
     - Background: linear-gradient(135deg, var(--bg-dark-primary) 0%, var(--bg-dark-tertiary) 100%)
     - Border: 2px solid var(--primary-green)
     - Border-radius: var(--border-radius-md)
     - Color: var(--primary-green)
     - Font-size: 1.1rem
     - Font-weight: 700
     - Text-transform: uppercase
     - Letter-spacing: 1px
     - Box-shadow: var(--shadow-glow)
   - Hover:
     - Background: linear-gradient(135deg, rgba(50, 255, 159, 0.2) 0%, rgba(0, 255, 200, 0.2) 100%)
     - Color: var(--primary-cyan)
     - Transform: translateY(-2px)
     - Box-shadow: 0 8px 25px rgba(50, 255, 159, 0.4)
   - Effet shimmer: `::before` avec animation

**Fonction**: `addSubject()`
- Validation du nom (non vide, trim)
- Vérification doublon (case insensitive)
- Création `subjectData`:
  - `name`: nom trim
  - `files`: []
  - `summary`: résumé trim
  - `createdAt`: timestamp
- Pour chaque fichier dans `newSubject.files`:
  - Sauvegarde dans IndexedDB (`saveFileToIndexedDB`)
  - Ajout à `subjectData.files` avec `isLoading: true`
- Ajout à `subjects.value`
- Pour chaque fichier ajouté:
  - Chargement depuis IndexedDB (`loadFileFromIndexedDB`)
  - Mise à jour `url`, `size`
  - `isLoading: false`
- Ajout à `planner.subjectOrder`
- Réinitialisation `newSubject`
- Sauvegarde (`saveSubjects`)
- Déclenchement effet spark

**Fonction `deleteSubject(index)`**:
- Vérification index valide
- Récupération matière
- Arrêt timer si matière en cours
- Suppression fichiers depuis IndexedDB
- Suppression cycle planificateur
- Suppression de `planner.subjectOrder`
- Suppression de `subjects.value`
- Sauvegarde
- Déclenchement effet spark

**Fonction `deleteFile(subjectIndex, fileIndex)`**:
- Vérification indices valides
- Récupération fichier
- Suppression depuis IndexedDB
- Suppression de `subject.files`
- Sauvegarde

---

### MODULE 3: Liste des Matières (Cartes)

**Emplacement**: Ligne 4128-4230

**Boucle**: `v-for="(subject, index) in subjects"`

**Container Carte**: `.matiere-card`

**Structure de la Carte**:

#### 3.1. Header de la Carte (`.matiere-header`)

**3.1.1. Section Titre (`.matiere-title-section`)**

- **Titre Matière** (`.matiere-title`)
  - Texte: `subject.name.toUpperCase()` ou "UNNAMED PROTOCOL"
  - Style:
    - Font-size: 1.5rem
    - Font-weight: 700
    - Color: var(--primary-green)
    - Text-transform: uppercase

- **Section Progression** (`.matiere-progression-section`)
  
  **Badge de Matière** (`.subject-badge-container`)
  - Container flex avec gap
  - Badge (`.subject-badge`):
    - Icon: `getSubjectBadge(level).icon`
    - Texte: `getSubjectBadge(level).name.toUpperCase()`
    - Style dynamique basé sur le niveau:
      - Border-color: `badge.color + '60'`
      - Background-color: `badge.color + '20'`
      - Color: `badge.color`
    - Padding: 0.4rem 0.8rem
    - Border-radius: 20px
    - Font-size: 0.8rem
    - Font-weight: 600
    - Text-transform: uppercase
    - Letter-spacing: 0.5px
    - Backdrop-filter: blur(5px)
  
  **Niveau** (`.subject-level`)
    - Texte: `LEVEL {{ getSubjectProgression(subject.name).level }}`
    - Style:
      - Font-weight: 700
      - Color: var(--primary-green)
      - Font-size: 1.1rem
      - Text-shadow: 0 0 8px rgba(50, 255, 159, 0.6)
      - Background: linear-gradient(45deg, var(--primary-green), var(--primary-cyan))
      - Background-clip: text
      - -webkit-text-fill-color: transparent

  **Barre de Progression XP** (`.xp-progress-container`)
    - Container info (`.xp-info`):
      - Flex space-between
      - XP actuelle/XP suivante (`.xp-numbers`):
        - Format: `{{ currentLevelXP }} / {{ nextLevelXP }} XP`
        - Color: var(--primary-cyan)
        - Font-weight: 600
        - Font-size: 0.9rem
        - Text-shadow: 0 0 5px rgba(0, 255, 200, 0.5)
      - Pourcentage (`.xp-percentage`):
        - Format: `{{ Math.round(progress) }}%`
        - Color: var(--primary-green)
        - Font-weight: 700
        - Font-size: 0.9rem
        - Text-shadow: 0 0 5px rgba(50, 255, 159, 0.5)
    
    - Barre de progression (`.xp-progress-bar`):
      - Width: 100%
      - Height: 12px
      - Background: linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 29, 24, 0.6) 50%, rgba(0, 0, 0, 0.4) 100%)
      - Border: 1px solid rgba(50, 255, 159, 0.3)
      - Border-radius: 6px
      - Overflow: hidden
      - Box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 10px rgba(0, 255, 200, 0.2)
    
    - Remplissage (`.xp-progress-fill`):
      - Width: `progress + '%'` (dynamique)
      - Height: 100%
      - Background: linear-gradient(90deg, var(--primary-cyan) 0%, var(--primary-green) 50%, var(--primary-teal) 100%)
      - Border-radius: 5px
      - Transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1)
      - Box-shadow: 0 0 15px rgba(0, 255, 200, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.3)
      - Effet shine: `::after` avec animation `progressShine` (2s)

**3.1.2. Status de la Matière (`.matiere-status`)**

- **Info Planification** (`.cycle-info`)
  - Si assignée: `SCHEDULED: {{ jour }}`
  - Si non assignée: `UNSCHEDULED` (classe `.unassigned`)
  - Style:
    - Font-size: 0.9rem
    - Color: var(--text-secondary)

- **Bouton Démarrer Session** (`.btn-action .btn-start`)
  - Condition: `v-if="!timer.isRunning"`
  - Action: `@click="startSession(subject)"`
  - Texte: "▶️ LAUNCH PROTOCOL"
  - Style:
    - Background: linear-gradient(135deg, rgba(50, 255, 159, 0.2) 0%, rgba(0, 255, 200, 0.2) 100%)
    - Border-color: var(--primary-green)
    - Color: var(--primary-green)
  - Hover:
    - Background: linear-gradient(135deg, rgba(50, 255, 159, 0.3) 0%, rgba(0, 255, 200, 0.3) 100%)
    - Transform: scale(1.05)
    - Box-shadow: 0 0 20px rgba(50, 255, 159, 0.5)

- **Indicateur Session Active** (`.current-session`)
  - Condition: `v-else-if="timer.currentSubject && timer.currentSubject.name === subject.name"`
  - Texte: "🔥 PROTOCOL ACTIVE"
  - Style:
    - Color: #ffa500
    - Font-weight: 700
    - Font-size: 0.9rem
    - Text-transform: uppercase
    - Letter-spacing: 1px
    - Animation: `sessionActive` (2s ease-in-out infinite)

- **Bouton Supprimer** (`.btn-action .btn-delete`)
  - Action: `@click="deleteSubject(index)"`
  - Texte: "🗑️ DELETE PROTOCOL"
  - Style:
    - Background: linear-gradient(135deg, rgba(40, 0, 0, 0.9) 0%, rgba(60, 0, 0, 0.9) 100%)
    - Border-color: var(--error-color)
    - Color: var(--error-color)
  - Hover:
    - Background: var(--error-bg)
    - Transform: scale(1.05)
    - Box-shadow: 0 0 15px rgba(255, 90, 90, 0.5)

#### 3.2. Section Fichiers (`.files-container`)

**Condition**: `v-if="subject.files && subject.files.length"`

**Boucle**: `v-for="(file, fIndex) in subject.files"`

**Entrée Fichier** (`.file-entry`):
- Container flex space-between

- **Info Fichier** (`.file-info`):
  - Icon selon extension:
    - `.odt`: 📝
    - `.ods`: 📊
    - `.pdf`: 📄
    - `.docx`: 📄
    - `.xlsx`: 📊
    - Autre: 📎
  - Nom fichier (`.file-name`):
    - Texte: `file.name.toUpperCase()` ou "UNNAMED ASSET"
    - Font-weight: 600
  - Taille fichier (`.file-size`):
    - Format: `{{ (file.size/1024).toFixed(1) }} KB`
    - Font-size: 0.8rem
    - Color: var(--text-muted)

- **Actions Fichier** (`.file-actions`):
  - Indicateur chargement (`.loading-indicator`):
    - Condition: `v-if="file.isLoading"`
    - Texte: "⏳ LOADING..."
  - Lien télécharger (`.btn-action .btn-consult`):
    - Condition: `v-else-if="file.url"`
    - Texte: "🔍 ACCESS"
    - Attributs:
      - `:href="file.url"`
      - `target="_blank"`
      - `download`
  - Indicateur erreur (`.error-indicator`):
    - Condition: `v-else`
    - Texte: "❌ ERROR"
  - Bouton supprimer (`.btn-action .btn-delete`):
    - Action: `@click="deleteFile(index, fIndex)"`
    - Texte: "🗑️"

#### 3.3. Section Ajout Fichiers (`.add-files-section`)

- Label (`.add-files-label`):
  - Texte: "➕ UPLOAD ASSETS:"
  - Font-weight: 600
  - Margin-bottom: var(--spacing-sm)

- Input file:
  - Attributs:
    - `type="file"`
    - `multiple`
    - `@change="event => handleAdditionalFiles(event, index)"`
    - `accept=".odt,.ods,.pdf,.docx,.xlsx,.txt,.md"`
  - Classe: `.file-input`

#### 3.4. Section Résumé (`.resume-section`)

**Condition**: `v-if="subject.summary && subject.summary.trim()"`

- Titre (`.resume-title`):
  - Texte: "PROTOCOL SUMMARY:"
  - Font-weight: 700
  - Color: var(--primary-green)
  - Margin-bottom: var(--spacing-sm)

- Contenu (`.resume-content`):
  - Texte: `{{ subject.summary }}`
  - Line-height: 1.6
  - Color: var(--text-secondary)

---

### MODULE 4: Recommandations d'Étude

**Emplacement**: Ligne 4233-4240

**Condition**: `v-if="behindSubjects.length || urgentSubjects.length"`

**Container**: `.study-recommendations`

**Structure**:
- Header (`.recommendations-header`):
  - Icon: 💡
  - Titre: "OPTIMIZATION RECOMMENDATIONS"
  - Sous-titre: "Maximize your progression efficiency"

**Fonctions Computed**:
- `behindSubjects`: Matières en retard (niveau < moyenne - 0.5)
- `urgentSubjects`: Matières urgentes (dernière étude > 7 jours)

---

## ⏱️ SOUS-ONGLET 2: SESSIONS {#sous-onglet-2-sessions}

### Conditions d'Affichage
```javascript
v-show="currentView === 'apprentissage' && currentSubView === 'sessions' && !isLoading"
```

### Container Principal
- Classe: `.sessions-container`
- Largeur max: 1200px
- Centré avec margin auto
- Padding: `var(--spacing-xl)` vertical, `var(--spacing-md)` horizontal
- Display: flex column
- Gap: var(--spacing-xl)

---

### MODULE 1: Timer de Session Principal

**Emplacement**: Ligne 3146-3256

**Container**: `.timer-section`

**Note Importante**: Les popups de pause et options de fin (`showBreakPopup`, `showEndSessionOptions`) sont définis dans les variables mais ne sont pas encore implémentés dans le template HTML. Ils doivent être ajoutés pour une reproduction complète.

#### 1.1. Panel Principal du Timer

**Condition**: `v-if="timer.currentSubject || timer.isRunning"`

**Container**: `.timer-main-panel`

**Structure**:

**1.1.1. Container Timer** (`.timer-container`)

**Cercle de Progression** (`.timer-circle`):
- Dimensions: 280px x 280px
- Classes conditionnelles:
  - `.pulsing`: si `timer.pulseAnimation`
  - `.timer-running`: si `timer.isRunning`
  - `.timer-paused`: si `timer.isPaused`
  - `.timer-break`: si `timer.isBreakTime`
- Style:
  - Border: 8px solid rgba(50, 255, 159, 0.2)
  - Border-radius: 50%
  - Display: flex column
  - Align-items: center
  - Justify-content: center
  - Margin: 0 auto var(--spacing-xl)
  - Position: relative
  - Background: radial-gradient(circle, rgba(0, 255, 200, 0.05) 0%, transparent 70%)

**SVG Progression** (`.timer-progress`):
- ViewBox: "0 0 100 100"
- Cercle de fond:
  - Cx: 50, Cy: 50, R: 45
  - Fill: none
  - Stroke: rgba(0, 255, 148, 0.1)
  - Stroke-width: 2
- Cercle de progression:
  - Cx: 50, Cy: 50, R: 45
  - Fill: none
  - Stroke: `timerColor` (dynamique)
  - Stroke-width: 3
  - Stroke-dasharray: 283
  - Stroke-dashoffset: `283 - (timer.progress * 283 / 100)`
  - Transform: rotate(-90 50 50)

**Affichage Timer** (`.timer-display`):
- Temps (`.timer-time .cyber-glitch`):
  - Texte: `{{ formatTime(timer.remainingTime) }}`
  - Data-attr: `:data-text="formatTime(timer.remainingTime)"`
  - Style:
    - Font-size: 3rem
    - Font-weight: 900
    - Color: `timerColor` (dynamique)
    - Text-shadow: var(--shadow-glow)
    - Margin-bottom: var(--spacing-sm)
  - Effet glitch cyberpunk
- Label (`.timer-label`):
  - Si pause: "🍫 PAUSE"
  - Sinon: "📚 FOCUS"
  - Style:
    - Font-size: 1.2rem
    - Color: var(--primary-green)
    - Text-transform: uppercase
    - Letter-spacing: 2px
    - Font-weight: 600
- Sujet (`.timer-subject`):
  - Si matière: `{{ timer.currentSubject.name }}`
  - Sinon: "SYSTEM READY"
  - Style:
    - Font-size: 1rem
    - Color: var(--text-secondary)
    - Margin-top: var(--spacing-sm)

**Couleur Timer Dynamique** (`timerColor` computed):
- Pause: `#ff8c42` (orange)
- Dernières 5 min: `#ff4757` (rouge)
- Normal: `#2ed573` (vert)

**1.1.2. Contrôles Timer** (`.timer-controls`)

**Si timer non démarré**:
- Bouton désactivé:
  - Texte: "⏸️ Sélectionner une matière"
  - Classe: `.timer-btn .start`
  - Disabled: true

**Si timer en cours** (`.timer-buttons`):
- Bouton Pause/Reprendre (`.timer-btn .pause/.resume`):
  - Action: `@click="togglePause"`
  - Texte conditionnel:
    - Si pause: "▶️ Reprendre"
    - Sinon: "⏸️ Pause"
- Bouton Arrêter (`.timer-btn .stop`):
  - Action: `@click="stopSession"`
  - Texte: "⏹️ Arrêter"
- Bouton Ajuster +10min (`.timer-btn .adjust`):
  - Action: `@click="adjustSessionTime(10)"`
  - Texte: "+10 min"
- Bouton Son (`.timer-btn .sound`):
  - Action: `@click="timer.silentMode = !timer.silentMode"`
  - Texte conditionnel:
    - Si muet: "🔇"
    - Sinon: "🔊"
  - Classe `.muted` si muet

**Style Boutons Timer** (`.timer-btn`):
- Background: linear-gradient(135deg, var(--bg-overlay) 0%, rgba(0, 40, 32, 0.9) 100%)
- Border: 2px solid var(--primary-green)
- Color: var(--primary-green)
- Padding: var(--spacing-md) var(--spacing-lg)
- Border-radius: var(--border-radius-md)
- Font-weight: 600
- Text-transform: uppercase
- Letter-spacing: 1px
- Hover:
  - Background: linear-gradient(135deg, rgba(50, 255, 159, 0.2) 0%, rgba(0, 255, 200, 0.2) 100%)
  - Transform: translateY(-2px)
  - Box-shadow: var(--shadow-glow)

**1.1.3. Statistiques du Jour** (`.timer-stats`)

**Container**: Flex avec gap

**Items Statistiques** (`.stat-item .gpu-accelerated`):
- Icon (`.stat-icon`): 🎯, ⏱️, ☕
- Valeur (`.stat-value`):
  - Sessions: `{{ todayStats.sessionsCount }}`
  - Active: `{{ Math.floor(todayStats.totalWorkTime / 60) }}h{{ todayStats.totalWorkTime % 60 }}`
  - Break: `{{ Math.floor(todayStats.totalBreakTime / 60) }}h{{ todayStats.totalBreakTime % 60 }}`
- Label (`.stat-label`): "Sessions", "Active", "Break"

**Computed `todayStats`**:
- Filtre sessions du jour
- Calcul temps travail/pause
- Liste matières étudiées

**Fonctions Timer**:
- `startTimerInterval()`: Démarre l'intervalle de mise à jour (1 seconde)
- `stopTimerInterval()`: Arrête l'intervalle
- `handleTimerEnd()`: Gère la fin du timer (session ou pause)
- `saveTimerState()`: Sauvegarde l'état dans localStorage
- `loadTimerState()`: Restaure l'état depuis localStorage
- `saveSessionHistory()`: Sauvegarde l'historique
- `loadSessionHistory()`: Charge l'historique

**Système Audio**:
- Fonction `createAudioContext()`: Crée le contexte audio
- Sons disponibles:
  - `sounds.sessionEnd()`: Double bip harmonieux (Do, Mi)
  - `sounds.breakEnd()`: Triple bip urgent (La, Do#, Mi)
  - `sounds.warning()`: Bip simple (Fa)
- Mode silencieux: `timer.silentMode` désactive les sons

**Popups Timer** (Variables mais non implémentés dans template actuel):
- `timer.showBreakPopup`: Affiche popup pause après session
- `timer.showEndSessionOptions`: Affiche options continuer/terminer
- Fonctions associées:
  - `startBreak()`: Démarre la pause
  - `skipBreak()`: Ignore la pause
  - `continueSession()`: Continue avec nouvelle session
  - `finishStudying()`: Termine complètement

**Structure Popup Pause** (à implémenter):
- Overlay: `.timer-popup-overlay` ou `.popup-overlay`
- Container: `.timer-popup .break` ou `.popup-content`
- Contenu:
  - Icon: 🍫
  - Titre: "TEMPS DE PAUSE"
  - Durée: `{{ timer.breakDuration / 60 }} MIN`
  - Description: "Repose-toi bien !"
  - Boutons:
    - "DÉMARRER PAUSE" → `startBreak()`
    - "PASSER" → `skipBreak()`

**Structure Popup Options Fin** (à implémenter):
- Overlay: `.timer-popup-overlay` ou `.popup-overlay`
- Container: `.timer-popup .continue` ou `.popup-content`
- Contenu:
  - Icon: 🎉
  - Titre: "SESSION TERMINÉE"
  - Sujet: `{{ timer.currentSubject.name }}`
  - Boutons:
    - "CONTINUER" → `continueSession()`
    - "TERMINER" → `finishStudying()`

**Styles Popups**:
- Overlay:
  - Position: fixed, fullscreen
  - Background: rgba(0, 0, 0, 0.8)
  - Backdrop-filter: blur(10px)
  - Z-index: 10000
  - Animation: `overlayFadeIn` (0.3s)
- Popup:
  - Background: linear-gradient avec bg-overlay
  - Border: 3px solid (vert pour continue, orange pour break)
  - Border-radius: 25px
  - Padding: 3rem
  - Max-width: 500px
  - Backdrop-filter: blur(20px)
  - Box-shadow: multiple avec glow
  - Animation: `popupSlideIn` (0.4s)

#### 1.2. Sélecteur de Matière

**Condition**: `v-if="!timer.isRunning && subjects.length"`

**Container**: `.timer-subject-selector`

**Titre**: `.timer-selector-title`
- Texte: "🎯 Commencer une session"

**Grille Matières** (`.subject-grid`):
- Display: grid
- Gap: var(--spacing-md)

**Bouton Matière** (`.subject-start-btn`):
- Boucle: `v-for="subject in subjects"`
- Action: `@click="startSession(subject)"`
- Classe `.assigned` si `getAssignedDay(subject.name)`
- Structure:
  - Info (`.subject-info`):
    - Icon: 📚
    - Détails (`.subject-details`):
      - Nom: `{{ subject.name }}`
      - Fichiers: `📁 {{ subject.files.length }} fichier(s)`
      - Jour assigné: `{{ ['', 'Lundi', 'Mardi', ...][getAssignedDay(subject.name)] }}`
  - Icon start: ▶️

---

### MODULE 2: Planificateur Hebdomadaire

**Emplacement**: Ligne 3258-3381

**Container**: `.planner-container`

**Structure**:

#### 2.1. Header Planificateur (`.planner-header`)

**Titre** (`.planner-title`):
- Texte: "📅 Planificateur Hebdomadaire"
- Font-size: 1.5rem
- Font-weight: 700
- Color: var(--primary-green)

**Contrôles** (`.planner-controls`):
- Bouton Précédent (`.nav-arrow`):
  - Action: `@click="navigateWeek(-1)"`
  - Texte: "⬅️"
- Bouton Semaine Actuelle (`.current-week-btn`):
  - Action: `@click="goToCurrentWeek"`
  - Texte conditionnel:
    - Si offset = 0: "Cette semaine"
    - Sinon: "Aller à aujourd'hui"
- Bouton Suivant (`.nav-arrow`):
  - Action: `@click="navigateWeek(1)"`
  - Texte: "➡️"
- Bouton Mode Compact (`.compact-toggle`):
  - Action: `@click="planner.compactMode = !planner.compactMode"`
  - Texte conditionnel:
    - Si compact: "📈 Vue étendue"
    - Sinon: "📊 Vue compacte"

#### 2.2. Grille Planificateur (`.planner-grid`)

**Classes conditionnelles**:
- `.compact`: si `planner.compactMode`
- `.extended`: sinon

**Structure**: Grid 7 colonnes (jours)

**Colonne Jour** (`.day-column`):
- Classes conditionnelles:
  - `.today`: si `day.isToday`
- Events:
  - `@dragover="handleDragOver"`
  - `@drop="event => handleDrop(event, day)"`

**Header Jour** (`.day-header`):
- Nom (`.day-name`): `{{ day.name }}` (Lun, Mar, ...)
- Date (`.day-date`): `{{ day.date }}` (numéro)

**Sujets du Jour** (`.day-subjects`):
- Boucle: `v-for="subject in day.subjects"`

**Carte Matière Assignée** (`.subject-card .assigned .draggable`):
- Attributs:
  - `draggable="true"`
  - `@dragstart="event => handleDragStart(event, subject)"`
- Structure:
  - Info (`.subject-info`):
    - Icon: 📚
    - Détails (`.subject-details`):
      - Nom: `{{ subject.name }}`
      - Jour: `{{ day.name }}`
  - Fichiers (si non compact):
    - Compteur: `📁 {{ subject.files.length }}`
  - Bouton démarrage rapide (`.quick-start-btn`):
    - Condition: `v-if="!timer.isRunning"`
    - Action: `@click="startSession(subject)"`
    - Texte: "▶️"
    - Title: "Démarrer une session"

**Message Vide** (`.no-subjects`):
- Condition: `v-if="day.subjects.length === 0"`
- Texte: "Glissez une matière ici"

#### 2.3. Matières Non Assignées (`.unassigned-subjects`)

**Condition**: `v-if="unassignedSubjects.length > 0"`

**Titre** (`.unassigned-title`):
- Texte: "📋 Matières à programmer"

**Grille** (`.unassigned-grid`):
- Display: grid
- Gap: var(--spacing-md)

**Carte Matière Non Assignée** (`.subject-card .unassigned .draggable`):
- Attributs:
  - `draggable="true"`
  - `@dragstart="event => handleDragStart(event, subject)"`
- Structure:
  - Info (`.subject-info`):
    - Icon: ❓
    - Détails (`.subject-details`):
      - Nom: `{{ subject.name }}`
      - Status: "Non programmé"
  - Sélecteur Jour (`.day-selector`):
    - Select (`.day-select`):
      - Action: `@change="event => changeSubjectDay(subject.name, parseInt(event.target.value))"`
      - Options:
        - Valeur vide: "Choisir un jour"
        - 1-7: Lundi à Dimanche
  - Bouton démarrage rapide (`.quick-start-btn .unassigned`):
    - Condition: `v-if="!timer.isRunning"`
    - Action: `@click="startSession(subject)"`
    - Texte: "▶️"

#### 2.4. Légende (`.planner-legend`)

**Items** (`.legend-item`):
- Icon assignée (`.legend-icon .assigned`): 📚 "Matières programmées"
- Icon non assignée (`.legend-icon .unassigned`): ❓ "Matières à programmer"
- Icon démarrage: ▶️ "Démarrer une session"

**Fonctions**:
- `navigateWeek(direction)`: Navigation semaines (-1 précédent, +1 suivant)
- `goToCurrentWeek()`: Retour semaine actuelle (offset = 0)
- `handleDragStart(event, subject)`: Début drag (stocke matière dans `planner.draggedSubject`)
- `handleDragOver(event)`: Pendant drag (preventDefault)
- `handleDrop(event, targetDay)`: Fin drag (assigne matière au jour)
- `changeSubjectDay(subjectName, newDay)`: Changer jour (1-7 ou null)
- `getAssignedDay(subjectName)`: Obtenir jour assigné (1-7 ou null)
- `getMondayOfWeek(date)`: Calculer lundi de la semaine
- `getCurrentDisplayWeek()`: Obtenir lundi de la semaine affichée
- `getSubjectsForDay(dayOfWeek)`: Obtenir matières pour un jour
- `initializeSubjectOrder()`: Initialiser ordre matières

---

### MODULE 3: Historique des Sessions

**Emplacement**: Ligne 3383-3576

**Container**: `.sessions-history`

**Structure**:

#### 3.1. Titre (`.history-title`)

- Texte: "📊 SESSION ARCHIVE"
- Font-size: 1.5rem
- Font-weight: 800
- Color: var(--primary-green)
- Text-align: center
- Text-transform: uppercase
- Letter-spacing: 2px
- Text-shadow: 0 0 15px rgba(50, 255, 159, 0.5)

#### 3.2. Contrôles Ajout Manuel (`.manual-session-controls`)

**Bouton Toggle** (`.manual-session-btn`):
- Action: `@click="toggleManualSessionForm"`
- Classe `.active` si `showManualSessionForm`
- Texte conditionnel:
  - Si ouvert: "❌ CANCEL OPERATION"
  - Sinon: "➕ MANUAL DATA ENTRY"

#### 3.3. Formulaire Ajout Manuel (`.manual-session-form`)

**Condition**: `v-if="showManualSessionForm"`

**Titre** (`.manual-form-title`):
- Texte: "✏️ DATA ENTRY PROTOCOL"

**Grille Formulaire** (`.manual-form-grid`):
- Display: grid
- Gap: var(--spacing-md)

**Champs**:
1. **Protocole** (`.form-group`):
   - Label: "PROTOCOL:"
   - Select (`.form-select`):
     - `v-model="manualSession.subjectName"`
     - Option vide: "SELECT PROTOCOL"
     - Options: `v-for="subject in subjects"`

2. **Type** (`.form-group`):
   - Label: "TYPE:"
   - Select:
     - `v-model="manualSession.type"`
     - Options: "📚 WORK", "☕ BREAK"

3. **Durée** (`.form-group`):
   - Label: "DURATION (MIN):"
   - Input number (`.form-input-small`):
     - `v-model.number="manualSession.duration"`
     - Min: 1, Max: 480
     - Required

4. **Date** (`.form-group`):
   - Label: "DATE:"
   - Input date (`.form-input-small`):
     - `v-model="manualSession.date"`
     - Required

5. **Heure** (`.form-group`):
   - Label: "TIME:"
   - Input time (`.form-input-small`):
     - `v-model="manualSession.time"`
     - Required

**Actions** (`.manual-form-actions`):
- Bouton Soumettre (`.manual-submit-btn`):
  - Action: `@click="addManualSession"`
  - Disabled: `!manualSession.subjectName`
  - Texte: "✅ COMMIT DATA"

**Fonction `addManualSession()`**:
- Validation champs (matière, durée, date)
- Création date/heure: `new Date(date + 'T' + time)`
- Création sessionData avec:
  - `startTime`: timestamp début
  - `endTime`: timestamp fin
  - `plannedDuration`: durée en secondes
  - `actualWorkTime`: durée en secondes
  - `pauseTime`: 0
  - `completed`: true
  - `type`: 'work' ou 'break'
  - `isManual`: true
- Ajout à `timer.sessionsHistory`
- Tri par date (plus récent en premier)
- Calcul XP si session work (via `calculateSessionXP` puis `addXP`)
- Recalcul stats globales (`recalculateGlobalStats`)
- Sauvegarde (`saveSessionHistory`)
- Fermeture formulaire et reset

#### 3.4. Statistiques (`.history-stats`)

**Condition**: `v-if="timer.sessionsHistory.length"`

**Grille**: Grid 3 colonnes

**Cartes Stats** (`.stat-card`):
1. **Total Sessions**:
   - Nombre: `{{ timer.sessionsHistory.filter(s => s.type === 'work').length }}`
   - Label: "TOTAL SESSIONS"

2. **Temps Total**:
   - Valeur: `{{ Math.floor(totalTime / 3600) }}H`
   - Label: "TOTAL TIME"

3. **Protocoles**:
   - Nombre: `{{ [...new Set(workSessions.map(s => s.subject))].length }}`
   - Label: "PROTOCOLS"

#### 3.5. Liste Sessions Récentes (`.recent-sessions`)

**Condition**: `v-if="timer.sessionsHistory.length"`

**Titre**: "RECENT ACTIVITY:"

**Liste** (`.session-list`):
- Boucle: `v-for="(session, sessionIndex) in timer.sessionsHistory.slice(-10).reverse()"`
- Index réel: `timer.sessionsHistory.length - 1 - sessionIndex`

**Item Session** (`.session-item`):
- Classe `.editing` si `editingSession === index`

**Mode Affichage** (`.session-display`):
- Condition: `v-if="editingSession !== index"`

**Info Session** (`.session-info`):
- Type (`.session-type`):
  - Si work: 📚
  - Sinon: ☕
- Sujet (`.session-subject`): `{{ session.subject }}`
- Durée (`.session-duration`): `{{ Math.floor(session.actualWorkTime / 60) }}MIN`
- Badge Manuel (`.manual-badge`):
  - Condition: `v-if="session.isManual"`
  - Texte: "✏️ MANUAL"

**Méta Session** (`.session-meta`):
- Date (`.session-date`): `{{ formatDate(session.startTime) }}`
- Heure (`.session-time`): `{{ formatTimeOnly(session.startTime) }}`
- Actions (`.session-actions`):
  - Bouton Éditer (`.session-edit-btn`):
    - Action: `@click="startEditSession(index)"`
    - Texte: "✏️"
    - Title: "MODIFY ENTRY"
  - Bouton Supprimer (`.session-delete-btn`):
    - Action: `@click="deleteSession(index)"`
    - Texte: "🗑️"
    - Title: "DELETE ENTRY"

**Mode Édition** (`.session-edit-form`):
- Condition: `v-else`

**Grille Édition** (`.edit-form-grid`):
- Champs identiques au formulaire d'ajout
- Variables: `editSession.*`

**Actions Édition** (`.edit-form-actions`):
- Bouton Sauver (`.edit-save-btn`):
  - Action: `@click="saveEditSession"`
  - Disabled: `!editSession.subjectName`
  - Texte: "✅ SAVE"
- Bouton Annuler (`.edit-cancel-btn`):
  - Action: `@click="cancelEditSession"`
  - Texte: "❌ CANCEL"

**Fonctions**:
- `startEditSession(sessionIndex)`: 
  - Initialise `editingSession` avec index
  - Remplit `editSession` avec données session
  - Convertit timestamp en date/heure
  - Ferme formulaire ajout si ouvert
- `saveEditSession()`: 
  - Validation champs
  - Crée nouvelle date/heure
  - Met à jour session dans historique
  - Trie historique
  - Recalcule stats globales
  - Sauvegarde
  - Ferme édition
- `cancelEditSession()`: 
  - Réinitialise `editingSession` à null
  - Réinitialise `editSession`
- `deleteSession(sessionIndex)`: 
  - Confirmation utilisateur
  - Supprime session de l'historique
  - Recalcule stats globales
  - Sauvegarde
  - Ajuste index édition si nécessaire

#### 3.6. Message Vide (`.no-sessions`)

**Condition**: `v-else`

**Contenu**:
- "🕘 NO SESSION DATA AVAILABLE"
- "Initialize first protocol or add manual entry!"

---

## 🏆 SOUS-ONGLET 3: TROPHÉES {#sous-onglet-3-trophées}

### Conditions d'Affichage
```javascript
v-show="currentView === 'apprentissage' && currentSubView === 'trophees' && !isLoading"
```

### Container Principal
- Classe: `.trophees-container`
- Largeur max: 1200px
- Centré avec margin auto
- Padding: 0 var(--spacing-md)

---

### MODULE 1: Progression Globale

**Emplacement**: Ligne 3582-3634

**Container**: `.global-progression .hologram-effect`

**Titre Section** (`.section-title`):
- Texte: "🌟 GLOBAL PROGRESSION MATRIX"

**Stats Globales** (`.global-stats`):

#### 1.1. Niveau Global (`.global-level`)

**Cercle Niveau** (`.level-circle .level-up`):
- Affichage: Cercle avec numéro
- Numéro (`.level-number`): `{{ progressionData.globalLevel }}`
- Style:
  - Width/Height: 120px
  - Border-radius: 50%
  - Border: 4px solid var(--primary-green)
  - Background: radial-gradient
  - Box-shadow: var(--shadow-glow-strong)
  - Animation: pulse

**Info Niveau** (`.level-info`):
- Titre (`.level-title`): "SYSTEM LEVEL"
- XP (`.level-xp`): `{{ progressionData.globalXP }} EXPERIENCE POINTS`
- Streak (`.streak-info`):
  - Condition: `v-if="streakInfo.days > 0"`
  - Icon: 🔥
  - Texte: `{{ streakInfo.days }} DAY STREAK`
  - Multiplicateur: `(×{{ streakInfo.multiplier }} XP)` si > 1

#### 1.2. Résumé Réalisations (`.achievement-summary`)

**Items** (`.achievement-item`):
1. **Trophées**:
   - Icon: 🏆
   - Nombre: `{{ unlockedTrophies.length }}`
   - Label: "TROPHIES"

2. **Badges**:
   - Icon: 🏅
   - Nombre: `{{ progressionData.unlockedBadges.length }}`
   - Label: "BADGES"

3. **Temps Total**:
   - Icon: ⏰
   - Valeur: `{{ Math.floor(progressionData.totalStudyTime / 3600) }}H`
   - Label: "TOTAL TIME"

4. **Streak**:
   - Icon: 🔥
   - Nombre: `{{ streakInfo.days }}`
   - Label: "STREAK"

#### 1.3. Bouton Reset (`.reset-section`)

**Bouton** (`.reset-button`):
- Action: `@click="resetProgressionData"`
- Texte: "🔄 SYSTEM RESET"
- Title: "RESET ALL PROGRESSION DATA"
- Style: Warning (rouge/orange)

**Fonction `resetProgressionData()`**:
- Confirmation utilisateur (confirm dialog)
- Réinitialisation:
  - `subjects`: {}
  - `globalLevel`: 1
  - `globalXP`: 0
  - `totalStudyTime`: 0
  - `unlockedBadges`: []
  - `unlockedTrophies`: []
  - `dailyStreak`: 0
  - `lastStudyDate`: null
  - `weeklyGoals`: {}
  - `monthlyStats`: {}
  - `progressionHistory`: []
- Sauvegarde (`saveProgressionData`)
- Message confirmation

---

### MODULE 2: Système d'Analyse Avancée

**Emplacement**: Ligne 3636-3824

**Container**: `.advanced-analytics-section .cyber-matrix`

**Header** (`.analytics-header`):
- Titre (`.section-title`): "📊 NEURAL ANALYTICS CENTER"
- Sous-titre (`.analytics-subtitle`): "Advanced Intelligence System"

#### 2.1. Sélecteur de Période (`.period-selector-container`)

**Container** (`.period-selector`):
- Display: flex
- Gap: var(--spacing-md)

**Boutons Période** (`.period-button`):
- Boucle: `v-for="(config, period) in PERIOD_CONFIG"`
- Action: `@click="changePeriod(period)"`
- Classe `.active` si `analytics.selectedPeriod === period`
- Structure:
  - Icon (`.period-icon`): `{{ config.icon }}`
  - Label (`.period-label`): `{{ config.label.toUpperCase() }}`
  - Glow (`.period-glow`): Effet lumineux

**Périodes Disponibles**:
- `3j`: ⚡ 3 Jours
- `7j`: 📅 7 Jours (défaut)
- `1m`: 📊 1 Mois
- `3m`: 📈 3 Mois
- `6m`: 🎯 6 Mois
- `1a`: 🏆 1 An

#### 2.2. Graphique Principal (`.main-chart-container`)

**Header Graphique** (`.chart-header`):
- Titre (`.chart-title`):
  - Icon + Label: `{{ PERIOD_CONFIG[analytics.selectedPeriod].icon }} {{ PERIOD_CONFIG[analytics.selectedPeriod].label.toUpperCase() }} ANALYSIS`

**Contrôles** (`.chart-controls`):
- Sélecteur Métrique (`.metric-selector`):
  - Boutons (`.metric-btn`):
    - ⭐ XP: `analytics.chartType = 'xp'`
    - ⏱️ TIME: `analytics.chartType = 'time'`
    - 🎯 SESSIONS: `analytics.chartType = 'sessions'`
  - Classe `.active` selon `analytics.chartType`

**Graphique Interactif** (`.interactive-chart`):
- Condition: `v-if="currentPeriodData.length"`

**Zone Graphique** (`.chart-area`):
- Grille (`.chart-grid`):
  - Display: flex
  - Gap: var(--spacing-sm)

**Points Graphique** (`.chart-point`):
- Boucle: `v-for="(point, index) in currentPeriodData"`
- Style dynamique:
  - `--delay`: `index * 0.1 + 's'`
  - `--height`: `getChartHeight(point) + '%'`

**Barre** (`.chart-bar`):
- Remplissage (`.bar-fill`):
  - Height: `getChartHeight(point) + '%'`
  - Background: linear-gradient (vert/cyan)
  - Box-shadow: glow
  - Animation: fade in avec delay
- Glow (`.bar-glow`): Effet lumineux
- Valeur (`.bar-value`): `{{ getChartValue(point) }}`

**Label** (`.chart-label`): `{{ point.label.toUpperCase() }}`

**Ligne Tendance** (`.trend-line`):
- Condition: `v-if="trendAnalysis.trend !== 'stable'"`
- Indicateur (`.trend-indicator`):
  - Classe: `.croissante` ou `.décroissante`
  - Icon: 📈 ou 📉
  - Texte: `{{ trendAnalysis.prediction.toUpperCase() }}`

**État Vide** (`.no-data-state`):
- Condition: `v-else`
- Icon: 📊
- Texte: "NO DATA FOR THIS PERIOD"
- Hint: "Start studying to see your analytics!"

**Fonctions**:
- `getAdvancedChartData(period)`: Génère données selon période
- `getChartHeight(point)`: Calcule hauteur barre
- `getChartValue(point)`: Formate valeur affichée
- `getChartRawValue(point)`: Valeur brute selon type
- `calculatePeriodStats(period)`: Calcule statistiques
- `calculateTrendAnalysis(period)`: Analyse tendance

#### 2.3. Panneau Statistiques Détaillées (`.dashboard-grid`)

**Grille**: Grid responsive

**Panneaux** (`.stat-panel`):

**2.3.1. Performance** (`.stat-panel .primary`):
- Header (`.stat-header`):
  - Icon: 🎯
  - Titre: "PERFORMANCE"
- Métriques (`.stat-metrics`):
  - Total Sessions (`.metric`):
    - Valeur: `{{ periodStats.totalSessions }}`
    - Label: "TOTAL SESSIONS"
  - Temps Total:
    - Valeur: `{{ Math.floor(periodStats.totalTime / 3600) }}H`
    - Label: "TOTAL TIME"
  - XP Gagné:
    - Valeur: `{{ periodStats.totalXP }}`
    - Label: "XP GAINED"

**2.3.2. Moyennes** (`.stat-panel .secondary`):
- Header:
  - Icon: 📈
  - Titre: "AVERAGES"
- Métriques:
  - Sessions/Jour: `{{ Math.round(periodStats.avgSessionsPerDay * 10) / 10 }}`
  - Temps/Jour: `{{ Math.round(periodStats.avgTimePerDay / 60) }}MIN`
  - XP/Jour: `{{ Math.round(periodStats.avgXPPerDay) }}`

**2.3.3. Consistance** (`.stat-panel .accent`):
- Header:
  - Icon: 🔥
  - Titre: "CONSISTENCY"
- Métrique (`.consistency-meter`):
  - Barre (`.consistency-bar`):
    - Remplissage (`.consistency-fill`):
      - Width: `{{ periodStats.consistency }}%`
      - Background: gradient
      - Glow: `.consistency-glow`
  - Valeur: `{{ periodStats.consistency }}%`
  - Label: "ACTIVE DAYS"

**2.3.4. Évolution** (`.stat-panel .improvement`):
- Header:
  - Icon conditionnel:
    - 🚀 si amélioration > 0
    - ⚠️ si amélioration < 0
    - ⚖️ si stable
  - Titre: "EVOLUTION"
- Affichage (`.improvement-display`):
  - Valeur (`.improvement-value`):
    - Classes: `.positive`, `.negative`, `.neutral`
    - Format: `{{ periodStats.improvement > 0 ? '+' : '' }}{{ periodStats.improvement }}%`
  - Label:
    - "PROGRESSION" si > 0
    - "REGRESSION" si < 0
    - "STABLE" si = 0

#### 2.4. Meilleur Jour (`.best-day-panel`)

**Condition**: `v-if="periodStats.bestDay"`

**Header** (`.best-day-header`):
- Icon: 👑
- Titre: "PEAK PERFORMANCE"

**Contenu** (`.best-day-content`):
- Date (`.best-day-date`):
  - Format: `{{ new Date(periodStats.bestDay.timestamp).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase() }}`
- Stats (`.best-day-stats`):
  - Sessions: `{{ periodStats.bestDay.sessions }} SESSIONS`
  - Temps: `{{ Math.floor(periodStats.bestDay.totalTime / 60) }}MIN`
  - XP: `{{ periodStats.bestDay.totalXP }} XP`

---

### MODULE 3: Badges Contextuels Débloqués

**Emplacement**: Ligne 3826-3839

**Condition**: `v-if="availableContextualBadges.filter(b => b.unlocked).length"`

**Titre**: "🏅 SPECIAL BADGES UNLOCKED"

**Grille** (`.contextual-badges-grid`):
- Display: grid
- Gap: var(--spacing-lg)

**Cartes Badge** (`.contextual-badge-card .unlocked`):
- Boucle: `v-for="badge in availableContextualBadges.filter(b => b.unlocked)"`
- Structure:
  - Icon (`.badge-icon-large`): `{{ badge.icon }}`
  - Info (`.badge-info`):
    - Nom (`.badge-name`): `{{ badge.name.toUpperCase() }}`
    - Description (`.badge-description`): `{{ badge.description }}`
  - Status (`.badge-status`): "✅ UNLOCKED"

**Badges Disponibles**:
- 🐦 Lève-tôt (early_study, 10 sessions)
- 🦉 Hibou de Nuit (late_study, 10 sessions)
- ⚔️ Guerrier du Weekend (weekend_study, 8 weekends)
- 👑 Roi de la Régularité (daily_consistency, 30 jours)
- 💨 Démon de Vitesse (quick_sessions, 20 sessions)
- 🏃‍♂️ Marathonien Mental (long_sessions, 5 sessions)
- 💎 Perfectionniste (perfect_sessions, 25 sessions)
- 🧠 Polymathe (subject_variety, 5 matières)

---

### MODULE 4: Trophées Débloqués

**Emplacement**: Ligne 3841-3857

**Condition**: `v-if="unlockedTrophies.length"`

**Titre**: "🏆 TROPHIES UNLOCKED"

**Grille** (`.trophies-grid`):
- Display: grid
- Template-columns: repeat(auto-fit, minmax(280px, 1fr))
- Gap: var(--spacing-lg)

**Cartes Trophée** (`.trophy-card .unlocked .trophy-unlock`):
- Boucle: `v-for="trophy in unlockedTrophies"`
- Structure:
  - Icon (`.trophy-icon`): `{{ trophy.icon }}`
  - Info (`.trophy-info`):
    - Nom (`.trophy-name`): `{{ trophy.name.toUpperCase() }}`
    - Description (`.trophy-description`): `{{ trophy.description }}`
    - XP (`.trophy-xp`): `+{{ trophy.xp }} XP`
  - Status (`.trophy-status .unlocked-badge`): "✅ UNLOCKED"
- Animation: Unlock effect

---

### MODULE 5: Trophées à Débloquer

**Emplacement**: Ligne 3859-3875

**Condition**: `v-if="lockedTrophies.length"`

**Titre**: "🔒 TROPHIES TO UNLOCK"

**Grille**: Identique module 4

**Cartes Trophée** (`.trophy-card .locked`):
- Boucle: `v-for="trophy in lockedTrophies"`
- Structure identique mais:
  - Icon (`.trophy-icon .locked-icon`): Opacité réduite
  - Status (`.trophy-status .locked-badge`): "🔒 LOCKED"
- Style: Effet verrouillé (gris, opacité)

**Trophées Disponibles**:
- 🌟 Premier Pas (1 session)
- 🥉 Régularité Bronze (3 jours consécutifs)
- 🥈 Régularité Argent (7 jours consécutifs)
- 🥇 Régularité Or (30 jours consécutifs)
- 📚 Étudiant Débutant (10h total)
- 🎓 Étudiant Confirmé (50h total)
- 👨‍🎓 Maître Étudiant (100h total)
- ⭐ Spécialiste (niveau 10 dans une matière)
- 🧠 Polymathe (5 matières différentes)
- 🦉 Hibou de Nuit (étudier après 22h)
- 🐦 Lève-tôt (étudier avant 7h)
- 🏃‍♂️ Marathonien (session 3h)
- 💎 Perfectionniste (20 sessions sans interruption)

---

### MODULE 6: Progression par Matière

**Emplacement**: Ligne 3877-3966

**Condition**: `v-if="Object.keys(progressionData.subjects).length"`

**Container**: `.subjects-progression .circuit-pattern`

**Titre**: "📚 SUBJECT PROGRESSION"

#### 6.1. Comparaison Rapide (`.subjects-comparison`)

**Condition**: `v-if="subjectComparison.length > 1"`

**Titre**: "🔍 COMPARATIVE ANALYSIS"

**Grille** (`.comparison-grid`):
- Display: grid
- Gap: var(--spacing-md)

**Cartes Comparaison** (`.comparison-card`):
- Boucle: `v-for="subject in subjectComparison"`
- Classes:
  - `.ahead`: Si niveau > moyenne
  - `.behind`: Si niveau < moyenne
  - `.balanced`: Si niveau = moyenne
  - `.high-urgency`: Si `subject.urgency === 'high'`

**Structure**:
- Header (`.comparison-header`):
  - Nom (`.comparison-name`): `{{ subject.name.toUpperCase() }}`
  - Niveau (`.comparison-level`): `LVL {{ subject.level }}`
- Status (`.comparison-status`):
  - Indicateur (`.status-indicator`):
    - `.ahead`: "📈 +{{ Math.abs(subject.levelGap) }} LEVEL(S) AHEAD"
    - `.behind`: "📉 {{ Math.abs(subject.levelGap) }} LEVEL(S) BEHIND"
    - `.balanced`: "⚖️ BALANCED"
- Dernière Étude (`.last-study`):
  - Condition: `v-if="subject.lastStudyDays > 0"`
  - Format:
    - "YESTERDAY" si 1 jour
    - "{{ subject.lastStudyDays }} DAY(S) AGO" si ≤ 7 jours
    - "⚠️ {{ subject.lastStudyDays }} DAYS" si > 7 jours (classe `.urgent-text`)

#### 6.2. Progression Détaillée (`.subjects-progress-grid`)

**Grille**: Grid responsive

**Cartes Progression** (`.subject-progress-card`):
- Boucle: `v-for="(subjectData, subjectName) in progressionData.subjects"`

**Header Progression** (`.subject-progress-header`):
- Info (`.subject-progress-info`):
  - Nom (`.subject-progress-name`): `{{ subjectName.toUpperCase() }}`
  - Badge (`.subject-progress-badge`):
    - Format: `{{ getSubjectBadge(subjectData.level).icon }} {{ getSubjectBadge(subjectData.level).name.toUpperCase() }}`
  - Mini-badges (`.mini-badges`):
    - 🐦 Early Bird: si `subjectData.earlyMorningSessions >= 3`
    - 🦉 Night Owl: si `subjectData.lateEveningSessions >= 3`
    - 🏃‍♂️ Marathon: si `subjectData.longSessions >= 2`
    - 💎 Perfectionist: si `subjectData.perfectSessions >= 5`
- Niveau (`.subject-progress-level`):
  - Texte: `LEVEL {{ subjectData.level }}`

**Stats Progression** (`.subject-progress-stats`):
- Stat (`.progress-stat`):
  - ⏱️ Temps: `{{ Math.floor(subjectData.totalTime / 3600) }}H{{ Math.floor((subjectData.totalTime % 3600) / 60) }}M`
  - 🎯 Sessions: `{{ subjectData.sessions }}`
  - ⭐ XP: `{{ subjectData.xp }} XP`
  - 💎 Perfect: `{{ subjectData.perfectSessions }}` (si > 0)

**Barre XP** (`.subject-xp-progress`):
- Barre (`.xp-progress-bar`):
  - Remplissage (`.xp-progress-fill`):
    - Width: `{{ getSubjectProgression(subjectName).progress }}%`
    - Glow: `.xp-progress-glow`
- Texte (`.xp-progress-text`):
  - Format: `{{ currentLevelXP }} / {{ nextLevelXP }} XP`

---

### MODULE 7: Guide des Trophées et Badges

**Emplacement**: Ligne 3968-4029

**Container**: `.trophies-guide`

**Titre**: "🎮 COMPLETE GUIDE"

#### 7.1. Guide Badges Contextuels (`.guide-section`)

**Titre**: "🏅 SPECIAL BADGES"

**Grille** (`.badges-guide-grid`):
- Display: grid
- Gap: var(--spacing-md)

**Cartes Guide** (`.badge-guide-card`):
- Boucle: `v-for="badge in availableContextualBadges"`
- Classes:
  - `.unlocked`: Si débloqué
  - `.locked`: Si verrouillé
- Structure:
  - Icon (`.badge-guide-icon`): `{{ badge.icon }}`
  - Info (`.badge-guide-info`):
    - Nom (`.badge-guide-name`): `{{ badge.name.toUpperCase() }}`
    - Description (`.badge-guide-description`): `{{ badge.description }}`
    - Requis (`.badge-guide-requirement`): `REQUIRED: {{ badge.threshold }} TIMES`

#### 7.2. Guide Trophées par Catégorie (`.guide-categories`)

**Catégories**:

**7.2.1. Progression** (`.guide-category`):
- Titre: "🏃‍♂️ PROGRESSION"
- Liste (`.guide-list`):
  - 🌟 FIRST STEP - Première session
  - 📚 BEGINNER STUDENT - 10 heures
  - 🎓 CONFIRMED STUDENT - 50 heures
  - 👨‍🎓 MASTER STUDENT - 100 heures

**7.2.2. Régularité** (`.guide-category`):
- Titre: "🔥 REGULARITY"
- Liste:
  - 🥉 BRONZE REGULARITY - 3 jours consécutifs
  - 🥈 SILVER REGULARITY - 7 jours consécutifs
  - 🥇 GOLD REGULARITY - 30 jours consécutifs

**7.2.3. Spécialisation** (`.guide-category`):
- Titre: "🎯 SPECIALIZATION"
- Liste:
  - ⭐ SPECIALIST - Niveau 10
  - 🧠 POLYMATH - 5 matières
  - 💎 PERFECTIONIST - 20 sessions sans pause

**7.2.4. Défis Spéciaux** (`.guide-category`):
- Titre: "⚡ SPECIAL CHALLENGES"
- Liste:
  - 🦉 NIGHT OWL - Après 22h
  - 🐦 EARLY BIRD - Avant 7h
  - 🏃‍♂️ MARATHON RUNNER - Session 3h

---

### MODULE 8: Système de Niveaux et XP

**Emplacement**: Ligne 4031-4087

**Container**: `.level-system-info`

**Titre**: "📈 LEVEL SYSTEM"

#### 8.1. Info Streak (`.streak-info-panel`)

**Condition**: `v-if="streakInfo.days > 0"`

**Titre**: "🔥 STREAK MULTIPLIER"

**Détails** (`.streak-details`):
- Streak Actuel (`.current-streak`):
  - Texte: `Current streak: <strong>{{ streakInfo.days }} DAYS</strong>`
  - Badge Multiplicateur (`.multiplier-badge`):
    - Condition: `v-if="streakInfo.multiplier > 1"`
    - Texte: `×{{ streakInfo.multiplier }} XP`
- Prochain Palier (`.next-milestone`):
  - Condition: `v-if="streakInfo.nextMilestone"`
  - Texte: `Next milestone: {{ streakInfo.nextMilestone }} days`

**Multiplicateurs Streak**:
- 3 jours: ×1.1
- 7 jours: ×1.2
- 14 jours: ×1.3
- 30 jours: ×1.5

#### 8.2. Showcase Badges Niveau (`.level-badges-showcase`)

**Grille**: Flex wrap

**Items Badge** (`.level-badge-item`):
- Boucle: `v-for="(badge, key) in SUBJECT_BADGES"`
- Style: Border-color dynamique basé sur `badge.color`
- Structure:
  - Icon (`.badge-icon`): `{{ badge.icon }}`
  - Info (`.badge-info`):
    - Nom (`.badge-name`): `{{ badge.name.toUpperCase() }}`
    - Niveau (`.badge-level`): `LEVEL {{ badge.level }}+`

**Badges Niveau**:
- 🔰 Novice: Niveau 1+
- 📖 Apprenti: Niveau 3+
- 🎒 Étudiant: Niveau 5+
- 📜 Érudit: Niveau 8+
- 🎓 Expert: Niveau 12+
- 👑 Maître: Niveau 20+
- ⚡ Légende: Niveau 30+
- 🌟 Immortel: Niveau 50+

#### 8.3. Panel Info XP (`.xp-info-panel`)

**Titre**: "💡 HOW TO GAIN XP:"

**Liste Tips** (`.xp-tips`):
- **+30 XP** - Compléter une session normale
- **+45 XP** - Compléter une session sans pause
- **+1.2 XP/MIN** - Temps d'étude de base
- **STREAK BONUS** - Jusqu'à ×1.5 pour 30 jours consécutifs
- **TIME BONUSES** - ×1.2 matin tôt, ×1.1 soir
- **WEEKEND BONUS** - ×1.15 samedi et dimanche
- **DURATION BONUS** - ×1.8 pour sessions 90min+

**Formule Niveau**:
```
XP = (level^1.8) * 150
```

**Bonus Contextuels**:
- Matin tôt (5h-8h): ×1.2
- Soir tard (20h-23h): ×1.1
- Weekend: ×1.15
- Session longue (45min+): ×1.4
- Session très longue (90min+): ×1.8
- Session courte (<15min): ×0.8 (pénalité)

---

## 🧭 SYSTÈME DE NAVIGATION {#système-de-navigation}

### Navigation Principale

**Variable**: `currentView`
- Valeur par défaut: `'apprentissage'`
- Bouton: `.nav-button`
- Classe active: `.nav-button-active`

### Navigation Sous-Onglets

**Variable**: `currentSubView`
- Valeur par défaut: `'matieres'`
- Fonction: `switchToSubView(subView)`
- Boutons: `.sub-nav-button`
- Classe active: `.sub-nav-active`

**Fonction `switchToSubView()`**:
```javascript
function switchToSubView(subView) {
  currentSubView.value = subView;
  triggerSpark();
}
```

**Boutons Disponibles**:
1. 📚 Matières → `switchToSubView('matieres')`
2. ⏱️ Sessions → `switchToSubView('sessions')`
3. 🏆 Trophées → `switchToSubView('trophees')`

---

## 📊 SYSTÈME DE PROGRESSION ET XP {#système-de-progression}

### Structure Données Progression

**Objet**: `progressionData` (reactive)

**Propriétés**:
- `subjects`: Object avec XP par matière
  - Structure par matière:
    ```javascript
    {
      xp: number,
      level: number,
      sessions: number,
      totalTime: number, // secondes
      perfectSessions: number,
      earlyMorningSessions: number,
      lateEveningSessions: number,
      weekendSessions: number,
      longSessions: number,
      quickSessions: number,
      lastStudyDate: string | null, // Date.toDateString()
      weeklyXP: array,
      monthlyXP: array
    }
    ```
- `globalLevel`: Niveau global (défaut: 1)
- `globalXP`: XP globale (défaut: 0)
- `totalStudyTime`: Temps total en secondes
- `unlockedBadges`: Array IDs badges débloqués (strings)
- `unlockedTrophies`: Array IDs trophées débloqués (strings)
- `dailyStreak`: Nombre jours consécutifs
- `lastStudyDate`: Date dernière étude (string Date.toDateString() ou null)
- `weeklyGoals`: Object objectifs hebdomadaires
- `monthlyStats`: Object statistiques mensuelles
- `progressionHistory`: Array historique pour graphiques
  - Structure entrée:
    ```javascript
    {
      date: string, // YYYY-MM-DD
      timestamp: number,
      subject: string,
      xpGained: number,
      sessionDuration: number, // secondes
      subjectLevel: number,
      globalLevel: number,
      dailyStreak: number
    }
    ```

### Fonction Calcul Niveau

**Fonction**: `calculateLevel(xp)`

**Formule**:
```javascript
level = 1
while (XP_CONFIG.level_formula(level) <= xp) {
  level++
}
return level - 1
```

**Formule XP**:
```javascript
XP_CONFIG.level_formula = (level) => Math.floor(Math.pow(level, 1.8) * 150)
```

### Fonction Ajout XP

**Fonction**: `addXP(subjectName, baseXP, sessionData = null)`

**Processus**:
1. Initialiser données matière si nécessaire
2. Calculer multiplicateurs contextuels:
   - Streak multiplier
   - Bonus horaires (matin/soir)
   - Bonus weekend
   - Catégorisation sessions (longue/courte)
3. Ajouter XP à la matière
4. Calculer nouveau niveau
5. Ajouter XP globale
6. Mettre à jour statistiques
7. Vérifier level up
8. Vérifier badges contextuels
9. Vérifier trophées
10. Sauvegarder

**Multiplicateurs**:
- Streak: 1.0 à 1.5
- Matin tôt: ×1.2
- Soir tard: ×1.1
- Weekend: ×1.15
- Session longue (45min+): ×1.4
- Session très longue (90min+): ×1.8
- Session courte (<15min): ×0.8

### Fonction Calcul XP Session

**Fonction**: `calculateSessionXP(sessionData)`

**Calcul**:
```javascript
let xp = XP_CONFIG.session_completed; // 30
xp += minutes * XP_CONFIG.base_xp_per_minute; // +1.2/min

if (sessionData.completed && sessionData.pauseTime === 0) {
  xp += XP_CONFIG.session_perfect - XP_CONFIG.session_completed; // +15
}

// Multiplicateurs durée
if (actualWorkTime >= 5400) { // 90min+
  xp *= XP_CONFIG.very_long_session_bonus; // ×1.8
} else if (actualWorkTime >= 2700) { // 45min+
  xp *= XP_CONFIG.long_session_bonus; // ×1.4
} else if (actualWorkTime < 900) { // <15min
  xp *= XP_CONFIG.short_session_penalty; // ×0.8
}

return Math.max(xp, 8); // Minimum 8 XP
```

**Note**: Cette fonction est appelée AVANT `addXP()` pour calculer la base XP. Les multiplicateurs contextuels (streak, horaires, weekend) sont appliqués dans `addXP()`.

### Système de Badges

**Badges Niveau Matière** (`SUBJECT_BADGES`):
- Débloqués automatiquement selon niveau
- 8 niveaux: Novice → Immortel

**Badges Contextuels** (`CONTEXTUAL_BADGES`):
- Débloqués selon conditions spécifiques
- 8 badges disponibles

### Système de Trophées

**Trophées** (`TROPHIES_CONFIG`):
- 13 trophées disponibles
- Débloqués selon conditions
- Donnent XP bonus

**Vérification**: `checkTrophies(subjectName, sessionData)`
- Vérifie tous les trophées non débloqués
- Débloque si condition remplie
- Ajoute XP bonus

---

## 🎨 STYLES ET DESIGN CYBERPUNK {#styles-et-design}

### Variables CSS Principales

**Couleurs**:
- `--primary-green`: #32ff9f
- `--primary-cyan`: #00ffc8
- `--primary-teal`: #00ffaa
- `--accent-green`: #50ff9f
- `--accent-cyan`: #00ffd4

**Fonds**:
- `--bg-dark-primary`: #001d18
- `--bg-dark-secondary`: #00352d
- `--bg-dark-tertiary`: #002820
- `--bg-overlay`: rgba(0, 29, 24, 0.8)
- `--bg-overlay-light`: rgba(0, 29, 24, 0.6)

**Texte**:
- `--text-primary`: #e6fef4
- `--text-secondary`: rgba(230, 254, 244, 0.8)
- `--text-muted`: rgba(230, 254, 244, 0.6)

**Erreurs**:
- `--error-color`: #ff5a5a
- `--error-bg`: rgba(255, 90, 90, 0.2)

**Espacements**:
- `--spacing-xs`: 0.25rem
- `--spacing-sm`: 0.5rem
- `--spacing-md`: 1rem
- `--spacing-lg`: 1.5rem
- `--spacing-xl`: 2rem
- `--spacing-xxl`: 3rem

**Bordures**:
- `--border-radius-sm`: 8px
- `--border-radius-md`: 12px
- `--border-radius-lg`: 20px
- `--border-width`: 2px

**Ombres**:
- `--shadow-sm`: 0 2px 8px rgba(0, 0, 0, 0.2)
- `--shadow-md`: 0 5px 20px rgba(0, 0, 0, 0.3)
- `--shadow-lg`: 0 10px 40px rgba(0, 0, 0, 0.4)
- `--shadow-glow`: 0 0 20px rgba(50, 255, 159, 0.3)
- `--shadow-glow-strong`: 0 0 30px rgba(0, 255, 200, 0.5)

**Transitions**:
- `--transition-fast`: 0.2s ease
- `--transition-normal`: 0.3s ease
- `--transition-slow`: 0.5s ease

**Polices**:
- `--font-primary`: 'Inter', 'Segoe UI', system-ui, sans-serif
- `--font-title`: 'Orbitron', sans-serif
- `--font-mono`: 'Monaco', 'Menlo', monospace

### Effets Visuels

**Grille Arrière-plan**:
- Pattern grille avec opacité animée
- Animation: `gridPulse` (4s)

**Particules Flottantes**:
- Radial gradients animés
- Animation: `particleFloat` (15s)

**Effets Shimmer**:
- Gradient animé sur plusieurs éléments
- Animation: `formShimmer`, `navShimmer`

**Effets Glow**:
- Box-shadow avec couleurs primaires
- Text-shadow pour texte
- Drop-shadow pour icônes

**Animations**:
- `logoFloat`: Flottement logo (3s ease-in-out infinite)
  - 0%, 100%: translateY(0px) scale(1)
  - 50%: translateY(-5px) scale(1.05)
- `gradientShift`: Déplacement gradient titre (3s ease-in-out infinite)
  - 0%, 100%: background-position 0% 50%
  - 50%: background-position 100% 50%
- `progressShine`: Brillance barre progression (2s ease-in-out infinite)
  - 0%: translateX(-100%)
  - 100%: translateX(100%)
- `borderGlow`: Pulsation bordure (3s ease-in-out infinite)
  - 0%, 100%: opacity 0.3
  - 50%: opacity 0.6
- `fadeInUp`: Apparition depuis bas (0.6s ease-out)
  - from: opacity 0, translateY(20px)
  - to: opacity 1, translateY(0)
- `pulse`: Pulsation (2s infinite)
  - 0%, 100%: scale(1)
  - 50%: scale(1.05)
- `sparkFade`: Disparition étincelle (0.8s ease-out forwards)
  - 0%: opacity 1, scale(1)
  - 100%: opacity 0, scale(0.3)
- `sessionActive`: Pulsation session active (2s ease-in-out infinite)
  - 0%, 100%: opacity 0.8, text-shadow faible
  - 50%: opacity 1, text-shadow fort
- `gridPulse`: Pulsation grille arrière-plan (4s ease-in-out infinite)
  - 0%, 100%: opacity 0.3
  - 50%: opacity 0.1
- `particleFloat`: Flottement particules (15s linear infinite)
  - 0%: translate(0, 0) rotate(0deg)
  - 100%: translate(-50px, -50px) rotate(360deg)
- `formShimmer`: Brillance formulaire (4s ease-in-out infinite)
  - 0%: rotate(0deg)
  - 100%: rotate(360deg)
- `navShimmer`: Brillance navigation (3s ease-in-out infinite)
  - 0%: translateX(-100%)
  - 100%: translateX(100%)
- `overlayFadeIn`: Apparition overlay popup (0.3s ease-out)
  - from: opacity 0
  - to: opacity 1
- `popupSlideIn`: Apparition popup (0.4s cubic-bezier)
  - from: translateY(-50px) scale(0.9), opacity 0
  - to: translateY(0) scale(1), opacity 1
- `iconBounce`: Rebond icône (2s ease-in-out infinite)
  - 0%, 100%: scale(1)
  - 50%: scale(1.1)
- `slideInFromRight`: Glissement depuis droite (0.5s ease-out)
  - from: translateX(30px), opacity 0
  - to: translateX(0), opacity 1
- `bounceIn`: Rebond entrée (0.6s ease-out)
  - 0%: scale(0.3), opacity 0
  - 50%: scale(1.05), opacity 1
  - 70%: scale(0.9)
  - 100%: scale(1), opacity 1

### Responsive Design

**Breakpoints**:
- `1024px`: Réduction espacements
- `768px`: 
  - Titre: 2.5rem
  - Navigation colonne
  - Grille planificateur: 2 colonnes
  - Timer: 220px
- `480px`:
  - Titre: 2rem
  - Grille planificateur: 1 colonne
  - Timer: 180px

**Accessibilité**:
- `prefers-reduced-motion`: Désactive animations
- `focus-visible`: Outline clair pour navigation clavier

---

## 📝 NOTES FINALES

### Sauvegarde Données

**LocalStorage**:
- `quietquest_subjects`: Liste matières
- `quietquest_progression`: Données progression
- `quietquest_timer`: État timer
- `quietquest_sessions_history`: Historique sessions
- `quietquest_planner`: Données planificateur

**IndexedDB**:
- Store `files`: Fichiers uploadés
- Store `subjects`: Matières (backup)
- Store `metadata`: Métadonnées (planificateur)

### Fonctions Principales

**Gestion Matières**:
- `addSubject()`: Ajouter matière
- `deleteSubject(index)`: Supprimer matière
- `handleFileUpload(event)`: Upload fichiers
- `handleAdditionalFiles(event, index)`: Ajouter fichiers
- `deleteFile(subjectIndex, fileIndex)`: Supprimer fichier

**Gestion Sessions**:
- `startSession(subject)`: Démarrer session
- `togglePause()`: Pause/Reprendre
- `stopSession()`: Arrêter session
- `resetTimer()`: Réinitialiser timer
- `startBreak()`: Démarrer pause
- `skipBreak()`: Ignorer pause
- `continueSession()`: Continuer nouvelle session
- `finishStudying()`: Terminer complètement
- `adjustSessionTime(minutes)`: Ajuster temps (+10min)
- `handleTimerEnd()`: Gérer fin timer
- `startTimerInterval()`: Démarrer intervalle
- `stopTimerInterval()`: Arrêter intervalle
- `saveTimerState()`: Sauvegarder état timer
- `loadTimerState()`: Charger état timer
- `saveSessionHistory()`: Sauvegarder historique
- `loadSessionHistory()`: Charger historique
- `addManualSession()`: Ajouter session manuelle
- `saveEditSession()`: Sauvegarder édition
- `deleteSession(index)`: Supprimer session

**Gestion Planificateur**:
- `navigateWeek(direction)`: Navigation semaines
- `goToCurrentWeek()`: Retour semaine actuelle
- `assignSubjectToDay(subjectName, dayOfWeek)`: Assigner matière
- `getAssignedDay(subjectName)`: Obtenir jour assigné
- `changeSubjectDay(subjectName, newDay)`: Changer jour

**Gestion Progression**:
- `addXP(subjectName, baseXP, sessionData)`: Ajouter XP
- `calculateLevel(xp)`: Calculer niveau
- `getXPForNextLevel(currentLevel)`: XP pour niveau suivant
- `getCurrentLevelXP(xp, currentLevel)`: XP actuelle dans niveau
- `getSubjectProgression(subjectName)`: Obtenir progression
- `getSubjectBadge(level)`: Obtenir badge selon niveau
- `checkTrophies(subjectName, sessionData)`: Vérifier trophées
- `checkSubjectBadges(subjectName, level)`: Vérifier badges matière
- `checkContextualBadges(subjectName)`: Vérifier badges contextuels
- `updateDailyStreak()`: Mettre à jour streak
- `calculateDailyStreak()`: Calculer streak depuis historique
- `getStreakMultiplier()`: Obtenir multiplicateur streak
- `handleLevelUp(subjectName, newLevel, oldLevel)`: Gérer level up
- `recordProgressionHistory(subjectName, xpGained, sessionData)`: Enregistrer historique
- `saveProgressionData()`: Sauvegarder progression
- `loadProgressionData()`: Charger progression
- `recalculateGlobalStats()`: Recalculer stats globales
- `resetProgressionData()`: Réinitialiser progression

**Analyse**:
- `getAdvancedChartData(period)`: Données graphique
- `getProgressionChartData(days)`: Données progression (30 jours par défaut)
- `calculatePeriodStats(period)`: Statistiques période
- `calculateTrendAnalysis(period)`: Analyse tendance
- `getSubjectComparison()`: Comparaison matières
- `getChartHeight(point)`: Calculer hauteur barre graphique
- `getChartValue(point)`: Formater valeur affichée
- `getChartRawValue(point)`: Valeur brute selon type
- `changePeriod(period)`: Changer période analyse

**Formatage**:
- `formatTime(seconds)`: Formate secondes en MM:SS
- `formatDate(timestamp)`: Formate timestamp en date française
- `formatTimeOnly(timestamp)`: Formate timestamp en heure HH:MM

**Utilitaires**:
- `triggerSpark()`: Déclenche effet étincelle
- `updateSaveStatus(message)`: Affiche message status (3s)
- `isIndexedDBAvailable()`: Vérifie disponibilité IndexedDB
- `openDB()`: Ouvre connexion IndexedDB
- `saveFileToIndexedDB(file, subjectName)`: Sauvegarde fichier
- `loadFileFromIndexedDB(subjectName, fileName)`: Charge fichier
- `deleteFileFromDB(subjectName, fileName)`: Supprime fichier
- `saveSubjects()`: Sauvegarde matières
- `loadSubjects()`: Charge matières
- `savePlannerData()`: Sauvegarde planificateur
- `loadPlannerData()`: Charge planificateur
- `diagnosticStorage()`: Diagnostic stockage

---

## ✅ CHECKLIST DE RÉPLICATION

Pour reproduire exactement l'onglet apprentissage:

### Structure HTML
- [ ] Header avec logo et navigation
- [ ] Navigation sous-onglets (3 boutons)
- [ ] Container matières
- [ ] Container sessions
- [ ] Container trophées

### Module Matières
- [ ] Formulaire ajout matière
- [ ] Liste cartes matières
- [ ] Section progression XP par matière
- [ ] Gestion fichiers
- [ ] Recommandations étude

### Module Sessions
- [ ] Timer principal avec cercle SVG
- [ ] Contrôles timer
- [ ] Statistiques jour
- [ ] Sélecteur matière
- [ ] Planificateur hebdomadaire
- [ ] Historique sessions
- [ ] Formulaire ajout manuel
- [ ] Édition sessions

### Module Trophées
- [ ] Progression globale
- [ ] Sélecteur période analyse
- [ ] Graphique interactif
- [ ] Panneaux statistiques
- [ ] Badges contextuels
- [ ] Trophées débloqués/verrouillés
- [ ] Progression par matière
- [ ] Guide complet
- [ ] Système niveaux/XP

### Styles
- [ ] Variables CSS complètes
- [ ] Effets cyberpunk (glow, shimmer, animations)
- [ ] Responsive design
- [ ] Accessibilité

### Fonctionnalités
- [ ] Système XP complet
- [ ] Calcul niveaux
- [ ] Badges et trophées
- [ ] Sauvegarde données (localStorage + IndexedDB)
- [ ] Drag & drop planificateur
- [ ] Timer avec pause/reprise
- [ ] Système audio (sons timer)
- [ ] Popups pause et options fin
- [ ] Analyse avancée
- [ ] Restauration session après rechargement
- [ ] Formatage dates/heures
- [ ] Effets visuels (spark, shimmer, glow)

### Éléments Critiques à Implémenter

**Popups Timer** (non dans template actuel):
- [ ] Popup pause (`showBreakPopup`)
- [ ] Popup options fin (`showEndSessionOptions`)
- [ ] Overlay avec blur
- [ ] Animations entrée/sortie

**Système Audio**:
- [ ] Contexte audio Web Audio API
- [ ] Sons fin session (double bip)
- [ ] Sons fin pause (triple bip)
- [ ] Sons avertissement (bip simple)
- [ ] Mode silencieux

**Gestion Erreurs**:
- [ ] Try/catch sur toutes opérations critiques
- [ ] Messages d'erreur utilisateur
- [ ] Fallback localStorage si IndexedDB échoue
- [ ] Validation données avant sauvegarde

---

---

## 🔍 VÉRIFICATION FINALE DE COMPLÉTUDE

### Variables Réactives Complètes

**Principales**:
- `currentView`: 'apprentissage'
- `currentSubView`: 'matieres' | 'sessions' | 'trophees'
- `subjects`: Array matières
- `isLoading`: boolean
- `saveStatus`: string
- `debugMode`: boolean
- `showSpark`: boolean

**Progression**:
- `progressionData`: Objet reactive complet
- `showTrophiesModal`: boolean

**Formulaire Matière**:
- `newSubject`: { name, files, summary }

**Sessions Manuelles**:
- `manualSession`: { subjectName, duration, type, date, time }
- `showManualSessionForm`: boolean

**Édition Session**:
- `editingSession`: number | null
- `editSession`: { subjectName, duration, type, date, time }

**Timer**:
- `timer`: Objet reactive complet avec toutes propriétés

**Planificateur**:
- `planner`: { currentWeekOffset, compactMode, cycles, subjectOrder, draggedSubject }

**Analyse**:
- `analytics`: { selectedPeriod, chartType, showTrends, showGoals, animationEnabled }

### Configuration Complète

**XP_CONFIG**:
- Toutes valeurs XP
- Multiplicateurs
- Formule niveau
- Bonus contextuels

**TROPHIES_CONFIG**:
- 13 trophées avec conditions exactes

**SUBJECT_BADGES**:
- 8 badges niveau avec couleurs

**CONTEXTUAL_BADGES**:
- 8 badges contextuels avec seuils

**PERIOD_CONFIG**:
- 6 périodes d'analyse

### Événements et Interactions

**Tous les `@click`**:
- Navigation
- Boutons timer
- Actions matières
- Planificateur
- Historique

**Tous les `@change`**:
- Inputs formulaires
- Selects

**Tous les `@submit`**:
- Formulaire ajout matière

**Tous les `@drag`**:
- Drag & drop planificateur

**Tous les `v-model`**:
- Tous les champs de formulaire

**Tous les `v-if` / `v-show`**:
- Conditions d'affichage

**Tous les `v-for`**:
- Boucles de rendu

### Styles CSS Critiques

**Toutes les classes documentées**:
- Classes principales
- Classes conditionnelles
- Classes d'état
- Classes d'animation

**Tous les effets visuels**:
- Glow, shimmer, animations
- Transitions
- Hover states
- Focus states

**Responsive complet**:
- 3 breakpoints documentés
- Tous ajustements responsive

### Données et Persistance

**LocalStorage Keys**:
- `quietquest_subjects`
- `quietquest_progression`
- `quietquest_timer`
- `quietquest_sessions_history`
- `quietquest_planner`

**IndexedDB Stores**:
- `files`
- `subjects`
- `metadata`

**Structure données complète**:
- Matières
- Sessions
- Progression
- Timer
- Planificateur

### Fonctions Critiques

**Toutes les fonctions documentées**:
- Gestion matières (5 fonctions)
- Gestion sessions (15 fonctions)
- Gestion planificateur (9 fonctions)
- Gestion progression (15 fonctions)
- Analyse (8 fonctions)
- Formatage (3 fonctions)
- Utilitaires (12 fonctions)

**Tous les computed**:
- 17 computed properties documentés

### Textes et Labels Exactes

**Tous les textes en français**:
- Titres
- Labels
- Messages
- Placeholders
- Boutons

**Tous les emojis**:
- Exactement comme dans le code

### Points d'Attention

**Éléments non implémentés dans template**:
- Popups timer (`showBreakPopup`, `showEndSessionOptions`)
- Structure HTML des popups à créer

**Éléments optionnels**:
- Debug panel (si `debugMode` activé)
- Modal trophées (si `showTrophiesModal` activé)

---

**Document créé le**: 2024
**Version**: 1.0
**Application**: QuietQuest - Onglet Apprentissage
**Statut**: ✅ COMPLET - Tous les modules documentés en détail

---

## 📐 CONFIGURATIONS EXACTES

### Configuration XP (XP_CONFIG)

```javascript
{
  session_completed: 30,
  session_perfect: 45,
  daily_goal: 75,
  weekly_goal: 150,
  monthly_goal: 500,
  base_xp_per_minute: 1.2,
  long_session_bonus: 1.4, // 45min+
  very_long_session_bonus: 1.8, // 90min+
  short_session_penalty: 0.8, // <15min
  consistency_bonus: 1.3,
  level_formula: (level) => Math.floor(Math.pow(level, 1.8) * 150),
  early_morning_bonus: 1.2, // 5h-8h
  late_evening_bonus: 1.1, // 20h-23h
  weekend_bonus: 1.15,
  streak_multipliers: {
    3: 1.1,
    7: 1.2,
    14: 1.3,
    30: 1.5
  }
}
```

### Configuration Trophées (TROPHIES_CONFIG)

**13 Trophées** avec:
- `id`: Identifiant unique
- `name`: Nom affiché
- `description`: Description
- `icon`: Emoji
- `type`: Catégorie
- `requirement`: { type, value }
- `xp`: XP bonus

### Configuration Badges Matière (SUBJECT_BADGES)

**8 Badges**:
- Novice (1): 🔰 #6b7280
- Apprenti (3): 📖 #3b82f6
- Étudiant (5): 🎒 #10b981
- Érudit (8): 📜 #8b5cf6
- Expert (12): 🎓 #f59e0b
- Maître (20): 👑 #ef4444
- Légende (30): ⚡ #ffd700
- Immortel (50): 🌟 #ff1493

### Configuration Badges Contextuels (CONTEXTUAL_BADGES)

**8 Badges** avec:
- `condition`: Type condition
- `icon`: Emoji
- `name`: Nom
- `description`: Description
- `threshold`: Seuil requis

### Configuration Périodes (PERIOD_CONFIG)

**6 Périodes**:
- `3j`: ⚡ 3 Jours
- `7j`: 📅 7 Jours (défaut)
- `1m`: 📊 1 Mois
- `3m`: 📈 3 Mois
- `6m`: 🎯 6 Mois
- `1a`: 🏆 1 An

### Configuration IndexedDB

**Nom Base**: `quietquest-db`
**Version**: 3
**Stores**:
- `files`: Fichiers uploadés
- `subjects`: Matières (backup)
- `metadata`: Métadonnées

---

## 🎯 RÉSUMÉ EXÉCUTIF

Ce document contient **TOUS** les éléments nécessaires pour reproduire exactement l'onglet apprentissage:

✅ **Structure HTML complète** avec toutes les classes CSS
✅ **Tous les événements** (@click, @change, @submit, @drag)
✅ **Toutes les variables réactives** (ref, reactive, computed)
✅ **Toutes les fonctions JavaScript** avec logique détaillée
✅ **Tous les styles CSS** avec valeurs exactes
✅ **Toutes les animations** avec paramètres
✅ **Toutes les configurations** (XP, trophées, badges, périodes)
✅ **Toutes les structures de données** avec types
✅ **Tous les textes et labels** en français
✅ **Système de sauvegarde** (localStorage + IndexedDB)
✅ **Responsive design** complet
✅ **Accessibilité** (focus, reduced-motion)

**Points à noter**:
- Les popups timer sont définis dans les variables mais non implémentés dans le template HTML actuel
- Tous les autres éléments sont présents et documentés

**Avec ce document, une IA peut reproduire l'onglet apprentissage au caractère près, en conservant les couleurs et le style cyberpunk du site original.**

