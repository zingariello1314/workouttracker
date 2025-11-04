/**
 * 🎯 COMPOSANT ACTIVE CHALLENGES
 * 
 * Composant pour afficher les défis actifs du jour.
 * Utilise le hook useActiveChallenges pour optimiser les performances.
 * 
 * @module ActiveChallenges
 */

import React, { memo } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Award } from 'lucide-react';
import ChallengeCard from '../../ui/ChallengeCard';
import { useActiveChallenges } from '../hooks/useActiveChallenges';

/**
 * Composant pour afficher les défis actifs
 * 
 * @param {Object} props
 * @param {Date} props.date - Date pour laquelle afficher les défis
 * @param {Function} props.onChallengeComplete - Callback pour compléter un défi
 * 
 * @example
 * <ActiveChallenges
 *   date={currentDate}
 *   onChallengeComplete={handleChallengeComplete}
 * />
 */
const ActiveChallenges = memo(({ date, onChallengeComplete }) => {
  const activeChallenges = useActiveChallenges({ date });

  // Ne pas afficher si aucun défi actif
  if (!activeChallenges || activeChallenges.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
      <CardHeader>
        <CardTitle className="flex items-center text-purple-200">
          <Award className="mr-2" size={20} />
          Défis actifs ({activeChallenges.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeChallenges.map(challenge => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onComplete={onChallengeComplete}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

ActiveChallenges.displayName = 'ActiveChallenges';

export default ActiveChallenges;

