/**
 * BadgeDetailModal.jsx
 * 
 * Modal affichant les détails d'un badge avec sa progression
 * 
 * @module components/tabs/nutrition/components/BadgeDetailModal
 */

import React, { useMemo } from 'react';
import Modal from '../../../ui/Modal';
import { 
  Trophy, 
  Award, 
  Calendar,
  Target,
  Lock,
  CheckCircle,
  TrendingUp,
  Zap,
  Star
} from 'lucide-react';

const BadgeDetailModal = ({ 
  isOpen, 
  onClose, 
  badge,
  isUnlocked,
  unlockedDate,
  userData = null // Données utilisateur pour calculer progression
}) => {
  if (!badge) return null;

  // Calculer une approximation de la progression pour badges non débloqués
  const progress = useMemo(() => {
    if (isUnlocked) {
      return {
        current: 100,
        target: 100,
        percent: 100,
        message: 'Badge débloqué !',
        details: unlockedDate ? `Débloqué le ${new Date(unlockedDate).toLocaleDateString('fr-FR')}` : null
      };
    }

    if (!userData) {
      return {
        current: 0,
        target: 100,
        percent: 0,
        message: 'Calcul de progression en cours...',
        details: null
      };
    }

    // Analyser la condition du badge pour calculer progression approximative
    try {
      const badgeId = badge.id;

      // Badges basés sur streak
      if (badgeId.includes('streak') || badgeId.includes('_day_streak')) {
        const streakNum = parseInt(badgeId.match(/(\d+)day/)?.[1] || badgeId.match(/streak.*?(\d+)/)?.[1] || '0');
        const currentStreak = userData.streaks?.nutrition?.current || 0;
        const target = streakNum || 7; // Default 7 si pas trouvé
        
        return {
          current: Math.min(currentStreak, target),
          target,
          percent: Math.min(100, Math.round((currentStreak / target) * 100)),
          message: `Série actuelle : ${currentStreak} jour${currentStreak > 1 ? 's' : ''}`,
          details: target > currentStreak ? `${target - currentStreak} jour${target - currentStreak > 1 ? 's' : ''} restant${target - currentStreak > 1 ? 's' : ''}` : null
        };
      }

      // Badges basés sur nombre de repas
      if (badgeId.includes('meals') || badgeId.includes('meals_logged')) {
        const mealNum = parseInt(badgeId.match(/(\d+)meals/)?.[1] || badgeId.match(/(\d+)/)?.[1] || '0');
        const totalMeals = userData.nutritionHistory?.reduce((sum, day) => {
          return sum + (day.meals || []).length;
        }, 0) || 0;
        const target = mealNum || 30; // Default 30 si pas trouvé
        
        return {
          current: Math.min(totalMeals, target),
          target,
          percent: Math.min(100, Math.round((totalMeals / target) * 100)),
          message: `Repas enregistrés : ${totalMeals}`,
          details: target > totalMeals ? `${target - totalMeals} repas restant${target - totalMeals > 1 ? 's' : ''}` : null
        };
      }

      // Badges basés sur nombre de jours consécutifs (avec nombre spécifique)
      // Mais exclure les badges streak qui sont déjà gérés
      if ((badgeId.includes('_day') || badgeId.includes('days')) && !badgeId.includes('streak')) {
        const dayNum = parseInt(badgeId.match(/(\d+)day/)?.[1] || badgeId.match(/(\d+)/)?.[1] || '0');
        const target = dayNum || 7; // Default 7 si pas trouvé
        
        // Pour les badges consécutifs, utiliser la streak actuelle
        const currentStreak = userData.streaks?.nutrition?.current || 0;
        
        return {
          current: Math.min(currentStreak, target),
          target,
          percent: Math.min(100, Math.round((currentStreak / target) * 100)),
          message: `Jours consécutifs : ${currentStreak}`,
          details: target > currentStreak ? `${target - currentStreak} jour${target - currentStreak > 1 ? 's' : ''} restant${target - currentStreak > 1 ? 's' : ''}` : null
        };
      }

      // Badges basés sur recettes
      if (badgeId.includes('recipe')) {
        const recipeNum = parseInt(badgeId.match(/(\d+)recipe/)?.[1] || badgeId.match(/(\d+)/)?.[1] || '0');
        let recipeCount = 0;
        userData.nutritionHistory?.forEach(day => {
          (day.meals || []).forEach(meal => {
            const foods = meal.foods || [];
            if (foods.length >= 3) recipeCount++; // Recette = au moins 3 ingrédients
          });
        });
        const target = recipeNum || 3; // Default 3 si pas trouvé
        
        return {
          current: Math.min(recipeCount, target),
          target,
          percent: Math.min(100, Math.round((recipeCount / target) * 100)),
          message: `Recettes créées : ${recipeCount}`,
          details: target > recipeCount ? `${target - recipeCount} recette${target - recipeCount > 1 ? 's' : ''} restante${target - recipeCount > 1 ? 's' : ''}` : null
        };
      }

      // Badges basés sur sources de protéines
      if (badgeId.includes('protein') && badgeId.includes('source')) {
        const proteinNum = parseInt(badgeId.match(/(\d+)/)?.[1] || '0');
        const uniqueFoods = new Set();
        userData.nutritionHistory?.forEach(day => {
          (day.meals || []).forEach(meal => {
            const foods = meal.foods || [];
            foods.forEach(food => {
              if (food && food.name && (food.protein || 0) > 5) {
                uniqueFoods.add(food.name.toLowerCase());
              }
            });
          });
        });
        const target = proteinNum || 10; // Default 10 si pas trouvé
        
        return {
          current: Math.min(uniqueFoods.size, target),
          target,
          percent: Math.min(100, Math.round((uniqueFoods.size / target) * 100)),
          message: `Sources de protéines : ${uniqueFoods.size}`,
          details: target > uniqueFoods.size ? `${target - uniqueFoods.size} source${target - uniqueFoods.size > 1 ? 's' : ''} restante${target - uniqueFoods.size > 1 ? 's' : ''}` : null
        };
      }

      // Badges basés sur variété d'aliments
      if (badgeId.includes('variety') || badgeId.includes('vegetable') || badgeId.includes('new_food')) {
        const varietyNum = parseInt(badgeId.match(/(\d+)/)?.[1] || '0');
        const uniqueFoods = new Set();
        // Pour variété, regarder les derniers jours (7, 14, 30 selon le badge)
        const dayRange = badgeId.includes('14') ? 14 : badgeId.includes('30') ? 30 : 7;
        const history = userData.nutritionHistory || [];
        const recentHistory = history.slice(-dayRange);
        
        recentHistory.forEach(day => {
          (day.meals || []).forEach(meal => {
            const foods = meal.foods || [];
            foods.forEach(food => {
              if (food && food.name) uniqueFoods.add(food.name.toLowerCase());
            });
          });
        });
        const target = varietyNum || 10; // Default 10 si pas trouvé
        
        return {
          current: Math.min(uniqueFoods.size, target),
          target,
          percent: Math.min(100, Math.round((uniqueFoods.size / target) * 100)),
          message: `Aliments différents (${dayRange}j) : ${uniqueFoods.size}`,
          details: target > uniqueFoods.size ? `${target - uniqueFoods.size} aliment${target - uniqueFoods.size > 1 ? 's' : ''} restant${target - uniqueFoods.size > 1 ? 's' : ''}` : null
        };
      }

      // Badges basés sur hydratation
      if (badgeId.includes('hydration') || badgeId.includes('water') || badgeId.includes('hydrated')) {
        const hydrationTarget = badgeId.includes('2l') || badgeId.includes('2000') ? 2000 : 
                               badgeId.includes('1l') || badgeId.includes('1000') ? 1000 : 0;
        const history = userData.nutritionHistory || [];
        // Compter les jours avec hydratation suffisante
        let daysWithGoodHydration = 0;
        const dayRange = badgeId.includes('30') ? 30 : badgeId.includes('7') ? 7 : 1;
        const recentHistory = history.slice(-dayRange);
        
        recentHistory.forEach(day => {
          const water = day.dailyTotals?.waterIntake || 0;
          const target = hydrationTarget || 2000; // Default 2000ml si pas trouvé
          if (water >= target * 0.95) daysWithGoodHydration++;
        });
        
        return {
          current: daysWithGoodHydration,
          target: dayRange,
          percent: Math.min(100, Math.round((daysWithGoodHydration / dayRange) * 100)),
          message: `Jours avec hydratation OK : ${daysWithGoodHydration} / ${dayRange}`,
          details: dayRange > daysWithGoodHydration ? `${dayRange - daysWithGoodHydration} jour${dayRange - daysWithGoodHydration > 1 ? 's' : ''} restant${dayRange - daysWithGoodHydration > 1 ? 's' : ''}` : null
        };
      }

      // Badges basés sur repas équilibrés
      if (badgeId.includes('balanced')) {
        const balancedNum = parseInt(badgeId.match(/(\d+)balanced/)?.[1] || badgeId.match(/(\d+)/)?.[1] || '0');
        let balancedCount = 0;
        userData.nutritionHistory?.forEach(day => {
          (day.meals || []).forEach(meal => {
            const foods = meal.foods || [];
            if (foods.length === 0) return;
            const total = foods.reduce((sum, f) => sum + (f.protein || 0) + (f.carbs || 0) + (f.fat || 0), 0);
            if (total === 0) return;
            const proteinPct = (foods.reduce((sum, f) => sum + (f.protein || 0), 0) / total) * 100;
            const carbsPct = (foods.reduce((sum, f) => sum + (f.carbs || 0), 0) / total) * 100;
            const fatPct = (foods.reduce((sum, f) => sum + (f.fat || 0), 0) / total) * 100;
            const deviation = Math.abs(proteinPct - 30) + Math.abs(carbsPct - 40) + Math.abs(fatPct - 30);
            if (deviation < 30) balancedCount++;
          });
        });
        const target = balancedNum || 10; // Default 10 si pas trouvé
        
        return {
          current: Math.min(balancedCount, target),
          target,
          percent: Math.min(100, Math.round((balancedCount / target) * 100)),
          message: `Repas équilibrés : ${balancedCount}`,
          details: target > balancedCount ? `${target - balancedCount} repas restant${target - balancedCount > 1 ? 's' : ''}` : null
        };
      }

      // Par défaut : essayer d'exécuter la condition pour voir si elle est vraie/fausse
      // Cela donne au moins une indication
      try {
        const conditionResult = badge.condition(userData);
        return {
          current: conditionResult ? 100 : 0,
          target: 100,
          percent: conditionResult ? 100 : 0,
          message: conditionResult ? 'Condition remplie !' : 'Condition non remplie',
          details: conditionResult ? 'Ce badge devrait être débloqué' : 'Continuez vos efforts !'
        };
      } catch (err) {
        // Si la condition échoue, on ne peut pas calculer
        return {
          current: 0,
          target: 100,
          percent: 0,
          message: 'Progression non calculable',
          details: 'Les données nécessaires ne sont pas disponibles'
        };
      }
    } catch (err) {
      return {
        current: 0,
        target: 100,
        percent: 0,
        message: 'Progression non calculable',
        details: 'Erreur lors du calcul de progression'
      };
    }
  }, [badge, isUnlocked, unlockedDate, userData]);

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'border-slate-500 bg-slate-500/10 text-slate-300';
      case 'rare': return 'border-blue-500 bg-blue-500/10 text-blue-300';
      case 'epic': return 'border-purple-500 bg-purple-500/10 text-purple-300';
      case 'legendary': return 'border-yellow-500 bg-yellow-500/10 text-yellow-300';
      default: return 'border-slate-500 bg-slate-500/10 text-slate-300';
    }
  };

  const getRarityLabel = (rarity) => {
    switch (rarity) {
      case 'common': return 'Commun';
      case 'rare': return 'Rare';
      case 'epic': return 'Épique';
      case 'legendary': return 'Légendaire';
      default: return 'Commun';
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'consistency': return 'Cohérence';
      case 'nutrition': return 'Nutrition';
      case 'progression': return 'Progression';
      case 'performance': return 'Performance';
      case 'habits': return 'Habitudes';
      case 'mastery': return 'Maîtrise';
      case 'discovery': return 'Découverte';
      case 'milestone': return 'Étape';
      case 'health': return 'Santé';
      case 'balance': return 'Équilibre';
      default: return category || 'Autre';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={null}
      size="md"
      variant="glass"
    >
      <div className="p-6 space-y-6">
        {/* Header avec icône badge en grand */}
        <div className="text-center space-y-4">
          <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-4 ${getRarityColor(badge.rarity)} ${
            !isUnlocked ? 'opacity-50 grayscale' : ''
          }`}>
            <span className="text-6xl">{badge.icon}</span>
          </div>
          
          <div>
            <h2 className={`text-2xl font-bold mb-2 ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
              {badge.name}
            </h2>
            {isUnlocked && (
              <div className="flex items-center justify-center gap-2 text-green-400">
                <CheckCircle size={18} />
                <span className="text-sm font-medium">Débloqué</span>
              </div>
            )}
            {!isUnlocked && (
              <div className="flex items-center justify-center gap-2 text-slate-500">
                <Lock size={18} />
                <span className="text-sm font-medium">Non débloqué</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-300 text-sm leading-relaxed">
            {badge.description}
          </p>
        </div>

        {/* Informations badge */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <Award size={16} className="text-purple-400" />
              <span className="text-xs text-slate-400">Rareté</span>
            </div>
            <div className={`text-sm font-medium ${getRarityColor(badge.rarity)}`}>
              {getRarityLabel(badge.rarity)}
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <Star size={16} className="text-yellow-400" />
              <span className="text-xs text-slate-400">Points XP</span>
            </div>
            <div className="text-sm font-medium text-yellow-400">
              +{badge.points} XP
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <Target size={16} className="text-green-400" />
              <span className="text-xs text-slate-400">Catégorie</span>
            </div>
            <div className="text-sm font-medium text-green-400">
              {getCategoryLabel(badge.category)}
            </div>
          </div>

          {isUnlocked && unlockedDate && (
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={16} className="text-blue-400" />
                <span className="text-xs text-slate-400">Date</span>
              </div>
              <div className="text-sm font-medium text-blue-400">
                {new Date(unlockedDate).toLocaleDateString('fr-FR')}
              </div>
            </div>
          )}
        </div>

        {/* Progression (si non débloqué) */}
        {!isUnlocked && (
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-400" />
                <span className="text-white font-semibold">Progression</span>
              </div>
              <span className="text-blue-400 font-bold text-lg">
                {progress.percent}%
              </span>
            </div>

            {progress.current !== undefined && progress.target !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{progress.current} / {progress.target}</span>
                  <span>{progress.message}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      progress.percent >= 100
                        ? 'bg-green-500'
                        : progress.percent >= 50
                        ? 'bg-blue-500'
                        : 'bg-slate-500'
                    }`}
                    style={{ width: `${Math.min(100, progress.percent)}%` }}
                  />
                </div>
                {progress.details && (
                  <p className="text-xs text-slate-400 mt-1">
                    {progress.details}
                  </p>
                )}
              </div>
            )}

            {progress.current === undefined && (
              <p className="text-sm text-slate-400 text-center py-2">
                {progress.message}
              </p>
            )}
          </div>
        )}

        {/* Message de motivation si débloqué */}
        {isUnlocked && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-400">
              <Trophy size={18} />
              <span className="font-semibold">Félicitations !</span>
            </div>
            <p className="text-sm text-green-300 mt-1">
              Vous avez débloqué ce badge. Continuez vos efforts pour débloquer d'autres badges !
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BadgeDetailModal;

