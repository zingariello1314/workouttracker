import React from 'react';
import useUIMetricsTelemetry from '../../hooks/useUIMetricsTelemetry';

const ActivitiesSection = ({ fallback = null, children }) => {
  useUIMetricsTelemetry('ActivitiesSection');

  return (
    <div role="tabpanel" id="garmin-activities-panel" aria-labelledby="activities-tab">
      <React.Suspense fallback={fallback}>
        {children}
      </React.Suspense>
    </div>
  );
};

export default ActivitiesSection;

