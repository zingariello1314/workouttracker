import React, { useEffect, useState } from 'react';
import SportXPBar from './SportXPBar';
import {
  getXpAppearancePreference,
  shouldShowSportXpBar,
  subscribeXpAppearance
} from '../../../../utils/xpAppearancePreference';

/** Affiche la barre XP Sport seulement si l’onglet est autorisé en Apparence. */
export default function SportXpBarSlot({ tabId, className = '' }) {
  const [preference, setPreference] = useState(getXpAppearancePreference);

  useEffect(() => subscribeXpAppearance(setPreference), []);

  if (!shouldShowSportXpBar(tabId, preference)) return null;

  return (
    <div className={className}>
      <SportXPBar />
    </div>
  );
}
