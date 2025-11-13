/**
 * Composant de timeline virtualisée pour améliorer les performances
 * avec de grandes quantités d'activités (>100).
 * 
 * Virtualise les activités visibles dans le viewport horizontal,
 * réduisant le nombre de nœuds DOM rendus.
 * 
 * @module VirtualizedTimeline
 */

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Seuil pour activer la virtualisation (nombre d'activités)
 */
const VIRTUALIZATION_THRESHOLD = 100;

/**
 * Marge de rendu (nombre d'activités à rendre en dehors du viewport)
 */
const RENDER_MARGIN = 10;

/**
 * Composant VirtualizedTimeline
 * 
 * Virtualise les activités d'une timeline en ne rendant que celles
 * visibles dans le viewport horizontal, améliorant les performances
 * pour les grandes quantités d'activités.
 * 
 * @param {Object} props
 * @param {Array} props.activities - Liste des activités à afficher (avec positions calculées)
 * @param {number} props.containerWidth - Largeur du conteneur (px)
 * @param {number} props.scrollLeft - Position de scroll horizontale (px)
 * @param {Function} props.renderActivity - Fonction pour rendre une activité
 * @param {Object} props.dateRange - Plage de dates { start: Date, end: Date }
 * @param {boolean} props.enableVirtualization - Force l'activation de la virtualisation
 */
export const VirtualizedTimeline = React.memo(({
  activities = [],
  containerWidth = 800,
  scrollLeft = 0,
  renderActivity,
  dateRange,
  enableVirtualization = false
}) => {
  const containerRef = useRef(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: activities.length });

  // Calculer si la virtualisation est nécessaire
  const shouldVirtualize = useMemo(() => {
    return enableVirtualization || activities.length > VIRTUALIZATION_THRESHOLD;
  }, [activities.length, enableVirtualization]);

  // Calculer les activités visibles dans le viewport
  const visibleActivities = useMemo(() => {
    if (!shouldVirtualize || !dateRange || activities.length === 0) {
      return activities;
    }

    const { start: rangeStart, end: rangeEnd } = dateRange;
    const totalDays = (rangeEnd - rangeStart) / (1000 * 60 * 60 * 24);
    
    // Calculer la plage de dates visible dans le viewport
    const visibleStartPercent = Math.max(0, (scrollLeft / containerWidth) - 0.1); // Marge 10%
    const visibleEndPercent = Math.min(1, ((scrollLeft + containerWidth) / containerWidth) + 0.1); // Marge 10%
    
    const visibleStartDate = new Date(rangeStart.getTime() + (visibleStartPercent * totalDays * 24 * 60 * 60 * 1000));
    const visibleEndDate = new Date(rangeStart.getTime() + (visibleEndPercent * totalDays * 24 * 60 * 60 * 1000));

    // Filtrer les activités visibles
    const visible = activities.filter(activity => {
      const activityDate = new Date(activity.date || activity.startTimeLocal);
      return activityDate >= visibleStartDate && activityDate <= visibleEndDate;
    });

    return visible;
  }, [activities, shouldVirtualize, dateRange, scrollLeft, containerWidth]);

  // Mettre à jour la plage visible lors du scroll
  useEffect(() => {
    if (!shouldVirtualize || !containerRef.current) {
      return;
    }

    const updateVisibleRange = () => {
      if (!dateRange || activities.length === 0) {
        return;
      }

      const { start: rangeStart, end: rangeEnd } = dateRange;
      const totalDays = (rangeEnd - rangeStart) / (1000 * 60 * 60 * 24);
      const container = containerRef.current;
      
      if (!container) {
        return;
      }

      const currentScrollLeft = container.scrollLeft || scrollLeft;
      const currentWidth = container.clientWidth || containerWidth;

      // Calculer la plage de dates visible
      const visibleStartPercent = Math.max(0, (currentScrollLeft / currentWidth) - 0.1);
      const visibleEndPercent = Math.min(1, ((currentScrollLeft + currentWidth) / currentWidth) + 0.1);
      
      const visibleStartDate = new Date(rangeStart.getTime() + (visibleStartPercent * totalDays * 24 * 60 * 60 * 1000));
      const visibleEndDate = new Date(rangeStart.getTime() + (visibleEndPercent * totalDays * 24 * 60 * 60 * 1000));

      // Trouver les indices des activités visibles
      let startIdx = 0;
      let endIdx = activities.length - 1;

      for (let i = 0; i < activities.length; i++) {
        const activityDate = new Date(activities[i].date || activities[i].startTimeLocal);
        if (activityDate >= visibleStartDate && startIdx === 0) {
          startIdx = Math.max(0, i - RENDER_MARGIN);
        }
        if (activityDate <= visibleEndDate) {
          endIdx = Math.min(activities.length - 1, i + RENDER_MARGIN);
        }
      }

      setVisibleRange({ start: startIdx, end: endIdx });
    };

    updateVisibleRange();

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', updateVisibleRange, { passive: true });
      return () => {
        container.removeEventListener('scroll', updateVisibleRange);
      };
    }
  }, [shouldVirtualize, dateRange, activities, scrollLeft, containerWidth]);

  // Rendre les activités (virtualisées ou non)
  const renderedActivities = useMemo(() => {
    if (!shouldVirtualize) {
      return activities.map((activity, idx) => 
        renderActivity(activity, idx)
      );
    }

    // Rendre uniquement les activités visibles
    return activities
      .slice(visibleRange.start, visibleRange.end + 1)
      .map((activity, idx) => 
        renderActivity(activity, visibleRange.start + idx)
      );
  }, [activities, shouldVirtualize, visibleRange, renderActivity]);

  // Rendu : VirtualizedTimeline retourne un fragment React
  // car les activités sont positionnées de manière absolue dans le parent
  return (
    <>
      {renderedActivities}
      {/* Indicateur de virtualisation (dev uniquement) */}
      {shouldVirtualize && process.env.NODE_ENV === 'development' && (
        <div 
          className="fixed top-20 right-4 bg-blue-900/80 text-white text-xs px-2 py-1 rounded z-50 pointer-events-none"
          style={{ fontSize: '10px' }}
          aria-label={`Timeline virtualisée: ${visibleRange.end - visibleRange.start + 1} activités visibles sur ${activities.length} total`}
        >
          Virtualisé: {visibleRange.end - visibleRange.start + 1}/{activities.length}
        </div>
      )}
    </>
  );
});

VirtualizedTimeline.propTypes = {
  activities: PropTypes.arrayOf(PropTypes.object).isRequired,
  containerWidth: PropTypes.number,
  scrollLeft: PropTypes.number,
  renderActivity: PropTypes.func.isRequired,
  dateRange: PropTypes.shape({
    start: PropTypes.instanceOf(Date).isRequired,
    end: PropTypes.instanceOf(Date).isRequired
  }),
  enableVirtualization: PropTypes.bool
};

VirtualizedTimeline.displayName = 'VirtualizedTimeline';

export default VirtualizedTimeline;

