/**
 * ActivityHeatmap Component
 * Matrice d'activité style GitHub - 20 semaines × 7 jours
 */

import { useState, useEffect } from 'react';

const ActivityHeatmap = ({ weeks = 20 }) => {
  const [activityData, setActivityData] = useState({});
  const [hoveredCell, setHoveredCell] = useState(null);

  // Generate activity data
  useEffect(() => {
    const data = {};
    
    // Weeks 1-5: High activity
    for (let week = 1; week <= 5; week++) {
      for (let day = 1; day <= 7; day++) {
        let intensity;
        if (week <= 3) {
          intensity = 0.7 + (Math.random() * 0.3); // 0.7-1.0
        } else {
          intensity = 0.4 + (Math.random() * 0.4); // 0.4-0.8
        }
        data[`${week}-${day}`] = intensity;
      }
    }
    
    // Weeks 6-12: Moderate activity
    for (let week = 6; week <= 12; week++) {
      for (let day = 1; day <= 7; day++) {
        const intensity = 0.3 + (Math.random() * 0.4); // 0.3-0.7
        data[`${week}-${day}`] = intensity;
      }
    }
    
    // Weeks 13-20: Variable activity
    for (let week = 13; week <= 20; week++) {
      for (let day = 1; day <= 7; day++) {
        let intensity;
        if (week <= 15) {
          intensity = 0.2 + (Math.random() * 0.3); // 0.2-0.5
        } else {
          intensity = 0.1 + (Math.random() * 0.2); // 0.1-0.3
        }
        data[`${week}-${day}`] = intensity;
      }
    }
    
    // Mark today (Tuesday of week 20)
    data['20-2'] = 0.9;
    
    setActivityData(data);
  }, []);

  // Get activity class based on intensity
  const getActivityClass = (week, day) => {
    const intensity = activityData[`${week}-${day}`] || 0;
    const level = intensity > 0.8 ? 4 : intensity > 0.6 ? 3 : intensity > 0.4 ? 2 : intensity > 0.2 ? 1 : 0;
    return `pm-activity-cell level-${level}`;
  };

  // Get tooltip text
  const getActivityTooltip = (week, day) => {
    const intensity = activityData[`${week}-${day}`] || 0;
    const quests = intensity > 0.2 ? Math.floor(intensity * 20) : 0;
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const weekNumber = 16 + (week - 1);
    return `${quests} quêtes - S${weekNumber} ${days[day - 1]}`;
  };

  // Get week number (current week = 35)
  const getWeekNumber = (week) => {
    return 16 + (week - 1);
  };

  return (
    <div className="pm-activity-chart">
      <h4>🔥 ACTIVITÉ MATRIX</h4>
      <div className="pm-activity-container">
        <div className="pm-activity-days">
          <span>L</span>
          <span>M</span>
          <span>M</span>
          <span>J</span>
          <span>V</span>
          <span>S</span>
          <span>D</span>
        </div>
        
        <div className="pm-activity-weeks">
          {Array.from({ length: weeks }, (_, weekIndex) => {
            const week = weekIndex + 1;
            return (
              <div key={week} className="pm-week-row">
                <div className="pm-week-label">S{getWeekNumber(week)}</div>
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const day = dayIndex + 1;
                  return (
                    <div
                      key={day}
                      className={getActivityClass(week, day)}
                      title={getActivityTooltip(week, day)}
                      onMouseEnter={() => setHoveredCell({ week, day })}
                      onMouseLeave={() => setHoveredCell(null)}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      
        <div className="pm-activity-legend">
          <span>Moins</span>
          <div className="pm-legend-dots">
            <div className="pm-legend-dot level-0"></div>
            <div className="pm-legend-dot level-1"></div>
            <div className="pm-legend-dot level-2"></div>
            <div className="pm-legend-dot level-3"></div>
            <div className="pm-legend-dot level-4"></div>
          </div>
          <span>Plus</span>
        </div>
      </div>
      
      <div className="pm-activity-metrics">
        <div className="pm-activity-metric">
          <div className="pm-activity-label">Régularité</div>
          <div className="pm-activity-value">87%🔥</div>
        </div>
        <div className="pm-activity-metric">
          <div className="pm-activity-label">Streak</div>
          <div className="pm-activity-value">23j</div>
        </div>
        <div className="pm-activity-metric">
          <div className="pm-activity-label">Semaine</div>
          <div className="pm-activity-value">12</div>
        </div>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
