// ================ BLOC PERFORMANCE AUJOURD'HUI - PRIORITÉ MODÉRÉE (VERSION CORRIGÉE - 2025-09-21 03:52) ================

window.TodayPerformanceBlock = {
  emits: ['updateData', 'navigateTo', 'openModal', 'applySuggestion'],
  template: `
    <div class="dashboard-card today-performance-card priority-moderate" @click="navigateToStats">
      <div class="card-glow" :class="performanceClass"></div>
      
      <!-- Header standard cohérent -->
      <div class="card-header">
        <div class="card-title">
          <span class="card-icon">🔥</span>
          <span>AUJOURD'HUI • {{ dateDisplay }}</span>
        </div>
        <div class="header-badges">
          <div class="card-badge" :class="modeClass">{{ modeBadge }}</div>
          <div class="session-info" v-if="activeSessionText">{{ activeSessionText }}</div>
        </div>
      </div>
      
      <div class="card-content">
        <!-- Métriques réorganisées : 2 cartes en haut, 1 carte en bas -->
        <div class="performance-metrics-reorganized">
          <div class="metrics-top-row">
            <div class="metric-item muscles-targeted" 
                 @click.stop="toggleMuscleSelector"
                 :class="{ 'muscle-selector-open': showMuscleSelector }"
                 data-tooltip="Cliquez pour choisir le muscle ciblé pour votre session d'entraînement">
              <div class="metric-header">
                <span class="metric-icon">💪</span>
                <div class="metric-title">MUSCLES CIBLÉS</div>
                <div class="selector-icon" v-if="!showMuscleSelector">▼</div>
                <div class="selector-icon" v-else>▲</div>
              </div>
              <div class="metric-progress">
                <div class="numbers">
                  <span class="value">{{ currentVariety }}/{{ targetVariety }}</span>
                  <span class="hint" v-if="!showMuscleSelector">Il manque: {{ missingMuscle }}</span>
                  <div class="muscle-selector" v-if="showMuscleSelector" @click.stop>
                    <select v-model="selectedMuscle" @change="updateTargetedMuscle" @click.stop>
                      <option value="">Choisir un muscle...</option>
                      <option v-for="muscle in availableMuscles" :key="muscle" :value="muscle">
                        {{ muscle }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="progress-bar blue">
                  <div class="progress-fill" :style="{ width: varietyProgressPercent + '%' }"></div>
                </div>
                <div class="progress-row">
                  <span class="percentage">{{ varietyProgressPercent }}%</span>
                </div>
              </div>
            </div>
            
            <div class="metric-item intensity" 
                 data-tooltip="Niveau d'intensité de votre session actuelle basé sur votre fréquence cardiaque et votre effort perçu">
              <div class="metric-header">
                <span class="metric-icon">🔥</span>
                <div class="metric-title">INTENSITÉ</div>
              </div>
              <div class="metric-progress">
                <div class="numbers">
                  <span class="value emphasis">MAXIMALE</span>
                  <span class="hint">Burn rate élevé</span>
                </div>
                <div class="progress-row">
                  <div class="progress-bar red">
                    <div class="progress-fill" :style="{ width: 100 + '%' }"></div>
                  </div>
                  <span class="percentage">100%</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Volume total sur toute la largeur en dessous -->
          <div class="metrics-bottom-row">
            <div class="metric-item volume-total">
              <div class="metric-header">
                <span class="metric-icon">🎯</span>
                <div class="metric-title">VOLUME TOTAL</div>
                <span class="metric-badge">🔥 PRESQUE PARFAIT</span>
              </div>
              <div class="metric-progress">
                <!-- Section volume total en haut -->
                <div class="volume-summary">
                  <div class="volume-numbers">
                    <span class="volume-current">{{ currentVolume }}</span>
                    <span class="volume-separator">/</span>
                    <span class="volume-target">{{ targetVolume }}</span>
                    <span class="volume-label">{{ volumeUnit }}</span>
                  </div>
                  <div class="volume-progress">
                    <div class="progress-bar gold">
                      <div class="progress-fill pulse" :style="{ width: volumeProgressPercent + '%' }"></div>
                    </div>
                    <span class="progress-percentage">{{ volumeProgressPercent }}%</span>
                  </div>
                </div>
                
                <!-- Grille des groupes musculaires -->
                <div class="muscle-groups-grid">
                  <div class="muscle-group-item">
                    <div class="muscle-group-icon">
                      <img src="src/assets/images/muscles/pectoraux.jpg" alt="Pectoraux" class="muscle-icon-image" />
                    </div>
                    <div class="muscle-group-name">Pectoraux</div>
                    <div class="muscle-group-reps">45/50</div>
                  </div>
                  <div class="muscle-group-item">
                    <div class="muscle-group-icon">
                      <img src="src/assets/images/muscles/epaules.jpg" alt="Épaules" class="muscle-icon-image" />
                    </div>
                    <div class="muscle-group-name">Épaules</div>
                    <div class="muscle-group-reps">18/25</div>
                  </div>
                  <div class="muscle-group-item">
                    <div class="muscle-group-icon">
                      <img src="src/assets/images/muscles/quadriceps.jpg" alt="Quadriceps" class="muscle-icon-image" />
                    </div>
                    <div class="muscle-group-name">Quadriceps</div>
                    <div class="muscle-group-reps">32/40</div>
                  </div>
                  <div class="muscle-group-item">
                    <div class="muscle-group-icon">
                      <img src="src/assets/images/muscles/dos.jpg" alt="Dos" class="muscle-icon-image" />
                    </div>
                    <div class="muscle-group-name">Dos</div>
                    <div class="muscle-group-reps">28/35</div>
                  </div>
                  <div class="muscle-group-item">
                    <div class="muscle-group-icon">
                      <img src="src/assets/images/muscles/mollets.jpg" alt="Mollets" class="muscle-icon-image" />
                    </div>
                    <div class="muscle-group-name">Mollets</div>
                    <div class="muscle-group-reps">15/20</div>
                  </div>
                  <div class="muscle-group-item">
                    <div class="muscle-group-icon">
                      <img src="src/assets/images/muscles/abdos.jpg" alt="Abdos" class="muscle-icon-image" />
                    </div>
                    <div class="muscle-group-name">Abdos</div>
                    <div class="muscle-group-reps">25/30</div>
                  </div>
                  <div class="muscle-group-item">
                    <div class="muscle-group-icon">
                      <img src="src/assets/images/muscles/biceps.jpg" alt="Biceps" class="muscle-icon-image" />
                    </div>
                    <div class="muscle-group-name">Biceps</div>
                    <div class="muscle-group-reps">20/25</div>
                  </div>
                  <div class="muscle-group-item">
                    <div class="muscle-group-icon">
                      <img src="src/assets/images/muscles/triceps.jpg" alt="Triceps" class="muscle-icon-image" />
                    </div>
                    <div class="muscle-group-name">Triceps</div>
                    <div class="muscle-group-reps">18/22</div>
                  </div>
                  <div class="muscle-group-item">
                    <div class="muscle-group-icon">
                      <img src="src/assets/images/muscles/avant-bras.png" alt="Avant-bras" class="muscle-icon-image" />
                    </div>
                    <div class="muscle-group-name">Avant-bras</div>
                    <div class="muscle-group-reps">12/15</div>
                  </div>
                  <div class="muscle-group-item create-new-item" @click="openCreateForm">
                    <div class="muscle-group-icon">
                      <div class="plus-icon">+</div>
                    </div>
                    <div class="muscle-group-name">Nouveau</div>
                    <div class="muscle-group-reps">Muscle</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Records – célébration -> fond doré + confettis + particules -->
        <div class="records-celebration particles" v-if="weeklyRecordsStatus.hasRecords">
          <div class="celebration-header">
            <span class="sparkle">✨</span>
            <span class="title">RECORDS EXPLOSÉS CETTE SEMAINE !</span>
            <span class="sparkle">✨</span>
          </div>
          <div class="records-grid">
            <div class="record-tile" v-for="record in weeklyDecoratedRecords" :key="record.exercise">
              <div class="record-name">
                <span class="emoji" v-if="record.exercise === 'Pompes'">🥊🔥🔥</span>
                <span class="emoji" v-else-if="record.exercise === 'Tractions'">💪⚡</span>
                <span class="emoji" v-else-if="record.exercise === 'Dips'">🔥💥</span>
                <span class="emoji" v-else>🧘‍♂️✨</span>
                <span>{{ record.exercise.toUpperCase() }}</span>
              </div>
              <div class="record-values">
                <span class="value">{{ record.current }}</span>
                <span class="delta">(+{{ record.delta }})</span>
              </div>
              <div class="record-badge">{{ record.badge }}</div>
            </div>
          </div>
        </div>
        
        <!-- Missions de la semaine - pleine largeur -->
        <div class="weekly-missions-full-width" v-if="weeklyMissions.length > 0">
          <div class="mission-header">
            <span class="icon">🎯</span>
            <span class="title">MISSIONS DE LA SEMAINE</span>
            <span class="week-indicator">{{ currentWeekRange }}</span>
          </div>
          <div class="weekly-missions-grid">
            <div class="day-column" v-for="(day, dayIndex) in weeklyMissions" :key="dayIndex">
              <div class="day-header" :class="{ 'today': day.isToday }">
                <span class="day-name">{{ day.dayName }}</span>
                <span class="day-date">{{ day.date }}</span>
              </div>
              <div class="day-missions">
                <label class="mission-item" 
                       v-for="mission in day.missions" 
                       :key="mission.id"
                       :class="{ 'completed': mission.completed }">
                  <input type="checkbox" 
                         :checked="mission.completed" 
                         @change="toggleMissionCompletion(mission.id, day.dayName)" />
                  <span class="text">{{ mission.text }}</span>
                  <span class="xp">🎖️ +{{ mission.xp }} XP</span>
                </label>
              </div>
            </div>
            
            <!-- Carte "Ajouter une mission" -->
            <div class="day-column add-mission-card" @click.stop="openAddMissionForm">
              <div class="day-header">
                <span class="day-name">NOUVEAU</span>
                <span class="day-date">MISSION</span>
              </div>
              <div class="day-missions">
                <div class="add-mission-item">
                  <div class="add-icon">➕</div>
                  <span class="add-text">Ajouter une mission</span>
                </div>
              </div>
            </div>
          </div>
          <div class="mission-reward">Récompense finale: 🔥 WEEKLY CHAMPION</div>
        </div>
        
        <!-- Live Performance - conteneur avec bordure néon -->
        <div class="live-performance-container">
          <div class="live-performance-header">
            <span class="performance-icon">⚡</span>
            <span class="performance-title">LIVE PERFORMANCE</span>
          </div>
          
          <div class="exercises-grid-container">
            <div v-for="exercise in coloredProgress" 
                 :key="exercise.name" 
                 class="exercise-card-neon"
                 :class="exercise.animationClass">
              <div class="exercise-info-row">
                <div class="exercise-name-section">
                  <span class="exercise-icon">{{ exercise.icon }}</span>
                  <span class="exercise-name">{{ exercise.name }}</span>
                </div>
                <div class="exercise-value-section">
                  <span class="exercise-value">{{ exercise.displayValue }}</span>
                  <span class="status-badge" :class="exercise.badgeClass">{{ exercise.statusText }}</span>
                </div>
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar animated" :class="[exercise.barClass, exercise.animationClass]">
                  <div class="progress-fill pulse" 
                       :style="{ width: exercise.percent + '%' }"></div>
                  <div class="progress-glow" 
                       :style="{ width: exercise.percent + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        
        <!-- Bloc Performances Comparatives -->
        <div class="comparative-performance-block">
          <div class="comparison-header">
            <div class="comparison-title-container">
              <span class="comparison-icon">⚖️</span>
              <span class="comparison-title">PERFORMANCES VS HIER</span>
            </div>
            <div class="comparison-badge" :class="overallComparisonClass">
              {{ overallComparisonText }}
            </div>
          </div>
          
          <!-- Métriques générales de session -->
          <div class="comparison-section">
            <div class="section-title">
              <span class="section-icon">📋</span>
              <span class="section-text">MÉTRIQUES GÉNÉRALES</span>
            </div>
            <div class="comparison-metrics-grid">
              <div class="comparison-item" :class="volumeComparison.class">
                <div class="metric-info">
                  <span class="metric-icon">📊</span>
                  <span class="metric-name">Volume Total</span>
                </div>
                <div class="metric-comparison">
                  <span class="metric-change" :class="volumeComparison.changeClass">
                    {{ volumeComparison.change }}
                  </span>
                  <span class="trend-arrow">{{ volumeComparison.arrow }}</span>
                </div>
                <div class="metric-details">
                  <span class="current-value">{{ volumeComparison.current }}</span>
                  <span class="vs-separator">vs</span>
                  <span class="previous-value">{{ volumeComparison.previous }}</span>
                </div>
              </div>
              
              <div class="comparison-item" :class="intensityComparison.class">
                <div class="metric-info">
                  <span class="metric-icon">🔥</span>
                  <span class="metric-name">Intensité Moy.</span>
                </div>
                <div class="metric-comparison">
                  <span class="metric-change" :class="intensityComparison.changeClass">
                    {{ intensityComparison.change }}
                  </span>
                  <span class="trend-arrow">{{ intensityComparison.arrow }}</span>
                </div>
                <div class="metric-details">
                  <span class="current-value">{{ intensityComparison.current }}</span>
                  <span class="vs-separator">vs</span>
                  <span class="previous-value">{{ intensityComparison.previous }}</span>
                </div>
              </div>
              
              <div class="comparison-item" :class="restTimeComparison.class">
                <div class="metric-info">
                  <span class="metric-icon">⏱️</span>
                  <span class="metric-name">Temps Repos</span>
                </div>
                <div class="metric-comparison">
                  <span class="metric-change" :class="restTimeComparison.changeClass">
                    {{ restTimeComparison.change }}
                  </span>
                  <span class="trend-arrow">{{ restTimeComparison.arrow }}</span>
                </div>
                <div class="metric-details">
                  <span class="current-value">{{ restTimeComparison.current }}</span>
                  <span class="vs-separator">vs</span>
                  <span class="previous-value">{{ restTimeComparison.previous }}</span>
                </div>
              </div>
              
              <div class="comparison-item" :class="durationComparison.class">
                <div class="metric-info">
                  <span class="metric-icon">⏰</span>
                  <span class="metric-name">Durée Session</span>
                </div>
                <div class="metric-comparison">
                  <span class="metric-change" :class="durationComparison.changeClass">
                    {{ durationComparison.change }}
                  </span>
                  <span class="trend-arrow">{{ durationComparison.arrow }}</span>
                </div>
                <div class="metric-details">
                  <span class="current-value">{{ durationComparison.current }}</span>
                  <span class="vs-separator">vs</span>
                  <span class="previous-value">{{ durationComparison.previous }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Comparaisons par exercice -->
          <div class="comparison-section">
            <div class="section-title">
              <span class="section-icon">🏋️</span>
              <span class="section-text">EXERCICES INDIVIDUELS</span>
            </div>
            <div class="comparison-metrics-grid">
              <div v-for="exercise in exerciseComparisons" :key="exercise.name"
                   class="comparison-item" :class="exercise.class">
                <div class="metric-info">
                  <span class="metric-icon">{{ exercise.icon }}</span>
                  <span class="metric-name">{{ exercise.name }}</span>
                </div>
                <div class="metric-comparison">
                  <span class="metric-change" :class="exercise.changeClass">
                    {{ exercise.change }}
                  </span>
                  <span class="trend-arrow">{{ exercise.arrow }}</span>
                </div>
                <div class="metric-details">
                  <span class="current-value">{{ exercise.current }}</span>
                  <span class="vs-separator">vs</span>
                  <span class="previous-value">{{ exercise.previous }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Résumé de la comparaison -->
          <div class="comparison-summary">
            <div class="summary-icon" :class="overallComparisonClass">
              {{ overallComparisonIcon }}
            </div>
            <div class="summary-text">
              <span class="summary-main">{{ comparisonSummaryText }}</span>
              <span class="summary-hint">{{ comparisonHint }}</span>
            </div>
          </div>
        </div>
        
        <!-- Bloc Récompenses & Achievements -->
        <div class="achievements-rewards-block">
          <div class="achievements-header">
            <div class="achievements-title-container">
              <span class="achievements-icon">🏆</span>
              <span class="achievements-title">ACCOMPLISSEMENTS AUJOURD'HUI</span>
            </div>
            <div class="achievements-badge" :class="achievementsBadgeClass">
              {{ achievementsBadgeText }}
            </div>
          </div>
          
          <div class="achievements-grid">
            <div v-for="achievement in todayAchievements" :key="achievement.id"
                 class="achievement-item" :class="achievement.type">
              <div class="achievement-icon-container">
                <span class="achievement-icon">{{ achievement.icon }}</span>
                <div v-if="achievement.isNew" class="new-badge">NEW!</div>
              </div>
              <div class="achievement-content">
                <div class="achievement-title">{{ achievement.title }}</div>
                <div class="achievement-description">{{ achievement.description }}</div>
                <div class="achievement-reward">
                  <span class="reward-icon">💎</span>
                  <span class="reward-text">{{ achievement.reward }}</span>
                </div>
              </div>
              <div class="achievement-status" :class="achievement.statusClass">
                {{ achievement.status }}
              </div>
            </div>
          </div>
          
          <!-- Stats des récompenses -->
          <div class="rewards-summary">
            <div class="reward-stat">
              <span class="stat-icon">⭐</span>
              <span class="stat-label">XP Bonus</span>
              <span class="stat-value">+{{ totalBonusXP }}</span>
            </div>
            <div class="reward-stat">
              <span class="stat-icon">🔥</span>
              <span class="stat-label">Streak</span>
              <span class="stat-value">{{ currentStreak }} jours</span>
            </div>
            <div class="reward-stat">
              <span class="stat-icon">🎯</span>
              <span class="stat-label">Objectifs</span>
              <span class="stat-value">{{ completedGoals }}/{{ totalGoals }}</span>
            </div>
          </div>
        </div>
        
        <!-- Bloc Recommandations IA -->
        <div class="ai-recommendations-block">
          <div class="ai-header">
            <div class="ai-title-container">
              <span class="ai-icon">🤖</span>
              <span class="ai-title">RECOMMANDATIONS IA</span>
            </div>
            <div class="ai-confidence-badge">
              <span class="confidence-icon">🎯</span>
              <span class="confidence-text">{{ aiConfidence }}% fiabilité</span>
            </div>
          </div>
          
          <div class="recommendations-list">
            <div v-for="recommendation in aiRecommendations" :key="recommendation.id"
                 class="recommendation-item" :class="recommendation.priority"
                 :data-rec-id="recommendation.id">
              
              <!-- Layout réorganisé avec icône à gauche et contenu au centre -->
              <div class="recommendation-layout">
                <!-- Icône principale à gauche avec bouton en dessous -->
                <div class="rec-icon-container" :class="recommendation.priority">
                  <span class="rec-main-icon">{{ recommendation.icon }}</span>
                  <div class="rec-priority-badge" :class="recommendation.priority">
                    {{ recommendation.priorityText }}
                  </div>
                  <!-- Bouton repositionné sous l'icône -->
                  <button class="rec-btn-emoji" @click.stop="refreshRecommendation(recommendation)"
                          title="Autre conseil">
                    🔄
                  </button>
                </div>
                
                <!-- Contenu principal au centre -->
                <div class="recommendation-main-content">
                  <div class="rec-title">{{ recommendation.title }}</div>
                  <div class="rec-category-tag">{{ recommendation.category }}</div>
                  
                  <div class="rec-description">{{ recommendation.description }}</div>
                  
                  <div class="rec-impact-inline">
                    <span class="impact-label">Impact:</span>
                    <span class="impact-value" :class="recommendation.impactClass">
                      {{ recommendation.impact }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Résumé IA -->
          <div class="ai-summary">
            <div class="ai-summary-icon">🧠</div>
            <div class="ai-summary-content">
              <div class="ai-summary-title">Analyse IA Personnalisée</div>
              <div class="ai-summary-text">{{ aiSummaryText }}</div>
              <div class="ai-next-focus">
                <span class="focus-label">Focus demain:</span>
                <span class="focus-recommendation">{{ nextFocusRecommendation }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Bloc Historique Personnel -->
        <div class="personal-history-block">
          <div class="history-header">
            <div class="history-title-container">
              <div class="history-icon">📈</div>
              <h3 class="history-title">Historique Personnel</h3>
            </div>
          </div>
          
          <!-- Records Personnels -->
          <div class="personal-records">
            <h4 class="records-subtitle">🏆 Records Personnels</h4>
            <div class="records-grid">
              <div v-for="record in personalRecords" :key="record.exercise" 
                   class="record-item" :class="record.isNewRecord ? 'new-record' : ''">
                <div class="record-exercise">
                  <div class="record-icon">{{ record.icon }}</div>
                  <span class="record-name">{{ record.exercise }}</span>
                </div>
                <div class="record-details">
                  <div class="record-value">{{ record.value }} {{ record.unit }}</div>
                  <div class="record-date">{{ record.date }}</div>
                  <div v-if="record.isNewRecord" class="new-record-badge">NOUVEAU!</div>
                </div>
              </div>
            </div>
            </div>
            
            <!-- Bloc Historique Personnel -->
            <div class="personal-history-block">
              <!-- Header avec sélecteur de période -->
              <div class="history-header">
                <div class="history-title-container">
                  <span class="history-icon">📈</span>
                  <h3 class="history-title">Historique Personnel</h3>
                </div>
                <div class="history-period-selector">
                </div>
              </div>

              <!-- Records personnels -->
              <div class="personal-records">
                <h4 class="records-subtitle">🏆 Records Personnels</h4>
                <div class="records-grid">
                  <div 
                    v-for="record in personalRecords" 
                    :key="record.exercise"
                    class="record-item"
                    :class="{ 'new-record': record.isNewRecord }"
                  >
                    <div class="record-exercise">
                      <div class="record-icon">{{ record.icon }}</div>
                      <div class="record-name" :class="{ 'long-name': record.exercise.includes('Australiennes') }">
                        {{ record.exercise }}
                      </div>
                    </div>
                    <div class="record-details">
                      <div class="record-value">{{ record.value }} {{ record.unit }}</div>
                      <div class="record-date">{{ record.date }}</div>
                      <div v-if="record.isNewRecord" class="new-record-badge">NEW!</div>
                    </div>
                  </div>
                </div>
              </div>

              
              <!-- Tooltip pour les graphiques -->
              <div 
                class="graph-tooltip" 
                :style="{ 
                  left: tooltip.x + 'px', 
                  top: tooltip.y + 'px',
                  display: tooltip.visible ? 'block' : 'none'
                }"
              >
                {{ tooltip.text }}
              </div>
            
            <!-- Statistiques d'évolution -->
          <div class="evolution-stats">
            <h4 class="stats-subtitle">📈 Tendances</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-icon">🔥</div>
                <div class="stat-content">
                  <div class="stat-label">Meilleure série</div>
                  <div class="stat-value">{{ bestStreak.value }} jours</div>
                  <div class="stat-date">{{ bestStreak.period }}</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon">📈</div>
                <div class="stat-content">
                  <div class="stat-label">Progression</div>
                  <div class="stat-value" :class="overallProgress.class">{{ overallProgress.value }}%</div>
                  <div class="stat-date">vs période précédente</div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon">🎯</div>
                <div class="stat-content">
                  <div class="stat-label">Consistance</div>
                  <div class="stat-value">{{ consistency.value }}%</div>
                  <div class="stat-date">{{ consistency.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Actions rapides - centrées et améliorées -->
        <div class="performance-actions-improved">
          <button class="action-btn primary-improved" @click.stop="addQuickSession">
            <span class="btn-icon">🚀</span>
            <span class="btn-text">SESSION TURBO</span>
            <span class="btn-sub">Let's crush it !</span>
          </button>
          
          <button class="action-btn secondary-improved" @click.stop="viewDetailedStats">
            <span class="btn-icon">📊</span>
            <span class="btn-text">MES EXPLOITS</span>
            <span class="btn-sub">Hall of Fame</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Formulaire de création avec fond noir -->
    <div v-if="showCreateForm" class="create-form-overlay" @click="closeCreateForm">
      <div class="create-form-container" @click.stop>
        <div class="create-form-header">
          <h3>Créer un nouveau muscle/exercice</h3>
          <button class="close-btn" @click="closeCreateForm">×</button>
        </div>
        <div class="create-form-content">
          <div class="form-group">
            <label>Nom du muscle/exercice</label>
            <input type="text" v-model="newMuscle.name" placeholder="Ex: Pectoraux, Squats..." />
          </div>
          <div class="form-group">
            <label>Objectif (répétitions)</label>
            <input type="number" v-model="newMuscle.target" placeholder="Ex: 50" />
          </div>
          <div class="form-group">
            <label>Actuel (répétitions)</label>
            <input type="number" v-model="newMuscle.current" placeholder="Ex: 0" />
          </div>
          <div class="form-group">
            <label>Image du muscle</label>
            <div class="image-upload-container">
              <input 
                type="file" 
                ref="imageInput" 
                @change="handleImageUpload" 
                accept=".png,.jpg,.jpeg" 
                style="display: none;"
              />
              <div class="image-upload-area" @click="$refs.imageInput.click()">
                <div v-if="!newMuscle.imagePreview" class="upload-placeholder">
                  <span class="upload-icon">📁</span>
                  <span class="upload-text">Cliquer pour uploader une image PNG</span>
                </div>
                <div v-else class="image-preview">
                  <img :src="newMuscle.imagePreview" alt="Preview" />
                  <button type="button" class="remove-image" @click.stop="removeImage">×</button>
                </div>
              </div>
            </div>
          </div>
          <div class="form-actions">
            <button class="cancel-btn" @click="closeCreateForm">Annuler</button>
            <button class="create-btn" @click="createNewMuscle">Créer</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Formulaire d'ajout de mission -->
    <div v-if="showAddMissionForm" class="add-mission-overlay" @click="closeAddMissionForm">
      <div class="add-mission-container" @click.stop>
        <div class="add-mission-header">
          <h3>Ajouter une nouvelle mission</h3>
          <button class="close-btn" @click="closeAddMissionForm">×</button>
        </div>
        <div class="add-mission-content">
          <div class="form-group">
            <label>Nom de la mission</label>
            <input type="text" v-model="newMission.name" placeholder="Ex: Pompes, Cardio, Étirements..." />
          </div>
          <div class="form-group">
            <label>Bénéfice</label>
            <input type="text" v-model="newMission.benefit" placeholder="Ex: +Force, +Endurance, +Flexibilité..." />
          </div>
          <div class="form-group">
            <label>Valeur cible</label>
            <input type="number" v-model="newMission.targetValue" placeholder="Ex: 30, 15, 20..." />
          </div>
          <div class="form-group">
            <label>Unité</label>
            <select v-model="newMission.unit">
              <option value="reps">Répétitions</option>
              <option value="min">Minutes</option>
              <option value="sec">Secondes</option>
              <option value="sets">Séries</option>
              <option value="km">Kilomètres</option>
            </select>
          </div>
          <div class="form-group">
            <label>Date de la mission</label>
            <input type="date" 
                   v-model="newMission.date" 
                   :min="getTodayDate()"
                   @change="updateSelectedDate" />
            <div class="date-preview" v-if="newMission.date">
              <span class="date-info">{{ formatSelectedDate(newMission.date) }}</span>
            </div>
          </div>
          <div class="form-group">
            <label>XP accordé</label>
            <input type="number" v-model="newMission.xp" placeholder="Ex: 15, 25, 30..." />
          </div>
          <div class="form-actions">
            <button class="cancel-btn" @click="closeAddMissionForm">Annuler</button>
            <button class="create-btn" @click="addNewMission">Ajouter la mission</button>
          </div>
        </div>
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
    performanceData() {
      return this.allData?.mockData?.todayPerformance || {};
    },

    dateDisplay() {
      const now = new Date();
      const days = ['DIMANCHE','LUNDI','MARDI','MERCREDI','JEUDI','VENDREDI','SAMEDI'];
      const d = String(now.getDate()).padStart(2,'0');
      const m = String(now.getMonth()+1).padStart(2,'0');
      return `${days[now.getDay()]} ${d}/${m}`;
    },

    modeBadge() {
      const p = this.overallPerformancePercent;
      if (p >= 90) return 'BEAST MODE';
      if (p >= 80) return 'ON FIRE';
      return 'CRUSHING IT';
    },
    modeClass() {
      const p = this.overallPerformancePercent;
      if (p >= 90) return 'beast';
      if (p >= 80) return 'fire';
      return 'crush';
    },

    activeSessionText() {
      // Mock: 47min si volume > 0
      return this.currentVolume > 0 ? '47 min' : '';
    },

    levelScore() {
      // Score simple basé sur la perf globale
      return Math.min(10, Math.max(1, Math.round(this.overallPerformancePercent / 10)));
    },

    decoratedRecords() {
      // Mock enrichi avec deltas
      const rs = this.recordsStatus.records || [];
      // Exemple fixes cohérents avec ta demande: Pompes 45 (+8), Gainage 180s (+45s)
      return rs.map(r => {
        if (r.exercise === 'Pompes') {
          return { exercise: 'Pompes', current: 45, delta: 8, badge: 'NOUVEAU RECORD !' };
        }
        if (r.exercise.toLowerCase().includes('gainage')) {
          return { exercise: 'Balance', current: '180s', delta: '45s', badge: 'PROGRESSION FOLLE !' };
        }
        return { exercise: r.exercise, current: r.value, delta: '+', badge: 'RECORD' };
      });
    },

    coloredProgress() {
      // Couleurs/barres + badges colorés selon performance et catégorie
      const getExerciseConfig = (exercise) => {
        const { name, percent, statusClass, category } = exercise;
        
        // Configuration par statut de performance
        let badgeClass, statusText;
        if (statusClass === 'excellent' && percent >= 90) {
          badgeClass = 'badge-hot';
          statusText = '🔥 EXCELLENT';
        } else if (statusClass === 'good' && percent >= 80) {
          badgeClass = 'badge-fast';
          statusText = '⚡ SUPER';
        } else if (statusClass === 'average' && percent >= 70) {
          badgeClass = 'badge-warn';
          statusText = '⚠️ À POUSSER';
        } else {
          badgeClass = 'badge-info';
          statusText = '💪 ALLEZ-Y';
        }
        
        // Couleurs de barres selon catégorie d'exercice
        let barClass;
        switch (category) {
          case 'push': // Exercices de poussée
            barClass = percent >= 85 ? 'bar-red' : 'bar-orange';
            break;
          case 'pull': // Exercices de traction
            barClass = percent >= 85 ? 'bar-blue' : 'bar-cyan';
            break;
          case 'core': // Exercices de gainage/core
            barClass = percent >= 85 ? 'bar-green' : 'bar-lime';
            break;
          case 'arms': // Exercices spécifiques bras
            barClass = percent >= 85 ? 'bar-purple' : 'bar-pink';
            break;
          case 'legs': // Exercices de jambes
            barClass = percent >= 85 ? 'bar-yellow' : 'bar-amber';
            break;
          case 'balance': // Exercices d'équilibre
            barClass = percent >= 85 ? 'bar-indigo' : 'bar-violet';
            break;
          default:
            barClass = 'bar-cyan';
        }
        
        return { barClass, badgeClass, statusText };
      };
      
      return (this.exerciseProgress || []).map(e => {
        const config = getExerciseConfig(e);
        const displayValue = e.unit === 'sec'
          ? `${Math.floor(e.current/60)}:${String(e.current%60).padStart(2,'0')}/${Math.floor(e.target/60)}${e.target%60?':'+String(e.target%60).padStart(2,'0'):''}`
          : `${e.current}/${e.target}`;
        
        return { 
          ...e, 
          ...config, 
          displayValue,
          // Ajout d'une classe d'animation selon la performance
          animationClass: e.percent >= 90 ? 'pulse-strong' : e.percent >= 80 ? 'pulse-medium' : ''
        };
      });
    },
    
    // Métriques de volume
    currentVolume() {
      return this.performanceData.currentVolume || 0;
    },
    
    targetVolume() {
      return this.performanceData.targetVolume || 200;
    },
    
    volumeUnit() {
      return this.performanceData.volumeUnit || 'reps';
    },
    
    volumeProgressPercent() {
      return Math.min(Math.round((this.currentVolume / this.targetVolume) * 100), 100);
    },
    
    volumeProgressClass() {
      if (this.volumeProgressPercent >= 100) return 'completed';
      if (this.volumeProgressPercent >= 75) return 'good';
      if (this.volumeProgressPercent >= 50) return 'average';
      return 'low';
    },
    
    // Métriques de variété
    currentVariety() {
      return this.performanceData.currentVariety || 0;
    },
    
    targetVariety() {
      return this.performanceData.targetVariety || 6;
    },
    
    varietyProgressPercent() {
      return Math.min(Math.round((this.currentVariety / this.targetVariety) * 100), 100);
    },
    
    varietyProgressClass() {
      if (this.varietyProgressPercent >= 100) return 'completed';
      if (this.varietyProgressPercent >= 75) return 'good';
      if (this.varietyProgressPercent >= 50) return 'average';
      return 'low';
    },
    
    // Intensité
    intensityLevel() {
      return this.performanceData.intensityLevel || 'Modérée';
    },
    
    intensityDescription() {
      const descriptions = {
        'Faible': 'Échauffement ou récupération',
        'Modérée': 'Rythme d\'entraînement standard',
        'Élevée': 'Effort intense, proche des records',
        'Maximale': 'Performance exceptionnelle'
      };
      return descriptions[this.intensityLevel] || 'Niveau d\'effort actuel';
    },
    
    intensityClass() {
      const classes = {
        'Faible': 'low',
        'Modérée': 'moderate',
        'Élevée': 'high',
        'Maximale': 'maximum'
      };
      return classes[this.intensityLevel] || 'moderate';
    },
    
    // Performance globale
    overallPerformancePercent() {
      return Math.round((this.volumeProgressPercent + this.varietyProgressPercent) / 2);
    },
    
    performanceClass() {
      if (this.overallPerformancePercent >= 90) return 'excellent';
      if (this.overallPerformancePercent >= 75) return 'good';
      if (this.overallPerformancePercent >= 50) return 'average';
      return 'low';
    },
    
    performanceStatusText() {
      switch (this.performanceClass) {
        case 'excellent': return 'EXCELLENT';
        case 'good': return 'BIEN';
        case 'average': return 'MOYEN';
        case 'low': return 'FAIBLE';
        default: return 'EN COURS';
      }
    },
    
    // Records
    recordsStatus() {
      const records = this.performanceData.records || [];
      return {
        hasRecords: records.length > 0,
        count: records.length,
        records: records
      };
    },
    
    // Records hebdomadaires
    weeklyRecordsStatus() {
      const weeklyRecords = this.getWeeklyRecords();
      return {
        hasRecords: weeklyRecords.length > 0,
        count: weeklyRecords.length,
        records: weeklyRecords
      };
    },
    
    weeklyDecoratedRecords() {
      const weeklyRecords = this.getWeeklyRecords();
      return weeklyRecords.map(r => {
        if (r.exercise === 'Pompes') {
          return { exercise: 'Pompes', current: 45, delta: 8, badge: 'NOUVEAU RECORD !' };
        }
        if (r.exercise === 'Tractions') {
          return { exercise: 'Tractions', current: 22, delta: 5, badge: 'EXPLOSION !' };
        }
        if (r.exercise === 'Dips') {
          return { exercise: 'Dips', current: 18, delta: 3, badge: 'PROGRESSION FOLLE !' };
        }
        if (r.exercise.toLowerCase().includes('gainage')) {
          return { exercise: 'Balance', current: '180s', delta: '45s', badge: 'PROGRESSION FOLLE !' };
        }
        return { exercise: r.exercise, current: r.value, delta: '+', badge: 'RECORD' };
      });
    },
    
    // Missions hebdomadaires
    weeklyMissions() {
      return this.getWeeklyMissions();
    },
    
    currentWeekRange() {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lundi
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Dimanche
      
      const formatDate = (date) => {
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        return `${d}/${m}`;
      };
      
      return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
    },

    // Données pour le graphique de progression
    chartDays() {
      const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      const fullDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
      const today = new Date().getDay(); // 0 = Dimanche, 1 = Lundi, etc.
      
      return Array.from({ length: 7 }, (_, index) => {
        const dayIndex = (today - 6 + index) % 7;
        const adjustedIndex = dayIndex < 0 ? dayIndex + 7 : dayIndex;
        return {
          shortName: days[adjustedIndex],
          fullName: fullDays[adjustedIndex],
          isToday: index === 6
        };
      });
    },

    chartData() {
      return [
        { volume: 85, intensity: 78, records: 2 }, // Lun
        { volume: 92, intensity: 85, records: 1 }, // Mar  
        { volume: 67, intensity: 72, records: 0 }, // Mer
        { volume: 88, intensity: 80, records: 3 }, // Jeu
        { volume: 95, intensity: 88, records: 2 }, // Ven
        { volume: 73, intensity: 75, records: 1 }, // Sam
        { volume: 90, intensity: 82, records: 1 }  // Dim (aujourd'hui)
      ];
    },

    chartPoints() {
      return this.chartData.map((data, index) => {
        const x = 80 + (index * 80); // 7 points sur 480px (560-80)
        const y = 300 - (data.volume * 2.8); // Échelle 0-100 -> 280px
        return { x, y, ...data, dayIndex: index };
      });
    },

    chartLinePath() {
      const points = this.chartPoints;
      if (points.length < 2) return '';
      
      let path = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prevPoint = points[i - 1];
        const currPoint = points[i];
        const cp1x = prevPoint.x + (currPoint.x - prevPoint.x) / 3;
        const cp1y = prevPoint.y;
        const cp2x = currPoint.x - (currPoint.x - prevPoint.x) / 3;
        const cp2y = currPoint.y;
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${currPoint.x} ${currPoint.y}`;
      }
      return path;
    },

    chartAreaPath() {
      const curve = this.chartLinePath;
      const firstPoint = this.chartPoints[0];
      const lastPoint = this.chartPoints[this.chartPoints.length - 1];
      return `${curve} L ${lastPoint.x} 300 L ${firstPoint.x} 300 Z`;
    },

    chartStats() {
      const data = this.chartData;
      const average = Math.round(data.reduce((sum, day) => sum + day.volume, 0) / data.length);
      const trend = data[data.length - 1].volume - data[data.length - 2].volume;
      const bestDayIndex = data.findIndex(day => day.volume === Math.max(...data.map(d => d.volume)));
      const bestDay = this.chartDays[bestDayIndex].shortName;
      const recordsBeaten = data.reduce((sum, day) => sum + day.records, 0);
      
      return {
        average,
        trend: trend > 0 ? `+${trend}%` : `${trend}%`,
        trendClass: trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'neutral',
        bestDay,
        recordsBeaten
      };
    },

    // Suggestions
    suggestions() {
      return this.performanceData.suggestions || [];
    },
    
    // Records personnels générés dynamiquement depuis Live Performance
    personalRecords() {
      const exerciseProgress = this.exerciseProgress || [];
      const today = new Date();
      
      
      const records = exerciseProgress.map(exercise => {
        // Récupérer le record stocké ou utiliser la valeur actuelle
        const storedRecords = JSON.parse(localStorage.getItem('personal-records') || '{}');
        const storedRecord = storedRecords[exercise.name] || 0;
        const currentValue = exercise.current || 0;
        const recordValue = Math.max(storedRecord, currentValue);
        
        // Déterminer si c'est un nouveau record
        const isNewRecord = currentValue > storedRecord && storedRecord > 0;
        
        // Calculer une date de record réaliste (dans les 30 derniers jours)
        const daysAgo = Math.floor(Math.random() * 30);
        const recordDate = new Date(today);
        recordDate.setDate(recordDate.getDate() - daysAgo);
        
        // Obtenir l'icône pour l'exercice
        const iconMap = {
          'Pompes': '💪',
          'Pompes Inclinées': '📈',
          'Pompes Déclinées': '📉',
          'Tractions': '🏋️',
          'Dips': '🔥',
          'Gainage': '⏱️',
          'Squats': '🦵',
          'Burpees': '💥',
          'Mountain Climbers': '⛰️',
          'Jumping Jacks': '🤸',
          'Planche': '🧘',
          'Fentes': '🚶'
        };
        const exerciseIcon = iconMap[exercise.name] || '🏃';
        
        return {
          exercise: exercise.name,
          icon: exercise.icon || exerciseIcon,
          value: recordValue,
          unit: exercise.unit === 'sec' ? 'sec' : 'reps',
          date: recordDate.toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          }),
          isNewRecord: isNewRecord,
          current: currentValue,
          target: exercise.target || 0
        };
      });
      
      return records;
    },
    
    // Progression par exercice
    exerciseProgress() {
      // Filtrer pour ne garder que les exercices demandés EXACTEMENT
      const allowedExercises = [
        'Pompes', 
        'Pompes Inclinées', 
        'Pompes Déclinées', 
        'Tractions', 
        'Tractions Australiennes', 
        'Dips aux Parallèles', 
        'Dips Chaise',
        'Curl Supination', 
        'Curl Pronation', 
        'Curl Unilatéral',
        'Relevés de Genoux', 
        'Étirements',
        'Gainage' // Pour "gainage planche"
      ];
      
      const allExercises = this.performanceData.exerciseProgress || [];
      return allExercises.filter(exercise => {
        const exerciseName = exercise.name;
        // Correspondance exacte uniquement
        return allowedExercises.includes(exerciseName);
      });
    },

    // ================ COMPARAISONS PERFORMANCES ================
    
    volumeComparison() {
      const current = this.todayPerformance.volume;
      const previous = this.yesterdayPerformance.volume;
      const change = Math.round(((current - previous) / previous) * 100);
      const changeText = change > 0 ? `+${change}%` : `${change}%`;
      
      return {
        current: `${current} reps`,
        previous: `${previous} reps`,
        change: changeText,
        changeClass: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
        arrow: change > 0 ? '↗️' : change < 0 ? '↘️' : '→',
        class: change > 0 ? 'improvement' : change < 0 ? 'decline' : 'stable'
      };
    },

    intensityComparison() {
      const current = this.todayPerformance.intensity;
      const previous = this.yesterdayPerformance.intensity;
      const change = current - previous;
      const changeText = change > 0 ? `+${change}%` : `${change}%`;
      
      return {
        current: `${current}%`,
        previous: `${previous}%`,
        change: changeText,
        changeClass: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
        arrow: change > 0 ? '↗️' : change < 0 ? '↘️' : '→',
        class: change > 0 ? 'improvement' : change < 0 ? 'decline' : 'stable'
      };
    },

    restTimeComparison() {
      const current = this.todayPerformance.restTime;
      const previous = this.yesterdayPerformance.restTime;
      const change = Math.round(((current - previous) / previous) * 100);
      const changeText = change > 0 ? `+${change}%` : `${change}%`;
      
      return {
        current: `${current}s`,
        previous: `${previous}s`,
        change: changeText,
        changeClass: change < 0 ? 'positive' : change > 0 ? 'negative' : 'neutral', // Moins de repos = mieux
        arrow: change > 0 ? '↗️' : change < 0 ? '↘️' : '→',
        class: change < 0 ? 'improvement' : change > 0 ? 'decline' : 'stable'
      };
    },

    durationComparison() {
      const current = this.todayPerformance.duration;
      const previous = this.yesterdayPerformance.duration;
      const change = Math.round(((current - previous) / previous) * 100);
      const changeText = change > 0 ? `+${change}%` : `${change}%`;
      
      return {
        current: `${current}min`,
        previous: `${previous}min`,
        change: changeText,
        changeClass: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
        arrow: change > 0 ? '↗️' : change < 0 ? '↘️' : '→',
        class: change > 0 ? 'improvement' : change < 0 ? 'decline' : 'stable'
      };
    },

    overallComparisonClass() {
      const improvements = [
        this.volumeComparison.class === 'improvement',
        this.intensityComparison.class === 'improvement',
        this.restTimeComparison.class === 'improvement',
        this.durationComparison.class === 'improvement'
      ].filter(Boolean).length;

      if (improvements >= 3) return 'excellent';
      if (improvements >= 2) return 'good';
      if (improvements >= 1) return 'average';
      return 'needs-work';
    },

    overallComparisonText() {
      const className = this.overallComparisonClass;
      const badges = {
        'excellent': '🔥 PERFORMANCE EXCEPTIONNELLE',
        'good': '⚡ BELLE PROGRESSION',
        'average': '📈 EN PROGRÈS',
        'needs-work': '💪 À AMÉLIORER'
      };
      return badges[className] || '📊 ANALYSE';
    },

    overallComparisonIcon() {
      const className = this.overallComparisonClass;
      const icons = {
        'excellent': '🏆',
        'good': '🎯',
        'average': '📈',
        'needs-work': '💪'
      };
      return icons[className] || '📊';
    },

    comparisonSummaryText() {
      const className = this.overallComparisonClass;
      const texts = {
        'excellent': 'Tu écrases tout ! Continue sur cette lancée',
        'good': 'Solide progression, tu es sur la bonne voie',
        'average': 'Quelques améliorations, mais ça progresse',
        'needs-work': 'Allez, on peut faire mieux demain !'
      };
      return texts[className] || 'Analyse en cours...';
    },

    comparisonHint() {
      const className = this.overallComparisonClass;
      const hints = {
        'excellent': 'Maintiens ce rythme pour des résultats extraordinaires',
        'good': 'Focus sur l\'intensité pour passer au niveau supérieur',
        'average': 'Travaille la régularité pour des gains constants',
        'needs-work': 'Petit ajustement et tu vas exploser tes limites'
      };
      return hints[className] || '';
    },

    // ================ ACCOMPLISSEMENTS & RÉCOMPENSES ================
    
    achievementsBadgeClass() {
      const completedCount = this.todayAchievements.filter(a => a.statusClass === 'completed').length;
      const totalCount = this.todayAchievements.length;
      const percentage = (completedCount / totalCount) * 100;
      
      if (percentage >= 80) return 'excellent';
      if (percentage >= 60) return 'good';
      if (percentage >= 40) return 'average';
      return 'needs-work';
    },

    achievementsBadgeText() {
      const className = this.achievementsBadgeClass;
      const badges = {
        'excellent': '🔥 JOURNÉE LÉGENDAIRE',
        'good': '⭐ BELLE JOURNÉE',
        'average': '📈 JOUR PRODUCTIF',
        'needs-work': '💪 EN PROGRESSION'
      };
      return badges[className] || '📊 ANALYSE';
    },

    totalBonusXP() {
      return this.todayAchievements
        .filter(a => a.statusClass === 'completed')
        .reduce((total, achievement) => {
          const xp = parseInt(achievement.reward.replace(/[^\d]/g, '')) || 0;
          return total + xp;
        }, 0);
    },

    currentStreak() {
      const streakAchievement = this.todayAchievements.find(a => a.type === 'streak');
      return streakAchievement ? 12 : 0; // Valeur par défaut
    },

    completedGoals() {
      return this.todayAchievements.filter(a => a.type === 'goal' && a.statusClass === 'completed').length;
    },

    totalGoals() {
      return this.todayAchievements.filter(a => a.type === 'goal').length + 2; // +2 pour d'autres objectifs
    },

    // ================ RECOMMANDATIONS IA ================
    
    aiConfidence() {
      // Calculer la confiance basée sur les données disponibles
      const dataQuality = this.todayPerformance.exercises ? 95 : 75;
      return dataQuality;
    },

    aiSummaryText() {
      const improvements = this.exerciseComparisons.filter(e => e.class === 'improvement').length;
      const declines = this.exerciseComparisons.filter(e => e.class === 'decline').length;
      
      if (improvements > declines) {
        return 'Excellente session ! Tes performances montrent une progression solide. Continue sur cette lancée.';
      } else if (declines > improvements) {
        return 'Session mitigée. Quelques ajustements te permettront de retrouver ton niveau optimal.';
      } else {
        return 'Session équilibrée. Bon maintien de tes performances avec quelques axes d\'amélioration.';
      }
    },

    nextFocusRecommendation() {
      const declinedExercises = this.exerciseComparisons.filter(e => e.class === 'decline');
      
      if (declinedExercises.length > 0) {
        const exercise = declinedExercises[0].name.toLowerCase();
        return `Travailler les ${exercise} pour retrouver le niveau d'hier`;
      }
      
      const bestExercise = this.exerciseComparisons
        .filter(e => e.class === 'improvement')
        .sort((a, b) => {
          const aChange = parseInt(a.change.replace(/[^\d]/g, '')) || 0;
          const bChange = parseInt(b.change.replace(/[^\d]/g, '')) || 0;
          return bChange - aChange;
        })[0];
      
      if (bestExercise) {
        return `Capitaliser sur les ${bestExercise.name.toLowerCase()} qui progressent bien`;
      }
      
      return 'Maintenir la régularité et l\'intensité';
    },

    // ================ COMPARAISONS PAR EXERCICE ================
    
    exerciseComparisons() {
      const exercises = this.todayPerformance.exercises;
      const comparisons = [];
      
      // Pompes
      if (exercises.pompes) {
        const current = exercises.pompes.current;
        const previous = exercises.pompes.previous;
        const change = Math.round(((current - previous) / previous) * 100);
        comparisons.push({
          name: 'Pompes',
          icon: '💪',
          current: `${current} reps`,
          previous: `${previous} reps`,
          change: change > 0 ? `+${change}%` : `${change}%`,
          changeClass: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
          arrow: change > 0 ? '↗️' : change < 0 ? '↘️' : '→',
          class: change > 0 ? 'improvement' : change < 0 ? 'decline' : 'stable'
        });
      }
      
      // Tractions
      if (exercises.tractions) {
        const current = exercises.tractions.current;
        const previous = exercises.tractions.previous;
        const change = Math.round(((current - previous) / previous) * 100);
        comparisons.push({
          name: 'Tractions',
          icon: '🏋️',
          current: `${current} reps`,
          previous: `${previous} reps`,
          change: change > 0 ? `+${change}%` : `${change}%`,
          changeClass: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
          arrow: change > 0 ? '↗️' : change < 0 ? '↘️' : '→',
          class: change > 0 ? 'improvement' : change < 0 ? 'decline' : 'stable'
        });
      }
      
      // Dips
      if (exercises.dips) {
        const current = exercises.dips.current;
        const previous = exercises.dips.previous;
        const change = Math.round(((current - previous) / previous) * 100);
        comparisons.push({
          name: 'Dips',
          icon: '🔥',
          current: `${current} reps`,
          previous: `${previous} reps`,
          change: change > 0 ? `+${change}%` : `${change}%`,
          changeClass: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
          arrow: change > 0 ? '↗️' : change < 0 ? '↘️' : '→',
          class: change > 0 ? 'improvement' : change < 0 ? 'decline' : 'stable'
        });
      }
      
      // Gainage
      if (exercises.gainage) {
        const current = exercises.gainage.current;
        const previous = exercises.gainage.previous;
        const change = Math.round(((current - previous) / previous) * 100);
        comparisons.push({
          name: 'Gainage',
          icon: '⚖️',
          current: `${current}s`,
          previous: `${previous}s`,
          change: change > 0 ? `+${change}%` : `${change}%`,
          changeClass: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
          arrow: change > 0 ? '↗️' : change < 0 ? '↘️' : '→',
          class: change > 0 ? 'improvement' : change < 0 ? 'decline' : 'stable'
        });
      }
      
      // Squats
      if (exercises.squats) {
        const current = exercises.squats.current;
        const previous = exercises.squats.previous;
        const change = Math.round(((current - previous) / previous) * 100);
        comparisons.push({
          name: 'Squats',
          icon: '🦵',
          current: `${current} reps`,
          previous: `${previous} reps`,
          change: change > 0 ? `+${change}%` : `${change}%`,
          changeClass: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
          arrow: change > 0 ? '↗️' : change < 0 ? '↘️' : '→',
          class: change > 0 ? 'improvement' : change < 0 ? 'decline' : 'stable'
        });
      }
      
      // Curls
      if (exercises.curls) {
        const current = exercises.curls.current;
        const previous = exercises.curls.previous;
        const change = Math.round(((current - previous) / previous) * 100);
        comparisons.push({
          name: 'Curls',
          icon: '💪',
          current: `${current} reps`,
          previous: `${previous} reps`,
          change: change > 0 ? `+${change}%` : `${change}%`,
          changeClass: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
          arrow: change > 0 ? '↗️' : change < 0 ? '↘️' : '→',
          class: change > 0 ? 'improvement' : change < 0 ? 'decline' : 'stable'
        });
      }
      
      // Étirements
      if (exercises.etirements) {
        const current = exercises.etirements.current;
        const previous = exercises.etirements.previous;
        const change = Math.round(((current - previous) / previous) * 100);
        comparisons.push({
          name: 'Étirements',
          icon: '🧘',
          current: `${current}min`,
          previous: `${previous}min`,
          change: change > 0 ? `+${change}%` : `${change}%`,
          changeClass: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
          arrow: change > 0 ? '↗️' : change < 0 ? '↘️' : '→',
          class: change > 0 ? 'improvement' : change < 0 ? 'decline' : 'stable'
        });
      }
      
      return comparisons;
    }
  },
  
  methods: {
    addQuickSession() {
      
      // Émettre événement pour ouvrir modal de session rapide
      this.$emit('open-modal', {
        type: 'quick-session',
        suggestions: this.suggestions,
        callback: (sessionData) => {
          this.onQuickSessionAdded(sessionData);
        }
      });
    },
    
    onQuickSessionAdded(sessionData) {
      
      // Émettre l'événement de mise à jour
      this.$emit('update-data', {
        type: 'add-quick-session',
        sessionData: sessionData,
        timestamp: new Date()
      });
      
      // Événement global
      this.$root.$emit('quick-session-added', sessionData);
      
      // Vérifier les nouveaux records
      this.checkForNewRecords(sessionData);
      
      // Animation de mise à jour
      if (typeof this.animateProgressUpdate === 'function') {
      this.animateProgressUpdate();
      }
    },
    
    checkForNewRecords(sessionData) {
      // Vérifier si de nouveaux records ont été battus
      sessionData.exercises?.forEach(exercise => {
        const personalRecord = this.getPersonalRecord(exercise.name);
        if (exercise.value > personalRecord) {
          this.celebrateNewRecord(exercise.name, exercise.value);
        }
      });
    },
    
    getPersonalRecord(exerciseName) {
      // Récupérer le record personnel pour un exercice
      const records = JSON.parse(localStorage.getItem('personal-records') || '{}');
      return records[exerciseName] || 0;
    },
    
    celebrateNewRecord(exerciseName, newValue) {
      
      // Notification avec confettis
      if (typeof window.showNotification === 'function') {
        window.showNotification(
          `🏆 Nouveau record ${exerciseName} : ${newValue} !`,
          'success'
        );
      }
      
      // Confettis
      if (typeof window.confetti === 'function') {
        window.confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      
      // Sauvegarder le nouveau record
      const records = JSON.parse(localStorage.getItem('personal-records') || '{}');
      records[exerciseName] = newValue;
      localStorage.setItem('personal-records', JSON.stringify(records));
      
      // Événement global
      this.$root.$emit('record-broken', {
        exercise: exerciseName,
        newValue: newValue,
        date: new Date()
      });
    },
    
    applySuggestion(suggestion) {

      
      // Émettre événement pour appliquer la suggestion
      this.$emit('apply-suggestion', {
        exercise: suggestion.exercise,
        targetValue: suggestion.targetValue,
        reason: suggestion.benefit
      });
      
      // Notification
      if (typeof window.showNotification === 'function') {
        window.showNotification(
          `💡 Suggestion appliquée : ${suggestion.text}`,
          'info'
        );
      }
    },
    
    animateProgressUpdate() {
      // Animation des barres de progression
      const progressBars = this.$el.querySelectorAll('.progress-fill');
      progressBars.forEach(bar => {
        bar.classList.add('updating');
        setTimeout(() => {
          bar.classList.remove('updating');
        }, 1000);
      });
    },
    
    viewDetailedStats() {

      
      // Émettre événement pour ouvrir modal de statistiques
      this.$emit('open-modal', {
        type: 'detailed-stats',
        data: {
          performance: this.performanceData,
          records: this.recordsStatus.records,
          trends: this.calculateTrends()
        }
      });
    },
    
    calculateTrends() {
      // Calculer les tendances de performance
      return {
        volumeTrend: this.calculateVolumeTrend(),
        varietyTrend: this.calculateVarietyTrend(),
        intensityTrend: this.calculateIntensityTrend()
      };
    },
    
    calculateVolumeTrend() {
      // Comparer avec les 7 derniers jours
      const last7Days = this.performanceData.last7Days || [];
      if (last7Days.length < 2) return 0;
      
      const recent = last7Days.slice(-3).reduce((sum, day) => sum + day.volume, 0) / 3;
      const older = last7Days.slice(0, 3).reduce((sum, day) => sum + day.volume, 0) / 3;
      
      if (older === 0) return recent > 0 ? 100 : 0;
      return Math.round(((recent - older) / older) * 100);
    },
    
    calculateVarietyTrend() {
      // Tendance de variété des exercices
      const last7Days = this.performanceData.last7Days || [];
      if (last7Days.length < 2) return 0;
      
      const recentVariety = last7Days.slice(-3).reduce((sum, day) => sum + day.variety, 0) / 3;
      const olderVariety = last7Days.slice(0, 3).reduce((sum, day) => sum + day.variety, 0) / 3;
      
      if (olderVariety === 0) return recentVariety > 0 ? 100 : 0;
      return Math.round(((recentVariety - olderVariety) / olderVariety) * 100);
    },
    
    calculateIntensityTrend() {
      // Tendance d'intensité
      const intensityValues = {
        'Faible': 1,
        'Modérée': 2,
        'Élevée': 3,
        'Maximale': 4
      };
      
      const currentIntensity = intensityValues[this.intensityLevel] || 2;
      const averageIntensity = 2; // Baseline
      
      return Math.round(((currentIntensity - averageIntensity) / averageIntensity) * 100);
    },
    
    navigateToStats() {

      
      // Émettre événement de navigation
      this.$emit('navigate-to', {
        tab: 'sport',
        view: 'detailed-stats'
      });
    },

    onExerciseRecorded(exerciseData) {

      
      // Mettre à jour les métriques en temps réel
      if (typeof this.animateProgressUpdate === 'function') {
      this.animateProgressUpdate();
      }
      
      // Vérifier les records
      this.checkForNewRecords({ exercises: [exerciseData] });
    },
    
    onSessionCompleted(sessionData) {

      
      // Recalculer toutes les métriques
      this.$emit('update-data', {
        type: 'recalculate-performance',
        sessionData: sessionData,
        timestamp: new Date()
      });
    }
  },
  
  mounted() {

    
    // Animation d'entrée des barres de progression
    setTimeout(() => {
      if (typeof this.animateProgressUpdate === 'function') {
      this.animateProgressUpdate();
      } else {

      }
    }, 500);
    
      // Dessiner les graphiques historiques après le montage
      this.$nextTick(() => {
        setTimeout(() => {
          // Initialiser les records personnels

          
          
          // Appliquer la classe long-name spécifiquement pour "Tractions Australiennes"
          this.applyLongNameClass();
        }, 200);
      });
    
    // Écouter les événements globaux (sécurisé)
    if (this.$root && typeof this.$root.$on === 'function') {
      this.$root.$on('exercise-recorded', this.onExerciseRecorded);
      this.$root.$on('session-completed', this.onSessionCompleted);
    }
    
    // Charger les données du volume quotidien
    this.loadDailyVolumeData();
    
    // Charger le muscle ciblé sauvegardé
    const savedMuscle = localStorage.getItem('targetedMuscle');
    if (savedMuscle) {
      this.missingMuscle = savedMuscle;
      this.selectedMuscle = savedMuscle;
    }
    
    // Charger les états des missions
    this.loadMissionStates();
    
    
    // Ajouter un écouteur pour fermer le sélecteur en cliquant ailleurs
    document.addEventListener('click', this.handleOutsideClick);
  },
  
  beforeDestroy() {
    if (this.$root && typeof this.$root.$off === 'function') {
      this.$root.$off('exercise-recorded', this.onExerciseRecorded);
      this.$root.$off('session-completed', this.onSessionCompleted);
    }
    
    
    // Supprimer l'écouteur d'événement
    document.removeEventListener('click', this.handleOutsideClick);
  },

  data() {
    return {
      showCreateForm: false,
      showMuscleSelector: false,
      showAddMissionForm: false,
      selectedMuscle: '',
      missingMuscle: 'Jambes',
      availableMuscles: [
        'Pectoraux', 'Épaules', 'Quadriceps', 'Dos', 'Mollets',
        'Abdos', 'Biceps', 'Triceps', 'Avant-bras', 'Jambes'
      ],
      newMuscle: {
        name: '',
        target: '',
        current: '',
        imageFile: null,
        imagePreview: null
      },
      newMission: {
        name: '',
        benefit: '',
        targetValue: '',
        unit: 'reps',
        date: '',
        xp: ''
      },
      // Données réelles pour le volume quotidien
      dailyVolumeData: {
        date: new Date().toISOString().split('T')[0], // Date du jour
        totalVolume: 0,
        muscleGroups: [],
        sessions: []
      },
      
      // Données de comparaison avec hier
      todayPerformance: {
        volume: 1847, // reps totales aujourd'hui
        intensity: 87, // pourcentage intensité moyenne
        restTime: 78, // secondes de repos moyen
        duration: 67, // minutes de session
        // Exercices individuels
        exercises: {
          pompes: { current: 45, previous: 38 },
          tractions: { current: 22, previous: 25 },
          dips: { current: 18, previous: 15 },
          gainage: { current: 180, previous: 165 }, // en secondes
          squats: { current: 35, previous: 32 },
          curls: { current: 28, previous: 30 },
          etirements: { current: 12, previous: 10 } // en minutes
        }
      },
      
      yesterdayPerformance: {
        volume: 1654,
        intensity: 82,
        restTime: 85,
        duration: 72
      },
      
      // Données des accomplissements d'aujourd'hui
      todayAchievements: [
        {
          id: 'record-pompes',
          icon: '🥇',
          title: 'Nouveau Record',
          description: 'Pompes: 45 reps (ancien: 38)',
          reward: '+50 XP',
          type: 'record',
          isNew: true,
          status: 'ACCOMPLI',
          statusClass: 'completed'
        },
        {
          id: 'streak-maintained',
          icon: '🔥',
          title: 'Streak Maintenu',
          description: '12 jours consécutifs',
          reward: '+25 XP',
          type: 'streak',
          isNew: false,
          status: 'EN COURS',
          statusClass: 'active'
        },
        {
          id: 'intensity-max',
          icon: '⚡',
          title: 'Intensité Maximale',
          description: 'Session à 87% d\'intensité',
          reward: '+30 XP',
          type: 'performance',
          isNew: true,
          status: 'ACCOMPLI',
          statusClass: 'completed'
        },
        {
          id: 'volume-target',
          icon: '📊',
          title: 'Objectif Volume',
          description: 'Target quotidien dépassé',
          reward: '+40 XP',
          type: 'goal',
          isNew: true,
          status: 'ACCOMPLI',
          statusClass: 'completed'
        },
        {
          id: 'consistency-bonus',
          icon: '💎',
          title: 'Bonus Régularité',
          description: 'Même heure 3 jours de suite',
          reward: '+20 XP',
          type: 'consistency',
          isNew: false,
          status: 'ACCOMPLI',
          statusClass: 'completed'
        }
      ],
      
      // Données des recommandations IA
      aiRecommendations: [
        {
          id: 'tractions-boost',
          icon: '🏋️',
          title: 'Boost Tractions',
          description: 'Ajouter 2 séries de tractions demain pour compenser la baisse',
          category: 'Optimisation',
          priority: 'high',
          priorityText: 'PRIORITÉ HAUTE',
          impact: '+15% force dos',
          impactClass: 'high-impact'
        },
        {
          id: 'rest-optimization',
          icon: '⏱️',
          title: 'Optimisation Repos',
          description: 'Réduire temps de repos de 5-10s pour maintenir l\'intensité',
          category: 'Technique',
          priority: 'medium',
          priorityText: 'RECOMMANDÉ',
          impact: '+8% efficacité',
          impactClass: 'medium-impact'
        },
        {
          id: 'explosivity-focus',
          icon: '💥',
          title: 'Focus Explosivité',
          description: 'Intégrer des mouvements explosifs pour améliorer la puissance',
          category: 'Progression',
          priority: 'medium',
          priorityText: 'SUGGÉRÉ',
          impact: '+12% puissance',
          impactClass: 'medium-impact'
        },
        {
          id: 'dips-progression',
          icon: '🔥',
          title: 'Progression Dips',
          description: 'Excellent +20% sur dips, ajouter du poids pour continuer',
          category: 'Évolution',
          priority: 'low',
          priorityText: 'OPTIONNEL',
          impact: '+5% force triceps',
          impactClass: 'low-impact'
        },
        {
          id: 'recovery-focus',
          icon: '🧘',
          title: 'Récupération Active',
          description: 'Augmenter étirements à 15min pour optimiser la récupération',
          category: 'Bien-être',
          priority: 'medium',
          priorityText: 'RECOMMANDÉ',
          impact: '+10% récupération',
          impactClass: 'medium-impact'
        }
      ],
      
      // Pool de recommandations alternatives
      alternativeRecommendations: [
        {
          id: 'tempo-control',
          icon: '🎵',
          title: 'Contrôle du Tempo',
          description: 'Ralentir la phase négative pour maximiser l\'hypertrophie',
          category: 'Technique',
          priority: 'medium',
          priorityText: 'TECHNIQUE',
          impact: '+18% croissance',
          impactClass: 'medium-impact'
        },
        {
          id: 'pre-fatigue',
          icon: '⚡',
          title: 'Pré-Fatigue',
          description: 'Commencer par isolation avant les exercices composés',
          category: 'Méthode',
          priority: 'high',
          priorityText: 'INTENSITÉ',
          impact: '+22% activation',
          impactClass: 'high-impact'
        },
        {
          id: 'unilateral-work',
          icon: '⚖️',
          title: 'Travail Unilatéral',
          description: 'Intégrer plus d\'exercices à un bras/jambe pour équilibrer',
          category: 'Équilibre',
          priority: 'medium',
          priorityText: 'ÉQUILIBRE',
          impact: '+14% symétrie',
          impactClass: 'medium-impact'
        },
        {
          id: 'mobility-prep',
          icon: '🤸',
          title: 'Préparation Mobilité',
          description: 'Échauffement dynamique de 8min avant chaque session',
          category: 'Préparation',
          priority: 'high',
          priorityText: 'PRÉVENTION',
          impact: '+25% performance',
          impactClass: 'high-impact'
        },
        {
          id: 'cluster-sets',
          icon: '🎯',
          title: 'Séries Cluster',
          description: 'Diviser les séries lourdes en mini-séries pour plus de volume',
          category: 'Volume',
          priority: 'low',
          priorityText: 'AVANCÉ',
          impact: '+11% volume total',
          impactClass: 'medium-impact'
        },
        {
          id: 'mind-muscle',
          icon: '🧠',
          title: 'Connexion Neuro-Musculaire',
          description: 'Focus mental sur le muscle travaillé pendant chaque rep',
          category: 'Mental',
          priority: 'medium',
          priorityText: 'FOCUS',
          impact: '+16% activation',
          impactClass: 'medium-impact'
        },
        {
          id: 'periodization',
          icon: '📅',
          title: 'Périodisation',
          description: 'Alterner semaines lourdes/légères pour éviter la stagnation',
          category: 'Planification',
          priority: 'low',
          priorityText: 'LONG TERME',
          impact: '+20% progression',
          impactClass: 'high-impact'
        },
        {
          id: 'breathing-pattern',
          icon: '🫁',
          title: 'Pattern Respiratoire',
          description: 'Optimiser la respiration : expire sur l\'effort, inspire sur la descente',
          category: 'Technique',
          priority: 'medium',
          priorityText: 'TECHNIQUE',
          impact: '+9% endurance',
          impactClass: 'medium-impact'
        }
      ],

        // Données pour l'historique personnel
        currentHistoryPeriod: 'month',
      bestStreak: {
        value: 28,
        period: 'Juillet 2024'
      },
      overallProgress: {
        value: +18,
        class: 'positive'
      },
      consistency: {
        value: 87,
        description: 'Très régulier'
      },
      historyChartData: {
        month: {
          labels: ['S1', 'S2', 'S3', 'S4'],
          volume: [2840, 3120, 3350, 3680], // Répétitions totales
          minutesData: [57, 61, 65, 70], // Temps total en minutes
          secondsData: [90, 85, 80, 75] // Temps de récupération moyen en secondes
        },
        quarter: {
          labels: ['Juil', 'Août', 'Sept'],
          volume: [11200, 12800, 14200], // Répétitions totales
          minutesData: [240, 260, 280], // Temps total en minutes (4h, 4h20, 4h40)
          secondsData: [95, 88, 82] // Temps de récupération moyen en secondes
        },
        year: {
          labels: ['T1', 'T2', 'T3', 'T4'],
          volume: [38400, 42100, 45800, 48200], // Répétitions totales
          minutesData: [960, 1040, 1120, 1200], // Temps total en minutes (16h, 17h20, 18h40, 20h)
          secondsData: [100, 92, 85, 78] // Temps de récupération moyen en secondes
        }
      },
      
      // Tooltip simple et efficace
      tooltip: {
        visible: false,
        x: 0,
        y: 0,
        text: ''
      }
      
    };

    // Données pour le graphique de progression
    return {
      ...data
    };
  },

  methods: {
    navigateToStats() {
      // Navigation vers les statistiques

    },
    
    addQuickSession() {
      // Ajouter une session rapide

    },
    
    viewDetailedStats() {
      // Voir les statistiques détaillées

    },

    // ================ MÉTHODES RECOMMANDATIONS IA ================
    
    refreshRecommendation(recommendation) {

      
      // Trouver l'index de la recommandation actuelle
      const currentIndex = this.aiRecommendations.findIndex(r => r.id === recommendation.id);
      if (currentIndex === -1) return;
      
      // Sélectionner une recommandation alternative aléatoire
      const availableAlternatives = this.alternativeRecommendations.filter(alt => 
        !this.aiRecommendations.some(current => current.id === alt.id)
      );
      
      if (availableAlternatives.length > 0) {
        const randomAlternative = availableAlternatives[Math.floor(Math.random() * availableAlternatives.length)];
        
        // Remplacer la recommandation actuelle
        this.aiRecommendations.splice(currentIndex, 1, { ...randomAlternative });
        
        // Feedback visuel
        this.showRefreshFeedback(recommendation.id);
        

      } else {

      }
    },

    showRefreshFeedback(recId) {
      // Animation de rafraîchissement avec bouton qui tourne
      const element = document.querySelector(`[data-rec-id="${recId}"]`);
      const button = element?.querySelector('.rec-btn-emoji');
      
      if (button) {
        // Animation du bouton
        button.classList.add('spinning');
        
        setTimeout(() => {
          button.classList.remove('spinning');
        }, 500);
      }
      
      if (element) {
        // Animation de la carte
        element.classList.add('refreshing');
        
        setTimeout(() => {
          element.classList.remove('refreshing');
          element.classList.add('refreshed');
          
          setTimeout(() => {
            element.classList.remove('refreshed');
          }, 1500);
        }, 300);
      }
    },

      // ================ MÉTHODES HISTORIQUE PERSONNEL ================
      
     
     
     
     
     addTooltipEvents(canvas, values, labels, stepX, margin, minValue, valueRange, unit) {
       const chartHeight = canvas.getBoundingClientRect().height - margin.top - margin.bottom;
       
       canvas.addEventListener('mousemove', (e) => {
         const rect = canvas.getBoundingClientRect();
         const mouseX = e.clientX - rect.left;
         const mouseY = e.clientY - rect.top;
         
         let found = false;
         values.forEach((value, i) => {
           const x = margin.left + i * stepX;
           const y = margin.top + (1 - (value - minValue) / valueRange) * chartHeight;
           const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
           
           if (distance <= 15) {
             this.tooltip.visible = true;
             this.tooltip.x = e.clientX + 10;
             this.tooltip.y = e.clientY - 30;
             this.tooltip.text = `${labels[i]}: ${value.toLocaleString()} ${unit}`;
             found = true;
           }
         });
         
         if (!found) {
           this.tooltip.visible = false;
         }
       });
       
       canvas.addEventListener('mouseleave', () => {
         this.tooltip.visible = false;
       });
     },
      
     // Appliquer césure avec tiret pour "Tractions Australiennes"
    applyLongNameClass() {
      this.$nextTick(() => {
        const recordNames = document.querySelectorAll('.record-name');
        recordNames.forEach(nameElement => {
          if (nameElement.textContent.includes('Tractions Australiennes')) {
            // Remplacer par une césure avec tiret
            nameElement.innerHTML = 'Tractions Austra&shy;liennes';
            nameElement.classList.add('long-name');

          }
        });
      });
    },
    
    // Calculer le numéro de semaine de l'année (norme ISO 8601)
    getWeekNumber(date) {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
      

      return weekNumber;
    },
    
    // Obtenir les labels des 3 derniers mois réels
    getRealMonthLabels() {
      const today = new Date();
      const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ];
      
      const currentMonth = today.getMonth();
      const months = [];
      
      for (let i = 2; i >= 0; i--) {
        let monthIndex = currentMonth - i;
        if (monthIndex < 0) {
          monthIndex += 12; // Gérer le passage d'année
        }
        months.push(monthNames[monthIndex]);
      }
      

      return months;
    },
    
    // Obtenir les labels des 4 derniers trimestres réels
    getRealQuarterLabels() {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentQuarter = Math.floor(today.getMonth() / 3) + 1;
      
      const quarters = [];
      
      for (let i = 3; i >= 0; i--) {
        let quarter = currentQuarter - i;
        let year = currentYear;
        
        if (quarter <= 0) {
          quarter += 4;
          year -= 1;
        }
        
        quarters.push(`T${quarter} ${year}`);
      }
      

      return quarters;
    },
    
    
    // Méthode supprimée - remplacée par addDirectTooltips
    
    getDataForType(type) {
      const period = this.currentHistoryPeriod;
      
      // Générer des données basées sur la date système
      const today = new Date();
      const currentMonth = today.getMonth(); // 0-11
      const currentDay = today.getDate();
      const currentHour = today.getHours();
      


      
      // Calculer la semaine réelle de l'année
      const currentWeek = this.getWeekNumber(today);
      const realWeeks = [
        currentWeek - 3,
        currentWeek - 2, 
        currentWeek - 1,
        currentWeek
      ];
      

      
      // Facteur basé sur la date pour des variations réalistes
      const dayFactor = (currentDay / 31) * 0.3 + 0.85; // 0.85 à 1.15
      const monthFactor = (currentMonth / 12) * 0.2 + 0.9; // 0.9 à 1.1
      const hourFactor = Math.sin((currentHour / 24) * Math.PI * 2) * 0.1 + 1; // Variation sinusoïdale
      
      // Facteurs spécifiques par semaine (progression réaliste)
      const weekFactors = realWeeks.map((week, index) => {
        const progression = 0.85 + (index * 0.1); // Progression de 0.85 à 1.15
        const weekVariation = Math.sin((week / 52) * Math.PI * 2) * 0.1 + 1;
        return progression * weekVariation;
      });
      
      const baseData = {
        'month': {
          labels: realWeeks.map(week => `Sem ${week}`),
          volume: [
            Math.round(320 * weekFactors[0] * dayFactor),
            Math.round(380 * weekFactors[1] * monthFactor),
            Math.round(420 * weekFactors[2] * hourFactor),
            Math.round(450 * weekFactors[3] * dayFactor * monthFactor)
          ],
          minutes: [
            Math.round(960 * weekFactors[0] * dayFactor),
            Math.round(1040 * weekFactors[1] * monthFactor),
            Math.round(1120 * weekFactors[2] * hourFactor),
            Math.round(1200 * weekFactors[3] * dayFactor * monthFactor)
          ],
          seconds: [
            Math.round(100 * weekFactors[0] * dayFactor),
            Math.round(92 * weekFactors[1] * monthFactor),
            Math.round(85 * weekFactors[2] * hourFactor),
            Math.round(78 * weekFactors[3] * dayFactor * hourFactor)
          ]
        },
        'quarter': {
          labels: this.getRealMonthLabels(),
          volume: [
            Math.round(1200 * monthFactor * weekFactors[0]),
            Math.round(1400 * dayFactor * weekFactors[1]),
            Math.round(1600 * hourFactor * weekFactors[2])
          ],
          minutes: [
            Math.round(3600 * monthFactor * weekFactors[0]),
            Math.round(4200 * dayFactor * weekFactors[1]),
            Math.round(4800 * hourFactor * weekFactors[2])
          ],
          seconds: [
            Math.round(95 * monthFactor * weekFactors[0]),
            Math.round(88 * dayFactor * weekFactors[1]),
            Math.round(82 * hourFactor * weekFactors[2])
          ]
        },
        'year': {
          labels: this.getRealQuarterLabels(),
          volume: [
            Math.round(4800 * weekFactors[0] * monthFactor),
            Math.round(5200 * weekFactors[1] * dayFactor),
            Math.round(5600 * weekFactors[2] * hourFactor),
            Math.round(6000 * weekFactors[3] * monthFactor * dayFactor)
          ],
          minutes: [
            Math.round(14400 * weekFactors[0] * monthFactor),
            Math.round(15600 * weekFactors[1] * dayFactor),
            Math.round(16800 * weekFactors[2] * hourFactor),
            Math.round(18000 * weekFactors[3] * monthFactor * dayFactor)
          ],
          seconds: [
            Math.round(98 * weekFactors[0] * monthFactor),
            Math.round(90 * weekFactors[1] * dayFactor),
            Math.round(85 * weekFactors[2] * hourFactor),
            Math.round(80 * weekFactors[3] * monthFactor * dayFactor)
          ]
        }
      };
      
      const data = baseData[period] || baseData.month;
      return {
        labels: data.labels,
        values: type === 'volume' ? data.volume : 
                type === 'minutes' ? data.minutes : data.seconds
      };
    },
    




    // Méthodes pour le graphique de progression
    showTooltip(point, index, event) {
      const day = this.chartDays[index];
      const data = this.chartData[index];
      
      this.tooltip = {
        visible: true,
        x: event.clientX - 100,
        y: event.clientY - 80,
        text: `${day.fullName}: ${data.volume}% (${data.intensity}% intensité)`
      };
    },

    hideTooltip() {
      this.tooltip.visible = false;
    },

    formatDate(date) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    },
    
    openCreateForm() {
      this.showCreateForm = true;
    },
    
    toggleMuscleSelector() {
      if (!this.showMuscleSelector) {
        // Ouvrir le sélecteur avec un petit délai pour éviter les conflits
        setTimeout(() => {
          this.showMuscleSelector = true;
        }, 100);
      } else {
        // Fermer immédiatement
        this.showMuscleSelector = false;
      }
    },
    
    updateTargetedMuscle() {
      if (this.selectedMuscle) {
        this.missingMuscle = this.selectedMuscle;
        // Sauvegarder le choix dans localStorage
        localStorage.setItem('targetedMuscle', this.selectedMuscle);
        // Fermer le sélecteur après sélection
        this.showMuscleSelector = false;
      }
    },
    
    closeMuscleSelector() {
      this.showMuscleSelector = false;
    },
    
    handleOutsideClick(event) {
      // Fermer le sélecteur si on clique en dehors
      if (this.showMuscleSelector && !event.target.closest('.muscles-targeted')) {
        this.showMuscleSelector = false;
      }
    },
    
    closeCreateForm() {
      this.showCreateForm = false;
    },
    
    openAddMissionForm() {
      this.showAddMissionForm = true;
    },
    
    closeAddMissionForm() {
      this.showAddMissionForm = false;
      // Réinitialiser le formulaire
      this.newMission = {
        name: '',
        benefit: '',
        targetValue: '',
        unit: 'reps',
        date: '',
        xp: ''
      };
    },
    
    getTodayDate() {
      return new Date().toISOString().split('T')[0];
    },
    
    updateSelectedDate() {
      // Cette méthode sera appelée quand la date change

    },
    
    formatSelectedDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const dayName = days[date.getDay()];
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${dayName} ${day}/${month}/${year}`;
    },
    
    toggleMissionCompletion(missionId, dayName) {
      // Trouver et basculer l'état de la mission
      const dayIndex = this.weeklyMissions.findIndex(day => day.dayName === dayName);
      if (dayIndex !== -1) {
        const missionIndex = this.weeklyMissions[dayIndex].missions.findIndex(mission => mission.id === missionId);
        if (missionIndex !== -1) {
          this.weeklyMissions[dayIndex].missions[missionIndex].completed = !this.weeklyMissions[dayIndex].missions[missionIndex].completed;
          
          // Sauvegarder l'état dans localStorage
          this.saveMissionState(missionId, dayName, this.weeklyMissions[dayIndex].missions[missionIndex].completed);
          
          // Émettre un événement pour notifier les autres composants
          if (this.$root && typeof this.$root.$emit === 'function') {
            this.$root.$emit('mission-completed', {
              missionId: missionId,
              dayName: dayName,
              completed: this.weeklyMissions[dayIndex].missions[missionIndex].completed
            });
          }
        }
      }
    },
    
    saveMissionState(missionId, dayName, completed) {
      const key = `mission_${missionId}_${dayName}`;
      localStorage.setItem(key, JSON.stringify({ completed: completed, timestamp: new Date().toISOString() }));
    },
    
    loadMissionStates() {
      // Charger les états des missions depuis localStorage
      this.weeklyMissions.forEach(day => {
        day.missions.forEach(mission => {
          const key = `mission_${mission.id}_${day.dayName}`;
          const savedState = localStorage.getItem(key);
          if (savedState) {
            try {
              const state = JSON.parse(savedState);
              mission.completed = state.completed;
            } catch (error) {
              console.error('Erreur lors du chargement de l\'état de la mission:', error);
            }
          }
        });
      });
    },
    
    addNewMission() {
      // Validation
      if (!this.newMission.name || !this.newMission.benefit || !this.newMission.targetValue || !this.newMission.date || !this.newMission.xp) {
        alert('Veuillez remplir tous les champs');
        return;
      }
      
      // Créer la nouvelle mission
      const newMissionData = {
        id: Date.now(),
        name: this.newMission.name.trim(),
        benefit: this.newMission.benefit.trim(),
        targetValue: parseInt(this.newMission.targetValue),
        unit: this.newMission.unit,
        date: this.newMission.date,
        xp: parseInt(this.newMission.xp),
        completed: false,
        createdAt: new Date().toISOString()
      };
      
      // Ajouter la mission aux données (ici vous pouvez ajouter la logique de sauvegarde)

      
      // Sauvegarder dans localStorage avec la date comme clé
      this.saveMissionToStorage(newMissionData);
      
      // Émettre un événement pour notifier les autres composants
      if (this.$root && typeof this.$root.$emit === 'function') {
        this.$root.$emit('mission-added', newMissionData);
      }
      
      // Fermer le formulaire
      this.closeAddMissionForm();
      
      // Notification de succès
      if (typeof window.showNotification === 'function') {
        window.showNotification(
          `Mission "${newMissionData.name}" ajoutée pour le ${this.formatSelectedDate(newMissionData.date)} !`,
          'success'
        );
      }
    },
    
    saveMissionToStorage(missionData) {
      const key = `mission_${missionData.date}`;
      const existingMissions = JSON.parse(localStorage.getItem(key) || '[]');
      existingMissions.push(missionData);
      localStorage.setItem(key, JSON.stringify(existingMissions));
    },
    
    handleImageUpload(event) {
      const file = event.target.files[0];
      if (file) {
        // Vérifier le type de fichier
        if (!file.type.startsWith('image/')) {
          alert('Veuillez sélectionner un fichier image valide');
          return;
        }
        
        // Créer un preview
        const reader = new FileReader();
        reader.onload = (e) => {
          this.newMuscle.imagePreview = e.target.result;
          this.newMuscle.imageFile = file;
        };
        reader.readAsDataURL(file);
      }
    },
    
    removeImage() {
      this.newMuscle.imagePreview = null;
      this.newMuscle.imageFile = null;
      this.$refs.imageInput.value = '';
    },
    
    createNewMuscle() {
      // Validation des données
      if (!this.newMuscle.name.trim()) {
        alert('Veuillez entrer un nom pour le muscle/exercice');
        return;
      }
      
      if (!this.newMuscle.target || this.newMuscle.target <= 0) {
        alert('Veuillez entrer un objectif valide');
        return;
      }
      
      // Créer le nouveau groupe musculaire
      const newMuscleGroup = {
        id: Date.now(), // ID unique temporaire
        name: this.newMuscle.name.trim(),
        target: parseInt(this.newMuscle.target),
        current: parseInt(this.newMuscle.current) || 0,
        imageFile: this.newMuscle.imageFile,
        imagePreview: this.newMuscle.imagePreview,
        date: this.dailyVolumeData.date
      };
      
      // Ajouter au volume quotidien
      this.dailyVolumeData.muscleGroups.push(newMuscleGroup);
      this.updateTotalVolume();
      
      // Sauvegarder les données (ici vous pouvez ajouter la logique de sauvegarde)
      this.saveDailyVolumeData();
      


      
      // Réinitialiser le formulaire
      this.showCreateForm = false;
      this.newMuscle = { name: '', target: '', current: '', imageFile: null, imagePreview: null };
    },
    
    updateTotalVolume() {
      // Calculer le volume total basé sur les groupes musculaires
      this.dailyVolumeData.totalVolume = this.dailyVolumeData.muscleGroups.reduce((total, group) => {
        return total + group.current;
      }, 0);
    },
    
    saveDailyVolumeData() {
      // Sauvegarder les données dans localStorage (temporaire)
      // En production, vous pourriez envoyer à une API
      const key = `dailyVolume_${this.dailyVolumeData.date}`;
      localStorage.setItem(key, JSON.stringify(this.dailyVolumeData));
      
      // Émettre un événement pour notifier les autres composants
      if (this.$root && typeof this.$root.$emit === 'function') {
        this.$root.$emit('daily-volume-updated', this.dailyVolumeData);
      }
    },
    
    loadDailyVolumeData() {
      // Charger les données du jour depuis localStorage
      const key = `dailyVolume_${this.dailyVolumeData.date}`;
      const savedData = localStorage.getItem(key);
      
      if (savedData) {
        try {
          this.dailyVolumeData = JSON.parse(savedData);
        } catch (error) {
          console.error('Erreur lors du chargement des données:', error);
        }
      }
    },
    
    getWeeklyRecords() {
      // Données mockées pour les records de la semaine
      return [
        { exercise: 'Pompes', value: 45, previousRecord: 37 },
        { exercise: 'Tractions', value: 22, previousRecord: 17 },
        { exercise: 'Dips', value: 18, previousRecord: 15 },
        { exercise: 'Gainage', value: '180s', previousRecord: '135s' }
      ];
    },
    
    getWeeklyMissions() {
      const today = new Date();
      const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
      const missions = [];
      
      // Générer les missions pour chaque jour de la semaine
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - today.getDay() + 1 + i); // Commencer par lundi
        
        const dayMissions = this.generateDayMissions(i);
        
        missions.push({
          dayName: days[i],
          date: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`,
          isToday: i === today.getDay() - 1,
          missions: dayMissions
        });
      }
      
      return missions;
    },
    
    generateDayMissions(dayIndex) {
      const baseMissions = [
        { id: 1, text: 'AJOUTER DES SQUATS (+Équilibre)', xp: 15, completed: false },
        { id: 2, text: '10 MIN CARDIO (+Endurance)', xp: 25, completed: false },
        { id: 3, text: 'ÉTIREMENTS COMPLETS (+Flexibilité)', xp: 10, completed: false },
        { id: 4, text: 'SÉANCE HIIT (+Intensité)', xp: 30, completed: false },
        { id: 5, text: 'MARCHE 30 MIN (+Cardio)', xp: 20, completed: false }
      ];
      
      // Varier les missions selon le jour
      const daySpecificMissions = {
        0: [baseMissions[0], baseMissions[1]], // Lundi
        1: [baseMissions[2], baseMissions[3]], // Mardi
        2: [baseMissions[0], baseMissions[4]], // Mercredi
        3: [baseMissions[1], baseMissions[2]], // Jeudi
        4: [baseMissions[3], baseMissions[0]], // Vendredi
        5: [baseMissions[4], baseMissions[1]], // Samedi
        6: [baseMissions[2], baseMissions[3]]  // Dimanche
      };
      
      return daySpecificMissions[dayIndex] || [baseMissions[0], baseMissions[1]];
    },
    
    onExerciseRecorded(exerciseData) {
      // Gérer l'enregistrement d'un exercice

    },
    
    onSessionCompleted(sessionData) {
      // Gérer la fin d'une session

    },
    
    // Méthode supprimée - remplacée par initSimpleTooltips()
  }
};
