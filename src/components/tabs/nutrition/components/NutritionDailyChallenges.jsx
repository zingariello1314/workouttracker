/**
 * NutritionDailyChallenges - Défis Nutritionnels Quotidiens
 * 
 * Composant pour afficher et suivre les défis nutritionnels quotidiens
 * 
 * @module components/tabs/nutrition/components/NutritionDailyChallenges
 */

import React, { useState, useMemo } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import Button from '../../../ui/Button';
import { 
  Target, 
  CheckCircle, 
  XCircle, 
  Trophy,
  Calendar,
  RefreshCw,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { useNutritionDailyChallenges } from '../../../../hooks/useNutritionDailyChallenges';
import { DateHelper } from '../../../../utils/dateHelper';

const CHALLENGE_DEFINITIONS = {
  breakfastRespected: {
    id: 'breakfastRespected',
    name: 'Petit-déjeuner respecté',
    description: 'Prendre le petit-déjeuner programmé ou planifié',
    icon: '🌅',
    category: 'plan'
  },
  morningSnackRespected: {
    id: 'morningSnackRespected',
    name: 'Collation matin respectée',
    description: 'Prendre la collation prévue (portion + type)',
    icon: '🍎',
    category: 'plan'
  },
  lunchProgrammed: {
    id: 'lunchProgrammed',
    name: 'Déjeuner programmé — 100% respect',
    description: 'Ne pas dévier du repas du midi programmé (ingrédients + portions ±10%)',
    icon: '🍽️',
    category: 'plan'
  },
  afternoonSnackRespected: {
    id: 'afternoonSnackRespected',
    name: 'Collation après-midi respectée',
    description: 'Suivre la collation prévue sans ajouter d\'alternatives',
    icon: '🥜',
    category: 'plan'
  },
  preWorkoutClean: {
    id: 'preWorkoutClean',
    name: 'Pré-entraînement propre',
    description: 'Prendre la collation/prépa prévue avant l\'entraînement (30–60 min avant)',
    icon: '⚡',
    category: 'timing'
  },
  postWorkoutOptimized: {
    id: 'postWorkoutOptimized',
    name: 'Post-entraînement optimisé',
    description: 'Manger un repas ou collation post-entraînement contenant protéine + glucide dans les 60 min',
    icon: '💪',
    category: 'timing'
  },
  dinnerRespected: {
    id: 'dinnerRespected',
    name: 'Dîner respecté',
    description: 'Manger le dîner planifié et rester en posture droite',
    icon: '🌙',
    category: 'plan'
  },
  hydrationDaily: {
    id: 'hydrationDaily',
    name: 'Hydratation journalière',
    description: 'Atteindre le quota d\'eau du jour (ex. 2 L)',
    icon: '💧',
    category: 'objectives'
  },
  proteinGoalReached: {
    id: 'proteinGoalReached',
    name: 'Objectif protéines atteint',
    description: 'Atteindre l\'objectif protéines du jour (ex : x g)',
    icon: '🥩',
    category: 'objectives'
  },
  vegetablesDaily: {
    id: 'vegetablesDaily',
    name: 'Végétal du jour',
    description: 'Consommer au moins 3 portions de légumes dans la journée',
    icon: '🥬',
    category: 'quality'
  },
  noUltraProcessed: {
    id: 'noUltraProcessed',
    name: 'Aucun ultra-transformé',
    description: '0 aliment ultra-transformé journalier (snacks industriels, plats industriels)',
    icon: '🚫',
    category: 'quality'
  },
  zeroAddedSugar: {
    id: 'zeroAddedSugar',
    name: 'Zéro sucre ajouté',
    description: 'Ne consommer aucun sucre ajouté (boissons + desserts) pendant la journée',
    icon: '🍬',
    category: 'quality'
  },
  macrosInRange: {
    id: 'macrosInRange',
    name: 'Macros dans la plage (journée)',
    description: 'Rester dans la tolérance macro définie (ex : ±10% pour chaque macro)',
    icon: '📊',
    category: 'objectives'
  },
  journalComplete: {
    id: 'journalComplete',
    name: 'Journal complet — 100% loggé',
    description: 'Avoir tous les repas + collations loggés (pas d\'oubli)',
    icon: '📝',
    category: 'completeness'
  }
};

const CATEGORY_COLORS = {
  plan: 'border-blue-500 bg-blue-500/10',
  timing: 'border-purple-500 bg-purple-500/10',
  objectives: 'border-green-500 bg-green-500/10',
  quality: 'border-orange-500 bg-orange-500/10',
  completeness: 'border-yellow-500 bg-yellow-500/10'
};

const NutritionDailyChallenges = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = DateHelper.toYYYYMMDD(selectedDate);
  
  const { challenges, stats, loading, error, refresh } = useNutritionDailyChallenges({
    date: selectedDate,
    autoRefresh: true
  });
  
  // Grouper défis par catégorie
  const challengesByCategory = useMemo(() => {
    if (!challenges) return {};
    
    const grouped = {};
    Object.entries(challenges.challenges).forEach(([key, result]) => {
      const def = CHALLENGE_DEFINITIONS[key];
      if (!def) return;
      
      const category = def.category || 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      
      grouped[category].push({
        ...def,
        ...result
      });
    });
    
    return grouped;
  }, [challenges]);
  
  const categoryLabels = {
    plan: 'Respect du Plan',
    timing: 'Timing',
    objectives: 'Objectifs',
    quality: 'Qualité',
    completeness: 'Complétude'
  };
  
  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Chargement des défis...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="text-center py-8">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <p className="text-slate-300 mb-2">Erreur lors du chargement des défis</p>
          <Button onClick={refresh} variant="outline" className="mt-4">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy size={24} className="text-yellow-400" />
                Défis Nutritionnels Quotidiens
              </CardTitle>
              <p className="text-slate-300 text-sm mt-1">
                {new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white mb-1">
                {stats.percentage}%
              </div>
              <div className="text-sm text-slate-300">
                {stats.completed} / {stats.total} défis complétés
              </div>
            </div>
          </div>
        </CardHeader>
        
        {/* Barre de progression */}
        <CardContent>
          <div className="w-full bg-slate-700/50 rounded-full h-4 mb-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${stats.percentage}%` }}
            ></div>
          </div>
          
          {/* Sélecteur de date et refresh */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const prevDate = new Date(selectedDate);
                prevDate.setDate(prevDate.getDate() - 1);
                setSelectedDate(prevDate);
              }}
            >
              <Calendar size={16} className="mr-2" />
              Jour précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
              disabled={DateHelper.toYYYYMMDD(new Date()) === dateStr}
            >
              Aujourd'hui
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const nextDate = new Date(selectedDate);
                nextDate.setDate(nextDate.getDate() + 1);
                if (nextDate <= new Date()) {
                  setSelectedDate(nextDate);
                }
              }}
              disabled={DateHelper.toYYYYMMDD(new Date()) === dateStr}
            >
              Jour suivant
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              className="ml-auto"
            >
              <RefreshCw size={16} />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Défis groupés par catégorie */}
      <div className="space-y-6">
        {Object.entries(challengesByCategory).map(([category, categoryChallenges]) => (
          <Card key={category} className={`bg-slate-800/50 border-slate-700 ${CATEGORY_COLORS[category]}`}>
            <CardHeader>
              <CardTitle className="text-white text-lg">
                {categoryLabels[category] || category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categoryChallenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className={`rounded-lg p-4 border transition-all ${
                      challenge.completed
                        ? 'border-green-500/50 bg-green-500/10'
                        : 'border-slate-600 bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{challenge.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`font-medium ${
                            challenge.completed ? 'text-white' : 'text-slate-300'
                          }`}>
                            {challenge.name}
                          </h4>
                          {challenge.completed ? (
                            <CheckCircle size={20} className="text-green-400" />
                          ) : (
                            <XCircle size={20} className="text-slate-500" />
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mb-2">
                          {challenge.description}
                        </p>
                        {!challenge.completed && challenge.reason && (
                          <p className="text-xs text-orange-400 bg-orange-500/10 rounded px-2 py-1 inline-block">
                            {challenge.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Message si aucun défi */}
      {Object.keys(challengesByCategory).length === 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="text-center py-8">
            <Target size={48} className="text-slate-400 mx-auto mb-4" />
            <p className="text-slate-300 mb-2">Aucun défi disponible</p>
            <p className="text-slate-400 text-sm">
              Enregistrez des repas pour activer les défis
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NutritionDailyChallenges;

