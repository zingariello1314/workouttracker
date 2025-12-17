/**
 * GoalsProgressChart Component
 * 
 * Système complet de suivi des objectifs de lecture avec:
 * 1. Interface de définition d'objectifs (quotidiens, hebdomadaires, mensuels)
 * 2. Barres de progression avec pourcentages en temps réel
 * 3. Célébrations visuelles lors d'atteinte d'objectifs
 * 4. Historique des objectifs atteints/manqués
 * 
 * Features:
 * - Création/modification/suppression d'objectifs
 * - Calcul automatique de la progression
 * - Notifications et célébrations
 * - Graphiques de tendance des objectifs
 * 
 * @see Requirements 6.1, 6.2, 6.3
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Target, Plus, Edit3, Trash2, Trophy, Calendar, Clock, BookOpen, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import Button from '../../../../ui/Button';
import { Input, Select } from '../../../../ui/Input';
import Card, { CardHeader, CardTitle, CardContent } from '../../../../ui/Card';
import { useTranslation } from '../../../../../utils/translations';

/**
 * Types d'objectifs supportés
 */
const GOAL_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly', 
  MONTHLY: 'monthly'
};

/**
 * Unités de mesure pour les objectifs
 */
const GOAL_UNITS = {
  PAGES: 'pages',
  MINUTES: 'minutes',
  BOOKS: 'books'
};

/**
 * Configuration des types d'objectifs
 */
const GOAL_TYPE_CONFIGS = {
  [GOAL_TYPES.DAILY]: {
    label: 'Quotidien',
    icon: Calendar,
    color: '#8B5CF6',
    defaultTarget: 20,
    period: 1
  },
  [GOAL_TYPES.WEEKLY]: {
    label: 'Hebdomadaire', 
    icon: Clock,
    color: '#06B6D4',
    defaultTarget: 150,
    period: 7
  },
  [GOAL_TYPES.MONTHLY]: {
    label: 'Mensuel',
    icon: BookOpen,
    color: '#10B981',
    defaultTarget: 600,
    period: 30
  }
};

/**
 * Configuration des unités
 */
const UNIT_CONFIGS = {
  [GOAL_UNITS.PAGES]: {
    label: 'Pages',
    icon: BookOpen,
    suffix: 'p'
  },
  [GOAL_UNITS.MINUTES]: {
    label: 'Minutes',
    icon: Clock,
    suffix: 'min'
  },
  [GOAL_UNITS.BOOKS]: {
    label: 'Livres',
    icon: Target,
    suffix: 'livres'
  }
};

const GoalsProgressChart = ({ 
  books = [], 
  statisticsData, 
  selectedPeriod, 
  filters 
}) => {
  const t = useTranslation();
  
  // État local
  const [goals, setGoals] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [celebrationGoal, setCelebrationGoal] = useState(null);
  const [activeView, setActiveView] = useState('current'); // 'current', 'history', 'trends'

  // Formulaire de création/édition
  const [formData, setFormData] = useState({
    type: GOAL_TYPES.DAILY,
    unit: GOAL_UNITS.PAGES,
    target: 20,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isActive: true
  });

  // Charger les objectifs depuis le localStorage au montage
  useEffect(() => {
    const savedGoals = localStorage.getItem('reading-goals');
    if (savedGoals) {
      try {
        setGoals(JSON.parse(savedGoals));
      } catch (error) {
        console.error('Erreur lors du chargement des objectifs:', error);
      }
    }
  }, []);

  // Sauvegarder les objectifs dans le localStorage
  useEffect(() => {
    localStorage.setItem('reading-goals', JSON.stringify(goals));
  }, [goals]);

  // Calculer la progression des objectifs
  const goalsProgress = useMemo(() => {
    if (!statisticsData?.sessions || goals.length === 0) {
      return [];
    }

    const now = new Date();
    
    return goals.map(goal => {
      const startDate = new Date(goal.startDate);
      const endDate = goal.endDate ? new Date(goal.endDate) : null;
      
      // Déterminer la période de calcul selon le type d'objectif
      let periodStart, periodEnd;
      
      if (goal.type === GOAL_TYPES.DAILY) {
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 1);
      } else if (goal.type === GOAL_TYPES.WEEKLY) {
        const dayOfWeek = now.getDay();
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - dayOfWeek);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 7);
      } else { // MONTHLY
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      }

      // Filtrer les sessions dans la période
      const periodSessions = statisticsData.sessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= periodStart && sessionDate < periodEnd &&
               sessionDate >= startDate && 
               (!endDate || sessionDate <= endDate);
      });

      // Calculer la progression selon l'unité
      let current = 0;
      if (goal.unit === GOAL_UNITS.PAGES) {
        current = periodSessions.reduce((sum, session) => sum + session.pagesRead, 0);
      } else if (goal.unit === GOAL_UNITS.MINUTES) {
        current = periodSessions.reduce((sum, session) => sum + session.durationMinutes, 0);
      } else if (goal.unit === GOAL_UNITS.BOOKS) {
        // Compter les livres terminés dans la période
        const completedBooks = new Set();
        periodSessions.forEach(session => {
          const book = books.find(b => b.id === session.bookId);
          if (book && book.status === 'completed') {
            completedBooks.add(session.bookId);
          }
        });
        current = completedBooks.size;
      }

      const percentage = goal.target > 0 ? (current / goal.target) * 100 : 0;
      const isCompleted = percentage >= 100;
      
      // Calculer les jours restants dans la période
      const daysRemaining = Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24));
      
      return {
        ...goal,
        current,
        percentage: Math.min(percentage, 100),
        isCompleted,
        periodStart,
        periodEnd,
        daysRemaining: Math.max(0, daysRemaining),
        sessionsCount: periodSessions.length
      };
    });
  }, [goals, statisticsData, books]);

  // Calculer l'historique des objectifs
  const goalsHistory = useMemo(() => {
    // Simuler un historique sur les 30 derniers jours
    const history = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Pour chaque objectif quotidien, calculer s'il a été atteint ce jour-là
      const dayGoals = goals.filter(g => g.type === GOAL_TYPES.DAILY && g.isActive);
      
      let achieved = 0;
      let total = dayGoals.length;
      
      dayGoals.forEach(goal => {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        
        const daySessions = statisticsData?.sessions?.filter(session => {
          const sessionDate = new Date(session.date);
          return sessionDate >= dayStart && sessionDate < dayEnd;
        }) || [];
        
        let dayProgress = 0;
        if (goal.unit === GOAL_UNITS.PAGES) {
          dayProgress = daySessions.reduce((sum, session) => sum + session.pagesRead, 0);
        } else if (goal.unit === GOAL_UNITS.MINUTES) {
          dayProgress = daySessions.reduce((sum, session) => sum + session.durationMinutes, 0);
        }
        
        if (dayProgress >= goal.target) {
          achieved++;
        }
      });
      
      history.push({
        date: date.toISOString().split('T')[0],
        achieved,
        total,
        percentage: total > 0 ? (achieved / total) * 100 : 0
      });
    }
    
    return history;
  }, [goals, statisticsData]);

  // Gestionnaires d'événements
  const handleCreateGoal = () => {
    const newGoal = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString()
    };
    
    setGoals(prev => [...prev, newGoal]);
    setShowCreateForm(false);
    resetForm();
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setFormData({
      type: goal.type,
      unit: goal.unit,
      target: goal.target,
      startDate: goal.startDate,
      endDate: goal.endDate || '',
      isActive: goal.isActive
    });
    setShowCreateForm(true);
  };

  const handleUpdateGoal = () => {
    setGoals(prev => prev.map(goal => 
      goal.id === editingGoal.id 
        ? { ...goal, ...formData }
        : goal
    ));
    setShowCreateForm(false);
    setEditingGoal(null);
    resetForm();
  };

  const handleDeleteGoal = (goalId) => {
    setGoals(prev => prev.filter(goal => goal.id !== goalId));
  };

  const resetForm = () => {
    setFormData({
      type: GOAL_TYPES.DAILY,
      unit: GOAL_UNITS.PAGES,
      target: 20,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      isActive: true
    });
  };

  // Effet pour les célébrations
  useEffect(() => {
    const newlyCompleted = goalsProgress.find(goal => 
      goal.isCompleted && !goal.celebrated
    );
    
    if (newlyCompleted) {
      setCelebrationGoal(newlyCompleted);
      // Marquer comme célébré
      setGoals(prev => prev.map(goal =>
        goal.id === newlyCompleted.id
          ? { ...goal, celebrated: true }
          : goal
      ));
      
      // Masquer la célébration après 3 secondes
      setTimeout(() => setCelebrationGoal(null), 3000);
    }
  }, [goalsProgress]);

  // Tooltip personnalisé pour l'historique
  const HistoryTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload[0]) return null;
    
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
        <div className="font-medium text-white mb-2">{label}</div>
        <div className="text-sm">
          <div className="text-slate-300">
            Objectifs atteints: {data.achieved}/{data.total}
          </div>
          <div className="text-slate-300">
            Taux de réussite: {data.percentage.toFixed(1)}%
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Célébration d'objectif atteint */}
      {celebrationGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-8 text-center max-w-md mx-4 animate-pulse">
            <Trophy className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              🎉 Objectif atteint ! 🎉
            </h3>
            <p className="text-white/90">
              Tu as atteint ton objectif {GOAL_TYPE_CONFIGS[celebrationGoal.type].label.toLowerCase()} de{' '}
              {celebrationGoal.target} {UNIT_CONFIGS[celebrationGoal.unit].suffix} !
            </p>
          </div>
        </div>
      )}

      {/* Header avec contrôles */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-purple-300" />
          <div>
            <h3 className="text-xl font-bold text-white">
              {t('books.statistics.goals.title', 'Objectifs de Lecture')}
            </h3>
            <p className="text-sm text-slate-400">
              {t('books.statistics.goals.subtitle', 'Définis et suis tes objectifs de lecture')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={activeView === 'current' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('current')}
          >
            Actuels
          </Button>
          <Button
            variant={activeView === 'history' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('history')}
          >
            Historique
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvel objectif
          </Button>
        </div>
      </div>

      {/* Formulaire de création/édition */}
      {showCreateForm && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle>
              {editingGoal ? 'Modifier l\'objectif' : 'Créer un nouvel objectif'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Type d'objectif
                </label>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                >
                  {Object.entries(GOAL_TYPE_CONFIGS).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Unité de mesure
                </label>
                <Select
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                >
                  {Object.entries(UNIT_CONFIGS).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Objectif ({UNIT_CONFIGS[formData.unit].suffix})
                </label>
                <Input
                  type="number"
                  value={formData.target}
                  onChange={(e) => setFormData(prev => ({ ...prev, target: parseInt(e.target.value) || 0 }))}
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Date de début
                </label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-slate-300">Objectif actif</span>
              </label>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingGoal(null);
                  resetForm();
                }}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={editingGoal ? handleUpdateGoal : handleCreateGoal}
              >
                {editingGoal ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contenu principal selon la vue active */}
      {activeView === 'current' ? (
        // Vue des objectifs actuels
        <div className="space-y-4">
          {goalsProgress.length === 0 ? (
            <Card variant="glass">
              <CardContent className="text-center py-12">
                <Target className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-300 mb-2">
                  Aucun objectif défini
                </h3>
                <p className="text-slate-400 mb-4">
                  Crée ton premier objectif de lecture pour commencer à suivre tes progrès.
                </p>
                <Button
                  variant="primary"
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Créer un objectif
                </Button>
              </CardContent>
            </Card>
          ) : (
            goalsProgress.map(goal => {
              const config = GOAL_TYPE_CONFIGS[goal.type];
              const unitConfig = UNIT_CONFIGS[goal.unit];
              const Icon = config.icon;
              
              return (
                <Card key={goal.id} variant="glass">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${config.color}20`, color: config.color }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">
                            Objectif {config.label}
                          </h4>
                          <p className="text-sm text-slate-400">
                            {goal.target} {unitConfig.suffix} par {config.label.toLowerCase()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {goal.isCompleted && (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditGoal(goal)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Barre de progression */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300">
                          {goal.current} / {goal.target} {unitConfig.suffix}
                        </span>
                        <span className="text-slate-300">
                          {goal.percentage.toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="w-full bg-slate-700 rounded-full h-3">
                        <div
                          className="h-3 rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${goal.percentage}%`,
                            backgroundColor: goal.isCompleted ? '#10B981' : config.color
                          }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>{goal.sessionsCount} sessions</span>
                        <span>
                          {goal.daysRemaining > 0 
                            ? `${goal.daysRemaining} jour${goal.daysRemaining > 1 ? 's' : ''} restant${goal.daysRemaining > 1 ? 's' : ''}`
                            : 'Période terminée'
                          }
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        // Vue historique
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Historique des objectifs (30 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={goalsHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    label={{ 
                      value: 'Taux de réussite (%)', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fill: '#9CA3AF' }
                    }}
                  />
                  <Tooltip content={<HistoryTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="percentage"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GoalsProgressChart;