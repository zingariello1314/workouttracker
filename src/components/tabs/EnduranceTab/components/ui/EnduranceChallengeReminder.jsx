import React, { useMemo } from 'react';
import { useTranslation } from '../../../../../utils/translations';

const EnduranceChallengeReminder = ({ activeChallenges = [], urgentChallenges = [], onSelectActivity, hideLinks = false }) => {
  const t = useTranslation();

  const activityTypes = useMemo(() => {
    const seen = new Set();
    (activeChallenges || []).forEach((c) => {
      if (c?.activityType) seen.add(c.activityType);
    });
    return [...seen];
  }, [activeChallenges]);

  if (!Array.isArray(activeChallenges) || activeChallenges.length === 0) {
    return null;
  }

  const handleSelect = (activityType) => {
    if (activityType && typeof onSelectActivity === 'function') {
      onSelectActivity(activityType);
    }
  };

  return (
    <div className="box pad todo" style={{ marginBottom: 32 }}>
      <span className="defis-lab">À accomplir</span>
      <b className="big num">{activeChallenges.length}</b>
      <h3>
        Vous avez {activeChallenges.length} défi{activeChallenges.length > 1 ? 's' : ''} à accomplir
      </h3>

      {Array.isArray(urgentChallenges) && urgentChallenges.length > 0 && (
        <p className="warn" style={{ marginTop: 10 }}>
          {urgentChallenges.length} défi{urgentChallenges.length > 1 ? 's' : ''} urgent
          {urgentChallenges.length > 1 ? 's' : ''} (échéance &lt; 24h)
        </p>
      )}

      {hideLinks ? null : (
        <>
          <p>
            {t(
              'endurance.challenges.reminderBody',
              'Ouvre l’onglet de chaque activité concernée pour voir le détail de tes défis.'
            )}
          </p>
          <div className="chips" style={{ marginTop: 14 }} role="list">
            {activityTypes.map((at) => (
              <button
                key={`challenge-activity-${at}`}
                type="button"
                onClick={() => handleSelect(at)}
                className="chip"
              >
                {t(`endurance.menu.${at}`, at)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(EnduranceChallengeReminder);
