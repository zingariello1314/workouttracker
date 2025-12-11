import React, { memo, useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Clock, MapPin, ChevronRight, AlertCircle } from 'lucide-react';
import { useSmartShopping } from '../../../hooks/useSmartShopping';
import deepLinkService from '../../../services/navigation/DeepLinkService';

/**
 * Module de liste de courses (Position 11)
 * Affiche la liste programmée pour l'heure actuelle ou la plus proche
 * Permet la navigation vers Smart Shopping avec positionnement précis
 */
const ShoppingListModule = memo(({ 
  moduleId = 'shopping-list-module',
  moduleType = 'historical',
  navigationTarget,
  navigation,
  setActiveTab
}) => {
  const { listes, loading, error } = useSmartShopping();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mise à jour de l'heure toutes les minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, []);

  // Logique de sélection de la liste la plus proche temporellement
  const currentList = useMemo(() => {
    if (!listes || listes.length === 0) return null;

    const now = currentTime;
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinutes;

    // Filtrer les listes avec des créneaux horaires programmés
    const scheduledLists = listes.filter(liste => 
      liste.scheduledTime || liste.timeSlot
    );

    if (scheduledLists.length === 0) {
      // Si aucune liste programmée, prendre la première liste prête
      return listes.find(liste => liste.statut === 'prete') || listes[0] || null;
    }

    // Trouver la liste programmée pour maintenant ou la plus proche
    let closestList = null;
    let smallestTimeDiff = Infinity;

    scheduledLists.forEach(liste => {
      const scheduledTime = liste.scheduledTime || liste.timeSlot;
      let listTimeInMinutes;

      if (typeof scheduledTime === 'string') {
        // Format "HH:MM"
        const [hours, minutes] = scheduledTime.split(':').map(Number);
        listTimeInMinutes = hours * 60 + minutes;
      } else if (scheduledTime instanceof Date) {
        listTimeInMinutes = scheduledTime.getHours() * 60 + scheduledTime.getMinutes();
      } else {
        return; // Skip invalid time format
      }

      // Calculer la différence de temps
      let timeDiff;
      let isCurrentTime = false;
      
      // Vérifier si c'est maintenant (tolérance de 30 minutes)
      const diffFromNow = Math.abs(currentTimeInMinutes - listTimeInMinutes);
      if (diffFromNow <= 30) {
        timeDiff = diffFromNow;
        isCurrentTime = true;
      } else if (listTimeInMinutes > currentTimeInMinutes) {
        // Liste programmée plus tard aujourd'hui
        timeDiff = listTimeInMinutes - currentTimeInMinutes;
      } else {
        // Liste programmée plus tôt, considérer le lendemain
        timeDiff = (24 * 60) - currentTimeInMinutes + listTimeInMinutes;
      }

      if (timeDiff < smallestTimeDiff) {
        smallestTimeDiff = timeDiff;
        closestList = {
          ...liste,
          isClosest: !isCurrentTime, // Si ce n'est pas maintenant, c'est la plus proche
          timeDiffMinutes: timeDiff
        };
      }
    });

    return closestList;
  }, [listes, currentTime]);

  // Navigation vers Smart Shopping
  const handleNavigateToSmartShopping = async () => {
    if (!setActiveTab) {
      console.warn('[ShoppingListModule] setActiveTab non fourni');
      return;
    }

    const target = {
      tab: 'Finances',
      subtab: 'smart-shopping',
      moduleId: currentList ? `shopping-list-${currentList.id}` : 'smart-shopping-main',
      scrollBehavior: 'smooth',
      highlightDuration: 3000,
      params: {
        listId: currentList?.id,
        section: 'listes'
      }
    };

    try {
      const success = await deepLinkService.navigateToModule(target, setActiveTab);
      if (success) {
        console.log('[ShoppingListModule] Navigation réussie vers Smart Shopping');
      }
    } catch (error) {
      console.error('[ShoppingListModule] Erreur de navigation:', error);
    }
  };

  // Formatage du temps relatif
  const formatTimeRelative = (timeDiffMinutes) => {
    if (timeDiffMinutes < 60) {
      return `dans ${timeDiffMinutes}min`;
    } else if (timeDiffMinutes < 24 * 60) {
      const hours = Math.floor(timeDiffMinutes / 60);
      const minutes = timeDiffMinutes % 60;
      return `dans ${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
    } else {
      const days = Math.floor(timeDiffMinutes / (24 * 60));
      return `dans ${days} jour${days > 1 ? 's' : ''}`;
    }
  };

  if (loading) {
    return (
      <section className="sidebar-section shopping-list-module" id={moduleId}>
        <header className="sidebar-section-header">
          <h2 className="sidebar-section-title">
            <span className="sidebar-section-icon" aria-hidden="true">🛒</span>
            Liste Courses
          </h2>
        </header>
        
        <div className="sidebar-section-content">
          <div className="module-loading" role="status" aria-label="Chargement des listes de courses">
            <div className="loading-spinner"></div>
            <span className="loading-text">Chargement...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="sidebar-section shopping-list-module" id={moduleId}>
        <header className="sidebar-section-header">
          <h2 className="sidebar-section-title">
            <span className="sidebar-section-icon" aria-hidden="true">🛒</span>
            Liste Courses
          </h2>
        </header>
        
        <div className="sidebar-section-content">
          <div className="module-error" role="alert">
            <AlertCircle className="error-icon" />
            <span className="error-text">Erreur de chargement</span>
          </div>
        </div>
      </section>
    );
  }

  if (!currentList) {
    return (
      <section className="sidebar-section shopping-list-module" id={moduleId}>
        <header className="sidebar-section-header">
          <h2 className="sidebar-section-title">
            <span className="sidebar-section-icon" aria-hidden="true">🛒</span>
            Liste Courses
          </h2>
        </header>
        
        <div className="sidebar-section-content">
          <div className="module-empty">
            <ShoppingCart className="empty-icon" />
            <span className="empty-text">Aucune liste programmée</span>
            <button 
              className="create-list-btn"
              onClick={handleNavigateToSmartShopping}
              aria-label="Créer une nouvelle liste de courses"
            >
              Créer une liste
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      className="sidebar-section shopping-list-module" 
      id={moduleId}
      data-module-id={moduleId}
      data-module-type={moduleType}
    >
      <header className="sidebar-section-header">
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">🛒</span>
          Liste Courses
        </h2>
      </header>
      
      <div className="sidebar-section-content">
        <div className="shopping-list-content">
          {/* En-tête de la liste */}
          <div className="list-header">
            <div className="list-info">
              <h4 className="list-name">{currentList.nom}</h4>
              <div className="list-meta">
                {currentList.isClosest ? (
                  <div className="time-indicator closest">
                    <Clock className="time-icon" />
                    <span className="time-text">
                      {formatTimeRelative(currentList.timeDiffMinutes)}
                    </span>
                  </div>
                ) : (
                  <div className="time-indicator current">
                    <Clock className="time-icon" />
                    <span className="time-text">Maintenant</span>
                  </div>
                )}
              </div>
            </div>
            <div className="list-status">
              <span className={`status-badge ${currentList.statut}`}>
                {currentList.statut === 'prete' && 'Prête'}
                {currentList.statut === 'en-cours' && 'En cours'}
                {currentList.statut === 'completee' && 'Terminée'}
              </span>
            </div>
          </div>

          {/* Aperçu des articles */}
          <div className="articles-preview">
            {currentList.articles && currentList.articles.length > 0 ? (
              <>
                <div className="articles-count">
                  <span className="count-number">{currentList.articles.length}</span>
                  <span className="count-label">article{currentList.articles.length > 1 ? 's' : ''}</span>
                </div>
                <div className="articles-sample">
                  {currentList.articles.slice(0, 3).map((article, index) => (
                    <div key={article.id || index} className="article-item">
                      <span className="article-name">{article.nom}</span>
                      {article.quantite > 1 && (
                        <span className="article-quantity">×{article.quantite}</span>
                      )}
                    </div>
                  ))}
                  {currentList.articles.length > 3 && (
                    <div className="articles-more">
                      +{currentList.articles.length - 3} autres
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="no-articles">
                <span>Liste vide</span>
              </div>
            )}
          </div>

          {/* Budget estimé */}
          {currentList.budget && (
            <div className="budget-info">
              <span className="budget-label">Budget:</span>
              <span className="budget-amount">{currentList.budget.toFixed(2)}€</span>
            </div>
          )}

          {/* Bouton de navigation */}
          <button 
            className="navigate-btn"
            onClick={handleNavigateToSmartShopping}
            aria-label={`Ouvrir la liste ${currentList.nom} dans Smart Shopping`}
          >
            <span className="btn-text">Ouvrir la liste</span>
            <ChevronRight className="btn-icon" />
          </button>
        </div>
      </div>
    </section>
  );
});

ShoppingListModule.displayName = 'ShoppingListModule';

export default ShoppingListModule;