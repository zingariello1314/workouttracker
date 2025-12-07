// ================ BLOC PROJECTION MATRIX ================
// ?? ATTENTION: NE JAMAIS MODIFIER CE FICHIER - IMPL�MENTATION FINALE VALID�E ??
// ?? VERSION: 1.0 FINALE - PROT�G� CONTRE LES MODIFICATIONS ??

window.ProjectionMatrixBlock = window.ProjectionMatrixBlock || {};

window.ProjectionMatrixBlock = {
  name: 'ProjectionMatrixBlock',
  
  template: `
    <div class="projection-matrix-card dashboard-card priority-low span-2">
      <!-- Effet de glow d'arri�re-plan renforc� -->
      <div class="pm-background-glow"></div>
      
      <!-- Bordures lumineuses -->
      <div class="pm-border-top"></div>
      <div class="pm-border-bottom"></div>
      
      <!-- Header compact -->
      <div class="pm-header">
        <div class="pm-header-left">
          <div class="pm-header-icon">
            ??
          </div>
          <div>
            <h2 class="pm-title">PROJECTION MATRIX</h2>
            <p class="pm-subtitle">Calibrage Temps R�el � Pr�diction Quantique</p>
          </div>
        </div>
        <div class="pm-neural-status">
          <div class="pm-status-dot"></div>
          <span>NEURAL LINK ACTIF</span>
        </div>
      </div>

      <!-- Layout vertical principal optimis� -->
      <div class="pm-main-layout">
        
        <!-- Ligne 1: Stats principales en horizontal -->
        <div class="pm-top-row">
          <div class="pm-stat-card pm-stat-level">
            <div class="pm-stat-value">Niv.{{ currentLevel }}</div>
            <div class="pm-stat-label">Niveau</div>
          </div>
          <div class="pm-stat-card pm-stat-xp">
            <div class="pm-stat-value">{{ (currentXP / 1000).toFixed(1) }}k</div>
            <div class="pm-stat-label">XP Total</div>
          </div>
          <div class="pm-stat-card pm-stat-quests">
            <div class="pm-stat-value">{{ questsCompleted }}</div>
            <div class="pm-stat-label">Qu�tes</div>
          </div>
          <div class="pm-stat-card pm-stat-efficiency">
            <div class="pm-stat-value">{{ projectionData.efficiency }}%</div>
            <div class="pm-stat-label">Efficacit�</div>
          </div>
        </div>

        <!-- Ligne 2: Efficacit� + Simulateur -->
        <div class="pm-second-row">
          <div class="pm-efficiency-card">
            <div class="pm-efficiency-value">{{ projectionData.efficiency }}%</div>
            <div class="pm-efficiency-label">EFFICACIT�</div>
          </div>
          <div class="pm-simulator">
            <h3 class="pm-simulator-title">
              ? Simulateur Temps R�el
            </h3>
            <div class="pm-simulator-content">
              <div class="pm-quest-item">
                <span>Qu�tes Journali�res</span>
                <button @click="toggleQuest('daily')" class="pm-quest-btn pm-daily">
                  {{ dailyQuestsDone }}/5
                </button>
              </div>
              <div class="pm-quest-item">
                <span>Qu�tes Hebdomadaires</span>
                <button @click="toggleQuest('weekly')" class="pm-quest-btn pm-weekly">
                  {{ weeklyQuestsDone }}/3
                </button>
              </div>
              <div class="pm-simulator-stats">
                <div class="pm-stat-row">
                  <span>XP/Jour:</span>
                  <span class="pm-xp-per-day">{{ projectionData.xpPerDay }}</span>
                </div>
                <div class="pm-stat-row">
                  <span>Prochain niveau:</span>
                  <span class="pm-days-to-next">{{ projectionData.daysToNext }}j</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Ligne 3: Contr�les IA -->
        <div class="pm-third-row">
          <div class="pm-ai-control">
            <h4 class="pm-ai-title">??? CONTR�LE IA</h4>
            <div class="pm-ai-modes">
              <button class="pm-mode-btn pm-secure">
                <div class="pm-mode-name">??? MODE S�CURIS�</div>
                <div class="pm-mode-desc">Pr�dictions fiables</div>
              </button>
              <button class="pm-mode-btn pm-optimistic active">
                <div class="pm-mode-name">? MODE OPTIMISTE</div>
                <div class="pm-mode-desc">Configuration actuelle</div>
              </button>
              <button class="pm-mode-btn pm-extreme">
                <div class="pm-mode-name">?? MODE EXTR�ME</div>
                <div class="pm-mode-desc">D�fis maximaux</div>
              </button>
            </div>
          </div>
        </div>

        <!-- Ligne 4: Graphique XP - 30 jours (inchang�) -->
        <div class="pm-fourth-row">
          <div class="pm-xp-chart">
            <div class="pm-chart-header">
              <h4>?? �VOLUTION XP - 30 JOURS</h4>
              <div class="pm-chart-trend">
                <span>+127% ?</span>
              </div>
            </div>
            
            <div class="pm-chart-container">
              <canvas ref="xpChartCanvas" class="pm-chart-canvas"></canvas>
            </div>
            
            <div class="pm-chart-metrics">
              <div class="pm-metric-item">
                <div class="pm-metric-label">Moyenne</div>
                <div class="pm-metric-value">2.3k/j</div>
              </div>
              <div class="pm-metric-item">
                <div class="pm-metric-label">Maximum</div>
                <div class="pm-metric-value">4.7k</div>
              </div>
              <div class="pm-metric-item">
                <div class="pm-metric-label">Minimum</div>
                <div class="pm-metric-value">890</div>
              </div>
              <div class="pm-metric-item">
                <div class="pm-metric-label">Aujourd'hui</div>
                <div class="pm-metric-value">3.2k</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Ligne 5: Activit�s via Qu�tes (inchang�) -->
        <div class="pm-fifth-row">
          <div class="pm-skills-chart">
            <h4>? ACTIVIT�S VIA QU�TES</h4>
            
            <!-- M�triques principales en haut -->
            <div class="pm-activities-top-metrics">
              <div class="pm-top-metric">
                <div class="pm-top-value">{{ totalQuests }}</div>
                <div class="pm-top-label">Total Qu�tes</div>
                <div class="pm-top-subtitle">{{ questStats.totalXP }} XP</div>
              </div>
              <div class="pm-top-metric">
                <div class="pm-top-value">{{ currentStreak }}j</div>
                <div class="pm-top-label">Streak</div>
                <div class="pm-top-subtitle">{{ questStats.bestDay }}</div>
              </div>
              <div class="pm-top-metric">
                <div class="pm-top-value">{{ topActivity }}</div>
                <div class="pm-top-label">Top Activit�</div>
                <div class="pm-top-subtitle">{{ weeklyActivities[0].xp }} XP</div>
              </div>
            </div>
            
            <!-- Vrai graphique en barres verticales -->
            <div class="pm-activities-chart-compact">
              <h5>?? R�PARTITION ACTIVIT�S</h5>
              <div class="pm-chart-container">
                <div class="pm-bars-container">
                  <div v-for="(activity, index) in weeklyActivities" :key="index" class="pm-bar-column">
                    <div class="pm-bar-wrapper">
                      <div class="pm-bar" :style="{ height: (activity.count / 30) * 240 + 'px', backgroundColor: getActivityColor(activity.type) }">
                        <div class="pm-bar-value">{{ activity.count }}</div>
                      </div>
                    </div>
                    <div class="pm-bar-label">{{ activity.name }}</div>
                  </div>
                </div>
                <div class="pm-y-axis">
                  <span>30</span>
                  <span>20</span>
                  <span>10</span>
                  <span>0</span>
                </div>
              </div>
              <div class="pm-x-axis-label">Types d'activit�s</div>
            </div>
            
            <!-- Statistiques d�taill�es -->
            <div class="pm-quest-stats">
              <div class="pm-stat-row">
                <div class="pm-stat-item">
                  <span class="pm-stat-icon">??</span>
                  <span class="pm-stat-text">Quotidiennes: {{ questStats.dailyCompleted }}/5</span>
                </div>
                <div class="pm-stat-item">
                  <span class="pm-stat-icon">??</span>
                  <span class="pm-stat-text">Hebdomadaires: {{ questStats.weeklyCompleted }}/3</span>
                </div>
              </div>
              <div class="pm-stat-row">
                <div class="pm-stat-item">
                  <span class="pm-stat-icon">??</span>
                  <span class="pm-stat-text">Moyenne: {{ questStats.averageXP }} XP/qu�te</span>
                </div>
                <div class="pm-stat-item">
                  <span class="pm-stat-icon">??</span>
                  <span class="pm-stat-text">Meilleure semaine: {{ questStats.bestWeek }}</span>
                </div>
              </div>
            </div>
            
            <!-- Tendances compactes en bas -->
            <div class="pm-trends-compact">
              <div v-for="(trend, index) in monthlyTrends.slice(0, 4)" :key="index" class="pm-trend-compact">
                <span class="pm-trend-icon-small">{{ trend.icon }}</span>
                <span class="pm-trend-name-small">{{ trend.name }}</span>
                <span class="pm-trend-change-small" :class="trend.change > 0 ? 'positive' : 'negative'">
                  {{ trend.change > 0 ? '+' : '' }}{{ trend.change }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Ligne 6: Activit�s Matrice (layout horizontal) -->
        <div class="pm-sixth-row">
          <div class="pm-activity-chart">
            <h4>?? ACTIVIT� MATRIX</h4>
            <div class="pm-activity-container">
              <div class="pm-activity-days">
                <span>L</span>
                <span>M</span>
                <span>M</span>
                <span>J</span>
                <span>V</span>
                <span>S</span>
                <span>D</span>
              </div>
              
              <div class="pm-activity-weeks">
                <div v-for="week in 20" :key="week" class="pm-week-row">
                  <div class="pm-week-label">S{{ getWeekNumber(week) }}</div>
                  <div v-for="day in 7" :key="day" 
                       :class="getActivityClass(week, day)"
                       :title="getActivityTooltip(week, day)"
                       class="pm-activity-cell">
                  </div>
                </div>
              </div>
            
              <div class="pm-activity-legend">
                <span>Moins</span>
                <div class="pm-legend-dots">
                  <div class="pm-legend-dot level-0"></div>
                  <div class="pm-legend-dot level-1"></div>
                  <div class="pm-legend-dot level-2"></div>
                  <div class="pm-legend-dot level-3"></div>
                  <div class="pm-legend-dot level-4"></div>
                </div>
                <span>Plus</span>
              </div>
            </div>
            <div class="pm-activity-metrics">
              <div class="pm-activity-metric">
                <div class="pm-activity-label">R�gularit�</div>
                <div class="pm-activity-value">87%??</div>
              </div>
              <div class="pm-activity-metric">
                <div class="pm-activity-label">Streak</div>
                <div class="pm-activity-value">23j</div>
              </div>
              <div class="pm-activity-metric">
                <div class="pm-activity-label">Semaine</div>
                <div class="pm-activity-value">12</div>
              </div>
            </div>
          </div>
        </div>
      </div>

                     <!-- Effets de lumi�re d'angle supprim�s pour plus de propret� -->
    </div>
  `,

  props: {
    allData: {
      type: Object,
      default: () => ({})
    }
  },

  data() {
    return {
      currentLevel: 42,
      currentXP: 7850,
      questsCompleted: 145,
      dailyQuestsDone: 3,
      weeklyQuestsDone: 2,
      projectionData: {},
      activityData: {},
      
      // Donn�es compl�tes et r�alistes pour les activit�s via qu�tes
      weeklyActivities: [
        { name: 'Lecture', count: 29, percentage: 100, type: 'reading', xp: 1400, streak: 15 },
        { name: 'Sport', count: 22, percentage: 76, type: 'sport', xp: 1100, streak: 8 },
        { name: 'Apprentissage', count: 19, percentage: 66, type: 'learning', xp: 950, streak: 12 },
        { name: 'M�nage', count: 18, percentage: 62, type: 'household', xp: 800, streak: 6 },
        { name: 'Sant�', count: 14, percentage: 48, type: 'health', xp: 700, streak: 9 },
        { name: 'Social', count: 11, percentage: 38, type: 'social', xp: 550, streak: 4 }
      ],
      monthlyTrends: [
        { name: 'Lecture', change: 25, icon: '??', type: 'reading', current: 28, previous: 22 },
        { name: 'Sport', change: -2, icon: '??', type: 'sport', current: 22, previous: 23 },
        { name: 'Apprentissage', change: 18, icon: '??', type: 'learning', current: 19, previous: 16 },
        { name: 'M�nage', change: 12, icon: '??', type: 'household', current: 16, previous: 14 },
        { name: 'Sant�', change: 35, icon: '??', type: 'health', current: 14, previous: 10 },
        { name: 'Social', change: -8, icon: '??', type: 'social', current: 11, previous: 12 }
      ],
      totalQuests: 156,
      topActivity: 'Lecture',
      currentStreak: 23,
      
      // Nouvelles donn�es pour plus de contexte
      questStats: {
        dailyCompleted: 18,
        weeklyCompleted: 7,
        monthlyCompleted: 28,
        totalXP: 5500,
        averageXP: 35.3,
        bestDay: 'Mardi',
        bestWeek: 'S32'
      },
      recentQuests: [
        { name: 'Lecture 30min', type: 'reading', completed: true, xp: 50, time: '2h ago' },
        { name: 'Course 5km', type: 'sport', completed: true, xp: 75, time: '5h ago' },
        { name: 'Cours Python', type: 'learning', completed: false, xp: 100, time: '1j ago' },
        { name: 'Rangement bureau', type: 'household', completed: true, xp: 25, time: '1j ago' }
      ]
    };
  },

  computed: {
    // Calculs automatiques des projections
    computedProjectionData() {
      const xpPerDay = (this.dailyQuestsDone * 50) + (this.weeklyQuestsDone * 150 / 7);
      const xpNeededForNext = (this.currentLevel * 200) - (this.currentXP % (this.currentLevel * 200));
      const daysToNextLevel = Math.ceil(xpNeededForNext / xpPerDay);
      const nextLevelDate = new Date();
      nextLevelDate.setDate(nextLevelDate.getDate() + daysToNextLevel);
      
      const yearProjection = Math.floor(this.currentLevel + (365 * xpPerDay) / (this.currentLevel * 200));
      
      return {
        xpPerDay: xpPerDay.toFixed(1),
        daysToNext: daysToNextLevel,
        nextLevelDate: nextLevelDate.toLocaleDateString('fr-FR'),
        projectedLevel: yearProjection,
        efficiency: Math.min(100, (xpPerDay / 100) * 100).toFixed(1)
      };
    }
  },

  watch: {
    // Recalcul automatique quand les donn�es changent
    dailyQuestsDone() {
      this.updateProjections();
    },
    weeklyQuestsDone() {
      this.updateProjections();
    }
  },

  mounted() {
    this.updateProjections();
    this.generateActivityData();
    this.$nextTick(() => {
      this.drawXPChart();
    });
  },

  methods: {
    // Mise � jour des projections
    updateProjections() {
      this.projectionData = this.computedProjectionData;
    },

    // Toggle des qu�tes
    toggleQuest(type) {
      if (type === 'daily') {
        this.dailyQuestsDone = this.dailyQuestsDone === 5 ? 0 : this.dailyQuestsDone + 1;
      } else {
        this.weeklyQuestsDone = this.weeklyQuestsDone === 3 ? 0 : this.weeklyQuestsDone + 1;
      }
    },

    // G�n�ration des donn�es d'activit�
    generateActivityData() {
      this.activityData = {};
      
      // Semaines 1-5 : Activit� �lev�e (donn�es r�alistes)
      for (let week = 1; week <= 5; week++) {
        for (let day = 1; day <= 7; day++) {
          let intensity;
          if (week <= 3) {
            // Semaines tr�s actives
            intensity = 0.7 + (Math.random() * 0.3); // 0.7-1.0
          } else if (week <= 5) {
            // Semaines moyennement actives
            intensity = 0.4 + (Math.random() * 0.4); // 0.4-0.8
          }
          this.activityData[`${week}-${day}`] = intensity;
        }
      }
      
      // Semaines 6-12 : Activit� mod�r�e
      for (let week = 6; week <= 12; week++) {
        for (let day = 1; day <= 7; day++) {
          const intensity = 0.3 + (Math.random() * 0.4); // 0.3-0.7
          this.activityData[`${week}-${day}`] = intensity;
        }
      }
      
      // Semaines 13-20 : Activit� variable
      for (let week = 13; week <= 20; week++) {
        for (let day = 1; day <= 7; day++) {
          let intensity;
          if (week <= 15) {
            intensity = 0.2 + (Math.random() * 0.3); // 0.2-0.5
          } else {
            intensity = 0.1 + (Math.random() * 0.2); // 0.1-0.3
          }
          this.activityData[`${week}-${day}`] = intensity;
        }
      }
      
      // Marquer la case d'aujourd'hui (mardi de la semaine 20)
      // Mardi = jour 2, Semaine 20 = derni�re ligne
      this.activityData[`20-2`] = 0.9; // Activit� �lev�e pour aujourd'hui
    },

    // Classe CSS pour les cellules d'activit�
    getActivityClass(week, day) {
      const intensity = this.activityData[`${week}-${day}`] || 0;
      const level = intensity > 0.8 ? 4 : intensity > 0.6 ? 3 : intensity > 0.4 ? 2 : intensity > 0.2 ? 1 : 0;
      return `level-${level}`;
    },

    // Tooltip pour les cellules d'activit�
    getActivityTooltip(week, day) {
      const intensity = this.activityData[`${week}-${day}`] || 0;
      const quests = intensity > 0.2 ? Math.floor(intensity * 20) : 0;
      const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      return `${quests} qu�tes - S${this.getWeekNumber(week)} ${days[day - 1]}`;
    },

    // Calcul du num�ro de semaine r�aliste (semaine actuelle = 35)
    getWeekNumber(week) {
      // On part de la semaine 35 et on remonte de 19 semaines
      // Donc S1 = semaine 16, S2 = semaine 17, ..., S20 = semaine 35
      return 16 + (week - 1);
    },

               // Dessin du graphique XP avec axes et labels complets
           drawXPChart() {
             const canvas = this.$refs.xpChartCanvas;
             if (!canvas) return;
       
             const ctx = canvas.getContext('2d');
             const width = canvas.width = canvas.offsetWidth;
             const height = canvas.height = canvas.offsetHeight;
             
             // Marges pour les axes
             const margin = { top: 20, right: 20, bottom: 30, left: 40 };
             const chartWidth = width - margin.left - margin.right;
             const chartHeight = height - margin.top - margin.bottom;
             
             // Donn�es du graphique
             const data = [65, 60, 50, 40, 25, 18];
             const labels = ['-20j', '-15j', '-10j', '-5j', 'Auj.'];
             
             // Dessin du graphique
             ctx.clearRect(0, 0, width, height);
             
             // Grille de fond
             ctx.strokeStyle = '#374151';
             ctx.lineWidth = 0.5;
             ctx.globalAlpha = 0.3;
             for (let i = 0; i < chartWidth; i += 20) {
                ctx.beginPath();
                ctx.moveTo(margin.left + i, margin.top);
                ctx.lineTo(margin.left + i, margin.top + chartHeight);
                ctx.stroke();
             }
             for (let i = 0; i < chartHeight; i += 18) {
                ctx.beginPath();
                ctx.moveTo(margin.left, margin.top + i);
                ctx.lineTo(margin.left + chartWidth, margin.top + i);
                ctx.stroke();
             }
             
             // Axes principaux
             ctx.globalAlpha = 0.7;
             ctx.strokeStyle = '#6b7280';
             ctx.lineWidth = 1.5;
             
             // Axe X
             ctx.beginPath();
             ctx.moveTo(margin.left, margin.top + chartHeight);
             ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
             ctx.stroke();
             
             // Axe Y
             ctx.beginPath();
             ctx.moveTo(margin.left, margin.top);
             ctx.lineTo(margin.left, margin.top + chartHeight);
             ctx.stroke();
             
             // Labels Y (0, 5k, 10k, 15k)
             ctx.fillStyle = '#9ca3af';
             ctx.font = 'bold 10px Arial';
             ctx.textAlign = 'end';
             
             const yLabels = ['0', '5k', '10k', '15k'];
             yLabels.forEach((label, index) => {
               const y = margin.top + (chartHeight * index) / (yLabels.length - 1);
               ctx.fillText(label, margin.left - 5, y + 3);
             });
             
             // Labels X (-20j, -15j, -10j, -5j, Auj.)
             ctx.textAlign = 'center';
             ctx.font = 'bold 9px Arial';
             
             const stepX = chartWidth / (labels.length - 1);
             labels.forEach((label, index) => {
               const x = margin.left + index * stepX;
               const y = margin.top + chartHeight + 20;
               ctx.fillText(label, x, y);
             });
             
             // Courbe principale
             ctx.globalAlpha = 1;
             ctx.strokeStyle = '#06b6d4';
             ctx.lineWidth = 3;
             ctx.beginPath();
             
             data.forEach((value, index) => {
               const x = margin.left + (index * chartWidth) / (data.length - 1);
               const y = margin.top + chartHeight - (value / 100) * chartHeight;
               if (index === 0) {
                 ctx.moveTo(x, y);
               } else {
                 ctx.lineTo(x, y);
               }
             });
             
             ctx.stroke();
             
             // Points de donn�es
             data.forEach((value, index) => {
               const x = margin.left + (index * chartWidth) / (data.length - 1);
               const y = margin.top + chartHeight - (value / 100) * chartHeight;
               
               ctx.fillStyle = index === data.length - 1 ? '#ec4899' : '#06b6d4';
               ctx.beginPath();
               ctx.arc(x, y, 4, 0, 2 * Math.PI);
               ctx.fill();
               
               // Bordure blanche
               ctx.strokeStyle = '#ffffff';
               ctx.lineWidth = 1;
               ctx.stroke();
             });
           },

               // Dessin du radar chart des comp�tences avec labels
           drawSkillsChart() {
             const canvas = this.$refs.skillsCanvas;
             if (!canvas) return;
       
             const ctx = canvas.getContext('2d');
             const width = canvas.width = canvas.offsetWidth;
             const height = canvas.height = canvas.offsetHeight;
             const centerX = width / 2;
             const centerY = height / 2;
             const radius = Math.min(width, height) / 2 - 20;
       
             // Donn�es des comp�tences
             const skills = [
               { name: 'TECH', value: 0.9, angle: -Math.PI / 2 },
               { name: 'CODE', value: 0.8, angle: -Math.PI / 6 },
               { name: 'UI/UX', value: 0.7, angle: Math.PI / 6 },
               { name: 'MGMT', value: 0.5, angle: Math.PI / 2 },
               { name: 'COMM', value: 0.6, angle: 5 * Math.PI / 6 },
               { name: 'STRAT', value: 0.8, angle: -5 * Math.PI / 6 }
             ];
       
             // Grilles hexagonales
             ctx.strokeStyle = '#8b5cf6';
             ctx.lineWidth = 1;
             ctx.globalAlpha = 0.4;
             
             for (let level = 1; level <= 3; level++) {
               const currentRadius = (radius * level) / 3;
               ctx.beginPath();
               skills.forEach((skill, index) => {
                 const x = centerX + currentRadius * Math.cos(skill.angle);
                 const y = centerY + currentRadius * Math.sin(skill.angle);
                 if (index === 0) {
                   ctx.moveTo(x, y);
                 } else {
                   ctx.lineTo(x, y);
                 }
               });
               ctx.closePath();
               ctx.stroke();
             }
       
             // Donn�es utilisateur
             ctx.globalAlpha = 0.5;
             ctx.fillStyle = '#8b5cf6';
             ctx.strokeStyle = '#a855f7';
             ctx.lineWidth = 2.5;
             
             ctx.beginPath();
             skills.forEach((skill, index) => {
               const x = centerX + (radius * skill.value) * Math.cos(skill.angle);
               const y = centerY + (radius * skill.value) * Math.sin(skill.angle);
               if (index === 0) {
                 ctx.moveTo(x, y);
               } else {
                 ctx.lineTo(x, y);
               }
             });
             ctx.closePath();
             ctx.fill();
             ctx.stroke();
       
             // Points de comp�tences
             ctx.globalAlpha = 1;
             skills.forEach(skill => {
               const x = centerX + (radius * skill.value) * Math.cos(skill.angle);
               const y = centerY + (radius * skill.value) * Math.sin(skill.angle);
               
               ctx.fillStyle = '#a855f7';
               ctx.beginPath();
               ctx.arc(x, y, 2.5, 0, 2 * Math.PI);
               ctx.fill();
               
               ctx.strokeStyle = '#ffffff';
               ctx.lineWidth = 0.5;
               ctx.stroke();
             });
             
             // Labels des comp�tences
             ctx.fillStyle = '#a855f7';
             ctx.font = 'bold 12px Arial';
             ctx.textAlign = 'center';
             
             skills.forEach(skill => {
               const labelRadius = radius + 15;
               const x = centerX + labelRadius * Math.cos(skill.angle);
               const y = centerY + labelRadius * Math.sin(skill.angle);
               
               // Ajuster la position du texte selon l'angle
               if (skill.angle === -Math.PI / 2) { // TECH (haut)
                 ctx.textAlign = 'center';
                 ctx.textBaseline = 'bottom';
               } else if (skill.angle === -Math.PI / 6) { // CODE (haut-droite)
                 ctx.textAlign = 'start';
                 ctx.textBaseline = 'middle';
               } else if (skill.angle === Math.PI / 6) { // UI/UX (droite)
                 ctx.textAlign = 'start';
                 ctx.textBaseline = 'middle';
               } else if (skill.angle === Math.PI / 2) { // MGMT (bas)
                 ctx.textAlign = 'center';
                 ctx.textBaseline = 'top';
               } else if (skill.angle === 5 * Math.PI / 6) { // COMM (gauche)
                 ctx.textAlign = 'end';
                 ctx.textBaseline = 'middle';
               } else if (skill.angle === -5 * Math.PI / 6) { // STRAT (haut-gauche)
                 ctx.textAlign = 'end';
                 ctx.textBaseline = 'middle';
               }
               
                            ctx.fillText(skill.name, x, y);
           });
         },
         
         // Nouvelle m�thode pour dessiner le graphique des activit�s
         drawActivitiesChart() {
           const canvas = this.$refs.activitiesCanvas;
           if (!canvas) return;
           
           const ctx = canvas.getContext('2d');
           const width = canvas.width = canvas.offsetWidth;
           const height = canvas.height = canvas.offsetHeight;
           
           // Dessin d'un graphique en secteurs simple et compr�hensible
           ctx.clearRect(0, 0, width, height);
           
           const centerX = width / 2;
           const centerY = height / 2;
           const radius = Math.min(width, height) * 0.35;
           
           // Dessiner les secteurs pour chaque activit�
           let currentAngle = -Math.PI / 2; // Commencer en haut
           
           this.weeklyActivities.forEach((activity, index) => {
             const sliceAngle = (activity.percentage / 100) * 2 * Math.PI;
             
             ctx.beginPath();
             ctx.moveTo(centerX, centerY);
             ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
             ctx.closePath();
             
             // Couleur selon le type d'activit�
             ctx.fillStyle = this.getActivityColor(activity.type);
             ctx.fill();
             
             // Bordure
             ctx.strokeStyle = '#ffffff';
             ctx.lineWidth = 2;
             ctx.stroke();
             
             currentAngle += sliceAngle;
           });
           
           // Dessiner le centre
           ctx.fillStyle = '#1f2937';
           ctx.beginPath();
           ctx.arc(centerX, centerY, radius * 0.3, 0, 2 * Math.PI);
           ctx.fill();
           
           // Texte au centre
           ctx.fillStyle = '#ffffff';
           ctx.font = 'bold 16px Arial';
           ctx.textAlign = 'center';
           ctx.textBaseline = 'middle';
           ctx.fillText('TOTAL', centerX, centerY - 5);
           ctx.fillText(this.totalQuests, centerX, centerY + 10);
         },
         
         // M�thode pour obtenir la couleur selon le type d'activit�
         getActivityColor(type) {
           const colors = {
             reading: '#3b82f6',    // Bleu pour lecture
             sport: '#10b981',      // Vert pour sport
             learning: '#8b5cf6',   // Violet pour apprentissage
             household: '#f59e0b',  // Orange pour m�nage
             health: '#ef4444',     // Rouge pour sant�
             social: '#ec4899'      // Rose pour social
           };
           return colors[type] || '#6b7280';
         }
  }
};

// Enregistrement du composant
if (typeof window !== 'undefined') {
  window.ProjectionMatrixBlock = window.ProjectionMatrixBlock || {};
}
