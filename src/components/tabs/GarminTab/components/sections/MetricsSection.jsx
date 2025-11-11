import React from 'react';

const MetricsSection = ({ fallback = null, children }) => (
  <div role="tabpanel" id="garmin-metrics-panel" aria-labelledby="metrics-tab">
    <React.Suspense fallback={fallback}>
      {children}
    </React.Suspense>
  </div>
);

export default MetricsSection;

