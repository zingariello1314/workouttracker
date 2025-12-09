/* ================ SIDEBAR PREMIUM STYLES ================ */

.sidebar-premium {
  width: 18.75rem; /* 300px -> 18.75rem */
  min-height: fit-content;
  max-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  border: 0.125rem solid rgba(255, 215, 0, 0.2); /* 2px -> 0.125rem */
  border-radius: 0 0.75rem 0.75rem 0; /* 12px -> 0.75rem */
  backdrop-filter: blur(0.9375rem); /* 15px -> 0.9375rem */
  flex-shrink: 0;
  position: relative;
  z-index: 900;
  padding: 0.625rem; /* 10px -> 0.625rem */
  box-shadow: 0.125rem 0 1.875rem rgba(0, 0, 0, 0.5); /* 2px 0 30px -> 0.125rem 0 1.875rem */
  overflow: hidden;
}

/* ================ ZONE LASER CYBERPUNK ================ */
.sidebar-laser-zone {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  z-index: 50; /* doit passer devant l'horloge */
  pointer-events: none;
  overflow: hidden;
  border-radius: 0 0.75rem 0 0;
}

/* ================ HORLOGE & STATUT GLOBAL ================ */
.clock-section {
  padding: 1rem 0.9375rem; /* 16px 15px -> 1rem 0.9375rem */
  background: linear-gradient(135deg, rgba(10, 10, 15, 0.95) 0%, rgba(5, 5, 10, 0.98) 100%);
  border-bottom: 0.0625rem solid rgba(255, 215, 0, 0.3); /* 1px -> 0.0625rem */
  position: relative;
  overflow: visible;
  margin: -0.625rem -0.625rem 0 -0.625rem; /* -10px -> -0.625rem */
  min-height: 6.25rem; /* 100px -> 6.25rem */
  z-index: 10; /* en dessous du laser pour laisser apparaître le faisceau */
  border-radius: 0 0.75rem 0 0; /* 12px -> 0.75rem */
}

/* Le laser appartient visuellement au bloc heure et s'échappe par le haut */
.time-date-block {
  position: relative;
  overflow: visible;
}

.time-laser-overflow {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 20px); /* Largeur du bloc heure - marges réduites */
  bottom: calc(100% - 22px); /* Base au bon niveau du bloc heure */
  height: 140px; /* Hauteur ajustée */
  pointer-events: none;
  z-index: 40; /* sous le texte mais au-dessus des fonds */
}

.time-laser-overflow .laser-flow-container,
.time-laser-overflow canvas {
  width: 100%;
  height: 100%;
  display: block;
  mix-blend-mode: screen;
  opacity: 0.85;
  border-radius: 15px 15px 0 0; /* Épouse les coins arrondis du bloc */
  overflow: hidden;
}

.clock-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.05), transparent);
  animation: pulse 3s ease-in-out infinite;
}

.clock-container {
  position: relative;
  z-index: 10;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 5rem; /* 80px -> 5rem */
}

/* ================ BLOC ENCADRÉ HEURE/DATE ================ */
.time-date-block {
  background: linear-gradient(135deg, 
    rgba(255, 20, 147, 0.15) 0%,
    rgba(255, 140, 0, 0.1) 50%,
    rgba(255, 215, 0, 0.15) 100%);
  border: 2px solid #ffd700;
  border-radius: 15px;
  padding: 12px 15px;
  margin: 70px 0 45px 0;
  position: relative;
  backdrop-filter: blur(10px);
  box-shadow: 
    0 0 20px rgba(255, 215, 0, 0.3),
    0 4px 15px rgba(255, 215, 0, 0.2),
    inset 0 0 20px rgba(255, 215, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.time-display {
  position: relative;
  margin-bottom: 0.5rem; /* Espace normal entre heure et date */
  padding: 0 0.625rem; /* 10px -> 0.625rem */
  min-width: 12.5rem; /* 200px -> 12.5rem */
}

.time-main {
  font-family: 'Tanker', 'Rajdhani', sans-serif;
  font-size: 2.4rem;
  font-weight: 400;
  letter-spacing: 0.02em;
  background: linear-gradient(180deg,
    /* Dégradé magenta vers doré comme le logo */
    #ff1493 0%,
    #ff8c00 50%,
    #ffd700 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 1.25rem rgba(255, 20, 147, 0.4);
  line-height: 1.1;
  white-space: nowrap;
  overflow: visible;
  margin: 0;
}

.time-shadow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  font-family: 'Tanker', 'Rajdhani', sans-serif;
  font-size: 2.6rem;
  font-weight: 400;
  letter-spacing: 0.05em;
  background: linear-gradient(180deg,
    /* Dégradé magenta vers doré comme le logo */
    #ff1493 0%,
    #ff8c00 50%,
    #ffd700 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  opacity: 0.2;
  filter: blur(0.125rem);
  z-index: -1;
}

.time-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  font-family: 'Tanker', 'Rajdhani', sans-serif;
  font-size: 2.6rem;
  font-weight: 400;
  letter-spacing: 0.05em;
  background: linear-gradient(180deg,
    /* Dégradé magenta vers doré comme le logo */
    #ff1493 0%,
    #ff8c00 50%,
    #ffd700 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  opacity: 0.4;
  filter: blur(0.25rem);
  z-index: -2;
}

.time-date-block .date-display {
  position: relative;
  margin-bottom: 0;
  margin-top: 0;
  padding: 0 0.625rem;
  text-align: center;
}

.date-main {
  font-family: 'Tanker', 'Rajdhani', sans-serif;
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: linear-gradient(180deg,
    /* Dégradé magenta vers doré comme le logo */
    #ff1493 0%,
    #ff8c00 50%,
    #ffd700 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 0.8rem rgba(255, 20, 147, 0.3);
}

.date-shadow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  font-family: 'Tanker', 'Rajdhani', sans-serif;
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.1);
  filter: blur(0.0625rem);
  z-index: -1;
}

.date-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  font-family: 'Tanker', 'Rajdhani', sans-serif;
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: linear-gradient(180deg,
    /* Dégradé magenta vers doré comme le logo */
    #ff1493 0%,
    #ff8c00 50%,
    #ffd700 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  opacity: 0.3;
  filter: blur(0.2rem);
  z-index: -2;
}

.date-underline {
  height: 0.0625rem;
  background: linear-gradient(90deg, transparent, rgba(255, 20, 147, 0.6), transparent);
  margin-top: 0.5rem;
  box-shadow: 0 0 0.5rem rgba(255, 20, 147, 0.3);
}

.system-status {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem; /* 8px -> 0.5rem */
  margin-top: 2.8rem; /* Équidistant de la carte de profil */
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.375rem; /* 6px -> 0.375rem */
  padding: 0.5rem; /* 8px -> 0.5rem */
  border-radius: 0.375rem; /* 6px -> 0.375rem */
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03125rem; /* 0.5px -> 0.03125rem */
}

.status-item.active {
  background: rgba(34, 197, 94, 0.2);
  border: 0.0625rem solid rgba(34, 197, 94, 0.3); /* 1px -> 0.0625rem */
  color: #22c55e;
}

.status-item.night {
  background: rgba(59, 130, 246, 0.2);
  border: 0.0625rem solid rgba(59, 130, 246, 0.3); /* 1px -> 0.0625rem */
  color: #3b82f6;
}

.status-item.connected {
  background: rgba(168, 85, 247, 0.2);
  border: 0.0625rem solid rgba(168, 85, 247, 0.3); /* 1px -> 0.0625rem */
  color: #a855f7;
}

.status-item.focus {
  background: rgba(34, 197, 94, 0.2);
  border: 0.0625rem solid rgba(34, 197, 94, 0.3); /* 1px -> 0.0625rem */
  color: #22c55e;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse-dot 2s ease-in-out infinite;
}

.status-icon {
  font-size: 0.8rem;
}

/* ================ CONTENU SIDEBAR ================ */
.sidebar-content {
  flex: 1;
  padding: 8px 0;
  margin: 0 -10px;
  overflow-y: visible;
}

/* ================ FERMETURE SIDEBAR ================ */
.sidebar-footer {
  padding: 15px;
  background: linear-gradient(135deg, rgba(5, 5, 10, 0.98) 0%, rgba(10, 10, 15, 0.95) 100%);
  border-top: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 0 0 12px 0;
  margin: 0 -10px -10px -10px;
  position: relative;
  overflow: hidden;
}

.sidebar-footer::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(0, 245, 255, 0.05), transparent);
  animation: pulse 3s ease-in-out infinite;
}

.footer-content {
  position: relative;
  z-index: 10;
  text-align: center;
}

.footer-text {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.sidebar-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: rgba(0, 245, 255, 0.3);
  border-radius: 3px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 245, 255, 0.5);
}

/* ================ SECTIONS ================ */
.section-container {
  margin-bottom: 8px;
  background: linear-gradient(135deg, 
    rgba(255, 20, 147, 0.08) 0%,
    rgba(15, 15, 25, 0.6) 30%,
    rgba(255, 140, 0, 0.05) 70%,
    rgba(255, 215, 0, 0.08) 100%
  );
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  overflow: hidden;
  margin-left: 10px;
  margin-right: 10px;
  box-shadow: 
    0 2px 8px rgba(255, 20, 147, 0.1),
    inset 0 1px 0 rgba(255, 215, 0, 0.1);
}

.section-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 6px 8px !important;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, 
    rgba(255, 20, 147, 0.1) 0%,
    rgba(255, 140, 0, 0.05) 50%,
    rgba(255, 215, 0, 0.08) 100%
  ) !important;
  margin: 0 !important;
  min-height: 28px !important;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3) !important;
  position: relative;
  overflow: hidden;
}

.section-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 20, 147, 0.2), 
    rgba(255, 140, 0, 0.1),
    transparent
  );
  transition: left 0.6s ease;
  z-index: 1;
}

.section-header:hover::before {
  left: 100%;
}

.section-header:hover {
  background: linear-gradient(135deg, 
    rgba(255, 20, 147, 0.15) 0%,
    rgba(255, 140, 0, 0.08) 50%,
    rgba(255, 215, 0, 0.12) 100%
  );
  border-bottom-color: rgba(255, 215, 0, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 20, 147, 0.2);
}

.section-title {
  font-size: 0.75rem !important;
  font-weight: 800 !important;
  text-transform: uppercase;
  letter-spacing: 0.8px !important;
  margin: 0 !important;
  line-height: 1 !important;
  background: linear-gradient(180deg,
    #ff1493 0%,
    #ff8c00 50%,
    #ffd700 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 8px rgba(255, 20, 147, 0.6) !important;
  position: relative;
  z-index: 2;
}

.section-toggle {
  font-size: 0.7rem !important;
  color: #ff1493 !important;
  transition: all 0.3s ease;
  text-shadow: 0 0 6px rgba(255, 20, 147, 0.5) !important;
  background: linear-gradient(135deg,
    rgba(255, 20, 147, 0.1) 0%,
    rgba(255, 140, 0, 0.05) 50%,
    rgba(255, 215, 0, 0.08) 100%
  ) !important;
  border: 1px solid rgba(255, 215, 0, 0.3) !important;
  border-radius: 4px !important;
  padding: 2px 6px !important;
  font-weight: 600 !important;
}

.section-badge {
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge-count {
  background: rgba(255, 20, 147, 0.2);
  background: linear-gradient(180deg,
    rgba(255, 20, 147, 0.3) 0%,
    rgba(255, 140, 0, 0.2) 50%,
    rgba(255, 215, 0, 0.3) 100%
  );
  color: #ff1493;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 700;
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.badge-count.pulse {
  animation: pulse-badge 2s ease-in-out infinite;
}

.section-content {
  padding: 8px 10px;
  border-top: 1px solid rgba(255, 215, 0, 0.15);
  margin: 0;
  background: linear-gradient(135deg, 
    rgba(255, 20, 147, 0.03) 0%,
    rgba(0, 0, 0, 0.1) 50%,
    rgba(255, 140, 0, 0.02) 100%
  );
}

/* ================ ACTIONS RAPIDES - VERSION PREMIUM ================ */

/* Grille principale - 2x2 uniforme */
.actions-main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 10px;
  margin: 0 0 10px 0;
}

/* Boutons principaux - Style premium */
.action-btn-premium {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 18px 12px 10px;
  border-radius: 8px;
  border: 2px solid;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  min-height: 55px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  width: 100%;
  box-sizing: border-box;
}

.action-btn-premium:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
}

.action-btn-premium:active {
  transform: translateY(-1px) scale(0.98);
}

/* Icônes des boutons principaux */
.action-btn-premium .btn-icon {
  font-size: 1.8rem;
  filter: drop-shadow(0 0 8px currentColor);
  z-index: 2;
  position: relative;
}

/* Texte des boutons principaux */
.action-btn-premium .btn-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  z-index: 2;
  position: relative;
  flex: 1;
  min-width: 0;
  text-align: left;
  margin-left: 8px;
  padding-right: 16px;
  max-width: calc(100% - 24px);
}

.action-btn-premium .btn-title {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.2px;
  line-height: 1.1;
  margin-bottom: 2px;
  text-align: left;
  white-space: nowrap;
}

.action-btn-premium .btn-subtitle {
  font-size: 0.6rem;
  opacity: 0.8;
  font-weight: 500;
  line-height: 1.2;
  text-align: left;
  white-space: nowrap;
}

/* Couleurs spécifiques pour chaque type */
.action-btn-premium.focus {
  border-color: #ff6b35;
  color: #ff6b35;
  background: linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 107, 53, 0.05));
  box-shadow: 0 4px 20px rgba(255, 107, 53, 0.2);
}

.action-btn-premium.focus:hover {
  box-shadow: 0 12px 30px rgba(255, 107, 53, 0.4);
  border-color: #ff8c42;
}

.action-btn-premium.read {
  border-color: #00d4ff;
  color: #00d4ff;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 212, 255, 0.05));
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.2);
}

.action-btn-premium.read:hover {
  box-shadow: 0 12px 30px rgba(0, 212, 255, 0.4);
  border-color: #33dfff;
}

.action-btn-premium.sport {
  border-color: #bf00ff;
  color: #bf00ff;
  background: linear-gradient(135deg, rgba(191, 0, 255, 0.1), rgba(191, 0, 255, 0.05));
  box-shadow: 0 4px 20px rgba(191, 0, 255, 0.2);
}

.action-btn-premium.sport:hover {
  box-shadow: 0 12px 30px rgba(191, 0, 255, 0.4);
  border-color: #cc33ff;
}

.action-btn-premium.quest {
  border-color: #00ff88;
  color: #00ff88;
  background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 136, 0.05));
  box-shadow: 0 4px 20px rgba(0, 255, 136, 0.2);
}

.action-btn-premium.quest:hover {
  box-shadow: 0 12px 30px rgba(0, 255, 136, 0.4);
  border-color: #33ff99;
}

/* Ligne d'actions secondaires */
.actions-mini-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 6px;
  margin: 0;
}

/* Boutons secondaires - Style compact */
.mini-btn-premium {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 6px;
  border-radius: 8px;
  border: 1px solid;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  min-height: 45px;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(8px);
  width: 100%;
  box-sizing: border-box;
}

.mini-btn-premium:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.mini-btn-premium .mini-icon {
  font-size: 1.2rem;
  filter: drop-shadow(0 0 6px currentColor);
  z-index: 2;
  position: relative;
}

.mini-btn-premium .mini-text {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  z-index: 2;
  position: relative;
  text-align: center;
  line-height: 1;
}

/* Couleurs pour les boutons secondaires */
.mini-btn-premium.income {
  border-color: #ffd700;
  color: #ffd700;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05));
}

.mini-btn-premium.movie {
  border-color: #ff6b9d;
  color: #ff6b9d;
  background: linear-gradient(135deg, rgba(255, 107, 157, 0.1), rgba(255, 107, 157, 0.05));
}

.mini-btn-premium.journal {
  border-color: #ff8c42;
  color: #ff8c42;
  background: linear-gradient(135deg, rgba(255, 140, 66, 0.1), rgba(255, 140, 66, 0.05));
}

.mini-btn-premium.meditation {
  border-color: #9d4edd;
  color: #9d4edd;
  background: linear-gradient(135deg, rgba(157, 78, 221, 0.1), rgba(157, 78, 221, 0.05));
}

/* Effet de brillance au survol */
.action-btn-premium::before,
.mini-btn-premium::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.6s ease;
  z-index: 1;
}

.action-btn-premium:hover::before,
.mini-btn-premium:hover::before {
  left: 100%;
}

/* ================ MÉTRIQUES VITALES ================ */
.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 20px;
  margin: 0 -10px 20px -10px;
}

/* Métriques principales - 2x2 grid */
.metrics-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 10px;
}

/* Métriques secondaires - 1x2 grid */
.metrics-secondary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 50px;
  position: relative;
}

/* Séparateur visuel entre les sections */
.metrics-secondary::before {
  content: '';
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent 0%,
    rgba(255, 20, 147, 0.4) 20%,
    rgba(255, 140, 0, 0.4) 50%,
    rgba(255, 215, 0, 0.4) 80%,
    transparent 100%
  );
  box-shadow: 0 0 12px rgba(255, 20, 147, 0.3);
  border-radius: 1px;
}

.metric-card {
  padding: 12px 8px;
  border-radius: 12px;
  text-align: center;
  border: 2px solid;
  margin: 0 10px;
  background: linear-gradient(135deg, 
    rgba(0, 0, 0, 0.6) 0%,
    rgba(20, 20, 30, 0.8) 100%
  );
  backdrop-filter: blur(15px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.05) 0%,
    transparent 50%,
    rgba(255, 255, 255, 0.02) 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 
    0 12px 30px rgba(0, 0, 0, 0.4),
    0 0 20px currentColor;
}

.metric-card:hover::before {
  opacity: 1;
}

.metric-card.orange {
  background: linear-gradient(135deg, 
    rgba(255, 140, 0, 0.15) 0%,
    rgba(0, 0, 0, 0.6) 50%,
    rgba(255, 140, 0, 0.05) 100%
  );
  border-color: #ff8c00;
  color: #ff8c00;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.3),
    0 0 15px rgba(255, 140, 0, 0.2),
    inset 0 1px 0 rgba(255, 140, 0, 0.1);
}

.metric-card.cyan {
  background: linear-gradient(135deg, 
    rgba(255, 20, 147, 0.15) 0%,
    rgba(0, 0, 0, 0.6) 50%,
    rgba(255, 20, 147, 0.05) 100%
  );
  border-color: #ff1493;
  color: #ff1493;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.3),
    0 0 15px rgba(255, 20, 147, 0.2),
    inset 0 1px 0 rgba(255, 20, 147, 0.1);
}

.metric-card.yellow {
  background: linear-gradient(135deg, 
    rgba(255, 215, 0, 0.15) 0%,
    rgba(0, 0, 0, 0.6) 50%,
    rgba(255, 215, 0, 0.05) 100%
  );
  border-color: #ffd700;
  color: #ffd700;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.3),
    0 0 15px rgba(255, 215, 0, 0.2),
    inset 0 1px 0 rgba(255, 215, 0, 0.1);
}

.metric-card.purple {
  background: linear-gradient(135deg, 
    rgba(168, 85, 247, 0.15) 0%,
    rgba(0, 0, 0, 0.6) 50%,
    rgba(168, 85, 247, 0.05) 100%
  );
  border-color: #a855f7;
  color: #a855f7;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.3),
    0 0 15px rgba(168, 85, 247, 0.2),
    inset 0 1px 0 rgba(168, 85, 247, 0.1);
}

.metric-value {
  font-size: 1.6rem;
  font-weight: 900;
  margin-bottom: 6px;
  text-shadow: 0 0 15px currentColor;
  font-family: 'Rajdhani', sans-serif;
  letter-spacing: 0.5px;
}

.metric-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.9;
  text-shadow: 0 0 8px currentColor;
}

/* Métriques principales - Plus grandes et visibles */
.metrics-main .metric-card {
  padding: 20px 16px;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px;
}

.metrics-main .metric-value {
  font-size: 2rem;
  font-weight: 900;
  margin-bottom: 8px;
  text-shadow: 0 0 20px currentColor;
  font-family: 'Rajdhani', sans-serif;
  letter-spacing: 1px;
}

.metrics-main .metric-label {
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  opacity: 1;
  text-shadow: 0 0 10px currentColor;
  margin-bottom: 4px;
}

.metrics-main .metric-description {
  font-size: 0.6rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  opacity: 0.7;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 0 0 4px rgba(255, 255, 255, 0.3);
  line-height: 1.2;
}

/* Métriques secondaires - Plus compactes */
.metrics-secondary .metric-card {
  padding: 16px 12px;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px;
}

.metrics-secondary .metric-value {
  font-size: 1.4rem;
  font-weight: 800;
  margin-bottom: 4px;
  text-shadow: 0 0 12px currentColor;
  font-family: 'Rajdhani', sans-serif;
  letter-spacing: 0.5px;
}

.metrics-secondary .metric-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.9;
  text-shadow: 0 0 6px currentColor;
  margin-bottom: 2px;
}

.metrics-secondary .metric-description {
  font-size: 0.55rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  opacity: 0.6;
  color: rgba(255, 255, 255, 0.7);
  text-shadow: 0 0 3px rgba(255, 255, 255, 0.2);
  line-height: 1.1;
}

.health-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 0 -10px 35px -10px;
  position: relative;
}

/* Titre pour la section santé */
.health-metrics::before {
  content: 'INDICATEURS VITAUX';
  position: absolute;
  top: -45px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255, 20, 147, 0.8);
  text-shadow: 0 0 6px rgba(255, 20, 147, 0.4);
  background: linear-gradient(90deg,
    rgba(255, 20, 147, 0.1) 0%,
    rgba(255, 140, 0, 0.1) 50%,
    rgba(255, 215, 0, 0.1) 100%
  );
  padding: 4px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 20, 147, 0.2);
  box-shadow: 0 2px 8px rgba(255, 20, 147, 0.1);
}

.health-card {
  padding: 16px 12px;
  border-radius: 12px;
  border: 2px solid;
  margin: 0 10px;
  background: linear-gradient(135deg, 
    rgba(0, 0, 0, 0.6) 0%,
    rgba(20, 20, 30, 0.8) 100%
  );
  backdrop-filter: blur(15px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  min-height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.health-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.05) 0%,
    transparent 50%,
    rgba(255, 255, 255, 0.02) 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.health-card:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 
    0 12px 30px rgba(0, 0, 0, 0.4),
    0 0 20px currentColor;
}

.health-card:hover::before {
  opacity: 1;
}

.health-card.red {
  background: linear-gradient(135deg, 
    rgba(239, 68, 68, 0.15) 0%,
    rgba(0, 0, 0, 0.6) 50%,
    rgba(239, 68, 68, 0.05) 100%
  );
  border-color: #ef4444;
  color: #ef4444;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.3),
    0 0 15px rgba(239, 68, 68, 0.2),
    inset 0 1px 0 rgba(239, 68, 68, 0.1);
}

.health-card.blue {
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.15) 0%,
    rgba(0, 0, 0, 0.6) 50%,
    rgba(59, 130, 246, 0.05) 100%
  );
  border-color: #3b82f6;
  color: #3b82f6;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.3),
    0 0 15px rgba(59, 130, 246, 0.2),
    inset 0 1px 0 rgba(59, 130, 246, 0.1);
}

.health-text {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 0 0 8px currentColor;
}

/* ================ QUÊTES ACTIVES ================ */
.quest-item {
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 8px;
  border: 2px solid;
  margin: 0 10px 8px 10px;
  background: linear-gradient(135deg, 
    rgba(0, 0, 0, 0.6) 0%,
    rgba(20, 20, 30, 0.8) 100%
  );
  backdrop-filter: blur(15px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.quest-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.05) 0%,
    transparent 50%,
    rgba(255, 255, 255, 0.02) 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.quest-item:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 
    0 8px 25px rgba(0, 0, 0, 0.4),
    0 0 15px currentColor;
}

.quest-item:hover::before {
  opacity: 1;
}

.quest-item.green {
  background: linear-gradient(135deg, 
    rgba(34, 197, 94, 0.15) 0%,
    rgba(0, 0, 0, 0.6) 50%,
    rgba(34, 197, 94, 0.05) 100%
  );
  border-color: #22c55e;
  color: #22c55e;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.3),
    0 0 15px rgba(34, 197, 94, 0.2),
    inset 0 1px 0 rgba(34, 197, 94, 0.1);
}

.quest-item.blue {
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.15) 0%,
    rgba(0, 0, 0, 0.6) 50%,
    rgba(59, 130, 246, 0.05) 100%
  );
  border-color: #3b82f6;
  color: #3b82f6;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.3),
    0 0 15px rgba(59, 130, 246, 0.2),
    inset 0 1px 0 rgba(59, 130, 246, 0.1);
}

.quest-item.purple {
  background: linear-gradient(135deg, 
    rgba(168, 85, 247, 0.15) 0%,
    rgba(0, 0, 0, 0.6) 50%,
    rgba(168, 85, 247, 0.05) 100%
  );
  border-color: #a855f7;
  color: #a855f7;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.3),
    0 0 15px rgba(168, 85, 247, 0.2),
    inset 0 1px 0 rgba(168, 85, 247, 0.1);
}

.quest-item.yellow {
  background: linear-gradient(135deg, 
    rgba(234, 179, 8, 0.15) 0%,
    rgba(0, 0, 0, 0.6) 50%,
    rgba(234, 179, 8, 0.05) 100%
  );
  border-color: #eab308;
  color: #eab308;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.3),
    0 0 15px rgba(234, 179, 8, 0.2),
    inset 0 1px 0 rgba(234, 179, 8, 0.1);
}

.quest-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.quest-icon {
  font-size: 1rem;
  margin-right: 8px;
  text-shadow: 0 0 10px currentColor;
  filter: drop-shadow(0 0 5px currentColor);
}

.quest-title {
  flex: 1;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-shadow: 0 0 8px currentColor;
}

.quest-progress {
  font-size: 0.75rem;
  font-weight: 800;
  text-shadow: 0 0 8px currentColor;
  font-family: 'Rajdhani', sans-serif;
}

.quest-item.green .quest-progress { color: #22c55e; }
.quest-item.blue .quest-progress { color: #3b82f6; }
.quest-item.purple .quest-progress { color: #a855f7; }
.quest-item.yellow .quest-progress { color: #eab308; }

.quest-bar {
  width: 100%;
  height: 3px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.quest-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #16a34a);
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* ================ SPORT & SANTÉ ================ */
.sport-stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6px;
  margin-bottom: 8px;
}

.sport-card {
  padding: 8px;
  border-radius: 6px;
  text-align: center;
  border: 1px solid;
}

.sport-card.red {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.3);
}

.sport-card.orange {
  background: rgba(249, 115, 22, 0.2);
  border-color: rgba(249, 115, 22, 0.3);
}

.sport-card.green {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.3);
}

.sport-value {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 2px;
}

.sport-card.red .sport-value { color: #ef4444; }
.sport-card.orange .sport-value { color: #f97316; }
.sport-card.green .sport-value { color: #22c55e; }

.sport-label {
  font-size: 0.65rem;
  color: #9ca3af;
}

.sport-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sport-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.7rem;
}

.sport-progress {
  font-weight: 600;
}

.sport-detail:nth-child(1) .sport-progress { color: #ef4444; }
.sport-detail:nth-child(2) .sport-progress { color: #f97316; }
.sport-detail:nth-child(3) .sport-progress { color: #3b82f6; }

/* ================ ANIMATIONS ================ */
@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  8.33% { background-position: 8.33% 50%; }
  16.66% { background-position: 16.66% 50%; }
  25% { background-position: 25% 50%; }
  33.33% { background-position: 33.33% 50%; }
  41.66% { background-position: 41.66% 50%; }
  50% { background-position: 50% 50%; }
  58.33% { background-position: 58.33% 50%; }
  66.66% { background-position: 66.66% 50%; }
  75% { background-position: 75% 50%; }
  83.33% { background-position: 83.33% 50%; }
  91.66% { background-position: 91.66% 50%; }
  100% { background-position: 100% 50%; }
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.2); }
}

@keyframes pulse-badge {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}

/* ================ APPRENTISSAGE ================ */
.learning-course {
  background: rgba(168, 85, 247, 0.2);
  border: 0.0625rem solid rgba(168, 85, 247, 0.3); /* 1px -> 0.0625rem */
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 6px;
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.course-icon {
  font-size: 0.8rem;
  margin-right: 6px;
}

.course-title {
  flex: 1;
  font-size: 0.75rem;
  font-weight: 600;
  color: #a855f7;
}

.course-progress {
  font-size: 0.7rem;
  font-weight: 700;
  color: #a855f7;
}

.course-time {
  font-size: 0.65rem;
  color: #9ca3af;
}

.learning-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.learning-stat {
  padding: 8px;
  border-radius: 6px;
  text-align: center;
  border: 1px solid;
}

.learning-stat.green {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.3);
}

.learning-stat.yellow {
  background: rgba(234, 179, 8, 0.2);
  border-color: rgba(234, 179, 8, 0.3);
}

.stat-value {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 2px;
}

.learning-stat.green .stat-value { color: #22c55e; }
.learning-stat.yellow .stat-value { color: #eab308; }

.stat-label {
  font-size: 0.65rem;
  color: #9ca3af;
}

/* ================ LIVRES & LECTURE ================ */
.book-current {
  background: rgba(59, 130, 246, 0.2);
  border: 0.0625rem solid rgba(59, 130, 246, 0.3); /* 1px -> 0.0625rem */
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 8px;
}

.book-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.book-icon {
  font-size: 0.8rem;
  margin-right: 6px;
}

.book-title {
  flex: 1;
  font-size: 0.75rem;
  font-weight: 600;
  color: #3b82f6;
}

.book-progress {
  font-size: 0.7rem;
  font-weight: 700;
  color: #3b82f6;
}

.book-bar {
  width: 100%;
  height: 3px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
  overflow: hidden;
  margin: 4px 0;
}

.book-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.book-time {
  font-size: 0.65rem;
  color: #9ca3af;
}

.book-stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6px;
  margin-bottom: 8px;
}

.book-stat {
  padding: 8px;
  border-radius: 6px;
  text-align: center;
  border: 1px solid;
}

.book-stat.green {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.3);
}

.book-stat.purple {
  background: rgba(168, 85, 247, 0.2);
  border-color: rgba(168, 85, 247, 0.3);
}

.book-stat.orange {
  background: rgba(249, 115, 22, 0.2);
  border-color: rgba(249, 115, 22, 0.3);
}

.book-stat.green .stat-value { color: #22c55e; }
.book-stat.purple .stat-value { color: #a855f7; }
.book-stat.orange .stat-value { color: #f97316; }

.book-next {
  background: rgba(6, 182, 212, 0.2);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 6px;
  padding: 8px;
  font-size: 0.7rem;
  color: #06b6d4;
}

/* ================ FINANCES ================ */
.finance-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 8px;
}

.finance-card {
  padding: 8px;
  border-radius: 6px;
  text-align: center;
  border: 1px solid;
}

.finance-card.green {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.3);
}

.finance-card.red {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.3);
}

.finance-value {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 2px;
}

.finance-card.green .finance-value { color: #22c55e; }
.finance-card.red .finance-value { color: #ef4444; }

.finance-label {
  font-size: 0.65rem;
  color: #9ca3af;
}

.finance-savings {
  background: rgba(59, 130, 246, 0.2);
  border: 0.0625rem solid rgba(59, 130, 246, 0.3); /* 1px -> 0.0625rem */
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 8px;
}

.savings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #3b82f6;
}

.savings-progress {
  font-weight: 700;
}

.savings-bar {
  width: 100%;
  height: 3px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.savings-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.finance-stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6px;
}

.finance-stat {
  padding: 6px;
  border-radius: 6px;
  text-align: center;
  border: 1px solid;
}

.finance-stat.purple {
  background: rgba(168, 85, 247, 0.2);
  border-color: rgba(168, 85, 247, 0.3);
}

.finance-stat.yellow {
  background: rgba(234, 179, 8, 0.2);
  border-color: rgba(234, 179, 8, 0.3);
}

.finance-stat.cyan {
  background: rgba(6, 182, 212, 0.2);
  border-color: rgba(6, 182, 212, 0.3);
}

.finance-stat.purple .stat-value { color: #a855f7; }
.finance-stat.yellow .stat-value { color: #eab308; }
.finance-stat.cyan .stat-value { color: #06b6d4; }

/* ================ JOURNAL & FILMS ================ */
.journal-films {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.journal-section, .films-section {
  background: rgba(15, 15, 25, 0.4);
  border: 1px solid rgba(0, 245, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.journal-card {
  background: rgba(236, 72, 153, 0.2);
  border: 1px solid rgba(236, 72, 153, 0.3);
  border-radius: 6px;
  padding: 8px;
  font-size: 0.7rem;
}

.journal-mood {
  color: #ec4899;
  font-weight: 600;
  margin-top: 4px;
}

.films-card {
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 6px;
  padding: 8px;
  font-size: 0.7rem;
}

.films-rating {
  color: #6366f1;
  font-weight: 600;
  margin-top: 4px;
}

/* ================ SESSION ACTIVE ================ */
.session-active {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2));
  border: 0.0625rem solid rgba(34, 197, 94, 0.3); /* 1px -> 0.0625rem */
  border-radius: 8px;
  padding: 12px;
}

.session-timer {
  text-align: center;
  margin-bottom: 8px;
}

.timer-display {
  font-size: 1.5rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  color: #22c55e;
  margin-bottom: 4px;
}

.session-task {
  font-size: 0.7rem;
  color: #9ca3af;
  margin-bottom: 8px;
}

.session-bar {
  width: 100%;
  height: 4px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.session-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #16a34a);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.session-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  text-align: center;
}

.session-stat .stat-value {
  font-size: 0.9rem;
  font-weight: 700;
  color: #22c55e;
}

.session-stat .stat-label {
  font-size: 0.65rem;
  color: #9ca3af;
}

/* ================ ACHIEVEMENTS ================ */
.achievements-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 8px;
}

.achievement-card {
  padding: 8px;
  border-radius: 6px;
  text-align: center;
  border: 1px solid;
}

.achievement-card.orange {
  background: rgba(249, 115, 22, 0.2);
  border-color: rgba(249, 115, 22, 0.3);
}

.achievement-card.blue {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.3);
}

.achievement-icon {
  font-size: 1.2rem;
  margin-bottom: 4px;
}

.achievement-title {
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 2px;
}

.achievement-card.orange .achievement-title { color: #f97316; }
.achievement-card.blue .achievement-title { color: #3b82f6; }

.achievement-desc {
  font-size: 0.65rem;
  color: #9ca3af;
}

.achievements-mini {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6px;
}

.achievement-mini {
  padding: 6px;
  border-radius: 6px;
  text-align: center;
  border: 1px solid;
}

.achievement-mini.green {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.3);
}

.achievement-mini.purple {
  background: rgba(168, 85, 247, 0.2);
  border-color: rgba(168, 85, 247, 0.3);
}

.achievement-mini.yellow {
  background: rgba(234, 179, 8, 0.2);
  border-color: rgba(234, 179, 8, 0.3);
}

.mini-icon {
  font-size: 0.8rem;
  margin-bottom: 2px;
}

.mini-title {
  font-size: 0.65rem;
  font-weight: 600;
}

.achievement-mini.green .mini-title { color: #22c55e; }
.achievement-mini.purple .mini-title { color: #a855f7; }
.achievement-mini.yellow .mini-title { color: #eab308; }

/* ================ FOCUS RPG ================ */
.rpg-character {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(168, 85, 247, 0.2));
  border: 1px solid rgba(236, 72, 153, 0.3);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
}

.character-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #ec4899;
  text-align: center;
  margin-bottom: 8px;
}

.character-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.7rem;
  color: #9ca3af;
}

.character-bars {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.hp-bar, .mp-bar {
  width: 100%;
  height: 4px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #ef4444, #dc2626);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.mp-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.rpg-attributes {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 6px;
  margin-bottom: 8px;
}

.attribute {
  padding: 6px;
  border-radius: 6px;
  text-align: center;
  border: 1px solid;
}

.attribute.red {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.3);
}

.attribute.blue {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.3);
}

.attribute.green {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.3);
}

.attribute.purple {
  background: rgba(168, 85, 247, 0.2);
  border-color: rgba(168, 85, 247, 0.3);
}

.attr-icon {
  font-size: 0.8rem;
  margin-bottom: 2px;
}

.attr-value {
  font-size: 0.8rem;
  font-weight: 700;
  margin-bottom: 2px;
}

.attribute.red .attr-value { color: #ef4444; }
.attribute.blue .attr-value { color: #3b82f6; }
.attribute.green .attr-value { color: #22c55e; }
.attribute.purple .attr-value { color: #a855f7; }

.attr-name {
  font-size: 0.6rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rpg-boss {
  background: rgba(234, 179, 8, 0.2);
  border: 1px solid rgba(234, 179, 8, 0.3);
  border-radius: 6px;
  padding: 8px;
}

.boss-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #eab308;
}

.boss-name {
  font-weight: 700;
}

.boss-reward {
  font-size: 0.65rem;
  color: #9ca3af;
}

/* ================ OBJECTIFS DU JOUR ================ */
.goals-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.goal-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border-radius: 6px;
  border-left: 3px solid;
  font-size: 0.7rem;
}

.goal-item.completed {
  background: rgba(34, 197, 94, 0.2);
  border-left-color: #22c55e;
}

.goal-item.in-progress {
  background: rgba(249, 115, 22, 0.2);
  border-left-color: #f97316;
}

.goal-item.pending {
  background: rgba(239, 68, 68, 0.2);
  border-left-color: #ef4444;
}

.goal-icon {
  margin-right: 6px;
}

.goal-text {
  flex: 1;
  font-weight: 600;
}

.goal-status {
  font-weight: 700;
}

.goal-item.completed .goal-status { color: #22c55e; }
.goal-item.in-progress .goal-status { color: #f97316; }
.goal-item.pending .goal-status { color: #ef4444; }

.goals-bonus {
  background: rgba(6, 182, 212, 0.2);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 6px;
  padding: 8px;
  text-align: center;
}

.bonus-text {
  font-size: 0.7rem;
  font-weight: 700;
  color: #06b6d4;
}

/* ================ NOTIFICATIONS ================ */
.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid;
  margin-bottom: 6px;
}

.notification-item.red {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.3);
}

.notification-item.orange {
  background: rgba(249, 115, 22, 0.2);
  border-color: rgba(249, 115, 22, 0.3);
}

.notification-item.blue {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.3);
}

.notification-item.green {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.3);
}

.notification-item.purple {
  background: rgba(168, 85, 247, 0.2);
  border-color: rgba(168, 85, 247, 0.3);
}

.notification-icon {
  font-size: 0.9rem;
  margin-top: 2px;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 2px;
}

.notification-item.red .notification-title { color: #ef4444; }
.notification-item.orange .notification-title { color: #f97316; }
.notification-item.blue .notification-title { color: #3b82f6; }
.notification-item.green .notification-title { color: #22c55e; }
.notification-item.purple .notification-title { color: #a855f7; }

.notification-message {
  font-size: 0.65rem;
  color: #9ca3af;
}

/* ================ MÉTÉO & ENVIRONNEMENT ================ */
.weather-main {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.2));
  border: 0.0625rem solid rgba(59, 130, 246, 0.3); /* 1px -> 0.0625rem */
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  margin-bottom: 8px;
}

.weather-icon {
  font-size: 1.5rem;
  margin-bottom: 4px;
}

.weather-temp {
  font-size: 1.2rem;
  font-weight: 700;
  color: #06b6d4;
  margin-bottom: 4px;
}

.weather-desc {
  font-size: 0.7rem;
  color: #9ca3af;
}

.weather-details {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6px;
  margin-bottom: 8px;
}

.weather-detail {
  padding: 6px;
  border-radius: 6px;
  text-align: center;
  border: 1px solid;
}

.weather-detail:nth-child(1) {
  background: rgba(249, 115, 22, 0.2);
  border-color: rgba(249, 115, 22, 0.3);
}

.weather-detail:nth-child(2) {
  background: rgba(168, 85, 247, 0.2);
  border-color: rgba(168, 85, 247, 0.3);
}

.weather-detail:nth-child(3) {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.3);
}

.detail-icon {
  font-size: 0.8rem;
  margin-bottom: 2px;
}

.detail-value {
  font-size: 0.8rem;
  font-weight: 700;
  margin-bottom: 2px;
}

.weather-detail:nth-child(1) .detail-value { color: #f97316; }
.weather-detail:nth-child(2) .detail-value { color: #a855f7; }
.weather-detail:nth-child(3) .detail-value { color: #3b82f6; }

.detail-label {
  font-size: 0.6rem;
  color: #9ca3af;
}

.weather-air {
  background: rgba(34, 197, 94, 0.2);
  border: 0.0625rem solid rgba(34, 197, 94, 0.3); /* 1px -> 0.0625rem */
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 8px;
}

.air-quality {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: #22c55e;
}

.air-value {
  font-weight: 700;
}

.weather-advice {
  background: rgba(234, 179, 8, 0.2);
  border: 1px solid rgba(234, 179, 8, 0.3);
  border-radius: 6px;
  padding: 8px;
}

.advice-text {
  font-size: 0.7rem;
  color: #eab308;
  font-weight: 600;
}

/* ================ MOTIVATION ================ */
.motivation-quote {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(168, 85, 247, 0.2));
  border: 1px solid rgba(236, 72, 153, 0.3);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  margin-bottom: 8px;
}

.quote-text {
  font-size: 0.8rem;
  font-weight: 600;
  font-style: italic;
  color: #ec4899;
  margin-bottom: 4px;
}

.quote-author {
  font-size: 0.65rem;
  color: #9ca3af;
}

.motivation-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 8px;
}

.motivation-stat {
  padding: 8px;
  border-radius: 6px;
  text-align: center;
  border: 1px solid;
}

.motivation-stat.green {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.3);
}

.motivation-stat.blue {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.3);
}

.stat-icon {
  font-size: 0.8rem;
  margin-bottom: 2px;
}

.motivation-stat.green .stat-icon { color: #22c55e; }
.motivation-stat.blue .stat-icon { color: #3b82f6; }

.motivation-stat .stat-label {
  font-size: 0.65rem;
  color: #9ca3af;
  margin-bottom: 2px;
}

.motivation-stat .stat-value {
  font-size: 0.8rem;
  font-weight: 700;
}

.motivation-stat.green .stat-value { color: #22c55e; }
.motivation-stat.blue .stat-value { color: #3b82f6; }

.motivation-bonus {
  background: rgba(234, 179, 8, 0.2);
  border: 1px solid rgba(234, 179, 8, 0.3);
  border-radius: 6px;
  padding: 8px;
  text-align: center;
}

.motivation-bonus .bonus-text {
  font-size: 0.7rem;
  font-weight: 700;
  color: #eab308;
}

/* ================ RÉCOMPENSES ================ */
.reward-item {
  background: rgba(234, 179, 8, 0.2);
  border: 1px solid rgba(234, 179, 8, 0.3);
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 6px;
}

.reward-item.purple {
  background: rgba(168, 85, 247, 0.2);
  border-color: rgba(168, 85, 247, 0.3);
}

.reward-item.green {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.3);
}

.reward-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.reward-icon {
  font-size: 0.8rem;
  margin-right: 6px;
}

.reward-title {
  flex: 1;
  font-size: 0.75rem;
  font-weight: 600;
}

.reward-item.yellow .reward-title { color: #eab308; }
.reward-item.purple .reward-title { color: #a855f7; }
.reward-item.green .reward-title { color: #22c55e; }

.reward-progress {
  font-size: 0.7rem;
  font-weight: 700;
}

.reward-item.yellow .reward-progress { color: #eab308; }
.reward-item.purple .reward-progress { color: #a855f7; }
.reward-item.green .reward-progress { color: #22c55e; }

.reward-desc {
  font-size: 0.65rem;
  color: #9ca3af;
  margin-bottom: 4px;
}

.reward-bar {
  width: 100%;
  height: 3px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.reward-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.reward-item.yellow .reward-bar-fill { background: linear-gradient(90deg, #eab308, #ca8a04); }
.reward-item.purple .reward-bar-fill { background: linear-gradient(90deg, #a855f7, #9333ea); }
.reward-item.green .reward-bar-fill { background: linear-gradient(90deg, #22c55e, #16a34a); }

.reward-next {
  background: rgba(6, 182, 212, 0.2);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 6px;
  padding: 8px;
  text-align: center;
}

.next-text {
  font-size: 0.7rem;
  font-weight: 700;
  color: #06b6d4;
  margin-bottom: 2px;
}

.next-desc {
  font-size: 0.65rem;
  color: #9ca3af;
}

/* ================ HISTORIQUE ================ */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
}

.history-icon {
  font-size: 0.8rem;
}

.history-text {
  flex: 1;
  font-weight: 600;
}

.history-item.green .history-text { color: #22c55e; }
.history-item.blue .history-text { color: #3b82f6; }
.history-item.purple .history-text { color: #a855f7; }
.history-item.yellow .history-text { color: #eab308; }
.history-item.orange .history-text { color: #f97316; }
.history-item.cyan .history-text { color: #06b6d4; }

.history-more {
  background: rgba(107, 114, 128, 0.2);
  border: 1px solid rgba(107, 114, 128, 0.3);
  border-radius: 6px;
  padding: 8px;
  text-align: center;
}

.more-text {
  font-size: 0.7rem;
  color: #9ca3af;
}

/* ================ PARAMÈTRES RAPIDES ================ */
.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 8px;
}

.setting-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid;
  background: transparent;
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.setting-btn:hover {
  transform: translateY(-1px);
}

.setting-btn.purple {
  background: rgba(168, 85, 247, 0.2);
  border-color: rgba(168, 85, 247, 0.3);
}

.setting-btn.purple:hover {
  background: rgba(168, 85, 247, 0.4);
}

.setting-btn.green {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.3);
}

.setting-btn.green:hover {
  background: rgba(34, 197, 94, 0.4);
}

.setting-btn.blue {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.3);
}

.setting-btn.blue:hover {
  background: rgba(59, 130, 246, 0.4);
}

.setting-btn.orange {
  background: rgba(249, 115, 22, 0.2);
  border-color: rgba(249, 115, 22, 0.3);
}

.setting-btn.orange:hover {
  background: rgba(249, 115, 22, 0.4);
}

.setting-icon {
  font-size: 0.8rem;
}

.settings-full {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  padding: 10px;
  background: linear-gradient(135deg, rgba(107, 114, 128, 0.2), rgba(75, 85, 99, 0.2));
  border: 1px solid rgba(107, 114, 128, 0.3);
  border-radius: 6px;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.settings-full:hover {
  background: linear-gradient(135deg, rgba(107, 114, 128, 0.4), rgba(75, 85, 99, 0.4));
  transform: translateY(-1px);
}

.settings-icon {
  font-size: 0.9rem;
}

/* ================ PRÉDICTIONS IA ================ */
.prediction-item {
  padding: 8px;
  border-radius: 6px;
  border: 1px solid;
  margin-bottom: 6px;
}

.prediction-item.green {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.3);
}

.prediction-item.blue {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.3);
}

.prediction-item.purple {
  background: rgba(168, 85, 247, 0.2);
  border-color: rgba(168, 85, 247, 0.3);
}

.prediction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.7rem;
  font-weight: 600;
}

.prediction-item.green .prediction-header { color: #22c55e; }
.prediction-item.blue .prediction-header { color: #3b82f6; }
.prediction-item.purple .prediction-header { color: #a855f7; }

.prediction-value {
  font-weight: 700;
}

.prediction-advice {
  background: rgba(249, 115, 22, 0.2);
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: 6px;
  padding: 8px;
}

.prediction-advice .advice-text {
  font-size: 0.7rem;
  color: #f97316;
  font-weight: 600;
}

.advice-content {
  font-weight: 700;
}

/* ================ STATISTIQUES FINALES ================ */
.stats-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.stats-main .stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.7rem;
  color: #9ca3af;
}

.stats-main .stat-value {
  font-weight: 700;
  color: #06b6d4;
}

.stats-rank {
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(249, 115, 22, 0.2));
  border: 1px solid rgba(234, 179, 8, 0.3);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  margin-bottom: 8px;
}

.rank-icon {
  font-size: 1.2rem;
  margin-bottom: 4px;
}

.rank-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #eab308;
  margin-bottom: 2px;
}

.rank-desc {
  font-size: 0.65rem;
  color: #9ca3af;
}

.stats-mini {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 4px;
}

.mini-stat {
  padding: 6px;
  border-radius: 6px;
  text-align: center;
  border: 1px solid;
}

.mini-stat.red {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.3);
}

.mini-stat.blue {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.3);
}

.mini-stat.purple {
  background: rgba(168, 85, 247, 0.2);
  border-color: rgba(168, 85, 247, 0.3);
}

.mini-stat.green {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.3);
}

.mini-value {
  font-size: 0.8rem;
  font-weight: 700;
  margin-bottom: 2px;
}

.mini-stat.red .mini-value { color: #ef4444; }
.mini-stat.blue .mini-value { color: #3b82f6; }
.mini-stat.purple .mini-value { color: #a855f7; }
.mini-stat.green .mini-value { color: #22c55e; }

.mini-label {
  font-size: 0.6rem;
  color: #9ca3af;
}

/* ================ RESPONSIVE ================ */
@media (max-width: 1400px) {
  .sidebar-premium {
    width: 280px;
  }
}

@media (max-width: 1200px) {
  .sidebar-premium {
    width: 260px;
  }
}

@media (max-width: 768px) {
  .sidebar-premium {
    width: 100%;
    min-height: auto;
    border-right: none;
    border-bottom: 2px solid rgba(255, 215, 0, 0.2);
    margin: -10px;
    padding: 10px;
  }
  
  .clock-section {
    margin: -10px -10px 0 -10px;
  }
}
