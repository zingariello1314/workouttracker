/**
 * Section Quêtes du Jour - Sidebar Premium
 * Affiche les quêtes actives du jour avec navigation contextuelle
 * 
 * @module components/sidebar/QuestesJourSection
 */

import React, { memo } from 'react';

/**
 * Section Quêtes du Jour
 * 
 * Fonctionnalités:
 * - Affiche les quêtes actives du jour
 * - Chaque quête est cliquable et navigue vers le détail
 * - Badge "Complétée" pour les quêtes terminées
 * - Badge compteur cliquable dans le header
 * - Tooltips sur tous les éléments interactifs
 * - Support complet de l'accessibilité (ARIA, clavier)
 * 
 * Requirements: 2.8, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 9.1, 9.2
 * 
 * @param {Object} props
 * @param {boolean} props.isExpanded - État d'expansion de la section
 * @param {Function} props.onToggle - Callback pour toggle l'expansion
 * @param {Array} props.quests - Liste des quêtes du jour
 * @param {Object} props.navigation - Hook de navigation
 */
const QuestesJourSection = memo(({ isExpanded, onToggle, quests = [], navigation }) => {
  /**
   * Gère le clic sur une quête
   * Navigue vers l'onglet Quêtes avec la quête en focus et scrollée en vue
   * Requirement 2.8, 6.1, 6.2
   */
  const handleQuestClick = (quest) => {
    navigation.toQuests({
      questId: quest.id,
      scrollTo: true
    });
  };

  /**
   * Gère le clic sur le badge compteur
   * Navigue vers l'onglet Quêtes avec filtre "aujourd'hui"
   * Requirement 6.3
   */
  const handleBadgeClick = (e) => {
    e.stopPropagation(); // Empêcher le toggle de la section
    navigation.toQuests({ filter: 'today' });
  };

  /**
   * Gère les événements clavier pour l'accessibilité
   */
  const handleKeyDown = (e, callback) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  };

  return (
    <section className={`sidebar-section ${isExpanded ? 'expanded' : ''}`}>
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`Quêtes du jour, ${quests.length} quête${quests.length > 1 ? 's' : ''} active${quests.length > 1 ? 's' : ''}`}
        onKeyDown={(e) => handleKeyDown(e, onToggle)}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">🎯</span>
          Quêtes du Jour
          {/* Badge compteur cliquable - Requirement 6.3 */}
          <span 
            className="sidebar-section-badge clickable"
            onClick={handleBadgeClick}
            onKeyDown={(e) => handleKeyDown(e, () => handleBadgeClick(e))}
            role="button"
            tabIndex={0}
            aria-label={`${quests.length} quête${quests.length > 1 ? 's' : ''} active${quests.length > 1 ? 's' : ''}. Cliquer pour voir toutes les quêtes du jour`}
            title="Voir toutes les quêtes du jour"
          >
            {quests.length}
          </span>
        </h2>
        <span 
          className={`sidebar-section-toggle ${isExpanded ? 'expanded' : ''}`}
          aria-hidden="true"
        >
          ▼
        </span>
      </header>
      
      {isExpanded && (
        <div className="sidebar-section-content">
          {quests.length === 0 ? (
            <div className="sidebar-info-box">
              <span className="sidebar-info-icon" aria-hidden="true">✨</span>
              <span>Aucune quête active aujourd'hui</span>
            </div>
          ) : (
            quests.map((quest, index) => (
              <div 
                key={`sidebar-quest-${String(quest.id)}-${index}`}
                className={`sidebar-quest-item clickable ${quest.completed ? 'completed' : ''}`}
                role="button"
                tabIndex={0}
                aria-label={`Quête: ${quest.title}, progression ${quest.progress} pourcent${quest.completed ? ', complétée' : ''}. Cliquer pour voir les détails`}
                title={`Voir les détails de "${quest.title}"`}
                onClick={() => handleQuestClick(quest)}
                onKeyDown={(e) => handleKeyDown(e, () => handleQuestClick(quest))}
              >
                {/* Badge "Complétée" - Requirement 6.4 */}
                {quest.completed && (
                  <div 
                    className="sidebar-quest-completed-badge"
                    aria-label="Quête complétée"
                  >
                    ✓ Complétée
                  </div>
                )}
                
                <div className="sidebar-quest-header">
                  <span className="sidebar-quest-icon" aria-hidden="true">{quest.icon}</span>
                  <div className="sidebar-quest-title">{quest.title}</div>
                  <div className="sidebar-quest-percentage" aria-hidden="true">{quest.progress}%</div>
                </div>
                
                <div className="sidebar-quest-progress">
                  <div 
                    className="sidebar-quest-progress-bar" 
                    style={{ width: `${quest.progress}%` }}
                    role="progressbar"
                    aria-valuenow={quest.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progression: ${quest.progress} pourcent`}
                  ></div>
                </div>
                
                {/* Tooltip - Requirement 9.2 */}
                <div className="sidebar-tooltip" role="tooltip">
                  Voir dans Quêtes
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
});

QuestesJourSection.displayName = 'QuestesJourSection';

export default QuestesJourSection;
