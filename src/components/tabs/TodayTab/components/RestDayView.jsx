/**
 * 🎉 COMPOSANT REST DAY VIEW
 * 
 * Composant pour afficher la vue jour de repos.
 * Affiche un message de repos et les défis actifs si disponibles.
 * 
 * @module RestDayView
 */

import React, { memo } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Award } from 'lucide-react';
import ChallengeCard from '../../ui/ChallengeCard';

/**
 * Composant pour afficher la vue jour de repos
 * 
 * @param {Object} props
 * @param {Array} props.activeChallenges - Liste des défis actifs
 * @param {Function} props.onChallengeComplete - Callback pour compléter un défi
 * 
 * @example
 * <RestDayView
 *   activeChallenges={activeChallenges}
 *   onChallengeComplete={handleChallengeComplete}
 * />
 */
const RestDayView = memo(({ activeChallenges = [], onChallengeComplete }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="text-center py-12 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700">
        <div className="text-gray-400 mb-4">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-semibold mb-2 text-white">Jour de repos</h3>
          <p>Profitez de votre journée de récupération !</p>
        </div>
      </div>
      
      {/* Section des défis actifs, même si jour de repos */}
      {activeChallenges.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 mt-8">
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
      )}
    </div>
  );
});

RestDayView.displayName = 'RestDayView';

export default RestDayView;


