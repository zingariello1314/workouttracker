/**
 * NutritionGamification - Composant Affichage Gamification
 * 
 * Affiche :
 * - Badges débloqués et en progression
 * - XP & Niveau avec barre de progression
 * - Streaks avec forgiveness
 * 
 * @module components/tabs/nutrition/components/NutritionGamification
 */

import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import Button from '../../../ui/Button';
import { 
  Trophy, 
  Award, 
  TrendingUp,
  Flame,
  Star,
  Target,
  Zap,
  Info,
  XCircle,
  CheckCircle
} from 'lucide-react';
import { useNutritionGamification } from '../../../../hooks/useNutritionGamification';

const NutritionGamification = () => {
  const {
    achievements,
    experience,
    streaks,
    loading,
    error,
    enabled,
    newBadges,
    getLevelProgress,
    checkBadges
  } = useNutritionGamification({ enabled: true, autoCheck: true });

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'badges' | 'progress'

  // Couleur selon rareté
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'border-slate-500 bg-slate-500/10';
      case 'rare': return 'border-blue-500 bg-blue-500/10';
      case 'epic': return 'border-purple-500 bg-purple-500/10';
      case 'legendary': return 'border-yellow-500 bg-yellow-500/10';
      default: return 'border-slate-500 bg-slate-500/10';
    }
  };

  // Icône selon catégorie
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'consistency': return <Flame size={20} className="text-orange-400" />;
      case 'nutrition': return <Target size={20} className="text-green-400" />;
      case 'progression': return <TrendingUp size={20} className="text-blue-400" />;
      case 'performance': return <Zap size={20} className="text-yellow-400" />;
      default: return <Award size={20} className="text-slate-400" />;
    }
  };

  if (!enabled) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="text-center py-8">
          <Info size={48} className="text-slate-400 mx-auto mb-4" />
          <p className="text-slate-300 mb-2">Gamification désactivée</p>
          <p className="text-slate-400 text-sm">
            Activez-la dans les paramètres pour voir vos badges, XP et streaks.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-400 mt-4">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="text-center py-8">
          <XCircle size={48} className="text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-2">Erreur lors du chargement</p>
          <Button onClick={checkBadges} variant="outline" className="mt-4">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  const levelProgress = getLevelProgress;
  const nutritionStreak = streaks?.nutrition || { current: 0, actual: 0, forgivenessUsed: 0 };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Trophy size={20} className="text-yellow-400" /> Gamification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notifications nouveaux badges */}
        {newBadges.length > 0 && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={20} className="text-green-400" />
              <h3 className="text-green-400 font-semibold">Nouveaux badges débloqués !</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {newBadges.map(badge => (
                <div
                  key={badge.id}
                  className={`rounded-lg p-3 border ${getRarityColor(badge.rarity)}`}
                >
                  <div className="text-2xl mb-1">{badge.icon}</div>
                  <div className="text-sm font-medium text-white">{badge.name}</div>
                  <div className="text-xs text-slate-400">+{badge.points} XP</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vue d'ensemble */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* XP & Niveau */}
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star size={18} className="text-yellow-400" />
                <span className="text-slate-400 text-sm">Niveau</span>
              </div>
              <span className="text-2xl font-bold text-white">{levelProgress.level}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">XP</span>
                <span className="text-white font-medium">
                  {levelProgress.currentXP} / {levelProgress.xpForNextLevel}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all"
                  style={{ width: `${levelProgress.progressPercent}%` }}
                />
              </div>
              <div className="text-xs text-slate-500">
                {levelProgress.xpNeeded} XP jusqu'au niveau {levelProgress.level + 1}
              </div>
            </div>
          </div>

          {/* Streak */}
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-orange-400" />
                <span className="text-slate-400 text-sm">Série</span>
              </div>
              <span className="text-2xl font-bold text-orange-400">
                {nutritionStreak.current}
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-slate-400">
                {nutritionStreak.status === 'maintenance' 
                  ? 'Mode entretien' 
                  : 'Jours consécutifs'}
              </div>
              {nutritionStreak.forgivenessUsed > 0 && (
                <div className="text-xs text-blue-400">
                  {nutritionStreak.forgivenessUsed} jour{nutritionStreak.forgivenessUsed > 1 ? 's' : ''} pardonné{nutritionStreak.forgivenessUsed > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-purple-400" />
                <span className="text-slate-400 text-sm">Badges</span>
              </div>
              <span className="text-2xl font-bold text-purple-400">
                {achievements.length}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {achievements.length > 0 
                ? `${achievements.length} badge${achievements.length > 1 ? 's' : ''} débloqué${achievements.length > 1 ? 's' : ''}`
                : 'Aucun badge débloqué'}
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex gap-2 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'badges'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Badges ({achievements.length})
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'progress'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Progression
          </button>
        </div>

        {/* Contenu onglets */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Badges récents */}
            {achievements.length > 0 && (
              <div>
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Award size={18} className="text-purple-400" /> Badges récents
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {achievements
                    .sort((a, b) => new Date(b.unlockedDate) - new Date(a.unlockedDate))
                    .slice(0, 4)
                    .map(badge => (
                      <div
                        key={badge.id}
                        className={`rounded-lg p-3 border ${getRarityColor(badge.rarity)} text-center`}
                      >
                        <div className="text-3xl mb-2">{badge.icon}</div>
                        <div className="text-xs font-medium text-white mb-1">{badge.name}</div>
                        <div className="text-xs text-slate-400">{badge.category}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Statistiques */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">XP Total</div>
                <div className="text-lg font-bold text-white">{levelProgress.currentXP}</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Streak Réelle</div>
                <div className="text-lg font-bold text-white">
                  {nutritionStreak.actual} jour{nutritionStreak.actual > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="space-y-4">
            {achievements.length === 0 ? (
              <div className="text-center py-8">
                <Award size={48} className="text-slate-400 mx-auto mb-4" />
                <p className="text-slate-300 mb-2">Aucun badge débloqué</p>
                <p className="text-slate-400 text-sm">
                  Continuez à utiliser l'application pour débloquer vos premiers badges !
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {achievements
                  .sort((a, b) => new Date(b.unlockedDate) - new Date(a.unlockedDate))
                  .map(badge => (
                    <div
                      key={badge.id}
                      className={`rounded-lg p-4 border ${getRarityColor(badge.rarity)} transition-all hover:scale-105`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-3xl">{badge.icon}</div>
                        <div className={`text-xs px-2 py-0.5 rounded ${
                          badge.rarity === 'common' ? 'bg-slate-500 text-white' :
                          badge.rarity === 'rare' ? 'bg-blue-500 text-white' :
                          badge.rarity === 'epic' ? 'bg-purple-500 text-white' :
                          'bg-yellow-500 text-white'
                        }`}>
                          {badge.rarity}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-white mb-1">{badge.name}</div>
                      <div className="text-xs text-slate-400 mb-2">{badge.description}</div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                          {badge.unlockedDate && new Date(badge.unlockedDate).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-xs text-yellow-400">+{badge.points} XP</div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-4">
            {/* Progression niveau */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Star size={18} className="text-yellow-400" /> Progression Niveau
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Niveau {levelProgress.level}</span>
                  <span className="text-slate-300">
                    {levelProgress.currentXP} / {levelProgress.xpForNextLevel} XP
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-3 rounded-full transition-all"
                    style={{ width: `${levelProgress.progressPercent}%` }}
                  />
                </div>
                <div className="text-sm text-slate-400">
                  {levelProgress.xpNeeded} XP nécessaires pour le niveau {levelProgress.level + 1}
                </div>
              </div>
            </div>

            {/* Streak détaillé */}
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Flame size={18} className="text-orange-400" /> Série Nutrition
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Affichée</span>
                  <span className="text-2xl font-bold text-orange-400">
                    {nutritionStreak.current} jour{nutritionStreak.current > 1 ? 's' : ''}
                  </span>
                </div>
                {nutritionStreak.actual > nutritionStreak.current && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Réelle</span>
                    <span className="text-lg font-medium text-slate-400">
                      {nutritionStreak.actual} jour{nutritionStreak.actual > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {nutritionStreak.forgivenessUsed > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Jours pardonnes</span>
                    <span className="text-sm text-blue-400">
                      {nutritionStreak.forgivenessUsed} / 2
                    </span>
                  </div>
                )}
                {nutritionStreak.status === 'maintenance' && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2 mt-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-blue-400" />
                      <span className="text-sm text-blue-400">
                        Mode entretien activé (série ≥ 30 jours)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NutritionGamification;

