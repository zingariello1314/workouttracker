import React from 'react';
import { Plus, CheckCircle2, Circle } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';

/**
 * MissionWeeklyGrid Component - Displays a 7-day grid of missions
 * 
 * @param {Object} props
 * @param {Array} props.missions - Array of day missions
 * @param {Function} props.onToggleMission - Callback when mission is toggled
 * @param {Function} props.onAddMission - Callback when "Add Mission" is clicked
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message
 */
const MissionWeeklyGrid = ({
  missions = [],
  onToggleMission,
  onAddMission,
  loading = false,
  error = null
}) => {
  // Days of the week in French
  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Chargement des missions..." />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} type="error" />;
  }

  return (
    <div className="mission-weekly-grid">
      {/* Grid Container */}
      <div className="grid grid-cols-8 gap-4">
        {/* 7 Day Columns */}
        {daysOfWeek.map((dayName, index) => {
          const dayMissions = missions.find(m => m.dayName === dayName) || {
            dayName,
            date: '',
            isToday: false,
            missions: []
          };

          return (
            <div
              key={dayName}
              className={`mission-day-column ${
                dayMissions.isToday ? 'today' : ''
              }`}
            >
              {/* Day Header */}
              <div className="mission-day-header">
                <div className="day-name">{dayName}</div>
                {dayMissions.date && (
                  <div className="day-date">
                    {new Date(dayMissions.date).getDate()}
                  </div>
                )}
                {dayMissions.isToday && (
                  <div className="today-badge">Aujourd'hui</div>
                )}
              </div>

              {/* Missions List */}
              <div className="missions-list">
                {dayMissions.missions.length > 0 ? (
                  dayMissions.missions.map((mission) => (
                    <div
                      key={mission.id}
                      className={`mission-card ${
                        mission.completed ? 'completed' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => onToggleMission(mission.id, dayName)}
                        className="mission-checkbox"
                        aria-label={
                          mission.completed
                            ? 'Marquer comme non complété'
                            : 'Marquer comme complété'
                        }
                      >
                        {mission.completed ? (
                          <CheckCircle2
                            size={20}
                            className="text-green-500"
                          />
                        ) : (
                          <Circle size={20} className="text-gray-500" />
                        )}
                      </button>

                      {/* Mission Content */}
                      <div className="mission-content">
                        <div className="mission-text">{mission.text}</div>
                        {mission.completed && (
                          <div className="mission-xp">
                            +{mission.xp} XP
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-day">
                    <p className="text-sm text-gray-500">Aucune mission</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Add Mission Column */}
        <div
          className="mission-add-column"
          onClick={onAddMission}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onAddMission();
            }
          }}
          aria-label="Ajouter une nouvelle mission"
        >
          <div className="add-mission-icon">
            <Plus size={48} />
          </div>
          <div className="add-mission-text">
            Ajouter une mission
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoize for performance (Phase 6)
export default React.memo(MissionWeeklyGrid);
