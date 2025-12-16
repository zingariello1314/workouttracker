/**
 * MetricsPanel Component
 * 
 * Panneau affichant les métriques principales de lecture sous forme de cartes.
 * Inclut les statistiques de base, vitesse de lecture, progression et objectifs.
 * 
 * @see Requirements 7.1, 7.2, 7.3
 */

import React from 'react';
import { BookOpen, Clock, Target, TrendingUp, Calendar, Award } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { useTranslation } from '../../../../utils/translations';

const MetricCard = ({ icon: Icon, title, value, subtitle, trend, color = 'purple' }) => {
  const colorClasses = {
    purple: 'text-purple-300 bg-purple-500/10 border-purple-500/20',
    blue: 'text-blue-300 bg-blue-500/10 border-blue-500/20',
    green: 'text-green-300 bg-green-500/10 border-green-500/20',
    orange: 'text-orange-300 bg-orange-500/10 border-orange-500/20',
    red: 'text-red-300 bg-red-500/10 border-red-500/20',
    slate: 'text-slate-300 bg-slate-500/10 border-slate-500/20'
  };

  return (
    <Card variant="glass" className={`border ${colorClasses[color]}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${colorClasses[color].split(' ')[0]}`} />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                {title}
              </span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {value}
            </div>
            {subtitle && (
              <div className="text-xs text-slate-400">
                {subtitle}
              </div>
            )}
          </div>
          {trend && (
            <div className={`text-xs px-2 py-1 rounded-full ${
              trend.type === 'positive' 
                ? 'bg-green-500/20 text-green-300' 
                : trend.type === 'negative'
                ? 'bg-red-500/20 text-red-300'
                : 'bg-slate-500/20 text-slate-300'
            }`}>
              {trend.value}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const MetricsPanel = ({ statisticsData, selectedPeriod }) => {
  const t = useTranslation();

  if (!statisticsData || !statisticsData.hasData) {
    return (
      <div className="space-y-4">
        <Card variant="glass">
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400">
              {t('books.statistics.metrics.noData', 'Aucune métrique disponible')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { metrics } = statisticsData;

  // Calculer les tendances (placeholder - sera implémenté avec les données historiques)
  const getTrend = (current, previous) => {
    if (!previous || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return {
      type: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
      value: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
    };
  };

  // Formater la durée en heures et minutes
  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  // Formater la vitesse de lecture
  const formatSpeed = (pagesPerHour) => {
    return `${pagesPerHour.toFixed(1)} p/h`;
  };

  return (
    <div className="space-y-4">
      {/* Métriques de base */}
      <MetricCard
        icon={BookOpen}
        title={t('books.statistics.metrics.totalPages', 'Pages lues')}
        value={metrics.totalPages.toLocaleString()}
        subtitle={`${metrics.booksCompleted} livre(s) terminé(s)`}
        color="purple"
      />

      <MetricCard
        icon={Clock}
        title={t('books.statistics.metrics.totalTime', 'Temps de lecture')}
        value={formatDuration(metrics.totalTime)}
        subtitle={`${metrics.sessionsCount} session(s)`}
        color="blue"
      />

      <MetricCard
        icon={TrendingUp}
        title={t('books.statistics.metrics.averageSpeed', 'Vitesse moyenne')}
        value={formatSpeed(metrics.averageSpeed)}
        subtitle={`${metrics.averageSessionDuration.toFixed(1)}min/session`}
        color="green"
      />

      {/* Régularité et streaks */}
      <MetricCard
        icon={Calendar}
        title={t('books.statistics.metrics.currentStreak', 'Série actuelle')}
        value={`${metrics.currentStreak} jour(s)`}
        subtitle={`Record: ${metrics.longestStreak} jour(s)`}
        color="orange"
      />

      <MetricCard
        icon={Award}
        title={t('books.statistics.metrics.frequency', 'Fréquence')}
        value={`${metrics.readingFrequency.toFixed(1)}/sem`}
        subtitle="Sessions par semaine"
        color="slate"
      />

      {/* Objectifs (si définis) */}
      {metrics.dailyGoal && (
        <Card variant="glass" className="border border-yellow-500/20">
          <CardHeader>
            <CardTitle size="sm" className="flex items-center gap-2 text-yellow-300">
              <Target className="w-4 h-4" />
              {t('books.statistics.metrics.dailyGoal', 'Objectif quotidien')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Aujourd'hui</span>
                <span className="text-white font-medium">
                  {metrics.todayProgress || 0} / {metrics.dailyGoal} min
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(100, ((metrics.todayProgress || 0) / metrics.dailyGoal) * 100)}%` 
                  }}
                />
              </div>
              <div className="text-xs text-slate-400">
                {((metrics.todayProgress || 0) / metrics.dailyGoal * 100).toFixed(1)}% complété
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MetricsPanel;