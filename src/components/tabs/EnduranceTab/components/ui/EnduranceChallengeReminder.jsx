import React from 'react';
import { Award } from 'lucide-react';

const EnduranceChallengeReminder = ({ activeChallenges = [], urgentChallenges = [], onSelectActivity }) => {
  if (!Array.isArray(activeChallenges) || activeChallenges.length === 0) {
    return null;
  }

  const handleSelect = (activityType) => {
    if (activityType && typeof onSelectActivity === 'function') {
      onSelectActivity(activityType);
    }
  };

  return (
    <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-xl p-4 mb-6 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
          <Award className="w-4 h-4 text-white" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-orange-200">
          ⚠️ Vous avez {activeChallenges.length} défi{activeChallenges.length > 1 ? 's' : ''} à accomplir
        </h3>
      </div>

      <div className="space-y-2">
        {Array.isArray(urgentChallenges) && urgentChallenges.length > 0 && (
          <div className="text-red-300 text-sm font-medium">
            🚨 {urgentChallenges.length} défi{urgentChallenges.length > 1 ? 's' : ''} urgent{urgentChallenges.length > 1 ? 's' : ''} (échéance &lt; 24h)
          </div>
        )}

        <div className="flex flex-wrap gap-2" role="list">
          {activeChallenges.slice(0, 3).map((challenge) => (
            <button
              key={`urgent-challenge-${challenge.id}`}
              type="button"
              onClick={() => handleSelect(challenge.activityType)}
              className="px-3 py-1 bg-orange-500/30 hover:bg-orange-500/50 text-orange-200 rounded-lg text-sm transition-colors"
            >
              {challenge.name}
            </button>
          ))}
          {activeChallenges.length > 3 && (
            <span className="px-3 py-1 text-orange-300 text-sm" role="note">
              +{activeChallenges.length - 3} autres...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(EnduranceChallengeReminder);
