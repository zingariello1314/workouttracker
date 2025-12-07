import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Custom hook for AI recommendations
 * Generates personalized workout recommendations with rotation
 */
const useAIRecommendations = (performanceData) => {
  const [recommendations, setRecommendations] = useState([]);
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);

  // All possible recommendations pool
  const recommendationsPool = useMemo(() => [
    {
      id: 'rec_1',
      icon: '🎯',
      title: 'Augmenter le volume des pompes',
      description: 'Vos pompes sont en dessous de votre objectif. Ajoutez 2 séries supplémentaires.',
      category: 'Volume',
      priority: 'high',
      priorityText: 'HAUTE',
      impact: 'Impact élevé sur la force du haut du corps',
      impactClass: 'high-impact'
    },
    {
      id: 'rec_2',
      icon: '⚡',
      title: 'Réduire le temps de repos',
      description: 'Passez de 90s à 60s de repos entre les séries pour améliorer l\'endurance.',
      category: 'Intensité',
      priority: 'medium',
      priorityText: 'MOYENNE',
      impact: 'Améliore l\'endurance cardiovasculaire',
      impactClass: 'medium-impact'
    },
    {
      id: 'rec_3',
      icon: '🔥',
      title: 'Ajouter des exercices de jambes',
      description: 'Équilibrez votre entraînement avec des squats ou des fentes.',
      category: 'Équilibre',
      priority: 'high',
      priorityText: 'HAUTE',
      impact: 'Développement musculaire harmonieux',
      impactClass: 'high-impact'
    },
    {
      id: 'rec_4',
      icon: '📈',
      title: 'Progresser en tractions',
      description: 'Utilisez des élastiques pour atteindre 3 séries de 8 répétitions.',
      category: 'Progression',
      priority: 'medium',
      priorityText: 'MOYENNE',
      impact: 'Renforce le dos et les biceps',
      impactClass: 'medium-impact'
    },
    {
      id: 'rec_5',
      icon: '🧘',
      title: 'Intégrer des étirements',
      description: 'Ajoutez 10 minutes d\'étirements après chaque séance.',
      category: 'Récupération',
      priority: 'low',
      priorityText: 'BASSE',
      impact: 'Prévient les blessures et améliore la flexibilité',
      impactClass: 'low-impact'
    },
    {
      id: 'rec_6',
      icon: '💪',
      title: 'Varier les exercices de pectoraux',
      description: 'Alternez pompes classiques, diamant et déclinées.',
      category: 'Variété',
      priority: 'medium',
      priorityText: 'MOYENNE',
      impact: 'Stimule tous les faisceaux musculaires',
      impactClass: 'medium-impact'
    },
    {
      id: 'rec_7',
      icon: '⏱️',
      title: 'Augmenter la durée des séances',
      description: 'Passez de 30 à 45 minutes pour plus de volume.',
      category: 'Volume',
      priority: 'low',
      priorityText: 'BASSE',
      impact: 'Plus de temps pour travailler tous les muscles',
      impactClass: 'low-impact'
    },
    {
      id: 'rec_8',
      icon: '🎪',
      title: 'Essayer le training en circuit',
      description: 'Enchaînez 5 exercices sans repos pour brûler plus de calories.',
      category: 'Intensité',
      priority: 'high',
      priorityText: 'HAUTE',
      impact: 'Maximise la dépense énergétique',
      impactClass: 'high-impact'
    },
    {
      id: 'rec_9',
      icon: '🏋️',
      title: 'Ajouter du lest progressivement',
      description: 'Utilisez un gilet lesté pour augmenter la difficulté.',
      category: 'Progression',
      priority: 'medium',
      priorityText: 'MOYENNE',
      impact: 'Accélère les gains de force',
      impactClass: 'medium-impact'
    },
    {
      id: 'rec_10',
      icon: '📊',
      title: 'Suivre votre progression hebdomadaire',
      description: 'Notez vos performances pour identifier les tendances.',
      category: 'Suivi',
      priority: 'low',
      priorityText: 'BASSE',
      impact: 'Meilleure compréhension de vos progrès',
      impactClass: 'low-impact'
    }
  ], []);

  // Generate initial recommendations based on performance
  const generateRecommendations = useCallback(() => {
    setLoading(true);

    // Shuffle and select 5 recommendations
    const shuffled = [...recommendationsPool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 5);
    const remaining = shuffled.slice(5);

    setRecommendations(selected);
    setAlternatives(remaining);
    setLoading(false);
  }, [recommendationsPool]);

  // Refresh a specific recommendation
  const refreshRecommendation = useCallback((id) => {
    if (alternatives.length === 0) return;

    setRecommendations(prev => {
      const index = prev.findIndex(r => r.id === id);
      if (index === -1) return prev;

      // Get a random alternative
      const randomIndex = Math.floor(Math.random() * alternatives.length);
      const newRec = alternatives[randomIndex];

      // Update alternatives
      const oldRec = prev[index];
      setAlternatives(alt => {
        const newAlt = [...alt];
        newAlt[randomIndex] = oldRec;
        return newAlt;
      });

      // Replace recommendation
      const newRecs = [...prev];
      newRecs[index] = newRec;
      return newRecs;
    });
  }, [alternatives]);

  // Calculate AI confidence based on priority distribution
  const aiConfidence = useMemo(() => {
    if (recommendations.length === 0) return 0;

    const priorityScores = {
      high: 100,
      medium: 70,
      low: 40
    };

    const totalScore = recommendations.reduce((sum, rec) => {
      return sum + (priorityScores[rec.priority] || 0);
    }, 0);

    return Math.round(totalScore / recommendations.length);
  }, [recommendations]);

  // Determine next focus based on most common category
  const nextFocus = useMemo(() => {
    if (recommendations.length === 0) return 'Aucune recommandation';

    const categoryCount = recommendations.reduce((acc, rec) => {
      acc[rec.category] = (acc[rec.category] || 0) + 1;
      return acc;
    }, {});

    const mostCommon = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])[0];

    return mostCommon ? mostCommon[0] : 'Équilibre';
  }, [recommendations]);

  // Generate recommendations on mount or when performance data changes
  useEffect(() => {
    generateRecommendations();
  }, [generateRecommendations, performanceData]);

  return {
    recommendations,
    alternatives,
    loading,
    aiConfidence,
    nextFocus,
    refreshRecommendation,
    regenerate: generateRecommendations
  };
};

export default useAIRecommendations;
