/**
 * Composant de liste virtualisée pour les activités Garmin.
 * 
 * Utilise react-window pour virtualiser le rendu des activités,
 * améliorant les performances pour les listes >100 items.
 * 
 * @module VirtualizedActivityList
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { FixedSizeList } from 'react-window';
import SwimmingActivityCard from './ActivityCards/SwimmingActivityCard';
import JumpRopeActivityCard from './ActivityCards/JumpRopeActivityCard';
import CardioActivityCard from './ActivityCards/CardioActivityCard';

/**
 * Composant de ligne pour la liste virtualisée.
 * Mémoïsé pour éviter les re-renders inutiles.
 * 
 * @param {Object} props
 * @param {number} props.index - Index de l'item
 * @param {Object} props.style - Style injecté par react-window
 * @param {Array} props.data - Données (activities, itemHeight, activitiesKey)
 */
const ActivityRow = React.memo(({ index, style, data }) => {
  const { activities, itemHeight, activitiesKey } = data;
  const activity = activities[index];

  if (!activity) {
    return null;
  }

  // Déterminer le composant à utiliser selon le type
  const ActivityComponent = 
    activity.type === 'swimming' ? SwimmingActivityCard :
    activity.type === 'jumpRope' ? JumpRopeActivityCard :
    CardioActivityCard;

  return (
    <div
      style={{
        ...style,
        paddingBottom: index < activities.length - 1 ? '1rem' : 0
      }}
    >
      <ActivityComponent 
        key={activity.id || `${activity.date}_${activity.time}`} 
        activity={activity} 
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparaison personnalisée pour éviter re-renders inutiles
  return (
    prevProps.index === nextProps.index &&
    prevProps.data.activitiesKey === nextProps.data.activitiesKey &&
    prevProps.data.itemHeight === nextProps.data.itemHeight &&
    prevProps.style.top === nextProps.style.top &&
    prevProps.style.height === nextProps.style.height
  );
});

ActivityRow.displayName = 'ActivityRow';

/**
 * Génère une clé de stabilité pour un tableau d'activités.
 * Permet de détecter les changements réels même si la référence change.
 * 
 * @param {Array} activities - Tableau d'activités
 * @returns {string} Clé de stabilité
 */
function getActivitiesStabilityKey(activities) {
  if (!Array.isArray(activities) || activities.length === 0) {
    return 'empty';
  }
  
  const keys = activities
    .slice(0, 10)
    .map(act => act.id || `${act.date}_${act.time || ''}_${act.type || ''}`)
    .join('|');
  
  return `${activities.length}_${keys}`;
}

/**
 * Composant de liste virtualisée pour les activités.
 * 
 * @param {Object} props
 * @param {Array} [props.activities=[]] - Liste des activités à afficher
 * @param {number} [props.height=600] - Hauteur du conteneur
 * @param {number} [props.itemHeight=200] - Hauteur de chaque item
 * @param {number} [props.overscanCount=5] - Nombre d'items à rendre en dehors du viewport
 * @returns {React.ReactElement}
 */
export const VirtualizedActivityList = ({
  activities = [],
  height = 600,
  itemHeight = 200,
  overscanCount = 5
}) => {
  // Créer une clé de stabilité pour éviter recalculs inutiles
  const activitiesKey = useMemo(() => getActivitiesStabilityKey(activities), [activities]);
  
  // Mémoïser les données pour éviter les re-renders
  // Utiliser activitiesKey comme déclencheur, mais garder activities pour le rendu
  const listData = useMemo(() => ({
    activities,
    itemHeight,
    activitiesKey
    // Note: activities est nécessaire pour le rendu, mais activitiesKey déclenche le recalcul
  }), [activitiesKey, itemHeight, activities]);

  if (activities.length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        Aucune activité pour cette période.
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
      <FixedSizeList
        height={height}
        itemCount={activities.length}
        itemSize={itemHeight}
        itemData={listData}
        overscanCount={overscanCount}
        width="100%"
        className="virtualized-list"
      >
        {ActivityRow}
      </FixedSizeList>
    </div>
  );
};

VirtualizedActivityList.propTypes = {
  activities: PropTypes.arrayOf(PropTypes.object).isRequired,
  height: PropTypes.number,
  itemHeight: PropTypes.number,
  overscanCount: PropTypes.number
};

export default VirtualizedActivityList;

