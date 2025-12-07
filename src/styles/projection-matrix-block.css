/* ================ STYLES POUR LE BLOC PROJECTION MATRIX ================ */
/* ⚠️ ATTENTION: NE JAMAIS MODIFIER CE FICHIER - IMPLÉMENTATION FINALE VALIDÉE ⚠️ */
/* 🔒 VERSION: 1.0 FINALE - PROTÉGÉ CONTRE LES MODIFICATIONS 🔒 */

/* Bloc Projection Matrix */
.projection-matrix-card {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8));
  border: 1px solid #00ffff;
  border-radius: 16px;
  padding: 2px;
  position: relative;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  box-shadow: 
    0 0 30px rgba(0, 255, 255, 0.3),
    inset 0 0 40px rgba(139, 92, 246, 0.15);
  overflow: visible;
  min-height: 400px;
  width: 100% !important;
  grid-column: span 2 !important;
  display: block !important;
}

.projection-matrix-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 
    0 20px 40px rgba(0, 255, 255, 0.4),
    0 0 60px rgba(255, 0, 255, 0.2),
    inset 0 0 40px rgba(139, 92, 246, 0.25);
  border-color: #ff00ff;
}

/* Effet de glow d'arrière-plan renforcé */
.pm-background-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.12), rgba(139, 92, 246, 0.18), rgba(236, 72, 153, 0.12));
  animation: pulse 2s infinite;
  pointer-events: none;
}

/* Bordures lumineuses */
.pm-border-top {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #00ffff, transparent);
  animation: pulse 2s infinite;
}

.pm-border-bottom {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #8b5cf6, transparent);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Header compact */
.pm-header {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.pm-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pm-header-icon {
  padding: 8px;
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.3), rgba(34, 211, 238, 0.6));
  border: 1px solid rgba(34, 211, 238, 0.7);
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(34, 211, 238, 0.3);
  font-size: 20px;
}

.pm-title {
  font-size: 28px;
  font-weight: bold;
  background: linear-gradient(90deg, #00ffff, #8b5cf6, #ec4899);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  text-shadow: 0 0 20px rgba(34, 211, 238, 0.6);
  letter-spacing: 0.1em;
  margin: 0;
}

.pm-subtitle {
  color: rgba(34, 211, 238, 0.9);
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.05em;
  margin: 0;
}

.pm-neural-status {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(90deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2));
  padding: 8px 12px;
  border-radius: 20px;
  border: 1px solid rgba(34, 197, 94, 0.5);
}

.pm-status-dot {
  width: 8px;
  height: 8px;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse 2s infinite;
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.5);
}

.pm-neural-status span {
  color: #22c55e;
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 0.05em;
}

/* Layout horizontal principal - CORRECTION CRITIQUE */
.pm-main-layout {
  position: relative;
  z-index: 10;
  display: grid !important;
  grid-template-columns: 1fr 1fr 1.5fr !important;
  gap: 20px !important;
  min-height: 300px;
}

/* Colonne gauche */
.pm-left-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

/* Stats actuelles en 2x2 compactes - OPTIMISÉES POUR L'ESPACE */
.pm-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 16px;
}

.pm-stat-card {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(31, 41, 55, 0.6));
  border: 1px solid;
  border-radius: 8px;
  padding: 24px;
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.pm-stat-card:hover {
  transform: scale(1.05);
}

.pm-stat-level {
  border-color: rgba(34, 211, 238, 0.4);
  box-shadow: inset 0 0 15px rgba(34, 211, 238, 0.15);
}

.pm-stat-level:hover {
  border-color: rgba(34, 211, 238, 0.8);
  box-shadow: 0 8px 25px rgba(34, 211, 238, 0.2);
}

.pm-stat-xp {
  border-color: rgba(139, 92, 246, 0.4);
  box-shadow: inset 0 0 15px rgba(139, 92, 246, 0.15);
}

.pm-stat-xp:hover {
  border-color: rgba(139, 92, 246, 0.8);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.2);
}

.pm-stat-quests {
  border-color: rgba(236, 72, 153, 0.4);
  box-shadow: inset 0 0 15px rgba(236, 72, 153, 0.15);
}

.pm-stat-quests:hover {
  border-color: rgba(236, 72, 153, 0.8);
  box-shadow: 0 8px 25px rgba(236, 72, 153, 0.2);
}

.pm-stat-efficiency {
  border-color: rgba(34, 197, 94, 0.4);
  box-shadow: inset 0 0 15px rgba(34, 197, 94, 0.15);
}

.pm-stat-efficiency:hover {
  border-color: rgba(34, 197, 94, 0.8);
  box-shadow: 0 8px 25px rgba(34, 197, 94, 0.2);
}

.pm-stat-value {
  font-size: 26px;
  font-weight: bold;
  font-family: 'ui-monospace', monospace;
  margin-bottom: 10px;
  text-shadow: 0 0 15px currentColor;
}

.pm-stat-level .pm-stat-value {
  background: linear-gradient(180deg, #67e8f9, #06b6d4);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.pm-stat-xp .pm-stat-value {
  background: linear-gradient(180deg, #c084fc, #8b5cf6);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.pm-stat-quests .pm-stat-value {
  background: linear-gradient(180deg, #f9a8d4, #ec4899);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.pm-stat-efficiency .pm-stat-value {
  background: linear-gradient(180deg, #86efac, #22c55e);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.pm-stat-label {
  color: #9ca3af;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

/* Simulation interactive compacte - OPTIMISÉE POUR L'ESPACE */
.pm-simulator {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(31, 41, 55, 0.6));
  border: 1px solid rgba(234, 179, 8, 0.4);
  border-radius: 8px;
  padding: 24px;
  box-shadow: inset 0 0 15px rgba(234, 179, 8, 0.15);
  min-height: 160px;
  margin-bottom: 12px;
}

.pm-simulator-title {
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  color: #ffffff;
}

.pm-simulator-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pm-quest-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.pm-quest-item span {
  color: #9ca3af;
  font-size: 16px;
}

.pm-quest-btn {
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid;
}

.pm-quest-btn.pm-daily {
  background: rgba(34, 211, 238, 0.2);
  color: #00ffff;
  border-color: rgba(34, 211, 238, 0.5);
}

.pm-quest-btn.pm-daily:hover {
  background: rgba(34, 211, 238, 0.3);
  border-color: #00ffff;
}

.pm-quest-btn.pm-weekly {
  background: rgba(139, 92, 246, 0.2);
  color: #8b5cf6;
  border-color: rgba(139, 92, 246, 0.5);
}

.pm-quest-btn.pm-weekly:hover {
  background: rgba(139, 92, 246, 0.3);
  border-color: #8b5cf6;
}

.pm-simulator-stats {
  padding-top: 8px;
  border-top: 1px solid rgba(75, 85, 99, 0.3);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pm-stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
}

.pm-stat-row span:first-child {
  color: #9ca3af;
}

.pm-xp-per-day {
  color: #fbbf24;
  font-family: monospace;
  font-weight: 600;
}

.pm-days-to-next {
  color: #fb923c;
  font-family: monospace;
  font-weight: 600;
}

/* Projections rapides verticales - OPTIMISÉES POUR L'ESPACE */
.pm-projections {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  flex-grow: 1;
  margin-bottom: 12px;
}

.pm-projection-card {
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.pm-next-level {
  background: linear-gradient(90deg, rgba(34, 211, 238, 0.1), rgba(59, 130, 246, 0.1));
  border-color: rgba(34, 211, 238, 0.3);
}

.pm-year-projection {
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1));
  border-color: rgba(139, 92, 246, 0.3);
}

.pm-performance {
  background: linear-gradient(90deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.1));
  border-color: rgba(34, 197, 94, 0.3);
}

.pm-projection-value {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 8px;
}

.pm-next-level .pm-projection-value {
  color: #00ffff;
}

.pm-year-projection .pm-projection-value {
  color: #8b5cf6;
}

.pm-performance .pm-projection-value {
  color: #22c55e;
}

.pm-projection-date {
  color: #9ca3af;
  font-size: 13px;
}

/* Colonne centre */
.pm-center-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

/* Barre de progression principale - OPTIMISÉE POUR L'ESPACE */
.pm-progress-section {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(31, 41, 55, 0.6));
  border: 1px solid rgba(34, 211, 238, 0.4);
  border-radius: 8px;
  padding: 24px;
  box-shadow: inset 0 0 20px rgba(34, 211, 238, 0.15);
  min-height: 140px;
  margin-bottom: 12px;
}

.pm-progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 18px;
  color: #9ca3af;
  margin-bottom: 20px;
}

.pm-progress-header span:first-child {
  font-weight: 600;
}

.pm-progress-percentage {
  color: #00ffff;
  font-family: monospace;
}

.pm-progress-bar {
  width: 100%;
  background: #374151;
  border-radius: 8px;
  height: 20px;
  overflow: hidden;
  border: 1px solid rgba(34, 211, 238, 0.4);
  margin-bottom: 12px;
}

.pm-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ffff, #8b5cf6, #ec4899);
  border-radius: 8px;
  transition: width 1s ease-out;
  position: relative;
  box-shadow: 0 0 20px rgba(34, 211, 238, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.3);
}

.pm-progress-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.3), transparent);
  border-radius: 8px;
  animation: pulse 2s infinite;
}

.pm-progress-text {
  font-size: 14px;
  color: #9ca3af;
  text-align: center;
}

/* Modes IA compacts - OPTIMISÉS POUR L'ESPACE */
.pm-ai-control {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(31, 41, 55, 0.6));
  border: 1px solid rgba(249, 115, 22, 0.4);
  border-radius: 8px;
  padding: 28px;
  box-shadow: inset 0 0 20px rgba(249, 115, 22, 0.15);
  flex-grow: 1;
  min-height: 320px;
}

.pm-ai-title {
  font-size: 20px;
  font-weight: bold;
  background: linear-gradient(90deg, #fb923c, #ef4444);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  margin-bottom: 24px;
  text-align: center;
}

.pm-ai-modes {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.pm-mode-btn {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(34, 211, 238, 0.2));
  border: 1px solid rgba(59, 130, 246, 0.5);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
  cursor: pointer;
  text-align: center;
  min-height: 60px;
}

.pm-mode-btn:hover {
  border-color: rgba(59, 130, 246, 0.8);
  transform: translateY(-2px);
}

.pm-mode-btn.active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(236, 72, 153, 0.4));
  border: 2px solid rgba(139, 92, 246, 0.8);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.5);
}

.pm-mode-name {
  font-size: 18px;
  font-weight: bold;
  color: #67e8f9;
  margin-bottom: 8px;
}

.pm-mode-btn.active .pm-mode-name {
  color: #f1f5f9;
}

.pm-mode-desc {
  font-size: 14px;
  color: #9ca3af;
}

.pm-mode-btn.active .pm-mode-desc {
  color: #d1d5db;
}

.pm-mode-btn.pm-secure .pm-mode-name {
  color: #67e8f9;
}

.pm-mode-btn.pm-extreme .pm-mode-name {
  color: #fca5a5;
}

/* Mini sliders optimisés */
.pm-sliders {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.pm-slider-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pm-slider-header {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #9ca3af;
  margin-bottom: 12px;
}

.pm-slider-value {
  color: #00ffff;
  font-family: monospace;
}

.pm-range-slider {
  width: 100%;
  height: 16px;
  background: #4b5563;
  border-radius: 6px;
  appearance: none;
  cursor: pointer;
}

.pm-range-slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  background: #00ffff;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
}

.pm-range-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #00ffff;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
}

/* Colonne droite */
.pm-right-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

/* Graphique XP - 30 jours amélioré - OPTIMISÉ POUR L'ESPACE */
.pm-xp-chart {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(31, 41, 55, 0.7));
  border: 1px solid rgba(34, 211, 238, 0.5);
  border-radius: 8px;
  padding: 16px;
  box-shadow: inset 0 0 25px rgba(34, 211, 238, 0.15);
  min-height: 280px;
  margin-bottom: 12px;
}

.pm-chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.pm-chart-header h4 {
  font-size: 20px;
  font-weight: bold;
  background: linear-gradient(90deg, #67e8f9, #3b82f6);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  margin: 0;
}

.pm-chart-trend {
  font-size: 12px;
  background: rgba(34, 197, 94, 0.2);
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid rgba(34, 197, 94, 0.5);
}

.pm-chart-trend span {
  color: #22c55e;
  font-weight: bold;
}

.pm-chart-container {
  height: 160px;
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(34, 211, 238, 0.3);
  padding: 12px;
  margin-bottom: 20px;
}

.pm-chart-canvas {
  width: 100%;
  height: 100%;
}

.pm-chart-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.pm-metric-item {
  text-align: center;
  padding: 8px;
  background: rgba(20, 30, 50, 0.8);
  border-radius: 6px;
  border: 1px solid rgba(34, 211, 238, 0.3);
  min-height: 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.pm-metric-label {
  color: #9ca3af;
  font-size: 12px;
  margin-bottom: 8px;
}

.pm-metric-value {
  font-size: 18px;
  font-weight: bold;
  font-family: monospace;
}

.pm-metric-item:nth-child(1) .pm-metric-value {
  color: #00ffff;
}

.pm-metric-item:nth-child(2) .pm-metric-value {
  color: #8b5cf6;
}

.pm-metric-item:nth-child(3) .pm-metric-value {
  color: #3b82f6;
}

.pm-metric-item:nth-child(4) .pm-metric-value {
  color: #ec4899;
}

/* Section graphiques inférieurs - OPTIMISÉE POUR L'ESPACE */
.pm-bottom-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  min-height: 450px;
  width: 100%;
  max-width: none;
}

/* Bloc Activités via Quêtes - Version Compacte */
.pm-skills-chart {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(31, 41, 55, 0.7));
  border: 1px solid rgba(34, 197, 94, 0.5);
  border-radius: 8px;
  padding: 0;
  box-shadow: inset 0 0 25px rgba(34, 197, 94, 0.15);
  display: flex;
  flex-direction: column;
  min-height: 600px;
}

.pm-skills-chart h4 {
  font-size: 18px;
  font-weight: bold;
  background: linear-gradient(90deg, #22c55e, #10b981);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  margin-bottom: 20px;
  text-align: center;
  flex-shrink: 0;
}

/* Métriques principales en haut */
.pm-activities-top-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.pm-top-metric {
  text-align: center;
  padding: 6px 4px;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(34, 197, 94, 0.3);
  position: relative;
  min-height: 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.pm-top-value {
  font-size: 18px;
  font-weight: bold;
  color: #22c55e;
  margin-bottom: 3px;
  text-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
}

.pm-top-label {
  font-size: 9px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.pm-top-subtitle {
  font-size: 8px;
  color: #6b7280;
  font-weight: 500;
}

/* Vrai graphique en barres verticales */
.pm-activities-chart-compact {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  min-height: 400px;
  justify-content: center;
}

.pm-activities-chart-compact h5 {
  font-size: 11px;
  color: #ffffff;
  margin-bottom: 8px;
  text-align: center;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pm-chart-container {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 280px;
  width: 100%;
  padding: 0;
  position: relative;
}

.pm-bars-container {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  flex: 1;
  height: 100%;
  justify-content: center;
}

.pm-bar-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
  max-width: 24px;
}

.pm-bar-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-end;
}

.pm-bar {
  width: 100%;
  border-radius: 6px 6px 0 0;
  transition: all 0.3s ease;
  min-height: 20px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.3);
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.pm-bar-value {
  position: absolute;
  top: -40px;
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.8);
  padding: 4px 10px;
  border-radius: 5px;
  white-space: nowrap;
}

.pm-bar-label {
  font-size: 11px;
  color: #d1d5db;
  font-weight: 600;
  text-align: center;
  line-height: 1.3;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 4px;
}

.pm-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  margin-right: 15px;
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.pm-axis-label {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  text-align: center;
}

.pm-x-axis-label {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 16px;
  text-align: center;
}

/* Statistiques détaillées */
.pm-quest-stats {
  margin-bottom: 8px;
  flex-shrink: 0;
}

.pm-stat-row {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
}

.pm-stat-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 6px;
  border: 1px solid rgba(34, 197, 94, 0.4);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  min-height: 30px;
}

.pm-stat-icon {
  font-size: 14px;
  flex-shrink: 0;
  opacity: 0.9;
}

.pm-stat-text {
  font-size: 10px;
  color: #ffffff;
  font-weight: 600;
  line-height: 1.2;
}

/* Tendances compactes en bas */
.pm-trends-compact {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  flex-shrink: 0;
}

.pm-trend-compact {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 4px 6px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  border: 1px solid rgba(34, 197, 94, 0.2);
  transition: all 0.2s ease;
  min-height: 25px;
}

.pm-trend-compact:hover {
  background: rgba(0, 0, 0, 0.4);
  border-color: rgba(34, 197, 94, 0.4);
  transform: translateY(-1px);
}

.pm-trend-icon-small {
  font-size: 12px;
  opacity: 0.9;
}

.pm-trend-name-small {
  font-size: 9px;
  color: #ffffff;
  font-weight: 500;
  flex: 1;
}

.pm-trend-change-small {
  font-size: 9px;
  font-weight: 700;
}

.pm-trend-change-small.positive {
  color: #10b981;
}

.pm-trend-change-small.negative {
  color: #ef4444;
}



/* Heatmap Activité améliorée */
.pm-activity-chart {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(31, 41, 55, 0.7));
  border: 1px solid rgba(34, 197, 94, 0.5);
  border-radius: 8px;
  padding: 10px;
  box-shadow: inset 0 0 25px rgba(34, 94, 197, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 450px;
  width: 100%;
  max-width: none;
}

.pm-activity-chart h4 {
  font-size: 18px;
  font-weight: bold;
  background: linear-gradient(90deg, #86efac, #16a34a);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  margin-bottom: 20px;
  text-align: center;
  flex-shrink: 0;
}

.pm-activity-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 500px;
  padding: 0 0 0 20px;
  margin: 0;
  width: 90%;
  max-width: 400px;
  overflow: visible;
}

.pm-activity-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  font-size: 10px;
  color: #9ca3af;
  margin-bottom: 12px;
  padding: 0;
  width: 100%;
  text-align: center;
  max-width: none;
  gap: 2px;
}

.pm-day-label {
  position: absolute;
  text-align: center;
  font-weight: 600;
  width: 14px;
  transform: translateX(-50%);
}



.pm-activity-weeks {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  width: 100%;
  padding: 0;
  max-width: none;
}

.pm-week-row {
  position: relative;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  align-items: center;
  gap: 2px;
  width: 100%;
  margin: 0;
  padding: 0;
  max-width: none;
}

.pm-week-label {
  position: absolute;
  left: -20px;
  font-size: 9px;
  color: #6b7280;
  font-family: monospace;
  width: 18px;
  text-align: right;
}

.pm-activity-cell {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid rgba(75, 85, 99, 0.4);
  transition: all 0.3s ease;
  cursor: pointer;
  justify-self: center;
  max-width: none;
  min-width: 16px;
}

.pm-activity-cell.level-0 {
  background: rgba(75, 85, 99, 0.8);
}

.pm-activity-cell.level-1 {
  background: rgba(34, 197, 94, 0.4);
  box-shadow: 0 0 5px rgba(34, 197, 94, 0.2);
}

.pm-activity-cell.level-2 {
  background: rgba(34, 197, 94, 0.6);
  box-shadow: 0 0 5px rgba(34, 197, 94, 0.4);
}

.pm-activity-cell.level-3 {
  background: rgba(34, 197, 94, 0.8);
  box-shadow: 0 0 5px rgba(34, 197, 94, 0.6);
}

.pm-activity-cell.level-4 {
  background: #22c55e;
  box-shadow: 0 0 5px rgba(34, 197, 94, 0.8);
}

.pm-activity-cell:hover {
  transform: scale(1.5);
}

.pm-activity-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
  font-size: 12px;
  color: #9ca3af;
  width: 100%;
  max-width: none;
  padding: 0 10px;
}

.pm-legend-dots {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(0, 0, 0, 0.4);
  padding: 5px 12px;
  border-radius: 20px;
  border: 1px solid rgba(75, 85, 99, 0.4);
  margin: 0 4px;
  width: 100%;
  max-width: none;
}

.pm-legend-dot {
  width: 7px;
  height: 7px;
  border-radius: 2px;
}

.pm-legend-dot.level-0 {
  background: rgba(75, 85, 99, 0.8);
}

.pm-legend-dot.level-1 {
  background: rgba(34, 197, 94, 0.4);
}

.pm-legend-dot.level-2 {
  background: rgba(34, 197, 94, 0.6);
}

.pm-legend-dot.level-3 {
  background: rgba(34, 197, 94, 0.8);
}

.pm-legend-dot.level-4 {
  background: #22c55e;
}

.pm-activity-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 15px;
  flex-shrink: 0;
  width: 100%;
  max-width: none;
  padding: 0 10px;
}

.pm-activity-metric {
  text-align: center;
  padding: 4px;
  background: rgba(34, 197, 94, 0.15);
  border-radius: 4px;
  min-height: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  max-width: none;
}

.pm-activity-label {
  color: #9ca3af;
  font-size: 12px;
  margin-bottom: 4px;
}

.pm-activity-value {
  color: #22c55e;
  font-weight: bold;
  font-size: 14px;
}

/* Effets de lumière d'angle renforcés - SUPPRIMÉS POUR PLUS DE PROPRETÉ */
/* Les cercles décoratifs ont été supprimés car ils étaient inutiles et moche */

/* Responsive */
@media (max-width: 1200px) {
  .pm-main-layout {
    grid-template-columns: 1fr !important;
    gap: 16px !important;
  }
  
  .pm-bottom-charts {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .pm-header {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
  
  .pm-stats-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .pm-ai-modes {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
