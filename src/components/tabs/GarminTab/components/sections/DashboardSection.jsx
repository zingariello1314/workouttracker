import React from 'react';

const DashboardSection = ({ fallback = null, children }) => (
  <div role="tabpanel" id="garmin-dashboard-panel" aria-labelledby="dashboard-tab">
    <React.Suspense fallback={fallback}>
      {children}
    </React.Suspense>
  </div>
);

export default DashboardSection;

