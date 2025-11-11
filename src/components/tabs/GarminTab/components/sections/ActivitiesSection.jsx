import React from 'react';

const ActivitiesSection = ({ fallback = null, children }) => (
  <div role="tabpanel" id="garmin-activities-panel" aria-labelledby="activities-tab">
    <React.Suspense fallback={fallback}>
      {children}
    </React.Suspense>
  </div>
);

export default ActivitiesSection;

