/**
 * 📋 COMPOSANT STRETCH LIST
 * 
 * Composant pour afficher la liste des étirements du jour.
 * Utilise StretchItem pour chaque étirement.
 * 
 * @module StretchList
 */

import React, { memo } from 'react';
import StretchItem from './StretchItem';

/**
 * Composant pour afficher la liste des étirements
 * 
 * @param {Object} props
 * @param {Object} props.stretches - Objet avec moments comme clés et descriptions comme valeurs
 * @param {Date} props.date - Date des étirements
 * 
 * @example
 * <StretchList
 *   stretches={{ matin: "Étirements du dos", midi: "...", soir: "..." }}
 *   date={currentDate}
 * />
 */
const StretchList = memo(({ stretches = {}, date }) => {
  if (!stretches || Object.keys(stretches).length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {Object.entries(stretches).map(([moment, description]) => (
        <StretchItem
          key={moment}
          moment={moment}
          description={description}
          date={date}
        />
      ))}
    </div>
  );
});

StretchList.displayName = 'StretchList';

export default StretchList;



