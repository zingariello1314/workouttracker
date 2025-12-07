import React, { useEffect, useState } from 'react';
import { Trophy, TrendingUp, Sparkles } from 'lucide-react';

/**
 * RecordsCelebration Component - Celebrates weekly records with animations
 * 
 * @param {Object} props
 * @param {Array} props.records - Array of weekly records
 */
const RecordsCelebration = ({
  records = []
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [animatedRecords, setAnimatedRecords] = useState([]);

  // Emoji mapping per exercise type
  const exerciseEmojis = {
    'pompes': '💪',
    'tractions': '🏋️',
    'squats': '🦵',
    'abdos': '🔥',
    'course': '🏃',
    'vélo': '🚴',
    'natation': '🏊',
    'planche': '⏱️',
    'burpees': '⚡',
    'default': '🎯'
  };

  // Get emoji for exercise
  const getExerciseEmoji = (exerciseName) => {
    const name = exerciseName.toLowerCase();
    for (const [key, emoji] of Object.entries(exerciseEmojis)) {
      if (name.includes(key)) return emoji;
    }
    return exerciseEmojis.default;
  };

  // Trigger confetti animation on mount if there are records
  useEffect(() => {
    if (records.length > 0) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [records.length]);

  // Animate records appearing one by one
  useEffect(() => {
    if (records.length > 0) {
      setAnimatedRecords([]);
      records.forEach((_, index) => {
        setTimeout(() => {
          setAnimatedRecords(prev => [...prev, index]);
        }, index * 200);
      });
    }
  }, [records]);

  if (records.length === 0) {
    return (
      <div className="records-celebration bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-6">
        <div className="text-center py-8">
          <Trophy className="mx-auto mb-3 text-gray-600" size={48} />
          <p className="text-gray-400">Aucun record cette semaine</p>
          <p className="text-sm text-gray-500 mt-2">Continuez à vous entraîner !</p>
        </div>
      </div>
    );
  }

  return (
    <div className="records-celebration relative bg-gradient-to-br from-yellow-900/20 via-orange-900/20 to-gray-900 border-2 border-yellow-500/50 rounded-lg p-6 overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="confetti-container absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random()}s`
              }}
            >
              {['🎉', '⭐', '✨', '🏆', '💫'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full animate-pulse">
            <Trophy className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Records de la Semaine !
            </h3>
            <p className="text-sm text-gray-400">
              {records.length} nouveau{records.length > 1 ? 'x' : ''} record{records.length > 1 ? 's' : ''} battu{records.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Sparkles className="text-yellow-400 animate-spin-slow" size={32} />
      </div>

      {/* Records Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {records.map((record, index) => {
          const isAnimated = animatedRecords.includes(index);
          const emoji = getExerciseEmoji(record.exercise);
          const deltaSign = record.delta > 0 ? '+' : '';
          
          return (
            <div
              key={index}
              className={`record-card bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/30 rounded-lg p-4 transform transition-all duration-500 ${
                isAnimated ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
              } hover:scale-105 hover:border-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/20`}
            >
              {/* Exercise Emoji */}
              <div className="text-4xl mb-2 animate-bounce">
                {emoji}
              </div>

              {/* Exercise Name */}
              <div className="text-sm font-semibold text-yellow-400 mb-1">
                {record.exercise}
              </div>

              {/* Current Value */}
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-white">
                  {record.current}
                </span>
                <span className="text-sm text-gray-400">
                  {record.unit}
                </span>
              </div>

              {/* Delta */}
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp size={16} className="text-green-400" />
                <span className="font-bold text-green-400">
                  {deltaSign}{record.delta} {record.unit}
                </span>
                <span className="text-gray-500">vs avant</span>
              </div>

              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shine" />
            </div>
          );
        })}
      </div>

      {/* Motivational Message */}
      <div className="relative z-10 mt-6 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg">
        <p className="text-center text-yellow-400 font-semibold">
          🔥 Performance exceptionnelle ! Continuez sur cette lancée ! 🔥
        </p>
      </div>

      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-orange-500/5 to-transparent pointer-events-none" />
    </div>
  );
};

// CSS for animations (add to your global CSS or styled-components)
const styles = `
@keyframes confetti-fall {
  0% {
    transform: translateY(-100%) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(360deg);
    opacity: 0;
  }
}

@keyframes shine {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.confetti {
  position: absolute;
  font-size: 24px;
  animation: confetti-fall linear forwards;
}

.animate-shine {
  animation: shine 3s infinite;
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}
`;

// Memoize for performance (Phase 6)
export default React.memo(RecordsCelebration);
