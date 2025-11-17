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

import React, { useState, useEffect, useMemo, memo } from 'react';
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
  CheckCircle,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { useNutritionGamification } from '../../../../hooks/useNutritionGamification';
import { ALL_BADGES } from '../../../../services/nutrition/badges';
import BadgeDetailView from './BadgeDetailView';
import VirtualizedBadgeGrid from './VirtualizedBadgeGrid';

// ✅ OPTIMISATION 3.1 : Extraire fonctions constantes en dehors du composant
const getRarityColor = (rarity) => {
  switch (rarity) {
    case 'common': return 'border-slate-500 bg-slate-500/10';
    case 'rare': return 'border-blue-500 bg-blue-500/10';
    case 'epic': return 'border-purple-500 bg-purple-500/10';
    case 'legendary': return 'border-yellow-500 bg-yellow-500/10';
    default: return 'border-slate-500 bg-slate-500/10';
  }
};

const getCategoryIcon = (category) => {
  switch (category) {
    case 'consistency': return <Flame size={20} className="text-orange-400" />;
    case 'nutrition': return <Target size={20} className="text-green-400" />;
    case 'progression': return <TrendingUp size={20} className="text-blue-400" />;
    case 'performance': return <Zap size={20} className="text-yellow-400" />;
    default: return <Award size={20} className="text-slate-400" />;
  }
};

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
    checkBadges,
    userData // Ajout de userData pour calculer progression badges
  } = useNutritionGamification({ enabled: true, autoCheck: true });

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'badges' | 'progress'
  const [selectedBadge, setSelectedBadge] = useState(null); // Badge sélectionné pour vue détail (null = liste, badge object = vue détail)

  // ✅ OPTIMISATION 1.5 : getLevelProgress est maintenant une valeur, pas une fonction
  const levelProgress = getLevelProgress;
  
  // ✅ OPTIMISATION 3.2 : useMemo pour badges triés par date
  const sortedAchievements = useMemo(() => {
    return [...achievements].sort((a, b) => {
      // Comparer strings ISO directement (plus rapide que new Date())
      const dateA = a.unlockedDate || '';
      const dateB = b.unlockedDate || '';
      return dateB.localeCompare(dateA);
    });
  }, [achievements]);
  
  // ✅ OPTIMISATION 3.2 : useMemo pour badges récents (4 premiers)
  const recentBadges = useMemo(() => {
    return sortedAchievements.slice(0, 4);
  }, [sortedAchievements]);
  
  // ✅ OPTIMISATION 3.3 : Pré-formater dates des badges
  const achievementsWithFormattedDates = useMemo(() => {
    return sortedAchievements.map(badge => ({
      ...badge,
      formattedDate: badge.unlockedDate 
        ? new Date(badge.unlockedDate).toLocaleDateString('fr-FR')
        : ''
    }));
  }, [sortedAchievements]);

  // ✅ Afficher tous les badges : débloqués en couleur, non débloqués grisés
  const unlockedBadgeIds = useMemo(() => {
    return new Set(achievements.map(b => b.id));
  }, [achievements]);

  // Combiner tous les badges avec leur statut débloqué/non débloqué
  const allBadgesWithStatus = useMemo(() => {
    return ALL_BADGES.map(badge => {
      const isUnlocked = unlockedBadgeIds.has(badge.id);
      const unlockedBadge = isUnlocked ? achievements.find(a => a.id === badge.id) : null;
      
      return {
        ...badge,
        isUnlocked,
        unlockedDate: unlockedBadge?.unlockedDate || null,
        formattedDate: unlockedBadge?.unlockedDate 
          ? new Date(unlockedBadge.unlockedDate).toLocaleDateString('fr-FR')
          : null
      };
    });
  }, [achievements, unlockedBadgeIds]);

  // Trier tous les badges : débloqués en premier, puis non débloqués
  const sortedAllBadges = useMemo(() => {
    return [...allBadgesWithStatus].sort((a, b) => {
      // D'abord par statut (débloqués en premier)
      if (a.isUnlocked !== b.isUnlocked) {
        return b.isUnlocked ? 1 : -1; // true (débloqué) avant false (non débloqué)
      }
      // Ensuite par date de débloquage (plus récent en premier pour les débloqués)
      if (a.isUnlocked && b.isUnlocked) {
        const dateA = a.unlockedDate || '';
        const dateB = b.unlockedDate || '';
        return dateB.localeCompare(dateA);
      }
      // Pour les non débloqués, trier par rareté (legendary > epic > rare > common)
      const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
      return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
    });
  }, [allBadgesWithStatus]);

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

  const nutritionStreak = streaks?.nutrition || { current: 0, actual: 0, forgivenessUsed: 0 };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Trophy size={20} className="text-yellow-400" /> Gamification
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        {/* Vue détail badge (remplit le Card) */}
        {selectedBadge ? (
          <BadgeDetailView
            badge={selectedBadge}
            isUnlocked={selectedBadge.isUnlocked}
            unlockedDate={selectedBadge.unlockedDate}
            userData={userData}
            onBack={() => setSelectedBadge(null)}
          />
        ) : (
          <>
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
                      className={`rounded-lg p-3 border ${getRarityColor(badge.rarity)} cursor-pointer hover:scale-105 transition-transform`}
                      onClick={() => {
                        const fullBadge = allBadgesWithStatus.find(b => b.id === badge.id);
                        if (fullBadge) setSelectedBadge(fullBadge);
                      }}
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
                Badges ({achievements.length}/{ALL_BADGES.length})
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
                {recentBadges.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Award size={18} className="text-purple-400" /> Badges récents
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {recentBadges.map(badge => (
                        <div
                          key={badge.id}
                          className={`rounded-lg p-3 border ${getRarityColor(badge.rarity)} text-center cursor-pointer hover:scale-105 transition-transform`}
                          onClick={() => {
                            const fullBadge = allBadgesWithStatus.find(b => b.id === badge.id);
                            if (fullBadge) setSelectedBadge(fullBadge);
                          }}
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
                {/* Statistiques badges */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-slate-400">
                    {achievements.length} / {ALL_BADGES.length} badges débloqués
                  </div>
                  <div className="text-xs text-slate-500">
                    {Math.round((achievements.length / ALL_BADGES.length) * 100)}% complété
                  </div>
                </div>

                {/* Tous les badges : débloqués en couleur, non débloqués grisés */}
                {/* ✅ OPTIMISATION Phase 11.2 : Virtual scrolling si > 20 badges (réduction 80-90% éléments DOM) */}
                {sortedAllBadges.length > 20 ? (
                  <div className="w-full">
                    <VirtualizedBadgeGrid
                      badges={sortedAllBadges}
                      onBadgeClick={setSelectedBadge}
                      getRarityColor={getRarityColor}
                      height={600}
                      itemHeight={200}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {sortedAllBadges.map(badge => {
                      const isUnlocked = badge.isUnlocked;
                      const baseClasses = `rounded-lg p-4 border transition-all relative ${
                        isUnlocked 
                          ? `${getRarityColor(badge.rarity)} hover:scale-105 cursor-pointer` 
                          : 'border-slate-700 bg-slate-900/30 opacity-50 cursor-pointer hover:opacity-70'
                      }`;
                      
                      return (
                        <div
                          key={badge.id}
                          className={baseClasses}
                          title={isUnlocked ? badge.name : `${badge.name} - Non débloqué`}
                          onClick={() => setSelectedBadge(badge)}
                        >
                          {/* Badge de verrouillage pour non débloqués */}
                          {!isUnlocked && (
                            <div className="absolute top-2 right-2">
                              <Lock size={16} className="text-slate-600" />
                            </div>
                          )}
                          
                          <div className="flex items-start justify-between mb-2">
                            <div className={`text-3xl ${isUnlocked ? '' : 'grayscale'}`}>
                              {badge.icon}
                            </div>
                            <div className={`text-xs px-2 py-0.5 rounded ${
                              isUnlocked
                                ? (badge.rarity === 'common' ? 'bg-slate-500 text-white' :
                                   badge.rarity === 'rare' ? 'bg-blue-500 text-white' :
                                   badge.rarity === 'epic' ? 'bg-purple-500 text-white' :
                                   'bg-yellow-500 text-white')
                                : 'bg-slate-700 text-slate-400'
                            }`}>
                              {badge.rarity}
                            </div>
                          </div>
                          <div className={`text-sm font-medium mb-1 ${
                            isUnlocked ? 'text-white' : 'text-slate-500'
                          }`}>
                            {badge.name}
                          </div>
                          <div className={`text-xs mb-2 ${
                            isUnlocked ? 'text-slate-400' : 'text-slate-600'
                          }`}>
                            {badge.description}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className={`text-xs ${
                              isUnlocked ? 'text-slate-500' : 'text-slate-700'
                            }`}>
                              {badge.formattedDate || 'Non débloqué'}
                            </div>
                            <div className={`text-xs ${
                              isUnlocked ? 'text-yellow-400' : 'text-slate-600'
                            }`}>
                              +{badge.points} XP
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
          </>
        )}
      </CardContent>
    </Card>
  );
};

// ✅ OPTIMISATION 3.4 : React.memo pour éviter re-renders inutiles
export default memo(NutritionGamification);

