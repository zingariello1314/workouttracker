import React, { memo, useCallback, useMemo, useEffect, useState } from 'react';
import deepLinkService from '../../../services/navigation/DeepLinkService';

/**
 * ShoppingListModule - Module Liste Courses (Position 11)
 * Affiche la liste programmée pour l'heure actuelle ou la plus proche
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
const ShoppingListModule = memo(({ 
  isExpanded,
  onToggle,
  data = {},
  navigation
}) => {
  // État pour forcer la mise à jour
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Extraire les données des listes de courses
  const shoppingLists = data?.shoppingLists || [];

  // Mise à jour automatique des listes (Requirement 6.4)
  useEffect(() => {
    const handleListUpdate = (event) => {
      console.log('[ShoppingListModule] Mise à jour automatique détectée:', event.detail);
      // Forcer la mise à jour du module
      setForceUpdate(prev => prev + 1);
    };
    
    // Écouter les événements de mise à jour des listes
    window.addEventListener('shopping:list:updated', handleListUpdate);
    window.addEventListener('shopping:list:created', handleListUpdate);
    window.addEventListener('shopping:list:deleted', handleListUpdate);
    window.addEventListener('shopping:list:completed', handleListUpdate);
    
    return () => {
      window.removeEventListener('shopping:list:updated', handleListUpdate);
      window.removeEventListener('shopping:list:created', handleListUpdate);
      window.removeEventListener('shopping:list:deleted', handleListUpdate);
      window.removeEventListener('shopping:list:completed', handleListUpdate);
    };
  }, []);

  // Mise à jour périodique pour recalculer la liste la plus proche (Requirement 6.2)
  useEffect(() => {
    const interval = setInterval(() => {
      // Forcer la recalculation toutes les 5 minutes
      setForceUpdate(prev => prev + 1);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);
  
  /**
   * Trouve la liste la plus appropriée pour l'heure actuelle (Requirements 6.1, 6.2)
   * Recalculé automatiquement grâce à forceUpdate
   */
  const currentList = useMemo(() => {
    if (!shoppingLists || shoppingLists.length === 0) {
      return null;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes depuis minuit
    
    // Filtrer les listes avec horaires programmés
    const scheduledLists = shoppingLists.filter(list => 
      list.scheduledTime && list.statut !== 'completee'
    );
    
    if (scheduledLists.length === 0) {
      // Retourner la première liste non complétée
      return shoppingLists.find(list => list.statut !== 'completee') || null;
    }

    // Trouver la liste programmée pour maintenant
    const currentList = scheduledLists.find(list => {
      const listTime = new Date(list.scheduledTime);
      const listMinutes = listTime.getHours() * 60 + listTime.getMinutes();
      const timeDiff = Math.abs(currentTime - listMinutes);
      
      // Considérer comme "actuelle" si dans les 30 minutes
      return timeDiff <= 30;
    });

    if (currentList) {
      return { ...currentList, isCurrent: true };
    }

    // Sinon, trouver la liste la plus proche temporellement
    const closestList = scheduledLists.reduce((closest, list) => {
      const listTime = new Date(list.scheduledTime);
      const listMinutes = listTime.getHours() * 60 + listTime.getMinutes();
      
      const currentDiff = Math.abs(currentTime - listMinutes);
      const closestDiff = closest ? Math.abs(currentTime - (new Date(closest.scheduledTime).getHours() * 60 + new Date(closest.scheduledTime).getMinutes())) : Infinity;
      
      return currentDiff < closestDiff ? list : closest;
    }, null);

    return closestList ? { ...closestList, isClosest: true } : null;
  }, [shoppingLists, forceUpdate]); // Dépendance sur forceUpdate pour recalcul automatique

  /**
   * Navigation vers Smart Shopping avec positionnement précis
   * Requirements: 6.3, 6.5
   */
  const handleNavigation = useCallback(async (listId = null) => {
    if (!navigation?.setActiveTab) {
      console.warn('[ShoppingListModule] Navigation function not available');
      return;
    }

    try {
      // Navigation vers Finances > Smart Shopping
      const target = {
        tab: 'finances',
        subtab: 'smart-shopping',
        moduleId: listId ? `shopping-list-${listId}` : 'smart-shopping-main',
        scrollBehavior: 'smooth',
        highlightDuration: 2000,
        params: { listId }
      };

      const success = await deepLinkService.navigateToModule(target, navigation.setActiveTab);
      
      if (success) {
        console.log(`[ShoppingListModule] Navigation réussie vers Smart Shopping${listId ? ` (liste ${listId})` : ''}`);
      } else {
        console.warn('[ShoppingListModule] Échec de la navigation');
      }
    } catch (error) {
      console.error('[ShoppingListModule] Erreur de navigation:', error);
    }
  }, [navigation]);

  /**
   * Formate l'heure d'une liste
   */
  const formatTime = useCallback((scheduledTime) => {
    if (!scheduledTime) return '';
    
    const time = new Date(scheduledTime);
    return time.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, []);

  /**
   * Calcule le budget estimé d'une liste
   */
  const calculateEstimatedBudget = useCallback((articles) => {
    if (!articles || articles.length === 0) return 0;
    
    return articles.reduce((total, article) => {
      return total + (article.prixEstime || 0) * (article.quantite || 1);
    }, 0);
  }, []);

  // État de chargement
  if (data?.loading) {
    return (
      <section className={`sidebar-section ${isExpanded ? 'expanded' : ''}`}>
        <header 
          className="sidebar-section-header"
          onClick={onToggle}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
        >
          <h2 className="sidebar-section-title">
            <span className="sidebar-section-icon">🛒</span>
            Liste Courses
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
            <div className="module-loading">
              <div className="loading-spinner"></div>
              <span className="loading-text">Chargement...</span>
            </div>
          </div>
        )}
      </section>
    );
  }

  // État d'erreur
  if (data?.error) {
    return (
      <section className={`sidebar-section ${isExpanded ? 'expanded' : ''}`}>
        <header 
          className="sidebar-section-header"
          onClick={onToggle}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
        >
          <h2 className="sidebar-section-title">
            <span className="sidebar-section-icon">🛒</span>
            Liste Courses
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
            <div className="module-error">
              <span className="error-icon">⚠️</span>
              <span className="error-text">Erreur de chargement</span>
            </div>
          </div>
        )}
      </section>
    );
  }

  // État vide - aucune liste
  if (!currentList) {
    return (
      <section className={`sidebar-section ${isExpanded ? 'expanded' : ''}`}>
        <header 
          className="sidebar-section-header"
          onClick={onToggle}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
        >
          <h2 className="sidebar-section-title">
            <span className="sidebar-section-icon">🛒</span>
            Liste Courses
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
            <div className="module-empty">
              <span className="empty-icon">📝</span>
              <span className="empty-text">Aucune liste programmée</span>
              <button 
                className="create-list-btn"
                onClick={() => handleNavigation()}
              >
                Créer une liste
              </button>
            </div>
          </div>
        )}
      </section>
    );
  }

  const estimatedBudget = calculateEstimatedBudget(currentList.articles);
  const articlesCount = currentList.articles?.length || 0;
  const articlesToShow = currentList.articles?.slice(0, 3) || [];

  return (
    <section className={`sidebar-section ${isExpanded ? 'expanded' : ''}`}>
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon">🛒</span>
          Liste Courses
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
          <div className="shopping-list-content">
            {/* En-tête de la liste */}
            <div className="list-header">
              <div className="list-info">
                <h4 className="list-name">{currentList.nom}</h4>
                <div className="list-meta">
                  {currentList.scheduledTime && (
                    <div className={`time-indicator ${currentList.isCurrent ? 'current' : 'closest'}`}>
                      <span className="time-icon">🕒</span>
                      <span className="time-text">{formatTime(currentList.scheduledTime)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="list-status">
                <span className={`status-badge ${currentList.statut}`}>
                  {currentList.statut === 'prete' ? 'Prête' : 
                   currentList.statut === 'en-cours' ? 'En cours' : 'Complétée'}
                </span>
              </div>
            </div>

            {/* Aperçu des articles */}
            <div className="articles-preview">
              <div className="articles-count">
                <span className="count-number">{articlesCount}</span>
                <span className="count-label">article{articlesCount > 1 ? 's' : ''}</span>
              </div>
              
              {articlesToShow.length > 0 ? (
                <div className="articles-sample">
                  {articlesToShow.map((article, index) => (
                    <div key={index} className="article-item">
                      <span className="article-name">{article.nom}</span>
                      <span className="article-quantity">×{article.quantite}</span>
                    </div>
                  ))}
                  {articlesCount > 3 && (
                    <div className="articles-more">
                      +{articlesCount - 3} autre{articlesCount - 3 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-articles">
                  <span>Liste vide</span>
                </div>
              )}
            </div>

            {/* Budget estimé */}
            {estimatedBudget > 0 && (
              <div className="budget-info">
                <span className="budget-label">Budget estimé</span>
                <span className="budget-amount">{estimatedBudget.toFixed(2)}€</span>
              </div>
            )}

            {/* Bouton de navigation */}
            <button 
              className="navigate-btn"
              onClick={() => handleNavigation(currentList.id)}
              aria-label={`Ouvrir la liste ${currentList.nom} dans Smart Shopping`}
            >
              <span className="btn-text">Ouvrir la liste</span>
              <span className="btn-icon">→</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
});

ShoppingListModule.displayName = 'ShoppingListModule';

export default ShoppingListModule;
