import React, { useState } from 'react';
import { Brain, RefreshCw, Zap, AlertCircle, TrendingUp } from 'lucide-react';

/**
 * AIRecommendations Component - Displays AI-powered workout recommendations
 * 
 * @param {Object} props
 * @param {Array} props.recommendations - Array of 5 recommendations
 * @param {Array} props.alternatives - Array of alternative recommendations
 * @param {Function} props.onRefresh - Callback when refresh button is clicked
 */
const AIRecommendations = ({
  recommendations = [],
  alternatives = [],
  onRefresh
}) => {
  const [refreshing, setRefreshing] = useState({});
  const [displayedRecs, setDisplayedRecs] = useState(recommendations);

  // Priority colors and icons
  const priorityConfig = {
    high: {
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      icon: AlertCircle,
      label: 'HAUTE'
    },
    medium: {
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      icon: Zap,
      label: 'MOYENNE'
    },
    low: {
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      icon: TrendingUp,
      label: 'BASSE'
    }
  };

  // Impact classes
  const impactClasses = {
    'high-impact': 'text-green-400 font-bold',
    'medium-impact': 'text-yellow-400 font-semibold',
    'low-impact': 'text-gray-400'
  };

  // Handle refresh for a specific recommendation
  const handleRefresh = (recId, index) => {
    if (!onRefresh || !alternatives || alternatives.length === 0) return;

    setRefreshing(prev => ({ ...prev, [recId]: true }));

    // Simulate API call delay
    setTimeout(() => {
      // Find an alternative that's not currently displayed
      const currentIds = displayedRecs.map(r => r.id);
      const availableAlternatives = alternatives.filter(alt => !currentIds.includes(alt.id));
      
      if (availableAlternatives.length > 0) {
        // Pick a random alternative
        const newRec = availableAlternatives[Math.floor(Math.random() * availableAlternatives.length)];
        
        // Replace the recommendation
        setDisplayedRecs(prev => {
          const updated = [...prev];
          updated[index] = newRec;
          return updated;
        });

        if (onRefresh) {
          onRefresh(recId);
        }
      }

      setRefreshing(prev => ({ ...prev, [recId]: false }));
    }, 500);
  };

  // Calculate AI confidence (based on priority distribution)
  const calculateConfidence = () => {
    if (displayedRecs.length === 0) return 0;
    const highPriority = displayedRecs.filter(r => r.priority === 'high').length;
    const mediumPriority = displayedRecs.filter(r => r.priority === 'medium').length;
    return Math.round((highPriority * 100 + mediumPriority * 70) / displayedRecs.length);
  };

  // Get next focus area (most common category)
  const getNextFocus = () => {
    if (displayedRecs.length === 0) return 'N/A';
    const categories = displayedRecs.map(r => r.category);
    const counts = categories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  };

  const confidence = calculateConfidence();
  const nextFocus = getNextFocus();

  if (displayedRecs.length === 0) {
    return (
      <div className="ai-recommendations bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="text-center py-8">
          <Brain className="mx-auto mb-3 text-gray-600" size={48} />
          <p className="text-gray-400">Aucune recommandation disponible</p>
          <p className="text-sm text-gray-500 mt-2">L'IA analyse vos performances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-recommendations bg-gray-800 border border-gray-700 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Brain className="text-purple-400" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-purple-400">
              Recommandations IA
            </h3>
            <p className="text-xs text-gray-400">
              Basées sur vos performances
            </p>
          </div>
        </div>

        {/* AI Summary */}
        <div className="text-right">
          <div className="text-xs text-gray-400">Confiance IA</div>
          <div className="text-lg font-bold text-purple-400">{confidence}%</div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-3 mb-6">
        {displayedRecs.slice(0, 5).map((rec, index) => {
          const config = priorityConfig[rec.priority] || priorityConfig.medium;
          const PriorityIcon = config.icon;
          const isRefreshing = refreshing[rec.id];

          return (
            <div
              key={rec.id}
              className={`recommendation-card bg-gray-900 border ${config.border} rounded-lg p-4 transition-all ${
                isRefreshing ? 'opacity-50' : 'opacity-100'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 text-2xl">
                  {rec.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-white">
                      {rec.title}
                    </h4>
                    <div className={`flex items-center gap-1 px-2 py-0.5 ${config.bg} ${config.border} border rounded-full flex-shrink-0`}>
                      <PriorityIcon size={12} className={config.color} />
                      <span className={`text-xs font-bold ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 mb-2">
                    {rec.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-500">
                        Catégorie: <span className="text-gray-300">{rec.category}</span>
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className={impactClasses[rec.impactClass]}>
                        Impact: {rec.impact}
                      </span>
                    </div>

                    {/* Refresh Button */}
                    <button
                      onClick={() => handleRefresh(rec.id, index)}
                      disabled={isRefreshing || !alternatives || alternatives.length === 0}
                      className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                      title="Voir une alternative"
                    >
                      <RefreshCw
                        size={16}
                        className={`text-gray-400 group-hover:text-purple-400 transition-colors ${
                          isRefreshing ? 'animate-spin' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Summary Footer */}
      <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <Brain className="text-purple-400 flex-shrink-0" size={20} />
          <div className="text-sm text-gray-300">
            <span className="font-bold text-purple-400">Focus suggéré: </span>
            {nextFocus}
            <span className="text-gray-500 ml-2">
              • Cliquez sur <RefreshCw size={12} className="inline" /> pour voir des alternatives
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoize for performance (Phase 6)
export default React.memo(AIRecommendations);
