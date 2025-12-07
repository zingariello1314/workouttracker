import React from 'react';
import { Award, Star, Target, Flame, Calendar, Zap, Trophy } from 'lucide-react';

/**
 * AchievementsPanel Component - Displays daily achievements and progress
 * 
 * @param {Object} props
 * @param {Array} props.achievements - Array of achievement objects
 */
const AchievementsPanel = ({
  achievements = []
}) => {
  // Icon mapping per achievement type
  const typeIcons = {
    record: Trophy,
    streak: Flame,
    performance: Zap,
    goal: Target,
    consistency: Calendar
  };

  // Get icon component for achievement type
  const getTypeIcon = (type) => {
    const IconComponent = typeIcons[type] || Award;
    return IconComponent;
  };

  // Calculate summary stats
  const summary = achievements.reduce((acc, achievement) => {
    if (achievement.statusClass === 'completed') {
      acc.completed++;
      // Extract XP from reward string (e.g., "+50 XP")
      const xpMatch = achievement.reward.match(/\+(\d+)\s*XP/i);
      if (xpMatch) {
        acc.totalXP += parseInt(xpMatch[1]);
      }
    }
    if (achievement.type === 'streak' && achievement.statusClass === 'active') {
      // Extract streak days from description
      const streakMatch = achievement.description.match(/(\d+)\s*jours?/i);
      if (streakMatch) {
        acc.currentStreak = Math.max(acc.currentStreak, parseInt(streakMatch[1]));
      }
    }
    if (achievement.type === 'goal') {
      acc.totalGoals++;
      if (achievement.statusClass === 'completed') {
        acc.completedGoals++;
      }
    }
    return acc;
  }, {
    completed: 0,
    totalXP: 0,
    currentStreak: 0,
    totalGoals: 0,
    completedGoals: 0
  });

  if (achievements.length === 0) {
    return (
      <div className="achievements-panel bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="text-center py-8">
          <Award className="mx-auto mb-3 text-gray-600" size={48} />
          <p className="text-gray-400">Aucun achievement aujourd'hui</p>
          <p className="text-sm text-gray-500 mt-2">Complétez vos objectifs pour débloquer des achievements !</p>
        </div>
      </div>
    );
  }

  return (
    <div className="achievements-panel bg-gray-800 border border-gray-700 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-orange-400 flex items-center gap-2">
          <Award size={20} />
          Achievements du Jour
        </h3>
        <div className="flex items-center gap-2">
          <Star className="text-yellow-400" size={16} />
          <span className="text-sm font-bold text-yellow-400">
            {summary.completed}/{achievements.length}
          </span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card bg-gray-900 border border-gray-700 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-400 mb-1">XP Bonus</div>
          <div className="text-xl font-bold text-yellow-400">
            +{summary.totalXP}
          </div>
        </div>
        <div className="stat-card bg-gray-900 border border-gray-700 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-400 mb-1">Série Actuelle</div>
          <div className="text-xl font-bold text-orange-400">
            {summary.currentStreak} 🔥
          </div>
        </div>
        <div className="stat-card bg-gray-900 border border-gray-700 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-400 mb-1">Objectifs</div>
          <div className="text-xl font-bold text-green-400">
            {summary.completedGoals}/{summary.totalGoals}
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="achievements-grid space-y-3">
        {achievements.map((achievement, index) => {
          const IconComponent = getTypeIcon(achievement.type);
          const isNew = achievement.isNew;
          const isCompleted = achievement.statusClass === 'completed';
          
          return (
            <div
              key={achievement.id || index}
              className={`achievement-card bg-gray-900 border rounded-lg p-4 transition-all ${
                isCompleted
                  ? 'border-green-500/50 bg-green-500/5'
                  : 'border-gray-700 hover:border-orange-500/50'
              } ${isNew ? 'animate-pulse-slow' : ''}`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`p-3 rounded-full flex-shrink-0 ${
                  isCompleted
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-orange-500/20 text-orange-400'
                }`}>
                  <IconComponent size={24} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-white">
                      {achievement.title}
                    </h4>
                    {isNew && (
                      <span className="px-2 py-0.5 bg-yellow-500 text-black text-xs font-bold rounded-full flex-shrink-0 animate-bounce">
                        NEW!
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-400 mb-2">
                    {achievement.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-yellow-400">
                        {achievement.reward}
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className={`text-xs font-semibold ${
                        isCompleted ? 'text-green-400' : 'text-orange-400'
                      }`}>
                        {achievement.status}
                      </span>
                    </div>

                    {/* Type Badge */}
                    <span className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-400">
                      {achievement.type}
                    </span>
                  </div>
                </div>

                {/* Completion Checkmark */}
                {isCompleted && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Motivational Footer */}
      {summary.completed === achievements.length && (
        <div className="mt-6 p-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg">
          <p className="text-center text-green-400 font-semibold flex items-center justify-center gap-2">
            <Star className="text-yellow-400" size={20} />
            Tous les achievements complétés ! Bravo ! 🎉
            <Star className="text-yellow-400" size={20} />
          </p>
        </div>
      )}
    </div>
  );
};

// Add to global CSS
const styles = `
@keyframes pulse-slow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.animate-pulse-slow {
  animation: pulse-slow 2s ease-in-out infinite;
}
`;

// Memoize for performance (Phase 6)
export default React.memo(AchievementsPanel);
