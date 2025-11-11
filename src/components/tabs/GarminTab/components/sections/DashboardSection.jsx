import React from 'react';
import useUIMetricsTelemetry from '../../hooks/useUIMetricsTelemetry';

const DashboardSection = ({ fallback = null, children }) => {
  useUIMetricsTelemetry('DashboardSection');

  return (
    <div role="tabpanel" id="garmin-dashboard-panel" aria-labelledby="dashboard-tab">
      <React.Suspense fallback={fallback}>
        {children}
      </React.Suspense>
    </div>
  );
};

export default DashboardSection;
