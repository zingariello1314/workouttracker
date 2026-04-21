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
    <div className="mb-6 rounded-xl border-2 border-[#0F4C5C]/70 bg-black p-4 shadow-md shadow-black/40 backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#0F5C45]/50 bg-[#0F5C45]/30">
          <Award className="h-4 w-4 text-sky-300" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-teal-100">
          Vous avez {activeChallenges.length} défi{activeChallenges.length > 1 ? 's' : ''} à accomplir
        </h3>
      </div>

      <div className="space-y-2">
        {Array.isArray(urgentChallenges) && urgentChallenges.length > 0 && (
          <div className="text-sm font-medium text-red-300">
            {urgentChallenges.length} défi{urgentChallenges.length > 1 ? 's' : ''} urgent
            {urgentChallenges.length > 1 ? 's' : ''} (échéance &lt; 24h)
          </div>
        )}

        <div className="flex flex-wrap gap-2" role="list">
          {activeChallenges.slice(0, 3).map((challenge) => (
            <button
              key={`urgent-challenge-${challenge.id}`}
              type="button"
              onClick={() => handleSelect(challenge.activityType)}
              className="rounded-lg border border-[#0F5C45]/50 bg-[#0F4C5C]/20 px-3 py-1 text-sm text-teal-100 transition-colors hover:border-[#0F5C45]/70 hover:bg-[#0F5C45]/25"
            >
              {challenge.name}
            </button>
          ))}
          {activeChallenges.length > 3 && (
            <span className="px-3 py-1 text-sm text-teal-600" role="note">
              +{activeChallenges.length - 3} autres…
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(EnduranceChallengeReminder);
