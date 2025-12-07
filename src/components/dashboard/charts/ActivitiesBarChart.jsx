/**
 * ActivitiesBarChart Component
 * Graphique en barres verticales pour la répartition des activités
 */

import React from 'react';

const ActivitiesBarChart = ({ activities = [], getActivityColor }) => {
  const maxCount = Math.max(...activities.map(a => a.count), 30);

  return (
    <div className="pm-activities-chart-compact">
      <h5>📊 RÉPARTITION ACTIVITÉS</h5>
      <div className="pm-chart-container" style={{ position: 'relative' }}>
        <div className="pm-bars-container">
          {activities.map((activity, index) => (
            <div key={index} className="pm-bar-column">
              <div className="pm-bar-wrapper">
                <div 
                  className="pm-bar" 
                  style={{ 
                    height: `${(activity.count / maxCount) * 240}px`,
                    backgroundColor: getActivityColor(activity.type)
                  }}
                >
                  <div className="pm-bar-value">{activity.count}</div>
                </div>
              </div>
              <div className="pm-bar-label">{activity.name}</div>
            </div>
          ))}
        </div>
        <div className="pm-y-axis">
          <span>30</span>
          <span>20</span>
          <span>10</span>
          <span>0</span>
        </div>
      </div>
      <div className="pm-x-axis-label">Types d'activités</div>
    </div>
  );
};

export default ActivitiesBarChart;
